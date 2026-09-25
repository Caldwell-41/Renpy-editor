use crate::{
    authoring::{
        AuthoringError, AuthoringMetadata, AuthoringService, CreateCharacterRequest,
        CreateVariableRequest, ImportAssetRequest, ImportChoice, PersistenceStatus,
        SetDefaultAppearanceRequest, UpdateCharacterRequest, UpdateVariableRequest,
    },
    media::{MediaError, MediaPresentation, MediaRequest},
    metadata::{
        ChapterMetadata, ProjectMetadata, Resolution, SceneMetadata, SdkIdentity, Selection,
        SourceMapMetadata, PROJECT_SCHEMA_VERSION, SOURCE_MAP_SCHEMA_VERSION,
    },
    renpy::{
        discover_managed_sdk, install_supported_sdk, RenpyAdapter, RenpyError, SdkInfo,
        ValidatedSdk, SUPPORTED_VERSION,
    },
    scene::{RecoveryResolveRequest, SceneCommandRequest, SceneError, SceneWorkspace},
    source::{
        SourceApplyBothRequest, SourceDocument, SourceDraftRequest, SourceError, SourceInventory,
        SourceOpenRequest, SourcePathRequest, SourceSaveRequest,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::Map;
use std::{
    collections::HashMap,
    ffi::OsStr,
    fs::{self, File, OpenOptions},
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::{SystemTime, UNIX_EPOCH},
};

const RECENT_SCHEMA_VERSION: u32 = 1;
const STAGE_MARKER: &str = ".loomlight-stage-owner";

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParentChoice {
    pub id: String,
    pub display_path: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DestinationPreview {
    pub valid: bool,
    pub display_path: String,
    pub message: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateProjectRequest {
    pub parent_id: String,
    pub title: String,
    pub folder_name: String,
    pub sdk_id: String,
    pub width: u32,
    pub height: u32,
    pub initialize_git: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenProject {
    pub session_id: String,
    pub project_id: String,
    pub title: String,
    pub folder_name: String,
    pub chapter_id: String,
    pub chapter_name: String,
    pub scene_id: String,
    pub scene_name: String,
    pub sdk_version: String,
    pub resolution: Resolution,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RecentStore {
    schema_version: u32,
    entries: Vec<RecentRecord>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RecentRecord {
    id: String,
    project_id: String,
    title: String,
    path: PathBuf,
    last_opened_unix_ms: u64,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentProject {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub display_path: String,
    pub last_opened_unix_ms: u64,
    pub status: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationResult {
    pub status: String,
    pub project: Option<OpenProject>,
}

#[derive(Debug)]
pub enum LifecycleError {
    InvalidParent,
    InvalidName,
    ExistingDestination,
    UnsafePath,
    UnknownAuthority,
    InvalidMetadata,
    UnsupportedSdk,
    GitUnavailable,
    GenerationFailed,
    PromotionFailed,
    CreatedNotOpened,
    RecoveryRequired,
    StaleSession,
    Authoring(AuthoringError),
    Scene(SceneError),
    Source(SourceError),
    Media(MediaError),
    Io,
}

struct ParentAnchor {
    path: PathBuf,
    file: File,
    identity: FileIdentity,
}

struct StageAnchor {
    path: PathBuf,
    name: String,
    token: String,
    file: Option<File>,
    identity: FileIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct FileIdentity {
    a: u64,
    b: u64,
}

pub struct LifecycleService {
    data_root: PathBuf,
    data_anchor: crate::transaction::DirectoryAnchor,
    parents: HashMap<String, ParentAnchor>,
    sdks: HashMap<String, ValidatedSdk>,
    current: Option<(PathBuf, OpenProject, crate::transaction::ProjectId)>,
    authoring: AuthoringService,
}

struct InspectedProject {
    root: PathBuf,
    project: OpenProject,
    anchor: crate::transaction::DirectoryAnchor,
}

impl crate::ports::ProjectFilesystemPort for LifecycleService {
    fn validate_destination(
        &self,
        parent_id: &str,
        folder_name: &str,
    ) -> Result<DestinationPreview, LifecycleError> {
        LifecycleService::validate_destination(self, parent_id, folder_name)
    }
    fn list_recent(&self) -> Vec<RecentProject> {
        LifecycleService::list_recent(self)
    }
    fn current(&self) -> Option<OpenProject> {
        LifecycleService::current(self)
    }
}

impl crate::ports::RenpyPort for LifecycleService {
    fn discover_supported(&mut self) -> Vec<SdkInfo> {
        self.discover_sdks()
    }
    fn install_supported(&mut self) -> Result<SdkInfo, LifecycleError> {
        self.install_sdk()
    }
}

struct LocalGit<'a> {
    stage_anchor: &'a File,
}

impl crate::ports::GitPort for LocalGit<'_> {
    fn initialise_new_repository(&self, stage: &Path) -> Result<(), LifecycleError> {
        initialise_git_with_anchor("git", stage, Some(self.stage_anchor))
    }
}

impl LifecycleService {
    pub fn new(data_root: PathBuf) -> Result<Self, LifecycleError> {
        fs::create_dir_all(&data_root).map_err(|_| LifecycleError::Io)?;
        let data_root = fs::canonicalize(data_root).map_err(|_| LifecycleError::Io)?;
        let data_anchor = crate::transaction::DirectoryAnchor::open_root(&data_root)
            .map_err(|_| LifecycleError::UnsafePath)?;
        Ok(Self {
            data_root,
            data_anchor,
            parents: HashMap::new(),
            sdks: HashMap::new(),
            current: None,
            authoring: AuthoringService::default(),
        })
    }

    pub fn register_parent(&mut self, selected: &Path) -> Result<ParentChoice, LifecycleError> {
        let anchor = open_parent(selected)?;
        let id = uuid::Uuid::new_v4().to_string();
        let result = ParentChoice {
            id: id.clone(),
            display_path: anchor.path.to_string_lossy().into_owned(),
        };
        self.parents.insert(id, anchor);
        Ok(result)
    }

    pub fn validate_destination(
        &self,
        parent_id: &str,
        folder_name: &str,
    ) -> Result<DestinationPreview, LifecycleError> {
        let parent = self
            .parents
            .get(parent_id)
            .ok_or(LifecycleError::UnknownAuthority)?;
        validate_parent(parent)?;
        validate_folder_name(folder_name)?;
        let destination = parent.path.join(folder_name);
        let exists = fs::symlink_metadata(&destination).is_ok();
        Ok(DestinationPreview {
            valid: !exists,
            display_path: destination.to_string_lossy().into_owned(),
            message: if exists {
                "A file or folder already exists at this location."
            } else {
                "Destination is available."
            }
            .into(),
        })
    }

    pub fn register_sdk(
        &mut self,
        selected: &Path,
        source: &str,
    ) -> Result<SdkInfo, LifecycleError> {
        match RenpyAdapter::validate_sdk(selected) {
            Ok(sdk) => Ok(self.remember_sdk(sdk, source)),
            Err(RenpyError::UnsupportedVersion(version)) => Ok(SdkInfo { id: String::new(), version: version.clone(), display_name: format!("Ren'Py {version}"), source: source.into(), compatible: false, explanation: format!("Ren'Py {version} is not supported. Loomlight currently requires {SUPPORTED_VERSION}.") }),
            Err(_) => Err(LifecycleError::UnsupportedSdk),
        }
    }

    pub fn discover_sdks(&mut self) -> Vec<SdkInfo> {
        match discover_managed_sdk(&self.data_root) {
            Ok(Some(sdk)) => vec![self.remember_sdk(sdk, "managed")],
            Ok(None) | Err(_) => Vec::new(),
        }
    }

    pub fn install_sdk(&mut self) -> Result<SdkInfo, LifecycleError> {
        let sdk =
            install_supported_sdk(&self.data_root).map_err(|_| LifecycleError::UnsupportedSdk)?;
        Ok(self.remember_sdk(sdk, "managed"))
    }

    fn remember_sdk(&mut self, sdk: ValidatedSdk, source: &str) -> SdkInfo {
        if let Some((id, existing)) = self
            .sdks
            .iter()
            .find(|(_, existing)| existing.same_identity(&sdk))
        {
            return sdk_info(id, existing, source);
        }
        let id = uuid::Uuid::new_v4().to_string();
        let info = sdk_info(&id, &sdk, source);
        self.sdks.insert(id, sdk);
        info
    }

    pub fn create_project(
        &mut self,
        request: CreateProjectRequest,
    ) -> Result<CreationResult, LifecycleError> {
        validate_title(&request.title)?;
        validate_folder_name(&request.folder_name)?;
        let resolution = Resolution {
            width: request.width,
            height: request.height,
        };
        resolution
            .validate()
            .map_err(|_| LifecycleError::InvalidName)?;
        let parent = self
            .parents
            .get(&request.parent_id)
            .ok_or(LifecycleError::UnknownAuthority)?;
        validate_parent(parent)?;
        let sdk = self
            .sdks
            .get(&request.sdk_id)
            .ok_or(LifecycleError::UnknownAuthority)?
            .clone();
        let final_path = parent.path.join(&request.folder_name);
        ensure_absent(&final_path)?;
        let token = uuid::Uuid::new_v4().to_string();
        let stage_name = format!(".loomlight-stage-{token}");
        let mut stage = create_project_stage(parent, stage_name, token, || Ok(()))?;
        let prepared = (|| {
            validate_stage_identity(&stage)?;
            sdk.revalidate(true)
                .map_err(|_| LifecycleError::UnsupportedSdk)?;
            RenpyAdapter::generate_starter_anchored(
                &sdk,
                &stage.path,
                stage_file(&stage)?,
                resolution.width,
                resolution.height,
            )
            .map_err(|_| LifecycleError::GenerationFailed)?;
            #[cfg(test)]
            eprintln!("phase-1c-create-checkpoint: generated");
            validate_stage_identity(&stage)?;
            let metadata = apply_overlay(
                &stage,
                &request.title,
                &request.folder_name,
                resolution.clone(),
            )?;
            validate_stage_identity(&stage)?;
            #[cfg(test)]
            eprintln!("phase-1c-create-checkpoint: overlay");
            if request.initialize_git {
                validate_stage_identity(&stage)?;
                crate::ports::GitPort::initialise_new_repository(
                    &LocalGit {
                        stage_anchor: stage_file(&stage)?,
                    },
                    &stage.path,
                )?;
                validate_stage_identity(&stage)?;
            }
            #[cfg(test)]
            eprintln!("phase-1c-create-checkpoint: git");
            validate_stage_identity(&stage)?;
            sdk.revalidate(false)
                .map_err(|_| LifecycleError::UnsupportedSdk)?;
            RenpyAdapter::validate_generated_anchored(&sdk, &stage.path, stage_file(&stage)?)
                .map_err(|_| LifecycleError::GenerationFailed)?;
            #[cfg(test)]
            eprintln!("phase-1c-create-checkpoint: validated");
            validate_stage_identity(&stage)?;
            promote_anchored_stage(parent, &mut stage, &request.folder_name)?;
            #[cfg(test)]
            eprintln!("phase-1c-create-checkpoint: promoted");
            let inspected = inspect_valid_project(&final_path)?;
            if inspected.project.project_id != metadata.project_id {
                return Err(LifecycleError::CreatedNotOpened);
            }
            Ok(inspected)
        })();
        if prepared.is_err() && stage.path.exists() {
            let _ = cleanup_stage(parent, &mut stage);
        }
        let inspected = prepared?;
        let opened = self
            .activate_project(inspected)
            .map_err(|_| LifecycleError::CreatedNotOpened)?;
        Ok(CreationResult {
            status: "complete".into(),
            project: Some(opened),
        })
    }

    pub fn open_path(&mut self, selected: &Path) -> Result<OpenProject, LifecycleError> {
        let root = canonical_safe_directory(selected)?;
        let inspected = inspect_valid_project(&root)?;
        self.activate_project(inspected)
    }

    pub fn open_recent(&mut self, recent_id: &str) -> Result<OpenProject, LifecycleError> {
        let store = self.read_recent();
        let record = store
            .entries
            .iter()
            .find(|entry| entry.id == recent_id)
            .ok_or(LifecycleError::InvalidMetadata)?;
        let root = record.path.clone();
        let inspected = inspect_valid_project(&canonical_safe_directory(&root)?)?;
        self.activate_project(inspected)
    }

    pub fn close(&mut self) -> Result<(), LifecycleError> {
        if self
            .current
            .as_ref()
            .is_some_and(|(_, _, authority)| self.authoring.has_dirty_sources(authority))
        {
            return Err(LifecycleError::Source(SourceError::DirtySource));
        }
        if let Some((_, _, authority)) = self.current.take() {
            self.authoring.unregister_project(&authority);
        }
        Ok(())
    }
    pub fn current(&self) -> Option<OpenProject> {
        self.current.as_ref().map(|(_, project, _)| project.clone())
    }

    fn activate_project(
        &mut self,
        mut inspected: InspectedProject,
    ) -> Result<OpenProject, LifecycleError> {
        if self
            .current
            .as_ref()
            .is_some_and(|(_, _, authority)| self.authoring.has_dirty_sources(authority))
        {
            return Err(LifecycleError::Source(SourceError::DirtySource));
        }
        let authority = self
            .authoring
            .register_inspected_project(inspected.root.clone(), inspected.anchor)
            .map_err(|error| match error {
                AuthoringError::RecoveryRequired => LifecycleError::RecoveryRequired,
                other => LifecycleError::Authoring(other),
            })?;
        let persistence = self.authoring.status(&authority);
        if persistence != PersistenceStatus::Saved && self.current.is_some() {
            self.authoring.unregister_project(&authority);
            return Err(LifecycleError::RecoveryRequired);
        }
        if persistence == PersistenceStatus::Saved {
            if let Err(error) = self
                .authoring
                .ensure_phase_1e_metadata(&authority, &inspected.project.project_id)
            {
                self.authoring.unregister_project(&authority);
                return Err(LifecycleError::Scene(error));
            }
        }
        inspected.project.session_id = uuid::Uuid::new_v4().to_string();
        if let Err(error) = self.update_recent(&inspected.root, &inspected.project) {
            self.authoring.unregister_project(&authority);
            return Err(error);
        }
        let activated = inspected.project.clone();
        let previous = self
            .current
            .replace((inspected.root, inspected.project, authority));
        if let Some((_, _, previous_authority)) = previous {
            self.authoring.unregister_project(&previous_authority);
        }
        Ok(activated)
    }

    pub fn require_session(&self, expected: &str) -> Result<(), LifecycleError> {
        if expected.is_empty()
            || self
                .current
                .as_ref()
                .is_none_or(|(_, project, _)| project.session_id != expected)
        {
            return Err(LifecycleError::StaleSession);
        }
        Ok(())
    }

    fn authoring_context(&self) -> Result<(crate::transaction::ProjectId, String), LifecycleError> {
        self.current
            .as_ref()
            .map(|(_, project, authority)| (authority.clone(), project.project_id.clone()))
            .ok_or(LifecycleError::Authoring(AuthoringError::NoOpenProject))
    }

    pub fn authoring_list(&self) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .list(&authority, &project_id)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_flush(&self) -> Result<&'static str, LifecycleError> {
        let (authority, _) = self.authoring_context()?;
        self.authoring
            .flush(&authority)
            .map(|_| "saved")
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_status(&self) -> Result<PersistenceStatus, LifecycleError> {
        let (authority, _) = self.authoring_context()?;
        Ok(self.authoring.status(&authority))
    }

    pub fn authoring_create_character(
        &self,
        request: CreateCharacterRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .create_character(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_update_character(
        &self,
        request: UpdateCharacterRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .update_character(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_create_variable(
        &self,
        request: CreateVariableRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .create_variable(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_update_variable(
        &self,
        request: UpdateVariableRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .update_variable(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_select_import(
        &mut self,
        selected: &Path,
    ) -> Result<ImportChoice, LifecycleError> {
        let (authority, _) = self.authoring_context()?;
        self.authoring
            .select_import(&authority, selected)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_import_asset(
        &mut self,
        request: ImportAssetRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .import_asset(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_set_default_appearance(
        &self,
        request: SetDefaultAppearanceRequest,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .set_default_appearance(&authority, &project_id, request)
            .map_err(LifecycleError::Authoring)
    }

    pub fn authoring_repair_asset_compatibility(
        &self,
    ) -> Result<AuthoringMetadata, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .repair_asset_compatibility(&authority, &project_id)
            .map_err(LifecycleError::Authoring)
    }

    pub fn flow_workspace(&self) -> Result<crate::scene::flow::FlowWorkspace, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .flow_workspace(&authority, &project_id)
            .map_err(LifecycleError::Scene)
    }

    pub fn scene_workspace(&self) -> Result<SceneWorkspace, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .scene_workspace(&authority, &project_id)
            .map_err(LifecycleError::Scene)
    }

    pub fn scene_apply(
        &self,
        request: SceneCommandRequest,
    ) -> Result<SceneWorkspace, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .scene_apply(&authority, &project_id, request)
            .map_err(LifecycleError::Scene)
    }

    pub fn scene_recovery(&self) -> Result<crate::transaction::RecoveryReport, LifecycleError> {
        let (authority, _) = self.authoring_context()?;
        Ok(self.authoring.scene_recovery(&authority))
    }

    pub fn scene_resolve_recovery(
        &self,
        request: RecoveryResolveRequest,
    ) -> Result<crate::transaction::RecoveryReport, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .scene_resolve_recovery(&authority, &project_id, request)
            .map_err(LifecycleError::Scene)
    }

    pub fn media_present(
        &self,
        request: MediaRequest,
    ) -> Result<MediaPresentation, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .media_present(&authority, &project_id, request)
            .map_err(LifecycleError::Media)
    }

    pub fn source_inventory(&self) -> Result<SourceInventory, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_inventory(&authority, &project_id)
            .map_err(LifecycleError::Source)
    }

    pub fn source_open(
        &self,
        request: SourceOpenRequest,
    ) -> Result<SourceDocument, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_open(&authority, &project_id, request)
            .map_err(LifecycleError::Source)
    }

    pub fn source_update_draft(
        &self,
        request: SourceDraftRequest,
    ) -> Result<SourceDocument, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_update_draft(&authority, &project_id, request)
            .map_err(LifecycleError::Source)
    }

    pub fn source_save(
        &self,
        request: SourceSaveRequest,
    ) -> Result<SourceDocument, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_save(&authority, &project_id, request)
            .map_err(LifecycleError::Source)
    }

    pub fn source_apply_both(
        &self,
        request: SourceApplyBothRequest,
    ) -> Result<SourceDocument, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_apply_both(&authority, &project_id, request)
            .map_err(LifecycleError::Source)
    }

    pub fn source_discard(
        &self,
        request: SourcePathRequest,
    ) -> Result<SourceDocument, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_discard(&authority, &project_id, request)
            .map_err(LifecycleError::Source)
    }

    pub fn source_save_all(&self) -> Result<SourceInventory, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_save_all(&authority, &project_id)
            .map_err(LifecycleError::Source)
    }

    pub fn source_discard_all(&self) -> Result<SourceInventory, LifecycleError> {
        let (authority, project_id) = self.authoring_context()?;
        self.authoring
            .source_discard_all(&authority, &project_id)
            .map_err(LifecycleError::Source)
    }

    pub fn list_recent(&self) -> Vec<RecentProject> {
        self.read_recent()
            .entries
            .into_iter()
            .map(|entry| {
                let status = if !entry.path.exists() {
                    "missing"
                } else if canonical_safe_directory(&entry.path)
                    .and_then(|root| open_valid_project(&root))
                    .is_ok()
                {
                    "available"
                } else {
                    "invalid"
                };
                RecentProject {
                    id: entry.id,
                    project_id: entry.project_id,
                    title: entry.title,
                    display_path: entry.path.to_string_lossy().into_owned(),
                    last_opened_unix_ms: entry.last_opened_unix_ms,
                    status: status.into(),
                }
            })
            .collect()
    }

    pub fn remove_recent(&mut self, id: &str) -> Result<(), LifecycleError> {
        let mut store = self.read_recent();
        store.entries.retain(|entry| entry.id != id);
        self.write_recent(&store)
    }

    fn update_recent(&mut self, path: &Path, project: &OpenProject) -> Result<(), LifecycleError> {
        let mut store = self.read_recent();
        store
            .entries
            .retain(|entry| entry.project_id != project.project_id && entry.path != path);
        store.entries.insert(
            0,
            RecentRecord {
                id: uuid::Uuid::new_v4().to_string(),
                project_id: project.project_id.clone(),
                title: project.title.clone(),
                path: path.to_path_buf(),
                last_opened_unix_ms: now_ms(),
            },
        );
        store.entries.truncate(20);
        self.write_recent(&store)
    }

    fn read_recent(&self) -> RecentStore {
        let name = OsStr::new("recent-projects.json");
        let bytes = (|| {
            if self.data_anchor.entry_absent(name).ok()? {
                return None;
            }
            let mut file = self.data_anchor.open_file(name).ok()?;
            if file.metadata().ok()?.len() > 1_000_000 {
                return None;
            }
            let mut bytes = Vec::new();
            file.read_to_end(&mut bytes).ok()?;
            Some(bytes)
        })();
        bytes
            .and_then(|bytes| serde_json::from_slice::<RecentStore>(&bytes).ok())
            .filter(|store| store.schema_version == RECENT_SCHEMA_VERSION)
            .unwrap_or(RecentStore {
                schema_version: RECENT_SCHEMA_VERSION,
                entries: Vec::new(),
            })
    }

    fn write_recent(&self, store: &RecentStore) -> Result<(), LifecycleError> {
        self.write_recent_with_hook(store, |_| Ok(()))
    }

    fn write_recent_with_hook<F>(
        &self,
        store: &RecentStore,
        mut hook: F,
    ) -> Result<(), LifecycleError>
    where
        F: FnMut(RecentWriteCheckpoint) -> Result<(), LifecycleError>,
    {
        let bytes = serde_json::to_vec_pretty(store).map_err(|_| LifecycleError::Io)?;
        let temporary_name = format!(".recent-projects-{}.tmp", uuid::Uuid::new_v4());
        let temporary = OsStr::new(&temporary_name);
        let destination = OsStr::new("recent-projects.json");
        let mut file = self
            .data_anchor
            .create_new_file(temporary)
            .map_err(|_| LifecycleError::UnsafePath)?;
        let split = bytes.len() / 2;
        let result = (|| {
            file.write_all(&bytes[..split])
                .map_err(|_| LifecycleError::Io)?;
            hook(RecentWriteCheckpoint::StagePartiallyWritten)?;
            file.write_all(&bytes[split..])
                .map_err(|_| LifecycleError::Io)?;
            crate::transaction::flush_open_file(&file).map_err(|_| LifecycleError::Io)?;
            drop(file);
            self.data_anchor.flush().map_err(|_| LifecycleError::Io)?;
            hook(RecentWriteCheckpoint::StageDurable)?;
            replace_recent_file(&self.data_anchor, temporary, destination)?;
            hook(RecentWriteCheckpoint::ReplacementCommitted)?;
            verify_recent_commit(&self.data_anchor, destination, &bytes)
        })();
        if result.is_err() {
            // Remove only this invocation's unpredictable, create-new temporary. If it
            // was already promoted, this is a no-op and the committed store remains.
            let _ = self.data_anchor.remove_file_if_exists(temporary);
        }
        result
    }
}

fn create_project_stage<F>(
    parent: &ParentAnchor,
    stage_name: String,
    token: String,
    hook: F,
) -> Result<StageAnchor, LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    let stage = parent.path.join(&stage_name);
    let parent_directory = crate::transaction::DirectoryAnchor::open_root(&parent.path)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if parent_directory.identity().volume != parent.identity.a
        || parent_directory.identity().file != parent.identity.b
    {
        return Err(LifecycleError::UnsafePath);
    }
    hook()?;
    let stage_directory = parent_directory
        .open_child(OsStr::new(&stage_name), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let marker = format!("loomlight-project-stage-v1\n{token}\n");
    write_new_anchored(&stage_directory, STAGE_MARKER, marker.as_bytes())?;
    // Ren'Py's documented generate_gui command accepts a new project when the target
    // is absent, or an existing target whose game directory is present. The private
    // ownership marker makes our target intentionally existing.
    stage_directory
        .open_child(OsStr::new("game"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    stage_directory.flush().map_err(|_| LifecycleError::Io)?;
    parent_directory.flush().map_err(|_| LifecycleError::Io)?;
    open_stage_anchor(stage, stage_name, token)
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum RecentWriteCheckpoint {
    StagePartiallyWritten,
    StageDurable,
    ReplacementCommitted,
}

fn replace_recent_file(
    data: &crate::transaction::DirectoryAnchor,
    temporary: &OsStr,
    destination: &OsStr,
) -> Result<(), LifecycleError> {
    data.validate_chain()
        .map_err(|_| LifecycleError::UnsafePath)?;
    if !data
        .entry_absent(destination)
        .map_err(|_| LifecycleError::UnsafePath)?
    {
        // This no-follow open rejects directories, symlinks, and Windows reparse
        // points before replacement. The platform rename replaces a final pathname
        // component rather than following it.
        drop(
            data.open_file(destination)
                .map_err(|_| LifecycleError::UnsafePath)?,
        );
    }
    data.replace_file_within(temporary, destination)
        .map_err(|_| LifecycleError::Io)?;
    data.flush().map_err(|_| LifecycleError::Io)
}

fn verify_recent_commit(
    data: &crate::transaction::DirectoryAnchor,
    destination: &OsStr,
    expected: &[u8],
) -> Result<(), LifecycleError> {
    let mut committed = data
        .open_file(destination)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let mut bytes = Vec::new();
    committed
        .read_to_end(&mut bytes)
        .map_err(|_| LifecycleError::Io)?;
    if bytes != expected {
        return Err(LifecycleError::UnsafePath);
    }
    data.validate_chain()
        .map_err(|_| LifecycleError::UnsafePath)
}

pub fn folder_name_from_title(title: &str) -> String {
    let mut output = String::new();
    let mut separator = false;
    for byte in title.trim().bytes() {
        if byte.is_ascii_alphanumeric() {
            if separator && !output.is_empty() {
                output.push('-');
            }
            output.push((byte as char).to_ascii_lowercase());
            separator = false;
        } else {
            separator = true;
        }
        if output.len() >= 64 {
            break;
        }
    }
    let value = output.trim_matches('-');
    if value.is_empty() {
        "untitled-project".into()
    } else {
        value.into()
    }
}

fn validate_title(title: &str) -> Result<(), LifecycleError> {
    if title.trim().is_empty() || title.len() > 160 || title.chars().any(|c| c.is_control()) {
        Err(LifecycleError::InvalidName)
    } else {
        Ok(())
    }
}

fn validate_folder_name(name: &str) -> Result<(), LifecycleError> {
    if name.is_empty()
        || name.len() > 80
        || name == "."
        || name == ".."
        || name.ends_with([' ', '.'])
        || name.contains(['/', '\\', ':'])
        || !name.bytes().enumerate().all(|(index, byte)| {
            byte.is_ascii_alphanumeric() || (index > 0 && matches!(byte, b'-' | b'_'))
        })
        || windows_reserved(name)
    {
        return Err(LifecycleError::InvalidName);
    }
    Ok(())
}

fn windows_reserved(value: &str) -> bool {
    let stem = value
        .trim_end_matches([' ', '.'])
        .split('.')
        .next()
        .unwrap_or("")
        .to_ascii_uppercase();
    matches!(stem.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (stem.len() == 4
            && (stem.starts_with("COM") || stem.starts_with("LPT"))
            && matches!(stem.as_bytes()[3], b'1'..=b'9'))
}

fn build_overlay_model(
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> (ProjectMetadata, SourceMapMetadata, String, String) {
    let project_id = uuid::Uuid::new_v4().to_string();
    let chapter_id = uuid::Uuid::new_v4().to_string();
    let scene_id = uuid::Uuid::new_v4().to_string();
    let technical_label = format!("loomlight_scene_{}", scene_id.replace('-', ""));
    let script = format!("# Loomlight entry point. Runnable source remains authoritative.\n\nlabel start:\n    jump {technical_label}\n");
    let scene_source =
        format!("label {technical_label}:\n    \"Your story begins here.\"\n    return\n");
    let metadata = ProjectMetadata {
        schema_version: PROJECT_SCHEMA_VERSION,
        project_id: project_id.clone(),
        title: title.into(),
        folder_name: folder_name.into(),
        sdk: SdkIdentity {
            adapter: "renpy-8.5.3".into(),
            version: SUPPORTED_VERSION.into(),
            extra: Map::new(),
        },
        resolution,
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
            technical_label,
            source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
            extra: Map::new(),
        }],
        entry_scene_id: Some(scene_id.clone()),
        last_open: Selection {
            chapter_id,
            scene_id,
        },
        extra: Map::new(),
    };
    let source_map = SourceMapMetadata {
        schema_version: SOURCE_MAP_SCHEMA_VERSION,
        project_id,
        sources: vec![
            "game/script.rpy".into(),
            "game/definitions/characters.rpy".into(),
            "game/definitions/variables.rpy".into(),
            "game/chapters/chapter_01/scene_001.rpy".into(),
        ],
        scene_mappings: Vec::new(),
        extra: Map::new(),
    };
    (metadata, source_map, script, scene_source)
}

fn overlay_options(
    title: &str,
    folder_name: &str,
    options_text: &str,
) -> Result<String, LifecycleError> {
    let safe_title = title
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('[', "[[");
    let options_text = replace_template_define(
        options_text,
        "define config.name =",
        &format!("define config.name = _(\"{safe_title}\")"),
    )?;
    replace_template_define(
        &options_text,
        "define build.name =",
        &format!("define build.name = \"{folder_name}\""),
    )
}

fn apply_overlay(
    stage: &StageAnchor,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> Result<ProjectMetadata, LifecycleError> {
    apply_overlay_with_hook(stage, title, folder_name, resolution, || Ok(()))
}

fn apply_overlay_with_hook<F>(
    stage: &StageAnchor,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
    hook: F,
) -> Result<ProjectMetadata, LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    use std::ffi::OsStr;
    use std::io::{Read, Seek, SeekFrom};

    let root = crate::transaction::DirectoryAnchor::open_root(&stage.path)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if root.identity().volume != stage.identity.a || root.identity().file != stage.identity.b {
        return Err(LifecycleError::UnsafePath);
    }
    hook()?;

    let game = root
        .open_child(OsStr::new("game"), false)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let definitions = game
        .open_child(OsStr::new("definitions"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let chapters = game
        .open_child(OsStr::new("chapters"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let chapter = chapters
        .open_child(OsStr::new("chapter_01"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    game.open_child(OsStr::new("images"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    game.open_child(OsStr::new("audio"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let editor = root
        .open_child(OsStr::new(".renpy-editor"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    editor
        .open_child(OsStr::new("recovery"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: directories");

    let (metadata, source_map, script, scene_source) =
        build_overlay_model(title, folder_name, resolution);
    write_new_or_replace_anchored(&game, "script.rpy", script.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: script");

    let mut options = game
        .open_file_for_flush(OsStr::new("options.rpy"))
        .map_err(|_| LifecycleError::UnsafePath)?;
    let mut options_text = String::new();
    options
        .read_to_string(&mut options_text)
        .map_err(|_| LifecycleError::Io)?;
    let options_text = overlay_options(title, folder_name, &options_text)?;
    options.set_len(0).map_err(|_| LifecycleError::Io)?;
    options
        .seek(SeekFrom::Start(0))
        .and_then(|_| options.write_all(options_text.as_bytes()))
        .and_then(|_| options.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: options");

    write_new_anchored(
        &definitions,
        "characters.rpy",
        b"# Character definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(
        &definitions,
        "variables.rpy",
        b"# Variable definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(
        &definitions,
        "transforms.rpy",
        b"# Transform definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(&chapter, "scene_001.rpy", scene_source.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: source");

    metadata
        .validate(Some(folder_name))
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    let metadata_bytes =
        serde_json::to_vec_pretty(&metadata).map_err(|_| LifecycleError::InvalidMetadata)?;
    let source_map_bytes =
        serde_json::to_vec_pretty(&source_map).map_err(|_| LifecycleError::InvalidMetadata)?;
    write_new_anchored(&editor, "project.json", &metadata_bytes)?;
    write_new_anchored(&editor, "source-map.json", &source_map_bytes)?;
    let authoring = crate::authoring::AuthoringMetadata::empty(metadata.project_id.clone());
    let authoring_bytes =
        serde_json::to_vec_pretty(&authoring).map_err(|_| LifecycleError::InvalidMetadata)?;
    write_new_anchored(&editor, "authoring.json", &authoring_bytes)?;
    editor.flush().map_err(|_| LifecycleError::Io)?;
    root.flush().map_err(|_| LifecycleError::Io)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: metadata");
    Ok(metadata)
}

fn write_new_anchored(
    directory: &crate::transaction::DirectoryAnchor,
    name: &str,
    bytes: &[u8],
) -> Result<(), LifecycleError> {
    use std::ffi::OsStr;
    let mut file = directory
        .create_new_file(OsStr::new(name))
        .map_err(|_| LifecycleError::UnsafePath)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    directory.flush().map_err(|_| LifecycleError::Io)
}

fn write_new_or_replace_anchored(
    directory: &crate::transaction::DirectoryAnchor,
    name: &str,
    bytes: &[u8],
) -> Result<(), LifecycleError> {
    use std::ffi::OsStr;
    use std::io::{Seek, SeekFrom};
    let os_name = OsStr::new(name);
    let mut file = if directory
        .entry_absent(os_name)
        .map_err(|_| LifecycleError::UnsafePath)?
    {
        directory
            .create_new_file(os_name)
            .map_err(|_| LifecycleError::UnsafePath)?
    } else {
        directory
            .open_file_for_flush(os_name)
            .map_err(|_| LifecycleError::UnsafePath)?
    };
    file.set_len(0).map_err(|_| LifecycleError::Io)?;
    file.seek(SeekFrom::Start(0))
        .and_then(|_| file.write_all(bytes))
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    directory.flush().map_err(|_| LifecycleError::Io)
}

fn replace_template_define(
    source: &str,
    prefix: &str,
    replacement: &str,
) -> Result<String, LifecycleError> {
    let mut matches = 0;
    let mut output = String::with_capacity(source.len());
    for line in source.split_inclusive('\n') {
        let (body, ending) = line
            .strip_suffix("\r\n")
            .map(|body| (body, "\r\n"))
            .or_else(|| line.strip_suffix('\n').map(|body| (body, "\n")))
            .unwrap_or((line, ""));
        if body.trim_start().starts_with(prefix) {
            matches += 1;
            output.push_str(replacement);
            output.push_str(ending);
        } else {
            output.push_str(line);
        }
    }
    if matches == 1 {
        Ok(output)
    } else {
        Err(LifecycleError::GenerationFailed)
    }
}

fn open_valid_project(root: &Path) -> Result<OpenProject, LifecycleError> {
    open_valid_project_with_hook(root, || Ok(()))
}

fn open_valid_project_with_hook<F>(root: &Path, hook: F) -> Result<OpenProject, LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    inspect_valid_project_with_hook(root, hook).map(|candidate| candidate.project)
}

fn inspect_valid_project(root: &Path) -> Result<InspectedProject, LifecycleError> {
    inspect_valid_project_with_hook(root, || Ok(()))
}

fn inspect_valid_project_with_hook<F>(
    root: &Path,
    hook: F,
) -> Result<InspectedProject, LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    let anchor = crate::transaction::DirectoryAnchor::open_root(root)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if anchor
        .entry_absent(OsStr::new(".renpy-editor"))
        .map_err(|_| LifecycleError::UnsafePath)?
    {
        return Err(LifecycleError::InvalidMetadata);
    }
    let editor = anchor
        .open_child(OsStr::new(".renpy-editor"), false)
        .map_err(|_| LifecycleError::UnsafePath)?;
    hook()?;
    if editor
        .entry_absent(OsStr::new("project.json"))
        .map_err(|_| LifecycleError::UnsafePath)?
    {
        return Err(LifecycleError::InvalidMetadata);
    }
    let metadata_file = editor
        .open_file(OsStr::new("project.json"))
        .map_err(|_| LifecycleError::UnsafePath)?;
    if metadata_file
        .metadata()
        .map_err(|_| LifecycleError::InvalidMetadata)?
        .len()
        > 1_000_000
    {
        return Err(LifecycleError::InvalidMetadata);
    }
    let mut metadata_bytes = Vec::new();
    metadata_file
        .take(1_000_001)
        .read_to_end(&mut metadata_bytes)
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    if metadata_bytes.len() > 1_000_000 {
        return Err(LifecycleError::InvalidMetadata);
    }
    let metadata = ProjectMetadata::read_bytes(
        &metadata_bytes,
        root.file_name().and_then(|name| name.to_str()),
    )
    .map_err(|_| LifecycleError::InvalidMetadata)?;
    let scene = metadata
        .scenes
        .iter()
        .find(|scene| scene.id == metadata.last_open.scene_id)
        .ok_or(LifecycleError::InvalidMetadata)?;
    let chapter = metadata
        .chapters
        .iter()
        .find(|chapter| chapter.id == scene.chapter_id)
        .ok_or(LifecycleError::InvalidMetadata)?;
    for required in [
        "game/script.rpy",
        "game/options.rpy",
        "game/gui.rpy",
        "game/screens.rpy",
    ] {
        open_project_file(&anchor, required)?;
    }
    for scene in &metadata.scenes {
        open_project_file(&anchor, &scene.source_path)?;
    }
    let project = OpenProject {
        session_id: String::new(),
        project_id: metadata.project_id,
        title: metadata.title,
        folder_name: metadata.folder_name,
        chapter_id: chapter.id.clone(),
        chapter_name: chapter.display_name.clone(),
        scene_id: scene.id.clone(),
        scene_name: scene.display_name.clone(),
        sdk_version: metadata.sdk.version,
        resolution: metadata.resolution,
    };
    Ok(InspectedProject {
        root: root.to_path_buf(),
        project,
        anchor,
    })
}

fn open_project_file(
    root: &crate::transaction::DirectoryAnchor,
    relative: &str,
) -> Result<File, LifecycleError> {
    crate::metadata::validate_relative_path(relative)
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    let mut components = relative.split('/').peekable();
    let mut directory = root.clone();
    while let Some(component) = components.next() {
        let name = OsStr::new(component);
        if directory
            .entry_absent(name)
            .map_err(|_| LifecycleError::UnsafePath)?
        {
            return Err(LifecycleError::InvalidMetadata);
        }
        if components.peek().is_none() {
            return directory
                .open_file(name)
                .map_err(|_| LifecycleError::UnsafePath);
        }
        directory = directory
            .open_child(name, false)
            .map_err(|_| LifecycleError::UnsafePath)?;
    }
    Err(LifecycleError::InvalidMetadata)
}

#[cfg(test)]
fn initialise_git_with(program: &str, stage: &Path) -> Result<(), LifecycleError> {
    initialise_git_with_anchor(program, stage, None)
}

fn initialise_git_with_anchor(
    program: &str,
    stage: &Path,
    stage_anchor: Option<&File>,
) -> Result<(), LifecycleError> {
    let mut command = Command::new(program);
    apply_git_environment(&mut command);
    command
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_COUNT", "0")
        .env("GIT_TERMINAL_PROMPT", "0");
    #[cfg(windows)]
    command.env("GIT_CONFIG_GLOBAL", "NUL");
    #[cfg(not(windows))]
    command.env("GIT_CONFIG_GLOBAL", "/dev/null");
    #[cfg(unix)]
    if let Some(anchor) = stage_anchor {
        use std::os::{fd::AsRawFd, unix::process::CommandExt};
        let fd = anchor.as_raw_fd();
        unsafe {
            command.pre_exec(move || {
                if libc::fchdir(fd) == 0 {
                    Ok(())
                } else {
                    Err(io::Error::last_os_error())
                }
            });
        }
    }
    #[cfg(windows)]
    let _ = stage_anchor;
    let status = command
        .arg("init")
        .arg("--quiet")
        .arg("--template=")
        .current_dir(stage)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    if !status.success() {
        return Err(LifecycleError::GitUnavailable);
    }
    let git_dir = stage.join(".git");
    let metadata = fs::symlink_metadata(&git_dir).map_err(|_| LifecycleError::GitUnavailable)?;
    if !metadata.is_dir() || crate::transaction::is_link_or_reparse(&metadata) {
        return Err(LifecycleError::GitUnavailable);
    }
    let canonical = git_dir
        .canonicalize()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    let stage_root = stage
        .canonicalize()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    if !canonical.starts_with(&stage_root) {
        return Err(LifecycleError::GitUnavailable);
    }
    Ok(())
}

fn apply_git_environment(command: &mut Command) {
    command.env_clear();
    for key in [
        "PATH",
        "SYSTEMROOT",
        "WINDIR",
        "COMSPEC",
        "PATHEXT",
        "TMPDIR",
        "TEMP",
        "TMP",
        "LANG",
        "LC_ALL",
        "LC_CTYPE",
    ] {
        if let Some(value) = std::env::var_os(key) {
            command.env(key, value);
        }
    }
}

fn sdk_info(id: &str, sdk: &ValidatedSdk, source: &str) -> SdkInfo {
    SdkInfo {
        id: id.into(),
        version: sdk.version.clone(),
        display_name: format!("Ren'Py {}", sdk.version),
        source: source.into(),
        compatible: true,
        explanation: "Compatible with this Loomlight release.".into(),
    }
}
fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .try_into()
        .unwrap_or(u64::MAX)
}
fn ensure_absent(path: &Path) -> Result<(), LifecycleError> {
    match fs::symlink_metadata(path) {
        Ok(_) => Err(LifecycleError::ExistingDestination),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err(LifecycleError::Io),
    }
}

fn canonical_safe_directory(path: &Path) -> Result<PathBuf, LifecycleError> {
    let root = fs::canonicalize(path).map_err(|_| LifecycleError::InvalidParent)?;
    if !root.is_dir() || has_symlink_component(&root) {
        return Err(LifecycleError::InvalidParent);
    }
    Ok(root)
}
fn has_symlink_component(path: &Path) -> bool {
    let mut current = PathBuf::new();
    for component in path.components() {
        current.push(component.as_os_str());
        if fs::symlink_metadata(&current)
            .is_ok_and(|meta| crate::transaction::is_link_or_reparse(&meta))
        {
            return true;
        }
    }
    false
}

fn open_parent(path: &Path) -> Result<ParentAnchor, LifecycleError> {
    let path = canonical_safe_directory(path)?;
    let file = open_directory(&path).map_err(|_| LifecycleError::InvalidParent)?;
    let identity = identity(&file).map_err(|_| LifecycleError::InvalidParent)?;
    Ok(ParentAnchor {
        path,
        file,
        identity,
    })
}

fn validate_parent(parent: &ParentAnchor) -> Result<(), LifecycleError> {
    let held = identity(&parent.file).map_err(|_| LifecycleError::UnsafePath)?;
    let live_file = open_directory(&parent.path).map_err(|_| LifecycleError::UnsafePath)?;
    let live = identity(&live_file).map_err(|_| LifecycleError::UnsafePath)?;
    if held != parent.identity || live != parent.identity || has_symlink_component(&parent.path) {
        Err(LifecycleError::UnsafePath)
    } else {
        Ok(())
    }
}

#[cfg(unix)]
fn identity(file: &File) -> io::Result<FileIdentity> {
    use std::os::unix::fs::MetadataExt;
    let meta = file.metadata()?;
    Ok(FileIdentity {
        a: meta.dev(),
        b: meta.ino(),
    })
}
#[cfg(windows)]
fn identity(file: &File) -> io::Result<FileIdentity> {
    use std::{mem::zeroed, os::windows::io::AsRawHandle};
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION,
    };
    let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut info) } == 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(FileIdentity {
        a: u64::from(info.dwVolumeSerialNumber),
        b: (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow),
    })
}

#[cfg(unix)]
fn open_directory(path: &Path) -> io::Result<File> {
    use std::os::unix::fs::OpenOptionsExt;
    OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW)
        .open(path)
}
#[cfg(windows)]
fn open_directory(path: &Path) -> io::Result<File> {
    use std::os::windows::fs::OpenOptionsExt;
    const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;
    const FILE_FLAG_OPEN_REPARSE_POINT: u32 = 0x0020_0000;
    OpenOptions::new()
        .read(true)
        .share_mode(0x1 | 0x2)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
}

#[cfg(unix)]
fn open_stage_directory(path: &Path) -> io::Result<File> {
    open_directory(path)
}

#[cfg(windows)]
fn open_stage_directory(path: &Path) -> io::Result<File> {
    use std::os::windows::fs::OpenOptionsExt;
    const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;
    const FILE_FLAG_OPEN_REPARSE_POINT: u32 = 0x0020_0000;
    OpenOptions::new()
        .read(true)
        // Keep the stage namespace pinned against rename/delete while privileged
        // Ren'Py/Git work is in flight. The pin is released only for final promotion.
        .share_mode(0x1 | 0x2)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
}

fn open_stage_anchor(
    path: PathBuf,
    name: String,
    token: String,
) -> Result<StageAnchor, LifecycleError> {
    if path
        .file_name()
        .is_none_or(|value| value.to_string_lossy() != name)
        || name != format!(".loomlight-stage-{token}")
    {
        return Err(LifecycleError::UnsafePath);
    }
    let file = open_stage_directory(&path).map_err(|_| LifecycleError::UnsafePath)?;
    let identity = identity(&file).map_err(|_| LifecycleError::UnsafePath)?;
    let stage = StageAnchor {
        path,
        name,
        token,
        file: Some(file),
        identity,
    };
    validate_stage_identity(&stage)?;
    Ok(stage)
}

fn stage_file(stage: &StageAnchor) -> Result<&File, LifecycleError> {
    stage.file.as_ref().ok_or(LifecycleError::UnsafePath)
}

fn validate_stage_identity(stage: &StageAnchor) -> Result<(), LifecycleError> {
    let held = identity(stage_file(stage)?).map_err(|_| LifecycleError::UnsafePath)?;
    let live_file = open_stage_directory(&stage.path).map_err(|_| LifecycleError::UnsafePath)?;
    let live = identity(&live_file).map_err(|_| LifecycleError::UnsafePath)?;
    let marker = format!("loomlight-project-stage-v1\n{}\n", stage.token);
    if held != stage.identity
        || live != stage.identity
        || has_symlink_component(&stage.path)
        || fs::read_to_string(stage.path.join(STAGE_MARKER))
            .ok()
            .as_deref()
            != Some(marker.as_str())
    {
        Err(LifecycleError::UnsafePath)
    } else {
        Ok(())
    }
}

fn promote_anchored_stage(
    parent: &ParentAnchor,
    stage: &mut StageAnchor,
    final_name: &str,
) -> Result<(), LifecycleError> {
    promote_anchored_stage_with_hook(parent, stage, final_name, || Ok(()))
}

fn promote_anchored_stage_with_hook<F>(
    parent: &ParentAnchor,
    stage: &mut StageAnchor,
    final_name: &str,
    hook: F,
) -> Result<(), LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    validate_stage_identity(stage)?;
    validate_parent(parent)?;
    let final_path = parent.path.join(final_name);
    ensure_absent(&final_path)?;

    #[cfg(windows)]
    drop(stage.file.take());

    hook()?;
    promote_no_replace(parent, &stage.name, final_name).map_err(|error| {
        if matches!(error, LifecycleError::Io) {
            LifecycleError::PromotionFailed
        } else {
            error
        }
    })?;
    flush_parent_anchor(parent).map_err(|_| LifecycleError::PromotionFailed)?;
    let promoted =
        open_stage_directory(&final_path).map_err(|_| LifecycleError::PromotionFailed)?;
    let promoted_identity = identity(&promoted).map_err(|_| LifecycleError::PromotionFailed)?;
    let marker = format!("loomlight-project-stage-v1\n{}\n", stage.token);
    if promoted_identity != stage.identity
        || has_symlink_component(&final_path)
        || fs::read_to_string(final_path.join(STAGE_MARKER))
            .ok()
            .as_deref()
            != Some(marker.as_str())
    {
        drop(promoted);
        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());
        let _ = promote_no_replace(parent, final_name, &quarantine);
        return Err(LifecycleError::PromotionFailed);
    }
    drop(promoted);

    let final_anchor = crate::transaction::DirectoryAnchor::open_root(&final_path)
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    if final_anchor.identity().volume != stage.identity.a
        || final_anchor.identity().file != stage.identity.b
    {
        drop(final_anchor);
        let quarantine = format!(".loomlight-rejected-final-{}", uuid::Uuid::new_v4());
        let _ = promote_no_replace(parent, final_name, &quarantine);
        return Err(LifecycleError::PromotionFailed);
    }
    final_anchor
        .remove_file_if_exists(std::ffi::OsStr::new(STAGE_MARKER))
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    final_anchor
        .flush()
        .map_err(|_| LifecycleError::CreatedNotOpened)?;
    Ok(())
}

fn cleanup_stage(parent: &ParentAnchor, stage: &mut StageAnchor) -> Result<(), LifecycleError> {
    let marker = format!("loomlight-project-stage-v1\n{}\n", stage.token);
    if stage.file.is_some() {
        validate_stage_identity(stage)?;
    } else {
        let live = open_stage_directory(&stage.path).map_err(|_| LifecycleError::UnsafePath)?;
        if identity(&live).map_err(|_| LifecycleError::UnsafePath)? != stage.identity
            || fs::read_to_string(stage.path.join(STAGE_MARKER))
                .ok()
                .as_deref()
                != Some(marker.as_str())
        {
            return Err(LifecycleError::UnsafePath);
        }
    }

    drop(stage.file.take());
    let quarantine_name = format!(".loomlight-abandoned-stage-{}", uuid::Uuid::new_v4());
    promote_no_replace(parent, &stage.name, &quarantine_name)?;
    let quarantine_path = parent.path.join(&quarantine_name);
    let quarantined =
        open_stage_directory(&quarantine_path).map_err(|_| LifecycleError::UnsafePath)?;
    let quarantined_identity = identity(&quarantined).map_err(|_| LifecycleError::UnsafePath)?;
    if quarantined_identity != stage.identity
        || has_symlink_component(&quarantine_path)
        || fs::read_to_string(quarantine_path.join(STAGE_MARKER))
            .ok()
            .as_deref()
            != Some(marker.as_str())
    {
        return Err(LifecycleError::UnsafePath);
    }
    drop(quarantined);
    fs::remove_dir_all(quarantine_path).map_err(|_| LifecycleError::Io)?;
    flush_parent_anchor(parent).map_err(|_| LifecycleError::Io)
}

#[cfg(unix)]
fn flush_parent_anchor(parent: &ParentAnchor) -> io::Result<()> {
    parent.file.sync_all()
}

#[cfg(windows)]
fn flush_parent_anchor(_parent: &ParentAnchor) -> io::Result<()> {
    // Project promotion uses MOVEFILE_WRITE_THROUGH. Windows provides no supported
    // ordinary-user directory fsync equivalent.
    Ok(())
}

#[cfg(test)]
fn restrict_directory(path: &Path) -> Result<(), LifecycleError> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| LifecycleError::Io)
    }
    #[cfg(windows)]
    {
        let _ = path;
        Ok(())
    }
}

#[cfg(target_os = "linux")]
fn promote_no_replace(
    parent: &ParentAnchor,
    stage: &str,
    final_name: &str,
) -> Result<(), LifecycleError> {
    use std::{ffi::CString, os::fd::AsRawFd};
    let from = CString::new(stage).map_err(|_| LifecycleError::InvalidName)?;
    let to = CString::new(final_name).map_err(|_| LifecycleError::InvalidName)?;
    let result = unsafe {
        libc::syscall(
            libc::SYS_renameat2,
            parent.file.as_raw_fd(),
            from.as_ptr(),
            parent.file.as_raw_fd(),
            to.as_ptr(),
            libc::RENAME_NOREPLACE,
        )
    };
    if result == 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(LifecycleError::ExistingDestination)
    } else {
        Err(LifecycleError::Io)
    }
}

#[cfg(target_os = "macos")]
fn promote_no_replace(
    parent: &ParentAnchor,
    stage: &str,
    final_name: &str,
) -> Result<(), LifecycleError> {
    use std::{ffi::CString, os::fd::AsRawFd};
    unsafe extern "C" {
        fn renameatx_np(
            fromfd: i32,
            from: *const libc::c_char,
            tofd: i32,
            to: *const libc::c_char,
            flags: u32,
        ) -> i32;
    }
    const RENAME_EXCL: u32 = 0x0000_0004;
    let from = CString::new(stage).map_err(|_| LifecycleError::InvalidName)?;
    let to = CString::new(final_name).map_err(|_| LifecycleError::InvalidName)?;
    let result = unsafe {
        renameatx_np(
            parent.file.as_raw_fd(),
            from.as_ptr(),
            parent.file.as_raw_fd(),
            to.as_ptr(),
            RENAME_EXCL,
        )
    };
    if result == 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(LifecycleError::ExistingDestination)
    } else {
        Err(LifecycleError::Io)
    }
}

#[cfg(windows)]
fn promote_no_replace(
    parent: &ParentAnchor,
    stage: &str,
    final_name: &str,
) -> Result<(), LifecycleError> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_WRITE_THROUGH};
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(&parent.path.join(stage));
    let to = wide(&parent.path.join(final_name));
    let result = unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), MOVEFILE_WRITE_THROUGH) };
    if result != 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(LifecycleError::ExistingDestination)
    } else {
        Err(LifecycleError::Io)
    }
}

#[cfg(all(unix, not(any(target_os = "linux", target_os = "macos"))))]
fn promote_no_replace(
    _parent: &ParentAnchor,
    _stage: &str,
    _final_name: &str,
) -> Result<(), LifecycleError> {
    Err(LifecycleError::Io)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_openable_project(root: &Path, title: &str) {
        let folder = root.file_name().unwrap().to_str().unwrap();
        fs::create_dir_all(root.join("game/definitions")).unwrap();
        fs::create_dir_all(root.join("game/chapters/chapter_01")).unwrap();
        fs::create_dir_all(root.join(".renpy-editor/recovery")).unwrap();
        let (metadata, source_map, script, scene) = build_overlay_model(
            title,
            folder,
            Resolution {
                width: 1920,
                height: 1080,
            },
        );
        for (path, bytes) in [
            ("game/script.rpy", script.as_bytes()),
            (
                "game/options.rpy",
                b"define config.name = \"Test\"".as_slice(),
            ),
            ("game/gui.rpy", b"# gui".as_slice()),
            ("game/screens.rpy", b"# screens".as_slice()),
            (
                "game/definitions/characters.rpy",
                b"# Characters\n".as_slice(),
            ),
            (
                "game/definitions/variables.rpy",
                b"# Variables\n".as_slice(),
            ),
            ("game/chapters/chapter_01/scene_001.rpy", scene.as_bytes()),
        ] {
            fs::write(root.join(path), bytes).unwrap();
        }
        metadata.write(root).unwrap();
        source_map.write(root).unwrap();
        fs::write(
            root.join(".renpy-editor/authoring.json"),
            serde_json::to_vec_pretty(&serde_json::json!({
                "schemaVersion": 1,
                "projectId": metadata.project_id,
                "characters": [],
                "appearances": [],
                "variables": [],
                "assets": []
            }))
            .unwrap(),
        )
        .unwrap();
    }

    fn apply_scene_target(
        service: &LifecycleService,
        workspace: &SceneWorkspace,
        command: crate::scene::SceneCommand,
    ) -> SceneWorkspace {
        service
            .scene_apply(SceneCommandRequest {
                expected_project_revision: workspace.project_revision.clone(),
                expected_source_map_revision: workspace.source_map_revision.clone(),
                command,
            })
            .unwrap()
    }

    fn closeout_ipc(
        service: &mut LifecycleService,
        operation: &str,
        payload: serde_json::Value,
    ) -> serde_json::Value {
        serde_json::to_value(crate::handle_application_request(
            serde_json::json!({"protocolVersion": 1, "requestId": "closeout", "operation": operation, "payload": payload}),
            false, service,
        )).unwrap()
    }

    #[test]
    fn apply_both_json_binds_review_and_preserves_draft_and_disk_on_every_stale_identity() {
        use serde_json::json;
        for change in [
            "draft", "external", "combined", "base", "missing", "session", "success",
        ] {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().join("review-project");
            make_openable_project(&root, "Review binding");
            let path = "game/custom.rpy";
            fs::write(root.join(path), b"alpha beta gamma\n").unwrap();
            let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
            let project = service.open_path(&root).unwrap();
            let mut session = project.session_id.clone();
            let opened = closeout_ipc(
                &mut service,
                "source.open",
                json!({"sessionId": session, "path": path}),
            );
            assert_eq!(opened["ok"], true, "{opened}");
            let base = opened["value"]["baseRevision"].clone();
            let draft = closeout_ipc(
                &mut service,
                "source.updateDraft",
                json!({"sessionId": session, "path": path,
                "expectedBaseRevision": base, "text": "ALPHA beta gamma\n", "selectionStart": 0, "selectionEnd": 0}),
            );
            assert_eq!(draft["ok"], true, "{draft}");
            fs::write(root.join(path), b"alpha beta GAMMA\n").unwrap();
            let review = closeout_ipc(
                &mut service,
                "source.open",
                json!({"sessionId": session, "path": path}),
            );
            let review = &review["value"];
            assert_eq!(review["canApplyBoth"], true);
            let mut request = json!({"sessionId": session, "path": path, "expectedBaseRevision": base,
                "expectedDraftVersion": review["draftVersion"], "expectedExternalRevision": review["liveRevision"],
                "expectedCombinedText": review["combinedPreview"]});
            let mut expected_draft = "ALPHA beta gamma\n";
            match change {
                "draft" => {
                    expected_draft = "NEW beta gamma\n";
                    let retained = closeout_ipc(
                        &mut service,
                        "source.updateDraft",
                        json!({"sessionId": session, "path": path,
                        "expectedBaseRevision": base, "text": expected_draft, "selectionStart": 0, "selectionEnd": 0}),
                    );
                    assert_eq!(retained["ok"], true, "{retained}");
                }
                "external" => fs::write(root.join(path), b"alpha beta DELTA\n").unwrap(),
                "combined" => request["expectedCombinedText"] = json!("unreviewed"),
                "base" => request["expectedBaseRevision"] = json!("0".repeat(64)),
                "missing" => {
                    request
                        .as_object_mut()
                        .unwrap()
                        .remove("expectedExternalRevision");
                }
                "session" => {
                    service.source_discard_all().unwrap();
                    service.close().unwrap();
                    session = service.open_path(&root).unwrap().session_id;
                    let opened = closeout_ipc(
                        &mut service,
                        "source.open",
                        json!({"sessionId": session, "path": path}),
                    );
                    expected_draft = "replacement session draft\n";
                    let retained = closeout_ipc(
                        &mut service,
                        "source.updateDraft",
                        json!({"sessionId": session, "path": path,
                        "expectedBaseRevision": opened["value"]["baseRevision"], "text": expected_draft, "selectionStart": 0, "selectionEnd": 0}),
                    );
                    assert_eq!(retained["ok"], true, "{retained}");
                }
                _ => {}
            }
            let disk_before = fs::read(root.join(path)).unwrap();
            let map_before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
            let result = closeout_ipc(&mut service, "source.applyBoth", request);
            if change == "success" {
                assert_eq!(result["ok"], true, "{result}");
                assert_eq!(result["value"]["dirty"], false);
                assert_eq!(fs::read(root.join(path)).unwrap(), b"ALPHA beta GAMMA\n");
                service.close().unwrap();
                drop(service);
                let mut reopened = LifecycleService::new(temp.path().join("state")).unwrap();
                let project = reopened.open_path(&root).unwrap();
                let value = closeout_ipc(
                    &mut reopened,
                    "source.open",
                    json!({"sessionId": project.session_id, "path": path}),
                );
                assert_eq!(value["value"]["text"], "ALPHA beta GAMMA\n");
                assert_eq!(value["value"]["dirty"], false);
            } else {
                let code = match change {
                    "missing" => "INVALID_PAYLOAD",
                    "session" => "STALE_PROJECT_SESSION",
                    _ => "SOURCE_CONFLICT",
                };
                assert_eq!(result["error"]["code"], code, "{change}: {result}");
                assert_eq!(fs::read(root.join(path)).unwrap(), disk_before);
                assert_eq!(
                    fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
                    map_before
                );
                let retained = closeout_ipc(
                    &mut service,
                    "source.open",
                    json!({"sessionId": session, "path": path}),
                );
                assert_eq!(retained["value"]["text"], expected_draft);
                assert_eq!(retained["value"]["dirty"], true);
            }
        }
    }

    #[test]
    fn apply_both_json_refuses_overlap_same_position_and_uncertain_custom_code_boundary() {
        use serde_json::json;
        for (base, draft, external) in [
            (
                "alpha beta gamma\n",
                "alpha BETA gamma\n",
                "alpha XXXX gamma\n",
            ),
            (
                "alpha beta\n",
                "alpha LOCAL beta\n",
                "alpha EXTERNAL beta\n",
            ),
            (
                "label custom:\n    python:\n        custom()\n    return\n",
                "label custom:\n    python:\n        local()\n    return\n",
                "label custom:\n    python hide:\n        external()\n    return\n",
            ),
        ] {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().join("uncertain-project");
            make_openable_project(&root, "Uncertain combination");
            let path = "game/custom.rpy";
            fs::write(root.join(path), base).unwrap();
            let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
            let session = service.open_path(&root).unwrap().session_id;
            let opened = closeout_ipc(
                &mut service,
                "source.open",
                json!({"sessionId": session, "path": path}),
            );
            let retained = closeout_ipc(
                &mut service,
                "source.updateDraft",
                json!({"sessionId": session, "path": path,
                "expectedBaseRevision": opened["value"]["baseRevision"], "text": draft, "selectionStart": 0, "selectionEnd": 0}),
            );
            assert_eq!(retained["ok"], true, "{retained}");
            fs::write(root.join(path), external).unwrap();
            let review = closeout_ipc(
                &mut service,
                "source.open",
                json!({"sessionId": session, "path": path}),
            );
            let review = &review["value"];
            assert_eq!(review["canApplyBoth"], false, "{review}");
            let result = closeout_ipc(
                &mut service,
                "source.applyBoth",
                json!({"sessionId": session, "path": path,
                "expectedBaseRevision": review["baseRevision"], "expectedDraftVersion": review["draftVersion"],
                "expectedExternalRevision": review["liveRevision"], "expectedCombinedText": draft}),
            );
            assert_eq!(result["error"]["code"], "SOURCE_CONFLICT", "{result}");
            assert_eq!(fs::read_to_string(root.join(path)).unwrap(), external);
            let retained = closeout_ipc(
                &mut service,
                "source.open",
                json!({"sessionId": session, "path": path}),
            );
            assert_eq!(retained["value"]["text"], draft);
        }
    }

    #[test]
    fn scene_renderer_json_edits_and_inserts_beats_through_real_ipc() {
        use serde_json::{json, Value};

        fn ipc(service: &mut LifecycleService, operation: &str, payload: Value) -> Value {
            serde_json::to_value(crate::handle_application_request(
                json!({
                    "protocolVersion": 1,
                    "requestId": "scene-renderer-regression",
                    "operation": operation,
                    "payload": payload,
                }),
                false,
                service,
            ))
            .unwrap()
        }

        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("scene-renderer-project");
        make_openable_project(&root, "Scene renderer regression");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let project = service.open_path(&root).unwrap();
        let session = &project.session_id;
        let listed = ipc(&mut service, "scene.list", json!({"sessionId": session}));
        assert_eq!(listed["ok"], true, "{listed}");
        let mut workspace = listed["value"].clone();
        let scene_id = workspace["entrySceneId"].clone();
        let scene = workspace["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|scene| scene["id"] == scene_id)
            .unwrap();
        let source_path = scene["sourcePath"].as_str().unwrap().to_owned();
        let beat_id = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|beat| beat["payload"]["type"] == "narration")
            .unwrap()["id"]
            .clone();

        // These are the editor's real JSON envelopes, not typed Rust commands.
        let update = json!({
            "sessionId": session,
            "expectedProjectRevision": workspace["projectRevision"],
            "expectedSourceMapRevision": workspace["sourceMapRevision"],
            "command": {
                "type": "updateBeat", "sceneId": scene_id,
                "expectedSourceRevision": scene["sourceRevision"], "beatId": beat_id,
                "beat": {"type": "narration", "text": "Edited via renderer IPC"},
            },
        });
        let updated = ipc(&mut service, "scene.apply", update.clone());
        assert_eq!(updated["ok"], true, "{updated}");
        workspace = updated["value"].clone();
        let edited_bytes = fs::read(root.join(&source_path)).unwrap();
        assert!(String::from_utf8_lossy(&edited_bytes).contains("Edited via renderer IPC"));

        let stale = ipc(&mut service, "scene.apply", update.clone());
        assert_eq!(stale["error"]["code"], "SOURCE_CONFLICT");
        assert_eq!(fs::read(root.join(&source_path)).unwrap(), edited_bytes);
        let mut malformed = update;
        malformed["command"]
            .as_object_mut()
            .unwrap()
            .remove("sceneId");
        let rejected = ipc(&mut service, "scene.apply", malformed);
        assert_eq!(rejected["error"]["code"], "INVALID_PAYLOAD");
        assert_eq!(fs::read(root.join(&source_path)).unwrap(), edited_bytes);

        let scene = workspace["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|scene| scene["id"] == scene_id)
            .unwrap();
        let inserted = ipc(
            &mut service,
            "scene.apply",
            json!({
                "sessionId": session,
                "expectedProjectRevision": workspace["projectRevision"],
                "expectedSourceMapRevision": workspace["sourceMapRevision"],
                "command": {
                    "type": "insertBeat", "sceneId": scene_id,
                    "expectedSourceRevision": scene["sourceRevision"], "beforeBeatId": beat_id,
                    "beat": {"type": "narration", "text": "Inserted via renderer IPC"},
                },
            }),
        );
        assert_eq!(inserted["ok"], true, "{inserted}");
        let accepted = fs::read(root.join(&source_path)).unwrap();
        let text = String::from_utf8_lossy(&accepted);
        let inserted_at = text.find("Inserted via renderer IPC").unwrap();
        let edited_at = text.find("Edited via renderer IPC").unwrap();
        assert!(inserted_at < edited_at);
        let accepted_scene = inserted["value"]["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|scene| scene["id"] == scene_id)
            .unwrap();
        let beats = accepted_scene["beats"].as_array().unwrap();
        let anchor_index = beats.iter().position(|beat| beat["id"] == beat_id).unwrap();
        assert!(anchor_index > 0);
        assert_eq!(
            beats[anchor_index - 1]["payload"]["text"],
            "Inserted via renderer IPC"
        );
        let map_before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
        // A stale/deleted anchor must not fall back to insertion at the terminal Beat.
        let stale_anchor = ipc(
            &mut service,
            "scene.apply",
            json!({
                "sessionId": session,
                "expectedProjectRevision": inserted["value"]["projectRevision"],
                "expectedSourceMapRevision": inserted["value"]["sourceMapRevision"],
                "command": {"type": "insertBeat", "sceneId": scene_id,
                    "expectedSourceRevision": accepted_scene["sourceRevision"], "beforeBeatId": "missing-beat",
                    "beat": {"type": "narration", "text": "Must not be appended"}}
            }),
        );
        assert_eq!(stale_anchor["ok"], false, "{stale_anchor}");
        assert_eq!(fs::read(root.join(&source_path)).unwrap(), accepted);
        assert_eq!(
            fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
            map_before
        );

        // A fresh service verifies durability rather than reusing an in-memory model.
        service.close().unwrap();
        drop(service);
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let reopened = service.open_path(&root).unwrap();
        let listed = ipc(
            &mut service,
            "scene.list",
            json!({"sessionId": reopened.session_id}),
        );
        assert_eq!(listed["ok"], true, "{listed}");
        let projected = listed["value"].to_string();
        assert!(projected.contains("Inserted via renderer IPC"));
        assert!(projected.contains("Edited via renderer IPC"));
        let reopened_scene = listed["value"]["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|scene| scene["id"] == scene_id)
            .unwrap();
        let beats = reopened_scene["beats"].as_array().unwrap();
        let anchor_index = beats.iter().position(|beat| beat["id"] == beat_id).unwrap();
        assert_eq!(
            beats[anchor_index - 1]["payload"]["text"],
            "Inserted via renderer IPC"
        );
        assert_eq!(fs::read(root.join(&source_path)).unwrap(), accepted);
    }

    #[test]
    fn failed_candidate_recovery_preserves_current_project() {
        use crate::transaction::{
            CommitOutcome, ErrorCode, FaultInjector, FaultPoint, FileMutation, MutationKind,
            RelativePath, TransactionIntent, TransactionProposal, TransactionService,
        };
        struct StopAfterExchange;
        impl FaultInjector for StopAfterExchange {
            fn visit(&mut self, point: FaultPoint, _root: &Path) -> Result<(), ErrorCode> {
                if point == FaultPoint::AfterExchange(0) {
                    Err(ErrorCode::RecoveryRequired)
                } else {
                    Ok(())
                }
            }
        }
        let temp = tempfile::tempdir().unwrap();
        let old_root = temp.path().join("old-project");
        let candidate_root = temp.path().join("candidate-project");
        make_openable_project(&old_root, "Old");
        make_openable_project(&candidate_root, "Candidate");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let old = service.open_path(&old_root).unwrap();

        let transactions = TransactionService::default();
        let candidate_authority_root = fs::canonicalize(&candidate_root).unwrap();
        let project = transactions
            .register_trusted_project(&candidate_authority_root)
            .unwrap();
        let path = RelativePath::new("game/definitions/variables.rpy").unwrap();
        let (expected, revision) = transactions.snapshot(&project, path.clone()).unwrap();
        let outcome = transactions.commit_with_injector(
            &project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path,
                    kind: MutationKind::ReplaceExisting,
                    base: revision,
                    expected_bytes: expected,
                    proposed: b"# interrupted\n".to_vec(),
                }],
                intent: TransactionIntent::Edit,
            },
            &mut StopAfterExchange,
        );
        assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));

        assert!(matches!(
            service.open_path(&candidate_root),
            Err(LifecycleError::RecoveryRequired)
        ));
        let current = service.current().unwrap();
        assert_eq!(current.title, old.title);
        assert_eq!(current.session_id, old.session_id);
        assert!(service.authoring_list().is_ok());
    }

    #[test]
    fn project_sessions_are_unique_and_stale_tokens_are_rejected() {
        let temp = tempfile::tempdir().unwrap();
        let first_root = temp.path().join("first-project");
        let second_root = temp.path().join("second-project");
        make_openable_project(&first_root, "First");
        make_openable_project(&second_root, "Second");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let first = service.open_path(&first_root).unwrap();
        service.require_session(&first.session_id).unwrap();
        let second = service.open_path(&second_root).unwrap();
        assert!(matches!(
            service.require_session(&first.session_id),
            Err(LifecycleError::StaleSession)
        ));
        service.require_session(&second.session_id).unwrap();
        let reopened = service.open_path(&second_root).unwrap();
        assert_ne!(reopened.session_id, second.session_id);
        assert!(matches!(
            service.require_session(&second.session_id),
            Err(LifecycleError::StaleSession)
        ));
    }

    #[cfg(unix)]
    #[test]
    fn inspected_root_substitution_cannot_activate_or_replace_current() {
        let temp = tempfile::tempdir().unwrap();
        let old_root = temp.path().join("old-project");
        let candidate_root = temp.path().join("candidate-project");
        make_openable_project(&old_root, "Old");
        make_openable_project(&candidate_root, "Candidate");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let old = service.open_path(&old_root).unwrap();
        let inspected = inspect_valid_project(&candidate_root).unwrap();
        let moved = temp.path().join("moved-candidate");
        fs::rename(&candidate_root, &moved).unwrap();
        make_openable_project(&candidate_root, "Replacement");
        assert!(service.activate_project(inspected).is_err());
        assert_eq!(service.current().unwrap().session_id, old.session_id);
        assert!(moved.join(".renpy-editor/project.json").is_file());
    }

    fn recent_store(title: &str, project: &Path) -> RecentStore {
        RecentStore {
            schema_version: RECENT_SCHEMA_VERSION,
            entries: vec![RecentRecord {
                id: "recent".into(),
                project_id: "project".into(),
                title: title.into(),
                path: project.to_path_buf(),
                last_opened_unix_ms: 1,
            }],
        }
    }

    fn copy_tree(source: &Path, destination: &Path) {
        fs::create_dir(destination).unwrap();
        for entry in fs::read_dir(source).unwrap() {
            let entry = entry.unwrap();
            let kind = entry.file_type().unwrap();
            let target = destination.join(entry.file_name());
            if kind.is_dir() {
                copy_tree(&entry.path(), &target);
            } else if kind.is_file() {
                fs::copy(entry.path(), target).unwrap();
            } else {
                panic!("target fixture unexpectedly contains a link");
            }
        }
    }

    fn crash_managed_sdk_install(data_root: &Path, archive: &Path, checkpoint: &str) {
        let status = std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--ignored",
                "--exact",
                "renpy::tests::managed_install_crash_worker",
                "--nocapture",
            ])
            .env("LOOMLIGHT_SDK_CRASH_ROOT", data_root)
            .env("LOOMLIGHT_SDK_CRASH_ARCHIVE", archive)
            .env("LOOMLIGHT_SDK_CRASH_POINT", checkpoint)
            .status()
            .unwrap();
        assert_eq!(status.code(), Some(88), "SDK checkpoint {checkpoint}");
    }

    #[test]
    fn folder_generation_is_deterministic_and_validation_is_strict() {
        assert_eq!(
            folder_name_from_title("  The Last Tram!  "),
            "the-last-tram"
        );
        assert_eq!(folder_name_from_title("✨"), "untitled-project");
        for name in ["../escape", "a/b", "C:drive", "CON", "name.", ""] {
            assert!(validate_folder_name(name).is_err(), "{name}");
        }
    }

    #[test]
    fn existing_destination_is_refused_without_touching_data() {
        let temp = tempfile::tempdir().unwrap();
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let parent = temp.path().join("projects");
        fs::create_dir(&parent).unwrap();
        fs::create_dir(parent.join("existing")).unwrap();
        fs::write(parent.join("existing/keep"), b"keep").unwrap();
        let choice = service.register_parent(&parent).unwrap();
        let preview = service
            .validate_destination(&choice.id, "existing")
            .unwrap();
        assert!(!preview.valid);
        assert_eq!(fs::read(parent.join("existing/keep")).unwrap(), b"keep");
    }

    #[test]
    fn no_replace_promotion_refuses_empty_directory_and_symlink_destinations() {
        let temp = tempfile::tempdir().unwrap();
        let parent_path = temp.path().join("projects");
        fs::create_dir(&parent_path).unwrap();
        let parent = open_parent(&parent_path).unwrap();
        fs::create_dir(parent_path.join("stage")).unwrap();
        fs::write(parent_path.join("stage/accepted"), b"accepted").unwrap();
        fs::create_dir(parent_path.join("final")).unwrap();
        assert!(matches!(
            promote_no_replace(&parent, "stage", "final"),
            Err(LifecycleError::ExistingDestination)
        ));
        assert_eq!(
            fs::read(parent_path.join("stage/accepted")).unwrap(),
            b"accepted"
        );
        assert!(parent_path.join("final").is_dir());

        #[cfg(unix)]
        {
            use std::os::unix::fs::symlink;
            fs::remove_dir(parent_path.join("final")).unwrap();
            let outside = temp.path().join("outside");
            fs::create_dir(&outside).unwrap();
            symlink(&outside, parent_path.join("final")).unwrap();
            assert!(matches!(
                promote_no_replace(&parent, "stage", "final"),
                Err(LifecycleError::ExistingDestination)
            ));
            assert!(parent_path.join("stage/accepted").is_file());
            assert!(outside.read_dir().unwrap().next().is_none());
        }

        #[cfg(windows)]
        {
            use std::os::windows::fs::symlink_dir;
            fs::remove_dir(parent_path.join("final")).unwrap();
            let outside = temp.path().join("outside");
            fs::create_dir(&outside).unwrap();
            symlink_dir(&outside, parent_path.join("final"))
                .expect("runner must support Windows reparse-point evidence");
            assert!(matches!(
                promote_no_replace(&parent, "stage", "final"),
                Err(LifecycleError::ExistingDestination)
            ));
            assert!(parent_path.join("stage/accepted").is_file());
            assert!(outside.read_dir().unwrap().next().is_none());
        }
    }

    #[test]
    fn no_replace_promotion_moves_one_stage_when_destination_is_absent() {
        let temp = tempfile::tempdir().unwrap();
        let parent_path = temp.path().join("projects");
        fs::create_dir(&parent_path).unwrap();
        let parent = open_parent(&parent_path).unwrap();
        fs::create_dir(parent_path.join("stage")).unwrap();
        fs::write(parent_path.join("stage/accepted"), b"accepted").unwrap();
        promote_no_replace(&parent, "stage", "final").unwrap();
        assert!(!parent_path.join("stage").exists());
        assert_eq!(
            fs::read(parent_path.join("final/accepted")).unwrap(),
            b"accepted"
        );
    }

    #[test]
    fn cleanup_and_git_failure_are_bounded() {
        let temp = tempfile::tempdir().unwrap();
        let unrelated = temp.path().join("unrelated");
        fs::create_dir(&unrelated).unwrap();
        fs::write(unrelated.join(STAGE_MARKER), b"not a valid marker").unwrap();
        assert!(open_stage_anchor(unrelated.clone(), "unrelated".into(), "token".into()).is_err());
        assert!(unrelated.exists());
        assert!(matches!(
            initialise_git_with("loomlight-command-that-does-not-exist", temp.path()),
            Err(LifecycleError::GitUnavailable)
        ));
    }

    #[test]
    fn failed_generation_cleans_only_its_stage_and_never_adds_recent() {
        let temp = tempfile::tempdir().unwrap();
        let projects = temp.path().join("projects");
        fs::create_dir(&projects).unwrap();
        let unrelated = projects.join("unrelated");
        fs::create_dir(&unrelated).unwrap();
        fs::write(unrelated.join("keep"), b"keep").unwrap();
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let parent = service.register_parent(&projects).unwrap();
        service.sdks.insert(
            "invalid-sdk".into(),
            ValidatedSdk::invalid_for_test(temp.path().join("invalid-sdk")),
        );
        assert!(matches!(
            service.create_project(CreateProjectRequest {
                parent_id: parent.id,
                title: "Failure evidence".into(),
                folder_name: "failure-evidence".into(),
                sdk_id: "invalid-sdk".into(),
                width: 1920,
                height: 1080,
                initialize_git: false,
            }),
            Err(LifecycleError::UnsupportedSdk)
        ));
        assert!(!projects.join("failure-evidence").exists());
        assert_eq!(fs::read(unrelated.join("keep")).unwrap(), b"keep");
        assert!(fs::read_dir(&projects).unwrap().all(|entry| {
            !entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .starts_with(".loomlight-stage-")
        }));
        assert!(service.list_recent().is_empty());
    }

    #[test]
    fn recent_missing_and_remove_never_delete_project() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("state");
        let mut service = LifecycleService::new(root.clone()).unwrap();
        let project = temp.path().join("project");
        fs::create_dir(&project).unwrap();
        let record = RecentStore {
            schema_version: 1,
            entries: vec![RecentRecord {
                id: "recent".into(),
                project_id: "project".into(),
                title: "Title".into(),
                path: project.clone(),
                last_opened_unix_ms: 1,
            }],
        };
        service.write_recent(&record).unwrap();
        service.remove_recent("recent").unwrap();
        assert!(project.exists());
        let missing = temp.path().join("missing");
        let record = RecentStore {
            schema_version: 1,
            entries: vec![RecentRecord {
                id: "recent".into(),
                project_id: "project".into(),
                title: "Title".into(),
                path: missing,
                last_opened_unix_ms: 1,
            }],
        };
        service.write_recent(&record).unwrap();
        assert_eq!(service.list_recent()[0].status, "missing");
    }

    #[test]
    fn recent_store_replaces_atomically_without_normal_temp_leaks() {
        let temp = tempfile::tempdir().unwrap();
        let service = LifecycleService::new(temp.path().join("state")).unwrap();
        let mut record = RecentStore {
            schema_version: 1,
            entries: vec![RecentRecord {
                id: "recent".into(),
                project_id: "project".into(),
                title: "First".into(),
                path: temp.path().join("project"),
                last_opened_unix_ms: 1,
            }],
        };
        service.write_recent(&record).unwrap();
        record.entries[0].title = "Second".into();
        service.write_recent(&record).unwrap();
        assert_eq!(service.read_recent().entries[0].title, "Second");
        assert!(fs::read_dir(temp.path().join("state"))
            .unwrap()
            .all(|entry| {
                !entry
                    .unwrap()
                    .file_name()
                    .to_string_lossy()
                    .starts_with(".recent-projects-")
            }));
    }

    #[test]
    fn recent_precommit_failures_preserve_last_committed_store() {
        for checkpoint in [
            RecentWriteCheckpoint::StagePartiallyWritten,
            RecentWriteCheckpoint::StageDurable,
        ] {
            let temp = tempfile::tempdir().unwrap();
            let service = LifecycleService::new(temp.path().join("state")).unwrap();
            service
                .write_recent(&recent_store("Committed", &temp.path().join("project")))
                .unwrap();
            let result = service.write_recent_with_hook(
                &recent_store("Uncommitted", &temp.path().join("project")),
                |point| {
                    if point == checkpoint {
                        Err(LifecycleError::Io)
                    } else {
                        Ok(())
                    }
                },
            );
            assert!(matches!(result, Err(LifecycleError::Io)));
            assert_eq!(service.read_recent().entries[0].title, "Committed");
            assert!(fs::read_dir(temp.path().join("state"))
                .unwrap()
                .all(|entry| {
                    !entry
                        .unwrap()
                        .file_name()
                        .to_string_lossy()
                        .starts_with(".recent-projects-")
                }));
        }
    }

    #[test]
    fn recent_postcommit_failure_restarts_at_new_committed_store() {
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        let service = LifecycleService::new(state.clone()).unwrap();
        service
            .write_recent(&recent_store("Old", &temp.path().join("project")))
            .unwrap();
        let result = service.write_recent_with_hook(
            &recent_store("New", &temp.path().join("project")),
            |point| {
                if point == RecentWriteCheckpoint::ReplacementCommitted {
                    Err(LifecycleError::Io)
                } else {
                    Ok(())
                }
            },
        );
        assert!(matches!(result, Err(LifecycleError::Io)));
        drop(service);
        let restarted = LifecycleService::new(state).unwrap();
        assert_eq!(restarted.read_recent().entries[0].title, "New");
    }

    #[test]
    fn stale_recent_temporary_is_ignored_and_never_deleted_as_cleanup() {
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        let service = LifecycleService::new(state.clone()).unwrap();
        service
            .write_recent(&recent_store("Committed", &temp.path().join("project")))
            .unwrap();
        let stale = state.join(format!(".recent-projects-{}.tmp", uuid::Uuid::new_v4()));
        fs::write(&stale, b"{truncated").unwrap();
        assert_eq!(service.read_recent().entries[0].title, "Committed");
        service
            .write_recent(&recent_store("Updated", &temp.path().join("project")))
            .unwrap();
        assert_eq!(service.read_recent().entries[0].title, "Updated");
        assert_eq!(fs::read(&stale).unwrap(), b"{truncated");
    }

    #[cfg(unix)]
    #[test]
    fn recent_symlink_substitution_fails_closed_without_touching_target() {
        use std::os::unix::fs::symlink;
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        let service = LifecycleService::new(state.clone()).unwrap();
        let outside = temp.path().join("outside.json");
        fs::write(&outside, b"outside").unwrap();
        symlink(&outside, state.join("recent-projects.json")).unwrap();
        assert!(matches!(
            service.write_recent(&recent_store("Blocked", &temp.path().join("project"))),
            Err(LifecycleError::UnsafePath)
        ));
        assert_eq!(fs::read(&outside).unwrap(), b"outside");
        assert!(fs::symlink_metadata(state.join("recent-projects.json"))
            .unwrap()
            .file_type()
            .is_symlink());
    }

    #[cfg(windows)]
    #[test]
    fn recent_reparse_substitution_fails_closed_without_touching_target() {
        use std::os::windows::fs::symlink_file;
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        let service = LifecycleService::new(state.clone()).unwrap();
        let outside = temp.path().join("outside.json");
        fs::write(&outside, b"outside").unwrap();
        symlink_file(&outside, state.join("recent-projects.json")).unwrap();
        assert!(matches!(
            service.write_recent(&recent_store("Blocked", &temp.path().join("project"))),
            Err(LifecycleError::UnsafePath)
        ));
        assert_eq!(fs::read(&outside).unwrap(), b"outside");
    }

    #[test]
    fn recent_data_root_substitution_fails_closed() {
        let temp = tempfile::tempdir().unwrap();
        let state = temp.path().join("state");
        let service = LifecycleService::new(state.clone()).unwrap();
        service
            .write_recent(&recent_store("Committed", &temp.path().join("project")))
            .unwrap();
        let original = temp.path().join("original-state");
        #[cfg(unix)]
        {
            fs::rename(&state, &original).unwrap();
            fs::create_dir(&state).unwrap();
            assert!(service
                .write_recent(&recent_store("Blocked", &temp.path().join("project")))
                .is_err());
            assert!(!state.join("recent-projects.json").exists());
            assert_eq!(
                serde_json::from_slice::<RecentStore>(
                    &fs::read(original.join("recent-projects.json")).unwrap()
                )
                .unwrap()
                .entries[0]
                    .title,
                "Committed"
            );
        }
        #[cfg(windows)]
        {
            assert!(fs::rename(&state, &original).is_err());
            service
                .write_recent(&recent_store("Pinned", &temp.path().join("project")))
                .unwrap();
            assert_eq!(service.read_recent().entries[0].title, "Pinned");
        }
    }

    #[test]
    fn recent_crash_checkpoints_restart_from_a_complete_store() {
        for checkpoint in ["partial", "durable", "committed"] {
            let temp = tempfile::tempdir().unwrap();
            let state = temp.path().join("state");
            let service = LifecycleService::new(state.clone()).unwrap();
            service
                .write_recent(&recent_store("Old", &temp.path().join("project")))
                .unwrap();
            drop(service);
            let status = std::process::Command::new(std::env::current_exe().unwrap())
                .args([
                    "--ignored",
                    "--exact",
                    "lifecycle::tests::recent_write_crash_worker",
                    "--nocapture",
                ])
                .env("LOOMLIGHT_RECENT_CRASH_ROOT", &state)
                .env("LOOMLIGHT_RECENT_CRASH_POINT", checkpoint)
                .status()
                .unwrap();
            assert_eq!(status.code(), Some(87), "checkpoint {checkpoint}");
            let restarted = LifecycleService::new(state).unwrap();
            let expected = if checkpoint == "committed" {
                "New"
            } else {
                "Old"
            };
            assert_eq!(restarted.read_recent().entries[0].title, expected);
        }
    }

    #[test]
    #[ignore = "subprocess worker invoked by the Recent Projects crash test"]
    fn recent_write_crash_worker() {
        let Some(root) = std::env::var_os("LOOMLIGHT_RECENT_CRASH_ROOT") else {
            return;
        };
        let point = std::env::var("LOOMLIGHT_RECENT_CRASH_POINT").unwrap();
        let service = LifecycleService::new(PathBuf::from(root)).unwrap();
        let store = recent_store("New", Path::new("project"));
        let _ = service.write_recent_with_hook(&store, |checkpoint| {
            let should_crash = matches!(
                (point.as_str(), checkpoint),
                ("partial", RecentWriteCheckpoint::StagePartiallyWritten)
                    | ("durable", RecentWriteCheckpoint::StageDurable)
                    | ("committed", RecentWriteCheckpoint::ReplacementCommitted)
            );
            if should_crash {
                std::process::exit(87);
            }
            Ok(())
        });
        panic!("worker did not reach requested crash checkpoint");
    }

    #[cfg(unix)]
    #[test]
    fn stage_identity_rejects_same_name_replacement_before_promotion() {
        let temp = tempfile::tempdir().unwrap();
        let parent_path = temp.path().join("projects");
        fs::create_dir(&parent_path).unwrap();
        let parent = open_parent(&parent_path).unwrap();
        let parent_path = parent.path.clone();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        let stage_path = parent_path.join(&name);
        fs::create_dir(&stage_path).unwrap();
        restrict_directory(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        let mut stage = open_stage_anchor(stage_path.clone(), name.clone(), token.clone()).unwrap();
        let moved = parent_path.join("moved-original-stage");
        fs::rename(&stage_path, &moved).unwrap();
        fs::create_dir(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        assert!(matches!(
            validate_stage_identity(&stage),
            Err(LifecycleError::UnsafePath)
        ));
        assert!(matches!(
            promote_anchored_stage(&parent, &mut stage, "final"),
            Err(LifecycleError::UnsafePath)
        ));
        assert!(!parent_path.join("final").exists());
        assert!(moved.exists());
    }

    #[test]
    fn substitution_after_final_validation_never_survives_as_final() {
        let temp = tempfile::tempdir().unwrap();
        let requested_parent = temp.path().join("projects");
        fs::create_dir(&requested_parent).unwrap();
        let parent = open_parent(&requested_parent).unwrap();
        let parent_path = parent.path.clone();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        let stage_path = parent_path.join(&name);
        fs::create_dir(&stage_path).unwrap();
        restrict_directory(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        let mut stage = open_stage_anchor(stage_path.clone(), name, token.clone()).unwrap();
        let moved = parent_path.join("moved-original-stage");
        let result = promote_anchored_stage_with_hook(&parent, &mut stage, "final", || {
            fs::rename(&stage_path, &moved).map_err(|_| LifecycleError::Io)?;
            fs::create_dir(&stage_path).map_err(|_| LifecycleError::Io)?;
            fs::write(
                stage_path.join(STAGE_MARKER),
                format!("loomlight-project-stage-v1\n{token}\n"),
            )
            .map_err(|_| LifecycleError::Io)?;
            fs::write(stage_path.join("replacement"), b"replacement")
                .map_err(|_| LifecycleError::Io)?;
            Ok(())
        });
        assert!(matches!(result, Err(LifecycleError::PromotionFailed)));
        assert!(!parent_path.join("final").exists());
        assert!(moved.exists());
        assert!(fs::read_dir(&parent_path).unwrap().any(|entry| {
            let path = entry.unwrap().path();
            path.file_name().is_some_and(|name| {
                name.to_string_lossy()
                    .starts_with(".loomlight-rejected-final-")
            }) && path.join("replacement").is_file()
        }));
    }

    #[cfg(unix)]
    #[test]
    fn overlay_writes_cannot_follow_stage_path_substitution() {
        let temp = tempfile::tempdir().unwrap();
        let requested_parent = temp.path().join("projects");
        fs::create_dir(&requested_parent).unwrap();
        let parent_path = requested_parent.canonicalize().unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        let stage_path = parent_path.join(&name);
        fs::create_dir(&stage_path).unwrap();
        restrict_directory(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        fs::create_dir(stage_path.join("game")).unwrap();
        fs::write(
            stage_path.join("game/options.rpy"),
            b"define config.name = _(\"Template\")\ndefine build.name = \"template\"\n",
        )
        .unwrap();
        let stage = open_stage_anchor(stage_path.clone(), name, token).unwrap();
        let moved = parent_path.join("moved-overlay-stage");
        let replacement = stage_path.clone();
        let result = apply_overlay_with_hook(
            &stage,
            "Overlay Race",
            "overlay-race",
            Resolution {
                width: 1280,
                height: 720,
            },
            || {
                fs::rename(&stage_path, &moved).map_err(|_| LifecycleError::Io)?;
                fs::create_dir(&replacement).map_err(|_| LifecycleError::Io)?;
                fs::write(replacement.join("sentinel"), b"replacement")
                    .map_err(|_| LifecycleError::Io)?;
                Ok(())
            },
        );
        assert!(matches!(result, Err(LifecycleError::UnsafePath)));
        assert_eq!(
            fs::read(replacement.join("sentinel")).unwrap(),
            b"replacement"
        );
        assert!(!replacement.join(".renpy-editor").exists());
        assert!(moved.join("game/options.rpy").is_file());
    }

    #[cfg(windows)]
    #[test]
    fn stage_pin_blocks_substitution_during_privileged_work() {
        let temp = tempfile::tempdir().unwrap();
        let parent_path = temp.path().join("projects");
        fs::create_dir(&parent_path).unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        let stage_path = parent_path.join(&name);
        fs::create_dir(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        let stage = open_stage_anchor(stage_path.clone(), name, token).unwrap();
        assert!(fs::rename(&stage_path, parent_path.join("moved")).is_err());
        validate_stage_identity(&stage).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn parent_symlink_substitution_fails_closed() {
        use std::os::unix::fs::symlink;
        let temp = tempfile::tempdir().unwrap();
        let real = temp.path().join("real");
        fs::create_dir(&real).unwrap();
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let choice = service.register_parent(&real).unwrap();
        fs::rename(&real, temp.path().join("moved")).unwrap();
        fs::create_dir(&real).unwrap();
        assert!(matches!(
            service.validate_destination(&choice.id, "project"),
            Err(LifecycleError::UnsafePath)
        ));
        fs::remove_dir(&real).unwrap();
        symlink(temp.path().join("moved"), &real).unwrap();
        assert!(matches!(
            service.validate_destination(&choice.id, "project"),
            Err(LifecycleError::UnsafePath)
        ));
    }

    #[test]
    fn parent_substitution_after_validation_cannot_redirect_stage_creation() {
        let temp = tempfile::tempdir().unwrap();
        let requested = temp.path().join("projects");
        fs::create_dir(&requested).unwrap();
        let parent = open_parent(&requested).unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let stage_name = format!(".loomlight-stage-{token}");
        let moved = temp.path().join("moved-projects");
        let result = create_project_stage(&parent, stage_name.clone(), token, || {
            #[cfg(unix)]
            {
                fs::rename(&requested, &moved).map_err(|_| LifecycleError::Io)?;
                fs::create_dir(&requested).map_err(|_| LifecycleError::Io)?;
            }
            #[cfg(windows)]
            assert!(fs::rename(&requested, &moved).is_err());
            Ok(())
        });
        #[cfg(unix)]
        {
            assert!(matches!(result, Err(LifecycleError::UnsafePath)));
            assert!(!requested.join(&stage_name).exists());
            assert!(!moved.join(&stage_name).exists());
        }
        #[cfg(windows)]
        {
            let mut stage = result.unwrap();
            cleanup_stage(&parent, &mut stage).unwrap();
        }
    }

    #[test]
    fn project_open_metadata_substitution_is_never_followed() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("project");
        let editor = root.join(".renpy-editor");
        let moved = root.join("moved-editor");
        fs::create_dir(&root).unwrap();
        fs::create_dir(&editor).unwrap();
        fs::write(editor.join("project.json"), b"original").unwrap();
        let result = open_valid_project_with_hook(&root, || {
            #[cfg(unix)]
            {
                fs::rename(&editor, &moved).map_err(|_| LifecycleError::Io)?;
                fs::create_dir(&editor).map_err(|_| LifecycleError::Io)?;
                fs::write(editor.join("project.json"), b"replacement")
                    .map_err(|_| LifecycleError::Io)?;
                Ok(())
            }
            #[cfg(windows)]
            {
                assert!(fs::rename(&editor, &moved).is_err());
                Err(LifecycleError::Io)
            }
        });
        #[cfg(unix)]
        assert!(matches!(result, Err(LifecycleError::UnsafePath)));
        #[cfg(windows)]
        assert!(matches!(result, Err(LifecycleError::Io)));
        assert_eq!(fs::read(editor.join("project.json")).unwrap(), {
            #[cfg(unix)]
            {
                b"replacement".as_slice()
            }
            #[cfg(windows)]
            {
                b"original".as_slice()
            }
        });
        #[cfg(unix)]
        assert_eq!(fs::read(moved.join("project.json")).unwrap(), b"original");
    }

    #[test]
    fn arbitrary_renpy_project_without_metadata_is_rejected_as_invalid_metadata() {
        let temp = tempfile::tempdir().unwrap();
        let project = temp.path().join("arbitrary");
        fs::create_dir(&project).unwrap();
        fs::create_dir(project.join("game")).unwrap();
        fs::write(
            project.join("game/script.rpy"),
            b"label start:\n    return\n",
        )
        .unwrap();

        assert!(matches!(
            open_valid_project(&project),
            Err(LifecycleError::InvalidMetadata)
        ));
    }

    #[test]
    #[allow(clippy::drop_non_drop)]
    fn official_sdk_phase_1c_target_gate() {
        let Some(archive) = std::env::var_os("LOOMLIGHT_PHASE1C_SDK_ARCHIVE") else {
            eprintln!("phase-1c-target-gate: skipped (no official SDK archive)");
            return;
        };
        let temp = tempfile::tempdir().unwrap();
        let archive = Path::new(&archive);
        let interrupted_before = temp.path().join("managed-before-promotion");
        crash_managed_sdk_install(&interrupted_before, archive, "before");
        let recovered_before =
            crate::renpy::install_supported_sdk_from_archive(&interrupted_before, archive).unwrap();
        assert_eq!(recovered_before.version, SUPPORTED_VERSION);

        let managed_state = temp.path().join("managed-after-promotion");
        crash_managed_sdk_install(&managed_state, archive, "after");
        let sdk =
            crate::renpy::install_supported_sdk_from_archive(&managed_state, archive).unwrap();
        assert_eq!(sdk.version, SUPPORTED_VERSION);
        let already_installed =
            crate::renpy::install_supported_sdk_from_archive(&managed_state, archive).unwrap();
        assert!(sdk.same_identity(&already_installed));
        println!("phase-1c-remediation-sdk-recovery: passed");
        let (embedded_provenance, legacy_provenance) =
            crate::renpy::managed_provenance_paths_for_test(&managed_state);
        assert!(embedded_provenance.is_file());
        assert!(!legacy_provenance.exists());
        let withheld_provenance = temp.path().join("withheld-managed-provenance");
        fs::rename(&embedded_provenance, &withheld_provenance).unwrap();
        let spawn_count = crate::renpy::process_spawn_count_for_test();
        assert!(matches!(
            crate::renpy::discover_managed_sdk(&managed_state),
            Err(RenpyError::InvalidSdk)
        ));
        assert_eq!(crate::renpy::process_spawn_count_for_test(), spawn_count);
        fs::rename(&withheld_provenance, &embedded_provenance).unwrap();
        println!("phase-1c-remediation-sdk-trust-order: passed");
        fs::rename(&embedded_provenance, &legacy_provenance).unwrap();
        fs::write(&embedded_provenance, b"truncated migration record").unwrap();
        let migrated = crate::renpy::discover_managed_sdk(&managed_state)
            .unwrap()
            .expect("legacy provenance should migrate into the managed SDK");
        assert!(sdk.same_identity(&migrated));
        assert!(embedded_provenance.is_file());
        assert!(fs::read_dir(&sdk.root).unwrap().any(|entry| entry
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with(".loomlight-sdk-provenance-rejected-")));
        let discovered = crate::renpy::discover_managed_sdk(&managed_state)
            .unwrap()
            .expect("managed SDK should retain verified provenance");
        assert!(sdk.same_identity(&discovered));

        let sdk_root = sdk.root.clone();
        let moved_sdk = temp.path().join("moved-managed-sdk");
        fs::rename(&sdk_root, &moved_sdk).unwrap();
        fs::create_dir(&sdk_root).unwrap();
        assert!(sdk.revalidate(false).is_err());
        fs::remove_dir(&sdk_root).unwrap();
        fs::rename(&moved_sdk, &sdk_root).unwrap();
        sdk.revalidate(true).unwrap();

        {
            let requested_stage_parent = temp.path().join("anchored-child-test");
            fs::create_dir(&requested_stage_parent).unwrap();
            let stage_parent = requested_stage_parent.canonicalize().unwrap();
            let token = uuid::Uuid::new_v4().to_string();
            let stage_name = format!(".loomlight-stage-{token}");
            let stage_path = stage_parent.join(&stage_name);
            fs::create_dir(&stage_path).unwrap();
            restrict_directory(&stage_path).unwrap();
            fs::write(
                stage_path.join(STAGE_MARKER),
                format!("loomlight-project-stage-v1\n{token}\n"),
            )
            .unwrap();
            fs::create_dir(stage_path.join("game")).unwrap();
            let stage = open_stage_anchor(stage_path.clone(), stage_name, token).unwrap();
            let moved = stage_parent.join("moved-anchored-child-stage");
            RenpyAdapter::generate_starter_anchored_with_hooks(
                &sdk,
                &stage_path,
                stage_file(&stage).unwrap(),
                1280,
                720,
                || {
                    #[cfg(unix)]
                    {
                        fs::rename(&stage_path, &moved).map_err(|_| RenpyError::Io)?;
                        fs::create_dir(&stage_path).map_err(|_| RenpyError::Io)?;
                        fs::create_dir(stage_path.join("game")).map_err(|_| RenpyError::Io)?;
                    }
                    #[cfg(windows)]
                    assert!(fs::rename(&stage_path, &moved).is_err());
                    Ok(())
                },
                || Ok(()),
            )
            .unwrap();
            #[cfg(unix)]
            {
                assert!(moved.join("game/screens.rpy").is_file());
                assert!(!stage_path.join("game/screens.rpy").exists());
            }
            #[cfg(windows)]
            assert!(stage_path.join("game/screens.rpy").is_file());
        }

        {
            let requested_stage_parent = temp.path().join("inflight-child-test");
            fs::create_dir(&requested_stage_parent).unwrap();
            let stage_parent = requested_stage_parent.canonicalize().unwrap();
            let token = uuid::Uuid::new_v4().to_string();
            let stage_name = format!(".loomlight-stage-{token}");
            let stage_path = stage_parent.join(&stage_name);
            fs::create_dir(&stage_path).unwrap();
            restrict_directory(&stage_path).unwrap();
            fs::write(
                stage_path.join(STAGE_MARKER),
                format!("loomlight-project-stage-v1\n{token}\n"),
            )
            .unwrap();
            fs::create_dir(stage_path.join("game")).unwrap();
            let stage = open_stage_anchor(stage_path.clone(), stage_name, token).unwrap();
            let moved = stage_parent.join("moved-inflight-child-stage");
            RenpyAdapter::generate_starter_anchored_with_hooks(
                &sdk,
                &stage_path,
                stage_file(&stage).unwrap(),
                1280,
                720,
                || Ok(()),
                || {
                    #[cfg(unix)]
                    {
                        fs::rename(&stage_path, &moved).map_err(|_| RenpyError::Io)?;
                        fs::create_dir(&stage_path).map_err(|_| RenpyError::Io)?;
                        fs::create_dir(stage_path.join("game")).map_err(|_| RenpyError::Io)?;
                    }
                    #[cfg(windows)]
                    assert!(fs::rename(&stage_path, &moved).is_err());
                    Ok(())
                },
            )
            .unwrap();
            #[cfg(unix)]
            {
                assert!(moved.join("game/screens.rpy").is_file());
                assert!(!stage_path.join("game/screens.rpy").exists());
            }
            #[cfg(windows)]
            assert!(stage_path.join("game/screens.rpy").is_file());
        }
        println!("phase-1c-remediation-stage-races: passed");

        let projects = temp.path().join("projects");
        fs::create_dir(&projects).unwrap();
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let parent = service.register_parent(&projects).unwrap();
        let selected = service.register_sdk(&sdk_root, "target-test").unwrap();
        let selected_again = service.register_sdk(&sdk_root, "target-test").unwrap();
        assert_eq!(selected.id, selected_again.id);
        let hostile_git_dir = temp.path().join("hostile-git-dir");
        let hostile_object_dir = temp.path().join("hostile-git-objects");
        std::env::set_var("GIT_DIR", &hostile_git_dir);
        std::env::set_var("GIT_OBJECT_DIRECTORY", &hostile_object_dir);
        let created = service
            .create_project(CreateProjectRequest {
                parent_id: parent.id,
                title: "Target Gate — Story".into(),
                folder_name: "target-gate-story".into(),
                sdk_id: selected.id,
                width: 1920,
                height: 1080,
                initialize_git: true,
            })
            .unwrap();
        std::env::remove_var("GIT_DIR");
        std::env::remove_var("GIT_OBJECT_DIRECTORY");
        let project = created.project.unwrap();
        let final_root = projects.join("target-gate-story");
        assert!(final_root.join(".git").is_dir());
        assert!(!hostile_git_dir.exists());
        assert!(!hostile_object_dir.exists());
        assert!(!final_root.join(STAGE_MARKER).exists());
        for path in [
            "game/script.rpy",
            "game/options.rpy",
            "game/gui.rpy",
            "game/screens.rpy",
            "game/gui",
            "game/chapters/chapter_01/scene_001.rpy",
            ".renpy-editor/project.json",
            ".renpy-editor/source-map.json",
            ".renpy-editor/authoring.json",
        ] {
            assert!(final_root.join(path).exists(), "missing {path}");
        }

        let first = service
            .authoring_create_character(CreateCharacterRequest {
                technical_name: "alice".into(),
                display_name: "Alice".into(),
                dialogue_color: "#aabbcc".into(),
            })
            .unwrap();
        let alice_id = first.characters[0].id.clone();
        let second = service
            .authoring_create_character(CreateCharacterRequest {
                technical_name: "ben".into(),
                display_name: "Ben".into(),
                dialogue_color: "#ccbbaa".into(),
            })
            .unwrap();
        let ben_id = second
            .characters
            .iter()
            .find(|character| character.technical_name == "ben")
            .unwrap()
            .id
            .clone();
        service
            .authoring_create_variable(CreateVariableRequest {
                technical_name: "door_open".into(),
                variable_type: crate::authoring::VariableType::Bool,
                default_value: serde_json::Value::Bool(false),
            })
            .unwrap();
        service
            .authoring_create_variable(CreateVariableRequest {
                technical_name: "score".into(),
                variable_type: crate::authoring::VariableType::Int,
                default_value: serde_json::Value::from(-2),
            })
            .unwrap();
        service
            .authoring_create_variable(CreateVariableRequest {
                technical_name: "greeting".into(),
                variable_type: crate::authoring::VariableType::String,
                default_value: serde_json::Value::String("Hello \\\"world\\\" — café\\n".into()),
            })
            .unwrap();

        let ipc_list = crate::handle_application_request(
            serde_json::json!({
                "protocolVersion": 1,
                "requestId": "phase-1d-exact-ipc",
                "operation": "authoring.list",
                "payload": { "sessionId": project.session_id }
            }),
            false,
            &mut service,
        );
        let ipc_json = serde_json::to_value(ipc_list).unwrap();
        let ipc_score = ipc_json["value"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|variable| variable["technicalName"] == "score")
            .unwrap();
        assert_eq!(ipc_score["defaultValue"], "-2");
        let ipc_create = crate::handle_application_request(
            serde_json::json!({
                "protocolVersion": 1,
                "requestId": "phase-1d-i64-create",
                "operation": "variable.create",
                "payload": {
                    "sessionId": project.session_id,
                    "technicalName": "ipc_boundary",
                    "variableType": "int",
                    "defaultValue": "9223372036854775807"
                }
            }),
            false,
            &mut service,
        );
        let ipc_create_json = serde_json::to_value(ipc_create).unwrap();
        assert_eq!(ipc_create_json["ok"], true);
        let ipc_boundary = ipc_create_json["value"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|variable| variable["technicalName"] == "ipc_boundary")
            .unwrap();
        assert_eq!(ipc_boundary["defaultValue"], "9223372036854775807");
        let boundary_id = ipc_boundary["id"].as_str().unwrap().to_owned();
        let boundary_revision = ipc_boundary["source"]["sourceRevision"]
            .as_str()
            .unwrap()
            .to_owned();
        let ipc_update = crate::handle_application_request(
            serde_json::json!({
                "protocolVersion": 1,
                "requestId": "phase-1d-i64-update",
                "operation": "variable.update",
                "payload": {
                    "sessionId": project.session_id,
                    "id": boundary_id,
                    "expectedSourceRevision": boundary_revision,
                    "defaultValue": "-9223372036854775808"
                }
            }),
            false,
            &mut service,
        );
        let ipc_update_json = serde_json::to_value(ipc_update).unwrap();
        assert_eq!(ipc_update_json["ok"], true);
        let ipc_boundary = ipc_update_json["value"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|variable| variable["technicalName"] == "ipc_boundary")
            .unwrap();
        assert_eq!(ipc_boundary["defaultValue"], "-9223372036854775808");
        println!("phase-1d-exact-ipc-gate: passed");

        let media = temp.path().join("synthetic-media");
        fs::create_dir(&media).unwrap();
        // Repository-independent 1x1 PNG and tiny PCM WAV fixtures generated only for
        // this controlled target test. No private or copyrighted media is retained.
        let png: &[u8] = &[
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1,
            8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207,
            192, 240, 31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
            96, 130,
        ];
        let mut wav = b"RIFF\x26\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x40\x1f\x00\x00\x80\x3e\x00\x00\x02\x00\x10\x00data\x02\x00\x00\x00\x00\x00".to_vec();
        let mut import_media = |filename: &str,
                                bytes: &[u8],
                                kind: crate::authoring::AssetKind,
                                technical_name: &str,
                                display_name: &str,
                                character_id: Option<String>,
                                expression: Option<String>| {
            let path = media.join(filename);
            fs::write(&path, bytes).unwrap();
            let selected = service.authoring_select_import(&path).unwrap();
            service
                .authoring_import_asset(ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind,
                    technical_name: technical_name.into(),
                    display_name: display_name.into(),
                    character_id,
                    expression,
                })
                .unwrap()
        };
        import_media(
            "alice-happy.png",
            png,
            crate::authoring::AssetKind::CharacterAppearance,
            "happy",
            "Alice happy",
            Some(alice_id.clone()),
            Some("happy".into()),
        );
        let mut second_png = png.to_vec();
        second_png.extend_from_slice(b"synthetic-variant-2");
        import_media(
            "alice-sad.png",
            &second_png,
            crate::authoring::AssetKind::CharacterAppearance,
            "sad",
            "Alice sad",
            Some(alice_id.clone()),
            Some("sad".into()),
        );
        let mut third_png = png.to_vec();
        third_png.extend_from_slice(b"synthetic-variant-3");
        import_media(
            "ben-neutral.png",
            &third_png,
            crate::authoring::AssetKind::CharacterAppearance,
            "neutral",
            "Ben neutral",
            Some(ben_id),
            Some("neutral".into()),
        );
        let mut background_png = png.to_vec();
        background_png.extend_from_slice(b"synthetic-background");
        import_media(
            "cafe.png",
            &background_png,
            crate::authoring::AssetKind::Background,
            "cafe",
            "Cafe",
            None,
            None,
        );
        import_media(
            "theme.wav",
            &wav,
            crate::authoring::AssetKind::Music,
            "theme",
            "Theme",
            None,
            None,
        );
        wav.push(0);
        import_media(
            "click.wav",
            &wav,
            crate::authoring::AssetKind::Sfx,
            "click",
            "Click",
            None,
            None,
        );
        drop(import_media);

        let authored = service.authoring_list().unwrap();
        assert_eq!(authored.characters.len(), 2);
        assert_eq!(authored.appearances.len(), 3);
        assert_eq!(authored.assets.len(), 6);
        assert_eq!(authored.variables.len(), 4);
        let stable_ids = authored
            .characters
            .iter()
            .map(|item| item.id.clone())
            .chain(authored.appearances.iter().map(|item| item.id.clone()))
            .chain(authored.assets.iter().map(|item| item.id.clone()))
            .chain(authored.variables.iter().map(|item| item.id.clone()))
            .collect::<Vec<_>>();
        let characters_source =
            fs::read_to_string(final_root.join("game/definitions/characters.rpy")).unwrap();
        assert!(
            characters_source.contains("define alice = Character(\"Alice\", color=\"#aabbcc\")")
        );
        let variables_source =
            fs::read_to_string(final_root.join("game/definitions/variables.rpy")).unwrap();
        assert!(variables_source.contains("default door_open = False"));
        assert!(variables_source.contains("default score = -2"));
        assert!(variables_source.contains("default greeting = \"Hello"));

        let screens = fs::read_to_string(final_root.join("game/screens.rpy")).unwrap();
        for expected in ["main_menu", "save", "load", "preferences", "history"] {
            assert!(
                screens.contains(expected),
                "standard screens missing {expected}"
            );
        }
        let mut scene_workspace = service.scene_workspace().unwrap();
        let entry_scene_id = scene_workspace.entry_scene_id.clone();
        let chapter_one = scene_workspace.chapters[0].id.clone();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::CreateChapter {
                display_name: "Branches".into(),
            },
        );
        let chapter_two = scene_workspace.chapters[1].id.clone();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::CreateScene {
                chapter_id: chapter_one,
                display_name: "Garden".into(),
            },
        );
        let garden = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Garden")
            .unwrap()
            .clone();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::MoveScene {
                scene_id: garden.id.clone(),
                chapter_id: chapter_two.clone(),
                direction: None,
                expected_source_revision: garden.source_revision,
            },
        );
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::CreateScene {
                chapter_id: chapter_two.clone(),
                display_name: "Library".into(),
            },
        );
        let garden_id = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Garden")
            .unwrap()
            .id
            .clone();
        let library_id = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.display_name == "Library")
            .unwrap()
            .id
            .clone();
        let appearance_id = authored
            .appearances
            .iter()
            .find(|appearance| appearance.character_id == alice_id && appearance.label == "happy")
            .unwrap()
            .id
            .clone();
        let background_id = authored
            .assets
            .iter()
            .find(|asset| asset.kind == crate::authoring::AssetKind::Background)
            .unwrap()
            .id
            .clone();
        let music_id = authored
            .assets
            .iter()
            .find(|asset| asset.kind == crate::authoring::AssetKind::Music)
            .unwrap()
            .id
            .clone();
        let sfx_id = authored
            .assets
            .iter()
            .find(|asset| asset.kind == crate::authoring::AssetKind::Sfx)
            .unwrap()
            .id
            .clone();
        let flag_id = authored
            .variables
            .iter()
            .find(|variable| variable.technical_name == "door_open")
            .unwrap()
            .id
            .clone();
        for beat in [
            crate::scene::BeatPayload::Background {
                asset_id: background_id.clone(),
                transition: crate::scene::TransitionRef::Dissolve,
            },
            crate::scene::BeatPayload::ShowCharacter {
                character_id: alice_id.clone(),
                appearance_id,
                placement: crate::scene::PlacementRef::Centre,
                transition: crate::scene::TransitionRef::None,
            },
            crate::scene::BeatPayload::Dialogue {
                character_id: alice_id.clone(),
                text: "Welcome to Loomlight.".into(),
            },
            crate::scene::BeatPayload::Narration {
                text: "A production-authored Scene.".into(),
            },
            crate::scene::BeatPayload::PlayMusic {
                asset_id: music_id.clone(),
            },
            crate::scene::BeatPayload::PlaySfx { asset_id: sfx_id },
            crate::scene::BeatPayload::SetVariable {
                variable_id: flag_id,
                value: serde_json::Value::Bool(true),
            },
        ] {
            let entry = scene_workspace
                .scenes
                .iter()
                .find(|scene| scene.id == entry_scene_id)
                .unwrap();
            scene_workspace = apply_scene_target(
                &service,
                &scene_workspace,
                crate::scene::SceneCommand::InsertBeat {
                    scene_id: entry.id.clone(),
                    expected_source_revision: entry.source_revision.clone(),
                    before_beat_id: None,
                    beat,
                },
            );
        }
        let entry = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.id == entry_scene_id)
            .unwrap();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::InsertBeat {
                scene_id: entry.id.clone(),
                expected_source_revision: entry.source_revision.clone(),
                before_beat_id: None,
                beat: crate::scene::BeatPayload::Choice {
                    options: vec![
                        crate::scene::ChoiceOption {
                            text: "Garden".into(),
                            destination_scene_id: garden_id.clone(),
                        },
                        crate::scene::ChoiceOption {
                            text: "Library".into(),
                            destination_scene_id: library_id.clone(),
                        },
                    ],
                },
            },
        );
        let entry = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.id == entry_scene_id)
            .unwrap();
        let choice = entry
            .beats
            .iter()
            .find(|beat| matches!(beat.payload, crate::scene::BeatPayload::Choice { .. }))
            .unwrap();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::CreateSceneFromChoice {
                scene_id: entry.id.clone(),
                expected_source_revision: entry.source_revision.clone(),
                choice_beat_id: choice.id.clone(),
                option_text: "New road".into(),
                chapter_id: chapter_two,
                display_name: "Created from Choice".into(),
            },
        );
        scene_workspace =
            apply_scene_target(&service, &scene_workspace, crate::scene::SceneCommand::Undo);
        scene_workspace =
            apply_scene_target(&service, &scene_workspace, crate::scene::SceneCommand::Redo);
        assert_eq!(scene_workspace.scenes.len(), 4);
        let garden = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.id == garden_id)
            .unwrap();
        scene_workspace = apply_scene_target(
            &service,
            &scene_workspace,
            crate::scene::SceneCommand::InsertBeat {
                scene_id: garden.id.clone(),
                expected_source_revision: garden.source_revision.clone(),
                before_beat_id: None,
                beat: crate::scene::BeatPayload::Jump {
                    scene_id: library_id,
                },
            },
        );
        let phase_1e_selection = scene_workspace.last_open.clone();
        let image_presentation = service
            .media_present(crate::media::MediaRequest {
                asset_id: background_id,
                purpose: crate::media::MediaPurpose::ImagePreview,
            })
            .unwrap();
        assert_eq!(image_presentation.mime_type, "image/png");
        let audio = service
            .media_present(crate::media::MediaRequest {
                asset_id: music_id,
                purpose: crate::media::MediaPurpose::AudioAudition,
            })
            .unwrap();
        assert_eq!(audio.mime_type, "audio/wav");

        // Phase 1F real-service acceptance: the target gate crosses the same Source,
        // transaction, history, disk, projection, close, and reopen boundaries as the UI.
        let source_path = scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.id == entry_scene_id)
            .unwrap()
            .source_path
            .clone();
        let source_file = final_root.join(&source_path);
        let accepted_before_source = fs::read_to_string(&source_file).unwrap();
        let opened_source = service
            .source_open(SourceOpenRequest {
                expected_revision: None,
                path: source_path.clone(),
                selection_start: Some(0),
                selection_end: Some(0),
                byte_start: None,
                byte_end: None,
            })
            .unwrap();
        let invalid_source = service
            .source_update_draft(SourceDraftRequest {
                path: source_path.clone(),
                expected_base_revision: opened_source.base_revision.clone(),
                text: "label incomplete:\n    menu:\n".into(),
                selection_start: 0,
                selection_end: 0,
            })
            .unwrap();
        assert!(!invalid_source.diagnostics.is_empty());
        assert!(matches!(
            service.source_save(SourceSaveRequest {
                path: source_path.clone(),
                expected_base_revision: invalid_source.base_revision.clone(),
                expected_draft_version: invalid_source.draft_version,
            }),
            Err(LifecycleError::Source(SourceError::InvalidSource))
        ));
        assert_eq!(
            fs::read_to_string(&source_file).unwrap(),
            accepted_before_source
        );

        let accepted_source_text = accepted_before_source.replace(
            "A production-authored Scene.",
            "A durable Source-authored Scene.",
        );
        assert_ne!(accepted_source_text, accepted_before_source);
        let retained_source = service
            .source_update_draft(SourceDraftRequest {
                path: source_path.clone(),
                expected_base_revision: invalid_source.base_revision.clone(),
                text: accepted_source_text.clone(),
                selection_start: 3,
                selection_end: 3,
            })
            .unwrap();
        let retained_version = retained_source.draft_version;
        let selection_only = service
            .source_update_draft(SourceDraftRequest {
                path: source_path.clone(),
                expected_base_revision: retained_source.base_revision.clone(),
                text: accepted_source_text.clone(),
                selection_start: 5,
                selection_end: 5,
            })
            .unwrap();
        assert_eq!(selection_only.draft_version, retained_version);
        let saved_source = service
            .source_save(SourceSaveRequest {
                path: source_path.clone(),
                expected_base_revision: selection_only.base_revision.clone(),
                expected_draft_version: selection_only.draft_version,
            })
            .unwrap();
        assert!(!saved_source.dirty);
        assert_eq!(
            fs::read_to_string(&source_file).unwrap(),
            accepted_source_text
        );
        let clean_selection_only = service
            .source_update_draft(SourceDraftRequest {
                path: source_path.clone(),
                expected_base_revision: saved_source.base_revision.clone(),
                text: accepted_source_text.clone(),
                selection_start: 7,
                selection_end: 7,
            })
            .unwrap();
        assert!(!clean_selection_only.dirty);
        assert_eq!(
            clean_selection_only.draft_version,
            saved_source.draft_version
        );
        scene_workspace = apply_scene_target(
            &service,
            &service.scene_workspace().unwrap(),
            crate::scene::SceneCommand::Undo,
        );
        assert_eq!(
            fs::read_to_string(&source_file).unwrap(),
            accepted_before_source
        );
        scene_workspace =
            apply_scene_target(&service, &scene_workspace, crate::scene::SceneCommand::Redo);
        assert_eq!(
            fs::read_to_string(&source_file).unwrap(),
            accepted_source_text
        );
        assert!(scene_workspace
            .scenes
            .iter()
            .find(|scene| scene.id == entry_scene_id)
            .unwrap()
            .beats
            .iter()
            .any(|beat| matches!(&beat.payload, crate::scene::BeatPayload::Narration { text } if text == "A durable Source-authored Scene.")));
        println!("phase-1f-source-save-target-gate: passed");
        RenpyAdapter::validate_generated(&sdk, &final_root).unwrap();
        RenpyAdapter::smoke_run(&sdk, &final_root).unwrap();
        println!("phase-1e-scene-authoring-target-gate: passed");
        println!("phase-1e-media-target-gate: passed");

        service.close().unwrap();
        assert!(service.current().is_none());
        let recent = service.list_recent();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].status, "available");
        let reopened = service.open_recent(&recent[0].id).unwrap();
        assert_eq!(reopened.chapter_id, phase_1e_selection.chapter_id);
        assert_eq!(reopened.scene_id, phase_1e_selection.scene_id);
        let reopened_source = service
            .source_open(SourceOpenRequest {
                expected_revision: None,
                path: source_path.clone(),
                selection_start: None,
                selection_end: None,
                byte_start: None,
                byte_end: None,
            })
            .unwrap();
        assert_eq!(
            reopened_source.text.as_deref(),
            Some(accepted_source_text.as_str())
        );
        assert!(!reopened_source.dirty);
        let reopened_authored = service.authoring_list().unwrap();
        let reopened_ids = reopened_authored
            .characters
            .iter()
            .map(|item| item.id.clone())
            .chain(
                reopened_authored
                    .appearances
                    .iter()
                    .map(|item| item.id.clone()),
            )
            .chain(reopened_authored.assets.iter().map(|item| item.id.clone()))
            .chain(
                reopened_authored
                    .variables
                    .iter()
                    .map(|item| item.id.clone()),
            )
            .collect::<Vec<_>>();
        assert_eq!(reopened_ids, stable_ids);
        let score = reopened_authored
            .variables
            .iter()
            .find(|item| item.technical_name == "score")
            .unwrap();
        service
            .authoring_update_variable(UpdateVariableRequest {
                id: score.id.clone(),
                expected_source_revision: score.source.source_revision.clone(),
                default_value: serde_json::Value::from(3),
            })
            .unwrap();
        service.close().unwrap();
        assert_eq!(
            service.open_path(&final_root).unwrap().scene_id,
            phase_1e_selection.scene_id
        );

        let portable = projects.join("portable-copy");
        copy_tree(&final_root, &portable);
        fs::remove_dir_all(portable.join(".renpy-editor")).unwrap();
        RenpyAdapter::validate_generated(&sdk, &portable).unwrap();
        RenpyAdapter::smoke_run(&sdk, &portable).unwrap();

        let arbitrary = projects.join("arbitrary-renpy");
        fs::create_dir_all(arbitrary.join("game")).unwrap();
        fs::write(
            arbitrary.join("game/script.rpy"),
            b"label start:\n    return\n",
        )
        .unwrap();
        assert!(matches!(
            service.open_path(&arbitrary),
            Err(LifecycleError::InvalidMetadata)
        ));

        // Run the deliberately interrupted streaming-import probe only after every
        // normal lifecycle assertion. A persisted partial is expected to require
        // recovery and must not poison the successful authoring fixture prematurely.
        let changed_selection = media.join("changed-after-selection.png");
        let mut race_bytes = png.to_vec();
        race_bytes.extend_from_slice(b"unique-race-probe");
        fs::write(&changed_selection, &race_bytes).unwrap();
        let selected = service.authoring_select_import(&changed_selection).unwrap();
        let mut changed = race_bytes;
        let changed_last = changed.len() - 1;
        changed[changed_last] ^= 1;
        fs::write(&changed_selection, changed).unwrap();
        assert!(matches!(
            service.authoring_import_asset(ImportAssetRequest {
                authority_id: selected.authority_id,
                kind: crate::authoring::AssetKind::Background,
                technical_name: "race_probe".into(),
                display_name: "Race probe".into(),
                character_id: None,
                expression: None,
            }),
            Err(LifecycleError::Authoring(
                crate::authoring::AuthoringError::RecoveryRequired
            ))
        ));
        assert!(!final_root.join("game/images/bg race_probe.png").exists());
        println!("phase-1d-import-authority-gate: passed");
        println!("phase-1c-target-gate: passed");
        println!("phase-1d-target-gate: passed");
        println!("phase-1d-corrective-target-gate: passed");
    }
    #[test]
    fn flow_literal_ipc_edits_destination_creates_scene_and_reopens_without_new_write_authority() {
        use serde_json::json;
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("flow-project");
        make_openable_project(&root, "Flow fixture");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let opened = service.open_path(&root).unwrap();
        let session = opened.session_id;
        let graph = closeout_ipc(&mut service, "flow.list", json!({"sessionId": session}));
        assert_eq!(graph["ok"], true, "{graph}");
        for payload in [
            json!({"sessionId":"stale"}),
            json!({"sessionId":session,"unexpected":true}),
            json!({}),
        ] {
            assert_eq!(
                closeout_ipc(&mut service, "flow.list", payload)["ok"],
                false
            );
        }
        let model =
            closeout_ipc(&mut service, "scene.list", json!({"sessionId":session}))["value"].clone();
        let entry = &model["scenes"][0];
        let source_path = entry["sourcePath"].as_str().unwrap().to_owned();
        let before = fs::read_to_string(root.join(&source_path)).unwrap();
        let updated = closeout_ipc(
            &mut service,
            "scene.apply",
            json!({"sessionId":session,
            "expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],
            "command":{"type":"insertBeat","sceneId":entry["id"],"expectedSourceRevision":entry["sourceRevision"],"beforeBeatId":null,
                "beat":{"type":"choice","options":[{"text":"Again","destinationSceneId":entry["id"]}]}}}),
        );
        assert_eq!(updated["ok"], true, "{updated}");
        let model = &updated["value"];
        let entry = &model["scenes"][0];
        let graph = closeout_ipc(&mut service, "flow.list", json!({"sessionId":session}));
        let edge = &graph["value"]["edges"][0];
        assert_eq!(edge["destination"]["sceneId"], entry["id"]);
        assert_eq!(edge["editable"], true);
        let created = closeout_ipc(
            &mut service,
            "scene.apply",
            json!({"sessionId":session,
            "expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],
            "command":{"type":"createSceneFromChoice","sceneId":entry["id"],"expectedSourceRevision":entry["sourceRevision"],"choiceBeatId":edge["beatId"],"optionText":"New destination","chapterId":entry["chapterId"],"displayName":"Destination"}}),
        );
        assert_eq!(created["ok"], true, "{created}");
        let accepted = fs::read_to_string(root.join(&source_path)).unwrap();
        assert!(accepted.contains("New destination"));
        assert!(accepted.starts_with(before.split("    return").next().unwrap()));
        let graph = closeout_ipc(&mut service, "flow.list", json!({"sessionId":session}));
        assert_eq!(graph["value"]["edges"].as_array().unwrap().len(), 3);
        service.close().unwrap();
        drop(service);
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let opened = service.open_path(&root).unwrap();
        let graph = closeout_ipc(
            &mut service,
            "flow.list",
            json!({"sessionId":opened.session_id}),
        );
        assert_eq!(graph["value"]["nodes"].as_array().unwrap().len(), 2);
        assert_eq!(
            fs::read_to_string(root.join(&source_path)).unwrap(),
            accepted
        );
    }
}
