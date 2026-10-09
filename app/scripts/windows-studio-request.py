"""Windows continuation of the existing synthetic request walkthrough.

Reuses its exact loopback server/body, native fixture, and Windows package/input
controller. No general UI driver, install, real credential or automatic retry.
"""
import argparse
import ctypes
from ctypes import wintypes as wt
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


w = load('windows_credentials', 'windows-studio-credentials.py')
m = load('request_walkthrough', 'macos-studio-request.py')
OUT = w.APP / '.toolchains/windows-studio-request'
PROFILE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'


def runtime_inputs():
    return {k: v for k, v in {**w.source_inputs(), **m.manifest()}.items()
            if not k.startswith(('scripts/', 'README'))}


def selected(kind, number, ceiling):
    if number not in range(1, ceiling + 1):
        raise ValueError('Selected ceiling exceeded')
    path = OUT / f'{kind}-{number}-attempt.json'
    if path.exists():
        raise ValueError('Attempt already reserved; resolve dispatch, never retry unchanged')
    if number > 1:
        prior = w.read(OUT / f'{kind}-{number - 1}-terminal.json')
        correction = w.read(OUT / f'{kind}-{number}-correction.json')
        if prior['passed'] or not prior['stopped'] or not correction.get('diagnosis') or not correction.get('correction'):
            raise ValueError('Reserve requires terminal failure and concrete correction')
        if kind == 'launch' and not w.read(OUT / f'launch-{number - 1}' / 'cleanup.json')['ownedFixtureRemoved']:
            raise ValueError('Previous fixture cleanup must complete before reserve launch')
    return path


def build(number):
    selected('build', number, 2)
    w.OUTPUT = OUT
    w.configure_npm_hook()
    # Existing locked installed-input verifier; no install/download/build here.
    inputs = w.qualification_inputs()
    w.write(OUT / f'build-{number}-preflight.json', inputs, exclusive=True)
    runtime = runtime_inputs()
    started = time.monotonic()
    passed = False
    try:
        w.build(number)
        if runtime_inputs() != runtime:
            raise ValueError('Runtime inputs changed while packaging')
        w.write(OUT / f'build-{number}-runtime.json', runtime, exclusive=True)
        passed = True
    finally:
        w.write(OUT / f'build-{number}-terminal.json', {
            'passed': passed, 'stopped': True, 'elapsedSeconds': time.monotonic() - started,
            'historicalWindowsBuildsBefore': 7, 'selectedBuild': number,
        }, exclusive=True)


def fixture(output):
    state = w.read(output / 'state.json')
    root = Path(state['root']).resolve()
    if (root.parent != Path(tempfile.gettempdir()).resolve() or root.is_symlink()
            or not root.name.startswith('loomlight-studio-request-')
            or (root / '.request-owner').read_text() != m.OWNER):
        raise ValueError('Exact marked fixture ownership required')
    return root


def create_root():
    root = Path(tempfile.mkdtemp(prefix='loomlight-studio-request-'))
    # Rust compares the exact bytes. Text-mode Windows newline translation is
    # not an equivalent ownership marker and must never consume another launch.
    (root / '.request-owner').write_bytes(m.OWNER.encode())
    return root


def cleanup_unused(number):
    output = OUT / f'launch-{number}'
    root = fixture(output)
    terminal = w.read(output / 'exit.json')
    if (not terminal['stopped'] or not terminal['listenerStopped'] or terminal['requests'] != 0
            or not w.pid_absent(w.read(output / 'launch.json')['pid'])):
        raise ValueError('Unused stopped fixture required; no ownership recovery')
    marker_only = sorted(p.name for p in root.iterdir()) == ['.request-owner']
    if not marker_only and (w.read(root / 'ai-profiles.json') != w.read(w.APP / 'tests/fixtures/studio-request/profiles.json')
                            or (root / 'credentials-dev').exists()):
        raise ValueError('Untouched uncredentialled seed required')
    w.write(output / 'unused-cleanup-before.json', {
        'markerHex': (root / '.request-owner').read_bytes().hex(),
        'credentialsCreated': 0, 'requests': 0, 'exactOwnedRoot': True,
        'markerOnly': marker_only,
        'profileSha256': None if marker_only else w.sha(root / 'ai-profiles.json'),
        'sources': {str(p.relative_to(root)): w.sha(p) for p in (root / 'synthetic-project/game').rglob('*.rpy')},
    }, exclusive=True)
    shutil.rmtree(root)
    w.write(output / 'cleanup.json', {'ownedFixtureRemoved': not root.exists(), 'credentialsCreated': 0}, exclusive=True)


def validate_saved(root):
    seed = w.read(w.APP / 'tests/fixtures/studio-request/profiles.json')
    saved = w.read(root / 'ai-profiles.json')
    w.validate_saved(seed, saved, PROFILE)
    return saved


def launch(number, build_number):
    attempt = selected('launch', number, 3)
    output = OUT / f'launch-{number}'
    if output.exists():
        raise ValueError('Launch output exists; ambiguous dispatch refused')
    built = w.read(OUT / f'build-{build_number}.json')
    executable = Path(built['executable'])
    if w.sha(executable) != built['sha256'] or runtime_inputs() != w.read(OUT / f'build-{build_number}-runtime.json'):
        raise ValueError('Package/runtime identity differs')
    processes = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq loomlight.exe', '/FO', 'CSV', '/NH'], capture_output=True, text=True, check=True, timeout=5).stdout
    if '"loomlight.exe"' in processes.lower():
        raise ValueError('Existing app owner; no launch')
    output.mkdir()
    root = create_root()
    w.write(output / 'state.json', {'root': str(root), 'executable': str(executable),
            'executableSha256': built['sha256'], 'runtimeInputs': runtime_inputs()}, exclusive=True)
    # Bind before reserving/dispatch. An unavailable port never launches an app.
    server, listener, stop, events = m.start_server(output, count=5)
    process = None
    forced = False
    code = None
    start = time.monotonic()
    try:
        w.write(attempt, {'launch': number, 'historicalWindowsLaunchesBefore': 12,
                'observationSeconds': 180, 'walkthroughSeconds': 1800,
                'responseSeconds': 600, 'cleanupSeconds': 2}, exclusive=True)
        env = {k: v for k, v in os.environ.items() if not k.startswith('LOOMLIGHT_')}
        env.update(LOOMLIGHT_RUNTIME_UI_PROBE='studio-request', LOOMLIGHT_STUDIO_PROBE_ROOT=str(root))
        with (output / 'stdout.log').open('xb') as stdout, (output / 'stderr.log').open('xb') as stderr:
            process = subprocess.Popen([str(executable)], env=env, stdout=stdout, stderr=stderr)
            w.write(output / 'launch.json', {'pid': process.pid, 'accepted': True}, exclusive=True)
            print(json.dumps({'launched': True, 'pid': process.pid, 'root': str(root)}), flush=True)
            try:
                code = process.wait(timeout=1800)
            except subprocess.TimeoutExpired:
                forced = True
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], check=True, timeout=5)
                code = process.wait(timeout=5)
    finally:
        if process is not None and process.poll() is None:
            forced = True
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], check=True, timeout=5)
            code = process.wait(timeout=5)
        # Observe the client closing its stalled connection before stopping the
        # server. Server teardown must not manufacture application cleanup proof.
        cleanup_until = time.monotonic() + 2
        while len(events) == 5 and not (output / 'request-5-end.json').exists() and time.monotonic() < cleanup_until:
            time.sleep(0.01)
        stop.set()
        server.shutdown()
        server.server_close()
        listener.join(timeout=2)
        absent = process is None or w.pid_absent(process.pid)
        stalled_closed = all((output / f'request-{n}-end.json').exists()
                             and w.read(output / f'request-{n}-end.json')['clientClosed'] for n in (2, 5))
        passed = code == 0 and not forced and absent and len(events) == 5 and all(e['accepted'] for e in events) and stalled_closed
        receipt = {'passed': passed, 'stopped': absent, 'code': code, 'normal': code == 0 and not forced,
                   'forced': forced, 'elapsedSeconds': time.monotonic() - start,
                   'listenerStopped': not listener.is_alive(), 'requests': len(events),
                   'allAccepted': all(e['accepted'] for e in events), 'stalledConnectionsClosed': stalled_closed}
        w.write(output / 'exit.json', receipt, exclusive=True)
        w.write(OUT / f'launch-{number}-terminal.json', receipt, exclusive=True)
    if not passed:
        raise ValueError('Walkthrough incomplete; preserve every original receipt')


class Credential(ctypes.Structure):
    _fields_ = [('Flags', wt.DWORD), ('Type', wt.DWORD), ('TargetName', wt.LPWSTR),
                ('Comment', wt.LPWSTR), ('LastWritten', wt.FILETIME), ('CredentialBlobSize', wt.DWORD),
                ('CredentialBlob', ctypes.c_void_p), ('Persist', wt.DWORD), ('AttributeCount', wt.DWORD),
                ('Attributes', ctypes.c_void_p), ('TargetAlias', wt.LPWSTR), ('UserName', wt.LPWSTR)]


def cleanup(number):
    output = OUT / f'launch-{number}'
    root = fixture(output)
    terminal = w.read(output / 'exit.json')
    if not terminal['stopped'] or not terminal['listenerStopped'] or not terminal['normal']:
        raise ValueError('Cleanup requires confirmed normal exit and stopped listener')
    if not w.pid_absent(w.read(output / 'launch.json')['pid']):
        raise ValueError('Owned process still present')
    saved = validate_saved(root)
    # Reuse the accepted run-12 exact-target metadata cleanup flow after active exit.
    # No enumeration, blob dereference, value diagnosis or uncertain ownership recovery.
    profile = saved['profiles'][0]
    c = profile['credential']
    ordered = {k: c[k] for k in ['credentialId', 'origin', 'revision']}
    if set(c) != set(ordered):
        raise ValueError('Unexpected credential reference')
    target = 'app.loomlight.desktop.ai.v1/provider/' + PROFILE + '/' + c['credentialId']
    comment = 'Loomlight Studio v1:' + hashlib.sha256(json.dumps([PROFILE, ordered], separators=(',', ':')).encode()).hexdigest()
    api = ctypes.WinDLL('advapi32', use_last_error=True)
    api.CredReadW.argtypes = [wt.LPCWSTR, wt.DWORD, wt.DWORD, ctypes.POINTER(ctypes.POINTER(Credential))]
    api.CredReadW.restype = wt.BOOL
    api.CredFree.argtypes = [ctypes.c_void_p]
    api.CredDeleteW.argtypes = [wt.LPCWSTR, wt.DWORD, wt.DWORD]
    api.CredDeleteW.restype = wt.BOOL

    def inspect():
        item = ctypes.POINTER(Credential)()
        if not api.CredReadW(target, 1, 0, ctypes.byref(item)):
            if ctypes.get_last_error() != 1168:
                raise ValueError('Exact target unavailable')
            return False
        try:
            value = item.contents
            if ((value.Type, value.Persist, value.Flags, value.AttributeCount) != (1, 2, 0, 0)
                    or value.TargetName != target or value.UserName != 'app.loomlight.desktop/Studio/v1'
                    or value.Comment != comment):
                raise ValueError('Ownership mismatch; entry retained')
            return True
        finally:
            api.CredFree(item)

    before = inspect()
    w.write(output / 'cleanup-before.json', {'saved': saved, 'exactOwnershipVerified': before,
            'profileSha256': w.sha(root / 'ai-profiles.json'), 'sources': {
                str(p.relative_to(root)): w.sha(p) for p in (root / 'synthetic-project/game').rglob('*.rpy')
            }}, exclusive=True)
    if not before or not api.CredDeleteW(target, 1, 0):
        raise ValueError('Exact owned removal did not complete; preserve root')
    if inspect():
        raise ValueError('Exact owned credential remains')
    w.write(output / 'credential-cleanup.json', {'removed': True, 'absentAfter': True,
            'enumeration': False, 'secretValuesRead': False}, exclusive=True)
    shutil.rmtree(root)
    w.write(output / 'cleanup.json', {'ownedFixtureRemoved': not root.exists()}, exclusive=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--build', type=int)
    group.add_argument('--launch', type=int)
    group.add_argument('--cleanup', type=int)
    group.add_argument('--cleanup-unused', type=int)
    parser.add_argument('--package', type=int, default=1)
    args = parser.parse_args()
    if args.build is not None:
        build(args.build)
    elif args.launch is not None:
        launch(args.launch, args.package)
    elif args.cleanup is not None:
        cleanup(args.cleanup)
    else:
        cleanup_unused(args.cleanup_unused)
