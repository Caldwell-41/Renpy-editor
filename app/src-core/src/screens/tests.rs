use super::*;
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;

const FIXTURE: &str = include_str!("../../../../tests/fixtures/phase-3b-screens/help.rpy");
const PATH: &str = "game/ui/help.rpy";

#[path = "nested_sdk_tests.rs"]
mod nested_sdk;

#[path = "image_tests.rs"]
mod ui_images;

#[path = "style_tests.rs"]
mod styles;

#[path = "font_tests.rs"]
mod fonts;

#[path = "font_sdk_tests.rs"]
mod font_sdk;

#[path = "audit_tests.rs"]
mod audit;

#[test]
fn grid_axes_and_child_removal_refuse_ambiguous_or_strict_source_shapes() {
    for shape in [
        "conditional",
        "use",
        "expression",
        "strict",
        "missing",
        "literal-id",
    ] {
        let (_temporary, mut service, _root, owner) = composition_project();
        let grid = compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":owner["rootId"],"kind":"grid","text":""}),
        );
        let leaf = compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":grid["selectedId"],"kind":"text","text":"Known"}),
        );
        let base = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        let source = match shape {
            "conditional" => base.replace(
                "        pass\n",
                "        if enabled:\n            text \"A\"\n            text \"B\"\n",
            ),
            "use" => base.replace("        pass\n", "        use custom_cells()\n"),
            "expression" => base.replace("        pass\n", "        text variable_label\n"),
            "strict" => base
                .replace("grid 2 2:", "grid 1 1:")
                .replace("allow_underfull True", "allow_underfull False"),
            "missing" => base
                .replace("grid 2 2:", "grid 1 1:")
                .replace("        allow_underfull True\n", ""),
            _ => base.replace("        pass\n", "        id \"cells\"\n"),
        };
        save_composition_source(&mut service, &owner, &source);
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let node = doc["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == grid["selectedId"])
            .unwrap();
        let count = if matches!(shape, "strict" | "missing") {
            2
        } else {
            1
        };
        let payload = json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":{"columns":{"unit":"count","value":count},"rows":{"unit":"count","value":1}}});
        if shape == "literal-id" {
            ipc(&mut service, "screens.setLayout", payload);
            continue;
        }
        assert_eq!(
            reject(&mut service, "screens.setLayout", payload)["error"]["code"],
            "OPAQUE_BOUNDARY",
            "{shape}"
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
        if matches!(shape, "strict" | "missing") {
            assert_eq!(
                reject(
                    &mut service,
                    "screens.compose",
                    json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"remove","nodeId":leaf["selectedId"]}})
                )["error"]["code"],
                "OPAQUE_BOUNDARY"
            );
        }
        ipc(
            &mut service,
            "screens.setLayout",
            json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":{"spacing":{"unit":"pixels","value":6}}}),
        );
        let after = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
            .as_str()
            .unwrap()
            .to_owned();
        assert_eq!(
            after,
            source.replacen("        ", "        spacing 6\n        ", 1),
            "{shape}"
        );
    }
}

#[test]
fn nested_containers_compose_through_public_requests_and_restore_history() {
    let (_temporary, mut service, root, owner) = composition_project();
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    let mut parent = owner["rootId"].clone();
    for kind in ["window", "hbox", "viewport", "grid", "text"] {
        let result = compose_command(
            &mut service,
            &owner,
            json!({"type":"add", "parentId":parent, "kind":kind, "text":"Nested"}),
        );
        let node = result["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == result["selectedId"])
            .unwrap_or_else(|| panic!("{kind}: {result}"));
        assert_eq!(node["kind"], kind);
        assert!(node["protected"].as_array().unwrap().is_empty(), "{node}");
        parent = result["selectedId"].clone();
    }
    let accepted = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"].clone();
    assert!(accepted.as_str().unwrap().contains("grid 2 2:"));
    assert!(accepted.as_str().unwrap().contains("allow_underfull True"));
    for _ in 0..5 {
        composition_history(&mut service, "undo");
    }
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        original
    );
    for _ in 0..5 {
        composition_history(&mut service, "redo");
    }
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        accepted
    );
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        accepted
    );
}

#[test]
fn nested_grid_layout_is_one_minimal_change_with_capacity_and_canvas_validation() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let grid = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"grid","text":""}),
    );
    let grid_id = grid["selectedId"].clone();
    for text in ["One", "Two", "Three"] {
        compose_command(
            &mut service,
            &owner,
            json!({"type":"add","parentId":grid_id,"kind":"text","text":text}),
        );
    }
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let start = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == grid_id)
        .unwrap()["span"]["start"]
        .clone();
    let before = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let values = json!({"columns":{"unit":"count","value":3},"rows":{"unit":"count","value":1},"spacing":{"unit":"pixels","value":8}});
    let payload = json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":start,"values":values});
    let accepted = ipc(&mut service, "screens.setLayout", payload.clone());
    let after = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert_eq!(
        after,
        before.replacen("grid 2 2:", "grid 3 1:", 1).replacen(
            "        allow_underfull",
            "        spacing 8\n        allow_underfull",
            1
        )
    );
    let mut noop = payload.clone();
    noop["expectedRevision"] = accepted["revision"].clone();
    assert_eq!(
        ipc(&mut service, "screens.setLayout", noop.clone())["revision"],
        accepted["revision"]
    );
    let mut invalid = noop.clone();
    invalid["values"]["columns"]["value"] = json!(2);
    assert_eq!(
        reject(&mut service, "screens.setLayout", invalid)["error"]["code"],
        "INVALID_PAYLOAD"
    );
    let plan_request = json!({"path":owner["path"],"screenName":"notes","expectedRevision":accepted["revision"],"width":1280,"height":720});
    let plan = ipc(&mut service, "screens.canvasPlan", plan_request.clone());
    assert_eq!(plan["available"], true, "{plan}");
    assert_eq!(plan["nodes"][1]["properties"]["columns"], 3);
    assert_eq!(plan["nodes"][1]["properties"]["allow_underfull"], true);
    let mut draft = plan_request;
    draft["layouts"] = json!([{"nodeStart":start,"values":{"columns":{"unit":"count","value":1}}}]);
    assert_eq!(
        reject(&mut service, "screens.canvasPlan", draft)["error"]["code"],
        "INVALID_PAYLOAD"
    );
    composition_history(&mut service, "undo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        before
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        after
    );
}

#[test]
fn nested_viewport_keeps_unsupported_behavior_lossless_and_refuses_false_canvas_success() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let window = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"window","text":""}),
    );
    let viewport = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":window["selectedId"],"kind":"viewport","text":""}),
    );
    let doc = viewport["document"].clone();
    let node = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == viewport["selectedId"])
        .unwrap();
    let payload = json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":{"xsize":{"unit":"pixels","value":240},"ysize":{"unit":"pixels","value":80}}});
    let accepted = ipc(&mut service, "screens.setLayout", payload);
    let base = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert_eq!(
        ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":owner["path"],"screenName":"notes","expectedRevision":accepted["revision"],"width":1280,"height":720})
        )["available"],
        true
    );
    for property in [
        "mousewheel True",
        "xinitial 0.5",
        "child_size (500, 400)",
        "padding (10, 10)",
        "columns 3",
    ] {
        let source = base.replacen(
            "            xsize 240",
            &format!("            {property} # preserve exactly\n            xsize 240"),
            1,
        );
        save_composition_source(&mut service, &owner, &source);
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"width":1280,"height":720}),
        );
        assert_eq!(plan["available"], false, "{property}: {plan}");
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
    }
}

#[test]
fn nested_layout_prepares_sdk_fixture_through_public_requests() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let original = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let marker = original.lines().next().unwrap();
    let fixture = include_str!("../../../../tests/fixtures/phase-3b-screens/nested-layout.rpy")
        .replace("screen nested():", &format!("{marker}\nscreen notes():"));
    save_composition_source(&mut service, &owner, &fixture);
    let mut doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    for (kind, values) in [
        (
            "window",
            json!({"left_padding":{"unit":"pixels","value":12},"right_padding":{"unit":"pixels","value":12},"top_padding":{"unit":"pixels","value":16},"bottom_padding":{"unit":"pixels","value":16}}),
        ),
        ("hbox", json!({"spacing":{"unit":"pixels","value":20}})),
        ("grid", json!({"spacing":{"unit":"pixels","value":8}})),
        ("viewport", json!({"ysize":{"unit":"pixels","value":100}})),
    ] {
        let node = doc["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["kind"] == kind)
            .unwrap();
        doc = ipc(
            &mut service,
            "screens.setLayout",
            json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":values}),
        );
    }
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(source.contains("id \"content\""));
    assert!(source.contains("ypos 150"));
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"][0]["resolved"],
        true
    );
    let viewport = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "viewport")
        .unwrap();
    ipc(
        &mut service,
        "screens.setLayout",
        json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":viewport["span"]["start"],"values":{"ysize":{"unit":"pixels","value":200}}}),
    );
    let expanded = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    if let Some(output) = std::env::var_os("LOOMLIGHT_NESTED_INPUTS") {
        let output = std::path::PathBuf::from(output);
        fs::create_dir_all(&output).unwrap();
        fs::write(output.join("accepted.json"),serde_json::to_vec_pretty(&json!({"source":source,"sha256":hex::encode(Sha256::digest(source.as_bytes())),"expandedSource":expanded,"expandedSHA256":hex::encode(Sha256::digest(expanded.as_bytes())),"plan":plan,"publicCoreRequests":true})).unwrap()).unwrap();
    }
}

fn frame(document: &Value) -> &Value {
    document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "frame")
        .unwrap()
}

fn request(document: &Value, value: u32) -> Value {
    json!({"path":PATH,"expectedRevision":document["revision"],"screenName":"loomlight_help",
        "nodeStart":frame(document)["span"]["start"],"property":"xsize","value":value})
}

fn reject(service: &mut LifecycleService, operation: &str, mut payload: Value) -> Value {
    payload["sessionId"] = json!(service.current().unwrap().session_id);
    let result = serde_json::to_value(crate::handle_application_request(
        json!({
            "protocolVersion":1,"requestId":"screen-proof","operation":operation,"payload":payload
        }),
        false,
        service,
    ))
    .unwrap();
    assert_eq!(result["ok"], false, "{result}");
    result
}

#[test]
fn numeric_layout_refuses_unsupported_body_indentation_without_changing_source() {
    for spaces in [6, 10] {
        let temporary = tempfile::tempdir().unwrap();
        let profile = temporary.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        fs::create_dir(root.join("game/ui")).unwrap();
        let before = format!(
            "screen numeric():\n    frame:\n{}xsize 100 # keep this width\n",
            " ".repeat(spaces)
        );
        fs::write(root.join(PATH), &before).unwrap();
        service.open_path(&root).unwrap();
        let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let values = json!({"xsize":{"unit":"pixels","value":200}});
        assert_eq!(
            reject(
                &mut service,
                "screens.setLayout",
                json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"nodeStart":frame(&doc)["span"]["start"],"values":values})
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
            before
        );
        assert_eq!(
            ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
            doc["revision"]
        );
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"width":1280,"height":720}),
        );
        assert_eq!(plan["available"], false);
        assert!(!plan["limits"].as_array().unwrap().is_empty());
    }
}

#[test]
fn numeric_layout_applies_typed_coordinates_and_size_as_one_lossless_change() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = "\u{feff}# Keep this file\r\nscreen numeric():\r\n    fixed:\r\n        frame: # Keep this comment\r\n            xsize 640 # width\r\n            ysize 360\r\n            xalign 0.5 # anchored\r\n            yalign 0.5\r\n            text \"Hello\"\r\n        use custom_footer()\r\n";
    fs::write(root.join(PATH), before).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let change = |document: &Value| {
        json!({"path":PATH,"screenName":"numeric",
        "expectedRevision":document["revision"],"nodeStart":frame(document)["span"]["start"],
        "values":{"xpos":{"unit":"relative","value":0.25},"xanchor":{"unit":"relative","value":0.75},
            "ysize":{"unit":"pixels","value":320}}})
    };
    let after = ipc(&mut service, "screens.setLayout", change(&doc));
    let expected = before.replace("ysize 360", "ysize 320").replace(
        "xalign 0.5 # anchored\r\n",
        "xpos 0.25 # anchored\r\n            xanchor 0.75\r\n",
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
        expected.trim_start_matches('\u{feff}')
    );
    assert_eq!(
        ipc(&mut service, "screens.setLayout", change(&after))["revision"],
        after["revision"]
    );
    composition_history(&mut service, "undo");
    assert_eq!(fs::read(root.join(PATH)).unwrap(), before.as_bytes());
    composition_history(&mut service, "redo");
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
        after["revision"]
    );
}

#[test]
fn numeric_layout_adds_properties_to_a_leaf_at_end_of_file() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(
        root.join(PATH),
        "screen numeric():\n    fixed:\n        text \"End\"",
    )
    .unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let node = &doc["screens"][0]["nodes"][2];
    ipc(
        &mut service,
        "screens.setLayout",
        json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":{"xsize":{"unit":"pixels","value":100}}}),
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
        "screen numeric():\n    fixed:\n        text \"End\":\n            xsize 100\n"
    );
}

#[test]
fn numeric_layout_canvas_draft_preserves_units_and_uses_the_saved_validation_rules() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = "screen numeric():\n    fixed:\n        frame:\n            xsize 640\n            ysize 360\n            xalign 0.5\n            yalign 0.5\n            padding (24, 24)\n            text \"Help\"\n";
    fs::write(root.join(PATH), before).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let request = json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"width":1280,"height":720,
        "layouts":[{"nodeStart":frame(&doc)["span"]["start"],"values":{"xpos":{"unit":"pixels","value":0},"ypos":{"unit":"relative","value":0.0},"left_padding":{"unit":"pixels","value":32}}}]});
    let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
    let properties = &plan["nodes"][2]["properties"];
    assert!(
        properties["xpos"].is_i64(),
        "zero pixels must remain an integer"
    );
    assert!(
        properties["ypos"].is_f64(),
        "relative zero must remain a float"
    );
    assert!(properties["xalign"].is_null());
    assert!(properties["padding"].is_null());
    assert_eq!(properties["left_padding"], 32);
    assert_eq!(properties["right_padding"], 24);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), before.as_bytes());
    let mut invalid = request;
    invalid["layouts"][0]["values"]["xsize"] = json!({"unit":"relative","value":0.5});
    assert_eq!(
        reject(&mut service, "screens.canvasPlan", invalid)["error"]["code"],
        "INVALID_PAYLOAD"
    );
}

#[test]
fn numeric_layout_prepares_the_pinned_sdk_geometry_fixture_through_public_operations() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = include_str!("../../../../tests/fixtures/phase-3b-screens/numeric-layout.rpy");
    fs::write(root.join(PATH), before).unwrap();
    service.open_path(&root).unwrap();
    let mut doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    for (kind, width, values) in [
        (
            "frame",
            Some(300.0),
            json!({"xpos":{"unit":"relative","value":0.75},"xsize":{"unit":"pixels","value":320},"left_padding":{"unit":"pixels","value":16},"right_padding":{"unit":"pixels","value":16},"top_padding":{"unit":"pixels","value":20},"bottom_padding":{"unit":"pixels","value":20}}),
        ),
        (
            "frame",
            None,
            json!({"xminimum":{"unit":"pixels","value":260},"xmaximum":{"unit":"pixels","value":260}}),
        ),
        (
            "vbox",
            Some(100.0),
            json!({"spacing":{"unit":"pixels","value":12}}),
        ),
    ] {
        let node = doc["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|node| {
                node["kind"] == kind
                    && node["numericLayout"]["values"]["xsize"]["value"].as_f64() == width
            })
            .unwrap();
        doc = ipc(
            &mut service,
            "screens.setLayout",
            json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":values}),
        );
    }
    let caption = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["literal"] == "First")
        .unwrap();
    assert_eq!(
        reject(
            &mut service,
            "screens.setLayout",
            json!({"path":PATH,"screenName":"numeric","expectedRevision":doc["revision"],"nodeStart":caption["span"]["start"],"values":{"ypos":{"unit":"relative","value":0.75}}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    let accepted = fs::read(root.join(PATH)).unwrap();
    let expected = before
        .replacen("xpos 0.5", "xpos 0.75", 1)
        .replacen("xsize 300", "xsize 320", 1)
        .replacen("padding (12, 18)", "padding (16, 20)", 1)
        .replace("xminimum 240", "xminimum 260")
        .replace("xmaximum 240", "xmaximum 260")
        .replace("spacing 8", "spacing 12");
    assert_eq!(accepted, expected.as_bytes());
    if let Some(output) = std::env::var_os("LOOMLIGHT_NUMERIC_EVIDENCE") {
        let output = std::path::PathBuf::from(output);
        fs::create_dir_all(&output).unwrap();
        fs::write(output.join("accepted.rpy"), &accepted).unwrap();
        fs::write(output.join("accepted.json"), serde_json::to_vec_pretty(&json!({"sha256":hex::encode(Sha256::digest(&accepted)),"source":expected,"document":doc,"parentConstraintRejected":true})).unwrap()).unwrap();
    }
}

#[test]
fn numeric_layout_refuses_tuple_values_and_malformed_aliases_without_writing() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    service.open_path(&root).unwrap();
    for property in [
        "xpos (1,)",
        "pos (1,,0.5)",
        "xalign (0.5,)",
        "xpos 1\n            xsize 40",
    ] {
        let before =
            format!("screen numeric():\n    frame:\n        {property}\n        text \"Keep\"\n");
        fs::write(root.join(PATH), &before).unwrap();
        let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let request = json!({"path":PATH,"screenName":"numeric","expectedRevision":document["revision"],"nodeStart":frame(&document)["span"]["start"],"values":{"xpos":{"unit":"pixels","value":12}}});
        assert_eq!(
            reject(&mut service, "screens.setLayout", request)["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(fs::read(root.join(PATH)).unwrap(), before.as_bytes());
    }
}

#[test]
fn numeric_layout_refuses_to_split_an_alias_with_an_ambiguous_setter() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = "screen numeric():\n    frame:\n        align (0.5, 0.5) # preserve alias\n        xpos 100 # preserve override\n        text \"Keep\"\n";
    fs::write(root.join(PATH), before).unwrap();
    service.open_path(&root).unwrap();
    let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let request = json!({"path":PATH,"screenName":"numeric","expectedRevision":document["revision"],"nodeStart":frame(&document)["span"]["start"],"values":{"ypos":{"unit":"relative","value":0.75}}});
    assert_eq!(
        reject(&mut service, "screens.setLayout", request)["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), before.as_bytes());
}

#[test]
fn numeric_layout_refuses_bounds_that_the_selected_displayable_cannot_apply() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    service.open_path(&root).unwrap();
    for (header, property) in [
        ("text \"Keep\"", "xminimum"),
        ("add \"assets/help.png\"", "xmaximum"),
        ("add \"assets/help.png\"", "yminimum"),
    ] {
        let before = format!("screen numeric():\n    {header}:\n        pass\n");
        fs::write(root.join(PATH), &before).unwrap();
        let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let node = &document["screens"][0]["nodes"][1];
        assert_eq!(
            reject(
                &mut service,
                "screens.setLayout",
                json!({"path":PATH,"screenName":"numeric","expectedRevision":document["revision"],"nodeStart":node["span"]["start"],"values":{property:{"unit":"pixels","value":100}}})
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(fs::read(root.join(PATH)).unwrap(), before.as_bytes());
        if header.starts_with("add ") {
            fs::write(
                root.join(PATH),
                before.replace("pass", &format!("{property} 100")),
            )
            .unwrap();
            let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
            let plan = ipc(
                &mut service,
                "screens.canvasPlan",
                json!({"path":PATH,"screenName":"numeric","expectedRevision":document["revision"],"width":1280,"height":720}),
            );
            assert!(
                plan["limits"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|limit| limit.as_str().unwrap().contains(property)),
                "Unsupported image bounds must not reach the helper: {plan}"
            );
        }
    }
}

#[test]
fn numeric_layout_keeps_an_owned_empty_frame_eligible_for_composition() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let fixed = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"fixed","text":""}),
    );
    let frame = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":fixed["selectedId"],"kind":"frame","text":""}),
    );
    let document = &frame["document"];
    let node = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["id"] == frame["selectedId"])
        .unwrap();
    ipc(
        &mut service,
        "screens.setLayout",
        json!({"path":owner["path"],"screenName":"notes","expectedRevision":document["revision"],"nodeStart":node["span"]["start"],"values":{"xpos":{"unit":"pixels","value":100},"xsize":{"unit":"pixels","value":320},"ysize":{"unit":"pixels","value":180}}}),
    );
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":frame["selectedId"],"kind":"vbox","text":""}),
    );
    assert!(added["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|node| node["id"] == added["selectedId"] && node["kind"] == "vbox"));
}

#[test]
fn owned_composition_adds_one_element_with_stable_identity_through_history_and_reopen() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let catalog = ipc(
        &mut service,
        "screens.create",
        json!({"name":"notes",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owned = catalog["owned"][0].clone();
    let path = "game/ui/notes.rpy";
    let before = fs::read(root.join(path)).unwrap();
    let document = ipc(&mut service, "screens.inspect", json!({"path":path}));
    let result = ipc(
        &mut service,
        "screens.compose",
        json!({"screenId":owned["id"],
        "expectedRevision":document["revision"],
        "command":{"type":"add","parentId":owned["rootId"],"kind":"vbox","text":""}}),
    );
    let id = result["selectedId"].as_str().unwrap().to_owned();
    assert_ne!(id, owned["rootId"]);
    let after = fs::read(root.join(path)).unwrap();
    assert!(
        after.starts_with(&before),
        "An addition preserves every existing source byte"
    );
    assert!(String::from_utf8(after.clone())
        .unwrap()
        .contains(&format!("vbox: # loomlight-element: {id}\n        pass\n")));
    let history = |service: &mut LifecycleService, kind: &str| {
        let model = ipc(service, "scene.list", json!({}));
        ipc(
            service,
            "scene.apply",
            json!({"expectedProjectRevision":model["projectRevision"],
            "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":kind}}),
        );
    };
    history(&mut service, "undo");
    assert_eq!(fs::read(root.join(path)).unwrap(), before);
    history(&mut service, "redo");
    assert_eq!(fs::read(root.join(path)).unwrap(), after);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(&mut service, "screens.inspect", json!({"path":path}));
    assert_eq!(reopened["screens"][0]["nodes"][1]["id"], id);
    assert_eq!(reopened["screens"][0]["nodes"][0]["id"], owned["rootId"]);
}

fn composition_project() -> (
    tempfile::TempDir,
    LifecycleService,
    std::path::PathBuf,
    Value,
) {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"notes",
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    (temporary, service, root, created["owned"][0].clone())
}

fn compose_command(service: &mut LifecycleService, owner: &Value, command: Value) -> Value {
    let doc = ipc(service, "screens.inspect", json!({"path":owner["path"]}));
    ipc(
        service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command}),
    )
}

fn composition_history(service: &mut LifecycleService, kind: &str) {
    let model = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":kind}}),
    );
}

fn save_composition_source(service: &mut LifecycleService, owner: &Value, text: &str) {
    let source = ipc(service, "source.open", json!({"path":owner["path"]}));
    let draft = ipc(
        service,
        "source.updateDraft",
        json!({"path":owner["path"],
        "expectedBaseRevision":source["baseRevision"], "text":text,"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        service,
        "source.save",
        json!({"path":owner["path"],
        "expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
}

#[test]
fn owned_geometry_preserves_document_ownership_and_history_for_unchanged_and_changed_saves() {
    let (_temporary, mut service, root, owner) = composition_project();
    let source_path = owner["path"].as_str().unwrap();
    let blank = fs::read_to_string(root.join(source_path)).unwrap();
    let source = format!(
        "{blank}    fixed: # loomlight-element: 00000000-0000-4000-8000-000000000003\n        frame: # loomlight-element: 00000000-0000-4000-8000-000000000001\n            xsize 640\n            ysize 360\n            xalign 0.5\n            yalign 0.5\n            text \"Retained\" # loomlight-element: 00000000-0000-4000-8000-000000000002\n    use custom_footer()\n"
    );
    save_composition_source(&mut service, &owner, &source);
    let document = ipc(&mut service, "screens.inspect", json!({"path":source_path}));
    assert_eq!(document["screens"][0]["nodes"][0]["id"], owner["rootId"]);
    assert!(document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|node| node["kind"] == "custom"));
    assert!(!frame(&document)["position"].is_null());
    for (operation, values) in [
        ("screens.setSize", json!({"width":640,"height":360})),
        (
            "screens.setPixelProperty",
            json!({"property":"xsize","value":640}),
        ),
        ("screens.setPosition", json!({"xalign":0.5,"yalign":0.5})),
    ] {
        let mut payload = json!({"path":source_path,"expectedRevision":document["revision"],
            "screenName":"notes","nodeStart":frame(&document)["span"]["start"]});
        payload
            .as_object_mut()
            .unwrap()
            .extend(values.as_object().unwrap().clone());
        let unchanged = ipc(&mut service, operation, payload);
        assert_eq!(
            unchanged, document,
            "{operation} must retain the owned document"
        );
        assert_eq!(fs::read(root.join(source_path)).unwrap(), source.as_bytes());
    }
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read(root.join(source_path)).unwrap(),
        blank.as_bytes(),
        "No-op geometry saves must not add an Undo entry"
    );
    composition_history(&mut service, "redo");
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":source_path})),
        document
    );
    let mut document = document;
    let mut source = source;
    for (operation, values, before, after) in [
        (
            "screens.setSize",
            json!({"width":720,"height":400}),
            "xsize 640\n            ysize 360",
            "xsize 720\n            ysize 400",
        ),
        (
            "screens.setPixelProperty",
            json!({"property":"xsize","value":800}),
            "xsize 720",
            "xsize 800",
        ),
        (
            "screens.setPosition",
            json!({"xalign":0.25,"yalign":0.75}),
            "xalign 0.5\n            yalign 0.5",
            "xalign 0.25\n            yalign 0.75",
        ),
    ] {
        let mut payload = json!({"path":source_path,"expectedRevision":document["revision"],
            "screenName":"notes","nodeStart":frame(&document)["span"]["start"]});
        payload
            .as_object_mut()
            .unwrap()
            .extend(values.as_object().unwrap().clone());
        let changed = ipc(&mut service, operation, payload);
        let expected = source.replace(before, after);
        assert_ne!(expected, source);
        assert_eq!(
            fs::read(root.join(source_path)).unwrap(),
            expected.as_bytes()
        );
        assert_eq!(
            changed,
            ipc(&mut service, "screens.inspect", json!({"path":source_path})),
            "{operation} must return the complete inspected document"
        );
        assert_eq!(changed["screens"][0]["nodes"][0]["id"], owner["rootId"]);
        assert_eq!(
            changed["screens"][0]["nodes"].as_array().unwrap().len(),
            document["screens"][0]["nodes"].as_array().unwrap().len()
        );
        composition_history(&mut service, "undo");
        assert_eq!(fs::read(root.join(source_path)).unwrap(), source.as_bytes());
        assert_eq!(
            ipc(&mut service, "screens.inspect", json!({"path":source_path})),
            document
        );
        composition_history(&mut service, "redo");
        assert_eq!(
            fs::read(root.join(source_path)).unwrap(),
            expected.as_bytes()
        );
        assert_eq!(
            ipc(&mut service, "screens.inspect", json!({"path":source_path})),
            changed
        );
        source = expected;
        document = changed;
    }
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":source_path})),
        document
    );
}

#[test]
fn owned_composition_text_changes_only_the_literal_preserving_identity_comments_and_noop_history() {
    let (_temporary, mut service, root, owner) = composition_project();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Before"}),
    );
    let path = root.join(owner["path"].as_str().unwrap());
    let before = fs::read_to_string(&path).unwrap();
    let text = "After \"quoted\"\n第二行";
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"text","nodeId":added["selectedId"],"text":text}),
    );
    assert_eq!(result["selectedId"], added["selectedId"]);
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        before.replace("\"Before\"", "\"After \\\"quoted\\\"\\n第二行\"")
    );
    let noop = compose_command(
        &mut service,
        &owner,
        json!({"type":"text","nodeId":added["selectedId"],"text":text}),
    );
    assert_eq!(noop["document"]["revision"], result["document"]["revision"]);
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        before,
        "No-op adds no history entry"
    );
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(doc["screens"][0]["nodes"][1]["literal"], text);
    assert_eq!(doc["screens"][0]["nodes"][1]["id"], added["selectedId"]);
}

#[test]
fn owned_composition_reorders_whole_groups_without_changing_their_children_or_identity() {
    let (_temporary, mut service, root, owner) = composition_project();
    let a = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    )["selectedId"]
        .clone();
    let child = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":a,"kind":"text","text":"Grouped child"}),
    )["selectedId"]
        .clone();
    let b = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"fixed","text":""}),
    )["selectedId"]
        .clone();
    let path = root.join(owner["path"].as_str().unwrap());
    let before = fs::read_to_string(&path).unwrap();
    let a_block = format!("    vbox: # loomlight-element: {}\n        pass\n        text \"Grouped child\" # loomlight-element: {}\n", a.as_str().unwrap(), child.as_str().unwrap());
    let b_block = format!(
        "    fixed: # loomlight-element: {}\n        pass\n",
        b.as_str().unwrap()
    );
    assert!(before.contains(&format!("{a_block}{b_block}")));
    let after = compose_command(
        &mut service,
        &owner,
        json!({"type":"reorder","nodeId":a,"targetId":b,"after":true}),
    );
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        before.replace(
            &format!("{a_block}{b_block}"),
            &format!("{b_block}{a_block}")
        )
    );
    assert_eq!(after["selectedId"], a);
    let nodes = after["document"]["screens"][0]["nodes"].as_array().unwrap();
    assert_eq!(
        nodes.iter().map(|n| n["id"].clone()).collect::<Vec<_>>(),
        vec![owner["rootId"].clone(), b.clone(), a.clone(), child.clone()]
    );
    let noop = compose_command(
        &mut service,
        &owner,
        json!({"type":"reorder","nodeId":a,"targetId":b,"after":true}),
    );
    assert_eq!(noop["document"]["revision"], after["document"]["revision"]);
    composition_history(&mut service, "undo");
    assert_eq!(fs::read_to_string(&path).unwrap(), before);
    composition_history(&mut service, "redo");
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(reopened["screens"], after["document"]["screens"]);
}

#[test]
fn owned_composition_refuses_reorder_after_an_unterminated_final_sibling_without_writing() {
    let (_temporary, mut service, root, owner) = composition_project();
    let a = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"A"}),
    )["selectedId"]
        .clone();
    let b = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"B"}),
    )["selectedId"]
        .clone();
    let path = root.join(owner["path"].as_str().unwrap());
    let terminated = fs::read_to_string(&path).unwrap();
    let before = terminated.trim_end_matches('\n');
    save_composition_source(&mut service, &owner, before);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],
        "command":{"type":"reorder","nodeId":a,"targetId":b,"after":true}}),
    );
    assert_eq!(fs::read_to_string(&path).unwrap(), before);
    let unchanged = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(unchanged, doc);
    composition_history(&mut service, "undo");
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        terminated,
        "Refusal adds no history entry"
    );
}

#[test]
fn owned_composition_removal_selects_an_unmarked_next_sibling_without_granting_edit_authority() {
    let (_temporary, mut service, root, owner) = composition_project();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Owned"}),
    );
    let path = root.join(owner["path"].as_str().unwrap());
    let owned_source = fs::read_to_string(&path).unwrap();
    save_composition_source(
        &mut service,
        &owner,
        &format!("{owned_source}    text \"Source authored\"\n"),
    );
    let before = fs::read_to_string(&path).unwrap();
    let removed = compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":added["selectedId"]}),
    );
    let sibling = &removed["document"]["screens"][0]["nodes"][1];
    assert_eq!(sibling["literal"], "Source authored");
    assert!(sibling["id"].is_null());
    assert_eq!(
        removed["selectedId"],
        format!("source-at-{}", sibling["span"]["start"])
    );
    let after = fs::read_to_string(&path).unwrap();
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":removed["document"]["revision"],
        "command":{"type":"remove","nodeId":removed["selectedId"]}}),
    );
    assert_eq!(fs::read_to_string(&path).unwrap(), after);
    composition_history(&mut service, "undo");
    assert_eq!(fs::read_to_string(&path).unwrap(), before);
    composition_history(&mut service, "redo");
    assert_eq!(fs::read_to_string(&path).unwrap(), after);
}

#[test]
fn owned_composition_removes_exact_subtree_and_returns_next_previous_or_parent_selection() {
    let (_temporary, mut service, root, owner) = composition_project();
    let group = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    )["selectedId"]
        .clone();
    let child = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":group,"kind":"text","text":"Grouped child"}),
    )["selectedId"]
        .clone();
    let next = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Keep me"}),
    )["selectedId"]
        .clone();
    let path = root.join(owner["path"].as_str().unwrap());
    let before = fs::read_to_string(&path).unwrap();
    let group_block = format!("    vbox: # loomlight-element: {}\n        pass\n        text \"Grouped child\" # loomlight-element: {}\n",group.as_str().unwrap(),child.as_str().unwrap());
    let removed = compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":group}),
    );
    assert_eq!(removed["selectedId"], next);
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        before.replace(&group_block, "")
    );
    composition_history(&mut service, "undo");
    assert_eq!(fs::read_to_string(&path).unwrap(), before);
    composition_history(&mut service, "redo");
    composition_history(&mut service, "undo");
    let previous = compose_command(&mut service, &owner, json!({"type":"remove","nodeId":next}));
    assert_eq!(previous["selectedId"], group);
    let parent = compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":group}),
    );
    assert_eq!(parent["selectedId"], owner["rootId"]);
    assert!(fs::read_to_string(&path)
        .unwrap()
        .ends_with("screen notes():\n    pass\n"));
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(doc["screens"], parent["document"]["screens"]);
}

#[test]
fn owned_composition_protected_neighbors_stay_visible_and_refuse_unsafe_operations() {
    let (_temporary, mut service, root, owner) = composition_project();
    let group = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    )["selectedId"]
        .clone();
    let text = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":group,"kind":"text","text":"Before"}),
    )["selectedId"]
        .clone();
    let last = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"frame","text":""}),
    )["selectedId"]
        .clone();
    let path = root.join(owner["path"].as_str().unwrap());
    let ordinary = fs::read_to_string(&path).unwrap();
    let external = format!(
        "\u{feff}{}",
        ordinary
            .replace(
                "    frame:",
                "    use extra_notes()  # opaque neighbor\n    frame:"
            )
            .replace('\n', "\r\n")
    );
    fs::write(&path, &external).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let custom = doc["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "custom")
        .expect("Source-only children stay selectable");
    assert_eq!(custom["literal"], "use extra_notes()");
    for command in [
        json!({"type":"reorder","nodeId":group,"targetId":last,"after":true}),
        json!({"type":"remove","nodeId":custom["id"]}),
        json!({"type":"remove","nodeId":owner["rootId"]}),
    ] {
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command})
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(fs::read_to_string(&path).unwrap(), external);
    }
    let edited = compose_command(
        &mut service,
        &owner,
        json!({"type":"text","nodeId":text,"text":"Accepted"}),
    );
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        external.replace("\"Before\"", "\"Accepted\"")
    );
    let stale = reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"remove","nodeId":text}}),
    );
    assert_eq!(stale["error"]["code"], "SOURCE_CONFLICT");
    let before_remove = fs::read_to_string(&path).unwrap();
    let removed = compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":group}),
    );
    assert_eq!(
        removed["selectedId"], custom["id"],
        "The next sibling may be a source-only element"
    );
    assert!(fs::read_to_string(&path)
        .unwrap()
        .contains("    use extra_notes()  # opaque neighbor\r\n"));
    composition_history(&mut service, "undo");
    assert_eq!(fs::read_to_string(&path).unwrap(), before_remove);
    assert_eq!(
        edited["document"]["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["kind"] == "custom")
            .unwrap()["id"],
        custom["id"]
    );
}

#[test]
fn owned_composition_refuses_parent_protection_and_dirty_drafts_and_keeps_an_empty_body_valid() {
    let (_temporary, mut service, root, owner) = composition_project();
    let frame = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"frame","text":""}),
    )["selectedId"]
        .clone();
    let child = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":frame,"kind":"text","text":"Child"}),
    )["selectedId"]
        .clone();
    let path = root.join(owner["path"].as_str().unwrap());
    let saved = fs::read_to_string(&path).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    for command in [
        json!({"type":"add","parentId":frame,"kind":"text","text":"Second child"}),
        json!({"type":"add","parentId":child,"kind":"text","text":"Cannot nest under text"}),
    ] {
        assert_eq!(
            reject(
                &mut service,
                "screens.compose",
                json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command})
            )["error"]["code"],
            "OPAQUE_BOUNDARY"
        );
        assert_eq!(fs::read_to_string(&path).unwrap(), saved);
    }
    let opened = ipc(&mut service, "source.open", json!({"path":owner["path"]}));
    let dirty = format!("{}# unfinished source", opened["text"].as_str().unwrap());
    ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":owner["path"],"expectedBaseRevision":opened["baseRevision"],"text":dirty,"selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"remove","nodeId":child}})
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
        dirty
    );
    ipc(
        &mut service,
        "source.discard",
        json!({"path":owner["path"]}),
    );
    let protected = saved.replace(
        "        pass\n",
        "        if custom_flag:\n            text \"Protected child\"\n",
    );
    fs::write(&path, &protected).unwrap();
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.compose",
            json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"remove","nodeId":frame}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(fs::read_to_string(&path).unwrap(), protected);
    let without_pass = saved.replace("        pass\n", "");
    fs::write(&path, &without_pass).unwrap();
    compose_command(
        &mut service,
        &owner,
        json!({"type":"remove","nodeId":child}),
    );
    let expected = without_pass
        .lines()
        .filter(|line| !line.contains("text \"Child\""))
        .collect::<Vec<_>>()
        .join("\n")
        + "\n        pass\n";
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        expected,
        "Removing the final statement retains a syntactically valid body"
    );
}

#[test]
fn owned_addition_structure_agrees_between_canvas_draft_and_saved_edit() {
    for (parent_kind, existing, kind, allowed) in [
        ("screen", "", "text", true),
        ("fixed", "", "frame", true),
        ("frame", "", "vbox", true),
        ("vbox", "", "textbutton", true),
        ("text", "", "text", false),
        ("frame", "child", "text", false),
        ("frame", "protected", "text", false),
        ("fixed", "protected", "text", true),
        ("screen", "", "hbox", true),
    ] {
        let (_temporary, mut service, root, owner) = composition_project();
        let parent_id = if parent_kind == "screen" {
            owner["rootId"].clone()
        } else {
            compose_command(
                &mut service,
                &owner,
                json!({"type":"add","parentId":owner["rootId"],"kind":parent_kind,"text":"Parent"}),
            )["selectedId"]
                .clone()
        };
        let path = root.join(owner["path"].as_str().unwrap());
        if existing == "child" {
            compose_command(
                &mut service,
                &owner,
                json!({"type":"add","parentId":parent_id,"kind":"text","text":"Existing child"}),
            );
        } else if existing == "protected" {
            let source = fs::read_to_string(&path).unwrap().replace(
                "        pass\n",
                "        if custom_flag:\n            text \"Protected child\"\n",
            );
            save_composition_source(&mut service, &owner, &source);
        }
        let document = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let parent = document["screens"][0]["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|n| n["id"] == parent_id)
            .unwrap();
        let before = fs::read(&path).unwrap();
        let draft = json!({"path":owner["path"],"screenName":"notes","expectedRevision":document["revision"],
            "width":1280,"height":720,"drafts":[],"addition":{"parentStart":parent["span"]["start"],"kind":kind,"text":"New child"}});
        let saved = json!({"screenId":owner["id"],"expectedRevision":document["revision"],
            "command":{"type":"add","parentId":parent_id,"kind":kind,"text":"New child"}});
        if allowed {
            let plan = ipc(&mut service, "screens.canvasPlan", draft);
            let addition = plan["nodes"].as_array().unwrap().last().unwrap();
            assert_eq!(addition["kind"], kind);
            assert_eq!(addition["parent"], parent["span"]["start"]);
            assert_eq!(fs::read(&path).unwrap(), before);
            let accepted = ipc(&mut service, "screens.compose", saved);
            assert!(accepted["document"]["screens"][0]["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|n| n["id"] == accepted["selectedId"] && n["kind"] == kind));
        } else {
            assert_eq!(
                reject(&mut service, "screens.canvasPlan", draft)["error"]["code"],
                "INVALID_PAYLOAD"
            );
            assert_eq!(
                reject(&mut service, "screens.compose", saved)["error"]["code"],
                "OPAQUE_BOUNDARY"
            );
            assert_eq!(fs::read(&path).unwrap(), before);
        }
    }
}

#[test]
fn owned_addition_canvas_keeps_unfinished_text_while_saved_add_requires_text() {
    let (_temporary, mut service, root, owner) = composition_project();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let parent = &document["screens"][0]["nodes"][0];
    let path = root.join(owner["path"].as_str().unwrap());
    let before = fs::read(&path).unwrap();
    for kind in ["text", "textbutton"] {
        for text in ["", "  "] {
            let plan = ipc(
                &mut service,
                "screens.canvasPlan",
                json!({"path":owner["path"],"screenName":"notes","expectedRevision":document["revision"],
                    "width":1280,"height":720,"drafts":[],"addition":{"parentStart":parent["span"]["start"],"kind":kind,"text":text}}),
            );
            assert_eq!(
                plan["nodes"].as_array().unwrap().last().unwrap()["literal"],
                text
            );
            assert_eq!(
                reject(
                    &mut service,
                    "screens.compose",
                    json!({"screenId":owner["id"],"expectedRevision":document["revision"],
                        "command":{"type":"add","parentId":owner["rootId"],"kind":kind,"text":text}}),
                )["error"]["code"],
                "INVALID_PAYLOAD"
            );
            assert_eq!(fs::read(&path).unwrap(), before);
        }
    }
}

#[test]
fn owned_composition_canvas_addition_is_inert_revision_bound_and_never_changes_source() {
    let (_temporary, mut service, root, owner) = composition_project();
    let group = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"vbox","text":""}),
    )["selectedId"]
        .clone();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let parent = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == group)
        .unwrap();
    let path = root.join(owner["path"].as_str().unwrap());
    let before = fs::read(&path).unwrap();
    let payload = json!({"path":owner["path"],"screenName":"notes","expectedRevision":document["revision"],
        "width":1280,"height":720,"drafts":[],"addition":{"parentStart":parent["span"]["start"],"kind":"text","text":"Unapplied draft"}});
    let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
    assert_eq!(
        plan["nodes"].as_array().unwrap().last().unwrap()["literal"],
        "Unapplied draft"
    );
    assert_eq!(
        plan["nodes"].as_array().unwrap().last().unwrap()["parent"],
        parent["span"]["start"]
    );
    assert_eq!(fs::read(&path).unwrap(), before);
    let mut stale = payload;
    stale["expectedRevision"] = json!("stale");
    assert_eq!(
        reject(&mut service, "screens.canvasPlan", stale)["error"]["code"],
        "SOURCE_CONFLICT"
    );
}

#[test]
fn canvas_plan_uses_saved_literals_and_revision_bound_drafts_without_running_neighbors() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), "init python:\n    raise Exception('must never run')\n\nscreen help():\n    frame:\n        xsize 640\n        ysize 360\n        xalign 0.5\n        vbox:\n            spacing 12\n            text \"Help [unknown]\":\n                size 28\n").unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let request = json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],
        "width":1280,"height":720,"drafts":[{"nodeStart":frame(&doc)["span"]["start"],"width":760,"height":360}]});
    let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
    assert_eq!(
        plan["available"], false,
        "Custom initialization and unsampled interpolation remain explicit"
    );
    assert_eq!(plan["nodes"][1]["properties"]["xsize"], 760);
    assert_eq!(plan["nodes"][2]["properties"]["spacing"], 12);
    assert_eq!(plan["nodes"][3]["literal"], "Help [unknown]");
    let mut sampled = request.clone();
    sampled["textSamples"] = json!([{"nodeStart":doc["screens"][0]["nodes"][3]["span"]["start"],"value":"Literal sample [value]"}]);
    sampled["buttonState"] = json!("hover");
    let sample = ipc(&mut service, "screens.canvasPlan", sampled);
    assert_eq!(sample["nodes"][3]["literal"], "Literal sample [value]");
    assert_eq!(sample["buttonState"], "hover");
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
        doc["revision"]
    );
    let mut stale = request;
    stale["expectedRevision"] = json!("stale");
    assert_eq!(
        reject(&mut service, "screens.canvasPlan", stale)["error"]["code"],
        "SOURCE_CONFLICT"
    );
}

#[test]
fn canvas_refuses_unknown_layout_and_retains_source_when_the_sdk_is_unavailable() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), "screen help():\n    frame:\n        xsize 640\n        ysize 360\n        padding calculate_padding()\n        text \"Help\"\n").unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let request = json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],"width":1280,"height":720});
    let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
    assert_eq!(plan["available"], false);
    assert!(plan["limits"]
        .as_array()
        .unwrap()
        .iter()
        .any(|v| v.as_str().unwrap().contains("padding")));
    let unavailable = ipc(&mut service, "screens.canvasRender", request.clone());
    assert_eq!(unavailable["phase"], "unavailable");
    assert!(unavailable["image"].is_null());
    let plan = ipc(&mut service, "screens.canvasPlan", request);
    assert_eq!(plan["revision"], doc["revision"]);
    service.close().unwrap();
    assert!(!profile.read_dir().unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
}

#[test]
fn canvas_representative_plan_preserves_padding_and_excludes_game_actions() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(
        root.join(PATH),
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/canvas-help.rpy"),
    )
    .unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":PATH,"screenName":"loomlight_help","expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    assert_eq!(plan["available"], true, "{plan}");
    assert_eq!(plan["nodes"][2]["properties"]["padding"], json!([24, 24]));
    assert!(!plan.to_string().contains("Return"));
}

#[test]
fn canvas_marks_inherited_styles_and_unsampled_interpolation_unavailable() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), "screen help():\n    text \"[unknown]\"\n").unwrap();
    fs::write(
        root.join("game/ui/styles.rpy"),
        "style default:\n    size 80\n",
    )
    .unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    assert_eq!(
        plan["available"], false,
        "Unresolved inherited styles and expressions cannot be presented as qualified pixels"
    );
    let limits = plan["limits"].to_string();
    assert!(limits.contains("styles.rpy"));
    assert!(limits.contains("sample"));
}

#[test]
#[ignore = "selected pinned-SDK canvas lifecycle proof; four helper launches"]
fn canvas_helper_sdk_renders_saved_data_and_stops_on_project_close() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("verified SDK archive");
    let sdk =
        crate::renpy::install_supported_sdk_from_archive(&profile, std::path::Path::new(&archive))
            .unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::create_dir_all(root.join("game/assets")).unwrap();
    fs::copy(
        sdk.root.join("renpy/common/DejaVuSans.ttf"),
        root.join("game/assets/canvas.ttf"),
    )
    .unwrap();
    fs::write(root.join(PATH), "screen help():\n    frame:\n        xsize 640\n        ysize 360\n        xalign 0.5\n        yalign 0.5\n        background \"#202938\"\n        vbox:\n            spacing 12\n            text \"Help café. A long sentence wraps onto several lines in this deliberately narrow text box.\":\n                font \"assets/canvas.ttf\"\n                size 28\n                xsize 300\n                color \"#f4e4d0\"\n").unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    for (width, height) in [(1280, 720), (1024, 768)] {
        let response = ipc(
            &mut service,
            "screens.canvasRender",
            json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],"width":width,"height":height}),
        );
        assert_eq!(response["phase"], "starting", "{response}");
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
        let ready = loop {
            let value = ipc(
                &mut service,
                "screens.canvasStatus",
                json!({"frameId":response["frameId"]}),
            );
            if value["phase"] == "ready" {
                break value;
            }
            if value["phase"] != "starting" || std::time::Instant::now() >= deadline {
                if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
                    let output = std::path::PathBuf::from(output);
                    fs::create_dir_all(&output).unwrap();
                    for entry in profile.read_dir().unwrap().flatten() {
                        if entry
                            .file_name()
                            .to_string_lossy()
                            .starts_with("canvas-helper-")
                        {
                            for name in [
                                "log.txt",
                                "traceback.txt",
                                "startup-refusal.json",
                                "desktop-closed.json",
                            ] {
                                if entry.path().join(name).is_file() {
                                    fs::copy(entry.path().join(name), output.join(name)).unwrap();
                                }
                            }
                        }
                    }
                }
            }
            assert_eq!(value["phase"], "starting", "{value}");
            assert!(std::time::Instant::now() < deadline, "{value}");
            std::thread::sleep(std::time::Duration::from_millis(16));
        };
        assert!(ready["image"]
            .as_str()
            .unwrap()
            .starts_with("data:image/png;base64,"));
        assert_eq!(
            ready["renderer"],
            if cfg!(windows) { "angle2" } else { "gl2" }
        );
        assert_eq!(ready["width"], width);
        assert_eq!(ready["height"], height);
        assert_eq!(ready["geometry"][1]["width"].as_f64(), Some(640.0));
        assert_eq!(
            ready["geometry"][1]["x"].as_f64(),
            Some(((width - 640) / 2) as f64)
        );
        assert_eq!(
            ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
            doc["revision"]
        );
        if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
            let output = std::path::PathBuf::from(output);
            fs::create_dir_all(&output).unwrap();
            fs::write(
                output.join(format!("helper-{width}x{height}.json")),
                serde_json::to_vec_pretty(&ready).unwrap(),
            )
            .unwrap();
        }
    }
    let helper = profile
        .read_dir()
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .find(|path| {
            path.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with("canvas-helper-")
        })
        .unwrap();
    let log = fs::read_to_string(helper.join("log.txt")).unwrap();
    assert!(
        !log.contains("Backing up script files to"),
        "Generated helper code must not be backed up outside its private directory"
    );
    if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
        fs::write(
            std::path::PathBuf::from(output).join("helper-log.txt"),
            &log,
        )
        .unwrap();
    }
    service.close().unwrap();
    let shutdown = service.canvas_shutdown_report().unwrap();
    assert!(
        shutdown.cleanup_complete && shutdown.cooperative,
        "{shutdown:?}"
    );
    assert_eq!(shutdown.exit_code, Some(0));
    if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
        fs::write(
            std::path::PathBuf::from(output).join("shutdown.json"),
            serde_json::to_vec_pretty(shutdown).unwrap(),
        )
        .unwrap();
    }
    assert!(!profile.read_dir().unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
    // Reopen after close, then change projects while the reused helper is live.
    let other_profile = temporary.path().join("other-profile");
    let mut other =
        LifecycleService::prepare_source_foundation_probe(other_profile.clone()).unwrap();
    other.close().unwrap();
    let mut reports = vec![serde_json::to_value(shutdown).unwrap()];
    for change_project in [true, false] {
        service.open_path(&root).unwrap();
        let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let response = ipc(
            &mut service,
            "screens.canvasRender",
            json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],"width":1280,"height":720}),
        );
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
        loop {
            let ready = ipc(
                &mut service,
                "screens.canvasStatus",
                json!({"frameId":response["frameId"]}),
            );
            if ready["phase"] == "ready" {
                break;
            }
            assert_eq!(ready["phase"], "starting", "{ready}");
            assert!(std::time::Instant::now() < deadline);
            std::thread::sleep(std::time::Duration::from_millis(8));
        }
        if change_project {
            service
                .open_path(&other_profile.join("synthetic-project"))
                .unwrap();
        } else {
            assert!(
                service.runtime_shutdown(),
                "Application shutdown must stop the canvas"
            );
        }
        let report = service.canvas_shutdown_report().unwrap();
        assert!(
            report.cleanup_complete && report.cooperative && report.exit_code == Some(0),
            "{report:?}"
        );
        reports.push(serde_json::to_value(report).unwrap());
        assert!(!profile.read_dir().unwrap().any(|entry| entry
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with("canvas-helper-")));
    }
    // The test build alone forwards this profile-scoped refusal switch. Normal
    // production launches scrub it with the rest of the inherited environment.
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    std::env::set_var(
        "LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT",
        fs::canonicalize(&profile).unwrap(),
    );
    let response = ipc(
        &mut service,
        "screens.canvasRender",
        json!({"path":PATH,"screenName":"help","expectedRevision":doc["revision"],"width":1280,"height":720}),
    );
    std::env::remove_var("LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT");
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
    loop {
        let value = ipc(
            &mut service,
            "screens.canvasStatus",
            json!({"frameId":response["frameId"]}),
        );
        if value["phase"] == "unavailable" {
            break;
        }
        assert_eq!(value["phase"], "starting", "{value}");
        assert!(std::time::Instant::now() < deadline);
        std::thread::sleep(std::time::Duration::from_millis(8));
    }
    let helper = profile
        .read_dir()
        .unwrap()
        .flatten()
        .map(|entry| entry.path())
        .find(|path| {
            path.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with("canvas-helper-")
        })
        .unwrap();
    let refusal: Value =
        serde_json::from_slice(&fs::read(helper.join("startup-refusal.json")).unwrap()).unwrap();
    assert_eq!(refusal, json!({"refused":true,"stage":"selected-refusal"}));
    service.close().unwrap();
    let refusal_shutdown = service.canvas_shutdown_report().unwrap();
    assert!(refusal_shutdown.cleanup_complete && !refusal_shutdown.cooperative);
    assert_eq!(refusal_shutdown.exit_code, Some(72));
    assert!(!profile.read_dir().unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with("canvas-helper-")));
    if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
        let proof = json!({"normalShutdowns":reports,"startupRefusal":refusal,"refusalShutdown":refusal_shutdown,"sdkLaunches":4,"fixturesRemoved":true});
        fs::write(
            std::path::PathBuf::from(output).join("lifecycle.json"),
            serde_json::to_vec_pretty(&proof).unwrap(),
        )
        .unwrap();
    }
}

#[test]
fn owned_blank_screen_creation_source_history_and_reopen() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({
            "name":"travel_notes", "expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],
            "expectedInventoryRevision":catalog["inventoryRevision"]
        }),
    );
    let owned = &created["owned"][0];
    assert_eq!(owned["name"], "travel_notes");
    assert_eq!(owned["resolved"], true);
    assert_ne!(owned["id"], owned["rootId"]);
    let path = owned["path"].as_str().unwrap();
    assert_eq!(path, "game/ui/travel_notes.rpy");
    let source = ipc(&mut service, "source.open", json!({"path":path}));
    assert!(source["text"]
        .as_str()
        .unwrap()
        .ends_with("screen travel_notes():\n    pass\n"));
    let accepted = source["text"].clone();
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"], "command":{"type":"undo"}}),
    );
    assert!(!root.join(path).exists());
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"],
        json!([])
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"], "command":{"type":"redo"}}),
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":path}))["text"],
        accepted
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"],
        created["owned"]
    );
}

#[test]
fn owned_screen_reconciles_source_offsets_and_edits_but_refuses_renames_and_deletions() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"notes",
        "expectedProjectRevision":catalog["projectRevision"], "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let path = created["owned"][0]["path"].as_str().unwrap();
    let source = ipc(&mut service, "source.open", json!({"path":path}));
    let changed = format!(
        "# inserted comment\n{}",
        source["text"]
            .as_str()
            .unwrap()
            .replace("    pass", "    text \"Map\"")
    );
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":path,
        "expectedBaseRevision":source["baseRevision"], "text":changed,"selectionStart":0,"selectionEnd":0}),
    );
    ipc(
        &mut service,
        "source.save",
        json!({"path":path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let reconciled = ipc(&mut service, "screens.list", json!({}));
    for key in ["id", "rootId", "name", "path", "resolved"] {
        assert_eq!(reconciled["owned"][0][key], created["owned"][0][key]);
    }
    let document = ipc(&mut service, "screens.inspect", json!({"path":path}));
    assert!(
        document["screens"][0]["nodes"][0]["span"]["start"]
            .as_u64()
            .unwrap()
            > 30
    );
    for replacement in [
        changed.replace("screen notes()", "screen renamed()"),
        changed.replace(
            "screen notes():\n    text \"Map\"",
            "screen neighbor():\n    pass",
        ),
        format!("{changed}{changed}"),
        changed.replace("text \"Map\"", "text \"unfinished"),
    ] {
        fs::write(root.join(path), replacement).unwrap();
        let current = ipc(&mut service, "screens.list", json!({}));
        assert_eq!(current["owned"][0]["id"], created["owned"][0]["id"]);
        assert_eq!(current["owned"][0]["resolved"], false);
    }
    fs::remove_file(root.join(path)).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"][0]["resolved"],
        false
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"][0]["resolved"],
        false
    );
}

#[test]
fn owned_screen_creation_refuses_collisions_stale_source_dirty_drafts_and_invalid_names() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::write(
        root.join("game/other.rpy"),
        "screen elsewhere(argument=1):\n    pass\n",
    )
    .unwrap();
    service.open_path(&root).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let payload = |name: &str| {
        json!({"name":name,"expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]})
    };
    let before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    for name in [
        "elsewhere",
        "Elsewhere",
        "../escape",
        "",
        "await",
        "async",
        "yield",
        "__notes",
        "_m1_helper__notes",
        "CON",
        "nul",
        "LPT1",
    ] {
        reject(&mut service, "screens.create", payload(name));
        assert_eq!(
            fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
            before
        );
        assert!(
            !root.join("game/ui").exists(),
            "refused creation must not prepare a source directory"
        );
    }
    fs::write(
        root.join("game/other.rpy"),
        "screen added_elsewhere():\n    pass\n",
    )
    .unwrap();
    assert_eq!(
        reject(&mut service, "screens.create", payload("fresh"))["error"]["code"],
        "SOURCE_CONFLICT"
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let mut payload = payload("fresh");
    payload["expectedInventoryRevision"] = catalog["inventoryRevision"].clone();
    let opened = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/other.rpy"}),
    );
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":"game/other.rpy","expectedBaseRevision":opened["baseRevision"],
        "text":"# pending user input\n","selectionStart":3,"selectionEnd":3}),
    );
    assert_eq!(
        reject(&mut service, "screens.create", payload)["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert_eq!(
        ipc(
            &mut service,
            "source.open",
            json!({"path":"game/other.rpy"})
        )["text"],
        draft["text"]
    );
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
}

#[test]
fn owned_screen_metadata_migration_and_noop_reopen_preserve_source_and_extras() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), FIXTURE).unwrap();
    service.open_path(&root).unwrap();
    service.close().unwrap();
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut old: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    old["schemaVersion"] = json!(5);
    old.as_object_mut().unwrap().remove("ownedScreens");
    old["unknownExtension"] = json!({"unchanged":[1,"two"]});
    fs::write(&map_path, serde_json::to_vec_pretty(&old).unwrap()).unwrap();
    let script = fs::read(root.join("game/script.rpy")).unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"],
        json!([])
    );
    let migrated_bytes = fs::read(&map_path).unwrap();
    let migrated: Value = serde_json::from_slice(&migrated_bytes).unwrap();
    assert_eq!(
        migrated["schemaVersion"],
        json!(crate::metadata::SOURCE_MAP_SCHEMA_VERSION)
    );
    assert_eq!(migrated["unknownExtension"], old["unknownExtension"]);
    assert_eq!(migrated["sceneMappings"], old["sceneMappings"]);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), FIXTURE.as_bytes());
    assert_eq!(fs::read(root.join("game/script.rpy")).unwrap(), script);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        fs::read(&map_path).unwrap(),
        migrated_bytes,
        "no-op reopen cannot rewrite metadata"
    );
    service.close().unwrap();
    let mut newer = migrated;
    newer["schemaVersion"] = json!(999);
    let newer_bytes = serde_json::to_vec_pretty(&newer).unwrap();
    fs::write(&map_path, &newer_bytes).unwrap();
    assert!(service.open_path(&root).is_err());
    assert_eq!(fs::read(&map_path).unwrap(), newer_bytes);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), FIXTURE.as_bytes());
}

#[test]
fn owned_screen_creation_checks_versioned_and_init_declarations() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    for header in [
        "init -10 screen taken():",
        "init screen taken():",
        "screen 2 taken():",
        "init 10 screen 2 taken():",
        "init 5:\n    screen taken():",
        "screen \\\ntaken():",
        "init init screen taken():",
    ] {
        fs::write(
            root.join("game/other.rpy"),
            format!("{header}\n        pass\n"),
        )
        .unwrap();
        let catalog = ipc(&mut service, "screens.list", json!({}));
        reject(
            &mut service,
            "screens.create",
            json!({"name":"taken","expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
        );
        assert_eq!(
            fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
            before
        );
        assert!(!root.join("game/ui/taken.rpy").exists());
    }
}

#[test]
fn owned_screen_creation_retains_dirty_source_after_external_destination_deletion() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(root.join("game/ui/pending.rpy"), "# original\n").unwrap();
    service.open_path(&root).unwrap();
    let opened = ipc(
        &mut service,
        "source.open",
        json!({"path":"game/ui/pending.rpy"}),
    );
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":"game/ui/pending.rpy","expectedBaseRevision":opened["baseRevision"],
        "text":"# unfinished writing\n","selectionStart":4,"selectionEnd":4}),
    );
    fs::remove_file(root.join("game/ui/pending.rpy")).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(
        reject(
            &mut service,
            "screens.create",
            json!({"name":"pending","expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]})
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert!(!root.join("game/ui/pending.rpy").exists());
    assert_eq!(
        ipc(
            &mut service,
            "source.open",
            json!({"path":"game/ui/pending.rpy"})
        )["text"],
        draft["text"]
    );
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["sourceMapRevision"],
        catalog["sourceMapRevision"]
    );
}

#[test]
fn screen_source_dispatch_roundtrip_history_conflict_and_reopen() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = format!("\u{feff}{}", FIXTURE.replace('\n', "\r\n")).into_bytes();
    fs::write(root.join(PATH), &before).unwrap();
    service.open_path(&root).unwrap();
    let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    assert_eq!(
        fs::read(root.join(PATH)).unwrap(),
        before,
        "inspection cannot write or evaluate source"
    );
    assert_eq!(document["partial"], true);
    assert_eq!(document["screens"][0]["nodes"].as_array().unwrap().len(), 6);
    let expected_start = before.windows(3).position(|b| b == b"640").unwrap();
    let mutation = request(&document, 720);
    let changed = ipc(&mut service, "screens.setPixelProperty", mutation.clone());
    let after = fs::read(root.join(PATH)).unwrap();
    assert_eq!(
        after,
        [
            &before[..expected_start],
            b"720",
            &before[expected_start + 3..]
        ]
        .concat()
    );
    assert_eq!(frame(&changed)["properties"][0]["value"], 720);
    let noop = ipc(
        &mut service,
        "screens.setPixelProperty",
        request(&changed, 720),
    );
    assert_eq!(noop["revision"], changed["revision"]);
    let stale = reject(&mut service, "screens.setPixelProperty", mutation);
    assert_eq!(stale["error"]["code"], "SOURCE_CONFLICT");
    // Existing shared history undoes the screen edit; the no-op added no entry.
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), before);
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"redo"}}),
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), after);
    let opened = ipc(&mut service, "source.open", json!({"path":PATH}));
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":PATH,
        "expectedBaseRevision":opened["baseRevision"],"text":format!("{}# unsaved",opened["text"].as_str().unwrap()),
        "selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&changed, 800)
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
        draft["text"]
    );
    ipc(&mut service, "source.discard", json!({"path":PATH}));
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    assert_eq!(frame(&reopened)["properties"][0]["value"], 720);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), after);
    if let Some(output) = std::env::var_os("LOOMLIGHT_SCREEN_EVIDENCE") {
        fs::write(output, serde_json::to_vec_pretty(&json!({"schemaVersion":1,
            "before":String::from_utf8(before.clone()).unwrap(),"accepted":String::from_utf8(after.clone()).unwrap(),
            "beforeSHA256":hex::encode(Sha256::digest(&before)),"acceptedSHA256":hex::encode(Sha256::digest(&after)),
            "byteStart":expected_start,"old":"640","new":"720","screen":"loomlight_help","property":"xsize",
            "value":720,"roundtrip":true,"undoRedo":true,"draftRetained":true,"reopen":true})).unwrap()).unwrap();
    }
    // An ordinary external edit refuses the old revision and survives intact.
    let external = [after.as_slice(), b"# external edit\n"].concat();
    fs::write(root.join(PATH), &external).unwrap();
    assert_eq!(
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&reopened, 800)
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), external);
    service.close().unwrap();
}

#[test]
fn screen_source_protects_lexical_and_unknown_boundaries() {
    let source = b"init python:\n    fake = '''\nscreen pretend():\n    frame:\n        xsize 12\n'''\nscreen real():\n    frame:\n        xsize 640\n        python:\n            xsize = 999\n        text \"hash # literal\"\n";
    let doc = inspect(source, PATH.into(), "revision".into()).unwrap();
    assert_eq!(doc.screens.len(), 1);
    assert_eq!(doc.screens[0].name, "real");
    assert_eq!(doc.screens[0].nodes.len(), 3);
    assert_eq!(doc.screens[0].nodes[1].properties[0].value, 640);
    assert!(!doc.screens[0].nodes[1].protected.is_empty());
    for source in [
        "screen same():\n    text \"one\"\nscreen  same():\n    text \"two\"\n",
        "screen same():\n    text \"one\"\nscreen\tsame():\n    text \"two\"\n",
        "screen same():\n    text \"one\"\nscreen same(x):\n    text x\n",
        "screen broken():\n    text \"unfinished\n",
        "screen tab():\n\tframe:\n\t\txsize 12\n",
    ] {
        assert!(inspect(source.as_bytes(), PATH.into(), "revision".into()).is_err());
    }
    let doc = inspect(
        b"screen real():\n    frame:\n        xsize 640\n        xsize width\n",
        PATH.into(),
        "revision".into(),
    )
    .unwrap();
    assert!(
        doc.screens[0].nodes[1].properties.is_empty(),
        "ambiguous property ownership must refuse"
    );
    assert!(doc.partial);
    let duplicate_literals = inspect(
        b"screen real():\n    frame:\n        xsize 640\n        xsize 720\n",
        PATH.into(),
        "revision".into(),
    )
    .unwrap();
    assert!(duplicate_literals.partial);
    assert_eq!(duplicate_literals.screens[0].nodes[1].protected.len(), 2);
    for value in [
        "../help.rpy",
        "game/screens.rpy",
        "game/ui/../help.rpy",
        "game/ui/a/b.rpy",
    ] {
        assert!(path(value).is_err());
    }
}

#[test]
fn screen_source_requests_refuse_invalid_session_schema_range_and_opaque_target() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), FIXTURE).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    for value in [0, 16385] {
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&doc, value),
        );
    }
    let mut invalid = request(&doc, 720);
    invalid["extra"] = json!("forbidden");
    reject(&mut service, "screens.setPixelProperty", invalid);
    let mut invalid = request(&doc, 720);
    invalid["nodeStart"] = json!(0);
    reject(&mut service, "screens.setPixelProperty", invalid);
    let result = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,
        "requestId":"wrong-session","operation":"screens.inspect","payload":{"path":PATH,"sessionId":"old"}}),false,&mut service)).unwrap();
    assert_eq!(result["ok"], false);
    assert_eq!(fs::read_to_string(root.join(PATH)).unwrap(), FIXTURE);
    service.close().unwrap();
}

#[test]
fn screen_position_handles_source_order_and_refuses_ambiguous_or_automatic_layout() {
    for (layout, placement, allowed) in [
        ("fixed", "yalign 0.5\n            xalign 0.5", true),
        ("vbox", "xalign 0.5\n            yalign 0.5", false),
        (
            "fixed",
            "xalign 0.5\n            xalign 0.4\n            yalign 0.5",
            false,
        ),
        (
            "fixed",
            "xalign 0.5\n            yalign calculated()",
            false,
        ),
        (
            "fixed",
            "xalign 0.5\n            yalign 0.5\n            xoffset 20",
            false,
        ),
        (
            "fixed",
            "xalign 0.5\n            yalign 0.5\n            xycenter (0.2, 0.3)",
            false,
        ),
        ("fixed", "xalign 1\n            yalign 0.5", false),
    ] {
        let temporary = tempfile::tempdir().unwrap();
        let mut service =
            LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
                .unwrap();
        let root = temporary.path().join("profile/synthetic-project");
        fs::create_dir_all(root.join("game/ui")).unwrap();
        let before=format!("screen help():\n    {layout}:\n        frame:\n            xsize 640\n            ysize 360\n            {placement}\n");
        fs::write(root.join(PATH), &before).unwrap();
        service.open_path(&root).unwrap();
        let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let payload = json!({"path":PATH,"expectedRevision":doc["revision"],"screenName":"help","nodeStart":frame(&doc)["span"]["start"],"xalign":0.625,"yalign":0.25});
        if allowed {
            ipc(&mut service, "screens.setPosition", payload);
            assert_eq!(
                fs::read_to_string(root.join(PATH)).unwrap(),
                before.replacen("xalign 0.5", "xalign 0.625", 1).replacen(
                    "yalign 0.5",
                    "yalign 0.25",
                    1
                )
            );
        } else {
            assert!(frame(&doc)["position"].is_null());
            assert_eq!(
                reject(&mut service, "screens.setPosition", payload)["error"]["code"],
                "OPAQUE_BOUNDARY"
            );
            assert_eq!(fs::read_to_string(root.join(PATH)).unwrap(), before);
        }
        service.close().unwrap();
    }
}

#[test]
fn screen_position_preserves_alignment_source_and_one_history_entry() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    let before = "\u{feff}# retained\r\nscreen help():\r\n    fixed:\r\n        frame:\r\n            xsize 640\r\n            ysize 360\r\n            xalign 0.5 # center\r\n            yalign 0.5\r\n            text \"untouched\"\r\n";
    fs::write(root.join(PATH), before).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let change = |d: &Value, x: f64, y: f64| json!({"path":PATH,"expectedRevision":d["revision"],"screenName":"help","nodeStart":frame(d)["span"]["start"],"xalign":x,"yalign":y});
    ipc(&mut service, "screens.setPosition", change(&doc, 1.0, 0.0));
    assert_eq!(
        fs::read_to_string(root.join(PATH)).unwrap(),
        before
            .replacen("xalign 0.5", "xalign 1.0", 1)
            .replacen("yalign 0.5", "yalign 0.0", 1),
        "Ren'Py float fractions must remain floats at the endpoints"
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    let after = ipc(&mut service, "screens.setPosition", change(&doc, 0.6, 0.4));
    let expected =
        before
            .replacen("xalign 0.5", "xalign 0.6", 1)
            .replacen("yalign 0.5", "yalign 0.4", 1);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    assert_eq!(
        ipc(
            &mut service,
            "screens.setPosition",
            change(&after, 0.6, 0.4)
        )["revision"],
        after["revision"]
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.setPosition",
            change(&after, 1.1, 0.4)
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(
        reject(&mut service, "screens.setPosition", change(&doc, 0.7, 0.4))["error"]["code"],
        "SOURCE_CONFLICT"
    );
    for (operation, bytes) in [("undo", before.as_bytes()), ("redo", expected.as_bytes())] {
        let model = ipc(&mut service, "scene.list", json!({}));
        ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":operation}}),
        );
        assert_eq!(fs::read(root.join(PATH)).unwrap(), bytes);
    }
    let plan = ipc(
        &mut service,
        "screens.canvasPlan",
        json!({"path":PATH,"screenName":"help","expectedRevision":after["revision"],"width":1280,"height":720,"positions":[{"nodeStart":frame(&after)["span"]["start"],"xalign":0.7,"yalign":0.3}]}),
    );
    assert_eq!(plan["nodes"][2]["properties"]["xalign"], 0.7);
    assert_eq!(
        fs::read(root.join(PATH)).unwrap(),
        expected.as_bytes(),
        "Provisional movement must not save source"
    );
    let opened = ipc(&mut service, "source.open", json!({"path":PATH}));
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":PATH,"expectedBaseRevision":opened["baseRevision"],"text":expected.replace("untouched","source draft"),"selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.setPosition",
            change(&after, 0.8, 0.2)
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    ipc(
        &mut service,
        "source.save",
        json!({"path":PATH,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let fresh = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
        fresh["revision"]
    );
    service.close().unwrap();
}

#[test]
fn screen_atomic_size_two_tokens_one_history_entry_and_source_reconciliation() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = format!("\u{feff}{}", FIXTURE.replace('\n', "\r\n"));
    fs::write(root.join(PATH), &before).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let change = |d: &Value, w: u32, h: u32| json!({"path":PATH,"expectedRevision":d["revision"],"screenName":"loomlight_help","nodeStart":frame(d)["span"]["start"],"width":w,"height":h});
    let after = ipc(&mut service, "screens.setSize", change(&doc, 811, 407));
    let expected = before.replacen("640", "811", 1).replacen("360", "407", 1);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    assert_eq!(
        ipc(&mut service, "screens.setSize", change(&after, 811, 407))["revision"],
        after["revision"]
    );
    assert_eq!(
        reject(&mut service, "screens.setSize", change(&after, 0, 450))["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    for (operation, bytes) in [("undo", before.as_bytes()), ("redo", expected.as_bytes())] {
        let model = ipc(&mut service, "scene.list", json!({}));
        ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":operation}}),
        );
        assert_eq!(fs::read(root.join(PATH)).unwrap(), bytes);
    }
    let opened = ipc(&mut service, "source.open", json!({"path":PATH}));
    let changed_source = opened["text"].as_str().unwrap().replacen("811", "812", 1);
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":PATH,"expectedBaseRevision":opened["baseRevision"],"text":changed_source,"selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        reject(&mut service, "screens.setSize", change(&after, 900, 500))["error"]["code"],
        "DIRTY_SOURCE"
    );
    ipc(
        &mut service,
        "source.save",
        json!({"path":PATH,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    let fresh = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    assert_eq!(frame(&fresh)["properties"][0]["value"], 812);
    assert_eq!(
        reject(&mut service, "screens.setSize", change(&after, 900, 500))["error"]["code"],
        "SOURCE_CONFLICT"
    );
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        ipc(&mut service, "screens.inspect", json!({"path":PATH}))["revision"],
        fresh["revision"]
    );
}

#[path = "image_sdk_tests.rs"]
mod image_sdk;

#[test]
fn indexed_external_style_use_inspects_and_previews_without_widening_writes() {
    let (_temporary, mut service, root, _owner) = composition_project();
    for path in ["game/screens.rpy", "game/custom/chapter-one.rpy"] {
        fs::create_dir_all(root.join(path).parent().unwrap()).unwrap();
        let source = "# preserve custom source\nscreen external():\n    textbutton \"Continue\":\n        text_style \"external_label\"\n        background gui.panel\n\nstyle external_label is text:\n    size 24\n";
        fs::write(root.join(path), source).unwrap();
        let catalog = ipc(&mut service, "screens.list", json!({}));
        assert!(catalog["styles"]["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .any(|d| d["uses"]
                .as_array()
                .unwrap()
                .iter()
                .any(|u| u["path"] == path)));
        let doc = ipc(&mut service, "screens.inspect", json!({"path":path}));
        let button = &doc["screens"][0]["nodes"][1];
        assert_eq!(
            button["textProperties"]["expressions"]["background"],
            "gui.panel"
        );
        assert_eq!(button["textProperties"]["values"]["size"], 24);
        assert!(button["id"].is_null());
        let payload = json!({"path":path,"screenName":"external","expectedRevision":doc["revision"],"width":1280,"height":720});
        let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
        assert_eq!(plan["nodes"][1]["properties"]["text_size"], 24);
        let mut stale = payload;
        stale["expectedRevision"] = json!("stale");
        assert_eq!(
            reject(&mut service, "screens.canvasPlan", stale)["error"]["code"],
            "SOURCE_CONFLICT"
        );
        assert_eq!(
            reject(
                &mut service,
                "screens.setSize",
                json!({"path":path,"screenName":"external","expectedRevision":doc["revision"],"nodeStart":button["span"]["start"],"width":240,"height":60})
            )["error"]["code"],
            "INVALID_PAYLOAD"
        );
        assert_eq!(fs::read_to_string(root.join(path)).unwrap(), source);
        fs::remove_file(root.join(path)).unwrap();
    }
    for path in [
        "other/screens.rpy",
        "game/../screens.rpy",
        "game/screens.rpyc",
    ] {
        assert_eq!(
            reject(&mut service, "screens.inspect", json!({"path":path}))["error"]["code"],
            "INVALID_PAYLOAD"
        );
    }
}
