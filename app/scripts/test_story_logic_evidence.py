"""Test the proof boundary against missing, skipped, failed and misleading evidence."""
import copy
import importlib.util
import json
import hashlib
import tempfile
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('story_evidence', Path(__file__).with_name('check-story-logic-evidence.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

spec_recipe = importlib.util.spec_from_file_location('story_recipe', Path(__file__).with_name('qualify-story-logic.py'))
recipe = importlib.util.module_from_spec(spec_recipe)
spec_recipe.loader.exec_module(recipe)


class Evidence(unittest.TestCase):
    def fixture(self):
        cases = [{'case': name, 'passed': True, 'expectedRejection': name == 'reject-wrong-outcome',
                  'exitCode': 1 if name == 'reject-wrong-outcome' else 0, 'timedOut': False, 'outputLimited': False}
                 for name in gate.CASES]
        terminal = {'passed': True, 'cleanupComplete': True, 'metadataAbsent': True, 'acceptedSourceUnchanged': True,
                    'sdkInstalls': 1, 'guiGenerations': 1, 'compileCommands': 1, 'lintCommands': 1, 'runtimeCases': 6, 'versionChecks': 2, 'guiImageCommands': 1, 'adapterSpawns': 12}
        return cases, terminal

    def log(self, cases, terminal):
        return ('\n'.join('phase-3a-sdk-case: ' + json.dumps(c) for c in cases)
                + '\nphase-3a-sdk-terminal: ' + json.dumps(terminal)
                + '\ntest ' + gate.SDK_TEST + ' ... ok\n'
                + 'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 123 filtered out;\n')

    def test_actual_complete_positive_and_rejecting_cases(self):
        gate.sdk_ok(self.log(*self.fixture()))

    def test_empty_zero_skipped_failed_and_wrong_named_test_refused(self):
        text = self.log(*self.fixture())
        for changed in ('', text.replace('1 passed', '0 passed'), text.replace('0 ignored', '1 ignored'),
                        text.replace('0 failed', '1 failed'), text.replace(gate.SDK_TEST, 'other_test'),
                        text + '\ntest result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out;'):
            with self.subTest(changed=changed[-120:]), self.assertRaises(ValueError):
                gate.sdk_ok(changed)

    def test_renderer_missing_failed_skipped_and_renamed_cases_refused(self):
        text = '\n'.join(gate.DOM_TESTS) + '\n' + '\n'.join('# ' + key + ' ' + str(value)
            for key, value in (('tests', 7), ('pass', 7), ('fail', 0), ('cancelled', 0), ('skipped', 0), ('todo', 0))) + '\n'
        gate.dom_ok(text)
        for change in ('', text.replace('# tests 7', '# tests 0'), text.replace('# pass 7', '# pass 6'),
                       text.replace('# fail 0', '# fail 1'), text.replace('# skipped 0', '# skipped 1'),
                       text.replace(gate.DOM_TESTS[0], 'unrelated_case')):
            with self.subTest(change=change[-100:]), self.assertRaises(ValueError):
                gate.dom_ok(change)

    def test_frozen_core_names_required_even_when_other_tests_pass(self):
        lines = ''.join('test ' + name + ' ... ok\n' for name in gate.CORE_TESTS)
        summary = 'test result: ok. ' + str(len(gate.CORE_TESTS)) + ' passed; 0 failed; 0 ignored; 0 measured; 0 filtered out;\n'
        gate.cargo_ok(lines + summary, gate.CORE_TESTS)
        for name in gate.CORE_TESTS:
            with self.subTest(name=name), self.assertRaises(ValueError):
                gate.cargo_ok((lines + summary).replace(name, 'unrelated_case'), gate.CORE_TESTS)

    def test_manifest_covers_nested_fixtures_privacy_and_renderer_build_inputs(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            paths = ('app/tests/fixtures/deep/scene.rpy', 'app/public/nested/image.svg', 'app/index.html',
                     'app/vite.config.ts', 'app/tsconfig.json', 'app/src/nested/view.ts',
                     'app/scripts/scan-artifacts.mjs', 'spikes/renpy-sdk/archive_safety.py')
            for path in paths:
                file = root / path
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text('public fixture ' + path, encoding='utf-8')
            manifest = recipe.input_manifest(root)
            self.assertEqual(set(manifest), set(paths))
            for path in paths:
                self.assertEqual(manifest[path], hashlib.sha256((root / path).read_bytes()).hexdigest())
            target = root / paths[0]
            before = manifest[paths[0]]
            target.write_text('changed nested fixture', encoding='utf-8')
            self.assertNotEqual(recipe.input_manifest(root)[paths[0]], before)

    def test_upload_requires_successful_privacy_scan_even_after_test_failure(self):
        workflow = Path(__file__).resolve().parents[2] / '.github/workflows/story-logic.yml'
        text = workflow.read_text(encoding='utf-8')
        self.assertIn('id: privacy\n        if: always()', text)
        upload = text.split('- uses: actions/upload-artifact@', 1)[1]
        self.assertIn("if: ${{ always() && steps.privacy.outcome == 'success' }}", upload)
        self.assertNotIn('if: always()', upload)

    def test_missing_duplicate_failed_timeout_and_false_negative_cases_refused(self):
        for change in ('missing', 'duplicate', 'failed', 'timeout', 'wrong-exit', 'negative-zero', 'negative-flag'):
            cases, terminal = self.fixture()
            if change == 'missing': cases.pop()
            elif change == 'duplicate': cases.append(copy.deepcopy(cases[0]))
            elif change == 'failed': cases[0]['passed'] = False
            elif change == 'timeout': cases[0]['timedOut'] = True
            elif change == 'wrong-exit': cases[0]['exitCode'] = None
            elif change == 'negative-zero': cases[-1]['exitCode'] = 0
            else: cases[-1]['expectedRejection'] = False
            with self.subTest(change=change), self.assertRaises(ValueError):
                gate.sdk_ok(self.log(cases, terminal))

    def test_cleanup_source_metadata_and_exhausted_operations_refused(self):
        for key in ('passed', 'cleanupComplete', 'metadataAbsent', 'acceptedSourceUnchanged',
                    'sdkInstalls', 'guiGenerations', 'compileCommands', 'lintCommands', 'runtimeCases', 'versionChecks', 'guiImageCommands', 'adapterSpawns'):
            cases, terminal = self.fixture()
            terminal[key] = False if type(terminal[key]) is bool else terminal[key] + 1
            with self.subTest(key=key), self.assertRaises(ValueError):
                gate.sdk_ok(self.log(cases, terminal))
        text = self.log(*self.fixture())
        for changed in (text.replace('phase-3a-sdk-terminal: ', 'missing: '), text + '\nphase-3a-sdk-terminal: {}'):
            with self.assertRaises(ValueError): gate.sdk_ok(changed)


if __name__ == '__main__':
    unittest.main()
