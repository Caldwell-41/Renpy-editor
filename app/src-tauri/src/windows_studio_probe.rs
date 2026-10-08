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
    validate(&store, phase)?;
    Ok(Some(phase))
}
fn validate(store: &ProfileStore, phase: u8) -> Result<(), &'static str> {
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
            && store.profiles.iter().any(|p| {
                p.revision != 2
                    || p.credential.as_ref().is_none_or(|c| {
                        !c.storage.is_native()
                            || c.origin != "http://127.0.0.1:46082"
                            || c.revision != 1
                    })
            }))
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
    if !matches!(
        step,
        "alpha-entry"
            | "alpha-saved"
            | "gamma-entry"
            | "gamma-saved"
            | "cancel-entry"
            | "cancelled"
            | "reopened"
            | "beta-entry"
            | "beta-saved"
            | "removed"
            | "complete"
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
        let marker = json!({"phase":phase,"step":step});
        std::fs::write(root.join(".studio-windows-step.json"), marker.to_string())
            .map_err(|_| "Windows fixture step unavailable")?;
        if matches!(
            step,
            "alpha-saved"
                | "gamma-saved"
                | "cancelled"
                | "reopened"
                | "beta-saved"
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
