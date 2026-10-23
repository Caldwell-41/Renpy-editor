import copy
import unittest
from canvas_lifecycle_evidence import admit

class LifecycleEvidence(unittest.TestCase):
    def test_requires_each_lifecycle_and_actual_app_exit(self):
        normal=dict(cleanupComplete=True,cooperative=True,exitCode=0)
        refusal=dict(cleanupComplete=True,cooperative=False,exitCode=72)
        rows=[dict(stage=s,shutdown=refusal if s=='refusal' else normal,domFocusRetained=True,
                   refusal=dict(refused=True,stage='selected-refusal') if s=='refusal' else None,
                   renderPhase='unavailable' if s=='refusal' else 'ready', renderer=None if s=='refusal' else 'gl2')
              for s in ('refusal','restart-change','quit','app-restart')]
        self.assertTrue(admit(rows,[True,True], 'macos'))
        for change in ('missing','duplicate','force','focus','refusal','exit','renderer','phase'):
            candidate=copy.deepcopy(rows); exits=[True,True]
            if change=='missing':candidate.pop()
            if change=='duplicate':candidate[-1]=candidate[0]
            if change=='force':candidate[2]['shutdown']['cooperative']=False
            if change=='focus':candidate[1]['domFocusRetained']=False
            if change=='refusal':candidate[0]['refusal']['stage']='native-bootstrap'
            if change=='exit':exits[1]=False
            if change=='renderer':candidate[2]['renderer']='sw'
            if change=='phase':candidate[2]['renderPhase']='starting'
            self.assertFalse(admit(candidate,exits, 'macos'),change)
