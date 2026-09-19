"""Candidate-bound CI operations for Loomlight. No Codex runtime dependency."""
from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import time
from typing import Any, Protocol
import urllib.error
import urllib.parse
import urllib.request
import uuid

from codex_local import LocalConfigError, assert_ignored, ensure_private_directory

SCHEMA_VERSION = 1
API_VERSION = "2026-03-10"
REPOSITORY = "Caldwell-41/Renpy-editor"
WORKFLOW = "production-scaffold.yml"
WORKFLOW_PATH = ".github/workflows/production-scaffold.yml"
FULL_SHA = re.compile(r"[0-9a-f]{40}\Z")
SAFE_REF = re.compile(r"(?!.*(?:\.\.|@\{|\\|\s))[A-Za-z0-9][A-Za-z0-9._/-]{0,199}\Z")
REQUEST_ID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z")
REQUIRED_JOBS = ("Validate candidate", "Windows x64", "macOS ARM64")
TERMINAL_FAILURES = {"failure", "cancelled", "timed_out", "neutral", "skipped", "stale", "action_required"}


class CiError(Exception):
    """Safe, public diagnostic without credentials, private paths, or provider bodies."""


@dataclass(frozen=True)
class ApiResponse:
    status: int
    body: dict[str, Any] | None
    headers: dict[str, str]


class Transport(Protocol):
    def request(self, method: str, path: str, body: dict[str, Any] | None = None) -> ApiResponse: ...


class GitHubTransport:
    def __init__(self, token: str | None = None, *, timeout: int = 30):
        self.token = token if token is not None else os.environ.get("GITHUB_TOKEN")
        self.timeout = timeout

    @classmethod
    def from_local_credentials(cls, root: Path) -> "GitHubTransport":
        token = os.environ.get("GITHUB_TOKEN")
        if token:
            return cls(token)
        result = _run(
            ["git", "credential", "fill"], root, 20,
            input_bytes=b"protocol=https\nhost=github.com\n\n",
        )
        if result.returncode:
            raise CiError("Approved GitHub dispatch credentials are unavailable locally.")
        fields: dict[str, str] = {}
        try:
            for line in result.stdout.decode("utf-8").splitlines():
                if "=" in line:
                    key, value = line.split("=", 1)
                    fields[key] = value
        except UnicodeError:
            raise CiError("Local GitHub credential response was invalid.") from None
        token = fields.get("password")
        if not token or len(token) > 4096:
            raise CiError("Approved GitHub dispatch credentials are unavailable locally.")
        return cls(token)

    def request(self, method: str, path: str, body: dict[str, Any] | None = None) -> ApiResponse:
        if not path.startswith("/") or ".." in path:
            raise CiError("Invalid GitHub API path.")
        data = None if body is None else json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "loomlight-ci-operation/1",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = urllib.request.Request(
            "https://api.github.com" + path, data=data, headers=headers, method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read(2 * 1024 * 1024 + 1)
                if len(raw) > 2 * 1024 * 1024:
                    raise CiError("GitHub response exceeded the safety limit.")
                parsed = json.loads(raw) if raw else None
                if parsed is not None and not isinstance(parsed, dict):
                    raise CiError("GitHub returned an unexpected response shape.")
                return ApiResponse(response.status, parsed, dict(response.headers.items()))
        except urllib.error.HTTPError as error:
            # Do not expose response text; it can contain echoed inputs or URLs.
            raise CiError(f"GitHub API request failed with HTTP {error.code}.") from None
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
            raise CiError("GitHub API response was unavailable or invalid.") from None

    def request_bytes(self, path: str, *, limit: int = 65536) -> bytes:
        if not path.startswith("/") or ".." in path or limit < 1 or limit > 262144:
            raise CiError("Invalid bounded log request.")
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "loomlight-ci-operation/1",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = urllib.request.Request("https://api.github.com" + path, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                value = response.read(limit + 1)
                return value[:limit]
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError):
            raise CiError("Bounded job log evidence was unavailable.") from None


def _run(
    args: list[str], cwd: Path, timeout: int = 120, *, input_bytes: bytes | None = None,
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args, cwd=cwd, input=input_bytes, capture_output=True,
            check=False, timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise CiError("A bounded local tool check was unavailable.") from None


def git_output(root: Path, *args: str) -> str:
    result = _run(["git", *args], root, 30)
    if result.returncode:
        raise CiError("Git identity check failed; inspect the repository locally.")
    try:
        return result.stdout.decode("utf-8").strip()
    except UnicodeError:
        raise CiError("Git identity output was not valid UTF-8.") from None


def validate_identity(root: Path, ref: str, sha: str) -> None:
    if not SAFE_REF.fullmatch(ref) or not FULL_SHA.fullmatch(sha):
        raise CiError("Ref or candidate SHA is invalid.")
    remote = git_output(root, "remote", "get-url", "origin")
    normal = remote.removesuffix(".git").replace("git@github.com:", "https://github.com/")
    if normal.casefold() != f"https://github.com/{REPOSITORY}".casefold():
        raise CiError("Origin does not match the approved repository.")
    resolved = git_output(root, "rev-parse", "--verify", f"refs/remotes/origin/{ref}^{{commit}}")
    if resolved != sha:
        raise CiError("The requested remote ref does not resolve to the exact candidate SHA.")
    workflow = root / WORKFLOW_PATH
    if not workflow.is_file():
        raise CiError("The approved production workflow is missing.")


class OperationStore:
    def __init__(self, root: Path, path: Path | None = None, *, secure: bool = True):
        self.root = root
        self.path = path or root / ".codex-local" / "ci" / "operations.sqlite3"
        if secure:
            companions = tuple(self.path.with_name(self.path.name + suffix) for suffix in ("", "-wal", "-shm", ".lock"))
            assert_ignored(root, companions)
            ensure_private_directory(root / ".codex-local")
            ensure_private_directory(self.path.parent)
            assert_ignored(root, companions)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA journal_mode=WAL")
        self.connection.execute("PRAGMA busy_timeout=10000")
        self.connection.execute("""
            CREATE TABLE IF NOT EXISTS operations (
              operation_id TEXT PRIMARY KEY,
              fingerprint TEXT NOT NULL UNIQUE,
              request_id TEXT NOT NULL UNIQUE,
              repository TEXT NOT NULL,
              workflow TEXT NOT NULL,
              workflow_revision TEXT NOT NULL,
              ref TEXT NOT NULL,
              candidate_sha TEXT NOT NULL,
              options_json TEXT NOT NULL,
              state TEXT NOT NULL,
              run_id INTEGER,
              attempt INTEGER,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL,
              next_action TEXT NOT NULL,
              result_json TEXT
            )
        """)

    @staticmethod
    def fingerprint(sha: str, workflow_revision: str, options: dict[str, Any]) -> str:
        encoded = json.dumps(
            {"sha": sha, "workflow_revision": workflow_revision, "options": options},
            sort_keys=True, separators=(",", ":"),
        ).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def reserve(self, *, ref: str, sha: str, workflow_revision: str, options: dict[str, Any]) -> tuple[dict[str, Any], bool]:
        fingerprint = self.fingerprint(sha, workflow_revision, options)
        now = int(time.time())
        operation_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            row = self.connection.execute(
                "SELECT * FROM operations WHERE fingerprint = ?", (fingerprint,),
            ).fetchone()
            if row:
                self.connection.execute("COMMIT")
                return dict(row), False
            self.connection.execute("""
                INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL)
            """, (
                operation_id, fingerprint, request_id, REPOSITORY, WORKFLOW,
                workflow_revision, ref, sha, json.dumps(options, sort_keys=True),
                "prepared", now, now, "dispatch exact candidate",
            ))
            self.connection.execute("COMMIT")
        except Exception:
            self.connection.execute("ROLLBACK")
            raise
        return self.get(operation_id), True

    def get(self, operation_id: str) -> dict[str, Any]:
        row = self.connection.execute(
            "SELECT * FROM operations WHERE operation_id = ?", (operation_id,),
        ).fetchone()
        if not row:
            raise CiError("The requested CI operation does not exist locally.")
        return dict(row)

    def find_run(self, run_id: int) -> dict[str, Any] | None:
        row = self.connection.execute(
            "SELECT * FROM operations WHERE run_id = ?", (run_id,),
        ).fetchone()
        return dict(row) if row else None

    def transition(self, operation_id: str, expected: set[str], state: str, **fields: Any) -> dict[str, Any]:
        if not expected or state not in {"prepared", "dispatching", "dispatch_unknown", "attached", "running", "completed", "blocked"}:
            raise CiError("Invalid operation state transition.")
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            row = self.get(operation_id)
            if row["state"] not in expected:
                raise CiError("Operation ownership changed; attach or inspect instead of dispatching again.")
            allowed = {"run_id", "attempt", "next_action", "result_json"}
            if set(fields) - allowed:
                raise CiError("Invalid operation update.")
            assignments = ["state = ?", "updated_at = ?"] + [f"{name} = ?" for name in fields]
            values = [state, int(time.time()), *fields.values(), operation_id]
            self.connection.execute(
                f"UPDATE operations SET {', '.join(assignments)} WHERE operation_id = ?", values,
            )
            self.connection.execute("COMMIT")
        except Exception:
            self.connection.execute("ROLLBACK")
            raise
        return self.get(operation_id)


def workflow_revision(root: Path) -> str:
    return git_output(root, "rev-parse", f"HEAD:{WORKFLOW_PATH}")


def _validate_run(run: dict[str, Any], *, run_id: int, sha: str, ref: str) -> int:
    if (
        run.get("id") != run_id or run.get("event") != "workflow_dispatch"
        or run.get("head_sha") != sha or run.get("head_branch") != ref
        or not isinstance(run.get("path"), str)
        or not (run["path"] == WORKFLOW_PATH or run["path"].startswith(WORKFLOW_PATH + "@"))
    ):
        raise CiError("Returned workflow run identity does not match the operation.")
    attempt = run.get("run_attempt", 1)
    if type(attempt) is not int or attempt < 1:
        raise CiError("Returned workflow attempt is invalid.")
    return attempt


def _get_run(transport: Transport, run_id: int, attempt: int | None = None) -> dict[str, Any]:
    suffix = f"/attempts/{attempt}" if attempt is not None else ""
    response = transport.request("GET", f"/repos/{REPOSITORY}/actions/runs/{run_id}{suffix}")
    if response.status != 200 or not isinstance(response.body, dict):
        raise CiError("Workflow run metadata was unavailable.")
    return response.body


def reconcile_request(
    transport: Transport, *, request_id: str, sha: str, ref: str,
) -> tuple[int, int] | None:
    if not REQUEST_ID.fullmatch(request_id):
        raise CiError("Stored request correlation identity is invalid.")
    matches: list[dict[str, Any]] = []
    for page in range(1, 4):
        response = transport.request(
            "GET",
            f"/repos/{REPOSITORY}/actions/workflows/{WORKFLOW}/runs?event=workflow_dispatch&branch={urllib.parse.quote(ref, safe='')}&per_page=100&page={page}",
        )
        if response.status != 200 or not isinstance(response.body, dict) or not isinstance(response.body.get("workflow_runs"), list):
            raise CiError("Dispatch reconciliation evidence was unavailable.")
        runs = [run for run in response.body["workflow_runs"] if isinstance(run, dict)]
        for run in runs:
            name = run.get("display_title")
            if (
                isinstance(name, str) and name.endswith(" / " + request_id)
                and run.get("event") == "workflow_dispatch"
                and run.get("head_sha") == sha and run.get("head_branch") == ref
            ):
                matches.append(run)
        if len(runs) < 100:
            break
    if not matches:
        return None
    if len(matches) != 1:
        raise CiError("Dispatch reconciliation found multiple matching runs; manual resolution is required.")
    run_id = matches[0].get("id")
    if type(run_id) is not int or run_id < 1:
        raise CiError("Reconciled run identity is invalid.")
    attempt = _validate_run(matches[0], run_id=run_id, sha=sha, ref=ref)
    return run_id, attempt


def submit(
    root: Path, store: OperationStore, transport: Transport, *, ref: str, sha: str,
    upload_packages: bool = False, force_full: bool = False,
) -> dict[str, Any]:
    validate_identity(root, ref, sha)
    revision = workflow_revision(root)
    options = {"upload_packages": bool(upload_packages), "force_full": bool(force_full)}
    operation, created = store.reserve(ref=ref, sha=sha, workflow_revision=revision, options=options)
    if not created:
        if operation["run_id"]:
            return public_operation(operation, attached=True)
        if operation["state"] in {"dispatching", "dispatch_unknown"}:
            raise CiError("Equivalent dispatch is unresolved; inspect or reconcile it without retransmitting.")
        if operation["state"] != "prepared":
            raise CiError("Equivalent operation is not dispatchable; inspect its recorded result.")
    operation = store.transition(operation["operation_id"], {"prepared"}, "dispatching", next_action="await direct dispatch receipt")
    payload = {
        "ref": ref,
        "inputs": {
            "expected_sha": sha,
            "request_id": operation["request_id"],
            "upload_packages": "true" if upload_packages else "false",
            "force_full": "true" if force_full else "false",
        },
    }
    try:
        response = transport.request(
            "POST", f"/repos/{REPOSITORY}/actions/workflows/{WORKFLOW}/dispatches", payload,
        )
    except CiError:
        try:
            reconciled = reconcile_request(
                transport, request_id=operation["request_id"], sha=sha, ref=ref,
            )
        except CiError:
            reconciled = None
        if reconciled:
            run_id, attempt = reconciled
            operation = store.transition(
                operation["operation_id"], {"dispatching"}, "attached",
                run_id=run_id, attempt=attempt, next_action=f"collect run {run_id} attempt {attempt}",
            )
            return public_operation(operation, attached=True)
        store.transition(operation["operation_id"], {"dispatching"}, "dispatch_unknown", next_action="reconcile request ID; do not POST again")
        raise CiError("Dispatch response was lost or unavailable; operation is dispatch_unknown and was not retried.") from None
    if response.status == 204:
        try:
            reconciled = reconcile_request(
                transport, request_id=operation["request_id"], sha=sha, ref=ref,
            )
        except CiError:
            reconciled = None
        if reconciled:
            run_id, attempt = reconciled
            operation = store.transition(
                operation["operation_id"], {"dispatching"}, "attached",
                run_id=run_id, attempt=attempt, next_action=f"collect run {run_id} attempt {attempt}",
            )
            return public_operation(operation, attached=True)
        store.transition(operation["operation_id"], {"dispatching"}, "dispatch_unknown", next_action="reconcile legacy no-content receipt; do not POST again")
        raise CiError("Dispatch returned no run identity; operation is dispatch_unknown and was not retried.")
    body = response.body or {}
    run_id = body.get("workflow_run_id")
    if response.status != 200 or type(run_id) is not int or run_id < 1:
        store.transition(operation["operation_id"], {"dispatching"}, "dispatch_unknown", next_action="reconcile invalid receipt; do not POST again")
        raise CiError("Dispatch receipt did not contain a valid run identity; retransmission is blocked.")
    try:
        run = _get_run(transport, run_id)
        attempt = _validate_run(run, run_id=run_id, sha=sha, ref=ref)
    except CiError:
        store.transition(
            operation["operation_id"], {"dispatching"}, "blocked",
            run_id=run_id, next_action="inspect contradictory direct receipt; do not dispatch again",
        )
        raise
    operation = store.transition(
        operation["operation_id"], {"dispatching"}, "attached",
        run_id=run_id, attempt=attempt, next_action=f"collect run {run_id} attempt {attempt}",
    )
    return public_operation(operation, attached=False)


def _jobs(transport: Transport, run_id: int, attempt: int) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for page in range(1, 11):
        response = transport.request(
            "GET", f"/repos/{REPOSITORY}/actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100&page={page}",
        )
        if response.status != 200 or not isinstance(response.body, dict) or not isinstance(response.body.get("jobs"), list):
            raise CiError("Attempt-specific job evidence was unavailable.")
        batch = response.body["jobs"]
        jobs.extend(job for job in batch if isinstance(job, dict))
        if len(batch) < 100:
            return jobs
    raise CiError("Attempt job pagination exceeded the safety limit.")


def sanitize_diagnostic(value: bytes, *, truncated: bool) -> str:
    text = value.decode("utf-8", errors="replace")
    text = re.sub(r"\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))", "", text)
    text = "".join(character if character in "\n\t" or ord(character) >= 32 else "?" for character in text)
    substitutions = (
        (r"[A-Za-z]:\\Users\\[^\\\s]+", "<redacted-user-path>"),
        (r"/(?:Users|home)/[^/\s]+", "/<redacted-user-path>"),
        (r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{16,}\b", "<redacted-token>"),
        (r"https://[^\s?]+\?[^\s]+", "<redacted-signed-url>"),
    )
    for pattern, replacement in substitutions:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    lines = [line[-500:] for line in text.splitlines()[-40:]]
    result = "\n".join(lines)
    if len(result) > 12000:
        result = result[-12000:]
        truncated = True
    if truncated:
        result += "\n[diagnostic truncated]"
    return result


def collect(
    transport: Transport, *, run_id: int, attempt: int, expected_sha: str | None = None,
    expected_ref: str | None = None,
) -> dict[str, Any]:
    if run_id < 1 or attempt < 1:
        raise CiError("Run and attempt must be positive integers.")
    run = _get_run(transport, run_id, attempt)
    sha = expected_sha or run.get("head_sha")
    ref = expected_ref or run.get("head_branch")
    if not isinstance(sha, str) or not FULL_SHA.fullmatch(sha) or not isinstance(ref, str):
        raise CiError("Run identity is incomplete.")
    returned_attempt = _validate_run(run, run_id=run_id, sha=sha, ref=ref)
    if returned_attempt != attempt:
        raise CiError("Requested attempt does not match provider metadata.")
    jobs = _jobs(transport, run_id, attempt)
    by_name = {job.get("name"): job for job in jobs if isinstance(job.get("name"), str)}
    required: list[dict[str, Any]] = []
    missing: list[str] = []
    failed_job_ids: list[int] = []
    for name in REQUIRED_JOBS:
        job = by_name.get(name)
        if not job:
            missing.append(name)
            continue
        steps = job.get("steps") if isinstance(job.get("steps"), list) else []
        step_failures = [
            str(step.get("name", "unnamed")) for step in steps
            if step.get("conclusion") in TERMINAL_FAILURES
        ]
        required.append({
            "name": name,
            "status": job.get("status", "unknown"),
            "conclusion": job.get("conclusion"),
            "head_sha": job.get("head_sha"),
            "failed_steps": step_failures[:20],
        })
        if (job.get("conclusion") in TERMINAL_FAILURES or step_failures) and type(job.get("id")) is int:
            failed_job_ids.append(job["id"])
    status = run.get("status", "unknown")
    conclusion = run.get("conclusion")
    complete = not missing and all(
        item["status"] == "completed" and item["conclusion"] == "success"
        and item["head_sha"] == sha and not item["failed_steps"]
        for item in required
    )
    accepted = status == "completed" and conclusion == "success" and complete
    diagnostics: list[str] = []
    evidence_available = True
    reader = getattr(transport, "request_bytes", None)
    for job_id in failed_job_ids[:3]:
        if not callable(reader):
            evidence_available = False
            break
        try:
            raw = reader(f"/repos/{REPOSITORY}/actions/jobs/{job_id}/logs", limit=65536)
            diagnostics.append(sanitize_diagnostic(raw, truncated=len(raw) >= 65536))
        except CiError:
            evidence_available = False
    return {
        "schema_version": SCHEMA_VERSION,
        "repository": REPOSITORY,
        "workflow": WORKFLOW,
        "run_id": run_id,
        "attempt": attempt,
        "candidate_sha": sha,
        "provider_status": status,
        "provider_conclusion": conclusion,
        "required_gate_complete": complete,
        "accepted": accepted,
        "missing_jobs": missing,
        "required_jobs": required,
        "monitoring_error": None,
        "evidence": "attempt-specific metadata and paginated jobs",
        "failure_diagnostics": diagnostics,
        "failure_log_evidence_available": evidence_available if failed_job_ids else None,
        "next_action": "publish exact evidence" if accepted else "inspect recorded missing or failed gates; do not rerun automatically",
    }


def public_operation(operation: dict[str, Any], *, attached: bool) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "operation_id": operation["operation_id"],
        "repository": operation["repository"],
        "workflow": operation["workflow"],
        "ref": operation["ref"],
        "candidate_sha": operation["candidate_sha"],
        "state": operation["state"],
        "run_id": operation["run_id"],
        "attempt": operation["attempt"],
        "attached_existing": attached,
        "next_action": operation["next_action"],
    }


def doctor(root: Path) -> dict[str, Any]:
    tools = {name: bool(shutil.which(name)) for name in ("git", "node", "npm", "cargo", "rustc")}
    credential_helper = _run(["git", "config", "--get", "credential.helper"], root, 15)
    if os.environ.get("GITHUB_TOKEN"):
        dispatch = "environment_configured_unverified"
    elif credential_helper.returncode == 0 and credential_helper.stdout.strip():
        dispatch = "git_credential_provider_configured_unverified"
    else:
        dispatch = "unavailable_missing_local_credentials"
    return {
        "schema_version": SCHEMA_VERSION,
        "repository": REPOSITORY,
        "tools": tools,
        "github_collect": "available_public_read",
        "github_dispatch": dispatch,
        "codex_binding": "unverified",
        "automatic_wake": False,
    }


def preflight(root: Path) -> dict[str, Any]:
    commands = [
        ([os.sys.executable, "scripts/validate.py"], root, 120, "repository_privacy"),
        ([os.sys.executable, "-m", "unittest", "discover", "-s", "tests/ci_privacy", "-v"], root, 180, "privacy_tests"),
        ([os.sys.executable, "-m", "unittest", "discover", "-s", "tests/ci_tooling", "-v"], root, 180, "ci_tooling_tests"),
        (["npm", "run", "check"], root / "app", 300, "frontend_check"),
        (["cargo", "fmt", "--check", "--all"], root / "app", 180, "rust_format"),
    ]
    results = []
    for args, cwd, timeout, name in commands:
        if shutil.which(args[0]) is None and Path(args[0]) != Path(os.sys.executable):
            results.append({"name": name, "status": "unavailable"})
            continue
        result = _run(args, cwd, timeout)
        results.append({"name": name, "status": "passed" if result.returncode == 0 else "failed"})
        if result.returncode:
            break
    return {
        "schema_version": SCHEMA_VERSION,
        "candidate_sha": git_output(root, "rev-parse", "HEAD"),
        "index_identity": hashlib.sha256(_run(["git", "ls-files", "--stage", "-z"], root, 30).stdout).hexdigest(),
        "checks": results,
        "passed": bool(results) and all(item["status"] == "passed" for item in results),
        "native_acceptance": "delegated_to_candidate_bound_production_workflow",
    }
