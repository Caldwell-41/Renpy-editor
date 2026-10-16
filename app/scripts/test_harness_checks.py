import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('harness_checks', Path(__file__).with_name('run-harness-checks.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class HarnessChecks(unittest.TestCase):
    def test_failure_timeout_and_spawn_failure_keep_logs_and_do_not_hide_later_results(self):
        responses = iter((subprocess.CompletedProcess([], 1, 'public failed assertion\n', ''),
                          subprocess.TimeoutExpired([], 180, output=b'partial output', stderr=b'partial error'),
                          OSError('fixture spawn unavailable'),
                          subprocess.CompletedProcess([], 0, 'later independent pass\n', '')))

        def execute(*_args, **_kwargs):
            value = next(responses)
            if isinstance(value, Exception):
                raise value
            return value

        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stdout(io.StringIO()) as printed:
            root = Path(temp)
            records = module.run_checks(root, [(name, ['fixture'], None) for name in ('failed', 'timeout', 'spawn', 'later')], execute)
            self.assertEqual([row['passed'] for row in records], [False, False, False, True])
            self.assertTrue(records[1]['timedOut'])
            self.assertEqual((root / 'timeout.log').read_text(), 'partial outputpartial error')
            self.assertIn('public failed assertion', printed.getvalue())
            self.assertEqual(json.loads((root / 'checks.json').read_text()), records)

    def test_zero_exit_cannot_override_rejected_evidence(self):
        def reject(_text):
            raise ValueError('required case missing')
        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stdout(io.StringIO()):
            records = module.run_checks(Path(temp), [('case', ['fixture'], reject)],
                                       lambda *_args, **_kwargs: subprocess.CompletedProcess([], 0, 'OK', ''))
            self.assertFalse(records[0]['passed'])
            self.assertEqual(records[0]['exitCode'], 0)

    def test_retention_gate_rejects_missing_duplicate_and_unexpected_skipped_cases(self):
        source = module.ast.parse((module.APP / 'scripts/test-q1-package-retention.py').read_text())
        names = ['__main__.PackageRetentionTests.' + node.name
                 for cls in source.body if isinstance(cls, module.ast.ClassDef)
                 for node in cls.body if isinstance(node, module.ast.FunctionDef) and node.name.startswith('test_')]
        for host in ('Windows', 'macOS'):
            rows = [f"{name.rsplit('.', 1)[1]} ({name}) ... " +
                    ("skipped 'POSIX symlink creation required'" if host == 'Windows' and name.endswith('test_macos_tar_preserves_symlinks') else 'ok')
                    for name in names]
            log = '\n'.join(rows) + f'\n\nRan {len(names)} tests in 0.01s\n\nOK' + (' (skipped=1)' if host == 'Windows' else '') + '\n'
            module.retention_gate(log, host)
            module.retention_gate(log.replace('\n', '\r\n'), host)
            for bad in ('\n'.join(log.splitlines()[1:]), log + rows[0] + '\n',
                        log.replace(' ... ok', " ... skipped 'blanket skip'", 1),
                        log.replace(' ... ok', ' ... FAIL', 1)):
                with self.assertRaises(ValueError):
                    module.retention_gate(bad, host)


if __name__ == '__main__':
    unittest.main()
