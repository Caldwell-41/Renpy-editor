use super::*;

#[test]
fn style_index_budget_preserves_small_screen_public_edits() {
    for kind in ["definitions", "references"] {
        let (_temporary, mut service, root, owner) = composition_project();
        // Every file and screen fits its own limits. Only the shared index
        // exceeds its budget.
        for file in 0..2 {
            let mut source = if kind == "references" {
                format!("screen many_{file}():\n")
            } else {
                String::new()
            };
            for i in 0..2100 {
                source.push_str(&if kind == "definitions" {
                    format!("style ll_{file}_{i} is text:\n    size 20\n")
                } else {
                    "    text \"A\":\n        style \"ll_body\"\n".into()
                });
            }
            fs::write(root.join(format!("game/many_{file}.rpy")), source).unwrap();
        }
        let catalog = ipc(&mut service, "screens.list", json!({}));
        assert!(
            catalog["styles"]["error"]
                .as_str()
                .unwrap()
                .contains("limit"),
            "{catalog}"
        );
        let definitions = catalog["styles"]["definitions"].as_array().unwrap();
        assert!(definitions.len() <= MAX_NODES);
        assert!(definitions.iter().all(|d| d["error"].is_string()));
        let added = compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Still editable"}),
        );
        let id = added["selectedId"].clone();
        compose_command(
            &mut service,
            &owner,
            json!({"type":"formatText","nodeId":id,"values":{"size":24}}),
        );
        composition_history(&mut service, "undo");
        let inspect = |service: &mut LifecycleService| {
            ipc(service, "screens.inspect", json!({"path":owner["path"]}))
        };
        assert!(inspect(&mut service)["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .any(|n| n["id"] == id && n["textProperties"]["values"].get("size").is_none()));
        composition_history(&mut service, "redo");
        service.close().unwrap();
        service.open_path(&root).unwrap();
        assert!(inspect(&mut service)["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .any(|n| n["id"] == id && n["textProperties"]["values"]["size"] == 24));
    }
}

#[test]
fn style_index_tracks_unresolved_executable_inventory_and_refuses_shared_edits() {
    for file in [
        "game/hidden.rpa",
        "game/hidden.rpyc",
        "game/HIDDEN.RPA",
        "game/HIDDEN.RPYC",
    ] {
        let (_temporary, mut service, root, first, _second, first_id, _) = shared_project();
        let source = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
            .as_str()
            .unwrap()
            .replace("init python:\n    untouched = \"keep me\"\n", "");
        save_composition_source(&mut service, &first, &source);
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":first["path"]}),
        );
        let plan_payload = json!({"path":first["path"],"screenName":first["name"],"expectedRevision":doc["revision"],"width":1280,"height":720});
        assert_eq!(
            ipc(&mut service, "screens.canvasPlan", plan_payload.clone())["available"],
            true
        );
        let old = ipc(&mut service, "screens.list", json!({}));
        fs::write(root.join(file), b"opaque executable input").unwrap();
        let catalog = ipc(&mut service, "screens.list", json!({}));
        assert_ne!(
            old["styles"]["revision"], catalog["styles"]["revision"],
            "{file}"
        );
        assert!(catalog["styles"]["error"].is_string(), "{file}: {catalog}");
        let payload = |revision: &Value| {
            json!({"screenId":first["id"],"expectedRevision":doc["revision"],"command":{
            "type":"formatText","nodeId":first_id,"values":{"size":32},
            "style":{"scope":"shared","name":"ll_body","expectedRevision":revision}}})
        };
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                payload(&old["styles"]["revision"])
            )["error"]["code"],
            "SOURCE_CONFLICT"
        );
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                payload(&catalog["styles"]["revision"])
            )["error"]["code"],
            "STYLE_UNAVAILABLE"
        );
        assert_eq!(
            fs::read_to_string(root.join(first["path"].as_str().unwrap())).unwrap(),
            source
        );
        let plan = ipc(&mut service, "screens.canvasPlan", plan_payload.clone());
        assert_eq!(plan["available"], false, "{plan}");
        assert!(
            plan["limits"]
                .as_array()
                .unwrap()
                .iter()
                .any(|l| l.as_str().unwrap().contains(file)),
            "{plan}"
        );
        fs::write(root.join(file), b"changed executable input").unwrap();
        let changed = ipc(&mut service, "screens.list", json!({}));
        assert_ne!(catalog["styles"]["revision"], changed["styles"]["revision"]);
        fs::remove_file(root.join(file)).unwrap();
        let restored = ipc(&mut service, "screens.list", json!({}));
        assert_eq!(old["styles"]["revision"], restored["styles"]["revision"]);
        assert_eq!(
            ipc(&mut service, "screens.canvasPlan", plan_payload)["available"],
            true
        );
    }
}

#[test]
fn style_index_qualifies_source_paired_bytecode_but_not_new_orphans() {
    let (_temporary, mut service, root, first, _second, _first_id, _) = shared_project();
    let bytecode = format!("{}c", first["path"].as_str().unwrap());
    fs::write(root.join(&bytecode), b"source-paired bytecode").unwrap();
    let paired = ipc(&mut service, "screens.list", json!({}));
    assert!(paired["styles"]["error"].is_null(), "{paired}");
    // The same executable input becomes uncertain when its source goes away.
    fs::rename(
        root.join(first["path"].as_str().unwrap()),
        root.join("game/retained.txt"),
    )
    .unwrap();
    let orphan = ipc(&mut service, "screens.list", json!({}));
    assert!(orphan["styles"]["error"].is_string(), "{orphan}");
    assert_ne!(paired["styles"]["revision"], orphan["styles"]["revision"]);
}

#[test]
fn style_index_oversized_archive_keeps_ordinary_editing_bounded() {
    let (_temporary, mut service, root, owner) = composition_project();
    fs::File::create(root.join("game/large.rpa"))
        .unwrap()
        .set_len(64 * 1024 * 1024 + 1)
        .unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert!(catalog["styles"]["error"].is_string());
    compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Local"}),
    );
}

#[test]
fn style_index_refuses_unreviewed_inclusion_graph_without_blocking_ordinary_edits() {
    for statement in [
        "use about()",
        "use expression selected_screen",
        "use about(flag)",
    ] {
        let (_temporary, mut service, root, first, _second, first_id, _) = shared_project();
        let parent = format!("screen parent():\n    {statement}\n");
        fs::write(root.join("game/parent.rpy"), &parent).unwrap();
        let catalog = ipc(&mut service, "screens.list", json!({}));
        let def = catalog["styles"]["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["name"] == "ll_body")
            .unwrap();
        assert!(
            def["error"].is_string(),
            "Unreviewed parents must not qualify: {statement}: {def}"
        );
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":first["path"]}),
        );
        let before = fs::read(root.join(first["path"].as_str().unwrap())).unwrap();
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":first["id"],
            "expectedRevision":doc["revision"],"command":{"type":"formatText","nodeId":first_id,
            "values":{"size":32},"style":{"scope":"shared","name":"ll_body",
            "expectedRevision":catalog["styles"]["revision"]}}})
            )["error"]["code"],
            "STYLE_UNAVAILABLE"
        );
        assert_eq!(
            fs::read(root.join(first["path"].as_str().unwrap())).unwrap(),
            before
        );
        // An unrelated dirty inclusion cannot block ordinary local content edits.
        let opened = ipc(
            &mut service,
            "source.open",
            json!({"path":"game/parent.rpy"}),
        );
        ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":"game/parent.rpy", "expectedBaseRevision":opened["baseRevision"],
            "text":format!("{parent}    # unsaved parent draft\n"),"selectionStart":0,"selectionEnd":0}),
        );
        compose_command(
            &mut service,
            &first,
            json!({"type":"text","nodeId":first_id,"text":"Local"}),
        );
        composition_history(&mut service, "undo");
        assert_eq!(
            fs::read(root.join(first["path"].as_str().unwrap())).unwrap(),
            before
        );
        composition_history(&mut service, "redo");
        assert_eq!(
            fs::read_to_string(root.join("game/parent.rpy")).unwrap(),
            parent
        );
    }
}
