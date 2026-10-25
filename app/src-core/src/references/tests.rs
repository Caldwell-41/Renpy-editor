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
    // Ordinary consecutive Undo/Redo must cross the preceding transaction, even
    // though each committed replacement allocates a fresh platform file identity.
    let mut state = redo["value"].clone();
    for _ in 0..3 {
        let undo_one = f.apply(&state["revision"], json!({"type":"undo"}));
        assert_eq!(undo_one["ok"], true, "{undo_one}");
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), first);
        let undo_two = f.apply(&undo_one["value"]["revision"], json!({"type":"undo"}));
        assert_eq!(undo_two["ok"], true, "{undo_two}");
        assert!(!f.root.join(PATH).exists());
        let redo_one = f.apply(&undo_two["value"]["revision"], json!({"type":"redo"}));
        assert_eq!(redo_one["ok"], true, "{redo_one}");
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), first);
        let redo_two = f.apply(&redo_one["value"]["revision"], json!({"type":"redo"}));
        assert_eq!(redo_two["ok"], true, "{redo_two}");
        assert_eq!(fs::read(f.root.join(PATH)).unwrap(), second);
        state = redo_two["value"].clone();
    }
    f.service.close().unwrap();
    let p = f.service.open_path(&f.root).unwrap();
    f.session = p.session_id;
    assert_eq!(f.list()["document"], *doc);
    assert_eq!(fs::read(f.root.join("game/script.rpy")).unwrap(), sources);
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
    let opened = f.request("source.open", json!({"path":"game/script.rpy"}));
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
    let p = tx
        .register_trusted_project(&fs::canonicalize(&f.root).unwrap())
        .unwrap();
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
fn explicit_reload_after_external_replace_allows_a_fresh_manual_save() {
    let mut f = Fixture::new();
    let initial = f.list();
    let a = f.apply(
        &initial["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":fields(Kind::Card)}),
    );
    assert_eq!(a["ok"], true);
    let id = a["value"]["document"]["cards"][0]["id"].clone();
    let b = f.apply(
        &a["value"]["revision"],
        json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"Edited"}}),
    );
    assert_eq!(b["ok"], true);
    let undo = f.apply(&b["value"]["revision"], json!({"type":"undo"}));
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true);
    let mut doc = redo["value"]["document"].clone();
    doc["externalExtension"] = json!({"retained":true});
    let next = f.root.join(".renpy-editor/external.json");
    fs::write(&next, serde_json::to_vec(&doc).unwrap()).unwrap();
    fs::rename(&next, f.root.join(PATH)).unwrap();
    let refused=f.apply(&redo["value"]["revision"],json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"External edit reviewed."}}));
    assert_eq!(refused["error"]["code"], "REFERENCE_CONFLICT");
    let fresh = f.list();
    let accepted=f.apply(&fresh["revision"],json!({"type":"save","kind":"card","recordId":id,"fields":{"description":"External edit reviewed."}}));
    assert_eq!(accepted["ok"], true, "{accepted}");
    assert_eq!(
        accepted["value"]["document"]["cards"][0]["revisionCounter"],
        3
    );
}

fn create_input(record_id: Value) -> Value {
    json!({"type":"previewGameCharacter","recordId":record_id,"technicalName":"new_character","displayName":"New character","dialogueColor":"#aabbcc"})
}
fn create_reviewed(f: &mut Fixture, workspace: &Value, record_id: Value) -> Value {
    let preview = f.apply(&workspace["revision"], create_input(record_id.clone()));
    assert_eq!(preview["ok"], true, "{preview}");
    let mut command = create_input(record_id);
    command["type"] = json!("createGameCharacter");
    command["expectedPreviewDigest"] = preview["value"]["characterPreview"]["digest"].clone();
    f.apply(&workspace["revision"], command)
}

#[test]
fn game_only_reads_are_virtual_and_explicit_link_is_stable_and_undoable() {
    let mut f = Fixture::new();
    let created = f.request(
        "character.create",
        json!({"technicalName":"same_name","displayName":"Mara","dialogueColor":"#aabbcc"}),
    );
    assert_eq!(created["ok"], true, "{created}");
    let before = f.list();
    assert!(!f.root.join(PATH).exists());
    assert_eq!(before["document"]["cards"], json!([]));
    let entity = before["entities"]
        .as_array()
        .unwrap()
        .iter()
        .find(|e| e["kind"] == "character" && e["title"] == "Mara")
        .unwrap();
    let character_id = entity["id"].clone();
    let source_revision = entity["revision"].clone();
    let source = fs::read(f.root.join("game/definitions/characters.rpy")).unwrap();
    let linked = f.apply(&before["revision"], json!({"type":"linkCharacter","recordId":null,"characterId":character_id,"expectedSourceRevision":source_revision}));
    assert_eq!(linked["ok"], true, "{linked}");
    let content = &current(&linked["value"]["document"], Kind::Card)["content"];
    assert_eq!(content["linkedCharacterId"], character_id);
    for key in [
        "description",
        "personality",
        "knowledgeNotes",
        "speakingStyle",
        "appearanceNotes",
        "background",
        "motivations",
        "exampleDialogue",
    ] {
        assert_eq!(content[key], "");
    }
    assert_eq!(
        fs::read(f.root.join("game/definitions/characters.rpy")).unwrap(),
        source
    );
    let exact = fs::read(f.root.join(PATH)).unwrap();
    let duplicate = f.apply(&linked["value"]["revision"], json!({"type":"linkCharacter","recordId":null,"characterId":character_id,"expectedSourceRevision":source_revision}));
    assert_eq!(duplicate["ok"], false);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), exact);
    let undo = f.apply(&linked["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert!(!f.root.join(PATH).exists());
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true, "{redo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), exact);
    f.service.close().unwrap();
    let opened = f.service.open_path(&f.root).unwrap();
    f.session = opened.session_id;
    assert_eq!(f.list()["document"], linked["value"]["document"]);
}

#[test]
fn reviewed_game_creation_is_atomic_preserves_source_and_refuses_changed_review() {
    let mut f = Fixture::new();
    let source_path = f.root.join("game/definitions/characters.rpy");
    // Install custom fixture bytes without removing the foundation's mapped Bec.
    // Canonical Character files intentionally refuse direct Source Save.
    let mut source = fs::read(&source_path).unwrap();
    source.extend_from_slice(
        "# custom preface\r\ninit python:\r\n    preserved = 'snow 雪'\r\n".as_bytes(),
    );
    fs::write(&source_path, &source).unwrap();
    let before = f.list();
    let metadata = fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap();
    let preview = f.apply(&before["revision"], create_input(Value::Null));
    assert_eq!(preview["ok"], true, "{preview}");
    assert!(!f.root.join(PATH).exists());
    assert_eq!(fs::read(&source_path).unwrap(), source);
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
        metadata
    );
    let patch = preview["value"]["characterPreview"]["patches"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["path"] == "game/definitions/characters.rpy")
        .unwrap();
    assert_eq!(patch["before"].as_str().unwrap().as_bytes(), source);
    assert!(patch["after"]
        .as_str()
        .unwrap()
        .as_bytes()
        .starts_with(&source));
    let mut command = create_input(Value::Null);
    command["type"] = json!("createGameCharacter");
    command["expectedPreviewDigest"] = preview["value"]["characterPreview"]["digest"].clone();
    command["displayName"] = json!("Changed after review");
    let refused = f.apply(&before["revision"], command.clone());
    assert_eq!(refused["error"]["code"], "REFERENCE_CONFLICT");
    assert_eq!(fs::read(&source_path).unwrap(), source);
    assert!(!f.root.join(PATH).exists());
    command["displayName"] = json!("New character");
    let created = f.apply(&before["revision"], command);
    assert_eq!(created["ok"], true, "{created}");
    let after_source = fs::read(&source_path).unwrap();
    let after_metadata = fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap();
    let after_reference = fs::read(f.root.join(PATH)).unwrap();
    assert!(after_source.starts_with(&source));
    let doc = &created["value"]["document"];
    assert_eq!(doc["cards"].as_array().unwrap().len(), 1);
    let content = &current(doc, Kind::Card)["content"];
    assert_eq!(content["description"], "");
    let authoring: Value = serde_json::from_slice(&after_metadata).unwrap();
    let created_character = authoring["characters"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["technicalName"] == "new_character")
        .unwrap();
    assert_eq!(content["linkedCharacterId"], created_character["id"]);
    let undo = f.apply(&created["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert_eq!(fs::read(&source_path).unwrap(), source);
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
        metadata
    );
    assert!(!f.root.join(PATH).exists());
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true, "{redo}");
    assert_eq!(fs::read(&source_path).unwrap(), after_source);
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
        after_metadata
    );
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), after_reference);
    let duplicate = f.apply(&redo["value"]["revision"], create_input(Value::Null));
    assert_eq!(duplicate["ok"], false);
}

#[test]
fn planning_creation_and_restore_preserve_ids_extensions_and_current_game_link() {
    let mut f = Fixture::new();
    let before = f.list();
    let mut writing = fields(Kind::Card);
    writing["linkedCharacterId"] = Value::Null;
    let saved = f.apply(
        &before["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":writing}),
    );
    assert_eq!(saved["ok"], true, "{saved}");
    let mut extended = saved["value"]["document"].clone();
    extended["futureLibrary"] = json!({"keep":true});
    extended["cards"][0]["futureRecord"] = json!("record");
    extended["cards"][0]["revisions"][0]["futureRevision"] = json!("snapshot");
    extended["cards"][0]["revisions"][0]["content"]["futureContent"] = json!({"unicode":"雪"});
    f.install(&serde_json::to_vec(&extended).unwrap());
    let before = f.list();
    let record_id = extended["cards"][0]["id"].clone();
    let previous_id = extended["cards"][0]["currentRevisionId"].clone();
    let created = create_reviewed(&mut f, &before, record_id.clone());
    assert_eq!(created["ok"], true, "{created}");
    assert_eq!(
        created["value"]["document"]["cards"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let linked =
        current(&created["value"]["document"], Kind::Card)["content"]["linkedCharacterId"].clone();
    let bytes = fs::read(f.root.join(PATH)).unwrap();
    let restored = f.apply(
        &created["value"]["revision"],
        json!({"type":"restoreCard","recordId":record_id,"revisionId":previous_id}),
    );
    assert_eq!(restored["ok"], true, "{restored}");
    let doc = &restored["value"]["document"];
    assert_eq!(doc["cards"][0]["id"], record_id);
    assert_eq!(doc["cards"][0]["revisionCounter"], 3);
    assert_ne!(doc["cards"][0]["currentRevisionId"], previous_id);
    let revision = current(doc, Kind::Card);
    assert_eq!(revision["status"], "approved");
    assert_eq!(revision["content"]["linkedCharacterId"], linked);
    assert_eq!(revision["futureRevision"], "snapshot");
    assert_eq!(
        revision["content"]["futureContent"],
        extended["cards"][0]["revisions"][0]["content"]["futureContent"]
    );
    assert_eq!(doc["futureLibrary"], extended["futureLibrary"]);
    assert_eq!(
        doc["cards"][0]["futureRecord"],
        extended["cards"][0]["futureRecord"]
    );
    assert!(doc["cards"][0]["revisions"].as_array().unwrap().len() <= 3);
    let restored_bytes = fs::read(f.root.join(PATH)).unwrap();
    let undo = f.apply(&restored["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), bytes);
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true, "{redo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), restored_bytes);
    f.service.close().unwrap();
    let opened = f.service.open_path(&f.root).unwrap();
    f.session = opened.session_id;
    assert_eq!(f.list()["document"], *doc);
}

#[test]
fn restore_refuses_proposals_missing_stale_support_and_stale_library_without_writes() {
    let mut f = Fixture::new();
    let mut doc = f.fixture();
    f.install(&serde_json::to_vec(&doc).unwrap());
    let state = f.list();
    for revision in &doc["cards"][0]["revisions"].as_array().unwrap().clone() {
        let result=f.apply(&state["revision"],json!({"type":"restoreCard","recordId":doc["cards"][0]["id"],"revisionId":revision["id"]}));
        assert_eq!(result["ok"], false, "{result}");
    }
    doc["cards"][0]["revisions"][1]["status"] = json!("rejected");
    doc["cards"][0]["revisions"][1]["reviewedAt"] = json!("2026-10-15T00:00:00Z");
    doc["cards"][0]["revisions"][1]["content"]["linkedCharacterId"] = Value::Null;
    doc["cards"][0]["revisions"][0]["supportingReadSet"] =
        json!({"game/script.rpy":"a".repeat(64)});
    f.install(&serde_json::to_vec(&doc).unwrap());
    let baseline = fs::read(f.root.join(PATH)).unwrap();
    let state = f.list();
    let command = json!({"type":"restoreCard","recordId":doc["cards"][0]["id"],"revisionId":doc["cards"][0]["revisions"][0]["id"]});
    let result = f.apply(&state["revision"], command.clone());
    assert_eq!(result["error"]["code"], "REFERENCE_CONFLICT", "{result}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), baseline);
    let result = f.apply(&json!("old revision"), command);
    assert_eq!(result["error"]["code"], "REFERENCE_CONFLICT");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), baseline);
}

#[test]
fn project_context_save_history_bounds_and_extensions_leave_legacy_lore_exact() {
    let mut f = Fixture::new();
    let before = f.list();
    assert!(before["document"].get("projectContext").is_none());
    assert!(!f.root.join(PATH).exists());
    let legacy = f.fixture();
    f.install(&serde_json::to_vec(&legacy).unwrap());
    let state = f.list();
    let first=f.apply(&state["revision"],json!({"type":"saveProjectContext","world":"Café 雪\r\n  start  ","tone":"Quiet, observant."}));
    assert_eq!(first["ok"], true, "{first}");
    let mut doc = first["value"]["document"].clone();
    assert_eq!(doc["cards"], legacy["cards"]);
    assert_eq!(doc["loreEntries"], legacy["loreEntries"]);
    assert_eq!(doc["futureLibrary"], legacy["futureLibrary"]);
    doc["projectContext"]["futureRecord"] = json!({"keep":true});
    doc["projectContext"]["revisions"][0]["futureRevision"] = json!("retained");
    doc["projectContext"]["revisions"][0]["content"]["futureContent"] = json!([1, 2]);
    f.install(&serde_json::to_vec(&doc).unwrap());
    let state = f.list();
    let old_bytes = fs::read(f.root.join(PATH)).unwrap();
    let second = f.apply(
        &state["revision"],
        json!({"type":"saveProjectContext","world":"New world","tone":""}),
    );
    assert_eq!(second["ok"], true, "{second}");
    let new_bytes = fs::read(f.root.join(PATH)).unwrap();
    let context = &second["value"]["document"]["projectContext"];
    assert_eq!(context["id"], doc["projectContext"]["id"]);
    assert_eq!(context["revisionCounter"], 2);
    assert_eq!(
        context["futureRecord"],
        doc["projectContext"]["futureRecord"]
    );
    assert_eq!(context["revisions"][1]["futureRevision"], "retained");
    assert_eq!(
        context["revisions"][1]["content"]["futureContent"],
        json!([1, 2])
    );
    let undo = f.apply(&second["value"]["revision"], json!({"type":"undo"}));
    assert_eq!(undo["ok"], true, "{undo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), old_bytes);
    let redo = f.apply(&undo["value"]["revision"], json!({"type":"redo"}));
    assert_eq!(redo["ok"], true, "{redo}");
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), new_bytes);
    let refused = f.apply(
        &redo["value"]["revision"],
        json!({"type":"saveProjectContext","world":"雪".repeat(3334),"tone":""}),
    );
    assert_eq!(refused["ok"], false);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), new_bytes);
    let mut latest = redo["value"].clone();
    for i in 0..4 {
        let saved = f.apply(
            &latest["revision"],
            json!({"type":"saveProjectContext","world":format!("World {i}"),"tone":""}),
        );
        assert_eq!(saved["ok"], true, "{saved}");
        latest = saved["value"].clone();
        assert!(
            latest["document"]["projectContext"]["revisions"]
                .as_array()
                .unwrap()
                .len()
                <= 3
        );
    }
    assert_eq!(latest["document"]["cards"], legacy["cards"]);
    assert_eq!(latest["document"]["loreEntries"], legacy["loreEntries"]);
    f.service.close().unwrap();
    let opened = f.service.open_path(&f.root).unwrap();
    f.session = opened.session_id;
    assert_eq!(f.list()["document"], latest["document"]);
}

#[test]
fn virtual_writing_save_uses_stable_ids_and_refuses_duplicate_or_changed_association() {
    let mut f = Fixture::new();
    for name in ["first", "second"] {
        let result = f.request(
            "character.create",
            json!({"technicalName":name,"displayName":"Same display","dialogueColor":"#aabbcc"}),
        );
        assert_eq!(result["ok"], true, "{result}");
    }
    let listed = f.list();
    assert_eq!(listed["document"]["cards"], json!([]));
    assert!(!f.root.join(PATH).exists());
    let characters = listed["entities"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|e| e["kind"] == "character" && e["title"] == "Same display")
        .cloned()
        .collect::<Vec<_>>();
    assert_eq!(characters.len(), 2);
    let mut writing = fields(Kind::Card);
    writing["linkedCharacterId"] = characters[0]["id"].clone();
    writing["description"] = json!("My authored writing");
    let first = f.apply(
        &listed["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":writing}),
    );
    assert_eq!(first["ok"], true, "{first}");
    let baseline = fs::read(f.root.join(PATH)).unwrap();
    let duplicate = f.apply(
        &first["value"]["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":writing}),
    );
    assert_eq!(duplicate["ok"], false);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), baseline);
    let changed=f.apply(&first["value"]["revision"],json!({"type":"save","kind":"card","recordId":first["value"]["document"]["cards"][0]["id"],"fields":{"linkedCharacterId":characters[1]["id"]}}));
    assert_eq!(changed["ok"], false);
    assert_eq!(fs::read(f.root.join(PATH)).unwrap(), baseline);
    writing["linkedCharacterId"] = characters[1]["id"].clone();
    let second = f.apply(
        &first["value"]["revision"],
        json!({"type":"save","kind":"card","recordId":null,"fields":writing}),
    );
    assert_eq!(second["ok"], true, "{second}");
    assert_eq!(
        second["value"]["document"]["cards"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert_ne!(
        second["value"]["document"]["cards"][0]["id"],
        second["value"]["document"]["cards"][1]["id"]
    );
}

#[test]
fn character_preview_refuses_dirty_source_and_changed_metadata_review_without_writes() {
    let mut f = Fixture::new();
    let listed = f.list();
    let preview = f.apply(&listed["revision"], create_input(Value::Null));
    assert_eq!(preview["ok"], true, "{preview}");
    let source = fs::read(f.root.join("game/definitions/characters.rpy")).unwrap();
    let opened = f.request(
        "source.open",
        json!({"path":"game/definitions/characters.rpy"}),
    );
    assert_eq!(opened["ok"], true, "{opened}");
    let draft=f.request("source.updateDraft",json!({"path":"game/definitions/characters.rpy","expectedBaseRevision":opened["value"]["baseRevision"],"text":"# Unsaved source draft\n","selectionStart":0,"selectionEnd":0}));
    assert_eq!(draft["ok"], true, "{draft}");
    let refused = f.apply(&listed["revision"], create_input(Value::Null));
    assert_eq!(refused["error"]["code"], "DIRTY_SOURCE", "{refused}");
    assert!(!f.root.join(PATH).exists());
    assert_eq!(
        fs::read(f.root.join("game/definitions/characters.rpy")).unwrap(),
        source
    );
    let discarded = f.request(
        "source.discard",
        json!({"path":"game/definitions/characters.rpy"}),
    );
    assert_eq!(discarded["ok"], true, "{discarded}");
    f.service.close().unwrap();
    let opened = f.service.open_path(&f.root).unwrap();
    f.session = opened.session_id;
    let listed = f.list();
    let preview = f.apply(&listed["revision"], create_input(Value::Null));
    assert_eq!(preview["ok"], true, "{preview}");
    let added = f.request(
        "character.create",
        json!({"technicalName":"other","displayName":"Other","dialogueColor":"#aabbcc"}),
    );
    assert_eq!(added["ok"], true, "{added}");
    let source = fs::read(f.root.join("game/definitions/characters.rpy")).unwrap();
    let metadata = fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap();
    let mut command = create_input(Value::Null);
    command["type"] = json!("createGameCharacter");
    command["expectedPreviewDigest"] = preview["value"]["characterPreview"]["digest"].clone();
    let refused = f.apply(&listed["revision"], command);
    assert_eq!(refused["error"]["code"], "REFERENCE_CONFLICT", "{refused}");
    assert!(!f.root.join(PATH).exists());
    assert_eq!(
        fs::read(f.root.join("game/definitions/characters.rpy")).unwrap(),
        source
    );
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
        metadata
    );
}
