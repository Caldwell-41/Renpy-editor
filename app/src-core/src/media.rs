//! Bounded, read-only media presentation for the active project session.

use crate::{
    authoring::{AssetKind, AuthoringService},
    transaction::{ProjectId, RelativePath},
};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};

const MAX_PRESENTATION_BYTES: u64 = 16 * 1024 * 1024;
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
        let authoring = self
            .list(project, project_id)
            .map_err(|error| match error {
                crate::authoring::AuthoringError::RecoveryRequired => MediaError::RecoveryRequired,
                crate::authoring::AuthoringError::SourceConflict => MediaError::SourceConflict,
                _ => MediaError::Io,
            })?;
        let asset = authoring
            .assets
            .iter()
            .find(|asset| asset.id == request.asset_id)
            .ok_or(MediaError::UnknownAsset)?;
        if asset.status != "available" || asset.byte_count > MAX_PRESENTATION_BYTES {
            return Err(if asset.byte_count > MAX_PRESENTATION_BYTES {
                MediaError::Oversize
            } else {
                MediaError::UnsafeAsset
            });
        }
        let image = matches!(
            asset.kind,
            AssetKind::Background | AssetKind::CharacterAppearance
        );
        if image == matches!(request.purpose, MediaPurpose::AudioAudition) {
            return Err(MediaError::InvalidPayload);
        }
        let path = RelativePath::new(&asset.relative_path).map_err(|_| MediaError::UnsafeAsset)?;
        let (bytes, revision) =
            self.transactions
                .snapshot(project, path)
                .map_err(|diagnostic| match diagnostic.code {
                    crate::transaction::ErrorCode::RecoveryRequired => MediaError::RecoveryRequired,
                    crate::transaction::ErrorCode::StaleRevision
                    | crate::transaction::ErrorCode::ExpectedBytesChanged
                    | crate::transaction::ErrorCode::FileIdentityChanged => {
                        MediaError::SourceConflict
                    }
                    _ => MediaError::UnsafeAsset,
                })?;
        if bytes.len() as u64 != asset.byte_count || revision.sha256 != asset.sha256 {
            return Err(MediaError::SourceConflict);
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

fn validate_image(extension: &str, bytes: &[u8]) -> Result<ValidatedImage, MediaError> {
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
