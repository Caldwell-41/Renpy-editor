use super::*;
use serde_json::{json, Value};

fn geometry(
    fixture: &Fixture,
    owner: &OwnedScreen,
    operation: &str,
    fields: Value,
    reviewed: bool,
) -> Result<crate::screens::Document, crate::scene::SceneError> {
    let document = fixture
        .service
        .screens_inspect(
            &fixture.project,
            InspectRequest {
                path: owner.path.clone(),
            },
        )
        .unwrap();
    let frame = document
        .screens
        .iter()
        .flat_map(|s| &s.nodes)
        .find(|n| n.kind == "frame")
        .unwrap();
    let mut request = json!({"path":owner.path,"screenName":owner.name,"expectedRevision":document.revision,"nodeStart":frame.span.start});
    request
        .as_object_mut()
        .unwrap()
        .extend(fields.as_object().unwrap().clone());
    if reviewed {
        request["componentRevisions"] = serde_json::to_value(fixture.revisions(owner)).unwrap();
    }
    match operation {
        "pixel" => fixture
            .service
            .screens_set_pixel(&fixture.project, serde_json::from_value(request).unwrap()),
        "size" => fixture
            .service
            .screens_set_size(&fixture.project, serde_json::from_value(request).unwrap()),
        "position" => fixture
            .service
            .screens_set_position(&fixture.project, serde_json::from_value(request).unwrap()),
        "layout" => fixture
            .service
            .screens_set_layout(&fixture.project, serde_json::from_value(request).unwrap()),
        _ => unreachable!(),
    }
}

#[test]
fn extracted_component_geometry_requires_review_for_all_four_existing_writers() {
    let mut fixture = Fixture::new();
    let frame_id = "00000000-0000-4000-8000-000000000003";
    let source = format!("# loomlight-screen: {}\nscreen notes():\n    fixed: # loomlight-element: {GROUP}\n        frame: # loomlight-element: {frame_id}\n            xsize 640 # keep width comment\n            ysize 360\n            xalign 0.5\n            yalign 0.5\n            text \"Geometry\" # loomlight-element: {TEXT}\n", fixture.owner.id);
    fixture.reopen_with_source(&source);
    let extracted = fixture
        .service
        .screens_component_extract(
            &fixture.project,
            &fixture.project_id,
            fixture.extract_request("geometry_component"),
        )
        .unwrap();
    let component = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|owner| owner.screen.id == extracted.component_id)
        .unwrap()
        .screen;
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    let before = fixture.read(&component.path).text.unwrap();
    let cases = [
        ("pixel", json!({"property":"xsize","value":600})),
        ("size", json!({"width":620,"height":340})),
        ("position", json!({"xalign":0.25,"yalign":0.75})),
        (
            "layout",
            json!({"values":{"left_padding":{"unit":"pixels","value":8}}}),
        ),
    ];
    for (operation, fields) in &cases {
        assert!(
            geometry(&fixture, &component, operation, fields.clone(), false).is_err(),
            "{operation}"
        );
        assert_eq!(fixture.read(&component.path).text.as_ref(), Some(&before));
    }
    assert!(fixture
        .service
        .history_state(&fixture.project)
        .unwrap()
        .undo
        .is_none());
    for (operation, fields) in &cases {
        geometry(&fixture, &component, operation, fields.clone(), true).unwrap();
    }
    let accepted = fixture.read(&component.path).text.unwrap();
    assert!(accepted.contains("xsize 620 # keep width comment"));
    assert!(accepted.contains("ysize 340"));
    assert!(accepted.contains("xalign 0.25"));
    assert!(accepted.contains("yalign 0.75"));
    assert!(accepted.contains("left_padding 8"));
    for _ in &cases {
        fixture.undo();
    }
    assert_eq!(fixture.read(&component.path).text, Some(before));
    assert!(fixture
        .service
        .history_state(&fixture.project)
        .unwrap()
        .undo
        .is_none());
    for _ in &cases {
        fixture.redo();
    }
    assert_eq!(fixture.read(&component.path).text, Some(accepted));
}

fn compose(
    fixture: &Fixture,
    component: &OwnedScreen,
    command: Value,
) -> crate::screens::ComposeResult {
    let revisions = fixture.revisions(component);
    fixture.service.screens_compose(&fixture.project, &fixture.project_id, serde_json::from_value(json!({
        "screenId":component.id,"expectedRevision":revisions.source,"componentRevisions":revisions,"command":command
    })).unwrap()).unwrap()
}

#[test]
fn component_styles_and_images_use_existing_writers_and_copy_without_changing_other_use() {
    let (mut fixture, component, _) = Fixture::with_component();
    let second = fixture.create_screen("other");
    let placed = fixture
        .service
        .screens_component_place(
            &fixture.project,
            &fixture.project_id,
            PlaceRequest {
                component: binding(&component),
                expected_component: fixture.revisions(&component),
                target: binding(&second),
                expected_target: fixture.revisions(&second),
                parent_id: second.root_id.clone(),
            },
        )
        .unwrap();
    fs::create_dir_all(fixture.root.join("game/images")).unwrap();
    let selected = fixture._temporary.path().join("seal.png");
    fs::write(
        &selected,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
    .unwrap();
    let choice = fixture
        .service
        .select_import(&fixture.project, &selected.canonicalize().unwrap())
        .unwrap();
    let assets = fixture
        .service
        .import_asset(
            &fixture.project,
            &fixture.project_id,
            crate::authoring::ImportAssetRequest {
                authority_id: choice.authority_id,
                kind: crate::authoring::AssetKind::UiImage,
                technical_name: "component_seal".into(),
                display_name: "Component seal".into(),
                character_id: None,
                expression: None,
            },
        )
        .unwrap();
    let asset = assets
        .assets
        .into_iter()
        .find(|asset| asset.kind == crate::authoring::AssetKind::UiImage)
        .unwrap();
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    let original = fixture.read(&component.path).text;
    let catalog = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    compose(
        &fixture,
        &component,
        json!({"type":"formatText","nodeId":TEXT,"values":{"size":24,"color":"#abcdef"},"style":{"scope":"create","name":"component_body","expectedRevision":catalog.styles.revision}}),
    );
    let image = compose(&fixture, &component, json!({"type":"addImage","parentId":GROUP,"assetId":asset.id,"expectedAssetSha256":asset.sha256,"width":64,"height":32})).selected_id;
    let catalog = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    let style = catalog
        .styles
        .definitions
        .iter()
        .find(|style| style.name == "component_body")
        .unwrap();
    assert!(style.error.is_none());
    let affected = style
        .uses
        .iter()
        .map(|usage| usage.screen_name.as_str())
        .collect::<HashSet<_>>();
    assert!(affected.contains("notes") && affected.contains("other"));
    compose(
        &fixture,
        &component,
        json!({"type":"formatText","nodeId":TEXT,"values":{"size":32},"style":{"scope":"shared","name":"component_body","expectedRevision":catalog.styles.revision}}),
    );
    compose(
        &fixture,
        &component,
        json!({"type":"image","nodeId":image,"assetId":asset.id,"expectedAssetSha256":asset.sha256,"width":128,"height":64}),
    );
    let shared_source = fixture.read(&component.path).text.unwrap();
    assert!(shared_source.contains("size 32"));
    assert!(shared_source.contains("xsize 128") && shared_source.contains("ysize 64"));
    let copied = fixture
        .service
        .screens_component_copy(
            &fixture.project,
            &fixture.project_id,
            CopyRequest {
                target: binding(&second),
                expected_target: fixture.revisions(&second),
                use_id: placed.use_id,
                expected_component: fixture.revisions(&component),
                expected_project_revision: fixture
                    .service
                    .screens_list(&fixture.project, &fixture.project_id)
                    .unwrap()
                    .project_revision,
                name: "styled_copy".into(),
            },
        )
        .unwrap();
    let copy = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|owner| owner.screen.id == copied.component_id)
        .unwrap()
        .screen;
    let document = fixture
        .service
        .screens_inspect(
            &fixture.project,
            InspectRequest {
                path: copy.path.clone(),
            },
        )
        .unwrap();
    let copied_image = document
        .screens
        .iter()
        .flat_map(|screen| &screen.nodes)
        .find(|node| node.kind == "image")
        .unwrap()
        .id
        .clone()
        .unwrap();
    assert_ne!(copied_image, image);
    compose(
        &fixture,
        &copy,
        json!({"type":"image","nodeId":copied_image,"assetId":asset.id,"expectedAssetSha256":asset.sha256,"width":96,"height":48}),
    );
    let independent_source = fixture.read(&copy.path).text.unwrap();
    assert!(independent_source.contains("xsize 96") && independent_source.contains("ysize 48"));
    assert_eq!(
        fixture.read(&component.path).text.as_ref(),
        Some(&shared_source)
    );
    for _ in 0..6 {
        fixture.undo();
    }
    assert_eq!(fixture.read(&component.path).text, original);
    assert!(fixture
        .service
        .history_state(&fixture.project)
        .unwrap()
        .undo
        .is_none());
    for _ in 0..6 {
        fixture.redo();
    }
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    assert_eq!(fixture.read(&component.path).text, Some(shared_source));
    assert_eq!(fixture.read(&copy.path).text, Some(independent_source));
    assert!(
        fixture
            .service
            .screens_component_review(&fixture.project, &fixture.project_id, &component.id)
            .unwrap()
            .complete
    );
}
