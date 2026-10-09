//! Opt-in disposable prompt fixture; no production provider/request behavior.
use loomlight_core::lifecycle::LifecycleService;
use serde_json::{json, Value};
use std::{fs, path::Path};
pub fn prepare(root: &Path, reopen: bool) -> Result<LifecycleService, Box<dyn std::error::Error>> {
    if !root.starts_with(std::env::temp_dir())
        || !root
            .file_name()
            .is_some_and(|s| s.to_string_lossy().starts_with("loomlight-prompt-"))
    {
        return Err("Prompt fixture root refused".into());
    }
    if reopen {
        return Ok(LifecycleService::new(root.to_path_buf()).map_err(|_| "Prompt reopen failed")?);
    }
    if root.exists() {
        return Err("Prompt fixture already exists".into());
    }
    let service = LifecycleService::prepare_source_foundation_probe(root.to_path_buf())?;
    let editor = root.join("synthetic-project/.renpy-editor");
    let project: Value = serde_json::from_slice(&fs::read(editor.join("project.json"))?)?;
    let mut refs: Value = serde_json::from_str(include_str!(
        "../../tests/fixtures/reference-library/manual-save.json"
    ))?;
    refs["projectId"] = project["projectId"].clone();
    let lore = &mut refs["loreEntries"][0];
    lore["approvedRevisionId"] = lore["currentRevisionId"].clone();
    lore["revisions"][0]["status"] = json!("approved");
    lore["revisions"][0]["reviewedAt"] = json!("2026-10-10T00:00:00Z");
    lore["revisions"][0]["content"]["citations"] = json!([]);
    fs::write(
        editor.join("references.json"),
        serde_json::to_vec_pretty(&refs)?,
    )?;
    fs::write(
        editor.join("ai.json"),
        serde_json::to_vec_pretty(
            &json!({"schemaVersion":1,"projectId":project["projectId"],"prompts":{"futureAction":{"text":"Unrelated action retained"}},"styleNotes":"Public fixture style notes.","futureSettings":{"retained":true}}),
        )?,
    )?;
    Ok(service)
}
