use super::*;

#[path = "action_runtime_tests.rs"]
mod runtime;

fn create_action_screen(service: &mut LifecycleService, name: &str, kind: &str) -> Value {
    let catalog = ipc(service, "screens.list", json!({}));
    let created = ipc(
        service,
        "screens.create",
        json!({"name":name,"kind":kind,
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == name)
        .unwrap()
        .clone()
}

fn reviewed_target(service: &mut LifecycleService, owner: &Value) -> Value {
    let target = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let resolved = ipc(service, "screens.resolveTarget", json!({"binding":target}));
    json!({"target":target,"revisions":resolved["revisions"]})
}

#[test]
fn ordered_screen_actions_require_panel_targets_and_finish_last_in_blocking_dialog() {
    let (_temporary, mut service, _root, panel) = composition_project();
    let dialog = create_action_screen(&mut service, "confirm_notes", "dialog");
    let added = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":dialog["rootId"],"kind":"textbutton","text":"Confirm"}),
    );
    let review = reviewed_target(&mut service, &panel);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let actions = json!([{"type":"showScreen","target":review["target"]},{"type":"hideScreen","target":review["target"]},{"type":"finishInteraction"}]);
    let command = json!({"type":"actions","nodeId":added["selectedId"],"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review]});
    let result = compose_command(&mut service, &dialog, command);
    let source = ipc(&mut service, "source.open", json!({"path":dialog["path"]}));
    assert!(source["text"]
        .as_str()
        .unwrap()
        .contains("action [Show(\"notes\"), Hide(\"notes\"), Return()]"));
    assert_eq!(
        result["document"]["screens"][0]["nodes"][1]["actions"],
        actions
    );
    let saved = result["document"].clone();
    let review = reviewed_target(&mut service, &panel);
    for actions in [
        json!([{"type":"finishInteraction"},{"type":"hideScreen","target":review["target"]}]),
        json!([{"type":"showScreen","target":{"screenId":dialog["id"],"sourceName":dialog["name"]}}]),
    ] {
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":dialog["id"],"expectedRevision":saved["revision"],"command":{
            "type":"actions","nodeId":added["selectedId"],"actions":actions,"expectedAuthoringRevision":saved["authoringRevision"],"expectedTargetRevisions":[review]}}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":dialog["path"]}))["text"],
            source["text"]
        );
    }
}

#[test]
fn ordered_assignments_preserve_source_and_roundtrip_through_history_and_reopen() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variables = ipc(
        &mut service,
        "variable.create",
        json!({
            "technicalName":"score", "variableType":"int", "defaultValue":"0"
        }),
    );
    let variable = variables["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap();
    let added = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"add", "parentId":owner["rootId"], "kind":"textbutton", "text":"Continue"
        }),
    );
    let id = added["selectedId"].clone();
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("action Null()", "action Null() # keep action comment");
    save_composition_source(&mut service, &owner, &original);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let command = json!({"type":"actions", "nodeId":id,
        "expectedAuthoringRevision":document["authoringRevision"], "expectedTargetRevisions":[],
        "actions":[{"type":"setVariable","variableId":variable["id"],"value":"9007199254740993"},
                   {"type":"setVariable","variableId":variable["id"],"value":"-7"}]});
    let applied = compose_command(&mut service, &owner, command.clone());
    assert_eq!(applied["changed"], true);
    let expected = original.replace(
        "Null()",
        "[SetVariable(\"score\", 9007199254740993), SetVariable(\"score\", -7)]",
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    let node = &applied["document"]["screens"][0]["nodes"][1];
    assert_eq!(node["actions"], command["actions"]);
    assert_eq!(
        compose_command(&mut service, &owner, command.clone())["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        original
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        reopened["screens"][0]["nodes"][1]["actions"],
        command["actions"]
    );
}

#[test]
fn existing_variable_text_preserves_neighbors_and_reconciles_history_and_reopen() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variables = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"caption","variableType":"string","defaultValue":"Notes"}),
    );
    let variable = variables["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "caption")
        .unwrap();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Title"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("text \"Title\"", "text \"Title\"")
        + "    $ custom = ['untouched', 17] # opaque neighbor\n";
    save_composition_source(&mut service, &owner, &original);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let binding = json!({"variableId":variable["id"]});
    let command = json!({"type":"variableText","nodeId":added["selectedId"],"binding":binding,"expectedAuthoringRevision":doc["authoringRevision"]});
    let changed = compose_command(&mut service, &owner, command.clone());
    assert_eq!(
        changed["document"]["screens"][0]["nodes"][1]["variableBindings"],
        json!([binding])
    );
    let expected = original.replace("text \"Title\"", "text \"[caption!q]\"");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    assert_eq!(
        compose_command(&mut service, &owner, command)["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        original
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]})
        )["screens"][0]["nodes"][1]["variableBindings"],
        json!([binding])
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let cleared = compose_command(
        &mut service,
        &owner,
        json!({"type":"variableText","nodeId":added["selectedId"],"binding":null,"text":"Title","expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    assert_eq!(
        cleared["document"]["screens"][0]["nodes"][1]["variableBindings"],
        json!([])
    );
}

#[test]
fn mixed_variable_templates_preserve_source_samples_dependencies_history_and_reopen() {
    let (_temporary, mut service, root, owner) = composition_project();
    ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"caption","variableType":"string","defaultValue":"café"}),
    );
    let model = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"score","variableType":"int","defaultValue":"12"}),
    );
    let variables = model["variables"].as_array().unwrap();
    let caption = variables
        .iter()
        .find(|v| v["technicalName"] == "caption")
        .unwrap()
        .clone();
    let score = variables
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap()
        .clone();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Title"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned()
        + "    $ custom = ['untouched', 17] # opaque neighbor\n";
    save_composition_source(&mut service, &owner, &original);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let template = "Préfix [[literal] {{b} [caption!q] / [score!q]\n[caption!q] suffix";
    let command = json!({"type":"variableText","nodeId":added["selectedId"],"binding":null,"text":template,"expectedAuthoringRevision":doc["authoringRevision"]});
    let applied = compose_command(&mut service, &owner, command.clone());
    let bindings = json!([{"variableId":caption["id"]},{"variableId":score["id"]}]);
    assert_eq!(
        applied["document"]["screens"][0]["nodes"][1]["variableBindings"],
        bindings
    );
    let expected = original.replace("\"Title\"", &serde_json::to_string(template).unwrap());
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    assert_eq!(
        compose_command(&mut service, &owner, command)["changed"],
        false
    );
    let target = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":target}),
    );
    let dependencies = resolved["effects"]["dependencies"].as_array().unwrap();
    for variable in [&caption, &score] {
        assert_eq!(
            dependencies
                .iter()
                .filter(|d| d["id"] == variable["id"])
                .count(),
            1
        );
    }
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":applied["document"]["revision"],"width":1280,"height":720,"drafts":[],"variableSamples":[{"variableId":caption["id"],"expectedSourceRevision":caption["source"]["sourceRevision"],"value":"[literal] {b}safe{/b}"}]}),
    );
    assert_eq!(
        plan["nodes"][1]["literal"],
        "Préfix [literal] {{b} [literal] {{b}safe{{/b} / 12\n[literal] {{b}safe{{/b} suffix"
    );
    for unsupported in [
        "Unknown [missing!q]",
        "[score + 1!q]",
        "[score]",
        "{custom} [score!q]",
    ] {
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":applied["document"]["revision"],"command":{"type":"variableText","nodeId":added["selectedId"],"binding":null,"text":unsupported,"expectedAuthoringRevision":doc["authoringRevision"]}}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            expected
        );
    }
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        original
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        reopened["screens"][0]["nodes"][1]["variableBindings"],
        bindings
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    let formatted_command = json!({"type":"formatText","nodeId":added["selectedId"],"values":{"text":template,"size":31},"interaction":{"expectedAuthoringRevision":reopened["authoringRevision"],"expectedTargetRevisions":[]}});
    for fault in [
        "missingAuthoring",
        "staleAuthoring",
        "unknownTemplate",
        "extraReview",
    ] {
        let mut invalid = formatted_command.clone();
        match fault {
            "missingAuthoring" => {
                invalid.as_object_mut().unwrap().remove("interaction");
            }
            "staleAuthoring" => {
                invalid["interaction"]["expectedAuthoringRevision"] = json!("stale")
            }
            "unknownTemplate" => invalid["values"]["text"] = json!("[missing!q]"),
            _ => {
                invalid["interaction"]["expectedTargetRevisions"] =
                    json!([reviewed_target(&mut service, &owner)])
            }
        }
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":reopened["revision"],"command":invalid}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            expected
        );
    }
    let formatted = compose_command(&mut service, &owner, formatted_command.clone());
    assert_eq!(
        formatted["document"]["screens"][0]["nodes"][1]["variableBindings"],
        bindings
    );
    assert_eq!(
        formatted["document"]["screens"][0]["nodes"][1]["textProperties"]["values"]["size"],
        31
    );
    assert_eq!(
        compose_command(&mut service, &owner, formatted_command)["changed"],
        false
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    composition_history(&mut service, "redo");
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":target}),
    );
    ipc(
        &mut service,
        "variable.update",
        json!({"id":score["id"],"expectedSourceRevision":score["source"]["sourceRevision"],"defaultValue":"14"}),
    );
    let after = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":target}),
    );
    assert_eq!(before["revisions"]["source"], after["revisions"]["source"]);
    assert_ne!(before["effects"]["revision"], after["effects"]["revision"]);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    assert_eq!(
        plan["nodes"][1]["literal"],
        "Préfix [literal] {{b} café / 14\ncafé suffix"
    );
}

#[test]
fn typed_action_values_keep_noncanonical_trivia_on_semantic_noop() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let model = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"ready","variableType":"bool","defaultValue":false}),
    );
    let flag = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "ready")
        .unwrap()["id"]
        .clone();
    let model = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"caption","variableType":"string","defaultValue":""}),
    );
    let caption = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "caption")
        .unwrap()["id"]
        .clone();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Keep"}),
    );
    let text = "Brackets [score] {b}tags{/b}, ) and \"quotes\"";
    let literal = serde_json::to_string(text).unwrap();
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace(
            "Null()",
            &format!("[ SetVariable(\"ready\",True) , SetVariable(\"caption\", {literal}) ]"),
        );
    save_composition_source(&mut service, &owner, &source);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let actions = json!([{"type":"setVariable","variableId":flag,"value":true},{"type":"setVariable","variableId":caption,"value":text}]);
    assert_eq!(doc["screens"][0]["nodes"][1]["actions"], actions);
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"actions","nodeId":added["selectedId"],"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}),
    );
    assert_eq!(result["changed"], false);
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
}

#[test]
fn actions_and_bindings_refuse_invalid_missing_custom_and_stale_input_without_writes() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variables = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"score","variableType":"int","defaultValue":"0"}),
    );
    let variable = variables["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap()
        .clone();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Set"}),
    );
    let text = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Score"}),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    for actions in [
        json!([{"type":"setVariable","variableId":variable["id"],"value":true}]),
        json!([{"type":"setVariable","variableId":variable["id"],"value":"score + 1"}]),
        json!([{"type":"setVariable","variableId":uuid::Uuid::new_v4().to_string(),"value":"1"}]),
        json!([{"type":"finishInteraction"}]),
    ] {
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{
            "type":"actions","nodeId":added["selectedId"],"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
    }
    let command = json!({"type":"variableText","nodeId":text["selectedId"],"binding":{"variableId":variable["id"]},"expectedAuthoringRevision":doc["authoringRevision"]});
    // An ordinary external edit changes the captured definition even if defaults stay mapped.
    let definitions = root.join("game/definitions/variables.rpy");
    let original_definitions = fs::read(&definitions).unwrap();
    fs::write(
        &definitions,
        [original_definitions.as_slice(), b"# external note\n"].concat(),
    )
    .unwrap();
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
    let fresh = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let definitions = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/definitions/variables.rpy"}),
    );
    ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":"game/definitions/variables.rpy","expectedBaseRevision":definitions["baseRevision"],"text":format!("{}# draft\n",definitions["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":fresh["revision"],"command":{
        "type":"variableText","nodeId":text["selectedId"],"binding":{"variableId":variable["id"]},"expectedAuthoringRevision":fresh["authoringRevision"]}}),
    );
    let retained = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/definitions/variables.rpy"}),
    );
    assert_eq!(retained["dirty"], true);
    assert!(retained["text"].as_str().unwrap().ends_with("# draft\n"));
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
}

#[test]
fn custom_action_and_text_expression_stay_source_only() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Custom"}),
    );
    let text = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Custom text"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("Null()", "Function(custom)");
    for literal in ["[score + 1]", "{b}Title{/b} [flag!q]", "[missing!q]"] {
        let source = original.replace("\"Custom text\"", &serde_json::to_string(literal).unwrap());
        save_composition_source(&mut service, &owner, &source);
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        assert!(doc["screens"][0]["nodes"][1]["actions"].is_null());
        assert!(doc["screens"][0]["nodes"][2]["variableBindings"].is_null());
        for command in [
            json!({"type":"actions","nodeId":button["selectedId"],"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}),
            json!({"type":"text","nodeId":text["selectedId"],"text":"Replace"}),
            json!({"type":"variableText","nodeId":text["selectedId"],"binding":null,"text":"Replace","expectedAuthoringRevision":doc["authoringRevision"]}),
            json!({"type":"formatText","nodeId":text["selectedId"],"values":{"text":"Replace","size":29},"interaction":{"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
        ] {
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
            );
            assert_eq!(
                ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
                source
            );
        }
    }
}

#[test]
fn screen_actions_retain_source_when_target_review_is_stale_dirty_or_unqualified() {
    let (_temporary, mut service, _root, panel) = composition_project();
    let target = create_action_screen(&mut service, "ledger", "panel");
    let button = compose_command(
        &mut service,
        &panel,
        json!({"type":"add","parentId":panel["rootId"],"kind":"textbutton","text":"Open ledger"}),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":panel["path"]}),
    );
    let review = reviewed_target(&mut service, &target);
    let command = json!({"type":"actions","nodeId":button["selectedId"],"actions":[{"type":"showScreen","target":review["target"]}],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review]});
    let original = ipc(&mut service, "source.open", json!({"path":target["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &target,
        &format!("{original}# source changed after review\n"),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":panel["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    let review = reviewed_target(&mut service, &target);
    let source = ipc(&mut service, "source.open", json!({"path":target["path"]}));
    let draft = format!(
        "{}# pending target draft\n",
        source["text"].as_str().unwrap()
    );
    ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":target["path"],"expectedBaseRevision":source["baseRevision"],"text":draft,"selectionStart":0,"selectionEnd":0}),
    );
    let command = json!({"type":"actions","nodeId":button["selectedId"],"actions":[{"type":"showScreen","target":review["target"]}],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review]});
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":panel["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    let retained = ipc(&mut service, "source.open", json!({"path":target["path"]}));
    assert_eq!(retained["dirty"], true);
    assert_eq!(retained["text"], draft);
    save_composition_source(
        &mut service,
        &target,
        &original.replace("    pass", "    modal True\n    pass"),
    );
    let review = reviewed_target(&mut service, &target);
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":panel["id"],"expectedRevision":doc["revision"],"command":{
        "type":"actions","nodeId":button["selectedId"],"actions":[{"type":"showScreen","target":review["target"]}],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review]}}),
    );
    assert_eq!(
        ipc(
            &mut service,
            "screens.inspect",
            json!({"path":panel["path"]})
        )["revision"],
        doc["revision"]
    );
}

#[test]
fn nested_modal_statements_never_grant_finish_or_panel_target_authority() {
    let (_temporary, mut service, _root, panel) = composition_project();
    let dialog = create_action_screen(&mut service, "confirmation", "dialog");
    let button = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":dialog["rootId"],"kind":"textbutton","text":"Finish"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":dialog["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("modal True", "modal True\n        pass");
    save_composition_source(&mut service, &dialog, &original);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":dialog["id"],"expectedRevision":doc["revision"],"command":{
        "type":"actions","nodeId":button["selectedId"],"actions":[{"type":"finishInteraction"}],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":dialog["path"]}))["text"],
        original
    );
    let panel_source = ipc(&mut service, "source.open", json!({"path":panel["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("    pass", "    modal False\n        pass\n    pass");
    save_composition_source(&mut service, &panel, &panel_source);
    let review = reviewed_target(&mut service, &panel);
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":dialog["id"],"expectedRevision":doc["revision"],"command":{
        "type":"actions","nodeId":button["selectedId"],"actions":[{"type":"showScreen","target":review["target"]}],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review]}}),
    );
}

#[test]
fn combined_apply_preserves_trivia_and_commits_text_appearance_layout_actions_in_one_history_step()
{
    let (_temporary, mut service, root, owner) = composition_project();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Go"}),
    );
    let original = (ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("action Null()", "action  Null() # keep action comment")
        + "    $ opaque = ['retain', 17] # neighbor\n")
        .replace('\n', "\r\n");
    save_composition_source(&mut service, &owner, &original);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let review = reviewed_target(&mut service, &owner);
    let actions = json!([{"type":"hideScreen","target":review["target"]}]);
    let mut command = json!({"type":"formatText","nodeId":added["selectedId"],"values":{"text":"A much longer café caption","size":29,"appearance":{"hover_color":"#abcdef"}},"layout":{"xsize":{"unit":"pixels","value":240}},"interaction":{"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[review],"actions":actions}});
    let applied = compose_command(&mut service, &owner, command.clone());
    assert_eq!(applied["changed"], true);
    let saved = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let expected = original.replace("\"Go\"", "\"A much longer café caption\"").replace("action  Null()", "action  Hide(\"notes\")").replace("        action", "        xsize 240\r\n        text_size 29\r\n        text_hover_color \"#abcdef\"\r\n        action");
    assert_eq!(saved, expected);
    assert_eq!(
        applied["document"]["screens"][0]["nodes"][1]["actions"],
        actions
    );
    // The self target review is captured from accepted bytes, not staged bytes.
    command["interaction"]["expectedTargetRevisions"] =
        json!([reviewed_target(&mut service, &owner)]);
    assert_eq!(
        compose_command(&mut service, &owner, command.clone())["changed"],
        false
    );
    let mut preserve = command.clone();
    preserve["interaction"]
        .as_object_mut()
        .unwrap()
        .remove("actions");
    preserve["interaction"]["expectedTargetRevisions"] = json!([]);
    assert_eq!(
        compose_command(&mut service, &owner, preserve)["changed"],
        false
    );
    for fault in [
        "missing",
        "duplicate",
        "stale",
        "wrongName",
        "invalidActions",
        "staleAuthoring",
    ] {
        let mut invalid = command.clone();
        if !matches!(fault, "stale" | "staleAuthoring") {
            invalid["values"]["text"] = json!("Must not leak");
        }
        match fault {
            "missing" => invalid["interaction"]["expectedTargetRevisions"] = json!([]),
            "duplicate" => {
                let row = invalid["interaction"]["expectedTargetRevisions"][0].clone();
                invalid["interaction"]["expectedTargetRevisions"]
                    .as_array_mut()
                    .unwrap()
                    .push(row);
            }
            "stale" => {
                invalid["interaction"]["expectedTargetRevisions"][0]["revisions"]["source"] =
                    json!("stale")
            }
            "wrongName" => {
                invalid["interaction"]["expectedTargetRevisions"][0]["target"]["sourceName"] =
                    json!("other")
            }
            "invalidActions" => {
                invalid["interaction"]["actions"] = json!([{"type":"finishInteraction"}])
            }
            _ => invalid["interaction"]["expectedAuthoringRevision"] = json!("stale"),
        }
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":applied["document"]["revision"],"command":invalid}),
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            saved
        );
    }
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        original
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        saved
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]})
        )["screens"][0]["nodes"][1]["actions"],
        actions
    );
    command["interaction"]["actions"] = json!([]);
    command["interaction"]["expectedTargetRevisions"] = json!([]);
    let cleared = compose_command(&mut service, &owner, command);
    assert_eq!(
        cleared["document"]["screens"][0]["nodes"][1]["actions"],
        json!([])
    );
    let null_source = saved.replace("Hide(\"notes\")", "Null()");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        null_source
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        saved
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        null_source
    );
}
