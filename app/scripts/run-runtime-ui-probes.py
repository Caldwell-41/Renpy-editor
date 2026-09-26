"""Bounded independent packaged Runtime UI scenarios; all results retained on failure."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

executable = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
failed = False
allowed = ["compile", "lint", "route-a", "route-b", "runtime-error"]
cases = sys.argv[3:] or allowed
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
        process = subprocess.Popen([str(executable)], env=env, stdout=stream, stderr=subprocess.STDOUT,
                                   start_new_session=os.name != "nt")
        try:
            code = process.wait(timeout=420)
        except subprocess.TimeoutExpired:
            timed_out = True
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], check=False, capture_output=True)
            else:
                os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=15)
            code = -1
    reports = []
    for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            report = json.loads(line)
            if report.get("evidence") == "runtime-ui-packaged":
                reports.append(report)
        except (ValueError, AttributeError):
            pass
    passed = code == 0 and not timed_out and len(reports) == 1 and reports[0].get("passed") is True and reports[0].get("cleanupComplete") is True
    failed |= not passed
    result = dict(case=case, passed=passed, exitCode=code, timedOut=timed_out,
                  elapsedSeconds=round(time.monotonic()-started, 3), reports=reports)
    (output / f"runtime-ui-{case}.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result), flush=True)
if failed:
    raise SystemExit(1)
