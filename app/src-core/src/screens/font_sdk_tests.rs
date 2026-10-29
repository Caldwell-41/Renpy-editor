use super::*;

#[test]
#[ignore = "L05 selected pinned-SDK proof; one canvas-helper start"]
fn project_font_helper_matches_normal_sdk_and_retains_typed_pending_source() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified official archive");
    crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
        .unwrap();
    let inputs = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_PROJECT_FONT_INPUTS").expect("accepted public-core inputs"),
    );
    let accepted: Value =
        serde_json::from_slice(&fs::read(inputs.join("accepted.json")).unwrap()).unwrap();
    let normal = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_PROJECT_FONT_NORMAL").expect("qualified normal SDK output"),
    );
    let normal_result: Value =
        serde_json::from_slice(&fs::read(normal.join("result.json")).unwrap()).unwrap();
    assert_eq!(normal_result["passed"], true);
    assert_eq!(accepted["publicCoreRequests"], true);
    let source = accepted["source"].as_str().unwrap();
    assert_eq!(
        hex::encode(Sha256::digest(source.as_bytes())),
        accepted["sha256"]
    );
    assert_eq!(
        normal_result["records"][0]["sourceSHA256"],
        accepted["sha256"]
    );
    let output = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_PROJECT_FONT_HELPER_OUTPUT").expect("fresh helper evidence"),
    );
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join("game/ui/notes.rpy"), source).unwrap();
    fs::write(
        root.join("game/ui/font_reference.rpy"),
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/reference.rpy"),
    )
    .unwrap();
    service.open_path(&root).unwrap();
    let mut fonts = vec![];
    for (extension, bytes) in [
        (
            "ttf",
            &include_bytes!(
                "../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf"
            )[..],
        ),
        (
            "otf",
            &include_bytes!(
                "../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.otf"
            )[..],
        ),
    ] {
        let selected = temporary
            .path()
            .join(format!("help_{extension}.{extension}"));
        fs::write(&selected, bytes).unwrap();
        let choice = service.authoring_select_import(&selected).unwrap();
        let model = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,"kind":"font","technicalName":format!("help_{extension}"),"displayName":format!("Help {extension}")}),
        );
        fonts.push(
            model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["relativePath"] == format!("game/fonts/help_{extension}.{extension}"))
                .unwrap()
                .clone(),
        );
    }
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":"game/ui/notes.rpy"}),
    );
    let reference = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":"game/ui/font_reference.rpy"}),
    );
    let mut records = vec![];
    for (index, (width, height)) in [(1280, 720), (1024, 768)].into_iter().enumerate() {
        let frame = super::nested_sdk::render_frame(
            &mut service,
            json!({"path":"game/ui/notes.rpy","screenName":"notes","expectedRevision":doc["revision"],"width":width,"height":height}),
            &profile,
            &output,
            &format!("font-{width}x{height}"),
        );
        for element in accepted["elements"].as_array().unwrap() {
            let node = doc["screens"][0]["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|n| n["id"] == element["nodeId"])
                .unwrap();
            let actual = frame["geometry"]
                .as_array()
                .unwrap()
                .iter()
                .find(|g| g["start"] == node["span"]["start"])
                .unwrap();
            let expected =
                &normal_result["records"][index]["rectangles"][element["name"].as_str().unwrap()];
            for (i, key) in ["x", "y", "width", "height"].iter().enumerate() {
                assert_eq!(
                    actual[key].as_f64(),
                    expected[i].as_f64(),
                    "{} {key}",
                    element["name"]
                );
            }
        }
        super::nested_sdk::render_frame(
            &mut service,
            json!({"path":"game/ui/font_reference.rpy","screenName":"font_reference","expectedRevision":reference["revision"],"width":width,"height":height}),
            &profile,
            &output,
            &format!("reference-{width}x{height}"),
        );
        records.push(json!({"aspect":[width,height],"renderer":frame["renderer"],"frameId":frame["frameId"]}));
    }
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"pending_font","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "pending_font")
        .unwrap();
    let leaf = compose_command(
        &mut service,
        owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Pending project font"}),
    );
    let document = &leaf["document"];
    let node = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == leaf["selectedId"])
        .unwrap();
    let values = json!({"font":{"assetId":fonts[1]["id"],"expectedAssetSha256":fonts[1]["sha256"]},"size":38,"color":"#ace","align":0.5,"bold":true,"italic":true});
    let before = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    let pending = super::nested_sdk::render_frame(
        &mut service,
        json!({"path":owner["path"],"screenName":"pending_font","expectedRevision":document["revision"],"width":1280,"height":720,"textStyles":[{"nodeStart":node["span"]["start"],"values":values}]}),
        &profile,
        &output,
        "typed-pending",
    );
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    let changed = compose_command(
        &mut service,
        owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":values}),
    );
    let saved = super::nested_sdk::render_frame(
        &mut service,
        json!({"path":owner["path"],"screenName":"pending_font","expectedRevision":changed["document"]["revision"],"width":1280,"height":720}),
        &profile,
        &output,
        "typed-accepted",
    );
    assert_eq!(
        pending["image"], saved["image"],
        "Typed pending typography matches accepted source output"
    );
    service.close().unwrap();
    let shutdown = service.canvas_shutdown_report().unwrap();
    assert!(
        shutdown.cleanup_complete && shutdown.cooperative && shutdown.exit_code == Some(0),
        "{shutdown:?}"
    );
    assert!(!profile.read_dir().unwrap().any(|e| e
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"helperSessions":1,"typedPending":true,"pendingMatchesAccepted":true,"normalSourceSHA256":accepted["sha256"],"records":records,"shutdown":shutdown})).unwrap()).unwrap();
}
