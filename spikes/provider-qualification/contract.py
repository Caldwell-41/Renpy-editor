"""Offline contract reference only. No network, secrets, production imports or writes."""
from __future__ import annotations

import codecs
import ipaddress
import json
import math
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).parent
SCHEMA = json.loads((ROOT / "probe-schema.json").read_text())
PLAN = json.loads((ROOT / "probe-plan.json").read_text())
LAN = tuple(ipaddress.ip_network(n) for n in
            ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7"))


class Refused(ValueError):
    """Only fixed safe categories may cross a diagnostic boundary."""


def endpoint(value: str) -> tuple[str, tuple[str, str, int]]:
    if not isinstance(value, str) or not value or any(ord(c) <= 32 for c in value):
        raise Refused("endpoint_invalid")
    if any(c in value for c in ("\\", "%", "?", "#")):
        raise Refused("endpoint_invalid")
    try:
        u = urlsplit(value)
        host, port = u.hostname, u.port
        if (u.scheme not in ("http", "https") or not host or u.username is not None
                or u.password is not None or port == 0 or u.query or u.fragment):
            raise Refused("endpoint_invalid")
        if u.netloc.endswith(":"):
            raise Refused("endpoint_invalid")
        host = host.lower()
        if not all(c.isascii() and (c.isalnum() or c in ".-:") for c in host):
            raise Refused("endpoint_invalid")
        if ":" in host or "[" in u.netloc:
            host = str(ipaddress.IPv6Address(host))
        elif not all(part and not part.startswith("-") and not part.endswith("-")
                     for part in host.split(".")):
            raise Refused("endpoint_invalid")
        parts = u.path.rstrip("/").split("/")[1:]
        if any(p in ("", ".", "..") for p in parts):
            raise Refused("endpoint_path")
        if any(p in ("chat", "completions", "models", "responses", "messages") for p in parts):
            raise Refused("endpoint_path")
        if "v1" in parts and (parts[-1] != "v1" or parts.count("v1") != 1):
            raise Refused("endpoint_path")
        if not parts or parts[-1] != "v1":
            parts.append("v1")
        effective_port = port or (443 if u.scheme == "https" else 80)
        authority = f"[{host}]" if ":" in host else host
        if effective_port != (443 if u.scheme == "https" else 80):
            authority += f":{effective_port}"
        return (urlunsplit((u.scheme, authority, "/" + "/".join(parts), "", "")),
                (u.scheme, host, effective_port))
    except (ValueError, UnicodeError):
        raise Refused("endpoint_invalid") from None


def address_policy(scheme: str, resolved: list[str], private_http: bool = False) -> None:
    """Caller supplies validated DNS answers; this function never resolves or connects."""
    if scheme not in ("http", "https") or not resolved:
        raise Refused("address_unavailable")
    for raw in resolved:
        try:
            ip = ipaddress.ip_address(raw)
        except ValueError:
            raise Refused("address_invalid") from None
        ip = getattr(ip, "ipv4_mapped", None) or ip
        if ip.is_unspecified or ip.is_multicast or ip.is_link_local:
            raise Refused("address_refused")
        if scheme == "http" and not (ip.is_loopback or
                (private_http and any(ip in n for n in LAN if ip.version == n.version))):
            raise Refused("plaintext_refused")


def require_budget(input_estimate: int, output: int, budget: int, ceiling: int) -> None:
    if any(type(n) is not int or n <= 0 for n in (input_estimate, output, budget, ceiling)):
        raise Refused("budget_invalid")
    margin = max(128, math.ceil(input_estimate / 10))
    if input_estimate + margin + output > budget or budget > ceiling:
        raise Refused("context_over_budget")


def build_request(kind: str, model: str, prompt: str, *, output_field: str = "max_tokens",
                  output: int = 256, stream: bool = False, tunnel: bool = False,
                  thinking: str = "default") -> bytes:
    if kind not in ("unsloth_studio", "openai_compatible") or not model:
        raise Refused("profile_invalid")
    if output_field not in ("max_tokens", "max_completion_tokens") or type(output) is not int or output <= 0:
        raise Refused("output_mapping_invalid")
    if type(stream) is not bool or (stream and tunnel):
        raise Refused("transport_unqualified")
    if thinking not in ("default", "on", "off") or (kind == "openai_compatible" and thinking != "default"):
        raise Refused("thinking_unqualified")
    body = {"model": model, "stream": stream, output_field: output,
            "messages": [{"role": "system", "content": PLAN["system_message"]},
                         {"role": "user", "content": prompt}],
            "response_format": {"type": "json_schema", "json_schema": {
                "name": "loomlight_synthetic_v1", "strict": True, "schema": SCHEMA}}}
    if kind == "unsloth_studio":
        body.update(enable_tools=False, enabled_tools=[])
        if thinking != "default":
            body["enable_thinking"] = thinking == "on"
    data = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(data) > PLAN["request_bytes_limit"]:
        raise Refused("request_over_limit")
    return data


def strict_json(data: bytes | str, limit: int = 2097152, depth: int = 32):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise Refused("duplicate_key")
            result[key] = value
        return result

    def constant(_):
        raise Refused("invalid_json")

    try:
        raw = data if isinstance(data, bytes) else data.encode("utf-8")
        if len(raw) > limit:
            raise Refused("response_over_limit")
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=constant)
        pending = [(value, 0)]
        while pending:
            item, level = pending.pop()
            if level > depth:
                raise Refused("json_depth")
            if isinstance(item, dict):
                pending.extend((v, level + 1) for v in item.values())
            elif isinstance(item, list):
                pending.extend((v, level + 1) for v in item)
            elif isinstance(item, str):
                item.encode("utf-8")  # Refuse unpaired Unicode surrogates.
            elif isinstance(item, float) and not math.isfinite(item):
                # JSON exponent overflow also creates infinity, without invoking
                # parse_constant. Check all decoded values, including metadata.
                raise Refused("invalid_json")
        return value
    except Refused:
        raise
    except (ValueError, UnicodeError, RecursionError):
        raise Refused("invalid_json") from None


def validate_probe(text: str, protected: tuple[str, ...] = ()) -> dict:
    value = strict_json(text)
    if (not isinstance(value, dict) or set(value) != {"schema_version", "operations"}
            or type(value["schema_version"]) is not int or value["schema_version"] != 1):
        raise Refused("schema_invalid")
    ops = value["operations"]
    if not isinstance(ops, list) or len(ops) != 1:
        raise Refused("operation_count")
    op = ops[0]
    if (not isinstance(op, dict) or set(op) != {"type", "target", "text"}
            or op["type"] != "replace_text" or op["target"] != "synthetic-beat-1"
            or not isinstance(op["text"], str) or not op["text"].strip()):
        raise Refused("operation_invalid")
    # Inspect token markers only. This never parses or rewrites Ren'Py source.
    found = []
    remainder = op["text"]
    while "__LL_TOKEN_" in remainder:
        start = remainder.index("__LL_TOKEN_")
        end = remainder.find("__", start + len("__LL_TOKEN_"))
        if end == -1:
            raise Refused("protected_token_invalid")
        found.append(remainder[start:end + 2])
        remainder = remainder[end + 2:]
    if tuple(found) != protected:
        raise Refused("protected_token_invalid")
    return value


def validate_response(data: bytes, model: str, protected: tuple[str, ...] = ()) -> dict:
    value = strict_json(data, PLAN["response_bytes_limit"])
    if not isinstance(value, dict) or value.get("model") != model:
        raise Refused("model_mismatch")
    choices = value.get("choices")
    if not isinstance(choices, list) or len(choices) != 1 or not isinstance(choices[0], dict):
        raise Refused("choice_invalid")
    choice = choices[0]
    if type(choice.get("index")) is not int or choice["index"] != 0:
        raise Refused("choice_invalid")
    if choice.get("finish_reason") != "stop":
        raise Refused("finish_unusable")
    message = choice.get("message")
    if not isinstance(message, dict) or message.get("role") != "assistant":
        raise Refused("message_invalid")
    if any(message.get(k) for k in ("tool_calls", "function_call", "tool_result")) or value.get("tool_result"):
        raise Refused("unexpected_tool")
    if message.get("refusal"):
        raise Refused("provider_refusal")
    text = message.get("content")
    if not isinstance(text, str) or not text.strip():
        raise Refused("empty_final")
    # reasoning_content deliberately never contributes to text.
    return validate_probe(text, protected)


def parse_sse(chunks, model: str, protected: tuple[str, ...] = (), on_progress=None) -> dict:
    decoder = codecs.getincrementaldecoder("utf-8")("strict")
    line, data, event, event_size, line_size = "", [], "", 0, 0
    total, previous_cr, done, finished = 0, False, False, False
    content, final_size, reasoning_size = [], 0, 0

    def dispatch():
        nonlocal data, event, event_size, done, finished, final_size, reasoning_size
        if event not in ("", "message"):
            raise Refused("sse_event_unqualified")
        if data:
            payload = "\n".join(data)
            if done:
                raise Refused("sse_after_done")
            if payload == "[DONE]":
                if not finished:
                    raise Refused("sse_incomplete")
                done = True
            else:
                frame = strict_json(payload, PLAN["sse_event_bytes_limit"])
                if not isinstance(frame, dict) or frame.get("model") != model:
                    raise Refused("model_mismatch")
                if "error" in frame or "tool_result" in frame:
                    raise Refused("sse_error_or_tool")
                choices = frame.get("choices")
                if choices == [] and finished and "usage" in frame:
                    pass  # Optional terminal usage is not generated text.
                elif not isinstance(choices, list) or len(choices) != 1 or finished:
                    raise Refused("choice_invalid")
                else:
                    c = choices[0]
                    if not isinstance(c, dict) or type(c.get("index")) is not int or c["index"] != 0:
                        raise Refused("choice_invalid")
                    delta = c.get("delta")
                    if not isinstance(delta, dict):
                        raise Refused("delta_invalid")
                    if any(k in delta for k in ("tool_calls", "function_call", "tool_result")):
                        raise Refused("unexpected_tool")
                    if set(delta) - {"role", "content", "reasoning_content", "refusal"}:
                        raise Refused("delta_unqualified")
                    if delta.get("role", "assistant") != "assistant" or delta.get("refusal"):
                        raise Refused("message_invalid")
                    for field in ("content", "reasoning_content"):
                        piece = delta.get(field)
                        if piece is not None:
                            if not isinstance(piece, str):
                                raise Refused("delta_invalid")
                            size = len(piece.encode("utf-8"))
                            if size and on_progress is not None:
                                on_progress()
                            if field == "content":
                                content.append(piece)
                                final_size += size
                            else:
                                reasoning_size += size
                    if final_size > PLAN["final_text_bytes_limit"]:
                        raise Refused("final_over_limit")
                    if c.get("finish_reason") is not None:
                        if c["finish_reason"] != "stop":
                            raise Refused("finish_unusable")
                        finished = True
        data, event, event_size = [], "", 0

    def accept_line(value):
        nonlocal event, event_size
        if not value:
            dispatch()
            return
        event_size += len(value.encode("utf-8")) + 1
        if event_size > PLAN["sse_event_bytes_limit"]:
            raise Refused("sse_event_over_limit")
        if value.startswith(":"):
            return
        key, _, val = value.partition(":")
        val = val[1:] if val.startswith(" ") else val
        if key == "data":
            data.append(val)
        elif key == "event":
            event = val
        elif key not in ("id", "retry"):
            raise Refused("sse_field_unqualified")

    try:
        for chunk in chunks:
            total += len(chunk)
            if total > PLAN["response_bytes_limit"]:
                raise Refused("response_over_limit")
            for char in decoder.decode(chunk):
                if char == "\n" and previous_cr:
                    previous_cr = False
                    continue
                previous_cr = char == "\r"
                if char in "\r\n":
                    accept_line(line)
                    line = ""
                    line_size = 0
                else:
                    line += char
                    line_size += len(char.encode("utf-8"))
                    if line_size > PLAN["sse_event_bytes_limit"]:
                        raise Refused("sse_line_over_limit")
        decoder.decode(b"", final=True)
    except UnicodeError:
        raise Refused("sse_invalid_utf8") from None
    if line or data or event or not done or not finished:
        raise Refused("sse_incomplete")
    return validate_probe("".join(content), protected)


def safe_error(status: int, raw_body: bytes = b"") -> dict:
    """Never parse or reflect arbitrary error bodies or headers."""
    if status in (401, 403):
        category = "authentication"
    elif status == 429:
        category = "busy_or_rate_limited"
    elif 300 <= status < 400:
        category = "redirect_refused"
    elif 500 <= status < 600:
        category = "provider_failure"
    else:
        category = "http_error"
    return {"status": status, "category": category}


class RequestGuard:
    """A serial model of the shared cancellation/publication arbitration boundary."""
    def __init__(self, generation: int):
        self.generation, self.state = generation, "receiving"

    def cancel(self):
        if self.state in ("receiving", "validating", "review_ready"):
            self.state = "cancelled"

    def publish(self, generation: int) -> bool:
        if self.state != "receiving" or generation != self.generation:
            return False
        self.state = "review_ready"
        return True


def consume_owned(reader, guard: RequestGuard, consume):
    """Caller owns a closeable reader; cleanup runs for success/failure/cancellation."""
    try:
        if guard.state == "cancelled":
            raise Refused("cancelled")
        result = consume(reader)
        if not guard.publish(guard.generation):
            raise Refused("late_completion")
        return result
    finally:
        reader.close()
