import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("windows_probe", Path(__file__).with_name("windows-studio-credentials.py"))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class WindowsFixtureGate(unittest.TestCase):
    def test_missing_or_out_of_budget_build_selection_refuses_before_preparation(self):
        with patch.object(probe, "source_inputs", side_effect=AssertionError("Must not prepare a build")):
            for number in [None, 0, 3]:
                with self.subTest(number=number), self.assertRaises(ValueError):
                    probe.build(number)

    def test_targeted_cancel_requires_failed_save_observation_exact_snapshot_and_zero_gets(self):
        status = "Credential entry cancelled; saved profile unchanged."
        report = {"passed":False,"cleanupComplete":True,"evidence":"runtime-ui-packaged","case":"studio-settings","details":{"passed":False,"phase":1,"stage":"alpha-entry",
                  "nativeStatus":status,"error":"Error: Native entry result: "+status,
                  "checks":["Fixed Windows phase selected","Shared v2 profiles and foreign cleanup retained","Initial fixture has no native keys"]}}
        observed={"failedSaveRetainedInput":True,"cancelAfterExactRestore":True}
        probe.check_cancel_report(report,[],1,b"fixture",b"fixture",observed)
        for failure in ["save-pass","exit","get","snapshot","observation","checks","status"]:
            value=copy.deepcopy(report); requests=[]; code=1; after=b"fixture"; evidence=dict(observed)
            if failure=="save-pass": value["passed"]=True
            elif failure=="exit": code=0
            elif failure=="get": requests=[{}]
            elif failure=="snapshot": after=b"changed"
            elif failure=="observation": evidence["failedSaveRetainedInput"]=False
            elif failure=="checks": value["details"]["checks"]=[]
            elif failure=="status": value["details"]["nativeStatus"]="API key saved"
            with self.subTest(failure=failure), self.assertRaises(ValueError):
                probe.check_cancel_report(value,requests,code,b"fixture",after,evidence)

    def test_partial_reopen_never_accepts_failed_flow_as_cancel_proof(self):
        alpha = copy.deepcopy(probe.read(probe.FIXTURE))
        alpha["revision"] += 2
        alpha["profiles"][0]["revision"] = 2
        alpha["profiles"][0]["credential"] = {"credentialId":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "origin":"http://127.0.0.1:46082", "revision":1}
        gamma = copy.deepcopy(alpha)
        gamma["revision"] += 2
        gamma["profiles"][1]["revision"] = 2
        gamma["profiles"][1]["credential"] = {"credentialId":"ffffffff-ffff-4fff-8fff-ffffffffffff", "origin":"http://127.0.0.1:46082", "revision":1}
        receipt = {"run":3,"passed":False,"exitCode":1,"stopped":True,"elapsedSeconds":245,"requests":[],
                   "report":{"passed":False,"cleanupComplete":True,"evidence":"runtime-ui-packaged","case":"studio-settings","details":{"passed":False,"phase":1,"stage":"cancel-entry","error":"Error: Timeout: cancel-entry",
                   "checks":["Fixed Windows phase selected","Shared v2 profiles and foreign cleanup retained","Initial fixture has no native keys","Retained-field Retry saved A while foreign cleanup remained pending"]}}}
        probe.validate_partial_entry(receipt,alpha,gamma)
        for change in [{"passed":True},{"stopped":False},{"requests":[{}]},{"elapsedSeconds":301},{"run":2}]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                probe.validate_partial_entry(dict(receipt,**change),alpha,gamma)
        for failure in ["inner-pass", "missing-check", "extra-check", "wrong-envelope"]:
            value = copy.deepcopy(receipt)
            if failure == "inner-pass": value["report"]["passed"] = True
            elif failure == "missing-check": value["report"]["details"]["checks"].pop()
            elif failure == "extra-check": value["report"]["details"]["checks"].append("unproved")
            elif failure == "wrong-envelope": value["report"]["case"] = "unrelated"
            with self.subTest(failure=failure), self.assertRaises(ValueError):
                probe.validate_partial_entry(value,alpha,gamma)
        missing = copy.deepcopy(gamma); missing["profiles"][1]["credential"] = None
        with self.assertRaises(ValueError): probe.validate_partial_entry(receipt,alpha,missing)

    def test_reuse_allows_only_external_controller_change_and_rejects_runtime_change(self):
        built = probe.source_inputs()
        built["scripts/windows-studio-credentials.py"] = "old-controller"
        current = dict(built, **{"scripts/windows-studio-credentials.py": "new-controller"})
        self.assertTrue(probe.package_inputs_match(built, current))
        for key in ["src-tauri/src/ai_native/windows.rs", "src-tauri/src/windows_studio_probe.js", "Cargo.lock",
                    "package.json", "index.html", "vite.config.ts", "tsconfig.json", "rust-toolchain.toml"]:
            changed = dict(current)
            changed[key] = "changed"
            with self.subTest(key=key):
                self.assertFalse(probe.package_inputs_match(built, changed))
            missing = dict(built)
            del missing[key]
            self.assertFalse(probe.package_inputs_match(missing, current))
        self.assertFalse(probe.package_inputs_match({}, {}))
        self.assertEqual(probe.run_prefix(3, 1), "phase-1-final")
        self.assertEqual(probe.run_prefix(4, 2), "phase-2")
        with self.assertRaises(ValueError):
            probe.run_prefix(4, 1)

    def test_saved_native_gate_rejects_missing_foreign_unowned_and_changed_other_profile(self):
        old = probe.read(probe.FIXTURE)
        saved = copy.deepcopy(old)
        saved["revision"] += 2
        saved["profiles"][0]["revision"] += 1
        saved["profiles"][0]["credential"] = {"credentialId":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "origin":"http://127.0.0.1:46082", "revision":1}
        probe.validate_saved(old, saved, probe.A)
        for failure in ["missing", "file", "origin", "revision", "service", "uuid", "cleanup", "other",
                        "extra-profile", "duplicate-profile", "reorder", "store-revision", "unknown", "profile-unknown", "credential-unknown"]:
            value = copy.deepcopy(saved)
            c = value["profiles"][0]["credential"]
            if failure == "missing": value["profiles"][0]["credential"] = None
            elif failure == "file": c["storage"] = {"kind":"developmentFile", "generationId":probe.A}
            elif failure == "origin": c["origin"] = "http://127.0.0.1:46083"
            elif failure == "revision": c["revision"] = 2
            elif failure == "service": c["service"] = "app.loomlight"
            elif failure == "uuid": c["credentialId"] = "not-owned"
            elif failure == "cleanup": value["cleanup"] = []
            elif failure == "other": value["profiles"][1]["settings"]["label"] = "Changed"
            elif failure == "extra-profile": value["profiles"].append(dict(value["profiles"][1], profileId="ffffffff-ffff-4fff-8fff-ffffffffffff"))
            elif failure == "duplicate-profile": value["profiles"].append(copy.deepcopy(value["profiles"][0]))
            elif failure == "reorder": value["profiles"].reverse()
            elif failure == "store-revision": value["revision"] += 1
            elif failure == "unknown": value["unproved"] = True
            elif failure == "profile-unknown": value["profiles"][0]["unproved"] = True
            elif failure == "credential-unknown": c["unproved"] = True
            with self.subTest(failure=failure), self.assertRaises(ValueError):
                probe.validate_saved(old, value, probe.A)

        replacement = copy.deepcopy(saved)
        replacement["revision"] += 3
        replacement["profiles"][0]["revision"] += 1
        replacement["profiles"][0]["credential"] = dict(saved["profiles"][0]["credential"],
            credentialId="ffffffff-ffff-4fff-8fff-ffffffffffff", revision=2)
        probe.validate_saved(saved, replacement, probe.A)
        replacement["profiles"][0]["credential"]["credentialId"] = saved["profiles"][0]["credential"]["credentialId"]
        with self.assertRaises(ValueError): probe.validate_saved(saved, replacement, probe.A)

    def test_native_report_rejects_zero_wrong_skipped_failed_and_overbudget_results(self):
        report = {"passed":True, "cleanupComplete":True,"evidence":"runtime-ui-packaged","case":"studio-settings", "details":{"passed":True,"stage":"complete", "phase":1, "checks":probe.CHECKS[1]}}
        requests = [{"method":"GET","path":"/v1/models","label":"alpha", "accepted":True}, {"method":"GET","path":"/v1/models","label":"alpha", "accepted":True}]
        probe.check_report(1, report, requests, 0)
        for failure in ["zero", "skipped", "failed", "cleanup", "wrong-phase", "missing-checks", "overbudget", "wrong-key", "wrong-exit", "wrong-envelope", "wrong-method", "wrong-path", "inner-failed"]:
            value, sent, code = copy.deepcopy(report), copy.deepcopy(requests), 0
            if failure == "zero": sent.clear()
            elif failure == "skipped": value["details"]["stage"] = "skipped"
            elif failure == "failed": value["passed"] = False
            elif failure == "cleanup": value["cleanupComplete"] = False
            elif failure == "wrong-phase": value["details"]["phase"] = 2
            elif failure == "missing-checks": value["details"]["checks"] = []
            elif failure == "overbudget": sent += requests
            elif failure == "wrong-key": sent[1]["accepted"] = False
            elif failure == "wrong-exit": code = 1
            elif failure == "wrong-envelope": value["evidence"] = "unrelated"
            elif failure == "wrong-method": sent[0]["method"] = "POST"
            elif failure == "wrong-path": sent[0]["path"] = "/other"
            elif failure == "inner-failed": value["details"]["passed"] = False
            with self.subTest(failure=failure), self.assertRaises(ValueError):
                probe.check_report(1, value, sent, code)

if __name__ == "__main__":
    unittest.main()
