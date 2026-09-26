//! Read-only, bounded flow over the shared Scene/source boundary.
use super::*;
use crate::authoring::{lexical_lines, lexical_ranges};
use std::collections::BTreeMap;
pub const MAX_FLOW_SCENES: usize = 500;
pub const MAX_FLOW_EDGES: usize = 2_000;
const MAX_FILES: usize = 2_048;
const MAX_BYTES: usize = 32 * 1024 * 1024;
const MAX_FILE_BYTES: u64 = 16 * 1024 * 1024;
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowLocation {
    pub path: String,
    pub revision: String,
    pub byte_start: u64,
    pub byte_end: u64,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowNode {
    pub scene_id: String,
    pub name: String,
    pub label: String,
    pub location: Option<FlowLocation>,
    pub partial: bool,
    pub stale: bool,
}
#[derive(Clone, Debug, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "kind"
)]
pub enum FlowDestination {
    Resolved {
        scene_id: String,
    },
    Missing {
        label: String,
    },
    Unknown {
        label: Option<String>,
        location: Option<FlowLocation>,
    },
    Terminal,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowEdge {
    pub id: String,
    pub scene_id: String,
    pub beat_id: Option<String>,
    pub option_ordinal: Option<usize>,
    pub text: String,
    pub kind: String,
    pub location: FlowLocation,
    pub destination: FlowDestination,
    pub editable: bool,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowWorkspace {
    pub revision: String,
    pub entry_scene_id: String,
    pub entry_location: Option<FlowLocation>,
    pub entry_notice: String,
    pub nodes: Vec<FlowNode>,
    pub edges: Vec<FlowEdge>,
    pub partial: bool,
    pub stale: bool,
    pub over_limit: bool,
    pub notice: String,
}
#[derive(Default)]
struct Inventory {
    labels: BTreeMap<String, Vec<FlowLocation>>,
    complete: bool,
}
impl Inventory {
    fn destination(&self, label: Option<&str>, nodes: &[FlowNode]) -> FlowDestination {
        let Some(label) = label else {
            return FlowDestination::Unknown {
                label: None,
                location: None,
            };
        };
        match self.labels.get(label).map(Vec::as_slice) {
            Some([location]) if self.complete => {
                if let Some(node) = nodes.iter().find(|node| {
                    node.label == label
                        && !node.stale
                        && node
                            .location
                            .as_ref()
                            .is_some_and(|origin| origin.path == location.path)
                }) {
                    FlowDestination::Resolved {
                        scene_id: node.scene_id.clone(),
                    }
                } else {
                    FlowDestination::Unknown {
                        label: Some(label.into()),
                        location: Some(location.clone()),
                    }
                }
            }
            None if self.complete => FlowDestination::Missing {
                label: label.into(),
            },
            _ => FlowDestination::Unknown {
                label: Some(label.into()),
                location: None,
            },
        }
    }
}
impl AuthoringService {
    pub fn flow_workspace(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<FlowWorkspace, SceneError> {
        let profile_enabled = std::env::var("LOOMLIGHT_PROFILE_FLOW").as_deref() == Ok("1");
        let profile_started = std::time::Instant::now();
        let mut profile_last = profile_started;
        let mut profile_stages = Vec::new();
        let mut profile_mark = |name: &'static str| {
            if profile_enabled {
                let now = std::time::Instant::now();
                profile_stages.push((name, now.duration_since(profile_last)));
                profile_last = now;
            }
        };
        self.source_refresh_project(project, project_id)
            .map_err(|_| SceneError::SourceConflict)?;
        profile_mark("source_refresh");
        let loaded = self.load(project, project_id)?;
        profile_mark("load_metadata");
        let mut result = FlowWorkspace {
            revision: String::new(),
            entry_scene_id: loaded
                .project
                .entry_scene_id
                .clone()
                .ok_or(SceneError::InvalidMetadata)?,
            entry_location: None,
            entry_notice: "Project start is unresolved".into(),
            nodes: vec![],
            edges: vec![],
            partial: false,
            stale: false,
            over_limit: false,
            notice: "Accepted source; custom/runtime flow may be incomplete.".into(),
        };
        if loaded.project.scenes.len() > MAX_FLOW_SCENES {
            return Ok(over_limit(result));
        }
        let paths = match self
            .transactions
            .inventory_files_bounded(project, "game", 8192)
        {
            Ok(paths) => paths
                .into_iter()
                .filter(|path| path.ends_with(".rpy"))
                .collect::<Vec<_>>(),
            Err(error) if error.code == ErrorCode::InvalidProposal => {
                return Ok(over_limit(result))
            }
            Err(_) => {
                result.partial = true;
                result.stale = true;
                result.notice = "Source inventory unavailable; open Source to inspect.".into();
                return Ok(result);
            }
        };
        profile_mark("inventory");
        if paths.len() > MAX_FILES {
            return Ok(over_limit(result));
        }
        let mut inventory = Inventory {
            complete: true,
            ..Inventory::default()
        };
        let mut files = BTreeMap::new();
        let mut total = 0_usize;
        let snapshots = self
            .transactions
            .observation_snapshots(project, &paths, MAX_FILE_BYTES as usize, MAX_BYTES)
            .map_err(diagnostic_error)?;
        profile_mark("snapshot_read_hash");
        for (path, snapshot) in paths.iter().zip(snapshots) {
            let (bytes, revision) = match snapshot {
                Ok(value) => value,
                Err(error) if error.code == ErrorCode::InvalidProposal => {
                    return Ok(over_limit(result))
                }
                Err(_) => {
                    inventory.complete = false;
                    continue;
                }
            };
            total = total.saturating_add(bytes.len());
            if bytes.len() > MAX_FILE_BYTES as usize || total > MAX_BYTES {
                return Ok(over_limit(result));
            }
            collect_labels(path, &bytes, &revision.sha256, &mut inventory);
            files.insert(path.clone(), (bytes, revision));
        }
        profile_mark("label_inventory");
        for scene in &loaded.project.scenes {
            let file = files.get(&scene.source_path);
            let stored = loaded
                .source_map
                .scene_mappings
                .iter()
                .find(|mapping| mapping.scene_id == scene.id);
            let stale = !file
                .zip(stored)
                .is_some_and(|((_, revision), mapping)| revision.sha256 == mapping.source_revision);
            let location = inventory
                .labels
                .get(&scene.technical_label)
                .and_then(|locations| {
                    (locations.len() == 1 && locations[0].path == scene.source_path)
                        .then(|| locations[0].clone())
                });
            result.nodes.push(FlowNode {
                scene_id: scene.id.clone(),
                name: scene.display_name.clone(),
                label: scene.technical_label.clone(),
                location,
                partial: stale,
                stale,
            });
        }
        profile_mark("node_projection");
        // Runnable entry comes from the unique accepted `start` declaration,
        // never from Chapter order or stale convenience metadata.
        result.entry_scene_id.clear();
        if inventory.complete {
            if let Some([start]) = inventory.labels.get("start").map(Vec::as_slice) {
                result.entry_location = Some(start.clone());
                if let Some(node) = result
                    .nodes
                    .iter()
                    .find(|node| node.label == "start" && !node.stale)
                {
                    result.entry_scene_id = node.scene_id.clone();
                } else if let Some((bytes, _)) = files.get(&start.path) {
                    if let Some(label) = entry_jump(bytes, start) {
                        if let FlowDestination::Resolved { scene_id } =
                            inventory.destination(Some(&label), &result.nodes)
                        {
                            result.entry_scene_id = scene_id;
                        }
                    }
                }
            }
        }
        result.entry_notice = if result.entry_scene_id.is_empty() {
            result.partial = true;
            "Project start is custom, missing or ambiguous; no entry Scene is inferred.".into()
        } else {
            "Project start resolves to the marked entry Scene.".into()
        };
        for scene in &loaded.project.scenes {
            if result
                .nodes
                .iter()
                .find(|node| node.scene_id == scene.id)
                .unwrap()
                .stale
            {
                result.stale = true;
                result.partial = true;
                continue;
            }
            let (bytes, revision) = &files[&scene.source_path];
            let mapping = loaded
                .source_map
                .scene_mappings
                .iter()
                .find(|mapping| mapping.scene_id == scene.id);
            let beats = build_mapping(
                scene,
                bytes,
                &revision.sha256,
                mapping,
                &[],
                Some((&loaded.project, &loaded.authoring)),
            )
            .map(|(_, beats)| beats)
            .unwrap_or_default();
            let edges = project_scene(
                scene,
                bytes,
                &revision.sha256,
                &beats,
                &inventory,
                &result.nodes,
            );
            if result.edges.len().saturating_add(edges.len()) > MAX_FLOW_EDGES {
                return Ok(over_limit(result));
            }
            let partial = edges
                .iter()
                .any(|edge| matches!(edge.destination, FlowDestination::Unknown { .. }))
                || beats.is_empty();
            result
                .nodes
                .iter_mut()
                .find(|node| node.scene_id == scene.id)
                .unwrap()
                .partial |= partial;
            result.partial |= partial;
            result.edges.extend(edges);
        }
        profile_mark("edge_projection");
        // Observation only; the UI never acquires a write precondition from this.
        let observed = files
            .iter()
            .map(|(path, (_, revision))| (path.as_str(), revision))
            .collect::<Vec<_>>();
        if !self
            .transactions
            .observations_still_current(project, &observed, MAX_FILE_BYTES)
            .unwrap_or(false)
        {
            result.stale = true;
        }
        profile_mark("freshness_read_hash");
        if self
            .transactions
            .inventory_files_bounded(project, "game", 8192)
            .ok()
            .map(|items| {
                items
                    .into_iter()
                    .filter(|path| path.ends_with(".rpy"))
                    .collect::<Vec<_>>()
            })
            != Some(paths)
        {
            result.stale = true;
        }
        profile_mark("inventory_recheck");
        let mut reader = self
            .transactions
            .observation_reader(project)
            .map_err(diagnostic_error)?;
        for (path, revision) in [
            (PROJECT_PATH, &loaded.project_revision),
            (SOURCE_MAP_PATH, &loaded.source_map_revision),
        ] {
            if !reader
                .revision_bounded(
                    &RelativePath::new(path).map_err(|_| SceneError::Io)?,
                    MAX_FILE_BYTES,
                )
                .is_ok_and(|current| current == *revision)
            {
                result.stale = true;
            }
        }
        profile_mark("metadata_recheck");
        result.partial |= !inventory.complete || result.stale;
        let mut hash = Sha256::new();
        hash.update(loaded.project_revision.sha256.as_bytes());
        hash.update(loaded.source_map_revision.sha256.as_bytes());
        for (path, (_, revision)) in &files {
            hash.update(path.as_bytes());
            hash.update(revision.sha256.as_bytes());
        }
        hash.update([u8::from(result.partial), u8::from(result.stale)]);
        result.revision = hex::encode(hash.finalize());
        if result.stale {
            for edge in &mut result.edges {
                edge.editable = false;
            }
            result.notice = "Stale projection: source changed or could not be reconciled. Refresh or inspect Source.".into();
        } else if result.partial {
            result.notice =
                "Partial flow: custom, dynamic or unmapped source remains unknown.".into();
        }
        profile_mark("finalize");
        if profile_enabled {
            let stages = profile_stages
                .iter()
                .map(|(name, elapsed)| format!("{name}={:.3}", elapsed.as_secs_f64() * 1000.0))
                .collect::<Vec<_>>()
                .join(";");
            eprintln!(
                "phase-1g-flow-profile: total_ms={:.3};files={};scenes={};edges={};{stages}",
                profile_started.elapsed().as_secs_f64() * 1000.0,
                files.len(),
                result.nodes.len(),
                result.edges.len()
            );
        }
        Ok(result)
    }
}
fn over_limit(mut result: FlowWorkspace) -> FlowWorkspace {
    result.nodes.clear();
    result.edges.clear();
    result.over_limit = true;
    result.partial = true;
    result.notice = "Graph limit exceeded (500 Scenes / 2,000 edges; inventory 2,048 files / 32 MiB). Open Source to continue.".into();
    result
}
fn identifier(value: &str) -> bool {
    let mut chars = value.chars();
    chars
        .next()
        .is_some_and(|ch| ch == '_' || ch.is_ascii_alphabetic())
        && chars.all(|ch| ch == '_' || ch.is_ascii_alphanumeric())
}
fn collect_labels(path: &str, bytes: &[u8], revision: &str, inventory: &mut Inventory) {
    let bom = usize::from(bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    let bytes = &bytes[bom..];
    let Ok(lines) = lexical_ranges(bytes, false, false) else {
        inventory.complete = false;
        return;
    };
    for (start, end) in lines {
        let line = std::str::from_utf8(&bytes[start..end]).unwrap();
        if line.split_whitespace().next() == Some("label") {
            let Some(rest) = line.strip_prefix("label ") else {
                inventory.complete = false;
                continue;
            };
            if line.starts_with("label ") && rest.strip_suffix(':').is_some_and(identifier) {
                inventory
                    .labels
                    .entry(rest.strip_suffix(':').unwrap().into())
                    .or_default()
                    .push(FlowLocation {
                        path: path.into(),
                        revision: revision.into(),
                        byte_start: (start + bom) as u64,
                        byte_end: (end + bom) as u64,
                    });
            } else {
                inventory.complete = false;
            }
        }
    }
}
fn project_scene(
    scene: &SceneMetadata,
    bytes: &[u8],
    revision: &str,
    beats: &[SceneBeat],
    inventory: &Inventory,
    nodes: &[FlowNode],
) -> Vec<FlowEdge> {
    let bom = usize::from(bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    let Ok(text) = std::str::from_utf8(&bytes[bom..]) else {
        return vec![];
    };
    let lexical = lexical_lines(&bytes[bom..], false)
        .unwrap_or_default()
        .into_iter()
        .map(|(start, _)| start + bom)
        .collect::<HashSet<_>>();
    let lines = physical_lines(text)
        .into_iter()
        .map(|(start, end, body)| (start + bom, end + bom, body))
        .collect::<Vec<_>>();
    let mut edges = vec![];
    let mut in_scene = false;
    let mut menu_start = None;
    let mut ordinal = 0;
    let mut unknown_block = false;
    let mut consumed_to = 0;
    for (index, &(start, end, body)) in lines.iter().enumerate() {
        if edges.len() > MAX_FLOW_EDGES {
            break;
        }
        if start < consumed_to {
            continue;
        }
        if !lexical.contains(&start) {
            if in_scene && !body.trim().is_empty() {
                unknown_block = true;
            }
            continue;
        }
        if body == format!("label {}:", scene.technical_label) {
            in_scene = true;
            continue;
        }
        if !in_scene {
            continue;
        }
        if !body.is_empty() && !body.starts_with(' ') && !body.starts_with('#') {
            unknown_block = true;
            break;
        }
        if body.trim().is_empty() || body.trim_start().starts_with('#') {
            continue;
        }
        if body == "    menu:" {
            menu_start = Some(start);
            ordinal = 0;
            continue;
        }
        if body.starts_with("    ") && !body.starts_with("     ") {
            menu_start = None;
        }
        let kind;
        let title;
        let mut label = None;
        let mut option = None;
        let mut range_end = end;
        let mut origin_start = start;
        if let Some(menu) = menu_start {
            if let Some(option_text) = choice_option_text(body) {
                kind = "choice";
                title = option_text;
                option = Some(ordinal);
                ordinal += 1;
                origin_start = menu;
                if let Some(&(jump_start, jump_end, jump_body)) = lines.get(index + 1) {
                    if lexical.contains(&jump_start) {
                        label = jump_body
                            .strip_prefix("            jump ")
                            .filter(|value| identifier(value));
                        if label.is_some() {
                            range_end = jump_end;
                            consumed_to = jump_end;
                        }
                    }
                }
            } else {
                unknown_block = true;
                continue;
            }
        } else if body == "    return" {
            kind = "return";
            title = "Return / End".into();
        } else if let Some(target) = body.strip_prefix("    jump ") {
            kind = "jump";
            title = "Jump".into();
            label = Some(target).filter(|value| identifier(value));
        } else {
            if beats
                .iter()
                .any(|beat| beat.byte_start == start as u64 && !beat.protected)
            {
                continue;
            }
            unknown_block = true;
            continue;
        }
        let mapped = beats.iter().find(|beat| {
            beat.byte_start == origin_start as u64
                && !beat.protected
                && ((kind == "choice" && matches!(beat.payload, BeatPayload::Choice { .. }))
                    || (kind == "jump" && matches!(beat.payload, BeatPayload::Jump { .. }))
                    || (kind == "return" && matches!(beat.payload, BeatPayload::Return)))
        });
        let destination = if kind == "return" {
            FlowDestination::Terminal
        } else {
            inventory.destination(label, nodes)
        };
        edges.push(FlowEdge {
            id: if option.is_none() {
                mapped
                    .map(|beat| format!("{}:{}", scene.id, beat.id))
                    .unwrap_or_else(|| format!("{}:{revision}:{start}", scene.id))
            } else {
                format!("{}:{revision}:{start}:{}", scene.id, option.unwrap())
            },
            scene_id: scene.id.clone(),
            beat_id: mapped.map(|beat| beat.id.clone()),
            option_ordinal: option,
            text: title,
            kind: kind.into(),
            location: FlowLocation {
                path: scene.source_path.clone(),
                revision: revision.into(),
                byte_start: start as u64,
                byte_end: range_end as u64,
            },
            editable: mapped.is_some()
                && matches!(destination, FlowDestination::Resolved { .. })
                && !beats.iter().any(|beat| beat.protected),
            destination,
        });
    }
    if unknown_block || edges.is_empty() {
        edges.push(FlowEdge {
            id: format!("{}:{revision}:unknown", scene.id),
            scene_id: scene.id.clone(),
            beat_id: None,
            option_ordinal: None,
            text: "Incomplete / unknown flow".into(),
            kind: "unknown".into(),
            location: FlowLocation {
                path: scene.source_path.clone(),
                revision: revision.into(),
                byte_start: 0,
                byte_end: bytes.len() as u64,
            },
            destination: FlowDestination::Unknown {
                label: None,
                location: None,
            },
            editable: false,
        });
    }
    edges
}

// Only the canonical unconditional start trampoline is proven. Python, dialogue,
// conditions, calls, duplicate labels and multiple statements remain unknown.
fn entry_jump(bytes: &[u8], start: &FlowLocation) -> Option<String> {
    let text = std::str::from_utf8(bytes).ok()?;
    let mut statements = Vec::new();
    for (offset, _, line) in physical_lines(text) {
        if offset < start.byte_end as usize
            || line.trim().is_empty()
            || line.trim_start().starts_with('#')
        {
            continue;
        }
        if !line.starts_with(' ') {
            break;
        }
        statements.push(line);
        if statements.len() > 1 {
            return None;
        }
    }
    let [line] = statements.as_slice() else {
        return None;
    };
    let label = line.strip_prefix("    jump ")?;
    identifier(label).then(|| label.to_owned())
}
