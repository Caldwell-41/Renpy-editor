use super::*;

#[test]
#[ignore = "L04 selected pinned-SDK helper proof; one helper/SDK launch"]
fn nested_helper_qualifies_grid_and_clipped_selection_at_both_aspects() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified official archive");
    crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
        .unwrap();
    let inputs = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_NESTED_INPUTS").expect("public-core accepted inputs"),
    );
    let accepted: Value =
        serde_json::from_slice(&fs::read(inputs.join("accepted.json")).unwrap()).unwrap();
    let source = accepted["source"].as_str().unwrap();
    assert_eq!(
        hex::encode(Sha256::digest(source.as_bytes())),
        accepted["sha256"]
    );
    assert_eq!(accepted["publicCoreRequests"], true);
    let output = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_NESTED_HELPER_EVIDENCE").expect("fresh helper evidence path"),
    );
    fs::create_dir_all(&output).unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), source).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let nodes = doc["screens"][0]["nodes"].as_array().unwrap();
    let viewport = nodes.iter().find(|n| n["kind"] == "viewport").unwrap();
    let overflow = nodes
        .iter()
        .find(|n| {
            n["numericLayout"]["values"]["xsize"]["value"].as_f64() == Some(300.0)
                && n["kind"] == "frame"
        })
        .unwrap();
    let hidden = nodes
        .iter()
        .find(|n| n["literal"] == "Hidden below opening")
        .unwrap();
    let mut records = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        for opening in [100, 200] {
            let response = ipc(
                &mut service,
                "screens.canvasRender",
                json!({"path":PATH,"screenName":"notes","expectedRevision":doc["revision"],"width":width,"height":height,
                "layouts":if opening==200 {json!([{"nodeStart":viewport["span"]["start"],"values":{"ysize":{"unit":"pixels","value":200}}}])} else {json!([])}}),
            );
            assert_eq!(response["phase"], "starting", "{response}");
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
            let frame = loop {
                let frame = ipc(
                    &mut service,
                    "screens.canvasStatus",
                    json!({"frameId":response["frameId"]}),
                );
                if frame["phase"] == "ready" {
                    break frame;
                }
                if frame["phase"] != "starting" || std::time::Instant::now() >= deadline {
                    for entry in profile.read_dir().unwrap().flatten().filter(|e| {
                        e.file_name()
                            .to_string_lossy()
                            .starts_with("canvas-helper-")
                    }) {
                        for name in ["log.txt", "traceback.txt", "startup-refusal.json"] {
                            if entry.path().join(name).is_file() {
                                fs::copy(entry.path().join(name), output.join(name)).unwrap();
                            }
                        }
                    }
                    panic!("Helper did not produce a qualified frame: {frame}");
                }
                std::thread::sleep(std::time::Duration::from_millis(16));
            };
            fs::write(
                output.join(format!("helper-{width}x{height}-opening-{opening}.json")),
                serde_json::to_vec_pretty(&frame).unwrap(),
            )
            .unwrap();
            let geometry = frame["geometry"].as_array().unwrap();
            let clipped = geometry
                .iter()
                .find(|g| g["start"] == overflow["span"]["start"])
                .unwrap();
            assert_eq!(
                [
                    clipped["x"].as_f64().unwrap(),
                    clipped["y"].as_f64().unwrap(),
                    clipped["width"].as_f64().unwrap(),
                    clipped["height"].as_f64().unwrap()
                ],
                [
                    (width / 2 - 100) as f64,
                    (height / 2 - 144) as f64,
                    180.0,
                    opening as f64
                ]
            );
            assert_eq!(
                geometry
                    .iter()
                    .any(|g| g["start"] == hidden["span"]["start"]),
                opening == 200,
                "clipped-out text must not have a clickable canvas region"
            );
            records.push(json!({"aspect":[width,height],"opening":opening,"frameId":frame["frameId"],"renderer":frame["renderer"]}));
        }
    }
    service.close().unwrap();
    let shutdown = service.canvas_shutdown_report().unwrap();
    assert!(
        shutdown.cleanup_complete && shutdown.cooperative && shutdown.exit_code == Some(0),
        "{shutdown:?}"
    );
    assert!(!profile.read_dir().unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"sdkProcesses":1,"helperSessions":1,"records":records,"shutdown":shutdown,"acceptedSHA256":accepted["sha256"]})).unwrap()).unwrap();
}
