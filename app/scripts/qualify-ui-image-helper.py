"""Verify retained inert-helper images against independent literal references."""
import base64
import hashlib
import json
from pathlib import Path
import sys
from PIL import Image, ImageChops
from io import BytesIO


def validate(directory):
    directory = Path(directory)
    receipt = json.loads((directory / 'result.json').read_text())
    assert receipt['passed'] is True and receipt['typedPending'] is True
    assert receipt['sdkProcesses'] == receipt['helperSessions'] == 1
    assert receipt['shutdown']['cleanupComplete'] is True
    records = []
    for width, height in [(1280, 720), (1024, 768)]:
        images = []
        hashes = []
        for prefix in ['images', 'reference']:
            frame = json.loads((directory / f'{prefix}-{width}x{height}.json').read_text())
            assert frame['phase'] == 'ready' and frame['width'] == width and frame['height'] == height
            data = base64.b64decode(frame['image'].removeprefix('data:image/png;base64,'), validate=True)
            image = Image.open(BytesIO(data)).convert('RGBA')
            assert image.size == (width, height)
            images.append(image)
            hashes.append(hashlib.sha256(data).hexdigest())
            (directory / f'{prefix}-{width}x{height}.png').write_bytes(data)
        assert ImageChops.difference(*images).getextrema() == ((0, 0),) * 4
        # Distinct fixture quadrants must be present. Equal blank references cannot pass.
        for x, y, w, h in [(20,20,120,60),(180,20,96,48),(340,20,160,80),(540,20,128,64),(720,20,80,40),(20,160,120,90)]:
            samples = [images[0].getpixel((x+int(w*fx), y+int(h*fy))) for fy in (.25,.75) for fx in (.25,.75)]
            assert len(set(samples)) == 4 and all(pixel[3] > 0 for pixel in samples)
        records.append(dict(aspect=[width,height],imageSHA256=hashes[0],referenceSHA256=hashes[1],differentPixels=0))
    return dict(passed=True, records=records, acceptedSHA256=receipt['acceptedSHA256'])


if __name__ == '__main__':
    result = validate(sys.argv[1])
    Path(sys.argv[1], 'pixels.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result))
