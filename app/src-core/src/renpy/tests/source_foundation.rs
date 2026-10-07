use super::*;
use crate::lifecycle::{acceptance::ipc, CreateProjectRequest, LifecycleService};
use serde_json::json;

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
    let source = include_str!("../../../../../tests/fixtures/source-foundation/scene.rpy")
        .trim_start_matches('\u{feff}')
        .replace(
            "label scene_one:",
            &format!("label {}:", scene.technical_label),
        );
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
    let accepted = fs::read(root.join(&scene.source_path)).unwrap();
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
