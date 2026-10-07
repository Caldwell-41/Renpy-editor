import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import live_studio as live
from contract import Refused


class FakeSocket:
    def __init__(self, wake):
        self.wake = wake
        self.closed = False

    def settimeout(self, _):
        pass

    def shutdown(self, _):
        self.wake.set()

    def close(self):
        self.closed = True


class FakeResponse:
    def __init__(self, data, status=200):
        self.data, self.status, self.closed = data, status, False

    def getheader(self, *args):
        return "application/json"

    def read1(self, _):
        data, self.data = self.data, b""
        return data

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, response, delay=False):
        self.response, self.delay, self.closed = response, delay, False
        self.wake = threading.Event()
        self.sock = FakeSocket(self.wake)
        self.headers, self.calls = {}, 0

    def connect(self):
        pass

    def request(self, method, path, body, headers):
        self.calls += 1
        self.headers = headers
        self.body = body

    def getresponse(self):
        if self.delay:
            self.wake.wait(1)
            raise OSError("synthetic transport error must not be reflected")
        return self.response

    def close(self):
        self.closed = True


class LiveRunnerTests(unittest.TestCase):
    key = "fixture-session-credential"

    def run_case(self, command, body, status=200, delay=False):
        receipts, out = [], io.StringIO()
        if live.PROBES[command["probe"]]["generation"]:
            receipts.append({"probe": "M01", "generation": False, "elapsed_seconds": 0,
                             "outcome": "discovery_parsed", "model_ids": [live.SELECTED_MODEL]})
        response = FakeResponse(body, status)
        connection = FakeConnection(response, delay)
        with tempfile.TemporaryDirectory() as directory, \
                patch.object(live, "RECEIPT", Path(directory) / "receipts.json"), \
                patch.object(live.http.client, "HTTPConnection", return_value=connection), \
                patch.object(live, "CONTINUATION_STARTED", None), \
                patch.object(live, "CONTINUATION_INDEX", None), \
                patch.dict(live.PLAN, cancel_after_seconds=0.01), contextlib.redirect_stdout(out):
            live.run_probe(command, self.key, receipts)
            self.assertNotIn(self.key, out.getvalue())
            self.assertNotIn(self.key, live.RECEIPT.read_text())
            with self.assertRaises(Refused):
                live.run_probe(command, self.key, receipts)
        self.assertTrue(connection.closed)
        return receipts[-1], connection, response

    def test_discovery_only_once_and_bearer_never_in_receipt(self):
        result, connection, response = self.run_case({"probe": "M01"}, b'{"data":[{"id":"synthetic-model"}]}')
        self.assertEqual(result["model_ids"], ["synthetic-model"])
        self.assertEqual(connection.headers["Authorization"], "Bearer " + self.key)
        self.assertEqual(connection.calls, 1)
        self.assertTrue(response.closed)

    def test_encoded_secret_echo_is_refused_before_output(self):
        raw = json.dumps({"data": [{"id": self.key}]}).replace("f", "\\u0066").encode()
        result, _, _ = self.run_case({"probe": "M01"}, raw)
        self.assertEqual(result["outcome"], "credential_echo_refused")
        self.assertNotIn("model_ids", result)

    def test_auth_error_counts_and_does_not_read_error_body(self):
        result, connection, response = self.run_case({"probe": "A01"}, self.key.encode(), status=401)
        self.assertEqual(result["http_status"], 401)
        self.assertEqual(result["http_count"], 1)
        self.assertEqual(response.data, self.key.encode())
        self.assertNotIn("Authorization", connection.headers)

    def test_generation_requires_user_selected_discovered_model(self):
        with self.assertRaises(Refused):
            live.run_probe({"probe": "G01", "model": "synthetic"}, self.key, [])

    def test_cancel_releases_owned_worker_without_server_stop_claim(self):
        result, connection, _ = self.run_case({"probe": "C01", "model": live.SELECTED_MODEL}, b"", delay=True)
        self.assertEqual(result["outcome"], "client_cancelled")
        self.assertTrue(result["worker_released"])
        self.assertTrue(connection.sock.closed)
        self.assertEqual(result["generation_count"], 1)

    def test_each_generation_emits_disable_fields_without_claiming_global_server_policy(self):
        result, connection, _ = self.run_case({"probe": "G01", "model": live.SELECTED_MODEL}, b'{}', status=400)
        self.assertEqual(result["generation_count"], 1)
        self.assertEqual(connection.calls, 1)
        body = json.loads(connection.body)
        self.assertIs(body["enable_tools"], False)
        self.assertEqual(body["enabled_tools"], [])
        self.assertNotIn("tools", body)
        self.assertNotIn("session_id", body)

    def test_followup_uses_recorded_off_mode_and_protected_input(self):
        _, connection, _ = self.run_case({"probe": "G05", "model": live.SELECTED_MODEL}, b'{}', status=400)
        body = json.loads(connection.body)
        self.assertIs(body["enable_thinking"], False)
        self.assertEqual(body["max_tokens"], 1024)
        self.assertEqual(body["messages"][1]["content"], live.PLAN["protected_input"])
        self.assertNotIn("temperature", body)

    def test_malformed_choices_always_record_failure_without_worker_traceback(self):
        for choices in (None, 7, {"0": {}}, [], [None], [{}, {}]):
            with self.subTest(choices=choices), patch.object(live.threading, "excepthook") as hook:
                body = json.dumps({"model": live.SELECTED_MODEL, "choices": choices}).encode()
                result, _, response = self.run_case({"probe": "G05", "model": live.SELECTED_MODEL}, body)
                self.assertEqual(result["outcome"], "choice_invalid")
                self.assertEqual(result["status"], "terminal")
                self.assertTrue(result["worker_released"] and response.closed)
                self.assertNotIn("synthetic_proposal", result)
                hook.assert_not_called()

    def test_unexpected_worker_exception_has_safe_failure_and_cleanup(self):
        with patch.object(FakeResponse, "read1", side_effect=TypeError(self.key)), \
                patch.object(live.threading, "excepthook") as hook:
            result, _, response = self.run_case({"probe": "M01"}, b"{}")
        self.assertEqual(result["outcome"], "worker_failure")
        self.assertTrue(result["worker_released"] and response.closed)
        self.assertNotIn("synthetic_proposal", result)
        hook.assert_not_called()

    def test_response_cleanup_failure_drops_proposal_and_closes_connection(self):
        proposal = {"schema_version": 1, "operations": [{"type": "replace_text",
                    "target": "synthetic-beat-1", "text": "A quiet lantern glows."}]}
        body = json.dumps({"model": live.SELECTED_MODEL, "choices": [{"index": 0,
                          "finish_reason": "stop", "message": {"role": "assistant",
                          "content": json.dumps(proposal)}}]}).encode()
        with patch.object(FakeResponse, "close", side_effect=RuntimeError(self.key)), \
                patch.object(live.threading, "excepthook") as hook:
            result, connection, _ = self.run_case({"probe": "G01", "model": live.SELECTED_MODEL}, body)
        self.assertEqual(result["outcome"], "client_cleanup_failed")
        self.assertNotIn("synthetic_proposal", result)
        self.assertTrue(result["worker_released"] and connection.closed)
        hook.assert_not_called()

    def test_truncated_reply_retains_metrics_without_proposal(self):
        body = json.dumps({"model": live.SELECTED_MODEL, "choices": [{"index": 0,
                          "finish_reason": "length", "message": {"role": "assistant",
                          "content": "", "reasoning_content": "synthetic thinking"}}],
                          "usage": {"completion_tokens": 1024, "prompt_tokens": 95,
                                    "total_tokens": 1119}}).encode()
        result, _, _ = self.run_case({"probe": "T03", "model": live.SELECTED_MODEL}, body)
        self.assertEqual(result["outcome"], "finish_unusable")
        self.assertEqual(result["finish_reason"], "length")
        self.assertEqual(result["usage"]["completion_tokens"], 1024)
        self.assertEqual(result["reasoning_bytes"], len("synthetic thinking"))
        self.assertTrue(result["returned_model_matches"])
        self.assertNotIn("synthetic_proposal", result)

    def test_discovery_metadata_is_selected_and_allowlisted(self):
        raw = json.dumps({"data": [{"id": live.SELECTED_MODEL, "loaded": True,
                                   "context_length": 8192, "native_context_length": 262144,
                                   "max_context_length": "untrusted", "quant": "Q4_K_M",
                                   "other": "not retained"}]}).encode()
        result, _, _ = self.run_case({"probe": "M03"}, raw)
        self.assertEqual(result["selected_model_metadata"],
                         {"loaded": True, "context_length": 8192, "native_context_length": 262144, "quant": "Q4_K_M"})

    def test_conservative_prior_window_and_between_probe_time_count(self):
        through = live.PLAN["prior_live_window_charge"]["through_sequence"]
        receipts = [{"probe": "past", "generation": False, "elapsed_seconds": 0}] * through
        with patch.object(live, "CONTINUATION_STARTED", 0), \
                patch.object(live, "CONTINUATION_INDEX", through), \
                patch.object(live.time, "monotonic", return_value=470), \
                patch.object(live.http.client, "HTTPConnection") as connection, self.assertRaises(Refused):
            live.run_probe({"probe": "M03"}, self.key, receipts)
        connection.assert_not_called()
        self.assertEqual(len(receipts), through)

    def test_unrecorded_command_settings_refuse_before_send(self):
        for command in ({"probe": "G05", "model": live.SELECTED_MODEL, "max_tokens": 4096},
                        {"probe": "G05", "model": live.SELECTED_MODEL, "stream": True},
                        {"probe": []}, {"probe": "C01", "stream": "yes"}):
            with self.subTest(command=command), patch.object(live.http.client, "HTTPConnection") as connection, self.assertRaises(Refused):
                live.run_probe(command, self.key, [])
            connection.assert_not_called()

    def test_partial_sse_cancel_never_publishes_proposal_and_releases_reader(self):
        first = ("data: " + json.dumps({"model": live.SELECTED_MODEL, "choices": [{"index": 0,
                 "delta": {"content": '{"schema_version":'}, "finish_reason": None}]}) + "\n\n").encode()
        class PartialResponse(FakeResponse):
            def getheader(self, *args):
                return "text/event-stream"

            def read1(self, _):
                if self.data:
                    return super().read1(_)
                connection.wake.wait(1)
                raise OSError("synthetic abort")

        response = PartialResponse(first)
        connection = FakeConnection(response)
        receipts = [{"probe": "M01", "generation": False, "elapsed_seconds": 0,
                     "outcome": "discovery_parsed", "model_ids": [live.SELECTED_MODEL]}]
        with tempfile.TemporaryDirectory() as d, patch.object(live, "RECEIPT", Path(d)/"receipts.json"), \
                patch.object(live.http.client, "HTTPConnection", return_value=connection), \
                patch.dict(live.PROBES["C03"], cancel_after_seconds=0.01), \
                contextlib.redirect_stdout(io.StringIO()):
            live.run_probe({"probe": "C03", "model": live.SELECTED_MODEL}, self.key, receipts)
        self.assertEqual(receipts[-1]["outcome"], "client_cancelled")
        self.assertEqual(receipts[-1]["response_bytes"], len(first))
        self.assertNotIn("synthetic_proposal", receipts[-1])
        self.assertTrue(receipts[-1]["worker_released"])
        self.assertTrue(connection.closed and response.closed)

    def test_time_cap_refuses_before_connection_or_extra_attempt(self):
        receipts = [{"probe": "past", "generation": True, "elapsed_seconds": 1799}]
        with patch.object(live.http.client, "HTTPConnection") as connection, self.assertRaises(Refused):
            live.run_probe({"probe": "M01"}, self.key, receipts)
        connection.assert_not_called()
        self.assertEqual(len(receipts), 1)


if __name__ == "__main__":
    unittest.main()
