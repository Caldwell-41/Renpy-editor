"""Offline privacy/bootstrap regressions. No live client or credentials."""
from __future__ import annotations

import contextlib
from concurrent.futures import ThreadPoolExecutor
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE / "scripts"))
import codex_local
import local_state
import validate


class LocalPrivacyTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        # macOS exposes its temporary root through /var -> /private/var.  Resolve
        # that system alias so the fixture itself does not simulate a substituted
        # private-state path.
        self.base = Path(self.temporary.name).resolve()
        self.root = self.base / "repository"
        self.state_root = self.base / "application-data" / "private-state"
        self.root.mkdir()
        self.git("init", "-q")
        self.git("config", "user.email", "privacy@example.com")
        self.git("config", "user.name", "Privacy Test")
        (self.root / ".gitignore").write_text(
            ".codex-local/\n.env\n.env.*\n!.env.example\n",
            encoding="utf-8",
        )
        (self.root / "config").mkdir()
        shutil.copyfile(SOURCE / codex_local.TEMPLATE, self.root / codex_local.TEMPLATE)
        self.context = {
            "host": "synthetic-host",
            "user_home": "synthetic-home",
            "workspace": "synthetic-worktree",
            "declared_codex_home": None,
            "launcher_on_path": None,
        }
        self.client_context = "client-a"
        self.git("add", ".gitignore", codex_local.TEMPLATE)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def initialise(self, context=None, **kwargs):
        return codex_local.initialise(
            self.root,
            self.context if context is None else context,
            client_context=kwargs.pop("client_context", self.client_context),
            state_root=self.state_root,
            **kwargs,
        )

    def errors(self):
        errors = []
        with patch.object(validate, "ROOT", self.root):
            validate.check_local_privacy(errors)
        return errors

    def test_first_client_is_external_private_and_unverified(self):
        path, created = self.initialise()
        self.assertTrue(created)
        self.assertTrue(path.is_relative_to(self.state_root))
        self.assertFalse((self.root / ".codex-local").exists())
        data = json.loads(path.read_text())
        self.assertFalse(data["automatic_wait_enabled"])
        self.assertTrue(all(value is None for value in data["runtime"].values()))
        self.assertNotIn("thread_id", data)
        if os.name != "nt":
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_repeated_setup_preserves_local_values(self):
        path, _ = self.initialise()
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "synthetic-local-value"
        path.write_text(json.dumps(data), encoding="utf-8")
        before = path.read_bytes()
        same, created = self.initialise()
        self.assertEqual(path, same)
        self.assertFalse(created)
        self.assertEqual(before, same.read_bytes())

    def test_new_client_gets_separate_blank_profile(self):
        first, _ = self.initialise(client_context="client-a")
        second, _ = self.initialise(client_context="client-b")
        self.assertNotEqual(first, second)
        self.assertNotEqual(
            json.loads(first.read_text())["client_instance_id"],
            json.loads(second.read_text())["client_instance_id"],
        )
        self.assertTrue(all(value is None for value in json.loads(second.read_text())["runtime"].values()))

    def test_concurrent_initialisers_create_once_without_clobber(self):
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: self.initialise(), range(2)))
        self.assertEqual(sorted(created for _, created in results), [False, True])
        self.assertEqual(results[0][0], results[1][0])

    def test_copied_profile_cannot_bind_a_different_context(self):
        first, _ = self.initialise(client_context="client-a")
        copied = codex_local.profile_path(self.state_root, "client-b")
        local_state.ensure_private_subdirectory(
            self.state_root,
            "clients",
            copied.parent.name,
        )
        local_state.create_private_file(copied)
        copied.write_bytes(first.read_bytes())
        before = copied.read_bytes()
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise(client_context="client-b")
        self.assertEqual(copied.read_bytes(), before)

    def test_existing_malformed_profile_is_not_overwritten(self):
        path, _ = self.initialise()
        path.write_text("synthetic-malformed-data", encoding="utf-8")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()
        self.assertEqual(path.read_text(), "synthetic-malformed-data")

    def test_context_mismatch_is_refused(self):
        path, _ = self.initialise()
        data = json.loads(path.read_text())
        data["bootstrap_context"]["host"] = "changed"
        path.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()

    def test_private_state_override_inside_repository_is_refused(self):
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(
                self.root,
                self.context,
                client_context=self.client_context,
                state_root=self.root / "private-state",
            )
        self.assertFalse((self.root / "private-state").exists())

    def test_force_tracked_legacy_data_fails_without_echo(self):
        legacy = self.root / ".codex-local"
        legacy.mkdir()
        private = legacy / "client.json"
        private.write_text("synthetic-private-value", encoding="utf-8")
        self.git("add", "-f", ".codex-local/client.json")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("synthetic-private-value", " ".join(errors))

    def test_force_tracked_env_is_rejected_but_example_is_allowed(self):
        (self.root / ".env.example").write_text("EMPTY=\n", encoding="utf-8")
        self.git("add", ".env.example")
        self.assertEqual(self.errors(), [])
        (self.root / ".env.local").write_text("PRIVATE=synthetic\n", encoding="utf-8")
        self.git("add", "-f", ".env.local")
        self.assertTrue(self.errors())

    def test_populated_public_template_fails_without_creating_state(self):
        path = self.root / codex_local.TEMPLATE
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "synthetic-private-endpoint"
        path.write_text(json.dumps(data), encoding="utf-8")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("synthetic-private-endpoint", " ".join(errors))
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise(context=None)
        self.assertFalse(self.state_root.exists())

    def test_staged_populated_template_fails_when_worktree_is_clean(self):
        path = self.root / codex_local.TEMPLATE
        clean = path.read_bytes()
        data = json.loads(clean)
        data["runtime"]["owner_endpoint"] = "synthetic-staged-private-value"
        path.write_text(json.dumps(data) + "\n", encoding="utf-8")
        self.git("add", codex_local.TEMPLATE)
        path.write_bytes(clean)
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("synthetic-staged-private-value", " ".join(errors))

    def test_staged_secret_fails_after_worktree_deletion(self):
        path = self.root / "public.md"
        path.write_text("github_pat_" + "A" * 24 + "\n", encoding="utf-8")
        self.git("add", "public.md")
        path.unlink()
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("github_pat_", " ".join(errors))

    def test_staged_rename_delete_spaces_and_unicode_are_handled(self):
        original = self.root / "old.md"
        original.write_text("public fixture\n", encoding="utf-8")
        self.git("add", "old.md")
        self.git("commit", "-qm", "public fixture")
        renamed = self.root / "space ü.md"
        self.git("mv", "old.md", renamed.name)
        errors = self.errors()
        self.assertEqual(errors, [])
        renamed.unlink()
        self.git("add", "-u")
        self.assertEqual(self.errors(), [])

    @unittest.skipIf(os.name == "nt", "Git-valid non-UTF-8 path bytes require a POSIX host")
    def test_git_valid_unusual_path_bytes_do_not_break_staged_scan(self):
        raw = os.fsencode(self.root) + b"/odd-\xff.md"
        try:
            descriptor = os.open(raw, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except OSError:
            self.skipTest("host filesystem does not permit the raw byte filename")
        with os.fdopen(descriptor, "wb") as output:
            output.write(b"public fixture\n")
        subprocess.run([b"git", b"add", b"odd-\xff.md"], cwd=os.fsencode(self.root), check=True)
        self.assertEqual(self.errors(), [])

    def test_blank_staged_template_does_not_hide_dirty_worktree(self):
        path = self.root / codex_local.TEMPLATE
        self.git("add", codex_local.TEMPLATE)
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "synthetic-working-private-value"
        path.write_text(json.dumps(data) + "\n", encoding="utf-8")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("synthetic-working-private-value", " ".join(errors))

    def test_staged_object_read_failure_is_value_free(self):
        entry = validate.StagedEntry("100644", "a" * 40, 0, b"safe.md")
        failed = subprocess.CompletedProcess([], 1, b"", b"synthetic-private-git-error")
        with patch.object(validate, "_git", return_value=failed):
            with self.assertRaises(codex_local.LocalConfigError) as caught:
                validate.staged_blob(entry)
        self.assertNotIn("synthetic-private-git-error", str(caught.exception))

    def test_unmerged_or_disallowed_stage_is_rejected_without_path(self):
        for mode, stage in (("100644", 2), ("120000", 0), ("160000", 0)):
            with self.subTest(mode=mode, stage=stage):
                entry = validate.StagedEntry(mode, "a" * 40, stage, b"synthetic-private-name")
                with self.assertRaises(codex_local.LocalConfigError) as caught:
                    validate.staged_blob(entry)
                self.assertNotIn("synthetic-private-name", str(caught.exception))

    def test_nonignored_existing_legacy_name_blocks_validator_without_reading(self):
        (self.root / ".gitignore").write_text("", encoding="utf-8")
        legacy = self.root / ".codex-local"
        legacy.mkdir()
        private_name = "synthetic-private-filename"
        (legacy / private_name).write_bytes(b"\xffsynthetic-private")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn(private_name, " ".join(errors))

    def test_copied_runtime_database_is_rejected_without_reading(self):
        copied = self.root / "operations.sqlite3"
        copied.write_bytes(b"\xffsynthetic-private-runtime")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("synthetic-private-runtime", " ".join(errors))

    def test_permission_refusal_precedes_bootstrap_observation(self):
        with patch.object(
            codex_local,
            "ensure_private_subdirectory",
            side_effect=codex_local.LocalConfigError("synthetic refusal"),
        ), patch.object(
            codex_local,
            "bootstrap_context",
            side_effect=AssertionError("must not collect identity"),
        ):
            with self.assertRaises(codex_local.LocalConfigError):
                codex_local.initialise(
                    self.root,
                    client_context=self.client_context,
                    state_root=self.state_root,
                )

    def test_public_new_files_are_still_scanned(self):
        (self.root / "new.md").write_text("review me\n", encoding="utf-8")
        with patch.object(validate, "ROOT", self.root):
            self.assertIn(self.root / "new.md", validate.repository_files())

    def test_validator_detects_index_change_during_run(self):
        errors = io.StringIO()
        with patch.object(validate, "check_local_privacy", return_value=b"first"), patch.object(
            validate,
            "repository_files",
            return_value=[],
        ), patch.object(validate, "check_required"), patch.object(
            validate,
            "check_text",
        ), patch.object(validate, "check_markdown_links"), patch.object(
            validate,
            "check_git_diff",
        ), patch.object(
            validate,
            "staged_entries",
            return_value=(b"second", []),
        ), contextlib.redirect_stderr(errors):
            self.assertEqual(validate.main(), 1)
        self.assertIn("index changed", errors.getvalue())

    def test_symlink_external_state_root_is_refused(self):
        target = self.base / "elsewhere"
        target.mkdir()
        self.state_root.parent.mkdir()
        try:
            self.state_root.symlink_to(target, target_is_directory=True)
        except OSError:
            self.skipTest("host does not permit test symlinks")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()
        self.assertEqual(list(target.iterdir()), [])

    def test_linked_template_is_refused(self):
        template = self.root / codex_local.TEMPLATE
        target = self.root / "other.json"
        template.rename(target)
        try:
            template.symlink_to(target)
        except OSError:
            self.skipTest("host does not permit test symlinks")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()
        self.assertFalse(self.state_root.exists())

    def test_hardlinked_private_profile_is_refused(self):
        path, _ = self.initialise()
        alias = path.with_name("alias.json")
        try:
            os.link(path, alias)
        except OSError:
            self.skipTest("host does not permit hard links")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()

    def test_automatic_mode_cannot_be_enabled_by_bootstrap(self):
        path, _ = self.initialise()
        data = json.loads(path.read_text())
        data["automatic_wait_enabled"] = True
        path.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaises(codex_local.LocalConfigError):
            self.initialise()

    def test_windows_acl_result_controls_private_classification(self):
        file_path = self.root / "synthetic.bin"
        file_path.write_bytes(b"x")
        with patch.object(local_state.os, "name", "nt"), patch.object(
            local_state,
            "_windows_acl_private",
            return_value=True,
        ):
            self.assertTrue(local_state.storage_is_private(file_path, directory=False))
        with patch.object(local_state.os, "name", "nt"), patch.object(
            local_state,
            "_windows_acl_private",
            return_value=False,
        ):
            self.assertFalse(local_state.storage_is_private(file_path, directory=False))

    def test_init_output_contains_no_identity_or_path(self):
        output = io.StringIO()
        with patch.object(codex_local, "ROOT", self.root), patch.object(
            codex_local,
            "application_state_root",
            return_value=self.state_root,
        ), patch.object(
            codex_local,
            "bootstrap_context",
            return_value=self.context,
        ), patch.object(
            sys,
            "argv",
            ["codex_local.py", "init", "--client-context", self.client_context],
        ), contextlib.redirect_stdout(output):
            self.assertEqual(codex_local.main(), 0)
        self.assertNotIn(self.context["host"], output.getvalue())
        self.assertNotIn(str(self.root), output.getvalue())
        self.assertNotIn(str(self.state_root), output.getvalue())
        self.assertEqual(json.loads(output.getvalue())["runtime_binding"], "unverified")

    def test_failure_output_withholds_profile_values(self):
        path, _ = self.initialise()
        path.write_text("synthetic-unparseable-private-data", encoding="utf-8")
        errors = io.StringIO()
        with patch.object(codex_local, "ROOT", self.root), patch.object(
            codex_local,
            "application_state_root",
            return_value=self.state_root,
        ), patch.object(
            codex_local,
            "bootstrap_context",
            return_value=self.context,
        ), patch.object(
            sys,
            "argv",
            ["codex_local.py", "init", "--client-context", self.client_context],
        ), contextlib.redirect_stderr(errors):
            self.assertEqual(codex_local.main(), 1)
        self.assertNotIn("synthetic-unparseable-private-data", errors.getvalue())
        self.assertNotIn(str(path), errors.getvalue())


if __name__ == "__main__":
    unittest.main()
