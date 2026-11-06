"""Admission checks for the #51/#52 public-core accepted-source export.

Importing this module and checking receipts never starts an SDK or canvas helper.
"""
import importlib.util
import hashlib
import argparse
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


EXPORT_TEST = 'screens::tests::controls::export_screen_controls_public_core_fixture'
STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
RESOLUTIONS = ((1280, 720), (1024, 768))
CASES = ('normal', 'preview')
REPO = Path(__file__).resolve().parents[2]
FIXTURE = REPO / 'tests/fixtures/phase-3b-screens/screen-controls'

_spec = importlib.util.spec_from_file_location(
    'screen_controls_shared_qualification', Path(__file__).with_name('qualify-ordered-actions.py'))
shared = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(shared)
process, files = shared.process, shared.base
require, load_json, digest = files.require, files.load_json, files.digest
portable_file = files.portable_file
write_json = files.write_json


def validate_core_output(text, manifest_sha):
    """Require the selected test and one source-bound, engine-free receipt."""
    require(isinstance(manifest_sha, str) and re.fullmatch('[a-f0-9]{64}', manifest_sha),
            'invalid manifest hash')
    lines = text.splitlines()
    require(lines.count('test ' + EXPORT_TEST + ' ... ok') == 1,
            'required controls exporter missing/duplicated')
    summaries = [line for line in lines if line.startswith('test result:')]
    require(len(summaries) == 1 and re.fullmatch(
        r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; '
        r'\d+ filtered out; finished in [0-9.]+s', summaries[0]),
        'controls exporter did not run exactly once successfully')
    rows = [load_json(line.removeprefix('SCREEN_CONTROLS_FIXTURE '))
            for line in lines if line.startswith('SCREEN_CONTROLS_FIXTURE ')]
    require(rows == [dict(schemaVersion=1, manifestSHA256=manifest_sha,
                          publicCoreRequests=True, engineStarted=False)],
            'wrong/incomplete controls exporter receipt')
    row = rows[0]
    require(type(row['schemaVersion']) is int and row['publicCoreRequests'] is True
            and row['engineStarted'] is False, 'wrong controls exporter receipt types')


def validate_files(root, records):
    """Bind every accepted game input; metadata sidecars stay outside game/."""
    require(type(records) is list and 1 <= len(records) <= 32,
            'missing/unbounded accepted controls files')
    hashes = {}
    for record in records:
        require(type(record) is dict and set(record) == {'path', 'sha256', 'bytes'},
                'invalid accepted file receipt')
        relative = record['path']
        require(isinstance(relative, str) and relative.startswith('game/')
                and relative.endswith(('.rpy', '.png')) and relative not in hashes
                and '.renpy-editor' not in Path(relative).parts,
                'unexpected/duplicate accepted game input')
        path = portable_file(root, relative)
        require(type(record['bytes']) is int and 0 <= record['bytes'] <= 2_000_000
                and path.stat().st_size == record['bytes'], 'wrong accepted file size')
        require(isinstance(record['sha256'], str)
                and re.fullmatch('[a-f0-9]{64}', record['sha256'])
                and digest(path) == record['sha256'], 'changed accepted game input')
        hashes[relative] = record['sha256']
    actual = set()
    for path in (root / 'game').rglob('*'):
        require(not path.is_symlink(), 'linked accepted game input')
        if path.is_file():
            actual.add(path.relative_to(root).as_posix())
    require(actual == set(hashes), 'missing/undeclared accepted game input')
    return hashes


def validate_canvas_matrix(entries, document, screen_name):
    """Admit source-derived plans, without claiming that a helper rendered them."""
    expected = {(width, height, state) for width, height in RESOLUTIONS for state in STATES}
    require(type(entries) is list and len(entries) == len(expected),
            'incomplete/duplicate controls canvas matrix')
    screens = [screen for screen in document['screens'] if screen['name'] == screen_name]
    require(len(screens) == 1, 'missing/ambiguous controls screen')
    controls = {(node['span']['start'], node['kind']) for node in screens[0]['nodes']
                if node['kind'] in ('bar', 'imagebutton')}
    require({kind for _, kind in controls} == {'bar', 'imagebutton'},
            'accepted document lacks required controls')
    seen = set()
    for entry in entries:
        request, plan = entry['request'], entry['plan']
        key = (request['width'], request['height'], request.get('buttonState', 'normal'))
        require(key in expected and key not in seen, 'wrong/duplicate canvas aspect/state')
        seen.add(key)
        require(request['path'] == document['path'] and request['screenName'] == screen_name
                and request['expectedRevision'] == document['revision'],
                'canvas request uses a different accepted document')
        require(plan.get('available') is True and plan.get('limits') == []
                and plan.get('revision') == document['revision']
                and (plan.get('width'), plan.get('height'), plan.get('buttonState')) == key,
                'partial/stale/wrong-state controls canvas plan')
        nodes = plan.get('nodes')
        require(type(nodes) is list and 1 <= len(nodes) <= 4096,
                'missing/unbounded canvas nodes')
        planned = [(node.get('start'), node.get('kind')) for node in nodes]
        require(all(planned.count(control) == 1 for control in controls),
                'missing/duplicate accepted control in canvas plan')
    require(seen == expected, 'incomplete controls canvas matrix')


def validate_bundle(root):
    """Admit the bounded public-core fixture before deliberate engine execution."""
    manifest = load_json(portable_file(root, 'manifest.json').read_text(encoding='utf-8'))
    return validate_manifest(root, manifest)


def validate_manifest(root, manifest):
    require(type(manifest.get('schemaVersion')) is int and manifest['schemaVersion'] == 1
            and manifest.get('sdkVersion') == '8.5.3'
            and manifest.get('publicCoreRequests') is True and manifest.get('engineStarted') is False
            and manifest.get('normalStoryCallAdmitted') is True
            and manifest.get('normalStoryShowAdmitted') is True, 'wrong controls export provenance')
    hashes = validate_files(root, manifest['files'])
    sidecars = {}
    for key, name in [('project', 'project.json'), ('sourceMap', 'source-map.json'),
                      ('authoring', 'authoring.json')]:
        sidecars[key] = load_json(portable_file(root, name).read_text(encoding='utf-8'))
    require(sidecars == manifest['sidecars'], 'changed controls metadata sidecar')
    project, mapping, authoring = (sidecars[key] for key in ('project', 'sourceMap', 'authoring'))
    require(mapping['schemaVersion'] == 8
            and project['projectId'] == mapping['projectId'] == authoring['projectId']
            and project['sdk'] == {'adapter': 'renpy-8.5.3', 'version': '8.5.3'},
            'wrong controls metadata identity/SDK')
    owner, panel = manifest['owner'], manifest['panel']
    require(owner == manifest['dialog'] and owner['kind'] == 'dialog' and panel['kind'] == 'panel',
            'wrong control interaction contexts')
    for screen in (owner, panel):
        identity = {key: screen[key] for key in ('id', 'rootId', 'path', 'name', 'kind')}
        require(identity in mapping['ownedScreens'], 'missing owned controls screen')
        source = portable_file(root, screen['path']).read_text(encoding='utf-8')
        require('# loomlight-screen: ' + screen['id'] in source, 'lost control screen marker')
    document = manifest['document']
    require(document['path'] == owner['path'] and document['revision'] == hashes[owner['path']],
            'controls document is not the accepted source')
    screens = [screen for screen in document['screens'] if screen['name'] == owner['name']]
    require(len(screens) == 1, 'missing/ambiguous controls owner')
    nodes = screens[0]['nodes']
    def node(identifier, kind):
        matches = [value for value in nodes if value['id'] == identifier and value['kind'] == kind]
        require(len(matches) == 1, 'missing/duplicate accepted ' + kind)
        return matches[0]
    bar, image = node(manifest['barId'], 'bar'), node(manifest['imageButtonId'], 'imagebutton')
    variable = manifest['variable']
    require(variable in authoring['variables'] and variable['variableType'] == 'int'
            and variable['technicalName'] == 'control_score' and variable['defaultValue'] == '0'
            and variable['source']['sourceRevision'] == hashes[variable['source']['path']],
            'wrong control variable/default/source binding')
    require(manifest['expected'] == dict(minimum='-5', maximum='15', initial='0', afterAction='7')
            and bar['barBinding'] == dict(variableId=variable['id'], minimum='-5', maximum='15'),
            'wrong qualified bar limits')
    target = dict(screenId=owner['id'], sourceName=owner['name'])
    panel_target = dict(screenId=panel['id'], sourceName=panel['name'])
    actions = [dict(type='setVariable', variableId=variable['id'], value='7'),
               dict(type='hideScreen', target=panel_target), dict(type='finishInteraction')]
    require(manifest['actions'] == actions and image['actions'] == actions,
            'wrong accepted image-button actions/order')
    appearances = image['imageButtonAppearances']
    require(type(appearances) is dict and set(appearances) == set(STATES),
            'incomplete qualified control appearances')
    assets = {}
    for asset in authoring['assets']:
        require(asset['id'] not in assets, 'duplicate control asset identity')
        assets[asset['id']] = asset
    selected_assets = []
    for state in STATES:
        reference = appearances[state]
        require(type(reference) is dict and reference.get('replacementSha256') is None,
                'missing/unaccepted control appearance')
        asset = assets.get(reference['assetId'])
        require(asset is not None and asset['kind'] == 'uiImage'
                and asset['sha256'] == reference['expectedAssetSha256']
                and hashes.get(asset['relativePath']) == asset['sha256'],
                'wrong control image role/reference/content')
        selected_assets.append(asset)
    require(len({asset['sha256'] for asset in selected_assets}) == 6
            and {asset['relativePath'] for asset in selected_assets}
            == {path for path in hashes if path.endswith('.png')},
            'control-state images are not distinct/complete')
    resolved = manifest['resolvedTarget']
    revisions, effects = resolved['revisions'], resolved['effects']
    require(resolved['binding'] == target and resolved['kind'] == 'dialog'
            and resolved['blocking'] is True and resolved['path'] == owner['path']
            and revisions['source'] == document['revision']
            and revisions['sourceMap'] == digest(root / 'source-map.json')
            and revisions['effects'] == effects['revision'] and effects['unknown'] is False
            and effects['assignedVariables'] == [variable['id']]
            and effects['hiddenScreens'] == [panel['id']] and effects['finishesInteraction'] is True,
            'wrong control effect/source/context result')
    dependencies = {value['id']: value['revision'] for value in effects['dependencies']}
    # The public authoring revision binds metadata AND all variable source files.
    # It is not the raw authoring.json hash.
    authoring_inputs = {'.renpy-editor/authoring.json': digest(root / 'authoring.json')}
    for definition in authoring['variables']:
        path, revision = definition['source']['path'], definition['source']['sourceRevision']
        require(hashes.get(path) == revision, 'changed authoring variable source')
        authoring_inputs[path] = revision
    captured = hashlib.sha256()
    for path, revision in sorted(authoring_inputs.items()):
        encoded = path.encode('utf-8')
        captured.update(len(encoded).to_bytes(8, 'little'))
        captured.update(encoded)
        captured.update(revision.encode('ascii'))
    authoring_revision = captured.hexdigest()
    require(len(dependencies) == len(effects['dependencies'])
            and dependencies.get(variable['id']) == variable['source']['sourceRevision']
            and document['authoringRevision'] == authoring_revision
            and dependencies.get('authoring') == authoring_revision
            and all(dependencies.get(asset['id']) == asset['sha256'] for asset in selected_assets),
            'missing control binding/variable/asset revisions')
    source = portable_file(root, owner['path']).read_bytes()
    for control, suffix in ((bar, ':binding'), (image, ':appearances')):
        start, end = control['span']['start'], control['span']['end']
        require(0 <= start < end <= len(source)
                and dependencies.get(control['id'] + suffix)
                == hashlib.sha256(source[start:end]).hexdigest(), 'wrong control state revision')
    require(isinstance(dependencies.get(image['id'] + ':action'), str)
            and re.fullmatch('[a-f0-9]{64}', dependencies[image['id'] + ':action']),
            'missing action revision')
    entry = manifest['entry']
    require(project['entrySceneId'] == entry['id']
            and entry['sourceRevision'] == hashes[entry['sourcePath']], 'wrong controls normal entry')
    beats = entry['beats']
    require([beat['payload']['type'] for beat in beats]
            == ['narration', 'showScreen', 'callScreen', 'narration', 'narration', 'return']
            and [beats[index]['payload']['text'] for index in (0, 3, 4)]
            == ['SC_BEFORE', 'SC_AFTER', 'SC_DONE']
            and all(beat['protected'] is False for beat in beats)
            and beats[1]['payload']['target'] == panel_target
            and beats[2]['payload']['target'] == target
            and beats[2]['payload']['revisions'] == revisions,
            'wrong controls Show/Call/continuation sequence')
    bootstrap = portable_file(root, 'game/script.rpy').read_text(encoding='utf-8-sig').splitlines()
    require(bootstrap[-2:] == ['label start:', '    jump ' + entry['technicalLabel']],
            'controls fixture bypasses normal Story entry')
    validate_canvas_matrix(manifest['canvas'], document, owner['name'])
    image_properties = dict(xpos=100, ypos=180, xsize=160, ysize=80)
    for key, asset in zip(('idle', 'hover', 'selected_idle', 'selected_hover',
                           'insensitive', 'selected_insensitive'), selected_assets):
        image_properties[key] = asset['relativePath'].removeprefix('game/')
    bar_properties = dict(value=5, range=20, xpos=100, ypos=100, xsize=320, ysize=24,
                          left_bar='#28783c', right_bar='#202830', thumb='#e0e0e0')
    for entry in manifest['canvas']:
        planned = {value['start']: value for value in entry['plan']['nodes']}
        require(planned[bar['span']['start']]['properties'] == bar_properties
                and planned[image['span']['start']]['properties'] == image_properties,
                'canvas data differs from qualified source values/assets/dimensions')
    return manifest


def validate_runtime_output(text, case, manifest_sha, manifest, resolution, colors):
    """Require observed SDK input, rendering and built-in actions on accepted bytes."""
    require(case in CASES and tuple(resolution) in RESOLUTIONS, 'unknown controls runtime case/aspect')
    lines = [line.rstrip() for line in text.splitlines()]
    require(lines.count('[rpytest] Status: PASSED') == 1, 'missing/duplicate engine completion')
    require(any(re.search(r'\bglobal\.screen_controls::' + case + r'\b', line) for line in lines),
            'missing named controls engine case')
    summaries = [line for line in lines if line.startswith('[rpytest] Test cases :')]
    require(len(summaries) == 1 and list(map(int, re.findall(r'\d+', summaries[0])))
            == [2, 1, 0, 0, 0, 1, 0], 'wrong controls engine case selection')
    durations = re.findall(r'\[rpytest\] Time: ([0-9.]+) s', text)
    require(len(durations) == 1 and float(durations[0]) > 0, 'missing engine duration')
    rows = [load_json(line.removeprefix('SCREEN_CONTROLS_OBSERVED ')) for line in lines
            if line.startswith('SCREEN_CONTROLS_OBSERVED ')]
    require(len(rows) == 1, 'missing/duplicate controls runtime receipt')
    row = rows[0]
    expected = dict(schemaVersion=1, sdkVersion='8.5.3', case=case,
                    manifestSHA256=manifest_sha, resolution=list(resolution),
                    acceptedHashes={value['path']: value['sha256'] for value in manifest['files']},
                    startedFromMenu=True, normalEntry=case == 'normal', previewEntry=case == 'preview',
                    observer='sys.setprofile built-in action calls', builtinsUnmodified=True,
                    calls=manifest['actions'], stateSamplesInert=True,
                    bar=[dict(step=step, value=value) for step, value in
                         [('initial', '0'), ('minimum', '-5'), ('maximum', '15'), ('keyboard', '14')]],
                    barSize=[320, 24], barRange=20, barOffset=-5, barStep=1,
                    actualPrefixes=['idle_', 'hover_'], finalValue='7', followingCount=1,
                    doneCount=0, panelVisible=False, dialogVisible=False)

    def same(actual, wanted):
        if type(wanted) is int:
            return type(actual) in (int, float) and actual == wanted
        if type(wanted) is list:
            return type(actual) is list and len(actual) == len(wanted) and all(
                same(left, right) for left, right in zip(actual, wanted))
        if type(wanted) is dict:
            return type(actual) is dict and set(actual) == set(wanted) and all(
                same(actual[key], value) for key, value in wanted.items())
        return type(actual) is type(wanted) and actual == wanted

    for key, value in expected.items():
        require(key in row and same(row[key], value),
                'wrong observed controls runtime field: ' + key)
    appearances = row.get('appearances')
    require(type(appearances) is list and len(appearances) == 6, 'missing native state appearances')
    rendered_hashes = set()
    rendered_colors = set()
    for state, appearance in zip(STATES, appearances):
        require(appearance.get('state') == state and same(appearance.get('renderedSize'), [160, 80])
                and same(appearance.get('sourceRGBA'), colors[state]), 'wrong state source/size')
        rgba = appearance.get('rgba')
        require(type(rgba) is list and len(rgba) == 4 and all(type(channel) is int and 0 <= channel <= 255
                for channel in rgba) and rgba[3] > 0 and rgba == appearance.get('referenceRGBA'),
                'native state color differs from independent native reference')
        sha = appearance.get('pixelsSHA256')
        require(isinstance(sha, str) and re.fullmatch('[a-f0-9]{64}', sha)
                and sha == appearance.get('referenceSHA256'), 'native state pixels differ from reference')
        rendered_hashes.add(sha)
        rendered_colors.add(tuple(rgba))
    require(len(rendered_hashes) == len(rendered_colors) == 6, 'cached/aliased native state appearances')
    return row


def inputs():
    material = shared.inputs()
    for name in ('app/scripts/qualify-screen-controls.py',
                 'app/scripts/test_qualify_screen_controls.py',
                 'app/scripts/screen_controls_export_checks.py',
                 'app/scripts/screen_controls_prepared_checks.py',
                 'tests/fixtures/phase-3b-screens/screen-controls/helper-reference.rpy'):
        material[name] = digest(REPO / name)
    return material


def prepare(output, expected_candidate):
    """Export through public core requests at a committed candidate, without an SDK."""
    output = files.fresh_output(output)
    result = dict(passed=False, engineStarted=False, sdkProcessesStarted=0, checks=[], candidate=expected_candidate)
    temporary = None
    try:
        shared.record_environment(result)
        material = inputs()
        process.require_candidate(expected_candidate, material)
        result['inputsSHA256'] = process.inputs_fingerprint(material)
        write_json(output / 'inputs.json', material)
        temporary = output / 'tmp'
        temporary.mkdir()
        build = Path(os.environ.get('CARGO_TARGET_DIR', REPO / 'app/target')).resolve()
        require(build.is_relative_to(REPO), 'build output must stay in this worktree')
        env = dict(os.environ, CARGO_TARGET_DIR=str(build), PYTHONDONTWRITEBYTECODE='1',
                   TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary),
                   LOOMLIGHT_SCREEN_CONTROLS_EXPORT=str(output / 'accepted'))
        spec = importlib.util.spec_from_file_location(
            'screen_controls_source_binary', REPO / 'app/scripts/qualify-screens-source.py')
        source_gate = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(source_gate)

        def retain(text):
            binary = source_gate.retain_test_binary(text, output)
            if binary is not None:
                binary.update(candidate=expected_candidate, producingInputsSHA256=result['inputsSHA256'])
            result['testBinary'] = binary

        text = process.run_logged(output, 'core-export', [
            'cargo', 'test', '-p', 'loomlight-core', '--locked', '--offline', '--lib',
            '--message-format=json', EXPORT_TEST, '--', '--exact', '--nocapture'],
            REPO / 'app', env, result['checks'], 300, retain_output=retain)
        require(result.get('testBinary') is not None, 'missing retained controls producer binary')
        manifest = validate_bundle(output / 'accepted')
        result['manifestSHA256'] = digest(output / 'accepted/manifest.json')
        validate_core_output(text, result['manifestSHA256'])
        process.validate_process_checks(result['checks'], ['core-export'])
        require(inputs() == material, 'controls producer inputs changed')
        process.require_candidate(expected_candidate, material)
        result.update(passed=True, acceptedFileCount=len(manifest['files']))
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        process.finish_cleanup(result, temporary)
        write_json(output / 'result.json', result)
        require(result['cleanupComplete'], 'controls producer cleanup incomplete')


def validate_prepared(prepared, expected_candidate, source_candidate=None):
    result = load_json(portable_file(prepared, 'result.json').read_text(encoding='utf-8'))
    shared.validate_environment(result)
    material = inputs()
    process.require_candidate(expected_candidate, material)
    producer = source_candidate or expected_candidate
    original = load_json(portable_file(prepared, 'inputs.json').read_text(encoding='utf-8'))
    if source_candidate is not None:
        require(re.fullmatch('[a-f0-9]{40}', producer), 'full controls source candidate required')
        runtime_files = {'app/scripts/qualify-screen-controls.py', 'app/scripts/test_qualify_screen_controls.py',
                         'app/scripts/screen_controls_export_checks.py',
                         'app/scripts/screen_controls_prepared_checks.py'}
        changed = set(subprocess.check_output(
            ['git', 'diff', '--name-only', '-z', producer, expected_candidate], cwd=REPO).decode('utf-8').split('\0'))
        for name in set(original) | set(material):
            runtime_only = name in runtime_files or name.startswith('tests/fixtures/phase-3b-screens/screen-controls/')
            require(runtime_only or (name not in changed and original.get(name) == material.get(name)),
                    'changed source producer dependency: ' + name)
            if runtime_only and name in original:
                committed = subprocess.check_output(['git', 'show', producer + ':' + name], cwd=REPO)
                require(hashlib.sha256(committed).hexdigest() == original[name],
                        'producer input does not match its original commit: ' + name)
    else:
        require(original == material, 'changed controls producer inputs')
    fingerprint = process.inputs_fingerprint(original)
    require(result.get('candidate') == producer and result.get('inputsSHA256') == fingerprint,
            'wrong controls producer candidate/inputs')
    require(result.get('passed') is True and result.get('engineStarted') is False
            and result.get('sdkProcessesStarted') == 0 and result.get('cleanupComplete') is True,
            'incomplete controls source producer')
    process.validate_process_checks(result.get('checks', []), ['core-export'])
    manifest = validate_bundle(prepared / 'accepted')
    require(digest(prepared / 'accepted/manifest.json') == result['manifestSHA256'], 'changed controls manifest')
    validate_core_output(portable_file(prepared, 'core-export.log').read_text(encoding='utf-8'), result['manifestSHA256'])
    binary = result['testBinary']
    process.validate_binary_binding(binary, producer, fingerprint)
    retained = portable_file(prepared, binary['path'])
    require(digest(retained) == binary['sha256'] and retained.stat().st_size == binary['bytes'],
            'changed controls source producer binary')
    return manifest


def validate_setup_reuse(previous, prepared, manifest_sha, source_candidate):
    """Reuse only completed setup on the same SDK and exact accepted game bytes."""
    result = load_json(portable_file(previous, 'result.json').read_text(encoding='utf-8'))
    require(result.get('candidate') == source_candidate and result.get('manifestSHA256') == manifest_sha
            and result.get('sdkVersion') == '8.5.3' and result.get('sdkSHA256') == files.SDK_SHA256
            and result.get('cleanupComplete') is True, 'wrong/incomplete prior SDK setup')
    require(digest(previous / 'accepted-manifest.json') == manifest_sha
            and load_json(portable_file(previous, 'inputs.json').read_text(encoding='utf-8'))
            == load_json(portable_file(prepared, 'inputs.json').read_text(encoding='utf-8')),
            'prior SDK setup used different accepted inputs')
    names = ['sdk-version', 'sdk-compile', 'sdk-lint']
    process.validate_process_checks(result.get('checks', [])[:3], names)
    sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
    from sdk_adapter import parse_version
    parse_version(portable_file(previous, 'sdk-version.log').read_text(encoding='utf-8'))
    return dict(candidate=source_candidate, resultSHA256=digest(previous / 'result.json'),
                logSHA256={name: digest(portable_file(previous, name + '.log')) for name in names},
                scope='same SDK and accepted source; current instrumentation loads in each runtime case')


def stage_game(accepted, manifest, game):
    game.mkdir(parents=True, exist_ok=False)
    for record in manifest['files']:
        target = game / record['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(portable_file(accepted, record['path']), target)
    shutil.copyfile(accepted / 'manifest.json', game / 'accepted-runtime.json')
    for name in ('driver', 'tests'):
        target = game / 'game' / ('zz_screen_controls_' + name + '.rpy')
        require(not target.exists(), 'controls runtime fixture collision')
        shutil.copyfile(FIXTURE / (name + '.rpy'), target)


def expected_colors(accepted, manifest):
    from PIL import Image
    assets = {asset['id']: asset for asset in manifest['sidecars']['authoring']['assets']}
    button = next(node for screen in manifest['document']['screens'] for node in screen['nodes']
                  if node['id'] == manifest['imageButtonId'])
    result = {}
    for state in STATES:
        asset = assets[button['imageButtonAppearances'][state]['assetId']]
        with Image.open(portable_file(accepted, asset['relativePath'])) as image:
            require(image.size == (80, 40), 'wrong controls source bitmap dimensions')
            rgba = image.convert('RGBA')
            colors = rgba.getcolors(maxcolors=2)
            require(colors is not None and len(colors) == 1 and colors[0][0] == 3200,
                    'controls image fixture must have one independently known color')
            result[state] = list(colors[0][1])
    require(len({tuple(color) for color in result.values()}) == 6, 'controls state colors are not distinct')
    return result


def qualify_sdk(args):
    require(args.allow_fixture_execution is True, 'explicit reserved fixture execution required')
    prepared = args.prepared.resolve()
    source_candidate = args.source_candidate or args.expected_candidate
    manifest = validate_prepared(prepared, args.expected_candidate, args.source_candidate)
    colors = expected_colors(prepared / 'accepted', manifest)
    manifest_sha = digest(prepared / 'accepted/manifest.json')
    setup_reuse = validate_setup_reuse(args.setup_from.resolve(), prepared, manifest_sha, source_candidate) if args.setup_from else None
    output = files.fresh_output(args.output)
    result = dict(passed=False, checks=[], runtimeObserved=[], sdkVersion='8.5.3', sdkSHA256=files.SDK_SHA256,
                  sdkLaunchAttempts=0, sdkProcessesStarted=0, sdkUncertainReservations=0, sdkRefusedLaunches=0,
                  helperStarts=0, nativeEditorLaunches=0, physicalInputProven=False,
                  candidate=args.expected_candidate, sourceCandidate=source_candidate, manifestSHA256=manifest_sha)
    temporary = None
    try:
        shared.record_environment(result)
        sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, install_verified_tar
        from sdk_adapter import Command, command_argv, parse_version
        require(expected_sha256(args.checksums.read_text(encoding='utf-8'), args.archive.name)
                == files.SDK_SHA256, 'SDK checksum pin mismatch')
        write_json(output / 'inputs.json', inputs())
        shutil.copyfile(prepared / 'inputs.json', output / 'producer-inputs.json')
        shutil.copyfile(prepared / 'accepted/manifest.json', output / 'accepted-manifest.json')
        temporary = Path(tempfile.mkdtemp(prefix='screen-controls-', dir=output))
        install_verified_tar(args.archive.resolve(), files.SDK_SHA256, temporary / 'sdk')
        sdk = temporary / 'sdk/renpy-8.5.3-sdk'
        game = temporary / 'game-project'
        stage_game(prepared / 'accepted', manifest, game)
        captures = output / 'captures'
        captures.mkdir()
        env = dict(os.environ, RENPY_PATH_TO_SAVES=str(temporary / 'saves'), SDL_AUDIODRIVER='dummy',
                   RENPY_RENDERER='angle2' if sys.platform == 'win32' else 'gl2', RENPY_SCALE_FACTOR='1',
                   LOOMLIGHT_CONTROLS_CAPTURE_DIR=str(captures),
                   PYTHONDONTWRITEBYTECODE='1', TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary))
        env.pop('SDL_VIDEODRIVER', None)
        env.pop('SDL_RENDER_DRIVER', None)

        def run(name, command, timeout):
            return process.run_sdk_logged(result, output, name, command, sdk, env, timeout)

        if setup_reuse is None:
            parse_version(run('sdk-version', command_argv(sdk, Command.VERSION), 30))
            run('sdk-compile', command_argv(sdk, Command.COMPILE, game, allow_project_execution=True), 90)
            run('sdk-lint', command_argv(sdk, Command.LINT, game, allow_project_execution=True), 90)
        else:
            result['setupReused'] = setup_reuse
        hashes = {record['path']: record['sha256'] for record in manifest['files']}
        for resolution in RESOLUTIONS:
            env.update(LOOMLIGHT_CONTROLS_WIDTH=str(resolution[0]), LOOMLIGHT_CONTROLS_HEIGHT=str(resolution[1]))
            for case in CASES:
                name = f'{resolution[0]}x{resolution[1]}-{case}'
                text = run(name, command_argv(sdk, Command.TEST, game,
                           testcase='screen_controls::' + case, allow_project_execution=True), 75)
                observed = validate_runtime_output(text, case, result['manifestSHA256'], manifest, resolution, colors)
                from PIL import Image
                for appearance in observed['appearances']:
                    for kind, field in (('actual', 'pixelsSHA256'), ('reference', 'referenceSHA256')):
                        path = portable_file(captures, f'{name}-{appearance["state"]}-{kind}.png')
                        with Image.open(path) as image:
                            require(image.size == (160, 80) and hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest()
                                    == appearance[field], 'retained state capture differs from observation')
                result['runtimeObserved'].append(observed)
                require(all(digest(game / path) == sha for path, sha in hashes.items()), 'accepted controls source changed')
        expected_checks = ([] if setup_reuse else ['sdk-version', 'sdk-compile', 'sdk-lint']) + [
            f'{width}x{height}-{case}' for width, height in RESOLUTIONS for case in CASES]
        process.validate_process_checks(result['checks'], expected_checks)
        require(result['sdkProcessesStarted'] == len(expected_checks) and result['sdkLaunchAttempts'] == len(expected_checks)
                and result['sdkUncertainReservations'] == 0 and result['sdkRefusedLaunches'] == 0,
                'wrong controls SDK accounting')
        require(inputs() == load_json((output / 'inputs.json').read_text(encoding='utf-8')),
                'controls inputs changed during qualification')
        result.update(passed=True, acceptedSourceUnchanged=True,
                      stateEvidence='engine appearance samples; actual idle/hover input',
                      previewEvidence='deliberate fixture entry; native editor preview remains separate')
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        process.finish_cleanup(result, temporary)
        write_json(output / 'result.json', result)
        require(result['cleanupComplete'], 'controls SDK process/scratch cleanup incomplete')


def validate_reference(accepted, output, manifest_sha, result_sha):
    """Admit independent native frames, with exact source and capture bindings."""
    require(digest(portable_file(output, 'result.json')) == result_sha, 'changed reference receipt')
    result = load_json((output / 'result.json').read_text(encoding='utf-8'))
    require(result.get('passed') is True and result.get('cleanupComplete') is True
            and type(result.get('sdkProcessesStarted')) is int and result['sdkProcessesStarted'] == 1
            and result.get('sdkUncertainReservations') == 0
            and result.get('sdkSHA256') == files.SDK_SHA256
            and result.get('manifestSHA256') == manifest_sha, 'incomplete reference proof')
    require(result.get('referenceSourceSHA256') == digest(FIXTURE / 'helper-reference.rpy'),
            'changed literal reference source')
    require(digest(portable_file(output, 'accepted-manifest.json')) == manifest_sha,
            'reference used different accepted source')
    process.validate_process_checks(result.get('checks', []), ['reference-matrix'])
    records = result.get('records', [])
    require(len(records) == 12, 'incomplete reference matrix')
    wanted = {(w, h, state) for w, h in RESOLUTIONS for state in STATES}
    references = {}
    from PIL import Image
    for row in records:
        key = row['width'], row['height'], row['state']
        require(key in wanted and key not in references
                and isinstance(row.get('physical'), list) and len(row['physical']) == 2
                and all(type(n) is int and n > 0 for n in row['physical'])
                and type(row.get('drawPerVirtual')) in (int, float)
                and math.isfinite(row['drawPerVirtual']) and row['drawPerVirtual'] > 0
                and row['renderer'] == ('angle2' if sys.platform == 'win32' else 'gl2'),
                'wrong reference identity or capture conditions')
        path = portable_file(output, row['filename'])
        require(digest(path) == row['sha256'], 'changed native reference image')
        with Image.open(path) as image:
            require(image.size == key[:2], 'wrong reference frame size')
        references[key] = dict(path=path, physical=row['physical'], drawPerVirtual=row['drawPerVirtual'])
    return references


def reference_helper(args):
    """One explicitly reserved SDK process; no product helper or game scripts."""
    require(args.allow_fixture_execution, 'explicit reserved reference execution required')
    accepted = args.accepted.resolve()
    manifest = validate_bundle(accepted)
    output = files.fresh_output(args.output)
    result = dict(passed=False, checks=[], candidate=args.expected_candidate,
                  manifestSHA256=digest(accepted / 'manifest.json'), sdkSHA256=files.SDK_SHA256,
                  referenceSourceSHA256=digest(FIXTURE / 'helper-reference.rpy'),
                  sdkLaunchAttempts=0, sdkProcessesStarted=0, sdkUncertainReservations=0,
                  sdkRefusedLaunches=0, helperStarts=0, nativeEditorLaunches=0)
    temporary = None
    try:
        process.require_candidate(args.expected_candidate, inputs())
        write_json(output / 'inputs.json', inputs())
        shared.record_environment(result)
        sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, install_verified_tar
        from sdk_adapter import Command, command_argv
        require(expected_sha256(args.checksums.read_text(encoding='utf-8'), args.archive.name)
                == files.SDK_SHA256, 'SDK checksum pin mismatch')
        shutil.copyfile(accepted / 'manifest.json', output / 'accepted-manifest.json')
        temporary = Path(tempfile.mkdtemp(prefix='control-reference-', dir=output))
        install_verified_tar(args.archive.resolve(), files.SDK_SHA256, temporary / 'sdk')
        sdk, game = temporary / 'sdk/renpy-8.5.3-sdk', temporary / 'reference'
        (game / 'game').mkdir(parents=True)
        shutil.copyfile(FIXTURE / 'helper-reference.rpy', game / 'game/reference.rpy')
        node = next(n for screen in manifest['document']['screens'] for n in screen['nodes']
                    if n['id'] == manifest['imageButtonId'])
        assets = {a['id']: a for a in manifest['sidecars']['authoring']['assets']}
        appearances = {}
        for state in STATES:
            asset = assets[node['imageButtonAppearances'][state]['assetId']]
            relative = asset['relativePath']
            target = game / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(portable_file(accepted, relative), target)
            appearances[state] = relative.removeprefix('game/')
        write_json(game / 'reference-input.json', dict(manifestSHA256=result['manifestSHA256'], appearances=appearances))
        env = dict(os.environ, RENPY_PATH_TO_SAVES=str(temporary / 'saves'), SDL_AUDIODRIVER='dummy',
                   RENPY_RENDERER='angle2' if sys.platform == 'win32' else 'gl2', RENPY_SCALE_FACTOR='1',
                   LOOMLIGHT_CONTROL_REFERENCE_OUTPUT=str(output), PYTHONDONTWRITEBYTECODE='1',
                   TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary))
        env.pop('SDL_VIDEODRIVER', None)
        env.pop('SDL_RENDER_DRIVER', None)
        text = process.run_sdk_logged(result, output, 'reference-matrix',
            command_argv(sdk, Command.TEST, game, testcase='control_helper_reference::matrix',
                         allow_project_execution=True), sdk, env, 90)
        rows = [load_json(line.removeprefix('CONTROL_HELPER_REFERENCE ')) for line in text.splitlines()
                if line.startswith('CONTROL_HELPER_REFERENCE ')]
        require(len(rows) == 1 and rows[0]['manifestSHA256'] == result['manifestSHA256']
                and text.count('[rpytest] Status: PASSED') == 1, 'missing native reference completion')
        summaries = [line for line in text.splitlines() if line.startswith('[rpytest] Test cases :')]
        require(len(summaries) == 1 and list(map(int, re.findall(r'\d+', summaries[0])))
                == [1, 1, 0, 0, 0, 0, 0], 'wrong native reference test selection')
        result['records'] = rows[0]['records']
        result['passed'] = True
    finally:
        process.finish_cleanup(result, temporary)
        write_json(output / 'result.json', result)
    try:
        validate_reference(accepted, output, result['manifestSHA256'], digest(output / 'result.json'))
    except Exception as error:
        result.update(passed=False, admissionError=str(error))
        write_json(output / 'result.json', result)
        raise
    return result


def validate_helper(accepted, output, expected_candidate, manifest_sha, reference, reference_sha):
    """Check retained helper pixels and lifecycle; never start an SDK."""
    from PIL import Image
    require(re.fullmatch('[a-f0-9]{40}', expected_candidate), 'full helper candidate required')
    require(digest(portable_file(accepted, 'manifest.json')) == manifest_sha, 'wrong helper source manifest')
    manifest = validate_bundle(accepted)
    references = validate_reference(accepted, reference, manifest_sha, reference_sha)
    result = load_json(portable_file(output, 'result.json').read_text(encoding='utf-8'))
    require(result.get('passed') is True and result.get('candidate') == expected_candidate
            and result.get('manifestSHA256') == manifest_sha and result.get('sdkValidationProcesses') == 3
            and all(type(result.get(name)) is int for name in ('helperStarts', 'helperReturns'))
            and result.get('helperStarts') == result.get('helperReturns') == 1
            and result.get('sourceUnchanged') is True and result.get('cleanupComplete') is True,
            'incomplete helper lifecycle/source proof')
    require(result.get('shutdown') == dict(cleanupComplete=True, cooperative=True, exitCode=0),
            'helper did not stop cooperatively')
    require(re.fullmatch('[a-f0-9]{64}', result.get('coreTestSHA256', ''))
            and result.get('rendererSHA256') == digest(REPO / 'app/src-core/src/screens/canvas-renderer.rpy'),
            'missing helper binary identity or changed renderer')
    expected_inputs = {record['path']: record['sha256'] for record in manifest['files']}
    expected_inputs.update({'.renpy-editor/' + name: digest(portable_file(accepted, name))
                           for name in ('project.json', 'source-map.json', 'authoring.json')})
    require(result.get('inputs') == expected_inputs, 'helper used different source or variable metadata')
    records = result.get('records')
    require(isinstance(records, list) and len(records) == 12, 'incomplete helper matrix')
    document = manifest['document']
    nodes = {node['kind']: node for screen in document['screens'] for node in screen['nodes']
             if node['id'] in (manifest['barId'], manifest['imageButtonId'])}
    wanted = {(row['request']['width'], row['request']['height'], row['request']['buttonState']): row
              for row in manifest['canvas']}
    seen, fingerprints = set(), {state: set() for state in STATES}
    for record in records:
        request, frame = record['request'], record['frame']
        key = request['width'], request['height'], request['buttonState']
        require(key in wanted and key not in seen and request == wanted[key]['request'], 'wrong/duplicate helper request')
        seen.add(key)
        require(frame.get('phase') == 'ready' and frame.get('revision') == document['revision']
                and frame.get('renderer') == ('angle2' if sys.platform == 'win32' else 'gl2'),
                'stale or non-native helper frame')
        geometry = frame.get('geometry', [])
        controls = {}
        for kind, size in (('bar', (320, 24)), ('imagebutton', (160, 80))):
            matches = [item for item in geometry if item['start'] == nodes[kind]['span']['start']]
            require(len(matches) == 1 and (matches[0]['width'], matches[0]['height']) == size,
                    'wrong helper control geometry')
            controls[kind] = matches[0]
        image_path = portable_file(output, record['filename'])
        require(digest(image_path) == record['sha256'], 'changed helper image')
        native = references[key]
        require(frame.get('diagnostics', {}).get('physical') == native['physical']
                and frame['diagnostics'].get('drawPerVirtual') == native['drawPerVirtual'],
                'wrong helper capture conditions')
        rect = controls['imagebutton']
        require(all(type(rect[name]) in (int, float) and float(rect[name]).is_integer()
                    for name in ('x', 'y', 'width', 'height')), 'non-integral fixture control bounds')
        x, y = int(rect['x']), int(rect['y'])
        with Image.open(image_path) as rendered, Image.open(native['path']) as original:
            require(rendered.size == key[:2] and 0 <= x <= rendered.width-160 and 0 <= y <= rendered.height-80,
                    'helper image dimensions or crop bounds differ')
            crop = rendered.convert('RGBA').crop((x, y, x+160, y+80)).tobytes()
            expected = original.convert('RGBA').crop((100, 180, 260, 260)).tobytes()
            require(crop == expected, 'helper state pixels differ from the independent native reference')
        fingerprints[key[2]].add(hashlib.sha256(crop).hexdigest())
    require(seen == set(wanted) and all(len(values) == 1 for values in fingerprints.values())
            and len({next(iter(values)) for values in fingerprints.values()}) == 6,
            'cached/aliased/incomplete helper appearances')
    print('SCREEN_CONTROLS_HELPER_ADMITTED ' + json.dumps(dict(candidate=expected_candidate,
          manifestSHA256=manifest_sha, frameCount=12, explicitStates=6, helperSessions=1,
          sourceUnchanged=True, cleanupComplete=True, physicalInputProven=False)))
    return result


def main(argv=None):
    require(sys.version_info >= (3, 11), 'Python 3.11 or later required')
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    validation = commands.add_parser('validate-export', help='Check source export; never start an SDK.')
    validation.add_argument('--accepted', type=Path, required=True)
    validation.add_argument('--manifest-sha256', required=True)
    helper = commands.add_parser('validate-helper', help='Check retained helper proof; never start an SDK.')
    helper.add_argument('--accepted', type=Path, required=True)
    helper.add_argument('--output', type=Path, required=True)
    helper.add_argument('--expected-candidate', required=True)
    helper.add_argument('--manifest-sha256', required=True)
    helper.add_argument('--reference', type=Path, required=True)
    helper.add_argument('--reference-result-sha256', required=True)
    reference = commands.add_parser('reference-helper', help='One reserved SDK start for independent literal frames.')
    for name in ('accepted', 'output', 'archive', 'checksums'):
        reference.add_argument('--' + name, type=Path, required=True)
    reference.add_argument('--expected-candidate', required=True)
    reference.add_argument('--allow-fixture-execution', action='store_true', required=True)
    preparation = commands.add_parser('prepare', help='Export committed source; never start an SDK.')
    preparation.add_argument('--output', type=Path, required=True)
    prepared = commands.add_parser('validate', help='Check a retained producer; never start an SDK.')
    prepared.add_argument('--prepared', type=Path, required=True)
    prepared.add_argument('--source-candidate')
    sdk = commands.add_parser('sdk', help='Run the reserved deliberate execution matrix.')
    for name in ('prepared', 'output', 'archive', 'checksums'):
        sdk.add_argument('--' + name, type=Path, required=True)
    sdk.add_argument('--allow-fixture-execution', action='store_true', required=True)
    sdk.add_argument('--source-candidate', help='Original source producer; only runtime-observer changes may differ.')
    sdk.add_argument('--setup-from', type=Path, help='Completed setup on exactly the same accepted game and SDK.')
    for command in (preparation, prepared, sdk):
        command.add_argument('--expected-candidate', required=True)
    args = parser.parse_args(argv)
    if args.command == 'validate-helper':
        return validate_helper(args.accepted, args.output, args.expected_candidate, args.manifest_sha256,
                               args.reference, args.reference_result_sha256)
    if args.command == 'reference-helper':
        return reference_helper(args)
    if args.command == 'prepare':
        return prepare(args.output, args.expected_candidate)
    if args.command == 'validate':
        return validate_prepared(args.prepared.resolve(), args.expected_candidate, args.source_candidate)
    if args.command == 'sdk':
        return qualify_sdk(args)
    require(digest(portable_file(args.accepted, 'manifest.json')) == args.manifest_sha256,
            'wrong controls manifest hash')
    manifest = validate_bundle(args.accepted)
    print('SCREEN_CONTROLS_SOURCE_ADMITTED ' + json.dumps(dict(
        manifestSHA256=args.manifest_sha256, acceptedFileCount=len(manifest['files']),
        planCount=len(manifest['canvas']), publicCoreRequests=True, engineStarted=False)))


if __name__ == '__main__':
    main()
