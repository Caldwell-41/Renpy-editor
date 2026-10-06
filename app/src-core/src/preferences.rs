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
    pub graph: Option<GraphView>,
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
}
