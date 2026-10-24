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
        session = dict(protocol=1, complete=True, clockValidated=True, failure=None)
        events = [dict(id='text-1', beforeNs=1_000_000_000, afterNs=1_000_100_000),
                  dict(id='text-2', beforeNs=1_200_000_000, afterNs=1_200_100_000)]
        frames = [dict(displayNs=999_000_000, arrivalNs=1_000_000_000, sha256='0' * 64),
                  dict(displayNs=1_050_000_000, arrivalNs=1_080_000_000, sha256='a' * 64),
                  dict(displayNs=1_299_000_000, arrivalNs=1_350_000_000, sha256='b' * 64)]
        return plan, events, frames, session

    def test_uses_display_time_and_nearest_rank_per_series(self):
        report = analyze(*self.receipt())
        self.assertTrue(report['arithmeticPass'])
        self.assertEqual(report['series']['text']['p95Ms'], 99)
        self.assertEqual(report['series']['text']['within100ms'], 2)
        self.assertFalse(report['nativePresentationQualified'])

    def test_already_visible_pixels_cannot_count_as_a_response(self):
        receipt = self.receipt()
        receipt[2][0]['sha256'] = 'a' * 64
        report = analyze(*receipt)
        self.assertFalse(report['arithmeticPass'])
        self.assertIsNone(report['samples'][0]['latencyMs'])

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


if __name__ == '__main__':
    unittest.main()
