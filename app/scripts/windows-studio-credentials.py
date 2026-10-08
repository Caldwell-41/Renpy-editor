"""Bounded public Windows fixture; native dialog input uses Computer Use separately.

No installer execution, real credential, native enumeration, or automatic retry.
Receipts/packages are ignored. A started build/launch cannot be repeated.
"""
import argparse
from collections import Counter
import copy
import ctypes
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import uuid

APP = Path(__file__).resolve().parents[1]
FIXTURE = APP / "tests/fixtures/windows-studio-credentials.json"
OUTPUT = APP / ".toolchains/windows-studio"
A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
KEYS = {"alpha": "loomlight-public-windows-alpha", "beta": "loomlight-public-windows-beta",
        "gamma": "loomlight-public-windows-gamma"}
SCHEDULE = {1: ["alpha", "alpha"], 2: ["alpha", "beta"]}
BUILD_SECONDS = 1200
RUN_SECONDS = 300
COMMON_CHECKS = ["Fixed Windows phase selected", "Shared v2 profiles and foreign cleanup retained",
                 "Explicit authenticated discovery completed in this action", "Explicit authenticated discovery completed in this action",
                 "Discovery did not persist profile changes", "Discovery did not persist profile changes", "WebView contains no secret field"]
CHECKS = {
    1: COMMON_CHECKS + ["Initial fixture has no native keys", "Retained-field Retry saved A while foreign cleanup remained pending",
                        "Failed native entry then Cancel preserved complete redacted snapshot"],
    2: COMMON_CHECKS + ["Full process reopen reused both remembered keys without discovery", "Replacement preserved B and retired only owned A",
                        "Removal disabled A and preserved B", "All Windows keys/profiles removed; foreign owned cleanup retained"],
}

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def write(path, value, exclusive=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x" if exclusive else "w", encoding="utf-8") as file:
        json.dump(value, file, indent=2)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def root_from_state():
    root = Path(read(OUTPUT / "state.json")["root"]).resolve()
    if root.parent != Path(tempfile.gettempdir()).resolve() or not root.name.startswith("loomlight-studio-windows-") or root.is_symlink():
        raise ValueError("Synthetic root refused")
    return root

def validate_saved(old, next_store, profile):
    before = next(p for p in old["profiles"] if p["profileId"] == profile)
    after = next(p for p in next_store["profiles"] if p["profileId"] == profile)
    c = after["credential"]
    if (after["settings"] != before["settings"] or after["disabled"] or after["revision"] != before["revision"] + 1
            or not isinstance(c, dict) or c == before["credential"] or "storage" in c
            or set(c) - {"credentialId", "origin", "revision", "service"}
            or c.get("service", "app.loomlight.desktop.ai.v1") != "app.loomlight.desktop.ai.v1"
            or c.get("origin") != "http://127.0.0.1:46082"
            or c.get("revision") != (before["credential"]["revision"] + 1 if before["credential"] else 1)):
        raise ValueError("Native save gate refused")
    parsed = uuid.UUID(c["credentialId"])
    if str(parsed) != c["credentialId"] or parsed.version != 4:
        raise ValueError("Unowned native identity")
    if before["credential"] and c["credentialId"] == before["credential"]["credentialId"]:
        raise ValueError("Replacement reused a retired identity")
    # This fixed fixture stages/publishes (+2), then removes a retired native
    # reference (+1 on replacement). Compare the entire expected store so extra,
    # duplicate/reordered profiles and unrelated/unknown fields cannot pass.
    expected = copy.deepcopy(old)
    expected["revision"] += 3 if before["credential"] else 2
    saved = next(p for p in expected["profiles"] if p["profileId"] == profile)
    saved.update(credential=c, revision=before["revision"] + 1, disabled=False)
    if next_store != expected:
        raise ValueError("Complete native save snapshot changed unexpectedly")

def check_report(phase, report, requests, code):
    if (code != 0 or report.get("passed") is not True or report.get("cleanupComplete") is not True
            or report.get("evidence") != "runtime-ui-packaged" or report.get("case") != "studio-settings"
            or report.get("details", {}).get("passed") is not True
            or report.get("details", {}).get("stage") != "complete" or report["details"].get("phase") != phase
            or Counter(report["details"].get("checks", [])) != Counter(CHECKS[phase])
            or len(requests) != 2 or any(r.get("accepted") is not True or r.get("method") != "GET"
                                       or r.get("path") != "/v1/models" for r in requests)
            or [r["label"] for r in requests] != SCHEDULE[phase]):
        raise ValueError("Native report/count/deadline gate refused")

def check_cancel_report(report, requests, code, before, after, observed):
    status = "Credential entry cancelled; saved profile unchanged."
    details = report.get("details", {})
    # The unchanged packaged phase expects a Save, so it deliberately rejects a
    # Cancel. Accept only this separately selected zero-GET Cancel assertion; keep
    # the packaged full-flow result false in its terminal receipt.
    if (code != 1 or report.get("passed") is not False or report.get("cleanupComplete") is not True
            or report.get("evidence") != "runtime-ui-packaged" or report.get("case") != "studio-settings"
            or details.get("passed") is not False
            or requests != [] or details.get("phase") != 1 or details.get("stage") != "alpha-entry"
            or details.get("nativeStatus") != status or details.get("error") != "Error: Native entry result: " + status
            or Counter(details.get("checks", [])) != Counter(["Fixed Windows phase selected",
                "Shared v2 profiles and foreign cleanup retained", "Initial fixture has no native keys"])
            or before != after or observed != {"failedSaveRetainedInput": True, "cancelAfterExactRestore": True}):
        raise ValueError("Targeted Cancel proof refused")

def native_present(profile):
    c = profile["credential"]
    # Audit only exact synthetic app-created identities from this fixture's own
    # snapshots. Never enumerate or return/read a blob into Python/renderer data.
    if profile["profileId"] not in [A, B] or "storage" in c or c.get("service", "app.loomlight.desktop.ai.v1") != "app.loomlight.desktop.ai.v1" or c["origin"] != "http://127.0.0.1:46082":
        raise ValueError("Native audit ownership refused")
    identity = uuid.UUID(c["credentialId"])
    if identity.version != 4 or str(identity) != c["credentialId"]:
        raise ValueError("Native audit identity refused")
    target = "app.loomlight.desktop.ai.v1/provider/" + profile["profileId"] + "/" + c["credentialId"]
    api = ctypes.WinDLL("advapi32", use_last_error=True)
    api.CredReadW.argtypes = [ctypes.c_wchar_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.POINTER(ctypes.c_void_p)]
    api.CredFree.argtypes = [ctypes.c_void_p]
    pointer = ctypes.c_void_p()
    if api.CredReadW(target, 1, 0, ctypes.byref(pointer)):
        api.CredFree(pointer)
        return True
    if ctypes.get_last_error() == 1168:
        return False
    raise ValueError("Native audit unavailable")

def prepare():
    if (OUTPUT / "state.json").exists():
        raise ValueError("Fixture already prepared; do not renew")
    root = Path(tempfile.mkdtemp(prefix="loomlight-studio-windows-"))
    (root / "ai-profiles.json").write_bytes(FIXTURE.read_bytes())
    write(OUTPUT / "state.json", {"root": str(root), "fixtureSha256": sha(FIXTURE)}, exclusive=True)
    print(json.dumps({"prepared": True, "root": str(root), "builds": 0, "runs": 0, "gets": 0}))

def source_inputs():
    paths = [APP / name for name in ["Cargo.lock", "Cargo.toml", "package-lock.json",
             "package.json", "index.html", "vite.config.ts", "tsconfig.json", "rust-toolchain.toml"]]
    paths += [FIXTURE, Path(__file__)]
    for directory in [APP / "src", APP / "src-core", APP / "src-tauri"]:
        paths += [p for p in directory.rglob("*") if p.is_file()
                  and not any(part in ["gen", "target"] for part in p.relative_to(APP).parts)]
    for directory in [APP / "public", APP / ".cargo"]:
        if directory.exists():
            paths += [p for p in directory.rglob("*") if p.is_file()]
    return {str(p.relative_to(APP)).replace("\\", "/"): sha(p) for p in sorted(set(paths))}

def package_inputs_match(packaged, current):
    # Only this external runner can change without rebuilding. Every packaged
    # runtime/probe/schema/dependency input must still match the build receipt.
    controller = "scripts/windows-studio-credentials.py"
    required = {"Cargo.lock", "Cargo.toml", "package-lock.json", "package.json", "index.html",
                "vite.config.ts", "tsconfig.json", "rust-toolchain.toml",
                "src-tauri/Cargo.toml", "src-tauri/build.rs", "src-tauri/tauri.conf.json",
                "tests/fixtures/windows-studio-credentials.json"}
    if not required.issubset(packaged) or not required.issubset(current):
        return False
    return ({k: v for k, v in packaged.items() if k != controller}
            == {k: v for k, v in current.items() if k != controller})

def run_prefix(run, phase):
    choices = {(1, 1): "phase-1", (2, 1): "phase-1-retry",
               (3, 1): "phase-1-final", (3, 2): "phase-2", (4, 2): "phase-2",
               (5, 1): "phase-1-cancel-proof"}
    if (run, phase) not in choices:
        raise ValueError("Recorded run/phase selection required")
    return choices[(run, phase)]

def validate_partial_entry(receipt, alpha, gamma):
    # Preserve the failed entry-flow result. This only qualifies its two saved
    # snapshots as inputs to an independent reopen; it never accepts Cancel proof.
    report = receipt.get("report", {})
    details = report.get("details", {})
    if (receipt.get("run") != 3 or receipt.get("passed") is not False
            or receipt.get("exitCode") != 1 or receipt.get("stopped") is not True
            or receipt.get("requests") != [] or not 0 < receipt.get("elapsedSeconds", 0) <= RUN_SECONDS
            or report.get("cleanupComplete") is not True or report.get("passed") is not False
            or report.get("evidence") != "runtime-ui-packaged" or report.get("case") != "studio-settings"
            or details.get("passed") is not False
            or details.get("phase") != 1 or details.get("stage") != "cancel-entry"
            or details.get("error") != "Error: Timeout: cancel-entry"
            or Counter(details.get("checks", [])) != Counter(["Fixed Windows phase selected",
                "Shared v2 profiles and foreign cleanup retained", "Initial fixture has no native keys",
                "Retained-field Retry saved A while foreign cleanup remained pending"])):
        raise ValueError("Partial entry state refused; failed evidence remains failed")
    validate_saved(read(FIXTURE), alpha, A)
    validate_saved(alpha, gamma, B)

def build(number):
    # Exclusive identities preserve the first package and failed native receipt.
    # Calling this does not grant another operation beyond the selected ledger.
    if number not in (1, 2):
        raise ValueError("Recorded build 1 or 2 required; allowance is not renewed")
    inputs = source_inputs()
    write(OUTPUT / f"build-{number}-attempt.json", {"deadlineSeconds": BUILD_SECONDS, "sourceInputs": inputs}, exclusive=True)
    started = time.monotonic()
    command = [shutil.which("node"), str(APP / "node_modules/@tauri-apps/cli/tauri.js"),
               "build", "--bundles", "nsis", "--", "--locked"]
    with (OUTPUT / f"build-{number}.log").open("w", encoding="utf-8") as log:
        process = subprocess.Popen(command, cwd=APP, stdout=log, stderr=subprocess.STDOUT)
        try:
            code = process.wait(timeout=BUILD_SECONDS)
        except subprocess.TimeoutExpired:
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], stdout=log, stderr=subprocess.STDOUT, timeout=2, check=False)
            process.wait(timeout=2)
            raise ValueError("Package deadline exceeded; owned build tree terminated, no retry")
    if code or source_inputs() != inputs:
        raise ValueError("Package failed or source inputs changed; no automatic retry")
    source = Path(os.environ["CARGO_TARGET_DIR"]) / "release/loomlight.exe"
    destination = OUTPUT / f"package-{number}/loomlight.exe"
    destination.parent.mkdir()
    shutil.copy2(source, destination)
    installer = Path(os.environ["CARGO_TARGET_DIR"]) / "release/bundle/nsis/Loomlight_0.1.0_x64-setup.exe"
    shutil.copy2(installer, destination.parent / installer.name)
    receipt = {"passed": True, "elapsedSeconds": time.monotonic() - started, "executable": str(destination),
               "sha256": sha(destination), "bytes": destination.stat().st_size, "sourceInputs": inputs}
    receipt["installerSha256"] = sha(destination.parent / installer.name)
    write(OUTPUT / f"build-{number}.json", receipt, exclusive=True)
    print(json.dumps({k: v for k, v in receipt.items() if k != "sourceInputs"}))

def launch(phase, run, build_number, resume_partial=False, cancel_only=False):
    root = root_from_state()
    prefix = run_prefix(run, phase)
    if cancel_only:
        if (run, phase, build_number) != (5, 1, 2) or resume_partial or read(root / "ai-profiles.json") != read(FIXTURE):
            raise ValueError("Targeted Cancel requires explicit run 5, package 2 and exact empty-key fixture")
        if not read(OUTPUT / "phase-2.json").get("passed"):
            raise ValueError("Owned removal must already be proved before Cancel follow-up")
    elif run == 5:
        raise ValueError("Run 5 is only the separately approved targeted Cancel follow-up")
    before_cancel = (root / "ai-profiles.json").read_bytes() if cancel_only else None
    schedule = [] if cancel_only else SCHEDULE[phase]
    prior = "phase-1-final" if run == 4 else "phase-1-retry"
    if resume_partial:
        if (run, phase, build_number) != (4, 2, 2):
            raise ValueError("Partial resume is fixed to approved run 4/package 2")
        alpha = read(root / ".studio-windows-1-alpha-saved.json")
        gamma = read(root / ".studio-windows-1-gamma-saved.json")
        validate_partial_entry(read(OUTPUT / "phase-1-final.json"), alpha, gamma)
        readiness = read(OUTPUT / "run-4-partial-readiness.json")
        if read(root / "ai-profiles.json") != gamma or readiness != {"run":4,"priorPassed":False,"nativeKeysPresent":2,"restoredSha256":sha(root / "ai-profiles.json"),"cancelProof":False}:
            raise ValueError("Partial restored/native readiness refused")
    elif phase == 2 and not read(OUTPUT / f"{prior}.json").get("passed"):
        raise ValueError("First native phase must pass")
    package = read(OUTPUT / f"build-{build_number}.json")
    executable = Path(package["executable"])
    current_inputs = source_inputs()
    if sha(executable) != package["sha256"] or not package_inputs_match(package["sourceInputs"], current_inputs):
        raise ValueError("Tested package/source identity changed")
    if sha(FIXTURE) != read(OUTPUT / "state.json")["fixtureSha256"]:
        raise ValueError("Fixture identity changed")
    # This lightweight process inventory never launches an app or inspects its data.
    processes = subprocess.run(["tasklist", "/FI", "IMAGENAME eq loomlight.exe", "/FO", "CSV", "/NH"], capture_output=True, text=True, check=True).stdout
    if '"loomlight.exe"' in processes.lower():
        raise ValueError("A Loomlight process is already running; preserve its ownership")
    requests = []
    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass
        def do_GET(self):
            index = len(requests)
            label = schedule[index] if index < len(schedule) else "over-budget"
            accepted = self.path == "/v1/models" and index < len(schedule) and self.headers.get("Authorization") == "Bearer " + KEYS.get(label, "refused")
            requests.append({"method": "GET", "path": "/v1/models" if self.path == "/v1/models" else "refused-path", "label": label, "accepted": accepted})
            body = json.dumps({"data": [{"id": "loomlight-synthetic-model"}]} if accepted else {"error": "fixture refused"}).encode()
            self.send_response(200 if accepted else 403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 46082), Handler)
    server.daemon_threads = True
    write(OUTPUT / f"{prefix}-attempt.json", {"run": run, "phase": phase, "deadlineSeconds": RUN_SECONDS,
          "getAllowance": len(schedule), "packageSha256": package["sha256"], "packagedInputsMatch": True,
          "partialEntryResume": resume_partial,
          "targetedCancelOnly": cancel_only,
          "builtControllerSha256": package["sourceInputs"]["scripts/windows-studio-credentials.py"],
          "currentControllerSha256": current_inputs["scripts/windows-studio-credentials.py"]}, exclusive=True)
    env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE="studio-settings", LOOMLIGHT_STUDIO_PROBE_ROOT=str(root), LOOMLIGHT_STUDIO_WINDOWS_PHASE=str(phase))
    started = time.monotonic()
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with (OUTPUT / f"{prefix}.stdout.log").open("w", encoding="utf-8") as out, (OUTPUT / f"{prefix}.stderr.log").open("w", encoding="utf-8") as err:
            process = subprocess.Popen([str(executable)], env=env, stdout=out, stderr=err)
            write(OUTPUT / f"{prefix}-launch.json", {"run": run, "pid": process.pid, "deadlineUnix": time.time() + RUN_SECONDS, "executable": str(executable)}, exclusive=True)
            print(json.dumps({"phase": phase, "pid": process.pid, "deadlineSeconds": RUN_SECONDS}), flush=True)
            try:
                code = process.wait(timeout=RUN_SECONDS)
            except subprocess.TimeoutExpired:
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True, timeout=2, check=False)
                process.wait(timeout=2)
                code = -1
        elapsed = time.monotonic() - started
        reports = [json.loads(line) for line in (OUTPUT / f"{prefix}.stdout.log").read_text().splitlines() if line.startswith('{')]
        report = next((r for r in reports if r.get("evidence") == "runtime-ui-packaged"), {})
        passed = False
        try:
            if cancel_only:
                check_cancel_report(report, requests, code, before_cancel, (root / "ai-profiles.json").read_bytes(),
                                    read(OUTPUT / "phase-1-cancel-proof-observed.json"))
            else:
                check_report(phase, report, requests, code)
            if elapsed > RUN_SECONDS:
                raise ValueError("Launch deadline exceeded")
            fixture = read(FIXTURE)
            if cancel_only:
                pass
            elif phase == 1:
                alpha = read(root / ".studio-windows-1-alpha-saved.json")
                gamma = read(root / ".studio-windows-1-gamma-saved.json")
                validate_saved(fixture, alpha, A)
                validate_saved(alpha, gamma, B)
                if gamma != read(root / ".studio-windows-1-cancelled.json"):
                    raise ValueError("Cancel changed profile snapshot")
                if not all(native_present(p) for p in gamma["profiles"]):
                    raise ValueError("Two native entries must remain for reopen")
            else:
                reopened = read(root / ".studio-windows-2-reopened.json")
                previous = ".studio-windows-1-gamma-saved.json" if resume_partial else ".studio-windows-1-complete.json"
                if reopened != read(root / previous):
                    raise ValueError("Reopen changed profiles")
                validate_saved(reopened, read(root / ".studio-windows-2-beta-saved.json"), A)
                final = read(root / "ai-profiles.json")
                if final["profiles"] or final["cleanup"] != fixture["cleanup"] or final["developmentGenerations"] != fixture["developmentGenerations"]:
                    raise ValueError("Final owned removal gate refused")
                beta = read(root / ".studio-windows-2-beta-saved.json")
                identities = [reopened["profiles"][0], beta["profiles"][0], beta["profiles"][1]]
                if any(native_present(p) for p in identities):
                    raise ValueError("Retired/removed native entries still present")
            passed = True
        finally:
            write(OUTPUT / f"{prefix}.json", {"passed": passed, "run": run, "exitCode": code, "stopped": process.poll() is not None,
                  "elapsedSeconds": elapsed, "requests": requests, "report": report}, exclusive=True)
            if cancel_only:
                write(OUTPUT / "targeted-cancel-result.json", {"cancelProofPassed":passed,
                      "packagedFullFlowPassed":False,"run":5,"gets":len(requests),"sameSnapshot":before_cancel==(root / "ai-profiles.json").read_bytes()}, exclusive=True)
            print(json.dumps({"passed": passed, "phase": phase, "exitCode": code, "elapsedSeconds": elapsed, "gets": len(requests)}), flush=True)
    finally:
        server.shutdown()
        server.server_close()

def fault(action, name):
    root = root_from_state()
    prefix = next((p for p in ["phase-1-cancel-proof", "phase-1-final", "phase-1-retry", "phase-1"] if (OUTPUT / f"{p}-launch.json").exists()), None)
    if prefix is None:
        raise ValueError("No recorded native launch")
    launch = read(OUTPUT / f"{prefix}-launch.json")
    if (OUTPUT / f"{prefix}.json").exists() or time.time() >= launch["deadlineUnix"]:
        raise ValueError("Native phase finished or deadline expired")
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [ctypes.c_uint32, ctypes.c_int, ctypes.c_uint32]
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint32)]
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    handle = kernel.OpenProcess(0x1000, 0, launch["pid"])
    code = ctypes.c_uint32()
    try:
        if not handle or not kernel.GetExitCodeProcess(handle, ctypes.byref(code)) or code.value != 259:
            raise ValueError("Recorded native process is no longer live")
    finally:
        if handle: kernel.CloseHandle(handle)
    if name not in ["alpha", "cancel"]:
        raise ValueError("Fixed failure step required")
    marker = read(root / ".studio-windows-step.json")
    if marker != {"phase": "1", "step": name + "-entry"}:
        raise ValueError("Native entry step not current")
    profiles = root / "ai-profiles.json"
    fault_name = (prefix + "-" + name) if prefix in ["phase-1-final", "phase-1-cancel-proof"] else name
    backup = OUTPUT / (fault_name + "-before.bin")
    if action == "corrupt":
        with backup.open("xb") as file:
            file.write(profiles.read_bytes())
        if name == "alpha":
            changed = b"public synthetic unreadable-record fixture"
        else:
            store = json.loads(backup.read_bytes())
            store["profiles"][0]["settings"]["endpoint"] = "http://127.0.0.1:46083/v1"
            changed = json.dumps(store).encode()
        profiles.write_bytes(changed)
        write(OUTPUT / (fault_name + "-fault.json"), {"faultSha256": sha(profiles), "kind": "unreadable-record" if name == "alpha" else "stale-origin"}, exclusive=True)
    else:
        if sha(profiles) != read(OUTPUT / (fault_name + "-fault.json"))["faultSha256"]:
            raise ValueError("Unexpected external record changed; refuse restoration")
        profiles.write_bytes(backup.read_bytes())
        write(OUTPUT / (fault_name + "-restored.json"), {"restoredSha256": sha(profiles)}, exclusive=True)
    print(json.dumps({"action": action, "step": name, "completed": True}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "build", "launch", "corrupt", "restore"])
    parser.add_argument("--phase", type=int, choices=[1, 2])
    parser.add_argument("--run", type=int, choices=[1, 2, 3, 4, 5])
    parser.add_argument("--build", type=int, choices=[1, 2])
    parser.add_argument("--step", choices=["alpha", "cancel"])
    parser.add_argument("--resume-partial-entry", action="store_true")
    parser.add_argument("--cancel-only", action="store_true")
    args = parser.parse_args()
    if args.action == "prepare": prepare()
    elif args.action == "build": build(args.build)
    elif args.action == "launch": launch(args.phase, args.run, args.build, args.resume_partial_entry, args.cancel_only)
    else: fault(args.action, args.step)
