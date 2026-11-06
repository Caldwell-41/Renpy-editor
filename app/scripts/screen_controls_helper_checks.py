"""Exercise helper evidence admission with synthetic PNGs and a real accepted export.

These tests never start an SDK and do not establish helper rendering.
"""
import copy
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
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

    def check(self, result):
        (self.output/'result.json').write_text(json.dumps(result), encoding='utf-8')
        return gate.validate_helper(self.accepted, self.output, self.candidate, self.manifest_sha)

    def test_complete_synthetic_pixel_matrix_is_admitted(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.check(self.result), self.result)

    def test_cached_wrong_state_pixels_refuse_even_with_updated_file_hash(self):
        first, second = self.result['records'][:2]
        (self.output/second['filename']).write_bytes((self.output/first['filename']).read_bytes())
        second['sha256'] = gate.digest(self.output/second['filename'])
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
