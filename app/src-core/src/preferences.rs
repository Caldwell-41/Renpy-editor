//! Device-local UI preferences. Never stored in or applied to game source.
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Preferences {
    pub schema_version: u32,
    pub theme: Theme,
    pub density: Density,
    pub source_font_size: u16,
    pub remember_layout: bool,
    pub layouts: BTreeMap<String, Layout>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Theme {
    System,
    Light,
    Dark,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Density {
    Small,
    Default,
    Large,
}
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Layout {
    pub navigation_collapsed: bool,
    pub tree_collapsed: bool,
    pub inspector_open: bool,
    pub preview_percent: Option<u16>,
    pub tree_width: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_selection: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_topic: Option<String>,
    pub graph: Option<GraphView>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub screen_selection: Option<ScreenSelection>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ScreenSelection {
    pub screen_id: String,
    pub element_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_revision: Option<String>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct GraphView {
    pub zoom: f64,
    pub x: f64,
    pub y: f64,
}
impl Default for Preferences {
    fn default() -> Self {
        Self {
            schema_version: 1,
            theme: Theme::System,
            density: Density::Default,
            source_font_size: 14,
            remember_layout: true,
            layouts: BTreeMap::new(),
        }
    }
}
impl Preferences {
    pub fn valid(&self) -> bool {
        self.schema_version == 1
            && (10..=24).contains(&self.source_font_size)
            && self.layouts.len() <= 64
            && self.layouts.iter().all(|(key, layout)| {
                !key.is_empty()
                    && key.len() <= 100
                    && key
                        .chars()
                        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | ':' | '_'))
                    && layout.tree_width.is_none_or(|v| (160..=400).contains(&v))
                    && layout
                        .reference_selection
                        .as_ref()
                        .is_none_or(|v| v.len() <= 160 && !v.chars().any(char::is_control))
                    && layout
                        .reference_topic
                        .as_ref()
                        .is_none_or(|v| v.len() <= 64 && !v.chars().any(char::is_control))
                    && layout.graph.as_ref().is_none_or(|g| {
                        g.zoom.is_finite()
                            && (0.05..=2.0).contains(&g.zoom)
                            && g.x.is_finite()
                            && g.x.abs() <= 100000.0
                            && g.y.is_finite()
                            && g.y.abs() <= 100000.0
                    })
                    && layout
                        .preview_percent
                        .is_none_or(|v| (20..=70).contains(&v))
                    && layout.screen_selection.as_ref().is_none_or(|s| {
                        uuid::Uuid::parse_str(&s.screen_id).is_ok()
                            && s.source_revision.as_ref().is_none_or(|revision| {
                                revision.len() == 64
                                    && revision.bytes().all(|b| b.is_ascii_hexdigit())
                            })
                            && (uuid::Uuid::parse_str(&s.element_id).is_ok()
                                || s.element_id.strip_prefix("source-").is_some_and(|id| {
                                    id.len() == 64 && id.bytes().all(|b| b.is_ascii_hexdigit())
                                })
                                || s.element_id
                                    .strip_prefix("source-at-")
                                    .is_some_and(|offset| {
                                        s.source_revision.is_some()
                                            && offset
                                                .parse::<usize>()
                                                .is_ok_and(|n| n <= 16 * 1024 * 1024)
                                    }))
                    })
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preferences_reject_unbounded_or_future_values() {
        let mut p = Preferences::default();
        assert!(p.valid());
        p.source_font_size = 100;
        assert!(!p.valid());
        p.source_font_size = 14;
        p.layouts.insert(
            "project:story".into(),
            Layout {
                preview_percent: Some(1),
                ..Layout::default()
            },
        );
        assert!(!p.valid());
        p.layouts.clear();
        p.schema_version = 2;
        assert!(!p.valid());
        assert!(serde_json::from_str::<Preferences>(r#"{"theme":"unknown"}"#).is_err());
    }

    #[test]
    fn source_offset_selection_roundtrips_only_with_a_bounded_revision() {
        let mut preferences = Preferences::default();
        let selection = serde_json::json!({"screenId":"c77b865e-a6cf-434a-8ecb-02e1c4582de4",
            "elementId":"source-at-82", "sourceRevision":"a".repeat(64)});
        preferences.layouts.insert(
            "screen-fixture".into(),
            Layout {
                screen_selection: Some(serde_json::from_value(selection.clone()).unwrap()),
                ..Layout::default()
            },
        );
        assert!(preferences.valid());
        let decoded: Preferences =
            serde_json::from_slice(&serde_json::to_vec(&preferences).unwrap()).unwrap();
        assert!(decoded.valid());
        let selected = preferences
            .layouts
            .get_mut("screen-fixture")
            .unwrap()
            .screen_selection
            .as_mut()
            .unwrap();
        selected.source_revision = None;
        assert!(!preferences.valid());
    }
}
