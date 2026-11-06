"""L19 accepted-source admission and exact comparison. Starts no processes."""
import json
import math
from pathlib import Path

from PIL import Image
from fidelity_comparison import compare_frame
from base_help_fidelity import digest

REPO = Path(__file__).resolve().parents[2]
OUTCOME = 'L19-nested-fidelity'
ASPECTS = ((1280, 720), (1024, 768))
SOURCE = 'game/ui/nested_fidelity.rpy'
FIXTURES = {
    SOURCE: 'nested-fidelity.rpy',
    'game/ui/nested_component_0.rpy': 'nested-fidelity-component.rpy',
    'game/ui/nested_component_1.rpy': 'nested-fidelity-cell.rpy',
}
ASSETS = {
    'font': ('game/fonts/nested_font.ttf', 'fonts/SourceSans3-Regular.ttf'),
    'uiImage': ('game/images/ui nested_seal.png', 'ui-image/seal.png'),
}
FIXTURE_ROOT = REPO / 'tests/fixtures/phase-3b-screens'


def inputs(accepted):
    return {**{path: row['sha256'] for path, row in accepted['files'].items()},
            **{row['relativePath']: row['sha256'] for row in accepted['assets']}}


def validate_accepted(accepted):
    assert accepted['outcome'] == OUTCOME and accepted['publicCoreRequests'] is True
    assert accepted['sourceMapSchemaVersion'] == 8
    assert accepted['exporterSourceSHA256'] == digest((REPO / 'app/src-core/src/screens/nested_canvas_tests.rs').read_bytes())
    files = accepted['files']
    project = json.loads(files['.renpy-editor/project.json']['text'])
    scenes = {scene['sourcePath'] for scene in project['scenes']}
    assert set(files) == set(FIXTURES) | scenes | {'.renpy-editor/project.json', '.renpy-editor/source-map.json', '.renpy-editor/authoring.json', 'game/definitions/variables.rpy', 'game/definitions/characters.rpy'}
    for row in files.values():
        assert digest(row['text'].encode()) == row['sha256'], 'Accepted file hash differs'
    metadata = json.loads(files['.renpy-editor/source-map.json']['text'])
    assert metadata['schemaVersion'] == 8
    for path, fixture in FIXTURES.items():
        owner = next(owner for owner in metadata['ownedScreens'] if owner['path'] == path)
        text = (FIXTURE_ROOT / fixture).read_text().replace('screen ', '# loomlight-screen: ' + owner['id'] + '\nscreen ', 1)
        uses = [row for row in metadata['componentUses'] if row['screenId'] == owner['id']]
        for placeholder, row in zip(('@USE_FIRST@', '@USE_SECOND@') if path == SOURCE else ('@USE_CELL@',), uses):
            text = text.replace(placeholder, 'loomlight-element: ' + row['nodeId'])
        assert files[path]['text'] == text, 'Different source fixture'
    assert len(accepted['assets']) == 2
    for kind, (path, fixture) in ASSETS.items():
        rows = [row for row in accepted['assets'] if row['kind'] == kind]
        assert len(rows) == 1 and rows[0]['relativePath'] == path
        assert rows[0]['sha256'] == digest((FIXTURE_ROOT / fixture).read_bytes())
    variables = json.loads(files['.renpy-editor/authoring.json']['text'])['variables']
    assert {variable['technicalName'] for variable in variables} == {'flag', 'nested_caption'}
    variable = next(variable for variable in variables if variable['technicalName'] == 'nested_caption')
    assert files['game/definitions/variables.rpy']['text'] == '# Variable definitions are added by Loomlight.\ndefault flag = True\ndefault nested_caption = "Nested café"\n'
    assert variable['variableType'] == 'string' and variable['defaultValue'] == 'Nested café'
    assert variable['source']['path'] == 'game/definitions/variables.rpy'
    assert variable['source']['sourceRevision'] == files[variable['source']['path']]['sha256']
    assert len(accepted['cases']) == 2
    assert {tuple(row['request'][key] for key in ('width', 'height')) for row in accepted['cases']} == set(ASPECTS)
    for case in accepted['cases']:
        request, plan = case['request'], case['plan']
        assert request['path'] == SOURCE and request['screenName'] == case['screen'] == 'nested_fidelity'
        assert request['expectedRevision'] == plan['revision'] == files[SOURCE]['sha256']
        assert plan['available'] is True and plan['limits'] == []
        assert [plan['width'], plan['height'], plan['buttonState']] == [request['width'], request['height'], 'normal']
        assert case['viewportState'] == dict(x=0, y=0)
        assert request['variableSamples'] == [dict(variableId=variable['id'], expectedSourceRevision=variable['source']['sourceRevision'], value="[__import__('os').system('never')] {b}literal{/b}")]
        assert all(node['literal'] == "[__import__('os').system('never')] {{b}literal{{/b}" for node in plan['nodes'] if node['kind'] == 'text' and node.get('selectionStart') is not None and node['literal'].startswith('['))
        nodes = plan['nodes']
        assert len(nodes) == 32 and len({node['start'] for node in nodes}) == 32
        assert len(case['widgets']) == 31
        assert [row['start'] for row in case['widgets']] == [node['start'] for node in nodes[1:]]
        assert [row['selectionStart'] for row in case['widgets']] == [node.get('selectionStart', node['start']) for node in nodes[1:]]
        assert all(node['kind'] in {'screen', 'fixed', 'window', 'hbox', 'vbox', 'grid', 'frame', 'viewport', 'image', 'text'} for node in nodes)
        assert all(not {'action', 'hovered', 'unhovered'} & node['properties'].keys() for node in nodes)
        assert nodes[-2]['kind'] == 'frame' and nodes[-2]['properties']['background'] == '#bb6428'
        assert len({node['selectionStart'] for node in nodes if 'selectionStart' in node}) == 2
    return accepted


def validate_captures(root, accepted, role):
    root = Path(root)
    receipt = json.loads((root / 'result.json').read_text())
    assert receipt['outcome'] == OUTCOME and receipt['role'] == role
    assert receipt['passed'] is True and receipt['sourceUnchanged'] is True and receipt['cleanupComplete'] is True
    assert receipt['acceptedSHA256'] == digest((root / 'accepted.json').read_bytes())
    assert receipt['inputs'] == inputs(accepted)
    assert receipt['target'] in ('macos-arm64', 'windows-x64')
    assert receipt['rendererSHA256'] == digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes())
    if role == 'normal-game':
        assert [row['name'] for row in receipt['commands']] == ['compile', 'lint', 'run', 'run']
        assert receipt['sdkProcesses'] == receipt['confirmedSDKProcesses'] == 4 and receipt['uncertainSDKProcesses'] == 0
        assert all(row['started'] is True and row['exitCode'] == 0 and row['cleanupComplete'] is True and not row['uncertainStart'] and not row['timedOut'] and not row['outputLimited'] for row in receipt['commands'])
    else:
        assert receipt['sdkCliProcesses'] == 3 and receipt['helperSessions'] == 1
        assert len(receipt['caseStatuses']) == 2 and all(row['status'] == 'passed' for row in receipt['caseStatuses'])
        assert receipt['helperStartAccounting'] == dict(ownerStarts=1, ownerReturns=1, confirmed=1, charged=1, uncertain=False)
        shutdown = receipt['shutdown']
        assert shutdown['cooperative'] is True and shutdown['cleanupComplete'] is True and shutdown['exitCode'] == 0
    records = receipt['records']
    assert len(records) == 2 and {tuple(row['aspect']) for row in records} == set(ASPECTS)
    backend = 'gl2' if receipt['target'] == 'macos-arm64' else 'angle2'
    for row in records:
        width, height = row['aspect']
        assert row['screen'] == 'nested_fidelity' and row['state'] == 'normal' and row['viewportState'] == dict(x=0, y=0)
        assert row['revision'] == accepted['files'][SOURCE]['sha256'] and row['inputs'] == inputs(accepted)
        assert row['guidesExcluded'] is True and row['physical'] == [width, height] and row['renderer'] == backend
        assert math.isfinite(row['drawPerVirtual']) and row['drawPerVirtual'] > 0
        assert row['filename'] == f'nested_fidelity-{width}x{height}-normal.png'
        assert row['imageSHA256'] == digest((root / row['filename']).read_bytes())
        with Image.open(root / row['filename']) as image:
            assert image.size == (width, height) and any(low != high for low, high in image.convert('RGBA').getextrema())
        case = next(case for case in accepted['cases'] if [case['request']['width'], case['request']['height']] == row['aspect'])
        allowed = {node.get('selectionStart', node['start']) for node in case['plan']['nodes'][1:]}
        assert {box['start'] for box in row['geometry']} == allowed
        expected_order = [widget['selectionStart'] for widget in case['widgets'] if widget['widgetId'] != 'hidden_label']
        assert [box['start'] for box in row['geometry']] == expected_order, 'Missing, hidden or reordered hit region'
        if role == 'normal-game':
            assert row['sdkVersion'] == '8.5.3.26051504'
        assert all(all(isinstance(box[key], (int, float)) and math.isfinite(box[key]) for key in ('x', 'y', 'width', 'height')) and box['width'] > 0 and box['height'] > 0 for box in row['geometry'])
        # Source-order records are significant: later siblings must win hit tests.
        assert row['geometry'][-2]['start'] == case['plan']['nodes'][-2]['start']
        assert row['geometry'][-1]['start'] == case['plan']['nodes'][-1]['start']
    return receipt


def compare(helper, normal, output, *, expected_candidate, core_test):
    helper, normal, output = Path(helper), Path(normal), Path(output)
    raw = (helper / 'accepted.json').read_bytes()
    assert raw == (normal / 'accepted.json').read_bytes(), 'Different accepted sources'
    accepted = validate_accepted(json.loads(raw))
    h, n = validate_captures(helper, accepted, 'hidden-helper'), validate_captures(normal, accepted, 'normal-game')
    assert h['candidate'] == n['candidate'] == expected_candidate and h['target'] == n['target']
    assert h['coreTestSHA256'] == digest(Path(core_test).read_bytes())
    output.mkdir(parents=True, exist_ok=False)
    rows = []
    for aspect in ASPECTS:
        a = next(row for row in h['records'] if tuple(row['aspect']) == aspect)
        b = next(row for row in n['records'] if tuple(row['aspect']) == aspect)
        assert a['drawPerVirtual'] == b['drawPerVirtual']
        rows.append(dict(aspect=list(aspect), **compare_frame(
            helper / a['filename'], normal / b['filename'], a['geometry'], b['geometry'],
            output / ('difference-' + a['filename']))))
    result = dict(outcome=OUTCOME, candidate=expected_candidate, target=h['target'], tolerance=0, records=rows,
                  passed=all(row['differingPixels'] == 0 and row['geometryMatches'] for row in rows))
    (output / 'comparison.json').write_text(json.dumps(result, indent=2) + '\n')
    assert result['passed'], 'Rendering differences require diagnosis; no tolerance is accepted'
    return result
