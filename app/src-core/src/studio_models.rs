//! Version-scoped Studio inventory and generation-time readiness.
//! Only an explicitly initiated generation may reach the local GGUF load path.
//! Interface pinned to Unsloth v0.1.902-beta, source commit
//! 1b588389b488eb9f8a9cb8ad5ca3073c7661f073: routes/models.py cache resolver,
//! routes/inference.py load/status, and models/inference.py request/response schema.
use crate::{
    ai_discovery::strict_json,
    ai_request::{Cancel, Failure, Result},
};
use serde::Serialize;
use serde_json::{json, Value};

pub const MAX_MODEL_RESPONSE: usize = 128 * 1024;
pub const SUPPORTED_LOAD_VERSION: &str = "v0.1.902-beta";

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: String,
    pub loaded: Option<bool>,
    pub actual_context: Option<u32>,
    pub quant: Option<String>,
}
#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Readiness {
    pub requested_context: u32,
    pub actual_context: u32,
    pub loaded_for_request: bool,
}
fn text(value: &Value) -> Option<&str> {
    value
        .as_str()
        .filter(|s| !s.is_empty() && s.len() <= 4096 && !s.chars().any(char::is_control))
}
fn capacity(value: &Value) -> Result<Option<u32>> {
    if value.is_null() {
        return Ok(None);
    }
    value
        .as_u64()
        .filter(|n| *n > 0 && *n <= u32::MAX.into())
        .map(|n| Some(n as u32))
        .ok_or(Failure::ModelUnsupported)
}
pub fn parse_inventory(bytes: &[u8]) -> Result<Vec<Model>> {
    if bytes.len() > MAX_MODEL_RESPONSE {
        return Err(Failure::Oversized);
    }
    let value = strict_json(bytes).map_err(|_| Failure::Malformed)?;
    let rows = value
        .get("data")
        .and_then(Value::as_array)
        .filter(|r| r.len() <= 256)
        .ok_or(Failure::ModelUnsupported)?;
    let mut models = Vec::<Model>::new();
    for row in rows {
        let id = text(&row["id"])
            .filter(|s| s.len() <= 256)
            .ok_or(Failure::ModelUnsupported)?;
        if models.iter().any(|m| m.id == id) {
            return Err(Failure::ModelUnsupported);
        }
        let loaded = match row.get("loaded") {
            None | Some(Value::Null) => None,
            Some(v) => Some(v.as_bool().ok_or(Failure::ModelUnsupported)?),
        };
        let quant = match row.get("quant") {
            None | Some(Value::Null) => None,
            Some(v) => Some(
                text(v)
                    .filter(|s| s.len() <= 128)
                    .ok_or(Failure::ModelUnsupported)?
                    .to_owned(),
            ),
        };
        models.push(Model {
            id: id.into(),
            loaded,
            actual_context: capacity(&row["context_length"])?,
            quant,
        });
    }
    Ok(models)
}
fn strings(value: &Value) -> Result<Vec<&str>> {
    value
        .as_array()
        .filter(|a| a.len() <= 256)
        .ok_or(Failure::ModelUnsupported)?
        .iter()
        .map(|v| text(v).ok_or(Failure::ModelUnsupported))
        .collect()
}
struct Status {
    active: Option<String>,
    identifier: Option<String>,
    loaded: Vec<String>,
    loading: bool,
    context: Option<u32>,
    installed: bool,
}
impl Status {
    fn parse(value: &Value) -> Result<Self> {
        let optional = |key: &str| -> Result<Option<String>> {
            match value.get(key) {
                None | Some(Value::Null) => Ok(None),
                Some(v) => Ok(Some(text(v).ok_or(Failure::ModelUnsupported)?.into())),
            }
        };
        Ok(Self {
            active: optional("active_model")?,
            identifier: optional("model_identifier")?,
            loaded: strings(&value["loaded"])?
                .into_iter()
                .map(str::to_owned)
                .collect(),
            loading: !strings(&value["loading"])?.is_empty(),
            context: capacity(&value["context_length"])?,
            installed: optional("llama_cpp_installed_tag")?.is_some(),
        })
    }
    fn ready(
        &self,
        model: &str,
        path: Option<&str>,
        requested: u32,
        loaded_for_request: bool,
    ) -> Result<Option<Readiness>> {
        if self.loading {
            return Err(Failure::ModelNotReady);
        }
        let matches = |id: &str| id == model || path == Some(id);
        let active = self.active.as_deref().is_some_and(matches)
            || self.identifier.as_deref().is_some_and(matches);
        if active {
            if !self.loaded.iter().any(|id| matches(id)
                || self.active.as_deref() == Some(id)
                || self.identifier.as_deref() == Some(id)) {
                return Err(Failure::ModelNotReady);
            }
            let actual = self.context.ok_or(Failure::ModelCapacity)?;
            if actual < requested {
                return Err(Failure::ModelContext);
            }
            return Ok(Some(Readiness {
                requested_context: requested,
                actual_context: actual,
                loaded_for_request,
            }));
        }
        if self.active.is_some() || self.identifier.is_some() || !self.loaded.is_empty() {
            return Err(Failure::ModelConflict);
        }
        Ok(None)
    }
}
fn repo_id(id: &str) -> bool {
    let parts: Vec<_> = id.split('/').collect();
    parts.len() == 2
        && parts.iter().all(|s| {
            !s.is_empty()
                && *s != "."
                && *s != ".."
                && s.bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
        })
}
fn query(value: &str) -> String {
    value
        .bytes()
        .map(|b| {
            if b.is_ascii_alphanumeric() || b"-._~".contains(&b) {
                (b as char).to_string()
            } else {
                format!("%{b:02X}")
            }
        })
        .collect()
}
fn local_gguf(value: &Value) -> Result<String> {
    if value["is_dir"] != false {
        return Err(Failure::ModelUnavailable);
    }
    let path = text(&value["path"]).ok_or(Failure::ModelUnavailable)?;
    // These paths come only from Studio's authenticated cache resolver, never IPC.
    let absolute = path.starts_with('/')
        || (path.as_bytes().get(1) == Some(&b':')
            && matches!(path.as_bytes().get(2), Some(b'\\' | b'/')));
    if !absolute || !path.to_ascii_lowercase().ends_with(".gguf") {
        return Err(Failure::ModelUnavailable);
    }
    Ok(path.into())
}
/// `exchange` uses the request's captured credential, destination, cancellation and deadline.
/// It never receives project content. A load HTTP 200 alone is not readiness.
pub fn ensure_ready(
    model: &str,
    requested: u32,
    cancel: &Cancel,
    mut stage: impl FnMut(&str),
    mut exchange: impl FnMut(&str, Option<&Value>) -> Result<Value>,
) -> Result<Readiness> {
    let checked = |value: Value| -> Result<Value> {
        if cancel.cancelled() {
            Err(Failure::Cancelled)
        } else {
            Ok(value)
        }
    };
    if cancel.cancelled() {
        return Err(Failure::Cancelled);
    }
    stage("checking_model");
    let status = Status::parse(&checked(exchange("/api/inference/status", None)?)?)?;
    if let Some(ready) = status.ready(model, None, requested, false)? {
        return Ok(ready);
    }
    if !status.installed || !repo_id(model) {
        return Err(Failure::ModelUnsupported);
    }
    let version = checked(exchange("/version", None)?)?;
    if version["version"] != SUPPORTED_LOAD_VERSION {
        return Err(Failure::ModelUnsupported);
    }
    let catalog = checked(exchange("/v1/models", None)?)?;
    let models = parse_inventory(&serde_json::to_vec(&catalog).map_err(|_| Failure::Malformed)?)?;
    let selected = models
        .iter()
        .find(|m| m.id == model)
        .ok_or(Failure::ModelUnavailable)?;
    if selected.loaded != Some(false) || models.iter().any(|m| m.loaded != Some(false)) {
        return Err(Failure::ModelConflict);
    }
    let quant = selected.quant.as_deref().ok_or(Failure::ModelUnavailable)?;
    let cached = checked(exchange("/api/models/cached-gguf", None)?)?;
    let rows = cached["cached"]
        .as_array()
        .filter(|r| r.len() <= 256)
        .ok_or(Failure::ModelUnsupported)?;
    let matching: Vec<_> = rows.iter().filter(|r| r["repo_id"] == model).collect();
    if matching.len() != 1
        || matching[0]["partial"].as_bool().unwrap_or(false)
        || !matching[0]["task"].is_null()
    {
        return Err(Failure::ModelUnavailable);
    }
    let location = checked(exchange(
        &format!(
            "/api/models/cached-model-path?repo_id={}&variant={}",
            query(model),
            query(quant)
        ),
        None,
    )?)?;
    let path = local_gguf(&location)?;
    // Recheck immediately before mutation. Studio v0.1.902 has no expected-empty CAS;
    // an idle external load racing this final observation cannot be made atomic here.
    let current = Status::parse(&checked(exchange("/api/inference/status", None)?)?)?;
    if let Some(ready) = current.ready(model, None, requested, false)? {
        return Ok(ready);
    }
    if cancel.cancelled() {
        return Err(Failure::Cancelled);
    }
    stage("loading_model");
    let loaded = checked(exchange(
        "/api/inference/load",
        Some(
            &json!({"model_path":path,"max_seq_length":requested,"disable_vision":true,"speculative_type":"off","llama_extra_args":[],"force_reload":false,"force_cancel_active":false,"trust_remote_code":false}),
        ),
    )?)?;
    if loaded.get("_deferred_error").is_some()
        || !matches!(loaded["status"].as_str(), Some("loaded" | "already_loaded"))
        || loaded["is_gguf"] != true
        || loaded["is_local_model"] != true
    {
        return Err(Failure::ModelLoad);
    }
    stage("checking_model");
    let status = Status::parse(&checked(exchange("/api/inference/status", None)?)?)?;
    status
        .ready(model, Some(&path), requested, true)
        .map_err(|failure| if failure == Failure::ModelContext { Failure::ModelLoadContext } else { failure })?
        .ok_or(Failure::ModelNotReady)
}
