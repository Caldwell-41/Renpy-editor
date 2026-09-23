//! Phase 1F source buffers and source-authoritative reconciliation.
//!
//! Renderer text is retained only as a bounded, session-local draft. Accepted bytes
//! are read and written through `TransactionService`; mapped Scene acceptance also
//! updates the source map in the same recoverable transaction.

use crate::{
    authoring::{AuthoringMetadata, AuthoringService, PersistenceStatus},
    metadata::{ProjectMetadata, SceneMetadata, SceneSourceMapping, SourceMapMetadata},
    scene::{build_mapping, SceneBeat, SceneError},
    transaction::{
        CommitOutcome, ErrorCode, FileMutation, MutationKind, ProjectId, RelativePath, Revision,
        TransactionIntent, TransactionProposal,
    },
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};

const PROJECT_PATH: &str = ".renpy-editor/project.json";
const SOURCE_MAP_PATH: &str = ".renpy-editor/source-map.json";
const CHARACTERS_PATH: &str = "game/definitions/characters.rpy";
const VARIABLES_PATH: &str = "game/definitions/variables.rpy";
const MAX_SOURCE_BYTES: usize = 16 * 1024 * 1024;
const MAX_DIRTY_BUFFERS: usize = 64;
const MAX_DRAFT_BYTES: usize = 64 * 1024 * 1024;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SourceFileState {
    Clean,
    Dirty,
    Conflict,
    Invalid,
    ReadOnly,
    Unavailable,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceDiagnostic {
    pub code: String,
    pub message: String,
    pub byte_start: u64,
    pub byte_end: u64,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRange {
    pub scene_id: String,
    pub beat_id: String,
    pub kind: String,
    pub byte_start: u64,
    pub byte_end: u64,
    pub editor_start: u64,
    pub editor_end: u64,
    pub protected: bool,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceFileSummary {
    pub path: String,
    pub state: SourceFileState,
    pub scene_id: Option<String>,
    pub dirty: bool,
    pub read_only: bool,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceInventory {
    pub files: Vec<SourceFileSummary>,
    pub dirty_count: u64,
    pub draft_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceDocument {
    pub path: String,
    pub text: Option<String>,
    pub state: SourceFileState,
    pub editable: bool,
    pub dirty: bool,
    pub base_revision: String,
    pub live_revision: Option<String>,
    pub draft_version: u64,
    pub has_bom: bool,
    pub newline: String,
    pub partial: bool,
    pub diagnostics: Vec<SourceDiagnostic>,
    pub ranges: Vec<SourceRange>,
    pub selection_start: u64,
    pub selection_end: u64,
    pub selected_scene_id: Option<String>,
    pub selected_beat_id: Option<String>,
    pub can_apply_both: bool,
    pub combined_preview: Option<String>,
    pub external_text: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceOpenRequest {
    pub path: String,
    pub selection_start: Option<u64>,
    pub selection_end: Option<u64>,
    pub byte_start: Option<u64>,
    pub byte_end: Option<u64>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceDraftRequest {
    pub path: String,
    pub expected_base_revision: String,
    pub text: String,
    pub selection_start: u64,
    pub selection_end: u64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceSaveRequest {
    pub path: String,
    pub expected_base_revision: String,
    pub expected_draft_version: u64,
}

/// Confirmation of the exact displayed combination, never a request to re-merge latest bytes.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceApplyBothRequest {
    pub path: String,
    pub expected_base_revision: String,
    pub expected_draft_version: u64,
    pub expected_external_revision: String,
    pub expected_combined_text: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourcePathRequest {
    pub path: String,
}

#[derive(Clone, Debug)]
struct SourceBuffer {
    path: String,
    base_bytes: Vec<u8>,
    base_revision: Revision,
    draft: Option<String>,
    draft_version: u64,
    selection_start: u64,
    selection_end: u64,
    external: Option<(Vec<u8>, Revision)>,
    unavailable: bool,
    projection_invalid: bool,
}

#[derive(Default)]
pub(crate) struct SourceSessions {
    projects: HashMap<ProjectId, HashMap<String, SourceBuffer>>,
}

#[derive(Debug, Eq, PartialEq)]
pub enum SourceError {
    InvalidPayload,
    UnknownFile,
    InvalidUtf8,
    Oversize,
    DraftLimit,
    InvalidSource,
    UnsupportedMappedDefinition,
    SourceConflict,
    DirtySource,
    RecoveryRequired,
    HistoryBoundary,
    Io,
}

#[derive(Clone)]
struct PreparedSource {
    path: String,
    proposed: Vec<u8>,
    base_bytes: Vec<u8>,
    base_revision: Revision,
}

impl AuthoringService {
    pub fn source_inventory(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<SourceInventory, SourceError> {
        self.source_refresh_project(project, project_id)?;
        let metadata = self.project_metadata(project, project_id)?;
        let scene_paths: HashMap<_, _> = metadata
            .scenes
            .iter()
            .map(|scene| (scene.source_path.as_str(), scene.id.as_str()))
            .collect();
        let mut paths = self
            .transactions
            .inventory_files(project, "game")
            .map_err(transaction_error)?;
        paths.retain(|path| path.ends_with(".rpy"));
        paths.sort();
        let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        let buffers = sessions.projects.get(project);
        let files = paths
            .into_iter()
            .map(|path| {
                let buffer = buffers.and_then(|items| items.get(&path));
                let invalid = buffer
                    .map(|item| accepted_text(&item.base_bytes).is_err())
                    .unwrap_or(false);
                SourceFileSummary {
                    scene_id: scene_paths
                        .get(path.as_str())
                        .map(|value| (*value).to_owned()),
                    state: buffer.map(buffer_state).unwrap_or(SourceFileState::Clean),
                    dirty: buffer.is_some_and(|item| item.draft.is_some()),
                    read_only: invalid,
                    path,
                }
            })
            .collect();
        let (dirty_count, draft_bytes) = draft_totals(buffers);
        Ok(SourceInventory {
            files,
            dirty_count: dirty_count as u64,
            draft_bytes: draft_bytes as u64,
        })
    }

    pub fn source_open(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SourceOpenRequest,
    ) -> Result<SourceDocument, SourceError> {
        validate_source_path(&request.path)?;
        self.ensure_buffer(project, &request.path)?;
        {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get_mut(project)
                .and_then(|items| items.get_mut(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            if let Some(start) = request.byte_start {
                let bom = usize::from(buffer.base_bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
                buffer.selection_start = byte_to_utf16(
                    strip_bom(&buffer.base_bytes),
                    (start as usize).saturating_sub(bom),
                ) as u64;
                buffer.selection_end = byte_to_utf16(
                    strip_bom(&buffer.base_bytes),
                    (request.byte_end.unwrap_or(start) as usize).saturating_sub(bom),
                ) as u64;
            } else if let Some(start) = request.selection_start {
                buffer.selection_start = start;
                buffer.selection_end = request.selection_end.unwrap_or(start);
            }
        }
        self.refresh_buffer(project, &request.path)?;
        self.reconcile_clean_source(project, project_id, &request.path)?;
        self.source_document(project, project_id, &request.path)
    }

    pub fn source_update_draft(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SourceDraftRequest,
    ) -> Result<SourceDocument, SourceError> {
        validate_source_path(&request.path)?;
        if request.text.len() > MAX_SOURCE_BYTES {
            return Err(SourceError::Oversize);
        }
        self.ensure_buffer(project, &request.path)?;
        let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        let buffers = sessions
            .projects
            .get_mut(project)
            .ok_or(SourceError::UnknownFile)?;
        let accepted = buffers.get(&request.path).ok_or(SourceError::UnknownFile)?;
        if accepted.base_revision.sha256 != request.expected_base_revision {
            return Err(SourceError::SourceConflict);
        }
        let accepted_value = accepted_text(&accepted.base_bytes)?;
        let next_draft = (request.text != accepted_value).then_some(request.text);
        let draft_changed = accepted.draft != next_draft;
        let mut dirty_count = 0usize;
        let mut draft_bytes = 0usize;
        for (path, buffer) in buffers.iter() {
            let candidate = if path == &request.path {
                next_draft.as_ref()
            } else {
                buffer.draft.as_ref()
            };
            if let Some(value) = candidate {
                dirty_count += 1;
                draft_bytes = draft_bytes.saturating_add(value.len());
            }
        }
        if dirty_count > MAX_DIRTY_BUFFERS || draft_bytes > MAX_DRAFT_BYTES {
            return Err(SourceError::DraftLimit);
        }
        let buffer = buffers
            .get_mut(&request.path)
            .ok_or(SourceError::UnknownFile)?;
        buffer.draft = next_draft;
        if draft_changed {
            buffer.draft_version = buffer.draft_version.saturating_add(1);
        }
        let length = buffer
            .draft
            .as_deref()
            .unwrap_or(&accepted_value)
            .encode_utf16()
            .count() as u64;
        buffer.selection_start = request.selection_start.min(length);
        buffer.selection_end = request.selection_end.min(length);
        drop(sessions);
        self.source_document(project, project_id, &request.path)
    }

    pub fn source_save(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SourceSaveRequest,
    ) -> Result<SourceDocument, SourceError> {
        validate_source_path(&request.path)?;
        self.refresh_buffer(project, &request.path)?;
        let prepared = {
            let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get(project)
                .and_then(|items| items.get(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            if buffer.base_revision.sha256 != request.expected_base_revision
                || buffer.draft_version != request.expected_draft_version
            {
                return Err(SourceError::SourceConflict);
            }
            prepare_buffer(buffer)?
        };
        if let Some(prepared) = prepared {
            let proposal = self.source_proposal(project, project_id, vec![prepared])?;
            self.commit_source_history(project, proposal)?;
            self.accept_committed_paths(project, std::slice::from_ref(&request.path))?;
        }
        self.source_document(project, project_id, &request.path)
    }

    pub fn source_save_all(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<SourceInventory, SourceError> {
        self.source_refresh_all(project)?;
        let (prepared, paths) = {
            let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffers = sessions.projects.get(project);
            let mut prepared = Vec::new();
            let mut paths = Vec::new();
            for buffer in buffers.into_iter().flat_map(|items| items.values()) {
                if let Some(value) = prepare_buffer(buffer)? {
                    paths.push(value.path.clone());
                    prepared.push(value);
                }
            }
            (prepared, paths)
        };
        if !prepared.is_empty() {
            let proposal = self.source_proposal(project, project_id, prepared)?;
            self.commit_source_history(project, proposal)?;
            self.accept_committed_paths(project, &paths)?;
        }
        self.source_inventory(project, project_id)
    }

    pub fn source_discard(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SourcePathRequest,
    ) -> Result<SourceDocument, SourceError> {
        validate_source_path(&request.path)?;
        self.ensure_buffer(project, &request.path)?;
        {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get_mut(project)
                .and_then(|items| items.get_mut(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            buffer.draft = None;
            buffer.external = None;
            buffer.draft_version = buffer.draft_version.saturating_add(1);
        }
        self.refresh_buffer(project, &request.path)?;
        self.reconcile_clean_source(project, project_id, &request.path)?;
        self.source_document(project, project_id, &request.path)
    }

    pub fn source_discard_all(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<SourceInventory, SourceError> {
        let paths = {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffers = sessions.projects.entry(project.clone()).or_default();
            for buffer in buffers.values_mut() {
                buffer.draft = None;
                buffer.external = None;
                buffer.draft_version = buffer.draft_version.saturating_add(1);
            }
            buffers.keys().cloned().collect::<Vec<_>>()
        };
        for path in paths {
            self.refresh_buffer(project, &path)?;
            self.reconcile_clean_source(project, project_id, &path)?;
        }
        self.source_inventory(project, project_id)
    }

    pub fn source_apply_both(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SourceApplyBothRequest,
    ) -> Result<SourceDocument, SourceError> {
        let proposal = self.prepare_apply_both(project, project_id, &request)?;
        self.commit_source_history(project, proposal)?;
        self.accept_committed_paths(project, std::slice::from_ref(&request.path))?;
        self.source_document(project, project_id, &request.path)
    }

    fn prepare_apply_both(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: &SourceApplyBothRequest,
    ) -> Result<TransactionProposal, SourceError> {
        validate_source_path(&request.path)?;
        self.refresh_buffer(project, &request.path)?;
        let prepared = {
            let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get(project)
                .and_then(|items| items.get(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            if buffer.base_revision.sha256 != request.expected_base_revision
                || buffer.draft_version != request.expected_draft_version
            {
                return Err(SourceError::SourceConflict);
            }
            let draft = proposed_bytes(buffer)?;
            let (external, revision) =
                buffer.external.clone().ok_or(SourceError::SourceConflict)?;
            let combined = combine_non_overlapping(&buffer.base_bytes, &draft, &external)
                .ok_or(SourceError::SourceConflict)?;
            if revision.sha256 != request.expected_external_revision
                || accepted_text(&combined)? != request.expected_combined_text
            {
                return Err(SourceError::SourceConflict);
            }
            PreparedSource {
                path: buffer.path.clone(),
                proposed: combined,
                base_bytes: external,
                base_revision: revision,
            }
        };
        self.source_proposal(project, project_id, vec![prepared])
    }

    pub(crate) fn clear_source_project(&self, project: &ProjectId) {
        if let Ok(mut sessions) = self.source_sessions.lock() {
            sessions.projects.remove(project);
        }
    }

    pub(crate) fn source_persistence_status(&self, project: &ProjectId) -> PersistenceStatus {
        let Ok(sessions) = self.source_sessions.lock() else {
            return PersistenceStatus::RecoveryRequired;
        };
        let Some(buffers) = sessions.projects.get(project) else {
            return PersistenceStatus::Saved;
        };
        if buffers.values().any(|buffer| {
            buffer.external.is_some() || buffer.unavailable || buffer.projection_invalid
        }) {
            PersistenceStatus::Conflict
        } else if buffers.values().any(|buffer| buffer.draft.is_some()) {
            PersistenceStatus::PendingValidation
        } else {
            PersistenceStatus::Saved
        }
    }

    pub(crate) fn has_dirty_sources(&self, project: &ProjectId) -> bool {
        self.source_sessions
            .lock()
            .ok()
            .and_then(|sessions| {
                sessions
                    .projects
                    .get(project)
                    .map(|items| items.values().any(|item| item.draft.is_some()))
            })
            .unwrap_or(false)
    }

    pub(crate) fn ensure_source_paths_clean<'a>(
        &self,
        project: &ProjectId,
        paths: impl IntoIterator<Item = &'a str>,
    ) -> Result<(), SourceError> {
        let wanted: HashSet<&str> = paths.into_iter().collect();
        let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        if sessions.projects.get(project).is_some_and(|buffers| {
            buffers.values().any(|buffer| {
                wanted.contains(buffer.path.as_str())
                    && (buffer.draft.is_some()
                        || buffer.external.is_some()
                        || buffer.unavailable
                        || buffer.projection_invalid)
            })
        }) {
            Err(SourceError::DirtySource)
        } else {
            Ok(())
        }
    }

    pub(crate) fn source_refresh_project(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<(), SourceError> {
        self.source_refresh_all(project)?;
        let paths = self
            .source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .get(project)
            .map(|items| items.keys().cloned().collect::<Vec<_>>())
            .unwrap_or_default();
        for path in paths {
            match self.reconcile_clean_source(project, project_id, &path) {
                Ok(()) | Err(SourceError::InvalidSource) => {}
                Err(error) => return Err(error),
            }
        }
        Ok(())
    }

    fn source_refresh_all(&self, project: &ProjectId) -> Result<(), SourceError> {
        let paths = self
            .source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .get(project)
            .map(|items| items.keys().cloned().collect::<Vec<_>>())
            .unwrap_or_default();
        for path in paths {
            self.refresh_buffer(project, &path)?;
        }
        Ok(())
    }

    fn ensure_buffer(&self, project: &ProjectId, path: &str) -> Result<(), SourceError> {
        if self
            .source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .get(project)
            .is_some_and(|items| items.contains_key(path))
        {
            return Ok(());
        }
        let (count, _) = self
            .transactions
            .inspect_file(
                project,
                RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?,
            )
            .map_err(transaction_error)?
            .ok_or(SourceError::UnknownFile)?;
        if count > MAX_SOURCE_BYTES as u64 {
            return Err(SourceError::Oversize);
        }
        let (bytes, revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?,
            )
            .map_err(transaction_error)?;
        if bytes.len() > MAX_SOURCE_BYTES {
            return Err(SourceError::Oversize);
        }
        let buffer = SourceBuffer {
            path: path.to_owned(),
            base_bytes: bytes,
            base_revision: revision,
            draft: None,
            draft_version: 0,
            selection_start: 0,
            selection_end: 0,
            external: None,
            unavailable: false,
            projection_invalid: false,
        };
        self.source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .entry(project.clone())
            .or_default()
            .entry(path.to_owned())
            .or_insert(buffer);
        Ok(())
    }

    fn refresh_buffer(&self, project: &ProjectId, path: &str) -> Result<(), SourceError> {
        let snapshot = self.transactions.snapshot_optional(
            project,
            RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?,
        );
        let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        let buffer = sessions
            .projects
            .get_mut(project)
            .and_then(|items| items.get_mut(path))
            .ok_or(SourceError::UnknownFile)?;
        match snapshot {
            Ok(Some((_bytes, revision))) if revision == buffer.base_revision => {
                buffer.unavailable = false;
                if buffer.draft.is_none() {
                    buffer.external = None;
                }
            }
            Ok(Some((bytes, revision))) if buffer.draft.is_some() => {
                buffer.external = Some((bytes, revision));
                buffer.unavailable = false;
            }
            Ok(Some((bytes, revision))) => {
                buffer.base_bytes = bytes;
                buffer.base_revision = revision;
                buffer.external = None;
                buffer.unavailable = false;
                buffer.projection_invalid = false;
                let max = accepted_text(&buffer.base_bytes)
                    .map(|value| value.encode_utf16().count() as u64)
                    .unwrap_or(0);
                buffer.selection_start = buffer.selection_start.min(max);
                buffer.selection_end = buffer.selection_end.min(max);
            }
            Ok(None) => {
                buffer.unavailable = true;
                buffer.external = None;
            }
            Err(_) => {
                buffer.unavailable = true;
                buffer.external = None;
            }
        }
        Ok(())
    }

    fn source_document(
        &self,
        project: &ProjectId,
        project_id: &str,
        path: &str,
    ) -> Result<SourceDocument, SourceError> {
        let (buffer, metadata) = {
            let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get(project)
                .and_then(|items| items.get(path))
                .cloned()
                .ok_or(SourceError::UnknownFile)?;
            (buffer, self.project_metadata(project, project_id)?)
        };
        let text = buffer
            .draft
            .clone()
            .or_else(|| accepted_text(&buffer.base_bytes).ok());
        let scene = metadata
            .scenes
            .iter()
            .find(|scene| scene.source_path == path);
        let (ranges, parse_invalid) = if let (Some(scene), Some(value)) = (scene, text.as_deref()) {
            self.source_ranges(project, project_id, scene, value, &buffer.base_bytes)?
        } else {
            (Vec::new(), false)
        };
        let mut diagnostics = Vec::new();
        if buffer.unavailable {
            diagnostics.push(diagnostic(
                "SOURCE_UNAVAILABLE",
                "The accepted source path is missing or unsafe.",
                0,
                0,
            ));
        } else if accepted_text(&buffer.base_bytes).is_err() {
            diagnostics.push(diagnostic(
                "INVALID_UTF8",
                "Invalid UTF-8 is preserved byte-for-byte and is read-only.",
                0,
                buffer.base_bytes.len(),
            ));
        } else if parse_invalid {
            diagnostics.push(diagnostic(
                "INVALID_SOURCE",
                "The Scene label or supported structure is incomplete or ambiguous.",
                0,
                text.as_ref().map_or(0, String::len),
            ));
        }
        if matches!(path, CHARACTERS_PATH | VARIABLES_PATH) && buffer.draft.is_some() {
            diagnostics.push(diagnostic("MAPPED_DEFINITION", "Mapped Character and Variable definitions must be changed in their authoring workspace.", 0, text.as_ref().map_or(0, String::len)));
        }
        let combined = buffer.external.as_ref().and_then(|(external, _)| {
            proposed_bytes(&buffer)
                .ok()
                .and_then(|draft| combine_non_overlapping(&buffer.base_bytes, &draft, external))
        });
        let external_text = buffer
            .external
            .as_ref()
            .and_then(|(bytes, _)| accepted_text(bytes).ok());
        let selected = buffer
            .draft
            .is_none()
            .then(|| {
                ranges.iter().find(|range| {
                    !range.protected
                        && buffer.selection_start >= range.editor_start
                        && buffer.selection_start <= range.editor_end
                })
            })
            .flatten();
        let selected_scene_id = selected.map(|range| range.scene_id.clone());
        let selected_beat_id = selected.map(|range| range.beat_id.clone());
        let invalid_utf8 = accepted_text(&buffer.base_bytes).is_err();
        let invalid = parse_invalid || buffer.projection_invalid;
        Ok(SourceDocument {
            path: path.to_owned(),
            text,
            state: if invalid {
                SourceFileState::Invalid
            } else {
                buffer_state(&buffer)
            },
            editable: !invalid_utf8 && !buffer.unavailable,
            dirty: buffer.draft.is_some(),
            base_revision: buffer.base_revision.sha256.clone(),
            live_revision: buffer
                .external
                .as_ref()
                .map(|(_, revision)| revision.sha256.clone())
                .or_else(|| (!buffer.unavailable).then(|| buffer.base_revision.sha256.clone())),
            draft_version: buffer.draft_version,
            has_bom: buffer.base_bytes.starts_with(&[0xef, 0xbb, 0xbf]),
            newline: newline_name(&buffer.base_bytes).into(),
            partial: invalid || scene.is_none() || ranges.iter().any(|range| range.protected),
            diagnostics,
            ranges,
            selection_start: buffer.selection_start,
            selection_end: buffer.selection_end,
            selected_scene_id,
            selected_beat_id,
            can_apply_both: combined.is_some(),
            combined_preview: combined.and_then(|bytes| accepted_text(&bytes).ok()),
            external_text,
        })
    }

    fn source_ranges(
        &self,
        project: &ProjectId,
        project_id: &str,
        scene: &crate::metadata::SceneMetadata,
        editor_text: &str,
        base_bytes: &[u8],
    ) -> Result<(Vec<SourceRange>, bool), SourceError> {
        let project_metadata = self.project_metadata(project, project_id)?;
        let authoring = self
            .list(project, project_id)
            .map_err(|_| SourceError::Io)?;
        let (map_bytes, _) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let source_map =
            SourceMapMetadata::read_bytes(&map_bytes, project_id).map_err(|_| SourceError::Io)?;
        let previous = source_map
            .scene_mappings
            .iter()
            .find(|mapping| mapping.scene_id == scene.id);
        let proposed = with_original_bom(editor_text, base_bytes);
        let revision = sha256(&proposed);
        let mapping = build_reconciled_mapping(
            scene,
            &proposed,
            &revision,
            previous,
            Some((&project_metadata, &authoring)),
        );
        let Ok((_, beats)) = mapping else {
            return Ok((Vec::new(), true));
        };
        let bom = usize::from(proposed.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
        let ranges = beats
            .into_iter()
            .map(|beat| SourceRange {
                scene_id: scene.id.clone(),
                beat_id: beat.id,
                kind: beat.payload.kind().into(),
                byte_start: beat.byte_start,
                byte_end: beat.byte_end,
                editor_start: byte_to_utf16(
                    &proposed[bom..],
                    (beat.byte_start as usize).saturating_sub(bom),
                ) as u64,
                editor_end: byte_to_utf16(
                    &proposed[bom..],
                    (beat.byte_end as usize).saturating_sub(bom),
                ) as u64,
                protected: beat.protected,
            })
            .collect();
        Ok((ranges, false))
    }

    fn source_proposal(
        &self,
        project: &ProjectId,
        project_id: &str,
        prepared: Vec<PreparedSource>,
    ) -> Result<TransactionProposal, SourceError> {
        if self
            .transactions
            .recovery_blocker(project)
            .map_err(transaction_error)?
            .is_some()
        {
            return Err(SourceError::RecoveryRequired);
        }
        let (project_bytes, _) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(PROJECT_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let project_metadata =
            ProjectMetadata::read_bytes(&project_bytes, None).map_err(|_| SourceError::Io)?;
        if project_metadata.project_id != project_id {
            return Err(SourceError::Io);
        }
        let authoring = self
            .list(project, project_id)
            .map_err(|_| SourceError::Io)?;
        let (map_bytes, map_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let mut source_map =
            SourceMapMetadata::read_bytes(&map_bytes, project_id).map_err(|_| SourceError::Io)?;
        let mut map_changed = false;
        let mut mutations = Vec::new();
        for item in prepared {
            if matches!(item.path.as_str(), CHARACTERS_PATH | VARIABLES_PATH) {
                return Err(SourceError::UnsupportedMappedDefinition);
            }
            if item.proposed.len() > MAX_SOURCE_BYTES {
                return Err(SourceError::Oversize);
            }
            if std::str::from_utf8(strip_bom(&item.proposed)).is_err() {
                return Err(SourceError::InvalidUtf8);
            }
            if let Some(scene) = project_metadata
                .scenes
                .iter()
                .find(|scene| scene.source_path == item.path)
            {
                let previous = source_map
                    .scene_mappings
                    .iter()
                    .find(|mapping| mapping.scene_id == scene.id)
                    .cloned();
                let revision = sha256(&item.proposed);
                let (mapping, _) = build_reconciled_mapping(
                    scene,
                    &item.proposed,
                    &revision,
                    previous.as_ref(),
                    Some((&project_metadata, &authoring)),
                )
                .map_err(scene_source_error)?;
                let slot = source_map
                    .scene_mappings
                    .iter_mut()
                    .find(|mapping| mapping.scene_id == scene.id)
                    .ok_or(SourceError::InvalidSource)?;
                *slot = mapping;
                map_changed = true;
            }
            mutations.push(FileMutation {
                path: RelativePath::new(item.path).map_err(|_| SourceError::InvalidPayload)?,
                kind: MutationKind::ReplaceExisting,
                base: item.base_revision,
                expected_bytes: item.base_bytes,
                proposed: item.proposed,
            });
        }
        if map_changed {
            source_map
                .validate(project_id)
                .map_err(|_| SourceError::InvalidSource)?;
            mutations.push(FileMutation {
                path: RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
                kind: MutationKind::ReplaceExisting,
                base: map_revision,
                expected_bytes: map_bytes,
                proposed: serde_json::to_vec_pretty(&source_map).map_err(|_| SourceError::Io)?,
            });
        }
        Ok(TransactionProposal {
            mutations,
            intent: TransactionIntent::Edit,
        })
    }

    fn reconcile_clean_source(
        &self,
        project: &ProjectId,
        project_id: &str,
        path: &str,
    ) -> Result<(), SourceError> {
        let buffer = self
            .source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .get(project)
            .and_then(|items| items.get(path))
            .filter(|item| item.draft.is_none() && item.external.is_none() && !item.unavailable)
            .cloned();
        let Some(buffer) = buffer else {
            return Ok(());
        };
        let project_metadata = self.project_metadata(project, project_id)?;
        let Some(scene) = project_metadata
            .scenes
            .iter()
            .find(|scene| scene.source_path == path)
        else {
            return Ok(());
        };
        let (map_bytes, map_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let mut source_map =
            SourceMapMetadata::read_bytes(&map_bytes, project_id).map_err(|_| SourceError::Io)?;
        let previous = source_map
            .scene_mappings
            .iter()
            .find(|mapping| mapping.scene_id == scene.id)
            .cloned()
            .ok_or(SourceError::InvalidSource)?;
        if previous.source_revision == buffer.base_revision.sha256 {
            return Ok(());
        }
        let authoring = self
            .list(project, project_id)
            .map_err(|_| SourceError::Io)?;
        let reconciled = build_reconciled_mapping(
            scene,
            &buffer.base_bytes,
            &buffer.base_revision.sha256,
            Some(&previous),
            Some((&project_metadata, &authoring)),
        );
        let (mapping, _) = match reconciled {
            Ok(value) => value,
            Err(error) => {
                let error = scene_source_error(error);
                if error == SourceError::InvalidSource {
                    if let Some(current) = self
                        .source_sessions
                        .lock()
                        .map_err(|_| SourceError::Io)?
                        .projects
                        .get_mut(project)
                        .and_then(|items| items.get_mut(path))
                    {
                        current.projection_invalid = true;
                    }
                    return Ok(());
                }
                return Err(error);
            }
        };
        *source_map
            .scene_mappings
            .iter_mut()
            .find(|stored| stored.scene_id == scene.id)
            .ok_or(SourceError::InvalidSource)? = mapping;
        source_map
            .validate(project_id)
            .map_err(|_| SourceError::InvalidSource)?;
        let outcome = self.transactions.commit(
            project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path: RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
                    kind: MutationKind::ReplaceExisting,
                    base: map_revision,
                    expected_bytes: map_bytes,
                    proposed: serde_json::to_vec_pretty(&source_map)
                        .map_err(|_| SourceError::Io)?,
                }],
                intent: TransactionIntent::Edit,
            },
        );
        match outcome {
            CommitOutcome::Committed { .. } => {
                if let Some(current) = self
                    .source_sessions
                    .lock()
                    .map_err(|_| SourceError::Io)?
                    .projects
                    .get_mut(project)
                    .and_then(|items| items.get_mut(path))
                {
                    current.projection_invalid = false;
                }
                Ok(())
            }
            other => Err(commit_error(other)),
        }
    }

    fn commit_source_history(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
    ) -> Result<(), SourceError> {
        self.commit_history(project, proposal)
            .map(|_| ())
            .map_err(scene_source_error)
    }

    fn accept_committed_paths(
        &self,
        project: &ProjectId,
        paths: &[String],
    ) -> Result<(), SourceError> {
        let snapshots = paths
            .iter()
            .map(|path| {
                self.transactions
                    .snapshot(
                        project,
                        RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?,
                    )
                    .map_err(transaction_error)
                    .map(|snapshot| (path.clone(), snapshot))
            })
            .collect::<Result<Vec<_>, _>>()?;
        let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        let buffers = sessions
            .projects
            .get_mut(project)
            .ok_or(SourceError::UnknownFile)?;
        for (path, (bytes, revision)) in snapshots {
            let buffer = buffers.get_mut(&path).ok_or(SourceError::UnknownFile)?;
            buffer.base_bytes = bytes;
            buffer.base_revision = revision;
            buffer.draft = None;
            buffer.external = None;
            buffer.unavailable = false;
            buffer.projection_invalid = false;
            buffer.draft_version = buffer.draft_version.saturating_add(1);
        }
        Ok(())
    }

    fn project_metadata(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<ProjectMetadata, SourceError> {
        let (bytes, _) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(PROJECT_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let metadata = ProjectMetadata::read_bytes(&bytes, None).map_err(|_| SourceError::Io)?;
        (metadata.project_id == project_id)
            .then_some(metadata)
            .ok_or(SourceError::Io)
    }
}

fn build_reconciled_mapping(
    scene: &SceneMetadata,
    bytes: &[u8],
    revision: &str,
    previous: Option<&SceneSourceMapping>,
    context: Option<(&ProjectMetadata, &AuthoringMetadata)>,
) -> Result<(SceneSourceMapping, Vec<SceneBeat>), SceneError> {
    let (candidate, candidate_beats) =
        build_mapping(scene, bytes, revision, previous, &[], context)?;
    let Some(previous) = previous else {
        return Ok((candidate, candidate_beats));
    };
    let previous_ids = previous
        .beats
        .iter()
        .map(|beat| beat.id.as_str())
        .collect::<HashSet<_>>();
    let candidate_ids = candidate
        .beats
        .iter()
        .map(|beat| beat.id.as_str())
        .collect::<HashSet<_>>();
    let mut unmatched_before: HashMap<&str, Vec<&crate::metadata::BeatSourceMapping>> =
        HashMap::new();
    for beat in &previous.beats {
        if !candidate_ids.contains(beat.id.as_str()) {
            unmatched_before
                .entry(beat.kind.as_str())
                .or_default()
                .push(beat);
        }
    }
    let mut unmatched_after: HashMap<&str, Vec<&crate::metadata::BeatSourceMapping>> =
        HashMap::new();
    for beat in &candidate.beats {
        if !previous_ids.contains(beat.id.as_str()) {
            unmatched_after
                .entry(beat.kind.as_str())
                .or_default()
                .push(beat);
        }
    }
    let mut forced = Vec::new();
    for (kind, before) in unmatched_before {
        let Some(after) = unmatched_after.get(kind) else {
            continue;
        };
        if before.len() == 1 && after.len() == 1 {
            forced.push((
                kind.to_owned(),
                after[0].source_sha256.clone(),
                before[0].id.clone(),
            ));
        }
    }
    if forced.is_empty() {
        Ok((candidate, candidate_beats))
    } else {
        build_mapping(scene, bytes, revision, Some(previous), &forced, context)
    }
}

fn validate_source_path(path: &str) -> Result<(), SourceError> {
    RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?;
    if !path.starts_with("game/") || !path.ends_with(".rpy") || path.ends_with(".rpyc") {
        return Err(SourceError::InvalidPayload);
    }
    Ok(())
}

fn prepare_buffer(buffer: &SourceBuffer) -> Result<Option<PreparedSource>, SourceError> {
    if buffer.unavailable || buffer.external.is_some() {
        return Err(SourceError::SourceConflict);
    }
    let Some(_) = buffer.draft else {
        return Ok(None);
    };
    Ok(Some(PreparedSource {
        path: buffer.path.clone(),
        proposed: proposed_bytes(buffer)?,
        base_bytes: buffer.base_bytes.clone(),
        base_revision: buffer.base_revision.clone(),
    }))
}

fn proposed_bytes(buffer: &SourceBuffer) -> Result<Vec<u8>, SourceError> {
    let text = buffer.draft.as_deref().ok_or(SourceError::InvalidSource)?;
    Ok(with_original_bom(text, &buffer.base_bytes))
}

fn accepted_text(bytes: &[u8]) -> Result<String, SourceError> {
    std::str::from_utf8(strip_bom(bytes))
        .map(str::to_owned)
        .map_err(|_| SourceError::InvalidUtf8)
}

fn strip_bom(bytes: &[u8]) -> &[u8] {
    bytes.strip_prefix(&[0xef, 0xbb, 0xbf]).unwrap_or(bytes)
}

fn with_original_bom(text: &str, base: &[u8]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(text.len() + 3);
    if base.starts_with(&[0xef, 0xbb, 0xbf]) {
        bytes.extend_from_slice(&[0xef, 0xbb, 0xbf]);
    }
    bytes.extend_from_slice(text.as_bytes());
    bytes
}

fn buffer_state(buffer: &SourceBuffer) -> SourceFileState {
    if buffer.unavailable {
        SourceFileState::Unavailable
    } else if buffer.external.is_some() {
        SourceFileState::Conflict
    } else if accepted_text(&buffer.base_bytes).is_err() {
        SourceFileState::ReadOnly
    } else if buffer.projection_invalid {
        SourceFileState::Invalid
    } else if buffer.draft.is_some() {
        SourceFileState::Dirty
    } else {
        SourceFileState::Clean
    }
}

fn draft_totals(buffers: Option<&HashMap<String, SourceBuffer>>) -> (usize, usize) {
    buffers.map_or((0, 0), |items| {
        items.values().fold((0, 0), |(count, bytes), item| {
            item.draft.as_ref().map_or((count, bytes), |draft| {
                (count + 1, bytes.saturating_add(draft.len()))
            })
        })
    })
}

fn diagnostic(code: &str, message: &str, start: usize, end: usize) -> SourceDiagnostic {
    SourceDiagnostic {
        code: code.into(),
        message: message.into(),
        byte_start: start as u64,
        byte_end: end as u64,
    }
}

fn newline_name(bytes: &[u8]) -> &'static str {
    if strip_bom(bytes).windows(2).any(|window| window == b"\r\n") {
        "CRLF"
    } else {
        "LF"
    }
}

fn byte_to_utf16(bytes: &[u8], offset: usize) -> usize {
    let boundary = offset.min(bytes.len());
    std::str::from_utf8(&bytes[..boundary])
        .map(|value| value.encode_utf16().count())
        .unwrap_or(0)
}

#[derive(Clone)]
struct Patch {
    start: usize,
    end: usize,
    replacement: Vec<u8>,
}

fn single_patch(base: &[u8], changed: &[u8]) -> Patch {
    let mut start = 0;
    while start < base.len() && start < changed.len() && base[start] == changed[start] {
        start += 1;
    }
    let mut base_end = base.len();
    let mut changed_end = changed.len();
    while base_end > start && changed_end > start && base[base_end - 1] == changed[changed_end - 1]
    {
        base_end -= 1;
        changed_end -= 1;
    }
    Patch {
        start,
        end: base_end,
        replacement: changed[start..changed_end].to_vec(),
    }
}

fn combine_non_overlapping(base: &[u8], draft: &[u8], external: &[u8]) -> Option<Vec<u8>> {
    let draft_patch = single_patch(base, draft);
    let external_patch = single_patch(base, external);
    let separated =
        draft_patch.end <= external_patch.start || external_patch.end <= draft_patch.start;
    // Two insertions at the same position have no provable ordering.
    let same_position = draft_patch.start == external_patch.start;
    if !separated || same_position || apply_single(base, &external_patch) != external {
        return None;
    }
    let mut patches = [draft_patch, external_patch];
    patches.sort_by_key(|patch| patch.start);
    let mut result = Vec::with_capacity(
        base.len()
            + patches
                .iter()
                .map(|patch| patch.replacement.len())
                .sum::<usize>(),
    );
    let mut cursor = 0;
    for patch in patches {
        result.extend_from_slice(&base[cursor..patch.start]);
        result.extend_from_slice(&patch.replacement);
        cursor = patch.end;
    }
    result.extend_from_slice(&base[cursor..]);
    Some(result)
}

fn apply_single(base: &[u8], patch: &Patch) -> Vec<u8> {
    let mut result = Vec::with_capacity(base.len() + patch.replacement.len());
    result.extend_from_slice(&base[..patch.start]);
    result.extend_from_slice(&patch.replacement);
    result.extend_from_slice(&base[patch.end..]);
    result
}

fn sha256(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn transaction_error(error: crate::transaction::PublicDiagnostic) -> SourceError {
    match error.code {
        ErrorCode::RecoveryRequired => SourceError::RecoveryRequired,
        ErrorCode::Conflict
        | ErrorCode::StaleRevision
        | ErrorCode::ExpectedBytesChanged
        | ErrorCode::FileIdentityChanged => SourceError::SourceConflict,
        ErrorCode::HistoryBoundary => SourceError::HistoryBoundary,
        _ => SourceError::Io,
    }
}

fn scene_source_error(error: SceneError) -> SourceError {
    match error {
        SceneError::UnsupportedSource
        | SceneError::InvalidMetadata
        | SceneError::InvalidPayload => SourceError::InvalidSource,
        SceneError::SourceConflict | SceneError::Conflict => SourceError::SourceConflict,
        SceneError::RecoveryRequired => SourceError::RecoveryRequired,
        SceneError::HistoryBoundary => SourceError::HistoryBoundary,
        _ => SourceError::Io,
    }
}

fn commit_error(outcome: CommitOutcome) -> SourceError {
    match outcome {
        CommitOutcome::Conflict { .. } => SourceError::SourceConflict,
        CommitOutcome::RecoveryRequired { .. } => SourceError::RecoveryRequired,
        CommitOutcome::Rejected { diagnostic } => transaction_error(diagnostic),
        CommitOutcome::Committed { .. } => SourceError::Io,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        authoring::{AuthoringError, AuthoringMetadata, CreateCharacterRequest},
        metadata::{
            ChapterMetadata, Resolution, SceneMetadata, SdkIdentity, Selection,
            PROJECT_SCHEMA_VERSION, SOURCE_MAP_SCHEMA_VERSION,
        },
        scene::{BeatPayload, SceneCommand, SceneCommandRequest},
    };
    use serde_json::Map;
    use std::{fs, path::PathBuf};
    use tempfile::TempDir;

    struct Fixture {
        _temporary: TempDir,
        root: PathBuf,
        service: AuthoringService,
        project: ProjectId,
        project_id: String,
        scene_id: String,
        scene_path: String,
    }

    impl Fixture {
        fn new(scene_bytes: &[u8]) -> Self {
            let temporary = tempfile::tempdir().unwrap();
            let root = fs::canonicalize(temporary.path()).unwrap();
            for directory in [
                ".renpy-editor/recovery",
                "game/chapters/chapter_01",
                "game/definitions",
                "game/images",
                "game/audio",
            ] {
                fs::create_dir_all(root.join(directory)).unwrap();
            }
            let project_id = uuid::Uuid::new_v4().to_string();
            let chapter_id = uuid::Uuid::new_v4().to_string();
            let scene_id = uuid::Uuid::new_v4().to_string();
            let scene_path = "game/chapters/chapter_01/scene_001.rpy".to_owned();
            let project_metadata = ProjectMetadata {
                schema_version: PROJECT_SCHEMA_VERSION,
                project_id: project_id.clone(),
                title: "Source fixture".into(),
                folder_name: root.file_name().unwrap().to_string_lossy().into_owned(),
                sdk: SdkIdentity {
                    adapter: "renpy-8.5.3".into(),
                    version: "8.5.3".into(),
                    extra: Map::new(),
                },
                resolution: Resolution {
                    width: 1280,
                    height: 720,
                },
                capabilities: vec![
                    "project-lifecycle".into(),
                    "supporting-authoring-v1".into(),
                    "scene-authoring-v1".into(),
                ],
                chapters: vec![ChapterMetadata {
                    id: chapter_id.clone(),
                    display_name: "Chapter".into(),
                    directory: "game/chapters/chapter_01".into(),
                    extra: Map::new(),
                }],
                scenes: vec![SceneMetadata {
                    id: scene_id.clone(),
                    chapter_id: chapter_id.clone(),
                    display_name: "Scene".into(),
                    technical_label: "scene_one".into(),
                    source_path: scene_path.clone(),
                    extra: Map::new(),
                }],
                entry_scene_id: Some(scene_id.clone()),
                last_open: Selection {
                    chapter_id,
                    scene_id: scene_id.clone(),
                },
                extra: Map::new(),
            };
            let source_map = SourceMapMetadata {
                schema_version: SOURCE_MAP_SCHEMA_VERSION,
                project_id: project_id.clone(),
                sources: vec![scene_path.clone()],
                scene_mappings: Vec::new(),
                extra: Map::new(),
            };
            fs::write(
                root.join(PROJECT_PATH),
                serde_json::to_vec_pretty(&project_metadata).unwrap(),
            )
            .unwrap();
            fs::write(
                root.join(SOURCE_MAP_PATH),
                serde_json::to_vec_pretty(&source_map).unwrap(),
            )
            .unwrap();
            fs::write(
                root.join(".renpy-editor/authoring.json"),
                serde_json::to_vec_pretty(&AuthoringMetadata::empty(project_id.clone())).unwrap(),
            )
            .unwrap();
            fs::write(root.join(&scene_path), scene_bytes).unwrap();
            fs::write(root.join(CHARACTERS_PATH), b"# Characters\n").unwrap();
            fs::write(root.join(VARIABLES_PATH), b"# Variables\n").unwrap();
            fs::write(root.join("game/custom.rpy"), b"alpha beta gamma\n").unwrap();
            fs::write(root.join("game/other.rpy"), b"one two three\n").unwrap();
            fs::write(root.join("game/ignored.rpyc"), b"compiled").unwrap();
            let service = AuthoringService::default();
            let project = service.register_project(&root).unwrap();
            service
                .ensure_phase_1e_metadata(&project, &project_id)
                .unwrap();
            Self {
                _temporary: temporary,
                root,
                service,
                project,
                project_id,
                scene_id,
                scene_path,
            }
        }

        fn open(&self, path: &str) -> SourceDocument {
            self.service
                .source_open(
                    &self.project,
                    &self.project_id,
                    SourceOpenRequest {
                        path: path.into(),
                        selection_start: None,
                        selection_end: None,
                        byte_start: None,
                        byte_end: None,
                    },
                )
                .unwrap()
        }

        fn draft(&self, document: &SourceDocument, text: &str) -> SourceDocument {
            self.service
                .source_update_draft(
                    &self.project,
                    &self.project_id,
                    SourceDraftRequest {
                        path: document.path.clone(),
                        expected_base_revision: document.base_revision.clone(),
                        text: text.into(),
                        selection_start: text.encode_utf16().count() as u64,
                        selection_end: text.encode_utf16().count() as u64,
                    },
                )
                .unwrap()
        }

        fn save(&self, document: &SourceDocument) -> Result<SourceDocument, SourceError> {
            self.service.source_save(
                &self.project,
                &self.project_id,
                SourceSaveRequest {
                    path: document.path.clone(),
                    expected_base_revision: document.base_revision.clone(),
                    expected_draft_version: document.draft_version,
                },
            )
        }
    }

    #[test]
    fn exact_non_overlapping_patches_combine_and_overlap_refuses() {
        let base = b"alpha beta gamma";
        assert_eq!(
            combine_non_overlapping(base, b"ALPHA beta gamma", b"alpha beta GAMMA"),
            Some(b"ALPHA beta GAMMA".to_vec())
        );
        assert_eq!(
            combine_non_overlapping(base, b"alpha BETA gamma", b"alpha BEXX gamma"),
            None
        );
    }

    #[test]
    fn utf16_positions_are_distinct_from_utf8_bytes() {
        let value = "a😀b".as_bytes();
        assert_eq!(byte_to_utf16(value, 1), 1);
        assert_eq!(byte_to_utf16(value, 5), 3);
        assert_eq!(byte_to_utf16(value, 6), 4);
    }

    #[test]
    fn supported_source_and_scene_edits_share_mapping_history_and_preserve_bom_crlf() {
        let fixture = Fixture::new(
            b"\xef\xbb\xbflabel scene_one:\r\n    \"Hello \xf0\x9f\x98\x80\"\r\n    return\r\n",
        );
        let opened = fixture.open(&fixture.scene_path);
        assert!(opened.has_bom);
        assert_eq!(opened.newline, "CRLF");
        assert_eq!(opened.ranges.len(), 2);
        assert!(opened.ranges[0].byte_end > opened.ranges[0].editor_end);
        let first_id = opened.ranges[0].beat_id.clone();
        let edited = fixture.draft(
            &opened,
            "label scene_one:\r\n    \"Changed 😀\"\r\n    return\r\n",
        );
        let saved = fixture.save(&edited).unwrap();
        assert!(!saved.dirty);
        let disk = fs::read(fixture.root.join(&fixture.scene_path)).unwrap();
        assert!(disk.starts_with(&[0xef, 0xbb, 0xbf]));
        assert!(disk.windows(2).any(|window| window == b"\r\n"));
        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(workspace.scenes[0].beats[0].id, first_id);
        let beat_id = workspace.scenes[0].beats[0].id.clone();
        let updated = fixture
            .service
            .scene_apply(
                &fixture.project,
                &fixture.project_id,
                SceneCommandRequest {
                    expected_project_revision: workspace.project_revision.clone(),
                    expected_source_map_revision: workspace.source_map_revision.clone(),
                    command: SceneCommand::UpdateBeat {
                        scene_id: fixture.scene_id.clone(),
                        expected_source_revision: workspace.scenes[0].source_revision.clone(),
                        beat_id,
                        beat: BeatPayload::Narration {
                            text: "Visual edit".into(),
                        },
                    },
                },
            )
            .unwrap();
        assert!(matches!(
            updated.scenes[0].beats[0].payload,
            BeatPayload::Narration { ref text } if text == "Visual edit"
        ));
        let reopened = fixture.open(&fixture.scene_path);
        assert!(reopened.text.unwrap().contains("Visual edit"));
    }

    #[test]
    fn exact_reorders_follow_content_while_ambiguous_same_kind_edits_reset_ids() {
        let fixture =
            Fixture::new(b"label scene_one:\n    \"First\"\n    \"Second\"\n    return\n");
        let opened = fixture.open(&fixture.scene_path);
        let first_id = opened.ranges[0].beat_id.clone();
        let second_id = opened.ranges[1].beat_id.clone();
        let swapped = fixture
            .save(&fixture.draft(
                &opened,
                "label scene_one:\n    \"Second\"\n    \"First\"\n    return\n",
            ))
            .unwrap();
        assert_eq!(swapped.ranges[0].beat_id, second_id);
        assert_eq!(swapped.ranges[1].beat_id, first_id);

        let rewritten = fixture
            .save(&fixture.draft(
                &swapped,
                "label scene_one:\n    \"Changed one\"\n    \"Changed two\"\n    return\n",
            ))
            .unwrap();
        let rewritten_ids = rewritten
            .ranges
            .iter()
            .take(2)
            .map(|range| range.beat_id.as_str())
            .collect::<HashSet<_>>();
        assert!(!rewritten_ids.contains(first_id.as_str()));
        assert!(!rewritten_ids.contains(second_id.as_str()));
    }

    #[test]
    fn invalid_draft_refuses_save_without_losing_draft_or_changing_disk() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let before = fs::read(fixture.root.join(&fixture.scene_path)).unwrap();
        let opened = fixture.open(&fixture.scene_path);
        let draft = fixture.draft(&opened, "label scene_one\n    \"unfinished\n");
        assert_eq!(draft.state, SourceFileState::Invalid);
        assert_eq!(fixture.save(&draft), Err(SourceError::InvalidSource));
        assert_eq!(
            fs::read(fixture.root.join(&fixture.scene_path)).unwrap(),
            before
        );
        let retained = fixture.open(&fixture.scene_path);
        assert!(retained.dirty);
        assert_eq!(
            retained.text.as_deref(),
            Some("label scene_one\n    \"unfinished\n")
        );
        assert_eq!(
            fixture.service.status(&fixture.project),
            PersistenceStatus::PendingValidation
        );
    }

    #[test]
    fn opaque_source_acceptance_and_adjacent_visual_patch_preserve_exact_custom_bytes() {
        let fixture = Fixture::new(
            b"label scene_one:\n    \"Hello\"\n    python:\n        score += 1\n    return\n",
        );
        let opened = fixture.open(&fixture.scene_path);
        let changed = opened
            .text
            .clone()
            .unwrap()
            .replace("score += 1", "score += 2  # exact");
        let saved = fixture.save(&fixture.draft(&opened, &changed)).unwrap();
        assert!(saved.partial);
        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        let narration = workspace.scenes[0].beats[0].id.clone();
        fixture
            .service
            .scene_apply(
                &fixture.project,
                &fixture.project_id,
                SceneCommandRequest {
                    expected_project_revision: workspace.project_revision.clone(),
                    expected_source_map_revision: workspace.source_map_revision.clone(),
                    command: SceneCommand::UpdateBeat {
                        scene_id: fixture.scene_id.clone(),
                        expected_source_revision: workspace.scenes[0].source_revision.clone(),
                        beat_id: narration,
                        beat: BeatPayload::Narration {
                            text: "Next".into(),
                        },
                    },
                },
            )
            .unwrap();
        let bytes = fs::read(fixture.root.join(&fixture.scene_path)).unwrap();
        assert!(String::from_utf8(bytes)
            .unwrap()
            .contains("score += 2  # exact"));
    }

    #[test]
    fn clean_external_refreshes_while_dirty_external_requires_exact_apply_both() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let _clean = fixture.open("game/custom.rpy");
        fs::write(fixture.root.join("game/custom.rpy"), b"alpha BETA gamma\n").unwrap();
        let refreshed = fixture.open("game/custom.rpy");
        assert_eq!(refreshed.text.as_deref(), Some("alpha BETA gamma\n"));
        assert_eq!(refreshed.state, SourceFileState::Clean);

        let draft = fixture.draft(&refreshed, "ALPHA BETA gamma\n");
        fs::write(fixture.root.join("game/custom.rpy"), b"alpha BETA GAMMA\n").unwrap();
        let conflict = fixture.open("game/custom.rpy");
        assert_eq!(conflict.state, SourceFileState::Conflict);
        assert_eq!(conflict.text, draft.text);
        assert!(conflict.can_apply_both);
        let combined = fixture
            .service
            .source_apply_both(
                &fixture.project,
                &fixture.project_id,
                SourceApplyBothRequest {
                    path: conflict.path,
                    expected_base_revision: conflict.base_revision,
                    expected_draft_version: conflict.draft_version,
                    expected_external_revision: conflict.live_revision.unwrap(),
                    expected_combined_text: conflict.combined_preview.unwrap(),
                },
            )
            .unwrap();
        assert_eq!(combined.text.as_deref(), Some("ALPHA BETA GAMMA\n"));

        let next = fixture.draft(&combined, "ALPHA XXXX GAMMA\n");
        fs::write(fixture.root.join("game/custom.rpy"), b"ALPHA YYYY GAMMA\n").unwrap();
        let overlap = fixture.open("game/custom.rpy");
        assert_eq!(overlap.text, next.text);
        assert!(!overlap.can_apply_both);
    }

    #[test]
    fn reviewed_combination_transaction_preserves_external_writer_during_commit() {
        use crate::transaction::{FaultInjector, FaultPoint};
        use std::path::Path;

        struct Writer {
            point: FaultPoint,
        }
        impl FaultInjector for Writer {
            fn visit(&mut self, point: FaultPoint, root: &Path) -> Result<(), ErrorCode> {
                if point == self.point {
                    fs::write(root.join("game/custom.rpy"), b"alpha beta DELTA\n").unwrap();
                }
                Ok(())
            }
        }
        for point in [FaultPoint::MutationStaged(0), FaultPoint::BeforeExchange(0)] {
            let fixture = Fixture::new(b"label scene_one:\n    return\n");
            let opened = fixture.open("game/custom.rpy");
            let draft = fixture.draft(&opened, "ALPHA beta gamma\n");
            fs::write(fixture.root.join("game/custom.rpy"), b"alpha beta GAMMA\n").unwrap();
            let review = fixture.open("game/custom.rpy");
            // JSON request -> production proposal -> real transactional exchange, with deterministic external I/O.
            let request: SourceApplyBothRequest = serde_json::from_value(serde_json::json!({
                "path": review.path, "expectedBaseRevision": review.base_revision,
                "expectedDraftVersion": review.draft_version,
                "expectedExternalRevision": review.live_revision,
                "expectedCombinedText": review.combined_preview,
            }))
            .unwrap();
            let proposal = fixture
                .service
                .prepare_apply_both(&fixture.project, &fixture.project_id, &request)
                .unwrap();
            assert_eq!(proposal.mutations[0].expected_bytes, b"alpha beta GAMMA\n");
            assert_eq!(proposal.mutations[0].proposed, b"ALPHA beta GAMMA\n");
            let outcome = fixture.service.transactions.commit_with_injector(
                &fixture.project,
                proposal,
                &mut Writer { point },
            );
            assert!(
                !matches!(outcome, CommitOutcome::Committed { .. }),
                "{outcome:?}"
            );
            let retained = fixture
                .service
                .source_document(&fixture.project, &fixture.project_id, "game/custom.rpy")
                .unwrap();
            assert_eq!(retained.text, draft.text);
            assert!(retained.dirty);
            if point == FaultPoint::MutationStaged(0) {
                assert_eq!(
                    fs::read(fixture.root.join("game/custom.rpy")).unwrap(),
                    b"alpha beta DELTA\n"
                );
            } else {
                // The final exchange window retains both versions in recovery, never silently accepts.
                fn contains_bytes(path: &Path, expected: &[u8]) -> bool {
                    fs::read_dir(path).unwrap().any(|entry| {
                        let path = entry.unwrap().path();
                        if path.is_dir() {
                            contains_bytes(&path, expected)
                        } else {
                            fs::read(path).unwrap() == expected
                        }
                    })
                }
                let recovery = fixture.root.join(".renpy-editor/recovery");
                assert!(contains_bytes(&recovery, b"alpha beta DELTA\n"));
                assert!(contains_bytes(&recovery, b"ALPHA beta GAMMA\n"));
                assert!(fixture
                    .service
                    .transactions
                    .has_blocking_recovery(&fixture.project)
                    .unwrap());
            }
        }
    }

    #[test]
    fn clean_external_invalid_source_remains_visible_and_marks_scene_projection_stale() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let opened = fixture.open(&fixture.scene_path);
        assert_eq!(opened.state, SourceFileState::Clean);

        let invalid = "label scene_one\n    \"unfinished\n";
        fs::write(fixture.root.join(&fixture.scene_path), invalid.as_bytes()).unwrap();

        let refreshed = fixture.open(&fixture.scene_path);
        assert_eq!(refreshed.text.as_deref(), Some(invalid));
        assert_eq!(refreshed.state, SourceFileState::Invalid);
        assert!(!refreshed.dirty);
        assert!(refreshed.editable);
        assert!(refreshed.partial);
        assert!(refreshed.ranges.is_empty());
        assert!(refreshed
            .diagnostics
            .iter()
            .any(|item| item.code == "INVALID_SOURCE"));
        assert_eq!(
            fixture.service.status(&fixture.project),
            PersistenceStatus::Conflict
        );

        let inventory = fixture
            .service
            .source_inventory(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(inventory.files[0].state, SourceFileState::Invalid);

        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        let scene = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.scene_id)
            .unwrap();
        assert!(scene.source_conflict);
        assert!(scene.partial);
        assert!(scene.beats.is_empty());
    }

    #[test]
    fn save_all_preflights_every_draft_then_undoes_as_one_history_action() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let scene_before = fs::read(fixture.root.join(&fixture.scene_path)).unwrap();
        let custom_before = fs::read(fixture.root.join("game/custom.rpy")).unwrap();
        let scene = fixture.open(&fixture.scene_path);
        let invalid = fixture.draft(&scene, "label scene_one\n    return\n");
        let custom = fixture.open("game/custom.rpy");
        fixture.draft(&custom, "alpha changed gamma\n");
        assert_eq!(
            fixture
                .service
                .source_save_all(&fixture.project, &fixture.project_id),
            Err(SourceError::InvalidSource)
        );
        assert_eq!(
            fs::read(fixture.root.join(&fixture.scene_path)).unwrap(),
            scene_before
        );
        assert_eq!(
            fs::read(fixture.root.join("game/custom.rpy")).unwrap(),
            custom_before
        );
        let fixed = fixture.draft(
            &invalid,
            "label scene_one:\n    \"Saved all\"\n    return\n",
        );
        assert!(fixed.dirty);
        fixture
            .service
            .source_save_all(&fixture.project, &fixture.project_id)
            .unwrap();
        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        fixture
            .service
            .scene_apply(
                &fixture.project,
                &fixture.project_id,
                SceneCommandRequest {
                    expected_project_revision: workspace.project_revision,
                    expected_source_map_revision: workspace.source_map_revision,
                    command: SceneCommand::Undo,
                },
            )
            .unwrap();
        assert_eq!(
            fs::read(fixture.root.join(&fixture.scene_path)).unwrap(),
            scene_before
        );
        assert_eq!(
            fs::read(fixture.root.join("game/custom.rpy")).unwrap(),
            custom_before
        );
    }

    #[test]
    fn dirty_same_file_blocks_scene_and_history_but_unrelated_source_remains_editable() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let scene = fixture.open(&fixture.scene_path);
        fixture.draft(&scene, "label scene_one:\n    \"Draft\"\n    return\n");
        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        let result = fixture.service.scene_apply(
            &fixture.project,
            &fixture.project_id,
            SceneCommandRequest {
                expected_project_revision: workspace.project_revision,
                expected_source_map_revision: workspace.source_map_revision,
                command: SceneCommand::UpdateBeat {
                    scene_id: fixture.scene_id.clone(),
                    expected_source_revision: workspace.scenes[0].source_revision.clone(),
                    beat_id: workspace.scenes[0].beats[0].id.clone(),
                    beat: BeatPayload::Narration {
                        text: "Blocked".into(),
                    },
                },
            },
        );
        assert!(matches!(result, Err(SceneError::DirtySource)));
        let definitions = fixture.open(CHARACTERS_PATH);
        fixture.draft(&definitions, "# Characters\n# local draft\n");
        assert!(matches!(
            fixture.service.create_character(
                &fixture.project,
                &fixture.project_id,
                CreateCharacterRequest {
                    technical_name: "alice".into(),
                    display_name: "Alice".into(),
                    dialogue_color: "#aabbcc".into(),
                },
            ),
            Err(AuthoringError::DirtySource)
        ));
        let other = fixture.open("game/other.rpy");
        assert!(fixture
            .save(&fixture.draft(&other, "one TWO three\n"))
            .is_ok());
    }

    #[test]
    fn invalid_utf8_scope_missing_files_and_mapped_definitions_fail_closed() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        fs::write(fixture.root.join("game/binary.rpy"), [0xff, 0xfe, 0xfd]).unwrap();
        let binary = fixture.open("game/binary.rpy");
        assert_eq!(binary.state, SourceFileState::ReadOnly);
        assert!(!binary.editable);
        assert_eq!(
            fs::read(fixture.root.join("game/binary.rpy")).unwrap(),
            [0xff, 0xfe, 0xfd]
        );
        let inventory = fixture
            .service
            .source_inventory(&fixture.project, &fixture.project_id)
            .unwrap();
        assert!(inventory
            .files
            .iter()
            .all(|file| !file.path.ends_with(".rpyc")));
        assert_eq!(
            fixture.service.source_open(
                &fixture.project,
                &fixture.project_id,
                SourceOpenRequest {
                    path: "../outside.rpy".into(),
                    selection_start: None,
                    selection_end: None,
                    byte_start: None,
                    byte_end: None,
                }
            ),
            Err(SourceError::InvalidPayload)
        );
        let definitions = fixture.open(CHARACTERS_PATH);
        let changed = fixture.draft(&definitions, "define alice = Character(\"Alice\")\n");
        assert_eq!(
            fixture.save(&changed),
            Err(SourceError::UnsupportedMappedDefinition)
        );
        let scene = fixture.open(&fixture.scene_path);
        fs::remove_file(fixture.root.join(&fixture.scene_path)).unwrap();
        let unavailable = fixture.open(&fixture.scene_path);
        assert_eq!(unavailable.state, SourceFileState::Unavailable);
        assert_eq!(unavailable.text, scene.text);
        let workspace = fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        assert!(workspace.scenes[0].source_conflict);
        assert!(workspace.scenes[0].beats.is_empty());
    }

    #[test]
    fn file_and_dirty_buffer_count_limits_retain_existing_drafts() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        fs::write(
            fixture.root.join("game/oversize.rpy"),
            vec![b'x'; MAX_SOURCE_BYTES + 1],
        )
        .unwrap();
        assert_eq!(
            fixture.service.source_open(
                &fixture.project,
                &fixture.project_id,
                SourceOpenRequest {
                    path: "game/oversize.rpy".into(),
                    selection_start: None,
                    selection_end: None,
                    byte_start: None,
                    byte_end: None,
                },
            ),
            Err(SourceError::Oversize)
        );
        for index in 0..=MAX_DIRTY_BUFFERS {
            let path = format!("game/bounded-{index:02}.rpy");
            fs::write(fixture.root.join(&path), b"base\n").unwrap();
            let opened = fixture.open(&path);
            let result = fixture.service.source_update_draft(
                &fixture.project,
                &fixture.project_id,
                SourceDraftRequest {
                    path,
                    expected_base_revision: opened.base_revision,
                    text: format!("draft {index}\n"),
                    selection_start: 0,
                    selection_end: 0,
                },
            );
            if index < MAX_DIRTY_BUFFERS {
                assert!(result.is_ok());
            } else {
                assert_eq!(result, Err(SourceError::DraftLimit));
            }
        }
        let inventory = fixture
            .service
            .source_inventory(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(inventory.dirty_count, MAX_DIRTY_BUFFERS as u64);
        let custom = fixture.open("game/custom.rpy");
        assert_eq!(
            fixture.service.source_update_draft(
                &fixture.project,
                &fixture.project_id,
                SourceDraftRequest {
                    path: custom.path,
                    expected_base_revision: custom.base_revision,
                    text: "x".repeat(MAX_SOURCE_BYTES + 1),
                    selection_start: 0,
                    selection_end: 0,
                }
            ),
            Err(SourceError::Oversize)
        );
    }

    #[test]
    fn aggregate_draft_limit_rejects_only_the_new_draft() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        for index in 0..4 {
            let path = format!("game/aggregate-{index}.rpy");
            fs::write(fixture.root.join(&path), b"base\n").unwrap();
            let opened = fixture.open(&path);
            assert!(fixture
                .service
                .source_update_draft(
                    &fixture.project,
                    &fixture.project_id,
                    SourceDraftRequest {
                        path,
                        expected_base_revision: opened.base_revision,
                        text: "x".repeat(MAX_SOURCE_BYTES),
                        selection_start: 0,
                        selection_end: 0,
                    },
                )
                .is_ok());
        }
        let extra = fixture.open("game/custom.rpy");
        assert_eq!(
            fixture.service.source_update_draft(
                &fixture.project,
                &fixture.project_id,
                SourceDraftRequest {
                    path: extra.path,
                    expected_base_revision: extra.base_revision,
                    text: "x".into(),
                    selection_start: 0,
                    selection_end: 0,
                },
            ),
            Err(SourceError::DraftLimit)
        );
        let inventory = fixture
            .service
            .source_inventory(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(inventory.dirty_count, 4);
        assert_eq!(inventory.draft_bytes, MAX_DRAFT_BYTES as u64);
    }
}
