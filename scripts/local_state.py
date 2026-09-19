"""Protected per-user Loomlight state outside repositories.

This module deliberately knows nothing about Codex runtime control.  It only resolves
an application-data location and establishes a narrow filesystem safety boundary.
"""
from __future__ import annotations

import csv
import io
import ntpath
import os
from pathlib import Path, PurePath, PurePosixPath, PureWindowsPath
import posixpath
import re
import stat
import subprocess
import sys
import time
from typing import Mapping

STATE_OVERRIDE = "LOOMLIGHT_STATE_ROOT"
APP_DIRECTORY = "Loomlight"
PRIVATE_DIRECTORY = "private-state"


class LocalStateError(Exception):
    """Value-free local-state diagnostic safe to display."""


def _run(
    args: list[str],
    cwd: Path,
    *,
    environment: dict[str, str] | None = None,
    timeout: int = 15,
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args,
            cwd=cwd,
            capture_output=True,
            check=False,
            timeout=timeout,
            env=environment,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise LocalStateError("A required local storage check was unavailable; private state is blocked.") from None


def _is_absolute_for_platform(value: str, platform: str) -> bool:
    return ntpath.isabs(value) if platform == "win32" else posixpath.isabs(value)


def application_state_root(
    *,
    platform: str | None = None,
    environ: Mapping[str, str] | None = None,
    home: PurePath | None = None,
) -> PurePath:
    """Return the OS-appropriate private state root without creating it."""
    selected_platform = platform or sys.platform
    selected_environment = os.environ if environ is None else environ
    override = selected_environment.get(STATE_OVERRIDE)
    if override:
        if not _is_absolute_for_platform(override, selected_platform):
            raise LocalStateError("The private state override must be an absolute path.")
        if selected_platform == sys.platform:
            return Path(override)
        return PureWindowsPath(override) if selected_platform == "win32" else PurePosixPath(override)
    selected_home = home or Path.home()
    if selected_platform == "win32":
        local_app_data = selected_environment.get("LOCALAPPDATA")
        if not local_app_data or not ntpath.isabs(local_app_data):
            raise LocalStateError("Windows Local AppData is unavailable; private state is blocked.")
        base = Path(local_app_data) if selected_platform == sys.platform else PureWindowsPath(local_app_data)
        return base / APP_DIRECTORY / PRIVATE_DIRECTORY
    if selected_platform == "darwin":
        if not posixpath.isabs(str(selected_home)):
            raise LocalStateError("The macOS user application-data root is unavailable.")
        base = selected_home
        if selected_platform != sys.platform and not isinstance(base, PurePosixPath):
            base = PurePosixPath(str(base).replace("\\", "/"))
        return base / "Library" / "Application Support" / APP_DIRECTORY / PRIVATE_DIRECTORY
    xdg_state = selected_environment.get("XDG_STATE_HOME")
    if xdg_state:
        if not posixpath.isabs(xdg_state):
            raise LocalStateError("The XDG state root must be absolute.")
        return Path(xdg_state) / "loomlight" / PRIVATE_DIRECTORY
    if not posixpath.isabs(str(selected_home)):
        raise LocalStateError("The user state root is unavailable.")
    return selected_home / ".local" / "state" / "loomlight" / PRIVATE_DIRECTORY


def _is_reparse(info: os.stat_result) -> bool:
    return bool(
        getattr(info, "st_file_attributes", 0)
        & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    )


def _lstat(path: Path) -> os.stat_result | None:
    try:
        return path.lstat()
    except FileNotFoundError:
        return None
    except OSError:
        raise LocalStateError("Private state metadata could not be inspected safely.") from None


def _assert_existing_chain_unlinked(path: Path) -> None:
    candidates: list[Path] = []
    current = path
    while current != current.parent:
        candidates.append(current)
        current = current.parent
    for candidate in reversed(candidates):
        info = _lstat(candidate)
        if info is None:
            continue
        if stat.S_ISLNK(info.st_mode) or _is_reparse(info):
            raise LocalStateError("Private state path substitution was detected; setup refused.")
        if candidate != path and not stat.S_ISDIR(info.st_mode):
            raise LocalStateError("A private state parent is not a directory; setup refused.")


def _windows_sid(path: Path) -> str:
    identity = _run(["whoami", "/user", "/fo", "csv", "/nh"], path.parent)
    if identity.returncode:
        raise LocalStateError("Current Windows account could not be identified; setup refused.")
    try:
        sid = next(csv.reader(io.StringIO(identity.stdout.decode("utf-8"))))[1]
    except (IndexError, StopIteration, UnicodeError, csv.Error):
        raise LocalStateError("Current Windows account could not be identified; setup refused.") from None
    if not re.fullmatch(r"S-1-(?:\d+-)+\d+", sid):
        raise LocalStateError("Current Windows account identity was invalid; setup refused.")
    return sid


def _protect_windows(path: Path) -> None:
    sid = _windows_sid(path)
    info = _lstat(path)
    if info is None or stat.S_ISLNK(info.st_mode) or _is_reparse(info):
        raise LocalStateError("Private Windows target type was invalid; setup refused.")
    grant = "(OI)(CI)F" if stat.S_ISDIR(info.st_mode) else "F"
    result = _run(
        [
            "icacls",
            str(path),
            "/inheritance:r",
            "/grant:r",
            f"*{sid}:{grant}",
            f"*S-1-5-18:{grant}",
            f"*S-1-5-32-544:{grant}",
        ],
        path.parent,
    )
    if result.returncode:
        raise LocalStateError("Private Windows ACL could not be established; setup refused.")


def _windows_acl_private(path: Path) -> bool:
    script = r"""
$ErrorActionPreference = 'Stop'
$env:PSModulePath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules"
Import-Module Microsoft.PowerShell.Security -Force
$target = [Environment]::GetEnvironmentVariable('LOOMLIGHT_ACL_TARGET')
$acl = Get-Acl -LiteralPath $target
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$ownerSid = $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
$allowed = @($sid, 'S-1-3-4', 'S-1-5-18', 'S-1-5-32-544')
$mine = $false
$unsafe = $false
foreach ($rule in $acl.Access) {
  $ruleSid = $rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
  if ($rule.AccessControlType -eq 'Allow') {
    if ($ruleSid -eq $sid) { $mine = $true }
    if ($allowed -notcontains $ruleSid) { $unsafe = $true }
  }
}
if ($ownerSid -eq $sid -and $mine -and -not $unsafe) { exit 0 }
exit 1
"""
    try:
        result = _run(
            [
                r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script,
            ],
            path.parent,
            environment={**os.environ, "LOOMLIGHT_ACL_TARGET": str(path)},
            timeout=45,
        )
    except LocalStateError:
        return False
    return result.returncode == 0


def storage_is_private(path: Path, *, directory: bool) -> bool:
    info = _lstat(path)
    if info is None or stat.S_ISLNK(info.st_mode) or _is_reparse(info):
        return False
    if directory:
        if not stat.S_ISDIR(info.st_mode):
            return False
    elif not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
        return False
    if os.name == "nt":
        return _windows_acl_private(path)
    expected = 0o700 if directory else 0o600
    return stat.S_IMODE(info.st_mode) == expected


def ensure_private_directory(path: Path) -> None:
    _assert_existing_chain_unlinked(path.parent)
    try:
        path.mkdir(mode=0o700)
        created = True
    except FileExistsError:
        created = False
    except OSError:
        raise LocalStateError("Private directory could not be created safely.") from None
    if created:
        if os.name == "nt":
            _protect_windows(path)
        else:
            try:
                path.chmod(0o700)
            except OSError:
                raise LocalStateError("Private directory permissions could not be established.") from None
    if not created:
        for _ in range(40):
            if storage_is_private(path, directory=True):
                return
            time.sleep(0.05)
    if not storage_is_private(path, directory=True):
        raise LocalStateError("Private directory permissions could not be verified; setup refused.")


def ensure_state_root(path: Path) -> Path:
    if not path.is_absolute():
        raise LocalStateError("Private state root must be absolute.")
    _assert_existing_chain_unlinked(path)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise LocalStateError("Private state parent could not be prepared.") from None
    _assert_existing_chain_unlinked(path.parent)
    ensure_private_directory(path)
    return path


def require_external_state_root(repository_root: Path, state_root: Path) -> None:
    """Reject redirected state that resolves inside the Git worktree."""
    try:
        repository = repository_root.resolve(strict=True)
        candidate = state_root.resolve(strict=False)
        candidate.relative_to(repository)
    except ValueError:
        return
    except OSError:
        raise LocalStateError("Private state location could not be resolved safely.") from None
    raise LocalStateError("Private runtime state must be outside the repository worktree.")


def ensure_private_subdirectory(root: Path, *parts: str) -> Path:
    ensure_state_root(root)
    current = root
    for part in parts:
        if not part or part in {".", ".."} or "/" in part or "\\" in part:
            raise LocalStateError("Invalid private state component.")
        current = current / part
        ensure_private_directory(current)
    return current


def create_private_file(path: Path) -> bool:
    """Exclusively create a protected regular file; return False if it exists."""
    _assert_existing_chain_unlinked(path.parent)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags, 0o600)
    except FileExistsError:
        return False
    except OSError:
        raise LocalStateError("Private file could not be created safely.") from None
    os.close(descriptor)
    if os.name == "nt":
        _protect_windows(path)
    else:
        try:
            path.chmod(0o600)
        except OSError:
            raise LocalStateError("Private file permissions could not be established.") from None
    if not storage_is_private(path, directory=False):
        raise LocalStateError("Private file permissions could not be verified; setup refused.")
    return True


def assert_private_file(path: Path) -> None:
    if not storage_is_private(path, directory=False):
        raise LocalStateError("Private file permissions could not be verified; setup refused.")


def legacy_state_present(repository_root: Path) -> bool:
    """Inspect only the legacy namespace entry, never its contents."""
    return _lstat(repository_root / ".codex-local") is not None


def require_legacy_acknowledgement(repository_root: Path, *, acknowledged: bool) -> None:
    if legacy_state_present(repository_root) and not acknowledged:
        raise LocalStateError(
            "Legacy repository-local state exists; explicit external-state reinitialisation is required."
        )
