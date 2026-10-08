#!/usr/bin/env python3
"""One explicitly selected packaged launch; never builds, installs or creates keys.

Only public disposable fixture tokens are accepted. Enter them through the app's
native dialog. Real keys must never be used with this harness.
"""
import argparse
import hmac
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

spec = importlib.util.spec_from_file_location("macos_package", Path(__file__).with_name("macos-package.py"))
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)
# Public, deliberately non-secret test inputs, accepted only by this loopback fixture.
SYNTHETIC = {"alpha": "loomlight-disposable-alpha", "beta": "loomlight-disposable-beta"}
SCHEDULE = {1: ["alpha", "alpha"], 2: ["alpha", "alpha"],
            3: ["alpha", "alpha", "beta", "beta"], 4: []}


def accepted_request(phase, index, method, path, authorization):
    expected = SCHEDULE[phase]
    return (index < len(expected) and method == "GET" and path == "/v1/models"
            and hmac.compare_digest(authorization, "Bearer " + SYNTHETIC[expected[index]]))


def check_transition(phase, current, previous):
    if phase not in SCHEDULE:
        raise ValueError("Unknown phase")
    if phase == 1:
        return
    if previous.get("passed") is not True or previous.get("phase") != phase - 1:
        raise ValueError("Previous phase did not pass; no automatic retry or continuation")
    old = previous["bundle"]
    if current["certificateSHA1"] != old["certificateSHA1"] or current["designatedRequirement"] != old["designatedRequirement"]:
        raise ValueError("Signing identity changed between launches")
    different = current["executableSHA256"] != old["executableSHA256"]
    if different != (phase == 3):
        raise ValueError("Only the update phase must change the executable")
    if (current["bundleVersion"] != old["bundleVersion"]) != (phase == 3):
        raise ValueError("Only the update phase must change version metadata")


def server_for(phase, port, events):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Never log Authorization, URLs, request contents or key bytes.

        def handle_request(self):
            index = len(events)
            accepted = accepted_request(phase, index, self.command, self.path,
                                        self.headers.get("Authorization", ""))
            events.append({"sequence": index + 1, "accepted": accepted})
            body = json.dumps({"data": [{"id": "loomlight-synthetic-model"}]} if accepted else {"error": "fixture refused"}).encode()
            self.send_response(200 if accepted else 403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        do_GET = handle_request
        do_POST = handle_request
        do_PUT = handle_request
        do_DELETE = handle_request
        do_HEAD = handle_request
        do_OPTIONS = handle_request

        def handle(self):
            self.connection.settimeout(2)
            super().handle()

    return HTTPServer(("127.0.0.1", port), Handler)


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def run(bundle, output, phase):
    if os.uname().sysname != "Darwin":
        raise ValueError("Real Mac packaged host required")
    bundle = bundle.resolve()
    output = output.resolve()
    pin = json.loads((package.APP / "src-tauri/macos-signing.json").read_text())["certificateSha1"]
    package.approved_fingerprint(pin)
    info = package.verify(bundle, pin, deadline=time.monotonic() + 30)
    # No second app process: single-instance redirection would invalidate this proof.
    running = subprocess.run(["pgrep", "-x", "loomlight"], capture_output=True, timeout=5)
    if running.returncode != 1:
        raise ValueError("Close all Loomlight processes before this explicitly approved launch")
    if any(k.startswith("LOOMLIGHT_") and ("PROBE" in k or "SMOKE" in k) for k in os.environ):
        raise ValueError("Clear inherited probe/smoke overrides")
    if phase == 1:
        output.mkdir(parents=True, exist_ok=False)
        state = {"root": tempfile.mkdtemp(prefix="loomlight-studio-identity-"),
                 "bundlePath": str(bundle), "port": 0}
    else:
        state = json.loads((output / "state.json").read_text())
        if state["bundlePath"] != str(bundle):
            raise ValueError("Update/reopen must use the same approved app path")
    previous = {} if phase == 1 else json.loads((output / f"phase-{phase-1}.json").read_text())
    check_transition(phase, info, previous)
    root = Path(state["root"])
    if root.parent.resolve() != Path(tempfile.gettempdir()).resolve() or not root.name.startswith("loomlight-studio-identity-"):
        raise ValueError("Isolated profile root refused")
    # Exclusive attempt marker prevents rerun after failures/ambiguous interruption.
    with (output / f"phase-{phase}-attempt.json").open("x") as marker:
        json.dump({"phase": phase, "bundle": info, "launchAllowance": 1,
                   "getAllowance": len(SCHEDULE[phase])}, marker)
    events = []
    server = server_for(phase, state["port"], events)
    state["port"] = server.server_port
    write(output / "state.json", state)
    worker = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
    worker.start()
    env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE="studio-settings",
               LOOMLIGHT_STUDIO_PROBE_ROOT=state["root"], LOOMLIGHT_STUDIO_IDENTITY_PHASE=str(phase),
               LOOMLIGHT_STUDIO_IDENTITY_ENDPOINT=f'http://127.0.0.1:{state["port"]}/v1')
    executable = bundle / "Contents/MacOS/loomlight"
    started = time.monotonic()
    result = {"phase": phase, "passed": False, "bundle": info, "timedOut": False}
    process = None
    try:
        with (output / f"phase-{phase}.log").open("wb") as log:
            process = subprocess.Popen([str(executable)], env=env, stdout=log, stderr=subprocess.STDOUT,
                                       start_new_session=True)
            write(output / f"phase-{phase}-launch.json", {"pid": process.pid, "executable": str(executable),
                                                        "root": state["root"], "phase": phase})
            try:
                result["exitCode"] = process.wait(timeout=300)
            except subprocess.TimeoutExpired:
                result["timedOut"] = True
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait(timeout=2)
                result["exitCode"] = process.returncode
        reports = []
        for line in (output / f"phase-{phase}.log").read_text(errors="replace").splitlines():
            try:
                report = json.loads(line)
                if isinstance(report, dict) and report.get("evidence") == "runtime-ui-packaged":
                    reports.append(report)
            except ValueError:
                pass
        result["reports"] = reports
        details = reports[0].get("details", {}) if len(reports) == 1 else {}
        result["passed"] = (result["exitCode"] == 0 and not result["timedOut"] and len(reports) == 1
                            and reports[0].get("passed") is True and reports[0].get("cleanupComplete") is True
                            and details.get("phase") == phase and details.get("stage") == "complete"
                            and details.get("localGets") == len(SCHEDULE[phase])
                            and details.get("processId") == process.pid
                            and details.get("executablePath") == str(executable)
                            and len(events) == len(SCHEDULE[phase]) and all(e["accepted"] for e in events))
    finally:
        if process is not None and process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=2)
        server.shutdown()
        server.server_close()
        worker.join(timeout=2)
        result["passed"] = result["passed"] and len(events) == len(SCHEDULE[phase]) and all(e["accepted"] for e in events)
        result["requests"] = events
        result["elapsedSeconds"] = round(time.monotonic() - started, 3)
        write(output / f"phase-{phase}.json", result)
    print(json.dumps(result), flush=True)
    if not result["passed"]:
        raise ValueError("Packaged phase failed; records retained, no retry")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--phase", type=int, choices=range(1, 5), required=True)
    args = parser.parse_args()
    run(args.bundle, args.output, args.phase)
