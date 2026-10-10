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
            },
        )
        .unwrap();
        let old = service.read().unwrap();
        let mut store = old.clone();
        store.revision += 1;
        store.profiles[0].revision += 1;
        store.profiles[0].credential=Some(serde_json::from_value(json!({"credentialId":uuid::Uuid::new_v4().to_string(),"revision":1,"origin":"http://127.0.0.1:8765"})).unwrap());
        service.write(&store, &old).unwrap();
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
    fn prepare(&mut self) -> Value {
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
        self.ok("rewrite.prepare",json!({"profileId":store.profiles[0].profile_id,"expectedProfileToken":ai_credentials::token(&store),"timeoutSeconds":600,"context":{"expectedPromptRevision":o["prompt"]["revision"],"expectedStructureRevision":o["structureRevision"],"expectedSourceRevision":scene["sourceRevision"],"sceneId":scene["id"],"beatId":b["id"],"references":refs,"task":"Rewrite café 雪","contextBudget":32768,"contextCeiling":32768,"maximumResponse":1024}}))
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
                        p.strip_prefix(base).unwrap().to_str().unwrap().into(),
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
