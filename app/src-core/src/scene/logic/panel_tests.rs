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
fn source_changes_to_multiple_screen_names_retain_each_beats_target_intent() {
    for name in ["other_panel", "missing_panel"] {
        let mut f = Fixture::new();
        let owner = panel(&mut f, "help_panel");
        panel(&mut f, "other_panel");
        for _ in 0..2 {
            let target = resolved(&mut f, &owner);
            insert(
                &mut f,
                json!({"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}),
            );
        }
        let scene = f.model()["scenes"][0].clone();
        let before = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|beat| beat["payload"]["type"] == "showScreen")
            .cloned()
            .collect::<Vec<_>>();
        let original = ipc(
            &mut f.service,
            "source.open",
            json!({"path":scene["sourcePath"]}),
        )["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let changed = original.replace("show screen help_panel", &format!("show screen {name}"));
        f.save(&scene, &changed);
        let after = f.model()["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|beat| beat["payload"]["type"] == "showScreen")
            .cloned()
            .collect::<Vec<_>>();
        assert_eq!(after.len(), 2, "{name}: {after:?}");
        for (old, new) in before.iter().zip(&after) {
            assert_eq!(new["id"], old["id"], "{name}");
            assert_eq!(new["payload"]["target"], old["payload"]["target"]);
            assert_eq!(new["protected"], true);
            assert!(new["payload"]["revisions"].is_null());
        }
        f.undo();
        assert_eq!(
            ipc(
                &mut f.service,
                "source.open",
                json!({"path":scene["sourcePath"]})
            )["text"],
            original
        );
        f.redo();
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        let reopened = f.model()["scenes"][0]["beats"].clone();
        for old in &before {
            let new = reopened
                .as_array()
                .unwrap()
                .iter()
                .find(|beat| beat["id"] == old["id"])
                .unwrap();
            assert_eq!(new["payload"]["target"], old["payload"]["target"]);
            assert_eq!(new["protected"], true);
        }
        assert_eq!(
            ipc(
                &mut f.service,
                "source.open",
                json!({"path":scene["sourcePath"]})
            )["text"],
            changed
        );
    }
}

#[test]
fn ambiguous_screen_source_replacements_stay_custom_after_reopen() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    panel(&mut f, "other_panel");
    for _ in 0..2 {
        let target = resolved(&mut f, &owner);
        insert(
            &mut f,
            json!({"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}),
        );
    }
    let scene = f.model()["scenes"][0].clone();
    let original = ipc(
        &mut f.service,
        "source.open",
        json!({"path":scene["sourcePath"]}),
    )["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let changed = original
        .replacen(
            "show screen help_panel",
            "show screen other_panel\n    show screen other_panel",
            1,
        )
        .replace("show screen help_panel", "show screen other_panel");
    f.save(&scene, &changed);
    let before_reopen = f.model()["scenes"][0]["beats"].clone();
    assert!(!before_reopen
        .as_array()
        .unwrap()
        .iter()
        .any(|beat| beat["payload"]["type"] == "showScreen"));
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], before_reopen);
    assert_eq!(
        ipc(
            &mut f.service,
            "source.open",
            json!({"path":scene["sourcePath"]})
        )["text"],
        changed
    );
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

    let current = resolved(&mut f, &owner);
    let opened = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}));
    let dirty_text = format!("{}# retained draft\n", opened["text"].as_str().unwrap());
    ipc(
        &mut f.service,
        "source.updateDraft",
        json!({"path":owner["path"],"expectedBaseRevision":opened["baseRevision"],"text":dirty_text,"selectionStart":0,"selectionEnd":0}),
    );
    let dirty = insertion(
        &mut f,
        json!({"type":"hideScreen","target":current["binding"],"revisions":current["revisions"]}),
    );
    assert_eq!(f.reject(dirty)["error"]["code"], "DIRTY_SOURCE");
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":owner["path"]}))["text"],
        dirty_text
    );
    ipc(
        &mut f.service,
        "source.discard",
        json!({"path":owner["path"]}),
    );
}

#[test]
fn missing_or_renamed_panel_files_keep_story_identity_and_refuse_prepared_writes() {
    for renamed in [false, true] {
        let mut f = Fixture::new();
        let owner = panel(&mut f, "help_panel");
        let target = resolved(&mut f, &owner);
        let shown = insert(
            &mut f,
            json!({"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}),
        );
        let show = shown["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "showScreen")
            .unwrap()
            .clone();
        let path = f.root.join(owner["path"].as_str().unwrap());
        let before = fs::read(&path).unwrap();
        if renamed {
            let editor = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}));
            f.save(
                &json!({"sourcePath":owner["path"]}),
                &editor["text"]
                    .as_str()
                    .unwrap()
                    .replace("screen help_panel():", "screen renamed_panel():"),
            );
        } else {
            fs::remove_file(&path).unwrap();
        }
        let after = f.model();
        let unresolved = after["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["id"] == show["id"])
            .unwrap();
        assert_eq!(unresolved["payload"]["target"], target["binding"]);
        assert_eq!(unresolved["protected"], true);
        assert!(unresolved["payload"]["revisions"].is_null());
        assert!(unresolved["screenEffects"].is_null());
        let command = insertion(
            &mut f,
            json!({"type":"hideScreen","target":target["binding"],"revisions":target["revisions"]}),
        );
        assert_eq!(f.reject(command)["error"]["code"], "INCOMING_REFERENCE");
        fs::write(&path, before).unwrap();
        let restored = f.model();
        let restored = restored["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["id"] == show["id"])
            .unwrap();
        assert_eq!(restored["protected"], false);
        assert!(restored["payload"]["revisions"].is_object());
        assert!(restored["screenEffects"].is_object());
    }
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
    for destination in ["other_panel", "missing_panel"] {
        let mut f = Fixture::new();
        let original = panel(&mut f, "help_panel");
        panel(&mut f, "other_panel");
        let scene = f.model()["scenes"][0].clone();
        let source = format!("label {}:\n    show screen help_panel\n    \"Reading continues\"\n    hide screen help_panel\n    return\n", scene["technicalLabel"].as_str().unwrap());
        f.save(&scene, &source);
        let before = f.model()["scenes"][0]["beats"].clone();
        let changed = source.replace("screen help_panel", &format!("screen {destination}"));
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
fn inserting_an_identical_screen_statement_does_not_adopt_or_replace_its_opaque_neighbor() {
    let mut f = Fixture::new();
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\n    show screen help_panel\n    return\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    let before = f.model()["scenes"][0].clone();
    let opaque = before["beats"][0].clone();
    let owner = panel(&mut f, "help_panel");
    let target = resolved(&mut f, &owner);
    let accepted = f.command(json!({"type":"insertBeat","sceneId":scene["id"],
        "expectedSourceRevision":before["sourceRevision"],"beforeBeatId":opaque["id"],
        "beat":{"type":"showScreen","target":target["binding"],"revisions":target["revisions"]}}));
    let beats = &accepted["scenes"][0]["beats"];
    assert_eq!(beats[0]["payload"]["type"], "showScreen");
    assert_ne!(beats[0]["id"], opaque["id"]);
    assert_eq!(beats[1]["payload"]["type"], "customCode");
    assert_eq!(beats[1]["id"], opaque["id"]);
    f.undo();
    assert_eq!(f.model()["scenes"][0]["beats"], before["beats"]);
    let redone = f.redo();
    assert_eq!(redone["scenes"][0]["beats"], accepted["scenes"][0]["beats"]);
}

#[test]
fn an_explicit_picker_update_changes_the_target_in_one_history_entry_and_preserves_the_beat_id() {
    for legacy in [false, true] {
        let mut f = Fixture::new();
        let original = panel(&mut f, "help_panel");
        let other = panel(&mut f, "other_panel");
        let first = resolved(&mut f, &original);
        let shown = insert(
            &mut f,
            json!({"type":"showScreen","target":first["binding"],"revisions":first["revisions"]}),
        );
        let scene = shown["scenes"][0].clone();
        let show = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "showScreen")
            .unwrap()
            .clone();
        let selected = resolved(&mut f, &other);
        let mut command = json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],
            "beatId":show["id"],"expectedBody":{"type":"root"},
            "beat":{"type":"showScreen","target":selected["binding"],"revisions":selected["revisions"]}});
        if legacy {
            command["type"] = json!("updateBeat");
            command.as_object_mut().unwrap().remove("expectedBody");
        }
        let updated = f.command(command);
        let after = updated["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["id"] == show["id"])
            .unwrap();
        assert_eq!(after["payload"]["target"], selected["binding"]);
        assert_eq!(after["protected"], false);
        assert!(after["payload"]["revisions"].is_object());
        let undone = f.undo();
        assert_eq!(undone["scenes"][0]["beats"], shown["scenes"][0]["beats"]);
        let redone = f.redo();
        assert_eq!(redone["scenes"][0]["beats"], updated["scenes"][0]["beats"]);
    }
}

#[test]
fn derived_screen_effects_share_the_target_revision_and_keep_custom_effects_unknown() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    let source = ipc(&mut f.service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    f.save(
        &json!({"sourcePath":owner["path"]}),
        &source.replace("    pass", "    text \"[creator_function()]\""),
    );
    let scene = f.model()["scenes"][0].clone();
    f.save(
        &scene,
        &format!(
            "label {}:\n    show screen help_panel\n    hide screen help_panel\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        ),
    );
    let model = f.model();
    for beat in model["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .take(2)
    {
        assert_eq!(beat["screenEffects"]["unknown"], true);
        assert_eq!(
            beat["screenEffects"]["revision"],
            beat["payload"]["revisions"]["effects"]
        );
    }
    let before = model["scenes"][0]["beats"][0]["screenEffects"]["revision"].clone();
    f.save(&json!({"sourcePath":owner["path"]}), &source);
    let current = f.model();
    let beat = &current["scenes"][0]["beats"][0];
    assert_eq!(beat["id"], model["scenes"][0]["beats"][0]["id"]);
    assert_eq!(beat["screenEffects"]["unknown"], false);
    assert_ne!(beat["screenEffects"]["revision"], before);
    assert_eq!(
        beat["screenEffects"]["revision"],
        beat["payload"]["revisions"]["effects"]
    );
    let mapped: Value =
        serde_json::from_slice(&fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap())
            .unwrap();
    assert!(mapped["sceneMappings"][0]["beats"][0]
        .get("screenEffects")
        .is_none());
}

#[test]
fn screen_beats_preserve_the_existing_unknown_flow_diagnostic() {
    for operation in ["show", "hide"] {
        let mut f = Fixture::new();
        panel(&mut f, "help_panel");
        let scene = f.model()["scenes"][0].clone();
        f.save(
            &scene,
            &format!(
                "label {}:\n    {operation} screen help_panel\n    return\n",
                scene["technicalLabel"].as_str().unwrap()
            ),
        );
        let flow = ipc(&mut f.service, "flow.list", json!({}));
        assert!(flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .any(|edge| edge["sceneId"] == scene["id"] && edge["kind"] == "unknown"));
    }
}

#[test]
fn screen_comments_and_trailing_space_keep_source_bytes_identity_and_target_intent() {
    let mut f = Fixture::new();
    let owner = panel(&mut f, "help_panel");
    panel(&mut f, "other_panel");
    let scene = f.model()["scenes"][0].clone();
    let source = format!(
        "label {}:\r\n    show screen help_panel\r\n    hide screen help_panel\r\n    return\r\n",
        scene["technicalLabel"].as_str().unwrap()
    );
    f.save(&scene, &source);
    let before = f.model()["scenes"][0]["beats"].clone();
    let commented = source
        .replace(
            "show screen help_panel\r\n",
            "show screen help_panel \t# keep show\r\n",
        )
        .replace(
            "hide screen help_panel\r\n",
            "hide screen help_panel\t # keep hide  \r\n",
        );
    f.save(&scene, &commented);
    let accepted = f.model()["scenes"][0]["beats"].clone();
    for index in [0, 1] {
        assert_eq!(accepted[index]["id"], before[index]["id"]);
        assert_eq!(
            accepted[index]["payload"]["target"]["screenId"],
            owner["id"]
        );
        assert_eq!(accepted[index]["protected"], false);
        assert!(accepted[index]["payload"]["revisions"].is_object());
    }
    assert_eq!(
        ipc(
            &mut f.service,
            "source.open",
            json!({"path":scene["sourcePath"]})
        )["text"],
        commented
    );
    let bytes = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], accepted);
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        bytes
    );
    let changed = commented.replace("screen help_panel", "screen other_panel");
    f.save(&scene, &changed);
    let unresolved = f.model()["scenes"][0]["beats"].clone();
    for index in [0, 1] {
        assert_eq!(unresolved[index]["id"], before[index]["id"]);
        assert_eq!(
            unresolved[index]["payload"]["target"]["screenId"],
            owner["id"]
        );
        assert_eq!(unresolved[index]["protected"], true);
        assert!(unresolved[index]["payload"]["revisions"].is_null());
    }
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], unresolved);
    assert_eq!(
        ipc(
            &mut f.service,
            "source.open",
            json!({"path":scene["sourcePath"]})
        )["text"],
        changed
    );
    for statement in [
        "show screen help_panel() # parameters stay opaque",
        "show screen expression target_name # dynamic name",
        "hide screen \"help_panel\" # quoted name",
    ] {
        let opaque = format!(
            "label {}:\n    {statement}\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        );
        f.save(&scene, &opaque);
        let beat = f.model()["scenes"][0]["beats"][0].clone();
        assert_eq!(beat["payload"]["type"], "customCode");
        assert_eq!(beat["protected"], true);
        assert!(beat["payload"]["target"].is_null());
        assert_eq!(
            ipc(
                &mut f.service,
                "source.open",
                json!({"path":scene["sourcePath"]})
            )["text"],
            opaque
        );
    }
}

#[test]
fn picker_updates_patch_only_screen_name_tokens_and_keep_comments_spacing_and_noop_history() {
    for legacy in [true, false] {
        let mut f = Fixture::new();
        panel(&mut f, "help_panel");
        let other = panel(&mut f, "other_panel");
        let scene = f.model()["scenes"][0].clone();
        let mut expected = format!("label {}:\r\n    show screen help_panel \t# keep show\r\n    hide screen help_panel\t # keep hide  \r\n    return\r\n", scene["technicalLabel"].as_str().unwrap());
        f.save(&scene, &expected);
        for index in [0, 1] {
            let current = f.model()["scenes"][0].clone();
            let beat = &current["beats"][index];
            let target = resolved(&mut f, &other);
            let mut command = json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":current["sourceRevision"],
                "beatId":beat["id"],"expectedBody":{"type":"root"},
                "beat":{"type":beat["payload"]["type"],"target":target["binding"],"revisions":target["revisions"]}});
            if legacy {
                command["type"] = json!("updateBeat");
                command.as_object_mut().unwrap().remove("expectedBody");
            }
            let updated = f.command(command.clone());
            let changed = expected.replacen("screen help_panel", "screen other_panel", 1);
            assert_eq!(
                ipc(
                    &mut f.service,
                    "source.open",
                    json!({"path":scene["sourcePath"]})
                )["text"],
                changed
            );
            assert_eq!(updated["scenes"][0]["beats"][index]["id"], beat["id"]);
            let target = resolved(&mut f, &other);
            command["expectedSourceRevision"] = updated["scenes"][0]["sourceRevision"].clone();
            command["beat"]["revisions"] = target["revisions"].clone();
            f.command(command);
            f.undo();
            assert_eq!(
                ipc(
                    &mut f.service,
                    "source.open",
                    json!({"path":scene["sourcePath"]})
                )["text"],
                expected
            );
            f.redo();
            assert_eq!(
                ipc(
                    &mut f.service,
                    "source.open",
                    json!({"path":scene["sourcePath"]})
                )["text"],
                changed
            );
            expected = changed;
        }
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
    assert_eq!(
        ipc(&mut f.service, "history.state", json!({})),
        json!({"undo":null,"redo":null})
    );
    assert_eq!(fs::read(&path).unwrap(), before);
    let accepted = fs::read(&map_path).unwrap();
    let mapped: Value = serde_json::from_slice(&accepted).unwrap();
    assert_eq!(
        mapped["schemaVersion"],
        crate::metadata::SOURCE_MAP_SCHEMA_VERSION
    );
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
    f.undo();
    assert_eq!(
        ipc(&mut f.service, "source.open", json!({"path":path}))["text"],
        source
    );
    let redone = f.redo();
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
