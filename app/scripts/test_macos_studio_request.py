import importlib.util
import json
from pathlib import Path
import unittest
import tempfile
spec=importlib.util.spec_from_file_location('walkthrough',Path(__file__).with_name('macos-studio-request.py'))
walkthrough=importlib.util.module_from_spec(spec)
spec.loader.exec_module(walkthrough)
class SyntheticRequestTests(unittest.TestCase):
    def test_exact_public_auth_path_body_and_no_project_data(self):
        body={'model':'synthetic-model','messages':[{'role':'user','content':walkthrough.PROMPT}],'stream':False,'max_tokens':1024,'enable_thinking':False,'enable_tools':False,'enabled_tools':[]}
        self.assertTrue(walkthrough.accepted('POST','/v1/chat/completions','Bearer '+walkthrough.PUBLIC_KEY,body))
        for method,path,key,value in [('GET','/v1/models',walkthrough.PUBLIC_KEY,body),('POST','/v1/chat/completions','wrong',body),('POST','/other',walkthrough.PUBLIC_KEY,body),('POST','/v1/chat/completions',walkthrough.PUBLIC_KEY,{**body,'session_id':'unsupported'}),('POST','/v1/chat/completions',walkthrough.PUBLIC_KEY,{**body,'messages':[{'role':'user','content':'project content refused'}]})]:
            self.assertFalse(walkthrough.accepted(method,path,'Bearer '+key,value))
    def test_declared_manifest_contains_request_and_boundaries(self):
        manifest=walkthrough.manifest()
        for name in ['src-core/src/ai_request.rs','src-tauri/src/ai_requests.rs','src/studio-request-ui.ts','src-tauri/src/main.rs','src-tauri/capabilities/main.json','src-tauri/permissions/core-request.toml','Cargo.lock','src-tauri/tauri.conf.json','tests/fixtures/studio-request/profiles.json']:
            self.assertIn(name,manifest)
            self.assertEqual(len(manifest[name]),64)
    def test_fixture_never_seeds_credential_or_native_ownership(self):
        fixture=json.loads((walkthrough.package.APP/'tests/fixtures/studio-request/profiles.json').read_text())
        self.assertEqual(len(fixture['profiles']),1)
        self.assertIsNone(fixture['profiles'][0]['credential'])
        self.assertEqual(fixture['cleanup'],[])
        self.assertEqual(fixture['profiles'][0]['settings']['endpoint'],'http://127.0.0.1:46082/v1')
    def test_reserve_identity_refuses_before_any_dispatch(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-request-identity-test-') as temporary:
            output=Path(temporary)/'wrong-launch-name'
            with self.assertRaisesRegex(ValueError,'Exact bounded launch identity'):
                walkthrough.launch(Path('/unused'),output,2)
            self.assertFalse(output.exists())
    def test_known_unused_blocked_fixture_cleanup_requires_exact_seed_and_no_process(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-request-receipt-test-') as evidence:
            root=Path(tempfile.mkdtemp(prefix='loomlight-studio-request-'))
            output=Path(evidence)
            try:
                (root/'.request-owner').write_text(walkthrough.OWNER)
                (root/'synthetic-project/game').mkdir(parents=True)
                seed=json.loads((walkthrough.package.APP/'tests/fixtures/studio-request/profiles.json').read_text())
                (root/'ai-profiles.json').write_text(json.dumps(seed))
                for name,value in [('state.json',{'root':str(root)}),('exit.json',{'normal':False,'listenerStopped':True,'requests':0}),('operator-stop.json',{'reason':'locked'}),('launch.json',{'pid':99999999})]:
                    (output/name).write_text(json.dumps(value))
                seed['revision']=99;(root/'ai-profiles.json').write_text(json.dumps(seed))
                with self.assertRaisesRegex(ValueError,'Unused fixture changed'):walkthrough.cleanup(output)
                self.assertTrue(root.exists())
                seed['revision']=1;(root/'ai-profiles.json').write_text(json.dumps(seed))
                walkthrough.cleanup(output)
                self.assertFalse(root.exists())
                receipt=json.loads((output/'cleanup.json').read_text())
                self.assertEqual(receipt['credentialsCreated'],0)
                self.assertIsNone(receipt['credentialRemovedThroughProduct'])
            finally:
                if root.exists():
                    import shutil
                    shutil.rmtree(root)
if __name__=='__main__':unittest.main()
