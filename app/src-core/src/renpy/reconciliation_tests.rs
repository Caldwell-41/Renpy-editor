//! Regressions for the network download -> managed SDK installation handoff.
//! The transport seam is private; checksum, extraction and provenance are real.
use super::*;
use std::cell::Cell;
use tempfile::{tempdir, TempDir};

fn state() -> (TempDir, PathBuf) {
    let temporary = tempdir().unwrap();
    let root = fs::canonicalize(temporary.path()).unwrap();
    (temporary, root)
}

fn stale_partial(root: &Path) -> PathBuf {
    let directory = root.join("sdks");
    fs::create_dir_all(&directory).unwrap();
    let path = directory.join(format!(
        ".{SDK_ARCHIVE_NAME}.{}.partial",
        uuid::Uuid::new_v4()
    ));
    fs::write(&path, b"prior interrupted download").unwrap();
    path
}

fn assert_only_prior_download_quarantined(root: &Path) {
    let files = fs::read_dir(root.join("sdks"))
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| {
            path.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with(SDK_QUARANTINE_PREFIX)
        })
        .collect::<Vec<_>>();
    assert_eq!(files.len(), 1, "active download was quarantined as debris");
    assert_eq!(fs::read(&files[0]).unwrap(), b"prior interrupted download");
}

#[test]
fn download_handoff_does_not_quarantine_current_archive() {
    let (_temporary, root) = state();
    let stale = stale_partial(&root);
    let mut active = None;
    let result = install_supported_sdk_with_download(&root, |archive| {
        assert!(
            !stale.exists(),
            "old debris must be handled before download"
        );
        assert_only_prior_download_quarantined(&root);
        active = Some(archive.to_path_buf());
        fs::write(archive, b"current intentionally invalid archive").map_err(|_| RenpyError::Io)
    });
    assert!(
        matches!(result, Err(RenpyError::Checksum)),
        "current download must reach checksum verification, got {result:?}"
    );
    assert!(
        !active.unwrap().exists(),
        "owned failed download is removed"
    );
    assert_only_prior_download_quarantined(&root);
    assert!(!root.join("sdks").join(MANAGED_SDK_DIR_NAME).exists());
}

#[test]
fn failed_download_cleanup_preserves_prior_evidence_and_allows_retry() {
    let (_temporary, root) = state();
    stale_partial(&root);
    let mut active = None;
    let result = install_supported_sdk_with_download(&root, |archive| {
        active = Some(archive.to_path_buf());
        fs::write(archive, b"interrupted current download").map_err(|_| RenpyError::Io)?;
        Err(RenpyError::Download)
    });
    assert!(matches!(result, Err(RenpyError::Download)));
    assert!(!active.unwrap().exists());
    assert_only_prior_download_quarantined(&root);
    let retry = install_supported_sdk_with_download(&root, |archive| {
        fs::write(archive, b"retry intentionally invalid archive").map_err(|_| RenpyError::Io)
    });
    assert!(matches!(retry, Err(RenpyError::Checksum)));
    assert_only_prior_download_quarantined(&root);
}

#[test]
fn public_archive_entry_still_prepares_and_preserves_caller_input() {
    let (_temporary, root) = state();
    let stale = stale_partial(&root);
    let archive = root.join("caller-owned-invalid.tar.bz2");
    fs::write(&archive, b"caller-owned archive").unwrap();
    let result = install_supported_sdk_from_archive(&root, &archive);
    assert!(matches!(result, Err(RenpyError::Checksum)));
    assert!(!stale.exists());
    assert_only_prior_download_quarantined(&root);
    assert_eq!(fs::read(archive).unwrap(), b"caller-owned archive");
}

#[test]
fn official_sdk_download_handoff_target_gate() {
    let Some(archive) = std::env::var_os("LOOMLIGHT_PHASE1C_SDK_ARCHIVE") else {
        println!("phase-1c-network-handoff-gate: skipped (no official archive)");
        return;
    };
    let archive = fs::canonicalize(archive).unwrap();
    let (_temporary, root) = state();
    let stale = stale_partial(&root);
    let calls = Cell::new(0);
    let sdk = install_supported_sdk_with_download(&root, |active| {
        calls.set(calls.get() + 1);
        assert!(!stale.exists());
        assert_only_prior_download_quarantined(&root);
        fs::copy(&archive, active)
            .map(|_| ())
            .map_err(|_| RenpyError::Io)
    })
    .expect("download handoff must install the verified official SDK");
    assert_eq!(calls.get(), 1);
    assert_eq!(sdk.version, SUPPORTED_VERSION);
    assert!(sdk.root.join(MANAGED_PROVENANCE_NAME).is_file());
    assert_only_prior_download_quarantined(&root);
    assert!(archive.is_file(), "caller-owned fixture must remain intact");
    for entry in fs::read_dir(root.join("sdks")).unwrap() {
        assert!(!entry
            .unwrap()
            .file_name()
            .to_string_lossy()
            .ends_with(".partial"));
    }
    let reused = install_supported_sdk_with_download(&root, |_| {
        calls.set(calls.get() + 1);
        Err(RenpyError::Download)
    })
    .expect("verified managed SDK reuse must not download again");
    assert_eq!(calls.get(), 1);
    assert!(sdk.same_identity(&reused));
    println!("phase-1c-network-handoff-gate: passed");
}
