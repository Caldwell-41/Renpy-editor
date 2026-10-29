use super::*;

const TTF: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf");
const OTF: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.otf");

fn import_font(
    service: &mut LifecycleService,
    temporary: &std::path::Path,
    extension: &str,
) -> Value {
    let chosen = temporary.join(format!("help.{extension}"));
    fs::write(&chosen, if extension == "ttf" { TTF } else { OTF }).unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    ipc(
        service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"font",
        "technicalName":"help","displayName":"Help font","characterId":null,"expression":null}),
    )["assets"][0]
        .clone()
}

#[test]
fn text_format_is_one_minimal_transaction_with_typed_font_noop_history_and_reopen() {
    let (temporary, mut service, root, owner) = composition_project();
    let font = import_font(&mut service, temporary.path(), "otf");
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Help"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let source = format!(
        "{}    use opaque_footer() # preserve\n",
        original
            .replace("text \"Help\" #", "text \"Help\": #")
            .replace("\n    pass\n", "\n    pass # keep\n")
    );
    save_composition_source(&mut service, &owner, &source);
    let command = json!({"type":"formatText","nodeId":added["selectedId"],"values":{
        "text":"Choose a route.","font":{"assetId":font["id"],"expectedAssetSha256":font["sha256"]},
        "size":26,"color":"#f1e9d6","align":0.5,"bold":true,"italic":false}});
    let result = compose_command(&mut service, &owner, command.clone());
    let expected=source.replace("text \"Help\":", "text \"Choose a route.\":").replace(
        &format!("# loomlight-element: {}\n",added["selectedId"].as_str().unwrap()),
        &format!("# loomlight-element: {}\n        font \"fonts/help.otf\"\n        size 26\n        color \"#f1e9d6\"\n        text_align 0.5\n        bold True\n        italic False\n",added["selectedId"].as_str().unwrap()));
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    assert_eq!(result["selectedId"], added["selectedId"]);
    let unchanged = compose_command(&mut service, &owner, command);
    assert_eq!(unchanged["changed"], false);
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let text = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == added["selectedId"])
        .unwrap();
    assert_eq!(
        text["textProperties"]["values"],
        json!({"font":"fonts/help.otf","size":26,"color":"#f1e9d6","align":0.5,"bold":true,"italic":false})
    );
}

#[test]
fn supported_text_fields_preserve_expression_neighbors_and_refuse_expression_replacement() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let leaf = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Help"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = original.replace("text \"Help\" #", "text _(\"Help\"): #");
    let source=format!("{before}        font gui.text_font # font expression\n        size gui.text_size # size expression\n        color \"#fff\" # keep comment\n");
    save_composition_source(&mut service, &owner, &source);
    let changed = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"color":"#abcd"}}),
    );
    let expected = source.replace("color \"#fff\"", "color \"#abcd\"");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    for values in [
        json!({"text":"Rewrite"}),
        json!({"size":42}),
        json!({"font":null}),
    ] {
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":owner["id"],"expectedRevision":changed["document"]["revision"],"command":{"type":"formatText","nodeId":leaf["selectedId"],"values":values}})
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            expected
        );
    }
}

#[test]
fn resetting_last_text_property_preserves_comment_and_leaves_a_valid_block() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let leaf = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Close"}),
    );
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let before = format!(
        "{}        text_color \"#fff\" # keep\n",
        original.replace("textbutton \"Close\" #", "textbutton \"Close\": #")
    );
    save_composition_source(&mut service, &owner, &before);
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"color":null}}),
    );
    let expected = before.replace(
        "        text_color \"#fff\" # keep\n",
        "        pass\n         # keep\n",
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        expected
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
}

#[test]
fn text_format_refuses_untyped_stale_missing_and_changed_fonts_without_writing() {
    for case in [
        "raw-url",
        "wrong-role",
        "missing",
        "changed",
        "hash",
        "source",
        "invalid-size",
        "invalid-color",
    ] {
        let (temporary, mut service, root, owner) = composition_project();
        let font = import_font(&mut service, temporary.path(), "ttf");
        let leaf = compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Keep"}),
        );
        let mut reference = json!({"assetId":font["id"],"expectedAssetSha256":font["sha256"]});
        let mut values = json!({"text":"Changed","font":reference.clone()});
        let expected = match case {
            "raw-url" => {
                values["font"] = json!("https://example.invalid/font.ttf");
                "INVALID_PAYLOAD"
            }
            "wrong-role" => {
                super::ui_images::import_image(&mut service, temporary.path(), &root, "uiImage");
                let model = ipc(&mut service, "authoring.list", json!({}));
                let image = model["assets"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|a| a["kind"] == "uiImage")
                    .unwrap();
                reference["assetId"] = image["id"].clone();
                reference["expectedAssetSha256"] = image["sha256"].clone();
                values["font"] = reference;
                "INVALID_FONT"
            }
            "missing" => {
                fs::remove_file(root.join(font["relativePath"].as_str().unwrap())).unwrap();
                "FONT_MISSING"
            }
            "changed" => {
                fs::write(root.join(font["relativePath"].as_str().unwrap()), OTF).unwrap();
                "FONT_CHANGED"
            }
            "hash" => {
                values["font"]["expectedAssetSha256"] = json!("0".repeat(64));
                "FONT_CHANGED"
            }
            "source" => {
                let p = root.join(owner["path"].as_str().unwrap());
                let mut b = fs::read(&p).unwrap();
                b.extend_from_slice(b"# external edit\n");
                fs::write(p, b).unwrap();
                "SOURCE_CONFLICT"
            }
            "invalid-size" => {
                values["size"] = json!(513);
                "INVALID_PAYLOAD"
            }
            _ => {
                values["color"] = json!("var(--color)");
                "INVALID_PAYLOAD"
            }
        };
        let before = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
        let result = reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":leaf["document"]["revision"],"command":{"type":"formatText","nodeId":leaf["selectedId"],"values":values}}),
        );
        assert_eq!(result["error"]["code"], expected, "{case}");
        assert_eq!(
            fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
            before,
            "{case}"
        );
    }
}

#[test]
fn font_specimens_are_bounded_bytes_from_typed_selection_without_project_execution() {
    let (temporary, mut service, root, _owner) = composition_project();
    fs::write(
        root.join("game/trap.rpy"),
        "init python:\n    raise Exception('must not execute')\n",
    )
    .unwrap();
    let chosen = temporary.path().join("specimen.otf");
    fs::write(&chosen, OTF).unwrap();
    let choice = service.authoring_select_import(&chosen).unwrap();
    let preview = ipc(
        &mut service,
        "asset.previewFont",
        json!({"authorityId":choice.authority_id}),
    );
    assert_eq!(preview["mimeType"], "font/otf");
    assert_eq!(preview["byteCount"], OTF.len());
    assert_eq!(preview["sha256"], hex::encode(Sha256::digest(OTF)));
    assert_eq!(
        ipc(&mut service, "authoring.list", json!({}))["assets"],
        json!([])
    );
    let model = ipc(
        &mut service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"font","technicalName":"specimen","displayName":"Specimen"}),
    );
    let font = &model["assets"][0];
    let presented = ipc(
        &mut service,
        "asset.presentFont",
        json!({"assetId":font["id"],"expectedAssetSha256":font["sha256"]}),
    );
    assert_eq!(presented["dataBase64"], preview["dataBase64"]);
    assert_eq!(presented["sha256"], preview["sha256"]);
    assert_eq!(
        reject(
            &mut service,
            "media.present",
            json!({"assetId":font["id"],"purpose":"imagePreview"})
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );
}

#[test]
fn typography_canvas_uses_saved_values_and_typed_drafts_without_writing_source() {
    let (temporary, mut service, _root, owner) = composition_project();
    let font = import_font(&mut service, temporary.path(), "ttf");
    let leaf = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Help"}),
    );
    let formatted = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"font":{"assetId":font["id"],"expectedAssetSha256":font["sha256"]},"size":26,"color":"#abc","align":0.5,"bold":true,"italic":false}}),
    );
    let doc = &formatted["document"];
    let start = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == leaf["selectedId"])
        .unwrap()["span"]["start"]
        .clone();
    let payload = json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"width":1280,"height":720});
    let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
    assert_eq!(plan["available"], true, "{plan}");
    let text = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "text")
        .unwrap();
    for (key, value) in [
        ("font", json!("fonts/help.ttf")),
        ("size", json!(26)),
        ("text_align", json!(0.5)),
        ("bold", json!(true)),
        ("italic", json!(false)),
    ] {
        assert_eq!(text["properties"][key], value, "{key}");
    }
    let before = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    let mut pending = payload;
    pending["textStyles"] = json!([{"nodeStart":start,"values":{"font":{"assetId":font["id"],"expectedAssetSha256":font["sha256"]},"size":38,"color":"#1234","bold":false}}]);
    let plan = ipc(&mut service, "screens.canvasPlan", pending.clone());
    assert_eq!(plan["available"], true, "{plan}");
    let text = plan["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "text")
        .unwrap();
    assert_eq!(text["properties"]["size"], 38);
    assert_eq!(text["properties"]["bold"], false);
    pending["textStyles"][0]["values"]["font"] = json!("https://example.invalid/font.ttf");
    assert_eq!(
        reject(&mut service, "screens.canvasPlan", pending)["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
}

#[test]
fn project_font_prepares_sdk_source_through_public_requests() {
    let (temporary, mut service, root, owner) = composition_project();
    let mut assets = vec![];
    for (extension, bytes) in [("ttf", TTF), ("otf", OTF)] {
        let chosen = temporary.path().join(format!("help.{extension}"));
        fs::write(&chosen, bytes).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let model = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,"kind":"font","technicalName":format!("help_{extension}"),"displayName":format!("Help {extension}")}),
        );
        assets.push(
            model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| a["relativePath"].as_str().unwrap().ends_with(extension))
                .unwrap()
                .clone(),
        );
    }
    let body="Choose a route before the last tram leaves at midnight. Return to the map whenever you need help.";
    let rows = [
        (
            "title",
            "Help with your route",
            0usize,
            38u32,
            "#f1e9d6",
            0.0,
            true,
            false,
            20,
            20,
            600,
        ),
        ("body", body, 1, 26, "#ace8", 0.5, false, true, 20, 100, 300),
        (
            "right",
            "Return to the map",
            0,
            26,
            "#12345678",
            1.0,
            true,
            true,
            20,
            310,
            300,
        ),
        (
            "minimum", "Small", 0, 1, "#fff", 0.0, false, false, 20, 500, 120,
        ),
        (
            "maximum", "I", 1, 512, "#ffff", 0.0, false, false, 800, 20, 200,
        ),
    ];
    let mut elements = vec![];
    for (name, text, index, size, color, align, bold, italic, x, y, width) in rows {
        let leaf = compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":text}),
        );
        let asset = &assets[index];
        let formatted = compose_command(
            &mut service,
            &owner,
            json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"font":{"assetId":asset["id"],"expectedAssetSha256":asset["sha256"]},"size":size,"color":color,"align":align,"bold":bold,"italic":italic},"layout":{"xpos":{"unit":"pixels","value":x},"ypos":{"unit":"pixels","value":y},"xsize":{"unit":"pixels","value":width}}}),
        );
        let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let marker = format!(
            "# loomlight-element: {}\n",
            leaf["selectedId"].as_str().unwrap()
        );
        save_composition_source(
            &mut service,
            &owner,
            &source.replace(&marker, &format!("{marker}        id \"{name}\"\n")),
        );
        assert_eq!(formatted["changed"], true);
        elements.push(json!({"name":name,"nodeId":leaf["selectedId"],"font":asset["relativePath"].as_str().unwrap().strip_prefix("game/").unwrap(),"size":size,"color":color,"align":align,"bold":bold,"italic":italic,"position":[x,y],"width":width}));
    }
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let accepted = json!({"publicCoreRequests":true,"source":source,"sha256":hex::encode(Sha256::digest(source.as_bytes())),"elements":elements,"assets":assets});
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        source
    );
    if let Some(output) = std::env::var_os("LOOMLIGHT_PROJECT_FONT_INPUTS") {
        let output = std::path::PathBuf::from(output);
        assert!(!output.exists());
        fs::create_dir_all(&output).unwrap();
        fs::write(
            output.join("accepted.json"),
            serde_json::to_vec_pretty(&accepted).unwrap(),
        )
        .unwrap();
    }
}

#[test]
fn typography_rechecks_the_accepted_font_when_only_another_field_changes() {
    let (temporary, mut service, root, owner) = composition_project();
    let font = import_font(&mut service, temporary.path(), "ttf");
    let leaf = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Keep"}),
    );
    let accepted = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"font":{"assetId":font["id"],"expectedAssetSha256":font["sha256"]}}}),
    );
    let before = fs::read(root.join(owner["path"].as_str().unwrap())).unwrap();
    fs::remove_file(root.join(font["relativePath"].as_str().unwrap())).unwrap();
    let response = reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":accepted["document"]["revision"],"command":{"type":"formatText","nodeId":leaf["selectedId"],"values":{"size":38}}}),
    );
    assert_eq!(response["error"]["code"], "FONT_MISSING");
    assert_eq!(
        fs::read(root.join(owner["path"].as_str().unwrap())).unwrap(),
        before
    );
    compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":leaf["selectedId"],"values":{"font":null,"size":38}}),
    );
}

#[test]
fn invalid_font_import_keeps_metadata_source_and_previous_history() {
    for (extension, bytes) in [
        ("ttf", &b"invalid"[..]),
        ("otf", &OTF[..64]),
        ("ttf", &TTF[..128]),
    ] {
        let (temporary, mut service, root, owner) = composition_project();
        let before = fs::read(root.join(".renpy-editor/authoring.json")).unwrap();
        let chosen = temporary.path().join(format!("invalid.{extension}"));
        fs::write(&chosen, bytes).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let result = reject(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,
            "kind":"font","technicalName":"bad","displayName":"Invalid","characterId":null,"expression":null}),
        );
        assert_eq!(result["error"]["code"], "UNSUPPORTED_FORMAT");
        assert_eq!(
            fs::read(root.join(".renpy-editor/authoring.json")).unwrap(),
            before
        );
        assert!(!root.join(format!("game/fonts/bad.{extension}")).exists());
        composition_history(&mut service, "undo");
        assert!(!root.join(owner["path"].as_str().unwrap()).exists());
    }
}

#[test]
fn project_fonts_import_as_typed_assets_with_shared_history_and_reopen() {
    for (extension, bytes) in [("ttf", TTF), ("otf", OTF)] {
        let (temporary, mut service, root, _) = composition_project();
        let chosen = temporary.path().join(format!("help.{extension}"));
        fs::write(&chosen, bytes).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let model = ipc(
            &mut service,
            "asset.import",
            json!({
                "authorityId":choice.authority_id,"kind":"font","technicalName":"help",
                "displayName":"Help font","characterId":null,"expression":null
            }),
        );
        let font = &model["assets"][0];
        assert_eq!(font["kind"], "font");
        assert_eq!(font["relativePath"], format!("game/fonts/help.{extension}"));
        let imported = root.join(format!("game/fonts/help.{extension}"));
        assert_eq!(fs::read(&imported).unwrap(), bytes);
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["assets"][0]["status"],
            "available"
        );
        composition_history(&mut service, "undo");
        assert!(!imported.exists());
        assert_eq!(
            ipc(&mut service, "authoring.list", json!({}))["assets"],
            json!([])
        );
        composition_history(&mut service, "redo");
        assert_eq!(fs::read(&imported).unwrap(), bytes);
        service.close().unwrap();
        service.open_path(&root).unwrap();
        let reopened = ipc(&mut service, "authoring.list", json!({}));
        assert_eq!(reopened["assets"][0]["id"], font["id"]);
        assert_eq!(reopened["assets"][0]["status"], "available");
    }
}
