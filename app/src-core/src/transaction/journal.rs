use super::{
    path::{self, ArtifactPaths, RelativePath},
    ErrorCode, MutationKind, RecoveryItem, RecoveryMutationState, RecoveryReport, Revision,
    TransactionIntent,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};

const JOURNAL_VERSION: u32 = 1;

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
    directory: PathBuf,
}

impl JournalStore {
    pub fn create(root: &Path, txid: &str) -> Result<Self, ErrorCode> {
        let metadata = root.join(".renpy-editor");
        ensure_safe_directory(&metadata)?;
        let recovery = metadata.join("recovery");
        ensure_safe_directory(&recovery)?;
        let directory = recovery.join(txid);
        fs::create_dir(&directory).map_err(|_| ErrorCode::IoFailure)?;
        super::platform::flush_directory(&recovery)?;
        Ok(Self { directory })
    }

    pub fn open(root: &Path, txid: &str) -> Result<Self, ErrorCode> {
        let directory = root.join(".renpy-editor").join("recovery").join(txid);
        let metadata = fs::symlink_metadata(&directory).map_err(|_| ErrorCode::RecoveryRequired)?;
        if !metadata.is_dir() || path::is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        Ok(Self { directory })
    }

    pub fn load(&self) -> Result<Journal, ErrorCode> {
        ["journal.0.json", "journal.1.json"]
            .iter()
            .filter_map(|name| read_valid(&self.directory.join(name)).ok())
            .max_by_key(|journal| journal.sequence)
            .ok_or(ErrorCode::RecoveryRequired)
    }

    pub fn cleanup_partial_slots(&self) -> Result<(), ErrorCode> {
        for name in ["journal.0.tmp", "journal.1.tmp"] {
            let path = self.directory.join(name);
            if path.exists() {
                fs::remove_file(path).map_err(|_| ErrorCode::RecoveryRequired)?;
            }
        }
        super::platform::flush_directory(&self.directory)
    }

    pub fn persist(&self, journal: &mut Journal, state: JournalState) -> Result<(), ErrorCode> {
        journal.sequence += 1;
        journal.state = state;
        let journal_bytes = serde_json::to_vec(journal).map_err(|_| ErrorCode::IoFailure)?;
        let envelope = Envelope {
            checksum_sha256: hex::encode(Sha256::digest(&journal_bytes)),
            journal: journal.clone(),
        };
        let bytes = serde_json::to_vec_pretty(&envelope).map_err(|_| ErrorCode::IoFailure)?;
        let slot = journal.sequence % 2;
        let temporary = self.directory.join(format!("journal.{slot}.tmp"));
        let final_path = self.directory.join(format!("journal.{slot}.json"));
        if temporary.exists() {
            fs::remove_file(&temporary).map_err(|_| ErrorCode::RecoveryRequired)?;
        }
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|_| ErrorCode::IoFailure)?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| ErrorCode::IoFailure)?;
        drop(file);
        #[cfg(windows)]
        if final_path.exists() {
            fs::remove_file(&final_path).map_err(|_| ErrorCode::RecoveryRequired)?;
        }
        fs::rename(&temporary, &final_path).map_err(|_| ErrorCode::RecoveryRequired)?;
        super::platform::flush_directory(&self.directory)
    }

    pub fn scan(root: &Path) -> Result<RecoveryReport, ErrorCode> {
        let recovery = root.join(".renpy-editor").join("recovery");
        if !recovery.exists() {
            return Ok(RecoveryReport::default());
        }
        let metadata = fs::symlink_metadata(&recovery).map_err(|_| ErrorCode::RecoveryRequired)?;
        if !metadata.is_dir() || path::is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let mut items = Vec::new();
        for entry in fs::read_dir(&recovery).map_err(|_| ErrorCode::RecoveryRequired)? {
            let entry = entry.map_err(|_| ErrorCode::RecoveryRequired)?;
            let metadata = entry.file_type().map_err(|_| ErrorCode::RecoveryRequired)?;
            if !metadata.is_dir()
                || path::is_link_or_reparse(
                    &fs::symlink_metadata(entry.path()).map_err(|_| ErrorCode::RecoveryRequired)?,
                )
            {
                continue;
            }
            let txid = entry.file_name().to_string_lossy().into_owned();
            let candidates = [
                entry.path().join("journal.0.json"),
                entry.path().join("journal.1.json"),
            ];
            let best = candidates
                .iter()
                .filter_map(|path| read_valid(path).ok())
                .max_by_key(|journal| journal.sequence);
            match best {
                Some(journal) => items.push(RecoveryItem {
                    transaction_id: journal.transaction_id.clone(),
                    code: code_for(&journal.state),
                    mutations: journal
                        .mutations
                        .iter()
                        .map(|mutation| inspect_mutation(root, mutation, &journal.state))
                        .collect(),
                    state: journal.state,
                }),
                None => items.push(RecoveryItem {
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

fn ensure_safe_directory(path: &Path) -> Result<(), ErrorCode> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.is_dir() && !path::is_link_or_reparse(&metadata) => Ok(()),
        Ok(_) => Err(ErrorCode::UnsafePath),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            fs::create_dir(path).map_err(|_| ErrorCode::IoFailure)?;
            if let Some(parent) = path.parent() {
                super::platform::flush_directory(parent)?;
            }
            Ok(())
        }
        Err(_) => Err(ErrorCode::IoFailure),
    }
}

fn read_valid(path: &Path) -> Result<Journal, ErrorCode> {
    let mut bytes = Vec::new();
    File::open(path)
        .and_then(|mut file| file.read_to_end(&mut bytes))
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
        JournalState::Durable | JournalState::Cleaned => None,
        JournalState::Conflict { .. } => Some(ErrorCode::Conflict),
        JournalState::Rejected { code } => Some(*code),
        _ => Some(ErrorCode::RecoveryRequired),
    }
}

fn inspect_mutation(
    root: &Path,
    mutation: &JournalMutation,
    state: &JournalState,
) -> RecoveryMutationState {
    let target = path::resolve_target(root, &mutation.path, true)
        .ok()
        .and_then(|resolved| super::read_revision(&resolved.path).ok());
    let accepted = safe_revision(root, &mutation.accepted);
    let stage = safe_revision(root, &mutation.stage);
    let backup = safe_revision(root, &mutation.backup);
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
    if !mutation.staged && stage.is_none() {
        RecoveryMutationState::PreparedWithoutStage
    } else {
        RecoveryMutationState::Ambiguous
    }
}

fn safe_revision(root: &Path, candidate: &Path) -> Option<Revision> {
    let parent = fs::canonicalize(candidate.parent()?).ok()?;
    if !parent.starts_with(root) {
        return None;
    }
    let metadata = fs::symlink_metadata(candidate).ok()?;
    if !metadata.is_file() || path::is_link_or_reparse(&metadata) {
        return None;
    }
    super::read_revision(candidate).ok()
}
