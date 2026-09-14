use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{fs, io, path::Path};

pub const PROJECT_SCHEMA_VERSION: u32 = 1;
pub const SOURCE_MAP_SCHEMA_VERSION: u32 = 1;

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
        if self.schema_version != PROJECT_SCHEMA_VERSION {
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
        if self.chapters.len() != 1 || self.scenes.len() != 1 {
            return Err(MetadataError::InvalidStructure);
        }
        let chapter = &self.chapters[0];
        let scene = &self.scenes[0];
        if !valid_id(&chapter.id)
            || !valid_id(&scene.id)
            || scene.chapter_id != chapter.id
            || self.last_open.chapter_id != chapter.id
            || self.last_open.scene_id != scene.id
            || scene.technical_label.is_empty()
            || !scene
                .technical_label
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_')
        {
            return Err(MetadataError::InvalidStructure);
        }
        validate_relative_path(&chapter.directory)?;
        validate_relative_path(&scene.source_path)?;
        Ok(())
    }

    pub fn read(project_root: &Path) -> Result<Self, MetadataError> {
        let path = project_root.join(".renpy-editor/project.json");
        let bytes = fs::read(path).map_err(|_| MetadataError::Io)?;
        if bytes.len() > 1_000_000 {
            return Err(MetadataError::Corrupt);
        }
        let value: Self = serde_json::from_slice(&bytes).map_err(|_| MetadataError::Corrupt)?;
        let folder = project_root.file_name().and_then(|name| name.to_str());
        value.validate(folder)?;
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
    pub fn write(&self, project_root: &Path) -> Result<(), MetadataError> {
        if self.schema_version != SOURCE_MAP_SCHEMA_VERSION || !valid_id(&self.project_id) {
            return Err(MetadataError::InvalidIdentity);
        }
        for source in &self.sources {
            validate_relative_path(source)?;
        }
        let bytes = serde_json::to_vec_pretty(self).map_err(|_| MetadataError::Corrupt)?;
        write_new(&project_root.join(".renpy-editor/source-map.json"), &bytes)
            .map_err(|_| MetadataError::Io)
    }
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
