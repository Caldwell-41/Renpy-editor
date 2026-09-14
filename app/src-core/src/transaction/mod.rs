//! Journalled, recoverable project-file transactions.
//!
//! This module deliberately does not call its protocol a filesystem transaction or
//! compare-and-swap. Supported platforms replace/exchange one path at a time. The old
//! target is retained and checked after each exchange, so a writer that wins the final
//! validation window is preserved and surfaced instead of being silently overwritten.

mod history;
mod identity;
mod journal;
mod path;
mod platform;

pub(crate) use path::is_link_or_reparse;
pub(crate) use platform::DirectoryAnchor;

pub use history::{HistoryEntry, HistoryMutation, HistoryStack};
use identity::identity_for_file;
pub use identity::FileIdentity;
use journal::{Journal, JournalMutation, JournalState, JournalStore};
use path::resolve_target;
pub use path::RelativePath;
use platform::{exchange_preserving_target, flush_directory, PlatformCapability};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_MUTATIONS: usize = 128;
const MAX_MUTATION_BYTES: usize = 16 * 1024 * 1024;
static NEXT_ID: AtomicU64 = AtomicU64::new(1);

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
    RecoveryRequired,
    HistoryBoundary,
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
            ErrorCode::RecoveryRequired => "The file operation requires recovery.",
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
        let identity = identity::identity_for_path(&canonical)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        let anchor = platform::DirectoryAnchor::open_root(&canonical)
            .map_err(|code| PublicDiagnostic::new(code, None))?;
        let id = ProjectId(new_id("project"));
        self.projects
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?
            .insert(
                id.clone(),
                ApprovedProject {
                    root: canonical,
                    identity,
                    anchor: Arc::new(anchor),
                },
            );
        Ok(id)
    }

    pub fn snapshot(
        &self,
        project: &ProjectId,
        path: RelativePath,
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
        let mut bytes = Vec::new();
        std::io::Read::read_to_end(&mut file, &mut bytes)
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        Ok((
            bytes.clone(),
            Revision {
                sha256: sha256(&bytes),
                identity,
            },
        ))
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
        }) {
            return rejected(ErrorCode::InvalidProposal);
        }
        let txid = new_id("tx");
        let store = match JournalStore::create(&approved.anchor, &txid) {
            Ok(value) => value,
            Err(code) => return outcome_for(code, Some(txid)),
        };
        let mut journal =
            Journal::new(txid.clone(), proposal.intent, PlatformCapability::current());
        for (index, mutation) in proposal.mutations.iter().enumerate() {
            if sha256(&mutation.expected_bytes) != mutation.base.sha256 {
                return fail_journal(&store, &mut journal, ErrorCode::ExpectedBytesChanged);
            }
            let resolved = match resolve_target(&approved.anchor, &mutation.path, true) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
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
            let resolved = match resolve_target(&approved.anchor, &mutation.path, true) {
                Ok(value) => value,
                Err(code) => return fail_journal(&store, &mut journal, code),
            };
            if resolved.parent_identity != journal.mutations[index].artifacts.parent_identity {
                return fail_journal(&store, &mut journal, ErrorCode::ParentIdentityChanged);
            }
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
            if exchange_preserving_target(
                &resolved.parent_anchor,
                &resolved.name,
                store.directory(),
                artifact_name(&journal.mutations[index].stage),
                artifact_name(&journal.mutations[index].backup),
            )
            .is_err()
            {
                return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
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
            match resolve_target(&approved.anchor, &mutation.path, true) {
                Ok(target)
                    if target.parent_identity
                        == journal.mutations[index].artifacts.parent_identity => {}
                _ => return fail_journal(&store, &mut journal, ErrorCode::ParentIdentityChanged),
            }

            let displaced = match store
                .open_artifact(&journal.mutations[index].backup)
                .and_then(read_revision_file)
            {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            let installed = match resolved
                .parent_anchor
                .open_file(&resolved.name)
                .and_then(read_revision_file)
            {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            if displaced != mutation.base
                || installed.sha256 != journal.mutations[index].proposed_sha256
            {
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
            let resolved = match resolve_target(&approved.anchor, &item.path, true) {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            let target_file = match resolved.parent_anchor.open_file_for_flush(&resolved.name) {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            if platform::flush_open_file(&target_file).is_err()
                || resolved.parent_anchor.flush().is_err()
            {
                return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired);
            }
            let revision = match read_revision_file(target_file) {
                Ok(value) => value,
                Err(_) => return fail_journal(&store, &mut journal, ErrorCode::RecoveryRequired),
            };
            if revision.sha256 != item.proposed_sha256 {
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
        CommitOutcome::Committed {
            transaction_id: txid,
            revisions,
        }
    }

    pub fn commit(&self, project: &ProjectId, proposal: TransactionProposal) -> CommitOutcome {
        self.commit_with_injector(project, proposal, &mut NoFault)
    }

    pub fn recover(&self, project: &ProjectId) -> RecoveryReport {
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(_) => return RecoveryReport::default(),
        };
        JournalStore::scan(&approved.anchor).unwrap_or_else(|code| RecoveryReport {
            items: vec![RecoveryItem {
                transaction_id: "recovery-scan".to_owned(),
                state: JournalState::RecoveryRequired,
                code: Some(code),
                mutations: Vec::new(),
            }],
        })
    }

    /// Completes recovery bookkeeping without choosing or deleting any content
    /// revision. Accepted and displaced bytes remain retained; only transaction-owned
    /// partial journal slot files are removed.
    pub fn finalize_recovery(
        &self,
        project: &ProjectId,
        transaction_id: &str,
    ) -> Result<(), PublicDiagnostic> {
        if !valid_internal_id(transaction_id, "tx") {
            return Err(PublicDiagnostic::new(ErrorCode::InvalidProposal, None));
        }
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

    pub fn flush(&self, project: &ProjectId) -> FlushOutcome {
        let approved = match self.approved(project) {
            Ok(value) => value,
            Err(error) => return FlushOutcome::Rejected { diagnostic: error },
        };
        let report = self.recover(project);
        if let Some(item) = report.items.iter().find(|item| {
            !matches!(
                item.state,
                JournalState::Durable | JournalState::Rejected { .. } | JournalState::Cleaned
            )
        }) {
            let code = item.code.unwrap_or(ErrorCode::RecoveryRequired);
            let diagnostic = PublicDiagnostic::new(code, Some(item.transaction_id.clone()));
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
    let identity = identity_for_file(&file).map_err(|_| ErrorCode::IoFailure)?;
    let mut bytes = Vec::new();
    std::io::Read::read_to_end(&mut file, &mut bytes).map_err(|_| ErrorCode::IoFailure)?;
    Ok(Revision {
        sha256: sha256(&bytes),
        identity,
    })
}

fn read_bytes_file(mut file: File) -> Result<Vec<u8>, ErrorCode> {
    let mut bytes = Vec::new();
    std::io::Read::read_to_end(&mut file, &mut bytes).map_err(|_| ErrorCode::IoFailure)?;
    Ok(bytes)
}

fn artifact_name(path: &Path) -> &std::ffi::OsStr {
    path.file_name().expect("validated artifact name")
}

fn write_new_synced(store: &JournalStore, name: &Path, bytes: &[u8]) -> Result<(), ErrorCode> {
    let mut file = store.directory().create_new_file(artifact_name(name))?;
    file.write_all(bytes).map_err(|_| ErrorCode::IoFailure)?;
    platform::flush_open_file(&file)
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
    let persistent_mutation_exists = journal.mutations.iter().any(|mutation| mutation.staged);
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
