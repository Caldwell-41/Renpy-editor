"""Compare actual helper font frames with the qualified normal-entry reference."""
import base64
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
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


if __name__ == '__main__':
    result = validate(sys.argv[1], sys.argv[2])
    Path(sys.argv[1], 'pixels.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
