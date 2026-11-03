"""Offline #45 evidence admission. No SDK/helper/native process is started."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
import argparse
import tempfile
import shutil
import re
import os
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('help_dialog_gate', Path(__file__).with_name('qualify-help-dialog.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class RuntimeEvidenceTests(unittest.TestCase):
    def receipt(self, case='close'):
        return dict(schemaVersion=1, sdkVersion='8.5.3', case=case, resolution=[1280, 720],
                    manifestSHA256='a' * 64, acceptedHashes={'game/story.rpy': 'b' * 64},
                    normalEntry=True, startedFromMenu=True, defaultGameEscape=True, underlyingBaselineCount=1,
                    frameRect=[300, 100, 600, 500], outsidePoint=[0, 0],
                    inputs={'close': ['clickClose'], 'escape': ['K_ESCAPE'],
                            'keyboard_close': ['moveOutside', 'K_DOWN', 'K_RETURN'],
                            'outside_blocks': ['clickUnderlying', 'clickOutside', 'K_SPACE', 'clickClose']}[case],
                    observations=[dict(step='waiting', dialogVisible=True, modal=True, followingCount=0, doneCount=0,
                                       underlyingCount=0, gameMenu=False, mousePoint=[0, 0], focusedClose=True, defaultClose=True),
                                  *([dict(step='blocked', dialogVisible=True, modal=True, followingCount=0, doneCount=0,
                                          underlyingCount=0, gameMenu=False, mousePoint=[0, 0], focusedClose=False, defaultClose=True)] if case == 'outside_blocks' else []),
                                  *([dict(step='focused', dialogVisible=True, modal=True, followingCount=0, doneCount=0,
                                          underlyingCount=0, gameMenu=False, mousePoint=[0, 0], focusedClose=True, defaultClose=True)] if case == 'keyboard_close' else []),
                                  dict(step='finished', dialogVisible=False, modal=False, followingCount=1, doneCount=0,
                                       underlyingCount=0, gameMenu=False, mousePoint=[0, 0], focusedClose=False, defaultClose=False),
                                  dict(step='settled', dialogVisible=False, modal=False, followingCount=1, doneCount=0,
                                       underlyingCount=0, gameMenu=False, mousePoint=[0, 0], focusedClose=False, defaultClose=False)])

    def log(self, row):
        return (f'global.help_dialog::{row["case"]}\n[rpytest] Status: PASSED\n'
                '[rpytest] Test cases : 4 | 1 passed | 0 xfailed | 0 failed | 0 xpassed | 3 skipped | 0 not run\n'
                '[rpytest] Time: 0.5 s\nHELP_DIALOG_OBSERVED ' + json.dumps(row))

    def validate(self, row, log=None):
        return gate.validate_runtime_output(log or self.log(row), row['case'], 'a' * 64,
                                            {'game/story.rpy': 'b' * 64}, [1280, 720])

    def test_complete_normal_entry_input_cases_are_admitted(self):
        for case in gate.CASES:
            row = self.receipt(case)
            self.assertEqual(self.validate(row), row)

    def test_missing_duplicate_skipped_wrong_candidate_or_scratch_proof_refuses(self):
        row = self.receipt()
        for field, value in [('normalEntry', False), ('startedFromMenu', False), ('manifestSHA256', 'c'*64),
                             ('acceptedHashes', {}), ('resolution', [1024, 768]), ('inputs', ['directReturn']), ('underlyingBaselineCount', 0)]:
            bad = dict(row, **{field: value})
            with self.subTest(field=field), self.assertRaises(ValueError): self.validate(bad)
        log = self.log(row)
        for bad in [log.replace('1 passed', '0 passed'), log.replace('3 skipped', '2 skipped'),
                    log.replace('0 not run', '1 not run'), log.replace('0.5 s', '0.0 s'),
                    log + '\nHELP_DIALOG_OBSERVED ' + json.dumps(row),
                    log.split('HELP_DIALOG_OBSERVED')[0], log.replace('Status: PASSED', 'Status: FAILED')]:
            with self.subTest(log=bad), self.assertRaises(ValueError): self.validate(row, bad)

    def test_call_waits_then_continues_exactly_once_and_underlying_interaction_is_blocked(self):
        row = self.receipt('outside_blocks')
        for index, field, value in [(0, 'followingCount', 1), (1, 'dialogVisible', False),
                                    (1, 'underlyingCount', 1), (2, 'followingCount', 0),
                                    (3, 'followingCount', 2), (3, 'doneCount', 1)]:
            bad = copy.deepcopy(row); bad['observations'][index][field] = value
            with self.subTest(index=index, field=field), self.assertRaises(ValueError): self.validate(bad)
        bad = copy.deepcopy(row); bad['outsidePoint'] = [400, 200]
        with self.assertRaises(ValueError): self.validate(bad)

    def test_keyboard_focus_and_escape_mapping_must_be_observed(self):
        row = self.receipt('keyboard_close'); row['observations'][1]['focusedClose'] = False
        with self.assertRaises(ValueError): self.validate(row)
        row = self.receipt('escape'); row['defaultGameEscape'] = False
        with self.assertRaises(ValueError): self.validate(row)

    def test_process_results_require_complete_cleanup_and_named_positive_results(self):
        good = [dict(name='core-export',startState='confirmed',passed=True,exitCode=0,timedOut=False,outputLimited=False,processReaped=True,cleanupComplete=True)]
        gate.validate_process_checks(good, ['core-export'])
        for field in ('passed','exitCode','timedOut','outputLimited','processReaped','cleanupComplete','startState'):
            bad = copy.deepcopy(good); del bad[0][field]
            with self.subTest(field=field), self.assertRaises(ValueError): gate.validate_process_checks(bad, ['core-export'])
        for bad in ([], good + good):
            with self.assertRaises(ValueError): gate.validate_process_checks(bad, ['core-export'])

    def test_launch_accounting_distinguishes_preflight_uncertain_and_confirmed_io_failure(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            def result(): return dict(checks=[],sdkLaunchAttempts=0,sdkProcessesStarted=0,sdkUncertainReservations=0,sdkRefusedLaunches=0)
            def refused(*args, **kwargs): raise OSError('spawn refused without receipt')
            row = result()
            with self.assertRaises(FileNotFoundError):
                gate.run_sdk_logged(row, root, 'preflight', ['unused'], root/'missing', dict(os.environ), 1, runner=refused)
            self.assertEqual((row['sdkLaunchAttempts'],row['sdkProcessesStarted'],row['sdkUncertainReservations'],row['sdkRefusedLaunches']), (1,0,0,1))
            row = result()
            with self.assertRaisesRegex(OSError, 'spawn refused'):
                gate.run_sdk_logged(row, root, 'unknown', ['unused'], root, dict(os.environ), 1, runner=refused)
            self.assertEqual((row['sdkProcessesStarted'],row['sdkUncertainReservations']), (0,1))
            self.assertEqual(row['checks'][0]['failure']['message'], 'spawn refused without receipt')
            receipt = SimpleNamespace(exit_code=0,duration_seconds=0.1,timed_out=False,output_limited=False,output='done')
            row = result()
            with patch.object(Path, 'write_text', side_effect=OSError('post-process log I/O')):
                with self.assertRaisesRegex(OSError, 'post-process log I/O'):
                    gate.run_sdk_logged(row, root, 'finished', ['unused'], root, dict(os.environ), 1, runner=lambda *a, **k: receipt)
            self.assertEqual((row['sdkProcessesStarted'],row['sdkUncertainReservations']), (1,0))
            self.assertTrue(row['checks'][0]['cleanupComplete'])
            self.assertEqual(row['checks'][0]['failure']['message'], 'post-process log I/O')

    def test_partial_failure_receipt_confirms_start_and_preserves_original_failure(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name); row = dict(checks=[],sdkLaunchAttempts=0,sdkProcessesStarted=0,sdkUncertainReservations=0,sdkRefusedLaunches=0)
            error = RuntimeError('original adapter failure')
            for key, value in dict(command_output='partial',command_exit_code=9,command_duration_seconds=0.1,
                                   command_timed_out=False,command_output_limited=False,command_process_reaped=True,command_cleanup_complete=True).items(): setattr(error,key,value)
            def partial(*a, **k): raise error
            with patch.object(Path, 'write_text', side_effect=OSError('retention failed')):
                with self.assertRaisesRegex(RuntimeError, 'original adapter failure'):
                    gate.run_sdk_logged(row, root, 'partial', ['unused'], root, dict(os.environ), 1, runner=partial)
            self.assertEqual((row['sdkLaunchAttempts'],row['sdkProcessesStarted'],row['sdkUncertainReservations']), (1,1,0))
            self.assertEqual(row['checks'][0]['failure']['message'], 'original adapter failure')
            self.assertEqual(row['checks'][0]['retentionFailure']['message'], 'retention failed')
            gate.finish_cleanup(row, None); self.assertTrue(row['cleanupComplete'])
            row['checks'][0]['cleanupComplete'] = False; gate.finish_cleanup(row, root/'owned')
            self.assertFalse(row['cleanupComplete'])

    def test_binary_receipt_requires_expected_candidate_and_producing_inputs(self):
        record = dict(candidate='a'*40, producingInputsSHA256='b'*64, sha256='c'*64, bytes=10)
        gate.validate_binary_binding(record, 'a'*40, 'b'*64)
        for key, value in [('candidate','d'*40),('producingInputsSHA256','e'*64),('sha256',''),('bytes',0)]:
            bad = dict(record, **{key:value})
            with self.subTest(key=key), self.assertRaises(ValueError): gate.validate_binary_binding(bad, 'a'*40, 'b'*64)
        for key in ('candidate','producingInputsSHA256','sha256','bytes'):
            bad = dict(record); del bad[key]
            with self.subTest(missing=key), self.assertRaises(ValueError): gate.validate_binary_binding(bad, 'a'*40, 'b'*64)

    def test_case_matrix_requires_every_case_at_both_resolutions(self):
        rows = [dict(self.receipt(case), resolution=resolution) for resolution in gate.RESOLUTIONS for case in gate.CASES]
        gate.validate_case_set(rows)
        for bad in [rows[:-1], rows + [rows[0]], rows[:-1] + [rows[0]]]:
            with self.assertRaises(ValueError): gate.validate_case_set(bad)



class FrozenEvidenceChecks:
    accepted = None

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(); self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / 'accepted'; shutil.copytree(self.accepted, self.root)

    def test_public_export_and_required_call_binding_are_verified(self):
        manifest = gate.validate_bundle(self.root)
        self.assertEqual(manifest['entry']['beats'][1]['payload']['type'], 'callScreen')
        path = self.root / manifest['dialog']['path']; path.write_bytes(path.read_bytes() + b'# changed\n')
        with self.assertRaises(ValueError): gate.validate_bundle(self.root)

    def test_incomplete_or_duplicate_files_and_wrong_blocking_evidence_refuse(self):
        path = self.root / 'manifest.json'; original = json.loads(path.read_text(encoding='utf-8'))
        for modify in ('missing','duplicate','blocking','finish','binding','revision'):
            bad = copy.deepcopy(original)
            if modify == 'missing': bad['files'].pop()
            elif modify == 'duplicate': bad['files'].append(bad['files'][0])
            elif modify == 'blocking': bad['dialog']['resolved']['blocking'] = False
            elif modify == 'finish': bad['dialog']['resolved']['effects']['finishesInteraction'] = False
            elif modify == 'binding': bad['entry']['beats'][1]['payload']['target']['sourceName'] = 'another'
            elif modify == 'revision': bad['entry']['beats'][1]['payload']['revisions']['effects'] = '0' * 64
            path.write_text(json.dumps(bad), encoding='utf-8')
            with self.subTest(modify=modify), self.assertRaises(ValueError): gate.validate_bundle(self.root)
        path.write_text(json.dumps(original), encoding='utf-8')

    def test_missing_wrong_or_zero_exporter_results_refuse(self):
        manifest_sha = gate.digest(self.root / 'manifest.json')
        row = dict(schemaVersion=1,manifestSHA256=manifest_sha,publicCoreRequests=True,engineStarted=False)
        good = f'test {gate.EXPORT_TEST} ... ok\ntest result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.5s\nHELP_DIALOG_FIXTURE ' + json.dumps(row)
        gate.validate_core_output(good, manifest_sha)
        for bad in (good.replace('1 passed','0 passed'),good.replace('0 ignored','1 ignored'),good.replace(' ... ok',' ... FAILED'),good + '\nHELP_DIALOG_FIXTURE ' + json.dumps(row)):
            with self.assertRaises(ValueError): gate.validate_core_output(bad, manifest_sha)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--accepted', type=Path)
    args, remaining = parser.parse_known_args()
    if args.accepted is not None:
        class FrozenEvidenceTests(FrozenEvidenceChecks, unittest.TestCase):
            accepted = args.accepted.resolve()
    unittest.main(argv=[__file__, *remaining])

