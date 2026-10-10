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
        npm = Path(shutil.which('npm'))
        argv = [str(node), str(npm.parent / 'node_modules/npm/bin/npm-cli.js'), *argv[1:]]
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
    failures = []
    checks = [
        ('renderer', ['npm', 'run', 'check'], None),
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
    executable = APP/'target/release/loomlight.exe'
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
        receipt.update({'credentialReferencesRemoved': True, 'fixtureHashes': {str(p.relative_to(root)): digest(p) for p in root.rglob('*') if p.is_file()}})
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
    (output/'manifest.json').write_text(json.dumps({str(p.relative_to(output)): digest(p) for p in output.rglob('*') if p.is_file()}, indent=2)+'\n')
    if not summary['passed']:
        raise RuntimeError('Required Windows cases failed/skipped/pending; audit terminal evidence')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=('prepare', 'sdk', 'build', 'native', 'finish'))
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--ordinal', type=int)
    parser.add_argument('--archive', type=Path)
    parser.add_argument('--checksums', type=Path)
    args = parser.parse_args()
    if args.stage == 'prepare': prepare(args.output)
    elif args.stage == 'sdk': sdk(args.output, args.archive, args.checksums)
    elif args.stage == 'build': build(args.output, args.ordinal)
    elif args.stage == 'native': native(args.output, args.ordinal)
    else: finish(args.output)


if __name__ == '__main__':
    main()
