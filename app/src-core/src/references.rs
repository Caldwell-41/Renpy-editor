//! Editor-only manual references, sharing the existing project transaction/history owner.
//! Values retain extensions; renderer commands edit known content fields only.
use crate::{
    authoring::{AuthoringError, AuthoringService, CreateCharacterRequest},
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

pub(crate) fn content_keys(kind: &str) -> Vec<&'static str> {
    COMMON
        .iter()
        .chain(if kind == "card" { CARD } else { LORE })
        .copied()
        .collect()
}

pub(crate) fn validate_generated_scope(scope: &Value) -> Result<(), ReferenceError> {
    let keys = object(scope)?;
    if keys
        .keys()
        .any(|k| !["type", "sceneIds"].contains(&k.as_str()))
    {
        return invalid();
    }
    let mut content = json!({"title":"Scope","tags":[],"scope":scope,"knowledgeNotes":"","provenance":{"kind":"inferred","notes":""},"citations":[],"links":[],"text":"Scope validation","category":"","subject":"","knowledge":[]});
    // The ordinary validator is authoritative for finite scope shape and bounds.
    validate_content(&mut content, Kind::Lore)
}
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
    ReviewLore {
        record_id: String,
        revision_id: String,
        approve: bool,
    },
    ReviewCard {
        record_id: String,
        revision_id: String,
        approve: bool,
    },
    LinkCharacter {
        record_id: Option<String>,
        character_id: String,
        expected_source_revision: String,
    },
    PreviewGameCharacter {
        record_id: Option<String>,
        technical_name: String,
        display_name: String,
        dialogue_color: String,
    },
    CreateGameCharacter {
        record_id: Option<String>,
        technical_name: String,
        display_name: String,
        dialogue_color: String,
        expected_preview_digest: String,
    },
    RestoreCard {
        record_id: String,
        revision_id: String,
    },
    SaveProjectContext {
        world: String,
        tone: String,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character_preview: Option<CharacterPreview>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterPreview {
    pub digest: String,
    pub patches: Vec<CharacterPatch>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterPatch {
    pub path: String,
    pub before: String,
    pub after: String,
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
    if let Some(context) = v.get("projectContext") {
        validate_project_context(context, &mut ids)?;
    }
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
fn empty_card(title: &str, character_id: &str) -> Value {
    json!({"title":title,"tags":[],"scope":{"type":"project"},"knowledgeNotes":"","provenance":{"kind":"userAuthored","notes":""},"citations":[],"links":[],"linkedCharacterId":character_id,"aliases":[],"description":"","appearanceNotes":"","personality":"","motivations":"","background":"","relationships":[],"speakingStyle":"","exampleDialogue":"","linkedLoreIds":[]})
}
fn new_record() -> Value {
    json!({"id":uuid::Uuid::new_v4().to_string(),"revisionCounter":0,"currentRevisionId":null,"approvedRevisionId":null,"revisions":[]})
}
fn current_revision(record: &Value) -> Result<&Value, ReferenceError> {
    array(&record["revisions"])?
        .iter()
        .find(|r| r["id"] == record["currentRevisionId"])
        .ok_or(ReferenceError::Invalid)
}
// Used by explicit lifecycle/restore actions; they cannot approve an outstanding proposal.
fn editable_card<'a>(doc: &'a Value, record_id: &str) -> Result<&'a Value, ReferenceError> {
    let record = array(&doc["cards"])?
        .iter()
        .find(|r| r["id"] == record_id)
        .ok_or(ReferenceError::Invalid)?;
    if current_revision(record)?["status"] == "proposed" {
        return invalid();
    }
    Ok(record)
}
fn association_available(
    doc: &Value,
    record_id: Option<&str>,
    character_id: &str,
) -> Result<(), ReferenceError> {
    for record in array(&doc["cards"])? {
        if record["id"].as_str() == record_id {
            continue;
        }
        // A retained approval remains usable even while the current revision is proposed.
        for revision in array(&record["revisions"])?.iter().filter(|r| {
            r["id"] == record["currentRevisionId"] || r["id"] == record["approvedRevisionId"]
        }) {
            if revision["content"]["linkedCharacterId"] == character_id {
                return invalid();
            }
        }
    }
    Ok(())
}
fn append_approved(
    record: &mut Value,
    template: &Value,
    content: Value,
    retain_support: bool,
) -> Result<(), ReferenceError> {
    let number = record["revisionCounter"]
        .as_u64()
        .unwrap_or(0)
        .checked_add(1)
        .filter(|n| *n <= MAX_COUNTER)
        .ok_or(ReferenceError::Invalid)?;
    let revision_id = uuid::Uuid::new_v4().to_string();
    let record_id = record["id"].clone();
    let prior = record["approvedRevisionId"].clone();
    let current = record["currentRevisionId"].clone();
    let mut next = template.clone();
    if !retain_support {
        next.as_object_mut()
            .ok_or(ReferenceError::Invalid)?
            .remove("supportingReadSet");
    }
    for (k,v) in json!({"id":revision_id,"number":number,"status":"approved","createdAt":now(),"reviewedAt":now(),"reviewNote":"","supersedes":if prior.is_null(){Value::Null}else{json!({"recordId":record_id,"revisionId":prior})},"supersededBy":null,"content":content}).as_object().unwrap() { next[k] = v.clone(); }
    let revisions = record["revisions"]
        .as_array_mut()
        .ok_or(ReferenceError::Invalid)?;
    for r in revisions.iter_mut().filter(|r| r["id"] == prior) {
        r["status"] = json!("superseded");
        r["supersededBy"] = json!({"recordId":record_id,"revisionId":revision_id});
    }
    revisions.retain(|r| r["id"] == prior || r["id"] == current);
    revisions.push(next);
    record["revisionCounter"] = json!(number);
    record["currentRevisionId"] = json!(revision_id);
    record["approvedRevisionId"] = json!(revision_id);
    Ok(())
}
fn validate_project_context(
    context: &Value,
    ids: &mut HashSet<String>,
) -> Result<(), ReferenceError> {
    object(context)?;
    if !ids.insert(id(&context["id"])?.into()) {
        return invalid();
    }
    let counter = context["revisionCounter"]
        .as_u64()
        .filter(|n| *n > 0 && *n <= MAX_COUNTER)
        .ok_or(ReferenceError::Invalid)?;
    let current = id(&context["currentRevisionId"])?;
    let revisions = array(&context["revisions"])?;
    if revisions.is_empty() || revisions.len() > 3 {
        return invalid();
    }
    let mut numbers = HashSet::new();
    let mut has_current = false;
    for revision in revisions {
        object(revision)?;
        let revision_id = id(&revision["id"])?;
        if !ids.insert(revision_id.into()) {
            return invalid();
        }
        has_current |= revision_id == current;
        let number = revision["number"]
            .as_u64()
            .filter(|n| *n > 0 && *n <= counter)
            .ok_or(ReferenceError::Invalid)?;
        if !numbers.insert(number) {
            return invalid();
        }
        timestamp(&revision["createdAt"], false)?;
        object(&revision["content"])?;
        text(&revision["content"]["world"], 10_000, false)?;
        text(&revision["content"]["tone"], 10_000, false)?;
    }
    if !has_current {
        return invalid();
    }
    Ok(())
}
fn authoring_error(error: AuthoringError) -> ReferenceError {
    ReferenceError::History(match error {
        AuthoringError::DirtySource => SceneError::DirtySource,
        AuthoringError::SourceConflict => SceneError::SourceConflict,
        AuthoringError::RecoveryRequired => SceneError::RecoveryRequired,
        AuthoringError::RuntimeBusy => SceneError::RuntimeBusy,
        AuthoringError::UnsupportedSource => SceneError::UnsupportedSource,
        AuthoringError::Io => SceneError::Io,
        _ => return ReferenceError::Invalid,
    })
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
        let(bytes,revision)=match self.reference_snapshot(project){Ok(snapshot)=>snapshot,Err(_)=>return Ok(Workspace{document:None,revision:String::new(),diagnostic:Some("This reference library could not be read within its bounds. Its file has been retained."),entities:vec![],issues:vec![],can_undo:false,can_redo:false,character_preview:None})};
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
        let mut issues = document
            .as_ref()
            .map(|v| issues(v, &entities))
            .unwrap_or_default();
        if let Some(doc) = document.as_ref() {
            for record in ["cards", "loreEntries"]
                .iter()
                .flat_map(|key| doc[*key].as_array().into_iter().flatten())
            {
                for revision in record["revisions"].as_array().into_iter().flatten() {
                    if let Some(set) = revision.get("supportingReadSet") {
                        let fresh = set.as_object().is_some_and(|set| {
                            set.iter().all(|(path, expected)| {
                                if !path.ends_with(".rpy")
                                    && ![
                                        ".renpy-editor/project.json",
                                        ".renpy-editor/authoring.json",
                                        ".renpy-editor/source-map.json",
                                        ".renpy-editor/ai.json",
                                    ]
                                    .contains(&path.as_str())
                                {
                                    return false;
                                }
                                RelativePath::new(path)
                                    .ok()
                                    .and_then(|path| {
                                        self.transactions.snapshot_optional(project, path).ok()
                                    })
                                    .map(|snapshot| {
                                        token(
                                            &snapshot
                                                .map(|(_, r)| r)
                                                .unwrap_or_else(Revision::expected_absence),
                                        )
                                    })
                                    .is_some_and(|current| expected.as_str() == Some(&current))
                            })
                        });
                        if !fresh {
                            issues.push(Issue {
                                record_id: record["id"].as_str().unwrap_or_default().into(),
                                revision_id: revision["id"].as_str().unwrap_or_default().into(),
                                field: "supportingReadSet",
                                index: 0,
                                state: "stale",
                            });
                        }
                    }
                }
            }
        }
        if let Some(doc) = document.as_ref() {
            // Propagate freshness only across explicit citations; never retrieve or send content.
            // Each iteration adds an issue to a finite saved revision, so cycles terminate.
            loop {
                let mut added = vec![];
                for record in ["cards", "loreEntries"]
                    .iter()
                    .flat_map(|key| doc[*key].as_array().into_iter().flatten())
                {
                    for revision in record["revisions"].as_array().into_iter().flatten() {
                        for (index, citation) in revision["content"]["citations"]
                            .as_array()
                            .into_iter()
                            .flatten()
                            .enumerate()
                        {
                            if !["card", "lore"]
                                .contains(&citation["target"]["type"].as_str().unwrap_or_default())
                            {
                                continue;
                            }
                            if issues.iter().any(|i| {
                                i.record_id == citation["target"]["id"].as_str().unwrap_or_default()
                                    && i.revision_id
                                        == citation["revision"].as_str().unwrap_or_default()
                                    && (i.field == "citations" || i.field == "supportingReadSet")
                            }) && !issues.iter().chain(added.iter()).any(|i| {
                                i.record_id == record["id"].as_str().unwrap_or_default()
                                    && i.revision_id == revision["id"].as_str().unwrap_or_default()
                                    && i.field == "citations"
                                    && i.index == index
                            }) {
                                added.push(Issue {
                                    record_id: record["id"].as_str().unwrap_or_default().into(),
                                    revision_id: revision["id"].as_str().unwrap_or_default().into(),
                                    field: "citations",
                                    index,
                                    state: "stale",
                                });
                            }
                        }
                    }
                }
                if added.is_empty() {
                    break;
                }
                issues.extend(added);
            }
        }
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
            character_preview: None,
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
    pub(crate) fn prepare_generated_reference(
        &self,
        project: &ProjectId,
        project_id: &str,
        kind: Kind,
        record_id: Option<&str>,
        fields: Value,
        citations: Value,
        provenance: Value,
        supporting_read_set: Value,
    ) -> Result<(TransactionProposal, Value), ReferenceError> {
        let (bytes, revision) = self.reference_snapshot(project)?;
        let mut doc = if revision == Revision::expected_absence() {
            empty(project_id)
        } else {
            crate::ai_discovery::strict_json(&bytes).map_err(|_| ReferenceError::Invalid)?
        };
        validate(&doc, project_id)?;
        let records = doc[kind.collection()]
            .as_array_mut()
            .ok_or(ReferenceError::Invalid)?;
        let index = if let Some(id) = record_id {
            records
                .iter()
                .position(|r| r["id"] == id)
                .ok_or(ReferenceError::Invalid)?
        } else {
            records.push(json!({"id":uuid::Uuid::new_v4().to_string(),"revisionCounter":0,"currentRevisionId":null,"approvedRevisionId":null,"revisions":[]}));
            records.len() - 1
        };
        let record = &mut records[index];
        let old = array(&record["revisions"])?
            .iter()
            .find(|r| r["id"] == record["currentRevisionId"]);
        let before = old.map(|r| r["content"].clone()).unwrap_or(Value::Null);
        let mut defaults = json!({"title":"","tags":[],"scope":{"type":"project"},"knowledgeNotes":"","provenance":{"kind":"inferred","notes":""},"citations":[],"links":[],"linkedCharacterId":null,"aliases":[],"description":"","appearanceNotes":"","personality":"","motivations":"","background":"","relationships":[],"speakingStyle":"","exampleDialogue":"","linkedLoreIds":[]});
        if kind == Kind::Lore {
            defaults = json!({"title":"","tags":[],"scope":{"type":"project"},"knowledgeNotes":"","provenance":{"kind":"inferred","notes":""},"citations":[],"links":[],"text":"","category":"","subject":"","knowledge":[]});
        }
        let mut content = merge(if before.is_null() { &defaults } else { &before }, &fields);
        if content["scope"]["type"] == "project" {
            content["scope"]
                .as_object_mut()
                .ok_or(ReferenceError::Invalid)?
                .remove("sceneIds");
        }
        let mut retained = content["citations"].as_array().cloned().unwrap_or_default();
        for citation in array(&citations)? {
            if let Some(existing) = retained.iter_mut().find(|c| {
                c["target"]["type"] == citation["target"]["type"]
                    && c["target"]["id"] == citation["target"]["id"]
            }) {
                *existing = merge(existing, citation);
            } else {
                retained.push(citation.clone());
            }
        }
        content["citations"] = json!(retained);
        content["provenance"] = merge(&content["provenance"], &provenance);
        validate_content(&content, kind)?;
        let number = record["revisionCounter"]
            .as_u64()
            .unwrap_or(0)
            .checked_add(1)
            .filter(|n| *n <= MAX_COUNTER)
            .ok_or(ReferenceError::Invalid)?;
        let id = uuid::Uuid::new_v4().to_string();
        let rid = record["id"].clone();
        let approved = record["approvedRevisionId"].clone();
        let current = record["currentRevisionId"].clone();
        let mut next = merge(
            old.unwrap_or(&Value::Null),
            &json!({"id":id,"number":number,"status":"proposed","createdAt":now(),"reviewedAt":null,"reviewNote":"","supersedes":if approved.is_null(){Value::Null}else{json!({"recordId":rid,"revisionId":approved})},"supersededBy":null,"content":content}),
        );
        // Content is already fully merged; do not resurrect removed known scope fields.
        next["content"] = content.clone();
        next["supportingReadSet"] = supporting_read_set;
        let revisions = record["revisions"]
            .as_array_mut()
            .ok_or(ReferenceError::Invalid)?;
        revisions.retain(|r| r["id"] == approved || r["id"] == current);
        revisions.push(next);
        record["currentRevisionId"] = json!(id);
        record["revisionCounter"] = json!(number);
        validate(&doc, project_id)?;
        let mut proposed = serde_json::to_vec_pretty(&doc).map_err(|_| ReferenceError::Invalid)?;
        proposed.push(b'\n');
        if proposed.len() > MAX_BYTES {
            return invalid();
        }
        Ok((
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
            json!({"recordId":rid,"revisionId":id,"before":before,"after":content,"approvedRevisionId":approved,"status":"proposed"}),
        ))
    }
    fn check_reference_support(
        &self,
        project: &ProjectId,
        project_id: &str,
        record_id: &str,
        revision_id: &str,
    ) -> Result<(), ReferenceError> {
        let workspace = self.references(project, project_id)?;
        if workspace.diagnostic.is_some()
            || workspace.issues.iter().any(|i| {
                i.record_id == record_id
                    && i.revision_id == revision_id
                    && matches!(i.field, "citations" | "supportingReadSet")
            })
        {
            return Err(ReferenceError::Conflict);
        }
        Ok(())
    }
    fn prepare_reference_character(
        &self,
        project: &ProjectId,
        project_id: &str,
        doc: &Value,
        expected_revision: &str,
        record_id: Option<&str>,
        request: CreateCharacterRequest,
    ) -> Result<(TransactionProposal, CharacterPreview), ReferenceError> {
        if let Some(record_id) = record_id {
            let record = editable_card(doc, record_id)?;
            let old = current_revision(record)?;
            if !old["content"]["linkedCharacterId"].is_null() {
                return invalid();
            }
            self.check_reference_support(project, project_id, record_id, string(&old["id"])?)?;
        }
        let mut digest = Sha256::new();
        digest.update(serde_json::to_vec(&json!({"expectedRevision":expected_revision,"recordId":record_id,"technicalName":request.technical_name,"displayName":request.display_name,"dialogueColor":request.dialogue_color})).map_err(|_|ReferenceError::Invalid)?);
        let (proposal, _) = self
            .prepare_create_character(
                project,
                project_id,
                request,
                uuid::Uuid::new_v4().to_string(),
                false,
            )
            .map_err(authoring_error)?;
        let mut patches = vec![];
        for mutation in &proposal.mutations {
            // Bind every real source/metadata precondition. Generated UUIDs in new metadata
            // are deliberately not digest input; the complete reviewed source bytes are.
            digest.update(serde_json::to_vec(&json!({"path":mutation.path.as_str(),"base":mutation.base,"before":mutation.expected_bytes})).map_err(|_|ReferenceError::Invalid)?);
            if mutation.path.as_str().ends_with(".rpy") {
                digest.update(&mutation.proposed);
            }
            patches.push(CharacterPatch {
                path: mutation.path.as_str().into(),
                before: String::from_utf8(mutation.expected_bytes.clone())
                    .map_err(|_| ReferenceError::Invalid)?,
                after: String::from_utf8(mutation.proposed.clone())
                    .map_err(|_| ReferenceError::Invalid)?,
            });
        }
        Ok((
            proposal,
            CharacterPreview {
                digest: hex::encode(digest.finalize()),
                patches,
            },
        ))
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
        let mut extra_mutations = vec![];
        let review_kind = if matches!(&request.command, Command::ReviewLore { .. }) {
            Kind::Lore
        } else {
            Kind::Card
        };
        match request.command {
            Command::ReviewCard {
                record_id,
                revision_id,
                approve,
            }
            | Command::ReviewLore {
                record_id,
                revision_id,
                approve,
            } => {
                let workspace = self.references(project, project_id)?;
                if approve
                    && workspace.issues.iter().any(|i| {
                        i.record_id == record_id
                            && i.revision_id == revision_id
                            && (i.field == "citations" || i.field == "supportingReadSet")
                    })
                {
                    return Err(ReferenceError::Conflict);
                }
                if approve {
                    let next = doc[review_kind.collection()]
                        .as_array()
                        .ok_or(ReferenceError::Invalid)?
                        .iter()
                        .find(|r| r["id"] == record_id)
                        .and_then(|r| {
                            r["revisions"]
                                .as_array()?
                                .iter()
                                .find(|v| v["id"] == revision_id)
                        })
                        .ok_or(ReferenceError::Invalid)?;
                    if let Some(set) = next.get("supportingReadSet") {
                        for (path, expected) in object(set)? {
                            if !path.ends_with(".rpy")
                                && ![
                                    ".renpy-editor/project.json",
                                    ".renpy-editor/authoring.json",
                                    ".renpy-editor/source-map.json",
                                    ".renpy-editor/ai.json",
                                ]
                                .contains(&path.as_str())
                            {
                                return invalid();
                            }
                            let (_, revision) = self
                                .transactions
                                .snapshot_optional(
                                    project,
                                    RelativePath::new(path).map_err(|_| ReferenceError::Invalid)?,
                                )
                                .map_err(|_| ReferenceError::Conflict)?
                                .unwrap_or((vec![], Revision::expected_absence()));
                            if expected.as_str() != Some(&token(&revision)) {
                                return Err(ReferenceError::Conflict);
                            }
                        }
                    }
                }
                let record = doc[review_kind.collection()]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?
                    .iter_mut()
                    .find(|r| r["id"] == record_id)
                    .ok_or(ReferenceError::Invalid)?;
                if record["currentRevisionId"] != revision_id {
                    return invalid();
                }
                let prior = record["approvedRevisionId"].clone();
                let revisions = record["revisions"]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?;
                let next = revisions
                    .iter_mut()
                    .find(|r| r["id"] == revision_id && r["status"] == "proposed")
                    .ok_or(ReferenceError::Invalid)?;
                next["status"] = json!(if approve { "approved" } else { "rejected" });
                next["reviewedAt"] = json!(now());
                if approve {
                    for r in revisions.iter_mut().filter(|r| r["id"] == prior) {
                        r["status"] = json!("superseded");
                        r["supersededBy"] = json!({"recordId":record_id,"revisionId":revision_id});
                    }
                    record["approvedRevisionId"] = json!(revision_id);
                }
            }
            Command::LinkCharacter {
                record_id,
                character_id,
                expected_source_revision,
            } => {
                id(&json!(character_id))?;
                let workspace = self.references(project, project_id)?;
                let entity = workspace
                    .entities
                    .iter()
                    .find(|e| e.kind == "character" && e.id == character_id)
                    .ok_or(ReferenceError::Invalid)?;
                if entity.revision.as_deref() != Some(expected_source_revision.as_str()) {
                    return Err(ReferenceError::Conflict);
                }
                self.ensure_source_paths_clean(
                    project,
                    self.list(project, project_id)
                        .map_err(authoring_error)?
                        .characters
                        .iter()
                        .filter(|c| c.id == character_id)
                        .map(|c| c.source.path.as_str()),
                )
                .map_err(|_| ReferenceError::History(SceneError::DirtySource))?;
                association_available(&doc, record_id.as_deref(), &character_id)?;
                let (template, content) = if let Some(record_id) = &record_id {
                    let record = editable_card(&doc, record_id)?;
                    let old = current_revision(record)?;
                    if !old["content"]["linkedCharacterId"].is_null() {
                        return invalid();
                    }
                    self.check_reference_support(
                        project,
                        project_id,
                        record_id,
                        string(&old["id"])?,
                    )?;
                    let mut content = old["content"].clone();
                    content["linkedCharacterId"] = json!(character_id);
                    (old.clone(), content)
                } else {
                    (json!({}), empty_card(&entity.title, &character_id))
                };
                let records = doc["cards"].as_array_mut().ok_or(ReferenceError::Invalid)?;
                let index = if let Some(record_id) = &record_id {
                    records
                        .iter()
                        .position(|r| r["id"] == *record_id)
                        .ok_or(ReferenceError::Invalid)?
                } else {
                    records.push(new_record());
                    records.len() - 1
                };
                append_approved(&mut records[index], &template, content, true)?;
            }
            Command::PreviewGameCharacter {
                record_id,
                technical_name,
                display_name,
                dialogue_color,
            } => {
                let (_, preview) = self.prepare_reference_character(
                    project,
                    project_id,
                    &doc,
                    &request.expected_revision,
                    record_id.as_deref(),
                    CreateCharacterRequest {
                        technical_name,
                        display_name,
                        dialogue_color,
                    },
                )?;
                let mut workspace = self.references(project, project_id)?;
                workspace.character_preview = Some(preview);
                return Ok(workspace);
            }
            Command::CreateGameCharacter {
                record_id,
                technical_name,
                display_name,
                dialogue_color,
                expected_preview_digest,
            } => {
                let (mut proposal, preview) = self.prepare_reference_character(
                    project,
                    project_id,
                    &doc,
                    &request.expected_revision,
                    record_id.as_deref(),
                    CreateCharacterRequest {
                        technical_name,
                        display_name,
                        dialogue_color,
                    },
                )?;
                if preview.digest != expected_preview_digest {
                    return Err(ReferenceError::Conflict);
                }
                // The prepared source metadata assigns this exact new stable character ID.
                let metadata = proposal
                    .mutations
                    .iter()
                    .find(|m| m.path.as_str() == ".renpy-editor/authoring.json")
                    .ok_or(ReferenceError::Invalid)?;
                let metadata: Value = serde_json::from_slice(&metadata.proposed)
                    .map_err(|_| ReferenceError::Invalid)?;
                let character = metadata["characters"]
                    .as_array()
                    .and_then(|a| a.last())
                    .ok_or(ReferenceError::Invalid)?;
                let character_id = string(&character["id"])?;
                let (template, mut content) = if let Some(record_id) = &record_id {
                    let old = current_revision(editable_card(&doc, record_id)?)?;
                    (old.clone(), old["content"].clone())
                } else {
                    (
                        json!({}),
                        empty_card(string(&character["displayName"])?, character_id),
                    )
                };
                content["linkedCharacterId"] = json!(character_id);
                let records = doc["cards"].as_array_mut().ok_or(ReferenceError::Invalid)?;
                let index = if let Some(record_id) = &record_id {
                    records
                        .iter()
                        .position(|r| r["id"] == *record_id)
                        .ok_or(ReferenceError::Invalid)?
                } else {
                    records.push(new_record());
                    records.len() - 1
                };
                append_approved(&mut records[index], &template, content, true)?;
                extra_mutations.append(&mut proposal.mutations);
            }
            Command::RestoreCard {
                record_id,
                revision_id,
            } => {
                let record = editable_card(&doc, &record_id)?;
                let current = current_revision(record)?;
                if current["id"] == revision_id {
                    return invalid();
                }
                let snapshot = array(&record["revisions"])?
                    .iter()
                    .find(|r| {
                        r["id"] == revision_id
                            && matches!(r["status"].as_str(), Some("approved" | "superseded"))
                    })
                    .ok_or(ReferenceError::Invalid)?
                    .clone();
                self.check_reference_support(project, project_id, &record_id, &revision_id)?;
                if let Some(character_id) = current["content"]["linkedCharacterId"].as_str() {
                    association_available(&doc, Some(&record_id), character_id)?;
                    if !self
                        .references(project, project_id)?
                        .entities
                        .iter()
                        .any(|e| {
                            e.kind == "character" && e.id == character_id && e.revision.is_some()
                        })
                    {
                        return Err(ReferenceError::Conflict);
                    }
                }
                let mut content = snapshot["content"].clone();
                content["linkedCharacterId"] = current["content"]["linkedCharacterId"].clone();
                validate_content(&content, Kind::Card)?;
                let record = doc["cards"]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?
                    .iter_mut()
                    .find(|r| r["id"] == record_id)
                    .ok_or(ReferenceError::Invalid)?;
                append_approved(record, &snapshot, content, true)?;
            }
            Command::SaveProjectContext { world, tone } => {
                text(&json!(world), 10_000, false)?;
                text(&json!(tone), 10_000, false)?;
                if doc.get("projectContext").is_none() {
                    doc["projectContext"] = json!({"id":uuid::Uuid::new_v4().to_string(),"revisionCounter":0,"currentRevisionId":null,"revisions":[]});
                }
                let context = &mut doc["projectContext"];
                let mut next = context["revisions"]
                    .as_array()
                    .ok_or(ReferenceError::Invalid)?
                    .iter()
                    .find(|r| r["id"] == context["currentRevisionId"])
                    .cloned()
                    .unwrap_or_else(|| json!({}));
                let content = merge(&next["content"], &json!({"world":world,"tone":tone}));
                if next["content"] == content {
                    return invalid();
                }
                let number = context["revisionCounter"]
                    .as_u64()
                    .unwrap_or(0)
                    .checked_add(1)
                    .filter(|n| *n <= MAX_COUNTER)
                    .ok_or(ReferenceError::Invalid)?;
                let revision_id = uuid::Uuid::new_v4().to_string();
                for (k, v) in
                    json!({"id":revision_id,"number":number,"createdAt":now(),"content":content})
                        .as_object()
                        .unwrap()
                {
                    next[k] = v.clone();
                }
                let revisions = context["revisions"]
                    .as_array_mut()
                    .ok_or(ReferenceError::Invalid)?;
                if revisions.len() >= 3 {
                    revisions.remove(0);
                }
                revisions.push(next);
                context["currentRevisionId"] = json!(revision_id);
                context["revisionCounter"] = json!(number);
            }
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
                if kind == Kind::Card {
                    let old = record_id
                        .as_ref()
                        .and_then(|record_id| {
                            doc["cards"]
                                .as_array()?
                                .iter()
                                .find(|r| r["id"] == *record_id)
                        })
                        .and_then(|r| current_revision(r).ok());
                    if let Some(linked) = fields.get("linkedCharacterId") {
                        if old.is_some_and(|r| r["content"]["linkedCharacterId"] != *linked) {
                            return invalid();
                        }
                        if old.is_none() && !linked.is_null() {
                            let character_id = id(linked)?;
                            association_available(&doc, None, character_id)?;
                            if !self
                                .references(project, project_id)?
                                .entities
                                .iter()
                                .any(|e| {
                                    e.kind == "character"
                                        && e.id == character_id
                                        && e.revision.is_some()
                                })
                            {
                                return invalid();
                            }
                        }
                    }
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
                if old.is_some_and(|r| {
                    r["status"] == "proposed" && r.get("supportingReadSet").is_some()
                }) {
                    return invalid();
                }
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
                // Explicit manual replacement is authored intent, not a generated dependency snapshot.
                next.as_object_mut()
                    .ok_or(ReferenceError::Invalid)?
                    .remove("supportingReadSet");
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
                    mutations: {
                        let mut mutations = vec![FileMutation {
                            path: RelativePath::new(PATH).map_err(|_| ReferenceError::Io)?,
                            kind: if revision == Revision::expected_absence() {
                                MutationKind::CreateNew
                            } else {
                                MutationKind::ReplaceExisting
                            },
                            base: revision,
                            expected_bytes: bytes,
                            proposed,
                        }];
                        mutations.extend(extra_mutations);
                        mutations
                    },
                    intent: TransactionIntent::Edit,
                },
            )
            .map_err(ReferenceError::History)?;
        // Commit success remains explicit even if subsequent supporting-data reads fail.
        self.references(project,project_id).or_else(|_|Ok(Workspace{document:Some(doc),revision:token(&committed[0]),diagnostic:Some("Saved. Supporting links could not be checked; reload the library to check them."),entities:vec![],issues:vec![],can_undo:true,can_redo:false,character_preview:None}))
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
