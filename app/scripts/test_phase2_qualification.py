"""Cheap rejecting gates for new integrated evidence, without network or SDK execution."""
import copy
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import unittest


def module(filename):
    spec = importlib.util.spec_from_file_location(filename.replace('-', '_'), Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


sdk = module('phase2-integrated-sdk.py')
recipe = module('qualify-rewrite-windows.py')


class Gates(unittest.TestCase):
    def test_driver_startup_and_reply_failure_cleanup(self):
        subprocess.run(['node', '--test', 'tests/phase2-driver-process.test.mjs'], cwd=Path(__file__).resolve().parents[1], check=True, timeout=15)

    def fixture(self):
        paths = ['game/script.rpy', 'game/definitions/characters.rpy', 'game/definitions/variables.rpy', 'game/gui.rpy', 'game/screens.rpy', 'game/options.rpy', 'game/chapters/a.rpy', 'game/chapters/b.rpy']
        source = {p: '# synthetic\n' for p in paths}
        return {'schemaVersion': 1, 'source': source, 'sourceSHA256': {p: hashlib.sha256(t.encode()).hexdigest() for p,t in source.items()}, 'scenes': [{'id': 'a', 'label': 'loomlight_scene_' + 'a' * 32, 'path': paths[-2]}, {'id': 'b', 'label': 'loomlight_scene_' + 'b' * 32, 'path': paths[-1]}]}

    def test_complete_fixture_then_missing_input_and_wrong_hash_refused(self):
        value = self.fixture()
        sdk.validate_fixture(value)
        for change in ('hash', 'missing', 'unknown', 'version'):
            changed = copy.deepcopy(value)
            if change == 'hash': changed['sourceSHA256']['game/script.rpy'] = '0' * 64
            elif change == 'missing': del changed['source']['game/script.rpy']
            elif change == 'unknown': changed['extra'] = True
            else: changed['schemaVersion'] = 2
            with self.assertRaises(AssertionError): sdk.validate_fixture(changed)

    def test_unsafe_paths_duplicate_labels_and_missing_scene_refused(self):
        for change in ('path', 'label', 'scene'):
            changed = self.fixture()
            if change == 'path': changed['source']['game/../outside.rpy'] = '# synthetic\n';changed['sourceSHA256']['game/../outside.rpy'] = hashlib.sha256(b'# synthetic\n').hexdigest()
            elif change == 'label': changed['scenes'][1]['label'] = changed['scenes'][0]['label']
            else: changed['scenes'][1]['path'] = 'game/missing.rpy'
            with self.assertRaises(AssertionError): sdk.validate_fixture(changed)

    def test_integrated_controller_requires_both_actual_markers(self):
        text = recipe.INTEGRATED_CONTROLLER_MARKER + '\n' + recipe.PRIVATE_LAN_MARKER + '\n'
        recipe.validate_integrated_controller(text)
        for changed in ('', recipe.INTEGRATED_CONTROLLER_MARKER, recipe.PRIVATE_LAN_MARKER):
            with self.assertRaises(AssertionError): recipe.validate_integrated_controller(changed)


if __name__ == '__main__': unittest.main()
