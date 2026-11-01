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
        let root = profile.join("synthetic-project");
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
