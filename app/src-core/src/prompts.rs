//! Project-local prose and read-only, deterministic one-Beat preparation. No transport.
use crate::{
    authoring::AuthoringService,
    references,
    scene::{BeatPayload, SceneError},
    transaction::{
        FileMutation, MutationKind, ProjectId, RelativePath, Revision, TransactionIntent,
        TransactionProposal,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
pub const PATH: &str = ".renpy-editor/ai.json";
pub const ACTION: &str = "rewriteDialogue";
pub const BASELINE_VERSION: &str = "1";
pub const BASELINE: &str = include_str!("../prompts/v1/rewrite-dialogue.txt");
const MAX_DOCUMENT: usize = 256 * 1024;
const MAX_PROMPT: usize = 32 * 1024;
const MAX_BODY: usize = 2 * 1024 * 1024;
#[derive(Debug)]
pub enum PromptError {
    Invalid,
    Unavailable,
    Stale,
    StaleReference {
        record: String,
        revision: String,
    },
    Budget {
        total: usize,
        budget: usize,
        capacity: usize,
    },
    Draft,
    History(SceneError),
}
fn digest(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}
fn token(r: &Revision) -> String {
    digest(&serde_json::to_vec(r).unwrap_or_default())
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PromptRequest {
    pub expected_revision: String,
    pub command: PromptCommand,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum PromptCommand {
    Save { text: String },
    Restore,
    Undo,
    Redo,
}
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReferenceSelection {
    pub kind: String,
    pub record_id: String,
    pub revision_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PreviewRequest {
    pub expected_prompt_revision: String,
    pub scene_id: String,
    pub beat_id: String,
    pub expected_source_revision: String,
    pub expected_structure_revision: String,
    pub references: Vec<ReferenceSelection>,
    pub task: String,
    pub context_budget: usize,
    pub maximum_response: usize,
    pub context_ceiling: usize,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptWorkspace {
    pub revision: String,
    pub effective_text: String,
    pub baseline_text: &'static str,
    pub baseline_version: &'static str,
    pub baseline_digest: String,
    pub saved_baseline_version: Option<String>,
    pub saved_baseline_digest: Option<String>,
    pub customized: bool,
    pub style_notes: String,
    pub can_undo: bool,
    pub can_redo: bool,
}
fn empty(project: &str) -> Value {
    json!({"schemaVersion":1,"projectId":project,"prompts":{},"styleNotes":""})
}
fn validate(doc: &Value, project: &str) -> Result<(), PromptError> {
    if doc["schemaVersion"] != 1 || doc["projectId"] != project || !doc["prompts"].is_object() {
        return Err(PromptError::Unavailable);
    }
    if doc
        .get("styleNotes")
        .is_some_and(|v| v.as_str().is_none_or(|s| s.len() > MAX_PROMPT))
    {
        return Err(PromptError::Unavailable);
    }
    if let Some(p) = doc["prompts"].get(ACTION) {
        if !p.is_object()
            || p["text"]
                .as_str()
                .is_none_or(|s| s.trim().is_empty() || s.len() > MAX_PROMPT)
            || p["baselineVersion"]
                .as_str()
                .is_none_or(|s| s.is_empty() || s.len() > 128)
            || p["baselineDigest"]
                .as_str()
                .is_none_or(|s| s.len() != 64 || !s.bytes().all(|b| b.is_ascii_hexdigit()))
        {
            return Err(PromptError::Unavailable);
        }
    }
    Ok(())
}
fn fields(value: &Value, keys: &[&str]) -> Value {
    Value::Object(
        value
            .as_object()
            .into_iter()
            .flatten()
            .filter(|(k, _)| keys.contains(&k.as_str()))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
    )
}
fn known_content(value: &Value, kind: &str) -> Value {
    let mut out = fields(value, &references::content_keys(kind));
    out["scope"] = fields(&out["scope"], &["type", "sceneIds"]);
    out["provenance"] = fields(&out["provenance"], &["kind", "notes"]);
    for (key, keys) in [
        ("links", vec!["type", "id"]),
        ("knowledge", vec!["characterId", "notes"]),
        ("relationships", vec!["target", "text"]),
        ("citations", vec!["target", "revision", "notes"]),
    ] {
        if let Some(a) = out[key].as_array_mut() {
            for item in a {
                let mut next = fields(item, &keys);
                if !next["target"].is_null() {
                    next["target"] = fields(&next["target"], &["type", "id"]);
                }
                *item = next;
            }
        }
    }
    out
}
impl AuthoringService {
    fn prompt_snapshot(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<(Value, Vec<u8>, Revision), PromptError> {
        let (bytes, revision) = self
            .transactions
            .snapshot_optional_bounded(
                project,
                RelativePath::new(PATH).map_err(|_| PromptError::Unavailable)?,
                MAX_DOCUMENT,
            )
            .map_err(|_| PromptError::Unavailable)?
            .unwrap_or_else(|| (vec![], Revision::expected_absence()));
        let doc = if revision == Revision::expected_absence() {
            empty(project_id)
        } else {
            crate::ai_discovery::strict_json(&bytes).map_err(|_| PromptError::Unavailable)?
        };
        validate(&doc, project_id)?;
        Ok((doc, bytes, revision))
    }
    pub fn prompts(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<PromptWorkspace, PromptError> {
        let (doc, _, revision) = self.prompt_snapshot(project, project_id)?;
        let override_text = doc["prompts"][ACTION]["text"].as_str();
        let histories = self
            .scene_history
            .lock()
            .map_err(|_| PromptError::Unavailable)?;
        let h = histories.get(project);
        Ok(PromptWorkspace {
            revision: token(&revision),
            effective_text: override_text.unwrap_or(BASELINE).into(),
            baseline_text: BASELINE,
            baseline_version: BASELINE_VERSION,
            baseline_digest: digest(BASELINE.as_bytes()),
            saved_baseline_version: doc["prompts"][ACTION]["baselineVersion"]
                .as_str()
                .map(String::from),
            saved_baseline_digest: doc["prompts"][ACTION]["baselineDigest"]
                .as_str()
                .map(String::from),
            customized: override_text.is_some(),
            style_notes: doc["styleNotes"].as_str().unwrap_or_default().into(),
            can_undo: h.is_some_and(|h| h.can_undo()),
            can_redo: h.is_some_and(|h| h.can_redo()),
        })
    }
    pub fn prompts_apply(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: PromptRequest,
    ) -> Result<PromptWorkspace, PromptError> {
        let (mut doc, bytes, revision) = self.prompt_snapshot(project, project_id)?;
        if request.expected_revision != token(&revision) {
            return Err(PromptError::Stale);
        }
        match request.command {
            PromptCommand::Undo => {
                self.undo_scene(project).map_err(PromptError::History)?;
                return self.prompts(project, project_id);
            }
            PromptCommand::Redo => {
                self.redo_scene(project).map_err(PromptError::History)?;
                return self.prompts(project, project_id);
            }
            PromptCommand::Restore => {
                if doc["prompts"]
                    .as_object_mut()
                    .unwrap()
                    .remove(ACTION)
                    .is_none()
                {
                    return Err(PromptError::Invalid);
                }
            }
            PromptCommand::Save { text } => {
                if text.trim().is_empty() || text.len() > MAX_PROMPT {
                    return Err(PromptError::Invalid);
                }
                // Keep future override extensions and all unrelated settings verbatim as values.
                let prompts = doc["prompts"].as_object_mut().unwrap();
                let mut p = prompts.get(ACTION).cloned().unwrap_or_else(|| json!({}));
                p["text"] = json!(text);
                p["baselineVersion"] = json!(BASELINE_VERSION);
                p["baselineDigest"] = json!(digest(BASELINE.as_bytes()));
                prompts.insert(ACTION.into(), p);
            }
        }
        let mut proposed = serde_json::to_vec_pretty(&doc).map_err(|_| PromptError::Invalid)?;
        proposed.push(b'\n');
        if proposed.len() > MAX_DOCUMENT {
            return Err(PromptError::Invalid);
        }
        self.commit_history(
            project,
            TransactionProposal {
                mutations: vec![FileMutation {
                    path: RelativePath::new(PATH).map_err(|_| PromptError::Unavailable)?,
                    kind: if revision == Revision::expected_absence() {
                        MutationKind::CreateNew
                    } else {
                        MutationKind::ReplaceExisting
                    },
                    base: revision,
                    expected_bytes: bytes,
                    proposed,
                }],
                intent: TransactionIntent::Edit,
            },
        )
        .map_err(PromptError::History)?;
        self.prompts(project, project_id)
    }
    pub fn context_options(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<Value, PromptError> {
        let ws = self
            .scene_workspace(project, project_id)
            .map_err(PromptError::History)?;
        let references = self
            .references(project, project_id)
            .map_err(|_| PromptError::Unavailable)?;
        let mut targets = vec![];
        for scene in &ws.scenes {
            for (i, beat) in scene.beats.iter().enumerate() {
                if !scene.source_conflict
                    && !beat.protected
                    && matches!(
                        beat.payload,
                        BeatPayload::Dialogue { .. } | BeatPayload::Narration { .. }
                    )
                {
                    targets.push(json!({"sceneId":scene.id,"beatId":beat.id,"sourceRevision":scene.source_revision,"label":format!("{} · Beat {}",scene.display_name,i+1)}));
                }
            }
        }
        let mut choices = vec![];
        if let Some(doc) = references.document {
            for (kind, key) in [("card", "cards"), ("lore", "loreEntries")] {
                for r in doc[key].as_array().unwrap() {
                    for rev in r["revisions"].as_array().unwrap() {
                        if rev["status"] == "approved" && rev["id"] == r["approvedRevisionId"] {
                            let issues: Vec<_> = references
                                .issues
                                .iter()
                                .filter(|i| {
                                    i.record_id == r["id"].as_str().unwrap()
                                        && i.revision_id == rev["id"].as_str().unwrap()
                                        && i.field == "citations"
                                })
                                .map(|i| i.state)
                                .collect();
                            choices.push(json!({"kind":kind,"recordId":r["id"],"revisionId":rev["id"],"number":rev["number"],"title":rev["content"]["title"],"linkedCharacterId":rev["content"].get("linkedCharacterId"),"eligible":issues.is_empty(),"issues":issues}));
                        }
                    }
                }
            }
        }
        Ok(
            json!({"prompt":self.prompts(project,project_id)?,"targets":targets,"structureRevision":digest(format!("{}:{}",ws.project_revision,ws.source_map_revision).as_bytes()),"references":choices,"referenceDiagnostic":references.diagnostic}),
        )
    }
    pub fn context_preview(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        r: PreviewRequest,
    ) -> Result<Value, PromptError> {
        if r.task.len() > MAX_PROMPT
            || r.references.len() > 256
            || r.context_budget < 256
            || r.context_budget > 2_000_000
            || r.context_ceiling < 256
            || r.context_ceiling > 2_000_000
            || r.maximum_response == 0
            || r.maximum_response > 2_000_000
        {
            return Err(PromptError::Invalid);
        }
        let prompt = self.prompts(project, project_id)?;
        if r.expected_prompt_revision != prompt.revision {
            return Err(PromptError::Stale);
        }
        let mut source_revision_set = BTreeMap::new();
        for path in [
            ".renpy-editor/project.json",
            ".renpy-editor/source-map.json",
            ".renpy-editor/authoring.json",
        ] {
            let (_, rev) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(path).map_err(|_| PromptError::Unavailable)?,
                )
                .map_err(|_| PromptError::Unavailable)?;
            source_revision_set.insert(path.to_owned(), rev);
        }
        let ws = self
            .scene_workspace(project, project_id)
            .map_err(PromptError::History)?;
        let structure =
            digest(format!("{}:{}", ws.project_revision, ws.source_map_revision).as_bytes());
        if structure != r.expected_structure_revision {
            return Err(PromptError::Stale);
        }
        let scene = ws
            .scenes
            .iter()
            .find(|s| s.id == r.scene_id)
            .ok_or(PromptError::Stale)?;
        if scene.source_conflict || scene.source_revision != r.expected_source_revision {
            return Err(PromptError::Stale);
        }
        let beat = scene
            .beats
            .iter()
            .find(|b| b.id == r.beat_id && !b.protected)
            .ok_or(PromptError::Stale)?;
        let (character, text) = match &beat.payload {
            BeatPayload::Dialogue { character_id, text } => {
                (Some(character_id.as_str()), text.as_str())
            }
            BeatPayload::Narration { text } => (None, text.as_str()),
            _ => return Err(PromptError::Invalid),
        };
        let refs = self
            .references(project, project_id)
            .map_err(|_| PromptError::Unavailable)?;
        let doc = refs.document.as_ref().ok_or(PromptError::Unavailable)?;
        let mut seen = BTreeSet::new();
        let mut selected = r.references;
        selected.sort_by(|a, b| {
            (&a.kind, &a.record_id, &a.revision_id).cmp(&(&b.kind, &b.record_id, &b.revision_id))
        });
        let mut included = vec![];
        let mut dependencies = vec![];
        let mut read_set = BTreeMap::new();
        read_set.insert(PATH.to_owned(), prompt.revision.clone());
        read_set.insert(references::PATH.to_owned(), refs.revision.clone());
        let mut paths = BTreeSet::new();
        paths.insert(scene.source_path.clone());
        if source_revision_set[".renpy-editor/project.json"].sha256 != ws.project_revision
            || source_revision_set[".renpy-editor/source-map.json"].sha256 != ws.source_map_revision
        {
            return Err(PromptError::Stale);
        }
        let (bytes, rev) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(&scene.source_path).map_err(|_| PromptError::Unavailable)?,
            )
            .map_err(|_| PromptError::Unavailable)?;
        if rev.sha256 != scene.source_revision {
            return Err(PromptError::Stale);
        }
        source_revision_set.insert(scene.source_path.clone(), rev);
        let exact = std::str::from_utf8(
            bytes
                .get(beat.byte_start as usize..beat.byte_end as usize)
                .ok_or(PromptError::Stale)?,
        )
        .map_err(|_| PromptError::Unavailable)?;
        for s in &selected {
            if !seen.insert((&s.kind, &s.record_id)) {
                return Err(PromptError::Invalid);
            }
            let key = match s.kind.as_str() {
                "card" => "cards",
                "lore" => "loreEntries",
                _ => return Err(PromptError::Invalid),
            };
            let record = doc[key]
                .as_array()
                .unwrap()
                .iter()
                .find(|v| v["id"] == s.record_id)
                .ok_or_else(|| PromptError::StaleReference {
                    record: s.record_id.clone(),
                    revision: s.revision_id.clone(),
                })?;
            let revision = record["revisions"]
                .as_array()
                .unwrap()
                .iter()
                .find(|v| {
                    v["id"] == s.revision_id
                        && v["status"] == "approved"
                        && record["approvedRevisionId"] == s.revision_id
                })
                .ok_or_else(|| PromptError::StaleReference {
                    record: s.record_id.clone(),
                    revision: s.revision_id.clone(),
                })?;
            if refs.issues.iter().any(|i| {
                i.record_id == s.record_id
                    && i.revision_id == s.revision_id
                    && i.field == "citations"
            }) {
                return Err(PromptError::StaleReference {
                    record: s.record_id.clone(),
                    revision: s.revision_id.clone(),
                });
            }
            // Project references remain data. Unknown extensions are preserved on disk but
            // deliberately excluded from the outbound known-field content.
            let content = known_content(&revision["content"], s.kind.as_str());
            let mut edges: Vec<(&str, Value)> = Vec::new();
            for id in content["linkedLoreIds"].as_array().into_iter().flatten() {
                edges.push(("linkedLoreIds", json!({"type":"lore","id":id})));
            }
            if let Some(id) = content["linkedCharacterId"].as_str() {
                edges.push(("linkedCharacterId", json!({"type":"character","id":id})));
            }
            for key in ["links", "citations", "relationships", "knowledge"] {
                for value in content[key].as_array().into_iter().flatten() {
                    let target = match key {
                        "links" => value.clone(),
                        "knowledge" => json!({"type":"character","id":value["characterId"]}),
                        _ => value["target"].clone(),
                    };
                    if !target.is_null() {
                        edges.push((key, target));
                    }
                }
            }
            for (field, target) in edges {
                let kind = target["type"].as_str().unwrap_or_default();
                let id = target["id"].as_str().unwrap_or_default();
                let entity = refs.entities.iter().find(|e| e.kind == kind && e.id == id);
                let is_included = selected.iter().any(|s| s.kind == kind && s.record_id == id)
                    || (kind == "character" && Some(id) == character);
                dependencies.push(json!({"from":s.record_id,"field":field,"kind":kind,"id":id,"resolved":entity.is_some(),"revision":entity.and_then(|e|e.revision.as_deref()),"included":is_included,"reason":if is_included{"Explicit reference selection or required speaking Character"}else{"Link disclosed; linked content excluded; no automatic expansion"}}));
            }
            included.push(json!({"kind":s.kind,"recordId":s.record_id,"revisionId":s.revision_id,"content":content}));
        }
        let mut definitions = vec![];
        for c in &ws.authoring.characters {
            if Some(c.id.as_str()) == character {
                paths.insert(c.source.path.clone());
                definitions
                    .push(json!({"kind":"character","id":c.id,"statement":c.source.statement}));
            }
        }
        for v in &ws.authoring.variables {
            if text.contains(&format!("[{}]", v.technical_name)) {
                paths.insert(v.source.path.clone());
                definitions.push(json!({"kind":"variableDefault","id":v.id,"statement":v.source.statement,"runtimeValue":"unknown"}));
            }
        }
        for definition in &definitions {
            dependencies.push(json!({"from":beat.id,"kind":definition["kind"],"id":definition["id"],"included":true,"reason":"Required selected dialogue definition; variable values are defaults, runtime unknown"}));
        }
        for path in &paths {
            let (_, rev) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(path).map_err(|_| PromptError::Unavailable)?,
                )
                .map_err(|_| PromptError::Unavailable)?;
            if let Some(c) = ws
                .authoring
                .characters
                .iter()
                .find(|c| &c.source.path == path && Some(c.id.as_str()) == character)
            {
                if c.source.source_revision != rev.sha256 {
                    return Err(PromptError::Stale);
                }
            }
            for v in &ws.authoring.variables {
                if &v.source.path == path
                    && text.contains(&format!("[{}]", v.technical_name))
                    && v.source.source_revision != rev.sha256
                {
                    return Err(PromptError::Stale);
                }
            }
            source_revision_set.insert(path.clone(), rev);
        }
        self.ensure_source_paths_clean(project, paths.iter().map(String::as_str))
            .map_err(|_| PromptError::Draft)?;
        let mut exclusions = vec![];
        for (kind, key) in [("card", "cards"), ("lore", "loreEntries")] {
            for record in doc[key].as_array().unwrap() {
                if !selected
                    .iter()
                    .any(|s| s.kind == kind && record["id"] == s.record_id)
                {
                    exclusions.push(json!({"kind":kind,"recordId":record["id"],"revisionId":record["approvedRevisionId"],"reason":"Not selected"}));
                }
            }
        }
        let inventory = self
            .source_inventory(project, project_id)
            .map_err(|_| PromptError::Unavailable)?;
        let unrelated_drafts: Vec<_> = inventory
            .files
            .iter()
            .filter(|f| f.dirty && !paths.contains(&f.path))
            .map(|f| f.path.clone())
            .collect();
        let story = json!({"sceneId":scene.id,"beatId":beat.id,"source":exact,"payload":beat.payload,"owner":beat.owner,"conditionalBranch":beat.conditional_branch});
        let contract = json!({"version":1,"action":ACTION,"target":{"sceneId":scene.id,"beatId":beat.id},"authority":"Preview only; no operation may be executed or applied","runtimeState":"Unknown; defaults and conditional ownership are not observed runtime facts"});
        let user = json!({"task":r.task,"styleNotes":prompt.style_notes,"story":story,"definitions":definitions,"references":included,"responseContract":contract});
        let body = json!({"messages":[{"role":"system","content":prompt.effective_text},{"role":"user","content":serde_json::to_string(&user).map_err(|_|PromptError::Invalid)?}],"maximumResponse":r.maximum_response});
        let serialized = serde_json::to_string(&body).map_err(|_| PromptError::Invalid)?;
        let component_bytes: BTreeMap<&str, usize> = [
            ("instructions", prompt.effective_text.len()),
            ("task", r.task.len()),
            ("styleNotes", prompt.style_notes.len()),
            ("story", serde_json::to_vec(&story).unwrap().len()),
            (
                "definitions",
                serde_json::to_vec(&definitions).unwrap().len(),
            ),
            (
                "cards",
                serde_json::to_vec(
                    &included
                        .iter()
                        .filter(|x| x["kind"] == "card")
                        .collect::<Vec<_>>(),
                )
                .unwrap()
                .len(),
            ),
            (
                "lore",
                serde_json::to_vec(
                    &included
                        .iter()
                        .filter(|x| x["kind"] == "lore")
                        .collect::<Vec<_>>(),
                )
                .unwrap()
                .len(),
            ),
            (
                "responseContract",
                serde_json::to_vec(&contract).unwrap().len(),
            ),
        ]
        .into_iter()
        .collect();
        // Deliberately conservative byte-as-token estimate. Not a model tokenizer.
        // Count JSON escaping/framing exactly once, with separately labelled reserve/margin.
        let input = serialized.len();
        let margin = 256.max(input.div_ceil(10));
        let total = input + r.maximum_response + margin;
        if serialized.len() > MAX_BODY || total > r.context_budget || total > r.context_ceiling {
            return Err(PromptError::Budget {
                total,
                budget: r.context_budget,
                capacity: r.context_ceiling,
            });
        }
        // Recheck snapshots after assembly. Never silently rebuild a stale selection.
        if self.prompts(project, project_id)?.revision != prompt.revision
            || self
                .references(project, project_id)
                .map_err(|_| PromptError::Unavailable)?
                .revision
                != refs.revision
        {
            return Err(PromptError::Stale);
        }
        for (path, revision) in &source_revision_set {
            let (_, current) = self
                .transactions
                .snapshot(
                    project,
                    RelativePath::new(path).map_err(|_| PromptError::Unavailable)?,
                )
                .map_err(|_| PromptError::Unavailable)?;
            if &current != revision {
                return Err(PromptError::Stale);
            }
            read_set.insert(path.clone(), token(revision));
        }
        Ok(
            json!({"action":ACTION,"projectId":project_id,"sessionId":session,"payload":body,"serializedPayload":serialized,"payloadDigest":digest(serialized.as_bytes()),"promptDigest":digest(prompt.effective_text.as_bytes()),"baselineVersion":prompt.baseline_version,"baselineDigest":prompt.baseline_digest,"savedBaselineVersion":prompt.saved_baseline_version,"savedBaselineDigest":prompt.saved_baseline_digest,"readSet":read_set,"included":selected,"excluded":exclusions,"dependencies":dependencies,"unrelatedDraftsExcluded":unrelated_drafts,"exclusionPolicy":["Other Beats and Scenes","Custom code (marker only; never executed)","Asset binaries","Unknown metadata extensions","Hidden/unapproved files, credentials, Git history, external files"],"customCodeMarker":if scene.partial{"Custom/unsupported source excluded"}else{"No custom text selected"},"uncertainty":"Runtime state, conditions and non-simple interpolation dependencies are unknown; no evaluation or automatic retrieval","size":{"estimator":"UTF-8 byte upper estimate; not measured model tokens","componentBytes":component_bytes,"serializedBytes":input,"estimatedInputTokens":input,"maximumResponse":r.maximum_response,"margin":margin,"total":total,"contextBudget":r.context_budget,"contextCeiling":r.context_ceiling},"sendAvailable":false}),
        )
    }
}
#[cfg(test)]
mod tests;
