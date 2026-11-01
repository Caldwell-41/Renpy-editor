use super::*;
use crate::{
    authoring::AuthoringService,
    lifecycle::LifecycleService,
    screens::{CreateRequest, InspectRequest},
    source::{SourceDocument, SourceDraftRequest, SourceOpenRequest},
    transaction::ProjectId,
};
use std::{fs, path::PathBuf};

const GROUP: &str = "00000000-0000-4000-8000-000000000001";
const TEXT: &str = "00000000-0000-4000-8000-000000000002";

struct Fixture {
    _temporary: tempfile::TempDir,
    root: PathBuf,
    service: AuthoringService,
    project: ProjectId,
    project_id: String,
    owner: crate::metadata::OwnedScreen,
}

impl Fixture {
    fn new() -> Self {
        let temporary = tempfile::tempdir().unwrap();
        let profile = temporary.path().join("profile");
        let bootstrap = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = fs::canonicalize(profile.join("synthetic-project")).unwrap();
        drop(bootstrap);
        let project_id = serde_json::from_slice::<serde_json::Value>(
            &fs::read(root.join(".renpy-editor/project.json")).unwrap(),
        )
        .unwrap()["projectId"]
            .as_str()
            .unwrap()
            .to_owned();
        let service = AuthoringService::default();
        let project = service.register_project(&root).unwrap();
        let catalog = service.screens_list(&project, &project_id).unwrap();
        let created = service
            .screens_create(
                &project,
                &project_id,
                CreateRequest {
                    name: "notes".into(),
                    expected_project_revision: catalog.project_revision,
                    expected_source_map_revision: catalog.source_map_revision,
                    expected_inventory_revision: catalog.inventory_revision,
                },
            )
            .unwrap();
        Self {
            _temporary: temporary,
            root,
            service,
            project,
            project_id,
            owner: created.owned[0].screen.clone(),
        }
    }

    fn source(&self) -> SourceDocument {
        self.service
            .source_open(
                &self.project,
                &self.project_id,
                SourceOpenRequest {
                    path: self.owner.path.clone(),
                    expected_revision: None,
                    selection_start: None,
                    selection_end: None,
                    byte_start: None,
                    byte_end: None,
                },
            )
            .unwrap()
    }

    fn reopen_with_source(&mut self, source: &str) {
        self.service.unregister_project(&self.project);
        fs::write(self.root.join(&self.owner.path), source).unwrap();
        self.service = AuthoringService::default();
        self.project = self.service.register_project(&self.root).unwrap();
    }

    fn request(&self) -> PrepareExtractRequest {
        let document = self
            .service
            .screens_inspect(
                &self.project,
                InspectRequest {
                    path: self.owner.path.clone(),
                },
            )
            .unwrap();
        PrepareExtractRequest {
            screen_id: self.owner.id.clone(),
            node_id: GROUP.into(),
            expected_revision: document.revision,
        }
    }
}

#[test]
fn prepare_extract_preserves_exact_group_and_opaque_neighbors_without_writing() {
    let mut fixture = Fixture::new();
    let group = format!(
        "    vbox: # loomlight-element: {GROUP}\r\n        # keep this comment\r\n        text \"Héllo\" # loomlight-element: {TEXT}\r\n"
    );
    let source = format!(
        "\u{feff}# loomlight-screen: {}\r\nscreen notes():\r\n    use custom_header() # opaque neighbor\r\n{group}    $ custom_footer()\r\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    let before = fixture.source();
    let catalog_before = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    let prepared = fixture
        .service
        .prepare_extract_group(&fixture.project, &fixture.project_id, fixture.request())
        .unwrap();
    assert_eq!(prepared.source, group);
    assert_eq!(&source[prepared.span.start..prepared.span.end], group);
    assert_eq!(prepared.path, fixture.owner.path);
    assert_eq!(prepared.source_revision, before.base_revision);
    assert_eq!(prepared.node_id, GROUP);
    assert_eq!(prepared.screen_id, fixture.owner.id);
    assert_eq!(fixture.source().text, before.text);
    assert!(fixture.source().has_bom);
    let catalog_after = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(
        catalog_after.source_map_revision,
        catalog_before.source_map_revision
    );
    assert_eq!(
        catalog_after.inventory_revision,
        catalog_before.inventory_revision
    );
    let workspace = fixture
        .service
        .scene_workspace(&fixture.project, &fixture.project_id)
        .unwrap();
    assert!(!workspace.can_undo && !workspace.can_redo);
}

#[test]
fn prepare_extract_refuses_unterminated_group_without_changing_source_or_history() {
    let mut fixture = Fixture::new();
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n        text \"No final newline\" # loomlight-element: {TEXT}",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    assert_eq!(
        fixture
            .service
            .prepare_extract_group(&fixture.project, &fixture.project_id, fixture.request())
            .unwrap_err(),
        crate::scene::SceneError::OpaqueBoundary
    );
    assert_eq!(fixture.source().text, Some(source));
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}

#[test]
fn prepare_extract_refuses_text_that_can_capture_screen_local_values() {
    let mut fixture = Fixture::new();
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n    default screen_value = \"Local\"\n    vbox: # loomlight-element: {GROUP}\n        text \"Hello [screen_value]\" # loomlight-element: {TEXT}\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    assert_eq!(
        fixture
            .service
            .prepare_extract_group(&fixture.project, &fixture.project_id, fixture.request())
            .unwrap_err(),
        crate::scene::SceneError::OpaqueBoundary
    );
    assert_eq!(fixture.source().text, Some(source));
}

#[test]
fn prepare_extract_keeps_supported_style_references_in_the_selected_group() {
    let mut fixture = Fixture::new();
    let group = format!(
        "    vbox: # loomlight-element: {GROUP}\n        text \"Styled\": # loomlight-element: {TEXT}\n            style \"ll_body\"\n"
    );
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n{group}\nstyle ll_body is text:\n    size 24\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    let prepared = fixture
        .service
        .prepare_extract_group(&fixture.project, &fixture.project_id, fixture.request())
        .unwrap();
    assert_eq!(prepared.source, group);
    assert_eq!(fixture.source().text, Some(source));
}

#[test]
fn prepare_extract_refuses_dirty_source_and_retains_the_draft() {
    let mut fixture = Fixture::new();
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n        text \"Saved\" # loomlight-element: {TEXT}\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    let request = fixture.request();
    let before = fixture.source();
    let draft = source.replace("Saved", "Unfinished Source draft");
    fixture
        .service
        .source_update_draft(
            &fixture.project,
            &fixture.project_id,
            SourceDraftRequest {
                path: fixture.owner.path.clone(),
                expected_base_revision: before.base_revision.clone(),
                text: draft.clone(),
                selection_start: 12,
                selection_end: 12,
            },
        )
        .unwrap();
    assert_eq!(
        fixture
            .service
            .prepare_extract_group(&fixture.project, &fixture.project_id, request)
            .unwrap_err(),
        crate::scene::SceneError::DirtySource
    );
    let retained = fixture.source();
    assert!(retained.dirty);
    assert_eq!(retained.text, Some(draft));
    assert_eq!(retained.base_revision, before.base_revision);
    assert_eq!(retained.selection_start, 12);
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}

#[test]
fn prepare_extract_refuses_a_stale_selection_after_an_external_edit() {
    let mut fixture = Fixture::new();
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n        text \"Saved\" # loomlight-element: {TEXT}\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    let request = fixture.request();
    let external = source.replace("Saved", "External edit");
    fs::write(fixture.root.join(&fixture.owner.path), &external).unwrap();
    assert_eq!(
        fixture
            .service
            .prepare_extract_group(&fixture.project, &fixture.project_id, request)
            .unwrap_err(),
        crate::scene::SceneError::SourceConflict
    );
    assert_eq!(fixture.source().text, Some(external));
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}
