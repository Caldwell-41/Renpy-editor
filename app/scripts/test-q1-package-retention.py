"""Exercise the real retention CLI using synthetic files, never an app launch."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
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

    def binary(self, platform):
        relative = ("target/release/loomlight.exe" if platform == "Windows" else
                    "target/release/bundle/macos/Loomlight.app/Contents/MacOS/loomlight")
        binary = self.root / relative
        binary.parent.mkdir(parents=True)
        binary.write_bytes(PAYLOAD)
        binary.chmod(0o755)
        return binary

    def retain(self, platform="Windows", package="success", scan="success"):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--platform", platform,
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
        self.binary("Windows")
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
        self.binary("Windows")
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

    def test_macos_tar_preserves_bundle_bytes_and_modes(self):
        binary = self.binary("macOS")
        hidden = binary.parent.parent / "Resources/.bundle-data"
        hidden.parent.mkdir()
        hidden.write_bytes(b"synthetic resource")
        result, manifest = self.retain(platform="macOS")
        self.assertEqual(result.returncode, 0, result.stderr)
        archive_path = self.output / "Loomlight.app.tar"
        self.assertEqual(manifest["retainedFiles"], [archive_path.name])
        self.assertEqual(manifest["retainedSha256"][archive_path.name],
                         hashlib.sha256(archive_path.read_bytes()).hexdigest())
        with tarfile.open(archive_path) as archive:
            member = archive.getmember("Loomlight.app/Contents/MacOS/loomlight")
            self.assertEqual(member.mode, binary.stat().st_mode & 0o7777)
            with archive.extractfile(member) as stream:
                self.assertEqual(hashlib.sha256(stream.read()).hexdigest(), manifest["executableSha256"])
            self.assertIn("Loomlight.app/Contents/Resources/.bundle-data", archive.getnames())

    @unittest.skipUnless(os.name == "posix", "POSIX symlink creation required")
    def test_macos_tar_preserves_symlinks(self):
        binary = self.binary("macOS")
        (binary.parent / "alias").symlink_to("loomlight")
        result, _manifest = self.retain(platform="macOS")
        self.assertEqual(result.returncode, 0, result.stderr)
        with tarfile.open(self.output / "Loomlight.app.tar") as archive:
            member = archive.getmember("Loomlight.app/Contents/MacOS/alias")
            self.assertTrue(member.issym())
            self.assertEqual(member.linkname, "loomlight")

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
        self.binary("Windows")
        result, manifest = self.retain(package="failure")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(manifest["artifactState"], "produced-during-package-failure")

    def test_failed_scan_withholds_binary_and_fails(self):
        self.binary("Windows")
        result, manifest = self.retain(scan="failure")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(manifest["artifactState"], "withheld-by-scan")
        self.assertEqual(manifest["retainedFiles"], [])
        self.assertFalse((self.output / "loomlight.exe").exists())

    def test_wrong_case_report_is_not_labelled_passed(self):
        self.binary("Windows")
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
