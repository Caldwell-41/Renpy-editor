//! G1-O1-N experiment only. No production caller or historical-reader fallback.
use super::*;
use crate::transaction::{path::RelativePath, Revision};
use sha2::{Digest, Sha256};
use std::{
    ffi::c_void,
    io::Read,
    os::windows::{
        ffi::OsStrExt,
        io::{AsRawHandle, FromRawHandle},
    },
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Boundary {
    Chain,
    Opened,
    BeforeRead,
    Chunk,
    AfterRead,
    BeforeBinding,
    Compared,
}

#[repr(C)]
struct UnicodeString {
    length: u16,
    maximum_length: u16,
    buffer: *mut u16,
}
#[repr(C)]
struct ObjectAttributes {
    length: u32,
    root: *mut c_void,
    name: *mut UnicodeString,
    attributes: u32,
    security: *mut c_void,
    qos: *mut c_void,
}
#[repr(C)]
struct IoStatus {
    status_or_pointer: usize,
    information: usize,
}
#[link(name = "ntdll")]
extern "system" {
    fn NtCreateFile(
        handle: *mut *mut c_void,
        access: u32,
        attributes: *mut ObjectAttributes,
        status: *mut IoStatus,
        allocation: *const i64,
        file_attributes: u32,
        share: u32,
        disposition: u32,
        options: u32,
        ea: *const c_void,
        ea_length: u32,
    ) -> i32;
    fn RtlNtStatusToDosError(status: i32) -> u32;
}

/// FILE_OPEN only; no backup intent, write/delete access, privilege or ACL changes.
fn nt_open(parent: Option<&File>, name: &OsStr, directory: bool) -> Result<File, ErrorCode> {
    crate::runtime_work::check()?;
    let mut units: Vec<u16> = name.encode_wide().collect();
    if units.contains(&0) || units.len() > 32766 {
        return Err(ErrorCode::UnsafePath);
    }
    let mut unicode = UnicodeString {
        length: (units.len() * 2) as u16,
        maximum_length: (units.len() * 2) as u16,
        buffer: units.as_mut_ptr(),
    };
    let mut attributes = ObjectAttributes {
        length: std::mem::size_of::<ObjectAttributes>() as u32,
        root: parent.map_or(std::ptr::null_mut(), |f| f.as_raw_handle()),
        name: &mut unicode,
        attributes: 0x40 | 0x1000, // OBJ_CASE_INSENSITIVE | OBJ_DONT_REPARSE
        security: std::ptr::null_mut(),
        qos: std::ptr::null_mut(),
    };
    let mut status = IoStatus {
        status_or_pointer: 0,
        information: 0,
    };
    let mut handle = std::ptr::null_mut();
    // READ_ATTRIBUTES | SYNCHRONIZE; directory LIST/TRAVERSE, leaf READ_DATA.
    let access = 0x80 | 0x100000 | if directory { 0x1 | 0x20 } else { 0x1 };
    let options = 0x00200000 | 0x20 | if directory { 0x1 } else { 0x40 };
    let result = unsafe {
        NtCreateFile(
            &mut handle,
            access,
            &mut attributes,
            &mut status,
            std::ptr::null(),
            0,
            if directory { 3 } else { 7 },
            1,
            options,
            std::ptr::null(),
            0,
        )
    };
    if result < 0 {
        eprintln!(
            "g1-o1-n-native-error: ntstatus={:#010x} win32={}",
            result as u32,
            unsafe { RtlNtStatusToDosError(result) }
        );
        return Err(ErrorCode::IoFailure);
    }
    if handle.is_null() || handle as isize == -1 {
        return Err(ErrorCode::IoFailure);
    }
    let file = unsafe { File::from_raw_handle(handle) };
    crate::runtime_work::check()?;
    let observed = sample_inner(&file)?;
    if observed.directory != directory {
        return Err(ErrorCode::UnsafePath);
    }
    Ok(file)
}

fn child(parent: &File, name: &OsStr, directory: bool) -> Result<File, ErrorCode> {
    validate_name(name)?;
    RelativePath::new(name.to_str().ok_or(ErrorCode::UnsafePath)?)?;
    nt_open(Some(parent), name, directory)
}

/// Rewalk fresh names, also inspecting retained attributes for in-place reparses.
fn chain(
    anchor: &DirectoryAnchor,
    root: &Path,
    identity: &FileIdentity,
) -> Result<File, ErrorCode> {
    crate::runtime_work::check()?;
    let first = anchor.chain.first().ok_or(ErrorCode::UnsafePath)?;
    if first.path != root
        || &first.identity != identity
        || fs::canonicalize(root).map_err(|_| ErrorCode::RootIdentityChanged)? != root
    {
        return Err(ErrorCode::RootIdentityChanged);
    }
    // Canonical local drive paths only in this bounded Windows/NTFS experiment.
    let text = root.to_str().ok_or(ErrorCode::UnsafePath)?;
    let drive_path = text.strip_prefix(r"\\?\").ok_or(ErrorCode::UnsafePath)?;
    if drive_path.as_bytes().get(1) != Some(&b':') || drive_path.as_bytes().get(2) != Some(&b'\\') {
        return Err(ErrorCode::UnsafePath);
    }
    let native = format!(r"\??\{drive_path}");
    let mut current = nt_open(None, OsStr::new(&native), true)?;
    for (index, guard) in anchor.chain.iter().enumerate() {
        crate::runtime_work::check()?;
        let retained = sample_inner(&guard.handle)?;
        if !retained.directory || retained.identity != guard.identity {
            return Err(ErrorCode::ParentIdentityChanged);
        }
        if index != 0 {
            let previous = &anchor.chain[index - 1].path;
            if guard.path.parent() != Some(previous.as_path()) {
                return Err(ErrorCode::UnsafePath);
            }
            current = child(
                &current,
                guard.path.file_name().ok_or(ErrorCode::UnsafePath)?,
                true,
            )?;
        }
        let fresh = sample_inner(&current)?;
        if !fresh.directory || fresh.identity != guard.identity {
            return Err(if index == 0 {
                ErrorCode::RootIdentityChanged
            } else {
                ErrorCode::ParentIdentityChanged
            });
        }
    }
    Ok(current)
}

pub(crate) fn read(
    anchor: &DirectoryAnchor,
    root: &Path,
    identity: &FileIdentity,
    name: &OsStr,
    maximum: usize,
    hook: &mut impl FnMut(Boundary) -> Result<(), ErrorCode>,
) -> Result<(Vec<u8>, Revision), ErrorCode> {
    let mut visit = |point| {
        hook(point)?;
        crate::runtime_work::check()
    };
    let parent = chain(anchor, root, identity)?;
    visit(Boundary::Chain)?;
    let mut file = child(&parent, name, false)?;
    let before = sample_inner(&file)?;
    visit(Boundary::Opened)?;
    drop(chain(anchor, root, identity)?); // current names before any bytes
    if before.length > maximum.min(crate::transaction::MAX_MUTATION_BYTES) as u64 {
        return Err(ErrorCode::InvalidProposal);
    }
    let mut bytes = Vec::new();
    bytes
        .try_reserve_exact(before.length as usize)
        .map_err(|_| ErrorCode::IoFailure)?;
    bytes.resize(before.length as usize, 0);
    let mut hash = Sha256::new();
    visit(Boundary::BeforeRead)?;
    for chunk in bytes.chunks_mut(1024 * 1024) {
        crate::runtime_work::check()?;
        file.read_exact(chunk)
            .map_err(|_| ErrorCode::InvalidProposal)?;
        hash.update(&*chunk);
        visit(Boundary::Chunk)?;
    }
    let mut growth = [0u8; 1];
    if file.read(&mut growth).map_err(|_| ErrorCode::IoFailure)? != 0 {
        return Err(ErrorCode::InvalidProposal);
    }
    visit(Boundary::AfterRead)?;
    if sample_inner(&file)? != before {
        return Err(ErrorCode::InvalidProposal);
    }
    visit(Boundary::BeforeBinding)?;
    let fresh_parent = chain(anchor, root, identity)?;
    let binding = child(&fresh_parent, name, false)?;
    let bound = sample_inner(&binding)?;
    // Both leaves remain live across the comparison and final chain bracket.
    if bound != before {
        return Err(ErrorCode::InvalidProposal);
    }
    drop(chain(anchor, root, identity)?);
    visit(Boundary::Compared)?;
    Ok((
        bytes,
        Revision {
            sha256: hex::encode(hash.finalize()),
            identity: before.identity,
        },
    ))
}
