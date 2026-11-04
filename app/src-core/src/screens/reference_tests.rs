use super::*;

#[test]
fn large_marked_screen_retains_per_button_action_authority() {
    let (_temporary, mut service, _, owner) = composition_project();
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let mut buttons = String::new();
    let mut last_id = String::new();
    for index in 0..2048 {
        let id = uuid::Uuid::new_v4().to_string();
        let action = match index {
            0 => "Return()",
            1 => "Function(custom)",
            2 => "Null()\n        action Null()",
            _ => "Null()",
        };
        buttons.push_str(&format!("    textbutton \"Button {index}\": # loomlight-element: {id}\n        action {action} # keep {index}\n"));
        last_id = id;
    }
    let source = original.replace("    pass\n", &buttons);
    save_composition_source(&mut service, &owner, &source);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let nodes = document["screens"][0]["nodes"].as_array().unwrap();
    assert_eq!(nodes.len(), 2049);
    assert_eq!(
        nodes
            .iter()
            .filter(|node| node["dismissal"] == "none")
            .count(),
        2045
    );
    for node in nodes
        .iter()
        .filter(|node| node["kind"] == "textbutton")
        .take(3)
    {
        assert!(node["dismissal"].is_null());
        assert!(!node["protected"].as_array().unwrap().is_empty());
    }
    compose_command(
        &mut service,
        &owner,
        json!({"type":"dismissal","nodeId":last_id,"action":"hideScreen"}),
    );
    let expected = source.replace(
        "action Null() # keep 2047",
        "action Hide(\"notes\") # keep 2047",
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
}

#[test]
fn nonblocking_dialog_keeps_return_source_protected_but_null_editable() {
    let (_temporary, mut service, _, _) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"modal_guard", "kind":"dialog",
            "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],
            "expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "modal_guard")
        .unwrap();
    let finish = compose_command(
        &mut service,
        owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Finish"}),
    );
    let inert = compose_command(
        &mut service,
        owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Optional"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replacen("action Null()", "action Return() # keep finish", 1)
        + "    $ custom = ['untouched', 17] # keep custom\n";
    for modal in [
        "",
        "modal False",
        "modal flag",
        "modal True\n    modal True",
    ] {
        let source = original.replace("modal True", modal);
        save_composition_source(&mut service, owner, &source);
        let target = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":{
            "screenId":owner["id"],"sourceName":owner["name"]}}),
        );
        assert_eq!(target["blocking"], false, "{modal}");
        assert_eq!(target["effects"]["unknown"], true, "{modal}");
        assert_eq!(target["effects"]["finishesInteraction"], false, "{modal}");
        let document = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let nodes = document["screens"][0]["nodes"].as_array().unwrap();
        let button = nodes
            .iter()
            .find(|node| node["id"] == finish["selectedId"])
            .unwrap();
        assert!(button["dismissal"].is_null(), "{modal}");
        assert!(
            !button["protected"].as_array().unwrap().is_empty(),
            "{modal}"
        );
        let root = nodes
            .iter()
            .find(|node| node["id"] == owner["rootId"])
            .unwrap();
        assert!(
            root["protected"].as_array().unwrap().iter().any(|span| {
                source[span["start"].as_u64().unwrap() as usize
                    ..span["end"].as_u64().unwrap() as usize]
                    .contains("key \"game_menu\" action Return()")
            }),
            "{modal}"
        );
        for command in [
            json!({"type":"remove","nodeId":finish["selectedId"]}),
            json!({"type":"dismissal","nodeId":inert["selectedId"],"action":"finishInteraction"}),
        ] {
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":owner["id"],
                "expectedRevision":document["revision"],"command":command}),
            );
            assert_eq!(
                ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
                source
            );
        }
        assert_eq!(
            nodes
                .iter()
                .find(|node| node["id"] == inert["selectedId"])
                .unwrap()["dismissal"],
            "none"
        );
        compose_command(
            &mut service,
            owner,
            json!({"type":"remove","nodeId":inert["selectedId"]}),
        );
        let removed = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        assert!(removed.contains("action Return() # keep finish"));
        assert!(removed.contains("    $ custom = ['untouched', 17] # keep custom\n"));
        composition_history(&mut service, "undo");
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
    }
    save_composition_source(&mut service, owner, &original);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        document["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|node| node["id"] == finish["selectedId"])
            .unwrap()["dismissal"],
        "finishInteraction"
    );
    compose_command(
        &mut service,
        owner,
        json!({"type":"remove","nodeId":finish["selectedId"]}),
    );
}

#[test]
fn inspection_exposes_only_owned_unique_qualified_dismissal_capabilities() {
    for kind in ["panel", "dialog"] {
        let (_temporary, mut service, _, _) = composition_project();
        let catalog = ipc(&mut service, "screens.list", json!({}));
        let name = format!("inspection_{kind}");
        let created = ipc(
            &mut service,
            "screens.create",
            json!({
                "name":name,"kind":kind,"expectedProjectRevision":catalog["projectRevision"],
                "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]
            }),
        );
        let owner = created["owned"]
            .as_array()
            .unwrap()
            .iter()
            .find(|item| item["name"] == name)
            .unwrap();
        let added = compose_command(
            &mut service,
            owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Done"}),
        );
        let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let hide = format!("Hide({})", serde_json::to_string(&name).unwrap());
        for (expression, expected) in [
            ("Null()", json!("none")),
            (
                "Return()",
                if kind == "dialog" {
                    json!("finishInteraction")
                } else {
                    Value::Null
                },
            ),
            (
                hide.as_str(),
                if kind == "panel" {
                    json!("hideScreen")
                } else {
                    Value::Null
                },
            ),
            ("Function(custom)", Value::Null),
            ("[Null(), Return()]", Value::Null),
            ("Null()\n        action Null()", Value::Null),
        ] {
            save_composition_source(
                &mut service,
                owner,
                &original.replace("action Null()", &format!("action {expression} # retained")),
            );
            let document = ipc(
                &mut service,
                "screens.inspect",
                json!({"path":owner["path"]}),
            );
            let node = document["screens"][0]["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|node| node["id"] == added["selectedId"])
                .unwrap();
            assert_eq!(node["dismissal"], expected, "{kind}: {expression}");
        }
        let duplicate = original
            .lines()
            .find(|line| line.contains("textbutton"))
            .unwrap();
        save_composition_source(
            &mut service,
            owner,
            &format!("{original}{duplicate}\n        action Null()\n"),
        );
        let document = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        for node in document["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|node| node["kind"] == "textbutton")
        {
            assert!(node["id"].is_null());
            assert!(node["dismissal"].is_null());
        }
    }
}

#[test]
fn inert_button_action_stays_editable_and_extractable() {
    let (_temporary, mut service, root, owner) = composition_project();
    let group = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    );
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":group["selectedId"],"kind":"textbutton","text":"Optional"}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("action Null()", "action Null() # keep inert");
    save_composition_source(&mut service, &owner, &source);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    ipc(
        &mut service,
        "screens.componentPrepareExtract",
        json!({
        "screenId":owner["id"],"nodeId":group["selectedId"],"expectedRevision":document["revision"]}),
    );
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
        "screenId":owner["id"],"sourceName":owner["name"]}}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    ipc(
        &mut service,
        "screens.componentExtract",
        json!({
        "target":target["binding"],"expected":target["revisions"],
        "expectedProjectRevision":catalog["projectRevision"],"nodeId":group["selectedId"],"name":"inert_content"}),
    );
    let copied = fs::read_to_string(root.join("game/ui/inert_content.rpy")).unwrap();
    assert!(copied.contains("action Null() # keep inert"));
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let component = catalog["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "inert_content")
        .unwrap();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":component["path"]}),
    );
    let inert = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["kind"] == "textbutton")
        .unwrap();
    assert!(inert["dismissal"].is_null());
    assert_eq!(inert["actions"], json!([]));
    assert!(inert["protected"].as_array().unwrap().is_empty());
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
        "screenId":component["id"],"sourceName":component["name"]}}),
    );
    assert_eq!(target["effects"]["unknown"], false);
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":component["id"],"expectedRevision":document["revision"],
        "componentRevisions":target["revisions"],"command":{"type":"actions","nodeId":inert["id"],"actions":[],
        "expectedAuthoringRevision":document["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    ipc(
        &mut service,
        "screens.compose",
        json!({"screenId":component["id"],"expectedRevision":document["revision"],
            "componentRevisions":target["revisions"],"command":{"type":"remove","nodeId":inert["id"]}}),
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(
            &mut service,
            "source.open",
            json!({"path":component["path"]})
        )["text"],
        copied
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
    compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":button["selectedId"]}),
    );
    let removed = fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap();
    assert!(!removed.contains("Optional") && !removed.contains("Null()"));
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}

#[test]
fn blank_dialog_creation_uses_one_transaction_and_rejects_component_kind() {
    let (_temporary, mut service, root, _) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    let mut request = json!({"name":"blank_dialog","kind":"component",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]});
    assert_eq!(
        reject(&mut service, "screens.create", request.clone())["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
    request["kind"] = json!("dialog");
    let created = ipc(&mut service, "screens.create", request);
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "blank_dialog")
        .unwrap();
    assert_eq!(owner["kind"], "dialog");
    let accepted = fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap();
    assert!(accepted.contains("    modal True\n    key \"game_menu\" action Return()\n    pass\n"));
    let after = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    composition_history(&mut service, "undo");
    assert!(!root.join(owner["path"].as_str().unwrap()).exists());
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        after
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{
        "screenId":owner["id"],"sourceName":owner["name"]}}),
    );
    assert_eq!(target["blocking"], true);
    assert_eq!(target["effects"]["unknown"], false);
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        accepted
    );
}

#[test]
fn dialog_target_reports_revision_bound_finish_without_hiding_a_panel() {
    let (_temporary, mut service, root, owner) = composition_project();
    service.close().unwrap();
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    map["schemaVersion"] = json!(8);
    let entry = map["ownedScreens"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|screen| screen["id"] == owner["id"])
        .unwrap();
    entry["kind"] = json!("dialog");
    fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
    service.open_path(&root).unwrap();
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(&mut service, &owner, &source.replace("    pass",
        "    modal True\n    key \"game_menu\" action Return()\n    textbutton \"Close\":\n        action Return()\n        default_focus True"));
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({
            "binding":{"screenId":owner["id"],"sourceName":owner["name"]}
        }),
    );
    assert_eq!(target["kind"], "dialog");
    assert_eq!(target["blocking"], true);
    assert_eq!(target["effects"]["unknown"], false);
    assert_eq!(target["effects"]["finishesInteraction"], true);
    assert_eq!(target["effects"]["hiddenScreens"], json!([]));
    assert!(target["effects"]["dependencies"]
        .as_array()
        .unwrap()
        .iter()
        .any(|dependency| dependency["id"].as_str().unwrap().ends_with(":action")));
    let accepted = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    for modal in [
        "",
        "modal False",
        "modal flag",
        "modal True\n    modal True",
    ] {
        save_composition_source(&mut service, &owner, &accepted.replace("modal True", modal));
        let invalid = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":target["binding"]}),
        );
        assert_eq!(invalid["blocking"], false, "{modal}");
        assert_eq!(invalid["effects"]["unknown"], true, "{modal}");
    }
    save_composition_source(&mut service, &owner, &accepted);
    let revised = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("action Return()", "action Return(1)");
    save_composition_source(&mut service, &owner, &revised);
    let unresolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":target["binding"]}),
    );
    assert_eq!(unresolved["effects"]["unknown"], true);
    assert_eq!(unresolved["effects"]["finishesInteraction"], false);
    assert_ne!(
        unresolved["revisions"]["effects"],
        target["revisions"]["effects"]
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({
                "binding":target["binding"],"expected":target["revisions"]
            })
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
}

#[test]
fn component_ipc_prepares_extracts_places_reviews_and_copies_with_typed_requests() {
    let (_temporary, mut service, root, panel) = composition_project();
    let group = compose_command(
        &mut service,
        &panel,
        json!({"type":"add","parentId":panel["rootId"],"kind":"vbox","text":""}),
    );
    compose_command(
        &mut service,
        &panel,
        json!({"type":"add","parentId":group["selectedId"],"kind":"text","text":"Shared"}),
    );
    let resolve = |service: &mut LifecycleService, owner: &Value| {
        ipc(
            service,
            "screens.resolveTarget",
            json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}}),
        )
    };
    let target = resolve(&mut service, &panel);
    let source_before = fs::read(root.join(panel["path"].as_str().unwrap())).unwrap();
    let prepared = ipc(
        &mut service,
        "screens.componentPrepareExtract",
        json!({
            "screenId":panel["id"],"nodeId":group["selectedId"],"expectedRevision":target["revisions"]["source"]
        }),
    );
    assert!(prepared["source"].as_str().unwrap().contains("Shared"));
    assert_eq!(
        fs::read(root.join(panel["path"].as_str().unwrap())).unwrap(),
        source_before
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let extracted = ipc(
        &mut service,
        "screens.componentExtract",
        json!({
            "target":target["binding"],"expected":target["revisions"],
            "expectedProjectRevision":catalog["projectRevision"],"nodeId":group["selectedId"],"name":"shared_details"
        }),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let component = catalog["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["id"] == extracted["componentId"])
        .unwrap()
        .clone();
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"other_panel","expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let other = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "other_panel")
        .unwrap()
        .clone();
    let component_target = resolve(&mut service, &component);
    let other_target = resolve(&mut service, &other);
    let placed = ipc(
        &mut service,
        "screens.componentPlace",
        json!({
            "component":component_target["binding"],"expectedComponent":component_target["revisions"],
            "target":other_target["binding"],"expectedTarget":other_target["revisions"],"parentId":other["rootId"]
        }),
    );
    let review = ipc(
        &mut service,
        "screens.componentReview",
        json!({"componentId":component["id"]}),
    );
    assert_eq!(review["complete"], true);
    assert_eq!(review["affectedScreens"].as_array().unwrap().len(), 2);
    assert_eq!(review["uses"].as_array().unwrap().len(), 2);
    assert_eq!(
        reject(
            &mut service,
            "screens.componentReview",
            json!({
                "componentId":component["id"],"unchecked":true
            })
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );
    let target = resolve(&mut service, &other);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let map_before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    let other_before = fs::read(root.join(other["path"].as_str().unwrap())).unwrap();
    let copied = ipc(
        &mut service,
        "screens.componentCopy",
        json!({
            "target":target["binding"],"expectedTarget":target["revisions"],"useId":placed["useId"],
            "expectedComponent":review["component"]["revisions"],"expectedProjectRevision":catalog["projectRevision"],
            "name":"independent_details"
        }),
    );
    assert_eq!(copied["useId"], placed["useId"]);
    assert_ne!(copied["componentId"], component["id"]);
    assert!(
        fs::read_to_string(root.join(other["path"].as_str().unwrap()))
            .unwrap()
            .contains("use independent_details")
    );
    assert!(
        fs::read_to_string(root.join(panel["path"].as_str().unwrap()))
            .unwrap()
            .contains("use shared_details")
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read(root.join(other["path"].as_str().unwrap())).unwrap(),
        other_before
    );
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        map_before
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(
            &mut service,
            "screens.componentReview",
            json!({"componentId":copied["componentId"]})
        )["complete"],
        true
    );
}

#[test]
fn removing_a_component_subtree_prunes_only_its_use_bindings_in_one_history_entry() {
    let (_temporary, mut service, root, panel) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"details", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],
            "expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let component = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "details")
        .unwrap();
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    map["ownedScreens"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|owner| owner["id"] == component["id"])
        .unwrap()["kind"] = json!("component");
    let group_id = uuid::Uuid::new_v4().to_string();
    let removed_id = uuid::Uuid::new_v4().to_string();
    let retained_id = uuid::Uuid::new_v4().to_string();
    map["componentUses"] = json!([
        {"screenId":panel["id"],"nodeId":removed_id,"componentId":component["id"]},
        {"screenId":panel["id"],"nodeId":retained_id,"componentId":component["id"]}
    ]);
    fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
    let path = root.join(panel["path"].as_str().unwrap());
    let source = fs::read_to_string(&path).unwrap().replace("    pass", &format!(
        "    vbox: # loomlight-element: {group_id}\n        use details # loomlight-element: {removed_id}\n    use details # loomlight-element: {retained_id}"
    ));
    fs::write(&path, &source).unwrap();
    let before_map = fs::read(&map_path).unwrap();
    let result = compose_command(
        &mut service,
        &panel,
        json!({"type":"remove","nodeId":group_id}),
    );
    assert_eq!(result["changed"], true);
    let after_source = fs::read(&path).unwrap();
    assert!(!String::from_utf8_lossy(&after_source).contains(&removed_id));
    assert!(String::from_utf8_lossy(&after_source).contains(&retained_id));
    let after_map = fs::read(&map_path).unwrap();
    let map: Value = serde_json::from_slice(&after_map).unwrap();
    assert_eq!(
        map["componentUses"],
        json!([
            {"screenId":panel["id"],"nodeId":retained_id,"componentId":component["id"]}
        ])
    );
    assert_eq!(result["styles"]["error"], Value::Null);
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["styles"]["error"],
        Value::Null
    );
    composition_history(&mut service, "undo");
    assert_eq!(fs::read(&path).unwrap(), source.as_bytes());
    assert_eq!(fs::read(&map_path).unwrap(), before_map);
    composition_history(&mut service, "redo");
    assert_eq!(fs::read(&path).unwrap(), after_source);
    assert_eq!(fs::read(&map_path).unwrap(), after_map);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(fs::read(&map_path).unwrap(), after_map);
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["styles"]["error"],
        Value::Null
    );
}

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
fn unsupported_text_tags_keep_screen_effects_unknown() {
    for statement in [
        "text \"{a=jump:other}Open{/a}\"",
        "textbutton \"{custom}Open{/custom}\":\n        action Null()",
        "textbutton \"Close\":\n        action Return()",
    ] {
        let (_temporary, mut service, _root, owner) = composition_project();
        let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        save_composition_source(
            &mut service,
            &owner,
            &source.replace("    pass", &format!("    {statement}")),
        );
        let target = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({
                "binding":{"screenId":owner["id"],"sourceName":owner["name"]}
            }),
        );
        assert_eq!(target["effects"]["unknown"], true, "{statement}: {target}");
    }
}

#[test]
fn help_starter_content_extracts_without_capturing_its_local_close_action() {
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
            "authorityId":choice.authority_id,"kind":"uiImage","technicalName":"seal","displayName":"Seal"
        }),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"help_panel","expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"],
            "starter":{"title":"Help","explanation":"Continue reading.","assetId":imported["assets"][0]["id"],
                "expectedAssetSha256":imported["assets"][0]["sha256"],"width":80,"height":40}
        }),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "help_panel")
        .unwrap();
    let source = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let nodes = document["screens"][0]["nodes"].as_array().unwrap();
    let heading = nodes.iter().find(|node| node["kind"] == "text").unwrap();
    let content = nodes
        .iter()
        .find(|node| node["span"]["start"] == heading["parentStart"])
        .unwrap();
    ipc(
        &mut service,
        "screens.componentPrepareExtract",
        json!({
            "screenId":owner["id"],"nodeId":content["id"],"expectedRevision":document["revision"]
        }),
    );
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}}),
    );
    let result = ipc(
        &mut service,
        "screens.componentExtract",
        json!({
            "target":target["binding"],"expected":target["revisions"],"expectedProjectRevision":created["projectRevision"],
            "nodeId":content["id"],"name":"help_content"
        }),
    );
    let component = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/ui/help_content.rpy"}),
    );
    let component_source = component["text"].as_str().unwrap();
    assert!(component_source.contains("Continue reading."));
    assert!(component_source.contains("images/ui seal.png"));
    assert!(!component_source.contains("Hide("));
    let panel = ipc(&mut service, "source.open", json!({"path":owner["path"]}));
    assert!(panel["text"]
        .as_str()
        .unwrap()
        .contains("action Hide(\"help_panel\")"));
    assert!(panel["text"].as_str().unwrap().contains("use help_content"));
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"redo"}}),
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let review = ipc(
        &mut service,
        "screens.componentReview",
        json!({"componentId":result["componentId"]}),
    );
    assert_eq!(review["complete"], true);
    assert_eq!(review["uses"][0]["nodeId"], result["useId"]);
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
    let content = nodes
        .iter()
        .find(|n| n["kind"] == "vbox" && n["parentStart"] == close["parentStart"])
        .unwrap();
    ipc(
        &mut service,
        "screens.compose",
        json!({
            "screenId":owner["id"],"expectedRevision":document["revision"],
            "command":{"type":"reorder","nodeId":close["id"],"targetId":content["id"],"after":false}
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
                    "command":{"type":"reorder","nodeId":close["id"],"targetId":content["id"],"after":false}
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
