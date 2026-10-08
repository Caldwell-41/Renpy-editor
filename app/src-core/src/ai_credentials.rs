//! Remembered Studio lifecycle. Keys never enter a serializable type.
use crate::{ai_profiles::*, lifecycle::LifecycleService};
use sha2::{Digest, Sha256};

pub type Result<T> = std::result::Result<T, &'static str>;
/// No Debug/Serialize; clear owned plaintext on drop as a best-effort measure.
pub struct Secret(zeroize::Zeroizing<String>);
impl Secret {
    pub fn new(value: String) -> Self {
        Self(zeroize::Zeroizing::new(value))
    }
}
impl std::ops::Deref for Secret {
    type Target = str;
    fn deref(&self) -> &str {
        &self.0
    }
}
pub const UNCERTAIN_SAVE: &str =
    "Save state uncertain; input retained. Reload saved state before retrying.";
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SaveOutcome {
    Saved,
    SavedCleanupPending,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CredentialStatus {
    Configured,
    Missing,
    Recovery,
    Deferred,
    Unsupported,
}
pub trait Records {
    fn read(&self) -> Result<ProfileStore>;
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> Result<()>;
}
impl Records for LifecycleService {
    fn read(&self) -> Result<ProfileStore> {
        self.read_ai_profiles()
            .map_err(|e| match e {
                crate::lifecycle::LifecycleError::AiProfilesUnsupported => "Saved profiles use a newer unsupported format. Use a compatible newer app; existing data retained.",
                _ => "Profile records unavailable; existing data retained. Retry reading before changing credentials.",
            })
    }
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> Result<()> {
        self.write_ai_profiles(next, old)
            .map_err(|_| "Profile save failed; reload before retrying.")
    }
}
pub trait Secrets {
    fn service(&self) -> CredentialService {
        CredentialService::Legacy
    }
    fn generation(&self, _: &ProfileStore, _: &StudioProfile) -> Result<Option<String>> {
        Ok(None)
    }
    fn status(
        &self,
        profile: &str,
        credential: &OwnedCredential,
    ) -> (CredentialStatus, Option<&'static str>) {
        match self.read(profile, credential) {
            Ok(Some(_)) => (CredentialStatus::Configured, None),
            Ok(None) => (CredentialStatus::Missing, None),
            Err(message) => (CredentialStatus::Recovery, Some(message)),
        }
    }
    fn read(&self, profile: &str, credential: &OwnedCredential) -> Result<Option<Secret>>;
    fn prepare_generation(&self, _: &OwnedCredential, _: bool) -> Result<()> {
        Ok(())
    }
    fn add(&self, profile: &str, credential: &OwnedCredential, key: &str) -> Result<()>;
    fn delete(&self, profile: &str, credential: &OwnedCredential) -> Result<()>;
}
pub fn token(store: &ProfileStore) -> String {
    hex::encode(Sha256::digest(
        serde_json::to_vec(store).expect("profile record serialization"),
    ))
}
pub fn checked(records: &impl Records, expected: &str) -> Result<ProfileStore> {
    let old = records.read()?;
    if token(&old) != expected {
        return Err("Settings changed; reload before continuing.");
    }
    Ok(old)
}
pub fn valid_key(key: &str) -> bool {
    !key.is_empty() && key.len() <= 4096 && key.bytes().all(|b| (33..=126).contains(&b))
}
fn advance(store: &mut ProfileStore) -> Result<()> {
    store.revision = store.revision.checked_add(1).ok_or("Revision exhausted.")?;
    Ok(())
}
fn bump(profile: &mut StudioProfile) -> Result<()> {
    profile.revision = profile
        .revision
        .checked_add(1)
        .ok_or("Revision exhausted.")?;
    Ok(())
}
/// An error after rename may already have published. Never guess which key is active.
fn publish(records: &impl Records, next: &ProfileStore, old: &ProfileStore) -> Result<()> {
    match records.write(next, old) {
        Ok(()) => Ok(()),
        Err(error) => match records.read() {
            Ok(actual) if actual == *next => Ok(()),
            Ok(_) => Err(error),
            Err(_) => Err(UNCERTAIN_SAVE),
        },
    }
}
pub fn save(
    records: &impl Records,
    expected: &str,
    id: Option<&str>,
    mut settings: StudioSettings,
) -> Result<()> {
    settings.endpoint = canonical_endpoint(&settings.endpoint, settings.private_http)?.0;
    if !settings.valid() {
        return Err("Invalid Studio settings or token limits.");
    }
    let old = checked(records, expected)?;
    let mut next = old.clone();
    if let Some(id) = id {
        let p = next
            .profiles
            .iter_mut()
            .find(|p| p.profile_id == id)
            .ok_or("Profile missing.")?;
        if p.settings == settings {
            return Ok(());
        }
        p.settings = settings;
        bump(p)?;
    } else {
        next.profiles.push(StudioProfile {
            profile_id: uuid::Uuid::new_v4().to_string(),
            revision: 1,
            settings,
            credential: None,
            disabled: false,
        });
    }
    advance(&mut next)?;
    publish(records, &next, &old)
}
pub fn replace(
    records: &impl Records,
    secrets: &impl Secrets,
    expected: &str,
    id: &str,
    key: &str,
) -> Result<SaveOutcome> {
    replace_tracked(records, secrets, expected, id, key, &mut None)
}
pub fn replace_tracked(
    records: &impl Records,
    secrets: &impl Secrets,
    expected: &str,
    id: &str,
    key: &str,
    candidate: &mut Option<OwnedCredential>,
) -> Result<SaveOutcome> {
    if !valid_key(key) {
        return Err("Credential must be 1–4096 printable non-space ASCII characters.");
    }
    let old = checked(records, expected)?;
    let p = old
        .profiles
        .iter()
        .find(|p| p.profile_id == id)
        .ok_or("Profile missing.")?;
    let credential = OwnedCredential {
        credential_id: uuid::Uuid::new_v4().to_string(),
        service: secrets.service(),
        storage: secrets
            .generation(&old, p)?
            .map_or(CredentialStorage::Native, |generation_id| {
                CredentialStorage::DevelopmentFile { generation_id }
            }),
        origin: canonical_endpoint(&p.settings.endpoint, p.settings.private_http)?.1,
        revision: p
            .credential
            .as_ref()
            .map_or(Some(1), |c| c.revision.checked_add(1))
            .ok_or("Revision exhausted.")?,
    };
    *candidate = Some(credential.clone());
    let staged = CleanupReference {
        profile_id: id.into(),
        credential: credential.clone(),
    };
    let mut stage = old.clone();
    if let Some(generation) = credential.storage.generation() {
        stage.schema_version = 2;
        if !stage
            .development_generations
            .iter()
            .any(|g| g == generation)
        {
            stage.development_generations.push(generation.into());
        }
    }
    stage.cleanup.push(staged.clone());
    advance(&mut stage)?;
    publish(records, &stage, &old)?; // durable ownership precedes credential addition
    let fresh_generation = credential
        .storage
        .generation()
        .is_some_and(|g| !old.development_generations.iter().any(|owned| owned == g));
    let verification = secrets.prepare_generation(&credential, fresh_generation).and_then(|()| secrets.add(id, &credential, key)).and_then(|()| {
        match secrets.read(id, &credential)? {
            Some(value) if &*value == key => Ok(()),
            _ => Err("Credential store verification failed; previous key retained. Check cleanup status."),
        }
    });
    if let Err(error) = verification {
        let _ = cleanup_one(records, secrets, &staged);
        return Err(error);
    }
    let mut next = stage.clone();
    if let Some(generation) = credential.storage.generation() {
        next.active_development_generation = Some(generation.into());
    }
    next.cleanup.retain(|c| c != &staged);
    let p = next
        .profiles
        .iter_mut()
        .find(|p| p.profile_id == id)
        .unwrap();
    if let Some(retired) = p.credential.replace(credential) {
        next.cleanup.push(CleanupReference {
            profile_id: id.into(),
            credential: retired,
        });
    }
    p.disabled = false;
    bump(p)?;
    advance(&mut next)?;
    if let Err(error) = publish(records, &next, &stage) {
        // Re-read and cleanup only a still-staged, inactive identity. Read failure
        // leaves the durable reference intact; never delete a possibly active key.
        let _ = cleanup_one(records, secrets, &staged);
        return Err(error);
    }
    Ok(if cleanup_profile(records, secrets, id).is_ok() {
        SaveOutcome::Saved
    } else {
        SaveOutcome::SavedCleanupPending
    })
}
fn cleanup_one(
    records: &impl Records,
    secrets: &impl Secrets,
    entry: &CleanupReference,
) -> Result<()> {
    let old = records.read()?;
    if !old.cleanup.contains(entry) {
        return Ok(());
    }
    if old.profiles.iter().any(|p| {
        p.credential
            .as_ref()
            .is_some_and(|c| c.credential_id == entry.credential.credential_id)
    }) {
        return Err("Cleanup identity conflict.");
    }
    secrets
        .delete(&entry.profile_id, &entry.credential)
        .map_err(|_| "Credential cleanup incomplete; owned reference retained.")?;
    let mut next = old.clone();
    next.cleanup.retain(|c| c != entry);
    advance(&mut next)?;
    publish(records, &next, &old)
}
pub fn cleanup_profile(records: &impl Records, secrets: &impl Secrets, id: &str) -> Result<()> {
    let entries = records.read()?.cleanup;
    let mut failure = None;
    for entry in entries.iter().filter(|c| c.profile_id == id) {
        if let Err(error) = cleanup_one(records, secrets, entry) {
            failure = Some(error);
        }
    }
    failure.map_or(Ok(()), Err)
}
pub fn remove(
    records: &impl Records,
    secrets: &impl Secrets,
    expected: &str,
    id: &str,
    profile: bool,
) -> Result<SaveOutcome> {
    let old = checked(records, expected)?;
    let mut next = old.clone();
    let p = next
        .profiles
        .iter_mut()
        .find(|p| p.profile_id == id)
        .ok_or("Profile missing.")?;
    p.disabled = true;
    if let Some(credential) = p.credential.take() {
        next.cleanup.push(CleanupReference {
            profile_id: id.into(),
            credential,
        });
    }
    bump(p)?;
    if profile {
        next.profiles.retain(|p| p.profile_id != id);
    }
    advance(&mut next)?;
    publish(records, &next, &old)?; // disable/unpublish before credential deletion
    Ok(if cleanup_profile(records, secrets, id).is_ok() {
        SaveOutcome::Saved
    } else {
        SaveOutcome::SavedCleanupPending
    })
}

/// Rust-only retained-entry controller. Explicit Retry reloads before any write.
/// A changed target/origin is never implicitly accepted. Uncertain publication is
/// reconciled using the exact candidate identity, never by replaying the save.
pub struct CredentialEntry {
    original: StudioProfile,
    expected: String,
    candidate: Option<OwnedCredential>,
    attempted: bool,
}
impl CredentialEntry {
    pub fn new(store: &ProfileStore, expected: &str, id: &str) -> Result<Self> {
        if token(store) != expected {
            return Err("Settings changed; reload before continuing.");
        }
        Ok(Self {
            original: store
                .profiles
                .iter()
                .find(|p| p.profile_id == id)
                .ok_or("Profile missing.")?
                .clone(),
            expected: expected.into(),
            candidate: None,
            attempted: false,
        })
    }
    pub fn save(
        &mut self,
        records: &impl Records,
        secrets: &impl Secrets,
        key: &str,
    ) -> Result<SaveOutcome> {
        let actual = records.read()?;
        let profile = actual
            .profiles
            .iter()
            .find(|p| p.profile_id == self.original.profile_id)
            .ok_or("Profile removed; cancel entry and reload.")?;
        if self.attempted
            && self
                .candidate
                .as_ref()
                .is_some_and(|c| profile.credential.as_ref() == Some(c))
            && profile.settings == self.original.settings
            && !profile.disabled
            && self.original.revision.checked_add(1) == Some(profile.revision)
        {
            return Ok(
                if actual
                    .cleanup
                    .iter()
                    .any(|c| c.profile_id == profile.profile_id)
                {
                    SaveOutcome::SavedCleanupPending
                } else {
                    SaveOutcome::Saved
                },
            );
        }
        if *profile != self.original || (!self.attempted && token(&actual) != self.expected) {
            return Err(
                "Settings changed; input retained. Cancel entry and reload the selected profile.",
            );
        }
        self.attempted = true;
        replace_tracked(
            records,
            secrets,
            &token(&actual),
            &profile.profile_id,
            key,
            &mut self.candidate,
        )
    }
}

#[cfg(test)]
mod tests;
