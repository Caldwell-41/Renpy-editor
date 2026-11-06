"""L20 accepted-source admission and exact comparison. Starts no processes."""
import base64
import json
import math
from pathlib import Path
import re

from PIL import Image
from base_help_fidelity import digest
from fidelity_comparison import compare_frame

REPO = Path(__file__).resolve().parents[2]
FIXTURE_ROOT = REPO / 'tests/fixtures/phase-3b-screens'
SOURCE = 'game/ui/sample_fidelity.rpy'
OUTCOME = 'L20-sample-fidelity'
ASPECTS = ((1280, 720), (1024, 768))
STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
CASES = tuple((state, state, '7') for state in STATES) + (
    ('defaults', 'normal', None), ('minimum', 'normal', '-5'), ('maximum', 'normal', '15'),
    ('above', 'normal', '99'), ('below', 'normal', '-9223372036854775808'))
SAMPLE_STRING = "[__import__('os').system('never')] {b}literal{/b}"


def assets():
    # Reuse the existing synthetic six-state images, independent of exported plans.
    declaration = (REPO / 'app/src-core/src/screens/control_tests.rs').read_text(encoding='utf-8').split('STATE_PNGS:', 1)[1].split('];', 1)[0]
    images = re.findall(r'"([A-Za-z0-9+/=]+)"', declaration)
    assert len(images) == 6
    return {'game/fonts/sample_font.ttf': (FIXTURE_ROOT / 'fonts/SourceSans3-Regular.ttf').read_bytes(),
            **{f'game/images/ui sample_state_{i}.png': base64.b64decode(raw, validate=True) for i, raw in enumerate(images)}}


def inputs(accepted):
    return {**{path: row['sha256'] for path, row in accepted['files'].items()},
            **{row['relativePath']: row['sha256'] for row in accepted['assets']}}


def validate_matrix(cases):
    assert len(cases) == len(CASES) * len(ASPECTS)
    expected = {(w, h, name, state) for w, h in ASPECTS for name, state, _ in CASES}
    actual = [(row['request']['width'], row['request']['height'], row['id'], row['state']) for row in cases]
    assert len(set(actual)) == len(actual) and set(actual) == expected
    assert all(row['request']['buttonState'] == row['state'] for row in cases)


def validate_accepted(accepted):
    assert accepted['outcome'] == OUTCOME and accepted['publicCoreRequests'] is True
    assert accepted['sourceMapSchemaVersion'] == 8
    assert accepted['exporterSourceSHA256'] == digest((REPO / 'app/src-core/src/screens/sample_fidelity_tests.rs').read_bytes())
    files = accepted['files']
    project = json.loads(files['.renpy-editor/project.json']['text'])
    scenes = {row['sourcePath'] for row in project['scenes']}
    assert set(files) == scenes | {SOURCE, '.renpy-editor/project.json', '.renpy-editor/source-map.json', '.renpy-editor/authoring.json', 'game/definitions/variables.rpy', 'game/definitions/characters.rpy'}
    for row in files.values():
        assert digest(row['text'].encode()) == row['sha256']
    metadata = json.loads(files['.renpy-editor/source-map.json']['text'])
    assert metadata['schemaVersion'] == 8
    owner = next(o for o in metadata['ownedScreens'] if o['path'] == SOURCE)
    expected_source = (FIXTURE_ROOT / 'sample-fidelity.rpy').read_text(encoding='utf-8').replace('screen ', '# loomlight-screen: ' + owner['id'] + '\nscreen ', 1)
    assert files[SOURCE]['text'] == expected_source
    expected_assets = assets()
    assert len(accepted['assets']) == 7
    assert {a['relativePath']: a['sha256'] for a in accepted['assets']} == {path: digest(raw) for path, raw in expected_assets.items()}
    variables = json.loads(files['.renpy-editor/authoring.json']['text'])['variables']
    assert {v['technicalName']: (v['variableType'], v['defaultValue']) for v in variables} == {
        'flag': ('bool', True), 'sample_score': ('int', '0'), 'sample_caption': ('string', 'Default café')}
    validate_matrix(accepted['cases'])
    for case in accepted['cases']:
        request, plan = case['request'], case['plan']
        score = next(score for name, _, score in CASES if name == case['id'])
        assert case['screen'] == request['screenName'] == 'sample_fidelity' and request['path'] == SOURCE
        assert request['expectedRevision'] == plan['revision'] == files[SOURCE]['sha256']
        assert plan['available'] is True and plan['limits'] == []
        assert (plan['width'], plan['height'], plan['buttonState']) == (request['width'], request['height'], case['state'])
        expected_samples = [] if score is None else [dict(variableId=v['id'], expectedSourceRevision=v['source']['sourceRevision'],
            value={'flag': False, 'sample_score': score, 'sample_caption': SAMPLE_STRING}[v['technicalName']]) for v in variables]
        assert request['variableSamples'] == expected_samples
        nodes = plan['nodes']
        assert [n['kind'] for n in nodes] == ['screen', 'fixed', 'text', 'text', 'textbutton', 'textbutton', 'imagebutton', 'bar']
        assert nodes[2]['literal'] == f"Score {score or '0'} / {'True' if score is None else 'False'}"
        assert nodes[3]['literal'] == ('Default café' if score is None else SAMPLE_STRING.replace('{', '{{'))
        assert nodes[7]['properties']['value'] == max(-5, min(15, int(score or '0'))) + 5
        assert nodes[7]['properties']['range'] == 20
        assert not any({'action', 'hovered', 'unhovered'} & n['properties'].keys() for n in nodes)
        assert [w['start'] for w in case['widgets']] == [n['start'] for n in nodes[1:]]
        assert [w['widgetId'] for w in case['widgets']] == ['stage', 'numbers', 'caption', 'local_button', 'shared_button', 'image_button', 'score_bar']
    return accepted


def validate_captures(root, accepted, role):
    root = Path(root)
    receipt = json.loads((root / 'result.json').read_text(encoding='utf-8'))
    assert receipt['outcome'] == OUTCOME and receipt['role'] == role
    assert receipt['passed'] is True and receipt['sourceUnchanged'] is True and receipt['cleanupComplete'] is True
    assert receipt['acceptedSHA256'] == digest((root / 'accepted.json').read_bytes())
    assert receipt['inputs'] == inputs(accepted)
    assert receipt['target'] in ('macos-arm64', 'windows-x64')
    assert receipt['rendererSHA256'] == digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes())
    if role == 'normal-game':
        assert [r['name'] for r in receipt['commands']] == ['compile', 'lint', 'run', 'run']
        assert receipt['sdkProcesses'] == receipt['confirmedSDKProcesses'] == 4 and receipt['uncertainSDKProcesses'] == 0
        assert all(r['started'] is True and r['exitCode'] == 0 and r['cleanupComplete'] is True and not r['uncertainStart'] and not r['timedOut'] and not r['outputLimited'] for r in receipt['commands'])
    else:
        assert receipt['sdkCliProcesses'] == 3 and receipt['helperSessions'] == 1
        assert len(receipt['caseStatuses']) == len(accepted['cases']) and all(r['status'] == 'passed' for r in receipt['caseStatuses'])
        assert receipt['helperStartAccounting'] == dict(ownerStarts=1, ownerReturns=1, confirmed=1, charged=1, uncertain=False)
        assert receipt['shutdown']['cooperative'] is True and receipt['shutdown']['cleanupComplete'] is True and receipt['shutdown']['exitCode'] == 0
    records = receipt['records']
    assert len(records) == len(accepted['cases'])
    keyed = {(tuple(r['aspect']), r['id']): r for r in records}
    assert len(keyed) == len(records)
    for case in accepted['cases']:
        aspect = (case['request']['width'], case['request']['height'])
        row = keyed[(aspect, case['id'])]
        assert row['screen'] == case['screen'] and row['state'] == case['state']
        assert row['revision'] == accepted['files'][SOURCE]['sha256'] and row['inputs'] == inputs(accepted)
        assert row['guidesExcluded'] is True and row['physical'] == list(aspect)
        assert row['renderer'] == ('gl2' if receipt['target'] == 'macos-arm64' else 'angle2')
        assert math.isfinite(row['drawPerVirtual']) and row['drawPerVirtual'] > 0
        assert row['filename'] == f"sample_fidelity-{aspect[0]}x{aspect[1]}-{case['id']}.png"
        assert row['imageSHA256'] == digest((root / row['filename']).read_bytes())
        with Image.open(root / row['filename']) as image:
            assert image.size == aspect and any(lo != hi for lo, hi in image.convert('RGBA').getextrema())
        assert [r['start'] for r in row['geometry']] == [w['start'] for w in case['widgets']]
        assert all(all(isinstance(box[k], (int, float)) and math.isfinite(box[k]) for k in ('x', 'y', 'width', 'height')) and box['width'] > 0 and box['height'] > 0 for box in row['geometry'])
        if role == 'normal-game':
            assert row['sdkVersion'] == '8.5.3.26051504'
    # Real state and value changes must affect the observed pixels; aliased frames refuse.
    for aspect in ASPECTS:
        assert len({keyed[(aspect, state)]['imageSHA256'] for state in STATES}) == len(STATES)
        assert len({keyed[(aspect, name)]['imageSHA256'] for name, _, _ in CASES}) == len(CASES)
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
    reference = {(tuple(r['aspect']), r['id']): r for r in n['records']}
    rows = []
    for a in h['records']:
        b = reference[(tuple(a['aspect']), a['id'])]
        assert a['drawPerVirtual'] == b['drawPerVirtual']
        rows.append(dict(aspect=a['aspect'], id=a['id'], state=a['state'], **compare_frame(
            helper / a['filename'], normal / b['filename'], a['geometry'], b['geometry'], output / ('difference-' + a['filename']))))
    result = dict(outcome=OUTCOME, candidate=expected_candidate, target=h['target'], tolerance=0, records=rows,
                  passed=all(r['differingPixels'] == 0 and r['geometryMatches'] for r in rows))
    (output / 'comparison.json').write_text(json.dumps(result, indent=2) + '\n')
    assert result['passed'], 'Rendering differences require diagnosis; no tolerance is accepted'
    return result
