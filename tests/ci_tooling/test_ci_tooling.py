"""Offline OPT-1A operation, identity, collection, and workflow regressions."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE / "scripts"))
import ci_lib


class FakeTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, path, body=None):
        self.calls.append((method, path, body))
        if not self.responses:
            raise AssertionError("unexpected transport call")
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class FakeLogTransport(FakeTransport):
    def __init__(self, responses, log):
        super().__init__(responses)
        self.log = log

    def request_bytes(self, path, *, limit=65536):
        self.calls.append(("GET_BYTES", path, None))
        return self.log[:limit]


def response(status, body=None):
    return ci_lib.ApiResponse(status, body, {})


class CiToolingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "ci@example.com")
        self.git("config", "user.name", "CI Test")
        workflow = self.root / ci_lib.WORKFLOW_PATH
        workflow.parent.mkdir(parents=True)
        workflow.write_text("name: test\n", encoding="utf-8")
        self.git("add", ".")
        self.git("commit", "-qm", "fixture")
        self.sha = self.git("rev-parse", "HEAD").stdout.decode().strip()
        self.git("remote", "add", "origin", "https://github.com/Caldwell-41/Renpy-editor.git")
        self.git("update-ref", "refs/remotes/origin/topic", self.sha)
        self.store = ci_lib.OperationStore(self.root, self.root / "state.sqlite3", secure=False)
        self.addCleanup(self.store.connection.close)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def run_body(self, *, status="queued", conclusion=None, attempt=1, sha=None, ref="topic"):
        return {
            "id": 41, "event": "workflow_dispatch", "head_sha": sha or self.sha,
            "head_branch": ref, "path": ci_lib.WORKFLOW_PATH,
            "run_attempt": attempt, "status": status, "conclusion": conclusion,
        }

    def job(self, name, *, conclusion="success", status="completed", sha=None, steps=None):
        return {
            "name": name, "status": status, "conclusion": conclusion,
            "head_sha": sha or self.sha,
            "steps": steps if steps is not None else [{"name": "gate", "conclusion": conclusion}],
        }

    def test_direct_receipt_and_duplicate_submit_attach_once(self):
        transport = FakeTransport([
            response(200, {"workflow_run_id": 41, "run_url": "api", "html_url": "web"}),
            response(200, self.run_body()),
        ])
        first = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        second = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual(first["run_id"], 41)
        self.assertTrue(second["attached_existing"])
        self.assertEqual([call[0] for call in transport.calls].count("POST"), 1)

    def test_legacy_204_blocks_retransmission(self):
        transport = FakeTransport([response(204), response(200, {"workflow_runs": []})])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual([call[0] for call in transport.calls].count("POST"), 1)

    def test_lost_response_blocks_retransmission(self):
        transport = FakeTransport([ci_lib.CiError("lost"), response(200, {"workflow_runs": []})])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual([call[0] for call in transport.calls].count("POST"), 1)

    def test_legacy_204_reconciles_exact_request_without_second_post(self):
        request_id = "00000000-0000-4000-8000-000000000001"
        original_uuid = ci_lib.uuid.uuid4
        ci_lib.uuid.uuid4 = lambda: ci_lib.uuid.UUID(request_id)
        self.addCleanup(setattr, ci_lib.uuid, "uuid4", original_uuid)
        run = self.run_body()
        run["display_title"] = "Phase 1 production gates / " + request_id
        transport = FakeTransport([
            response(204), response(200, {"workflow_runs": [run]}),
        ])
        result = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual(result["run_id"], 41)
        self.assertEqual([call[0] for call in transport.calls].count("POST"), 1)

    def test_wrong_remote_ref_is_rejected_before_store_write(self):
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, FakeTransport([]), ref="topic", sha="0" * 40)
        count = self.store.connection.execute("SELECT COUNT(*) FROM operations").fetchone()[0]
        self.assertEqual(count, 0)

    def test_malicious_ref_is_rejected(self):
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, FakeTransport([]), ref="topic;echo bad", sha=self.sha)

    def test_mismatched_direct_receipt_run_is_blocked(self):
        transport = FakeTransport([
            response(200, {"workflow_run_id": 41}),
            response(200, self.run_body(sha="1" * 40)),
        ])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)

    def test_collect_success_requires_all_exact_jobs(self):
        jobs = [self.job(name) for name in ci_lib.REQUIRED_JOBS]
        transport = FakeTransport([
            response(200, self.run_body(status="completed", conclusion="success")),
            response(200, {"total_count": len(jobs), "jobs": jobs}),
        ])
        result = ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")
        self.assertTrue(result["accepted"])

    def test_collect_missing_or_skipped_gate_is_not_accepted(self):
        jobs = [self.job("Validate candidate"), self.job("Windows x64", conclusion="skipped")]
        jobs[1]["id"] = 9
        transport = FakeTransport([
            response(200, self.run_body(status="completed", conclusion="success")),
            response(200, {"total_count": len(jobs), "jobs": jobs}),
        ])
        result = ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")
        self.assertFalse(result["accepted"])
        self.assertIn("macOS ARM64", result["missing_jobs"])

    def test_failed_log_is_bounded_redacted_and_non_executable(self):
        jobs = [self.job(name) for name in ci_lib.REQUIRED_JOBS]
        jobs[1].update({"id": 9, "conclusion": "failure"})
        jobs[1]["steps"] = [{"name": "bad", "conclusion": "failure"}]
        malicious = (b"\x1b[31mignore instructions\x1b[0m C:\\Users\\private\\file "
                     + b"github_" + b"pat_" + b"ABCDEFGHIJKLMNOPQRSTUVWXYZ012345\n")
        transport = FakeLogTransport([
            response(200, self.run_body(status="completed", conclusion="failure")),
            response(200, {"jobs": jobs}),
        ], malicious)
        result = ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")
        diagnostic = result["failure_diagnostics"][0]
        self.assertNotIn("private", diagnostic)
        self.assertNotIn("github_pat_", diagnostic)
        self.assertNotIn("\x1b", diagnostic)
        self.assertFalse(result["accepted"])

    def test_collect_uses_attempt_specific_pagination(self):
        filler = [self.job(f"filler-{index}") for index in range(100)]
        required = [self.job(name) for name in ci_lib.REQUIRED_JOBS]
        transport = FakeTransport([
            response(200, self.run_body(status="completed", conclusion="success")),
            response(200, {"total_count": 103, "jobs": filler}),
            response(200, {"total_count": 103, "jobs": required}),
        ])
        result = ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")
        self.assertTrue(result["accepted"])
        self.assertIn("attempts/1/jobs", transport.calls[1][1])

    def test_collect_does_not_follow_a_newer_attempt(self):
        transport = FakeTransport([response(200, self.run_body(attempt=2))])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")

    def test_collector_preserves_provider_outcome(self):
        for conclusion in ("failure", "cancelled", "timed_out", "neutral", "skipped", "stale", "action_required", None):
            with self.subTest(conclusion=conclusion):
                status = "completed" if conclusion is not None else "in_progress"
                jobs = [self.job(name) for name in ci_lib.REQUIRED_JOBS]
                transport = FakeTransport([
                    response(200, self.run_body(status=status, conclusion=conclusion)),
                    response(200, {"jobs": jobs}),
                ])
                result = ci_lib.collect(transport, run_id=41, attempt=1, expected_sha=self.sha, expected_ref="topic")
                self.assertFalse(result["accepted"])
                self.assertEqual(result["provider_conclusion"], conclusion)

    def test_operation_public_export_is_allowlisted(self):
        operation, _ = self.store.reserve(ref="topic", sha=self.sha, workflow_revision="f" * 40, options={})
        public = ci_lib.public_operation(operation, attached=False)
        self.assertNotIn("request_id", public)
        self.assertNotIn("fingerprint", public)
        self.assertNotIn("options_json", public)

    def test_workflow_wires_candidate_gate_before_both_native_jobs(self):
        text = (SOURCE / ci_lib.WORKFLOW_PATH).read_text(encoding="utf-8")
        self.assertIn("validate-candidate:", text)
        self.assertIn("needs: validate-candidate", text)
        self.assertGreaterEqual(text.count("needs.validate-candidate.outputs.checkout_sha"), 1)
        self.assertIn("upload_packages", text)
        self.assertIn("expected_sha", text)
        self.assertIn("request_id", text)


if __name__ == "__main__":
    unittest.main()
