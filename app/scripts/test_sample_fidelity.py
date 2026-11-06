"""Offline L20 admission and exact-frame rejection checks. No SDK starts."""
import ast
import copy
from pathlib import Path
import tempfile
import textwrap
from types import SimpleNamespace
import unittest

from PIL import Image
import sample_fidelity as fidelity


class SampleFidelityGates(unittest.TestCase):
    def test_normal_game_observer_applies_each_typed_sample_without_evaluating_strings(self):
        source = (fidelity.FIXTURE_ROOT / 'sample-fidelity-proof.rpy').read_text(encoding='utf-8')
        python = textwrap.dedent(source.split('init python:\n', 1)[1].split('screen sample_fidelity_capture():')[0])
        ast.parse(python)
        calls = []
        store = SimpleNamespace()
        namespace = dict(SAMPLE_CASES=[dict(values=dict(sample_score=7, flag=False, sample_caption=fidelity.SAMPLE_STRING)),
                                      dict(values=dict(sample_score=-5, flag=True, sample_caption='Default café'))],
                         renpy=SimpleNamespace(store=store, show_screen=lambda name: calls.append(name),
                                               restart_interaction=lambda: calls.append('restart'),
                                               quit=lambda **kw: calls.append(kw)))
        exec(compile(python, '<trusted normal fixture observer>', 'exec'), namespace)
        namespace['_sample_advance']()
        self.assertEqual(vars(store), namespace['SAMPLE_CASES'][0]['values'])
        namespace['_sample_advance']()
        self.assertEqual(vars(store), namespace['SAMPLE_CASES'][1]['values'])
        namespace['_sample_advance']()
        self.assertEqual(calls, ['sample_fidelity', 'restart', 'sample_fidelity', 'restart', dict(status=0, save=False)])

    def test_exact_comparison_rejects_alpha_only_and_geometry_differences(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            Image.new('RGBA', (4, 3), (20, 30, 40, 255)).save(root / 'a.png')
            Image.new('RGBA', (4, 3), (20, 30, 40, 254)).save(root / 'b.png')
            row = fidelity.compare_frame(root / 'a.png', root / 'b.png', [], [], root / 'diff.png')
            self.assertEqual(row['differingPixels'], 12)
            self.assertEqual(row['maxChannelDelta'], 1)
            row = fidelity.compare_frame(root / 'a.png', root / 'a.png', [dict(x=2)], [dict(x=3)], root / 'geometry.png')
            self.assertEqual(row['differingPixels'], 0)
            self.assertFalse(row['geometryMatches'])

    def test_case_matrix_rejects_missing_duplicate_or_wrong_samples(self):
        cases = [dict(id=name, state=state, request=dict(width=w, height=h, buttonState=state))
                 for w, h in fidelity.ASPECTS for name, state, _ in fidelity.CASES]
        fidelity.validate_matrix(cases)
        for mutate in (lambda rows: rows.pop(), lambda rows: rows.__setitem__(1, rows[0]),
                       lambda rows: rows[0]['request'].__setitem__('buttonState', 'disabled')):
            bad = copy.deepcopy(cases)
            mutate(bad)
            with self.assertRaises(AssertionError):
                fidelity.validate_matrix(bad)

if __name__ == '__main__':
    unittest.main()
