"""Receipt admission and exact pixel/hit-region comparison shared by canvas proofs."""
import json
from pathlib import Path

from PIL import Image, ImageChops
from base_help_fidelity import digest

REPO = Path(__file__).resolve().parents[2]
FIXTURE_ROOT = REPO / 'tests/fixtures/phase-3b-screens'
ASPECTS = ((1280, 720), (1024, 768))


def inputs(accepted):
    return {**{path: row['sha256'] for path, row in accepted['files'].items()},
            **{row['relativePath']: row['sha256'] for row in accepted['assets']}}


def compare_frame(helper, normal, helper_geometry, reference_geometry, difference_path):
    with Image.open(helper) as left, Image.open(normal) as right:
        assert left.size == right.size, 'Different capture dimensions'
        difference = ImageChops.difference(left.convert('RGBA'), right.convert('RGBA'))
    maximum = difference.getchannel('R')
    for channel in 'GBA':
        maximum = ImageChops.lighter(maximum, difference.getchannel(channel))
    maximum.save(difference_path)
    return dict(differingPixels=sum(maximum.histogram()[1:]), bounds=maximum.getbbox(),
                maxChannelDelta=maximum.getextrema()[1], geometryMatches=helper_geometry == reference_geometry,
                helperGeometry=helper_geometry, referenceGeometry=reference_geometry)


def validate_receipt(root, accepted, role, outcome):
    """Checks a producer receipt. Callers check their own capture records."""
    root = Path(root)
    receipt = json.loads((root / 'result.json').read_text(encoding='utf-8'))
    assert receipt['outcome'] == outcome and receipt['role'] == role
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
        assert len(receipt['caseStatuses']) == len(accepted['cases']) and all(row['status'] == 'passed' for row in receipt['caseStatuses'])
        assert receipt['helperStartAccounting'] == dict(ownerStarts=1, ownerReturns=1, confirmed=1, charged=1, uncertain=False)
        shutdown = receipt['shutdown']
        assert shutdown['cooperative'] is True and shutdown['cleanupComplete'] is True and shutdown['exitCode'] == 0
    return receipt


def compare_receipts(helper, normal, output, *, outcome, admit, captures, label, expected_candidate, core_test):
    """Pairs helper and normal-game records by aspect plus `label(record)` and requires exact frames."""
    helper, normal, output = Path(helper), Path(normal), Path(output)
    raw = (helper / 'accepted.json').read_bytes()
    assert raw == (normal / 'accepted.json').read_bytes(), 'Different accepted sources'
    accepted = admit(json.loads(raw))
    h, n = captures(helper, accepted, 'hidden-helper'), captures(normal, accepted, 'normal-game')
    assert h['candidate'] == n['candidate'] == expected_candidate and h['target'] == n['target']
    assert h['coreTestSHA256'] == digest(Path(core_test).read_bytes())
    output.mkdir(parents=True, exist_ok=False)

    def key(row):
        return (tuple(row['aspect']), *label(row).values())

    reference = {key(row): row for row in n['records']}
    rows = []
    for a in h['records']:
        b = reference[key(a)]
        assert a['drawPerVirtual'] == b['drawPerVirtual']
        rows.append(dict(aspect=list(a['aspect']), **label(a), **compare_frame(
            helper / a['filename'], normal / b['filename'], a['geometry'], b['geometry'],
            output / ('difference-' + a['filename']))))
    result = dict(outcome=outcome, candidate=expected_candidate, target=h['target'], tolerance=0, records=rows,
                  passed=all(row['differingPixels'] == 0 and row['geometryMatches'] for row in rows))
    (output / 'comparison.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    assert result['passed'], 'Rendering differences require diagnosis; no tolerance is accepted'
    return result
