import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('project_font', Path(__file__).with_name('qualify-project-font.py'))
proof = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proof)


class ProjectFontEvidence(unittest.TestCase):
    def test_missing_wrong_font_and_unwrapped_text_fail_the_gate(self):
        good = dict(aspect=[1280, 720], sdkVersion='8.5.3.26051504', renderer='gl2',
                    rectangles={name: [row['x'], row['y'], row['width'], 100] for name, row in proof.EXPECTED.items()},
                    referenceRectangles={name: [row['x'], row['y'], row['width'], 100] for name, row in proof.EXPECTED.items()},
                    fonts={name: row['font'] for name, row in proof.EXPECTED.items()})
        proof.validate(good, (1280, 720))
        import copy
        for change in ['missing', 'wrong-font', 'unwrapped', 'wrong-position', 'overwide']:
            bad = copy.deepcopy(good)
            if change == 'missing': bad.pop('fonts')
            elif change == 'wrong-font': bad['fonts']['body'] = 'DejaVuSans.ttf'
            elif change == 'unwrapped': bad['rectangles']['body'][3] = 26
            elif change == 'wrong-position': bad['rectangles']['body'][0] = 99
            else:
                bad['rectangles']['body'][2] = 301
                bad['referenceRectangles']['body'][2] = 301
            with self.assertRaises((AssertionError, KeyError), msg=change):
                proof.validate(bad, (1280, 720))


if __name__ == '__main__':
    unittest.main()
