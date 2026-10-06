use super::*;
use crate::lifecycle::acceptance::{apply, create_authored_game, ipc, parent_path, EXPECTED};
use serde_json::{json, Value};

#[test]
#[ignore = "explicit pinned-SDK integrated authoring gate; no skip pass"]
fn phase1h_integrated_authoring_sdk_gate() {
    let started = Instant::now();
    let spawns = process_spawn_count_for_test();
    let temporary = tempfile::tempdir().unwrap();
    let temporary_root = temporary.path().to_path_buf();
    let result = std::panic::catch_unwind(|| run_integrated_gate(&temporary));
    let cleanup_complete = temporary.close().is_ok() && !temporary_root.exists();
    // Includes early prerequisite failures; no missing terminal success report.
    println!(
        "phase-1h-terminal-report: {}",
        json!({"passed":result.is_ok() && cleanup_complete,"elapsedMs":started.elapsed().as_millis(),"boundedAdapterSpawns":process_spawn_count_for_test()-spawns,"cleanupComplete":cleanup_complete})
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(
        cleanup_complete,
        "temporary profile/game/SDK/save cleanup failed"
    );
}

fn run_integrated_gate(temporary: &tempfile::TempDir) {
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("official SDK archive required");
    // The pinned launcher searches SDK ancestors for this documented portable
    // save root. Includes global save tokens; no normal user-profile writes.
    fs::create_dir(temporary.path().join("Ren'Py Data")).unwrap();
    let sdk = install_supported_sdk_from_archive(
        &temporary.path().join("sdk-profile"),
        Path::new(&archive),
    )
    .unwrap();
    let started = Instant::now();
    println!("phase-1h-stage: staged-create-and-author");
    let mut service = create_authored_game(
        &temporary.path().join("editor-profile"),
        temporary.path(),
        &sdk.root,
    );
    let root = parent_path(&service);
    let project_id = service.current().unwrap().project_id;
    println!(
        "phase-1h-stage: authored-reopen {}ms",
        started.elapsed().as_millis()
    );
    let expected: Value = serde_json::from_str(EXPECTED).unwrap();
    let no_execution = process_spawn_count_for_test();
    let opened = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/definitions/transforms.rpy"}),
    );
    ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":"game/definitions/transforms.rpy","expectedBaseRevision":opened["baseRevision"],"text":format!("{}\n# retained untrusted typing\n",opened["text"].as_str().unwrap()),"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        &mut service,
        "source.discard",
        json!({"path":"game/definitions/transforms.rpy"}),
    );
    let selected = service
        .authoring_select_import(&root.join("original-inputs/alex.png"))
        .unwrap();
    service
        .authoring_preview_import(crate::media::ImportPreviewRequest {
            authority_id: selected.authority_id,
        })
        .unwrap();
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        process_spawn_count_for_test(),
        no_execution,
        "untrusted open/preview/typing must launch zero SDK processes"
    );
    // Testcases exercise normal entry, real dialogue widgets, state and discovered
    // media. They never Jump to a route or overwrite normal game screens/labels.
    let model = service.authoring_list().unwrap();
    let theme = model
        .assets
        .iter()
        .find(|a| a.display_name == "theme")
        .unwrap();
    let sfx = model
        .assets
        .iter()
        .find(|a| a.display_name == "bell")
        .unwrap();
    // Assert defaults to an immediate check in this pinned SDK. Await visible
    // conditions explicitly; teardown exits on failure rather than hanging at
    // the debug screen until the unchanged 60-second process deadline.
    let mut tests = String::from("after testcase:\n    exit\n\n");
    for (route, button, tag, x_test) in [
        ("rooftop", "Rooftop", "alex", "> 900"),
        ("riverside", "Riverside", "morgan", "< 300"),
    ] {
        let value = &expected["routes"][route];
        let image = &model
            .assets
            .iter()
            .find(|a| a.display_name == route)
            .unwrap()
            .discovery_name;
        let dialogue = value["dialogue"].as_str().unwrap();
        tests.push_str(&format!(
            r#"testcase phase1h_{route}:
    assert screen "main_menu"
    click "Start"
    assert "The shift is over. Where shall we go?"
    assert eval (heard_news is False and trust == 9007199254740993 and route == "unset")
    assert eval (renpy.showing("alex happy") and renpy.showing("morgan calm"))
    assert eval (500 < renpy.get_image_bounds("alex")[0] < 700)
    assert eval (renpy.music.get_playing() == {theme_path:?})
    assert eval (renpy.music.get_playing(channel="sound") == {sfx_path:?})
    assert eval (renpy.get_screen("say").scope["what"] == "The shift is over. Where shall we go?")
    $ print("PHASE1H_ENTRY_OBSERVED", __import__("json").dumps(dict(dialogue=renpy.get_screen("say").scope["what"], trust=str(trust), heard_news=heard_news, route=route, alexBounds=renpy.get_image_bounds("alex"), music=renpy.music.get_playing(), sound=renpy.music.get_playing(channel="sound"))), flush=True)
    click "Prefs"
    assert screen "preferences"
    click "Return"
    click "Save"
    assert screen "save"
    run FileSave("1", confirm=False)
    click "Return"
    click "The shift is over. Where shall we go?"
    assert "Choose a road at sundown."
    run FileLoad("1", confirm=False)
    assert "The shift is over. Where shall we go?"
    assert eval (trust == 9007199254740993 and route == "unset")
    click "History"
    assert screen "history"
    click "Return"
    click "The shift is over. Where shall we go?"
    assert "Choose a road at sundown."
    click "Choose a road at sundown."
    assert screen "choice"
    click "{button}"
    assert {dialogue:?}
    pause 0.5
    $ renpy.take_screenshot()
    $ fixture_screenshot_ok = renpy.screenshot(config.basedir + "/screenshot_{route}.png")
    assert eval fixture_screenshot_ok
    assert eval (route == {route:?} and heard_news is {flag} and trust == {trust})
    assert eval (renpy.showing({image:?}) and renpy.showing({character:?}))
    assert eval (renpy.get_image_bounds({tag:?})[0] {x_test})
    $ print("PHASE1H_ROUTE_OBSERVED", __import__("json").dumps(dict(dialogue=renpy.get_screen("say").scope["what"], trust=str(trust), heard_news=heard_news, route=route, backgroundShowing=renpy.showing({image:?}), characterShowing=renpy.showing({character:?}), bounds=renpy.get_image_bounds({tag:?}))), flush=True)
    advance until "We meet again at the station."
    assert "We meet again at the station."
    assert eval (renpy.music.get_playing() is None and not renpy.showing({tag:?}))
    assert eval (fixture_custom == {{'kept': 'exact'}} and route == {route:?})
    run Rollback()
    assert {dialogue:?}
    assert eval (trust == {trust} and route == {route:?})
    advance until "We meet again at the station."
    assert "We meet again at the station."
    advance until screen "main_menu"
    assert screen "main_menu"
    exit

"#,
            theme_path = theme.relative_path.strip_prefix("game/").unwrap(),
            sfx_path = sfx.relative_path.strip_prefix("game/").unwrap(),
            flag = if value["heard_news"] == true {
                "True"
            } else {
                "False"
            },
            trust = value["trust"].as_str().unwrap(),
            character = value["character"].as_str().unwrap()
        ));
    }
    tests.push_str(
        r#"testcase phase1h_wrong_outcome:
    assert screen "main_menu"
    click "Start"
    advance until screen "choice"
    click "Rooftop"
    assert "Rooftop: a shared plan."
    assert eval (trust == 1)
    exit

"#,
    );
    let tests = tests
        .lines()
        .map(|line| {
            if line.trim_start().starts_with("assert ")
                && line.trim_start() != "assert eval (trust == 1)"
            {
                format!("{line} timeout 10")
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    let tests = format!(
        "testsuite phase1h:\n{}\n",
        tests
            .lines()
            .map(|line| format!("    {line}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
    fs::write(root.join("game/zz_phase1h_testcases.rpy"), &tests).unwrap();
    // Real production preparation/trust/compile/lint on the complete authored tree.
    println!("phase-1h-stage: validate-through-runtime-service");
    let sdk_id = service
        .register_sdk(&sdk.root, "phase1h-verified")
        .unwrap()
        .id;
    let prepared = ipc(
        &mut service,
        "runtime.prepare",
        json!({"kind":"validate","revisionChoice":"saved","sdkId":sdk_id}),
    );
    let trust = ipc(
        &mut service,
        "runtime.grantTrust",
        json!({"preparationId":prepared["preparationId"]}),
    );
    let operation = ipc(
        &mut service,
        "runtime.start",
        json!({"preparationId":prepared["preparationId"],"trustId":trust["trustId"]}),
    );
    let wait = Instant::now();
    let validation = loop {
        let status = ipc(
            &mut service,
            "runtime.status",
            json!({"operationId":operation["operationId"],"afterSequence":0}),
        );
        if status["cleanupComplete"] == true {
            break status;
        }
        assert!(
            wait.elapsed() < Duration::from_secs(180),
            "validation timeout: {status}"
        );
        thread::sleep(Duration::from_millis(100));
    };
    assert_eq!(validation["exitCode"], 0, "{validation}");
    assert_eq!(validation["phase"], "exited", "{validation}");
    println!("phase-1h-stage: real-compiled-scene-lifecycle");
    use crate::scene::{SceneCommand as Command, SceneCommandRequest};
    let workspace = service.scene_workspace().unwrap();
    let disposable = workspace
        .scenes
        .iter()
        .find(|s| s.display_name == "Disposable")
        .unwrap();
    let old_source = root.join(&disposable.source_path);
    let old_compiled = old_source.with_extension("rpyc");
    assert!(
        old_compiled.is_file(),
        "real compile must produce this Scene cache"
    );
    let compiled_bytes = fs::read(&old_compiled).unwrap();
    let original_bytes = fs::read(&old_source).unwrap();
    let target = workspace
        .scenes
        .iter()
        .find(|s| s.display_name == "Radio booth")
        .unwrap()
        .chapter_id
        .clone();
    let moved = apply(
        &service,
        Command::MoveScene {
            scene_id: disposable.id.clone(),
            chapter_id: target,
            direction: None,
            expected_source_revision: disposable.source_revision.clone(),
        },
    );
    assert!(!old_source.exists() && !old_compiled.exists());
    let new_source = root.join(
        &moved
            .scenes
            .iter()
            .find(|s| s.id == disposable.id)
            .unwrap()
            .source_path,
    );
    assert_eq!(fs::read(&new_source).unwrap(), original_bytes);
    apply(&service, Command::Undo);
    assert_eq!(fs::read(&old_compiled).unwrap(), compiled_bytes);
    assert!(!new_source.exists());
    let moved = apply(&service, Command::Redo);
    let moved_scene = moved.scenes.iter().find(|s| s.id == disposable.id).unwrap();
    let deleted = apply(
        &service,
        Command::DeleteScene {
            scene_id: disposable.id.clone(),
            expected_source_revision: moved_scene.source_revision.clone(),
        },
    );
    assert!(
        !new_source.exists()
            && !new_source.with_extension("rpyc").exists()
            && !old_compiled.exists()
    );
    let incoming = deleted
        .scenes
        .iter()
        .find(|s| s.display_name == "Rooftop")
        .unwrap();
    assert!(matches!(
        service.scene_apply(SceneCommandRequest {
            expected_project_revision: deleted.project_revision,
            expected_source_map_revision: deleted.source_map_revision,
            command: Command::DeleteScene {
                scene_id: incoming.id.clone(),
                expected_source_revision: incoming.source_revision.clone()
            }
        }),
        Err(crate::lifecycle::LifecycleError::Scene(
            crate::scene::SceneError::ReferenceBlocked
        ))
    ));
    apply(&service, Command::Undo);
    assert_eq!(fs::read(&new_source).unwrap(), original_bytes);
    apply(&service, Command::Redo);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(service.scene_workspace().unwrap().scenes.len(), 4);
    service.close().unwrap();
    let mut reports = Vec::new();
    let copied_uuid = temporary.path().join("copied-uuid-parent/crossroads");
    copy_tree(&root.join("game"), &copied_uuid.join("game"));
    copy_tree(
        &root.join(".renpy-editor"),
        &copied_uuid.join(".renpy-editor"),
    );
    assert_eq!(
        service.open_path(&copied_uuid).unwrap().project_id,
        project_id
    );
    let copied_preparation = ipc(
        &mut service,
        "runtime.prepare",
        json!({"kind":"validate","revisionChoice":"saved","sdkId":sdk_id}),
    );
    assert!(
        copied_preparation["trustId"].is_null(),
        "copied UUID does not transfer consent"
    );
    let refused = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"copy-trust-refusal","operation":"runtime.start","payload":{"sessionId":service.current().unwrap().session_id,"preparationId":copied_preparation["preparationId"],"trustId":trust["trustId"]}}), false, &mut service)).unwrap();
    assert_eq!(refused["error"]["code"], "RUNTIME_TRUST_REQUIRED");
    ipc(
        &mut service,
        "runtime.cancelPreparation",
        json!({"preparationId":copied_preparation["preparationId"]}),
    );
    service.close().unwrap();
    let without_metadata = temporary.path().join("metadata-free-copy");
    copy_tree(&root.join("game"), &without_metadata.join("game"));
    assert!(!without_metadata.join(".renpy-editor").exists());
    for (case, name, project, rejecting) in [
        ("rooftop", "phase1h_rooftop", &root, false),
        ("riverside", "phase1h_riverside", &root, false),
        (
            "metadata-free-riverside",
            "phase1h_riverside",
            &without_metadata,
            false,
        ),
        ("reject-wrong-outcome", "phase1h_wrong_outcome", &root, true),
    ] {
        println!("phase-1h-stage: {case}");
        let case_start = Instant::now();
        let result = run_bounded(
            &sdk.root,
            launcher_args(
                &sdk.root,
                &[
                    command_path(project),
                    OsString::from("test"),
                    OsString::from(format!("phase1h::{name}")),
                ],
            )
            .unwrap(),
            Duration::from_secs(60),
        )
        .unwrap();
        let passed = !result.timed_out
            && expected_case_output(&result.output, name, rejecting)
            && if rejecting {
                result.exit_code.is_some_and(|code| code != 0)
                    && result.output.contains("FAILED")
                    && result.output.contains("trust == 1")
            } else {
                result.exit_code == Some(0) && result.output.contains("PASSED")
            };
        println!(
            "phase-1h-case: {case} {} {}ms",
            if passed { "passed" } else { "failed" },
            case_start.elapsed().as_millis()
        );
        if !passed {
            println!("{}", result.output);
        }
        reports.push(json!({"case":case,"testcase":name,"expectedRejection":rejecting,"passed":passed,"exitCode":result.exit_code,"timedOut":result.timed_out,"elapsedMs":case_start.elapsed().as_millis()}));
        if let Some(directory) = std::env::var_os("LOOMLIGHT_PHASE1H_EVIDENCE_DIR") {
            let directory = PathBuf::from(directory);
            fs::create_dir_all(&directory).unwrap();
            fs::write(
                directory.join(format!("{case}.json")),
                serde_json::to_vec_pretty(reports.last().unwrap()).unwrap(),
            )
            .unwrap();
            fs::write(directory.join(format!("{case}.log")), &result.output).unwrap();
            // Only this case's capture belongs to this report. The rejecting
            // control deliberately takes none; earlier route captures remain in
            // the disposable project but must not be relabelled as its evidence.
            if !rejecting {
                let route = if case == "rooftop" {
                    "rooftop"
                } else {
                    "riverside"
                };
                let filename = format!("screenshot_{route}.png");
                let capture = project.join(&filename);
                if capture.is_file() {
                    fs::copy(capture, directory.join(format!("{case}-{filename}"))).unwrap();
                }
            }
        }
    }
    println!(
        "phase-1h-report: {}",
        json!({"cases":reports,"elapsedMs":started.elapsed().as_millis()})
    );
    assert!(
        reports.iter().all(|r| r["passed"] == true),
        "an authored route failed"
    );
    println!("phase-1h-integrated-authoring-sdk-gate: passed (2 routes, metadata-free copy, rejected wrong outcome)");
}

fn expected_case_output(output: &str, name: &str, rejecting: bool) -> bool {
    let Some(summary) = output
        .lines()
        .find(|line| line.starts_with("[rpytest] Test cases :"))
    else {
        return false;
    };
    let fields = summary.split('|').map(str::trim).collect::<Vec<_>>();
    output.contains(name)
        && if rejecting {
            fields.get(1) == Some(&"0 passed") && fields.get(3) == Some(&"1 failed")
        } else {
            fields.get(1) == Some(&"1 passed") && fields.get(3) == Some(&"0 failed")
        }
}

#[test]
fn phase1h_sdk_case_guard_rejects_missing_zero_skipped_and_failed_cases() {
    let positive = "phase1h_rooftop\n[rpytest] Test cases : 3 | 1 passed | 0 xfailed | 0 failed | 0 xpassed | 1 skipped | 1 not run\nStatus: PASSED";
    assert!(expected_case_output(positive, "phase1h_rooftop", false));
    for invalid in [
        positive.replace("1 passed", "0 passed"),
        positive.replace("0 failed", "1 failed"),
        positive.replace("phase1h_rooftop", "wrong_case"),
        String::from("phase1h_rooftop Status: PASSED"),
    ] {
        assert!(!expected_case_output(&invalid, "phase1h_rooftop", false));
    }
    let rejecting = "phase1h_wrong_outcome\n[rpytest] Test cases : 3 | 0 passed | 0 xfailed | 1 failed | 0 xpassed | 1 skipped | 1 not run\nStatus: FAILED";
    assert!(expected_case_output(
        rejecting,
        "phase1h_wrong_outcome",
        true
    ));
    assert!(!expected_case_output(positive, "phase1h_rooftop", true));
}

fn copy_tree(source: &Path, target: &Path) {
    fs::create_dir_all(target).unwrap();
    for entry in fs::read_dir(source).unwrap().flatten() {
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&entry.path(), &target.join(entry.file_name()));
        } else {
            fs::copy(entry.path(), target.join(entry.file_name())).unwrap();
        }
    }
}
