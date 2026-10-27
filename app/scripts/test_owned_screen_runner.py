"""Exercise runner evidence and fixture cleanup without launching a native app."""
import contextlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import Mock, patch

from test_owned_screen_evidence import receipt


class OwnedScreenRunnerTest(unittest.TestCase):
    def run_fixture(self, passed, unreadable_metadata=False, desktop_failure=None):
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

                def poll(self):
                    return 0

            def start(*args, **kwargs):
                (project / ".renpy-editor").mkdir(parents=True)
                (project / ".renpy-editor/source-map.json").write_text(json.dumps({"ownedScreens": [ownership] if passed else []}))
                if passed:
                    (project / "game/ui").mkdir(parents=True)
                    (project / "game/ui/travel_notes.rpy").write_bytes(f'# loomlight-screen: {ownership["id"]}\nscreen travel_notes():\n    pass\n'.encode())
                return Process()

            runner = Path(__file__).with_name("run-runtime-ui-probes.py")
            read_text = Path.read_text
            metadata = project / ".renpy-editor/source-map.json"

            def read(path, *args, **kwargs):
                if unreadable_metadata and path == metadata:
                    raise PermissionError("Controlled unreadable metadata")
                return read_text(path, *args, **kwargs)

            retention = patch("shutil.copyfile", side_effect=PermissionError("Controlled unreadable metadata")) if unreadable_metadata else contextlib.nullcontext()
            power = Mock()
            power.state.return_value = dict(onConsole=True, loginDone=True, screenLocked=False,
                                            displayActive=True, displayAsleep=False)
            power.hold.side_effect = [1, 2]
            if desktop_failure == 'locked':
                power.state.side_effect = [power.state.return_value, power.state.return_value,
                                          {**power.state.return_value, 'screenLocked': True}]
            elif desktop_failure == 'release':
                power.release.side_effect = RuntimeError('Controlled assertion release failure')
            desktop_host = patch('sys.platform', 'darwin') if desktop_failure else contextlib.nullcontext()
            with desktop_host, patch("macos_native_desktop.MacPower", return_value=power), patch("subprocess.Popen", side_effect=start), patch("pathlib.Path.read_text", read), retention, patch.dict(os.environ, {"TEMP": str(root), "TMPDIR": str(root)}), patch("sys.argv", [str(runner), str(root / "fixture-app"), str(output), "owned-screen"]), contextlib.redirect_stdout(io.StringIO()):
                if passed and not desktop_failure:
                    runpy.run_path(str(runner), run_name="__main__")
                else:
                    with self.assertRaises(SystemExit) as exited:
                        runpy.run_path(str(runner), run_name="__main__")
                    self.assertEqual(exited.exception.code, 1)
            result = json.loads((output / "runtime-ui-owned-screen.json").read_text())
            self.assertEqual(result["passed"], passed and not desktop_failure)
            self.assertEqual(len(result["reports"]), 1)
            self.assertTrue(result["fixtureCleanupComplete"])
            self.assertFalse(profile.exists())
            self.assertEqual(bool(result["diskErrors"]), not passed)
            if desktop_failure:
                self.assertTrue(result['reports'][0]['passed'], 'The app report cannot hide the desktop failure')
                self.assertTrue(result['helpDisk']['acceptedBytesMatch'])
                self.assertEqual(len(result['externalErrors']), 1)
                self.assertEqual(power.release.call_count, 2, 'Both power owners must attempt cleanup')
                desktop = json.loads((output / 'runtime-ui-owned-screen-desktop.json').read_text())
                self.assertEqual(desktop['cleanupComplete'], desktop_failure != 'release')
            if unreadable_metadata:
                self.assertFalse((output / "disk-source-map.json").exists())
                self.assertEqual(len(result["diskErrors"]), 2)
            elif not passed:
                self.assertEqual(json.loads((output / "disk-source-map.json").read_text())["ownedScreens"], [])
                self.assertEqual(result["reports"][0]["details"]["stage"], "open")

    def test_success_requires_source_and_complete_report(self):
        self.run_fixture(True)

    def test_native_failure_retains_report_and_cleans_empty_owned_fixture(self):
        self.run_fixture(False)

    def test_unreadable_metadata_does_not_skip_cleanup_or_failed_result(self):
        self.run_fixture(False, unreadable_metadata=True)

    def test_desktop_exit_failure_retains_failure_and_completes_fixture_cleanup(self):
        for failure in ('locked', 'release'):
            with self.subTest(failure=failure):
                self.run_fixture(True, desktop_failure=failure)


if __name__ == "__main__":
    unittest.main()
