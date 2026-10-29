use super::*;
use crate::{
    media::{import_image_presentation, MediaPresentation},
    scene::SceneError,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReviewUiImageRequest {
    pub asset_id: String,
    pub expected_asset_sha256: String,
}

pub(crate) struct UiImageSelection {
    pub path: String,
    pub metadata: Option<FileMutation>,
}

impl AuthoringService {
    pub fn review_ui_image(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: ReviewUiImageRequest,
    ) -> Result<MediaPresentation, SceneError> {
        let (metadata, _) = self
            .load_metadata(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        let asset = metadata
            .assets
            .iter()
            .find(|a| a.id == request.asset_id)
            .ok_or(SceneError::ImageMissing)?;
        if asset.kind != AssetKind::UiImage {
            return Err(SceneError::ImageInvalid);
        }
        if asset.sha256 != request.expected_asset_sha256 {
            return Err(SceneError::ImageChanged);
        }
        let status = self
            .list(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        match status
            .assets
            .iter()
            .find(|a| a.id == asset.id)
            .map(|a| a.status.as_str())
        {
            Some("missing") => return Err(SceneError::ImageMissing),
            Some("available" | "changed") => {}
            _ => return Err(SceneError::ImageInvalid),
        }
        let (bytes, revision) = self
            .transactions
            .snapshot_bounded(
                project,
                RelativePath::new(&asset.relative_path).map_err(|_| SceneError::ImageInvalid)?,
                crate::media::MAX_PRESENTATION_BYTES as usize,
            )
            .map_err(|_| SceneError::ImageChanged)?;
        let extension = asset
            .relative_path
            .rsplit('.')
            .next()
            .ok_or(SceneError::ImageInvalid)?;
        import_image_presentation(asset.id.clone(), extension, &bytes, revision.sha256)
            .map_err(|_| SceneError::ImageInvalid)
    }

    pub(crate) fn prepare_ui_image_reference(
        &self,
        project: &ProjectId,
        project_id: &str,
        asset_id: &str,
        expected_sha256: &str,
        replacement_sha256: Option<&str>,
    ) -> Result<UiImageSelection, SceneError> {
        if replacement_sha256.is_none() {
            let model = self
                .list(project, project_id)
                .map_err(|_| SceneError::SourceConflict)?;
            if model
                .assets
                .iter()
                .any(|asset| asset.id == asset_id && asset.status == "changed")
            {
                return Err(SceneError::ImageChanged);
            }
        }
        let media = self.review_ui_image(
            project,
            project_id,
            ReviewUiImageRequest {
                asset_id: asset_id.into(),
                expected_asset_sha256: expected_sha256.into(),
            },
        )?;
        if media.sha256 != replacement_sha256.unwrap_or(expected_sha256) {
            return Err(SceneError::ImageChanged);
        }
        let (mut metadata, snapshot) = self
            .load_metadata(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        let asset = metadata
            .assets
            .iter_mut()
            .find(|a| a.id == asset_id)
            .ok_or(SceneError::ImageMissing)?;
        if asset.sha256 != expected_sha256 {
            return Err(SceneError::ImageChanged);
        }
        let path = asset
            .relative_path
            .strip_prefix("game/")
            .ok_or(SceneError::ImageInvalid)?
            .to_owned();
        let changed = asset.sha256 != media.sha256;
        if changed {
            asset.sha256 = media.sha256;
            asset.byte_count = media.byte_count;
            asset.status = "available".into();
            asset
                .extra
                .insert("naturalWidth".into(), media.width.into());
            asset
                .extra
                .insert("naturalHeight".into(), media.height.into());
        }
        Ok(UiImageSelection {
            path,
            metadata: if changed {
                Some(
                    metadata_file_mutation(snapshot, &metadata)
                        .map_err(|_| SceneError::SourceConflict)?,
                )
            } else {
                None
            },
        })
    }
}
