#!/usr/bin/env python3
"""External, bounded native Settings proof against the unchanged CI1 Windows binary.
No builds, discovery, injected renderer code, credential reads, or hidden launches.
"""
import argparse
import copy
import hashlib
import hmac
import json
import os
import re
from pathlib import Path
import shutil
import socket
import subprocess
import struct
import zlib
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CANDIDATE = '929af6f23f1fe79af2665a4cc71c276a64ffd80d'
TREE = '9f034ca6cae69ef11e87d6a95a332152a9998eaa'
EXE_SHA = '0231a7cd751cd2c52c63c5936db532a2cc156cb020ba46f990a78142c0419b76'
ARTIFACT = {'runId': '38224940778', 'attempt': 1, 'name': 'selectable-Windows-38224940778-1', 'id': '11736026789', 'zipSHA256': 'e6fbc03a1ab74749724c038614ccccaf044873187d28e4a75200e718e2ff4345'}
INPUT_DIGEST = '3c244dc28f7a4fd201ffd00b92d0df462aa2429c4d2139cf10adf6e91f97a1bd'
PUBLIC_KEY = 'loomlight-public-setup-fixture'
MODEL = 'closeout-synthetic-setup'
PROMPT = 'This is a synthetic Loomlight compatibility check. Return exactly the requested JSON object with ok true. No tools.'
STAGES = ['seed', 'ready-first', 'invalidate', 'cancel', 'ready-final', 'close', 'reopen', 'cleanup', 'close-reopen']
CHECKS = {
    'seed': ['defaults', 'samplingSaved', 'nativeCredentialEntry', 'syntheticPreview'],
    'ready-first': ['explicitSetup', 'ready'],
    'invalidate': ['samplingSaved', 'readinessInvalidated', 'syntheticPreview'],
    'cancel': ['explicitSetup', 'cancelled', 'untested'],
    'ready-final': ['explicitSetup', 'ready'],
    'close': ['normalClose'],
    'reopen': ['savedSampling', 'savedCredentialConfigured', 'ready', 'syntheticPreview'],
    'cleanup': ['profileRemoved', 'noConfiguredCredential'],
    'close-reopen': ['normalClose'],
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def write(path, value):
    with Path(path).open('x', encoding='utf-8') as file:
        json.dump(value, file, indent=2, ensure_ascii=False)
        file.write('\n')


def expected_body(temperature, top_p):
    return {'model': MODEL, 'messages': [{'role': 'user', 'content': PROMPT}], 'response_format': {'type': 'json_schema', 'json_schema': {'name': 'loomlight_compatibility_v1', 'strict': True, 'schema': {'type': 'object', 'additionalProperties': False, 'required': ['ok'], 'properties': {'ok': {'type': 'boolean', 'enum': [True]}}}}}, 'stream': False, 'max_tokens': 1024, 'temperature': temperature, 'top_p': top_p, 'enable_thinking': False, 'enable_tools': False, 'enabled_tools': []}


def strict_loads(raw):
    def unique(pairs):
        out = {}
        for key, value in pairs:
            if key in out:
                raise ValueError('duplicate JSON field')
            out[key] = value
        return out
    return json.loads(raw, object_pairs_hook=unique)


def accepted_request(method, path, auth, raw, sequence):
    if sequence not in (1, 2, 3) or len(raw) > 4096:
        return False
    try:
        value = strict_loads(raw)
    except (ValueError, UnicodeError):
        return False
    expected = expected_body(.8, .9) if sequence == 1 else expected_body(.7, .85)
    return method == 'POST' and path == '/v1/chat/completions' and hmac.compare_digest(auth, 'Bearer ' + PUBLIC_KEY) and canonical(value) == canonical(expected)


def compatibility_digest(profile):
    # Rust serializes this tuple using declaration-order settings/reference fields.
    value = ['studio-json-preflight-v1', profile['profileId'], profile['settings'], profile.get('credential'), profile['disabled']]
    return hashlib.sha256(json.dumps(value, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def validate_profile(store, endpoint, sampling, ready, configured=True):
    assert store.get('cleanup') == [] and len(store.get('profiles', [])) == 1, 'Unexpected owned profile/cleanup count'
    p = store['profiles'][0]
    s = p['settings']
    assert s == {'label': 'Closeout native setup', 'endpoint': endpoint, 'model': MODEL, 'privateHttp': False, 'contextCeiling': 8192, 'contextBudget': 4096, 'maximumResponse': 1024, 'temperature': sampling[0], 'topP': sampling[1]}, 'Saved configuration differs from native inputs'
    assert p['disabled'] is False
    c = p.get('credential')
    assert bool(c) == configured, 'Credential reference missing'
    if c:
        assert set(c) <= {'credentialId', 'origin', 'revision', 'service', 'storage'}
        assert c['origin'] == endpoint.removesuffix('/v1') and c['revision'] >= 1
        assert c.get('storage', {'kind': 'native'}) == {'kind': 'native'}
    evidence = p.get('compatibility')
    assert bool(evidence) == ready, 'Unexpected compatibility readiness'
    if ready:
        assert evidence['schemaVersion'] == 1 and evidence['configurationDigest'] == compatibility_digest(p)
        assert type(evidence['checkedAtUnixSeconds']) is int and evidence['checkedAtUnixSeconds'] > 0
    return p


def validate_capture(path, capture):
    # Preserve frozen 929 rewrite_native_evidence.py's PNG/IHDR/minimum-size,
    # actual-dimension, digest and nonblank-range checks. Also reject an apparent
    # header followed by junk: no decoder/package installation is needed.
    data = Path(path).read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR' or len(data) < 512:
        raise ValueError('Native PNG missing or invalid')
    dimensions = list(struct.unpack('>II', data[16:24]))
    if dimensions != [capture.get('width'), capture.get('height')] or not 100 <= min(dimensions) or max(dimensions) > 4096:
        raise ValueError('Native PNG actual dimensions mismatch')
    if capture.get('sha256') != hashlib.sha256(data).hexdigest() or capture.get('sampleRange', 0) < 20:
        raise ValueError('Native PNG changed or blank')
    offset, compressed, ended = 8, bytearray(), False
    depth = channels = None
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError('Truncated PNG chunk')
        size = struct.unpack('>I', data[offset:offset+4])[0]
        end = offset + 12 + size
        if end > len(data):
            raise ValueError('Truncated PNG data')
        kind, payload = data[offset+4:offset+8], data[offset+8:offset+8+size]
        if zlib.crc32(kind + payload) & 0xffffffff != struct.unpack('>I', data[offset+8+size:end])[0]:
            raise ValueError('PNG CRC mismatch')
        if kind == b'IHDR':
            if offset != 8 or size != 13:
                raise ValueError('Invalid PNG header')
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            channels = {2: 3, 6: 4}.get(color)
            if depth != 8 or channels is None or (compression, filtering, interlace) != (0, 0, 0):
                raise ValueError('Unsupported native PNG encoding')
        elif kind == b'IDAT':
            compressed.extend(payload)
        elif kind == b'IEND':
            if size != 0 or end != len(data):
                raise ValueError('Invalid PNG end')
            ended = True
        offset = end
    if not ended or not compressed or channels is None:
        raise ValueError('PNG image/end missing')
    expected = (dimensions[0] * channels + 1) * dimensions[1]
    decoder = zlib.decompressobj()
    pixels = decoder.decompress(compressed, expected + 1)
    if len(pixels) != expected or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise ValueError('PNG pixel stream incomplete')


def validate_stage(receipt, stage, pid, directory):
    assert receipt.get('passed') is True and receipt.get('stage') == stage
    assert receipt.get('processId') == pid and receipt.get('executableSHA256') == EXE_SHA
    assert receipt.get('inputDesktop') == 'Default'
    checks = receipt.get('checks', {})
    for name in ['ownedWindow', 'osMouseInput', 'controlsInViewport', *CHECKS[stage]]:
        assert checks.get(name) is True, 'Missing native check: ' + name
    if stage in ('seed', 'invalidate'):
        assert checks.get('osKeyboardInput') is True
        names = ['Profile name', 'Endpoint', 'Model ID', 'Temperature', 'Top-p'] if stage == 'seed' else ['Temperature', 'Top-p']
        entries = receipt.get('fieldEntries', [])
        assert [e.get('name') for e in entries] == names, 'Exact field input proof missing'
        for entry in entries:
            assert entry.get('type') in ('ControlType.Edit', 'ControlType.Spinner')
            assert all(entry.get(k) is True for k in ('physicalClick', 'keyboardFocusConfirmed', 'readbackMatched'))
            assert isinstance(entry.get('expected'), str) and entry.get('lastReadback') == entry['expected']
    if stage in ('seed', 'reopen'):
        assert checks.get('navigationControlsReady') is True, 'Native navigation readiness missing'
    if stage not in ('close', 'close-reopen'):
        captures = receipt.get('captures', [])
        assert captures, 'Native screenshot missing'
        for capture in captures:
            name = capture['file']
            assert Path(name).name == name and name.endswith('.png')
            path = Path(directory) / name
            validate_capture(path, capture)
    if stage in ('seed', 'invalidate', 'reopen'):
        values = {c['name']: c['value'] for c in receipt.get('controls', [])}
        expected_sampling = ('0.8', '0.9') if stage == 'seed' else ('0.7', '0.85')
        assert values.get('Temperature') == expected_sampling[0] and values.get('Top-p') == expected_sampling[1], 'Native saved fields missing'
        assert all(c.get('owner') == pid and c.get('enabled') is True for c in receipt['controls'])
        if stage == 'seed':
            assert any(c['name'] == 'Temperature' and c['value'] == '1' for c in receipt['controls'])
            assert any(c['name'] == 'Top-p' and c['value'] == '0.95' for c in receipt['controls'])
        body = receipt['preview']['body']
        sampling = (.8, .9) if stage == 'seed' else (.7, .85)
        assert canonical(body) == canonical(expected_body(*sampling)), 'Native exact synthetic preview differs'
        assert receipt['preview']['rawSHA256'] == hashlib.sha256(receipt['preview']['raw'].encode()).hexdigest()
        assert canonical(strict_loads(receipt['preview']['raw'])) == canonical(body)


def validate_terminal(value):
    assert value.get('passed') is True and value.get('candidate') == CANDIDATE and value.get('tree') == TREE
    assert value.get('executableSHA256') == EXE_SHA and value.get('artifact') == ARTIFACT
    assert value.get('materialInputCount') == 269 and value.get('materialInputDigest') == INPUT_DIGEST
    assert value.get('launchOrdinals') == [5, 6] and value.get('packageAttempts') == 0 and value.get('appLaunches') == 2
    assert value.get('completedStages') == STAGES and value.get('normalExits') == [0, 0]
    events = value.get('requests', [])
    assert len(events) == 3 and [e.get('sequence') for e in events] == [1, 2, 3]
    assert all(e.get('accepted') is True and e.get('method') == 'POST' and e.get('path') == '/v1/chat/completions' for e in events)
    assert events[1].get('clientClosed') is True and events[0].get('responseSent') is True and events[2].get('responseSent') is True
    for name in ['noSaveHTTP', 'cancelProfileUnchanged', 'reopenNoHTTP', 'reopenProfileUnchanged', 'sourceUnchanged', 'profileReferencesRemoved', 'rootRemoved', 'listenerStopped', 'noCredentialRead', 'noDiscovery']:
        assert value.get(name) is True, 'Missing terminal proof: ' + name
    for event, preview in zip(events, value['requestPreviewSHA256']):
        assert event['bodySHA256'] == preview


class Fixture:
    def __init__(self, output=None):
        self.events, self.lock, self.stop = [], threading.Lock(), threading.Event()
        owner = self
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass
            def request(self):
                self.connection.settimeout(2)
                try:
                    length = int(self.headers.get('Content-Length', '0'))
                    raw = self.rfile.read(length) if 0 < length <= 4096 else b''
                except (OSError, ValueError):
                    raw = b''
                with owner.lock:
                    sequence = len(owner.events) + 1
                    good = accepted_request(self.command, self.path, self.headers.get('Authorization', ''), raw, sequence)
                    event = {'sequence': sequence, 'accepted': good, 'method': self.command, 'path': self.path if self.path == '/v1/chat/completions' else 'refused', 'bodyBytes': len(raw), 'bodySHA256': hashlib.sha256(raw).hexdigest()}
                    owner.events.append(event)
                    if sequence == 2 and output is not None:
                        write(Path(output) / 'request-2-received.json', {'sequence': sequence, 'accepted': good, 'bodySHA256': event['bodySHA256']})
                if good and sequence == 2:
                    start = time.monotonic()
                    while not owner.stop.is_set() and time.monotonic() - start < 65:
                        try:
                            if not self.connection.recv(1):
                                event['clientClosed'] = True
                                return
                        except socket.timeout:
                            continue
                        except OSError:
                            event['clientClosed'] = True
                            return
                    event['clientClosed'] = False
                    return
                data = json.dumps({'model': MODEL, 'choices': [{'index': 0, 'finish_reason': 'stop', 'message': {'role': 'assistant', 'content': '{"ok":true}'}}]}, separators=(',', ':')).encode()
                self.send_response(200 if good else 403)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Connection', 'close')
                self.end_headers()
                try:
                    self.wfile.write(data)
                    event['responseSent'] = True
                except OSError:
                    event['responseSent'] = False
            do_POST = request
            do_GET = request
            do_PUT = request
            do_DELETE = request
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.server.daemon_threads = False
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.start()
        self.endpoint = f'http://127.0.0.1:{self.server.server_address[1]}/v1'
    def close(self):
        self.stop.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(5)
        assert not self.thread.is_alive(), 'Fixture listener did not stop'


def read_profiles(root):
    path = root / 'ai-profiles.json'  # Nonsecret references only; never an OS credential or sealed file.
    assert path.stat().st_size <= 128 * 1024 and not path.is_symlink()
    return json.loads(path.read_text(encoding='utf-8'))


def sources(root):
    return {p.relative_to(root).as_posix(): sha(p) for p in sorted((root / 'synthetic-project').rglob('*')) if p.is_file()}


def run(args):
    assert os.name == 'nt', 'Actual Windows required; Mac runs validator tests only'
    output, root, product, executable = args.output, args.root, args.product_repo, args.executable
    assert args.first_launch_ordinal == 5
    assert re.fullmatch(r'[0-9a-f]{40}', args.harness_ref), 'Exact external harness ref required'
    assert not output.exists() and not root.exists() and not root.is_symlink()
    assert root.parent.resolve() == Path(tempfile.gettempdir()).resolve() and root.name.startswith('loomlight-rewrite-live-')
    assert sha(executable) == EXE_SHA
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=product, text=True).strip() == CANDIDATE
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=product, text=True).strip() == TREE
    inventory = json.loads(args.input_manifest.read_text())
    actual = {p: sha(product / p) for p in inventory['inputs']}
    transformed = []
    native_helper = 'app/scripts/rewrite-windows-native.ps1'
    if actual[native_helper] != inventory['inputs'][native_helper]:
        raw = (product / native_helper).read_bytes()
        normalized = hashlib.sha256(raw.replace(b'\r\n', b'\n')).hexdigest()
        blob = subprocess.check_output(['git', 'show', f'{CANDIDATE}:{native_helper}'], cwd=product)
        assert b'\r\n' in raw and normalized == inventory['inputs'][native_helper] == hashlib.sha256(blob).hexdigest(), 'Undeclared source transform'
        actual[native_helper] = normalized
        transformed.append(native_helper)
    assert actual == inventory['inputs'] and len(actual) == 269 and hashlib.sha256(canonical(actual)).hexdigest() == INPUT_DIGEST
    output.mkdir(parents=True)
    harness_paths = [Path(__file__), Path(__file__).with_name('studio-setup-windows.ps1'), Path(__file__).with_name('test_studio_setup_native.py')]
    terminal = {'passed': False, 'candidate': CANDIDATE, 'tree': TREE, 'executableSHA256': EXE_SHA, 'artifact': ARTIFACT, 'materialInputCount': 269, 'materialInputDigest': INPUT_DIGEST, 'harnessRef': args.harness_ref, 'harnessFiles': {p.name: sha(p) for p in harness_paths}, 'launchOrdinals': [], 'packageAttempts': 0, 'completedStages': [], 'normalExits': [], 'noCredentialRead': True, 'noDiscovery': True, 'cleanupAttempted': False, 'inputTransforms': transformed, 'appLaunches': 0}
    fixture = Fixture(output)
    child = None
    logs = []
    failed = None
    ps = str(Path(__file__).with_name('studio-setup-windows.ps1'))
    def stage(name, checked=True):
        directory = output / name
        directory.mkdir()
        command = ['powershell.exe', '-NoProfile', '-File', ps, '-Stage', name, '-Output', str(directory), '-ProductRepo', str(product), '-Executable', str(executable), '-Endpoint', fixture.endpoint, '-FixtureSignal', str(output / 'request-2-received.json')]
        if child:
            command += ['-ProcessId', str(child.pid)]
        result = subprocess.run(command, capture_output=True, text=True, timeout=180)
        (directory / 'harness.log').write_text(result.stdout + result.stderr, encoding='utf-8')
        receipt = json.loads((directory / 'receipt.json').read_text(encoding='utf-8-sig'))
        if checked:
            assert result.returncode == 0, 'Native stage failed: ' + name
            validate_stage(receipt, name, child.pid, directory)
            terminal['completedStages'].append(name)
        return receipt
    def launch(ordinal, reopen):
        nonlocal child
        write(output / f'launch-{ordinal}-reserved.json', {'ordinal': ordinal, 'candidate': CANDIDATE, 'executableSHA256': EXE_SHA, 'phase': 2 if reopen else 1})
        terminal['launchOrdinals'].append(ordinal)
        terminal['appLaunches'] = len(terminal['launchOrdinals'])
        env = {k: v for k, v in os.environ.items() if not k.startswith('LOOMLIGHT_')}
        env.update(LOOMLIGHT_RUNTIME_UI_PROBE='phase2-studio', LOOMLIGHT_REWRITE_PROBE_ROOT=str(root), LOOMLIGHT_REWRITE_PROBE_PHASE='2' if reopen else '1')
        log = (output / f'app-{ordinal}.log').open('xb'); logs.append(log)
        child = subprocess.Popen([str(executable)], env=env, stdout=log, stderr=log)
        write(output / f'launch-{ordinal}-started.json', {'ordinal': ordinal, 'pid': child.pid, 'executableSHA256': EXE_SHA})
    def exit_owned():
        nonlocal child
        code = child.wait(20)
        terminal['normalExits'].append(code)
        child = None
        assert code == 0, 'Application exited unsuccessfully'
    try:
        # AST-imported helper preflight consumes no editor start.
        preflight = output / 'preflight'; preflight.mkdir()
        result = subprocess.run(['powershell.exe', '-NoProfile', '-File', ps, '-Stage', 'preflight', '-Output', str(preflight), '-ProductRepo', str(product), '-Executable', str(executable)], capture_output=True, text=True, timeout=90)
        (preflight / 'harness.log').write_text(result.stdout + result.stderr, encoding='utf-8')
        assert result.returncode == 0 and json.loads((preflight / 'receipt.json').read_text(encoding='utf-8-sig'))['passed'] is True
        launch(5, False)
        seed = stage('seed'); terminal['noSaveHTTP'] = fixture.events == []
        baseline = sources(root)
        initial = read_profiles(root); validate_profile(initial, fixture.endpoint, (.8, .9), False)
        stage('ready-first'); first = read_profiles(root); validate_profile(first, fixture.endpoint, (.8, .9), True)
        changed = stage('invalidate'); before_cancel = read_profiles(root); validate_profile(before_cancel, fixture.endpoint, (.7, .85), False)
        stage('cancel'); after_cancel = read_profiles(root); validate_profile(after_cancel, fixture.endpoint, (.7, .85), False)
        terminal['cancelProfileUnchanged'] = before_cancel == after_cancel
        stage('ready-final'); final = read_profiles(root); validate_profile(final, fixture.endpoint, (.7, .85), True)
        terminal['requestPreviewSHA256'] = [seed['preview']['rawSHA256'], changed['preview']['rawSHA256'], changed['preview']['rawSHA256']]
        stage('close'); exit_owned()
        count = len(fixture.events)
        launch(6, True); stage('reopen')
        terminal['reopenNoHTTP'] = len(fixture.events) == count == 3
        terminal['reopenProfileUnchanged'] = read_profiles(root) == final
        terminal['sourceUnchanged'] = sources(root) == baseline
        stage('cleanup'); empty = read_profiles(root)
        terminal['profileReferencesRemoved'] = empty.get('profiles') == [] and empty.get('cleanup') == []
        stage('close-reopen'); exit_owned()
        assert terminal['profileReferencesRemoved'], 'Native owned credential cleanup remains pending'
        shutil.rmtree(root); terminal['rootRemoved'] = not root.exists()
        terminal['passed'] = True
    except Exception as error:
        failed = type(error).__name__ + ': ' + str(error)
        terminal['failure'] = failed
    finally:
        terminal['cleanupAttempted'] = True
        if child and child.poll() is None:
            try:
                stage('cleanup-after-failure', False)
            except Exception as error:
                terminal['cleanupFailure'] = type(error).__name__ + ': ' + str(error)
            try:
                stage('close-after-failure', False)
                code = child.wait(15)
                terminal['normalExits'].append(code)
                terminal['failureExit'] = {'pid': child.pid, 'exitCode': code, 'forced': False}
            except Exception:
                child.kill(); child.wait(10)
                terminal['forcedExit'] = True
                terminal['failureExit'] = {'pid': child.pid, 'exitCode': child.returncode, 'forced': True}
        elif child:
            terminal['normalExits'].append(child.returncode)
            terminal['failureExit'] = {'pid': child.pid, 'exitCode': child.returncode, 'forced': False}
        child = None
        try:
            fixture.close(); terminal['listenerStopped'] = True
        except Exception as error:
            terminal['listenerStopped'] = False
            failed = failed or type(error).__name__ + ': ' + str(error)
            terminal['failure'] = failed
        terminal['requests'] = copy.deepcopy(fixture.events)
        if root.exists():
            # Never delete the only ownership/recovery references to a remaining OS key.
            try:
                empty = read_profiles(root)
                if empty.get('profiles') == [] and empty.get('cleanup') == []:
                    shutil.rmtree(root)
            except (OSError, ValueError, AssertionError) as error:
                terminal['ownedRootRetentionReason'] = 'Owned profile-reference cleanup could not be verified: ' + type(error).__name__
        terminal['rootRemoved'] = not root.exists()
        for log in logs:
            log.close()
        if not failed:
            try:
                validate_terminal(terminal)
            except Exception as error:
                failed = type(error).__name__ + ': ' + str(error)
                terminal['failure'] = failed
        terminal['passed'] = not failed
        write(output / 'terminal.json', terminal)
    if failed:
        raise RuntimeError(failed)
    print('PASS: exact reused Windows package/native Settings sampling/setup/cancel/readiness/process reopen/owned credential cleanup')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--product-repo', type=Path, required=True)
    parser.add_argument('--executable', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--input-manifest', type=Path, required=True)
    parser.add_argument('--harness-ref', required=True)
    parser.add_argument('--first-launch-ordinal', type=int, choices=[5], required=True)
    run(parser.parse_args())

if __name__ == '__main__':
    main()
