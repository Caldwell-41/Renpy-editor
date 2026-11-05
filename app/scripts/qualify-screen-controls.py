"""Admission checks for the #51/#52 public-core accepted-source export.

Importing this module and checking receipts never starts an SDK or canvas helper.
"""
import importlib.util
import hashlib
import argparse
import json
from pathlib import Path
import re


EXPORT_TEST = 'screens::tests::controls::export_screen_controls_public_core_fixture'
STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
RESOLUTIONS = ((1280, 720), (1024, 768))

_spec = importlib.util.spec_from_file_location(
    'screen_controls_file_utilities', Path(__file__).with_name('qualify-help-panel.py'))
files = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(files)
require, load_json, digest = files.require, files.load_json, files.digest
portable_file = files.portable_file


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


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    validation = commands.add_parser('validate-export', help='Check source export; never start an SDK.')
    validation.add_argument('--accepted', type=Path, required=True)
    validation.add_argument('--manifest-sha256', required=True)
    args = parser.parse_args(argv)
    require(digest(portable_file(args.accepted, 'manifest.json')) == args.manifest_sha256,
            'wrong controls manifest hash')
    manifest = validate_bundle(args.accepted)
    print('SCREEN_CONTROLS_SOURCE_ADMITTED ' + json.dumps(dict(
        manifestSHA256=args.manifest_sha256, acceptedFileCount=len(manifest['files']),
        planCount=len(manifest['canvas']), publicCoreRequests=True, engineStarted=False)))


if __name__ == '__main__':
    main()
