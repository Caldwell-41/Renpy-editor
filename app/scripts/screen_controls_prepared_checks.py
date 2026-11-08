"""Explicit admission/rejection checks for reusing a retained controls producer.

Requires a real prepared export, its producing commit, a committed current
candidate and the previous SDK output. Starts no SDK or helper.
"""
import copy
import importlib.util
import os
from pathlib import Path
import shutil
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    'controls_prepared_gate', Path(__file__).with_name('qualify-screen-controls.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class PreparedControlsChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        values = [os.environ.get('LOOMLIGHT_CONTROLS_' + name) for name in
                  ('PREPARED', 'SOURCE_CANDIDATE', 'CURRENT_CANDIDATE', 'PREVIOUS_SDK')]
        gate.require(all(values), 'explicit controls preparation, candidates and prior SDK output required')
        prepared, cls.source, cls.current, previous = values
        cls.prepared, cls.previous = Path(prepared), Path(previous)
        cls.result = gate.load_json((cls.prepared / 'result.json').read_text(encoding='utf-8'))

    def test_unchanged_core_inputs_reuse_the_original_binary_source_and_completed_setup(self):
        manifest = gate.validate_prepared(self.prepared, self.current, self.source)
        self.assertEqual(len(manifest['files']), 15)
        reused = gate.validate_setup_reuse(self.previous, self.prepared,
                                          self.result['manifestSHA256'], self.source)
        self.assertEqual(reused['candidate'], self.source)

    def test_changed_producer_dependency_refuses_even_with_rewritten_receipt_fingerprints(self):
        with tempfile.TemporaryDirectory() as directory:
            prepared = Path(directory) / 'prepared'
            shutil.copytree(self.prepared, prepared)
            material = gate.load_json((prepared / 'inputs.json').read_text(encoding='utf-8'))
            material['app/src-core/src/screens/control_source.rs'] = 'f' * 64
            receipt = copy.deepcopy(self.result)
            receipt['inputsSHA256'] = gate.process.inputs_fingerprint(material)
            receipt['testBinary']['producingInputsSHA256'] = receipt['inputsSHA256']
            gate.write_json(prepared / 'inputs.json', material)
            gate.write_json(prepared / 'result.json', receipt)
            with self.assertRaisesRegex(ValueError, 'changed source producer dependency'):
                gate.validate_prepared(prepared, self.current, self.source)

    def test_changed_retained_binary_refuses(self):
        with tempfile.TemporaryDirectory() as directory:
            prepared = Path(directory) / 'prepared'
            shutil.copytree(self.prepared, prepared)
            with (prepared / self.result['testBinary']['path']).open('r+b') as binary:
                first = binary.read(1)
                binary.seek(0)
                binary.write(bytes([first[0] ^ 1]))
            with self.assertRaisesRegex(ValueError, 'changed controls source producer binary'):
                gate.validate_prepared(prepared, self.current, self.source)

    def test_wrong_failed_or_unclean_setup_refuses(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = Path(directory) / 'sdk'
            shutil.copytree(self.previous, previous)
            original = gate.load_json((previous / 'result.json').read_text(encoding='utf-8'))
            for mutate in (lambda row: row.update(cleanupComplete=False),
                           lambda row: row.update(manifestSHA256='f' * 64),
                           lambda row: row['checks'][2].update(passed=False)):
                receipt = copy.deepcopy(original)
                mutate(receipt)
                gate.write_json(previous / 'result.json', receipt)
                with self.assertRaises(ValueError):
                    gate.validate_setup_reuse(previous, self.prepared, self.result['manifestSHA256'], self.source)


if __name__ == '__main__':
    unittest.main()
