//! Reserved helper proof against a retained, hash-admitted public-core export.
use super::*;
use base64::Engine;

#[test]
#[ignore = "selected controls proof; three SDK validation processes and one hidden helper"]
fn accepted_controls_render_all_states_with_one_helper() {
    let input = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_SCREEN_CONTROLS_HELPER_INPUT").expect("admitted source export"),
    );
    let output = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_SCREEN_CONTROLS_HELPER_OUTPUT").expect("fresh output"),
    );
    let expected_hash = std::env::var("LOOMLIGHT_SCREEN_CONTROLS_MANIFEST_SHA256").unwrap();
    let candidate = std::env::var("LOOMLIGHT_SCREEN_CONTROLS_CANDIDATE").unwrap();
    assert_eq!(candidate.len(), 40);
    fs::create_dir(&output).unwrap();
    let raw = fs::read(input.join("manifest.json")).unwrap();
    assert_eq!(hex::encode(Sha256::digest(&raw)), expected_hash);
    let manifest: Value = serde_json::from_slice(&raw).unwrap();
    assert_eq!(manifest["schemaVersion"], 1);
    assert_eq!(manifest["publicCoreRequests"], true);
    assert_eq!(manifest["engineStarted"], false);
    assert_eq!(manifest["sdkVersion"], "8.5.3");
    assert_eq!(manifest["canvas"].as_array().unwrap().len(), 12);
    fs::write(output.join("manifest.json"), &raw).unwrap();
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let sdk_before = crate::renpy::process_spawn_count_for_test();
    let starts_before = crate::screens::canvas_session::helper_start_attempts_for_test();
    let returns_before = crate::screens::canvas_session::helper_owner_returns_for_test();
    let mut service: Option<LifecycleService> = None;
    let mut inputs = serde_json::Map::new();
    let mut records = Vec::new();
    let mut source_unchanged = false;
    let attempt = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        fs::write(
            output.join("launch-manifest.json"),
            b"{\"state\":\"before-install\",\"sdkValidationProcesses\":3,\"helperSessions\":1}",
        )
        .unwrap();
        let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified archive");
        crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
            .unwrap();
        service = Some(LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap());
        let root = profile.join("synthetic-project");
        let original_game = root.join("game");
        // Only the new, owned disposable fixture is replaced by the admitted export.
        assert_eq!(
            original_game.canonicalize().unwrap(),
            temporary
                .path()
                .canonicalize()
                .unwrap()
                .join("profile/synthetic-project/game")
        );
        fs::remove_dir_all(&original_game).unwrap();
        for file in manifest["files"].as_array().unwrap() {
            let path = file["path"].as_str().unwrap();
            let relative = crate::transaction::RelativePath::new(path.to_owned()).unwrap();
            assert!(relative.as_str().starts_with("game/"));
            let bytes = fs::read(input.join(relative.as_str())).unwrap();
            let hash = hex::encode(Sha256::digest(&bytes));
            assert_eq!(hash, file["sha256"]);
            assert_eq!(bytes.len() as u64, file["bytes"].as_u64().unwrap());
            let target = root.join(relative.as_str());
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::write(target, bytes).unwrap();
            inputs.insert(path.to_owned(), json!(hash));
        }
        for (key, name) in [
            ("project", "project.json"),
            ("sourceMap", "source-map.json"),
            ("authoring", "authoring.json"),
        ] {
            let bytes = fs::read(input.join(name)).unwrap();
            assert_eq!(
                serde_json::from_slice::<Value>(&bytes).unwrap(),
                manifest["sidecars"][key]
            );
            let relative = format!(".renpy-editor/{name}");
            fs::write(root.join(&relative), &bytes).unwrap();
            inputs.insert(relative, json!(hex::encode(Sha256::digest(bytes))));
        }
        let service = service.as_mut().unwrap();
        service.open_path(&root).unwrap();
        for (index, case) in manifest["canvas"].as_array().unwrap().iter().enumerate() {
            assert_eq!(
                ipc(service, "screens.canvasPlan", case["request"].clone()),
                case["plan"]
            );
            let starting = ipc(service, "screens.canvasRender", case["request"].clone());
            assert_eq!(starting["phase"], "starting", "{starting}");
            assert_eq!(
                crate::screens::canvas_session::helper_start_attempts_for_test() - starts_before,
                1
            );
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(60);
            let frame = loop {
                let frame = ipc(
                    service,
                    "screens.canvasStatus",
                    json!({"frameId":starting["frameId"]}),
                );
                if frame["phase"] == "ready" {
                    break frame;
                }
                assert_eq!(frame["phase"], "starting", "{frame}");
                assert!(std::time::Instant::now() < deadline, "{frame}");
                std::thread::sleep(std::time::Duration::from_millis(16));
            };
            let filename = format!("control-frame-{index}.png");
            let png = base64::engine::general_purpose::STANDARD
                .decode(
                    frame["image"]
                        .as_str()
                        .unwrap()
                        .strip_prefix("data:image/png;base64,")
                        .unwrap(),
                )
                .unwrap();
            fs::write(output.join(&filename), &png).unwrap();
            let mut metadata = frame.clone();
            metadata.as_object_mut().unwrap().remove("image");
            records.push(json!({"request":case["request"],"filename":filename,"sha256":hex::encode(Sha256::digest(png)),"frame":metadata}));
        }
        source_unchanged = inputs.iter().all(|(path, hash)| {
            hex::encode(Sha256::digest(fs::read(root.join(path)).unwrap()))
                == hash.as_str().unwrap()
        });
    }));
    if attempt.is_err() {
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
    let sdk = crate::renpy::process_spawn_count_for_test() - sdk_before;
    let starts = crate::screens::canvas_session::helper_start_attempts_for_test() - starts_before;
    let returns = crate::screens::canvas_session::helper_owner_returns_for_test() - returns_before;
    let cleaned = closed
        && shutdown.as_ref().is_some_and(|report| {
            report.cleanup_complete && report.cooperative && report.exit_code == Some(0)
        });
    let passed = attempt.is_ok()
        && source_unchanged
        && cleaned
        && sdk == 3
        && starts == 1
        && returns == 1
        && records.len() == 12;
    let result = json!({"passed":passed,"candidate":candidate,"manifestSHA256":expected_hash,"coreTestSHA256":hex::encode(Sha256::digest(fs::read(std::env::current_exe().unwrap()).unwrap())),"rendererSHA256":hex::encode(Sha256::digest(include_bytes!("canvas-renderer.rpy"))),"sdkValidationProcesses":sdk,"helperStarts":starts,"helperReturns":returns,"sourceUnchanged":source_unchanged,"cleanupComplete":cleaned,"shutdown":shutdown,"inputs":inputs,"records":records});
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
