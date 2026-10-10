//! Emit the actual accepted Continue Scene group for the official SDK assertion.
use loomlight_core::{
    ai_credentials::{self, Records},
    ai_profiles::{ProfileStore, StudioSettings},
    ai_request::{Cancel, Completion, Usage},
    handle_application_request,
    lifecycle::LifecycleService,
};
use serde_json::{json, Value};
fn call(
    service: &mut LifecycleService,
    session: &str,
    operation: &str,
    mut payload: Value,
) -> Value {
    payload["sessionId"] = json!(session);
    let r=serde_json::to_value(handle_application_request(json!({"protocolVersion":1,"requestId":uuid::Uuid::new_v4().simple().to_string(),"operation":operation,"payload":payload}),false,service)).unwrap();
    assert_eq!(r["ok"], true, "{r}");
    r["value"].clone()
}
fn main() {
    let tmp = tempfile::tempdir().unwrap();
    let data = tmp.path().join("profile");
    let mut service = LifecycleService::prepare_dialogue_rewrite_probe(data.clone()).unwrap();
    let root = data.join("synthetic-project");
    let project = service.open_path(&root).unwrap();
    let session = &project.session_id;
    ai_credentials::save(
        &service,
        &ai_credentials::token(&ProfileStore::default()),
        None,
        StudioSettings {
            label: "Synthetic".into(),
            endpoint: "http://127.0.0.1:8765/v1".into(),
            model: "synthetic-model".into(),
            private_http: false,
            context_budget: 32768,
            context_ceiling: 32768,
            maximum_response: 1024,
        },
    )
    .unwrap();
    let old = service.read().unwrap();
    let mut store = old.clone();
    store.revision += 1;
    store.profiles[0].revision += 1;
    store.profiles[0].credential=Some(serde_json::from_value(json!({"credentialId":uuid::Uuid::new_v4().to_string(),"revision":1,"origin":"http://127.0.0.1:8765"})).unwrap());
    service.write(&store, &old).unwrap();
    let options = call(&mut service, session, "context.options", json!({}));
    let a = options["anchors"].as_array().unwrap().last().unwrap();
    let p = call(
        &mut service,
        session,
        "rewrite.prepare",
        json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":"continueScene","expectedPromptRevision":options["continuePrompt"]["revision"],"expectedStructureRevision":options["structureRevision"],"sceneId":a["sceneId"],"beatId":a["beatId"],"expectedSourceRevision":a["sourceRevision"],"references":[],"task":"Synthetic literal proof","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}),
    );
    let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
    let user: Value =
        serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
    let character = user["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["kind"] == "character")
        .unwrap();
    let text="[1 + 2] [str(7)] {a=jump:label}link{/a} {image=fixture} brackets [x] braces {x} quotes \" slash \\ café 雪";
    let response = json!({"schemaVersion":1,"action":"continueScene","target":{"sceneId":a["sceneId"],"beatId":a["beatId"]},"beats":[{"type":"narration","text":text},{"type":"dialogue","characterId":character["id"],"text":"Second literal [flag] {b}line{/b}"}]});
    service
        .rewrite_take_send(
            session,
            p["token"].as_str().unwrap(),
            p["payloadDigest"].as_str().unwrap(),
            Cancel::default(),
        )
        .unwrap();
    let r = service
        .rewrite_complete(
            session,
            p["token"].as_str().unwrap(),
            &Completion {
                text: response.to_string(),
                model: "synthetic-model".into(),
                finish_reason: "stop".into(),
                usage: Usage {
                    prompt_tokens: None,
                    completion_tokens: None,
                    total_tokens: None,
                    reasoning_tokens: None,
                },
                response_bytes: 0,
            },
        )
        .unwrap();
    call(
        &mut service,
        session,
        "rewrite.accept",
        json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}),
    );
    let patch = r["patches"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["path"].as_str().unwrap().ends_with(".rpy"))
        .unwrap();
    let before = patch["before"].as_str().unwrap();
    let after = patch["after"].as_str().unwrap();
    let offset = p["anchor"]["byteOffset"].as_u64().unwrap() as usize;
    let group = &after[offset..offset + after.len() - before.len()];
    assert_eq!(&after[..offset], &before[..offset]);
    assert_eq!(&after[offset + group.len()..], &before[offset..]);
    let encoded = group
        .lines()
        .next()
        .unwrap()
        .trim()
        .strip_prefix('"')
        .unwrap()
        .strip_suffix('"')
        .unwrap();
    println!(
        "{}",
        json!({"encoded":encoded,"group":group,"characterDefinition":character["statement"],"expected":text})
    );
}
