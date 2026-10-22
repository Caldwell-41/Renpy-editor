"""The Help package gate rejects incomplete and erroneous terminal receipts."""
import copy
import unittest
from runtime_probe_cases import RUNTIME_STAGES, runtime_report_ok


def receipt(target_os="macos"):
    terminal = dict(cleanupComplete=True, outputTruncated=False, phase="cancelled", exitCode=None, output="")
    validation = dict(terminal, phase="exited", exitCode=0)
    return dict(evidence="runtime-ui-packaged", case="help-screen", passed=True, cleanupComplete=True,
                details=dict(scenario="help-screen", stage="complete", previewLaunches=1, nativeWebView=True, targetOs=target_os,
                             stages=[dict(stage=s) for s in (*RUNTIME_STAGES["help-screen"], "complete")],
                             terminals=[dict(kind="validate", status=validation, diagnostics=[]), dict(kind="run", status=terminal, diagnostics=[], stopRequested=True)]))


class HelpEvidenceTest(unittest.TestCase):
    def test_owned_windows_console_stop_is_not_a_runtime_failure(self):
        result = receipt("windows")
        result["details"]["terminals"][1]["status"]["exitCode"] = -1073741510
        self.assertTrue(runtime_report_ok("help-screen", result))
        self.assertEqual(result["details"]["terminals"][1]["status"]["exitCode"], -1073741510)
        self.assertFalse(runtime_report_ok("help-screen", result, target_os="macos"))

    def test_console_exit_requires_windows_owned_stop_and_complete_error_free_receipt(self):
        def stopped():
            result = receipt("windows")
            result["details"]["terminals"][1]["status"]["exitCode"] = -1073741510
            return result
        for code in (1, -1, -1073741819, 3221225786, None, False):
            result = stopped()
            result["details"]["terminals"][1]["status"]["exitCode"] = code
            self.assertFalse(runtime_report_ok("help-screen", result), code)
        for key, value in (("phase", "exited"), ("phase", "failed"), ("cleanupComplete", False), ("outputTruncated", True), ("output", "AttributeError: fixture failed")):
            result = stopped()
            result["details"]["terminals"][1]["status"][key] = value
            self.assertFalse(runtime_report_ok("help-screen", result), (key, value))
        for key in ("cleanupComplete", "exitCode", "output", "outputTruncated"):
            result = stopped()
            del result["details"]["terminals"][1]["status"][key]
            self.assertFalse(runtime_report_ok("help-screen", result), key)
        result = stopped(); result["details"]["terminals"][1]["stopRequested"] = False
        self.assertFalse(runtime_report_ok("help-screen", result))
        result = stopped(); result["details"]["terminals"][1]["diagnostics"] = [dict(severity="error")]
        self.assertFalse(runtime_report_ok("help-screen", result))
        result = stopped(); result["details"]["terminals"][0]["status"]["exitCode"] = -1073741510
        self.assertFalse(runtime_report_ok("help-screen", result))
        result = stopped(); result["details"]["targetOs"] = "macos"
        self.assertFalse(runtime_report_ok("help-screen", result))
        result = stopped(); del result["details"]["targetOs"]
        self.assertFalse(runtime_report_ok("help-screen", result))

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
