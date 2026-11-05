//! Bounded action grammar. Inspection never evaluates screen code.
use super::*;
use crate::authoring::{variable_literal, Variable, VariableType};
use crate::metadata::{OwnedScreen, OwnedScreenKind, ScreenTargetBinding};
use interaction::ScreenAction;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

pub const MAX_ACTIONS: usize = 8;

/// One captured authoring view, including the actual variable definition files.
pub(crate) struct AuthoringSnapshot {
    pub revision: String,
    pub variables: Vec<Variable>,
}

impl AuthoringService {
    pub(crate) fn screen_action_authoring(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<AuthoringSnapshot, SceneError> {
        let (_, metadata_revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(".renpy-editor/authoring.json").unwrap(),
            )
            .map_err(|_| SceneError::SourceConflict)?;
        let metadata = self
            .list(project, project_id)
            .map_err(|_| SceneError::ReferenceBlocked)?;
        let mut paths = BTreeSet::from([".renpy-editor/authoring.json"]);
        paths.extend(metadata.variables.iter().map(|v| v.source.path.as_str()));
        let mut digest = Sha256::new();
        for path in paths {
            let (_, revision) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(path).map_err(|_| SceneError::InvalidMetadata)?,
                )
                .map_err(|_| SceneError::SourceConflict)?;
            if path == ".renpy-editor/authoring.json" && revision.sha256 != metadata_revision.sha256
            {
                return Err(SceneError::SourceConflict);
            }
            if metadata
                .variables
                .iter()
                .any(|v| v.source.path == path && v.source.source_revision != revision.sha256)
            {
                return Err(SceneError::SourceConflict);
            }
            digest.update((path.len() as u64).to_le_bytes());
            digest.update(path);
            digest.update(revision.sha256);
        }
        Ok(AuthoringSnapshot {
            revision: hex::encode(digest.finalize()),
            variables: metadata.variables,
        })
    }

    pub(super) fn require_action_authoring(
        &self,
        project: &ProjectId,
        project_id: &str,
        expected: &str,
    ) -> Result<AuthoringSnapshot, SceneError> {
        let captured = self.screen_action_authoring(project, project_id)?;
        if captured.revision != expected {
            return Err(SceneError::SourceConflict);
        }
        self.ensure_source_paths_clean(
            project,
            std::iter::once(".renpy-editor/authoring.json")
                .chain(captured.variables.iter().map(|v| v.source.path.as_str())),
        )
        .map_err(|_| SceneError::DirtySource)?;
        Ok(captured)
    }
}

#[derive(Clone, Debug)]
pub struct ButtonActions {
    pub statement_span: Span,
    pub expression_span: Span,
    pub actions: Vec<ScreenAction>,
    pub dependencies: Vec<references::ScreenDependencyRevision>,
}

#[derive(Default)]
pub struct ActionInspection {
    pub blocking: bool,
    /// Keys are the button's byte start in the authoritative source.
    pub buttons: BTreeMap<usize, ButtonActions>,
    pub unsupported: BTreeSet<usize>,
}

/// A source-resolved, nonmodal Panel. Target qualification belongs to this helper.
#[derive(Clone, Debug)]
pub struct PanelTarget {
    pub binding: ScreenTargetBinding,
    pub source_revision: String,
    pub source_map_revision: String,
}

pub(super) fn qualified_panel_targets(inventory: &ownership::Inventory) -> Vec<PanelTarget> {
    inventory
        .source_map
        .owned_screens
        .iter()
        .filter_map(|owner| {
            if owner.kind != OwnedScreenKind::Panel || !ownership::resolves(owner, inventory) {
                return None;
            }
            let bytes = &inventory.files.iter().find(|(p, _)| p == &owner.path)?.1;
            let document = inspect(bytes, owner.path.clone(), String::new()).ok()?;
            let screen = document.screens.iter().find(|s| s.name == owner.name)?;
            let lines = source_lines(bytes).ok()?;
            let modals = modal_statements(screen, &lines);
            if !(modals.is_empty()
                || modals.len() == 1
                    && standalone(modals[0], &lines)
                    && modals[0].code == "modal False")
            {
                return None;
            }
            Some(PanelTarget {
                binding: ScreenTargetBinding {
                    screen_id: owner.id.clone(),
                    source_name: owner.name.clone(),
                },
                source_revision: hex::encode(Sha256::digest(bytes)),
                source_map_revision: inventory.source_map_revision.clone(),
            })
        })
        .collect()
}

fn modal_statements<'a>(screen: &Screen, lines: &'a [Line<'a>]) -> Vec<&'a Line<'a>> {
    let Some(root) = screen.nodes.first() else {
        return vec![];
    };
    lines
        .iter()
        .filter(|line| {
            line.indent == 4
                && line.start > root.span.start
                && line.start < root.source_end
                && line.code.split_whitespace().next() == Some("modal")
        })
        .collect()
}

fn standalone(line: &Line<'_>, lines: &[Line<'_>]) -> bool {
    line.single
        && lines
            .binary_search_by_key(&line.start, |line| line.start)
            .ok()
            .is_some_and(|index| {
                lines
                    .get(index + 1)
                    .is_none_or(|next| next.indent <= line.indent)
            })
}

/// Split only at top-level commas. The shared lexer already bounded the statement.
fn items(raw: &str) -> Option<Vec<&str>> {
    let mut depth = 0usize;
    let mut quote = None;
    let mut escaped = false;
    let mut start = 0;
    let mut items = vec![];
    for (at, c) in raw.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if let Some(q) = quote {
            if c == '\\' {
                escaped = true;
            } else if c == q {
                quote = None;
            }
            continue;
        }
        match c {
            '"' => quote = Some(c),
            '(' | '[' => depth += 1,
            ')' | ']' => depth = depth.checked_sub(1)?,
            ',' if depth == 0 => {
                items.push(raw[start..at].trim());
                start = at + 1;
            }
            _ => (),
        }
    }
    if depth != 0 || quote.is_some() {
        return None;
    }
    items.push(raw[start..].trim());
    Some(items)
}

fn parsed_value(variable: &Variable, raw: &str) -> Option<serde_json::Value> {
    let value = match variable.variable_type {
        VariableType::Bool => match raw {
            "True" => true.into(),
            "False" => false.into(),
            _ => return None,
        },
        VariableType::Int => serde_json::Value::String(raw.into()),
        VariableType::String => serde_json::from_str::<String>(raw).ok()?.into(),
    };
    variable_literal(variable.variable_type, &value).ok()?;
    Some(value)
}

fn parse(
    raw: &str,
    variables: &[Variable],
    panels: &[PanelTarget],
    blocking: bool,
) -> Option<Vec<ScreenAction>> {
    if raw == "Null()" {
        return Some(vec![]);
    }
    let expressions = if let Some(list) = raw.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
        if list.trim().is_empty() {
            return Some(vec![]);
        }
        items(list)?
    } else {
        vec![raw]
    };
    if expressions.len() > MAX_ACTIONS {
        return None;
    }
    let total = expressions.len();
    expressions
        .into_iter()
        .enumerate()
        .map(|(index, expression)| {
            if expression == "Return()" {
                return (blocking && index + 1 == total).then_some(ScreenAction::FinishInteraction);
            }
            for (prefix, show) in [("Show(", true), ("Hide(", false)] {
                if let Some(raw) = expression
                    .strip_prefix(prefix)
                    .and_then(|s| s.strip_suffix(')'))
                {
                    let name = serde_json::from_str::<String>(raw).ok()?;
                    let target = panels
                        .iter()
                        .find(|p| p.binding.source_name == name)?
                        .binding
                        .clone();
                    return Some(if show {
                        ScreenAction::ShowScreen { target }
                    } else {
                        ScreenAction::HideScreen { target }
                    });
                }
            }
            let args = items(expression.strip_prefix("SetVariable(")?.strip_suffix(')')?)?;
            if args.len() != 2 {
                return None;
            }
            let name = serde_json::from_str::<String>(args[0]).ok()?;
            let variable = variables.iter().find(|v| v.technical_name == name)?;
            Some(ScreenAction::SetVariable {
                variable_id: variable.id.clone(),
                value: parsed_value(variable, args[1])?,
            })
        })
        .collect()
}

pub fn inspect_actions(
    owner: &OwnedScreen,
    screen: &Screen,
    bytes: &[u8],
    variables: &[Variable],
    panels: &[PanelTarget],
) -> ActionInspection {
    let mut result = ActionInspection::default();
    let Ok(lines) = source_lines(bytes) else {
        return result;
    };
    let modals = modal_statements(screen, &lines);
    result.blocking = owner.kind == OwnedScreenKind::Dialog
        && modals.len() == 1
        && standalone(modals[0], &lines)
        && modals[0].code == "modal True";
    for node in screen.nodes.iter().filter(|n| n.kind == "textbutton") {
        let read = || -> Option<ButtonActions> {
            let header_index = lines
                .binary_search_by_key(&node.span.start, |line| line.start)
                .ok()?;
            let header = &lines[header_index];
            let literal = header.code.strip_prefix("textbutton ")?.strip_suffix(':')?;
            serde_json::from_str::<String>(literal).ok()?;
            let mut statements = lines
                .iter()
                .enumerate()
                .skip(header_index + 1)
                .take_while(|(_, line)| line.start < node.source_end)
                .filter(|(_, line)| {
                    line.indent == header.indent + 4
                        && line.code.split_whitespace().next() == Some("action")
                });
            let (index, statement) = statements.next()?;
            if statements.next().is_some()
                || !statement.single
                || lines
                    .get(index + 1)
                    .is_some_and(|next| next.indent > statement.indent)
            {
                return None;
            }
            let raw = statement.code.strip_prefix("action")?.trim_start();
            let actions = parse(raw, variables, panels, result.blocking)?;
            if owner.kind == OwnedScreenKind::Component && !actions.is_empty() {
                return None;
            }
            let start = statement.start + statement.indent + statement.code.len() - raw.len();
            let mut dependencies: Vec<_> = actions
                .iter()
                .filter_map(|action| {
                    if let ScreenAction::SetVariable { variable_id, .. } = action {
                        let variable = variables.iter().find(|v| &v.id == variable_id)?;
                        Some(references::ScreenDependencyRevision {
                            id: variable.id.clone(),
                            revision: variable.source.source_revision.clone(),
                        })
                    } else if let ScreenAction::ShowScreen { target }
                    | ScreenAction::HideScreen { target } = action
                    {
                        let panel = panels.iter().find(|p| &p.binding == target)?;
                        Some(references::ScreenDependencyRevision {
                            id: target.screen_id.clone(),
                            revision: panel.source_revision.clone(),
                        })
                    } else {
                        None
                    }
                })
                .collect();
            for action in &actions {
                if let ScreenAction::ShowScreen { target } | ScreenAction::HideScreen { target } =
                    action
                {
                    let panel = panels.iter().find(|p| &p.binding == target)?;
                    dependencies.push(references::ScreenDependencyRevision {
                        id: format!("{}:identity", target.screen_id),
                        revision: panel.source_map_revision.clone(),
                    });
                }
            }
            dependencies.push(references::ScreenDependencyRevision {
                id: format!("{}:action", node.id.as_deref().unwrap_or(&owner.root_id)),
                revision: hex::encode(Sha256::digest(raw.as_bytes())),
            });
            Some(ButtonActions {
                statement_span: Span {
                    start: statement.start,
                    end: statement.end,
                },
                expression_span: Span {
                    start,
                    end: start + raw.len(),
                },
                actions,
                dependencies,
            })
        };
        if let Some(button) = read() {
            result.buttons.insert(node.span.start, button);
        } else {
            result.unsupported.insert(node.span.start);
        }
    }
    result
}

pub(super) fn prepare(
    bytes: &[u8],
    button: &ButtonActions,
    actions: &[ScreenAction],
    variables: &[Variable],
    panels: &[PanelTarget],
    blocking: bool,
) -> Result<Vec<u8>, SceneError> {
    if actions.len() > MAX_ACTIONS {
        return Err(SceneError::InvalidPayload);
    }
    let expressions: Result<Vec<_>, _> = actions
        .iter()
        .enumerate()
        .map(|(index, action)| match action {
            ScreenAction::SetVariable { variable_id, value } => {
                let variable = variables
                    .iter()
                    .find(|v| &v.id == variable_id)
                    .ok_or(SceneError::ReferenceBlocked)?;
                let literal = variable_literal(variable.variable_type, value)
                    .map_err(|_| SceneError::InvalidPayload)?;
                Ok(format!(
                    "SetVariable({}, {literal})",
                    serde_json::to_string(&variable.technical_name)
                        .map_err(|_| SceneError::InvalidPayload)?
                ))
            }
            ScreenAction::ShowScreen { target } | ScreenAction::HideScreen { target } => {
                if !panels.iter().any(|p| &p.binding == target) {
                    return Err(SceneError::ReferenceBlocked);
                }
                let operation = if matches!(action, ScreenAction::ShowScreen { .. }) {
                    "Show"
                } else {
                    "Hide"
                };
                Ok(format!(
                    "{operation}({})",
                    serde_json::to_string(&target.source_name)
                        .map_err(|_| SceneError::InvalidPayload)?
                ))
            }
            ScreenAction::FinishInteraction if blocking && index + 1 == actions.len() => {
                Ok("Return()".into())
            }
            ScreenAction::FinishInteraction => Err(SceneError::ReferenceBlocked),
        })
        .collect();
    let expressions = expressions?;
    let expression = match expressions.len() {
        0 => "Null()".into(),
        1 => expressions[0].clone(),
        _ => format!("[{}]", expressions.join(", ")),
    };
    if parse(&expression, variables, panels, blocking).as_ref() == Some(&button.actions) {
        return Ok(bytes.to_vec());
    }
    let mut proposed = bytes.to_vec();
    proposed.splice(
        button.expression_span.start..button.expression_span.end,
        expression.bytes(),
    );
    Ok(proposed)
}
