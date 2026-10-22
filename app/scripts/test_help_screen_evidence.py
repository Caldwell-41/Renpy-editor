"""The Help package gate rejects incomplete and erroneous terminal receipts."""
import copy
import unittest
from runtime_probe_cases import RUNTIME_STAGES, runtime_report_ok


def receipt():
    terminal = dict(cleanupComplete=True, outputTruncated=False, phase="cancelled", exitCode=None, output="")
    validation = dict(terminal, phase="exited", exitCode=0)
    return dict(evidence="runtime-ui-packaged", case="help-screen", passed=True, cleanupComplete=True,
                details=dict(scenario="help-screen", stage="complete", previewLaunches=1, nativeWebView=True,
                             stages=[dict(stage=s) for s in (*RUNTIME_STAGES["help-screen"], "complete")],
                             terminals=[dict(kind="validate", status=validation, diagnostics=[]), dict(kind="run", status=terminal, diagnostics=[])]))


class HelpEvidenceTest(unittest.TestCase):
    def test_valid_and_missing_stages(self):
        self.assertTrue(runtime_report_ok("help-screen", receipt()))
        for index in range(len(RUNTIME_STAGES["help-screen"])):
            bad = receipt()
            del bad["details"]["stages"][index]
            self.assertFalse(runtime_report_ok("help-screen", bad))

    def test_exception_is_failure_even_after_cleanup(self):
        bad = receipt()
        bad["details"]["terminals"][1]["status"]["output"] = "While running game code:\nAttributeError: 'Layout' object has no attribute 'yesno_prompt'"
        self.assertFalse(runtime_report_ok("help-screen", bad))
        bad = receipt()
        bad["details"]["terminals"][1]["diagnostics"] = [dict(severity="error", origin="runtime")]
        self.assertFalse(runtime_report_ok("help-screen", bad))

    def test_failed_truncated_missing_and_false_native_receipts(self):
        for key, value in (("cleanupComplete", False), ("outputTruncated", True), ("phase", "failed"), ("exitCode", 1)):
            bad = receipt()
            bad["details"]["terminals"][1]["status"][key] = value
            self.assertFalse(runtime_report_ok("help-screen", bad), key)
        for key, value in (("nativeWebView", False), ("previewLaunches", 0), ("terminals", []), ("error", "failure")):
            bad = receipt()
            bad["details"][key] = value
            self.assertFalse(runtime_report_ok("help-screen", bad), key)
        bad = copy.deepcopy(receipt())
        del bad["details"]["terminals"][0]["diagnostics"]
        self.assertFalse(runtime_report_ok("help-screen", bad))
