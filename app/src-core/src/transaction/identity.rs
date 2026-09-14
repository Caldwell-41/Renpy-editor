use serde::{Deserialize, Serialize};
#[cfg(unix)]
use std::fs::Metadata;
use std::{fs::File, io, path::Path};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileIdentity {
    pub volume: u64,
    pub file: u64,
}

#[cfg(unix)]
fn from_metadata(metadata: &Metadata) -> FileIdentity {
    use std::os::unix::fs::MetadataExt;
    FileIdentity {
        volume: metadata.dev(),
        file: metadata.ino(),
    }
}

#[cfg(windows)]
fn from_file(file: &File) -> io::Result<FileIdentity> {
    use std::{mem::zeroed, os::windows::io::AsRawHandle};
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION,
    };
    let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut info) } == 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(FileIdentity {
        volume: u64::from(info.dwVolumeSerialNumber),
        file: (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow),
    })
}

pub fn identity_for_file(file: &File) -> io::Result<FileIdentity> {
    #[cfg(unix)]
    {
        file.metadata().map(|metadata| from_metadata(&metadata))
    }
    #[cfg(windows)]
    {
        from_file(file)
    }
}

pub fn identity_for_path(path: &Path) -> io::Result<FileIdentity> {
    #[cfg(unix)]
    let file = File::open(path)?;
    #[cfg(windows)]
    let file = {
        use std::fs::OpenOptions;
        use std::os::windows::fs::OpenOptionsExt;
        use windows_sys::Win32::Storage::FileSystem::{
            FILE_FLAG_BACKUP_SEMANTICS, FILE_FLAG_OPEN_REPARSE_POINT, FILE_SHARE_READ,
            FILE_SHARE_WRITE,
        };
        OpenOptions::new()
            .read(true)
            .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE)
            .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
            .open(path)?
    };
    identity_for_file(&file)
}
