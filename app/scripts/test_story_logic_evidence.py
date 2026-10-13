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
                    'sdkInstalls': 1, 'guiGenerations': 1, 'compileCommands': 1, 'lintCommands': 1, 'runtimeCases': 6, 'versionChecks': 2, 'guiImageCommands': 1, 'adapterSpawns': 12, 'savedCallee': True, 'safeEditQualified': True, 'loadedReturn': True, 'structuralConditionQualified': True}
        return cases, terminal

    def receipts(self):
        save = {'slot': 'phase3a-callee', 'canLoad': True, 'baseDepth': 1, 'calleeDepth': 3,
                'flag': True, 'trust': '5', 'precision': '9007199254740993', 'mood': 'ready'}
        edit = {'path': 'game/entry.rpy', 'replacementCount': 1, 'beforeText': 'Caller resumed',
                'afterText': 'Caller safely edited', 'beforeSHA256': 'a' * 64, 'afterSHA256': 'b' * 64,
                'entryReturnLabel': '_ll_call_one', 'calleeReturnLabel': '_ll_call_two',
                'bomPreserved': True, 'allOtherBytesPreserved': True}
        load = {**{k: save[k] for k in ('slot', 'flag', 'trust', 'precision', 'mood')},
                'baseDepth': 1, 'savedCalleeDepth': 3, 'returnedDepth': 1, 'editedContinuation': 'Caller safely edited'}
        return save, edit, load

    def condition_receipt(self):
        return {'operation':'updateConditionBranch','path':'game/entry.rpy','groupId':'group','branchId':'branch',
                'oldHeader':'    if flag:\n','newHeader':'    if (flag == True):\n','expectedBody':{'type':'root'},
                'beforeSHA256':'c'*64,'afterSHA256':'d'*64,'bomPreserved':True,'allOtherBytesPreserved':True,'passed':True}

    def log(self, cases, terminal, receipts=None):
        save, edit, load = receipts or self.receipts()
        return ('\n'.join('phase-3a-sdk-case: ' + json.dumps(c) for c in cases)
                + '\nphase-3a-sdk-structural-condition: ' + json.dumps(self.condition_receipt())
                + '\nphase-3a-sdk-save: ' + json.dumps(save)
                + '\nphase-3a-sdk-safe-edit: ' + json.dumps(edit)
                + '\nphase-3a-sdk-load: ' + json.dumps(load)
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
        for required in (gate.DOM_TESTS, gate.FINAL_DOM_TESTS):
            count = len(required)
            text = '\n'.join('✔ ' + title + ' (1ms)' for title in required) + '\n' + '\n'.join('# ' + key + ' ' + str(value)
                for key, value in (('tests', count), ('pass', count), ('fail', 0), ('cancelled', 0), ('skipped', 0), ('todo', 0))) + '\n'
            gate.dom_ok(text, required)
            for change in ('', text.replace(f'# tests {count}', '# tests 0'), text.replace(f'# pass {count}', f'# pass {count-1}'),
                           text.replace('# fail 0', '# fail 1'), text.replace('# skipped 0', '# skipped 1'),
                           text + '✔ ' + required[0] + ' (1ms)\n'):
                with self.subTest(count=count, change=change[-100:]), self.assertRaises(ValueError):
                    gate.dom_ok(change, required)
            for title in required:
                for change in (text.replace(title, 'unrelated_case'), text.replace('✔ ' + title, '# mentioned ' + title)):
                    with self.subTest(title=title), self.assertRaises(ValueError):
                        gate.dom_ok(change, required)
        self.assertEqual(len(gate.FINAL_DOM_TESTS), 51)
        self.assertEqual(len(set(gate.FINAL_DOM_TESTS)), 51)
        self.assertTrue(set(gate.DOM_TESTS + gate.AUTHORING_DOM_TESTS).issubset(gate.FINAL_DOM_TESTS))

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
                     'app/scripts/scan-artifacts.mjs', 'app/scripts/story-controller.mjs',
                     'app/scripts/story-controller-cases.mjs', 'app/src-core/examples/story-controller-driver.rs',
                     'spikes/renpy-sdk/archive_safety.py')
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
                    'sdkInstalls', 'guiGenerations', 'compileCommands', 'lintCommands', 'runtimeCases', 'versionChecks', 'guiImageCommands', 'adapterSpawns', 'savedCallee', 'safeEditQualified', 'loadedReturn', 'structuralConditionQualified'):
            cases, terminal = self.fixture()
            terminal[key] = False if type(terminal[key]) is bool else terminal[key] + 1
            with self.subTest(key=key), self.assertRaises(ValueError):
                gate.sdk_ok(self.log(cases, terminal))
        text = self.log(*self.fixture())
        for changed in (text.replace('phase-3a-sdk-terminal: ', 'missing: '), text + '\nphase-3a-sdk-terminal: {}'):
            with self.assertRaises(ValueError): gate.sdk_ok(changed)

    def test_missing_changed_save_load_and_safe_edit_receipts_refused(self):
        positive = self.log(*self.fixture())
        for prefix in ('phase-3a-sdk-structural-condition: ', 'phase-3a-sdk-save: ', 'phase-3a-sdk-safe-edit: ', 'phase-3a-sdk-load: '):
            for changed in (positive.replace(prefix, 'missing: '), positive + '\n' + prefix + '{}'):
                with self.subTest(prefix=prefix), self.assertRaises(ValueError): gate.sdk_ok(changed)
        for which, key, value in ((0, 'slot', '1'), (0, 'canLoad', False), (0, 'baseDepth', True),
            (1, 'replacementCount', True), (1, 'bomPreserved', False), (1, 'entryReturnLabel', '_ll_call_two'),
            (2, 'returnedDepth', 99), (2, 'trust', '0'), (2, 'flag', 1), (2, 'editedContinuation', 'Caller resumed')):
            receipts = list(self.receipts()); receipts[which][key] = value
            with self.subTest(which=which, key=key), self.assertRaises(ValueError):
                gate.sdk_ok(self.log(*self.fixture(), receipts=receipts))

    def test_controller_missing_partial_failed_or_cleanup_evidence_refused(self):
        report = {'selection':'full','passed':True,'cleanupComplete':True,'driverStarts':2,
            'sdkCommands':0,'credentialOperations':0,'aiOperations':0,
            'driverExits':[{'normal':True,'reaped':True},{'normal':True,'reaped':True}],
            'cases':[{'name':name,'passed':True} for name in gate.CONTROLLER_TESTS]}
        report['cases'][-1].update(processRestart=True,staleSessionRefused=True,sourceMapsRetained=True,sessionHistoryReset=True)
        text = lambda r: 'phase-3a-controller-terminal: ' + json.dumps(r) + '\n'
        gate.controller_ok(text(report))
        for change in ('missing','narrow','failed','cleanup','one-process','sdk','unreaped','same-process'):
            modified=copy.deepcopy(report)
            if change=='missing': modified['cases'].pop(0)
            elif change=='narrow': modified['selection']='narrow'
            elif change=='failed': modified['cases'][0]['passed']=False
            elif change=='cleanup': modified['cleanupComplete']=False
            elif change=='one-process': modified['driverStarts']=1
            elif change=='sdk': modified['sdkCommands']=1
            elif change=='unreaped': modified['driverExits'][1]['reaped']=False
            else: modified['cases'][-1]['processRestart']=False
            with self.subTest(change=change), self.assertRaises(ValueError): gate.controller_ok(text(modified))

    def test_missing_or_mismatched_safe_edit_artifact_refused(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory=Path(temporary)
            report=gate.sdk_ok(self.log(*self.fixture()))
            before=b'\xef\xbb\xbflabel entry:\n    if (flag == True):\n        pass\n    call callee from _ll_call_one\n    "Caller resumed"\n    return\n'
            after=before.replace(b'"Caller resumed"',b'"Caller safely edited"',1)
            condition_before=before.replace(b'    if (flag == True):\n',b'    if flag:\n',1)
            condition=report['structuralCondition']
            condition['beforeSHA256']=hashlib.sha256(condition_before).hexdigest()
            condition['afterSHA256']=hashlib.sha256(before).hexdigest()
            (directory/'structural-condition.json').write_text(json.dumps(condition),encoding='utf-8')
            (directory/'structural-condition-before.rpy').write_bytes(condition_before)
            (directory/'structural-condition-accepted.rpy').write_bytes(before)
            report['safeEdit']['beforeSHA256']=hashlib.sha256(before).hexdigest()
            report['safeEdit']['afterSHA256']=hashlib.sha256(after).hexdigest()
            for filename,key in (('save-receipt.json','save'),('safe-edit.json','safeEdit'),('load-receipt.json','load')):
                (directory/filename).write_text(json.dumps(report[key]),encoding='utf-8')
            (directory/'calls-accepted-entry.rpy').write_bytes(before)
            (directory/'calls-accepted-callee.rpy').write_bytes(b'label callee:\n    call nested from _ll_call_two\n    return\n')
            for case in gate.CASES:
                entry=after if case in ('nested-call-return','reject-wrong-outcome') else before
                (directory/(case+'-source-digests.json')).write_text(json.dumps({'game/entry.rpy':hashlib.sha256(entry).hexdigest()}),encoding='utf-8')
            target=directory/'safe-edited-entry.rpy'
            with self.assertRaises(FileNotFoundError): gate.sdk_artifacts_ok(directory,report)
            target.write_bytes(after)
            self.assertTrue(gate.sdk_artifacts_ok(directory,report))
            target.write_bytes(after+b'# unexpected SDK or fixture mutation\n')
            with self.assertRaises(ValueError): gate.sdk_artifacts_ok(directory,report)


if __name__ == '__main__':
    unittest.main()
