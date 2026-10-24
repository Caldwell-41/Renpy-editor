"""Compiled CLI checks. No test captures a window, posts input or requests access."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


@unittest.skipUnless(os.environ.get('CANVAS_RECORDER_BINARY'), 'Set CANVAS_RECORDER_BINARY to the compiled Mac recorder')
class NativeRecorderTests(unittest.TestCase):
    def setUp(self):
        self.binary = Path(os.environ['CANVAS_RECORDER_BINARY']).resolve()
        self.plan = dict(protocolVersion=1, pid=2147483647, windowID=1, executableSHA256='0' * 64,
                         endpoint='helper-content', crop=dict(x=0, y=0, width=2, height=2), actions=[
                             dict(atMs=0, kind='key', keyCode=0,
                                  focus=dict(role='AXTextArea', label='Canvas text sample'),
                                  sample=dict(id='text-1', series='text', sha256='a' * 64))])

    def run_plan(self, plan, command='validate'):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); file = root / 'plan.json'; file.write_text(json.dumps(plan))
            output = root / 'must-not-be-created'
            args = [str(self.binary), command, str(file)] + ([str(output)] if command == 'record' else [])
            result = subprocess.run(args, capture_output=True, text=True, timeout=15)
            self.assertFalse(output.exists())
            return result

    def test_plan_validation_does_not_need_a_running_target(self):
        self.assertEqual(self.run_plan(self.plan).returncode, 0)

    def test_reference_capture_can_omit_inputs_but_measurement_cannot(self):
        self.plan['actions'] = []
        self.assertNotEqual(self.run_plan(self.plan).returncode, 0)
        self.plan['endpoint'] = 'reference'
        self.assertEqual(self.run_plan(self.plan).returncode, 0)

    def test_preflight_validates_host_clock_without_capture_or_input(self):
        result = subprocess.run([str(self.binary), 'preflight'], capture_output=True, text=True, timeout=15)
        self.assertIn(result.returncode, (0, 3))
        report = json.loads(result.stdout)
        self.assertTrue(report['clock']['validated'])
        self.assertLessEqual(report['clock']['beforeNs'], report['clock']['hostClockNs'])
        self.assertLessEqual(report['clock']['hostClockNs'], report['clock']['afterNs'])
        for flag in ('permissionRequestsMade', 'captureAttempted', 'inputPosted'):
            self.assertFalse(report[flag])

    def test_unavailable_access_or_nonexistent_target_refuses_before_capture(self):
        result = self.run_plan(self.plan, 'record')
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue('Permissions unavailable' in result.stderr or 'Target process unavailable' in result.stderr
                        or 'clock' in result.stderr.lower(), result.stderr)

    def test_bad_identity_schedule_focus_and_gesture_are_rejected(self):
        for mode in ('identity', 'schedule', 'focus', 'duplicate', 'held', 'coordinates'):
            with self.subTest(mode=mode):
                plan = copy.deepcopy(self.plan)
                if mode == 'identity': plan['executableSHA256'] = 'wrong'
                elif mode == 'schedule': plan['actions'][0]['atMs'] = -1
                elif mode == 'focus': del plan['actions'][0]['focus']
                elif mode == 'duplicate': plan['actions'].append(copy.deepcopy(plan['actions'][0]))
                elif mode == 'held': plan['actions'].append(dict(atMs=10, kind='down', x=1, y=1))
                else: plan['actions'].append(dict(atMs=10, kind='move', x=float('inf'), y=1))
                self.assertNotEqual(self.run_plan(plan).returncode, 0)


if __name__ == '__main__':
    unittest.main()
