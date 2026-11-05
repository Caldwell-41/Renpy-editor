use super::*;
use base64::Engine;

// Public-domain solid-color 80x40 PNGs, created for this synthetic fixture.
const STATE_PNGS: [&str;6] = [
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAASklEQVR4nO3PAQkAMAzAsMmZfz0XcxmHPlABzZzdr5rnB8DAwMDAwMDfBFwPuB5wPeB6wPWA6wHXA64HXA+4HnA94HrA9YDrAde7kiKm08mSKtMAAAAASUVORK5CYII=",
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAAS0lEQVR4nO3PAQkAIBDAQOMYwtgGNIawP1iA3dr3jGp9PwAGBgYGBgYeE3A94HrA9YDrAdcDrgdcD7gecD3gesD1gOsB1wOuB1zvAbGwrMT5CBtuAAAAAElFTkSuQmCC",
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAAS0lEQVR4nO3PAQkAIBDAQOMYx/4YxhjC/mABdmufO6r1/QAYGBgYGBh4TMD1gOsB1wOuB1wPuB5wPeB6wPWA6wHXA64HXA+4HnC9BzTbmvG0AgROAAAAAElFTkSuQmCC",
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAAS0lEQVR4nO3PAQkAIBDAQEMY22DGMoawP1iA3bpnj2p9PwAGBgYGBgYeE3A94HrA9YDrAdcDrgdcD7gecD3gesD1gOsB1wOuB1zvAeW2lQCJW7nLAAAAAElFTkSuQmCC",
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAAS0lEQVR4nO3PAQkAIBDAQOMY1jgGNIawP1iA3Tr7jmp9PwAGBgYGBgYeE3A94HrA9YDrAdcDrgdcD7gecD3gesD1gOsB1wOuB1zvAScglQBGgILDAAAAAElFTkSuQmCC",
"iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAATElEQVR4nO3PQQ0AIBDAMETgXwBvBCKDZNdkAta1zx3V+n4ADAwMDAwMPCbgesD1gOsB1wOuB1wPuB5wPeB6wPWA6wHXA64HXA+43gNYtBIPIZ3EFgAAAABJRU5ErkJggg==",
];

fn int_variable(service: &mut LifecycleService) -> Value {
    let model = ipc(
        service,
        "variable.create",
        json!({"technicalName":"score","variableType":"int","defaultValue":"3"}),
    );
    model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap()
        .clone()
}

fn import_image(
    temporary: &tempfile::TempDir,
    service: &mut LifecycleService,
    root: &std::path::Path,
    name: &str,
) -> Value {
    import_image_bytes(
        temporary,
        service,
        root,
        name,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
}

fn import_image_bytes(
    temporary: &tempfile::TempDir,
    service: &mut LifecycleService,
    root: &std::path::Path,
    name: &str,
    bytes: &[u8],
) -> Value {
    fs::create_dir_all(root.join("game/images")).unwrap();
    let selected = temporary.path().join(format!("{name}.png"));
    fs::write(&selected, bytes).unwrap();
    let choice = service.authoring_select_import(&selected).unwrap();
    let model = ipc(
        service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"uiImage","technicalName":name,"displayName":name}),
    );
    let asset = model["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["discoveryName"] == format!("ui {name}"))
        .unwrap();
    json!({"assetId":asset["id"],"expectedAssetSha256":asset["sha256"]})
}

#[test]
fn imagebutton_asset_action_roundtrip_is_one_transaction() {
    let (temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let asset = import_image(&temporary, &mut service, &root, "button_idle");
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let appearances = json!({"normal":asset,"hover":asset,"selected":null,"selectedHover":null,"disabled":null,"selectedDisabled":null});
    let actions = json!([{"type":"setVariable","variableId":variable["id"],"value":"9"}]);
    let command = json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":appearances,"width":160,"height":80,"interaction":{"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}});
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    let result = compose_command(&mut service, &owner, command);
    let node = &result["document"]["screens"][0]["nodes"][1];
    assert_eq!(
        node["imageButtonAppearances"]["normal"]["assetId"],
        asset["assetId"]
    );
    assert_eq!(node["actions"], actions);
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    assert!(source
        .as_str()
        .unwrap()
        .contains("action SetVariable(\"score\", 9)"));
    assert!(source
        .as_str()
        .unwrap()
        .contains("idle Transform(\"images/ui button_idle.png\", xysize=(160, 80))"));
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
    assert_eq!(reopened["screens"][0]["nodes"][1]["actions"], actions);
    assert_eq!(
        reopened["screens"][0]["nodes"][1]["imageButtonAppearances"],
        node["imageButtonAppearances"]
    );
}

#[test]
fn bar_effects_include_possible_variable_writes_and_custom_values_stay_unknown() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"addBar","parentId":owner["rootId"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let resolve = json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}});
    let resolved = ipc(&mut service, "screens.resolveTarget", resolve.clone());
    assert_eq!(resolved["effects"]["unknown"], false);
    assert_eq!(
        resolved["effects"]["assignedVariables"],
        json!([variable["id"]])
    );
    let deps = resolved["effects"]["dependencies"].as_array().unwrap();
    assert!(deps.iter().any(
        |d| d["id"] == variable["id"] && d["revision"] == variable["source"]["sourceRevision"]
    ));
    assert!(deps
        .iter()
        .any(|d| d["id"] == format!("{}:binding", result["selectedId"].as_str().unwrap())));
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace(
            "VariableValue(\"score\", min=-5, max=15, step=1, force_step=True)",
            "custom_value()",
        );
    save_composition_source(&mut service, &owner, &source);
    assert_eq!(
        ipc(&mut service, "screens.resolveTarget", resolve)["effects"]["unknown"],
        true
    );
    assert_eq!(
        ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]})
        )["screens"][0]["nodes"][1]["barBinding"],
        Value::Null
    );
}

#[test]
fn control_canvas_samples_are_validated_data_and_never_write_source() {
    let (temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let asset = import_image(&temporary, &mut service, &root, "canvas_button");
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let binding = json!({"variableId":variable["id"],"minimum":"-5","maximum":"15"});
    let bar = compose_command(
        &mut service,
        &owner,
        json!({"type":"addBar","parentId":owner["rootId"],"binding":binding,"appearance":{},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let doc = bar["document"].clone();
    let appearances = json!({"normal":asset,"selectedHover":asset,"selectedDisabled":asset});
    let image = compose_command(
        &mut service,
        &owner,
        json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":appearances,"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    let doc = &image["document"];
    let nodes = doc["screens"][0]["nodes"].as_array().unwrap();
    let bar_start =
        nodes.iter().find(|n| n["id"] == bar["selectedId"]).unwrap()["span"]["start"].clone();
    let image_start = nodes
        .iter()
        .find(|n| n["id"] == image["selectedId"])
        .unwrap()["span"]["start"]
        .clone();
    let source = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720,"buttonState":"selectedHover","variableSamples":[{"variableId":variable["id"],"expectedSourceRevision":variable["source"]["sourceRevision"],"value":"7"}],"barSamples":[{"nodeStart":bar_start,"binding":binding,"appearance":{"thumb":"#f00"},"width":400,"height":30,"expectedAuthoringRevision":doc["authoringRevision"]}],"imageButtonSamples":[{"nodeStart":image_start,"appearances":appearances,"width":200,"height":100}]}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    let bar_node = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["start"] == bar_start)
        .unwrap();
    assert_eq!(bar_node["properties"]["value"], 12);
    assert_eq!(bar_node["properties"]["range"], 20);
    assert_eq!(bar_node["properties"]["thumb"], "#f00");
    assert_eq!(bar_node["properties"]["xsize"], 400);
    let image_node = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["start"] == image_start)
        .unwrap();
    assert_eq!(
        image_node["properties"]["selected_hover"],
        "images/ui canvas_button.png"
    );
    assert!(!serde_json::to_string(&plan)
        .unwrap()
        .contains("VariableValue"));
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}

#[test]
fn integer_bar_creation_binds_without_changing_default_and_reopens() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let defaults = fs::read(root.join(variable["source"]["path"].as_str().unwrap())).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let binding = json!({"variableId":variable["id"],"minimum":"-5","maximum":"15"});
    let appearance = json!({"leftBar":"#123456","rightBar":null,"thumb":"#abc"});
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"addBar","parentId":owner["rootId"],"binding":binding,"appearance":appearance,"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == result["selectedId"])
        .unwrap();
    assert_eq!(
        node["barBinding"],
        binding,
        "{}",
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
    );
    assert_eq!(node["barAppearance"], appearance);
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}));
    assert!(source["text"]
        .as_str()
        .unwrap()
        .contains("value VariableValue(\"score\", min=-5, max=15, step=1, force_step=True)"));
    assert_eq!(
        fs::read(root.join(variable["source"]["path"].as_str().unwrap())).unwrap(),
        defaults
    );
    composition_history(&mut service, "undo");
    assert!(
        !ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .contains("VariableValue")
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(reopened["screens"][0]["nodes"][1]["barBinding"], binding);
}

#[test]
fn bar_edits_preserve_opaque_neighbors_comments_and_refuse_stale_or_unsafe_requests() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let mut command = json!({"type":"addBar","parentId":owner["rootId"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{"leftBar":"#123"},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]});
    let added = compose_command(&mut service, &owner, command.clone());
    command["type"] = json!("bar");
    command.as_object_mut().unwrap().remove("parentId");
    command["nodeId"] = added["selectedId"].clone();
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("left_bar \"#123\"", "left_bar \"#123\" # keep color note");
    let original = format!("{original}    if custom_flag:\n        text custom_caption\n");
    save_composition_source(&mut service, &owner, &original);
    command["binding"]["maximum"] = json!("25");
    command["appearance"] = json!({"leftBar":null});
    let edited = compose_command(&mut service, &owner, command.clone());
    assert_eq!(edited["changed"], true);
    let expected = original
        .replace("max=15", "max=25")
        .replace("left_bar \"#123\"", "pass");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    assert_eq!(
        compose_command(&mut service, &owner, command.clone())["changed"],
        false
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    for (minimum, maximum) in [
        ("00", "15"),
        ("-0", "15"),
        ("0", "0"),
        ("15", "-5"),
        ("0", "9007199254740992"),
        ("-9007199254740991", "9007199254740991"),
    ] {
        let mut bad = command.clone();
        bad["binding"]["minimum"] = json!(minimum);
        bad["binding"]["maximum"] = json!(maximum);
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":bad}),
        );
    }
    let mut missing = command.clone();
    missing["binding"]["variableId"] = json!("missing");
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":missing}),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":"stale","command":command}),
    );
    fs::write(
        root.join(variable["source"]["path"].as_str().unwrap()),
        "default score = False\n",
    )
    .unwrap();
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        expected
    );
}

#[test]
fn control_noops_and_unrelated_edits_preserve_recognized_expression_bytes() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let binding = json!({"variableId":variable["id"],"minimum":"-5","maximum":"15"});
    let bar = compose_command(
        &mut service,
        &owner,
        json!({"type":"addBar","parentId":owner["rootId"],"binding":binding,"appearance":{"thumb":"#123"},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace(
            "VariableValue(\"score\", min=-5, max=15, step=1, force_step=True)",
            "VariableValue(\"score\",min=-5,max=15,step=1,force_step=True)",
        );
    save_composition_source(&mut service, &owner, &source);
    let mut command = json!({"type":"bar","nodeId":bar["selectedId"],"binding":binding,"appearance":{"thumb":"#123"},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]});
    assert_eq!(
        compose_command(&mut service, &owner, command.clone())["changed"],
        false
    );
    command["appearance"]["thumb"] = json!("#456");
    compose_command(&mut service, &owner, command);
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source.replace("#123", "#456")
    );
}

#[test]
fn imagebutton_custom_actions_assets_and_context_keep_conservative_effects() {
    let (temporary, mut service, root, owner) = composition_project();
    let asset = import_image(&temporary, &mut service, &root, "state_button");
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let mut command = json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":{"normal":asset,"hover":asset},"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}});
    let added = compose_command(&mut service, &owner, command.clone());
    command["type"] = json!("imageButton");
    command.as_object_mut().unwrap().remove("parentId");
    command["nodeId"] = added["selectedId"].clone();
    assert_eq!(
        compose_command(&mut service, &owner, command.clone())["changed"],
        false
    );
    let resolve = json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}});
    let effects = ipc(&mut service, "screens.resolveTarget", resolve.clone());
    assert_eq!(effects["effects"]["unknown"], false);
    assert!(effects["effects"]["dependencies"]
        .as_array()
        .unwrap()
        .iter()
        .any(|d| d["id"] == asset["assetId"] && d["revision"] == asset["expectedAssetSha256"]));
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace(
            "action Null()",
            "action Function(custom) # keep custom action",
        );
    save_composition_source(&mut service, &owner, &original);
    assert_eq!(
        ipc(&mut service, "screens.resolveTarget", resolve.clone())["effects"]["unknown"],
        true
    );
    command["interaction"]["actions"] = Value::Null;
    command["width"] = json!(180);
    compose_command(&mut service, &owner, command.clone());
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    assert!(source
        .as_str()
        .unwrap()
        .contains("action Function(custom) # keep custom action"));
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    command["interaction"]["actions"] = json!([{"type":"finishInteraction"}]);
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    fs::remove_file(root.join("game/images/ui state_button.png")).unwrap();
    command["interaction"]["actions"] = Value::Null;
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
    );
    assert_eq!(
        ipc(&mut service, "screens.resolveTarget", resolve)["effects"]["unknown"],
        true
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
}

#[test]
fn export_screen_controls_public_core_fixture() {
    let output_temp = tempfile::tempdir().unwrap();
    let output = std::env::var_os("LOOMLIGHT_SCREEN_CONTROLS_EXPORT")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| output_temp.path().join("accepted"));
    assert!(!output.exists(), "Export requires a fresh directory");
    let (temporary, mut service, root, panel) = composition_project();
    let dialog = super::actions::create_action_screen(&mut service, "control_dialog", "dialog");
    let model = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"control_score","variableType":"int","defaultValue":"0"}),
    );
    let variable = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "control_score")
        .unwrap()
        .clone();
    assert_eq!(variable["defaultValue"], "0");
    fs::create_dir_all(root.join("game/images")).unwrap();
    let mut appearances = json!({});
    for (i, state) in [
        "normal",
        "hover",
        "selected",
        "selectedHover",
        "disabled",
        "selectedDisabled",
    ]
    .iter()
    .enumerate()
    {
        let selected = temporary.path().join(format!("control_state_{i}.png"));
        fs::write(
            &selected,
            base64::engine::general_purpose::STANDARD
                .decode(STATE_PNGS[i])
                .unwrap(),
        )
        .unwrap();
        let choice = service.authoring_select_import(&selected).unwrap();
        let name = format!("control_state_{i}");
        let model = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,"kind":"uiImage","technicalName":name,"displayName":name}),
        );
        let asset = model["assets"]
            .as_array()
            .unwrap()
            .iter()
            .find(|a| a["discoveryName"] == format!("ui {name}"))
            .unwrap();
        appearances[*state] = json!({"assetId":asset["id"],"expectedAssetSha256":asset["sha256"]});
    }
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let bar = compose_command(
        &mut service,
        &dialog,
        json!({"type":"addBar","parentId":dialog["rootId"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{"leftBar":"#28783c","rightBar":"#202830","thumb":"#e0e0e0"},"width":320,"height":24,"layout":{"xpos":{"unit":"pixels","value":100},"ypos":{"unit":"pixels","value":100}},"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let target = super::actions::reviewed_target(&mut service, &panel);
    let actions = json!([{"type":"setVariable","variableId":variable["id"],"value":"7"},{"type":"hideScreen","target":target["target"]},{"type":"finishInteraction"}]);
    let image = compose_command(
        &mut service,
        &dialog,
        json!({"type":"addImageButton","parentId":dialog["rootId"],"appearances":appearances,"width":160,"height":80,"layout":{"xpos":{"unit":"pixels","value":100},"ypos":{"unit":"pixels","value":180}},"interaction":{"actions":actions,"expectedAuthoringRevision":bar["document"]["authoringRevision"],"expectedTargetRevisions":[target]}}),
    );
    let binding = json!({"screenId":dialog["id"],"sourceName":dialog["name"]});
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(resolved["effects"]["unknown"], false, "{resolved}");
    assert_eq!(resolved["blocking"], true);
    assert_eq!(
        resolved["effects"]["assignedVariables"],
        json!([variable["id"]])
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry_id = model["entrySceneId"].clone();
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    save_composition_source(
        &mut service,
        &json!({"path":entry["sourcePath"]}),
        &format!(
            "label {}:\n    return\n",
            entry["technicalLabel"].as_str().unwrap()
        ),
    );
    super::panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"narration","text":"SC_BEFORE"}),
    );
    let panel_target = super::actions::reviewed_target(&mut service, &panel);
    super::panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"showScreen","target":panel_target["target"],"revisions":panel_target["revisions"]}),
    );
    // Story changes alter inventory revisions; bind each entry to a fresh review.
    let reviewed = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    super::panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"callScreen","target":binding,"revisions":reviewed["revisions"]}),
    );
    for text in ["SC_AFTER", "SC_DONE"] {
        super::panel_fixture::append(
            &mut service,
            &entry_id,
            json!({"type":"narration","text":text}),
        );
    }
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap()
        .clone();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":dialog["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(source.contains("min=-5, max=15, step=1, force_step=True"));
    assert!(source.contains("SetVariable(\"control_score\", 7)"));
    let mut canvas = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        for state in [
            "normal",
            "hover",
            "selected",
            "selectedHover",
            "disabled",
            "selectedDisabled",
        ] {
            let request = json!({"path":dialog["path"],"screenName":dialog["name"],"expectedRevision":document["revision"],"width":width,"height":height,"buttonState":state});
            let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
            assert_eq!(plan["available"], true, "{plan}");
            canvas.push(json!({"request":request,"plan":plan}));
        }
    }
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    let mut paths = vec![];
    super::panel_fixture::collect_files(&root, &root.join("game"), &mut paths);
    let mut files = vec![];
    for path in paths {
        assert!(path.ends_with(".rpy") || path.ends_with(".png"));
        let bytes = fs::read(root.join(&path)).unwrap();
        let target = output.join(&path);
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::write(target, &bytes).unwrap();
        files.push(
            json!({"path":path,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()}),
        );
    }
    assert_eq!(
        files
            .iter()
            .filter(|f| f["path"].as_str().unwrap().ends_with(".png"))
            .count(),
        6
    );
    let mut sidecars = serde_json::Map::new();
    for (key, name) in [
        ("project", "project.json"),
        ("sourceMap", "source-map.json"),
        ("authoring", "authoring.json"),
    ] {
        let bytes = fs::read(root.join(".renpy-editor").join(name)).unwrap();
        sidecars.insert(key.into(), serde_json::from_slice::<Value>(&bytes).unwrap());
        fs::write(output.join(name), &bytes).unwrap();
    }
    let manifest = json!({"schemaVersion":1,"sdkVersion":"8.5.3","publicCoreRequests":true,"engineStarted":false,"owner":dialog,"dialog":dialog,"panel":panel,"entry":entry,"document":document,"barId":bar["selectedId"],"imageButtonId":image["selectedId"],"variable":variable,"actions":actions,"resolvedTarget":resolved,"files":files,"sidecars":sidecars,"canvas":canvas,"expected":{"minimum":"-5","maximum":"15","initial":"0","afterAction":"7"},"normalStoryCallAdmitted":true,"normalStoryShowAdmitted":true});
    let bytes = serde_json::to_vec_pretty(&manifest).unwrap();
    fs::write(output.join("manifest.json"), &bytes).unwrap();
    service.close().unwrap();
    println!(
        "SCREEN_CONTROLS_FIXTURE {}",
        json!({"schemaVersion":1,"manifestSHA256":hex::encode(Sha256::digest(&bytes)),"publicCoreRequests":true,"engineStarted":false})
    );
}

#[test]
fn imagebutton_reviewed_replacements_update_both_assets_and_return_current_inspection() {
    let (temporary, mut service, root, owner) = composition_project();
    let normal = import_image(&temporary, &mut service, &root, "replace_idle");
    let hover = import_image_bytes(
        &temporary,
        &mut service,
        &root,
        "replace_hover",
        &base64::engine::general_purpose::STANDARD
            .decode(STATE_PNGS[5])
            .unwrap(),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":{"normal":normal,"hover":hover},"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    let before = fs::read(root.join(".renpy-editor/authoring.json")).unwrap();
    let mut appearances = json!({"normal":normal,"hover":hover});
    for (i, (state, name)) in [("normal", "replace_idle"), ("hover", "replace_hover")]
        .iter()
        .enumerate()
    {
        fs::write(
            root.join(format!("game/images/ui {name}.png")),
            base64::engine::general_purpose::STANDARD
                .decode(STATE_PNGS[i])
                .unwrap(),
        )
        .unwrap();
        let review = ipc(
            &mut service,
            "asset.reviewUiImage",
            json!({"assetId":appearances[*state]["assetId"],"expectedAssetSha256":appearances[*state]["expectedAssetSha256"]}),
        );
        appearances[*state]["replacementSha256"] = review["sha256"].clone();
    }
    let preview = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":added["document"]["revision"],"width":1280,"height":720,"imageButtonSamples":[{"nodeStart":added["document"]["screens"][0]["nodes"][1]["span"]["start"],"appearances":appearances,"width":180,"height":90}]}),
    );
    assert_eq!(preview["available"], true, "{preview}");
    let command = json!({"type":"imageButton","nodeId":added["selectedId"],"appearances":appearances,"width":180,"height":90,"interaction":{"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}});
    let result = compose_command(&mut service, &owner, command);
    let inspected = &result["document"]["screens"][0]["nodes"][1]["imageButtonAppearances"];
    for state in ["normal", "hover"] {
        assert_eq!(
            inspected[state]["expectedAssetSha256"],
            appearances[state]["replacementSha256"]
        );
    }
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read(root.join(".renpy-editor/authoring.json")).unwrap(),
        before
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]})
        )["screens"][0]["nodes"][1]["imageButtonAppearances"],
        *inspected
    );
}

#[test]
fn control_canvas_drafts_refuse_wrong_targets_competing_dimensions_and_stale_catalog() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let source = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let draft = json!({"parentStart":doc["screens"][0]["nodes"][0]["span"]["start"],"expectedAuthoringRevision":doc["authoringRevision"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{},"width":300,"height":24});
    let request = json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720,"barAddition":draft});
    assert_eq!(
        ipc(&mut service, "screens.canvasPlan", request.clone())["available"],
        true
    );
    for variant in [
        "missing",
        "both",
        "sample-target",
        "two-additions",
        "dimensions",
        "stale",
    ] {
        let mut bad = request.clone();
        match variant {
            "missing" => {
                bad["barAddition"]
                    .as_object_mut()
                    .unwrap()
                    .remove("parentStart");
            }
            "both" => bad["barAddition"]["nodeStart"] = bad["barAddition"]["parentStart"].clone(),
            "sample-target" => {
                bad["barSamples"] = json!([draft]);
                bad.as_object_mut().unwrap().remove("barAddition");
            }
            "two-additions" => {
                bad["addition"] =
                    json!({"parentStart":draft["parentStart"],"kind":"text","text":"Extra"})
            }
            "dimensions" => {
                bad["layouts"] = json!([{"nodeStart":source.len()+1,"values":{"xsize":{"unit":"pixels","value":200}}}])
            }
            _ => bad["barAddition"]["expectedAuthoringRevision"] = json!("stale"),
        }
        reject(&mut service, "screens.canvasPlan", bad);
    }
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}

#[test]
fn control_canvas_addition_layout_uses_selected_screen_end_before_trailing_source() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned()
        + "\nscreen trailing():\n    text \"Keep this screen\"\n";
    save_composition_source(&mut service, &owner, &source);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let selected = &doc["screens"][0];
    let synthetic = selected["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["span"]["end"].as_u64().unwrap())
        .max()
        .unwrap()
        + 1;
    assert_ne!(synthetic, source.len() as u64 + 1);
    let request = json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720,"barAddition":{"parentStart":selected["nodes"][0]["span"]["start"],"expectedAuthoringRevision":doc["authoringRevision"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{},"width":300,"height":24},"layouts":[{"nodeStart":synthetic,"values":{"xpos":{"unit":"pixels","value":123},"ypos":{"unit":"relative","value":0.25}}}]});
    let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
    let node = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "bar")
        .unwrap();
    assert_eq!(node["start"], synthetic);
    assert_eq!(node["properties"]["xpos"], 123);
    assert_eq!(node["properties"]["ypos"], 0.25);
    let mut missing = request.clone();
    missing.as_object_mut().unwrap().remove("barAddition");
    reject(&mut service, "screens.canvasPlan", missing);
    let mut wrong = request.clone();
    wrong["layouts"][0]["nodeStart"] = json!(source.len() + 1);
    reject(&mut service, "screens.canvasPlan", wrong);
    let mut duplicate = request.clone();
    duplicate["layouts"] = json!([request["layouts"][0], request["layouts"][0]]);
    reject(&mut service, "screens.canvasPlan", duplicate);
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}

#[test]
fn imagebutton_dimensions_use_combined_owner_and_plain_paths_remain_source_only() {
    let (temporary, mut service, root, owner) = composition_project();
    let asset = import_image(&temporary, &mut service, &root, "size_button");
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":{"normal":asset,"hover":asset},"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    let doc = &added["document"];
    let start = doc["screens"][0]["nodes"][1]["span"]["start"].clone();
    let base = json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"nodeStart":start});
    let source = fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap();
    for (operation, extra) in [
        ("screens.setSize", json!({"width":200,"height":100})),
        ("screens.setPixel", json!({"property":"xsize","value":200})),
        (
            "screens.setLayout",
            json!({"values":{"xsize":{"unit":"pixels","value":200}}}),
        ),
    ] {
        let mut request = base.clone();
        request
            .as_object_mut()
            .unwrap()
            .extend(extra.as_object().unwrap().clone());
        reject(&mut service, operation, request);
    }
    let request = json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720});
    let mut generic = request.clone();
    generic["drafts"] = json!([{"nodeStart":start,"width":200,"height":100}]);
    reject(&mut service, "screens.canvasPlan", generic);
    for key in [
        "xsize", "ysize", "xminimum", "yminimum", "xmaximum", "ymaximum", "xysize", "minimum",
        "maximum",
    ] {
        let mut generic = request.clone();
        generic["layouts"] =
            json!([{"nodeStart":start,"values":{key:{"unit":"pixels","value":200}}}]);
        reject(&mut service, "screens.canvasPlan", generic);
    }
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
    let plain = source.replace(
        "Transform(\"images/ui size_button.png\", xysize=(160, 80))",
        "\"images/ui size_button.png\"",
    );
    save_composition_source(&mut service, &owner, &plain);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert!(doc["screens"][0]["nodes"][1]["imageButtonAppearances"].is_null());
    assert_eq!(
        ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720})
        )["available"],
        false
    );
    assert_eq!(
        ipc(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}})
        )["effects"]["unknown"],
        true
    );
}

#[test]
fn imagebutton_dimensions_alias_prepares_explicit_renderer_dimensions() {
    let (temporary, mut service, root, owner) = composition_project();
    let asset = import_image(&temporary, &mut service, &root, "alias_button");
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    compose_command(
        &mut service,
        &owner,
        json!({"type":"addImageButton","parentId":owner["rootId"],"appearances":{"normal":asset,"hover":asset},"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}),
    );
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .replace("xsize 160\n        ysize 80", "xysize (160, 80)");
    save_composition_source(&mut service, &owner, &source);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert!(!doc["screens"][0]["nodes"][1]["imageButtonAppearances"].is_null());
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    let properties = &plan["nodes"][1]["properties"];
    assert_eq!(properties["xsize"], 160);
    assert_eq!(properties["ysize"], 80);
    assert!(properties.get("xysize").is_none());
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}

#[test]
fn bar_groups_do_not_gain_component_binding_permission_through_extraction() {
    let (_temporary, mut service, root, owner) = composition_project();
    let variable = int_variable(&mut service);
    let group = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let bar = compose_command(
        &mut service,
        &owner,
        json!({"type":"addBar","parentId":group["selectedId"],"binding":{"variableId":variable["id"],"minimum":"-5","maximum":"15"},"appearance":{},"width":300,"height":24,"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let peer = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Neighbor"}),
    );
    assert_eq!(
        compose_command(
            &mut service,
            &owner,
            json!({"type":"reorder","nodeId":group["selectedId"],"targetId":peer["selectedId"],"after":true})
        )["changed"],
        true
    );
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}}),
    );
    assert_eq!(resolved["effects"]["unknown"], false);
    assert_eq!(
        resolved["effects"]["assignedVariables"],
        json!([variable["id"]])
    );
    assert_eq!(resolved["effects"]["finishesInteraction"], false);
    assert_eq!(resolved["effects"]["hiddenScreens"], json!([]));
    assert!(resolved["effects"]["dependencies"]
        .as_array()
        .unwrap()
        .iter()
        .any(|d| d["id"] == format!("{}:binding", bar["selectedId"].as_str().unwrap())));
    assert!(resolved["effects"]["dependencies"]
        .as_array()
        .unwrap()
        .iter()
        .any(
            |d| d["id"] == variable["id"] && d["revision"] == variable["source"]["sourceRevision"]
        ));
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let source = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    reject(
        &mut service,
        "screens.componentPrepareExtract",
        json!({"screenId":owner["id"],"nodeId":group["selectedId"],"expectedRevision":doc["revision"]}),
    );
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
}
