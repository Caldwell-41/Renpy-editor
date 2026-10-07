use super::*;
use crate::lifecycle::{acceptance::ipc, CreateProjectRequest, LifecycleService};
use serde_json::json;

fn eof_source(label: &str) -> String {
    let source = include_str!("../../../../../tests/fixtures/source-foundation/scene.rpy")
        .trim_start_matches('\u{feff}')
        .replace("label scene_one:", &format!("label {label}:"));
    source[..source.find("    python:").unwrap()]
        .trim_end()
        .replace(
            "    if flag:",
            "    python:\n        opaque_neighbor = \"kept\"\n    if flag:",
        )
}

#[test]
fn source_foundation_sdk_eof_fixture_preflight() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    service.open_path(&root).unwrap();
    let model = ipc(&mut service, "scene.list", json!({}));
    let scene = &model["scenes"][0];
    let source = eof_source(scene["technicalLabel"].as_str().unwrap());
    let opened = ipc(
        &mut service,
        "source.open",
        json!({"path":scene["sourcePath"]}),
    );
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":scene["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        &mut service,
        "source.save",
        json!({"path":scene["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let before = fs::read(root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    assert!(!before.ends_with(b"\n"));
    let appended = ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":model["scenes"][0]["sourceRevision"],"beforeBeatId":null,"beat":{"type":"narration","text":"Foundation continuation"}}}),
    );
    assert_eq!(
        fs::read(root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        [
            before.as_slice(),
            b"\r\n    \"Foundation continuation\"\r\n"
        ]
        .concat()
    );
    let children = |m: &serde_json::Value| {
        m["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["owner"].is_object())
            .map(|b| (b["id"].clone(), b["owner"].clone()))
            .collect::<Vec<_>>()
    };
    assert_eq!(children(&model).len(), 2);
    assert_eq!(children(&model), children(&appended));
    service.close().unwrap();
}

#[test]
#[ignore = "explicit pinned-SDK source-foundation gate; missing archive is a failure"]
fn source_foundation_bool_sdk_gate() {
    let temporary = tempfile::tempdir().unwrap();
    let root_path = temporary.path().to_owned();
    let result = std::panic::catch_unwind(|| run(&temporary));
    let cleanup = temporary.close().is_ok() && !root_path.exists();
    println!(
        "source-foundation-sdk-terminal: {}",
        json!({"passed":result.is_ok() && cleanup,"cleanupComplete":cleanup})
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup);
}

fn run(temporary: &tempfile::TempDir) {
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("pinned archive required");
    fs::create_dir(temporary.path().join("Ren'Py Data")).unwrap();
    let sdk = install_supported_sdk_from_archive(
        &temporary.path().join("sdk-profile"),
        Path::new(&archive),
    )
    .unwrap();
    let mut service = LifecycleService::new(temporary.path().join("editor-profile")).unwrap();
    let parent = service.register_parent(temporary.path()).unwrap();
    let sdk_choice = service
        .register_sdk(&sdk.root, "verified-foundation")
        .unwrap();
    service
        .create_project(CreateProjectRequest {
            parent_id: parent.id,
            sdk_id: sdk_choice.id,
            title: "Source foundation".into(),
            folder_name: "foundation".into(),
            width: 1280,
            height: 720,
            initialize_git: false,
        })
        .unwrap();
    let root = temporary.path().join("foundation");
    ipc(
        &mut service,
        "character.create",
        json!({"technicalName":"bec","displayName":"Bec","dialogueColor":"#ffffff"}),
    );
    let authoring = ipc(
        &mut service,
        "variable.create",
        json!({"technicalName":"flag","variableType":"bool","defaultValue":true}),
    );
    let variable_id = authoring["variables"][0]["id"].clone();
    let scene = service.scene_workspace().unwrap().scenes[0].clone();
    // Keep the opaque Python neighbor, then end exactly at the final child.
    // The continuation must be produced by the corrected root EOF append path.
    let source = eof_source(&scene.technical_label);
    assert!(!source.ends_with('\n'));
    let opened = ipc(
        &mut service,
        "source.open",
        json!({"path":scene.source_path}),
    );
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":scene.source_path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        &mut service,
        "source.save",
        json!({"path":scene.source_path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let child = model["scenes"][0]["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["owner"].is_object())
        .unwrap();
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"updateChildDialogue","sceneId":scene.id,"expectedSourceRevision":model["scenes"][0]["sourceRevision"],"beatId":child["id"],"expectedOwner":child["owner"],"characterId":child["payload"]["characterId"],"text":"Edited café 雪"}}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let children = |model: &serde_json::Value| {
        model["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|beat| beat["owner"].is_object())
            .map(|beat| (beat["id"].clone(), beat["owner"].clone()))
            .collect::<Vec<_>>()
    };
    let before_append = fs::read(root.join(&scene.source_path)).unwrap();
    let appended = ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene.id,"expectedSourceRevision":model["scenes"][0]["sourceRevision"],"beforeBeatId":null,"beat":{"type":"narration","text":"Foundation continuation"}}}),
    );
    assert_eq!(children(&appended), children(&model));
    let accepted = fs::read(root.join(&scene.source_path)).unwrap();
    assert_eq!(
        accepted,
        [
            before_append.as_slice(),
            b"\r\n    \"Foundation continuation\"\r\n"
        ]
        .concat()
    );
    if let Some(directory) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
        fs::create_dir_all(&directory).unwrap();
        fs::write(Path::new(&directory).join("eof-produced.rpy"), &accepted).unwrap();
        fs::write(Path::new(&directory).join("eof-before.rpy"), &before_append).unwrap();
        fs::write(
            Path::new(&directory).join("eof-owners.json"),
            serde_json::to_vec_pretty(
                &json!({"before":children(&model),"after":children(&appended)}),
            )
            .unwrap(),
        )
        .unwrap();
    }
    let mut reports = Vec::new();
    for (name, value, expected, reject) in [
        ("true", true, "Edited café 雪", false),
        ("false", false, "False café 雪", false),
        ("wrong-outcome", false, "Edited café 雪", true),
    ] {
        let variables = ipc(&mut service, "authoring.list", json!({}));
        let variable = &variables["variables"][0];
        if variable["defaultValue"] != value {
            ipc(
                &mut service,
                "variable.update",
                json!({"id":variable_id,"expectedSourceRevision":variable["source"]["sourceRevision"],"defaultValue":value}),
            );
        }
        let driver = format!("init -999 python:\n    import os\n    os.environ[\"SDL_AUDIODRIVER\"] = \"dummy\"\n\ntestsuite source_foundation:\n    after testcase:\n        exit\n\n    testcase route:\n        assert screen \"main_menu\" timeout 10\n        click \"Start\"\n        assert {expected:?} timeout 10\n        assert eval (flag is {}) timeout 10\n        assert eval (renpy.get_screen(\"say\").scope[\"what\"] == {expected:?}) timeout 10\n        $ print(\"SOURCE_FOUNDATION_ROUTE {name}\", flush=True)\n        advance until \"Foundation continuation\"\n        assert \"Foundation continuation\" timeout 10\n        assert eval (opaque_neighbor == \"kept\") timeout 10\n        advance until screen \"main_menu\"\n        exit\n", if value {"True"} else {"False"});
        fs::write(root.join("game/zz_foundation_test.rpy"), driver).unwrap();
        if name == "true" {
            for operation in ["compile", "lint"] {
                let result = run_bounded(
                    &sdk.root,
                    launcher_args(&sdk.root, &[command_path(&root), OsString::from(operation)])
                        .unwrap(),
                    Duration::from_secs(60),
                )
                .unwrap();
                assert!(
                    !result.timed_out && result.exit_code == Some(0),
                    "{operation}: {}",
                    result.output
                );
            }
        }
        let result = run_bounded(
            &sdk.root,
            launcher_args(
                &sdk.root,
                &[
                    command_path(&root),
                    OsString::from("test"),
                    OsString::from("source_foundation::route"),
                ],
            )
            .unwrap(),
            Duration::from_secs(60),
        )
        .unwrap();
        let passed = !result.timed_out
            && if reject {
                result.exit_code.is_some_and(|c| c != 0)
                    && result.output.contains("FAILED")
                    && !result
                        .output
                        .contains("SOURCE_FOUNDATION_ROUTE wrong-outcome")
            } else {
                result.exit_code == Some(0)
                    && result.output.contains("PASSED")
                    && result
                        .output
                        .contains(&format!("SOURCE_FOUNDATION_ROUTE {name}"))
            };
        println!(
            "source-foundation-sdk-case: {}",
            json!({"case":name,"passed":passed,"expectedRejection":reject,"exitCode":result.exit_code,"timedOut":result.timed_out})
        );
        reports.push(
            json!({"case":name,"passed":passed,"expectedRejection":reject,"output":result.output}),
        );
        if let Some(directory) = std::env::var_os("LOOMLIGHT_FOUNDATION_EVIDENCE_DIR") {
            fs::create_dir_all(&directory).unwrap();
            fs::write(
                Path::new(&directory).join("sdk-cases.json"),
                serde_json::to_vec_pretty(&reports).unwrap(),
            )
            .unwrap();
        }
        if !passed {
            println!("SDK case {name}: {}", result.output);
        }
        assert_eq!(fs::read(root.join(&scene.source_path)).unwrap(), accepted);
    }
    service.close().unwrap();
    assert!(
        reports.iter().all(|report| report["passed"] == true),
        "SDK cases failed: {}",
        serde_json::to_string(&reports).unwrap()
    );
}
