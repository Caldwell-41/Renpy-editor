//! Memory-only one-Beat assistance. The renderer cannot supply a reply or mutation.
use crate::{
    ai_credentials,
    ai_profiles::StudioProfile,
    ai_request::{Cancel, Completion},
    authoring::AuthoringService,
    prompts::{self, PreviewRequest},
    rewrite_text::{Boundary, Segment},
    transaction::{ProjectId, RelativePath, Revision, TransactionProposal},
};
use serde::Deserialize;
pub mod batch;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

#[derive(Debug)]
pub enum RewriteError {
    Invalid,
    Stale,
    Unsupported,
    Cancelled,
    Unavailable,
    Prompt(prompts::PromptError),
    Scene(crate::scene::SceneError),
}
pub fn content_digest(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}
fn revision_token(r: &Revision) -> String {
    content_digest(&serde_json::to_vec(r).unwrap())
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PrepareRequest {
    pub profile_id: String,
    pub expected_profile_token: String,
    pub timeout_seconds: u32,
    pub context: PreviewRequest,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AcceptRequest {
    pub proposal_id: String,
    pub preview_digest: String,
    #[serde(default)]
    pub selected_ids: Vec<String>,
}
#[derive(Deserialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
pub struct SelectionRequest { pub proposal_id: String, pub selected_ids: Vec<String> }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Response {
    schema_version: u32,
    action: String,
    target: Target,
    segments: Vec<Segment>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Target {
    scene_id: String,
    beat_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ContinueResponse {
    schema_version: u32,
    action: String,
    target: Target,
    beats: Vec<GeneratedBeat>,
}
#[derive(Deserialize, serde::Serialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
enum GeneratedBeat {
    Narration { text: String },
    Dialogue { character_id: String, text: String },
}
impl GeneratedBeat {
    fn entry(&self) -> Result<(Option<String>, String), RewriteError> {
        let (speaker, text) = match self {
            Self::Narration { text } => (None, text),
            Self::Dialogue { character_id, text } => (Some(character_id.clone()), text),
        };
        if text.trim().is_empty() {
            return Err(RewriteError::Invalid);
        }
        let encoded = Boundary {
            segments: vec![],
            protected: vec![],
        }
        .emit(&[Segment::Literal {
            literal: text.clone(),
        }])
        .map_err(|_| RewriteError::Invalid)?;
        Ok((speaker, encoded))
    }
    fn text(&self) -> &str {
        match self {
            Self::Narration { text } | Self::Dialogue { text, .. } => text,
        }
    }
}
fn continue_schema(scene: &str, beat: &str, characters: Vec<&str>) -> Value {
    let text = json!({"type":"string","minLength":1,"maxLength":10000});
    let mut alternatives = vec![
        json!({"type":"object","additionalProperties":false,"required":["type","text"],"properties":{"type":{"type":"string","enum":["narration"]},"text":text}}),
    ];
    if !characters.is_empty() {
        alternatives.push(json!({"type":"object","additionalProperties":false,"required":["type","characterId","text"],"properties":{"type":{"type":"string","enum":["dialogue"]},"characterId":{"type":"string","enum":characters},"text":text}}));
    }
    json!({"type":"object","additionalProperties":false,"required":["schemaVersion","action","target","beats"],"properties":{"schemaVersion":{"type":"integer","enum":[1]},"action":{"type":"string","enum":[prompts::CONTINUE]},"target":{"type":"object","additionalProperties":false,"required":["sceneId","beatId"],"properties":{"sceneId":{"type":"string","enum":[scene]},"beatId":{"type":"string","enum":[beat]}}},"beats":{"type":"array","minItems":1,"maxItems":8,"items":{"anyOf":alternatives}}}})
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct DraftTarget {
    chapter_id: String,
    title: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct DraftResponse {
    schema_version: u32,
    action: String,
    target: DraftTarget,
    beats: Vec<GeneratedBeat>,
    terminal: ReturnOnly,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ReturnOnly {
    #[serde(rename = "type")]
    kind: String,
}
fn draft_schema(chapter: &str, title: &str, characters: Vec<&str>) -> Value {
    let mut value = continue_schema("", "", characters);
    value["required"] = json!(["schemaVersion", "action", "target", "beats", "terminal"]);
    value["properties"]["action"] = json!({"type":"string","enum":[prompts::DRAFT]});
    value["properties"]["target"] = json!({"type":"object","additionalProperties":false,"required":["chapterId","title"],"properties":{"chapterId":{"type":"string","enum":[chapter]},"title":{"type":"string","enum":[title]}}});
    value["properties"]["terminal"] = json!({"type":"object","additionalProperties":false,"required":["type"],"properties":{"type":{"type":"string","enum":["return"]}}});
    value
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CardResponse { schema_version: u32, action: String, target: CardTarget, fields: CardFields }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CardTarget { record_id: Option<String>, title: String }
#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CardFields {
    aliases: Vec<String>, description: String, appearance_notes: String,
    personality: String, motivations: String, background: String,
    speaking_style: String, example_dialogue: String,
}
#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct LoreFields { text: String, category: String, subject: String, tags: Vec<String>, knowledge_notes: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct LoreResponse { schema_version: u32, action: String, target: CardTarget, fields: LoreFields }
fn lore_schema(record: &str, title: &str) -> Value {
    let mut schema = card_schema(record,title);
    schema["properties"]["action"] = json!({"type":"string","enum":[prompts::LORE]});
    let mut properties = serde_json::Map::new();
    for key in ["text","category","subject","knowledgeNotes"] { properties.insert(key.into(),json!({"type":"string","maxLength":if key=="category"||key=="subject" {160}else{10000}})); }
    properties.insert("tags".into(),json!({"type":"array","maxItems":32,"uniqueItems":true,"items":{"type":"string","maxLength":160,"minLength":1}}));
    schema["properties"]["fields"] = json!({"type":"object","additionalProperties":false,"required":properties.keys().collect::<Vec<_>>(),"properties":properties});
    schema
}
fn card_schema(record: &str, title: &str) -> Value {
    let mut properties = serde_json::Map::new();
    for key in ["description","appearanceNotes","personality","motivations","background","speakingStyle","exampleDialogue"] {
        properties.insert(key.into(),json!({"type":"string","maxLength":10000}));
    }
    properties.insert("aliases".into(),json!({"type":"array","maxItems":32,"uniqueItems":true,"items":{"type":"string","maxLength":160,"minLength":1}}));
    json!({"type":"object","additionalProperties":false,"required":["schemaVersion","action","target","fields"],"properties":{
        "schemaVersion":{"type":"integer","enum":[1]},"action":{"type":"string","enum":[prompts::CARD]},
        "target":{"type":"object","additionalProperties":false,"required":["recordId","title"],"properties":{"recordId":if record.is_empty(){json!({"type":"null"})}else{json!({"type":"string","enum":[record]})},"title":{"type":"string","enum":[title]}}},
        "fields":{"type":"object","additionalProperties":false,"required":properties.keys().collect::<Vec<_>>(),"properties":properties}
    }})
}
#[derive(PartialEq)]
enum Phase {
    Prepared,
    Sent,
    Review,
    Consumed,
}
// No Debug/Serialize: raw payloads and replies are not diagnostic data.
pub(crate) struct Transient {
    token: String,
    session: String,
    profile_token: String,
    profile: StudioProfile,
    timeout: u32,
    destination: crate::ai_request::Destination,
    context: PreviewRequest,
    preview: Value,
    body: Vec<u8>,
    boundary: Boundary,
    draft_versions: BTreeMap<String, u64>,
    phase: Phase,
    cancel: Option<Cancel>,
    proposal: Option<TransactionProposal>,
    review: Option<Value>,
    batch: Option<batch::Candidate>,
}
pub struct SendCapture {
    pub profile: StudioProfile,
    pub body: Vec<u8>,
    pub timeout_seconds: u32,
    pub destination: crate::ai_request::Destination,
}
fn quoted_content(source: &str) -> Result<&str, RewriteError> {
    let start = source.find('"').ok_or(RewriteError::Unsupported)?;
    let mut escaped = false;
    for (i, ch) in source[start + 1..].char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
        } else if ch == '"' {
            return Ok(&source[start + 1..start + 1 + i]);
        }
    }
    Err(RewriteError::Unsupported)
}
fn schema(scene: &str, beat: &str, boundary: &Boundary) -> Value {
    let literal = json!({"type":"object","additionalProperties":false,"required":["literal"],"properties":{"literal":{"type":"string","maxLength":10000}}});
    let mut alternatives = vec![literal];
    if !boundary.protected.is_empty() {
        alternatives.push(json!({"type":"object","additionalProperties":false,"required":["token"],"properties":{"token":{"type":"string","enum":boundary.protected.iter().map(|p|&p.token).collect::<Vec<_>>()}}}));
    }
    json!({"type":"object","additionalProperties":false,"required":["schemaVersion","action","target","segments"],"properties":{
        "schemaVersion":{"type":"integer","enum":[1]}, "action":{"type":"string","enum":[prompts::ACTION]},
        "target":{"type":"object","additionalProperties":false,"required":["sceneId","beatId"],"properties":{"sceneId":{"type":"string","enum":[scene]},"beatId":{"type":"string","enum":[beat]}}},
        "segments":{"type":"array","minItems":1,"maxItems":256,"items":{"anyOf":alternatives}}
    }})
}
impl AuthoringService {
    pub fn rewrite_prepare(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        store: &crate::ai_profiles::ProfileStore,
        request: PrepareRequest,
    ) -> Result<Value, RewriteError> {
        self.rewrite_prepare_bound(project,project_id,session,store,request,None)
    }
    pub fn rewrite_prepare_bound(
        &self, project: &ProjectId, project_id: &str, session: &str,
        store: &crate::ai_profiles::ProfileStore, request: PrepareRequest,
        reviewed: Option<crate::ai_request::Destination>,
    ) -> Result<Value, RewriteError> {
        if ai_credentials::token(store) != request.expected_profile_token
            || !(30..=1800).contains(&request.timeout_seconds)
        {
            return Err(RewriteError::Stale);
        }
        let mut profile = store
            .profiles
            .iter()
            .find(|p| p.profile_id == request.profile_id)
            .cloned()
            .ok_or(RewriteError::Invalid)?;
        if !profile.credential_bound() {
            return Err(RewriteError::Unavailable);
        }
        // Reuse destination validation without reading a key or connecting.
        if !profile.settings.valid() {
            return Err(RewriteError::Unsupported);
        }
        crate::ai_request::destination(&profile.settings).map_err(|_| RewriteError::Unsupported)?;
        if !profile.compatibility_ready() { return Err(RewriteError::Unavailable); }
        let destination=if let Some(value)=reviewed { value } else {
            // Core-only callers are static: DNS is owned by desktop preparation outside its project lock.
            let uri: ureq::http::Uri=profile.settings.endpoint.parse().map_err(|_|RewriteError::Unsupported)?;
            uri.host().unwrap_or("").trim_matches(['[',']']).parse::<std::net::IpAddr>().map_err(|_|RewriteError::Unsupported)?;
            crate::ai_request::resolve_destination(&profile.settings).map_err(|_|RewriteError::Unsupported)?
        };
        if destination.addresses.is_empty(){return Err(RewriteError::Unsupported);}
        let connection_location = if profile.settings.endpoint.starts_with("https://") {
            "Verified HTTPS; certificate and hostname checked before sending; inference locality unknown"
        } else if crate::ai_profiles::http_address_allowed(destination.addresses[0].ip(), false) {
            "Literal loopback HTTP (unencrypted); inference locality unknown"
        } else {
            "Private LAN HTTP (unencrypted); explicitly opted in; inference locality unknown"
        };
        let context = self
            .context_preview(project, project_id, session, request.context.clone())
            .map_err(RewriteError::Prompt)?;
        let messages = context["payload"]["messages"]
            .as_array()
            .ok_or(RewriteError::Invalid)?;
        let mut user: Value = serde_json::from_str(
            messages[1]["content"]
                .as_str()
                .ok_or(RewriteError::Invalid)?,
        )
        .map_err(|_| RewriteError::Invalid)?;
        if !user["story"]["owner"].is_null() || !user["story"]["conditionalBranch"].is_null() {
            return Err(RewriteError::Unsupported);
        }
        let batch = request.context.action == batch::ACTION;
        let continuing = request.context.action == prompts::CONTINUE;
        let drafting = request.context.action == prompts::DRAFT;
        let card = request.context.action == prompts::CARD;
        let lore = request.context.action == prompts::LORE;
        let boundary = if continuing || drafting || card || lore || batch {
            Boundary {
                segments: vec![],
                protected: vec![],
            }
        } else {
            let exact = user["story"]["source"]
                .as_str()
                .ok_or(RewriteError::Invalid)?;
            Boundary::parse(
                quoted_content(exact)?,
                &request.context.expected_source_revision,
            )
            .map_err(|_| RewriteError::Unsupported)?
        };
        let response_schema = if batch {
            batch::schema(request.context.batch.as_ref().ok_or(RewriteError::Invalid)?, &request.context.scene_id, &user["story"]["batch"]["targets"])
        } else if lore {
            lore_schema(&request.context.lore_id, &request.context.display_name)
        } else if card {
            card_schema(&request.context.card_id, &request.context.display_name)
        } else if drafting {
            draft_schema(
                &request.context.chapter_id,
                &request.context.display_name,
                user["definitions"]
                    .as_array()
                    .ok_or(RewriteError::Invalid)?
                    .iter()
                    .filter(|d| d["kind"] == "character")
                    .filter_map(|d| d["id"].as_str())
                    .collect(),
            )
        } else if continuing {
            continue_schema(
                &request.context.scene_id,
                &request.context.beat_id,
                user["definitions"]
                    .as_array()
                    .ok_or(RewriteError::Invalid)?
                    .iter()
                    .filter(|d| d["kind"] == "character")
                    .filter_map(|d| d["id"].as_str())
                    .collect(),
            )
        } else {
            schema(
                &request.context.scene_id,
                &request.context.beat_id,
                &boundary,
            )
        };
        user["responseContract"] = if batch {
            json!({"version":1,"action":batch::ACTION,"schema":response_schema,"authority":"Only reviewed permissions. 1–8 typed selectable operations; no paths, arbitrary source, tools, technical renames, Appearance or reference edits. A new speaker uses proposedCharacter and depends on the Character operation. Preserve every replacement token exactly once in order. New prose is inert literal text. Maximum 10000 aggregate UTF-8 generated text bytes including Character fields. Core owns IDs, encoding and exact subset previews."})
        } else if lore {
            json!({"version":1,"action":prompts::LORE,"schema":response_schema,"authority":"Draft exactly one editor-only lorebook entry with the reviewed title and author-selected applicability. Save creates proposed text only; explicit approval is separate. Core owns IDs, provenance and citations. Preserve links, knowledge annotations, extensions, existing approved text and ALL runnable source. No approval, scope changes, paths, definitions, assets, cards, tools or other operations. At most 10000 total UTF-8 generated field bytes."})
        } else if card {
            json!({"version":1,"action":prompts::CARD,"schema":response_schema,"authority":"Draft exactly one editor-only Character card with the reviewed name. Accept saves a proposed revision only; approval is a separate user action. Core owns IDs, provenance and citations. Preserve existing links, scope, extensions, approved text and ALL runnable source. No approval, paths, definitions, assets, lore, tools or other operations. At most 10000 total UTF-8 generated field bytes."})
        } else if drafting {
            json!({"version":1,"action":prompts::DRAFT,"schema":response_schema,"authority":"Create exactly one inseparable Scene in the reviewed saved Chapter with its reviewed title: 1–8 dialogue/narration Beats, at most 10000 total UTF-8 text bytes, existing reviewed Characters and explicit terminal Return. Core owns IDs, technical label, source path and literal encoding. Preserve ALL existing source; no incoming connection, definitions, custom source, tools or other operations."})
        } else if continuing {
            json!({"version":1,"action":prompts::CONTINUE,"schema":response_schema,"authority":"Insert one inseparable group of 1–8 dialogue/narration Beats BEFORE the saved anchor. At most 10000 total UTF-8 text bytes; existing reviewed Characters only. Core owns IDs, paths and source encoding. Preserve all existing source and the terminal. New prose is literal display text; no source, tokens, tools, definitions or terminal operations."})
        } else {
            json!({"version":1,"action":prompts::ACTION,"schema":response_schema,"authority":"Replace only the selected saved text; preserve speaker, order and every protected token exactly once in its original order. Literal segments are inert display text. No paths, source patches, tools or other operations.","protected":boundary.protected,"segments":boundary.segments})
        };
        profile.settings.context_budget = request.context.context_budget as u32;
        profile.settings.context_ceiling = request.context.context_ceiling as u32;
        profile.settings.maximum_response = request.context.maximum_response as u32;
        if !profile.settings.valid() {
            return Err(RewriteError::Invalid);
        }
        let body=serde_json::to_vec(&json!({"model":profile.settings.model,"messages":[messages[0].clone(),{"role":"user","content":serde_json::to_string(&user).map_err(|_|RewriteError::Invalid)?}],"response_format":{"type":"json_schema","json_schema":{"name":if batch {"loomlight_edit_scene_v1"}else if lore {"loomlight_lore_v1"}else if card {"loomlight_card_v1"}else if drafting {"loomlight_draft_scene_v1"}else if continuing {"loomlight_continue_v1"}else{"loomlight_rewrite_v1"},"strict":true,"schema":response_schema}},"stream":false,"max_tokens":profile.settings.maximum_response,"temperature":profile.settings.temperature(),"top_p":profile.settings.top_p(),"enable_thinking":false,"enable_tools":false,"enabled_tools":[]})).map_err(|_|RewriteError::Invalid)?;
        let margin = 256.max(body.len().div_ceil(10));
        let total = body.len() + margin + request.context.maximum_response;
        if body.len() > crate::ai_request::MAX_BODY
            || total > request.context.context_budget
            || total > request.context.context_ceiling
        {
            return Err(RewriteError::Prompt(prompts::PromptError::Budget {
                total,
                budget: request.context.context_budget,
                capacity: request.context.context_ceiling,
            }));
        }
        let paths = context["readSet"]
            .as_object()
            .ok_or(RewriteError::Invalid)?
            .keys()
            .filter(|p| p.ends_with(".rpy"))
            .cloned()
            .collect::<Vec<_>>();
        let draft_versions = self
            .source_draft_versions(project, &paths)
            .map_err(|_| RewriteError::Stale)?;
        let token = uuid::Uuid::new_v4().to_string();
        let result = json!({"action":request.context.action,"anchor":user["story"]["anchor"],"terminal":user["story"]["terminal"],"chapter":if drafting {user["story"].clone()}else{Value::Null},"token":token,"payloadDigest":content_digest(&body),"serializedPayload":std::str::from_utf8(&body).unwrap(),"context":context,"protected":boundary.protected,"segments":boundary.segments,"destination":{"provider":"Unsloth Studio","reviewedAddresses":destination.addresses,"endpoint":profile.settings.endpoint,"model":profile.settings.model,"connectionLocation":connection_location,"inferenceLocality":"Unknown","retention":"Provider may retain supplied content; cancellation may not stop server computation."},"size":{"serializedBytes":body.len(),"estimatedInputTokens":body.len(),"maximumResponse":request.context.maximum_response,"margin":margin,"total":total,"contextBudget":request.context.context_budget,"contextCeiling":request.context.context_ceiling},"responseMode":"Strict JSON schema; no fallback"});
        let transient = Transient {
            token,
            session: session.into(),
            profile_token: request.expected_profile_token,
            profile,
            timeout: request.timeout_seconds,
            destination,
            context: request.context,
            preview: context,
            body,
            boundary,
            draft_versions,
            phase: Phase::Prepared,
            cancel: None,
            proposal: None,
            review: None,
            batch: None,
        };
        self.rewrite_validate(
            project,
            project_id,
            session,
            &ai_credentials::token(store),
            &transient,
        )?;
        self.rewrites
            .lock()
            .map_err(|_| RewriteError::Unavailable)?
            .insert(project.clone(), transient);
        Ok(result)
    }
    fn rewrite_validate(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        profile_token: &str,
        t: &Transient,
    ) -> Result<(), RewriteError> {
        if session != t.session || profile_token != t.profile_token {
            return Err(RewriteError::Stale);
        }
        if t.cancel.as_ref().is_some_and(Cancel::cancelled) {
            return Err(RewriteError::Cancelled);
        }
        // Include identity as well as bytes: same-byte external replacements are stale.
        for (path, expected) in t.preview["readSet"]
            .as_object()
            .ok_or(RewriteError::Invalid)?
        {
            let (_, rev) = self
                .transactions
                .snapshot_optional(
                    project,
                    RelativePath::new(path).map_err(|_| RewriteError::Invalid)?,
                )
                .map_err(|_| RewriteError::Stale)?
                .unwrap_or((vec![], Revision::expected_absence()));
            if expected.as_str() != Some(&revision_token(&rev)) {
                return Err(RewriteError::Stale);
            }
        }
        let fresh = self
            .context_preview(project, project_id, session, t.context.clone())
            .map_err(RewriteError::Prompt)?;
        if fresh["readSet"] != t.preview["readSet"]
            || fresh["payloadDigest"] != t.preview["payloadDigest"]
        {
            return Err(RewriteError::Stale);
        }
        let paths = t.draft_versions.keys().cloned().collect::<Vec<_>>();
        if self
            .source_draft_versions(project, &paths)
            .map_err(|_| RewriteError::Stale)?
            != t.draft_versions
        {
            return Err(RewriteError::Stale);
        }

        Ok(())
    }
    pub fn rewrite_take_send(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        profile_token: &str,
        token: &str,
        digest_value: &str,
        cancel: Cancel,
    ) -> Result<SendCapture, RewriteError> {
        let mut states = self
            .rewrites
            .lock()
            .map_err(|_| RewriteError::Unavailable)?;
        let t = states
            .get_mut(project)
            .filter(|t| t.token == token && t.phase == Phase::Prepared)
            .ok_or(RewriteError::Stale)?;
        self.rewrite_validate(project, project_id, session, profile_token, t)?;
        if content_digest(&t.body) != digest_value {
            return Err(RewriteError::Stale);
        }
        t.phase = Phase::Sent;
        t.cancel = Some(cancel);
        Ok(SendCapture {
            profile: t.profile.clone(),
            body: t.body.clone(),
            timeout_seconds: t.timeout,
            destination: t.destination.clone(),
        })
    }
    pub fn rewrite_complete(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        profile_token: &str,
        token: &str,
        completion: &Completion,
    ) -> Result<Value, RewriteError> {
        let mut states = self
            .rewrites
            .lock()
            .map_err(|_| RewriteError::Unavailable)?;
        let t = states
            .get_mut(project)
            .filter(|t| t.token == token && t.phase == Phase::Sent)
            .ok_or(RewriteError::Stale)?;
        t.phase = Phase::Consumed; // No retry/repair of a rejected response.
        self.rewrite_validate(project, project_id, session, profile_token, t)?;
        if completion.model != t.profile.settings.model
            || completion.finish_reason != "stop"
            || completion.text.len() > crate::rewrite_text::MAX_TEXT * 4
        {
            return Err(RewriteError::Invalid);
        }
        let parsed = crate::ai_discovery::strict_json(completion.text.as_bytes())
            .map_err(|_| RewriteError::Invalid)?;
        if t.context.action == batch::ACTION {
            let candidate = batch::Candidate::parse(parsed,t)?;
            let selected = candidate.ids();
            let (proposal,semantic) = candidate.prepare(self,project,project_id,t,&selected)?;
            let review = selection_review(t,proposal.as_ref(),semantic);
            self.rewrite_validate(project,project_id,session,profile_token,t)?;
            t.batch=Some(candidate); t.proposal=proposal; t.review=Some(review.clone()); t.phase=Phase::Review;
            return Ok(review);
        }
        let (proposal, semantic) = if t.context.action == prompts::LORE {
            if parsed["target"].get("recordId").is_none() { return Err(RewriteError::Invalid); }
            let response: LoreResponse = serde_json::from_value(parsed).map_err(|_|RewriteError::Invalid)?;
            if response.schema_version != 1 || response.action != prompts::LORE
                || response.target.record_id.as_deref() != if t.context.lore_id.is_empty(){None}else{Some(t.context.lore_id.as_str())}
                || response.target.title != t.context.display_name { return Err(RewriteError::Invalid); }
            let mut fields = serde_json::to_value(response.fields).map_err(|_|RewriteError::Invalid)?;
            if serde_json::to_vec(&fields).map_err(|_|RewriteError::Invalid)?.len()>10000 { return Err(RewriteError::Invalid); }
            fields["title"] = json!(t.context.display_name);
            fields["scope"] = t.context.lore_scope.clone().ok_or(RewriteError::Invalid)?;
            let user: Value = serde_json::from_str(t.preview["payload"]["messages"][1]["content"].as_str().ok_or(RewriteError::Invalid)?).map_err(|_|RewriteError::Invalid)?;
            let mut citations = vec![json!({"target":{"type":"scene","id":t.context.scene_id},"revision":t.context.expected_source_revision,"notes":"Selected saved Beat; runtime state unknown."})];
            for selection in &t.context.references { if !(selection.kind=="lore" && selection.record_id==t.context.lore_id) { citations.push(json!({"target":{"type":selection.kind,"id":selection.record_id},"revision":selection.revision_id,"notes":"Explicitly included approved reference."})); } }
            let provenance = json!({"kind":"inferred","notes":format!("Generated with Unsloth Studio / {}. Prompt digest {}; reviewed request digest {}. Saved story and selected references support an interpretation requiring explicit approval.",t.profile.settings.model,t.preview["promptDigest"].as_str().unwrap_or(""),content_digest(&t.body))});
            let (proposal, lore) = self.prepare_generated_reference(project,project_id,crate::references::Kind::Lore,response.target.record_id.as_deref(),fields,json!(citations),provenance,t.preview["supportingReadSet"].clone()).map_err(|_|RewriteError::Invalid)?;
            (proposal,json!({"action":prompts::LORE,"lore":lore,"supportingStory":user["story"]}))
        } else if t.context.action == prompts::CARD {
            if parsed["target"].get("recordId").is_none() { return Err(RewriteError::Invalid); }
            let response: CardResponse = serde_json::from_value(parsed).map_err(|_| RewriteError::Invalid)?;
            if response.schema_version != 1 || response.action != prompts::CARD
                || response.target.record_id.as_deref() != if t.context.card_id.is_empty(){None}else{Some(t.context.card_id.as_str())}
                || response.target.title != t.context.display_name { return Err(RewriteError::Invalid); }
            let mut fields = serde_json::to_value(response.fields).map_err(|_| RewriteError::Invalid)?;
            if serde_json::to_vec(&fields).map_err(|_|RewriteError::Invalid)?.len() > 10000 { return Err(RewriteError::Invalid); }
            fields["title"] = json!(t.context.display_name);
            let user: Value = serde_json::from_str(t.preview["payload"]["messages"][1]["content"].as_str().ok_or(RewriteError::Invalid)?).map_err(|_| RewriteError::Invalid)?;
            let mut citations = vec![json!({"target":{"type":"scene","id":t.context.scene_id},"revision":t.context.expected_source_revision,"notes":"Selected saved Beat; runtime state unknown."})];
            for selection in &t.context.references {
                citations.push(json!({"target":{"type":selection.kind,"id":selection.record_id},"revision":selection.revision_id,"notes":"Explicitly included approved reference."}));
            }
            // Do not cite this card's own soon-to-be-superseded approved revision.
            citations.retain(|c| !(c["target"]["type"]=="card" && c["target"]["id"]==t.context.card_id));
            let provenance = json!({"kind":"inferred","notes":format!("Generated with Unsloth Studio / {}. Prompt digest {}; reviewed request digest {}. Saved story and selected references are supporting material; generated interpretation requires explicit approval.",t.profile.settings.model,t.preview["promptDigest"].as_str().unwrap_or(""),content_digest(&t.body))});
            let (proposal, card) = self.prepare_generated_reference(project, project_id, crate::references::Kind::Card, response.target.record_id.as_deref(), fields, json!(citations), provenance, t.preview["supportingReadSet"].clone()).map_err(|_| RewriteError::Invalid)?;
            (proposal, json!({"action":prompts::CARD,"card":card,"supportingStory":user["story"]}))
        } else if t.context.action == prompts::DRAFT {
            let response: DraftResponse =
                serde_json::from_value(parsed).map_err(|_| RewriteError::Invalid)?;
            if response.schema_version != 1
                || response.action != prompts::DRAFT
                || response.target.chapter_id != t.context.chapter_id
                || response.target.title != t.context.display_name
                || response.beats.is_empty()
                || response.beats.len() > 8
                || response.beats.iter().map(|b| b.text().len()).sum::<usize>()
                    > crate::rewrite_text::MAX_TEXT
            {
                return Err(RewriteError::Invalid);
            }
            if response.terminal.kind != "return" {
                return Err(RewriteError::Invalid);
            }
            let user: Value = serde_json::from_str(
                t.preview["payload"]["messages"][1]["content"]
                    .as_str()
                    .ok_or(RewriteError::Invalid)?,
            )
            .map_err(|_| RewriteError::Invalid)?;
            for beat in &response.beats {
                if let GeneratedBeat::Dialogue { character_id, .. } = beat {
                    if !user["definitions"]
                        .as_array()
                        .ok_or(RewriteError::Invalid)?
                        .iter()
                        .any(|d| d["kind"] == "character" && d["id"] == *character_id)
                    {
                        return Err(RewriteError::Invalid);
                    }
                }
            }
            let proposal = self
                .prepare_draft_scene(
                    project,
                    project_id,
                    &t.context.chapter_id,
                    t.context.display_name.clone(),
                    response
                        .beats
                        .iter()
                        .map(GeneratedBeat::entry)
                        .collect::<Result<Vec<_>, _>>()?,
                )
                .map_err(RewriteError::Scene)?;
            let project_mutation = proposal
                .mutations
                .iter()
                .find(|m| m.path.as_str() == ".renpy-editor/project.json")
                .ok_or(RewriteError::Invalid)?;
            let metadata: Value = serde_json::from_slice(&project_mutation.proposed)
                .map_err(|_| RewriteError::Invalid)?;
            let new_scene = metadata["scenes"]
                .as_array()
                .ok_or(RewriteError::Invalid)?
                .last()
                .ok_or(RewriteError::Invalid)?
                .clone();
            let map_mutation = proposal
                .mutations
                .iter()
                .find(|m| m.path.as_str() == ".renpy-editor/source-map.json")
                .ok_or(RewriteError::Invalid)?;
            let map: Value = serde_json::from_slice(&map_mutation.proposed)
                .map_err(|_| RewriteError::Invalid)?;
            let mapping = map["sceneMappings"]
                .as_array()
                .ok_or(RewriteError::Invalid)?
                .iter()
                .find(|m| m["sceneId"] == new_scene["id"])
                .ok_or(RewriteError::Invalid)?;
            let ids: Vec<_> = mapping["beats"]
                .as_array()
                .ok_or(RewriteError::Invalid)?
                .iter()
                .map(|b| b["id"].clone())
                .collect();
            if ids.len() != response.beats.len() + 1 {
                return Err(RewriteError::Invalid);
            }
            (
                proposal,
                json!({"action":prompts::DRAFT,"scene":new_scene,"chapter":user["story"],"characterNames":t.preview["characterNames"],"beats":response.beats,"assignedBeatIds":ids,"terminal":{"type":"return","id":ids.last()},"incomingConnection":"None"}),
            )
        } else if t.context.action == prompts::CONTINUE {
            let response: ContinueResponse =
                serde_json::from_value(parsed).map_err(|_| RewriteError::Invalid)?;
            if response.schema_version != 1
                || response.action != prompts::CONTINUE
                || response.target.scene_id != t.context.scene_id
                || response.target.beat_id != t.context.beat_id
                || response.beats.is_empty()
                || response.beats.len() > 8
                || response.beats.iter().map(|b| b.text().len()).sum::<usize>()
                    > crate::rewrite_text::MAX_TEXT
            {
                return Err(RewriteError::Invalid);
            }
            let original_user: Value = serde_json::from_str(
                t.preview["payload"]["messages"][1]["content"]
                    .as_str()
                    .ok_or(RewriteError::Invalid)?,
            )
            .map_err(|_| RewriteError::Invalid)?;
            for beat in &response.beats {
                if let GeneratedBeat::Dialogue { character_id, .. } = beat {
                    if !original_user["definitions"]
                        .as_array()
                        .ok_or(RewriteError::Invalid)?
                        .iter()
                        .any(|d| d["kind"] == "character" && d["id"] == *character_id)
                    {
                        return Err(RewriteError::Invalid);
                    }
                }
            }
            let entries = response
                .beats
                .iter()
                .map(GeneratedBeat::entry)
                .collect::<Result<Vec<_>, _>>()?;
            let proposal = self
                .prepare_continue_scene(
                    project,
                    project_id,
                    &t.context.scene_id,
                    &t.context.expected_source_revision,
                    &t.context.beat_id,
                    entries,
                )
                .map_err(RewriteError::Scene)?;
            let mapping = proposal
                .mutations
                .iter()
                .find(|m| m.path.as_str() == ".renpy-editor/source-map.json")
                .ok_or(RewriteError::Invalid)?;
            let before_map: Value = serde_json::from_slice(&mapping.expected_bytes)
                .map_err(|_| RewriteError::Invalid)?;
            let after_map: Value =
                serde_json::from_slice(&mapping.proposed).map_err(|_| RewriteError::Invalid)?;
            let old_ids: std::collections::BTreeSet<_> = before_map["sceneMappings"]
                .as_array()
                .ok_or(RewriteError::Invalid)?
                .iter()
                .flat_map(|m| m["beats"].as_array().into_iter().flatten())
                .filter_map(|b| b["id"].as_str())
                .collect();
            let new_ids: Vec<_> = after_map["sceneMappings"]
                .as_array()
                .ok_or(RewriteError::Invalid)?
                .iter()
                .filter(|m| m["sceneId"] == t.context.scene_id)
                .flat_map(|m| m["beats"].as_array().into_iter().flatten())
                .filter_map(|b| b["id"].as_str())
                .filter(|id| !old_ids.contains(id))
                .map(String::from)
                .collect();
            if new_ids.len() != response.beats.len() {
                return Err(RewriteError::Invalid);
            }
            (
                proposal,
                json!({"action":prompts::CONTINUE,"beats":response.beats,"assignedBeatIds":new_ids,"anchor":original_user["story"]["anchor"],"terminal":original_user["story"]["terminal"]}),
            )
        } else {
            let response: Response =
                serde_json::from_value(parsed).map_err(|_| RewriteError::Invalid)?;
            if response.schema_version != 1
                || response.action != prompts::ACTION
                || response.target.scene_id != t.context.scene_id
                || response.target.beat_id != t.context.beat_id
            {
                return Err(RewriteError::Invalid);
            }
            let encoded = t
                .boundary
                .emit(&response.segments)
                .map_err(|_| RewriteError::Invalid)?;
            let proposal = self
                .prepare_dialogue_rewrite(
                    project,
                    project_id,
                    &t.context.scene_id,
                    &t.context.expected_source_revision,
                    &t.context.beat_id,
                    encoded,
                )
                .map_err(RewriteError::Scene)?;
            (
                proposal,
                json!({"action":prompts::ACTION,"beforeSegments":t.boundary.segments,"segments":response.segments,"protected":t.boundary.protected}),
            )
        };
        let patches:Vec<_>=proposal.mutations.iter().map(|m|json!({"path":m.path.as_str(),"before":String::from_utf8_lossy(&m.expected_bytes),"after":String::from_utf8_lossy(&m.proposed)})).collect();
        // Bind semantic selection as well as exact source/map bytes.
        let preview_digest = content_digest(
            &serde_json::to_vec(&json!({"semantic":semantic,"patches":patches})).unwrap(),
        );
        let mut review = semantic;
        review["proposalId"] = json!(t.token);
        review["previewDigest"] = json!(preview_digest);
        review["target"] = json!({"sceneId":t.context.scene_id,"beatId":t.context.beat_id});
        review["patches"] = json!(patches);
        review["uncertainty"] = json!(if t.context.action==prompts::CARD || t.context.action==prompts::LORE { "Editor-only proposed notes. Approval is separate. Runtime knowledge is unknown; no project code execution." } else { "Static literal prose only. Runtime state is unknown; no SDK validation or project code execution." });
        review["usage"] = json!(completion.usage);
        self.rewrite_validate(project, project_id, session, profile_token, t)?;
        t.phase = Phase::Review;
        t.review = Some(review.clone());
        t.proposal = Some(proposal);
        Ok(review)
    }
    pub fn rewrite_select(&self, project: &ProjectId, project_id: &str, session: &str,
        profile_token: &str, request: SelectionRequest) -> Result<Value, RewriteError> {
        let mut states=self.rewrites.lock().map_err(|_|RewriteError::Unavailable)?;
        let t=states.get_mut(project).filter(|t|t.token==request.proposal_id && t.phase==Phase::Review).ok_or(RewriteError::Stale)?;
        // Clear the old candidate even on refusal; no stale selection can be saved.
        t.proposal=None;
        self.rewrite_validate(project,project_id,session,profile_token,t)?;
        let candidate=t.batch.as_ref().ok_or(RewriteError::Invalid)?;
        let (proposal,semantic)=candidate.prepare(self,project,project_id,t,&request.selected_ids)?;
        let review=selection_review(t,proposal.as_ref(),semantic);
        self.rewrite_validate(project,project_id,session,profile_token,t)?;
        t.proposal=proposal;t.review=Some(review.clone());
        Ok(review)
    }
    pub fn rewrite_accept(
        &self,
        project: &ProjectId,
        project_id: &str,
        session: &str,
        profile_token: &str,
        request: AcceptRequest,
    ) -> Result<Value, RewriteError> {
        let mut states = self
            .rewrites
            .lock()
            .map_err(|_| RewriteError::Unavailable)?;
        let t = states
            .get_mut(project)
            .filter(|t| t.token == request.proposal_id && t.phase == Phase::Review)
            .ok_or(RewriteError::Stale)?;
        if t.review
            .as_ref()
            .is_none_or(|r| r["previewDigest"] != request.preview_digest)
        {
            return Err(RewriteError::Stale);
        }
        if t.batch.is_some() {
            if t.review.as_ref().is_none_or(|r| r["valid"] != true || r["selectedIds"] != json!(request.selected_ids)) { return Err(RewriteError::Invalid); }
        } else if !request.selected_ids.is_empty() { return Err(RewriteError::Invalid); }
        self.rewrite_validate(project, project_id, session, profile_token, t)?;
        let proposal = t.proposal.take().ok_or(RewriteError::Stale)?;
        t.phase = Phase::Consumed; // Commit ambiguity is handled by ordinary recovery, not redispatch.
        if t.context.action == prompts::DRAFT {
            // Ordinary directory materialization is deferred until explicit acceptance.
            let path = proposal
                .mutations
                .iter()
                .find(|m| m.path.as_str().ends_with(".rpy"))
                .ok_or(RewriteError::Invalid)?
                .path
                .as_str();
            let directory = path.rsplit_once('/').ok_or(RewriteError::Invalid)?.0;
            self.transactions
                .ensure_directory(project, directory)
                .map_err(|_| RewriteError::Stale)?;
        }
        self.commit_history(project, proposal)
            .map_err(RewriteError::Scene)?;
        self.scene_workspace(project, project_id)
            .map_err(RewriteError::Scene)
            .and_then(|w| serde_json::to_value(w).map_err(|_| RewriteError::Unavailable))
    }
    pub fn rewrite_discard(&self, project: &ProjectId) -> Result<(), RewriteError> {
        if let Some(t) = self
            .rewrites
            .lock()
            .map_err(|_| RewriteError::Unavailable)?
            .remove(project)
        {
            if let Some(cancel) = t.cancel {
                cancel.cancel();
            }
        }
        Ok(())
    }
}

fn selection_review(t: &Transient, proposal: Option<&TransactionProposal>, mut semantic: Value) -> Value {
    let patches:Vec<_>=proposal.into_iter().flat_map(|p| &p.mutations).map(|m|json!({"path":m.path.as_str(),"before":String::from_utf8_lossy(&m.expected_bytes),"after":String::from_utf8_lossy(&m.proposed)})).collect();
    let digest=content_digest(&serde_json::to_vec(&json!({"semantic":semantic,"patches":patches})).unwrap());
    semantic["proposalId"]=json!(t.token);semantic["previewDigest"]=json!(digest);
    semantic["target"]=json!({"sceneId":t.context.scene_id,"beatId":t.context.beat_id});
    semantic["patches"]=json!(patches);semantic["uncertainty"]=json!("Static preview only. Runtime state unknown; the project has not been executed.");
    semantic
}

#[cfg(test)]
mod tests;
