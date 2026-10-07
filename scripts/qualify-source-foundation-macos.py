"""Bound the approved Mac-only qualification using the existing native/SDK gates."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import signal
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
DIGEST = "be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939"
SDK_HASH = "eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45"


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inputs():
    manifest = json.loads((ROOT / "docs/tasks/active/source-foundation-qualified-inputs.json").read_bytes())
    hashes = manifest["workingInputs"]
    assert len(hashes) == 139 and manifest["inputDigest"] == DIGEST
    assert hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest() == DIGEST
    for relative, expected in hashes.items():
        path = ROOT / relative
        assert path.resolve().is_relative_to(ROOT) and sha(path) == expected, relative
    return manifest


def descendants(pid):
    pairs = [tuple(map(int, line.split())) for line in subprocess.check_output(
        ["ps", "-axo", "pid=,ppid="], text=True).splitlines()]
    owned = {pid}
    while True:
        expanded = owned | {child for child, parent in pairs if parent in owned}
        if expanded == owned:
            return owned
        owned = expanded


def bounded(output, name, command, cap, env, expensive=False):
    inputs()
    marker = output / (name + "-dispatch.json")
    prior = {mode: 2 + int((output / (mode + "-dispatch.json")).exists())
             for mode in ["build", "native", "sdk"]}
    receipt = dict(command=command, capSeconds=cap, inputDigest=DIGEST,
                   cumulativeBefore=dict(windows="2/2/3", macos=prior),
                   expensive=expensive, startedAt=time.time(), retries=0)
    # Exclusive creation refuses repeated execution, including a rerun of the job.
    with marker.open("x") as stream:
        json.dump(receipt, stream, indent=2)
    started = time.monotonic()
    timed_out = False
    with (output / (name + ".log")).open("wb") as stream:
        process = subprocess.Popen(command, cwd=ROOT / "app", env=env,
                                   stdout=stream, stderr=subprocess.STDOUT,
                                   start_new_session=True)
        receipt["pid"] = process.pid
        write(marker, receipt)
        try:
            code = process.wait(timeout=cap)
        except subprocess.TimeoutExpired:
            timed_out = True
            owned = descendants(process.pid)
            for pid in sorted(owned - {process.pid}, reverse=True):
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            code = process.wait(timeout=15)
            receipt["terminatedOwnedPids"] = sorted(owned)
    result = dict(receipt, exitCode=code, timedOut=timed_out,
                  elapsedSeconds=round(time.monotonic() - started, 3))
    write(output / (name + "-result.json"), result)
    print(json.dumps({key: result[key] for key in ("command", "exitCode", "timedOut", "elapsedSeconds")}), flush=True)
    assert code == 0 and not timed_out, name + " failed; no retry"
    inputs()
    return (output / (name + ".log")).read_text(errors="replace")


def native_report(result, manifest):
    assert result["passed"] is True and result["exitCode"] == 0 and not result["timedOut"]
    assert result["externalErrors"] == [] and len(result["reports"]) == 1
    report = result["reports"][0]
    assert report["evidence"] == "runtime-ui-packaged" and report["case"] == "source-foundation"
    assert report["passed"] is True and report["cleanupComplete"] is True
    details = report["details"]
    assert details["stage"] == "complete" and details["extendedChecksComplete"] is True
    assert len(details["checks"]) == 33 and details["checks"] == manifest["nativeChecks"]


def sdk_reports(cases, log):
    assert [case["case"] for case in cases] == ["true", "false", "wrong-outcome"]
    records = [json.loads(line.split(": ", 1)[1]) for line in log.splitlines()
               if line.startswith("source-foundation-sdk-case: ")]
    terminals = [json.loads(line.split(": ", 1)[1]) for line in log.splitlines()
                 if line.startswith("source-foundation-sdk-terminal: ")]
    assert len(records) == 3 and [r["case"] for r in records] == ["true", "false", "wrong-outcome"]
    assert terminals == [{"passed": True, "cleanupComplete": True}]
    assert re.search(r"test result: ok\. 1 passed; 0 failed; 0 ignored;", log)
    for case, record in zip(cases, records):
        assert case["passed"] is True and record["passed"] is True and not record["timedOut"]
        text = case["output"]
        if case["case"] == "wrong-outcome":
            assert record["exitCode"] not in (None, 0) and record["expectedRejection"] is True
            assert "FAILED" in text and "AssertionError" in text
            assert "SOURCE_FOUNDATION_ROUTE wrong-outcome" not in text
        else:
            assert record["exitCode"] == 0 and record["expectedRejection"] is False
            assert "SOURCE_FOUNDATION_ROUTE " + case["case"] in text
            assert re.search(r"Assertions\s*:\s*6\s*\|\s*6 passed\s*\|\s*0 xfailed\s*\|\s*0 failed\s*\|\s*0 xpassed", text)
            assert "Status: PASSED" in text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["prepare", "build", "native", "sdk", "finish"])
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    assert output.parent == Path(os.environ["RUNNER_TEMP"]).resolve()
    assert output.name == "source-foundation-macos"
    output.mkdir(parents=True, exist_ok=True)
    manifest = inputs()
    assert platform.system() == "Darwin" and platform.machine() == "arm64"
    assert os.environ.get("GITHUB_RUN_ATTEMPT") == "1", "No Actions job/run retries authorized"
    scratch = output / "scratch"
    scratch.mkdir(exist_ok=True)
    env = dict(os.environ, TMPDIR=str(scratch) + "/", TEMP=str(scratch), TMP=str(scratch),
               XDG_CACHE_HOME=str(scratch / "cache"),
               LOOMLIGHT_FOUNDATION_EVIDENCE_DIR=str(output / "sdk"))
    if args.mode == "prepare":
        assert subprocess.check_output(["node", "--version"], text=True).strip() == "v24.19.0"
        assert subprocess.check_output(["npm", "--version"], text=True).strip() == "11.9.0"
        assert subprocess.check_output(["rustc", "--version"], text=True).startswith("rustc 1.90.0 ")
        assert sha(Path(env["LOOMLIGHT_RUNTIME_SDK_ARCHIVE"])) == SDK_HASH
        write(output / "inputs.json", manifest)
        write(output / "selection.json", dict(inputDigest=DIGEST, priorCumulative=manifest["cumulative"],
              runId=env["GITHUB_RUN_ID"], runAttempt=env["GITHUB_RUN_ATTEMPT"], testedSha=env["GITHUB_SHA"],
              platform=platform.platform(), allowance=manifest["remainingMacAllowance"],
              windowsEvidence="Published Windows receipt reused; raw archives not transferred"))
        for relative in manifest["workingInputs"]:
            target = output / "exact-inputs" / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)
        log = bounded(output, "core-preflight", ["cargo", "test", "-p", "loomlight-core", "--locked", "source_foundation", "--", "--nocapture"], 1200, env)
        assert re.search(r"test result: ok\. 8 passed; 0 failed; 1 ignored;", log)
        assert "source_foundation_sdk_eof_fixture_preflight ... ok" in log
        bounded(output, "typecheck", ["npm", "run", "typecheck"], 180, env)
        bounded(output, "renderer-compile", ["npm", "run", "build:tests"], 180, env)
        log = bounded(output, "renderer-preflight", ["node", "--test", "--test-name-pattern=nested child commits|root controls respect nested|shipped source-foundation", "dist-tests/tests/scene-authoring.dom.test.js"], 180, env)
        assert re.search(r"(?:#|ℹ) pass 3\b", log), "Exactly three renderer preflights required"
        bounded(output, "probe-syntax", ["node", "--check", "src-tauri/src/source_foundation_extended_probe.js"], 30, env)
        write(output / "prepare-result.json", {"passed": True, "inputDigest": DIGEST})
    elif args.mode == "build":
        assert json.loads((output / "prepare-result.json").read_bytes())["passed"] is True
        bounded(output, "build", ["npm", "exec", "--", "tauri", "build", "--no-bundle", "--", "--locked"], 1200, env, True)
        binary = ROOT / "app/target/release/loomlight"
        kind = subprocess.check_output(["file", str(binary)], text=True)
        assert "Mach-O 64-bit executable arm64" in kind, kind
        shutil.copy2(binary, output / "loomlight")
        write(output / "binary.json", dict(sha256=sha(binary), bytes=binary.stat().st_size, kind=kind.strip()))
    elif args.mode == "native":
        assert sha(output / "loomlight") == json.loads((output / "binary.json").read_bytes())["sha256"]
        # The shipped runner itself bounds the native child at exactly 300 seconds.
        bounded(output, "native", ["python3", "scripts/run-runtime-ui-probes.py", str(output / "loomlight"), str(output / "native"), "source-foundation"], 300, env, True)
        native = json.loads((output / "native/runtime-ui-source-foundation.json").read_bytes())
        native_report(native, manifest)
        external = json.loads((output / "native/external-write.json").read_bytes())
        assert external["beforeSha256"] != external["afterSha256"]
        assert (output / "native/retained-profile/external-written").is_file()
        assert not Path(external["profile"]).exists()
        write(output / "native-audit.json", dict(passed=True, exactChecks=33, cleanupComplete=True))
    elif args.mode == "sdk":
        assert json.loads((output / "native-audit.json").read_bytes())["passed"] is True
        (output / "sdk").mkdir(exist_ok=True)
        log = bounded(output, "sdk", ["cargo", "test", "-p", "loomlight-core", "--locked", "renpy::tests::source_foundation::source_foundation_bool_sdk_gate", "--", "--ignored", "--exact", "--nocapture"], 600, env, True)
        sdk_reports(json.loads((output / "sdk/sdk-cases.json").read_bytes()), log)
        before = (output / "sdk/eof-before.rpy").read_bytes()
        produced = (output / "sdk/eof-produced.rpy").read_bytes()
        assert not before.endswith(b"\n") and produced == before + b'\r\n    "Foundation continuation"\r\n'
        owners = json.loads((output / "sdk/eof-owners.json").read_bytes())
        assert len(owners["before"]) == 2 and owners["before"] == owners["after"]
        binaries = re.findall(r"Running unittests [^\n]* \(([^)]+)\)", log)
        assert len(binaries) == 1
        binary = ROOT / "app" / binaries[0]
        kind = subprocess.check_output(["file", str(binary)], text=True)
        assert "Mach-O 64-bit executable arm64" in kind, kind
        shutil.copy2(binary, output / "sdk/test-executable")
        write(output / "sdk-audit.json", dict(passed=True, actualAssertionsPerRoute=6,
              cleanupComplete=True, eofProducedSha256=sha(output / "sdk/eof-produced.rpy"),
              testExecutableSha256=sha(binary), testExecutableKind=kind.strip()))
    else:
        # Always retain the bounded scratch (including failure state) before cleanup.
        if scratch.exists():
            shutil.copytree(scratch, output / "retained-scratch")
            assert scratch.resolve().parent == output
            shutil.rmtree(scratch)
        completed = all((output / (name + "-audit.json")).is_file() for name in ["native", "sdk"])
        counts = {name: int((output / (name + "-dispatch.json")).is_file()) for name in ["build", "native", "sdk"]}
        write(output / "terminal.json", dict(macosQualificationPassed=completed,
              inputDigest=DIGEST, newMacDispatches=counts,
              cumulativeMac=dict(build=2 + counts["build"], native=2 + counts["native"], sdk=2 + counts["sdk"]),
              scratchRemoved=not scratch.exists(), rawWindowsEvidenceTransferred=False,
              twoTargetAcceptance=False))
        write(output / "evidence-sha256.json", {str(p.relative_to(output)): sha(p)
              for p in sorted(output.rglob("*")) if p.is_file() and p.name != "evidence-sha256.json"})


if __name__ == "__main__":
    main()
