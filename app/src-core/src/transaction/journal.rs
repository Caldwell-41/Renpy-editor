use super::{
    path::{self, ArtifactPaths, RelativePath},
    platform::{flush_open_file, DirectoryAnchor},
    ErrorCode, MutationKind, RecoveryItem, RecoveryMutationState, RecoveryReport, Revision,
    TransactionIntent,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    ffi::OsStr,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};

const JOURNAL_VERSION: u32 = 2;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "name")]
pub enum JournalState {
    Proposed,
    Prepared,
    Staged { mutation: usize },
    CommitIntent { mutation: usize },
    Exchanged { mutation: usize },
    Verified { mutation: usize },
    Committed,
    Durable,
    Conflict { mutation: usize },
    RecoveryRequired,
    Rejected { code: ErrorCode },
    Cleaned,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalMutation {
    pub path: RelativePath,
    pub kind: MutationKind,
    pub base: Revision,
    pub proposed_sha256: String,
    /// Names relative to this transaction's anchored recovery directory. Version 2
    /// deliberately never persists absolute artifact paths.
    pub stage: PathBuf,
    pub accepted: PathBuf,
    pub backup: PathBuf,
    pub artifacts: ArtifactPaths,
    pub staged: bool,
    pub commit_intent: bool,
    pub exchanged: bool,
    pub verified: bool,
}

impl JournalMutation {
    pub fn new(
        path: RelativePath,
        kind: MutationKind,
        base: Revision,
        proposed_sha256: String,
        artifacts: ArtifactPaths,
    ) -> Self {
        Self {
            path,
            kind,
            base,
            proposed_sha256,
            stage: artifacts.stage.clone(),
            accepted: artifacts.accepted.clone(),
            backup: artifacts.backup.clone(),
            artifacts,
            staged: false,
            commit_intent: false,
            exchanged: false,
            verified: false,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Journal {
    pub journal_version: u32,
    pub transaction_id: String,
    pub sequence: u64,
    pub intent: TransactionIntent,
    pub platform_capability: super::PlatformCapability,
    pub state: JournalState,
    pub mutations: Vec<JournalMutation>,
}

impl Journal {
    pub fn new(
        transaction_id: String,
        intent: TransactionIntent,
        platform_capability: super::PlatformCapability,
    ) -> Self {
        Self {
            journal_version: JOURNAL_VERSION,
            transaction_id,
            sequence: 0,
            intent,
            platform_capability,
            state: JournalState::Proposed,
            mutations: Vec::new(),
        }
    }

    pub fn current_mutation(&self) -> usize {
        match self.state {
            JournalState::Staged { mutation }
            | JournalState::CommitIntent { mutation }
            | JournalState::Exchanged { mutation }
            | JournalState::Verified { mutation }
            | JournalState::Conflict { mutation } => mutation,
            _ => 0,
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Envelope {
    checksum_sha256: String,
    journal: Journal,
}

pub struct JournalStore {
    directory: DirectoryAnchor,
}

impl JournalStore {
    pub fn create(root: &DirectoryAnchor, txid: &str) -> Result<Self, ErrorCode> {
        let metadata = root.open_child(OsStr::new(".renpy-editor"), true)?;
        let recovery = metadata.open_child(OsStr::new("recovery"), true)?;
        let directory = recovery.open_child(OsStr::new(txid), true)?;
        recovery.flush()?;
        Ok(Self { directory })
    }

    pub fn open(root: &DirectoryAnchor, txid: &str) -> Result<Self, ErrorCode> {
        let metadata = root.open_child(OsStr::new(".renpy-editor"), false)?;
        let recovery = metadata.open_child(OsStr::new("recovery"), false)?;
        let directory = recovery.open_child(OsStr::new(txid), false)?;
        Ok(Self { directory })
    }

    pub fn directory(&self) -> &DirectoryAnchor {
        &self.directory
    }

    pub fn open_artifact(&self, name: &Path) -> Result<fs::File, ErrorCode> {
        self.directory.open_file(file_name(name)?)
    }

    pub fn load(&self) -> Result<Journal, ErrorCode> {
        ["journal.0.json", "journal.1.json"]
            .iter()
            .filter_map(|name| read_valid(&self.directory, OsStr::new(name)).ok())
            .max_by_key(|journal| journal.sequence)
            .ok_or(ErrorCode::RecoveryRequired)
    }

    pub fn cleanup_partial_slots(&self) -> Result<(), ErrorCode> {
        for name in ["journal.0.tmp", "journal.1.tmp"] {
            self.directory.remove_file_if_exists(OsStr::new(name))?;
        }
        self.directory.flush()
    }

    pub fn prepared_is_safe_to_abandon(&self, journal: &Journal) -> bool {
        matches!(journal.state, JournalState::Prepared)
            && journal.mutations.iter().all(|mutation| {
                !mutation.staged
                    && !mutation.commit_intent
                    && !mutation.exchanged
                    && !mutation.verified
                    && [&mutation.stage, &mutation.accepted, &mutation.backup]
                        .iter()
                        .all(|name| {
                            file_name(name).and_then(|name| self.directory.entry_absent(name))
                                == Ok(true)
                        })
            })
    }

    pub fn persist(&self, journal: &mut Journal, state: JournalState) -> Result<(), ErrorCode> {
        self.directory.validate_chain()?;
        journal.sequence += 1;
        journal.state = state;
        let journal_bytes = serde_json::to_vec(journal).map_err(|_| ErrorCode::IoFailure)?;
        let envelope = Envelope {
            checksum_sha256: hex::encode(Sha256::digest(&journal_bytes)),
            journal: journal.clone(),
        };
        let bytes = serde_json::to_vec_pretty(&envelope).map_err(|_| ErrorCode::IoFailure)?;
        let slot = journal.sequence % 2;
        let temporary = format!("journal.{slot}.tmp");
        let final_name = format!("journal.{slot}.json");
        self.directory
            .remove_file_if_exists(OsStr::new(&temporary))?;
        let mut file = self.directory.create_new_file(OsStr::new(&temporary))?;
        file.write_all(&bytes).map_err(|_| ErrorCode::IoFailure)?;
        flush_open_file(&file)?;
        drop(file);
        #[cfg(windows)]
        self.directory
            .remove_file_if_exists(OsStr::new(&final_name))?;
        self.directory
            .rename_within(OsStr::new(&temporary), OsStr::new(&final_name))?;
        self.directory.flush()
    }

    pub fn scan(root: &DirectoryAnchor) -> Result<RecoveryReport, ErrorCode> {
        let metadata = match root.open_child(OsStr::new(".renpy-editor"), false) {
            Ok(value) => value,
            Err(_) if root.entry_absent(OsStr::new(".renpy-editor")) == Ok(true) => {
                return Ok(RecoveryReport::default())
            }
            Err(code) => return Err(code),
        };
        let recovery = match metadata.open_child(OsStr::new("recovery"), false) {
            Ok(value) => value,
            Err(_) if metadata.entry_absent(OsStr::new("recovery")) == Ok(true) => {
                return Ok(RecoveryReport::default())
            }
            Err(code) => return Err(code),
        };
        let mut items = Vec::new();
        for entry in fs::read_dir(recovery.path()).map_err(|_| ErrorCode::RecoveryRequired)? {
            let entry = entry.map_err(|_| ErrorCode::RecoveryRequired)?;
            let txid = entry.file_name().to_string_lossy().into_owned();
            let directory = match recovery.open_child(&entry.file_name(), false) {
                Ok(value) => value,
                Err(_) => {
                    items.push(RecoveryItem {
                        transaction_id: txid,
                        code: Some(ErrorCode::RecoveryRequired),
                        state: JournalState::RecoveryRequired,
                        mutations: Vec::new(),
                    });
                    continue;
                }
            };
            let store = Self { directory };
            match store.load() {
                Ok(journal) => items.push(RecoveryItem {
                    transaction_id: journal.transaction_id.clone(),
                    code: code_for(&journal.state),
                    mutations: journal
                        .mutations
                        .iter()
                        .map(|mutation| inspect_mutation(root, &store, mutation, &journal.state))
                        .collect(),
                    state: journal.state,
                }),
                Err(_) => items.push(RecoveryItem {
                    transaction_id: txid,
                    code: Some(ErrorCode::RecoveryRequired),
                    state: JournalState::RecoveryRequired,
                    mutations: Vec::new(),
                }),
            }
        }
        items.sort_by(|a, b| a.transaction_id.cmp(&b.transaction_id));
        Ok(RecoveryReport { items })
    }
}

fn file_name(path: &Path) -> Result<&OsStr, ErrorCode> {
    if path.components().count() != 1 {
        return Err(ErrorCode::UnsafePath);
    }
    path.file_name().ok_or(ErrorCode::UnsafePath)
}

fn read_valid(directory: &DirectoryAnchor, name: &OsStr) -> Result<Journal, ErrorCode> {
    let mut bytes = Vec::new();
    directory
        .open_file(name)?
        .read_to_end(&mut bytes)
        .map_err(|_| ErrorCode::RecoveryRequired)?;
    let envelope: Envelope =
        serde_json::from_slice(&bytes).map_err(|_| ErrorCode::RecoveryRequired)?;
    let journal_bytes =
        serde_json::to_vec(&envelope.journal).map_err(|_| ErrorCode::RecoveryRequired)?;
    if envelope.journal.journal_version != JOURNAL_VERSION
        || envelope.checksum_sha256 != hex::encode(Sha256::digest(&journal_bytes))
    {
        return Err(ErrorCode::RecoveryRequired);
    }
    Ok(envelope.journal)
}

fn code_for(state: &JournalState) -> Option<ErrorCode> {
    match state {
        JournalState::Durable | JournalState::Rejected { .. } | JournalState::Cleaned => None,
        JournalState::Conflict { .. } => Some(ErrorCode::Conflict),
        _ => Some(ErrorCode::RecoveryRequired),
    }
}

fn inspect_mutation(
    root: &DirectoryAnchor,
    store: &JournalStore,
    mutation: &JournalMutation,
    state: &JournalState,
) -> RecoveryMutationState {
    let target = path::resolve_target(root, &mutation.path, true)
        .ok()
        .and_then(|resolved| {
            super::read_revision_file(resolved.parent_anchor.open_file(&resolved.name).ok()?).ok()
        });
    let accepted = artifact_revision(store, &mutation.accepted);
    let stage = artifact_revision(store, &mutation.stage);
    let backup = artifact_revision(store, &mutation.backup);
    if matches!(state, JournalState::Durable | JournalState::Cleaned)
        && target
            .as_ref()
            .is_some_and(|value| value.sha256 == mutation.proposed_sha256)
    {
        return RecoveryMutationState::Durable;
    }
    if target
        .as_ref()
        .is_some_and(|value| value.sha256 == mutation.proposed_sha256)
    {
        return if backup.as_ref() == Some(&mutation.base) {
            RecoveryMutationState::ExchangeCompleteExpected
        } else if backup.is_some() {
            RecoveryMutationState::ExchangeCompleteConflict
        } else {
            RecoveryMutationState::Ambiguous
        };
    }
    if target.as_ref() == Some(&mutation.base)
        && stage
            .as_ref()
            .is_some_and(|value| value.sha256 == mutation.proposed_sha256)
    {
        return RecoveryMutationState::StagedWithBaseIntact;
    }
    if accepted
        .as_ref()
        .is_some_and(|value| value.sha256 == mutation.proposed_sha256)
        && target.is_some()
    {
        return RecoveryMutationState::ExternalRevisionWithAcceptedCopy;
    }
    if !mutation.staged && stage.is_none() && accepted.is_none() && backup.is_none() {
        RecoveryMutationState::PreparedWithoutStage
    } else {
        RecoveryMutationState::Ambiguous
    }
}

fn artifact_revision(store: &JournalStore, name: &Path) -> Option<Revision> {
    super::read_revision_file(store.open_artifact(name).ok()?).ok()
}
