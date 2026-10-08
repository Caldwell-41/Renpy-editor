//! One-shot public qualification faults; never change persistent bytes.
use loomlight_core::{
    ai_credentials::{self as credentials, Records, SaveOutcome},
    ai_profiles::{CleanupReference, CredentialService, ProfileStore},
    lifecycle::LifecycleService,
};
use serde_json::Value;
use std::{path::PathBuf, sync::Mutex};

pub const SELECTOR: &str = "post-save-snapshot-once";
pub const PROFILE: &str = "cc000000-0000-4000-8000-000000000003";
pub const WINDOWS_SELECTOR: &str = "beta-post-save-snapshot-once";
pub const WINDOWS_PROFILE: &str = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
pub struct State(pub Mutex<ReloadFixture>);
pub struct ReloadFixture {
    root: PathBuf,
    original: ProfileStore,
    consumed: bool,
    windows: bool,
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
            windows: false,
        })
    }
    #[cfg(target_os = "windows")]
    pub fn arm_windows(
        selector: &str,
        mode: &str,
        phase: &str,
        conflicting_mode: bool,
        service: &LifecycleService,
    ) -> credentials::Result<Self> {
        let root = service.ai_data_root();
        if selector != WINDOWS_SELECTOR
            || mode != "studio-settings"
            || phase != "2"
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
                    .starts_with("loomlight-studio-windows-acceptance-")
            })
            || root
                .symlink_metadata()
                .map_err(|_| "Windows reload root missing.")?
                .file_type()
                .is_symlink()
        {
            return Err("Windows reload fixture requires exclusive acceptance phase 2.");
        }
        let original = service.read()?;
        crate::windows_studio_probe::validate(&original, 2)?;
        if original.revision != 5 {
            return Err("Windows reload fixture requires complete phase-1 state.");
        }
        Ok(Self {
            root: root.to_owned(),
            original,
            consumed: false,
            windows: true,
        })
    }
    pub fn permits_operation(&self, operation: &str) -> bool {
        !self.pending()
            || operation == "ai.enterCredential"
            || (self.windows && operation == "ai.discover")
    }
    /// Check before native entry. Reads, failed entry and Cancel never consume the fault.
    pub fn check_entry(
        &self,
        service: &LifecycleService,
        before: &ProfileStore,
        id: &str,
    ) -> credentials::Result<()> {
        let profile = if self.windows {
            WINDOWS_PROFILE
        } else {
            PROFILE
        };
        if !self.consumed
            && (service.ai_data_root() != self.root || *before != self.original || id != profile)
        {
            return Err("Reload fixture target/state refused.");
        }
        if self.windows && self.pending() {
            let marker = std::fs::read(self.root.join(".studio-windows-step.json"))
                .map_err(|_| "Windows beta entry marker missing.")?;
            if serde_json::from_slice::<Value>(&marker).ok()
                != Some(serde_json::json!({"phase":"2", "step":"beta-entry"}))
            {
                return Err("Windows beta entry marker refused.");
            }
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
        if self.windows {
            let before = self.original.profiles[0].credential.as_ref().unwrap();
            let credential = actual
                .profiles
                .first()
                .and_then(|p| p.credential.as_ref())
                .ok_or("Windows replacement publication missing.")?;
            if !credential.storage.is_native()
                || credential.service != CredentialService::Legacy
                || credential.origin != before.origin
                || credential.revision != 2
                || credential.credential_id == before.credential_id
            {
                return Err("Windows replacement ownership refused.");
            }
            let mut expected = self.original.clone();
            expected.revision += 3;
            expected.profiles[0].revision += 1;
            expected.profiles[0].credential = Some(credential.clone());
            if actual != expected {
                return Err("Windows complete replacement publication refused.");
            }
            self.consumed = true;
            return Err("Qualification fixture refused one post-save Settings snapshot read.");
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
    #[cfg(target_os = "windows")]
    pub(super) fn windows_original() -> ProfileStore {
        let mut store: ProfileStore =
            serde_json::from_str(crate::windows_studio_probe::FIXTURE).unwrap();
        store.revision = 5;
        for (p, id) in store.profiles.iter_mut().zip([
            "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            "ffffffff-ffff-4fff-8fff-ffffffffffff",
        ]) {
            p.revision = 2;
            p.credential = Some(
                serde_json::from_value(serde_json::json!({
                    "credentialId":id,"origin":"http://127.0.0.1:46082","revision":1
                }))
                .unwrap(),
            );
        }
        store
    }
    #[cfg(target_os = "windows")]
    #[test]
    fn windows_activation_and_confirmation_reject_mismatch_without_consuming_or_writing() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-windows-acceptance-")
            .tempdir()
            .unwrap();
        let service = LifecycleService::new(root.path().to_owned()).unwrap();
        let before = windows_original();
        std::fs::write(
            root.path().join("ai-profiles.json"),
            serde_json::to_vec(&before).unwrap(),
        )
        .unwrap();
        for (selector, mode, phase, conflict) in [
            ("unknown", "studio-settings", "2", false),
            (WINDOWS_SELECTOR, "", "2", false),
            (WINDOWS_SELECTOR, "studio-settings", "1", false),
            (WINDOWS_SELECTOR, "studio-settings", "2", true),
        ] {
            assert!(ReloadFixture::arm_windows(selector, mode, phase, conflict, &service).is_err());
        }
        let mut fault =
            ReloadFixture::arm_windows(WINDOWS_SELECTOR, "studio-settings", "2", false, &service)
                .unwrap();
        let path = root.path().join("ai-profiles.json");
        let bytes = std::fs::read(&path).unwrap();
        assert!(fault
            .check_entry(&service, &before, WINDOWS_PROFILE)
            .is_err());
        std::fs::write(
            root.path().join(".studio-windows-step.json"),
            r#"{"phase":"2","step":"beta-entry"}"#,
        )
        .unwrap();
        assert!(fault
            .check_entry(&service, &before, WINDOWS_PROFILE)
            .is_ok());
        assert!(fault
            .check_entry(&service, &before, &before.profiles[1].profile_id)
            .is_err());
        assert!(fault.permits_operation("ai.discover"));
        assert!(!fault.permits_operation("ai.removeProfile"));
        // Cancel/read/unpublished confirmation never consume the fault.
        assert_eq!(service.read().unwrap(), before);
        assert!(fault
            .snapshot_after_save(&service, SaveOutcome::SavedCleanupPending)
            .is_err());
        assert!(fault.pending());
        assert_eq!(std::fs::read(&path).unwrap(), bytes);
        let mut actual = before.clone();
        actual.revision += 3;
        actual.profiles[0].revision += 1;
        let c = actual.profiles[0].credential.as_mut().unwrap();
        c.revision += 1;
        c.credential_id = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeef".into();
        for mutate in 0..6 {
            let mut wrong = actual.clone();
            match mutate {
                0 => wrong.revision += 1,
                1 => wrong.profiles[1].settings.label.push_str(" changed"),
                2 => wrong.cleanup.clear(),
                3 => wrong.active_development_generation = None,
                4 => {
                    wrong.profiles[0].credential.as_mut().unwrap().service =
                        CredentialService::Loomlight
                }
                _ => {
                    wrong.profiles[0].credential.as_mut().unwrap().credential_id = before.profiles
                        [0]
                    .credential
                    .as_ref()
                    .unwrap()
                    .credential_id
                    .clone()
                }
            }
            let bytes = serde_json::to_vec(&wrong).unwrap();
            std::fs::write(&path, &bytes).unwrap();
            assert!(fault
                .snapshot_after_save(&service, SaveOutcome::SavedCleanupPending)
                .is_err());
            assert!(fault.pending());
            assert_eq!(std::fs::read(&path).unwrap(), bytes);
        }
        let bytes = serde_json::to_vec(&actual).unwrap();
        std::fs::write(&path, &bytes).unwrap();
        assert_eq!(
            fault
                .snapshot_after_save(&service, SaveOutcome::SavedCleanupPending)
                .unwrap_err(),
            "Qualification fixture refused one post-save Settings snapshot read."
        );
        assert!(!fault.pending());
        assert_eq!(
            fault
                .snapshot_after_save(&service, SaveOutcome::SavedCleanupPending)
                .unwrap(),
            actual
        );
        assert_eq!(std::fs::read(&path).unwrap(), bytes);
        assert!(ReloadFixture::arm_windows(
            WINDOWS_SELECTOR,
            "studio-settings",
            "2",
            false,
            &service
        )
        .is_err());
    }
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
