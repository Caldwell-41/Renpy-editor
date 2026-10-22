//! A source-derived, data-only description. No project expressions enter the helper.
use super::*;
use serde_json::{Map, Value};

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
    pub text_samples: Vec<TextSample>,
    #[serde(default)]
    pub button_state: ButtonState,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ButtonState {
    #[default]
    Normal,
    Hover,
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

#[derive(Debug, Serialize)]
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasNode {
    pub start: usize,
    pub parent: Option<usize>,
    pub kind: String,
    pub literal: Option<String>,
    pub properties: Map<String, Value>,
}

impl AuthoringService {
    pub fn screens_canvas_plan(
        &self,
        project: &ProjectId,
        request: Request,
    ) -> Result<Plan, SceneError> {
        if request.width == 0
            || request.height == 0
            || request.width > 1920
            || request.height > 1080
            || request.drafts.len() > MAX_NODES
            || request.text_samples.len() > MAX_NODES
        {
            return Err(SceneError::InvalidPayload);
        }
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&request.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let document = inspect(&bytes, request.path, revision.sha256.clone())?;
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
        for node in screen.nodes {
            let mut properties = Map::new();
            // Read only direct, single-line properties. The shared source parser owns
            // node boundaries; unsupported blocks are never flattened into children.
            let text = std::str::from_utf8(&bytes[node.span.start..node.span.end])
                .map_err(|_| SceneError::UnsupportedSource)?;
            let mut lines = text.lines();
            let header = lines.next().unwrap_or("");
            let indent = header.len() - header.trim_start().len() + 4;
            for line in lines {
                let depth = line.len() - line.trim_start_matches(' ').len();
                if depth != indent {
                    continue;
                }
                let line = code(line.trim_start());
                if line.is_empty()
                    || line == "pass"
                    || kind(&Line {
                        start: 0,
                        indent: 0,
                        code: line,
                        single: true,
                    })
                    .is_some()
                {
                    continue;
                }
                let Some((key, raw)) = line.split_once(' ') else {
                    plan.limits
                        .push(format!("Source-only statement at {}", node.span.start));
                    continue;
                };
                if matches!(key, "id" | "modal" | "action" | "hovered" | "unhovered") {
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
                    (
                        "color" | "text_color" | "background" | "hover_background" | "hover_color"
                        | "hover_text_color",
                        Some(Value::String(s)),
                    ) => {
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
            if matches!(node.kind.as_str(), "text" | "textbutton")
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
                kind: node.kind,
                literal: node.literal,
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
            node.properties.insert("xsize".into(), draft.width.into());
            node.properties.insert("ysize".into(), draft.height.into());
        }
        let mut sampled = HashSet::new();
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
        // The helper's built-in styles are qualified only when project initialization
        // cannot change them. Later style resolution must replace this conservative
        // refusal, rather than guessing the result of custom initialization.
        let files = self
            .transactions
            .inventory_files(project, "game")
            .map_err(|_| SceneError::SourceConflict)?;
        plan.script_files = files
            .iter()
            .filter(|p| p.ends_with(".rpy") || p.ends_with(".rpyc") || p.ends_with(".rpa"))
            .cloned()
            .collect();
        plan.script_files.sort();
        for file in &files {
            if file.ends_with(".rpa") {
                plan.limits
                    .push(format!("Unresolved archive styles in {file}"));
                continue;
            }
            if file.ends_with(".rpyc") && !files.contains(&file[..file.len() - 1].to_owned()) {
                plan.limits
                    .push(format!("Unresolved bytecode styles in {file}"));
            }
            if !file.ends_with(".rpy") {
                continue;
            }
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
            let bytes = bytes.strip_prefix(&[0xef, 0xbb, 0xbf]).unwrap_or(&bytes);
            let text = std::str::from_utf8(bytes).map_err(|_| SceneError::UnsupportedSource)?;
            let ranges = crate::authoring::lexical_ranges(bytes, false, false)
                .map_err(|_| SceneError::UnsupportedSource)?;
            if ranges.into_iter().any(|(start, end)| {
                let raw = &text[start..end];
                !raw.starts_with(char::is_whitespace) && !safe_initialization(code(raw))
            }) {
                plan.limits.push(format!(
                    "Unresolved project initialization or inherited styles in {file}"
                ));
            }
        }
        plan.available = plan.limits.is_empty();
        Ok(plan)
    }
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
