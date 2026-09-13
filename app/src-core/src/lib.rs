pub mod ports;

use serde::Serialize;
use serde_json::{json, Map, Value};

pub const PROTOCOL_VERSION: u64 = 1;
pub const OPERATIONS: &[&str] = &[
    "system.health",
    "system.version",
    "probe.denied",
    "probe.redactedError",
    "probe.smokeReport",
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
    fn success(request_id: String, value: Value) -> Self {
        Self {
            protocol_version: PROTOCOL_VERSION,
            request_id,
            ok: true,
            value: Some(value),
            error: None,
        }
    }

    fn failure(request_id: String, code: &'static str, message: &'static str) -> Self {
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

fn empty_payload(payload: &Map<String, Value>) -> bool {
    payload.is_empty()
}

fn smoke_payload(payload: &Map<String, Value>) -> bool {
    const KEYS: &[&str] = &[
        "ambientFilesystemDenied",
        "ambientHttpDenied",
        "ambientProcessDenied",
        "malformedPayloadDenied",
        "networkDenied",
        "nodeGlobalsDenied",
        "popupRequestIssued",
        "rendererSecretsAbsent",
        "unknownCommandDenied",
        "unauthorisedWindowDenied",
    ];
    has_exact_keys(payload, KEYS)
        && KEYS
            .iter()
            .all(|key| payload.get(*key).and_then(Value::as_bool) == Some(true))
}

pub fn handle_request(request: Value, smoke_enabled: bool) -> CoreResponse {
    let request_id = request_id_or_placeholder(&request);
    let Some(root) = object(&request) else {
        return CoreResponse::failure(request_id, "INVALID_REQUEST", "Request must be an object.");
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
        return CoreResponse::failure(
            request_id,
            "INVALID_REQUEST",
            "Request envelope is invalid.",
        );
    }
    let Some(operation) = root.get("operation").and_then(Value::as_str) else {
        return CoreResponse::failure(
            request_id,
            "INVALID_REQUEST",
            "Request envelope is invalid.",
        );
    };
    let Some(payload) = root.get("payload").and_then(Value::as_object) else {
        return CoreResponse::failure(request_id, "INVALID_PAYLOAD", "Payload must be an object.");
    };

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
    fn future_ports_are_authority_free_markers() {
        let ports = include_str!("ports.rs");
        assert!(!ports.contains("fn "));
        assert!(!ports.contains("Path"));
        assert!(!ports.contains("Command"));
        assert!(!ports.contains("Url"));
    }
}
