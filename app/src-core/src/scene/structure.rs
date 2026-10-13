//! Explicit-body Beat edits over verified disjoint source ranges.
use super::*;
mod operations;

pub(super) enum StructuralEdit {
    InsertCondition {
        body: BodyRef,
        position: Position,
        condition: crate::conditions::Condition,
        otherwise: bool,
    },
    UpdateBranch {
        group_id: String,
        branch_id: String,
        expected_body: BodyRef,
        condition: crate::conditions::Condition,
    },
    AddBranch {
        group_id: String,
        expected_body: BodyRef,
        before_branch_id: Option<String>,
        condition: Option<crate::conditions::Condition>,
    },
    RemoveBranch {
        group_id: String,
        branch_id: String,
        expected_body: BodyRef,
    },
    Move {
        node: NodeRef,
        expected_body: BodyRef,
        body: BodyRef,
        position: Position,
    },
    Remove {
        node: NodeRef,
        expected_body: BodyRef,
    },
    Unwrap {
        group_id: String,
        branch_id: String,
        expected_body: BodyRef,
    },
}

pub(super) enum BodyEdit {
    Structural(StructuralEdit),
    Insert {
        body: BodyRef,
        position: Position,
        payload: BeatPayload,
    },
    Update {
        id: String,
        body: BodyRef,
        payload: BeatPayload,
    },
}

pub(super) fn transfer(payload: &BeatPayload) -> bool {
    matches!(
        payload,
        BeatPayload::Call { .. } | BeatPayload::Jump { .. } | BeatPayload::Choice { .. }
    )
}
pub(super) fn edit_changes_transfers(edit: &BeatEdit) -> bool {
    matches!(edit, BeatEdit::Insert { payload, .. } | BeatEdit::Update { payload, .. } if transfer(payload))
}

impl AuthoringService {
    /// Validate actual candidate edges, never an old edge plus a proposed target.
    pub(super) fn validate_candidate_transfers(
        &self,
        project: &ProjectId,
        loaded: &Loaded,
        overrides: &[(&str, &[u8])],
    ) -> Result<(), SceneError> {
        let mut adjacency = HashMap::<String, Vec<(String, bool)>>::new();
        let mut bytes_seen = 0usize;
        for scene in &loaded.project.scenes {
            let owned;
            let bytes = if let Some((_, bytes)) = overrides.iter().find(|(id, _)| *id == scene.id) {
                *bytes
            } else {
                let (bytes, revision) = self.scene_snapshot(project, &scene.source_path)?;
                let mapped = loaded
                    .source_map
                    .scene_mappings
                    .iter()
                    .find(|m| m.scene_id == scene.id)
                    .ok_or(SceneError::InvalidMetadata)?;
                if mapped.source_revision != revision.sha256 {
                    return Err(SceneError::SourceConflict);
                }
                owned = bytes;
                owned.as_slice()
            };
            bytes_seen = bytes_seen
                .checked_add(bytes.len())
                .ok_or(SceneError::UnsupportedCallRoute)?;
            if bytes_seen > 32 * 1024 * 1024 {
                return Err(SceneError::UnsupportedCallRoute);
            }
            let (_, _, parsed) =
                parse_scene(scene, bytes, Some((&loaded.project, &loaded.authoring)))?;
            adjacency.insert(
                scene.id.clone(),
                parsed
                    .iter()
                    .flat_map(|b| match &b.payload {
                        BeatPayload::Call { scene_id, .. } => vec![(scene_id.clone(), true)],
                        BeatPayload::Jump { scene_id } => vec![(scene_id.clone(), false)],
                        BeatPayload::Choice { options } => options
                            .iter()
                            .map(|o| (o.destination_scene_id.clone(), false))
                            .collect(),
                        _ => vec![],
                    })
                    .collect(),
            );
        }
        let mut remaining_states = 8192;
        for (source, edges) in &adjacency {
            for (target, _) in edges.iter().filter(|(_, calling)| *calling) {
                if logic::call_route_with_budget(&adjacency, source, target, &mut remaining_states)
                {
                    return Err(SceneError::UnsupportedCallRoute);
                }
            }
        }
        Ok(())
    }

    pub(super) fn body_beat_proposal(
        &self,
        project: &ProjectId,
        mut loaded: Loaded,
        scene_id: &str,
        expected_source_revision: &str,
        edit: BodyEdit,
    ) -> Result<TransactionProposal, SceneError> {
        let scene = loaded
            .project
            .scenes
            .iter()
            .find(|s| s.id == scene_id)
            .cloned()
            .ok_or(SceneError::UnknownEntity)?;
        let stored = loaded
            .source_map
            .scene_mappings
            .iter()
            .find(|m| m.scene_id == scene_id)
            .cloned()
            .ok_or(SceneError::InvalidMetadata)?;
        let (source, revision) = self.scene_snapshot(project, &scene.source_path)?;
        require_revision(&revision, expected_source_revision)?;
        if stored.source_revision != expected_source_revision {
            return Err(SceneError::SourceConflict);
        }
        let (_, beats) = build_mapping(
            &scene,
            &source,
            &revision.sha256,
            Some(&stored),
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )?;
        let edit = match edit {
            edit @ BodyEdit::Structural(_) => edit,
            BodyEdit::Insert {
                body,
                position,
                payload,
            } => {
                if beats.len() >= MAX_BEATS_PER_SCENE {
                    return Err(SceneError::InvariantBlocked);
                }
                let prepared = self.prepare_call_labels(
                    project,
                    &loaded,
                    scene_id,
                    &beats,
                    BeatEdit::Insert {
                        before: None,
                        payload,
                    },
                )?;
                let BeatEdit::Insert { payload, .. } = prepared else {
                    unreachable!()
                };
                BodyEdit::Insert {
                    body,
                    position,
                    payload,
                }
            }
            BodyEdit::Update { id, body, payload } => {
                let prepared = self.prepare_call_labels(
                    project,
                    &loaded,
                    scene_id,
                    &beats,
                    BeatEdit::Update {
                        id: id.clone(),
                        payload,
                    },
                )?;
                let BeatEdit::Update { payload, .. } = prepared else {
                    unreachable!()
                };
                BodyEdit::Update { id, body, payload }
            }
        };
        let transfer_edit = match &edit {
            BodyEdit::Structural(_) => true,
            BodyEdit::Insert { payload, .. } | BodyEdit::Update { payload, .. } => {
                transfer(payload)
            }
        };
        let (proposed, forced) = apply(&source, &beats, edit, &loaded, &scene)?;
        logic::validate_conditional_completion(&proposed, &scene, &loaded)?;
        if transfer_edit {
            self.validate_candidate_transfers(
                project,
                &loaded,
                &[(scene_id, proposed.as_slice())],
            )?;
        }
        let (mapping, next_beats) = build_mapping(
            &scene,
            &proposed,
            &sha256(&proposed),
            Some(&stored),
            &forced,
            Some((&loaded.project, &loaded.authoring)),
        )?;
        if next_beats.len() > MAX_BEATS_PER_SCENE {
            return Err(SceneError::InvariantBlocked);
        }
        if !root_may_continue(&source, &beats)? && root_may_continue(&proposed, &next_beats)? {
            return Err(SceneError::InvariantBlocked);
        }
        *loaded
            .source_map
            .scene_mappings
            .iter_mut()
            .find(|m| m.scene_id == scene_id)
            .ok_or(SceneError::InvalidMetadata)? = mapping;
        Ok(TransactionProposal {
            mutations: vec![
                replace_mutation(&scene.source_path, source, revision, proposed)?,
                replace_mutation(
                    SOURCE_MAP_PATH,
                    loaded.source_map_bytes,
                    loaded.source_map_revision,
                    source_map_bytes(&loaded.source_map)?,
                )?,
            ],
            intent: TransactionIntent::Edit,
        })
    }
}

struct Body<'a> {
    owner: Option<crate::metadata::BeatOwner>,
    indent: usize,
    end: usize,
    siblings: Vec<&'a SceneBeat>,
}
fn qualify_body<'a>(
    source: &[u8],
    beats: &'a [SceneBeat],
    body: &BodyRef,
) -> Result<Body<'a>, SceneError> {
    let scene_end = scene_body_end(source)?;
    let (owner, indent, end) = match body {
        BodyRef::Root => (None, 4, scene_end),
        BodyRef::Branch {
            group_id,
            branch_id,
        } => {
            let header = beats
                .iter()
                .find(|b| {
                    b.id == *branch_id
                        && b.conditional_branch
                            .as_ref()
                            .is_some_and(|g| g.group_id == *group_id)
                })
                .ok_or(SceneError::InvariantBlocked)?;
            if header.byte_start as usize >= scene_end {
                return Err(SceneError::OpaqueBoundary);
            }
            let line =
                std::str::from_utf8(&source[header.byte_start as usize..header.byte_end as usize])
                    .map_err(|_| SceneError::UnsupportedSource)?;
            let indent = indentation(line);
            if line.as_bytes().get(indent) == Some(&b'\t') || indent < 4 {
                return Err(SceneError::OpaqueBoundary);
            }
            let end = beats
                .iter()
                .filter(|b| {
                    b.conditional_branch
                        .as_ref()
                        .is_some_and(|g| g.group_id == *group_id)
                        && b.byte_start > header.byte_start
                })
                .map(|b| b.byte_start as usize)
                .min()
                .or_else(|| {
                    conditional_extents(beats)
                        .get(group_id.as_str())
                        .map(|(_, end)| *end)
                })
                .ok_or(SceneError::InvalidMetadata)?;
            (
                Some(crate::metadata::BeatOwner {
                    group_id: group_id.clone(),
                    branch_id: branch_id.clone(),
                }),
                indent + 4,
                end,
            )
        }
    };
    let siblings = beats
        .iter()
        .filter(|b| {
            (b.byte_start as usize) < scene_end
                && (b.byte_end as usize) <= scene_end
                && b.owner == owner
                && b.conditional_branch.as_ref().is_none_or(|g| g.ordinal == 0)
                && !trivia(b)
        })
        .collect::<Vec<_>>();
    // Unowned trivia never becomes an implicit branch insertion target.
    let end = if owner.is_some() {
        siblings
            .last()
            .map(|b| node_end(b, beats))
            .transpose()?
            .unwrap_or(end)
    } else {
        end
    };
    Ok(Body {
        owner,
        indent,
        end,
        siblings,
    })
}
/// A later top-level declaration ends the selected label's body. The legacy flat
/// projection can retain such rows losslessly, but it cannot authorize Story edits.
fn scene_body_end(source: &[u8]) -> Result<usize, SceneError> {
    let bom = usize::from(source.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    let text = std::str::from_utf8(&source[bom..]).map_err(|_| SceneError::UnsupportedSource)?;
    let lexical = crate::authoring::lexical_lines(&source[bom..], false)
        .map_err(|_| SceneError::UnsupportedSource)?
        .into_iter()
        .map(|(start, _)| start)
        .collect::<HashSet<_>>();
    let mut label_seen = false;
    for (start, _, line) in physical_lines(text) {
        if !label_seen {
            label_seen = line.starts_with("label ") && line.ends_with(':');
            continue;
        }
        if lexical.contains(&start)
            && indentation(line) == 0
            && !line.trim().is_empty()
            && !line.trim_start().starts_with('#')
        {
            return Ok(start + bom);
        }
    }
    Ok(source.len())
}

fn trivia(beat: &SceneBeat) -> bool {
    beat.conditional_branch.is_none()
        && matches!(&beat.payload, BeatPayload::CustomCode { source, .. } if source.trim().is_empty() || source.trim_start().starts_with('#'))
}
fn node_end(beat: &SceneBeat, beats: &[SceneBeat]) -> Result<usize, SceneError> {
    if let Some(group) = &beat.conditional_branch {
        conditional_extents(beats)
            .get(group.group_id.as_str())
            .map(|(_, end)| *end)
            .ok_or(SceneError::InvalidMetadata)
    } else {
        Ok(beat.byte_end as usize)
    }
}
fn terminal(beat: &SceneBeat, beats: &[SceneBeat]) -> bool {
    beat.conditional_branch.as_ref().map_or_else(
        || is_terminal_payload(&beat.payload),
        |g| !logic::group_may_continue(&g.group_id, beats, 0),
    )
}
fn root_may_continue(source: &[u8], beats: &[SceneBeat]) -> Result<bool, SceneError> {
    let end = scene_body_end(source)?;
    Ok(!beats
        .iter()
        .filter(|b| {
            (b.byte_start as usize) < end
                && (b.byte_end as usize) <= end
                && b.owner.is_none()
                && b.conditional_branch.as_ref().is_none_or(|g| g.ordinal == 0)
                && !trivia(b)
        })
        .any(|b| terminal(b, beats)))
}
fn qualified_node<'a>(body: &Body<'a>, node: &NodeRef) -> Result<&'a SceneBeat, SceneError> {
    body.siblings
        .iter()
        .copied()
        .find(|b| match node {
            NodeRef::Beat { beat_id } => b.id == *beat_id && b.conditional_branch.is_none(),
            NodeRef::Condition { group_id } => b
                .conditional_branch
                .as_ref()
                .is_some_and(|g| g.group_id == *group_id && g.ordinal == 0),
        })
        .ok_or(SceneError::InvariantBlocked)
}
fn generated_at_indent(
    payload: &BeatPayload,
    loaded: &Loaded,
    newline: &str,
    indent: usize,
) -> Result<String, SceneError> {
    let rendered = render_payload(payload, loaded, newline)?;
    let prefix = " ".repeat(indent - 4);
    Ok(rendered
        .split_inclusive('\n')
        .map(|line| format!("{prefix}{line}"))
        .collect())
}
fn apply(
    source: &[u8],
    beats: &[SceneBeat],
    edit: BodyEdit,
    loaded: &Loaded,
    scene: &SceneMetadata,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    let newline = if source.windows(2).any(|w| w == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    match edit {
        BodyEdit::Structural(edit) => operations::apply(source, beats, edit, loaded, scene),
        BodyEdit::Insert {
            body,
            position,
            payload,
        } => {
            validate_payload(&payload, loaded)?;
            let body = qualify_body(source, beats, &body)?;
            let (index, insertion) = match position {
                Position::Before { anchor } => {
                    let beat = qualified_node(&body, &anchor)?;
                    if beat.protected && beat.conditional_branch.is_none() {
                        return Err(SceneError::OpaqueBoundary);
                    }
                    (
                        body.siblings.iter().position(|b| b.id == beat.id).unwrap(),
                        beat.byte_start as usize,
                    )
                }
                Position::End => {
                    if body.owner.is_none() && body.end < source.len() {
                        return Err(SceneError::OpaqueBoundary);
                    }
                    if body.owner.is_none()
                        && body
                            .siblings
                            .last()
                            .is_some_and(|b| b.protected && b.conditional_branch.is_none())
                    {
                        return Err(SceneError::OpaqueBoundary);
                    }
                    (body.siblings.len(), body.end)
                }
            };
            if body.siblings[..index].iter().any(|b| terminal(b, beats))
                || (is_terminal_payload(&payload) && index < body.siblings.len())
            {
                return Err(SceneError::InvariantBlocked);
            }
            if boundary_is_opaque(beats, insertion) {
                return Err(SceneError::OpaqueBoundary);
            }
            let replacing_placeholder = body.owner.is_some()
                && body.siblings.len() == 1
                && body.siblings[0].structural_placeholder;
            let replacement_end = if replacing_placeholder {
                body.siblings[0].byte_end as usize
            } else {
                insertion
            };
            let insertion = if replacing_placeholder {
                body.siblings[0].byte_start as usize
            } else {
                insertion
            };
            let mut rendered = generated_at_indent(&payload, loaded, newline, body.indent)?;
            let mut forced = Vec::new();
            let mut offset = insertion;
            if insertion > 0 && source[insertion - 1] != b'\n' {
                rendered.insert_str(0, newline);
                offset += newline.len();
                if let Some(previous) = beats.iter().find(|b| b.byte_end as usize == insertion) {
                    let mut previous_bytes =
                        source[previous.byte_start as usize..insertion].to_vec();
                    previous_bytes.extend_from_slice(newline.as_bytes());
                    forced.push((
                        previous.payload.kind().into(),
                        sha256(&previous_bytes),
                        previous.id.clone(),
                        Some(previous.byte_start as usize),
                    ));
                }
            }
            forced.push((
                payload.kind().into(),
                sha256(&rendered.as_bytes()[offset - insertion..]),
                uuid::Uuid::new_v4().to_string(),
                Some(offset),
            ));
            let mut output = source.to_vec();
            output.splice(insertion..replacement_end, rendered.bytes());
            Ok((output, forced))
        }
        BodyEdit::Update { id, body, payload } => {
            validate_payload(&payload, loaded)?;
            let body = qualify_body(source, beats, &body)?;
            let beat = qualified_node(
                &body,
                &NodeRef::Beat {
                    beat_id: id.clone(),
                },
            )?;
            if beat.protected || beat.owner != body.owner {
                return Err(SceneError::OpaqueBoundary);
            }
            let index = body.siblings.iter().position(|b| b.id == id).unwrap();
            if body.siblings[..index].iter().any(|b| terminal(b, beats))
                || (is_terminal_payload(&payload) && index + 1 != body.siblings.len())
            {
                return Err(SceneError::InvariantBlocked);
            }
            let original = &source[beat.byte_start as usize..beat.byte_end as usize];
            let rendered = match (&beat.payload, &payload) {
                (
                    BeatPayload::Call {
                        return_label: old, ..
                    },
                    BeatPayload::Call {
                        scene_id,
                        return_label,
                    },
                ) => {
                    if old != return_label {
                        return Err(SceneError::InvariantBlocked);
                    }
                    let target = loaded
                        .project
                        .scenes
                        .iter()
                        .find(|s| &s.id == scene_id)
                        .ok_or(SceneError::UnknownEntity)?;
                    logic::patch_call_target(original, &target.technical_label)?
                }
                (BeatPayload::Choice { options: previous }, BeatPayload::Choice { options }) => {
                    logic::patch_menu(original, previous, options, loaded)?
                        .unwrap_or(generated_at_indent(&payload, loaded, newline, body.indent)?)
                }
                (
                    BeatPayload::Dialogue {
                        character_id: old, ..
                    },
                    BeatPayload::Dialogue { character_id, text },
                ) if old == character_id => patch_text(original, text)?,
                (BeatPayload::Narration { .. }, BeatPayload::Narration { text }) => {
                    patch_text(original, text)?
                }
                _ => {
                    // A full selected-statement replacement must not lose an attached comment.
                    let text =
                        std::str::from_utf8(original).map_err(|_| SceneError::UnsupportedSource)?;
                    if text
                        .lines()
                        .any(|line| logic::without_comment(line).len() != line.len())
                    {
                        return Err(SceneError::OpaqueBoundary);
                    }
                    generated_at_indent(&payload, loaded, newline, body.indent)?
                }
            };
            let mut output = source.to_vec();
            output.splice(
                beat.byte_start as usize..beat.byte_end as usize,
                rendered.bytes(),
            );
            Ok((
                output,
                vec![(
                    payload.kind().into(),
                    sha256(rendered.as_bytes()),
                    id,
                    Some(beat.byte_start as usize),
                )],
            ))
        }
    }
}
fn patch_text(original: &[u8], text: &str) -> Result<String, SceneError> {
    let mut original = std::str::from_utf8(original)
        .map_err(|_| SceneError::UnsupportedSource)?
        .to_owned();
    let (start, end) = dialogue_quotes(&original).ok_or(SceneError::OpaqueBoundary)?;
    original.replace_range(start + 1..end, &escape_string(text)?);
    Ok(original)
}

pub(super) fn mark_placeholders(beats: &mut [SceneBeat]) {
    let mut counts = HashMap::<(String, String), usize>::new();
    for beat in beats
        .iter()
        .filter(|b| !trivia(b) && b.conditional_branch.as_ref().is_none_or(|g| g.ordinal == 0))
    {
        if let Some(owner) = &beat.owner {
            *counts
                .entry((owner.group_id.clone(), owner.branch_id.clone()))
                .or_default() += 1;
        }
    }
    for beat in beats {
        beat.structural_placeholder = beat.owner.as_ref().is_some_and(|owner| {
            counts.get(&(owner.group_id.clone(), owner.branch_id.clone())) == Some(&1)
        }) && matches!(&beat.payload, BeatPayload::CustomCode { source, .. } if source.trim() == "pass");
    }
}
