//! Bounded font parsing never evaluates project source or opens a renderer URL.
use super::*;
use crate::scene::SceneError;
use base64::Engine;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FontPresentation {
    pub sha256: String,
    pub byte_count: usize,
    pub mime_type: String,
    pub data_base64: String,
}
fn present(path: &str, bytes: &[u8]) -> FontPresentation {
    FontPresentation {
        sha256: hash_bytes(bytes),
        byte_count: bytes.len(),
        mime_type: if path.ends_with(".otf") {
            "font/otf"
        } else {
            "font/ttf"
        }
        .into(),
        data_base64: base64::engine::general_purpose::STANDARD.encode(bytes),
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FontReference {
    pub asset_id: String,
    pub expected_asset_sha256: String,
}

impl AuthoringService {
    pub fn present_font(
        &self,
        project: &ProjectId,
        project_id: &str,
        reference: FontReference,
    ) -> Result<FontPresentation, SceneError> {
        let (path, bytes) = self.font_bytes(project, project_id, &reference)?;
        Ok(present(&path, &bytes))
    }
    pub fn preview_font(
        &mut self,
        project: &ProjectId,
        request: crate::media::ImportPreviewRequest,
    ) -> Result<FontPresentation, AuthoringError> {
        let authority = self
            .imports
            .get_mut(&request.authority_id)
            .filter(|a| &a.project == project)
            .ok_or(AuthoringError::UnknownImport)?;
        if !matches!(authority.extension.as_str(), "ttf" | "otf") {
            return Err(AuthoringError::UnsupportedFormat);
        }
        if authority.byte_count > crate::media::MAX_PRESENTATION_BYTES {
            return Err(AuthoringError::FontTooLarge);
        }
        revalidate_import_contents(authority)?;
        authority.file.rewind().map_err(|_| AuthoringError::Io)?;
        let mut bytes = vec![];
        (&mut authority.file)
            .take(crate::media::MAX_PRESENTATION_BYTES + 1)
            .read_to_end(&mut bytes)
            .map_err(|_| AuthoringError::Io)?;
        if bytes.len() as u64 != authority.byte_count || hash_bytes(&bytes) != authority.sha256 {
            return Err(AuthoringError::SourceConflict);
        }
        validate(&bytes)?;
        Ok(present(
            &format!("selected.{}", authority.extension),
            &bytes,
        ))
    }
    pub(crate) fn font_bytes(
        &self,
        project: &ProjectId,
        project_id: &str,
        reference: &FontReference,
    ) -> Result<(String, Vec<u8>), SceneError> {
        let metadata = self
            .list(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        let asset = metadata
            .assets
            .iter()
            .find(|a| a.id == reference.asset_id)
            .ok_or(SceneError::FontMissing)?;
        if asset.kind != AssetKind::Font {
            return Err(SceneError::FontInvalid);
        }
        if asset.status == "missing" {
            return Err(SceneError::FontMissing);
        }
        if asset.status != "available" || asset.sha256 != reference.expected_asset_sha256 {
            return Err(SceneError::FontChanged);
        }
        let (bytes, revision) = self
            .transactions
            .snapshot_bounded(
                project,
                RelativePath::new(&asset.relative_path).map_err(|_| SceneError::FontInvalid)?,
                crate::media::MAX_PRESENTATION_BYTES as usize,
            )
            .map_err(|_| SceneError::FontMissing)?;
        if revision.sha256 != reference.expected_asset_sha256 {
            return Err(SceneError::FontChanged);
        }
        validate(&bytes).map_err(|_| SceneError::FontInvalid)?;
        let path = asset
            .relative_path
            .strip_prefix("game/")
            .ok_or(SceneError::FontInvalid)?
            .to_owned();
        Ok((path, bytes))
    }
}

pub(crate) fn validate(bytes: &[u8]) -> Result<(), AuthoringError> {
    if bytes.len() as u64 > crate::media::MAX_PRESENTATION_BYTES
        || !matches!(
            bytes.get(..4),
            Some(b"\x00\x01\x00\x00" | b"OTTO" | b"true")
        )
    {
        return Err(AuthoringError::UnsupportedFormat);
    }
    let face = ttf_parser::Face::parse(bytes, 0).map_err(|_| AuthoringError::UnsupportedFormat)?;
    if face.number_of_glyphs() == 0
        || face.tables().cmap.is_none()
        || (face.tables().glyf.is_none() && face.tables().cff.is_none())
    {
        return Err(AuthoringError::UnsupportedFormat);
    }
    Ok(())
}
