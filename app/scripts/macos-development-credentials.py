#!/usr/bin/env python3
"""Explicit manual packaged fixture. Never builds, signs, installs or writes API keys.

Only the checked-in public synthetic profile fixture is seeded. The app creates all
keys/ciphertext through native Settings. Exclusive attempts and ordered evidence
steps refuse repeats. Faults affect only that isolated synthetic root.
"""
import argparse
import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import stat
import subprocess
import tempfile
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

spec = importlib.util.spec_from_file_location("macos_package", Path(__file__).with_name("macos-package.py"))
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)
FIXTURE = package.APP / "tests/fixtures/macos-development-credentials.json"
FIXTURE_SHA = "9183cf3b359289ab495e52357bd8a271b3d69396a78cd6095a294cdca60e36ce"
SCHEDULE = {1: ["alpha", "alpha"], 2: ["alpha", "alpha"], 3: ["alpha", "beta", "eta"], 4: ["eta"]}
DEADLINES = {1: 300, 2: 120, 3: 900, 4: 180}
STEPS = {1: ["alpha-saved", "gamma-saved", "ui-checked"], 2: ["ui-checked"],
         3: ["reuse-checked", "beta-saved", "missing-record", "delta-saved", "key-loss",
             "epsilon-saved", "tamper", "zeta-saved", "block", "failed-save", "restore",
             "eta-saved", "cancelled", "theta-saved", "c-removed", "iota-saved", "b-key-removed", "ui-checked"],
         4: ["ui-checked"]}
IDS = {p: p*2 + "000000-0000-4000-8000-00000000000" + str(i) for i, p in enumerate("abc", 1)}


def fixture():
    raw = FIXTURE.read_bytes()
    if hashlib.sha256(raw).hexdigest() != FIXTURE_SHA:
        raise ValueError("Fixture changed; review/reapprove exact inputs")
    return json.loads(raw)


def reload_failure_environment(state):
    """Read-only preparation only. No launch, server, save or allowance renewal."""
    root = isolated_root(state)
    if snapshot(root)["store"] != fixture()["profileStore"] or (root / "credentials-dev").exists():
        raise ValueError("Reload fixture requires exact fresh public state")
    definition = json.loads((FIXTURE.parent / "macos-development-credential-reload-failure.json").read_text())
    selector = definition["selector"]
    if selector != dict(environmentVariable="LOOMLIGHT_STUDIO_DEV_RELOAD_FAILURE",
                        value="post-save-snapshot-once", runtimeMode="studio-settings", developmentPhase="1"):
        raise ValueError("Reload fixture selector changed; review required")
    return {"LOOMLIGHT_RUNTIME_UI_PROBE": selector["runtimeMode"],
            "LOOMLIGHT_STUDIO_PROBE_ROOT": str(root),
            "LOOMLIGHT_STUDIO_DEV_CREDENTIAL_PHASE": selector["developmentPhase"],
            selector["environmentVariable"]: selector["value"]}


def write(path, value, exclusive=False):
    with path.open("x" if exclusive else "w") as file:
        os.chmod(path, 0o600)
        json.dump(value, file, indent=2)
        file.write("\n")
        file.flush()
        os.fsync(file.fileno())


def accepted_request(phase, index, method, path, authorization):
    labels = SCHEDULE[phase]
    return (index < len(labels) and method == "GET" and path == "/v1/models"
            and hmac.compare_digest(authorization, "Bearer " + fixture()["nativeInputs"][labels[index]]))


def server_for(phase, events, output):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass
        def request(self):
            accepted = accepted_request(phase, len(events), self.command, self.path,
                                        self.headers.get("Authorization", ""))
            events.append({"sequence": len(events) + 1, "accepted": accepted})
            write(output / f"phase-{phase}-requests.json", events)
            body = json.dumps({"data": [{"id": "loomlight-public-synthetic"}]} if accepted else {"error": "fixture refused"}).encode()
            self.send_response(200 if accepted else 403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        do_GET = request
        do_POST = request
        do_PUT = request
        do_DELETE = request
        do_HEAD = request
        do_OPTIONS = request
        def handle(self):
            self.connection.settimeout(2)
            super().handle()
    return HTTPServer(("127.0.0.1", 46081), Handler)


def isolated_root(state):
    root = Path(state["root"])
    if (root.parent != Path(tempfile.gettempdir()) or not root.name.startswith("loomlight-studio-dev-credentials-")
            or root.is_symlink() or not root.is_dir()):
        raise ValueError("Isolated fixture root refused")
    return root


def snapshot(root):
    metadata = root.lstat()
    if root.is_symlink() or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o700:
        raise ValueError("Private fixture root required")
    profile = json.loads((root / "ai-profiles.json").read_text())
    files = {}
    for path in sorted(root.rglob("*")):
        metadata = path.lstat()
        if stat.S_ISLNK(metadata.st_mode) or not (stat.S_ISREG(metadata.st_mode) or stat.S_ISDIR(metadata.st_mode)):
            raise ValueError("Unsupported fixture entry")
        if (metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != (0o700 if path.is_dir() else 0o600)
                or (path.is_file() and metadata.st_nlink != 1)):
            raise ValueError("Private fixture permissions failed")
        files[str(path.relative_to(root))] = {"mode": oct(stat.S_IMODE(metadata.st_mode)), "size": metadata.st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None}
    # Settings are immutable during this sequence; only credential/disabled state changes.
    original = {p["profileId"]: p["settings"] for p in fixture()["profileStore"]["profiles"]}
    for p in profile["profiles"]:
        if p["settings"] != original[p["profileId"]]:
            raise ValueError("Profile settings changed unexpectedly")
    return {"store": profile, "files": files}


def active(snapshot_value, label="a"):
    return next(p for p in snapshot_value["store"]["profiles"] if p["profileId"] == IDS[label])


def paths(root, snap, label="a"):
    credential = active(snap, label)["credential"]
    generation = root / "credentials-dev/generations" / str(uuid.UUID(credential["storage"]["generationId"]))
    return generation / "master.key", generation / "records" / (str(uuid.UUID(credential["credentialId"])) + ".sealed")


def confirmed_save(root, current, previous, label):
    profile, old = active(current, label), active(previous, label)
    credential = profile["credential"]
    if not isinstance(credential, dict) or credential == old["credential"]:
        raise ValueError("Save did not publish a new credential")
    storage = credential.get("storage", {})
    generation = storage.get("generationId")
    if (storage.get("kind") != "developmentFile" or current["store"]["schemaVersion"] != 2
            or generation not in current["store"].get("developmentGenerations", [])
            or generation != current["store"].get("activeDevelopmentGeneration")
            or profile["disabled"] or profile["revision"] != old["revision"] + 1
            or credential.get("revision") != (old["credential"]["revision"] + 1 if old["credential"] else 1)
            or credential.get("origin") != "http://127.0.0.1:46081"):
        raise ValueError("Confirmed save reference invalid")
    for value in [generation, credential.get("credentialId")]:
        parsed = uuid.UUID(value)
        if parsed.version != 4 or str(parsed) != value:
            raise ValueError("Confirmed save identity invalid")
    key, record = paths(root, current, label)
    for path, minimum, maximum, header in [(key, 38, 38, b"LLKEY\x01"), (record, 47, 4142, b"LLREC\x01")]:
        if not path.is_file() or not minimum <= path.stat().st_size <= maximum:
            raise ValueError("Confirmed save storage missing or malformed")
        with path.open("rb") as file:
            if file.read(6) != header:
                raise ValueError("Confirmed save storage format invalid")


def check_transition(phase, current, previous):
    if phase not in SCHEDULE:
        raise ValueError("Unknown phase")
    if phase == 1:
        return
    if previous.get("passed") is not True or previous.get("phase") != phase - 1:
        raise ValueError("Previous phase failed; no automatic continuation")
    old = previous["bundle"]
    if any(current[key] != old[key] for key in ["certificateSHA1", "designatedRequirement", "identifier"]):
        raise ValueError("Permanent signed identity changed")
    if any((current[key] != old[key]) != (phase == 3) for key in ["executableSHA256", "bundleVersion"]):
        raise ValueError("Only phase 3 must use a different executable/version")


def step(output, phase, name):
    state = json.loads((output / "state.json").read_text())
    root = isolated_root(state)
    launch = json.loads((output / f"phase-{phase}-launch.json").read_text())
    if (output / f"phase-{phase}.json").exists() or time.time() > launch["deadlineUnix"]:
        raise ValueError("Phase finished/deadline expired")
    index = STEPS[phase].index(name)
    target = output / f"phase-{phase}-step-{index+1}.json"
    if target.exists() or (index and not (output / f"phase-{phase}-step-{index}.json").exists()):
        raise ValueError("Repeated/out-of-order step refused")
    before = snapshot(root)
    previous = json.loads((output / f"phase-{phase}-step-{index}.json").read_text())["snapshot"] if index else json.loads((output / f"phase-{phase}-before.json").read_text())
    if name.endswith("-saved") and name != "failed-save":
        label = "b" if name in ["gamma-saved", "iota-saved"] else "c" if name == "theta-saved" else "a"
        confirmed_save(root, before, previous, label)
    if name in ["failed-save", "restore", "cancelled"] and before["store"] != previous["store"]:
        raise ValueError("Failed/cancelled save changed profile reference/settings")
    if name == "cancelled" and before != previous:
        raise ValueError("Cancelled entry changed persistent files")
    if name in ["epsilon-saved", "zeta-saved"]:
        gamma = json.loads((output / "phase-1-step-2.json").read_text())["snapshot"]
        if active(before, "b") != active(gamma, "b"):
            raise ValueError("Shared-generation recovery changed B")
        if active(before)["credential"]["storage"] == active(previous)["credential"]["storage"]:
            raise ValueError("Damaged generation was reused")
    if name == "iota-saved" and active(before, "b")["credential"]["storage"]["generationId"] != before["store"]["activeDevelopmentGeneration"]:
        raise ValueError("B did not recover into active healthy generation")
    if name == "c-removed" and any(p["profileId"] == IDS["c"] for p in before["store"]["profiles"]):
        raise ValueError("Removed C still published")
    if name == "b-key-removed" and (active(before, "b")["credential"] is not None or not active(before, "b")["disabled"]):
        raise ValueError("B removal did not disable/unpublish credential")
    if name == "ui-checked":
        native = [c for c in before["store"]["cleanup"] if "storage" not in c["credential"]]
        if not any(c["profileId"].startswith("dd") and c["credential"].get("service") == "app.loomlight" for c in native):
            raise ValueError("New-service native cleanup ownership lost")
        if phase in [3, 4] and not any(c["profileId"] == IDS["c"] and "service" not in c["credential"] for c in native):
            raise ValueError("Legacy native cleanup ownership lost")
    if name == "delta-saved" and active(before)["credential"]["storage"] != active(previous)["credential"]["storage"]:
        raise ValueError("Missing record failed healthy-generation reuse")
    key, record = paths(root, before) if phase == 3 else (None, None)
    retained = output / "retained"
    retained.mkdir(mode=0o700, exist_ok=True)
    if name == "missing-record":
        shutil.copy2(record, retained / "missing-record.sealed")
        record.unlink()
    elif name == "key-loss":
        key.rename(retained / "lost-master.key")
    elif name == "tamper":
        shutil.copy2(record, retained / "before-tamper.sealed")
        raw = bytearray(record.read_bytes()); raw[-1] ^= 1
        record.write_bytes(raw)
        shutil.copy2(record, retained / "after-tamper.sealed")
    elif name == "block":
        record.parent.rename(record.parent.with_name("records-retained"))
        record.parent.write_bytes(b"public synthetic obstruction\n")
        record.parent.chmod(0o600)
    elif name == "restore":
        if record.parent.read_bytes() != b"public synthetic obstruction\n":
            raise ValueError("Fixture obstruction changed")
        record.parent.unlink()
        record.parent.with_name("records-retained").rename(record.parent)
    elif name in ["reuse-checked", "ui-checked"] and phase in [2, 4]:
        if before != previous:
            raise ValueError("Reopen changed persistent fixture")
    after = snapshot(root)
    write(target, {"phase": phase, "step": name, "nativeUiObserved": True, "snapshot": after}, exclusive=True)
    print(json.dumps({"step": name, "recorded": True}), flush=True)


def inherited_fixture_overrides(environment):
    return any(k.startswith("LOOMLIGHT_") and any(marker in k for marker in
               ("PROBE", "SMOKE", "CREDENTIAL_PHASE", "RELOAD_FAILURE")) for k in environment)


def run(bundle, output, phase):
    if os.uname().sysname != "Darwin":
        raise ValueError("Actual Mac packaged host required")
    bundle, output = bundle.resolve(), output.resolve()
    pin = package.approved_fingerprint(json.loads((package.APP / "src-tauri/macos-signing.json").read_text())["certificateSha1"])
    info = package.verify(bundle, pin, deadline=time.monotonic() + 30)
    if subprocess.run(["pgrep", "-x", "loomlight"], capture_output=True, timeout=5).returncode != 1:
        raise ValueError("Existing Loomlight process; no launch")
    if inherited_fixture_overrides(os.environ):
        raise ValueError("Inherited fixture overrides refused")
    if phase == 1:
        output.mkdir(mode=0o700, parents=True, exist_ok=False)
        root = Path(tempfile.gettempdir()) / ("loomlight-studio-dev-credentials-" + str(uuid.uuid4()))
        root.mkdir(mode=0o700)
        write(root / "ai-profiles.json", fixture()["profileStore"], exclusive=True)
        state = {"root": str(root), "bundlePath": str(bundle), "fixtureSHA256": FIXTURE_SHA}
        write(output / "state.json", state, exclusive=True)
    else:
        state = json.loads((output / "state.json").read_text())
        if state["bundlePath"] != str(bundle) or state["fixtureSHA256"] != FIXTURE_SHA:
            raise ValueError("Same path/fixture required")
    previous = {} if phase == 1 else json.loads((output / f"phase-{phase-1}.json").read_text())
    check_transition(phase, info, previous)
    root = isolated_root(state)
    write(output / f"phase-{phase}-attempt.json", {"phase": phase, "bundle": info, "deadlineSeconds": DEADLINES[phase], "getAllowance": len(SCHEDULE[phase])}, exclusive=True)
    write(output / f"phase-{phase}-before.json", snapshot(root), exclusive=True)
    events = []
    server = server_for(phase, events, output)  # Fixed port: conflict refuses; no retry.
    worker = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
    worker.start()
    env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE="studio-settings", LOOMLIGHT_STUDIO_PROBE_ROOT=str(root), LOOMLIGHT_STUDIO_DEV_CREDENTIAL_PHASE=str(phase))
    executable = bundle / "Contents/MacOS/loomlight"
    started = time.monotonic()
    result = {"phase": phase, "passed": False, "bundle": info, "timedOut": False}
    process = None
    try:
        with (output / f"phase-{phase}.log").open("xb") as log:
            process = subprocess.Popen([str(executable)], env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            write(output / f"phase-{phase}-launch.json", {"pid": process.pid, "executable": str(executable), "deadlineUnix": time.time()+DEADLINES[phase]}, exclusive=True)
            print(json.dumps({"phase": phase, "pid": process.pid, "ready": True, "deadlineSeconds": DEADLINES[phase]}), flush=True)
            try:
                result["exitCode"] = process.wait(timeout=DEADLINES[phase])
            except subprocess.TimeoutExpired:
                result["timedOut"] = True
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=2)
                result["exitCode"] = process.returncode
        result["snapshot"] = snapshot(root)
        result["stepsComplete"] = all((output / f"phase-{phase}-step-{i+1}.json").is_file() for i in range(len(STEPS[phase])))
        result["passed"] = result["exitCode"] == 0 and not result["timedOut"] and result["stepsComplete"] and len(events) == len(SCHEDULE[phase]) and all(e["accepted"] for e in events)
    finally:
        if process is not None and process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL); process.wait(timeout=2)
        server.shutdown(); server.server_close(); worker.join(timeout=2)
        result["requests"] = events
        result["elapsedSeconds"] = round(time.monotonic()-started, 3)
        result["processStopped"] = process is not None and process.poll() is not None
        write(output / f"phase-{phase}.json", result, exclusive=True)
    print(json.dumps({k: v for k, v in result.items() if k != "snapshot"}), flush=True)
    if not result["passed"]:
        raise ValueError("Native phase failed; preserve evidence, no retry/next phase")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--phase", type=int, choices=range(1, 5), required=True)
    parser.add_argument("--step")
    args = parser.parse_args()
    if args.step:
        step(args.output.resolve(), args.phase, args.step)
    elif args.bundle:
        run(args.bundle, args.output, args.phase)
    else:
        parser.error("--bundle required for launch")
