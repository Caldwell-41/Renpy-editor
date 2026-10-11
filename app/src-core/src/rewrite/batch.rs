//! Bounded, core-owned permissions and selectable in-memory Scene candidates.
use super::*;
use crate::authoring::{CreateCharacterRequest, UpdateCharacterRequest};
use std::collections::BTreeSet;

pub const ACTION: &str = "editScene";
#[derive(Clone, Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Permissions {
    pub replacement_ids: Vec<String>,
    pub insertion_anchor: Option<String>,
    pub speaker_ids: Vec<String>,
    pub character: Option<CharacterPermission>,
}
#[derive(Clone, Deserialize, serde::Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase", deny_unknown_fields)]
pub enum CharacterPermission {
    Create { technical_name: String },
    Update { character_id: String },
}
#[derive(Deserialize, serde::Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase", deny_unknown_fields)]
pub(super) enum Operation {
    Replace { id: String, beat_id: String, segments: Vec<Segment> },
    Insert { id: String, before_beat_id: String, beats: Vec<GeneratedBeat> },
    Character { id: String, display_name: String, dialogue_color: String },
}
impl Operation {
    fn id(&self) -> &str { match self { Self::Replace{id,..}|Self::Insert{id,..}|Self::Character{id,..} => id } }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Reply { schema_version: u32, action: String, scene_id: String, operations: Vec<Operation> }
pub(super) struct Candidate {
    operations: Vec<Operation>,
    character_id: String,
    beat_ids: Vec<String>,
    boundaries: BTreeMap<String, Boundary>,
    permissions: Permissions,
}
fn unique(ids: &[String]) -> bool { ids.iter().collect::<BTreeSet<_>>().len() == ids.len() }

impl AuthoringService {
    /// Validate author authority before Send, including owned definition support and collisions.
    pub(crate) fn batch_context(&self, project: &ProjectId, project_id: &str,
        scene_id: &str, expected: &str, p: &Permissions) -> Result<Value, RewriteError> {
        let ws = self.scene_workspace(project, project_id).map_err(RewriteError::Scene)?;
        let scene = ws.scenes.iter().find(|s| s.id == scene_id).ok_or(RewriteError::Stale)?;
        if scene.source_conflict || scene.source_revision != expected { return Err(RewriteError::Stale); }
        if p.replacement_ids.len() + usize::from(p.insertion_anchor.is_some()) + usize::from(p.character.is_some()) > 8
            || (p.replacement_ids.is_empty() && p.insertion_anchor.is_none() && p.character.is_none())
            || !unique(&p.replacement_ids) || !unique(&p.speaker_ids)
            || (p.insertion_anchor.is_none() && !p.speaker_ids.is_empty()) { return Err(RewriteError::Invalid); }
        let (bytes, rev) = self.transactions.snapshot(project,RelativePath::new(&scene.source_path).map_err(|_|RewriteError::Invalid)?)
            .map_err(|_|RewriteError::Stale)?;
        if rev.sha256 != expected { return Err(RewriteError::Stale); }
        let mut targets = vec![];
        for id in &p.replacement_ids {
            let b = scene.beats.iter().find(|b| &b.id == id && !b.protected && b.owner.is_none() && b.conditional_branch.is_none())
                .ok_or(RewriteError::Invalid)?;
            if !matches!(b.payload,crate::scene::BeatPayload::Dialogue{..}|crate::scene::BeatPayload::Narration{..}) { return Err(RewriteError::Invalid); }
            let source = std::str::from_utf8(bytes.get(b.byte_start as usize..b.byte_end as usize).ok_or(RewriteError::Stale)?)
                .map_err(|_|RewriteError::Unsupported)?;
            let boundary = Boundary::parse(quoted_content(source)?,expected).map_err(|_|RewriteError::Unsupported)?;
            targets.push(json!({"beatId":id,"payload":b.payload,"segments":boundary.segments,"protected":boundary.protected}));
        }
        if let Some(anchor) = &p.insertion_anchor { crate::scene::continue_anchor(&scene.beats,anchor).map_err(RewriteError::Scene)?; }
        for id in &p.speaker_ids { if !ws.authoring.characters.iter().any(|c| &c.id == id) { return Err(RewriteError::Invalid); } }
        let character = match &p.character {
            Some(CharacterPermission::Create{technical_name}) => {
                self.ensure_batch_symbol_available(project,project_id,technical_name).map_err(|_|RewriteError::Unsupported)?;
                let prepared=self.prepare_create_character(project,project_id,CreateCharacterRequest { technical_name:technical_name.clone(),display_name:"Preview".into(),dialogue_color:"#ffffff".into() },uuid::Uuid::new_v4().to_string(),true).map_err(|_|RewriteError::Unsupported)?;
                self.prepare_selected_edits(project,project_id,scene_id,expected,vec![],None,Some(prepared)).map_err(RewriteError::Scene)?;
                json!({"type":"create","technicalName":technical_name,"newSpeakerReference":"proposedCharacter","fields":["displayName","dialogueColor"]})
            }
            Some(CharacterPermission::Update{character_id}) => {
                let c = ws.authoring.characters.iter().find(|c| &c.id == character_id).ok_or(RewriteError::Invalid)?;
                self.prepare_update_character(project,project_id,UpdateCharacterRequest { id:c.id.clone(),expected_source_revision:c.source.source_revision.clone(),display_name:c.display_name.clone(),dialogue_color:c.dialogue_color.clone() },true).map_err(|_|RewriteError::Unsupported)?;
                json!({"type":"update","characterId":c.id,"technicalName":c.technical_name,"displayName":c.display_name,"dialogueColor":c.dialogue_color,"source":c.source,"fields":["displayName","dialogueColor"]})
            }
            None => Value::Null,
        };
        Ok(json!({"permissions":p,"targets":targets,"character":character}))
    }
}
pub(super) fn schema(p: &Permissions, scene: &str, targets: &Value) -> Value {
    let id = json!({"type":"string","minLength":1,"maxLength":80});
    let mut variants = vec![];
    for target in targets.as_array().into_iter().flatten() {
        let boundary: Boundary = Boundary { segments:vec![], protected:target["protected"].as_array().unwrap().iter().map(|v|crate::rewrite_text::Protected { token:v["token"].as_str().unwrap().into(),original_source:v["originalSource"].as_str().unwrap().into() }).collect() };
        let segments = super::schema(scene,target["beatId"].as_str().unwrap(),&boundary)["properties"]["segments"].clone();
        variants.push(json!({"type":"object","additionalProperties":false,"required":["type","id","beatId","segments"],"properties":{"type":{"type":"string","enum":["replace"]},"id":id,"beatId":{"type":"string","enum":[target["beatId"]]},"segments":segments}}));
    }
    if let Some(anchor) = &p.insertion_anchor {
        let mut speakers:Vec<&str> = p.speaker_ids.iter().map(String::as_str).collect();
        if matches!(p.character,Some(CharacterPermission::Create{..})) { speakers.push("proposedCharacter"); }
        let beats = continue_schema(scene,anchor,speakers)["properties"]["beats"].clone();
        variants.push(json!({"type":"object","additionalProperties":false,"required":["type","id","beforeBeatId","beats"],"properties":{"type":{"type":"string","enum":["insert"]},"id":id,"beforeBeatId":{"type":"string","enum":[anchor]},"beats":beats}}));
    }
    if p.character.is_some() {
        variants.push(json!({"type":"object","additionalProperties":false,"required":["type","id","displayName","dialogueColor"],"properties":{"type":{"type":"string","enum":["character"]},"id":id,"displayName":{"type":"string","minLength":1,"maxLength":160},"dialogueColor":{"type":"string","pattern":"^#[0-9a-fA-F]{6}$"}}}));
    }
    json!({"type":"object","additionalProperties":false,"required":["schemaVersion","action","sceneId","operations"],"properties":{"schemaVersion":{"type":"integer","enum":[1]},"action":{"type":"string","enum":[ACTION]},"sceneId":{"type":"string","enum":[scene]},"operations":{"type":"array","minItems":1,"maxItems":8,"items":{"anyOf":variants}}}})
}
impl Candidate {
    pub(super) fn parse(parsed: Value, t: &Transient) -> Result<Self,RewriteError> {
        let r: Reply = serde_json::from_value(parsed).map_err(|_|RewriteError::Invalid)?;
        if r.schema_version != 1 || r.action != ACTION || r.scene_id != t.context.scene_id || r.operations.is_empty() || r.operations.len()>8 { return Err(RewriteError::Invalid); }
        let p = t.context.batch.clone().ok_or(RewriteError::Invalid)?;
        let body: Value = serde_json::from_slice(&t.body).map_err(|_|RewriteError::Invalid)?;
        let user: Value = serde_json::from_str(body["messages"][1]["content"].as_str().ok_or(RewriteError::Invalid)?).map_err(|_|RewriteError::Invalid)?;
        let mut boundaries = BTreeMap::new();
        for target in user["story"]["batch"]["targets"].as_array().ok_or(RewriteError::Invalid)? {
            let segments: Vec<Segment> = serde_json::from_value(target["segments"].clone()).map_err(|_|RewriteError::Invalid)?;
            let protected = target["protected"].as_array().ok_or(RewriteError::Invalid)?.iter().map(|v|Ok(crate::rewrite_text::Protected { token:v["token"].as_str().ok_or(RewriteError::Invalid)?.into(),original_source:v["originalSource"].as_str().ok_or(RewriteError::Invalid)?.into() })).collect::<Result<Vec<_>,RewriteError>>()?;
            boundaries.insert(target["beatId"].as_str().ok_or(RewriteError::Invalid)?.into(),Boundary { segments,protected });
        }
        let mut ids=BTreeSet::new(); let mut beats=BTreeSet::new(); let mut groups=0; let mut characters=0; let mut total=0; let mut inserted=0; let mut needs_character=false;
        for op in &r.operations {
            if op.id().is_empty() || op.id().len()>80 || !ids.insert(op.id()) { return Err(RewriteError::Invalid); }
            match op {
                Operation::Replace{beat_id,segments,..} => {
                    if !beats.insert(beat_id) { return Err(RewriteError::Invalid); }
                    boundaries.get(beat_id).ok_or(RewriteError::Invalid)?.emit(segments).map_err(|_|RewriteError::Invalid)?;
                    total += segments.iter().map(|s| match s { Segment::Literal{literal} => literal.len(),_=>0 }).sum::<usize>();
                }
                Operation::Insert{before_beat_id,beats,..} => {
                    groups+=1; inserted=beats.len();
                    if groups>1 || Some(before_beat_id)!=p.insertion_anchor.as_ref() || beats.is_empty() || beats.len()>8 { return Err(RewriteError::Invalid); }
                    for b in beats {
                        b.entry()?; total+=b.text().len();
                        if let GeneratedBeat::Dialogue{character_id,..}=b {
                            if character_id=="proposedCharacter" {
                                if !matches!(p.character,Some(CharacterPermission::Create{..})) { return Err(RewriteError::Invalid); }
                                needs_character=true;
                            } else if !p.speaker_ids.contains(character_id) { return Err(RewriteError::Invalid); }
                        }
                    }
                }
                Operation::Character{display_name,dialogue_color,..} => {
                    characters+=1; total+=display_name.len()+dialogue_color.len();
                    if characters>1 || p.character.is_none() { return Err(RewriteError::Invalid); }
                }
            }
        }
        if total>crate::rewrite_text::MAX_TEXT || (needs_character && characters!=1) { return Err(RewriteError::Invalid); }
        Ok(Self { operations:r.operations,character_id:uuid::Uuid::new_v4().to_string(),beat_ids:(0..inserted).map(|_|uuid::Uuid::new_v4().to_string()).collect(),boundaries,permissions:p })
    }
    pub(super) fn ids(&self) -> Vec<String> { self.operations.iter().map(|o|o.id().into()).collect() }
    pub(super) fn prepare(&self, service: &AuthoringService, project: &ProjectId, project_id: &str,
        t: &Transient, selected: &[String]) -> Result<(Option<TransactionProposal>,Value),RewriteError> {
        let all=self.ids();
        if !unique(selected) || selected.iter().any(|id| !all.contains(id)) { return Err(RewriteError::Invalid); }
        let character_op = self.operations.iter().find(|op| matches!(op,Operation::Character{..}));
        let mut operations=vec![]; let mut missing=vec![];
        for op in &self.operations {
            let dependencies:Vec<_> = match op {
                Operation::Insert{beats,..} if beats.iter().any(|b| matches!(b,GeneratedBeat::Dialogue{character_id,..} if character_id=="proposedCharacter")) => vec![character_op.ok_or(RewriteError::Invalid)?.id()],
                _=>vec![],
            };
            if selected.iter().any(|id|id==op.id()) { for dep in &dependencies { if !selected.iter().any(|id|id==dep) { missing.push(json!({"operationId":op.id(),"requires":dep})); } } }
            let mut value=serde_json::to_value(op).map_err(|_|RewriteError::Invalid)?;
            value["dependencies"]=json!(dependencies);
            if let Operation::Replace{beat_id,..}=op { value["beforeSegments"]=json!(self.boundaries[beat_id].segments);value["protected"]=json!(self.boundaries[beat_id].protected); }
            if matches!(op,Operation::Insert{..}) { value["assignedBeatIds"]=json!(self.beat_ids); }
            if matches!(op,Operation::Character{..}) { value["permission"]=json!(self.permissions.character);value["assignedCharacterId"]=json!(match &self.permissions.character {Some(CharacterPermission::Update{character_id})=>character_id,_=>&self.character_id}); }
            operations.push(value);
        }
        let valid=!selected.is_empty() && missing.is_empty();
        let mut semantic=json!({"action":ACTION,"operations":operations,"selectedIds":selected,"valid":valid,"missingDependencies":missing});
        if !valid { return Ok((None,semantic)); }
        let mut character=None; let mut replacements=vec![]; let mut insertion=None;
        for op in &self.operations {
            if !selected.iter().any(|id|id==op.id()) {continue;}
            match op {
                Operation::Replace{beat_id,segments,..} => replacements.push((beat_id.clone(),self.boundaries[beat_id].emit(segments).map_err(|_|RewriteError::Invalid)?)),
                Operation::Insert{before_beat_id,beats,..} => {
                    let entries=beats.iter().map(|b| { let (mut speaker,text)=b.entry()?; if speaker.as_deref()==Some("proposedCharacter") {speaker=Some(self.character_id.clone());} Ok((speaker,text)) }).collect::<Result<Vec<_>,RewriteError>>()?;
                    insertion=Some((before_beat_id.clone(),entries,self.beat_ids.clone()));
                }
                Operation::Character{display_name,dialogue_color,..} => {
                    let prepared=match self.permissions.character.as_ref().ok_or(RewriteError::Invalid)? {
                        CharacterPermission::Create{technical_name} => service.prepare_create_character(project,project_id,CreateCharacterRequest {technical_name:technical_name.clone(),display_name:display_name.clone(),dialogue_color:dialogue_color.clone()},self.character_id.clone(),true),
                        CharacterPermission::Update{character_id} => {
                            let ws=service.list(project,project_id).map_err(|_|RewriteError::Stale)?;
                            let c=ws.characters.iter().find(|c|&c.id==character_id).ok_or(RewriteError::Stale)?;
                            service.prepare_update_character(project,project_id,UpdateCharacterRequest {id:character_id.clone(),expected_source_revision:c.source.source_revision.clone(),display_name:display_name.clone(),dialogue_color:dialogue_color.clone()},true)
                        }
                    }.map_err(|_|RewriteError::Invalid)?;
                    semantic["characterPreview"]=json!({"character":prepared.1.characters.iter().find(|c|c.id==self.character_id || matches!(&self.permissions.character,Some(CharacterPermission::Update{character_id}) if &c.id==character_id))});
                    character=Some(prepared);
                }
            }
        }
        let proposal=service.prepare_selected_edits(project,project_id,&t.context.scene_id,&t.context.expected_source_revision,replacements,insertion,character).map_err(RewriteError::Scene)?;
        Ok((Some(proposal),semantic))
    }
}
