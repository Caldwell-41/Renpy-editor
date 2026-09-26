//! G1-O1 test-only compound observation boundary. Never used by writes.
use super::*;
use crate::transaction::candidate::{Point, Probe};
use std::time::Instant;

#[derive(Debug, PartialEq)]
pub(crate) struct Sample {
    pub identity: FileIdentity,
    pub length: u64,
    directory: bool,
}

// One fresh native handle query supplies identity, type and length together.
pub(crate) fn sample(file: &File, probe: &Probe) -> Result<Sample, ErrorCode> {
    let start = Instant::now();
    let result = sample_inner(file);
    probe.record("handle_metadata", start.elapsed());
    result
}
#[cfg(unix)]
fn sample_inner(file: &File) -> Result<Sample, ErrorCode> {
    use std::os::unix::fs::MetadataExt;
    let m = file.metadata().map_err(|_| ErrorCode::IoFailure)?;
    if !m.is_file() && !m.is_dir() {
        return Err(ErrorCode::UnsafePath);
    }
    Ok(Sample {
        identity: FileIdentity {
            volume: m.dev(),
            file: m.ino(),
        },
        length: m.len(),
        directory: m.is_dir(),
    })
}
#[cfg(windows)]
fn sample_inner(file: &File) -> Result<Sample, ErrorCode> {
    use std::{mem::zeroed, os::windows::io::AsRawHandle};
    use windows_sys::Win32::Storage::FileSystem::*;
    let mut m: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut m) } == 0 {
        return Err(ErrorCode::IoFailure);
    }
    if m.dwFileAttributes & (FILE_ATTRIBUTE_REPARSE_POINT | FILE_ATTRIBUTE_DEVICE) != 0 {
        return Err(ErrorCode::UnsafePath);
    }
    Ok(Sample {
        identity: FileIdentity {
            volume: m.dwVolumeSerialNumber as u64,
            file: ((m.nFileIndexHigh as u64) << 32) | m.nFileIndexLow as u64,
        },
        length: ((m.nFileSizeHigh as u64) << 32) | m.nFileSizeLow as u64,
        directory: m.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY != 0,
    })
}
impl DirectoryAnchor {
    pub(crate) fn candidate_validate(
        &self,
        root: &Path,
        identity: &FileIdentity,
        probe: &Probe,
    ) -> Result<(), ErrorCode> {
        let started = Instant::now();
        let first = self.chain.first().ok_or(ErrorCode::UnsafePath)?;
        if first.path != root
            || &first.identity != identity
            || fs::canonicalize(root).map_err(|_| ErrorCode::RootIdentityChanged)? != root
        {
            return Err(ErrorCode::RootIdentityChanged);
        }
        probe.record("root_canonical", started.elapsed());
        for (i, guard) in self.chain.iter().enumerate() {
            crate::runtime_work::check()?;
            let start = Instant::now();
            let error = if i == 0 {
                ErrorCode::RootIdentityChanged
            } else {
                ErrorCode::ParentIdentityChanged
            };
            let m = fs::symlink_metadata(&guard.path).map_err(|_| error)?;
            if !m.is_dir() || is_link_or_reparse(&m) {
                return Err(error);
            }
            // Fresh pathname handle, never metadata sampled on an earlier open.
            let current = open_directory_path(&guard.path).map_err(|_| error)?;
            let sampled = sample(&current, probe).map_err(|_| error)?;
            if !sampled.directory || sampled.identity != guard.identity {
                return Err(error);
            }
            probe.record("chain_component", start.elapsed());
        }
        Ok(())
    }
    pub(crate) fn candidate_open(
        &self,
        root: &Path,
        identity: &FileIdentity,
        name: &OsStr,
        probe: &Probe,
    ) -> Result<(File, Sample), ErrorCode> {
        validate_name(name)?;
        self.candidate_validate(root, identity, probe)?;
        probe.visit(Point::ChainValidated)?;
        let path = self.path().join(name);
        let start = Instant::now();
        let m = fs::symlink_metadata(&path).map_err(|_| ErrorCode::IoFailure)?;
        if !m.is_file() || is_link_or_reparse(&m) {
            return Err(ErrorCode::UnsafePath);
        }
        probe.visit(Point::LeafMetadata)?;
        let file = open_file_at(self.handle(), &path, name, false, false)
            .map_err(|_| ErrorCode::IoFailure)?;
        probe.record("leaf_open", start.elapsed());
        probe.visit(Point::LeafOpened)?;
        let sampled = sample(&file, probe)?;
        if sampled.directory {
            return Err(ErrorCode::UnsafePath);
        }
        // Catch namespace substitution at the open boundary before reading bytes.
        self.candidate_validate(root, identity, probe)?;
        Ok((file, sampled))
    }
    pub(crate) fn candidate_depth(&self) -> usize {
        self.chain.len()
    }
}
