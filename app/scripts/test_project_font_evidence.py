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


class ProjectFontNativeEvidence(unittest.TestCase):
    def test_requires_native_decode_history_source_and_reopen(self):
        import copy
        from runtime_probe_cases import runtime_report_ok, RUNTIME_STAGES
        from uuid import UUID
        ids = [str(UUID(int=i)) for i in (1, 2)]
        owner = dict(id=str(UUID(int=3)), rootId=ids[0], name='travel_notes', path='game/ui/travel_notes.rpy', resolved=True)
        source = f'# loomlight-screen: {owner["id"]}\n' + 'screen travel_notes():\n' + f' text "Route": # loomlight-element: {ids[1]}\n'
        source += '  font "fonts/help_otf.otf"\n  size 38\n  color "#f1e9d6"\n  text_align 0.5\n  bold True\n  italic True\n use source_only_footer()\n text "Protected neighbor"'
        report = dict(evidence='runtime-ui-packaged', case='project-font', passed=True, cleanupComplete=True, details=dict(
            scenario='project-font', stage='complete', stages=[dict(stage=s) for s in (*RUNTIME_STAGES['project-font'], 'complete')],
            identity=owner, identities=ids, nativeWebView=True, sdkExecuted=False, fontDecoded=True, fontFormats=['ttf', 'otf'], acceptedSource=source))
        self.assertTrue(runtime_report_ok('project-font', report))
        for field, value in [('fontDecoded', False), ('fontFormats', ['ttf']), ('nativeWebView', False), ('sdkExecuted', True), ('acceptedSource', ''), ('stages', []), ('identity', None), ('identities', [])]:
            bad = copy.deepcopy(report); bad['details'][field] = value
            self.assertFalse(runtime_report_ok('project-font', bad), field)


if __name__ == '__main__':
    unittest.main()
