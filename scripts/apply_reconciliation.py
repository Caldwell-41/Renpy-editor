"""One-use, hash-guarded port of the missing SDK download handoff.

The user authorised branch reconciliation. This script changes no branch or main.
The workflow publishes only after Windows/macOS tests of the same source blobs.
"""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "app/src-core/src/renpy.rs"
TESTS = ROOT / "app/src-core/src/renpy/reconciliation_tests.rs"
BASE_BLOB = "99f70dbc96d734adf0cf2ff9ea44e719dc2b7f34"


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise SystemExit("Source precondition changed; refusing patch")
    return text.replace(old, new, 1)


NETWORK_START = '''pub fn install_supported_sdk(data_root: &Path) -> Result<ValidatedSdk, RenpyError> {
    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {
        return Ok(sdk);
    }
    let sdk_dir = managed_sdk_directory(data_root, true)?.ok_or(RenpyError::Io)?;
    let archive = sdk_dir.join(format!(
        ".{SDK_ARCHIVE_NAME}.{}.partial",
        uuid::Uuid::new_v4()
    ));
    let result = (|| {
        let agent = ureq::Agent::config_builder()'''
NETWORK_REPLACEMENT = '''pub fn install_supported_sdk(data_root: &Path) -> Result<ValidatedSdk, RenpyError> {
    install_supported_sdk_with_download(data_root, |archive| {
        let agent = ureq::Agent::config_builder()'''
NETWORK_END = '''        crate::transaction::flush_open_file(&output).map_err(|_| RenpyError::Io)?;
        install_supported_sdk_from_archive(data_root, &archive)
    })();
    let _ = fs::remove_file(&archive);
    result
}

pub fn install_supported_sdk_from_archive('''
SEAM_END = '''        crate::transaction::flush_open_file(&output).map_err(|_| RenpyError::Io)
    })
}

// Keep download transport injectable for tests without adding a renderer operation,
// changing the pinned endpoint/checksum, or bypassing production archive validation.
fn install_supported_sdk_with_download<F>(
    data_root: &Path,
    download: F,
) -> Result<ValidatedSdk, RenpyError>
where
    F: FnOnce(&Path) -> Result<(), RenpyError>,
{
    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {
        return Ok(sdk);
    }
    let sdk_dir = managed_sdk_directory(data_root, true)?.ok_or(RenpyError::Io)?;
    let archive = sdk_dir.join(format!(
        ".{SDK_ARCHIVE_NAME}.{}.partial",
        uuid::Uuid::new_v4()
    ));
    let result = (|| {
        download(&archive)?;
        install_supported_sdk_from_archive(data_root, &archive)
    })();
    let _ = fs::remove_file(&archive);
    result
}

pub fn install_supported_sdk_from_archive('''
INNER_OLD = '''fn install_supported_sdk_from_archive_inner<F>(
    data_root: &Path,
    archive: &Path,
    mut hook: F,
) -> Result<ValidatedSdk, RenpyError>
where
    F: FnMut(ManagedInstallCheckpoint) -> Result<(), RenpyError>,
{
    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {
        return Ok(sdk);
    }
    let sdk_dir = managed_sdk_directory(data_root, true)?.ok_or(RenpyError::Io)?;'''
INNER_NEW = '''fn install_supported_sdk_from_archive_inner<F>(
    data_root: &Path,
    archive: &Path,
    hook: F,
) -> Result<ValidatedSdk, RenpyError>
where
    F: FnMut(ManagedInstallCheckpoint) -> Result<(), RenpyError>,
{
    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {
        return Ok(sdk);
    }
    install_supported_sdk_from_archive_prepared(data_root, archive, hook)
}

// Precondition: this operation already recovered prior installer debris. Calling
// preparation again here would quarantine the operation's own downloaded .partial.
// Public archive installs still prepare once through the wrapper above.
fn install_supported_sdk_from_archive_prepared<F>(
    data_root: &Path,
    archive: &Path,
    mut hook: F,
) -> Result<ValidatedSdk, RenpyError>
where
    F: FnMut(ManagedInstallCheckpoint) -> Result<(), RenpyError>,
{
    let sdk_dir = managed_sdk_directory(data_root, true)?.ok_or(RenpyError::Io)?;'''

TEST_CONTENT = r'''//! Regressions for the network download -> managed SDK installation handoff.
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
        assert!(!stale.exists(), "old debris must be handled before download");
        assert_only_prior_download_quarantined(&root);
        active = Some(archive.to_path_buf());
        fs::write(archive, b"current intentionally invalid archive").map_err(|_| RenpyError::Io)
    });
    assert!(
        matches!(result, Err(RenpyError::Checksum)),
        "current download must reach checksum verification, got {result:?}"
    );
    assert!(!active.unwrap().exists(), "owned failed download is removed");
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
'''


def prepare() -> None:
    # Verify exact tracked content before changing anything; tolerate only checkout EOL.
    text = SOURCE.read_text(encoding="utf-8")
    raw = text.encode()
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    if blob != BASE_BLOB or TESTS.exists():
        raise SystemExit("Reviewed source/tree changed; refusing to overwrite newer work")
    text = replace_once(text, NETWORK_START, NETWORK_REPLACEMENT)
    text = replace_once(text, NETWORK_END, SEAM_END)
    begin = text.index("pub fn install_supported_sdk(data_root:")
    end = text.index("// Keep download transport injectable", begin)
    section = replace_once(text[begin:end], ".open(&archive)", ".open(archive)")
    text = text[:begin] + section + text[end:]
    text += '\n#[cfg(test)]\n#[path = "renpy/reconciliation_tests.rs"]\nmod reconciliation_tests;\n'
    SOURCE.write_text(text, encoding="utf-8", newline="\n")
    TESTS.parent.mkdir(parents=True, exist_ok=True)
    TESTS.write_text(TEST_CONTENT, encoding="utf-8", newline="\n")


def fix() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    text = replace_once(text, INNER_OLD, INNER_NEW)
    text = replace_once(
        text,
        "        download(&archive)?;\n        install_supported_sdk_from_archive(data_root, &archive)",
        "        download(&archive)?;\n        install_supported_sdk_from_archive_prepared(data_root, &archive, |_| Ok(()))",
    )
    SOURCE.write_text(text, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) == 2 else ""
    if mode == "prepare":
        prepare()
    elif mode == "fix":
        fix()
    elif mode == "apply":
        prepare()
        fix()
    else:
        raise SystemExit("Expected prepare, fix, or apply")
    print("SDK reconciliation patch stage: " + mode)
