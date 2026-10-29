use super::*;

#[test]
#[ignore = "L06 selected pinned-SDK proof; one helper/SDK launch"]
fn ui_image_helper_qualifies_assets_sizes_and_typed_pending_images() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified official archive");
    crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
        .unwrap();
    let inputs = std::path::PathBuf::from(
        std::env::var_os("LOOMLIGHT_UI_IMAGE_INPUTS").expect("accepted public-core inputs"),
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
        std::env::var_os("LOOMLIGHT_UI_IMAGE_HELPER_EVIDENCE").expect("fresh helper evidence"),
    );
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    fs::write(root.join("game/ui/notes.rpy"), source).unwrap();
    for asset in accepted["assets"].as_array().unwrap() {
        let name = asset["fixture"].as_str().unwrap();
        assert!([
            "seal.png",
            "seal.jpg",
            "seal.webp",
            "seal-lossy.webp",
            "seal-alpha.webp"
        ]
        .contains(&name));
        let bytes = fs::read(
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../tests/fixtures/phase-3b-screens/ui-image")
                .join(name),
        )
        .unwrap();
        assert_eq!(hex::encode(Sha256::digest(&bytes)), asset["sha256"]);
        let relative = format!("game/{}", asset["runtimePath"].as_str().unwrap());
        assert!(relative.starts_with("game/images/ui ") && !relative.contains(".."));
        fs::write(root.join(relative), bytes).unwrap();
    }
    // Literal reference paths and geometry are independent of the generated source.
    let mut reference = String::from("screen image_reference():\n");
    for (name, file, x, y, width, height) in [
        ("png", "png.png", 20, 20, 120, 60),
        ("jpeg", "jpeg.jpg", 180, 20, 96, 48),
        ("lossless", "lossless.webp", 340, 20, 160, 80),
        ("lossy", "lossy.webp", 540, 20, 128, 64),
        ("alpha", "alpha.webp", 720, 20, 80, 40),
        ("stretch", "png.png", 20, 160, 120, 90),
    ] {
        reference.push_str(&format!("    add \"images/ui {file}\":\n        id \"{name}\"\n        xpos {x}\n        ypos {y}\n        xsize {width}\n        ysize {height}\n"));
    }
    fs::write(root.join("game/ui/image_reference.rpy"), reference).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":"game/ui/notes.rpy"}),
    );
    let ref_doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":"game/ui/image_reference.rpy"}),
    );
    let mut records = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        let frame = super::nested_sdk::render_frame(
            &mut service,
            json!({"path":"game/ui/notes.rpy","screenName":"notes","expectedRevision":doc["revision"],"width":width,"height":height}),
            &profile,
            &output,
            &format!("images-{width}x{height}"),
        );
        let images: Vec<_> = doc["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|n| n["kind"] == "image")
            .collect();
        assert_eq!(images.len(), accepted["elements"].as_array().unwrap().len());
        for (element, node) in accepted["elements"].as_array().unwrap().iter().zip(images) {
            let geometry = frame["geometry"]
                .as_array()
                .unwrap()
                .iter()
                .find(|g| g["start"] == node["span"]["start"])
                .unwrap();
            for (index, key) in ["x", "y", "width", "height"].iter().enumerate() {
                assert_eq!(
                    geometry[key].as_f64(),
                    element["rectangle"][index].as_f64(),
                    "{} {key}",
                    element["name"]
                );
            }
        }
        super::nested_sdk::render_frame(
            &mut service,
            json!({"path":"game/ui/image_reference.rpy","screenName":"image_reference","expectedRevision":ref_doc["revision"],"width":width,"height":height}),
            &profile,
            &output,
            &format!("reference-{width}x{height}"),
        );
        records.push(json!({"aspect":[width,height],"renderer":frame["renderer"],"frameId":frame["frameId"]}));
    }
    let asset = ui_images::import_image(&mut service, temporary.path(), &root, "uiImage");
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"pending_image","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = created["owned"][0].clone();
    let pending_doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let request = json!({"path":owner["path"],"screenName":"pending_image","expectedRevision":pending_doc["revision"],"width":1280,"height":720,"imageAddition":{"parentStart":pending_doc["screens"][0]["nodes"][0]["span"]["start"],"assetId":asset["id"],"expectedAssetSha256":asset["sha256"],"width":160,"height":80,"layout":{"xpos":{"unit":"pixels","value":30},"ypos":{"unit":"pixels","value":40}}}});
    let pending =
        super::nested_sdk::render_frame(&mut service, request, &profile, &output, "typed-pending");
    assert!(pending["geometry"]
        .as_array()
        .unwrap()
        .iter()
        .any(|g| g["x"].as_f64() == Some(30.)
            && g["y"].as_f64() == Some(40.)
            && g["width"].as_f64() == Some(160.)
            && g["height"].as_f64() == Some(80.)));
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap()))
            .unwrap()
            .contains("    add "),
        false
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
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"sdkProcesses":1,"helperSessions":1,"records":records,"typedPending":true,"shutdown":shutdown,"acceptedSHA256":accepted["sha256"]})).unwrap()).unwrap();
}
