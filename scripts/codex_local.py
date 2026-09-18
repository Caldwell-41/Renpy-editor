#!/usr/bin/env python3
"""Create private client configuration; never contact or resume a Codex runtime."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import socket
import stat
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
LOCAL_DIR = ".codex-local"
TEMPLATE = "config/codex-client.example.json"
RUNTIME_KEYS = (
    "codex_home", "codex_executable", "owner_endpoint", "auth_token_env",
    "cli_version", "daemon_version", "desktop_build",
)


class LocalConfigError(Exception):
    """A value-free diagnostic that is safe to show without leaking configuration."""


def git_paths(root: Path, *args: str) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z", *args], cwd=root,
        capture_output=True, check=False,
    )
    if result.returncode:
        raise LocalConfigError("Cannot inspect Git index; private setup is blocked.")
    return [os.fsdecode(p) for p in result.stdout.split(b"\0") if p]


def is_local_only(path: str) -> bool:
    parts = Path(path).parts
    return any(
        part.casefold() == LOCAL_DIR
        or (part.casefold().startswith(".env")
            and (part.casefold() == ".env" or part.casefold().startswith(".env."))
            and part != ".env.example")
        for part in parts
    )


def assert_ignored(root: Path) -> None:
    if any(is_local_only(p) for p in git_paths(root, "--cached")):
        raise LocalConfigError("Local-only configuration is tracked; stop publication and untrack it.")
    result = subprocess.run(
        ["git", "check-ignore", "--no-index", "--quiet", "--", f"{LOCAL_DIR}/probe.json"],
        cwd=root, capture_output=True, check=False,
    )
    if result.returncode:
        raise LocalConfigError("Private configuration directory is not ignored; setup refused.")


def bootstrap_context(root: Path) -> dict[str, str | None]:
    # These observations are LOCAL ONLY and are not proof of the owning runtime.
    return {
        "host": socket.gethostname(),
        "user_home": str(Path.home()),
        "workspace": str(root.resolve()),
        "declared_codex_home": os.environ.get("CODEX_HOME"),
        "launcher_on_path": shutil.which("codex"),
    }


def profile_path(root: Path, context: dict[str, str | None]) -> Path:
    encoded = json.dumps(context, sort_keys=True, separators=(",", ":")).encode()
    # A local routing key, NOT anonymisation suitable for publishing to GitHub.
    key = hashlib.sha256(encoded).hexdigest()
    return root / LOCAL_DIR / "clients" / key / "client.json"


def reject_link(path: Path, *, directory: bool) -> None:
    info = path.lstat()
    reparse = getattr(info, "st_file_attributes", 0) & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    if stat.S_ISLNK(info.st_mode) or reparse:
        raise LocalConfigError("Refusing linked/reparse private configuration paths.")
    if directory and not stat.S_ISDIR(info.st_mode):
        raise LocalConfigError("Private configuration parent is not a directory.")
    if not directory and (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1):
        raise LocalConfigError("Private configuration must be a regular, unshared file.")
    if os.name != "nt" and stat.S_IMODE(info.st_mode) & 0o077:
        raise LocalConfigError("Private configuration permissions are too broad; restrict them locally.")


def check_shape(data: object, *, template: bool) -> dict:
    if not isinstance(data, dict) or set(data) != {
        "schema_version", "automatic_wait_enabled", "client_instance_id", "bootstrap_context", "runtime"
    }:
        raise LocalConfigError("Invalid client configuration schema.")
    if type(data["schema_version"]) is not int or data["schema_version"] != 1 or data["automatic_wait_enabled"] is not False:
        raise LocalConfigError("Unsupported client schema or automatic mode; no runtime support is qualified.")
    runtime = data["runtime"]
    if not isinstance(runtime, dict) or set(runtime) != set(RUNTIME_KEYS):
        raise LocalConfigError("Invalid runtime field set.")
    if any(value is not None and not isinstance(value, str) for value in runtime.values()):
        raise LocalConfigError("Runtime fields must be null or locally verified strings.")
    if template and (
        data["client_instance_id"] is not None or data["bootstrap_context"] is not None
        or any(value is not None for value in runtime.values())
    ):
        raise LocalConfigError("Committed client template must contain placeholders only.")
    return data


def read_config(path: Path, *, template: bool = False) -> dict:
    try:
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode) or (
            getattr(info, "st_file_attributes", 0) & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
        ):
            raise LocalConfigError("Refusing linked or non-regular configuration input.")
        if info.st_size > 65536:
            raise LocalConfigError("Client configuration is too large.")
        return check_shape(json.loads(path.read_text(encoding="utf-8")), template=template)
    except (OSError, UnicodeError, json.JSONDecodeError):
        raise LocalConfigError("Cannot read client configuration; inspect it locally without publishing its values.") from None


def initialise(root: Path, context: dict[str, str | None] | None = None) -> tuple[Path, bool]:
    assert_ignored(root)
    context = bootstrap_context(root) if context is None else context
    template = read_config(root / TEMPLATE, template=True)
    path = profile_path(root, context)
    parent = root
    for part in path.parent.relative_to(root).parts:
        parent /= part
        try:
            parent.mkdir(mode=0o700)
        except FileExistsError:
            pass
        reject_link(parent, directory=True)
    template["client_instance_id"] = str(uuid.uuid4())
    template["bootstrap_context"] = context
    created = False
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags, 0o600)
    except FileExistsError:
        pass  # An existing or competing initializer owns this file; never clobber it.
    else:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as output:
            output.write(json.dumps(template, indent=2) + "\n")
            output.flush()
            os.fsync(output.fileno())
        created = True
    reject_link(path, directory=False)
    data = read_config(path)
    if data["bootstrap_context"] != context or not isinstance(data["client_instance_id"], str):
        raise LocalConfigError("Client context mismatch; preserve local evidence and initialise the correct client.")
    try:
        uuid.UUID(data["client_instance_id"])
    except (ValueError, TypeError):
        raise LocalConfigError("Invalid local client identity.") from None
    return path, created


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("init", "path"))
    args = parser.parse_args()
    try:
        path, created = initialise(ROOT)
        if args.command == "path":
            # Capture this locally for editing; never paste it into a published receipt.
            print(path.relative_to(ROOT).as_posix())
        else:
            print(json.dumps({
                "status": "created" if created else "existing",
                "runtime_binding": "unverified",
                "automatic_wait_enabled": False,
            }))
        return 0
    except (LocalConfigError, OSError, ValueError):
        # Do not echo exception text from paths, environment, JSON, or subprocesses.
        print("Local Codex setup blocked; inspect local state using docs/LOCAL_CODEX_CONFIG.md. No values were printed.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
