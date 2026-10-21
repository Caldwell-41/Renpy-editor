"""Reject ordinary incomplete or mismatched early-screen evidence before SDK work."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
import tempfile

spec = importlib.util.spec_from_file_location('screen_evidence', Path(__file__).with_name('qualify-screens-source.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ScreenEvidenceTests(unittest.TestCase):
    def candidate(self):
        before = ('\ufeff' + (gate.REPO / 'tests/fixtures/phase-3b-screens/help.rpy').read_text().replace('\n', '\r\n')).encode()
        start = before.index(b'640')
        accepted = before[:start] + b'720' + before[start+3:]
        return dict(schemaVersion=1, before=before.decode(), accepted=accepted.decode(), byteStart=start,
                    beforeSHA256=hashlib.sha256(before).hexdigest(), acceptedSHA256=hashlib.sha256(accepted).hexdigest(),
                    screen='loomlight_help', property='xsize', value=720,
                    roundtrip=True, undoRedo=True, draftRetained=True, reopen=True)

    def test_candidate_rejects_extra_change_hash_mismatch_and_missing_proof(self):
        good = self.candidate()
        gate.validate_candidate(good)
        for field, value in [('accepted', good['accepted'] + '# changed'), ('acceptedSHA256', '0' * 64),
                             ('reopen', False), ('screen', 'wrong_screen')]:
            bad = copy.deepcopy(good)
            bad[field] = value
            with self.assertRaises(AssertionError):
                gate.validate_candidate(bad)

    def test_core_rejects_missing_named_case_and_ignored_failure(self):
        good = '\n'.join(f'test screens::tests::{name} ... ok' for name in gate.TESTS) + '\ntest result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 433 filtered out; finished in 1.50s'
        gate.validate_core_output(good)
        for bad in [good.replace(gate.TESTS[0], 'different_case'), good.replace('0 ignored', '1 ignored'),
                    good.replace('3 passed; 0 failed', '2 passed; 1 failed'),
                    good + '\ntest screens::tests::' + gate.TESTS[0] + ' ... ok']:
            with self.assertRaises(AssertionError):
                gate.validate_core_output(bad)

    def test_runtime_rejects_status_alone_wrong_size_and_wrong_continuation(self):
        status = '[rpytest] Status: PASSED\nglobal.screenproof::layout\n[rpytest] Test cases : 1 | 1 passed | 0 xfailed | 0 failed | 0 xpassed | 0 skipped | 0 not run\n[rpytest] Time: 0.5 s\n'
        good = dict(panelSize=[720, 360], continuationCount=1, opaqueNeighbor=True)
        gate.validate_runtime_output(status + 'SCREEN_PROOF_OBSERVED ' + json.dumps(good))
        for bad in ['', json.dumps(dict(good, panelSize=[640, 360])), json.dumps(dict(good, continuationCount=2))]:
            with self.assertRaises(AssertionError):
                gate.validate_runtime_output(status + ('SCREEN_PROOF_OBSERVED ' + bad if bad else ''))

    def test_reuse_admission_includes_compiled_prompt_and_fixture_inputs(self):
        for path in ['app/src-core/prompts/v1/task.txt', 'app/tests/fixtures/input.rpy',
                     'app/rust-toolchain.toml', 'app/src-tauri/Cargo.toml']:
            self.assertNotEqual(gate.core_inputs({path: 'old'}), gate.core_inputs({path: 'new'}))

    def test_binary_is_retained_even_with_failed_case_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            binary = root / 'compiled-test'
            binary.write_bytes(b'fictional compiled binary')
            row = dict(reason='compiler-artifact', profile={'test': True}, executable=str(binary), target={'name': 'loomlight_core'})
            retained = gate.retain_test_binary(json.dumps(row) + '\ntest result: FAILED', root)
            self.assertEqual((root / retained['path']).read_bytes(), binary.read_bytes())
            self.assertEqual(retained['sha256'], hashlib.sha256(binary.read_bytes()).hexdigest())


if __name__ == '__main__':
    unittest.main()
