//! Bounded local button dismissal. Composition retains transaction ownership.
use super::*;
use crate::metadata::{OwnedScreen, OwnedScreenKind};

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Action {
    FinishInteraction,
    HideScreen,
}

pub(super) fn prepare(
    owner: &OwnedScreen,
    screen: &Screen,
    node_start: usize,
    bytes: &[u8],
    action: Action,
    blocking: bool,
) -> Result<Vec<u8>, SceneError> {
    match action {
        Action::FinishInteraction if owner.kind == OwnedScreenKind::Dialog && blocking => (),
        Action::HideScreen if owner.kind == OwnedScreenKind::Panel => (),
        _ => return Err(SceneError::ReferenceBlocked),
    }
    let node = screen
        .nodes
        .iter()
        .find(|n| n.span.start == node_start)
        .ok_or(SceneError::UnknownEntity)?;
    let span = references::editable_dismissal_action(owner, screen, node, bytes)
        .ok_or(SceneError::OpaqueBoundary)?;
    let expression = match action {
        Action::FinishInteraction => "Return()".to_owned(),
        Action::HideScreen => format!(
            "Hide({})",
            serde_json::to_string(&owner.name).map_err(|_| SceneError::InvalidPayload)?
        ),
    };
    let mut proposed = bytes.to_vec();
    proposed.splice(span.start..span.end, expression.bytes());
    Ok(proposed)
}
