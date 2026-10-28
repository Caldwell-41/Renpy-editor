"""L04 native admission rejects incomplete stages, source and ownership."""
import copy
import unittest
from uuid import UUID
from runtime_probe_cases import runtime_report_ok

STAGES=('nested-composition-passed','grid-layout-passed','viewport-source-passed','nested-history-passed','nested-reopen-passed','complete')


def receipt():
    ids=[str(UUID(int=i)) for i in range(1,9)]
    owner=str(UUID(int=20))
    source=f'# loomlight-screen: {owner}\nscreen travel_notes():\n'+''.join(f'    text "Fixture" # loomlight-element: {value}\n' for value in ids[1:])+'    window:\n        hbox:\n            viewport:\n                grid 4 1:\n                    allow_underfull True\n    use source_only_footer()\nscreen source_only_footer():\n    text "Protected neighbor"\n'
    return dict(evidence='runtime-ui-packaged',case='nested-layout',passed=True,cleanupComplete=True,
                details=dict(scenario='nested-layout',stage='complete',nativeWebView=True,sdkExecuted=False,
                             stages=[dict(stage=s) for s in STAGES],identities=ids,acceptedSource=source,
                             identity=dict(id=owner,rootId=ids[0],name='travel_notes',path='game/ui/travel_notes.rpy',resolved=True)))


class NestedEvidence(unittest.TestCase):
    def test_admits_only_complete_native_source_and_identity_evidence(self):
        self.assertTrue(runtime_report_ok('nested-layout',receipt()))
        for stage in STAGES:
            bad=receipt();bad['details']['stages']=[row for row in bad['details']['stages'] if row['stage']!=stage]
            self.assertFalse(runtime_report_ok('nested-layout',bad))
        for field,value in [('acceptedSource',''),('identities',[]),('nativeWebView',False),('sdkExecuted',True),('identity',None)]:
            bad=receipt();bad['details'][field]=value;self.assertFalse(runtime_report_ok('nested-layout',bad))
        bad=receipt();bad['details']['acceptedSource']=bad['details']['acceptedSource'].replace('grid 4 1:','grid columns rows:')
        self.assertFalse(runtime_report_ok('nested-layout',bad))
        for field in ['passed','cleanupComplete']:
            bad=receipt();bad[field]=False;self.assertFalse(runtime_report_ok('nested-layout',bad))
