from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")

open_stage = '''fn open_stage_anchor(
    path: PathBuf,
    name: String,
    token: String,
) -> Result<StageAnchor, LifecycleError> {
'''
if text.count(open_stage) != 1:
    raise SystemExit("open_stage_anchor definition missing")
text = text.replace(open_stage, "#[cfg(test)]\n" + open_stage, 1)

needle = '''#[cfg(target_os = "linux")]
fn promote_no_replace(
'''
helper = '''#[cfg(all(test, unix))]
fn restrict_directory(path: &Path) -> Result<(), LifecycleError> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| LifecycleError::Io)
}
#[cfg(all(test, windows))]
fn restrict_directory(_path: &Path) -> Result<(), LifecycleError> {
    Ok(())
}

'''
if text.count(needle) != 1:
    raise SystemExit("promote_no_replace insertion point missing")
if "fn restrict_directory(path: &Path)" not in text:
    text = text.replace(needle, helper + needle, 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C legacy helpers scoped to tests")
