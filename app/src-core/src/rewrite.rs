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
}
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
    context: PreviewRequest,
    preview: Value,
    body: Vec<u8>,
    boundary: Boundary,
    draft_versions: BTreeMap<String, u64>,
    phase: Phase,
    cancel: Option<Cancel>,
    proposal: Option<TransactionProposal>,
    review: Option<Value>,
}
pub struct SendCapture {
    pub profile: StudioProfile,
    pub body: Vec<u8>,
    pub timeout_seconds: u32,
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
        let uri: ureq::http::Uri = profile
            .settings
            .endpoint
            .parse()
            .map_err(|_| RewriteError::Unsupported)?;
        let ip: std::net::IpAddr = uri
            .host()
            .unwrap_or("")
            .trim_matches(['[', ']'])
            .parse()
            .map_err(|_| RewriteError::Unsupported)?;
        if uri.scheme_str() != Some("http") || !ip.is_loopback() {
            return Err(RewriteError::Unsupported);
        }
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
        let continuing = request.context.action == prompts::CONTINUE;
        let drafting = request.context.action == prompts::DRAFT;
        let boundary = if continuing || drafting {
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
        let response_schema = if drafting {
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
        user["responseContract"] = if drafting {
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
        let body=serde_json::to_vec(&json!({"model":profile.settings.model,"messages":[messages[0].clone(),{"role":"user","content":serde_json::to_string(&user).map_err(|_|RewriteError::Invalid)?}],"response_format":{"type":"json_schema","json_schema":{"name":if drafting {"loomlight_draft_scene_v1"}else if continuing {"loomlight_continue_v1"}else{"loomlight_rewrite_v1"},"strict":true,"schema":response_schema}},"stream":false,"max_tokens":profile.settings.maximum_response,"enable_thinking":false,"enable_tools":false,"enabled_tools":[]})).map_err(|_|RewriteError::Invalid)?;
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
        let result = json!({"action":request.context.action,"anchor":user["story"]["anchor"],"terminal":user["story"]["terminal"],"chapter":if drafting {user["story"].clone()}else{Value::Null},"token":token,"payloadDigest":content_digest(&body),"serializedPayload":std::str::from_utf8(&body).unwrap(),"context":context,"protected":boundary.protected,"segments":boundary.segments,"destination":{"provider":"Unsloth Studio","endpoint":profile.settings.endpoint,"model":profile.settings.model,"connectionLocation":"Literal loopback HTTP","inferenceLocality":"Unknown","retention":"Provider may retain supplied content; cancellation may not stop server computation."},"size":{"serializedBytes":body.len(),"estimatedInputTokens":body.len(),"maximumResponse":request.context.maximum_response,"margin":margin,"total":total,"contextBudget":request.context.context_budget,"contextCeiling":request.context.context_ceiling},"responseMode":"Strict JSON schema; no fallback"});
        let transient = Transient {
            token,
            session: session.into(),
            profile_token: request.expected_profile_token,
            profile,
            timeout: request.timeout_seconds,
            context: request.context,
            preview: context,
            body,
            boundary,
            draft_versions,
            phase: Phase::Prepared,
            cancel: None,
            proposal: None,
            review: None,
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
        let (proposal, semantic) = if t.context.action == prompts::DRAFT {
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
        review["uncertainty"] = json!("Static literal prose only. Runtime state is unknown; no SDK validation or project code execution.");
        review["usage"] = json!(completion.usage);
        self.rewrite_validate(project, project_id, session, profile_token, t)?;
        t.phase = Phase::Review;
        t.review = Some(review.clone());
        t.proposal = Some(proposal);
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

#[cfg(test)]
mod tests;
