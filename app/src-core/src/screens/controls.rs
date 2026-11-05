//! Shared contracts for integer bars and typed image-button appearances.
//! These values are data; source expressions and actions are never evaluated here.
use serde::{Deserialize, Serialize};

/// Bounds use canonical decimal strings, like existing integer authoring values.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct IntegerBarBinding {
    pub variable_id: String,
    pub minimum: String,
    pub maximum: String,
}

/// Optional literal colors map to left_bar, right_bar and thumb respectively.
/// Null restores the corresponding Ren'Py default, rather than a stored sample.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BarAppearance {
    pub left_bar: Option<String>,
    pub right_bar: Option<String>,
    pub thumb: Option<String>,
}

/// All asset uses are checked against a captured content hash by the existing owner.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ControlImageReference {
    pub asset_id: String,
    pub expected_asset_sha256: String,
    #[serde(default)]
    pub replacement_sha256: Option<String>,
}

/// Normal maps to idle, selected to selected_idle, and disabled to insensitive.
/// Absent optional appearances use Ren'Py's native fallback rules.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImageButtonAppearances {
    pub normal: ControlImageReference,
    pub hover: Option<ControlImageReference>,
    pub selected: Option<ControlImageReference>,
    pub selected_hover: Option<ControlImageReference>,
    pub disabled: Option<ControlImageReference>,
    pub selected_disabled: Option<ControlImageReference>,
}

/// A canvas draft identifies one existing node or one qualified insertion parent.
/// Request validation must reject missing, competing or misplaced target fields.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BarDraft {
    pub node_start: Option<usize>,
    pub parent_start: Option<usize>,
    pub binding: IntegerBarBinding,
    pub appearance: BarAppearance,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImageButtonDraft {
    pub node_start: Option<usize>,
    pub parent_start: Option<usize>,
    pub appearances: ImageButtonAppearances,
    pub width: u32,
    pub height: u32,
}

/// Sample state is rendering data, never an action or a persisted runtime flag.
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ControlButtonState {
    #[default]
    Normal,
    Hover,
    Selected,
    SelectedHover,
    Disabled,
    SelectedDisabled,
}
