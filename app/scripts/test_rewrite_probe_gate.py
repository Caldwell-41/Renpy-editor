import copy,unittest
from rewrite_probe_gate import DRAFT_CHECKS, PHASE_CHECKS,CONTINUE_CHECKS,validate_report
class Gate(unittest.TestCase):
 def report(self,phase):return {'case':'dialogue-rewrite','passed':True,'cleanupComplete':True,'details':{'stage':'complete','passed':True,'checks':list(PHASE_CHECKS[phase]),'reviewedBodyDigests':['a'*64]*5}}
 def test_required_results_and_clean_complete_only(self):
  for phase in (1,2):
   report=self.report(phase);validate_report(report,phase)
   for name in PHASE_CHECKS[phase]:
    bad=copy.deepcopy(report);bad['details']['checks'].remove(name)
    with self.assertRaises(ValueError):validate_report(bad,phase)
   for key in ('passed','cleanupComplete'):
    bad=copy.deepcopy(report);bad[key]=False
    with self.assertRaises(ValueError):validate_report(bad,phase)
   for value in ([],None):
    bad=copy.deepcopy(report);bad['details']['checks']=value
    with self.assertRaises(ValueError):validate_report(bad,phase)
 def test_exact_send_digest_count(self):
  for hashes in ([],['a'*64]*4,['bad']*5):
   report=self.report(1);report['details']['reviewedBodyDigests']=hashes
   with self.assertRaises(ValueError):validate_report(report,1)

 def test_continue_action_and_every_distinct_case_required(self):
  for phase in (1,2):
   report=self.report(phase);report['details'].update(action='continueScene',checks=list(CONTINUE_CHECKS[phase]));validate_report(report,phase,True)
   for name in CONTINUE_CHECKS[phase]:
    bad=copy.deepcopy(report);bad['details']['checks'].remove(name)
    with self.assertRaises(ValueError):validate_report(bad,phase,True)
   bad=copy.deepcopy(report);bad['details']['action']='rewriteDialogue'
   with self.assertRaises(ValueError):validate_report(bad,phase,True)

class DraftGate(unittest.TestCase):
 def test_exact_action_all_required_cases_and_body_receipts(self):
  for phase in (1,2):
   details={'action':'draftScene','stage':'complete','passed':True,'checks':list(DRAFT_CHECKS[phase]),'reviewedBodyDigests':['a'*64]*5}
   report={'case':'dialogue-rewrite','passed':True,'cleanupComplete':True,'details':details}
   validate_report(report,phase,False,True)
   for check in DRAFT_CHECKS[phase]:
    bad=copy.deepcopy(report);bad['details']['checks'].remove(check)
    with self.assertRaises(ValueError):validate_report(bad,phase,False,True)
   bad=copy.deepcopy(report);bad['details']['action']='continueScene'
   with self.assertRaises(ValueError):validate_report(bad,phase,False,True)
