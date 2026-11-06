"""Exact rendered-pixel and hit-region comparison shared by canvas proofs."""
from PIL import Image, ImageChops


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
