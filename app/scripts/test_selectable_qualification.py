"""Focused rejection gates; these fixtures are not native/SDK acceptance evidence."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from rewrite_probe_gate import SELECTABLE_CHECKS,validate_report
from rewrite_native_evidence import required_stages,validate_native_stage
from test_rewrite_native_evidence import png

def module(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
q=module('qualification','qualify-selectable.py');sdk=module('sdk_test','selectable-sdk.py');evidence=module('evidence','selectable-evidence.py')
def seal_child(child):
    evidence.write(child/'cleanup.json',{'cleanupComplete':True})
    evidence.write(child/'manifest.json',{'schemaVersion':1,'files':{p.relative_to(child).as_posix():evidence.sha(p) for p in child.rglob('*') if p.is_file() and p.name!='manifest.json'}})
class Gates(unittest.TestCase):
    def test_renderer_requires_exact_nonzero_unskipped(self):
        good=''.join(f'ℹ {k} {v}\n' for k,v in [('tests',132),('pass',132),('fail',0),('cancelled',0),('skipped',0),('todo',0)])
        q.renderer_gate(good)
        for bad in ['',good.replace('pass 132','pass 0'),good.replace('skipped 0','skipped 1')]:
            with self.assertRaises(AssertionError):q.renderer_gate(bad)
    def test_cargo_requires_exact_passes(self):
        good='test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured;'
        q.cargo_gate(good,8)
        for bad in ['',good.replace('8 passed','0 passed'),good.replace('0 ignored','1 ignored')]:
            with self.assertRaises(AssertionError):q.cargo_gate(bad,8)
    def test_gate_tests_cannot_be_empty(self):
        q.unittest_gate('Ran 8 tests in 0.1s\n\nOK\n',8)
        for bad in ['Ran 0 tests in 0.1s\n\nOK\n','Ran 8 tests in 0.1s\n\nFAILED\n','Ran 8 tests in 0.1s\n\nOK (skipped=1)\n']:
            with self.assertRaises(AssertionError):q.unittest_gate(bad,8)
    def test_manifest_requires_exact_bytes_and_file_set(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);(root/'proof').write_text('exact');v={'schemaVersion':1,'files':{'proof':q.sha(root/'proof')}};q.manifest_gate(root,v)
            (root/'proof').write_text('tampered')
            with self.assertRaises(AssertionError):q.manifest_gate(root,v)
    def test_batch_report_requires_all_checks_digests_cleanup(self):
        good={'case':'dialogue-rewrite','passed':True,'cleanupComplete':True,'details':{'action':'editScene','stage':'complete','passed':True,'checks':list(SELECTABLE_CHECKS[1]),'reviewedBodyDigests':['a'*64]*6}}
        validate_report(good,1,batch=True)
        for edit in [lambda v:v.update(cleanupComplete=False),lambda v:v['details'].update(checks=[]),lambda v:v['details'].update(reviewedBodyDigests=[]),lambda v:v['details'].update(action='rewriteDialogue'),lambda v:v.update(passed=False)]:
            bad=copy.deepcopy(good);edit(bad)
            with self.assertRaises(ValueError):validate_report(bad,1,batch=True)
    def test_native_selection_requires_os_keyboard_dependency_and_focus(self):
        self.assertIn('physical-select',required_stages(batch=True))
        with tempfile.TemporaryDirectory() as t:
            r={'stage':'physical-select','passed':True,'processId':123,'executableSHA256':'a'*64,'action':'editScene','inputDesktop':'Default','layer':'Windows UI Automation observation and OS SendInput; automated, not human acceptance','checks':{'ownedWindow':True,'nativeControls':True,'captureNonblank':True,'controlsInViewport':True},'captures':[]}
            (Path(t)/'physical-select.json').write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,'native observation/action'):validate_native_stage(t,'physical-select',123,'a'*64,batch=True)
            for key in ('selectionInitiallyChecked','selectionInputFocusObserved','osKeyboardInput','selectionUncheckedObserved','dependencyRefusalObserved','selectionFocusRetained'):r['checks'][key]=True
            for i in range(2):
                data=png(i);name=f'physical-select-{i}.png';(Path(t)/name).write_bytes(data);r['captures'].append({'file':name,'width':200,'height':100,'sha256':q.sha(Path(t)/name),'sampleRange':80})
            (Path(t)/'physical-select.json').write_text(json.dumps(r));validate_native_stage(t,'physical-select',123,'a'*64,batch=True)
            for key in ('selectionInitiallyChecked','selectionInputFocusObserved','selectionUncheckedObserved','selectionFocusRetained'):
                bad=copy.deepcopy(r);bad['checks'][key]=False;(Path(t)/'physical-select.json').write_text(json.dumps(bad))
                with self.assertRaisesRegex(ValueError,'native observation/action'):validate_native_stage(t,'physical-select',123,'a'*64,batch=True)
    def test_sdk_requires_two_exact_contained_cases(self):
        with self.assertRaises(AssertionError):sdk.validate({'schemaVersion':1,'cases':[]})
        case={'schemaVersion':1,'source':{'game/../../escape.rpy':'x'},'sourceSHA256':{'game/../../escape.rpy':'a'*64},'scenes':[{'id':'a','label':'wrong','path':'game/../../escape.rpy'}]}
        with self.assertRaises(AssertionError):sdk.validate({'schemaVersion':1,'cases':[case,case]})
    def test_bootstrap_failure_is_retained_without_qualification_or_attempts(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'fresh';evidence.prepare(root,{'candidate':'a'*40,'runId':'1'})
            self.assertFalse(evidence.finish(root))
            value=json.loads((root/'pipeline.json').read_text());self.assertFalse(value['passed']);self.assertFalse(value['qualificationPresent']);self.assertEqual(value['packageBuilds'],0);self.assertEqual(value['appLaunches'],0)
            manifest=json.loads((root/'artifact-manifest.json').read_text());self.assertIn('bootstrap.json',manifest['files']);self.assertIn('pipeline.json',manifest['files'])
            with self.assertRaises(FileExistsError):evidence.prepare(root,{'candidate':'a'*40,'runId':'1'})
    def test_wrong_cached_archive_refuses_and_retains_failed_receipt(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'fresh';evidence.prepare(root,{'candidate':'a'*40,'runId':'1'});archive=Path(t)/evidence.SDK_NAME;archive.write_bytes(b'wrong public fixture')
            with self.assertRaises(AssertionError):evidence.acquire(root,archive)
            receipt=json.loads((root/'bootstrap.json').read_text());self.assertFalse(receipt['sdkAcquisitionPassed']);self.assertIn('differs from published pin',receipt['failure']);self.assertFalse(evidence.finish(root))
    def test_pipeline_attempt_ledger_cannot_be_replaced_by_success_flag(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'fresh';evidence.prepare(root,{'candidate':'a'*40,'runId':'1'});receipt=json.loads((root/'bootstrap.json').read_text());receipt['sdkAcquisitionPassed']=True;evidence.write(root/'bootstrap.json',receipt)
            child=root/'qualification';child.mkdir();evidence.write(child/'identity.json',receipt);evidence.write(child/'result.json',{'passed':True,'packageBuilds':0,'appLaunches':0});evidence.write(child/'attempt-ledger.json',[{'kind':'package-build','ordinal':1}])
            seal_child(child);self.assertFalse(evidence.finish(root));evidence.write(child/'result.json',{'passed':True,'packageBuilds':1,'appLaunches':0});seal_child(child);self.assertTrue(evidence.finish(root))
            evidence.write(child/'cleanup.json',{'cleanupComplete':False});seal={p.relative_to(child).as_posix():evidence.sha(p) for p in child.rglob('*') if p.is_file() and p.name!='manifest.json'};evidence.write(child/'manifest.json',{'schemaVersion':1,'files':seal});self.assertFalse(evidence.finish(root))
            seal_child(child);(child/'unexpected.txt').write_text('public fixture');self.assertFalse(evidence.finish(root))
            manifest=json.loads((root/'artifact-manifest.json').read_text());self.assertIn('qualification/attempt-ledger.json',manifest['files'])
    def test_pipeline_rejects_malformed_evidence_and_mismatched_identity(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'fresh';identity={'candidate':'a'*40,'runId':'1','attempt':1,'os':'Darwin','architecture':'arm64'};evidence.prepare(root,identity)
            receipt=json.loads((root/'bootstrap.json').read_text());receipt['sdkAcquisitionPassed']=True;evidence.write(root/'bootstrap.json',receipt)
            child=root/'qualification';child.mkdir();evidence.write(child/'identity.json',{**identity,'candidate':'b'*40});evidence.write(child/'result.json',{'passed':True,'packageBuilds':0,'appLaunches':0})
            seal_child(child);self.assertFalse(evidence.finish(root));evidence.write(child/'identity.json',identity);(child/'attempt-ledger.json').write_text('{broken');seal_child(child)
            self.assertFalse(evidence.finish(root));self.assertIn('attempt-ledger.json',json.loads((root/'pipeline.json').read_text())['failure'])
            evidence.write(child/'attempt-ledger.json',['invalid']);self.assertFalse(evidence.finish(root))
    def test_npm_routes_through_pinned_node_cli_without_shell(self):
        with tempfile.TemporaryDirectory() as t:
            cli=Path(t)/'npm-cli.js';cli.write_text('// public test')
            with patch.dict('os.environ',{'REWRITE_NPM_CLI':str(cli)}),patch.object(q.shutil,'which',return_value='/public/node'):
                self.assertEqual(q.command(['npm','run','check']),[str(Path('/public/node')),str(cli),'run','check'])
        self.assertEqual(q.command(['cargo','test']),['cargo','test'])
if __name__=='__main__':unittest.main()
