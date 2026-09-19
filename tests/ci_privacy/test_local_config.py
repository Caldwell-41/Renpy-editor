"""Offline privacy/bootstrap regressions. No live Codex client or credentials."""
from __future__ import annotations

import contextlib
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
import validate


class LocalPrivacyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        (self.root / ".gitignore").write_text(".codex-local/\n.env\n.env.*\n!.env.example\n", encoding="utf-8")
        (self.root / "config").mkdir()
        shutil.copyfile(SOURCE / codex_local.TEMPLATE, self.root / codex_local.TEMPLATE)
        self.context = {"host": "test-host", "user_home": "test-user", "workspace": "test-worktree", "declared_codex_home": None, "launcher_on_path": None}
        self.client_context = "client-a"
        self.git("add", ".gitignore", codex_local.TEMPLATE)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def errors(self):
        errors = []
        with patch.object(validate, "ROOT", self.root):
            validate.check_local_privacy(errors)
        return errors

    def test_first_client_is_private_and_unverified(self):
        path, created = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertTrue(created)
        data = json.loads(path.read_text())
        self.assertFalse(data["automatic_wait_enabled"])
        self.assertTrue(all(value is None for value in data["runtime"].values()))
        self.assertNotIn("thread_id", data)
        self.git("check-ignore", "--quiet", str(path.relative_to(self.root)))
        if os.name != "nt":
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_repeated_setup_preserves_local_values(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "local-test-value"
        path.write_text(json.dumps(data))
        before = path.read_bytes()
        same, created = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertEqual(path, same)
        self.assertFalse(created)
        self.assertEqual(before, same.read_bytes())

    def test_new_client_gets_separate_blank_profile(self):
        first, _ = codex_local.initialise(self.root, self.context, client_context="client-a")
        second, _ = codex_local.initialise(self.root, self.context, client_context="client-b")
        self.assertNotEqual(first, second)
        self.assertNotEqual(json.loads(first.read_text())["client_instance_id"], json.loads(second.read_text())["client_instance_id"])
        self.assertTrue(all(v is None for v in json.loads(second.read_text())["runtime"].values()))

    def test_existing_malformed_profile_not_overwritten(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        path.write_text("not-json")
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertEqual(path.read_text(), "not-json")

    def test_context_mismatch_refused(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        data = json.loads(path.read_text())
        data["bootstrap_context"]["host"] = "changed"
        path.write_text(json.dumps(data))
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)

    def test_missing_ignore_rule_refuses_setup(self):
        (self.root / ".gitignore").write_text("")
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertFalse((self.root / ".codex-local").exists())

    def test_ignored_local_evidence_not_opened_by_validator(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        (self.root / ".env.local").write_bytes(b"\xff")
        path.write_bytes(b"\xff")
        with patch.object(validate, "ROOT", self.root):
            files = validate.repository_files()
            errors = []
            validate.check_text(files, errors)
        self.assertNotIn(path, files)
        self.assertFalse(any(p.name == ".env.local" for p in files))
        self.assertEqual(errors, [])

    def test_force_tracked_local_data_fails_without_echo(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.git("add", "-f", str(path.relative_to(self.root)))
        errors = self.errors()
        self.assertTrue(errors)
        text = " ".join(errors)
        self.assertNotIn(self.context["host"], text)
        self.assertNotIn(path.parent.name, text)
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)

    def test_force_tracked_env_is_rejected_but_example_is_allowed(self):
        (self.root / ".env.example").write_text("EMPTY=\n")
        self.git("add", ".env.example")
        self.assertEqual(self.errors(), [])
        (self.root / ".env.local").write_text("PRIVATE=example\n")
        self.git("add", "-f", ".env.local")
        self.assertTrue(self.errors())

    def test_populated_public_template_fails(self):
        path = self.root / codex_local.TEMPLATE
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "test-private-endpoint"
        path.write_text(json.dumps(data))
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("test-private-endpoint", " ".join(errors))

    def test_staged_populated_template_fails_when_worktree_is_clean(self):
        path = self.root / codex_local.TEMPLATE
        clean = path.read_bytes()
        data = json.loads(clean)
        data["runtime"]["owner_endpoint"] = "staged-private-value"
        path.write_text(json.dumps(data) + "\n", encoding="utf-8")
        self.git("add", codex_local.TEMPLATE)
        path.write_bytes(clean)
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("staged-private-value", " ".join(errors))

    def test_staged_secret_fails_after_worktree_deletion(self):
        path = self.root / "public.md"
        path.write_text("github_pat_" + "A" * 24 + "\n", encoding="utf-8")
        self.git("add", "public.md")
        path.unlink()
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("github_pat_", " ".join(errors))

    def test_blank_staged_template_does_not_hide_dirty_worktree(self):
        path = self.root / codex_local.TEMPLATE
        self.git("add", codex_local.TEMPLATE)
        data = json.loads(path.read_text())
        data["runtime"]["owner_endpoint"] = "working-private-value"
        path.write_text(json.dumps(data) + "\n", encoding="utf-8")
        errors = self.errors()
        self.assertTrue(errors)
        self.assertNotIn("working-private-value", " ".join(errors))

    def test_staged_unsafe_ignore_rule_fails_with_safe_worktree(self):
        path = self.root / ".gitignore"
        safe = path.read_bytes()
        path.write_text(".codex-local/\n!.codex-local/exposed\n.env\n.env.*\n!.env.example\n", encoding="utf-8")
        self.git("add", ".gitignore")
        path.write_bytes(safe)
        errors = self.errors()
        self.assertTrue(any("staged ignore policy" in error for error in errors))

    def test_staged_object_read_failure_is_value_free(self):
        entry = validate.StagedEntry("100644", "a" * 40, 0, b"safe.md")
        failed = subprocess.CompletedProcess([], 1, b"", b"private-git-error")
        with patch.object(validate, "_git", return_value=failed):
            with self.assertRaises(codex_local.LocalConfigError) as caught:
                validate.staged_blob(entry)
        self.assertNotIn("private-git-error", str(caught.exception))

    def test_unmerged_or_disallowed_stage_is_rejected_without_path(self):
        for mode, stage in (("100644", 2), ("120000", 0), ("160000", 0)):
            with self.subTest(mode=mode, stage=stage):
                entry = validate.StagedEntry(mode, "a" * 40, stage, b"private-name")
                with self.assertRaises(codex_local.LocalConfigError) as caught:
                    validate.staged_blob(entry)
                self.assertNotIn("private-name", str(caught.exception))

    def test_actual_profile_destination_must_be_effectively_ignored(self):
        profile = codex_local.profile_path(self.root, self.client_context).relative_to(self.root).as_posix()
        profile_parent = profile.rsplit("/", 1)[0]
        (self.root / ".gitignore").write_text(
            ".codex-local/*\n"
            "!.codex-local/clients/\n"
            ".codex-local/clients/*\n"
            f"!{profile_parent}/\n"
            f"!{profile}\n",
            encoding="utf-8",
        )
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertFalse((self.root / ".codex-local").exists())

    def test_nonignored_existing_private_name_blocks_without_opening_it(self):
        (self.root / ".gitignore").write_text(".codex-local/*\n!.codex-local/exposed\n", encoding="utf-8")
        private = self.root / ".codex-local"
        private.mkdir()
        (private / "exposed").write_bytes(b"\xffprivate")
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)

    def test_permission_refusal_precedes_bootstrap_observation(self):
        with patch.object(codex_local, "storage_is_private", return_value=False), patch.object(
            codex_local, "bootstrap_context", side_effect=AssertionError("must not collect identity")
        ):
            with self.assertRaises(codex_local.LocalConfigError):
                codex_local.initialise(self.root, client_context=self.client_context)

    def test_public_new_files_still_scanned(self):
        (self.root / "new.md").write_text("review me\n")
        with patch.object(validate, "ROOT", self.root):
            self.assertIn(self.root / "new.md", validate.repository_files())

    def test_symlink_private_directory_refused(self):
        target = self.root / "elsewhere"
        target.mkdir()
        try:
            (self.root / ".codex-local").symlink_to(target, target_is_directory=True)
        except OSError:
            self.skipTest("host does not permit test symlinks")
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertEqual(list(target.iterdir()), [])

    def test_linked_template_refused(self):
        template = self.root / codex_local.TEMPLATE
        target = self.root / "other.json"
        template.rename(target)
        try:
            template.symlink_to(target)
        except OSError:
            self.skipTest("host does not permit test symlinks")
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)
        self.assertFalse((self.root / ".codex-local").exists())

    def test_automatic_mode_cannot_be_enabled_by_bootstrap(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        data = json.loads(path.read_text())
        data["automatic_wait_enabled"] = True
        path.write_text(json.dumps(data))
        with self.assertRaises(codex_local.LocalConfigError):
            codex_local.initialise(self.root, self.context, client_context=self.client_context)

    def test_init_output_contains_no_identity(self):
        output = io.StringIO()
        with patch.object(codex_local, "ROOT", self.root), patch.object(codex_local, "bootstrap_context", return_value=self.context), patch.object(sys, "argv", ["codex_local.py", "init", "--client-context", self.client_context]), contextlib.redirect_stdout(output):
            self.assertEqual(codex_local.main(), 0)
        self.assertNotIn(self.context["host"], output.getvalue())
        self.assertNotIn(str(self.root), output.getvalue())
        self.assertEqual(json.loads(output.getvalue())["runtime_binding"], "unverified")

    def test_failure_output_redacts_json_values(self):
        path, _ = codex_local.initialise(self.root, self.context, client_context=self.client_context)
        path.write_text("private-unparseable-data")
        errors = io.StringIO()
        with patch.object(codex_local, "ROOT", self.root), patch.object(codex_local, "bootstrap_context", return_value=self.context), patch.object(sys, "argv", ["codex_local.py", "init", "--client-context", self.client_context]), contextlib.redirect_stderr(errors):
            self.assertEqual(codex_local.main(), 1)
        self.assertNotIn("private-unparseable-data", errors.getvalue())
        self.assertNotIn(str(path), errors.getvalue())


if __name__ == "__main__":
    unittest.main()
