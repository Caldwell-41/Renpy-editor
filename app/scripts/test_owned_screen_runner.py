"""Exercise runner evidence and fixture cleanup without launching a native app."""
import contextlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

from test_owned_screen_evidence import receipt


class OwnedScreenRunnerTest(unittest.TestCase):
    def run_fixture(self, passed):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "loomlight-r2-probe-424242-owned-screen"
            project = profile / "synthetic-project"
            report = receipt()
            ownership = report["details"]["identity"]
            if not passed:
                report.update(passed=False)
                report["details"].update(passed=False, stage="open", stages=[], error="Timeout: open")
            output = root / "evidence"

            class Process:
                pid = 424242
                stdout = io.BytesIO((json.dumps(report) + "\n").encode())

                def wait(self, timeout):
                    return 0

            def start(*args, **kwargs):
                (project / ".renpy-editor").mkdir(parents=True)
                (project / ".renpy-editor/source-map.json").write_text(json.dumps({"ownedScreens": [ownership] if passed else []}))
                if passed:
                    (project / "game/ui").mkdir(parents=True)
                    (project / "game/ui/travel_notes.rpy").write_bytes(f'# loomlight-screen: {ownership["id"]}\nscreen travel_notes():\n    pass\n'.encode())
                return Process()

            runner = Path(__file__).with_name("run-runtime-ui-probes.py")
            with patch("subprocess.Popen", side_effect=start), patch.dict(os.environ, {"TEMP": str(root), "TMPDIR": str(root)}), patch("sys.argv", [str(runner), str(root / "fixture-app"), str(output), "owned-screen"]), contextlib.redirect_stdout(io.StringIO()):
                if passed:
                    runpy.run_path(str(runner), run_name="__main__")
                else:
                    with self.assertRaises(SystemExit) as exited:
                        runpy.run_path(str(runner), run_name="__main__")
                    self.assertEqual(exited.exception.code, 1)
            result = json.loads((output / "runtime-ui-owned-screen.json").read_text())
            self.assertEqual(result["passed"], passed)
            self.assertEqual(len(result["reports"]), 1)
            self.assertTrue(result["fixtureCleanupComplete"])
            self.assertFalse(profile.exists())
            self.assertEqual(bool(result["diskErrors"]), not passed)
            if not passed:
                self.assertEqual(json.loads((output / "disk-source-map.json").read_text())["ownedScreens"], [])
                self.assertEqual(result["reports"][0]["details"]["stage"], "open")

    def test_success_requires_source_and_complete_report(self):
        self.run_fixture(True)

    def test_native_failure_retains_report_and_cleans_empty_owned_fixture(self):
        self.run_fixture(False)


if __name__ == "__main__":
    unittest.main()
