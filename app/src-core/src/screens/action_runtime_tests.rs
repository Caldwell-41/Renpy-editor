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
    // Stable SDK selector only. No arithmetic is introduced through this Source edit.
    let original = ipc(service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        service,
        &owner,
        &original.replace(
            "imagebutton:\n",
            "imagebutton:\n            id \"arithmetic_image\"\n",
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
    assert_eq!(plan["available"], true, "{plan}");
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    service.close().unwrap();
    service.open_path(root).unwrap();
    let reopened = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    assert_eq!(reopened["screens"], document["screens"]);
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
    document
}

#[test]
fn click_time_arithmetic_fixture_preflight() {
    let (temporary, mut service, root, _owner) = composition_project();
    author_arithmetic(&mut service, &root, temporary.path());
    service.close().unwrap();
}

#[test]
#[ignore = "#95 explicit pinned SDK qualification; one reserved invocation per target"]
fn click_time_arithmetic_sdk_gate() {
    let temporary = tempfile::tempdir().unwrap();
    let owned = temporary.path().to_owned();
    let result = std::panic::catch_unwind(|| run_arithmetic_sdk(&temporary));
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

fn run_arithmetic_sdk(temporary: &tempfile::TempDir) {
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
    fs::create_dir(temporary.path().join("Ren'Py Data")).unwrap();
    let archive = PathBuf::from(
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE")
            .expect("verified official archive required"),
    );
    let sdk = install_supported_sdk_from_archive(&temporary.path().join("sdk-profile"), &archive)
        .unwrap();
    let mut service = LifecycleService::new(temporary.path().join("profile")).unwrap();
    let parent = service.register_parent(temporary.path()).unwrap();
    let registered = service
        .register_sdk(&sdk.root, "arithmetic-95-verified")
        .unwrap();
    service
        .create_project(CreateProjectRequest {
            parent_id: parent.id,
            sdk_id: registered.id,
            title: "Click time arithmetic".into(),
            folder_name: "arithmetic-95".into(),
            width: 1280,
            height: 720,
            initialize_git: false,
        })
        .unwrap();
    let root = temporary.path().join("arithmetic-95");
    let document = author_arithmetic(&mut service, &root, temporary.path());
    fs::write(
        root.join("game/zz_arithmetic_95_test.rpy"),
        include_str!("../../../../tests/fixtures/arithmetic-95/driver.rpy"),
    )
    .unwrap();
    let accepted = arithmetic_sources(&root);
    fs::write(evidence.join("sdk-context.json"),serde_json::to_vec_pretty(&json!({"ownedTemporaryRoot":temporary.path(),"sdkRoot":sdk.root,"archive":archive,"screen":document,"sdkLauncherSha256":hex::encode(Sha256::digest(fs::read(sdk.root.join("renpy.sh")).or_else(|_|fs::read(sdk.root.join("renpy.py"))).unwrap()))})).unwrap()).unwrap();
    let mut cases = ["compile", "lint", "test", "wrong-outcome"]
        .map(|case| json!({"case":case,"status":"notRun","passed":false}))
        .to_vec();
    fs::write(
        evidence.join("sdk-cases.json"),
        serde_json::to_vec_pretty(&cases).unwrap(),
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
        if operation == "test" || reject {
            args.push(OsString::from(if reject {
                "arithmetic_95::wrong_outcome"
            } else {
                "arithmetic_95::values"
            }));
            args.push(OsString::from("--savedir"));
            args.push(command_path(&root.join("game/saves")));
        }
        let command = launcher_args(&sdk.root, &args).unwrap();
        let started = Instant::now();
        let result = run_bounded(&sdk.root, command.clone(), Duration::from_secs(90)).unwrap();
        let unchanged = arithmetic_sources(&root) == accepted;
        let passed = !result.timed_out
            && !result.output_limited
            && unchanged
            && if reject {
                result.exit_code.is_some_and(|c| c != 0)
                    && result.output.contains("FAILED")
                    && result
                        .output
                        .contains("AssertionError: assert eval (reward == 10)")
                    && !result.output.contains("ARITHMETIC_95_WRONG_ACCEPTED")
            } else {
                result.exit_code==Some(0) && (operation!="test" || ["PASSED","ARITHMETIC_95_FIRST 6/12 points=2 fraction=4.0","ARITHMETIC_95_SECOND 7/14 points=4 fraction=2.0","ARITHMETIC_95_CURRENT trust=10 reward=20 points=19 fraction=0.25 floor=-3 remainder=2 precise=9007199254740993 widened=float:2.0","ARITHMETIC_95_VALUES inert=True click=True keyboard=True textbutton=True imagebutton=True continuation=1"].iter().all(|s| result.output.contains(s)))
            };
        cases[case_index] = json!({"status":"completed","case":operation,"passed":passed,"command":command,"exitCode":result.exit_code,"output":result.output,"timedOut":result.timed_out,"outputLimited":result.output_limited,"durationMs":started.elapsed().as_millis(),"acceptedSourceUnchanged":unchanged,"expectedRejection":reject});
        fs::write(
            evidence.join("sdk-cases.json"),
            serde_json::to_vec_pretty(&cases).unwrap(),
        )
        .unwrap();
        println!(
            "arithmetic-95-case: {}",
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
