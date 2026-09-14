from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected one replacement, found {count}: {old[:300]}")
    text = text.replace(old, new, 1)


replace_once(
    '''        if prepared.is_err() && stage.path.exists() {\n            let _ = cleanup_stage(&stage);\n        }''',
    '''        if prepared.is_err() && stage.path.exists() {\n            let _ = cleanup_stage(parent, &mut stage);\n        }''',
)

old_cleanup = '''fn cleanup_stage(stage: &StageAnchor) -> Result<(), LifecycleError> {\n    if stage.file.is_some() {\n        validate_stage_identity(stage)?;\n    } else {\n        let live = open_stage_directory(&stage.path).map_err(|_| LifecycleError::UnsafePath)?;\n        if identity(&live).map_err(|_| LifecycleError::UnsafePath)? != stage.identity {\n            return Err(LifecycleError::UnsafePath);\n        }\n        let marker = format!("loomlight-project-stage-v1\\n{}\\n", stage.token);\n        if fs::read_to_string(stage.path.join(STAGE_MARKER))\n            .ok()\n            .as_deref()\n            != Some(marker.as_str())\n        {\n            return Err(LifecycleError::UnsafePath);\n        }\n    }\n    fs::remove_dir_all(&stage.path).map_err(|_| LifecycleError::Io)\n}\n'''
new_cleanup = '''fn cleanup_stage(\n    parent: &ParentAnchor,\n    stage: &mut StageAnchor,\n) -> Result<(), LifecycleError> {\n    let marker = format!("loomlight-project-stage-v1\\n{}\\n", stage.token);\n    if stage.file.is_some() {\n        validate_stage_identity(stage)?;\n    } else {\n        let live = open_stage_directory(&stage.path).map_err(|_| LifecycleError::UnsafePath)?;\n        if identity(&live).map_err(|_| LifecycleError::UnsafePath)? != stage.identity\n            || fs::read_to_string(stage.path.join(STAGE_MARKER))\n                .ok()\n                .as_deref()\n                != Some(marker.as_str())\n        {\n            return Err(LifecycleError::UnsafePath);\n        }\n    }\n\n    drop(stage.file.take());\n    let quarantine_name = format!(\n        ".loomlight-abandoned-stage-{}",\n        uuid::Uuid::new_v4()\n    );\n    promote_no_replace(parent, &stage.name, &quarantine_name)?;\n    let quarantine_path = parent.path.join(&quarantine_name);\n    let quarantined =\n        open_stage_directory(&quarantine_path).map_err(|_| LifecycleError::UnsafePath)?;\n    let quarantined_identity =\n        identity(&quarantined).map_err(|_| LifecycleError::UnsafePath)?;\n    if quarantined_identity != stage.identity\n        || has_symlink_component(&quarantine_path)\n        || fs::read_to_string(quarantine_path.join(STAGE_MARKER))\n            .ok()\n            .as_deref()\n            != Some(marker.as_str())\n    {\n        return Err(LifecycleError::UnsafePath);\n    }\n    drop(quarantined);\n    fs::remove_dir_all(quarantine_path).map_err(|_| LifecycleError::Io)\n}\n'''
replace_once(old_cleanup, new_cleanup)

replace_once(
    '''    if promoted_identity != stage.identity\n        || has_symlink_component(&final_path)\n        || fs::read_to_string(final_path.join(STAGE_MARKER))\n            .ok()\n            .as_deref()\n            != Some(marker.as_str())\n    {\n        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());''',
    '''    if promoted_identity != stage.identity\n        || has_symlink_component(&final_path)\n        || fs::read_to_string(final_path.join(STAGE_MARKER))\n            .ok()\n            .as_deref()\n            != Some(marker.as_str())\n    {\n        drop(promoted);\n        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());''',
)

replace_once(
    '''fn initialise_git(stage: &Path) -> Result<(), LifecycleError> {\n    initialise_git_with_anchor("git", stage, None)\n}\n\nfn initialise_git_with(program: &str, stage: &Path) -> Result<(), LifecycleError> {\n    initialise_git_with_anchor(program, stage, None)\n}\n''',
    '''#[cfg(test)]\nfn initialise_git_with(program: &str, stage: &Path) -> Result<(), LifecycleError> {\n    initialise_git_with_anchor(program, stage, None)\n}\n''',
)

replace_once(
    '''    #[test]\n    fn stage_identity_rejects_same_name_replacement_before_promotion() {''',
    '''    #[cfg(unix)]\n    #[test]\n    fn stage_identity_rejects_same_name_replacement_before_promotion() {''',
)

replace_once(
    '''    fn substitution_after_final_validation_never_survives_as_final() {\n        let temp = tempfile::tempdir().unwrap();\n        let parent_path = temp.path().join("projects");\n        fs::create_dir(&parent_path).unwrap();\n        let parent = open_parent(&parent_path).unwrap();\n        let token = uuid::Uuid::new_v4().to_string();''',
    '''    fn substitution_after_final_validation_never_survives_as_final() {\n        let temp = tempfile::tempdir().unwrap();\n        let requested_parent = temp.path().join("projects");\n        fs::create_dir(&requested_parent).unwrap();\n        let parent = open_parent(&requested_parent).unwrap();\n        let parent_path = parent.path.clone();\n        let token = uuid::Uuid::new_v4().to_string();''',
)

path.write_text(text, encoding="utf-8")
print("Phase 1C platform fixups applied")
