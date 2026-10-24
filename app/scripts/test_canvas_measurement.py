"""Offline receipt tests. These do not claim native capture or presentation proof."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from canvas_measurement import analyze


class MeasurementTests(unittest.TestCase):
    def receipt(self):
        plan = dict(endpoint='helper-content', actions=[
            dict(sample=dict(id='text-1', series='text', sha256='a' * 64)),
            dict(sample=dict(id='text-2', series='text', sha256='b' * 64))])
        session = dict(protocol=1, complete=True, clockValidated=True, failure=None, inputStartNs=1_000_000_000)
        events = [dict(id='text-1', beforeNs=1_000_000_000, afterNs=1_000_100_000),
                  dict(id='text-2', beforeNs=1_200_000_000, afterNs=1_200_100_000)]
        frames = [dict(displayNs=999_000_000, arrivalNs=1_000_000_000, sha256='0' * 64),
                  dict(displayNs=1_050_000_000, arrivalNs=1_080_000_000, sha256='a' * 64),
                  dict(displayNs=1_299_000_000, arrivalNs=1_350_000_000, sha256='b' * 64)]
        for i, (action, event) in enumerate(zip(plan['actions'], events)):
            action.update(kind='key', keyCode=0, atMs=i * 200)
            event.update(kind='key', keyCode=0, modifiers=0, nativeType=10,
                         scheduledNs=event['beforeNs'], eventNs=event['beforeNs'])
        return plan, events, frames, session

    def test_uses_display_time_and_nearest_rank_per_series(self):
        report = analyze(*self.receipt())
        self.assertTrue(report['arithmeticPass'])
        self.assertEqual(report['series']['text']['p95Ms'], 99)
        self.assertEqual(report['series']['text']['within100ms'], 2)
        self.assertFalse(report['nativePresentationQualified'])

    def test_identical_reference_pixels_do_not_prove_the_rendering_route(self):
        for endpoint in ('helper-content', 'settled-reference'):
            with self.subTest(endpoint=endpoint):
                receipt = self.receipt()
                receipt[0]['endpoint'] = endpoint
                report = analyze(*receipt)
                self.assertTrue(report['arithmeticPass'])
                self.assertEqual(report['series']['text']['within100ms'], 2)
                self.assertFalse(report['contentTimingQualified'])
                self.assertEqual(report['measurementScope'], 'reference-pixel-match')
                self.assertEqual(report['declaredEndpoint'], endpoint)

    def test_reference_hashes_cannot_be_relabelled_as_visible_or_confirmed_content(self):
        for endpoint in ('visible-content', 'settled-confirmation'):
            with self.subTest(endpoint=endpoint):
                receipt = self.receipt()
                receipt[0]['endpoint'] = endpoint
                with self.assertRaisesRegex(ValueError, 'reference|generation'):
                    analyze(*receipt)

    def test_invariant_content_keeps_the_same_transition_arithmetic(self):
        receipt = self.receipt()
        legacy = analyze(*receipt)
        receipt[0]['endpoint'] = 'visible-content'
        for action in receipt[0]['actions']:
            action['sample']['reference'] = dict(settled=action['sample']['sha256'])
        report = analyze(*receipt)
        self.assertEqual(report['series'], legacy['series'])
        self.assertEqual(report['samples'], legacy['samples'])
        self.assertTrue(report['arithmeticPass'])
        self.assertEqual(report['measurementScope'], 'invariant-content-reference-match')
        self.assertFalse(report['contentTimingQualified'])

    def test_already_visible_pixels_cannot_count_as_a_response(self):
        receipt = self.receipt()
        receipt[2][0]['sha256'] = 'a' * 64
        report = analyze(*receipt)
        self.assertFalse(report['arithmeticPass'])
        self.assertIsNone(report['samples'][0]['latencyMs'])

    def test_later_input_does_not_shorten_the_100ms_response_target(self):
        plan, events, frames, session = self.receipt()
        plan['actions'][1]['atMs'] = 16.7
        events[1].update(beforeNs=1_016_700_000, afterNs=1_016_800_000,
                         eventNs=1_016_700_000, scheduledNs=1_016_700_000)
        frames[1].update(displayNs=1_040_000_000, arrivalNs=1_041_000_000)
        frames[2].update(displayNs=1_060_000_000, arrivalNs=1_061_000_000)
        report = analyze(plan, events, frames, session)
        self.assertEqual(report['samples'][0]['latencyMs'], 40)
        self.assertTrue(report['arithmeticPass'])

    def test_unsampled_caret_action_does_not_clip_a_response(self):
        plan, events, frames, session = self.receipt()
        plan['actions'].insert(1, dict(atMs=10, kind='key', keyCode=123))
        events.insert(1, dict(id=None, kind='key', keyCode=123, modifiers=0,
                             nativeType=10, scheduledNs=1_010_000_000,
                             beforeNs=1_010_000_000, afterNs=1_010_100_000,
                             eventNs=1_010_000_000))
        report = analyze(plan, events, frames, session)
        self.assertEqual(report['samples'][0]['latencyMs'], 50)
        self.assertTrue(report['arithmeticPass'])

    def test_unresolved_repeated_state_is_ambiguous_not_a_later_success(self):
        plan, events, frames, session = self.receipt()
        plan['actions'][1]['sample']['sha256'] = 'a' * 64
        frames = [frames[0], dict(displayNs=1_250_000_000,
                                 arrivalNs=1_251_000_000, sha256='a' * 64)]
        report = analyze(plan, events, frames, session)
        self.assertEqual(report['series']['text']['ambiguous'], 2)
        self.assertTrue(all(row['latencyMs'] is None for row in report['samples']))
        self.assertFalse(report['arithmeticPass'])

    def test_revisit_after_observed_states_can_have_a_new_response(self):
        plan, events, frames, session = self.receipt()
        plan['actions'].append(dict(atMs=400, kind='key', keyCode=0,
                                    sample=dict(id='text-3', series='text', sha256='a' * 64)))
        events.append(dict(id='text-3', kind='key', keyCode=0, modifiers=0, nativeType=10,
                           beforeNs=1_400_000_000, afterNs=1_400_100_000,
                           scheduledNs=1_400_000_000, eventNs=1_400_000_000))
        frames.append(dict(displayNs=1_450_000_000, arrivalNs=1_451_000_000, sha256='a' * 64))
        report = analyze(plan, events, frames, session)
        self.assertTrue(report['arithmeticPass'])
        self.assertEqual(report['samples'][2]['latencyMs'], 50)

    def test_slow_wrong_and_missing_results_do_not_pass(self):
        for mode in ('slow', 'wrong', 'missing', 'superseded'):
            with self.subTest(mode=mode):
                plan, events, frames, session = self.receipt()
                if mode == 'slow':
                    frames[2].update(displayNs=1_301_000_000, arrivalNs=1_350_000_000)
                elif mode == 'wrong':
                    frames[2]['sha256'] = 'c' * 64
                elif mode == 'missing':
                    frames.pop()
                else:
                    frames[1].update(displayNs=1_201_000_000, arrivalNs=1_220_000_000)
                report = analyze(plan, events, frames, session)
                self.assertFalse(report['arithmeticPass'])

    def test_full_100_input_denominator_still_requires_95_observed_responses(self):
        for observed in (94, 95):
            plan, events, frames, session = self.receipt()
            action, event = plan['actions'][0], events[0]
            plan['actions'], events, frames = [], [], frames[:1]
            for i in range(100):
                a, e = copy.deepcopy(action), copy.deepcopy(event)
                sha, sample_id, ns = f'{i + 1:064x}', f'text-{i}', 1_000_000_000 + i * 200_000_000
                a.update(atMs=i * 200, sample=dict(id=sample_id, series='text', sha256=sha))
                e.update(id=sample_id, scheduledNs=ns, eventNs=ns, beforeNs=ns, afterNs=ns + 100_000)
                plan['actions'].append(a); events.append(e)
                if i < observed:
                    frames.append(dict(displayNs=ns + 50_000_000, arrivalNs=ns + 51_000_000, sha256=sha))
            report = analyze(plan, events, frames, session)
            self.assertEqual(report['series']['text']['inputs'], 100)
            self.assertEqual(report['series']['text']['unmatched'], 100 - observed)
            self.assertEqual(report['arithmeticPass'], observed == 95)

    def test_incomplete_receipt_or_clock_mapping_is_rejected(self):
        for mode in ('clock', 'incomplete', 'error', 'missing-input', 'duplicate-input', 'no-frames', 'frame-clock', 'input-clock'):
            with self.subTest(mode=mode):
                plan, events, frames, session = self.receipt()
                if mode == 'clock': session['clockValidated'] = False
                elif mode == 'incomplete': session['complete'] = False
                elif mode == 'error': session['failure'] = 'stream suspended'
                elif mode == 'missing-input': events.pop()
                elif mode == 'duplicate-input': events.append(copy.deepcopy(events[0]))
                elif mode == 'no-frames': frames.clear()
                elif mode == 'frame-clock': frames[1]['arrivalNs'] = 0
                elif mode == 'input-clock': events[0]['afterNs'] = 0
                with self.assertRaises(ValueError): analyze(plan, events, frames, session)

    def test_gesture_receipts_use_the_owned_window_coordinates(self):
        plan = dict(endpoint='helper-content', actions=[
            dict(atMs=0, kind='down', x=10, y=10),
            dict(atMs=100, kind='move', x=20, y=20, sample=dict(id='move-1', series='move', sha256='b' * 64)),
            dict(atMs=200, kind='up', x=20, y=20)])
        session = dict(protocol=1, complete=True, clockValidated=True, inputStartNs=1_000_000_000,
                       windowBounds=[100, 200, 500, 500])
        events = [dict(id=None, kind='down', nativeType=1, pointX=110, pointY=210, modifiers=0,
                       scheduledNs=1_000_000_000, beforeNs=1_000_000_000, afterNs=1_000_100_000, eventNs=1_000_000_000),
                  dict(id='move-1', kind='move', nativeType=6, pointX=120, pointY=220, modifiers=0,
                       scheduledNs=1_100_000_000, beforeNs=1_100_000_000, afterNs=1_100_100_000, eventNs=1_100_000_000),
                  dict(id=None, kind='up', nativeType=2, pointX=120, pointY=220, modifiers=0,
                       scheduledNs=1_200_000_000, beforeNs=1_200_000_000, afterNs=1_200_100_000, eventNs=1_200_000_000)]
        frames = [dict(displayNs=999_000_000, arrivalNs=999_500_000, sha256='0' * 64),
                  dict(displayNs=1_150_000_000, arrivalNs=1_160_000_000, sha256='b' * 64)]
        self.assertEqual(analyze(plan, events, frames, session)['series']['move']['p95Ms'], 50)
        events[1]['pointY'] = 221
        with self.assertRaises(ValueError): analyze(plan, events, frames, session)

    def test_cli_checks_retained_pixels_before_writing_a_report(self):
        for corrupt in (False, True):
            with self.subTest(corrupt=corrupt), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); (root / 'frames').mkdir()
                plan, events, frames, session = self.receipt()
                plan['crop'] = dict(width=2, height=2)
                for i, frame in enumerate(frames):
                    pixels = bytes([i, 0, 0, 255]) * 4
                    sha = hashlib.sha256(pixels).hexdigest(); frame.update(sha256=sha, width=2, height=2)
                    (root / 'frames' / (sha + '.rgba')).write_bytes(pixels)
                    if i: plan['actions'][i - 1]['sample']['sha256'] = sha
                if corrupt:
                    (root / 'frames' / (frames[-1]['sha256'] + '.rgba')).write_bytes(bytes(16))
                for name, value in [('plan', plan), ('session', session)]:
                    (root / (name + '.json')).write_text(json.dumps(value))
                for name, rows in [('inputs', events), ('frames', frames)]:
                    (root / (name + '.jsonl')).write_text(''.join(json.dumps(row) + '\n' for row in rows))
                result = subprocess.run([sys.executable, str(Path(__file__).with_name('canvas_measurement.py')), str(root)],
                                        capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode == 0, not corrupt, result.stderr)
                self.assertEqual((root / 'analysis.json').exists(), not corrupt)

    def test_wrong_posted_action_schedule_or_cleanup_receipt_is_rejected(self):
        for mode in ('kind', 'key', 'modifiers', 'schedule', 'stamp', 'cleanup'):
            with self.subTest(mode=mode):
                plan, events, frames, session = self.receipt()
                if mode == 'kind': events[0]['kind'] = 'up'
                elif mode == 'key': events[0]['keyCode'] = 12
                elif mode == 'modifiers': events[0]['modifiers'] = 1 << 20
                elif mode == 'schedule': events[1]['scheduledNs'] = 0
                elif mode == 'stamp': events[0]['eventNs'] = 0
                else: session['failures'] = dict(captureStop='stop failed')
                with self.assertRaises(ValueError): analyze(plan, events, frames, session)


if __name__ == '__main__':
    unittest.main()
