//! Editor-only manual references, sharing the existing project transaction/history owner.
//! Values retain extensions; renderer commands edit known content fields only.
use crate::{
    authoring::AuthoringService,
    metadata::ProjectMetadata,
    scene::SceneError,
    transaction::{
        FileMutation, MutationKind, ProjectId, RelativePath, Revision, TransactionIntent,
        TransactionProposal,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub const PATH: &str = ".renpy-editor/references.json";
pub const MAX_BYTES: usize = 1024 * 1024;
const MAX_COUNTER: u64 = 9_007_199_254_740_991;
const COMMON: &[&str] = &[
    "title",
    "tags",
    "scope",
    "knowledgeNotes",
    "provenance",
    "citations",
    "links",
];
const CARD: &[&str] = &[
    "linkedCharacterId",
    "aliases",
    "description",
    "appearanceNotes",
    "personality",
    "motivations",
    "background",
    "relationships",
    "speakingStyle",
    "exampleDialogue",
    "linkedLoreIds",
];
const LORE: &[&str] = &["text", "category", "subject", "knowledge"];

#[derive(Debug)]
pub enum ReferenceError {
    Invalid,
    Unsupported,
    Conflict,
    Io,
    History(SceneError),
}
#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Kind {
    Card,
    Lore,
}
impl Kind {
    fn collection(self) -> &'static str {
        if self == Self::Card {
            "cards"
        } else {
            "loreEntries"
        }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReferenceRequest {
    pub expected_revision: String,
    pub command: Command,
}
#[derive(Deserialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Command {
    Save {
        kind: Kind,
        record_id: Option<String>,
        fields: Map<String, Value>,
    },
    Move {
        kind: Kind,
        record_id: String,
        direction: Direction,
    },
    Undo,
    Redo,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Direction {
    Up,
    Down,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub document: Option<Value>,
    pub revision: String,
    pub diagnostic: Option<&'static str>,
    pub entities: Vec<Entity>,
    pub issues: Vec<Issue>,
    pub can_undo: bool,
    pub can_redo: bool,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entity {
    pub kind: &'static str,
    pub id: String,
    pub title: String,
    pub revision: Option<String>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Issue {
    pub record_id: String,
    pub revision_id: String,
    pub field: &'static str,
    pub index: usize,
    pub state: &'static str,
}

fn invalid<T>() -> Result<T, ReferenceError> {
    Err(ReferenceError::Invalid)
}
fn string(v: &Value) -> Result<&str, ReferenceError> {
    v.as_str().ok_or(ReferenceError::Invalid)
}
fn array(v: &Value) -> Result<&Vec<Value>, ReferenceError> {
    v.as_array().ok_or(ReferenceError::Invalid)
}
fn object(v: &Value) -> Result<&Map<String, Value>, ReferenceError> {
    v.as_object().ok_or(ReferenceError::Invalid)
}
fn id(v: &Value) -> Result<&str, ReferenceError> {
    let s = string(v)?;
    if uuid::Uuid::parse_str(s).is_ok_and(|u| u.to_string() == s) {
        Ok(s)
    } else {
        invalid()
    }
}
fn text(v: &Value, maximum: usize, required: bool) -> Result<(), ReferenceError> {
    let s = string(v)?;
    if s.len() > maximum || (required && s.trim().is_empty()) {
        invalid()
    } else {
        Ok(())
    }
}
fn strings(v: &Value, count: usize, ids: bool, unique: bool) -> Result<(), ReferenceError> {
    let a = array(v)?;
    if a.len() > count {
        return invalid();
    }
    let mut seen = HashSet::new();
    for x in a {
        if ids {
            id(x)?;
        } else {
            text(x, 160, true)?;
        }
        if unique && !seen.insert(string(x)?) {
            return invalid();
        }
    }
    Ok(())
}
fn link(v: &Value) -> Result<(), ReferenceError> {
    object(v)?;
    if !matches!(string(&v["type"])?, "scene" | "character" | "card" | "lore") {
        return invalid();
    }
    id(&v["id"])?;
    Ok(())
}
fn revision_link(v: &Value) -> Result<(), ReferenceError> {
    if !v.is_null() {
        object(v)?;
        id(&v["recordId"])?;
        id(&v["revisionId"])?;
    }
    Ok(())
}
fn depth(v: &Value, level: usize) -> bool {
    match v {
        Value::Object(o) => level < 32 && o.values().all(|x| depth(x, level + 1)),
        Value::Array(a) => level < 32 && a.iter().all(|x| depth(x, level + 1)),
        _ => true,
    }
}
fn timestamp(v: &Value, optional: bool) -> Result<(), ReferenceError> {
    if optional && v.is_null() {
        return Ok(());
    }
    let s = string(v)?;
    let b = s.as_bytes();
    if b.len() != 20
        || b[4] != b'-'
        || b[7] != b'-'
        || b[10] != b'T'
        || b[13] != b':'
        || b[16] != b':'
        || b[19] != b'Z'
        || b.iter()
            .enumerate()
            .any(|(i, c)| ![4, 7, 10, 13, 16, 19].contains(&i) && !c.is_ascii_digit())
    {
        return invalid();
    }
    let number = |a: usize, z: usize| s[a..z].parse::<u32>().unwrap_or(0);
    let y = number(0, 4);
    let m = number(5, 7);
    let d = number(8, 10);
    let max = match m {
        2 => {
            if y % 4 == 0 && (y % 100 != 0 || y % 400 == 0) {
                29
            } else {
                28
            }
        }
        4 | 6 | 9 | 11 => 30,
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        _ => 0,
    };
    if y == 0
        || d == 0
        || d > max
        || number(11, 13) > 23
        || number(14, 16) > 59
        || number(17, 19) > 59
    {
        invalid()
    } else {
        Ok(())
    }
}
fn validate_content(v: &Value, kind: Kind) -> Result<(), ReferenceError> {
    let o = object(v)?;
    if COMMON
        .iter()
        .chain(if kind == Kind::Card { CARD } else { LORE })
        .any(|k| !o.contains_key(*k))
    {
        return invalid();
    }
    text(&v["title"], 160, true)?;
    strings(&v["tags"], 32, false, true)?;
    text(&v["knowledgeNotes"], 10_000, false)?;
    let scope = &v["scope"];
    object(scope)?;
    match string(&scope["type"])? {
        "project" => {}
        "scenes" | "route" => {
            strings(&scope["sceneIds"], 256, true, scope["type"] == "scenes")?;
            if array(&scope["sceneIds"])?.is_empty() {
                return invalid();
            }
        }
        _ => return invalid(),
    }
    object(&v["provenance"])?;
    if !matches!(
        string(&v["provenance"]["kind"])?,
        "userAuthored" | "sourceDerived" | "inferred"
    ) {
        return invalid();
    }
    text(&v["provenance"]["notes"], 10_000, false)?;
    for (key, items) in [
        ("links", array(&v["links"])?),
        ("citations", array(&v["citations"])?),
    ] {
        if items.len() > 64 {
            return invalid();
        }
        for x in items {
            if key == "links" {
                link(x)?;
            } else {
                object(x)?;
                link(&x["target"])?;
                text(&x["notes"], 10_000, false)?;
                let r = string(&x["revision"])?;
                if matches!(string(&x["target"]["type"])?, "scene" | "character") {
                    if r.len() != 64
                        || !r
                            .bytes()
                            .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
                    {
                        return invalid();
                    }
                } else {
                    id(&x["revision"])?;
                }
            }
        }
    }
    if kind == Kind::Card {
        if !v["linkedCharacterId"].is_null() {
            id(&v["linkedCharacterId"])?;
        }
        strings(&v["aliases"], 32, false, true)?;
        strings(&v["linkedLoreIds"], 64, true, true)?;
        for key in [
            "description",
            "appearanceNotes",
            "personality",
            "motivations",
            "background",
            "speakingStyle",
            "exampleDialogue",
        ] {
            text(&v[key], 10_000, false)?;
        }
        let a = array(&v["relationships"])?;
        if a.len() > 64 {
            return invalid();
        }
        for x in a {
            object(x)?;
            if !x["target"].is_null() {
                link(&x["target"])?;
            }
            text(&x["text"], 10_000, false)?;
        }
    } else {
        text(&v["text"], 10_000, true)?;
        text(&v["category"], 160, false)?;
        text(&v["subject"], 160, false)?;
        let a = array(&v["knowledge"])?;
        if a.len() > 64 {
            return invalid();
        }
        for x in a {
            object(x)?;
            id(&x["characterId"])?;
            text(&x["notes"], 10_000, false)?;
        }
    }
    if !depth(v, 0) {
        return invalid();
    }
    Ok(())
}
pub fn validate(v: &Value, project_id: &str) -> Result<(), ReferenceError> {
    object(v)?;
    if v["schemaVersion"] != 1 {
        return Err(ReferenceError::Unsupported);
    }
    if string(&v["projectId"])? != project_id {
        return invalid();
    }
    let cards = array(&v["cards"])?;
    let lore = array(&v["loreEntries"])?;
    if cards.len() + lore.len() > 512
        || !depth(v, 0)
        || serde_json::to_vec(v)
            .map_err(|_| ReferenceError::Invalid)?
            .len()
            > MAX_BYTES
    {
        return invalid();
    }
    let mut ids = HashSet::new();
    for (kind, records) in [(Kind::Card, cards), (Kind::Lore, lore)] {
        for r in records {
            if [
                "id",
                "revisionCounter",
                "currentRevisionId",
                "approvedRevisionId",
                "revisions",
            ]
            .iter()
            .any(|k| r.get(k).is_none())
            {
                return invalid();
            }
            object(r)?;
            if !ids.insert(id(&r["id"])?.to_owned()) {
                return invalid();
            }
            let counter = r["revisionCounter"]
                .as_u64()
                .filter(|n| *n > 0 && *n <= MAX_COUNTER)
                .ok_or(ReferenceError::Invalid)?;
            let current = id(&r["currentRevisionId"])?;
            let approved = if r["approvedRevisionId"].is_null() {
                None
            } else {
                Some(id(&r["approvedRevisionId"])?)
            };
            let revisions = array(&r["revisions"])?;
            if revisions.is_empty() || revisions.len() > 3 {
                return invalid();
            }
            let mut numbers = HashSet::new();
            let mut has_current = false;
            let mut has_approved = approved.is_none();
            for revision in revisions {
                if [
                    "id",
                    "number",
                    "status",
                    "createdAt",
                    "reviewedAt",
                    "reviewNote",
                    "supersedes",
                    "supersededBy",
                    "content",
                ]
                .iter()
                .any(|k| revision.get(k).is_none())
                {
                    return invalid();
                }
                object(revision)?;
                let rid = id(&revision["id"])?;
                if !ids.insert(rid.to_owned()) {
                    return invalid();
                }
                has_current |= rid == current;
                let number = revision["number"]
                    .as_u64()
                    .filter(|n| *n > 0 && *n <= counter)
                    .ok_or(ReferenceError::Invalid)?;
                if !numbers.insert(number) {
                    return invalid();
                }
                let status = string(&revision["status"])?;
                if !matches!(status, "proposed" | "approved" | "rejected" | "superseded") {
                    return invalid();
                }
                if status == "approved" {
                    if Some(rid) != approved {
                        return invalid();
                    }
                    has_approved = true;
                } else if Some(rid) == approved {
                    return invalid();
                }
                timestamp(&revision["createdAt"], false)?;
                timestamp(&revision["reviewedAt"], true)?;
                if (status == "proposed") != revision["reviewedAt"].is_null() {
                    return invalid();
                }
                text(&revision["reviewNote"], 10_000, false)?;
                revision_link(&revision["supersedes"])?;
                revision_link(&revision["supersededBy"])?;
                validate_content(&revision["content"], kind)?;
            }
            if !has_current || !has_approved {
                return invalid();
            }
        }
    }
    Ok(())
}
fn empty(project: &str) -> Value {
    json!({"schemaVersion":1,"projectId":project,"cards":[],"loreEntries":[]})
}
fn token(revision: &Revision) -> String {
    hex::encode(Sha256::digest(
        serde_json::to_vec(revision).unwrap_or_default(),
    ))
}
fn merge(before: &Value, patch: &Value) -> Value {
    match (before, patch) {
        (Value::Object(a), Value::Object(b)) => {
            let mut o = a.clone();
            for (k, v) in b {
                o.insert(k.clone(), merge(a.get(k).unwrap_or(&Value::Null), v));
            }
            Value::Object(o)
        }
        // Array edits carry retained objects with their extensions. Positional merging
        // would attach removed entries’ extensions to a different item.
        (Value::Array(_), Value::Array(b)) => Value::Array(b.clone()),
        (_, v) => v.clone(),
    }
}
fn now() -> String {
    // Gregorian civil date from UTC Unix days; no locale, device input or dependency.
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let z = (seconds / 86400) as i64 + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let mut y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    y += i64::from(m <= 2);
    format!(
        "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}Z",
        seconds / 3600 % 24,
        seconds / 60 % 60,
        seconds % 60
    )
}

impl AuthoringService {
    fn reference_snapshot(
        &self,
        project: &ProjectId,
    ) -> Result<(Vec<u8>, Revision), ReferenceError> {
        Ok(self
            .transactions
            .snapshot_optional_bounded(
                project,
                RelativePath::new(PATH).map_err(|_| ReferenceError::Io)?,
                MAX_BYTES,
            )
            .map_err(|_| ReferenceError::Io)?
            .unwrap_or_else(|| (Vec::new(), Revision::expected_absence())))
    }
    pub fn references(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<Workspace, ReferenceError> {
        let(bytes,revision)=match self.reference_snapshot(project){Ok(snapshot)=>snapshot,Err(_)=>return Ok(Workspace{document:None,revision:String::new(),diagnostic:Some("This reference library could not be read within its bounds. Its file has been retained."),entities:vec![],issues:vec![],can_undo:false,can_redo:false})};
        let parsed = if bytes.is_empty() && revision == Revision::expected_absence() {
            Ok(empty(project_id))
        } else {
            crate::ai_discovery::strict_json(&bytes)
                .map_err(|_| ReferenceError::Invalid)
                .and_then(|v| validate(&v, project_id).map(|_| v))
        };
        let (document,diagnostic)=match parsed {Ok(v)=>(Some(v),None),Err(ReferenceError::Unsupported)=>(None,Some("This reference library uses an unsupported version. Its file has been retained.")),Err(_)=>(None,Some("This reference library could not be read safely. Its file has been retained."))};
        let (entities, diagnostic) = match self.reference_entities(
            project,
            project_id,
            document.as_ref(),
        ) {
            Ok(entities) => (entities, diagnostic),
            Err(_) => (
                vec![],
                diagnostic.or(Some(
                    "Supporting story links are unavailable. Saved references have been retained.",
                )),
            ),
        };
        let issues = document
            .as_ref()
            .map(|v| issues(v, &entities))
            .unwrap_or_default();
        let histories = self.scene_history.lock().map_err(|_| ReferenceError::Io)?;
        let history = histories.get(project);
        Ok(Workspace {
            document,
            revision: token(&revision),
            diagnostic,
            entities,
            issues,
            can_undo: history.is_some_and(|h| h.can_undo()),
            can_redo: history.is_some_and(|h| h.can_redo()),
        })
    }
    fn reference_entities(
        &self,
        project: &ProjectId,
        project_id: &str,
        doc: Option<&Value>,
    ) -> Result<Vec<Entity>, ReferenceError> {
        let mut out = Vec::new();
        let (bytes, _) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(".renpy-editor/project.json").map_err(|_| ReferenceError::Io)?,
            )
            .map_err(|_| ReferenceError::Io)?;
        let metadata = ProjectMetadata::read_bytes(&bytes, None).map_err(|_| ReferenceError::Io)?;
        for scene in metadata.scenes {
            let revision = RelativePath::new(&scene.source_path)
                .ok()
                .and_then(|p| self.transactions.snapshot(project, p).ok())
                .map(|(_, r)| r.sha256);
            out.push(Entity {
                kind: "scene",
                id: scene.id,
                title: scene.display_name,
                revision,
            });
        }
        let metadata = self
            .list(project, project_id)
            .map_err(|_| ReferenceError::Io)?;
        for character in metadata.characters {
            let revision = RelativePath::new(&character.source.path)
                .ok()
                .and_then(|p| self.transactions.snapshot(project, p).ok())
                .map(|(_, r)| r.sha256);
            out.push(Entity {
                kind: "character",
                id: character.id,
                title: character.display_name,
                revision,
            });
        }
        if let Some(doc) = doc {
            for (kind, key) in [("card", "cards"), ("lore", "loreEntries")] {
                for r in array(&doc[key])? {
                    let rev = array(&r["revisions"])?
                        .iter()
                        .find(|v| v["id"] == r["currentRevisionId"])
                        .ok_or(ReferenceError::Invalid)?;
                    out.push(Entity {
                        kind,
                        id: string(&r["id"])?.into(),
                        title: string(&rev["content"]["title"])?.into(),
                        revision: r["approvedRevisionId"].as_str().map(String::from),
                    });
                }
            }
        }
        Ok(out)
    }
    pub fn references_apply(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: ReferenceRequest,
    ) -> Result<Workspace, ReferenceError> {
        let (bytes, revision) = self.reference_snapshot(project)?;
        if request.expected_revision != token(&revision) {
            return Err(ReferenceError::Conflict);
        }
        let mut doc = if revision == Revision::expected_absence() {
            empty(project_id)
        } else {
            crate::ai_discovery::strict_json(&bytes).map_err(|_| ReferenceError::Invalid)?
        };
        validate(&doc, project_id)?;
        match request.command {
            Command::Undo => {
                self.undo_scene(project).map_err(ReferenceError::History)?;
                return self.references(project, project_id);
            }
            Command::Redo => {
                self.redo_scene(project).map_err(ReferenceError::History)?;
                return self.references(project, project_id);
            }
            Command::Move {
                kind,
                record_id,
                direction,
            } => {
                let a = doc[kind.collection()]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?;
                let index = a
                    .iter()
                    .position(|r| r["id"] == record_id)
                    .ok_or(ReferenceError::Invalid)?;
                let next = match direction {
                    Direction::Up => index.checked_sub(1),
                    Direction::Down => Some(index + 1).filter(|n| *n < a.len()),
                }
                .ok_or(ReferenceError::Invalid)?;
                a.swap(index, next);
            }
            Command::Save {
                kind,
                record_id,
                fields,
            } => {
                if fields.keys().any(|k| {
                    !COMMON.contains(&k.as_str())
                        && !(if kind == Kind::Card { CARD } else { LORE }).contains(&k.as_str())
                }) {
                    return invalid();
                }
                let a = doc[kind.collection()]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?;
                let index = if let Some(id) = record_id {
                    a.iter()
                        .position(|r| r["id"] == id)
                        .ok_or(ReferenceError::Invalid)?
                } else {
                    a.push(json!({"id":uuid::Uuid::new_v4().to_string(),"revisionCounter":0,"currentRevisionId":null,"approvedRevisionId":null,"revisions":[]}));
                    a.len() - 1
                };
                let record = &mut a[index];
                let old = array(&record["revisions"])?
                    .iter()
                    .find(|r| r["id"] == record["currentRevisionId"]);
                let mut content = merge(
                    old.map(|r| &r["content"]).unwrap_or(&Value::Null),
                    &Value::Object(fields),
                );
                if content["scope"]["type"] == "project" {
                    if let Some(scope) = content["scope"].as_object_mut() {
                        scope.remove("sceneIds");
                    }
                }
                validate_content(&content, kind)?;
                if old.is_some_and(|r| r["content"] == content) {
                    return invalid();
                }
                let number = record["revisionCounter"]
                    .as_u64()
                    .unwrap_or(0)
                    .checked_add(1)
                    .filter(|n| *n <= MAX_COUNTER)
                    .ok_or(ReferenceError::Invalid)?;
                let rid = uuid::Uuid::new_v4().to_string();
                let record_id = record["id"].clone();
                let prior = record["approvedRevisionId"].clone();
                let current = record["currentRevisionId"].clone();
                let mut next = old.cloned().unwrap_or_else(|| json!({}));
                for(k,v)in json!({"id":rid,"number":number,"status":"approved","createdAt":now(),"reviewedAt":now(),"reviewNote":"","supersedes":if prior.is_null(){Value::Null}else{json!({"recordId":record_id,"revisionId":prior})},"supersededBy":null,"content":content}).as_object().unwrap(){next[k]=v.clone();}
                let revisions = record["revisions"]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?;
                for r in revisions.iter_mut() {
                    if r["id"] == prior {
                        r["status"] = json!("superseded");
                        r["supersededBy"] = json!({"recordId":record_id,"revisionId":rid});
                    }
                }
                revisions.retain(|r| r["id"] == prior || r["id"] == current);
                revisions.push(next);
                record["revisionCounter"] = json!(number);
                record["currentRevisionId"] = json!(rid);
                record["approvedRevisionId"] = json!(rid);
            }
        }
        validate(&doc, project_id)?;
        let mut proposed = serde_json::to_vec_pretty(&doc).map_err(|_| ReferenceError::Invalid)?;
        proposed.push(b'\n');
        if proposed.len() > MAX_BYTES {
            return invalid();
        }
        let committed = self
            .commit_history(
                project,
                TransactionProposal {
                    mutations: vec![FileMutation {
                        path: RelativePath::new(PATH).map_err(|_| ReferenceError::Io)?,
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
            .map_err(ReferenceError::History)?;
        // Commit success remains explicit even if subsequent supporting-data reads fail.
        self.references(project,project_id).or_else(|_|Ok(Workspace{document:Some(doc),revision:token(&committed[0]),diagnostic:Some("Saved. Supporting links could not be checked; reload the library to check them."),entities:vec![],issues:vec![],can_undo:true,can_redo:false}))
    }
}

fn issues(doc: &Value, entities: &[Entity]) -> Vec<Issue> {
    let mut out = Vec::new();
    for key in ["cards", "loreEntries"] {
        for record in doc[key].as_array().into_iter().flatten() {
            for revision in record["revisions"].as_array().into_iter().flatten() {
                let c = &revision["content"];
                let mut emit = |field, index, state| {
                    out.push(Issue {
                        record_id: record["id"].as_str().unwrap_or_default().into(),
                        revision_id: revision["id"].as_str().unwrap_or_default().into(),
                        field,
                        index,
                        state,
                    })
                };
                let resolve =
                    |kind: &str, id: &str| entities.iter().find(|e| e.kind == kind && e.id == id);
                for (index, citation) in c["citations"].as_array().into_iter().flatten().enumerate()
                {
                    let target = &citation["target"];
                    let state = match resolve(
                        target["type"].as_str().unwrap_or_default(),
                        target["id"].as_str().unwrap_or_default(),
                    ) {
                        None => Some("missing"),
                        Some(e) if e.revision.is_none() => Some("missing"),
                        Some(e) if e.revision.as_deref() != citation["revision"].as_str() => {
                            Some("stale")
                        }
                        _ => None,
                    };
                    if let Some(s) = state {
                        emit("citations", index, s);
                    }
                }
                for (index, x) in c["links"].as_array().into_iter().flatten().enumerate() {
                    if resolve(
                        x["type"].as_str().unwrap_or_default(),
                        x["id"].as_str().unwrap_or_default(),
                    )
                    .is_none()
                    {
                        emit("links", index, "missing");
                    }
                }
                for (field, kind) in [("linkedLoreIds", "lore"), ("sceneIds", "scene")] {
                    let values = if field == "sceneIds" {
                        &c["scope"][field]
                    } else {
                        &c[field]
                    };
                    for (index, x) in values.as_array().into_iter().flatten().enumerate() {
                        if resolve(kind, x.as_str().unwrap_or_default()).is_none() {
                            emit(
                                if field == "sceneIds" {
                                    "scope"
                                } else {
                                    "linkedLoreIds"
                                },
                                index,
                                "missing",
                            );
                        }
                    }
                }
                if let Some(id) = c["linkedCharacterId"].as_str() {
                    if resolve("character", id).is_none() {
                        emit("linkedCharacterId", 0, "missing");
                    }
                }
                for (index, x) in c["knowledge"].as_array().into_iter().flatten().enumerate() {
                    if resolve("character", x["characterId"].as_str().unwrap_or_default()).is_none()
                    {
                        emit("knowledge", index, "missing");
                    }
                }
                for (index, x) in c["relationships"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .enumerate()
                {
                    if !x["target"].is_null()
                        && resolve(
                            x["target"]["type"].as_str().unwrap_or_default(),
                            x["target"]["id"].as_str().unwrap_or_default(),
                        )
                        .is_none()
                    {
                        emit("relationships", index, "missing");
                    }
                }
                for field in ["supersedes", "supersededBy"] {
                    let l = &revision[field];
                    if !l.is_null()
                        && !["cards", "loreEntries"].iter().any(|k| {
                            doc[k].as_array().into_iter().flatten().any(|r| {
                                r["id"] == l["recordId"]
                                    && r["revisions"]
                                        .as_array()
                                        .into_iter()
                                        .flatten()
                                        .any(|v| v["id"] == l["revisionId"])
                            })
                        })
                    {
                        emit(
                            if field == "supersedes" {
                                "supersedes"
                            } else {
                                "supersededBy"
                            },
                            0,
                            "missing",
                        );
                    }
                }
            }
        }
    }
    out
}

#[cfg(test)]
mod tests;
