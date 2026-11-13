//! Command-produced arithmetic fixtures using the existing SDK owner.
use super::*;

fn author(
    service: &mut LifecycleService,
    root: &Path,
    formulas: bool,
    decimal: bool,
) -> (String, Vec<u8>) {
    if decimal {
        for name in [
            "fraction",
            "quotient",
            "floorfloat",
            "remfloat",
            "widened",
            "mixed",
            "signedzero",
            "subnormal",
        ] {
            ipc(
                service,
                "variable.create",
                json!({"technicalName":name,"variableType":"decimal","defaultValue":1.25}),
            );
        }
        let model = ipc(service, "authoring.list", json!({}));
        let fraction = model["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == "fraction")
            .unwrap();
        ipc(
            service,
            "variable.update",
            json!({"id":fraction["id"],"expectedSourceRevision":fraction["source"]["sourceRevision"],"defaultValue":2.5}),
        );
        ipc(
            service,
            "variable.create",
            json!({"technicalName":"numeric_branch","variableType":"bool","defaultValue":false}),
        );
        decimal_screen(service, root);
    }
    for name in if formulas {
        vec!["score", "money", "bonus", "remainder", "minimum"]
    } else {
        vec!["score", "money"]
    } {
        ipc(
            service,
            "variable.create",
            json!({"technicalName":name,"variableType":"int","defaultValue":"99"}),
        );
    }
    let model = ipc(service, "scene.list", json!({}));
    let scene = &model["scenes"][0];
    let source = if decimal {
        include_str!("../../../../../../tests/fixtures/arithmetic-94/story.rpy")
    } else if formulas {
        include_str!("../../../../../../tests/fixtures/arithmetic-93/story.rpy")
    } else {
        include_str!("../../../../../../tests/fixtures/arithmetic-92/story.rpy")
    }
    .replace(
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
    let mut edits = if formulas {
        vec![
            ("score", "multiply", "bonus + 1", Some(2)),
            ("score", "assign", "score + (bonus + 2) * 4", Some(3)),
            ("money", "assign", "money * (bonus + 2)", Some(10)),
        ]
    } else {
        vec![
            ("score", "subtract", "2", Some(2)),
            ("score", "add", "1", None),
            ("money", "subtract", "3", None),
        ]
    };
    if decimal {
        edits.extend([
            ("quotient", "assign", "9007199254740993 / 3", None),
            ("floorfloat", "assign", "1.0 // 0.1", None),
            ("remfloat", "assign", "-1.0 % 0.1", None),
            ("widened", "assign", "7 // -3", None),
            ("mixed", "assign", "9007199254740993 + 0.0", None),
            ("signedzero", "assign", "0 / -3", None),
            ("subnormal", "assign", "5e-324", None),
        ]);
    }
    for (target, operation, operand, update) in edits {
        let model = ipc(service, "scene.list", json!({}));
        let scene = &model["scenes"][0];
        let beats = scene["beats"].as_array().unwrap();
        let variable = model["authoring"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == target)
            .unwrap();
        let payload = json!({"type":"setVariable","variableId":variable["id"],"value":{"operation":operation,"operand":operand}});
        let command = if let Some(index) = update {
            let beat = &beats[index];
            let body = if beat["owner"].is_object() {
                json!({"type":"branch","groupId":beat["owner"]["groupId"],"branchId":beat["owner"]["branchId"]})
            } else {
                json!({"type":"root"})
            };
            json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":beat["id"],"expectedBody":body,"beat":payload})
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
    if formulas {
        let accepted = String::from_utf8_lossy(&accepted);
        assert!(accepted.contains("$ score *= bonus + 1 # compound operand is edited"));
        assert!(accepted.contains("$ score = score + (bonus + 2) * 4 # explicit formula is edited"));
        assert!(accepted.contains("$ money = money * (bonus + 2) # nested formula is edited"));
    } else {
        assert!(String::from_utf8_lossy(&accepted)
            .contains("$ score = score - 2 # explicit operand is edited"));
        assert!(String::from_utf8_lossy(&accepted)
            .contains("$ score += +2 # compound stays byte-identical"));
    }
    let after = ipc(service, "scene.list", json!({}));
    if decimal {
        inspect_decimal_fixture(&after);
    }
    ipc(service, "history.undo", json!({}));
    ipc(service, "history.redo", json!({}));
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
    preflight(false, false);
}
#[test]
fn formula_fixture_preflight() {
    preflight(true, false);
}
fn preflight(formulas: bool, decimal: bool) {
    let temp = tempfile::tempdir().unwrap();
    let profile = temp.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let (path, accepted) = author(&mut service, &root, formulas, decimal);
    let model = ipc(&mut service, "scene.list", json!({}));
    let scene = &model["scenes"][0];
    let variable = model["authoring"]["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "score")
        .unwrap();
    let request = json!({"sessionId":service.current().unwrap().session_id,"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"expectedAuthoringRevision":model["authoringRevision"],"command":{"type":"insertBodyBeat","body":{"type":"root"},"sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"position":scene["bodies"][0]["defaultPlace"],"beat":{"type":"setVariable","variableId":variable["id"],"value":{"operation":"add","operand":"1.5"}}}});
    let response = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"arithmetic-refusal","operation":"scene.apply","payload":request}),false,&mut service)).unwrap();
    assert_eq!(response["error"]["code"], "ARITHMETIC_TARGET_TYPE");
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
    sdk_gate(false, false);
}
#[test]
#[ignore = "explicit #93 pinned SDK qualification; one reserved invocation per target"]
fn formula_sdk_gate() {
    sdk_gate(true, false);
}
fn sdk_gate(formulas: bool, decimal: bool) {
    let temp = tempfile::tempdir().unwrap();
    let root_path = temp.path().to_owned();
    let result = std::panic::catch_unwind(|| run(&temp, formulas, decimal));
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

fn run(temp: &tempfile::TempDir, formulas: bool, decimal: bool) {
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
    let (path, accepted) = author(&mut service, &root, formulas, decimal);
    if let Some(dir) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
        let mut identities = serde_json::Map::new();
        for relative in if cfg!(windows) {
            vec!["renpy.py", "lib/py3-windows-x86_64/python.exe"]
        } else {
            vec![
                "renpy.sh",
                "renpy.py",
                "lib/py3-mac-universal/renpy",
                "lib/py3-mac-universal/python",
                "lib/py3-mac-universal/librenpython.dylib",
            ]
        } {
            identities.insert(
                relative.into(),
                json!(sha256_file(&sdk.root.join(relative)).unwrap()),
            );
        }
        fs::write(Path::new(&dir).join("arithmetic-sdk-context.json"), serde_json::to_vec_pretty(&json!({"ownedTemporaryRoot":temp.path(),"sdkRoot":sdk.root,"archive":archive,"identities":identities})).unwrap()).unwrap();
    }
    let driver = if decimal {
        include_str!("../../../../../../tests/fixtures/arithmetic-94/driver.rpy")
    } else if formulas {
        include_str!("../../../../../../tests/fixtures/arithmetic-93/driver.rpy")
    } else {
        include_str!("../../../../../../tests/fixtures/arithmetic-92/driver.rpy")
    };
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
                if decimal {
                    "arithmetic_94::wrong_outcome"
                } else if formulas {
                    "arithmetic_93::wrong_outcome"
                } else {
                    "arithmetic_92::wrong_outcome"
                }
            } else {
                if decimal {
                    "arithmetic_94::values"
                } else if formulas {
                    "arithmetic_93::values"
                } else {
                    "arithmetic_92::values"
                }
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
                    && result.output.contains(if formulas {
                        "AssertionError: assert eval (money == -14)"
                    } else {
                        "AssertionError: assert eval (money == 8)"
                    })
                    && !result.output.contains(if decimal {
                        "ARITHMETIC_94_WRONG_ACCEPTED"
                    } else if formulas {
                        "ARITHMETIC_93_WRONG_ACCEPTED"
                    } else {
                        "ARITHMETIC_92_WRONG_ACCEPTED"
                    })
            } else {
                result.exit_code == Some(0)
                    && (operation != "test"
                        || result.output.contains("PASSED")
                            && result.output.contains(if decimal {
                                "ARITHMETIC_94_VALUES"
                            } else if formulas {
                                "ARITHMETIC_93_VALUES"
                            } else {
                                "ARITHMETIC_92_VALUES"
                            }))
            };
        let passed = passed && (!decimal || operation != "test" ||
            result.output.contains("ARITHMETIC_94_NUMERIC quotient=0x1.5555555555556p+51 floor=9.0 remainder=0x1.0000000000000p-54 widened=float:-3.0 mixed=float:9007199254740992.0 zero=-0x0.0p+0 subnormal=0x0.0000000000001p-1022 default=float:2.5 comparisons=True text=Fraction_2.5 sample=Fraction_1e-07") &&
            result.output.contains("ARITHMETIC_94_VALUES score=36028797018963992 money=-15 remainder=-2 minimum=0 opaque=kept"));
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

#[test]
fn decimal_draft_contract_is_revision_bound_and_does_not_commit() {
    let temp = tempfile::tempdir().unwrap();
    let profile = temp.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"fraction","variableType":"decimal","defaultValue":1.25}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let history = ipc(&mut service, "history.state", json!({}));
    let scene = &model["scenes"][0];
    let fraction = model["authoring"]["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "fraction")
        .unwrap();
    let before = sources(&root.join("game"));
    let request = json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"expectedAuthoringRevision":model["authoringRevision"],"command":{"type":"insertBodyBeat","body":{"type":"root"},"sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"position":scene["bodies"][0]["defaultPlace"],"beat":{"type":"setVariable","variableId":fraction["id"],"value":{"operation":"assign","operand":"4 / 2"}}}});
    let valid = ipc(&mut service, "scene.validateAssignment", request.clone());
    assert_eq!(valid["support"], "supported");
    assert_eq!(valid["assignment"]["inferredResultType"], "decimal");
    assert_eq!(
        valid["assignment"]["state"],
        json!({"status":"known","value":2.0})
    );
    assert_eq!(
        valid["capabilities"]["operators"],
        json!(["+", "-", "*", "/", "//", "%"])
    );
    assert_eq!(
        valid["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == "fraction")
            .unwrap()["variableType"],
        "decimal"
    );
    let mut invalid = request.clone();
    invalid["command"]["beat"]["value"]["operand"] = json!("1 / 0");
    let refused = ipc(&mut service, "scene.validateAssignment", invalid);
    assert_eq!(refused["support"], "refused");
    assert_eq!(
        refused["assignment"]["diagnostics"][0],
        json!({"field":"value.operand","reason":"zeroDivisor"})
    );
    let mut fixtures = Vec::new();
    for (operand, support, reason) in [
        ("fraction + 1", "supported", "unobservedCurrentValue"),
        ("missing + 1", "refused", "missingVariable"),
        ("flag + 1", "refused", "incompatibleOperand"),
        ("1 +", "refused", "invalidSyntax"),
        ("9223372036854775807 + 1", "refused", "integerOverflow"),
        ("1e308 * 2", "refused", "nonFiniteResult"),
    ] {
        let mut input = request.clone();
        input["command"]["beat"]["value"]["operand"] = json!(operand);
        let output = ipc(&mut service, "scene.validateAssignment", input.clone());
        assert_eq!(output["support"], support, "{operand}: {output}");
        assert_eq!(output["assignment"]["state"]["reason"], reason, "{operand}");
        fixtures.push(json!({"request":input,"response":output}));
    }
    assert_eq!(sources(&root.join("game")), before);
    assert_eq!(ipc(&mut service, "history.state", json!({})), history);
    if let Some(dir) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            Path::new(&dir).join("decimal-contract.json"),
            serde_json::to_vec_pretty(
                &json!({"request":request,"response":valid,"refused":refused,"fixtures":fixtures}),
            )
            .unwrap(),
        )
        .unwrap();
    }
    let mut stale = request;
    stale["expectedAuthoringRevision"] = json!("stale");
    let session = service.current().unwrap().session_id.clone();
    stale["sessionId"] = json!(session);
    let refusal = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"stale-draft","operation":"scene.validateAssignment","payload":stale}),false,&mut service)).unwrap();
    assert_eq!(refusal["error"]["code"], "SOURCE_CONFLICT");
}

#[test]
fn decimal_fixture_preflight() {
    preflight(true, true);
}
#[test]
#[ignore = "explicit #94 combined pinned SDK qualification; one reserved invocation per target"]
fn decimal_sdk_gate() {
    sdk_gate(true, true);
}

fn decimal_screen(service: &mut LifecycleService, root: &Path) {
    let catalog = ipc(service, "screens.list", json!({}));
    let created = ipc(
        service,
        "screens.create",
        json!({"name":"arithmetic_decimal_text","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["name"] == "arithmetic_decimal_text")
        .unwrap();
    let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    ipc(
        service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"add","parentId":owner["rootId"],"kind":"text","text":"Fraction [fraction!q]"}}),
    );
    let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    let model = ipc(service, "authoring.list", json!({}));
    let fraction = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "fraction")
        .unwrap();
    let request = json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720});
    let source = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let plan = ipc(service, "screens.canvasPlan", request.clone());
    assert_eq!(plan["nodes"][1]["literal"], "Fraction 2.5");
    let mut sampled = request;
    sampled["variableSamples"] = json!([{"variableId":fraction["id"],"expectedSourceRevision":fraction["source"]["sourceRevision"],"value":1e-7}]);
    let sample = ipc(service, "screens.canvasPlan", sampled.clone());
    assert_eq!(sample["nodes"][1]["literal"], "Fraction 1e-07");
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        source
    );
    if let Some(dir) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            Path::new(&dir).join("decimal-screen.json"),
            serde_json::to_vec_pretty(&json!({"request":sampled,"plan":sample,"defaultPlan":plan}))
                .unwrap(),
        )
        .unwrap();
        fs::write(Path::new(&dir).join("decimal-screen.rpy"), source).unwrap();
    }
}

fn inspect_decimal_fixture(model: &serde_json::Value) {
    for (name, expected) in [
        ("quotient", json!(3002399751580331.0)),
        ("floorfloat", json!(9.0)),
        ("remfloat", json!(5.551115123125783e-17)),
        ("widened", json!(-3.0)),
        ("mixed", json!(9007199254740992.0)),
        ("signedzero", json!("-0.0")),
        ("subnormal", json!(5e-324)),
    ] {
        let variable = model["authoring"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap();
        let beat = model["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["variableId"] == variable["id"])
            .unwrap();
        assert_eq!(beat["assignment"]["inferredResultType"], "decimal");
        assert_eq!(beat["assignment"]["state"]["value"], expected, "{name}");
    }
}

#[test]
fn variable_defaults_share_history_with_scene_edits_and_reopen() {
    let temporary = tempfile::tempdir().unwrap();
    let root = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(root.clone()).unwrap();
    let project = root.join("synthetic-project");
    service.open_path(&project).unwrap();
    fn history(service: &mut LifecycleService, direction: &str) -> serde_json::Value {
        ipc(service, &format!("history.{direction}"), json!({}));
        ipc(service, "scene.list", json!({}))
    }
    for (name, kind, value, changed) in [
        ("fraction", "decimal", json!(2.5), json!(3.75)),
        (
            "points",
            "int",
            json!("9007199254740993"),
            json!("9223372036854775807"),
        ),
        ("enabled", "bool", json!(false), json!(true)),
        ("caption", "string", json!("before"), json!("after")),
    ] {
        let before = ipc(&mut service, "authoring.list", json!({}));
        let created = ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
        let variable = created["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap()
            .clone();
        assert!(!ipc(&mut service, "history.state", json!({}))["undo"].is_null());
        history(&mut service, "undo");
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["variables"],
            before["variables"]
        );
        history(&mut service, "redo");
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["variables"],
            created["variables"]
        );
        let updated = ipc(
            &mut service,
            "variable.update",
            json!({"id":variable["id"],"expectedSourceRevision":variable["source"]["sourceRevision"],"defaultValue":changed}),
        );
        let v = updated["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap();
        assert!(service.authoring_update_variable(serde_json::from_value(json!({"id":v["id"],"expectedSourceRevision":variable["source"]["sourceRevision"],"defaultValue":changed})).unwrap()).is_err());
        assert!(service.authoring_update_variable(serde_json::from_value(json!({"id":v["id"],"expectedSourceRevision":v["source"]["sourceRevision"],"defaultValue":[]})).unwrap()).is_err());
        // A semantic no-op must not hide the preceding edit in history.
        ipc(
            &mut service,
            "variable.update",
            json!({"id":v["id"],"expectedSourceRevision":v["source"]["sourceRevision"],"defaultValue":changed}),
        );
        history(&mut service, "undo");
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["variables"],
            created["variables"]
        );
        history(&mut service, "redo");
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["variables"],
            updated["variables"]
        );
    }
    let before = ipc(&mut service, "scene.list", json!({}));
    let scene = &before["scenes"][0];
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":before["projectRevision"],"expectedSourceMapRevision":before["sourceMapRevision"],"command":{"type":"insertBodyBeat","body":{"type":"root"},"sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"position":scene["bodies"][0]["defaultPlace"],"beat":{"type":"narration","text":"History interleave"}}}),
    );
    history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "scene.list", json!({}))["scenes"],
        before["scenes"]
    );
    history(&mut service, "undo");
    let restored = ipc(&mut service, "authoring.list", json!({}));
    assert_eq!(
        restored["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == "caption")
            .unwrap()["defaultValue"],
        "before"
    );
    history(&mut service, "redo");
    history(&mut service, "redo");
    let accepted = ipc(&mut service, "authoring.list", json!({}));
    service.close().unwrap();
    service.open_path(&project).unwrap();
    assert_eq!(ipc(&mut service, "authoring.list", json!({})), accepted);
    assert!(ipc(&mut service, "history.state", json!({}))["undo"].is_null());
    service.close().unwrap();
}
