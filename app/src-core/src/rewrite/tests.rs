use super::*;
use crate::{
    ai_credentials::Records,
    ai_profiles::{ProfileStore, StudioSettings},
    handle_application_request,
    lifecycle::LifecycleService,
};
use std::{
    fs,
    path::{Path, PathBuf},
};
struct Fixture {
    _tmp: tempfile::TempDir,
    service: LifecycleService,
    root: PathBuf,
    session: String,
    path: String,
}
impl Fixture {
    fn new() -> Self {
        let tmp = tempfile::tempdir().unwrap();
        let data = tmp.path().join("profile");
        let mut service = LifecycleService::prepare_source_foundation_probe(data.clone()).unwrap();
        let root = data.join("synthetic-project");
        let p = service.open_path(&root).unwrap();
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
                model_load: None,
                temperature: None,
                top_p: None,
            },
        )
        .unwrap();
        let old = service.read().unwrap();
        let mut store = old.clone();
        store.revision += 1;
        store.profiles[0].revision += 1;
        store.profiles[0].credential=Some(serde_json::from_value(json!({"credentialId":uuid::Uuid::new_v4().to_string(),"revision":1,"origin":"http://127.0.0.1:8765"})).unwrap());
        service.write(&store, &old).unwrap();
        let store=service.read().unwrap();ai_credentials::record_compatibility(&service,&ai_credentials::token(&store),&store.profiles[0].profile_id).unwrap();
        let w = service.scene_workspace().unwrap();
        let path = w.scenes[0].source_path.clone();
        let mut f = Self {
            _tmp: tmp,
            service,
            root,
            session: p.session_id,
            path,
        };
        let mut library: Value = serde_json::from_str(include_str!(
            "../../../tests/fixtures/reference-library/manual-save.json"
        ))
        .unwrap();
        library["projectId"] = json!(p.project_id);
        library["loreEntries"][0]["approvedRevisionId"] =
            library["loreEntries"][0]["currentRevisionId"].clone();
        library["loreEntries"][0]["revisions"][0]["status"] = json!("approved");
        library["loreEntries"][0]["revisions"][0]["content"]["citations"] = json!([]);
        library["loreEntries"][0]["revisions"][0]["reviewedAt"] = json!("2026-10-10T00:00:00Z");
        fs::write(
            f.root.join(crate::references::PATH),
            serde_json::to_vec(&library).unwrap(),
        )
        .unwrap();
        let w = f.ok("scene.list", json!({}));
        let s = &w["scenes"][0];
        let b = s["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "narration")
            .unwrap();
        f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"updateBeat","sceneId":s["id"],"expectedSourceRevision":s["sourceRevision"],"beatId":b["id"],"beat":{"type":"narration","text":"Hello [flag] {b}friend{/b} [[literal] {{brace}"}}}));
        f
    }
    fn call(&mut self, op: &str, mut p: Value) -> Value {
        p["sessionId"] = json!(self.session);
        serde_json::to_value(handle_application_request(json!({"protocolVersion":1,"requestId":uuid::Uuid::new_v4().simple().to_string(),"operation":op,"payload":p}),false,&mut self.service)).unwrap()
    }
    fn ok(&mut self, op: &str, p: Value) -> Value {
        let r = self.call(op, p);
        assert_eq!(r["ok"], true, "{r}");
        r["value"].clone()
    }
    fn prepare(&mut self) -> Value { self.prepare_with_project_context(None) }
    fn prepare_with_project_context(&mut self, include: Option<bool>) -> Value {
        let o = self.ok("context.options", json!({}));
        let w = self.ok("scene.list", json!({}));
        let scene = &w["scenes"][0];
        let b = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "narration")
            .unwrap();
        let refs = o["references"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|r| r["eligible"] == true)
            .map(
                |r| json!({"kind":r["kind"],"recordId":r["recordId"],"revisionId":r["revisionId"]}),
            )
            .collect::<Vec<_>>();
        let store = self.service.read().unwrap();
        let mut request=json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"expectedPromptRevision":o["prompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"expectedSourceRevision":scene["sourceRevision"],"sceneId":scene["id"],"beatId":b["id"],"references":refs,"task":"Rewrite café 雪","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}});
        if let Some(include)=include { request["context"]["includeProjectContext"]=json!(include); }
        self.ok("rewrite.prepare",request)
    }
    fn take(&self, p: &Value, c: Cancel) -> Result<SendCapture, crate::lifecycle::LifecycleError> {
        self.service.rewrite_take_send(
            &self.session,
            p["token"].as_str().unwrap(),
            p["payloadDigest"].as_str().unwrap(),
            c,
        )
    }
    fn response(&self, p: &Value) -> Value {
        let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
        let user: Value =
            serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        let mut segments = user["responseContract"]["segments"].clone();
        segments[0]["literal"] = json!("New [call()] {a=jump:label} café 雪 ");
        json!({"schemaVersion":1,"action":prompts::ACTION,"target":{"sceneId":user["story"]["sceneId"],"beatId":user["story"]["beatId"]},"segments":segments})
    }
    fn complete(&self, p: &Value, text: String) -> Result<Value, crate::lifecycle::LifecycleError> {
        let c = Completion {
            text,
            model: "synthetic-model".into(),
            finish_reason: "stop".into(),
            usage: crate::ai_request::Usage {
                prompt_tokens: None,
                completion_tokens: None,
                total_tokens: None,
                reasoning_tokens: None,
            },
            response_bytes: 0,
        };
        self.service
            .rewrite_complete(&self.session, p["token"].as_str().unwrap(), &c)
    }
    fn snapshots(&self) -> BTreeMap<String, Vec<u8>> {
        fn walk(root: &Path, base: &Path, out: &mut BTreeMap<String, Vec<u8>>) {
            for e in fs::read_dir(root).unwrap() {
                let p = e.unwrap().path();
                if p.is_dir() {
                    walk(&p, base, out)
                } else {
                    out.insert(
                        p.strip_prefix(base)
                            .unwrap()
                            .to_str()
                            .unwrap()
                            .replace('\\', "/"),
                        fs::read(p).unwrap(),
                    );
                }
            }
        }
        let mut m = BTreeMap::new();
        walk(&self.root, &self.root, &mut m);
        m
    }
}
fn assert_snapshots(a: &BTreeMap<String, Vec<u8>>, b: &BTreeMap<String, Vec<u8>>) {
    let hashes = |m: &BTreeMap<String, Vec<u8>>| {
        m.iter()
            .map(|(k, v)| (k.clone(), content_digest(v)))
            .collect::<BTreeMap<_, _>>()
    };
    assert_eq!(hashes(a), hashes(b));
}
#[test]
fn exact_reviewed_send_selected_references_one_acceptance_undo_redo_reopen() {
    let mut f = Fixture::new();
    let before = f.snapshots();
    let p = f.prepare();
    assert_snapshots(&before, &f.snapshots());
    let body = p["serializedPayload"].as_str().unwrap();
    assert_eq!(content_digest(body.as_bytes()), p["payloadDigest"]);
    let v: Value = serde_json::from_str(body).unwrap();
    assert_eq!(v["response_format"]["json_schema"]["strict"], true);
    assert_eq!(p["context"]["included"].as_array().unwrap().len(), 2);
    let sent = f.take(&p, Cancel::default()).unwrap();
    assert_eq!(sent.body, body.as_bytes());
    assert!(f.take(&p, Cancel::default()).is_err());
    let response = f.response(&p);
    let r = f.complete(&p, response.to_string()).unwrap();
    assert_snapshots(&before, &f.snapshots());
    let w = f.ok(
        "rewrite.accept",
        json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}),
    );
    let after = f.snapshots();
    assert_ne!(after[&f.path], before[&f.path]);
    for (path, bytes) in &before {
        if path != &f.path
            && path != ".renpy-editor/source-map.json"
            && !path.starts_with(".renpy-editor/journal/")
        {
            assert_eq!(after.get(path), Some(bytes), "{path}");
        }
    }
    let source = String::from_utf8(after[&f.path].clone()).unwrap();
    assert!(source.contains(
        "New [[call()] {{a=jump:label} café 雪 [flag] {b}friend{/b} [[literal] {{brace}"
    ));
    assert!(source.contains("opaque_neighbor = \"kept\""));
    assert!(source.starts_with('\u{feff}'));
    for patch in r["patches"].as_array().unwrap() {
        assert_eq!(
            patch["after"].as_str().unwrap().as_bytes(),
            after[patch["path"].as_str().unwrap()]
        );
    }
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    let undo=f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"undo"}}));
    assert_eq!(fs::read(f.root.join(&f.path)).unwrap(), before[&f.path]);
    f.ok("scene.apply",json!({"expectedProjectRevision":undo["projectRevision"],"expectedSourceMapRevision":undo["sourceMapRevision"],"command":{"type":"redo"}}));
    assert_eq!(fs::read(f.root.join(&f.path)).unwrap(), after[&f.path]);
    f.ok("project.close", json!({}));
    let reopened = f.service.open_path(&f.root).unwrap();
    f.session = reopened.session_id;
    assert_eq!(fs::read(f.root.join(&f.path)).unwrap(), after[&f.path]);
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
}
#[test]
fn malformed_unsafe_and_token_tampering_write_nothing() {
    let mut f = Fixture::new();
    let baseline = f.snapshots();
    for which in 0..9 {
        let p = f.prepare();
        f.take(&p, Cancel::default()).unwrap();
        let mut response = f.response(&p);
        let text = match which {
            0 => "{} trailing".into(),
            1 => "{\"schemaVersion\":1,\"schemaVersion\":1}".into(),
            2 => {
                response["path"] = json!("game/custom.rpy");
                response.to_string()
            }
            3 => {
                response["target"]["beatId"] = json!("other");
                response.to_string()
            }
            4 => {
                response["segments"] = json!([{"literal":"removed tokens"}]);
                response.to_string()
            }
            5 => {
                response["segments"][1]["token"] = json!("forged");
                response.to_string()
            }
            6 => {
                response["segments"][0]["execute"] = json!("code");
                response.to_string()
            }
            7 => {
                response["segments"][0]["literal"] = json!("NUL\0");
                response.to_string()
            }
            _ => {
                response["schemaVersion"] = json!(2);
                response.to_string()
            }
        };
        assert!(f.complete(&p, text).is_err(), "case {which}");
        assert_snapshots(&baseline, &f.snapshots());
        assert_eq!(
            f.call(
                "rewrite.accept",
                json!({"proposalId":p["token"],"previewDigest":"forged"})
            )["ok"],
            false
        );
    }
}
#[test]
fn cancel_before_or_after_publication_and_changed_prompt_or_reference_write_nothing() {
    let mut f = Fixture::new();
    let before = f.snapshots();
    let p = f.prepare();
    let cancel = Cancel::default();
    f.take(&p, cancel.clone()).unwrap();
    cancel.cancel();
    assert!(f.complete(&p, f.response(&p).to_string()).is_err());
    assert_snapshots(&before, &f.snapshots());
    let p = f.prepare();
    let cancel = Cancel::default();
    f.take(&p, cancel.clone()).unwrap();
    let review = f.complete(&p, f.response(&p).to_string()).unwrap();
    cancel.cancel();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":review["proposalId"],"previewDigest":review["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&before, &f.snapshots());
    let p = f.prepare();
    let prompt = f.ok("prompts.list", json!({}));
    f.ok("prompts.apply",json!({"expectedRevision":prompt["revision"],"command":{"type":"save","text":"Updated prompt"}}));
    let after = f.snapshots();
    assert!(f.take(&p, Cancel::default()).is_err());
    assert_snapshots(&after, &f.snapshots());
    let p = f.prepare();
    f.take(&p, Cancel::default()).unwrap();
    let r = f.complete(&p, f.response(&p).to_string()).unwrap();
    let path = f.root.join(crate::references::PATH);
    let bytes = fs::read(&path).unwrap();
    let replacement = path.with_extension("tmp");
    fs::write(&replacement, &bytes).unwrap();
    fs::rename(replacement, path).unwrap();
    let after = f.snapshots();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&after, &f.snapshots());
}
#[test]
fn stale_external_source_and_discarded_draft_generation_cannot_accept() {
    let mut f = Fixture::new();
    let p = f.prepare();
    f.take(&p, Cancel::default()).unwrap();
    let r = f.complete(&p, f.response(&p).to_string()).unwrap();
    let opened = f.ok("source.open", json!({"path":f.path}));
    let changed = format!("{}\n# draft", opened["text"].as_str().unwrap());
    let _draft=f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":changed,"selectionStart":0,"selectionEnd":0}));
    f.ok("source.discard", json!({"path":f.path}));
    let before = f.snapshots();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&before, &f.snapshots());
    let p = f.prepare();
    f.take(&p, Cancel::default()).unwrap();
    let r = f.complete(&p, f.response(&p).to_string()).unwrap();
    let path = f.root.join(&f.path);
    let mut bytes = fs::read(&path).unwrap();
    bytes.extend_from_slice(b"# external\n");
    fs::write(path, bytes).unwrap();
    let before = f.snapshots();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&before, &f.snapshots());
}

impl Fixture {
    fn continue_prepare(&mut self) -> Value {
        let o = self.ok("context.options", json!({}));
        let anchor = o["anchors"].as_array().unwrap().last().unwrap();
        let store = self.service.read().unwrap();
        self.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::CONTINUE,"expectedPromptRevision":o["continuePrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"expectedSourceRevision":anchor["sourceRevision"],"sceneId":anchor["sceneId"],"beatId":anchor["beatId"],"references":[],"task":"Continue at saved anchor","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))
    }
    fn continue_response(&self, p: &Value) -> Value {
        let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
        let user: Value =
            serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        let character = user["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["kind"] == "character")
            .unwrap();
        json!({"schemaVersion":1,"action":prompts::CONTINUE,"target":{"sceneId":user["story"]["sceneId"],"beatId":user["story"]["beatId"]},"beats":[{"type":"narration","text":"New [str(7)] {a=jump:label} café 雪 <img onerror=alert(1)>"},{"type":"dialogue","characterId":character["id"],"text":"A second line."}]})
    }
}
#[test]
fn continue_scene_exact_group_preview_preserves_bytes_ids_terminal_history_reopen() {
    let mut f = Fixture::new();
    let w = f.ok("scene.list", json!({}));
    let old_beats = w["scenes"][0]["beats"].as_array().unwrap().clone();
    let before = f.snapshots();
    let p = f.continue_prepare();
    assert_snapshots(&before, &f.snapshots());
    let body = p["serializedPayload"].as_str().unwrap();
    assert_eq!(f.take(&p, Cancel::default()).unwrap().body, body.as_bytes());
    assert!(f.take(&p, Cancel::default()).is_err());
    let response = f.continue_response(&p);
    let review = f.complete(&p, response.to_string()).unwrap();
    assert_snapshots(&before, &f.snapshots());
    assert_eq!(review["beats"], response["beats"]);
    assert_eq!(review["assignedBeatIds"].as_array().unwrap().len(), 2);
    let w = f.ok(
        "rewrite.accept",
        json!({"proposalId":review["proposalId"],"previewDigest":review["previewDigest"]}),
    );
    let after = f.snapshots();
    let offset = p["anchor"]["byteOffset"].as_u64().unwrap() as usize;
    let added = after[&f.path].len() - before[&f.path].len();
    assert_eq!(&after[&f.path][..offset], &before[&f.path][..offset]);
    assert_eq!(
        &after[&f.path][offset + added..],
        &before[&f.path][offset..]
    );
    assert!(String::from_utf8(after[&f.path].clone())
        .unwrap()
        .contains("New [[str(7)] {{a=jump:label}"));
    let new_beats = w["scenes"][0]["beats"].as_array().unwrap();
    assert_eq!(new_beats.len(), old_beats.len() + 2);
    for old in &old_beats {
        let current = new_beats.iter().find(|b| b["id"] == old["id"]).unwrap();
        assert_eq!(current["payload"], old["payload"]);
    }
    for b in new_beats
        .iter()
        .filter(|b| !old_beats.iter().any(|old| old["id"] == b["id"]))
    {
        assert!(uuid::Uuid::parse_str(b["id"].as_str().unwrap()).is_ok());
    }
    for patch in review["patches"].as_array().unwrap() {
        assert_eq!(
            patch["after"].as_str().unwrap().as_bytes(),
            after[patch["path"].as_str().unwrap()]
        );
    }
    let accepted = f.snapshots();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":review["proposalId"],"previewDigest":review["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&accepted, &f.snapshots());
    let undo=f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"undo"}}));
    assert_eq!(fs::read(f.root.join(&f.path)).unwrap(), before[&f.path]);
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        before[".renpy-editor/source-map.json"]
    );
    let redo=f.ok("scene.apply",json!({"expectedProjectRevision":undo["projectRevision"],"expectedSourceMapRevision":undo["sourceMapRevision"],"command":{"type":"redo"}}));
    assert_eq!(redo["scenes"][0]["beats"], w["scenes"][0]["beats"]);
    assert_eq!(fs::read(f.root.join(&f.path)).unwrap(), after[&f.path]);
    f.ok("project.close", json!({}));
    let reopened = f.service.open_path(&f.root).unwrap();
    f.session = reopened.session_id;
    assert_eq!(
        f.ok("scene.list", json!({}))["scenes"][0]["beats"],
        w["scenes"][0]["beats"]
    );
}
#[test]
fn continue_scene_closed_bounded_unsafe_response_zero_writes() {
    let mut f = Fixture::new();
    let before = f.snapshots();
    for case in 0..15 {
        let p = f.continue_prepare();
        f.take(&p, Cancel::default()).unwrap();
        let mut r = f.continue_response(&p);
        let text = match case {
            0 => "{} trailing".into(),
            1 => "{\"schemaVersion\":1,\"schemaVersion\":1}".into(),
            2 => {
                r["beats"] = json!([]);
                r.to_string()
            }
            3 => {
                r["beats"] = json!(vec![json!({"type":"narration","text":"x"}); 9]);
                r.to_string()
            }
            4 => {
                r["beats"][0]["text"] = json!("x".repeat(10001));
                r.to_string()
            }
            5 => {
                r["beats"][0]["text"] = json!("x".repeat(6000));
                r["beats"][1]["text"] = json!("x".repeat(6000));
                r.to_string()
            }
            6 => {
                r["beats"][0] = json!({"type":"return"});
                r.to_string()
            }
            7 => {
                r["beats"][1]["characterId"] = json!("unreviewed");
                r.to_string()
            }
            8 => {
                r["beats"][0]["id"] = json!(uuid::Uuid::new_v4().to_string());
                r.to_string()
            }
            9 => {
                r["beats"][0]["text"] = json!("nul\0");
                r.to_string()
            }
            10 => {
                r["target"]["beatId"] = json!("wrong");
                r.to_string()
            }
            11 => {
                r["path"] = json!("game/unsafe.rpy");
                r.to_string()
            }
            12 => {
                r["action"] = json!(prompts::ACTION);
                r.to_string()
            }
            13 => {
                r["beats"][0]["text"] = json!(" ");
                r.to_string()
            }
            _ => {
                r["beats"][0] = json!({"type":"customCode","source":"pass"});
                r.to_string()
            }
        };
        assert!(f.complete(&p, text).is_err(), "case {case}");
        assert_snapshots(&before, &f.snapshots());
        assert_eq!(
            f.call(
                "rewrite.accept",
                json!({"proposalId":p["token"],"previewDigest":"forged"})
            )["ok"],
            false
        );
    }
}
#[test]
fn continue_scene_cancel_competing_generation_and_external_write_zero_writes() {
    for case in 0..7 {
        let mut f = Fixture::new();
        let p = f.continue_prepare();
        let cancel = Cancel::default();
        f.take(&p, cancel.clone()).unwrap();
        if case == 0 {
            cancel.cancel();
            let before = f.snapshots();
            assert!(f.complete(&p, f.continue_response(&p).to_string()).is_err());
            assert_snapshots(&before, &f.snapshots());
            continue;
        }
        let r = f.complete(&p, f.continue_response(&p).to_string()).unwrap();
        match case {
            1 => cancel.cancel(),
            2 | 3 => {
                let opened = f.ok("source.open", json!({"path":f.path}));
                f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n# draft",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));
                if case == 3 {
                    f.ok("source.discard", json!({"path":f.path}));
                }
            }
            4 => {
                let path = f.root.join(&f.path);
                let mut bytes = fs::read(&path).unwrap();
                bytes.extend_from_slice(b"# external\n");
                fs::write(path, bytes).unwrap();
            }
            5 => {
                let path = f.root.join(&f.path);
                let bytes = fs::read(&path).unwrap();
                let replacement = path.with_extension("tmp");
                fs::write(&replacement, bytes).unwrap();
                fs::rename(replacement, path).unwrap();
            }
            _ => {
                f.continue_prepare();
            }
        }
        let before = f.snapshots();
        assert_eq!(
            f.call(
                "rewrite.accept",
                json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
            )["ok"],
            false
        );
        assert_snapshots(&before, &f.snapshots());
    }
}
#[test]
fn continue_scene_action_prompt_save_restore_undo_and_stale_send() {
    let mut f = Fixture::new();
    let p = f.continue_prepare();
    let o = f.ok("context.options", json!({}));
    let prompt=f.ok("prompts.apply",json!({"action":prompts::CONTINUE,"expectedRevision":o["continuePrompt"]["revision"],"command":{"type":"save","text":"Continue custom instructions"}}));
    assert_eq!(prompt["effectiveText"], "Continue custom instructions");
    assert!(!f.ok("prompts.list", json!({}))["customized"]
        .as_bool()
        .unwrap());
    let before = f.snapshots();
    assert!(f.take(&p, Cancel::default()).is_err());
    assert_snapshots(&before, &f.snapshots());
    let p = f.continue_prepare();
    let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
    assert_eq!(
        body["messages"][0]["content"],
        "Continue custom instructions"
    );
    let restored=f.ok("prompts.apply",json!({"action":prompts::CONTINUE,"expectedRevision":prompt["revision"],"command":{"type":"restore"}}));
    assert_eq!(restored["customized"], false);
    let undone=f.ok("prompts.apply",json!({"action":prompts::CONTINUE,"expectedRevision":restored["revision"],"command":{"type":"undo"}}));
    assert_eq!(undone["effectiveText"], "Continue custom instructions");
    f.ok("project.close", json!({}));
    let reopened = f.service.open_path(&f.root).unwrap();
    f.session = reopened.session_id;
    assert_eq!(
        f.ok("context.options", json!({}))["continuePrompt"]["effectiveText"],
        "Continue custom instructions"
    );
}
#[test]
fn continue_scene_custom_nested_boundaries_refuse_before_send() {
    let mut f = Fixture::new();
    let o = f.ok("context.options", json!({}));
    let w = f.ok("scene.list", json!({}));
    let scene = &w["scenes"][0];
    let store = f.service.read().unwrap();
    for b in scene["beats"].as_array().unwrap().iter().filter(|b| {
        b["protected"] == true || !b["owner"].is_null() || !b["conditionalBranch"].is_null()
    }) {
        let before = f.snapshots();
        assert_eq!(f.call("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::CONTINUE,"expectedPromptRevision":o["continuePrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"expectedSourceRevision":scene["sourceRevision"],"sceneId":scene["id"],"beatId":b["id"],"references":[],"task":"Unsafe boundary","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))["ok"],false);
        assert_snapshots(&before, &f.snapshots());
    }
    assert!(scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["protected"] == true));
}

#[test]
fn continue_scene_lf_crlf_bom_unterminated_terminal_and_custom_adjacent_refusal() {
    for newline in ["\n", "\r\n"] {
        let mut f = Fixture::new();
        let opened = f.ok("source.open", json!({"path":f.path}));
        let text = opened["text"]
            .as_str()
            .unwrap()
            .replace("\r\n", "\n")
            .trim_end_matches('\n')
            .replace("\n", newline);
        let draft=f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":text,"selectionStart":0,"selectionEnd":0}));
        f.ok("source.save",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
        let before = f.snapshots();
        let p = f.continue_prepare();
        f.take(&p, Cancel::default()).unwrap();
        let r = f.complete(&p, f.continue_response(&p).to_string()).unwrap();
        f.ok(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}),
        );
        let after = f.snapshots();
        let offset = p["anchor"]["byteOffset"].as_u64().unwrap() as usize;
        let added = after[&f.path].len() - before[&f.path].len();
        assert_eq!(&after[&f.path][..offset], &before[&f.path][..offset]);
        assert_eq!(
            &after[&f.path][offset + added..],
            &before[&f.path][offset..]
        );
        assert!(after[&f.path].starts_with(&[0xef, 0xbb, 0xbf]));
        assert!(!after[&f.path].ends_with(b"\n"));
        let inserted = &after[&f.path][offset..offset + added];
        assert_eq!(
            inserted.iter().filter(|b| **b == b'\r').count(),
            if newline == "\r\n" { 2 } else { 0 }
        );
    }
    let f = Fixture::new();
    let ws = f.service.scene_workspace().unwrap();
    let beats = &ws.scenes[0].beats;
    let custom = beats.iter().position(|b| b.protected).unwrap();
    assert!(crate::scene::continue_anchor(beats, &beats[custom].id).is_err());
    if custom + 1 < beats.len() {
        assert!(crate::scene::continue_anchor(beats, &beats[custom + 1].id).is_err());
    }
    let mut invalid = beats.clone();
    invalid.last_mut().unwrap().payload = crate::scene::BeatPayload::Narration {
        text: "No terminal".into(),
    };
    assert!(crate::scene::continue_anchor(&invalid, &invalid.last().unwrap().id).is_err());
}

impl Fixture {
    fn draft_prepare(&mut self) -> Value {
        let o = self.ok("context.options", json!({}));
        let store = self.service.read().unwrap();
        self.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::DRAFT,"expectedPromptRevision":o["draftPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"chapterId":o["chapters"][0]["id"],"displayName":"New café 雪","references":[],"task":"Draft bounded scene","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))
    }
    fn draft_response(&self, p: &Value) -> Value {
        let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
        let u: Value =
            serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        json!({"schemaVersion":1,"action":prompts::DRAFT,"target":{"chapterId":u["story"]["chapterId"],"title":u["story"]["title"]},"beats":[{"type":"narration","text":"New [str(7)] {a=jump:label} café 雪 <img onerror=alert(1)>"},{"type":"dialogue","characterId":u["definitions"][0]["id"],"text":"Second literal [flag] {b}line{/b}"}],"terminal":{"type":"return"}})
    }
}
#[test]
fn draft_scene_exact_dispatch_inert_source_metadata_one_transaction_undo_redo_reopen() {
    let mut f = Fixture::new();
    let old = f.ok("scene.list", json!({}));
    let before = f.snapshots();
    let p = f.draft_prepare();
    assert_snapshots(&before, &f.snapshots());
    let sent = f.take(&p, Cancel::default()).unwrap();
    assert_eq!(
        sent.body,
        p["serializedPayload"].as_str().unwrap().as_bytes()
    );
    assert!(f.take(&p, Cancel::default()).is_err());
    let r = f.complete(&p, f.draft_response(&p).to_string()).unwrap();
    assert_snapshots(&before, &f.snapshots());
    assert_eq!(r["patches"].as_array().unwrap().len(), 3);
    assert_eq!(r["terminal"]["type"], "return");
    assert_eq!(r["characterNames"][0]["displayName"], old["authoring"]["characters"][0]["displayName"]);
    assert!(!p["serializedPayload"].as_str().unwrap().contains("characterNames"));
    assert_eq!(r["incomingConnection"], "None");
    let id = r["scene"]["id"].as_str().unwrap();
    let path = r["scene"]["sourcePath"].as_str().unwrap();
    assert!(uuid::Uuid::parse_str(id).is_ok());
    let w = f.ok(
        "rewrite.accept",
        json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}),
    );
    let after = f.snapshots();
    assert_eq!(
        w["scenes"].as_array().unwrap().len(),
        old["scenes"].as_array().unwrap().len() + 1
    );
    for (path, bytes) in before.iter().filter(|(p, _)| p.ends_with(".rpy")) {
        assert_eq!(after[path], *bytes);
    }
    for patch in r["patches"].as_array().unwrap() {
        assert_eq!(
            patch["after"].as_str().unwrap().as_bytes(),
            after[patch["path"].as_str().unwrap()]
        );
    }
    assert!(String::from_utf8_lossy(&after[path]).contains("New [[str(7)] {{a=jump:label}"));
    let new = w["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == id)
        .unwrap();
    assert_eq!(new["beats"].as_array().unwrap().len(), 3);
    assert_eq!(new["beats"][2]["payload"]["type"], "return");
    for (b, assigned) in new["beats"]
        .as_array()
        .unwrap()
        .iter()
        .zip(r["assignedBeatIds"].as_array().unwrap())
    {
        assert_eq!(&b["id"], assigned);
    }
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&after, &f.snapshots());
    // Native review reads the saved source, then refreshes inventory after Undo.
    let document = f.ok("source.open", json!({"path":path}));
    f.ok("source.updateDraft", json!({"path":path,"expectedBaseRevision":document["baseRevision"],"text":format!("{}# retained draft\n", document["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));
    assert_eq!(f.call("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"undo"}}))["error"]["code"], "DIRTY_SOURCE");
    assert_snapshots(&after, &f.snapshots());
    f.ok("source.discard", json!({"path":path}));
    let undo=f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"undo"}}));
    assert!(!f.root.join(path).exists());
    for key in [
        ".renpy-editor/project.json",
        ".renpy-editor/source-map.json",
    ] {
        assert_eq!(fs::read(f.root.join(key)).unwrap(), before[key]);
    }
    let inventory = f.ok("source.list", json!({}));
    assert_eq!(inventory["dirtyCount"], 0);
    assert_eq!(f.ok("project.status", json!({})), "saved");
    let redo=f.ok("scene.apply",json!({"expectedProjectRevision":undo["projectRevision"],"expectedSourceMapRevision":undo["sourceMapRevision"],"command":{"type":"redo"}}));
    assert_eq!(redo["scenes"], w["scenes"]);
    assert_eq!(fs::read(f.root.join(path)).unwrap(), after[path]);
    f.ok("project.close", json!({}));
    f.session = f.service.open_path(&f.root).unwrap().session_id;
    assert_eq!(f.ok("scene.list", json!({}))["scenes"], w["scenes"]);
}
#[test]
fn draft_scene_closed_response_bounds_explicit_return_and_authority_zero_writes() {
    let mut f = Fixture::new();
    for case in 0..15 {
        let p = f.draft_prepare();
        let mut reply = f.draft_response(&p);
        let before = f.snapshots();
        match case {
            0 => reply["path"] = json!("game/injected.rpy"),
            1 => reply["target"]["title"] = json!("Changed"),
            2 => reply["target"]["chapterId"] = json!(uuid::Uuid::new_v4().to_string()),
            3 => {
                reply.as_object_mut().unwrap().remove("terminal");
            }
            4 => reply["terminal"] = json!({"type":"jump","sceneId":"x"}),
            5 => reply["beats"] = json!([]),
            6 => reply["beats"] = json!(vec![json!({"type":"narration","text":"x"}); 9]),
            7 => reply["beats"][0]["text"] = json!("x".repeat(10001)),
            8 => reply["beats"][0]["text"] = json!("\0"),
            9 => reply["beats"][1]["characterId"] = json!(uuid::Uuid::new_v4().to_string()),
            10 => reply["beats"][0] = json!({"type":"customCode","source":"pass"}),
            11 => reply["beats"][0]["id"] = json!(uuid::Uuid::new_v4().to_string()),
            12 => reply["terminal"]["id"] = json!("generated"),
            13 => reply["beats"][0]["text"] = json!("  "),
            _ => reply["connection"] = json!({"from":"x"}),
        }
        f.take(&p, Cancel::default()).unwrap();
        assert!(f.complete(&p, reply.to_string()).is_err(), "case {case}");
        assert_snapshots(&before, &f.snapshots());
    }
    let p = f.draft_prepare();
    let before = f.snapshots();
    f.take(&p, Cancel::default()).unwrap();
    assert!(f
        .complete(&p, "{\"schemaVersion\":1,\"schemaVersion\":1}".into())
        .is_err());
    assert_snapshots(&before, &f.snapshots());
}
#[test]
fn draft_scene_cancel_stale_chapter_session_competing_draft_external_zero_writes() {
    for case in 0..7 {
        let mut f = Fixture::new();
        let p = f.draft_prepare();
        let cancel = Cancel::default();
        f.take(&p, cancel.clone()).unwrap();
        let r = f.complete(&p, f.draft_response(&p).to_string()).unwrap();
        match case {
            0 => cancel.cancel(),
            1 => {
                let w = f.ok("scene.list", json!({}));
                f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"renameChapter","chapterId":w["chapters"][0]["id"],"displayName":"Changed"}}));
            }
            2 => {
                let opened = f.ok("source.open", json!({"path":f.path}));
                f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n# draft",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));
            }
            3 => {
                let _new = f.draft_prepare();
            }
            4 => {
                let path = f.root.join(&f.path);
                let mut b = fs::read(&path).unwrap();
                b.extend_from_slice(b"# external\n");
                fs::write(path, b).unwrap();
            }
            5 => {
                f.ok("project.close", json!({}));
                f.session = f.service.open_path(&f.root).unwrap().session_id;
            }
            _ => {
                let o = f.ok("context.options", json!({}));
                f.ok("prompts.apply",json!({"action":prompts::DRAFT,"expectedRevision":o["draftPrompt"]["revision"],"command":{"type":"save","text":"Changed draft instructions"}}));
            }
        }
        let before = f.snapshots();
        assert_eq!(
            f.call(
                "rewrite.accept",
                json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
            )["ok"],
            false,
            "case {case}"
        );
        assert_snapshots(&before, &f.snapshots());
    }
}
#[test]
fn draft_scene_empty_saved_chapter_preview_no_directory_and_accept_return() {
    let mut f = Fixture::new();
    let w = f.ok("scene.list", json!({}));
    f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"createChapter","displayName":"Empty"}}));
    let o = f.ok("context.options", json!({}));
    let store = f.service.read().unwrap();
    let chapter = &o["chapters"][1];
    let directory = chapter["directory"].as_str().unwrap();
    assert!(!f.root.join(directory).exists());
    let before = f.snapshots();
    let p=f.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::DRAFT,"expectedPromptRevision":o["draftPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"chapterId":chapter["id"],"displayName":"Empty Chapter Scene","references":[],"task":"Draft bounded scene","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}));
    f.take(&p, Cancel::default()).unwrap();
    let r = f.complete(&p, f.draft_response(&p).to_string()).unwrap();
    assert_snapshots(&before, &f.snapshots());
    assert!(!f.root.join(directory).exists());
    f.ok(
        "rewrite.accept",
        json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}),
    );
    assert!(f
        .root
        .join(r["scene"]["sourcePath"].as_str().unwrap())
        .exists());
}

#[test]
fn draft_scene_disappeared_source_retained_draft_refuses_prepare_and_accept() {
    let mut f = Fixture::new();
    let p = f.draft_prepare();
    f.take(&p, Cancel::default()).unwrap();
    let r = f.complete(&p, f.draft_response(&p).to_string()).unwrap();
    let opened = f.ok("source.open", json!({"path":f.path}));
    f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n# retained draft",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));
    fs::remove_file(f.root.join(&f.path)).unwrap();
    let before = f.snapshots();
    assert_eq!(
        f.call(
            "rewrite.accept",
            json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]})
        )["ok"],
        false
    );
    assert_snapshots(&before, &f.snapshots());
    let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
    let u: Value = serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
    let o = f.ok("context.options", json!({}));
    let store = f.service.read().unwrap();
    assert_eq!(f.call("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::DRAFT,"expectedPromptRevision":o["draftPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"chapterId":u["story"]["chapterId"],"displayName":"New café 雪","references":[],"task":"Draft","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))["ok"],false);
    assert_snapshots(&before, &f.snapshots());
}
#[test]
fn draft_scene_prompt_save_restore_history_and_stale_send() {
    let mut f = Fixture::new();
    let p = f.draft_prepare();
    let o = f.ok("context.options", json!({}));
    let saved=f.ok("prompts.apply",json!({"action":prompts::DRAFT,"expectedRevision":o["draftPrompt"]["revision"],"command":{"type":"save","text":"Custom Draft instructions"}}));
    let before = f.snapshots();
    assert!(f.take(&p, Cancel::default()).is_err());
    assert_snapshots(&before, &f.snapshots());
    let p = f.draft_prepare();
    let body: Value = serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
    assert_eq!(body["messages"][0]["content"], "Custom Draft instructions");
    let restored=f.ok("prompts.apply",json!({"action":prompts::DRAFT,"expectedRevision":saved["revision"],"command":{"type":"restore"}}));
    assert_eq!(restored["customized"], false);
    let undone=f.ok("prompts.apply",json!({"action":prompts::DRAFT,"expectedRevision":restored["revision"],"command":{"type":"undo"}}));
    assert_eq!(undone["effectiveText"], "Custom Draft instructions");
    let redone=f.ok("prompts.apply",json!({"action":prompts::DRAFT,"expectedRevision":undone["revision"],"command":{"type":"redo"}}));
    assert_eq!(redone["customized"], false);
    f.ok("project.close", json!({}));
    f.session = f.service.open_path(&f.root).unwrap().session_id;
    assert_eq!(
        f.ok("context.options", json!({}))["draftPrompt"]["effectiveText"],
        prompts::DRAFT_BASELINE
    );
}

impl Fixture {
    fn card_prepare(&mut self, record: Value) -> Value {
        let o=self.ok("context.options",json!({}));let w=self.ok("scene.list",json!({}));let s=&w["scenes"][0];
        let b=s["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").or_else(||s["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="dialogue"&&b["owner"].is_null()&&b["conditionalBranch"].is_null()&&!b["protected"].as_bool().unwrap_or(true))).unwrap();
        let store=self.service.read().unwrap();
        self.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::CARD,"cardId":record.as_str().unwrap_or(""),"displayName":"Generated café 雪","expectedPromptRevision":o["cardPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":s["id"],"beatId":b["id"],"expectedSourceRevision":s["sourceRevision"],"references":[],"task":"Draft one card","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))
    }
    fn card_response(&self,p:&Value)->Value {
        let body:Value=serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
        let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        let target=&user["story"]["cardTarget"];
        json!({"schemaVersion":1,"action":prompts::CARD,"target":{"recordId":target["recordId"],"title":target["title"]},"fields":{"aliases":["Gen"],"description":"Unescaped [str(7)] {a=jump:label} <img onerror=alert(1)> café 雪","appearanceNotes":"Notes only","personality":"Calm","motivations":"Explore","background":"Unknown","speakingStyle":"Brief","exampleDialogue":"Hello"}})
    }
    fn accept_card(&mut self,r:&Value){self.ok("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}));}
    fn review_card(&mut self,r:&Value,approve:bool)->Value {
        let w=self.ok("references.list",json!({}));
        self.call("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"reviewCard","recordId":r["card"]["recordId"],"revisionId":r["card"]["revisionId"],"approve":approve}}))
    }
    fn ref_history(&mut self,kind:&str){let w=self.ok("references.list",json!({}));self.ok("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":kind}}));}
}
#[test]
fn generated_card_exact_dispatch_passive_preview_one_transaction_approval_history_reopen() {
    let mut f=Fixture::new();let before=f.snapshots();let p=f.card_prepare(Value::Null);
    assert_snapshots(&before,&f.snapshots());let send=f.take(&p,Cancel::default()).unwrap();assert_eq!(send.body,p["serializedPayload"].as_str().unwrap().as_bytes());assert!(f.take(&p,Cancel::default()).is_err());
    let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();assert_snapshots(&before,&f.snapshots());
    assert_eq!(r["patches"].as_array().unwrap().len(),1);assert_eq!(r["patches"][0]["path"],crate::references::PATH);
    assert_eq!(r["card"]["status"],"proposed");assert!(r["card"]["after"]["description"].as_str().unwrap().contains("[str(7)]"));
    f.accept_card(&r);let saved=fs::read(f.root.join(crate::references::PATH)).unwrap();assert_eq!(saved,r["patches"][0]["after"].as_str().unwrap().as_bytes());
    let w=f.ok("references.list",json!({}));let record=w["document"]["cards"].as_array().unwrap().iter().find(|c|c["id"]==r["card"]["recordId"]).unwrap();assert!(record["approvedRevisionId"].is_null());
    assert_eq!(f.call("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}))["ok"],false);
    for(path,bytes)in before.iter().filter(|(p,_)|p.ends_with(".rpy")){assert_eq!(fs::read(f.root.join(path)).unwrap(),*bytes);}
    f.ref_history("undo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),before[crate::references::PATH]);f.ref_history("redo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),saved);
    assert_eq!(f.review_card(&r,true)["ok"],true);let approved=fs::read(f.root.join(crate::references::PATH)).unwrap();assert_eq!(f.review_card(&r,true)["ok"],false);
    f.ref_history("undo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),saved);f.ref_history("redo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),approved);
    f.ok("project.close",json!({}));f.session=f.service.open_path(&f.root).unwrap().session_id;
    let w=f.ok("references.list",json!({}));assert!(w["diagnostic"].is_null());assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),approved);
}
#[test]
fn generated_card_replacement_rejection_retains_approved_and_explicit_approval_supersedes() {
    let mut f=Fixture::new();let initial=f.ok("references.list",json!({}));let id=initial["document"]["cards"][0]["id"].clone();let prior=initial["document"]["cards"][0]["approvedRevisionId"].clone();let old=initial["document"]["cards"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"].clone();
    let p=f.card_prepare(id.clone());f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();f.accept_card(&r);
    let proposed=f.ok("references.list",json!({}));assert_eq!(proposed["document"]["cards"][0]["approvedRevisionId"],prior);assert_eq!(proposed["document"]["cards"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"],old);
    assert_eq!(f.review_card(&r,false)["ok"],true);assert_eq!(f.ok("references.list",json!({}))["document"]["cards"][0]["approvedRevisionId"],prior);
    let p=f.card_prepare(id);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();f.accept_card(&r);assert_eq!(f.review_card(&r,true)["ok"],true);
    let w=f.ok("references.list",json!({}));assert_eq!(w["document"]["cards"][0]["approvedRevisionId"],r["card"]["revisionId"]);assert_eq!(w["document"]["cards"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["status"],"superseded");assert_eq!(w["document"]["cards"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"],old);
}
#[test]
fn generated_card_closed_schema_bounds_malformed_and_model_approval_zero_writes() {
    for case in 0..9 {let mut f=Fixture::new();let p=f.card_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let mut reply=f.card_response(&p);
        match case {0=>reply["approved"]=json!(true),1=>reply["fields"]["status"]=json!("approved"),2=>reply["fields"]["description"]=json!("x".repeat(10001)),3=>reply["target"]["recordId"]=json!(uuid::Uuid::new_v4().to_string()),4=>reply["target"]["title"]=json!("different"),5=>reply["fields"]["aliases"]=json!(["x","x"]),6=>reply["fields"]["path"]=json!("game/script.rpy"),7=>reply["action"]=json!("generateLore"),_=>{reply["target"].as_object_mut().unwrap().remove("recordId");}};
        let before=f.snapshots();assert!(f.complete(&p,reply.to_string()).is_err(),"case {case}");assert_snapshots(&before,&f.snapshots());
    }
    let mut f=Fixture::new();let p=f.card_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let before=f.snapshots();assert!(f.complete(&p,"{\"schemaVersion\":1,\"schemaVersion\":1}".into()).is_err());assert_snapshots(&before,&f.snapshots());
}
#[test]
fn generated_card_cancel_stale_competing_draft_external_source_metadata_approval_zero_writes() {
    for case in 0..8 {let mut f=Fixture::new();let p=f.card_prepare(Value::Null);let cancel=Cancel::default();f.take(&p,cancel.clone()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();
        match case {0=>cancel.cancel(),1=>{let _=f.card_prepare(Value::Null);},2=>{let opened=f.ok("source.open",json!({"path":f.path}));f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n#draft",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));},3=>{let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# external\n");fs::write(path,bytes).unwrap();},4=>{let path=f.root.join(crate::references::PATH);let bytes=fs::read(&path).unwrap();fs::remove_file(&path).unwrap();fs::write(path,bytes).unwrap();},5=>{let o=f.ok("context.options",json!({}));f.ok("prompts.apply",json!({"action":prompts::CARD,"expectedRevision":o["cardPrompt"]["revision"],"command":{"type":"save","text":"changed"}}));},6=>{f.ok("project.close",json!({}));f.session=f.service.open_path(&f.root).unwrap().session_id;},_=>{let w=f.ok("references.list",json!({}));f.ok("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"save","kind":"card","recordId":w["document"]["cards"][0]["id"],"fields":{"description":"Competing manual save"}}}));}}
        let before=f.snapshots();assert_eq!(f.call("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}))["ok"],false,"case {case}");assert_snapshots(&before,&f.snapshots());
    }
    let mut f=Fixture::new();let p=f.card_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();f.accept_card(&r);let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# external\n");fs::write(path,bytes).unwrap();let before=f.snapshots();assert_eq!(f.review_card(&r,true)["ok"],false);assert_snapshots(&before,&f.snapshots());
}

#[test]
fn generated_card_review_regressions_preserve_extensions_refuse_manual_bypass_and_dependency_changes() {
    for dependency in ["story", "character", "variable"] {
        let mut f=Fixture::new();
        if dependency=="character" {
            let w=f.ok("scene.list",json!({}));let scene=&w["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
            f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beat["id"],"beat":{"type":"dialogue","characterId":w["authoring"]["characters"][0]["id"],"text":"Hello [flag]"}}}));
        }
        let path=f.root.join(crate::references::PATH);let mut raw:Value=serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();raw["cards"][0]["revisions"][1]["content"]["provenance"]["futureGeneratedTest"]=json!({"keep":true});raw["cards"][0]["revisions"][1]["futureRevisionTest"]=json!("kept");fs::write(path,raw.to_string()).unwrap();let library=f.ok("references.list",json!({}));let id=library["document"]["cards"][0]["id"].clone();
        let p=f.card_prepare(id);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();f.accept_card(&r);
        let w=f.ok("references.list",json!({}));let record=&w["document"]["cards"][0];let next=record["revisions"].as_array().unwrap().iter().find(|v|v["id"]==record["currentRevisionId"]).unwrap();
        assert_eq!(next["content"]["futureContent"],library["document"]["cards"][0]["revisions"][1]["content"]["futureContent"]);
        assert_eq!(next["content"]["provenance"]["futureGeneratedTest"],json!({"keep":true}));assert_eq!(next["futureRevisionTest"],"kept");
        assert_eq!(next["content"]["scope"],library["document"]["cards"][0]["revisions"][1]["content"]["scope"]);
        let before=f.snapshots();assert_eq!(f.call("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"save","kind":"card","recordId":record["id"],"fields":{"description":"bypass"}}}))["ok"],false);assert_snapshots(&before,&f.snapshots());
        if dependency=="prompt" {let o=f.ok("context.options",json!({}));f.ok("prompts.apply",json!({"action":prompts::CARD,"expectedRevision":o["cardPrompt"]["revision"],"command":{"type":"save","text":"changed after save"}}));}
        else {let w=f.ok("scene.list",json!({}));let path=if dependency=="story"{f.path.as_str()}else if dependency=="character"{w["authoring"]["characters"][0]["source"]["path"].as_str().unwrap()}else{w["authoring"]["variables"][0]["source"]["path"].as_str().unwrap()};let p=f.root.join(path);let mut bytes=fs::read(&p).unwrap();bytes.extend(b"# changed supporting source\n");fs::write(p,bytes).unwrap();}
        let before=f.snapshots();assert_eq!(f.review_card(&r,true)["ok"],false, "{dependency}");assert_snapshots(&before,&f.snapshots());let mut f=Fixture::new();let p=f.card_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.card_response(&p).to_string()).unwrap();f.accept_card(&r);assert_eq!(f.review_card(&r,true)["ok"],true);let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# changed after approval\n");fs::write(path,bytes).unwrap();let choices=f.ok("context.options",json!({}));let choice=choices["references"].as_array().unwrap().iter().find(|x|x["recordId"]==r["card"]["recordId"]).unwrap();assert_eq!(choice["eligible"],false);
    }
}

impl Fixture {
    fn lore_prepare(&mut self, record: Value) -> Value { self.lore_prepare_scope(record,None) }
    fn lore_prepare_scope(&mut self, record: Value, scope: Option<Value>) -> Value {
        let o=self.ok("context.options",json!({}));let w=self.ok("scene.list",json!({}));let s=&w["scenes"][0];
        let b=s["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").or_else(||s["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="dialogue"&&b["owner"].is_null()&&b["conditionalBranch"].is_null()&&!b["protected"].as_bool().unwrap_or(true))).unwrap();
        let store=self.service.read().unwrap();
        self.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::LORE,"loreId":record.as_str().unwrap_or(""),"loreScope":scope.unwrap_or_else(||json!({"type":"scenes","sceneIds":[s["id"]]})),"displayName":"Generated café 雪","expectedPromptRevision":o["lorePrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":s["id"],"beatId":b["id"],"expectedSourceRevision":s["sourceRevision"],"references":[],"task":"Draft one lore","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))
    }
    fn lore_response(&self,p:&Value)->Value {
        let body:Value=serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();
        let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        let target=&user["story"]["loreTarget"];
        json!({"schemaVersion":1,"action":prompts::LORE,"target":{"recordId":target["recordId"],"title":target["title"]},"fields":{"tags":["Gen"],"text":"Unescaped [str(7)] {a=jump:label} <img onerror=alert(1)> café 雪","category":"World rule","subject":"Tram","knowledgeNotes":"Author intent; runtime unknown."}})
    }
    fn accept_lore(&mut self,r:&Value){self.ok("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}));}
    fn review_lore(&mut self,r:&Value,approve:bool)->Value {
        let w=self.ok("references.list",json!({}));
        self.call("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"reviewLore","recordId":r["lore"]["recordId"],"revisionId":r["lore"]["revisionId"],"approve":approve}}))
    }
}
#[test]
fn generated_lore_exact_dispatch_passive_preview_one_transaction_approval_history_reopen() {
    let mut f=Fixture::new();let before=f.snapshots();let p=f.lore_prepare(Value::Null);
    assert_snapshots(&before,&f.snapshots());let send=f.take(&p,Cancel::default()).unwrap();assert_eq!(send.body,p["serializedPayload"].as_str().unwrap().as_bytes());assert!(f.take(&p,Cancel::default()).is_err());
    let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();assert_snapshots(&before,&f.snapshots());
    assert_eq!(r["patches"].as_array().unwrap().len(),1);assert_eq!(r["patches"][0]["path"],crate::references::PATH);
    assert_eq!(r["lore"]["status"],"proposed");assert!(r["lore"]["after"]["text"].as_str().unwrap().contains("[str(7)]"));
    f.accept_lore(&r);let saved=fs::read(f.root.join(crate::references::PATH)).unwrap();assert_eq!(saved,r["patches"][0]["after"].as_str().unwrap().as_bytes());
    let w=f.ok("references.list",json!({}));let record=w["document"]["loreEntries"].as_array().unwrap().iter().find(|c|c["id"]==r["lore"]["recordId"]).unwrap();assert!(record["approvedRevisionId"].is_null());
    assert_eq!(f.call("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}))["ok"],false);
    for(path,bytes)in before.iter().filter(|(p,_)|p.ends_with(".rpy")){assert_eq!(fs::read(f.root.join(path)).unwrap(),*bytes);}
    f.ref_history("undo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),before[crate::references::PATH]);f.ref_history("redo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),saved);
    assert_eq!(f.review_lore(&r,true)["ok"],true);let approved=fs::read(f.root.join(crate::references::PATH)).unwrap();assert_eq!(f.review_lore(&r,true)["ok"],false);
    f.ref_history("undo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),saved);f.ref_history("redo");assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),approved);
    f.ok("project.close",json!({}));f.session=f.service.open_path(&f.root).unwrap().session_id;
    let w=f.ok("references.list",json!({}));assert!(w["diagnostic"].is_null());assert_eq!(fs::read(f.root.join(crate::references::PATH)).unwrap(),approved);
}
#[test]
fn generated_lore_replacement_rejection_retains_approved_and_explicit_approval_supersedes() {
    let mut f=Fixture::new();let initial=f.ok("references.list",json!({}));let id=initial["document"]["loreEntries"][0]["id"].clone();let prior=initial["document"]["loreEntries"][0]["approvedRevisionId"].clone();let old=initial["document"]["loreEntries"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"].clone();
    let p=f.lore_prepare(id.clone());f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);
    let proposed=f.ok("references.list",json!({}));assert_eq!(proposed["document"]["loreEntries"][0]["approvedRevisionId"],prior);assert_eq!(proposed["document"]["loreEntries"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"],old);
    assert_eq!(f.review_lore(&r,false)["ok"],true);assert_eq!(f.ok("references.list",json!({}))["document"]["loreEntries"][0]["approvedRevisionId"],prior);
    let p=f.lore_prepare(id);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);assert_eq!(f.review_lore(&r,true)["ok"],true);
    let w=f.ok("references.list",json!({}));assert_eq!(w["document"]["loreEntries"][0]["approvedRevisionId"],r["lore"]["revisionId"]);assert_eq!(w["document"]["loreEntries"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["status"],"superseded");assert_eq!(w["document"]["loreEntries"][0]["revisions"].as_array().unwrap().iter().find(|v|v["id"]==prior).unwrap()["content"],old);
}
#[test]
fn generated_lore_closed_schema_bounds_malformed_and_model_approval_zero_writes() {
    for case in 0..9 {let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let mut reply=f.lore_response(&p);
        match case {0=>reply["approved"]=json!(true),1=>reply["fields"]["status"]=json!("approved"),2=>reply["fields"]["text"]=json!("x".repeat(10001)),3=>reply["target"]["recordId"]=json!(uuid::Uuid::new_v4().to_string()),4=>reply["target"]["title"]=json!("different"),5=>reply["fields"]["tags"]=json!(["x","x"]),6=>reply["fields"]["path"]=json!("game/script.rpy"),7=>reply["action"]=json!("generateCard"),_=>{reply["target"].as_object_mut().unwrap().remove("recordId");}};
        let before=f.snapshots();assert!(f.complete(&p,reply.to_string()).is_err(),"case {case}");assert_snapshots(&before,&f.snapshots());
    }
    let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let before=f.snapshots();assert!(f.complete(&p,"{\"schemaVersion\":1,\"schemaVersion\":1}".into()).is_err());assert_snapshots(&before,&f.snapshots());
}
#[test]
fn generated_lore_cancel_stale_competing_draft_external_source_metadata_approval_zero_writes() {
    for case in 0..8 {let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);let cancel=Cancel::default();f.take(&p,cancel.clone()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();
        match case {0=>cancel.cancel(),1=>{let _=f.lore_prepare(Value::Null);},2=>{let opened=f.ok("source.open",json!({"path":f.path}));f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n#draft",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));},3=>{let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# external\n");fs::write(path,bytes).unwrap();},4=>{let path=f.root.join(crate::references::PATH);let bytes=fs::read(&path).unwrap();fs::remove_file(&path).unwrap();fs::write(path,bytes).unwrap();},5=>{let o=f.ok("context.options",json!({}));f.ok("prompts.apply",json!({"action":prompts::LORE,"expectedRevision":o["lorePrompt"]["revision"],"command":{"type":"save","text":"changed"}}));},6=>{f.ok("project.close",json!({}));f.session=f.service.open_path(&f.root).unwrap().session_id;},_=>{let w=f.ok("references.list",json!({}));f.ok("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"save","kind":"lore","recordId":w["document"]["loreEntries"][0]["id"],"fields":{"text":"Competing manual save"}}}));}}
        let before=f.snapshots();assert_eq!(f.call("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"]}))["ok"],false,"case {case}");assert_snapshots(&before,&f.snapshots());
    }
    let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# external\n");fs::write(path,bytes).unwrap();let before=f.snapshots();assert_eq!(f.review_lore(&r,true)["ok"],false);assert_snapshots(&before,&f.snapshots());
}

#[test]
fn generated_lore_review_regressions_preserve_extensions_refuse_manual_bypass_and_dependency_changes() {
    for dependency in ["story", "character", "variable"] {
        let mut f=Fixture::new();
        if dependency=="character" {
            let w=f.ok("scene.list",json!({}));let scene=&w["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
            f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beat["id"],"beat":{"type":"dialogue","characterId":w["authoring"]["characters"][0]["id"],"text":"Hello [flag]"}}}));
        }
        let path=f.root.join(crate::references::PATH);let mut raw:Value=serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();raw["loreEntries"][0]["revisions"][0]["content"]["provenance"]["futureGeneratedTest"]=json!({"keep":true});raw["loreEntries"][0]["revisions"][0]["futureRevisionTest"]=json!("kept");raw["loreEntries"][0]["revisions"][0]["content"]["futureContent"]=json!({"kept":true});raw["loreEntries"][0]["revisions"][0]["content"]["links"]=json!([{"type":"character","id":"60000000-0000-4000-8000-000000000001","extension":"kept"}]);fs::write(path,raw.to_string()).unwrap();let library=f.ok("references.list",json!({}));let id=library["document"]["loreEntries"][0]["id"].clone();
        let p=f.lore_prepare(id);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);
        let w=f.ok("references.list",json!({}));let record=&w["document"]["loreEntries"][0];let next=record["revisions"].as_array().unwrap().iter().find(|v|v["id"]==record["currentRevisionId"]).unwrap();
        assert_eq!(next["content"]["futureContent"],library["document"]["loreEntries"][0]["revisions"][0]["content"]["futureContent"]);
        assert_eq!(next["content"]["provenance"]["futureGeneratedTest"],json!({"keep":true}));assert_eq!(next["futureRevisionTest"],"kept");
        assert_eq!(next["content"]["links"],library["document"]["loreEntries"][0]["revisions"][0]["content"]["links"]);assert_eq!(next["content"]["knowledge"],library["document"]["loreEntries"][0]["revisions"][0]["content"]["knowledge"]);
        let before=f.snapshots();assert_eq!(f.call("references.apply",json!({"expectedRevision":w["revision"],"command":{"type":"save","kind":"lore","recordId":record["id"],"fields":{"text":"bypass"}}}))["ok"],false);assert_snapshots(&before,&f.snapshots());
        if dependency=="prompt" {let o=f.ok("context.options",json!({}));f.ok("prompts.apply",json!({"action":prompts::LORE,"expectedRevision":o["lorePrompt"]["revision"],"command":{"type":"save","text":"changed after save"}}));}
        else {let w=f.ok("scene.list",json!({}));let path=if dependency=="story"{f.path.as_str()}else if dependency=="character"{w["authoring"]["characters"][0]["source"]["path"].as_str().unwrap()}else{w["authoring"]["variables"][0]["source"]["path"].as_str().unwrap()};let p=f.root.join(path);let mut bytes=fs::read(&p).unwrap();bytes.extend(b"# changed supporting source\n");fs::write(p,bytes).unwrap();}
        let before=f.snapshots();assert_eq!(f.review_lore(&r,true)["ok"],false, "{dependency}");assert_snapshots(&before,&f.snapshots());let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);assert_eq!(f.review_lore(&r,true)["ok"],true);let path=f.root.join(&f.path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# changed after approval\n");fs::write(path,bytes).unwrap();let choices=f.ok("context.options",json!({}));let choice=choices["references"].as_array().unwrap().iter().find(|x|x["recordId"]==r["lore"]["recordId"]).unwrap();assert_eq!(choice["eligible"],false);
    }
}

#[test]
fn generated_lore_author_scope_is_reviewed_and_model_cannot_change_it() {
    let mut f=Fixture::new();let p=f.lore_prepare(Value::Null);let body:Value=serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
    assert_eq!(user["story"]["loreTarget"]["scope"]["sceneIds"][0],user["story"]["sceneId"]);
    f.take(&p,Cancel::default()).unwrap();let response=f.lore_response(&p);let r=f.complete(&p,response.to_string()).unwrap();assert_eq!(r["lore"]["after"]["scope"],user["story"]["loreTarget"]["scope"]);
    let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let mut response=f.lore_response(&p);response["fields"]["scope"]=json!({"type":"project"});let before=f.snapshots();assert!(f.complete(&p,response.to_string()).is_err());assert_snapshots(&before,&f.snapshots());
    let mut f=Fixture::new();let path=f.root.join(crate::references::PATH);let mut raw:Value=serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();let record=&mut raw["loreEntries"][0];record["revisions"][0]["content"]["scope"]=json!({"type":"route","sceneIds":["50000000-0000-4000-8000-000000000001","50000000-0000-4000-8000-000000000001"],"futureScope":{"kept":true}});let id=record["id"].clone();fs::write(&path,raw.to_string()).unwrap();
    let p=f.lore_prepare_scope(id,Some(json!({"type":"project"})));f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();let exact:Value=serde_json::from_str(r["patches"][0]["after"].as_str().unwrap()).unwrap();let record=&exact["loreEntries"][0];let next=record["revisions"].as_array().unwrap().iter().find(|v|v["id"]==record["currentRevisionId"]).unwrap();assert_eq!(next["content"],r["lore"]["after"]);assert_eq!(next["content"]["scope"],json!({"type":"project","futureScope":{"kept":true}}));f.accept_lore(&r);assert_eq!(fs::read(path).unwrap(),r["patches"][0]["after"].as_str().unwrap().as_bytes());

}

#[test]
fn generated_lore_approved_supporting_definition_stale_blocks_inclusion_and_prompt_history() {
    let mut f=Fixture::new();let w=f.ok("scene.list",json!({}));let scene=&w["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
    f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beat["id"],"beat":{"type":"dialogue","characterId":w["authoring"]["characters"][0]["id"],"text":"Hello [flag]"}}}));
    let o=f.ok("context.options",json!({}));assert_eq!(o["lorePrompt"]["effectiveText"],prompts::LORE_BASELINE);
    let custom=f.ok("prompts.apply",json!({"action":prompts::LORE,"expectedRevision":o["lorePrompt"]["revision"],"command":{"type":"save","text":"Custom lore instruction"}}));
    f.ok("prompts.apply",json!({"action":prompts::LORE,"expectedRevision":custom["revision"],"command":{"type":"restore"}}));f.ref_history("undo");assert_eq!(f.ok("context.options",json!({}))["lorePrompt"]["effectiveText"],"Custom lore instruction");f.ref_history("redo");
    let p=f.lore_prepare(Value::Null);f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);assert_eq!(f.review_lore(&r,true)["ok"],true);
    let path=w["authoring"]["characters"][0]["source"]["path"].as_str().unwrap();assert_ne!(path,f.path);let path=f.root.join(path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# changed supporting definition\n");fs::write(&path,bytes).unwrap();
    let before=f.snapshots();let o=f.ok("context.options",json!({}));let choice=o["references"].as_array().unwrap().iter().find(|x|x["recordId"]==r["lore"]["recordId"]).unwrap();assert_eq!(choice["eligible"],false);assert_snapshots(&before,&f.snapshots());
    let ws=f.ok("scene.list",json!({}));let scene=&ws["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="dialogue"&&b["owner"].is_null()&&b["conditionalBranch"].is_null()&&!b["protected"].as_bool().unwrap_or(true)).unwrap();
    let refused=f.call("context.preview",json!({"action":prompts::LORE,"loreScope":{"type":"project"},"displayName":"Refused stale inclusion","expectedPromptRevision":o["lorePrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":scene["id"],"beatId":beat["id"],"expectedSourceRevision":scene["sourceRevision"],"references":[{"kind":"lore","recordId":r["lore"]["recordId"],"revisionId":r["lore"]["revisionId"]}],"task":"Draft","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}));assert_eq!(refused["ok"],false);assert_snapshots(&before,&f.snapshots());
}

#[test]
fn generated_lore_cited_reference_support_stale_blocks_approval_and_inclusion() {
    for approved in [false,true] {
        let mut f=Fixture::new();let w=f.ok("scene.list",json!({}));let definition_path="game/reference-support.rpy";fs::write(f.root.join(definition_path),b"# Synthetic reference support; never executed.\n").unwrap();
        let scene=&w["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
        let options=f.ok("context.options",json!({}));let preview=f.ok("context.preview",json!({"action":prompts::LORE,"displayName":"Reference token","loreScope":{"type":"project"},"expectedPromptRevision":options["lorePrompt"]["revision"],"expectedStructureRevision":options["structureRevision"],"sceneId":scene["id"],"beatId":beat["id"],"expectedSourceRevision":scene["sourceRevision"],"references":[],"task":"Reference token","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}));
        // Guard-only inventory includes this file; it is not sent or persisted as the lore entry's own support.
        let revision=preview["readSet"][definition_path].clone();assert!(revision.is_string());
        let path=f.root.join(crate::references::PATH);let mut raw:Value=serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();let record=&mut raw["cards"][0];let rid=record["approvedRevisionId"].clone();let rev=record["revisions"].as_array_mut().unwrap().iter_mut().find(|v|v["id"]==rid).unwrap();rev["supportingReadSet"]=json!({definition_path:revision});fs::write(path,raw.to_string()).unwrap();
        let o=f.ok("context.options",json!({}));
        // Rebuild with the explicit current card selection; no linked content expands.
        let store=f.service.read().unwrap();let scene=&w["scenes"][0];let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
        let selected=o["references"].as_array().unwrap().iter().find(|r|r["kind"]=="card").unwrap();let p=f.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::LORE,"loreScope":{"type":"project"},"displayName":"Cited lore","expectedPromptRevision":o["lorePrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":scene["id"],"beatId":beat["id"],"expectedSourceRevision":scene["sourceRevision"],"references":[{"kind":"card","recordId":selected["recordId"],"revisionId":selected["revisionId"]}],"task":"Draft one entry","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}));
        f.take(&p,Cancel::default()).unwrap();let r=f.complete(&p,f.lore_response(&p).to_string()).unwrap();f.accept_lore(&r);if approved { assert_eq!(f.review_lore(&r,true)["ok"],true); }
        let path=f.root.join(definition_path);let mut bytes=fs::read(&path).unwrap();bytes.extend(b"# reference support changed\n");fs::write(path,bytes).unwrap();let before=f.snapshots();
        let refs=f.ok("references.list",json!({}));assert!(refs["issues"].as_array().unwrap().iter().any(|i|i["recordId"]==r["lore"]["recordId"]&&i["field"]=="citations"));
        if approved {let options=f.ok("context.options",json!({}));assert_eq!(options["references"].as_array().unwrap().iter().find(|x|x["recordId"]==r["lore"]["recordId"]).unwrap()["eligible"],false);} else {assert_eq!(f.review_lore(&r,true)["ok"],false);assert_snapshots(&before,&f.snapshots());assert_eq!(f.review_lore(&r,false)["ok"],true);continue;}
        assert_snapshots(&before,&f.snapshots());
    }
}


#[test]
fn all_actions_private_lan_disclosure_and_configuration_change_refuse_stale_send() {
    for action in [prompts::ACTION, prompts::CONTINUE, prompts::DRAFT, prompts::CARD, prompts::LORE] {
        let mut f = Fixture::new();
        let old = f.service.read().unwrap();
        let mut store = old.clone();
        store.revision += 1;
        store.profiles[0].revision += 1;
        store.profiles[0].settings.endpoint = "http://192.168.10.20:8888/v1".into();
        store.profiles[0].settings.private_http = true;
        store.profiles[0].credential.as_mut().unwrap().origin = "http://192.168.10.20:8888".into();
        store.profiles[0].credential.as_mut().unwrap().credential_id = uuid::Uuid::new_v4().to_string();
        store.profiles[0].credential.as_mut().unwrap().revision += 1;
        f.service.write(&store, &old).unwrap();
        let configured=f.service.read().unwrap();ai_credentials::record_compatibility(&f.service,&ai_credentials::token(&configured),&configured.profiles[0].profile_id).unwrap();
        let before = f.snapshots();
        let p = match action {
            prompts::ACTION => f.prepare(),
            prompts::CONTINUE => f.continue_prepare(),
            prompts::DRAFT => f.draft_prepare(),
            prompts::CARD => f.card_prepare(Value::Null),
            _ => f.lore_prepare(Value::Null),
        };
        assert!(p["destination"]["connectionLocation"].as_str().unwrap().contains("Private LAN HTTP (unencrypted)"));
        assert_eq!(p["destination"]["inferenceLocality"], "Unknown");
        assert_snapshots(&before, &f.snapshots());
        let captured = f.take(&p, Cancel::default()).unwrap();
        assert_eq!(captured.body, p["serializedPayload"].as_str().unwrap().as_bytes());
        let prepared = crate::ai_request::prepare_reviewed(captured.profile, crate::ai_credentials::Secret::new("public".into()), captured.timeout_seconds, captured.body).unwrap();
        assert_eq!(prepared.profile.settings.endpoint, store.profiles[0].settings.endpoint);
        assert_snapshots(&before, &f.snapshots());
        let p = match action {
            prompts::ACTION => f.prepare(),
            prompts::CONTINUE => f.continue_prepare(),
            prompts::DRAFT => f.draft_prepare(),
            prompts::CARD => f.card_prepare(Value::Null),
            _ => f.lore_prepare(Value::Null),
        };
        let old = f.service.read().unwrap();
        let mut changed = old.clone();
        changed.revision += 1;
        changed.profiles[0].revision += 1;
        // Move back to an individually valid loopback profile without LAN consent.
        changed.profiles[0].settings.private_http = false;
        changed.profiles[0].settings.endpoint = "http://127.0.0.1:8888/v1".into();
        changed.profiles[0].credential.as_mut().unwrap().origin = "http://127.0.0.1:8888".into();
        changed.profiles[0].credential.as_mut().unwrap().credential_id = uuid::Uuid::new_v4().to_string();
        changed.profiles[0].credential.as_mut().unwrap().revision += 1;
        f.service.write(&changed, &old).unwrap();
        assert!(f.take(&p, Cancel::default()).is_err());
        assert_snapshots(&before, &f.snapshots());
    }
}

impl Fixture {
    fn batch_new() -> Self {
        let mut f=Self::new();
        let w=f.ok("scene.list",json!({}));let s=&w["scenes"][0];
        f.ok("scene.apply",json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":s["id"],"expectedSourceRevision":s["sourceRevision"],"beforeBeatId":s["beats"].as_array().unwrap().last().unwrap()["id"],"beat":{"type":"narration","text":"A second independent narration"}}}));
        f
    }
    fn batch_prepare(&mut self, create: bool) -> (Value, Value) {
        let o=self.ok("context.options",json!({}));
        let w=self.ok("scene.list",json!({}));let s=&w["scenes"][0];
        let targets:Vec<_>=s["beats"].as_array().unwrap().iter().filter(|b|["dialogue","narration"].contains(&b["payload"]["type"].as_str().unwrap_or("")) && b["owner"].is_null() && b["conditionalBranch"].is_null()).take(2).map(|b|b["id"].clone()).collect();
        let p=self.ok("rewrite.prepare",json!({"profileId":self.service.read().unwrap().profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&self.service.read().unwrap()),"timeoutSeconds":600,"context":{"action":batch::ACTION,"batch":{"replacementIds":targets,"insertionAnchor":s["beats"].as_array().unwrap().last().unwrap()["id"],"speakerIds":[w["authoring"]["characters"][0]["id"]],"character":if create {json!({"type":"create","technicalName":"new_speaker"})}else{json!({"type":"update","characterId":w["authoring"]["characters"][0]["id"]})}},"expectedPromptRevision":o["editPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":s["id"],"beatId":targets[0],"expectedSourceRevision":s["sourceRevision"],"references":[],"task":"Synthetic selectable edits","contextBudget":100000,"contextCeiling":100000,"maximumResponse":4096}}));
        let body:Value=serde_json::from_str(p["serializedPayload"].as_str().unwrap()).unwrap();let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        let mut ops=vec![];
        for (i,target) in user["story"]["batch"]["targets"].as_array().unwrap().iter().enumerate(){let mut segments=target["segments"].clone();segments[0]=json!({"literal":format!("Selected {i} [str(7)] café 雪 ")});ops.push(json!({"type":"replace","id":format!("text{i}"),"beatId":target["beatId"],"segments":segments}));}
        ops.push(json!({"type":"character","id":"character","displayName":"New [str(7)] café","dialogueColor":"#aabbcc"}));
        ops.push(json!({"type":"insert","id":"group","beforeBeatId":s["beats"].as_array().unwrap().last().unwrap()["id"],"beats":[{"type":"dialogue","characterId":if create {json!("proposedCharacter")}else{w["authoring"]["characters"][0]["id"].clone()},"text":"Inserted [str(7)] {b}literal{/b} 雪"},{"type":"narration","text":"Independent group line"}]}));
        (p,json!({"schemaVersion":1,"action":batch::ACTION,"sceneId":s["id"],"operations":ops}))
    }
    fn batch_review(&mut self, create: bool) -> Value { let (p,r)=self.batch_prepare(create);self.take(&p,Cancel::default()).unwrap();self.complete(&p,r.to_string()).unwrap() }
    fn select(&mut self,r:&Value,ids:Value)->Value {self.ok("rewrite.select",json!({"proposalId":r["proposalId"],"selectedIds":ids}))}
    fn accept_batch(&mut self,r:&Value)->Value {self.ok("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"],"selectedIds":r["selectedIds"]}))}
}
#[test]
fn selectable_batch_dependencies_fresh_subset_ids_and_one_history_reopen() {
    let mut f=Fixture::batch_new();let before=f.snapshots();let r=f.batch_review(true);assert_snapshots(&before,&f.snapshots());
    assert_eq!(r["valid"],true);
    let empty=f.select(&r,json!([]));assert_eq!(empty["valid"],false);assert_eq!(empty["patches"],json!([]));assert_snapshots(&before,&f.snapshots());
    let invalid=f.select(&r,json!(["group","text0"]));assert_eq!(invalid["valid"],false);assert_eq!(invalid["missingDependencies"][0]["requires"],"character");assert_eq!(invalid["patches"],json!([]));
    assert_eq!(f.call("rewrite.accept",json!({"proposalId":invalid["proposalId"],"previewDigest":invalid["previewDigest"],"selectedIds":invalid["selectedIds"]}))["ok"],false);assert_snapshots(&before,&f.snapshots());
    let partial=f.select(&r,json!(["text0"]));assert_eq!(partial["valid"],true);assert_ne!(partial["previewDigest"],r["previewDigest"]);assert_eq!(partial["patches"].as_array().unwrap().len(),2);
    assert_eq!(f.call("rewrite.accept",json!({"proposalId":r["proposalId"],"previewDigest":r["previewDigest"],"selectedIds":r["selectedIds"]}))["ok"],false);
    let all=f.select(&r,r["selectedIds"].clone());assert_eq!(all["patches"],r["patches"]);assert_eq!(all["operations"],r["operations"]);
    let ws=f.accept_batch(&all);let after=f.snapshots();
    for patch in all["patches"].as_array().unwrap(){assert_eq!(after[patch["path"].as_str().unwrap()],patch["after"].as_str().unwrap().as_bytes());}
    let ids:Vec<_>=ws["scenes"][0]["beats"].as_array().unwrap().iter().map(|b|b["id"].clone()).collect();
    for id in all["operations"].as_array().unwrap().last().unwrap()["assignedBeatIds"].as_array().unwrap(){assert!(ids.contains(id));}
    let undo=f.ok("scene.apply",json!({"expectedProjectRevision":ws["projectRevision"],"expectedSourceMapRevision":ws["sourceMapRevision"],"command":{"type":"undo"}}));assert_authoritative(&before,&f.snapshots());
    f.ok("scene.apply",json!({"expectedProjectRevision":undo["projectRevision"],"expectedSourceMapRevision":undo["sourceMapRevision"],"command":{"type":"redo"}}));assert_authoritative(&after,&f.snapshots());
    f.ok("project.close",json!({}));f.session=f.service.open_path(&f.root).unwrap().session_id;assert_authoritative(&after,&f.snapshots());
    assert_eq!(f.call("rewrite.select",json!({"proposalId":r["proposalId"],"selectedIds":r["selectedIds"]}))["ok"],false);
}
#[test]
fn selectable_batch_partial_consumes_and_preserves_character_source_and_unrelated_bytes() {
    let mut f=Fixture::batch_new();let before=f.snapshots();let r=f.batch_review(true);let partial=f.select(&r,json!(["text0"]));f.accept_batch(&partial);
    let after=f.snapshots();assert_eq!(after["game/definitions/characters.rpy"],before["game/definitions/characters.rpy"]);assert_eq!(after[".renpy-editor/authoring.json"],before[".renpy-editor/authoring.json"]);
    assert_eq!(f.call("rewrite.select",json!({"proposalId":r["proposalId"],"selectedIds":["text1"]}))["ok"],false);
    let source=String::from_utf8(after[&f.path].clone()).unwrap();assert!(source.starts_with('\u{feff}'));assert!(source.contains("opaque_neighbor = \"kept\""));assert!(source.contains("[flag] {b}friend{/b}"));
}
#[test]
fn selectable_existing_character_update_exact_preview_metadata_and_history() {
    let mut f=Fixture::batch_new();let before=f.snapshots();let r=f.batch_review(false);let r=f.select(&r,json!(["character","group","text0"]));let ws=f.accept_batch(&r);let after=f.snapshots();
    assert_ne!(before["game/definitions/characters.rpy"],after["game/definitions/characters.rpy"]);assert_eq!(ws["authoring"]["characters"][0]["technicalName"],"bec");assert_eq!(ws["authoring"]["characters"][0]["dialogueColor"],"#aabbcc");
    let undo=f.ok("scene.apply",json!({"expectedProjectRevision":ws["projectRevision"],"expectedSourceMapRevision":ws["sourceMapRevision"],"command":{"type":"undo"}}));assert_authoritative(&before,&f.snapshots());f.ok("scene.apply",json!({"expectedProjectRevision":undo["projectRevision"],"expectedSourceMapRevision":undo["sourceMapRevision"],"command":{"type":"redo"}}));assert_authoritative(&after,&f.snapshots());
    let c=&ws["authoring"]["characters"][0];assert_eq!(c["displayName"],"New [str(7)] café");assert_eq!(c["source"]["literalDisplayName"],true);assert!(c["source"]["statement"].as_str().unwrap().contains("New [[str(7)] café"));
    let manual=f.ok("character.update",json!({"id":c["id"],"expectedSourceRevision":c["source"]["sourceRevision"],"displayName":"Manual [str(9)] {b}literal{/b}","dialogueColor":"#ffffff"}));
    assert_eq!(manual["characters"][0]["source"]["literalDisplayName"],true);assert!(manual["characters"][0]["source"]["statement"].as_str().unwrap().contains("Manual [[str(9)] {{b}literal{{/b}"));f.ok("scene.list",json!({}));
}
#[test]
fn selectable_malformed_duplicates_wrong_targets_speakers_fields_and_tokens_zero_writes() {
    let mut f=Fixture::batch_new();let before=f.snapshots();
    for case in 0..10 {let(p,mut r)=f.batch_prepare(true);f.take(&p,Cancel::default()).unwrap();match case {
        0=>r["sceneId"]=json!("wrong"),1=>r["operations"][1]["id"]=r["operations"][0]["id"].clone(),2=>r["operations"][1]["beatId"]=r["operations"][0]["beatId"].clone(),3=>r["operations"][0]["beatId"]=json!("unselected"),4=>r["operations"][3]["beats"][0]["characterId"]=json!("unselected"),5=>r["operations"][2]["dialogueColor"]=json!("python"),6=>r["operations"][0]["segments"]=json!([{"literal":"removed tokens"}]),7=>{r["operations"].as_array_mut().unwrap().remove(2);},8=>r["operations"][2]["technicalName"]=json!("renamed"),_=>r["operations"][3]["beforeBeatId"]=json!("wrong"),};assert!(f.complete(&p,r.to_string()).is_err(),"case {case}");assert_snapshots(&before,&f.snapshots());}
}
#[test]
fn selectable_aggregate_utf8_boundary_and_stale_selection_no_write() {
    let mut f=Fixture::batch_new();let before=f.snapshots();
    for extra in [0,1] {let(p,mut r)=f.batch_prepare(true);let text=r["operations"][0].clone();r["operations"]=json!([text,{"type":"character","id":"character","displayName":"Name","dialogueColor":"#ffffff"},{"type":"insert","id":"group","beforeBeatId":r["operations"][3]["beforeBeatId"],"beats":[{"type":"narration","text":"x"}]}]);
        let other=r["operations"][0]["segments"].as_array().unwrap().iter().filter_map(|s|s["literal"].as_str()).map(str::len).sum::<usize>()+4+7;
        r["operations"][2]["beats"][0]["text"]=json!("x".repeat(10000-other+extra));f.take(&p,Cancel::default()).unwrap();let result=f.complete(&p,r.to_string());
        // Protected source bytes count toward each field's encoded safety limit as well.
        if extra==1 { assert!(result.is_err()); }
        else { assert!(result.is_ok(),"{result:?}"); }
        assert_snapshots(&before,&f.snapshots());
    }
    let r=f.batch_review(true);let source=fs::read(f.root.join(&f.path)).unwrap();fs::write(f.root.join(&f.path),[source,b"# external\n".to_vec()].concat()).unwrap();let stale=f.snapshots();assert_eq!(f.call("rewrite.select",json!({"proposalId":r["proposalId"],"selectedIds":["text0"]}))["ok"],false);assert_snapshots(&stale,&f.snapshots());
}

fn assert_authoritative(before:&BTreeMap<String,Vec<u8>>,after:&BTreeMap<String,Vec<u8>>) {
    let files=|s:&BTreeMap<String,Vec<u8>>|s.iter().filter(|(p,_)|!p.starts_with(".renpy-editor/recovery/")).map(|(p,b)|(p.clone(),b.clone())).collect::<BTreeMap<_,_>>();
    assert_eq!(files(before),files(after));
}
#[test]
fn selectable_character_create_refuses_unowned_declarations_and_custom_reinterpretation_before_send() {
    for custom in ["\u{feff}define new_speaker = Character(\"Custom\")\n","define -10 new_speaker = Character(\"Custom\")\n","define new_speaker = Character(\"Custom\")\n","init python:\n    define new_speaker = Character(\"Custom\")\n"] {
        let mut f=Fixture::batch_new();fs::write(f.root.join("game/custom.rpy"),custom).unwrap();
        let o=f.ok("context.options",json!({}));let ws=f.ok("scene.list",json!({}));let s=&ws["scenes"][0];let before=f.snapshots();let store=f.service.read().unwrap();
        assert_eq!(f.call("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":batch::ACTION,"batch":{"replacementIds":[],"insertionAnchor":null,"speakerIds":[],"character":{"type":"create","technicalName":"new_speaker"}},"expectedPromptRevision":o["editPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":s["id"],"beatId":s["beats"][0]["id"],"expectedSourceRevision":s["sourceRevision"],"references":[],"task":"Character only","contextBudget":100000,"contextCeiling":100000,"maximumResponse":4096}}))["ok"],false);assert_snapshots(&before,&f.snapshots());
    }
    let mut f=Fixture::batch_new();let opened=f.ok("source.open",json!({"path":f.path,"expectedRevision":null,"selectionStart":null,"selectionEnd":null,"byteStart":null,"byteEnd":null}));let text=opened["text"].as_str().unwrap().replace("    return","    new_speaker \"existing opaque dialogue\"\n    return");let draft=f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":text,"selectionStart":0,"selectionEnd":0}));f.ok("source.save",json!({"path":f.path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
    let o=f.ok("context.options",json!({}));let ws=f.ok("scene.list",json!({}));let s=&ws["scenes"][0];let before=f.snapshots();let store=f.service.read().unwrap();
    assert_eq!(f.call("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":batch::ACTION,"batch":{"replacementIds":[],"insertionAnchor":null,"speakerIds":[],"character":{"type":"create","technicalName":"new_speaker"}},"expectedPromptRevision":o["editPrompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"sceneId":s["id"],"beatId":s["beats"][0]["id"],"expectedSourceRevision":s["sourceRevision"],"references":[],"task":"Character only","contextBudget":100000,"contextCeiling":100000,"maximumResponse":4096}}))["ok"],false);assert_snapshots(&before,&f.snapshots());
}
#[test]
fn selectable_cancel_stale_prompt_profile_reference_and_competing_draft_refuse() {
    for cause in 0..5 {
        let mut f=Fixture::batch_new();let(p,r)=f.batch_prepare(true);let cancel=Cancel::default();f.take(&p,cancel.clone()).unwrap();let review=f.complete(&p,r.to_string()).unwrap();
        match cause {
            0=>cancel.cancel(),
            1=>{let prompt=f.ok("prompts.list",json!({}));f.ok("prompts.apply",json!({"expectedRevision":prompt["revision"],"action":"editScene","command":{"type":"save","text":"Changed batch prompt"}}));},
            2=>{let store=f.service.read().unwrap();let mut next=store.clone();next.revision+=1;next.profiles[0].revision+=1;f.service.write(&next,&store).unwrap();},
            3=>{let mut doc:Value=serde_json::from_slice(&fs::read(f.root.join(crate::references::PATH)).unwrap()).unwrap();doc["futureNotes"]=json!("external");fs::write(f.root.join(crate::references::PATH),serde_json::to_vec(&doc).unwrap()).unwrap();},
            _=>{let source=f.ok("source.open",json!({"path":f.path,"expectedRevision":null,"selectionStart":null,"selectionEnd":null,"byteStart":null,"byteEnd":null}));f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":source["baseRevision"],"text":format!("{}\n# competing",source["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}));},
        }
        let before=f.snapshots();assert_eq!(f.call("rewrite.select",json!({"proposalId":review["proposalId"],"selectedIds":["text0"]}))["ok"],false);assert_eq!(f.call("rewrite.accept",json!({"proposalId":review["proposalId"],"previewDigest":review["previewDigest"],"selectedIds":review["selectedIds"]}))["ok"],false);assert_snapshots(&before,&f.snapshots());
    }
}
#[test]
fn selectable_compound_candidate_ordinary_fault_recovers_without_false_success() {
    use crate::transaction::{CommitOutcome,ErrorCode,FaultInjector,FaultPoint,FileMutation,MutationKind,TransactionService,TransactionIntent};
    struct Fail(usize);impl FaultInjector for Fail {fn visit(&mut self,p:FaultPoint,_:&Path)->Result<(),ErrorCode>{if p==FaultPoint::AfterExchange(self.0){Err(ErrorCode::RecoveryRequired)}else{Ok(())}}}
    for index in [0,3] {
    let mut f=Fixture::batch_new();let before=f.snapshots();let review=f.batch_review(true);let tx=TransactionService::default();let project=tx.register_trusted_project(&fs::canonicalize(&f.root).unwrap()).unwrap();
    let mutations=review["patches"].as_array().unwrap().iter().map(|patch|{let path=RelativePath::new(patch["path"].as_str().unwrap()).unwrap();let(bytes,base)=tx.snapshot(&project,path.clone()).unwrap();assert_eq!(bytes,patch["before"].as_str().unwrap().as_bytes());FileMutation{path,base,expected_bytes:bytes,proposed:patch["after"].as_str().unwrap().as_bytes().to_vec(),kind:MutationKind::ReplaceExisting}}).collect();
    let outcome=tx.commit_with_injector(&project,TransactionProposal{mutations,intent:TransactionIntent::Edit},&mut Fail(index));
    let txid=match outcome {CommitOutcome::RecoveryRequired{diagnostic}=>diagnostic.transaction_id.unwrap(),other=>panic!("{other:?}")};
    let _recovery=tx.recover(&project);assert!(tx.has_blocking_recovery(&project).unwrap());
    assert_eq!(f.call("rewrite.accept",json!({"proposalId":review["proposalId"],"previewDigest":review["previewDigest"],"selectedIds":review["selectedIds"]}))["ok"],false);
    if index==0 {
        // A partially exchanged compound proposal stays blocked for recovery;
        // neither a duplicate Save nor an unsupported resolution reports success.
        assert!(tx.resolve_recovery(&project,&txid,crate::transaction::RecoveryResolution::AcceptLoomlight).is_err());
        assert!(tx.has_blocking_recovery(&project).unwrap());continue;
    }
    tx.resolve_recovery(&project,&txid,crate::transaction::RecoveryResolution::AcceptLoomlight).unwrap();
    assert!(!tx.has_blocking_recovery(&project).unwrap());
    for patch in review["patches"].as_array().unwrap(){assert_eq!(fs::read(f.root.join(patch["path"].as_str().unwrap())).unwrap(),patch["after"].as_str().unwrap().as_bytes());}
    assert_ne!(before[&f.path],fs::read(f.root.join(&f.path)).unwrap());
    }
}

#[test]
fn sampling_all_actions_exact_body_persisted_defaults_and_change_invalidates_review() {
    for action in [prompts::ACTION,prompts::CONTINUE,prompts::DRAFT,prompts::CARD,prompts::LORE,batch::ACTION] {
        let mut f=if action==batch::ACTION {Fixture::batch_new()}else{Fixture::new()};
        let prepare=|f:&mut Fixture|match action {
            prompts::ACTION=>f.prepare(),prompts::CONTINUE=>f.continue_prepare(),prompts::DRAFT=>f.draft_prepare(),
            prompts::CARD=>f.card_prepare(Value::Null),prompts::LORE=>f.lore_prepare(Value::Null),_=>f.batch_prepare(true).0,
        };
        let before=f.snapshots();
        let reviewed=prepare(&mut f);
        let body:Value=serde_json::from_str(reviewed["serializedPayload"].as_str().unwrap()).unwrap();
        assert_eq!(body["temperature"],1.0);assert_eq!(body["top_p"],0.95);
        let original=f.service.read().unwrap();let credential=original.profiles[0].credential.clone();
        let mut settings=original.profiles[0].settings.clone();settings.temperature=Some(0.8);settings.top_p=Some(0.9);
        ai_credentials::save(&f.service,&ai_credentials::token(&original),Some(&original.profiles[0].profile_id),settings).unwrap();
        let saved=f.service.read().unwrap();assert_eq!(saved.profiles[0].credential,credential);
        assert_eq!(saved.profiles[0].settings.temperature(),0.8);assert_eq!(saved.profiles[0].settings.top_p(),0.9);
        assert!(f.take(&reviewed,Cancel::default()).is_err());assert_snapshots(&before,&f.snapshots());
        ai_credentials::record_compatibility(&f.service,&ai_credentials::token(&saved),&saved.profiles[0].profile_id).unwrap();
        let saved=f.service.read().unwrap();
        let fresh=prepare(&mut f);let capture=f.take(&fresh,Cancel::default()).unwrap();
        let body:Value=serde_json::from_slice(&capture.body).unwrap();assert_eq!(body["temperature"],0.8);assert_eq!(body["top_p"],0.9);
        assert_eq!(capture.body,fresh["serializedPayload"].as_str().unwrap().as_bytes());
        let mut invalid=saved.profiles[0].settings.clone();invalid.top_p=Some(1.01);
        assert!(ai_credentials::save(&f.service,&ai_credentials::token(&saved),Some(&saved.profiles[0].profile_id),invalid).is_err());
        assert_eq!(f.service.read().unwrap(),saved);assert_snapshots(&before,&f.snapshots());
    }
}

#[test]
fn compatibility_untested_profile_refuses_preparation_without_writes() {
    let mut f=Fixture::new();let store=f.service.read().unwrap();
    ai_credentials::clear_compatibility(&f.service,&ai_credentials::token(&store),&store.profiles[0].profile_id).unwrap();
    let before=f.snapshots();
    let o=f.ok("context.options",json!({}));let w=f.ok("scene.list",json!({}));let scene=&w["scenes"][0];
    let beat=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["type"]=="narration").unwrap();
    let store=f.service.read().unwrap();
    let result=f.call("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":60,"context":{"expectedPromptRevision":o["prompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"expectedSourceRevision":scene["sourceRevision"],"sceneId":scene["id"],"beatId":beat["id"],"references":[],"task":"Synthetic rewrite","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}));assert_eq!(result["ok"],false);assert_snapshots(&before,&f.snapshots());
}

#[test]
fn phase3a_new_nested_targets_do_not_expand_ai_allowlist() {
    let mut f = Fixture::new();
    let w = f.ok("scene.list", json!({}));
    let scene = &w["scenes"][0];
    let source = format!("label {}:\n    if flag:\n        if flag == True:\n            bec \"Nested scope remains excluded\"\n        else:\n            bec \"Alternative\"\n    return\n", scene["technicalLabel"].as_str().unwrap());
    let opened = f.ok("source.open", json!({"path":f.path}));
    let draft = f.ok("source.updateDraft", json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}));
    f.ok("source.save", json!({"path":f.path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
    let options = f.ok("context.options", json!({}));
    let w = f.ok("scene.list", json!({}));
    let scene = &w["scenes"][0];
    let beat = scene["beats"].as_array().unwrap().iter().find(|b| b["payload"]["text"] == "Nested scope remains excluded").unwrap();
    assert!(beat["owner"].is_object());
    let before = f.snapshots();
    let store = f.service.read().unwrap();
    assert_eq!(f.call("rewrite.prepare", json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"action":prompts::ACTION,"expectedPromptRevision":options["prompt"]["revision"],"expectedStructureRevision":options["structureRevision"],"expectedSourceRevision":scene["sourceRevision"],"sceneId":scene["id"],"beatId":beat["id"],"references":[],"task":"Rejected nested target","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))["ok"], false);
    assert_snapshots(&before, &f.snapshots());
}
#[test]
fn phase3a_logic_context_and_generated_fields_keep_ai_allowlist_closed() {
    for extra in [
        json!({"type":"call","sceneId":"unsupported","returnLabel":null}),
        json!({"type":"narration","text":"No new field authority","condition":{"status":"supported","expression":{"type":"bool","value":true}}}),
    ] {
        let mut f = Fixture::new();
        let w = f.ok("scene.list", json!({}));
        let scene = &w["scenes"][0];
        let source=format!("label {}:\n    call {} from frozen_call\n    menu:\n        \"Conditional\" if flag:\n            jump {}\n    \"Ordinary root one\"\n    \"Ordinary root two\"\n    return\n",scene["technicalLabel"].as_str().unwrap(),scene["technicalLabel"].as_str().unwrap(),scene["technicalLabel"].as_str().unwrap());
        let opened = f.ok("source.open", json!({"path":f.path}));
        let draft=f.ok("source.updateDraft",json!({"path":f.path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}));
        f.ok("source.save",json!({"path":f.path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
        let before = f.snapshots();
        let prepared = f.continue_prepare();
        let body: Value =
            serde_json::from_str(prepared["serializedPayload"].as_str().unwrap()).unwrap();
        let user: Value =
            serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
        assert_eq!(
            user["story"]["sceneBeats"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|b| b["excluded"].is_string())
                .count(),
            2
        );
        assert!(!user["story"]["sceneBeats"]
            .as_array()
            .unwrap()
            .iter()
            .any(
                |b| b["payload"]["type"] == "call" || b["payload"]["options"].as_array().is_some()
            ));
        f.take(&prepared, Cancel::default()).unwrap();
        let mut response = f.continue_response(&prepared);
        response["beats"] = json!([extra]);
        assert!(f.complete(&prepared, response.to_string()).is_err());
        assert_snapshots(&before, &f.snapshots());
    }
}

#[test]
fn shared_project_context_exact_send_include_omit_and_changed_notes_refuse_without_writes() {
    let mut f=Fixture::new();
    let baseline=f.ok("references.list",json!({}));
    let saved=f.ok("references.apply",json!({"expectedRevision":baseline["revision"],"command":{"type":"saveProjectContext","world":"World café 雪\r\n  exact  ","tone":"Patient and intimate."}}));
    assert_eq!(saved["document"]["cards"],baseline["document"]["cards"]);assert_eq!(saved["document"]["loreEntries"],baseline["document"]["loreEntries"]);
    let before=f.snapshots();
    let included=f.prepare();
    assert_eq!(included["context"]["projectContext"]["included"],true);
    let body:Value=serde_json::from_str(included["serializedPayload"].as_str().unwrap()).unwrap();let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();
    assert_eq!(user["projectContext"],json!({"recordId":saved["document"]["projectContext"]["id"],"revisionId":saved["document"]["projectContext"]["currentRevisionId"],"world":"World café 雪\r\n  exact  ","tone":"Patient and intimate."}));
    let cancel=Cancel::default();let capture=f.take(&included,cancel.clone()).unwrap();assert_eq!(capture.body,included["serializedPayload"].as_str().unwrap().as_bytes());cancel.cancel();f.ok("rewrite.discard",json!({}));assert_snapshots(&before,&f.snapshots());
    let omitted=f.prepare_with_project_context(Some(false));assert_eq!(omitted["context"]["projectContext"]["included"],false);
    let body:Value=serde_json::from_str(omitted["serializedPayload"].as_str().unwrap()).unwrap();let user:Value=serde_json::from_str(body["messages"][1]["content"].as_str().unwrap()).unwrap();assert!(user.get("projectContext").is_none());assert!(!omitted["serializedPayload"].as_str().unwrap().contains("Patient and intimate."));
    let cancel=Cancel::default();let capture=f.take(&omitted,cancel.clone()).unwrap();assert_eq!(capture.body,omitted["serializedPayload"].as_str().unwrap().as_bytes());cancel.cancel();f.ok("rewrite.discard",json!({}));assert_snapshots(&before,&f.snapshots());
    let pending=f.prepare();
    let latest=f.ok("references.list",json!({}));f.ok("references.apply",json!({"expectedRevision":latest["revision"],"command":{"type":"saveProjectContext","world":"Changed world","tone":"Patient and intimate."}}));
    let after_save=f.snapshots();assert!(f.take(&pending,Cancel::default()).is_err());assert_snapshots(&after_save,&f.snapshots());
    assert_eq!(after_save[&f.path],before[&f.path]);
}
