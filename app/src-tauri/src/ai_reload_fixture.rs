//! One-shot public Mac qualification fault; never changes persistent bytes.
use loomlight_core::{
    ai_credentials::{self as credentials, Records, SaveOutcome},
    ai_profiles::{CleanupReference, CredentialService, ProfileStore},
    lifecycle::LifecycleService,
};
use serde_json::Value;
use std::{path::PathBuf, sync::Mutex};

pub const SELECTOR: &str = "post-save-snapshot-once";
pub const PROFILE: &str = "cc000000-0000-4000-8000-000000000003";
pub struct State(pub Mutex<ReloadFixture>);
pub struct ReloadFixture {
    root: PathBuf,
    original: ProfileStore,
    consumed: bool,
}
fn original() -> ProfileStore {
    let fixture: Value = serde_json::from_str(include_str!(
        "../../tests/fixtures/macos-development-credentials.json"
    ))
    .expect("public fixture");
    serde_json::from_value(fixture["profileStore"].clone()).expect("public profiles")
}
impl ReloadFixture {
    pub fn arm(
        selector: &str,
        mode: &str,
        phase: &str,
        conflicting_mode: bool,
        service: &LifecycleService,
    ) -> credentials::Result<Self> {
        let root = service.ai_data_root();
        if selector != SELECTOR
            || mode != "studio-settings"
            || phase != "1"
            || conflicting_mode
            || root.parent()
                != Some(
                    std::env::temp_dir()
                        .canonicalize()
                        .map_err(|_| "Temporary root unavailable.")?
                        .as_path(),
                )
            || !root.file_name().is_some_and(|n| {
                n.to_string_lossy()
                    .starts_with("loomlight-studio-dev-credentials-")
            })
            || root
                .symlink_metadata()
                .map_err(|_| "Reload fixture root missing.")?
                .file_type()
                .is_symlink()
            || !root.is_dir()
        {
            return Err("Reload fixture requires exclusive isolated Mac development Studio mode.");
        }
        let original = original();
        // Absence must be observed without following links: a dangling link is
        // still an existing unsupported fixture entry, not a fresh store.
        let credentials_absent = matches!(
            root.join("credentials-dev").symlink_metadata(),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound
        );
        if service.read()? != original || !credentials_absent {
            return Err("Reload fixture state refused.");
        }
        Ok(Self {
            root: root.to_owned(),
            original,
            consumed: false,
        })
    }
    /// Check before native entry. Reads, failed entry and Cancel never consume the fault.
    pub fn check_entry(
        &self,
        service: &LifecycleService,
        before: &ProfileStore,
        id: &str,
    ) -> credentials::Result<()> {
        if !self.consumed
            && (service.ai_data_root() != self.root || *before != self.original || id != PROFILE)
        {
            return Err("Reload fixture target/state refused.");
        }
        Ok(())
    }
    pub fn pending(&self) -> bool {
        !self.consumed
    }
    /// Called only after the entry controller confirms publication. Reject fake
    /// outcomes/staged-only/wrong references; inject at the subsequent snapshot seam.
    pub fn snapshot_after_save(
        &mut self,
        service: &LifecycleService,
        outcome: SaveOutcome,
    ) -> credentials::Result<ProfileStore> {
        let actual = service.read()?;
        if self.consumed {
            return Ok(actual);
        }
        if service.ai_data_root() != self.root || outcome != SaveOutcome::SavedCleanupPending {
            return Err("Reload fixture confirmation refused.");
        }
        let credential = actual
            .profiles
            .iter()
            .find(|p| p.profile_id == PROFILE)
            .and_then(|p| p.credential.clone())
            .ok_or("Reload fixture publication missing.")?;
        let generation = credential
            .storage
            .generation()
            .ok_or("Reload fixture file reference missing.")?;
        if credential.service != CredentialService::Loomlight
            || credential.origin != "http://127.0.0.1:46081"
            || credential.revision != 2
            || credential.credential_id
                == self.original.profiles[2]
                    .credential
                    .as_ref()
                    .unwrap()
                    .credential_id
        {
            return Err("Reload fixture ownership refused.");
        }
        let mut expected = self.original.clone();
        expected.schema_version = 2;
        expected.revision += 2;
        expected.development_generations = vec![generation.to_owned()];
        expected.active_development_generation = Some(generation.to_owned());
        expected.cleanup.push(CleanupReference {
            profile_id: PROFILE.into(),
            credential: expected.profiles[2].credential.replace(credential).unwrap(),
        });
        expected.profiles[2].revision += 1;
        if actual != expected {
            return Err("Reload fixture publication state refused.");
        }
        self.consumed = true;
        Err("Qualification fixture refused one post-save Settings snapshot read.")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn seeded(root: &std::path::Path) -> LifecycleService {
        let service = LifecycleService::new(root.to_owned()).unwrap();
        service
            .write(&original(), &ProfileStore::default())
            .unwrap();
        service
    }
    #[test]
    fn activation_rejects_normal_modes_roots_and_mismatched_fixture_state() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-dev-credentials-")
            .tempdir()
            .unwrap();
        let service = seeded(root.path());
        let arm = |selector, mode, phase, conflict| {
            ReloadFixture::arm(selector, mode, phase, conflict, &service)
        };
        assert!(arm(SELECTOR, "studio-settings", "1", false).is_ok());
        for (selector, mode, phase, conflict) in [
            ("unknown", "studio-settings", "1", false),
            (SELECTOR, "", "1", false),
            (SELECTOR, "source-foundation", "1", false),
            (SELECTOR, "studio-settings", "2", false),
            (SELECTOR, "studio-settings", "1", true),
        ] {
            assert!(arm(selector, mode, phase, conflict).is_err());
        }
        let normal = tempfile::tempdir().unwrap();
        assert!(ReloadFixture::arm(
            SELECTOR,
            "studio-settings",
            "1",
            false,
            &seeded(normal.path())
        )
        .is_err());
        let nested = root.path().join("loomlight-studio-dev-credentials-child");
        assert!(
            ReloadFixture::arm(SELECTOR, "studio-settings", "1", false, &seeded(&nested)).is_err()
        );
        let original_bytes = std::fs::read(root.path().join("ai-profiles.json")).unwrap();
        for mutate in 0..7 {
            let mut store = original();
            match mutate {
                0 => store.revision += 1,
                1 => store.profiles[2].settings.endpoint = "http://127.0.0.1:46082/v1".into(),
                2 => store.profiles[2].credential = None,
                3 => store.profiles[2].disabled = true,
                4 => store.cleanup.clear(),
                5 => store.profiles.swap(0, 1),
                _ => {
                    store.profiles[2].credential.as_mut().unwrap().service =
                        CredentialService::Loomlight
                }
            }
            let bytes = serde_json::to_vec(&store).unwrap();
            std::fs::write(root.path().join("ai-profiles.json"), &bytes).unwrap();
            assert!(arm(SELECTOR, "studio-settings", "1", false).is_err());
            assert_eq!(
                std::fs::read(root.path().join("ai-profiles.json")).unwrap(),
                bytes
            );
        }
        std::fs::write(root.path().join("ai-profiles.json"), original_bytes).unwrap();
        std::fs::create_dir(root.path().join("credentials-dev")).unwrap();
        assert!(arm(SELECTOR, "studio-settings", "1", false).is_err());
        #[cfg(unix)]
        {
            let entry = root.path().join("credentials-dev");
            std::fs::remove_dir(&entry).unwrap();
            let missing_target = root.path().join("absent-storage");
            std::os::unix::fs::symlink(&missing_target, &entry).unwrap();
            assert!(arm(SELECTOR, "studio-settings", "1", false).is_err());
            assert!(entry.symlink_metadata().unwrap().file_type().is_symlink());
            assert!(!missing_target.exists());
        }
    }
    #[test]
    fn confirmation_rejects_mismatched_publication_without_consuming_and_cannot_rearm() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-dev-credentials-")
            .tempdir()
            .unwrap();
        let service = seeded(root.path());
        let mut fixture =
            ReloadFixture::arm(SELECTOR, "studio-settings", "1", false, &service).unwrap();
        let before = service.read().unwrap();
        let outcome = credentials::replace(
            &service,
            &loomlight_core::ai_file_secrets::FileSecrets::open(root.path()).unwrap(),
            &credentials::token(&before),
            PROFILE,
            "loomlight-public-synthetic-theta",
        )
        .unwrap();
        assert_eq!(outcome, SaveOutcome::SavedCleanupPending);
        let actual = service.read().unwrap();
        let path = root.path().join("ai-profiles.json");
        let bytes = std::fs::read(&path).unwrap();
        for mutate in 0..6 {
            let mut wrong = actual.clone();
            match mutate {
                0 => wrong.revision += 1,
                1 => wrong.profiles[0].settings.label.push_str(" changed"),
                2 => wrong.cleanup.pop().map(|_| ()).unwrap(),
                3 => wrong.profiles[2].credential.as_mut().unwrap().revision += 1,
                4 => {
                    wrong.profiles[2].credential.as_mut().unwrap().service =
                        CredentialService::Legacy
                }
                _ => wrong.profiles[2].disabled = true,
            }
            let wrong_bytes = serde_json::to_vec(&wrong).unwrap();
            std::fs::write(&path, &wrong_bytes).unwrap();
            assert!(fixture.snapshot_after_save(&service, outcome).is_err());
            assert!(fixture.pending(), "mismatch is not the selected refusal");
            assert_eq!(std::fs::read(&path).unwrap(), wrong_bytes);
        }
        std::fs::write(&path, &bytes).unwrap();
        assert!(fixture.check_entry(&service, &actual, PROFILE).is_err());
        assert!(ReloadFixture::arm(SELECTOR, "studio-settings", "1", false, &service).is_err());
        assert_eq!(
            fixture.snapshot_after_save(&service, outcome).unwrap_err(),
            "Qualification fixture refused one post-save Settings snapshot read."
        );
        assert!(!fixture.pending());
        assert_eq!(
            fixture.snapshot_after_save(&service, outcome).unwrap(),
            actual
        );
        assert_eq!(std::fs::read(path).unwrap(), bytes);
    }
    #[test]
    fn no_fault_for_unpublished_or_wrong_root_confirmation() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-dev-credentials-")
            .tempdir()
            .unwrap();
        let service = seeded(root.path());
        let mut fixture =
            ReloadFixture::arm(SELECTOR, "studio-settings", "1", false, &service).unwrap();
        let bytes = std::fs::read(root.path().join("ai-profiles.json")).unwrap();
        assert!(fixture
            .snapshot_after_save(&service, SaveOutcome::Saved)
            .is_err());
        assert!(fixture
            .snapshot_after_save(&service, SaveOutcome::SavedCleanupPending)
            .is_err());
        assert!(fixture.pending());
        let other = tempfile::tempdir().unwrap();
        assert!(fixture
            .check_entry(&seeded(other.path()), &original(), PROFILE)
            .is_err());
        assert!(fixture
            .check_entry(&service, &original(), &original().profiles[0].profile_id)
            .is_err());
        assert_eq!(
            std::fs::read(root.path().join("ai-profiles.json")).unwrap(),
            bytes
        );
        assert!(!root.path().join("credentials-dev").exists());
    }
}
