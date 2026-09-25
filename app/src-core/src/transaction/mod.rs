//! Journalled, recoverable project-file transactions.
//!
//! This module deliberately does not call its protocol a filesystem transaction or
//! compare-and-swap. Supported platforms replace/exchange one path at a time. The old
//! target is retained and checked after each exchange, so a writer that wins the final
//! validation window is preserved and surfaced instead of being silently overwritten.

mod execution;
mod manifest;
pub(crate) use execution::ExecutionGate;
pub(crate) use manifest::{execution_manifest, ExecutionManifest};
mod history;
mod identity;
mod journal;
mod path;
mod platform;

pub(crate) use path::is_link_or_reparse;
pub(crate) use platform::{flush_open_file, DirectoryAnchor};

pub use history::{HistoryEntry, HistoryMutation, HistoryStack};
use identity::identity_for_file;
pub use identity::FileIdentity;
pub use journal::JournalState;
use journal::{Journal, JournalMutation, JournalStore};
use path::resolve_target;
pub use path::RelativePath;
use platform::{exchange_preserving_target, flush_directory, PlatformCapability};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::{Read, Seek, SeekFrom, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_MUTATIONS: usize = 128;
const MAX_MUTATION_BYTES: usize = 16 * 1024 * 1024;
pub const MAX_IMPORT_BYTES: u64 = 512 * 1024 * 1024;
static NEXT_ID: AtomicU64 = AtomicU64::new(1);
#[cfg(test)]
thread_local! {
    static REVISION_BYTES_READ: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

#[derive(Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ProjectId(String);

impl ProjectId {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Revision {
    pub sha256: String,
    pub identity: FileIdentity,
}

impl Revision {
    pub fn expected_absence() -> Self {
        Self {
            sha256: "0".repeat(64),
            identity: FileIdentity { volume: 0, file: 0 },
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FileMutation {
    pub path: RelativePath,
    pub kind: MutationKind,
    pub base: Revision,
    pub expected_bytes: Vec<u8>,
    pub proposed: Vec<u8>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MutationKind {
    ReplaceExisting,
    CreateNew,
    DeleteExisting,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransactionProposal {
    pub mutations: Vec<FileMutation>,
    pub intent: TransactionIntent,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransactionIntent {
    Edit,
    Undo,
    Redo,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidProposal,
    UnknownProject,
    UnsafePath,
    RootIdentityChanged,
    ParentIdentityChanged,
    FileIdentityChanged,
    StaleRevision,
    ExpectedBytesChanged,
    UnsupportedFilesystem,
    IoFailure,
    Conflict,
    AlreadyExists,
    RecoveryRequired,
    HistoryBoundary,
    RuntimeBusy,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicDiagnostic {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
}

impl PublicDiagnostic {
    fn new(code: ErrorCode, transaction_id: Option<String>) -> Self {
        let message = match code {
            ErrorCode::InvalidProposal => "The file change proposal is invalid.",
            ErrorCode::UnknownProject => "The project is not approved.",
            ErrorCode::UnsafePath => "The project-relative path is unsafe.",
            ErrorCode::RootIdentityChanged => "The approved project identity changed.",
            ErrorCode::ParentIdentityChanged => "A project directory identity changed.",
            ErrorCode::FileIdentityChanged
            | ErrorCode::StaleRevision
            | ErrorCode::ExpectedBytesChanged => "The source changed since it was read.",
            ErrorCode::UnsupportedFilesystem => {
                "The filesystem cannot provide the required recovery guarantee."
            }
            ErrorCode::IoFailure => "The file operation could not be completed.",
            ErrorCode::Conflict => "A competing file revision was preserved for recovery.",
            ErrorCode::AlreadyExists => "A file already exists at the selected project location.",
            ErrorCode::RecoveryRequired => "The file operation requires recovery.",
            ErrorCode::RuntimeBusy => "Stop the runtime operation before changing these files.",
            ErrorCode::HistoryBoundary => "Undo or redo stopped at an external revision boundary.",
        };
        Self {
            code,
            message: message.to_owned(),
            transaction_id,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum CommitOutcome {
    Committed {
        transaction_id: String,
        revisions: Vec<Revision>,
    },
    Conflict {
        diagnostic: PublicDiagnostic,
    },
    RecoveryRequired {
        diagnostic: PublicDiagnostic,
    },
    Rejected {
        diagnostic: PublicDiagnostic,
    },
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum FlushOutcome {
    Flushed,
    Conflict { diagnostic: PublicDiagnostic },
    RecoveryRequired { diagnostic: PublicDiagnostic },
    Rejected { diagnostic: PublicDiagnostic },
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryItem {
    pub transaction_id: String,
    pub state: JournalState,
    pub code: Option<ErrorCode>,
    pub mutations: Vec<RecoveryMutationState>,
    #[serde(default)]
    pub affected: Vec<RecoveryEvidence>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryEvidence {
    pub path: String,
    pub accepted_retained: bool,
    pub displaced_retained: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum RecoveryResolution {
    KeepCurrent,
    AcceptLoomlight,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecoveryMutationState {
    PreparedWithoutStage,
    StagedWithBaseIntact,
    ExchangeCompleteExpected,
    ExchangeCompleteConflict,
    ExternalRevisionWithAcceptedCopy,
    Durable,
    Ambiguous,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryReport {
    pub items: Vec<RecoveryItem>,
}

#[derive(Clone)]
struct ApprovedProject {
    root: PathBuf,
    identity: FileIdentity,
    anchor: Arc<platform::DirectoryAnchor>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FaultPoint {
    Prepared,
    MutationStaged(usize),
    BeforeExchange(usize),
    AfterExchange(usize),
    Verified(usize),
    Committed,
    Durable,
}

pub trait FaultInjector {
    fn visit(&mut self, point: FaultPoint, root: &Path) -> Result<(), ErrorCode>;
}

struct NoFault;
impl FaultInjector for NoFault {
    fn visit(&mut self, _point: FaultPoint, _root: &Path) -> Result<(), ErrorCode> {
        Ok(())
    }
}

#[derive(Default)]
pub struct TransactionService {
    projects: Mutex<HashMap<ProjectId, ApprovedProject>>,
    serial: Mutex<()>,
    executions: Mutex<HashMap<ProjectId, Arc<ExecutionGate>>>,
    execution_consent: Mutex<HashMap<ProjectId, ExecutionManifest>>,
}

impl TransactionService {
    /// Trusted-core registration only. This is intentionally not wired to IPC; Phase
    /// 1C owns user root approval and lifecycle.
    pub fn register_trusted_project(&self, root: &Path) -> Result<ProjectId, PublicDiagnostic> {
        let canonical = fs::canonicalize(root)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::UnsafePath, None))?;
        let meta = fs::symlink_metadata(root)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::UnsafePath, None))?;
        if !meta.is_dir() || path::is_link_or_reparse(&meta) || canonical != root {
            return Err(PublicDiagnostic::new(ErrorCode::UnsafePath, None));
        }
        let anchor = platform::DirectoryAnchor::open_root(&canonical)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        self.register_trusted_anchor(canonical, anchor)
    }

    pub(crate) fn register_trusted_anchor(
        &self,
        root: PathBuf,
        anchor: DirectoryAnchor,
    ) -> Result<ProjectId, PublicDiagnostic> {
        anchor
            .validate_chain()
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        if anchor.path() != root {
            return Err(PublicDiagnostic::new(ErrorCode::RootIdentityChanged, None));
        }
        let identity = anchor.identity().clone();
        let id = ProjectId(new_id("project"));
        self.projects
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?
            .insert(
                id.clone(),
                ApprovedProject {
                    root,
                    identity,
                    anchor: Arc::new(anchor),
                },
            );
        Ok(id)
    }

    pub fn unregister_trusted_project(&self, project: &ProjectId) {
        let Ok(_serial) = self.serial.lock() else {
            return;
        };
        if self.require_no_execution(project).is_err() {
            return;
        }
        if let Ok(mut gates) = self.executions.lock() {
            gates.remove(project);
        }
        if let Ok(mut consent) = self.execution_consent.lock() {
            consent.remove(project);
        }
        if let Ok(mut projects) = self.projects.lock() {
            projects.remove(project);
        }
    }

    pub fn has_blocking_recovery(&self, project: &ProjectId) -> Result<bool, PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        Ok(blocking_recovery_code(&approved).is_some())
    }

    pub(crate) fn recovery_blocker(
        &self,
        project: &ProjectId,
    ) -> Result<Option<ErrorCode>, PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        Ok(blocking_recovery_code(&approved))
    }

    /// Core-only import path. The selected file handle is retained by the trusted
    /// desktop host; renderer state never contains source bytes or an absolute path.
    /// The media create and its small source/metadata companions share one journal.
    pub fn commit_streaming_import(
        &self,
        project: &ProjectId,
        destination: RelativePath,
        source: &mut File,
        expected_len: u64,
        expected_sha256: &str,
        companions: Vec<FileMutation>,
    ) -> CommitOutcome {
        self.commit_streaming_import_with_injector(
            project,
            destination,
            source,
            expected_len,
            expected_sha256,
            companions,
            &mut NoFault,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn commit_streaming_import_with_injector<I: FaultInjector>(
        &self,
        project: &ProjectId,
        destination: RelativePath,
        source: &mut File,
        expected_len: u64,
        expected_sha256: &str,
        companions: Vec<FileMutation>,
        injector: &mut I,
    ) -> CommitOutcome {
        let _serial = match self.serial.lock() {
            Ok(value) => value,
            Err(_) => return rejected(ErrorCode::IoFailure),
        };
        if let Err(diagnostic) = self.require_no_execution(project) {
            return CommitOutcome::Rejected { diagnostic };
        }
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(error) => return CommitOutcome::Rejected { diagnostic: error },
        };
        if self.validate_root(&approved).is_err()
            || expected_len > MAX_IMPORT_BYTES
            || !valid_hash(expected_sha256)
            || companions.len() + 1 > MAX_MUTATIONS
            || companions.iter().any(|item| {
                item.proposed.len() > MAX_MUTATION_BYTES
                    || item.expected_bytes.len() > MAX_MUTATION_BYTES
                    || (item.kind == MutationKind::CreateNew
                        && (item.base != Revision::expected_absence()
                            || !item.expected_bytes.is_empty()))
                    || (item.kind == MutationKind::ReplaceExisting
                        && sha256(&item.expected_bytes) != item.base.sha256)
                    || (item.kind == MutationKind::DeleteExisting
                        && (!item.proposed.is_empty()
                            || sha256(&item.expected_bytes) != item.base.sha256))
            })
        {
            return rejected(ErrorCode::InvalidProposal);
        }
        let mut unique = HashSet::new();
        if !unique.insert(destination.clone())
            || companions
                .iter()
                .any(|item| !unique.insert(item.path.clone()))
        {
            return rejected(ErrorCode::InvalidProposal);
        }
        if blocking_recovery_code(&approved).is_some() {
            return rejected(ErrorCode::RecoveryRequired);
        }

        let txid = new_id("tx");
        let store = match JournalStore::create(&approved.anchor, &txid) {
            Ok(value) => value,
            Err(code) => return outcome_for(code, Some(txid)),
        };
        let mut journal = Journal::new(
            txid.clone(),
            TransactionIntent::Edit,
            PlatformCapability::current(),
        );
        let create_target = match resolve_target(&approved.anchor, &destination, false) {
            Ok(value) => value,
            Err(code) => return fail_journal(&store, &mut journal, code),
        };
        if create_target
            .parent_anchor
            .entry_absent(&create_target.name)
            != Ok(true)
        {
            return fail_journal(&store, &mut journal, ErrorCode::AlreadyExists);
        }
        let create_names = match path::artifact_paths(
            store.directory(),
            &create_target.name,
            &create_target.parent_identity,
            &txid,
            0,
        ) {
            Ok(value) => value,
            Err(code) => return fail_journal(&store, &mut journal, code),
        };
        journal.mutations.push(JournalMutation::new(
            destination.clone(),
            MutationKind::CreateNew,
            Revision::expected_absence(),
            expected_sha256.to_owned(),
            create_names,
        ));
        for (offset, mutation) in companions.iter().enumerate() {
            let target = match resolve_target(
                &approved.anchor,
                &mutation.path,
                mutation.kind != MutationKind::CreateNew,
            ) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            if mutation.kind == MutationKind::CreateNew {
                if target.parent_anchor.entry_absent(&target.name) != Ok(true) {
                    return fail_journal(&store, &mut journal, ErrorCode::AlreadyExists);
                }
            } else {
                let current = target
                    .parent_anchor
                    .open_file(&target.name)
                    .and_then(read_revision_file);
                if current.as_ref() != Ok(&mutation.base) {
                    return fail_journal(&store, &mut journal, ErrorCode::StaleRevision);
                }
                let exact = target
                    .parent_anchor
                    .open_file(&target.name)
                    .and_then(read_bytes_file);
                if exact.as_deref() != Ok(mutation.expected_bytes.as_slice()) {
                    return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
                }
            }
            let names = match path::artifact_paths(
                store.directory(),
                &target.name,
                &target.parent_identity,
                &txid,
                offset + 1,
            ) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            journal.mutations.push(JournalMutation::new(
                mutation.path.clone(),
                mutation.kind,
                mutation.base.clone(),
                sha256(&mutation.proposed),
                names,
            ));
        }
        if store.persist(&mut journal, JournalState::Prepared).is_err() {
            return recovery(&txid);
        }
        if injector
            .visit(FaultPoint::Prepared, &approved.root)
            .is_err()
        {
            return recovery(&txid);
        }

        let media = &journal.mutations[0];
        let staged_result = (|| {
            source
                .seek(SeekFrom::Start(0))
                .map_err(|_| ErrorCode::IoFailure)?;
            let mut stage = store
                .directory()
                .create_new_file(artifact_name(&media.stage))?;
            let (count, digest) = copy_hash_bounded(source, &mut stage, MAX_IMPORT_BYTES)?;
            if count != expected_len || digest != expected_sha256 {
                return Err(ErrorCode::FileIdentityChanged);
            }
            platform::flush_open_file(&stage)?;
            drop(stage);
            let mut stage = store.open_artifact(&media.stage)?;
            let mut accepted = store
                .directory()
                .create_new_file(artifact_name(&media.accepted))?;
            let (accepted_count, accepted_hash) =
                copy_hash_bounded(&mut stage, &mut accepted, MAX_IMPORT_BYTES)?;
            if accepted_count != expected_len || accepted_hash != expected_sha256 {
                return Err(ErrorCode::RecoveryRequired);
            }
            platform::flush_open_file(&accepted)
        })();
        if let Err(code) = staged_result {
            return fail_journal(&store, &mut journal, code);
        }
        journal.mutations[0].staged = true;
        if store
            .persist(&mut journal, JournalState::Staged { mutation: 0 })
            .is_err()
        {
            return recovery(&txid);
        }
        if injector
            .visit(FaultPoint::MutationStaged(0), &approved.root)
            .is_err()
        {
            return recovery(&txid);
        }
        for (index, mutation) in companions.iter().enumerate() {
            let journal_index = index + 1;
            let item = &journal.mutations[journal_index];
            if write_new_synced(&store, &item.stage, &mutation.proposed).is_err()
                || write_new_synced(&store, &item.accepted, &mutation.proposed).is_err()
            {
                return fail_journal(&store, &mut journal, ErrorCode::IoFailure);
            }
            journal.mutations[journal_index].staged = true;
            if store
                .persist(
                    &mut journal,
                    JournalState::Staged {
                        mutation: journal_index,
                    },
                )
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::MutationStaged(journal_index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
        }

        for index in 0..journal.mutations.len() {
            let item = journal.mutations[index].clone();
            let target = match resolve_target(
                &approved.anchor,
                &item.path,
                item.kind != MutationKind::CreateNew,
            ) {
                Ok(value) if value.parent_identity == item.artifacts.parent_identity => value,
                _ => return fail_journal(&store, &mut journal, ErrorCode::ParentIdentityChanged),
            };
            if item.kind == MutationKind::CreateNew {
                if target.parent_anchor.entry_absent(&target.name) != Ok(true) {
                    return fail_journal(&store, &mut journal, ErrorCode::Conflict);
                }
            } else {
                let current = target
                    .parent_anchor
                    .open_file(&target.name)
                    .and_then(read_revision_file);
                if current.as_ref() != Ok(&item.base) {
                    return fail_journal(&store, &mut journal, ErrorCode::StaleRevision);
                }
                let companion = &companions[index - 1];
                let exact = target
                    .parent_anchor
                    .open_file(&target.name)
                    .and_then(read_bytes_file);
                if exact.as_deref() != Ok(companion.expected_bytes.as_slice()) {
                    return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
                }
            }
            journal.mutations[index].commit_intent = true;
            if store
                .persist(&mut journal, JournalState::CommitIntent { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::BeforeExchange(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
            let committed = match item.kind {
                MutationKind::CreateNew => store.directory().rename_no_replace_to(
                    artifact_name(&item.stage),
                    &target.parent_anchor,
                    &target.name,
                ),
                MutationKind::ReplaceExisting => exchange_preserving_target(
                    &target.parent_anchor,
                    &target.name,
                    store.directory(),
                    artifact_name(&item.stage),
                    artifact_name(&item.backup),
                ),
                MutationKind::DeleteExisting => target.parent_anchor.rename_no_replace_to(
                    &target.name,
                    store.directory(),
                    artifact_name(&item.backup),
                ),
            };
            if committed.is_err() {
                let code = if item.kind == MutationKind::CreateNew
                    && target.parent_anchor.entry_absent(&target.name) == Ok(false)
                {
                    ErrorCode::Conflict
                } else {
                    ErrorCode::RecoveryRequired
                };
                return fail_journal(&store, &mut journal, code);
            }
            journal.mutations[index].exchanged = true;
            if store
                .persist(&mut journal, JournalState::Exchanged { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::AfterExchange(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
            let installed = if item.kind == MutationKind::DeleteExisting {
                target
                    .parent_anchor
                    .entry_absent(&target.name)
                    .map(|absent| absent.then_some(Revision::expected_absence()))
                    .and_then(|value| value.ok_or(ErrorCode::RecoveryRequired))
            } else {
                target
                    .parent_anchor
                    .open_file(&target.name)
                    .and_then(read_revision_file)
            };
            let backup_ok = item.kind == MutationKind::CreateNew
                || store
                    .open_artifact(&item.backup)
                    .and_then(read_revision_file)
                    .as_ref()
                    == Ok(&item.base);
            let installed_matches = if item.kind == MutationKind::DeleteExisting {
                installed.as_ref() == Ok(&Revision::expected_absence())
            } else {
                installed.as_ref().map(|value| &value.sha256) == Ok(&item.proposed_sha256)
            };
            if !backup_ok || !installed_matches {
                let _ = store.persist(&mut journal, JournalState::Conflict { mutation: index });
                return conflict(&txid);
            }
            journal.mutations[index].verified = true;
            if store
                .persist(&mut journal, JournalState::Verified { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::Verified(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
        }
        if store
            .persist(&mut journal, JournalState::Committed)
            .is_err()
        {
            return recovery(&txid);
        }
        if injector
            .visit(FaultPoint::Committed, &approved.root)
            .is_err()
        {
            return recovery(&txid);
        }
        let mut revisions = Vec::new();
        for item in &journal.mutations {
            let target = match resolve_target(
                &approved.anchor,
                &item.path,
                item.kind != MutationKind::DeleteExisting,
            ) {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            if item.kind == MutationKind::DeleteExisting {
                if target.parent_anchor.entry_absent(&target.name) != Ok(true)
                    || target.parent_anchor.flush().is_err()
                {
                    return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
                }
                let backup = match store
                    .open_artifact(&item.backup)
                    .and_then(read_revision_file)
                {
                    Ok(value) if value == item.base => value,
                    _ => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
                };
                if store
                    .open_artifact_for_flush(&item.backup)
                    .and_then(|file| platform::flush_open_file(&file))
                    .is_err()
                {
                    return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
                }
                let _ = backup;
                revisions.push(Revision::expected_absence());
            } else {
                let file = match target.parent_anchor.open_file_for_flush(&target.name) {
                    Ok(value) => value,
                    Err(_) => {
                        return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired)
                    }
                };
                if platform::flush_open_file(&file).is_err()
                    || target.parent_anchor.flush().is_err()
                {
                    return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
                }
                match read_revision_file(file) {
                    Ok(value) if value.sha256 == item.proposed_sha256 => revisions.push(value),
                    _ => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
                }
            }
        }
        if store.persist(&mut journal, JournalState::Durable).is_err() {
            return recovery(&txid);
        }
        if injector.visit(FaultPoint::Durable, &approved.root).is_err() {
            return recovery(&txid);
        }
        self.advance_execution_consent(project, &journal.mutations, &revisions);
        CommitOutcome::Committed {
            transaction_id: txid,
            revisions,
        }
    }

    pub fn snapshot(
        &self,
        project: &ProjectId,
        path: RelativePath,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        self.snapshot_bounded(project, path, MAX_MUTATION_BYTES)
    }

    pub(crate) fn snapshot_bounded(
        &self,
        project: &ProjectId,
        path: RelativePath,
        maximum: usize,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let target = resolve_target(&approved.anchor, &path, true)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        let mut file = target
            .parent_anchor
            .open_file(&target.name)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        let identity = identity_for_file(&file)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        let bytes = read_bytes_bounded(&mut file, maximum.min(MAX_MUTATION_BYTES))
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        Ok((
            bytes.clone(),
            Revision {
                sha256: sha256(&bytes),
                identity,
            },
        ))
    }

    pub fn snapshot_optional(
        &self,
        project: &ProjectId,
        path: RelativePath,
    ) -> Result<Option<(Vec<u8>, Revision)>, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let target = resolve_target(&approved.anchor, &path, false)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        if target
            .parent_anchor
            .entry_absent(&target.name)
            .map_err(|code| PublicDiagnostic::new(code, None))?
        {
            return Ok(None);
        }
        self.snapshot(project, path).map(Some)
    }

    pub(crate) fn inspect_file(
        &self,
        project: &ProjectId,
        path: RelativePath,
    ) -> Result<Option<(u64, Revision)>, PublicDiagnostic> {
        self.inspect_file_bounded(project, path, MAX_IMPORT_BYTES)
    }

    pub(crate) fn inspect_file_bounded(
        &self,
        project: &ProjectId,
        path: RelativePath,
        maximum: u64,
    ) -> Result<Option<(u64, Revision)>, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let target = resolve_target(&approved.anchor, &path, false)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        if target
            .parent_anchor
            .entry_absent(&target.name)
            .map_err(|code| PublicDiagnostic::new(code, None))?
        {
            return Ok(None);
        }
        let mut file = target
            .parent_anchor
            .open_file(&target.name)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        let count = file
            .metadata()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?
            .len();
        read_revision_file_bounded(&mut file, maximum.min(MAX_IMPORT_BYTES))
            .map(|revision| Some((count, revision)))
            .map_err(|code| PublicDiagnostic::new(code, None))
    }

    pub(crate) fn inventory_files(
        &self,
        project: &ProjectId,
        directory: &str,
    ) -> Result<Vec<String>, PublicDiagnostic> {
        self.inventory_files_bounded(project, directory, usize::MAX)
    }

    pub(crate) fn inventory_files_bounded(
        &self,
        project: &ProjectId,
        directory: &str,
        mut remaining_entries: usize,
    ) -> Result<Vec<String>, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let mut anchor = approved.anchor.as_ref().clone();
        for component in directory.split('/') {
            anchor = anchor
                .open_child(std::ffi::OsStr::new(component), false)
                .map_err(|code| PublicDiagnostic::new(code, None))?;
        }
        let mut files = Vec::new();
        inventory_directory(&anchor, directory, 0, &mut files, &mut remaining_entries)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        Ok(files)
    }

    /// Creates only the missing components of a validated project-relative directory
    /// while retaining the approved root chain. Empty directories are not runnable
    /// source and may remain after a later rejected file transaction.
    pub(crate) fn ensure_directory(
        &self,
        project: &ProjectId,
        directory: &str,
    ) -> Result<(), PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        if blocking_recovery_code(&approved).is_some() {
            return Err(PublicDiagnostic::new(ErrorCode::RecoveryRequired, None));
        }
        let allow_create = self.require_no_execution(project).is_ok()
            || self.permits_script_directory(project, directory);
        let relative =
            RelativePath::new(directory).map_err(|code| PublicDiagnostic::new(code, None))?;
        let mut anchor = approved.anchor.as_ref().clone();
        for component in relative.as_path().components() {
            let std::path::Component::Normal(name) = component else {
                return Err(PublicDiagnostic::new(ErrorCode::UnsafePath, None));
            };
            anchor = anchor.open_child(name, allow_create).map_err(|code| {
                PublicDiagnostic::new(
                    if !allow_create {
                        ErrorCode::RuntimeBusy
                    } else {
                        code
                    },
                    None,
                )
            })?;
        }
        anchor
            .validate_chain()
            .map_err(|code| PublicDiagnostic::new(code, None))
    }

    pub fn commit_with_injector<I: FaultInjector>(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
        injector: &mut I,
    ) -> CommitOutcome {
        let _serial = match self.serial.lock() {
            Ok(value) => value,
            Err(_) => return rejected(ErrorCode::IoFailure),
        };
        if let Err(diagnostic) = self.check_execution_mutations(project, &proposal.mutations) {
            return CommitOutcome::Rejected { diagnostic };
        }
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(error) => return CommitOutcome::Rejected { diagnostic: error },
        };
        if let Err(error) = self.validate_root(&approved) {
            return CommitOutcome::Rejected { diagnostic: error };
        }
        if proposal.mutations.is_empty() || proposal.mutations.len() > MAX_MUTATIONS {
            return rejected(ErrorCode::InvalidProposal);
        }
        let mut paths = HashSet::new();
        if proposal.mutations.iter().any(|m| {
            m.proposed.len() > MAX_MUTATION_BYTES
                || m.expected_bytes.len() > MAX_MUTATION_BYTES
                || !paths.insert(m.path.clone())
                || !valid_hash(&m.base.sha256)
                || (m.kind == MutationKind::CreateNew
                    && (m.base != Revision::expected_absence() || !m.expected_bytes.is_empty()))
                || (m.kind == MutationKind::DeleteExisting && !m.proposed.is_empty())
        }) {
            return rejected(ErrorCode::InvalidProposal);
        }
        if blocking_recovery_code(&approved).is_some() {
            return rejected(ErrorCode::RecoveryRequired);
        }
        let txid = new_id("tx");
        let store = match JournalStore::create(&approved.anchor, &txid) {
            Ok(value) => value,
            Err(code) => return outcome_for(code, Some(txid)),
        };
        let mut journal =
            Journal::new(txid.clone(), proposal.intent, PlatformCapability::current());
        for (index, mutation) in proposal.mutations.iter().enumerate() {
            if mutation.kind != MutationKind::CreateNew
                && sha256(&mutation.expected_bytes) != mutation.base.sha256
            {
                return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
            }
            let resolved = match resolve_target(
                &approved.anchor,
                &mutation.path,
                mutation.kind != MutationKind::CreateNew,
            ) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            if mutation.kind == MutationKind::CreateNew {
                match resolved.parent_anchor.entry_absent(&resolved.name) {
                    Ok(true) => {}
                    Ok(false) => {
                        return fail_journal(&store, &mut journal, ErrorCode::AlreadyExists)
                    }
                    Err(code) => return fail_journal(&store, &mut journal, code),
                }
            } else {
                let current = match resolved
                    .parent_anchor
                    .open_file(&resolved.name)
                    .and_then(read_revision_file)
                {
                    Ok(value) => value,
                    Err(code) => return fail_journal(&store, &mut journal, code),
                };
                if current.identity != mutation.base.identity {
                    return fail_journal(&store, &mut journal, ErrorCode::FileIdentityChanged);
                }
                if current.sha256 != mutation.base.sha256 {
                    return fail_journal(&store, &mut journal, ErrorCode::StaleRevision);
                }
                let exact = resolved
                    .parent_anchor
                    .open_file(&resolved.name)
                    .and_then(read_bytes_file)
                    .ok();
                if exact.as_deref() != Some(mutation.expected_bytes.as_slice()) {
                    return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
                }
            }
            let names = match path::artifact_paths(
                store.directory(),
                &resolved.name,
                &resolved.parent_identity,
                &txid,
                index,
            ) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            journal.mutations.push(JournalMutation::new(
                mutation.path.clone(),
                mutation.kind,
                mutation.base.clone(),
                sha256(&mutation.proposed),
                names,
            ));
        }
        if store.persist(&mut journal, JournalState::Prepared).is_err() {
            return recovery(&txid);
        }
        if injector
            .visit(FaultPoint::Prepared, &approved.root)
            .is_err()
        {
            return recovery(&txid);
        }

        for (index, mutation) in proposal.mutations.iter().enumerate() {
            let item = &journal.mutations[index];
            if write_new_synced(&store, &item.stage, &mutation.proposed).is_err()
                || write_new_synced(&store, &item.accepted, &mutation.proposed).is_err()
            {
                return fail_journal(&store, &mut journal, ErrorCode::IoFailure);
            }
            journal.mutations[index].staged = true;
            if store
                .persist(&mut journal, JournalState::Staged { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::MutationStaged(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
        }

        for index in 0..proposal.mutations.len() {
            if let Err(code) = self.validate_root(&approved) {
                return fail_journal(&store, &mut journal, code.code);
            }
            let mutation = &proposal.mutations[index];
            let resolved = match resolve_target(
                &approved.anchor,
                &mutation.path,
                mutation.kind == MutationKind::ReplaceExisting,
            ) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            if resolved.parent_identity != journal.mutations[index].artifacts.parent_identity {
                return fail_journal(&store, &mut journal, ErrorCode::ParentIdentityChanged);
            }
            if mutation.kind == MutationKind::CreateNew {
                match resolved.parent_anchor.entry_absent(&resolved.name) {
                    Ok(true) => {}
                    Ok(false) => return fail_journal(&store, &mut journal, ErrorCode::Conflict),
                    Err(code) => return fail_journal(&store, &mut journal, code),
                }
            } else {
                let latest = match resolved
                    .parent_anchor
                    .open_file(&resolved.name)
                    .and_then(read_revision_file)
                {
                    Ok(value) => value,
                    Err(code) => return fail_journal(&store, &mut journal, code),
                };
                if latest.identity != mutation.base.identity {
                    return fail_journal(&store, &mut journal, ErrorCode::FileIdentityChanged);
                }
                if latest.sha256 != mutation.base.sha256 {
                    return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
                }
                let exact = resolved
                    .parent_anchor
                    .open_file(&resolved.name)
                    .and_then(read_bytes_file)
                    .ok();
                if exact.as_deref() != Some(mutation.expected_bytes.as_slice()) {
                    return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
                }
            }
            journal.mutations[index].commit_intent = true;
            if store
                .persist(&mut journal, JournalState::CommitIntent { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::BeforeExchange(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
            let namespace_result = match mutation.kind {
                MutationKind::CreateNew => store.directory().rename_no_replace_to(
                    artifact_name(&journal.mutations[index].stage),
                    &resolved.parent_anchor,
                    &resolved.name,
                ),
                MutationKind::ReplaceExisting => exchange_preserving_target(
                    &resolved.parent_anchor,
                    &resolved.name,
                    store.directory(),
                    artifact_name(&journal.mutations[index].stage),
                    artifact_name(&journal.mutations[index].backup),
                ),
                MutationKind::DeleteExisting => resolved.parent_anchor.rename_no_replace_to(
                    &resolved.name,
                    store.directory(),
                    artifact_name(&journal.mutations[index].backup),
                ),
            };
            if namespace_result.is_err() {
                let code = if mutation.kind == MutationKind::CreateNew
                    && resolved.parent_anchor.entry_absent(&resolved.name) == Ok(false)
                {
                    ErrorCode::Conflict
                } else {
                    ErrorCode::RecoveryRequired
                };
                return fail_journal(&store, &mut journal, code);
            }
            journal.mutations[index].exchanged = true;
            if store
                .persist(&mut journal, JournalState::Exchanged { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::AfterExchange(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }

            if self.validate_root(&approved).is_err() {
                return fail_journal(&store, &mut journal, ErrorCode::RootIdentityChanged);
            }
            match resolve_target(
                &approved.anchor,
                &mutation.path,
                mutation.kind != MutationKind::DeleteExisting,
            ) {
                Ok(target)
                    if target.parent_identity
                        == journal.mutations[index].artifacts.parent_identity => {}
                _ => return fail_journal(&store, &mut journal, ErrorCode::ParentIdentityChanged),
            }

            let installed = if mutation.kind == MutationKind::DeleteExisting {
                match resolved.parent_anchor.entry_absent(&resolved.name) {
                    Ok(true) => Revision::expected_absence(),
                    _ => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
                }
            } else {
                match resolved
                    .parent_anchor
                    .open_file(&resolved.name)
                    .and_then(read_revision_file)
                {
                    Ok(value) => value,
                    Err(_) => {
                        return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired)
                    }
                }
            };
            let displaced_matches = mutation.kind == MutationKind::CreateNew
                || store
                    .open_artifact(&journal.mutations[index].backup)
                    .and_then(read_revision_file)
                    .is_ok_and(|value| value == mutation.base);
            let installed_matches = if mutation.kind == MutationKind::DeleteExisting {
                installed == Revision::expected_absence()
            } else {
                installed.sha256 == journal.mutations[index].proposed_sha256
            };
            if !displaced_matches || !installed_matches {
                let _ = store.persist(&mut journal, JournalState::Conflict { mutation: index });
                return conflict(&txid);
            }
            journal.mutations[index].verified = true;
            if store
                .persist(&mut journal, JournalState::Verified { mutation: index })
                .is_err()
            {
                return recovery(&txid);
            }
            if injector
                .visit(FaultPoint::Verified(index), &approved.root)
                .is_err()
            {
                return recovery(&txid);
            }
        }

        if store
            .persist(&mut journal, JournalState::Committed)
            .is_err()
        {
            return recovery(&txid);
        }
        if injector
            .visit(FaultPoint::Committed, &approved.root)
            .is_err()
        {
            return recovery(&txid);
        }
        let mut revisions = Vec::new();
        for item in &journal.mutations {
            let resolved = match resolve_target(
                &approved.anchor,
                &item.path,
                item.kind != MutationKind::DeleteExisting,
            ) {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            let revision = if item.kind == MutationKind::DeleteExisting {
                if resolved.parent_anchor.entry_absent(&resolved.name) != Ok(true)
                    || resolved.parent_anchor.flush().is_err()
                    || store
                        .open_artifact_for_flush(&item.backup)
                        .and_then(|file| platform::flush_open_file(&file))
                        .is_err()
                {
                    return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
                }
                Revision::expected_absence()
            } else {
                let target_file = match resolved.parent_anchor.open_file_for_flush(&resolved.name) {
                    Ok(value) => value,
                    Err(_) => {
                        return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired)
                    }
                };
                if platform::flush_open_file(&target_file).is_err()
                    || resolved.parent_anchor.flush().is_err()
                {
                    return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
                }
                match read_revision_file(target_file) {
                    Ok(value) => value,
                    Err(_) => {
                        return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired)
                    }
                }
            };
            if item.kind != MutationKind::DeleteExisting && revision.sha256 != item.proposed_sha256
            {
                let _ = store.persist(
                    &mut journal,
                    JournalState::Conflict {
                        mutation: revisions.len(),
                    },
                );
                return conflict(&txid);
            }
            revisions.push(revision);
        }
        if store.persist(&mut journal, JournalState::Durable).is_err() {
            return recovery(&txid);
        }
        if injector.visit(FaultPoint::Durable, &approved.root).is_err() {
            return recovery(&txid);
        }
        self.accepted_execution_edit(project);
        self.advance_execution_consent(project, &journal.mutations, &revisions);
        CommitOutcome::Committed {
            transaction_id: txid,
            revisions,
        }
    }

    pub fn commit(&self, project: &ProjectId, proposal: TransactionProposal) -> CommitOutcome {
        self.commit_with_injector(project, proposal, &mut NoFault)
    }

    pub fn recover(&self, project: &ProjectId) -> RecoveryReport {
        let _serial = match self.serial.lock() {
            Ok(value) => value,
            Err(_) => return recovery_scan_failure(ErrorCode::IoFailure),
        };
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(_) => return RecoveryReport::default(),
        };
        scan_recovery(&approved)
    }

    /// Completes recovery bookkeeping without choosing or deleting any content
    /// revision. Accepted and displaced bytes remain retained; only transaction-owned
    /// partial journal slot files are removed.
    pub fn finalize_recovery(
        &self,
        project: &ProjectId,
        transaction_id: &str,
    ) -> Result<(), PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        if !valid_internal_id(transaction_id, "tx") {
            return Err(PublicDiagnostic::new(ErrorCode::InvalidProposal, None));
        }
        self.require_no_execution(project)?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let store = JournalStore::open(&approved.anchor, transaction_id)
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
        let mut journal = store
            .load()
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
        if journal.transaction_id != transaction_id
            || matches!(journal.state, JournalState::Proposed)
            || (matches!(journal.state, JournalState::Prepared)
                && !store.prepared_is_safe_to_abandon(&journal))
        {
            return Err(PublicDiagnostic::new(
                ErrorCode::RecoveryRequired,
                Some(transaction_id.to_owned()),
            ));
        }
        store
            .persist(&mut journal, JournalState::Cleaned)
            .and_then(|_| store.cleanup_partial_slots())
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))
    }

    /// Resolves only states whose byte ownership is completely proven. It never
    /// chooses by timestamp and never removes accepted or displaced evidence.
    pub fn resolve_recovery(
        &self,
        project: &ProjectId,
        transaction_id: &str,
        resolution: RecoveryResolution,
    ) -> Result<(), PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        if !valid_internal_id(transaction_id, "tx") {
            return Err(PublicDiagnostic::new(ErrorCode::InvalidProposal, None));
        }
        self.require_no_execution(project)?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let store = JournalStore::open(&approved.anchor, transaction_id)
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
        let mut journal = store
            .load()
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
        if journal.transaction_id != transaction_id {
            return Err(PublicDiagnostic::new(
                ErrorCode::RecoveryRequired,
                Some(transaction_id.to_owned()),
            ));
        }
        let states = store
            .mutation_states(&approved.anchor, &journal)
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
        let supported = match resolution {
            RecoveryResolution::KeepCurrent => states.iter().all(|state| {
                matches!(
                    state,
                    RecoveryMutationState::PreparedWithoutStage
                        | RecoveryMutationState::StagedWithBaseIntact
                )
            }),
            RecoveryResolution::AcceptLoomlight => states.iter().all(|state| {
                matches!(
                    state,
                    RecoveryMutationState::ExchangeCompleteExpected
                        | RecoveryMutationState::Durable
                )
            }),
        };
        if states.is_empty() || !supported {
            return Err(PublicDiagnostic::new(
                ErrorCode::RecoveryRequired,
                Some(transaction_id.to_owned()),
            ));
        }
        if resolution == RecoveryResolution::AcceptLoomlight {
            for mutation in &journal.mutations {
                let target = resolve_target(
                    &approved.anchor,
                    &mutation.path,
                    mutation.kind != MutationKind::DeleteExisting,
                )
                .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
                if mutation.kind == MutationKind::DeleteExisting {
                    if target.parent_anchor.entry_absent(&target.name) != Ok(true) {
                        return Err(PublicDiagnostic::new(
                            ErrorCode::RecoveryRequired,
                            Some(transaction_id.to_owned()),
                        ));
                    }
                } else {
                    let revision = target
                        .parent_anchor
                        .open_file_for_flush(&target.name)
                        .and_then(|file| {
                            platform::flush_open_file(&file)?;
                            read_revision_file(file)
                        })
                        .map_err(|code| {
                            PublicDiagnostic::new(code, Some(transaction_id.to_owned()))
                        })?;
                    if revision.sha256 != mutation.proposed_sha256 {
                        return Err(PublicDiagnostic::new(
                            ErrorCode::RecoveryRequired,
                            Some(transaction_id.to_owned()),
                        ));
                    }
                }
                target
                    .parent_anchor
                    .flush()
                    .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))?;
            }
        }
        store
            .persist(&mut journal, JournalState::Cleaned)
            .and_then(|_| store.cleanup_partial_slots())
            .map_err(|code| PublicDiagnostic::new(code, Some(transaction_id.to_owned())))
    }

    pub fn flush(&self, project: &ProjectId) -> FlushOutcome {
        let _serial = match self.serial.lock() {
            Ok(value) => value,
            Err(_) => {
                return FlushOutcome::Rejected {
                    diagnostic: PublicDiagnostic::new(ErrorCode::IoFailure, None),
                }
            }
        };
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(error) => return FlushOutcome::Rejected { diagnostic: error },
        };
        if let Some(code) = blocking_recovery_code(&approved) {
            let diagnostic = PublicDiagnostic::new(code, None);
            return if code == ErrorCode::Conflict {
                FlushOutcome::Conflict { diagnostic }
            } else {
                FlushOutcome::RecoveryRequired { diagnostic }
            };
        }
        if flush_directory(&approved.root).is_err() {
            return FlushOutcome::RecoveryRequired {
                diagnostic: PublicDiagnostic::new(ErrorCode::RecoveryRequired, None),
            };
        }
        FlushOutcome::Flushed
    }

    fn approved(&self, id: &ProjectId) -> Result<ApprovedProject, PublicDiagnostic> {
        self.projects
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?
            .get(id)
            .cloned()
            .ok_or_else(|| PublicDiagnostic::new(ErrorCode::UnknownProject, None))
    }

    fn validate_root(&self, approved: &ApprovedProject) -> Result<(), PublicDiagnostic> {
        let canonical = fs::canonicalize(&approved.root)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::RootIdentityChanged, None))?;
        let meta = fs::symlink_metadata(&approved.root)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::RootIdentityChanged, None))?;
        let identity = identity::identity_for_path(&approved.root)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::RootIdentityChanged, None))?;
        if canonical != approved.root
            || path::is_link_or_reparse(&meta)
            || identity != approved.identity
            || approved.anchor.validate_chain().is_err()
        {
            return Err(PublicDiagnostic::new(ErrorCode::RootIdentityChanged, None));
        }
        Ok(())
    }
}

impl crate::ports::SourceTransactionPort for TransactionService {
    fn commit(&self, project: &ProjectId, proposal: TransactionProposal) -> CommitOutcome {
        TransactionService::commit(self, project, proposal)
    }
    fn flush(&self, project: &ProjectId) -> FlushOutcome {
        TransactionService::flush(self, project)
    }
    fn recover(&self, project: &ProjectId) -> RecoveryReport {
        TransactionService::recover(self, project)
    }
}

pub(super) fn read_revision_file(mut file: File) -> Result<Revision, ErrorCode> {
    read_revision_file_bounded(&mut file, MAX_IMPORT_BYTES)
}

fn read_revision_file_bounded(file: &mut File, maximum: u64) -> Result<Revision, ErrorCode> {
    let identity = identity_for_file(file).map_err(|_| ErrorCode::IoFailure)?;
    let expected_len = file.metadata().map_err(|_| ErrorCode::IoFailure)?.len();
    if expected_len > maximum {
        return Err(ErrorCode::InvalidProposal);
    }
    let (count, sha256) = hash_revision_reader(file, expected_len, maximum)?;
    let final_metadata = file.metadata().map_err(|_| ErrorCode::IoFailure)?;
    let final_identity = identity_for_file(file).map_err(|_| ErrorCode::IoFailure)?;
    if count != expected_len || final_metadata.len() != expected_len || final_identity != identity {
        return Err(ErrorCode::InvalidProposal);
    }
    Ok(Revision { sha256, identity })
}

fn hash_revision_reader(
    reader: &mut impl Read,
    expected_len: u64,
    maximum: u64,
) -> Result<(u64, String), ErrorCode> {
    if expected_len > maximum {
        return Err(ErrorCode::InvalidProposal);
    }
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    let mut count = 0_u64;
    loop {
        crate::runtime_work::check()?;
        let read = reader.read(&mut buffer).map_err(|_| ErrorCode::IoFailure)?;
        if read == 0 {
            break;
        }
        count = count
            .checked_add(read as u64)
            .ok_or(ErrorCode::InvalidProposal)?;
        if count > maximum || count > expected_len {
            return Err(ErrorCode::InvalidProposal);
        }
        digest.update(&buffer[..read]);
        #[cfg(test)]
        REVISION_BYTES_READ.set(REVISION_BYTES_READ.get().saturating_add(read as u64));
    }
    if count != expected_len {
        return Err(ErrorCode::InvalidProposal);
    }
    Ok((count, hex::encode(digest.finalize())))
}

#[cfg(test)]
fn take_revision_bytes_read() -> u64 {
    REVISION_BYTES_READ.replace(0)
}

fn read_bytes_file(mut file: File) -> Result<Vec<u8>, ErrorCode> {
    read_bytes_bounded(&mut file, MAX_MUTATION_BYTES)
}

fn read_bytes_bounded(reader: &mut impl Read, maximum: usize) -> Result<Vec<u8>, ErrorCode> {
    let mut bytes = Vec::new();
    reader
        .take(maximum as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| ErrorCode::IoFailure)?;
    if bytes.len() > maximum {
        return Err(ErrorCode::InvalidProposal);
    }
    Ok(bytes)
}

fn scan_recovery(approved: &ApprovedProject) -> RecoveryReport {
    JournalStore::scan(&approved.anchor).unwrap_or_else(recovery_scan_failure)
}

fn blocking_recovery_code(approved: &ApprovedProject) -> Option<ErrorCode> {
    JournalStore::blocking_code(&approved.anchor).unwrap_or(Some(ErrorCode::RecoveryRequired))
}

fn recovery_scan_failure(code: ErrorCode) -> RecoveryReport {
    RecoveryReport {
        items: vec![RecoveryItem {
            transaction_id: "recovery-scan".to_owned(),
            state: JournalState::RecoveryRequired,
            code: Some(code),
            mutations: Vec::new(),
            affected: Vec::new(),
        }],
    }
}

fn inventory_directory(
    anchor: &DirectoryAnchor,
    prefix: &str,
    depth: usize,
    files: &mut Vec<String>,
    remaining_entries: &mut usize,
) -> Result<(), ErrorCode> {
    if depth > 16 || files.len() > 4096 {
        return Err(ErrorCode::UnsafePath);
    }
    anchor.validate_chain()?;
    crate::runtime_work::check()?;
    for entry in fs::read_dir(anchor.path()).map_err(|_| ErrorCode::IoFailure)? {
        *remaining_entries = remaining_entries
            .checked_sub(1)
            .ok_or(ErrorCode::InvalidProposal)?;
        crate::runtime_work::check()?;
        let entry = entry.map_err(|_| ErrorCode::IoFailure)?;
        let name = entry
            .file_name()
            .into_string()
            .map_err(|_| ErrorCode::UnsafePath)?;
        let metadata = fs::symlink_metadata(entry.path()).map_err(|_| ErrorCode::IoFailure)?;
        if path::is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let relative = format!("{prefix}/{name}");
        if metadata.is_dir() {
            let child = anchor.open_child(std::ffi::OsStr::new(&name), false)?;
            inventory_directory(&child, &relative, depth + 1, files, remaining_entries)?;
        } else if metadata.is_file() {
            files.push(relative);
            if files.len() > 4096 {
                return Err(ErrorCode::UnsafePath);
            }
        } else {
            return Err(ErrorCode::UnsafePath);
        }
    }
    anchor.validate_chain()?;
    Ok(())
}

fn artifact_name(path: &Path) -> &std::ffi::OsStr {
    path.file_name().expect("validated artifact name")
}

fn write_new_synced(store: &JournalStore, name: &Path, bytes: &[u8]) -> Result<(), ErrorCode> {
    let mut file = store.directory().create_new_file(artifact_name(name))?;
    file.write_all(bytes).map_err(|_| ErrorCode::IoFailure)?;
    platform::flush_open_file(&file)
}

fn copy_hash_bounded(
    reader: &mut File,
    writer: &mut File,
    maximum: u64,
) -> Result<(u64, String), ErrorCode> {
    let mut digest = Sha256::new();
    let mut count = 0_u64;
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        crate::runtime_work::check()?;
        let read = reader.read(&mut buffer).map_err(|_| ErrorCode::IoFailure)?;
        if read == 0 {
            break;
        }
        count = count
            .checked_add(read as u64)
            .ok_or(ErrorCode::InvalidProposal)?;
        if count > maximum {
            return Err(ErrorCode::InvalidProposal);
        }
        digest.update(&buffer[..read]);
        writer
            .write_all(&buffer[..read])
            .map_err(|_| ErrorCode::IoFailure)?;
    }
    Ok((count, hex::encode(digest.finalize())))
}

fn sha256(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}
fn valid_hash(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}

impl std::fmt::Display for ErrorCode {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{self:?}")
    }
}
fn new_id(prefix: &str) -> String {
    let time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let counter = NEXT_ID.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{:x}-{:x}-{:x}", std::process::id(), time, counter)
}
fn valid_internal_id(value: &str, prefix: &str) -> bool {
    value.starts_with(&format!("{prefix}-"))
        && value.len() <= 96
        && value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}
fn rejected(code: ErrorCode) -> CommitOutcome {
    CommitOutcome::Rejected {
        diagnostic: PublicDiagnostic::new(code, None),
    }
}
fn conflict(txid: &str) -> CommitOutcome {
    CommitOutcome::Conflict {
        diagnostic: PublicDiagnostic::new(ErrorCode::Conflict, Some(txid.to_owned())),
    }
}
fn recovery(txid: &str) -> CommitOutcome {
    CommitOutcome::RecoveryRequired {
        diagnostic: PublicDiagnostic::new(ErrorCode::RecoveryRequired, Some(txid.to_owned())),
    }
}
fn outcome_for(code: ErrorCode, txid: Option<String>) -> CommitOutcome {
    match code {
        ErrorCode::Conflict => CommitOutcome::Conflict {
            diagnostic: PublicDiagnostic::new(code, txid),
        },
        ErrorCode::RecoveryRequired | ErrorCode::IoFailure => CommitOutcome::RecoveryRequired {
            diagnostic: PublicDiagnostic::new(code, txid),
        },
        _ => CommitOutcome::Rejected {
            diagnostic: PublicDiagnostic::new(code, txid),
        },
    }
}
fn fail_journal(store: &JournalStore, journal: &mut Journal, code: ErrorCode) -> CommitOutcome {
    let persistent_mutation_exists = store.has_persisted_mutation_evidence(journal);
    let state = if code == ErrorCode::Conflict {
        JournalState::Conflict {
            mutation: journal.current_mutation(),
        }
    } else if persistent_mutation_exists
        || matches!(code, ErrorCode::RecoveryRequired | ErrorCode::IoFailure)
    {
        JournalState::RecoveryRequired
    } else {
        JournalState::Rejected { code }
    };
    if store.persist(journal, state.clone()).is_err() {
        return recovery(&journal.transaction_id);
    }
    if persistent_mutation_exists && code != ErrorCode::Conflict {
        CommitOutcome::RecoveryRequired {
            diagnostic: PublicDiagnostic::new(code, Some(journal.transaction_id.clone())),
        }
    } else if matches!(state, JournalState::Rejected { .. }) {
        CommitOutcome::Rejected {
            diagnostic: PublicDiagnostic::new(code, Some(journal.transaction_id.clone())),
        }
    } else {
        outcome_for(code, Some(journal.transaction_id.clone()))
    }
}

#[cfg(test)]
mod tests;
