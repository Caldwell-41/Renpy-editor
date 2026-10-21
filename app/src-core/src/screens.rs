//! Early screen-source proof. Reads never evaluate screen language or Python.
//!
//! Handles are byte locations bound to a source revision, not persistent screen IDs.
//! This slice edits existing integer xsize/ysize tokens in game/ui files only.
use crate::{
    authoring::AuthoringService,
    scene::SceneError,
    transaction::{
        FileMutation, MutationKind, ProjectId, RelativePath, TransactionIntent, TransactionProposal,
    },
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

const MAX_NODES: usize = 4096;
const MAX_DEPTH: usize = 32;
const MAX_PIXELS: u32 = 16384;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InspectRequest {
    pub path: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetPixelRequest {
    pub path: String,
    pub expected_revision: String,
    pub screen_name: String,
    pub node_start: usize,
    pub property: PixelProperty,
    pub value: u32,
}

/// Both dimensions are prepared against one revision and accepted in one transaction.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetSizeRequest {
    pub path: String,
    pub expected_revision: String,
    pub screen_name: String,
    pub node_start: usize,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PixelProperty {
    Xsize,
    Ysize,
}

impl PixelProperty {
    fn keyword(self) -> &'static str {
        match self {
            Self::Xsize => "xsize",
            Self::Ysize => "ysize",
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Property {
    pub property: PixelProperty,
    pub value: u32,
    pub span: Span,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Node {
    pub kind: String,
    pub literal: Option<String>,
    pub layout: std::collections::BTreeMap<String, f64>,
    pub span: Span,
    pub parent_start: Option<usize>,
    pub properties: Vec<Property>,
    pub protected: Vec<Span>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Screen {
    pub name: String,
    pub nodes: Vec<Node>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub path: String,
    pub revision: String,
    pub screens: Vec<Screen>,
    pub protected: Vec<Span>,
    pub partial: bool,
}

struct Line<'a> {
    start: usize,
    indent: usize,
    code: &'a str,
    single: bool,
}

fn identifier(s: &str) -> bool {
    let mut chars = s.chars();
    chars
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

fn path(value: &str) -> Result<RelativePath, SceneError> {
    let name = value
        .strip_prefix("game/ui/")
        .and_then(|s| s.strip_suffix(".rpy"))
        .filter(|s| identifier(s))
        .ok_or(SceneError::InvalidPayload)?;
    if name.len() > 64 {
        return Err(SceneError::InvalidPayload);
    }
    RelativePath::new(value).map_err(|_| SceneError::InvalidPayload)
}

// Only used on single physical statements already qualified by the shared lexer.
fn code(line: &str) -> &str {
    let mut quote = None;
    let mut escaped = false;
    for (offset, c) in line.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if c == '\\' && quote.is_some() {
            escaped = true;
            continue;
        }
        if quote == Some(c) {
            quote = None;
        } else if quote.is_none() && matches!(c, '\'' | '"') {
            quote = Some(c);
        } else if quote.is_none() && c == '#' {
            return line[..offset].trim_end();
        }
    }
    line.trim_end()
}

fn after_block(lines: &[Line<'_>], index: usize, limit: usize) -> usize {
    let indent = lines[index].indent;
    let mut next = index + 1;
    while next < limit && lines[next].indent > indent {
        next += 1;
    }
    next
}

fn kind(line: &Line<'_>) -> Option<&'static str> {
    if !line.single {
        return None;
    }
    match line.code {
        "fixed:" => return Some("fixed"),
        "frame:" => return Some("frame"),
        "vbox:" => return Some("vbox"),
        _ => {}
    }
    for (prefix, kind) in [
        ("text ", "text"),
        ("add ", "image"),
        ("textbutton ", "textbutton"),
    ] {
        if let Some(value) = line.code.strip_prefix(prefix) {
            let literal = value.strip_suffix(':').unwrap_or(value).trim_end();
            if serde_json::from_str::<String>(literal).is_ok() {
                return Some(kind);
            }
        }
    }
    None
}

fn parse_body(
    lines: &[Line<'_>],
    index: usize,
    limit: usize,
    parent: Option<usize>,
    depth: usize,
    nodes: &mut Vec<Node>,
    file_end: usize,
) -> Result<(), SceneError> {
    if depth > MAX_DEPTH || nodes.len() >= MAX_NODES {
        return Err(SceneError::InvariantBlocked);
    }
    let line = &lines[index];
    let end = if limit < lines.len() {
        lines[limit].start
    } else {
        file_end
    };
    let slot = nodes.len();
    nodes.push(Node {
        kind: if parent.is_none() {
            "screen"
        } else {
            kind(line).unwrap()
        }
        .into(),
        literal: line.code.split_once(' ').and_then(|(_, raw)|
            serde_json::from_str(raw.strip_suffix(':').unwrap_or(raw)).ok()),
        layout: Default::default(),
        span: Span {
            start: line.start,
            end,
        },
        parent_start: parent,
        properties: vec![],
        protected: vec![],
    });
    let mut next = index + 1;
    let mut property_counts = [0usize; 2];
    while next < limit {
        let child = &lines[next];
        let after = after_block(lines, next, limit);
        let mut recognized = false;
        if child.indent == line.indent + 4 {
            for (slot, property) in [PixelProperty::Xsize, PixelProperty::Ysize]
                .into_iter()
                .enumerate()
            {
                if child
                    .code
                    .strip_prefix(property.keyword())
                    .is_some_and(|tail| tail.starts_with(char::is_whitespace))
                {
                    property_counts[slot] += 1;
                }
            }
        }
        if child.single && child.indent == line.indent + 4 {
            if let Some((key, value)) = child.code.split_once(' ') {
                if ["xalign", "yalign", "padding", "spacing"].contains(&key) {
                    if let Ok(value) = value.trim().parse::<f64>() {
                        if value.is_finite() && value >= 0.0 && value <= MAX_PIXELS as f64 {
                            nodes[slot].layout.insert(key.into(), value);
                        }
                    }
                }
            }
            for property in [PixelProperty::Xsize, PixelProperty::Ysize] {
                if let Some(raw) = child
                    .code
                    .strip_prefix(property.keyword())
                    .filter(|s| s.starts_with(char::is_whitespace))
                {
                    let value = raw.trim();
                    if after == next + 1
                        && !value.is_empty()
                        && value.bytes().all(|b| b.is_ascii_digit())
                    {
                        if let Ok(value_number) = value.parse::<u32>() {
                            if parent.is_some() && value_number > 0 && value_number <= MAX_PIXELS {
                                let start = child.start + child.indent + child.code.len()
                                    - raw.trim_start().len();
                                nodes[slot].properties.push(Property {
                                    property,
                                    value: value_number,
                                    span: Span {
                                        start,
                                        end: start + value.len(),
                                    },
                                });
                                recognized = true;
                            }
                        }
                    }
                }
            }
            if !recognized
                && kind(child).is_some()
                && (child.code.ends_with(':') || after == next + 1)
            {
                parse_body(
                    lines,
                    next,
                    after,
                    Some(line.start),
                    depth + 1,
                    nodes,
                    file_end,
                )?;
                recognized = true;
            }
        }
        if !recognized {
            nodes[slot].protected.push(Span {
                start: child.start,
                end: if after < lines.len() {
                    lines[after].start
                } else {
                    file_end
                },
            });
        }
        next = after;
    }
    let properties = std::mem::take(&mut nodes[slot].properties);
    for property in properties {
        if property_counts[if property.property == PixelProperty::Xsize {
            0
        } else {
            1
        }] == 1
        {
            nodes[slot].properties.push(property);
        } else {
            nodes[slot].protected.push(property.span);
        }
    }
    Ok(())
}

fn inspect(bytes: &[u8], path: String, revision: String) -> Result<Document, SceneError> {
    let bom = if bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
        3
    } else {
        0
    };
    let body = &bytes[bom..];
    let text = std::str::from_utf8(body).map_err(|_| SceneError::UnsupportedSource)?;
    let ranges = crate::authoring::lexical_ranges(body, false, false)
        .map_err(|_| SceneError::UnsupportedSource)?;
    let mut lines = vec![];
    for (start, end) in ranges {
        let raw = &text[start..end];
        if raw.trim().is_empty() || raw.trim_start().starts_with('#') {
            continue;
        }
        let indent = raw.len() - raw.trim_start_matches(' ').len();
        if raw[indent..].starts_with('\t') {
            return Err(SceneError::UnsupportedSource);
        }
        let single = !raw.contains(['\n', '\r']);
        lines.push(Line {
            start: start + bom,
            indent,
            code: if single {
                code(&raw[indent..])
            } else {
                &raw[indent..]
            },
            single,
        });
    }
    if lines.len() > MAX_NODES * 8 {
        return Err(SceneError::InvariantBlocked);
    }
    let mut result = Document {
        path,
        revision,
        screens: vec![],
        protected: vec![],
        partial: false,
    };
    let mut index = 0;
    let mut names = HashSet::new();
    while index < lines.len() {
        let line = &lines[index];
        let after = after_block(&lines, index, lines.len());
        let name = line
            .code
            .strip_prefix("screen ")
            .and_then(|s| s.strip_suffix(':'))
            .map(|s| s.strip_suffix("()").unwrap_or(s))
            .filter(|s| identifier(s));
        if line.indent == 0 {
            if let Some(declaration) = line
                .code
                .strip_prefix("screen")
                .filter(|s| s.starts_with(char::is_whitespace))
            {
                let declaration = declaration.trim_start();
                let raw_name = declaration
                    .split(['(', ':', ' ', '\t', '\n', '\r'])
                    .next()
                    .unwrap_or("");
                if identifier(raw_name) && !names.insert(raw_name.to_owned()) {
                    return Err(SceneError::UnsupportedSource);
                }
            }
        }
        if line.indent == 0 && line.single && name.is_some() {
            let name = name.unwrap().to_owned();
            let mut nodes = vec![];
            parse_body(&lines, index, after, None, 0, &mut nodes, bytes.len())?;
            result.screens.push(Screen { name, nodes });
        } else {
            result.protected.push(Span {
                start: line.start,
                end: if after < lines.len() {
                    lines[after].start
                } else {
                    bytes.len()
                },
            });
        }
        index = after;
    }
    result.partial = !result.protected.is_empty()
        || result
            .screens
            .iter()
            .any(|s| s.nodes.iter().any(|n| !n.protected.is_empty()));
    Ok(result)
}

impl AuthoringService {
    pub fn screens_inspect(
        &self,
        project: &ProjectId,
        request: InspectRequest,
    ) -> Result<Document, SceneError> {
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&request.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        inspect(&bytes, request.path, revision.sha256)
    }

    pub fn screens_set_pixel(
        &self,
        project: &ProjectId,
        request: SetPixelRequest,
    ) -> Result<Document, SceneError> {
        self.screens_set_properties(project, request.path, request.expected_revision,
            request.screen_name, request.node_start, &[(request.property, request.value)])
    }

    pub fn screens_set_size(&self, project: &ProjectId, request: SetSizeRequest) -> Result<Document, SceneError> {
        self.screens_set_properties(project, request.path, request.expected_revision,
            request.screen_name, request.node_start,
            &[(PixelProperty::Xsize, request.width), (PixelProperty::Ysize, request.height)])
    }

    fn screens_set_properties(&self, project: &ProjectId, source_path: String, expected_revision: String,
        screen_name: String, node_start: usize, values: &[(PixelProperty, u32)]) -> Result<Document, SceneError> {
        let path = path(&source_path)?;
        if values.iter().any(|(_, value)| *value == 0 || *value > MAX_PIXELS) {
            return Err(SceneError::InvalidPayload);
        }
        self.ensure_source_paths_clean(project, [source_path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self.transactions.snapshot(project, path.clone())
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != expected_revision { return Err(SceneError::SourceConflict); }
        let document = inspect(&bytes, source_path.clone(), revision.sha256.clone())?;
        let node = document.screens.iter().find(|s| s.name == screen_name)
            .and_then(|s| s.nodes.iter().find(|n| n.span.start == node_start))
            .ok_or(SceneError::UnknownEntity)?;
        let mut patches = vec![];
        for (key, value) in values {
            let properties = node.properties.iter().filter(|p| p.property == *key).collect::<Vec<_>>();
            if properties.len() != 1 { return Err(SceneError::OpaqueBoundary); }
            let property = properties[0];
            if property.value != *value { patches.push((property.span.clone(), *value)); }
        }
        if patches.is_empty() { return Ok(document); }
        patches.sort_by_key(|(span, _)| std::cmp::Reverse(span.start));
        let mut proposed = bytes.clone();
        for (span, value) in patches {
            proposed.splice(span.start..span.end, value.to_string().bytes());
        }
        inspect(&proposed, source_path.clone(), String::new())?;
        self.commit_history(project, TransactionProposal {
            mutations: vec![FileMutation { path, kind: MutationKind::ReplaceExisting,
                base: revision, expected_bytes: bytes, proposed }],
            intent: TransactionIntent::Edit,
        })?;
        self.screens_inspect(project, InspectRequest { path: source_path })
    }
}

#[cfg(test)]
mod tests;
