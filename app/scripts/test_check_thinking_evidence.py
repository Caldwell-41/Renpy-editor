import copy
from functools import lru_cache
import importlib.util
from pathlib import Path
import unittest
import json
import tempfile
import subprocess
import hashlib
import struct
import sys
import zlib
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('thinking_evidence', Path(__file__).with_name('check-thinking-evidence.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

SHA = "0123456789abcdef0123456789abcdef01234567"


@lru_cache(maxsize=4)
def tiny_png(width=1440, height=900):
    """A valid RGB PNG at the requested viewport, using only the standard library."""
    def chunk(kind, data):
        return (struct.pack(">I", len(data)) + kind + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff))
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress((b"\x00" + b"\x10\x20\x30" * width) * height))
            + chunk(b"IEND", b""))


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


class IdentityTests(unittest.TestCase):
    def test_git_checkout_attributes_pass_but_changed_file_bytes_refuse(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / '.gitattributes').write_bytes(b'* text eol=lf\n*.ps1 text eol=crlf\n*.png binary\n')
            (root / 'fixture.ps1').write_bytes(b'Write-Output "synthetic"\r\n')
            (root / 'fixture.txt').write_bytes(b'synthetic\n')
            (root / 'fixture.png').write_bytes(b'\x00\xff\r\n\n')
            git = lambda *args: subprocess.check_output(['git', '-c', 'core.autocrlf=false', *args], cwd=root, stderr=subprocess.STDOUT)
            git('init', '--quiet')
            git('add', '--all')
            git('-c', 'user.name=Synthetic fixture', '-c', 'user.email=fixture@example.com',
                '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=disabled-fixture-hooks',
                'commit', '--quiet', '-m', 'Synthetic identity fixture')
            inputs = {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                      for path in root.iterdir() if path.is_file()}
            self.assertNotEqual(hashlib.sha256(git('show', 'HEAD:fixture.ps1')).hexdigest(), inputs['fixture.ps1'])
            self.assertEqual(module.candidate_mismatches(inputs, root), [])
            (root / 'fixture.ps1').write_bytes(b'Write-Output "changed"\r\n')
            inputs['fixture.ps1'] = hashlib.sha256((root / 'fixture.ps1').read_bytes()).hexdigest()
            self.assertEqual(module.candidate_mismatches(inputs, root), ['fixture.ps1'])
            (root / '.gitattributes').write_bytes(b'* text eol=lf\n')
            inputs['.gitattributes'] = hashlib.sha256((root / '.gitattributes').read_bytes()).hexdigest()
            self.assertIn('.gitattributes', module.candidate_mismatches(inputs, root))

    def test_complete_identity_required_without_waiving_partial_evidence_retention(self):
        report = {'candidate': SHA, 'tree': 'f' * 40, 'sourceMatchesCandidate': True,
                  'missingTrackedInputs': [], 'mismatchedTrackedInputs': []}
        self.assertTrue(module.identity_ok(report, SHA, 'f' * 40))
        for field, values in {
            'candidate': ['', 'e' * 40], 'tree': ['', 'e' * 40],
            'sourceMatchesCandidate': [False, 'true', 1, None],
            'missingTrackedInputs': [['fixture.txt'], None],
            'mismatchedTrackedInputs': [['fixture.ps1'], None],
        }.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    changed = copy.deepcopy(report)
                    changed[field] = value
                    self.assertFalse(module.identity_ok(changed, SHA, 'f' * 40))
            changed = copy.deepcopy(report)
            del changed[field]
            self.assertFalse(module.identity_ok(changed, SHA, 'f' * 40))


class BrowserTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        inputs = {
            "app/src/reference-ui.ts": hashlib.sha256(b"synthetic frontend input").hexdigest(),
            "app/src/ui-refresh.css": hashlib.sha256(b"synthetic theme input").hexdigest(),
            "app/tests/walkthrough-redesign.browser.mjs": hashlib.sha256(b"synthetic fixture input").hexdigest(),
        }
        identity = {"checkoutHead": SHA, "files": inputs}
        self.metrics = {"errors": [], "receipts": [],
                        "cleanup": {"browser": "closed", "server": "closed"},
                        "inputIdentity": {"unchanged": True, "before": copy.deepcopy(identity),
                                          "after": copy.deepcopy(identity)}}
        for surface in ["characters", "relationships", "knowledge", "history", "lorebook", "settings", "assist"]:
            for theme in ["light", "dark"]:
                for size in ["wide", "compact"]:
                    image = f"{surface}-{theme}-{size}.png"
                    width, height = (1440, 900) if size == "wide" else (600, 720)
                    data = tiny_png(width, height)
                    (self.root / image).write_bytes(data)
                    self.metrics["receipts"].append({
                        "surface": surface, "theme": theme, "size": size, "image": image,
                        "imageSha256": hashlib.sha256(data).hexdigest(),
                        "viewportOverflow": False, "actionsVisible": True,
                    })
        for receipt in self.metrics['receipts']:
            if receipt['surface']!='settings':continue
            receipt['captures']=[]
            for view in ('connection','connect','response'):
                image=f"settings-{view}-{receipt['theme']}-{receipt['size']}.png"
                data=(self.root/receipt['image']).read_bytes();(self.root/image).write_bytes(data)
                receipt['captures'].append({'view':view,'image':image,'imageSha256':hashlib.sha256(data).hexdigest(),'actionsVisible':True,'actions':[{'visible':True}]})
        self.write_metrics(self.metrics)

    def write_metrics(self, metrics):
        (self.root / "metrics.json").write_text(json.dumps(metrics), encoding="utf-8")

    def test_complete_surface_theme_size_matrix_with_visible_actions_passes(self):
        self.assertTrue(module.browser_ok(self.root))

    def test_changed_settings_controls_require_visible_complete_section_captures(self):
        baseline=copy.deepcopy(self.metrics)
        for failure in ('missing','hidden','duplicate'):
            self.metrics=copy.deepcopy(baseline)
            receipt=next(r for r in self.metrics['receipts'] if r['surface']=='settings')
            if failure=='missing':receipt['captures'].pop()
            elif failure=='hidden':receipt['captures'][0]['actions'][0]['visible']=False
            else:receipt['captures'][1]=receipt['captures'][0]
            self.write_metrics(self.metrics)
            self.assertFalse(module.browser_ok(self.root),failure)

    def test_missing_metrics_refuses(self):
        (self.root / "metrics.json").unlink()
        with self.assertRaises((OSError, ValueError)):
            module.browser_ok(self.root)

    def test_missing_or_wrong_named_capture_refuses(self):
        image = self.root / self.metrics["receipts"][0]["image"]
        image.unlink()
        self.assertFalse(module.browser_ok(self.root))
        # Correct count alone cannot substitute a different file for a named receipt.
        (self.root / "unrelated.png").write_bytes(tiny_png())
        self.assertFalse(module.browser_ok(self.root))

    def test_missing_duplicate_or_wrong_surface_matrix_refuses(self):
        variants = [[], self.metrics["receipts"][:-1],
                    self.metrics["receipts"] + [self.metrics["receipts"][0]]]
        wrong = copy.deepcopy(self.metrics["receipts"])
        wrong[-1]["surface"] = "unselected-surface"
        variants.append(wrong)
        duplicate = copy.deepcopy(self.metrics["receipts"])
        duplicate[-1] = duplicate[0]
        variants.append(duplicate)
        for receipts in variants:
            with self.subTest(receipts=len(receipts)):
                self.write_metrics({**self.metrics, "receipts": receipts})
                self.assertFalse(module.browser_ok(self.root))

    def test_browser_errors_overflow_missing_or_hidden_actions_refuse(self):
        bad_metrics = []
        error = copy.deepcopy(self.metrics)
        error["errors"] = ["synthetic page exception"]
        bad_metrics.append(error)
        for field, value in [("viewportOverflow", True), ("actionsVisible", False),
                             ("viewportOverflow", None), ("actionsVisible", None)]:
            metrics = copy.deepcopy(self.metrics)
            metrics["receipts"][0][field] = value
            bad_metrics.append(metrics)
        for metrics in bad_metrics:
            with self.subTest(metrics=metrics["receipts"][0], errors=metrics["errors"]):
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))

    def test_missing_or_failed_browser_and_server_cleanup_refuse(self):
        for cleanup in [None, {}, {"browser": "open", "server": "closed"},
                        {"browser": "closed", "server": "open"},
                        {"browser": "not-started", "server": "closed"}]:
            with self.subTest(cleanup=cleanup):
                metrics = copy.deepcopy(self.metrics)
                if cleanup is None:
                    del metrics["cleanup"]
                else:
                    metrics["cleanup"] = cleanup
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))

    def test_modified_or_missing_image_hash_refuses(self):
        original = self.root / self.metrics["receipts"][0]["image"]
        original.write_bytes(tiny_png() + b"modified retained bytes")
        self.assertFalse(module.browser_ok(self.root))
        original.write_bytes(tiny_png())
        for digest in [None, "", "f" * 64]:
            with self.subTest(digest=digest):
                metrics = copy.deepcopy(self.metrics)
                if digest is None:
                    del metrics["receipts"][0]["imageSha256"]
                else:
                    metrics["receipts"][0]["imageSha256"] = digest
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))

    def test_wrong_viewport_dimensions_or_non_png_refuse_even_with_matching_hash(self):
        for size, wrong_dimensions in [("wide", (600, 720)), ("compact", (1440, 900)),
                                       ("wide", (1, 1))]:
            with self.subTest(size=size, dimensions=wrong_dimensions):
                metrics = copy.deepcopy(self.metrics)
                receipt = next(receipt for receipt in metrics["receipts"] if receipt["size"] == size)
                image = self.root / receipt["image"]
                original = image.read_bytes()
                data = tiny_png(*wrong_dimensions)
                image.write_bytes(data)
                receipt["imageSha256"] = hashlib.sha256(data).hexdigest()
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))
                image.write_bytes(original)
        for data in [b"not a PNG", tiny_png().replace(b"IHDR", b"NOPE", 1),
                     tiny_png().replace(b"\x00\x00\x00\rIHDR", b"\x00\x00\x00\x0cIHDR", 1)]:
            with self.subTest(header=data[:24]):
                metrics = copy.deepcopy(self.metrics)
                receipt = metrics["receipts"][0]
                image = self.root / receipt["image"]
                original = image.read_bytes()
                image.write_bytes(data)
                receipt["imageSha256"] = hashlib.sha256(data).hexdigest()
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))
                image.write_bytes(original)

    def test_missing_changed_or_invalid_input_identity_refuses(self):
        variants = []
        missing = copy.deepcopy(self.metrics)
        del missing["inputIdentity"]
        variants.append(missing)
        unchanged = copy.deepcopy(self.metrics)
        unchanged["inputIdentity"]["unchanged"] = False
        variants.append(unchanged)
        empty = copy.deepcopy(self.metrics)
        empty["inputIdentity"]["before"]["files"] = {}
        empty["inputIdentity"]["after"]["files"] = {}
        variants.append(empty)
        changed = copy.deepcopy(self.metrics)
        changed["inputIdentity"]["after"]["files"]["app/src/ui-refresh.css"] = "f" * 64
        variants.append(changed)
        removed = copy.deepcopy(self.metrics)
        del removed["inputIdentity"]["after"]["files"]["app/src/ui-refresh.css"]
        variants.append(removed)
        added = copy.deepcopy(self.metrics)
        added["inputIdentity"]["after"]["files"]["app/src/new-module.ts"] = "f" * 64
        variants.append(added)
        changed_head = copy.deepcopy(self.metrics)
        changed_head["inputIdentity"]["after"]["checkoutHead"] = "f" * 40
        variants.append(changed_head)
        for head in [None, "", "g" * 40, SHA.upper()]:
            metrics = copy.deepcopy(self.metrics)
            for phase in ["before", "after"]:
                if head is None:
                    del metrics["inputIdentity"][phase]["checkoutHead"]
                else:
                    metrics["inputIdentity"][phase]["checkoutHead"] = head
            variants.append(metrics)
        for invalid_digest in ["", "short", "g" * 64, "F" * 64]:
            metrics = copy.deepcopy(self.metrics)
            for phase in ["before", "after"]:
                metrics["inputIdentity"][phase]["files"]["app/src/reference-ui.ts"] = invalid_digest
            variants.append(metrics)
        for metrics in variants:
            with self.subTest(identity=metrics.get("inputIdentity")):
                self.write_metrics(metrics)
                self.assertFalse(module.browser_ok(self.root))

    def test_each_receipt_requires_its_own_retained_image(self):
        metrics = copy.deepcopy(self.metrics)
        by_size = {size: next(receipt for receipt in self.metrics["receipts"] if receipt["size"] == size)
                   for size in ["wide", "compact"]}
        for receipt in metrics["receipts"]:
            original = by_size[receipt["size"]]
            receipt["image"] = original["image"]
            receipt["imageSha256"] = original["imageSha256"]
        self.write_metrics(metrics)
        self.assertFalse(module.browser_ok(self.root))


if __name__ == '__main__':
    unittest.main()
