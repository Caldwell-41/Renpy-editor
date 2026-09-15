use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{collections::HashSet, fs, io, path::Path};

pub const PROJECT_SCHEMA_VERSION: u32 = 2;
pub const SOURCE_MAP_SCHEMA_VERSION: u32 = 2;
pub const LEGACY_PROJECT_SCHEMA_VERSION: u32 = 1;
pub const LEGACY_SOURCE_MAP_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

impl Resolution {
    pub fn validate(&self) -> Result<(), MetadataError> {
        if !(640..=7680).contains(&self.width)
            || !(360..=4320).contains(&self.height)
            || !self.width.is_multiple_of(2)
            || !self.height.is_multiple_of(2)
        {
            return Err(MetadataError::InvalidResolution);
        }
        Ok(())
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkIdentity {
    pub adapter: String,
    pub version: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterMetadata {
    pub id: String,
    pub display_name: String,
    pub directory: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneMetadata {
    pub id: String,
    pub chapter_id: String,
    pub display_name: String,
    pub technical_label: String,
    pub source_path: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Selection {
    pub chapter_id: String,
    pub scene_id: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetadata {
    pub schema_version: u32,
    pub project_id: String,
    pub title: String,
    pub folder_name: String,
    pub sdk: SdkIdentity,
    pub resolution: Resolution,
    pub capabilities: Vec<String>,
    pub chapters: Vec<ChapterMetadata>,
    pub scenes: Vec<SceneMetadata>,
    #[serde(default)]
    pub entry_scene_id: Option<String>,
    pub last_open: Selection,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceMapMetadata {
    pub schema_version: u32,
    pub project_id: String,
    pub sources: Vec<String>,
    #[serde(default)]
    pub scene_mappings: Vec<SceneSourceMapping>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneSourceMapping {
    pub scene_id: String,
    pub path: String,
    pub source_revision: String,
    pub label_start: u64,
    pub label_end: u64,
    pub beats: Vec<BeatSourceMapping>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BeatSourceMapping {
    pub id: String,
    pub kind: String,
    pub byte_start: u64,
    pub byte_end: u64,
    pub source_sha256: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, PartialEq)]
pub enum MetadataError {
    Io,
    Corrupt,
    UnsupportedSchema,
    InvalidIdentity,
    InvalidResolution,
    InvalidRelativePath,
    InvalidStructure,
}

fn valid_id(value: &str) -> bool {
    uuid::Uuid::parse_str(value).is_ok()
}

pub fn validate_relative_path(value: &str) -> Result<(), MetadataError> {
    if value.is_empty()
        || value.starts_with('/')
        || value.starts_with('\\')
        || value.contains('\\')
        || value.contains(':')
        || value
            .split('/')
            .any(|part| part.is_empty() || part == "." || part == "..")
    {
        return Err(MetadataError::InvalidRelativePath);
    }
    Ok(())
}

impl ProjectMetadata {
    pub fn validate(&self, expected_folder: Option<&str>) -> Result<(), MetadataError> {
        if !matches!(
            self.schema_version,
            LEGACY_PROJECT_SCHEMA_VERSION | PROJECT_SCHEMA_VERSION
        ) {
            return Err(MetadataError::UnsupportedSchema);
        }
        if !valid_id(&self.project_id)
            || self.title.trim().is_empty()
            || self.title.len() > 160
            || self.folder_name.is_empty()
            || expected_folder.is_some_and(|folder| folder != self.folder_name)
            || self.sdk.adapter != "renpy-8.5.3"
            || self.sdk.version != "8.5.3"
        {
            return Err(MetadataError::InvalidIdentity);
        }
        self.resolution.validate()?;
        if self.chapters.is_empty()
            || self.scenes.is_empty()
            || self.chapters.len() > 256
            || self.scenes.len() > 4096
        {
            return Err(MetadataError::InvalidStructure);
        }
        let mut all_ids = HashSet::new();
        let mut chapter_ids = HashSet::new();
        let mut directories = HashSet::new();
        for chapter in &self.chapters {
            if !valid_id(&chapter.id)
                || !all_ids.insert(chapter.id.clone())
                || !chapter_ids.insert(chapter.id.clone())
                || chapter.display_name.trim().is_empty()
                || chapter.display_name.len() > 160
            {
                return Err(MetadataError::InvalidStructure);
            }
            validate_relative_path(&chapter.directory)?;
            if !chapter.directory.starts_with("game/chapters/")
                || !directories.insert(chapter.directory.to_ascii_lowercase())
            {
                return Err(MetadataError::InvalidStructure);
            }
        }
        let mut labels = HashSet::new();
        let mut source_paths = HashSet::new();
        for scene in &self.scenes {
            if !valid_id(&scene.id)
                || !all_ids.insert(scene.id.clone())
                || !chapter_ids.contains(&scene.chapter_id)
                || scene.display_name.trim().is_empty()
                || scene.display_name.len() > 160
                || !valid_technical_label(&scene.technical_label)
                || !labels.insert(scene.technical_label.clone())
            {
                return Err(MetadataError::InvalidStructure);
            }
            validate_relative_path(&scene.source_path)?;
            let Some(chapter) = self
                .chapters
                .iter()
                .find(|chapter| chapter.id == scene.chapter_id)
            else {
                return Err(MetadataError::InvalidStructure);
            };
            if !scene
                .source_path
                .starts_with(&format!("{}/", chapter.directory))
                || !scene.source_path.ends_with(".rpy")
                || !source_paths.insert(scene.source_path.to_ascii_lowercase())
            {
                return Err(MetadataError::InvalidStructure);
            }
        }
        let selected = self.scenes.iter().find(|scene| {
            scene.id == self.last_open.scene_id && scene.chapter_id == self.last_open.chapter_id
        });
        let entry_id = self
            .entry_scene_id
            .as_deref()
            .unwrap_or_else(|| self.scenes[0].id.as_str());
        if selected.is_none() || !self.scenes.iter().any(|scene| scene.id == entry_id) {
            return Err(MetadataError::InvalidStructure);
        }
        Ok(())
    }

    pub fn read(project_root: &Path) -> Result<Self, MetadataError> {
        let path = project_root.join(".renpy-editor/project.json");
        let bytes = fs::read(path).map_err(|_| MetadataError::Io)?;
        Self::read_bytes(
            &bytes,
            project_root.file_name().and_then(|name| name.to_str()),
        )
    }

    pub(crate) fn read_bytes(
        bytes: &[u8],
        expected_folder: Option<&str>,
    ) -> Result<Self, MetadataError> {
        if bytes.len() > 1_000_000 {
            return Err(MetadataError::Corrupt);
        }
        let value: Self = serde_json::from_slice(bytes).map_err(|_| MetadataError::Corrupt)?;
        value.validate(expected_folder)?;
        Ok(value)
    }

    pub fn write(&self, project_root: &Path) -> Result<(), MetadataError> {
        self.write_for_folder(
            project_root,
            project_root.file_name().and_then(|name| name.to_str()),
        )
    }

    pub fn write_for_folder(
        &self,
        project_root: &Path,
        expected_folder: Option<&str>,
    ) -> Result<(), MetadataError> {
        self.validate(expected_folder)?;
        let bytes = serde_json::to_vec_pretty(self).map_err(|_| MetadataError::Corrupt)?;
        let path = project_root.join(".renpy-editor/project.json");
        write_new(&path, &bytes).map_err(|_| MetadataError::Io)
    }
}

impl SourceMapMetadata {
    pub(crate) fn read_bytes(bytes: &[u8], project_id: &str) -> Result<Self, MetadataError> {
        if bytes.len() > 1_000_000 {
            return Err(MetadataError::Corrupt);
        }
        let value: Self = serde_json::from_slice(bytes).map_err(|_| MetadataError::Corrupt)?;
        value.validate(project_id)?;
        Ok(value)
    }

    pub fn validate(&self, project_id: &str) -> Result<(), MetadataError> {
        if !matches!(
            self.schema_version,
            LEGACY_SOURCE_MAP_SCHEMA_VERSION | SOURCE_MAP_SCHEMA_VERSION
        ) || !valid_id(&self.project_id)
            || self.project_id != project_id
            || self.sources.len() > 4096
            || self.scene_mappings.len() > 4096
        {
            return Err(MetadataError::InvalidIdentity);
        }
        let mut sources = HashSet::new();
        for source in &self.sources {
            validate_relative_path(source)?;
            if !sources.insert(source.to_ascii_lowercase()) {
                return Err(MetadataError::InvalidStructure);
            }
        }
        let mut scene_ids = HashSet::new();
        for scene in &self.scene_mappings {
            if !valid_id(&scene.scene_id)
                || !scene_ids.insert(scene.scene_id.clone())
                || !sources.contains(&scene.path.to_ascii_lowercase())
                || !valid_hash(&scene.source_revision)
                || scene.label_start >= scene.label_end
            {
                return Err(MetadataError::InvalidStructure);
            }
            validate_relative_path(&scene.path)?;
            let mut beat_ids = HashSet::new();
            let mut last_end = scene.label_start;
            for beat in &scene.beats {
                if !valid_id(&beat.id)
                    || !beat_ids.insert(beat.id.clone())
                    || beat.kind.is_empty()
                    || beat.byte_start < scene.label_start
                    || beat.byte_start >= beat.byte_end
                    || beat.byte_end > scene.label_end
                    || beat.byte_start < last_end
                    || !valid_hash(&beat.source_sha256)
                {
                    return Err(MetadataError::InvalidStructure);
                }
                last_end = beat.byte_end;
            }
        }
        Ok(())
    }

    pub fn write(&self, project_root: &Path) -> Result<(), MetadataError> {
        self.validate(&self.project_id)?;
        let bytes = serde_json::to_vec_pretty(self).map_err(|_| MetadataError::Corrupt)?;
        write_new(&project_root.join(".renpy-editor/source-map.json"), &bytes)
            .map_err(|_| MetadataError::Io)
    }
}

fn valid_hash(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
}

fn valid_technical_label(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 160
        && value
            .bytes()
            .enumerate()
            .all(|(index, byte)| byte.is_ascii_alphanumeric() || byte == b'_' && index > 0)
        && value.as_bytes()[0].is_ascii_alphabetic()
}

fn write_new(path: &Path, bytes: &[u8]) -> io::Result<()> {
    use std::io::Write;
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    file.write_all(bytes)?;
    file.sync_all()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> ProjectMetadata {
        let chapter = uuid::Uuid::new_v4().to_string();
        let scene = uuid::Uuid::new_v4().to_string();
        ProjectMetadata {
            schema_version: 1,
            project_id: uuid::Uuid::new_v4().to_string(),
            title: "A Project".into(),
            folder_name: "a-project".into(),
            sdk: SdkIdentity {
                adapter: "renpy-8.5.3".into(),
                version: "8.5.3".into(),
                extra: Map::new(),
            },
            resolution: Resolution {
                width: 1920,
                height: 1080,
            },
            capabilities: vec!["project-lifecycle".into()],
            chapters: vec![ChapterMetadata {
                id: chapter.clone(),
                display_name: "Chapter 1".into(),
                directory: "game/chapters/chapter_01".into(),
                extra: Map::new(),
            }],
            scenes: vec![SceneMetadata {
                id: scene.clone(),
                chapter_id: chapter.clone(),
                display_name: "Scene 1".into(),
                technical_label: "loomlight_scene_001".into(),
                source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
                extra: Map::new(),
            }],
            entry_scene_id: Some(scene.clone()),
            last_open: Selection {
                chapter_id: chapter,
                scene_id: scene,
            },
            extra: Map::new(),
        }
    }

    #[test]
    fn schema_round_trip_preserves_unknown_fields_and_ids() {
        let mut value = sample();
        value
            .extra
            .insert("futureField".into(), Value::String("kept".into()));
        let encoded = serde_json::to_vec(&value).unwrap();
        let decoded: ProjectMetadata = serde_json::from_slice(&encoded).unwrap();
        assert_eq!(decoded, value);
        assert!(decoded.validate(Some("a-project")).is_ok());
    }

    #[test]
    fn rejects_absolute_traversal_and_backslash_paths() {
        for path in [
            "/game/a.rpy",
            "../game/a.rpy",
            "game/../a.rpy",
            "game\\a.rpy",
            "C:/game/a.rpy",
        ] {
            assert_eq!(
                validate_relative_path(path),
                Err(MetadataError::InvalidRelativePath)
            );
        }
    }

    #[test]
    fn corruption_and_wrong_schema_are_rejected_without_touching_source() {
        let temp = tempfile::tempdir().unwrap();
        fs::create_dir_all(temp.path().join(".renpy-editor")).unwrap();
        fs::create_dir(temp.path().join("game")).unwrap();
        fs::write(
            temp.path().join("game/script.rpy"),
            b"label start:\n    return\n",
        )
        .unwrap();
        fs::write(temp.path().join(".renpy-editor/project.json"), b"{bad").unwrap();
        assert_eq!(
            ProjectMetadata::read(temp.path()),
            Err(MetadataError::Corrupt)
        );
        assert_eq!(
            fs::read(temp.path().join("game/script.rpy")).unwrap(),
            b"label start:\n    return\n"
        );
    }
}
