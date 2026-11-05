use super::tests::Fixture;
use crate::lifecycle::acceptance::ipc;
use serde_json::{json, Value};
use std::fs;

fn dialog(f: &mut Fixture, name: &str) -> Value {
    let catalog = ipc(&mut f.service, "screens.list", json!({}));
    let created = ipc(
        &mut f.service,
        "screens.create",
        json!({
            "name": name, "kind":"dialog", "expectedProjectRevision": catalog["projectRevision"],
            "expectedSourceMapRevision": catalog["sourceMapRevision"],
            "expectedInventoryRevision": catalog["inventoryRevision"]
        }),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == name)
        .unwrap()
        .clone();
    let opened = ipc(
        &mut f.service,
        "source.open",
        json!({"path": owner["path"]}),
    );
    f.save(
        &json!({"sourcePath":owner["path"]}),
        &opened["text"].as_str().unwrap().replace(
            "    pass",
            "    textbutton \"Close\":\n        action Return()\n        default_focus True",
        ),
    );
    owner
}
fn resolved(f: &mut Fixture, owner: &Value) -> Value {
    ipc(
        &mut f.service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}}),
    )
}
fn insertion(f: &mut Fixture, target: &Value) -> Value {
    let scene = f.model()["scenes"][0].clone();
    let last = scene["beats"].as_array().unwrap().last().unwrap();
    json!({"type":"insertBodyBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],
        "body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":last["id"]}},
        "beat":{"type":"callScreen","target":target["binding"],"revisions":target["revisions"]}})
}
fn insert(f: &mut Fixture, target: &Value) -> Value {
    let command = insertion(f, target);
    f.command(command)
}

fn source(f: &mut Fixture, scene: &Value) -> String {
    ipc(
        &mut f.service,
        "source.open",
        json!({"path":scene["sourcePath"]}),
    )["text"]
        .as_str()
        .unwrap()
        .to_owned()
}

#[test]
fn call_screen_is_distinct_exact_source_with_one_history_entry_and_stable_reopen() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let scene = f.model()["scenes"][0].clone();
    let original = format!(
        "label {}:\r\n    \"Before\"\r\n    $ opaque_hook() # keep bytes\r\n    return\r\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &original);
    let target = resolved(&mut f, &owner);
    let accepted = insert(&mut f, &target);
    let call = accepted["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["type"] == "callScreen")
        .unwrap()
        .clone();
    let expected = original.replace(
        "    return\r\n",
        "    call screen help_dialog\r\n    return\r\n",
    );
    assert_eq!(source(&mut f, &scene), expected);
    assert_eq!(call["payload"]["target"], target["binding"]);
    assert!(call["payload"].get("returnLabel").is_none());
    assert_eq!(call["screenEffects"]["finishesInteraction"], true);
    assert_eq!(call["protected"], false);
    let current = f.model()["scenes"][0].clone();
    f.command(json!({"type":"updateBodyBeat","sceneId":current["id"],"expectedSourceRevision":current["sourceRevision"],
        "beatId":call["id"],"expectedBody":{"type":"root"},"beat":call["payload"]}));
    f.command(json!({"type":"undo"}));
    assert_eq!(source(&mut f, &scene), original);
    let redone = f.command(json!({"type":"redo"}));
    assert!(redone["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["id"] == call["id"]));
    assert_eq!(source(&mut f, &scene), expected);
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    let reopened = f.model();
    let same = reopened["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["id"] == call["id"])
        .unwrap();
    assert_eq!(same["payload"]["target"], call["payload"]["target"]);
    assert_eq!(same["protected"], false);
    assert_eq!(source(&mut f, &scene), expected);
}

#[test]
fn new_call_refuses_nonblocking_or_unknown_dialog_context_without_writes() {
    for replacement in [
        "modal False",
        "modal dynamic_flag",
        "modal True\n    modal True",
        "modal True\n    textbutton \"Custom\" action Function(custom)",
    ] {
        let mut f = Fixture::new();
        let owner = dialog(&mut f, "help_dialog");
        let path = json!({"sourcePath":owner["path"]});
        let before = source(&mut f, &path);
        f.save(&path, &before.replace("modal True", replacement));
        let target = resolved(&mut f, &owner);
        let command = insertion(&mut f, &target);
        assert_eq!(
            f.reject(command)["error"]["code"],
            "INCOMING_REFERENCE",
            "{replacement}"
        );
    }
}

#[test]
fn call_source_retarget_keeps_each_original_binding_and_comments_through_history_and_reopen() {
    for name in ["other_dialog", "missing_dialog"] {
        let mut f = Fixture::new();
        let owner = dialog(&mut f, "help_dialog");
        dialog(&mut f, "other_dialog");
        for _ in 0..2 {
            let target = resolved(&mut f, &owner);
            insert(&mut f, &target);
        }
        let scene = f.model()["scenes"][0].clone();
        let calls = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["payload"]["type"] == "callScreen")
            .cloned()
            .collect::<Vec<_>>();
        let original = source(&mut f, &scene);
        let changed = original.replace(
            "call screen help_dialog",
            &format!("call screen {name} # retain intent"),
        );
        f.save(&scene, &changed);
        let after = f.model()["scenes"][0].clone();
        for before in &calls {
            let beat = after["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["id"] == before["id"])
                .unwrap();
            assert_eq!(beat["payload"]["target"], before["payload"]["target"]);
            assert_eq!(beat["protected"], true);
            assert!(beat["payload"]["revisions"].is_null());
        }
        f.command(json!({"type":"undo"}));
        assert_eq!(source(&mut f, &scene), original);
        f.command(json!({"type":"redo"}));
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        let reopened = f.model()["scenes"][0].clone();
        for before in &calls {
            let beat = reopened["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["id"] == before["id"])
                .unwrap();
            assert_eq!(beat["payload"]["target"], before["payload"]["target"]);
            assert_eq!(beat["protected"], true);
        }
        assert_eq!(source(&mut f, &scene), changed);
    }
}

#[test]
fn call_screen_arguments_dynamic_names_and_captured_returns_stay_opaque() {
    let mut f = Fixture::new();
    dialog(&mut f, "help_dialog");
    let scene = f.model()["scenes"][0].clone();
    let text = format!("label {}:\n    call screen help_dialog(value=1)\n    call screen expression active_screen\n    $ result = renpy.call_screen(\"help_dialog\")\n    call screen help_dialog from captured\n    return\n", scene["technicalLabel"].as_str().unwrap());
    f.save(&scene, &text);
    let before = f.model()["scenes"][0]["beats"].clone();
    for beat in before.as_array().unwrap().iter().take(4) {
        assert_eq!(beat["payload"]["type"], "customCode");
        assert_eq!(beat["protected"], true);
    }
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], before);
    assert_eq!(source(&mut f, &scene), text);
}

#[path = "dialog_fixture.rs"]
mod dialog_fixture;

fn compose(f: &mut Fixture, owner: &Value, command: Value) -> Value {
    let opened = ipc(
        &mut f.service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    ipc(
        &mut f.service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":opened["revision"],"command":command}),
    )
}

#[test]
fn added_inert_button_can_finish_dialog_in_one_exact_transaction_and_undo_redo() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let added = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
    );
    let id = added["selectedId"].clone();
    let path = json!({"sourcePath":owner["path"]});
    let before = source(&mut f, &path);
    assert!(before.contains("action Null()"));
    let changed = compose(
        &mut f,
        &owner,
        json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
            "expectedAuthoringRevision":added["document"]["authoringRevision"],"expectedTargetRevisions":[]}),
    );
    assert_eq!(changed["changed"], true);
    let expected = before.replace("action Null()", "action Return()");
    assert_eq!(source(&mut f, &path), expected);
    assert_eq!(
        compose(
            &mut f,
            &owner,
            json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
                "expectedAuthoringRevision":changed["document"]["authoringRevision"],"expectedTargetRevisions":[]})
        )["changed"],
        false
    );
    f.command(json!({"type":"undo"}));
    assert_eq!(source(&mut f, &path), before);
    f.command(json!({"type":"redo"}));
    assert_eq!(source(&mut f, &path), expected);
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(source(&mut f, &path), expected);
}

fn reject_compose(
    f: &mut Fixture,
    owner: &Value,
    command: Value,
    expected: Option<Value>,
) -> Value {
    let document = ipc(
        &mut f.service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let before = fs::read(f.root.join(owner["path"].as_str().unwrap())).unwrap();
    let map = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let response = crate::handle_application_request(
        json!({"protocolVersion":1,"requestId":"dialog-refusal","operation":"screens.compose",
        "payload":{"sessionId":f.service.current().unwrap().session_id,"screenId":owner["id"],"expectedRevision":expected.unwrap_or_else(|| document["revision"].clone()),"command":command}}),
        false,
        &mut f.service,
    );
    let response = serde_json::to_value(response).unwrap();
    assert_eq!(response["ok"], false);
    assert_eq!(
        fs::read(f.root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        map
    );
    response
}

#[test]
fn actions_refuse_duplicate_element_ids_without_retargeting_or_writes() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let first = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"First"}),
    );
    let second = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Second"}),
    );
    let path = json!({"sourcePath":owner["path"]});
    let before = source(&mut f, &path);
    f.save(
        &path,
        &before.replace(
            second["selectedId"].as_str().unwrap(),
            first["selectedId"].as_str().unwrap(),
        ),
    );
    reject_compose(
        &mut f,
        &owner,
        json!({"type":"actions","nodeId":first["selectedId"],"actions":[{"type":"finishInteraction"}],
            "expectedAuthoringRevision":second["document"]["authoringRevision"],"expectedTargetRevisions":[]}),
        None,
    );
}

#[test]
fn actions_change_only_expression_preserving_crlf_comments_and_opaque_neighbors() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let added = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
    );
    let id = added["selectedId"].clone();
    let path = json!({"sourcePath":owner["path"]});
    let before = source(&mut f, &path)
        .replace("action Null()", "action    Null()  # preserve comment")
        .replace('\n', "\r\n");
    let before = format!("{before}# preserve trailing opaque source\r\n");
    f.save(&path, &before);
    let document = ipc(
        &mut f.service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    compose(
        &mut f,
        &owner,
        json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
            "expectedAuthoringRevision":document["authoringRevision"],"expectedTargetRevisions":[]}),
    );
    let expected = before.replace("action    Null()", "action    Return()");
    assert_eq!(source(&mut f, &path), expected);
    reject_compose(
        &mut f,
        &owner,
        json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
            "expectedAuthoringRevision":document["authoringRevision"],"expectedTargetRevisions":[]}),
        Some(document["revision"].clone()),
    );
    f.command(json!({"type":"undo"}));
    assert_eq!(source(&mut f, &path), before);
    f.command(json!({"type":"redo"}));
    assert_eq!(source(&mut f, &path), expected);
}

#[test]
fn actions_refuse_wrong_context_and_unqualified_actions_without_replacing_source() {
    for action in [
        "[Return(), Null()]",
        "Return(1)",
        "Function(custom)",
        "Hide(\"other\")",
        "Null()\n        action Null()",
        "dynamic_action",
    ] {
        let mut f = Fixture::new();
        let owner = dialog(&mut f, "help_dialog");
        let added = compose(
            &mut f,
            &owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
        );
        let id = added["selectedId"].clone();
        let path = json!({"sourcePath":owner["path"]});
        let text = source(&mut f, &path).replace("action Null()", &format!("action {action}"));
        f.save(&path, &text);
        reject_compose(
            &mut f,
            &owner,
            json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
                "expectedAuthoringRevision":added["document"]["authoringRevision"],"expectedTargetRevisions":[]}),
            None,
        );
        assert_eq!(source(&mut f, &path), text);
    }
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let added = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
    );
    let id = added["selectedId"].clone();
    let target = resolved(&mut f, &owner);
    assert_eq!(
        reject_compose(
            &mut f,
            &owner,
            json!({"type":"actions","nodeId":id,"actions":[{"type":"hideScreen","target":target["binding"]}],
                "expectedAuthoringRevision":added["document"]["authoringRevision"],
                "expectedTargetRevisions":[{"target":target["binding"],"revisions":target["revisions"]}]}),
            None
        )["error"]["code"],
        "INCOMING_REFERENCE"
    );
    let path = json!({"sourcePath":owner["path"]});
    let text = source(&mut f, &path).replace("modal True", "modal False");
    f.save(&path, &text);
    assert_eq!(
        reject_compose(
            &mut f,
            &owner,
            json!({"type":"actions","nodeId":id,"actions":[{"type":"finishInteraction"}],
                "expectedAuthoringRevision":added["document"]["authoringRevision"],"expectedTargetRevisions":[]}),
            None
        )["error"]["code"],
        "INCOMING_REFERENCE"
    );
}

#[test]
fn added_null_button_remains_an_ordinary_removable_element() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let added = compose(
        &mut f,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
    );
    compose(
        &mut f,
        &owner,
        json!({"type":"remove","nodeId":added["selectedId"]}),
    );
    assert!(!source(&mut f, &json!({"sourcePath":owner["path"]})).contains("textbutton \"Done\""));
}

#[test]
fn call_draft_refuses_missing_stale_or_dirty_target_revisions_and_retains_source_input() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let target = resolved(&mut f, &owner);
    let mut command = insertion(&mut f, &target);
    command["beat"].as_object_mut().unwrap().remove("revisions");
    assert_eq!(f.reject(command)["error"]["code"], "INVALID_PAYLOAD");
    let mut stale = target.clone();
    stale["revisions"]["effects"] = json!("0".repeat(64));
    let command = insertion(&mut f, &stale);
    assert_eq!(f.reject(command)["error"]["code"], "SOURCE_CONFLICT");
    let opened = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}));
    let draft = format!(
        "{}# retained Source input\n",
        opened["text"].as_str().unwrap()
    );
    ipc(
        &mut f.service,
        "source.updateDraft",
        json!({"path":owner["path"],"expectedBaseRevision":opened["baseRevision"],"text":draft,"selectionStart":0,"selectionEnd":0}),
    );
    let command = insertion(&mut f, &target);
    assert_eq!(f.reject(command)["error"]["code"], "DIRTY_SOURCE");
    let retained = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}));
    assert_eq!(retained["text"], draft);
}

#[test]
fn source_defined_call_keeps_its_identity_and_unknown_effects_after_dialog_changes() {
    let mut f = Fixture::new();
    let owner = dialog(&mut f, "help_dialog");
    let target = resolved(&mut f, &owner);
    let accepted = insert(&mut f, &target);
    let call = accepted["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["type"] == "callScreen")
        .unwrap()
        .clone();
    let scene = accepted["scenes"][0].clone();
    let original = source(&mut f, &scene);
    let path = json!({"sourcePath":owner["path"]});
    let changed = source(&mut f, &path).replace("action Return()", "action Return(1)");
    f.save(&path, &changed);
    let model = f.model();
    let same = model["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["id"] == call["id"])
        .unwrap();
    assert_eq!(same["payload"]["target"], call["payload"]["target"]);
    assert_eq!(same["protected"], true);
    assert!(same["payload"]["revisions"].is_null());
    assert_eq!(same["screenEffects"]["unknown"], true);
    assert_eq!(same["screenEffects"]["finishesInteraction"], false);
    assert_eq!(source(&mut f, &scene), original);
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    let reopened = f.model();
    assert!(reopened["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["id"] == call["id"] && b["protected"] == true));
}
