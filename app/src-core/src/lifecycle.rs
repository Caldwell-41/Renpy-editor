use crate::{
    metadata::{
        ChapterMetadata, ProjectMetadata, Resolution, SceneMetadata, SdkIdentity, Selection,
        SourceMapMetadata, PROJECT_SCHEMA_VERSION, SOURCE_MAP_SCHEMA_VERSION,
    },
    renpy::{
        install_supported_sdk, RenpyAdapter, RenpyError, SdkInfo, ValidatedSdk, SUPPORTED_VERSION,
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
    CreatedNotOpened,
    Io,
}

struct ParentAnchor {
    path: PathBuf,
    file: File,
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

struct LocalGit;

impl crate::ports::GitPort for LocalGit {
    fn initialise_new_repository(&self, stage: &Path) -> Result<(), LifecycleError> {
        initialise_git(stage)
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
            Ok(sdk) => {
                let id = uuid::Uuid::new_v4().to_string();
                let info = sdk_info(&id, &sdk, source);
                self.sdks.insert(id, sdk);
                Ok(info)
            }
            Err(RenpyError::UnsupportedVersion(version)) => Ok(SdkInfo { id: String::new(), version: version.clone(), display_name: format!("Ren'Py {version}"), source: source.into(), compatible: false, explanation: format!("Ren'Py {version} is not supported. Loomlight currently requires {SUPPORTED_VERSION}.") }),
            Err(_) => Err(LifecycleError::UnsupportedSdk),
        }
    }

    pub fn discover_sdks(&mut self) -> Vec<SdkInfo> {
        let mut results = Vec::new();
        let managed = self.data_root.join("sdks/renpy-8.5.3-sdk");
        if managed.is_dir() {
            if let Ok(info) = self.register_sdk(&managed, "managed") {
                results.push(info);
            }
        }
        results
    }

    pub fn install_sdk(&mut self) -> Result<SdkInfo, LifecycleError> {
        let sdk =
            install_supported_sdk(&self.data_root).map_err(|_| LifecycleError::UnsupportedSdk)?;
        let id = uuid::Uuid::new_v4().to_string();
        let info = sdk_info(&id, &sdk, "managed");
        self.sdks.insert(id, sdk);
        Ok(info)
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
        let stage = parent.path.join(&stage_name);
        fs::create_dir(&stage).map_err(|_| LifecycleError::Io)?;
        restrict_directory(&stage)?;
        let marker = format!("loomlight-project-stage-v1\n{token}\n");
        write_new(&stage.join(STAGE_MARKER), marker.as_bytes())?;
        // Ren'Py's documented generate_gui command accepts a new project when the
        // target is absent, or an existing target whose game directory is present.
        // The private ownership marker makes our target intentionally existing.
        fs::create_dir(stage.join("game")).map_err(|_| LifecycleError::Io)?;
        let prepared = (|| {
            RenpyAdapter::generate_starter(&sdk, &stage, resolution.width, resolution.height)
                .map_err(|_| LifecycleError::GenerationFailed)?;
            validate_stage_identity(&stage, &token)?;
            let metadata = apply_overlay(
                &stage,
                &request.title,
                &request.folder_name,
                resolution.clone(),
            )?;
            if request.initialize_git {
                crate::ports::GitPort::initialise_new_repository(&LocalGit, &stage)?;
            }
            RenpyAdapter::validate_generated(&sdk, &stage)
                .map_err(|_| LifecycleError::GenerationFailed)?;
            validate_stage_identity(&stage, &token)?;
            validate_parent(parent)?;
            ensure_absent(&final_path)?;
            promote_no_replace(parent, &stage_name, &request.folder_name)?;
            fs::remove_file(final_path.join(STAGE_MARKER))
                .map_err(|_| LifecycleError::CreatedNotOpened)?;
            let opened = open_valid_project(&final_path)?;
            if opened.project_id != metadata.project_id {
                return Err(LifecycleError::CreatedNotOpened);
            }
            Ok(opened)
        })();
        if prepared.is_err() && stage.exists() {
            let _ = cleanup_stage(&stage, &token);
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
        let mut file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(path)
            .map_err(|_| LifecycleError::Io)?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| LifecycleError::Io)
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

fn apply_overlay(
    stage: &Path,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> Result<ProjectMetadata, LifecycleError> {
    let game = stage.join("game");
    for directory in ["definitions", "chapters/chapter_01", "images", "audio"] {
        fs::create_dir_all(game.join(directory)).map_err(|_| LifecycleError::Io)?;
    }
    fs::create_dir_all(stage.join(".renpy-editor/recovery")).map_err(|_| LifecycleError::Io)?;
    let project_id = uuid::Uuid::new_v4().to_string();
    let chapter_id = uuid::Uuid::new_v4().to_string();
    let scene_id = uuid::Uuid::new_v4().to_string();
    let technical_label = format!("loomlight_scene_{}", scene_id.replace('-', ""));
    let script = format!("# Loomlight entry point. Runnable source remains authoritative.\n\nlabel start:\n    jump {technical_label}\n");
    write_replace(&game.join("script.rpy"), script.as_bytes())?;
    let options = game.join("options.rpy");
    let mut options_bytes = fs::read(&options).map_err(|_| LifecycleError::Io)?;
    let safe_title = title
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('[', "[[");
    options_bytes.extend_from_slice(
        format!(
            "\n# Loomlight project identity.\ndefine config.name = _(\"{safe_title}\")\ndefine build.name = \"{folder_name}\"\n"
        )
        .as_bytes(),
    );
    write_replace(&options, &options_bytes)?;
    write_new(
        &game.join("definitions/characters.rpy"),
        b"# Character definitions are added by Loomlight.\n",
    )?;
    write_new(
        &game.join("definitions/variables.rpy"),
        b"# Variable definitions are added by Loomlight.\n",
    )?;
    write_new(
        &game.join("definitions/transforms.rpy"),
        b"# Transform definitions are added by Loomlight.\n",
    )?;
    let scene_source =
        format!("label {technical_label}:\n    \"Your story begins here.\"\n    return\n");
    write_new(
        &game.join("chapters/chapter_01/scene_001.rpy"),
        scene_source.as_bytes(),
    )?;
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
    metadata
        .write_for_folder(stage, Some(folder_name))
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    SourceMapMetadata {
        schema_version: SOURCE_MAP_SCHEMA_VERSION,
        project_id,
        sources: vec![
            "game/script.rpy".into(),
            "game/chapters/chapter_01/scene_001.rpy".into(),
        ],
        extra: Map::new(),
    }
    .write(stage)
    .map_err(|_| LifecycleError::InvalidMetadata)?;
    Ok(metadata)
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

fn initialise_git(stage: &Path) -> Result<(), LifecycleError> {
    initialise_git_with("git", stage)
}

fn initialise_git_with(program: &str, stage: &Path) -> Result<(), LifecycleError> {
    let status = Command::new(program)
        .arg("init")
        .arg("--quiet")
        .current_dir(stage)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    if status.success() {
        Ok(())
    } else {
        Err(LifecycleError::GitUnavailable)
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

fn write_new(path: &Path, bytes: &[u8]) -> Result<(), LifecycleError> {
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(path)
        .map_err(|_| LifecycleError::Io)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)
}
fn write_replace(path: &Path, bytes: &[u8]) -> Result<(), LifecycleError> {
    let meta = fs::symlink_metadata(path).map_err(|_| LifecycleError::Io)?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(LifecycleError::UnsafePath);
    }
    let mut file = OpenOptions::new()
        .truncate(true)
        .write(true)
        .open(path)
        .map_err(|_| LifecycleError::Io)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)
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

fn validate_stage_identity(stage: &Path, token: &str) -> Result<(), LifecycleError> {
    if has_symlink_component(stage)
        || fs::read_to_string(stage.join(STAGE_MARKER)).ok().as_deref()
            != Some(&format!("loomlight-project-stage-v1\n{token}\n"))
    {
        Err(LifecycleError::UnsafePath)
    } else {
        Ok(())
    }
}
fn cleanup_stage(stage: &Path, token: &str) -> Result<(), LifecycleError> {
    validate_stage_identity(stage, token)?;
    if !stage
        .file_name()
        .is_some_and(|name| name.to_string_lossy() == format!(".loomlight-stage-{token}"))
    {
        return Err(LifecycleError::UnsafePath);
    }
    fs::remove_dir_all(stage).map_err(|_| LifecycleError::Io)
}

#[cfg(unix)]
fn restrict_directory(path: &Path) -> Result<(), LifecycleError> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| LifecycleError::Io)
}
#[cfg(windows)]
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
    fn cleanup_and_git_failure_are_bounded() {
        let temp = tempfile::tempdir().unwrap();
        let unrelated = temp.path().join("unrelated");
        fs::create_dir(&unrelated).unwrap();
        fs::write(unrelated.join(STAGE_MARKER), b"not a valid marker").unwrap();
        assert!(cleanup_stage(&unrelated, "token").is_err());
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
            ValidatedSdk {
                root: temp.path().join("invalid-sdk"),
                version: SUPPORTED_VERSION.into(),
            },
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
            Err(LifecycleError::GenerationFailed)
        ));
        assert!(!projects.join("failure-evidence").exists());
        assert_eq!(fs::read(unrelated.join("keep")).unwrap(), b"keep");
        assert!(fs::read_dir(&projects)
            .unwrap()
            .all(|entry| {
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
        let sdk_root = temp.path().join("sdk");
        crate::renpy::install_verified_archive(
            Path::new(&archive),
            crate::renpy::SDK_SHA256,
            &sdk_root,
            crate::renpy::ArchiveLimits::default(),
        )
        .unwrap();
        let sdk = RenpyAdapter::validate_sdk(&sdk_root).unwrap();
        assert_eq!(sdk.version, SUPPORTED_VERSION);

        let projects = temp.path().join("projects");
        fs::create_dir(&projects).unwrap();
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let parent = service.register_parent(&projects).unwrap();
        let selected = service.register_sdk(&sdk_root, "target-test").unwrap();
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
        let project = created.project.unwrap();
        let final_root = projects.join("target-gate-story");
        assert!(final_root.join(".git").is_dir());
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
