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
        scenario='canvas-helper',stage='complete',stages=[dict(stage=s) for s in stages],nativeWebView=True,nativeKeyboard=False,nativeFocusObserved=False,warmPresentationProof=False,startupImageLoadMilliseconds=1000,
        frames=[dict(width=w,height=h,revision='a'*64,phase='ready',renderer='sw',image='data:image/png;base64,'+base64.b64encode(png(w,h)).decode(),
                     geometry=[dict(start=113,x=x,y=y,width=640,height=360)]) for w,h,x,y in [(1280,720,320,180),(1024,768,192,204)]]))


class CanvasEvidence(unittest.TestCase):
    def test_accepts_complete_functional_receipt(self):
        self.assertTrue(runtime_report_ok('canvas-helper',receipt()))

    def test_rejects_missing_duplicate_failed_or_wrong_results(self):
        baseline=receipt()
        mutations=[lambda r:r.update(passed=False),lambda r:r.update(cleanupComplete=False),
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
