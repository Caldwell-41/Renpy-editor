from __future__ import annotations

import os
import stat
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sdk_adapter import AdapterError, Command, command_argv, parse_diagnostics, parse_version, run_bounded


class AdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.sdk = self.root / "sdk"
        self.sdk.mkdir()
        self.launcher = self.sdk / "renpy.sh"
        self.launcher.write_text("#!/bin/sh\n", encoding="utf-8")
        self.project = self.root / "project with spaces"
        self.project.mkdir()

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_builds_argument_arrays_without_shell_quoting(self) -> None:
        argv = command_argv(self.sdk, Command.LINT, self.project, allow_project_execution=True)
        self.assertEqual(argv[-3:], (str(self.project), "lint", "--error-code"))

    def test_distribute_uses_absolute_launcher_project(self) -> None:
        (self.sdk / "launcher").mkdir()
        argv = command_argv(
            self.sdk,
            Command.DISTRIBUTE_HELP,
            self.project,
            allow_project_execution=True,
        )
        self.assertEqual(
            argv[-4:],
            (str(self.sdk / "launcher"), "distribute", str(self.project), "--help"),
        )

    def test_distribution_is_bounded_to_pc_output(self) -> None:
        (self.sdk / "launcher").mkdir()
        output = self.root / "distribution output"
        argv = command_argv(
            self.sdk,
            Command.DISTRIBUTE,
            self.project,
            output_dir=output,
            allow_project_execution=True,
        )
        self.assertEqual(argv[-5:], ("--destination", str(output), "--package", "pc", "--no-update"))

    def test_project_commands_require_explicit_trust(self) -> None:
        with self.assertRaisesRegex(AdapterError, "explicit trust"):
            command_argv(self.sdk, Command.COMPILE, self.project)

    def test_missing_sdk_is_rejected(self) -> None:
        with self.assertRaisesRegex(AdapterError, "launcher is missing"):
            command_argv(self.root / "missing-sdk", Command.VERSION)

    def test_long_project_path_remains_one_argument(self) -> None:
        project = self.root.joinpath(*(f"long-segment-{index:02d}" for index in range(12)))
        project.mkdir(parents=True)
        argv = command_argv(self.sdk, Command.COMPILE, project, allow_project_execution=True)
        self.assertEqual(argv[-2], str(project))

    def test_warp_target_is_constrained(self) -> None:
        with self.assertRaises(AdapterError):
            command_argv(
                self.sdk, Command.WARP, self.project,
                warp_target="script.rpy:1; touch bad", allow_project_execution=True,
            )

    def test_version_must_match_adapter(self) -> None:
        self.assertEqual(parse_version("Ren'Py 8.5.3.26051505"), "8.5.3")
        with self.assertRaisesRegex(AdapterError, "unsupported"):
            parse_version("Ren'Py 8.6.0")

    def test_parses_diagnostics(self) -> None:
        output = 'File "game/script.rpy", line 7: expected statement\nother.rpy:9: warning: unused\n'
        diagnostics = parse_diagnostics(output)
        self.assertEqual([(d.file, d.line, d.severity) for d in diagnostics], [
            ("game/script.rpy", 7, "error"), ("other.rpy", 9, "warning")
        ])

    @unittest.skipIf(os.name == "nt", "synthetic shell helper is POSIX-only")
    def test_process_output_is_bounded(self) -> None:
        script = self.root / "output.sh"
        script.write_text("#!/bin/sh\nyes x\n", encoding="utf-8")
        script.chmod(script.stat().st_mode | stat.S_IXUSR)
        result = run_bounded((str(script),), timeout_seconds=2, output_limit=128)
        self.assertTrue(result.output_limited)
        self.assertLessEqual(len(result.output.encode()), 128)

    @unittest.skipIf(os.name == "nt", "synthetic shell helper is POSIX-only")
    def test_process_timeout_is_reported(self) -> None:
        script = self.root / "wait.sh"
        script.write_text("#!/bin/sh\nsleep 5\n", encoding="utf-8")
        script.chmod(script.stat().st_mode | stat.S_IXUSR)
        result = run_bounded((str(script),), timeout_seconds=0.1)
        self.assertTrue(result.timed_out)


if __name__ == "__main__":
    unittest.main()
