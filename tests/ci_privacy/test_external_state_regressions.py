"""Corrective regressions for protected state outside the Git worktree."""
from __future__ import annotations

import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE / "scripts"))

import codex_local
import ci_lib
import local_state


class ExternalStateRegressions(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
