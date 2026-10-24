//! Frozen accepted inputs for explicit SDK preview. Nothing here evaluates a project.
use crate::{
    authoring::AuthoringService,
    screens,
    transaction::{DirectoryAnchor, ExecutionManifest, ProjectId, RelativePath},
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "purpose", rename_all = "camelCase", deny_unknown_fields)]
pub enum PreviewPurpose {
    Screen {
        path: String,
        #[serde(rename = "screenName")]
        screen_name: String,
        #[serde(rename = "expectedRevision")]
        expected_revision: String,
    },
}
/// Owns only a newly created per-job directory, never the source project.
pub(crate) struct ScratchPreview {
    root: PathBuf,
    anchor: Option<DirectoryAnchor>,
    pub(crate) manifest: ExecutionManifest,
}
impl ScratchPreview {
    pub(crate) fn prepare(
        authoring: &AuthoringService,
        project: &ProjectId,
        data: &Path,
        source_manifest: &ExecutionManifest,
        purpose: &PreviewPurpose,
    ) -> Result<Self, String> {
        let PreviewPurpose::Screen {
            path,
            screen_name,
            expected_revision,
        } = purpose;
        let document = authoring
            .screens_inspect(project, screens::InspectRequest { path: path.clone() })
            .map_err(|e| format!("{e:?}"))?;
        if &document.revision != expected_revision
            || !document.screens.iter().any(|s| &s.name == screen_name)
        {
            return Err("stale screen".into());
        }
        let id = uuid::Uuid::new_v4().simple().to_string();
        let root = data.join(format!("scratch-preview-{id}"));
        fs::create_dir(&root).map_err(|e| e.to_string())?;
        // Establish ownership before copying, so errors and cancellation clean partial jobs.
        let anchor = DirectoryAnchor::open_root(&root).map_err(|e| {
            let _ = fs::remove_dir(&root);
            format!("{e:?}")
        })?;
        let mut scratch = Self {
            root,
            anchor: Some(anchor),
            manifest: Default::default(),
        };
        let mut total = 0_u64;
        for (path, expected) in source_manifest {
            crate::runtime_work::check().map_err(|e| format!("{e:?}"))?;
            if path.starts_with("game/saves/") || path.starts_with("game/cache/") {
                continue;
            }
            if path.ends_with(".rpa")
                || path.ends_with(".rpyc") && !source_manifest.contains_key(&path[..path.len() - 1])
            {
                return Err("archive or orphan bytecode requires a later preview adapter".into());
            }
            if !path.starts_with("game/") || path.ends_with(".rpyc") {
                continue;
            }
            let (bytes, revision) = authoring
                .transactions
                .snapshot_bounded(
                    project,
                    RelativePath::new(path.clone()).map_err(|e| format!("{e:?}"))?,
                    512 * 1024 * 1024,
                )
                .map_err(|e| format!("{e:?}"))?;
            if &revision != expected {
                return Err("source changed during snapshot".into());
            }
            total += bytes.len() as u64;
            if total > 2 * 1024 * 1024 * 1024 {
                return Err("snapshot exceeds limit".into());
            }
            let target = scratch.root.join(path);
            fs::create_dir_all(target.parent().unwrap()).map_err(|e| e.to_string())?;
            use std::io::Write;
            fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(target)
                .and_then(|mut f| f.write_all(&bytes))
                .map_err(|e| e.to_string())?;
        }
        let entry = format!("loomlight_preview_{id}");
        let helper = format!("{}\ninit 999 python:\n    config.label_overrides[\"start\"] = \"{entry}\"\nlabel {entry}:\n    call screen {screen_name}\n    $ renpy.quit()\n", std::str::from_utf8(crate::lifecycle::runtime::POLICY).unwrap());
        fs::create_dir_all(scratch.root.join("game")).map_err(|e| e.to_string())?;
        fs::write(scratch.root.join(format!("game/{entry}.rpy")), helper)
            .map_err(|e| e.to_string())?;
        scratch.manifest = crate::transaction::execution_manifest(scratch.anchor(), true)
            .map_err(|e| format!("{e:?}"))?;
        Ok(scratch)
    }
    pub(crate) fn anchor(&self) -> &DirectoryAnchor {
        self.anchor
            .as_ref()
            .expect("scratch job is not being cleaned")
    }
    pub(crate) fn cleanup(&mut self) -> bool {
        if self.root.as_os_str().is_empty() {
            return true;
        }
        let Some(anchor) = self.anchor.take() else {
            return false;
        };
        if anchor.validate_chain().is_err() {
            self.anchor = Some(anchor);
            return false;
        }
        // Windows pins the directory against deletion while this owned handle is open.
        // The runtime drops its context clone after child/pipe cleanup, before this call.
        drop(anchor);
        if fs::remove_dir_all(&self.root).is_err() {
            return false;
        }
        self.root.clear();
        true
    }
}
impl Drop for ScratchPreview {
    fn drop(&mut self) {
        let _ = self.cleanup();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn frozen_screen_snapshot_refuses_stale_and_cancellation_and_cleans_owned_job() {
        let tmp = tempfile::tempdir().unwrap();
        let canonical = fs::canonicalize(tmp.path()).unwrap();
        let root = canonical.join("source");
        let data = canonical.join("profile");
        fs::create_dir_all(root.join("game/ui")).unwrap();
        fs::create_dir(&data).unwrap();
        let bytes = include_bytes!("../../../tests/fixtures/phase-3b-screens/help.rpy");
        fs::write(root.join("game/ui/help.rpy"), bytes).unwrap();
        fs::create_dir_all(root.join("game/saves")).unwrap();
        fs::write(root.join("game/saves/persistent"), b"private save").unwrap();
        fs::write(root.join("game/ui/help.rpyc"), b"stale compiled source").unwrap();
        let authoring = AuthoringService::default();
        let project = authoring
            .transactions
            .register_trusted_project(&root)
            .unwrap();
        let (_, manifest) = authoring.transactions.execution_snapshot(&project).unwrap();
        let doc = authoring
            .screens_inspect(
                &project,
                screens::InspectRequest {
                    path: "game/ui/help.rpy".into(),
                },
            )
            .unwrap();
        let purpose = PreviewPurpose::Screen {
            path: doc.path,
            screen_name: "loomlight_help".into(),
            expected_revision: doc.revision,
        };
        let mut job =
            ScratchPreview::prepare(&authoring, &project, &data, &manifest, &purpose).unwrap();
        let job_root = job.root.clone();
        assert_eq!(fs::read(job.root.join("game/ui/help.rpy")).unwrap(), bytes);
        assert!(!job.root.join("game/saves").exists());
        assert!(!job.root.join("game/ui/help.rpyc").exists());
        fs::write(root.join("game/ui/help.rpy"), b"# source changed").unwrap();
        assert_eq!(fs::read(job.root.join("game/ui/help.rpy")).unwrap(), bytes);
        assert!(ScratchPreview::prepare(&authoring, &project, &data, &manifest, &purpose).is_err());
        assert!(job.cleanup());
        assert!(!job_root.exists());
        assert!(job.anchor.is_none());
        assert!(job.cleanup(), "completed cleanup is idempotent");
        fs::write(root.join("game/ui/help.rpy"), bytes).unwrap();
        let (_, manifest) = authoring.transactions.execution_snapshot(&project).unwrap();
        let cancel = std::sync::Arc::new(crate::runtime_work::Cancellation::default());
        cancel.cancel();
        crate::runtime_work::scoped(cancel, || {
            assert!(
                ScratchPreview::prepare(&authoring, &project, &data, &manifest, &purpose).is_err()
            )
        });
        assert_eq!(fs::read_dir(&data).unwrap().count(), 0);
        assert_eq!(
            fs::read(root.join("game/saves/persistent")).unwrap(),
            b"private save"
        );
    }
}
