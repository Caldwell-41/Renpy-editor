use super::*;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

fn add(fixture: &Fixture, owner: &OwnedScreen, parent: &str, kind: &str, text: &str) -> String {
    fixture
        .service
        .screens_compose(
            &fixture.project,
            &fixture.project_id,
            serde_json::from_value(json!({
                "screenId":owner.id,"expectedRevision":fixture.revisions(owner).source,
                "command":{"type":"add","parentId":parent,"kind":kind,"text":text}
            }))
            .unwrap(),
        )
        .unwrap()
        .selected_id
}

fn position(fixture: &Fixture, owner: &OwnedScreen, node_id: &str, x: u32) {
    let document = fixture
        .service
        .screens_inspect(
            &fixture.project,
            InspectRequest {
                path: owner.path.clone(),
            },
        )
        .unwrap();
    let node = document
        .screens
        .iter()
        .flat_map(|s| &s.nodes)
        .find(|n| n.id.as_deref() == Some(node_id))
        .unwrap();
    fixture.service.screens_set_layout(&fixture.project, serde_json::from_value(json!({
        "path":owner.path,"expectedRevision":document.revision,"screenName":owner.name,"nodeStart":node.span.start,
        "values":{"xpos":{"unit":"pixels","value":x},"ypos":{"unit":"pixels","value":40},"xsize":{"unit":"pixels","value":500},"ysize":{"unit":"pixels","value":180}}
    })).unwrap()).unwrap();
}

fn snapshot(fixture: &Fixture, panels: &[&OwnedScreen]) -> Value {
    let inventory = fixture
        .service
        .source_inventory(&fixture.project, &fixture.project_id)
        .unwrap();
    let mut paths = inventory
        .files
        .into_iter()
        .map(|file| file.path)
        .collect::<Vec<_>>();
    paths.extend(
        [
            ".renpy-editor/project.json",
            ".renpy-editor/source-map.json",
            ".renpy-editor/authoring.json",
        ]
        .map(String::from),
    );
    paths.sort();
    paths.dedup();
    let files = paths
        .into_iter()
        .map(|path| {
            let bytes = fs::read(fixture.root.join(&path)).unwrap();
            let hash = hex::encode(Sha256::digest(&bytes));
            (
                path,
                json!({"text":String::from_utf8(bytes).unwrap(),"sha256":hash}),
            )
        })
        .collect::<BTreeMap<_, _>>();
    let targets = panels
        .iter()
        .map(|owner| {
            fixture
                .service
                .screens_resolve_target(
                    &fixture.project,
                    &fixture.project_id,
                    &binding(owner),
                    None,
                )
                .unwrap()
        })
        .collect::<Vec<_>>();
    json!({"files":files,"targets":targets,"catalog":fixture.service.screens_list(&fixture.project, &fixture.project_id).unwrap()})
}

#[test]
fn frozen_two_panel_outputs_come_from_actual_component_transactions() {
    let mut fixture = Fixture::new();
    let first_parent = add(
        &fixture,
        &fixture.owner,
        &fixture.owner.root_id,
        "fixed",
        "",
    );
    position(&fixture, &fixture.owner, &first_parent, 40);
    let group = add(&fixture, &fixture.owner, &first_parent, "vbox", "");
    let text = add(&fixture, &fixture.owner, &group, "text", "Shared");
    let extracted = fixture
        .service
        .screens_component_extract(
            &fixture.project,
            &fixture.project_id,
            ExtractRequest {
                target: binding(&fixture.owner),
                expected: fixture.revisions(&fixture.owner),
                expected_project_revision: fixture
                    .service
                    .screens_list(&fixture.project, &fixture.project_id)
                    .unwrap()
                    .project_revision,
                node_id: group,
                name: "shared_output".into(),
            },
        )
        .unwrap();
    let component = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|o| o.screen.id == extracted.component_id)
        .unwrap()
        .screen;
    let second = fixture.create_screen("other");
    let second_parent = add(&fixture, &second, &second.root_id, "fixed", "");
    position(&fixture, &second, &second_parent, 680);
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
                parent_id: second_parent.clone(),
            },
        )
        .unwrap();
    fixture.service.screens_compose(&fixture.project, &fixture.project_id, serde_json::from_value(json!({
        "screenId":component.id,"expectedRevision":fixture.revisions(&component).source,"componentRevisions":fixture.revisions(&component),"command":{"type":"text","nodeId":text,"text":"Shared edited"}
    })).unwrap()).unwrap();
    let shared = snapshot(&fixture, &[&fixture.owner, &second]);
    assert!(fixture
        .read(&component.path)
        .text
        .unwrap()
        .contains("\"Shared edited\""));
    let copied = fixture
        .service
        .screens_component_copy(
            &fixture.project,
            &fixture.project_id,
            CopyRequest {
                target: binding(&second),
                expected_target: fixture.revisions(&second),
                use_id: placed.use_id.clone(),
                expected_component: fixture.revisions(&component),
                expected_project_revision: fixture
                    .service
                    .screens_list(&fixture.project, &fixture.project_id)
                    .unwrap()
                    .project_revision,
                name: "independent_output".into(),
            },
        )
        .unwrap();
    let copy = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|o| o.screen.id == copied.component_id)
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
    let copied_text = document
        .screens
        .iter()
        .flat_map(|s| &s.nodes)
        .find(|n| n.kind == "text")
        .unwrap()
        .id
        .clone()
        .unwrap();
    fixture.service.screens_compose(&fixture.project, &fixture.project_id, serde_json::from_value(json!({
        "screenId":copy.id,"expectedRevision":fixture.revisions(&copy).source,"componentRevisions":fixture.revisions(&copy),"command":{"type":"text","nodeId":copied_text,"text":"Independent copy"}
    })).unwrap()).unwrap();
    assert!(fixture
        .read(&component.path)
        .text
        .unwrap()
        .contains("\"Shared edited\""));
    assert!(fixture
        .read(&copy.path)
        .text
        .unwrap()
        .contains("\"Independent copy\""));
    let independent = snapshot(&fixture, &[&fixture.owner, &second]);
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    assert_eq!(snapshot(&fixture, &[&fixture.owner, &second]), independent);
    let receipt = json!({
        "publicCoreRequests":true,"sdkVersion":"8.5.3","executedSdk":false,
        "stages":{"shared":shared,"independent":independent},
        "screenNames":[fixture.owner.name,second.name],"componentIds":[component.id,copy.id],"useIds":[extracted.use_id,placed.use_id],
        "positions":[{"screenId":fixture.owner.id,"parentId":first_parent,"x":40,"y":40},{"screenId":second.id,"parentId":second_parent,"x":680,"y":40}]
    });
    if let Some(output) = std::env::var_os("LOOMLIGHT_COMPONENT_INPUTS") {
        let output = PathBuf::from(output);
        let worktree = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .ancestors()
            .nth(2)
            .unwrap()
            .canonicalize()
            .unwrap();
        assert!(output
            .parent()
            .unwrap()
            .canonicalize()
            .unwrap()
            .starts_with(worktree));
        fs::create_dir(&output).unwrap();
        fs::write(
            output.join("accepted.json"),
            serde_json::to_vec_pretty(&receipt).unwrap(),
        )
        .unwrap();
    }
}
