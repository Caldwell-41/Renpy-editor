//! L18 public-core fixture admission. This selector never starts the SDK/helper.
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fs, path::PathBuf};

const PATH: &str = "game/ui/base_help_fidelity.rpy";
const SOURCE: &str =
    include_str!("../../../../tests/fixtures/phase-3b-screens/base-help-fidelity.rpy");
const FONT: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf");
const IMAGE: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png");

fn fixture() -> (tempfile::TempDir, LifecycleService, PathBuf, Vec<Value>) {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    service.open_path(&root).unwrap();
    let mut assets = vec![];
    for (name, kind, bytes, extension) in [
        ("base_help_font", "font", FONT, "ttf"),
        ("base_help_seal", "uiImage", IMAGE, "png"),
    ] {
        let chosen = temporary.path().join(format!("{name}.{extension}"));
        fs::write(&chosen, bytes).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let model = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,
            "kind":kind,"technicalName":name,"displayName":name}),
        );
        assets.push(
            model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["kind"] == kind)
                .unwrap()
                .clone(),
        );
    }
    fs::write(root.join(PATH), SOURCE).unwrap();
    (temporary, service, root, assets)
}

fn request(
    service: &mut LifecycleService,
    screen: &str,
    width: u32,
    height: u32,
    state: &str,
) -> Value {
    let doc = ipc(service, "screens.inspect", json!({"path":PATH}));
    json!({"path":PATH,"screenName":screen,"expectedRevision":doc["revision"],
        "width":width,"height":height,"buttonState":state})
}

#[test]
fn base_help_fidelity_exports_typed_assets_styles_and_exact_source_without_execution() {
    let (_temporary, mut service, root, assets) = fixture();
    let mut plans = vec![];
    for screen in ["base_help_fidelity", "base_help_anchors"] {
        for (width, height) in [(1280, 720), (1024, 768)] {
            for state in ["normal", "hover"] {
                let payload = request(&mut service, screen, width, height, state);
                let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
                assert_eq!(plan["available"], true, "{plan}");
                assert_eq!(plan["limits"], json!([]));
                assert_eq!(plan["nodes"].as_array().unwrap().len(), 7);
                let panel = &plan["nodes"][2]["properties"];
                if screen == "base_help_fidelity" {
                    assert_eq!(panel["padding"], json!([17, 23, 31, 29]));
                    assert_eq!(panel["xanchor"], 0.5);
                    assert_eq!(plan["nodes"][3]["properties"]["spacing"], 13);
                    assert_eq!(plan["nodes"][5]["properties"]["xsize"], 113);
                    assert_eq!(plan["nodes"][5]["properties"]["ysize"], 57);
                } else {
                    assert_eq!(panel["left_padding"], 11);
                    assert_eq!(panel["right_padding"], 27);
                    assert_eq!(panel["xanchor"], 250);
                    assert_eq!(panel["xpos"], 0.75);
                }
                let body = plan["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|n| n["kind"] == "text")
                    .unwrap();
                assert_eq!(body["properties"]["font"], "fonts/base_help_font.ttf");
                assert_eq!(
                    body["properties"]["size"],
                    if screen == "base_help_fidelity" {
                        25
                    } else {
                        22
                    }
                );
                assert_eq!(body["properties"]["color"], "#f1e3ce");
                let button = plan["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|n| n["kind"] == "textbutton")
                    .unwrap();
                assert_eq!(button["properties"]["text_hover_color"], "#fcf7eb");
                assert!(!plan.to_string().contains("Return"));
                plans.push(json!({"screen":screen,"request":payload,"plan":plan}));
            }
        }
    }
    let mut files = BTreeMap::new();
    fn read_sources(
        root: &std::path::Path,
        directory: &std::path::Path,
        files: &mut BTreeMap<String, Value>,
    ) {
        for entry in fs::read_dir(directory).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                read_sources(root, &path, files);
            } else if path.extension().is_some_and(|extension| extension == "rpy") {
                let bytes = fs::read(&path).unwrap();
                files.insert(path.strip_prefix(root).unwrap().to_str().unwrap().replace('\\', "/"),
                    json!({"text":std::str::from_utf8(&bytes).unwrap(),"sha256":hex::encode(Sha256::digest(&bytes))}));
            }
        }
    }
    read_sources(&root, &root.join("game"), &mut files);
    for path in [
        PATH,
        ".renpy-editor/project.json",
        ".renpy-editor/source-map.json",
        ".renpy-editor/authoring.json",
    ] {
        let bytes = fs::read(root.join(path)).unwrap();
        files.insert(path.to_owned(), json!({"text":std::str::from_utf8(&bytes).unwrap(),"sha256":hex::encode(Sha256::digest(&bytes))}));
    }
    let map: Value =
        serde_json::from_slice(&fs::read(root.join(".renpy-editor/source-map.json")).unwrap())
            .unwrap();
    assert_eq!(map["schemaVersion"], 8);
    for asset in &assets {
        let bytes = fs::read(root.join(asset["relativePath"].as_str().unwrap())).unwrap();
        assert_eq!(hex::encode(Sha256::digest(&bytes)), asset["sha256"]);
    }
    assert_eq!(fs::read(root.join(PATH)).unwrap(), SOURCE.as_bytes());
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = request(&mut service, "base_help_fidelity", 1280, 720, "normal");
    assert_eq!(
        ipc(&mut service, "screens.canvasPlan", reopened),
        plans[0]["plan"]
    );
    service.close().unwrap();
    let accepted = json!({"outcome":"L18-base-help-fidelity","publicCoreRequests":true,
        "exporterSourceSHA256":hex::encode(Sha256::digest(include_bytes!("base_help_canvas_tests.rs"))),
        "sourceMapSchemaVersion":8,"files":files,"assets":assets,"cases":plans});
    if let Some(output) = std::env::var_os("LOOMLIGHT_BASE_HELP_INPUTS") {
        let output = PathBuf::from(output);
        fs::create_dir(&output).unwrap();
        fs::write(
            output.join("accepted.json"),
            serde_json::to_vec_pretty(&accepted).unwrap(),
        )
        .unwrap();
    }
}

fn helper_start_accounting(attempts: usize, owner_returns: usize, confirmed: usize) -> Value {
    json!({"ownerStarts":attempts,"ownerReturns":owner_returns,"confirmed":confirmed,
        "unconfirmed":attempts.saturating_sub(confirmed),"uncertain":attempts > confirmed,"charged":attempts})
}

#[test]
#[ignore = "L18 selected proof: three SDK validation/discovery processes and one hidden helper"]
fn base_help_fidelity_hidden_helper_captures_exact_exported_cases() {
    use base64::Engine;
    let expected_candidate =
        std::env::var("LOOMLIGHT_BASE_HELP_CANDIDATE").expect("reviewed candidate");
    let candidate = std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .unwrap();
    assert!(candidate.status.success());
    assert_eq!(
        std::str::from_utf8(&candidate.stdout).unwrap().trim(),
        expected_candidate
    );
    let cli_before = crate::renpy::process_spawn_count_for_test();
    let helpers_before = super::super::canvas_session::helper_start_attempts_for_test();
    let returns_before = super::super::canvas_session::helper_owner_returns_for_test();
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let input = PathBuf::from(
        std::env::var_os("LOOMLIGHT_BASE_HELP_INPUTS").expect("reviewed public-core export"),
    );
    let accepted_bytes = fs::read(input.join("accepted.json")).unwrap();
    let accepted: Value = serde_json::from_slice(&accepted_bytes).unwrap();
    assert_eq!(accepted["outcome"], "L18-base-help-fidelity");
    assert_eq!(accepted["publicCoreRequests"], true);
    assert_eq!(accepted["sourceMapSchemaVersion"], 8);
    assert_eq!(
        accepted["exporterSourceSHA256"],
        hex::encode(Sha256::digest(include_bytes!("base_help_canvas_tests.rs")))
    );
    assert_eq!(accepted["files"][PATH]["text"], SOURCE);
    let output = PathBuf::from(
        std::env::var_os("LOOMLIGHT_BASE_HELP_HELPER_OUTPUT").expect("fresh helper output"),
    );
    fs::create_dir(&output).unwrap();
    fs::write(output.join("accepted.json"), &accepted_bytes).unwrap();
    fs::write(output.join("launch-manifest.json"), b"{\"outcome\":\"L18-base-help-fidelity\",\"plannedSdkCliProcesses\":3,\"plannedHiddenHelpers\":1,\"state\":\"before-install\"}").unwrap();
    let mut service_slot: Option<LifecycleService> = None;
    let mut input_hashes = serde_json::Map::new();
    input_hashes.insert(PATH.into(), accepted["files"][PATH]["sha256"].clone());
    for asset in accepted["assets"].as_array().unwrap() {
        input_hashes.insert(
            asset["relativePath"].as_str().unwrap().into(),
            asset["sha256"].clone(),
        );
    }
    let mut records = vec![];
    let mut active_case = None;
    let mut helper_requested = false;
    let mut confirmed_helpers = std::collections::BTreeSet::new();
    let mut source_unchanged = false;
    let mut case_statuses = accepted["cases"]
        .as_array()
        .unwrap()
        .iter()
        .map(|case| json!({"screen":case["screen"],"request":case["request"],"status":"unrun"}))
        .collect::<Vec<_>>();
    let attempt = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        assert_ne!(
            std::env::var("LOOMLIGHT_BASE_HELP_OFFLINE_REFUSAL").as_deref(),
            Ok("before-install"),
            "Controlled offline refusal before any SDK or helper start"
        );
        let archive =
            std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified official archive");
        crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
            .unwrap();
        service_slot =
            Some(LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap());
        let service = service_slot.as_mut().unwrap();
        let root = profile.join("synthetic-project");
        // Reuse the exact accepted metadata and source, including typed asset IDs.
        for (path, file) in accepted["files"].as_object().unwrap() {
            let relative = crate::transaction::RelativePath::new(path.clone()).unwrap();
            let bytes = file["text"].as_str().unwrap().as_bytes();
            assert_eq!(hex::encode(Sha256::digest(bytes)), file["sha256"]);
            let destination = root.join(relative.as_str());
            fs::create_dir_all(destination.parent().unwrap()).unwrap();
            fs::write(destination, bytes).unwrap();
        }
        for (kind, bytes) in [("font", FONT), ("uiImage", IMAGE)] {
            let asset = accepted["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["kind"] == kind)
                .unwrap();
            assert_eq!(hex::encode(Sha256::digest(bytes)), asset["sha256"]);
            let relative = crate::transaction::RelativePath::new(
                asset["relativePath"].as_str().unwrap().to_owned(),
            )
            .unwrap();
            let destination = root.join(relative.as_str());
            fs::create_dir_all(destination.parent().unwrap()).unwrap();
            fs::write(destination, bytes).unwrap();
        }
        service.open_path(&root).unwrap();
        for case in accepted["cases"].as_array().unwrap() {
            let request = case["request"].clone();
            active_case = Some(records.len());
            case_statuses[records.len()]["status"] = json!("running");
            let name = format!(
                "{}-{}x{}-{}",
                case["screen"].as_str().unwrap(),
                request["width"],
                request["height"],
                request["buttonState"].as_str().unwrap()
            );
            assert_eq!(
                ipc(service, "screens.canvasPlan", request.clone()),
                case["plan"]
            );
            helper_requested = true;
            let starting = ipc(service, "screens.canvasRender", request.clone());
            assert_eq!(starting["phase"], "starting", "{starting}");
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
            let frame = loop {
                let frame = ipc(
                    service,
                    "screens.canvasStatus",
                    json!({"frameId":starting["frameId"]}),
                );
                if frame["phase"] == "ready" {
                    break frame;
                }
                assert!(
                    frame["phase"] == "starting" && std::time::Instant::now() < deadline,
                    "{frame}"
                );
                std::thread::sleep(std::time::Duration::from_millis(16));
            };
            confirmed_helpers.insert(
                super::super::canvas_session::helper_start_attempts_for_test() - helpers_before,
            );
            let image = base64::engine::general_purpose::STANDARD
                .decode(
                    frame["image"]
                        .as_str()
                        .unwrap()
                        .strip_prefix("data:image/png;base64,")
                        .unwrap(),
                )
                .unwrap();
            let filename = format!("{name}.png");
            fs::write(output.join(&filename), &image).unwrap();
            fs::write(
                output.join(format!("{name}.json")),
                serde_json::to_vec_pretty(&frame).unwrap(),
            )
            .unwrap();
            let starts = case["plan"]["nodes"].as_array().unwrap()[2..]
                .iter()
                .map(|n| n["start"].clone())
                .collect::<Vec<_>>();
            let geometry = frame["geometry"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|b| starts.contains(&b["start"]))
                .cloned()
                .collect::<Vec<_>>();
            case_statuses[records.len()]["status"] = json!("passed");
            records.push(json!({"screen":case["screen"],"aspect":[request["width"],request["height"]],"state":request["buttonState"],
            "filename":filename,"imageSHA256":hex::encode(Sha256::digest(&image)),"geometry":geometry,"inputs":input_hashes,
            "revision":frame["revision"],"guidesExcluded":true,"renderer":frame["renderer"],
            "physical":frame["diagnostics"]["physical"],"drawPerVirtual":frame["diagnostics"]["drawPerVirtual"]}));
            active_case = None;
        }
        source_unchanged = accepted["files"].as_object().unwrap().iter().all(|(p, f)| {
            fs::read(root.join(p)).unwrap() == f["text"].as_str().unwrap().as_bytes()
        });
    }));
    if attempt.is_err() {
        if let Some(index) = active_case {
            case_statuses[index]["status"] = json!("failed");
        }
        // Preserve raw producer diagnostics before the shared close removes its root.
        for entry in fs::read_dir(&profile)
            .into_iter()
            .flatten()
            .flatten()
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with("canvas-helper-")
            })
        {
            for filename in [
                "log.txt",
                "traceback.txt",
                "startup-refusal.json",
                "render-refusal.txt",
                "result.json",
            ] {
                let source = entry.path().join(filename);
                if source.is_file() {
                    let _ = fs::copy(source, output.join(format!("failure-{filename}")));
                }
            }
        }
    }
    let closed = service_slot
        .as_mut()
        .is_none_or(|service| service.close().is_ok());
    let shutdown = service_slot
        .as_ref()
        .and_then(|service| service.canvas_shutdown_report())
        .cloned();
    let failure = attempt.as_ref().err().map(|error| {
        error
            .downcast_ref::<String>()
            .cloned()
            .or_else(|| {
                error
                    .downcast_ref::<&str>()
                    .map(|message| message.to_string())
            })
            .unwrap_or_else(|| "Producer panicked; inspect retained output.".into())
    });
    let sdk_cli_processes = crate::renpy::process_spawn_count_for_test() - cli_before;
    let helper_attempts =
        super::super::canvas_session::helper_start_attempts_for_test() - helpers_before;
    let owner_returns =
        super::super::canvas_session::helper_owner_returns_for_test() - returns_before;
    // A previous owner's shutdown receipt cannot confirm a replacement whose
    // constructor failed. Such an attempt remains reserved as uncertain.
    if helper_attempts == owner_returns
        && shutdown
            .as_ref()
            .is_some_and(|report| report.exit_code.is_some())
    {
        confirmed_helpers.insert(helper_attempts);
    }
    let confirmed = confirmed_helpers.len();
    let mut accounting = helper_start_accounting(helper_attempts, owner_returns, confirmed);
    accounting["requested"] = json!(helper_requested);
    let candidate = std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .unwrap();
    let result = json!({"outcome":"L18-base-help-fidelity","role":"hidden-helper","target":if cfg!(target_os="macos") {"macos-arm64"} else {"windows-x64"},
        "coreTestSHA256":hex::encode(Sha256::digest(fs::read(std::env::current_exe().unwrap()).unwrap())),
        "candidate":std::str::from_utf8(&candidate.stdout).unwrap().trim(),"acceptedSHA256":hex::encode(Sha256::digest(&accepted_bytes)),
        "inputs":input_hashes,"rendererSHA256":hex::encode(Sha256::digest(include_bytes!("canvas-renderer.rpy"))),
        "sdkCliProcesses":sdk_cli_processes,"helperSessions":if confirmed == helper_attempts {json!(confirmed)} else {Value::Null},
        "helperStartAccounting":accounting,
        "failure":failure,"caseStatuses":case_statuses,"records":records,"shutdown":shutdown,
        "cleanupComplete":closed && helper_attempts == confirmed && shutdown.as_ref().is_none_or(|s| s.cleanup_complete),"sourceUnchanged":source_unchanged,
        "passed":attempt.is_ok() && source_unchanged && closed && shutdown.as_ref().is_some_and(|s| s.cleanup_complete && s.cooperative && s.exit_code==Some(0)) && sdk_cli_processes==3 && helper_attempts==1 && owner_returns==1 && confirmed==1});
    fs::write(
        output.join("result.json"),
        serde_json::to_vec_pretty(&result).unwrap(),
    )
    .unwrap();
    if let Err(error) = attempt {
        std::panic::resume_unwind(error);
    }
    assert_eq!(result["passed"], true, "{result}");
}

#[test]
fn added_textbutton_draft_matches_the_saved_null_action_button_without_execution() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"base_help_add",
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = &created["owned"][0];
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let parent = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == owner["rootId"])
        .unwrap();
    let before = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let request = json!({"path":owner["path"],"screenName":"base_help_add","expectedRevision":document["revision"],"width":1280,"height":720});
    let mut provisional = request.clone();
    provisional["addition"] =
        json!({"parentStart":parent["span"]["start"],"kind":"textbutton","text":"Continue"});
    let draft = ipc(&mut service, "screens.canvasPlan", provisional);
    assert_eq!(draft["available"], true, "{draft}");
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    let saved = ipc(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":document["revision"],
        "command":{"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Continue"}}),
    );
    let mut accepted_request = request;
    accepted_request["expectedRevision"] = saved["document"]["revision"].clone();
    let accepted = ipc(&mut service, "screens.canvasPlan", accepted_request);
    assert_eq!(accepted["available"], true, "{accepted}");
    let pending_button = draft["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "textbutton")
        .unwrap();
    let saved_button = accepted["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "textbutton")
        .unwrap();
    for field in ["kind", "literal", "properties"] {
        assert_eq!(pending_button[field], saved_button[field], "{field}");
    }
    assert!(saved_button["properties"].get("action").is_none());
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}));
    let text = source["text"].as_str().unwrap();
    assert!(
        text.contains("textbutton \"Continue\": # loomlight-element:"),
        "{text}"
    );
    assert!(text.contains("action Null()"), "{text}");
    service.close().unwrap();
}

#[test]
fn helper_accounting_reserves_failed_initial_and_replacement_owner_attempts_offline() {
    use super::super::canvas_session::{
        helper_owner_returns_for_test, helper_start_attempts_for_test, record_helper_start_for_test,
    };
    let attempts = helper_start_attempts_for_test();
    let returns = helper_owner_returns_for_test();
    assert!(record_helper_start_for_test(|| Err::<(), _>(
        crate::scene::SceneError::InvariantBlocked
    ))
    .is_err());
    let initial = helper_start_accounting(
        helper_start_attempts_for_test() - attempts,
        helper_owner_returns_for_test() - returns,
        0,
    );
    assert_eq!(initial["charged"], 1);
    assert_eq!(initial["ownerReturns"], 0);
    assert_eq!(initial["unconfirmed"], 1);
    assert_eq!(initial["uncertain"], true);

    let attempts = helper_start_attempts_for_test();
    let returns = helper_owner_returns_for_test();
    record_helper_start_for_test(|| Ok::<_, crate::scene::SceneError>(())).unwrap();
    assert!(record_helper_start_for_test(|| Err::<(), _>(
        crate::scene::SceneError::InvariantBlocked
    ))
    .is_err());
    // The first owner's ready receipt is a qualification fixture; the second
    // owner fails without starting an SDK or any child process in this test.
    let replacement = helper_start_accounting(
        helper_start_attempts_for_test() - attempts,
        helper_owner_returns_for_test() - returns,
        1,
    );
    assert_eq!(replacement["charged"], 2);
    assert_eq!(replacement["ownerReturns"], 1);
    assert_eq!(replacement["confirmed"], 1);
    assert_eq!(replacement["unconfirmed"], 1);
    assert_eq!(replacement["uncertain"], true);
}
