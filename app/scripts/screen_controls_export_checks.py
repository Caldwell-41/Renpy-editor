"""Explicit checks against an actual retained #51/#52 public-core export.

Run after the exporter with LOOMLIGHT_SCREEN_CONTROLS_ACCEPTED and
LOOMLIGHT_SCREEN_CONTROLS_MANIFEST_SHA256. Missing inputs fail, never skip.
"""
import copy
import importlib.util
import os
from pathlib import Path
import unittest


spec = importlib.util.spec_from_file_location(
    'controls_export_gate', Path(__file__).with_name('qualify-screen-controls.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class RetainedExportChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        directory = os.environ.get('LOOMLIGHT_SCREEN_CONTROLS_ACCEPTED')
        expected = os.environ.get('LOOMLIGHT_SCREEN_CONTROLS_MANIFEST_SHA256')
        gate.require(directory and expected, 'explicit retained controls export/hash required')
        cls.root = Path(directory)
        gate.require(gate.digest(cls.root / 'manifest.json') == expected,
                     'wrong retained controls manifest')
        cls.manifest = gate.load_json((cls.root / 'manifest.json').read_text(encoding='utf-8'))

    def test_actual_public_export_metadata_source_assets_effects_and_plans_are_admitted(self):
        self.assertEqual(gate.validate_bundle(self.root), self.manifest)

    def test_false_or_mistyped_provenance_and_wrong_limits_refuse(self):
        variants = []
        for field, value in [('engineStarted', True), ('publicCoreRequests', False),
                             ('normalStoryCallAdmitted', False), ('normalStoryShowAdmitted', 1),
                             ('schemaVersion', True)]:
            bad = copy.deepcopy(self.manifest)
            bad[field] = value
            variants.append(bad)
        bad = copy.deepcopy(self.manifest)
        bad['expected']['maximum'] = '16'
        variants.append(bad)
        for bad in variants:
            with self.subTest(provenance=bad.get('expected')), self.assertRaises(ValueError):
                gate.validate_manifest(self.root, bad)

    def test_changed_bindings_actions_assets_context_and_revisions_refuse(self):
        def remove_bound_revision(manifest):
            dependencies = manifest['resolvedTarget']['effects']['dependencies']
            dependencies[:] = [value for value in dependencies
                               if value['id'] != manifest['variable']['id']]

        def change_state_hash(manifest):
            image = next(node for screen in manifest['document']['screens']
                         for node in screen['nodes'] if node['id'] == manifest['imageButtonId'])
            image['imageButtonAppearances']['normal']['expectedAssetSha256'] = '0' * 64

        def use_raw_authoring_hash(manifest):
            raw = gate.digest(self.root / 'authoring.json')
            manifest['document']['authoringRevision'] = raw
            next(value for value in manifest['resolvedTarget']['effects']['dependencies']
                 if value['id'] == 'authoring')['revision'] = raw

        def change_plan_image_size(manifest):
            next(node for node in manifest['canvas'][0]['plan']['nodes']
                 if node['kind'] == 'imagebutton')['properties']['xsize'] = 161

        def change_plan_bar_sample(manifest):
            next(node for node in manifest['canvas'][0]['plan']['nodes']
                 if node['kind'] == 'bar')['properties']['value'] = 6

        mutations = [
            lambda m: m['variable'].update(defaultValue='7'),
            lambda m: m['actions'].reverse(),
            lambda m: m['resolvedTarget']['effects'].update(unknown=True),
            lambda m: m['resolvedTarget'].update(blocking=False),
            remove_bound_revision,
            change_state_hash,
            use_raw_authoring_hash,
            change_plan_image_size,
            change_plan_bar_sample,
            lambda m: m['document'].update(authoringRevision='f' * 64),
            lambda m: m['entry']['beats'][2]['payload']['target'].update(sourceName='missing'),
            lambda m: m['sidecars']['sourceMap'].update(projectId='different'),
        ]
        for index, mutate in enumerate(mutations):
            bad = copy.deepcopy(self.manifest)
            mutate(bad)
            with self.subTest(mutation=index), self.assertRaises(ValueError):
                gate.validate_manifest(self.root, bad)


if __name__ == '__main__':
    unittest.main()
