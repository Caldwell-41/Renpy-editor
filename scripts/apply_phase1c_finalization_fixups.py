from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")

old = '''            fs::remove_file(final_path.join(STAGE_MARKER))
                .map_err(|_| LifecycleError::CreatedNotOpened)?;
            let opened = open_valid_project(&final_path)?;'''
new = '''            let opened = open_valid_project(&final_path)?;'''
if text.count(old) != 1:
    raise SystemExit("expected one post-promotion marker removal")
text = text.replace(old, new, 1)

old = '''    if promoted_identity != stage.identity
        || has_symlink_component(&final_path)
        || fs::read_to_string(final_path.join(STAGE_MARKER))
            .ok()
            .as_deref()
            != Some(marker.as_str())
    {
        drop(promoted);
        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());
        let _ = promote_no_replace(parent, final_name, &quarantine);
        return Err(LifecycleError::PromotionFailed);
    }
    Ok(())
}'''
new = '''    if promoted_identity != stage.identity
        || has_symlink_component(&final_path)
        || fs::read_to_string(final_path.join(STAGE_MARKER))
            .ok()
            .as_deref()
            != Some(marker.as_str())
    {
        drop(promoted);
        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());
        let _ = promote_no_replace(parent, final_name, &quarantine);
        return Err(LifecycleError::PromotionFailed);
    }
    drop(promoted);

    let final_anchor = crate::transaction::DirectoryAnchor::open_root(&final_path)
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    if final_anchor.identity().volume != stage.identity.a
        || final_anchor.identity().file != stage.identity.b
    {
        drop(final_anchor);
        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());
        let _ = promote_no_replace(parent, final_name, &quarantine);
        return Err(LifecycleError::PromotionFailed);
    }
    final_anchor
        .remove_file_if_exists(std::ffi::OsStr::new(STAGE_MARKER))
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    final_anchor
        .flush()
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    Ok(())
}'''
if text.count(old) != 1:
    raise SystemExit("expected one promoted-stage verification block")
text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C final marker cleanup anchored")
