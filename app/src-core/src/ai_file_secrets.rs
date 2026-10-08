//! Temporary Mac development compromise: ciphertext plus a local unencrypted key.
//! This protects accidental exposure, not against software under the same login.
use crate::{
    ai_credentials::{valid_key, CredentialStatus, Result, Secret, Secrets},
    ai_profiles::{uuid, CredentialService, OwnedCredential, ProfileStore, StudioProfile},
    transaction::{flush_open_file, DirectoryAnchor},
};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use std::{
    ffi::OsStr,
    fs::{File, Metadata},
    io::{Read, Write},
    path::Path,
};
use zeroize::Zeroizing;

pub const DEFERRED: &str = "Apple Keychain API-key storage is deferred. Re-enter your API key to use temporary Mac development storage; original references are retained.";
pub const RECOVERY: &str = "Your saved API key couldn't be read. Re-enter it to restore AI access. Original storage is retained.";
pub const KEY_LOST: &str = "Saved unlock key is missing or damaged. Re-enter your API key to restore AI access in a new generation; original storage is retained.";
pub const AUTH_FAILED: &str = "Saved API key authentication failed; the damaged component is uncertain. Re-enter it to restore AI access in a new generation.";
pub const ACCESS: &str = "Credential files could not be accessed safely. Retry reading or re-enter your API key; original storage is retained.";
pub const NEWER: &str = "Credential storage uses an unsupported format. Use a compatible newer app; existing storage is retained and cannot be overwritten here.";
const KEY_MAGIC: &[u8] = b"LLKEY";
const RECORD_MAGIC: &[u8] = b"LLREC";
const VERSION: u8 = 1;
const MAX_RECORD: usize = 6 + 24 + 4096 + 16;

pub struct FileSecrets {
    root: DirectoryAnchor,
    #[cfg(test)]
    fault: std::cell::Cell<Option<(&'static str, &'static str)>>,
}
impl FileSecrets {
    /// Opening and status inspection never creates a generation or any file.
    pub fn open(root: &Path) -> Result<Self> {
        Ok(Self {
            root: DirectoryAnchor::open_root(root).map_err(|_| ACCESS)?,
            #[cfg(test)]
            fault: std::cell::Cell::new(None),
        })
    }
    fn child(parent: &DirectoryAnchor, name: &str, create: bool) -> Result<DirectoryAnchor> {
        let child = parent
            .open_child(OsStr::new(name), create)
            .map_err(|_| ACCESS)?;
        private(
            &child
                .runtime_handle()
                .map_err(|_| ACCESS)?
                .metadata()
                .map_err(|_| ACCESS)?,
            true,
        )?;
        Ok(child)
    }
    fn generation_dir(&self, id: &str, create: bool) -> Result<DirectoryAnchor> {
        if !uuid(id) {
            return Err(ACCESS);
        }
        let base = Self::child(&self.root, "credentials-dev", create)?;
        let generations = Self::child(&base, "generations", create)?;
        Self::child(&generations, id, create)
    }
    fn generation_absent(&self, id: &str) -> Result<bool> {
        if !uuid(id) {
            return Err(ACCESS);
        }
        if self
            .root
            .entry_absent(OsStr::new("credentials-dev"))
            .map_err(|_| ACCESS)?
        {
            return Ok(true);
        }
        let base = Self::child(&self.root, "credentials-dev", false)?;
        if base
            .entry_absent(OsStr::new("generations"))
            .map_err(|_| ACCESS)?
        {
            return Ok(true);
        }
        let generations = Self::child(&base, "generations", false)?;
        generations.entry_absent(OsStr::new(id)).map_err(|_| ACCESS)
    }
    fn key(&self, generation: &str) -> Result<Zeroizing<Vec<u8>>> {
        if self.generation_absent(generation)? {
            return Err(KEY_LOST);
        }
        let dir = self.generation_dir(generation, false)?;
        let Some(bytes) = bounded_read(&dir, "master.key", 38)? else {
            return Err(KEY_LOST);
        };
        format(&bytes, KEY_MAGIC).map_err(|e| if e == NEWER { e } else { KEY_LOST })?;
        if bytes.len() != 38 {
            return Err(KEY_LOST);
        }
        Ok(bytes)
    }
    fn binding(profile: &str, c: &OwnedCredential) -> Result<Vec<u8>> {
        let generation = c.storage.generation().ok_or(DEFERRED)?;
        if !uuid(profile)
            || !uuid(&c.credential_id)
            || !uuid(generation)
            || c.revision == 0
            || c.origin.len() > 2048
            || !crate::ai_profiles::canonical_endpoint(&c.origin, true)
                .is_ok_and(|(_, origin)| origin == c.origin)
        {
            return Err(ACCESS);
        }
        serde_json::to_vec(&(
            VERSION,
            generation,
            profile,
            &c.credential_id,
            c.revision,
            &c.origin,
        ))
        .map_err(|_| ACCESS)
    }
    fn records(&self, c: &OwnedCredential, create: bool) -> Result<DirectoryAnchor> {
        let generation = c.storage.generation().ok_or(DEFERRED)?;
        Self::child(&self.generation_dir(generation, false)?, "records", create)
    }
    fn record_name(c: &OwnedCredential) -> Result<String> {
        if !uuid(&c.credential_id) {
            return Err(ACCESS);
        }
        Ok(format!("{}.sealed", c.credential_id))
    }
    fn write(&self, dir: &DirectoryAnchor, name: &str, bytes: &[u8]) -> Result<()> {
        write_new(dir, name, bytes, |_stage| {
            #[cfg(test)]
            if let Some((kind, stage)) = self.fault.get() {
                if _stage == stage && ((kind == "key") == (name == "master.key")) {
                    return Err(ACCESS);
                }
            }
            Ok(())
        })
    }
}
impl Secrets for FileSecrets {
    fn service(&self) -> CredentialService {
        CredentialService::Loomlight
    }
    fn generation(&self, store: &ProfileStore, profile: &StudioProfile) -> Result<Option<String>> {
        // An authentication failure is uncertain: never reuse that generation's key.
        let suspect = profile
            .credential
            .as_ref()
            .map(|c| self.read(&profile.profile_id, c));
        if suspect
            .as_ref()
            .is_some_and(|r| matches!(r, Err(e) if *e == NEWER || *e == ACCESS))
        {
            return Err(suspect.unwrap().err().unwrap());
        }
        let damaged = suspect
            .as_ref()
            .is_some_and(|r| matches!(r, Err(e) if *e == AUTH_FAILED || *e == KEY_LOST));
        let suspect_generation = if damaged {
            profile
                .credential
                .as_ref()
                .and_then(|c| c.storage.generation())
        } else {
            None
        };
        if let Some(active) = &store.active_development_generation {
            if suspect_generation != Some(active.as_str()) {
                match self.key(active) {
                    Ok(_) => return Ok(Some(active.clone())),
                    Err(e) if e == KEY_LOST => (),
                    Err(e) => return Err(e),
                }
            }
        }
        Ok(Some(uuid::Uuid::new_v4().to_string()))
    }
    fn status(
        &self,
        profile: &str,
        c: &OwnedCredential,
    ) -> (CredentialStatus, Option<&'static str>) {
        match self.read(profile, c) {
            Ok(Some(_)) => (CredentialStatus::Configured, None),
            Ok(None) => (CredentialStatus::Missing, Some(RECOVERY)),
            Err(DEFERRED) => (CredentialStatus::Deferred, Some(DEFERRED)),
            Err(NEWER) => (CredentialStatus::Unsupported, Some(NEWER)),
            Err(e) => (CredentialStatus::Recovery, Some(e)),
        }
    }
    fn prepare_generation(&self, c: &OwnedCredential, fresh: bool) -> Result<()> {
        let generation = c.storage.generation().ok_or(DEFERRED)?;
        if !fresh {
            self.key(generation)?;
            return Ok(());
        }
        // Durable profile ownership precedes this call. Never overwrite a key or
        // regenerate it for any existing generation, even an incomplete stage.
        if !self.generation_absent(generation)? {
            return Err(ACCESS);
        }
        let dir = self.generation_dir(generation, true)?;
        let mut bytes = Zeroizing::new(vec![0u8; 38]);
        bytes[..5].copy_from_slice(KEY_MAGIC);
        bytes[5] = VERSION;
        getrandom::fill(&mut bytes[6..]).map_err(|_| "Secure randomness unavailable.")?;
        self.write(&dir, "master.key", &bytes)?;
        self.key(generation)?;
        Ok(())
    }
    fn read(&self, profile: &str, c: &OwnedCredential) -> Result<Option<Secret>> {
        let aad = Self::binding(profile, c)?;
        let key = self.key(c.storage.generation().ok_or(DEFERRED)?)?;
        let generation = self.generation_dir(c.storage.generation().unwrap(), false)?;
        if generation
            .entry_absent(OsStr::new("records"))
            .map_err(|_| ACCESS)?
        {
            return Ok(None);
        }
        let records = self.records(c, false)?;
        let Some(bytes) = bounded_read(&records, &Self::record_name(c)?, MAX_RECORD)? else {
            return Ok(None);
        };
        format(&bytes, RECORD_MAGIC)?;
        if !(47..=MAX_RECORD).contains(&bytes.len()) {
            return Err(RECOVERY);
        }
        let cipher = XChaCha20Poly1305::new_from_slice(&key[6..]).map_err(|_| KEY_LOST)?;
        let plaintext = Zeroizing::new(
            cipher
                .decrypt(
                    XNonce::from_slice(&bytes[6..30]),
                    Payload {
                        msg: &bytes[30..],
                        aad: &aad,
                    },
                )
                .map_err(|_| AUTH_FAILED)?,
        );
        // Printable ASCII means conversion is safe; avoid a secret-bearing UTF8 error.
        if plaintext.is_empty()
            || plaintext.len() > 4096
            || !plaintext.iter().all(|b| (33..=126).contains(b))
        {
            return Err(RECOVERY);
        }
        Ok(Some(Secret::new(
            String::from_utf8(plaintext.to_vec()).map_err(|_| RECOVERY)?,
        )))
    }
    fn add(&self, profile: &str, c: &OwnedCredential, value: &str) -> Result<()> {
        if !valid_key(value) {
            return Err("Invalid API key.");
        }
        let aad = Self::binding(profile, c)?;
        let key = self.key(c.storage.generation().ok_or(DEFERRED)?)?;
        let dir = self.records(c, true)?;
        let name = Self::record_name(c)?;
        if !dir.entry_absent(OsStr::new(&name)).map_err(|_| ACCESS)? {
            return Err("Credential identity already exists.");
        }
        let mut nonce = [0u8; 24];
        getrandom::fill(&mut nonce).map_err(|_| "Secure randomness unavailable.")?;
        let cipher = XChaCha20Poly1305::new_from_slice(&key[6..]).map_err(|_| KEY_LOST)?;
        let encrypted = cipher
            .encrypt(
                XNonce::from_slice(&nonce),
                Payload {
                    msg: value.as_bytes(),
                    aad: &aad,
                },
            )
            .map_err(|_| "Credential encryption failed.")?;
        let mut bytes = RECORD_MAGIC.to_vec();
        bytes.push(VERSION);
        bytes.extend_from_slice(&nonce);
        bytes.extend(encrypted);
        self.write(&dir, &name, &bytes)
    }
    fn delete(&self, profile: &str, c: &OwnedCredential) -> Result<()> {
        // Decrypt first: damaged-generation recovery artifacts and unknown versions
        // remain owned. Native references return deferred without an OS store call.
        if self.read(profile, c)?.is_none() {
            return Ok(());
        }
        let dir = self.records(c, false)?;
        dir.remove_file_if_exists(OsStr::new(&Self::record_name(c)?))
            .map_err(|_| ACCESS)?;
        dir.flush().map_err(|_| ACCESS)
    }
}
fn private(metadata: &Metadata, directory: bool) -> Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        if metadata.uid() != unsafe { libc::geteuid() }
            || (!directory && metadata.nlink() != 1)
            || metadata.mode() & 0o7777 != if directory { 0o700 } else { 0o600 }
        {
            return Err(ACCESS);
        }
    }
    #[cfg(not(unix))]
    {
        let _ = (metadata, directory);
    }
    Ok(())
}
fn bounded_read(
    dir: &DirectoryAnchor,
    name: &str,
    limit: usize,
) -> Result<Option<Zeroizing<Vec<u8>>>> {
    if dir.entry_absent(OsStr::new(name)).map_err(|_| ACCESS)? {
        return Ok(None);
    }
    let file = dir.open_file(OsStr::new(name)).map_err(|_| ACCESS)?;
    private(&file.metadata().map_err(|_| ACCESS)?, false)?;
    let mut bytes = Zeroizing::new(Vec::new());
    file.take(limit as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| ACCESS)?;
    // Keep at most limit+1 so callers can reject oversize without allocation
    // growth, after recognizing an unsupported version in the bounded header.
    Ok(Some(bytes))
}
fn format(bytes: &[u8], magic: &[u8]) -> Result<()> {
    if bytes.len() < 6 || &bytes[..5] != magic {
        return Err(RECOVERY);
    }
    if bytes[5] != VERSION {
        return Err(NEWER);
    }
    Ok(())
}
fn write_new(
    dir: &DirectoryAnchor,
    name: &str,
    bytes: &[u8],
    checkpoint: impl Fn(&str) -> Result<()>,
) -> Result<()> {
    let temporary = format!(".{}-{}.tmp", name, uuid::Uuid::new_v4());
    let result = (|| {
        let mut file: File = dir
            .create_new_file(OsStr::new(&temporary))
            .map_err(|_| ACCESS)?;
        private(&file.metadata().map_err(|_| ACCESS)?, false)?;
        checkpoint("write")?;
        file.write_all(bytes).map_err(|_| ACCESS)?;
        checkpoint("flush")?;
        flush_open_file(&file).map_err(|_| ACCESS)?;
        drop(file);
        checkpoint("publish")?;
        dir.rename_no_replace_to(OsStr::new(&temporary), dir, OsStr::new(name))
            .map_err(|_| ACCESS)?;
        checkpoint("after_publish")?;
        dir.flush().map_err(|_| ACCESS)
    })();
    if result.is_err() {
        let _ = dir.remove_file_if_exists(OsStr::new(&temporary));
    }
    result
}
#[cfg(test)]
mod tests;
