//! Read-only guarded/body/call flow from the verified shared source model.
use super::*;
use crate::conditions::Condition;

fn location(scene: &SceneMetadata, revision: &str, beat: &SceneBeat) -> FlowLocation {
    FlowLocation {
        path: scene.source_path.clone(),
        revision: revision.into(),
        byte_start: beat.byte_start,
        byte_end: beat.byte_end,
    }
}
fn guards(beat: &SceneBeat, beats: &[SceneBeat]) -> Vec<FlowGuard> {
    let mut result = Vec::new();
    let mut owner = beat.owner.as_ref();
    for _ in 0..MAX_CONDITION_NESTING {
        let Some(current) = owner else {
            break;
        };
        let Some(header) = beats.iter().find(|b| b.id == current.branch_id) else {
            break;
        };
        let Some(branch) = &header.conditional_branch else {
            break;
        };
        result.push(FlowGuard {
            branch_id: header.id.clone(),
            branch: branch.clone(),
        });
        owner = header.owner.as_ref();
    }
    result.reverse();
    result
}
fn body(
    scene: &SceneMetadata,
    revision: &str,
    beat: Option<&SceneBeat>,
    owner: Option<crate::metadata::BeatOwner>,
) -> FlowBody {
    FlowBody {
        scene_id: scene.id.clone(),
        beat_id: beat.map(|b| b.id.clone()),
        owner,
        location: beat.map(|b| location(scene, revision, b)),
    }
}
fn destination(target: FlowBody) -> FlowDestination {
    FlowDestination::Body {
        scene_id: target.scene_id,
        beat_id: target.beat_id,
        owner: target.owner,
        location: target.location,
    }
}
fn next_body(
    scene: &SceneMetadata,
    revision: &str,
    beats: &[SceneBeat],
    origin: &SceneBeat,
    after_group: bool,
) -> FlowBody {
    let groups = conditional_extents(beats);
    let mut offset = if after_group {
        origin
            .conditional_branch
            .as_ref()
            .and_then(|g| groups.get(g.group_id.as_str()))
            .map_or(origin.byte_end as usize, |(_, end)| *end)
    } else {
        origin.byte_end as usize
    };
    let mut owner = origin.owner.clone();
    for _ in 0..=MAX_CONDITION_NESTING {
        if let Some(next) = beats.iter().find(|b| b.byte_start as usize >= offset && b.owner == owner
            && b.conditional_branch.as_ref().is_none_or(|branch| branch.ordinal == 0)
            && !matches!(&b.payload, BeatPayload::CustomCode { source, .. } if source.trim().is_empty() || source.trim_start().starts_with('#'))) {
            return body(scene, revision, Some(next), owner);
        }
        let Some(current) = &owner else {
            break;
        };
        offset = groups
            .get(current.group_id.as_str())
            .map_or(bytes_end(beats), |(_, end)| *end);
        owner = beats
            .iter()
            .find(|b| b.id == current.branch_id)
            .and_then(|b| b.owner.clone());
    }
    body(scene, revision, None, None)
}
fn bytes_end(beats: &[SceneBeat]) -> usize {
    beats.last().map_or(0, |b| b.byte_end as usize)
}
fn edge(
    scene: &SceneMetadata,
    revision: &str,
    beat: &SceneBeat,
    kind: &str,
    text: String,
    dest: FlowDestination,
    guard_path: Vec<FlowGuard>,
) -> FlowEdge {
    FlowEdge {
        id: format!("{}:{}:{kind}", scene.id, beat.id),
        scene_id: scene.id.clone(),
        beat_id: Some(beat.id.clone()),
        option_ordinal: None,
        text,
        kind: kind.into(),
        location: location(scene, revision, beat),
        destination: dest,
        editable: false,
        guard_path,
        condition: None,
        continuation: None,
        return_label: None,
    }
}
pub(super) fn project(
    scene: &SceneMetadata,
    bytes: &[u8],
    revision: &str,
    beats: &[SceneBeat],
    inventory: &Inventory,
    nodes: &[FlowNode],
) -> Vec<FlowEdge> {
    let mut edges = Vec::new();
    let mut unknown = beats.is_empty();
    let mut unresolved_continuation = false;
    let mut ambiguous_returns = Vec::new();
    let bom = usize::from(bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    let lexical = lexical_lines(&bytes[bom..], false)
        .unwrap_or_default()
        .into_iter()
        .map(|(start, _)| start + bom)
        .collect::<HashSet<_>>();
    for beat in beats {
        if beat.structural_placeholder {
            continue;
        }
        let path = guards(beat, beats);
        if let Some(branch) = &beat.conditional_branch {
            let owner = crate::metadata::BeatOwner {
                group_id: branch.group_id.clone(),
                branch_id: beat.id.clone(),
            };
            let child = beats
                .iter()
                .find(|b| b.owner.as_ref() == Some(&owner) && !b.structural_placeholder);
            let mut guard_path = path.clone();
            guard_path.push(FlowGuard {
                branch_id: beat.id.clone(),
                branch: branch.clone(),
            });
            let mut branch_edge = edge(
                scene,
                revision,
                beat,
                "guard",
                if branch.otherwise {
                    "Otherwise".into()
                } else if branch.ordinal == 0 {
                    "If".into()
                } else {
                    "Else If".into()
                },
                destination(body(scene, revision, child, Some(owner))),
                guard_path,
            );
            branch_edge.condition = branch.condition.clone();
            edges.push(branch_edge);
            unknown |= matches!(branch.condition, Some(Condition::Unknown { .. }));
            if branch.ordinal == 0
                && super::super::logic::group_may_continue(&branch.group_id, beats, 0)
            {
                let target = next_body(scene, revision, beats, beat, true);
                unresolved_continuation |= target.beat_id.is_none();
                edges.push(edge(
                    scene,
                    revision,
                    beat,
                    "continuation",
                    "Continue after condition".into(),
                    destination(target),
                    path,
                ));
            }
            continue;
        }
        match &beat.payload {
            BeatPayload::Call {
                scene_id,
                return_label,
            } => {
                let label = nodes
                    .iter()
                    .find(|n| &n.scene_id == scene_id)
                    .map(|n| n.label.as_str());
                let mut call = edge(
                    scene,
                    revision,
                    beat,
                    "call",
                    "Call · returns to continuation".into(),
                    inventory.destination(label, nodes),
                    path,
                );
                let continuation = next_body(scene, revision, beats, beat, false);
                unresolved_continuation |= continuation.beat_id.is_none();
                call.continuation = Some(continuation);
                call.return_label = return_label.clone();
                if !inventory.complete
                    || return_label.as_ref().is_none_or(|label| {
                        inventory
                            .labels
                            .get(label)
                            .is_none_or(|rows| rows.len() != 1)
                    })
                {
                    ambiguous_returns.push(call.clone());
                }
                edges.push(call);
            }
            BeatPayload::Jump { scene_id } => {
                let label = nodes
                    .iter()
                    .find(|n| &n.scene_id == scene_id)
                    .map(|n| n.label.as_str());
                let mut jump = edge(
                    scene,
                    revision,
                    beat,
                    "jump",
                    "Jump".into(),
                    inventory.destination(label, nodes),
                    path,
                );
                jump.editable = beat.owner.is_none()
                    && !beats
                        .iter()
                        .any(|b| b.protected && b.conditional_branch.is_none());
                edges.push(jump);
            }
            BeatPayload::Return => edges.push(edge(
                scene,
                revision,
                beat,
                "return",
                "Return / End".into(),
                FlowDestination::Terminal,
                path,
            )),
            BeatPayload::Choice { options } => {
                for (ordinal, option) in options.iter().enumerate() {
                    let label = nodes
                        .iter()
                        .find(|n| n.scene_id == option.destination_scene_id)
                        .map(|n| n.label.as_str());
                    let mut choice = edge(
                        scene,
                        revision,
                        beat,
                        "choice",
                        option.text.clone(),
                        inventory.destination(label, nodes),
                        path.clone(),
                    );
                    choice.id = format!("{}:{}:choice:{ordinal}", scene.id, beat.id);
                    choice.option_ordinal = Some(ordinal);
                    choice.condition = option.condition.clone();
                    choice.editable = beat.owner.is_none()
                        && options.iter().all(|o| o.condition.is_none())
                        && !beats
                            .iter()
                            .any(|b| b.protected && b.conditional_branch.is_none());
                    unknown |= matches!(option.condition, Some(Condition::Unknown { .. }));
                    edges.push(choice);
                }
                if super::super::logic::choice_may_continue(options) {
                    let target = next_body(scene, revision, beats, beat, false);
                    unresolved_continuation |= target.beat_id.is_none();
                    edges.push(edge(
                        scene,
                        revision,
                        beat,
                        "continuation",
                        "No available choices · continue".into(),
                        destination(target),
                        path,
                    ));
                }
            }
            BeatPayload::CustomCode { source, .. } => {
                if source.trim().is_empty() || source.trim_start().starts_with('#') {
                    continue;
                }
                unknown = true;
                let expected_indent = beat
                    .owner
                    .as_ref()
                    .and_then(|o| beats.iter().find(|b| b.id == o.branch_id))
                    .and_then(|b| match &b.payload {
                        BeatPayload::CustomCode { source, .. } => Some(indentation(source) + 4),
                        _ => None,
                    })
                    .unwrap_or(4);
                if lexical.contains(&(beat.byte_start as usize))
                    && indentation(source) == expected_indent
                {
                    if let Some((label, return_label)) =
                        super::super::logic::parse_call(source.trim_start())
                    {
                        let mut call = edge(
                            scene,
                            revision,
                            beat,
                            "call",
                            "Call target unavailable".into(),
                            inventory.destination(Some(label), nodes),
                            path,
                        );
                        call.return_label = Some(return_label.into());
                        call.continuation = Some(next_body(scene, revision, beats, beat, false));
                        edges.push(call);
                    }
                }
            }
            _ => {}
        }
    }
    // Preserve the older scanner's diagnostics for opaque/missing/dynamic transfer
    // forms. Its aggregate unknown marker is retained only for actual uncertainty.
    unknown |= unresolved_continuation;
    for mut ambiguous in ambiguous_returns {
        ambiguous.id.push_str(":ambiguous-return");
        ambiguous.kind = "unknown".into();
        ambiguous.text = "Return label is duplicated or cannot be verified".into();
        ambiguous.destination = FlowDestination::Unknown {
            label: ambiguous.return_label.clone(),
            location: Some(ambiguous.location.clone()),
        };
        ambiguous.continuation = None;
        edges.push(ambiguous);
    }
    for mut legacy in project_scene_legacy(scene, bytes, revision, beats, inventory, nodes) {
        if legacy.kind == "unknown" {
            if unknown || edges.is_empty() {
                if unresolved_continuation {
                    legacy.text="Continuation outside this Scene is unknown; add an explicit ending in Source.".into();
                }
                edges.push(legacy);
            }
        } else if legacy.beat_id.is_none() {
            edges.push(legacy);
        }
    }
    edges
}
pub(super) fn diagnose_calls(workspace: &mut FlowWorkspace) {
    let mut adjacency = HashMap::<String, Vec<(String, bool)>>::new();
    for edge in &workspace.edges {
        if matches!(edge.kind.as_str(), "call" | "jump" | "choice") {
            if let FlowDestination::Resolved { scene_id } = &edge.destination {
                adjacency
                    .entry(edge.scene_id.clone())
                    .or_default()
                    .push((scene_id.clone(), edge.kind == "call"));
            }
        }
    }
    let mut diagnostics = Vec::new();
    for call in workspace.edges.iter().filter(|e| e.kind == "call") {
        let FlowDestination::Resolved { scene_id } = &call.destination else {
            continue;
        };
        if super::super::logic::call_route_is_unsupported(&adjacency, &call.scene_id, scene_id) {
            let mut diagnostic = call.clone();
            diagnostic.id.push_str(":unsupported");
            diagnostic.kind = "unknown".into();
            diagnostic.text = "Possible recursion or call-depth limit · route unknown".into();
            diagnostic.destination = FlowDestination::Unknown {
                label: None,
                location: Some(call.location.clone()),
            };
            diagnostic.continuation = None;
            diagnostic.return_label = None;
            diagnostics.push(diagnostic);
            workspace.partial = true;
            if let Some(node) = workspace
                .nodes
                .iter_mut()
                .find(|n| n.scene_id == call.scene_id)
            {
                node.partial = true;
            }
        }
    }
    workspace.edges.extend(diagnostics);
}
