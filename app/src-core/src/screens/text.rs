//! Text values and their exact literal spans. Expressions remain in source.
use super::*;
use crate::authoring::fonts::FontReference;
use serde_json::Value;
use std::collections::BTreeMap;

fn edit<'de, D: serde::Deserializer<'de>, T: Deserialize<'de>>(
    d: D,
) -> Result<Option<Option<T>>, D::Error> {
    Option::<T>::deserialize(d).map(Some)
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TextEdits {
    pub text: Option<String>,
    #[serde(default)]
    pub appearance: BTreeMap<String, Option<Value>>,
    #[serde(default, deserialize_with = "edit")]
    pub font: Option<Option<FontReference>>,
    #[serde(default, deserialize_with = "edit")]
    pub size: Option<Option<u32>>,
    #[serde(default, deserialize_with = "edit")]
    pub color: Option<Option<String>>,
    #[serde(default, deserialize_with = "edit")]
    pub align: Option<Option<f64>>,
    #[serde(default, deserialize_with = "edit")]
    pub bold: Option<Option<bool>>,
    #[serde(default, deserialize_with = "edit")]
    pub italic: Option<Option<bool>>,
}

pub(super) const FIELDS: &[&str] = &[
    "font",
    "size",
    "color",
    "align",
    "bold",
    "italic",
    "background",
    "border",
    "hover_font",
    "hover_size",
    "hover_color",
    "hover_align",
    "hover_bold",
    "hover_italic",
    "hover_background",
    "hover_border",
    "selected_font",
    "selected_size",
    "selected_color",
    "selected_align",
    "selected_bold",
    "selected_italic",
    "selected_background",
    "selected_border",
    "insensitive_font",
    "insensitive_size",
    "insensitive_color",
    "insensitive_align",
    "insensitive_bold",
    "insensitive_italic",
    "insensitive_background",
    "insensitive_border",
];
pub(super) fn base_key(key: &str) -> &str {
    for prefix in ["hover_", "selected_", "insensitive_"] {
        if let Some(base) = key.strip_prefix(prefix) {
            return base;
        }
    }
    key
}
pub(super) fn applicable(kind: &str, key: &str) -> bool {
    let base = base_key(key);
    match kind {
        "style" | "textbutton" => true,
        "frame" | "window" => key == base && matches!(base, "background" | "border"),
        "text" => !matches!(base, "background" | "border"),
        _ => false,
    }
}

/// Keep a single expression intact; trailing inline properties stay source-only.
pub(super) fn single_expression(raw: &str) -> bool {
    if raw.is_empty() {
        return false;
    }
    let mut stack = vec![];
    let mut quote = None;
    let mut escaped = false;
    for c in raw.chars() {
        if escaped {
            escaped = false;
            continue;
        }
        if quote.is_some() {
            if c == '\\' {
                escaped = true;
            } else if quote == Some(c) {
                quote = None;
            }
        } else if matches!(c, '\'' | '"') {
            quote = Some(c);
        } else if matches!(c, '(' | '[' | '{') {
            stack.push(c);
        } else if matches!(c, ')' | ']' | '}') {
            if stack.pop()
                != Some(match c {
                    ')' => '(',
                    ']' => '[',
                    _ => '{',
                })
            {
                return false;
            }
        } else if stack.is_empty() && (c.is_whitespace() || matches!(c, ':' | ';')) {
            return false;
        }
    }
    quote.is_none() && stack.is_empty()
}
pub(super) fn keyword(kind: &str, key: &str) -> String {
    let base = base_key(key);
    let state = &key[..key.len() - base.len()];
    let property = match base {
        "align" => "text_align",
        "border" => "foreground",
        _ => base,
    };
    format!(
        "{}{state}{property}",
        if kind == "textbutton" && !matches!(base, "background" | "border") {
            "text_"
        } else {
            ""
        }
    )
}
fn valid(key: &str, value: &Value) -> bool {
    match base_key(key) {
        "font" => value
            .as_str()
            .is_some_and(|s| RelativePath::new(format!("game/{s}")).is_ok()),
        "size" => value.as_u64().is_some_and(|v| (1..=512).contains(&v)),
        "color" | "background" => value.as_str().is_some_and(|s| {
            s.starts_with('#')
                && matches!(s.len(), 4 | 5 | 7 | 9)
                && s[1..].bytes().all(|b| b.is_ascii_hexdigit())
        }),
        "align" => value
            .as_f64()
            .is_some_and(|v| v.is_finite() && (0.0..=1.0).contains(&v)),
        "bold" | "italic" => value.is_boolean(),
        "border" => value.as_object().is_some_and(|v| {
            v.len() == 2
                && v.get("color").is_some_and(|c| valid("color", c))
                && v.get("width")
                    .and_then(Value::as_u64)
                    .is_some_and(|w| (1..=32).contains(&w))
        }),
        _ => false,
    }
}
pub(super) fn literal(key: &str, value: &Value) -> String {
    if base_key(key) == "border" {
        let w = value["width"].as_u64().unwrap();
        let n = 2 * w + 2;
        let next = w + 2;
        let c = value["color"].to_string();
        return format!("Frame(Composite(({n}, {n}), (0, 0), Transform(Solid({c}), xysize=({n}, {w})), (0, {next}), Transform(Solid({c}), xysize=({n}, {w})), (0, {w}), Transform(Solid({c}), xysize=({w}, 2)), ({next}, {w}), Transform(Solid({c}), xysize=({w}, 2))), {w}, {w})");
    }
    match value {
        Value::Bool(true) => "True".into(),
        Value::Bool(false) => "False".into(),
        _ => value.to_string(),
    }
}
fn parse_value(key: &str, raw: &str) -> Option<Value> {
    if base_key(key) == "border" {
        let color = raw.split('"').nth(1)?;
        let width = raw
            .rsplit(", ")
            .next()?
            .strip_suffix(')')?
            .parse::<u32>()
            .ok()?;
        let value = serde_json::json!({"color":color,"width":width});
        return (valid(key, &value) && literal(key, &value) == raw).then_some(value);
    }
    match raw {
        "True" => Some(Value::Bool(true)),
        "False" => Some(Value::Bool(false)),
        _ => serde_json::from_str(raw).ok(),
    }
}
#[derive(Clone, Debug)]
struct Entry {
    key: String,
    value: Span,
    keyword: Span,
    line_start: usize,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TextProperties {
    pub values: BTreeMap<String, Value>,
    pub blocked: BTreeMap<String, String>,
    pub expressions: BTreeMap<String, String>,
    #[serde(skip)]
    entries: Vec<Entry>,
    #[serde(skip)]
    header_end: usize,
    #[serde(skip)]
    header_start: usize,
    #[serde(skip)]
    code_end: usize,
    #[serde(skip)]
    indent: usize,
    #[serde(skip)]
    colon: bool,
}
pub(super) fn read(lines: &[Line<'_>], node: &Node) -> Option<TextProperties> {
    if !matches!(
        node.kind.as_str(),
        "text" | "textbutton" | "frame" | "window"
    ) {
        return None;
    }
    let header = lines.iter().find(|l| l.start == node.span.start)?;
    let mut result = read_block(lines, header, node.source_end, &node.kind);
    if matches!(node.kind.as_str(), "text" | "textbutton") && node.literal.is_none() {
        let raw = header.code[node.kind.len()..].trim();
        result.expressions.insert(
            "text".into(),
            raw.strip_suffix(':').unwrap_or(raw).trim_end().into(),
        );
        result.blocked.insert(
            "text".into(),
            "This text expression stays in Source.".into(),
        );
    }
    Some(result)
}

pub(super) fn read_block(
    lines: &[Line<'_>],
    header: &Line<'_>,
    source_end: usize,
    kind: &str,
) -> TextProperties {
    let mut result = TextProperties {
        values: BTreeMap::new(),
        blocked: BTreeMap::new(),
        expressions: BTreeMap::new(),
        entries: vec![],
        header_end: header.end,
        header_start: header.start,
        code_end: header.start + header.indent + header.code.len(),
        indent: header.indent + 4,
        colon: header.code.ends_with(':'),
    };
    let body = lines
        .iter()
        .enumerate()
        .filter(|(_, l)| l.start > header.start && l.start < source_end)
        .collect::<Vec<_>>();
    if body
        .iter()
        .map(|(_, l)| l.indent)
        .min()
        .is_some_and(|v| v != result.indent)
    {
        for key in FIELDS {
            result.blocked.insert(
                (*key).into(),
                "This element's indentation stays in Source.".into(),
            );
        }
        return result;
    }
    for (index, line) in body.iter().filter(|(_, l)| l.indent == result.indent) {
        let source_key = line.code.split_whitespace().next().unwrap_or("");
        let Some(key) = FIELDS
            .iter()
            .find(|k| applicable(kind, k) && keyword(kind, k) == source_key)
        else {
            continue;
        };
        let raw = line.code[source_key.len()..].trim();
        let value = parse_value(key, raw);
        if !line.single
            || lines
                .get(index + 1)
                .is_some_and(|l| l.start < source_end && l.indent > line.indent)
            || value.as_ref().is_none_or(|v| !valid(key, v))
            || result.values.contains_key(*key)
            || result.blocked.contains_key(*key)
        {
            result.blocked.insert(
                (*key).into(),
                "This source expression or repeated property stays in Source.".into(),
            );
            result.values.remove(*key);
            result.expressions.insert((*key).into(), raw.into());
            continue;
        }
        result.values.insert((*key).into(), value.unwrap());
        let start = line.start + line.indent + line.code.len() - raw.len();
        result.entries.push(Entry {
            key: (*key).into(),
            value: Span {
                start,
                end: start + raw.len(),
            },
            keyword: Span {
                start: line.start + line.indent,
                end: line.start + line.indent + source_key.len(),
            },
            line_start: line.start,
        });
    }
    result
}
impl TextProperties {
    pub(super) fn recognized_starts(&self) -> HashSet<usize> {
        self.entries
            .iter()
            .filter(|e| !self.blocked.contains_key(&e.key))
            .map(|e| e.line_start)
            .collect()
    }
    pub(super) fn patch(
        &self,
        bytes: &[u8],
        node: &Node,
        edits: &TextEdits,
        changes: BTreeMap<String, Option<Value>>,
    ) -> Result<Vec<u8>, SceneError> {
        let mut patches: Vec<(Span, String)> = vec![];
        if let Some(text) = &edits.text {
            if node.literal.is_none() {
                return Err(SceneError::OpaqueBoundary);
            }
            if text.trim().is_empty() || text.len() > 8192 || text.contains('\0') {
                return Err(SceneError::InvalidPayload);
            }
            if node.literal.as_ref() != Some(text) {
                let header = std::str::from_utf8(&bytes[node.span.start..self.header_end])
                    .map_err(|_| SceneError::UnsupportedSource)?;
                let statement = code(header.trim_start_matches(' '));
                let raw = statement[node.kind.len()..].trim_start();
                let value = raw.strip_suffix(':').unwrap_or(raw).trim_end();
                let start = node.span.start
                    + (header.len() - header.trim_start_matches(' ').len())
                    + statement.len()
                    - raw.len();
                patches.push((
                    Span {
                        start,
                        end: start + value.len(),
                    },
                    serde_json::to_string(text).map_err(|_| SceneError::InvalidPayload)?,
                ));
            }
        }
        let mut proposed = self.patch_values(bytes, &node.kind, changes)?;
        for (span, value) in patches {
            proposed.splice(span.start..span.end, value.bytes());
        }
        Ok(proposed)
    }
    pub(super) fn patch_values(
        &self,
        bytes: &[u8],
        kind: &str,
        changes: BTreeMap<String, Option<Value>>,
    ) -> Result<Vec<u8>, SceneError> {
        let mut patches: Vec<(Span, String)> = vec![];
        let newline = if bytes.windows(2).any(|w| w == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let mut added = String::new();
        for key in FIELDS {
            let Some(value) = changes.get(*key) else {
                continue;
            };
            if !applicable(kind, key) || self.blocked.contains_key(*key) {
                return Err(SceneError::OpaqueBoundary);
            }
            if value.as_ref() == self.values.get(*key) {
                continue;
            }
            if value.as_ref().is_some_and(|v| !valid(key, v)) {
                return Err(SceneError::InvalidPayload);
            }
            if let Some(entry) = self.entries.iter().find(|e| e.key == *key) {
                if let Some(value) = value {
                    patches.push((entry.value.clone(), literal(key, value)));
                } else {
                    patches.push((
                        Span {
                            start: entry.keyword.start,
                            end: entry.value.end,
                        },
                        String::new(),
                    ));
                }
            } else if let Some(value) = value {
                added.push_str(&format!(
                    "{}{} {}{newline}",
                    " ".repeat(self.indent),
                    keyword(kind, key),
                    literal(key, value)
                ));
            }
        }
        if kind == "style"
            && self.colon
            && self
                .values
                .keys()
                .all(|key| changes.get(key) == Some(&None))
            && !changes.values().any(Option::is_some)
        {
            patches.push((
                Span {
                    start: self.code_end - 1,
                    end: self.code_end,
                },
                String::new(),
            ));
        }
        if !added.is_empty() {
            let colon_at_end = !self.colon && self.code_end == self.header_end;
            if !self.colon && !colon_at_end {
                patches.push((
                    Span {
                        start: self.code_end,
                        end: self.code_end,
                    },
                    ":".into(),
                ));
            }
            patches.push((
                Span {
                    start: self.header_end,
                    end: self.header_end,
                },
                format!(
                    "{}{}{added}",
                    if colon_at_end { ":" } else { "" },
                    if bytes.get(self.header_end.wrapping_sub(1)) == Some(&b'\n') {
                        ""
                    } else {
                        newline
                    }
                ),
            ));
        }
        patches.sort_by_key(|(s, _)| std::cmp::Reverse(s.start));
        let mut proposed = bytes.to_vec();
        for (span, value) in patches {
            proposed.splice(span.start..span.end, value.bytes());
        }
        if kind != "style" && changes.values().any(Option::is_none) {
            let parsed = inspect(&proposed, String::new(), String::new())?;
            if let Some(updated) = parsed
                .screens
                .iter()
                .flat_map(|s| &s.nodes)
                .find(|n| n.span.start == self.header_start)
            {
                let header_end = proposed[self.header_start..]
                    .iter()
                    .position(|b| *b == b'\n')
                    .map_or(proposed.len(), |i| self.header_start + i + 1);
                let header = std::str::from_utf8(&proposed[self.header_start..header_end])
                    .map_err(|_| SceneError::UnsupportedSource)?;
                if code(header).ends_with(':') && updated.source_end == header_end {
                    let pass = format!(
                        "{}{}pass{newline}",
                        if proposed.get(header_end.wrapping_sub(1)) == Some(&b'\n') {
                            ""
                        } else {
                            newline
                        },
                        " ".repeat(self.indent)
                    );
                    proposed.splice(header_end..header_end, pass.bytes());
                }
            }
        }
        Ok(proposed)
    }
}
impl AuthoringService {
    pub(super) fn verify_accepted_text_font(
        &self,
        project: &ProjectId,
        project_id: &str,
        node: &Node,
        edits: &TextEdits,
    ) -> Result<(), SceneError> {
        let paths = node
            .text_properties
            .as_ref()
            .map(|p| {
                p.values
                    .iter()
                    .filter(|(key, _)| {
                        base_key(key) == "font"
                            && !(key.as_str() == "font" && edits.font.is_some())
                            && !edits.appearance.contains_key(*key)
                    })
                    .filter_map(|(_, v)| v.as_str())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        if paths.is_empty() {
            return Ok(());
        }
        let metadata = self
            .list(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        for path in paths {
            let font = metadata
                .assets
                .iter()
                .find(|a| {
                    a.kind == crate::authoring::AssetKind::Font
                        && a.relative_path == format!("game/{path}")
                })
                .ok_or(SceneError::FontMissing)?;
            self.font_bytes(
                project,
                project_id,
                &FontReference {
                    asset_id: font.id.clone(),
                    expected_asset_sha256: font.sha256.clone(),
                },
            )?;
        }
        Ok(())
    }
    pub(super) fn resolve_text_edits(
        &self,
        project: &ProjectId,
        project_id: &str,
        edits: &TextEdits,
    ) -> Result<BTreeMap<String, Option<Value>>, SceneError> {
        let mut values = BTreeMap::new();
        if let Some(font) = &edits.font {
            values.insert(
                "font".into(),
                font.as_ref()
                    .map(|f| {
                        self.font_bytes(project, project_id, f)
                            .map(|(path, _)| Value::String(path))
                    })
                    .transpose()?,
            );
        }
        macro_rules! field {
            ($key:ident) => {
                if let Some(value) = &edits.$key {
                    values.insert(
                        stringify!($key).into(),
                        value.as_ref().map(|v| serde_json::json!(v)),
                    );
                }
            };
        }
        field!(size);
        field!(color);
        field!(align);
        field!(bold);
        field!(italic);
        for (key, value) in &edits.appearance {
            if !FIELDS.contains(&key.as_str()) || values.contains_key(key) {
                return Err(SceneError::InvalidPayload);
            }
            let resolved = if base_key(key) == "font" {
                value
                    .as_ref()
                    .map(|v| {
                        serde_json::from_value::<FontReference>(v.clone())
                            .map_err(|_| SceneError::InvalidPayload)
                            .and_then(|f| {
                                self.font_bytes(project, project_id, &f)
                                    .map(|(p, _)| Value::String(p))
                            })
                    })
                    .transpose()?
            } else {
                value.clone()
            };
            if resolved.as_ref().is_some_and(|v| !valid(key, v)) {
                return Err(SceneError::InvalidPayload);
            }
            values.insert(key.clone(), resolved);
        }
        Ok(values)
    }
}
