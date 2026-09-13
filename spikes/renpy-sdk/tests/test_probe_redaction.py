from __future__ import annotations

import sys
import unittest
from pathlib import Path

SPIKE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SPIKE_ROOT))

from probe import _redact_argument, _redact_text, result_record  # noqa: E402
from sdk_adapter import CommandResult, Diagnostic  # noqa: E402


class ProbeRedactionTests(unittest.TestCase):
    def test_absolute_arguments_are_reduced_to_basename_on_both_path_styles(self) -> None:
        self.assertEqual(_redact_argument("/private/sdk/renpy.sh"), "renpy.sh")
        self.assertEqual(
            _redact_argument(r"D:\runner\temp\python.exe"), "python.exe"
        )
        self.assertEqual(_redact_argument("script.rpy:4"), "script.rpy:4")

    def test_output_and_diagnostics_remove_known_absolute_roots(self) -> None:
        root = Path("/private/runner/temp/probe")
        result = CommandResult(
            argv=("/private/runner/temp/probe/renpy.sh", "relative"),
            exit_code=1,
            output="failure at /private/runner/temp/probe/game/script.rpy",
            duration_seconds=0.1,
            timed_out=False,
            output_limited=False,
            diagnostics=(Diagnostic(
                "/private/runner/temp/probe/game/script.rpy", 4, "error",
                "see /private/runner/temp/probe/game/script.rpy",
            ),),
        )
        record = result_record("failure", result, (root,))
        self.assertNotIn(str(root), repr(record))
        self.assertIn("<redacted-path>", repr(record))
        self.assertEqual(_redact_text(str(root).upper(), (root,)), "<redacted-path>")


if __name__ == "__main__":
    unittest.main()
