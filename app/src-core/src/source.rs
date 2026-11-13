//! Phase 1F source buffers and source-authoritative reconciliation.
//!
//! Renderer text is retained only as a bounded, session-local draft. Accepted bytes
//! are read and written through `TransactionService`; mapped Scene acceptance also
//! updates the source map in the same recoverable transaction.

use crate::{
    authoring::{AuthoringService, PersistenceStatus},
    history::{DraftStep, HistoryItem, HistoryLabel, HistoryPart, HistoryState},
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner: Option<crate::metadata::BeatOwner>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditional_branch: Option<crate::metadata::ConditionalBranch>,
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
    /// The project history after this request started a draft step; absent otherwise.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history: Option<HistoryState>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceOpenRequest {
    pub expected_revision: Option<String>,
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
    /// The renderer ended the previous typing step: a text change starts a new one.
    #[serde(default)]
    pub new_step: bool,
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
    /// The draft steps of this file's unsaved text, oldest first.
    steps: Vec<SourceStep>,
}

/// One draft step in a file's unsaved text (ADR 0025). The history entry holds only
/// its place. Core holds Source drafts, so the step's text lives here, with the
/// draft. Undo and Redo of it change the draft and write nothing.
#[derive(Clone, Debug)]
struct SourceStep {
    step_id: String,
    /// The accepted revision the step's text belongs to. Undo and Redo stop at a
    /// history boundary once it changes.
    base: Revision,
    change: StepChange,
    undone: bool,
}

#[derive(Clone, Debug)]
enum StepChange {
    /// The file's latest step, still taking typing: the whole text before it.
    Open(String),
    /// A finished step: at byte `start`, the text changed from `before` to `after`.
    Closed {
        start: usize,
        before: String,
        after: String,
    },
}

/// Source draft ids in the project history, so Save can join a file's steps.
const SOURCE_DRAFT_PREFIX: &str = "source:";

fn source_draft_id(path: &str) -> String {
    format!("{SOURCE_DRAFT_PREFIX}{path}")
}

/// Whether a history draft id names a Source file's draft.
pub(crate) fn is_source_draft(draft: &str) -> bool {
    draft.starts_with(SOURCE_DRAFT_PREFIX)
}

#[derive(Default)]
pub(crate) struct SourceSessions {
    projects: HashMap<ProjectId, HashMap<String, SourceBuffer>>,
    step_sequence: u64,
}

#[derive(Debug, Eq, PartialEq)]
pub enum SourceError {
    RuntimeBusy,
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
        self.refresh_buffer(project, &request.path)?;
        {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get_mut(project)
                .and_then(|items| items.get_mut(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            let mapped_navigation_valid =
                request.expected_revision.as_ref().is_none_or(|revision| {
                    revision == &buffer.base_revision.sha256
                        && buffer.draft.is_none()
                        && buffer.external.is_none()
                        && !buffer.unavailable
                });
            if let Some(start) = request.byte_start.filter(|_| mapped_navigation_valid) {
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
        self.reconcile_clean_sources(project, project_id, Some(&request.path))?;
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
        // History before sessions, the order Undo takes them in.
        let mut histories = self.project_history.lock().map_err(|_| SourceError::Io)?;
        let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        let SourceSessions {
            projects,
            step_sequence,
        } = &mut *sessions;
        let buffers = projects.get_mut(project).ok_or(SourceError::UnknownFile)?;
        let accepted = buffers.get(&request.path).ok_or(SourceError::UnknownFile)?;
        if accepted.base_revision.sha256 != request.expected_base_revision {
            return Err(SourceError::SourceConflict);
        }
        let accepted_value = accepted_text(&accepted.base_bytes)?;
        let next_draft = (request.text != accepted_value).then_some(request.text);
        let draft_changed = accepted.draft != next_draft;
        if !within_draft_limits(buffers, &request.path, next_draft.as_ref()) {
            return Err(SourceError::DraftLimit);
        }
        let buffer = buffers
            .get_mut(&request.path)
            .ok_or(SourceError::UnknownFile)?;
        let mut history = None;
        if draft_changed {
            // A text change extends the file's open step while that step is the
            // latest history entry and the renderer has not ended it. Otherwise
            // it starts a step, which takes its place in the history now.
            let before = buffer
                .draft
                .clone()
                .unwrap_or_else(|| accepted_value.clone());
            let draft = source_draft_id(&request.path);
            let stack = histories.entry(project.clone()).or_default();
            let extends = !request.new_step
                && stack.undo_step().is_some_and(|top| {
                    top.draft == draft
                        && buffer.steps.last().is_some_and(|last| {
                            last.step_id == top.step_id
                                && matches!(last.change, StepChange::Open(_))
                        })
                });
            if !extends {
                *step_sequence += 1;
                let step_id = format!("source-step:{step_sequence}");
                history = Some(
                    stack
                        .push_draft_step(
                            DraftStep {
                                step_id: step_id.clone(),
                                draft,
                            },
                            HistoryLabel::new(
                                format!("Source typing in {}", file_name(&request.path)),
                                HistoryItem::source(&request.path),
                            ),
                        )
                        .map_err(|_| SourceError::Io)?,
                );
                // Undone steps left the history when this entry dropped Redo.
                buffer.steps.retain(|step| !step.undone);
                if let Some(last) = buffer.steps.last_mut() {
                    if let StepChange::Open(previous) = &last.change {
                        last.change = closed_change(previous, &before);
                    }
                }
                buffer.steps.push(SourceStep {
                    step_id,
                    base: buffer.base_revision.clone(),
                    change: StepChange::Open(before),
                    undone: false,
                });
            }
            buffer.draft_version = buffer.draft_version.saturating_add(1);
        }
        buffer.draft = next_draft;
        let length = buffer
            .draft
            .as_deref()
            .unwrap_or(&accepted_value)
            .encode_utf16()
            .count() as u64;
        buffer.selection_start = request.selection_start.min(length);
        buffer.selection_end = request.selection_end.min(length);
        drop(sessions);
        drop(histories);
        let mut document = self.source_document(project, project_id, &request.path)?;
        document.history = history;
        Ok(document)
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
            let label = HistoryLabel::new(
                format!("Source edit in {}", file_name(&request.path)),
                HistoryItem::source(&request.path),
            );
            self.commit_source_history(
                project,
                proposal,
                label,
                std::slice::from_ref(&request.path),
            )?;
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
            let label = match paths.as_slice() {
                [path] => HistoryLabel::new(
                    format!("Source edit in {}", file_name(path)),
                    HistoryItem::source(path),
                ),
                [first, ..] => HistoryLabel::new(
                    format!("Source edits in {} files", paths.len()),
                    HistoryItem::source(first),
                ),
                [] => unreachable!("Save All commits only prepared buffers"),
            };
            self.commit_source_history(project, proposal, label, &paths)?;
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
        let discarded = {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffer = sessions
                .projects
                .get_mut(project)
                .and_then(|items| items.get_mut(&request.path))
                .ok_or(SourceError::UnknownFile)?;
            buffer.draft = None;
            buffer.external = None;
            buffer.draft_version = buffer.draft_version.saturating_add(1);
            discard_steps(buffer)
        };
        self.forget_source_steps(project, discarded.into_iter().collect())?;
        self.refresh_buffer(project, &request.path)?;
        self.reconcile_clean_sources(project, project_id, Some(&request.path))?;
        self.source_document(project, project_id, &request.path)
    }

    pub fn source_discard_all(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<SourceInventory, SourceError> {
        let (paths, discarded) = {
            let mut sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
            let buffers = sessions.projects.entry(project.clone()).or_default();
            let mut discarded = Vec::new();
            for buffer in buffers.values_mut() {
                buffer.draft = None;
                buffer.external = None;
                buffer.draft_version = buffer.draft_version.saturating_add(1);
                discarded.extend(discard_steps(buffer));
            }
            (buffers.keys().cloned().collect::<Vec<_>>(), discarded)
        };
        self.forget_source_steps(project, discarded)?;
        for path in paths {
            self.refresh_buffer(project, &path)?;
            self.reconcile_clean_sources(project, project_id, Some(&path))?;
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
        let label = HistoryLabel::new(
            format!("combined Source edit in {}", file_name(&request.path)),
            HistoryItem::source(&request.path),
        );
        self.commit_source_history(
            project,
            proposal,
            label,
            std::slice::from_ref(&request.path),
        )?;
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

    /// A successful app deletion must not turn its exact clean cached buffer into
    /// an external-missing conflict on refresh (for example, Undo of Scene creation).
    /// Retain drafts, conflicts and every buffer whose accepted revision differs.
    pub(crate) fn forget_committed_source_deletions(
        &self,
        project: &ProjectId,
        deleted: &[(String, Revision)],
    ) {
        let Ok(mut sessions) = self.source_sessions.lock() else {
            return;
        };
        let Some(buffers) = sessions.projects.get_mut(project) else {
            return;
        };
        for (path, revision) in deleted {
            if buffers.get(path).is_some_and(|buffer| {
                revision == &buffer.base_revision
                    && buffer.draft.is_none()
                    && buffer.external.is_none()
                    && !buffer.unavailable
                    && !buffer.projection_invalid
            }) {
                buffers.remove(path);
            }
        }
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

    pub(crate) fn source_draft_versions(
        &self,
        project: &ProjectId,
        paths: &[String],
    ) -> Result<std::collections::BTreeMap<String, u64>, SourceError> {
        self.ensure_source_paths_clean(project, paths.iter().map(String::as_str))?;
        let sessions = self.source_sessions.lock().map_err(|_| SourceError::Io)?;
        Ok(paths
            .iter()
            .map(|path| {
                let version = sessions
                    .projects
                    .get(project)
                    .and_then(|items| items.get(path))
                    .map_or(0, |buffer| buffer.draft_version);
                (path.clone(), version)
            })
            .collect())
    }

    pub(crate) fn source_refresh_project(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<(), SourceError> {
        self.source_refresh_all(project)?;
        match self.reconcile_clean_sources(project, project_id, None) {
            Ok(()) | Err(SourceError::InvalidSource) => Ok(()),
            Err(error) => Err(error),
        }
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
            steps: Vec::new(),
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
            history: None,
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
            Some((&project_metadata, &authoring, &source_map.owned_screens)),
        );
        let Ok((_, beats)) = mapping else {
            return Ok((Vec::new(), true));
        };
        let bom = usize::from(proposed.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
        let ranges = beats
            .into_iter()
            .map(|beat| SourceRange {
                owner: beat.owner,
                conditional_branch: beat.conditional_branch,
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
                    Some((&project_metadata, &authoring, &source_map.owned_screens)),
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
                proposed: crate::scene::source_map_bytes(&source_map)
                    .map_err(scene_source_error)?,
            });
        }
        Ok(TransactionProposal {
            mutations,
            intent: TransactionIntent::Edit,
        })
    }

    /// Brings source-map projections up to date with clean scene sources: the clean
    /// Source buffer when Source holds one, otherwise the file on disk. With no `only`
    /// path it covers every scene, so an external edit reaches Story whether or not
    /// Source opened the file. A dirty, external-pending or unavailable buffer keeps
    /// its stale projection until the author resolves it in Source. `only` limits the
    /// pass to one path.
    fn reconcile_clean_sources(
        &self,
        project: &ProjectId,
        project_id: &str,
        only: Option<&str>,
    ) -> Result<(), SourceError> {
        let project_metadata = self.project_metadata(project, project_id)?;
        let (map_bytes, map_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
            )
            .map_err(transaction_error)?;
        let mut source_map =
            SourceMapMetadata::read_bytes(&map_bytes, project_id).map_err(|_| SourceError::Io)?;
        let mut authoring = None;
        let mut reconciled = Vec::new();
        for scene in project_metadata
            .scenes
            .iter()
            .filter(|scene| only.is_none_or(|path| path == scene.source_path))
        {
            let path = scene.source_path.as_str();
            let buffered = self
                .source_sessions
                .lock()
                .map_err(|_| SourceError::Io)?
                .projects
                .get(project)
                .and_then(|items| items.get(path))
                .map(|item| {
                    (item.draft.is_none() && item.external.is_none() && !item.unavailable)
                        .then(|| (item.base_bytes.clone(), item.base_revision.sha256.clone()))
                });
            let (bytes, revision) = match buffered {
                Some(Some(clean)) => clean,
                Some(None) => continue,
                None => match self.transactions.snapshot_optional(
                    project,
                    RelativePath::new(path).map_err(|_| SourceError::InvalidPayload)?,
                ) {
                    Ok(Some((bytes, revision))) => (bytes, revision.sha256),
                    // Story reports a missing or unsafe source as unavailable.
                    Ok(None) | Err(_) => continue,
                },
            };
            // Story reports a scene with no stored mapping as invalid metadata.
            let Some(index) = source_map
                .scene_mappings
                .iter()
                .position(|mapping| mapping.scene_id == scene.id)
            else {
                continue;
            };
            let previous = source_map.scene_mappings[index].clone();
            if previous.source_revision == revision {
                continue;
            }
            let authoring = match &authoring {
                Some(authoring) => authoring,
                None => authoring.insert(
                    self.list(project, project_id)
                        .map_err(|_| SourceError::Io)?,
                ),
            };
            let built = build_reconciled_mapping(
                scene,
                &bytes,
                &revision,
                Some(&previous),
                Some((&project_metadata, authoring, &source_map.owned_screens)),
            );
            let mapping = match built.map_err(scene_source_error) {
                Ok((mapping, _)) => mapping,
                Err(SourceError::InvalidSource) => {
                    self.mark_projection_invalid(project, path, true)?;
                    continue;
                }
                Err(error) => return Err(error),
            };
            // One scene that cannot be mapped leaves the others to reconcile.
            source_map.scene_mappings[index] = mapping;
            if source_map.validate(project_id).is_err() {
                source_map.scene_mappings[index] = previous;
                self.mark_projection_invalid(project, path, true)?;
                continue;
            }
            reconciled.push(path);
        }
        if reconciled.is_empty() {
            return Ok(());
        }
        let outcome = self.commit_observed(
            project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path: RelativePath::new(SOURCE_MAP_PATH).map_err(|_| SourceError::Io)?,
                    kind: MutationKind::ReplaceExisting,
                    base: map_revision,
                    expected_bytes: map_bytes,
                    proposed: crate::scene::source_map_bytes(&source_map)
                        .map_err(scene_source_error)?,
                }],
                intent: TransactionIntent::Edit,
            },
        );
        match outcome {
            CommitOutcome::Committed { .. } => {
                for path in reconciled {
                    self.mark_projection_invalid(project, path, false)?;
                }
                Ok(())
            }
            other => Err(commit_error(other)),
        }
    }

    /// Records whether a Source buffer's scene projection failed to reconcile.
    /// Paths without a buffer carry no flag; Story reports them from the source map.
    fn mark_projection_invalid(
        &self,
        project: &ProjectId,
        path: &str,
        invalid: bool,
    ) -> Result<(), SourceError> {
        if let Some(buffer) = self
            .source_sessions
            .lock()
            .map_err(|_| SourceError::Io)?
            .projects
            .get_mut(project)
            .and_then(|items| items.get_mut(path))
        {
            buffer.projection_invalid = invalid;
        }
        Ok(())
    }

    /// Commits accepted Source as one history entry on top, joining the draft
    /// steps of the saved `paths` into it (ADR 0025).
    fn commit_source_history(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
        label: HistoryLabel,
        paths: &[String],
    ) -> Result<(), SourceError> {
        let joined: Vec<String> = paths.iter().map(|path| source_draft_id(path)).collect();
        let mutations = proposal.mutations.clone();
        self.commit_history_parts(
            project,
            proposal,
            vec![HistoryPart { label, mutations }],
            &joined,
        )
        .map(|_| ())
        .map_err(scene_source_error)
    }

    /// A discarded draft's steps leave the history: Discard Draft is permanent.
    fn forget_source_steps(
        &self,
        project: &ProjectId,
        drafts: Vec<String>,
    ) -> Result<(), SourceError> {
        self.forget_draft_steps(project, &drafts)
            .map_err(scene_source_error)
    }

    /// Undo or Redo of a Source draft step. The file's draft returns to its text
    /// before or after the step, and the changed range becomes the selection that
    /// the reveal opens. Nothing is written. A step of another draft is left to the
    /// renderer. The draft registry's limits still hold.
    pub(crate) fn source_history_step(
        &self,
        project: &ProjectId,
        step: &DraftStep,
        redo: bool,
    ) -> Result<(), SceneError> {
        let Some(path) = step.draft.strip_prefix(SOURCE_DRAFT_PREFIX) else {
            return Ok(());
        };
        let mut sessions = self.source_sessions.lock().map_err(|_| SceneError::Io)?;
        let buffers = sessions
            .projects
            .get_mut(project)
            .ok_or(SceneError::HistoryBoundary)?;
        let buffer = buffers.get(path).ok_or(SceneError::HistoryBoundary)?;
        let index = buffer
            .steps
            .iter()
            .position(|item| item.step_id == step.step_id)
            .ok_or(SceneError::HistoryBoundary)?;
        let item = &buffer.steps[index];
        if item.base != buffer.base_revision || item.undone != redo {
            return Err(SceneError::HistoryBoundary);
        }
        let accepted =
            accepted_text(&buffer.base_bytes).map_err(|_| SceneError::HistoryBoundary)?;
        let current = buffer.draft.as_deref().unwrap_or(&accepted);
        let change = match &item.change {
            StepChange::Open(before) => closed_change(before, current),
            closed => closed.clone(),
        };
        let StepChange::Closed {
            start,
            before,
            after,
        } = &change
        else {
            return Err(SceneError::Io);
        };
        // Undo puts `before` back where `after` is; Redo does the reverse.
        let (from, to) = if redo {
            (before, after)
        } else {
            (after, before)
        };
        if current.get(*start..start + from.len()) != Some(from.as_str()) {
            return Err(SceneError::HistoryBoundary);
        }
        let text = [
            &current[..*start],
            to.as_str(),
            &current[start + from.len()..],
        ]
        .concat();
        let selection_start = text[..*start].encode_utf16().count() as u64;
        let selection_end = selection_start + to.encode_utf16().count() as u64;
        let next_draft = (text != accepted).then_some(text);
        if !within_draft_limits(buffers, path, next_draft.as_ref()) {
            // Redo after another file's open step grew: save or discard a draft first.
            return Err(SceneError::DirtySource);
        }
        let buffer = buffers.get_mut(path).ok_or(SceneError::HistoryBoundary)?;
        buffer.draft = next_draft;
        buffer.draft_version = buffer.draft_version.saturating_add(1);
        buffer.selection_start = selection_start;
        buffer.selection_end = selection_end;
        buffer.steps[index].change = change;
        buffer.steps[index].undone = !redo;
        Ok(())
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
            // The saved entry joined these steps.
            buffer.steps.clear();
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

fn reconciliation_kind<'a>(beat: &'a crate::metadata::BeatSourceMapping, bytes: &[u8]) -> &'a str {
    if beat.kind == "customCode" {
        if let Some((statement, _)) = bytes
            .get(beat.byte_start as usize..beat.byte_end as usize)
            .and_then(|source| std::str::from_utf8(source).ok())
            .and_then(|source| crate::scene::screen_statement(source.trim()))
        {
            return statement.kind();
        }
    }
    &beat.kind
}

fn build_reconciled_mapping(
    scene: &SceneMetadata,
    bytes: &[u8],
    revision: &str,
    previous: Option<&SceneSourceMapping>,
    context: Option<crate::scene::SceneParseContext<'_>>,
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
    let mut option_hashes = HashMap::<&str, usize>::new();
    for header in previous.beats.iter().filter(|b| {
        b.conditional_branch
            .as_ref()
            .is_some_and(|g| g.choice_option)
    }) {
        *option_hashes.entry(&header.source_sha256).or_default() += 1;
    }
    let ambiguous_options = previous
        .beats
        .iter()
        .filter(|b| {
            b.conditional_branch
                .as_ref()
                .is_some_and(|g| g.choice_option)
                && option_hashes
                    .get(b.source_sha256.as_str())
                    .is_some_and(|count| *count > 1)
        })
        .map(|b| b.id.as_str())
        .collect::<HashSet<_>>();
    if candidate.beats.iter().any(|after| {
        previous
            .beats
            .iter()
            .find(|before| before.id == after.id)
            .is_some_and(|before| {
                before
                    .owner
                    .as_ref()
                    .is_some_and(|owner| ambiguous_options.contains(owner.branch_id.as_str()))
                    && before.owner != after.owner
            })
    }) {
        return Err(SceneError::InvalidMetadata);
    }
    let same_structure = previous.beats.len() == candidate.beats.len()
        && previous
            .beats
            .iter()
            .zip(&candidate.beats)
            .all(|(before, after)| {
                before.kind == reconciliation_kind(after, bytes)
                    && before.owner == after.owner
                    && before.conditional_branch == after.conditional_branch
                    && (!previous_ids.contains(after.id.as_str()) || before.id == after.id)
            });
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
                .entry(reconciliation_kind(beat, bytes))
                .or_default()
                .push(beat);
        }
    }
    let mut forced = Vec::new();
    for (kind, before) in unmatched_before {
        let Some(after) = unmatched_after.get(kind) else {
            continue;
        };
        let screen = matches!(kind, "showScreen" | "hideScreen" | "callScreen");
        if before.len() == 1 && after.len() == 1
            || screen && same_structure && before.len() == after.len()
        {
            for (before, after) in before.iter().zip(after) {
                forced.push((
                    kind.to_owned(),
                    after.source_sha256.clone(),
                    before.id.clone(),
                    Some(after.byte_start as usize),
                ));
            }
        } else if screen {
            // Changed structure cannot establish which old screen intent owns a new statement.
            for after in after {
                forced.push((
                    "customCode".into(),
                    after.source_sha256.clone(),
                    after.id.clone(),
                    Some(after.byte_start as usize),
                ));
            }
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

/// Whether the drafts stay within the registry's count and size limits once
/// `path` holds `candidate`.
fn within_draft_limits(
    buffers: &HashMap<String, SourceBuffer>,
    path: &str,
    candidate: Option<&String>,
) -> bool {
    let (count, bytes) = buffers
        .iter()
        .filter_map(|(key, buffer)| {
            if key == path {
                candidate
            } else {
                buffer.draft.as_ref()
            }
        })
        .fold((0usize, 0usize), |(count, bytes), draft| {
            (count + 1, bytes.saturating_add(draft.len()))
        });
    count <= MAX_DIRTY_BUFFERS && bytes <= MAX_DRAFT_BYTES
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
        ErrorCode::RuntimeBusy => SourceError::RuntimeBusy,
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
        SceneError::RuntimeBusy => SourceError::RuntimeBusy,
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

/// Clears a file's draft steps and returns the draft id when it had any.
fn discard_steps(buffer: &mut SourceBuffer) -> Option<String> {
    let had_steps = !buffer.steps.is_empty();
    buffer.steps.clear();
    had_steps.then(|| source_draft_id(&buffer.path))
}

/// The one span where `before` and `after` differ, on character boundaries.
fn closed_change(before: &str, after: &str) -> StepChange {
    let (old, new) = (before.as_bytes(), after.as_bytes());
    let mut start = old.iter().zip(new).take_while(|(a, b)| a == b).count();
    while !before.is_char_boundary(start) {
        start -= 1;
    }
    let room = old.len().min(new.len()) - start;
    let mut suffix = old
        .iter()
        .rev()
        .zip(new.iter().rev())
        .take(room)
        .take_while(|(a, b)| a == b)
        .count();
    // Identical suffix bytes start a character in both texts or in neither.
    while !before.is_char_boundary(old.len() - suffix) {
        suffix -= 1;
    }
    StepChange::Closed {
        start,
        before: before[start..old.len() - suffix].to_owned(),
        after: after[start..new.len() - suffix].to_owned(),
    }
}

/// The file name a history name shows, for example "script.rpy".
fn file_name(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
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
                owned_screens: Vec::new(),
                component_uses: Vec::new(),
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
                        expected_revision: None,
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
                        new_step: false,
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
    fn flow_observed_source_save_preserves_draft_then_updates_saved_projection() {
        let f = Fixture::new(b"label scene_one:\n    return\n");
        let original = f.open(&f.scene_path);
        let before = f.service.flow_observed(&f.project, &f.project_id).unwrap();
        let draft = f.draft(&original, "label scene_one:\n    jump scene_one\n");
        assert_eq!(
            f.service
                .flow_observed(&f.project, &f.project_id)
                .unwrap()
                .revision,
            before.revision
        );
        f.save(&draft).unwrap();
        let after = f.service.flow_observed(&f.project, &f.project_id).unwrap();
        assert_eq!(after.observation.status, "savedEdits");
        assert_ne!(after.revision, before.revision);
        assert!(matches!(
            after.edges[0].destination,
            crate::scene::flow::FlowDestination::Resolved { .. }
        ));
        assert!(!f.open(&f.scene_path).dirty);
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
                    drafts: Vec::new(),
                    expected_project_revision: workspace.project_revision.clone(),
                    expected_source_map_revision: workspace.source_map_revision.clone(),
                    expected_authoring_revision: None,
                    command: SceneCommand::UpdateBodyBeat {
                        scene_id: fixture.scene_id.clone(),
                        expected_source_revision: workspace.scenes[0].source_revision.clone(),
                        beat_id,
                        expected_body: crate::scene::BodyRef::Root,
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
                    drafts: Vec::new(),
                    expected_project_revision: workspace.project_revision.clone(),
                    expected_source_map_revision: workspace.source_map_revision.clone(),
                    expected_authoring_revision: None,
                    command: SceneCommand::UpdateBodyBeat {
                        scene_id: fixture.scene_id.clone(),
                        expected_source_revision: workspace.scenes[0].source_revision.clone(),
                        beat_id: narration,
                        expected_body: crate::scene::BodyRef::Root,
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
    fn story_projects_external_edit_to_scene_source_never_opened() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let narration = |workspace: &crate::scene::SceneWorkspace| {
            let scene = &workspace.scenes[0];
            assert!(!scene.source_conflict, "external edit left Story unmapped");
            scene
                .beats
                .iter()
                .find_map(|beat| match &beat.payload {
                    BeatPayload::Narration { text, .. } => Some((beat.id.clone(), text.clone())),
                    _ => None,
                })
                .unwrap()
        };
        let before = narration(
            &fixture
                .service
                .scene_workspace(&fixture.project, &fixture.project_id)
                .unwrap(),
        );
        fs::write(
            fixture.root.join(&fixture.scene_path),
            b"label scene_one:\n    \"Changed elsewhere\"\n    return\n",
        )
        .unwrap();
        let after = narration(
            &fixture
                .service
                .scene_workspace(&fixture.project, &fixture.project_id)
                .unwrap(),
        );
        assert_eq!(after, (before.0, "Changed elsewhere".into()));
    }

    #[test]
    fn project_opens_after_scene_source_changed_while_closed() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let reopen = |bytes: &[u8]| {
            fs::write(fixture.root.join(&fixture.scene_path), bytes).unwrap();
            let service = AuthoringService::default();
            let project = service.register_project(&fixture.root).unwrap();
            service
                .ensure_phase_1e_metadata(&project, &fixture.project_id)
                .unwrap();
            service
                .scene_workspace(&project, &fixture.project_id)
                .unwrap()
                .scenes[0]
                .clone()
        };
        let edited = reopen(b"label scene_one:\n    \"Changed elsewhere\"\n    return\n");
        assert!(!edited.source_conflict);
        assert!(edited.beats.iter().any(|beat| matches!(
            &beat.payload,
            BeatPayload::Narration { text, .. } if text == "Changed elsewhere"
        )));
        // A source Story cannot map opens as unavailable, not as a refused project.
        let invalid = reopen(b"label scene_one\n    \"unfinished\n");
        assert!(invalid.source_conflict);
        assert!(invalid.beats.is_empty());
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
        fixture.service.history_undo(&fixture.project).unwrap();
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
    fn source_draft_steps_undo_without_writing_and_save_joins_them() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        let path = "game/other.rpy";
        let disk = || fs::read(fixture.root.join(path)).unwrap();
        let original = disk();
        let type_text = |text: &str, new_step: bool| {
            let base = fixture.open(path).base_revision;
            fixture
                .service
                .source_update_draft(
                    &fixture.project,
                    &fixture.project_id,
                    SourceDraftRequest {
                        path: path.into(),
                        expected_base_revision: base,
                        text: text.into(),
                        selection_start: 0,
                        selection_end: 0,
                        new_step,
                    },
                )
                .unwrap()
        };
        let undo_name = || {
            let state = fixture.service.history_state(&fixture.project).unwrap();
            state.undo.map(|label| label.name)
        };
        // The first change starts a step; typing extends it until the renderer ends it.
        let first = type_text("one two three four\n", false);
        assert_eq!(
            first
                .history
                .and_then(|state| state.undo)
                .map(|label| label.name),
            Some("Source typing in other.rpy".into())
        );
        assert!(type_text("one two three four five\n", false)
            .history
            .is_none());
        assert!(type_text("one 雪 three four five\n", true)
            .history
            .is_some());
        // Undo restores the draft before each step and selects what changed. Nothing is written.
        let step = fixture.service.history_undo(&fixture.project).unwrap();
        assert!(step.step.is_some());
        let reverted = fixture.open(path);
        assert_eq!(reverted.text.as_deref(), Some("one two three four five\n"));
        assert_eq!((reverted.selection_start, reverted.selection_end), (4, 7));
        fixture.service.history_undo(&fixture.project).unwrap();
        let clean = fixture.open(path);
        assert!(!clean.dirty);
        assert_eq!(disk(), original);
        assert_eq!(
            fixture.service.history_undo(&fixture.project),
            Err(SceneError::HistoryBoundary)
        );
        fixture.service.history_redo(&fixture.project).unwrap();
        fixture.service.history_redo(&fixture.project).unwrap();
        assert_eq!(
            fixture.open(path).text.as_deref(),
            Some("one 雪 three four five\n")
        );
        assert_eq!(disk(), original);
        // Save joins both steps into one entry; one Undo reverses the file.
        fixture.save(&fixture.open(path)).unwrap();
        assert_eq!(undo_name(), Some("Source edit in other.rpy".into()));
        fixture.service.history_undo(&fixture.project).unwrap();
        assert_eq!(disk(), original);
        assert_eq!(
            fixture.service.history_undo(&fixture.project),
            Err(SceneError::HistoryBoundary)
        );
        // Discard Draft is permanent: its steps leave the history.
        fixture.service.history_redo(&fixture.project).unwrap();
        type_text("one two\n", true);
        fixture
            .service
            .source_discard(
                &fixture.project,
                &fixture.project_id,
                SourcePathRequest { path: path.into() },
            )
            .unwrap();
        assert_eq!(undo_name(), Some("Source edit in other.rpy".into()));
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
                drafts: Vec::new(),
                expected_project_revision: workspace.project_revision,
                expected_source_map_revision: workspace.source_map_revision,
                expected_authoring_revision: None,
                command: SceneCommand::UpdateBodyBeat {
                    scene_id: fixture.scene_id.clone(),
                    expected_source_revision: workspace.scenes[0].source_revision.clone(),
                    beat_id: workspace.scenes[0].beats[0].id.clone(),
                    expected_body: crate::scene::BodyRef::Root,
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
                    expected_revision: None,
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
                    expected_revision: None,
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
                    new_step: false,
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
                    new_step: false,
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
                        new_step: false,
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
                    new_step: false,
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
    #[test]
    fn flow_source_navigation_preserves_draft_caret_and_refuses_stale_ranges() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        let original = fixture.open(&fixture.scene_path);
        let draft = "label scene_one:\n    \"Pending\"\n    return\n";
        fixture
            .service
            .source_update_draft(
                &fixture.project,
                &fixture.project_id,
                SourceDraftRequest {
                    path: fixture.scene_path.clone(),
                    expected_base_revision: original.base_revision.clone(),
                    text: draft.into(),
                    selection_start: 22,
                    selection_end: 24,
                    new_step: false,
                },
            )
            .unwrap();
        let accepted = fixture
            .service
            .flow_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        assert!(!accepted.stale);
        assert_eq!(accepted.edges.len(), 1);
        assert_eq!(accepted.edges[0].location.revision, original.base_revision);
        assert_eq!(
            fs::read(fixture.root.join(&fixture.scene_path)).unwrap(),
            b"label scene_one:\n    \"Hello\"\n    return\n"
        );
        let target = SourceOpenRequest {
            path: fixture.scene_path.clone(),
            expected_revision: Some(original.base_revision.clone()),
            selection_start: None,
            selection_end: None,
            byte_start: Some(0),
            byte_end: Some(4),
        };
        let retained = fixture
            .service
            .source_open(&fixture.project, &fixture.project_id, target.clone())
            .unwrap();
        assert_eq!(retained.text.as_deref(), Some(draft));
        assert_eq!(retained.selection_start, 22);
        assert_eq!(retained.selection_end, 24);
        fs::write(
            fixture.root.join(&fixture.scene_path),
            b"label scene_one:\n    \"External\"\n    return\n",
        )
        .unwrap();
        let conflict = fixture
            .service
            .flow_workspace(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(conflict.observation.status, "incomplete");
        let retained = fixture
            .service
            .source_open(&fixture.project, &fixture.project_id, target.clone())
            .unwrap();
        assert_eq!(retained.text.as_deref(), Some(draft));
        assert_eq!((retained.selection_start, retained.selection_end), (22, 24));
        assert!(retained
            .external_text
            .as_deref()
            .unwrap()
            .contains("External"));
        fixture
            .service
            .source_discard(
                &fixture.project,
                &fixture.project_id,
                SourcePathRequest {
                    path: fixture.scene_path.clone(),
                },
            )
            .unwrap();
        let mut stale = target;
        stale.expected_revision = Some("0".repeat(64));
        let prior = fixture.open(&fixture.scene_path);
        let next = fixture
            .service
            .source_open(&fixture.project, &fixture.project_id, stale)
            .unwrap();
        assert_eq!(next.selection_start, prior.selection_start);
    }
}
