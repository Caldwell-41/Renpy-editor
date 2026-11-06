//! Shared accepted-source canvas capture. Only ignored qualification tests call it.
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;

pub(super) fn capture_cases(
    prefix: &str,
    outcome: &str,
    exporter: &[u8],
    asset_bytes: fn(&Value) -> Vec<u8>,
) {
    use base64::Engine;
    use std::path::PathBuf;
    let candidate = std::env::var(format!("{prefix}_CANDIDATE")).expect("reviewed candidate");
    let actual = std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .unwrap();
    assert!(actual.status.success());
    assert_eq!(String::from_utf8(actual.stdout).unwrap().trim(), candidate);
    let input =
        PathBuf::from(std::env::var_os(format!("{prefix}_INPUTS")).expect("accepted export"));
    let output =
        PathBuf::from(std::env::var_os(format!("{prefix}_HELPER_OUTPUT")).expect("fresh output"));
    fs::create_dir(&output).unwrap();
    let raw = fs::read(input.join("accepted.json")).unwrap();
    let accepted: Value = serde_json::from_slice(&raw).unwrap();
    assert_eq!(accepted["outcome"], outcome);
    assert_eq!(accepted["publicCoreRequests"], true);
    assert_eq!(
        accepted["exporterSourceSHA256"],
        hex::encode(Sha256::digest(exporter))
    );
    fs::write(output.join("accepted.json"), &raw).unwrap();
    let mut inputs = serde_json::Map::new();
    for (path, file) in accepted["files"].as_object().unwrap() {
        inputs.insert(path.clone(), file["sha256"].clone());
    }
    for asset in accepted["assets"].as_array().unwrap() {
        inputs.insert(
            asset["relativePath"].as_str().unwrap().into(),
            asset["sha256"].clone(),
        );
    }
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let before = crate::renpy::process_spawn_count_for_test();
    let starts_before = crate::screens::canvas_session::helper_start_attempts_for_test();
    let returns_before = crate::screens::canvas_session::helper_owner_returns_for_test();
    let mut service: Option<LifecycleService> = None;
    let mut records = vec![];
    let mut confirmed = std::collections::BTreeSet::new();
    let mut source_unchanged = false;
    let mut statuses = accepted["cases"]
        .as_array()
        .unwrap()
        .iter()
        .map(|case| json!({"request":case["request"],"status":"unrun"}))
        .collect::<Vec<_>>();
    let attempt = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        fs::write(output.join("launch-manifest.json"), serde_json::to_vec_pretty(&json!({"outcome":outcome,"plannedSDKProcesses":3,"plannedHiddenHelpers":1,"state":"before-install"})).unwrap()).unwrap();
        let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified archive");
        crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
            .unwrap();
        service = Some(LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap());
        let service = service.as_mut().unwrap();
        let root = profile.join("synthetic-project");
        restore_accepted(&root, &accepted, asset_bytes);
        service.open_path(&root).unwrap();
        for (index, case) in accepted["cases"].as_array().unwrap().iter().enumerate() {
            statuses[index]["status"] = json!("running");
            assert_eq!(
                ipc(service, "screens.canvasPlan", case["request"].clone()),
                case["plan"]
            );
            let starting = ipc(service, "screens.canvasRender", case["request"].clone());
            assert_eq!(
                crate::screens::canvas_session::helper_start_attempts_for_test() - starts_before,
                1,
                "Unexpected replacement remains charged; stop the campaign"
            );
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
            confirmed.insert(
                crate::screens::canvas_session::helper_start_attempts_for_test() - starts_before,
            );
            let width = case["request"]["width"].as_u64().unwrap();
            let height = case["request"]["height"].as_u64().unwrap();
            let id = case["id"].as_str().unwrap_or("normal");
            let screen = case["screen"].as_str().unwrap();
            let filename = format!("{screen}-{width}x{height}-{id}.png");
            let image = base64::engine::general_purpose::STANDARD
                .decode(
                    frame["image"]
                        .as_str()
                        .unwrap()
                        .strip_prefix("data:image/png;base64,")
                        .unwrap(),
                )
                .unwrap();
            fs::write(output.join(&filename), &image).unwrap();
            fs::write(
                output.join(format!("{width}x{height}-{id}.json")),
                serde_json::to_vec_pretty(&frame).unwrap(),
            )
            .unwrap();
            let root_start = &case["plan"]["nodes"][0]["start"];
            let geometry = frame["geometry"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|row| &row["start"] != root_start)
                .cloned()
                .collect::<Vec<_>>();
            records.push(json!({"screen":case["screen"],"id":case["id"],"aspect":[width,height],"state":case["plan"]["buttonState"],"filename":filename,
                "imageSHA256":hex::encode(Sha256::digest(&image)),"geometry":geometry,"inputs":inputs,"revision":frame["revision"],
                "viewportState":case["viewportState"],"guidesExcluded":true,"renderer":frame["renderer"],"physical":frame["diagnostics"]["physical"],"drawPerVirtual":frame["diagnostics"]["drawPerVirtual"]}));
            statuses[index]["status"] = json!("passed");
        }
        source_unchanged = inputs.iter().all(|(path, hash)| {
            hex::encode(Sha256::digest(fs::read(root.join(path)).unwrap()))
                == hash.as_str().unwrap()
        });
    }));
    if attempt.is_err() {
        for status in &mut statuses {
            if status["status"] == "running" {
                status["status"] = json!("failed");
            }
        }
        for directory in fs::read_dir(&profile)
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
            for name in [
                "log.txt",
                "traceback.txt",
                "render-refusal.txt",
                "startup-refusal.json",
                "result.json",
            ] {
                let source = directory.path().join(name);
                if source.is_file() {
                    let _ = fs::copy(source, output.join(format!("failure-{name}")));
                }
            }
        }
    }
    let closed = service
        .as_mut()
        .is_none_or(|service| service.close().is_ok());
    let shutdown = service
        .as_ref()
        .and_then(|service| service.canvas_shutdown_report())
        .cloned();
    let sdk = crate::renpy::process_spawn_count_for_test() - before;
    let starts = crate::screens::canvas_session::helper_start_attempts_for_test() - starts_before;
    let returns = crate::screens::canvas_session::helper_owner_returns_for_test() - returns_before;
    if starts > 0
        && starts == returns
        && shutdown
            .as_ref()
            .is_some_and(|shutdown| shutdown.exit_code.is_some())
    {
        confirmed.insert(starts);
    }
    let confirmed_count = confirmed.len();
    let cleaned = closed
        && confirmed_count == starts
        && shutdown.as_ref().is_some_and(|shutdown| {
            shutdown.cleanup_complete && shutdown.cooperative && shutdown.exit_code == Some(0)
        });
    let passed =
        attempt.is_ok() && source_unchanged && cleaned && sdk == 3 && starts == 1 && returns == 1;
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
    let result = json!({"outcome":outcome,"role":"hidden-helper","candidate":candidate,
        "target":if cfg!(target_os="macos") {"macos-arm64"} else {"windows-x64"},"acceptedSHA256":hex::encode(Sha256::digest(&raw)),
        "coreTestSHA256":hex::encode(Sha256::digest(fs::read(std::env::current_exe().unwrap()).unwrap())),
        "rendererSHA256":hex::encode(Sha256::digest(include_bytes!("canvas-renderer.rpy"))),"inputs":inputs,"sdkCliProcesses":sdk,
        "helperSessions":if confirmed_count==starts {json!(confirmed_count)} else {Value::Null},"helperStartAccounting":{"ownerStarts":starts,"ownerReturns":returns,"confirmed":confirmed_count,"charged":starts,"uncertain":confirmed_count!=starts},
        "failure":failure,"caseStatuses":statuses,"records":records,"shutdown":shutdown,"sourceUnchanged":source_unchanged,"cleanupComplete":cleaned,"passed":passed});
    fs::write(
        output.join("result.json"),
        serde_json::to_vec_pretty(&result).unwrap(),
    )
    .unwrap();
    if let Err(error) = attempt {
        std::panic::resume_unwind(error);
    }
    assert!(passed, "{result}");
}

/// Writes the accepted files and fixture assets after checking each recorded hash.
pub(crate) fn restore_accepted(
    root: &std::path::Path,
    accepted: &Value,
    asset_bytes: fn(&Value) -> Vec<u8>,
) {
    let files = accepted["files"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(path, file)| {
            (
                path.as_str(),
                file["text"].as_str().unwrap().as_bytes().to_vec(),
                &file["sha256"],
            )
        });
    let assets = accepted["assets"].as_array().unwrap().iter().map(|asset| {
        (
            asset["relativePath"].as_str().unwrap(),
            asset_bytes(asset),
            &asset["sha256"],
        )
    });
    for (path, bytes, sha256) in files.chain(assets) {
        assert_eq!(&hex::encode(Sha256::digest(&bytes)), sha256);
        let path = crate::transaction::RelativePath::new(path.to_owned()).unwrap();
        let destination = root.join(path.as_str());
        fs::create_dir_all(destination.parent().unwrap()).unwrap();
        fs::write(destination, bytes).unwrap();
    }
}
