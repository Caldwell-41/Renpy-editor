"""Focused native-core and SDK proof; no packaged editor, provider or Phase 2 gate."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
import subprocess
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'spikes/renpy-sdk'))
from sdk_adapter import run_bounded

REPO = Path(__file__).resolve().parents[2]
APP = REPO / 'app'
spec = importlib.util.spec_from_file_location('story_evidence', Path(__file__).with_name('check-story-logic-evidence.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def command(argv):
    # Use the pinned Node CLI on Windows too; npm is a command shim there.
    if argv[0] != 'npm':
        return argv
    cli = Path(os.environ['STORY_NPM_CLI'])
    node = shutil.which('node')
    if not cli.is_file() or node is None:
        raise RuntimeError('selected Node/npm CLI unavailable')
    return [node, str(cli), *argv[1:]]


def input_manifest(repo):
    app = repo / 'app'
    files = set()
    for directory in ('src-core/src', 'src-core/examples', 'src', 'tests', 'public'):
        files.update((app / directory).rglob('*'))
    files.update(app / p for p in ('Cargo.toml', 'Cargo.lock', 'src-core/Cargo.toml',
        'src-tauri/Cargo.toml', 'rust-toolchain.toml', 'package.json', 'package-lock.json',
        'tsconfig.json', 'tsconfig.tests.json', 'vite.config.ts', 'index.html', 'scripts/scan-artifacts.mjs'))
    files.update(repo / p for p in ('.github/workflows/quality.yml', '.github/workflows/story-logic.yml'))
    files.update((app / 'scripts').glob('*story*'))
    files.update((app / 'src-core/prompts/v1').glob('*.txt'))
    files.add(repo / 'tests/fixtures/source-foundation/scene.rpy')
    files.update((repo / 'spikes/renpy-sdk').glob('*.py'))
    return {p.relative_to(repo).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(files) if p.is_file()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--ordinal', type=int, choices=(1, 2, 3), required=True)
    args = parser.parse_args()
    args.output = args.output.resolve()
    args.output.mkdir(parents=True, exist_ok=False)
    checks = []
    sdk = None
    identity = {'candidate': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                'tree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=REPO, text=True).strip(),
                'runId': os.environ.get('GITHUB_RUN_ID'), 'attempt': os.environ.get('GITHUB_RUN_ATTEMPT'),
                'ordinal': args.ordinal, 'architecture': platform.machine(), 'os': platform.system(),
                'toolchains': {name: subprocess.check_output(command([name, '--version']), text=True, timeout=15).strip() for name in ('cargo', 'rustc', 'node', 'npm')},
                'packagedUi': 'not exercised', 'humanAcceptance': 'not claimed', 'phase2Acceptance': 'paused incomplete'}
    (args.output / 'identity.json').write_text(json.dumps(identity, indent=2) + '\n', encoding='utf-8')
    (args.output / 'inputs.json').write_text(json.dumps(input_manifest(REPO), indent=2) + '\n', encoding='utf-8')

    def run(name, argv, timeout=600, env=None, required=()):
        record = {'name': name, 'passed': False}
        checks.append(record)
        before_env = dict(os.environ)
        before_cwd = Path.cwd()
        try:
            os.chdir(APP)
            if env is not None:
                os.environ.clear()
                os.environ.update(env)
            result = run_bounded(tuple(command(argv)), timeout_seconds=timeout, output_limit=2_000_000)
            text = result.output
            (args.output.resolve() / (name + '.log')).write_text(text, encoding='utf-8')
            print(text, end='', flush=True)
            record.update(exitCode=result.exit_code, timedOut=result.timed_out,
                          outputLimited=result.output_limited, processReaped=True)
            if result.timed_out or result.output_limited or result.exit_code != 0:
                raise RuntimeError(name + ' failed, exceeded deadline or output budget')
            if argv[0] == 'cargo' and argv[1] == 'test':
                record['passedTests'] = gate.cargo_ok(text, required)
            record['passed'] = True
            return text
        finally:
            os.chdir(before_cwd)
            os.environ.clear()
            os.environ.update(before_env)

    try:
        sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, verify_sha256
        expected = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
        if expected_sha256(args.checksums.read_text(encoding='utf-8'), 'renpy-8.5.3-sdk.tar.bz2') != expected:
            raise RuntimeError('official checksum does not match pin')
        verify_sha256(args.archive, expected)
        identity['sdkArchiveSHA256'] = expected
        run('renderer-typecheck', ['npm', 'run', 'typecheck'])
        run('renderer-test-compile', ['npm', 'run', 'build:tests'])
        dom_files = gate.FINAL_DOM_FILES if args.ordinal == 3 else ('dist-tests/tests/phase3a-renderer.dom.test.js',)
        dom_names = gate.FINAL_DOM_TESTS if args.ordinal == 3 else gate.DOM_TESTS
        text = run('renderer-dom', ['node', '--test', '--test-concurrency=1', *dom_files])
        checks[-1]['passed'] = False
        checks[-1]['passedTests'] = gate.dom_ok(text, dom_names)
        checks[-1]['passed'] = True
        run('renderer-build', ['npm', 'run', 'build'])
        run('focused-core', ['cargo', 'test', '-p', 'loomlight-core', '--release', '--locked', '--lib', 'phase3a_', '--', '--skip', gate.SDK_TEST, '--nocapture'], required=gate.CORE_TESTS)
        if args.ordinal == 3:
            run('controller-driver-build', ['cargo', 'build', '-p', 'loomlight-core', '--example', 'story-controller-driver', '--release', '--locked'])
            executable = APP / 'target/release/examples' / ('story-controller-driver.exe' if platform.system() == 'Windows' else 'story-controller-driver')
            text = run('controller-dispatch', ['node', 'scripts/story-controller.mjs', '--driver', str(executable),
                '--output', str(args.output / 'controller'), '--cases', 'scripts/story-controller-cases.mjs'])
            checks[-1]['passed'] = False
            gate.controller_ok(text)
            checks[-1]['passed'] = True
        env = dict(os.environ, LOOMLIGHT_RUNTIME_SDK_ARCHIVE=str(args.archive.resolve()), LOOMLIGHT_PHASE3A_EVIDENCE_DIR=str((args.output / 'sdk').resolve()))
        text = run('sdk', ['cargo', 'test', '-p', 'loomlight-core', '--release', '--locked', '--lib', gate.SDK_TEST, '--', '--ignored', '--exact', '--nocapture'], timeout=900, env=env, required=(gate.SDK_TEST,))
        candidate_sdk = gate.sdk_ok(text)
        gate.sdk_artifacts_ok(args.output / 'sdk', candidate_sdk)
        (args.output / 'sdk-report.json').write_text(json.dumps(candidate_sdk, indent=2) + '\n', encoding='utf-8')
        sdk = candidate_sdk  # Publish only after blocking gates and report retention succeed.
    finally:
        (args.output / 'identity.json').write_text(json.dumps(identity, indent=2) + '\n', encoding='utf-8')
        (args.output / 'result.json').write_text(json.dumps({'passed': len(checks) == (8 if args.ordinal == 3 else 6) and all(c['passed'] for c in checks) and sdk is not None,
                                                           'checks': checks, 'sdkEvidenceValidated': sdk is not None}, indent=2) + '\n', encoding='utf-8')
        gate.seal(args.output)


if __name__ == '__main__':
    main()
