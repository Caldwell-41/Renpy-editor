//! Project history: the one ordered list of the author's edits in an open project
//! (GLOSSARY "Project history", ADR 0025). Every workspace commits through it, and
//! one Undo and one Redo reverse its latest entry. Each entry restores exact bytes
//! only while the current revisions still match its boundary (ADR 0006). A
//! draft-step entry holds only the place of one unfinished draft edit; its Undo and
//! Redo write nothing, and the renderer restores the draft.
use crate::authoring::AuthoringService;
use crate::scene::SceneError;
use crate::transaction::{
    CommitOutcome, ErrorCode, FileMutation, MutationKind, ProjectId, RelativePath, Revision,
    TransactionIntent, TransactionProposal,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The longest step id, draft id or name a draft step may carry.
const MAX_DRAFT_STEP_TEXT: usize = 256;

/// A step id, draft id or step name: not blank, and short.
pub(crate) fn draft_text(value: &str) -> bool {
    !value.trim().is_empty() && value.len() <= MAX_DRAFT_STEP_TEXT
}

/// What the author sees for an entry: the edit's name and the item Undo reveals.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryLabel {
    pub name: String,
    pub item: HistoryItem,
}

impl HistoryLabel {
    pub fn new(name: impl Into<String>, item: HistoryItem) -> Self {
        Self {
            name: name.into(),
            item,
        }
    }

    /// An entry needs a name and an item that identifies something to reveal.
    fn is_complete(&self) -> bool {
        let named = |value: &str| !value.trim().is_empty();
        named(&self.name)
            && match &self.item {
                HistoryItem::Story { scene_id, beat_id } => {
                    scene_id.as_deref().is_none_or(named)
                        && beat_id.as_deref().is_none_or(named)
                        && (beat_id.is_none() || scene_id.is_some())
                }
                HistoryItem::Screen {
                    path,
                    screen,
                    node_id,
                    parent_id,
                } => {
                    named(path)
                        && named(screen)
                        && node_id.as_deref().is_none_or(named)
                        && parent_id.as_deref().is_none_or(named)
                }
                HistoryItem::Source { path } => named(path),
                HistoryItem::Prompt { action } => named(action),
                HistoryItem::Reference { record_id, .. } => record_id.as_deref().is_none_or(named),
                HistoryItem::Variable | HistoryItem::Asset => true,
            }
    }
}

/// The item an entry reveals. When it no longer exists, the renderer selects the
/// nearest item that contains it, or opens the workspace.
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum HistoryItem {
    /// A beat, its scene when `beat_id` is absent, or Story when both are absent.
    Story {
        scene_id: Option<String>,
        beat_id: Option<String>,
    },
    /// An element of a screen, or the screen itself, by its Source path and name.
    /// `parent_id` is revealed when Undo or Redo leaves the element gone.
    Screen {
        path: String,
        screen: String,
        node_id: Option<String>,
        parent_id: Option<String>,
    },
    Source {
        path: String,
    },
    Prompt {
        action: String,
    },
    /// A reference record, or the project context when `record_id` is absent.
    Reference {
        kind: ReferenceItem,
        record_id: Option<String>,
    },
    /// Variables and Assets open their workspace.
    Variable,
    Asset,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReferenceItem {
    Card,
    Lore,
    Context,
}

impl HistoryItem {
    pub fn beat(scene_id: impl Into<String>, beat_id: Option<String>) -> Self {
        Self::Story {
            scene_id: Some(scene_id.into()),
            beat_id,
        }
    }

    pub fn screen(
        path: impl Into<String>,
        screen: impl Into<String>,
        node_id: Option<String>,
    ) -> Self {
        Self::Screen {
            path: path.into(),
            screen: screen.into(),
            node_id,
            parent_id: None,
        }
    }

    pub fn source(path: impl Into<String>) -> Self {
        Self::Source { path: path.into() }
    }
}

/// The next entry each command would reverse or restore.
#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryState {
    pub undo: Option<HistoryLabel>,
    pub redo: Option<HistoryLabel>,
}

/// The result of one Undo or Redo: the entry it reversed or restored, then the
/// history that follows. `step` names the draft step when the entry was one, so
/// the renderer can restore that draft.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryStep {
    pub entry: HistoryLabel,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step: Option<DraftStep>,
    pub history: HistoryState,
}

/// One unfinished draft edit's place in the history: its step id and the draft it
/// belongs to. It carries no field values or bytes (ADR 0025).
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftStep {
    pub step_id: String,
    pub draft: String,
}

/// `history.draftStep`: adds a draft-step entry with its name and item.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DraftStepRequest {
    pub step_id: String,
    pub draft: String,
    pub name: String,
    pub item: HistoryItem,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HistoryMutation {
    pub path: RelativePath,
    pub before_revision: Revision,
    pub before_bytes: Vec<u8>,
    pub after_revision: Revision,
    pub after_bytes: Vec<u8>,
}

/// A committed edit restores `mutations`; a draft step has none and names its `step`.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HistoryEntry {
    pub transaction_id: String,
    pub label: HistoryLabel,
    pub mutations: Vec<HistoryMutation>,
    pub step: Option<DraftStep>,
}

#[derive(Default)]
pub struct HistoryStack {
    entries: Vec<HistoryEntry>,
    cursor: usize,
}

impl HistoryStack {
    /// The entry Undo would reverse: the one below the cursor.
    fn undo_entry(&self) -> Option<&HistoryEntry> {
        self.entries.get(self.cursor.checked_sub(1)?)
    }

    /// The entry Redo would restore: the one at the cursor.
    fn redo_entry(&self) -> Option<&HistoryEntry> {
        self.entries.get(self.cursor)
    }

    pub fn undo_paths(&self) -> Result<Vec<RelativePath>, ErrorCode> {
        self.undo_entry()
            .map(paths)
            .ok_or(ErrorCode::HistoryBoundary)
    }

    pub fn redo_paths(&self) -> Result<Vec<RelativePath>, ErrorCode> {
        self.redo_entry()
            .map(paths)
            .ok_or(ErrorCode::HistoryBoundary)
    }

    pub fn state(&self) -> HistoryState {
        HistoryState {
            undo: self.undo_entry().map(|entry| entry.label.clone()),
            redo: self.redo_entry().map(|entry| entry.label.clone()),
        }
    }

    /// Adds an entry above the cursor and drops Redo. An entry without a name and
    /// an item is refused.
    pub fn push(&mut self, entry: HistoryEntry) -> Result<(), ErrorCode> {
        self.push_joined(vec![entry], &[])
    }

    /// Adds `entries` above the cursor, the last on top, and drops Redo. The
    /// draft-step entries of the `joined` drafts leave the history, because their
    /// edit is now in `entries` or was discarded. Nothing changes if any entry has
    /// no name or item.
    pub fn push_joined(
        &mut self,
        entries: Vec<HistoryEntry>,
        joined: &[String],
    ) -> Result<(), ErrorCode> {
        if entries.iter().any(|entry| !entry.label.is_complete()) {
            return Err(ErrorCode::InvalidProposal);
        }
        self.entries.truncate(self.cursor);
        self.entries.retain(|entry| {
            entry
                .step
                .as_ref()
                .is_none_or(|step| !joined.contains(&step.draft))
        });
        self.entries.extend(entries);
        self.cursor = self.entries.len();
        Ok(())
    }

    /// The draft step Undo would reverse, if the next entry is one.
    fn undo_step(&self) -> Option<&DraftStep> {
        self.undo_entry()?.step.as_ref()
    }

    /// The draft step Redo would restore, if the next entry is one.
    fn redo_step(&self) -> Option<&DraftStep> {
        self.redo_entry()?.step.as_ref()
    }

    pub fn undo_proposal(
        &self,
        current: &HashMap<RelativePath, Revision>,
    ) -> Result<TransactionProposal, ErrorCode> {
        let entry = self.undo_entry().ok_or(ErrorCode::HistoryBoundary)?;
        proposal(entry, current, false)
    }

    pub fn redo_proposal(
        &self,
        current: &HashMap<RelativePath, Revision>,
    ) -> Result<TransactionProposal, ErrorCode> {
        let entry = self.redo_entry().ok_or(ErrorCode::HistoryBoundary)?;
        proposal(entry, current, true)
    }

    /// Advances the cursor only after the inverse transaction commits, replacing the
    /// old before identities with the identities returned by that actual commit.
    pub fn accepted_undo_with_revisions(
        &mut self,
        revisions: &[Revision],
    ) -> Result<(), ErrorCode> {
        let index = self
            .cursor
            .checked_sub(1)
            .ok_or(ErrorCode::HistoryBoundary)?;
        if revisions.len() != self.entries[index].mutations.len() {
            return Err(ErrorCode::InvalidProposal);
        }
        let (earlier, remaining) = self.entries.split_at_mut(index);
        for (mutation, revision) in remaining[0].mutations.iter_mut().zip(revisions) {
            // Replacement restores the same historical state with a new file
            // identity. Carry it only across a proven continuous transition to
            // the nearest earlier entry touching this path. A real external
            // replacement between entries must remain a boundary.
            if let Some(previous) = earlier.iter_mut().rev().find_map(|entry| {
                entry
                    .mutations
                    .iter_mut()
                    .find(|item| item.path == mutation.path)
            }) {
                if previous.after_revision == mutation.before_revision
                    && previous.after_bytes == mutation.before_bytes
                {
                    previous.after_revision = revision.clone();
                }
            }
            mutation.before_revision = revision.clone();
        }
        self.cursor = index;
        Ok(())
    }

    /// Advances the cursor only after redo commits and retains the new platform file
    /// identities for a subsequent undo.
    pub fn accepted_redo_with_revisions(
        &mut self,
        revisions: &[Revision],
    ) -> Result<(), ErrorCode> {
        if self.cursor >= self.entries.len()
            || revisions.len() != self.entries[self.cursor].mutations.len()
        {
            return Err(ErrorCode::HistoryBoundary);
        }
        let (completed, later) = self.entries.split_at_mut(self.cursor + 1);
        for (mutation, revision) in completed[self.cursor].mutations.iter_mut().zip(revisions) {
            // Symmetric continuity for consecutive redo, including entries on
            // unrelated paths between the two touching entries.
            if let Some(next) = later.iter_mut().find_map(|entry| {
                entry
                    .mutations
                    .iter_mut()
                    .find(|item| item.path == mutation.path)
            }) {
                if next.before_revision == mutation.after_revision
                    && next.before_bytes == mutation.after_bytes
                {
                    next.before_revision = revision.clone();
                }
            }
            mutation.after_revision = revision.clone();
        }
        self.cursor += 1;
        Ok(())
    }
}

fn paths(entry: &HistoryEntry) -> Vec<RelativePath> {
    entry
        .mutations
        .iter()
        .map(|item| item.path.clone())
        .collect()
}

fn proposal(
    entry: &HistoryEntry,
    current: &HashMap<RelativePath, Revision>,
    forward: bool,
) -> Result<TransactionProposal, ErrorCode> {
    let mut mutations = Vec::with_capacity(entry.mutations.len());
    for mutation in &entry.mutations {
        let (expected_revision, expected_bytes, proposed) = if forward {
            (
                &mutation.before_revision,
                &mutation.before_bytes,
                &mutation.after_bytes,
            )
        } else {
            (
                &mutation.after_revision,
                &mutation.after_bytes,
                &mutation.before_bytes,
            )
        };
        if current.get(&mutation.path) != Some(expected_revision) {
            return Err(ErrorCode::HistoryBoundary);
        }
        let kind = match (
            *expected_revision == Revision::expected_absence(),
            proposed.is_empty(),
        ) {
            (true, false) => MutationKind::CreateNew,
            (false, true) => MutationKind::DeleteExisting,
            _ => MutationKind::ReplaceExisting,
        };
        mutations.push(FileMutation {
            path: mutation.path.clone(),
            kind,
            base: expected_revision.clone(),
            expected_bytes: expected_bytes.clone(),
            proposed: proposed.clone(),
        });
    }
    Ok(TransactionProposal {
        mutations,
        intent: if forward {
            TransactionIntent::Redo
        } else {
            TransactionIntent::Undo
        },
    })
}

/// One edit inside a committed proposal: its history name and item, and the
/// mutations it made. A proposal's parts chain in order from its bases to its
/// proposed bytes, so each part becomes its own entry and the last is on top.
pub(crate) struct HistoryPart {
    pub label: HistoryLabel,
    pub mutations: Vec<FileMutation>,
}

impl AuthoringService {
    /// Commits a proposal and records it as one project history entry with the
    /// edit's name and the item to reveal. An incomplete label is refused before
    /// anything is written.
    pub(crate) fn commit_history(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
        label: HistoryLabel,
    ) -> Result<Vec<Revision>, SceneError> {
        let mutations = proposal.mutations.clone();
        self.commit_history_parts(
            project,
            proposal,
            vec![HistoryPart { label, mutations }],
            &[],
        )
    }

    /// Commits a proposal and records one entry for each part, in order, with
    /// the draft-step entries of the `joined` drafts removed (ADR 0025). An
    /// incomplete label is refused before anything is written.
    pub(crate) fn commit_history_parts(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
        parts: Vec<HistoryPart>,
        joined: &[String],
    ) -> Result<Vec<Revision>, SceneError> {
        if parts.iter().any(|part| !part.label.is_complete()) {
            return Err(SceneError::InvalidPayload);
        }
        let paths: Vec<RelativePath> = proposal
            .mutations
            .iter()
            .map(|mutation| mutation.path.clone())
            .collect();
        match self.commit_observed(project, proposal) {
            CommitOutcome::Committed {
                transaction_id,
                revisions,
            } => {
                let committed: HashMap<_, _> = paths.into_iter().zip(revisions.iter()).collect();
                let entries = part_entries(&transaction_id, parts, &committed)?;
                self.record_history(project, entries, joined)?;
                Ok(revisions)
            }
            outcome => Err(crate::scene::outcome_error(outcome)),
        }
    }

    /// Removes the draft-step entries of drafts that ended without a byte change,
    /// such as a Commit that changed nothing.
    pub(crate) fn forget_draft_steps(
        &self,
        project: &ProjectId,
        joined: &[String],
    ) -> Result<(), SceneError> {
        if joined.is_empty() {
            return Ok(());
        }
        self.record_history(project, Vec::new(), joined)
    }

    fn record_history(
        &self,
        project: &ProjectId,
        entries: Vec<HistoryEntry>,
        joined: &[String],
    ) -> Result<(), SceneError> {
        self.project_history
            .lock()
            .map_err(|_| SceneError::Io)?
            .entry(project.clone())
            .or_default()
            .push_joined(entries, joined)
            .map_err(|_| SceneError::InvalidPayload)
    }

    /// Adds a draft-step entry on top and drops Redo. It records no bytes and
    /// writes nothing.
    pub fn history_draft_step(
        &self,
        project: &ProjectId,
        request: DraftStepRequest,
    ) -> Result<HistoryState, SceneError> {
        if ![&request.step_id, &request.draft, &request.name]
            .into_iter()
            .all(|value| draft_text(value))
        {
            return Err(SceneError::InvalidPayload);
        }
        let mut histories = self.project_history.lock().map_err(|_| SceneError::Io)?;
        let history = histories.entry(project.clone()).or_default();
        history
            .push(HistoryEntry {
                transaction_id: request.step_id.clone(),
                label: HistoryLabel::new(request.name, request.item),
                mutations: Vec::new(),
                step: Some(DraftStep {
                    step_id: request.step_id,
                    draft: request.draft,
                }),
            })
            .map_err(|_| SceneError::InvalidPayload)?;
        Ok(history.state())
    }

    pub fn history_state(&self, project: &ProjectId) -> Result<HistoryState, SceneError> {
        Ok(self
            .project_history
            .lock()
            .map_err(|_| SceneError::Io)?
            .get(project)
            .map(HistoryStack::state)
            .unwrap_or_default())
    }

    /// Reverses the latest entry. Dirty Source, revision and recovery checks refuse
    /// it before anything is written, and the cursor moves only after the commit.
    pub fn history_undo(&self, project: &ProjectId) -> Result<HistoryStep, SceneError> {
        self.history_step(project, false)
    }

    /// Restores the latest undone entry under the same checks as Undo.
    pub fn history_redo(&self, project: &ProjectId) -> Result<HistoryStep, SceneError> {
        self.history_step(project, true)
    }

    fn history_step(&self, project: &ProjectId, redo: bool) -> Result<HistoryStep, SceneError> {
        let mut histories = self.project_history.lock().map_err(|_| SceneError::Io)?;
        let history = histories
            .get_mut(project)
            .ok_or(SceneError::HistoryBoundary)?;
        let state = history.state();
        let entry =
            if redo { state.redo } else { state.undo }.ok_or(SceneError::HistoryBoundary)?;
        // A draft step writes nothing: only the cursor moves.
        let step = if redo {
            history.redo_step()
        } else {
            history.undo_step()
        }
        .cloned();
        if step.is_some() {
            if redo {
                history.accepted_redo_with_revisions(&[])
            } else {
                history.accepted_undo_with_revisions(&[])
            }
            .map_err(history_error)?;
            return Ok(HistoryStep {
                entry,
                step,
                history: history.state(),
            });
        }
        let paths = if redo {
            history.redo_paths()
        } else {
            history.undo_paths()
        }
        .map_err(history_error)?;
        self.ensure_source_paths_clean(project, paths.iter().map(RelativePath::as_str))
            .map_err(|_| SceneError::DirtySource)?;
        let mut current = HashMap::new();
        for path in paths {
            let revision = self
                .transactions
                .snapshot_optional(project, path.clone())
                .map_err(crate::scene::diagnostic_error)?
                .map_or_else(Revision::expected_absence, |(_, revision)| revision);
            current.insert(path, revision);
        }
        let proposal = if redo {
            history.redo_proposal(&current)
        } else {
            history.undo_proposal(&current)
        }
        .map_err(history_error)?;
        match self.commit_observed(project, proposal) {
            CommitOutcome::Committed { revisions, .. } => {
                if redo {
                    history.accepted_redo_with_revisions(&revisions)
                } else {
                    history.accepted_undo_with_revisions(&revisions)
                }
                .map_err(history_error)?;
            }
            outcome => return Err(crate::scene::outcome_error(outcome)),
        }
        Ok(HistoryStep {
            entry,
            step: None,
            history: history.state(),
        })
    }
}

/// Builds each part's entry. A part's after state for a path is the next part's
/// base for it, or the committed revision when no later part touches the path, so
/// Undo and Redo of consecutive parts carry revisions across (ADR 0006).
fn part_entries(
    transaction_id: &str,
    parts: Vec<HistoryPart>,
    committed: &HashMap<RelativePath, &Revision>,
) -> Result<Vec<HistoryEntry>, SceneError> {
    let mut entries = Vec::with_capacity(parts.len());
    for (index, part) in parts.iter().enumerate() {
        let mut mutations = Vec::with_capacity(part.mutations.len());
        for mutation in &part.mutations {
            let after_revision = parts[index + 1..]
                .iter()
                .find_map(|later| later.mutations.iter().find(|m| m.path == mutation.path))
                .map(|later| later.base.clone())
                .or_else(|| {
                    committed
                        .get(&mutation.path)
                        .map(|&revision| revision.clone())
                })
                .ok_or(SceneError::Io)?;
            mutations.push(HistoryMutation {
                path: mutation.path.clone(),
                before_revision: mutation.base.clone(),
                before_bytes: mutation.expected_bytes.clone(),
                after_revision,
                after_bytes: mutation.proposed.clone(),
            });
        }
        entries.push(HistoryEntry {
            transaction_id: transaction_id.to_owned(),
            label: part.label.clone(),
            mutations,
            step: None,
        });
    }
    Ok(entries)
}

fn history_error(value: ErrorCode) -> SceneError {
    match value {
        ErrorCode::HistoryBoundary => SceneError::HistoryBoundary,
        _ => SceneError::Io,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(name: &str, item: HistoryItem) -> HistoryEntry {
        HistoryEntry {
            transaction_id: "fixture".into(),
            label: HistoryLabel::new(name, item),
            mutations: Vec::new(),
            step: None,
        }
    }

    #[test]
    fn history_refuses_an_entry_without_a_name_or_an_item_to_reveal() {
        let mut history = HistoryStack::default();
        for (name, item) in [
            ("", HistoryItem::source("game/script.rpy")),
            ("  ", HistoryItem::source("game/script.rpy")),
            ("Source edit", HistoryItem::source("")),
            (
                "beat edit",
                HistoryItem::Story {
                    scene_id: None,
                    beat_id: Some("beat".into()),
                },
            ),
            (
                "button resize",
                HistoryItem::screen("game/ui/a.rpy", "", None),
            ),
        ] {
            assert_eq!(
                history.push(entry(name, item)),
                Err(ErrorCode::InvalidProposal)
            );
        }
        assert_eq!(history.state(), HistoryState::default());
        let named = HistoryLabel::new(
            "button resize",
            HistoryItem::screen("game/ui/a.rpy", "menu", None),
        );
        history
            .push(entry(&named.name, named.item.clone()))
            .unwrap();
        assert_eq!(
            history.state(),
            HistoryState {
                undo: Some(named),
                redo: None
            }
        );
    }
}
