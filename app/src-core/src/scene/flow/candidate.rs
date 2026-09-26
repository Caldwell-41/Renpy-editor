//! Test-only G1-O1 candidate experiment. Deliberately absent from production.
//! Projection below mirrors flow_workspace and reuses its parsing/projection helpers.
use super::*;
use crate::transaction::{candidate::Probe, FileIdentity};
use std::{
    sync::{atomic::AtomicUsize, Arc},
    time::Instant,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Boundary {
    Metadata,
    Acquired,
    Projected,
    BeforeVerification,
    Verified,
    Publication,
}
#[derive(Default, Debug)]
pub(crate) struct Counts {
    pub acquired: usize,
    pub verified: usize,
    pub source_bytes: usize,
    pub retained_peak: usize,
}
#[derive(Default)]
pub(crate) struct Index {
    files: BTreeMap<String, (Vec<u8>, Revision)>,
    owner: Option<(ProjectId, u64, FileIdentity)>,
    generation: u64,
    pub last: Counts,
}
impl Index {
    pub fn invalidate(&mut self, paths: Option<&[String]>) {
        self.generation = self
            .generation
            .checked_add(1)
            .expect("test generation exhausted");
        if let Some(paths) = paths.filter(|p| p.len() <= MAX_FILES) {
            for path in paths {
                self.files.remove(path);
            }
        } else {
            self.files.clear();
        }
    }
    pub fn retained(&self) -> usize {
        self.files.values().map(|(b, _)| b.len()).sum()
    }
}
fn metadata(
    service: &AuthoringService,
    project: &ProjectId,
) -> Result<Vec<Option<Revision>>, SceneError> {
    // Empty-authoring harness dependencies, including expected absence. Full source
    // inventory covers characters/variables; media inventories cover legacy absence.
    let mut result = Vec::new();
    for path in [
        PROJECT_PATH,
        SOURCE_MAP_PATH,
        ".renpy-editor/authoring.json",
        "game/definitions/assets.rpy",
    ] {
        let value = service
            .transactions
            .snapshot_optional(project, RelativePath::new(path).unwrap())
            .map_err(diagnostic_error)?;
        if path.ends_with("authoring.json")
            && value.as_ref().is_some_and(|(b, _)| b.len() > 1024 * 1024)
        {
            return Err(SceneError::InvalidMetadata);
        }
        result.push(value.map(|(_, r)| r));
    }
    for directory in ["game/images", "game/audio"] {
        if !service
            .transactions
            .inventory_files_bounded(project, directory, 8192)
            .map_err(diagnostic_error)?
            .is_empty()
        {
            return Err(SceneError::InvalidMetadata);
        }
    }
    Ok(result)
}
pub(crate) fn observe(
    service: &AuthoringService,
    project: &ProjectId,
    project_id: &str,
    session: u64,
    index: &mut Index,
    probe: Arc<Probe>,
    mut hook: impl FnMut(&mut Index, Boundary),
) -> Result<FlowWorkspace, SceneError> {
    let result = crate::runtime_work::proof_scoped(
        crate::runtime_work::current().unwrap_or_default(),
        Instant::now() + std::time::Duration::from_secs(2),
        || {
            observe_inner(
                service, project, project_id, session, index, probe, &mut hook,
            )
        },
    );
    if result.is_err() {
        index.invalidate(None);
    }
    result
}
fn observe_inner(
    service: &AuthoringService,
    project: &ProjectId,
    project_id: &str,
    session: u64,
    index: &mut Index,
    probe: Arc<Probe>,
    hook: &mut impl FnMut(&mut Index, Boundary),
) -> Result<FlowWorkspace, SceneError> {
    let started = Instant::now();
    crate::runtime_work::check().map_err(|_| SceneError::SourceConflict)?;
    let root = service
        .transactions
        .candidate_session(project)
        .map_err(diagnostic_error)?;
    let owner = (project.clone(), session, root.clone());
    if index.owner.as_ref() != Some(&owner) {
        index.invalidate(None);
        index.owner = Some(owner);
    }
    let generation = index.generation;
    let mut stages = Vec::new();
    let mut last = started;
    let mut profile_mark = |name| {
        let now = Instant::now();
        stages.push((name, now.duration_since(last).as_secs_f64() * 1000.0));
        last = now;
    };
    service
        .source_refresh_project(project, project_id)
        .map_err(|_| SceneError::SourceConflict)?;
    profile_mark("source_refresh");
    let metadata_before = metadata(service, project)?;
    let loaded = service.load(project, project_id)?;
    // O1 only supports the empty-authoring fixture. Nonempty loader dependencies
    // require O2's complete dependency vector; never silently claim freshness.
    if !loaded.authoring.characters.is_empty()
        || !loaded.authoring.assets.is_empty()
        || !loaded.authoring.variables.is_empty()
    {
        return Err(SceneError::InvalidMetadata);
    }
    hook(index, Boundary::Metadata);

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
    let paths = match service
        .transactions
        .inventory_files_bounded(project, "game", 8192)
    {
        Ok(paths) => paths
            .into_iter()
            .filter(|path| path.ends_with(".rpy"))
            .collect::<Vec<_>>(),
        Err(error) if error.code == ErrorCode::InvalidProposal => return Ok(over_limit(result)),
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
    let mut files = std::mem::take(&mut index.files);
    files.retain(|path, _| paths.contains(path));
    let retained = files.values().map(|(bytes, _)| bytes.len()).sum::<usize>();
    if retained > MAX_BYTES {
        return Err(SceneError::InvalidMetadata);
    }
    let missing = paths
        .iter()
        .filter(|path| !files.contains_key(*path))
        .cloned()
        .collect::<Vec<_>>();
    let remaining = AtomicUsize::new(MAX_BYTES - retained);
    let snapshots = service
        .transactions
        .candidate_batch(
            project,
            &missing,
            MAX_FILE_BYTES as usize,
            &remaining,
            true,
            probe.clone(),
        )
        .map_err(diagnostic_error)?;
    let acquired = snapshots.len();
    for (path, snapshot) in missing.into_iter().zip(snapshots) {
        files.insert(path, snapshot);
    }
    profile_mark("snapshot_read_hash");
    hook(index, Boundary::Acquired);
    let total = files.values().map(|(bytes, _)| bytes.len()).sum::<usize>();
    for (path, (bytes, revision)) in &files {
        collect_labels(path, bytes, &revision.sha256, &mut inventory);
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
    hook(index, Boundary::Projected);
    hook(index, Boundary::BeforeVerification);
    // At the byte ceiling, release candidate blobs after projection before
    // allocating verifier scratch. Revisions survive; the next request is cold.
    let keep = total <= MAX_BYTES - 4 * 1024 * 1024;
    if !keep {
        for (bytes, _) in files.values_mut() {
            *bytes = Vec::new();
        }
    }
    let verification = service.transactions.candidate_batch(
        project,
        &paths,
        MAX_FILE_BYTES as usize,
        &AtomicUsize::new(0),
        false,
        probe.clone(),
    );
    let verified = match verification {
        Ok(revisions) => {
            for (path, (_, revision)) in paths.iter().zip(&revisions) {
                if files
                    .get(path)
                    .is_none_or(|(_, expected)| expected != revision)
                {
                    result.stale = true;
                }
            }
            revisions.len()
        }
        Err(_) => {
            result.stale = true;
            0
        }
    };
    hook(index, Boundary::Verified);
    profile_mark("freshness_read_hash");
    if service
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
    if metadata(service, project).ok() != Some(metadata_before) {
        result.stale = true;
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
        result.notice = "Partial flow: custom, dynamic or unmapped source remains unknown.".into();
    }
    hook(index, Boundary::Publication);
    crate::runtime_work::check().map_err(|_| SceneError::SourceConflict)?;
    if index.generation != generation
        || service.transactions.candidate_session(project).ok() != Some(root)
    {
        result.stale = true;
    }
    if result.stale {
        result.partial = true;
        for edge in &mut result.edges {
            edge.editable = false;
        }
    } else {
        if keep {
            index.files = files;
        }
    }
    profile_mark("finalize");
    let scratch_peak = probe
        .scratch_peak
        .load(std::sync::atomic::Ordering::Relaxed);
    let source_peak = total.max(if keep {
        total + scratch_peak
    } else {
        scratch_peak
    });
    assert!(source_peak <= MAX_BYTES);
    assert_eq!(
        probe
            .live_readers
            .load(std::sync::atomic::Ordering::Relaxed),
        0
    );
    assert_eq!(
        probe
            .scratch_live
            .load(std::sync::atomic::Ordering::Relaxed),
        0
    );
    println!("g1-o1-resources: source_peak={source_peak};scratch_peak={scratch_peak};reader_peak={};live_readers=0", probe.peak_readers.load(std::sync::atomic::Ordering::Relaxed));
    index.last = Counts {
        acquired,
        verified,
        source_bytes: total,
        retained_peak: total,
    };
    println!("g1-o1-observation: acquired={acquired};verified={verified};source_bytes={total};retained_peak={total};stale={};whole_ms={:.3};stages={:?}", result.stale, started.elapsed().as_secs_f64()*1000.0, stages);
    Ok(result)
}
