//! Source-backed authoring for explicitly owned, parameterless components.

use super::*;
use crate::metadata::{ComponentUse, OwnedScreenKind, ScreenTargetBinding};
use references::ScreenRevisions;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PlaceRequest {
    pub component: ScreenTargetBinding,
    pub expected_component: ScreenRevisions,
    pub target: ScreenTargetBinding,
    pub expected_target: ScreenRevisions,
    pub parent_id: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CopyRequest {
    pub target: ScreenTargetBinding,
    pub expected_target: ScreenRevisions,
    pub use_id: String,
    pub expected_component: ScreenRevisions,
    pub expected_project_revision: String,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExtractRequest {
    pub target: ScreenTargetBinding,
    pub expected: ScreenRevisions,
    pub expected_project_revision: String,
    pub node_id: String,
    pub name: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComponentChange {
    pub component_id: String,
    pub screen_id: String,
    pub use_id: String,
}

fn reindent(source: &str, indentation: usize) -> Result<String, SceneError> {
    let original = source.bytes().take_while(|b| *b == b' ').count();
    let prefix = " ".repeat(original);
    let replacement = " ".repeat(indentation);
    source
        .split_inclusive('\n')
        .map(|line| {
            if line.trim().is_empty() {
                Ok(line.to_owned())
            } else {
                line.strip_prefix(&prefix)
                    .map(|body| format!("{replacement}{body}"))
                    .ok_or(SceneError::OpaqueBoundary)
            }
        })
        .collect()
}

fn prevent_cycle(
    map: &crate::metadata::SourceMapMetadata,
    component: &str,
    target: &str,
) -> Result<(), SceneError> {
    let mut pending = vec![(component, 0)];
    let mut visited = HashSet::new();
    while let Some((id, depth)) = pending.pop() {
        if id == target {
            return Err(SceneError::ReferenceBlocked);
        }
        if depth > MAX_DEPTH || visited.len() >= MAX_NODES {
            return Err(SceneError::InvariantBlocked);
        }
        if !visited.insert(id) {
            continue;
        }
        pending.extend(
            map.component_uses
                .iter()
                .filter(|usage| usage.screen_id == id)
                .map(|usage| (usage.component_id.as_str(), depth + 1)),
        );
    }
    Ok(())
}

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
    pub fn screens_component_copy(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: CopyRequest,
    ) -> Result<ComponentChange, SceneError> {
        let target = self.screens_resolve_target(
            project,
            project_id,
            &request.target,
            Some(&request.expected_target),
        )?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&target.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != target.revisions.source {
            return Err(SceneError::SourceConflict);
        }
        let document = self.owned_screen_document(
            project,
            &bytes,
            target.path.clone(),
            revision.sha256.clone(),
        )?;
        let node = document
            .screens
            .iter()
            .find(|s| s.name == request.target.source_name)
            .and_then(|s| {
                s.nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&request.use_id))
            })
            .ok_or(SceneError::ReferenceBlocked)?;
        let reference = node
            .component
            .as_ref()
            .filter(|r| r.resolved && node.kind == "use")
            .ok_or(SceneError::ReferenceBlocked)?;
        let component_binding = ScreenTargetBinding {
            screen_id: reference.component_id.clone(),
            source_name: node.literal.clone().ok_or(SceneError::ReferenceBlocked)?,
        };
        let component = self.screens_resolve_target(
            project,
            project_id,
            &component_binding,
            Some(&request.expected_component),
        )?;
        if component.kind != OwnedScreenKind::Component {
            return Err(SceneError::ReferenceBlocked);
        }
        if target.kind == OwnedScreenKind::Component {
            self.ensure_component_users_clean(project, project_id, &target.binding.screen_id)?;
        }
        let (component_bytes, component_revision) = self
            .transactions
            .snapshot(project, path(&component.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if component_revision.sha256 != component.revisions.source {
            return Err(SceneError::SourceConflict);
        }
        let mut component_doc = self.owned_screen_document(
            project,
            &component_bytes,
            component.path.clone(),
            component_revision.sha256,
        )?;
        self.resolve_screen_styles(project, &mut component_doc, &component_bytes)?;
        let screen = component_doc
            .screens
            .iter()
            .find(|s| s.name == component_binding.source_name)
            .ok_or(SceneError::ReferenceBlocked)?;
        if screen.nodes.iter().any(|n| {
            n.id.is_none()
                || !n.protected.is_empty()
                || matches!(n.kind.as_str(), "text" | "textbutton" | "image")
                    && (n.literal.is_none()
                        || n.literal.as_ref().is_some_and(|s| s.contains(['[', '{'])))
        }) {
            return Err(SceneError::OpaqueBoundary);
        }
        let root = &screen.nodes[0];
        let lines = source_lines(&component_bytes)?;
        let header = lines
            .iter()
            .find(|line| line.start == root.span.start)
            .ok_or(SceneError::OpaqueBoundary)?;
        let mut body = component_bytes[header.end..root.source_end].to_vec();
        if body.iter().all(u8::is_ascii_whitespace) || body.last() != Some(&b'\n') {
            return Err(SceneError::OpaqueBoundary);
        }
        let mut fresh_ids = std::collections::HashMap::new();
        let mut patches = vec![];
        for line in lines
            .iter()
            .filter(|line| line.start >= header.end && line.start < root.source_end)
        {
            if let Some(id) = &line.element_id {
                let fresh = uuid::Uuid::new_v4().to_string();
                let raw = std::str::from_utf8(&component_bytes[line.start..line.end])
                    .map_err(|_| SceneError::UnsupportedSource)?;
                let marker = format!("# loomlight-element: {id}");
                let start = line.start
                    + raw.rfind(&marker).ok_or(SceneError::OpaqueBoundary)?
                    + "# loomlight-element: ".len()
                    - header.end;
                patches.push((start, id.len(), fresh.clone()));
                fresh_ids.insert(id.clone(), fresh);
            }
        }
        for (start, length, fresh) in patches.into_iter().rev() {
            body.splice(start..start + length, fresh.bytes());
        }
        let newline = if body.windows(2).any(|s| s == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let mut prepared = self.prepare_owned_screen_create(
            project,
            project_id,
            CreateRequest {
                name: request.name,
                expected_project_revision: request.expected_project_revision,
                expected_source_map_revision: request.expected_target.source_map,
                expected_inventory_revision: request.expected_target.inventory,
                starter: None,
            },
            OwnedScreenKind::Component,
            |owner| {
                let mut source = format!("screen {}():{newline}", owner.name).into_bytes();
                source.extend(&body);
                Ok(source)
            },
        )?;
        prevent_cycle(
            &prepared.map,
            &component.binding.screen_id,
            &target.binding.screen_id,
        )?;
        let mut copied_uses = vec![];
        for usage in prepared
            .map
            .component_uses
            .iter()
            .filter(|u| u.screen_id == component.binding.screen_id)
        {
            copied_uses.push(ComponentUse {
                screen_id: prepared.owner.id.clone(),
                node_id: fresh_ids
                    .get(&usage.node_id)
                    .ok_or(SceneError::ReferenceBlocked)?
                    .clone(),
                component_id: usage.component_id.clone(),
            });
        }
        let usage = prepared
            .map
            .component_uses
            .iter_mut()
            .find(|u| {
                u.screen_id == request.target.screen_id
                    && u.node_id == request.use_id
                    && u.component_id == component.binding.screen_id
            })
            .ok_or(SceneError::ReferenceBlocked)?;
        usage.component_id = prepared.owner.id.clone();
        prepared.map.component_uses.extend(copied_uses);
        let mut proposed = bytes.clone();
        let indentation = bytes[node.span.start..]
            .iter()
            .take_while(|b| **b == b' ')
            .count();
        let token_start = node.span.start + indentation + "use ".len();
        proposed.splice(
            token_start..token_start + component.binding.source_name.len(),
            prepared.owner.name.bytes(),
        );
        let component_id = prepared.owner.id.clone();
        self.commit_owned_screen_create(
            project,
            project_id,
            prepared,
            vec![FileMutation {
                path: path(&target.path)?,
                kind: MutationKind::ReplaceExisting,
                base: revision,
                expected_bytes: bytes,
                proposed,
            }],
        )?;
        Ok(ComponentChange {
            component_id,
            screen_id: request.target.screen_id,
            use_id: request.use_id,
        })
    }

    pub fn screens_component_place(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: PlaceRequest,
    ) -> Result<ComponentChange, SceneError> {
        let component = self.screens_resolve_target(
            project,
            project_id,
            &request.component,
            Some(&request.expected_component),
        )?;
        if component.kind != OwnedScreenKind::Component {
            return Err(SceneError::ReferenceBlocked);
        }
        let target = self.screens_resolve_target(
            project,
            project_id,
            &request.target,
            Some(&request.expected_target),
        )?;
        self.ensure_source_paths_clean(project, [component.path.as_str(), target.path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        if target.kind == OwnedScreenKind::Component {
            self.ensure_component_users_clean(project, project_id, &target.binding.screen_id)?;
        }
        let (mut map, map_bytes, map_revision, _) = self.screen_metadata(project, project_id)?;
        if map_revision.sha256 != target.revisions.source_map
            || map_revision.sha256 != component.revisions.source_map
        {
            return Err(SceneError::SourceConflict);
        }
        prevent_cycle(
            &map,
            &component.binding.screen_id,
            &target.binding.screen_id,
        )?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&target.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != target.revisions.source {
            return Err(SceneError::SourceConflict);
        }
        let document = self.owned_screen_document(
            project,
            &bytes,
            target.path.clone(),
            revision.sha256.clone(),
        )?;
        let screen = document
            .screens
            .iter()
            .find(|screen| screen.name == target.binding.source_name)
            .ok_or(SceneError::ReferenceBlocked)?;
        let parent = screen
            .nodes
            .iter()
            .find(|node| node.id.as_ref() == Some(&request.parent_id))
            .ok_or(SceneError::UnknownEntity)?;
        if !composition::can_add(screen, parent, "use") {
            return Err(SceneError::OpaqueBoundary);
        }
        let use_id = uuid::Uuid::new_v4().to_string();
        let newline = if bytes.windows(2).any(|s| s == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let indentation = bytes[parent.span.start..]
            .iter()
            .take_while(|b| **b == b' ')
            .count()
            + 4;
        let mut addition = format!(
            "{}use {} # loomlight-element: {use_id}{newline}",
            " ".repeat(indentation),
            request.component.source_name
        );
        if parent.source_end > 0 && bytes[parent.source_end - 1] != b'\n' {
            addition.insert_str(0, newline);
        }
        let mut proposed = bytes.clone();
        proposed.splice(parent.source_end..parent.source_end, addition.bytes());
        inspect(&proposed, target.path.clone(), String::new())?;
        map.component_uses.push(ComponentUse {
            screen_id: target.binding.screen_id.clone(),
            node_id: use_id.clone(),
            component_id: component.binding.screen_id.clone(),
        });
        map.validate(project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        self.commit_history(
            project,
            TransactionProposal {
                mutations: vec![
                    FileMutation {
                        path: path(&target.path)?,
                        kind: MutationKind::ReplaceExisting,
                        base: revision,
                        expected_bytes: bytes,
                        proposed,
                    },
                    FileMutation {
                        path: RelativePath::new(".renpy-editor/source-map.json").unwrap(),
                        kind: MutationKind::ReplaceExisting,
                        base: map_revision,
                        expected_bytes: map_bytes,
                        proposed: crate::scene::source_map_bytes(&map)?,
                    },
                ],
                intent: TransactionIntent::Edit,
            },
        )?;
        Ok(ComponentChange {
            component_id: component.binding.screen_id,
            screen_id: target.binding.screen_id,
            use_id,
        })
    }

    pub fn screens_component_extract(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: ExtractRequest,
    ) -> Result<ComponentChange, SceneError> {
        let target = self.screens_resolve_target(
            project,
            project_id,
            &request.target,
            Some(&request.expected),
        )?;
        let group = self.prepare_extract_group(
            project,
            project_id,
            PrepareExtractRequest {
                screen_id: request.target.screen_id.clone(),
                node_id: request.node_id,
                expected_revision: target.revisions.source,
            },
        )?;
        let newline = if group.source.contains("\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let body = reindent(&group.source, 4)?;
        let mut prepared = self.prepare_owned_screen_create(
            project,
            project_id,
            CreateRequest {
                name: request.name,
                expected_project_revision: request.expected_project_revision,
                expected_source_map_revision: request.expected.source_map,
                expected_inventory_revision: request.expected.inventory,
                starter: None,
            },
            OwnedScreenKind::Component,
            |owner| Ok(format!("screen {}():{newline}{body}", owner.name).into_bytes()),
        )?;
        let moved_ids = source_lines(group.source.as_bytes())?
            .into_iter()
            .filter_map(|line| line.element_id)
            .collect::<HashSet<_>>();
        for usage in &mut prepared.map.component_uses {
            if usage.screen_id == group.screen_id && moved_ids.contains(&usage.node_id) {
                usage.screen_id = prepared.owner.id.clone();
            }
        }
        let use_id = uuid::Uuid::new_v4().to_string();
        prepared.map.component_uses.push(ComponentUse {
            screen_id: group.screen_id.clone(),
            node_id: use_id.clone(),
            component_id: prepared.owner.id.clone(),
        });
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(&group.path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != group.source_revision {
            return Err(SceneError::SourceConflict);
        }
        let mut proposed = bytes.clone();
        let indentation = group.source.bytes().take_while(|b| *b == b' ').count();
        let replacement = format!(
            "{}use {} # loomlight-element: {use_id}{newline}",
            " ".repeat(indentation),
            prepared.owner.name
        );
        proposed.splice(group.span.start..group.span.end, replacement.bytes());
        let component_id = prepared.owner.id.clone();
        self.commit_owned_screen_create(
            project,
            project_id,
            prepared,
            vec![FileMutation {
                path: path(&group.path)?,
                kind: MutationKind::ReplaceExisting,
                base: revision,
                expected_bytes: bytes,
                proposed,
            }],
        )?;
        Ok(ComponentChange {
            component_id,
            screen_id: group.screen_id,
            use_id,
        })
    }

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
        let mut document = self.owned_screen_document(
            project,
            &bytes,
            owner.screen.path.clone(),
            revision.sha256.clone(),
        )?;
        self.resolve_screen_styles(project, &mut document, &bytes)?;
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
            || !composition::movable(screen, node)
            || screen
                .nodes
                .iter()
                .filter(|child| {
                    child.span.start >= node.span.start && child.span.start < node.source_end
                })
                .any(|child| {
                    child
                        .literal
                        .as_ref()
                        .is_some_and(|text| text.contains(['[', '{']))
                })
        {
            return Err(SceneError::OpaqueBoundary);
        }
        let source = std::str::from_utf8(&bytes[node.span.start..node.source_end])
            .map_err(|_| SceneError::UnsupportedSource)?
            .to_owned();
        if source
            .split_once('\n')
            .is_none_or(|(_, body)| body.trim().is_empty())
        {
            return Err(SceneError::OpaqueBoundary);
        }
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
