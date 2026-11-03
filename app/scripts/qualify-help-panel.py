"""Freeze public-core Help authoring, then separately qualify normal game input.

prepare/validate never execute an SDK. sdk requires a separate explicit grant.
Engine automation is distinct from physical keyboard/mouse or native editor proof.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import uuid

REPO = Path(__file__).resolve().parents[2]
FIXTURE = REPO / 'tests/fixtures/phase-3b-screens/help-panel'
EXPORT_TEST = 'screens::tests::panel_fixture::help_panel_runtime_fixture_exports_accepted_normal_entry_source'
SDK_SHA256 = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
CASES = ('keyboard_close', 'outside_click', 'escape', 'reshow_close', 'authored_hide', 'show_persists')


def require(value, message):
    if not value:
        raise ValueError(message)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON key: ' + key)
        result[key] = value
    return result


def load_json(text):
    return json.loads(text, object_pairs_hook=unique_object)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def portable_file(root, relative):
    require(isinstance(relative, str) and '\\' not in relative and ':' not in relative, 'nonportable path')
    parts = PurePosixPath(relative).parts
    require(parts and not relative.startswith('/') and all(part not in ('.', '..') for part in parts)
            and PurePosixPath(relative).as_posix() == relative, 'unsafe path')
    path = root
    for part in parts:
        path = path / part
        require(not path.is_symlink(), 'linked fixture path')
    require(path.is_file(), 'missing fixture file: ' + relative)
    return path


def validate_bundle(root):
    manifest = load_json(portable_file(root, 'manifest.json').read_text(encoding='utf-8'))
    require(manifest['schemaVersion'] == 1 and manifest['sdkVersion'] == '8.5.3'
            and manifest['publicCoreRequests'] is True and manifest['engineStarted'] is False
            and manifest['resolution'] == [1280, 720], 'wrong fixture provenance/version')
    files = manifest['files']
    require(1 <= len(files) <= 32, 'unbounded fixture file count')
    hashes = {}

    def verify(record):
        path = portable_file(root, record['path'])
        require(type(record['bytes']) is int and 0 <= record['bytes'] <= 2_000_000
                and path.stat().st_size == record['bytes'], 'wrong/unbounded file size')
        require(re.fullmatch('[a-f0-9]{64}', record['sha256']) and digest(path) == record['sha256'], 'file hash mismatch')
        return path

    for record in files:
        relative = record['path']
        require(relative.startswith('game/') and relative not in hashes, 'duplicate/non-game file')
        require(relative.endswith('.rpy') or relative == manifest['asset']['relativePath'], 'unexpected runnable input')
        verify(record)
        hashes[relative] = record['sha256']
    actual = set()
    for path in (root / 'game').rglob('*'):
        require(not path.is_symlink() and '.renpy-editor' not in path.parts, 'metadata/linked runnable path')
        if path.is_file():
            actual.add(path.relative_to(root).as_posix())
    require(actual == set(hashes), 'missing/undeclared runnable files')
    metadata = {}
    for key, name in [('project', 'project.json'), ('sourceMap', 'source-map.json'), ('authoring', 'authoring.json')]:
        record = manifest['metadata'][key]
        require(record['path'] == name, 'wrong metadata sidecar path')
        metadata[key] = load_json(verify(record).read_text(encoding='utf-8'))
    project, mapping, authoring = (metadata[key] for key in ('project', 'sourceMap', 'authoring'))
    require(mapping['schemaVersion'] == 7 and project['projectId'] == mapping['projectId'] == authoring['projectId'], 'metadata identity mismatch')
    panel, story, entry, asset = (manifest[key] for key in ('panel', 'story', 'entry', 'asset'))
    for identifier in [panel['id'], panel['rootId'], panel['closeElementId'], story['id'], entry['id'], asset['id']]:
        require(str(uuid.UUID(identifier)) == identifier, 'invalid stable identity')
    require(project['sdk'] == {'adapter': 'renpy-8.5.3', 'version': '8.5.3'}
            and project['entrySceneId'] == entry['id'] and entry['storyId'] == story['id'], 'wrong normal entry')
    for scene in (entry, story):
        require(scene['revision'] == hashes[scene['path']], 'Scene source revision mismatch')
        require(any(s['id'] == scene['id'] and s['sourcePath'] == scene['path'] and s['technicalLabel'] == scene['label']
                    for s in project['scenes']), 'Scene metadata mismatch')
    bootstrap = portable_file(root, 'game/script.rpy').read_text(encoding='utf-8-sig').splitlines()
    require(bootstrap[-2:] == ['label start:', '    jump ' + entry['label']], 'normal start bootstrap mismatch')
    entry_source = portable_file(root, entry['path']).read_text(encoding='utf-8-sig')
    require(entry_source.rstrip().endswith('jump ' + story['label']), 'entry does not reach authored Story')
    owner = {'id': panel['id'], 'rootId': panel['rootId'], 'name': panel['name'], 'path': panel['path'], 'kind': 'panel'}
    require(panel['kind'] == 'panel' and mapping['ownedScreens'] == [owner], 'typed Panel registry mismatch')
    resolved = panel['resolved']
    binding = {'screenId': panel['id'], 'sourceName': panel['name']}
    require(resolved['binding'] == binding and resolved['kind'] == 'panel' and resolved['path'] == panel['path']
            and resolved['rootId'] == panel['rootId'], 'resolved Panel identity mismatch')
    revisions = resolved['revisions']
    require(set(revisions) == {'source', 'sourceMap', 'inventory', 'effects'}
            and all(re.fullmatch('[a-f0-9]{64}', value) for value in revisions.values()), 'invalid captured revisions')
    require(revisions['source'] == hashes[panel['path']]
            and revisions['sourceMap'] == manifest['metadata']['sourceMap']['sha256']
            and revisions['effects'] == resolved['effects']['revision']
            and resolved['effects']['unknown'] is False
            and resolved['effects']['hiddenScreens'] == [panel['id']], 'effect/revision mismatch')
    expected = ['narration', 'showScreen', 'narration', 'narration', 'narration', 'hideScreen', 'narration', 'showScreen', 'narration', 'narration', 'return']
    beats = story['beats']
    require(story['types'] == expected and [beat['payload']['type'] for beat in beats] == expected, 'wrong Story journey')
    scene_map = [s for s in mapping['sceneMappings'] if s['sceneId'] == story['id']]
    require(len(scene_map) == 1 and scene_map[0]['sourceRevision'] == story['revision']
            and scene_map[0]['path'] == story['path'], 'Story mapping missing')
    mapped_beats = scene_map[0]['beats']
    require(len(mapped_beats) == len(beats) and len({b['id'] for b in beats}) == len(beats), 'missing/duplicate Beat identity')
    source = portable_file(root, story['path']).read_bytes()
    for beat, mapped in zip(beats, mapped_beats):
        require(beat['id'] == mapped['id'] and beat['payload']['type'] == mapped['kind']
                and beat['byteStart'] == mapped['byteStart'] and beat['byteEnd'] == mapped['byteEnd']
                and 0 <= beat['byteStart'] < beat['byteEnd'] <= len(source), 'Beat mapping/range mismatch')
        require(hashlib.sha256(source[beat['byteStart']:beat['byteEnd']]).hexdigest() == mapped['sourceSha256'], 'Beat source hash mismatch')
        if mapped['kind'] in ('showScreen', 'hideScreen'):
            require(mapped.get('screenTarget') == binding and beat['payload']['target'] == binding
                    and beat['payload']['revisions'] == revisions and beat['screenEffects'] == resolved['effects'], 'lost stable binding/revision')
            require('revisions' not in mapped, 'transient revisions persisted')
    require(asset['kind'] == 'uiImage' and asset['status'] == 'available'
            and asset['sha256'] == hashes[asset['relativePath']] and asset in authoring['assets']
            and asset['naturalWidth'] == 80 and asset['naturalHeight'] == 40, 'typed image identity mismatch')
    return manifest


def validate_runtime_output(text, case, manifest_sha, accepted_hashes):
    require(case in CASES, 'unknown case')
    lines = [line.rstrip() for line in text.splitlines()]
    require(lines.count('[rpytest] Status: PASSED') == 1, 'missing/duplicate runtime completion')
    require(any(re.search(r'\bglobal\.help_panel::' + re.escape(case) + r'\b', line) for line in lines), 'missing named case')
    summary = [line for line in lines if line.startswith('[rpytest] Test cases :')]
    # Each process selects one of six cases. The five unselected cases are
    # explicitly disabled by the pinned runner; the full campaign requires all six.
    require(len(summary) == 1 and list(map(int, re.findall(r'\d+', summary[0]))) == [6, 1, 0, 0, 0, 5, 0], 'incomplete case summary')
    durations = re.findall(r'\[rpytest\] Time: ([0-9.]+) s', text)
    require(len(durations) == 1 and float(durations[0]) > 0, 'missing runtime duration')
    rows = [load_json(line.removeprefix('HELP_PANEL_OBSERVED ')) for line in lines if line.startswith('HELP_PANEL_OBSERVED ')]
    require(len(rows) == 1, 'missing/duplicate observed evidence')
    row = rows[0]
    require(row.get('schemaVersion') == 1 and row.get('sdkVersion') == '8.5.3', 'wrong evidence version')
    require(row.get('case') == case and row.get('normalEntry') is True
            and row.get('startedFromMenu') is True, 'wrong case/entry')
    require(row.get('manifestSHA256') == manifest_sha and row.get('acceptedHashes') == accepted_hashes, 'accepted source identity mismatch')
    extra, inputs = {
        'show_persists': ([('advance1', 'HP_SHOWN_1', True), ('advance2', 'HP_SHOWN_2', True)], ['advance', 'advance']),
        'authored_hide': ([('beforeHide', 'HP_SHOWN_2', True), ('hidden', 'HP_HIDDEN', False)], ['advance'] * 3),
        'reshow_close': ([('reshown', 'HP_RESHOWN', True), ('closed', 'HP_RESHOWN', False)], ['advance'] * 4 + ['clickClose']),
        'outside_click': ([('outside', ('HP_SHOWN_0', 'HP_SHOWN_1'), True)], ['clickOutside']),
        'escape': ([('escaped', 'HP_SHOWN_0', False)], ['K_ESCAPE']),
        'keyboard_close': ([('focused', 'HP_SHOWN_0', True), ('activated', 'HP_SHOWN_0', False)],
                           ['moveOutside', 'K_DOWN', 'K_RETURN']),
    }[case]
    expected = [('baseline', 'HP_BASELINE', False), ('shown', 'HP_SHOWN_0', True)] + extra
    require(row.get('inputs') == inputs, 'wrong input journey')
    observations = row.get('observations', [])
    require(len(observations) == len(expected), 'incomplete observation journey')
    for observation, (step, line, visible) in zip(observations, expected):
        require(observation.get('step') == step and observation.get('line') in (line if isinstance(line, tuple) else (line,))
                and observation.get('panelVisible') is visible and observation.get('gameMenu') is False,
                'wrong engine observation: ' + step)
        require(type(observation.get('focusedClose')) is bool, 'missing focus observation')
    if case == 'keyboard_close':
        require(observations[2]['focusedClose'] is True, 'Close was not keyboard focused immediately before activation')
        require(observations[2].get('defaultClose') is True, 'Close is not the qualified default focus widget')
        require(observations[2].get('mousePoint') == row.get('outsidePoint')
                and observations[3].get('mousePoint') == row.get('outsidePoint'),
                'pointer moved between keyboard focus and activation')
    if case == 'escape':
        require(row.get('defaultGameEscape') is True, 'default Escape key mapping not observed')
    if case in ('outside_click', 'escape', 'keyboard_close'):
        point, rect = row.get('outsidePoint'), row.get('frameRect')
        require(isinstance(point, list) and len(point) == 2 and isinstance(rect, list) and len(rect) == 4
                and all(type(n) is int for n in point + rect), 'missing actual panel/input bounds')
        x, y, width, height = rect
        require(0 <= x < 1280 and 0 <= y < 720 and 0 < width <= 1280 - x and 0 < height <= 720 - y,
                'panel bounds outside game')
        require(0 <= point[0] < 1280 and 0 <= point[1] < 720
                and not (x <= point[0] < x + width and y <= point[1] < y + height), 'input point is inside panel')
    return row


def validate_core_output(text, manifest_sha):
    lines = text.splitlines()
    require(lines.count('test ' + EXPORT_TEST + ' ... ok') == 1, 'required exporter missing/duplicated')
    require(len([line for line in lines if re.fullmatch(
        r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; \d+ filtered out; finished in [0-9.]+s', line)]) == 1,
        'missing focused exporter completion')
    rows = [load_json(line.removeprefix('HELP_PANEL_FIXTURE ')) for line in lines if line.startswith('HELP_PANEL_FIXTURE ')]
    require(rows == [dict(schemaVersion=1, manifestSHA256=manifest_sha, publicCoreRequests=True, engineStarted=False)],
            'missing/duplicate/mismatched public exporter receipt')


def inputs():
    files = set()
    for directory in ('app/src-core', 'tests/fixtures'):
        files.update(path for path in (REPO / directory).rglob('*') if path.is_file())
    files.update(REPO / name for name in (
        'app/Cargo.toml', 'app/Cargo.lock', 'app/rust-toolchain.toml',
        'app/src-tauri/tauri.conf.json', 'app/src-tauri/capabilities/main.json',
        'app/src-tauri/permissions/core-request.toml', 'app/src-tauri/build.rs',
        'app/scripts/qualify-help-panel.py', 'app/scripts/test_qualify_help_panel.py',
        'app/scripts/qualify-screens-source.py', 'spikes/renpy-sdk/sdk_adapter.py', 'spikes/renpy-sdk/archive_safety.py'))
    return {path.relative_to(REPO).as_posix(): digest(path) for path in sorted(files)}


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def fresh_output(path):
    path = path.resolve()
    require(path.is_relative_to(REPO / 'app/target'), 'output must be worktree-local under app/target')
    path.mkdir(parents=True, exist_ok=False)
    return path


def run_logged(output, name, argv, cwd, env, checks, timeout, retain_output=None):
    # Reuse the existing bounded process-tree adapter. No shell or content interpolation.
    sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
    from sdk_adapter import run_bounded
    previous_env, previous_cwd = dict(os.environ), Path.cwd()
    record = dict(name=name, passed=False)
    checks.append(record)
    try:
        os.chdir(cwd)
        os.environ.clear()
        os.environ.update(env)
        try:
            result = run_bounded(tuple(map(str, argv)), timeout_seconds=timeout, output_limit=2_000_000)
        except BaseException as error:
            partial = getattr(error, 'command_output', None)
            if partial is not None:
                (output / (name + '.log')).write_text(partial, encoding='utf-8')
                record.update(exitCode=error.command_exit_code, timedOut=error.command_timed_out,
                              outputLimited=error.command_output_limited, processReaped=error.command_process_reaped,
                              cleanupComplete=error.command_cleanup_complete, durationSeconds=error.command_duration_seconds)
                if retain_output is not None:
                    retain_output(partial)
            raise
        (output / (name + '.log')).write_text(result.output, encoding='utf-8')
        record.update(exitCode=result.exit_code, timedOut=result.timed_out, outputLimited=result.output_limited,
                      processReaped=True, cleanupComplete=True, durationSeconds=result.duration_seconds)
        if retain_output is not None:
            retain_output(result.output)
        require(result.exit_code == 0 and not result.timed_out and not result.output_limited, name + ' failed; see retained log')
        record['passed'] = True
        return result.output
    finally:
        os.environ.clear()
        os.environ.update(previous_env)
        os.chdir(previous_cwd)


def prepare(output):
    output = fresh_output(output)
    result = dict(passed=False, engineStarted=False, scope='public authoring export only', checks=[],
                  candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                  python=platform.python_version(), testBinary=None, testBinaryState='not-compiled')
    try:
        write_json(output / 'inputs.json', inputs())
        temporary = output / 'tmp'
        temporary.mkdir()
        env = dict(os.environ, CARGO_TARGET_DIR=str(REPO / 'app/target'), TMPDIR=str(temporary),
                   TMP=str(temporary), TEMP=str(temporary), PYTHONDONTWRITEBYTECODE='1',
                   LOOMLIGHT_HELP_PANEL_FIXTURE_DIR=str(output / 'accepted'))
        spec = importlib.util.spec_from_file_location('screens_source_gate', REPO / 'app/scripts/qualify-screens-source.py')
        source_gate = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(source_gate)

        def retain_binary(text):
            try:
                result['testBinary'] = source_gate.retain_test_binary(text, output)
                result['testBinaryState'] = 'compiled' if result['testBinary'] is not None else 'not-compiled'
            except Exception as error:
                result['testBinaryState'] = 'unavailable' if isinstance(error, FileNotFoundError) else 'retention-failed'
                result['binaryRetentionFailure'] = dict(type=type(error).__name__, message=str(error))
                raise

        text = run_logged(output, 'core-export', ['cargo', 'test', '-p', 'loomlight-core', '--locked', '--offline',
            '--lib', '--message-format=json', EXPORT_TEST, '--', '--exact', '--nocapture'], REPO / 'app', env, result['checks'], 180,
            retain_output=retain_binary)
        require(result['testBinary'] is not None, 'missing produced test binary')
        manifest = validate_bundle(output / 'accepted')
        result['manifestSHA256'] = digest(output / 'accepted/manifest.json')
        validate_core_output(text, result['manifestSHA256'])
        require(inputs() == load_json((output / 'inputs.json').read_text()), 'inputs changed during export')
        # Cargo/macOS may leave compiler caches such as xcrun_db here. This fresh
        # directory is wholly owned; accepted bytes and the test binary are retained.
        shutil.rmtree(temporary)
        require(not temporary.exists(), 'exporter temporary cleanup incomplete')
        result.update(passed=True, cleanupComplete=True, acceptedFileCount=len(manifest['files']))
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        write_json(output / 'result.json', result)


def validate_prepared(prepared):
    result = load_json(portable_file(prepared, 'result.json').read_text())
    require(result['passed'] is True and result['engineStarted'] is False and result['cleanupComplete'] is True,
            'export preparation did not complete')
    require(load_json(portable_file(prepared, 'inputs.json').read_text()) == inputs(), 'prepared inputs changed')
    manifest = validate_bundle(prepared / 'accepted')
    require(digest(prepared / 'accepted/manifest.json') == result['manifestSHA256'], 'manifest changed after export')
    validate_core_output(portable_file(prepared, 'core-export.log').read_text(), result['manifestSHA256'])
    binary = result['testBinary']
    retained = portable_file(prepared, binary['path'])
    require(digest(retained) == binary['sha256'] and retained.stat().st_size == binary['bytes'], 'retained test binary changed')
    return manifest


def stage_game(accepted, manifest, game):
    game.mkdir(parents=True, exist_ok=False)
    for record in manifest['files']:
        destination = game / record['path']
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(portable_file(accepted, record['path']), destination)
    shutil.copyfile(accepted / 'manifest.json', game / 'accepted-runtime.json')
    for source, destination in [('driver.rpy', 'zz_help_panel_driver.rpy'), ('tests.rpy', 'zz_help_panel_tests.rpy')]:
        target = game / 'game' / destination
        require(not target.exists(), 'fixture driver collides with accepted source')
        shutil.copyfile(FIXTURE / source, target)


def validate_case_set(rows):
    require(len(rows) == len(CASES) and {row['case'] for row in rows} == set(CASES), 'six distinct complete cases required')


def qualify_sdk(args):
    require(args.allow_fixture_execution is True, 'explicit fixture execution authorization required')
    prepared = args.prepared.resolve()
    manifest = validate_prepared(prepared)
    output = fresh_output(args.output)
    result = dict(passed=False, checks=[], runtimeObserved=[], sdkVersion='8.5.3', sdkSHA256=SDK_SHA256,
                  sdkTestProcessesStarted=0, nativeEditorLaunches=0, physicalInputProven=False,
                  scope='pinned engine automation on exact public-core accepted source',
                  os=platform.system(), architecture=platform.machine(),
                  manifestSHA256=digest(prepared / 'accepted/manifest.json'))
    temporary = None
    try:
        sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, install_verified_tar
        from sdk_adapter import Command, command_argv, parse_version
        require(expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA256, 'official archive checksum pin mismatch')
        shutil.copyfile(prepared / 'inputs.json', output / 'inputs.json')
        shutil.copyfile(prepared / 'accepted/manifest.json', output / 'accepted-manifest.json')
        with tempfile.TemporaryDirectory(prefix='help-panel-', dir=output) as temporary_name:
            temporary = Path(temporary_name)
            archive_root = temporary / 'sdk'
            install_verified_tar(args.archive.resolve(), SDK_SHA256, archive_root)
            sdk = archive_root / 'renpy-8.5.3-sdk'
            game = temporary / 'game-project'
            stage_game(prepared / 'accepted', manifest, game)
            env = dict(os.environ, RENPY_PATH_TO_SAVES=str(temporary / 'saves'), SDL_AUDIODRIVER='dummy',
                       PYTHONDONTWRITEBYTECODE='1', TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary))
            version = run_logged(output, 'sdk-version', command_argv(sdk, Command.VERSION), sdk, env, result['checks'], 30)
            parse_version(version)
            run_logged(output, 'sdk-compile', command_argv(sdk, Command.COMPILE, game, allow_project_execution=True), sdk, env, result['checks'], 90)
            run_logged(output, 'sdk-lint', command_argv(sdk, Command.LINT, game, allow_project_execution=True), sdk, env, result['checks'], 90)
            hashes = {record['path']: record['sha256'] for record in manifest['files']}
            for case in CASES:
                result['sdkTestProcessesStarted'] += 1
                text = run_logged(output, case, command_argv(sdk, Command.TEST, game,
                                  testcase='help_panel::' + case, allow_project_execution=True),
                                  sdk, env, result['checks'], 45)
                result['runtimeObserved'].append(validate_runtime_output(text, case, result['manifestSHA256'], hashes))
                require(all(digest(game / path) == sha for path, sha in hashes.items()), 'accepted source changed during engine test')
            validate_case_set(result['runtimeObserved'])
            require(inputs() == load_json((prepared / 'inputs.json').read_text()), 'inputs changed during qualification')
            result['acceptedSourceUnchanged'] = True
        result['cleanupComplete'] = not temporary.exists()
        require(result['cleanupComplete'], 'owned SDK/game cleanup incomplete')
        result['passed'] = True
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        result['scratchCleanupComplete'] = temporary is None or not temporary.exists()
        result['processCleanupComplete'] = all(check.get('processReaped') is True
            and check.get('cleanupComplete') is True for check in result['checks'])
        result['cleanupComplete'] = result['scratchCleanupComplete'] and result['processCleanupComplete']
        write_json(output / 'result.json', result)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    preparation = commands.add_parser('prepare', help='public-core export only; no SDK execution')
    preparation.add_argument('--output', type=Path, required=True)
    validation = commands.add_parser('validate', help='read-only frozen preparation admission')
    validation.add_argument('--prepared', type=Path, required=True)
    sdk = commands.add_parser('sdk', help='separately authorized pinned SDK automation; no native editor proof')
    sdk.add_argument('--prepared', type=Path, required=True)
    sdk.add_argument('--output', type=Path, required=True)
    sdk.add_argument('--archive', type=Path, required=True)
    sdk.add_argument('--checksums', type=Path, required=True)
    sdk.add_argument('--allow-fixture-execution', action='store_true', required=True)
    return parser.parse_args(argv)


def main(argv=None):
    require(sys.version_info >= (3, 11), 'Python 3.11 or later is required')
    args = parse_args(argv)
    if args.command == 'prepare':
        prepare(args.output)
        print('Public-core export passed; engine unstarted.')
    elif args.command == 'validate':
        validate_prepared(args.prepared.resolve())
        print('Frozen public-core preparation valid; no SDK executed.')
    else:
        qualify_sdk(args)


if __name__ == '__main__':
    main()
