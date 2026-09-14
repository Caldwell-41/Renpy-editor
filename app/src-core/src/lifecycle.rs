use crate::{
    metadata::{
        ChapterMetadata, ProjectMetadata, Resolution, SceneMetadata, SdkIdentity, Selection,
        SourceMapMetadata, PROJECT_SCHEMA_VERSION, SOURCE_MAP_SCHEMA_VERSION,
    },
    renpy::{
        discover_managed_sdk, install_supported_sdk, RenpyAdapter, RenpyError, SdkInfo,
        ValidatedSdk, SUPPORTED_VERSION,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::Map;
use std::{
    collections::HashMap,
    fs::{self, File, OpenOptions},
    io::{self, Write},
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
    parents: HashMap<String, ParentAnchor>,
    sdks: HashMap<String, ValidatedSdk>,
    current: Option<(PathBuf, OpenProject)>,
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
        Ok(Self {
            data_root,
            parents: HashMap::new(),
            sdks: HashMap::new(),
            current: None,
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
        let mut stage = create_private_stage(parent, stage_name, token)?;
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
            let opened = open_valid_project(&final_path)?;
            if opened.project_id != metadata.project_id {
                return Err(LifecycleError::CreatedNotOpened);
            }
            Ok(opened)
        })();
        if prepared.is_err() && stage.path.exists() {
            let _ = cleanup_stage(parent, &mut stage);
        }
        let opened = prepared?;
        if self.update_recent(&final_path, &opened).is_err() {
            return Err(LifecycleError::CreatedNotOpened);
        }
        self.current = Some((final_path, opened.clone()));
        Ok(CreationResult {
            status: "complete".into(),
            project: Some(opened),
        })
    }

    pub fn open_path(&mut self, selected: &Path) -> Result<OpenProject, LifecycleError> {
        let root = canonical_safe_directory(selected)?;
        let project = open_valid_project(&root)?;
        self.update_recent(&root, &project)?;
        self.current = Some((root, project.clone()));
        Ok(project)
    }

    pub fn open_recent(&mut self, recent_id: &str) -> Result<OpenProject, LifecycleError> {
        let store = self.read_recent();
        let record = store
            .entries
            .iter()
            .find(|entry| entry.id == recent_id)
            .ok_or(LifecycleError::InvalidMetadata)?;
        let root = record.path.clone();
        let project = open_valid_project(&canonical_safe_directory(&root)?)?;
        self.update_recent(&root, &project)?;
        self.current = Some((root, project.clone()));
        Ok(project)
    }

    pub fn close(&mut self) {
        self.current = None;
    }
    pub fn current(&self) -> Option<OpenProject> {
        self.current.as_ref().map(|(_, project)| project.clone())
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
        let path = self.data_root.join("recent-projects.json");
        fs::read(&path)
            .ok()
            .filter(|bytes| bytes.len() <= 1_000_000)
            .and_then(|bytes| serde_json::from_slice::<RecentStore>(&bytes).ok())
            .filter(|store| store.schema_version == RECENT_SCHEMA_VERSION)
            .unwrap_or(RecentStore {
                schema_version: RECENT_SCHEMA_VERSION,
                entries: Vec::new(),
            })
    }

    fn write_recent(&self, store: &RecentStore) -> Result<(), LifecycleError> {
        let bytes = serde_json::to_vec_pretty(store).map_err(|_| LifecycleError::Io)?;
        let path = self.data_root.join("recent-projects.json");
        let temporary = self
            .data_root
            .join(format!(".recent-projects-{}.tmp", uuid::Uuid::new_v4()));
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|_| LifecycleError::Io)?;
        let result = file
            .write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| LifecycleError::Io)
            .and_then(|_| replace_file_atomically(&temporary, &path));
        if result.is_err() {
            let _ = fs::remove_file(&temporary);
        }
        result
    }
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
        capabilities: vec!["project-lifecycle".into()],
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
            "game/chapters/chapter_01/scene_001.rpy".into(),
        ],
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
    let metadata_path = root.join(".renpy-editor/project.json");
    if has_symlink_component(&metadata_path) {
        return Err(LifecycleError::UnsafePath);
    }
    let metadata = ProjectMetadata::read(root).map_err(|_| LifecycleError::InvalidMetadata)?;
    let chapter = &metadata.chapters[0];
    let scene = &metadata.scenes[0];
    for required in [
        "game/script.rpy",
        "game/options.rpy",
        "game/gui.rpy",
        "game/screens.rpy",
        scene.source_path.as_str(),
    ] {
        let path = root.join(required);
        if has_symlink_component(&path) {
            return Err(LifecycleError::UnsafePath);
        }
        let canonical = path
            .canonicalize()
            .map_err(|_| LifecycleError::InvalidMetadata)?;
        if !canonical.starts_with(root) || !canonical.is_file() {
            return Err(LifecycleError::UnsafePath);
        }
    }
    Ok(OpenProject {
        project_id: metadata.project_id,
        title: metadata.title,
        folder_name: metadata.folder_name,
        chapter_id: chapter.id.clone(),
        chapter_name: chapter.display_name.clone(),
        scene_id: scene.id.clone(),
        scene_name: scene.display_name.clone(),
        sdk_version: metadata.sdk.version,
        resolution: metadata.resolution,
    })
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

fn create_private_stage(
    parent: &ParentAnchor,
    name: String,
    token: String,
) -> Result<StageAnchor, LifecycleError> {
    use std::ffi::OsStr;

    validate_parent(parent)?;
    if name != format!(".loomlight-stage-{token}") {
        return Err(LifecycleError::UnsafePath);
    }
    let parent_anchor = crate::transaction::DirectoryAnchor::open_root(&parent.path)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if parent_anchor.identity().volume != parent.identity.a
        || parent_anchor.identity().file != parent.identity.b
    {
        return Err(LifecycleError::UnsafePath);
    }
    let directory = parent_anchor
        .create_new_child(OsStr::new(&name))
        .map_err(|_| LifecycleError::UnsafePath)?;
    let path = directory.path().to_path_buf();
    let file = open_stage_directory(&path).map_err(|_| LifecycleError::UnsafePath)?;
    let identity = identity(&file).map_err(|_| LifecycleError::UnsafePath)?;
    if directory.identity().volume != identity.a || directory.identity().file != identity.b {
        return Err(LifecycleError::UnsafePath);
    }
    restrict_directory_handle(&file)?;
    let stage = StageAnchor {
        path,
        name,
        token,
        file: Some(file),
        identity,
    };

    let marker = format!("loomlight-project-stage-v1\n{}\n", stage.token);
    let mut marker_file = directory
        .create_new_file(OsStr::new(STAGE_MARKER))
        .map_err(|_| LifecycleError::UnsafePath)?;
    marker_file
        .write_all(marker.as_bytes())
        .and_then(|_| marker_file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    // Ren'Py generate_gui accepts an existing target when its game directory exists.
    directory
        .create_new_child(OsStr::new("game"))
        .map_err(|_| LifecycleError::UnsafePath)?;
    directory.flush().map_err(|_| LifecycleError::Io)?;
    validate_stage_identity(&stage)?;
    Ok(stage)
}

#[cfg(unix)]
fn restrict_directory_handle(file: &File) -> Result<(), LifecycleError> {
    use std::os::fd::AsRawFd;
    if unsafe { libc::fchmod(file.as_raw_fd(), 0o700) } == 0 {
        Ok(())
    } else {
        Err(LifecycleError::Io)
    }
}

#[cfg(windows)]
fn restrict_directory_handle(_file: &File) -> Result<(), LifecycleError> {
    Ok(())
}

#[cfg(test)]
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
    fs::remove_dir_all(quarantine_path).map_err(|_| LifecycleError::Io)
}

fn replace_file_atomically(temporary: &Path, destination: &Path) -> Result<(), LifecycleError> {
    replace_file_platform(temporary, destination).map_err(|_| LifecycleError::Io)?;
    let parent = destination.parent().ok_or(LifecycleError::Io)?;
    sync_parent_directory(parent).map_err(|_| LifecycleError::Io)
}

#[cfg(unix)]
fn replace_file_platform(temporary: &Path, destination: &Path) -> io::Result<()> {
    fs::rename(temporary, destination)
}

#[cfg(windows)]
fn replace_file_platform(temporary: &Path, destination: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(temporary);
    let to = wide(destination);
    let result = unsafe {
        MoveFileExW(
            from.as_ptr(),
            to.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    };
    if result != 0 {
        Ok(())
    } else {
        Err(io::Error::last_os_error())
    }
}

#[cfg(unix)]
fn sync_parent_directory(path: &Path) -> io::Result<()> {
    open_directory(path)?.sync_all()
}

#[cfg(windows)]
fn sync_parent_directory(_path: &Path) -> io::Result<()> {
    Ok(())
}

#[cfg(all(test, unix))]
fn restrict_directory(path: &Path) -> Result<(), LifecycleError> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| LifecycleError::Io)
}
#[cfg(all(test, windows))]
fn restrict_directory(_path: &Path) -> Result<(), LifecycleError> {
    Ok(())
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
    use windows_sys::Win32::Storage::FileSystem::MoveFileExW;
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(&parent.path.join(stage));
    let to = wide(&parent.path.join(final_name));
    let result = unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), 0) };
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

    #[cfg(unix)]
    #[test]
    fn private_stage_creation_cannot_follow_parent_path_substitution() {
        let temp = tempfile::tempdir().unwrap();
        let requested = temp.path().join("projects");
        fs::create_dir(&requested).unwrap();
        let parent = open_parent(&requested).unwrap();
        let approved = parent.path.clone();
        let moved = temp.path().join("moved-approved-parent");
        fs::rename(&approved, &moved).unwrap();
        fs::create_dir(&approved).unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        assert!(matches!(
            create_private_stage(&parent, name, token),
            Err(LifecycleError::UnsafePath)
        ));
        assert!(fs::read_dir(&approved).unwrap().next().is_none());
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
    fn official_sdk_phase_1c_target_gate() {
        let Some(archive) = std::env::var_os("LOOMLIGHT_PHASE1C_SDK_ARCHIVE") else {
            eprintln!("phase-1c-target-gate: skipped (no official SDK archive)");
            return;
        };
        let temp = tempfile::tempdir().unwrap();
        let managed_state = temp.path().join("managed-state");
        assert!(matches!(
            crate::renpy::install_supported_sdk_from_archive_interrupted_for_test(
                &managed_state,
                Path::new(&archive),
            ),
            Err(RenpyError::Io)
        ));
        let sdk =
            crate::renpy::install_supported_sdk_from_archive(&managed_state, Path::new(&archive))
                .unwrap();
        assert_eq!(sdk.version, SUPPORTED_VERSION);
        let (embedded_provenance, legacy_provenance) =
            crate::renpy::managed_provenance_paths_for_test(&managed_state);
        assert!(embedded_provenance.is_file());
        assert!(!legacy_provenance.exists());
        fs::rename(&embedded_provenance, &legacy_provenance).unwrap();
        // Simulate interruption after an embedded migration file has been created but
        // before it became complete/durable. The still-valid legacy provenance must
        // make the migration safely retryable rather than wedging SDK discovery.
        fs::write(&embedded_provenance, b"truncated-migration").unwrap();
        let migrated = crate::renpy::discover_managed_sdk(&managed_state)
            .unwrap()
            .expect("legacy provenance should repair an interrupted embedded migration");
        assert!(sdk.same_identity(&migrated));
        assert!(embedded_provenance.is_file());
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

        #[cfg(unix)]
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
            fs::rename(&stage_path, &moved).unwrap();
            fs::create_dir(&stage_path).unwrap();
            fs::create_dir(stage_path.join("game")).unwrap();
            RenpyAdapter::generate_starter_anchored(
                &sdk,
                &stage_path,
                stage_file(&stage).unwrap(),
                1280,
                720,
            )
            .unwrap();
            assert!(moved.join("game/screens.rpy").is_file());
            assert!(!stage_path.join("game/screens.rpy").exists());
        }

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
        ] {
            assert!(final_root.join(path).exists(), "missing {path}");
        }
        let screens = fs::read_to_string(final_root.join("game/screens.rpy")).unwrap();
        for expected in ["main_menu", "save", "load", "preferences", "history"] {
            assert!(
                screens.contains(expected),
                "standard screens missing {expected}"
            );
        }
        RenpyAdapter::smoke_run(&sdk, &final_root).unwrap();

        service.close();
        assert!(service.current().is_none());
        let recent = service.list_recent();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].status, "available");
        let reopened = service.open_recent(&recent[0].id).unwrap();
        assert_eq!(reopened.chapter_id, project.chapter_id);
        assert_eq!(reopened.scene_id, project.scene_id);
        service.close();
        assert_eq!(
            service.open_path(&final_root).unwrap().scene_id,
            project.scene_id
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
        println!("phase-1c-target-gate: passed");
    }
}
