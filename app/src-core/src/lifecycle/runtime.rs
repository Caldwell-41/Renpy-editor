//! Explicit runtime preparation and session consent. No opening/editing path executes SDK code.
use super::*;
use crate::{
    renpy::runtime::{RuntimeKind, RuntimeProcess},
    transaction::{
        self, CommitOutcome, DirectoryAnchor, ExecutionGate, ExecutionManifest, FileMutation,
        MutationKind, RelativePath, Revision, TransactionIntent, TransactionProposal,
    },
};
use serde_json::{json, Value};
use std::sync::Arc;

pub(crate) const POLICY_PATH: &str = "game/loomlight_runtime.rpy";
pub(crate) const POLICY: &[u8] =
    br#"# Loomlight controlled play policy v1. Active only for an explicit editor Run.
init 999 python:
    import os as _loomlight_os
    if _loomlight_os.environ.get("LOOMLIGHT_CONTROLLED_PLAY") == "1":
        config.developer = False
        config.console = False
        config.autoreload = False
        renpy.set_autoreload(False)
        def _loomlight_ready():
            print("LOOMLIGHT_RUNTIME_READY_V1", flush=True)
        config.display_start_callbacks.append(_loomlight_ready)
"#;

#[derive(Debug)]
pub enum RuntimeError {
    Busy,
    InvalidPayload,
    Stale,
    TrustRequired,
    PolicyRequired,
    UnsafeInputs,
    Failed,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PrepareRequest {
    pub kind: RuntimeKind,
    pub revision_choice: RevisionChoice,
    pub sdk_id: String,
}
#[derive(Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum RevisionChoice {
    SaveAll,
    Saved,
    Cancel,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PreparationRequest {
    pub preparation_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StartRequest {
    pub preparation_id: String,
    pub trust_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OperationRequest {
    pub operation_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StatusRequest {
    pub operation_id: String,
    pub after_sequence: usize,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TrustRequest {
    pub trust_id: String,
}

struct Preparation {
    id: String,
    kind: RuntimeKind,
    anchor: DirectoryAnchor,
    sdk: ValidatedSdk,
    sdk_anchor: DirectoryAnchor,
    sdk_manifest: ExecutionManifest,
    manifest: ExecutionManifest,
    gate: Option<Arc<ExecutionGate>>,
}
impl Drop for Preparation {
    fn drop(&mut self) {
        if let Some(gate) = &self.gate {
            gate.finish();
        }
    }
}
pub(super) struct Trust {
    id: String,
    sdk: ValidatedSdk,
    sdk_manifest: ExecutionManifest,
}
#[derive(Default)]
pub(super) struct RuntimeState {
    preparation: Option<Preparation>,
    pub(super) trust: Option<Trust>,
    pub(super) process: Option<RuntimeProcess>,
}
impl RuntimeState {
    pub(super) fn busy(&self) -> bool {
        self.preparation.is_some() || self.process.as_ref().is_some_and(RuntimeProcess::active)
    }
}
fn err(error: RuntimeError) -> LifecycleError {
    LifecycleError::Runtime(error)
}
fn input_error(_: impl std::fmt::Debug) -> LifecycleError {
    err(RuntimeError::UnsafeInputs)
}

impl LifecycleService {
    pub fn runtime_shutdown(&mut self) {
        self.runtime.preparation = None;
        self.runtime.trust = None;
        self.runtime.process = None;
    }
    pub fn runtime_cancel_preparation(
        &mut self,
        request: PreparationRequest,
    ) -> Result<Value, LifecycleError> {
        if self
            .runtime
            .preparation
            .as_ref()
            .is_none_or(|p| p.id != request.preparation_id)
        {
            return Err(err(RuntimeError::Stale));
        }
        self.runtime.preparation = None;
        Ok(json!({"cancelled": true}))
    }
    pub fn runtime_install_policy(&mut self) -> Result<Value, LifecycleError> {
        if self.runtime.busy() {
            return Err(err(RuntimeError::Busy));
        }
        let (authority, _) = self.authoring_context()?;
        let transactions = &self.authoring.transactions;
        let path = RelativePath::new(POLICY_PATH).map_err(input_error)?;
        if let Ok((bytes, _)) = transactions.snapshot(&authority, path.clone()) {
            if bytes == POLICY {
                return Ok(json!({"installed": true, "changed": false}));
            }
            return Err(err(RuntimeError::PolicyRequired)); // Never overwrite a user's script.
        }
        let outcome = transactions.commit(
            &authority,
            TransactionProposal {
                intent: TransactionIntent::Edit,
                mutations: vec![FileMutation {
                    path,
                    kind: MutationKind::CreateNew,
                    base: Revision::expected_absence(),
                    expected_bytes: vec![],
                    proposed: POLICY.to_vec(),
                }],
            },
        );
        if !matches!(outcome, CommitOutcome::Committed { .. }) {
            return Err(err(RuntimeError::Failed));
        }
        Ok(json!({"installed": true, "changed": true}))
    }
    pub fn runtime_prepare(&mut self, request: PrepareRequest) -> Result<Value, LifecycleError> {
        if request.revision_choice == RevisionChoice::Cancel {
            if self.runtime.preparation.is_some() {
                return Err(err(RuntimeError::Busy));
            }
            return Ok(json!({"cancelled": true}));
        }
        if self.runtime.busy() {
            return Err(err(RuntimeError::Busy));
        }
        let (authority, _) = self.authoring_context()?;
        if request.revision_choice == RevisionChoice::SaveAll {
            self.source_save_all()?;
        }
        let inventory = self.source_inventory()?;
        if inventory.files.iter().any(|file| {
            matches!(
                file.state,
                crate::source::SourceFileState::Conflict
                    | crate::source::SourceFileState::Unavailable
            )
        }) {
            return Err(LifecycleError::Source(SourceError::SourceConflict));
        }
        let sdk = self
            .sdks
            .get(&request.sdk_id)
            .ok_or(LifecycleError::UnknownAuthority)?
            .clone();
        if self
            .current()
            .is_none_or(|project| project.sdk_version != sdk.version)
        {
            return Err(LifecycleError::UnsupportedSdk);
        }
        sdk.revalidate(false).map_err(input_error)?;
        let gate = self
            .authoring
            .transactions
            .reserve_execution(&authority)
            .map_err(input_error)?;
        let result = (|| {
            let (anchor, manifest) = self
                .authoring
                .transactions
                .execution_snapshot(&authority)
                .map_err(input_error)?;
            if request.kind == RuntimeKind::Run {
                let (bytes, _) = self
                    .authoring
                    .transactions
                    .snapshot(&authority, RelativePath::new(POLICY_PATH).unwrap())
                    .map_err(|_| err(RuntimeError::PolicyRequired))?;
                if bytes != POLICY {
                    return Err(err(RuntimeError::PolicyRequired));
                }
            }
            let sdk_anchor = DirectoryAnchor::open_root(&sdk.root).map_err(input_error)?;
            let sdk_manifest =
                transaction::execution_manifest(&sdk_anchor, false).map_err(input_error)?;
            let trust_current = self.runtime.trust.as_ref().is_some_and(|trust| {
                trust.sdk.same_identity(&sdk)
                    && trust.sdk_manifest == sdk_manifest
                    && self
                        .authoring
                        .transactions
                        .execution_consent_matches(&authority, &manifest)
            });
            if !trust_current {
                self.runtime.trust = None;
            }
            let preparation = Preparation {
                id: uuid::Uuid::new_v4().to_string(),
                kind: request.kind,
                anchor,
                sdk,
                sdk_anchor,
                sdk_manifest,
                manifest,
                gate: Some(gate.clone()),
            };
            let response = json!({"preparationId": preparation.id, "kind": preparation.kind, "savedRevision": manifest_digest(&preparation.manifest), "draftCount": inventory.dirty_count,
                "projectPath": preparation.anchor.path(), "sdkPath": preparation.sdk.root, "sdkVersion": preparation.sdk.version,
                "sdkRevision": manifest_digest(&preparation.sdk_manifest), "inputs": preparation.manifest.keys().collect::<Vec<_>>(),
                "trustId": self.runtime.trust.as_ref().map(|trust| &trust.id),
                "trustNotice": "Compile, lint and play execute project Python with your account's permissions. Trust is session-scoped, not a sandbox. Controlled play disables developer tools and reload; Stop then Run executes saved edits."});
            self.runtime.preparation = Some(preparation);
            Ok(response)
        })();
        if result.is_err() {
            gate.finish();
            self.runtime.trust = None;
        }
        result
    }
    fn runtime_require_preparation(&self, id: &str) -> Result<(), LifecycleError> {
        if self.runtime.preparation.as_ref().is_none_or(|p| p.id != id) {
            return Err(err(RuntimeError::Stale));
        }
        Ok(())
    }
    fn runtime_recheck(&self, id: &str) -> Result<(), LifecycleError> {
        let preparation = self
            .runtime
            .preparation
            .as_ref()
            .filter(|p| p.id == id)
            .ok_or_else(|| err(RuntimeError::Stale))?;
        preparation.anchor.validate_chain().map_err(input_error)?;
        preparation
            .sdk_anchor
            .validate_chain()
            .map_err(input_error)?;
        preparation.sdk.revalidate(false).map_err(input_error)?;
        let (authority, _) = self.authoring_context()?;
        if self
            .authoring
            .transactions
            .execution_snapshot(&authority)
            .map_err(input_error)?
            .1
            != preparation.manifest
            || transaction::execution_manifest(&preparation.sdk_anchor, false)
                .map_err(input_error)?
                != preparation.sdk_manifest
        {
            return Err(err(RuntimeError::Stale));
        }
        Ok(())
    }
    pub fn runtime_grant_trust(
        &mut self,
        request: PreparationRequest,
    ) -> Result<Value, LifecycleError> {
        self.runtime_require_preparation(&request.preparation_id)?;
        if let Err(error) = self.runtime_recheck(&request.preparation_id) {
            self.runtime.preparation = None;
            self.runtime.trust = None;
            return Err(error);
        }
        let p = self.runtime.preparation.as_ref().unwrap();
        let trust = Trust {
            id: uuid::Uuid::new_v4().to_string(),
            sdk: p.sdk.clone(),
            sdk_manifest: p.sdk_manifest.clone(),
        };
        let (authority, _) = self.authoring_context()?;
        self.authoring
            .transactions
            .remember_execution_consent(&authority, p.manifest.clone());
        let result = json!({"trustId": trust.id, "sessionScoped": true});
        self.runtime.trust = Some(trust);
        Ok(result)
    }
    pub fn runtime_start(&mut self, request: StartRequest) -> Result<Value, LifecycleError> {
        if self
            .runtime
            .trust
            .as_ref()
            .is_none_or(|t| t.id != request.trust_id)
        {
            return Err(err(RuntimeError::TrustRequired));
        }
        self.runtime_require_preparation(&request.preparation_id)?;
        if let Err(error) = self.runtime_recheck(&request.preparation_id) {
            self.runtime.preparation = None;
            self.runtime.trust = None;
            return Err(error);
        }
        let mut p = self.runtime.preparation.take().unwrap();
        let gate = p.gate.take().unwrap();
        let process = match RuntimeProcess::start(
            p.sdk.clone(),
            p.anchor.clone(),
            p.kind,
            gate.clone(),
            p.manifest.clone(),
        ) {
            Ok(process) => process,
            Err(_) => {
                gate.finish();
                return Err(err(RuntimeError::Failed));
            }
        };
        let result =
            serde_json::to_value(process.status(0).map_err(input_error)?).map_err(input_error)?;
        self.runtime.process = Some(process);
        Ok(result)
    }
    pub fn runtime_stop(&mut self, request: OperationRequest) -> Result<Value, LifecycleError> {
        let process = self
            .runtime
            .process
            .as_ref()
            .filter(|p| p.id == request.operation_id)
            .ok_or_else(|| err(RuntimeError::Stale))?;
        process.stop();
        serde_json::to_value(process.status(0).map_err(input_error)?).map_err(input_error)
    }
    pub fn runtime_status(&self, request: StatusRequest) -> Result<Value, LifecycleError> {
        let process = self
            .runtime
            .process
            .as_ref()
            .filter(|p| p.id == request.operation_id)
            .ok_or_else(|| err(RuntimeError::Stale))?;
        serde_json::to_value(
            process
                .status(request.after_sequence)
                .map_err(|_| err(RuntimeError::InvalidPayload))?,
        )
        .map_err(input_error)
    }
    pub fn runtime_revoke_trust(&mut self, request: TrustRequest) -> Result<Value, LifecycleError> {
        if self
            .runtime
            .trust
            .as_ref()
            .is_none_or(|t| t.id != request.trust_id)
        {
            return Err(err(RuntimeError::Stale));
        }
        self.runtime.trust = None;
        self.runtime.preparation = None;
        if let Some(process) = &self.runtime.process {
            process.stop();
        }
        Ok(json!({"revoked": true, "cleanupPending": self.runtime.busy()}))
    }
}
fn manifest_digest(manifest: &ExecutionManifest) -> String {
    use sha2::{Digest, Sha256};
    format!(
        "{:x}",
        Sha256::digest(serde_json::to_vec(manifest).unwrap_or_default())
    )
}
