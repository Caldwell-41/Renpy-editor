//! Public-core nested canvas admission. These tests never start the SDK/helper.
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};
use std::fs;

#[path = "nested_canvas_sdk_tests.rs"]
mod sdk;

fn create(service: &mut LifecycleService, name: &str, kind: &str) -> Value {
    let catalog = ipc(service, "screens.list", json!({}));
    let created = ipc(
        service,
        "screens.create",
        json!({"name":name,"kind":kind,
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|o| o["name"] == name)
        .unwrap()
        .clone()
}
fn inspect(service: &mut LifecycleService, owner: &Value) -> Value {
    ipc(service, "screens.inspect", json!({"path":owner["path"]}))
}
fn resolve(service: &mut LifecycleService, owner: &Value) -> Value {
    ipc(
        service,
        "screens.resolveTarget",
        json!({"binding":{"screenId":owner["id"],"sourceName":owner["name"]}}),
    )
}
fn place(
    service: &mut LifecycleService,
    target: &Value,
    component: &Value,
    parent: &Value,
) -> Value {
    let target_revision = resolve(service, target)["revisions"].clone();
    let component_revision = resolve(service, component)["revisions"].clone();
    ipc(
        service,
        "screens.componentPlace",
        json!({"component":{"screenId":component["id"],"sourceName":component["name"]},
        "expectedComponent":component_revision,"target":{"screenId":target["id"],"sourceName":target["name"]},
        "expectedTarget":target_revision,"parentId":parent}),
    )
}
fn request(service: &mut LifecycleService, owner: &Value) -> Value {
    let doc = inspect(service, owner);
    json!({"path":owner["path"],"screenName":owner["name"],"expectedRevision":doc["revision"],"width":1280,"height":720})
}

#[test]
fn component_canvas_inlines_repeated_uses_in_source_order_without_a_layout_wrapper() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    let target = create(&mut service, "nested_fidelity", "panel");
    let seed = create(&mut service, "seed", "panel");
    let doc = inspect(&mut service, &seed);
    let group = ipc(
        &mut service,
        "screens.compose",
        json!({"screenId":seed["id"],"expectedRevision":doc["revision"],
        "command":{"type":"add","parentId":seed["rootId"],"kind":"hbox","text":""}}),
    );
    ipc(
        &mut service,
        "screens.compose",
        json!({"screenId":seed["id"],"expectedRevision":group["document"]["revision"],
        "command":{"type":"add","parentId":group["selectedId"],"kind":"text","text":"Shared cells"}}),
    );
    let expected = resolve(&mut service, &seed);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let extracted = ipc(
        &mut service,
        "screens.componentExtract",
        json!({"target":expected["binding"],"expected":expected["revisions"],
        "expectedProjectRevision":catalog["projectRevision"],"nodeId":group["selectedId"],"name":"nested_cells"}),
    );
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let component = catalog["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|o| o["id"] == extracted["componentId"])
        .unwrap()
        .clone();
    let first = place(&mut service, &target, &component, &target["rootId"]);
    let second = place(&mut service, &target, &component, &target["rootId"]);
    let payload = request(&mut service, &target);
    let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
    assert_eq!(plan["available"], true, "{plan}");
    let nodes = plan["nodes"].as_array().unwrap();
    assert_eq!(
        nodes
            .iter()
            .map(|n| n["kind"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["screen", "hbox", "text", "hbox", "text"]
    );
    assert_eq!(nodes[1]["parent"], nodes[0]["start"]);
    assert_eq!(nodes[3]["parent"], nodes[0]["start"]);
    assert_eq!(nodes[2]["parent"], nodes[1]["start"]);
    assert_eq!(nodes[4]["parent"], nodes[3]["start"]);
    let document = inspect(&mut service, &target);
    let uses = document["screens"][0]["nodes"].as_array().unwrap();
    for (node, placed) in [&nodes[1], &nodes[3]].into_iter().zip([first, second]) {
        let usage = uses.iter().find(|n| n["id"] == placed["useId"]).unwrap();
        assert_eq!(node["selectionStart"], usage["span"]["start"]);
    }
    let starts = nodes
        .iter()
        .map(|n| n["start"].as_u64().unwrap())
        .collect::<std::collections::HashSet<_>>();
    assert_eq!(starts.len(), nodes.len());
    assert_eq!(
        ipc(&mut service, "screens.canvasPlan", payload.clone()),
        plan
    );
    let source = fs::read(root.join(target["path"].as_str().unwrap())).unwrap();
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(ipc(&mut service, "screens.canvasPlan", payload), plan);
    assert_eq!(
        fs::read(root.join(target["path"].as_str().unwrap())).unwrap(),
        source
    );
    service.close().unwrap();
}

fn external_graph(
    depth: usize,
    fanout: usize,
    cycle: bool,
) -> (
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
    let target = create(&mut service, "nested_fidelity", "panel");
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    map["componentUses"] = json!([]);
    let mut owners = vec![target.clone()];
    for index in 0..depth {
        let owner = json!({"id":uuid::Uuid::new_v4().to_string(),"rootId":uuid::Uuid::new_v4().to_string(),
            "name":format!("nested_component_{index}"),"path":format!("game/ui/nested_component_{index}.rpy"),"kind":"component"});
        map["sources"]
            .as_array_mut()
            .unwrap()
            .push(owner["path"].clone());
        map["ownedScreens"]
            .as_array_mut()
            .unwrap()
            .push(owner.clone());
        owners.push(owner);
    }
    for (index, owner) in owners.iter().enumerate() {
        let mut source = format!(
            "# loomlight-screen: {}\nscreen {}():\n",
            owner["id"].as_str().unwrap(),
            owner["name"].as_str().unwrap()
        );
        if index + 1 < owners.len() || cycle {
            let child = &owners[if index + 1 < owners.len() {
                index + 1
            } else {
                1
            }];
            for _ in 0..fanout {
                let node = uuid::Uuid::new_v4().to_string();
                source.push_str(&format!(
                    "    use {} # loomlight-element: {node}\n",
                    child["name"].as_str().unwrap()
                ));
                map["componentUses"]
                    .as_array_mut()
                    .unwrap()
                    .push(json!({"screenId":owner["id"],"nodeId":node,"componentId":child["id"]}));
            }
        } else {
            source.push_str("    text \"Leaf\"\n");
        }
        fs::write(root.join(owner["path"].as_str().unwrap()), source).unwrap();
    }
    fs::write(map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
    (temporary, service, root, target)
}

#[test]
fn component_canvas_reports_cycles_depth_and_expansion_bounds_without_execution() {
    for (depth, fanout, cycle, expected) in [
        (2, 1, true, "cycle"),
        (34, 1, false, "depth"),
        (12, 2, false, "node limit"),
    ] {
        let (_temporary, mut service, _root, target) = external_graph(depth, fanout, cycle);
        let payload = request(&mut service, &target);
        let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
        assert_eq!(plan["available"], false, "{depth} {plan}");
        assert!(
            plan["limits"]
                .as_array()
                .unwrap()
                .iter()
                .any(|limit| limit.as_str().unwrap().contains(expected)),
            "{plan}"
        );
        assert!(plan["nodes"].as_array().unwrap().len() <= 4096);
        assert_eq!(
            ipc(&mut service, "screens.canvasRender", payload)["phase"],
            "unavailable"
        );
        service.close().unwrap();
    }
}

#[test]
fn component_canvas_keeps_missing_ambiguous_and_custom_regions_explicitly_partial() {
    for shape in ["missing", "ambiguous", "custom"] {
        let (_temporary, mut service, root, target) = external_graph(1, 1, false);
        let component = root.join("game/ui/nested_component_0.rpy");
        match shape {
            "missing" => fs::remove_file(&component).unwrap(),
            "ambiguous" => fs::write(
                root.join("game/ui/duplicate.rpy"),
                "screen nested_component_0():\n    text \"Duplicate\"\n",
            )
            .unwrap(),
            _ => {
                let source = fs::read_to_string(&component).unwrap();
                fs::write(&component, source.replace("    text \"Leaf\"", "    python:\n        raise Exception(\"must never run\")\n    text \"Supported leaf\"" )).unwrap();
            }
        }
        let payload = request(&mut service, &target);
        let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
        assert_eq!(plan["available"], false, "{shape} {plan}");
        assert!(!plan["limits"].as_array().unwrap().is_empty());
        if shape == "custom" {
            assert!(plan["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|node| node["literal"] == "Supported leaf"));
        }
        assert_eq!(
            ipc(&mut service, "screens.canvasRender", payload)["phase"],
            "unavailable"
        );
        service.close().unwrap();
    }
}

const FIDELITY_ROOT: &str =
    include_str!("../../../../tests/fixtures/phase-3b-screens/nested-fidelity.rpy");
const FIDELITY_COMPONENT: &str =
    include_str!("../../../../tests/fixtures/phase-3b-screens/nested-fidelity-component.rpy");
const FIDELITY_CELL: &str =
    include_str!("../../../../tests/fixtures/phase-3b-screens/nested-fidelity-cell.rpy");
const FONT: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf");
const IMAGE: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png");

#[test]
fn nested_fidelity_exports_accepted_source_assets_and_matched_plans_without_execution() {
    use sha2::{Digest, Sha256};
    let (temporary, mut service, root, target) = external_graph(2, 1, false);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let mut assets = vec![];
    for (name, kind, bytes, extension) in [
        ("nested_font", "font", FONT, "ttf"),
        ("nested_seal", "uiImage", IMAGE, "png"),
    ] {
        let chosen = temporary.path().join(format!("{name}.{extension}"));
        fs::write(&chosen, bytes).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let imported = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,"kind":kind,"technicalName":name,"displayName":name}),
        );
        assets.push(
            imported["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|asset| asset["kind"] == kind)
                .unwrap()
                .clone(),
        );
    }
    let map_path = root.join(".renpy-editor/source-map.json");
    let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
    let second_use = uuid::Uuid::new_v4().to_string();
    let first = map["componentUses"][0].clone();
    map["componentUses"].as_array_mut().unwrap().push(json!({"screenId":first["screenId"],"componentId":first["componentId"],"nodeId":second_use}));
    fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
    let first_use = format!("loomlight-element: {}", first["nodeId"].as_str().unwrap());
    let cell_use = format!(
        "loomlight-element: {}",
        map["componentUses"][1]["nodeId"].as_str().unwrap()
    );
    let templates = [
        FIDELITY_ROOT
            .replace("@USE_FIRST@", &first_use)
            .replace("@USE_SECOND@", &format!("loomlight-element: {second_use}")),
        FIDELITY_COMPONENT.replace("@USE_CELL@", &cell_use),
        FIDELITY_CELL.to_owned(),
    ];
    let owners = [
        target.clone(),
        map["ownedScreens"]
            .as_array()
            .unwrap()
            .iter()
            .find(|o| o["name"] == "nested_component_0")
            .unwrap()
            .clone(),
        map["ownedScreens"]
            .as_array()
            .unwrap()
            .iter()
            .find(|o| o["name"] == "nested_component_1")
            .unwrap()
            .clone(),
    ];
    let mut files = std::collections::BTreeMap::new();
    for (owner, template) in owners.iter().zip(templates) {
        let source = template.replacen(
            "screen ",
            &format!(
                "# loomlight-screen: {}\nscreen ",
                owner["id"].as_str().unwrap()
            ),
            1,
        );
        fs::write(root.join(owner["path"].as_str().unwrap()), source).unwrap();
    }
    let mut cases = vec![];
    for (width, height) in [(1280, 720), (1024, 768)] {
        let mut payload = request(&mut service, &target);
        payload["width"] = json!(width);
        payload["height"] = json!(height);
        payload["buttonState"] = json!("normal");
        let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
        assert_eq!(plan["available"], true, "{plan}");
        assert!(plan["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .all(|node| node["kind"] != "use"));
        let widgets = [
            "stage",
            "outer",
            "row",
            "bundle",
            "cells",
            "first_cell",
            "cell_row",
            "seal",
            "title",
            "second_cell",
            "cell_label",
            "clip",
            "overflow",
            "overflow_panel",
            "visible_label",
            "hidden_label",
            "bundle",
            "cells",
            "first_cell",
            "cell_row",
            "seal",
            "title",
            "second_cell",
            "cell_label",
            "clip",
            "overflow",
            "overflow_panel",
            "visible_label",
            "hidden_label",
            "front",
            "front_label",
        ];
        assert_eq!(plan["nodes"].as_array().unwrap().len(), widgets.len() + 1);
        let widget_map = plan["nodes"].as_array().unwrap()[1..].iter().zip(widgets).map(|(node, id)| json!({"start":node["start"],"selectionStart":node.get("selectionStart").unwrap_or(&node["start"]),"widgetId":id,"clips":node["kind"] == "viewport"})).collect::<Vec<_>>();
        cases.push(json!({"screen":"nested_fidelity","request":payload,"plan":plan,"widgets":widget_map,"viewportState":{"x":0,"y":0}}));
    }
    for owner in &owners {
        let path = owner["path"].as_str().unwrap();
        let source = ipc(&mut service, "source.open", json!({"path":path}));
        let text = source["text"].as_str().unwrap();
        files.insert(
            path.to_owned(),
            json!({"text":text,"sha256":hex::encode(Sha256::digest(text.as_bytes()))}),
        );
    }
    for path in [
        ".renpy-editor/project.json",
        ".renpy-editor/source-map.json",
        ".renpy-editor/authoring.json",
    ] {
        let bytes = fs::read(root.join(path)).unwrap();
        files.insert(path.to_owned(), json!({"text":String::from_utf8(bytes.clone()).unwrap(),"sha256":hex::encode(Sha256::digest(bytes))}));
    }
    service.close().unwrap();
    service.open_path(&root).unwrap();
    for case in &cases {
        assert_eq!(
            ipc(&mut service, "screens.canvasPlan", case["request"].clone()),
            case["plan"]
        );
    }
    service.close().unwrap();
    let accepted = json!({"outcome":"L19-nested-fidelity","publicCoreRequests":true,"sourceMapSchemaVersion":8,
        "exporterSourceSHA256":hex::encode(Sha256::digest(include_bytes!("nested_canvas_tests.rs"))),"files":files,"assets":assets,"cases":cases});
    if let Some(output) = std::env::var_os("LOOMLIGHT_NESTED_FIDELITY_INPUTS") {
        fs::create_dir_all(&output).unwrap();
        fs::write(
            std::path::Path::new(&output).join("accepted.json"),
            serde_json::to_vec_pretty(&accepted).unwrap(),
        )
        .unwrap();
    }
}

#[test]
fn component_canvas_counts_inlined_grid_children_and_handles_an_empty_use() {
    let (_temporary, mut service, root, target) = external_graph(1, 1, false);
    let path = root.join(target["path"].as_str().unwrap());
    let source = fs::read_to_string(&path).unwrap();
    fs::write(
        &path,
        source.replace(
            "    use ",
            "    grid 2 1:\n        allow_underfull True\n        use ",
        ),
    )
    .unwrap();
    let component_path = root.join("game/ui/nested_component_0.rpy");
    let component = fs::read_to_string(&component_path).unwrap();
    fs::write(
        &component_path,
        component.replace(
            "    text \"Leaf\"",
            "    text \"First\"\n    text \"Second\"",
        ),
    )
    .unwrap();
    let payload = request(&mut service, &target);
    let plan = ipc(&mut service, "screens.canvasPlan", payload.clone());
    assert_eq!(plan["available"], true, "{plan}");
    let nodes = plan["nodes"].as_array().unwrap();
    assert_eq!(nodes.len(), 4);
    assert_eq!(nodes[1]["kind"], "grid");
    assert_eq!(nodes[2]["parent"], nodes[1]["start"]);
    assert_eq!(nodes[3]["parent"], nodes[1]["start"]);
    fs::write(
        &component_path,
        component.replace("    text \"Leaf\"", "    pass"),
    )
    .unwrap();
    let empty = ipc(&mut service, "screens.canvasPlan", payload);
    assert_eq!(empty["available"], true, "{empty}");
    assert_eq!(empty["nodes"].as_array().unwrap().len(), 2);
    assert!(empty["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .all(|node| node.get("selectionStart").is_none()));
    service.close().unwrap();
}
