"""Early 3B exact-source dispatch and real SDK rendering proof on fictional data."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA256 = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
TESTS = (
    'screen_source_dispatch_roundtrip_history_conflict_and_reopen',
    'screen_source_protects_lexical_and_unknown_boundaries',
    'screen_source_requests_refuse_invalid_session_schema_range_and_opaque_target',
)


def validate_core_output(text):
    for name in TESTS:
        assert text.splitlines().count(f'test screens::tests::{name} ... ok') == 1, 'required individual case missing/duplicated: ' + name
    assert len([line for line in text.splitlines() if re.fullmatch(
        r'test result: ok\. 3 passed; 0 failed; 0 ignored; 0 measured; \d+ filtered out; finished in [0-9.]+s', line)]) == 1, 'missing focused test completion'


def validate_candidate(candidate):
    before, accepted = candidate['before'].encode(), candidate['accepted'].encode()
    fixture = (REPO / 'tests/fixtures/phase-3b-screens/help.rpy').read_text()
    assert before == ('\ufeff' + fixture.replace('\n', '\r\n')).encode(), 'source fixture identity changed'
    start = candidate['byteStart']
    assert hashlib.sha256(before).hexdigest() == candidate['beforeSHA256']
    assert hashlib.sha256(accepted).hexdigest() == candidate['acceptedSHA256']
    assert before[start:start+3] == b'640'
    assert accepted == before[:start] + b'720' + before[start+3:]
    assert candidate['schemaVersion'] == 1 and candidate['screen'] == 'loomlight_help'
    assert candidate['property'] == 'xsize' and candidate['value'] == 720
    assert all(candidate[k] is True for k in ('roundtrip', 'undoRedo', 'draftRetained', 'reopen'))
    return accepted


def validate_runtime_output(text):
    assert '[rpytest] Status: PASSED' in text, 'missing real-runtime completion'
    assert 'global.screenproof::layout' in text, 'missing named runtime case'
    rows = [json.loads(line.split('SCREEN_PROOF_OBSERVED ', 1)[1]) for line in text.splitlines()
            if line.startswith('SCREEN_PROOF_OBSERVED ')]
    assert len(rows) == 1, 'missing or duplicated observed runtime values'
    assert all(row == {'panelSize': [720, 360], 'continuationCount': 1, 'opaqueNeighbor': True}
               for row in rows), 'runtime values disagree'
    summary = [line for line in text.splitlines() if line.startswith('[rpytest] Test cases :')]
    assert len(summary) == 1 and list(map(int, re.findall(r'\d+', summary[0]))) == [1, 1, 0, 0, 0, 0, 0], 'wrong or incomplete case summary'
    duration = re.findall(r'\[rpytest\] Time: ([0-9.]+) s', text)
    assert len(duration) == 1 and float(duration[0]) > 0, 'missing runtime duration'
    return rows


def core_inputs(values):
    return {p: digest for p, digest in values.items()
            if p.startswith(('app/src-core/', 'app/src-tauri/', 'app/src/', 'app/tests/', 'app/scripts/', 'tests/fixtures/'))
            or p in ('app/Cargo.toml', 'app/Cargo.lock', 'app/rust-toolchain.toml', 'app/tsconfig.json')}


def retain_test_binary(text, output):
    for line in text.splitlines():
        if not line.startswith('{'):
            continue
        row = json.loads(line)
        if (row.get('reason') != 'compiler-artifact' or not row.get('profile', {}).get('test')
                or not row.get('executable') or row.get('target', {}).get('name') != 'loomlight_core'):
            continue
        binary = Path(row['executable'])
        destination = output / 'test-binary' / binary.name
        destination.parent.mkdir(exist_ok=True)
        shutil.copyfile(binary, destination)
        return {'name': binary.name, 'path': destination.relative_to(output).as_posix(),
                'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'bytes': destination.stat().st_size}
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--ordinal', type=int, choices=(1, 2), required=True)
    parser.add_argument('--allow-fixture-execution', action='store_true', required=True)
    parser.add_argument('--reuse-core-from', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    checks = []
    result = {'passed': False, 'ordinal': args.ordinal, 'checks': checks,
              'localEditorLaunches': 0, 'sdkPreviewLaunches': 0,
              'os': platform.system(), 'architecture': platform.machine(),
              'candidate': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
              'tree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=REPO, text=True).strip(),
              'runId': os.environ.get('GITHUB_RUN_ID'), 'attempt': os.environ.get('GITHUB_RUN_ATTEMPT'),
              'scope': 'early source proof; no live Screens workspace or full 3B acceptance'}
    files = set()
    for directory in ('app/src-core', 'app/src-tauri', 'app/src', 'app/tests', 'app/scripts'):
        files.update(p for p in (REPO / directory).rglob('*') if '__pycache__' not in p.parts)
    files.update((REPO / 'tests/fixtures').rglob('*'))
    files.update(REPO / p for p in ('app/Cargo.toml', 'app/Cargo.lock', 'app/src-core/Cargo.toml',
        'app/rust-toolchain.toml', 'app/tsconfig.json', 'app/src-tauri/Cargo.toml',
        'app/src-tauri/build.rs', 'app/src-tauri/tauri.conf.json', 'app/src-tauri/capabilities/main.json',
        'app/src-tauri/permissions/core-request.toml', 'app/src/protocol.ts',
        '.github/workflows/screens-source.yml', 'app/scripts/qualify-screens-source.py',
        'spikes/renpy-sdk/archive_safety.py', 'spikes/renpy-sdk/sdk_adapter.py'))
    manifest = {p.relative_to(REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(files) if p.is_file()}
    (output / 'inputs.json').write_text(json.dumps(manifest, indent=2) + '\n')
    result['toolchains'] = {tool: subprocess.check_output([tool, '--version'], text=True, timeout=15).strip()
                            for tool in ('cargo', 'rustc')}
    result['toolchains']['python'] = platform.python_version()

    def run(name, argv, cwd, env=None, timeout=180):
        previous_env, previous_cwd = dict(os.environ), Path.cwd()
        record = {'name': name, 'passed': False}
        checks.append(record)
        try:
            os.chdir(cwd)
            if env is not None:
                os.environ.clear()
                os.environ.update(env)
            value = run_bounded(tuple(map(str, argv)), timeout_seconds=timeout, output_limit=2_000_000)
            (output / (name + '.log')).write_text(value.output, encoding='utf-8')
            if name == 'core-dispatch':
                result['testBinary'] = retain_test_binary(value.output, output)
            record.update(exitCode=value.exit_code, timedOut=value.timed_out,
                          outputLimited=value.output_limited, processReaped=True, durationSeconds=value.duration_seconds)
            if value.exit_code != 0 or value.timed_out or value.output_limited:
                raise RuntimeError(name + ' failed; retained bounded log has details')
            record['passed'] = True
            print(name + ': passed', flush=True)
            return value.output
        finally:
            os.environ.clear()
            os.environ.update(previous_env)
            os.chdir(previous_cwd)

    try:
        if args.reuse_core_from is not None:
            previous = args.reuse_core_from.resolve()
            previous_manifest = json.loads((previous / 'inputs.json').read_text())
            assert core_inputs(manifest) == core_inputs(previous_manifest), 'core inputs changed; cannot reuse'
            previous_result = json.loads((previous / 'result.json').read_text())
            assert any(c['name'] == 'core-dispatch' and c['passed'] and c['exitCode'] == 0
                for c in previous_result['checks']), 'no passed core check to reuse'
            for name in ('accepted-source.json', 'core-dispatch.log'):
                shutil.copyfile(previous / name, output / name)
            text = (output / 'core-dispatch.log').read_text()
            checks.append({'name': 'core-dispatch', 'passed': True, 'exitCode': 0, 'reusedUnchangedInputs': True})
            result['testBinary'] = previous_result['testBinary']
            binary = previous / result['testBinary']['path']
            assert hashlib.sha256(binary.read_bytes()).hexdigest() == result['testBinary']['sha256']
            destination = output / result['testBinary']['path']
            destination.parent.mkdir(parents=True)
            shutil.copyfile(binary, destination)
        else:
            env = dict(os.environ, LOOMLIGHT_SCREEN_EVIDENCE=str(output / 'accepted-source.json'))
            text = run('core-dispatch', ['cargo', 'test', '-p', 'loomlight-core', '--locked', '--message-format=json',
                        'screens::tests', '--', '--nocapture'], REPO / 'app', env, 600)
        assert result['testBinary'] is not None, 'required produced test binary missing'
        validate_core_output(text)
        candidate = json.loads((output / 'accepted-source.json').read_text())
        accepted = validate_candidate(candidate)
        assert expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA256
        with tempfile.TemporaryDirectory(prefix='loomlight-screen-proof-') as temporary:
            temporary = Path(temporary)
            archive_root = temporary / 'sdk'
            install_verified_tar(args.archive, SDK_SHA256, archive_root)
            sdk = archive_root / 'renpy-8.5.3-sdk'
            launcher = launcher_for(sdk)
            game = temporary / 'game-project'
            (game / 'game/ui').mkdir(parents=True)
            (game / 'game/ui/help.rpy').write_bytes(accepted)
            shutil.copyfile(REPO / 'tests/fixtures/phase-1h/assets/booth.png', game / 'game/help.png')
            (game / 'game/script.rpy').write_text('''define config.name = "Loomlight screen proof"
define config.screen_width = 1280
define config.screen_height = 720
define config.save_directory = None
default screen_finished_count = 0
screen screenproof_done():
    text "Help finished"
label start:
    call screen loomlight_help
    $ screen_finished_count += 1
    call screen screenproof_done
    return
''', encoding='utf-8')
            (game / 'game/proof_test.rpy').write_text('''testsuite screenproof:
    after testcase:
        exit
    testcase layout:
        assert screen "loomlight_help" timeout 10
        assert eval (screen_proof_neighbor == "kept exactly")
        $ screen_panel_size = renpy.render(renpy.get_displayable("loomlight_help", "help_panel"), 1280, 720, 0, 0).get_size()
        assert eval (screen_panel_size == (720, 360))
        pause 0.5
        $ renpy.take_screenshot()
        $ screen_capture_ok = renpy.screenshot(config.basedir + "/screen.png")
        assert eval screen_capture_ok
        click "Close"
        assert screen "screenproof_done" timeout 10
        assert eval (screen_finished_count == 1)
        $ print("SCREEN_PROOF_OBSERVED " + __import__("json").dumps(dict(panelSize=list(screen_panel_size), continuationCount=screen_finished_count, opaqueNeighbor=(screen_proof_neighbor == "kept exactly"))), flush=True)
''', encoding='utf-8')
            sdk_env = dict(os.environ, RENPY_PATH_TO_SAVES=str(temporary / 'saves'), SDL_AUDIODRIVER='dummy')
            assert 'Ren\'Py 8.5.3' in run('sdk-version', [*launcher, '--version'], sdk, sdk_env)
            run('sdk-compile', [*launcher, game, 'compile'], sdk, sdk_env)
            run('sdk-lint', [*launcher, game, 'lint', '--error-code'], sdk, sdk_env)
            result['sdkPreviewLaunches'] += 1
            runtime = run('sdk-render', [*launcher, game, 'test', 'screenproof::layout'], sdk, sdk_env)
            result['runtimeObserved'] = validate_runtime_output(runtime)
            assert (game / 'game/ui/help.rpy').read_bytes() == accepted
            screenshot = game / 'screen.png'
            assert screenshot.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
            shutil.copyfile(screenshot, output / 'screen.png')
            result['screenshotSHA256'] = hashlib.sha256(screenshot.read_bytes()).hexdigest()
            result.update(sdkVersion='8.5.3', sdkSHA256=SDK_SHA256, acceptedSourceUnchanged=True,
                          renderedPanelSize=[720, 360], closeContinuesOnce=True)
        result.update(passed=True, cleanupComplete=not temporary.exists())
        assert result['cleanupComplete']
    except Exception as error:
        result['failure'] = {'type': type(error).__name__, 'message': str(error)}
        raise
    finally:
        if 'temporary' in locals():
            result['cleanupComplete'] = not temporary.exists()
        (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    main()
