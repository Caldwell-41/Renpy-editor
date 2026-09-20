"""Corrective regressions for protected state outside the Git worktree."""
from __future__ import annotations

import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import sqlite3
import stat
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE / "scripts"))

import codex_local
import ci_lib
import local_state


class ExternalStateRegressions(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows ACL behavior requires a Windows host")
    def test_windows_acl_protection_normalises_default_owner(self):
        classify_owner = r"""
$ErrorActionPreference = 'Stop'
$env:PSModulePath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules"
Import-Module Microsoft.PowerShell.Security -Force
$target = [Environment]::GetEnvironmentVariable('LOOMLIGHT_ACL_TARGET')
$acl = Get-Acl -LiteralPath $target
$owner = $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
$current = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
if ($owner -eq $current) { 'current'; exit 0 }
if ($owner -eq 'S-1-5-32-544') { 'administrators'; exit 0 }
if ($owner -eq 'S-1-5-18') { 'system'; exit 0 }
'other'
"""

        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary).resolve() / "ownership-probe"
            path.mkdir()

            def owner_category() -> str:
                result = subprocess.run(
                    [
                        r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
                        "-NoProfile",
                        "-NonInteractive",
                        "-Command",
                        classify_owner,
                    ],
                    cwd=path.parent,
                    capture_output=True,
                    check=False,
                    env={**os.environ, "LOOMLIGHT_ACL_TARGET": str(path)},
                    timeout=45,
                )
                self.assertEqual(result.returncode, 0)
                category = result.stdout.decode("ascii").strip()
                self.assertIn(category, {"current", "administrators", "system", "other"})
                return category

            default_owner = owner_category()
            local_state._protect_windows(path)
            self.assertEqual(owner_category(), "current")
            self.assertTrue(local_state.storage_is_private(path, directory=True))
            print(f"native_windows_default_owner={default_owner}; protected_owner=current")

    def test_platform_state_roots_are_external_and_deterministic(self):
        windows = codex_local.application_state_root(
            platform="win32",
            environ={"LOCALAPPDATA": r"C:\Synthetic\Local"},
            home=PureWindowsPath(r"C:\Synthetic\Home"),
        )
        macos = codex_local.application_state_root(
            platform="darwin",
            environ={},
            home=PurePosixPath("/Synthetic/Home"),
        )
        self.assertEqual(windows, PureWindowsPath(r"C:\Synthetic\Local") / "Loomlight" / "private-state")
        self.assertEqual(
            macos,
            PurePosixPath("/Synthetic/Home/Library/Application Support/Loomlight/private-state"),
        )

    def test_profile_is_created_only_in_redirected_external_root(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve()
            repository = base / "repository"
            state_root = base / "application-data" / "private-state"
            repository.mkdir()
            (repository / "config").mkdir()
            (repository / codex_local.TEMPLATE).write_bytes(
                (SOURCE / codex_local.TEMPLATE).read_bytes()
            )
            context = {
                "host": "synthetic-host",
                "user_home": "synthetic-home",
                "workspace": "synthetic-workspace",
                "declared_codex_home": None,
                "launcher_on_path": None,
            }
            path, created = codex_local.initialise(
                repository,
                context,
                client_context="client-a",
                state_root=state_root,
            )
            self.assertTrue(created)
            self.assertTrue(path.is_relative_to(state_root))
            self.assertFalse((repository / ".codex-local").exists())
            if os.name != "nt":
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_legacy_state_requires_explicit_reinitialisation(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve()
            repository = base / "repository"
            state_root = base / "application-data" / "private-state"
            repository.mkdir()
            (repository / ".codex-local").mkdir()
            (repository / "config").mkdir()
            (repository / codex_local.TEMPLATE).write_bytes(
                (SOURCE / codex_local.TEMPLATE).read_bytes()
            )
            context = {
                "host": "synthetic-host",
                "user_home": "synthetic-home",
                "workspace": "synthetic-workspace",
                "declared_codex_home": None,
                "launcher_on_path": None,
            }
            with self.assertRaises(codex_local.LocalConfigError):
                codex_local.initialise(
                    repository,
                    context,
                    client_context="client-a",
                    state_root=state_root,
                )
            self.assertEqual(list((repository / ".codex-local").iterdir()), [])
            path, created = codex_local.initialise(
                repository,
                context,
                client_context="client-a",
                state_root=state_root,
                acknowledge_legacy=True,
            )
            self.assertTrue(created)
            self.assertTrue(path.is_relative_to(state_root))

    def test_sqlite_journal_and_companions_are_external_and_private(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve()
            repository = base / "repository"
            state_root = base / "application-data" / "private-state"
            repository.mkdir()
            store = ci_lib.OperationStore(repository, state_root=state_root)
            try:
                self.assertTrue(store.path.is_relative_to(state_root))
                self.assertTrue(local_state.storage_is_private(store.path, directory=False))
                for suffix in ("-wal", "-shm"):
                    companion = store.path.with_name(store.path.name + suffix)
                    if companion.exists():
                        self.assertTrue(local_state.storage_is_private(companion, directory=False))
            finally:
                store.connection.close()

    def test_hardlinked_sqlite_journal_is_refused_on_reopen(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve()
            repository = base / "repository"
            state_root = base / "application-data" / "private-state"
            repository.mkdir()
            store = ci_lib.OperationStore(repository, state_root=state_root)
            path = store.path
            store.connection.close()
            alias = path.with_name("journal-alias.sqlite3")
            try:
                os.link(path, alias)
            except OSError:
                self.skipTest("host does not permit hard links")
            with self.assertRaises(local_state.LocalStateError):
                ci_lib.OperationStore(repository, state_root=state_root)

    def test_unsafe_existing_sqlite_companion_is_rejected_before_connect(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve()
            repository = base / "repository"
            state_root = base / "application-data" / "private-state"
            repository.mkdir()
            directory = local_state.ensure_private_subdirectory(state_root, "ci")
            database = directory / "operations.sqlite3"
            local_state.create_private_file(database)
            database.with_name(database.name + "-wal").mkdir()
            with patch.object(ci_lib.sqlite3, "connect", wraps=sqlite3.connect) as connect:
                with self.assertRaises(local_state.LocalStateError):
                    ci_lib.OperationStore(repository, state_root=state_root)
                connect.assert_not_called()

    def test_posix_private_storage_requires_current_effective_owner(self):
        regular = SimpleNamespace(st_mode=stat.S_IFREG | 0o600, st_nlink=1, st_uid=2000)
        directory = SimpleNamespace(st_mode=stat.S_IFDIR | 0o700, st_nlink=1, st_uid=2000)
        with (
            patch.object(local_state.os, "name", "posix"),
            patch.object(local_state.os, "geteuid", return_value=1000, create=True),
        ):
            for info, is_directory in ((regular, False), (directory, True)):
                with self.subTest(directory=is_directory):
                    with patch.object(local_state, "_lstat", return_value=info):
                        self.assertFalse(
                            local_state.storage_is_private(Path("synthetic"), directory=is_directory)
                        )
            owned = SimpleNamespace(st_mode=stat.S_IFREG | 0o600, st_nlink=1, st_uid=1000)
            with patch.object(local_state, "_lstat", return_value=owned):
                self.assertTrue(local_state.storage_is_private(Path("synthetic"), directory=False))


if __name__ == "__main__":
    unittest.main()
