"""Bounded independent packaged Runtime UI scenarios; all results retained on failure."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import threading
import shutil
import hashlib

from runtime_probe_cases import RUNTIME_CASES, OPTIONAL_CASES

executable = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
failed = False
allowed = RUNTIME_CASES + OPTIONAL_CASES
cases = sys.argv[3:] or RUNTIME_CASES
if any(case not in allowed for case in cases):
    raise SystemExit("Unknown runtime UI case")
for case in cases:
    started = time.monotonic()
    log = output / f"runtime-ui-{case}.log"
    env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE=case)
    env.pop("LOOMLIGHT_SCAFFOLD_SMOKE", None)
    env.pop("LOOMLIGHT_SINGLE_INSTANCE_SMOKE", None)
    timed_out = False
    with log.open("wb") as stream:
        process = subprocess.Popen([str(executable)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   start_new_session=os.name != "nt")
        external_errors = []
        def retain_output():
            for line in process.stdout:
                stream.write(line); stream.flush()
                try:
                    checkpoint = json.loads(line)
                    if case == "source-foundation" and checkpoint.get("evidence") == "foundation-external-ready":
                        profile = Path(checkpoint["profile"]).resolve()
                        assert profile.parent == Path(env.get("TEMP") or env.get("TMPDIR") or "/tmp").resolve()
                        assert profile.name == f"loomlight-r2-probe-{process.pid}-source-foundation"
                        path = Path(checkpoint["path"])
                        assert not path.is_absolute() and ".." not in path.parts and path.parts[:2] == ("game", "chapters")
                        target = profile / "synthetic-project" / path
                        before = target.read_bytes()
                        assert not (profile / "external-written").exists(), "duplicate external dispatch"
                        after = before + b"# ordinary external writer\n"
                        target.write_bytes(after)
                        (output / "external-write.json").write_text(json.dumps(dict(beforeSha256=hashlib.sha256(before).hexdigest(), afterSha256=hashlib.sha256(after).hexdigest(), profile=str(profile), path=str(path))))
                        (profile / "external-written").write_text("one ordinary external write\n")
                except (ValueError, AttributeError):
                    pass
                except Exception as error:
                    external_errors.append(str(error))
        reader = threading.Thread(target=retain_output)
        reader.start()
        try:
            code = process.wait(timeout=300 if case == "source-foundation" else 420)
        except subprocess.TimeoutExpired:
            timed_out = True
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], check=False, capture_output=True)
            else:
                os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=15)
            code = -1
        reader.join(timeout=10)
    if case == "source-foundation":
        profile = Path(env.get("TEMP") or env.get("TMPDIR") or "/tmp") / f"loomlight-r2-probe-{process.pid}-source-foundation"
        if profile.exists():
            shutil.copytree(profile, output / "retained-profile")
            # Resolve and verify containment before recursive cleanup.
            assert profile.resolve().parent == profile.parent.resolve()
            shutil.rmtree(profile)
    reports = []
    for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            report = json.loads(line)
            if report.get("evidence") == "runtime-ui-packaged":
                reports.append(report)
        except (ValueError, AttributeError):
            pass
    passed = code == 0 and not timed_out and not external_errors and len(reports) == 1 and reports[0].get("passed") is True and reports[0].get("cleanupComplete") is True
    if case == "source-foundation":
        details = reports[0].get("details", {}) if len(reports) == 1 else {}
        passed = passed and details.get("extendedChecksComplete") is True and len(details.get("checks", [])) == 33 and (output / "external-write.json").is_file()
    failed |= not passed
    result = dict(case=case, passed=passed, exitCode=code, timedOut=timed_out,
                  elapsedSeconds=round(time.monotonic()-started, 3), reports=reports, externalErrors=external_errors)
    (output / f"runtime-ui-{case}.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result), flush=True)
if failed:
    raise SystemExit(1)
