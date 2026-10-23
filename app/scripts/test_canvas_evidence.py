"""Admission rejects incomplete native canvas receipts; fixtures are not rendering proof."""
import base64
import copy
import struct
import unittest
import zlib
from runtime_probe_cases import runtime_report_ok


def png(width, height):
    def chunk(kind, data):
        return struct.pack('>I', len(data))+kind+data+struct.pack('>I', zlib.crc32(kind+data))
    raw=(b'\x00'+b'\x20\x29\x38\xff'*width)*height
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')


def receipt():
    stages=['project-frame-passed','draft-cancel-focus-passed','source-history-passed','second-aspect-passed','logical-pixels-passed','project-close-passed','complete']
    return dict(evidence='runtime-ui-packaged',case='canvas-helper',passed=True,cleanupComplete=True,details=dict(
        scenario='canvas-helper',stage='complete',targetOs='macos',canvasShutdown=dict(cleanupComplete=True,cooperative=True,exitCode=0),stages=[dict(stage=s) for s in stages],nativeWebView=True,nativeKeyboard=False,nativeFocusObserved=False,warmPresentationProof=False,startupImageLoadMilliseconds=1000,
        frames=[dict(width=w,height=h,revision='a'*64,phase='ready',renderer='gl2',image='data:image/png;base64,'+base64.b64encode(png(w,h)).decode(),
                     geometry=[dict(start=113,x=x,y=y,width=640,height=360)]) for w,h,x,y in [(1280,720,320,180),(1024,768,192,204)]]))


class CanvasEvidence(unittest.TestCase):
    def test_external_observation_requires_helper_samples_and_no_focus_or_window_failure(self):
        from canvas_evidence import canvas_observation_ok
        baseline = dict(editorPID=10, helperPIDs=[11], stopped=True, samples=50, helperSamples=40,
                        visibleSamples=0, foregroundChanges=0, inventoryFailures=0,
                        maximumSampleGapMilliseconds=8, activationEventsObserved=True, activationChanges=0)
        self.assertTrue(canvas_observation_ok(baseline, 10, 'macos'))
        for key, value in [('helperPIDs', []), ('helperSamples', 0), ('foregroundChanges', 1),
                           ('visibleSamples', 1), ('inventoryFailures', 1), ('activationChanges', 1),
                           ('activationEventsObserved', False), ('stopped', False)]:
            self.assertFalse(canvas_observation_ok(dict(baseline, **{key:value}), 10, 'macos'))
        windows = dict(baseline, activationEventsObserved=False, activationChanges=None)
        self.assertTrue(canvas_observation_ok(windows, 10, 'windows'))
        self.assertFalse(canvas_observation_ok(windows, 12, 'windows'))

    def test_accepts_complete_functional_receipt(self):
        self.assertTrue(runtime_report_ok('canvas-helper',receipt()))

    def test_rejects_missing_duplicate_failed_or_wrong_results(self):
        baseline=receipt()
        mutations=[lambda r:r['details']['frames'][0].update(renderer='sw'),lambda r:r['details']['canvasShutdown'].update(cooperative=False),lambda r:r['details'].pop('canvasShutdown'),lambda r:r.update(passed=False),lambda r:r.update(cleanupComplete=False),
                   lambda r:r['details'].pop('startupImageLoadMilliseconds'),lambda r:r['details'].update(startupImageLoadMilliseconds=float('nan')),lambda r:r['details'].update(startupImageLoadMilliseconds=-1),lambda r:r['details'].update(frames=[]),lambda r:r['details']['stages'].pop(0),
                   lambda r:r['details']['stages'].insert(0,dict(stage='project-frame-passed')),
                   lambda r:r['details'].update(nativeWebView=False),lambda r:r['details'].update(nativeFocusObserved=True),
                   lambda r:r['details'].update(warmPresentationProof=True),
                   lambda r:r['details']['frames'][0].update(image='data:image/png;base64,broken'),
                   lambda r:r['details']['frames'][0].update(width=1024),
                   lambda r:r['details']['frames'][1]['geometry'][0].update(x=320)]
        for mutation in mutations:
            value=copy.deepcopy(baseline);mutation(value)
            with self.subTest(mutation=mutations.index(mutation)):
                self.assertFalse(runtime_report_ok('canvas-helper',value))


if __name__=='__main__':
    unittest.main()
