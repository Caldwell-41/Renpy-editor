"""L20 accepted-source admission and exact comparison. Starts no processes."""
import json
import math
from pathlib import Path

from PIL import Image
from base_help_fidelity import digest
from fidelity_comparison import ASPECTS, FIXTURE_ROOT, REPO, compare_receipts, inputs, validate_receipt

SOURCE = 'game/ui/sample_fidelity.rpy'
OUTCOME = 'L20-sample-fidelity'
STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
CASES = tuple((state, state, '7') for state in STATES) + (
    ('defaults', 'normal', None), ('minimum', 'normal', '-5'), ('maximum', 'normal', '15'),
    ('above', 'normal', '99'), ('below', 'normal', '-9223372036854775808'))
BAR_STATE_COLORS = {'hover_left_bar': '#3c9c58', 'hover_thumb': '#ffffff', 'selected_left_bar': '#a07828',
                    'selected_thumb': '#ffd060', 'insensitive_left_bar': '#555555'}
SAMPLE_STRING = "[__import__('os').system('never')] {b}literal{/b}"


def assets():
    # The same synthetic six-state images the core exporter imports, read independently of exported plans.
    states = FIXTURE_ROOT / 'control-states'
    return {'game/fonts/sample_font.ttf': (FIXTURE_ROOT / 'fonts/SourceSans3-Regular.ttf').read_bytes(),
            **{f'game/images/ui sample_state_{i}.png': (states / f'state_{i}.png').read_bytes() for i in range(6)}}


def validate_matrix(cases):
    assert len(cases) == len(CASES) * len(ASPECTS)
    expected = {(w, h, name, state) for w, h in ASPECTS for name, state, _ in CASES}
    actual = [(row['request']['width'], row['request']['height'], row['id'], row['state']) for row in cases]
    assert len(set(actual)) == len(actual) and set(actual) == expected
    assert all(row['request']['buttonState'] == row['state'] for row in cases)


def validate_accepted(accepted):
    assert accepted['outcome'] == OUTCOME and accepted['publicCoreRequests'] is True
    assert accepted['sourceMapSchemaVersion'] in (8, 9, 10, 11, 12, 13, 14)
    assert accepted['exporterSourceSHA256'] == digest((REPO / 'app/src-core/src/screens/sample_fidelity_tests.rs').read_bytes())
    files = accepted['files']
    project = json.loads(files['.renpy-editor/project.json']['text'])
    scenes = {row['sourcePath'] for row in project['scenes']}
    assert set(files) == scenes | {SOURCE, '.renpy-editor/project.json', '.renpy-editor/source-map.json', '.renpy-editor/authoring.json', 'game/definitions/variables.rpy', 'game/definitions/characters.rpy'}
    for row in files.values():
        assert digest(row['text'].encode()) == row['sha256']
    metadata = json.loads(files['.renpy-editor/source-map.json']['text'])
    assert metadata['schemaVersion'] == accepted['sourceMapSchemaVersion']
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
        assert nodes[4]['literal'] == f"Local {score or '0'} coins"
        assert nodes[7]['properties']['value'] == max(-5, min(15, int(score or '0'))) + 5
        assert {k: v for k, v in nodes[7]['properties'].items() if k.startswith(('hover_', 'selected_', 'insensitive_'))} == BAR_STATE_COLORS
        assert nodes[7]['properties']['range'] == 20
        assert not any({'action', 'hovered', 'unhovered'} & n['properties'].keys() for n in nodes)
        assert [w['start'] for w in case['widgets']] == [n['start'] for n in nodes[1:]]
        assert [w['widgetId'] for w in case['widgets']] == ['stage', 'numbers', 'caption', 'local_button', 'shared_button', 'image_button', 'score_bar']
    return accepted


def validate_captures(root, accepted, role):
    root = Path(root)
    receipt = validate_receipt(root, accepted, role, OUTCOME)
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
    return compare_receipts(helper, normal, output, outcome=OUTCOME, admit=validate_accepted, captures=validate_captures,
                            label=lambda row: dict(id=row['id'], state=row['state']),
                            expected_candidate=expected_candidate, core_test=core_test)
