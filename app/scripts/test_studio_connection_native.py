import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('current_connection',Path(__file__).with_name('studio_connection_native.py'))
probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)


class CurrentConnectionTests(unittest.TestCase):
    def report(self,phase):
        details=dict(passed=True,contract=2,phase=phase,stage='complete',checks=list(probe.CHECKS[phase]),
                     clientTimings=[dict(actionStarted=1,requestStarted=2,requestEnded=3,completed=4),dict(actionStarted=5,requestStarted=6,requestEnded=7,completed=8)])
        if phase==2:details['reloadResponse']=dict(probe.RELOAD_RESPONSE)
        return dict(evidence='runtime-ui-packaged',case='studio-settings',passed=True,cleanupComplete=True,details=details)

    def test_current_report_requires_complete_case_contract_requests_timings_and_cleanup(self):
        for phase in (1,2):
            report=self.report(phase);requests=[dict(sequence=n+1,label=label,accepted=True) for n,label in enumerate(probe.SCHEDULE[phase])]
            probe.validate_report([report],phase,requests,0)
            for field,value in [('contract',1),('phase',3),('stage','open'),('passed',False),('checks',[]),('checks',report['details']['checks']*2),('clientTimings',[])]:
                bad=copy.deepcopy(report);bad['details'][field]=value
                with self.subTest(phase=phase,field=field),self.assertRaises(ValueError):probe.validate_report([bad],phase,requests,0)
            for field,value in [('case','old'),('passed',False),('cleanupComplete',False),('evidence','mock')]:
                bad=copy.deepcopy(report);bad[field]=value
                with self.assertRaises(ValueError):probe.validate_report([bad],phase,requests,0)
            for reports in ([],[report,report]):
                with self.assertRaises(ValueError):probe.validate_report(reports,phase,requests,0)
            for changed in (requests[:-1],requests+requests[:1],list(reversed(requests))):
                with self.assertRaises(ValueError):probe.validate_report([report],phase,changed,0)
            with self.assertRaises(ValueError):probe.validate_report([report],phase,requests,1)
            if phase==2:
                del report['details']['reloadResponse']
                with self.assertRaises(ValueError):probe.validate_report([report],phase,requests,0)

    def test_current_publication_requires_exact_settings_revision_ownership_and_unrelated_profiles(self):
        before=probe.read(probe.legacy.FIXTURE);after=copy.deepcopy(before);after['revision']+=2
        target=after['profiles'][0];target.update(revision=2,credential=dict(credentialId='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',origin='http://127.0.0.1:46082',revision=1))
        target['settings'].update(contextCeiling=4096,thinking=True,temperature=1.0,topP=.95,modelLoad=dict(parallel=1,gpuMemoryMode='manual',fit='off'))
        probe.validate_saved(before,after,probe.legacy.A)
        for key,value in [('revision',99),('cleanup',[]),('developmentGenerations',[])]:
            bad=copy.deepcopy(after);bad[key]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        for field,value in [('thinking',False),('contextCeiling',8192),('model','other')]:
            bad=copy.deepcopy(after);bad['profiles'][0]['settings'][field]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        for field,value in [('service','app.loomlight'),('storage',{'kind':'developmentFile'}),('revision',2),('credentialId','not-a-uuid')]:
            bad=copy.deepcopy(after);bad['profiles'][0]['credential'][field]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        bad=copy.deepcopy(after);bad['profiles'][1]['settings']['label']='changed'
        with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)

    def test_bad_host_candidate_and_ordinal_refuse_before_build_or_output(self):
        with tempfile.TemporaryDirectory() as directory:
            out=Path(directory)/'attempt'
            with patch.object(probe.platform,'system',return_value='Darwin'),patch.object(probe.subprocess,'run') as dispatch:
                with self.assertRaises(ValueError):probe.build(out,'candidate',1)
                dispatch.assert_not_called();self.assertFalse(out.exists())
            with patch.object(probe.platform,'system',return_value='Windows'),patch.object(probe.platform,'machine',return_value='AMD64'),patch.dict(probe.os.environ,{'GITHUB_RUN_ATTEMPT':'2'}):
                with self.assertRaises(ValueError):probe.build(out,'candidate',1)
                self.assertFalse(out.exists())

    def test_failed_build_retains_exclusive_attempt_and_never_creates_positive_package(self):
        with tempfile.TemporaryDirectory() as directory:
            out=Path(directory)/'attempt'
            with patch.object(probe.platform,'system',return_value='Windows'),patch.object(probe.platform,'machine',return_value='AMD64'),patch.dict(probe.os.environ,{'GITHUB_RUN_ATTEMPT':'1'}),patch.object(probe.subprocess,'check_output',return_value='candidate\n'),patch.object(probe.legacy,'configure_npm_hook'),patch.object(probe,'native'),patch.object(probe.subprocess,'Popen',side_effect=OSError('controlled spawn failure')):
                with self.assertRaises(OSError):probe.build(out,'candidate',1)
                self.assertTrue((out/'build-attempt.json').exists())
                self.assertFalse(probe.read(out/'build-result.json')['passed'])
                self.assertFalse((out/'package.json').exists())
                with self.assertRaises(FileExistsError):probe.build(out,'candidate',1)

    def test_native_receipt_rejects_unowned_focus_children_failed_retry_or_cleanup(self):
        receipt=dict(contract=2,stage='entry-alpha',step='alpha-entry',phase=1,passed=True,processId=42,inputDesktop='Default',executableSHA256='digest',
            checks=dict(interactiveDesktop=True,ownedWindow=True,osMouseInput=True,osKeyboardInput=True,failedEntryRetained=True,retainedInputRetry=True,nativeCredentialEntry=True),
            cleanup=dict(modal=True,faultRestored=True),dialog=dict(processId=42,handle=9,owner=8,**{'class':'#32770'},owned=True,foregroundConfirmed=True,maskedFieldFocusConfirmed=True,focusedFieldHandle=110,clickedChildIds=[100,1,1],
                children=[dict(id=n,handle=110 if n==100 else 20+n,parent=9,processId=42,count=1,matched=True,visible=True,enabled=True,kind='Edit' if n==100 else 'Button',password=n==100,style=0x40000020 if n==100 else 0x40000000) for n in (100,1,2)]))
        args=('entry-alpha','alpha-entry',1,42,'digest',Path('.'))
        probe.validate_native(receipt,*args)
        for field,value in [('owned',False),('foregroundConfirmed',False),('maskedFieldFocusConfirmed',False),('children',[])]:
            bad=copy.deepcopy(receipt);bad['dialog'][field]=value
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field in receipt['checks']:
            bad=copy.deepcopy(receipt);bad['checks'][field]=False
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field in receipt['cleanup']:
            bad=copy.deepcopy(receipt);bad['cleanup'][field]=False
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field,value in [('kind','Text'),('password',False),('style',0),('parent',99),('handle',0)]:
            bad=copy.deepcopy(receipt);bad['dialog']['children'][0][field]=value
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)


if __name__=='__main__':unittest.main()
