use super::*;

pub(super) fn render_frame(
    service: &mut LifecycleService,
    payload: Value,
    profile: &std::path::Path,
    output: &std::path::Path,
    name: &str,
) -> Value {
    let response = ipc(service, "screens.canvasRender", payload);
    assert_eq!(response["phase"], "starting", "{response}");
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
    let frame = loop {
        let frame = ipc(
            service,
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
                for file in ["log.txt", "traceback.txt", "startup-refusal.json"] {
                    if entry.path().join(file).is_file() {
                        fs::copy(entry.path().join(file), output.join(file)).unwrap();
                    }
                }
            }
            panic!("Helper did not produce a qualified frame for {name}: {frame}");
        }
        std::thread::sleep(std::time::Duration::from_millis(16));
    };
    fs::write(
        output.join(format!("{name}.json")),
        serde_json::to_vec_pretty(&frame).unwrap(),
    )
    .unwrap();
    frame
}

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
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"empty_viewport","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = created["owned"][0].clone();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"viewport","text":""}),
    );
    let empty_request = |document: &Value| json!({"path":owner["path"],"screenName":"empty_viewport","expectedRevision":document["revision"],"width":1280,"height":720});
    render_frame(
        &mut service,
        empty_request(&added["document"]),
        &profile,
        &output,
        "empty-saved-viewport",
    );
    for kind in ["window", "frame", "viewport"] {
        let mut request = empty_request(&added["document"]);
        request["addition"] = json!({"parentStart":added["document"]["screens"][0]["nodes"][0]["span"]["start"],"kind":kind,"text":""});
        render_frame(
            &mut service,
            request,
            &profile,
            &output,
            &format!("pending-empty-{kind}"),
        );
    }
    let child = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":added["selectedId"],"kind":"fixed","text":""}),
    );
    let removed = compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":child["selectedId"]}),
    );
    render_frame(
        &mut service,
        empty_request(&removed["document"]),
        &profile,
        &output,
        "last-child-removed",
    );
    let mut records = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        for opening in [100, 200] {
            let frame = render_frame(
                &mut service,
                json!({"path":PATH,"screenName":"notes","expectedRevision":doc["revision"],"width":width,"height":height,
                "layouts":if opening==200 {json!([{"nodeStart":viewport["span"]["start"],"values":{"ysize":{"unit":"pixels","value":200}}}])} else {json!([])}}),
                &profile,
                &output,
                &format!("helper-{width}x{height}-opening-{opening}"),
            );
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
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"sdkProcesses":1,"helperSessions":1,"records":records,"emptyCases":["empty-saved-viewport","pending-empty-window","pending-empty-frame","pending-empty-viewport","last-child-removed"],"shutdown":shutdown,"acceptedSHA256":accepted["sha256"]})).unwrap()).unwrap();
}
