#!/usr/bin/env python3
"""Create protected per-user client configuration; never contact Codex."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import time
import uuid

from local_state import (
    LocalStateError,
    application_state_root,
    assert_private_file,
    create_private_file,
    ensure_private_subdirectory,
    require_external_state_root,
    require_legacy_acknowledgement,
    storage_is_private,
)

ROOT = Path(__file__).resolve().parents[1]
LEGACY_LOCAL_DIR = ".codex-local"
TEMPLATE = "config/codex-client.example.json"
SCHEMA_VERSION = 2
RUNTIME_KEYS = (
    "codex_home",
    "codex_executable",
    "owner_endpoint",
    "auth_token_env",
    "cli_version",
    "daemon_version",
    "desktop_build",
)
CLIENT_CONTEXT = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}\Z")

# Preserve the public exception name used by the repository validator and callers.
LocalConfigError = LocalStateError


def run_bounded(
    args: list[str],
    root: Path,
    *,
    input_bytes: bytes | None = None,
    environment: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args,
            cwd=root,
            input=input_bytes,
            capture_output=True,
            check=False,
            timeout=15,
            env=environment,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise LocalConfigError("A required local safety check was unavailable; setup is blocked.") from None


def git_paths(root: Path, *args: str) -> list[str]:
    result = run_bounded(["git", "ls-files", "-z", *args], root)
    if result.returncode:
        raise LocalConfigError("Cannot inspect Git index; publication safety check is blocked.")
    return [os.fsdecode(path) for path in result.stdout.split(b"\0") if path]


def is_local_only(path: str) -> bool:
    """Identify legacy/runtime names that must never become repository content."""
    parts = Path(path).parts
    name = Path(path).name.casefold()
    return any(
        part.casefold() in {LEGACY_LOCAL_DIR, "private-state"}
        or (
            part.casefold().startswith(".env")
            and (part.casefold() == ".env" or part.casefold().startswith(".env."))
            and part != ".env.example"
        )
        for part in parts
    ) or name in {
        "operations.sqlite3",
        "operations.sqlite3-wal",
        "operations.sqlite3-shm",
        "operations.sqlite3-journal",
    }


def validate_client_context(value: str) -> str:
    if not CLIENT_CONTEXT.fullmatch(value):
        raise LocalConfigError("Client context must be a short local label containing only safe characters.")
    return value


def profile_path(state_root: Path, client_context: str) -> Path:
    context = validate_client_context(client_context)
    key = hashlib.sha256(context.encode("utf-8")).hexdigest()
    return state_root / "clients" / key / "client.json"


def bootstrap_context(root: Path) -> dict[str, str | None]:
    # This is called only after the external storage boundary is established.
    import socket

    return {
        "host": socket.gethostname(),
        "user_home": str(Path.home()),
        "workspace": str(root.resolve()),
        "declared_codex_home": os.environ.get("CODEX_HOME"),
        "launcher_on_path": shutil.which("codex"),
    }


def check_shape(data: object, *, template: bool) -> dict:
    required = {
        "schema_version",
        "automatic_wait_enabled",
        "client_context",
        "client_instance_id",
        "bootstrap_context",
        "runtime",
    }
    if not isinstance(data, dict) or set(data) != required:
        raise LocalConfigError("Invalid client configuration schema.")
    if type(data["schema_version"]) is not int or data["schema_version"] != SCHEMA_VERSION:
        raise LocalConfigError("Unsupported client schema.")
    if data["automatic_wait_enabled"] is not False:
        raise LocalConfigError("Automatic mode is not qualified.")
    runtime = data["runtime"]
    if not isinstance(runtime, dict) or set(runtime) != set(RUNTIME_KEYS):
        raise LocalConfigError("Invalid runtime field set.")
    if any(value is not None and not isinstance(value, str) for value in runtime.values()):
        raise LocalConfigError("Runtime fields must be null or locally verified strings.")
    if data["client_context"] is not None and not isinstance(data["client_context"], str):
        raise LocalConfigError("Invalid client context.")
    if template and (
        data["client_context"] is not None
        or data["client_instance_id"] is not None
        or data["bootstrap_context"] is not None
        or any(value is not None for value in runtime.values())
    ):
        raise LocalConfigError("Committed client template must contain placeholders only.")
    return data


def read_config_bytes(content: bytes, *, template: bool = False) -> dict:
    if len(content) > 65536:
        raise LocalConfigError("Client configuration is too large.")
    try:
        return check_shape(json.loads(content.decode("utf-8")), template=template)
    except (UnicodeError, json.JSONDecodeError):
        raise LocalConfigError("Cannot parse client configuration; values withheld.") from None


def read_config(path: Path, *, template: bool = False, private: bool = False) -> dict:
    try:
        info = path.lstat()
        if (
            stat.S_ISLNK(info.st_mode)
            or not stat.S_ISREG(info.st_mode)
            or getattr(info, "st_file_attributes", 0)
            & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
        ):
            raise LocalConfigError("Refusing linked or non-regular configuration input.")
        if private and info.st_nlink != 1:
            raise LocalConfigError("Refusing hard-linked private configuration input.")
        if info.st_size > 65536:
            raise LocalConfigError("Client configuration is too large.")
        return read_config_bytes(path.read_bytes(), template=template)
    except OSError:
        raise LocalConfigError("Cannot read client configuration; values withheld.") from None


def initialise(
    root: Path,
    context: dict[str, str | None] | None = None,
    *,
    client_context: str,
    state_root: Path | None = None,
    acknowledge_legacy: bool = False,
) -> tuple[Path, bool]:
    """Create or revalidate one explicit profile in protected application data."""
    context_label = validate_client_context(client_context)
    require_legacy_acknowledgement(root, acknowledged=acknowledge_legacy)
    template = read_config(root / TEMPLATE, template=True)
    selected_root = state_root or application_state_root()
    require_external_state_root(root, selected_root)
    ensure_private_subdirectory(selected_root, "clients")
    key = hashlib.sha256(context_label.encode("utf-8")).hexdigest()
    parent = ensure_private_subdirectory(selected_root, "clients", key)
    path = parent / "client.json"

    # Identity collection begins only after every destination directory is protected.
    if context is None:
        context = bootstrap_context(root)

    template["client_context"] = context_label
    template["client_instance_id"] = str(uuid.uuid4())
    template["bootstrap_context"] = context
    created = create_private_file(path)
    if created:
        flags = os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0)
        try:
            descriptor = os.open(path, flags)
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as output:
                output.write(json.dumps(template, indent=2) + "\n")
                output.flush()
                os.fsync(output.fileno())
        except OSError:
            raise LocalConfigError("Private configuration could not be written safely.") from None
    data = None
    for attempt in range(40 if not created else 1):
        try:
            assert_private_file(path)
            data = read_config(path, private=True)
            break
        except LocalConfigError:
            if attempt == (39 if not created else 0):
                raise
            time.sleep(0.05)
    assert data is not None
    if (
        data["client_context"] != context_label
        or data["bootstrap_context"] != context
        or not isinstance(data["client_instance_id"], str)
    ):
        raise LocalConfigError("Client context mismatch; preserve evidence and select the correct client.")
    try:
        uuid.UUID(data["client_instance_id"])
    except (ValueError, TypeError):
        raise LocalConfigError("Invalid local client identity.") from None
    return path, created


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("init",))
    parser.add_argument(
        "--client-context",
        required=True,
        help="explicit local context label stored only in protected application data",
    )
    parser.add_argument(
        "--acknowledge-legacy-state",
        action="store_true",
        help="reinitialise externally without reading, changing, or deleting legacy repository-local state",
    )
    args = parser.parse_args()
    try:
        _, created = initialise(
            ROOT,
            client_context=args.client_context,
            acknowledge_legacy=args.acknowledge_legacy_state,
        )
        print(
            json.dumps(
                {
                    "status": "created" if created else "existing",
                    "storage": "protected_user_application_data",
                    "runtime_binding": "unverified",
                    "automatic_wait_enabled": False,
                }
            )
        )
        return 0
    except (LocalConfigError, OSError, ValueError):
        print(
            "Local Codex setup blocked; inspect docs/LOCAL_CODEX_CONFIG.md locally. No values were printed.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
