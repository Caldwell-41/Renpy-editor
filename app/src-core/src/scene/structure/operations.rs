//! Whole structural edits assembled from source-derived physical ranges.
use super::*;

#[derive(Clone)]
struct Kept {
    id: String,
    kind: String,
    start: usize,
    end: usize,
}
struct Patch {
    start: usize,
    end: usize,
    bytes: Vec<u8>,
    kept: Vec<Kept>,
}
impl Patch {
    fn generated(start: usize, end: usize, bytes: Vec<u8>) -> Self {
        Self {
            start,
            end,
            bytes,
            kept: vec![],
        }
    }
}
struct Group<'a> {
    header: &'a SceneBeat,
    headers: Vec<&'a SceneBeat>,
    start: usize,
    end: usize,
}
fn group<'a>(
    source: &[u8],
    beats: &'a [SceneBeat],
    id: &str,
    expected: &BodyRef,
) -> Result<(Body<'a>, Group<'a>), SceneError> {
    let body = qualify_body(source, beats, expected)?;
    let header = qualified_node(
        &body,
        &NodeRef::Condition {
            group_id: id.into(),
        },
    )?;
    let end = node_end(header, beats)?;
    if end > scene_body_end(source)? {
        return Err(SceneError::OpaqueBoundary);
    }
    let headers = beats
        .iter()
        .filter(|b| {
            b.conditional_branch
                .as_ref()
                .is_some_and(|g| g.group_id == id)
        })
        .collect::<Vec<_>>();
    Ok((
        body,
        Group {
            header,
            headers,
            start: header.byte_start as usize,
            end,
        },
    ))
}
fn branch<'a>(group: &Group<'a>, id: &str) -> Result<&'a SceneBeat, SceneError> {
    group
        .headers
        .iter()
        .copied()
        .find(|b| b.id == id)
        .ok_or(SceneError::InvariantBlocked)
}
fn branch_body<'a>(
    source: &[u8],
    beats: &'a [SceneBeat],
    group: &Group<'a>,
    header: &SceneBeat,
) -> Result<Body<'a>, SceneError> {
    qualify_body(
        source,
        beats,
        &BodyRef::Branch {
            group_id: group
                .header
                .conditional_branch
                .as_ref()
                .unwrap()
                .group_id
                .clone(),
            branch_id: header.id.clone(),
        },
    )
}
fn expression(
    condition: &crate::conditions::Condition,
    loaded: &Loaded,
) -> Result<String, SceneError> {
    logic::render_guard(Some(condition), &loaded.authoring)?
        .strip_prefix(" if ")
        .map(str::to_owned)
        .ok_or(SceneError::InvalidPayload)
}
fn pass(indent: usize, newline: &str) -> Vec<u8> {
    format!("{}pass{newline}", " ".repeat(indent)).into_bytes()
}
fn place(
    body: &Body<'_>,
    position: &Position,
    source: &[u8],
    beats: &[SceneBeat],
    excluded: Option<&str>,
    terminating: bool,
) -> Result<(usize, usize), SceneError> {
    let siblings = body
        .siblings
        .iter()
        .copied()
        .filter(|b| excluded != Some(b.id.as_str()))
        .collect::<Vec<_>>();
    let (index, start) = match position {
        Position::Before { anchor } => {
            let target = qualified_node(body, anchor)?;
            if excluded == Some(target.id.as_str()) {
                return Err(SceneError::InvariantBlocked);
            }
            if target.protected && target.conditional_branch.is_none() {
                return Err(SceneError::OpaqueBoundary);
            }
            (
                siblings
                    .iter()
                    .position(|b| b.id == target.id)
                    .ok_or(SceneError::InvariantBlocked)?,
                target.byte_start as usize,
            )
        }
        Position::End => {
            if body.owner.is_none()
                && (body.end < source.len()
                    || siblings
                        .last()
                        .is_some_and(|b| b.protected && b.conditional_branch.is_none()))
            {
                return Err(SceneError::OpaqueBoundary);
            }
            (siblings.len(), body.end)
        }
    };
    if siblings[..index].iter().any(|b| terminal(b, beats))
        || (terminating && index < siblings.len())
    {
        return Err(SceneError::InvariantBlocked);
    }
    if siblings.len() == 1 && siblings[0].structural_placeholder && body.owner.is_some() {
        return Ok((
            siblings[0].byte_start as usize,
            siblings[0].byte_end as usize,
        ));
    }
    if boundary_is_opaque(beats, start) {
        return Err(SceneError::OpaqueBoundary);
    }
    Ok((start, start))
}
fn empty_after_remove(body: &Body<'_>, selected: &SceneBeat, newline: &str) -> Vec<u8> {
    if body.owner.is_some() && body.siblings.iter().all(|b| b.id == selected.id) {
        pass(body.indent, newline)
    } else {
        vec![]
    }
}
fn inside_group(body: &Body<'_>, id: &str, beats: &[SceneBeat]) -> bool {
    let mut owner = body.owner.as_ref();
    for _ in 0..MAX_CONDITION_NESTING {
        let Some(current) = owner else {
            return false;
        };
        if current.group_id == id {
            return true;
        }
        owner = beats
            .iter()
            .find(|b| b.id == current.branch_id)
            .and_then(|b| b.owner.as_ref());
    }
    owner.is_some()
}
fn preserved(
    source: &[u8],
    beats: &[SceneBeat],
    start: usize,
    end: usize,
    from_indent: usize,
    to_indent: usize,
) -> Result<(Vec<u8>, Vec<Kept>), SceneError> {
    let members = beats
        .iter()
        .filter(|b| b.byte_start as usize >= start && b.byte_end as usize <= end)
        .collect::<Vec<_>>();
    if from_indent != to_indent && members.iter().any(|b| b.protected && b.conditional_branch.is_none() && !trivia(b)
        && !matches!(&b.payload, BeatPayload::CustomCode { source, .. } if source.trim() == "pass")) {
        return Err(SceneError::OpaqueBoundary);
    }
    let text =
        std::str::from_utf8(&source[start..end]).map_err(|_| SceneError::UnsupportedSource)?;
    let mut bytes = Vec::new();
    let mut offsets = HashMap::<usize, usize>::new();
    for (line_start, line_end, line) in physical_lines(text) {
        offsets.insert(line_start, bytes.len());
        let original = &text.as_bytes()[line_start..line_end];
        if from_indent == to_indent || line.trim().is_empty() {
            bytes.extend_from_slice(original);
            continue;
        }
        let indent = indentation(line);
        if line.as_bytes().get(indent) == Some(&b'\t') {
            return Err(SceneError::OpaqueBoundary);
        }
        if indent < from_indent {
            if line.trim_start().starts_with('#') {
                bytes.extend_from_slice(original);
                continue;
            }
            return Err(SceneError::OpaqueBoundary);
        }
        let next_indent = indent - from_indent + to_indent;
        if members
            .iter()
            .any(|b| b.byte_start as usize == start + line_start && b.conditional_branch.is_some())
            && next_indent > MAX_CONDITION_NESTING * 4
        {
            return Err(SceneError::InvariantBlocked);
        }
        bytes.extend(std::iter::repeat_n(b' ', next_indent));
        bytes.extend_from_slice(&original[indent..]);
    }
    offsets.insert(end - start, bytes.len());
    let kept = members
        .into_iter()
        .map(|b| {
            Ok(Kept {
                id: b.id.clone(),
                kind: b.payload.kind().into(),
                start: *offsets
                    .get(&(b.byte_start as usize - start))
                    .ok_or(SceneError::OpaqueBoundary)?,
                end: *offsets
                    .get(&(b.byte_end as usize - start))
                    .ok_or(SceneError::OpaqueBoundary)?,
            })
        })
        .collect::<Result<Vec<_>, SceneError>>()?;
    Ok((bytes, kept))
}
fn append(output: &mut Vec<u8>, kept: &mut [Kept], piece: &[u8], newline: &str) {
    if piece.is_empty() {
        return;
    }
    if !output.is_empty() && output.last() != Some(&b'\n') {
        let end = output.len();
        output.extend_from_slice(newline.as_bytes());
        for record in kept.iter_mut().filter(|r| r.end == end) {
            record.end = output.len();
        }
    }
    output.extend_from_slice(piece);
}
fn patches(
    source: &[u8],
    beats: &[SceneBeat],
    mut patches: Vec<Patch>,
    loaded: &Loaded,
    scene: &SceneMetadata,
    newline: &str,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    patches.sort_by_key(|p| (p.start, p.end));
    let mut output = Vec::new();
    let mut kept = Vec::<Kept>::new();
    let mut cursor = 0;
    for patch in patches {
        if patch.start < cursor || patch.end < patch.start || patch.end > source.len() {
            return Err(SceneError::InvariantBlocked);
        }
        let prefix = &source[cursor..patch.start];
        let prefix_start = output.len()
            + usize::from(
                !prefix.is_empty() && !output.is_empty() && output.last() != Some(&b'\n'),
            ) * newline.len();
        append(&mut output, &mut kept, prefix, newline);
        kept.extend(
            beats
                .iter()
                .filter(|b| b.byte_start as usize >= cursor && b.byte_end as usize <= patch.start)
                .map(|b| Kept {
                    id: b.id.clone(),
                    kind: b.payload.kind().into(),
                    start: prefix_start + b.byte_start as usize - cursor,
                    end: prefix_start + b.byte_end as usize - cursor,
                }),
        );
        let patch_start = output.len()
            + usize::from(
                !patch.bytes.is_empty() && !output.is_empty() && output.last() != Some(&b'\n'),
            ) * newline.len();
        append(&mut output, &mut kept, &patch.bytes, newline);
        kept.extend(patch.kept.into_iter().map(|mut r| {
            r.start += patch_start;
            r.end += patch_start;
            r
        }));
        cursor = patch.end;
    }
    let suffix = &source[cursor..];
    let suffix_start = output.len()
        + usize::from(!suffix.is_empty() && !output.is_empty() && output.last() != Some(&b'\n'))
            * newline.len();
    append(&mut output, &mut kept, suffix, newline);
    kept.extend(
        beats
            .iter()
            .filter(|b| b.byte_start as usize >= cursor)
            .map(|b| Kept {
                id: b.id.clone(),
                kind: b.payload.kind().into(),
                start: suffix_start + b.byte_start as usize - cursor,
                end: suffix_start + b.byte_end as usize - cursor,
            }),
    );
    if output == source {
        return Err(SceneError::InvariantBlocked);
    }
    let (_, _, parsed) = parse_scene(scene, &output, Some((&loaded.project, &loaded.authoring)))?;
    let mut forced = Vec::new();
    for parsed in parsed {
        let original = kept.iter().find(|r| {
            r.start == parsed.start && r.end == parsed.end && r.kind == parsed.payload.kind()
        });
        forced.push((
            parsed.payload.kind().into(),
            sha256(&output[parsed.start..parsed.end]),
            original
                .map(|r| r.id.clone())
                .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            Some(parsed.start),
        ));
    }
    if kept
        .iter()
        .any(|r| !forced.iter().any(|(_, _, id, _)| id == &r.id))
    {
        return Err(SceneError::OpaqueBoundary);
    }
    Ok((output, forced))
}

pub(super) fn apply(
    source: &[u8],
    beats: &[SceneBeat],
    edit: StructuralEdit,
    loaded: &Loaded,
    scene: &SceneMetadata,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    let newline = if source.windows(2).any(|w| w == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let changes = match edit {
        StructuralEdit::InsertCondition {
            body,
            position,
            condition,
            otherwise,
        } => {
            let body = qualify_body(source, beats, &body)?;
            if body.indent > MAX_CONDITION_NESTING * 4 {
                return Err(SceneError::InvariantBlocked);
            }
            let (start, end) = place(&body, &position, source, beats, None, false)?;
            let expr = expression(&condition, loaded)?;
            let mut bytes = format!("{}if {expr}:{newline}", " ".repeat(body.indent)).into_bytes();
            bytes.extend(pass(body.indent + 4, newline));
            if otherwise {
                bytes.extend_from_slice(
                    format!("{}else:{newline}", " ".repeat(body.indent)).as_bytes(),
                );
                bytes.extend(pass(body.indent + 4, newline));
            }
            vec![Patch::generated(start, end, bytes)]
        }
        StructuralEdit::UpdateBranch {
            group_id,
            branch_id,
            expected_body,
            condition,
        } => {
            let (_, group) = group(source, beats, &group_id, &expected_body)?;
            let header = branch(&group, &branch_id)?;
            let info = header.conditional_branch.as_ref().unwrap();
            if info.otherwise {
                return Err(SceneError::InvalidPayload);
            }
            let text =
                std::str::from_utf8(&source[header.byte_start as usize..header.byte_end as usize])
                    .map_err(|_| SceneError::UnsupportedSource)?;
            let line = physical_lines(text)[0].2;
            let prefix = format!(
                "{}{} ",
                " ".repeat(indentation(line)),
                if info.ordinal == 0 { "if" } else { "elif" }
            );
            let rest = line
                .strip_prefix(&prefix)
                .ok_or(SceneError::OpaqueBoundary)?;
            let commentless = logic::without_comment(line);
            let colon = commentless.trim_end().len() - 1;
            if commentless.as_bytes().get(colon) != Some(&b':') {
                return Err(SceneError::OpaqueBoundary);
            }
            let start = prefix.len() + rest.len() - rest.trim_start().len();
            let end = colon - (line[..colon].len() - line[..colon].trim_end().len());
            let mut rendered = text.to_owned();
            rendered.replace_range(start..end, &expression(&condition, loaded)?);
            let len = rendered.len();
            vec![Patch {
                start: header.byte_start as usize,
                end: header.byte_end as usize,
                bytes: rendered.into_bytes(),
                kept: vec![Kept {
                    id: header.id.clone(),
                    kind: header.payload.kind().into(),
                    start: 0,
                    end: len,
                }],
            }]
        }
        StructuralEdit::AddBranch {
            group_id,
            expected_body,
            before_branch_id,
            condition,
        } => {
            let (parent, group) = group(source, beats, &group_id, &expected_body)?;
            let existing_else = group
                .headers
                .iter()
                .any(|b| b.conditional_branch.as_ref().unwrap().otherwise);
            let start = if let Some(id) = &before_branch_id {
                let target = branch(&group, id)?;
                if target.conditional_branch.as_ref().unwrap().ordinal == 0 {
                    return Err(SceneError::InvariantBlocked);
                }
                target.byte_start as usize
            } else {
                group.end
            };
            let header = match condition {
                None => {
                    if existing_else || before_branch_id.is_some() {
                        return Err(SceneError::InvariantBlocked);
                    }
                    "else".into()
                }
                Some(condition) => {
                    if existing_else && before_branch_id.is_none() {
                        return Err(SceneError::InvariantBlocked);
                    }
                    format!("elif {}", expression(&condition, loaded)?)
                }
            };
            let mut bytes = format!("{}{header}:{newline}", " ".repeat(parent.indent)).into_bytes();
            bytes.extend(pass(parent.indent + 4, newline));
            vec![Patch::generated(start, start, bytes)]
        }
        StructuralEdit::RemoveBranch {
            group_id,
            branch_id,
            expected_body,
        } => {
            let (_, group) = group(source, beats, &group_id, &expected_body)?;
            let header = branch(&group, &branch_id)?;
            if header.conditional_branch.as_ref().unwrap().ordinal == 0 {
                return Err(SceneError::InvariantBlocked);
            }
            let body = branch_body(source, beats, &group, header)?;
            vec![Patch::generated(
                header.byte_start as usize,
                body.end,
                vec![],
            )]
        }
        StructuralEdit::Remove {
            node,
            expected_body,
        } => {
            let body = qualify_body(source, beats, &expected_body)?;
            let selected = qualified_node(&body, &node)?;
            if selected.protected && selected.conditional_branch.is_none() {
                return Err(SceneError::OpaqueBoundary);
            }
            vec![Patch::generated(
                selected.byte_start as usize,
                node_end(selected, beats)?,
                empty_after_remove(&body, selected, newline),
            )]
        }
        StructuralEdit::Move {
            node,
            expected_body,
            body: destination,
            position,
        } => {
            let source_body = qualify_body(source, beats, &expected_body)?;
            let selected = qualified_node(&source_body, &node)?;
            if selected.protected && selected.conditional_branch.is_none() {
                return Err(SceneError::OpaqueBoundary);
            }
            let destination = qualify_body(source, beats, &destination)?;
            if let NodeRef::Condition { group_id } = &node {
                if inside_group(&destination, group_id, beats) {
                    return Err(SceneError::InvariantBlocked);
                }
            }
            let start = selected.byte_start as usize;
            let end = node_end(selected, beats)?;
            let same_body = source_body.owner == destination.owner;
            let (target, target_end) = place(
                &destination,
                &position,
                source,
                beats,
                if same_body { Some(&selected.id) } else { None },
                terminal(selected, beats),
            )?;
            if target >= start && target <= end {
                return Err(SceneError::InvariantBlocked);
            }
            if same_body
                && beats.iter().any(|b| {
                    b.byte_start as usize >= start.min(target)
                        && b.byte_end as usize <= end.max(target)
                        && !(b.byte_start as usize >= start && b.byte_end as usize <= end)
                        && b.protected
                        && b.conditional_branch.is_none()
                        && !trivia(b)
                        && !b.structural_placeholder
                })
            {
                return Err(SceneError::OpaqueBoundary);
            }
            let (bytes, kept) = preserved(
                source,
                beats,
                start,
                end,
                source_body.indent,
                destination.indent,
            )?;
            vec![
                Patch::generated(
                    start,
                    end,
                    empty_after_remove(&source_body, selected, newline),
                ),
                Patch {
                    start: target,
                    end: target_end,
                    bytes,
                    kept,
                },
            ]
        }
        StructuralEdit::Unwrap {
            group_id,
            branch_id,
            expected_body,
        } => {
            let (parent, group) = group(source, beats, &group_id, &expected_body)?;
            let header = branch(&group, &branch_id)?;
            let body = branch_body(source, beats, &group, header)?;
            // Insertion end excludes trailing trivia; unwrap needs the full
            // selected lexical branch up to its next header, with proved comment scope.
            let full_end = group
                .headers
                .iter()
                .filter(|b| b.byte_start > header.byte_start)
                .map(|b| b.byte_start as usize)
                .min()
                .unwrap_or(group.end);
            let selected_text = std::str::from_utf8(&source[header.byte_end as usize..full_end])
                .map_err(|_| SceneError::UnsupportedSource)?;
            if physical_lines(selected_text).iter().any(|(_, _, line)| {
                line.trim_start().starts_with('#') && indentation(line) < body.indent
            }) {
                return Err(SceneError::OpaqueBoundary);
            }
            let (mut bytes, mut kept) = preserved(
                source,
                beats,
                header.byte_end as usize,
                full_end,
                body.indent,
                parent.indent,
            )?;
            if body.siblings.len() == 1 && body.siblings[0].structural_placeholder {
                let placeholder = kept
                    .iter()
                    .find(|r| r.id == body.siblings[0].id)
                    .cloned()
                    .ok_or(SceneError::OpaqueBoundary)?;
                let removed = placeholder.end - placeholder.start;
                bytes.drain(placeholder.start..placeholder.end);
                kept.retain(|r| r.id != placeholder.id);
                for record in kept.iter_mut().filter(|r| r.start >= placeholder.end) {
                    record.start -= removed;
                    record.end -= removed;
                }
                bytes.extend(empty_after_remove(&parent, group.header, newline));
            }
            vec![Patch {
                start: group.start,
                end: group.end,
                bytes,
                kept,
            }]
        }
    };
    patches(source, beats, changes, loaded, scene, newline)
}
