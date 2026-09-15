//! Phase 1E Scene authoring over exact source bytes and the shared transaction layer.
//!
//! This is intentionally a narrow recognizer for Loomlight-created Scene files. It
//! never rewrites a file from a parallel document: every operation verifies the
//! persisted mapping and patches only exact byte ranges or creates/deletes an owned
//! Scene file through the journalled transaction service.

use crate::{
    authoring::{AssetKind, AuthoringMetadata, AuthoringService, VariableType},
    metadata::{
        BeatSourceMapping, ChapterMetadata, ProjectMetadata, SceneMetadata, SceneSourceMapping,
        Selection, SourceMapMetadata, PROJECT_SCHEMA_VERSION, SOURCE_MAP_SCHEMA_VERSION,
    },
    transaction::{
        CommitOutcome, ErrorCode, FileMutation, HistoryEntry, HistoryMutation, MutationKind,
        ProjectId, RecoveryReport, RecoveryResolution, RelativePath, Revision, TransactionIntent,
        TransactionProposal,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet, VecDeque};

const PROJECT_PATH: &str = ".renpy-editor/project.json";
const SOURCE_MAP_PATH: &str = ".renpy-editor/source-map.json";
const MAX_BEATS_PER_SCENE: usize = 4096;
const MAX_CHAPTERS: usize = 256;
const MAX_SCENES: usize = 4096;
const MAX_TEXT_BYTES: usize = 10_000;
type ForcedBeatId = (String, String, String);

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PlacementRef {
    Left,
    Centre,
    Right,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TransitionRef {
    None,
    Dissolve,
    Fade,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum BeatPayload {
    Background {
        asset_id: String,
        transition: TransitionRef,
    },
    ShowCharacter {
        character_id: String,
        appearance_id: String,
        placement: PlacementRef,
        transition: TransitionRef,
    },
    HideCharacter {
        character_id: String,
        transition: TransitionRef,
    },
    ChangeAppearance {
        character_id: String,
        appearance_id: String,
        transition: TransitionRef,
    },
    Placement {
        character_id: String,
        placement: PlacementRef,
    },
    Dialogue {
        character_id: String,
        text: String,
    },
    Narration {
        text: String,
    },
    PlayMusic {
        asset_id: String,
    },
    StopMusic,
    PlaySfx {
        asset_id: String,
    },
    Transition {
        transition: TransitionRef,
    },
    SetVariable {
        variable_id: String,
        value: Value,
    },
    Choice {
        options: Vec<ChoiceOption>,
    },
    Jump {
        scene_id: String,
    },
    Return,
    CustomCode {
        source: String,
        reason: String,
    },
}

impl BeatPayload {
    fn kind(&self) -> &'static str {
        match self {
            Self::Background { .. } => "background",
            Self::ShowCharacter { .. } => "showCharacter",
            Self::HideCharacter { .. } => "hideCharacter",
            Self::ChangeAppearance { .. } => "changeAppearance",
            Self::Placement { .. } => "placement",
            Self::Dialogue { .. } => "dialogue",
            Self::Narration { .. } => "narration",
            Self::PlayMusic { .. } => "playMusic",
            Self::StopMusic => "stopMusic",
            Self::PlaySfx { .. } => "playSfx",
            Self::Transition { .. } => "transition",
            Self::SetVariable { .. } => "setVariable",
            Self::Choice { .. } => "choice",
            Self::Jump { .. } => "jump",
            Self::Return => "return",
            Self::CustomCode { .. } => "customCode",
        }
    }
}

fn is_terminal_payload(payload: &BeatPayload) -> bool {
    matches!(
        payload,
        BeatPayload::Choice { .. } | BeatPayload::Jump { .. } | BeatPayload::Return
    )
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChoiceOption {
    pub text: String,
    pub destination_scene_id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneBeat {
    pub id: String,
    pub byte_start: u64,
    pub byte_end: u64,
    pub protected: bool,
    pub payload: BeatPayload,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneDocument {
    pub id: String,
    pub chapter_id: String,
    pub display_name: String,
    pub technical_label: String,
    pub source_path: String,
    pub source_revision: String,
    pub source_conflict: bool,
    pub partial: bool,
    pub beats: Vec<SceneBeat>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneWorkspace {
    pub project_revision: String,
    pub source_map_revision: String,
    pub entry_scene_id: String,
    pub last_open: Selection,
    pub chapters: Vec<ChapterMetadata>,
    pub scenes: Vec<SceneDocument>,
    pub authoring: AuthoringMetadata,
    pub can_undo: bool,
    pub can_redo: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MoveDirection {
    Up,
    Down,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SceneCommandRequest {
    pub expected_project_revision: String,
    pub expected_source_map_revision: String,
    pub command: SceneCommand,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecoveryResolveRequest {
    pub transaction_id: String,
    pub resolution: RecoveryResolution,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum SceneCommand {
    CreateChapter {
        display_name: String,
    },
    RenameChapter {
        chapter_id: String,
        display_name: String,
    },
    MoveChapter {
        chapter_id: String,
        direction: MoveDirection,
    },
    DeleteChapter {
        chapter_id: String,
    },
    CreateScene {
        chapter_id: String,
        display_name: String,
    },
    CreateSceneFromChoice {
        scene_id: String,
        expected_source_revision: String,
        choice_beat_id: String,
        option_text: String,
        chapter_id: String,
        display_name: String,
    },
    RenameScene {
        scene_id: String,
        display_name: String,
    },
    MoveScene {
        scene_id: String,
        chapter_id: String,
        direction: Option<MoveDirection>,
        expected_source_revision: String,
    },
    DeleteScene {
        scene_id: String,
        expected_source_revision: String,
    },
    SelectScene {
        scene_id: String,
    },
    InsertBeat {
        scene_id: String,
        expected_source_revision: String,
        before_beat_id: Option<String>,
        beat: BeatPayload,
    },
    UpdateBeat {
        scene_id: String,
        expected_source_revision: String,
        beat_id: String,
        beat: BeatPayload,
    },
    ContinueDialogue {
        scene_id: String,
        expected_source_revision: String,
        beat_id: String,
        character_id: String,
        text: String,
    },
    RemoveBeat {
        scene_id: String,
        expected_source_revision: String,
        beat_id: String,
    },
    MoveBeat {
        scene_id: String,
        expected_source_revision: String,
        beat_id: String,
        direction: MoveDirection,
    },
    Undo,
    Redo,
}

#[derive(Debug, Eq, PartialEq)]
pub enum SceneError {
    InvalidPayload,
    InvalidMetadata,
    UnsupportedSource,
    SourceConflict,
    UnknownEntity,
    ReferenceBlocked,
    InvariantBlocked,
    OpaqueBoundary,
    HistoryBoundary,
    RecoveryRequired,
    Conflict,
    Io,
}

#[derive(Clone)]
struct ParsedBeat {
    start: usize,
    end: usize,
    payload: BeatPayload,
}

struct Loaded {
    project: ProjectMetadata,
    project_bytes: Vec<u8>,
    project_revision: Revision,
    source_map: SourceMapMetadata,
    source_map_bytes: Vec<u8>,
    source_map_revision: Revision,
    authoring: AuthoringMetadata,
}

impl AuthoringService {
    /// Transactionally evolves a valid Phase 1 project before the session is exposed.
    pub(crate) fn ensure_phase_1e_metadata(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<(), SceneError> {
        let (project_bytes, project_revision) = self.scene_snapshot(project, PROJECT_PATH)?;
        let mut metadata = ProjectMetadata::read_bytes(&project_bytes, None)
            .map_err(|_| SceneError::InvalidMetadata)?;
        if metadata.project_id != project_id {
            return Err(SceneError::InvalidMetadata);
        }
        let (map_bytes, map_revision) = self.scene_snapshot(project, SOURCE_MAP_PATH)?;
        let mut source_map = SourceMapMetadata::read_bytes(&map_bytes, project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        let needs_migration = metadata.schema_version != PROJECT_SCHEMA_VERSION
            || source_map.schema_version != SOURCE_MAP_SCHEMA_VERSION
            || source_map.scene_mappings.len() != metadata.scenes.len()
            || metadata.entry_scene_id.is_none()
            || !metadata
                .capabilities
                .iter()
                .any(|value| value == "scene-authoring-v1");
        if !needs_migration {
            self.verify_current_mappings(project, &metadata, &source_map)?;
            return Ok(());
        }

        metadata.schema_version = PROJECT_SCHEMA_VERSION;
        metadata.entry_scene_id = Some(
            metadata
                .entry_scene_id
                .clone()
                .unwrap_or_else(|| metadata.scenes[0].id.clone()),
        );
        if !metadata
            .capabilities
            .iter()
            .any(|value| value == "scene-authoring-v1")
        {
            metadata.capabilities.push("scene-authoring-v1".into());
        }
        metadata
            .validate(None)
            .map_err(|_| SceneError::InvalidMetadata)?;
        source_map.schema_version = SOURCE_MAP_SCHEMA_VERSION;
        source_map.scene_mappings.clear();
        let authoring = self
            .list(project, project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        for scene in &metadata.scenes {
            if !source_map
                .sources
                .iter()
                .any(|path| path == &scene.source_path)
            {
                source_map.sources.push(scene.source_path.clone());
            }
            let (bytes, revision) = self.scene_snapshot(project, &scene.source_path)?;
            let (mapping, _) = build_mapping(
                scene,
                &bytes,
                &revision.sha256,
                None,
                &[],
                Some((&metadata, &authoring)),
            )?;
            source_map.scene_mappings.push(mapping);
        }
        source_map
            .validate(project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        let proposed_project = json_bytes(&metadata)?;
        let proposed_map = json_bytes(&source_map)?;
        match self.transactions.commit(
            project,
            TransactionProposal {
                mutations: vec![
                    replace_mutation(
                        PROJECT_PATH,
                        project_bytes,
                        project_revision,
                        proposed_project,
                    )?,
                    replace_mutation(SOURCE_MAP_PATH, map_bytes, map_revision, proposed_map)?,
                ],
                intent: TransactionIntent::Edit,
            },
        ) {
            CommitOutcome::Committed { .. } => Ok(()),
            outcome => Err(outcome_error(outcome)),
        }
    }

    pub fn scene_workspace(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<SceneWorkspace, SceneError> {
        let loaded = self.load(project, project_id)?;
        let mut scenes = Vec::with_capacity(loaded.project.scenes.len());
        for scene in &loaded.project.scenes {
            let stored = loaded
                .source_map
                .scene_mappings
                .iter()
                .find(|mapping| mapping.scene_id == scene.id)
                .ok_or(SceneError::InvalidMetadata)?;
            let (bytes, revision) = self.scene_snapshot(project, &scene.source_path)?;
            let conflict = revision.sha256 != stored.source_revision;
            let (_, beats) = build_mapping(
                scene,
                &bytes,
                &revision.sha256,
                Some(stored),
                &[],
                Some((&loaded.project, &loaded.authoring)),
            )?;
            scenes.push(SceneDocument {
                id: scene.id.clone(),
                chapter_id: scene.chapter_id.clone(),
                display_name: scene.display_name.clone(),
                technical_label: scene.technical_label.clone(),
                source_path: scene.source_path.clone(),
                source_revision: revision.sha256,
                source_conflict: conflict,
                partial: beats.iter().any(|beat| beat.protected),
                beats,
            });
        }
        let history = self.scene_history.lock().map_err(|_| SceneError::Io)?;
        let stack = history.get(project);
        Ok(SceneWorkspace {
            project_revision: loaded.project_revision.sha256,
            source_map_revision: loaded.source_map_revision.sha256,
            entry_scene_id: loaded
                .project
                .entry_scene_id
                .clone()
                .ok_or(SceneError::InvalidMetadata)?,
            last_open: loaded.project.last_open,
            chapters: loaded.project.chapters,
            scenes,
            authoring: loaded.authoring,
            can_undo: stack.is_some_and(|value| value.can_undo()),
            can_redo: stack.is_some_and(|value| value.can_redo()),
        })
    }

    pub fn scene_apply(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: SceneCommandRequest,
    ) -> Result<SceneWorkspace, SceneError> {
        match request.command.clone() {
            SceneCommand::Undo => self.undo_scene(project)?,
            SceneCommand::Redo => self.redo_scene(project)?,
            command => {
                let loaded = self.load(project, project_id)?;
                if loaded.project_revision.sha256 != request.expected_project_revision
                    || loaded.source_map_revision.sha256 != request.expected_source_map_revision
                {
                    return Err(SceneError::SourceConflict);
                }
                let proposal = self.build_command(project, loaded, command)?;
                self.commit_history(project, proposal)?;
            }
        }
        self.scene_workspace(project, project_id)
    }

    pub fn scene_recovery(&self, project: &ProjectId) -> RecoveryReport {
        self.transactions.recover(project)
    }

    pub fn scene_resolve_recovery(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: RecoveryResolveRequest,
    ) -> Result<RecoveryReport, SceneError> {
        self.transactions
            .resolve_recovery(project, &request.transaction_id, request.resolution)
            .map_err(diagnostic_error)?;
        if self
            .transactions
            .recovery_blocker(project)
            .map_err(diagnostic_error)?
            .is_none()
        {
            self.ensure_phase_1e_metadata(project, project_id)?;
        }
        Ok(self.transactions.recover(project))
    }

    fn build_command(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        command: SceneCommand,
    ) -> Result<TransactionProposal, SceneError> {
        match command {
            SceneCommand::CreateChapter { display_name } => {
                validate_display(&display_name)?;
                if loaded.project.chapters.len() >= MAX_CHAPTERS {
                    return Err(SceneError::InvariantBlocked);
                }
                let id = uuid::Uuid::new_v4().to_string();
                loaded.project.chapters.push(ChapterMetadata {
                    id: id.clone(),
                    display_name,
                    directory: next_chapter_directory(&loaded.project),
                    extra: Map::new(),
                });
                metadata_only_proposal(loaded)
            }
            SceneCommand::RenameChapter {
                chapter_id,
                display_name,
            } => {
                validate_display(&display_name)?;
                loaded
                    .project
                    .chapters
                    .iter_mut()
                    .find(|item| item.id == chapter_id)
                    .ok_or(SceneError::UnknownEntity)?
                    .display_name = display_name;
                metadata_only_proposal(loaded)
            }
            SceneCommand::MoveChapter {
                chapter_id,
                direction,
            } => {
                move_item(
                    &mut loaded.project.chapters,
                    &chapter_id,
                    direction,
                    |item| &item.id,
                )?;
                metadata_only_proposal(loaded)
            }
            SceneCommand::DeleteChapter { chapter_id } => {
                if loaded.project.chapters.len() == 1
                    || loaded
                        .project
                        .scenes
                        .iter()
                        .any(|scene| scene.chapter_id == chapter_id)
                {
                    return Err(SceneError::InvariantBlocked);
                }
                let before = loaded.project.chapters.len();
                loaded.project.chapters.retain(|item| item.id != chapter_id);
                if loaded.project.chapters.len() == before {
                    return Err(SceneError::UnknownEntity);
                }
                metadata_only_proposal(loaded)
            }
            SceneCommand::CreateScene {
                chapter_id,
                display_name,
            } => self.create_scene_proposal(project, loaded, &chapter_id, display_name),
            SceneCommand::CreateSceneFromChoice {
                scene_id,
                expected_source_revision,
                choice_beat_id,
                option_text,
                chapter_id,
                display_name,
            } => self.create_scene_from_choice_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                &choice_beat_id,
                option_text,
                &chapter_id,
                display_name,
            ),
            SceneCommand::RenameScene {
                scene_id,
                display_name,
            } => {
                validate_display(&display_name)?;
                loaded
                    .project
                    .scenes
                    .iter_mut()
                    .find(|item| item.id == scene_id)
                    .ok_or(SceneError::UnknownEntity)?
                    .display_name = display_name;
                metadata_only_proposal(loaded)
            }
            SceneCommand::SelectScene { scene_id } => {
                let scene = loaded
                    .project
                    .scenes
                    .iter()
                    .find(|item| item.id == scene_id)
                    .ok_or(SceneError::UnknownEntity)?;
                loaded.project.last_open = Selection {
                    chapter_id: scene.chapter_id.clone(),
                    scene_id: scene.id.clone(),
                };
                metadata_only_proposal(loaded)
            }
            SceneCommand::MoveScene {
                scene_id,
                chapter_id,
                direction,
                expected_source_revision,
            } => self.move_scene_proposal(
                project,
                loaded,
                &scene_id,
                &chapter_id,
                direction,
                &expected_source_revision,
            ),
            SceneCommand::DeleteScene {
                scene_id,
                expected_source_revision,
            } => self.delete_scene_proposal(project, loaded, &scene_id, &expected_source_revision),
            SceneCommand::InsertBeat {
                scene_id,
                expected_source_revision,
                before_beat_id,
                beat,
            } => self.beat_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                BeatEdit::Insert {
                    before: before_beat_id,
                    payload: beat,
                },
            ),
            SceneCommand::UpdateBeat {
                scene_id,
                expected_source_revision,
                beat_id,
                beat,
            } => self.beat_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                BeatEdit::Update {
                    id: beat_id,
                    payload: beat,
                },
            ),
            SceneCommand::ContinueDialogue {
                scene_id,
                expected_source_revision,
                beat_id,
                character_id,
                text,
            } => self.beat_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                BeatEdit::ContinueDialogue {
                    id: beat_id,
                    character_id,
                    text,
                },
            ),
            SceneCommand::RemoveBeat {
                scene_id,
                expected_source_revision,
                beat_id,
            } => self.beat_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                BeatEdit::Remove { id: beat_id },
            ),
            SceneCommand::MoveBeat {
                scene_id,
                expected_source_revision,
                beat_id,
                direction,
            } => self.beat_proposal(
                project,
                loaded,
                &scene_id,
                &expected_source_revision,
                BeatEdit::Move {
                    id: beat_id,
                    direction,
                },
            ),
            SceneCommand::Undo | SceneCommand::Redo => unreachable!(),
        }
    }

    fn create_scene_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        chapter_id: &str,
        display_name: String,
    ) -> Result<TransactionProposal, SceneError> {
        validate_display(&display_name)?;
        if loaded.project.scenes.len() >= MAX_SCENES {
            return Err(SceneError::InvariantBlocked);
        }
        let chapter = loaded
            .project
            .chapters
            .iter()
            .find(|item| item.id == chapter_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        self.transactions
            .ensure_directory(project, &chapter.directory)
            .map_err(|_| SceneError::Io)?;
        let id = uuid::Uuid::new_v4().to_string();
        let technical_label = format!("loomlight_scene_{}", id.replace('-', ""));
        let path = next_scene_path(&loaded.project, &chapter.directory);
        let bytes = format!("label {technical_label}:\n    return\n").into_bytes();
        let synthetic_revision = sha256(&bytes);
        let scene = SceneMetadata {
            id: id.clone(),
            chapter_id: chapter_id.into(),
            display_name,
            technical_label,
            source_path: path.clone(),
            extra: Map::new(),
        };
        let (mapping, _) = build_mapping(
            &scene,
            &bytes,
            &synthetic_revision,
            None,
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )?;
        loaded.project.scenes.push(scene);
        loaded.project.last_open = Selection {
            chapter_id: chapter_id.into(),
            scene_id: id,
        };
        loaded.source_map.sources.push(path.clone());
        loaded.source_map.scene_mappings.push(mapping);
        let project_bytes = json_bytes(&loaded.project)?;
        let map_bytes = json_bytes(&loaded.source_map)?;
        Ok(TransactionProposal {
            mutations: vec![
                create_mutation(&path, bytes)?,
                replace_mutation(
                    PROJECT_PATH,
                    loaded.project_bytes,
                    loaded.project_revision,
                    project_bytes,
                )?,
                replace_mutation(
                    SOURCE_MAP_PATH,
                    loaded.source_map_bytes,
                    loaded.source_map_revision,
                    map_bytes,
                )?,
            ],
            intent: TransactionIntent::Edit,
        })
    }

    #[allow(clippy::too_many_arguments)]
    fn create_scene_from_choice_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        source_scene_id: &str,
        expected_source_revision: &str,
        choice_beat_id: &str,
        option_text: String,
        chapter_id: &str,
        display_name: String,
    ) -> Result<TransactionProposal, SceneError> {
        validate_display(&display_name)?;
        validate_text(&option_text)?;
        if loaded.project.scenes.len() >= MAX_SCENES {
            return Err(SceneError::InvariantBlocked);
        }
        let chapter = loaded
            .project
            .chapters
            .iter()
            .find(|item| item.id == chapter_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        let source_scene = loaded
            .project
            .scenes
            .iter()
            .find(|scene| scene.id == source_scene_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        let stored = loaded
            .source_map
            .scene_mappings
            .iter()
            .find(|mapping| mapping.scene_id == source_scene_id)
            .cloned()
            .ok_or(SceneError::InvalidMetadata)?;
        let (source_bytes, source_revision) =
            self.scene_snapshot(project, &source_scene.source_path)?;
        require_revision(&source_revision, expected_source_revision)?;
        if stored.source_revision != expected_source_revision {
            return Err(SceneError::SourceConflict);
        }
        let (_, beats) = build_mapping(
            &source_scene,
            &source_bytes,
            &source_revision.sha256,
            Some(&stored),
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )?;
        let choice = beats
            .iter()
            .find(|beat| beat.id == choice_beat_id)
            .ok_or(SceneError::UnknownEntity)?;
        let BeatPayload::Choice { mut options } = choice.payload.clone() else {
            return Err(SceneError::InvalidPayload);
        };
        if choice.protected || options.len() >= 64 {
            return Err(SceneError::InvariantBlocked);
        }

        self.transactions
            .ensure_directory(project, &chapter.directory)
            .map_err(|_| SceneError::Io)?;
        let destination_id = uuid::Uuid::new_v4().to_string();
        let technical_label = format!("loomlight_scene_{}", destination_id.replace('-', ""));
        let destination_path = next_scene_path(&loaded.project, &chapter.directory);
        let destination_bytes = format!("label {technical_label}:\n    return\n").into_bytes();
        let destination_revision = sha256(&destination_bytes);
        let destination = SceneMetadata {
            id: destination_id.clone(),
            chapter_id: chapter_id.into(),
            display_name,
            technical_label,
            source_path: destination_path.clone(),
            extra: Map::new(),
        };
        options.push(ChoiceOption {
            text: option_text,
            destination_scene_id: destination_id.clone(),
        });
        loaded.project.scenes.push(destination.clone());
        loaded.project.last_open = Selection {
            chapter_id: chapter_id.into(),
            scene_id: destination_id,
        };
        loaded.source_map.sources.push(destination_path.clone());

        let (proposed_source, forced) = apply_beat_edit(
            &source_bytes,
            &beats,
            BeatEdit::Update {
                id: choice_beat_id.into(),
                payload: BeatPayload::Choice { options },
            },
            &loaded,
        )?;
        let proposed_source_revision = sha256(&proposed_source);
        let (source_mapping, _) = build_mapping(
            &source_scene,
            &proposed_source,
            &proposed_source_revision,
            Some(&stored),
            &forced,
            Some((&loaded.project, &loaded.authoring)),
        )?;
        *loaded
            .source_map
            .scene_mappings
            .iter_mut()
            .find(|mapping| mapping.scene_id == source_scene_id)
            .ok_or(SceneError::InvalidMetadata)? = source_mapping;
        let (destination_mapping, _) = build_mapping(
            &destination,
            &destination_bytes,
            &destination_revision,
            None,
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )?;
        loaded.source_map.scene_mappings.push(destination_mapping);

        Ok(TransactionProposal {
            mutations: vec![
                create_mutation(&destination_path, destination_bytes)?,
                replace_mutation(
                    &source_scene.source_path,
                    source_bytes,
                    source_revision,
                    proposed_source,
                )?,
                replace_mutation(
                    PROJECT_PATH,
                    loaded.project_bytes,
                    loaded.project_revision,
                    json_bytes(&loaded.project)?,
                )?,
                replace_mutation(
                    SOURCE_MAP_PATH,
                    loaded.source_map_bytes,
                    loaded.source_map_revision,
                    json_bytes(&loaded.source_map)?,
                )?,
            ],
            intent: TransactionIntent::Edit,
        })
    }

    fn move_scene_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        scene_id: &str,
        chapter_id: &str,
        direction: Option<MoveDirection>,
        expected_source_revision: &str,
    ) -> Result<TransactionProposal, SceneError> {
        let target_chapter = loaded
            .project
            .chapters
            .iter()
            .find(|chapter| chapter.id == chapter_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        let index = loaded
            .project
            .scenes
            .iter()
            .position(|scene| scene.id == scene_id)
            .ok_or(SceneError::UnknownEntity)?;
        let old = loaded.project.scenes[index].clone();
        if old.chapter_id == chapter_id {
            if let Some(direction) = direction {
                move_scene_in_chapter(&mut loaded.project.scenes, scene_id, chapter_id, direction)?;
            }
            return metadata_only_proposal(loaded);
        }
        let (source_bytes, source_revision) = self.scene_snapshot(project, &old.source_path)?;
        require_revision(&source_revision, expected_source_revision)?;
        require_mapped_revision(&loaded.source_map, scene_id, expected_source_revision)?;
        self.transactions
            .ensure_directory(project, &target_chapter.directory)
            .map_err(|_| SceneError::Io)?;
        let new_path = next_scene_path(&loaded.project, &target_chapter.directory);
        loaded.project.scenes[index].chapter_id = chapter_id.into();
        loaded.project.scenes[index].source_path = new_path.clone();
        loaded.project.last_open = Selection {
            chapter_id: chapter_id.into(),
            scene_id: scene_id.into(),
        };
        let mapping = loaded
            .source_map
            .scene_mappings
            .iter_mut()
            .find(|mapping| mapping.scene_id == scene_id)
            .ok_or(SceneError::InvalidMetadata)?;
        mapping.path = new_path.clone();
        loaded
            .source_map
            .sources
            .retain(|path| path != &old.source_path);
        loaded.source_map.sources.push(new_path.clone());
        let mut mutations = vec![
            create_mutation(&new_path, source_bytes.clone())?,
            delete_mutation(&old.source_path, source_bytes, source_revision)?,
        ];
        if let Some((bytes, revision)) =
            self.snapshot_optional(project, &compiled_path(&old.source_path))?
        {
            mutations.push(delete_mutation(
                &compiled_path(&old.source_path),
                bytes,
                revision,
            )?);
        }
        mutations.push(replace_mutation(
            PROJECT_PATH,
            loaded.project_bytes,
            loaded.project_revision,
            json_bytes(&loaded.project)?,
        )?);
        mutations.push(replace_mutation(
            SOURCE_MAP_PATH,
            loaded.source_map_bytes,
            loaded.source_map_revision,
            json_bytes(&loaded.source_map)?,
        )?);
        Ok(TransactionProposal {
            mutations,
            intent: TransactionIntent::Edit,
        })
    }

    fn delete_scene_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        scene_id: &str,
        expected_source_revision: &str,
    ) -> Result<TransactionProposal, SceneError> {
        if loaded.project.scenes.len() == 1
            || loaded.project.entry_scene_id.as_deref() == Some(scene_id)
        {
            return Err(SceneError::InvariantBlocked);
        }
        self.assert_no_incoming_references(project, &loaded, scene_id)?;
        let index = loaded
            .project
            .scenes
            .iter()
            .position(|scene| scene.id == scene_id)
            .ok_or(SceneError::UnknownEntity)?;
        let removed = loaded.project.scenes[index].clone();
        let (source_bytes, source_revision) = self.scene_snapshot(project, &removed.source_path)?;
        require_revision(&source_revision, expected_source_revision)?;
        require_mapped_revision(&loaded.source_map, scene_id, expected_source_revision)?;
        loaded.project.scenes.remove(index);
        loaded
            .source_map
            .sources
            .retain(|path| path != &removed.source_path);
        loaded
            .source_map
            .scene_mappings
            .retain(|mapping| mapping.scene_id != scene_id);
        if loaded.project.last_open.scene_id == scene_id {
            let fallback = loaded
                .project
                .scenes
                .get(index.min(loaded.project.scenes.len() - 1))
                .ok_or(SceneError::InvariantBlocked)?;
            loaded.project.last_open = Selection {
                chapter_id: fallback.chapter_id.clone(),
                scene_id: fallback.id.clone(),
            };
        }
        let mut mutations = vec![delete_mutation(
            &removed.source_path,
            source_bytes,
            source_revision,
        )?];
        if let Some((bytes, revision)) =
            self.snapshot_optional(project, &compiled_path(&removed.source_path))?
        {
            mutations.push(delete_mutation(
                &compiled_path(&removed.source_path),
                bytes,
                revision,
            )?);
        }
        mutations.push(replace_mutation(
            PROJECT_PATH,
            loaded.project_bytes,
            loaded.project_revision,
            json_bytes(&loaded.project)?,
        )?);
        mutations.push(replace_mutation(
            SOURCE_MAP_PATH,
            loaded.source_map_bytes,
            loaded.source_map_revision,
            json_bytes(&loaded.source_map)?,
        )?);
        Ok(TransactionProposal {
            mutations,
            intent: TransactionIntent::Edit,
        })
    }

    fn assert_no_incoming_references(
        &self,
        project: &ProjectId,
        loaded: &Loaded,
        scene_id: &str,
    ) -> Result<(), SceneError> {
        for scene in &loaded.project.scenes {
            let stored = loaded
                .source_map
                .scene_mappings
                .iter()
                .find(|mapping| mapping.scene_id == scene.id)
                .ok_or(SceneError::InvalidMetadata)?;
            let (bytes, revision) = self.scene_snapshot(project, &scene.source_path)?;
            if revision.sha256 != stored.source_revision {
                return Err(SceneError::SourceConflict);
            }
            let (_, beats) = build_mapping(
                scene,
                &bytes,
                &revision.sha256,
                Some(stored),
                &[],
                Some((&loaded.project, &loaded.authoring)),
            )?;
            if beats.iter().any(|beat| {
                beat.protected
                    || match &beat.payload {
                        BeatPayload::Jump { scene_id: target } => target == scene_id,
                        BeatPayload::Choice { options } => options
                            .iter()
                            .any(|option| option.destination_scene_id == scene_id),
                        _ => false,
                    }
            }) {
                return Err(SceneError::ReferenceBlocked);
            }
        }
        Ok(())
    }

    fn beat_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        scene_id: &str,
        expected_source_revision: &str,
        edit: BeatEdit,
    ) -> Result<TransactionProposal, SceneError> {
        let scene = loaded
            .project
            .scenes
            .iter()
            .find(|scene| scene.id == scene_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        let stored = loaded
            .source_map
            .scene_mappings
            .iter()
            .find(|mapping| mapping.scene_id == scene_id)
            .cloned()
            .ok_or(SceneError::InvalidMetadata)?;
        let (source_bytes, source_revision) = self.scene_snapshot(project, &scene.source_path)?;
        require_revision(&source_revision, expected_source_revision)?;
        if stored.source_revision != expected_source_revision {
            return Err(SceneError::SourceConflict);
        }
        let (_, beats) = build_mapping(
            &scene,
            &source_bytes,
            &source_revision.sha256,
            Some(&stored),
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )?;
        if beats.len() >= MAX_BEATS_PER_SCENE
            && matches!(
                edit,
                BeatEdit::Insert { .. } | BeatEdit::ContinueDialogue { .. }
            )
        {
            return Err(SceneError::InvariantBlocked);
        }
        let (proposed_source, forced) = apply_beat_edit(&source_bytes, &beats, edit, &loaded)?;
        let proposed_revision = sha256(&proposed_source);
        let (new_mapping, _) = build_mapping(
            &scene,
            &proposed_source,
            &proposed_revision,
            Some(&stored),
            &forced,
            Some((&loaded.project, &loaded.authoring)),
        )?;
        *loaded
            .source_map
            .scene_mappings
            .iter_mut()
            .find(|mapping| mapping.scene_id == scene_id)
            .ok_or(SceneError::InvalidMetadata)? = new_mapping;
        Ok(TransactionProposal {
            mutations: vec![
                replace_mutation(
                    &scene.source_path,
                    source_bytes,
                    source_revision,
                    proposed_source,
                )?,
                replace_mutation(
                    SOURCE_MAP_PATH,
                    loaded.source_map_bytes,
                    loaded.source_map_revision,
                    json_bytes(&loaded.source_map)?,
                )?,
            ],
            intent: TransactionIntent::Edit,
        })
    }

    fn load(&self, project: &ProjectId, project_id: &str) -> Result<Loaded, SceneError> {
        let (project_bytes, project_revision) = self.scene_snapshot(project, PROJECT_PATH)?;
        let project_metadata = ProjectMetadata::read_bytes(&project_bytes, None)
            .map_err(|_| SceneError::InvalidMetadata)?;
        if project_metadata.project_id != project_id
            || project_metadata.schema_version != PROJECT_SCHEMA_VERSION
        {
            return Err(SceneError::InvalidMetadata);
        }
        let (source_map_bytes, source_map_revision) =
            self.scene_snapshot(project, SOURCE_MAP_PATH)?;
        let source_map = SourceMapMetadata::read_bytes(&source_map_bytes, project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        if source_map.schema_version != SOURCE_MAP_SCHEMA_VERSION
            || source_map.scene_mappings.len() != project_metadata.scenes.len()
        {
            return Err(SceneError::InvalidMetadata);
        }
        let authoring = self
            .list(project, project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        Ok(Loaded {
            project: project_metadata,
            project_bytes,
            project_revision,
            source_map,
            source_map_bytes,
            source_map_revision,
            authoring,
        })
    }

    fn verify_current_mappings(
        &self,
        project: &ProjectId,
        metadata: &ProjectMetadata,
        source_map: &SourceMapMetadata,
    ) -> Result<(), SceneError> {
        if source_map.scene_mappings.len() != metadata.scenes.len() {
            return Err(SceneError::InvalidMetadata);
        }
        for scene in &metadata.scenes {
            let stored = source_map
                .scene_mappings
                .iter()
                .find(|mapping| mapping.scene_id == scene.id && mapping.path == scene.source_path)
                .ok_or(SceneError::InvalidMetadata)?;
            let (bytes, revision) = self.scene_snapshot(project, &scene.source_path)?;
            if revision.sha256 != stored.source_revision {
                return Err(SceneError::SourceConflict);
            }
            let authoring = self
                .list(project, &metadata.project_id)
                .map_err(|_| SceneError::InvalidMetadata)?;
            build_mapping(
                scene,
                &bytes,
                &revision.sha256,
                Some(stored),
                &[],
                Some((metadata, &authoring)),
            )?;
        }
        Ok(())
    }

    fn commit_history(
        &self,
        project: &ProjectId,
        proposal: TransactionProposal,
    ) -> Result<(), SceneError> {
        let snapshot = proposal.mutations.clone();
        match self.transactions.commit(project, proposal) {
            CommitOutcome::Committed {
                transaction_id,
                revisions,
            } => {
                let mutations = snapshot
                    .into_iter()
                    .zip(revisions)
                    .map(|(mutation, after_revision)| HistoryMutation {
                        path: mutation.path,
                        before_revision: mutation.base,
                        before_bytes: mutation.expected_bytes,
                        after_revision,
                        after_bytes: mutation.proposed,
                    })
                    .collect();
                self.scene_history
                    .lock()
                    .map_err(|_| SceneError::Io)?
                    .entry(project.clone())
                    .or_default()
                    .push(HistoryEntry {
                        transaction_id,
                        mutations,
                    });
                Ok(())
            }
            outcome => Err(outcome_error(outcome)),
        }
    }

    fn undo_scene(&self, project: &ProjectId) -> Result<(), SceneError> {
        let mut histories = self.scene_history.lock().map_err(|_| SceneError::Io)?;
        let history = histories
            .get_mut(project)
            .ok_or(SceneError::HistoryBoundary)?;
        let current = current_revisions(
            &self.transactions,
            project,
            history.undo_paths().map_err(history_error)?,
        )?;
        let proposal = history.undo_proposal(&current).map_err(history_error)?;
        match self.transactions.commit(project, proposal) {
            CommitOutcome::Committed { revisions, .. } => history
                .accepted_undo_with_revisions(&revisions)
                .map_err(history_error),
            outcome => Err(outcome_error(outcome)),
        }
    }

    fn redo_scene(&self, project: &ProjectId) -> Result<(), SceneError> {
        let mut histories = self.scene_history.lock().map_err(|_| SceneError::Io)?;
        let history = histories
            .get_mut(project)
            .ok_or(SceneError::HistoryBoundary)?;
        let current = current_revisions(
            &self.transactions,
            project,
            history.redo_paths().map_err(history_error)?,
        )?;
        let proposal = history.redo_proposal(&current).map_err(history_error)?;
        match self.transactions.commit(project, proposal) {
            CommitOutcome::Committed { revisions, .. } => history
                .accepted_redo_with_revisions(&revisions)
                .map_err(history_error),
            outcome => Err(outcome_error(outcome)),
        }
    }

    fn scene_snapshot(
        &self,
        project: &ProjectId,
        path: &str,
    ) -> Result<(Vec<u8>, Revision), SceneError> {
        self.transactions
            .snapshot(
                project,
                RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
            )
            .map_err(diagnostic_error)
    }

    fn snapshot_optional(
        &self,
        project: &ProjectId,
        path: &str,
    ) -> Result<Option<(Vec<u8>, Revision)>, SceneError> {
        self.transactions
            .snapshot_optional(
                project,
                RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
            )
            .map_err(diagnostic_error)
    }
}

enum BeatEdit {
    Insert {
        before: Option<String>,
        payload: BeatPayload,
    },
    Update {
        id: String,
        payload: BeatPayload,
    },
    ContinueDialogue {
        id: String,
        character_id: String,
        text: String,
    },
    Remove {
        id: String,
    },
    Move {
        id: String,
        direction: MoveDirection,
    },
}

fn apply_beat_edit(
    source: &[u8],
    beats: &[SceneBeat],
    edit: BeatEdit,
    loaded: &Loaded,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    if beats
        .iter()
        .take(beats.len().saturating_sub(1))
        .any(|beat| is_terminal_payload(&beat.payload))
    {
        return Err(SceneError::InvariantBlocked);
    }
    let newline = if source.windows(2).any(|window| window == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    match edit {
        BeatEdit::Insert { before, payload } => {
            validate_payload(&payload, loaded)?;
            if matches!(payload, BeatPayload::CustomCode { .. }) {
                return Err(SceneError::InvalidPayload);
            }
            let requested = before
                .as_deref()
                .map(|id| {
                    beats
                        .iter()
                        .find(|beat| beat.id == id)
                        .ok_or(SceneError::UnknownEntity)
                })
                .transpose()?;
            if is_terminal_payload(&payload) {
                if let Some(last) = beats
                    .last()
                    .filter(|beat| is_terminal_payload(&beat.payload))
                {
                    if last.protected || requested.is_some_and(|requested| requested.id != last.id)
                    {
                        return Err(SceneError::InvariantBlocked);
                    }
                    let rendered = render_payload(&payload, loaded, newline)?;
                    let id = uuid::Uuid::new_v4().to_string();
                    let mut output = source.to_vec();
                    output.splice(
                        last.byte_start as usize..last.byte_end as usize,
                        rendered.bytes(),
                    );
                    return Ok((
                        output,
                        vec![(payload.kind().into(), sha256(rendered.as_bytes()), id)],
                    ));
                }
                if requested.is_some() {
                    return Err(SceneError::InvariantBlocked);
                }
            }
            let insertion = if let Some(id) = before {
                requested
                    .filter(|beat| beat.id == id)
                    .ok_or(SceneError::UnknownEntity)?
                    .byte_start as usize
            } else {
                beats.last().map_or(source.len(), |beat| {
                    if is_terminal_payload(&beat.payload) {
                        beat.byte_start as usize
                    } else {
                        beat.byte_end as usize
                    }
                })
            };
            if boundary_is_opaque(beats, insertion) {
                return Err(SceneError::OpaqueBoundary);
            }
            let rendered = render_payload(&payload, loaded, newline)?;
            let id = uuid::Uuid::new_v4().to_string();
            let mut output = Vec::with_capacity(source.len() + rendered.len());
            output.extend_from_slice(&source[..insertion]);
            output.extend_from_slice(rendered.as_bytes());
            output.extend_from_slice(&source[insertion..]);
            Ok((
                output,
                vec![(payload.kind().into(), sha256(rendered.as_bytes()), id)],
            ))
        }
        BeatEdit::Update { id, payload } => {
            validate_payload(&payload, loaded)?;
            if matches!(payload, BeatPayload::CustomCode { .. }) {
                return Err(SceneError::InvalidPayload);
            }
            let beat = beats
                .iter()
                .find(|beat| beat.id == id)
                .ok_or(SceneError::UnknownEntity)?;
            if beat.protected {
                return Err(SceneError::OpaqueBoundary);
            }
            if is_terminal_payload(&beat.payload) != is_terminal_payload(&payload)
                || (is_terminal_payload(&payload)
                    && beats.last().is_none_or(|last| last.id != beat.id))
            {
                return Err(SceneError::InvariantBlocked);
            }
            let rendered = render_payload(&payload, loaded, newline)?;
            let mut output = source.to_vec();
            output.splice(
                beat.byte_start as usize..beat.byte_end as usize,
                rendered.bytes(),
            );
            Ok((
                output,
                vec![(payload.kind().into(), sha256(rendered.as_bytes()), id)],
            ))
        }
        BeatEdit::ContinueDialogue {
            id,
            character_id,
            text,
        } => {
            let beat = beats
                .iter()
                .find(|beat| beat.id == id)
                .ok_or(SceneError::UnknownEntity)?;
            if beat.protected || !matches!(beat.payload, BeatPayload::Dialogue { .. }) {
                return Err(SceneError::OpaqueBoundary);
            }
            let committed = BeatPayload::Dialogue {
                character_id: character_id.clone(),
                text,
            };
            let next = BeatPayload::Dialogue {
                character_id,
                text: String::new(),
            };
            let committed_source = render_payload(&committed, loaded, newline)?;
            let next_source = render_payload(&next, loaded, newline)?;
            let next_id = uuid::Uuid::new_v4().to_string();
            let mut output = source.to_vec();
            output.splice(
                beat.byte_start as usize..beat.byte_end as usize,
                committed_source.bytes().chain(next_source.bytes()),
            );
            Ok((
                output,
                vec![
                    (
                        committed.kind().into(),
                        sha256(committed_source.as_bytes()),
                        id,
                    ),
                    (next.kind().into(), sha256(next_source.as_bytes()), next_id),
                ],
            ))
        }
        BeatEdit::Remove { id } => {
            let beat = beats
                .iter()
                .find(|beat| beat.id == id)
                .ok_or(SceneError::UnknownEntity)?;
            if beat.protected {
                return Err(SceneError::OpaqueBoundary);
            }
            if is_terminal_payload(&beat.payload) {
                return Err(SceneError::InvariantBlocked);
            }
            let mut output = source.to_vec();
            output.drain(beat.byte_start as usize..beat.byte_end as usize);
            Ok((output, Vec::new()))
        }
        BeatEdit::Move { id, direction } => {
            let index = beats
                .iter()
                .position(|beat| beat.id == id)
                .ok_or(SceneError::UnknownEntity)?;
            let other = match direction {
                MoveDirection::Up => index.checked_sub(1),
                MoveDirection::Down => (index + 1 < beats.len()).then_some(index + 1),
            }
            .ok_or(SceneError::InvariantBlocked)?;
            if beats[index].protected || beats[other].protected {
                return Err(SceneError::OpaqueBoundary);
            }
            if is_terminal_payload(&beats[index].payload)
                || is_terminal_payload(&beats[other].payload)
            {
                return Err(SceneError::InvariantBlocked);
            }
            let (first, second) = if index < other {
                (index, other)
            } else {
                (other, index)
            };
            if beats[first].byte_end != beats[second].byte_start {
                return Err(SceneError::OpaqueBoundary);
            }
            let a = &source[beats[first].byte_start as usize..beats[first].byte_end as usize];
            let b = &source[beats[second].byte_start as usize..beats[second].byte_end as usize];
            let mut output = Vec::with_capacity(source.len());
            output.extend_from_slice(&source[..beats[first].byte_start as usize]);
            output.extend_from_slice(b);
            output.extend_from_slice(a);
            output.extend_from_slice(&source[beats[second].byte_end as usize..]);
            let moved_order = [&beats[second], &beats[first]];
            let forced = moved_order
                .into_iter()
                .map(|beat| {
                    let bytes = &source[beat.byte_start as usize..beat.byte_end as usize];
                    (beat.payload.kind().into(), sha256(bytes), beat.id.clone())
                })
                .collect();
            Ok((output, forced))
        }
    }
}

fn render_payload(
    payload: &BeatPayload,
    loaded: &Loaded,
    newline: &str,
) -> Result<String, SceneError> {
    validate_payload(payload, loaded)?;
    let transition = |value: TransitionRef| match value {
        TransitionRef::None => "",
        TransitionRef::Dissolve => " with dissolve",
        TransitionRef::Fade => " with fade",
    };
    let line = match payload {
        BeatPayload::Background {
            asset_id,
            transition: value,
        } => {
            let asset = asset(loaded, asset_id, AssetKind::Background)?;
            format!("    scene {}{}", asset.discovery_name, transition(*value))
        }
        BeatPayload::ShowCharacter {
            character_id,
            appearance_id,
            placement,
            transition: value,
        } => {
            let character = character(loaded, character_id)?;
            let appearance = appearance(loaded, appearance_id, character_id)?;
            format!(
                "    show {} {} at {}{}",
                character.technical_name,
                appearance.label,
                placement_name(*placement),
                transition(*value)
            )
        }
        BeatPayload::HideCharacter {
            character_id,
            transition: value,
        } => {
            format!(
                "    hide {}{}",
                character(loaded, character_id)?.technical_name,
                transition(*value)
            )
        }
        BeatPayload::ChangeAppearance {
            character_id,
            appearance_id,
            transition: value,
        } => {
            let character = character(loaded, character_id)?;
            let appearance = appearance(loaded, appearance_id, character_id)?;
            format!(
                "    show {} {}{}",
                character.technical_name,
                appearance.label,
                transition(*value)
            )
        }
        BeatPayload::Placement {
            character_id,
            placement,
        } => {
            format!(
                "    show {} at {}",
                character(loaded, character_id)?.technical_name,
                placement_name(*placement)
            )
        }
        BeatPayload::Dialogue { character_id, text } => format!(
            "    {} \"{}\"",
            character(loaded, character_id)?.technical_name,
            escape_string(text)?
        ),
        BeatPayload::Narration { text } => format!("    \"{}\"", escape_string(text)?),
        BeatPayload::PlayMusic { asset_id } => format!(
            "    play music {}",
            asset(loaded, asset_id, AssetKind::Music)?.discovery_name
        ),
        BeatPayload::StopMusic => "    stop music".into(),
        BeatPayload::PlaySfx { asset_id } => format!(
            "    play sound {}",
            asset(loaded, asset_id, AssetKind::Sfx)?.discovery_name
        ),
        BeatPayload::Transition { transition: value } => match value {
            TransitionRef::None => return Err(SceneError::InvalidPayload),
            TransitionRef::Dissolve => "    with dissolve".into(),
            TransitionRef::Fade => "    with fade".into(),
        },
        BeatPayload::SetVariable { variable_id, value } => {
            let variable = loaded
                .authoring
                .variables
                .iter()
                .find(|item| item.id == *variable_id)
                .ok_or(SceneError::UnknownEntity)?;
            format!(
                "    $ {} = {}",
                variable.technical_name,
                render_value(variable.variable_type, value)?
            )
        }
        BeatPayload::Choice { options } => {
            let mut text = String::from("    menu:");
            text.push_str(newline);
            for option in options {
                let destination = loaded
                    .project
                    .scenes
                    .iter()
                    .find(|scene| scene.id == option.destination_scene_id)
                    .ok_or(SceneError::UnknownEntity)?;
                text.push_str(&format!(
                    "        \"{}\":{}            jump {}",
                    escape_string(&option.text)?,
                    newline,
                    destination.technical_label
                ));
                text.push_str(newline);
            }
            return Ok(text);
        }
        BeatPayload::Jump { scene_id } => {
            let destination = loaded
                .project
                .scenes
                .iter()
                .find(|scene| scene.id == *scene_id)
                .ok_or(SceneError::UnknownEntity)?;
            format!("    jump {}", destination.technical_label)
        }
        BeatPayload::Return => "    return".into(),
        BeatPayload::CustomCode { .. } => return Err(SceneError::InvalidPayload),
    };
    Ok(format!("{line}{newline}"))
}

fn validate_payload(payload: &BeatPayload, loaded: &Loaded) -> Result<(), SceneError> {
    match payload {
        BeatPayload::Dialogue { character_id, text } => {
            character(loaded, character_id)?;
            validate_text(text)?;
        }
        BeatPayload::Narration { text } => validate_text(text)?,
        BeatPayload::Choice { options } => {
            if options.is_empty() || options.len() > 64 {
                return Err(SceneError::InvalidPayload);
            }
            for option in options {
                validate_text(&option.text)?;
                if !loaded
                    .project
                    .scenes
                    .iter()
                    .any(|scene| scene.id == option.destination_scene_id)
                {
                    return Err(SceneError::UnknownEntity);
                }
            }
        }
        BeatPayload::Jump { scene_id } => {
            if !loaded
                .project
                .scenes
                .iter()
                .any(|scene| scene.id == *scene_id)
            {
                return Err(SceneError::UnknownEntity);
            }
        }
        BeatPayload::SetVariable { variable_id, value } => {
            let variable = loaded
                .authoring
                .variables
                .iter()
                .find(|item| item.id == *variable_id)
                .ok_or(SceneError::UnknownEntity)?;
            render_value(variable.variable_type, value)?;
        }
        BeatPayload::Background { asset_id, .. } => {
            asset(loaded, asset_id, AssetKind::Background)?;
        }
        BeatPayload::ShowCharacter {
            character_id,
            appearance_id,
            ..
        }
        | BeatPayload::ChangeAppearance {
            character_id,
            appearance_id,
            ..
        } => {
            character(loaded, character_id)?;
            appearance(loaded, appearance_id, character_id)?;
        }
        BeatPayload::HideCharacter { character_id, .. }
        | BeatPayload::Placement { character_id, .. } => {
            character(loaded, character_id)?;
        }
        BeatPayload::PlayMusic { asset_id } => {
            asset(loaded, asset_id, AssetKind::Music)?;
        }
        BeatPayload::PlaySfx { asset_id } => {
            asset(loaded, asset_id, AssetKind::Sfx)?;
        }
        BeatPayload::StopMusic | BeatPayload::Transition { .. } | BeatPayload::Return => {}
        BeatPayload::CustomCode { .. } => return Err(SceneError::InvalidPayload),
    }
    Ok(())
}

fn parse_scene(
    scene: &SceneMetadata,
    bytes: &[u8],
    loaded: Option<(&ProjectMetadata, &AuthoringMetadata)>,
) -> Result<(usize, usize, Vec<ParsedBeat>), SceneError> {
    let source = std::str::from_utf8(bytes).map_err(|_| SceneError::UnsupportedSource)?;
    let lines = physical_lines(source);
    let wanted = format!("label {}:", scene.technical_label);
    let labels: Vec<_> = lines
        .iter()
        .filter(|(_, _, body)| body == &wanted)
        .collect();
    if labels.len() != 1 {
        return Err(SceneError::UnsupportedSource);
    }
    let (label_start, label_end, _) = *labels[0];
    if source[..label_start].trim().is_empty().not() {
        return Err(SceneError::UnsupportedSource);
    }
    let mut beats = Vec::new();
    let mut index = lines
        .iter()
        .position(|(start, _, _)| *start == label_start)
        .ok_or(SceneError::UnsupportedSource)?
        + 1;
    while index < lines.len() {
        let (start, end, body) = lines[index];
        if body.starts_with("label ") && body.ends_with(':') {
            return Err(SceneError::UnsupportedSource);
        }
        if body == "    menu:" {
            let menu_start = start;
            index += 1;
            let mut options = Vec::new();
            let mut menu_end = end;
            while index + 1 < lines.len() {
                let (_, option_end, option_line) = lines[index];
                let (_, jump_end, jump_line) = lines[index + 1];
                let Some(option_text) = option_line
                    .strip_prefix("        \"")
                    .and_then(|value| value.strip_suffix("\":"))
                    .and_then(unescape_string)
                else {
                    break;
                };
                let Some(label) = jump_line.strip_prefix("            jump ") else {
                    break;
                };
                let destination = loaded
                    .and_then(|(project, _)| {
                        project
                            .scenes
                            .iter()
                            .find(|scene| scene.technical_label == label)
                    })
                    .map(|scene| scene.id.clone());
                let Some(destination_scene_id) = destination else {
                    break;
                };
                options.push(ChoiceOption {
                    text: option_text,
                    destination_scene_id,
                });
                menu_end = jump_end.max(option_end);
                index += 2;
            }
            if !options.is_empty() {
                beats.push(ParsedBeat {
                    start: menu_start,
                    end: menu_end,
                    payload: BeatPayload::Choice { options },
                });
                continue;
            }
            beats.push(custom(start, end, body));
            continue;
        }
        let payload = parse_line(body, loaded).unwrap_or_else(|| BeatPayload::CustomCode {
            source: body.into(),
            reason: "Unsupported or runtime-dependent Ren'Py source".into(),
        });
        beats.push(ParsedBeat {
            start,
            end,
            payload,
        });
        index += 1;
    }
    if beats.is_empty() || beats.len() > MAX_BEATS_PER_SCENE {
        return Err(SceneError::UnsupportedSource);
    }
    Ok((label_start, bytes.len().max(label_end), beats))
}

fn parse_line(
    body: &str,
    loaded: Option<(&ProjectMetadata, &AuthoringMetadata)>,
) -> Option<BeatPayload> {
    let line = body.strip_prefix("    ")?;
    if line == "return" {
        return Some(BeatPayload::Return);
    }
    if line == "stop music" {
        return Some(BeatPayload::StopMusic);
    }
    if let Some(value) = line.strip_prefix("with ") {
        return parse_transition(value).map(|transition| BeatPayload::Transition { transition });
    }
    if let Some(label) = line.strip_prefix("jump ") {
        return loaded
            .and_then(|(project, _)| {
                project
                    .scenes
                    .iter()
                    .find(|scene| scene.technical_label == label)
            })
            .map(|scene| BeatPayload::Jump {
                scene_id: scene.id.clone(),
            });
    }
    if let Some(rest) = line.strip_prefix("play music ") {
        return find_asset(loaded, rest, AssetKind::Music)
            .map(|asset_id| BeatPayload::PlayMusic { asset_id });
    }
    if let Some(rest) = line.strip_prefix("play sound ") {
        return find_asset(loaded, rest, AssetKind::Sfx)
            .map(|asset_id| BeatPayload::PlaySfx { asset_id });
    }
    if let Some(rest) = line.strip_prefix("scene ") {
        let (name, transition) = split_transition(rest)?;
        return find_asset(loaded, name, AssetKind::Background).map(|asset_id| {
            BeatPayload::Background {
                asset_id,
                transition,
            }
        });
    }
    if let Some(rest) = line.strip_prefix("hide ") {
        let (name, transition) = split_transition(rest)?;
        return find_character(loaded, name).map(|character_id| BeatPayload::HideCharacter {
            character_id,
            transition,
        });
    }
    if let Some(rest) = line.strip_prefix("show ") {
        return parse_show(rest, loaded);
    }
    if let Some(rest) = line.strip_prefix("$ ") {
        let (name, literal) = rest.split_once(" = ")?;
        let (_, authoring) = loaded?;
        let variable = authoring
            .variables
            .iter()
            .find(|item| item.technical_name == name)?;
        let value = parse_value(variable.variable_type, literal)?;
        return Some(BeatPayload::SetVariable {
            variable_id: variable.id.clone(),
            value,
        });
    }
    if line.starts_with('"') {
        return line
            .strip_prefix('"')
            .and_then(|value| value.strip_suffix('"'))
            .and_then(unescape_string)
            .map(|text| BeatPayload::Narration { text });
    }
    let (speaker, quoted) = line.split_once(" \"")?;
    let text = quoted.strip_suffix('"').and_then(unescape_string)?;
    find_character(loaded, speaker).map(|character_id| BeatPayload::Dialogue { character_id, text })
}

fn parse_show(
    rest: &str,
    loaded: Option<(&ProjectMetadata, &AuthoringMetadata)>,
) -> Option<BeatPayload> {
    let (without_transition, transition) = split_transition(rest)?;
    let (main, placement) = if let Some((main, at)) = without_transition.rsplit_once(" at ") {
        (main, Some(parse_placement(at)?))
    } else {
        (without_transition, None)
    };
    let mut parts = main.split_whitespace();
    let technical = parts.next()?;
    let expression = parts.next();
    if parts.next().is_some() {
        return None;
    }
    let (_, authoring) = loaded?;
    let character = authoring
        .characters
        .iter()
        .find(|item| item.technical_name == technical)?;
    if let Some(expression) = expression {
        let appearance = authoring
            .appearances
            .iter()
            .find(|item| item.character_id == character.id && item.label == expression)?;
        if let Some(placement) = placement {
            Some(BeatPayload::ShowCharacter {
                character_id: character.id.clone(),
                appearance_id: appearance.id.clone(),
                placement,
                transition,
            })
        } else {
            Some(BeatPayload::ChangeAppearance {
                character_id: character.id.clone(),
                appearance_id: appearance.id.clone(),
                transition,
            })
        }
    } else {
        placement.map(|placement| BeatPayload::Placement {
            character_id: character.id.clone(),
            placement,
        })
    }
}

fn build_mapping(
    scene: &SceneMetadata,
    bytes: &[u8],
    revision: &str,
    previous: Option<&SceneSourceMapping>,
    forced: &[ForcedBeatId],
    context: Option<(&ProjectMetadata, &AuthoringMetadata)>,
) -> Result<(SceneSourceMapping, Vec<SceneBeat>), SceneError> {
    let (label_start, label_end, parsed) = parse_scene(scene, bytes, context)?;
    if let Some(previous) = previous.filter(|mapping| mapping.source_revision == revision) {
        if previous.path != scene.source_path
            || previous.label_start as usize != label_start
            || previous.label_end as usize != label_end
            || previous.beats.len() != parsed.len()
            || previous
                .beats
                .iter()
                .zip(parsed.iter())
                .any(|(mapped, parsed)| {
                    mapped.byte_start as usize != parsed.start
                        || mapped.byte_end as usize != parsed.end
                        || mapped.kind != parsed.payload.kind()
                        || parsed.end > bytes.len()
                        || mapped.source_sha256 != sha256(&bytes[parsed.start..parsed.end])
                })
        {
            return Err(SceneError::InvalidMetadata);
        }
    }
    let mut ids: HashMap<(String, String), VecDeque<String>> = HashMap::new();
    let old_extra: HashMap<String, Map<String, Value>> = previous
        .map(|mapping| {
            mapping
                .beats
                .iter()
                .map(|beat| (beat.id.clone(), beat.extra.clone()))
                .collect()
        })
        .unwrap_or_default();
    let forced_ids: HashSet<_> = forced.iter().map(|(_, _, id)| id.as_str()).collect();
    for (kind, hash, id) in forced {
        ids.entry((kind.clone(), hash.clone()))
            .or_default()
            .push_back(id.clone());
    }
    if let Some(previous) = previous {
        for beat in &previous.beats {
            if forced_ids.contains(beat.id.as_str()) {
                continue;
            }
            ids.entry((beat.kind.clone(), beat.source_sha256.clone()))
                .or_default()
                .push_back(beat.id.clone());
        }
    }
    let mut mappings = Vec::new();
    let mut beats = Vec::new();
    for parsed in parsed {
        let hash = sha256(&bytes[parsed.start..parsed.end]);
        let kind = parsed.payload.kind().to_owned();
        let id = ids
            .get_mut(&(kind.clone(), hash.clone()))
            .and_then(VecDeque::pop_front)
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        mappings.push(BeatSourceMapping {
            id: id.clone(),
            kind,
            byte_start: parsed.start as u64,
            byte_end: parsed.end as u64,
            source_sha256: hash,
            extra: old_extra.get(&id).cloned().unwrap_or_default(),
        });
        beats.push(SceneBeat {
            id,
            byte_start: parsed.start as u64,
            byte_end: parsed.end as u64,
            protected: matches!(parsed.payload, BeatPayload::CustomCode { .. }),
            payload: parsed.payload,
        });
    }
    Ok((
        SceneSourceMapping {
            scene_id: scene.id.clone(),
            path: scene.source_path.clone(),
            source_revision: revision.into(),
            label_start: label_start as u64,
            label_end: label_end as u64,
            beats: mappings,
            extra: previous.map_or_else(Map::new, |value| value.extra.clone()),
        },
        beats,
    ))
}

fn metadata_only_proposal(loaded: Loaded) -> Result<TransactionProposal, SceneError> {
    loaded
        .project
        .validate(None)
        .map_err(|_| SceneError::InvalidMetadata)?;
    Ok(TransactionProposal {
        mutations: vec![replace_mutation(
            PROJECT_PATH,
            loaded.project_bytes,
            loaded.project_revision,
            json_bytes(&loaded.project)?,
        )?],
        intent: TransactionIntent::Edit,
    })
}

fn replace_mutation(
    path: &str,
    expected_bytes: Vec<u8>,
    base: Revision,
    proposed: Vec<u8>,
) -> Result<FileMutation, SceneError> {
    Ok(FileMutation {
        path: RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
        kind: MutationKind::ReplaceExisting,
        base,
        expected_bytes,
        proposed,
    })
}

fn create_mutation(path: &str, proposed: Vec<u8>) -> Result<FileMutation, SceneError> {
    Ok(FileMutation {
        path: RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
        kind: MutationKind::CreateNew,
        base: Revision::expected_absence(),
        expected_bytes: Vec::new(),
        proposed,
    })
}

fn delete_mutation(
    path: &str,
    expected_bytes: Vec<u8>,
    base: Revision,
) -> Result<FileMutation, SceneError> {
    Ok(FileMutation {
        path: RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
        kind: MutationKind::DeleteExisting,
        base,
        expected_bytes,
        proposed: Vec::new(),
    })
}

fn current_revisions(
    transactions: &crate::transaction::TransactionService,
    project: &ProjectId,
    paths: Vec<RelativePath>,
) -> Result<HashMap<RelativePath, Revision>, SceneError> {
    let mut current = HashMap::new();
    for path in paths {
        let revision = transactions
            .snapshot_optional(project, path.clone())
            .map_err(diagnostic_error)?
            .map_or_else(Revision::expected_absence, |(_, revision)| revision);
        current.insert(path, revision);
    }
    Ok(current)
}

fn move_item<T>(
    values: &mut [T],
    id: &str,
    direction: MoveDirection,
    key: impl Fn(&T) -> &str,
) -> Result<(), SceneError> {
    let index = values
        .iter()
        .position(|value| key(value) == id)
        .ok_or(SceneError::UnknownEntity)?;
    let target = match direction {
        MoveDirection::Up => index.checked_sub(1),
        MoveDirection::Down => (index + 1 < values.len()).then_some(index + 1),
    }
    .ok_or(SceneError::InvariantBlocked)?;
    values.swap(index, target);
    Ok(())
}

fn move_scene_in_chapter(
    scenes: &mut [SceneMetadata],
    scene_id: &str,
    chapter_id: &str,
    direction: MoveDirection,
) -> Result<(), SceneError> {
    let ordered: Vec<usize> = scenes
        .iter()
        .enumerate()
        .filter_map(|(index, scene)| (scene.chapter_id == chapter_id).then_some(index))
        .collect();
    let position = ordered
        .iter()
        .position(|index| scenes[*index].id == scene_id)
        .ok_or(SceneError::UnknownEntity)?;
    let target = match direction {
        MoveDirection::Up => position.checked_sub(1),
        MoveDirection::Down => (position + 1 < ordered.len()).then_some(position + 1),
    }
    .ok_or(SceneError::InvariantBlocked)?;
    scenes.swap(ordered[position], ordered[target]);
    Ok(())
}

fn next_chapter_directory(project: &ProjectMetadata) -> String {
    let existing: HashSet<_> = project
        .chapters
        .iter()
        .map(|chapter| chapter.directory.as_str())
        .collect();
    (1..=MAX_CHAPTERS + 1)
        .map(|index| format!("game/chapters/chapter_{index:02}"))
        .find(|candidate| !existing.contains(candidate.as_str()))
        .unwrap_or_else(|| format!("game/chapters/chapter_{}", uuid::Uuid::new_v4().simple()))
}

fn next_scene_path(project: &ProjectMetadata, directory: &str) -> String {
    let existing: HashSet<_> = project
        .scenes
        .iter()
        .map(|scene| scene.source_path.as_str())
        .collect();
    (1..=MAX_SCENES + 1)
        .map(|index| format!("{directory}/scene_{index:03}.rpy"))
        .find(|candidate| !existing.contains(candidate.as_str()))
        .unwrap_or_else(|| format!("{directory}/scene_{}.rpy", uuid::Uuid::new_v4().simple()))
}

fn compiled_path(source: &str) -> String {
    format!("{}c", source)
}

fn require_revision(revision: &Revision, expected: &str) -> Result<(), SceneError> {
    if revision.sha256 == expected {
        Ok(())
    } else {
        Err(SceneError::SourceConflict)
    }
}

fn require_mapped_revision(
    map: &SourceMapMetadata,
    scene_id: &str,
    expected: &str,
) -> Result<(), SceneError> {
    if map
        .scene_mappings
        .iter()
        .any(|mapping| mapping.scene_id == scene_id && mapping.source_revision == expected)
    {
        Ok(())
    } else {
        Err(SceneError::SourceConflict)
    }
}

fn validate_display(value: &str) -> Result<(), SceneError> {
    if value.trim().is_empty() || value.len() > 160 || value.chars().any(char::is_control) {
        Err(SceneError::InvalidPayload)
    } else {
        Ok(())
    }
}

fn validate_text(value: &str) -> Result<(), SceneError> {
    if value.len() > MAX_TEXT_BYTES || value.contains(['\r', '\0']) {
        Err(SceneError::InvalidPayload)
    } else {
        Ok(())
    }
}

fn character<'a>(
    loaded: &'a Loaded,
    id: &str,
) -> Result<&'a crate::authoring::Character, SceneError> {
    loaded
        .authoring
        .characters
        .iter()
        .find(|item| item.id == id)
        .ok_or(SceneError::UnknownEntity)
}

fn appearance<'a>(
    loaded: &'a Loaded,
    id: &str,
    character_id: &str,
) -> Result<&'a crate::authoring::Appearance, SceneError> {
    loaded
        .authoring
        .appearances
        .iter()
        .find(|item| item.id == id && item.character_id == character_id)
        .ok_or(SceneError::UnknownEntity)
}

fn asset<'a>(
    loaded: &'a Loaded,
    id: &str,
    kind: AssetKind,
) -> Result<&'a crate::authoring::Asset, SceneError> {
    loaded
        .authoring
        .assets
        .iter()
        .find(|item| item.id == id && item.kind == kind && item.status == "available")
        .ok_or(SceneError::UnknownEntity)
}

fn find_character(
    loaded: Option<(&ProjectMetadata, &AuthoringMetadata)>,
    technical: &str,
) -> Option<String> {
    loaded?
        .1
        .characters
        .iter()
        .find(|item| item.technical_name == technical)
        .map(|item| item.id.clone())
}

fn find_asset(
    loaded: Option<(&ProjectMetadata, &AuthoringMetadata)>,
    discovery: &str,
    kind: AssetKind,
) -> Option<String> {
    loaded?
        .1
        .assets
        .iter()
        .find(|item| item.discovery_name == discovery && item.kind == kind)
        .map(|item| item.id.clone())
}

fn render_value(kind: VariableType, value: &Value) -> Result<String, SceneError> {
    match kind {
        VariableType::Bool => value
            .as_bool()
            .map(|value| if value { "True" } else { "False" }.into()),
        VariableType::Int => value
            .as_str()
            .and_then(|value| value.parse::<i64>().ok().map(|_| value.to_owned())),
        VariableType::String => value.as_str().and_then(|value| {
            escape_string(value)
                .ok()
                .map(|value| format!("\"{value}\""))
        }),
    }
    .ok_or(SceneError::InvalidPayload)
}

fn parse_value(kind: VariableType, literal: &str) -> Option<Value> {
    match kind {
        VariableType::Bool => match literal {
            "True" => Some(Value::Bool(true)),
            "False" => Some(Value::Bool(false)),
            _ => None,
        },
        VariableType::Int => literal
            .parse::<i64>()
            .ok()
            .map(|_| Value::String(literal.into())),
        VariableType::String => literal
            .strip_prefix('"')
            .and_then(|value| value.strip_suffix('"'))
            .and_then(unescape_string)
            .map(Value::String),
    }
}

fn escape_string(value: &str) -> Result<String, SceneError> {
    validate_text(value)?;
    Ok(value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n"))
}

fn unescape_string(value: &str) -> Option<String> {
    let mut output = String::new();
    let mut chars = value.chars();
    while let Some(character) = chars.next() {
        if character != '\\' {
            output.push(character);
            continue;
        }
        match chars.next()? {
            '\\' => output.push('\\'),
            '"' => output.push('"'),
            'n' => output.push('\n'),
            _ => return None,
        }
    }
    Some(output)
}

fn split_transition(value: &str) -> Option<(&str, TransitionRef)> {
    if let Some((body, transition)) = value.rsplit_once(" with ") {
        Some((body, parse_transition(transition)?))
    } else {
        Some((value, TransitionRef::None))
    }
}

fn parse_transition(value: &str) -> Option<TransitionRef> {
    match value {
        "dissolve" => Some(TransitionRef::Dissolve),
        "fade" => Some(TransitionRef::Fade),
        _ => None,
    }
}

fn parse_placement(value: &str) -> Option<PlacementRef> {
    match value {
        "left" => Some(PlacementRef::Left),
        "center" => Some(PlacementRef::Centre),
        "right" => Some(PlacementRef::Right),
        _ => None,
    }
}

fn placement_name(value: PlacementRef) -> &'static str {
    match value {
        PlacementRef::Left => "left",
        PlacementRef::Centre => "center",
        PlacementRef::Right => "right",
    }
}

fn physical_lines(source: &str) -> Vec<(usize, usize, &str)> {
    let mut result = Vec::new();
    let mut start = 0;
    for inclusive in source.split_inclusive('\n') {
        let end = start + inclusive.len();
        let body = inclusive
            .strip_suffix("\r\n")
            .or_else(|| inclusive.strip_suffix('\n'))
            .unwrap_or(inclusive);
        result.push((start, end, body));
        start = end;
    }
    if source.is_empty() {
        return result;
    }
    if start < source.len() {
        result.push((start, source.len(), &source[start..]));
    }
    result
}

fn custom(start: usize, end: usize, body: &str) -> ParsedBeat {
    ParsedBeat {
        start,
        end,
        payload: BeatPayload::CustomCode {
            source: body.into(),
            reason: "Unsupported or runtime-dependent Ren'Py source".into(),
        },
    }
}

fn boundary_is_opaque(beats: &[SceneBeat], insertion: usize) -> bool {
    beats.iter().any(|beat| {
        beat.protected && insertion > beat.byte_start as usize && insertion < beat.byte_end as usize
    })
}

fn json_bytes(value: &impl Serialize) -> Result<Vec<u8>, SceneError> {
    serde_json::to_vec_pretty(value).map_err(|_| SceneError::InvalidMetadata)
}

fn sha256(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn diagnostic_error(value: crate::transaction::PublicDiagnostic) -> SceneError {
    match value.code {
        ErrorCode::Conflict => SceneError::Conflict,
        ErrorCode::RecoveryRequired => SceneError::RecoveryRequired,
        ErrorCode::HistoryBoundary
        | ErrorCode::StaleRevision
        | ErrorCode::ExpectedBytesChanged
        | ErrorCode::FileIdentityChanged => SceneError::SourceConflict,
        _ => SceneError::Io,
    }
}

fn outcome_error(value: CommitOutcome) -> SceneError {
    match value {
        CommitOutcome::Conflict { .. } => SceneError::Conflict,
        CommitOutcome::RecoveryRequired { .. } => SceneError::RecoveryRequired,
        CommitOutcome::Rejected { diagnostic } => diagnostic_error(diagnostic),
        CommitOutcome::Committed { .. } => SceneError::Io,
    }
}

fn history_error(value: ErrorCode) -> SceneError {
    match value {
        ErrorCode::HistoryBoundary => SceneError::HistoryBoundary,
        _ => SceneError::Io,
    }
}

trait BoolNot {
    fn not(self) -> bool;
}
impl BoolNot for bool {
    fn not(self) -> bool {
        !self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::authoring::{
        Appearance, Asset, Character, CreateCharacterRequest, CreateVariableRequest,
        ImportAssetRequest, SourceDefinition, Variable,
    };
    use crate::media::{MediaError, MediaPurpose, MediaRequest};
    use crate::metadata::{Resolution, SdkIdentity};
    use std::collections::BTreeMap;
    use std::fs;
    use tempfile::TempDir;

    struct Fixture {
        _temporary: TempDir,
        root: std::path::PathBuf,
        service: AuthoringService,
        project: ProjectId,
        project_id: String,
        entry_scene_id: String,
    }

    impl Fixture {
        fn new(scene_source: &[u8]) -> Self {
            let temporary = tempfile::tempdir().unwrap();
            let root = fs::canonicalize(temporary.path()).unwrap();
            fs::create_dir_all(root.join(".renpy-editor/recovery")).unwrap();
            fs::create_dir_all(root.join("game/chapters/chapter_01")).unwrap();
            fs::create_dir_all(root.join("game/definitions")).unwrap();
            fs::create_dir_all(root.join("game/images")).unwrap();
            fs::create_dir_all(root.join("game/audio")).unwrap();
            let project_id = uuid::Uuid::new_v4().to_string();
            let chapter_id = uuid::Uuid::new_v4().to_string();
            let scene_id = uuid::Uuid::new_v4().to_string();
            let mut project_extra = Map::new();
            project_extra.insert("futureProjectField".into(), Value::String("kept".into()));
            let project_metadata = ProjectMetadata {
                schema_version: 1,
                project_id: project_id.clone(),
                title: "Fixture".into(),
                folder_name: root.file_name().unwrap().to_string_lossy().into_owned(),
                sdk: SdkIdentity {
                    adapter: "renpy-8.5.3".into(),
                    version: "8.5.3".into(),
                    extra: Map::new(),
                },
                resolution: Resolution {
                    width: 1280,
                    height: 720,
                },
                capabilities: vec!["project-lifecycle".into(), "supporting-authoring-v1".into()],
                chapters: vec![ChapterMetadata {
                    id: chapter_id.clone(),
                    display_name: "Chapter 1".into(),
                    directory: "game/chapters/chapter_01".into(),
                    extra: Map::new(),
                }],
                scenes: vec![SceneMetadata {
                    id: scene_id.clone(),
                    chapter_id: chapter_id.clone(),
                    display_name: "Scene 1".into(),
                    technical_label: "scene_one".into(),
                    source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
                    extra: Map::new(),
                }],
                entry_scene_id: None,
                last_open: Selection {
                    chapter_id,
                    scene_id: scene_id.clone(),
                },
                extra: project_extra,
            };
            let mut map_extra = Map::new();
            map_extra.insert("futureMapField".into(), Value::Bool(true));
            let source_map = SourceMapMetadata {
                schema_version: 1,
                project_id: project_id.clone(),
                sources: vec!["game/chapters/chapter_01/scene_001.rpy".into()],
                scene_mappings: Vec::new(),
                extra: map_extra,
            };
            fs::write(
                root.join(PROJECT_PATH),
                json_bytes(&project_metadata).unwrap(),
            )
            .unwrap();
            fs::write(root.join(SOURCE_MAP_PATH), json_bytes(&source_map).unwrap()).unwrap();
            fs::write(
                root.join(".renpy-editor/authoring.json"),
                json_bytes(&AuthoringMetadata::empty(project_id.clone())).unwrap(),
            )
            .unwrap();
            fs::write(
                root.join("game/chapters/chapter_01/scene_001.rpy"),
                scene_source,
            )
            .unwrap();
            fs::write(
                root.join("game/definitions/characters.rpy"),
                b"# Character definitions are added by Loomlight.\n",
            )
            .unwrap();
            fs::write(
                root.join("game/definitions/variables.rpy"),
                b"# Variable definitions are added by Loomlight.\n",
            )
            .unwrap();
            let service = AuthoringService::default();
            let project = service.register_project(&root).unwrap();
            Self {
                _temporary: temporary,
                root,
                service,
                project,
                project_id,
                entry_scene_id: scene_id,
            }
        }

        fn migrate(&self) {
            self.service
                .ensure_phase_1e_metadata(&self.project, &self.project_id)
                .unwrap();
        }

        fn workspace(&self) -> SceneWorkspace {
            self.service
                .scene_workspace(&self.project, &self.project_id)
                .unwrap()
        }

        fn apply(
            &self,
            workspace: &SceneWorkspace,
            command: SceneCommand,
        ) -> Result<SceneWorkspace, SceneError> {
            self.service.scene_apply(
                &self.project,
                &self.project_id,
                SceneCommandRequest {
                    expected_project_revision: workspace.project_revision.clone(),
                    expected_source_map_revision: workspace.source_map_revision.clone(),
                    command,
                },
            )
        }
    }

    #[test]
    fn source_mapping_uses_exact_byte_ranges_and_preserves_custom_code() {
        let scene = SceneMetadata {
            id: uuid::Uuid::new_v4().to_string(),
            chapter_id: uuid::Uuid::new_v4().to_string(),
            display_name: "Scene".into(),
            technical_label: "scene_one".into(),
            source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
            extra: Map::new(),
        };
        let source = b"label scene_one:\r\n    \"Hello \xe2\x98\x83\"\r\n    python:\r\n        score += 1\r\n    return\r\n";
        let (mapping, beats) =
            build_mapping(&scene, source, &sha256(source), None, &[], None).unwrap();
        assert_eq!(mapping.source_revision, sha256(source));
        assert_eq!(
            &source[beats[0].byte_start as usize..beats[0].byte_end as usize],
            b"    \"Hello \xe2\x98\x83\"\r\n"
        );
        assert!(beats.iter().any(|beat| beat.protected));
        assert_eq!(source, source.to_vec().as_slice());
    }

    #[test]
    fn approved_beat_subset_round_trips_without_runtime_evaluation() {
        let chapter_id = uuid::Uuid::new_v4().to_string();
        let scene_id = uuid::Uuid::new_v4().to_string();
        let destination_id = uuid::Uuid::new_v4().to_string();
        let character_id = uuid::Uuid::new_v4().to_string();
        let appearance_id = uuid::Uuid::new_v4().to_string();
        let appearance_asset_id = uuid::Uuid::new_v4().to_string();
        let background_id = uuid::Uuid::new_v4().to_string();
        let music_id = uuid::Uuid::new_v4().to_string();
        let sfx_id = uuid::Uuid::new_v4().to_string();
        let bool_id = uuid::Uuid::new_v4().to_string();
        let int_id = uuid::Uuid::new_v4().to_string();
        let string_id = uuid::Uuid::new_v4().to_string();
        let scene = SceneMetadata {
            id: scene_id.clone(),
            chapter_id: chapter_id.clone(),
            display_name: "Scene".into(),
            technical_label: "scene_one".into(),
            source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
            extra: Map::new(),
        };
        let destination = SceneMetadata {
            id: destination_id.clone(),
            chapter_id: chapter_id.clone(),
            display_name: "Destination".into(),
            technical_label: "scene_two".into(),
            source_path: "game/chapters/chapter_01/scene_002.rpy".into(),
            extra: Map::new(),
        };
        let project = ProjectMetadata {
            schema_version: PROJECT_SCHEMA_VERSION,
            project_id: uuid::Uuid::new_v4().to_string(),
            title: "Fixture".into(),
            folder_name: "fixture".into(),
            sdk: SdkIdentity {
                adapter: "renpy-8.5.3".into(),
                version: "8.5.3".into(),
                extra: Map::new(),
            },
            resolution: Resolution {
                width: 1280,
                height: 720,
            },
            capabilities: vec!["scene-authoring-v1".into()],
            chapters: vec![ChapterMetadata {
                id: chapter_id.clone(),
                display_name: "Chapter".into(),
                directory: "game/chapters/chapter_01".into(),
                extra: Map::new(),
            }],
            scenes: vec![scene.clone(), destination],
            entry_scene_id: Some(scene_id.clone()),
            last_open: Selection {
                chapter_id,
                scene_id,
            },
            extra: Map::new(),
        };
        let source_definition = |path: &str, statement: &str| SourceDefinition {
            path: path.into(),
            statement: statement.into(),
            source_revision: "0".repeat(64),
            extra: Map::new(),
        };
        let asset = |id: String, kind: AssetKind, name: &str| Asset {
            id,
            kind,
            display_name: name.into(),
            relative_path: format!("game/assets/{name}.dat"),
            discovery_name: name.into(),
            sha256: "0".repeat(64),
            byte_count: 1,
            status: "available".into(),
            extra: Map::new(),
        };
        let variable = |id: String,
                        technical_name: &str,
                        variable_type: VariableType,
                        default_value: Value| Variable {
            id,
            technical_name: technical_name.into(),
            variable_type,
            default_value,
            source: source_definition("game/definitions/variables.rpy", "unused"),
            extra: Map::new(),
        };
        let mut attributes = BTreeMap::new();
        attributes.insert("expression".into(), "happy".into());
        attributes.insert("outfit".into(), "default".into());
        attributes.insert("pose".into(), "default".into());
        let authoring = AuthoringMetadata {
            schema_version: 1,
            project_id: project.project_id.clone(),
            characters: vec![Character {
                id: character_id.clone(),
                technical_name: "alice".into(),
                display_name: "Alice".into(),
                dialogue_color: "#ffffff".into(),
                default_appearance_id: Some(appearance_id.clone()),
                source: source_definition("game/definitions/characters.rpy", "unused"),
                extra: Map::new(),
            }],
            appearances: vec![Appearance {
                id: appearance_id.clone(),
                character_id: character_id.clone(),
                label: "happy".into(),
                attributes,
                render_mode: "staticImportedAsset".into(),
                asset_id: appearance_asset_id.clone(),
                extra: Map::new(),
            }],
            assets: vec![
                asset(
                    appearance_asset_id,
                    AssetKind::CharacterAppearance,
                    "alice_happy",
                ),
                asset(background_id.clone(), AssetKind::Background, "bg_cafe"),
                asset(music_id.clone(), AssetKind::Music, "theme"),
                asset(sfx_id.clone(), AssetKind::Sfx, "bell"),
            ],
            variables: vec![
                variable(
                    bool_id.clone(),
                    "flag",
                    VariableType::Bool,
                    Value::Bool(false),
                ),
                variable(
                    int_id.clone(),
                    "score",
                    VariableType::Int,
                    Value::String("0".into()),
                ),
                variable(
                    string_id.clone(),
                    "name",
                    VariableType::String,
                    Value::String(String::new()),
                ),
            ],
            extra: Map::new(),
        };
        let loaded = Loaded {
            project: project.clone(),
            project_bytes: vec![],
            project_revision: Revision::expected_absence(),
            source_map: SourceMapMetadata {
                schema_version: SOURCE_MAP_SCHEMA_VERSION,
                project_id: project.project_id.clone(),
                sources: vec![],
                scene_mappings: vec![],
                extra: Map::new(),
            },
            source_map_bytes: vec![],
            source_map_revision: Revision::expected_absence(),
            authoring,
        };
        let payloads = vec![
            BeatPayload::Background {
                asset_id: background_id,
                transition: TransitionRef::Dissolve,
            },
            BeatPayload::ShowCharacter {
                character_id: character_id.clone(),
                appearance_id: appearance_id.clone(),
                placement: PlacementRef::Left,
                transition: TransitionRef::Fade,
            },
            BeatPayload::HideCharacter {
                character_id: character_id.clone(),
                transition: TransitionRef::None,
            },
            BeatPayload::ChangeAppearance {
                character_id: character_id.clone(),
                appearance_id,
                transition: TransitionRef::Dissolve,
            },
            BeatPayload::Placement {
                character_id: character_id.clone(),
                placement: PlacementRef::Right,
            },
            BeatPayload::Dialogue {
                character_id,
                text: "Hello\nworld ☃".into(),
            },
            BeatPayload::Narration {
                text: "Narration".into(),
            },
            BeatPayload::PlayMusic { asset_id: music_id },
            BeatPayload::StopMusic,
            BeatPayload::PlaySfx { asset_id: sfx_id },
            BeatPayload::Transition {
                transition: TransitionRef::Fade,
            },
            BeatPayload::SetVariable {
                variable_id: bool_id,
                value: Value::Bool(true),
            },
            BeatPayload::SetVariable {
                variable_id: int_id,
                value: Value::String("-9223372036854775808".into()),
            },
            BeatPayload::SetVariable {
                variable_id: string_id,
                value: Value::String("Loomlight".into()),
            },
            BeatPayload::Choice {
                options: vec![
                    ChoiceOption {
                        text: "One".into(),
                        destination_scene_id: destination_id.clone(),
                    },
                    ChoiceOption {
                        text: "Two".into(),
                        destination_scene_id: destination_id.clone(),
                    },
                    ChoiceOption {
                        text: "Three".into(),
                        destination_scene_id: destination_id.clone(),
                    },
                ],
            },
            BeatPayload::Jump {
                scene_id: destination_id,
            },
            BeatPayload::Return,
        ];
        let mut source = b"label scene_one:\n".to_vec();
        for payload in &payloads {
            source.extend_from_slice(render_payload(payload, &loaded, "\n").unwrap().as_bytes());
        }
        let (_, _, parsed) =
            parse_scene(&scene, &source, Some((&project, &loaded.authoring))).unwrap();
        assert_eq!(
            parsed
                .iter()
                .map(|beat| beat.payload.kind())
                .collect::<Vec<_>>(),
            payloads.iter().map(BeatPayload::kind).collect::<Vec<_>>()
        );
        assert_eq!(
            parsed.iter().map(|beat| &beat.payload).collect::<Vec<_>>(),
            payloads.iter().collect::<Vec<_>>()
        );
    }

    #[test]
    fn migration_is_transactional_preserves_ids_unknown_fields_and_reopens() {
        let mut fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        fixture.migrate();
        let first = fixture.workspace();
        assert_eq!(first.entry_scene_id, fixture.entry_scene_id);
        assert_eq!(first.scenes.len(), 1);
        assert_eq!(first.scenes[0].beats.len(), 2);
        let ids: Vec<_> = first.scenes[0]
            .beats
            .iter()
            .map(|beat| beat.id.clone())
            .collect();
        let project: Value =
            serde_json::from_slice(&fs::read(fixture.root.join(PROJECT_PATH)).unwrap()).unwrap();
        let map: Value =
            serde_json::from_slice(&fs::read(fixture.root.join(SOURCE_MAP_PATH)).unwrap()).unwrap();
        assert_eq!(project["futureProjectField"], "kept");
        assert_eq!(map["futureMapField"], true);
        assert_eq!(project["schemaVersion"], 2);
        assert_eq!(map["schemaVersion"], 2);
        fixture.service.unregister_project(&fixture.project);
        let reopened = fixture.service.register_project(&fixture.root).unwrap();
        fixture
            .service
            .ensure_phase_1e_metadata(&reopened, &fixture.project_id)
            .unwrap();
        let again = fixture
            .service
            .scene_workspace(&reopened, &fixture.project_id)
            .unwrap();
        assert_eq!(
            again.scenes[0]
                .beats
                .iter()
                .map(|beat| beat.id.clone())
                .collect::<Vec<_>>(),
            ids
        );
    }

    #[test]
    fn chapter_scene_lifecycle_history_and_rpyc_ghost_prevention_are_coherent() {
        let fixture = Fixture::new(b"label scene_one:\n    \"Hello\"\n    return\n");
        fixture.migrate();
        let first = fixture.workspace();
        let with_chapter = fixture
            .apply(
                &first,
                SceneCommand::CreateChapter {
                    display_name: "Chapter 2".into(),
                },
            )
            .unwrap();
        let chapter_two = with_chapter.chapters.last().unwrap().id.clone();
        let with_scene = fixture
            .apply(
                &with_chapter,
                SceneCommand::CreateScene {
                    chapter_id: chapter_two,
                    display_name: "Branch".into(),
                },
            )
            .unwrap();
        let created = with_scene
            .scenes
            .iter()
            .find(|scene| scene.id != fixture.entry_scene_id)
            .unwrap()
            .clone();
        fs::write(
            fixture.root.join(compiled_path(&created.source_path)),
            b"compiled ghost",
        )
        .unwrap();
        let deleted = fixture
            .apply(
                &with_scene,
                SceneCommand::DeleteScene {
                    scene_id: created.id.clone(),
                    expected_source_revision: created.source_revision.clone(),
                },
            )
            .unwrap();
        assert!(!fixture.root.join(&created.source_path).exists());
        assert!(!fixture
            .root
            .join(compiled_path(&created.source_path))
            .exists());
        assert_eq!(deleted.scenes.len(), 1);
        let restored = fixture.apply(&deleted, SceneCommand::Undo).unwrap();
        assert!(fixture.root.join(&created.source_path).is_file());
        assert_eq!(
            fs::read(fixture.root.join(compiled_path(&created.source_path))).unwrap(),
            b"compiled ghost"
        );
        assert!(restored.scenes.iter().any(|scene| scene.id == created.id));
        let deleted_again = fixture.apply(&restored, SceneCommand::Redo).unwrap();
        assert_eq!(deleted_again.scenes.len(), 1);
    }

    #[test]
    fn minimal_beat_patch_keeps_unrelated_bytes_and_round_trips_history() {
        let fixture = Fixture::new(b"label scene_one:\r\n    \"Hello\"\r\n    return\r\n");
        fixture.migrate();
        let before = fixture.workspace();
        let scene = &before.scenes[0];
        let return_id = scene
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Return))
            .unwrap()
            .id
            .clone();
        let edited = fixture
            .apply(
                &before,
                SceneCommand::InsertBeat {
                    scene_id: scene.id.clone(),
                    expected_source_revision: scene.source_revision.clone(),
                    before_beat_id: Some(return_id),
                    beat: BeatPayload::Narration {
                        text: "Snowman ☃".into(),
                    },
                },
            )
            .unwrap();
        let bytes = fs::read(fixture.root.join(&scene.source_path)).unwrap();
        assert_eq!(
            bytes,
            b"label scene_one:\r\n    \"Hello\"\r\n    \"Snowman \xe2\x98\x83\"\r\n    return\r\n"
        );
        let undone = fixture.apply(&edited, SceneCommand::Undo).unwrap();
        assert_eq!(
            fs::read(fixture.root.join(&scene.source_path)).unwrap(),
            b"label scene_one:\r\n    \"Hello\"\r\n    return\r\n"
        );
        let redone = fixture.apply(&undone, SceneCommand::Redo).unwrap();
        assert_eq!(redone.scenes[0].beats.len(), 3);
    }

    #[test]
    fn opaque_boundaries_incoming_edges_and_external_revisions_fail_closed() {
        let fixture =
            Fixture::new(b"label scene_one:\n    python:\n        score += 1\n    return\n");
        fixture.migrate();
        let workspace = fixture.workspace();
        let scene = &workspace.scenes[0];
        let return_beat = scene
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Return))
            .unwrap();
        assert!(matches!(
            fixture.apply(
                &workspace,
                SceneCommand::MoveBeat {
                    scene_id: scene.id.clone(),
                    expected_source_revision: scene.source_revision.clone(),
                    beat_id: return_beat.id.clone(),
                    direction: MoveDirection::Up,
                }
            ),
            Err(SceneError::OpaqueBoundary)
        ));

        let clean = Fixture::new(b"label scene_one:\n    return\n");
        clean.migrate();
        let first = clean.workspace();
        let chapter = first.chapters[0].id.clone();
        let with_scene = clean
            .apply(
                &first,
                SceneCommand::CreateScene {
                    chapter_id: chapter,
                    display_name: "Target".into(),
                },
            )
            .unwrap();
        let target = with_scene
            .scenes
            .iter()
            .find(|scene| scene.id != clean.entry_scene_id)
            .unwrap()
            .clone();
        let entry = with_scene
            .scenes
            .iter()
            .find(|scene| scene.id == clean.entry_scene_id)
            .unwrap();
        let return_id = entry.beats[0].id.clone();
        let linked = clean
            .apply(
                &with_scene,
                SceneCommand::InsertBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    before_beat_id: Some(return_id),
                    beat: BeatPayload::Jump {
                        scene_id: target.id.clone(),
                    },
                },
            )
            .unwrap();
        assert!(matches!(
            clean.apply(
                &linked,
                SceneCommand::DeleteScene {
                    scene_id: target.id.clone(),
                    expected_source_revision: target.source_revision.clone()
                }
            ),
            Err(SceneError::ReferenceBlocked)
        ));
        let current_entry = linked
            .scenes
            .iter()
            .find(|scene| scene.id == clean.entry_scene_id)
            .unwrap();
        fs::write(
            clean.root.join(&current_entry.source_path),
            b"label scene_one:\n    \"external\"\n    return\n",
        )
        .unwrap();
        let conflicted = clean.workspace();
        assert!(
            conflicted
                .scenes
                .iter()
                .find(|scene| scene.id == clean.entry_scene_id)
                .unwrap()
                .source_conflict
        );
        assert!(matches!(
            clean.apply(
                &conflicted,
                SceneCommand::InsertBeat {
                    scene_id: current_entry.id.clone(),
                    expected_source_revision: conflicted
                        .scenes
                        .iter()
                        .find(|scene| scene.id == clean.entry_scene_id)
                        .unwrap()
                        .source_revision
                        .clone(),
                    before_beat_id: None,
                    beat: BeatPayload::Return,
                }
            ),
            Err(SceneError::SourceConflict)
        ));
    }

    #[test]
    fn choice_destination_creation_is_one_semantic_transaction() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        fixture.migrate();
        let first = fixture.workspace();
        let chapter_id = first.chapters[0].id.clone();
        let with_target = fixture
            .apply(
                &first,
                SceneCommand::CreateScene {
                    chapter_id: chapter_id.clone(),
                    display_name: "Existing destination".into(),
                },
            )
            .unwrap();
        let entry = with_target
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        let existing = with_target
            .scenes
            .iter()
            .find(|scene| scene.id != fixture.entry_scene_id)
            .unwrap();
        let with_choice = fixture
            .apply(
                &with_target,
                SceneCommand::InsertBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    before_beat_id: None,
                    beat: BeatPayload::Choice {
                        options: vec![ChoiceOption {
                            text: "Take the first path".into(),
                            destination_scene_id: existing.id.clone(),
                        }],
                    },
                },
            )
            .unwrap();
        let entry = with_choice
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        assert!(matches!(
            entry.beats.last().unwrap().payload,
            BeatPayload::Choice { .. }
        ));
        let entry_source = fs::read_to_string(fixture.root.join(&entry.source_path)).unwrap();
        assert!(!entry_source.contains("    return\n"));
        let choice_id = entry
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Choice { .. }))
            .unwrap()
            .id
            .clone();
        assert!(matches!(
            fixture.apply(
                &with_choice,
                SceneCommand::RemoveBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    beat_id: choice_id.clone(),
                }
            ),
            Err(SceneError::InvariantBlocked)
        ));
        assert!(matches!(
            fixture.apply(
                &with_choice,
                SceneCommand::UpdateBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    beat_id: choice_id.clone(),
                    beat: BeatPayload::Narration {
                        text: "Not a terminal".into(),
                    },
                }
            ),
            Err(SceneError::InvariantBlocked)
        ));
        let expanded = fixture
            .apply(
                &with_choice,
                SceneCommand::CreateSceneFromChoice {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    choice_beat_id: choice_id,
                    option_text: "Create a new path".into(),
                    chapter_id,
                    display_name: "Created from Choice".into(),
                },
            )
            .unwrap();
        assert_eq!(expanded.scenes.len(), 3);
        let created = expanded
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Created from Choice")
            .unwrap();
        assert!(fixture.root.join(&created.source_path).is_file());
        let source_scene = expanded
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        let BeatPayload::Choice { options } = &source_scene
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Choice { .. }))
            .unwrap()
            .payload
        else {
            panic!("choice was not preserved")
        };
        assert_eq!(options.len(), 2);
        assert_eq!(options[1].destination_scene_id, created.id);
        assert!(matches!(
            fixture.apply(
                &expanded,
                SceneCommand::DeleteScene {
                    scene_id: created.id.clone(),
                    expected_source_revision: created.source_revision.clone(),
                }
            ),
            Err(SceneError::ReferenceBlocked)
        ));

        let undone = fixture.apply(&expanded, SceneCommand::Undo).unwrap();
        assert_eq!(undone.scenes.len(), 2);
        assert!(!fixture.root.join(&created.source_path).exists());
        let BeatPayload::Choice { options } = &undone
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap()
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Choice { .. }))
            .unwrap()
            .payload
        else {
            panic!("choice was not restored")
        };
        assert_eq!(options.len(), 1);
    }

    #[test]
    fn continue_dialogue_commits_the_burst_and_next_beat_together() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        fixture.migrate();
        let authoring = fixture
            .service
            .create_character(
                &fixture.project,
                &fixture.project_id,
                CreateCharacterRequest {
                    technical_name: "alice".into(),
                    display_name: "Alice".into(),
                    dialogue_color: "#ffffff".into(),
                },
            )
            .unwrap();
        let character_id = authoring.characters[0].id.clone();
        let first = fixture.workspace();
        let entry = &first.scenes[0];
        let with_dialogue = fixture
            .apply(
                &first,
                SceneCommand::InsertBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    before_beat_id: None,
                    beat: BeatPayload::Dialogue {
                        character_id: character_id.clone(),
                        text: "Draft".into(),
                    },
                },
            )
            .unwrap();
        let entry = &with_dialogue.scenes[0];
        let dialogue = entry
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Dialogue { .. }))
            .unwrap();
        let continued = fixture
            .apply(
                &with_dialogue,
                SceneCommand::ContinueDialogue {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    beat_id: dialogue.id.clone(),
                    character_id,
                    text: "Committed".into(),
                },
            )
            .unwrap();
        let dialogues: Vec<_> = continued.scenes[0]
            .beats
            .iter()
            .filter_map(|beat| match &beat.payload {
                BeatPayload::Dialogue { text, .. } => Some(text.as_str()),
                _ => None,
            })
            .collect();
        assert_eq!(dialogues, ["Committed", ""]);
        let undone = fixture.apply(&continued, SceneCommand::Undo).unwrap();
        let dialogues: Vec<_> = undone.scenes[0]
            .beats
            .iter()
            .filter_map(|beat| match &beat.payload {
                BeatPayload::Dialogue { text, .. } => Some(text.as_str()),
                _ => None,
            })
            .collect();
        assert_eq!(dialogues, ["Draft"]);
    }

    #[test]
    fn representative_branching_project_is_authored_and_reopened_through_services() {
        let mut fixture = Fixture::new(
            b"label scene_one:\n    python:\n        persistent.custom_flag = True\n    return\n",
        );
        fixture.migrate();
        let authored = fixture
            .service
            .create_character(
                &fixture.project,
                &fixture.project_id,
                CreateCharacterRequest {
                    technical_name: "alice".into(),
                    display_name: "Alice".into(),
                    dialogue_color: "#aabbcc".into(),
                },
            )
            .unwrap();
        let character_id = authored.characters[0].id.clone();
        for (name, variable_type, default_value) in [
            ("flag", VariableType::Bool, Value::Bool(false)),
            ("score", VariableType::Int, Value::String("0".into())),
            (
                "player_name",
                VariableType::String,
                Value::String("Player".into()),
            ),
        ] {
            fixture
                .service
                .create_variable(
                    &fixture.project,
                    &fixture.project_id,
                    CreateVariableRequest {
                        technical_name: name.into(),
                        variable_type,
                        default_value,
                    },
                )
                .unwrap();
        }
        let mut png = vec![137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13];
        png.extend_from_slice(b"IHDR");
        png.extend_from_slice(&1920u32.to_be_bytes());
        png.extend_from_slice(&1080u32.to_be_bytes());
        png.extend_from_slice(&[8, 6, 0, 0, 0]);
        let mut appearance_png = png.clone();
        appearance_png.push(1);
        let mut background_png = png;
        background_png.push(2);
        let imports = vec![
            (
                "appearance.png",
                appearance_png,
                AssetKind::CharacterAppearance,
                "happy",
                "Alice Happy",
                Some(character_id.clone()),
                Some("happy".into()),
            ),
            (
                "cafe.png",
                background_png,
                AssetKind::Background,
                "cafe",
                "Cafe",
                None,
                None,
            ),
            (
                "theme.ogg",
                b"OggSmusic".to_vec(),
                AssetKind::Music,
                "theme",
                "Theme",
                None,
                None,
            ),
            (
                "bell.wav",
                b"RIFF0000WAVEsound".to_vec(),
                AssetKind::Sfx,
                "bell",
                "Bell",
                None,
                None,
            ),
        ];
        for (name, bytes, kind, technical_name, display_name, character_id, expression) in imports {
            let selected_path = fixture.root.join(name);
            fs::write(&selected_path, &bytes).unwrap();
            let selected = fixture
                .service
                .select_import(&fixture.project, &selected_path)
                .unwrap();
            fixture
                .service
                .import_asset(
                    &fixture.project,
                    &fixture.project_id,
                    ImportAssetRequest {
                        authority_id: selected.authority_id,
                        kind,
                        technical_name: technical_name.into(),
                        display_name: display_name.into(),
                        character_id,
                        expression,
                    },
                )
                .unwrap();
        }
        let media_model = fixture
            .service
            .list(&fixture.project, &fixture.project_id)
            .unwrap();
        for (kind, purpose) in [
            (AssetKind::Background, MediaPurpose::ImagePreview),
            (AssetKind::Music, MediaPurpose::AudioAudition),
        ] {
            let asset = media_model
                .assets
                .iter()
                .find(|asset| asset.kind == kind)
                .unwrap();
            let presented = fixture
                .service
                .media_present(
                    &fixture.project,
                    &fixture.project_id,
                    MediaRequest {
                        asset_id: asset.id.clone(),
                        purpose,
                    },
                )
                .unwrap();
            assert_eq!(presented.sha256, asset.sha256);
            assert!(!presented.data_base64.is_empty());
        }
        let mut workspace = fixture.workspace();
        let chapter_one = workspace.chapters[0].id.clone();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::CreateChapter {
                    display_name: "Branches".into(),
                },
            )
            .unwrap();
        let chapter_two = workspace.chapters[1].id.clone();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::CreateScene {
                    chapter_id: chapter_one,
                    display_name: "Garden".into(),
                },
            )
            .unwrap();
        let garden = workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Garden")
            .unwrap()
            .clone();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::MoveScene {
                    scene_id: garden.id.clone(),
                    chapter_id: chapter_two.clone(),
                    direction: None,
                    expected_source_revision: garden.source_revision,
                },
            )
            .unwrap();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::CreateScene {
                    chapter_id: chapter_two.clone(),
                    display_name: "Library".into(),
                },
            )
            .unwrap();
        let garden_id = workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Garden")
            .unwrap()
            .id
            .clone();
        let library_id = workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Library")
            .unwrap()
            .id
            .clone();
        let authoring = &workspace.authoring;
        let appearance_id = authoring.appearances[0].id.clone();
        let asset_id = |kind| {
            authoring
                .assets
                .iter()
                .find(|asset| asset.kind == kind)
                .unwrap()
                .id
                .clone()
        };
        let variable_id = |name: &str| {
            authoring
                .variables
                .iter()
                .find(|variable| variable.technical_name == name)
                .unwrap()
                .id
                .clone()
        };
        let payloads = vec![
            BeatPayload::Background {
                asset_id: asset_id(AssetKind::Background),
                transition: TransitionRef::Dissolve,
            },
            BeatPayload::ShowCharacter {
                character_id: character_id.clone(),
                appearance_id: appearance_id.clone(),
                placement: PlacementRef::Left,
                transition: TransitionRef::None,
            },
            BeatPayload::Placement {
                character_id: character_id.clone(),
                placement: PlacementRef::Centre,
            },
            BeatPayload::ChangeAppearance {
                character_id: character_id.clone(),
                appearance_id,
                transition: TransitionRef::Fade,
            },
            BeatPayload::Dialogue {
                character_id: character_id.clone(),
                text: "Where should we go?".into(),
            },
            BeatPayload::Narration {
                text: "The bell rings.".into(),
            },
            BeatPayload::PlayMusic {
                asset_id: asset_id(AssetKind::Music),
            },
            BeatPayload::PlaySfx {
                asset_id: asset_id(AssetKind::Sfx),
            },
            BeatPayload::StopMusic,
            BeatPayload::Transition {
                transition: TransitionRef::Dissolve,
            },
            BeatPayload::SetVariable {
                variable_id: variable_id("flag"),
                value: Value::Bool(true),
            },
            BeatPayload::SetVariable {
                variable_id: variable_id("score"),
                value: Value::String("9223372036854775807".into()),
            },
            BeatPayload::SetVariable {
                variable_id: variable_id("player_name"),
                value: Value::String("Aki".into()),
            },
            BeatPayload::HideCharacter {
                character_id,
                transition: TransitionRef::Fade,
            },
        ];
        for payload in payloads {
            let entry = workspace
                .scenes
                .iter()
                .find(|scene| scene.id == fixture.entry_scene_id)
                .unwrap();
            workspace = fixture
                .apply(
                    &workspace,
                    SceneCommand::InsertBeat {
                        scene_id: entry.id.clone(),
                        expected_source_revision: entry.source_revision.clone(),
                        before_beat_id: None,
                        beat: payload,
                    },
                )
                .unwrap();
        }
        let entry = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::InsertBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    before_beat_id: None,
                    beat: BeatPayload::Choice {
                        options: vec![
                            ChoiceOption {
                                text: "Garden".into(),
                                destination_scene_id: garden_id.clone(),
                            },
                            ChoiceOption {
                                text: "Library".into(),
                                destination_scene_id: library_id.clone(),
                            },
                        ],
                    },
                },
            )
            .unwrap();
        let entry = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        let choice = entry
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, BeatPayload::Choice { .. }))
            .unwrap();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::CreateSceneFromChoice {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    choice_beat_id: choice.id.clone(),
                    option_text: "A new road".into(),
                    chapter_id: chapter_two,
                    display_name: "Created from Choice".into(),
                },
            )
            .unwrap();
        let garden = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == garden_id)
            .unwrap();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::InsertBeat {
                    scene_id: garden.id.clone(),
                    expected_source_revision: garden.source_revision.clone(),
                    before_beat_id: None,
                    beat: BeatPayload::Jump {
                        scene_id: library_id,
                    },
                },
            )
            .unwrap();
        let entry = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        let movable = entry
            .beats
            .iter()
            .rev()
            .find(|beat| !beat.protected && !is_terminal_payload(&beat.payload))
            .unwrap();
        workspace = fixture
            .apply(
                &workspace,
                SceneCommand::MoveBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    beat_id: movable.id.clone(),
                    direction: MoveDirection::Up,
                },
            )
            .unwrap();
        workspace = fixture.apply(&workspace, SceneCommand::Undo).unwrap();
        workspace = fixture.apply(&workspace, SceneCommand::Redo).unwrap();
        let entry = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == fixture.entry_scene_id)
            .unwrap();
        assert!(entry.partial);
        assert!(matches!(
            &entry.beats.last().unwrap().payload,
            BeatPayload::Choice { options } if options.len() == 3
        ));
        let garden = workspace
            .scenes
            .iter()
            .find(|scene| scene.id == garden_id)
            .unwrap();
        assert!(matches!(
            garden.beats.last().unwrap().payload,
            BeatPayload::Jump { .. }
        ));
        assert!(workspace.scenes.iter().any(|scene| {
            scene.id != fixture.entry_scene_id
                && scene.id != garden_id
                && matches!(
                    scene.beats.last().map(|beat| &beat.payload),
                    Some(BeatPayload::Return)
                )
        }));
        let exact_custom = b"    python:\n        persistent.custom_flag = True\n";
        assert!(fs::read(fixture.root.join(&entry.source_path))
            .unwrap()
            .windows(exact_custom.len())
            .any(|window| window == exact_custom));
        let scene_ids: Vec<_> = workspace
            .scenes
            .iter()
            .map(|scene| scene.id.clone())
            .collect();
        fixture.service.unregister_project(&fixture.project);
        let reopened_id = fixture.service.register_project(&fixture.root).unwrap();
        fixture
            .service
            .ensure_phase_1e_metadata(&reopened_id, &fixture.project_id)
            .unwrap();
        let reopened = fixture
            .service
            .scene_workspace(&reopened_id, &fixture.project_id)
            .unwrap();
        assert_eq!(
            reopened
                .scenes
                .iter()
                .map(|scene| scene.id.clone())
                .collect::<Vec<_>>(),
            scene_ids
        );
        assert!(!reopened.can_undo && !reopened.can_redo);
        assert_eq!(reopened.last_open.scene_id, workspace.last_open.scene_id);
    }

    #[test]
    fn media_presentation_refuses_unsupported_oversize_and_traversal_states() {
        let mut fixture = Fixture::new(b"label scene_one:\n    return\n");
        fixture.migrate();
        let mut too_wide = vec![137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13];
        too_wide.extend_from_slice(b"IHDR");
        too_wide.extend_from_slice(&8193u32.to_be_bytes());
        too_wide.extend_from_slice(&1u32.to_be_bytes());
        too_wide.extend_from_slice(&[8, 6, 0, 0, 0]);
        let mut too_large = vec![0u8; 16 * 1024 * 1024 + 1];
        too_large[..4].copy_from_slice(b"OggS");
        for (filename, bytes, kind, technical, display) in [
            (
                "active.webp",
                b"RIFFactiveWEBP".to_vec(),
                AssetKind::Background,
                "active",
                "Unsupported WebP",
            ),
            (
                "wide.png",
                too_wide,
                AssetKind::Background,
                "wide",
                "Too Wide",
            ),
            (
                "large.ogg",
                too_large,
                AssetKind::Music,
                "large",
                "Too Large",
            ),
        ] {
            let source = fixture.root.join(filename);
            fs::write(&source, bytes).unwrap();
            let selected = fixture
                .service
                .select_import(&fixture.project, &source)
                .unwrap();
            fixture
                .service
                .import_asset(
                    &fixture.project,
                    &fixture.project_id,
                    ImportAssetRequest {
                        authority_id: selected.authority_id,
                        kind,
                        technical_name: technical.into(),
                        display_name: display.into(),
                        character_id: None,
                        expression: None,
                    },
                )
                .unwrap();
        }
        let model = fixture
            .service
            .list(&fixture.project, &fixture.project_id)
            .unwrap();
        let request = |display: &str, purpose| MediaRequest {
            asset_id: model
                .assets
                .iter()
                .find(|asset| asset.display_name == display)
                .unwrap()
                .id
                .clone(),
            purpose,
        };
        assert_eq!(
            fixture.service.media_present(
                &fixture.project,
                &fixture.project_id,
                request("Unsupported WebP", MediaPurpose::Thumbnail)
            ),
            Err(MediaError::UnsupportedFormat)
        );
        assert_eq!(
            fixture.service.media_present(
                &fixture.project,
                &fixture.project_id,
                request("Too Wide", MediaPurpose::ImagePreview)
            ),
            Err(MediaError::InvalidDimensions)
        );
        assert_eq!(
            fixture.service.media_present(
                &fixture.project,
                &fixture.project_id,
                request("Too Large", MediaPurpose::AudioAudition)
            ),
            Err(MediaError::Oversize)
        );

        let traversed_id = model.assets[0].id.clone();
        let metadata_path = fixture.root.join(".renpy-editor/authoring.json");
        let mut metadata: Value =
            serde_json::from_slice(&fs::read(&metadata_path).unwrap()).unwrap();
        metadata["assets"][0]["relativePath"] = Value::String("../outside.png".into());
        fs::write(
            &metadata_path,
            serde_json::to_vec_pretty(&metadata).unwrap(),
        )
        .unwrap();
        assert_eq!(
            fixture.service.media_present(
                &fixture.project,
                &fixture.project_id,
                MediaRequest {
                    asset_id: traversed_id,
                    purpose: MediaPurpose::Thumbnail
                }
            ),
            Err(MediaError::Io)
        );
    }

    #[cfg(unix)]
    #[test]
    fn media_presentation_refuses_symlink_substitution() {
        use std::os::unix::fs::symlink;
        let mut fixture = Fixture::new(b"label scene_one:\n    return\n");
        fixture.migrate();
        let mut png = vec![137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13];
        png.extend_from_slice(b"IHDR");
        png.extend_from_slice(&1u32.to_be_bytes());
        png.extend_from_slice(&1u32.to_be_bytes());
        png.extend_from_slice(&[8, 6, 0, 0, 0]);
        let selected_path = fixture.root.join("safe.png");
        fs::write(&selected_path, &png).unwrap();
        let selected = fixture
            .service
            .select_import(&fixture.project, &selected_path)
            .unwrap();
        let model = fixture
            .service
            .import_asset(
                &fixture.project,
                &fixture.project_id,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::Background,
                    technical_name: "safe".into(),
                    display_name: "Safe".into(),
                    character_id: None,
                    expression: None,
                },
            )
            .unwrap();
        let asset = model.assets[0].clone();
        let destination = fixture.root.join(&asset.relative_path);
        fs::remove_file(&destination).unwrap();
        symlink(&selected_path, &destination).unwrap();
        assert_eq!(
            fixture.service.media_present(
                &fixture.project,
                &fixture.project_id,
                MediaRequest {
                    asset_id: asset.id,
                    purpose: MediaPurpose::ImagePreview
                }
            ),
            Err(MediaError::UnsafeAsset)
        );
    }

    #[test]
    fn failed_inverse_does_not_advance_history_or_overwrite_external_metadata() {
        let fixture = Fixture::new(b"label scene_one:\n    return\n");
        fixture.migrate();
        let before = fixture.workspace();
        let changed = fixture
            .apply(
                &before,
                SceneCommand::CreateChapter {
                    display_name: "Chapter 2".into(),
                },
            )
            .unwrap();
        let external = b"external metadata bytes";
        fs::write(fixture.root.join(PROJECT_PATH), external).unwrap();
        assert!(matches!(
            fixture.apply(&changed, SceneCommand::Undo),
            Err(SceneError::HistoryBoundary)
        ));
        assert_eq!(fs::read(fixture.root.join(PROJECT_PATH)).unwrap(), external);
        assert!(matches!(
            fixture.apply(&changed, SceneCommand::Undo),
            Err(SceneError::HistoryBoundary)
        ));
    }
}
