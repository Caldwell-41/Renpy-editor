pub mod authoring;
pub mod lifecycle;
pub mod media;
pub mod metadata;
pub mod ports;
pub mod renpy;
pub mod scene;
pub mod source;
pub mod transaction;

use authoring::{
    CreateCharacterRequest, CreateVariableRequest, ImportAssetRequest, SetDefaultAppearanceRequest,
    UpdateCharacterRequest, UpdateVariableRequest,
};
use lifecycle::{CreateProjectRequest, LifecycleError, LifecycleService};
use media::MediaRequest;
use scene::{RecoveryResolveRequest, SceneCommandRequest};
use serde::Serialize;
use serde_json::{json, Map, Value};
use source::{
    SourceApplyBothRequest, SourceDraftRequest, SourceOpenRequest, SourcePathRequest,
    SourceSaveRequest,
};

pub const PROTOCOL_VERSION: u64 = 1;
pub const OPERATIONS: &[&str] = &[
    "system.health",
    "system.version",
    "probe.denied",
    "probe.redactedError",
    "probe.smokeReport",
    "system.folderName",
    "project.chooseParent",
    "project.validateDestination",
    "project.create",
    "project.listRecent",
    "project.openPicker",
    "project.openRecent",
    "project.removeRecent",
    "project.close",
    "project.current",
    "project.status",
    "project.flush",
    "sdk.discover",
    "sdk.browse",
    "sdk.install",
    "authoring.list",
    "character.create",
    "character.update",
    "appearance.setDefault",
    "asset.chooseImport",
    "asset.import",
    "asset.repairCompatibility",
    "variable.create",
    "variable.update",
    "scene.list",
    "scene.apply",
    "scene.recovery",
    "scene.resolveRecovery",
    "media.present",
    "source.list",
    "source.open",
    "source.updateDraft",
    "source.save",
    "source.discard",
    "source.applyBoth",
    "source.saveAll",
    "source.discardAll",
];

const INVALID_REQUEST_ID: &str = "invalid-request";
const GENERIC_ERROR: &str = "The request could not be completed.";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreError {
    code: &'static str,
    message: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreResponse {
    protocol_version: u64,
    request_id: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<CoreError>,
}

impl CoreResponse {
    pub fn success(request_id: String, value: Value) -> Self {
        Self {
            protocol_version: PROTOCOL_VERSION,
            request_id,
            ok: true,
            value: Some(value),
            error: None,
        }
    }

    pub fn failure(request_id: String, code: &'static str, message: &'static str) -> Self {
        Self {
            protocol_version: PROTOCOL_VERSION,
            request_id,
            ok: false,
            value: None,
            error: Some(CoreError { code, message }),
        }
    }

    pub fn is_success(&self) -> bool {
        self.ok
    }
}

fn object(value: &Value) -> Option<&Map<String, Value>> {
    value.as_object()
}

fn has_exact_keys(object: &Map<String, Value>, keys: &[&str]) -> bool {
    object.len() == keys.len() && keys.iter().all(|key| object.contains_key(*key))
}

fn valid_request_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-'))
}

fn request_id_or_placeholder(request: &Value) -> String {
    object(request)
        .and_then(|value| value.get("requestId"))
        .and_then(Value::as_str)
        .filter(|value| valid_request_id(value))
        .unwrap_or(INVALID_REQUEST_ID)
        .to_owned()
}

pub struct ValidatedRequest<'a> {
    pub request_id: String,
    pub operation: &'a str,
    pub payload: &'a Map<String, Value>,
}

pub fn validate_request(request: &Value) -> Result<ValidatedRequest<'_>, CoreResponse> {
    let request_id = request_id_or_placeholder(request);
    let Some(root) = object(request) else {
        return Err(CoreResponse::failure(
            request_id,
            "INVALID_REQUEST",
            "Request must be an object.",
        ));
    };
    if !has_exact_keys(
        root,
        &["protocolVersion", "requestId", "operation", "payload"],
    ) || root.get("protocolVersion").and_then(Value::as_u64) != Some(PROTOCOL_VERSION)
        || root
            .get("requestId")
            .and_then(Value::as_str)
            .is_none_or(|value| !valid_request_id(value))
    {
        return Err(CoreResponse::failure(
            request_id,
            "INVALID_REQUEST",
            "Request envelope is invalid.",
        ));
    }
    let operation = root
        .get("operation")
        .and_then(Value::as_str)
        .ok_or_else(|| {
            CoreResponse::failure(
                request_id.clone(),
                "INVALID_REQUEST",
                "Request envelope is invalid.",
            )
        })?;
    let payload = root
        .get("payload")
        .and_then(Value::as_object)
        .ok_or_else(|| {
            CoreResponse::failure(
                request_id.clone(),
                "INVALID_PAYLOAD",
                "Payload must be an object.",
            )
        })?;
    Ok(ValidatedRequest {
        request_id,
        operation,
        payload,
    })
}

fn empty_payload(payload: &Map<String, Value>) -> bool {
    payload.is_empty()
}

fn smoke_payload(payload: &Map<String, Value>) -> bool {
    const BOOLEAN_KEYS: &[&str] = &[
        "ambientFilesystemDenied",
        "ambientHttpDenied",
        "ambientProcessDenied",
        "malformedPayloadDenied",
        "networkDenied",
        "nodeGlobalsDenied",
        "popupRequestIssued",
        "rendererSecretsAbsent",
        "sceneAuthoringUiPassed",
        "sourceAuthoringUiPassed",
        "sourceCommandTracePassed",
        "supportingAuthoringUiPassed",
        "welcomeLifecycleVisible",
        "newProjectWizardVisible",
        "unknownCommandDenied",
        "unauthorisedWindowDenied",
    ];
    let mut keys = BOOLEAN_KEYS.to_vec();
    keys.push("supportingAuthoringStage");
    keys.push("sceneAuthoringStage");
    keys.push("sourceAuthoringStage");
    keys.push("sourceCommandTrace");
    has_exact_keys(payload, &keys)
        && BOOLEAN_KEYS
            .iter()
            .all(|key| payload.get(*key).and_then(Value::as_bool) == Some(true))
        && payload
            .get("supportingAuthoringStage")
            .and_then(Value::as_str)
            == Some("complete")
        && payload.get("sceneAuthoringStage").and_then(Value::as_str) == Some("complete")
        && payload.get("sourceAuthoringStage").and_then(Value::as_str) == Some("complete")
        && payload
            .get("sourceCommandTrace")
            .and_then(Value::as_str)
            .is_some_and(|value| !value.is_empty() && value.len() <= 2048)
}

pub fn handle_request(request: Value, smoke_enabled: bool) -> CoreResponse {
    let validated = match validate_request(&request) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let request_id = validated.request_id;
    let operation = validated.operation;
    let payload = validated.payload;

    match operation {
        "system.health" if empty_payload(payload) => CoreResponse::success(
            request_id,
            json!({ "status": "ready", "protocolVersion": PROTOCOL_VERSION }),
        ),
        "system.version" if empty_payload(payload) => CoreResponse::success(
            request_id,
            json!({ "applicationVersion": env!("CARGO_PKG_VERSION"), "protocolVersion": PROTOCOL_VERSION }),
        ),
        "probe.denied" if empty_payload(payload) => CoreResponse::failure(
            request_id,
            "OPERATION_DENIED",
            "The synthetic operation was denied.",
        ),
        "probe.redactedError"
            if has_exact_keys(payload, &["sensitive"])
                && payload
                    .get("sensitive")
                    .and_then(Value::as_str)
                    .is_some_and(|value| !value.is_empty() && value.len() <= 256) =>
        {
            CoreResponse::failure(request_id, "INTERNAL_ERROR", GENERIC_ERROR)
        }
        "probe.smokeReport" if smoke_enabled && smoke_payload(payload) => {
            CoreResponse::success(request_id, json!({ "accepted": true }))
        }
        known if OPERATIONS.contains(&known) => CoreResponse::failure(
            request_id,
            "INVALID_PAYLOAD",
            "Payload does not match the operation schema.",
        ),
        _ => CoreResponse::failure(
            request_id,
            "OPERATION_NOT_ALLOWED",
            "Operation is not allowlisted.",
        ),
    }
}

pub fn handle_application_request(
    request: Value,
    smoke_enabled: bool,
    lifecycle: &mut LifecycleService,
) -> CoreResponse {
    let validated = match validate_request(&request) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let request_id = validated.request_id.clone();
    let response = match validated.operation {
        "system.folderName"
            if has_exact_keys(validated.payload, &["title"])
                && validated
                    .payload
                    .get("title")
                    .and_then(Value::as_str)
                    .is_some() =>
        {
            Ok(
                json!({ "folderName": lifecycle::folder_name_from_title(validated.payload["title"].as_str().unwrap()) }),
            )
        }
        "project.validateDestination"
            if has_exact_keys(validated.payload, &["parentId", "folderName"]) =>
        {
            let parent = validated.payload.get("parentId").and_then(Value::as_str);
            let folder = validated.payload.get("folderName").and_then(Value::as_str);
            match (parent, folder) {
                (Some(parent), Some(folder)) => lifecycle
                    .validate_destination(parent, folder)
                    .and_then(to_value),
                _ => return invalid_payload(request_id),
            }
        }
        "project.create" => {
            serde_json::from_value::<CreateProjectRequest>(Value::Object(validated.payload.clone()))
                .map_err(|_| LifecycleError::InvalidName)
                .and_then(|payload| lifecycle.create_project(payload))
                .and_then(to_value)
        }
        "project.listRecent" if empty_payload(validated.payload) => {
            to_value(lifecycle.list_recent())
        }
        "project.openRecent" if has_exact_keys(validated.payload, &["recentId"]) => validated
            .payload
            .get("recentId")
            .and_then(Value::as_str)
            .ok_or(LifecycleError::InvalidMetadata)
            .and_then(|id| lifecycle.open_recent(id))
            .and_then(to_value),
        "project.removeRecent" if has_exact_keys(validated.payload, &["recentId"]) => validated
            .payload
            .get("recentId")
            .and_then(Value::as_str)
            .ok_or(LifecycleError::InvalidMetadata)
            .and_then(|id| lifecycle.remove_recent(id))
            .map(|_| json!({ "removed": true })),
        "project.close" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.close())
                .map(|_| json!({ "closed": true }))
        }
        "project.current" if empty_payload(validated.payload) => to_value(lifecycle.current()),
        "project.status" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.authoring_status())
                .and_then(to_value)
        }
        "sdk.discover" if empty_payload(validated.payload) => to_value(lifecycle.discover_sdks()),
        "sdk.install" if empty_payload(validated.payload) => {
            lifecycle.install_sdk().and_then(to_value)
        }
        "authoring.list" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.authoring_list())
                .and_then(to_value)
        }
        "project.flush" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.authoring_flush())
                .and_then(to_value)
        }
        "character.create" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<CreateCharacterRequest>(Value::Object(payload)).map_err(
                    |_| LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload),
                )
            })
            .and_then(|payload| lifecycle.authoring_create_character(payload))
            .and_then(to_value),
        "character.update" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<UpdateCharacterRequest>(Value::Object(payload)).map_err(
                    |_| LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload),
                )
            })
            .and_then(|payload| lifecycle.authoring_update_character(payload))
            .and_then(to_value),
        "appearance.setDefault" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SetDefaultAppearanceRequest>(Value::Object(payload))
                    .map_err(|_| {
                        LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload)
                    })
            })
            .and_then(|payload| lifecycle.authoring_set_default_appearance(payload))
            .and_then(to_value),
        "asset.import" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<ImportAssetRequest>(Value::Object(payload)).map_err(|_| {
                    LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload)
                })
            })
            .and_then(|payload| lifecycle.authoring_import_asset(payload))
            .and_then(to_value),
        "asset.repairCompatibility" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.authoring_repair_asset_compatibility())
                .and_then(to_value)
        }
        "variable.create" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<CreateVariableRequest>(Value::Object(payload)).map_err(
                    |_| LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload),
                )
            })
            .and_then(|payload| lifecycle.authoring_create_variable(payload))
            .and_then(to_value),
        "variable.update" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<UpdateVariableRequest>(Value::Object(payload)).map_err(
                    |_| LifecycleError::Authoring(authoring::AuthoringError::InvalidPayload),
                )
            })
            .and_then(|payload| lifecycle.authoring_update_variable(payload))
            .and_then(to_value),
        "scene.list" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.scene_workspace())
                .and_then(to_value)
        }
        "scene.apply" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SceneCommandRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Scene(scene::SceneError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.scene_apply(payload))
            .and_then(to_value),
        "scene.recovery" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.scene_recovery())
                .and_then(to_value)
        }
        "scene.resolveRecovery" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<RecoveryResolveRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Scene(scene::SceneError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.scene_resolve_recovery(payload))
            .and_then(to_value),
        "media.present" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<MediaRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Media(media::MediaError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.media_present(payload))
            .and_then(to_value),
        "source.list" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.source_inventory())
                .and_then(to_value)
        }
        "source.open" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SourceOpenRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Source(source::SourceError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.source_open(payload))
            .and_then(to_value),
        "source.updateDraft" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SourceDraftRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Source(source::SourceError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.source_update_draft(payload))
            .and_then(to_value),
        "source.save" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SourceSaveRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Source(source::SourceError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.source_save(payload))
            .and_then(to_value),
        "source.discard" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SourcePathRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Source(source::SourceError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.source_discard(payload))
            .and_then(to_value),
        "source.applyBoth" => session_payload(validated.payload)
            .and_then(|(session, payload)| lifecycle.require_session(&session).map(|_| payload))
            .and_then(|payload| {
                serde_json::from_value::<SourceApplyBothRequest>(Value::Object(payload))
                    .map_err(|_| LifecycleError::Source(source::SourceError::InvalidPayload))
            })
            .and_then(|payload| lifecycle.source_apply_both(payload))
            .and_then(to_value),
        "source.saveAll" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.source_save_all())
                .and_then(to_value)
        }
        "source.discardAll" if has_exact_keys(validated.payload, &["sessionId"]) => {
            session_only(validated.payload)
                .and_then(|session| lifecycle.require_session(&session))
                .and_then(|_| lifecycle.source_discard_all())
                .and_then(to_value)
        }
        "project.chooseParent" | "project.openPicker" | "sdk.browse" | "asset.chooseImport" => {
            return CoreResponse::failure(
                request_id,
                "DESKTOP_MEDIATION_REQUIRED",
                "This operation requires the trusted desktop picker.",
            )
        }
        operation if OPERATIONS.contains(&operation) => {
            return handle_request(request, smoke_enabled)
        }
        _ => {
            return CoreResponse::failure(
                request_id,
                "OPERATION_NOT_ALLOWED",
                "Operation is not allowlisted.",
            )
        }
    };
    match response {
        Ok(value) => CoreResponse::success(request_id, value),
        Err(error) => lifecycle_failure(request_id, error),
    }
}

fn to_value<T: Serialize>(value: T) -> Result<Value, LifecycleError> {
    serde_json::to_value(value).map_err(|_| LifecycleError::Io)
}

fn session_only(payload: &Map<String, Value>) -> Result<String, LifecycleError> {
    payload
        .get("sessionId")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty() && value.len() <= 64)
        .map(str::to_owned)
        .ok_or(LifecycleError::StaleSession)
}

fn session_payload(
    payload: &Map<String, Value>,
) -> Result<(String, Map<String, Value>), LifecycleError> {
    let session = session_only(payload)?;
    let mut remainder = payload.clone();
    remainder.remove("sessionId");
    Ok((session, remainder))
}

fn invalid_payload(request_id: String) -> CoreResponse {
    CoreResponse::failure(
        request_id,
        "INVALID_PAYLOAD",
        "Payload does not match the operation schema.",
    )
}

pub fn lifecycle_failure(request_id: String, error: LifecycleError) -> CoreResponse {
    let (code, message) = match error {
        LifecycleError::InvalidParent => {
            ("INVALID_PARENT", "Choose an existing safe parent folder.")
        }
        LifecycleError::InvalidName => ("INVALID_PROJECT_DETAILS", "Project details are invalid."),
        LifecycleError::ExistingDestination => {
            ("DESTINATION_EXISTS", "The destination already exists.")
        }
        LifecycleError::UnsafePath => ("UNSAFE_PATH", "The selected path changed or is unsafe."),
        LifecycleError::UnknownAuthority => (
            "UNKNOWN_SELECTION",
            "The approved selection is no longer available.",
        ),
        LifecycleError::InvalidMetadata => (
            "INVALID_LOOMLIGHT_PROJECT",
            "This is not a valid supported Loomlight project.",
        ),
        LifecycleError::UnsupportedSdk => {
            ("UNSUPPORTED_SDK", "A valid Ren'Py 8.5.3 SDK is required.")
        }
        LifecycleError::GitUnavailable => (
            "GIT_UNAVAILABLE",
            "Git initialization failed. Install Git or create without Git.",
        ),
        LifecycleError::GenerationFailed => (
            "PROJECT_GENERATION_FAILED",
            "Ren'Py could not validate the generated project.",
        ),
        LifecycleError::PromotionFailed => (
            "PROJECT_FINALISATION_FAILED",
            "The completed project could not be finalised safely.",
        ),
        LifecycleError::CreatedNotOpened => (
            "CREATED_NOT_OPENED",
            "The project was created but could not be opened automatically.",
        ),
        LifecycleError::RecoveryRequired => (
            "RECOVERY_REQUIRED",
            "Project recovery must be resolved before authoring can continue.",
        ),
        LifecycleError::StaleSession => (
            "STALE_PROJECT_SESSION",
            "This request belongs to a closed or replaced project session.",
        ),
        LifecycleError::Authoring(error) => return authoring_failure(request_id, error),
        LifecycleError::Scene(error) => return scene_failure(request_id, error),
        LifecycleError::Source(error) => return source_failure(request_id, error),
        LifecycleError::Media(error) => return media_failure(request_id, error),
        LifecycleError::Io => ("LIFECYCLE_ERROR", GENERIC_ERROR),
    };
    CoreResponse::failure(request_id, code, message)
}

fn media_failure(request_id: String, error: media::MediaError) -> CoreResponse {
    use media::MediaError::*;
    let (code, message) = match error {
        InvalidPayload => ("INVALID_PAYLOAD", "The media request is invalid."),
        UnknownAsset => ("UNKNOWN_ASSET", "The selected media item is unavailable."),
        UnsafeAsset => ("UNSAFE_MEDIA", "The media path or file identity is unsafe."),
        UnsupportedFormat => (
            "UNSUPPORTED_MEDIA",
            "This passive media format is not supported for presentation.",
        ),
        Oversize => (
            "MEDIA_TOO_LARGE",
            "The media exceeds the 16 MiB presentation limit.",
        ),
        InvalidDimensions => (
            "INVALID_MEDIA_DIMENSIONS",
            "The image dimensions are invalid or exceed 8192 pixels.",
        ),
        SourceConflict => (
            "MEDIA_CHANGED",
            "The media changed after it was imported. Revalidate it before presentation.",
        ),
        RecoveryRequired => (
            "RECOVERY_REQUIRED",
            "Project recovery must be resolved before media can be presented.",
        ),
        Io => ("MEDIA_ERROR", GENERIC_ERROR),
    };
    CoreResponse::failure(request_id, code, message)
}

fn scene_failure(request_id: String, error: scene::SceneError) -> CoreResponse {
    use scene::SceneError::*;
    let (code, message) = match error {
        InvalidPayload => ("INVALID_PAYLOAD", "The Scene operation is invalid."),
        InvalidMetadata => (
            "INVALID_SCENE_METADATA",
            "Scene metadata is invalid or unsupported.",
        ),
        UnsupportedSource => (
            "UNSUPPORTED_SCENE_SOURCE",
            "The Scene source boundary cannot be proven safely.",
        ),
        SourceConflict => (
            "SOURCE_CONFLICT",
            "The Scene source changed outside Loomlight. Reload before editing.",
        ),
        DirtySource => (
            "DIRTY_SOURCE",
            "This source file has an unaccepted draft. Save or discard it before changing the Scene.",
        ),
        UnknownEntity => ("UNKNOWN_ENTITY", "The selected Scene item is unavailable."),
        ReferenceBlocked => (
            "INCOMING_REFERENCE",
            "The Scene has incoming or unknown references and cannot be deleted safely.",
        ),
        InvariantBlocked => (
            "SCENE_INVARIANT",
            "That operation would break a required Chapter or Scene invariant.",
        ),
        OpaqueBoundary => (
            "OPAQUE_BOUNDARY",
            "The operation cannot cross or modify protected Custom Code.",
        ),
        HistoryBoundary => (
            "HISTORY_BOUNDARY",
            "Undo or redo stopped at an external revision boundary.",
        ),
        RecoveryRequired => (
            "RECOVERY_REQUIRED",
            "Project recovery must be resolved before authoring can continue.",
        ),
        Conflict => (
            "CONFLICT",
            "A competing file revision was preserved for recovery.",
        ),
        Io => ("SCENE_ERROR", GENERIC_ERROR),
    };
    CoreResponse::failure(request_id, code, message)
}

fn source_failure(request_id: String, error: source::SourceError) -> CoreResponse {
    use source::SourceError::*;
    let (code, message) = match error {
        InvalidPayload => ("INVALID_PAYLOAD", "The Source request is invalid."),
        UnknownFile => ("UNKNOWN_SOURCE", "The selected project source is unavailable."),
        InvalidUtf8 => ("INVALID_UTF8", "Invalid UTF-8 source is preserved read-only."),
        Oversize => ("SOURCE_TOO_LARGE", "Editable source is limited to 16 MiB."),
        DraftLimit => (
            "DRAFT_LIMIT",
            "The project has reached the 64-draft or 64 MiB draft limit.",
        ),
        InvalidSource => (
            "INVALID_SOURCE",
            "The draft is incomplete or cannot be reconciled safely.",
        ),
        UnsupportedMappedDefinition => (
            "MAPPED_DEFINITION",
            "Mapped Character and Variable definitions must be changed in their authoring workspace.",
        ),
        SourceConflict => (
            "SOURCE_CONFLICT",
            "The accepted source changed outside Loomlight. Both versions were retained.",
        ),
        DirtySource => (
            "DIRTY_SOURCE",
            "Unaccepted Source drafts must be saved or discarded first.",
        ),
        RecoveryRequired => (
            "RECOVERY_REQUIRED",
            "Project recovery must be resolved before source can be accepted.",
        ),
        HistoryBoundary => (
            "HISTORY_BOUNDARY",
            "Undo or redo stopped at a source revision boundary.",
        ),
        Io => ("SOURCE_ERROR", GENERIC_ERROR),
    };
    CoreResponse::failure(request_id, code, message)
}

fn authoring_failure(request_id: String, error: authoring::AuthoringError) -> CoreResponse {
    use authoring::AuthoringError::*;
    let (code, message) = match error {
        NoOpenProject => ("NO_OPEN_PROJECT", "Open a Loomlight project first."),
        RecoveryRequired => (
            "RECOVERY_REQUIRED",
            "Project recovery must be resolved before authoring can continue.",
        ),
        InvalidPayload | InvalidIdentifier | InvalidColor | InvalidValue => {
            ("INVALID_PAYLOAD", "The authoring value is invalid.")
        }
        ReservedIdentifier => ("RESERVED_IDENTIFIER", "That technical name is reserved."),
        SymbolCollision => ("SYMBOL_COLLISION", "That technical name is already used."),
        UnknownEntity => (
            "UNKNOWN_ENTITY",
            "The selected authoring item is unavailable.",
        ),
        UnknownImport => ("UNKNOWN_IMPORT_AUTHORITY", "Choose the import file again."),
        UnsupportedFormat => (
            "UNSUPPORTED_FORMAT",
            "Choose a supported raster image or audio file.",
        ),
        OversizeImport => (
            "IMPORT_TOO_LARGE",
            "The selected file exceeds the 512 MiB import limit.",
        ),
        DuplicateContent => (
            "DUPLICATE_CONTENT",
            "Identical asset content is already imported.",
        ),
        PathCollision => (
            "PATH_COLLISION",
            "The deterministic project filename already exists.",
        ),
        DiscoveryCollision => (
            "DISCOVERY_NAME_COLLISION",
            "The Ren'Py discovery name is already used.",
        ),
        SourceConflict => (
            "SOURCE_CONFLICT",
            "The authoritative source changed; reload before editing.",
        ),
        DirtySource => (
            "DIRTY_SOURCE",
            "This source file has an unaccepted draft. Save or discard it first.",
        ),
        UnsupportedSource => (
            "UNSUPPORTED_SOURCE",
            "The mapped definition is ambiguous or unsupported.",
        ),
        CorruptMetadata | UnsupportedMetadata => (
            "INVALID_AUTHORING_METADATA",
            "The authoring metadata is invalid or unsupported.",
        ),
        MissingAuthoringMetadata => (
            "MISSING_AUTHORING_METADATA",
            "Authored project identity metadata is missing; source was left unchanged.",
        ),
        Io => ("LIFECYCLE_ERROR", GENERIC_ERROR),
    };
    CoreResponse::failure(request_id, code, message)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(operation: &str, payload: Value) -> Value {
        json!({
            "protocolVersion": PROTOCOL_VERSION,
            "requestId": "test-request-1",
            "operation": operation,
            "payload": payload
        })
    }

    fn response_json(response: CoreResponse) -> Value {
        serde_json::to_value(response).expect("response serializes")
    }

    #[test]
    fn allows_only_documented_health_and_version_operations() {
        for operation in ["system.health", "system.version"] {
            let response = response_json(handle_request(request(operation, json!({})), false));
            assert_eq!(response["ok"], true);
        }
        let response = response_json(handle_request(request("filesystem.read", json!({})), false));
        assert_eq!(response["ok"], false);
        assert_eq!(response["error"]["code"], "OPERATION_NOT_ALLOWED");
    }

    #[test]
    fn rejects_malformed_or_version_mismatched_envelopes() {
        for malformed in [
            json!(null),
            json!({}),
            json!({ "protocolVersion": 2, "requestId": "request", "operation": "system.health", "payload": {} }),
            json!({ "protocolVersion": 1, "requestId": "bad id", "operation": "system.health", "payload": {} }),
            json!({ "protocolVersion": 1, "requestId": "request", "operation": "system.health", "payload": {}, "extra": true }),
        ] {
            let response = response_json(handle_request(malformed, false));
            assert_eq!(response["ok"], false);
            assert_eq!(response["error"]["code"], "INVALID_REQUEST");
        }
    }

    #[test]
    fn validates_each_operation_payload_exactly() {
        for payload in [
            json!([]),
            json!({ "extra": true }),
            json!({ "sensitive": 7 }),
        ] {
            let response = response_json(handle_request(
                request("probe.redactedError", payload),
                false,
            ));
            assert_eq!(response["ok"], false);
            assert_eq!(response["error"]["code"], "INVALID_PAYLOAD");
        }
    }

    #[test]
    fn authoring_status_and_flush_require_an_exact_current_session_token() {
        let temp = tempfile::tempdir().unwrap();
        let mut lifecycle = LifecycleService::new(temp.path().join("state")).unwrap();
        for (operation, payload, expected) in [
            ("authoring.list", json!({}), "INVALID_PAYLOAD"),
            (
                "authoring.list",
                json!({ "sessionId": "stale" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "project.status",
                json!({ "sessionId": "stale" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "project.flush",
                json!({ "sessionId": "stale", "extra": true }),
                "INVALID_PAYLOAD",
            ),
            (
                "variable.create",
                json!({ "technicalName": "score", "variableType": "int", "defaultValue": "1" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "media.present",
                json!({ "sessionId": "stale", "assetId": uuid::Uuid::new_v4().to_string(), "purpose": "thumbnail" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "media.present",
                json!({ "sessionId": "stale", "assetId": uuid::Uuid::new_v4().to_string(), "purpose": "thumbnail", "path": "../outside" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "source.list",
                json!({ "sessionId": "stale" }),
                "STALE_PROJECT_SESSION",
            ),
            (
                "source.open",
                json!({ "sessionId": "stale", "path": "game/script.rpy" }),
                "STALE_PROJECT_SESSION",
            ),
        ] {
            let response = response_json(handle_application_request(
                request(operation, payload),
                false,
                &mut lifecycle,
            ));
            assert_eq!(response["ok"], false);
            assert_eq!(response["error"]["code"], expected);
        }
    }

    #[test]
    fn never_reflects_sensitive_input_in_errors() {
        let sensitive = "synthetic-secret-value /private/project";
        let response = response_json(handle_request(
            request("probe.redactedError", json!({ "sensitive": sensitive })),
            false,
        ));
        let serialized = response.to_string();
        assert_eq!(response["error"]["code"], "INTERNAL_ERROR");
        assert!(!serialized.contains(sensitive));
        assert!(!serialized.contains("/private/project"));
    }

    #[test]
    fn smoke_report_is_environment_gated_and_schema_checked() {
        let payload = json!({
            "ambientFilesystemDenied": true,
            "ambientHttpDenied": true,
            "ambientProcessDenied": true,
            "malformedPayloadDenied": true,
            "networkDenied": true,
            "nodeGlobalsDenied": true,
            "popupRequestIssued": true,
            "rendererSecretsAbsent": true,
            "sceneAuthoringStage": "complete",
            "sceneAuthoringUiPassed": true,
            "sourceAuthoringStage": "complete",
            "sourceAuthoringUiPassed": true,
            "sourceCommandTrace": "button:source:completed|keyboard-synthetic:source:completed",
            "sourceCommandTracePassed": true,
            "supportingAuthoringStage": "complete",
            "supportingAuthoringUiPassed": true,
            "welcomeLifecycleVisible": true,
            "newProjectWizardVisible": true,
            "unknownCommandDenied": true,
            "unauthorisedWindowDenied": true
        });
        assert_eq!(
            response_json(handle_request(
                request("probe.smokeReport", payload.clone()),
                false
            ))["ok"],
            false
        );
        assert_eq!(
            response_json(handle_request(request("probe.smokeReport", payload), true))["ok"],
            true
        );
    }

    #[test]
    fn configuration_has_one_narrow_main_window_capability() {
        let config = include_str!("../../src-tauri/tauri.conf.json");
        let capability = include_str!("../../src-tauri/capabilities/main.json");
        let permission = include_str!("../../src-tauri/permissions/core-request.toml");
        let build = include_str!("../../src-tauri/build.rs");
        assert!(config.contains("connect-src ipc: http://ipc.localhost"));
        assert!(config.contains("frame-src 'none'"));
        assert!(config.contains("object-src 'none'"));
        assert!(config.contains("base-uri 'none'"));
        assert!(config.contains("form-action 'none'"));
        assert!(config.contains("\"capabilities\": [\"main-local-only\"]"));
        assert!(capability.contains("\"webviews\": [\"main\"]"));
        assert!(!capability.contains("\"windows\""));
        assert!(capability.contains("allow-loomlight-core"));
        assert!(permission.contains("commands.allow = [\"core_request\"]"));
        assert!(build.contains("commands(&[\"core_request\"])"));
        for forbidden in ["shell:", "fs:", "http:", "opener:", "process:"] {
            assert!(!capability.contains(forbidden));
        }
    }

    #[test]
    fn ports_expose_only_phase_specific_authority() {
        let ports = include_str!("ports.rs");
        assert!(ports.contains("trait SourceTransactionPort"));
        assert!(ports.contains("fn commit("));
        assert!(ports.contains("fn flush("));
        assert!(ports.contains("fn recover("));
        for marker in [
            "pub trait CredentialPort {}",
            "pub trait NetworkProviderPort {}",
        ] {
            assert!(ports.contains(marker));
        }
        assert!(ports.contains("fn validate_destination("));
        assert!(ports.contains("fn install_supported("));
        assert!(ports.contains("fn initialise_new_repository("));
        assert!(!ports.contains("status("));
        assert!(!ports.contains("diff("));
        assert!(!ports.contains("Command"));
        assert!(!ports.contains("Url"));
    }
}
