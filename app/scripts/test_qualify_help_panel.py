"""Cheap evidence admission tests. These never execute Ren'Py."""
import copy
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import contextlib
import io
import textwrap
import unittest
import sys

spec = importlib.util.spec_from_file_location('help_panel_gate', Path(__file__).with_name('qualify-help-panel.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class RuntimeEvidenceTests(unittest.TestCase):
    def receipt(self):
        return dict(schemaVersion=1, sdkVersion='8.5.3', case='show_persists',
                    manifestSHA256='a' * 64, normalEntry=True,
                    acceptedHashes={'game/story.rpy': 'b' * 64},
                    inputs=['advance', 'advance'],
                    observations=[
                        dict(step='baseline', line='HP_BASELINE', panelVisible=False, gameMenu=False, focusedClose=False),
                        dict(step='shown', line='HP_SHOWN_0', panelVisible=True, gameMenu=False, focusedClose=True),
                        dict(step='advance1', line='HP_SHOWN_1', panelVisible=True, gameMenu=False, focusedClose=True),
                        dict(step='advance2', line='HP_SHOWN_2', panelVisible=True, gameMenu=False, focusedClose=True)])

    def log(self, receipt):
        return ('global.help_panel::show_persists\n[rpytest] Status: PASSED\n'
                '[rpytest] Test cases : 1 | 1 passed | 0 xfailed | 0 failed | 0 xpassed | 0 skipped | 0 not run\n'
                '[rpytest] Time: 0.5 s\nHELP_PANEL_OBSERVED ' + json.dumps(receipt))

    def validate(self, log):
        return gate.validate_runtime_output(log, 'show_persists', 'a' * 64, {'game/story.rpy': 'b' * 64})

    def test_runtime_requires_two_real_dialogue_advances_and_exact_accepted_identity(self):
        good = self.receipt()
        self.assertEqual(self.validate(self.log(good)), good)
        for field, value in [('normalEntry', False), ('case', 'authored_hide'),
                             ('manifestSHA256', 'c' * 64), ('acceptedHashes', {}),
                             ('inputs', ['advance']), ('observations', good['observations'][:-1])]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.validate(self.log(dict(good, **{field: value})))
        bad = copy.deepcopy(good)
        bad['observations'][2]['panelVisible'] = False
        with self.assertRaises(ValueError):
            self.validate(self.log(bad))

    def test_runtime_rejects_missing_duplicate_and_incomplete_engine_evidence(self):
        good = self.log(self.receipt())
        for bad in [good.split('HELP_PANEL_OBSERVED')[0], good + '\nHELP_PANEL_OBSERVED ' + json.dumps(self.receipt()),
                    good.replace('1 passed', '0 passed'), good.replace('0 skipped', '1 skipped'),
                    good.replace('Status: PASSED', 'Status: FAILED'), good.replace('0.5 s', '0.0 s'),
                    good.replace('"schemaVersion": 1', '"schemaVersion": 1, "schemaVersion": 1')]:
            with self.subTest(log=bad), self.assertRaises(ValueError):
                self.validate(bad)

    def test_distinct_hide_close_escape_outside_and_keyboard_journeys(self):
        for case, steps, inputs in [
            ('authored_hide', [('beforeHide', 'HP_SHOWN_2', True), ('hidden', 'HP_HIDDEN', False)], ['advance', 'advance', 'advance']),
            ('reshow_close', [('reshown', 'HP_RESHOWN', True), ('closed', 'HP_RESHOWN', False)], ['advance', 'advance', 'advance', 'advance', 'clickClose']),
            ('outside_click', [('outside', 'HP_SHOWN_1', True)], ['clickOutside']),
            ('escape', [('escaped', 'HP_SHOWN_0', False)], ['K_ESCAPE']),
            ('keyboard_close', [('activated', 'HP_SHOWN_0', False)], ['K_RETURN'])]:
            row = self.receipt()
            row.update(case=case, inputs=inputs)
            row['observations'] = row['observations'][:2] + [
                dict(step=step, line=line, panelVisible=visible, gameMenu=False, focusedClose=False)
                for step, line, visible in steps]
            row.update(defaultGameEscape=True, outsidePoint=[0, 0], frameRect=[200, 100, 600, 500])
            log = self.log(row).replace('global.help_panel::show_persists', 'global.help_panel::' + case)
            self.assertEqual(gate.validate_runtime_output(log, case, 'a' * 64, row['acceptedHashes']), row)
            bad = copy.deepcopy(row)
            bad['inputs'][-1] = 'directHideAction'
            with self.assertRaises(ValueError):
                gate.validate_runtime_output(self.log(bad).replace('global.help_panel::show_persists', 'global.help_panel::' + case), case, 'a' * 64, row['acceptedHashes'])
            if case in ('outside_click', 'escape', 'keyboard_close'):
                bad = copy.deepcopy(row)
                if case == 'outside_click':
                    bad['outsidePoint'] = [300, 200]
                elif case == 'escape':
                    bad['defaultGameEscape'] = False
                else:
                    bad['observations'][1]['focusedClose'] = False
                with self.assertRaises(ValueError):
                    gate.validate_runtime_output(self.log(bad).replace('global.help_panel::show_persists', 'global.help_panel::' + case), case, 'a' * 64, row['acceptedHashes'])


class FrozenEvidenceChecks:
    """Selected explicitly with --accepted after the public Rust export.

    Ordinary harness discovery never builds Rust or needs a prior artifact.
    """
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / 'accepted'
        shutil.copytree(self.accepted_source, self.root)

    def test_actual_public_export_requires_exact_complete_metadata_free_source(self):
        manifest = gate.validate_bundle(self.root)
        self.assertEqual(manifest['story']['types'].count('showScreen'), 2)
        panel = self.root / manifest['panel']['path']
        panel.write_bytes(panel.read_bytes() + b'# changed\n')
        with self.assertRaises(ValueError):
            gate.validate_bundle(self.root)

    def test_missing_duplicate_files_and_missing_stable_binding_refuse(self):
        original = (self.root / 'manifest.json').read_text()
        manifest = json.loads(original)
        for modify in ('missing', 'duplicate', 'metadata', 'binding'):
            with self.subTest(modify=modify):
                bad = copy.deepcopy(manifest)
                if modify == 'missing':
                    bad['files'].pop()
                elif modify == 'duplicate':
                    bad['files'].append(bad['files'][0])
                elif modify == 'metadata':
                    (self.root / 'game/.renpy-editor').mkdir()
                else:
                    mapping = json.loads((self.root / 'source-map.json').read_text())
                    story = next(s for s in mapping['sceneMappings'] if s['sceneId'] == manifest['story']['id'])
                    del story['beats'][1]['screenTarget']
                    data = json.dumps(mapping).encode()
                    (self.root / 'source-map.json').write_bytes(data)
                    bad['metadata']['sourceMap'].update(bytes=len(data), sha256=gate.digest(self.root / 'source-map.json'))
                    bad['panel']['resolved']['revisions']['sourceMap'] = bad['metadata']['sourceMap']['sha256']
                (self.root / 'manifest.json').write_text(json.dumps(bad))
                with self.assertRaises(ValueError):
                    gate.validate_bundle(self.root)
                if modify == 'metadata':
                    (self.root / 'game/.renpy-editor').rmdir()
        (self.root / 'manifest.json').write_text(original)

    def test_staged_game_keeps_accepted_source_exact_and_adds_only_fixture_driver(self):
        game = Path(self.temporary.name) / 'game-project'
        manifest = gate.validate_bundle(self.root)
        gate.stage_game(self.root, manifest, game)
        for record in manifest['files']:
            self.assertEqual((game / record['path']).read_bytes(), (self.root / record['path']).read_bytes())
        self.assertFalse((game / '.renpy-editor').exists())
        self.assertFalse((game / 'game/.renpy-editor').exists())
        self.assertEqual((game / 'accepted-runtime.json').read_bytes(), (self.root / 'manifest.json').read_bytes())
        extra = {p.relative_to(game).as_posix() for p in game.rglob('*') if p.is_file()} - {r['path'] for r in manifest['files']}
        self.assertEqual(extra, {'accepted-runtime.json', 'game/zz_help_panel_driver.rpy', 'game/zz_help_panel_tests.rpy'})


class CommandTests(unittest.TestCase):
    def test_sdk_execution_requires_explicit_argument_before_any_sdk_work(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as refused:
            gate.parse_args(['sdk', '--prepared', 'missing', '--output', 'unused', '--archive', 'unused', '--checksums', 'unused'])
        self.assertEqual(refused.exception.code, 2)
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            gate.parse_args(['prepare', '--output', 'unused', '--allow-fixture-execution'])

    def test_core_completion_requires_named_test_and_matching_export_receipt(self):
        row = dict(schemaVersion=1, manifestSHA256='a' * 64, publicCoreRequests=True, engineStarted=False)
        log = ('test ' + gate.EXPORT_TEST + ' ... ok\n'
               'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 591 filtered out; finished in 1.2s\n'
               'HELP_PANEL_FIXTURE ' + json.dumps(row))
        gate.validate_core_output(log, 'a' * 64)
        for bad in [log.replace(gate.EXPORT_TEST, 'different'), log.replace('0 ignored', '1 ignored'),
                    log + '\nHELP_PANEL_FIXTURE ' + json.dumps(row), log.replace('a' * 64, 'b' * 64)]:
            with self.assertRaises(ValueError):
                gate.validate_core_output(bad, 'a' * 64)

    def test_driver_python_syntax_without_import_or_sdk_execution(self):
        source = (gate.FIXTURE / 'driver.rpy').read_text()
        block = source.split('init python:\n', 1)[1]
        compile(textwrap.dedent(block), 'help-panel/driver.rpy:init python', 'exec')
        for line in (gate.FIXTURE / 'tests.rpy').read_text().splitlines():
            if line.lstrip().startswith('$ '):
                compile(line.strip().removeprefix('$ '), 'help-panel/tests.rpy:python', 'exec')

    def test_complete_runtime_set_refuses_missing_or_duplicate_cases(self):
        rows = [dict(case=case) for case in ['show_persists', 'authored_hide', 'reshow_close', 'outside_click', 'escape', 'keyboard_close']]
        gate.validate_case_set(rows)
        for bad in [rows[:-1], rows + [rows[0]], [rows[0]] * 6]:
            with self.assertRaises(ValueError):
                gate.validate_case_set(bad)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--accepted', type=Path)
    args, remaining = parser.parse_known_args()
    if args.accepted is not None:
        class FrozenEvidenceTests(FrozenEvidenceChecks, unittest.TestCase):
            accepted_source = args.accepted
    unittest.main(argv=[sys.argv[0], *remaining])
