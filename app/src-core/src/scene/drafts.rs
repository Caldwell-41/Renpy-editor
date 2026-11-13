//! Story Save: build every pending beat and condition draft on one cumulative
//! candidate, then commit once. Single-draft Commit uses the same builder with one
//! command.
use super::*;
use std::cell::RefCell;

/// The most beat drafts one Story Save accepts. The renderer's response check
/// bounds `actionIndex` to the same number.
pub const MAX_SAVE_DRAFTS: usize = 1024;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SceneSaveDraftsRequest {
    pub expected_project_revision: String,
    pub expected_source_map_revision: String,
    #[serde(default)]
    pub expected_authoring_revision: Option<String>,
    pub commands: Vec<SceneCommand>,
    /// The beat draft each command saves, in the same order. Their draft-step
    /// entries leave the project history when the Save succeeds (ADR 0025).
    #[serde(default)]
    pub drafts: Vec<String>,
}

/// Candidate bytes and revision by path, and whether the build created the file.
type CandidateFiles = HashMap<String, (Vec<u8>, Revision, bool)>;

thread_local! {
    // Files the commands built so far have changed, by path. Builder reads on
    // this thread see them, so each command builds on the ones before it.
    static CANDIDATE: RefCell<Option<(ProjectId, CandidateFiles)>> = const { RefCell::new(None) };
}

/// Holds the candidate for one build and drops it on every exit path.
struct CandidateScope;

impl CandidateScope {
    fn open(project: &ProjectId) -> Self {
        CANDIDATE.with(|candidate| {
            let mut candidate = candidate.borrow_mut();
            // One build at a time: a nested build would replace the outer candidate.
            assert!(
                candidate.is_none(),
                "a Story Save candidate is already open"
            );
            *candidate = Some((project.clone(), HashMap::new()));
        });
        Self
    }

    fn record(project: &ProjectId, mutation: &FileMutation) {
        CANDIDATE.with(|candidate| {
            if let Some((owner, files)) = candidate.borrow_mut().as_mut() {
                if owner == project {
                    let path = mutation.path.as_str().to_owned();
                    let created = mutation.kind == MutationKind::CreateNew
                        || files.get(&path).is_some_and(|(_, _, created)| *created);
                    let revision = Revision {
                        sha256: sha256(&mutation.proposed),
                        identity: mutation.base.identity.clone(),
                    };
                    files.insert(path, (mutation.proposed.clone(), revision, created));
                }
            }
        });
    }
}

impl Drop for CandidateScope {
    fn drop(&mut self) {
        CANDIDATE.with(|candidate| *candidate.borrow_mut() = None);
    }
}

/// The candidate bytes for `path` while a build is running.
pub(super) fn candidate_file(project: &ProjectId, path: &str) -> Option<(Vec<u8>, Revision)> {
    CANDIDATE.with(|candidate| {
        candidate
            .borrow()
            .as_ref()
            .filter(|(owner, _)| owner == project)
            .and_then(|(_, files)| files.get(path))
            .map(|(bytes, revision, _)| (bytes.clone(), revision.clone()))
    })
}

/// Paths the running build created, which an inventory of the disk cannot list.
pub(super) fn candidate_created(project: &ProjectId, directory: &str) -> Vec<String> {
    CANDIDATE.with(|candidate| {
        candidate
            .borrow()
            .as_ref()
            .filter(|(owner, _)| owner == project)
            .map(|(_, files)| {
                files
                    .iter()
                    .filter(|(path, (_, _, created))| {
                        *created && path.starts_with(&format!("{directory}/"))
                    })
                    .map(|(path, _)| path.clone())
                    .collect()
            })
            .unwrap_or_default()
    })
}

/// Draft ids name renderer drafts. Each is short, not blank and listed once.
pub(super) fn check_draft_ids(drafts: &[String], max: usize) -> Result<(), SceneError> {
    let mut seen = HashSet::new();
    if drafts.len() > max
        || !drafts
            .iter()
            .all(|draft| crate::history::draft_text(draft) && seen.insert(draft.as_str()))
    {
        return Err(SceneError::InvalidPayload);
    }
    Ok(())
}

/// The commands a Story draft saves: a beat's payload, a condition's test, a new
/// condition, and an added or removed condition branch.
pub(super) fn is_draft_command(command: &SceneCommand) -> bool {
    matches!(
        command,
        SceneCommand::InsertBodyBeat { .. }
            | SceneCommand::UpdateBodyBeat { .. }
            | SceneCommand::InsertCondition { .. }
            | SceneCommand::UpdateConditionBranch { .. }
            | SceneCommand::AddConditionBranch { .. }
            | SceneCommand::RemoveConditionBranch { .. }
    )
}

impl SceneError {
    pub(super) fn at(index: usize) -> impl Fn(SceneError) -> SceneError {
        move |cause| SceneError::Indexed {
            index,
            cause: Box::new(cause),
        }
    }

    /// Removes the command index that a set of one adds.
    pub(super) fn unindexed(self) -> SceneError {
        match self {
            SceneError::Indexed { cause, .. } => *cause,
            other => other,
        }
    }
}

impl AuthoringService {
    pub fn scene_save_drafts(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SceneSaveDraftsRequest,
    ) -> Result<SceneWorkspace, SceneError> {
        if request.commands.is_empty()
            || request.commands.len() > MAX_SAVE_DRAFTS
            || !request.commands.iter().all(is_draft_command)
            || (!request.drafts.is_empty() && request.drafts.len() != request.commands.len())
        {
            return Err(SceneError::InvalidPayload);
        }
        check_draft_ids(&request.drafts, MAX_SAVE_DRAFTS)?;
        let loaded = self.prepare_scene_commands(
            project,
            project_id,
            &request.expected_project_revision,
            &request.expected_source_map_revision,
            request.expected_authoring_revision.as_deref(),
            &request.commands,
        )?;
        // One entry per saved draft. The renderer sends the most recently edited
        // draft last, so it ends on top.
        let labels: Vec<_> = request
            .commands
            .iter()
            .map(|command| history_label(&loaded.project, command))
            .collect();
        let (proposal, built) = self.build_drafts(project, project_id, loaded, request.commands)?;
        // A saved draft whose bytes did not change adds no entry; its draft still ends.
        let parts = labels
            .into_iter()
            .zip(built)
            .filter(|(_, mutations)| mutations.iter().any(changes_bytes))
            .map(|(label, mutations)| HistoryPart { label, mutations })
            .collect();
        self.commit_or_verify(project, proposal, parts, &request.drafts)?;
        self.scene_workspace(project, project_id)
    }

    /// Builds each draft command on the candidate the commands before it
    /// left, and merges them into one proposal. It also returns each command's
    /// own mutations, in order. A refused command returns its index and nothing
    /// is written.
    pub(super) fn build_drafts(
        &self,
        project: &ProjectId,
        project_id: &str,
        loaded: Loaded,
        commands: Vec<SceneCommand>,
    ) -> Result<(TransactionProposal, Vec<Vec<FileMutation>>), SceneError> {
        let _scope = CandidateScope::open(project);
        let mut merged: Vec<FileMutation> = Vec::new();
        let mut built = Vec::with_capacity(commands.len());
        // The source revision each scene was checked at, before any command changed it.
        let mut checked = HashMap::<String, String>::new();
        let mut first = Some(loaded);
        for (index, mut command) in commands.into_iter().enumerate() {
            let at = SceneError::at(index);
            let current = match first.take() {
                Some(loaded) => loaded,
                None => self.load(project, project_id).map_err(&at)?,
            };
            let (scene_id, expected) = match &mut command {
                SceneCommand::InsertBodyBeat {
                    scene_id,
                    expected_source_revision,
                    ..
                }
                | SceneCommand::UpdateBodyBeat {
                    scene_id,
                    expected_source_revision,
                    ..
                }
                | SceneCommand::InsertCondition {
                    scene_id,
                    expected_source_revision,
                    ..
                }
                | SceneCommand::UpdateConditionBranch {
                    scene_id,
                    expected_source_revision,
                    ..
                }
                | SceneCommand::AddConditionBranch {
                    scene_id,
                    expected_source_revision,
                    ..
                }
                | SceneCommand::RemoveConditionBranch {
                    scene_id,
                    expected_source_revision,
                    ..
                } => (scene_id.clone(), expected_source_revision),
                _ => return Err(at(SceneError::InvalidPayload)),
            };
            // All drafts come from one Story snapshot, so a scene's commands share
            // one revision. Later commands build on the candidate's revision.
            if let Some(original) = checked.get(&scene_id) {
                if original != expected {
                    return Err(at(SceneError::SourceConflict));
                }
                *expected = current
                    .source_map
                    .scene_mappings
                    .iter()
                    .find(|mapping| mapping.scene_id == scene_id)
                    .ok_or_else(|| at(SceneError::InvalidMetadata))?
                    .source_revision
                    .clone();
            } else {
                checked.insert(scene_id, expected.clone());
            }
            let proposal = self.build_command(project, current, command).map_err(&at)?;
            for mutation in &proposal.mutations {
                CandidateScope::record(project, mutation);
                match merged.iter_mut().find(|item| item.path == mutation.path) {
                    Some(item) => {
                        if item.proposed != mutation.expected_bytes {
                            return Err(at(SceneError::SourceConflict));
                        }
                        item.proposed = mutation.proposed.clone();
                    }
                    None => merged.push(mutation.clone()),
                }
            }
            built.push(proposal.mutations);
        }
        Ok((
            TransactionProposal {
                mutations: merged,
                intent: TransactionIntent::Edit,
            },
            built,
        ))
    }
}
