use super::*;

fn shared_project() -> (
    tempfile::TempDir,
    LifecycleService,
    std::path::PathBuf,
    Value,
    Value,
    String,
    String,
) {
    let (temporary, mut service, root, first) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"about", "expectedProjectRevision":catalog["projectRevision"], "expectedSourceMapRevision":catalog["sourceMapRevision"], "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let second = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "about")
        .unwrap()
        .clone();
    let mut ids = vec![];
    for owner in [&first, &second] {
        let added = compose_command(
            &mut service,
            owner,
            json!({"type":"add", "parentId":owner["rootId"], "kind":"text", "text":"Known text"}),
        );
        ids.push(added["selectedId"].as_str().unwrap().to_owned());
        let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let mut source = original.replace("text \"Known text\" #", "text \"Known text\": #");
        source.push_str("        style \"ll_body\" # use comment\n");
        if owner == &first {
            source.push_str("\nstyle ll_body is text:\n    size 26 # size comment\n    color \"#f1e9d6\"\n\n# opaque neighbor\ninit python:\n    untouched = \"keep me\"\n");
        }
        save_composition_source(&mut service, owner, &source);
    }
    (
        temporary,
        service,
        root,
        first,
        second,
        ids[0].clone(),
        ids[1].clone(),
    )
}

#[test]
fn shared_style_apply_changes_only_definition_and_one_history_entry_restores_both_uses() {
    let (_temporary, mut service, root, first, second, first_id, _) = shared_project();
    let before = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let other = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"].clone();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let style = catalog["styles"]["definitions"]
        .as_array()
        .expect("style definitions")
        .iter()
        .find(|s| s["name"] == "ll_body")
        .unwrap();
    assert_eq!(style["uses"].as_array().unwrap().len(), 2);
    let command = json!({"type":"formatText", "nodeId":first_id, "values":{"size":32}, "style":{"scope":"shared", "name":"ll_body", "expectedRevision":catalog["styles"]["revision"]}});
    let result = compose_command(&mut service, &first, command.clone());
    let expected = before.replace("size 26 #", "size 32 #");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        expected
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
        other
    );
    assert_eq!(
        result["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == first_id)
            .unwrap()["textProperties"]["values"]["size"],
        32
    );
    let next = ipc(&mut service, "screens.list", json!({}));
    let mut noop = command;
    noop["style"]["expectedRevision"] = next["styles"]["revision"].clone();
    assert_eq!(
        compose_command(&mut service, &first, noop)["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        before
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        expected
    );
}

#[test]
fn independent_style_copy_keeps_other_use_and_restores_reference_with_history() {
    let (_temporary, mut service, root, first, second, first_id, _) = shared_project();
    let before = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"].clone();
    let other = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"].clone();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &first,
        json!({"type":"formatText", "nodeId":first_id, "values":{"size":40,"text":"Local content"}, "style":{"scope":"local", "name":"ll_body", "expectedRevision":catalog["styles"]["revision"]}}),
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == first_id)
        .unwrap();
    let new_name = node["style"]["name"].as_str().unwrap();
    assert_ne!(new_name, "ll_body");
    assert_eq!(node["textProperties"]["values"]["size"], 40);
    assert_eq!(node["textProperties"]["values"]["color"], "#f1e9d6");
    assert_eq!(node["literal"], "Local content");
    let saved = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(saved.contains("size 26 # size comment"));
    assert!(saved.contains("# use comment"));
    assert!(saved.contains(&format!("style {new_name} is text:")));
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
        other
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        before
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        saved
    );
}

fn text_style_button_project() -> (
    tempfile::TempDir,
    LifecycleService,
    std::path::PathBuf,
    Value,
    Value,
    String,
    String,
) {
    let (temporary, mut service, root, first, second, first_id, second_id) = shared_project();
    for owner in [&first, &second] {
        let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .replace("text \"Known text\"", "textbutton \"Known text\"")
            .replace("        style \"", "        text_style \"")
            .replace(
                "init python:\n    untouched = \"keep me\"\n",
                "# retained without executing project code\n",
            );
        save_composition_source(&mut service, owner, &source);
    }
    compose_command(
        &mut service,
        &first,
        json!({"type":"formatText","nodeId":first_id,"values":{"size":30,"appearance":{"background":"#123456","border":{"color":"#abcdef","width":2},"hover_color":"#ffffff","hover_background":"#234567","hover_border":{"color":"#fedcba","width":3},"selected_background":"#345678","insensitive_background":"#456789"}}}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace(
            "background \"#123456\"",
            "background \"#123456\" # local decoration",
        )
        .replace("text_size 30", "text_size 30 # local text override");
    save_composition_source(&mut service, &first, &source);
    (temporary, service, root, first, second, first_id, second_id)
}

fn button_canvas_properties(service: &mut LifecycleService, owner: &Value, id: &str) -> Value {
    let document = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    let node = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == id)
        .unwrap();
    assert!(node["style"]["error"].is_null(), "{node}");
    let plan = ipc(
        service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":document["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["start"] == node["span"]["start"])
        .unwrap()["properties"]
        .clone()
}

#[test]
fn text_style_button_copy_preserves_local_decoration_canvas_and_single_history_entry() {
    let (_temporary, mut service, root, first, second, first_id, second_id) =
        text_style_button_project();
    let before = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let other = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"].clone();
    let appearance = button_canvas_properties(&mut service, &first, &first_id);
    let other_appearance = button_canvas_properties(&mut service, &second, &second_id);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &first,
        json!({"type":"formatText","nodeId":first_id,"values":{},"style":{"scope":"local","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}),
    );
    assert_eq!(result["changed"], true);
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == first_id)
        .unwrap();
    let name = node["style"]["name"].as_str().unwrap();
    let saved = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let (use_source, definition) = saved
        .split_once(&format!("\nstyle {name} is text:"))
        .unwrap();
    let expected_use = before
        .replace("text_style \"ll_body\"", &format!("text_style \"{name}\""))
        .replace("text_size 30", "")
        .replace("text_hover_color \"#ffffff\"", "");
    assert_eq!(use_source, expected_use);
    assert!(definition.contains("size 30 # size comment"));
    assert!(definition.contains("hover_color \"#ffffff\""));
    assert!(!definition.contains("background"));
    assert!(!definition.contains("foreground"));
    assert_eq!(
        button_canvas_properties(&mut service, &first, &first_id),
        appearance
    );
    assert_eq!(
        button_canvas_properties(&mut service, &second, &second_id),
        other_appearance
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
        other
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let definition = catalog["styles"]["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["name"] == name)
        .unwrap();
    assert!(definition["error"].is_null(), "{definition}");
    assert_eq!(definition["uses"].as_array().unwrap().len(), 1);
    assert_eq!(
        compose_command(
            &mut service,
            &first,
            json!({"type":"formatText","nodeId":first_id,"values":{},"style":{"scope":"shared","name":name,"expectedRevision":catalog["styles"]["revision"]}})
        )["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        before
    );
    assert_eq!(
        button_canvas_properties(&mut service, &first, &first_id),
        appearance
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        saved
    );
    assert_eq!(
        button_canvas_properties(&mut service, &first, &first_id),
        appearance
    );
}

#[test]
fn text_style_button_assignment_preserves_element_properties_and_noop() {
    let (_temporary, mut service, _root, first, _second, first_id, _) = text_style_button_project();
    let original = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = format!("{original}\nstyle ll_other is text:\n    size 30\n    color \"#f1e9d6\"\n    hover_color \"#ffffff\"\n");
    save_composition_source(&mut service, &first, &before);
    let appearance = button_canvas_properties(&mut service, &first, &first_id);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let mut command = json!({"type":"formatText","nodeId":first_id,"values":{},"style":{"scope":"shared","name":"ll_other","expectedRevision":catalog["styles"]["revision"]}});
    let result = compose_command(&mut service, &first, command.clone());
    let expected = before
        .replace("text_style \"ll_body\"", "text_style \"ll_other\"")
        .replace("text_size 30", "")
        .replace("text_hover_color \"#ffffff\"", "");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        expected
    );
    assert_eq!(
        button_canvas_properties(&mut service, &first, &first_id),
        appearance
    );
    command["style"]["expectedRevision"] = result["styles"]["revision"].clone();
    assert_eq!(
        compose_command(&mut service, &first, command)["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        before
    );
}

#[test]
fn text_style_button_assignment_from_button_style_keeps_inherited_decoration_local() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Continue"}),
    );
    let id = button["selectedId"].as_str().unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":id,"values":{"size":26,"appearance":{"background":"#123456","border":{"color":"#abcdef","width":2},"hover_background":"#234567"}},"style":{"scope":"create","name":"ll_button","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = format!(
        "{}\nstyle ll_body is text:\n    size 26\n",
        original.replace(
            "style \"ll_button\"\n",
            "style \"ll_button\" # retained reference comment\n"
        )
    );
    save_composition_source(&mut service, &owner, &before);
    let mut appearance = button_canvas_properties(&mut service, &owner, id);
    appearance.as_object_mut().unwrap().remove("text_style");
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":id,"values":{},"style":{"scope":"shared","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}),
    );
    assert_eq!(
        button_canvas_properties(&mut service, &owner, id),
        appearance
    );
    let saved = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let (use_source, definitions) = saved.split_once("\nstyle ll_button").unwrap();
    assert!(!use_source.contains("style \"ll_button\""));
    assert!(use_source.contains("text_style \"ll_body\" # retained reference comment"));
    assert!(use_source.contains("background \"#123456\""));
    assert!(use_source.contains("hover_background \"#234567\""));
    assert!(use_source.contains("foreground Frame("));
    assert_eq!(
        definitions,
        before.split_once("\nstyle ll_button").unwrap().1
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
}

#[test]
fn text_style_button_edits_route_decoration_to_use_and_text_to_selected_scope() {
    for scope in ["local", "shared"] {
        let (_temporary, mut service, _root, first, second, first_id, second_id) =
            text_style_button_project();
        // Shared edits exercise a definition in another file and local decoration
        // in the selected use through one transaction.
        let (first, second, first_id, second_id) = if scope == "shared" {
            (second, first, second_id, first_id)
        } else {
            (first, second, first_id, second_id)
        };
        let before =
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"].clone();
        let other = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let mut appearance = button_canvas_properties(&mut service, &first, &first_id);
        let mut other_appearance = button_canvas_properties(&mut service, &second, &second_id);
        let catalog = ipc(&mut service, "screens.list", json!({}));
        let result = compose_command(
            &mut service,
            &first,
            json!({"type":"formatText","nodeId":first_id,"values":{"bold":true,"appearance":{"background":"#654321","hover_background":"#765432"}},"style":{"scope":scope,"name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}),
        );
        let node = result["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == first_id)
            .unwrap();
        let name = node["style"]["name"].as_str().unwrap();
        let saved = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let use_source = saved.split("\nstyle ").next().unwrap();
        assert!(use_source.contains("background \"#654321\""));
        assert!(use_source.contains("hover_background \"#765432\""));
        assert!(!use_source.contains("text_bold"));
        let catalog = ipc(&mut service, "screens.list", json!({}));
        let definition = catalog["styles"]["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["name"] == name)
            .unwrap();
        assert!(definition["error"].is_null(), "{definition}");
        assert_eq!(definition["values"]["bold"], true);
        assert!(definition["values"].get("background").is_none());
        appearance["text_bold"] = json!(true);
        appearance["background"] = json!("#654321");
        appearance["hover_background"] = json!("#765432");
        assert_eq!(
            button_canvas_properties(&mut service, &first, &first_id),
            appearance
        );
        if scope == "shared" {
            other_appearance["text_bold"] = json!(true);
        }
        assert_eq!(
            button_canvas_properties(&mut service, &second, &second_id),
            other_appearance
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
            if scope == "shared" {
                other.replace(
                    "style ll_body is text:\n",
                    "style ll_body is text:\n    bold True\n",
                )
            } else {
                other.clone()
            }
        );
        composition_history(&mut service, "undo");
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
            before
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
            other
        );
        composition_history(&mut service, "redo");
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
            saved
        );
    }
}

#[test]
fn text_style_button_copy_preserves_opaque_local_properties_and_comments() {
    let (_temporary, mut service, _root, first, _second, first_id, _) = text_style_button_project();
    let original = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = original.replace("background \"#123456\"", "background gui.button_background")
        .replace("text_size 30 # local text override", "text_size gui.button_size # local text override\n        focus_mask True # unsupported local property\n        text_color gui.button_color # opaque override of inherited color");
    save_composition_source(&mut service, &first, &before);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    for (scope, error) in [
        ("local", "OPAQUE_BOUNDARY"),
        ("shared", "STYLE_UNAVAILABLE"),
    ] {
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":first["id"],"expectedRevision":document["revision"],"command":{"type":"formatText","nodeId":first_id,"values":{"color":"#ffffff"},"style":{"scope":scope,"name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}})
            )["error"]["code"],
            error
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
            before
        );
    }
    let result = compose_command(
        &mut service,
        &first,
        json!({"type":"formatText","nodeId":first_id,"values":{},"style":{"scope":"local","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == first_id)
        .unwrap();
    let name = node["style"]["name"].as_str().unwrap();
    assert!(node["style"]["error"].is_null(), "{node}");
    let saved = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let (use_source, _) = saved
        .split_once(&format!("\nstyle {name} is text:"))
        .unwrap();
    assert_eq!(
        use_source,
        before
            .replace("text_style \"ll_body\"", &format!("text_style \"{name}\""))
            .replace("text_hover_color \"#ffffff\"", "")
    );
}

#[test]
fn shared_style_review_refuses_changed_uses_missing_definitions_and_retains_exact_source() {
    let (_temporary, mut service, _root, first, second, first_id, _) = shared_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    let before = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let second_before = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &second,
        &second_before.replace("ll_body", "missing_style"),
    );
    let payload = json!({"screenId":first["id"], "expectedRevision":doc["revision"], "command":{"type":"formatText", "nodeId":first_id, "values":{"size":32}, "style":{"scope":"shared", "name":"ll_body", "expectedRevision":catalog["styles"]["revision"]}}});
    assert_eq!(
        reject(&mut service, "screens.compose", payload)["error"]["code"],
        "SOURCE_CONFLICT"
    );
    let next = ipc(&mut service, "screens.list", json!({}));
    for values in [json!({"size":0}), json!({"color":"not a color"})] {
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":first["id"], "expectedRevision":doc["revision"], "command":{"type":"formatText", "nodeId":first_id, "values":values, "style":{"scope":"shared", "name":"ll_body", "expectedRevision":next["styles"]["revision"]}}}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
            before
        );
    }
    save_composition_source(
        &mut service,
        &first,
        &before.replace(
            "style ll_body is text:",
            "style ll_body is gui.dynamic_style:",
        ),
    );
    let next = ipc(&mut service, "screens.list", json!({}));
    let definition = next["styles"]["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "ll_body")
        .unwrap();
    assert!(definition["error"].is_string());
    let retained = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"].clone();
    let current = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":first["id"], "expectedRevision":current["revision"], "command":{"type":"formatText", "nodeId":first_id, "values":{"size":32}, "style":{"scope":"shared", "name":"ll_body", "expectedRevision":next["styles"]["revision"]}}}),
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        retained
    );
}

#[test]
fn existing_style_assignment_and_new_style_creation_use_ordinary_source_and_noop_history() {
    let (_temporary, mut service, _root, first, second, first_id, second_id) = shared_project();
    let original = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = format!("{original}\nstyle another_body is text:\n    size 18\n");
    save_composition_source(&mut service, &first, &before);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let command = json!({"type":"formatText","nodeId":first_id,"values":{},"style":{"scope":"shared","name":"another_body","expectedRevision":catalog["styles"]["revision"]}});
    let result = compose_command(&mut service, &first, command.clone());
    let expected = before.replace("style \"ll_body\" #", "style \"another_body\" #");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        expected
    );
    let mut noop = command;
    noop["style"]["expectedRevision"] = result["styles"]["revision"].clone();
    assert_eq!(
        compose_command(&mut service, &first, noop)["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        before
    );
    let source = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("        style \"ll_body\" # use comment\n", "");
    save_composition_source(&mut service, &second, &source);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &second,
        json!({"type":"formatText","nodeId":second_id,"values":{"size":22},"style":{"scope":"create","name":"local_body","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let saved = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(saved.contains("style local_body is text:"));
    assert!(saved.contains("style \"local_body\""));
    assert_eq!(
        result["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == second_id)
            .unwrap()["textProperties"]["values"]["size"],
        22
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"],
        source
    );
}

#[test]
fn frame_decoration_and_button_states_are_typed_source_properties_in_one_history_entry() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let frame = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"frame","text":""}),
    );
    let before = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":frame["selectedId"],"values":{"appearance":{"background":"#123456","border":{"color":"#abcdef","width":2}}},"style":{"scope":"create","name":"panel_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == frame["selectedId"])
        .unwrap();
    assert_eq!(node["textProperties"]["values"]["background"], "#123456");
    assert_eq!(
        node["textProperties"]["values"]["border"],
        json!({"color":"#abcdef","width":2})
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(source.contains("style panel_style is frame:"));
    assert!(source.contains("background \"#123456\""));
    assert!(source.contains("foreground Frame(Composite((6, 6), (0, 0), Transform(Solid(\"#abcdef\"), xysize=(6, 2)), (0, 4), Transform(Solid(\"#abcdef\"), xysize=(6, 2)), (0, 2), Transform(Solid(\"#abcdef\"), xysize=(2, 2)), (4, 2), Transform(Solid(\"#abcdef\"), xysize=(2, 2))), 2, 2)"));
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Continue"}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":button["selectedId"],"values":{"size":24,"appearance":{"background":"#234567","hover_color":"#ffffff","selected_background":"#345678","insensitive_color":"#888888"}},"style":{"scope":"create","name":"button_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == button["selectedId"])
        .unwrap();
    assert_eq!(node["textProperties"]["values"]["hover_color"], "#ffffff");
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(source.contains("style button_style is button:"));
    assert!(source.contains("style \"button_style\""));
    assert!(source.contains("text_style \"button_style\""));
    assert!(source.contains("insensitive_color \"#888888\""));
}

#[test]
fn static_shared_style_canvas_plan_resolves_all_uses_and_retains_pending_values_without_writes() {
    let (_temporary, mut service, _root, first, _second, first_id, _) = shared_project();
    // Initialization outside the supported static subset remains a separate refusal.
    let source = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let safe = source.replace(
        "# opaque neighbor\ninit python:\n    untouched = \"keep me\"\n",
        "# opaque neighbor retained without execution\n",
    );
    save_composition_source(&mut service, &first, &safe);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    let start = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == first_id)
        .unwrap()["span"]["start"]
        .clone();
    let payload = json!({"path":first["path"],"screenName":first["name"],"expectedRevision":doc["revision"],"width":1280,"height":720});
    let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
    assert_eq!(plan["available"], true, "{plan}");
    let node = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["start"] == start)
        .unwrap();
    assert_eq!(node["properties"]["size"], 26);
    assert_eq!(node["properties"]["color"], "#f1e9d6");
    let mut pending = payload;
    pending["textStyles"] = json!([{"nodeStart":start,"values":{"size":32}}]);
    let plan = ipc(&mut service, "screens.canvasPlan", pending);
    assert_eq!(plan["available"], true, "{plan}");
    assert_eq!(
        plan["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["start"] == start)
            .unwrap()["properties"]["size"],
        32
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        safe
    );
}

fn runtime_snapshot(service: &mut LifecycleService, owners: &[Value]) -> Value {
    let mut sources = serde_json::Map::new();
    for owner in owners {
        let source = ipc(service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        sources.insert(
            owner["path"].as_str().unwrap().into(),
            json!({"text":source,"sha256":hex::encode(Sha256::digest(source.as_bytes()))}),
        );
    }
    Value::Object(sources)
}

#[test]
fn style_runtime_inputs_are_authored_through_public_source_and_transaction_requests() {
    let (temporary, mut service, root, owner) = composition_project();
    let font_path = temporary.path().join("style.ttf");
    fs::write(
        &font_path,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&font_path).unwrap();
    let assets = ipc(
        &mut service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"font","technicalName":"style_font","displayName":"Style font"}),
    );
    let font = assets["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["kind"] == "font")
        .unwrap()
        .clone();
    let frame = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"frame","text":""}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":frame["selectedId"],"values":{"appearance":{"background":"#123456","border":{"color":"#abcdef","width":2}}},"layout":{"xpos":{"unit":"pixels","value":40},"ypos":{"unit":"pixels","value":40},"xsize":{"unit":"pixels","value":500},"ysize":{"unit":"pixels","value":300}},"style":{"scope":"create","name":"panel_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let body = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":frame["selectedId"],"kind":"text","text":"Choose a route. The last tram leaves at midnight."}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":body["selectedId"],"values":{"font":{"assetId":font["id"],"expectedAssetSha256":font["sha256"]},"size":26,"color":"#ace","align":0.5,"bold":true,"italic":true},"layout":{"xpos":{"unit":"pixels","value":20},"ypos":{"unit":"pixels","value":20},"xsize":{"unit":"pixels","value":400}},"style":{"scope":"create","name":"body_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Continue"}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":button["selectedId"],"values":{"size":24,"color":"#ffeecc","align":0.5,"bold":false,"italic":false,"appearance":{"background":"#234567","border":{"color":"#fedcba","width":1},"hover_color":"#ffffff","hover_background":"#345678","hover_border":{"color":"#ffaa00","width":3},"selected_color":"#ccffff","selected_background":"#456789","insensitive_color":"#888888","insensitive_background":"#222222"}},"layout":{"xpos":{"unit":"pixels","value":600},"ypos":{"unit":"pixels","value":100},"xsize":{"unit":"pixels","value":240},"ysize":{"unit":"pixels","value":60}},"style":{"scope":"create","name":"button_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned()
        + "\nstyle button_label is text:\n    size 24\n    color \"#ffeecc\"\n    text_align 0.5\n    bold False\n    italic False\n    hover_color \"#ffffff\"\n    selected_color \"#ccffff\"\n    insensitive_color \"#888888\"\n";
    save_composition_source(&mut service, &owner, &source);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":button["selectedId"],"values":{},"style":{"scope":"shared","name":"button_label","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let mut with_ids = source;
    for (id, name) in [
        (&frame["selectedId"], "panel"),
        (&body["selectedId"], "body"),
        (&button["selectedId"], "button"),
    ] {
        let marker = format!("# loomlight-element: {}\n", id.as_str().unwrap());
        let indent = if name == "body" {
            "            "
        } else {
            "        "
        };
        with_ids = with_ids.replace(&marker, &format!("{marker}{indent}id \"{name}\"\n"));
    }
    let marker = format!(
        "# loomlight-element: {}\n",
        button["selectedId"].as_str().unwrap()
    );
    with_ids = with_ids.replace(&marker, &format!("{marker}        action NullAction()\n"));
    save_composition_source(&mut service, &owner, &with_ids);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"about","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let other = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "about")
        .unwrap()
        .clone();
    let second = compose_command(
        &mut service,
        &other,
        json!({"type":"add","parentId":other["rootId"],"kind":"text","text":"Choose a route. The last tram leaves at midnight."}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &other,
        json!({"type":"formatText","nodeId":second["selectedId"],"values":{},"layout":{"xpos":{"unit":"pixels","value":100},"ypos":{"unit":"pixels","value":100},"xsize":{"unit":"pixels","value":400}},"style":{"scope":"shared","name":"body_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let other_source = ipc(&mut service, "source.open", json!({"path":other["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &other,
        &other_source.replace(
            &format!(
                "# loomlight-element: {}\n",
                second["selectedId"].as_str().unwrap()
            ),
            &format!(
                "# loomlight-element: {}\n        id \"body\"\n",
                second["selectedId"].as_str().unwrap()
            ),
        ),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":body["selectedId"],"values":{"size":32},"style":{"scope":"shared","name":"body_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let owners = [owner.clone(), other.clone()];
    let shared = runtime_snapshot(&mut service, &owners);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":body["selectedId"],"values":{"size":40},"style":{"scope":"local","name":"body_style","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":button["selectedId"],"values":{},"style":{"scope":"local","name":"button_label","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let independent = runtime_snapshot(&mut service, &owners);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(runtime_snapshot(&mut service, &owners), independent);
    let receipt = json!({"publicCoreRequests":true,"stages":{"shared":shared,"independent":independent},"assets":[font],"screenNames":["notes","about"]});
    if let Some(output) = std::env::var_os("LOOMLIGHT_STYLE_INPUTS") {
        let output = std::path::PathBuf::from(output);
        assert!(!output.exists());
        fs::create_dir_all(&output).unwrap();
        fs::write(
            output.join("accepted.json"),
            serde_json::to_vec_pretty(&receipt).unwrap(),
        )
        .unwrap();
    }
}

#[test]
#[ignore = "L07 selected pinned-SDK proof; one canvas-helper start"]
fn shared_style_helper_matches_qualified_shared_and_independent_source() {
    let cli_starts_before = crate::renpy::process_spawn_count_for_test();
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified official archive");
    let inputs = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_STYLE_INPUTS").expect("public-core inputs"),
    );
    let accepted: Value =
        serde_json::from_slice(&fs::read(inputs.join("accepted.json")).unwrap()).unwrap();
    assert_eq!(accepted["publicCoreRequests"], true);
    let output = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_STYLE_HELPER_OUTPUT").expect("fresh evidence directory"),
    );
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
        .unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    for (path, source) in accepted["stages"]["shared"].as_object().unwrap() {
        let bytes = source["text"].as_str().unwrap().as_bytes();
        assert_eq!(hex::encode(Sha256::digest(bytes)), source["sha256"]);
        fs::write(root.join(path), bytes).unwrap();
    }
    service.open_path(&root).unwrap();
    let font_path = temporary.path().join("style_font.ttf");
    fs::write(
        &font_path,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&font_path).unwrap();
    ipc(
        &mut service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"font","technicalName":"style_font","displayName":"Style font"}),
    );
    let mut records = vec![];
    let mut pending: Option<Value> = None;
    for stage in ["shared", "independent"] {
        if stage == "independent" {
            for (path, source) in accepted["stages"][stage].as_object().unwrap() {
                save_composition_source(
                    &mut service,
                    &json!({"path":path}),
                    source["text"].as_str().unwrap(),
                );
            }
        }
        for (width, height) in [(1280, 720), (1024, 768)] {
            for state in ["normal", "hover", "selected", "disabled"] {
                for screen in ["notes", "about"] {
                    let path = format!("game/ui/{screen}.rpy");
                    let doc = ipc(&mut service, "screens.inspect", json!({"path":path}));
                    let name = format!("{stage}-{width}x{height}-{state}-{screen}");
                    let frame = super::nested_sdk::render_frame(
                        &mut service,
                        json!({"path":path,"screenName":screen,"expectedRevision":doc["revision"],"width":width,"height":height,"buttonState":state}),
                        &profile,
                        &output,
                        &name,
                    );
                    assert_eq!(
                        frame["revision"],
                        accepted["stages"][stage][&path]["sha256"]
                    );
                    if stage == "independent"
                        && width == 1280
                        && state == "normal"
                        && screen == "notes"
                    {
                        assert_eq!(
                            frame["image"],
                            pending.as_ref().unwrap()["image"],
                            "The typed pending draft matches its accepted independent source"
                        );
                    }
                    records.push(json!({"stage":stage,"aspect":[width,height],"state":state,"screen":screen,"frameId":frame["frameId"]}));
                }
            }
        }
        if stage == "shared" {
            let path = "game/ui/notes.rpy";
            let before = ipc(&mut service, "source.open", json!({"path":path}))["text"].clone();
            let doc = ipc(&mut service, "screens.inspect", json!({"path":path}));
            let body = doc["screens"][0]["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|n| n["kind"] == "text")
                .unwrap();
            pending = Some(super::nested_sdk::render_frame(
                &mut service,
                json!({"path":path,"screenName":"notes","expectedRevision":doc["revision"],"width":1280,"height":720,"textStyles":[{"nodeStart":body["span"]["start"],"values":{"size":40}}]}),
                &profile,
                &output,
                "typed-pending",
            ));
            assert_eq!(
                ipc(&mut service, "source.open", json!({"path":path}))["text"],
                before
            );
        }
    }
    service.close().unwrap();
    let shutdown = service.canvas_shutdown_report().unwrap();
    assert!(
        shutdown.cleanup_complete && shutdown.cooperative && shutdown.exit_code == Some(0),
        "{shutdown:?}"
    );
    assert!(!profile.read_dir().unwrap().flatten().any(|e| e
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
    fs::write(
        output.join("accepted.json"),
        serde_json::to_vec_pretty(&accepted).unwrap(),
    )
    .unwrap();
    let sdk_cli_processes = crate::renpy::process_spawn_count_for_test() - cli_starts_before;
    assert_eq!(
        sdk_cli_processes, 3,
        "Count both installer validation starts and initial canvas discovery"
    );
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"helperSessions":1,"sdkCliProcesses":sdk_cli_processes,"pendingMatchesAccepted":true,"rendererSHA256":hex::encode(Sha256::digest(include_bytes!("canvas-renderer.rpy"))),"records":records,"shutdowns":[shutdown]})).unwrap()).unwrap();
}

#[test]
fn shared_review_refuses_untracked_style_uses_inheritance_and_overridden_properties() {
    for extra in [
        "\nscreen parameterized(flag):\n    text \"Unknown use\":\n        style \"ll_body\"\n",
        "\nscreen inline_use():\n    text \"Unknown use\" style \"ll_body\"\n",
        "\nstyle derived is ll_body:\n    size 18\n",
        "\nscreen dynamic_use():\n    text \"Unknown use\":\n        style selected_style\n",
        "\nscreen mixed_button():\n    textbutton \"Mixed\":\n        style \"button\"\n        text_style \"ll_body\"\n",
        "\nstyle caption_ll_body:\n    size 18\n",
        "\nscreen implicit_use():\n    text \"Implicit\":\n        style \"caption_ll_body\"\n",
    ] {
        let (_temporary, mut service, _root, first, _second, first_id, _) = shared_project();
        let source = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned()
            + extra;
        save_composition_source(&mut service, &first, &source);
        let catalog = ipc(&mut service, "screens.list", json!({}));
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":first["path"]}),
        );
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":first["id"],"expectedRevision":doc["revision"],"command":{"type":"formatText","nodeId":first_id,"values":{"size":32},"style":{"scope":"shared","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}})
            )["error"]["code"],
            "STYLE_UNAVAILABLE",
            "{extra}"
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
            source
        );
    }
    let (_temporary, mut service, _root, first, second, first_id, _) = shared_project();
    let original = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"].clone();
    let other = ipc(&mut service, "source.open", json!({"path":second["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned()
        + "        size 18 # local override\n";
    save_composition_source(&mut service, &second, &other);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":first["id"],"expectedRevision":doc["revision"],"command":{"type":"formatText","nodeId":first_id,"values":{"size":32},"style":{"scope":"shared","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}})
        )["error"]["code"],
        "STYLE_UNAVAILABLE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        original
    );
}

#[test]
fn unsupported_style_pass_statement_refuses_without_changing_source() {
    let (_temporary, mut service, _root, first, _second, first_id, _) = shared_project();
    let original = ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let source = original.replace("    color \"#f1e9d6\"", "    pass # source-only statement");
    save_composition_source(&mut service, &first, &source);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":first["path"]}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":first["id"],"expectedRevision":doc["revision"],"command":{"type":"formatText","nodeId":first_id,"values":{"size":null},"style":{"scope":"shared","name":"ll_body","expectedRevision":catalog["styles"]["revision"]}}})
        )["error"]["code"],
        "STYLE_UNAVAILABLE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":first["path"]}))["text"],
        source
    );
}
