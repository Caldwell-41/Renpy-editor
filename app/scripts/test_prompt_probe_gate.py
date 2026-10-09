import copy
import unittest
from prompt_probe_gate import validate_report, PHASE_CHECKS
class Gate(unittest.TestCase):
 def test_known_failures_cannot_pass(self):
  for phase in (1,2):
   report={'case':'prompt-context','passed':True,'cleanupComplete':True,'details':{'stage':'complete','passed':True,'checks':list(PHASE_CHECKS[phase])}}
   validate_report(report,phase)
   for mutate in (lambda x:x.update(passed=False),lambda x:x.update(cleanupComplete=False),lambda x:x['details'].update(checks=[]),lambda x:x['details'].update(checks=list(PHASE_CHECKS[phase])[1:]),lambda x:x['details'].update(stage='failed')):
    invalid=copy.deepcopy(report);mutate(invalid)
    with self.assertRaises(ValueError):validate_report(invalid,phase)
if __name__=='__main__':unittest.main()
