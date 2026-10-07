"""Manual, one-shot-per-command Studio qualification with native remembered credentials.

No project files, provider management, retries, redirects, proxies or model substitution.
The fixed endpoint below was explicitly approved for this qualification only.
"""
from __future__ import annotations

import hashlib
import http.client
import json
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

from contract import PLAN, Refused, address_policy, build_request, parse_sse, require_budget, strict_json, validate_response
from macos_credential import qualification_key

HOST, PORT = "192.168.1.13", 8888
SELECTED_MODEL = "unsloth/gemma-4-12B-it-qat-GGUF"
address_policy("http", [HOST], private_http=True)
RECEIPT = Path(".toolchains/reports/provider-qualification/studio-receipts.json")
RECEIPT.parent.mkdir(parents=True, exist_ok=True)
PROBES = {p["id"]: p for p in PLAN["per_provider_probes"]}
CONTINUATION_STARTED = None
CONTINUATION_INDEX = None


def refuse_secret_echo(value, key):
    pending = [value]
    while pending:
        item = pending.pop()
        if isinstance(item, str) and key in item:
            raise Refused("credential_echo_refused")
        if isinstance(item, dict):
            pending.extend(item.keys())
            pending.extend(item.values())
        elif isinstance(item, list):
            pending.extend(item)


def save(receipts):
    # Only allowlisted values reach this file. Never store headers or exception text.
    RECEIPT.write_text(json.dumps(receipts, indent=2, ensure_ascii=True) + "\n")


def native_key():
    script = ('text returned of (display dialog "Remember the Studio API key in macOS '
              'Keychain for synthetic qualification at 192.168.1.13:8888. Future probe '
              'runs reuse it. No key is saved in repository files or logs. Production '
              'settings are separate." default answer "" with hidden answer buttons '
              '{"Cancel", "Remember for qualification"} default button '
              '"Remember for qualification" cancel button "Cancel")')
    result = subprocess.run(["osascript", "-e", script], stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, check=False, timeout=300)
    if result.returncode != 0:
        raise Refused("credential_entry_cancelled")
    key = result.stdout.decode("utf-8").rstrip("\r\n")
    if not key or any(ord(c) <= 32 or ord(c) >= 127 for c in key):
        raise Refused("credential_entry_invalid")
    return key


def run_probe(command, key, receipts):
    global CONTINUATION_STARTED, CONTINUATION_INDEX
    if set(command) - {"probe", "model", "stream"}:
        raise Refused("command_invalid")
    probe_id = command.get("probe")
    if not isinstance(probe_id, str) or probe_id not in PROBES or any(r["probe"] == probe_id for r in receipts):
        raise Refused("probe_unknown_or_already_attempted")
    if "stream" in command and (probe_id != "C01" or type(command["stream"]) is not bool):
        raise Refused("command_invalid")
    probe = PROBES[probe_id]
    used = len(receipts)
    generations = sum(r["generation"] for r in receipts)
    elapsed = sum(r.get("elapsed_seconds", r.get("reserved_seconds", 0)) for r in receipts)
    charge = PLAN.get("prior_live_window_charge", {})
    through = charge.get("through_sequence", 0)
    if through and used >= through:
        prior = sum(r.get("elapsed_seconds", r.get("reserved_seconds", 0)) for r in receipts[:through])
        elapsed += max(0, charge["seconds"] - prior)
        if CONTINUATION_STARTED is not None:
            measured = sum(r.get("elapsed_seconds", r.get("reserved_seconds", 0)) for r in receipts[CONTINUATION_INDEX:])
            elapsed += max(0, time.monotonic() - CONTINUATION_STARTED - measured)
    timeout = PLAN["generation_total_timeout_seconds"] if probe["generation"] else PLAN["discovery_timeout_seconds"]
    if (used >= PLAN["maximum_http_requests"] or
            (probe["generation"] and generations >= PLAN["maximum_generation_requests"]) or
            elapsed + timeout + PLAN["client_cleanup_target_seconds"] > PLAN["maximum_live_seconds"]):
        raise Refused("allowance_exhausted")
    data = None
    protected = ()
    selected = command.get("model")
    if probe["generation"]:
        discovered = any(r.get("probe") == "M01" and r.get("outcome") == "discovery_parsed"
                         and selected in r.get("model_ids", []) for r in receipts)
        if selected != SELECTED_MODEL or not discovered:
            raise Refused("selected_discovered_model_required")
        model = PLAN["nonexistent_model"] if probe_id == "E01" else selected
        prompt = PLAN["literal_input"]
        if probe_id == "G02" or probe.get("prompt_case") == "protected":
            prompt, protected = PLAN["protected_input"], ("__LL_TOKEN_0__", "__LL_TOKEN_1__")
        elif probe_id == "G03" or probe.get("prompt_case") == "tools":
            prompt = PLAN["tools_input"]
        elif probe_id in ("G04", "C01") or probe.get("prompt_case") == "long":
            prompt = PLAN["long_input"]
        thinking = probe.get("thinking", "off" if probe_id == "T01" else "on" if probe_id == "T02" else "default")
        streaming = probe.get("stream", False) or probe_id == "S01" or (probe_id == "C01" and command.get("stream") is True)
        data = build_request("unsloth_studio", model, prompt, output=probe.get("output_tokens", 256),
                             stream=streaming, thinking=thinking)
        built = strict_json(data)
        if built.get("enable_tools") is not False or built.get("enabled_tools") != [] or "tools" in built or "session_id" in built:
            raise Refused("request_tools_not_disabled")
        if probe_id == "E02":
            value = strict_json(data)
            value["response_format"] = {"type": "loomlight_synthetic_invalid_format"}
            data = json.dumps(value).encode()
        if "effective_context_ceiling" in PLAN:
            # Entire serialized body's byte count is a deliberately conservative
            # fixture token estimate, including schema/framing; no resize wire field.
            require_budget(len(data), probe.get("output_tokens", 256),
                           PLAN["qualification_context_budget"], PLAN["effective_context_ceiling"])
    else:
        model, streaming = "", False

    receipt = {"sequence": used + 1, "probe": probe_id, "generation": probe["generation"],
               "http_count": used + 1, "generation_count": generations + int(probe["generation"]),
               "method": probe["method"], "path": probe["path"], "status": "attempt_reserved",
               "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "input_sha256": hashlib.sha256(data or b"").hexdigest(), "reserved_seconds": timeout + 2}
    receipts.append(receipt)
    save(receipts)  # Count ambiguous attempts conservatively before any connect/send.
    started, result, shared = time.monotonic(), {"outcome": "worker_failure"}, {}
    if through and used >= through and CONTINUATION_STARTED is None:
        CONTINUATION_STARTED, CONTINUATION_INDEX = started, used

    def worker():
        connection, response = None, None
        try:
            connection = http.client.HTTPConnection(HOST, PORT, timeout=min(10, timeout))
            shared["connection"] = connection
            connection.connect()
            shared["socket"] = connection.sock
            connection.sock.settimeout(max(0.1, timeout - (time.monotonic() - started)))
            headers = {"Accept": "text/event-stream" if streaming else "application/json"}
            auth = probe.get("auth", "configured")
            if auth == "configured":
                headers["Authorization"] = "Bearer " + key
            elif auth == "synthetic-invalid":
                headers["Authorization"] = "Bearer loomlight-synthetic-invalid-credential"
            if data is not None:
                headers["Content-Type"] = "application/json"
            connection.request(probe["method"], "/v1/" + probe["path"], body=data, headers=headers)
            response = connection.getresponse()
            result["http_status"] = response.status
            content_type = response.getheader("Content-Type", "").split(";")[0].strip().lower()
            result["content_type"] = content_type if content_type in ("application/json", "text/event-stream", "text/plain", "text/html") else "other"
            if not 200 <= response.status < 300:
                # Never read/reflect a provider error body or follow a redirect.
                result["outcome"] = "http_error"
                return
            chunks, count = [], 0

            def mark_progress():
                shared["semantic_progress_at"] = time.monotonic()

            def read_chunks():
                nonlocal count
                while True:
                    now = time.monotonic()
                    remaining = timeout - (now - started)
                    last = shared.get("semantic_progress_at")
                    if streaming and last is not None:
                        remaining = min(remaining, PLAN["sse_no_progress_timeout_seconds"] - (now - last))
                    if remaining <= 0:
                        raise Refused("progress_or_total_timeout")
                    shared["socket"].settimeout(remaining)
                    chunk = response.read1(4096)
                    if not chunk:
                        break
                    count += len(chunk)
                    result["response_bytes"] = count
                    if count > PLAN["response_bytes_limit"]:
                        raise Refused("response_over_limit")
                    chunks.append(chunk)
                    yield chunk

            if streaming:
                if content_type != "text/event-stream":
                    raise Refused("sse_content_type")
                validate = parse_sse(read_chunks(), model, protected, on_progress=mark_progress)
            else:
                for _ in read_chunks():
                    pass
            result["response_bytes"] = count
            raw = b"".join(chunks)
            # Redact the in-memory credential before ANY output/persistence.
            if key.encode() in raw:
                raise Refused("credential_echo_refused")
            if not probe["generation"]:
                value = strict_json(raw)
                refuse_secret_echo(value, key)
                models = value.get("data") if isinstance(value, dict) else None
                if not isinstance(models, list) or len(models) > 256:
                    raise Refused("models_invalid")
                ids = []
                selected_metadata = {}
                for item in models:
                    if not isinstance(item, dict) or not isinstance(item.get("id"), str) or len(item["id"]) > 512:
                        raise Refused("models_invalid")
                    ids.append(item["id"])
                    if item["id"] == SELECTED_MODEL and probe_id in ("M03", "M04"):
                        for name in ("context_length", "native_context_length", "max_context_length"):
                            n = item.get(name)
                            if type(n) is int and 0 < n <= 10000000:
                                selected_metadata[name] = n
                        if type(item.get("loaded")) is bool:
                            selected_metadata["loaded"] = item["loaded"]
                        quant = item.get("quant")
                        if isinstance(quant, str) and 0 < len(quant) <= 64 and all(c.isascii() and (c.isalnum() or c in "_.-") for c in quant):
                            selected_metadata["quant"] = quant
                result.update(outcome="discovery_parsed", model_ids=ids)
                if probe_id in ("M03", "M04"):
                    result["selected_model_metadata"] = selected_metadata
            elif streaming:
                refuse_secret_echo(validate, key)
                result.update(outcome="structured_valid", synthetic_proposal=validate,
                              finish_reason="stop", returned_model_matches=True, usage=None)
            else:
                if content_type != "application/json":
                    raise Refused("json_content_type")
                value = strict_json(raw, PLAN["response_bytes_limit"])
                refuse_secret_echo(value, key)
                choices = value.get("choices", []) if isinstance(value, dict) else []
                if not isinstance(choices, list) or len(choices) != 1 or not isinstance(choices[0], dict):
                    raise Refused("choice_invalid")
                finish = choices[0].get("finish_reason")
                result["finish_reason"] = finish if finish in ("stop", "length", "tool_calls", "content_filter", None) else "other"
                message = choices[0].get("message")
                if isinstance(message, dict):
                    reasoning = message.get("reasoning_content")
                    result["reasoning_field_present"] = isinstance(reasoning, str)
                    result["reasoning_bytes"] = len(reasoning.encode("utf-8")) if isinstance(reasoning, str) else None
                    result["returned_tool_fields"] = any(message.get(k) for k in ("tool_calls", "function_call", "tool_result"))
                returned_model = value.get("model") if isinstance(value, dict) else None
                result["returned_model_matches"] = returned_model == model
                usage = value.get("usage") if isinstance(value, dict) else None
                if isinstance(usage, dict):
                    result["usage"] = {k: v for k, v in usage.items() if k in
                                       ("prompt_tokens", "completion_tokens", "total_tokens") and type(v) is int and v >= 0}
                else:
                    result["usage"] = None
                validate = validate_response(raw, model, protected)
                result.update(outcome="structured_valid", synthetic_proposal=validate)
        except Refused as exc:
            # Refused contains only our fixed categories. Never print transport exceptions.
            result["outcome"] = str(exc)
        except (OSError, http.client.HTTPException, ValueError):
            result["outcome"] = "transport_or_protocol_failure"
        except Exception:
            # Unexpected worker defects remain failures, never stderr tracebacks
            # or missing outcomes. Do not expose arbitrary exception text.
            result["outcome"] = "worker_failure"
            result.pop("synthetic_proposal", None)
        finally:
            for resource in (response, connection):
                if resource is not None:
                    try:
                        resource.close()
                    except Exception:
                        result["outcome"] = "client_cleanup_failed"
                        result.pop("synthetic_proposal", None)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    is_cancel = probe_id in ("C01", "C02", "C03")
    wait = probe.get("cancel_after_seconds", PLAN["cancel_after_seconds"]) if is_cancel else timeout
    thread.join(wait)
    cancelled = thread.is_alive()
    cleanup_started = time.monotonic()
    if cancelled:
        sock = shared.get("socket")
        if sock is not None:
            try:
                sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            sock.close()
        thread.join(PLAN["client_cleanup_target_seconds"])
    if thread.is_alive():
        result = {"outcome": "client_cleanup_failed"}
    elif cancelled:
        result["outcome"] = "client_cancelled" if is_cancel else "total_timeout"
        result.pop("synthetic_proposal", None)
    elif is_cancel:
        result["cancellation_evidence"] = "completed_before_cancel_inconclusive"
    refuse_secret_echo(result, key)
    receipt.update(result)
    receipt.update(status="terminal", elapsed_seconds=round(time.monotonic() - started, 3),
                   cleanup_seconds=round(time.monotonic() - cleanup_started, 3), worker_released=not thread.is_alive())
    receipt.pop("reserved_seconds", None)
    save(receipts)
    print(json.dumps(receipt, ensure_ascii=True), flush=True)
    if thread.is_alive():
        raise Refused("cleanup_failed_stop_session")


def main():
    receipts = json.loads(RECEIPT.read_text()) if RECEIPT.exists() else []
    key = qualification_key(native_key)
    print('{"credential":"keychain_ready","awaiting":"explicit_probe_command"}', flush=True)
    for line in sys.stdin:
        try:
            command = strict_json(line, limit=4096)
            if not isinstance(command, dict):
                raise Refused("command_invalid")
            if command.get("exit") is True:
                break
            run_probe(command, key, receipts)
        except Refused as exc:
            print(json.dumps({"refused": str(exc)}), flush=True)
            if str(exc) == "cleanup_failed_stop_session":
                break
    key = ""  # Drop this process reference; remembered Keychain entry remains.


if __name__ == "__main__":
    try:
        main()
    except (Refused, subprocess.TimeoutExpired):
        print('{"status":"credential_entry_unavailable_or_cancelled"}', flush=True)
        sys.exit(1)
