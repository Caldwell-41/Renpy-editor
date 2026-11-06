"""Explicit public-core export admission. Missing exports fail this selection."""
import copy
import json
import os
from pathlib import Path
import unittest
import sample_fidelity as fidelity


class SampleExportGates(unittest.TestCase):
    def test_export_admission_rejects_changed_source_and_sample_values(self):
        accepted = json.loads((Path(os.environ['LOOMLIGHT_SAMPLE_FIDELITY_INPUTS']) / 'accepted.json').read_text(encoding='utf-8'))
        fidelity.validate_accepted(accepted)
        for mutate in (lambda a: a['cases'].pop(),
                       lambda a: a['files'][fidelity.SOURCE].__setitem__('text', 'changed'),
                       lambda a: a['cases'][0]['request']['variableSamples'][0].__setitem__('value', 'bad')):
            bad = copy.deepcopy(accepted)
            mutate(bad)
            with self.assertRaises((AssertionError, ValueError)):
                fidelity.validate_accepted(bad)


if __name__ == '__main__':
    unittest.main()
