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

from runtime_probe_cases import RUNTIME_CASES, OPTIONAL_CASES, runtime_report_ok

executable = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
failed = False
observer_command = None
if "canvas-helper" in sys.argv[3:]:
    if sys.platform == "darwin":
        observer_binary = output / "canvas-observer"
        subprocess.run(["clang", "-fobjc-arc", "-fblocks", "-Wno-incompatible-pointer-types", str(Path(__file__).with_name("canvas-observer.m")), "-framework", "AppKit", "-framework", "CoreGraphics", "-o", str(observer_binary)], check=True)
        observer_command = [str(observer_binary)]
    elif sys.platform == "win32":
        observer_command = [sys.executable, str(Path(__file__).with_name("canvas-observer.py"))]

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
    observer = []
    observer_stop = output / "canvas-observation.stop"
    observation_path = output / "canvas-observation.json"
    if case == "canvas-helper":
        assert observer_command and not observation_path.exists() and not observer_stop.exists()
        env["LOOMLIGHT_CANVAS_OBSERVER_ROOT"] = str(output)
    with log.open("wb") as stream:
        process = subprocess.Popen([str(executable)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   start_new_session=os.name != "nt")
        external_errors = []
        def retain_output():
            for line in process.stdout:
                stream.write(line); stream.flush()
                try:
                    checkpoint = json.loads(line)
                    if case == "canvas-helper" and checkpoint.get("evidence") == "canvas-observer-ready":
                        assert not observer, "Only one canvas observation interval is allowed"
                        profile = Path(env.get("TEMP") or env.get("TMPDIR") or "/tmp") / f"loomlight-r2-probe-{process.pid}-{case}"
                        observer.append(subprocess.Popen([*observer_command, str(process.pid), str(profile), str(observer_stop), str(observation_path)]))
                    if case == "canvas-helper" and checkpoint.get("evidence") == "runtime-ui-packaged":
                        observer_stop.touch()
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
        if case == "canvas-helper":
            observer_stop.touch()
            for owned in observer:
                try:
                    owned.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    owned.kill(); owned.wait()
                    external_errors.append("Canvas observer cleanup timed out")
    if case == "source-foundation":
        profile = Path(env.get("TEMP") or env.get("TMPDIR") or "/tmp") / f"loomlight-r2-probe-{process.pid}-source-foundation"
        if profile.exists():
            shutil.copytree(profile, output / "retained-profile")
            # Resolve and verify containment before recursive cleanup.
            assert profile.resolve().parent == profile.parent.resolve()
            shutil.rmtree(profile)
    help_disk = None
    disk_errors = []
    fixture_cleanup_complete = True
    if case in ("help-screen", "owned-screen", "canvas-helper"):
        profile = Path(env.get("TEMP") or env.get("TMPDIR") or "/tmp") / f"loomlight-r2-probe-{process.pid}-{case}"
        if profile.exists():
            assert not profile.is_symlink() and profile.resolve().parent == profile.parent.resolve()
            project = profile / "synthetic-project"
            source = project / ("game/ui/travel_notes.rpy" if case == "owned-screen" else "game/ui/help.rpy")
            if case == "help-screen":
                original = (Path(__file__).resolve().parents[2] / "tests/fixtures/phase-3b-screens/help.rpy").read_bytes()
                expected = b'\xef\xbb\xbf' + original.replace(b'\n', b'\r\n').replace(b'xsize 640', b'xsize 768')
            elif case=='canvas-helper':
                expected=(Path(__file__).resolve().parents[2] / "tests/fixtures/phase-3b-screens/canvas-help.rpy").read_bytes()
            else:
                expected = None
                try:
                    ownership = json.loads((project / ".renpy-editor/source-map.json").read_text())["ownedScreens"]
                    if len(ownership) != 1 or ownership[0]["name"] != "travel_notes":
                        raise ValueError("One owned blank screen required on disk")
                    expected = f'# loomlight-screen: {ownership[0]["id"]}\nscreen travel_notes():\n    pass\n'.encode()
                except (OSError, ValueError, KeyError, TypeError):
                    disk_errors.append("Owned screen ownership could not be verified")
                    metadata = project / ".renpy-editor/source-map.json"
                    if metadata.is_file() and not metadata.is_symlink():
                        try:
                            shutil.copyfile(metadata, output / "disk-source-map.json")
                        except OSError:
                            disk_errors.append("Owned metadata evidence could not be retained")
            help_disk = dict(acceptedBytesMatch=expected is not None and source.is_file() and source.read_bytes() == expected,
                             scratchJobsRemaining=len(list(profile.glob("scratch-preview-*"))),
                             sourceBytecode=list(project.glob("game/**/*.rpyc")) != [],
                             sourceSaves=(project / "game/saves").exists())
            if case=='canvas-helper':
                help_disk['canvasJobsRemaining']=len(list(profile.glob('canvas-helper-*')))
            (output / "help-disk.json").write_text(json.dumps(help_disk, indent=2)+"\n")
            if source.is_file():
                (output / "accepted-help.rpy").write_bytes(source.read_bytes())
            try:
                shutil.rmtree(profile)
            except OSError:
                if case != "owned-screen":
                    raise
                fixture_cleanup_complete = False
                disk_errors.append("Owned fixture cleanup failed")
    reports = []
    for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            report = json.loads(line)
            if report.get("evidence") == "runtime-ui-packaged":
                reports.append(report)
        except (ValueError, AttributeError):
            pass
    target_os = {"win32": "windows", "darwin": "macos"}.get(sys.platform, "unsupported")
    passed = code == 0 and not timed_out and not external_errors and len(reports) == 1 and runtime_report_ok(case, reports[0], target_os=target_os)
    if case == "source-foundation":
        details = reports[0].get("details", {}) if len(reports) == 1 else {}
        passed = passed and details.get("extendedChecksComplete") is True and len(details.get("checks", [])) == 33 and (output / "external-write.json").is_file()
    if case in ("help-screen", "owned-screen"):
        passed = passed and help_disk == dict(acceptedBytesMatch=True, scratchJobsRemaining=0, sourceBytecode=False, sourceSaves=False)
    if case=='canvas-helper':
        observation = json.loads(observation_path.read_text()) if observation_path.exists() else {}
        from canvas_evidence import canvas_observation_ok
        observed = len(observer) == 1 and observer[0].returncode == 0 and canvas_observation_ok(observation, process.pid, target_os)
        passed = passed and observed
        passed=passed and help_disk==dict(acceptedBytesMatch=True,scratchJobsRemaining=0,sourceBytecode=False,sourceSaves=False,canvasJobsRemaining=0)
        if len(reports)==1:
            for frame in reports[0].get('details',{}).get('frames',[]):
                if isinstance(frame,dict) and isinstance(frame.get('image'),str):
                    import base64
                    try:
                        image=base64.b64decode(frame['image'].split(',',1)[1],validate=True)
                        (output / f"native-helper-{frame['width']}x{frame['height']}.png").write_bytes(image)
                    except (ValueError,KeyError,IndexError):
                        passed=False
    if case == "owned-screen":
        passed = passed and not disk_errors and fixture_cleanup_complete
    failed |= not passed
    result = dict(case=case, passed=passed, exitCode=code, timedOut=timed_out,
                  elapsedSeconds=round(time.monotonic()-started, 3), reports=reports, externalErrors=external_errors, helpDisk=help_disk)
    if case == "canvas-helper":
        result.update(nativeObservation=observation)
    if case == "owned-screen":
        result.update(diskErrors=disk_errors, fixtureCleanupComplete=fixture_cleanup_complete)
    (output / f"runtime-ui-{case}.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(dict(case=case,passed=passed,exitCode=code,timedOut=timed_out,helpDisk=help_disk) if case=='canvas-helper' else result), flush=True)
if failed:
    raise SystemExit(1)
