//! Capability-checked Unsloth Studio inventory and generation-time readiness.
//! Only an explicitly initiated generation may reach the local GGUF load path.
//! Contract verified against official v0.1.902-beta commit
//! 1b588389b488eb9f8a9cb8ad5ca3073c7661f073 and v0.1.907-beta commit
//! 133a8076d10aa109f812f85a953636b3488926f6: cache resolver, load/status,
//! and request/response schema. Runtime version is diagnostic, never admission.
use crate::{
    ai_discovery::strict_json,
    ai_profiles::StudioSettings,
    ai_request::{Cancel, Failure, Result},
    studio_config::{self, Known, Requested},
};
use serde::Serialize;
use serde_json::{json, Value};

pub const MAX_MODEL_RESPONSE: usize = 128 * 1024;

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
    pub effective: Known,
    pub warnings: Vec<String>,
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
    yours: Option<bool>,
    effective: Known,
    quant: Option<String>,
    serving: Option<(Vec<String>, Vec<String>)>,
}
impl Status {
    fn parse(value: &Value) -> Result<Self> {
        let optional = |key: &str| -> Result<Option<String>> {
            match value.get(key) {
                None | Some(Value::Null) => Ok(None),
                Some(v) => Ok(Some(text(v).ok_or(Failure::ModelUnsupported)?.into())),
            }
        };
        let yours = match value.get("yours") {
            None | Some(Value::Null) => None,
            Some(v) => Some(v.as_bool().ok_or(Failure::ModelUnsupported)?),
        };
        let serving = match (value.get("serving"), value.get("serving_checkpoints")) {
            (None, None) => None,
            (Some(names), Some(checkpoints)) => {
                let names = strings(names)?
                    .into_iter()
                    .map(str::to_owned)
                    .collect::<Vec<_>>();
                let checkpoints = strings(checkpoints)?
                    .into_iter()
                    .map(str::to_owned)
                    .collect::<Vec<_>>();
                if names.len() != checkpoints.len() {
                    return Err(Failure::ModelUnsupported);
                }
                Some((names, checkpoints))
            }
            _ => return Err(Failure::ModelUnsupported),
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
            yours,
            effective: studio_config::known_effective(value),
            quant: value
                .get("gguf_variant")
                .and_then(Value::as_str)
                .map(str::to_owned),
            serving,
        })
    }
    fn identity(&self, model: &str, path: Option<&str>) -> Result<bool> {
        if self.yours == Some(false) {
            return Err(Failure::ModelConflict);
        }
        if self.loading {
            return Err(Failure::ModelNotReady);
        }
        let pin = model.rsplit_once(':').filter(|(_, quant)| {
            self.quant
                .as_deref()
                .is_some_and(|actual| actual.eq_ignore_ascii_case(quant))
        });
        let matches =
            |id: &str| id == model || path == Some(id) || pin.is_some_and(|(repo, _)| id == repo);
        let active = self.active.as_deref().is_some_and(matches)
            || self.identifier.as_deref().is_some_and(matches);
        if active {
            if let Some((names, checkpoints)) = &self.serving {
                if names.len() != 1
                    || names.first().map(String::as_str) != self.active.as_deref()
                    || checkpoints.first().map(String::as_str)
                        != self.identifier.as_deref().or(self.active.as_deref())
                {
                    return Err(Failure::ModelConflict);
                }
            }
            if !self.loaded.iter().any(|id| {
                matches(id)
                    || self.active.as_deref() == Some(id)
                    || self.identifier.as_deref() == Some(id)
            }) {
                return Err(Failure::ModelNotReady);
            }
            return Ok(true);
        }
        if self.active.is_some()
            || self.identifier.is_some()
            || !self.loaded.is_empty()
            || self
                .serving
                .as_ref()
                .is_some_and(|(names, _)| !names.is_empty())
        {
            return Err(Failure::ModelConflict);
        }
        Ok(false)
    }
    fn ready(
        &self,
        model: &str,
        path: Option<&str>,
        requested: u32,
        loaded_for_request: bool,
    ) -> Result<Option<Readiness>> {
        if !self.identity(model, path)? {
            return Ok(None);
        }
        let actual = self.context.ok_or(Failure::ModelCapacity)?;
        Ok(Some(Readiness {
            requested_context: requested,
            actual_context: actual,
            loaded_for_request,
            effective: self.effective.clone(),
            warnings: if actual != requested {
                vec!["Effective context length differs from requested; the actual request must fit the loaded capacity.".into()]
            } else {
                Vec::new()
            },
        }))
    }
}

pub(crate) fn configuration_status(value: &Value, model: &str) -> Result<(bool, Option<Known>)> {
    let status = Status::parse(value)?;
    let selected = status.identity(model, None).unwrap_or(false);
    Ok((status.loading, selected.then_some(status.effective)))
}
pub(crate) fn repo_id(id: &str) -> bool {
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
pub(crate) fn query(value: &str) -> String {
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
pub(crate) fn cached_path(
    model: &str,
    quant: &str,
    mut exchange: impl FnMut(&str, Option<&Value>) -> Result<Value>,
) -> Result<String> {
    let cached = exchange("/api/models/cached-gguf", None)?;
    let rows = cached["cached"]
        .as_array()
        .filter(|r| r.len() <= 256)
        .ok_or(Failure::ModelUnsupported)?;
    let matching: Vec<_> = rows.iter().filter(|r| r["repo_id"] == model).collect();
    // `task` describes model capability, not an in-progress download. Ordinary
    // chat GGUFs advertise text-generation; older cache rows may omit it.
    if matching.len() != 1
        || !matches!(&matching[0]["partial"], Value::Null | Value::Bool(false))
        || (!matching[0]["task"].is_null() && matching[0]["task"] != "text-generation")
    {
        return Err(Failure::ModelUnavailable);
    }
    let location = exchange(
        &format!(
            "/api/models/cached-model-path?repo_id={}&variant={}",
            query(model),
            query(quant)
        ),
        None,
    )?;
    local_gguf(&location)
}

/// `exchange` uses the request's captured credential, destination, cancellation and deadline.
/// It never receives project content. A load HTTP 200 alone is not readiness.
pub fn ensure_ready(
    settings: &StudioSettings,
    cancel: &Cancel,
    mut stage: impl FnMut(&str),
    mut exchange: impl FnMut(&str, Option<&Value>) -> Result<Value>,
) -> Result<Readiness> {
    let model = settings.model.as_str();
    let requested = settings.context_budget;
    let add_warnings = |mut ready: Readiness| -> Readiness {
        if settings.model_load.is_some() {
            ready.warnings.extend(studio_config::warnings(
                &Requested::from_settings(settings),
                &ready.effective,
                "Effective",
            ));
            ready.warnings.push(studio_config::FIT_WARNING.into());
        }
        ready
    };
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
        return Ok(add_warnings(ready));
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
    let target = studio_config::target(model, &catalog)?;
    let path = cached_path(&target.repo, &target.quant, |path, body| {
        checked(exchange(path, body)?)
    })?;
    let (saved, legacy_unverified) = match exchange(&studio_config::query(&target, &path), None) {
        Ok(value) => (
            studio_config::resolved_in_scope(&checked(value)?, &target, &path)?.row,
            false,
        ),
        Err(Failure::ModelUnsupported) if settings.model_load.is_none() => (None, true),
        Err(Failure::ModelUnsupported) => return Err(Failure::ModelSettingsUnsupported),
        Err(error) => return Err(error),
    };
    let load_options =
        studio_config::load_args(saved.as_ref(), requested, settings.model_load.as_ref())?;
    // Recheck immediately before mutation. Unsloth Studio has no expected-empty CAS;
    // an idle external load racing this final observation cannot be made atomic here.
    let current = Status::parse(&checked(exchange("/api/inference/status", None)?)?)?;
    if let Some(ready) = current.ready(model, None, requested, false)? {
        return Ok(add_warnings(ready));
    }
    if cancel.cancelled() {
        return Err(Failure::Cancelled);
    }
    stage("loading_model");
    let mut body = json!({"model_path":path,"gguf_variant":target.quant,"max_seq_length":requested,"disable_vision":true,"speculative_type":"off","force_reload":false,"force_cancel_active":false,"trust_remote_code":false,"engine":"auto","alongside":false,"force_alongside":false});
    for (key, value) in load_options {
        body[&key] = value;
    }
    let loaded = checked(exchange("/api/inference/load", Some(&body))?)?;
    if loaded.get("_deferred_error").is_some()
        || loaded
            .get("evicted")
            .is_some_and(|v| v.as_array().is_none_or(|a| !a.is_empty()))
        || !matches!(loaded["status"].as_str(), Some("loaded" | "already_loaded"))
        || loaded["is_gguf"] != true
        || loaded["is_local_model"] != true
    {
        return Err(Failure::ModelLoad);
    }
    stage("checking_model");
    let status = Status::parse(&checked(exchange("/api/inference/status", None)?)?)?;
    let mut ready = add_warnings(
        status
            .ready(model, Some(&path), requested, true)?
            .ok_or(Failure::ModelNotReady)?,
    );
    if legacy_unverified {
        ready.warnings.push("Saved load settings could not be read; the legacy cached-load path was used without adding model-load defaults.".into());
    }
    Ok(ready)
}
