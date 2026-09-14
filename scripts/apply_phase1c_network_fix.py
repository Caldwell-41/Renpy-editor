from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/renpy.rs"
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected one replacement, found {count}: {old[:400]}")
    text = text.replace(old, new, 1)


replace_once(
    '''        output.sync_all().map_err(|_| RenpyError::Io)?;\n        install_supported_sdk_from_archive(data_root, &archive)\n    })();''',
    '''        output.sync_all().map_err(|_| RenpyError::Io)?;\n        install_supported_sdk_from_archive_prepared(data_root, &archive, false)\n    })();''',
)

replace_once(
    '''fn install_supported_sdk_from_archive_inner(\n    data_root: &Path,\n    archive: &Path,\n    interrupt_after_promotion: bool,\n) -> Result<ValidatedSdk, RenpyError> {\n    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {\n        return Ok(sdk);\n    }\n    let sdk_dir = data_root.join("sdks");''',
    '''fn install_supported_sdk_from_archive_inner(\n    data_root: &Path,\n    archive: &Path,\n    interrupt_after_promotion: bool,\n) -> Result<ValidatedSdk, RenpyError> {\n    if let Some(sdk) = prepare_managed_sdk_install(data_root)? {\n        return Ok(sdk);\n    }\n    install_supported_sdk_from_archive_prepared(data_root, archive, interrupt_after_promotion)\n}\n\nfn install_supported_sdk_from_archive_prepared(\n    data_root: &Path,\n    archive: &Path,\n    interrupt_after_promotion: bool,\n) -> Result<ValidatedSdk, RenpyError> {\n    let sdk_dir = data_root.join("sdks");''',
)

needle = '''    #[test]\n    fn interrupted_managed_state_is_quarantined_without_deletion() {'''
addition = '''    #[test]\n    fn active_download_is_not_quarantined_by_prepared_install() {\n        let temp = tempfile::tempdir().unwrap();\n        let data_root = temp.path().join("state");\n        let sdk_dir = data_root.join("sdks");\n        fs::create_dir_all(&sdk_dir).unwrap();\n        let archive = sdk_dir.join(format!(\n            ".{SDK_ARCHIVE_NAME}.{}.partial",\n            uuid::Uuid::new_v4()\n        ));\n        fs::write(&archive, b"not-the-official-sdk").unwrap();\n\n        assert!(matches!(\n            install_supported_sdk_from_archive_prepared(&data_root, &archive, false),\n            Err(RenpyError::Checksum)\n        ));\n        assert!(archive.is_file());\n        assert!(fs::read_dir(&sdk_dir).unwrap().all(|entry| {\n            !entry\n                .unwrap()\n                .file_name()\n                .to_string_lossy()\n                .starts_with(SDK_QUARANTINE_PREFIX)\n        }));\n    }\n\n'''
if text.count(needle) != 1:
    raise SystemExit("test insertion point not found")
text = text.replace(needle, addition + needle, 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C network installer correction applied")
