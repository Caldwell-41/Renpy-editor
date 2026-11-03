use super::*;
use crate::{
    authoring::{AssetKind, AuthoringService, ImportAssetRequest},
    lifecycle::LifecycleService,
    transaction::ProjectId,
};
use std::{fs, path::PathBuf};

struct Fixture {
    _temporary: tempfile::TempDir,
    root: PathBuf,
    service: AuthoringService,
    project: ProjectId,
    project_id: String,
    asset_id: String,
    asset_sha256: String,
}

impl Fixture {
    fn new() -> Self {
        let temporary = tempfile::tempdir().unwrap();
        let profile = temporary.path().join("profile");
        let mut seed = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = fs::canonicalize(profile.join("synthetic-project")).unwrap();
        seed.open_path(&root).unwrap();
        seed.close().unwrap();
        let project: serde_json::Value =
            serde_json::from_slice(&fs::read(root.join(".renpy-editor/project.json")).unwrap())
                .unwrap();
        let project_id = project["projectId"].as_str().unwrap().to_owned();
        let mut service = AuthoringService::default();
        let project = service.register_project(&root).unwrap();
        fs::create_dir_all(root.join("game/images")).unwrap();
        let chosen = temporary.path().join("seal.png");
        fs::write(
            &chosen,
            include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
        )
        .unwrap();
        let choice = service.select_import(&project, &chosen).unwrap();
        let authoring = service
            .import_asset(
                &project,
                &project_id,
                ImportAssetRequest {
                    authority_id: choice.authority_id,
                    kind: AssetKind::UiImage,
                    technical_name: "seal".into(),
                    display_name: "Seal".into(),
                    character_id: None,
                    expression: None,
                },
            )
            .unwrap();
        let asset = &authoring.assets[0];
        Self {
            _temporary: temporary,
            root,
            service,
            project,
            project_id,
            asset_id: asset.id.clone(),
            asset_sha256: asset.sha256.clone(),
        }
    }

    fn starter(&self) -> HelpStarter {
        HelpStarter {
            title: "Help".into(),
            explanation: "Keep reading while this panel is open.".into(),
            asset_id: self.asset_id.clone(),
            expected_asset_sha256: self.asset_sha256.clone(),
            width: 80,
            height: 40,
        }
    }
}

#[test]
fn help_panel_preparation_uses_real_ui_image_and_does_not_accept_source_or_history() {
    let f = Fixture::new();
    let map_before = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let workspace_before = f
        .service
        .scene_workspace(&f.project, &f.project_id)
        .unwrap();
    let source = f
        .service
        .prepare_help_panel(&f.project, &f.project_id, "help_panel", f.starter())
        .unwrap();
    let source = String::from_utf8(source).unwrap();
    assert!(source.starts_with("screen help_panel():\n    modal False\n"));
    assert!(source.contains("key \"game_menu\" action Hide(\"help_panel\")\n"));
    assert!(source.contains("text \"Help\""));
    assert!(source.contains("text \"Keep reading while this panel is open.\""));
    assert!(source.contains("add \"images/ui seal.png\":"));
    assert!(source.contains("xsize 80\n"));
    assert!(source.contains("ysize 40\n"));
    assert!(source.contains("textbutton \"Close\":"));
    assert!(source.contains("action Hide(\"help_panel\")\n"));
    assert!(source.contains("default_focus True\n"));
    assert!(
        !source.contains("dismiss"),
        "Outside clicks must not dismiss the panel"
    );
    assert!(!f.root.join("game/ui/help_panel.rpy").exists());
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        map_before
    );
    let workspace_after = f
        .service
        .scene_workspace(&f.project, &f.project_id)
        .unwrap();
    assert_eq!(workspace_after.can_undo, workspace_before.can_undo);
    assert_eq!(workspace_after.can_redo, workspace_before.can_redo);
}

#[test]
fn help_dialog_preparation_is_editable_modal_and_finishes_without_accepting() {
    let f = Fixture::new();
    let map_before = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let workspace_before = f
        .service
        .scene_workspace(&f.project, &f.project_id)
        .unwrap();
    let source = f
        .service
        .prepare_help_dialog(&f.project, &f.project_id, "help_dialog", f.starter())
        .unwrap();
    let text = String::from_utf8(source.clone()).unwrap();
    assert!(text.starts_with("screen help_dialog():\n    modal True\n"));
    assert!(text.contains("key \"game_menu\" action Return()\n"));
    assert!(text.contains("action Return()\n                default_focus True\n"));
    assert!(!text.contains("Hide("));
    assert!(!text.contains("dismiss"));
    let document = inspect(&source, "game/ui/help_dialog.rpy".into(), "prepared".into()).unwrap();
    let nodes = &document.screens[0].nodes;
    assert_eq!(nodes.iter().filter(|n| n.kind == "text").count(), 2);
    assert_eq!(nodes.iter().filter(|n| n.kind == "image").count(), 1);
    assert_eq!(nodes.iter().filter(|n| n.kind == "textbutton").count(), 1);
    assert!(nodes
        .iter()
        .filter(|n| matches!(
            n.kind.as_str(),
            "frame" | "vbox" | "text" | "image" | "textbutton"
        ))
        .all(|n| n.id.is_some()));
    assert!(!f.root.join("game/ui/help_dialog.rpy").exists());
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        map_before
    );
    let after = f
        .service
        .scene_workspace(&f.project, &f.project_id)
        .unwrap();
    assert_eq!(after.can_undo, workspace_before.can_undo);
    assert_eq!(after.can_redo, workspace_before.can_redo);
}

#[test]
fn help_panel_preparation_refuses_invalid_names_text_and_dimensions() {
    let f = Fixture::new();
    let before = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let mut cases = vec![("bad():\n    python", f.starter())];
    let mut blank_title = f.starter();
    blank_title.title = " ".into();
    cases.push(("help_panel", blank_title));
    let mut long_explanation = f.starter();
    long_explanation.explanation = "x".repeat(8193);
    cases.push(("help_panel", long_explanation));
    let mut nul_title = f.starter();
    nul_title.title = "Help\0".into();
    cases.push(("help_panel", nul_title));
    let mut zero_image = f.starter();
    zero_image.width = 0;
    cases.push(("help_panel", zero_image));
    let mut huge_image = f.starter();
    huge_image.height = 16385;
    cases.push(("help_panel", huge_image));
    for (name, starter) in cases {
        assert!(matches!(
            f.service
                .prepare_help_panel(&f.project, &f.project_id, name, starter),
            Err(crate::scene::SceneError::InvalidPayload)
        ));
    }
    assert_eq!(
        fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
}

fn compose(
    f: &Fixture,
    owner: &crate::metadata::OwnedScreen,
    command: serde_json::Value,
) -> super::ComposeResult {
    let document = f
        .service
        .screens_inspect(
            &f.project,
            InspectRequest {
                path: owner.path.clone(),
            },
        )
        .unwrap();
    f.service
        .screens_compose(
            &f.project,
            &f.project_id,
            serde_json::from_value(serde_json::json!({
                "screenId":owner.id,"expectedRevision":document.revision,"command":command
            }))
            .unwrap(),
        )
        .unwrap()
}

fn history(f: &Fixture, command: crate::scene::SceneCommand) {
    let workspace = f
        .service
        .scene_workspace(&f.project, &f.project_id)
        .unwrap();
    f.service
        .scene_apply(
            &f.project,
            &f.project_id,
            crate::scene::SceneCommandRequest {
                expected_project_revision: workspace.project_revision,
                expected_source_map_revision: workspace.source_map_revision,
                command,
            },
        )
        .unwrap();
}

#[test]
fn help_dismissal_cannot_be_extracted_into_a_component_with_another_panel_target() {
    let f = Fixture::new();
    let catalog = f.service.screens_list(&f.project, &f.project_id).unwrap();
    let created = f
        .service
        .screens_create(
            &f.project,
            &f.project_id,
            super::CreateRequest {
                kind: crate::metadata::OwnedScreenKind::Panel,
                name: "help_panel".into(),
                expected_project_revision: catalog.project_revision,
                expected_source_map_revision: catalog.source_map_revision,
                expected_inventory_revision: catalog.inventory_revision,
                starter: Some(f.starter()),
            },
        )
        .unwrap();
    let owner = &created.owned[0].screen;
    let before = fs::read(f.root.join(&owner.path)).unwrap();
    let map = fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap();
    let document = f
        .service
        .screens_inspect(
            &f.project,
            InspectRequest {
                path: owner.path.clone(),
            },
        )
        .unwrap();
    let binding = crate::metadata::ScreenTargetBinding {
        screen_id: owner.id.clone(),
        source_name: owner.name.clone(),
    };
    let target = f
        .service
        .screens_resolve_target(&f.project, &f.project_id, &binding, None)
        .unwrap();
    let close = document.screens[0]
        .nodes
        .iter()
        .find(|node| node.kind == "textbutton")
        .unwrap();
    let groups = document.screens[0]
        .nodes
        .iter()
        .filter(|node| {
            matches!(node.kind.as_str(), "frame" | "vbox")
                && node.span.start < close.span.start
                && close.span.start < node.source_end
        })
        .collect::<Vec<_>>();
    assert!(!groups.is_empty());
    for group in groups {
        assert_eq!(
            f.service
                .prepare_extract_group(
                    &f.project,
                    &f.project_id,
                    super::components::PrepareExtractRequest {
                        screen_id: owner.id.clone(),
                        node_id: group.id.clone().unwrap(),
                        expected_revision: document.revision.clone(),
                    }
                )
                .unwrap_err(),
            SceneError::OpaqueBoundary
        );
        assert_eq!(
            f.service
                .screens_component_extract(
                    &f.project,
                    &f.project_id,
                    super::components::ExtractRequest {
                        target: binding.clone(),
                        expected: target.revisions.clone(),
                        expected_project_revision: created.project_revision.clone(),
                        node_id: group.id.clone().unwrap(),
                        name: "must_not_move_close".into(),
                    }
                )
                .unwrap_err(),
            SceneError::OpaqueBoundary
        );
        assert_eq!(fs::read(f.root.join(&owner.path)).unwrap(), before);
        assert_eq!(
            fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap(),
            map
        );
    }
    history(&f, crate::scene::SceneCommand::Undo);
    assert!(
        f.service
            .screens_list(&f.project, &f.project_id)
            .unwrap()
            .owned
            .is_empty(),
        "Refusals add no history after the one Help create"
    );
}

#[test]
fn help_starter_nodes_edit_reorder_remove_and_reopen_with_qualified_dismissal_source() {
    use serde_json::json;
    let mut f = Fixture::new();
    let catalog = f.service.screens_list(&f.project, &f.project_id).unwrap();
    let created = f
        .service
        .screens_create(
            &f.project,
            &f.project_id,
            super::CreateRequest {
                kind: crate::metadata::OwnedScreenKind::Panel,
                name: "help_panel".into(),
                expected_project_revision: catalog.project_revision,
                expected_source_map_revision: catalog.source_map_revision,
                expected_inventory_revision: catalog.inventory_revision,
                starter: Some(f.starter()),
            },
        )
        .unwrap();
    let owner = &created.owned[0].screen;
    let path = f.root.join(&owner.path);
    let initial = fs::read_to_string(&path).unwrap();
    let document = f
        .service
        .screens_inspect(
            &f.project,
            InspectRequest {
                path: owner.path.clone(),
            },
        )
        .unwrap();
    let nodes = &document.screens[0].nodes;
    let title = nodes
        .iter()
        .find(|n| n.kind == "text" && n.literal.as_deref() == Some("Help"))
        .unwrap()
        .id
        .clone()
        .unwrap();
    let image = nodes
        .iter()
        .find(|n| n.kind == "image")
        .unwrap()
        .id
        .clone()
        .unwrap();
    let close_node = nodes.iter().find(|n| n.kind == "textbutton").unwrap();
    let close = close_node.id.clone().unwrap();
    let content = nodes
        .iter()
        .find(|node| node.kind == "vbox" && node.parent_start == close_node.parent_start)
        .unwrap()
        .id
        .clone()
        .unwrap();
    compose(
        &f,
        owner,
        json!({"type":"text","nodeId":title,"text":"Quick help"}),
    );
    let edited = fs::read_to_string(&path).unwrap();
    assert_eq!(
        edited,
        initial.replace("text \"Help\"", "text \"Quick help\"")
    );
    assert!(
        !compose(
            &f,
            owner,
            json!({"type":"text","nodeId":title,"text":"Quick help"})
        )
        .changed
    );
    history(&f, crate::scene::SceneCommand::Undo);
    assert_eq!(fs::read_to_string(&path).unwrap(), initial);
    history(&f, crate::scene::SceneCommand::Redo);
    assert_eq!(fs::read_to_string(&path).unwrap(), edited);
    compose(
        &f,
        owner,
        json!({"type":"image","nodeId":image,"assetId":f.asset_id,
        "expectedAssetSha256":f.asset_sha256,"width":160,"height":80}),
    );
    let resized = fs::read_to_string(&path).unwrap();
    assert_eq!(
        resized,
        edited
            .replace("xsize 80", "xsize 160")
            .replace("ysize 40", "ysize 80")
    );
    compose(
        &f,
        owner,
        json!({"type":"reorder","nodeId":close,"targetId":content,"after":false}),
    );
    let reordered = fs::read_to_string(&path).unwrap();
    assert!(
        reordered.find("textbutton \"Close\"").unwrap()
            < reordered.find("text \"Quick help\"").unwrap()
    );
    assert!(reordered.contains(
        "                action Hide(\"help_panel\")\n                default_focus True\n"
    ));
    compose(&f, owner, json!({"type":"remove","nodeId":close}));
    let removed = fs::read_to_string(&path).unwrap();
    assert!(!removed.contains("textbutton \"Close\""));
    assert!(removed.contains("    key \"game_menu\" action Hide(\"help_panel\")\n"));
    history(&f, crate::scene::SceneCommand::Undo);
    assert_eq!(fs::read_to_string(&path).unwrap(), reordered);
    history(&f, crate::scene::SceneCommand::Redo);
    assert_eq!(fs::read_to_string(&path).unwrap(), removed);
    let target = crate::metadata::ScreenTargetBinding {
        screen_id: owner.id.clone(),
        source_name: owner.name.clone(),
    };
    let resolved = f
        .service
        .screens_resolve_target(&f.project, &f.project_id, &target, None)
        .unwrap();
    assert!(!resolved.effects.unknown);
    assert_eq!(resolved.effects.hidden_screens, vec![owner.id.clone()]);
    f.service.unregister_project(&f.project);
    f.project = f.service.register_project(&f.root).unwrap();
    assert_eq!(
        f.service
            .screens_list(&f.project, &f.project_id)
            .unwrap()
            .owned[0]
            .screen,
        *owner
    );
    assert!(
        !compose(
            &f,
            owner,
            json!({"type":"text","nodeId":title,"text":"Quick help"})
        )
        .changed
    );
    assert_eq!(fs::read_to_string(&path).unwrap(), removed);
}
