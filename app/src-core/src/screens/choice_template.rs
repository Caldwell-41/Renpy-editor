//! Ren'Py 8.5.3 generated choice template, semantic-only derivative for #104.
//! Styling/canvas slots remain with #31/#55. No project Python is evaluated here.
pub(crate) const PATH: &str = "game/loomlight_choice_v1.rpy";
pub(crate) const ADAPTER: &str = "# Loomlight Choice availability adapter v1. Ren'Py 8.5.3.\nscreen _ll_choice_v1(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action sensitive i.kwargs.get(\"_ll_available\", True)\n";
const TEMPLATE: &str = "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n";

pub(crate) fn supported(source: &str) -> bool {
    let normalized = source.replace("\r\n", "\n");
    let Some(start) = normalized.find("screen choice(items):\n") else {
        return false;
    };
    let Ok(ranges) = crate::authoring::lexical_ranges(normalized.as_bytes(), true, true) else {
        return false;
    };
    if !ranges.iter().any(|(s, _)| *s == start) {
        return false;
    }
    let after = &normalized[start..];
    let Some(rest) = after.strip_prefix(TEMPLATE) else {
        return false;
    };
    // No extra child, screen property or dynamic action can be silently bypassed.
    rest.lines()
        .take_while(|line| line.is_empty() || line.starts_with(' ') || line.starts_with('#'))
        .all(|line| line.trim().is_empty() || line.starts_with('#'))
}
