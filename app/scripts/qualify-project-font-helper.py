"""Compare actual helper font frames with the qualified normal-entry reference."""
import base64
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
import shutil
import tempfile
from PIL import Image, ImageChops


def validate(directory, normal):
    directory, normal = Path(directory), Path(normal)
    receipt = json.loads((directory / 'result.json').read_text())
    sdk = json.loads((normal / 'result.json').read_text())
    assert receipt['passed'] is True and sdk['passed'] is True
    assert receipt['typedPending'] is True and receipt['pendingMatchesAccepted'] is True
    assert receipt['helperSessions'] == 1
    assert receipt['shutdown']['cleanupComplete'] is True and receipt['shutdown']['cooperative'] is True
    assert receipt['shutdown']['exitCode'] == 0
    assert len(receipt['records']) == len(sdk['records']) == 2
    records = []
    for index, (width, height) in enumerate([(1280, 720), (1024, 768)]):
        assert receipt['records'][index]['aspect'] == sdk['records'][index]['aspect'] == [width, height]
        assert sdk['records'][index]['sourceSHA256'] == receipt['normalSourceSHA256']
        images, hashes = [], []
        for prefix in ['font', 'reference']:
            frame = json.loads((directory / f'{prefix}-{width}x{height}.json').read_text())
            assert frame['phase'] == 'ready' and [frame['width'], frame['height']] == [width, height]
            physical = frame['diagnostics']['physical']
            assert physical == sdk['records'][index]['physical'], 'Physical capture dimensions differ'
            assert len(physical) == 2 and all(isinstance(value, int) and value > 0 for value in physical)
            assert frame['diagnostics']['drawPerVirtual'] == sdk['records'][index]['drawPerVirtual']
            raw = base64.b64decode(frame['image'].removeprefix('data:image/png;base64,'), validate=True)
            image = Image.open(BytesIO(raw)).convert('RGBA')
            assert image.size == (width, height)
            images.append(image); hashes.append(hashlib.sha256(raw).hexdigest())
            (directory / f'{prefix}-{width}x{height}.png').write_bytes(raw)
        with Image.open(normal / f'reference-{width}x{height}.png') as original:
            assert hashlib.sha256((normal / f'reference-{width}x{height}.png').read_bytes()).hexdigest() == sdk['records'][index]['imageHashes']['reference']
            for image in images:
                assert ImageChops.difference(image, original.convert('RGBA')).getextrema() == ((0, 0),) * 4, 'Helper/normal reference pixels differ'
        assert images[0].getbbox(), 'A blank frame is not font evidence'
        records.append(dict(aspect=[width, height], imageSHA256=hashes[0], referenceSHA256=hashes[1], differingPixels=0))
    return dict(passed=True, records=records, sourceSHA256=receipt['normalSourceSHA256'])


def audit_rejections(directory, normal):
    checked = []
    for fault in ['missing-reference', 'wrong-source', 'wrong-physical', 'wrong-scale', 'blank-frame', 'fallback-font']:
        with tempfile.TemporaryDirectory(prefix='loomlight-font-gate-') as temporary:
            root = Path(temporary) / 'helper'
            shutil.copytree(directory, root)
            if fault == 'missing-reference':
                (root / 'reference-1280x720.json').unlink()
            elif fault == 'wrong-source':
                receipt = json.loads((root / 'result.json').read_text())
                receipt['normalSourceSHA256'] = '0' * 64
                (root / 'result.json').write_text(json.dumps(receipt))
            elif fault in ['wrong-physical', 'wrong-scale']:
                path = root / 'font-1280x720.json'
                frame = json.loads(path.read_text())
                if fault == 'wrong-physical':
                    frame['diagnostics']['physical'][0] += 1
                else:
                    frame['diagnostics']['drawPerVirtual'] += 0.25
                path.write_text(json.dumps(frame))
            else:
                frame = json.loads((root / 'font-1280x720.json').read_text())
                if fault == 'blank-frame':
                    buffer = BytesIO()
                    Image.new('RGBA', (1280, 720), (0, 0, 0, 0)).save(buffer, format='PNG')
                    raw = buffer.getvalue()
                else:
                    raw = (Path(normal) / 'default-1280x720.png').read_bytes()
                frame['image'] = 'data:image/png;base64,' + base64.b64encode(raw).decode()
                (root / 'font-1280x720.json').write_text(json.dumps(frame))
            try:
                validate(root, normal)
            except (AssertionError, KeyError, FileNotFoundError):
                checked.append(fault)
            else:
                raise AssertionError(f'The gate admitted {fault}')
    return checked


if __name__ == '__main__':
    result = validate(sys.argv[1], sys.argv[2])
    if '--audit-rejections' in sys.argv[3:]:
        result['rejectionChecks'] = audit_rejections(sys.argv[1], sys.argv[2])
    Path(sys.argv[1], 'pixels.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
