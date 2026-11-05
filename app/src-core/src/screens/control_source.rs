//! Literal control properties share the source parser and transactional composition owner.
use super::*;
use crate::authoring::{Variable, VariableType};
use controls::{BarAppearance, IntegerBarBinding};
use std::collections::BTreeMap;

pub(super) const BAR_KEYS: &[&str] = &["value", "left_bar", "right_bar", "thumb"];
pub(super) const IMAGE_KEYS: &[&str] = &[
    "idle",
    "hover",
    "selected_idle",
    "selected_hover",
    "insensitive",
    "selected_insensitive",
];

pub(super) fn image_references(
    a: &controls::ImageButtonAppearances,
) -> [Option<&controls::ControlImageReference>; 6] {
    [
        Some(&a.normal),
        a.hover.as_ref(),
        a.selected.as_ref(),
        a.selected_hover.as_ref(),
        a.disabled.as_ref(),
        a.selected_disabled.as_ref(),
    ]
}

impl AuthoringService {
    pub(super) fn inspect_imagebutton(
        &self,
        project: &ProjectId,
        project_id: &str,
        bytes: &[u8],
        node: &Node,
    ) -> Option<(controls::ImageButtonAppearances, Vec<usize>)> {
        let (paths, starts) = image_paths(bytes, node)?;
        let model = self.list(project, project_id).ok()?;
        let read = |key: &str| -> Option<Option<controls::ControlImageReference>> {
            let Some(path) = paths.get(key) else {
                return Some(None);
            };
            let mut candidates = model.assets.iter().filter(|a| {
                a.kind == crate::authoring::AssetKind::UiImage
                    && a.relative_path == format!("game/{path}")
            });
            let asset = candidates.next()?;
            if candidates.next().is_some() {
                return None;
            }
            self.prepare_ui_image_reference(project, project_id, &asset.id, &asset.sha256, None)
                .ok()?;
            Some(Some(controls::ControlImageReference {
                asset_id: asset.id.clone(),
                expected_asset_sha256: asset.sha256.clone(),
                replacement_sha256: None,
            }))
        };
        Some((
            controls::ImageButtonAppearances {
                normal: read("idle")??,
                hover: read("hover")?,
                selected: read("selected_idle")?,
                selected_hover: read("selected_hover")?,
                disabled: read("insensitive")?,
                selected_disabled: read("selected_insensitive")?,
            },
            starts,
        ))
    }

    pub(super) fn imagebutton_values(
        &self,
        project: &ProjectId,
        project_id: &str,
        appearances: &controls::ImageButtonAppearances,
    ) -> Result<(BTreeMap<String, Option<String>>, Vec<FileMutation>), SceneError> {
        let mut values = BTreeMap::new();
        let mut metadata: Option<FileMutation> = None;
        let mut reviewed = BTreeMap::new();
        for (key, reference) in IMAGE_KEYS.iter().zip(image_references(appearances)) {
            let Some(reference) = reference else {
                values.insert((*key).into(), None);
                continue;
            };
            if let Some(previous) = reviewed.insert(&reference.asset_id, reference) {
                if previous != reference {
                    return Err(SceneError::InvalidPayload);
                }
            }
            let selected = self.prepare_ui_image_reference(
                project,
                project_id,
                &reference.asset_id,
                &reference.expected_asset_sha256,
                reference.replacement_sha256.as_deref(),
            )?;
            values.insert(
                (*key).into(),
                Some(serde_json::to_string(&selected.path).unwrap()),
            );
            if let Some(change) = selected.metadata {
                if let Some(combined) = &mut metadata {
                    if combined.base != change.base {
                        return Err(SceneError::SourceConflict);
                    }
                    // Existing asset owner prepares each review against the same metadata.
                    // Combine only that asset's accepted record into this one transaction.
                    let mut accepted: serde_json::Value =
                        serde_json::from_slice(&combined.proposed)
                            .map_err(|_| SceneError::InvalidMetadata)?;
                    let next: serde_json::Value = serde_json::from_slice(&change.proposed)
                        .map_err(|_| SceneError::InvalidMetadata)?;
                    let replacement = next["assets"]
                        .as_array()
                        .and_then(|a| a.iter().find(|a| a["id"] == reference.asset_id))
                        .ok_or(SceneError::InvalidMetadata)?;
                    let slot = accepted["assets"]
                        .as_array_mut()
                        .and_then(|a| a.iter_mut().find(|a| a["id"] == reference.asset_id))
                        .ok_or(SceneError::InvalidMetadata)?;
                    *slot = replacement.clone();
                    combined.proposed = serde_json::to_vec_pretty(&accepted)
                        .map_err(|_| SceneError::InvalidMetadata)?;
                    combined.proposed.push(b'\n');
                } else {
                    metadata = Some(change);
                }
            }
        }
        Ok((values, metadata.into_iter().collect()))
    }
}

/// Ren'Py interpolates through floating point. Admit only integers and differences
/// for which every unit step is representable; never round a submitted decimal.
pub(super) fn bounds(binding: &IntegerBarBinding) -> Result<(i64, i64), SceneError> {
    fn integer(raw: &str) -> Option<i64> {
        let n = raw.parse::<i64>().ok()?;
        (n.to_string() == raw && n.unsigned_abs() <= 9_007_199_254_740_991).then_some(n)
    }
    let lo = integer(&binding.minimum).ok_or(SceneError::InvalidPayload)?;
    let hi = integer(&binding.maximum).ok_or(SceneError::InvalidPayload)?;
    if hi <= lo || hi - lo > 9_007_199_254_740_991 {
        return Err(SceneError::InvalidPayload);
    }
    Ok((lo, hi))
}

pub(super) fn bar_values(
    binding: &IntegerBarBinding,
    appearance: &BarAppearance,
    variables: &[Variable],
) -> Result<BTreeMap<String, Option<String>>, SceneError> {
    bounds(binding)?;
    let variable = variables
        .iter()
        .find(|v| v.id == binding.variable_id && v.variable_type == VariableType::Int)
        .ok_or(SceneError::ReferenceBlocked)?;
    let mut result = BTreeMap::from([(
        "value".into(),
        Some(format!(
            "VariableValue({}, min={}, max={}, step=1, force_step=True)",
            serde_json::to_string(&variable.technical_name).unwrap(),
            binding.minimum,
            binding.maximum
        )),
    )]);
    for (key, value) in [
        ("left_bar", &appearance.left_bar),
        ("right_bar", &appearance.right_bar),
        ("thumb", &appearance.thumb),
    ] {
        if let Some(color) = value {
            if !color.starts_with('#')
                || !matches!(color.len(), 4 | 5 | 7 | 9)
                || !color[1..].bytes().all(|b| b.is_ascii_hexdigit())
            {
                return Err(SceneError::InvalidPayload);
            }
        }
        result.insert(
            key.into(),
            value.as_ref().map(|v| serde_json::to_string(v).unwrap()),
        );
    }
    Ok(result)
}

pub(super) fn bar_canvas(
    binding: &IntegerBarBinding,
    appearance: &BarAppearance,
    variables: &[Variable],
    samples: &BTreeMap<String, String>,
) -> Result<serde_json::Map<String, serde_json::Value>, SceneError> {
    bar_values(binding, appearance, variables)?;
    let (lo, hi) = bounds(binding)?;
    let sample = samples
        .get(&binding.variable_id)
        .ok_or(SceneError::ReferenceBlocked)?;
    // Arbitrary integer defaults and samples can be clamped as decimal integers
    // without converting them through JavaScript Number or floating point.
    let value = sample
        .parse::<i128>()
        .map(|v| v.clamp(lo as i128, hi as i128) as i64)
        .unwrap_or_else(|_| if sample.starts_with('-') { lo } else { hi });
    let mut p = serde_json::Map::new();
    p.insert("value".into(), (value - lo).into());
    p.insert("range".into(), (hi - lo).into());
    for (key, color) in [
        ("left_bar", &appearance.left_bar),
        ("right_bar", &appearance.right_bar),
        ("thumb", &appearance.thumb),
    ] {
        if let Some(color) = color {
            p.insert(key.into(), color.clone().into());
        }
    }
    Ok(p)
}

impl AuthoringService {
    pub(super) fn imagebutton_canvas(
        &self,
        project: &ProjectId,
        project_id: &str,
        appearances: &controls::ImageButtonAppearances,
        properties: &mut serde_json::Map<String, serde_json::Value>,
        dependencies: &mut Vec<(String, String)>,
    ) -> Result<(), SceneError> {
        let (values, _) = self.imagebutton_values(project, project_id, appearances)?;
        for ((key, value), reference) in IMAGE_KEYS
            .iter()
            .map(|k| (*k, values.get(*k).unwrap()))
            .zip(image_references(appearances))
        {
            if let Some(value) = value {
                let path: String =
                    serde_json::from_str(value).map_err(|_| SceneError::ImageInvalid)?;
                let reference = reference.unwrap();
                dependencies.push((
                    format!("game/{path}"),
                    reference
                        .replacement_sha256
                        .as_ref()
                        .unwrap_or(&reference.expected_asset_sha256)
                        .clone(),
                ));
                properties.insert(key.into(), path.into());
            }
        }
        Ok(())
    }
}

struct Property {
    expression: Span,
    statement: Span,
    raw: String,
}

fn properties(
    bytes: &[u8],
    node: &Node,
    keys: &[&str],
) -> Result<BTreeMap<String, Property>, SceneError> {
    let lines = source_lines(bytes)?;
    let index = lines
        .binary_search_by_key(&node.span.start, |l| l.start)
        .map_err(|_| SceneError::OpaqueBoundary)?;
    let header = &lines[index];
    let mut result = BTreeMap::new();
    for (i, line) in lines
        .iter()
        .enumerate()
        .skip(index + 1)
        .take_while(|(_, l)| l.start < node.source_end)
    {
        if line.indent != header.indent + 4 {
            continue;
        }
        let key = line.code.split_whitespace().next().unwrap_or("");
        if !keys.contains(&key) {
            continue;
        }
        if !line.single
            || lines
                .get(i + 1)
                .is_some_and(|next| next.indent > line.indent)
            || result.contains_key(key)
        {
            return Err(SceneError::OpaqueBoundary);
        }
        let raw = line.code[key.len()..].trim();
        let start = line.start + line.indent + line.code.len() - raw.len();
        result.insert(
            key.into(),
            Property {
                expression: Span {
                    start,
                    end: start + raw.len(),
                },
                statement: Span {
                    start: line.start,
                    end: line.end,
                },
                raw: raw.into(),
            },
        );
    }
    Ok(result)
}

pub(super) fn inspect_bar(
    bytes: &[u8],
    node: &Node,
    variables: &[Variable],
) -> Option<(IntegerBarBinding, BarAppearance, Vec<usize>)> {
    if node.kind != "bar" {
        return None;
    }
    let p = properties(bytes, node, BAR_KEYS).ok()?;
    let expression = BarExpression::parse(&p.get("value")?.raw)?;
    let variable = variables
        .iter()
        .find(|v| v.technical_name == expression.name && v.variable_type == VariableType::Int)?;
    let binding = IntegerBarBinding {
        variable_id: variable.id.clone(),
        minimum: expression.minimum,
        maximum: expression.maximum,
    };
    let read = |key| -> Option<Option<String>> {
        match p.get(key) {
            Some(v) => Some(Some(serde_json::from_str(&v.raw).ok()?)),
            None => Some(None),
        }
    };
    let appearance = BarAppearance {
        left_bar: read("left_bar")?,
        right_bar: read("right_bar")?,
        thumb: read("thumb")?,
    };
    bar_values(&binding, &appearance, variables).ok()?;
    Some((
        binding,
        appearance,
        p.values().map(|v| v.statement.start).collect(),
    ))
}

pub(super) fn image_paths(
    bytes: &[u8],
    node: &Node,
) -> Option<(BTreeMap<String, String>, Vec<usize>)> {
    if node.kind != "imagebutton" {
        return None;
    }
    let p = properties(bytes, node, IMAGE_KEYS).ok()?;
    if !p.contains_key("idle") {
        return None;
    }
    let values = p
        .iter()
        .map(|(k, v)| {
            let expression = ImageExpression::parse(&v.raw)?;
            let numeric = node.numeric_layout.as_ref()?;
            if numeric.values.get("xsize")?.value != expression.width as f64
                || numeric.values.get("ysize")?.value != expression.height as f64
            {
                return None;
            }
            Some((k.clone(), expression.path))
        })
        .collect::<Option<_>>()?;
    Some((values, p.values().map(|v| v.statement.start).collect()))
}

pub(super) fn patch(
    bytes: &[u8],
    node: &Node,
    values: &BTreeMap<String, Option<String>>,
) -> Result<Vec<u8>, SceneError> {
    let keys = values.keys().map(String::as_str).collect::<Vec<_>>();
    let current = properties(bytes, node, &keys)?;
    let lines = source_lines(bytes)?;
    let header = lines
        .iter()
        .find(|l| l.start == node.span.start)
        .ok_or(SceneError::OpaqueBoundary)?;
    let newline = if bytes.windows(2).any(|w| w == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let mut insert = String::new();
    let mut edits = vec![];
    for (key, value) in values {
        match (current.get(key), value) {
            (Some(old), Some(value)) if !same_expression(key, &old.raw, value) => {
                edits.push((old.expression.start, old.expression.end, value.clone()))
            }
            (Some(old), None) => {
                // Keep inline comments and their spacing when removing a property.
                let start = old.statement.start + header.indent + 4;
                edits.push((start, old.expression.end, "pass".into()));
            }
            (None, Some(value)) => insert.push_str(&format!(
                "{}{key} {value}{newline}",
                " ".repeat(header.indent + 4)
            )),
            _ => {}
        }
    }
    if !insert.is_empty() {
        edits.push((header.end, header.end, insert));
    }
    edits.sort_by_key(|e| std::cmp::Reverse(e.0));
    let mut source = bytes.to_vec();
    for (start, end, value) in edits {
        source.splice(start..end, value.bytes());
    }
    Ok(source)
}

#[derive(PartialEq)]
struct BarExpression {
    name: String,
    minimum: String,
    maximum: String,
}

impl BarExpression {
    fn parse(raw: &str) -> Option<Self> {
        let expression = raw.strip_prefix("VariableValue(")?.strip_suffix(')')?;
        let args = expression.split(',').map(str::trim).collect::<Vec<_>>();
        if args.len() != 5 || args[3] != "step=1" || args[4] != "force_step=True" {
            return None;
        }
        Some(Self {
            name: serde_json::from_str(args[0]).ok()?,
            minimum: args[1].strip_prefix("min=")?.into(),
            maximum: args[2].strip_prefix("max=")?.into(),
        })
    }
}

#[derive(PartialEq)]
struct ImageExpression {
    path: String,
    width: u32,
    height: u32,
}

impl ImageExpression {
    fn parse(raw: &str) -> Option<Self> {
        let expression = raw.strip_prefix("Transform(")?.strip_suffix(')')?;
        let (path, size) = expression.rsplit_once(", xysize=(")?;
        let (width, height) = size.strip_suffix(')')?.split_once(',')?;
        let dimension = |raw: &str| {
            let raw = raw.trim();
            let n = raw.parse::<u32>().ok()?;
            (n > 0 && n <= MAX_PIXELS && n.to_string() == raw).then_some(n)
        };
        Some(Self {
            path: serde_json::from_str(path).ok()?,
            width: dimension(width)?,
            height: dimension(height)?,
        })
    }
}

fn same_expression(key: &str, before: &str, after: &str) -> bool {
    if before == after {
        return true;
    }
    if key == "value" {
        BarExpression::parse(before)
            .zip(BarExpression::parse(after))
            .is_some_and(|(a, b)| a == b)
    } else if IMAGE_KEYS.contains(&key) {
        ImageExpression::parse(before)
            .zip(ImageExpression::parse(after))
            .is_some_and(|(a, b)| a == b)
    } else {
        serde_json::from_str::<String>(before)
            .ok()
            .zip(serde_json::from_str::<String>(after).ok())
            .is_some_and(|(a, b)| a == b)
    }
}

pub(super) fn prepare(
    bytes: &[u8],
    screen: &Screen,
    source_path: &str,
    kind: &str,
    target: &Node,
    addition: bool,
    mut values: BTreeMap<String, Option<String>>,
    width: u32,
    height: u32,
    mut layout: BTreeMap<String, Option<layout::NumericValue>>,
) -> Result<(Vec<u8>, String), SceneError> {
    if width == 0
        || height == 0
        || width > MAX_PIXELS
        || height > MAX_PIXELS
        || layout.contains_key("xsize")
        || layout.contains_key("ysize")
    {
        return Err(SceneError::InvalidPayload);
    }
    if kind == "imagebutton" {
        for value in values.values_mut().flatten() {
            *value = format!("Transform({value}, xysize=({width}, {height}))");
        }
    }
    let id = if addition {
        uuid::Uuid::new_v4().to_string()
    } else {
        target.id.clone().ok_or(SceneError::OpaqueBoundary)?
    };
    let mut source = bytes.to_vec();
    if addition {
        if !composition::can_add(screen, target, kind) {
            return Err(SceneError::OpaqueBoundary);
        }
        let indent = bytes[target.span.start..]
            .iter()
            .take_while(|b| **b == b' ')
            .count()
            + 4;
        let newline = if bytes.windows(2).any(|w| w == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let mut block = format!(
            "{}{kind}: # loomlight-element: {id}{newline}",
            " ".repeat(indent)
        );
        if kind == "imagebutton" {
            block.push_str(&format!("{}action Null(){newline}", " ".repeat(indent + 4)));
        }
        if target.source_end > 0 && bytes[target.source_end - 1] != b'\n' {
            block.insert_str(0, newline);
        }
        source.splice(target.source_end..target.source_end, block.bytes());
    } else if target.kind != kind {
        return Err(SceneError::OpaqueBoundary);
    }
    let locate = |source: &[u8]| -> Result<Node, SceneError> {
        inspect(source, source_path.into(), String::new())?
            .screens
            .into_iter()
            .find(|s| s.name == screen.name)
            .and_then(|s| s.nodes.into_iter().find(|n| n.id.as_ref() == Some(&id)))
            .ok_or(SceneError::InvariantBlocked)
    };
    source = patch(&source, &locate(&source)?, &values)?;
    let node = locate(&source)?;
    for (key, value) in [("xsize", width), ("ysize", height)] {
        layout.insert(
            key.into(),
            Some(layout::NumericValue {
                unit: layout::Unit::Pixels,
                value: value as f64,
            }),
        );
    }
    source = node
        .numeric_layout
        .as_ref()
        .ok_or(SceneError::OpaqueBoundary)?
        .patch(&source, &layout)?;
    Ok((source, id))
}
