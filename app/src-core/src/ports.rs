//! Extension points. Only Phase 1B's transaction port has filesystem authority.

use crate::transaction::{
    CommitOutcome, FlushOutcome, ProjectId, RecoveryReport, TransactionProposal,
};
use crate::{
    lifecycle::{DestinationPreview, LifecycleError, OpenProject, RecentProject},
    renpy::SdkInfo,
};

/// The single production write boundary used by later source-authoring milestones.
/// Implementations own project roots; callers supply only opaque IDs and normalized
/// project-relative paths embedded in a validated proposal.
pub trait SourceTransactionPort {
    fn commit(&self, project: &ProjectId, proposal: TransactionProposal) -> CommitOutcome;
    fn flush(&self, project: &ProjectId) -> FlushOutcome;
    fn recover(&self, project: &ProjectId) -> RecoveryReport;
}

/// Capability-specific lifecycle boundary. Parent and recent IDs are opaque values
/// issued by trusted core/desktop selection flows.
pub trait ProjectFilesystemPort {
    fn validate_destination(
        &self,
        parent_id: &str,
        folder_name: &str,
    ) -> Result<DestinationPreview, LifecycleError>;
    fn list_recent(&self) -> Vec<RecentProject>;
    fn current(&self) -> Option<OpenProject>;
}

/// Exact-version SDK lifecycle only. It does not accept commands or argument lists.
pub trait RenpyPort {
    fn discover_supported(&mut self) -> Vec<SdkInfo>;
    fn install_supported(&mut self) -> Result<SdkInfo, LifecycleError>;
}

/// Marker for the only approved Phase 1C Git capability: `git init` inside a new,
/// private project stage. Status, diff, commits, remotes, and credentials are absent.
pub trait GitPort {
    fn initialise_new_repository(&self, stage: &std::path::Path) -> Result<(), LifecycleError>;
}
pub trait CredentialPort {}
pub trait NetworkProviderPort {}
