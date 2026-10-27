"""The SDK gate rejects an unmatched Cargo selector and incomplete runtime evidence."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from composition_sdk_evidence import CASE, verify


class CompositionSdkEvidenceTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.log = self.root / 'sdk.log'
        self.log.write_text(f'test {CASE} ... ok\ntest result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 466 filtered out; finished in 1.0s\n')
        self.source = self.root / 'accepted.rpy'
        self.source.write_bytes(b'screen travel_notes():\n    pass\n')
        digest = hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.receipts = []
        for kind in ('validate', 'run'):
            status = dict(cleanupComplete=True, outputTruncated=False, exitCode=0,
                          phase='exited' if kind == 'validate' else 'cancelled', output='OWNED_COMPOSITION_PREVIEW {}')
            self.receipts.append(dict(kind=kind, terminal=status, preparation=dict(preview=dict(expectedRevision=digest, screenName='travel_notes'))))
            self.write(f'{kind}-terminal.json', dict(status=status, diagnostics=dict(diagnostics=[])))
        self.result = dict(passed=True, composition=True, nativeWebView=False, acceptedSHA256=digest, receipts=self.receipts)
        self.write('result.json', self.result)
        (self.root / 'preview.png').write_bytes(b'\x89PNG\r\n\x1a\n')

    def write(self, name, value):
        (self.root / name).write_text(json.dumps(value), encoding='utf-8')

    def verify(self):
        verify(self.log, self.root, self.source, 'windows')

    def test_real_case_and_receipts_are_required_even_when_cargo_exits_zero(self):
        self.verify()
        for output in ('', 'test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 467 filtered out; finished in 0.0s\n',
                       f'test {CASE} ... ignored\ntest result: ok. 0 passed; 0 failed; 1 ignored; 0 measured; 466 filtered out; finished in 0.0s\n'):
            self.log.write_text(output)
            with self.assertRaises(ValueError):
                self.verify()

    def test_source_or_missing_receipt_cannot_reuse_an_unrelated_pass(self):
        self.source.write_bytes(b'screen different():\n    pass\n')
        with self.assertRaises(ValueError):
            self.verify()
        (self.root / 'result.json').unlink()
        with self.assertRaises(FileNotFoundError):
            self.verify()

    def test_failed_cleanup_or_runtime_diagnostic_is_not_a_pass(self):
        self.result['receipts'][1]['terminal']['cleanupComplete'] = False
        self.write('result.json', self.result)
        with self.assertRaises(ValueError):
            self.verify()
        self.result['receipts'][1]['terminal']['cleanupComplete'] = True
        self.write('result.json', self.result)
        self.write('run-terminal.json', dict(status=self.receipts[1]['terminal'], diagnostics=dict(diagnostics=[dict(severity='error')])))
        with self.assertRaises(ValueError):
            self.verify()


if __name__ == '__main__':
    unittest.main()
