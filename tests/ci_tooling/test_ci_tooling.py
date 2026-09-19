"""Offline OPT-1A identity, recovery, collection, and workflow regressions."""
from __future__ import annotations

import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

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
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
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
        self.identity = ci_lib.operation_identity(self.root, ref="topic", sha=self.sha)
        self.database = self.root / "state.sqlite3"
        self.store = ci_lib.OperationStore(self.root, self.database, secure=False)
        self.addCleanup(self.store.connection.close)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def title(self, identity=None, request_id="00000000-0000-4000-8000-000000000001"):
        selected = identity or self.identity
        packages = str(selected.upload_packages).lower()
        full = str(selected.force_full).lower()
        return (
            f"Phase 1 production gates / {selected.operation_key} / packages={packages} / "
            f"full={full} / request={request_id}"
        )

    def run_body(
        self,
        *,
        identity=None,
        status="queued",
        conclusion=None,
        attempt=1,
        sha=None,
        ref="topic",
        run_id=41,
        title=None,
    ):
        selected = identity or self.identity
        return {
            "id": run_id,
            "event": "workflow_dispatch",
            "head_sha": sha or selected.candidate_sha,
            "head_branch": ref,
            "path": ci_lib.WORKFLOW_PATH,
            "run_attempt": attempt,
            "status": status,
            "conclusion": conclusion,
            "display_title": title or self.title(selected),
        }

    def steps(self, name, *, upload_packages=False):
        result = []
        for step_name in ci_lib.REQUIRED_STEPS[name]:
            conclusion = "success"
            if step_name == "Download pinned official Ren'Py SDK on cache miss":
                conclusion = "skipped"
            if step_name == "Upload packaged application for manual runs" and not upload_packages:
                conclusion = "skipped"
            result.append({"name": step_name, "status": "completed", "conclusion": conclusion})
        return result

    def job(self, name, *, job_id, conclusion="success", status="completed", sha=None, steps=None):
        return {
            "id": job_id,
            "name": name,
            "status": status,
            "conclusion": conclusion,
            "head_sha": sha or self.sha,
            "steps": self.steps(name) if steps is None else steps,
        }

    def jobs(self):
        return [self.job(name, job_id=index + 1) for index, name in enumerate(ci_lib.REQUIRED_JOBS)]

    def no_remote_match(self):
        return response(200, {"total_count": 0, "workflow_runs": []})

    def test_direct_receipt_and_duplicate_submit_attach_once(self):
        transport = FakeTransport(
            [
                self.no_remote_match(),
                response(200, {"workflow_run_id": 41}),
                response(200, self.run_body()),
            ]
        )
        first = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        second = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual(first["run_id"], 41)
        self.assertTrue(second["attached_existing"])
        self.assertEqual(sum(call[0] == "POST" for call in transport.calls), 1)
        post = next(call for call in transport.calls if call[0] == "POST")
        self.assertIs(post[2]["return_run_details"], True)

    def test_lost_response_and_restart_never_retransmit(self):
        first = FakeTransport(
            [self.no_remote_match(), ci_lib.CiError("lost"), self.no_remote_match()]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, first, ref="topic", sha=self.sha)
        operation_id = self.store.connection.execute(
            "SELECT operation_id FROM operations"
        ).fetchone()[0]
        self.store.connection.close()
        restarted = ci_lib.OperationStore(self.root, self.database, secure=False)
        self.addCleanup(restarted.connection.close)
        self.store = restarted
        second = FakeTransport([self.no_remote_match()])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, restarted, second, ref="topic", sha=self.sha)
        self.assertEqual(sum(call[0] == "POST" for call in first.calls + second.calls), 1)
        self.assertEqual(restarted.get(operation_id)["state"], "dispatch_unknown")

    def test_lost_response_with_unavailable_reconciliation_records_unknown(self):
        transport = FakeTransport(
            [self.no_remote_match(), ci_lib.CiError("lost"), ci_lib.CiError("unavailable")]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        state = self.store.connection.execute("SELECT state FROM operations").fetchone()[0]
        self.assertEqual(state, "dispatch_unknown")
        self.assertEqual(sum(call[0] == "POST" for call in transport.calls), 1)

    def test_force_full_cannot_bypass_unresolved_candidate_operation(self):
        transport = FakeTransport(
            [self.no_remote_match(), ci_lib.CiError("lost"), self.no_remote_match()]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(
                self.root,
                self.store,
                FakeTransport([]),
                ref="topic",
                sha=self.sha,
                force_full=True,
            )
        count = self.store.connection.execute("SELECT COUNT(*) FROM operations").fetchone()[0]
        self.assertEqual(count, 1)

    def test_legacy_no_content_receipt_reconciles_exact_run(self):
        run = self.run_body()
        transport = FakeTransport(
            [
                self.no_remote_match(),
                response(204),
                response(200, {"total_count": 1, "workflow_runs": [run]}),
            ]
        )
        result = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertEqual(result["run_id"], 41)
        self.assertEqual(sum(call[0] == "POST" for call in transport.calls), 1)

    def test_supported_reconcile_attaches_unknown_without_post(self):
        first = FakeTransport(
            [self.no_remote_match(), ci_lib.CiError("lost"), self.no_remote_match()]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, first, ref="topic", sha=self.sha)
        operation_id = self.store.connection.execute(
            "SELECT operation_id FROM operations"
        ).fetchone()[0]
        recovery = FakeTransport(
            [response(200, {"total_count": 1, "workflow_runs": [self.run_body()]})]
        )
        result = ci_lib.reconcile_operation(
            self.store,
            recovery,
            operation_id=operation_id,
        )
        self.assertTrue(result["reconciled"])
        self.assertEqual(result["run_id"], 41)
        self.assertFalse(any(call[0] == "POST" for call in recovery.calls))

    def test_ambiguous_reconciliation_blocks(self):
        second = self.run_body(run_id=42)
        transport = FakeTransport(
            [response(200, {"total_count": 2, "workflow_runs": [self.run_body(), second]})]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        state = self.store.connection.execute("SELECT state FROM operations").fetchone()[0]
        self.assertEqual(state, "blocked")
        self.assertFalse(any(call[0] == "POST" for call in transport.calls))

    def test_contradictory_remote_identity_blocks(self):
        contradictory = self.run_body(sha="1" * 40)
        transport = FakeTransport(
            [response(200, {"total_count": 1, "workflow_runs": [contradictory]})]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertFalse(any(call[0] == "POST" for call in transport.calls))

    def test_contradictory_remote_options_block(self):
        contradictory = self.run_body(
            title=self.title().replace("packages=false", "packages=true")
        )
        transport = FakeTransport(
            [response(200, {"total_count": 1, "workflow_runs": [contradictory]})]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        self.assertFalse(any(call[0] == "POST" for call in transport.calls))

    def test_wrong_remote_ref_is_rejected_before_store_write(self):
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, FakeTransport([]), ref="topic", sha="0" * 40)
        count = self.store.connection.execute("SELECT COUNT(*) FROM operations").fetchone()[0]
        self.assertEqual(count, 0)

    def test_malicious_ref_is_rejected(self):
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, FakeTransport([]), ref="topic;bad", sha=self.sha)

    def test_mismatched_direct_receipt_run_is_blocked(self):
        transport = FakeTransport(
            [
                self.no_remote_match(),
                response(200, {"workflow_run_id": 41}),
                response(200, self.run_body(sha="1" * 40)),
            ]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)

    def test_direct_receipt_metadata_delay_recovers_without_second_post(self):
        transport = FakeTransport(
            [
                self.no_remote_match(),
                response(200, {"workflow_run_id": 41}),
                ci_lib.CiError("eventual metadata delay"),
            ]
        )
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.sha)
        operation_id, state, run_id = self.store.connection.execute(
            "SELECT operation_id, state, run_id FROM operations"
        ).fetchone()
        self.assertEqual((state, run_id), ("dispatch_unknown", 41))
        recovery = FakeTransport([response(200, self.run_body())])
        result = ci_lib.reconcile_operation(
            self.store,
            recovery,
            operation_id=operation_id,
        )
        self.assertTrue(result["reconciled"])
        self.assertEqual(result["reason_code"], "direct_receipt_validated")
        self.assertEqual(sum(call[0] == "POST" for call in transport.calls + recovery.calls), 1)

    def test_concurrent_reservation_has_one_operation(self):
        second = ci_lib.OperationStore(self.root, self.database, secure=False)
        self.addCleanup(second.connection.close)
        first_row, first_created = self.store.reserve(self.identity)
        second_row, second_created = second.reserve(self.identity)
        self.assertTrue(first_created)
        self.assertFalse(second_created)
        self.assertEqual(first_row["operation_id"], second_row["operation_id"])

    def test_candidate_workflow_change_produces_a_new_identity(self):
        (self.root / ci_lib.WORKFLOW_PATH).write_text("name: changed\n", encoding="utf-8")
        self.git("add", ci_lib.WORKFLOW_PATH)
        self.git("commit", "-qm", "change candidate workflow")
        changed_sha = self.git("rev-parse", "HEAD").stdout.decode().strip()
        self.git("update-ref", "refs/remotes/origin/topic", changed_sha)
        changed = ci_lib.operation_identity(self.root, ref="topic", sha=changed_sha)
        self.assertNotEqual(changed.operation_key, self.identity.operation_key)
        self.assertNotEqual(changed.workflow_revision, self.identity.workflow_revision)

    def test_unversioned_existing_journal_is_refused(self):
        database = self.root / "unversioned.sqlite3"
        connection = sqlite3.connect(database)
        connection.execute("CREATE TABLE legacy_state (value TEXT)")
        connection.commit()
        connection.close()
        with self.assertRaises(ci_lib.CiError):
            ci_lib.OperationStore(self.root, database, secure=False)

    def test_tampered_stored_identity_is_rejected(self):
        operation, _ = self.store.reserve(self.identity)
        self.store.connection.execute(
            "UPDATE operations SET ref = ? WHERE operation_id = ?",
            ("other", operation["operation_id"]),
        )
        with self.assertRaises(ci_lib.CiError):
            self.store.get(operation["operation_id"])

    def test_collect_success_requires_all_exact_steps(self):
        jobs = self.jobs()
        transport = FakeTransport(
            [
                response(200, self.run_body(status="completed", conclusion="success")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertTrue(result["accepted"])

    def test_collect_rejects_missing_mandatory_step(self):
        jobs = self.jobs()
        jobs[1]["steps"] = jobs[1]["steps"][:-1]
        transport = FakeTransport(
            [
                response(200, self.run_body(status="completed", conclusion="success")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertFalse(result["accepted"])
        self.assertIn("mandatory_step_missing", result["reason_codes"])

    def test_collect_rejects_unknown_or_unexpected_step_conclusions(self):
        for conclusion in (None, "skipped", {"malformed": True}):
            with self.subTest(conclusion=conclusion):
                jobs = self.jobs()
                jobs[1]["steps"][0]["conclusion"] = conclusion
                transport = FakeTransport(
                    [
                        response(200, self.run_body(status="completed", conclusion="success")),
                        response(200, {"total_count": len(jobs), "jobs": jobs}),
                    ]
                )
                result = ci_lib.collect(
                    transport,
                    run_id=41,
                    attempt=1,
                    expected_identity=self.identity,
                )
                self.assertFalse(result["accepted"])
                self.assertIn("mandatory_step_conclusion_invalid", result["reason_codes"])

    def test_collect_rejects_duplicate_job_and_step_evidence(self):
        duplicate_jobs = self.jobs() + [dict(self.jobs()[0], id=99)]
        transport = FakeTransport(
            [
                response(200, self.run_body(status="completed", conclusion="success")),
                response(200, {"total_count": len(duplicate_jobs), "jobs": duplicate_jobs}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertFalse(result["accepted"])
        self.assertIn("required_job_duplicated", result["reason_codes"])

        jobs = self.jobs()
        jobs[1]["steps"].append(dict(jobs[1]["steps"][0]))
        transport = FakeTransport(
            [
                response(200, self.run_body(status="completed", conclusion="success")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertFalse(result["accepted"])
        self.assertIn("steps_duplicated", result["reason_codes"])

    def test_collect_enforces_package_upload_scope(self):
        upload_identity = ci_lib.operation_identity(
            self.root,
            ref="topic",
            sha=self.sha,
            upload_packages=True,
        )
        jobs = [
            self.job(
                name,
                job_id=index + 1,
                steps=self.steps(name, upload_packages=True),
            )
            for index, name in enumerate(ci_lib.REQUIRED_JOBS)
        ]
        transport = FakeTransport(
            [
                response(200, self.run_body(identity=upload_identity, status="completed", conclusion="success")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=upload_identity,
        )
        self.assertTrue(result["accepted"])

    def test_private_failure_log_is_stored_but_never_exported(self):
        jobs = self.jobs()
        jobs[1]["conclusion"] = "failure"
        jobs[1]["steps"][0]["conclusion"] = "failure"
        secret = b"future-secret-format=DO-NOT-PUBLISH synthetic.invalid\x1b[31m"
        operation, _ = self.store.reserve(self.identity)
        transport = FakeLogTransport(
            [
                response(200, self.run_body(status="completed", conclusion="failure")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ],
            secret,
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
            evidence_store=self.store,
            operation_id=operation["operation_id"],
        )
        exported = json.dumps(result, sort_keys=True)
        self.assertNotIn("DO-NOT-PUBLISH", exported)
        self.assertNotIn("synthetic.invalid", exported)
        self.assertNotIn("failure_diagnostics", result)
        stored = self.store.connection.execute("SELECT content FROM diagnostics").fetchone()[0]
        self.assertEqual(stored, secret)
        checkpoint = self.store.get(operation["operation_id"])
        self.assertEqual(len(json.loads(checkpoint["job_refs_json"])), len(ci_lib.REQUIRED_JOBS))

    def test_collection_without_private_store_does_not_fetch_logs(self):
        jobs = self.jobs()
        jobs[1]["conclusion"] = "failure"
        jobs[1]["steps"][0]["conclusion"] = "failure"
        transport = FakeLogTransport(
            [
                response(200, self.run_body(status="completed", conclusion="failure")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ],
            b"synthetic-private-log",
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertFalse(any(call[0] == "GET_BYTES" for call in transport.calls))
        self.assertEqual(result["failure_evidence"][0]["reason_code"], "private_store_not_selected")

    def test_oversized_or_malformed_logs_stay_private_and_bounded(self):
        jobs = self.jobs()
        jobs[1]["conclusion"] = "failure"
        jobs[1]["steps"][0]["conclusion"] = "failure"
        operation, _ = self.store.reserve(self.identity)
        transport = FakeLogTransport(
            [
                response(200, self.run_body(status="completed", conclusion="failure")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ],
            b"X" * 70000,
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
            evidence_store=self.store,
            operation_id=operation["operation_id"],
        )
        content, truncated = self.store.connection.execute(
            "SELECT content, truncated FROM diagnostics"
        ).fetchone()
        self.assertEqual(len(content), 65536)
        self.assertEqual(truncated, 1)
        self.assertNotIn("X" * 100, json.dumps(result))

        other_store = ci_lib.OperationStore(
            self.root,
            self.root / "malformed-log.sqlite3",
            secure=False,
        )
        self.addCleanup(other_store.connection.close)
        other_operation, _ = other_store.reserve(self.identity)
        malformed = FakeLogTransport(
            [
                response(200, self.run_body(status="completed", conclusion="failure")),
                response(200, {"total_count": len(jobs), "jobs": jobs}),
            ],
            b"ignored",
        )
        malformed.request_bytes = lambda *args, **kwargs: "not-bytes"
        result = ci_lib.collect(
            malformed,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
            evidence_store=other_store,
            operation_id=other_operation["operation_id"],
        )
        self.assertEqual(result["failure_evidence"][0]["reason_code"], "private_capture_unavailable")

    def test_log_redirect_drops_authorization_and_bounds_download(self):
        location = "https://logs.blob.core.windows.net/container/log.txt?signature=synthetic"
        redirect = urllib.error.HTTPError(
            "https://api.github.com/logs",
            302,
            "Found",
            {"Location": location},
            None,
        )
        opener = MagicMock()
        opener.open.side_effect = redirect
        download = MagicMock()
        download.__enter__.return_value.read.return_value = b"bounded-log"
        with patch.object(ci_lib.urllib.request, "build_opener", return_value=opener), patch.object(
            ci_lib.urllib.request,
            "urlopen",
            return_value=download,
        ) as fetch:
            value = ci_lib.GitHubTransport("synthetic-token").request_bytes("/safe/logs", limit=20)
        self.assertEqual(value, b"bounded-log")
        request = fetch.call_args.args[0]
        self.assertNotIn("Authorization", request.headers)
        self.assertNotIn("signature=synthetic", repr(request.headers))

    def test_collect_uses_attempt_specific_complete_pagination(self):
        filler = [
            {
                "id": index + 10,
                "name": f"filler-{index}",
                "status": "completed",
                "conclusion": "success",
                "head_sha": self.sha,
                "steps": [],
            }
            for index in range(100)
        ]
        required = self.jobs()
        transport = FakeTransport(
            [
                response(200, self.run_body(status="completed", conclusion="success")),
                response(200, {"total_count": 103, "jobs": filler}),
                response(200, {"total_count": 103, "jobs": required}),
            ]
        )
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_identity=self.identity,
        )
        self.assertTrue(result["accepted"])
        self.assertIn("attempts/1/jobs", transport.calls[1][1])

    def test_collect_rejects_malformed_or_incomplete_pagination(self):
        for body in (
            {"jobs": self.jobs()},
            {"total_count": 4, "jobs": self.jobs()},
        ):
            with self.subTest(body=body):
                transport = FakeTransport(
                    [
                        response(200, self.run_body(status="completed", conclusion="success")),
                        response(200, body),
                    ]
                )
                with self.assertRaises(ci_lib.CiError):
                    ci_lib.collect(
                        transport,
                        run_id=41,
                        attempt=1,
                        expected_identity=self.identity,
                    )

    def test_collect_does_not_follow_newer_attempt(self):
        transport = FakeTransport([response(200, self.run_body(attempt=2))])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.collect(
                transport,
                run_id=41,
                attempt=1,
                expected_identity=self.identity,
            )

    def test_collect_rejects_pr_merge_or_non_dispatch_identity(self):
        run = self.run_body(status="completed", conclusion="success", sha="1" * 40)
        run["event"] = "pull_request"
        run["head_sha"] = "1" * 40
        run["head_branch"] = "refs/pull/1/merge"
        transport = FakeTransport([response(200, run)])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.collect(
                transport,
                run_id=41,
                attempt=1,
                expected_identity=self.identity,
            )

    def test_collector_preserves_known_provider_outcome(self):
        for conclusion in (
            "failure",
            "cancelled",
            "timed_out",
            "neutral",
            "skipped",
            "stale",
            "action_required",
            None,
        ):
            with self.subTest(conclusion=conclusion):
                status = "completed" if conclusion is not None else "in_progress"
                jobs = self.jobs()
                transport = FakeTransport(
                    [
                        response(200, self.run_body(status=status, conclusion=conclusion)),
                        response(200, {"total_count": len(jobs), "jobs": jobs}),
                    ]
                )
                result = ci_lib.collect(
                    transport,
                    run_id=41,
                    attempt=1,
                    expected_identity=self.identity,
                )
                self.assertFalse(result["accepted"])
                self.assertEqual(result["provider_conclusion"], conclusion)

    def test_operation_output_withholds_request_and_identity_key(self):
        operation, _ = self.store.reserve(self.identity)
        public = ci_lib.public_operation(operation, attached=False)
        self.assertNotIn("request_id", public)
        self.assertNotIn("operation_key", public)
        self.assertNotIn("options_json", public)
        self.assertGreater(operation["deadline_at"], operation["created_at"])
        self.assertEqual(
            json.loads(operation["local_checks_json"]),
            [{"name": "candidate_identity", "status": "passed"}],
        )

    def test_bounded_subprocess_timeout_has_value_free_error(self):
        with patch.object(
            ci_lib.subprocess,
            "run",
            side_effect=subprocess.TimeoutExpired(["synthetic"], 1),
        ):
            with self.assertRaises(ci_lib.CiError) as caught:
                ci_lib._run(["synthetic"], self.root, 1)
        self.assertNotIn(str(self.root), str(caught.exception))

    def test_doctor_reports_python_separately_from_codex_binding(self):
        result = ci_lib.doctor(self.root)
        self.assertTrue(result["tools"]["python"])
        self.assertEqual(result["codex_binding"], "unverified")
        self.assertFalse(result["automatic_wake"])

    def test_workflow_recomputes_operation_key_before_native_jobs(self):
        text = (SOURCE / ci_lib.WORKFLOW_PATH).read_text(encoding="utf-8")
        self.assertIn("operation_key:", text)
        self.assertIn("expected_ref:", text)
        self.assertIn("Validate operation identity", text)
        self.assertIn("needs: validate-candidate", text)
        self.assertIn("needs.validate-candidate.outputs.checkout_sha", text)
        self.assertIn("Package production scaffold", text)
        self.assertIn("Run packaged WebView boundary smoke", text)
        self.assertIn("Scan production artifacts for secrets", text)


if __name__ == "__main__":
    unittest.main()
