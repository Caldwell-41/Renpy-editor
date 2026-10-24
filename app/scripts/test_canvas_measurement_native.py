"""Compiled CLI checks. No test captures a window, posts input or requests access."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from canvas_measurement import validate_content_references

@unittest.skipUnless(os.environ.get('CANVAS_RECORDER_BINARY'), 'Set CANVAS_RECORDER_BINARY to the compiled Mac recorder')
class NativeRecorderTests(unittest.TestCase):
    def setUp(self):
        self.binary = Path(os.environ['CANVAS_RECORDER_BINARY']).resolve()
        self.plan = dict(protocolVersion=1, pid=2147483647, windowID=1, executableSHA256='0' * 64,
                         endpoint='settled-reference', crop=dict(x=0, y=0, width=2, height=2), actions=[
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
        plan = copy.deepcopy(self.plan)
        plan['endpoint'] = 'settled-reference'
        self.assertEqual(self.run_plan(plan).returncode, 0)

    def test_slow_reference_hashes_cannot_admit_a_content_timing_workload(self):
        # Mirrors reference preparation: keep independently settled hashes and
        # compress the actions to the selected workload's cadence.
        for series in ('text', 'move', 'resize'):
            with self.subTest(series=series):
                plan = copy.deepcopy(self.plan)
                plan['endpoint'] = 'helper-content'
                focus = dict(role='AXButton', label='Move selected frame')
                plan['actions'] = []
                if series != 'text':
                    plan['actions'].append(dict(atMs=0, kind='down', x=10, y=10, focus=focus))
                for i in range(100):
                    action = dict(atMs=(i + 1) * (200 if series == 'text' else 1000 / 60),
                                  sample=dict(id=f'{series}-{i}', series=series, sha256=f'{i + 1:064x}'))
                    action.update(dict(kind='key', keyCode=0, focus=self.plan['actions'][0]['focus'])
                                  if series == 'text' else dict(kind='move', x=10 + i, y=10))
                    plan['actions'].append(action)
                if series != 'text':
                    plan['actions'].append(dict(atMs=2000, kind='up', x=109, y=10))
                result = self.run_plan(plan)
                self.assertNotEqual(result.returncode, 0, 'Settled references do not establish the workload route')
                self.assertIn('endpoint', result.stderr.lower())
                plan['endpoint'] = 'settled-reference'
                self.assertEqual(self.run_plan(plan).returncode, 0)
                for unsupported in ('visible-content', 'settled-confirmation'):
                    plan['endpoint'] = unsupported
                    self.assertNotEqual(self.run_plan(plan).returncode, 0)

    def test_reference_capture_can_omit_inputs_but_measurement_cannot(self):
        self.plan['actions'] = []
        self.assertNotEqual(self.run_plan(self.plan).returncode, 0)
        self.plan['endpoint'] = 'reference'
        self.assertEqual(self.run_plan(self.plan).returncode, 0)

    def test_route_invariance_covers_helper_rollover_without_relaxing_matching(self):
        plan = copy.deepcopy(self.plan)
        plan.update(endpoint='visible-content', moveRendering='isolated-panel')
        plan['actions'] = [
            dict(atMs=0, kind='down', x=10, y=10, focus=dict(role='AXButton', label='Move selected frame')),
            dict(atMs=16.7, kind='move', x=18, y=10, sample=dict(
                id='move-1', series='move', sha256='a' * 64,
                reference=dict(settled='a' * 64, translated={'baseline': 'a' * 64}))),
            dict(atMs=33.4, kind='move', x=26, y=10, sample=dict(
                id='move-2', series='move', sha256='b' * 64,
                reference=dict(settled='b' * 64, translated={'baseline': 'b' * 64, 'move-1': 'b' * 64}))),
            dict(atMs=50, kind='up', x=26, y=10)]
        for mode in ('invariant', 'settled-only', 'baseline-only', 'generation-rollover', 'confirmation', 'guide-as-content', 'unsampled-move'):
            with self.subTest(mode=mode):
                candidate = copy.deepcopy(plan)
                ref = candidate['actions'][2]['sample']['reference']
                if mode == 'settled-only': ref['translated'] = {}
                elif mode == 'baseline-only': del ref['translated']['move-1']
                elif mode == 'generation-rollover': ref['translated']['move-1'] = 'c' * 64
                elif mode == 'confirmation': candidate['endpoint'] = 'settled-confirmation'
                elif mode == 'guide-as-content': candidate['moveRendering'] = 'guides-only'
                elif mode == 'unsampled-move': candidate['actions'].insert(2, dict(atMs=25, kind='move', x=22, y=10))
                if mode == 'invariant':
                    validate_content_references(candidate)
                else:
                    with self.assertRaises(ValueError): validate_content_references(candidate)
                self.assertEqual(self.run_plan(candidate).returncode == 0, mode == 'invariant')

    def test_text_and_resize_require_current_content_not_translated_old_pixels(self):
        for series in ('text', 'resize'):
            with self.subTest(series=series):
                plan = copy.deepcopy(self.plan)
                plan['endpoint'] = 'visible-content'
                sample = plan['actions'][0]['sample']
                sample.update(series=series, reference=dict(settled=sample['sha256']))
                if series == 'resize':
                    plan['actions'] = [
                        dict(atMs=0, kind='down', x=10, y=10, focus=dict(role='AXButton', label='Resize selected element')),
                        dict(atMs=16.7, kind='move', x=18, y=18, sample=sample),
                        dict(atMs=33.4, kind='up', x=18, y=18)]
                validate_content_references(plan)
                self.assertEqual(self.run_plan(plan).returncode, 0)
                sample['reference']['translated'] = {'baseline': sample['sha256']}
                with self.assertRaises(ValueError): validate_content_references(plan)
                self.assertNotEqual(self.run_plan(plan).returncode, 0)

    def test_unsampled_keys_cannot_introduce_an_unreferenced_helper_state(self):
        plan = copy.deepcopy(self.plan)
        plan['endpoint'] = 'visible-content'
        plan['actions'][0]['sample']['reference'] = dict(settled='a' * 64)
        plan['actions'][0]['atMs'] = 200
        plan['actions'].insert(0, dict(atMs=0, kind='key', keyCode=0, focus=self.plan['actions'][0]['focus']))
        with self.assertRaises(ValueError): validate_content_references(plan)
        self.assertNotEqual(self.run_plan(plan).returncode, 0)

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
