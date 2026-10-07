//! Remembered Studio lifecycle. Keys never enter a serializable type.
use crate::{ai_profiles::*, lifecycle::LifecycleService};
use sha2::{Digest, Sha256};

pub type Result<T> = std::result::Result<T, &'static str>;
pub trait Records {
    fn read(&self) -> Result<ProfileStore>;
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> Result<()>;
}
impl Records for LifecycleService {
    fn read(&self) -> Result<ProfileStore> {
        self.read_ai_profiles()
            .map_err(|_| "Profile records unavailable; existing data retained.")
    }
    fn write(&self, next: &ProfileStore, old: &ProfileStore) -> Result<()> {
        self.write_ai_profiles(next, old)
            .map_err(|_| "Profile save failed; reload before retrying.")
    }
}
pub trait Secrets {
    fn read(&self, profile: &str, credential: &OwnedCredential) -> Result<Option<String>>;
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
        Err(error) => {
            if records.read().is_ok_and(|actual| actual == *next) {
                Ok(())
            } else {
                Err(error)
            }
        }
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
) -> Result<()> {
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
        origin: canonical_endpoint(&p.settings.endpoint, p.settings.private_http)?.1,
        revision: p
            .credential
            .as_ref()
            .map_or(Some(1), |c| c.revision.checked_add(1))
            .ok_or("Revision exhausted.")?,
    };
    let staged = CleanupReference {
        profile_id: id.into(),
        credential: credential.clone(),
    };
    let mut stage = old.clone();
    stage.cleanup.push(staged.clone());
    advance(&mut stage)?;
    publish(records, &stage, &old)?; // durable ownership precedes native addition
    if secrets.add(id, &credential, key).is_err()
        || !secrets
            .read(id, &credential)
            .is_ok_and(|value| value.as_deref() == Some(key))
    {
        let _ = cleanup_one(records, secrets, &staged);
        return Err("Credential store write/verification unavailable; previous key retained. Check cleanup status.");
    }
    let mut next = stage.clone();
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
    cleanup_profile(records, secrets, id)
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
    for entry in entries.iter().filter(|c| c.profile_id == id) {
        cleanup_one(records, secrets, entry)?;
    }
    Ok(())
}
pub fn remove(
    records: &impl Records,
    secrets: &impl Secrets,
    expected: &str,
    id: &str,
    profile: bool,
) -> Result<()> {
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
    publish(records, &next, &old)?; // disable/unpublish before native deletion
    cleanup_profile(records, secrets, id)
}

#[cfg(test)]
mod tests;
