use super::*;

#[test]
fn ui_image_import_is_typed_transactional_and_restores_through_shared_history() {
    let (temporary, mut service, root, _) = composition_project();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let chosen = temporary.path().join("seal.png");
    let bytes = include_bytes!("../../../../tests/fixtures/phase-1h/assets/booth.png");
    fs::write(&chosen, bytes).unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    let model = ipc(
        &mut service,
        "asset.import",
        json!({
            "authorityId":choice.authority_id,"kind":"uiImage", "technicalName":"seal",
            "displayName":"Station seal","characterId":null,"expression":null
        }),
    );
    let image = model["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["kind"] == "uiImage")
        .unwrap();
    let asset_id = image["id"].clone();
    assert_eq!(image["relativePath"], "game/images/ui seal.png");
    assert_eq!(image["discoveryName"], "ui seal");
    let imported = root.join("game/images/ui seal.png");
    assert_eq!(fs::read(&imported).unwrap(), bytes);
    composition_history(&mut service, "undo");
    assert!(
        !imported.exists(),
        "One Undo removes the imported file and its metadata"
    );
    assert!(ipc(&mut service, "authoring.list", json!({}))["assets"]
        .as_array()
        .unwrap()
        .iter()
        .all(|a| a["id"] != asset_id));
    composition_history(&mut service, "redo");
    assert_eq!(fs::read(&imported).unwrap(), bytes);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(&mut service, "authoring.list", json!({}));
    assert!(reopened["assets"]
        .as_array()
        .unwrap()
        .iter()
        .any(|a| a["id"] == asset_id && a["kind"] == "uiImage"));
}

#[test]
fn invalid_ui_image_import_retains_project_bytes_and_shared_history() {
    for extension in ["png", "jpg", "webp"] {
        let (temporary, mut service, root, owner) = composition_project();
        fs::create_dir_all(root.join("game/images")).unwrap();
        let before = fs::read(root.join(".renpy-editor/authoring.json")).unwrap();
        let chosen = temporary.path().join(format!("invalid.{extension}"));
        fs::write(&chosen, b"invalid image data").unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let response = reject(
            &mut service,
            "asset.import",
            json!({
                "authorityId":choice.authority_id,"kind":"uiImage", "technicalName":"bad",
                "displayName":"Bad image","characterId":null,"expression":null
            }),
        );
        assert_eq!(
            response["error"]["code"], "UNSUPPORTED_FORMAT",
            "{extension}"
        );
        assert_eq!(
            fs::read(root.join(".renpy-editor/authoring.json")).unwrap(),
            before
        );
        assert_eq!(fs::read_dir(root.join("game/images")).unwrap().count(), 0);
        composition_history(&mut service, "undo");
        assert_eq!(
            ipc(&mut service, "screens.list", json!({}))["owned"],
            json!([]),
            "Refused import adds no history entry; Undo still removes the created screen"
        );
        assert!(!root.join(owner["path"].as_str().unwrap()).exists());
    }
}

#[test]
fn ui_image_formats_present_verified_natural_dimensions_without_execution() {
    let png: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png");
    let jpeg: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.jpg");
    let webp: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.webp");
    let lossy: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal-lossy.webp");
    let alpha: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal-alpha.webp");
    for (extension, bytes, mime) in [
        ("png", png, "image/png"),
        ("jpg", jpeg, "image/jpeg"),
        ("jpeg", jpeg, "image/jpeg"),
        ("webp", webp, "image/webp"),
        ("webp", lossy, "image/webp"),
        ("webp", alpha, "image/webp"),
    ] {
        let (temporary, mut service, root, _) = composition_project();
        fs::create_dir_all(root.join("game/images")).unwrap();
        fs::write(
            root.join("game/trap.rpy"),
            "init python:\n    raise Exception(\"Inspection must not execute project Python\")\n",
        )
        .unwrap();
        let selected = temporary.path().join(format!("seal.{extension}"));
        fs::write(&selected, bytes).unwrap();
        let choice = service.authoring_select_import(&selected).unwrap();
        let staged = ipc(
            &mut service,
            "asset.previewImport",
            json!({"authorityId":choice.authority_id}),
        );
        assert_eq!(staged["width"], 80, "{extension}");
        assert_eq!(staged["height"], 40);
        assert_eq!(staged["mimeType"], mime);
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["assets"],
            json!([])
        );
        let model = ipc(
            &mut service,
            "asset.import",
            json!({
                "authorityId":choice.authority_id,"kind":"uiImage","technicalName":"seal",
                "displayName":"Seal","characterId":null,"expression":null
            }),
        );
        let media = ipc(
            &mut service,
            "media.present",
            json!({"assetId":model["assets"][0]["id"],"purpose":"imagePreview"}),
        );
        assert_eq!(media["width"], 80);
        assert_eq!(media["height"], 40);
        assert_eq!(media["mimeType"], mime);
        assert_eq!(media["dataBase64"], staged["dataBase64"]);
        assert_eq!(media["sha256"], hex::encode(Sha256::digest(bytes)));
    }
}

fn import_image(
    service: &mut LifecycleService,
    temporary: &std::path::Path,
    root: &std::path::Path,
    kind: &str,
) -> Value {
    fs::create_dir_all(root.join("game/images")).unwrap();
    let chosen = temporary.join("seal.png");
    fs::write(
        &chosen,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    ipc(
        service,
        "asset.import",
        json!({
            "authorityId":choice.authority_id,"kind":kind,"technicalName":"seal",
            "displayName":"Seal","characterId":null,"expression":null
        }),
    )["assets"][0]
        .clone()
}

#[test]
fn ui_image_placement_is_an_owned_node_with_exact_source_history_and_reopen() {
    let (temporary, mut service, root, owner) = composition_project();
    let asset = import_image(&mut service, temporary.path(), &root, "uiImage");
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let neighbors =
        "\n# Keep opaque neighbors exactly.\nscreen other_screen():\n    use foreign_component()\n";
    save_composition_source(&mut service, &owner, &format!("{original}{neighbors}"));
    let result = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"addImage","parentId":owner["rootId"],"assetId":asset["id"],
            "expectedAssetSha256":asset["sha256"],"width":160,"height":80
        }),
    );
    let id = result["selectedId"].as_str().unwrap();
    let expected = format!("{original}    add \"images/ui seal.png\": # loomlight-element: {id}\n        xsize 160\n        ysize 80\n{neighbors}");
    assert_eq!(
        fs::read_to_string(root.join(owner["path"].as_str().unwrap())).unwrap(),
        expected
    );
    let node = result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == id)
        .unwrap();
    assert_eq!(node["kind"], "image");
    assert_eq!(node["literal"], "images/ui seal.png");
    assert_eq!(
        node["numericLayout"]["values"]["xsize"]["value"].as_f64(),
        Some(160.0)
    );
    assert_eq!(
        node["numericLayout"]["values"]["ysize"]["value"].as_f64(),
        Some(80.0)
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        format!("{original}{neighbors}")
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert!(reopened["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|n| n["id"] == id));
}

#[test]
fn ui_image_drafts_require_typed_asset_selection_in_the_canvas_plan() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let response = reject(
        &mut service,
        "screens.canvasPlan",
        json!({
            "path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],
            "width":1280,"height":720,"addition":{"parentStart":doc["screens"][0]["nodes"][0]["span"]["start"],
            "kind":"image","text":"images/untyped.png"}
        }),
    );
    assert_eq!(response["error"]["code"], "INVALID_PAYLOAD");
}

#[test]
fn ui_image_asset_and_size_change_is_one_minimal_history_entry_and_noop_is_not_an_edit() {
    let (temporary, mut service, root, owner) = composition_project();
    let asset = import_image(&mut service, temporary.path(), &root, "uiImage");
    let inserted = compose_command(
        &mut service,
        &owner,
        json!({
            "type":"addImage","parentId":owner["rootId"],"assetId":asset["id"],
            "expectedAssetSha256":asset["sha256"],"width":160,"height":80
        }),
    );
    let chosen = temporary.path().join("banner.jpg");
    fs::write(
        &chosen,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.jpg"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    let imported = ipc(
        &mut service,
        "asset.import",
        json!({"authorityId":choice.authority_id,
        "kind":"uiImage","technicalName":"banner","displayName":"Banner","characterId":null,"expression":null}),
    );
    let banner = imported["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["displayName"] == "Banner")
        .unwrap();
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = source
        .replace("xsize 160", "xsize 160 # preserve width comment")
        .replace("ysize 80", "ysize 80 # preserve height comment");
    save_composition_source(&mut service, &owner, &before);
    let change = json!({"type":"image","nodeId":inserted["selectedId"],"assetId":banner["id"],
        "expectedAssetSha256":banner["sha256"],"width":96,"height":48});
    let changed = compose_command(&mut service, &owner, change.clone());
    let expected = before
        .replace("images/ui seal.png", "images/ui banner.jpg")
        .replace("xsize 160", "xsize 96")
        .replace("ysize 80", "ysize 48");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    assert_eq!(changed["selectedId"], inserted["selectedId"]);
    let noop = compose_command(&mut service, &owner, change);
    assert_eq!(
        noop["document"]["revision"],
        changed["document"]["revision"]
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
}

#[test]
fn ui_image_references_and_source_conflicts_refuse_without_changing_source() {
    for (case, code) in [
        ("missing", "UI_IMAGE_MISSING"),
        ("replaced", "UI_IMAGE_CHANGED"),
        ("wrong-role", "INVALID_UI_IMAGE"),
        ("stale-hash", "UI_IMAGE_CHANGED"),
        ("untyped-path", "UI_IMAGE_MISSING"),
        ("source-conflict", "SOURCE_CONFLICT"),
    ] {
        let (temporary, mut service, root, owner) = composition_project();
        let asset = import_image(
            &mut service,
            temporary.path(),
            &root,
            if case == "wrong-role" {
                "background"
            } else {
                "uiImage"
            },
        );
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let source_path = root.join(owner["path"].as_str().unwrap());
        let mut source = fs::read(&source_path).unwrap();
        let mut id = asset["id"].clone();
        let mut hash = asset["sha256"].clone();
        let image_path = root.join(asset["relativePath"].as_str().unwrap());
        match case {
            "missing" => fs::remove_file(&image_path).unwrap(),
            "replaced" => fs::write(&image_path, b"a different file").unwrap(),
            "stale-hash" => hash = json!("0".repeat(64)),
            "untyped-path" => id = json!("../../outside.png"),
            "source-conflict" => {
                source.extend_from_slice(b"\n# External edit stays.\n");
                fs::write(&source_path, &source).unwrap();
            }
            _ => {}
        }
        let response = reject(
            &mut service,
            "screens.compose",
            json!({
                "screenId":owner["id"],"expectedRevision":doc["revision"],"command":{
                    "type":"addImage","parentId":owner["rootId"],"assetId":id,
                    "expectedAssetSha256":hash,"width":160,"height":80
                }
            }),
        );
        assert_eq!(response["error"]["code"], code, "{case}: {response}");
        assert_eq!(fs::read(&source_path).unwrap(), source, "{case}");
        assert!(ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]})
        )["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .all(|n| n["kind"] != "image"));
    }
}

#[test]
fn ui_image_import_reports_its_bounded_limit_without_changing_the_project() {
    let (temporary, mut service, root, _) = composition_project();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let selected = temporary.path().join("large.png");
    fs::File::create(&selected)
        .unwrap()
        .set_len(16 * 1024 * 1024 + 1)
        .unwrap();
    let choice = service.authoring_select_import(&selected).unwrap();
    let response = reject(
        &mut service,
        "asset.import",
        json!({
            "authorityId":choice.authority_id,"kind":"uiImage","technicalName":"large",
            "displayName":"Large","characterId":null,"expression":null
        }),
    );
    assert_eq!(response["error"]["code"], "UI_IMAGE_TOO_LARGE");
    assert!(response["error"]["message"]
        .as_str()
        .unwrap()
        .contains("16 MiB"));
    assert_eq!(
        ipc(&mut service, "authoring.list", json!({}))["assets"],
        json!([])
    );
    assert_eq!(fs::read_dir(root.join("game/images")).unwrap().count(), 0);
}

#[test]
fn ui_image_prepares_sdk_fixture_through_public_requests() {
    let (temporary, mut service, root, owner) = composition_project();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let png: &[u8] =
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png");
    let cases: &[(&str, &str, &str, &[u8], u32, u32, u32, u32)] = &[
        ("png", "png", "seal.png", png, 20, 20, 120, 60),
        (
            "jpeg",
            "jpg",
            "seal.jpg",
            include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.jpg"),
            180,
            20,
            96,
            48,
        ),
        (
            "lossless",
            "webp",
            "seal.webp",
            include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.webp"),
            340,
            20,
            160,
            80,
        ),
        (
            "lossy",
            "webp",
            "seal-lossy.webp",
            include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal-lossy.webp"),
            540,
            20,
            128,
            64,
        ),
        (
            "alpha",
            "webp",
            "seal-alpha.webp",
            include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal-alpha.webp"),
            720,
            20,
            80,
            40,
        ),
        ("stretch", "png", "seal.png", png, 20, 160, 120, 90),
    ];
    let mut first = None;
    let mut assets = Vec::new();
    let mut elements = Vec::new();
    for &(name, extension, fixture, bytes, x, y, width, height) in cases {
        let asset = if name == "stretch" {
            first.clone().unwrap()
        } else {
            let selected = temporary.path().join(format!("{name}.{extension}"));
            fs::write(&selected, bytes).unwrap();
            let choice = service.authoring_select_import(&selected).unwrap();
            let model = ipc(
                &mut service,
                "asset.import",
                json!({"authorityId":choice.authority_id,
                "kind":"uiImage","technicalName":name,"displayName":name,"characterId":null,"expression":null}),
            );
            let asset = model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["displayName"] == name)
                .unwrap()
                .clone();
            assets.push(json!({"runtimePath":asset["relativePath"].as_str().unwrap().strip_prefix("game/").unwrap(),
                "sha256":asset["sha256"],"fixture":fixture}));
            if name == "png" {
                first = Some(asset.clone());
            }
            asset
        };
        let added = compose_command(
            &mut service,
            &owner,
            json!({"type":"addImage","parentId":owner["rootId"],
            "assetId":asset["id"],"expectedAssetSha256":asset["sha256"],"width":width,"height":height}),
        );
        let node = added["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == added["selectedId"])
            .unwrap();
        ipc(
            &mut service,
            "screens.setLayout",
            json!({"path":owner["path"],"screenName":"notes",
            "expectedRevision":added["document"]["revision"],"nodeStart":node["span"]["start"],
            "values":{"xpos":{"unit":"pixels","value":x},"ypos":{"unit":"pixels","value":y}}}),
        );
        elements.push(json!({"name":name,"id":added["selectedId"],"rectangle":[x,y,width,height],"fixture":fixture}));
    }
    let mut source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    // Ren'Py widget IDs are fixture observation points, accepted through Source.
    for element in &elements {
        let marker = format!("# loomlight-element: {}\n", element["id"].as_str().unwrap());
        source = source.replace(
            &marker,
            &format!(
                "{marker}        id \"{}\"\n",
                element["name"].as_str().unwrap()
            ),
        );
    }
    save_composition_source(&mut service, &owner, &source);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    for (width, height) in [(1280, 720), (1024, 768)] {
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":owner["path"],"screenName":"notes",
            "expectedRevision":document["revision"],"width":width,"height":height}),
        );
        assert_eq!(plan["available"], true, "{plan}");
        assert_eq!(
            plan["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|n| n["kind"] == "image")
                .count(),
            6
        );
    }
    if let Some(output) = std::env::var_os("LOOMLIGHT_UI_IMAGE_INPUTS") {
        let output = std::path::PathBuf::from(output);
        fs::create_dir(&output).unwrap();
        fs::write(
            output.join("accepted.json"),
            serde_json::to_vec_pretty(&json!({
                "source":source,"sha256":hex::encode(Sha256::digest(source.as_bytes())),
                "publicCoreRequests":true,"assets":assets,"elements":elements
            }))
            .unwrap(),
        )
        .unwrap();
    }
}
