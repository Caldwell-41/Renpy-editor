import copy
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contract import (PLAN, SCHEMA, Refused, RequestGuard, address_policy, build_request,
                      consume_owned, endpoint, parse_sse, require_budget, safe_error,
                      strict_json, validate_probe, validate_response)


def proposal(text="A quiet lantern glows."):
    return {"schema_version": 1, "operations": [
        {"type": "replace_text", "target": "synthetic-beat-1", "text": text}]}


def response(text=None, **overrides):
    value = {"model": "synthetic-model", "choices": [{"index": 0,
             "finish_reason": "stop", "message": {"role": "assistant",
             "content": json.dumps(proposal()) if text is None else text}}]}
    value.update(overrides)
    return json.dumps(value).encode()


def event(delta, finish=None, index=0, model="synthetic-model"):
    return "data: " + json.dumps({"model": model, "choices": [
        {"index": index, "delta": delta, "finish_reason": finish}]}, ensure_ascii=False) + "\r\n\r\n"


def stream(text=None):
    text = json.dumps(proposal("静かな湖 [name] {b}lantern{/b}"), ensure_ascii=False) if text is None else text
    return (": heartbeat\r\n\r\n" + event({"role": "assistant"}) +
            event({"reasoning_content": "not a proposal"}) +
            event({"content": text[:20]}) + event({"content": text[20:]}, "stop") +
            "data: [DONE]\r\n\r\n").encode()


class EndpointTests(unittest.TestCase):
    def test_normalizes_once_preserving_prefix(self):
        cases = {"https://EXAMPLE.com:443": "https://example.com/v1",
                 "https://example.com/proxy": "https://example.com/proxy/v1",
                 "https://example.com/proxy/v1/": "https://example.com/proxy/v1",
                 "http://[::1]:8888/": "http://[::1]:8888/v1"}
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(endpoint(raw)[0], expected)
                self.assertEqual(endpoint(expected)[0], expected)

    def test_credential_origin_canonical_and_port_sensitive(self):
        self.assertEqual(endpoint("https://example.com")[1], endpoint("https://example.com:443/prefix")[1])
        self.assertNotEqual(endpoint("https://example.com")[1], endpoint("https://example.com:8443")[1])

    def test_refuses_ambiguous_secret_or_unsafe_urls(self):
        for raw in ("http://name:secret@example.com", "https://example.com?key=fixture",
                    "https://example.com#fragment", "https://example.com/v1/v1",
                    "https://example.com/chat/completions", "https://example.com/v1/models",
                    "https://example.com/%2e", "https://example.com/../proxy",
                    "https://example.com/a//b", "file:///example", "http://example.com:0",
                    "https://example.com\\path", " https://example.com", "http://[bad]",
                    "http://example.com:99999", "http://example.com:"):
            with self.subTest(raw=raw), self.assertRaises(Refused):
                endpoint(raw)

    def test_http_address_classes_and_mixed_dns_refusal(self):
        address_policy("http", ["127.0.0.1", "::1", "::ffff:127.0.0.1"])
        address_policy("http", ["192.168.1.2", "10.0.0.2", "fd00::2"], True)
        for ips, opt in ((["192.168.1.2"], False), (["192.168.1.2", "8.8.8.8"], True),
                         (["0.0.0.0"], True), (["169.254.1.2"], True), (["224.0.0.1"], True),
                         (["100.64.0.1"], True), (["192.0.2.1"], True), ([], True),
                         (["::ffff:8.8.8.8"], True)):
            with self.subTest(ips=ips), self.assertRaises(Refused):
                address_policy("http", ips, opt)
        address_policy("https", ["8.8.8.8"])


class RequestTests(unittest.TestCase):
    def test_studio_tools_always_disabled_and_no_session(self):
        body = strict_json(build_request("unsloth_studio", "exact/model:Q4", PLAN["literal_input"]))
        self.assertEqual(body["model"], "exact/model:Q4")
        self.assertIs(body["enable_tools"], False)
        self.assertEqual(body["enabled_tools"], [])
        self.assertTrue({"session_id", "tools", "tool_choice", "Authorization"}.isdisjoint(body))
        self.assertEqual(body["response_format"]["json_schema"]["schema"], SCHEMA)
        self.assertIs(body["response_format"]["json_schema"]["strict"], True)

    def test_generic_has_no_studio_extensions_and_one_output_mapping(self):
        body = strict_json(build_request("openai_compatible", "model", "synthetic", output_field="max_completion_tokens"))
        self.assertEqual(body["max_completion_tokens"], 256)
        self.assertTrue({"max_tokens", "enable_tools", "enabled_tools", "enable_thinking", "tools"}.isdisjoint(body))

    def test_thinking_defaults_and_qualified_studio_mapping(self):
        for thinking, expected in (("default", None), ("on", True), ("off", False)):
            body = strict_json(build_request("unsloth_studio", "model", "synthetic", thinking=thinking))
            self.assertEqual(body.get("enable_thinking"), expected)
        with self.assertRaises(Refused):
            build_request("openai_compatible", "model", "synthetic", thinking="on")

    def test_tunnel_and_unqualified_mapping_reject_before_send(self):
        for kwargs in ({"stream": True, "tunnel": True}, {"output_field": "num_ctx"}, {"output": True}, {"output": 0}):
            with self.subTest(kwargs=kwargs), self.assertRaises(Refused):
                build_request("unsloth_studio", "model", "synthetic", **kwargs)

    def test_request_size_refuses_without_truncation(self):
        with patch.dict(PLAN, request_bytes_limit=64), self.assertRaises(Refused):
            build_request("unsloth_studio", "model", "synthetic")

    def test_context_budget_includes_margin_and_reserved_output(self):
        require_budget(100, 256, 484, 484)
        require_budget(2000, 256, 2456, 2456)
        for args in ((100, 256, 483, 484), (100, 256, 484, 483), (True, 256, 484, 484)):
            with self.subTest(args=args), self.assertRaises(Refused):
                require_budget(*args)

    def test_plan_cumulative_allowance_and_deadlines(self):
        probes = [p for p in PLAN["per_provider_probes"] if "phase" not in p]
        requests, generations = len(probes) * 2, sum(p["generation"] for p in probes) * 2
        self.assertEqual((requests, generations), (28, 20))
        self.assertLessEqual(requests, PLAN["maximum_http_requests"])
        self.assertLessEqual(generations, PLAN["maximum_generation_requests"])
        self.assertEqual(PLAN["generation_total_timeout_seconds"], 120)
        self.assertTrue(PLAN["require_full_deadline_remaining_before_send"])
        self.assertEqual(PLAN["maximum_live_seconds"], 1800)
        self.assertEqual(PLAN["automatic_retries"], 0)
        self.assertEqual(len({p["id"] for p in probes}), len(probes))
        studio = PLAN["per_provider_probes"]
        self.assertEqual((len(studio), sum(p["generation"] for p in studio)), (23, 17))
        self.assertEqual(len({p["id"] for p in studio}), len(studio))
        self.assertLessEqual(sum(p["generation"] for p in studio), PLAN["maximum_generation_requests"])


class ResponseTests(unittest.TestCase):
    def test_complete_single_schema_response_with_unknown_usage(self):
        self.assertEqual(validate_response(response(), "synthetic-model"), proposal())

    def test_reasoning_is_never_parsed_as_final(self):
        body = strict_json(response())
        body["choices"][0]["message"]["reasoning_content"] = json.dumps(proposal("wrong"))
        self.assertEqual(validate_response(json.dumps(body).encode(), "synthetic-model"), proposal())
        body["choices"][0]["message"]["content"] = None
        with self.assertRaises(Refused):
            validate_response(json.dumps(body).encode(), "synthetic-model")

    def test_protocol_failures_are_non_applicable(self):
        base = strict_json(response())
        cases = []
        for finish in (None, "length", "tool_calls", "unknown"):
            body = copy.deepcopy(base)
            body["choices"][0]["finish_reason"] = finish
            cases.append(body)
        for field, val in (("tool_calls", [{"name": "fixture"}]), ("refusal", "refused"), ("content", "")):
            body = copy.deepcopy(base)
            body["choices"][0]["message"][field] = val
            cases.append(body)
        cases += [{**base, "model": "substituted"}, {**base, "choices": base["choices"] * 2}]
        for body in cases:
            with self.subTest(body=body), self.assertRaises(Refused):
                validate_response(json.dumps(body).encode(), "synthetic-model")

    def test_complete_document_duplicate_nonfinite_depth_and_size_rejection(self):
        for raw in ('{"a":1,"a":2}', '{"n":NaN}', '{"n":Infinity}', '{} {}',
                    '```json\n{}\n```', b'"\xff"', '"\\ud800"', '[' * 34 + '0' + ']' * 34):
            with self.subTest(raw=raw), self.assertRaises(Refused):
                strict_json(raw)
        with self.assertRaises(Refused):
            strict_json('"large"', limit=4)

    def test_exponent_overflow_refuses_scalar_nested_and_response_metadata(self):
        for number in ("1e999", "-1e999"):
            for raw in (number, '{"ignored":{"nested":[' + number + ']}}',
                        response().decode().replace('"choices":',
                            '"usage":{"completion_tokens":' + number + '},"choices":')):
                with self.subTest(raw=raw), self.assertRaisesRegex(Refused, "^invalid_json$"):
                    strict_json(raw)
            raw = response().decode().replace('"choices":',
                '"usage":{"completion_tokens":' + number + '},"choices":')
            with self.assertRaisesRegex(Refused, "^invalid_json$"):
                validate_response(raw.encode(), "synthetic-model")

    def test_finite_exponents_and_literal_overflow_text_still_parse(self):
        self.assertEqual(strict_json('{"values":[1e308,-1e308,1.25,0]}'),
                         {"values": [1e308, -1e308, 1.25, 0]})
        self.assertEqual(validate_response(response(json.dumps(proposal("Literal 1e999."))),
                                           "synthetic-model"), proposal("Literal 1e999."))

    def test_schema_scope_and_operation_count_refuse(self):
        bad = [proposal(), proposal(), proposal(), proposal(), proposal()]
        bad[0]["schema_version"] = True
        bad[1]["operations"][0]["path"] = "game/script.rpy"
        bad[2]["operations"][0]["target"] = "another-beat"
        bad[3]["operations"] *= 257
        bad[4]["approval"] = True
        for value in bad:
            with self.subTest(value=value), self.assertRaises(Refused):
                validate_probe(json.dumps(value))

    def test_literal_syntax_remains_inert_data_at_wire_boundary(self):
        text = '[name] [harmless_fixture()] {a=fixture}link{/a} {b}lamp{/b}'
        self.assertEqual(validate_probe(json.dumps(proposal(text)))["operations"][0]["text"], text)

    def test_protected_tokens_exact_once_in_order(self):
        tokens = ("__LL_TOKEN_0__", "__LL_TOKEN_1__")
        validate_probe(json.dumps(proposal(PLAN["protected_input"])), tokens)
        for text in ("missing", "__LL_TOKEN_1__ __LL_TOKEN_0__", "__LL_TOKEN_0__ __LL_TOKEN_0__ __LL_TOKEN_1__",
                     "__LL_TOKEN_0__ __LL_TOKEN_2__", "__LL_TOKEN_broken"):
            with self.subTest(text=text), self.assertRaises(Refused):
                validate_probe(json.dumps(proposal(text)), tokens)

    def test_diagnostics_never_reflect_error_content(self):
        marker = b'fixture-secret-value /private-project synthetic-provider-error'
        for status, category in ((401, "authentication"), (403, "authentication"),
                                 (429, "busy_or_rate_limited"), (302, "redirect_refused"),
                                 (503, "provider_failure"), (404, "http_error")):
            result = safe_error(status, marker)
            self.assertEqual(result, {"status": status, "category": category})
            self.assertNotIn("fixture-secret", json.dumps(result))


class SSETests(unittest.TestCase):
    def test_overflow_in_terminal_usage_is_refused_before_proposal(self):
        for number in ("1e999", "-1e999"):
            usage = ('data: {"model":"synthetic-model","choices":[],"usage":'
                     '{"completion_tokens":' + number + '}}\r\n\r\n').encode()
            raw = stream().replace(b"data: [DONE]", usage + b"data: [DONE]")
            with self.subTest(number=number), self.assertRaisesRegex(Refused, "^invalid_json$"):
                parse_sse([raw], "synthetic-model")

    def test_every_byte_split_including_utf8_and_crlf(self):
        raw = stream()
        expected = proposal("静かな湖 [name] {b}lantern{/b}")
        for i in range(len(raw) + 1):
            self.assertEqual(parse_sse([raw[:i], raw[i:]], "synthetic-model"), expected)
        self.assertEqual(parse_sse([bytes([n]) for n in raw], "synthetic-model"), expected)

    def test_lf_cr_and_multiline_data(self):
        raw = stream()
        for ending in (b"\n", b"\r"):
            self.assertEqual(parse_sse([raw.replace(b"\r\n", ending)], "synthetic-model"), proposal("静かな湖 [name] {b}lantern{/b}"))
        raw = event({"content": json.dumps(proposal())}, "stop")
        raw = raw.replace(', "choices"', ',\ndata: "choices"')
        self.assertEqual(parse_sse([(raw + "data: [DONE]\n\n").encode()], "synthetic-model"), proposal())

    def test_truncation_unknown_events_tools_and_late_data_refuse(self):
        for raw in (stream()[:-4], stream().replace(b"[DONE]", b"[OTHER]"),
                    b"event: tool_result\ndata: {}\n\n", b"event: error\ndata: {}\n\n",
                    b"event: new_feature\ndata: {}\n\n", b"data: [DONE]\n\n",
                    (event({"tool_calls": []}) + "data: [DONE]\n\n").encode(),
                    stream() + event({"content": "late"}).encode(),
                    event({"content": "partial"}, "length").encode(),
                    event({"content": "part"}, index=1).encode(),
                    event({"content": "part"}, model="other").encode()):
            with self.subTest(raw=raw), self.assertRaises(Refused):
                parse_sse([raw], "synthetic-model")

    def test_invalid_utf8_incomplete_codepoint_and_byte_limits(self):
        for raw in (b"data: \xff\n\n", b"data: \xe6"):
            with self.assertRaises(Refused):
                parse_sse([raw], "synthetic-model")
        for limits in ({"response_bytes_limit": 16}, {"sse_event_bytes_limit": 32}, {"final_text_bytes_limit": 8}):
            with patch.dict(PLAN, limits), self.assertRaises(Refused):
                parse_sse([stream()], "synthetic-model")


class LifecycleTests(unittest.TestCase):
    def test_cancel_and_replaced_generation_cannot_publish(self):
        guard = RequestGuard(3)
        self.assertFalse(guard.publish(2))
        guard.cancel()
        self.assertFalse(guard.publish(3))
        self.assertEqual(guard.state, "cancelled")

    def test_duplicate_publication_refuses(self):
        guard = RequestGuard(3)
        self.assertTrue(guard.publish(3))
        self.assertFalse(guard.publish(3))
        guard.cancel()
        self.assertEqual(guard.state, "cancelled")

    def test_owned_reader_closed_on_success_failure_and_cancellation(self):
        for mode in ("success", "failure", "cancelled", "cancel_during_read"):
            reader, guard = io.BytesIO(response()), RequestGuard(3)
            if mode == "cancelled":
                guard.cancel()

            def consume(r):
                if mode == "failure":
                    raise OSError("fixture read failure")
                if mode == "cancel_during_read":
                    guard.cancel()
                return validate_response(r.read(), "synthetic-model")

            if mode == "success":
                self.assertEqual(consume_owned(reader, guard, consume), proposal())
            else:
                with self.assertRaises((Refused, OSError)):
                    consume_owned(reader, guard, consume)
            self.assertTrue(reader.closed)

    def test_tests_open_no_network_connections(self):
        import socket
        with patch.object(socket, "socket", side_effect=AssertionError("unexpected network")):
            validate_response(response(), "synthetic-model")
            parse_sse([stream()], "synthetic-model")
            build_request("unsloth_studio", "synthetic-model", "synthetic")


if __name__ == "__main__":
    unittest.main()
