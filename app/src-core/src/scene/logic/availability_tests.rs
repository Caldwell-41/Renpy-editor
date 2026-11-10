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
