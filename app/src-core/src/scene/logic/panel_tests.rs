use super::tests::Fixture;
use crate::lifecycle::acceptance::ipc;
use serde_json::{json, Value};
use std::fs;

fn panel(f: &mut Fixture, name: &str) -> Value {
    let catalog = ipc(&mut f.service, "screens.list", json!({}));
    let created = ipc(
        &mut f.service,
        "screens.create",
        json!({"name":name,"expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == name)
        .unwrap()
        .clone()
}

fn resolved(f: &mut Fixture, owner: &Value) -> Value {
    ipc(
        &mut f.service,
        "screens.resolveTarget",
        json!({
            "binding":{"screenId":owner["id"],"sourceName":owner["name"]}
        }),
    )
}

fn insertion(f: &mut Fixture, payload: Value) -> Value {
    let scene = f.model()["scenes"][0].clone();
    let terminal = scene["beats"].as_array().unwrap().last().unwrap();
    json!({"type":"insertBodyBeat","sceneId":scene["id"],
        "expectedSourceRevision":scene["sourceRevision"],"body":{"type":"root"},
        "position":{"type":"before","anchor":{"type":"beat","beatId":terminal["id"]}},
        "beat":payload})
}

fn insert(f: &mut Fixture, payload: Value) -> Value {
    let command = insertion(f, payload);
    f.command(command)
}

#[test]
fn screen_beat_admission_requires_current_resolved_target_revisions() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    let target = resolved(&mut f, &owner);
    let missing = insertion(
        &mut f,
        json!({"type":"showScreen","target":target["binding"]}),
    );
    assert_eq!(f.reject(missing)["error"]["code"], "INVALID_PAYLOAD");

    let mut stale = target["revisions"].clone();
    stale["effects"] = json!("0".repeat(64));
    let changed = insertion(
        &mut f,
        json!({"type":"hideScreen","target":target["binding"],"revisions":stale}),
    );
    assert_eq!(f.reject(changed)["error"]["code"], "SOURCE_CONFLICT");
    let source = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    f.save(
        &json!({"sourcePath":owner["path"]}),
        &source.replace("    pass", "    text \"Updated help\""),
    );
    let changed = insertion(
        &mut f,
        json!({"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}),
    );
    assert_eq!(f.reject(changed)["error"]["code"], "SOURCE_CONFLICT");
    let fresh = resolved(&mut f, &owner);
    let accepted = insert(
        &mut f,
        json!({"type":"showScreen","target":fresh["binding"],"revisions":fresh["revisions"]}),
    );
    assert!(accepted["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["payload"]["type"] == "showScreen"));
}

#[test]
fn creating_a_panel_does_not_adopt_an_exact_existing_custom_source_beat() {
    let mut f = Fixture::new();
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\n    show screen help_panel\n    return\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    let before = f.model()["scenes"][0]["beats"].clone();
    assert_eq!(before[0]["payload"]["type"], "customCode");
    panel(&mut f, "help_panel");
    assert_eq!(f.model()["scenes"][0]["beats"], before);
    let map_path = f.root.join(".renpy-editor/source-map.json");
    let accepted = fs::read(&map_path).unwrap();
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], before);
    assert_eq!(fs::read(&map_path).unwrap(), accepted);
}

#[test]
fn source_name_changes_retain_typed_screen_intent_as_protected_through_reopen() {
    let mut f = Fixture::new();
    let original = panel(&mut f, "help_panel");
    panel(&mut f, "other_panel");
    let scene = f.model()["scenes"][0].clone();
    let source = format!("label {}:\n    show screen help_panel\n    \"Reading continues\"\n    hide screen help_panel\n    return\n", scene["technicalLabel"].as_str().unwrap());
    f.save(&scene, &source);
    let before = f.model()["scenes"][0]["beats"].clone();
    let changed = source.replace("screen help_panel", "screen other_panel");
    f.save(&scene, &changed);
    let after = f.model()["scenes"][0].clone();
    for index in [0, 2] {
        assert_eq!(after["beats"][index]["id"], before[index]["id"]);
        assert_eq!(
            after["beats"][index]["payload"]["target"]["screenId"],
            original["id"]
        );
        assert_eq!(after["beats"][index]["protected"], true);
        assert!(after["beats"][index]["payload"]["revisions"].is_null());
    }
    assert_eq!(after["partial"], true);
    assert_eq!(
        ipc(
            &mut f.service,
            "source.open",
            json!({"path":scene["sourcePath"]})
        )["text"],
        changed
    );
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], after["beats"]);
    let valid = resolved(&mut f, &original);
    let command = json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":after["sourceRevision"],
        "beatId":after["beats"][0]["id"],"expectedBody":{"type":"root"},
        "beat":{"type":"showScreen","target":valid["binding"],"revisions":valid["revisions"]}});
    f.reject(command);
}

#[test]
fn missing_or_replaced_screen_identity_stays_unresolved_without_name_retargeting() {
    for replacement in [false, true] {
        let mut f = Fixture::new();
        let owner = panel(&mut f, "help_panel");
        let target = resolved(&mut f, &owner);
        let scene = f.model()["scenes"][0].clone();
        let source = format!(
            "label {}:\n    show screen help_panel\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        );
        f.save(&scene, &source);
        let before = f.model()["scenes"][0]["beats"][0].clone();
        let scene_bytes = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
        f.service.close().unwrap();
        let map_path = f.root.join(".renpy-editor/source-map.json");
        let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        let original = map["ownedScreens"][0].clone();
        map["ownedScreens"] = json!([]);
        if replacement {
            let mut new = original.clone();
            new["id"] = json!(uuid::Uuid::new_v4().to_string());
            new["rootId"] = json!(uuid::Uuid::new_v4().to_string());
            let screen_path = f.root.join(owner["path"].as_str().unwrap());
            let screen = fs::read_to_string(&screen_path).unwrap().replace(
                original["id"].as_str().unwrap(),
                new["id"].as_str().unwrap(),
            );
            fs::write(&screen_path, screen).unwrap();
            map["ownedScreens"] = json!([new]);
        }
        fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
        f.service.open_path(&f.root).unwrap();
        let after = f.model()["scenes"][0]["beats"][0].clone();
        assert_eq!(after["id"], before["id"]);
        assert_eq!(after["payload"]["type"], "showScreen");
        assert_eq!(after["payload"]["target"]["screenId"], owner["id"]);
        assert_eq!(after["protected"], true);
        assert!(after["payload"]["revisions"].is_null());
        assert_eq!(
            fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
            scene_bytes
        );
        let command = insertion(
            &mut f,
            json!({"type":"hideScreen","target":target["binding"],"revisions":target["revisions"]}),
        );
        assert_eq!(f.reject(command)["error"]["code"], "INCOMING_REFERENCE");
    }
}

#[test]
fn v6_panel_beats_migrate_on_open_without_source_or_identity_changes_and_reopen_is_noop() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\r\n    show screen help_panel\r\n    \"Reading continues\"\r\n    hide screen help_panel\r\n    $ opaque_hook() # preserve\r\n    return\r\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    f.service.close().unwrap();
    let path = f.root.join(scene["sourcePath"].as_str().unwrap());
    let before = fs::read(&path).unwrap();
    let map_path = f.root.join(".renpy-editor/source-map.json");
    let mut old: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    old["schemaVersion"] = json!(6);
    for index in [0, 2] {
        let beat = old["sceneMappings"][0]["beats"][index]
            .as_object_mut()
            .unwrap();
        beat.insert("kind".into(), json!("customCode"));
        beat.remove("screenTarget");
        beat.insert("futurePanelData".into(), json!({"keep":true}));
    }
    let ids = old["sceneMappings"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| b["id"].clone())
        .collect::<Vec<_>>();
    fs::write(&map_path, serde_json::to_vec_pretty(&old).unwrap()).unwrap();

    f.service.open_path(&f.root).unwrap();
    let opened = f.model();
    let beats = opened["scenes"][0]["beats"].as_array().unwrap();
    assert_eq!(beats[0]["payload"]["type"], "showScreen");
    assert_eq!(beats[2]["payload"]["type"], "hideScreen");
    assert_eq!(beats[3]["payload"]["type"], "customCode");
    assert_eq!(
        beats.iter().map(|b| b["id"].clone()).collect::<Vec<_>>(),
        ids
    );
    assert_eq!(beats[0]["payload"]["target"]["screenId"], owner["id"]);
    assert_eq!(beats[2]["payload"]["target"]["screenId"], owner["id"]);
    assert!(!beats[0]["protected"].as_bool().unwrap());
    assert_eq!(opened["canUndo"], false);
    assert_eq!(opened["canRedo"], false);
    assert_eq!(fs::read(&path).unwrap(), before);
    let accepted = fs::read(&map_path).unwrap();
    let mapped: Value = serde_json::from_slice(&accepted).unwrap();
    assert_eq!(mapped["schemaVersion"], 7);
    assert_eq!(
        mapped["sceneMappings"][0]["beats"][0]["futurePanelData"],
        json!({"keep":true})
    );
    assert_eq!(
        mapped["sceneMappings"][0]["beats"][0]["screenTarget"]["screenId"],
        owner["id"]
    );

    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(fs::read(&path).unwrap(), before);
    assert_eq!(fs::read(&map_path).unwrap(), accepted);
    assert_eq!(
        f.model()["scenes"][0]["beats"],
        opened["scenes"][0]["beats"]
    );
}

#[test]
fn show_hide_beats_use_exact_source_stable_identity_one_history_entry_and_fresh_read_revisions() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\n    \"Reading continues\"\n    $ opaque_hook() # preserve\n    return\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    let target = resolved(&mut f, &owner);
    let shown = insert(
        &mut f,
        json!({"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}),
    );
    let beats = shown["scenes"][0]["beats"].as_array().unwrap();
    let show = beats
        .iter()
        .find(|b| b["payload"]["type"] == "showScreen")
        .unwrap()
        .clone();
    let path = scene["sourcePath"].as_str().unwrap();
    let accepted = source.replace("    return\n", "    show screen help_panel\n    return\n");
    let opened = ipc(&mut f.service, "source.open", json!({"path":path}));
    assert_eq!(opened["text"], accepted);
    assert_eq!(show["payload"]["target"], target["binding"]);
    assert!(show["payload"]["revisions"].is_object());
    let accepted_bytes = fs::read(f.root.join(path)).unwrap();
    assert_eq!(
        &accepted_bytes[show["byteStart"].as_u64().unwrap() as usize
            ..show["byteEnd"].as_u64().unwrap() as usize],
        b"    show screen help_panel\n"
    );
    let map_path = f.root.join(".renpy-editor/source-map.json");
    let map_before = fs::read(&map_path).unwrap();
    let map: Value = serde_json::from_slice(&map_before).unwrap();
    let mapped = map["sceneMappings"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["id"] == show["id"])
        .unwrap();
    assert_eq!(mapped["screenTarget"], target["binding"]);
    assert!(mapped.get("revisions").is_none());

    let current = f.model()["scenes"][0].clone();
    f.command(json!({"type":"updateBodyBeat","sceneId":current["id"],"expectedSourceRevision":current["sourceRevision"],
        "beatId":show["id"],"expectedBody":{"type":"root"},"beat":show["payload"]}));
    assert_eq!(fs::read(&map_path).unwrap(), map_before);
    f.command(json!({"type":"undo"}));
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":path}))["text"],
        source
    );
    let redone = f.command(json!({"type":"redo"}));
    assert!(redone["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["id"] == show["id"]));

    let target = resolved(&mut f, &owner);
    insert(
        &mut f,
        json!({"type":"hideScreen","target":target["binding"],"revisions":target["revisions"]}),
    );
    let final_source = accepted.replace("    return\n", "    hide screen help_panel\n    return\n");
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":path}))["text"],
        final_source
    );
    let before_reopen = f.model()["scenes"][0]["beats"].clone();
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], before_reopen);
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":path}))["text"],
        final_source
    );
}
