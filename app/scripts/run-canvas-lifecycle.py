"""Four SDK launches across two editor launches; no automatic retry."""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import uuid
import time

from canvas_evidence import canvas_observation_ok
from canvas_lifecycle_evidence import admit

executable = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=False)
root = Path(tempfile.gettempdir()).resolve() / ('loomlight-canvas-lifecycle-' + uuid.uuid4().hex)
root.mkdir()
(root / '.owner').write_bytes(b'loomlight-canvas-lifecycle-v1\n')
target = 'macos' if sys.platform == 'darwin' else 'windows' if sys.platform == 'win32' else None
if target is None:
    raise SystemExit('Mac ARM64 or Windows x64 required')
if target == 'macos':
    observer = output / 'canvas-observer'
    subprocess.run(['clang', '-fobjc-arc', '-fblocks', '-Wno-incompatible-pointer-types',
                    str(Path(__file__).with_name('canvas-observer.m')), '-framework', 'AppKit',
                    '-framework', 'CoreGraphics', '-o', str(observer)], check=True)
    observer_command = [str(observer)]
else:
    observer_command = [sys.executable, str(Path(__file__).with_name('canvas-observer.py'))]

def alive(pid):
    if target == 'windows':
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
        kernel.OpenProcess.restype = ctypes.c_void_p
        kernel.CloseHandle.argtypes = [ctypes.c_void_p]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            return ctypes.get_last_error() != 87  # ERROR_INVALID_PARAMETER: no process
        code = ctypes.c_ulong()
        kernel.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
        try:
            return not kernel.GetExitCodeProcess(handle, ctypes.byref(code)) or code.value == 259
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False

def sources():
    result = {}
    for project in ('synthetic-project', 'other/synthetic-project'):
        for path in sorted((root / project / 'game').rglob('*')):
            if path.is_file():
                result[str(path.relative_to(root)).replace('\\', '/')] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result

def stop_app(process):
    if process.poll() is None:
        if target == 'windows':
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], capture_output=True, check=False, timeout=15)
        else:
            os.killpg(process.pid, signal.SIGKILL)
        process.wait(timeout=15)

def cleanup_mac_helpers():
    if target != 'macos':
        return []
    # SDK executables are inside this runner's unique owned profile. Helpers have
    # separate process groups, so killing the editor group alone cannot clean them.
    sdk_executable = root / 'sdks' / 'renpy-8.5.3-sdk-verified-v1' / 'lib' / 'py3-mac-universal' / 'renpy'
    libproc = ctypes.CDLL('/usr/lib/libproc.dylib')
    libproc.proc_pidpath.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32]
    libproc.proc_pidpath.restype = ctypes.c_int
    def owned_group(pid):
        path = ctypes.create_string_buffer(4096)
        if libproc.proc_pidpath(pid, path, len(path)) <= 0:
            return False
        try:
            return Path(os.fsdecode(path.value)).resolve() == sdk_executable.resolve() and os.getpgid(pid) == pid
        except ProcessLookupError:
            return False
    listing = subprocess.run(['ps', '-axo', 'pid=,pgid='], capture_output=True, text=True, check=True, timeout=5)
    owned = []
    for line in listing.stdout.splitlines():
        fields = line.split()
        if len(fields) == 2:
            pid, group = map(int, fields)
            if pid == group and owned_group(pid):
                owned.append(pid)
    for pid in owned:
        try:
            if owned_group(pid):
                os.killpg(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
    deadline = time.monotonic() + 2
    while any(alive(pid) for pid in owned) and time.monotonic() < deadline:
        time.sleep(.02)
    for pid in owned:
        try:
            if alive(pid) and owned_group(pid):
                os.killpg(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    deadline = time.monotonic() + 2
    while any(alive(pid) for pid in owned) and time.monotonic() < deadline:
        time.sleep(.02)
    return [dict(pid=pid, stopped=not alive(pid)) for pid in owned]

rows, exits, observations, errors = [], [], [], []
initial_sources = None
apps, sdk_attempts, observers = [], [], []
def retain_launches():
    (output / 'launches.json').write_text(json.dumps(dict(editorPIDs=[app.pid for app in apps], sdkLaunchAttempts=sdk_attempts), indent=2))
try:
    for phase, stages in ((1, ('refusal', 'restart-change', 'quit')), (2, ('app-restart',))):
        env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE='canvas-lifecycle',
                   LOOMLIGHT_CANVAS_LIFECYCLE_ROOT=str(root), LOOMLIGHT_CANVAS_LIFECYCLE_PHASE=str(phase))
        for key in ('LOOMLIGHT_SCAFFOLD_SMOKE', 'LOOMLIGHT_SINGLE_INSTANCE_SMOKE', 'LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT'):
            env.pop(key, None)
        observers = []
        with (output / f'phase-{phase}.log').open('wb') as log:
            process = subprocess.Popen([str(executable)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       start_new_session=target != 'windows')
            apps.append(process)
            retain_launches()
            def read_output():
                global initial_sources
                for line in process.stdout:
                    log.write(line); log.flush()
                    try:
                        value = json.loads(line)
                    except (ValueError, UnicodeDecodeError):
                        continue
                    if isinstance(value, dict) and value.get('evidence') == 'canvas-lifecycle-sdk-attempt':
                        sdk_attempts.append(value.get('stage'))
                        retain_launches()
                    if not isinstance(value, dict) or value.get('evidence') != 'canvas-lifecycle-observe':
                        continue
                    try:
                        stage = value.get('stage')
                        assert len(observers) < len(stages) and stage == stages[len(observers)], 'Unexpected lifecycle observation'
                        if initial_sources is None:
                            initial_sources = sources()
                        directory = root / 'observations' / stage
                        observers.append((stage, subprocess.Popen([*observer_command, str(process.pid), str(root),
                            str(directory / 'stop'), str(directory / 'observation.json')], stdout=log, stderr=log)))
                    except Exception as error:
                        errors.append(str(error))
            reader = threading.Thread(target=read_output, daemon=True)
            reader.start()
            try:
                code = process.wait(timeout=420)
            except subprocess.TimeoutExpired:
                errors.append(f'Phase {phase} app timed out')
                stop_app(process)
                code = process.wait(timeout=15)
            reader.join(timeout=5)
            if reader.is_alive():
                errors.append('Output reader did not finish')
            if len(observers) != len(stages):
                errors.append('Missing observation interval')
            for stage, owned in observers:
                directory = root / 'observations' / stage
                # A normal stop must come from the app, before app.exit. Runner cleanup is not evidence.
                app_stopped_observer = (directory / 'stop').is_file()
                (directory / 'stop').touch()
                try:
                    owned.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    owned.kill(); owned.wait(timeout=5)
                    errors.append('Observer timed out')
                try:
                    value = json.loads((directory / 'observation.json').read_text())
                    value_ok = app_stopped_observer and owned.returncode == 0 and canvas_observation_ok(value, process.pid, target)
                    helpers_gone = all(not alive(pid) for pid in value.get('helperPIDs', []))
                    observations.append(dict(stage=stage, passed=value_ok and helpers_gone, helpersGone=helpers_gone, observation=value))
                except (OSError, ValueError):
                    errors.append('Observer receipt missing or invalid')
            try:
                phase_receipt = json.loads((root / f'phase-{phase}.json').read_text())
                exit_receipt = json.loads((root / f'phase-{phase}-exited.json').read_text())
                rows.extend(phase_receipt['rows'])
                exits.append(code == 0 and exit_receipt == dict(applicationExitEvent=True) and not alive(process.pid))
                (output / f'phase-{phase}.json').write_text(json.dumps(dict(editorPID=process.pid, exitCode=code,
                    applicationExit=exit_receipt, **phase_receipt), indent=2))
            except (OSError, ValueError, KeyError):
                errors.append(f'Phase {phase} lifecycle or application exit receipt missing')
            if code != 0 or errors or not all(v['passed'] for v in observations):
                break
finally:
    for app in apps:
        stop_app(app)
    for stage, observer_process in observers:
        if observer_process.poll() is None:
            (root / 'observations' / stage / 'stop').touch()
            try:
                observer_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                observer_process.kill(); observer_process.wait(timeout=5)
    fallback_cleanup = cleanup_mac_helpers()
    if fallback_cleanup:
        errors.append('Forced cleanup of remaining owned Mac helpers was required')

unchanged = bool(initial_sources) and sources() == initial_sources
helpers_removed = not list(root.glob('canvas-helper-*'))
passed = (not errors and admit(rows, exits, target) and len(observations) == 4 and len(apps) == 2
          and sdk_attempts == ['refusal', 'restart-change', 'quit', 'app-restart']
          and all(v['passed'] for v in observations) and unchanged and helpers_removed)
if passed:
    assert root.parent == Path(tempfile.gettempdir()).resolve() and not root.is_symlink()
    assert (root / '.owner').read_text() == 'loomlight-canvas-lifecycle-v1\n'
    shutil.rmtree(root)
receipt = dict(passed=passed, targetOs=target, rows=rows, applicationExits=exits, observations=observations,
               sourcesUnchanged=unchanged, helperDirectoriesRemoved=helpers_removed,
               fixtureRemoved=not root.exists(), errors=errors,
               nativeKeyboard=False, continuousFocusProof=False, fallbackCleanup=fallback_cleanup,
               applicationLaunches=len(apps), sdkLaunchAttempts=sdk_attempts)
(output / 'lifecycle.json').write_text(json.dumps(receipt, indent=2))
print(json.dumps(dict(passed=passed, applicationLaunches=len(apps), sdkLaunchAttempts=len(sdk_attempts), observationIntervals=len(observations), errors=errors)))
raise SystemExit(0 if passed else 1)
