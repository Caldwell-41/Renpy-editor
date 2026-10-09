//! Explicit fresh synthetic fixture only. No request/credential is started by setup.
use loomlight_core::{
    ai_credentials::Records, ai_profiles::ProfileStore, lifecycle::LifecycleService,
};
use std::path::Path;
pub const OWNER: &str = "loomlight-studio-request-v1\n";
pub fn prepare(root: &Path) -> Result<LifecycleService, &'static str> {
    if root.parent() != Some(std::env::temp_dir().as_path())
        || !root
            .file_name()
            .is_some_and(|s| s.to_string_lossy().starts_with("loomlight-studio-request-"))
        || root.is_symlink()
        || std::fs::read_to_string(root.join(".request-owner"))
            .ok()
            .as_deref()
            != Some(OWNER)
    {
        return Err("Request fixture root refused");
    }
    let entries = std::fs::read_dir(root)
        .map_err(|_| "Request fixture root unavailable")?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|_| "Request fixture root unavailable")?;
    if entries.len() != 1 {
        return Err("Request fixture is not fresh; no automatic recovery");
    }
    let s = LifecycleService::prepare_source_foundation_probe(root.to_owned())
        .map_err(|_| "Synthetic source fixture failed")?;
    let profile: ProfileStore = serde_json::from_str(include_str!(
        "../../tests/fixtures/studio-request/profiles.json"
    ))
    .map_err(|_| "Synthetic profile fixture failed")?;
    s.write(&profile, &ProfileStore::default())?;
    Ok(s)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn setup_is_fresh_owned_synthetic_only_and_never_creates_credentials() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-request-")
            .tempdir()
            .unwrap();
        assert!(prepare(root.path()).is_err());
        std::fs::write(root.path().join(".request-owner"), OWNER).unwrap();
        let service = prepare(root.path()).unwrap();
        let store = service.read().unwrap();
        assert!(store.valid());
        assert_eq!(store.profiles.len(), 1);
        assert!(store.profiles[0].credential.is_none());
        assert!(!root.path().join("credentials-dev").exists());
        assert!(service.current().is_none());
        assert!(prepare(root.path()).is_err());
    }
}
