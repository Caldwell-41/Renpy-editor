use super::*;
use crate::{
    ai_credentials::{self as lifecycle, Records, SaveOutcome},
    ai_profiles::*,
    lifecycle::LifecycleService,
};
use std::{cell::Cell, fs};
struct Fixture {
    dir: tempfile::TempDir,
    records: LifecycleService,
}
impl Fixture {
    fn new() -> Self {
        let dir = tempfile::tempdir().unwrap();
        let records = LifecycleService::new(dir.path().to_owned()).unwrap();
        Self { dir, records }
    }
    fn secrets(&self) -> FileSecrets {
        FileSecrets::open(self.dir.path()).unwrap()
    }
    fn snapshot(&self) -> ProfileStore {
        self.records.read().unwrap()
    }
    fn profile(&self, label: &str) -> String {
        lifecycle::save(
            &self.records,
            &lifecycle::token(&self.snapshot()),
            None,
            StudioSettings {
                label: label.into(),
                endpoint: "http://127.0.0.1:8888/v1".into(),
                model: "synthetic".into(),
                private_http: false,
                context_ceiling: 8192,
                context_budget: 4096,
                maximum_response: 1024,
            },
        )
        .unwrap();
        self.snapshot().profiles.last().unwrap().profile_id.clone()
    }
    fn save(&self, id: &str, key: &str) -> lifecycle::Result<SaveOutcome> {
        lifecycle::replace(
            &self.records,
            &self.secrets(),
            &lifecycle::token(&self.snapshot()),
            id,
            key,
        )
    }
    fn credential(&self, id: &str) -> OwnedCredential {
        self.snapshot()
            .profiles
            .iter()
            .find(|p| p.profile_id == id)
            .unwrap()
            .credential
            .clone()
            .unwrap()
    }
    fn key_path(&self, c: &OwnedCredential) -> std::path::PathBuf {
        self.dir
            .path()
            .join("credentials-dev/generations")
            .join(c.storage.generation().unwrap())
            .join("master.key")
    }
    fn record_path(&self, c: &OwnedCredential) -> std::path::PathBuf {
        self.key_path(c)
            .parent()
            .unwrap()
            .join("records")
            .join(format!("{}.sealed", c.credential_id))
    }
}
#[test]
fn key_and_record_size_boundaries_reject_before_switching_and_preserve_originals() {
    let f = Fixture::new();
    let id = f.profile("bounds");
    for length in [1, 4096] {
        let value = "x".repeat(length);
        assert_eq!(f.save(&id, &value), Ok(SaveOutcome::Saved));
        let credential = f.credential(&id);
        assert_eq!(
            fs::metadata(f.record_path(&credential)).unwrap().len(),
            (46 + length) as u64
        );
        assert_eq!(
            f.secrets().read(&id, &credential).unwrap().as_deref(),
            Some(value.as_str())
        );
    }
    let before = f.snapshot();
    let credential = f.credential(&id);
    let path = f.record_path(&credential);
    let original = fs::read(&path).unwrap();
    for invalid in [
        String::new(),
        "x".repeat(4097),
        "space key".into(),
        "non-ascii-\u{e9}".into(),
    ] {
        assert!(f.save(&id, &invalid).is_err());
        assert_eq!(f.snapshot(), before);
        assert_eq!(fs::read(&path).unwrap(), original);
    }
    for length in [46, MAX_RECORD + 1] {
        let mut malformed = vec![0; length];
        malformed[..5].copy_from_slice(RECORD_MAGIC);
        malformed[5] = VERSION;
        fs::write(&path, &malformed).unwrap();
        assert!(matches!(f.secrets().read(&id, &credential), Err(RECOVERY)));
        assert_eq!(f.secrets().delete(&id, &credential), Err(RECOVERY));
        assert_eq!(fs::read(&path).unwrap(), malformed);
        assert_eq!(f.snapshot(), before);
    }
}
#[test]
fn explicit_save_reopens_independent_store_with_private_files_and_fresh_nonces() {
    let f = Fixture::new();
    let id = f.profile("alpha");
    assert_eq!(
        f.save(&id, "public-synthetic-alpha"),
        Ok(SaveOutcome::Saved)
    );
    let c = f.credential(&id);
    let bytes = fs::read(f.record_path(&c)).unwrap();
    assert!(!bytes.windows(22).any(|w| w == b"public-synthetic-alpha"));
    let metadata = f.snapshot();
    assert_eq!(metadata.schema_version, 2);
    assert!(metadata.valid());
    assert!(!serde_json::to_string(&metadata)
        .unwrap()
        .contains("public-synthetic-alpha"));
    let reopened = LifecycleService::new(f.dir.path().to_owned()).unwrap();
    assert_eq!(reopened.read().unwrap(), metadata);
    for _ in 0..3 {
        assert_eq!(
            FileSecrets::open(f.dir.path())
                .unwrap()
                .read(&id, &c)
                .unwrap()
                .as_deref(),
            Some("public-synthetic-alpha")
        );
    }
    assert_eq!(
        f.save(&id, "public-synthetic-alpha"),
        Ok(SaveOutcome::Saved)
    );
    let next = f.credential(&id);
    assert_eq!(next.storage, c.storage);
    assert_ne!(
        &bytes[6..30],
        &fs::read(f.record_path(&next)).unwrap()[6..30]
    );
    assert!(!f.record_path(&c).exists());
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        for p in [f.key_path(&next), f.record_path(&next)] {
            assert_eq!(
                fs::metadata(p).unwrap().permissions().mode() & 0o7777,
                0o600
            );
        }
        for p in [
            f.key_path(&next).parent().unwrap().to_owned(),
            f.record_path(&next).parent().unwrap().to_owned(),
            f.dir.path().join("credentials-dev"),
            f.dir.path().join("credentials-dev/generations"),
        ] {
            assert_eq!(
                fs::metadata(p).unwrap().permissions().mode() & 0o7777,
                0o700
            );
        }
    }
}
#[test]
fn inspection_retry_and_native_cleanup_are_read_only_and_deferred() {
    let f = Fixture::new();
    let id = f.profile("legacy");
    let before = f.snapshot();
    let mut legacy = before.clone();
    legacy.profiles[0].credential = Some(OwnedCredential {
        credential_id: uuid::Uuid::new_v4().to_string(),
        origin: "http://127.0.0.1:8888".into(),
        revision: 1,
        service: CredentialService::Legacy,
        storage: CredentialStorage::Native,
    });
    legacy.profiles[0].revision += 1;
    legacy.revision += 1;
    f.records.write(&legacy, &before).unwrap();
    let native = f.credential(&id);
    for _ in 0..3 {
        assert_eq!(
            f.secrets().status(&id, &native),
            (CredentialStatus::Deferred, Some(DEFERRED))
        );
        assert_eq!(f.secrets().delete(&id, &native), Err(DEFERRED));
    }
    assert!(!f.dir.path().join("credentials-dev").exists());
    assert_eq!(f.snapshot(), legacy);
    assert_eq!(
        f.save(&id, "public-file-key"),
        Ok(SaveOutcome::SavedCleanupPending)
    );
    assert_eq!(f.snapshot().cleanup[0].credential, native);
    assert_eq!(
        lifecycle::remove(
            &f.records,
            &f.secrets(),
            &lifecycle::token(&f.snapshot()),
            &id,
            true
        ),
        Ok(SaveOutcome::SavedCleanupPending)
    );
    let after = f.snapshot();
    assert!(after.profiles.is_empty());
    assert_eq!(after.cleanup.len(), 1);
    assert_eq!(after.cleanup[0].credential, native);
    assert_eq!(
        LifecycleService::new(f.dir.path().to_owned())
            .unwrap()
            .read()
            .unwrap(),
        after
    );
}
#[test]
fn key_loss_recovers_one_profile_and_preserves_generations_settings_and_other_profiles() {
    let f = Fixture::new();
    let a = f.profile("a");
    let b = f.profile("b");
    f.save(&a, "synthetic-a").unwrap();
    f.save(&b, "synthetic-b").unwrap();
    let old_a = f.credential(&a);
    let old_b = f.credential(&b);
    let bytes = fs::read(f.record_path(&old_a)).unwrap();
    let settings = f.snapshot().profiles[0].settings.clone();
    fs::remove_file(f.key_path(&old_a)).unwrap();
    for _ in 0..2 {
        assert_eq!(
            f.secrets().status(&a, &old_a),
            (CredentialStatus::Recovery, Some(KEY_LOST))
        );
    }
    assert!(!f.key_path(&old_a).exists());
    assert_eq!(
        f.save(&a, "synthetic-recovered-a"),
        Ok(SaveOutcome::SavedCleanupPending)
    );
    let recovered = f.credential(&a);
    assert_ne!(recovered.storage, old_a.storage);
    assert_eq!(fs::read(f.record_path(&old_a)).unwrap(), bytes);
    assert!(!f.key_path(&old_a).exists());
    assert_eq!(f.credential(&b), old_b);
    assert_eq!(f.snapshot().profiles[0].settings, settings);
    assert!(f.snapshot().cleanup.iter().any(|c| c.credential == old_a));
    assert_eq!(
        f.secrets().read(&a, &recovered).unwrap().as_deref(),
        Some("synthetic-recovered-a")
    );
    assert!(matches!(f.secrets().read(&b, &old_b), Err(KEY_LOST)));
    f.save(&b, "synthetic-recovered-b").unwrap();
    assert_eq!(f.credential(&b).storage, recovered.storage);
    assert_eq!(f.snapshot().development_generations.len(), 2);
}
#[test]
fn missing_record_uses_healthy_generation_and_auth_failure_uses_new_generation() {
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-a").unwrap();
    let c = f.credential(&id);
    fs::remove_file(f.record_path(&c)).unwrap();
    assert_eq!(
        f.secrets().status(&id, &c),
        (CredentialStatus::Missing, Some(RECOVERY))
    );
    f.save(&id, "synthetic-b").unwrap();
    let b = f.credential(&id);
    assert_eq!(c.storage, b.storage);
    let path = f.record_path(&b);
    let mut tampered = fs::read(&path).unwrap();
    *tampered.last_mut().unwrap() ^= 1;
    fs::write(&path, &tampered).unwrap();
    assert!(matches!(f.secrets().read(&id, &b), Err(AUTH_FAILED)));
    assert_eq!(
        f.save(&id, "synthetic-c"),
        Ok(SaveOutcome::SavedCleanupPending)
    );
    assert_ne!(f.credential(&id).storage, b.storage);
    assert_eq!(fs::read(path).unwrap(), tampered);
}
#[test]
fn authenticated_metadata_rejects_wrong_profile_origin_revision_id_and_generation() {
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-a").unwrap();
    let c = f.credential(&id);
    assert!(matches!(
        f.secrets().read(&uuid::Uuid::new_v4().to_string(), &c),
        Err(AUTH_FAILED)
    ));
    let mut wrong = c.clone();
    wrong.origin = "http://127.0.0.1:9999".into();
    assert!(matches!(f.secrets().read(&id, &wrong), Err(AUTH_FAILED)));
    wrong = c.clone();
    wrong.revision += 1;
    assert!(matches!(f.secrets().read(&id, &wrong), Err(AUTH_FAILED)));
    wrong = c.clone();
    wrong.credential_id = uuid::Uuid::new_v4().to_string();
    fs::copy(f.record_path(&c), f.record_path(&wrong)).unwrap();
    assert!(matches!(f.secrets().read(&id, &wrong), Err(AUTH_FAILED)));
    let other = uuid::Uuid::new_v4().to_string();
    wrong = c.clone();
    wrong.storage = CredentialStorage::DevelopmentFile {
        generation_id: other,
    };
    f.secrets().prepare_generation(&wrong, true).unwrap();
    let dir = f.key_path(&wrong).parent().unwrap().join("records");
    fs::create_dir(&dir).unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o700)).unwrap();
    }
    fs::copy(f.key_path(&c), f.key_path(&wrong)).unwrap();
    fs::copy(f.record_path(&c), f.record_path(&wrong)).unwrap();
    assert!(matches!(f.secrets().read(&id, &wrong), Err(AUTH_FAILED)));
}
#[test]
fn unsupported_formats_size_limits_and_permissions_are_retained_and_refused() {
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-a").unwrap();
    let c = f.credential(&id);
    let baseline = f.snapshot();
    for path in [f.key_path(&c), f.record_path(&c)] {
        let original = fs::read(&path).unwrap();
        let mut future = original.clone();
        future[5] = 2;
        fs::write(&path, &future).unwrap();
        assert!(matches!(f.secrets().read(&id, &c), Err(NEWER)));
        assert_eq!(f.save(&id, "synthetic-replacement"), Err(NEWER));
        assert_eq!(fs::read(&path).unwrap(), future);
        assert_eq!(f.snapshot(), baseline);
        fs::write(path, original).unwrap();
    }
    let mut oversized_future = vec![0; MAX_RECORD + 1];
    oversized_future[..5].copy_from_slice(RECORD_MAGIC);
    oversized_future[5] = 2;
    fs::write(f.record_path(&c), &oversized_future).unwrap();
    assert!(matches!(f.secrets().read(&id, &c), Err(NEWER)));
    assert_eq!(f.save(&id, "synthetic-replacement"), Err(NEWER));
    assert_eq!(f.snapshot(), baseline);
    fs::write(f.record_path(&c), vec![0; MAX_RECORD + 1]).unwrap();
    assert!(matches!(f.secrets().read(&id, &c), Err(RECOVERY)));
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(f.key_path(&c), fs::Permissions::from_mode(0o644)).unwrap();
        assert!(matches!(f.secrets().read(&id, &c), Err(ACCESS)));
    }
}
#[cfg(unix)]
#[test]
fn unsupported_links_and_nonregular_entries_never_get_followed_or_replaced() {
    use std::os::unix::fs::symlink;
    let f = Fixture::new();
    let id = f.profile("a");
    let outside = f.dir.path().join("outside");
    fs::create_dir(&outside).unwrap();
    symlink(&outside, f.dir.path().join("credentials-dev")).unwrap();
    assert_eq!(f.save(&id, "synthetic-a"), Err(ACCESS));
    assert!(fs::read_dir(&outside).unwrap().next().is_none());
    assert!(f.snapshot().profiles[0].credential.is_none());
    fs::remove_file(f.dir.path().join("credentials-dev")).unwrap();
    f.save(&id, "synthetic-a").unwrap();
    let c = f.credential(&id);
    fs::remove_file(f.record_path(&c)).unwrap();
    fs::create_dir(f.record_path(&c)).unwrap();
    assert!(matches!(f.secrets().read(&id, &c), Err(ACCESS)));
    assert_eq!(f.secrets().delete(&id, &c), Err(ACCESS));
    assert!(f.record_path(&c).is_dir());
}
struct Failing<'a> {
    records: &'a LifecycleService,
    writes: Cell<usize>,
    fail: usize,
    published: bool,
    unreadable: Cell<bool>,
}
impl Records for Failing<'_> {
    fn read(&self) -> lifecycle::Result<ProfileStore> {
        if self.unreadable.get() {
            Err("injected read failure")
        } else {
            self.records.read()
        }
    }
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> lifecycle::Result<()> {
        self.writes.set(self.writes.get() + 1);
        if self.writes.get() == self.fail {
            if self.published {
                self.records.write(next, old)?;
                self.unreadable.set(true);
            }
            Err("injected publication failure")
        } else {
            self.records.write(next, old)
        }
    }
}
#[test]
fn stage_switch_and_uncertain_publication_preserve_owned_state_and_reconcile_without_replay() {
    for fail in [1, 2] {
        let f = Fixture::new();
        let id = f.profile("a");
        f.save(&id, "synthetic-old").unwrap();
        let old = f.snapshot();
        let records = Failing {
            records: &f.records,
            writes: Cell::new(0),
            fail,
            published: false,
            unreadable: Cell::new(false),
        };
        assert!(lifecycle::replace(
            &records,
            &f.secrets(),
            &lifecycle::token(&old),
            &id,
            "synthetic-new"
        )
        .is_err());
        assert_eq!(
            f.credential(&id),
            old.profiles[0].credential.clone().unwrap()
        );
        assert!(f.snapshot().valid());
        assert_eq!(
            f.secrets()
                .read(&id, &f.credential(&id))
                .unwrap()
                .as_deref(),
            Some("synthetic-old")
        );
    }
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-old").unwrap();
    let before = f.snapshot();
    let old = f.credential(&id);
    let records = Failing {
        records: &f.records,
        writes: Cell::new(0),
        fail: 2,
        published: true,
        unreadable: Cell::new(false),
    };
    let mut entry =
        lifecycle::CredentialEntry::new(&before, &lifecycle::token(&before), &id).unwrap();
    assert_eq!(
        entry.save(&records, &f.secrets(), "synthetic-new"),
        Err(lifecycle::UNCERTAIN_SAVE)
    );
    assert!(f.record_path(&old).exists());
    let candidate = f.credential(&id);
    records.unreadable.set(false);
    assert_eq!(
        entry.save(&records, &f.secrets(), "synthetic-new"),
        Ok(SaveOutcome::SavedCleanupPending)
    );
    assert_eq!(records.writes.get(), 2);
    assert_eq!(f.credential(&id), candidate); // no replay
}
#[test]
fn unwritable_record_destination_retains_previous_profile_and_all_generation_ownership() {
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-old").unwrap();
    let old = f.credential(&id);
    let records_dir = f.record_path(&old).parent().unwrap().to_owned();
    fs::rename(&records_dir, records_dir.with_extension("retained")).unwrap();
    fs::write(&records_dir, b"blocked").unwrap();
    assert!(f.save(&id, "synthetic-new").is_err());
    assert_eq!(f.credential(&id), old);
    assert!(f.snapshot().valid());
    assert!(f
        .snapshot()
        .development_generations
        .contains(&old.storage.generation().unwrap().to_owned()));
}

#[test]
fn ordinary_write_flush_and_publication_faults_never_switch_unverified_references() {
    for kind in ["key", "record"] {
        for stage in ["write", "flush", "publish", "after_publish"] {
            let f = Fixture::new();
            let id = f.profile("a");
            let before = f.snapshot();
            let secrets = f.secrets();
            secrets.fault.set(Some((kind, stage)));
            assert!(
                lifecycle::replace(
                    &f.records,
                    &secrets,
                    &lifecycle::token(&before),
                    &id,
                    "public-synthetic-fault"
                )
                .is_err(),
                "{kind}/{stage}"
            );
            let actual = f.snapshot();
            assert!(actual.valid());
            assert_eq!(actual.profiles, before.profiles);
            assert_eq!(actual.active_development_generation, None);
            assert_eq!(actual.development_generations.len(), 1);
            let generation = &actual.development_generations[0];
            let path = f
                .dir
                .path()
                .join("credentials-dev/generations")
                .join(generation);
            assert!(
                path.exists(),
                "partially-created generations remain discoverably owned"
            );
            assert!(!actual.cleanup.is_empty() || (kind == "record" || stage == "after_publish"));
            // No plaintext record or temporary file is published; key files are
            // unencrypted by design, while record bytes must never contain input.
            if path.join("records").exists() {
                for item in fs::read_dir(path.join("records")).unwrap() {
                    let bytes = fs::read(item.unwrap().path()).unwrap();
                    assert!(!bytes.windows(22).any(|w| w == b"public-synthetic-fault"));
                }
            }
            secrets.fault.set(None);
            assert!(f.save(&id, "public-synthetic-retry").is_ok());
            assert!(f.snapshot().valid());
            assert_eq!(f.snapshot().development_generations.len(), 2);
        }
    }
}

#[test]
fn prepared_native_fixture_is_valid_secret_free_and_deferred_without_creating_files() {
    let fixture: serde_json::Value = serde_json::from_str(include_str!(
        "../../../tests/fixtures/macos-development-credentials.json"
    ))
    .unwrap();
    assert_eq!(fixture["formatVersion"], 1);
    assert_eq!(
        fixture["expectedRequestsByLaunch"],
        serde_json::json!([2, 2, 3, 1])
    );
    let bytes = serde_json::to_vec(&fixture["profileStore"]).unwrap();
    let store = decode(&bytes).unwrap();
    assert_eq!(store.profiles.len(), 3);
    assert_eq!(store.cleanup.len(), 1);
    assert_eq!(store.schema_version, 1);
    let dir = tempfile::tempdir().unwrap();
    let secrets = FileSecrets::open(dir.path()).unwrap();
    for p in &store.profiles {
        if let Some(c) = &p.credential {
            assert_eq!(
                secrets.status(&p.profile_id, c),
                (CredentialStatus::Deferred, Some(DEFERRED))
            );
        }
    }
    for c in &store.cleanup {
        assert_eq!(secrets.delete(&c.profile_id, &c.credential), Err(DEFERRED));
    }
    assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 0);
    for value in fixture["nativeInputs"].as_object().unwrap().values() {
        assert!(valid_key(value.as_str().unwrap()));
        assert!(value
            .as_str()
            .unwrap()
            .starts_with("loomlight-public-synthetic-"));
    }
    let mut wrong = fixture["profileStore"].clone();
    wrong["profiles"][0]["credential"] =
        serde_json::json!({"credentialId":"wrong","origin":"http://127.0.0.1:46081","revision":1});
    assert!(decode(&serde_json::to_vec(&wrong).unwrap()).is_err());
}

#[test]
fn malformed_master_key_recovers_without_overwriting_and_known_missing_key_is_never_regenerated() {
    for damaged in [vec![0; 39], b"broken".to_vec()] {
        let f = Fixture::new();
        let id = f.profile("a");
        f.save(&id, "synthetic-old").unwrap();
        let old = f.credential(&id);
        fs::write(f.key_path(&old), &damaged).unwrap();
        assert!(matches!(f.secrets().read(&id, &old), Err(KEY_LOST)));
        assert_eq!(
            f.save(&id, "synthetic-new"),
            Ok(SaveOutcome::SavedCleanupPending)
        );
        assert_eq!(fs::read(f.key_path(&old)).unwrap(), damaged);
        assert_ne!(f.credential(&id).storage, old.storage);
        fs::remove_file(f.key_path(&old)).unwrap();
        assert_eq!(f.secrets().prepare_generation(&old, false), Err(KEY_LOST));
        assert!(!f.key_path(&old).exists());
    }
}
#[cfg(unix)]
#[test]
fn master_symlink_and_hardlinked_record_are_refused_without_touching_their_targets() {
    use std::os::unix::fs::symlink;
    let f = Fixture::new();
    let id = f.profile("a");
    f.save(&id, "synthetic-old").unwrap();
    let c = f.credential(&id);
    let bytes = fs::read(f.key_path(&c)).unwrap();
    let outside = f.dir.path().join("outside-key");
    fs::rename(f.key_path(&c), &outside).unwrap();
    symlink(&outside, f.key_path(&c)).unwrap();
    assert!(matches!(f.secrets().read(&id, &c), Err(ACCESS)));
    assert_eq!(f.save(&id, "synthetic-new"), Err(ACCESS));
    assert_eq!(fs::read(&outside).unwrap(), bytes);
    fs::remove_file(f.key_path(&c)).unwrap();
    fs::rename(outside, f.key_path(&c)).unwrap();
    fs::hard_link(f.record_path(&c), f.dir.path().join("outside-record")).unwrap();
    assert!(matches!(f.secrets().read(&id, &c), Err(ACCESS)));
    assert_eq!(f.secrets().delete(&id, &c), Err(ACCESS));
    assert!(f.record_path(&c).exists());
}
