//! Opt-in, fixed public fixture. No credential import/read IPC or arbitrary paths.
use loomlight_core::{ai_profiles::ProfileStore, dispatch::ApplicationHost};
use serde_json::{json, Value};
use std::path::Path;
pub const FIXTURE: &str = include_str!("../../tests/fixtures/windows-studio-credentials.json");
pub fn phase(root: &Path) -> Result<Option<u8>, &'static str> {
    let Ok(phase) = std::env::var("LOOMLIGHT_STUDIO_WINDOWS_PHASE") else {
        return Ok(None);
    };
    if std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").as_deref() != Ok("studio-settings") {
        return Err("Windows fixture requires isolated Studio mode");
    }
    let phase = match phase.as_str() {
        "1" => 1,
        "2" => 2,
        _ => return Err("Windows fixture phase refused"),
    };
    if root.parent() != Some(std::env::temp_dir().as_path())
        || !root
            .file_name()
            .is_some_and(|s| s.to_string_lossy().starts_with("loomlight-studio-windows-"))
        || root
            .symlink_metadata()
            .map_err(|_| "Windows fixture root missing")?
            .file_type()
            .is_symlink()
    {
        return Err("Windows fixture root refused");
    }
    let store = loomlight_core::ai_profiles::decode(
        &std::fs::read(root.join("ai-profiles.json"))
            .map_err(|_| "Windows fixture records missing")?,
    )
    .map_err(|_| "Windows fixture records invalid")?;
    match std::env::var("LOOMLIGHT_STUDIO_WINDOWS_CONTRACT").as_deref() {
        Ok("2") => validate_current(&store, phase)?,
        Err(std::env::VarError::NotPresent) => validate(&store, phase)?,
        _ => return Err("Windows fixture contract refused"),
    }
    Ok(Some(phase))
}
/// Current connection Save publishes settings and the Windows adapter's owned key.
/// Exact fixture comparisons remain separate from historical credential entry.
pub(crate) fn validate_current(store: &ProfileStore, phase: u8) -> Result<(), &'static str> {
    let mut expected: ProfileStore = serde_json::from_str(FIXTURE).map_err(|_| "Windows fixture invalid")?;
    if phase == 2 {
        expected.revision = 5;
        for (profile, actual) in expected.profiles.iter_mut().zip(&store.profiles) {
            let credential = actual.credential.as_ref().ok_or("Current native credential missing")?;
            if credential.service != loomlight_core::ai_profiles::CredentialService::Legacy
                || !credential.storage.is_native() || credential.revision != 1
                || credential.origin != "http://127.0.0.1:46082"
            { return Err("Current native credential ownership refused"); }
            profile.credential = Some(credential.clone()); profile.revision = 2;
            profile.settings.context_ceiling = profile.settings.context_budget;
            profile.settings.thinking = Some(true); profile.settings.temperature = Some(1.0);
            profile.settings.top_p = Some(0.95); profile.settings.model_load = Some(Default::default());
        }
    } else if phase != 1 { return Err("Current Windows phase refused"); }
    if !store.valid() || *store != expected { return Err("Current Windows complete fixture state refused"); }
    Ok(())
}
pub(crate) fn validate(store: &ProfileStore, phase: u8) -> Result<(), &'static str> {
    let fixture: ProfileStore =
        serde_json::from_str(FIXTURE).map_err(|_| "Windows fixture invalid")?;
    if !fixture.valid()
        || !store.valid()
        || store.profiles.len() != 2
        || store.schema_version != 2
        || store.cleanup != fixture.cleanup
        || store.development_generations != fixture.development_generations
        || store.active_development_generation != fixture.active_development_generation
        || store
            .profiles
            .iter()
            .zip(&fixture.profiles)
            .any(|(p, f)| p.profile_id != f.profile_id || p.settings != f.settings || p.disabled)
        || (phase == 1 && *store != fixture)
        || (phase == 2
            && (store.revision != 5
                || store.profiles.iter().any(|p| {
                    p.revision != 2
                        || p.credential.as_ref().is_none_or(|c| {
                            !c.storage.is_native()
                                || c.service
                                    != loomlight_core::ai_profiles::CredentialService::Legacy
                                || c.origin != "http://127.0.0.1:46082"
                                || c.revision != 1
                        })
                })))
    {
        return Err("Windows fixture state refused");
    }
    Ok(())
}
pub fn step(host: &ApplicationHost, payload: Value) -> Result<Value, &'static str> {
    let Value::Object(fields) = &payload else {
        return Err("Windows fixture payload refused");
    };
    if fields.len() != 1 {
        return Err("Windows fixture payload refused");
    }
    let step = fields
        .get("step")
        .and_then(Value::as_str)
        .ok_or("Windows fixture step missing")?;
    let evidence = std::env::var("LOOMLIGHT_STUDIO_WINDOWS_EVIDENCE").as_deref() == Ok("1");
    let observation = step.strip_suffix("-observed").filter(|name| matches!(*name,
        "preflight-cancelled" | "alpha-saved" | "gamma-saved" | "cancelled" | "beta-reloaded" |
        "get-1-complete" | "get-2-complete" | "reopened" | "removed" | "complete"));
    if observation.is_some() && !evidence { return Err("Windows capture holds disabled"); }
    if observation.is_none() && !matches!(
        step,
        "preflight-cancel"
            | "preflight-cancelled"
            | "alpha-entry"
            | "alpha-saved"
            | "gamma-entry"
            | "gamma-saved"
            | "cancel-entry"
            | "cancelled"
            | "reopened"
            | "beta-entry"
            | "beta-saved"
            | "beta-reload-required"
            | "beta-reloaded"
            | "beta-reload-observed"
            | "removed"
            | "complete"
            | "get-1-complete"
            | "get-2-complete"
    ) {
        return Err("Windows fixture step refused");
    }
    let phase =
        std::env::var("LOOMLIGHT_STUDIO_WINDOWS_PHASE").map_err(|_| "Windows fixture disabled")?;
    if !matches!(phase.as_str(), "1" | "2")
        || std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").as_deref() != Ok("studio-settings")
    {
        return Err("Windows fixture disabled");
    }
    host.with_service(|s| {
        let root = s.ai_data_root();
        if let Some(name) = observation {
            let acknowledged = std::fs::read(root.join(format!(".studio-windows-observed-{phase}-{name}.json")))
                .ok().and_then(|b| serde_json::from_slice::<Value>(&b).ok());
            return Ok(json!({"observed":acknowledged == Some(json!({"phase":phase,"step":name,"observed":true}))}));
        }
        if step == "beta-reload-observed" {
            if phase != "2" { return Err("Windows reload observation phase refused"); }
            if std::env::var("LOOMLIGHT_STUDIO_WINDOWS_CONTRACT").as_deref() == Ok("2") {
                let acknowledged = std::fs::read(root.join(".studio-windows-current-reload-observed.json"))
                    .ok().and_then(|b| serde_json::from_slice::<Value>(&b).ok());
                return Ok(json!({"observed":acknowledged == Some(json!({"contract":2,"phase":2,"observed":true}))}));
            }
            let acknowledged = std::fs::read(root.join(".studio-windows-reload-observed.json"))
                .ok().and_then(|b| serde_json::from_slice::<Value>(&b).ok());
            return Ok(json!({"observed":acknowledged == Some(json!({"run":7,"phase":2,"observed":true}))}));
        }
        let marker = json!({"phase":phase,"step":step});
        if evidence {
            let millis = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)
                .map_err(|_| "Windows evidence clock unavailable")?.as_millis();
            std::fs::write(root.join(format!(".studio-windows-timing-{phase}-{step}.json")),
                json!({"phase":phase,"step":step,"unixMillis":millis}).to_string())
                .map_err(|_| "Windows evidence marker unavailable")?;
        }
        std::fs::write(root.join(".studio-windows-step.json"), marker.to_string())
            .map_err(|_| "Windows fixture step unavailable")?;
        if matches!(
            step,
            "preflight-cancelled"
                | "alpha-saved"
                | "gamma-saved"
                | "cancelled"
                | "reopened"
                | "beta-saved"
                | "beta-reload-required"
                | "beta-reloaded"
                | "removed"
                | "complete"
        ) {
            let bytes = std::fs::read(root.join("ai-profiles.json"))
                .map_err(|_| "Windows fixture snapshot unavailable")?;
            std::fs::write(
                root.join(format!(".studio-windows-{phase}-{step}.json")),
                bytes,
            )
            .map_err(|_| "Windows fixture snapshot unavailable")?;
        }
        Ok(json!({"recorded":true}))
    })
    .map_err(|_| "Windows fixture busy")?
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fixed_fixture_gate_rejects_wrong_origin_missing_key_and_untested_phase_state() {
        let fixture: ProfileStore = serde_json::from_str(FIXTURE).unwrap();
        assert!(validate(&fixture, 1).is_ok());
        assert!(validate(&fixture, 2).is_err());
        let mut wrong = fixture.clone();
        wrong.profiles[0].settings.endpoint = "http://127.0.0.1:46083/v1".into();
        assert!(validate(&wrong, 1).is_err());
        wrong = fixture;
        wrong.cleanup.clear();
        assert!(validate(&wrong, 1).is_err());
    }
}
