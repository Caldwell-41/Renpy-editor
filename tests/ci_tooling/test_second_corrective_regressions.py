"""Regressions required by the OPT-1A second corrective pass."""
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


def response(status, body=None):
    return ci_lib.ApiResponse(status, body, {})


class FakeTransport:
    def __init__(self, responses, log=b""):
        self.responses = list(responses)
        self.calls = []
        self.log = log

    def request(self, method, path, body=None):
        self.calls.append((method, path, body))
        if not self.responses:
            raise AssertionError("unexpected transport call")
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    def request_bytes(self, path, *, limit=65536):
        self.calls.append(("GET_BYTES", path, None))
        return self.log[:limit]


class SecondCorrectiveRegressions(unittest.TestCase):
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
        self.git("commit", "-qm", "candidate")
        self.candidate = self.git("rev-parse", "HEAD").stdout.decode().strip()
        self.git("remote", "add", "origin", "https://github.com/Caldwell-41/Renpy-editor.git")
        self.git("update-ref", "refs/remotes/origin/topic", self.candidate)
        self.store = ci_lib.OperationStore(self.root, self.root / "state.sqlite3", secure=False)
        self.addCleanup(self.store.connection.close)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def run_body(self, *, operation_key, request_id="00000000-0000-4000-8000-000000000001"):
        return {
            "id": 41,
            "event": "workflow_dispatch",
            "head_sha": self.candidate,
            "head_branch": "topic",
            "path": ci_lib.WORKFLOW_PATH,
            "run_attempt": 1,
            "status": "queued",
            "conclusion": None,
            "display_title": (
                f"Phase 1 production gates / {operation_key} / packages=false / "
                f"full=false / request={request_id}"
            ),
        }

    def test_dispatch_unknown_survives_unrelated_head_workflow_change(self):
        first = FakeTransport([
            response(200, {"total_count": 0, "workflow_runs": []}),
            ci_lib.CiError("lost"),
            response(200, {"total_count": 0, "workflow_runs": []}),
        ])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, first, ref="topic", sha=self.candidate)
        (self.root / ci_lib.WORKFLOW_PATH).write_text("name: unrelated-head-change\n", encoding="utf-8")
        self.git("add", ci_lib.WORKFLOW_PATH)
        self.git("commit", "-qm", "move head only")
        second = FakeTransport([
            response(200, {"total_count": 0, "workflow_runs": []}),
        ])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, second, ref="topic", sha=self.candidate)
        self.assertEqual(
            sum(call[0] == "POST" for call in first.calls + second.calls),
            1,
        )
        count = self.store.connection.execute("SELECT COUNT(*) FROM operations").fetchone()[0]
        self.assertEqual(count, 1)

    def test_fresh_store_attaches_one_proven_remote_run_before_post(self):
        identity = ci_lib.operation_identity(
            self.root,
            ref="topic",
            sha=self.candidate,
            upload_packages=False,
            force_full=False,
        )
        run = self.run_body(operation_key=identity.operation_key)
        transport = FakeTransport([
            response(200, {"total_count": 1, "workflow_runs": [run]}),
        ])
        result = ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.candidate)
        self.assertEqual(result["run_id"], 41)
        self.assertFalse(any(call[0] == "POST" for call in transport.calls))

    def test_incomplete_reconciliation_never_posts(self):
        filler = [{"id": index} for index in range(100)]
        transport = FakeTransport([
            response(200, {"total_count": 101, "workflow_runs": filler}),
        ])
        with self.assertRaises(ci_lib.CiError):
            ci_lib.submit(self.root, self.store, transport, ref="topic", sha=self.candidate)
        self.assertFalse(any(call[0] == "POST" for call in transport.calls))

    def test_empty_steps_and_unknown_conclusions_cannot_be_accepted(self):
        for steps in ([], [{"name": "gate", "status": "completed", "conclusion": None}]):
            with self.subTest(steps=steps):
                jobs = [
                    {
                        "id": index + 1,
                        "name": name,
                        "status": "completed",
                        "conclusion": "success",
                        "head_sha": self.candidate,
                        "steps": steps,
                    }
                    for index, name in enumerate(ci_lib.REQUIRED_JOBS)
                ]
                run = self.run_body(operation_key="a" * 64)
                run.update({"status": "completed", "conclusion": "success"})
                transport = FakeTransport([
                    response(200, run),
                    response(200, {"total_count": len(jobs), "jobs": jobs}),
                ])
                result = ci_lib.collect(
                    transport,
                    run_id=41,
                    attempt=1,
                    expected_sha=self.candidate,
                    expected_ref="topic",
                )
                self.assertFalse(result["accepted"])

    def test_provider_log_text_is_never_in_public_result(self):
        jobs = [
            {
                "id": index + 1,
                "name": name,
                "status": "completed",
                "conclusion": "failure" if index == 1 else "success",
                "head_sha": self.candidate,
                "steps": [{"name": "gate", "status": "completed", "conclusion": "failure" if index == 1 else "success"}],
            }
            for index, name in enumerate(ci_lib.REQUIRED_JOBS)
        ]
        run = self.run_body(operation_key="a" * 64)
        run.update({"status": "completed", "conclusion": "failure"})
        secret = b"future-secret-format=DO-NOT-PUBLISH endpoint=synthetic.invalid\x1b[31m"
        transport = FakeTransport([
            response(200, run),
            response(200, {"total_count": len(jobs), "jobs": jobs}),
        ], secret)
        result = ci_lib.collect(
            transport,
            run_id=41,
            attempt=1,
            expected_sha=self.candidate,
            expected_ref="topic",
        )
        public = json.dumps(result, sort_keys=True)
        self.assertNotIn("DO-NOT-PUBLISH", public)
        self.assertNotIn("synthetic.invalid", public)
        self.assertNotIn("failure_diagnostics", result)


if __name__ == "__main__":
    unittest.main()
