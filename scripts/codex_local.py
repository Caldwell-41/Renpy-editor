#!/usr/bin/env python3
"""Create private client configuration; never contact or resume a Codex runtime."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
LOCAL_DIR = ".codex-local"
TEMPLATE = "config/codex-client.example.json"
SCHEMA_VERSION = 2
RUNTIME_KEYS = (
    "codex_home", "codex_executable", "owner_endpoint", "auth_token_env",
    "cli_version", "daemon_version", "desktop_build",
)
CLIENT_CONTEXT = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}\Z")
PRIVATE_SUFFIXES = ("client.json", "client.json.tmp", "client.lock", "evidence.json")


class LocalConfigError(Exception):
    """A value-free diagnostic that is safe to show without leaking configuration."""


def run_bounded(
    args: list[str], root: Path, *, input_bytes: bytes | None = None,
    environment: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args, cwd=root, input=input_bytes, capture_output=True, check=False,
            timeout=15, env=environment,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise LocalConfigError("A required local safety check was unavailable; private setup is blocked.") from None


def git_paths(root: Path, *args: str) -> list[str]:
    result = run_bounded(["git", "ls-files", "-z", *args], root)
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


def validate_client_context(value: str) -> str:
    if not CLIENT_CONTEXT.fullmatch(value):
        raise LocalConfigError("Client context must be a short local label containing only safe characters.")
    return value


def profile_path(root: Path, client_context: str) -> Path:
    context = validate_client_context(client_context)
    # This routing digest stays local. It is not anonymous publication data.
    key = hashlib.sha256(context.encode("utf-8")).hexdigest()
    return root / LOCAL_DIR / "clients" / key / "client.json"


def _relative(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        raise LocalConfigError("Private destination is outside the repository.") from None


def assert_ignored(root: Path, destinations: tuple[Path, ...]) -> None:
    if any(is_local_only(p) for p in git_paths(root, "--cached")):
        raise LocalConfigError("Local-only configuration is tracked; stop publication and untrack it.")
    exposed = git_paths(root, "--others", "--exclude-standard", "--", LOCAL_DIR)
    if exposed:
        raise LocalConfigError("A private namespace contains non-ignored untracked data; setup refused.")
    for destination in destinations:
        relative = _relative(root, destination)
        result = run_bounded(
            ["git", "check-ignore", "--no-index", "--quiet", "--", relative], root,
        )
        if result.returncode == 1:
            raise LocalConfigError("A private destination is not effectively ignored; setup refused.")
        if result.returncode != 0:
            raise LocalConfigError("Git ignore protection could not be verified; setup refused.")


def bootstrap_context(root: Path) -> dict[str, str | None]:
    # Collect only after storage protection passes. These observations remain local.
    import socket
    return {
        "host": socket.gethostname(),
        "user_home": str(Path.home()),
        "workspace": str(root.resolve()),
        "declared_codex_home": os.environ.get("CODEX_HOME"),
        "launcher_on_path": shutil.which("codex"),
    }


def _windows_acl_private(path: Path) -> bool:
    script = r"""
$ErrorActionPreference = 'Stop'
$env:PSModulePath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules"
Import-Module Microsoft.PowerShell.Security -Force
$target = [Environment]::GetEnvironmentVariable('LOOMLIGHT_ACL_TARGET')
$acl = Get-Acl -LiteralPath $target
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$writeMask = [System.Security.AccessControl.FileSystemRights]::Write -bor
  [System.Security.AccessControl.FileSystemRights]::Modify -bor
  [System.Security.AccessControl.FileSystemRights]::FullControl -bor
  [System.Security.AccessControl.FileSystemRights]::CreateFiles -bor
  [System.Security.AccessControl.FileSystemRights]::CreateDirectories
$broad = @('S-1-1-0', 'S-1-5-11', 'S-1-5-32-545')
$mine = $false
$unsafe = $false
foreach ($rule in $acl.Access) {
  $ruleSid = $rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
  $writes = (($rule.FileSystemRights -band $writeMask) -ne 0)
  if ($rule.AccessControlType -eq 'Allow' -and $writes -and $ruleSid -eq $sid) { $mine = $true }
  if ($rule.AccessControlType -eq 'Allow' -and $writes -and $broad -contains $ruleSid) { $unsafe = $true }
}
if ($mine -and -not $unsafe) { exit 0 }
exit 1
"""
    result = run_bounded(
        [r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
        path.parent, environment={**os.environ, "LOOMLIGHT_ACL_TARGET": str(path)},
    )
    return result.returncode == 0


def _protect_windows_directory(path: Path) -> None:
    identity = run_bounded(["whoami", "/user", "/fo", "csv", "/nh"], path.parent)
    if identity.returncode:
        raise LocalConfigError("Current Windows account could not be identified; setup refused.")
    try:
        sid = next(csv.reader(io.StringIO(identity.stdout.decode("utf-8"))))[1]
    except (IndexError, StopIteration, UnicodeError, csv.Error):
        raise LocalConfigError("Current Windows account could not be identified; setup refused.") from None
    if not re.fullmatch(r"S-1-(?:\d+-)+\d+", sid):
        raise LocalConfigError("Current Windows account identity was invalid; setup refused.")
    result = run_bounded([
        "icacls", str(path), "/inheritance:r", "/grant:r",
        f"*{sid}:(OI)(CI)F", "*S-1-5-18:(OI)(CI)F", "*S-1-5-32-544:(OI)(CI)F",
    ], path.parent)
    if result.returncode:
        raise LocalConfigError("Private Windows ACL could not be established; setup refused.")


def storage_is_private(path: Path, *, directory: bool) -> bool:
    try:
        info = path.lstat()
    except OSError:
        return False
    reparse = getattr(info, "st_file_attributes", 0) & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    if stat.S_ISLNK(info.st_mode) or reparse:
        return False
    if directory:
        if not stat.S_ISDIR(info.st_mode):
            return False
    elif not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
        return False
    if os.name == "nt":
        return _windows_acl_private(path)
    return stat.S_IMODE(info.st_mode) & 0o077 == 0


def ensure_private_directory(path: Path) -> None:
    created = False
    try:
        path.mkdir(mode=0o700)
        created = True
    except FileExistsError:
        pass
    if created and os.name == "nt":
        _protect_windows_directory(path)
    if not storage_is_private(path, directory=True):
        raise LocalConfigError("Private storage permissions could not be verified; setup refused.")


def check_shape(data: object, *, template: bool) -> dict:
    required = {
        "schema_version", "automatic_wait_enabled", "client_context",
        "client_instance_id", "bootstrap_context", "runtime",
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
        data["client_context"] is not None or data["client_instance_id"] is not None
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


def read_config(path: Path, *, template: bool = False) -> dict:
    try:
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode) or (
            getattr(info, "st_file_attributes", 0) & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
        ):
            raise LocalConfigError("Refusing linked or non-regular configuration input.")
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
) -> tuple[Path, bool]:
    path = profile_path(root, client_context)
    private_paths = tuple(path.with_name(name) for name in PRIVATE_SUFFIXES)
    assert_ignored(root, private_paths)

    # Creating a blank directory is safe; identifying observations are collected only
    # after its permissions have been checked on the native host.
    ensure_private_directory(root / LOCAL_DIR)
    assert_ignored(root, private_paths)
    if context is None:
        context = bootstrap_context(root)

    template = read_config(root / TEMPLATE, template=True)
    parent = root / LOCAL_DIR
    for part in path.parent.relative_to(parent).parts:
        parent /= part
        ensure_private_directory(parent)
    assert_ignored(root, private_paths)

    template["client_context"] = client_context
    template["client_instance_id"] = str(uuid.uuid4())
    template["bootstrap_context"] = context
    created = False
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags, 0o600)
    except FileExistsError:
        pass
    else:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as output:
            output.write(json.dumps(template, indent=2) + "\n")
            output.flush()
            os.fsync(output.fileno())
        created = True
    if not storage_is_private(path, directory=False):
        raise LocalConfigError("Private configuration permissions could not be verified.")
    data = read_config(path)
    if (
        data["client_context"] != client_context
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
    parser.add_argument("command", choices=("init", "path"))
    parser.add_argument(
        "--client-context", required=True,
        help="explicit local context label; stored only in ignored private state",
    )
    args = parser.parse_args()
    try:
        path, created = initialise(ROOT, client_context=args.client_context)
        if args.command == "path":
            print(path.relative_to(ROOT).as_posix())
        else:
            print(json.dumps({
                "status": "created" if created else "existing",
                "runtime_binding": "unverified",
                "automatic_wait_enabled": False,
            }))
        return 0
    except (LocalConfigError, OSError, ValueError):
        print(
            "Local Codex setup blocked; inspect docs/LOCAL_CODEX_CONFIG.md locally. No values were printed.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
