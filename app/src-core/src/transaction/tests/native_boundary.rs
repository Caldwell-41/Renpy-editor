//! One ordered manual experiment; a failed capability terminates the sequence.
use super::*;
use crate::transaction::platform::candidate::native::Boundary;
use std::{
    ffi::c_void,
    os::windows::{
        fs::OpenOptionsExt,
        io::{AsRawHandle, FromRawHandle, OwnedHandle},
    },
    time::{Duration, Instant},
};

fn read(
    f: &Fixture,
    maximum: usize,
    hook: &mut impl FnMut(Boundary) -> Result<(), ErrorCode>,
) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
    f.service.native_boundary_read(
        &f.project,
        &RelativePath::new("game/one.rpy").unwrap(),
        maximum,
        hook,
    )
}
fn mark(name: &str) {
    println!("g1-o1-n-positive: {name}");
}

#[link(name = "kernel32")]
extern "system" {
    fn CreateFileMappingW(
        file: *mut c_void,
        attributes: *const c_void,
        protect: u32,
        high: u32,
        low: u32,
        name: *const u16,
    ) -> *mut c_void;
    fn MapViewOfFile(
        mapping: *mut c_void,
        access: u32,
        high: u32,
        low: u32,
        size: usize,
    ) -> *mut c_void;
    fn UnmapViewOfFile(base: *const c_void) -> i32;
    fn DeviceIoControl(
        handle: *mut c_void,
        code: u32,
        input: *const c_void,
        input_size: u32,
        output: *mut c_void,
        output_size: u32,
        returned: *mut u32,
        overlapped: *mut c_void,
    ) -> i32;
}
struct Mapping {
    base: *mut c_void,
    _handle: OwnedHandle,
}
impl Drop for Mapping {
    fn drop(&mut self) {
        assert_ne!(unsafe { UnmapViewOfFile(self.base) }, 0);
    }
}
impl Mapping {
    fn new(file: &fs::File) -> Self {
        let raw = unsafe {
            CreateFileMappingW(
                file.as_raw_handle(),
                std::ptr::null(),
                4,
                0,
                0,
                std::ptr::null(),
            )
        };
        assert!(
            !raw.is_null(),
            "mapping capability missing: {}",
            std::io::Error::last_os_error()
        );
        let handle = unsafe { OwnedHandle::from_raw_handle(raw) };
        let base = unsafe { MapViewOfFile(raw, 2, 0, 0, 0) };
        assert!(
            !base.is_null(),
            "view capability missing: {}",
            std::io::Error::last_os_error()
        );
        Self {
            base,
            _handle: handle,
        }
    }
}

fn reparse(path: &Path, target: Option<&Path>) {
    let file = fs::OpenOptions::new()
        .write(true)
        .share_mode(3)
        .custom_flags(0x02000000 | 0x00200000)
        .open(path)
        .unwrap();
    let mut bytes = Vec::new();
    bytes.extend_from_slice(&0xA0000003u32.to_le_bytes());
    let code = if let Some(target) = target {
        let target = fs::canonicalize(target)
            .unwrap()
            .to_string_lossy()
            .trim_start_matches(r"\\?\")
            .to_owned();
        let name = format!(r"\??\{target}").encode_utf16().collect::<Vec<_>>();
        let name_bytes = (name.len() * 2) as u16;
        bytes.extend_from_slice(&(8u16 + name_bytes + 4).to_le_bytes());
        bytes.extend_from_slice(&0u16.to_le_bytes());
        for value in [0u16, name_bytes, name_bytes + 2, 0] {
            bytes.extend_from_slice(&value.to_le_bytes());
        }
        for unit in name {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        bytes.extend_from_slice(&[0; 4]);
        0x000900A4
    } else {
        bytes.extend_from_slice(&[0; 4]);
        0x000900AC
    };
    let mut returned = 0;
    assert_ne!(
        unsafe {
            DeviceIoControl(
                file.as_raw_handle(),
                code,
                bytes.as_ptr().cast(),
                bytes.len() as u32,
                std::ptr::null_mut(),
                0,
                &mut returned,
                std::ptr::null_mut(),
            )
        },
        0,
        "reparse capability missing: {}",
        std::io::Error::last_os_error()
    );
}

#[test]
#[ignore = "G1-O1-N preregistered one-shot native experiment; not a CI selector"]
fn g1_o1_n_ordered_safety() {
    let f = Fixture::new();
    let leaf = f.root.join("game/one.rpy");
    let bytes = fs::read(&leaf).unwrap();
    let result = read(&f, 64, &mut |_| Ok(())).expect("ordinary relative native open must succeed");
    assert_eq!(result.0, bytes);
    assert_eq!(
        result.1.identity,
        identity::identity_for_path(&leaf).unwrap()
    );
    mark("ordinary read + fresh identity");
    for value in [
        "../one.rpy",
        "game/one.rpy:ads",
        "game/NUL",
        "game/trailing.",
        "game/back\\slash",
    ] {
        assert!(RelativePath::new(value).is_err());
    }
    for value in ["game/missing.rpy", "game"] {
        assert!(f
            .service
            .native_boundary_read(
                &f.project,
                &RelativePath::new(value).unwrap(),
                64,
                &mut |_| Ok(())
            )
            .is_err());
    }
    assert!(!f.root.join("game/missing.rpy").exists());
    mark("path policy + missing/type refusal without creation");

    let writer = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .share_mode(7)
        .open(&leaf)
        .unwrap();
    let mapping = Mapping::new(&writer);
    assert_eq!(read(&f, 64, &mut |_| Ok(())).unwrap().0, bytes);
    // A live writable mapping is allowed. Its bytes must be freshly acquired.
    unsafe {
        (mapping.base as *mut u8).write(b'L');
    }
    assert_eq!(read(&f, 64, &mut |_| Ok(())).unwrap().0[0], b'L');
    drop(mapping);
    drop(writer);
    mark("existing writer + writable mapping compatibility and fresh content");

    for point in [
        Boundary::Opened,
        Boundary::Chunk,
        Boundary::AfterRead,
        Boundary::BeforeBinding,
    ] {
        for different in [false, true] {
            let f = Fixture::new();
            let leaf = f.root.join("game/one.rpy");
            let data = vec![b'a'; 2 * 1024 * 1024 + 17];
            fs::write(&leaf, &data).unwrap();
            let original = identity::identity_for_path(&leaf).unwrap();
            let time = fs::metadata(&leaf).unwrap().modified().unwrap();
            let replacement = f.root.join("game/replacement.tmp");
            fs::write(
                &replacement,
                if different {
                    vec![b'b'; data.len()]
                } else {
                    data
                },
            )
            .unwrap();
            fs::OpenOptions::new()
                .write(true)
                .open(&replacement)
                .unwrap()
                .set_times(fs::FileTimes::new().set_modified(time))
                .unwrap();
            let mut injected = false;
            let mut chunks = 0;
            let result = read(&f, 3 * 1024 * 1024, &mut |p| {
                if p == Boundary::Chunk {
                    chunks += 1;
                }
                if p == point && !injected {
                    fs::rename(&replacement, &leaf).unwrap();
                    assert_ne!(original, identity::identity_for_path(&leaf).unwrap());
                    assert_eq!(time, fs::metadata(&leaf).unwrap().modified().unwrap());
                    injected = true;
                }
                Ok(())
            });
            assert!(
                injected && result.is_err(),
                "replacement not refused at {point:?}, different={different}"
            );
            if point == Boundary::Chunk {
                assert!(chunks >= 1);
            }
        }
    }
    mark("eight same/different restored-time replacements at four read boundaries");

    // Explicit native capability: do not skip or elevate if symlink creation is denied.
    for point in [Boundary::Chain, Boundary::Opened, Boundary::BeforeBinding] {
        let f = Fixture::new();
        let outside = tempfile::tempdir().unwrap();
        let sentinel = outside.path().join("sentinel.rpy");
        fs::write(&sentinel, b"OUTSIDE").unwrap();
        let leaf = f.root.join("game/one.rpy");
        let mut injected = false;
        let mut chunks = 0;
        let result = read(&f, 64, &mut |p| {
            if p == Boundary::Chunk {
                chunks += 1;
            }
            if p == point && !injected {
                fs::remove_file(&leaf).unwrap();
                std::os::windows::fs::symlink_file(&sentinel, &leaf)
                    .expect("leaf symlink capability missing; stop without elevation");
                injected = true;
            }
            Ok(())
        });
        assert!(injected && result.is_err());
        if point == Boundary::Chain {
            assert_eq!(chunks, 0);
        }
        assert_eq!(fs::read(&sentinel).unwrap(), b"OUTSIDE");
    }
    mark("hostile leaf link refused at three boundaries; outside unchanged");

    for point in [Boundary::Chain, Boundary::Opened, Boundary::BeforeBinding] {
        let f = Fixture::new();
        let mut checked = false;
        let result = read(&f, 64, &mut |p| {
            if p == point {
                assert!(fs::rename(f.root.join("game"), f.root.join("moved")).is_err());
                assert!(fs::rename(&f.root, f.root.with_extension("moved")).is_err());
                checked = true;
            }
            Ok(())
        });
        assert!(checked && result.is_ok());
    }
    mark("parent/root namespace replacement denied by retained no-delete handles");

    for point in [
        Boundary::Chain,
        Boundary::Opened,
        Boundary::BeforeRead,
        Boundary::AfterRead,
        Boundary::BeforeBinding,
    ] {
        let f = Fixture::new();
        let outside = tempfile::tempdir().unwrap();
        fs::write(outside.path().join("one.rpy"), b"OUTSIDE").unwrap();
        let parent = f.root.join("game");
        let original = identity::identity_for_path(&parent).unwrap();
        let mut converted = false;
        let mut chunks = 0;
        let result = read(&f, 64, &mut |p| {
            if p == Boundary::Chunk {
                chunks += 1;
            }
            if p == point && !converted {
                fs::remove_file(parent.join("one.rpy")).unwrap();
                fs::remove_file(parent.join("two.rpy")).unwrap();
                reparse(&parent, Some(outside.path()));
                converted = true;
                assert_eq!(identity::identity_for_path(&parent).unwrap(), original);
            }
            Ok(())
        });
        if converted {
            reparse(&parent, None);
        }
        assert!(
            converted && result.is_err(),
            "retained reparse must be rejected at {point:?}"
        );
        if point == Boundary::Chain || point == Boundary::Opened {
            assert_eq!(chunks, 0);
        }
        assert_eq!(
            fs::read(outside.path().join("one.rpy")).unwrap(),
            b"OUTSIDE"
        );
    }
    mark("same-identity retained parent reparse refused at five boundaries");

    for point in [
        Boundary::Chain,
        Boundary::Opened,
        Boundary::BeforeRead,
        Boundary::Chunk,
        Boundary::AfterRead,
        Boundary::BeforeBinding,
        Boundary::Compared,
    ] {
        let f = Fixture::new();
        let cancel = Arc::new(crate::runtime_work::Cancellation::default());
        crate::runtime_work::proof_scoped(
            cancel.clone(),
            Instant::now() + Duration::from_secs(2),
            || {
                let mut reached = false;
                assert!(read(&f, 64, &mut |p| {
                    if p == point {
                        cancel.cancel();
                        reached = true;
                    }
                    Ok(())
                })
                .is_err());
                assert!(reached);
            },
        );
        assert!(read(&f, 64, &mut |p| if p == point {
            Err(ErrorCode::IoFailure)
        } else {
            Ok(())
        })
        .is_err());
        assert!(read(&f, 64, &mut |_| Ok(())).is_ok());
    }
    let f = Fixture::new();
    crate::runtime_work::proof_scoped(
        Arc::default(),
        Instant::now() - Duration::from_millis(1),
        || {
            assert!(read(&f, 64, &mut |_| panic!(
                "expired request reached native boundary"
            ))
            .is_err());
        },
    );
    mark("cancellation + original expired deadline + injected errors release handles");
    println!("g1-o1-n-safety-complete: local one-file only; not graph/target acceptance");
}
