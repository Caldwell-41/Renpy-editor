"""Positive and rejecting fixtures for the production redesign evidence gate.

Only synthetic logs, metadata and tiny PNGs are used. No editor, browser, SDK,
Studio, credential store, package build or CI dispatch is started here.
"""
import copy
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
from unittest import mock
import zlib


SPEC = importlib.util.spec_from_file_location(
    "redesign_evidence", Path(__file__).with_name("check-redesign-evidence.py")
)
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)

SHA = "0123456789abcdef0123456789abcdef01234567"


def selected_environment():
    return {
        "OUTCOME": "walkthrough-redesign",
        "GITHUB_REF": "refs/heads/codex/phase3a-story-logic",
        "GITHUB_RUN_ATTEMPT": "1",
        "ORDINAL": "1",
        "EXCLUDED_SELECTORS": "false",
        "EXPECTED_CANDIDATE": SHA,
        "GITHUB_SHA": SHA,
        "RUNNER_OS": "Windows",
    }


def dom_log(names):
    return "\n".join(
        ["TAP version 13"]
        + [f"ok {number} - {name}" for number, name in enumerate(names, 1)]
        + [f"1..{len(names)}", f"# tests {len(names)}", f"# pass {len(names)}",
           "# fail 0", "# cancelled 0", "# skipped 0", "# todo 0", ""]
    )


def cargo_log(names):
    return "\n".join(
        [f"running {len(names)} tests"]
        + [f"test {name} ... ok" for name in names]
        + [f"test result: ok. {len(names)} passed; 0 failed; 0 ignored; "
           "0 measured; 99 filtered out; finished in 0.01s", ""]
    )


def cargo_listing(names):
    return "\n".join([f"{name}: test" for name in names]
                     + [f"{len(names)} tests, 0 benchmarks", ""])


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
            with mock.patch.object(checker, 'ROOT', root):
                self.assertEqual(checker.candidate_mismatches(inputs), [])
                (root / 'fixture.ps1').write_bytes(b'Write-Output "changed"\r\n')
                inputs['fixture.ps1'] = hashlib.sha256((root / 'fixture.ps1').read_bytes()).hexdigest()
                self.assertEqual(checker.candidate_mismatches(inputs), ['fixture.ps1'])
                (root / '.gitattributes').write_bytes(b'* text eol=lf\n')
                inputs['.gitattributes'] = hashlib.sha256((root / '.gitattributes').read_bytes()).hexdigest()
                self.assertIn('.gitattributes', checker.candidate_mismatches(inputs))

    def test_complete_identity_required_without_waiving_partial_evidence_retention(self):
        report = {'candidate': SHA, 'tree': 'f' * 40, 'sourceMatchesCandidate': True,
                  'missingTrackedInputs': [], 'mismatchedTrackedInputs': []}
        self.assertTrue(checker.identity_ok(report, SHA, 'f' * 40))
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
                    self.assertFalse(checker.identity_ok(changed, SHA, 'f' * 40))
            changed = copy.deepcopy(report)
            del changed[field]
            self.assertFalse(checker.identity_ok(changed, SHA, 'f' * 40))


class SelectionTests(unittest.TestCase):
    def test_exact_candidate_and_each_approved_host_and_ordinal_pass(self):
        for os_name, architecture in [("Windows", "AMD64"), ("Windows", "x86_64"),
                                      ("macOS", "arm64"), ("macOS", "aarch64")]:
            for ordinal in ["1", "2", "3"]:
                with self.subTest(host=os_name, architecture=architecture, ordinal=ordinal):
                    env = selected_environment()
                    env.update(RUNNER_OS=os_name, ORDINAL=ordinal)
                    self.assertTrue(checker.gate(env, SHA, architecture))

    def test_wrong_or_missing_selection_fields_refuse(self):
        replacements = {
            "OUTCOME": ["assistance-ui", "", "walkthrough-redesign "],
            "GITHUB_REF": ["refs/heads/main", "refs/heads/codex/provider-qualification", ""],
            "GITHUB_RUN_ATTEMPT": ["0", "2", "01", ""],
            "ORDINAL": ["0", "4", "01", "1.0", ""],
            "EXCLUDED_SELECTORS": ["true", "False", "", False],
            "EXPECTED_CANDIDATE": ["", "short", SHA.upper(), "g" * 40, "f" * 40],
            "GITHUB_SHA": ["", "f" * 40],
            "RUNNER_OS": ["Linux", "macos", ""],
        }
        for field, values in replacements.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    env = selected_environment()
                    env[field] = value
                    self.assertFalse(checker.gate(env, SHA, "AMD64"))
            with self.subTest(missing=field):
                env = selected_environment()
                del env[field]
                self.assertFalse(checker.gate(env, SHA, "AMD64"))

    def test_checked_out_head_must_match_selected_and_event_commit(self):
        self.assertFalse(checker.gate(selected_environment(), "f" * 40, "AMD64"))
        env = selected_environment()
        env.update(EXPECTED_CANDIDATE="f" * 40, GITHUB_SHA="f" * 40)
        self.assertFalse(checker.gate(env, SHA, "AMD64"))

    def test_wrong_architecture_never_substitutes_for_required_host(self):
        for os_name, architecture in [("Windows", "arm64"), ("Windows", "x86"),
                                      ("macOS", "x86_64"), ("macOS", "AMD64")]:
            with self.subTest(host=os_name, architecture=architecture):
                env = selected_environment()
                env["RUNNER_OS"] = os_name
                self.assertFalse(checker.gate(env, SHA, architecture))


class DomTests(unittest.TestCase):
    def test_nested_probe_checks_are_counted_and_cannot_hide_failure_or_missing_results(self):
        text = dom_log(['probe']).replace('ok 1 - probe', '    ok 1 - success\n    ok 2 - failure-report\nok 1 - probe')
        text = text.replace('# tests 1', '# tests 3').replace('# pass 1', '# pass 3')
        self.assertTrue(checker.dom_ok(text, ['probe']))
        for bad in (text.replace('    ok 1', '    not ok 1'),
                    text.replace('    ok 2 - failure-report\n', ''),
                    text.replace('failure-report', 'failure-report # SKIP'),
                    text.replace('ok 1 - probe', 'ok 1 - wrong-probe')):
            self.assertFalse(checker.dom_ok(bad, ['probe']))

    names = ["saved setup preserves author input", "world café 雪 is explicitly omitted"]

    def test_exact_selected_names_and_truthful_summary_pass(self):
        self.assertTrue(checker.dom_ok(dom_log(self.names), self.names))
        self.assertTrue(checker.dom_ok(dom_log(list(reversed(self.names))), self.names))

    def test_current_selected_source_discovery_is_nonempty_and_unique(self):
        names = checker.dom_names()
        self.assertTrue(names)
        self.assertEqual(len(names), len(set(names)))

    def test_source_file_with_zero_tests_and_duplicate_names_refuse_discovery(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            tests = root / "app/tests"
            tests.mkdir(parents=True)
            for number, filename in enumerate(checker.DOM_FILES):
                (tests / filename).write_text(f"test('case {number}', () => {{}});\n", encoding="utf-8")
            with mock.patch.object(checker, "ROOT", root):
                self.assertEqual(len(checker.dom_names()), len(checker.DOM_FILES))
                first = tests / checker.DOM_FILES[0]
                first.write_text("// No tests\n", encoding="utf-8")
                with self.assertRaises(ValueError):
                    checker.dom_names()
                first.write_text("test('case 1', () => {});\n", encoding="utf-8")
                with self.assertRaises(ValueError):
                    checker.dom_names()

    def test_zero_missing_extra_duplicate_or_renamed_test_results_refuse(self):
        for actual in [[], self.names[:1], self.names + ["unexpected case"],
                       [self.names[0], self.names[0]], [self.names[0], "wrong exact case"]]:
            with self.subTest(actual=actual):
                self.assertFalse(checker.dom_ok(dom_log(actual), self.names))
        self.assertFalse(checker.dom_ok(dom_log([]), []))

    def test_failure_cancel_skip_and_todo_refuse(self):
        baseline = dom_log(self.names)
        cases = [baseline.replace("# fail 0", "# fail 1"),
                 baseline.replace("# cancelled 0", "# cancelled 1"),
                 baseline.replace("# skipped 0", "# skipped 1"),
                 baseline.replace("# todo 0", "# todo 1"),
                 baseline.replace("ok 1 -", "not ok 1 -"),
                 baseline.replace(self.names[0], self.names[0] + " # SKIP"),
                 baseline + "not ok 99 - hidden failed case\n"]
        for text in cases:
            with self.subTest(log=text):
                self.assertFalse(checker.dom_ok(text, self.names))

    def test_missing_duplicate_and_contradictory_summaries_refuse(self):
        baseline = dom_log(self.names)
        for summary in ["tests", "pass", "fail", "cancelled", "skipped", "todo"]:
            line = next(line for line in baseline.splitlines() if line.startswith(f"# {summary} "))
            for text in [baseline.replace(line + "\n", ""), baseline + line + "\n"]:
                with self.subTest(summary=summary, log=text):
                    self.assertFalse(checker.dom_ok(text, self.names))
        self.assertFalse(checker.dom_ok(baseline.replace("# pass 2", "# pass 1"), self.names))
        self.assertFalse(checker.dom_ok(baseline.replace("# tests 2", "# tests 3"), self.names))


class CargoTests(unittest.TestCase):
    scope = "references::tests::"

    def setUp(self):
        self.names = list(checker.CARGO_REQUIRED[self.scope]) + ["references::tests::additional_case"]
        self.log = cargo_log(self.names)
        self.listing = cargo_listing(self.names)

    def test_exact_listing_all_executed_and_required_cases_pass(self):
        self.assertTrue(checker.cargo_ok(self.log, self.listing, self.scope))
        self.assertTrue(checker.cargo_ok(cargo_log(list(reversed(self.names))), self.listing, self.scope))

    def test_missing_zero_duplicate_extra_and_mismatched_execution_refuse(self):
        cases = [("", self.listing), (self.log, ""),
                 (cargo_log([]), cargo_listing([])),
                 (cargo_log(self.names[:-1]), self.listing),
                 (self.log, cargo_listing(self.names[:-1])),
                 (cargo_log(self.names + [self.names[0]]), self.listing),
                 (self.log, cargo_listing(self.names + [self.names[0]])),
                 (cargo_log(self.names + ["other::test"]), self.listing)]
        for log, listing in cases:
            with self.subTest(log=log, listing=listing):
                self.assertFalse(checker.cargo_ok(log, listing, self.scope))

    def test_required_case_cannot_be_replaced_by_equal_count_unrelated_test(self):
        for required in checker.CARGO_REQUIRED[self.scope]:
            names = ["unrelated::looks_green" if name == required else name for name in self.names]
            with self.subTest(required=required):
                self.assertFalse(checker.cargo_ok(cargo_log(names), cargo_listing(names), self.scope))

    def test_failures_ignored_measured_and_false_counts_refuse(self):
        cases = [self.log.replace(" ... ok", " ... FAILED", 1),
                 self.log.replace(" ... ok", " ... ignored", 1),
                 self.log.replace("0 failed", "1 failed"),
                 self.log.replace("0 ignored", "1 ignored"),
                 self.log.replace("0 measured", "1 measured"),
                 self.log.replace("test result: ok.", "test result: FAILED."),
                 self.log.replace(f"{len(self.names)} passed", "0 passed"),
                 self.log.replace(f"{len(self.names)} passed", f"{len(self.names) + 1} passed"),
                 self.log + cargo_log([])]
        for log in cases:
            with self.subTest(log=log):
                self.assertFalse(checker.cargo_ok(log, self.listing, self.scope))

    def test_unknown_cargo_scope_refuses(self):
        self.assertFalse(checker.cargo_ok(self.log, self.listing, "unselected::tests::"))


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
        self.assertTrue(checker.browser_ok(self.root))

    def test_changed_settings_controls_require_visible_complete_section_captures(self):
        baseline=copy.deepcopy(self.metrics)
        for failure in ('missing','hidden','duplicate'):
            self.metrics=copy.deepcopy(baseline)
            receipt=next(r for r in self.metrics['receipts'] if r['surface']=='settings')
            if failure=='missing':receipt['captures'].pop()
            elif failure=='hidden':receipt['captures'][0]['actions'][0]['visible']=False
            else:receipt['captures'][1]=receipt['captures'][0]
            self.write_metrics(self.metrics)
            self.assertFalse(checker.browser_ok(self.root),failure)

    def test_missing_metrics_refuses(self):
        (self.root / "metrics.json").unlink()
        with self.assertRaises((OSError, ValueError)):
            checker.browser_ok(self.root)

    def test_missing_or_wrong_named_capture_refuses(self):
        image = self.root / self.metrics["receipts"][0]["image"]
        image.unlink()
        self.assertFalse(checker.browser_ok(self.root))
        # Correct count alone cannot substitute a different file for a named receipt.
        (self.root / "unrelated.png").write_bytes(tiny_png())
        self.assertFalse(checker.browser_ok(self.root))

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
                self.assertFalse(checker.browser_ok(self.root))

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
                self.assertFalse(checker.browser_ok(self.root))

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
                self.assertFalse(checker.browser_ok(self.root))

    def test_modified_or_missing_image_hash_refuses(self):
        original = self.root / self.metrics["receipts"][0]["image"]
        original.write_bytes(tiny_png() + b"modified retained bytes")
        self.assertFalse(checker.browser_ok(self.root))
        original.write_bytes(tiny_png())
        for digest in [None, "", "f" * 64]:
            with self.subTest(digest=digest):
                metrics = copy.deepcopy(self.metrics)
                if digest is None:
                    del metrics["receipts"][0]["imageSha256"]
                else:
                    metrics["receipts"][0]["imageSha256"] = digest
                self.write_metrics(metrics)
                self.assertFalse(checker.browser_ok(self.root))

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
                self.assertFalse(checker.browser_ok(self.root))
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
                self.assertFalse(checker.browser_ok(self.root))
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
                self.assertFalse(checker.browser_ok(self.root))

    def test_each_receipt_requires_its_own_retained_image(self):
        metrics = copy.deepcopy(self.metrics)
        by_size = {size: next(receipt for receipt in self.metrics["receipts"] if receipt["size"] == size)
                   for size in ["wide", "compact"]}
        for receipt in metrics["receipts"]:
            original = by_size[receipt["size"]]
            receipt["image"] = original["image"]
            receipt["imageSha256"] = original["imageSha256"]
        self.write_metrics(metrics)
        self.assertFalse(checker.browser_ok(self.root))


if __name__ == "__main__":
    unittest.main(verbosity=2)
