//! Accepted public-core source export only. Ren'Py execution is a separate gate.
use super::super::panel_fixture;
use super::*;
use std::path::{Path, PathBuf};

fn export_file(root: &Path, output: &Path, relative: &str) -> Value {
    let bytes = fs::read(root.join(relative)).unwrap();
    let target = output.join(relative);
    fs::create_dir_all(target.parent().unwrap()).unwrap();
    fs::write(target, &bytes).unwrap();
    json!({"path":relative,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()})
}

#[test]
fn ordered_actions_export_public_core_normal_entry_without_engine_execution() {
    let output_temp = tempfile::tempdir().unwrap();
    let output = std::env::var_os("LOOMLIGHT_ACTIONS_FIXTURE_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| output_temp.path().join("accepted"));
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    let (_temporary, mut service, root, panel) = composition_project();
    let dialog = create_action_screen(&mut service, "actions_dialog", "dialog");
    for (name, kind, value) in [
        ("action_ready", "bool", json!(false)),
        ("action_score", "int", json!("0")),
        ("action_caption", "string", json!("Initial")),
    ] {
        ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
    }
    let authoring = ipc(&mut service, "authoring.list", json!({}));
    let find = |name: &str| {
        authoring["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap()
            .clone()
    };
    let ready = find("action_ready");
    let score = find("action_score");
    let caption = find("action_caption");
    let column = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":dialog["rootId"],"kind":"vbox","text":""}),
    );
    let mut text_nodes = vec![];
    for variable in [&ready, &score, &caption] {
        let added = compose_command(
            &mut service,
            &dialog,
            json!({"type":"add","parentId":column["selectedId"],"kind":"text","text":"Value"}),
        );
        text_nodes.push(json!({"nodeId":added["selectedId"],"variableId":variable["id"]}));
    }
    let mixed = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":column["selectedId"],"kind":"text","text":"Template"}),
    );
    let button = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":column["selectedId"],"kind":"textbutton","text":"Apply sequence"}),
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
    panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"narration","text":"OA_BEFORE"}),
    );
    let binding = json!({"screenId":dialog["id"],"sourceName":dialog["name"]});
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"callScreen","target":binding,"revisions":resolved["revisions"]}),
    );
    for marker in ["OA_AFTER", "OA_DONE"] {
        panel_fixture::append(
            &mut service,
            &entry_id,
            json!({"type":"narration","text":marker}),
        );
    }
    for node in &text_nodes {
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":dialog["path"]}),
        );
        compose_command(
            &mut service,
            &dialog,
            json!({"type":"variableText","nodeId":node["nodeId"],"binding":{"variableId":node["variableId"]},"expectedAuthoringRevision":doc["authoringRevision"]}),
        );
    }
    let template = "Values: [action_caption!q] / [action_score!q]\nAgain [action_caption!q]";
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let formatted = compose_command(
        &mut service,
        &dialog,
        json!({
            "type":"formatText", "nodeId":mixed["selectedId"], "values":{"text":template},
            "interaction":{"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}
        }),
    );
    let mixed_node = formatted["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == mixed["selectedId"])
        .unwrap();
    assert_eq!(
        mixed_node["variableBindings"],
        json!([{"variableId":caption["id"]},{"variableId":score["id"]}])
    );
    text_nodes.push(json!({"nodeId":mixed["selectedId"],"template":template,"variableBindings":mixed_node["variableBindings"]}));
    let target = reviewed_target(&mut service, &panel);
    let dangerous = "Brackets [action_score] {b}text{/b} and __import__('os')";
    let actions = json!([
        {"type":"setVariable","variableId":ready["id"],"value":true},
        {"type":"setVariable","variableId":score["id"],"value":"9007199254740993"},
        {"type":"showScreen","target":target["target"]},
        {"type":"setVariable","variableId":score["id"],"value":"-7"},
        {"type":"setVariable","variableId":caption["id"],"value":dangerous},
        {"type":"hideScreen","target":target["target"]},
        {"type":"setVariable","variableId":ready["id"],"value":false},
        {"type":"finishInteraction"}
    ]);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    compose_command(
        &mut service,
        &dialog,
        json!({"type":"actions","nodeId":button["selectedId"],"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[target]}),
    );
    let final_target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    let runtime_ready =
        final_target["effects"]["unknown"] == false && final_target["blocking"] == true;
    if runtime_ready {
        // The final combined candidate must admit the completed screen as a Call.
        let model = ipc(&mut service, "scene.list", json!({}));
        let entry = model["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == entry_id)
            .unwrap();
        let call = entry["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "callScreen")
            .unwrap();
        panel_fixture::apply(
            &mut service,
            json!({"type":"updateBeat","sceneId":entry_id,"beatId":call["id"],"expectedSourceRevision":entry["sourceRevision"],
            "beat":{"type":"callScreen","target":binding,"revisions":final_target["revisions"]}}),
        );
    }
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let authored = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == button["selectedId"])
        .unwrap();
    assert_eq!(authored["actions"], actions);
    let mixed_node = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == mixed["selectedId"])
        .unwrap();
    let mut canvas_plans = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        let request = json!({"path":dialog["path"],"screenName":dialog["name"],"expectedRevision":document["revision"],"width":width,"height":height});
        let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
        assert_eq!(plan["available"], true, "{plan}");
        assert!(plan["limits"].as_array().unwrap().is_empty());
        let literal = &plan["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["start"] == mixed_node["span"]["start"])
            .unwrap()["literal"];
        assert_eq!(literal, "Values: Initial / 0\nAgain Initial");
        canvas_plans.push(json!({"request":request,"plan":plan}));
    }
    let mut paths = vec![];
    panel_fixture::collect_files(&root, &root.join("game"), &mut paths);
    let files = paths
        .iter()
        .map(|p| {
            assert!(p.ends_with(".rpy"));
            export_file(&root, &output, p)
        })
        .collect::<Vec<_>>();
    let mut metadata = serde_json::Map::new();
    for (key, name) in [
        ("project", "project.json"),
        ("sourceMap", "source-map.json"),
        ("authoring", "authoring.json"),
    ] {
        let relative = format!(".renpy-editor/{name}");
        let mut record = export_file(&root, &output, &relative);
        fs::rename(output.join(relative), output.join(name)).unwrap();
        record["path"] = json!(name);
        metadata.insert(key.into(), record);
    }
    fs::remove_dir(output.join(".renpy-editor")).unwrap();
    let manifest = json!({"schemaVersion":1,"sdkVersion":"8.5.3","publicCoreRequests":true,"engineStarted":false,
        "files":files,"metadata":metadata,"entry":entry,"panel":panel,"dialog":dialog,"document":document,
        "buttonId":button["selectedId"],"textNodes":text_nodes,"canvasPlans":canvas_plans,"variables":[ready,score,caption],"actions":actions,
        "runtimeReady":runtime_ready,"normalStoryCallAdmitted":runtime_ready,"finalTarget":final_target,
        "expected":{"ready":false,"score":"-7","caption":dangerous,"panelVisible":false,"followingCount":1}});
    fs::write(
        output.join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).unwrap(),
    )
    .unwrap();
    service.close().unwrap();
    println!(
        "ORDERED_ACTIONS_FIXTURE {}",
        json!({"schemaVersion":1,"manifestSHA256":hex::encode(Sha256::digest(fs::read(output.join("manifest.json")).unwrap())),"publicCoreRequests":true,"engineStarted":false,"runtimeReady":runtime_ready})
    );
}

fn author_arithmetic(service: &mut LifecycleService, root: &Path, scratch: &Path) -> Value {
    let owner = create_action_screen(service, "arithmetic_clicks", "dialog");
    for (name, kind, value) in [
        ("trust", "int", json!("5")),
        ("reward", "int", json!("0")),
        ("bonus", "int", json!("2")),
        ("points", "int", json!("0")),
        ("floor_value", "int", json!("0")),
        ("remainder_value", "int", json!("0")),
        ("precise", "int", json!("0")),
        ("fraction", "decimal", json!(8.0)),
        ("widened", "decimal", json!(0.0)),
        ("continuations", "int", json!("0")),
    ] {
        ipc(
            service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
    }
    let a = ipc(service, "authoring.list", json!({}));
    let var = |name: &str| {
        a["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap()
            .clone()
    };
    let column = compose_command(
        service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    )["selectedId"]
        .clone();
    let caption = compose_command(
        service,
        &owner,
        json!({"type":"add","parentId":column,"kind":"text","text":"Current trust"}),
    )["selectedId"]
        .clone();
    let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    compose_command(
        service,
        &owner,
        json!({"type":"variableText","nodeId":caption,"binding":{"variableId":var("trust")["id"]},"expectedAuthoringRevision":doc["authoringRevision"]}),
    );
    let text = compose_command(
        service,
        &owner,
        json!({"type":"add","parentId":column,"kind":"textbutton","text":"Calculate"}),
    )["selectedId"]
        .clone();
    let asset = super::super::ui_images::import_image(service, scratch, root, "uiImage");
    let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    let image=compose_command(service,&owner,json!({"type":"addImageButton","parentId":column,"appearances":{"normal":{"assetId":asset["id"],"expectedAssetSha256":asset["sha256"]}},"width":160,"height":80,"interaction":{"actions":[],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}}))["selectedId"].clone();
    // Stable SDK selector only. Preserve the authored element identity comment.
    let original = ipc(service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let marker = format!(
        "imagebutton: # loomlight-element: {}\n",
        image.as_str().unwrap()
    );
    assert_eq!(original.matches(&marker).count(), 1);
    save_composition_source(
        service,
        &owner,
        &original.replace(
            &marker,
            &format!("{marker}            id \"arithmetic_image\"\n"),
        ),
    );
    let mut actions = vec![];
    for (name, operation, operand) in [
        ("trust", "add", "1"),
        ("reward", "assign", "2 * trust"),
        ("points", "add", "bonus"),
        ("fraction", "divide", "2"),
        ("floor_value", "assign", "-7 // 3"),
        ("remainder_value", "assign", "-7 % 3"),
        ("widened", "assign", "2"),
        ("precise", "assign", "9007199254740993"),
    ] {
        actions.push(json!({"type":"setVariable","variableId":var(name)["id"],"value":{"operation":operation,"operand":operand}}));
    }
    let mut requests = vec![];
    for node in [&text, &image] {
        let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
        let command = json!({"type":"actions","nodeId":node,"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]});
        let request =
            json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command});
        for validate_only in [true, false] {
            let mut payload = request.clone();
            payload["validateOnly"] = json!(validate_only);
            payload["sessionId"] = json!(service.current().unwrap().session_id);
            let envelope = json!({"protocolVersion":1,"requestId":"arithmetic-95","operation":"screens.compose","payload":payload});
            let response = serde_json::to_value(crate::handle_application_request(
                envelope.clone(),
                false,
                service,
            ))
            .unwrap();
            assert_eq!(response["ok"], true, "{response}");
            if validate_only {
                assert_eq!(response["value"]["changed"], false);
            }
            requests.push(json!({"request":envelope,"response":response}));
        }
    }
    for (label, action) in [
        (
            "Change operand",
            json!({"type":"setVariable","variableId":var("bonus")["id"],"value":"5"}),
        ),
        ("Finish", json!({"type":"finishInteraction"})),
    ] {
        let node = compose_command(
            service,
            &owner,
            json!({"type":"add","parentId":column,"kind":"textbutton","text":label}),
        )["selectedId"]
            .clone();
        let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
        compose_command(
            service,
            &owner,
            json!({"type":"actions","nodeId":node,"actions":[action],"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[]}),
        );
    }
    let model = ipc(service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == model["entrySceneId"])
        .unwrap();
    let story = include_str!("../../../../tests/fixtures/arithmetic-95/story.rpy").replace(
        "label scene_one:",
        &format!("label {}:", entry["technicalLabel"].as_str().unwrap()),
    );
    save_composition_source(service, &json!({"path":entry["sourcePath"]}), &story);
    let document = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    let before = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    for node in [&text, &image] {
        let accepted = document["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == *node)
            .unwrap();
        assert_eq!(accepted["actions"], json!(actions));
    }
    let plan = ipc(
        service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":document["revision"],"width":1280,"height":720,"variableSamples":[{"variableId":var("trust")["id"],"expectedSourceRevision":var("trust")["source"]["sourceRevision"],"value":"99"}]}),
    );
    if let Some(dir) = std::env::var_os("LOOMLIGHT_ACTIONS_EVIDENCE_DIR") {
        let dir = PathBuf::from(dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            dir.join("public-requests.json"),
            serde_json::to_vec_pretty(&requests).unwrap(),
        )
        .unwrap();
        fs::write(
            dir.join("screen-inspection.json"),
            serde_json::to_vec_pretty(&document).unwrap(),
        )
        .unwrap();
        fs::write(
            dir.join("canvas-sample.json"),
            serde_json::to_vec_pretty(&plan).unwrap(),
        )
        .unwrap();
        let mut paths = vec![];
        panel_fixture::collect_files(root, &root.join("game"), &mut paths);
        let files: Vec<_> = paths
            .iter()
            .map(|p| export_file(root, &dir.join("accepted"), p))
            .collect();
        fs::write(
            dir.join("accepted-files.json"),
            serde_json::to_vec_pretty(&files).unwrap(),
        )
        .unwrap();
    }
    assert!(
        std::str::from_utf8(&before)
            .unwrap()
            .contains("id \"arithmetic_image\""),
        "Accepted fixture must retain the SDK imagebutton selector"
    );
    let nodes = plan["nodes"].as_array().unwrap();
    assert!(nodes
        .iter()
        .any(|node| node["kind"] == "text" && node["literal"] == "99"));
    assert_eq!(
        nodes
            .iter()
            .filter(|node| node["kind"] == "textbutton")
            .count(),
        3
    );
    assert_eq!(
        nodes
            .iter()
            .filter(|node| node["kind"] == "imagebutton")
            .count(),
        1
    );
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    service.close().unwrap();
    service.open_path(root).unwrap();
    let reopened = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    assert_eq!(reopened["screens"], document["screens"]);

    document
}

#[test]
fn click_time_arithmetic_fixture_preflight() {
    let (temporary, mut service, root, _owner) = composition_project();
    let document = author_arithmetic(&mut service, &root, temporary.path());
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":document["path"],"screenName":"arithmetic_clicks","expectedRevision":document["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    service.close().unwrap();
}

#[test]
fn click_time_arithmetic_fixture_retains_samples_with_unresolved_gui() {
    let (temporary, mut service, root, _owner) = composition_project();
    fs::write(
        root.join("game/gui.rpy"),
        "init python:\n    gui.init(1280, 720)\n",
    )
    .unwrap();
    let document = author_arithmetic(&mut service, &root, temporary.path());
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":document["path"],"screenName":"arithmetic_clicks","expectedRevision":document["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], false);
    assert_eq!(
        plan["limits"],
        json!(["Unresolved project initialization or inherited styles in game/gui.rpy"])
    );
    assert!(plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|node| node["kind"] == "text" && node["literal"] == "5"));
    service.close().unwrap();
}

#[test]
#[ignore = "#95 explicit pinned SDK qualification; one reserved invocation per target"]
fn click_time_arithmetic_sdk_gate() {
    let temporary = tempfile::tempdir().unwrap();
    let owned = temporary.path().to_owned();
    let result = std::panic::catch_unwind(|| run_arithmetic_sdk(&temporary, false));
    let cleanup = temporary.close().is_ok() && !owned.exists();
    println!(
        "arithmetic-95-terminal: {}",
        json!({"passed":result.is_ok()&&cleanup,"cleanupComplete":cleanup})
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup);
}

fn run_arithmetic_sdk(temporary: &tempfile::TempDir, ui_emitted: bool) {
    use crate::lifecycle::CreateProjectRequest;
    use crate::renpy::{
        command_path, install_supported_sdk_from_archive, launcher_args, run_bounded,
    };
    use std::{
        ffi::OsString,
        time::{Duration, Instant},
    };
    let evidence = PathBuf::from(
        std::env::var_os("LOOMLIGHT_ACTIONS_EVIDENCE_DIR")
            .expect("retained evidence directory required"),
    );
    fs::create_dir_all(&evidence).unwrap();
    let mut cases = ["compile", "lint", "test", "wrong-outcome"]
        .map(|case| json!({"case":case,"status":"notRun","passed":false}))
        .to_vec();
    fs::write(
        evidence.join("sdk-cases.json"),
        serde_json::to_vec_pretty(&cases).unwrap(),
    )
    .unwrap();
    fs::create_dir(temporary.path().join("Ren'Py Data")).unwrap();
    let archive = PathBuf::from(
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE")
            .expect("verified official archive required"),
    );
    let sdk = install_supported_sdk_from_archive(&temporary.path().join("sdk-profile"), &archive)
        .unwrap();
    fs::write(evidence.join("sdk-context.json"), serde_json::to_vec_pretty(&json!({"ownedTemporaryRoot":temporary.path(),"sdkRoot":sdk.root,"archive":archive,"sdkIdentities":sdk_runtime_identities(&sdk.root),"fixtureStatus":"notPrepared"})).unwrap()).unwrap();
    let mut service = LifecycleService::new(temporary.path().join("profile")).unwrap();
    let parent = service.register_parent(temporary.path()).unwrap();
    let registered = service
        .register_sdk(&sdk.root, "arithmetic-95-verified")
        .unwrap();
    let folder = if ui_emitted {
        "arithmetic-ui"
    } else {
        "arithmetic-95"
    };
    service
        .create_project(CreateProjectRequest {
            parent_id: parent.id,
            sdk_id: registered.id,
            title: if ui_emitted {
                "UI emitted arithmetic"
            } else {
                "Click time arithmetic"
            }
            .into(),
            folder_name: folder.into(),
            width: 1280,
            height: 720,
            initialize_git: false,
        })
        .unwrap();
    let root = temporary.path().join(folder);
    let document = if ui_emitted {
        accept_ui_emitted_arithmetic(&mut service, &root)
    } else {
        author_arithmetic(&mut service, &root, temporary.path())
    };
    if !ui_emitted {
        // Full SDK GUI initialization remains outside the inert canvas subset.
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":document["path"],"screenName":"arithmetic_clicks","expectedRevision":document["revision"],"width":1280,"height":720}),
        );
        let template_limits = [
            "Unresolved project initialization or inherited styles in game/gui.rpy",
            "Unresolved project initialization or inherited styles in game/options.rpy",
            "Unresolved project initialization or inherited styles in game/screens.rpy",
        ];
        for limit in plan["limits"].as_array().unwrap() {
            assert!(
                template_limits.contains(&limit.as_str().unwrap()),
                "Unexpected canvas limit: {plan}"
            );
        }
        fs::write(
            root.join("game/zz_arithmetic_95_test.rpy"),
            include_str!("../../../../tests/fixtures/arithmetic-95/driver.rpy"),
        )
        .unwrap();
    }
    let accepted = arithmetic_sources(&root);
    fs::write(evidence.join("sdk-context.json"),serde_json::to_vec_pretty(&json!({"ownedTemporaryRoot":temporary.path(),"sdkRoot":sdk.root,"archive":archive,"screen":document,"sdkIdentities":sdk_runtime_identities(&sdk.root),"sdkLauncherSha256":hex::encode(Sha256::digest(fs::read(sdk.root.join("renpy.sh")).or_else(|_|fs::read(sdk.root.join("renpy.py"))).unwrap()))})).unwrap()).unwrap();
    let mut paths = vec![];
    panel_fixture::collect_files(&root, &root.join("game"), &mut paths);
    let files: Vec<_> = paths
        .iter()
        .map(|p| export_file(&root, &evidence.join("sdk-project"), p))
        .collect();
    fs::write(
        evidence.join("sdk-project-files.json"),
        serde_json::to_vec_pretty(&files).unwrap(),
    )
    .unwrap();
    let source_hashes: Vec<_> = accepted.iter().map(|(path, bytes)| json!({"path":path,"sha256":hex::encode(Sha256::digest(bytes)),"bytes":bytes.len()})).collect();
    fs::write(
        evidence.join("sdk-accepted-sources.json"),
        serde_json::to_vec_pretty(&source_hashes).unwrap(),
    )
    .unwrap();
    for (case_index, operation) in ["compile", "lint", "test", "wrong-outcome"]
        .into_iter()
        .enumerate()
    {
        let reject = operation == "wrong-outcome";
        let mut args = vec![
            command_path(&root),
            OsString::from(if reject { "test" } else { operation }),
        ];
        if operation == "lint" && ui_emitted {
            args.push(OsString::from("--error-code"));
        }
        if operation == "test" || reject {
            args.push(OsString::from(if reject {
                if ui_emitted {
                    "arithmetic_ui::wrong_outcome"
                } else {
                    "arithmetic_95::wrong_outcome"
                }
            } else {
                if ui_emitted {
                    "arithmetic_ui::values"
                } else {
                    "arithmetic_95::values"
                }
            }));
            args.push(OsString::from("--savedir"));
            args.push(command_path(&root.join("game/saves")));
        }
        let command = launcher_args(&sdk.root, &args).unwrap();
        let started = Instant::now();
        cases[case_index] =
            json!({"case":operation,"status":"started","passed":false,"command":command});
        fs::write(
            evidence.join("sdk-cases.json"),
            serde_json::to_vec_pretty(&cases).unwrap(),
        )
        .unwrap();
        let result = run_bounded(&sdk.root, command.clone(), Duration::from_secs(90)).unwrap();
        let unchanged = arithmetic_sources(&root) == accepted;
        let passed = !result.timed_out
            && !result.output_limited
            && unchanged
            && if reject {
                result.exit_code.is_some_and(|c| c != 0)
                    && result.output.contains("FAILED")
                    && result.output.contains(if ui_emitted {
                        "AssertionError: assert eval (trust == 26)"
                    } else {
                        "AssertionError: assert eval (reward == 10)"
                    })
                    && !result.output.contains(if ui_emitted {
                        "ARITHMETIC_UI_WRONG_ACCEPTED"
                    } else {
                        "ARITHMETIC_95_WRONG_ACCEPTED"
                    })
            } else {
                result.exit_code == Some(0)
                    && (operation != "test"
                        || if ui_emitted {
                            ["PASSED", "ARITHMETIC_UI_STORY precision=6 protected=5 nested=27:int money=1.5:float flag=True title=retained_text", "ARITHMETIC_UI_DIVIDE 4.5/2=2.25/2=1.125:float continuation=0", "ARITHMETIC_UI_TEXT first=2.0:float/12:int second=2.0:float/14:int current=True", "ARITHMETIC_UI_IMAGE first=10/20 second=12/24:int bonus=3,2 ordered=True", "ARITHMETIC_UI_VALUES inert=True text=True condition=True rendered_actions=True continuation=4"].iter().all(|s| result.output.contains(s))
                        } else {
                            ["PASSED","ARITHMETIC_95_FIRST 6/12 points=2 fraction=4.0","ARITHMETIC_95_SECOND 7/14 points=4 fraction=2.0","ARITHMETIC_95_CURRENT trust=10 reward=20 points=19 fraction=0.25 floor=-3 remainder=2 precise=9007199254740993 widened=float:2.0","ARITHMETIC_95_VALUES inert=True click=True keyboard=True textbutton=True imagebutton=True continuation=1"].iter().all(|s| result.output.contains(s))
                        })
            };
        cases[case_index] = json!({"status":"completed","case":operation,"passed":passed,"command":command,"exitCode":result.exit_code,"output":result.output,"timedOut":result.timed_out,"outputLimited":result.output_limited,"durationMs":started.elapsed().as_millis(),"acceptedSourceUnchanged":unchanged,"expectedRejection":reject});
        fs::write(
            evidence.join("sdk-cases.json"),
            serde_json::to_vec_pretty(&cases).unwrap(),
        )
        .unwrap();
        println!(
            "{}: {}",
            if ui_emitted {
                "arithmetic-ui-case"
            } else {
                "arithmetic-95-case"
            },
            json!({"case":operation,"passed":passed,"durationMs":started.elapsed().as_millis()})
        );
        assert!(passed, "{operation}: {}", cases[case_index]["output"]);
    }
    service.close().unwrap();
}

fn arithmetic_sources(root: &Path) -> std::collections::BTreeMap<String, Vec<u8>> {
    let mut paths = vec![];
    panel_fixture::collect_files(root, &root.join("game"), &mut paths);
    paths
        .into_iter()
        .filter(|p| p.ends_with(".rpy"))
        .map(|p| {
            let bytes = fs::read(root.join(&p)).unwrap();
            (p, bytes)
        })
        .collect()
}

fn verify_ui_emitted_inputs() {
    let driver = fs::read_to_string(ui_arithmetic_fixture().join("driver.rpy")).unwrap();
    assert!(
        !driver.lines().any(|line| line.trim() == "advance"),
        "UI fixture narration transitions require an explicit destination condition"
    );
    let fixture = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures/arithmetic-ui");
    let manifest: Value = serde_json::from_slice(
        &fs::read(fixture.join("manifest.json")).expect("portable UI-emitted inputs required"),
    )
    .unwrap();
    assert_eq!(
        hex::encode(Sha256::digest(
            fs::read(fixture.join("requests.json")).unwrap()
        )),
        manifest["requestsSha256"]
    );
    for source in manifest["sources"].as_array().unwrap() {
        let bytes = fs::read(fixture.join(source["file"].as_str().unwrap())).unwrap();
        assert_eq!(hex::encode(Sha256::digest(bytes)), source["sha256"]);
    }
}

fn sdk_runtime_identities(root: &Path) -> Value {
    let paths = if cfg!(windows) {
        vec!["renpy.py", "lib/py3-windows-x86_64/python.exe"]
    } else {
        vec![
            "renpy.sh",
            "renpy.py",
            "lib/py3-mac-universal/renpy",
            "lib/py3-mac-universal/python",
            "lib/py3-mac-universal/librenpython.dylib",
        ]
    };
    paths
        .into_iter()
        .map(|p| {
            (
                p.to_owned(),
                json!(hex::encode(Sha256::digest(fs::read(root.join(p)).unwrap()))),
            )
        })
        .collect::<serde_json::Map<_, _>>()
        .into()
}

fn ui_arithmetic_fixture() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures/arithmetic-ui")
}

fn accept_ui_emitted_arithmetic(service: &mut LifecycleService, root: &Path) -> Value {
    let fixture = ui_arithmetic_fixture();
    let manifest: Value =
        serde_json::from_slice(&fs::read(fixture.join("manifest.json")).unwrap()).unwrap();
    let existing = ipc(service, "authoring.list", json!({}));
    for (name, kind, value) in [
        ("flag", "bool", json!(true)),
        ("money", "decimal", json!(4.5)),
        ("unrelated_flag", "bool", json!(false)),
        ("another_flag", "bool", json!(false)),
        ("trust", "int", json!("5")),
        ("reward", "int", json!("0")),
        ("bonus", "int", json!("7")),
    ] {
        if !existing["variables"]
            .as_array()
            .unwrap()
            .iter()
            .any(|v| v["technicalName"] == name)
        {
            ipc(
                service,
                "variable.create",
                json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
            );
        }
    }
    let asset = &manifest["asset"];
    let image = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .join(asset["repositoryFile"].as_str().unwrap());
    let bytes = fs::read(image).unwrap();
    assert_eq!(hex::encode(Sha256::digest(&bytes)), asset["sha256"]);
    let selected = root.parent().unwrap().join("ui_station_seal.png");
    fs::write(&selected, &bytes).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let choice = service.authoring_select_import(&selected).unwrap();
    ipc(
        service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"uiImage","technicalName":"station_seal","displayName":"Station seal","characterId":null,"expression":null}),
    );
    assert_eq!(
        fs::read(root.join(asset["target"].as_str().unwrap())).unwrap(),
        bytes
    );
    for source in manifest["sources"].as_array().unwrap() {
        let target = source["target"].as_str().unwrap();
        let bytes = fs::read(fixture.join(source["file"].as_str().unwrap())).unwrap();
        assert_eq!(hex::encode(Sha256::digest(&bytes)), source["sha256"]);
        if source["file"] == "variables.rpy" {
            assert_eq!(fs::read(root.join(target)).unwrap(), bytes);
            continue;
        }
        fs::create_dir_all(root.join(target).parent().unwrap()).unwrap();
        if !root.join(target).exists() {
            fs::write(root.join(target), "").unwrap();
        }
        save_composition_source(
            service,
            &json!({"path":target}),
            std::str::from_utf8(&bytes).unwrap(),
        );
    }
    // Public Source history restores the exact imported Story bytes.
    let model = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    let model = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"redo"}}),
    );
    let accepted = arithmetic_sources(root);
    let document = ipc(
        service,
        "screens.inspect",
        json!({"path":"game/ui/arithmetic_dialog.rpy"}),
    );
    let variables = ipc(service, "authoring.list", json!({}));
    let money = variables["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "money")
        .unwrap();
    let plan = ipc(
        service,
        "screens.canvasPlan",
        json!({"path":document["path"],"screenName":"arithmetic_dialog","expectedRevision":document["revision"],"width":1280,"height":720,"variableSamples":[{"variableId":money["id"],"expectedSourceRevision":money["source"]["sourceRevision"],"value":1e-7}]}),
    );
    assert!(
        plan["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .any(|n| n["kind"] == "text" && n["literal"] == "Balance: 1e-07"),
        "{plan}"
    );
    for limit in plan["limits"].as_array().unwrap() {
        assert!([
            "Unresolved project initialization or inherited styles in game/gui.rpy",
            "Unresolved project initialization or inherited styles in game/options.rpy",
            "Unresolved project initialization or inherited styles in game/screens.rpy",
            "Unresolved key at 57",
            "Unresolved idle at 1395",
            "Unresolved image-button appearances at 1395",
            "Unresolved idle at 2216",
            "Unresolved image-button appearances at 2216",
            "Unresolved project initialization or inherited styles in game/ui/arithmetic_dialog.rpy",
        ].contains(&limit.as_str().unwrap()), "Unexpected canvas limit: {plan}");
    }
    assert_eq!(
        arithmetic_sources(root),
        accepted,
        "inert planning changed accepted source"
    );
    save_composition_source(
        service,
        &json!({"path":"game/script.rpy"}),
        &fs::read_to_string(fixture.join("driver.rpy")).unwrap(),
    );
    service.close().unwrap();
    service.open_path(root).unwrap();
    let reopened = ipc(service, "screens.inspect", json!({"path":document["path"]}));
    assert_eq!(reopened["screens"], document["screens"]);
    for source in manifest["sources"].as_array().unwrap() {
        assert_eq!(
            hex::encode(Sha256::digest(
                fs::read(root.join(source["target"].as_str().unwrap())).unwrap()
            )),
            source["sha256"]
        );
    }
    if let Some(dir) = std::env::var_os("LOOMLIGHT_ACTIONS_EVIDENCE_DIR") {
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            Path::new(&dir).join("canvas-sample.json"),
            serde_json::to_vec_pretty(&plan).unwrap(),
        )
        .unwrap();
        fs::write(
            Path::new(&dir).join("portable-manifest.json"),
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();
    }
    document
}

#[test]
fn ui_emitted_arithmetic_fixture_preflight() {
    verify_ui_emitted_inputs();
    let (_temporary, mut service, root, _) = composition_project();
    accept_ui_emitted_arithmetic(&mut service, &root);
    service.close().unwrap();
}

#[test]
#[ignore = "#87 reviewed UI source; one explicitly selected SDK invocation per target"]
fn ui_emitted_arithmetic_sdk_gate() {
    let temporary = tempfile::tempdir().unwrap();
    let owned = temporary.path().to_owned();
    let result = std::panic::catch_unwind(|| run_arithmetic_sdk(&temporary, true));
    let cleanup = temporary.close().is_ok() && !owned.exists();
    println!(
        "arithmetic-ui-terminal: {}",
        json!({"passed":result.is_ok()&&cleanup,"cleanupComplete":cleanup})
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup);
}

#[test]
fn ui_emitted_arithmetic_fixture_preflight_with_template_initialization() {
    let (_temporary, mut service, root, _) = composition_project();
    for file in ["gui.rpy", "options.rpy", "screens.rpy"] {
        fs::write(
            root.join("game").join(file),
            "init python:\n    gui.init(1280, 720)\n",
        )
        .unwrap();
    }
    accept_ui_emitted_arithmetic(&mut service, &root);
    service.close().unwrap();
}
