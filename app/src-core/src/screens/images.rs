use super::*;
use crate::{
    authoring::AssetKind,
    media::{MediaError, MediaPurpose, MediaRequest},
};

impl AuthoringService {
    pub(super) fn screen_image_path(
        &self,
        project: &ProjectId,
        project_id: &str,
        asset_id: &str,
        expected_sha256: &str,
    ) -> Result<String, SceneError> {
        let model = self
            .list(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        let asset = model
            .assets
            .iter()
            .find(|asset| asset.id == asset_id)
            .ok_or(SceneError::ImageMissing)?;
        if asset.kind != AssetKind::UiImage {
            return Err(SceneError::ImageInvalid);
        }
        match asset.status.as_str() {
            "missing" => return Err(SceneError::ImageMissing),
            "changed" => return Err(SceneError::ImageChanged),
            "available" => {}
            _ => return Err(SceneError::ImageInvalid),
        }
        if asset.sha256 != expected_sha256 {
            return Err(SceneError::ImageChanged);
        }
        self.media_present(
            project,
            project_id,
            MediaRequest {
                asset_id: asset_id.into(),
                purpose: MediaPurpose::ImagePreview,
            },
        )
        .map_err(|error| match error {
            MediaError::UnknownAsset => SceneError::ImageMissing,
            MediaError::SourceConflict => SceneError::ImageChanged,
            MediaError::RecoveryRequired => SceneError::RecoveryRequired,
            _ => SceneError::ImageInvalid,
        })?;
        asset
            .relative_path
            .strip_prefix("game/")
            .map(str::to_owned)
            .ok_or(SceneError::ImageInvalid)
    }
}
