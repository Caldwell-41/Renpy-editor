use super::tests::Fixture;
use crate::lifecycle::acceptance::ipc;
use serde_json::json;
use std::fs;

#[test]
fn choice_unavailable_policy_uses_native_source_and_shared_history() {
    let mut f = Fixture::new();
    // The SDK's bounded generated template is the only supported semantic derivative.
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    f.save(&scene, &format!("label {}:\n    menu:\n        \"Secret\"  if ( flag ) :\n            \"Secret body\"\n        \"Locked\" if flag: # keep\n            \"Locked body\"\n        \"Available\":\n            pass\n    \"Shared\"\n    return\n", scene["technicalLabel"].as_str().unwrap()));
    let path = f.root.join(scene["sourcePath"].as_str().unwrap());
    let before = fs::read(&path).unwrap();
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    let mut payload = menu["payload"].clone();
    payload["options"][1]["unavailablePolicy"] = json!("showDisabled");
    let after = f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload}));
    let accepted = fs::read(&path).unwrap();
    assert_eq!(
        String::from_utf8(accepted.clone()).unwrap(),
        String::from_utf8(before.clone())
            .unwrap()
            .replace("menu:", "menu (screen=\"_ll_choice_v1\"):")
            .replace(
                "\"Locked\" if flag:",
                "\"Locked\" (_ll_available=flag) if True:"
            )
    );
    assert_eq!(
        after["scenes"][0]["beats"][0]["payload"]["options"][1]["unavailablePolicy"],
        "showDisabled"
    );
    assert_eq!(after["scenes"][0]["beats"][0]["id"], menu["id"]);
    let runtime = fs::read(f.root.join("game/loomlight_choice_v1.rpy")).unwrap();
    assert!(String::from_utf8(runtime.clone()).unwrap().contains(
        "textbutton i.caption action i.action sensitive i.kwargs.get(\"_ll_available\", True)"
    ));
    f.command(json!({"type":"undo"}));
    assert_eq!(fs::read(&path).unwrap(), before);
    assert!(!f.root.join("game/loomlight_choice_v1.rpy").exists());
    f.command(json!({"type":"redo"}));
    assert_eq!(fs::read(&path).unwrap(), accepted);
    assert_eq!(
        fs::read(f.root.join("game/loomlight_choice_v1.rpy")).unwrap(),
        runtime
    );
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], after["scenes"][0]["beats"]);
    let current = f.model();
    let menu = &current["scenes"][0]["beats"][0];
    let mut guarded = menu["payload"].clone();
    guarded["options"][2]["condition"] = guarded["options"][0]["condition"].clone();
    f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":current["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":guarded}));
    let text = String::from_utf8(fs::read(&path).unwrap()).unwrap();
    assert!(text.contains("\"Secret\"  if ( flag ) :"));
    assert!(
        text.contains("\"Locked\" (_ll_available=flag) if (( flag )) or (flag) or (flag): # keep")
    );
    let current = f.model();
    let menu = &current["scenes"][0]["beats"][0];
    let helper = "game/loomlight_choice_v1.rpy";
    let opened = ipc(&mut f.service, "source.open", json!({"path":helper}));
    let dirty = format!(
        "{}# retained Source draft\n",
        opened["text"].as_str().unwrap()
    );
    ipc(
        &mut f.service,
        "source.updateDraft",
        json!({"path":helper,"expectedBaseRevision":opened["baseRevision"],"text":dirty,"selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(f.reject(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":current["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":menu["payload"]}))["error"]["code"], "DIRTY_SOURCE");
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":helper}))["text"],
        dirty
    );
    ipc(&mut f.service, "source.discard", json!({"path":helper}));
    f.service.close().unwrap();
}

#[test]
fn choice_custom_template_has_visible_source_fallback_and_refuses_policy_writes() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    f.save(&scene, &format!("label {}:\n    menu (screen=\"_ll_choice_v1\"):\n        \"Locked\" (_ll_available=flag) if (flag):\n            return\n    return\n", scene["technicalLabel"].as_str().unwrap()));
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    assert_eq!(menu["payload"]["type"], "choice");
    assert_eq!(menu["protected"], true);
    assert!(menu["sourceFallback"]
        .as_str()
        .unwrap()
        .contains("Choice template"));
    let before = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    let result = f.reject(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":menu["payload"]}));
    assert_eq!(result["error"]["code"], "OPAQUE_BOUNDARY");
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        before
    );
    f.service.close().unwrap();
}

#[test]
fn choice_disabled_completion_keeps_safe_endings_and_refuses_stale_or_invalid_policy() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\n    menu:\n        \"Answer\":\n            return\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    let mut payload = menu["payload"].clone();
    payload["options"][0]["unavailablePolicy"] = json!("showDisabled");
    let command = |payload: serde_json::Value| json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload});
    let path = f.root.join(scene["sourcePath"].as_str().unwrap());
    let original = fs::read(&path).unwrap();
    assert_eq!(
        f.reject(command(payload.clone()))["error"]["code"],
        "INVALID_PAYLOAD"
    );
    payload["options"][0]["condition"] =
        json!({"status":"supported","expression":{"type":"bool","value":false}});
    assert_eq!(
        f.reject(command(payload.clone()))["error"]["code"],
        "SCENE_INVARIANT"
    );
    assert_eq!(fs::read(&path).unwrap(), original);
    f.save(&w["scenes"][0], &(source + "    return\n"));
    assert_eq!(
        f.reject(command(payload.clone()))["error"]["code"],
        "SOURCE_CONFLICT"
    );
    let fresh = f.model()["scenes"][0].clone();
    let updated = f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":fresh["sourceRevision"],"beatId":fresh["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":payload}));
    let accepted = fs::read(&path).unwrap();
    assert!(String::from_utf8(accepted.clone())
        .unwrap()
        .contains("\"Answer\" (_ll_available=False) if (False):"));
    let map = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let menu = &updated["scenes"][0]["beats"][0];
    f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":updated["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":menu["payload"]}));
    assert_eq!(fs::read(&path).unwrap(), accepted);
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        map
    );
    f.service.close().unwrap();
}

#[test]
fn picked_choice_records_before_transfers_and_roundtrips_history() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    f.save(&scene, &format!("label {}:\n    menu:\n        \"Same\": # retained\n            return\n        \"Same\":\n            pass\n    return\n", scene["technicalLabel"].as_str().unwrap()));
    let before = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    let mut payload = menu["payload"].clone();
    payload["pickedPolicy"] = json!("markPicked");
    let update = |w: &serde_json::Value, payload| json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload});
    let after = f.command(update(&w, payload));
    assert_eq!(
        after["scenes"][0]["beats"][0]["payload"]["pickedPolicy"],
        "markPicked"
    );
    let bytes = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    let text = String::from_utf8(bytes.clone()).unwrap();
    assert!(text.contains("] = True\n            return"));
    assert!(text.contains(": # retained\n"));
    assert_eq!(after["scenes"][0]["beats"][0]["id"], menu["id"]);
    assert_eq!(
        after["scenes"][0]["beats"][0]["payload"]["options"],
        menu["payload"]["options"]
    );
    f.command(json!({"type":"undo"}));
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        before
    );
    f.command(json!({"type":"redo"}));
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        bytes
    );
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], after["scenes"][0]["beats"]);
    let map = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    f.command(update(
        &after,
        after["scenes"][0]["beats"][0]["payload"].clone(),
    ));
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        map
    );
    let fresh = f.model();
    let created = f.command(json!({"type":"createSceneFromChoice","sceneId":scene["id"],"expectedSourceRevision":fresh["scenes"][0]["sourceRevision"],"choiceBeatId":menu["id"],"optionText":"Same","chapterId":fresh["chapters"][0]["id"],"displayName":"New destination"}));
    let origin = created["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == scene["id"])
        .unwrap();
    let options = &origin["beats"][0]["payload"]["options"];
    assert_eq!(options.as_array().unwrap().len(), 3);
    assert_ne!(options[2]["id"], options[0]["id"]);
    assert_ne!(options[2]["id"], options[1]["id"]);
    let text = fs::read_to_string(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    assert!(text.contains("] = True\n            jump "));
    f.service.close().unwrap();
}

#[test]
fn picked_hiding_rechecks_scene_ending_and_preserves_fresh_option_identities() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    let source = format!("label {}:\r\n    menu:\r\n        \"Same\":\r\n            return\r\n        \"Same\":\r\n            return\r\n", scene["technicalLabel"].as_str().unwrap());
    f.save(&scene, &source);
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    let mut payload = menu["payload"].clone();
    payload["pickedPolicy"] = json!("hidePicked");
    let command = |w: &serde_json::Value, p| json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":w["scenes"][0]["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":p});
    assert_eq!(
        f.reject(command(&w, payload.clone()))["error"]["code"],
        "SCENE_INVARIANT"
    );
    f.save(&scene, &(source + "    return\r\n"));
    let w = f.model();
    let after = f.command(command(&w, payload));
    let old = after["scenes"][0]["beats"][0]["payload"].clone();
    let mut renamed = old.clone();
    renamed["options"].as_array_mut().unwrap().reverse();
    renamed["options"][0]["text"] = json!("Renamed");
    renamed["options"]
        .as_array_mut()
        .unwrap()
        .push(json!({"text":"Same"}));
    let after = f.command(command(&after, renamed));
    let options = &after["scenes"][0]["beats"][0]["payload"]["options"];
    assert_eq!(options[0]["id"], old["options"][1]["id"]);
    assert_eq!(options[1]["id"], old["options"][0]["id"]);
    assert_ne!(options[2]["id"], options[0]["id"]);
    assert_ne!(options[2]["id"], options[1]["id"]);
    let text = fs::read_to_string(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    assert!(text.contains("not in _ll_picked_v1"));
    assert!(!text.replace("\r\n", "").contains('\n'));
    f.service.close().unwrap();
}

#[test]
fn picked_helper_collisions_missing_edits_and_dirty_source_never_repair_on_inspection() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let scene = f.model()["scenes"][0].clone();
    f.save(
        &scene,
        &format!(
            "label {}:\n    menu:\n        \"Same\":\n            pass\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        ),
    );
    let w = f.model();
    let mut payload = w["scenes"][0]["beats"][0]["payload"].clone();
    payload["pickedPolicy"] = json!("showNormally");
    let command = |w: &serde_json::Value, p| json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":w["scenes"][0]["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":p});
    fs::write(f.root.join("game/collision.rpy"), "$ _ll_picked_v1={}\n").unwrap();
    assert_eq!(
        f.reject(command(&w, payload.clone()))["error"]["code"],
        "SCENE_INVARIANT"
    );
    assert!(!f.root.join("game/loomlight_choice_v1.rpy").exists());
    fs::remove_file(f.root.join("game/collision.rpy")).unwrap();
    let after = f.command(command(&w, payload));
    let helper = f.root.join("game/loomlight_choice_v1.rpy");
    let accepted = fs::read(&helper).unwrap();
    fs::write(&helper, b"# edited helper\n").unwrap();
    let fallback = f.model();
    assert_eq!(fallback["scenes"][0]["beats"][0]["protected"], true);
    assert_eq!(fs::read(&helper).unwrap(), b"# edited helper\n");
    fs::remove_file(&helper).unwrap();
    let fallback = f.model();
    assert_eq!(fallback["scenes"][0]["beats"][0]["protected"], true);
    assert!(!helper.exists());
    assert_eq!(
        f.reject(command(
            &after,
            after["scenes"][0]["beats"][0]["payload"].clone()
        ))["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert!(!helper.exists());
    fs::write(&helper, accepted).unwrap();
    let opened = ipc(
        &mut f.service,
        "source.open",
        json!({"path":"game/loomlight_choice_v1.rpy"}),
    );
    ipc(
        &mut f.service,
        "source.updateDraft",
        json!({"path":"game/loomlight_choice_v1.rpy","expectedBaseRevision":opened["baseRevision"],"text":"# retained helper draft\n","selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        f.reject(command(
            &after,
            after["scenes"][0]["beats"][0]["payload"].clone()
        ))["error"]["code"],
        "DIRTY_SOURCE"
    );
    ipc(
        &mut f.service,
        "source.discard",
        json!({"path":"game/loomlight_choice_v1.rpy"}),
    );
    f.service.close().unwrap();
}

#[test]
fn choice_runtime_fallback_tracks_required_capability_in_either_scene_order() {
    for picked_first in [false, true] {
        let mut f = Fixture::new();
        fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
        let first = f.model()["scenes"][0].clone();
        let second = f.scene("Second");
        let (legacy, picked) = if picked_first {
            (&second, &first)
        } else {
            (&first, &second)
        };
        f.save(legacy, &format!("label {}:\n    menu (screen=\"_ll_choice_v1\"):\n        \"Legacy locked\" (_ll_available=True) if (True):\n            pass\n    return\n", legacy["technicalLabel"].as_str().unwrap()));
        f.save(picked, &format!("label {}:\n    menu (screen=\"_ll_choice_v1\", _ll_mode=\"markPicked\", _ll_id=\"11111111-1111-4111-8111-111111111111\"):\n        \"Picked\" (_ll_id=\"22222222-2222-4222-8222-222222222222\", _ll_available=True, _ll_guarded=False, _ll_locked=False) if True:\n            $ _ll_picked_v1[(\"11111111-1111-4111-8111-111111111111\", \"22222222-2222-4222-8222-222222222222\")] = True\n            pass\n    return\n", picked["technicalLabel"].as_str().unwrap()));
        let paths = [legacy, picked].map(|s| f.root.join(s["sourcePath"].as_str().unwrap()));
        let before = paths.each_ref().map(|p| fs::read(p).unwrap());
        let helper = f.root.join("game/loomlight_choice_v1.rpy");
        for adapter in [
            None,
            Some(crate::screens::choice_template::ADAPTER),
            Some(crate::screens::choice_template::PICKED_ADAPTER),
        ] {
            if let Some(bytes) = adapter {
                fs::write(&helper, bytes).unwrap();
            }
            let w = f.model();
            for scene in w["scenes"].as_array().unwrap() {
                let menu = &scene["beats"][0];
                let supported = adapter == Some(crate::screens::choice_template::PICKED_ADAPTER)
                    || (adapter.is_some() && scene["id"] == legacy["id"]);
                assert_eq!(
                    menu["protected"], !supported,
                    "order={picked_first}, adapter={adapter:?}, scene={scene}"
                );
                assert_eq!(menu["sourceFallback"].is_string(), !supported);
            }
            assert_eq!(paths.each_ref().map(|p| fs::read(p).unwrap()), before);
            assert_eq!(
                fs::read(&helper).ok(),
                adapter.map(|s| s.as_bytes().to_vec())
            );
        }
        // A legacy-only menu remains editable with its valid availability adapter.
        fs::write(&helper, crate::screens::choice_template::ADAPTER).unwrap();
        let w = f.model();
        let s = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == legacy["id"])
            .unwrap();
        let mut payload = s["beats"][0]["payload"].clone();
        payload["options"][0]["text"] = json!("Legacy renamed");
        f.command(json!({"type":"updateBodyBeat","sceneId":s["id"],"expectedSourceRevision":s["sourceRevision"],"beatId":s["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":payload}));
        assert_eq!(
            fs::read(&helper).unwrap(),
            crate::screens::choice_template::ADAPTER.as_bytes()
        );
        f.service.close().unwrap();
    }
}

#[test]
fn choice_missing_existing_helper_refuses_changed_source_commands_without_history_or_repair() {
    for picked in [false, true] {
        let mut f = Fixture::new();
        fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
        let s = f.model()["scenes"][0].clone();
        let other = f.scene("Other");
        f.save(&s, &format!("label {}:\n    \"Before\"\n    menu:\n        \"Answer\" if flag:\n            \"Inside\"\n    return\n", s["technicalLabel"].as_str().unwrap()));
        let w = f.model();
        let menu = &w["scenes"][0]["beats"][1];
        let mut payload = menu["payload"].clone();
        if picked {
            payload["pickedPolicy"] = json!("showNormally");
        } else {
            payload["options"][0]["unavailablePolicy"] = json!("showDisabled");
        }
        f.command(json!({"type":"updateBodyBeat","sceneId":s["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload}));
        let helper = f.root.join("game/loomlight_choice_v1.rpy");
        let accepted_helper = fs::read(&helper).unwrap();
        fs::remove_file(&helper).unwrap();
        let w = f.model();
        let scene = &w["scenes"][0];
        let beats = scene["beats"].as_array().unwrap();
        let menu = &beats[1];
        let inside = beats
            .iter()
            .find(|b| b["payload"]["text"] == "Inside")
            .unwrap();
        let body = json!({"type":"branch","groupId":inside["owner"]["groupId"],"branchId":inside["owner"]["branchId"]});
        let commands = [
            json!({"type":"updateBeat","beatId":beats[0]["id"],"beat":{"type":"narration","text":"Changed"}}),
            json!({"type":"updateBodyBeat","expectedBody":{"type":"root"},"beatId":beats[0]["id"],"beat":{"type":"narration","text":"Changed"}}),
            json!({"type":"updateBodyBeat","expectedBody":body,"beatId":inside["id"],"beat":{"type":"narration","text":"Changed"}}),
            json!({"type":"insertBodyBeat","body":body,"position":{"type":"end"},"beat":{"type":"narration","text":"Added"}}),
            json!({"type":"createSceneFromChoice","choiceBeatId":menu["id"],"optionText":"New answer","chapterId":w["chapters"][0]["id"],"displayName":"Must not exist"}),
        ];
        for mut command in commands.clone() {
            command["sceneId"] = scene["id"].clone();
            command["expectedSourceRevision"] = scene["sourceRevision"].clone();
            assert_eq!(f.reject(command)["error"]["code"], "OPAQUE_BOUNDARY");
            assert!(!helper.exists());
            assert_eq!(f.model(), w, "refusal must retain source/map/IDs/history");
        }
        let other_scene = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == other["id"])
            .unwrap();
        assert_eq!(f.reject(json!({"type":"insertBodyBeat","sceneId":other_scene["id"],"expectedSourceRevision":other_scene["sourceRevision"],"body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":other_scene["beats"][0]["id"]}},"beat":{"type":"choice","pickedPolicy":"showNormally","options":[{"text":"New adoption"}]}}))["error"]["code"], "OPAQUE_BOUNDARY");
        assert!(!helper.exists());
        assert_eq!(f.model(), w);
        if picked {
            fs::write(&helper, crate::screens::choice_template::ADAPTER).unwrap();
            let mut command = commands[0].clone();
            command["sceneId"] = scene["id"].clone();
            command["expectedSourceRevision"] = scene["sourceRevision"].clone();
            assert_eq!(f.reject(command)["error"]["code"], "OPAQUE_BOUNDARY");
            assert_eq!(
                fs::read(&helper).unwrap(),
                crate::screens::choice_template::ADAPTER.as_bytes()
            );
        }
        fs::write(&helper, &accepted_helper).unwrap();
        // External deletion/recreation remains an ordinary history boundary.
        assert_eq!(
            f.reject(json!({"type":"undo"}))["error"]["code"],
            "HISTORY_BOUNDARY"
        );
        assert_eq!(fs::read(&helper).unwrap(), accepted_helper);
        f.service.close().unwrap();
    }
}

#[test]
fn picked_caption_prompt_and_policy_edits_preserve_mixed_newlines_and_header_trivia() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let s = f.model()["scenes"][0].clone();
    f.save(&s, &format!("label {}:\n    menu:\n        \"Question\" # prompt\n        \"Answer\": # option\n            \"Body\"\n    return\n", s["technicalLabel"].as_str().unwrap()));
    let w = f.model();
    let mut payload = w["scenes"][0]["beats"][0]["payload"].clone();
    payload["pickedPolicy"] = json!("markPicked");
    let command = |w: &serde_json::Value, payload| json!({"type":"updateBodyBeat","sceneId":s["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":w["scenes"][0]["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":payload});
    f.command(command(&w, payload));
    let path = f.root.join(s["sourcePath"].as_str().unwrap());
    let mixed = fs::read_to_string(&path)
        .unwrap()
        .replace("):\n", "):  \n")
        .replace("# prompt\n", "# prompt\r\n")
        .replace("# option\n", "# option\r\n")
        .replace("    return\n", "    return\r\n");
    f.save(&s, mixed.trim_start_matches('\u{feff}'));
    for field in ["caption", "prompt", "policy"] {
        let w = f.model();
        let ids = w["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b["id"].clone())
            .collect::<Vec<_>>();
        let mut payload = w["scenes"][0]["beats"][0]["payload"].clone();
        let expected = match field {
            "caption" => {
                payload["options"][0]["text"] = json!("Renamed");
                mixed.replace("\"Answer\"", "\"Renamed\"")
            }
            "prompt" => {
                payload["prompt"]["text"] = json!("New question");
                mixed.replace("\"Question\"", "\"New question\"")
            }
            _ => {
                payload["pickedPolicy"] = json!("showNormally");
                mixed.replace("_ll_mode=\"markPicked\"", "_ll_mode=\"showNormally\"")
            }
        };
        let after = f.command(command(&w, payload));
        assert_eq!(fs::read(&path).unwrap(), expected.as_bytes(), "{field}");
        assert_eq!(
            after["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .map(|b| b["id"].clone())
                .collect::<Vec<_>>(),
            ids
        );
        let map = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
        f.command(command(
            &after,
            after["scenes"][0]["beats"][0]["payload"].clone(),
        ));
        assert_eq!(
            fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
            map
        );
        f.command(json!({"type":"undo"}));
        assert_eq!(fs::read(&path).unwrap(), mixed.as_bytes());
        f.command(json!({"type":"redo"}));
        assert_eq!(fs::read(&path).unwrap(), expected.as_bytes());
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        assert_eq!(f.model()["scenes"][0]["beats"], after["scenes"][0]["beats"]);
        f.save(&s, mixed.trim_start_matches('\u{feff}'));
    }
    f.service.close().unwrap();
}

#[test]
fn choice_explicit_first_picked_adoption_upgrades_legacy_adapter_in_shared_history() {
    let mut f = Fixture::new();
    fs::write(f.root.join("game/screens.rpy"), "screen choice(items):\n    style_prefix \"choice\"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n").unwrap();
    let s = f.model()["scenes"][0].clone();
    f.save(
        &s,
        &format!(
            "label {}:\n    menu:\n        \"Answer\" if flag:\n            pass\n    return\n",
            s["technicalLabel"].as_str().unwrap()
        ),
    );
    let command = |w: &serde_json::Value, payload| json!({"type":"updateBodyBeat","sceneId":s["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":w["scenes"][0]["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":payload});
    let w = f.model();
    let mut payload = w["scenes"][0]["beats"][0]["payload"].clone();
    payload["options"][0]["unavailablePolicy"] = json!("showDisabled");
    let legacy = f.command(command(&w, payload));
    let helper = f.root.join("game/loomlight_choice_v1.rpy");
    let path = f.root.join(s["sourcePath"].as_str().unwrap());
    let legacy_source = fs::read(&path).unwrap();
    assert_eq!(
        fs::read(&helper).unwrap(),
        crate::screens::choice_template::ADAPTER.as_bytes()
    );
    let mut payload = legacy["scenes"][0]["beats"][0]["payload"].clone();
    payload["pickedPolicy"] = json!("markPicked");
    let picked = f.command(command(&legacy, payload));
    let picked_source = fs::read(&path).unwrap();
    assert_eq!(
        fs::read(&helper).unwrap(),
        crate::screens::choice_template::PICKED_ADAPTER.as_bytes()
    );
    assert_eq!(
        picked["scenes"][0]["beats"][0]["id"],
        legacy["scenes"][0]["beats"][0]["id"]
    );
    assert_eq!(
        picked["scenes"][0]["beats"][0]["payload"]["options"],
        legacy["scenes"][0]["beats"][0]["payload"]["options"]
    );
    f.command(json!({"type":"undo"}));
    assert_eq!(fs::read(&path).unwrap(), legacy_source);
    assert_eq!(
        fs::read(&helper).unwrap(),
        crate::screens::choice_template::ADAPTER.as_bytes()
    );
    f.command(json!({"type":"redo"}));
    assert_eq!(fs::read(&path).unwrap(), picked_source);
    assert_eq!(
        fs::read(&helper).unwrap(),
        crate::screens::choice_template::PICKED_ADAPTER.as_bytes()
    );
    f.service.close().unwrap();
}
