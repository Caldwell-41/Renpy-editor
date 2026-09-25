//! Bounded content/identity inventories. Unknown output provenance is never waived
//! merely because an extension resembles an SDK cache or save file.
use super::*;
use std::{collections::BTreeMap, ffi::OsStr};

pub(crate) type ExecutionManifest = BTreeMap<String, Revision>;

pub(crate) fn execution_manifest(
    anchor: &DirectoryAnchor,
    project: bool,
) -> Result<ExecutionManifest, ErrorCode> {
    let mut manifest = BTreeMap::new();
    let mut entries = if project { 8192 } else { 65536 };
    let mut bytes = 2 * 1024 * 1024 * 1024_u64;
    walk(
        anchor,
        "",
        project,
        0,
        &mut entries,
        &mut bytes,
        &mut manifest,
    )?;
    anchor.validate_chain()?;
    Ok(manifest)
}
fn walk(
    anchor: &DirectoryAnchor,
    prefix: &str,
    project: bool,
    depth: usize,
    entries: &mut usize,
    bytes: &mut u64,
    manifest: &mut ExecutionManifest,
) -> Result<(), ErrorCode> {
    if depth > 32 {
        return Err(ErrorCode::UnsafePath);
    }
    anchor.validate_chain()?;
    for entry in fs::read_dir(anchor.path()).map_err(|_| ErrorCode::IoFailure)? {
        *entries = entries.checked_sub(1).ok_or(ErrorCode::InvalidProposal)?;
        let entry = entry.map_err(|_| ErrorCode::IoFailure)?;
        let name = entry.file_name();
        let name = name.to_str().ok_or(ErrorCode::UnsafePath)?;
        let path = if prefix.is_empty() {
            name.to_string()
        } else {
            format!("{prefix}/{name}")
        };
        if project
            && (path == ".git"
                || path.starts_with(".renpy-editor/")
                    && !matches!(name, "project.json" | "source-map.json" | "authoring.json"))
        {
            continue;
        }
        let metadata = fs::symlink_metadata(entry.path()).map_err(|_| ErrorCode::IoFailure)?;
        if path::is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        if metadata.is_dir() {
            let child = anchor.open_child(OsStr::new(name), false)?;
            walk(&child, &path, project, depth + 1, entries, bytes, manifest)?;
        } else {
            let mut file = anchor.open_file(OsStr::new(name))?;
            let size = file.metadata().map_err(|_| ErrorCode::IoFailure)?.len();
            *bytes = bytes.checked_sub(size).ok_or(ErrorCode::InvalidProposal)?;
            let revision = read_revision_file_bounded(&mut file, 512 * 1024 * 1024)?;
            // Reopen after hashing; replacement must not retain the old grant.
            let current = anchor.open_file(OsStr::new(name))?;
            if identity::identity_for_file(&current).map_err(|_| ErrorCode::IoFailure)?
                != revision.identity
            {
                return Err(ErrorCode::FileIdentityChanged);
            }
            manifest.insert(path, revision);
        }
    }
    anchor.validate_chain()
}

impl TransactionService {
    pub(crate) fn execution_snapshot(
        &self,
        project: &ProjectId,
    ) -> Result<(DirectoryAnchor, ExecutionManifest), PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let anchor = approved.anchor.as_ref().clone();
        let manifest =
            execution_manifest(&anchor, true).map_err(|code| PublicDiagnostic::new(code, None))?;
        Ok((anchor, manifest))
    }
    pub(crate) fn remember_execution_consent(
        &self,
        project: &ProjectId,
        manifest: ExecutionManifest,
    ) {
        if let Ok(mut consent) = self.execution_consent.lock() {
            consent.insert(project.clone(), manifest);
        }
    }
    pub(crate) fn execution_consent_matches(
        &self,
        project: &ProjectId,
        manifest: &ExecutionManifest,
    ) -> bool {
        self.execution_consent
            .lock()
            .is_ok_and(|consent| consent.get(project) == Some(manifest))
    }
    pub(super) fn advance_execution_consent(
        &self,
        project: &ProjectId,
        mutations: &[JournalMutation],
        revisions: &[Revision],
    ) {
        if let Ok(mut consent) = self.execution_consent.lock() {
            if let Some(manifest) = consent.get_mut(project) {
                for (mutation, revision) in mutations.iter().zip(revisions) {
                    let path = mutation.path.as_str();
                    let expected = manifest
                        .get(path)
                        .cloned()
                        .unwrap_or_else(Revision::expected_absence);
                    if expected != mutation.base {
                        consent.remove(project);
                        return;
                    }
                    if mutation.kind == MutationKind::DeleteExisting {
                        manifest.remove(path);
                    } else {
                        manifest.insert(path.into(), revision.clone());
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn runtime_consent_advances_only_accepted_revisions_and_inventories_orphan_bytecode() {
        let temp = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temp.path()).unwrap();
        fs::create_dir(root.join("game")).unwrap();
        fs::write(root.join("game/a.rpy"), b"old").unwrap();
        fs::write(root.join("game/orphan.rpyc"), b"unreviewed compiled code").unwrap();
        let service = TransactionService::default();
        let id = service.register_trusted_project(&root).unwrap();
        let (_, manifest) = service.execution_snapshot(&id).unwrap();
        assert!(manifest.contains_key("game/orphan.rpyc"));
        service.remember_execution_consent(&id, manifest);
        let path = RelativePath::new("game/a.rpy").unwrap();
        let (bytes, base) = service.snapshot(&id, path.clone()).unwrap();
        assert!(matches!(
            service.commit(
                &id,
                TransactionProposal {
                    intent: TransactionIntent::Edit,
                    mutations: vec![FileMutation {
                        path,
                        base,
                        expected_bytes: bytes,
                        proposed: b"accepted".to_vec(),
                        kind: MutationKind::ReplaceExisting
                    }]
                }
            ),
            CommitOutcome::Committed { .. }
        ));
        let (_, accepted) = service.execution_snapshot(&id).unwrap();
        assert!(service.execution_consent_matches(&id, &accepted));
        fs::write(root.join("game/orphan.rpyc"), b"external replacement").unwrap();
        assert!(
            !service.execution_consent_matches(&id, &service.execution_snapshot(&id).unwrap().1)
        );
        fs::write(root.join("game/external.py"), b"print('external')").unwrap();
        assert!(
            !service.execution_consent_matches(&id, &service.execution_snapshot(&id).unwrap().1)
        );
        service.unregister_trusted_project(&id);
        assert!(!service.execution_consent_matches(&id, &accepted));
    }
    #[cfg(unix)]
    #[test]
    fn runtime_manifest_refuses_links_and_root_replacement() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("project");
        fs::create_dir_all(root.join("game")).unwrap();
        let root = fs::canonicalize(root).unwrap();
        let service = TransactionService::default();
        let id = service.register_trusted_project(&root).unwrap();
        std::os::unix::fs::symlink(temp.path(), root.join("game/escape")).unwrap();
        assert!(service.execution_snapshot(&id).is_err());
        fs::remove_file(root.join("game/escape")).unwrap();
        fs::rename(&root, temp.path().join("old-root")).unwrap();
        fs::create_dir_all(root.join("game")).unwrap();
        assert!(service.execution_snapshot(&id).is_err());
    }
}
