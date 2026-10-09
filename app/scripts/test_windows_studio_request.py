import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('windows_request', Path(__file__).with_name('windows-studio-request.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class WindowsRequestTests(unittest.TestCase):
    def test_unused_cleanup_rejects_any_profile_change_before_deleting(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = p.create_root()
            output = Path(temporary) / 'launch-2'
            output.mkdir()
            try:
                p.w.write(output / 'state.json', {'root': str(root)})
                p.w.write(output / 'exit.json', {'stopped': True, 'listenerStopped': True, 'requests': 0})
                p.w.write(output / 'launch.json', {'pid': 99999999})
                seed = p.w.read(p.w.APP / 'tests/fixtures/studio-request/profiles.json')
                changed = copy.deepcopy(seed)
                changed['revision'] += 1
                (root / 'ai-profiles.json').write_text(json.dumps(changed))
                with patch.object(p, 'OUT', Path(temporary)), patch.object(p.w, 'pid_absent', return_value=True):
                    with self.assertRaisesRegex(ValueError, 'Untouched uncredentialled'):
                        p.cleanup_unused(2)
                    self.assertTrue(root.exists())
                    (root / 'ai-profiles.json').write_text(json.dumps(seed))
                    p.cleanup_unused(2)
                    self.assertFalse(root.exists())
            finally:
                if root.exists():
                    p.shutil.rmtree(root)

    def test_native_marker_is_exact_lf_bytes_before_launch(self):
        root = p.create_root()
        try:
            self.assertEqual((root / '.request-owner').read_bytes(), b'loomlight-studio-request-v1\n')
            self.assertEqual([path.name for path in root.iterdir()], ['.request-owner'])
        finally:
            (root / '.request-owner').unlink()
            root.rmdir()

    def test_runtime_identity_includes_every_request_boundary_and_seed(self):
        inputs = p.runtime_inputs()
        for name in ['src-core/src/ai_request.rs', 'src-tauri/src/ai_requests.rs',
                     'src-tauri/src/ai_native/windows.rs', 'src/studio-request-ui.ts',
                     'src-tauri/src/main.rs', 'src-tauri/capabilities/main.json',
                     'tests/fixtures/studio-request/profiles.json', 'Cargo.lock']:
            self.assertIn(name, inputs)

    def test_attempt_collision_ceiling_and_reserve_are_rejected_before_dispatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            original = p.OUT
            p.OUT = Path(temporary)
            try:
                with self.assertRaises(ValueError):
                    p.selected('launch', 4, 3)
                p.w.write(p.OUT / 'launch-1-attempt.json', {})
                with self.assertRaisesRegex(ValueError, 'reserved'):
                    p.selected('launch', 1, 3)
                p.w.write(p.OUT / 'launch-1-terminal.json', {'passed': True, 'stopped': True})
                p.w.write(p.OUT / 'launch-2-correction.json', {'diagnosis': 'fixture', 'correction': 'fixed'})
                with self.assertRaisesRegex(ValueError, 'terminal failure'):
                    p.selected('launch', 2, 3)
            finally:
                p.OUT = original

    def test_exact_saved_reference_required_for_cleanup(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            seed = p.w.read(p.w.APP / 'tests/fixtures/studio-request/profiles.json')
            saved = copy.deepcopy(seed)
            saved['revision'] += 2
            saved['profiles'][0]['revision'] += 1
            saved['profiles'][0]['credential'] = {
                'credentialId': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                'origin': 'http://127.0.0.1:46082', 'revision': 1}
            (root / 'ai-profiles.json').write_text(json.dumps(saved))
            self.assertEqual(p.validate_saved(root), saved)
            saved['profiles'][0]['settings']['model'] = 'unrelated'
            (root / 'ai-profiles.json').write_text(json.dumps(saved))
            with self.assertRaises(ValueError):
                p.validate_saved(root)

    def test_loopback_server_is_shared_and_body_remains_synthetic(self):
        self.assertEqual(p.m.start_server.__module__, 'request_walkthrough')
        body = {'model': 'synthetic-model', 'messages': [{'role': 'user', 'content': p.m.PROMPT}],
                'stream': False, 'max_tokens': 1024, 'enable_thinking': False,
                'enable_tools': False, 'enabled_tools': []}
        self.assertTrue(p.m.accepted('POST', '/v1/chat/completions', 'Bearer ' + p.m.PUBLIC_KEY, body))
        body['messages'][0]['content'] = 'project text'
        self.assertFalse(p.m.accepted('POST', '/v1/chat/completions', 'Bearer ' + p.m.PUBLIC_KEY, body))


if __name__ == '__main__':
    unittest.main()
