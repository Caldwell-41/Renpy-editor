import importlib.util
import json
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('walkthrough',Path(__file__).with_name('macos-studio-request.py'))
walkthrough=importlib.util.module_from_spec(spec)
spec.loader.exec_module(walkthrough)
class SyntheticRequestTests(unittest.TestCase):
    def test_exact_public_auth_path_body_and_no_project_data(self):
        body={'model':'synthetic-model','messages':[{'role':'user','content':walkthrough.PROMPT}],'stream':False,'max_tokens':1024,'enable_thinking':False,'enable_tools':False,'enabled_tools':[]}
        self.assertTrue(walkthrough.accepted('POST','/v1/chat/completions','Bearer '+walkthrough.PUBLIC_KEY,body))
        for method,path,key,value in [('GET','/v1/models',walkthrough.PUBLIC_KEY,body),('POST','/v1/chat/completions','wrong',body),('POST','/other',walkthrough.PUBLIC_KEY,body),('POST','/v1/chat/completions',walkthrough.PUBLIC_KEY,{**body,'session_id':'unsupported'}),('POST','/v1/chat/completions',walkthrough.PUBLIC_KEY,{**body,'messages':[{'role':'user','content':'project content refused'}]})]:
            self.assertFalse(walkthrough.accepted(method,path,'Bearer '+key,value))
    def test_complete_manifest_contains_request_and_boundaries(self):
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
if __name__=='__main__':unittest.main()
