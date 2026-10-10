"""Bounded Windows rewrite recipe for the existing production workflow; no polling/retries."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import time

from rewrite_probe_gate import validate_report

REPO = Path(__file__).resolve().parents[2]
APP = REPO / 'app'
SDK_HASH = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
# Exact diagnosed harness-only differences; no production source is exempted.
REUSE_HARNESS_PATHS = {
    '.github/workflows/production-scaffold.yml',
    'app/scripts/qualify-rewrite-windows.py',
    'app/scripts/rewrite-windows-native.ps1',
    'app/scripts/test_rewrite_windows_reuse.py',
    'app/src-core/src/rewrite/tests.rs',
    'app/src-tauri/examples/rewrite-controller-driver.rs',
}


def validate_toolchains(toolchains):
    engines = json.loads((APP/'package.json').read_text())['engines']
    assert toolchains['node'] == 'v'+engines['node'], 'Recorded Node version differs from repository pin'
    assert toolchains['npm'] == engines['npm'], 'Recorded npm version differs from repository pin'


def validate_reuse_inputs(packaged, current, allowed=REUSE_HARNESS_PATHS):
    required = {'app/Cargo.lock', 'app/package-lock.json', 'app/package.json',
                'app/src-tauri/src/main.rs', 'app/src-tauri/src/ai_native/windows.rs',
                'app/src-tauri/tauri.conf.json', 'app/src-core/src/rewrite.rs',
                'app/src/rewrite-ui.ts'}
    assert required <= packaged.keys() and required <= current.keys(), 'Complete runtime inventory required'
    assert {k: v for k, v in packaged.items() if k not in allowed} == {k: v for k, v in current.items() if k not in allowed}, 'Retained production inputs changed; rebuild requires selection'


def reuse_focused(output, source):
    metadata = json.loads((source/'run-metadata.json').read_text())
    identity = json.loads((source/'identity.json').read_text())
    assert str(metadata['id']) == os.environ['REUSE_FOCUSED_RUN_ID'] == identity['runId']
    assert metadata['run_attempt'] == identity['attempt'] == 1 and metadata['workflow_id'] == 357322921
    assert metadata['head_branch'] == 'codex/provider-qualification' and metadata['event'] == 'workflow_dispatch' and metadata['status'] == 'completed'
    assert metadata['head_sha'] == identity['candidate'] and identity['os'] == 'Windows'
    validate_toolchains(identity['toolchains'])
    validate_reuse_manifest(source, json.loads((source/'manifest.json').read_text()))
    paths = subprocess.check_output(['git', 'ls-files', 'app', '.github/workflows/production-scaffold.yml', 'spikes/renpy-sdk'], cwd=REPO, text=True).splitlines()
    # Core test and controller-example inputs must match their successful run.
    allowed = REUSE_HARNESS_PATHS - {'app/src-core/src/rewrite/tests.rs', 'app/src-tauri/examples/rewrite-controller-driver.rs'}
    validate_reuse_inputs(identity['inputs'], {p: digest(REPO/p) for p in paths}, allowed)
    assert json.loads((source/'focused-result.json').read_text())['passed'] is True
    checks = {'core-rewrite': 'test result: ok. 9 passed; 0 failed; 0 ignored;',
              'transport': 'test result: ok. 8 passed; 0 failed; 0 ignored;',
              'native-worker': 'test result: ok. 6 passed; 0 failed; 0 ignored;',
              'controller': 'PASS: actual controller/native credentials/exact strict-schema HTTP',
              'renderer': 'pass 123', 'renderer-build': 'built in'}
    destination = output/'reused-focused'; destination.mkdir()
    for name, expected in checks.items():
        assert json.loads((source/f'{name}-result.json').read_text())['exitCode'] == 0
        assert expected in (source/f'{name}.log').read_text()
        for suffix in ('.log', '-result.json'):
            shutil.copy2(source/(name+suffix), destination/(name+suffix))
    for name in ('identity.json', 'focused-result.json', 'manifest.json'):
        shutil.copy2(source/name, destination/name)
    receipt = {'passed': True, 'sourceRunId': identity['runId'], 'sourceAttempt': 1,
               'sourceCandidate': identity['candidate'], 'inputsMatch': True}
    (output/'focused-reuse.json').write_text(json.dumps(receipt, indent=2)+'\n')


def validate_reuse_manifest(source, manifest):
    assert manifest, 'Source manifest required'
    for key, expected in manifest.items():
        parts = key.replace('\\', '/').split('/')
        assert all(p and p not in ('.', '..') and ':' not in p for p in parts), 'Contained manifest paths required'
        path = source.joinpath(*parts)
        assert path.is_file() and not path.is_symlink() and digest(path) == expected, 'Source artifact changed or missing'


def reuse(output, source):
    # A failed overall run can supply individually successful SDK/package evidence.
    # Its failed core/native cases never become passes by reuse.
    metadata = json.loads((source/'run-metadata.json').read_text())
    assert str(metadata['id']) == os.environ['REUSE_REWRITE_RUN_ID']
    assert metadata['run_attempt'] == 1 and metadata['workflow_id'] == 357322921
    assert metadata['head_branch'] == 'codex/provider-qualification' and metadata['event'] == 'workflow_dispatch' and metadata['status'] == 'completed'
    manifest = json.loads((source/'manifest.json').read_text())
    validate_reuse_manifest(source, manifest)
    identity = json.loads((source/'identity.json').read_text())
    packaged = json.loads((source/'package-inputs.json').read_text())
    validate_toolchains(identity['toolchains'])
    assert identity['candidate'] == metadata['head_sha'] == packaged['candidate']
    assert identity['runId'] == str(metadata['id']) and identity['attempt'] == 1
    assert packaged['runId'] == identity['runId'] and packaged['attempt'] == '1'
    assert packaged['os'] == 'Windows' and packaged['architecture'].lower() in ('amd64', 'x86_64')
    paths = subprocess.check_output(['git', 'ls-files', 'app', '.github/workflows/production-scaffold.yml', 'tests/fixtures/phase-1h'], cwd=REPO, text=True).splitlines()
    validate_reuse_inputs(packaged['inputs'], {p: digest(REPO/p) for p in paths})
    assert digest(source/'package/loomlight.exe') == packaged['executableSha256']
    for name in ('package', 'package-privacy', 'evidence-privacy', 'sdk'):
        assert json.loads((source/f'{name}-result.json').read_text())['exitCode'] == 0, 'Successful source case required: '+name
    sdk_identity = json.loads((source/'sdk-identity.json').read_text())
    assert sdk_identity['passed'] is True and sdk_identity['version'] == '8.5.3' and sdk_identity['officialPublishedSHA256'] == SDK_HASH == sdk_identity['archiveSHA256']
    assert '[rpytest] Status: PASSED' in (source/'sdk-commands/command-5.log').read_text()
    shutil.copytree(source/'package', output/'package')
    proof = output/'reused-proof'; proof.mkdir()
    for name in ('manifest.json', 'identity.json', 'package-inputs.json', 'package-result.json', 'sdk-identity.json', 'terminal-audit.json'):
        shutil.copy2(source/name, proof/name)
    shutil.copytree(source/'sdk-commands', proof/'sdk-commands')
    receipt = {'passed': True, 'sourceRunId': identity['runId'], 'sourceAttempt': 1,
               'sourceCandidate': identity['candidate'], 'executableSHA256': packaged['executableSha256'],
               'sdkPassed': True, 'packagePassed': True,
               'sourceManifestSHA256': digest(source/'manifest.json'),
               'runtimeInputsMatch': True, 'allowedHarnessDifferences': sorted(REUSE_HARNESS_PATHS)}
    (output/'reuse.json').write_text(json.dumps(receipt, indent=2)+'\n')


def verify_reuse(output, kind):
    receipt = json.loads((output/'reuse.json').read_text())
    assert receipt['passed'] is True and receipt[kind+'Passed'] is True
    assert digest(output/'package/loomlight.exe') == receipt['executableSHA256']
    print(f'{kind}: reused audited source run {receipt["sourceRunId"]}; no new package build or SDK execution', flush=True)


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def command(argv):
    # Windows npm is a command shim. Invoke its pinned JS CLI via node instead
    # of enabling a shell or concatenating command arguments.
    if argv[0] == 'npm':
        node = Path(shutil.which('node'))
        npm_cli = os.environ.get('REWRITE_NPM_CLI')
        if not npm_cli:
            npm_cli = str(Path(shutil.which('npm')).parent / 'node_modules/npm/bin/npm-cli.js')
        assert Path(npm_cli).is_file(), 'Selected npm CLI unavailable'
        argv = [str(node), npm_cli, *argv[1:]]
    return argv


def run(output, name, argv, timeout=900, cwd=APP):
    started = time.monotonic()
    try:
        result = subprocess.run(command(argv), cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=timeout)
        text = result.stdout + result.stderr
        code = result.returncode
    except subprocess.TimeoutExpired as error:
        def decode(value):
            return value.decode('utf-8', errors='replace') if isinstance(value, bytes) else value or ''
        text = decode(error.stdout) + decode(error.stderr) + '\nHarness deadline exceeded.\n'
        code = -1
    (output / f'{name}.log').write_text(text, encoding='utf-8')
    (output / f'{name}-result.json').write_text(json.dumps({'case': name, 'exitCode': code, 'elapsedSeconds': round(time.monotonic()-started, 2)}, indent=2)+'\n')
    print(f'{name}: exit {code}', flush=True)
    if code:
        raise RuntimeError(name + ' failed; see retained log')
    return text


def entry(output, kind, ordinal):
    identity = json.loads((output / 'identity.json').read_text())
    assert os.environ['GITHUB_RUN_ID'] == identity['runId'] and os.environ['GITHUB_RUN_ATTEMPT'] == '1'
    with (output / 'attempt-ledger.jsonl').open('a', encoding='utf-8') as stream:
        stream.write(json.dumps({'kind': kind, 'ordinal': ordinal, 'runId': identity['runId'], 'attempt': 1, 'sha': identity['candidate']})+'\n')


def prepare(output):
    assert platform.system() == 'Windows' and platform.machine().lower() in ('amd64', 'x86_64')
    assert os.environ['GITHUB_REF'] == 'refs/heads/codex/provider-qualification'
    assert os.environ['GITHUB_RUN_ATTEMPT'] == '1', 'Fresh dispatch only; cumulative retries require diagnosed selection'
    candidate = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    assert candidate == os.environ['GITHUB_SHA']
    paths = subprocess.check_output(['git', 'ls-files', 'app', '.github/workflows/production-scaffold.yml', 'spikes/renpy-sdk'], cwd=REPO, text=True).splitlines()
    output.mkdir(parents=True, exist_ok=True)
    assert not (output / 'identity.json').exists(), 'Fresh evidence required'
    identity = {'candidate': candidate, 'tree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=REPO, text=True).strip(), 'runId': os.environ['GITHUB_RUN_ID'], 'attempt': 1, 'runnerImage': os.environ.get('ImageVersion'), 'os': platform.system(), 'architecture': platform.machine(), 'inputs': {path: digest(REPO/path) for path in paths}, 'toolchains': {tool: subprocess.check_output(command([tool, '--version']), cwd=APP, text=True).strip() for tool in ('node', 'npm', 'rustc', 'cargo')}, 'python': platform.python_version()}
    (output / 'identity.json').write_text(json.dumps(identity, indent=2)+'\n')
    validate_toolchains(identity['toolchains'])
    if (output/'focused-reuse.json').is_file():
        reuse_receipt = json.loads((output/'focused-reuse.json').read_text())
        assert reuse_receipt['passed'] is True
        (output/'focused-result.json').write_text(json.dumps({'passed': True, 'failures': [], 'reused': reuse_receipt}, indent=2)+'\n')
        print('Selected unchanged focused checks reused from audited run '+reuse_receipt['sourceRunId'], flush=True)
        return
    failures = []
    checks = [
        ('renderer', ['npm', 'run', 'check'], None),
        ('renderer-build', ['npm', 'run', 'build'], None),
        ('core-rewrite', ['cargo', 'test', '-p', 'loomlight-core', '--release', '--locked', 'rewrite'], 9),
        ('transport', ['cargo', 'test', '-p', 'loomlight-core', '--release', '--locked', 'ai_request::tests'], 8),
        ('native-worker', ['cargo', 'test', '-p', 'loomlight-desktop', '--release', '--locked', 'ai_requests::tests'], 6),
        ('controller-build', ['cargo', 'build', '-p', 'loomlight-desktop', '--release', '--locked', '--example', 'rewrite-controller-driver'], None),
        ('literal-build', ['cargo', 'build', '-p', 'loomlight-core', '--release', '--locked', '--example', 'rewrite-literal-driver'], None),
    ]
    for name, argv, count in checks:
        try:
            text = run(output, name, argv)
            if count is not None:
                assert f'test result: ok. {count} passed; 0 failed; 0 ignored;' in text, 'Required selected cases missing'
        except Exception as error:
            failures.append(str(error))
    if (APP / 'target/release/examples/rewrite-controller-driver.exe').is_file():
        try:
            text = run(output, 'controller', ['node', 'tests/rewrite-controller.dispatch.mjs', 'target/release/examples/rewrite-controller-driver.exe'])
            assert 'PASS: actual controller/native credentials/exact strict-schema HTTP' in text
        except Exception as error:
            failures.append(str(error))
    else:
        failures.append('controller executable missing')
    (output / 'focused-result.json').write_text(json.dumps({'passed': not failures, 'failures': failures}, indent=2)+'\n')
    if failures:
        raise RuntimeError('; '.join(failures))


def sdk(output, archive, checksums):
    sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
    from archive_safety import expected_sha256, install_verified_tar
    assert expected_sha256(checksums.read_text(), archive.name) == SDK_HASH
    destination = Path(tempfile.gettempdir()) / ('loomlight-rewrite-sdk-ci-' + os.environ['GITHUB_RUN_ID'])
    install_verified_tar(archive, SDK_HASH, destination)
    try:
        text = run(output, 'sdk', [sys.executable, str(APP/'scripts/rewrite-literal-sdk.py'), '--sdk', str(destination/'renpy-8.5.3-sdk'), '--driver', str(APP/'target/release/examples/rewrite-literal-driver.exe'), '--output', str(output/'sdk-commands')], timeout=400)
        assert 'PASS: pinned Ren' in text
        (output/'sdk-identity.json').write_text(json.dumps({'version': '8.5.3', 'officialPublishedSHA256': SDK_HASH, 'archiveSHA256': digest(archive), 'literalDriverSHA256': digest(APP/'target/release/examples/rewrite-literal-driver.exe'), 'passed': True}, indent=2)+'\n')
    finally:
        shutil.rmtree(destination)


def build(output, ordinal):
    assert 1 <= ordinal <= 4
    entry(output, 'package-build', ordinal)
    run(output, 'package', ['npm', 'exec', '--', 'tauri', 'build', '--', '--locked'], timeout=1800)
    retain(output)


def retain(output):
    if (output/'reuse.json').is_file():
        verify_reuse(output, 'package')
        return
    executable = APP/'target/release/loomlight.exe'
    if not executable.is_file():
        return
    retained = output/'package/loomlight.exe'
    if (output/'package-inputs.json').is_file() and retained.is_file() and digest(retained) == digest(executable):
        return
    scan = ['node', 'scripts/scan-artifacts.mjs', 'dist', str(executable)]
    if (APP/'target/release/bundle').is_dir():
        scan.append('target/release/bundle')
    run(output, 'package-privacy', scan)
    run(output, 'package-inputs', [sys.executable, 'scripts/record-runtime-inputs.py', str(executable), str(output/'package-inputs.json')])
    # Do not claim synthetic DOM input in the generic recorder as native proof.
    inputs = json.loads((output/'package-inputs.json').read_text())
    inputs['layer'] = 'Candidate input/binary inventory; native evidence is in separate driver receipts'
    (output/'package-inputs.json').write_text(json.dumps(inputs, indent=2)+'\n')
    package = output/'package'; package.mkdir(exist_ok=True)
    shutil.copy2(executable, package/'loomlight.exe')
    assert digest(package/'loomlight.exe') == digest(executable)
    bundle = APP/'target/release/bundle'
    if bundle.is_dir():
        for source in bundle.rglob('*'):
            if source.is_file() and source.suffix.lower() in ('.msi', '.exe'):
                shutil.copy2(source, package/source.name)


def native(output, first_launch):
    assert 1 <= first_launch <= 5
    root = Path(tempfile.gettempdir()) / ('loomlight-rewrite-ci-' + os.environ['GITHUB_RUN_ID'])
    executable = output/'package/loomlight.exe' if (output/'reuse.json').is_file() else APP/'target/release/loomlight.exe'
    # Exercise the same Python -> child PowerShell context before consuming a launch.
    # Its receipt must hash the exact candidate independently of optional cmdlets.
    prelaunch = output/'native-prelaunch'
    run(output, 'native-driver-prelaunch', ['powershell.exe', '-NoProfile', '-File', str(APP/'scripts/rewrite-windows-native.ps1'), '-Stage', 'preflight', '-Executable', str(executable), '-Output', str(prelaunch)], timeout=75)
    preflight = json.loads((prelaunch/'preflight.json').read_text(encoding='utf-8-sig'))
    assert preflight['passed'] is True and preflight['executableSHA256'] == digest(executable)
    common = [sys.executable, 'scripts/dialogue-rewrite-probe.py', '--executable', str(executable), '--root', str(root), '--output', str(output/'walkthrough'), '--native-driver', str(APP/'scripts/rewrite-windows-native.ps1')]
    try:
        for phase in (1, 2):
            entry(output, 'app-launch', first_launch+phase-1)
            run(output, f'phase-{phase}', [*common, '--phase', str(phase)], timeout=960)
            report = json.loads((output/'walkthrough'/f'phase-{phase}.json').read_text())
            validate_report(report, phase)
    finally:
        cleanup_owned(output, root)


def cleanup_owned(output, root):
    # Both terminal reports prove native credential cleanup. Remove only this owned
    # fixture after byte-exact reopen and zero HTTP, retaining structural hashes.
    assert root.parent == Path(tempfile.gettempdir()) and root.name == 'loomlight-rewrite-ci-' + os.environ['GITHUB_RUN_ID'] and not root.is_symlink()
    receipt = {'cleanupComplete': False, 'ownedRootName': root.name}
    try:
        reports = [json.loads(path.read_text()) for path in (output/'walkthrough').glob('phase-*.json')]
        profile = json.loads((root/'ai-profiles.json').read_text())
        assert reports and reports[-1].get('cleanupComplete') is True
        assert all(p.get('credential') is None for p in profile['profiles'])
        receipt.update({'credentialReferencesRemoved': True, 'fixtureHashes': {p.relative_to(root).as_posix(): digest(p) for p in root.rglob('*') if p.is_file()}})
        shutil.rmtree(root)
        receipt['cleanupComplete'] = not root.exists()
    except Exception as error:
        receipt['failure'] = type(error).__name__
    (output/'cleanup.json').write_text(json.dumps(receipt, indent=2)+'\n')


def finish(output):
    # Preserve a scanned binary even when the package command produced it before
    # failing. Never promote a failed/skipped case to acceptance.
    retain(output)
    output.mkdir(parents=True, exist_ok=True)
    reports = {}; errors = []
    for phase in (1, 2):
        path = output/'walkthrough'/f'phase-{phase}.json'
        reports[str(phase)] = path.is_file()
        try:
            report = json.loads(path.read_text())
            validate_report(report, phase)
            assert len(report['requestBodySHA256']) == (5 if phase == 1 else 0)
            if phase == 1:
                from rewrite_native_evidence import NATIVE_STAGES
                assert set(report['nativeStageReceipts']) == NATIVE_STAGES
                assert report['requestBodySHA256'] == report['details']['reviewedBodyDigests']
        except Exception as error:
            errors.append(f'Phase {phase}: {type(error).__name__}')
    outcomes = {name: os.environ.get(name, 'missing') for name in ('FOCUSED_OUTCOME', 'SDK_OUTCOME', 'PACKAGE_OUTCOME', 'NATIVE_OUTCOME', 'CAPABILITY_OUTCOME')}
    root = Path(tempfile.gettempdir()) / ('loomlight-rewrite-ci-' + os.environ['GITHUB_RUN_ID'])
    if root.exists():
        errors.append('Owned fixture remains; native terminal cleanup needs audit')
    if not (output/'cleanup.json').is_file() or json.loads((output/'cleanup.json').read_text()).get('cleanupComplete') is not True:
        errors.append('Owned credential/fixture cleanup receipt missing')
    summary = {'candidate': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'], 'attempt': 1, 'outcomes': outcomes, 'reportsPresent': reports, 'errors': errors, 'passed': not errors and all(value == 'success' for value in outcomes.values())}
    (output/'terminal-audit.json').write_text(json.dumps(summary, indent=2)+'\n')
    # Evidence uploads never include fixture stores, SDKs or credential material.
    run(output, 'evidence-privacy', ['node', 'scripts/scan-artifacts.mjs', str(output)])
    (output/'manifest.json').write_text(json.dumps({p.relative_to(output).as_posix(): digest(p) for p in output.rglob('*') if p.is_file()}, indent=2)+'\n')
    if not summary['passed']:
        raise RuntimeError('Required Windows cases failed/skipped/pending; audit terminal evidence')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=('prepare', 'sdk', 'build', 'native', 'finish', 'reuse', 'reuse-package', 'reuse-sdk', 'reuse-focused'))
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--ordinal', type=int)
    parser.add_argument('--archive', type=Path)
    parser.add_argument('--checksums', type=Path)
    parser.add_argument('--source', type=Path)
    args = parser.parse_args()
    if args.stage == 'prepare': prepare(args.output)
    elif args.stage == 'sdk': sdk(args.output, args.archive, args.checksums)
    elif args.stage == 'build': build(args.output, args.ordinal)
    elif args.stage == 'native': native(args.output, args.ordinal)
    elif args.stage == 'reuse': reuse(args.output, args.source)
    elif args.stage == 'reuse-focused': reuse_focused(args.output, args.source)
    elif args.stage.startswith('reuse-'): verify_reuse(args.output, args.stage.removeprefix('reuse-'))
    else: finish(args.output)


if __name__ == '__main__':
    main()
