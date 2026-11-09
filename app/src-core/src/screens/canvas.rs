//! A source-derived, data-only description. No project expressions enter the helper.
pub use super::controls::ControlButtonState as ButtonState;
use super::*;
use serde_json::{Map, Value};

#[cfg(test)]
#[path = "base_help_canvas_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "nested_canvas_tests.rs"]
mod nested_tests;

#[cfg(test)]
#[path = "sample_fidelity_tests.rs"]
mod sample_tests;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    pub path: String,
    pub screen_name: String,
    pub expected_revision: String,
    pub width: u32,
    pub height: u32,
    #[serde(default)]
    pub drafts: Vec<Draft>,
    #[serde(default)]
    pub positions: Vec<PositionDraft>,
    #[serde(default)]
    pub layouts: Vec<LayoutDraft>,
    #[serde(default)]
    pub text_samples: Vec<TextSample>,
    #[serde(default)]
    pub variable_samples: Vec<interaction::VariableSample>,
    #[serde(default)]
    pub button_state: ButtonState,
    #[serde(default)]
    pub addition: Option<Addition>,
    #[serde(default)]
    pub image_samples: Vec<ImageDraft>,
    #[serde(default)]
    pub image_addition: Option<ImageDraft>,
    #[serde(default)]
    pub text_styles: Vec<TextStyleDraft>,
    #[serde(default)]
    pub bar_samples: Vec<controls::BarDraft>,
    #[serde(default)]
    pub bar_addition: Option<controls::BarDraft>,
    #[serde(default)]
    pub image_button_samples: Vec<controls::ImageButtonDraft>,
    #[serde(default)]
    pub image_button_addition: Option<controls::ImageButtonDraft>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TextStyleDraft {
    pub node_start: usize,
    pub values: text::TextEdits,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImageDraft {
    #[serde(default)]
    pub node_start: Option<usize>,
    #[serde(default)]
    pub parent_start: Option<usize>,
    pub asset_id: String,
    pub expected_asset_sha256: String,
    #[serde(default)]
    pub replacement_sha256: Option<String>,
    pub width: u32,
    pub height: u32,
    #[serde(default)]
    pub layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Addition {
    pub parent_start: usize,
    pub kind: String,
    pub text: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TextSample {
    pub node_start: usize,
    pub value: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Draft {
    pub node_start: usize,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PositionDraft {
    pub node_start: usize,
    pub xalign: f64,
    pub yalign: f64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LayoutDraft {
    pub node_start: usize,
    pub values: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub revision: String,
    pub width: u32,
    pub height: u32,
    pub available: bool,
    pub limits: Vec<String>,
    pub nodes: Vec<CanvasNode>,
    pub button_state: ButtonState,
    #[serde(skip_serializing)]
    pub(crate) dependencies: Vec<(String, String)>,
    #[serde(skip_serializing)]
    pub(crate) script_files: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasNode {
    pub start: usize,
    pub parent: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selection_start: Option<usize>,
    pub kind: String,
    pub literal: Option<String>,
    pub properties: Map<String, Value>,
}

struct Expansion<'a> {
    inventory: &'a ownership::Inventory,
    variables: &'a [crate::authoring::Variable],
    values: &'a std::collections::BTreeMap<String, String>,
    remaining: usize,
    components: std::collections::BTreeMap<(String, usize), Plan>,
}

impl AuthoringService {
    pub fn screens_canvas_plan(
        &self,
        project: &ProjectId,
        request: Request,
    ) -> Result<Plan, SceneError> {
        let inventory = self.screen_inventory(project)?;
        let (_, authoring_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(".renpy-editor/authoring.json").unwrap(),
            )
            .map_err(|_| SceneError::SourceConflict)?;
        let authoring = self
            .screen_action_authoring(project, &inventory.source_map.project_id)
            .ok();
        let variables = authoring
            .as_ref()
            .map(|snapshot| snapshot.variables.as_slice())
            .unwrap_or(&[]);
        if request.variable_samples.len() > MAX_NODES {
            return Err(SceneError::InvalidPayload);
        }
        let mut values = std::collections::BTreeMap::new();
        for sample in &request.variable_samples {
            if values.contains_key(&sample.variable_id) {
                return Err(SceneError::InvalidPayload);
            }
            let value = bindings::resolve_sample(
                &interaction::VariableBinding {
                    variable_id: sample.variable_id.clone(),
                },
                variables,
                Some(sample),
            )?;
            values.insert(sample.variable_id.clone(), value);
        }
        for variable in variables {
            if !values.contains_key(&variable.id) {
                values.insert(
                    variable.id.clone(),
                    bindings::resolve_sample(
                        &interaction::VariableBinding {
                            variable_id: variable.id.clone(),
                        },
                        variables,
                        None,
                    )?,
                );
            }
        }
        let mut expansion = Expansion {
            inventory: &inventory,
            variables,
            values: &values,
            remaining: MAX_NODES,
            components: std::collections::BTreeMap::new(),
        };
        let mut plan = self.canvas_plan(project, request, &[], &mut expansion)?;
        plan.dependencies.push((
            ".renpy-editor/authoring.json".into(),
            authoring_revision.sha256.clone(),
        ));
        for variable in variables {
            if plan.dependencies.iter().any(|(path, hash)| {
                path == &variable.source.path && hash != &variable.source.source_revision
            }) {
                return Err(SceneError::SourceConflict);
            }
            plan.dependencies.push((
                variable.source.path.clone(),
                variable.source.source_revision.clone(),
            ));
        }
        let (_, current_authoring) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(".renpy-editor/authoring.json").unwrap(),
            )
            .map_err(|_| SceneError::SourceConflict)?;
        if current_authoring.sha256 != authoring_revision.sha256 {
            return Err(SceneError::SourceConflict);
        }
        plan.dependencies.sort();
        plan.dependencies.dedup();
        let (_, metadata_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(".renpy-editor/source-map.json").unwrap(),
            )
            .map_err(|_| SceneError::SourceConflict)?;
        if metadata_revision.sha256 != inventory.source_map_revision {
            return Err(SceneError::SourceConflict);
        }
        Ok(plan)
    }

    fn canvas_plan(
        &self,
        project: &ProjectId,
        request: Request,
        active_components: &[String],
        expansion: &mut Expansion<'_>,
    ) -> Result<Plan, SceneError> {
        let style_inventory = expansion.inventory;
        if request.width == 0
            || request.height == 0
            || request.width > 1920
            || request.height > 1080
            || request.drafts.len() > MAX_NODES
            || request.positions.len() > MAX_NODES
            || request.layouts.len() > MAX_NODES
            || request.text_samples.len() > MAX_NODES
            || request.image_samples.len() > MAX_NODES
            || request.text_styles.len() > MAX_NODES
            || request.bar_samples.len() > MAX_NODES
            || request.image_button_samples.len() > MAX_NODES
            || [
                request.addition.is_some(),
                request.image_addition.is_some(),
                request.bar_addition.is_some(),
                request.image_button_addition.is_some(),
            ]
            .into_iter()
            .filter(|v| *v)
            .count()
                > 1
        {
            return Err(SceneError::InvalidPayload);
        }
        let (bytes, revision) = self
            .transactions
            .snapshot(project, read_path(&request.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let source_path = request.path.clone();
        if style_inventory
            .files
            .iter()
            .find(|(p, _)| p == &source_path)
            .map(|(_, b)| b)
            != Some(&bytes)
        {
            return Err(SceneError::SourceConflict);
        }
        let style_index = super::styles::Index::read(&style_inventory)?;
        let mut document = self.owned_screen_document_with_inventory(
            project,
            &bytes,
            request.path,
            revision.sha256.clone(),
            Some(&style_inventory),
            None,
        )?;
        style_index.resolve(&mut document, &bytes)?;
        let screen = document
            .screens
            .into_iter()
            .find(|s| s.name == request.screen_name)
            .ok_or(SceneError::UnsupportedSource)?;
        let mut plan = Plan {
            revision: revision.sha256,
            width: request.width,
            height: request.height,
            available: true,
            limits: vec![],
            nodes: vec![],
            button_state: request.button_state,
            dependencies: vec![],
            script_files: vec![],
        };
        let source = source_lines(&bytes)?;
        for node in &screen.nodes {
            let image_draft = request
                .image_button_samples
                .iter()
                .any(|s| s.node_start == Some(node.span.start))
                && control_source::image_paths(&bytes, node).is_some();
            if expansion.remaining == 0 {
                plan.limits.push("Expanded component node limit".into());
                break;
            }
            expansion.remaining -= 1;
            let mut properties = Map::new();
            // Read only direct, single-line properties. The shared source parser owns
            // node boundaries; unsupported blocks are never flattened into children.
            let text = std::str::from_utf8(&bytes[node.span.start..node.span.end])
                .map_err(|_| SceneError::UnsupportedSource)?;
            let mut lines = text.lines();
            let header = lines.next().unwrap_or("");
            let indent = header.len() - header.trim_start().len() + 4;
            for span in &node.protected {
                if let Some(line) = source.iter().find(|line| line.start == span.start) {
                    if line.indent != indent
                        || kind(line).is_some()
                            && !screen
                                .nodes
                                .iter()
                                .any(|child| child.span.start == line.start)
                    {
                        plan.limits
                            .push(format!("Source-only statement at {}", line.start));
                    }
                }
            }
            for line in lines {
                let depth = line.len() - line.trim_start_matches(' ').len();
                if depth != indent {
                    continue;
                }
                let line = code(line.trim_start());
                if line.is_empty()
                    || line == "pass"
                    || screen.nodes.iter().any(|child| {
                        child.kind == "use"
                            && child.parent_start == Some(node.span.start)
                            && source
                                .iter()
                                .any(|entry| entry.start == child.span.start && entry.code == line)
                    })
                    || kind(&Line {
                        end: 0,
                        element_id: None,
                        start: 0,
                        indent: 0,
                        code: line,
                        single: true,
                    })
                    .is_some()
                {
                    continue;
                }
                let Some((key, raw)) = line.split_once(char::is_whitespace) else {
                    plan.limits
                        .push(format!("Source-only statement at {}", node.span.start));
                    continue;
                };
                if matches!(key, "key" | "default_focus")
                    && source.iter().any(|entry| {
                        entry.start > node.span.start
                            && entry.start < node.source_end
                            && entry.indent == indent
                            && entry.code == line
                            && !node.protected.iter().any(|span| span.start == entry.start)
                    })
                {
                    continue;
                }
                if matches!(key, "style" | "text_style")
                    && node.style.as_ref().is_some_and(|s| s.error.is_none())
                {
                    continue;
                }
                if matches!(key, "id" | "modal" | "action" | "hovered" | "unhovered") {
                    continue;
                }
                if node.numeric_layout.is_some() && !layout::aliases(key).is_empty() {
                    continue;
                }
                if node.kind == "bar"
                    && control_source::BAR_KEYS.contains(&key)
                    && node.bar_binding.is_some()
                    || node.kind == "imagebutton"
                        && control_source::IMAGE_KEYS.contains(&key)
                        && (node.image_button_appearances.is_some() || image_draft)
                {
                    continue;
                }
                if node.text_properties.is_some()
                    && super::text::FIELDS
                        .iter()
                        .any(|k| super::text::keyword(&node.kind, k) == key)
                {
                    continue;
                }
                if node.kind == "grid"
                    && key == "allow_underfull"
                    && matches!(raw.trim(), "True" | "False")
                    && !properties.contains_key(key)
                {
                    properties.insert(key.into(), Value::Bool(raw.trim() == "True"));
                    continue;
                }
                let value = if key == "padding" {
                    raw.trim()
                        .strip_prefix('(')
                        .and_then(|s| s.strip_suffix(')'))
                        .and_then(|s| {
                            let values = s
                                .split(',')
                                .filter(|s| !s.trim().is_empty())
                                .map(|s| serde_json::from_str::<Value>(s.trim()))
                                .collect::<Result<Vec<_>, _>>()
                                .ok()?;
                            (matches!(values.len(), 2 | 4)
                                && values.iter().all(|v| {
                                    v.as_f64().is_some_and(|n| {
                                        n.is_finite() && n >= 0.0 && n <= MAX_PIXELS as f64
                                    })
                                }))
                            .then_some(Value::Array(values))
                        })
                } else {
                    serde_json::from_str::<Value>(raw.trim()).ok()
                };
                let valid = match (key, &value) {
                    (
                        "xsize" | "ysize" | "size" | "text_size" | "spacing" | "xpos" | "ypos"
                        | "xanchor" | "yanchor" | "xalign" | "yalign",
                        Some(Value::Number(n)),
                    ) => n
                        .as_f64()
                        .is_some_and(|v| v.is_finite() && v >= 0.0 && v <= MAX_PIXELS as f64),
                    ("padding", Some(Value::Array(_))) => true,
                    (key, Some(Value::String(s)))
                        if matches!(
                            key,
                            "color"
                                | "text_color"
                                | "background"
                                | "hover_background"
                                | "hover_color"
                                | "hover_text_color"
                        ) || node.kind == "bar"
                            && node.bar_binding.is_some()
                            && control_source::BAR_STATE_KEYS.contains(&key) =>
                    {
                        s.starts_with('#')
                            && matches!(s.len(), 4 | 5 | 7 | 9)
                            && s[1..].bytes().all(|c| c.is_ascii_hexdigit())
                    }
                    ("font" | "text_font", Some(Value::String(s))) => {
                        RelativePath::new(format!("game/{s}")).is_ok()
                    }
                    _ => false,
                };
                if valid && !properties.contains_key(key) {
                    properties.insert(key.into(), value.unwrap());
                } else {
                    plan.limits
                        .push(format!("Unresolved {key} at {}", node.span.start));
                }
            }
            if let Some(reference) = &node.style {
                if let Some(error) = &reference.error {
                    plan.limits.push(error.clone());
                }
                if node.kind == "textbutton"
                    && style_index
                        .catalog("")
                        .definitions
                        .iter()
                        .any(|d| d.name == reference.name && d.kind == "textbutton")
                {
                    properties.insert("text_style".into(), Value::String("button".into()));
                }
            }
            if let Some(typography) = &node.text_properties {
                for (key, value) in &typography.values {
                    properties.insert(super::text::keyword(&node.kind, key), value.clone());
                }
                for key in typography.blocked.keys() {
                    plan.limits
                        .push(format!("Unresolved text {key} at {}", node.span.start));
                }
            }
            if let Some(numeric) = &node.numeric_layout {
                match numeric.canvas_properties() {
                    Ok(values) => properties.extend(values),
                    Err(fields) => plan
                        .limits
                        .push(format!("Unresolved {fields} at {}", node.span.start)),
                }
            }
            if node.kind == "bar" {
                if let Some(binding) = node.bar_binding.as_ref() {
                    properties.extend(control_source::bar_canvas(
                        binding,
                        node.bar_appearance.as_ref().unwrap(),
                        expansion.variables,
                        expansion.values,
                    )?);
                } else {
                    plan.limits
                        .push(format!("Unresolved bar binding at {}", node.span.start));
                }
            }
            if node.kind == "imagebutton" && !image_draft {
                if let Some(appearances) = node.image_button_appearances.as_ref() {
                    self.imagebutton_canvas(
                        project,
                        &style_inventory.source_map.project_id,
                        appearances,
                        &mut properties,
                        &mut plan.dependencies,
                    )?;
                    imagebutton_dimensions(node, &mut properties)?;
                } else {
                    plan.limits.push(format!(
                        "Unresolved image-button appearances at {}",
                        node.span.start
                    ));
                }
            }
            let binding = bindings::inspect_bindings(node, expansion.variables);
            let literal = bindings::resolve_template(node, expansion.variables, expansion.values)?
                .or_else(|| node.literal.clone());
            if binding.is_none()
                && matches!(node.kind.as_str(), "text" | "textbutton")
                && node
                    .literal
                    .as_ref()
                    .is_some_and(|s| s.contains(['{', '[']))
            {
                plan.limits.push(format!(
                    "Text tags or interpolation need a supported sample mapping at {}",
                    node.span.start
                ));
            }
            plan.nodes.push(CanvasNode {
                start: node.span.start,
                parent: node.parent_start,
                selection_start: None,
                kind: node.kind.clone(),
                literal,
                properties,
            });
        }
        let mut seen = HashSet::new();
        for draft in request.drafts {
            if !seen.insert(draft.node_start)
                || draft.width == 0
                || draft.height == 0
                || draft.width > MAX_PIXELS
                || draft.height > MAX_PIXELS
            {
                return Err(SceneError::InvalidPayload);
            }
            let node = plan
                .nodes
                .iter_mut()
                .find(|n| n.start == draft.node_start && n.kind != "screen")
                .ok_or(SceneError::InvalidPayload)?;
            if node.kind == "imagebutton" {
                return Err(SceneError::OpaqueBoundary);
            }
            node.properties.insert("xsize".into(), draft.width.into());
            node.properties.insert("ysize".into(), draft.height.into());
        }
        let mut positioned = HashSet::new();
        for draft in request.positions {
            if !positioned.insert(draft.node_start)
                || ![draft.xalign, draft.yalign]
                    .iter()
                    .all(|v| v.is_finite() && (0.0..=1.0).contains(v))
                || !screen
                    .nodes
                    .iter()
                    .any(|n| n.span.start == draft.node_start && n.position.is_some())
            {
                return Err(SceneError::InvalidPayload);
            }
            let node = plan
                .nodes
                .iter_mut()
                .find(|n| n.start == draft.node_start)
                .ok_or(SceneError::InvalidPayload)?;
            node.properties.insert("xalign".into(), draft.xalign.into());
            node.properties.insert("yalign".into(), draft.yalign.into());
        }
        let mut sampled = HashSet::new();
        let mut layouts = HashSet::new();
        let mut image_layouts = std::collections::BTreeMap::new();
        let mut control_layouts = std::collections::BTreeMap::new();
        let control_start = screen.nodes.iter().map(|n| n.span.end).max().unwrap_or(0) + 1;
        for draft in request.layouts {
            if !layouts.insert(draft.node_start)
                || seen.contains(&draft.node_start)
                || positioned.contains(&draft.node_start)
            {
                return Err(SceneError::InvalidPayload);
            }
            if request
                .bar_samples
                .iter()
                .any(|s| s.node_start == Some(draft.node_start))
                || request
                    .image_button_samples
                    .iter()
                    .any(|s| s.node_start == Some(draft.node_start))
                || (draft.node_start == control_start
                    && (request.bar_addition.is_some() || request.image_button_addition.is_some()))
            {
                if draft.values.contains_key("xsize") || draft.values.contains_key("ysize") {
                    return Err(SceneError::InvalidPayload);
                }
                control_layouts.insert(draft.node_start, draft.values);
                continue;
            }
            if request
                .image_samples
                .iter()
                .any(|sample| sample.node_start == Some(draft.node_start))
            {
                image_layouts.insert(draft.node_start, draft.values);
                continue;
            }
            let numeric = screen
                .nodes
                .iter()
                .find(|node| node.span.start == draft.node_start)
                .filter(|node| {
                    !draft
                        .values
                        .keys()
                        .any(|k| control_source::image_button_size_field(&node.kind, k))
                })
                .and_then(|node| node.numeric_layout.as_ref())
                .ok_or(SceneError::InvalidPayload)?;
            let values = numeric.changed(&draft.values)?;
            let node = plan
                .nodes
                .iter_mut()
                .find(|node| node.start == draft.node_start)
                .ok_or(SceneError::InvalidPayload)?;
            node.properties
                .retain(|key, _| layout::aliases(key).is_empty());
            node.properties
                .extend(values.into_iter().map(|(key, value)| (key, value.json())));
        }
        for sample in request.text_samples {
            if !sampled.insert(sample.node_start) || sample.value.len() > 8192 {
                return Err(SceneError::InvalidPayload);
            }
            let node = plan
                .nodes
                .iter_mut()
                .find(|n| {
                    n.start == sample.node_start && matches!(n.kind.as_str(), "text" | "textbutton")
                })
                .ok_or(SceneError::InvalidPayload)?;
            if sample.value.contains('{') {
                plan.limits.push(format!(
                    "Text sample tags need a supported mapping at {}",
                    sample.node_start
                ));
            }
            node.literal = Some(sample.value);
        }
        if let Some(addition) = request.addition {
            let parent = screen
                .nodes
                .iter()
                .find(|n| n.span.start == addition.parent_start)
                .ok_or(SceneError::InvalidPayload)?;
            if matches!(addition.kind.as_str(), "image" | "use")
                || !composition::can_add(&screen, parent, &addition.kind)
                || addition.text.len() > 8192
                || addition.text.contains('\0')
                || plan.nodes.len() >= MAX_NODES
            {
                return Err(SceneError::InvalidPayload);
            }
            let literal =
                matches!(addition.kind.as_str(), "text" | "textbutton").then_some(addition.text);
            if literal.as_ref().is_some_and(|s| s.contains(['{', '['])) {
                plan.limits
                    .push("Draft text requires supported literal text mapping.".into());
            }
            let mut properties = Map::new();
            if addition.kind == "grid" {
                properties.insert("columns".into(), 2.into());
                properties.insert("rows".into(), 2.into());
                properties.insert("allow_underfull".into(), true.into());
            }
            plan.nodes.push(CanvasNode {
                start: screen.nodes.iter().map(|n| n.span.end).max().unwrap_or(0) + 1,
                parent: Some(parent.span.start),
                selection_start: None,
                kind: addition.kind,
                literal,
                properties,
            });
        }
        if !request.image_samples.is_empty() || request.image_addition.is_some() {
            let (project_bytes, _) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(".renpy-editor/project.json").unwrap(),
                )
                .map_err(|_| SceneError::InvalidMetadata)?;
            let project_id = crate::metadata::ProjectMetadata::read_bytes(&project_bytes, None)
                .map_err(|_| SceneError::InvalidMetadata)?
                .project_id;
            let mut seen_images = HashSet::new();
            for (addition, sample) in request
                .image_samples
                .into_iter()
                .map(|s| (false, s))
                .chain(request.image_addition.into_iter().map(|s| (true, s)))
            {
                let selection = self.prepare_ui_image_reference(
                    project,
                    &project_id,
                    &sample.asset_id,
                    &sample.expected_asset_sha256,
                    sample.replacement_sha256.as_deref(),
                )?;
                plan.dependencies.push((
                    format!("game/{}", selection.path),
                    sample
                        .replacement_sha256
                        .clone()
                        .unwrap_or(sample.expected_asset_sha256),
                ));
                let (index, prepared) = if addition {
                    if sample.node_start.is_some() || plan.nodes.len() >= MAX_NODES {
                        return Err(SceneError::InvalidPayload);
                    }
                    let parent_start = sample.parent_start.ok_or(SceneError::InvalidPayload)?;
                    let parent = screen
                        .nodes
                        .iter()
                        .find(|n| n.span.start == parent_start)
                        .ok_or(SceneError::InvalidPayload)?;
                    for key in sample.layout.keys() {
                        if !["xpos", "ypos", "xanchor", "yanchor"].contains(&key.as_str())
                            || parent.kind == "grid"
                            || parent.kind == "vbox" && key.starts_with('y')
                            || parent.kind == "hbox" && key.starts_with('x')
                        {
                            return Err(SceneError::InvalidPayload);
                        }
                    }
                    let prepared = super::images::prepare(
                        &bytes,
                        &screen,
                        &source_path,
                        super::images::Target::Addition { parent },
                        super::images::Change {
                            path: &selection.path,
                            width: sample.width,
                            height: sample.height,
                            layout: sample.layout,
                        },
                    )?;
                    plan.nodes.push(CanvasNode {
                        start: screen.nodes.iter().map(|n| n.span.end).max().unwrap_or(0) + 1,
                        parent: Some(parent_start),
                        selection_start: None,
                        kind: "image".into(),
                        literal: None,
                        properties: Map::new(),
                    });
                    (plan.nodes.len() - 1, prepared)
                } else {
                    let start = sample.node_start.ok_or(SceneError::InvalidPayload)?;
                    if !seen_images.insert(start) {
                        return Err(SceneError::InvalidPayload);
                    }
                    let mut index = plan
                        .nodes
                        .iter()
                        .position(|n| n.start == start && n.kind == "image")
                        .ok_or(SceneError::InvalidPayload)?;
                    let owned = self.owned_screen_document(
                        project,
                        &bytes,
                        source_path.clone(),
                        plan.revision.clone(),
                    )?;
                    let original = owned
                        .screens
                        .iter()
                        .find(|s| s.name == screen.name)
                        .ok_or(SceneError::InvalidPayload)?;
                    let node = original
                        .nodes
                        .iter()
                        .find(|n| n.span.start == start && n.id.is_some())
                        .ok_or(SceneError::OpaqueBoundary)?;
                    let parent_id = sample
                        .parent_start
                        .map(|parent_start| {
                            original
                                .nodes
                                .iter()
                                .find(|n| n.span.start == parent_start)
                                .ok_or(SceneError::InvalidPayload)?
                                .id
                                .as_deref()
                                .ok_or(SceneError::OpaqueBoundary)
                        })
                        .transpose()?;
                    let mut edits = image_layouts.remove(&start).unwrap_or_default();
                    edits.extend(sample.layout);
                    let prepared = super::images::prepare(
                        &bytes,
                        original,
                        &source_path,
                        super::images::Target::Existing { node, parent_id },
                        super::images::Change {
                            path: &selection.path,
                            width: sample.width,
                            height: sample.height,
                            layout: edits,
                        },
                    )?;
                    if prepared.reparented {
                        let mut moved = plan.nodes.remove(index);
                        moved.parent = prepared.parent_start;
                        plan.nodes.push(moved);
                        index = plan.nodes.len() - 1;
                    }
                    (index, prepared)
                };
                plan.nodes[index].literal = Some(selection.path);
                plan.nodes[index]
                    .properties
                    .retain(|key, _| layout::aliases(key).is_empty());
                plan.nodes[index]
                    .properties
                    .extend(prepared.values.into_iter().map(|(k, v)| (k, v.json())));
            }
        }
        if !request.text_styles.is_empty() {
            let (project_bytes, _) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(".renpy-editor/project.json").unwrap(),
                )
                .map_err(|_| SceneError::InvalidMetadata)?;
            let project_id = crate::metadata::ProjectMetadata::read_bytes(&project_bytes, None)
                .map_err(|_| SceneError::InvalidMetadata)?
                .project_id;
            let mut seen = HashSet::new();
            for sample in request.text_styles {
                if !seen.insert(sample.node_start) {
                    return Err(SceneError::InvalidPayload);
                }
                let original = screen
                    .nodes
                    .iter()
                    .find(|n| n.span.start == sample.node_start)
                    .ok_or(SceneError::InvalidPayload)?;
                let typography = original
                    .text_properties
                    .as_ref()
                    .ok_or(SceneError::InvalidPayload)?;
                let changes = self.resolve_text_edits(project, &project_id, &sample.values)?;
                typography.patch(&bytes, original, &sample.values, changes.clone())?;
                let node = plan
                    .nodes
                    .iter_mut()
                    .find(|n| n.start == sample.node_start)
                    .ok_or(SceneError::InvalidPayload)?;
                for (key, value) in changes {
                    let key = super::text::keyword(&node.kind, &key);
                    if let Some(value) = value {
                        node.properties.insert(key, value);
                    } else {
                        node.properties.remove(&key);
                    }
                }
                if let Some(text) = sample.values.text {
                    let mut draft = original.clone();
                    draft.literal = Some(text.clone());
                    let literal =
                        bindings::resolve_template(&draft, expansion.variables, expansion.values)?;
                    if literal.is_none() && text.contains(['{', '[']) {
                        plan.limits
                            .push("Draft text requires supported literal text mapping.".into());
                    }
                    node.literal = Some(literal.unwrap_or(text));
                }
                if let Some(Some(reference)) = sample.values.font {
                    let path = node
                        .properties
                        .get(&super::text::keyword(&node.kind, "font"))
                        .and_then(Value::as_str)
                        .ok_or(SceneError::FontInvalid)?;
                    plan.dependencies
                        .push((format!("game/{path}"), reference.expected_asset_sha256));
                }
            }
        }
        let mut control_seen = HashSet::new();
        for (addition, draft) in request
            .bar_samples
            .into_iter()
            .map(|d| (false, d))
            .chain(request.bar_addition.into_iter().map(|d| (true, d)))
        {
            let target = control_target(
                &bytes,
                &screen,
                draft.node_start,
                draft.parent_start,
                addition,
                "bar",
            )?;
            if !addition
                && (seen.contains(&target.span.start)
                    || positioned.contains(&target.span.start)
                    || !control_seen.insert(target.span.start))
            {
                return Err(SceneError::InvalidPayload);
            }
            let authoring = self.require_action_authoring(
                project,
                &style_inventory.source_map.project_id,
                &draft.expected_authoring_revision,
            )?;
            let values = control_source::bar_values(
                &draft.binding,
                &draft.appearance,
                &authoring.variables,
            )?;
            let start = if addition {
                control_start
            } else {
                target.span.start
            };
            let edits = control_layouts.remove(&start).unwrap_or_default();
            let (source, id) = control_source::prepare(
                &bytes,
                &screen,
                &source_path,
                "bar",
                target,
                addition,
                values,
                draft.width,
                draft.height,
                edits,
            )?;
            let mut props = control_source::bar_canvas(
                &draft.binding,
                &draft.appearance,
                &authoring.variables,
                expansion.values,
            )?;
            control_numeric(&source, &screen.name, &id, &mut props)?;
            put_control(&mut plan, start, target, addition, "bar", props)?;
        }
        for (addition, draft) in request
            .image_button_samples
            .into_iter()
            .map(|d| (false, d))
            .chain(request.image_button_addition.into_iter().map(|d| (true, d)))
        {
            let target = control_target(
                &bytes,
                &screen,
                draft.node_start,
                draft.parent_start,
                addition,
                "imagebutton",
            )?;
            if !addition
                && (seen.contains(&target.span.start)
                    || positioned.contains(&target.span.start)
                    || !control_seen.insert(target.span.start))
            {
                return Err(SceneError::InvalidPayload);
            }
            let (values, _) = self.imagebutton_values(
                project,
                &style_inventory.source_map.project_id,
                &draft.appearances,
            )?;
            let start = if addition {
                control_start
            } else {
                target.span.start
            };
            let edits = control_layouts.remove(&start).unwrap_or_default();
            let (source, id) = control_source::prepare(
                &bytes,
                &screen,
                &source_path,
                "imagebutton",
                target,
                addition,
                values,
                draft.width,
                draft.height,
                edits,
            )?;
            let mut props = Map::new();
            self.imagebutton_canvas(
                project,
                &style_inventory.source_map.project_id,
                &draft.appearances,
                &mut props,
                &mut plan.dependencies,
            )?;
            control_numeric(&source, &screen.name, &id, &mut props)?;
            put_control(&mut plan, start, target, addition, "imagebutton", props)?;
        }
        let mut next_start = bytes
            .len()
            .max(plan.nodes.iter().map(|node| node.start).max().unwrap_or(0))
            + 1;
        let mut expanded = Vec::new();
        for node in std::mem::take(&mut plan.nodes) {
            if node.kind != "use" {
                expanded.push(node);
                continue;
            }
            let reference = screen
                .nodes
                .iter()
                .find(|source| source.span.start == node.start)
                .and_then(|source| source.component.as_ref())
                .filter(|reference| reference.resolved);
            let target = reference.and_then(|reference| {
                style_inventory
                    .source_map
                    .owned_screens
                    .iter()
                    .find(|owner| owner.id == reference.component_id)
            });
            let Some(target) = target else {
                plan.limits
                    .push(format!("Missing or ambiguous component at {}", node.start));
                continue;
            };
            if expansion.remaining == 0 {
                plan.limits
                    .push(format!("Expanded component node limit at {}", node.start));
                continue;
            }
            if active_components.len() >= MAX_DEPTH || active_components.contains(&target.id) {
                plan.limits
                    .push(format!("Component cycle or depth limit at {}", node.start));
                continue;
            }
            let mut active = active_components.to_vec();
            active.push(target.id.clone());
            let mut child = if let Some(cached) =
                expansion.components.get(&(target.id.clone(), active.len()))
            {
                if cached.nodes.len() > expansion.remaining {
                    plan.limits
                        .push(format!("Expanded component node limit at {}", node.start));
                    continue;
                }
                expansion.remaining -= cached.nodes.len();
                cached.clone()
            } else {
                let child = self.canvas_plan(
                    project,
                    Request {
                        path: target.path.clone(),
                        screen_name: target.name.clone(),
                        expected_revision: reference
                            .unwrap()
                            .source_revision
                            .clone()
                            .ok_or(SceneError::SourceConflict)?,
                        width: request.width,
                        height: request.height,
                        button_state: request.button_state,
                        drafts: vec![],
                        positions: vec![],
                        layouts: vec![],
                        text_samples: vec![],
                        variable_samples: request.variable_samples.clone(),
                        addition: None,
                        image_samples: vec![],
                        image_addition: None,
                        text_styles: vec![],
                        bar_samples: vec![],
                        bar_addition: None,
                        image_button_samples: vec![],
                        image_button_addition: None,
                    },
                    &active,
                    expansion,
                )?;
                if child.available {
                    expansion
                        .components
                        .insert((target.id.clone(), active.len()), child.clone());
                }
                child
            };
            if expanded.len() + child.nodes.len().saturating_sub(1) > MAX_NODES {
                plan.limits
                    .push(format!("Expanded component node limit at {}", node.start));
                continue;
            }
            let root = child
                .nodes
                .iter()
                .find(|child| child.parent.is_none())
                .ok_or(SceneError::InvariantBlocked)?
                .start;
            let mut starts = std::collections::BTreeMap::new();
            for child in child.nodes.iter().filter(|child| child.start != root) {
                starts.insert(child.start, next_start);
                next_start += 1;
            }
            for mut child in child.nodes.drain(..).filter(|child| child.start != root) {
                child.start = starts[&child.start];
                child.parent = match child.parent {
                    Some(parent) if parent == root => node.parent,
                    Some(parent) => Some(starts[&parent]),
                    None => return Err(SceneError::InvariantBlocked),
                };
                child.selection_start = Some(node.start);
                expanded.push(child);
            }
            plan.limits.extend(
                child
                    .limits
                    .into_iter()
                    .map(|limit| format!("Component {}: {limit}", target.name)),
            );
            plan.dependencies.extend(child.dependencies);
        }
        plan.nodes = expanded;
        plan.dependencies.push((
            ".renpy-editor/source-map.json".into(),
            style_inventory.source_map_revision.clone(),
        ));
        for node in &plan.nodes {
            let count = plan
                .nodes
                .iter()
                .filter(|child| child.parent == Some(node.start))
                .count();
            if single_child(&node.kind) && count > 1 {
                plan.limits.push(format!(
                    "{} requires one explicit child at {}",
                    node.kind, node.start
                ));
            }
            if node.kind == "grid" {
                let capacity = node
                    .properties
                    .get("columns")
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
                    * node
                        .properties
                        .get("rows")
                        .and_then(Value::as_u64)
                        .unwrap_or(0);
                if count as u64 > capacity
                    || (count as u64 != capacity
                        && node.properties.get("allow_underfull") != Some(&Value::Bool(true)))
                {
                    plan.limits.push(format!(
                        "Grid capacity or empty-cell behavior is unresolved at {}",
                        node.start
                    ));
                }
            }
        }
        // Use the same bounded inventory and executable-source uncertainty as
        // shared-style review. Local nodes remain inspectable when it cannot qualify.
        plan.script_files = style_inventory
            .script_files
            .iter()
            .filter(|p| p.ends_with(".rpy") || p.ends_with(".rpyc") || p.ends_with(".rpa"))
            .cloned()
            .collect();
        plan.limits
            .extend(style_inventory.unresolved_styles.iter().cloned());
        for (file, indexed_bytes) in &style_inventory.files {
            let (bytes, revision) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(file.clone()).map_err(|_| SceneError::InvalidPayload)?,
                )
                .map_err(|_| SceneError::SourceConflict)?;
            plan.dependencies.push((file.clone(), revision.sha256));
            if file == crate::lifecycle::runtime::POLICY_PATH
                && bytes == crate::lifecycle::runtime::POLICY
            {
                continue;
            }
            if indexed_bytes != &bytes {
                return Err(SceneError::SourceConflict);
            }
            let bom = if bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
                3
            } else {
                0
            };
            let bytes = bytes.strip_prefix(&[0xef, 0xbb, 0xbf]).unwrap_or(&bytes);
            let text = std::str::from_utf8(bytes).map_err(|_| SceneError::UnsupportedSource)?;
            let ranges = crate::authoring::lexical_ranges(bytes, false, false)
                .map_err(|_| SceneError::UnsupportedSource)?;
            if ranges.into_iter().any(|(start, end)| {
                let raw = &text[start..end];
                !raw.starts_with(char::is_whitespace)
                    && !safe_initialization(code(raw))
                    && !actions::qualified_initialization(
                        file,
                        text,
                        start,
                        &style_inventory.source_map.owned_screens,
                    )
                    && !style_index.supports_declaration(file, start + bom)
            }) {
                plan.limits.push(format!(
                    "Unresolved project initialization or inherited styles in {file}"
                ));
            }
        }
        if plan.nodes.len() > MAX_NODES {
            plan.limits.push("Expanded component node limit".into());
        }
        // Recursive plans must describe the same captured source and ownership.
        let mut revisions = std::collections::BTreeMap::new();
        for (path, revision) in &plan.dependencies {
            if revisions
                .insert(path, revision)
                .is_some_and(|previous| previous != revision)
            {
                return Err(SceneError::SourceConflict);
            }
        }
        plan.dependencies.sort();
        plan.dependencies.dedup();
        plan.available = plan.limits.is_empty();
        Ok(plan)
    }
}

fn control_target<'a>(
    bytes: &[u8],
    screen: &'a Screen,
    node_start: Option<usize>,
    parent_start: Option<usize>,
    addition: bool,
    kind: &str,
) -> Result<&'a Node, SceneError> {
    let start = match (addition, node_start, parent_start) {
        (true, None, Some(p)) => p,
        (false, Some(n), None) => n,
        _ => return Err(SceneError::InvalidPayload),
    };
    let target = screen
        .nodes
        .iter()
        .find(|n| n.span.start == start)
        .ok_or(SceneError::InvalidPayload)?;
    if addition {
        if !composition::can_add(screen, target, kind) {
            return Err(SceneError::OpaqueBoundary);
        }
    } else if target.kind != kind
        || target.id.is_none()
        || (kind == "bar" && target.bar_binding.is_none())
        || (kind == "imagebutton" && control_source::image_paths(bytes, target).is_none())
    {
        return Err(SceneError::OpaqueBoundary);
    }
    Ok(target)
}

fn control_numeric(
    bytes: &[u8],
    screen_name: &str,
    id: &str,
    properties: &mut Map<String, Value>,
) -> Result<(), SceneError> {
    let document = inspect(bytes, String::new(), String::new())?;
    let node = document
        .screens
        .iter()
        .find(|s| s.name == screen_name)
        .and_then(|s| s.nodes.iter().find(|n| n.id.as_deref() == Some(id)))
        .ok_or(SceneError::InvariantBlocked)?;
    properties.extend(
        node.numeric_layout
            .as_ref()
            .ok_or(SceneError::OpaqueBoundary)?
            .canvas_properties()
            .map_err(|_| SceneError::OpaqueBoundary)?,
    );
    if node.kind == "imagebutton" {
        imagebutton_dimensions(node, properties)?;
    }
    Ok(())
}

/// The renderer sizes state images with two explicit dimensions. Resolve the
/// accepted numeric alias here without changing its authoritative source bytes.
fn imagebutton_dimensions(
    node: &Node,
    properties: &mut Map<String, Value>,
) -> Result<(), SceneError> {
    let numeric = node
        .numeric_layout
        .as_ref()
        .ok_or(SceneError::OpaqueBoundary)?;
    properties.remove("xysize");
    for key in ["xsize", "ysize"] {
        properties.insert(
            key.into(),
            numeric
                .values
                .get(key)
                .ok_or(SceneError::OpaqueBoundary)?
                .json(),
        );
    }
    Ok(())
}

fn put_control(
    plan: &mut Plan,
    start: usize,
    target: &Node,
    addition: bool,
    kind: &str,
    properties: Map<String, Value>,
) -> Result<(), SceneError> {
    if addition {
        plan.nodes.push(CanvasNode {
            start,
            parent: Some(target.span.start),
            selection_start: None,
            kind: kind.into(),
            literal: None,
            properties,
        });
    } else {
        let node = plan
            .nodes
            .iter_mut()
            .find(|n| n.start == start)
            .ok_or(SceneError::InvalidPayload)?;
        let numeric = target
            .numeric_layout
            .as_ref()
            .ok_or(SceneError::OpaqueBoundary)?
            .canvas_properties()
            .map_err(|_| SceneError::OpaqueBoundary)?;
        let control_keys = if kind == "bar" {
            control_source::BAR_KEYS
        } else {
            control_source::IMAGE_KEYS
        };
        node.properties.retain(|key, _| {
            !control_keys.contains(&key.as_str())
                && !(kind == "bar" && key == "range")
                && !numeric.contains_key(key)
        });
        node.properties.extend(properties);
    }
    Ok(())
}

fn scalar(raw: &str) -> bool {
    matches!(raw, "True" | "False" | "None")
        || serde_json::from_str::<Value>(raw).is_ok_and(|v| {
            matches!(
                v,
                Value::String(_) | Value::Number(_) | Value::Bool(_) | Value::Null
            )
        })
}
fn safe_initialization(line: &str) -> bool {
    if line.is_empty()
        || line.starts_with('#')
        || line.starts_with("label ")
        || line.starts_with("screen ")
    {
        return true;
    }
    if let Some(statement) = line.strip_prefix("default ") {
        return statement.split_once(" = ").is_some_and(|(name, value)| {
            identifier(name)
                && !["style", "renpy", "ui", "gui", "config", "Character"].contains(&name)
                && scalar(value)
        });
    }
    let Some((name, value)) = line
        .strip_prefix("define ")
        .and_then(|s| s.split_once(" = "))
    else {
        return false;
    };
    if [
        "config.name",
        "config.sound",
        "config.developer",
        "config.screen_width",
        "config.screen_height",
        "config.save_directory",
    ]
    .contains(&name)
    {
        return scalar(value);
    }
    if name == "config.quit_action" && value == "Quit(confirm=False)" {
        return true;
    }
    if !identifier(name) || ["style", "renpy", "ui", "gui", "config", "Character"].contains(&name) {
        return false;
    }
    let Some(args) = value
        .strip_prefix("Character(")
        .and_then(|s| s.strip_suffix(')'))
    else {
        return false;
    };
    let mut display = serde_json::Deserializer::from_str(args).into_iter::<String>();
    if !matches!(display.next(), Some(Ok(_))) {
        return false;
    }
    let tail = args[display.byte_offset()..].trim_start();
    tail.strip_prefix(',')
        .and_then(|s| s.trim().strip_prefix("color="))
        .is_some_and(|color| {
            serde_json::from_str::<String>(color)
                .is_ok_and(|s| s.starts_with('#') && s[1..].bytes().all(|b| b.is_ascii_hexdigit()))
        })
}
