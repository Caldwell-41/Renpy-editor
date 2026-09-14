use super::{
    ErrorCode, FileMutation, MutationKind, RelativePath, Revision, TransactionIntent,
    TransactionProposal,
};
use std::collections::HashMap;

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
    pub mutations: Vec<HistoryMutation>,
}

#[derive(Default)]
pub struct HistoryStack {
    entries: Vec<HistoryEntry>,
    cursor: usize,
}

impl HistoryStack {
    pub fn push(&mut self, entry: HistoryEntry) {
        self.entries.truncate(self.cursor);
        self.entries.push(entry);
        self.cursor = self.entries.len();
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

    pub fn accepted_redo(&mut self) -> Result<(), ErrorCode> {
        if self.cursor >= self.entries.len() {
            return Err(ErrorCode::HistoryBoundary);
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
        mutations.push(FileMutation {
            path: mutation.path.clone(),
            kind: MutationKind::ReplaceExisting,
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
