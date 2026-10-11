"""Focused rejection gates; these fixtures are not native/SDK acceptance evidence."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from rewrite_probe_gate import SELECTABLE_CHECKS,validate_report
from rewrite_native_evidence import required_stages,validate_native_stage

def module(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
q=module('qualification','qualify-selectable.py');sdk=module('sdk_test','selectable-sdk.py')
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
    def test_sdk_requires_two_exact_contained_cases(self):
        with self.assertRaises(AssertionError):sdk.validate({'schemaVersion':1,'cases':[]})
        case={'schemaVersion':1,'source':{'game/../../escape.rpy':'x'},'sourceSHA256':{'game/../../escape.rpy':'a'*64},'scenes':[{'id':'a','label':'wrong','path':'game/../../escape.rpy'}]}
        with self.assertRaises(AssertionError):sdk.validate({'schemaVersion':1,'cases':[case,case]})
    def test_npm_routes_through_pinned_node_cli_without_shell(self):
        with tempfile.TemporaryDirectory() as t:
            cli=Path(t)/'npm-cli.js';cli.write_text('// public test')
            with patch.dict('os.environ',{'REWRITE_NPM_CLI':str(cli)}),patch.object(q.shutil,'which',return_value='/public/node'):
                self.assertEqual(q.command(['npm','run','check']),['/public/node',str(cli),'run','check'])
        self.assertEqual(q.command(['cargo','test']),['cargo','test'])
if __name__=='__main__':unittest.main()
