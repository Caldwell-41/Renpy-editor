use super::*;
use std::collections::BTreeMap;

pub(super) struct Change<'a> {
    pub path: &'a str,
    pub width: u32,
    pub height: u32,
    pub layout: BTreeMap<String, Option<layout::NumericValue>>,
}

pub(super) enum Target<'a> {
    Addition {
        parent: &'a Node,
    },
    Existing {
        node: &'a Node,
        parent_id: Option<&'a str>,
    },
}

pub(super) struct PreparedImage {
    pub source: Vec<u8>,
    pub id: String,
    pub values: BTreeMap<String, layout::NumericValue>,
    pub parent_start: Option<usize>,
    pub reparented: bool,
}

/// Prepare source and canvas values against the same final parent and numeric edits.
/// The caller retains asset verification, transaction writes and canvas request limits.
pub(super) fn prepare(
    bytes: &[u8],
    screen: &Screen,
    source_path: &str,
    target: Target<'_>,
    change: Change<'_>,
) -> Result<PreparedImage, SceneError> {
    if change.width == 0
        || change.height == 0
        || change.width > MAX_PIXELS
        || change.height > MAX_PIXELS
        || change.layout.contains_key("xsize")
        || change.layout.contains_key("ysize")
    {
        return Err(SceneError::InvalidPayload);
    }
    let (working, id, parent_start, reparented) = match target {
        Target::Addition { parent } => {
            if !composition::can_add(screen, parent, "image") {
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
            let literal =
                serde_json::to_string(change.path).map_err(|_| SceneError::ImageInvalid)?;
            let mut addition = format!("{spaces}add {literal}: # loomlight-element: {id}{newline}{spaces}    xsize {}{newline}{spaces}    ysize {}{newline}", change.width, change.height);
            if parent.source_end > 0 && bytes[parent.source_end - 1] != b'\n' {
                addition.insert_str(0, newline);
            }
            let mut proposed = bytes.to_vec();
            proposed.splice(parent.source_end..parent.source_end, addition.bytes());
            (proposed, id, Some(parent.span.start), false)
        }
        Target::Existing { node, parent_id } => {
            let id = node.id.clone().ok_or(SceneError::OpaqueBoundary)?;
            let parent_start = if let Some(parent_id) = parent_id {
                Some(
                    screen
                        .nodes
                        .iter()
                        .find(|n| n.id.as_deref() == Some(parent_id))
                        .ok_or(SceneError::UnknownEntity)?
                        .span
                        .start,
                )
            } else {
                node.parent_start
            };
            let working = if let Some(parent_id) = parent_id {
                reparent(bytes, screen, node, parent_id, source_path)?
            } else {
                bytes.to_vec()
            };
            (working, id, parent_start, parent_start != node.parent_start)
        }
    };
    let context = inspect(&working, source_path.into(), String::new())?;
    let node = context
        .screens
        .iter()
        .find(|s| s.name == screen.name)
        .and_then(|s| s.nodes.iter().find(|n| n.id.as_ref() == Some(&id)))
        .ok_or(SceneError::InvariantBlocked)?;
    let numeric = node
        .numeric_layout
        .as_ref()
        .ok_or(SceneError::OpaqueBoundary)?;
    let mut edits = change.layout;
    for (key, value) in [("xsize", change.width), ("ysize", change.height)] {
        edits.insert(
            key.into(),
            Some(layout::NumericValue {
                unit: layout::Unit::Pixels,
                value: value as f64,
            }),
        );
    }
    let values = numeric.changed(&edits)?;
    let mut source = numeric.patch(&working, &edits)?;
    if node.literal.as_deref() != Some(change.path) {
        let header = std::str::from_utf8(&working[node.span.start..node.source_end])
            .map_err(|_| SceneError::UnsupportedSource)?
            .lines()
            .next()
            .unwrap();
        let indent = header.len() - header.trim_start_matches(' ').len();
        let statement = code(&header[indent..]);
        let remaining = statement[3..].trim_start();
        let literal = remaining.strip_suffix(':').unwrap_or(remaining).trim_end();
        let start = node.span.start + indent + statement.len() - remaining.len();
        let value = serde_json::to_string(change.path).map_err(|_| SceneError::ImageInvalid)?;
        source.splice(start..start + literal.len(), value.bytes());
    }
    Ok(PreparedImage {
        source,
        id,
        values,
        parent_start,
        reparented,
    })
}

pub(super) fn reparent(
    bytes: &[u8],
    screen: &Screen,
    node: &Node,
    target_id: &str,
    source_path: &str,
) -> Result<Vec<u8>, SceneError> {
    let target = screen
        .nodes
        .iter()
        .find(|n| n.id.as_deref() == Some(target_id))
        .ok_or(SceneError::UnknownEntity)?;
    let target_is_root = target.kind == "screen";
    if node.parent_start == Some(target.span.start) {
        return Ok(bytes.to_vec());
    }
    if node.kind != "image"
        || !node.protected.is_empty()
        || !composition::can_add(screen, target, "image")
    {
        return Err(SceneError::OpaqueBoundary);
    }
    let parent = screen
        .nodes
        .iter()
        .find(|n| Some(n.span.start) == node.parent_start)
        .ok_or(SceneError::OpaqueBoundary)?;
    if parent.kind == "grid"
        && parent
            .numeric_layout
            .as_ref()
            .is_none_or(|n| n.allows_empty_cells != Some(true))
    {
        return Err(SceneError::OpaqueBoundary);
    }
    let old_indent = bytes[node.span.start..]
        .iter()
        .take_while(|b| **b == b' ')
        .count();
    let new_indent = bytes[target.span.start..]
        .iter()
        .take_while(|b| **b == b' ')
        .count()
        + 4;
    let mut block = Vec::new();
    for line in bytes[node.span.start..node.source_end].split_inclusive(|b| *b == b'\n') {
        if line.iter().all(|b| b.is_ascii_whitespace()) {
            block.extend_from_slice(line);
            continue;
        }
        if !line.starts_with(&vec![b' '; old_indent]) {
            return Err(SceneError::OpaqueBoundary);
        }
        block.extend(std::iter::repeat_n(b' ', new_indent));
        block.extend_from_slice(&line[old_indent..]);
    }
    let newline = if bytes.windows(2).any(|w| w == b"\r\n") {
        b"\r\n".as_slice()
    } else {
        b"\n".as_slice()
    };
    if !block.ends_with(b"\n") {
        block.extend_from_slice(newline);
    }
    let mut proposed = bytes.to_vec();
    proposed.drain(node.span.start..node.source_end);
    let remaining = inspect(&proposed, source_path.into(), String::new())?;
    let old_parent = remaining
        .screens
        .iter()
        .find(|s| s.name == screen.name)
        .and_then(|s| s.nodes.iter().find(|n| n.span.start == parent.span.start))
        .ok_or(SceneError::InvariantBlocked)?;
    let header_end = proposed[parent.span.start..]
        .iter()
        .position(|b| *b == b'\n')
        .map(|p| parent.span.start + p + 1)
        .unwrap_or(proposed.len());
    if old_parent.source_end == header_end {
        let indent = proposed[parent.span.start..]
            .iter()
            .take_while(|b| **b == b' ')
            .count()
            + 4;
        let mut pass = vec![b' '; indent];
        pass.extend_from_slice(b"pass");
        pass.extend_from_slice(newline);
        proposed.splice(header_end..header_end, pass);
    }
    let remaining = inspect(&proposed, source_path.into(), String::new())?;
    let target = remaining
        .screens
        .iter()
        .find(|s| s.name == screen.name)
        .and_then(|s| {
            // Root identity comes from the owned projection, not an element marker.
            s.nodes.iter().find(|n| {
                n.id.as_deref() == Some(target_id) || target_is_root && n.kind == "screen"
            })
        })
        .ok_or(SceneError::InvariantBlocked)?;
    if target.source_end > 0 && proposed[target.source_end - 1] != b'\n' {
        block.splice(0..0, newline.iter().copied());
    }
    proposed.splice(target.source_end..target.source_end, block);
    Ok(proposed)
}
