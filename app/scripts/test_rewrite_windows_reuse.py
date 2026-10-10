"""Retained evidence must reject changed runtime inputs or corrupt artifacts."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('windows_rewrite', Path(__file__).with_name('qualify-rewrite-windows.py'))
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)


class RetainedEvidenceGate(unittest.TestCase):
    def inputs(self):
        return {p: 'original' for p in (
            'app/Cargo.lock', 'app/package-lock.json', 'app/package.json',
            'app/src-tauri/src/main.rs', 'app/src-tauri/src/ai_native/windows.rs',
            'app/src-tauri/tauri.conf.json', 'app/src-core/src/rewrite.rs',
            'app/src/rewrite-ui.ts', 'app/src-tauri/permissions/core.toml',
            'app/src-core/src/rewrite/tests.rs')}

    def test_only_selected_harness_changes_can_reuse(self):
        original = self.inputs()
        changed = copy.deepcopy(original)
        for p in recipe.REUSE_HARNESS_PATHS:
            changed[p] = 'new harness'
        recipe.validate_reuse_inputs(original, changed)
        for p in set(original)-recipe.REUSE_HARNESS_PATHS:
            with self.subTest(path=p):
                invalid = dict(changed, **{p: 'changed runtime'})
                with self.assertRaises(AssertionError):
                    recipe.validate_reuse_inputs(original, invalid)
        for invalid in ({}, dict(changed, **{'app/src/new-runtime.ts': 'new'})):
            with self.assertRaises(AssertionError):
                recipe.validate_reuse_inputs(original, invalid)
        removed = dict(changed); removed.pop('app/src-tauri/permissions/core.toml')
        with self.assertRaises(AssertionError):
            recipe.validate_reuse_inputs(original, removed)

    def test_manifest_is_portable_and_rejects_missing_changed_and_escape(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root/'package').mkdir()
            exe = root/'package/loomlight.exe'; exe.write_bytes(b'exact candidate')
            sha = hashlib.sha256(exe.read_bytes()).hexdigest()
            recipe.validate_reuse_manifest(root, {'package\\loomlight.exe': sha})
            recipe.validate_reuse_manifest(root, {'package/loomlight.exe': sha})
            for invalid in ({}, {'package/missing.exe': sha}, {'../outside': sha}, {'C:/outside': sha}, {'package/loomlight.exe': 'incorrect'}):
                with self.subTest(invalid=invalid), self.assertRaises(AssertionError):
                    recipe.validate_reuse_manifest(root, invalid)
            exe.write_bytes(b'different candidate')
            with self.assertRaises(AssertionError):
                recipe.validate_reuse_manifest(root, {'package/loomlight.exe': sha})

    def test_focused_reuse_requires_unchanged_test_and_example_inputs(self):
        original = self.inputs()
        original['app/src-tauri/examples/rewrite-controller-driver.rs'] = 'original'
        allowed = recipe.REUSE_HARNESS_PATHS - {'app/src-core/src/rewrite/tests.rs', 'app/src-tauri/examples/rewrite-controller-driver.rs'}
        changed = dict(original, **{'app/scripts/rewrite-windows-native.ps1': 'new native driver'})
        recipe.validate_reuse_inputs(original, changed, allowed)
        for path in ('app/src-core/src/rewrite/tests.rs', 'app/src-tauri/examples/rewrite-controller-driver.rs'):
            with self.subTest(path=path), self.assertRaises(AssertionError):
                recipe.validate_reuse_inputs(original, dict(changed, **{path: 'changed test'}), allowed)

    def test_reuse_cannot_promote_unsuccessful_case_or_changed_binary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root/'package').mkdir()
            exe = root/'package/loomlight.exe'; exe.write_bytes(b'exact candidate')
            receipt = {'passed': True, 'sdkPassed': True, 'packagePassed': True, 'sourceRunId': 'original', 'executableSHA256': hashlib.sha256(exe.read_bytes()).hexdigest()}
            (root/'reuse.json').write_text(json.dumps(receipt))
            recipe.verify_reuse(root, 'package')
            for field in ('passed', 'sdkPassed', 'packagePassed'):
                broken = dict(receipt, **{field: False}); (root/'reuse.json').write_text(json.dumps(broken))
                with self.subTest(field=field), self.assertRaises(AssertionError):
                    recipe.verify_reuse(root, 'sdk' if field == 'sdkPassed' else 'package')
            (root/'reuse.json').write_text(json.dumps(receipt)); exe.write_bytes(b'changed')
            with self.assertRaises(AssertionError):
                recipe.verify_reuse(root, 'package')


if __name__ == '__main__':
    unittest.main()
