use super::*;
use crate::{handle_application_request, lifecycle::LifecycleService};
use std::fs;
struct Fixture {
    _temp: tempfile::TempDir,
    service: LifecycleService,
    root: std::path::PathBuf,
    session: String,
    project: String,
}
impl Fixture {
    fn new() -> Self {
        let temp = tempfile::tempdir().unwrap();
        let profile = temp.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        let p = service.open_path(&root).unwrap();
        Self {
            _temp: temp,
            service,
            root,
            session: p.session_id,
            project: p.project_id,
        }
    }
    fn call(&mut self, operation: &str, mut payload: Value) -> Value {
        payload["sessionId"] = json!(self.session);
        serde_json::to_value(handle_application_request(json!({"protocolVersion":1,"requestId":uuid::Uuid::new_v4().simple().to_string(),"operation":operation,"payload":payload}),false,&mut self.service)).unwrap()
    }
    fn ok(&mut self, op: &str, p: Value) -> Value {
        let r = self.call(op, p);
        assert_eq!(r["ok"], true, "{r}");
        r["value"].clone()
    }
    fn prompt(&mut self) -> Value {
        self.ok("prompts.list", json!({}))
    }
    fn apply(&mut self, command: Value) -> Value {
        let p = self.prompt();
        self.ok(
            "prompts.apply",
            json!({"expectedRevision":p["revision"],"command":command}),
        )
    }
    fn selection(&mut self) -> Value {
        let options = self.ok("context.options", json!({}));
        let t = &options["targets"][0];
        json!({"expectedPromptRevision":options["prompt"]["revision"],"expectedStructureRevision":options["structureRevision"],"sceneId":t["sceneId"],"beatId":t["beatId"],"expectedSourceRevision":t["sourceRevision"],"references":[],"task":"Keep the meaning. café 雪","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024})
    }
    fn library(&self) {
        let mut doc: Value = serde_json::from_str(include_str!(
            "../../../tests/fixtures/reference-library/manual-save.json"
        ))
        .unwrap();
        doc["projectId"] = json!(self.project);
        let lore = &mut doc["loreEntries"][0];
        lore["approvedRevisionId"] = lore["currentRevisionId"].clone();
        lore["revisions"][0]["status"] = json!("approved");
        lore["revisions"][0]["content"]["citations"] = json!([]);
        lore["revisions"][0]["reviewedAt"] = json!("2026-10-10T00:00:00Z");
        fs::write(
            self.root.join(references::PATH),
            serde_json::to_vec(&doc).unwrap(),
        )
        .unwrap();
    }
}
#[test]
fn context_exact_large_integer_defaults_survive_serialized_payload_without_runtime_claims() {
    for value in [9_007_199_254_740_993i64, i64::MAX, i64::MIN] {
        let mut f = Fixture::new();
        f.service
            .authoring_create_variable(crate::authoring::CreateVariableRequest {
                technical_name: "precision".into(),
                variable_type: crate::authoring::VariableType::Int,
                default_value: json!(value),
            })
            .unwrap();
        // Use the established semantic transaction fixture rather than an external
        // source edit, which intentionally requires reconciliation of its map.
        let workspace = f.ok("scene.list", json!({}));
        let scene = &workspace["scenes"][0];
        let beat = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "narration")
            .unwrap();
        f.ok("scene.apply", json!({"expectedProjectRevision":workspace["projectRevision"],"expectedSourceMapRevision":workspace["sourceMapRevision"],"command":{"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beat["id"],"beat":{"type":"narration","text":"Exact [precision]"}}}));
        let mut input = f.selection();
        input["beatId"] = beat["id"].clone();
        let preview = f.ok("context.preview", input);
        let serialized = preview["serializedPayload"].as_str().unwrap();
        let messages: Value = serde_json::from_str(serialized).unwrap();
        let user: Value =
            serde_json::from_str(messages["messages"][1]["content"].as_str().unwrap()).unwrap();
        let definition = user["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["kind"] == "variableDefault")
            .unwrap();
        assert_eq!(
            definition["statement"],
            format!("default precision = {value}")
        );
        assert_eq!(definition["runtimeValue"], "unknown");
        assert!(serialized.contains(&value.to_string()));
        assert_eq!(preview["payloadDigest"], digest(serialized.as_bytes()));
    }
}
#[test]
fn production_prompt_save_restore_history_reopen_isolation_and_extensions() {
    let mut f = Fixture::new();
    let baseline = f.prompt();
    assert!(!f.root.join(PATH).exists());
    let mut doc = empty(&f.project);
    doc["unrelated"] = json!({"settings":[1,"keep"]});
    doc["prompts"]["futureAction"] = json!({"text":"untouched"});
    doc["styleNotes"] = json!("Separate author style.");
    fs::write(f.root.join(PATH), serde_json::to_vec(&doc).unwrap()).unwrap();
    let source = fs::read(f.root.join("game/script.rpy")).unwrap();
    let edited =
        f.apply(json!({"type":"save","text":"Literal custom café 雪\r\nNo macros: {{x}}"}));
    assert_eq!(edited["customized"], true);
    let bytes = fs::read(f.root.join(PATH)).unwrap();
    let restored = f.apply(json!({"type":"restore"}));
    assert_eq!(restored["effectiveText"], baseline["baselineText"]);
    assert_eq!(restored["customized"], false);
    let restored_bytes = fs::read(f.root.join(PATH)).unwrap();
    assert_eq!(
        serde_json::from_slice::<Value>(&restored_bytes).unwrap()["unrelated"],
        doc["unrelated"]
    );
    f.apply(json!({"type":"undo"}));
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), bytes);
    f.apply(json!({"type":"redo"}));
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), restored_bytes);
    f.apply(json!({"type":"undo"}));
    f.apply(json!({"type":"undo"}));
    assert_eq!(
        serde_json::from_slice::<Value>(&fs::read(f.root.join(PATH)).unwrap()).unwrap(),
        doc
    );
    f.apply(json!({"type":"redo"}));
    f.apply(json!({"type":"redo"}));
    assert_eq!(fs::read(f.root.join("game/script.rpy")).unwrap(), source);
    f.ok("project.close", json!({}));
    let p = f.service.open_path(&f.root).unwrap();
    f.session = p.session_id;
    assert_eq!(f.prompt()["effectiveText"], baseline["baselineText"]);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), restored_bytes);
    let other = Fixture::new();
    assert!(!other.root.join(PATH).exists());
}
#[test]
fn exact_deterministic_payload_references_dependencies_and_boundary_refusals() {
    let mut f = Fixture::new();
    f.library();
    let mut p = f.selection();
    let options = f.ok("context.options", json!({}));
    let refs = options["references"].as_array().unwrap();
    assert_eq!(refs.len(), 2);
    p["references"] = json!(refs
        .iter()
        .map(|v| json!({"kind":v["kind"],"recordId":v["recordId"],"revisionId":v["revisionId"]}))
        .collect::<Vec<_>>());
    let a = f.ok("context.preview", p.clone());
    let b = f.ok("context.preview", p.clone());
    assert_eq!(a, b);
    assert_eq!(a["included"].as_array().unwrap().len(), 2);
    assert_eq!(a["dependencies"][0]["included"], true);
    assert_eq!(a["sendAvailable"], false);
    let serialized = a["serializedPayload"].as_str().unwrap();
    assert!(!serialized.contains("futureContent"));
    assert!(!serialized.contains("futureLibrary"));
    assert!(serialized.contains("Mara"));
    assert_eq!(a["payloadDigest"], digest(serialized.as_bytes()));
    let size = &a["size"];
    let total = size["total"].as_u64().unwrap();
    assert_eq!(size["serializedBytes"], serialized.len());
    assert_eq!(
        total,
        serialized.len() as u64 + 1024 + size["margin"].as_u64().unwrap()
    );
    p["contextBudget"] = json!(total);
    p["contextCeiling"] = json!(total);
    assert_eq!(f.call("context.preview", p.clone())["ok"], true);
    p["contextBudget"] = json!(total - 1);
    assert_eq!(
        f.call("context.preview", p.clone())["error"]["code"],
        "CONTEXT_BUDGET"
    );
    p["contextBudget"] = json!(32768);
    p["contextCeiling"] = json!(total - 1);
    assert_eq!(
        f.call("context.preview", p.clone())["error"]["code"],
        "CONTEXT_BUDGET"
    );
    p["contextCeiling"] = json!(32768);
    p["references"][0]["revisionId"] = json!("30000000-0000-4000-8000-000000000001");
    assert_eq!(
        f.call("context.preview", p.clone())["error"]["code"],
        "STALE_CONTEXT"
    );
    p["references"] = json!([]);
    let excluded = f.ok("context.preview", p.clone());
    assert_eq!(excluded["excluded"].as_array().unwrap().len(), 2);
    assert!(!excluded["serializedPayload"]
        .as_str()
        .unwrap()
        .contains("Mara"));
    f.apply(json!({"type":"save","text":"new prompt"}));
    assert_eq!(
        f.call("context.preview", p)["error"]["code"],
        "STALE_CONTEXT"
    );
}
#[test]
fn stale_citations_external_save_invalid_metadata_and_session_are_refused() {
    let mut f = Fixture::new();
    f.library();
    let mut p = f.selection();
    let mut doc: Value =
        serde_json::from_slice(&fs::read(f.root.join(references::PATH)).unwrap()).unwrap();
    let record = &mut doc["cards"][0];
    let rid = record["approvedRevisionId"].clone();
    let revision = record["revisions"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|v| v["id"] == rid)
        .unwrap();
    revision["content"]["citations"] = json!([{"target":{"type":"scene","id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"},"revision":"a".repeat(64),"notes":"Missing source"}]);
    p["references"] = json!([{"kind":"card","recordId":record["id"],"revisionId":rid}]);
    fs::write(
        f.root.join(references::PATH),
        serde_json::to_vec(&doc).unwrap(),
    )
    .unwrap();
    assert_eq!(
        f.call("context.preview", p)["error"]["code"],
        "STALE_CONTEXT"
    );
    let old = f.prompt();
    f.apply(json!({"type":"save","text":"Saved"}));
    assert_eq!(
        f.call(
            "prompts.apply",
            json!({"expectedRevision":old["revision"],"command":{"type":"save","text":"stale"}})
        )["error"]["code"],
        "STALE_CONTEXT"
    );
    for invalid in [
        b"{broken".as_slice(),
        b"{\"schemaVersion\":2}",
        b"{\"schemaVersion\":1,\"schemaVersion\":1}",
    ] {
        fs::write(f.root.join(PATH), invalid).unwrap();
        assert_eq!(
            f.call("prompts.list", json!({}))["error"]["code"],
            "PROMPT_UNAVAILABLE"
        );
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), invalid);
    }
    f.session = uuid::Uuid::new_v4().to_string();
    assert_eq!(
        f.call("context.options", json!({}))["error"]["code"],
        "STALE_PROJECT_SESSION"
    );
}

#[test]
fn relevant_draft_refusal_and_prompt_text_bounds_preserve_data() {
    let mut f = Fixture::new();
    let p = f.selection();
    let options = f.ok("context.options", json!({}));
    let ws = f.ok("scene.list", json!({}));
    let scene = ws["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == options["targets"][0]["sceneId"])
        .unwrap();
    let path = scene["sourcePath"].clone();
    let opened = f.ok("source.open", json!({"path":path}));
    let text = opened["text"].as_str().unwrap();
    f.ok("source.updateDraft",json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{text}# unsaved fixture\n"),"selectionStart":0,"selectionEnd":0}));
    assert_eq!(
        f.call("context.preview", p)["error"]["code"],
        "CONTEXT_DRAFT"
    );
    let before = f.prompt();
    let r=f.call("prompts.apply",json!({"expectedRevision":before["revision"],"command":{"type":"save","text":"x".repeat(MAX_PROMPT+1)}}));
    assert_eq!(r["error"]["code"], "INVALID_PROMPT");
    assert!(!f.root.join(PATH).exists());
    f.apply(json!({"type":"save","text":"x".repeat(MAX_PROMPT)}));
    assert_eq!(
        f.prompt()["effectiveText"].as_str().unwrap().len(),
        MAX_PROMPT
    );
    let saved = fs::read(f.root.join(PATH)).unwrap();
    let current = f.prompt();
    assert_eq!(
        f.call(
            "prompts.apply",
            json!({"expectedRevision":current["revision"],"command":{"type":"save","text":" "}})
        )["error"]["code"],
        "INVALID_PROMPT"
    );
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), saved);
}
#[test]
fn installed_baseline_update_keeps_override_until_explicit_restore() {
    let mut f = Fixture::new();
    let mut doc = empty(&f.project);
    doc["prompts"][ACTION] = json!({"text":"Saved against old baseline","baselineVersion":"old","baselineDigest":"a".repeat(64),"extension":{"retained":true}});
    fs::write(f.root.join(PATH), serde_json::to_vec(&doc).unwrap()).unwrap();
    let p = f.prompt();
    assert_eq!(p["effectiveText"], "Saved against old baseline");
    assert_eq!(p["savedBaselineVersion"], "old");
    assert_eq!(p["baselineVersion"], BASELINE_VERSION);
    let preview = f.selection();
    assert_eq!(
        f.ok("context.preview", preview)["savedBaselineDigest"],
        "a".repeat(64)
    );
    f.apply(json!({"type":"save","text":"New author prose"}));
    assert_eq!(
        serde_json::from_slice::<Value>(&fs::read(f.root.join(PATH)).unwrap()).unwrap()["prompts"]
            [ACTION]["extension"]["retained"],
        true
    );
    f.apply(json!({"type":"restore"}));
    assert_eq!(f.prompt()["effectiveText"], BASELINE);
}

#[test]
fn shared_project_context_exact_preview_omission_budget_and_unknown_data_preservation() {
    let mut f = Fixture::new();
    f.library();
    let source = fs::read(f.root.join("game/script.rpy")).unwrap();
    let mut legacy_prompt = empty(&f.project);
    legacy_prompt["styleNotes"] = json!("HIDDEN_LEGACY_TONE_DO_NOT_SEND");
    legacy_prompt["futurePrompt"] = json!({"keep":true});
    fs::write(
        f.root.join(PATH),
        serde_json::to_vec(&legacy_prompt).unwrap(),
    )
    .unwrap();
    let prompt_bytes = fs::read(f.root.join(PATH)).unwrap();
    let library = f.ok("references.list", json!({}));
    let saved=f.ok("references.apply",json!({"expectedRevision":library["revision"],"command":{"type":"saveProjectContext","world":"World café 雪\r\n  before dawn  ","tone":"Slow prose; sharp dialogue."}}));
    let mut doc = saved["document"].clone();
    let context = &mut doc["projectContext"];
    context["privateExtension"] = json!("RECORD_EXTENSION_DO_NOT_SEND");
    context["revisions"][0]["privateExtension"] = json!("REVISION_EXTENSION_DO_NOT_SEND");
    context["revisions"][0]["content"]["privateExtension"] = json!("CONTENT_EXTENSION_DO_NOT_SEND");
    fs::write(
        f.root.join(references::PATH),
        serde_json::to_vec(&doc).unwrap(),
    )
    .unwrap();
    let reference_bytes = fs::read(f.root.join(references::PATH)).unwrap();
    let options = f.ok("context.options", json!({}));
    assert_eq!(options["projectContext"], doc["projectContext"]);
    let selection = f.selection();
    let preview = f.ok("context.preview", selection.clone());
    assert_eq!(preview["projectContext"]["included"], true);
    let body: Value = serde_json::from_str(preview["serializedPayload"].as_str().unwrap()).unwrap();
    let user: Value =
        serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
    assert_eq!(
        user["projectContext"],
        json!({"recordId":doc["projectContext"]["id"],"revisionId":doc["projectContext"]["currentRevisionId"],"world":"World café 雪\r\n  before dawn  ","tone":"Slow prose; sharp dialogue."})
    );
    assert!(user.get("styleNotes").is_none());
    for excluded in [
        "HIDDEN_LEGACY_TONE_DO_NOT_SEND",
        "RECORD_EXTENSION_DO_NOT_SEND",
        "REVISION_EXTENSION_DO_NOT_SEND",
        "CONTENT_EXTENSION_DO_NOT_SEND",
    ] {
        assert!(!preview["serializedPayload"]
            .as_str()
            .unwrap()
            .contains(excluded));
    }
    assert_eq!(
        preview["payloadDigest"],
        digest(preview["serializedPayload"].as_str().unwrap().as_bytes())
    );
    let mut omitted_selection = selection.clone();
    omitted_selection["includeProjectContext"] = json!(false);
    let omitted = f.ok("context.preview", omitted_selection.clone());
    assert_eq!(omitted["projectContext"]["included"], false);
    let omitted_body: Value =
        serde_json::from_str(omitted["serializedPayload"].as_str().unwrap()).unwrap();
    let omitted_user: Value =
        serde_json::from_str(omitted_body["messages"][1]["content"].as_str().unwrap()).unwrap();
    assert!(omitted_user.get("projectContext").is_none());
    assert!(!omitted["serializedPayload"]
        .as_str()
        .unwrap()
        .contains("Slow prose; sharp dialogue."));
    assert!(
        preview["size"]["total"].as_u64().unwrap() > omitted["size"]["total"].as_u64().unwrap()
    );
    let admitted_budget = omitted["size"]["total"].clone();
    let mut limited = selection;
    limited["contextBudget"] = admitted_budget.clone();
    limited["contextCeiling"] = admitted_budget.clone();
    assert_eq!(
        f.call("context.preview", limited.clone())["error"]["code"],
        "CONTEXT_BUDGET"
    );
    limited["includeProjectContext"] = json!(false);
    let admitted = f.ok("context.preview", limited);
    assert_eq!(admitted["size"]["total"], admitted_budget);
    assert_eq!(fs::read(f.root.join("game/script.rpy")).unwrap(), source);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), prompt_bytes);
    assert_eq!(
        fs::read(f.root.join(references::PATH)).unwrap(),
        reference_bytes
    );
}
