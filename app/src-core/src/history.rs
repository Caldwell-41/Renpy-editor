//! Project history: the one ordered list of the author's edits in an open project
//! (GLOSSARY "Project history", ADR 0025). Every workspace commits through it, and
//! one Undo and one Redo reverse its latest entry. Each entry restores exact bytes
//! only while the current revisions still match its boundary (ADR 0006).
use crate::authoring::AuthoringService;
use crate::scene::SceneError;
use crate::transaction::{
    CommitOutcome, ErrorCode, FileMutation, MutationKind, ProjectId, RelativePath, Revision,
    TransactionIntent, TransactionProposal,
};
use serde::Serialize;
use std::collections::HashMap;

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
                HistoryItem::Variable { variable_id } => named(variable_id),
                HistoryItem::Asset { asset_id } => named(asset_id),
            }
    }
}

/// The item an entry reveals. When it no longer exists, the renderer selects the
/// nearest item that contains it, or opens the workspace.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
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
    Variable {
        variable_id: String,
    },
    Asset {
        asset_id: String,
    },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
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
/// history that follows.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryStep {
    pub entry: HistoryLabel,
    pub history: HistoryState,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HistoryMutation {
    pub path: RelativePath,
    pub before_revision: Revision,
    pub before_bytes: Vec<u8>,
    pub after_revision: Revision,
    pub after_bytes: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HistoryEntry {
    pub transaction_id: String,
    pub label: HistoryLabel,
    pub mutations: Vec<HistoryMutation>,
}

#[derive(Default)]
pub struct HistoryStack {
    entries: Vec<HistoryEntry>,
    cursor: usize,
}

impl HistoryStack {
    pub fn can_undo(&self) -> bool {
        self.cursor > 0
    }

    pub fn can_redo(&self) -> bool {
        self.cursor < self.entries.len()
    }

    pub fn undo_paths(&self) -> Result<Vec<RelativePath>, ErrorCode> {
        self.cursor
            .checked_sub(1)
            .and_then(|index| self.entries.get(index))
            .map(|entry| {
                entry
                    .mutations
                    .iter()
                    .map(|item| item.path.clone())
                    .collect()
            })
            .ok_or(ErrorCode::HistoryBoundary)
    }

    pub fn redo_paths(&self) -> Result<Vec<RelativePath>, ErrorCode> {
        self.entries
            .get(self.cursor)
            .map(|entry| {
                entry
                    .mutations
                    .iter()
                    .map(|item| item.path.clone())
                    .collect()
            })
            .ok_or(ErrorCode::HistoryBoundary)
    }

    pub fn state(&self) -> HistoryState {
        HistoryState {
            undo: self
                .cursor
                .checked_sub(1)
                .and_then(|index| self.entries.get(index))
                .map(|entry| entry.label.clone()),
            redo: self
                .entries
                .get(self.cursor)
                .map(|entry| entry.label.clone()),
        }
    }

    /// Adds an entry above the cursor and drops Redo. An entry without a name and
    /// an item is refused.
    pub fn push(&mut self, entry: HistoryEntry) -> Result<(), ErrorCode> {
        if !entry.label.is_complete() {
            return Err(ErrorCode::InvalidProposal);
        }
        self.entries.truncate(self.cursor);
        self.entries.push(entry);
        self.cursor = self.entries.len();
        Ok(())
    }

    pub fn undo_proposal(
        &self,
        current: &HashMap<RelativePath, Revision>,
    ) -> Result<TransactionProposal, ErrorCode> {
        let index = self
            .cursor
            .checked_sub(1)
            .ok_or(ErrorCode::HistoryBoundary)?;
        proposal(&self.entries[index], current, false)
    }

    pub fn redo_proposal(
        &self,
        current: &HashMap<RelativePath, Revision>,
    ) -> Result<TransactionProposal, ErrorCode> {
        let entry = self
            .entries
            .get(self.cursor)
            .ok_or(ErrorCode::HistoryBoundary)?;
        proposal(entry, current, true)
    }

    pub fn accepted_undo(&mut self) -> Result<(), ErrorCode> {
        self.cursor = self
            .cursor
            .checked_sub(1)
            .ok_or(ErrorCode::HistoryBoundary)?;
        Ok(())
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

    pub fn accepted_redo(&mut self) -> Result<(), ErrorCode> {
        if self.cursor >= self.entries.len() {
            return Err(ErrorCode::HistoryBoundary);
        }
        self.cursor += 1;
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
        if !label.is_complete() {
            return Err(SceneError::InvalidPayload);
        }
        let snapshot = proposal.mutations.clone();
        match self.commit_observed(project, proposal) {
            CommitOutcome::Committed {
                transaction_id,
                revisions,
            } => {
                let mutations = snapshot
                    .into_iter()
                    .zip(revisions.iter().cloned())
                    .map(|(mutation, after_revision)| HistoryMutation {
                        path: mutation.path,
                        before_revision: mutation.base,
                        before_bytes: mutation.expected_bytes,
                        after_revision,
                        after_bytes: mutation.proposed,
                    })
                    .collect();
                self.project_history
                    .lock()
                    .map_err(|_| SceneError::Io)?
                    .entry(project.clone())
                    .or_default()
                    .push(HistoryEntry {
                        transaction_id,
                        label,
                        mutations,
                    })
                    .map_err(|_| SceneError::InvalidPayload)?;
                Ok(revisions)
            }
            outcome => Err(crate::scene::outcome_error(outcome)),
        }
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
            history: history.state(),
        })
    }
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
