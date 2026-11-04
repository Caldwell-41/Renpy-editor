//! Shared data contracts for bounded screen actions and inert variable samples.
//! Source writers validate values against the existing authoring variable type.
use crate::metadata::ScreenTargetBinding;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// The sequence order is the runtime order. Finish interaction must be last.
#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum ScreenAction {
    #[serde(rename_all = "camelCase")]
    SetVariable {
        variable_id: String,
        value: Value,
    },
    #[serde(rename_all = "camelCase")]
    ShowScreen {
        target: ScreenTargetBinding,
    },
    #[serde(rename_all = "camelCase")]
    HideScreen {
        target: ScreenTargetBinding,
    },
    FinishInteraction,
}

/// A text binding names an existing variable by stable ID, never an expression.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct VariableBinding {
    pub variable_id: String,
}

/// Samples are not source edits or runtime assignments. The revision binds the
/// selected variable definition; stale or incompatible samples must be retained.
#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct VariableSample {
    pub variable_id: String,
    pub expected_source_revision: String,
    pub value: Value,
}
