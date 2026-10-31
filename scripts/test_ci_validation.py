"""Contract tests for complete PR validation, using GitHub-shaped responses."""

import copy
import json
import unittest
from unittest.mock import patch

from ci_validation import QUALITY, PLAN_PATH, combined_state, evaluate_run, load_plan, report

SHA = "a" * 40
BRANCH = "codex/ci-validation"
QUALIFICATION = {
    "name": "Windows qualification", "workflow": "screens-source.yml",
    "event": "workflow_dispatch", "jobs": ["Style / Windows x64"],
}
PLAN = {"version": 1, "branch": BRANCH, "qualifications": [QUALIFICATION]}


def run(identifier=1, *, requirement=QUALIFICATION, sha=SHA, attempt=1,
        status="completed", conclusion="success"):
    return {"id": identifier, "head_sha": sha, "event": requirement["event"],
            "path": ".github/workflows/" + requirement["workflow"], "run_attempt": attempt,
            "html_url": f"https://github.com/owner/repo/actions/runs/{identifier}",
            "status": status, "conclusion": conclusion}


def job(name="Style / Windows x64", *, status="completed", conclusion="success"):
    return {"name": name, "status": status, "conclusion": conclusion}


class CompletionTests(unittest.TestCase):
    def test_ordinary_quality_success_cannot_hide_unstarted_qualification(self):
        missing = evaluate_run(QUALIFICATION, SHA, [], lambda _: self.fail("No run exists"))
        self.assertEqual(missing, ("pending", "not started", None))
        self.assertEqual(combined_state([("success", "quality passed", None), missing]), "pending")

    def test_old_candidate_and_wrong_event_or_workflow_do_not_qualify(self):
        for change in ({"head_sha": "b" * 40}, {"event": "pull_request"},
                       {"path": ".github/workflows/another.yml"}):
            candidate = run()
            candidate.update(change)
            self.assertEqual(evaluate_run(QUALIFICATION, SHA, [candidate], lambda _: [job()])[0],
                             "pending")

    def test_latest_run_and_exact_attempt_replace_previous_success(self):
        seen = []
        newer = run(2, attempt=2, status="in_progress", conclusion=None)
        def jobs_for(selected):
            seen.append((selected["id"], selected["run_attempt"]))
            return [job(status="queued", conclusion=None)]
        state, _, url = evaluate_run(QUALIFICATION, SHA, [run(1), newer], jobs_for)
        self.assertEqual(state, "pending")
        self.assertEqual(seen, [(2, 2)])
        self.assertTrue(url.endswith("/2/attempts/2"))

    def test_required_skipped_cancelled_failed_and_missing_jobs_do_not_pass(self):
        for conclusion in ("skipped", "cancelled", "failure", "neutral", "timed_out", None):
            with self.subTest(conclusion=conclusion):
                self.assertEqual(evaluate_run(QUALIFICATION, SHA, [run()],
                                             lambda _: [job(conclusion=conclusion)])[0], "failure")
        self.assertEqual(evaluate_run(QUALIFICATION, SHA, [run()], lambda _: [])[0], "failure")
        self.assertEqual(evaluate_run(QUALIFICATION, SHA, [run()], lambda _: [job(), job()])[0], "error")

    def test_pending_jobs_and_unlisted_running_work_keep_gate_pending(self):
        active = run(status="in_progress", conclusion=None)
        for jobs in ([], [job(status="in_progress", conclusion=None)],
                     [job(), job("Other real job", status="queued", conclusion=None)]):
            self.assertEqual(evaluate_run(QUALIFICATION, SHA, [active], lambda _: jobs)[0], "pending")

    def test_optional_skips_and_finish_reporter_do_not_block_success(self):
        active = run(status="in_progress", conclusion=None)
        jobs = [job(), job("Unselected specialist", conclusion="skipped"),
                job("Validation status (finish) / Report validation", status="in_progress", conclusion=None)]
        self.assertEqual(evaluate_run(QUALIFICATION, SHA, [active], lambda _: jobs)[0], "success")

    def test_run_or_other_executed_job_failure_cannot_be_hidden(self):
        failed = run(conclusion="cancelled")
        self.assertEqual(evaluate_run(QUALIFICATION, SHA, [failed], lambda _: [job()])[0], "failure")
        self.assertEqual(evaluate_run(QUALIFICATION, SHA, [run()],
                                     lambda _: [job(), job("Selection guard", conclusion="failure")])[0],
                         "failure")

    def test_every_selected_workflow_must_pass(self):
        self.assertEqual(combined_state([("success", "", None)] * 3), "success")
        self.assertEqual(combined_state([("pending", "", None), ("failure", "", None)]), "failure")
        self.assertEqual(combined_state([]), "error")


class PlanTests(unittest.TestCase):
    def test_explicit_quality_only_and_selected_qualification(self):
        self.assertEqual(load_plan({**PLAN, "qualifications": []}, BRANCH), [QUALITY])
        self.assertEqual(load_plan(PLAN, BRANCH), [QUALITY, QUALIFICATION])

    def test_missing_wrong_branch_empty_job_or_duplicate_requirement_is_rejected(self):
        bad_plans = [None, {}, {**PLAN, "branch": "another-branch"},
                     {**PLAN, "qualifications": None},
                     {**PLAN, "qualifications": [QUALIFICATION, QUALIFICATION]}]
        for update in ({"jobs": []}, {"jobs": ["Validation status (finish)"]},
                       {"workflow": "../secret.yml"}, {"event": "pull_request"},
                       {"jobs": ["Windows", "Windows"]}):
            bad_plans.append({**PLAN, "qualifications": [{**QUALIFICATION, **update}]})
        for plan in bad_plans:
            with self.subTest(plan=plan), self.assertRaises(ValueError):
                load_plan(plan, BRANCH)


class FakeGitHub:
    def __init__(self):
        self.pr = {"number": 73, "state": "open", "head": {"sha": SHA, "ref": BRANCH}}
        self.plan = copy.deepcopy(PLAN)
        self.statuses = []
        self.pr_reads = 0
        self.move_on_second_read = False
        self.source = "uses: ./.github/workflows/validation-status.yml"
        self.qualifying_run = run(2)
        self.qualifying_jobs = [job()]
        self.job_requests = []

    def request(self, path, body=None):
        if path.startswith("pulls/"):
            self.pr_reads += 1
            result = copy.deepcopy(self.pr)
            if self.move_on_second_read and self.pr_reads == 2:
                result["head"]["sha"] = "b" * 40
            return result
        if path == "statuses/" + SHA:
            self.statuses.append(body)
            return body
        raise AssertionError(path)

    def contents(self, path, sha):
        assert sha == SHA
        return json.dumps(self.plan) if path == PLAN_PATH else self.source

    def pages(self, path, key=None):
        if path.startswith("actions/workflows/quality.yml/runs?"):
            assert "head_sha=" + SHA in path
            assert "event=pull_request" in path
            return [run(1, requirement=QUALITY)]
        if path.startswith("actions/workflows/screens-source.yml/runs?"):
            assert "event=workflow_dispatch" in path
            return [self.qualifying_run] if self.qualifying_run else []
        if path == "actions/runs/1/attempts/1/jobs":
            return [job(name) for name in QUALITY["jobs"]]
        if path.startswith("actions/runs/2/attempts/"):
            self.job_requests.append(path)
            return self.qualifying_jobs
        raise AssertionError(path)


class ReporterTests(unittest.TestCase):
    @patch("builtins.print")
    def test_real_report_flow_keeps_quality_green_and_qualification_pending_then_passes(self, _):
        api = FakeGitHub()
        api.qualifying_run = None
        self.assertEqual(report(api, api.pr, "https://example.test/run"), "pending")
        api.qualifying_run = run(2, attempt=3)
        self.assertEqual(report(api, api.pr, "https://example.test/run"), "success")
        self.assertEqual([status["state"] for status in api.statuses], ["pending", "success"])
        self.assertEqual(api.job_requests, ["actions/runs/2/attempts/3/jobs"])

    @patch("builtins.print")
    def test_new_commit_during_read_prevents_publishing_stale_success(self, _):
        api = FakeGitHub()
        api.move_on_second_read = True
        self.assertIsNone(report(api, api.pr, "https://example.test/run"))
        self.assertEqual(api.statuses, [])

    @patch("builtins.print")
    def test_invalid_plan_or_unhooked_workflow_publishes_error(self, _):
        for broken in ("plan", "hook"):
            api = FakeGitHub()
            if broken == "plan":
                api.plan["branch"] = "old-branch"
            else:
                api.source = "jobs: {}"
            self.assertEqual(report(api, api.pr, "https://example.test/run"), "error")
            self.assertEqual(api.statuses[-1]["state"], "error")

    @patch("builtins.print")
    def test_cancelled_required_job_is_reported_as_failure(self, _):
        api = FakeGitHub()
        api.qualifying_jobs = [job(conclusion="cancelled")]
        self.assertEqual(report(api, api.pr, "https://example.test/run"), "failure")


if __name__ == "__main__":
    unittest.main()
