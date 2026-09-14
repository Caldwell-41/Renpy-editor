from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/renpy.rs"
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected one replacement, found {count}: {old[:300]}")
    text = text.replace(old, new, 1)


# The normal Unix adapter uses renpy.sh from the SDK root. For an operation that must
# remain bound to an already-open project directory, execute Ren'Py's native runtime
# directly and fchdir to that directory in the child before exec. This avoids both
# pathname re-resolution and the shell wrapper's SDK-cwd assumption.
replace_once(
    '''            let args = [
                OsString::from("launcher"),
                OsString::from("generate_gui"),
                OsString::from("."),''',
    '''            let args = [
                sdk.root.join("launcher").into_os_string(),
                OsString::from("generate_gui"),
                OsString::from("."),''',
)
replace_once(
    '''                launcher_args(&sdk.root, &args)?,
                Duration::from_secs(180),
            )?);''',
    '''                anchored_launcher_args(&sdk.root, &args)?,
                Duration::from_secs(180),
            )?);''',
)
replace_once(
    '''                    launcher_args(&sdk.root, &command)?,
                    Duration::from_secs(180),
                )?);''',
    '''                    anchored_launcher_args(&sdk.root, &command)?,
                    Duration::from_secs(180),
                )?);''',
)

needle = '''fn launcher_args(root: &Path, args: &[OsString]) -> Result<Vec<OsString>, RenpyError> {
'''
addition = '''#[cfg(unix)]
fn anchored_launcher_args(root: &Path, args: &[OsString]) -> Result<Vec<OsString>, RenpyError> {
    #[cfg(target_os = "macos")]
    let executable = root.join("lib/py3-mac-universal/renpy");
    #[cfg(target_os = "linux")]
    let executable = match std::env::consts::ARCH {
        "x86_64" => root.join("lib/py3-linux-x86_64/renpy"),
        "aarch64" => root.join("lib/py3-linux-aarch64/renpy"),
        _ => return Err(RenpyError::InvalidSdk),
    };
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    return Err(RenpyError::InvalidSdk);

    if !executable.is_file() || has_symlink_component(&executable) {
        return Err(RenpyError::InvalidSdk);
    }
    let mut value = vec![executable.into_os_string()];
    value.extend_from_slice(args);
    Ok(value)
}

'''
if text.count(needle) != 1:
    raise SystemExit("launcher_args insertion point mismatch")
text = text.replace(needle, addition + needle, 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C anchored Ren'Py invocation uses the native SDK runtime")
