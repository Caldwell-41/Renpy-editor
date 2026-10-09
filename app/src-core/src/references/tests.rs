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
    fn request(&mut self, operation: &str, mut payload: Value) -> Value {
        payload["sessionId"] = json!(self.session);
        serde_json::to_value(handle_application_request(json!({"protocolVersion":1,"requestId":uuid::Uuid::new_v4().simple().to_string(),"operation":operation,"payload":payload}),false,&mut self.service)).unwrap()
    }
    fn list(&mut self) -> Value {
        let r = self.request("references.list", json!({}));
        assert_eq!(r["ok"], true, "{r}");
        r["value"].clone()
    }
    fn apply(&mut self, revision: &Value, command: Value) -> Value {
        self.request(
            "references.apply",
            json!({"expectedRevision":revision,"command":command}),
        )
    }
    fn install(&self, bytes: &[u8]) {
        fs::write(self.root.join(PATH), bytes).unwrap();
    }
    fn fixture(&self) -> Value {
        let mut v: Value = serde_json::from_str(include_str!(
            "../../../tests/fixtures/reference-library/replacement.json"
        ))
        .unwrap();
        v["projectId"] = json!(self.project);
        v
    }
}
fn fields(kind: Kind) -> Value {
    let v: Value = serde_json::from_str(include_str!(
        "../../../tests/fixtures/reference-library/replacement.json"
    ))
    .unwrap();
    let c = &v[kind.collection()][0]["revisions"][0]["content"];
    let mut m = Map::new();
    for k in COMMON
        .iter()
        .chain(if kind == Kind::Card { CARD } else { LORE })
    {
        m.insert((*k).into(), c[*k].clone());
    }
    Value::Object(m)
}
fn current(doc: &Value, kind: Kind) -> &Value {
    let r = &doc[kind.collection()][0];
    r["revisions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == r["currentRevisionId"])
        .unwrap()
}

#[test]
fn real_dispatch_manual_save_history_and_reopen_preserve_exact_revisions() {
    let mut f = Fixture::new();
    let initial = f.list();
    assert_eq!(initial["document"]["cards"], json!([]));
    assert!(!f.root.join(PATH).exists());
    let sources = fs::read(f.root.join("game/script.rpy")).unwrap();
    let a = f.apply(
        &initial["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
    );
    assert_eq!(a["ok"], true, "{a}");
    let first = fs::read(f.root.join(PATH)).unwrap();
    let id = a["value"]["document"]["cards"][0]["id"].clone();
    let mut changed = fields(Kind::Card);
    changed["description"] = json!("Exact café 雪\r\n\n  trailing  ");
    let b = f.apply(
        &a["value"]["revision"],
        json!({"type":"save","kind":"card","recordId":id,"fields":changed}),
    );
    assert_eq!(b["ok"], true, "{b}");
    let second = fs::read(f.root.join(PATH)).unwrap();
    let doc = &b["value"]["document"];
    assert_eq!(
        current(doc, Kind::Card)["content"]["description"],
        changed["description"]
    );
    assert_eq!(current(doc, Kind::Card)["status"], "approved");
    assert_eq!(doc["cards"][0]["revisions"][0]["status"], "superseded");
    let undo = f.apply(&b["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), first);
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), second);
    f.service.close().unwrap();
    let p = f.service.open_path(&f.root).unwrap();
    f.session = p.session_id;
    assert_eq!(f.list()["document"], *doc);
    assert_eq!(
        fs::read(f.root.join("game/script.rpy")).unwrap(),
        sources
    );
}
#[test]
fn proposals_extensions_and_missing_links_survive_manual_replacement() {
    let mut f = Fixture::new();
    let v = f.fixture();
    validate(&v, &f.project).unwrap();
    f.install(&serde_json::to_vec_pretty(&v).unwrap());
    let before = f.list();
    assert!(!before["issues"].as_array().unwrap().is_empty());
    let mut patch = Map::new();
    patch.insert("personality".into(), json!("Manually updated."));
    let r = f.apply(
        &before["revision"],
        json!({"type":"save","kind":"card","recordId":v["cards"][0]["id"],"fields":patch}),
    );
    assert_eq!(r["ok"], true, "{r}");
    let doc = &r["value"]["document"];
    assert_eq!(doc["futureLibrary"], v["futureLibrary"]);
    assert_eq!(
        doc["cards"][0]["futureRecord"],
        v["cards"][0]["futureRecord"]
    );
    let c = current(doc, Kind::Card);
    assert_eq!(
        c["futureRevision"],
        v["cards"][0]["revisions"][1]["futureRevision"]
    );
    assert_eq!(
        c["content"]["futureContent"],
        v["cards"][0]["revisions"][1]["content"]["futureContent"]
    );
    assert_eq!(c["content"]["links"][0]["futureLink"], "retain missing");
    assert_eq!(doc["loreEntries"], v["loreEntries"]);
    assert_eq!(
        doc["cards"][0]["revisions"][0]["content"],
        v["cards"][0]["revisions"][0]["content"]
    );
    for _ in 0..4 {
        let current = f.list();
        let r=f.apply(&current["revision"],json!({"type":"save","kind":"card","recordId":v["cards"][0]["id"],"fields":{"description":uuid::Uuid::new_v4().to_string()}}));
        assert_eq!(r["ok"], true, "{r}");
        assert!(
            r["value"]["document"]["cards"][0]["revisions"]
                .as_array()
                .unwrap()
                .len()
                <= 3
        );
    }
}
#[test]
fn malformed_newer_wrong_project_duplicate_and_oversized_files_are_retained() {
    let mut f = Fixture::new();
    let valid = f.fixture();
    let mut cases = vec![
        include_bytes!("../../../tests/fixtures/reference-library/malformed.json").to_vec(),
        include_bytes!("../../../tests/fixtures/reference-library/newer.json").to_vec(),
        br#"{"schemaVersion":1,"schemaVersion":1}"#.to_vec(),
    ];
    let mut wrong = valid.clone();
    wrong["projectId"] = json!(uuid::Uuid::new_v4().to_string());
    cases.push(serde_json::to_vec(&wrong).unwrap());
    let mut missing = valid.clone();
    missing["cards"][0]
        .as_object_mut()
        .unwrap()
        .remove("approvedRevisionId");
    cases.push(serde_json::to_vec(&missing).unwrap());
    cases.push(vec![b' '; MAX_BYTES + 1]);
    for bytes in cases {
        f.install(&bytes);
        let listed = f.request("references.list", json!({}));
        if listed["ok"] == true {
            assert!(listed["value"]["diagnostic"].is_string());
            assert!(listed["value"]["document"].is_null());
        }
        let r = f.apply(
            &listed["value"]["revision"],
            json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
        );
        assert_eq!(r["ok"], false);
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), bytes);
        let diagnostic = serde_json::to_string(&r).unwrap();
        assert!(!diagnostic.contains("futureLibrary"));
    }
}
#[test]
fn utf8_record_file_array_counter_and_pointer_bounds_reject_without_writes() {
    let mut f = Fixture::new();
    let initial = f.list();
    let mut good = fields(Kind::Card);
    good["title"] = json!("雪".repeat(53) + "a");
    good["description"] = json!("x".repeat(10_000));
    let r = f.apply(
        &initial["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":good}),
    );
    assert_eq!(r["ok"], true, "{r}");
    let baseline = fs::read(f.root.join(PATH)).unwrap();
    let id = r["value"]["document"]["cards"][0]["id"].clone();
    for patch in [
        json!({"title":"雪".repeat(54)}),
        json!({"description":"x".repeat(10001)}),
        json!({"aliases":(0..33).map(|i|format!("Alias {i}")).collect::<Vec<_>>()}),
        json!({"scope":{"type":"route","sceneIds":vec![uuid::Uuid::new_v4().to_string();257]}}),
        json!({"status":"approved"}),
    ] {
        let refused = f.apply(
            &r["value"]["revision"],
            json!({"type":"save","kind":"card","recordId":id,"fields":patch}),
        );
        assert_eq!(refused["ok"], false);
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), baseline);
    }
    for bad in ["pointer", "counter", "records", "file", "depth"] {
        let mut doc = f.fixture();
        match bad {
            "pointer" => {
                doc["cards"][0]["approvedRevisionId"] = json!(uuid::Uuid::new_v4().to_string())
            }
            "counter" => doc["cards"][0]["revisionCounter"] = json!(MAX_COUNTER + 1),
            "records" => doc["cards"] = json!(vec![doc["cards"][0].clone(); 513]),
            "file" => doc["futureLibrary"] = json!("x".repeat(MAX_BYTES)),
            _ => {
                let mut d = json!(0);
                for _ in 0..33 {
                    d = json!({"nested":d});
                }
                doc["futureLibrary"] = d;
            }
        }
        assert!(validate(&doc, &f.project).is_err(), "{bad}");
    }
}
#[test]
fn external_edits_refuse_stale_save_and_history_without_overwrite() {
    let mut f = Fixture::new();
    let initial = f.list();
    let r = f.apply(
        &initial["revision"],
        json!({"type":"save","kind":"lore","recordId":null,"fields":fields(Kind::Lore)}),
    );
    assert_eq!(r["ok"], true, "{r}");
    let mut external = r["value"]["document"].clone();
    external["externalExtension"] = json!("Retained");
    let bytes = serde_json::to_vec_pretty(&external).unwrap();
    f.install(&bytes);
    let stale=f.apply(&r["value"]["revision"],json!({"type":"save","kind":"lore","recordId":external["loreEntries"][0]["id"],"fields":{"text":"Must not write"}}));
    assert_eq!(stale["error"]["code"], "REFERENCE_CONFLICT");
    let fresh = f.list();
    let undo = f.apply(&fresh["revision"], json!({"type":"undo"}));
    assert_eq!(undo["error"]["code"], "HISTORY_BOUNDARY");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), bytes);
}
#[test]
fn stale_citations_are_reported_and_manual_save_does_not_reconfirm_them() {
    let mut f = Fixture::new();
    let scene = f.service.scene_workspace().unwrap().scenes.remove(0);
    let mut v = f.fixture();
    v["loreEntries"][0]["revisions"][0]["content"]["citations"][0]["target"]["id"] =
        json!(scene.id);
    f.install(&serde_json::to_vec(&v).unwrap());
    let list = f.list();
    assert!(list["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|i| i["state"] == "stale"));
    let r=f.apply(&list["revision"],json!({"type":"save","kind":"lore","recordId":v["loreEntries"][0]["id"],"fields":{"text":"Author intent, saved without changing its captured evidence."}}));
    assert_eq!(r["ok"], true, "{r}");
    assert_eq!(
        current(&r["value"]["document"], Kind::Lore)["content"]["citations"],
        v["loreEntries"][0]["revisions"][0]["content"]["citations"]
    );
    assert!(r["value"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|i| i["state"] == "stale"));
}
#[test]
fn stale_project_session_and_wrong_commands_do_not_write() {
    let mut f = Fixture::new();
    let list = f.list();
    let old = f.session.clone();
    f.service.close().unwrap();
    let p = f.service.open_path(&f.root).unwrap();
    let r=f.request("references.apply",json!({"expectedRevision":list["revision"],"command":{"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}}));
    assert_eq!(r["error"]["code"], "STALE_PROJECT_SESSION");
    assert!(!f.root.join(PATH).exists());
    f.session = p.session_id;
    assert_ne!(old, f.session);
    let r=f.apply(&list["revision"],json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card),"unexpected":true}));
    assert_eq!(r["ok"], false);
    assert!(!f.root.join(PATH).exists());
}

#[test]
fn nested_array_removal_keeps_extensions_on_their_original_items() {
    let mut f = Fixture::new();
    let mut v = f.fixture();
    let content = &mut v["cards"][0]["revisions"][1]["content"];
    content["links"] = json!([{ "type":"lore","id":uuid::Uuid::new_v4().to_string(),"extension":{"owner":"first"}},{"type":"lore","id":uuid::Uuid::new_v4().to_string(),"extension":{"owner":"second"}}]);
    f.install(&serde_json::to_vec(&v).unwrap());
    let listed = f.list();
    let retained = v["cards"][0]["revisions"][1]["content"]["links"][1].clone();
    let saved=f.apply(&listed["revision"],json!({"type":"save","kind":"card","recordId":v["cards"][0]["id"],"fields":{"links":[retained],"scope":{"type":"project"}}}));
    assert_eq!(saved["ok"], true, "{saved}");
    let c = &current(&saved["value"]["document"], Kind::Card)["content"];
    assert_eq!(c["links"], json!([retained]));
    assert!(c["scope"].get("sceneIds").is_none());
    assert_eq!(
        c["scope"]["futureScope"],
        v["cards"][0]["revisions"][1]["content"]["scope"]["futureScope"]
    );
}
#[test]
fn reorder_and_source_changes_share_history_and_other_projects_stay_isolated() {
    let mut f = Fixture::new();
    let initial = f.list();
    let a = f.apply(
        &initial["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
    );
    assert_eq!(a["ok"], true);
    let b = f.apply(
        &a["value"]["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
    );
    assert_eq!(b["ok"], true);
    let original = fs::read(f.root.join(PATH)).unwrap();
    let moved=f.apply(&b["value"]["revision"],json!({"type":"move","kind":"card","recordId":b["value"]["document"]["cards"][1]["id"],"direction":"up"}));
    assert_eq!(moved["ok"], true);
    assert_eq!(
        moved["value"]["document"]["cards"][0],
        b["value"]["document"]["cards"][1]
    );
    let undo = f.apply(&moved["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), original);
    let opened = f.request(
        "source.open",
        json!({"path":"game/script.rpy"}),
    );
    assert_eq!(opened["ok"], true);
    let text = opened["value"]["text"].as_str().unwrap().to_string();
    let draft=f.request("source.updateDraft",json!({"path":"game/script.rpy","expectedBaseRevision":opened["value"]["baseRevision"],"text":format!("{text}# reference shared history fixture\n"),"selectionStart":0,"selectionEnd":0}));
    assert_eq!(draft["ok"], true, "{draft}");
    let saved=f.request("source.save",json!({"path":"game/script.rpy","expectedBaseRevision":opened["value"]["baseRevision"],"expectedDraftVersion":draft["value"]["draftVersion"]}));
    assert_eq!(saved["ok"], true, "{saved}");
    let latest = f.list();
    let undo = f.apply(&latest["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), original);
    assert_eq!(
        fs::read_to_string(f.root.join("game/script.rpy")).unwrap(),
        text
    );
    let other = Fixture::new();
    f.service.close().unwrap();
    let p = f.service.open_path(&other.root).unwrap();
    let stale = f.request("references.list", json!({}));
    assert_eq!(stale["error"]["code"], "STALE_PROJECT_SESSION");
    f.session = p.session_id;
    assert_eq!(f.list()["document"]["cards"], json!([]));
    assert!(!other.root.join(PATH).exists());
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), original);
}

#[test]
fn prepared_recovery_blocks_reference_save_without_losing_the_library() {
    use crate::transaction::{
        CommitOutcome, ErrorCode, FaultInjector, FaultPoint, TransactionService,
    };
    struct Prepared;
    impl FaultInjector for Prepared {
        fn visit(&mut self, point: FaultPoint, _root: &std::path::Path) -> Result<(), ErrorCode> {
            if point == FaultPoint::Prepared {
                Err(ErrorCode::RecoveryRequired)
            } else {
                Ok(())
            }
        }
    }
    let mut f = Fixture::new();
    let empty = f.list();
    let r = f.apply(
        &empty["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
    );
    assert_eq!(r["ok"], true);
    let original = fs::read(f.root.join(PATH)).unwrap();
    let tx = TransactionService::default();
    let p = tx.register_trusted_project(&fs::canonicalize(&f.root).unwrap()).unwrap();
    let path = RelativePath::new(PATH).unwrap();
    let (bytes, base) = tx.snapshot(&p, path.clone()).unwrap();
    let outcome = tx.commit_with_injector(
        &p,
        TransactionProposal {
            mutations: vec![FileMutation {
                path,
                kind: MutationKind::ReplaceExisting,
                base,
                expected_bytes: bytes.clone(),
                proposed: bytes,
            }],
            intent: TransactionIntent::Edit,
        },
        &mut Prepared,
    );
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    let latest = f.list();
    assert_eq!(latest["document"], r["value"]["document"]);
    assert!(latest["diagnostic"].is_string());
    let refused=f.apply(&latest["revision"],json!({"type":"save","kind":"card","recordId":latest["document"]["cards"][0]["id"],"fields":{"description":"Refused recovery edit"}}));
    assert_eq!(refused["error"]["code"], "RECOVERY_REQUIRED");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), original);
}

#[test]
fn explicit_reload_after_external_replace_allows_a_fresh_manual_save(){
    let mut f=Fixture::new();let initial=f.list();let a=f.apply(&initial["revision"],json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}));assert_eq!(a["ok"],true);let id=a["value"]["document"]["cards"][0]["id"].clone();
    let b=f.apply(&a["value"]["revision"],json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"Edited"}}));assert_eq!(b["ok"],true);let undo=f.apply(&b["value"]["revision"],json!({"type":"undo"}));let redo=f.apply(&undo["value"]["revision"],json!({"type":"redo"}));assert_eq!(redo["ok"],true);
    let mut doc=redo["value"]["document"].clone();doc["externalExtension"]=json!({"retained":true});let next=f.root.join(".renpy-editor/external.json");fs::write(&next,serde_json::to_vec(&doc).unwrap()).unwrap();fs::rename(&next,f.root.join(PATH)).unwrap();
    let refused=f.apply(&redo["value"]["revision"],json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"External edit reviewed."}}));assert_eq!(refused["error"]["code"],"REFERENCE_CONFLICT");
    let fresh=f.list();let accepted=f.apply(&fresh["revision"],json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"External edit reviewed."}}));assert_eq!(accepted["ok"],true,"{accepted}");assert_eq!(accepted["value"]["document"]["cards"][0]["revisionCounter"],3);
}
