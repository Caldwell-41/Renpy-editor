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

from local_state import (
    LocalStateError,
    application_state_root,
    assert_private_file,
    create_private_file,
    ensure_private_subdirectory,
    require_external_state_root,
    require_legacy_acknowledgement,
)

SCHEMA_VERSION = 2
STORE_VERSION = 2
API_VERSION = "2026-03-10"
REPOSITORY = "Caldwell-41/Renpy-editor"
WORKFLOW = "production-scaffold.yml"
WORKFLOW_PATH = ".github/workflows/production-scaffold.yml"
FULL_SHA = re.compile(r"[0-9a-f]{40}\Z")
OBJECT_ID = re.compile(r"[0-9a-f]{40,64}\Z")
SAFE_REF = re.compile(r"(?!.*(?:\.\.|@\{|\\|\s))[A-Za-z0-9][A-Za-z0-9._/-]{0,199}\Z")
REQUEST_ID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z")
OPERATION_KEY = re.compile(r"[0-9a-f]{64}\Z")
REQUIRED_JOBS = ("Validate candidate", "Windows x64", "macOS ARM64")
VALID_STATUSES = {"queued", "in_progress", "completed", "waiting", "requested", "pending"}
VALID_CONCLUSIONS = {
    "success",
    "failure",
    "cancelled",
    "timed_out",
    "neutral",
    "skipped",
    "stale",
    "action_required",
    "startup_failure",
    None,
}
VALID_STATES = {"prepared", "dispatching", "dispatch_unknown", "attached", "running", "completed", "blocked"}
RECOVERABLE_STATES = {"prepared", "dispatching", "dispatch_unknown", "blocked"}
VALIDATED_ATTACHMENT_STATES = {"attached", "running", "completed"}
MAX_RECONCILIATION_PAGES = 10
MAX_JOB_PAGES = 10
RUN_TITLE = re.compile(
    r"Phase 1 production gates / (?P<key>[0-9a-f]{64}) / "
    r"packages=(?P<packages>true|false) / full=(?P<full>true|false) / "
    r"request=(?P<request>[0-9a-f-]{36})\Z"
)
VALIDATE_STEPS = (
    "Validate immutable candidate identity",
    "Check out validated candidate",
    "Validate operation identity",
    "Validate repository and CI helpers",
)
NATIVE_STEPS = (
    "Check out repository",
    "Select locked Node toolchain",
    "Select locked npm toolchain",
    "Record runner and toolchain",
    "Restore Rust dependency cache",
    "Install locked JavaScript dependencies",
    "Validate frontend and protocol",
    "Build frontend",
    "Check Rust formatting",
    "Test independent Rust core",
    "Restore pinned Ren'Py SDK archive",
    "Download pinned official Ren'Py SDK on cache miss",
    "Exercise Phase 1C lifecycle through Phase 1E Scene target gate",
    "Exercise SDK download handoff and verified managed reuse",
    "Test desktop Rust boundary",
    "Package production scaffold",
    "Run packaged WebView boundary smoke",
    "Scan production artifacts for secrets",
    "Record dependency and licence inventory",
    "Upload lightweight production evidence",
    "Upload packaged application for manual runs",
)
REQUIRED_STEPS = {
    "Validate candidate": VALIDATE_STEPS,
    "Windows x64": NATIVE_STEPS,
    "macOS ARM64": NATIVE_STEPS,
}


class CiError(Exception):
    """Safe diagnostic without credentials, private paths, or provider bodies."""


@dataclass(frozen=True)
class ApiResponse:
    status: int
    body: dict[str, Any] | None
    headers: dict[str, str]


@dataclass(frozen=True)
class OperationIdentity:
    repository: str
    workflow: str
    ref: str
    candidate_sha: str
    workflow_revision: str
    upload_packages: bool
    force_full: bool
    operation_key: str

    @property
    def options(self) -> dict[str, bool]:
        return {
            "force_full": self.force_full,
            "upload_packages": self.upload_packages,
        }


@dataclass(frozen=True)
class Reconciliation:
    status: str
    reason_code: str
    run_id: int | None = None
    attempt: int | None = None


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
            if len(token) > 4096:
                raise CiError("Approved GitHub credentials were invalid.")
            return cls(token)
        result = _run(
            ["git", "credential", "fill"],
            root,
            20,
            input_bytes=b"protocol=https\nhost=github.com\n\n",
        )
        if result.returncode or len(result.stdout) > 16384:
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
        if method not in {"GET", "POST"} or not path.startswith("/") or ".." in path:
            raise CiError("Invalid GitHub API request.")
        data = None if body is None else json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "loomlight-ci-operation/2",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = urllib.request.Request(
            "https://api.github.com" + path,
            data=data,
            headers=headers,
            method=method,
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
            raise CiError(f"GitHub API request failed with HTTP {error.code}.") from None
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
            raise CiError("GitHub API response was unavailable or invalid.") from None

    def request_bytes(self, path: str, *, limit: int = 65536) -> bytes:
        if not path.startswith("/") or ".." in path or limit < 1 or limit > 262144:
            raise CiError("Invalid bounded log request.")
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "loomlight-ci-operation/2",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = urllib.request.Request("https://api.github.com" + path, headers=headers, method="GET")

        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, request, file_pointer, code, message, response_headers, new_url):
                return None

        try:
            try:
                urllib.request.build_opener(NoRedirect).open(request, timeout=self.timeout)
                raise CiError("Job log endpoint returned no download redirect.")
            except urllib.error.HTTPError as response:
                if response.code != 302:
                    raise
                location = response.headers.get("Location", "")
            parsed = urllib.parse.urlsplit(location)
            if parsed.scheme != "https" or not (
                parsed.hostname
                and (
                    parsed.hostname.endswith(".blob.core.windows.net")
                    or parsed.hostname.endswith(".githubusercontent.com")
                )
            ):
                raise CiError("Job log redirect host was not approved.")
            download = urllib.request.Request(location, headers={"User-Agent": "loomlight-ci-operation/2"})
            with urllib.request.urlopen(download, timeout=self.timeout) as response:
                value = response.read(limit + 1)
                return value[:limit]
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError):
            raise CiError("Bounded job log evidence was unavailable.") from None


def _run(
    args: list[str],
    cwd: Path,
    timeout: int = 120,
    *,
    input_bytes: bytes | None = None,
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args,
            cwd=cwd,
            input=input_bytes,
            capture_output=True,
            check=False,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise CiError("A bounded local tool check was unavailable.") from None


def git_output(root: Path, *args: str) -> str:
    result = _run(["git", *args], root, 30)
    if result.returncode or len(result.stdout) > 65536:
        raise CiError("Git identity check failed; inspect the repository locally.")
    try:
        return result.stdout.decode("utf-8").strip()
    except UnicodeError:
        raise CiError("Git identity output was not valid UTF-8.") from None


def validate_identity(root: Path, ref: str, sha: str) -> str:
    if not SAFE_REF.fullmatch(ref) or not FULL_SHA.fullmatch(sha):
        raise CiError("Ref or candidate SHA is invalid.")
    remote = git_output(root, "remote", "get-url", "origin")
    normal = remote.removesuffix(".git").replace("git@github.com:", "https://github.com/")
    if normal.casefold() != f"https://github.com/{REPOSITORY}".casefold():
        raise CiError("Origin does not match the approved repository.")
    resolved = git_output(root, "rev-parse", "--verify", f"refs/remotes/origin/{ref}^{{commit}}")
    if resolved != sha:
        raise CiError("The requested remote ref does not resolve to the exact candidate SHA.")
    revision = git_output(root, "rev-parse", f"{sha}:{WORKFLOW_PATH}")
    if not OBJECT_ID.fullmatch(revision):
        raise CiError("The candidate production workflow identity is invalid.")
    return revision


def _operation_key_payload(
    *,
    ref: str,
    sha: str,
    workflow_revision: str,
    upload_packages: bool,
    force_full: bool,
) -> dict[str, Any]:
    return {
        "candidate_sha": sha,
        "options": {
            "force_full": bool(force_full),
            "upload_packages": bool(upload_packages),
        },
        "ref": ref,
        "repository": REPOSITORY,
        "workflow": WORKFLOW,
        "workflow_revision": workflow_revision,
    }


def operation_identity(
    root: Path,
    *,
    ref: str,
    sha: str,
    upload_packages: bool = False,
    force_full: bool = False,
) -> OperationIdentity:
    revision = validate_identity(root, ref, sha)
    payload = _operation_key_payload(
        ref=ref,
        sha=sha,
        workflow_revision=revision,
        upload_packages=upload_packages,
        force_full=force_full,
    )
    operation_key = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return OperationIdentity(
        repository=REPOSITORY,
        workflow=WORKFLOW,
        ref=ref,
        candidate_sha=sha,
        workflow_revision=revision,
        upload_packages=bool(upload_packages),
        force_full=bool(force_full),
        operation_key=operation_key,
    )


class OperationStore:
    def __init__(
        self,
        root: Path,
        path: Path | None = None,
        *,
        secure: bool = True,
        state_root: Path | None = None,
        acknowledge_legacy: bool = False,
    ):
        self.root = root
        self.secure = secure
        if secure:
            if path is not None:
                raise LocalStateError("Secure operation storage does not accept an arbitrary database path.")
            require_legacy_acknowledgement(root, acknowledged=acknowledge_legacy)
            selected_root = state_root or application_state_root()
            require_external_state_root(root, selected_root)
            directory = ensure_private_subdirectory(selected_root, "ci")
            self.path = directory / "operations.sqlite3"
            create_private_file(self.path)
            assert_private_file(self.path)
        else:
            if path is None:
                raise CiError("A test operation database path is required.")
            self.path = path
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self._verify_files()
        old_umask = os.umask(0o077)
        try:
            self.connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
            self.connection.row_factory = sqlite3.Row
            self.connection.execute("PRAGMA busy_timeout=10000")
            self.connection.execute("PRAGMA foreign_keys=ON")
            self.connection.execute("PRAGMA journal_mode=WAL")
            self._initialise_schema()
        except (CiError, LocalStateError):
            if hasattr(self, "connection"):
                self.connection.close()
            raise
        except (sqlite3.Error, OSError):
            if hasattr(self, "connection"):
                self.connection.close()
            raise CiError("The durable CI operation journal could not be opened safely.") from None
        finally:
            os.umask(old_umask)
        try:
            self._verify_files()
        except Exception:
            self.connection.close()
            raise

    def _initialise_schema(self) -> None:
        version = self.connection.execute("PRAGMA user_version").fetchone()[0]
        if version not in {0, STORE_VERSION}:
            raise CiError("The local CI operation journal version is unsupported.")
        existing_tables = {
            row[0]
            for row in self.connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        if version == 0 and existing_tables:
            raise CiError("An unversioned local CI operation journal is not trusted.")
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS operations (
              operation_id TEXT PRIMARY KEY,
              operation_key TEXT NOT NULL UNIQUE,
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
              deadline_at INTEGER NOT NULL,
              local_checks_json TEXT NOT NULL,
              job_refs_json TEXT NOT NULL,
              next_action TEXT NOT NULL,
              result_json TEXT
            )
            """
        )
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS diagnostics (
              operation_id TEXT NOT NULL,
              job_name TEXT NOT NULL,
              job_id INTEGER NOT NULL,
              captured_at INTEGER NOT NULL,
              truncated INTEGER NOT NULL,
              content BLOB NOT NULL,
              PRIMARY KEY (operation_id, job_id),
              FOREIGN KEY (operation_id) REFERENCES operations(operation_id)
            )
            """
        )
        self.connection.execute(f"PRAGMA user_version={STORE_VERSION}")

    def _verify_files(self) -> None:
        if not self.secure:
            return
        for candidate in (
            self.path,
            self.path.with_name(self.path.name + "-wal"),
            self.path.with_name(self.path.name + "-shm"),
            self.path.with_name(self.path.name + "-journal"),
        ):
            try:
                candidate.lstat()
            except FileNotFoundError:
                continue
            except OSError:
                raise LocalStateError("Private journal metadata could not be inspected safely.") from None
            assert_private_file(candidate)

    @staticmethod
    def _identity_from_row(row: dict[str, Any]) -> OperationIdentity:
        try:
            options = json.loads(row["options_json"])
        except (KeyError, TypeError, json.JSONDecodeError):
            raise CiError("Stored operation identity is malformed.") from None
        expected_options = {"force_full", "upload_packages"}
        if not isinstance(options, dict) or set(options) != expected_options:
            raise CiError("Stored operation options are malformed.")
        if any(type(options[name]) is not bool for name in expected_options):
            raise CiError("Stored operation options are malformed.")
        payload = _operation_key_payload(
            ref=row["ref"],
            sha=row["candidate_sha"],
            workflow_revision=row["workflow_revision"],
            upload_packages=options["upload_packages"],
            force_full=options["force_full"],
        )
        key = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        if (
            row.get("repository") != REPOSITORY
            or row.get("workflow") != WORKFLOW
            or row.get("operation_key") != key
            or not REQUEST_ID.fullmatch(str(row.get("request_id", "")))
            or row.get("state") not in VALID_STATES
            or type(row.get("deadline_at")) is not int
        ):
            raise CiError("Stored operation identity is contradictory.")
        run_id = row.get("run_id")
        attempt = row.get("attempt")
        if (
            (run_id is not None and (type(run_id) is not int or run_id < 1))
            or (attempt is not None and (type(attempt) is not int or attempt < 1))
            or (attempt is not None and run_id is None)
            or (
                row.get("state") in VALIDATED_ATTACHMENT_STATES
                and (run_id is None or attempt is None)
            )
            or (
                row.get("state") in {"prepared", "dispatching"}
                and (run_id is not None or attempt is not None)
            )
        ):
            raise CiError("Stored operation receipt state is contradictory.")
        try:
            local_checks = json.loads(row["local_checks_json"])
            job_refs = json.loads(row["job_refs_json"])
        except (KeyError, TypeError, json.JSONDecodeError):
            raise CiError("Stored operation checkpoint data is malformed.") from None
        if not isinstance(local_checks, list) or not isinstance(job_refs, list):
            raise CiError("Stored operation checkpoint data is malformed.")
        return OperationIdentity(
            repository=REPOSITORY,
            workflow=WORKFLOW,
            ref=row["ref"],
            candidate_sha=row["candidate_sha"],
            workflow_revision=row["workflow_revision"],
            upload_packages=options["upload_packages"],
            force_full=options["force_full"],
            operation_key=key,
        )

    def reserve(self, identity: OperationIdentity) -> tuple[dict[str, Any], bool]:
        now = int(time.time())
        operation_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            row = self.connection.execute(
                "SELECT * FROM operations WHERE operation_key = ?",
                (identity.operation_key,),
            ).fetchone()
            if row:
                self.connection.execute("COMMIT")
                result = dict(row)
                if self._identity_from_row(result) != identity:
                    raise CiError("Stored operation identity contradicts the requested candidate.")
                return result, False
            collisions = self.connection.execute(
                """
                SELECT * FROM operations
                WHERE repository = ? AND workflow = ? AND workflow_revision = ?
                  AND ref = ? AND candidate_sha = ? AND operation_key <> ?
                """,
                (
                    identity.repository,
                    identity.workflow,
                    identity.workflow_revision,
                    identity.ref,
                    identity.candidate_sha,
                    identity.operation_key,
                ),
            ).fetchall()
            for collision in collisions:
                self._identity_from_row(dict(collision))
            if any(not self._safely_terminal(collision) or identity.force_full for collision in collisions):
                raise CiError("A colliding candidate operation already exists; no new dispatch is permitted.")
            self.connection.execute(
                """
                INSERT INTO operations (
                  operation_id, operation_key, request_id, repository, workflow,
                  workflow_revision, ref, candidate_sha, options_json, state,
                  run_id, attempt, created_at, updated_at, deadline_at,
                  local_checks_json, job_refs_json, next_action, result_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, NULL)
                """,
                (
                    operation_id,
                    identity.operation_key,
                    request_id,
                    identity.repository,
                    identity.workflow,
                    identity.workflow_revision,
                    identity.ref,
                    identity.candidate_sha,
                    json.dumps(identity.options, sort_keys=True, separators=(",", ":")),
                    "prepared",
                    now,
                    now,
                    now + 900,
                    json.dumps([{"name": "candidate_identity", "status": "passed"}], separators=(",", ":")),
                    "[]",
                    "reconcile exact operation before dispatch",
                ),
            )
            self.connection.execute("COMMIT")
        except Exception:
            if self.connection.in_transaction:
                self.connection.execute("ROLLBACK")
            raise
        self._verify_files()
        return self.get(operation_id), True

    def get(self, operation_id: str) -> dict[str, Any]:
        try:
            uuid.UUID(operation_id)
        except (ValueError, TypeError):
            raise CiError("The requested CI operation selector is invalid.") from None
        row = self.connection.execute(
            "SELECT * FROM operations WHERE operation_id = ?",
            (operation_id,),
        ).fetchone()
        if not row:
            raise CiError("The requested CI operation does not exist locally.")
        result = dict(row)
        self._identity_from_row(result)
        return result

    @staticmethod
    def _safely_terminal(operation: dict[str, Any] | sqlite3.Row) -> bool:
        if (
            operation["state"] != "completed"
            or type(operation["run_id"]) is not int
            or type(operation["attempt"]) is not int
            or not isinstance(operation["result_json"], str)
        ):
            return False
        try:
            result = json.loads(operation["result_json"])
        except (TypeError, json.JSONDecodeError):
            return False
        return (
            isinstance(result, dict)
            and result.get("provider_status") == "completed"
            and result.get("accepted") is True
            and result.get("run_id") == operation["run_id"]
            and result.get("attempt") == operation["attempt"]
        )

    def list_recoverable(self) -> list[dict[str, Any]]:
        """Return local-only selectors for operations that may need read-only recovery."""
        placeholders = ",".join("?" for _ in RECOVERABLE_STATES)
        rows = self.connection.execute(
            f"SELECT * FROM operations WHERE state IN ({placeholders}) ORDER BY created_at, operation_id",
            tuple(sorted(RECOVERABLE_STATES)),
        ).fetchall()
        result: list[dict[str, Any]] = []
        for row in rows:
            operation = dict(row)
            self._identity_from_row(operation)
            result.append(
                {
                    "operation_id": operation["operation_id"],
                    "ref": operation["ref"],
                    "candidate_sha": operation["candidate_sha"],
                    "state": operation["state"],
                    "run_id": operation["run_id"],
                    "attempt": operation["attempt"],
                    "next_action": operation["next_action"],
                }
            )
        return result

    def identity(self, operation: dict[str, Any]) -> OperationIdentity:
        return self._identity_from_row(operation)

    def find_run(self, run_id: int) -> dict[str, Any] | None:
        row = self.connection.execute(
            "SELECT * FROM operations WHERE run_id = ?",
            (run_id,),
        ).fetchone()
        if not row:
            return None
        result = dict(row)
        self._identity_from_row(result)
        return result

    def transition(self, operation_id: str, expected: set[str], state: str, **fields: Any) -> dict[str, Any]:
        if not expected or state not in VALID_STATES:
            raise CiError("Invalid operation state transition.")
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            row = self.get(operation_id)
            if row["state"] not in expected:
                raise CiError("Operation ownership changed; attach or inspect instead of dispatching again.")
            allowed = {
                "run_id",
                "attempt",
                "deadline_at",
                "local_checks_json",
                "job_refs_json",
                "next_action",
                "result_json",
            }
            if set(fields) - allowed:
                raise CiError("Invalid operation update.")
            assignments = ["state = ?", "updated_at = ?"] + [f"{name} = ?" for name in fields]
            values = [state, int(time.time()), *fields.values(), operation_id]
            self.connection.execute(
                f"UPDATE operations SET {', '.join(assignments)} WHERE operation_id = ?",
                values,
            )
            updated = self.connection.execute(
                "SELECT * FROM operations WHERE operation_id = ?",
                (operation_id,),
            ).fetchone()
            if updated is None:
                raise CiError("Operation state transition was not durable.")
            self._identity_from_row(dict(updated))
            self.connection.execute("COMMIT")
        except Exception:
            if self.connection.in_transaction:
                self.connection.execute("ROLLBACK")
            raise
        self._verify_files()
        return self.get(operation_id)

    def store_job_references(self, operation_id: str, references: list[dict[str, Any]]) -> None:
        normalised: list[dict[str, Any]] = []
        for reference in references:
            if (
                not isinstance(reference, dict)
                or reference.get("name") not in REQUIRED_JOBS
                or type(reference.get("job_id")) is not int
                or reference["job_id"] < 1
            ):
                raise CiError("Job reference checkpoint is invalid.")
            normalised.append({"job_id": reference["job_id"], "name": reference["name"]})
        self.get(operation_id)
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            self.connection.execute(
                "UPDATE operations SET job_refs_json = ?, updated_at = ? WHERE operation_id = ?",
                (
                    json.dumps(normalised, sort_keys=True, separators=(",", ":")),
                    int(time.time()),
                    operation_id,
                ),
            )
            self.connection.execute("COMMIT")
        except Exception:
            if self.connection.in_transaction:
                self.connection.execute("ROLLBACK")
            raise
        self._verify_files()

    def store_diagnostic(
        self,
        operation_id: str,
        *,
        job_name: str,
        job_id: int,
        content: bytes,
        truncated: bool,
    ) -> None:
        if job_name not in REQUIRED_JOBS or type(job_id) is not int or job_id < 1:
            raise CiError("Diagnostic evidence identity is invalid.")
        if not isinstance(content, bytes) or len(content) > 65536:
            raise CiError("Diagnostic evidence exceeded the private storage limit.")
        self.get(operation_id)
        self.connection.execute("BEGIN IMMEDIATE")
        try:
            self.connection.execute(
                """
                INSERT OR REPLACE INTO diagnostics
                (operation_id, job_name, job_id, captured_at, truncated, content)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (operation_id, job_name, job_id, int(time.time()), int(truncated), content),
            )
            self.connection.execute("COMMIT")
        except Exception:
            if self.connection.in_transaction:
                self.connection.execute("ROLLBACK")
            raise
        self._verify_files()


def _parse_run_title(value: object) -> tuple[str, dict[str, bool], str] | None:
    if not isinstance(value, str):
        return None
    match = RUN_TITLE.fullmatch(value)
    if not match or not REQUEST_ID.fullmatch(match.group("request")):
        return None
    return (
        match.group("key"),
        {
            "upload_packages": match.group("packages") == "true",
            "force_full": match.group("full") == "true",
        },
        match.group("request"),
    )


def _validate_run(
    run: dict[str, Any],
    *,
    run_id: int,
    identity: OperationIdentity,
) -> int:
    parsed_title = _parse_run_title(run.get("display_title"))
    if (
        run.get("id") != run_id
        or run.get("event") != "workflow_dispatch"
        or run.get("head_sha") != identity.candidate_sha
        or run.get("head_branch") != identity.ref
        or not isinstance(run.get("path"), str)
        or not (
            run["path"] == WORKFLOW_PATH
            or run["path"].startswith(WORKFLOW_PATH + "@")
        )
        or parsed_title is None
        or parsed_title[0] != identity.operation_key
        or parsed_title[1] != identity.options
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


def reconcile_identity(transport: Transport, identity: OperationIdentity) -> Reconciliation:
    matches: list[dict[str, Any]] = []
    seen_ids: set[int] = set()
    fetched = 0
    total_count: int | None = None
    complete = False
    contradictory = False
    for page in range(1, MAX_RECONCILIATION_PAGES + 1):
        response = transport.request(
            "GET",
            f"/repos/{REPOSITORY}/actions/workflows/{WORKFLOW}/runs?"
            f"event=workflow_dispatch&branch={urllib.parse.quote(identity.ref, safe='')}"
            f"&per_page=100&page={page}",
        )
        body = response.body
        if (
            response.status != 200
            or not isinstance(body, dict)
            or type(body.get("total_count")) is not int
            or body["total_count"] < 0
            or not isinstance(body.get("workflow_runs"), list)
            or any(not isinstance(run, dict) for run in body["workflow_runs"])
        ):
            return Reconciliation("inconclusive", "reconciliation_response_invalid")
        if total_count is None:
            total_count = body["total_count"]
        elif body["total_count"] != total_count:
            return Reconciliation("inconclusive", "reconciliation_listing_changed")
        batch = body["workflow_runs"]
        fetched += len(batch)
        for run in batch:
            run_id = run.get("id")
            if type(run_id) is not int or run_id < 1 or run_id in seen_ids:
                return Reconciliation("inconclusive", "reconciliation_run_identity_invalid")
            seen_ids.add(run_id)
            parsed = _parse_run_title(run.get("display_title"))
            if parsed is None or parsed[0] != identity.operation_key:
                continue
            if parsed[1] != identity.options:
                contradictory = True
                continue
            try:
                _validate_run(run, run_id=run_id, identity=identity)
            except CiError:
                contradictory = True
                continue
            matches.append(run)
        if fetched >= total_count or len(batch) < 100:
            complete = fetched >= total_count
            break
    if not complete:
        return Reconciliation("inconclusive", "reconciliation_pagination_incomplete")
    if contradictory:
        return Reconciliation("contradictory", "reconciliation_identity_contradiction")
    if len(matches) > 1:
        return Reconciliation("ambiguous", "reconciliation_multiple_matches")
    if not matches:
        return Reconciliation("no_match", "reconciliation_no_match")
    run_id = matches[0]["id"]
    attempt = _validate_run(matches[0], run_id=run_id, identity=identity)
    return Reconciliation("match", "reconciliation_exact_match", run_id, attempt)


def _attach_reconciliation(
    store: OperationStore,
    operation: dict[str, Any],
    reconciliation: Reconciliation,
) -> dict[str, Any] | None:
    if reconciliation.status == "match":
        assert reconciliation.run_id is not None and reconciliation.attempt is not None
        return store.transition(
            operation["operation_id"],
            {operation["state"]},
            "attached",
            run_id=reconciliation.run_id,
            attempt=reconciliation.attempt,
            deadline_at=int(time.time()) + 7200,
            next_action="collect the exact attached run attempt",
        )
    if reconciliation.status in {"ambiguous", "contradictory"}:
        store.transition(
            operation["operation_id"],
            {operation["state"]},
            "blocked",
            next_action="resolve contradictory remote identity without dispatching",
        )
    elif operation["state"] in {"dispatching", "dispatch_unknown"}:
        store.transition(
            operation["operation_id"],
            {operation["state"]},
            "dispatch_unknown",
            next_action="retry read-only reconciliation; do not dispatch",
        )
    return None


def _has_validated_attachment(operation: dict[str, Any]) -> bool:
    return (
        operation.get("state") in VALIDATED_ATTACHMENT_STATES
        and type(operation.get("run_id")) is int
        and operation["run_id"] > 0
        and type(operation.get("attempt")) is int
        and operation["attempt"] > 0
    )


def reconcile_operation(
    store: OperationStore,
    transport: Transport,
    *,
    operation_id: str,
) -> dict[str, Any]:
    operation = store.get(operation_id)
    if _has_validated_attachment(operation):
        return {
            **public_operation(operation, attached=True),
            "reconciled": True,
            "reason_code": "operation_already_attached",
        }
    if operation["state"] not in RECOVERABLE_STATES:
        raise CiError("The selected operation is not eligible for read-only reconciliation.")
    identity = store.identity(operation)
    if operation["run_id"] is not None:
        try:
            direct_run = _get_run(transport, operation["run_id"])
        except CiError:
            direct_run = None
        if direct_run is not None:
            try:
                attempt = _validate_run(direct_run, run_id=operation["run_id"], identity=identity)
            except CiError:
                current = store.transition(
                    operation["operation_id"],
                    {operation["state"]},
                    "blocked",
                    next_action="resolve contradictory direct receipt without dispatching",
                )
                return {
                    **public_operation(current, attached=False),
                    "reconciled": False,
                    "reason_code": "direct_receipt_identity_contradiction",
                }
            current = store.transition(
                operation["operation_id"],
                {operation["state"]},
                "attached",
                attempt=attempt,
                deadline_at=int(time.time()) + 7200,
                next_action="collect the exact attached run attempt",
            )
            return {
                **public_operation(current, attached=True),
                "reconciled": True,
                "reason_code": "direct_receipt_validated",
            }
    reconciliation = reconcile_identity(transport, identity)
    attached = _attach_reconciliation(store, operation, reconciliation)
    current = attached or store.get(operation_id)
    return {
        **public_operation(current, attached=attached is not None),
        "reconciled": attached is not None,
        "reason_code": reconciliation.reason_code,
    }


def submit(
    root: Path,
    store: OperationStore,
    transport: Transport,
    *,
    ref: str,
    sha: str,
    upload_packages: bool = False,
    force_full: bool = False,
) -> dict[str, Any]:
    identity = operation_identity(
        root,
        ref=ref,
        sha=sha,
        upload_packages=upload_packages,
        force_full=force_full,
    )
    operation, created = store.reserve(identity)
    if _has_validated_attachment(operation):
        return public_operation(operation, attached=True)
    if not created and operation["state"] in {"dispatching", "dispatch_unknown", "blocked"}:
        result = reconcile_operation(store, transport, operation_id=operation["operation_id"])
        if result["reconciled"]:
            return result
        raise CiError("Equivalent dispatch remains unresolved; no new dispatch was sent.")
    if operation["state"] != "prepared":
        raise CiError("Equivalent operation is not dispatchable; inspect its recorded result.")

    reconciliation = reconcile_identity(transport, identity)
    attached = _attach_reconciliation(store, operation, reconciliation)
    if attached:
        return public_operation(attached, attached=True)
    if reconciliation.status != "no_match":
        raise CiError("Remote equivalence could not be established completely; dispatch was not sent.")

    operation = store.transition(
        operation["operation_id"],
        {"prepared"},
        "dispatching",
        next_action="await direct dispatch receipt",
    )
    payload = {
        "ref": identity.ref,
        "return_run_details": True,
        "inputs": {
            "expected_ref": identity.ref,
            "expected_sha": identity.candidate_sha,
            "operation_key": identity.operation_key,
            "request_id": operation["request_id"],
            "upload_packages": "true" if identity.upload_packages else "false",
            "force_full": "true" if identity.force_full else "false",
        },
    }
    try:
        response = transport.request(
            "POST",
            f"/repos/{REPOSITORY}/actions/workflows/{WORKFLOW}/dispatches",
            payload,
        )
    except CiError:
        try:
            reconciliation = reconcile_identity(transport, identity)
        except CiError:
            store.transition(
                operation["operation_id"],
                {"dispatching"},
                "dispatch_unknown",
                next_action="retry read-only reconciliation; do not dispatch",
            )
            raise CiError("Dispatch response and reconciliation were unavailable; retransmission is blocked.") from None
        attached = _attach_reconciliation(store, operation, reconciliation)
        if attached:
            return public_operation(attached, attached=True)
        if store.get(operation["operation_id"])["state"] == "dispatching":
            store.transition(
                operation["operation_id"],
                {"dispatching"},
                "dispatch_unknown",
                next_action="retry read-only reconciliation; do not dispatch",
            )
        raise CiError("Dispatch response was unavailable; retransmission is blocked.") from None

    if response.status == 204:
        try:
            reconciliation = reconcile_identity(transport, identity)
        except CiError:
            store.transition(
                operation["operation_id"],
                {"dispatching"},
                "dispatch_unknown",
                next_action="retry read-only reconciliation; do not dispatch",
            )
            raise CiError("Dispatch reconciliation was unavailable; retransmission is blocked.") from None
        attached = _attach_reconciliation(store, operation, reconciliation)
        if attached:
            return public_operation(attached, attached=True)
        if store.get(operation["operation_id"])["state"] == "dispatching":
            store.transition(
                operation["operation_id"],
                {"dispatching"},
                "dispatch_unknown",
                next_action="retry read-only reconciliation; do not dispatch",
            )
        raise CiError("Dispatch returned no direct run identity; retransmission is blocked.")

    body = response.body or {}
    run_id = body.get("workflow_run_id")
    if response.status != 200 or type(run_id) is not int or run_id < 1:
        store.transition(
            operation["operation_id"],
            {"dispatching"},
            "dispatch_unknown",
            next_action="retry read-only reconciliation; do not dispatch",
        )
        raise CiError("Dispatch receipt did not contain a valid run identity; retransmission is blocked.")
    try:
        run = _get_run(transport, run_id)
    except CiError:
        store.transition(
            operation["operation_id"],
            {"dispatching"},
            "dispatch_unknown",
            run_id=run_id,
            next_action="validate direct receipt by read-only reconciliation; do not dispatch",
        )
        raise CiError("Direct run receipt could not yet be validated; retransmission is blocked.") from None
    try:
        attempt = _validate_run(run, run_id=run_id, identity=identity)
    except CiError:
        store.transition(
            operation["operation_id"],
            {"dispatching"},
            "dispatch_unknown",
            run_id=run_id,
            next_action="reconcile delayed direct receipt metadata; do not dispatch",
        )
        raise CiError("Direct run receipt metadata was not yet consistent; retransmission is blocked.") from None
    operation = store.transition(
        operation["operation_id"],
        {"dispatching"},
        "attached",
        run_id=run_id,
        attempt=attempt,
        deadline_at=int(time.time()) + 7200,
        next_action="collect the exact attached run attempt",
    )
    return public_operation(operation, attached=False)


def _jobs(transport: Transport, run_id: int, attempt: int) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    total_count: int | None = None
    seen_ids: set[int] = set()
    for page in range(1, MAX_JOB_PAGES + 1):
        response = transport.request(
            "GET",
            f"/repos/{REPOSITORY}/actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100&page={page}",
        )
        body = response.body
        if (
            response.status != 200
            or not isinstance(body, dict)
            or type(body.get("total_count")) is not int
            or body["total_count"] < 0
            or not isinstance(body.get("jobs"), list)
            or any(not isinstance(job, dict) for job in body["jobs"])
        ):
            raise CiError("Attempt-specific job evidence was malformed or unavailable.")
        if total_count is None:
            total_count = body["total_count"]
        elif body["total_count"] != total_count:
            raise CiError("Attempt job pagination changed during collection.")
        batch = body["jobs"]
        for job in batch:
            job_id = job.get("id")
            if type(job_id) is not int or job_id < 1 or job_id in seen_ids:
                raise CiError("Attempt job identity was malformed or duplicated.")
            seen_ids.add(job_id)
            jobs.append(job)
        if len(jobs) >= total_count:
            if len(jobs) != total_count:
                raise CiError("Attempt job count was contradictory.")
            return jobs
        if len(batch) < 100:
            raise CiError("Attempt job pagination ended before the declared total.")
    raise CiError("Attempt job pagination exceeded the safety limit.")


def _safe_status(value: object) -> str:
    return value if isinstance(value, str) and value in VALID_STATUSES else "unknown"


def _safe_conclusion(value: object) -> str | None:
    if value is None:
        return None
    return value if isinstance(value, str) and value in VALID_CONCLUSIONS else "unknown"


def _expected_step_conclusions(
    step_name: str,
    *,
    upload_packages: bool,
) -> set[str]:
    if step_name == "Download pinned official Ren'Py SDK on cache miss":
        return {"success", "skipped"}
    if step_name == "Upload packaged application for manual runs":
        return {"success"} if upload_packages else {"skipped"}
    return {"success"}


def _assess_required_job(
    name: str,
    job: dict[str, Any],
    *,
    sha: str,
    upload_packages: bool,
) -> tuple[dict[str, Any], list[str], int | None]:
    reasons: list[str] = []
    status = _safe_status(job.get("status"))
    conclusion = _safe_conclusion(job.get("conclusion"))
    if status != "completed":
        reasons.append("job_not_completed")
    if conclusion != "success":
        reasons.append("job_not_successful")
    if job.get("head_sha") != sha:
        reasons.append("job_candidate_mismatch")
    job_id = job.get("id") if type(job.get("id")) is int and job.get("id") > 0 else None
    if job_id is None:
        reasons.append("job_identity_invalid")
    steps = job.get("steps")
    if not isinstance(steps, list) or not steps:
        reasons.append("steps_missing")
        steps = []
    elif any(not isinstance(step, dict) for step in steps):
        reasons.append("steps_malformed")
        steps = []
    by_name: dict[str, dict[str, Any]] = {}
    duplicate = False
    for step in steps:
        step_name = step.get("name")
        if not isinstance(step_name, str):
            reasons.append("steps_malformed")
            continue
        if step_name in by_name:
            duplicate = True
        by_name[step_name] = step
    if duplicate:
        reasons.append("steps_duplicated")
    for required_step in REQUIRED_STEPS[name]:
        step = by_name.get(required_step)
        if step is None:
            reasons.append("mandatory_step_missing")
            continue
        if step.get("status") != "completed":
            reasons.append("mandatory_step_not_completed")
        allowed = _expected_step_conclusions(required_step, upload_packages=upload_packages)
        step_conclusion = step.get("conclusion")
        if not isinstance(step_conclusion, str) or step_conclusion not in allowed:
            reasons.append("mandatory_step_conclusion_invalid")
    unique_reasons = sorted(set(reasons))
    public = {
        "name": name,
        "status": status,
        "conclusion": conclusion,
        "candidate_match": job.get("head_sha") == sha,
        "evidence": "complete" if not unique_reasons else "incomplete",
        "reason_codes": unique_reasons,
    }
    return public, unique_reasons, job_id


def collect(
    transport: Transport,
    *,
    run_id: int,
    attempt: int,
    expected_sha: str | None = None,
    expected_ref: str | None = None,
    expected_identity: OperationIdentity | None = None,
    evidence_store: OperationStore | None = None,
    operation_id: str | None = None,
) -> dict[str, Any]:
    if type(run_id) is not int or type(attempt) is not int or run_id < 1 or attempt < 1:
        raise CiError("Run and attempt must be positive integers.")
    run = _get_run(transport, run_id, attempt)
    parsed = _parse_run_title(run.get("display_title"))
    if parsed is None:
        raise CiError("Run operation identity is missing or malformed.")
    key, options, _ = parsed
    if expected_identity is None:
        sha = expected_sha or run.get("head_sha")
        ref = expected_ref or run.get("head_branch")
        if not isinstance(sha, str) or not FULL_SHA.fullmatch(sha) or not isinstance(ref, str):
            raise CiError("Run identity is incomplete.")
        revision = run.get("workflow_revision")
        if not isinstance(revision, str) or not OBJECT_ID.fullmatch(revision):
            # Public collection cannot derive the candidate blob without a repository.
            # The operation key from the validated workflow remains the binding here.
            revision = "0" * 40
        expected_identity = OperationIdentity(
            repository=REPOSITORY,
            workflow=WORKFLOW,
            ref=ref,
            candidate_sha=sha,
            workflow_revision=revision,
            upload_packages=options["upload_packages"],
            force_full=options["force_full"],
            operation_key=key,
        )
    elif key != expected_identity.operation_key or options != expected_identity.options:
        raise CiError("Run operation identity contradicts the selected operation.")
    returned_attempt = _validate_run(run, run_id=run_id, identity=expected_identity)
    if returned_attempt != attempt:
        raise CiError("Requested attempt does not match provider metadata.")
    jobs = _jobs(transport, run_id, attempt)
    required_by_name: dict[str, list[dict[str, Any]]] = {name: [] for name in REQUIRED_JOBS}
    for job in jobs:
        name = job.get("name")
        if name in required_by_name:
            required_by_name[name].append(job)
    required: list[dict[str, Any]] = []
    missing: list[str] = []
    reason_codes: set[str] = set()
    failed_job_ids: list[tuple[str, int]] = []
    job_references: list[dict[str, Any]] = []
    for name in REQUIRED_JOBS:
        matches = required_by_name[name]
        if not matches:
            missing.append(name)
            reason_codes.add("required_job_missing")
            continue
        if len(matches) != 1:
            reason_codes.add("required_job_duplicated")
            required.append(
                {
                    "name": name,
                    "status": "unknown",
                    "conclusion": "unknown",
                    "candidate_match": False,
                    "evidence": "incomplete",
                    "reason_codes": ["required_job_duplicated"],
                }
            )
            continue
        public_job, job_reasons, job_id = _assess_required_job(
            name,
            matches[0],
            sha=expected_identity.candidate_sha,
            upload_packages=expected_identity.upload_packages,
        )
        required.append(public_job)
        reason_codes.update(job_reasons)
        if job_id is not None:
            job_references.append({"name": name, "job_id": job_id})
        if job_reasons and job_id is not None:
            failed_job_ids.append((name, job_id))
    provider_status = _safe_status(run.get("status"))
    provider_conclusion = _safe_conclusion(run.get("conclusion"))
    if provider_status != "completed":
        reason_codes.add("run_not_completed")
    if provider_conclusion != "success":
        reason_codes.add("run_not_successful")
    complete = not missing and not reason_codes and len(required) == len(REQUIRED_JOBS)
    accepted = provider_status == "completed" and provider_conclusion == "success" and complete

    if evidence_store is not None and operation_id is not None:
        evidence_store.store_job_references(operation_id, job_references)

    evidence: list[dict[str, Any]] = []
    reader = getattr(transport, "request_bytes", None)
    for job_name, job_id in failed_job_ids[:3]:
        item = {"job": job_name, "available": False, "reason_code": "private_store_not_selected"}
        if evidence_store is not None and operation_id is not None and callable(reader):
            try:
                raw = reader(f"/repos/{REPOSITORY}/actions/jobs/{job_id}/logs", limit=65536)
                if not isinstance(raw, bytes):
                    raise CiError("Diagnostic evidence was malformed.")
                evidence_store.store_diagnostic(
                    operation_id,
                    job_name=job_name,
                    job_id=job_id,
                    content=raw,
                    truncated=len(raw) >= 65536,
                )
                item = {"job": job_name, "available": True, "reason_code": "captured_bounded_private"}
            except (CiError, LocalStateError):
                item = {"job": job_name, "available": False, "reason_code": "private_capture_unavailable"}
        evidence.append(item)

    return {
        "schema_version": SCHEMA_VERSION,
        "repository": REPOSITORY,
        "workflow": WORKFLOW,
        "run_id": run_id,
        "attempt": attempt,
        "candidate_sha": expected_identity.candidate_sha,
        "provider_status": provider_status,
        "provider_conclusion": provider_conclusion,
        "required_gate_complete": complete,
        "accepted": accepted,
        "missing_jobs": missing,
        "required_jobs": required,
        "reason_codes": sorted(reason_codes),
        "failure_evidence": evidence,
        "monitoring_error": None,
        "evidence": "attempt-specific run, complete pagination, and affirmative required steps",
        "next_action": "publish_exact_evidence" if accepted else "inspect_private_evidence_without_automatic_rerun",
        "summary": (
            f"run {run_id} attempt {attempt} candidate {expected_identity.candidate_sha[:12]}: "
            f"{'accepted' if accepted else 'not accepted'}"
        ),
    }


def public_operation(operation: dict[str, Any], *, attached: bool) -> dict[str, Any]:
    # operation_id is an opaque local selector needed for supported recovery.  It is
    # intentionally not a handover/publication receipt.
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
    tools["python"] = bool(os.sys.executable and Path(os.sys.executable).is_file())
    credential_helper = _run(["git", "config", "--get", "credential.helper"], root, 15)
    if os.environ.get("GITHUB_TOKEN"):
        dispatch = "environment_configured_unverified"
    elif credential_helper.returncode == 0 and credential_helper.stdout.strip():
        dispatch = "git_credential_provider_configured_unverified"
    else:
        dispatch = "unavailable_missing_local_credentials"
    try:
        state_root = application_state_root()
        storage = "external_application_data_resolved_unverified" if state_root.is_absolute() else "unavailable"
    except LocalStateError:
        storage = "unavailable"
    return {
        "schema_version": SCHEMA_VERSION,
        "repository": REPOSITORY,
        "tools": tools,
        "github_collect": "available_public_read",
        "github_dispatch": dispatch,
        "private_state": storage,
        "codex_binding": "unverified",
        "automatic_wake": False,
    }


def preflight(root: Path) -> dict[str, Any]:
    commands = [
        ([os.sys.executable, "scripts/validate.py"], root, 120, "repository_privacy"),
        ([os.sys.executable, "-m", "unittest", "discover", "-s", "tests/ci_privacy", "-v"], root, 300, "privacy_tests"),
        ([os.sys.executable, "-m", "unittest", "discover", "-s", "tests/ci_tooling", "-v"], root, 300, "ci_tooling_tests"),
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
        "index_identity": hashlib.sha256(
            _run(["git", "ls-files", "--stage", "-z"], root, 30).stdout
        ).hexdigest(),
        "checks": results,
        "passed": bool(results) and all(item["status"] == "passed" for item in results),
        "native_acceptance": "delegated_to_candidate_bound_production_workflow",
    }
