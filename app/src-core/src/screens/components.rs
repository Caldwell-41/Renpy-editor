//! Source-backed authoring for explicitly owned, parameterless components.

use super::*;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PrepareExtractRequest {
    pub screen_id: String,
    pub node_id: String,
    pub expected_revision: String,
}

/// Exact selected source, captured without creating a component or history entry.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedGroup {
    pub screen_id: String,
    pub node_id: String,
    pub path: String,
    pub source_revision: String,
    pub span: Span,
    pub source: String,
}

impl AuthoringService {
    pub fn prepare_extract_group(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: PrepareExtractRequest,
    ) -> Result<PreparedGroup, SceneError> {
        let catalog = self.screens_list(project, project_id)?;
        let owner = catalog
            .owned
            .iter()
            .find(|owner| owner.screen.id == request.screen_id && owner.resolved)
            .ok_or(SceneError::ReferenceBlocked)?;
        self.ensure_source_paths_clean(project, [owner.screen.path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&owner.screen.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let document = self.owned_screen_document(
            project,
            &bytes,
            owner.screen.path.clone(),
            revision.sha256.clone(),
        )?;
        let screen = document
            .screens
            .iter()
            .find(|screen| screen.name == owner.screen.name)
            .ok_or(SceneError::ReferenceBlocked)?;
        let node = screen
            .nodes
            .iter()
            .find(|node| node.id.as_ref() == Some(&request.node_id))
            .ok_or(SceneError::UnknownEntity)?;
        if !matches!(
            node.kind.as_str(),
            "fixed" | "frame" | "window" | "vbox" | "hbox" | "grid" | "viewport"
        ) || bytes.get(node.source_end.saturating_sub(1)) != Some(&b'\n')
            || screen
                .nodes
                .iter()
                .filter(|child| {
                    child.span.start >= node.span.start && child.span.start < node.source_end
                })
                .any(|child| {
                    child.id.is_none()
                        || !child.protected.is_empty()
                        || matches!(child.kind.as_str(), "text" | "textbutton")
                            && child.literal.is_none()
                })
        {
            return Err(SceneError::OpaqueBoundary);
        }
        let source = std::str::from_utf8(&bytes[node.span.start..node.source_end])
            .map_err(|_| SceneError::UnsupportedSource)?
            .to_owned();
        Ok(PreparedGroup {
            screen_id: request.screen_id,
            node_id: request.node_id,
            path: owner.screen.path.clone(),
            source_revision: revision.sha256,
            span: Span {
                start: node.span.start,
                end: node.source_end,
            },
            source,
        })
    }
}

#[cfg(test)]
#[path = "component_tests.rs"]
mod tests;
