"""Offline exact-frame comparison checks shared by canvas proofs. No SDK starts."""
from pathlib import Path
import tempfile
import unittest

from PIL import Image
import fidelity_comparison


class FrameComparison(unittest.TestCase):
    def test_exact_comparison_rejects_alpha_only_and_geometry_differences(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            Image.new('RGBA', (4, 3), (20, 30, 40, 255)).save(root / 'a.png')
            Image.new('RGBA', (4, 3), (20, 30, 40, 254)).save(root / 'b.png')
            row = fidelity_comparison.compare_frame(root / 'a.png', root / 'b.png', [], [], root / 'diff.png')
            self.assertEqual(row['differingPixels'], 12)
            self.assertEqual(row['maxChannelDelta'], 1)
            row = fidelity_comparison.compare_frame(root / 'a.png', root / 'a.png', [dict(x=2)], [dict(x=3)], root / 'geometry.png')
            self.assertEqual(row['differingPixels'], 0)
            self.assertFalse(row['geometryMatches'])


if __name__ == '__main__':
    unittest.main()
