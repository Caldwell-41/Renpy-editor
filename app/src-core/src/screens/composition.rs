use super::*;
use sha2::{Digest, Sha256};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComposeRequest {
    pub screen_id: String,
    pub expected_revision: String,
    pub command: Command,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Command {
    #[serde(rename_all = "camelCase")]
    Add {
        parent_id: String,
        kind: String,
        text: String,
    },
    #[serde(rename_all = "camelCase")]
    Text { node_id: String, text: String },
    #[serde(rename_all = "camelCase")]
    Reorder {
        node_id: String,
        target_id: String,
        after: bool,
    },
    #[serde(rename_all = "camelCase")]
    Remove { node_id: String },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposeResult {
    pub document: Document,
    pub selected_id: String,
}

fn text_literal(text: &str) -> Result<String, SceneError> {
    if text.trim().is_empty() || text.len() > 8192 || text.contains('\0') {
        return Err(SceneError::InvalidPayload);
    }
    serde_json::to_string(text).map_err(|_| SceneError::InvalidPayload)
}

fn movable(screen: &Screen, node: &Node) -> bool {
    node.parent_start.is_some()
        && screen
            .nodes
            .iter()
            .filter(|n| n.span.start >= node.span.start && n.span.start < node.source_end)
            .all(|n| n.id.is_some() && n.protected.is_empty())
}

impl AuthoringService {
    pub fn screens_compose(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: ComposeRequest,
    ) -> Result<ComposeResult, SceneError> {
        let catalog = self.screens_list(project, project_id)?;
        let owner = catalog
            .owned
            .iter()
            .find(|s| s.screen.id == request.screen_id && s.resolved)
            .ok_or(SceneError::ReferenceBlocked)?;
        let source_path = &owner.screen.path;
        self.ensure_source_paths_clean(project, [source_path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(source_path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let document = self.owned_screen_document(
            project,
            &bytes,
            source_path.clone(),
            revision.sha256.clone(),
        )?;
        let screen = document
            .screens
            .iter()
            .find(|s| s.name == owner.screen.name)
            .ok_or(SceneError::ReferenceBlocked)?;
        let mut proposed = bytes.clone();
        let selected_id = match request.command {
            Command::Add {
                parent_id,
                kind,
                text,
            } => {
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&parent_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !["screen", "fixed", "frame", "vbox"].contains(&parent.kind.as_str())
                    || !["fixed", "frame", "vbox", "text", "textbutton"].contains(&kind.as_str())
                    || (parent.kind == "frame"
                        && (screen
                            .nodes
                            .iter()
                            .any(|n| n.parent_start == Some(parent.span.start))
                            || !parent.protected.is_empty()))
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let id = uuid::Uuid::new_v4().to_string();
                let newline = if bytes.windows(2).any(|s| s == b"\r\n") {
                    "\r\n"
                } else {
                    "\n"
                };
                let indent = bytes[parent.span.start..]
                    .iter()
                    .take_while(|b| **b == b' ')
                    .count()
                    + 4;
                let spaces = " ".repeat(indent);
                let header = if ["text", "textbutton"].contains(&kind.as_str()) {
                    format!("{kind} {}", text_literal(&text)?)
                } else {
                    format!("{kind}:")
                };
                let mut addition = format!("{spaces}{header} # loomlight-element: {id}{newline}");
                if !["text", "textbutton"].contains(&kind.as_str()) {
                    addition.push_str(&format!("{spaces}    pass{newline}"));
                }
                if parent.source_end > 0 && bytes[parent.source_end - 1] != b'\n' {
                    addition.insert_str(0, newline);
                }
                proposed.splice(parent.source_end..parent.source_end, addition.bytes());
                id
            }
            Command::Text { node_id, text } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !["text", "textbutton"].contains(&node.kind.as_str()) {
                    return Err(SceneError::OpaqueBoundary);
                }
                let header = std::str::from_utf8(&bytes[node.span.start..node.source_end])
                    .map_err(|_| SceneError::UnsupportedSource)?
                    .lines()
                    .next()
                    .unwrap();
                let indent = header.len() - header.trim_start_matches(' ').len();
                let statement = code(&header[indent..]);
                let remaining = statement[node.kind.len()..].trim_start();
                let literal = remaining.strip_suffix(':').unwrap_or(remaining).trim_end();
                let start = node.span.start + indent + statement.len() - remaining.len();
                let value = text_literal(&text)?;
                if node.literal.as_ref() != Some(&text) {
                    proposed.splice(start..start + literal.len(), value.bytes());
                }
                node_id
            }
            Command::Reorder {
                node_id,
                target_id,
                after,
            } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                let target = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&target_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if node.parent_start.is_none() || node.parent_start != target.parent_start {
                    return Err(SceneError::OpaqueBoundary);
                }
                let siblings = screen
                    .nodes
                    .iter()
                    .filter(|n| n.parent_start == node.parent_start)
                    .collect::<Vec<_>>();
                let from = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&node_id))
                    .unwrap();
                let to = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&target_id))
                    .unwrap();
                let position = to + usize::from(after) - usize::from(from < to);
                if node_id == target_id || position == from {
                    return Ok(ComposeResult {
                        document,
                        selected_id: node_id,
                    });
                }
                let start = node.span.start.min(target.span.start);
                let end = node.source_end.max(target.source_end);
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| Some(n.span.start) == node.parent_start)
                    .unwrap();
                if !siblings
                    .iter()
                    .filter(|n| n.span.start >= start && n.span.start < end)
                    .all(|n| movable(screen, n))
                    || parent
                        .protected
                        .iter()
                        .any(|p| p.start < end && p.end > start)
                    || bytes[node.source_end - 1] != b'\n'
                    || (after && bytes[target.source_end - 1] != b'\n')
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let destination = if after {
                    target.source_end
                } else {
                    target.span.start
                };
                if destination > node.source_end {
                    proposed.splice(
                        destination..destination,
                        bytes[node.span.start..node.source_end].iter().copied(),
                    );
                    proposed.drain(node.span.start..node.source_end);
                } else {
                    let moved = proposed
                        .drain(node.span.start..node.source_end)
                        .collect::<Vec<_>>();
                    proposed.splice(destination..destination, moved);
                }
                node_id
            }
            Command::Remove { node_id } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !movable(screen, node) {
                    return Err(SceneError::OpaqueBoundary);
                }
                let siblings = screen
                    .nodes
                    .iter()
                    .filter(|n| n.parent_start == node.parent_start)
                    .collect::<Vec<_>>();
                let index = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&node_id))
                    .unwrap();
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| Some(n.span.start) == node.parent_start)
                    .unwrap();
                let fallback = siblings
                    .get(index + 1)
                    .or_else(|| index.checked_sub(1).and_then(|i| siblings.get(i)))
                    .copied()
                    .unwrap_or(parent);
                let selected = fallback.id.clone().unwrap_or_else(|| {
                    let start = if fallback.span.start >= node.source_end {
                        fallback.span.start - (node.source_end - node.span.start)
                    } else {
                        fallback.span.start
                    };
                    format!("source-at-{start}")
                });
                proposed.drain(node.span.start..node.source_end);
                let remaining = inspect(&proposed, source_path.clone(), String::new())?;
                let empty_parent = remaining
                    .screens
                    .iter()
                    .find(|s| s.name == owner.screen.name)
                    .and_then(|s| s.nodes.iter().find(|n| n.span.start == parent.span.start))
                    .ok_or(SceneError::InvariantBlocked)?;
                let header_end = proposed[parent.span.start..]
                    .iter()
                    .position(|b| *b == b'\n')
                    .map(|i| parent.span.start + i + 1)
                    .unwrap_or(proposed.len());
                if empty_parent.source_end == header_end {
                    let indent = proposed[parent.span.start..]
                        .iter()
                        .take_while(|b| **b == b' ')
                        .count()
                        + 4;
                    let newline = if bytes.windows(2).any(|s| s == b"\r\n") {
                        "\r\n"
                    } else {
                        "\n"
                    };
                    let pass = format!("{}pass{newline}", " ".repeat(indent));
                    proposed.splice(header_end..header_end, pass.bytes());
                }
                selected
            }
        };
        if proposed == bytes {
            return Ok(ComposeResult {
                document,
                selected_id,
            });
        }
        let accepted = self.owned_screen_document(
            project,
            &proposed,
            source_path.clone(),
            hex::encode(Sha256::digest(&proposed)),
        )?;
        self.commit_history(
            project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path: path(source_path)?,
                    kind: MutationKind::ReplaceExisting,
                    base: revision,
                    expected_bytes: bytes,
                    proposed,
                }],
                intent: TransactionIntent::Edit,
            },
        )?;
        Ok(ComposeResult {
            document: accepted,
            selected_id,
        })
    }
}
