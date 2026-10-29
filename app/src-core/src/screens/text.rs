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

pub(super) const FIELDS: &[&str] = &["font", "size", "color", "align", "bold", "italic"];

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
    let key = if key == "align" { "text_align" } else { key };
    format!("{}{key}", if kind == "textbutton" { "text_" } else { "" })
}
fn valid(key: &str, value: &Value) -> bool {
    match key {
        "font" => value
            .as_str()
            .is_some_and(|s| RelativePath::new(format!("game/{s}")).is_ok()),
        "size" => value.as_u64().is_some_and(|v| (1..=512).contains(&v)),
        "color" => value.as_str().is_some_and(|s| {
            s.starts_with('#')
                && matches!(s.len(), 4 | 5 | 7 | 9)
                && s[1..].bytes().all(|b| b.is_ascii_hexdigit())
        }),
        "align" => value
            .as_f64()
            .is_some_and(|v| v.is_finite() && (0.0..=1.0).contains(&v)),
        "bold" | "italic" => value.is_boolean(),
        _ => false,
    }
}
fn literal(value: &Value) -> String {
    match value {
        Value::Bool(true) => "True".into(),
        Value::Bool(false) => "False".into(),
        _ => value.to_string(),
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
    #[serde(skip)]
    entries: Vec<Entry>,
    #[serde(skip)]
    header_end: usize,
    #[serde(skip)]
    code_end: usize,
    #[serde(skip)]
    indent: usize,
    #[serde(skip)]
    colon: bool,
}
pub(super) fn read(lines: &[Line<'_>], node: &Node) -> Option<TextProperties> {
    if !matches!(node.kind.as_str(), "text" | "textbutton") {
        return None;
    }
    let header = lines.iter().find(|l| l.start == node.span.start)?;
    let mut result = TextProperties {
        values: BTreeMap::new(),
        blocked: BTreeMap::new(),
        entries: vec![],
        header_end: header.end,
        code_end: header.start + header.indent + header.code.len(),
        indent: header.indent + 4,
        colon: header.code.ends_with(':'),
    };
    if node.literal.is_none() {
        result.blocked.insert(
            "text".into(),
            "This text expression stays in Source.".into(),
        );
    }
    let body = lines
        .iter()
        .enumerate()
        .filter(|(_, l)| l.start > node.span.start && l.start < node.source_end)
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
        return Some(result);
    }
    for (index, line) in body.iter().filter(|(_, l)| l.indent == result.indent) {
        let source_key = line.code.split_whitespace().next().unwrap_or("");
        let Some(key) = FIELDS.iter().find(|k| keyword(&node.kind, k) == source_key) else {
            continue;
        };
        let raw = line.code[source_key.len()..].trim();
        let value = match raw {
            "True" => Some(Value::Bool(true)),
            "False" => Some(Value::Bool(false)),
            _ => serde_json::from_str::<Value>(raw).ok(),
        };
        if !line.single
            || lines
                .get(index + 1)
                .is_some_and(|l| l.start < node.source_end && l.indent > line.indent)
            || value.as_ref().is_none_or(|v| !valid(key, v))
            || result.values.contains_key(*key)
            || result.blocked.contains_key(*key)
        {
            result.blocked.insert(
                (*key).into(),
                "This source expression or repeated property stays in Source.".into(),
            );
            result.values.remove(*key);
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
    Some(result)
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
            if self.blocked.contains_key(*key) {
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
                    patches.push((entry.value.clone(), literal(value)));
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
                    keyword(&node.kind, key),
                    literal(value)
                ));
            }
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
        if changes.values().any(Option::is_none) {
            let parsed = inspect(&proposed, String::new(), String::new())?;
            if let Some(updated) = parsed
                .screens
                .iter()
                .flat_map(|s| &s.nodes)
                .find(|n| n.span.start == node.span.start)
            {
                let header_end = proposed[node.span.start..]
                    .iter()
                    .position(|b| *b == b'\n')
                    .map_or(proposed.len(), |i| node.span.start + i + 1);
                let header = std::str::from_utf8(&proposed[node.span.start..header_end])
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
        Ok(values)
    }
}
