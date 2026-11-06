"""Exercise helper evidence admission with synthetic PNGs and a real accepted export.

These tests never start an SDK and do not establish helper rendering.
"""
import copy
import contextlib
import importlib.util
import io
import json
import os
import shutil
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image

spec = importlib.util.spec_from_file_location('controls_helper_gate', Path(__file__).with_name('qualify-screen-controls.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class HelperAdmissionChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.accepted = Path(os.environ['LOOMLIGHT_SCREEN_CONTROLS_ACCEPTED'])
        cls.manifest_sha = os.environ['LOOMLIGHT_SCREEN_CONTROLS_MANIFEST_SHA256']
        gate.require(gate.digest(cls.accepted / 'manifest.json') == cls.manifest_sha, 'wrong explicit export')
        cls.manifest = gate.validate_bundle(cls.accepted)

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.output = Path(self.temporary.name)
        self.reference = self.output / 'reference'
        self.reference.mkdir()
        self.candidate = 'a' * 40
        manifest = self.manifest
        nodes = {node['kind']: node for screen in manifest['document']['screens'] for node in screen['nodes']
                 if node['id'] in (manifest['barId'], manifest['imageButtonId'])}
        records = []
        prefixes = dict(zip(gate.STATES, ('idle', 'hover', 'selected_idle', 'selected_hover', 'insensitive', 'selected_insensitive')))
        for index, entry in enumerate(manifest['canvas']):
            request = entry['request']
            planned = next(node for node in entry['plan']['nodes'] if node['kind'] == 'imagebutton')
            image = Image.new('RGBA', (request['width'], request['height']), '#000000')
            with Image.open(self.accepted / ('game/' + planned['properties'][prefixes[request['buttonState']]])) as asset:
                image.paste(asset.convert('RGBA').resize((160, 80), Image.Resampling.NEAREST), (100, 180))
            filename = f'frame-{index}.png'
            image.save(self.output / filename)
            records.append(dict(request=request, filename=filename, sha256=gate.digest(self.output/filename),
                                frame=dict(phase='ready', revision=manifest['document']['revision'],
                                           renderer='angle2' if sys.platform == 'win32' else 'gl2',
                                           diagnostics=dict(physical=[request['width'], request['height']], drawPerVirtual=1),
                                           geometry=[dict(start=nodes[kind]['span']['start'], x=100, y=y, width=w, height=h)
                                                     for kind, y, w, h in [('bar', 100, 320, 24), ('imagebutton', 180, 160, 80)]])))
        inputs = {record['path']: record['sha256'] for record in manifest['files']}
        inputs.update({'.renpy-editor/'+name: gate.digest(self.accepted/name)
                       for name in ('project.json', 'source-map.json', 'authoring.json')})
        self.result = dict(passed=True, candidate=self.candidate, manifestSHA256=self.manifest_sha,
                           coreTestSHA256='b'*64,
                           rendererSHA256=gate.digest(gate.REPO/'app/src-core/src/screens/canvas-renderer.rpy'),
                           sdkValidationProcesses=3, helperStarts=1, helperReturns=1,
                           sourceUnchanged=True, cleanupComplete=True, inputs=inputs,
                           shutdown=dict(cleanupComplete=True, cooperative=True, exitCode=0), records=records)
        shutil.copyfile(self.accepted / 'manifest.json', self.reference / 'accepted-manifest.json')
        reference_records = []
        for record in records:
            request = record['request']
            shutil.copyfile(self.output / record['filename'], self.reference / record['filename'])
            reference_records.append(dict(width=request['width'], height=request['height'],
                state=request['buttonState'], filename=record['filename'], sha256=record['sha256'],
                physical=[request['width'], request['height']], drawPerVirtual=1,
                renderer='angle2' if sys.platform == 'win32' else 'gl2'))
        self.reference_result = dict(passed=True, cleanupComplete=True, sdkProcessesStarted=1,
            referenceSourceSHA256=gate.digest(gate.FIXTURE / 'helper-reference.rpy'),
            sdkUncertainReservations=0, sdkSHA256=gate.files.SDK_SHA256, manifestSHA256=self.manifest_sha,
            records=reference_records, checks=[dict(name='reference-matrix', passed=True,
                startState='confirmed', exitCode=0, durationSeconds=1, timedOut=False,
                outputLimited=False, processReaped=True, cleanupComplete=True)])
        self.write_reference()

    def write_reference(self):
        (self.reference / 'result.json').write_text(json.dumps(self.reference_result), encoding='utf-8')
        self.reference_sha = gate.digest(self.reference / 'result.json')

    def check(self, result):
        (self.output/'result.json').write_text(json.dumps(result), encoding='utf-8')
        return gate.validate_helper(self.accepted, self.output, self.candidate, self.manifest_sha,
                                    self.reference, self.reference_sha)

    def test_complete_synthetic_pixel_matrix_is_admitted(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.check(self.result), self.result)

    def test_cached_wrong_state_pixels_refuse_even_with_updated_file_hash(self):
        first, second = self.result['records'][:2]
        (self.output/second['filename']).write_bytes((self.output/first['filename']).read_bytes())
        second['sha256'] = gate.digest(self.output/second['filename'])
        with self.assertRaisesRegex(ValueError, 'state pixels'):
            self.check(self.result)

    def test_reference_launch_uses_helper_dpi_and_only_admitted_images(self):
        sys.path.insert(0, str(gate.REPO / 'spikes/renpy-sdk'))
        import archive_safety
        import sdk_adapter
        checksums = self.output / 'checksums.txt'
        checksums.write_text('# sha256\n' + gate.files.SDK_SHA256 + '  sdk.tar.bz2\n')
        observed = []
        material = gate.inputs()

        def capture_launch(result, output, name, argv, cwd, env, timeout):
            observed.append(env)
            self.assertEqual(env['RENPY_HIGHDPI'], '1.0')
            self.assertNotIn('SDL_VIDEODRIVER', env)
            game = Path(argv[-3]) / 'game'
            staged = [p for p in game.rglob('*') if p.is_file()]
            self.assertEqual([p.name for p in staged if p.suffix == '.rpy'], ['reference.rpy'])
            images = [p for p in staged if p.suffix == '.png']
            self.assertEqual(len(images), 6)
            for image in images:
                self.assertEqual(gate.digest(image), gate.digest(self.accepted / 'game' / image.relative_to(game)))
            raise RuntimeError('captured launch boundary; no process started')

        with patch.object(gate.process, 'require_candidate'), \
             patch.object(gate, 'inputs', return_value=material), \
             patch.object(gate.shared, 'record_environment'), \
             patch.object(gate.files, 'REPO', self.output), \
             patch.object(archive_safety, 'install_verified_tar'), \
             patch.object(sdk_adapter, 'launcher_for', return_value=('not-launched',)), \
             patch.object(gate.process, 'run_sdk_logged', side_effect=capture_launch), \
             patch.dict(os.environ, {'RENPY_HIGHDPI': '9.0', 'SDL_VIDEODRIVER': 'dummy'}):
            with self.assertRaisesRegex(RuntimeError, 'captured launch boundary'):
                gate.main(['reference-helper', '--accepted', str(self.accepted),
                           '--output', str(self.output / 'app/target/launch'), '--archive', str(self.output / 'sdk.tar.bz2'),
                           '--checksums', str(checksums), '--expected-candidate', self.candidate,
                           '--allow-fixture-execution'])
        self.assertEqual(len(observed), 1)

    def test_reference_capture_conditions_and_source_identity_refuse(self):
        original = copy.deepcopy(self.reference_result)
        for mutate in (lambda row: row.update(manifestSHA256='c'*64),
                       lambda row: row['records'][0].update(physical=[1000, 700]),
                       lambda row: row['records'][0].update(drawPerVirtual=0.9),
                       lambda row: row['records'][0].update(renderer='sw'),
                       lambda row: row['records'].pop(),
                       lambda row: row.update(cleanupComplete=False)):
            self.reference_result = copy.deepcopy(original)
            mutate(self.reference_result)
            self.write_reference()
            with self.subTest(mutation=mutate), self.assertRaises(ValueError) as caught:
                self.check(self.result)
            if self.reference_result['records'][0]['drawPerVirtual'] == 0.9:
                self.assertIn('helper physical=[1280, 720], drawPerVirtual=1', str(caught.exception))
                self.assertIn('reference physical=[1280, 720], drawPerVirtual=0.9', str(caught.exception))

    def test_native_readback_is_not_required_to_equal_raw_asset_bytes(self):
        # Exact helper/reference equality remains mandatory, including alpha.
        for record in self.result['records']:
            for folder in (self.output, self.reference):
                path = folder / record['filename']
                with Image.open(path) as image:
                    image = image.convert('RGBA')
                    color = image.getpixel((100, 180))
                    image.paste(tuple(channel-1 for channel in color), (100, 180, 260, 260))
                    image.save(path)
            record['sha256'] = gate.digest(self.output / record['filename'])
        for record in self.reference_result['records']:
            record['sha256'] = gate.digest(self.reference / record['filename'])
        self.write_reference()
        with contextlib.redirect_stdout(io.StringIO()):
            self.check(self.result)
        record = self.result['records'][0]
        path = self.output / record['filename']
        with Image.open(path) as image:
            image = image.convert('RGBA')
            r, g, b, a = image.getpixel((100, 180))
            image.putpixel((100, 180), (r, g, b, a-1))
            image.save(path)
        record['sha256'] = gate.digest(path)
        with self.assertRaisesRegex(ValueError, 'state pixels'):
            self.check(self.result)

    def test_incomplete_lifecycle_source_geometry_and_state_matrix_refuse(self):
        for mutate in (lambda row: row.update(helperStarts=2),
                       lambda row: row.update(helperStarts=True),
                       lambda row: row.update(sourceUnchanged=False),
                       lambda row: row['inputs'].update({'game/script.rpy':'c'*64}),
                       lambda row: row['records'][0]['frame']['geometry'][1].update(width=159),
                       lambda row: row['records'][0]['frame'].update(renderer='sw'),
                       lambda row: row['records'].pop()):
            row = copy.deepcopy(self.result)
            mutate(row)
            with self.subTest(mutation=mutate), self.assertRaises(ValueError):
                self.check(row)


if __name__ == '__main__':
    unittest.main()
