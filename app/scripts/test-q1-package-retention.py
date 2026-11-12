"""Exercise the real retention CLI using synthetic files, never an app launch."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("retain-q1-package.py")
GIT_DIR = subprocess.run(
    ["git", "rev-parse", "--absolute-git-dir"], cwd=SCRIPT.parent,
    check=True, capture_output=True, text=True,
).stdout.strip()
PAYLOAD = b"synthetic package evidence, not executable code\n"


class PackageRetentionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.output = self.root / "evidence/q1-package-evidence"

    def binary(self):
        binary = self.root / "target/release/loomlight.exe"
        binary.parent.mkdir(parents=True)
        binary.write_bytes(PAYLOAD)
        binary.chmod(0o755)
        return binary

    def retain(self, package="success", scan="success"):
        result = subprocess.run(
            [sys.executable, str(SCRIPT),
             "--package-outcome", package, "--scan-outcome", scan,
             "--runtime-outcome", "failure", "--runner", "synthetic",
             "--output", str(self.output), "--run-id", "1", "--run-attempt", "1",
             "--sha", "synthetic"],
            cwd=self.root, env=dict(os.environ, GIT_DIR=GIT_DIR),
            capture_output=True, text=True,
        )
        manifest = json.loads((self.output / "package-evidence.json").read_text())
        return result, manifest

    def test_windows_retains_binary_after_runtime_failure(self):
        self.binary()
        result, manifest = self.retain()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(manifest["artifactState"], "available")
        self.assertEqual((self.output / "loomlight.exe").read_bytes(), PAYLOAD)
        expected = hashlib.sha256(PAYLOAD).hexdigest()
        self.assertEqual(manifest["executableSha256"], expected)
        self.assertEqual(manifest["retainedSha256"], {"loomlight.exe": expected})
        self.assertTrue(all(case["state"] == "missing-or-malformed-report"
                            for case in manifest["runtimeCases"]))

    def test_ui_refresh_report_is_retained_alongside_the_five_runtime_cases(self):
        self.binary()
        self.output.parent.mkdir(parents=True)
        report = {"case": "ui-refresh", "passed": False, "exitCode": 1, "timedOut": False,
                  "reports": [{"evidence": "runtime-ui-packaged", "passed": False, "cleanupComplete": True}]}
        (self.output.parent / "runtime-ui-ui-refresh.json").write_text(json.dumps(report))
        result, manifest = self.retain()
        self.assertEqual(result.returncode, 0, result.stderr)
        cases = {case["case"]: case for case in manifest["runtimeCases"]}
        self.assertEqual(set(cases), {"compile", "lint", "route-a", "route-b", "runtime-error", "ui-refresh"})
        self.assertEqual(cases["ui-refresh"]["state"], "failed-or-incomplete")
        self.assertTrue(cases["ui-refresh"]["cleanupComplete"])

    def test_wrong_inner_runtime_scenario_cannot_be_labelled_as_passed(self):
        self.binary();self.output.parent.mkdir(parents=True)
        report={'case':'route-b','passed':True,'exitCode':0,'timedOut':False,
                'reports':[{'evidence':'runtime-ui-packaged','case':'compile','passed':True,'cleanupComplete':True}]}
        (self.output.parent/'runtime-ui-route-b.json').write_text(json.dumps(report))
        result,manifest=self.retain()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(next(c for c in manifest['runtimeCases'] if c['case']=='route-b')['state'],'failed-or-incomplete')

    def test_missing_successful_package_fails(self):
        result, manifest = self.retain()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(manifest["artifactState"], "built-but-missing")

    def test_failure_before_package_is_explicit(self):
        result, manifest = self.retain(package="skipped", scan="failure")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(manifest["artifactState"], "not-built")
        self.assertEqual(manifest["retainedFiles"], [])

    def test_partial_output_is_retained_without_claiming_package_success(self):
        self.binary()
        result, manifest = self.retain(package="failure")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(manifest["artifactState"], "produced-during-package-failure")

    def test_failed_scan_withholds_binary_and_fails(self):
        self.binary()
        result, manifest = self.retain(scan="failure")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(manifest["artifactState"], "withheld-by-scan")
        self.assertEqual(manifest["retainedFiles"], [])
        self.assertFalse((self.output / "loomlight.exe").exists())

    def test_wrong_case_report_is_not_labelled_passed(self):
        self.binary()
        self.output.parent.mkdir(parents=True)
        (self.output.parent / "runtime-ui-compile.json").write_text(json.dumps({
            "case": "lint", "passed": True, "exitCode": 0, "timedOut": False,
            "reports": [{"evidence": "runtime-ui-packaged", "passed": True,
                         "cleanupComplete": True}],
        }))
        result, manifest = self.retain()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(manifest["runtimeCases"][0]["state"], "failed-or-incomplete")


if __name__ == "__main__":
    unittest.main()
