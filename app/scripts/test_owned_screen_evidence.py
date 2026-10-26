"""Reject incomplete L01 packaged-controller observations before a native launch."""
import copy
import unittest
from uuid import UUID
from runtime_probe_cases import RUNTIME_STAGES, runtime_report_ok


def receipt():
    return dict(evidence="runtime-ui-packaged", case="owned-screen", passed=True, cleanupComplete=True,
                details=dict(scenario="owned-screen", stage="complete", nativeWebView=True, sdkExecuted=False,
                             stages=[dict(stage=stage) for stage in (*RUNTIME_STAGES["owned-screen"], "complete")],
                             identity=dict(id="c77b865e-a6cf-434a-8ecb-02e1c4582de4", rootId="95b5b58c-401d-44b1-8b1f-e52360b7b23a",
                                           name="travel_notes", path="game/ui/travel_notes.rpy", resolved=True)))


class OwnedScreenEvidenceTest(unittest.TestCase):
    def test_composition_requires_its_own_stages_and_persisted_element_identities(self):
        report = receipt(); report['case'] = 'screen-composition'
        details = report['details']; details['scenario'] = 'screen-composition'
        stages = ('composition-passed', 'text-validation-passed', 'literal-history-passed', 'reorder-passed', 'confirmed-removal-passed', 'protected-source-passed', 'reopen-passed', 'complete')
        details['stages'] = [dict(stage=stage) for stage in stages]
        ids = [details['identity']['rootId'], *[str(UUID(int=i)) for i in range(1, 7)]]
        details['identities'] = ids
        details['acceptedSource'] = f'# loomlight-screen: {details["identity"]["id"]}\nscreen travel_notes():\n' + ''.join(f'    text "Fixture" # loomlight-element: {element}\n' for element in ids[1:]) + '    use source_only_footer()\nscreen source_only_footer():\n    text "Protected neighbor"\n'
        self.assertTrue(runtime_report_ok('screen-composition', report))
        for key, value in (('identities', ids[:-1]), ('identities', [ids[0]] * 7), ('acceptedSource', ''), ('nativeWebView', False)):
            bad = copy.deepcopy(report); bad['details'][key] = value
            self.assertFalse(runtime_report_ok('screen-composition', bad))
        for stage in stages[:-1]:
            bad = copy.deepcopy(report); bad['details']['stages'] = [row for row in details['stages'] if row['stage'] != stage]
            self.assertFalse(runtime_report_ok('screen-composition', bad))
        self.assertFalse(runtime_report_ok('screen-composition', receipt()))

    def test_complete_and_incomplete_native_results(self):
        self.assertTrue(runtime_report_ok("owned-screen", receipt()))
        for key in ("passed", "cleanupComplete"):
            bad = receipt(); bad[key] = False
            self.assertFalse(runtime_report_ok("owned-screen", bad))
        for key, value in (("nativeWebView", False), ("sdkExecuted", True), ("identity", None), ("error", "failure")):
            bad = receipt(); bad["details"][key] = value
            self.assertFalse(runtime_report_ok("owned-screen", bad))
        for stage in RUNTIME_STAGES["owned-screen"]:
            bad = receipt(); bad["details"]["stages"] = [row for row in bad["details"]["stages"] if row["stage"] != stage]
            self.assertFalse(runtime_report_ok("owned-screen", bad))
        for field in ("id", "rootId", "name", "path", "resolved"):
            bad = receipt(); del bad["details"]["identity"][field]
            self.assertFalse(runtime_report_ok("owned-screen", bad))
        bad = copy.deepcopy(receipt()); bad["details"]["identity"]["rootId"] = bad["details"]["identity"]["id"]
        self.assertFalse(runtime_report_ok("owned-screen", bad))


if __name__ == "__main__":
    unittest.main()
