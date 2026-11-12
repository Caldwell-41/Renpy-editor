use super::*;

#[test]
fn screen_action_targets_preserve_custom_effect_uncertainty() {
    let (_temporary, mut service, root, owner) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"custom_target", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"], "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let target = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|screen| screen["name"] == "custom_target")
        .unwrap()
        .clone();
    let binding = json!({"screenId":target["id"],"sourceName":target["name"]});
    let owner_binding = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let original = ipc(&mut service, "source.open", json!({"path":target["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let button = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Target"}),
    );
    for (event, action) in [("show", "showScreen"), ("hide", "hideScreen")] {
        save_composition_source(
            &mut service,
            &target,
            &format!("{original}    on \"{event}\" action Function(custom)\n"),
        );
        let review = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":binding}),
        );
        assert_eq!(review["canShowHide"], true);
        assert_eq!(review["effects"]["unknown"], true);
        let document = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        compose_command(
            &mut service,
            &owner,
            json!({"type":"actions","nodeId":button["selectedId"],
                "actions":[{"type":action,"target":binding}],
                "expectedAuthoringRevision":document["authoringRevision"],
                "expectedTargetRevisions":[{"target":binding,"revisions":review["revisions"]}]}),
        );
        let resolved = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":owner_binding}),
        );
        assert_eq!(resolved["effects"]["unknown"], true, "{event}");
        service.close().unwrap();
        service.open_path(&root).unwrap();
        assert_eq!(
            ipc(
                &mut service,
                "screens.resolveTarget",
                json!({"binding":owner_binding})
            )["effects"],
            resolved["effects"]
        );
    }
}

#[test]
fn screen_action_targets_track_shared_components_and_finite_action_cycles() {
    let (_temporary, mut service, root, owner) = composition_project();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"shared_target",
        "expectedProjectRevision":catalog["projectRevision"], "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let target = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|screen| screen["name"] == "shared_target")
        .unwrap()
        .clone();
    let binding = json!({"screenId":target["id"],"sourceName":target["name"]});
    let owner_binding = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let group = compose_command(
        &mut service,
        &target,
        json!({"type":"add","parentId":target["rootId"],"kind":"vbox","text":""}),
    );
    compose_command(
        &mut service,
        &target,
        json!({"type":"add","parentId":group["selectedId"],"kind":"text","text":"Shared"}),
    );
    let review = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let extracted = ipc(
        &mut service,
        "screens.componentExtract",
        json!({
        "target":binding,"expected":review["revisions"],"expectedProjectRevision":catalog["projectRevision"],
        "nodeId":group["selectedId"],"name":"action_details"}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let component = catalog["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|screen| screen["id"] == extracted["componentId"])
        .unwrap()
        .clone();
    // A -> B -> A is an action cycle, not recursive component inclusion.
    for (from, to, action) in [
        (&target, &owner, "hideScreen"),
        (&owner, &target, "showScreen"),
    ] {
        let button = compose_command(
            &mut service,
            from,
            json!({"type":"add","parentId":from["rootId"],"kind":"textbutton","text":"Target"}),
        );
        let review = ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":{"screenId":to["id"],"sourceName":to["name"]}}),
        );
        let document = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":from["path"]}),
        );
        compose_command(
            &mut service,
            from,
            json!({"type":"actions","nodeId":button["selectedId"],
            "actions":[{"type":action,"target":review["binding"]}],"expectedAuthoringRevision":document["authoringRevision"],
            "expectedTargetRevisions":[{"target":review["binding"],"revisions":review["revisions"]}]}),
        );
    }
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":owner_binding}),
    );
    assert_eq!(before["effects"]["unknown"], false);
    assert_eq!(before["effects"]["shownScreens"], json!([target["id"]]));
    assert_eq!(before["effects"]["hiddenScreens"], json!([owner["id"]]));
    assert!(before["effects"]["dependencies"]
        .as_array()
        .unwrap()
        .iter()
        .any(|dependency| dependency["id"] == component["id"]));
    let source = ipc(
        &mut service,
        "source.open",
        json!({"path":component["path"]}),
    )["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &component,
        &source.replace("Shared", "Updated"),
    );
    let after = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":owner_binding}),
    );
    assert_eq!(after["effects"]["unknown"], false);
    assert_eq!(before["revisions"]["source"], after["revisions"]["source"]);
    assert_ne!(before["effects"]["revision"], after["effects"]["revision"]);
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":owner_binding,"expected":before["revisions"]})
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":owner_binding})
        )["effects"],
        after["effects"]
    );
}

#[test]
fn typed_screen_effects_capture_known_ids_bindings_and_definition_revisions() {
    let (_temporary, mut service, root, owner) = composition_project();
    let authoring = ipc(
        &mut service,
        "variable.create",
        json!({
            "technicalName":"score", "variableType":"int", "defaultValue":"0"
        }),
    );
    let variable = authoring["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|variable| variable["technicalName"] == "score")
        .unwrap()
        .clone();
    let label = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"add", "parentId":owner["rootId"], "kind":"text", "text":"Score"
        }),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    compose_command(
        &mut service,
        &owner,
        json!({
            "type":"variableText", "nodeId":label["selectedId"],
            "binding":{"variableId":variable["id"]}, "expectedAuthoringRevision":doc["authoringRevision"]
        }),
    );
    let button = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"add", "parentId":owner["rootId"], "kind":"textbutton", "text":"Record"
        }),
    );
    let binding = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let reviewed = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    compose_command(
        &mut service,
        &owner,
        json!({
            "type":"actions", "nodeId":button["selectedId"],
            "actions":[{"type":"setVariable","variableId":variable["id"],"value":"5"},
                       {"type":"showScreen","target":binding}, {"type":"hideScreen","target":binding}],
            "expectedAuthoringRevision":doc["authoringRevision"],
            "expectedTargetRevisions":[{"target":binding,"revisions":reviewed["revisions"]}]
        }),
    );
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(before["effects"]["unknown"], false);
    assert_eq!(
        before["effects"]["assignedVariables"],
        json!([variable["id"]])
    );
    assert_eq!(before["effects"]["shownScreens"], json!([owner["id"]]));
    assert_eq!(before["effects"]["hiddenScreens"], json!([owner["id"]]));
    let dependencies = before["effects"]["dependencies"].as_array().unwrap();
    assert!(dependencies.iter().any(|row| row["id"] == variable["id"]));
    assert!(dependencies
        .iter()
        .any(|row| row["id"] == format!("{}:action", button["selectedId"].as_str().unwrap())));
    ipc(
        &mut service,
        "variable.update",
        json!({
            "id":variable["id"], "expectedSourceRevision":variable["source"]["sourceRevision"], "defaultValue":"7"
        }),
    );
    let after = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(before["revisions"]["source"], after["revisions"]["source"]);
    assert_ne!(before["effects"]["revision"], after["effects"]["revision"]);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":binding})
        )["effects"],
        after["effects"]
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &owner,
        &source.replace(
            "action [SetVariable",
            "hovered Function(custom)\n        action [SetVariable",
        ),
    );
    assert_eq!(
        ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":binding})
        )["effects"]["unknown"],
        true
    );
}

#[test]
fn story_call_accepts_known_assignment_then_finish_and_rejects_changed_effect_revisions() {
    let (_temporary, mut service, _root, _) = composition_project();
    let authoring = ipc(
        &mut service,
        "variable.create",
        json!({
            "technicalName":"confirmed", "variableType":"bool", "defaultValue":false
        }),
    );
    let variable = authoring["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|variable| variable["technicalName"] == "confirmed")
        .unwrap()
        .clone();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"confirm_actions", "kind":"dialog", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"], "expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|owner| owner["name"] == "confirm_actions")
        .unwrap()
        .clone();
    let button = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"add", "parentId":owner["rootId"], "kind":"textbutton", "text":"Confirm"
        }),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    compose_command(
        &mut service,
        &owner,
        json!({
            "type":"actions", "nodeId":button["selectedId"], "expectedAuthoringRevision":doc["authoringRevision"],
            "expectedTargetRevisions":[], "actions":[{"type":"setVariable","variableId":variable["id"],"value":true}, {"type":"finishInteraction"}]
        }),
    );
    let binding = json!({"screenId":owner["id"],"sourceName":owner["name"]});
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(target["effects"]["unknown"], false);
    assert_eq!(target["effects"]["finishesInteraction"], true);
    let model = ipc(&mut service, "scene.list", json!({}));
    let scene = model["scenes"][0].clone();
    let command = json!({"type":"insertBodyBeat", "sceneId":scene["id"], "expectedSourceRevision":scene["sourceRevision"],
        "body":{"type":"root"}, "position":{"type":"before","anchor":{"type":"beat","beatId":scene["beats"].as_array().unwrap().last().unwrap()["id"]}},
        "beat":{"type":"callScreen","target":binding,"revisions":target["revisions"]}});
    let applied = ipc(
        &mut service,
        "scene.apply",
        json!({
            "expectedProjectRevision":model["projectRevision"], "expectedSourceMapRevision":model["sourceMapRevision"], "command":command
        }),
    );
    let call = applied["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|beat| beat["payload"]["type"] == "callScreen")
        .unwrap();
    assert_eq!(call["screenEffects"], target["effects"]);
    project_history(&mut service, "undo");
    ipc(
        &mut service,
        "variable.update",
        json!({
            "id":variable["id"],"expectedSourceRevision":variable["source"]["sourceRevision"],"defaultValue":true
        }),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    reject(
        &mut service,
        "scene.apply",
        json!({
            "expectedProjectRevision":model["projectRevision"], "expectedSourceMapRevision":model["sourceMapRevision"], "command":command
        }),
    );
    assert!(
        !ipc(&mut service, "scene.list", json!({}))["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .any(|beat| beat["payload"]["type"] == "callScreen")
    );
}
