from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
renpy = ROOT / "app/src-core/src/renpy.rs"
lifecycle = ROOT / "app/src-core/src/lifecycle.rs"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement, found {count}: {old[:400]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    renpy,
    '''fn write_managed_provenance(path: &Path, sdk: &ValidatedSdk) -> Result<(), RenpyError> {
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(path)
        .map_err(|_| RenpyError::Io)?;
    file.write_all(managed_provenance(sdk).as_bytes())
        .and_then(|_| file.sync_all())
        .map_err(|_| RenpyError::Io)
}
''',
    '''fn write_managed_provenance(path: &Path, sdk: &ValidatedSdk) -> Result<(), RenpyError> {
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(path)
        .map_err(|_| RenpyError::Io)?;
    file.write_all(managed_provenance(sdk).as_bytes())
        .and_then(|_| file.sync_all())
        .map_err(|_| RenpyError::Io)
}

fn remove_repairable_embedded_provenance(path: &Path) -> Result<(), RenpyError> {
    match fs::symlink_metadata(path) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err(RenpyError::InvalidSdk),
        Ok(metadata)
            if metadata.is_file() && !crate::transaction::is_link_or_reparse(&metadata) =>
        {
            fs::remove_file(path).map_err(|_| RenpyError::Io)
        }
        Ok(_) => Err(RenpyError::InvalidSdk),
    }
}
''',
)

replace_once(
    renpy,
    '''    if provenance_matches(&legacy, &sdk)? {
        write_managed_provenance(&embedded, &sdk)?;
        sync_directory(&destination).map_err(|_| RenpyError::Io)?;
        let _ = fs::remove_file(&legacy);
        let _ = sync_directory(destination.parent().ok_or(RenpyError::Io)?);
        return Ok(Some(sdk));
    }
''',
    '''    if provenance_matches(&legacy, &sdk)? {
        // Keep the valid legacy sidecar authoritative until the replacement embedded
        // provenance has been fully written and the SDK directory has been flushed.
        // A crash during migration can therefore be retried on the next launch.
        remove_repairable_embedded_provenance(&embedded)?;
        write_managed_provenance(&embedded, &sdk)?;
        sync_directory(&destination).map_err(|_| RenpyError::Io)?;
        let _ = fs::remove_file(&legacy);
        let _ = sync_directory(destination.parent().ok_or(RenpyError::Io)?);
        return Ok(Some(sdk));
    }
''',
)

replace_once(
    lifecycle,
    '''        fs::rename(&embedded_provenance, &legacy_provenance).unwrap();
        let migrated = crate::renpy::discover_managed_sdk(&managed_state)
            .unwrap()
            .expect("legacy provenance should migrate into the managed SDK");
''',
    '''        fs::rename(&embedded_provenance, &legacy_provenance).unwrap();
        // Simulate interruption after an embedded migration file has been created but
        // before it became complete/durable. The still-valid legacy provenance must
        // make the migration safely retryable rather than wedging SDK discovery.
        fs::write(&embedded_provenance, b"truncated-migration").unwrap();
        let migrated = crate::renpy::discover_managed_sdk(&managed_state)
            .unwrap()
            .expect("legacy provenance should repair an interrupted embedded migration");
''',
)

print("Phase 1C legacy SDK provenance migration made retryable")
