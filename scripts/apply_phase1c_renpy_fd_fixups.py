from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/renpy.rs"
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected one replacement, found {count}: {old[:300]}")
    text = text.replace(old, new, 1)


# Use a process-inherited descriptor path for the project, not the child's cwd.
replace_once(
    '''                OsString::from("generate_gui"),
                OsString::from("."),
                OsString::from("--width"),''',
    '''                OsString::from("generate_gui"),
                anchored_directory_argument(stage_anchor)?,
                OsString::from("--width"),''',
)
replace_once(
    '''                vec![OsString::from("."), OsString::from("compile")],
                vec![
                    OsString::from("."),
                    OsString::from("lint"),''',
    '''                vec![anchored_directory_argument(stage_anchor)?, OsString::from("compile")],
                vec![
                    anchored_directory_argument(stage_anchor)?,
                    OsString::from("lint"),''',
)

# Replace the pre-exec fchdir with descriptor inheritance. fcntl is async-signal-safe;
# the SDK cwd remains unchanged so renpy.sh can locate its own runtime.
replace_once(
    '''                if let Some(fd) = anchored_cwd_fd {
                    if libc::fchdir(fd) != 0 {
                        return Err(io::Error::last_os_error());
                    }
                }
                Ok(())''',
    '''                if let Some(fd) = anchored_cwd_fd {
                    let flags = libc::fcntl(fd, libc::F_GETFD);
                    if flags < 0 || libc::fcntl(fd, libc::F_SETFD, flags & !libc::FD_CLOEXEC) != 0 {
                        return Err(io::Error::last_os_error());
                    }
                }
                Ok(())''',
)

needle = '''#[cfg(not(windows))]
fn command_path(path: &Path) -> OsString {
    path.as_os_str().to_owned()
}
'''
addition = '''#[cfg(target_os = "macos")]
fn anchored_directory_argument(directory: &File) -> Result<OsString, RenpyError> {
    use std::os::fd::AsRawFd;
    Ok(OsString::from(format!("/dev/fd/{}", directory.as_raw_fd())))
}

#[cfg(all(unix, not(target_os = "macos")))]
fn anchored_directory_argument(directory: &File) -> Result<OsString, RenpyError> {
    use std::os::fd::AsRawFd;
    Ok(OsString::from(format!(
        "/proc/self/fd/{}",
        directory.as_raw_fd()
    )))
}

'''
if text.count(needle) != 1:
    raise SystemExit("command_path insertion point mismatch")
text = text.replace(needle, addition + needle, 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C Ren'Py anchored project argument fixed")
