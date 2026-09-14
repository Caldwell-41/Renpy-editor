use super::{identity::FileIdentity, platform::DirectoryAnchor, ErrorCode};
use serde::{Deserialize, Serialize};
use std::{
    ffi::{OsStr, OsString},
    fs::Metadata,
    path::{Component, Path, PathBuf},
};

#[derive(Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct RelativePath(String);

impl RelativePath {
    pub fn new(value: impl Into<String>) -> Result<Self, ErrorCode> {
        let value = value.into();
        let path = Path::new(&value);
        if value.is_empty()
            || value.contains('\\')
            || path.is_absolute()
            || path
                .components()
                .any(|part| !matches!(part, Component::Normal(_)))
        {
            return Err(ErrorCode::UnsafePath);
        }
        #[cfg(windows)]
        if value.split('/').any(unsafe_windows_component) {
            return Err(ErrorCode::UnsafePath);
        }
        Ok(Self(value))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
    pub fn as_path(&self) -> &Path {
        Path::new(&self.0)
    }
}

impl TryFrom<String> for RelativePath {
    type Error = ErrorCode;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        Self::new(value)
    }
}
impl From<RelativePath> for String {
    fn from(value: RelativePath) -> Self {
        value.0
    }
}

#[cfg(windows)]
fn unsafe_windows_component(value: &str) -> bool {
    let stem = value
        .trim_end_matches([' ', '.'])
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    value.contains(':')
        || value.ends_with([' ', '.'])
        || matches!(
            stem.as_str(),
            "CON"
                | "PRN"
                | "AUX"
                | "NUL"
                | "COM1"
                | "COM2"
                | "COM3"
                | "COM4"
                | "COM5"
                | "COM6"
                | "COM7"
                | "COM8"
                | "COM9"
                | "LPT1"
                | "LPT2"
                | "LPT3"
                | "LPT4"
                | "LPT5"
                | "LPT6"
                | "LPT7"
                | "LPT8"
                | "LPT9"
        )
}

#[cfg(windows)]
pub fn is_link_or_reparse(metadata: &Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;
    metadata.file_type().is_symlink()
        || metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0
}
#[cfg(not(windows))]
pub fn is_link_or_reparse(metadata: &Metadata) -> bool {
    metadata.file_type().is_symlink()
}

#[derive(Clone, Debug)]
pub struct ResolvedTarget {
    pub parent_identity: FileIdentity,
    pub parent_anchor: DirectoryAnchor,
    pub name: OsString,
}

pub fn resolve_target(
    root: &DirectoryAnchor,
    relative: &RelativePath,
    must_exist: bool,
) -> Result<ResolvedTarget, ErrorCode> {
    root.validate_chain()?;
    let mut current = root.clone();
    let components: Vec<_> = relative.as_path().components().collect();
    for component in components.iter().take(components.len().saturating_sub(1)) {
        let Component::Normal(name) = component else {
            return Err(ErrorCode::UnsafePath);
        };
        current = current.open_child(name, false)?;
    }
    let name = relative
        .as_path()
        .file_name()
        .filter(|name| !name.is_empty())
        .ok_or(ErrorCode::UnsafePath)?
        .to_os_string();
    if must_exist {
        current.open_file(&name)?;
    }
    let parent_identity = current.identity().clone();
    Ok(ResolvedTarget {
        parent_identity,
        parent_anchor: current,
        name,
    })
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactPaths {
    pub stage: PathBuf,
    pub accepted: PathBuf,
    pub backup: PathBuf,
    pub parent_identity: FileIdentity,
}

pub fn artifact_paths(
    directory: &DirectoryAnchor,
    target_name: &OsStr,
    target_parent_identity: &FileIdentity,
    txid: &str,
    index: usize,
) -> Result<ArtifactPaths, ErrorCode> {
    directory.validate_chain()?;
    let filename = target_name.to_str().ok_or(ErrorCode::UnsafePath)?;
    let prefix = format!(".loomlight-{txid}-{index}-{filename}");
    Ok(ArtifactPaths {
        stage: PathBuf::from(format!("{prefix}.stage")),
        accepted: PathBuf::from(format!("{prefix}.accepted")),
        backup: PathBuf::from(format!("{prefix}.backup")),
        parent_identity: target_parent_identity.clone(),
    })
}
