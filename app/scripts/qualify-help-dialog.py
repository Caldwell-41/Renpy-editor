"""#45 public-core export and normal-entry qualification; prepare/validate never start Ren'Py.

The #44 qualifier remains frozen. Only its general file/process utilities are reused.
SDK execution requires a separately audited frozen producer and explicit authorization.
"""
import argparse
import hashlib
import importlib.util
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
FIXTURE = REPO / 'tests/fixtures/phase-3b-screens/help-dialog'
EXPORT_TEST = 'scene::logic::dialog_tests::dialog_fixture::help_dialog_exports_public_core_normal_entry_without_engine_execution'
CASES = ('close', 'keyboard_close', 'escape', 'outside_blocks')
RESOLUTIONS = ([1280, 720], [1024, 768])
_spec = importlib.util.spec_from_file_location('frozen_help_file_utilities', Path(__file__).with_name('qualify-help-panel.py'))
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)
require, load_json, digest = base.require, base.load_json, base.digest
portable_file, write_json, run_logged = base.portable_file, base.write_json, base.run_logged


def validate_runtime_output(text, case, manifest_sha, accepted_hashes, resolution):
    require(case in CASES and resolution in RESOLUTIONS, 'unknown case/resolution')
    lines = [line.rstrip() for line in text.splitlines()]
    require(lines.count('[rpytest] Status: PASSED') == 1, 'missing/duplicate runtime completion')
    require(any(re.search(r'\bglobal\.help_dialog::' + re.escape(case) + r'\b', line) for line in lines), 'missing named case')
    summary = [line for line in lines if line.startswith('[rpytest] Test cases :')]
    require(len(summary) == 1 and list(map(int, re.findall(r'\d+', summary[0]))) == [4, 1, 0, 0, 0, 3, 0], 'incomplete engine case summary')
    duration = re.findall(r'\[rpytest\] Time: ([0-9.]+) s', text)
    require(len(duration) == 1 and float(duration[0]) > 0, 'missing runtime duration')
    rows = [load_json(line.removeprefix('HELP_DIALOG_OBSERVED ')) for line in lines if line.startswith('HELP_DIALOG_OBSERVED ')]
    require(len(rows) == 1, 'missing/duplicate observed evidence')
    row = rows[0]
    require(row.get('schemaVersion') == 1 and row.get('sdkVersion') == '8.5.3' and row.get('case') == case,
            'wrong evidence version/case')
    require(row.get('normalEntry') is True and row.get('startedFromMenu') is True, 'scratch preview is insufficient')
    require(row.get('manifestSHA256') == manifest_sha and row.get('acceptedHashes') == accepted_hashes
            and row.get('resolution') == resolution, 'wrong accepted candidate/resolution')
    require(type(row.get('underlyingBaselineCount')) is int and row['underlyingBaselineCount'] == 1, 'underlying control was not verified before Call')
    inputs = {'close': ['clickClose'], 'escape': ['K_ESCAPE'],
              'keyboard_close': ['moveOutside', 'K_DOWN', 'K_RETURN'],
              'outside_blocks': ['clickUnderlying', 'clickOutside', 'K_SPACE', 'clickClose']}[case]
    require(row.get('inputs') == inputs, 'wrong input journey')
    steps = ['waiting'] + (['blocked'] if case == 'outside_blocks' else []) + (['focused'] if case == 'keyboard_close' else []) + ['finished', 'settled']
    observations = row.get('observations', [])
    require(len(observations) == len(steps), 'incomplete observations')
    for observation, step in zip(observations, steps):
        waiting = step in ('waiting', 'blocked', 'focused')
        require(observation.get('step') == step and observation.get('dialogVisible') is waiting
                and observation.get('gameMenu') is False and observation.get('modal') is waiting, 'wrong dialog state/modality: ' + step)
        for field, expected in [('followingCount', 0 if waiting else 1), ('doneCount', 0), ('underlyingCount', 0)]:
            require(type(observation.get(field)) is int and observation[field] == expected, 'wrong execution count: ' + field)
        require(type(observation.get('focusedClose')) is bool and type(observation.get('defaultClose')) is bool,
                'missing focus observation')
        if waiting: require(observation['defaultClose'] is True, 'Close is not the default widget')
        if step == 'focused':
            require(observation['focusedClose'] and observation['defaultClose'], 'Close is not default keyboard focus')
    if case == 'escape': require(row.get('defaultGameEscape') is True, 'default Escape mapping missing')
    if case in ('escape', 'keyboard_close', 'outside_blocks'):
        point, rect = row.get('outsidePoint'), row.get('frameRect')
        require(isinstance(point, list) and len(point) == 2 and isinstance(rect, list) and len(rect) == 4
                and all(type(n) is int for n in point + rect), 'missing actual input/frame geometry')
        x, y, width, height = rect
        require(0 <= x < resolution[0] and 0 <= y < resolution[1] and 0 < width <= resolution[0] - x
                and 0 < height <= resolution[1] - y, 'invalid frame geometry')
        require(0 <= point[0] < resolution[0] and 0 <= point[1] < resolution[1]
                and not (x <= point[0] < x + width and y <= point[1] < y + height), 'outside point is inside dialog')
    if case == 'keyboard_close':
        for observation in observations:
            if observation['step'] in ('focused','finished','settled'):
                require(observation.get('mousePoint') == row['outsidePoint'], 'pointer moved between focus and keyboard activation')
    return row


def validate_process_checks(checks, expected):
    require(len(checks) == len(expected) and [c.get('name') for c in checks] == expected, 'missing/duplicate/wrong process results')
    for check in checks:
        require(check.get('passed') is True and type(check.get('exitCode')) is int and check['exitCode'] == 0
                and check.get('timedOut') is False and check.get('outputLimited') is False
                and check.get('processReaped') is True and check.get('cleanupComplete') is True,
                'incomplete process/cleanup evidence')


def validate_case_set(rows):
    require(len(rows) == 8 and {(r['case'], tuple(r['resolution'])) for r in rows}
            == {(case, tuple(resolution)) for case in CASES for resolution in RESOLUTIONS}, 'eight distinct case/resolution results required')


def validate_bundle(root):
    manifest = load_json(portable_file(root, 'manifest.json').read_text(encoding='utf-8'))
    require(manifest['schemaVersion'] == 1 and manifest['sdkVersion'] == '8.5.3'
            and manifest['publicCoreRequests'] is True and manifest['engineStarted'] is False, 'wrong producer provenance')
    files = manifest['files']; require(1 <= len(files) <= 32, 'unbounded file count')
    hashes = {}
    def verify(record):
        path = portable_file(root, record['path'])
        require(type(record['bytes']) is int and 0 <= record['bytes'] <= 2_000_000 and path.stat().st_size == record['bytes'], 'wrong file size')
        require(re.fullmatch('[a-f0-9]{64}', record['sha256']) and digest(path) == record['sha256'], 'file hash mismatch')
        return path
    for record in files:
        relative = record['path']
        require(relative.startswith('game/') and relative not in hashes
                and (relative.endswith('.rpy') or relative == manifest['asset']['relativePath']), 'unexpected/duplicate runnable input')
        verify(record); hashes[relative] = record['sha256']
    actual = set()
    for path in (root / 'game').rglob('*'):
        require(not path.is_symlink() and '.renpy-editor' not in path.parts, 'linked/metadata runnable path')
        if path.is_file(): actual.add(path.relative_to(root).as_posix())
    require(actual == set(hashes), 'undeclared/missing runnable files')
    metadata = {}
    for key, name in [('project', 'project.json'), ('sourceMap', 'source-map.json'), ('authoring', 'authoring.json')]:
        record = manifest['metadata'][key]; require(record['path'] == name, 'wrong sidecar path')
        metadata[key] = load_json(verify(record).read_text(encoding='utf-8'))
    project, mapping, authoring = (metadata[key] for key in ('project', 'sourceMap', 'authoring'))
    require(mapping['schemaVersion'] == 8 and project['projectId'] == mapping['projectId'] == authoring['projectId'], 'wrong metadata identity')
    entry, dialog, asset = (manifest[key] for key in ('entry', 'dialog', 'asset'))
    require(project['sdk'] == {'adapter':'renpy-8.5.3','version':'8.5.3'} and project['entrySceneId'] == entry['id'], 'wrong normal entry')
    require(any(s['id'] == entry['id'] and s['sourcePath'] == entry['sourcePath'] and s['technicalLabel'] == entry['technicalLabel'] for s in project['scenes']), 'missing Scene owner')
    bootstrap = portable_file(root, 'game/script.rpy').read_text(encoding='utf-8-sig').splitlines()
    require(bootstrap[-2:] == ['label start:', '    jump ' + entry['technicalLabel']], 'wrong start bootstrap')
    owner = {key:dialog[key] for key in ('id','rootId','name','path','kind')}
    require(dialog['kind'] == 'dialog' and mapping['ownedScreens'] == [owner], 'wrong Dialog owner')
    resolved = dialog['resolved']; binding = {'screenId':dialog['id'],'sourceName':dialog['name']}
    require(resolved['binding'] == binding and resolved['kind'] == 'dialog' and resolved['blocking'] is True
            and resolved['path'] == dialog['path'] and resolved['rootId'] == dialog['rootId'], 'wrong resolved Dialog')
    revisions = resolved['revisions']; effects = resolved['effects']
    require(set(revisions) == {'source','sourceMap','inventory','effects'} and all(re.fullmatch('[a-f0-9]{64}', v) for v in revisions.values()), 'invalid revisions')
    require(revisions['source'] == hashes[dialog['path']] and revisions['sourceMap'] == manifest['metadata']['sourceMap']['sha256']
            and revisions['effects'] == effects['revision'] and effects['unknown'] is False
            and effects['hiddenScreens'] == [] and effects['finishesInteraction'] is True, 'wrong effects/revisions')
    beats = entry['beats']; require([b['payload']['type'] for b in beats] == ['narration','callScreen','narration','narration','return'], 'wrong authored sequence')
    require([beats[i]['payload']['text'] for i in (0,2,3)] == ['HD_BEFORE','HD_AFTER','HD_DONE'], 'wrong continuation markers')
    source = portable_file(root, entry['sourcePath']).read_bytes()
    require(entry['sourceRevision'] == hashes[entry['sourcePath']], 'wrong Story revision')
    maps = [s for s in mapping['sceneMappings'] if s['sceneId'] == entry['id']]
    require(len(maps) == 1 and maps[0]['sourceRevision'] == entry['sourceRevision'] and len(maps[0]['beats']) == len(beats), 'wrong Scene mapping')
    require(len({b['id'] for b in beats}) == len(beats), 'duplicate Beat identity')
    for beat, mapped in zip(beats, maps[0]['beats']):
        require(beat['id'] == mapped['id'] and beat['payload']['type'] == mapped['kind'] and beat['protected'] is False
                and beat['byteStart'] == mapped['byteStart'] and beat['byteEnd'] == mapped['byteEnd']
                and 0 <= beat['byteStart'] < beat['byteEnd'] <= len(source), 'wrong Beat range/identity')
        require(hashlib.sha256(source[beat['byteStart']:beat['byteEnd']]).hexdigest() == mapped['sourceSha256'], 'wrong Beat hash')
        if mapped['kind'] == 'callScreen':
            require(mapped.get('screenTarget') == binding and beat['payload']['target'] == binding
                    and beat['payload']['revisions'] == revisions and beat['screenEffects'] == effects
                    and 'returnLabel' not in beat['payload'] and 'revisions' not in mapped, 'lost Call binding')
    require(asset in authoring['assets'] and asset['kind'] == 'uiImage' and asset['status'] == 'available'
            and asset['sha256'] == hashes[asset['relativePath']], 'wrong image identity')
    return manifest


def inputs():
    result = base.inputs()
    for name in ('app/scripts/qualify-help-dialog.py', 'app/scripts/test_qualify_help_dialog.py'):
        result[name] = digest(REPO / name)
    return result


def inputs_fingerprint(material):
    return hashlib.sha256(json.dumps(material, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()


def require_candidate(expected_candidate, material):
    require(re.fullmatch('[a-f0-9]{40}', expected_candidate) is not None, 'expected full candidate SHA required')
    actual = subprocess.check_output(['git','rev-parse','HEAD'], cwd=REPO, text=True, encoding='utf-8').strip()
    require(actual == expected_candidate, 'wrong checkout candidate')
    tracked = set(subprocess.check_output(['git','ls-files','-z'], cwd=REPO).decode('utf-8').split('\0'))
    require(set(material) <= tracked, 'producer inputs include uncommitted files')
    difference = subprocess.run(['git','diff','--quiet',expected_candidate,'--', *sorted(material)], cwd=REPO, check=False)
    require(difference.returncode == 0, 'producer inputs differ from expected commit')


def validate_binary_binding(record, expected_candidate, inputs_sha):
    require(record.get('candidate') == expected_candidate and record.get('producingInputsSHA256') == inputs_sha,
            'retained binary does not bind expected candidate/producing inputs')
    require(isinstance(record.get('sha256'), str) and re.fullmatch('[a-f0-9]{64}', record['sha256'])
            and type(record.get('bytes')) is int and record['bytes'] > 0, 'missing binary identity')


def validate_core_output(text, manifest_sha):
    require(text.splitlines().count('test ' + EXPORT_TEST + ' ... ok') == 1, 'missing/duplicate exporter')
    require(len(re.findall(r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; \d+ filtered out; finished in [0-9.]+s', text)) == 1, 'wrong exporter completion')
    rows = [load_json(line.removeprefix('HELP_DIALOG_FIXTURE ')) for line in text.splitlines() if line.startswith('HELP_DIALOG_FIXTURE ')]
    require(rows == [dict(schemaVersion=1, manifestSHA256=manifest_sha, publicCoreRequests=True, engineStarted=False)], 'wrong exporter receipt')


def finish_cleanup(result, temporary):
    result['processCleanupComplete'] = all(c.get('processReaped') is True and c.get('cleanupComplete') is True for c in result['checks'])
    try:
        if temporary is not None and temporary.exists() and result['processCleanupComplete']:
            shutil.rmtree(temporary)
    except Exception as error:
        result['cleanupFailure'] = dict(type=type(error).__name__, message=str(error))
    result['scratchCleanupComplete'] = temporary is None or not temporary.exists()
    result['cleanupComplete'] = result['scratchCleanupComplete'] and result['processCleanupComplete']
    if not result['cleanupComplete']: result['passed'] = False


def prepare(output, expected_candidate):
    output = base.fresh_output(output)
    result = dict(passed=False, engineStarted=False, sdkProcessesStarted=0, checks=[], candidate=expected_candidate)
    temporary = None
    try:
        material = inputs(); require_candidate(expected_candidate, material)
        result['inputsSHA256'] = inputs_fingerprint(material)
        write_json(output / 'inputs.json', material)
        temporary = output / 'tmp'; temporary.mkdir()
        build = Path(os.environ.get('CARGO_TARGET_DIR', REPO / 'app/target')).resolve()
        require(build.is_relative_to(REPO), 'build output must stay in this worktree')
        env = dict(os.environ, CARGO_TARGET_DIR=str(build), TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary), PYTHONDONTWRITEBYTECODE='1', LOOMLIGHT_HELP_DIALOG_FIXTURE_DIR=str(output / 'accepted'))
        spec = importlib.util.spec_from_file_location('source_binary_retention', REPO / 'app/scripts/qualify-screens-source.py')
        source_gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(source_gate)
        def retain(text):
            binary = source_gate.retain_test_binary(text, output)
            if binary is not None: binary.update(candidate=expected_candidate, producingInputsSHA256=result['inputsSHA256'])
            result['testBinary'] = binary
        text = run_logged(output, 'core-export', ['cargo','test','-p','loomlight-core','--locked','--offline','--lib','--message-format=json',EXPORT_TEST,'--','--exact','--nocapture'], REPO / 'app', env, result['checks'], 180, retain_output=retain)
        require(result.get('testBinary') is not None, 'missing retained producer binary')
        manifest = validate_bundle(output / 'accepted'); result['manifestSHA256'] = digest(output / 'accepted/manifest.json')
        validate_core_output(text, result['manifestSHA256']); require(inputs() == load_json((output / 'inputs.json').read_text(encoding='utf-8')), 'producer inputs changed')
        validate_process_checks(result['checks'], ['core-export'])
        require_candidate(expected_candidate, inputs())
        result.update(passed=True, acceptedFileCount=len(manifest['files']))
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        finish_cleanup(result, temporary)
        write_json(output / 'result.json', result)
        require(result['cleanupComplete'], 'producer cleanup incomplete; retained receipt and scratch require audit')


def validate_prepared(prepared, expected_candidate):
    result = load_json(portable_file(prepared, 'result.json').read_text(encoding='utf-8'))
    material = inputs(); require_candidate(expected_candidate, material)
    fingerprint = inputs_fingerprint(material)
    require(result.get('candidate') == expected_candidate and result.get('inputsSHA256') == fingerprint, 'wrong producing candidate/fingerprint')
    require(result.get('sdkProcessesStarted') == 0, 'offline preparation started SDK')
    require(result['passed'] is True and result['engineStarted'] is False and result['cleanupComplete'] is True, 'incomplete producer')
    require(load_json(portable_file(prepared, 'inputs.json').read_text(encoding='utf-8')) == inputs(), 'changed producer inputs')
    validate_process_checks(result.get('checks', []), ['core-export'])
    manifest = validate_bundle(prepared / 'accepted')
    require(digest(prepared / 'accepted/manifest.json') == result['manifestSHA256'], 'changed manifest')
    validate_core_output(portable_file(prepared, 'core-export.log').read_text(encoding='utf-8'), result['manifestSHA256'])
    binary = result['testBinary']; validate_binary_binding(binary, expected_candidate, fingerprint)
    retained = portable_file(prepared, binary['path'])
    require(digest(retained) == binary['sha256'] and retained.stat().st_size == binary['bytes'], 'changed retained producer binary')
    return manifest


def stage_game(accepted, manifest, game):
    game.mkdir(parents=True, exist_ok=False)
    for record in manifest['files']:
        target = game / record['path']; target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(portable_file(accepted, record['path']), target)
    shutil.copyfile(accepted / 'manifest.json', game / 'accepted-runtime.json')
    for source, name in [('driver.rpy','zz_help_dialog_driver.rpy'),('tests.rpy','zz_help_dialog_tests.rpy')]:
        target = game / 'game' / name; require(not target.exists(), 'fixture collision'); shutil.copyfile(FIXTURE / source, target)


def qualify_sdk(args):
    require(args.allow_fixture_execution is True, 'explicit execution authorization required')
    prepared = args.prepared.resolve(); manifest = validate_prepared(prepared, args.expected_candidate)
    output = base.fresh_output(args.output)
    result = dict(passed=False, checks=[], runtimeObserved=[], sdkVersion='8.5.3', sdkSHA256=base.SDK_SHA256,
                  sdkProcessesStarted=0, nativeEditorLaunches=0, physicalInputProven=False,
                  candidate=args.expected_candidate, producingBinary=load_json((prepared / 'result.json').read_text(encoding='utf-8'))['testBinary'],
                  os=platform.system(), architecture=platform.machine(), manifestSHA256=digest(prepared / 'accepted/manifest.json'))
    temporary = None
    try:
        sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, install_verified_tar
        from sdk_adapter import Command, command_argv, parse_version
        require(expected_sha256(args.checksums.read_text(encoding='utf-8'), args.archive.name) == base.SDK_SHA256, 'checksum pin mismatch')
        shutil.copyfile(prepared / 'inputs.json', output / 'inputs.json'); shutil.copyfile(prepared / 'accepted/manifest.json', output / 'accepted-manifest.json')
        temporary = Path(tempfile.mkdtemp(prefix='help-dialog-', dir=output))
        install_verified_tar(args.archive.resolve(), base.SDK_SHA256, temporary / 'sdk')
        sdk = temporary / 'sdk/renpy-8.5.3-sdk'; game = temporary / 'game-project'; stage_game(prepared / 'accepted', manifest, game)
        env = dict(os.environ, RENPY_PATH_TO_SAVES=str(temporary / 'saves'), SDL_AUDIODRIVER='dummy', PYTHONDONTWRITEBYTECODE='1', TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary))
        def run(name, command, timeout):
            result['sdkProcessesStarted'] += 1
            return run_logged(output, name, command, sdk, env, result['checks'], timeout)
        parse_version(run('sdk-version', command_argv(sdk, Command.VERSION), 30))
        run('sdk-compile', command_argv(sdk, Command.COMPILE, game, allow_project_execution=True), 90)
        run('sdk-lint', command_argv(sdk, Command.LINT, game, allow_project_execution=True), 90)
        hashes = {r['path']:r['sha256'] for r in manifest['files']}
        for resolution in RESOLUTIONS:
            env.update(LOOMLIGHT_DIALOG_WIDTH=str(resolution[0]), LOOMLIGHT_DIALOG_HEIGHT=str(resolution[1]))
            for case in CASES:
                name = f'{resolution[0]}x{resolution[1]}-{case}'
                text = run(name, command_argv(sdk, Command.TEST, game, testcase='help_dialog::' + case, allow_project_execution=True), 45)
                result['runtimeObserved'].append(validate_runtime_output(text, case, result['manifestSHA256'], hashes, resolution))
                require(all(digest(game / path) == sha for path, sha in hashes.items()), 'accepted source changed')
        validate_case_set(result['runtimeObserved']); require(inputs() == load_json((prepared / 'inputs.json').read_text(encoding='utf-8')), 'inputs changed')
        result['acceptedSourceUnchanged'] = True
        validate_process_checks(result['checks'], ['sdk-version','sdk-compile','sdk-lint'] + [f'{r[0]}x{r[1]}-{c}' for r in RESOLUTIONS for c in CASES])
        require(result['sdkProcessesStarted'] == 11 and result['acceptedSourceUnchanged'] is True, 'wrong launcher count/source preservation')
        result['passed'] = True
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        finish_cleanup(result, temporary)
        write_json(output / 'result.json', result)
        require(result['cleanupComplete'], 'SDK cleanup incomplete; retained receipt and scratch require audit')


def main(argv=None):
    require(sys.version_info >= (3,11), 'Python3.11 or later required')
    parser = argparse.ArgumentParser(description=__doc__); commands = parser.add_subparsers(dest='command', required=True)
    prep = commands.add_parser('prepare'); prep.add_argument('--output', type=Path, required=True)
    validation = commands.add_parser('validate'); validation.add_argument('--prepared', type=Path, required=True)
    sdk = commands.add_parser('sdk')
    for name in ('prepared','output','archive','checksums'): sdk.add_argument('--' + name, type=Path, required=True)
    sdk.add_argument('--allow-fixture-execution', action='store_true', required=True)
    for command in (prep, validation, sdk): command.add_argument('--expected-candidate', required=True)
    args = parser.parse_args(argv)
    if args.command == 'prepare': prepare(args.output, args.expected_candidate)
    elif args.command == 'validate': validate_prepared(args.prepared.resolve(), args.expected_candidate)
    else: qualify_sdk(args)


if __name__ == '__main__': main()
