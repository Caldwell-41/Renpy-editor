use super::{identity::identity_for_file, path::is_link_or_reparse, ErrorCode, FileIdentity};
use serde::{Deserialize, Serialize};
use std::{
    ffi::OsStr,
    fs::{self, File},
    io,
    path::{Path, PathBuf},
    sync::Arc,
};

#[cfg(unix)]
use std::ffi::CString;
#[cfg(windows)]
use std::fs::OpenOptions;

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

#[derive(Clone, Debug)]
struct DirectoryGuard {
    path: PathBuf,
    identity: FileIdentity,
    handle: Arc<File>,
}

/// A directory reached through a validated handle chain. Windows handles omit
/// FILE_SHARE_DELETE and pin every component. Unix child operations are relative to
/// the retained descriptors and use O_NOFOLLOW; the chain is revalidated at every
/// externally interruptible boundary.
#[derive(Clone, Debug)]
pub struct DirectoryAnchor {
    chain: Vec<DirectoryGuard>,
}

impl DirectoryAnchor {
    pub fn open_root(path: &Path) -> Result<Self, ErrorCode> {
        let handle = open_directory_path(path).map_err(|_| ErrorCode::UnsafePath)?;
        let metadata = fs::symlink_metadata(path).map_err(|_| ErrorCode::UnsafePath)?;
        if !metadata.is_dir() || is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let identity = identity_for_file(&handle).map_err(|_| ErrorCode::IoFailure)?;
        Ok(Self {
            chain: vec![DirectoryGuard {
                path: path.to_path_buf(),
                identity,
                handle: Arc::new(handle),
            }],
        })
    }

    pub fn open_child(&self, name: &OsStr, create: bool) -> Result<Self, ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        if create {
            match create_directory_at(self.handle(), &self.path().join(name), name) {
                Ok(()) => self.flush()?,
                Err(error) if error.kind() == io::ErrorKind::AlreadyExists => {}
                Err(_) => return Err(ErrorCode::IoFailure),
            }
        }
        let path = self.path().join(name);
        let handle =
            open_directory_at(self.handle(), &path, name).map_err(|_| ErrorCode::UnsafePath)?;
        let metadata = fs::symlink_metadata(&path).map_err(|_| ErrorCode::UnsafePath)?;
        if !metadata.is_dir() || is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let identity = identity_for_file(&handle).map_err(|_| ErrorCode::IoFailure)?;
        let mut chain = self.chain.clone();
        chain.push(DirectoryGuard {
            path,
            identity,
            handle: Arc::new(handle),
        });
        let result = Self { chain };
        result.validate_chain()?;
        Ok(result)
    }

    pub fn path(&self) -> &Path {
        &self.chain.last().expect("anchor has root").path
    }

    pub fn identity(&self) -> &FileIdentity {
        &self.chain.last().expect("anchor has root").identity
    }

    pub fn validate_chain(&self) -> Result<(), ErrorCode> {
        for guard in &self.chain {
            let metadata =
                fs::symlink_metadata(&guard.path).map_err(|_| ErrorCode::ParentIdentityChanged)?;
            if !metadata.is_dir() || is_link_or_reparse(&metadata) {
                return Err(ErrorCode::ParentIdentityChanged);
            }
            let current = open_directory_path(&guard.path)
                .and_then(|file| identity_for_file(&file))
                .map_err(|_| ErrorCode::ParentIdentityChanged)?;
            if current != guard.identity {
                return Err(ErrorCode::ParentIdentityChanged);
            }
        }
        Ok(())
    }

    pub fn open_file(&self, name: &OsStr) -> Result<File, ErrorCode> {
        self.open_file_with_access(name, false)
    }

    pub fn open_file_for_flush(&self, name: &OsStr) -> Result<File, ErrorCode> {
        self.open_file_with_access(name, true)
    }

    fn open_file_with_access(&self, name: &OsStr, write: bool) -> Result<File, ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        let path = self.path().join(name);
        let path_metadata = fs::symlink_metadata(&path).map_err(|_| ErrorCode::IoFailure)?;
        if !path_metadata.is_file() || is_link_or_reparse(&path_metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let file = open_file_at(self.handle(), &path, name, false, write)
            .map_err(|_| ErrorCode::IoFailure)?;
        let metadata = file.metadata().map_err(|_| ErrorCode::IoFailure)?;
        if !metadata.is_file() || is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        Ok(file)
    }

    pub fn create_new_file(&self, name: &OsStr) -> Result<File, ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        open_file_at(self.handle(), &self.path().join(name), name, true, true)
            .map_err(|_| ErrorCode::IoFailure)
    }

    pub fn entry_absent(&self, name: &OsStr) -> Result<bool, ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        entry_absent_at(self.handle(), &self.path().join(name), name)
            .map_err(|_| ErrorCode::RecoveryRequired)
    }

    pub fn remove_file_if_exists(&self, name: &OsStr) -> Result<(), ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        match remove_file_at(self.handle(), &self.path().join(name), name) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
            Err(_) => Err(ErrorCode::RecoveryRequired),
        }
    }

    pub fn rename_within(&self, from: &OsStr, to: &OsStr) -> Result<(), ErrorCode> {
        validate_name(from)?;
        validate_name(to)?;
        self.validate_chain()?;
        rename_at(
            self.handle(),
            &self.path().join(from),
            from,
            self.handle(),
            &self.path().join(to),
            to,
        )
        .map_err(|_| ErrorCode::RecoveryRequired)
    }

    /// Atomically replaces one regular application-local file with another file in
    /// this retained directory. Callers must validate the destination kind first.
    pub fn replace_file_within(&self, from: &OsStr, to: &OsStr) -> Result<(), ErrorCode> {
        validate_name(from)?;
        validate_name(to)?;
        self.validate_chain()?;
        replace_file_at(
            self.handle(),
            &self.path().join(from),
            from,
            self.handle(),
            &self.path().join(to),
            to,
        )
        .map_err(|_| ErrorCode::RecoveryRequired)?;
        self.validate_chain()
    }

    pub fn rename_no_replace_to(
        &self,
        from: &OsStr,
        destination: &Self,
        to: &OsStr,
    ) -> Result<(), ErrorCode> {
        validate_name(from)?;
        validate_name(to)?;
        self.validate_chain()?;
        destination.validate_chain()?;
        rename_no_replace_at(
            self.handle(),
            &self.path().join(from),
            from,
            destination.handle(),
            &destination.path().join(to),
            to,
        )
        .map_err(|_| ErrorCode::RecoveryRequired)?;
        self.validate_chain()?;
        destination.validate_chain()
    }

    pub fn flush(&self) -> Result<(), ErrorCode> {
        #[cfg(unix)]
        {
            self.handle().sync_all().map_err(|_| ErrorCode::IoFailure)
        }
        #[cfg(windows)]
        {
            Ok(())
        }
    }

    fn handle(&self) -> &File {
        self.chain.last().expect("anchor has root").handle.as_ref()
    }
}

fn validate_name(name: &OsStr) -> Result<(), ErrorCode> {
    let path = Path::new(name);
    if name.is_empty() || path.components().count() != 1 || path.file_name() != Some(name) {
        Err(ErrorCode::UnsafePath)
    } else {
        Ok(())
    }
}

#[cfg(unix)]
fn c_name(name: &OsStr) -> Result<CString, ErrorCode> {
    use std::os::unix::ffi::OsStrExt;
    CString::new(name.as_bytes()).map_err(|_| ErrorCode::UnsafePath)
}

#[cfg(unix)]
fn open_directory_path(path: &Path) -> io::Result<File> {
    use std::os::{fd::FromRawFd, unix::ffi::OsStrExt};
    let value = CString::new(path.as_os_str().as_bytes())?;
    let fd = unsafe {
        libc::open(
            value.as_ptr(),
            libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
        )
    };
    if fd < 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(unsafe { File::from_raw_fd(fd) })
    }
}

#[cfg(windows)]
fn open_directory_path(path: &Path) -> io::Result<File> {
    use std::os::windows::fs::OpenOptionsExt;
    use windows_sys::Win32::Storage::FileSystem::{
        FILE_FLAG_BACKUP_SEMANTICS, FILE_FLAG_OPEN_REPARSE_POINT, FILE_SHARE_READ, FILE_SHARE_WRITE,
    };
    OpenOptions::new()
        .read(true)
        .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
}

#[cfg(unix)]
fn open_directory_at(parent: &File, _path: &Path, name: &OsStr) -> io::Result<File> {
    use std::os::fd::{AsRawFd, FromRawFd};
    let name = c_name(name).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let fd = unsafe {
        libc::openat(
            parent.as_raw_fd(),
            name.as_ptr(),
            libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
        )
    };
    if fd < 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(unsafe { File::from_raw_fd(fd) })
    }
}

#[cfg(windows)]
fn open_directory_at(_parent: &File, path: &Path, _name: &OsStr) -> io::Result<File> {
    open_directory_path(path)
}

#[cfg(unix)]
fn create_directory_at(parent: &File, _path: &Path, name: &OsStr) -> io::Result<()> {
    use std::os::fd::AsRawFd;
    let name = c_name(name).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    if unsafe { libc::mkdirat(parent.as_raw_fd(), name.as_ptr(), 0o700) } == 0 {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(windows)]
fn create_directory_at(_parent: &File, path: &Path, _name: &OsStr) -> io::Result<()> {
    fs::create_dir(path)
}

#[cfg(unix)]
fn open_file_at(
    parent: &File,
    _path: &Path,
    name: &OsStr,
    create: bool,
    write: bool,
) -> io::Result<File> {
    use std::os::fd::{AsRawFd, FromRawFd};
    let name = c_name(name).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let flags = if create {
        libc::O_WRONLY | libc::O_CREAT | libc::O_EXCL
    } else if write {
        libc::O_RDWR
    } else {
        libc::O_RDONLY
    };
    let fd = unsafe {
        libc::openat(
            parent.as_raw_fd(),
            name.as_ptr(),
            flags | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            0o600,
        )
    };
    if fd < 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(unsafe { File::from_raw_fd(fd) })
    }
}

#[cfg(windows)]
fn open_file_at(
    _parent: &File,
    path: &Path,
    _name: &OsStr,
    create: bool,
    write: bool,
) -> io::Result<File> {
    use std::os::windows::fs::OpenOptionsExt;
    use windows_sys::Win32::Storage::FileSystem::{
        FILE_FLAG_OPEN_REPARSE_POINT, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_WRITE,
    };
    let mut options = OpenOptions::new();
    options
        .read(!create || write)
        .write(create || write)
        .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE)
        .custom_flags(FILE_FLAG_OPEN_REPARSE_POINT);
    if create {
        options.create_new(true);
    }
    options.open(path)
}

#[cfg(unix)]
fn remove_file_at(parent: &File, _path: &Path, name: &OsStr) -> io::Result<()> {
    use std::os::fd::AsRawFd;
    let name = c_name(name).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    if unsafe { libc::unlinkat(parent.as_raw_fd(), name.as_ptr(), 0) } == 0 {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(windows)]
fn remove_file_at(_parent: &File, path: &Path, _name: &OsStr) -> io::Result<()> {
    fs::remove_file(path)
}

#[cfg(unix)]
fn entry_absent_at(parent: &File, _path: &Path, name: &OsStr) -> io::Result<bool> {
    use std::{mem::MaybeUninit, os::fd::AsRawFd};
    let name = c_name(name).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let mut metadata = MaybeUninit::<libc::stat>::uninit();
    let result = unsafe {
        libc::fstatat(
            parent.as_raw_fd(),
            name.as_ptr(),
            metadata.as_mut_ptr(),
            libc::AT_SYMLINK_NOFOLLOW,
        )
    };
    if result == 0 {
        Ok(false)
    } else {
        let error = io::Error::last_os_error();
        if error.kind() == io::ErrorKind::NotFound {
            Ok(true)
        } else {
            Err(error)
        }
    }
}

#[cfg(windows)]
fn entry_absent_at(_parent: &File, path: &Path, _name: &OsStr) -> io::Result<bool> {
    match fs::symlink_metadata(path) {
        Ok(_) => Ok(false),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(true),
        Err(error) => Err(error),
    }
}

#[cfg(unix)]
fn rename_at(
    from_parent: &File,
    _from_path: &Path,
    from: &OsStr,
    to_parent: &File,
    _to_path: &Path,
    to: &OsStr,
) -> io::Result<()> {
    use std::os::fd::AsRawFd;
    let from = c_name(from).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let to = c_name(to).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    if unsafe {
        libc::renameat(
            from_parent.as_raw_fd(),
            from.as_ptr(),
            to_parent.as_raw_fd(),
            to.as_ptr(),
        )
    } == 0
    {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(unix)]
fn replace_file_at(
    from_parent: &File,
    _from_path: &Path,
    from: &OsStr,
    to_parent: &File,
    _to_path: &Path,
    to: &OsStr,
) -> io::Result<()> {
    rename_at(
        from_parent,
        Path::new(""),
        from,
        to_parent,
        Path::new(""),
        to,
    )
}

#[cfg(target_os = "linux")]
fn rename_no_replace_at(
    from_parent: &File,
    _from_path: &Path,
    from: &OsStr,
    to_parent: &File,
    _to_path: &Path,
    to: &OsStr,
) -> io::Result<()> {
    use std::os::fd::AsRawFd;
    let from = c_name(from).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let to = c_name(to).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    if unsafe {
        libc::syscall(
            libc::SYS_renameat2,
            from_parent.as_raw_fd(),
            from.as_ptr(),
            to_parent.as_raw_fd(),
            to.as_ptr(),
            libc::RENAME_NOREPLACE,
        )
    } == 0
    {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(target_os = "macos")]
fn rename_no_replace_at(
    from_parent: &File,
    _from_path: &Path,
    from: &OsStr,
    to_parent: &File,
    _to_path: &Path,
    to: &OsStr,
) -> io::Result<()> {
    use std::os::fd::AsRawFd;
    const RENAME_EXCL: u32 = 0x0000_0004;
    let from = c_name(from).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    let to = c_name(to).map_err(|_| io::Error::from(io::ErrorKind::InvalidInput))?;
    if unsafe {
        libc::renameatx_np(
            from_parent.as_raw_fd(),
            from.as_ptr(),
            to_parent.as_raw_fd(),
            to.as_ptr(),
            RENAME_EXCL,
        )
    } == 0
    {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(windows)]
fn rename_no_replace_at(
    _parent: &File,
    from_path: &Path,
    _from: &OsStr,
    _to_parent: &File,
    to_path: &Path,
    _to: &OsStr,
) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_WRITE_THROUGH};
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(from_path);
    let to = wide(to_path);
    if unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), MOVEFILE_WRITE_THROUGH) } != 0 {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(all(unix, not(any(target_os = "linux", target_os = "macos"))))]
fn rename_no_replace_at(
    _parent: &File,
    _from_path: &Path,
    _from: &OsStr,
    _to_parent: &File,
    _to_path: &Path,
    _to: &OsStr,
) -> io::Result<()> {
    Err(io::Error::from(io::ErrorKind::Unsupported))
}

#[cfg(windows)]
fn replace_file_at(
    _from_parent: &File,
    from_path: &Path,
    _from: &OsStr,
    _to_parent: &File,
    to_path: &Path,
    _to: &OsStr,
) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(from_path);
    let to = wide(to_path);
    if unsafe {
        MoveFileExW(
            from.as_ptr(),
            to.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    } != 0
    {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(windows)]
fn rename_at(
    _from_parent: &File,
    from_path: &Path,
    _from: &OsStr,
    _to_parent: &File,
    to_path: &Path,
    _to: &OsStr,
) -> io::Result<()> {
    fs::rename(from_path, to_path)
}

pub fn flush_open_file(file: &File) -> Result<(), ErrorCode> {
    platform_sync(file)
}

#[cfg(target_os = "macos")]
fn platform_sync(file: &File) -> Result<(), ErrorCode> {
    use std::os::fd::AsRawFd;
    if unsafe { libc::fcntl(file.as_raw_fd(), libc::F_FULLFSYNC) } == 0 {
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
    DirectoryAnchor::open_root(path)?.flush()
}

#[cfg(target_os = "macos")]
pub fn exchange_preserving_target(
    target_parent: &DirectoryAnchor,
    target_name: &OsStr,
    artifacts: &DirectoryAnchor,
    stage_name: &OsStr,
    backup_name: &OsStr,
) -> Result<(), ErrorCode> {
    use std::os::fd::AsRawFd;
    const RENAME_SWAP: u32 = 0x00000002;
    target_parent.validate_chain()?;
    artifacts.validate_chain()?;
    let target = c_name(target_name)?;
    let stage = c_name(stage_name)?;
    let backup = c_name(backup_name)?;
    if unsafe {
        libc::renameatx_np(
            artifacts.handle().as_raw_fd(),
            stage.as_ptr(),
            target_parent.handle().as_raw_fd(),
            target.as_ptr(),
            RENAME_SWAP,
        )
    } != 0
    {
        return Err(ErrorCode::RecoveryRequired);
    }
    if unsafe {
        libc::renameat(
            artifacts.handle().as_raw_fd(),
            stage.as_ptr(),
            artifacts.handle().as_raw_fd(),
            backup.as_ptr(),
        )
    } != 0
    {
        return Err(ErrorCode::RecoveryRequired);
    }
    let installed = target_parent.open_file_for_flush(target_name)?;
    let displaced = artifacts.open_file_for_flush(backup_name)?;
    platform_sync(&installed)?;
    platform_sync(&displaced)?;
    target_parent.flush()?;
    artifacts.flush()
}

#[cfg(windows)]
pub fn exchange_preserving_target(
    target_parent: &DirectoryAnchor,
    target_name: &OsStr,
    artifacts: &DirectoryAnchor,
    stage_name: &OsStr,
    backup_name: &OsStr,
) -> Result<(), ErrorCode> {
    use std::{os::windows::ffi::OsStrExt, ptr};
    use windows_sys::Win32::Storage::FileSystem::ReplaceFileW;
    target_parent.validate_chain()?;
    artifacts.validate_chain()?;
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let target_path = target_parent.path().join(target_name);
    let stage_path = artifacts.path().join(stage_name);
    let backup_path = artifacts.path().join(backup_name);
    let result = unsafe {
        ReplaceFileW(
            wide(&target_path).as_ptr(),
            wide(&stage_path).as_ptr(),
            wide(&backup_path).as_ptr(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
        )
    };
    if result == 0 {
        return Err(ErrorCode::RecoveryRequired);
    }
    let installed = target_parent.open_file_for_flush(target_name)?;
    let displaced = artifacts.open_file_for_flush(backup_name)?;
    platform_sync(&installed)?;
    platform_sync(&displaced)
}

#[cfg(not(any(target_os = "macos", windows)))]
pub fn exchange_preserving_target(
    target_parent: &DirectoryAnchor,
    target_name: &OsStr,
    artifacts: &DirectoryAnchor,
    stage_name: &OsStr,
    backup_name: &OsStr,
) -> Result<(), ErrorCode> {
    target_parent.validate_chain()?;
    artifacts.validate_chain()?;
    rename_at(
        target_parent.handle(),
        &target_parent.path().join(target_name),
        target_name,
        artifacts.handle(),
        &artifacts.path().join(backup_name),
        backup_name,
    )
    .map_err(|_| ErrorCode::RecoveryRequired)?;
    if rename_at(
        artifacts.handle(),
        &artifacts.path().join(stage_name),
        stage_name,
        target_parent.handle(),
        &target_parent.path().join(target_name),
        target_name,
    )
    .is_err()
    {
        let _ = rename_at(
            artifacts.handle(),
            &artifacts.path().join(backup_name),
            backup_name,
            target_parent.handle(),
            &target_parent.path().join(target_name),
            target_name,
        );
        return Err(ErrorCode::RecoveryRequired);
    }
    let installed = target_parent.open_file_for_flush(target_name)?;
    let displaced = artifacts.open_file_for_flush(backup_name)?;
    platform_sync(&installed)?;
    platform_sync(&displaced)?;
    target_parent.flush()?;
    artifacts.flush()
}
