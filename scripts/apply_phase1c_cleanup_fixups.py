from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")
old = '''fn write_replace(path: &Path, bytes: &[u8]) -> Result<(), LifecycleError> {
    let meta = fs::symlink_metadata(path).map_err(|_| LifecycleError::Io)?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(LifecycleError::UnsafePath);
    }
    let mut file = OpenOptions::new()
        .truncate(true)
        .write(true)
        .open(path)
        .map_err(|_| LifecycleError::Io)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)
}

fn write_new_or_replace(path: &Path, bytes: &[u8]) -> Result<(), LifecycleError> {
    match fs::symlink_metadata(path) {
        Ok(_) => write_replace(path, bytes),
        Err(error) if error.kind() == io::ErrorKind::NotFound => write_new(path, bytes),
        Err(_) => Err(LifecycleError::Io),
    }
}

'''
if text.count(old) != 1:
    raise SystemExit("expected obsolete path-writer block")
path.write_text(text.replace(old, "", 1), encoding="utf-8")
print("Phase 1C obsolete path writers removed")
