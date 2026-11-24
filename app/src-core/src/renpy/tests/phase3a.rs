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
    saved_callee: bool,
    safe_edit_qualified: bool,
    loaded_return: bool,
    storage_isolated: bool,
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
            "acceptedSourceUnchanged": counts.source_unchanged,
            "savedCallee": counts.saved_callee, "safeEditQualified": counts.safe_edit_qualified,
            "loadedReturn": counts.loaded_return,
            "storageIsolated": counts.storage_isolated
        })
    );
    if let Err(error) = result {
        std::panic::resume_unwind(error);
    }
    assert!(cleanup, "owned game/profile/SDK/save cleanup failed");
}

fn source_editor_text(text: &str, has_bom: bool) -> &str {
    if let Some(editor) = text.strip_prefix('\u{feff}') {
        assert!(
            has_bom,
            "transport BOM must match the declared accepted BOM"
        );
        assert!(
            !editor.starts_with('\u{feff}'),
            "multiple transport BOMs must refuse"
        );
        editor
    } else {
        text
    }
}

fn save(service: &mut LifecycleService, path: &str, text: &str) {
    let opened = ipc(service, "source.open", json!({"path": path}));
    let has_bom = opened["hasBom"]
        .as_bool()
        .expect("declared Source BOM required");
    let editor = source_editor_text(text, has_bom);
    let draft = ipc(
        service,
        "source.updateDraft",
        json!({"path": path, "expectedBaseRevision": opened["baseRevision"], "text": editor, "selectionStart": 0, "selectionEnd": 0}),
    );
    let saved = ipc(
        service,
        "source.save",
        json!({"path": path, "expectedBaseRevision": draft["baseRevision"], "expectedDraftVersion": draft["draftVersion"]}),
    );
    assert_eq!(saved["hasBom"], has_bom);
    assert_eq!(
        saved["text"], editor,
        "Source Save preserves every editor body byte"
    );
}

fn scaffold_editor_text(text: &str) -> &str {
    // Imported SDK file encoding is independent of the destination editor's BOM.
    let editor = text.strip_prefix('\u{feff}').unwrap_or(text);
    assert!(
        !editor.starts_with('\u{feff}'),
        "multiple SDK scaffold BOMs must refuse"
    );
    editor
}

fn import_scaffold(
    service: &mut LifecycleService,
    root: &Path,
    evidence: Option<&Path>,
    path: &str,
    text: &str,
) {
    assert!(matches!(
        path,
        "game/gui.rpy" | "game/screens.rpy" | "game/options.rpy"
    ));
    let name = Path::new(path).file_name().unwrap();
    // Retain the actual imported bytes before any encoding assertion or Source write.
    if let Some(evidence) = evidence {
        let inputs = evidence.join("scaffold-inputs");
        fs::create_dir_all(&inputs).unwrap();
        fs::write(inputs.join(name), text.as_bytes()).unwrap();
    }
    let editor = scaffold_editor_text(text);
    let before = fs::read(root.join(path)).unwrap();
    let has_bom = before.starts_with(&[0xef, 0xbb, 0xbf]);
    save(service, path, editor);
    let after = fs::read(root.join(path)).unwrap();
    let mut expected = if has_bom {
        vec![0xef, 0xbb, 0xbf]
    } else {
        Vec::new()
    };
    expected.extend_from_slice(editor.as_bytes());
    assert_eq!(
        after, expected,
        "SDK import preserves destination BOM and every imported body byte"
    );
    if let Some(evidence) = evidence {
        let receipt = json!({"path":path,"operation":"source.save","destinationHasBom":has_bom,
            "importHasBom":text.starts_with('\u{feff}'),"importSHA256":format!("{:x}",Sha256::digest(text.as_bytes())),
            "beforeSHA256":format!("{:x}",Sha256::digest(&before)),"afterSHA256":format!("{:x}",Sha256::digest(&after)),
            "bodyBytesPreserved":true,"passed":true});
        fs::write(
            evidence
                .join("scaffold-inputs")
                .join(name)
                .with_extension("json"),
            serde_json::to_vec_pretty(&receipt).unwrap(),
        )
        .unwrap();
    }
}

/// The public Story example (lifecycle/story_example.rs), open, with the scenes and
/// Calls this gate plays. The routine preflight below opens the same project, so a
/// builder change that breaks the gate also breaks a routine test (docs/TESTING.md).
struct Phase3aExample {
    service: LifecycleService,
    root: PathBuf,
    entry: Value,
    b: Value,
    entry_call: Value,
    b_call: Value,
}

fn open_example(profile: &Path) -> Phase3aExample {
    let repository = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let mut service =
        LifecycleService::prepare_story_example_probe(profile.to_owned(), &repository).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let model = ipc(&mut service, "scene.list", json!({}));
    let scene = |name: &str| {
        model["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["displayName"] == name)
            .unwrap()
            .clone()
    };
    let call = |scene: &Value| {
        scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "call")
            .unwrap()
            .clone()
    };
    let (entry, b) = (scene("Platform"), scene("Called scene"));
    assert_eq!(entry["id"], model["entrySceneId"]);
    Phase3aExample {
        entry_call: call(&entry),
        b_call: call(&b),
        service,
        root,
        entry,
        b,
    }
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

fn runtime_driver(
    name: &str,
    flag: bool,
    trust: i64,
    mood: &str,
    expected: &str,
    ending: &str,
) -> String {
    let progression = if ending == "High ending" {
        "        advance until screen \"choice\"\n        assert screen \"choice\" timeout 10\n        click \"Ready route\"\n"
    } else if ending == "Low ending" {
        "        advance until screen \"choice\"\n        assert screen \"choice\" timeout 10\n        click \"Low route\"\n"
    } else {
        "        advance\n"
    };
    let save_step = if name == "conditions-high" {
        r#"        click "Save"
        assert screen "save" timeout 10
        run FileSave("phase3a-callee", slot=True, confirm=False)
        click "Return"
        assert "C entry" timeout 10
        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 2) timeout 10
        assert eval (renpy.can_load("phase3a-callee")) timeout 10
        assert eval (flag is True and trust == 5 and precision == 9007199254740993 and mood == "ready") timeout 10
        $ print("PHASE3A_SAVED " + __import__("json").dumps(dict(slot="phase3a-callee", canLoad=renpy.can_load("phase3a-callee"), baseDepth=phase3a_base_depth, calleeDepth=renpy.call_stack_depth(), flag=flag, trust=str(trust), precision=str(precision), mood=mood)), flush=True)
"#
    } else {
        ""
    };
    format!(
        r#"init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

testsuite phase3a:
    after testcase:
        exit

    testcase route:
        assert screen "main_menu" timeout 10
        click "Start"
        assert {expected:?} timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == {expected:?}) timeout 10
        assert eval (flag is {flag}) timeout 10
        assert eval (trust == {trust} and precision == 9007199254740993 and mood == {mood:?}) timeout 10
        $ phase3a_base_depth = renpy.call_stack_depth()
        advance until "B entry"
        assert "B entry" timeout 10
        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 1) timeout 10
        advance until "C entry"
        assert "C entry" timeout 10
        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 2) timeout 10
{save_step}        advance until "B resumed"
        assert "B resumed" timeout 10
        assert eval (renpy.call_stack_depth() == phase3a_base_depth + 1) timeout 10
        advance until "Caller resumed"
        assert "Caller resumed" timeout 10
        assert eval (renpy.call_stack_depth() == phase3a_base_depth and opaque_neighbor == "kept") timeout 10
{progression}        assert {ending:?} timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == {ending:?}) timeout 10
        $ print("PHASE3A_ROUTE {name}", flush=True)
        advance until screen "main_menu"
        exit
"#,
        flag = if flag { "True" } else { "False" }
    )
}

fn validated_save_receipt(output: &str) -> Value {
    let receipts = output
        .lines()
        .filter_map(|line| line.strip_prefix("PHASE3A_SAVED "))
        .map(|line| serde_json::from_str::<Value>(line).unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        receipts.len(),
        1,
        "one actual saved-callee receipt required"
    );
    let receipt = receipts.into_iter().next().unwrap();
    assert_eq!(receipt["slot"], "phase3a-callee");
    assert_eq!(receipt["canLoad"], true);
    assert_eq!(receipt["flag"], true);
    assert_eq!(receipt["trust"], "5");
    assert_eq!(receipt["precision"], "9007199254740993");
    assert_eq!(receipt["mood"], "ready");
    let base = receipt["baseDepth"]
        .as_u64()
        .expect("actual base depth required");
    assert_eq!(receipt["calleeDepth"].as_u64(), Some(base + 2));
    receipt
}

fn validated_load_receipt(output: &str, saved: &Value) -> Value {
    let receipts = output
        .lines()
        .filter_map(|line| line.strip_prefix("PHASE3A_LOADED "))
        .map(|line| serde_json::from_str::<Value>(line).unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        receipts.len(),
        1,
        "one actual loaded-return receipt required"
    );
    let loaded = receipts.into_iter().next().unwrap();
    for key in ["slot", "flag", "trust", "precision", "mood"] {
        assert_eq!(loaded[key], saved[key]);
    }
    assert_eq!(loaded["savedCalleeDepth"], saved["calleeDepth"]);
    assert_eq!(loaded["baseDepth"], saved["baseDepth"]);
    assert_eq!(loaded["returnedDepth"], saved["baseDepth"]);
    assert_eq!(loaded["editedContinuation"], "Caller safely edited");
    loaded
}

fn isolated_runtime_driver(driver: String, name: &str, saves: &Path, tokens: &Path) -> String {
    let boundary = "        assert screen \"main_menu\" timeout 10\n";
    assert_eq!(driver.matches(boundary).count(), 1);
    let saves = serde_json::to_string(&saves.to_string_lossy()).unwrap();
    let tokens = serde_json::to_string(&tokens.to_string_lossy()).unwrap();
    let checks = format!("{boundary}        assert eval (os.path.samefile(renpy.config.savedir, {saves})) timeout 10\n        assert eval (renpy.savetoken.token_dir is not None and os.path.samefile(renpy.savetoken.token_dir, {tokens})) timeout 10\n        $ print(\"PHASE3A_STORAGE \" + __import__(\"json\").dumps(dict(case={name:?}, savedirIsolated=True, tokensIsolated=True)), flush=True)\n");
    driver.replacen(boundary, &checks, 1)
}

fn retain_runtime_result(evidence: Option<&Path>, name: &str, result: &ProcessResult) {
    if let Some(path) = evidence {
        fs::write(path.join(format!("{name}.log")), &result.output).unwrap();
        let receipt = json!({"case":name,"exitCode":result.exit_code,"timedOut":result.timed_out,
            "outputLimited":result.output_limited,"outputSHA256":format!("{:x}",Sha256::digest(result.output.as_bytes()))});
        fs::write(
            path.join(format!("{name}-process.json")),
            serde_json::to_vec_pretty(&receipt).unwrap(),
        )
        .unwrap();
    }
}

fn sdk_setup<T>(stage: &str, result: Result<T, RenpyError>, evidence: Option<&Path>) -> T {
    match result {
        Ok(value) => value,
        Err(error) => {
            if let Some(path) = evidence {
                // Production setup APIs return typed errors, not their raw child output.
                let receipt = json!({"stage":stage,"error":format!("{error:?}"),"rawProcessOutputAvailable":false});
                fs::write(
                    path.join("setup-failure.json"),
                    serde_json::to_vec_pretty(&receipt).unwrap(),
                )
                .unwrap();
            }
            panic!("SDK setup {stage}: {error:?}")
        }
    }
}

fn saved_runtime_driver(receipt: &Value) -> String {
    // Literal expectations are validated before editing Source; never assign loaded state.
    let base = receipt["baseDepth"].as_u64().unwrap();
    let callee = receipt["calleeDepth"].as_u64().unwrap();
    let b = base + 1;
    format!(
        r#"init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

testsuite phase3a:
    after testcase:
        exit

    testcase route:
        assert screen "main_menu" timeout 10
        click "Load"
        assert screen "load" timeout 10
        assert eval (renpy.can_load("phase3a-callee")) timeout 10
        run FileLoad("phase3a-callee", slot=True, confirm=False)
        assert "C entry" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "C entry") timeout 10
        assert eval (flag is True and trust == 5 and precision == 9007199254740993 and mood == "ready") timeout 10
        assert eval (renpy.call_stack_depth() == {callee}) timeout 10
        advance until "B resumed"
        assert "B resumed" timeout 10
        assert eval (renpy.call_stack_depth() == {b}) timeout 10
        advance until "Caller safely edited"
        assert "Caller safely edited" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "Caller safely edited") timeout 10
        assert eval (renpy.call_stack_depth() == {base} and opaque_neighbor == "kept") timeout 10
        advance until screen "choice"
        assert screen "choice" timeout 10
        click "Ready route"
        assert "High ending" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "High ending") timeout 10
        $ print("PHASE3A_LOADED " + __import__("json").dumps(dict(slot="phase3a-callee", baseDepth={base}, savedCalleeDepth={callee}, returnedDepth=renpy.call_stack_depth(), flag=flag, trust=str(trust), precision=str(precision), mood=mood, editedContinuation="Caller safely edited")), flush=True)
        $ print("PHASE3A_ROUTE nested-call-return", flush=True)
        advance until screen "main_menu"
        exit
"#
    )
}

#[test]
fn phase3a_sdk_fixture_source_save_preserves_bom() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let before_spawns = process_spawn_count_for_test();
    let Phase3aExample {
        mut service,
        root,
        entry,
        b,
        entry_call,
        b_call,
    } = open_example(&profile);
    // Generated SDK files can carry a BOM while the destination has none.
    let before_imports = sources(&root);
    let mut expected_imports = before_imports.clone();
    let scaffold_evidence = temporary.path().join("scaffold-evidence");
    for (path, text) in [
        (
            "game/gui.rpy",
            "\u{feff}# synthetic SDK GUI café 雪\r\ndefine gui.text_size = 22\r\n",
        ),
        ("game/screens.rpy", "\u{feff}# synthetic SDK screens\n"),
        (
            "game/options.rpy",
            "# synthetic SDK options\ndefine config.name = \"fixture\"\n",
        ),
    ] {
        assert!(!before_imports[Path::new(path)].starts_with(&[0xef, 0xbb, 0xbf]));
        import_scaffold(&mut service, &root, Some(&scaffold_evidence), path, text);
        expected_imports.insert(
            PathBuf::from(path),
            scaffold_editor_text(text).as_bytes().to_vec(),
        );
        let opened = ipc(&mut service, "source.open", json!({"path":path}));
        assert_eq!(opened["hasBom"], false);
        assert_eq!(opened["text"], scaffold_editor_text(text));
        let name = Path::new(path).file_name().unwrap();
        let input = scaffold_evidence.join("scaffold-inputs").join(name);
        assert_eq!(fs::read(&input).unwrap(), text.as_bytes());
        let receipt: Value =
            serde_json::from_slice(&fs::read(input.with_extension("json")).unwrap()).unwrap();
        assert_eq!(receipt["path"], path);
        assert_eq!(receipt["destinationHasBom"], false);
        assert_eq!(receipt["importHasBom"], text.starts_with('\u{feff}'));
        assert_eq!(
            receipt["importSHA256"],
            format!("{:x}", Sha256::digest(text.as_bytes()))
        );
        assert_eq!(
            receipt["afterSHA256"],
            format!("{:x}", Sha256::digest(&expected_imports[Path::new(path)]))
        );
        assert_eq!(receipt["passed"], true);
    }
    assert_eq!(
        sources(&root),
        expected_imports,
        "scaffold import changes only the three exact bodies"
    );
    let invalid_evidence = temporary.path().join("invalid-scaffold-evidence");
    let invalid = "\u{feff}\u{feff}# invalid\n";
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| import_scaffold(
            &mut service,
            &root,
            Some(&invalid_evidence),
            "game/gui.rpy",
            invalid
        )))
        .is_err()
    );
    assert_eq!(
        fs::read(invalid_evidence.join("scaffold-inputs/gui.rpy")).unwrap(),
        invalid.as_bytes()
    );
    assert_eq!(
        sources(&root),
        expected_imports,
        "rejected multiple BOMs write nothing"
    );
    assert!(
        std::panic::catch_unwind(|| source_editor_text("\u{feff}# transport\n", false)).is_err()
    );
    assert!(
        std::panic::catch_unwind(|| source_editor_text("\u{feff}\u{feff}# transport\n", true))
            .is_err()
    );
    // Exercise the same BOM-bearing caller-save path as the final SDK load proof, with no SDK.
    let path = entry["sourcePath"].as_str().unwrap();
    let all_before = sources(&root);
    let before_caller = fs::read(root.join(path)).unwrap();
    assert!(before_caller.starts_with(&[0xef, 0xbb, 0xbf]));
    assert!(!before_caller[3..].starts_with(&[0xef, 0xbb, 0xbf]));
    let before_text = std::str::from_utf8(&before_caller).unwrap();
    assert_eq!(before_text.matches("\"Caller resumed\"").count(), 1);
    let expected = before_text.replacen("\"Caller resumed\"", "\"Caller safely edited\"", 1);
    save(&mut service, path, &expected);
    let after_caller = fs::read(root.join(path)).unwrap();
    assert_eq!(
        after_caller,
        expected.as_bytes(),
        "caller save changes only the qualified narration"
    );
    assert!(after_caller.starts_with(&[0xef, 0xbb, 0xbf]));
    assert!(!after_caller[3..].starts_with(&[0xef, 0xbb, 0xbf]));
    let labels = [
        &entry_call["payload"]["returnLabel"],
        &b_call["payload"]["returnLabel"],
    ];
    assert_ne!(labels[0], labels[1]);
    for (call, source_path) in [
        (&entry_call, path),
        (&b_call, b["sourcePath"].as_str().unwrap()),
    ] {
        let label = call["payload"]["returnLabel"].as_str().unwrap();
        let bytes = fs::read(root.join(source_path)).unwrap();
        assert_eq!(
            std::str::from_utf8(&bytes)
                .unwrap()
                .matches(&format!(" from {label}"))
                .count(),
            1
        );
    }
    let after_model = ipc(&mut service, "scene.list", json!({}));
    for call in [&entry_call, &b_call] {
        let current = after_model["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .flat_map(|scene| scene["beats"].as_array().unwrap())
            .find(|beat| beat["id"] == call["id"])
            .unwrap();
        assert_eq!(
            current["payload"]["returnLabel"],
            call["payload"]["returnLabel"]
        );
    }
    let all_after = sources(&root);
    let mut expected_sources = all_before;
    assert_eq!(
        expected_sources.insert(PathBuf::from(path), after_caller.clone()),
        Some(before_caller.clone())
    );
    assert_eq!(
        all_after, expected_sources,
        "caller save preserves the exact source file set and every other byte"
    );
    println!(
        "phase-3a-zero-sdk-bom-caller: {}",
        json!({"beforeSHA256":format!("{:x}",Sha256::digest(&before_caller)),"afterSHA256":format!("{:x}",Sha256::digest(&after_caller)),"entryReturnLabel":labels[0],"calleeReturnLabel":labels[1],"singleBomPreserved":true,"allOtherSourceBytesPreserved":true})
    );
    for (ending, expected_click) in [("High ending", "Ready route"), ("Low ending", "Low route")] {
        let driver = runtime_driver("preflight", true, 5, "ready", "Edited deep café 雪", ending);
        let progression = format!(
            "        advance until screen \"choice\"\n        assert screen \"choice\" timeout 10\n        click \"{expected_click}\"\n"
        );
        assert!(driver.contains(&progression));
        assert!(!driver.contains("\n        advance\n"));
        assert!(driver.contains("renpy.call_stack_depth() == phase3a_base_depth"));
        assert!(driver.contains("PHASE3A_ROUTE preflight"));
        assert!(driver.ends_with("        advance until screen \"main_menu\"\n        exit\n"));
    }
    let driver = runtime_driver(
        "preflight",
        true,
        -1,
        "blocked",
        "Other nested branch",
        "Nothing available",
    );
    assert!(driver.contains("\n        advance\n        assert \"Nothing available\" timeout 10\n"));
    assert!(!driver.contains("screen \"choice\""));
    let save_driver = runtime_driver(
        "conditions-high",
        true,
        5,
        "ready",
        "Edited deep café 雪",
        "High ending",
    );
    assert!(save_driver.contains("FileSave(\"phase3a-callee\", slot=True, confirm=False)"));
    assert!(save_driver.contains("renpy.can_load(\"phase3a-callee\")"));
    let receipt = validated_save_receipt("PHASE3A_SAVED {\"slot\":\"phase3a-callee\",\"canLoad\":true,\"baseDepth\":1,\"calleeDepth\":3,\"flag\":true,\"trust\":\"5\",\"precision\":\"9007199254740993\",\"mood\":\"ready\"}\n");
    let load_driver = saved_runtime_driver(&receipt);
    assert!(load_driver.contains("FileLoad(\"phase3a-callee\", slot=True, confirm=False)"));
    assert!(load_driver.contains("renpy.call_stack_depth() == 3"));
    assert!(load_driver.contains("Caller safely edited"));
    assert!(!load_driver.contains("click \"Start\""));
    assert!(!load_driver.contains("$ flag ="));
    let loaded = format!(
        "PHASE3A_LOADED {}\n",
        json!({"slot":"phase3a-callee","flag":true,
        "trust":"5","precision":"9007199254740993","mood":"ready","baseDepth":1,
        "savedCalleeDepth":3,"returnedDepth":1,"editedContinuation":"Caller safely edited"})
    );
    assert_eq!(
        validated_load_receipt(&loaded, &receipt)["returnedDepth"],
        1
    );
    for bad in [
        String::new(),
        format!("{loaded}{loaded}"),
        loaded.replace("\"returnedDepth\":1", "\"returnedDepth\":3"),
    ] {
        assert!(std::panic::catch_unwind(|| validated_load_receipt(&bad, &receipt)).is_err());
    }
    let diagnostics = temporary.path().join("receipt-failure-evidence");
    fs::create_dir(&diagnostics).unwrap();
    let result = ProcessResult {
        exit_code: Some(0),
        output: "completed SDK process; missing save receipt\n".into(),
        timed_out: false,
        output_limited: false,
        diagnostics: vec![],
    };
    retain_runtime_result(Some(&diagnostics), "conditions-high", &result);
    assert!(std::panic::catch_unwind(|| validated_save_receipt(&result.output)).is_err());
    assert_eq!(
        fs::read(diagnostics.join("conditions-high.log")).unwrap(),
        result.output.as_bytes()
    );
    assert!(diagnostics.join("conditions-high-process.json").exists());
    assert!(std::panic::catch_unwind(|| sdk_setup::<()>(
        "generation",
        Err(RenpyError::ProcessFailed),
        Some(&diagnostics)
    ))
    .is_err());
    let setup: Value =
        serde_json::from_slice(&fs::read(diagnostics.join("setup-failure.json")).unwrap()).unwrap();
    assert_eq!(setup["stage"], "generation");
    assert_eq!(setup["rawProcessOutputAvailable"], false);
    let isolated = isolated_runtime_driver(
        load_driver,
        "nested-call-return",
        &root.join("game/saves"),
        &temporary.path().join("Ren'Py Data/tokens"),
    );
    assert!(isolated.contains("os.path.samefile(renpy.config.savedir"));
    assert!(isolated.contains("renpy.savetoken.token_dir is not None"));
    assert!(isolated.contains("PHASE3A_STORAGE"));
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
    let sdk = sdk_setup("install/version", installed, evidence.as_deref());
    // Project creation's implicit starter compile/lint is qualified separately. Build
    // the public Story example through ordinary service IPC with zero execution, then
    // import standard GUI scaffolding once so this gate spends its only compile/lint on
    // the accepted example source.
    let profile = temporary.path().join("editor-profile");
    let no_execution = process_spawn_count_for_test();
    let Phase3aExample {
        mut service,
        root,
        entry,
        b,
        entry_call,
        b_call,
    } = open_example(&profile);
    assert_eq!(
        process_spawn_count_for_test(),
        no_execution,
        "building the example must execute zero SDK commands"
    );
    let scaffold = temporary.path().join("standard-gui");
    counts.gui_generations += 1;
    let gui_start = process_spawn_count_for_test();
    let generated = RenpyAdapter::generate_starter(&sdk, &scaffold, 1280, 720);
    counts.gui_image_commands = (process_spawn_count_for_test() - gui_start).saturating_sub(1);
    sdk_setup("GUI generation", generated, evidence.as_deref());
    for path in ["game/gui.rpy", "game/screens.rpy", "game/options.rpy"] {
        import_scaffold(
            &mut service,
            &root,
            evidence.as_deref(),
            path,
            &fs::read_to_string(scaffold.join(path)).unwrap(),
        );
    }
    copy_game(&scaffold.join("game/gui"), &root.join("game/gui"));
    let accepted = ipc(&mut service, "scene.list", json!({}));
    let flow = ipc(&mut service, "flow.list", json!({}));
    for (scene_id, call, target, continuation) in [
        (
            &b["id"],
            &b_call,
            &b_call["payload"]["sceneId"],
            "B resumed",
        ),
        (&entry["id"], &entry_call, &b["id"], "Caller resumed"),
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
    let mut saved_receipt: Option<Value> = None;
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
        if name == "nested-call-return" {
            assert!(
                counts.saved_callee,
                "saved-callee receipt must pass before Source edit"
            );
            let receipt = saved_receipt
                .as_ref()
                .expect("saved-callee receipt missing");
            assert_eq!(receipt["canLoad"], true);
            let relative = entry["sourcePath"].as_str().unwrap();
            let before = fs::read(root.join(relative)).unwrap();
            let before_sources = sources(&root);
            let before_text = std::str::from_utf8(&before).unwrap();
            assert_eq!(before_text.matches("\"Caller resumed\"").count(), 1);
            let expected =
                before_text.replacen("\"Caller resumed\"", "\"Caller safely edited\"", 1);
            save(&mut service, relative, &expected);
            let after = fs::read(root.join(relative)).unwrap();
            assert_eq!(
                after,
                expected.as_bytes(),
                "safe surrounding edit must touch only caller narration"
            );
            let mut expected_sources = before_sources;
            expected_sources.insert(PathBuf::from(relative), after.clone());
            assert_eq!(
                sources(&root),
                expected_sources,
                "safe caller edit preserves every other source file and byte"
            );
            assert!(after.starts_with(&[0xef, 0xbb, 0xbf]));
            for call in [&entry_call, &b_call] {
                let label = call["payload"]["returnLabel"].as_str().unwrap();
                let path = if std::ptr::eq(call, &entry_call) {
                    relative
                } else {
                    b["sourcePath"].as_str().unwrap()
                };
                assert!(fs::read_to_string(root.join(path))
                    .unwrap()
                    .contains(&format!(" from {label}")));
            }
            let edit = json!({"path":relative,"beforeSHA256":format!("{:x}",Sha256::digest(&before)),
                "afterSHA256":format!("{:x}",Sha256::digest(&after)),"replacementCount":1,
                "beforeText":"Caller resumed","afterText":"Caller safely edited",
                "entryReturnLabel":entry_call["payload"]["returnLabel"],"calleeReturnLabel":b_call["payload"]["returnLabel"],
                "bomPreserved":true,"allOtherBytesPreserved":true});
            println!("phase-3a-sdk-safe-edit: {edit}");
            if let Some(path) = &evidence {
                fs::write(path.join("safe-edited-entry.rpy"), &after).unwrap();
                fs::write(
                    path.join("safe-edit.json"),
                    serde_json::to_vec_pretty(&edit).unwrap(),
                )
                .unwrap();
            }
            counts.safe_edit_qualified = true;
        }
        let accepted_sources = sources(&root);
        for (relative, bytes) in &accepted_sources {
            fs::write(without_metadata.join(relative), bytes).unwrap();
        }
        let driver = if name == "nested-call-return" {
            saved_runtime_driver(
                saved_receipt
                    .as_ref()
                    .expect("saved-callee receipt missing"),
            )
        } else {
            runtime_driver(name, flag, trust, mood, expected, ending)
        };
        let driver = isolated_runtime_driver(
            driver,
            name,
            &without_metadata.join("game/saves"),
            &temporary.path().join("Ren'Py Data/tokens"),
        );
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
                    OsString::from("--savedir"),
                    command_path(&without_metadata.join("game/saves")),
                ],
            )
            .unwrap(),
            Duration::from_secs(60),
        )
        .unwrap();
        // Preserve diagnostics even if storage/save/load receipt validation then panics.
        retain_runtime_result(evidence.as_deref(), name, &result);
        let storage = result
            .output
            .lines()
            .filter_map(|line| line.strip_prefix("PHASE3A_STORAGE "))
            .map(|line| serde_json::from_str::<Value>(line).unwrap())
            .collect::<Vec<_>>();
        assert_eq!(storage.len(), 1, "one actual SDK storage witness required");
        let storage = &storage[0];
        assert_eq!(storage["case"], name);
        assert_eq!(storage["savedirIsolated"], true);
        assert_eq!(storage["tokensIsolated"], true);
        println!("phase-3a-sdk-storage: {storage}");
        if let Some(path) = &evidence {
            fs::write(
                path.join(format!("{name}-storage.json")),
                serde_json::to_vec_pretty(storage).unwrap(),
            )
            .unwrap();
        }
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
        if name == "conditions-high" && passed {
            let receipt = validated_save_receipt(&result.output);
            println!("phase-3a-sdk-save: {receipt}");
            if let Some(path) = &evidence {
                fs::write(
                    path.join("save-receipt.json"),
                    serde_json::to_vec_pretty(&receipt).unwrap(),
                )
                .unwrap();
            }
            saved_receipt = Some(receipt);
            counts.saved_callee = true;
        }
        if name == "nested-call-return" && passed {
            let loaded = validated_load_receipt(&result.output, saved_receipt.as_ref().unwrap());
            println!("phase-3a-sdk-load: {loaded}");
            if let Some(path) = &evidence {
                fs::write(
                    path.join("load-receipt.json"),
                    serde_json::to_vec_pretty(&loaded).unwrap(),
                )
                .unwrap();
            }
            counts.loaded_return = true;
        }
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
        let mut expected_runtime_sources = accepted_sources.clone();
        expected_runtime_sources.insert(
            PathBuf::from("game/zz_phase3a_test.rpy"),
            driver.as_bytes().to_vec(),
        );
        assert_eq!(
            sources(&without_metadata),
            expected_runtime_sources,
            "SDK must neither change accepted source nor add or remove an .rpy file"
        );
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
    counts.storage_isolated = true;
}
