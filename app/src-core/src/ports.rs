//! Extension points. Only Phase 1B's transaction port has filesystem authority.

use crate::transaction::{
    CommitOutcome, FlushOutcome, ProjectId, RecoveryReport, TransactionProposal,
};

/// The single production write boundary used by later source-authoring milestones.
/// Implementations own project roots; callers supply only opaque IDs and normalized
/// project-relative paths embedded in a validated proposal.
pub trait SourceTransactionPort {
    fn commit(&self, project: &ProjectId, proposal: TransactionProposal) -> CommitOutcome;
    fn flush(&self, project: &ProjectId) -> FlushOutcome;
    fn recover(&self, project: &ProjectId) -> RecoveryReport;
}

pub trait ProjectFilesystemPort {}
pub trait RenpyPort {}
pub trait GitPort {}
pub trait CredentialPort {}
pub trait NetworkProviderPort {}
