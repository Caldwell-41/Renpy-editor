//! One accepted nested edit and normal-entry conditions/call outcomes in the real SDK.
use super::*;
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};

#[derive(Default)]
struct Counts {
    sdk_installs: u32,
    version_checks: usize,
    gui_image_commands: usize,
    adapter_spawns: usize,
    gui_generations: u32,
    compile_commands: u32,
    lint_commands: u32,
    runtime_cases: u32,
    metadata_absent: bool,
    source_unchanged: bool,
}

#[test]
#[ignore = "explicit pinned SDK Phase 3A proof; missing archive is a failure"]
fn phase3a_conditions_calls_sdk_gate() {
    let temporary = tempfile::tempdir().unwrap();
    let root = temporary.path().to_owned();
    let mut counts = Counts::default();
    let adapter_start = process_spawn_count_for_test();
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        run(&temporary, &mut counts)
    }));
    counts.adapter_spawns = process_spawn_count_for_test() - adapter_start;
    let cleanup = temporary.close().is_ok() && !root.exists();
    println!(
        "phase-3a-sdk-terminal: {}",
        json!({
            "passed": result.is_ok() && cleanup, "cleanupComplete": cleanup,
            "sdkInstalls": counts.sdk_installs, "guiGenerations": counts.gui_generations,
            "versionChecks": counts.version_checks, "guiImageCommands": counts.gui_image_commands,
            "adapterSpawns": counts.adapter_spawns,
            "compileCommands": counts.compile_commands, "lintCommands": counts.lint_commands,
            "runtimeCases": counts.runtime_cases, "metadataAbsent": counts.metadata_absent,
            "acceptedSourceUnchanged": counts.source_unchanged
        })
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup, "owned game/profile/SDK/save cleanup failed");
}

fn save(service: &mut LifecycleService, path: &str, text: &str) {
    let opened = ipc(service, "source.open", json!({"path": path}));
    let draft = ipc(
        service,
        "source.updateDraft",
        json!({"path": path, "expectedBaseRevision": opened["baseRevision"], "text": text, "selectionStart": 0, "selectionEnd": 0}),
    );
    ipc(
        service,
        "source.save",
        json!({"path": path, "expectedBaseRevision": draft["baseRevision"], "expectedDraftVersion": draft["draftVersion"]}),
    );
}

fn scene(service: &mut LifecycleService, name: &str) -> Value {
    let model = ipc(service, "scene.list", json!({}));
    let model = ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision": model["projectRevision"], "expectedSourceMapRevision": model["sourceMapRevision"], "command": {"type": "createScene", "chapterId": model["chapters"][0]["id"], "displayName": name}}),
    );
    model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["displayName"] == name)
        .unwrap()
        .clone()
}

fn insert_call(
    service: &mut LifecycleService,
    root: &Path,
    scene_id: &Value,
    target: &Value,
    anchor_text: &str,
) -> Value {
    let model = ipc(service, "scene.list", json!({}));
    let scene = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| &s["id"] == scene_id)
        .unwrap();
    let anchor = scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["text"] == anchor_text)
        .unwrap();
    let path = root.join(scene["sourcePath"].as_str().unwrap());
    let before = fs::read(&path).unwrap();
    let accepted = ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision": model["projectRevision"], "expectedSourceMapRevision": model["sourceMapRevision"], "command": {
            "type": "insertBeat", "sceneId": scene_id, "expectedSourceRevision": scene["sourceRevision"], "beforeBeatId": anchor["id"],
            "beat": {"type": "call", "sceneId": target["id"], "returnLabel": null}
        }}),
    );
    let current = accepted["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| &s["id"] == scene_id)
        .unwrap();
    let beats = current["beats"].as_array().unwrap();
    let call_index = beats
        .iter()
        .position(|b| b["payload"]["type"] == "call")
        .unwrap();
    let call = &beats[call_index];
    assert_eq!(call["payload"]["sceneId"], target["id"]);
    assert_eq!(
        beats[call_index + 1]["id"],
        anchor["id"],
        "Call must return to the explicit following Beat"
    );
    let return_label = call["payload"]["returnLabel"].as_str().unwrap();
    let suffix = return_label
        .strip_prefix("_ll_call_")
        .expect("generated stable return label");
    assert!(suffix.len() == 32 && suffix.bytes().all(|b| b.is_ascii_hexdigit()));
    let anchor_source = format!("    \"{anchor_text}\"\n");
    let offset = before
        .windows(anchor_source.len())
        .position(|w| w == anchor_source.as_bytes())
        .unwrap();
    let inserted = format!(
        "    call {} from {return_label}\n",
        target["technicalLabel"].as_str().unwrap()
    );
    assert_eq!(
        fs::read(path).unwrap(),
        [&before[..offset], inserted.as_bytes(), &before[offset..]].concat(),
        "authored Call inserts one exact source line"
    );
    call.clone()
}

fn author_guarded_choice(service: &mut LifecycleService, root: &Path, scene_id: &Value) {
    let definitions = ipc(service, "authoring.list", json!({}));
    let variable = |name: &str| {
        definitions["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap()["id"]
            .clone()
    };
    let model = ipc(service, "scene.list", json!({}));
    let scene = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| &s["id"] == scene_id)
        .unwrap();
    let choice = scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["type"] == "choice")
        .unwrap();
    let mut options = choice["payload"]["options"].clone();
    let guard = json!({"status":"supported","expression":{"type":"and",
        "left":{"type":"compare","operator":"greaterEqual","left":{"type":"variable","variableId":variable("trust"),"variableType":"int"},"right":{"type":"int","value":"5"}},
        "right":{"type":"compare","operator":"equal","left":{"type":"variable","variableId":variable("mood"),"variableType":"string"},"right":{"type":"string","value":"ready"}}
    }});
    options[0]["condition"] = guard.clone();
    let path = root.join(scene["sourcePath"].as_str().unwrap());
    let before = fs::read_to_string(&path).unwrap();
    let accepted = ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{
            "type":"updateBeat","sceneId":scene_id,"expectedSourceRevision":scene["sourceRevision"],"beatId":choice["id"],"beat":{"type":"choice","options":options}
        }}),
    );
    let current = accepted["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| &s["id"] == scene_id)
        .unwrap();
    let current_choice = current["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["id"] == choice["id"])
        .unwrap();
    assert_eq!(current_choice["payload"]["options"][0]["condition"], guard);
    assert_eq!(
        current_choice["payload"]["options"][1],
        choice["payload"]["options"][1]
    );
    let old = "\"Ready route\" if trust >= 5:";
    let new = "\"Ready route\" if ((trust >= 5) and (mood == \"ready\")):";
    assert_eq!(before.matches(old).count(), 1);
    assert_eq!(
        fs::read_to_string(path).unwrap(),
        before.replacen(old, new, 1),
        "guarded Choice changes only its condition expression"
    );
}

fn set_variable(service: &mut LifecycleService, name: &str, value: Value) {
    let model = ipc(service, "authoring.list", json!({}));
    let variable = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == name)
        .unwrap();
    if variable["defaultValue"] != value {
        ipc(
            service,
            "variable.update",
            json!({"id": variable["id"], "expectedSourceRevision": variable["source"]["sourceRevision"], "defaultValue": value}),
        );
    }
}

fn sources(root: &Path) -> std::collections::BTreeMap<PathBuf, Vec<u8>> {
    fn walk(root: &Path, path: &Path, out: &mut std::collections::BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(path).unwrap() {
            let entry = entry.unwrap();
            let path = entry.path();
            if entry.file_type().unwrap().is_dir() {
                walk(root, &path, out);
            } else if path.extension().is_some_and(|e| e == "rpy") {
                out.insert(
                    path.strip_prefix(root).unwrap().to_owned(),
                    fs::read(&path).unwrap(),
                );
            }
        }
    }
    let mut out = std::collections::BTreeMap::new();
    walk(root, &root.join("game"), &mut out);
    out
}

fn copy_game(source: &Path, target: &Path) {
    fs::create_dir_all(target).unwrap();
    for entry in fs::read_dir(source).unwrap() {
        let entry = entry.unwrap();
        if entry.file_name() == ".renpy-editor" {
            continue;
        }
        let destination = target.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_game(&entry.path(), &destination);
        } else {
            fs::copy(entry.path(), destination).unwrap();
        }
    }
}

fn create_story_variables(service: &mut LifecycleService) {
    for (name, kind, value) in [
        ("trust", "int", json!("5")),
        ("mood", "string", json!("ready")),
        ("precision", "int", json!("9007199254740993")),
    ] {
        ipc(
            service,
            "variable.create",
            json!({"technicalName": name, "variableType": kind, "defaultValue": value}),
        );
    }
}

fn condition_source(entry_label: &str, high_label: &str, low_label: &str) -> String {
    let source = format!("label {}:\n    # exact opaque neighbor and nested source survive visual edit\n    python:\n        opaque_neighbor = \"kept\"\n    if flag:\n        if trust >= 5 and mood == \"ready\" and precision == 9007199254740993:\n            # nested comment retained café 雪\n            bec \"Deep original\"\n        elif trust == 4:\n            bec \"Boundary branch\"\n        else:\n            bec \"Other nested branch\"\n    else:\n        bec \"Low branch\"\n    \"Caller resumed\"\n    menu:\n        \"Ready route\" if trust >= 5:\n            jump {}\n        \"Low route\" if trust >= 0 and trust < 5:\n            jump {}\n    \"Nothing available\"\n    return\n", entry_label, high_label, low_label);
    source
}

fn edit_nested_dialogue(
    service: &mut LifecycleService,
    root: &Path,
    entry_id: &str,
    source: &str,
) -> (Vec<u8>, Vec<u8>) {
    let before_spawns = process_spawn_count_for_test();
    let initial = ipc(service, "scene.list", json!({}));
    let entry = initial["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    let source_path = entry["sourcePath"].as_str().unwrap().to_owned();
    save(service, &source_path, source);
    let accepted_before = fs::read(root.join(&source_path)).unwrap();
    let model = ipc(service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    let branches = entry["beats"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|b| b["conditionalBranch"].is_object())
        .collect::<Vec<_>>();
    assert_eq!(
        branches.len(),
        5,
        "all outer/nested ordered branches are source-mapped"
    );
    for branch in branches
        .iter()
        .filter(|b| b["conditionalBranch"]["otherwise"] == false)
    {
        assert_eq!(
            branch["conditionalBranch"]["condition"]["status"], "supported",
            "typed condition must be known to core"
        );
    }
    let child = entry["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["text"] == "Deep original")
        .unwrap();
    assert!(
        child["owner"].is_object(),
        "nested child must have immediate owner"
    );
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision": model["projectRevision"], "expectedSourceMapRevision": model["sourceMapRevision"], "command": {"type": "updateChildDialogue", "sceneId": entry_id, "expectedSourceRevision": entry["sourceRevision"], "beatId": child["id"], "expectedOwner": child["owner"], "characterId": child["payload"]["characterId"], "text": "Edited deep café 雪"}}),
    );
    let produced = fs::read(root.join(entry["sourcePath"].as_str().unwrap())).unwrap();
    let before_text = std::str::from_utf8(&accepted_before).unwrap();
    assert_eq!(before_text.matches("bec \"Deep original\"").count(), 1);
    assert_eq!(
        produced,
        before_text
            .replacen("bec \"Deep original\"", "bec \"Edited deep café 雪\"", 1)
            .as_bytes(),
        "visual edit preserves BOM and touches only the nested dialogue"
    );
    assert_eq!(
        process_spawn_count_for_test(),
        before_spawns,
        "source save/read/nested edit must execute zero SDK commands"
    );
    (accepted_before, produced)
}

#[test]
fn phase3a_sdk_fixture_source_save_preserves_bom() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let before_spawns = process_spawn_count_for_test();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let entry_id = service.current().unwrap().scene_id.clone();
    create_story_variables(&mut service);
    let high = scene(&mut service, "High ending");
    let low = scene(&mut service, "Low ending");
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    let source = condition_source(
        entry["technicalLabel"].as_str().unwrap(),
        high["technicalLabel"].as_str().unwrap(),
        low["technicalLabel"].as_str().unwrap(),
    );
    let (before, after) = edit_nested_dialogue(&mut service, &root, &entry_id, &source);
    assert!(before.starts_with(&[0xef, 0xbb, 0xbf]));
    assert!(after.starts_with(&[0xef, 0xbb, 0xbf]));
    assert_eq!(
        process_spawn_count_for_test(),
        before_spawns,
        "fixture preflight must execute zero SDK commands"
    );
    service.close().unwrap();
}

fn run(temporary: &tempfile::TempDir, counts: &mut Counts) {
    let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE")
        .expect("pinned official SDK archive required");
    let evidence = std::env::var_os("LOOMLIGHT_PHASE3A_EVIDENCE_DIR").map(PathBuf::from);
    if let Some(path) = &evidence {
        fs::create_dir_all(path).unwrap();
    }
    fs::create_dir(temporary.path().join("Ren'Py Data")).unwrap();
    let adapter_start = process_spawn_count_for_test();
    counts.sdk_installs += 1;
    let installed = install_supported_sdk_from_archive(
        &temporary.path().join("sdk-profile"),
        Path::new(&archive),
    );
    counts.version_checks = process_spawn_count_for_test() - adapter_start;
    let sdk = installed.unwrap();
    // Project creation's implicit starter compile/lint is qualified separately.
    // Use the existing zero-execution service fixture, then generate standard GUI
    // scaffolding once so this gate spends its only compile/lint on accepted 3A source.
    let profile = temporary.path().join("editor-profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let entry_id = service.current().unwrap().scene_id;
    let scaffold = temporary.path().join("standard-gui");
    counts.gui_generations += 1;
    let gui_start = process_spawn_count_for_test();
    let generated = RenpyAdapter::generate_starter(&sdk, &scaffold, 1280, 720);
    counts.gui_image_commands = (process_spawn_count_for_test() - gui_start).saturating_sub(1);
    generated.unwrap();
    for path in ["game/gui.rpy", "game/screens.rpy", "game/options.rpy"] {
        save(
            &mut service,
            path,
            &fs::read_to_string(scaffold.join(path)).unwrap(),
        );
    }
    copy_game(&scaffold.join("game/gui"), &root.join("game/gui"));
    create_story_variables(&mut service);
    let b = scene(&mut service, "Called scene");
    let c = scene(&mut service, "Nested called scene");
    let high = scene(&mut service, "High ending");
    let low = scene(&mut service, "Low ending");
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap()
        .clone();
    let label = |s: &Value| s["technicalLabel"].as_str().unwrap().to_owned();
    save(
        &mut service,
        c["sourcePath"].as_str().unwrap(),
        &format!("label {}:\n    \"C entry\"\n    return\n", label(&c)),
    );
    save(
        &mut service,
        b["sourcePath"].as_str().unwrap(),
        &format!(
            "label {}:\n    \"B entry\"\n    \"B resumed\"\n    return\n",
            label(&b)
        ),
    );
    save(
        &mut service,
        high["sourcePath"].as_str().unwrap(),
        &format!("label {}:\n    \"High ending\"\n    return\n", label(&high)),
    );
    save(
        &mut service,
        low["sourcePath"].as_str().unwrap(),
        &format!("label {}:\n    \"Low ending\"\n    return\n", label(&low)),
    );
    let source = condition_source(&label(&entry), &label(&high), &label(&low));
    let (accepted_before, produced) = edit_nested_dialogue(&mut service, &root, &entry_id, &source);
    let no_execution = process_spawn_count_for_test();
    let b_call = insert_call(&mut service, &root, &b["id"], &c, "B resumed");
    let entry_call = insert_call(&mut service, &root, &json!(entry_id), &b, "Caller resumed");
    assert_ne!(
        b_call["payload"]["returnLabel"],
        entry_call["payload"]["returnLabel"]
    );
    author_guarded_choice(&mut service, &root, &json!(entry_id));
    assert_eq!(
        process_spawn_count_for_test(),
        no_execution,
        "authored calls must execute zero SDK commands"
    );
    let accepted = ipc(&mut service, "scene.list", json!({}));
    let flow = ipc(&mut service, "flow.list", json!({}));
    for (scene_id, call, target, continuation) in [
        (&b["id"], &b_call, &c["id"], "B resumed"),
        (&json!(entry_id), &entry_call, &b["id"], "Caller resumed"),
    ] {
        let scene = accepted["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| &s["id"] == scene_id)
            .unwrap();
        let next = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == continuation)
            .unwrap();
        let edge = flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .find(|e| e["sceneId"] == *scene_id && e["beatId"] == call["id"] && e["kind"] == "call")
            .unwrap();
        assert_eq!(edge["destination"]["sceneId"], *target);
        assert_eq!(edge["returnLabel"], call["payload"]["returnLabel"]);
        assert_eq!(edge["continuation"]["beatId"], next["id"]);
    }
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(&mut service, "scene.list", json!({}));
    assert_eq!(
        reopened["scenes"], accepted["scenes"],
        "lossless accepted source/model reopen"
    );
    if let Some(path) = &evidence {
        fs::write(path.join("nested-before.rpy"), &accepted_before).unwrap();
        fs::write(path.join("nested-accepted.rpy"), &produced).unwrap();
        fs::write(
            path.join("calls-accepted-entry.rpy"),
            fs::read(root.join(entry["sourcePath"].as_str().unwrap())).unwrap(),
        )
        .unwrap();
        fs::write(
            path.join("calls-accepted-callee.rpy"),
            fs::read(root.join(b["sourcePath"].as_str().unwrap())).unwrap(),
        )
        .unwrap();
        fs::write(
            path.join("flow.json"),
            serde_json::to_vec_pretty(&flow).unwrap(),
        )
        .unwrap();
        fs::write(
            path.join("model.json"),
            serde_json::to_vec_pretty(&reopened).unwrap(),
        )
        .unwrap();
    }
    let without_metadata = temporary.path().join("metadata-free");
    copy_game(&root, &without_metadata);
    assert!(!without_metadata.join(".renpy-editor").exists());
    counts.metadata_absent = true;
    let mut reports = Vec::new();
    for (name, flag, trust, mood, expected, ending, reject) in [
        (
            "conditions-low",
            false,
            0_i64,
            "ready",
            "Low branch",
            "Low ending",
            false,
        ),
        (
            "conditions-high",
            true,
            5,
            "ready",
            "Edited deep café 雪",
            "High ending",
            false,
        ),
        (
            "conditions-boundary",
            true,
            4,
            "ready",
            "Boundary branch",
            "Low ending",
            false,
        ),
        (
            "no-option-fallthrough",
            true,
            -1,
            "blocked",
            "Other nested branch",
            "Nothing available",
            false,
        ),
        (
            "nested-call-return",
            true,
            5,
            "ready",
            "Edited deep café 雪",
            "High ending",
            false,
        ),
        (
            "reject-wrong-outcome",
            false,
            0,
            "ready",
            "Edited deep café 雪",
            "Low ending",
            true,
        ),
    ] {
        set_variable(&mut service, "flag", json!(flag));
        set_variable(&mut service, "trust", json!(trust.to_string()));
        set_variable(&mut service, "mood", json!(mood));
        let accepted_sources = sources(&root);
        for (relative, bytes) in &accepted_sources {
            fs::write(without_metadata.join(relative), bytes).unwrap();
        }
        let choice = if ending == "High ending" {
            "        click \"Ready route\"\n"
        } else if ending == "Low ending" {
            "        click \"Low route\"\n"
        } else {
            ""
        };
        let driver = format!("init -999 python:\n    import os\n    os.environ[\"SDL_AUDIODRIVER\"] = \"dummy\"\n\ntestsuite phase3a:\n    after testcase:\n        exit\n\n    testcase route:\n        assert screen \"main_menu\" timeout 10\n        click \"Start\"\n        assert {expected:?} timeout 10\n        assert eval (renpy.get_screen(\"say\").scope[\"what\"] == {expected:?}) timeout 10\n        assert eval (flag is {flag}) timeout 10\n        assert eval (trust == {trust} and precision == 9007199254740993 and mood == {mood:?}) timeout 10\n        $ phase3a_base_depth = renpy.call_stack_depth()\n        advance until \"B entry\"\n        assert \"B entry\" timeout 10\n        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 1) timeout 10\n        advance until \"C entry\"\n        assert \"C entry\" timeout 10\n        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 2) timeout 10\n        advance until \"B resumed\"\n        assert \"B resumed\" timeout 10\n        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 1) timeout 10\n        advance until \"Caller resumed\"\n        assert \"Caller resumed\" timeout 10\n        assert eval (renpy.call_stack_depth() == phase3a_base_depth and opaque_neighbor == \"kept\") timeout 10\n        advance\n{choice}        assert {ending:?} timeout 10\n        assert eval (renpy.get_screen(\"say\").scope[\"what\"] == {ending:?}) timeout 10\n        $ print(\"PHASE3A_ROUTE {name}\", flush=True)\n        advance until screen \"main_menu\"\n        exit\n", flag = if flag { "True" } else { "False" });
        fs::write(without_metadata.join("game/zz_phase3a_test.rpy"), &driver).unwrap();
        if let Some(path) = &evidence {
            fs::write(path.join(format!("{name}-driver.rpy")), &driver).unwrap();
            let digests = accepted_sources
                .iter()
                .map(|(relative, bytes)| {
                    (
                        relative.to_string_lossy().replace('\\', "/"),
                        format!("{:x}", Sha256::digest(bytes)),
                    )
                })
                .collect::<std::collections::BTreeMap<_, _>>();
            fs::write(
                path.join(format!("{name}-source-digests.json")),
                serde_json::to_vec_pretty(&digests).unwrap(),
            )
            .unwrap();
        }
        if counts.compile_commands == 0 {
            for operation in ["compile", "lint"] {
                if operation == "compile" {
                    counts.compile_commands += 1;
                } else {
                    counts.lint_commands += 1;
                }
                let mut argv = vec![command_path(&without_metadata), OsString::from(operation)];
                if operation == "lint" {
                    argv.push(OsString::from("--error-code"));
                }
                let result = run_bounded(
                    &sdk.root,
                    launcher_args(&sdk.root, &argv).unwrap(),
                    Duration::from_secs(60),
                )
                .unwrap();
                if let Some(path) = &evidence {
                    fs::write(path.join(format!("{operation}.log")), &result.output).unwrap();
                }
                assert!(
                    !result.timed_out && !result.output_limited && result.exit_code == Some(0),
                    "{operation}: {}",
                    result.output
                );
            }
        }
        counts.runtime_cases += 1;
        let result = run_bounded(
            &sdk.root,
            launcher_args(
                &sdk.root,
                &[
                    command_path(&without_metadata),
                    OsString::from("test"),
                    OsString::from("phase3a::route"),
                ],
            )
            .unwrap(),
            Duration::from_secs(60),
        )
        .unwrap();
        let marker = format!("PHASE3A_ROUTE {name}");
        let passed = !result.timed_out
            && !result.output_limited
            && if reject {
                result.exit_code.is_some_and(|code| code != 0)
                    && result.output.contains("FAILED")
                    && result
                        .output
                        .contains("AssertionError: assert \"Edited deep café 雪\" timeout 10")
                    && result.output.contains("bec \"Low branch\"")
                    && !result.output.contains(&marker)
            } else {
                result.exit_code == Some(0)
                    && result.output.contains("PASSED")
                    && result.output.contains(&marker)
            };
        let report = json!({"case": name, "passed": passed, "expectedRejection": reject, "exitCode": result.exit_code, "timedOut": result.timed_out, "outputLimited": result.output_limited});
        println!("phase-3a-sdk-case: {report}");
        reports.push(report);
        if let Some(path) = &evidence {
            fs::write(path.join(format!("{name}.log")), &result.output).unwrap();
            fs::write(
                path.join("cases.json"),
                serde_json::to_vec_pretty(&reports).unwrap(),
            )
            .unwrap();
        }
        for (relative, bytes) in &accepted_sources {
            assert_eq!(
                fs::read(without_metadata.join(relative)).unwrap(),
                *bytes,
                "SDK changed accepted source"
            );
        }
        assert_eq!(
            sources(&root),
            accepted_sources,
            "original editor project source changed during SDK execution"
        );
        if !passed {
            println!("{name}: {}", result.output);
        }
    }
    service.close().unwrap();
    counts.source_unchanged = true;
    counts.adapter_spawns = process_spawn_count_for_test() - adapter_start;
    assert_eq!(reports.len(), 6);
    assert!(
        reports.iter().all(|r| r["passed"] == true),
        "required SDK runtime case failed"
    );
}
