//! #92's command-produced accepted-source fixture, using the existing SDK owner.
use super::*;

fn author(service: &mut LifecycleService, root: &Path) -> (String, Vec<u8>) {
    for name in ["score", "money"] {
        ipc(
            service,
            "variable.create",
            json!({"technicalName":name,"variableType":"int","defaultValue":"99"}),
        );
    }
    let model = ipc(service, "scene.list", json!({}));
    let scene = &model["scenes"][0];
    let source = include_str!("../../../../../../tests/fixtures/arithmetic-92/story.rpy").replace(
        "label scene_one:",
        &format!("label {}:", scene["technicalLabel"].as_str().unwrap()),
    );
    let path = scene["sourcePath"].as_str().unwrap().to_owned();
    let opened = ipc(service, "source.open", json!({"path":path}));
    let draft = ipc(
        service,
        "source.updateDraft",
        json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        service,
        "source.save",
        json!({"path":path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let mut requests = Vec::new();
    for (operation, operand, update) in [
        ("subtract", "2", true),
        ("add", "1", false),
        ("subtract", "3", false),
    ] {
        let model = ipc(service, "scene.list", json!({}));
        let scene = &model["scenes"][0];
        let beats = scene["beats"].as_array().unwrap();
        let variable = model["authoring"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| {
                v["technicalName"]
                    == if operation == "subtract" && !update {
                        "money"
                    } else {
                        "score"
                    }
            })
            .unwrap();
        let payload = json!({"type":"setVariable","variableId":variable["id"],"value":{"operation":operation,"operand":operand}});
        let command = if update {
            json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beats[2]["id"],"expectedBody":{"type":"root"},"beat":payload})
        } else {
            let before = if operation == "add" {
                &beats[2]
            } else {
                beats
                    .iter()
                    .find(|b| b["payload"]["type"] == "narration")
                    .unwrap()
            };
            json!({"type":"insertBodyBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":before["id"]}},"beat":payload})
        };
        let request = json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"expectedAuthoringRevision":model["authoringRevision"],"command":command});
        let after = ipc(service, "scene.apply", request.clone());
        requests.push(json!({"request":request,"response":after}));
    }
    let accepted = fs::read(root.join(&path)).unwrap();
    assert!(String::from_utf8_lossy(&accepted)
        .contains("$ score = score - 2 # explicit operand is edited"));
    assert!(String::from_utf8_lossy(&accepted)
        .contains("$ score += +2 # compound stays byte-identical"));
    let after = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":after["projectRevision"],"expectedSourceMapRevision":after["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    let undone = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":undone["projectRevision"],"expectedSourceMapRevision":undone["sourceMapRevision"],"command":{"type":"redo"}}),
    );
    assert_eq!(fs::read(root.join(&path)).unwrap(), accepted);
    service.close().unwrap();
    service.open_path(root).unwrap();
    let reopened = ipc(service, "scene.list", json!({}));
    assert_eq!(after["scenes"][0]["beats"], reopened["scenes"][0]["beats"]);
    if let Some(dir) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
        let dir = PathBuf::from(dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("arithmetic-produced.rpy"), &accepted).unwrap();
        fs::write(
            dir.join("arithmetic-requests.json"),
            serde_json::to_vec_pretty(&requests).unwrap(),
        )
        .unwrap();
    }
    (path, accepted)
}

#[test]
fn arithmetic_fixture_preflight() {
    let temp = tempfile::tempdir().unwrap();
    let profile = temp.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let (path, accepted) = author(&mut service, &root);
    let model = ipc(&mut service, "scene.list", json!({}));
    let scene = &model["scenes"][0];
    let variable = model["authoring"]["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap();
    let request = json!({"sessionId":service.current().unwrap().session_id,"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"expectedAuthoringRevision":model["authoringRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"setVariable","variableId":variable["id"],"value":{"operation":"add","operand":"1.5"}}}});
    let response = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"arithmetic-refusal","operation":"scene.apply","payload":request}),false,&mut service)).unwrap();
    assert_eq!(response["error"]["code"], "INVALID_ARITHMETIC_OPERAND");
    let opened = ipc(&mut service, "source.open", json!({"path":path}));
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":format!("{}# draft retained\n",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}),
    );
    let mut request = request.clone();
    request["command"]["beat"]["value"]["operand"] = json!("1");
    let response = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"arithmetic-dirty","operation":"scene.apply","payload":request}),false,&mut service)).unwrap();
    assert_eq!(response["error"]["code"], "DIRTY_SOURCE");
    assert_eq!(fs::read(root.join(&path)).unwrap(), accepted);
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":path}))["text"],
        draft["text"]
    );
    ipc(&mut service, "source.discard", json!({"path":path}));
    service.close().unwrap();
}

#[test]
#[ignore = "explicit #92 pinned SDK qualification; one reserved invocation per target"]
fn arithmetic_sdk_gate() {
    let temp = tempfile::tempdir().unwrap();
    let root_path = temp.path().to_owned();
    let result = std::panic::catch_unwind(|| run(&temp));
    let cleanup = temp.close().is_ok() && !root_path.exists();
    println!(
        "arithmetic-sdk-terminal: {}",
        json!({"passed":result.is_ok() && cleanup,"cleanupComplete":cleanup})
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup);
}

fn run(temp: &tempfile::TempDir) {
    fs::create_dir(temp.path().join("Ren'Py Data")).unwrap();
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("pinned archive required");
    let sdk =
        install_supported_sdk_from_archive(&temp.path().join("sdk-profile"), Path::new(&archive))
            .unwrap();
    let mut service = LifecycleService::new(temp.path().join("profile")).unwrap();
    let parent = service.register_parent(temp.path()).unwrap();
    let choice = service
        .register_sdk(&sdk.root, "verified-arithmetic")
        .unwrap();
    service
        .create_project(CreateProjectRequest {
            parent_id: parent.id,
            sdk_id: choice.id,
            title: "Arithmetic fixture".into(),
            folder_name: "arithmetic".into(),
            width: 1280,
            height: 720,
            initialize_git: false,
        })
        .unwrap();
    let root = temp.path().join("arithmetic");
    let (path, accepted) = author(&mut service, &root);
    let driver = include_str!("../../../../../../tests/fixtures/arithmetic-92/driver.rpy");
    fs::write(root.join("game/zz_arithmetic_test.rpy"), driver).unwrap();
    let accepted_sources = sources(&root.join("game"));
    let mut reports = Vec::new();
    for operation in ["compile", "lint", "test", "wrong-outcome"] {
        let reject = operation == "wrong-outcome";
        let mut argv = vec![
            command_path(&root),
            OsString::from(if reject { "test" } else { operation }),
        ];
        if operation == "test" || reject {
            argv.push(OsString::from(if reject {
                "arithmetic_92::wrong_outcome"
            } else {
                "arithmetic_92::values"
            }));
            argv.push(OsString::from("--savedir"));
            argv.push(command_path(&root.join("game/saves")));
        }
        let started = Instant::now();
        let result = run_bounded(
            &sdk.root,
            launcher_args(&sdk.root, &argv).unwrap(),
            Duration::from_secs(60),
        )
        .unwrap();
        let passed = !result.timed_out
            && !result.output_limited
            && if reject {
                result.exit_code.is_some_and(|code| code != 0)
                    && result.output.contains("FAILED")
                    && !result.output.contains("ARITHMETIC_92_WRONG_ACCEPTED")
            } else {
                result.exit_code == Some(0)
                    && (operation != "test"
                        || result.output.contains("PASSED")
                            && result.output.contains("ARITHMETIC_92_VALUES"))
            };
        println!(
            "arithmetic-sdk-case: {}",
            json!({"case":operation,"passed":passed,"exitCode":result.exit_code,"timedOut":result.timed_out})
        );
        reports.push(json!({"case":operation,"passed":passed,"exitCode":result.exit_code,"timedOut":result.timed_out,"output":result.output,"outputLimited":result.output_limited,"durationMs":started.elapsed().as_millis(),"expectedRejection":reject}));
        if let Some(dir) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
            fs::write(
                Path::new(&dir).join("arithmetic-sdk-cases.json"),
                serde_json::to_vec_pretty(&reports).unwrap(),
            )
            .unwrap();
        }
        assert_eq!(fs::read(root.join(&path)).unwrap(), accepted);
        assert_eq!(
            sources(&root.join("game")),
            accepted_sources,
            "SDK changed the accepted .rpy source set"
        );
        assert!(passed, "{operation}: {}", reports.last().unwrap()["output"]);
    }
    service.close().unwrap();
}

fn sources(game: &Path) -> std::collections::BTreeMap<PathBuf, Vec<u8>> {
    fn walk(base: &Path, dir: &Path, out: &mut std::collections::BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(base, &path, out);
            } else if path.extension().is_some_and(|extension| extension == "rpy") {
                out.insert(
                    path.strip_prefix(base).unwrap().to_owned(),
                    fs::read(&path).unwrap(),
                );
            }
        }
    }
    let mut out = std::collections::BTreeMap::new();
    walk(game, game, &mut out);
    out
}
