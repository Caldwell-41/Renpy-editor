//! Explicit packaged-test support. No alternate secret entry or credential writer.
use crate::ai_native::NativeSecrets;
use loomlight_core::{
    ai_credentials::{Records, Secrets},
    ai_profiles::{CredentialService, OwnedCredential},
    dispatch::ApplicationHost,
};
use serde_json::{json, Value};
use std::sync::Mutex;

pub fn config(phase: &str, endpoint: &str) -> Result<Value, &'static str> {
    let phase: u8 = phase.parse().map_err(|_| "Identity probe phase refused")?;
    if !(1..=4).contains(&phase) {
        return Err("Identity probe phase refused");
    }
    let port = endpoint
        .strip_prefix("http://127.0.0.1:")
        .and_then(|s| s.strip_suffix("/v1"))
        .and_then(|s| s.parse::<u16>().ok())
        .filter(|p| *p > 0)
        .ok_or("Identity probe endpoint must be explicit IPv4 loopback")?;
    if endpoint != format!("http://127.0.0.1:{port}/v1") {
        return Err("Identity probe endpoint refused");
    }
    Ok(json!({"phase":phase,"endpoint":endpoint}))
}

pub fn from_env() -> Result<Option<Value>, &'static str> {
    let Some(phase) = std::env::var_os("LOOMLIGHT_STUDIO_IDENTITY_PHASE") else {
        return Ok(None);
    };
    if std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").as_deref() != Ok("studio-settings") {
        return Err("Identity probe requires isolated Studio mode");
    }
    let endpoint = std::env::var("LOOMLIGHT_STUDIO_IDENTITY_ENDPOINT")
        .map_err(|_| "Identity probe endpoint missing")?;
    config(
        phase.to_str().ok_or("Identity probe phase refused")?,
        &endpoint,
    )
    .map(Some)
}

/// Manual native qualification uses the normal Settings UI and no injected script.
/// This opt-in only selects an isolated fixture root; it adds no secret IPC.
pub fn development_phase(phase: &str, root: &std::path::Path) -> Result<u8, &'static str> {
    let phase: u8 = phase.parse().map_err(|_| "Development phase refused")?;
    if !(1..=4).contains(&phase)
        || root.parent() != Some(std::env::temp_dir().as_path())
        || !root.file_name().is_some_and(|n| {
            n.to_string_lossy()
                .starts_with("loomlight-studio-dev-credentials-")
        })
        || std::fs::symlink_metadata(root)
            .map_err(|_| "Development root missing")?
            .file_type()
            .is_symlink()
        || !root.is_dir()
    {
        return Err("Development fixture refused");
    }
    Ok(phase)
}

/// Remember references only inside this app process and prove retired items absent.
/// Secret bytes are read only by the production Rust adapter and never returned.
pub fn audit(host: &ApplicationHost) -> Result<Value, &'static str> {
    static SEEN: Mutex<Vec<(String, OwnedCredential)>> = Mutex::new(Vec::new());
    let store = host.with_service(|s| s.read())??;
    let mut seen = SEEN.lock().map_err(|_| "Identity audit unavailable")?;
    let active: Vec<_> = store
        .profiles
        .iter()
        .filter_map(|p| {
            p.credential
                .as_ref()
                .map(|c| (p.profile_id.clone(), c.clone()))
        })
        .collect();
    if active
        .iter()
        .any(|(_, c)| c.service != CredentialService::Loomlight)
    {
        return Err("Identity audit refused legacy credential");
    }
    for item in &active {
        if !seen.contains(item) {
            seen.push(item.clone());
        }
    }
    let mut retired = 0;
    for (profile, credential) in seen.iter() {
        let exists = NativeSecrets.read(profile, credential)?.is_some();
        if active.contains(&(profile.clone(), credential.clone())) {
            if !exists {
                return Err("App-owned active credential missing");
            }
        } else {
            if exists {
                return Err("Retired app-owned credential still present");
            }
            retired += 1;
        }
    }
    Ok(
        json!({"active":active.len(),"retiredAbsent":retired,"cleanup":store.cleanup.len(),
        "processId":std::process::id(),
        "executablePath":std::env::current_exe().map_err(|_| "Executable path unavailable")?}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn development_mode_refuses_other_roots_and_phases() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-studio-dev-credentials-")
            .tempdir()
            .unwrap();
        assert_eq!(development_phase("3", root.path()).unwrap(), 3);
        for phase in ["0", "5", "bad"] {
            assert!(development_phase(phase, root.path()).is_err());
        }
        let other = tempfile::tempdir().unwrap();
        assert!(development_phase("1", other.path()).is_err());
        assert!(development_phase("1", &root.path().join("child")).is_err());
        let link = root.path().with_extension("link");
        std::os::unix::fs::symlink(root.path(), &link).unwrap();
        assert!(development_phase("1", &link).is_err());
        std::fs::remove_file(link).unwrap();
    }

    #[test]
    fn refuses_non_loopback_and_unselected_phases() {
        assert!(config("1", "http://127.0.0.1:12345/v1").is_ok());
        for endpoint in [
            "https://example.com/v1",
            "http://localhost:12345/v1",
            "http://127.0.0.1:0/v1",
            "http://127.0.0.1:65536/v1",
            "http://127.0.0.1:12345/v1/other",
            "http://127.0.0.1:12345/v1?x=1",
        ] {
            assert!(config("1", endpoint).is_err());
        }
        for phase in ["0", "5", "bad"] {
            assert!(config(phase, "http://127.0.0.1:12345/v1").is_err());
        }
    }
}
