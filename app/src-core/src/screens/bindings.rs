//! Bounded variable templates and inert, literal editor samples.
use super::*;
use crate::authoring::{variable_literal, Variable, VariableType};
use interaction::{VariableBinding, VariableSample};
use serde_json::Value;
use std::collections::BTreeMap;

enum Part<'a> {
    Literal(String),
    Variable(&'a Variable),
}

/// Screen literals have already passed the existing string codec. Only known
/// [technical_name!q] substitutions and escaped brackets/braces are admitted.
/// Active text tags stay source-only; treating them as literals changes semantics.
struct Template<'a> {
    parts: Vec<Part<'a>>,
}

impl<'a> Template<'a> {
    fn parse(text: &str, variables: &'a [Variable]) -> Result<Self, SceneError> {
        let mut parts = vec![];
        let mut literal = String::new();
        let mut rest = text;
        while !rest.is_empty() {
            if let Some(tail) = rest.strip_prefix("[[") {
                literal.push('[');
                rest = tail;
            } else if let Some(tail) = rest.strip_prefix("{{") {
                // Text tokenization, unlike substitution, remains enabled in the helper.
                literal.push_str("{{");
                rest = tail;
            } else if let Some(tail) = rest.strip_prefix('[') {
                let (token, tail) = tail.split_once(']').ok_or(SceneError::OpaqueBoundary)?;
                let name = token
                    .strip_suffix("!q")
                    .filter(|name| identifier(name))
                    .ok_or(SceneError::OpaqueBoundary)?;
                let variable = variables
                    .iter()
                    .find(|v| v.technical_name == name)
                    .ok_or(SceneError::ReferenceBlocked)?;
                parts.push(Part::Literal(std::mem::take(&mut literal)));
                parts.push(Part::Variable(variable));
                rest = tail;
            } else {
                let c = rest.chars().next().unwrap();
                if c == '{' {
                    return Err(SceneError::OpaqueBoundary);
                }
                literal.push(c);
                rest = &rest[c.len_utf8()..];
            }
        }
        parts.push(Part::Literal(literal));
        Ok(Self { parts })
    }

    fn bindings(&self) -> Vec<VariableBinding> {
        let mut seen = HashSet::new();
        self.parts
            .iter()
            .filter_map(|part| match part {
                Part::Variable(variable) if seen.insert(&variable.id) => Some(VariableBinding {
                    variable_id: variable.id.clone(),
                }),
                _ => None,
            })
            .collect()
    }

    fn resolve(&self, values: &BTreeMap<String, String>) -> Result<String, SceneError> {
        let mut result = String::new();
        for part in &self.parts {
            result.push_str(match part {
                Part::Literal(text) => text,
                Part::Variable(variable) => values
                    .get(&variable.id)
                    .ok_or(SceneError::ReferenceBlocked)?,
            });
        }
        Ok(result)
    }
}

pub fn inspect_bindings(node: &Node, variables: &[Variable]) -> Option<Vec<VariableBinding>> {
    if node.kind != "text" {
        return None;
    }
    Some(
        Template::parse(node.literal.as_deref()?, variables)
            .ok()?
            .bindings(),
    )
}

pub fn binding_dependencies(
    bindings: &[VariableBinding],
    variables: &[Variable],
) -> Result<Vec<references::ScreenDependencyRevision>, SceneError> {
    bindings
        .iter()
        .map(|binding| {
            let variable = variables
                .iter()
                .find(|v| v.id == binding.variable_id)
                .ok_or(SceneError::ReferenceBlocked)?;
            Ok(references::ScreenDependencyRevision {
                id: variable.id.clone(),
                revision: variable.source.source_revision.clone(),
            })
        })
        .collect()
}

/// Returns text for Ren'Py's literal Text displayable with substitution disabled.
/// Braces are escaped exactly as the source placeholder's !q conversion does.
pub fn resolve_sample(
    binding: &VariableBinding,
    variables: &[Variable],
    sample: Option<&VariableSample>,
) -> Result<String, SceneError> {
    let variable = variables
        .iter()
        .find(|v| v.id == binding.variable_id)
        .ok_or(SceneError::ReferenceBlocked)?;
    let value = if let Some(sample) = sample {
        if sample.variable_id != variable.id
            || sample.expected_source_revision != variable.source.source_revision
        {
            return Err(SceneError::SourceConflict);
        }
        if variable.variable_type == VariableType::Int && !sample.value.is_string() {
            return Err(SceneError::InvalidPayload);
        }
        &sample.value
    } else {
        &variable.default_value
    };
    let literal =
        variable_literal(variable.variable_type, value).map_err(|_| SceneError::InvalidPayload)?;
    let text = match (variable.variable_type, value) {
        (VariableType::String, Value::String(s)) => s.clone(),
        _ => literal,
    };
    Ok(text.replace('{', "{{"))
}

pub fn resolve_template(
    node: &Node,
    variables: &[Variable],
    values: &BTreeMap<String, String>,
) -> Result<Option<String>, SceneError> {
    if node.kind != "text" {
        return Ok(None);
    }
    let Some(literal) = node.literal.as_deref() else {
        return Ok(None);
    };
    let Ok(template) = Template::parse(literal, variables) else {
        return Ok(None);
    };
    template.resolve(values).map(Some)
}

pub(super) fn validate_edit(
    node: &Node,
    text: &str,
    variables: &[Variable],
) -> Result<(), SceneError> {
    if node.id.is_none() || inspect_bindings(node, variables).is_none() {
        return Err(SceneError::OpaqueBoundary);
    }
    Template::parse(text, variables)?;
    Ok(())
}

pub(super) fn prepare(
    bytes: &[u8],
    node: &Node,
    binding: Option<&VariableBinding>,
    text: Option<&str>,
    variables: &[Variable],
) -> Result<Vec<u8>, SceneError> {
    let value = match (binding, text) {
        (Some(binding), None) => {
            let variable = variables
                .iter()
                .find(|v| v.id == binding.variable_id)
                .ok_or(SceneError::ReferenceBlocked)?;
            format!("[{}!q]", variable.technical_name)
        }
        (None, Some(text)) => text.to_owned(),
        _ => return Err(SceneError::InvalidPayload),
    };
    validate_edit(node, &value, variables)?;
    node.text_properties
        .as_ref()
        .ok_or(SceneError::OpaqueBoundary)?
        .patch(
            bytes,
            node,
            &text::TextEdits {
                text: Some(value),
                ..Default::default()
            },
            Default::default(),
        )
}
