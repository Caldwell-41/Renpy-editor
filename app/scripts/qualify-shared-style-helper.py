"""Compare inert shared-style helper output with independent normal SDK references."""
import base64
import hashlib
from io import BytesIO
import json
from pathlib import Path
import shutil
import sys
import tempfile
from PIL import Image, ImageChops

STATES = ['normal', 'hover', 'selected', 'disabled']
ASPECTS = [(1280, 720), (1024, 768)]


def validate(directory, normal):
    directory, normal = Path(directory), Path(normal)
    receipt = json.loads((directory / 'result.json').read_text())
    sdk = json.loads((normal / 'result.json').read_text())
    assert receipt['passed'] is True and sdk['passed'] is True
    assert receipt['helperSessions'] == len(receipt['shutdowns']) == 1
    assert receipt['pendingMatchesAccepted'] is True
    assert len(receipt['records']) == 32 and len(sdk['records']) == 16
    assert all(row['cleanupComplete'] and row['cooperative'] and row['exitCode'] == 0 for row in receipt['shutdowns'])
    helper_source = (directory / 'accepted.json').read_bytes()
    normal_source = (normal / 'accepted.json').read_bytes()
    assert helper_source == normal_source, (
        'Accepted source snapshots differ',
        dict(helperSHA256=hashlib.sha256(helper_source).hexdigest(),
             normalSHA256=hashlib.sha256(normal_source).hexdigest()))
    accepted = json.loads((directory / 'accepted.json').read_text()); rows = []
    for stage in ['shared', 'independent']:
        for width, height in ASPECTS:
            for state in STATES:
                standard = [r for r in sdk['records'] if r['stage'] == stage and r['aspect'] == [width, height] and r['state'] == state]
                assert len(standard) == 1
                for screen, reference in [('notes', 'style_reference'), ('about', 'style_other_reference')]:
                    name = f'{stage}-{width}x{height}-{state}-{screen}'
                    frame = json.loads((directory / f'{name}.json').read_text())
                    assert frame['phase'] == 'ready' and frame['buttonState'] == state
                    assert [frame['width'], frame['height']] == [width, height]
                    assert frame['revision'] == accepted['stages'][stage][f'game/ui/{screen}.rpy']['sha256']
                    assert frame['diagnostics']['physical'] == standard[0]['physical']
                    assert frame['diagnostics']['drawPerVirtual'] == standard[0]['drawPerVirtual']
                    raw = base64.b64decode(frame['image'].removeprefix('data:image/png;base64,'), validate=True)
                    image = Image.open(BytesIO(raw)).convert('RGBA')
                    assert image.size == (width, height) and image.getbbox(), 'Missing or blank frame'
                    expected = Image.open(normal / f'{stage}-{width}x{height}-{state}-{reference}.png').convert('RGBA')
                    assert ImageChops.difference(image, expected).getextrema() == ((0, 0),) * 4, (name, 'helper differs from literal SDK output')
                    (directory / f'{name}.png').write_bytes(raw)
                    rows.append(dict(stage=stage, aspect=[width, height], state=state, screen=screen, differingPixels=0))
    return dict(passed=True, records=rows)


def audit_rejections(directory, normal):
    faults = ['different-source-snapshot', 'missing-frame', 'wrong-source', 'wrong-state', 'blank-frame']
    for fault in faults:
        with tempfile.TemporaryDirectory(prefix='loomlight-style-gate-') as temporary:
            root = Path(temporary) / 'helper'; shutil.copytree(directory, root)
            path = root / 'shared-1280x720-normal-notes.json'
            if fault == 'different-source-snapshot':
                manifest = root / 'accepted.json'
                accepted = json.loads(manifest.read_text())
                accepted['assets'][0]['id'] = '00000000-0000-4000-8000-000000000000'
                manifest.write_text(json.dumps(accepted))
            elif fault == 'missing-frame':
                path.unlink()
            else:
                frame = json.loads(path.read_text())
                if fault == 'wrong-source':
                    frame['revision'] = '0' * 64
                elif fault == 'wrong-state':
                    frame['buttonState'] = 'hover'
                else:
                    buffer = BytesIO(); Image.new('RGBA', (1280, 720)).save(buffer, format='PNG')
                    frame['image'] = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
                path.write_text(json.dumps(frame))
            try:
                validate(root, normal)
            except (AssertionError, KeyError, FileNotFoundError):
                pass
            else:
                raise AssertionError(f'The gate admitted {fault}')
    return faults

if __name__ == '__main__':
    result = validate(sys.argv[1], sys.argv[2])
    if '--audit-rejections' in sys.argv[3:]:
        result['rejectedFaults'] = audit_rejections(sys.argv[1], sys.argv[2])
    Path(sys.argv[1], 'comparison.json').write_text(json.dumps(result, indent=2) + '\n')
    print('PASS 32 helper/literal SDK comparisons; zero differing pixels.')
