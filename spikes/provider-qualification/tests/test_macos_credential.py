import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import macos_credential as cred
from contract import Refused


class FakeStore:
    def __init__(self):
        self.entries = {}
        self.fail = False

    def add(self, account, key):
        self.entries[account] = key

    def read(self, account):
        return "different" if self.fail else self.entries.get(account)

    def delete(self, account):
        self.entries.pop(account, None)


class QualificationCredentialTests(unittest.TestCase):
    def test_owned_nonsecret_identity_is_saved_before_store_add(self):
        store = FakeStore()
        add = store.add
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            pending = cred.REFERENCE.with_suffix(".pending")

            def add_after_staging(account, key):
                ref = json.loads(pending.read_text())
                self.assertEqual(cred.account_for(ref), account)
                self.assertNotIn(key, pending.read_text())
                self.assertFalse(cred.REFERENCE.exists())
                add(account, key)

            with patch.object(store, "add", side_effect=add_after_staging):
                cred.qualification_key(lambda: "fixture-key", store)
            self.assertTrue(cred.REFERENCE.exists())
            self.assertFalse(pending.exists())

    def test_staging_failure_precedes_any_store_access(self):
        store = Mock()
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"), \
                patch.object(Path, "open", side_effect=OSError("private synthetic failure")):
            with self.assertRaisesRegex(Refused, "^credential_reference_stage_unavailable$"):
                cred.qualification_key(lambda: "fixture-key", store)
        store.add.assert_not_called()
        store.read.assert_not_called()
        store.delete.assert_not_called()

    def test_publish_failure_keeps_primary_category_after_successful_cleanup(self):
        store = FakeStore()
        store.entries["unrelated"] = "retain"
        delete = store.delete
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            pending = cred.REFERENCE.with_suffix(".pending")

            def delete_before_record_removal(account):
                self.assertEqual(cred.account_for(json.loads(pending.read_text())), account)
                delete(account)

            with patch.object(Path, "replace", side_effect=OSError("private synthetic failure")), \
                    patch.object(store, "delete", side_effect=delete_before_record_removal), \
                    self.assertRaises(cred.CredentialSetupFailure) as failure:
                cred.qualification_key(lambda: "fixture-key", store)
            self.assertEqual(str(failure.exception), "credential_reference_publish_unavailable")
            self.assertFalse(failure.exception.cleanup_pending)
            self.assertFalse(cred.REFERENCE.exists() or pending.exists())
            self.assertEqual(store.entries, {"unrelated": "retain"})

    def test_failed_publish_and_delete_retains_owned_recovery_and_blocks_reentry(self):
        store, enter = FakeStore(), Mock(return_value="fixture-key")
        store.entries["unrelated"] = "retain"
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            pending = cred.REFERENCE.with_suffix(".pending")
            with patch.object(Path, "replace", side_effect=OSError("private synthetic failure")), \
                    patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                    self.assertRaises(cred.CredentialSetupFailure) as failure:
                cred.qualification_key(enter, store)
            self.assertEqual(str(failure.exception), "credential_reference_publish_unavailable")
            self.assertTrue(failure.exception.cleanup_pending)
            self.assertFalse(cred.REFERENCE.exists())
            owned = cred.account_for(json.loads(pending.read_text()))
            self.assertEqual(store.entries, {"unrelated": "retain", owned: "fixture-key"})
            self.assertNotIn("fixture-key", pending.read_text())
            with patch.object(store, "read") as read, patch.object(store, "add") as add, \
                    patch.object(store, "delete") as delete, \
                    self.assertRaisesRegex(Refused, "^credential_cleanup_pending$"):
                cred.qualification_key(enter, store)
            read.assert_not_called()
            add.assert_not_called()
            delete.assert_not_called()
            enter.assert_called_once()
            with patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")) as delete, \
                    self.assertRaisesRegex(Refused, "^credential_store_cleanup_unavailable$"):
                cred.cleanup_pending(store)
            delete.assert_called_once_with(owned)
            self.assertTrue(pending.exists())
            self.assertTrue(cred.cleanup_pending(store))
            self.assertFalse(pending.exists())
            self.assertEqual(store.entries, {"unrelated": "retain"})
            self.assertFalse(cred.cleanup_pending(store))
            self.assertEqual(cred.qualification_key(enter, store), "fixture-key")
            self.assertEqual(enter.call_count, 2)  # Entry resumes only after explicit cleanup.

    def test_verification_failure_keeps_primary_category_when_delete_fails(self):
        store = FakeStore()
        store.fail = True
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"), \
                patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                self.assertRaises(cred.CredentialSetupFailure) as failure:
            cred.qualification_key(lambda: "fixture-key", store)
        self.assertEqual(str(failure.exception), "credential_store_roundtrip_failed")
        self.assertTrue(failure.exception.cleanup_pending)

    def test_unavailable_store_preserves_owned_record_and_primary_category(self):
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            with patch.object(cred, "Keychain", side_effect=Refused("credential_store_unavailable")), \
                    self.assertRaises(cred.CredentialSetupFailure) as failure:
                cred.qualification_key(lambda: "fixture-key")
            self.assertEqual(str(failure.exception), "credential_store_unavailable")
            self.assertTrue(failure.exception.cleanup_pending)
            pending = cred.REFERENCE.with_suffix(".pending")
            cred.account_for(json.loads(pending.read_text()))
            self.assertNotIn("fixture-key", pending.read_text())
            self.assertFalse(cred.REFERENCE.exists())

    def test_store_read_failure_is_not_replaced_by_cleanup_error(self):
        store = FakeStore()
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            with patch.object(store, "read", side_effect=Refused("credential_store_read_unavailable")), \
                    patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                    self.assertRaises(cred.CredentialSetupFailure) as failure:
                cred.qualification_key(lambda: "fixture-key", store)
            self.assertEqual(str(failure.exception), "credential_store_read_unavailable")
            self.assertTrue(failure.exception.cleanup_pending)
            account = cred.account_for(json.loads(cred.REFERENCE.with_suffix(".pending").read_text()))
            self.assertEqual(store.entries, {account: "fixture-key"})
            self.assertFalse(cred.REFERENCE.exists())

    def test_unexpected_store_initialization_error_does_not_escape_cleanup_boundary(self):
        store = FakeStore()
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            with patch.object(Path, "replace", side_effect=OSError("synthetic")), \
                    patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                    self.assertRaises(cred.CredentialSetupFailure):
                cred.qualification_key(lambda: "fixture-key", store)
            pending = cred.REFERENCE.with_suffix(".pending")
            original = pending.read_bytes()
            with patch.object(cred, "Keychain", side_effect=OSError("private synthetic failure")), \
                    self.assertRaisesRegex(Refused, "^credential_store_cleanup_unavailable$"):
                cred.cleanup_pending()
            self.assertEqual(pending.read_bytes(), original)
            self.assertEqual(len(store.entries), 1)

    def test_unexpected_store_read_error_refuses_without_reentry_or_reference_change(self):
        store, enter = FakeStore(), Mock(return_value="fixture-key")
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            cred.qualification_key(enter, store)
            original = cred.REFERENCE.read_bytes()
            with patch.object(cred, "Keychain", side_effect=OSError("private synthetic failure")), \
                    self.assertRaisesRegex(Refused, "^credential_store_read_unavailable$"):
                cred.qualification_key(enter)
            with patch.object(store, "read", side_effect=TypeError("private synthetic failure")), \
                    self.assertRaisesRegex(Refused, "^credential_store_read_unavailable$"):
                cred.qualification_key(enter, store)
            self.assertEqual(cred.REFERENCE.read_bytes(), original)
            enter.assert_called_once()

    def test_cleanup_refuses_foreign_malformed_or_conflicting_reference_before_native_access(self):
        for mode in ("foreign", "malformed", "conflict"):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as d, \
                    patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
                store = FakeStore()
                with patch.object(Path, "replace", side_effect=OSError("synthetic")), \
                        patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                        self.assertRaises(cred.CredentialSetupFailure):
                    cred.qualification_key(lambda: "fixture-key", store)
                pending = cred.REFERENCE.with_suffix(".pending")
                original = pending.read_text()
                if mode == "foreign":
                    ref = json.loads(original)
                    ref["origin"] = "https://example.invalid"
                    pending.write_text(json.dumps(ref))
                elif mode == "malformed":
                    pending.write_text("{not valid JSON}")
                else:
                    cred.REFERENCE.write_text(original)
                with patch.object(cred, "Keychain") as native, patch.object(store, "delete") as delete:
                    with self.assertRaises(Refused):
                        cred.cleanup_pending(store)
                    with self.assertRaisesRegex(Refused, "^credential_cleanup_pending$"):
                        cred.qualification_key(Mock())
                native.assert_not_called()
                delete.assert_not_called()
                self.assertTrue(pending.exists())

    def test_cleanup_record_removal_failure_remains_pending_for_one_explicit_retry(self):
        store = FakeStore()
        store.entries["unrelated"] = "retain"
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            with patch.object(Path, "replace", side_effect=OSError("synthetic")), \
                    patch.object(store, "delete", side_effect=Refused("credential_store_cleanup_unavailable")), \
                    self.assertRaises(cred.CredentialSetupFailure):
                cred.qualification_key(lambda: "fixture-key", store)
            pending = cred.REFERENCE.with_suffix(".pending")
            with patch.object(Path, "unlink", side_effect=OSError("private synthetic failure")), \
                    self.assertRaisesRegex(Refused, "^credential_cleanup_reference_unavailable$"):
                cred.cleanup_pending(store)
            self.assertEqual(store.entries, {"unrelated": "retain"})
            self.assertTrue(pending.exists())
            self.assertTrue(cred.cleanup_pending(store))
            self.assertFalse(pending.exists())

    def test_second_process_reuses_key_without_native_entry_and_manifest_has_no_key(self):
        store, enter = FakeStore(), Mock(return_value="synthetic-fixture-key")
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            self.assertEqual(cred.qualification_key(enter, store), "synthetic-fixture-key")
            self.assertNotIn("synthetic-fixture-key", cred.REFERENCE.read_text())
            self.assertEqual(cred.qualification_key(enter, store), "synthetic-fixture-key")
            enter.assert_called_once()

    def test_failed_store_verification_removes_only_staged_entry_and_publishes_nothing(self):
        store = FakeStore()
        store.entries["unrelated"] = "retain"
        store.fail = True
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            with self.assertRaises(Refused):
                cred.qualification_key(lambda: "fixture-key", store)
            self.assertEqual(store.entries, {"unrelated": "retain"})
            self.assertFalse(cred.REFERENCE.exists())

    def test_missing_remembered_key_does_not_silently_prompt_again(self):
        store, enter = FakeStore(), Mock(return_value="fixture-key")
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            cred.qualification_key(enter, store)
            store.entries.clear()
            with self.assertRaises(Refused):
                cred.qualification_key(enter, store)
            enter.assert_called_once()

    def test_foreign_origin_reference_refuses_before_credential_read_or_entry(self):
        store, enter = FakeStore(), Mock(return_value="fixture-key")
        with tempfile.TemporaryDirectory() as d, patch.object(cred, "REFERENCE", Path(d)/"reference.json"):
            cred.qualification_key(enter, store)
            ref = json.loads(cred.REFERENCE.read_text())
            ref["origin"] = "https://example.invalid"
            cred.REFERENCE.write_text(json.dumps(ref))
            with patch.object(store, "read") as read, self.assertRaises(Refused):
                cred.qualification_key(enter, store)
            read.assert_not_called()
            enter.assert_called_once()


if __name__ == "__main__":
    unittest.main()
