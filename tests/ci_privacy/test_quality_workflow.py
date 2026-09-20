"""Regressions for required native-tool failure propagation."""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import unittest


SOURCE = Path(__file__).resolve().parents[2]


class QualityWorkflowTests(unittest.TestCase):
    def test_native_privacy_and_ci_tooling_are_separate_required_steps(self):
        workflow = (SOURCE / ".github" / "workflows" / "quality.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            """      - name: Test local-only Codex configuration boundaries on native filesystem
        run: python -m unittest discover -s tests/ci_privacy -v
      - name: Test candidate-bound CI operations on native filesystem
        run: python -m unittest discover -s tests/ci_tooling -v""",
            workflow,
        )
        self.assertNotIn("Validate privacy and CI tooling on native filesystem", workflow)

    @unittest.skipUnless(os.name == "nt", "PowerShell propagation requires a Windows host")
    def test_windows_shell_cannot_hide_a_separate_required_failure(self):
        powershell = shutil.which("pwsh")
        if not powershell:
            self.skipTest("PowerShell Core is unavailable")

        def run(script: str) -> subprocess.CompletedProcess[bytes]:
            return subprocess.run(
                [powershell, "-NoProfile", "-NonInteractive", "-Command", script],
                capture_output=True,
                check=False,
                timeout=30,
            )

        combined = run(
            "& $env:ComSpec /d /c 'exit 23'; "
            "& $env:ComSpec /d /c 'exit 0'; exit $LASTEXITCODE"
        )
        failed_step = run("& $env:ComSpec /d /c 'exit 23'; exit $LASTEXITCODE")
        later_success = run("& $env:ComSpec /d /c 'exit 0'; exit $LASTEXITCODE")

        self.assertEqual(combined.returncode, 0)
        self.assertEqual(failed_step.returncode, 23)
        self.assertEqual(later_success.returncode, 0)


if __name__ == "__main__":
    unittest.main()
