//! Direct variable placeholders and inert, literal editor samples.
use super::*;
use crate::authoring::{variable_literal, Variable, VariableType};
use interaction::{VariableBinding, VariableSample};
use serde_json::Value;

pub fn inspect_binding(node: &Node, variables: &[Variable]) -> Option<VariableBinding> {
    if node.kind != "text" {
        return None;
    }
    let name = node
        .literal
        .as_deref()?
        .strip_prefix('[')?
        .strip_suffix("!q]")?;
    let variable = variables.iter().find(|v| v.technical_name == name)?;
    Some(VariableBinding {
        variable_id: variable.id.clone(),
    })
}

pub fn binding_dependencies(
    binding: &VariableBinding,
    variables: &[Variable],
) -> Result<Vec<references::ScreenDependencyRevision>, SceneError> {
    let variable = variables
        .iter()
        .find(|v| v.id == binding.variable_id)
        .ok_or(SceneError::ReferenceBlocked)?;
    Ok(vec![references::ScreenDependencyRevision {
        id: variable.id.clone(),
        revision: variable.source.source_revision.clone(),
    }])
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

pub(super) fn prepare(
    bytes: &[u8],
    node: &Node,
    binding: Option<&VariableBinding>,
    text: Option<&str>,
    variables: &[Variable],
) -> Result<Vec<u8>, SceneError> {
    if node.kind != "text"
        || node.id.is_none()
        || node.literal.is_none()
        || node.literal.as_ref().is_some_and(|s| s.contains('['))
            && inspect_binding(node, variables).is_none()
    {
        return Err(SceneError::OpaqueBoundary);
    }
    let value = match (binding, text) {
        (Some(binding), None) => {
            let variable = variables
                .iter()
                .find(|v| v.id == binding.variable_id)
                .ok_or(SceneError::ReferenceBlocked)?;
            format!("[{}!q]", variable.technical_name)
        }
        (None, Some(text)) if !text.contains('[') => text.to_owned(),
        _ => return Err(SceneError::InvalidPayload),
    };
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
