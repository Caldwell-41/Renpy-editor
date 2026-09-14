use super::{
    identity::{identity_for_path, FileIdentity},
    ErrorCode,
};
use serde::{Deserialize, Serialize};
use std::{
    ffi::OsStr,
    fs::{self, Metadata},
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
    pub path: PathBuf,
    pub parent: PathBuf,
    pub parent_identity: FileIdentity,
}

pub fn resolve_target(
    root: &Path,
    relative: &RelativePath,
    must_exist: bool,
) -> Result<ResolvedTarget, ErrorCode> {
    let mut current = root.to_path_buf();
    let components: Vec<_> = relative.as_path().components().collect();
    for component in components.iter().take(components.len().saturating_sub(1)) {
        let Component::Normal(name) = component else {
            return Err(ErrorCode::UnsafePath);
        };
        current.push(name);
        let metadata = fs::symlink_metadata(&current).map_err(|_| ErrorCode::UnsafePath)?;
        if !metadata.is_dir() || is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
    }
    let parent = fs::canonicalize(&current).map_err(|_| ErrorCode::UnsafePath)?;
    if !parent.starts_with(root) {
        return Err(ErrorCode::UnsafePath);
    }
    let name = relative
        .as_path()
        .file_name()
        .filter(|name| !name.is_empty())
        .ok_or(ErrorCode::UnsafePath)?;
    let target = parent.join(name);
    if let Ok(metadata) = fs::symlink_metadata(&target) {
        if is_link_or_reparse(&metadata) || !metadata.is_file() {
            return Err(ErrorCode::UnsafePath);
        }
    } else if must_exist {
        return Err(ErrorCode::IoFailure);
    }
    if must_exist {
        let canonical = fs::canonicalize(&target).map_err(|_| ErrorCode::IoFailure)?;
        if !canonical.starts_with(root) || canonical != target {
            return Err(ErrorCode::UnsafePath);
        }
    }
    let parent_identity = identity_for_path(&parent).map_err(|_| ErrorCode::IoFailure)?;
    Ok(ResolvedTarget {
        path: target,
        parent,
        parent_identity,
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

pub fn artifact_paths(target: &Path, txid: &str, index: usize) -> Result<ArtifactPaths, ErrorCode> {
    let parent = target.parent().ok_or(ErrorCode::UnsafePath)?;
    let parent_identity = identity_for_path(parent).map_err(|_| ErrorCode::IoFailure)?;
    let filename = target
        .file_name()
        .and_then(OsStr::to_str)
        .ok_or(ErrorCode::UnsafePath)?;
    let prefix = format!(".loomlight-{txid}-{index}-{filename}");
    Ok(ArtifactPaths {
        stage: parent.join(format!("{prefix}.stage")),
        accepted: parent.join(format!("{prefix}.accepted")),
        backup: parent.join(format!("{prefix}.backup")),
        parent_identity,
    })
}
