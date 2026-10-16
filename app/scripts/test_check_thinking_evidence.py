import importlib.util
from pathlib import Path
import unittest
import json
import tempfile
import subprocess
import hashlib

spec = importlib.util.spec_from_file_location('thinking_evidence', Path(__file__).with_name('check-thinking-evidence.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class GateTests(unittest.TestCase):
    listing = 'scope::first: test\nscope::second: test\n'
    output = 'test scope::first ... ok\ntest scope::second ... ok\ntest result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.01s\n'

    @staticmethod
    def python_log(runner):
        skipped = module.MAC_SNAPSHOT_TESTS if runner == 'Windows' else module.WINDOWS_NATIVE_TESTS
        rows = [f"{name.rsplit('.', 1)[1]} ({name}) ... " + ("skipped 'Requires other host'" if name in skipped else 'ok')
                for name in sorted(module.PYTHON_REQUIRED)]
        return '\n'.join(rows) + f'\n\nRan {len(rows)} tests in 0.01s\n\nOK (skipped={len(skipped)})\n'

    def test_python_gate_accepts_only_explicit_host_exclusions(self):
        for runner in ('Windows', 'macOS'):
            output = self.python_log(runner)
            result = module.verify_python(output, runner)
            expected = module.MAC_SNAPSHOT_TESTS if runner == 'Windows' else module.WINDOWS_NATIVE_TESTS
            self.assertEqual(result['hostExcluded'], sorted(expected))
            self.assertEqual(result['passed'], len(module.PYTHON_REQUIRED) - len(expected))
            self.assertEqual(module.verify_python(output.replace('\n', '\r\n'), runner), result)
            warned = output.replace(' ... ok', ' ... public fixture warning\n  warning context\nok', 1)
            self.assertEqual(module.verify_python(warned, runner), result)
            with self.assertRaises(ValueError):
                module.verify_python(output, 'unsupported')
            with self.assertRaises(ValueError):
                module.verify_python(output, 'Windows' if runner == 'macOS' else 'macOS')

    def test_python_gate_rejects_missing_extra_skipped_zero_and_failed_cases(self):
        for runner in ('Windows', 'macOS'):
            output = self.python_log(runner)
            for wrong in (output.replace(' ... ok', " ... skipped 'Blanket exclusion'", 1),
                          output.replace(' ... ok', ' ... FAIL', 1),
                          output.replace(' ... ok', ' ... expected failure', 1),
                          '\n'.join(output.splitlines()[1:]),
                          output.splitlines()[0] + '\n' + output,
                          output + '\nRan 9 tests in 0.01s\n\nOK\n',
                          output + '\nFAILED (failures=1)\n',
                          output.replace(f'Ran {len(module.PYTHON_REQUIRED)} tests', 'Ran 999 tests'),
                          output.replace(' ... ok', ' ... warning without a completed result', 1),
                          'Ran 0 tests in 0.01s\n\nOK\n'):
                with self.subTest(runner=runner, wrong=wrong), self.assertRaises(ValueError):
                    module.verify_python(wrong, runner)

    def test_complete(self):
        self.assertEqual(module.verify_cargo(self.listing, self.output), 2)

    def test_zero(self):
        with self.assertRaises(ValueError):
            module.verify_cargo('', 'test result: ok. 0 passed; 0 failed; 0 ignored;')

    def test_ignored(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output.replace('scope::second ... ok', 'scope::second ... ignored'))

    def test_duplicate(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output + 'test scope::first ... ok\n')

    def test_failed(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output.replace('2 passed; 0 failed', '1 passed; 1 failed'))

    def test_different_selection(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing.replace('scope::second', 'scope::other'), self.output)

    def test_failed_second_summary_and_measured_cases_refuse(self):
        for text in (self.output+'test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured;\n', self.output.replace('0 measured','1 measured')):
            with self.assertRaises(ValueError): module.verify_cargo(self.listing,text)

    def test_full_renderer_summary_and_required_cases(self):
        names=list(module.DOM_REQUIRED)
        log=''.join(f'ok {i+1} - {name}\n' for i,name in enumerate(names))
        log+=''.join(f'# {key} {value}\n' for key,value in [('tests',len(names)),('pass',len(names)),('fail',0),('cancelled',0),('skipped',0),('todo',0)])
        self.assertEqual(module.verify_dom(log),len(names))
        for bad in (log.replace(names[0],'unrelated case'),log.replace('# skipped 0','# skipped 1'),log.replace('# cancelled 0','# cancelled 1'),log+'# pass 5\n',log.replace('ok 1 -','not ok 1 -')):
            with self.assertRaises(ValueError):module.verify_dom(bad)
        with self.assertRaises(ValueError):module.verify_dom('# tests 0\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n')

    def test_compiled_binary_survives_a_later_failed_test_and_partial_build_is_explicit(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); build=root/'target'; build.mkdir(); output=root/'evidence';output.mkdir()
            binary=build/'core-tests';binary.write_bytes(b'public test binary fixture')
            (output/'core-artifacts.jsonl').write_text(json.dumps({'reason':'compiler-artifact','profile':{'test':True},'executable':str(binary)})+'\n')
            (output/'test.log').write_text('test failed')
            receipt=module.retain_binaries(output,build)
            self.assertEqual(receipt['core']['state'],'compiled')
            self.assertEqual((output/'core-tests.bin').read_bytes(),binary.read_bytes())
            self.assertEqual(receipt['desktop'],{'state':'not-compiled'})
            binary.unlink()  # Receipt keeps exact retained bytes independently of build cleanup.
            self.assertTrue((output/'core-tests.bin').is_file())

    def test_one_broken_binary_preserves_other_binary_and_failed_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);build=root/'target';build.mkdir();binary=build/'core';binary.write_bytes(b'public compiled fixture')
            row={'reason':'compiler-artifact','profile':{'test':True},'executable':str(binary)}
            (root/'core-artifacts.jsonl').write_text(json.dumps(row)+'\n')
            (root/'desktop-artifacts.jsonl').write_text('{broken json\n')
            with self.assertRaises(ValueError):module.retain_binaries(root,build)
            self.assertEqual((root/'core-tests.bin').read_bytes(),binary.read_bytes())
            receipt=json.loads((root/'test-binaries.json').read_text())
            self.assertEqual(receipt['core']['state'],'compiled')
            self.assertEqual(receipt['desktop']['state'],'retention-failed')

    def test_source_seal_uses_its_explicit_repository_and_rejects_changed_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);repo=root/'repo';repo.mkdir();(repo/'app').mkdir();source=repo/'app/input.txt';source.write_text('public fixture')
            git=lambda *args:subprocess.check_output(['git',*args],cwd=repo,stderr=subprocess.STDOUT)
            git('init');git('add','app/input.txt');git('-c','user.name=Public fixture','-c','user.email=fixture@example.com','commit','-m','Fixture')
            folder=root/'evidence';module.seal(folder,repo)
            identity=json.loads((folder/'identity.json').read_text());self.assertTrue(identity['sourceMatchesCandidate'])
            self.assertEqual(list(identity['inputs']),['app/input.txt'])
            module.seal(folder,repo,'harness-regressions')
            self.assertEqual(json.loads((folder/'identity.json').read_text())['outcome'],'harness-regressions')
            module.seal(folder,repo,'current-studio-connection')
            self.assertEqual(json.loads((folder/'identity.json').read_text())['outcome'],'current-studio-connection')
            source.write_text('changed bytes');module.seal(folder,repo)
            identity=json.loads((folder/'identity.json').read_text());self.assertFalse(identity['sourceMatchesCandidate']);self.assertEqual(identity['mismatchedTrackedInputs'],['app/input.txt'])

    def test_retained_binary_identity_requires_actual_unchanged_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);receipt={}
            for name in ('core','desktop'):
                data=(name+' public binary fixture').encode();file=name+'-tests.bin';(root/file).write_bytes(data)
                receipt[name]={'state':'compiled','file':file,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'header':data[:8].hex()}
            self.assertTrue(module.verify_binaries(root,receipt))
            (root/'core-tests.bin').write_bytes(b'changed');self.assertFalse(module.verify_binaries(root,receipt))
            (root/'core-tests.bin').unlink();self.assertFalse(module.verify_binaries(root,receipt))

    def test_binary_outside_build_or_duplicate_compiler_artifacts_refuse(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);build=root/'target';build.mkdir();binary=root/'outside';binary.write_bytes(b'fixture')
            row={'reason':'compiler-artifact','profile':{'test':True},'executable':str(binary)}
            stream=root/'core-artifacts.jsonl';stream.write_text(json.dumps(row)+'\n')
            with self.assertRaises(ValueError):module.retain_binaries(root,build)
            binary=build/'inside';binary.write_bytes(b'fixture');row['executable']=str(binary)
            stream.write_text((json.dumps(row)+'\n')*2)
            with self.assertRaises(ValueError):module.retain_binaries(root,build)


if __name__ == '__main__':
    unittest.main()
