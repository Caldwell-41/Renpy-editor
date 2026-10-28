//! Numeric layout owns literal types, aliases and the exact source ranges it changes.
use super::*;
use std::collections::{BTreeMap, BTreeSet};

const FIELDS: &[&str] = &[
    "columns",
    "rows",
    "xpos",
    "ypos",
    "xanchor",
    "yanchor",
    "xsize",
    "ysize",
    "xminimum",
    "yminimum",
    "xmaximum",
    "ymaximum",
    "left_padding",
    "right_padding",
    "top_padding",
    "bottom_padding",
    "spacing",
];

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Unit {
    Pixels,
    Relative,
    Count,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct NumericValue {
    pub unit: Unit,
    pub value: f64,
}

impl NumericValue {
    pub fn json(self) -> serde_json::Value {
        match self.unit {
            Unit::Pixels | Unit::Count => serde_json::json!(self.value as i64),
            Unit::Relative => serde_json::json!(self.value),
        }
    }
    fn literal(self) -> String {
        match self.unit {
            Unit::Pixels | Unit::Count => (self.value as i64).to_string(),
            Unit::Relative => format!("{:?}", self.value),
        }
    }
    fn valid(self, key: &str) -> bool {
        if matches!(key, "columns" | "rows") {
            return self.unit == Unit::Count
                && self.value.fract() == 0.0
                && (1.0..=64.0).contains(&self.value);
        }
        if !self.value.is_finite() || self.value.abs() > MAX_PIXELS as f64 {
            return false;
        }
        let coordinate = matches!(key, "xpos" | "ypos" | "xanchor" | "yanchor");
        (self.unit == Unit::Pixels && self.value.fract() == 0.0
            || coordinate && self.unit == Unit::Relative)
            && (coordinate
                || self.value
                    >= if matches!(key, "xsize" | "ysize") {
                        1.0
                    } else {
                        0.0
                    })
    }
}

#[derive(Clone, Debug)]
struct Atom {
    span: Span,
    fields: Vec<String>,
    value: NumericValue,
}
#[derive(Clone, Debug)]
struct Entry {
    key: String,
    keyword: Span,
    value: Span,
    line_end: usize,
    indent: usize,
    atoms: Vec<Atom>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NumericLayout {
    pub values: BTreeMap<String, NumericValue>,
    pub blocked: BTreeMap<String, String>,
    pub sizing_note: Option<String>,
    #[serde(skip)]
    entries: Vec<Entry>,
    #[serde(skip)]
    unresolved: BTreeSet<String>,
    #[serde(skip)]
    header_end: usize,
    #[serde(skip)]
    header_code_end: usize,
    #[serde(skip)]
    colon: bool,
    #[serde(skip)]
    indent: usize,
    #[serde(skip)]
    child_count: usize,
    #[serde(skip)]
    grid: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetLayoutRequest {
    pub path: String,
    pub expected_revision: String,
    pub screen_name: String,
    pub node_start: usize,
    pub values: BTreeMap<String, Option<NumericValue>>,
}

pub(super) fn aliases(key: &str) -> Vec<Vec<&str>> {
    match key {
        "columns" | "rows" => vec![], // Positional grid arguments, never body properties.
        "xalign" => vec![vec!["xpos", "xanchor"]],
        "yalign" => vec![vec!["ypos", "yanchor"]],
        "align" => vec![vec!["xpos", "xanchor"], vec!["ypos", "yanchor"]],
        "pos" => vec![vec!["xpos"], vec!["ypos"]],
        "anchor" => vec![vec!["xanchor"], vec!["yanchor"]],
        "xysize" => vec![vec!["xsize"], vec!["ysize"]],
        "minimum" => vec![vec!["xminimum"], vec!["yminimum"]],
        "maximum" => vec![vec!["xmaximum"], vec!["ymaximum"]],
        "xpadding" => vec![vec!["left_padding", "right_padding"]],
        "ypadding" => vec![vec!["top_padding", "bottom_padding"]],
        "padding" => vec![
            vec!["left_padding"],
            vec!["top_padding"],
            vec!["right_padding"],
            vec!["bottom_padding"],
        ],
        key if FIELDS.contains(&key) => vec![vec![key]],
        _ => vec![],
    }
}

pub(super) fn read(lines: &[Line<'_>], node: &Node, nodes: &[Node]) -> Option<NumericLayout> {
    if ![
        "fixed",
        "frame",
        "window",
        "vbox",
        "hbox",
        "grid",
        "viewport",
        "text",
        "textbutton",
        "image",
    ]
    .contains(&node.kind.as_str())
    {
        return None;
    }
    let header = lines.iter().find(|line| line.start == node.span.start)?;
    let mut result = NumericLayout {
        values: BTreeMap::new(),
        blocked: BTreeMap::new(),
        sizing_note: match node.kind.as_str() {
            "text" => Some("Text keeps its natural bounds. Width and height limit layout space; they do not stretch glyphs.".into()),
            "vbox" | "hbox" | "grid" => Some("Children can make the group larger than its requested size.".into()),
            "viewport" => Some("Width and height set the stationary top-left opening. Scrolling, offsets, bindings and child_size remain in Source.".into()),
            _ => None,
        },
        entries: vec![],
        unresolved: BTreeSet::new(),
        header_end: header.end,
        header_code_end: header.start + header.indent + header.code.len(),
        colon: header.code.ends_with(':'),
        indent: header.indent + 4,
        child_count: nodes.iter().filter(|n| n.parent_start == Some(node.span.start)).count(),
        grid: node.kind == "grid",
    };
    if let Some(arguments) = grid_header(header.code) {
        for (key, (value, start, end)) in ["columns", "rows"].into_iter().zip(arguments) {
            let value = NumericValue {
                unit: Unit::Count,
                value: value as f64,
            };
            let span = Span {
                start: header.start + header.indent + start,
                end: header.start + header.indent + end,
            };
            result.values.insert(key.into(), value);
            result.entries.push(Entry {
                key: key.into(),
                keyword: span.clone(),
                value: span.clone(),
                line_end: header.end,
                indent: 0,
                atoms: vec![Atom {
                    span,
                    fields: vec![key.into()],
                    value,
                }],
            });
        }
    }
    let body_indent = lines
        .iter()
        .filter(|line| line.start > node.span.start && line.start < node.source_end)
        .map(|line| line.indent)
        .min();
    if body_indent.is_some_and(|indent| indent != result.indent) {
        for key in FIELDS {
            result.blocked.insert(
                (*key).into(),
                "This element uses unsupported body indentation. Edit its layout in Source.".into(),
            );
            result.unresolved.insert((*key).into());
        }
        return Some(result);
    }
    for key in FIELDS {
        if matches!(*key, "columns" | "rows") && node.kind != "grid" {
            result
                .blocked
                .insert((*key).into(), "Only grids have columns and rows.".into());
        }
        if node.kind == "image" && matches!(*key, "xminimum" | "yminimum" | "xmaximum" | "ymaximum")
        {
            result.blocked.insert((*key).into(), "Images use transformed width and height rather than layout bounds. Edit unsupported bounds in Source.".into());
        }
        if node.kind == "text" && matches!(*key, "xminimum" | "yminimum") {
            result.blocked.insert((*key).into(), "Text keeps its natural bounds. Minimum size does not stretch glyphs; use a frame for a fixed box.".into());
        }
        if key.ends_with("_padding") && !matches!(node.kind.as_str(), "frame" | "window")
            || *key == "spacing" && !matches!(node.kind.as_str(), "vbox" | "hbox" | "grid")
        {
            result.blocked.insert(
                (*key).into(),
                "This property is not supported on this element. Edit it in Source.".into(),
            );
        }
    }
    for (line_index, line) in lines.iter().enumerate().filter(|(_, line)| {
        line.start > node.span.start && line.start < node.source_end && line.indent == result.indent
    }) {
        let key = line.code.split_whitespace().next().unwrap_or("");
        if matches!(key, "columns" | "rows") {
            continue;
        }
        let mut mapping = aliases(key);
        if mapping.is_empty() {
            if matches!(
                key,
                "at" | "offset" | "xoffset" | "yoffset" | "xcenter" | "ycenter" | "xycenter"
            ) {
                for key in ["xpos", "ypos", "xanchor", "yanchor"] {
                    result.blocked.insert(
                        key.into(),
                        "This element uses another placement rule. Edit its position in Source."
                            .into(),
                    );
                }
            }
            continue;
        }
        let raw = line.code[key.len()..].trim();
        let start = line.start + line.indent + line.code.len() - raw.len();
        let tuple = raw.strip_prefix('(').and_then(|s| s.strip_suffix(')'));
        let mut parts = vec![];
        let mut tuple_valid = true;
        if let Some(tuple) = tuple {
            let mut offset = start + 1;
            let segments = tuple.split(',').collect::<Vec<_>>();
            for (index, part) in segments.iter().enumerate() {
                if !part.trim().is_empty() {
                    parts.push((offset + part.len() - part.trim_start().len(), part.trim()));
                } else if index + 1 != segments.len() {
                    tuple_valid = false;
                }
                offset += part.len() + 1;
            }
        } else {
            parts.push((start, raw));
        }
        if key == "padding" && parts.len() == 2 {
            mapping = vec![
                vec!["left_padding", "right_padding"],
                vec!["top_padding", "bottom_padding"],
            ];
        }
        let atoms = parts
            .iter()
            .zip(&mapping)
            .map(|((start, raw), fields)| {
                let unit = if raw.contains(['.', 'e', 'E']) {
                    Unit::Relative
                } else {
                    Unit::Pixels
                };
                let value = NumericValue {
                    unit,
                    value: raw.parse().ok()?,
                };
                if !raw
                    .bytes()
                    .all(|b| b.is_ascii_digit() || b"+-.eE".contains(&b))
                    || !fields.iter().all(|key| value.valid(key))
                {
                    return None;
                }
                Some(Atom {
                    span: Span {
                        start: *start,
                        end: start + raw.len(),
                    },
                    fields: fields.iter().map(|s| (*s).into()).collect(),
                    value,
                })
            })
            .collect::<Option<Vec<_>>>();
        if !line.single
            || lines
                .get(line_index + 1)
                .is_some_and(|next| next.indent > line.indent)
            || !tuple_valid
            || (tuple.is_some()
                && !matches!(
                    key,
                    "pos" | "anchor" | "align" | "xysize" | "minimum" | "maximum" | "padding"
                ))
            || parts.len() != mapping.len()
            || (mapping.len() > 1 && tuple.is_none())
            || atoms.is_none()
        {
            for field in mapping.into_iter().flatten() {
                result.unresolved.insert(field.into());
                result.blocked.insert(field.into(), "This source property is not an unambiguous supported numeric literal. Edit it in Source.".into());
            }
            continue;
        }
        let atoms = atoms.unwrap();
        for atom in &atoms {
            for field in &atom.fields {
                if matches!(node.kind.as_str(), "window" | "hbox" | "grid" | "viewport")
                    && result.blocked.contains_key(field)
                {
                    result.unresolved.insert(field.clone());
                }
                if node.kind == "image"
                    && matches!(
                        field.as_str(),
                        "xminimum" | "yminimum" | "xmaximum" | "ymaximum"
                    )
                {
                    result.unresolved.insert(field.clone());
                }
                if result.values.insert(field.clone(), atom.value).is_some() {
                    result.unresolved.insert(field.clone());
                    result.blocked.insert(field.clone(), "Multiple source properties set this value. Resolve their order in Source first.".into());
                }
            }
        }
        result.entries.push(Entry {
            key: key.into(),
            keyword: Span {
                start: line.start + line.indent,
                end: line.start + line.indent + key.len(),
            },
            value: Span {
                start,
                end: start + raw.len(),
            },
            line_end: line.end,
            indent: line.indent,
            atoms,
        });
    }
    if let Some(parent) = nodes
        .iter()
        .find(|n| Some(n.span.start) == node.parent_start)
    {
        let keys: &[&str] = match parent.kind.as_str() {
            "vbox" => &["ypos", "yanchor"],
            "hbox" => &["xpos", "xanchor"],
            "grid" => &["xpos", "ypos", "xanchor", "yanchor"],
            _ => &[],
        };
        for key in keys {
            result.blocked.insert(
                (*key).into(),
                if parent.kind == "vbox" { "The vertical group controls vertical placement. Edit the group's spacing instead." }
                else { "The parent group controls this placement. Edit the parent's layout instead." }.into(),
            );
        }
    }
    for axis in ["x", "y"] {
        if result.values.contains_key(&format!("{axis}size"))
            && ["minimum", "maximum"]
                .iter()
                .any(|suffix| result.values.contains_key(&format!("{axis}{suffix}")))
        {
            for suffix in ["size", "minimum", "maximum"] {
                result.unresolved.insert(format!("{axis}{suffix}"));
                result.blocked.insert(
                    format!("{axis}{suffix}"),
                    "Size and bounds overlap in Source. Resolve their order in Source first."
                        .into(),
                );
            }
        }
    }
    for entry in &result.entries {
        if entry
            .atoms
            .iter()
            .flat_map(|atom| &atom.fields)
            .any(|key| result.unresolved.contains(key))
        {
            for key in entry.atoms.iter().flat_map(|atom| &atom.fields) {
                result.blocked.entry(key.clone()).or_insert_with(|| "This value shares a source alias with an ambiguous layout property. Resolve that alias in Source first.".into());
            }
        }
    }
    Some(result)
}

impl NumericLayout {
    pub(super) fn recognized_starts(&self) -> BTreeSet<usize> {
        self.entries
            .iter()
            .filter(|entry| {
                entry
                    .atoms
                    .iter()
                    .flat_map(|atom| &atom.fields)
                    .all(|key| !self.blocked.contains_key(key))
            })
            .map(|entry| entry.keyword.start - entry.indent)
            .collect()
    }

    pub(super) fn canvas_properties(
        &self,
    ) -> Result<serde_json::Map<String, serde_json::Value>, String> {
        if !self.unresolved.is_empty() {
            return Err(self
                .unresolved
                .iter()
                .cloned()
                .collect::<Vec<_>>()
                .join(", "));
        }
        Ok(self
            .entries
            .iter()
            .map(|entry| {
                (
                    entry.key.clone(),
                    if entry.atoms.len() == 1 {
                        entry.atoms[0].value.json()
                    } else {
                        serde_json::Value::Array(
                            entry.atoms.iter().map(|atom| atom.value.json()).collect(),
                        )
                    },
                )
            })
            .collect())
    }

    pub(super) fn changed(
        &self,
        edits: &BTreeMap<String, Option<NumericValue>>,
    ) -> Result<BTreeMap<String, NumericValue>, SceneError> {
        if edits.len() > FIELDS.len() {
            return Err(SceneError::InvalidPayload);
        }
        let mut values = self.values.clone();
        for (key, value) in edits {
            if !FIELDS.contains(&key.as_str()) || value.is_some_and(|v| !v.valid(key)) {
                return Err(SceneError::InvalidPayload);
            }
            if value.as_ref() == self.values.get(key) {
                continue;
            }
            if self.blocked.contains_key(key) {
                return Err(SceneError::OpaqueBoundary);
            }
            if let Some(value) = value {
                values.insert(key.clone(), *value);
            } else {
                values.remove(key);
            }
        }
        for axis in ["x", "y"] {
            let size = values.get(&format!("{axis}size"));
            let minimum = values.get(&format!("{axis}minimum"));
            let maximum = values.get(&format!("{axis}maximum"));
            if size.is_some() && (minimum.is_some() || maximum.is_some())
                || minimum.zip(maximum).is_some_and(|(a, b)| a.value > b.value)
            {
                return Err(SceneError::InvalidPayload);
            }
        }
        if self.grid
            && (values
                .get("columns")
                .zip(values.get("rows"))
                .is_none_or(|(cols, rows)| (cols.value * rows.value) < self.child_count as f64))
        {
            return Err(SceneError::InvalidPayload);
        }
        Ok(values)
    }

    fn patch(
        &self,
        bytes: &[u8],
        edits: &BTreeMap<String, Option<NumericValue>>,
    ) -> Result<Vec<u8>, SceneError> {
        let values = self.changed(edits)?;
        let newline = if bytes.windows(2).any(|w| w == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let mut patches: Vec<(Span, String)> = vec![];
        let mut written = BTreeSet::new();
        for entry in &self.entries {
            for atom in &entry.atoms {
                written.extend(atom.fields.iter().cloned());
            }
            let changed = entry.atoms.iter().any(|atom| {
                atom.fields
                    .iter()
                    .any(|key| self.values.get(key) != values.get(key))
            });
            if !changed {
                continue;
            }
            let representable = entry.atoms.iter().all(|atom| {
                let first = values.get(&atom.fields[0]);
                first.is_some() && atom.fields.iter().all(|key| values.get(key) == first)
            });
            if representable {
                for atom in &entry.atoms {
                    let value = values[&atom.fields[0]];
                    if value != atom.value {
                        patches.push((atom.span.clone(), value.literal()));
                    }
                }
            } else {
                if entry
                    .atoms
                    .iter()
                    .flat_map(|atom| &atom.fields)
                    .any(|key| self.blocked.contains_key(key))
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let fields = entry
                    .atoms
                    .iter()
                    .flat_map(|atom| &atom.fields)
                    .filter_map(|key| values.get(key).map(|value| (key, value)))
                    .collect::<Vec<_>>();
                if let Some((key, value)) = fields.first() {
                    patches.push((entry.keyword.clone(), (*key).clone()));
                    patches.push((entry.value.clone(), value.literal()));
                    let added = fields
                        .iter()
                        .skip(1)
                        .map(|(key, value)| {
                            format!(
                                "{}{key} {}{newline}",
                                " ".repeat(entry.indent),
                                value.literal()
                            )
                        })
                        .collect::<String>();
                    if !added.is_empty() {
                        patches.push((
                            Span {
                                start: entry.line_end,
                                end: entry.line_end,
                            },
                            format!(
                                "{}{added}",
                                if bytes.get(entry.line_end.wrapping_sub(1)) == Some(&b'\n') {
                                    ""
                                } else {
                                    newline
                                }
                            ),
                        ));
                    }
                } else {
                    patches.push((
                        Span {
                            start: entry.keyword.start,
                            end: entry.value.end,
                        },
                        "pass".into(),
                    ));
                }
            }
        }
        let added = values
            .iter()
            .filter(|(key, _)| !written.contains(*key))
            .map(|(key, value)| {
                format!(
                    "{}{key} {}{newline}",
                    " ".repeat(self.indent),
                    value.literal()
                )
            })
            .collect::<String>();
        if !added.is_empty() {
            let colon_at_end = !self.colon && self.header_code_end == self.header_end;
            if !self.colon && !colon_at_end {
                patches.push((
                    Span {
                        start: self.header_code_end,
                        end: self.header_code_end,
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
        patches.sort_by_key(|(span, _)| std::cmp::Reverse(span.start));
        let mut proposed = bytes.to_vec();
        for (span, value) in patches {
            proposed.splice(span.start..span.end, value.bytes());
        }
        Ok(proposed)
    }
}

impl AuthoringService {
    pub fn screens_set_layout(
        &self,
        project: &ProjectId,
        request: SetLayoutRequest,
    ) -> Result<Document, SceneError> {
        let relative = path(&request.path)?;
        self.ensure_source_paths_clean(project, [request.path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, relative.clone())
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let document = self.owned_screen_document(
            project,
            &bytes,
            request.path.clone(),
            revision.sha256.clone(),
        )?;
        let numeric = document
            .screens
            .iter()
            .find(|s| s.name == request.screen_name)
            .and_then(|s| s.nodes.iter().find(|n| n.span.start == request.node_start))
            .and_then(|n| n.numeric_layout.as_ref())
            .ok_or(SceneError::OpaqueBoundary)?;
        let expected = numeric.changed(&request.values)?;
        let proposed = numeric.patch(&bytes, &request.values)?;
        if proposed == bytes {
            return Ok(document);
        }
        let candidate = inspect(&proposed, request.path.clone(), String::new())?;
        if !candidate
            .screens
            .iter()
            .find(|s| s.name == request.screen_name)
            .and_then(|s| s.nodes.iter().find(|n| n.span.start == request.node_start))
            .and_then(|n| n.numeric_layout.as_ref())
            .is_some_and(|layout| layout.values == expected)
        {
            return Err(SceneError::InvariantBlocked);
        }
        self.commit_history(
            project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path: relative,
                    kind: MutationKind::ReplaceExisting,
                    base: revision,
                    expected_bytes: bytes,
                    proposed,
                }],
                intent: TransactionIntent::Edit,
            },
        )?;
        self.screens_inspect_owned(project, InspectRequest { path: request.path })
    }
}
