"""L18 admission and exact comparison. No process is started by this module."""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageChops

REPO = Path(__file__).resolve().parents[2]
OUTCOME = 'L18-base-help-fidelity'
SOURCE_PATH = 'game/ui/base_help_fidelity.rpy'
FIXTURE = REPO / 'tests/fixtures/phase-3b-screens/base-help-fidelity.rpy'
SCREENS = ('base_help_fidelity', 'base_help_anchors')
ASPECTS = ((1280, 720), (1024, 768))
STATES = ('normal', 'hover')
MATRIX = tuple((screen, width, height, state) for screen in SCREENS
               for width, height in ASPECTS for state in STATES)
ASSETS = {
    'font': ('game/fonts/base_help_font.ttf', REPO / 'tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf'),
    'uiImage': ('game/images/ui base_help_seal.png', REPO / 'tests/fixtures/phase-3b-screens/ui-image/seal.png'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def key(case):
    request = case['request']
    return case['screen'], request['width'], request['height'], request['buttonState']


def name(case_key):
    screen, width, height, state = case_key
    return f'{screen}-{width}x{height}-{state}'


def validate_accepted(accepted):
    assert accepted['outcome'] == OUTCOME and accepted['publicCoreRequests'] is True
    assert accepted['sourceMapSchemaVersion'] in (8, 9, 10, 11, 12, 13, 14)
    assert accepted['exporterSourceSHA256'] == digest((REPO / 'app/src-core/src/screens/base_help_canvas_tests.rs').read_bytes())
    source = accepted['files'][SOURCE_PATH]
    assert source['text'].encode() == FIXTURE.read_bytes(), 'Wrong accepted fixture'
    for row in accepted['files'].values():
        assert digest(row['text'].encode()) == row['sha256'], 'Wrong accepted file hash'
    source_map = json.loads(accepted['files']['.renpy-editor/source-map.json']['text'])
    assert source_map['schemaVersion'] == accepted['sourceMapSchemaVersion']
    assert len(accepted['assets']) == 2
    for kind, (path, fixture) in ASSETS.items():
        assets = [asset for asset in accepted['assets'] if asset['kind'] == kind]
        assert len(assets) == 1 and assets[0]['relativePath'] == path
        assert assets[0]['sha256'] == digest(fixture.read_bytes()), f'Wrong {kind} bytes'
    cases = accepted['cases']
    assert len(cases) == len(MATRIX) and {key(case) for case in cases} == set(MATRIX), 'Incomplete case matrix'
    for case in cases:
        plan, request = case['plan'], case['request']
        assert request['path'] == SOURCE_PATH and request['screenName'] == case['screen']
        assert request['expectedRevision'] == plan['revision'] == source['sha256']
        assert plan['available'] is True and plan['limits'] == []
        assert [plan['width'], plan['height'], plan['buttonState']] == [request['width'], request['height'], request['buttonState']]
        assert len(plan['nodes']) == 7
        assert sorted(n['kind'] for n in plan['nodes']) == sorted(['screen', 'fixed', 'frame', 'vbox' if case['screen'] == SCREENS[0] else 'fixed', 'text', 'image', 'textbutton'])
        starts = [node['start'] for node in plan['nodes']]
        assert len(set(starts)) == 7 and all(isinstance(start, int) and 0 <= start < len(source['text'].encode()) for start in starts)
        for node in plan['nodes']:
            assert not {'action', 'hovered', 'unhovered'} & node['properties'].keys(), 'Controls must be inert'
            if node['kind'] == 'image':
                assert node['literal'] == ASSETS['uiImage'][0].removeprefix('game/')
            if node['kind'] in ('text', 'textbutton'):
                font_key = 'font' if node['kind'] == 'text' else 'text_font'
                assert node['properties'][font_key] == ASSETS['font'][0].removeprefix('game/'), 'Substitute font'
    return accepted


def inputs(accepted):
    return {SOURCE_PATH: accepted['files'][SOURCE_PATH]['sha256'],
            **{asset['relativePath']: asset['sha256'] for asset in accepted['assets']}}


def validate_capture_set(root, accepted, role):
    root = Path(root)
    receipt = json.loads((root / 'result.json').read_text(encoding='utf-8'))
    assert receipt['outcome'] == OUTCOME and receipt['role'] == role
    assert receipt['acceptedSHA256'] == digest((root / 'accepted.json').read_bytes())
    assert receipt['passed'] is True and receipt['cleanupComplete'] is True
    assert receipt['sourceUnchanged'] is True
    assert receipt['target'] in ('macos-arm64', 'windows-x64')
    assert len(receipt['candidate']) == 40 and all(c in '0123456789abcdef' for c in receipt['candidate'])
    backend = 'gl2' if receipt['target'] == 'macos-arm64' else 'angle2'
    assert receipt['rendererSHA256'] == digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes())
    assert receipt['inputs'] == inputs(accepted), 'Source/font/asset mismatch'
    if role == 'normal-game':
        commands = receipt['commands']
        assert [command['name'] for command in commands] == ['compile', 'lint', 'run', 'run']
        assert all(command['exitCode'] == 0 and not command['timedOut'] and not command['outputLimited'] for command in commands)
        assert receipt['sdkProcesses'] == 4
        assert receipt['confirmedSDKProcesses'] == 4 and receipt['uncertainSDKProcesses'] == 0
        assert all(command['started'] is True and command['charged'] == 1 and command['uncertainStart'] is False and command['cleanupComplete'] is True for command in commands)
    else:
        assert receipt['sdkCliProcesses'] == 3 and receipt['helperSessions'] == 1
        assert len(receipt['coreTestSHA256']) == 64
        accounting = receipt['helperStartAccounting']
        assert accounting['ownerStarts'] == accounting['ownerReturns'] == accounting['confirmed'] == accounting['charged'] == 1
        assert accounting['unconfirmed'] == 0 and accounting['uncertain'] is False
        assert len(receipt['caseStatuses']) == len(MATRIX) and all(case['status'] == 'passed' for case in receipt['caseStatuses'])
        shutdown = receipt['shutdown']
        assert shutdown['cooperative'] and shutdown['cleanupComplete'] and shutdown['exitCode'] == 0
    records = receipt['records']
    assert len(records) == len(MATRIX)
    by_key = {(row['screen'], *row['aspect'], row['state']): row for row in records}
    assert set(by_key) == set(MATRIX), 'Missing/duplicate capture'
    cases = {key(case): case for case in accepted['cases']}
    for case_key, row in by_key.items():
        screen, width, height, state = case_key
        assert row['inputs'] == inputs(accepted) and row['revision'] == inputs(accepted)[SOURCE_PATH]
        assert row['renderer'] == backend and row['physical'] == [width, height]
        assert math.isfinite(row['drawPerVirtual']) and row['drawPerVirtual'] > 0 and row['guidesExcluded'] is True
        if role == 'normal-game':
            assert row['sdkVersion'] == '8.5.3.26051504'
        assert row['filename'] == name(case_key) + '.png'
        assert digest((root / row['filename']).read_bytes()) == row['imageSHA256']
        with Image.open(root / row['filename']) as image:
            image = image.convert('RGBA')
            assert image.size == (width, height) and image.getbbox(), 'Blank or wrong-size capture'
            assert any(low != high for low, high in image.getextrema()), 'Uniform frame is not composition evidence'
        # Both fixtures give IDs to every inner node, including their fixed/vbox group.
        source_nodes = cases[case_key]['plan']['nodes']
        expected_starts = {n['start'] for n in source_nodes[2:]}
        boxes = row['geometry']
        assert len(boxes) == len(expected_starts) and {b['start'] for b in boxes} == expected_starts
        assert all(all(isinstance(b[k], (int, float)) and math.isfinite(b[k]) for k in ('x', 'y', 'width', 'height')) and b['width'] > 0 and b['height'] > 0 for b in boxes)
    return receipt, by_key


def compare(helper, normal, output, *, expected_candidate, core_test):
    helper, normal, output = Path(helper), Path(normal), Path(output)
    accepted_bytes = (helper / 'accepted.json').read_bytes()
    assert accepted_bytes == (normal / 'accepted.json').read_bytes(), 'Different source snapshots'
    accepted = validate_accepted(json.loads(accepted_bytes))
    h, helpers = validate_capture_set(helper, accepted, 'hidden-helper')
    r, references = validate_capture_set(normal, accepted, 'normal-game')
    assert h['target'] == r['target']
    assert h['candidate'] == r['candidate'] == expected_candidate, 'Wrong reviewed candidate'
    assert h['coreTestSHA256'] == digest(Path(core_test).read_bytes()), 'Wrong designated core executable'
    output.mkdir(parents=True, exist_ok=False)
    rows = []
    for case_key in MATRIX:
        a, b = helpers[case_key], references[case_key]
        assert a['drawPerVirtual'] == b['drawPerVirtual']
        geometry_matches = sorted(a['geometry'], key=lambda box: box['start']) == sorted(b['geometry'], key=lambda box: box['start'])
        with Image.open(helper / a['filename']) as image:
            left = image.convert('RGBA')
        with Image.open(normal / b['filename']) as image:
            right = image.convert('RGBA')
        difference = ImageChops.difference(left, right)
        maximum = difference.getchannel('R')
        for channel in 'GBA':
            maximum = ImageChops.lighter(maximum, difference.getchannel(channel))
        pixels = sum(maximum.histogram()[1:])
        maximum.save(output / ('difference-' + name(case_key) + '.png'))
        rows.append(dict(screen=case_key[0], aspect=list(case_key[1:3]), state=case_key[3],
                         geometryMatches=geometry_matches, helperGeometry=a['geometry'], referenceGeometry=b['geometry'],
                         differingPixels=pixels, bounds=maximum.getbbox(), maxChannelDelta=maximum.getextrema()[1]))
    for screen in SCREENS:
        for width, height in ASPECTS:
            for captures in (helpers, references):
                assert captures[(screen, width, height, 'normal')]['imageSHA256'] != captures[(screen, width, height, 'hover')]['imageSHA256'], 'Hover did not change'
    result = dict(outcome=OUTCOME, target=h['target'], candidate=h['candidate'], tolerance=0,
                  passed=all(row['differingPixels'] == 0 and row['geometryMatches'] for row in rows), records=rows)
    (output / 'comparison.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    assert result['passed'], 'Visible differences require diagnosis; no tolerance is accepted'
    return result
