"""Reject incomplete source-export evidence before reserving SDK execution."""
import importlib.util
import base64
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location(
    'screen_controls_gate', Path(__file__).with_name('qualify-screen-controls.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ExportAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 64
        self.text = (
            'test screens::tests::controls::export_screen_controls_public_core_fixture ... ok\n'
            'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 120 filtered out; finished in 0.03s\n'
            'SCREEN_CONTROLS_FIXTURE {"schemaVersion":1,"manifestSHA256":"' + self.sha
            + '","publicCoreRequests":true,"engineStarted":false}\n')

    def test_one_successful_exporter_and_bound_receipt_are_admitted(self):
        gate.validate_core_output(self.text, self.sha)

    def test_missing_duplicate_skipped_failed_or_wrong_candidate_export_refuses(self):
        for text in (
            self.text.replace('1 passed', '0 passed'),
            self.text.replace('0 ignored', '1 ignored'),
            self.text.replace('0 failed', '1 failed'),
            self.text.replace(' ... ok', ' ... ignored'),
            self.text + self.text,
            self.text.replace(self.sha, 'b' * 64),
            self.text.replace('"engineStarted":false', '"engineStarted":true'),
            self.text.replace('"publicCoreRequests":true', '"publicCoreRequests":false'),
            self.text.replace('"publicCoreRequests":true', '"publicCoreRequests":1'),
            self.text.replace('"engineStarted":false', '"engineStarted":0'),
            self.text.replace('"schemaVersion":1', '"schemaVersion":true'),
            self.text.replace('"schemaVersion":1', '"schemaVersion":1,"schemaVersion":1'),
            self.text.split('SCREEN_CONTROLS_FIXTURE')[0],
        ):
            with self.subTest(text=text), self.assertRaises(ValueError):
                gate.validate_core_output(text, self.sha)


class AcceptedFileTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / 'game').mkdir()
        sources = {
            'game/script.rpy': b'label start:\n    return\n',
            'game/normal.png': base64.b64decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7S8AAAAASUVORK5CYII='),
        }
        self.records = []
        for name, data in sources.items():
            (self.root / name).write_bytes(data)
            self.records.append(dict(path=name, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data)))

    def test_accepted_script_and_image_bytes_are_bound(self):
        self.assertEqual(gate.validate_files(self.root, self.records),
                         {row['path']: row['sha256'] for row in self.records})

    def test_changed_missing_duplicate_or_undeclared_game_file_refuses(self):
        script = self.root / 'game/script.rpy'
        saved = script.read_bytes()
        script.write_bytes(b'label start:\n    pass\n')
        with self.assertRaises(ValueError):
            gate.validate_files(self.root, self.records)
        script.unlink()
        with self.assertRaises(ValueError):
            gate.validate_files(self.root, self.records)
        script.write_bytes(saved)
        with self.assertRaises(ValueError):
            gate.validate_files(self.root, self.records + [self.records[0]])
        (self.root / 'game/extra.rpy').write_bytes(b'label extra:\n    return\n')
        with self.assertRaises(ValueError):
            gate.validate_files(self.root, self.records)

    def test_bad_paths_hashes_sizes_and_empty_inventory_refuse(self):
        for field, value in [('path', '../script.rpy'), ('path', 'game\\script.rpy'),
                             ('sha256', 'f' * 64), ('bytes', True), ('bytes', -1)]:
            bad = copy.deepcopy(self.records)
            bad[0][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                gate.validate_files(self.root, bad)
        with self.assertRaises(ValueError):
            gate.validate_files(self.root, [])


class CanvasAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.document = dict(path='game/ui/controls.rpy', revision='c' * 64, screens=[
            dict(name='controls', nodes=[dict(kind='bar', span=dict(start=1)),
                                         dict(kind='imagebutton', span=dict(start=2))])])
        self.entries = []
        for width, height in gate.RESOLUTIONS:
            for state in gate.STATES:
                request = dict(path=self.document['path'], screenName='controls',
                               expectedRevision=self.document['revision'], width=width,
                               height=height, buttonState=state)
                plan = dict(revision=self.document['revision'], width=width, height=height,
                            buttonState=state, available=True, limits=[],
                            nodes=[dict(kind='bar', start=1), dict(kind='imagebutton', start=2)])
                self.entries.append(dict(request=request, plan=plan))

    def test_six_states_at_both_aspects_bind_the_accepted_document(self):
        gate.validate_canvas_matrix(self.entries, self.document, 'controls')

    def test_missing_duplicate_stale_partial_or_wrong_state_plan_refuses(self):
        variants = [self.entries[:-1], self.entries + [self.entries[0]]]
        for section, field, value in [('request', 'expectedRevision', 'd' * 64),
                                      ('plan', 'available', False),
                                      ('plan', 'limits', ['Unsupported control']),
                                      ('plan', 'buttonState', 'hover'),
                                      ('plan', 'nodes', [dict(kind='bar', start=1)])]:
            bad = copy.deepcopy(self.entries)
            bad[0][section][field] = value
            variants.append(bad)
        for bad in variants:
            with self.subTest(bad=bad[0]), self.assertRaises(ValueError):
                gate.validate_canvas_matrix(bad, self.document, 'controls')


class RuntimeAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 64
        self.manifest = dict(files=[dict(path='game/script.rpy', sha256='b' * 64)],
                             actions=[dict(type='setVariable', variableId='score', value='7'),
                                      dict(type='hideScreen', target=dict(screenId='notes', sourceName='notes')),
                                      dict(type='finishInteraction')])
        self.colors = {state: [index * 30, 20, 90, 255]
                       for index, state in enumerate(gate.STATES)}
        self.row = dict(schemaVersion=1, sdkVersion='8.5.3', case='normal',
                        manifestSHA256=self.sha, resolution=[1280, 720],
                        acceptedHashes={'game/script.rpy': 'b' * 64},
                        startedFromMenu=True, normalEntry=True, previewEntry=False,
                        observer='sys.setprofile built-in action calls', builtinsUnmodified=True,
                        calls=self.manifest['actions'], stateSamplesInert=True,
                        bar=[dict(step=step, value=value) for step, value in
                             [('initial', '0'), ('minimum', '-5'), ('maximum', '15'), ('keyboard', '14')]],
                        barSize=[320, 24], barRange=20, barOffset=-5, barStep=1,
                        appearances=[dict(state=state, renderedSize=[160, 80], rgba=self.colors[state],
                                          referenceRGBA=self.colors[state], sourceRGBA=self.colors[state],
                                          pixelsSHA256=str(index) * 64, referenceSHA256=str(index) * 64)
                                     for index, state in enumerate(gate.STATES)],
                        actualPrefixes=['idle_', 'hover_'], finalValue='7',
                        followingCount=1, doneCount=0, panelVisible=False, dialogVisible=False)

    def output(self, row=None):
        return ('[rpytest] global.screen_controls::normal\n'
                '[rpytest] Test cases : 2 in total, 1 passed, 0 failed, 0 skipped, 0 xfailed, 1 not run, 0 not implemented\n'
                '[rpytest] Status: PASSED\n[rpytest] Time: 1.5 s\n'
                'SCREEN_CONTROLS_OBSERVED ' + json.dumps(self.row if row is None else row))

    def test_runtime_requires_bound_engine_results_limits_state_pixels_and_real_action_calls(self):
        self.assertEqual(gate.validate_runtime_output(
            self.output(), 'normal', self.sha, self.manifest, [1280, 720], self.colors), self.row)

    def test_exact_float_geometry_and_matched_native_readback_colors_are_valid(self):
        self.row['barSize'] = [320.0, 24.0]
        for appearance in self.row['appearances']:
            appearance['renderedSize'] = [160.0, 80.0]
            # Readback can differ from PNG channels. The independent native
            # reference must agree exactly, with no tolerance or state aliasing.
            appearance['rgba'] = [value - 1 if value > 0 else 0 for value in appearance['rgba']]
            appearance['referenceRGBA'] = appearance['rgba'][:]
        gate.validate_runtime_output(self.output(), 'normal', self.sha, self.manifest, [1280, 720], self.colors)

    def test_missing_skipped_or_incomplete_runtime_proof_refuses(self):
        variants = [self.output().replace('1 passed', '0 passed'),
                    self.output().replace('0 skipped', '1 skipped'),
                    self.output().replace('Status: PASSED', 'Status: FAILED'),
                    self.output() + '\n' + self.output(),
                    self.output().split('SCREEN_CONTROLS_OBSERVED')[0]]
        for mutate in (
            lambda row: row.update(stateSamplesInert=False),
            lambda row: row.update(startedFromMenu=False),
            lambda row: row.update(calls=row['calls'] * 2),
            lambda row: row['bar'][1].update(value='-4'),
            lambda row: row['appearances'][0].update(renderedSize=[80, 40]),
            lambda row: row['appearances'][1].update(rgba=self.colors['normal']),
            lambda row: row['appearances'][1].update(pixelsSHA256='f' * 64),
            lambda row: row['appearances'][1].update(sourceRGBA=self.colors['normal']),
            lambda row: row['appearances'][1].update(referenceRGBA=self.colors['normal']),
            lambda row: row['appearances'][1].update(pixelsSHA256='0' * 64, referenceSHA256='0' * 64),
            lambda row: row.update(followingCount=0),
            lambda row: row.update(finalValue='0'),
            lambda row: row.update(builtinsUnmodified=False),
            lambda row: row.update(normalEntry=False),
            lambda row: row.update(resolution=[1024, 768]),
            lambda row: row.update(barStep=True),
        ):
            row = copy.deepcopy(self.row)
            mutate(row)
            variants.append(self.output(row))
        for output in variants:
            with self.subTest(output=output), self.assertRaises(ValueError):
                gate.validate_runtime_output(output, 'normal', self.sha, self.manifest,
                                             [1280, 720], self.colors)


if __name__ == '__main__':
    unittest.main()
