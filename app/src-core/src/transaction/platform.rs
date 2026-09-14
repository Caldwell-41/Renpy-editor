use super::{path::ResolvedTarget, ErrorCode};
use serde::{Deserialize, Serialize};
#[cfg(not(windows))]
use std::fs;
use std::{
    fs::{File, OpenOptions},
    path::Path,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PlatformCapability {
    MacOsRenameSwap,
    WindowsReplaceWithBackup,
    DevelopmentRenameWithBackup,
}
impl PlatformCapability {
    pub fn current() -> Self {
        #[cfg(target_os = "macos")]
        {
            Self::MacOsRenameSwap
        }
        #[cfg(windows)]
        {
            Self::WindowsReplaceWithBackup
        }
        #[cfg(not(any(target_os = "macos", windows)))]
        {
            Self::DevelopmentRenameWithBackup
        }
    }
}

pub fn flush_file(path: &Path) -> Result<(), ErrorCode> {
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .open(path)
        .map_err(|_| ErrorCode::IoFailure)?;
    platform_sync(&file)
}

#[cfg(target_os = "macos")]
fn platform_sync(file: &File) -> Result<(), ErrorCode> {
    use std::os::fd::AsRawFd;
    let result = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_FULLFSYNC) };
    if result == 0 {
        Ok(())
    } else {
        Err(ErrorCode::UnsupportedFilesystem)
    }
}
#[cfg(not(target_os = "macos"))]
fn platform_sync(file: &File) -> Result<(), ErrorCode> {
    file.sync_all().map_err(|_| ErrorCode::IoFailure)
}

pub fn flush_directory(path: &Path) -> Result<(), ErrorCode> {
    #[cfg(unix)]
    {
        let file = File::open(path).map_err(|_| ErrorCode::IoFailure)?;
        file.sync_all().map_err(|_| ErrorCode::IoFailure)
    }
    #[cfg(windows)]
    {
        // Windows exposes no ordinary-user equivalent of a portable directory fsync.
        // Replacement is recoverable from its backup and the journal; file data is
        // flushed explicitly. Volume flush would require excessive privilege.
        let _ = path;
        Ok(())
    }
}

#[cfg(target_os = "macos")]
pub fn exchange_preserving_target(
    target: &ResolvedTarget,
    stage: &Path,
    backup: &Path,
) -> Result<(), ErrorCode> {
    use std::{ffi::CString, os::fd::AsRawFd, os::unix::ffi::OsStrExt};
    const RENAME_SWAP: u32 = 0x00000002;
    let parent = File::open(&target.parent).map_err(|_| ErrorCode::IoFailure)?;
    let target_name = CString::new(
        target
            .path
            .file_name()
            .ok_or(ErrorCode::UnsafePath)?
            .as_bytes(),
    )
    .map_err(|_| ErrorCode::UnsafePath)?;
    let stage_name = CString::new(stage.file_name().ok_or(ErrorCode::UnsafePath)?.as_bytes())
        .map_err(|_| ErrorCode::UnsafePath)?;
    let result = unsafe {
        libc::renameatx_np(
            parent.as_raw_fd(),
            stage_name.as_ptr(),
            parent.as_raw_fd(),
            target_name.as_ptr(),
            RENAME_SWAP,
        )
    };
    if result != 0 {
        return Err(ErrorCode::RecoveryRequired);
    }
    fs::rename(stage, backup).map_err(|_| ErrorCode::RecoveryRequired)?;
    flush_file(&target.path)?;
    flush_file(backup)?;
    flush_directory(&target.parent)
}

#[cfg(windows)]
pub fn exchange_preserving_target(
    target: &ResolvedTarget,
    stage: &Path,
    backup: &Path,
) -> Result<(), ErrorCode> {
    use std::{os::windows::ffi::OsStrExt, ptr};
    use windows_sys::Win32::Storage::FileSystem::ReplaceFileW;
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let target_w = wide(&target.path);
    let stage_w = wide(stage);
    let backup_w = wide(backup);
    let result = unsafe {
        ReplaceFileW(
            target_w.as_ptr(),
            stage_w.as_ptr(),
            backup_w.as_ptr(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
        )
    };
    if result == 0 {
        Err(ErrorCode::RecoveryRequired)
    } else {
        flush_file(&target.path)?;
        flush_file(backup)?;
        flush_directory(&target.parent)
    }
}

#[cfg(not(any(target_os = "macos", windows)))]
pub fn exchange_preserving_target(
    target: &ResolvedTarget,
    stage: &Path,
    backup: &Path,
) -> Result<(), ErrorCode> {
    // Linux is a deterministic development baseline, not a supported durability
    // target. Keep the displaced file before rename; target-platform CI exercises
    // the stronger primitives above.
    fs::rename(&target.path, backup).map_err(|_| ErrorCode::RecoveryRequired)?;
    match fs::rename(stage, &target.path) {
        Ok(()) => {
            flush_file(&target.path)?;
            flush_file(backup)?;
            flush_directory(&target.parent)
        }
        Err(_) => {
            let _ = fs::rename(backup, &target.path);
            Err(ErrorCode::RecoveryRequired)
        }
    }
}
