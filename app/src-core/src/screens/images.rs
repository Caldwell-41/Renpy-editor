use super::*;

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
