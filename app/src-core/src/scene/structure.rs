//! Explicit-body Beat edits over verified disjoint source ranges.
use super::bodies::{qualify_body, root_may_continue, trivia, Bodies, Body};
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
    /// Dialogue continuation and core-prepared dialogue edits, addressed by Beat ID.
    Dialogue(BeatEdit),
}

pub(super) fn transfer(payload: &BeatPayload) -> bool {
    matches!(
        payload,
        BeatPayload::Call { .. }
            | BeatPayload::Jump { .. }
            | BeatPayload::RepeatChoice { .. }
            | BeatPayload::Choice { .. }
    )
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
            let (_, _, parsed) = parse_scene(
                scene,
                bytes,
                Some((
                    &loaded.project,
                    &loaded.authoring,
                    &loaded.source_map.owned_screens,
                )),
            )?;
            adjacency.insert(
                scene.id.clone(),
                parsed
                    .iter()
                    .flat_map(|b| match &b.payload {
                        BeatPayload::Call { scene_id, .. } => vec![(scene_id.clone(), true)],
                        BeatPayload::Jump { scene_id } => vec![(scene_id.clone(), false)],
                        BeatPayload::Choice { .. } => vec![],
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
            Some((
                &loaded.project,
                &loaded.authoring,
                &loaded.source_map.owned_screens,
            )),
        )?;
        if beats.len() >= MAX_BEATS_PER_SCENE
            && matches!(
                edit,
                BodyEdit::Insert { .. } | BodyEdit::Dialogue(BeatEdit::ContinueDialogue { .. })
            )
        {
            return Err(SceneError::InvariantBlocked);
        }
        let edit = self.prepare_call_labels(project, &beats, edit)?;
        let transfer_edit = match &edit {
            BodyEdit::Structural(_) => true,
            BodyEdit::Insert { payload, .. } | BodyEdit::Update { payload, .. } => {
                transfer(payload)
            }
            BodyEdit::Dialogue(_) => false,
        };
        let screen_update = match &edit {
            BodyEdit::Update { id, payload, .. } => payload
                .screen_target()
                .map(|target| (id.clone(), target.clone())),
            _ => None,
        };
        let mut edit = edit;
        let mut install_target = None;
        match &mut edit {
            BodyEdit::Insert {
                body,
                payload: BeatPayload::RepeatChoice { target },
                ..
            }
            | BodyEdit::Update {
                body,
                payload: BeatPayload::RepeatChoice { target },
                ..
            } => {
                let menu = choice::owning_menu(&beats, body)?;
                let existing = choice::target(&source, menu);
                let selected = existing
                    .clone()
                    .unwrap_or_else(|| format!("_ll_choice_{}", uuid::Uuid::new_v4().simple()));
                if target.as_ref().is_some_and(|t| t != &selected) {
                    return Err(SceneError::InvariantBlocked);
                }
                let labels = self.call_label_inventory(project)?;
                if labels.get(&selected).copied().unwrap_or(0) != usize::from(existing.is_some()) {
                    return Err(SceneError::InvariantBlocked);
                }
                *target = Some(selected.clone());
                if existing.is_none() {
                    install_target = Some((menu, selected));
                }
            }
            _ => {}
        }
        let (mut proposed, mut forced) = apply(&source, &beats, edit, &loaded, &scene)?;
        if let Some((menu, target)) = install_target {
            let start = menu.byte_start as usize;
            let indent = indentation(
                std::str::from_utf8(&source[start..menu.byte_end as usize])
                    .map_err(|_| SceneError::UnsupportedSource)?,
            );
            let newline = if source.windows(2).any(|w| w == b"\r\n") {
                "\r\n"
            } else {
                "\n"
            };
            let label = format!("{}label {target}:{newline}", " ".repeat(indent));
            for (_, _, _, anchor) in &mut forced {
                if let Some(at) = anchor {
                    if *at >= start {
                        *at += label.len();
                    }
                }
            }
            proposed.splice(start..start, label.bytes());
            forced.push((
                "choice".into(),
                sha256(&proposed[start..menu.byte_end as usize + label.len()]),
                menu.id.clone(),
                Some(start),
            ));
        }
        logic::validate_conditional_completion(&proposed, &scene, &loaded)?;
        if transfer_edit {
            self.validate_candidate_transfers(
                project,
                &loaded,
                &[(scene_id, proposed.as_slice())],
            )?;
        }
        let (mut mapping, next_beats) = build_mapping(
            &scene,
            &proposed,
            &sha256(&proposed),
            Some(&stored),
            &forced,
            Some((
                &loaded.project,
                &loaded.authoring,
                &loaded.source_map.owned_screens,
            )),
        )?;
        set_prepared_screen_target(&mut mapping, screen_update)?;
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
        let mut runtime = self.choice_scene_runtime(
            project,
            &scene.source_path,
            &source,
            &proposed,
            &next_beats,
        )?;
        runtime.extend(vec![
            replace_mutation(&scene.source_path, source, revision, proposed)?,
            replace_mutation(
                SOURCE_MAP_PATH,
                loaded.source_map_bytes,
                loaded.source_map_revision,
                source_map_bytes(&loaded.source_map)?,
            )?,
        ]);
        Ok(TransactionProposal {
            mutations: runtime,
            intent: TransactionIntent::Edit,
        })
    }
}

pub(super) fn node_end(beat: &SceneBeat, beats: &[SceneBeat]) -> Result<usize, SceneError> {
    if matches!(beat.payload, BeatPayload::Choice { .. }) {
        return choice::end(beat, beats);
    }
    if let Some(group) = &beat.conditional_branch {
        conditional_extents(beats)
            .get(group.group_id.as_str())
            .map(|(_, end)| *end)
            .ok_or(SceneError::InvalidMetadata)
    } else {
        Ok(beat.byte_end as usize)
    }
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
pub(super) fn apply(
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
        BodyEdit::Dialogue(edit) => apply_beat_edit(source, beats, edit, loaded),
        BodyEdit::Insert {
            body,
            position,
            payload,
        } => {
            validate_payload(&payload, loaded)?;
            // A new beat finds its body and anchor by id. If either is gone, the draft conflicts.
            // An anchor that exists in another body is still an invariant refusal.
            if let BodyRef::Branch {
                group_id,
                branch_id,
            } = &body
            {
                if !beats.iter().any(|b| {
                    b.id == *branch_id
                        && b.conditional_branch
                            .as_ref()
                            .is_some_and(|g| g.group_id == *group_id)
                }) {
                    return Err(SceneError::BeatDraftConflict);
                }
            }
            let body = qualify_body(source, beats, &body)?;
            if let Position::Before { anchor } = &position {
                if !beats.iter().any(|b| match anchor {
                    NodeRef::Beat { beat_id } => b.id == *beat_id,
                    NodeRef::Condition { group_id } => b
                        .conditional_branch
                        .as_ref()
                        .is_some_and(|g| g.group_id == *group_id),
                }) {
                    return Err(SceneError::BeatDraftConflict);
                }
            }
            // An empty body's place replaces its `pass`.
            let (insertion, replacement_end) = body.place(
                &position,
                source,
                beats,
                None,
                is_terminal_payload(&payload),
            )?;
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
            if matches!(payload, BeatPayload::Choice { .. }) {
                choice::retain_insertion(
                    source,
                    beats,
                    insertion,
                    replacement_end,
                    rendered.len(),
                    &mut forced,
                );
            }
            let mut output = source.to_vec();
            output.splice(insertion..replacement_end, rendered.bytes());
            if matches!(payload, BeatPayload::Choice { .. }) {
                let (_, _, parsed) = parse_scene(
                    scene,
                    &output,
                    Some((
                        &loaded.project,
                        &loaded.authoring,
                        &loaded.source_map.owned_screens,
                    )),
                )?;
                if !parsed
                    .iter()
                    .any(|b| b.start == offset && matches!(b.payload, BeatPayload::Choice { .. }))
                {
                    return Err(SceneError::InvariantBlocked);
                }
            }
            Ok((output, forced))
        }
        BodyEdit::Update { id, body, payload } => {
            validate_payload(&payload, loaded)?;
            let body = qualify_body(source, beats, &body)?;
            let beat = body.node(&NodeRef::Beat {
                beat_id: id.clone(),
            })?;
            if beat.protected || beat.owner != body.owner {
                return Err(SceneError::OpaqueBoundary);
            }
            let index = body.siblings.iter().position(|b| b.id == id).unwrap();
            if body.siblings[..index].iter().any(|b| body.ends(b))
                || (is_terminal_payload(&payload) && index + 1 != body.siblings.len())
            {
                return Err(SceneError::InvariantBlocked);
            }
            if matches!(beat.payload, BeatPayload::Choice { .. })
                != matches!(payload, BeatPayload::Choice { .. })
            {
                return Err(SceneError::InvariantBlocked);
            }
            if let BeatPayload::Choice {
                options,
                prompt,
                picked_policy,
            } = &payload
            {
                return choice::update(
                    source,
                    beats,
                    beat,
                    options,
                    prompt.as_ref(),
                    *picked_policy,
                    loaded,
                );
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
                (previous, next)
                    if previous.screen_target().is_some() && next.screen_target().is_some() =>
                {
                    patch_screen_beat(original, previous, next)?
                        .ok_or(SceneError::OpaqueBoundary)?
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
                (BeatPayload::SetVariable { .. }, BeatPayload::SetVariable { .. }) => {
                    patch_variable_assignment(original, &beat.payload, &payload, loaded)?
                        .ok_or(SceneError::OpaqueBoundary)?
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
    for beat in beats.iter().filter(|b| {
        !trivia(b)
            && b.conditional_branch
                .as_ref()
                .is_none_or(|g| g.opens_group())
    }) {
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
