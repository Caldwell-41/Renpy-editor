use super::*;

#[test]
fn resolved_screen_targets_bind_identity_and_reject_stale_or_renamed_source() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let binding = json!({"screenId":owner["id"], "sourceName":"notes"});
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(before["binding"], binding);
    assert_eq!(before["kind"], "panel");
    assert_eq!(before["effects"]["unknown"], false);
    assert_eq!(before["effects"]["hiddenScreens"], json!([]));
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.canvasPlan",
            json!({
                "path":owner["path"],"screenName":"notes","expectedRevision":document["revision"],
                "width":1280,"height":720,"addition":{"parentStart":document["screens"][0]["nodes"][0]["span"]["start"],"kind":"use","text":""}
            })
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );

    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &owner,
        &source.replace("    pass", "    text \"Changed\""),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({
                "binding":binding, "expected":before["revisions"]
            })
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
    let fresh = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_ne!(
        fresh["revisions"]["effects"],
        before["revisions"]["effects"]
    );

    save_composition_source(
        &mut service,
        &owner,
        &source.replace("screen notes():", "screen renamed():"),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":binding})
        )["error"]["code"],
        "INCOMING_REFERENCE"
    );
}

#[test]
fn dynamic_text_and_custom_actions_keep_screen_effects_unknown() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &owner,
        &source.replace("    pass", "    text \"[creator_function()]\""),
    );
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({
            "binding":{"screenId":owner["id"],"sourceName":"notes"}
        }),
    );
    assert_eq!(target["effects"]["unknown"], true);
}

#[test]
fn help_starter_creation_is_one_source_and_metadata_history_transaction() {
    let (temporary, mut service, root, _) = composition_project();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let chosen = temporary.path().join("seal.png");
    fs::write(
        &chosen,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    let imported = ipc(
        &mut service,
        "asset.import",
        json!({
            "authorityId":choice.authority_id,"kind":"uiImage","technicalName":"seal",
            "displayName":"Seal","characterId":null,"expression":null
        }),
    );
    let image = &imported["assets"][0];
    let before_map = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"help_panel", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"],
            "starter":{"title":"Help","explanation":"Continue reading.","assetId":image["id"],
                "expectedAssetSha256":image["sha256"],"width":80,"height":40}
        }),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|o| o["name"] == "help_panel")
        .unwrap();
    assert_eq!(owner["kind"], "panel");
    let path = root.join("game/ui/help_panel.rpy");
    let source = fs::read(&path).unwrap();
    assert!(String::from_utf8_lossy(&source).contains("action Hide(\"help_panel\")"));
    let effects = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":owner["id"],"sourceName":"help_panel"
        }}),
    );
    assert_eq!(effects["effects"]["unknown"], false);
    assert_eq!(effects["effects"]["hiddenScreens"], json!([owner["id"]]));
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({
            "path":owner["path"],"screenName":"help_panel","expectedRevision":document["revision"],
            "width":1280,"height":720,"buttonState":"normal"
        }),
    );
    assert_eq!(plan["available"], true, "{plan}");
    let nodes = document["screens"][0]["nodes"].as_array().unwrap();
    let close = nodes.iter().find(|n| n["kind"] == "textbutton").unwrap();
    let heading = nodes.iter().find(|n| n["kind"] == "text").unwrap();
    ipc(
        &mut service,
        "screens.compose",
        json!({
            "screenId":owner["id"],"expectedRevision":document["revision"],
            "command":{"type":"reorder","nodeId":close["id"],"targetId":heading["id"],"after":false}
        }),
    );
    let moved = fs::read_to_string(&path).unwrap();
    assert!(moved.find("textbutton \"Close\"").unwrap() < moved.find("text \"Help\"").unwrap());
    assert_eq!(moved.matches("Hide(\"help_panel\")").count(), 2);
    composition_history(&mut service, "undo");
    assert_eq!(fs::read(&path).unwrap(), source);
    composition_history(&mut service, "undo");
    assert!(!path.exists());
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before_map
    );
    assert!(root.join("game/images/ui seal.png").exists());
    composition_history(&mut service, "redo");
    assert_eq!(fs::read(&path).unwrap(), source);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(fs::read(&path).unwrap(), source);
    let source_text = String::from_utf8(source.clone()).unwrap();
    for invalid in [
        source_text.replace(
            "                default_focus True",
            "                default_focus True\n                default_focus True",
        ),
        source_text.replace(
            "                action Hide(\"help_panel\")",
            "                action Hide(\"different_panel\")",
        ),
    ] {
        fs::write(&path, &invalid).unwrap();
        let current = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({
                    "screenId":owner["id"],"expectedRevision":current["revision"],
                    "command":{"type":"reorder","nodeId":close["id"],"targetId":heading["id"],"after":false}
                })
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(fs::read_to_string(&path).unwrap(), invalid);
        let effects = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":{
                "screenId":owner["id"],"sourceName":"help_panel"
            }}),
        );
        assert_eq!(effects["effects"]["unknown"], true);
    }
}

#[test]
fn marked_component_uses_resolve_by_identity_and_preserve_changed_name_intent() {
    let (_temporary, mut service, root, panel) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"details", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"], "expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let component = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|o| o["name"] == "details")
        .unwrap();
    let child = compose_command(
        &mut service,
        component,
        json!({
            "type":"add","parentId":component["rootId"],"kind":"text","text":"Styled component"
        }),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        component,
        json!({
            "type":"formatText","nodeId":child["selectedId"],"values":{"color":"#eeeeee"},
            "style":{"scope":"create","name":"component_body","expectedRevision":catalog["styles"]["revision"]}
        }),
    );
    let use_id = uuid::Uuid::new_v4().to_string();
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    map["ownedScreens"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|o| o["id"] == component["id"])
        .unwrap()["kind"] = json!("component");
    map["componentUses"] =
        json!([{"screenId":panel["id"],"nodeId":use_id,"componentId":component["id"]}]);
    fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
    let path = root.join(panel["path"].as_str().unwrap());
    let original = fs::read_to_string(&path).unwrap();
    let source = original.replace(
        "    pass",
        &format!("    use details # loomlight-element: {use_id}"),
    );
    fs::write(&path, &source).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":panel["path"]}),
    );
    let usage = &doc["screens"][0]["nodes"][1];
    assert_eq!(usage["kind"], "use");
    assert_eq!(usage["id"], use_id);
    assert_eq!(usage["component"]["componentId"], component["id"]);
    assert_eq!(usage["component"]["resolved"], true);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["styles"]["error"], Value::Null, "{catalog}");
    let definition = catalog["styles"]["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["name"] == "component_body")
        .unwrap();
    assert!(definition["uses"]
        .as_array()
        .unwrap()
        .iter()
        .any(|usage| usage["screenName"] == "notes"));
    let component_doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":component["path"]}),
    );
    let styled_node = component_doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["id"] == child["selectedId"])
        .unwrap();
    let layout = json!({"path":component["path"],"screenName":"details",
        "expectedRevision":component_doc["revision"],"nodeStart":styled_node["span"]["start"],
        "values":{"xsize":{"unit":"pixels","value":300}}});
    assert_eq!(
        reject(&mut service, "screens.setLayout", layout.clone())["error"]["code"],
        "INVALID_PAYLOAD"
    );
    let review = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":component["id"],"sourceName":"details"
        }}),
    );
    let original_component = fs::read(root.join("game/ui/details.rpy")).unwrap();
    let mut reviewed_layout = layout;
    reviewed_layout["componentRevisions"] = review["revisions"].clone();
    ipc(&mut service, "screens.setLayout", reviewed_layout);
    assert!(fs::read_to_string(root.join("game/ui/details.rpy"))
        .unwrap()
        .contains("xsize 300"));
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read(root.join("game/ui/details.rpy")).unwrap(),
        original_component
    );
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":panel["id"],"sourceName":"notes"}}),
    );
    assert_eq!(before["effects"]["unknown"], false);
    let component_source = fs::read(root.join("game/ui/details.rpy")).unwrap();
    let component_doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":component["path"]}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({
                "screenId":component["id"],"expectedRevision":component_doc["revision"],
                "command":{"type":"add","parentId":component["rootId"],"kind":"text","text":"Shared"}
            })
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(
        fs::read(root.join("game/ui/details.rpy")).unwrap(),
        component_source
    );
    let review = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":component["id"],"sourceName":"details"
        }}),
    );
    let applied = ipc(
        &mut service,
        "screens.compose",
        json!({
            "screenId":component["id"],"expectedRevision":component_doc["revision"],"componentRevisions":review["revisions"],
            "command":{"type":"add","parentId":component["rootId"],"kind":"text","text":"Shared"}
        }),
    );
    let returned_panel = applied["documents"]
        .as_array()
        .unwrap()
        .iter()
        .find(|doc| doc["path"] == panel["path"])
        .unwrap();
    assert_eq!(
        returned_panel["screens"][0]["nodes"][1]["component"]["sourceRevision"],
        applied["document"]["revision"]
    );
    let shared = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":panel["id"],"sourceName":"notes"
        }}),
    );
    assert_ne!(shared["effects"]["revision"], before["effects"]["revision"]);
    let opened = ipc(&mut service, "source.open", json!({"path":panel["path"]}));
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({
            "path":panel["path"],"expectedBaseRevision":opened["baseRevision"],
            "text":format!("{source}# retained draft\n"),"selectionStart":4,"selectionEnd":4
        }),
    );
    let review = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":component["id"],"sourceName":"details"
        }}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({
                "screenId":component["id"],"expectedRevision":review["revisions"]["source"],
                "componentRevisions":review["revisions"],
                "command":{"type":"add","parentId":component["rootId"],"kind":"text","text":"Blocked"}
            })
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":panel["path"]}))["text"],
        draft["text"]
    );
    ipc(
        &mut service,
        "source.discard",
        json!({"path":panel["path"]}),
    );
    fs::write(&path, source.replace("use details", "use different_name")).unwrap();
    let changed = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":panel["path"]}),
    );
    assert_eq!(
        changed["screens"][0]["nodes"][1]["component"]["componentId"],
        component["id"]
    );
    assert_eq!(
        changed["screens"][0]["nodes"][1]["component"]["resolved"],
        false
    );
    let after = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":panel["id"],"sourceName":"notes"}}),
    );
    assert_eq!(after["effects"]["unknown"], true);
    let incomplete = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":component["id"],"sourceName":"details"
        }}),
    );
    let before_refusal = fs::read(root.join("game/ui/details.rpy")).unwrap();
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({
                "screenId":component["id"],"expectedRevision":incomplete["revisions"]["source"],
                "componentRevisions":incomplete["revisions"],
                "command":{"type":"add","parentId":component["rootId"],"kind":"text","text":"Unreviewed scope"}
            })
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(
        fs::read(root.join("game/ui/details.rpy")).unwrap(),
        before_refusal
    );
    fs::write(&path, &source).unwrap();
    let cycle_id = uuid::Uuid::new_v4().to_string();
    let mut cycle_map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    cycle_map["componentUses"]
        .as_array_mut()
        .unwrap()
        .push(json!({
            "screenId":component["id"],"nodeId":cycle_id,"componentId":component["id"]
        }));
    fs::write(&map_path, serde_json::to_vec_pretty(&cycle_map).unwrap()).unwrap();
    let cycle_source = String::from_utf8(before_refusal).unwrap().replacen(
        "screen details():\n",
        &format!("screen details():\n    use details # loomlight-element: {cycle_id}\n"),
        1,
    );
    fs::write(root.join("game/ui/details.rpy"), &cycle_source).unwrap();
    let cyclic = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
            "screenId":component["id"],"sourceName":"details"
        }}),
    );
    assert_eq!(cyclic["effects"]["unknown"], true);
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({
                "screenId":component["id"],"expectedRevision":cyclic["revisions"]["source"],
                "componentRevisions":cyclic["revisions"],
                "command":{"type":"add","parentId":component["rootId"],"kind":"text","text":"Cyclic scope"}
            })
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(
        fs::read_to_string(root.join("game/ui/details.rpy")).unwrap(),
        cycle_source
    );
}
