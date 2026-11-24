//! Bounded, read-only media presentation for the active project session.

use crate::{
    authoring::{AssetKind, AuthoringService},
    transaction::{ProjectId, RelativePath},
};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};

pub(crate) const MAX_PRESENTATION_BYTES: u64 = 16 * 1024 * 1024;
const MAX_IMAGE_DIMENSION: u32 = 8192;
type ValidatedImage = (&'static str, Option<(u32, u32)>);

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum MediaPurpose {
    Thumbnail,
    ImagePreview,
    AudioAudition,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MediaRequest {
    pub asset_id: String,
    pub purpose: MediaPurpose,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImportPreviewRequest {
    pub authority_id: String,
}

pub(crate) fn import_image_presentation(
    authority_id: String,
    extension: &str,
    bytes: &[u8],
    sha256: String,
) -> Result<MediaPresentation, MediaError> {
    let (mime_type, dimensions) = validate_image(extension, bytes)?;
    let (width, height) = dimensions.map_or((None, None), |(w, h)| (Some(w), Some(h)));
    Ok(MediaPresentation {
        cache_key: format!("{authority_id}:{sha256}"),
        asset_id: authority_id,
        purpose: MediaPurpose::ImagePreview,
        mime_type: mime_type.into(),
        data_base64: STANDARD.encode(bytes),
        sha256,
        byte_count: bytes.len() as u64,
        width,
        height,
    })
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaPresentation {
    pub asset_id: String,
    pub purpose: MediaPurpose,
    pub mime_type: String,
    pub data_base64: String,
    pub sha256: String,
    pub byte_count: u64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub cache_key: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MediaError {
    InvalidPayload,
    UnknownAsset,
    UnsafeAsset,
    UnsupportedFormat,
    Oversize,
    InvalidDimensions,
    SourceConflict,
    RecoveryRequired,
    Io,
}

impl AuthoringService {
    pub fn media_present(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: MediaRequest,
    ) -> Result<MediaPresentation, MediaError> {
        if uuid::Uuid::parse_str(&request.asset_id).is_err() {
            return Err(MediaError::InvalidPayload);
        }
        // Only the requested asset is read and hashed, once; the other assets keep
        // their stored status.
        let authoring = self
            .list_without_asset_statuses(project, project_id)
            .map_err(|error| match error {
                crate::authoring::AuthoringError::RecoveryRequired => MediaError::RecoveryRequired,
                crate::authoring::AuthoringError::SourceConflict => MediaError::SourceConflict,
                _ => MediaError::Io,
            })?
            .metadata;
        let asset = authoring
            .assets
            .iter()
            .find(|asset| asset.id == request.asset_id)
            .ok_or(MediaError::UnknownAsset)?;
        if asset.byte_count > MAX_PRESENTATION_BYTES {
            return Err(MediaError::Oversize);
        }
        let path = RelativePath::new(&asset.relative_path).map_err(|_| MediaError::UnsafeAsset)?;
        let read = self
            .transactions
            .snapshot_optional(project, path)
            .map_err(|diagnostic| match diagnostic.code {
                crate::transaction::ErrorCode::RecoveryRequired => MediaError::RecoveryRequired,
                crate::transaction::ErrorCode::StaleRevision
                | crate::transaction::ErrorCode::ExpectedBytesChanged
                | crate::transaction::ErrorCode::FileIdentityChanged => MediaError::SourceConflict,
                _ => MediaError::UnsafeAsset,
            })?;
        // The same checks as the asset list: a changed, missing or undeclared asset
        // (compatibilityRequired) is not presented.
        let physical = Ok(read
            .as_ref()
            .map(|(bytes, revision)| (bytes.len() as u64, revision.sha256.clone())));
        if self.asset_context(project).status(asset, physical) != "available" {
            return Err(MediaError::UnsafeAsset);
        }
        let Some((bytes, revision)) = read else {
            return Err(MediaError::UnsafeAsset);
        };
        let image = matches!(
            asset.kind,
            AssetKind::Background | AssetKind::CharacterAppearance | AssetKind::UiImage
        );
        if image == matches!(request.purpose, MediaPurpose::AudioAudition) {
            return Err(MediaError::InvalidPayload);
        }
        if bytes.len() as u64 > MAX_PRESENTATION_BYTES {
            return Err(MediaError::Oversize);
        }
        let extension = asset
            .relative_path
            .rsplit_once('.')
            .map(|(_, extension)| extension.to_ascii_lowercase())
            .ok_or(MediaError::UnsupportedFormat)?;
        let (mime_type, dimensions) = if image {
            validate_image(&extension, &bytes)?
        } else {
            (validate_audio(&extension, &bytes)?, None)
        };
        let (width, height) =
            dimensions.map_or((None, None), |(width, height)| (Some(width), Some(height)));
        Ok(MediaPresentation {
            asset_id: asset.id.clone(),
            purpose: request.purpose,
            mime_type: mime_type.into(),
            data_base64: STANDARD.encode(&bytes),
            sha256: revision.sha256.clone(),
            byte_count: bytes.len() as u64,
            width,
            height,
            cache_key: format!("{}:{}", asset.id, revision.sha256),
        })
    }
}

pub(crate) fn validate_image(extension: &str, bytes: &[u8]) -> Result<ValidatedImage, MediaError> {
    let (mime, dimensions) = match extension {
        "png"
            if bytes.len() >= 24
                && bytes[..8] == [137, 80, 78, 71, 13, 10, 26, 10]
                && bytes[12..16] == *b"IHDR" =>
        {
            (
                "image/png",
                (
                    u32::from_be_bytes(
                        bytes[16..20]
                            .try_into()
                            .map_err(|_| MediaError::UnsupportedFormat)?,
                    ),
                    u32::from_be_bytes(
                        bytes[20..24]
                            .try_into()
                            .map_err(|_| MediaError::UnsupportedFormat)?,
                    ),
                ),
            )
        }
        "jpg" | "jpeg" if bytes.starts_with(&[0xff, 0xd8]) => (
            "image/jpeg",
            jpeg_dimensions(bytes).ok_or(MediaError::UnsupportedFormat)?,
        ),
        "webp" => (
            "image/webp",
            webp_dimensions(bytes).ok_or(MediaError::UnsupportedFormat)?,
        ),
        _ => return Err(MediaError::UnsupportedFormat),
    };
    if dimensions.0 == 0
        || dimensions.1 == 0
        || dimensions.0 > MAX_IMAGE_DIMENSION
        || dimensions.1 > MAX_IMAGE_DIMENSION
    {
        return Err(MediaError::InvalidDimensions);
    }
    Ok((mime, Some(dimensions)))
}

// Static WebP dimensions, including lossy, lossless and alpha containers.
// https://developers.google.com/speed/webp/docs/riff_container
fn webp_dimensions(bytes: &[u8]) -> Option<(u32, u32)> {
    if bytes.get(..4)? != b"RIFF" || bytes.get(8..12)? != b"WEBP" {
        return None;
    }
    let size = u32::from_le_bytes(bytes.get(4..8)?.try_into().ok()?) as usize;
    if size.checked_add(8)? != bytes.len() {
        return None;
    }
    let mut offset = 12usize;
    let mut canvas = None;
    let mut dimensions = None;
    while offset < bytes.len() {
        let tag = bytes.get(offset..offset.checked_add(4)?)?;
        let length =
            u32::from_le_bytes(bytes.get(offset + 4..offset + 8)?.try_into().ok()?) as usize;
        let end = offset.checked_add(8)?.checked_add(length)?;
        let data = bytes.get(offset + 8..end)?;
        match tag {
            b"VP8X" => {
                if offset != 12 || data.len() != 10 || data[0] & 2 != 0 {
                    return None;
                }
                let width = u32::from_le_bytes([data[4], data[5], data[6], 0]) + 1;
                let height = u32::from_le_bytes([data[7], data[8], data[9], 0]) + 1;
                canvas = Some((width, height));
            }
            b"VP8L" => {
                if dimensions.is_some() || *data.first()? != 0x2f {
                    return None;
                }
                let header = u32::from_le_bytes(data.get(1..5)?.try_into().ok()?);
                if header >> 29 != 0 {
                    return None;
                }
                dimensions = Some(((header & 0x3fff) + 1, ((header >> 14) & 0x3fff) + 1));
            }
            b"VP8 " => {
                if dimensions.is_some()
                    || *data.first()? & 1 != 0
                    || data.get(3..6)? != [0x9d, 0x01, 0x2a]
                {
                    return None;
                }
                let width = u16::from_le_bytes(data.get(6..8)?.try_into().ok()?) & 0x3fff;
                let height = u16::from_le_bytes(data.get(8..10)?.try_into().ok()?) & 0x3fff;
                dimensions = Some((width.into(), height.into()));
            }
            b"ANIM" | b"ANMF" => return None,
            _ => {}
        }
        if length % 2 != 0 && *bytes.get(end)? != 0 {
            return None;
        }
        offset = end.checked_add(length % 2)?;
    }
    let dimensions = dimensions?;
    if canvas.is_some_and(|canvas| canvas != dimensions) {
        return None;
    }
    Some(dimensions)
}

fn jpeg_dimensions(bytes: &[u8]) -> Option<(u32, u32)> {
    let mut offset = 2usize;
    while offset + 4 <= bytes.len() {
        if bytes[offset] != 0xff {
            return None;
        }
        while offset < bytes.len() && bytes[offset] == 0xff {
            offset += 1;
        }
        let marker = *bytes.get(offset)?;
        offset += 1;
        if matches!(marker, 0x01 | 0xd8 | 0xd9) {
            continue;
        }
        let length = u16::from_be_bytes([*bytes.get(offset)?, *bytes.get(offset + 1)?]) as usize;
        if length < 2 || offset.checked_add(length)? > bytes.len() {
            return None;
        }
        if matches!(
            marker,
            0xc0 | 0xc1
                | 0xc2
                | 0xc3
                | 0xc5
                | 0xc6
                | 0xc7
                | 0xc9
                | 0xca
                | 0xcb
                | 0xcd
                | 0xce
                | 0xcf
        ) {
            if length < 7 {
                return None;
            }
            let height = u16::from_be_bytes([bytes[offset + 3], bytes[offset + 4]]) as u32;
            let width = u16::from_be_bytes([bytes[offset + 5], bytes[offset + 6]]) as u32;
            return Some((width, height));
        }
        offset += length;
    }
    None
}

fn validate_audio(extension: &str, bytes: &[u8]) -> Result<&'static str, MediaError> {
    match extension {
        "ogg" if bytes.starts_with(b"OggS") => Ok("audio/ogg"),
        "wav" if bytes.len() >= 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WAVE" => {
            Ok("audio/wav")
        }
        "flac" if bytes.starts_with(b"fLaC") => Ok("audio/flac"),
        "mp3"
            if bytes.starts_with(b"ID3")
                || (bytes.len() >= 2 && bytes[0] == 0xff && bytes[1] & 0xe0 == 0xe0) =>
        {
            Ok("audio/mpeg")
        }
        _ => Err(MediaError::UnsupportedFormat),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lifecycle::{acceptance::ipc, LifecycleService};
    use crate::transaction::take_revision_bytes_read;
    use serde_json::json;

    #[test]
    fn a_request_hashes_each_asset_once_and_media_present_hashes_only_its_asset() {
        let temporary = tempfile::tempdir().unwrap();
        let profile = temporary.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        std::fs::create_dir_all(root.join("game/audio")).unwrap();
        service.open_path(&root).unwrap();
        let listed = |service: &mut LifecycleService| {
            let _ = take_revision_bytes_read();
            ipc(service, "scene.list", json!({}));
            take_revision_bytes_read()
        };
        // A Commit: scene.apply reads the list before and after its write.
        let committed = |service: &mut LifecycleService, text: &str| {
            let ws = ipc(service, "scene.list", json!({}));
            let scene = ws["scenes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|scene| {
                    scene["beats"].as_array().unwrap().iter().any(|beat| {
                        beat["owner"].is_null()
                            && beat["protected"] == false
                            && beat["payload"]["type"] == "narration"
                    })
                })
                .unwrap()
                .clone();
            let beat = scene["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|beat| {
                    beat["owner"].is_null()
                        && beat["protected"] == false
                        && beat["payload"]["type"] == "narration"
                })
                .unwrap()
                .clone();
            let _ = take_revision_bytes_read();
            ipc(
                service,
                "scene.apply",
                json!({"expectedProjectRevision": ws["projectRevision"], "expectedSourceMapRevision": ws["sourceMapRevision"],
                "command": {"type": "updateBodyBeat", "sceneId": scene["id"], "expectedSourceRevision": scene["sourceRevision"], "beatId": beat["id"],
                    "expectedBody": {"type": "root"}, "beat": {"type": "narration", "text": text}}}),
            );
            take_revision_bytes_read()
        };
        let commit_without_assets = committed(&mut service, "Measured before");
        let without_assets = listed(&mut service);
        let mut ids = Vec::new();
        for (name, bytes) in [
            (
                "bell",
                &include_bytes!("../../../tests/fixtures/phase-1h/assets/bell.wav")[..],
            ),
            (
                "theme",
                &include_bytes!("../../../tests/fixtures/phase-1h/assets/theme.wav")[..],
            ),
        ] {
            assert_eq!(bytes.len(), 32_044);
            let chosen = temporary.path().join(format!("{name}.wav"));
            std::fs::write(&chosen, bytes).unwrap();
            let choice = service.authoring_select_import(&chosen).unwrap();
            let model = ipc(
                &mut service,
                "asset.import",
                json!({"authorityId": choice.authority_id, "kind": "music", "technicalName": name,
                    "displayName": name, "characterId": null, "expression": null}),
            );
            let asset = model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["displayName"] == name)
                .unwrap();
            assert_eq!(asset["status"], "available");
            ids.push(asset["id"].clone());
        }
        // scene.list reads the asset list through several services; each asset is hashed once.
        let asset_bytes = listed(&mut service) - without_assets;
        assert!(
            (2 * 32_044..3 * 32_044).contains(&asset_bytes),
            "scene.list hashed {asset_bytes} asset bytes"
        );
        // A write that touches no file the list read keeps it, so a Commit hashes each asset once.
        let commit_asset_bytes = committed(&mut service, "Measured after") - commit_without_assets;
        assert!(
            (2 * 32_044..3 * 32_044).contains(&commit_asset_bytes),
            "scene.apply hashed {commit_asset_bytes} asset bytes"
        );
        let _ = take_revision_bytes_read();
        let media = ipc(
            &mut service,
            "media.present",
            json!({"assetId": ids[0], "purpose": "audioAudition"}),
        );
        assert_eq!(media["byteCount"], 32_044);
        let read = take_revision_bytes_read();
        assert!(
            (32_044..2 * 32_044).contains(&read),
            "media.present hashed {read} bytes, not only its asset once"
        );
    }

    fn png(width: u32, height: u32) -> Vec<u8> {
        let mut bytes = vec![137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13];
        bytes.extend_from_slice(b"IHDR");
        bytes.extend_from_slice(&width.to_be_bytes());
        bytes.extend_from_slice(&height.to_be_bytes());
        bytes.extend_from_slice(&[8, 6, 0, 0, 0]);
        bytes
    }

    #[test]
    fn accepts_only_bounded_passive_raster_dimensions() {
        assert_eq!(
            validate_image("png", &png(1920, 1080)).unwrap(),
            ("image/png", Some((1920, 1080)))
        );
        assert_eq!(
            validate_image("png", &png(8193, 1080)),
            Err(MediaError::InvalidDimensions)
        );
        assert_eq!(
            validate_image("svg", b"<svg><script/></svg>"),
            Err(MediaError::UnsupportedFormat)
        );
        assert_eq!(
            validate_image("png", b"not a png"),
            Err(MediaError::UnsupportedFormat)
        );
    }

    #[test]
    fn accepts_only_magic_verified_audio() {
        assert_eq!(validate_audio("ogg", b"OggSfixture"), Ok("audio/ogg"));
        assert_eq!(
            validate_audio("wav", b"RIFF0000WAVEfixture"),
            Ok("audio/wav")
        );
        assert_eq!(validate_audio("flac", b"fLaCfixture"), Ok("audio/flac"));
        assert_eq!(validate_audio("mp3", b"ID3fixture"), Ok("audio/mpeg"));
        assert_eq!(
            validate_audio("ogg", b"<html>active"),
            Err(MediaError::UnsupportedFormat)
        );
    }

    #[test]
    fn renderer_cannot_supply_a_path_or_remote_location() {
        assert!(serde_json::from_value::<MediaRequest>(serde_json::json!({
            "assetId": uuid::Uuid::new_v4().to_string(),
            "purpose": "thumbnail",
            "path": "../outside.png"
        }))
        .is_err());
        assert!(serde_json::from_value::<MediaRequest>(serde_json::json!({
            "assetId": uuid::Uuid::new_v4().to_string(),
            "purpose": "imagePreview",
            "url": "https://example.invalid/active.svg"
        }))
        .is_err());
    }
}
