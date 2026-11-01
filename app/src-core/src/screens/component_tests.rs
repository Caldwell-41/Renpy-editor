use super::*;
use crate::{
    authoring::AuthoringService,
    lifecycle::LifecycleService,
    metadata::{OwnedScreen, OwnedScreenKind, ScreenTargetBinding},
    scene::{SceneCommand, SceneCommandRequest},
    screens::{references::ScreenRevisions, CreateRequest, InspectRequest},
    source::{SourceDocument, SourceDraftRequest, SourceOpenRequest},
    transaction::ProjectId,
};
use std::{fs, path::PathBuf};

const GROUP: &str = "00000000-0000-4000-8000-000000000001";
const TEXT: &str = "00000000-0000-4000-8000-000000000002";

#[path = "component_fixture_tests.rs"]
mod runtime_fixtures;

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
                    starter: None,
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
        self.read(&self.owner.path)
    }

    fn read(&self, path: &str) -> SourceDocument {
        self.service
            .source_open(
                &self.project,
                &self.project_id,
                SourceOpenRequest {
                    path: path.into(),
                    expected_revision: None,
                    selection_start: None,
                    selection_end: None,
                    byte_start: None,
                    byte_end: None,
                },
            )
            .unwrap()
    }

    fn revisions(&self, owner: &OwnedScreen) -> ScreenRevisions {
        self.service
            .screens_resolve_target(&self.project, &self.project_id, &binding(owner), None)
            .unwrap()
            .revisions
    }

    fn history(&self, command: SceneCommand) {
        let workspace = self
            .service
            .scene_workspace(&self.project, &self.project_id)
            .unwrap();
        self.service
            .scene_apply(
                &self.project,
                &self.project_id,
                SceneCommandRequest {
                    expected_project_revision: workspace.project_revision,
                    expected_source_map_revision: workspace.source_map_revision,
                    command,
                },
            )
            .unwrap();
    }

    fn extract_request(&self, name: &str) -> ExtractRequest {
        let catalog = self
            .service
            .screens_list(&self.project, &self.project_id)
            .unwrap();
        ExtractRequest {
            target: binding(&self.owner),
            expected: self.revisions(&self.owner),
            expected_project_revision: catalog.project_revision,
            node_id: GROUP.into(),
            name: name.into(),
        }
    }

    fn create_screen(&self, name: &str) -> OwnedScreen {
        let catalog = self
            .service
            .screens_list(&self.project, &self.project_id)
            .unwrap();
        self.service
            .screens_create(
                &self.project,
                &self.project_id,
                CreateRequest {
                    name: name.into(),
                    starter: None,
                    expected_project_revision: catalog.project_revision,
                    expected_source_map_revision: catalog.source_map_revision,
                    expected_inventory_revision: catalog.inventory_revision,
                },
            )
            .unwrap()
            .owned
            .into_iter()
            .find(|o| o.screen.name == name)
            .unwrap()
            .screen
    }

    fn with_component() -> (Self, OwnedScreen, ComponentChange) {
        let mut fixture = Self::new();
        let source = format!("# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n        text \"Shared\" # loomlight-element: {TEXT}\n", fixture.owner.id);
        fixture.reopen_with_source(&source);
        let change = fixture
            .service
            .screens_component_extract(
                &fixture.project,
                &fixture.project_id,
                fixture.extract_request("shared_content"),
            )
            .unwrap();
        let component = fixture
            .service
            .screens_list(&fixture.project, &fixture.project_id)
            .unwrap()
            .owned
            .into_iter()
            .find(|o| o.screen.id == change.component_id)
            .unwrap()
            .screen;
        (fixture, component, change)
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

fn binding(owner: &OwnedScreen) -> ScreenTargetBinding {
    ScreenTargetBinding {
        screen_id: owner.id.clone(),
        source_name: owner.name.clone(),
    }
}

#[test]
fn placement_adds_a_distinct_bound_use_with_one_history_entry_and_reopen() {
    let (mut fixture, component, extraction) = Fixture::with_component();
    let second = fixture.create_screen("other");
    let before = fixture.read(&second.path).text.unwrap();
    let first_before = fixture.source().text;
    let component_before = fixture.read(&component.path).text;
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
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
    assert_ne!(placed.use_id, extraction.use_id);
    let accepted = format!(
        "{before}    use shared_content # loomlight-element: {}\n",
        placed.use_id
    );
    assert_eq!(fixture.read(&second.path).text, Some(accepted.clone()));
    assert_eq!(fixture.source().text, first_before);
    assert_eq!(fixture.read(&component.path).text, component_before);
    let target = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&second),
            None,
        )
        .unwrap();
    assert!(!target.effects.unknown);
    assert!(target
        .effects
        .dependencies
        .iter()
        .any(|d| d.id == placed.use_id));
    assert!(target
        .effects
        .dependencies
        .iter()
        .any(|d| d.id == component.id));
    fixture.history(SceneCommand::Undo);
    assert_eq!(fixture.read(&second.path).text, Some(before));
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
    fixture.history(SceneCommand::Redo);
    assert_eq!(fixture.read(&second.path).text, Some(accepted));
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    assert_eq!(
        fixture
            .service
            .screens_resolve_target(
                &fixture.project,
                &fixture.project_id,
                &binding(&second),
                None
            )
            .unwrap()
            .effects
            .revision,
        target.effects.revision
    );
}

#[test]
fn independent_copy_retargets_only_one_use_and_allocates_fresh_child_identities() {
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
    let second_before = fixture.read(&second.path).text.unwrap();
    let first_before = fixture.source().text;
    let component_before = fixture.read(&component.path).text;
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
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
                name: "independent_content".into(),
            },
        )
        .unwrap();
    assert_eq!(copied.use_id, placed.use_id);
    assert_ne!(copied.component_id, component.id);
    let copy = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|o| o.screen.id == copied.component_id)
        .unwrap()
        .screen;
    assert_ne!(copy.root_id, component.root_id);
    let copy_doc = fixture
        .service
        .screens_inspect(
            &fixture.project,
            InspectRequest {
                path: copy.path.clone(),
            },
        )
        .unwrap();
    let copy_text = copy_doc.screens[0]
        .nodes
        .iter()
        .find(|n| n.literal.as_deref() == Some("Shared"))
        .unwrap()
        .id
        .clone()
        .unwrap();
    assert!(copy_doc.screens[0]
        .nodes
        .iter()
        .filter_map(|n| n.id.as_deref())
        .all(|id| id != GROUP && id != TEXT));
    assert_eq!(
        fixture.read(&second.path).text,
        Some(second_before.replace("use shared_content", "use independent_content"))
    );
    let copy_initial = fixture.read(&copy.path).text;
    let edited = fixture.service.screens_compose(&fixture.project, &fixture.project_id, serde_json::from_value(serde_json::json!({
        "screenId":copy.id,"expectedRevision":fixture.revisions(&copy).source,
        "componentRevisions":fixture.revisions(&copy),"command":{"type":"text","nodeId":copy_text,"text":"Independent"}
    })).unwrap()).unwrap();
    assert!(edited.changed);
    assert_eq!(fixture.read(&component.path).text, component_before);
    assert_eq!(fixture.source().text, first_before);
    assert!(fixture
        .read(&copy.path)
        .text
        .unwrap()
        .contains("\"Independent\""));
    fixture.history(SceneCommand::Undo);
    assert_eq!(fixture.read(&copy.path).text, copy_initial);
    fixture.history(SceneCommand::Undo);
    assert_eq!(fixture.read(&second.path).text, Some(second_before));
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
    fixture.history(SceneCommand::Redo);
    fixture.history(SceneCommand::Redo);
    let accepted_effects = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&second),
            None,
        )
        .unwrap()
        .effects;
    assert!(accepted_effects
        .dependencies
        .iter()
        .any(|d| d.id == copy.id));
    assert!(!accepted_effects
        .dependencies
        .iter()
        .any(|d| d.id == component.id));
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    assert_eq!(
        fixture
            .service
            .screens_resolve_target(
                &fixture.project,
                &fixture.project_id,
                &binding(&second),
                None
            )
            .unwrap()
            .effects
            .revision,
        accepted_effects.revision
    );
    assert_eq!(fixture.read(&component.path).text, component_before);
}

#[test]
fn extraction_refuses_a_missing_group_body_without_creating_source_or_history() {
    let mut fixture = Fixture::new();
    let source = format!(
        "# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n",
        fixture.owner.id
    );
    fixture.reopen_with_source(&source);
    assert_eq!(
        fixture
            .service
            .screens_component_extract(
                &fixture.project,
                &fixture.project_id,
                fixture.extract_request("incomplete")
            )
            .unwrap_err(),
        crate::scene::SceneError::OpaqueBoundary
    );
    assert_eq!(fixture.source().text, Some(source));
    assert_eq!(
        fixture
            .service
            .screens_list(&fixture.project, &fixture.project_id)
            .unwrap()
            .owned
            .len(),
        1
    );
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}

#[test]
fn extraction_refusals_keep_source_metadata_history_and_source_drafts() {
    let mut fixture = Fixture::new();
    let source = format!("# loomlight-screen: {}\nscreen notes():\n    vbox: # loomlight-element: {GROUP}\n        text \"Saved\" # loomlight-element: {TEXT}\n", fixture.owner.id);
    fixture.reopen_with_source(&source);
    let before = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    for (name, expected) in [
        ("invalid-name", crate::scene::SceneError::InvalidPayload),
        ("notes", crate::scene::SceneError::ReferenceBlocked),
    ] {
        assert_eq!(
            fixture
                .service
                .screens_component_extract(
                    &fixture.project,
                    &fixture.project_id,
                    fixture.extract_request(name)
                )
                .unwrap_err(),
            expected
        );
    }
    let mut stale = fixture.extract_request("stale");
    stale.expected.inventory = "0".repeat(64);
    assert_eq!(
        fixture
            .service
            .screens_component_extract(&fixture.project, &fixture.project_id, stale)
            .unwrap_err(),
        crate::scene::SceneError::SourceConflict
    );
    let retained_request = fixture.extract_request("draft");
    let opened = fixture.source();
    let draft = source.replace("Saved", "Unfinished draft");
    fixture
        .service
        .source_update_draft(
            &fixture.project,
            &fixture.project_id,
            SourceDraftRequest {
                path: fixture.owner.path.clone(),
                expected_base_revision: opened.base_revision,
                text: draft.clone(),
                selection_start: 18,
                selection_end: 18,
            },
        )
        .unwrap();
    assert_eq!(
        fixture
            .service
            .screens_component_extract(
                &fixture.project,
                &fixture.project_id,
                retained_request.clone()
            )
            .unwrap_err(),
        crate::scene::SceneError::DirtySource
    );
    assert_eq!(retained_request.name, "draft");
    let retained = fixture.source();
    assert_eq!(retained.text, Some(draft));
    assert_eq!(retained.selection_start, 18);
    let after = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(after.source_map_revision, before.source_map_revision);
    assert_eq!(after.inventory_revision, before.inventory_revision);
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}

#[test]
fn nested_extraction_and_copy_preserve_targets_with_distinct_internal_use_ids() {
    let (fixture, leaf, _) = Fixture::with_component();
    let panel = fixture.create_screen("wrapper_panel");
    let added = fixture
        .service
        .screens_compose(
            &fixture.project,
            &fixture.project_id,
            serde_json::from_value(serde_json::json!({
                "screenId":panel.id,"expectedRevision":fixture.revisions(&panel).source,
                "command":{"type":"add","parentId":panel.root_id,"kind":"vbox","text":""}
            }))
            .unwrap(),
        )
        .unwrap();
    let internal = fixture
        .service
        .screens_component_place(
            &fixture.project,
            &fixture.project_id,
            PlaceRequest {
                component: binding(&leaf),
                expected_component: fixture.revisions(&leaf),
                target: binding(&panel),
                expected_target: fixture.revisions(&panel),
                parent_id: added.selected_id.clone(),
            },
        )
        .unwrap();
    let wrapped = fixture
        .service
        .screens_component_extract(
            &fixture.project,
            &fixture.project_id,
            ExtractRequest {
                target: binding(&panel),
                expected: fixture.revisions(&panel),
                expected_project_revision: fixture
                    .service
                    .screens_list(&fixture.project, &fixture.project_id)
                    .unwrap()
                    .project_revision,
                node_id: added.selected_id,
                name: "wrapper".into(),
            },
        )
        .unwrap();
    let wrapper = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap()
        .owned
        .into_iter()
        .find(|o| o.screen.id == wrapped.component_id)
        .unwrap()
        .screen;
    let wrapper_effects = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&wrapper),
            None,
        )
        .unwrap()
        .effects;
    assert!(!wrapper_effects.unknown);
    assert!(wrapper_effects
        .dependencies
        .iter()
        .any(|d| d.id == internal.use_id));
    let copied = fixture
        .service
        .screens_component_copy(
            &fixture.project,
            &fixture.project_id,
            CopyRequest {
                target: binding(&panel),
                expected_target: fixture.revisions(&panel),
                use_id: wrapped.use_id.clone(),
                expected_component: fixture.revisions(&wrapper),
                expected_project_revision: fixture
                    .service
                    .screens_list(&fixture.project, &fixture.project_id)
                    .unwrap()
                    .project_revision,
                name: "wrapper_copy".into(),
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
    let doc = fixture
        .service
        .screens_inspect(&fixture.project, InspectRequest { path: copy.path })
        .unwrap();
    let cloned_use = doc.screens[0]
        .nodes
        .iter()
        .find(|n| n.kind == "use")
        .unwrap();
    assert_eq!(cloned_use.literal.as_deref(), Some(leaf.name.as_str()));
    assert_ne!(cloned_use.id.as_deref(), Some(internal.use_id.as_str()));
    let effects = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&panel),
            None,
        )
        .unwrap()
        .effects;
    assert!(!effects.unknown);
    assert!(effects.dependencies.iter().any(|d| d.id == leaf.id));
    assert!(effects
        .dependencies
        .iter()
        .any(|d| Some(d.id.as_str()) == cloned_use.id.as_deref()));
    assert!(!effects.dependencies.iter().any(|d| d.id == internal.use_id));
    let before = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(
        fixture
            .service
            .screens_component_place(
                &fixture.project,
                &fixture.project_id,
                PlaceRequest {
                    component: binding(&wrapper),
                    expected_component: fixture.revisions(&wrapper),
                    target: binding(&leaf),
                    expected_target: fixture.revisions(&leaf),
                    parent_id: leaf.root_id,
                }
            )
            .unwrap_err(),
        crate::scene::SceneError::ReferenceBlocked
    );
    let after = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(after.inventory_revision, before.inventory_revision);
    assert_eq!(after.source_map_revision, before.source_map_revision);
}

#[test]
fn copy_and_placement_refuse_missing_or_renamed_components_without_name_retargeting() {
    for damage in ["rename", "delete", "use-token"] {
        let (fixture, component, extraction) = Fixture::with_component();
        let other = fixture.create_screen("other");
        let source = fixture.source().text.unwrap();
        let component_source = fixture.read(&component.path).text.unwrap();
        let old_component_revision = fixture.revisions(&component);
        if damage == "use-token" {
            fs::write(
                fixture.root.join(&fixture.owner.path),
                source.replace("use shared_content", "use other"),
            )
            .unwrap();
        } else {
            if damage == "rename" {
                fs::write(
                    fixture.root.join(&component.path),
                    component_source
                        .replace("screen shared_content():", "screen renamed_content():"),
                )
                .unwrap();
            } else {
                fs::remove_file(fixture.root.join(&component.path)).unwrap();
            }
            fs::write(
                fixture.root.join("game/ui/replacement.rpy"),
                "screen shared_content():\n    text \"Unowned replacement\"\n",
            )
            .unwrap();
        }
        let before = fixture
            .service
            .screens_list(&fixture.project, &fixture.project_id)
            .unwrap();
        let owner_revision = fixture.revisions(&fixture.owner);
        // Resolution must refuse missing intent before comparing a stale component revision.
        let component_revision = if damage == "use-token" {
            fixture.revisions(&component)
        } else {
            old_component_revision
        };
        assert_eq!(
            fixture
                .service
                .screens_component_copy(
                    &fixture.project,
                    &fixture.project_id,
                    CopyRequest {
                        target: binding(&fixture.owner),
                        expected_target: owner_revision,
                        use_id: extraction.use_id,
                        expected_component: component_revision.clone(),
                        expected_project_revision: before.project_revision.clone(),
                        name: "refused_copy".into(),
                    }
                )
                .unwrap_err(),
            crate::scene::SceneError::ReferenceBlocked,
            "{damage}"
        );
        if damage != "use-token" {
            assert_eq!(
                fixture
                    .service
                    .screens_component_place(
                        &fixture.project,
                        &fixture.project_id,
                        PlaceRequest {
                            component: binding(&component),
                            expected_component: component_revision,
                            target: binding(&other),
                            expected_target: fixture.revisions(&other),
                            parent_id: other.root_id,
                        }
                    )
                    .unwrap_err(),
                crate::scene::SceneError::ReferenceBlocked,
                "{damage}"
            );
        }
        let after = fixture
            .service
            .screens_list(&fixture.project, &fixture.project_id)
            .unwrap();
        assert_eq!(after.source_map_revision, before.source_map_revision);
        assert_eq!(after.inventory_revision, before.inventory_revision);
        assert_eq!(after.owned.len(), before.owned.len());
        if damage == "use-token" {
            let effects = fixture
                .service
                .screens_resolve_target(
                    &fixture.project,
                    &fixture.project_id,
                    &binding(&fixture.owner),
                    None,
                )
                .unwrap()
                .effects;
            assert!(effects.unknown);
            assert!(!effects.dependencies.iter().any(|d| d.id == other.id));
        }
    }
}

#[test]
fn stale_place_and_copy_keep_the_source_draft_and_competing_external_revision() {
    let (mut fixture, component, extraction) = Fixture::with_component();
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    let before = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    let place = PlaceRequest {
        component: binding(&component),
        expected_component: fixture.revisions(&component),
        target: binding(&fixture.owner),
        expected_target: fixture.revisions(&fixture.owner),
        parent_id: fixture.owner.root_id.clone(),
    };
    let copy = CopyRequest {
        target: binding(&fixture.owner),
        expected_target: fixture.revisions(&fixture.owner),
        use_id: extraction.use_id,
        expected_component: fixture.revisions(&component),
        expected_project_revision: before.project_revision,
        name: "retained_copy_name".into(),
    };
    let opened = fixture.source();
    let source = opened.text.unwrap();
    let draft = format!("{source}# unfinished local draft\n");
    fixture
        .service
        .source_update_draft(
            &fixture.project,
            &fixture.project_id,
            SourceDraftRequest {
                path: fixture.owner.path.clone(),
                expected_base_revision: opened.base_revision,
                text: draft.clone(),
                selection_start: 21,
                selection_end: 21,
            },
        )
        .unwrap();
    let external = format!("{source}# ordinary external save\n");
    fs::write(fixture.root.join(&fixture.owner.path), &external).unwrap();
    assert_eq!(
        fixture
            .service
            .screens_component_place(&fixture.project, &fixture.project_id, place.clone())
            .unwrap_err(),
        crate::scene::SceneError::SourceConflict
    );
    assert_eq!(
        fixture
            .service
            .screens_component_copy(&fixture.project, &fixture.project_id, copy.clone())
            .unwrap_err(),
        crate::scene::SceneError::SourceConflict
    );
    let retained = fixture.source();
    assert_eq!(retained.text, Some(draft));
    assert_eq!(retained.external_text, Some(external));
    assert_eq!(retained.selection_start, 21);
    assert_eq!(copy.name, "retained_copy_name");
    assert_eq!(place.parent_id, fixture.owner.root_id);
    let after = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(after.source_map_revision, before.source_map_revision);
    assert_eq!(after.owned.len(), before.owned.len());
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
}

#[test]
fn shared_component_text_noop_has_no_history_and_changed_apply_updates_both_uses() {
    let (mut fixture, component, _) = Fixture::with_component();
    let second = fixture.create_screen("other");
    fixture
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
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    let first_before = fixture.source().text;
    let second_before = fixture.read(&second.path).text;
    let component_before = fixture.read(&component.path).text;
    let revisions = fixture.revisions(&component);
    let before = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    let compose = |text: &str| {
        serde_json::from_value(serde_json::json!({
        "screenId":component.id,"expectedRevision":revisions.source,"componentRevisions":revisions,
        "command":{"type":"text","nodeId":TEXT,"text":text}
    })).unwrap()
    };
    let noop = fixture
        .service
        .screens_compose(&fixture.project, &fixture.project_id, compose("Shared"))
        .unwrap();
    assert!(!noop.changed);
    let after_noop = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    assert_eq!(after_noop.inventory_revision, before.inventory_revision);
    assert_eq!(after_noop.source_map_revision, before.source_map_revision);
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
    let changed = fixture
        .service
        .screens_compose(&fixture.project, &fixture.project_id, compose("Updated"))
        .unwrap();
    assert!(changed.changed);
    assert_eq!(
        fixture.read(&component.path).text,
        component_before
            .as_ref()
            .map(|s| s.replace("\"Shared\"", "\"Updated\""))
    );
    assert_eq!(fixture.source().text, first_before);
    assert_eq!(fixture.read(&second.path).text, second_before);
    for owner in [&fixture.owner, &second] {
        let doc = changed
            .documents
            .iter()
            .find(|d| d.path == owner.path)
            .unwrap();
        let uses = doc
            .screens
            .iter()
            .flat_map(|s| &s.nodes)
            .filter(|node| node.kind == "use")
            .collect::<Vec<_>>();
        assert_eq!(uses.len(), 1);
        let reference = uses[0].component.as_ref().unwrap();
        assert!(reference.resolved);
        assert_eq!(
            reference.source_revision.as_ref(),
            Some(&changed.document.revision)
        );
        let effects = fixture
            .service
            .screens_resolve_target(&fixture.project, &fixture.project_id, &binding(owner), None)
            .unwrap()
            .effects;
        assert!(!effects.unknown);
        assert!(effects
            .dependencies
            .iter()
            .any(|d| d.id == component.id && d.revision == changed.document.revision));
    }
    fixture.history(SceneCommand::Undo);
    assert_eq!(fixture.read(&component.path).text, component_before);
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
    fixture.history(SceneCommand::Redo);
    assert!(fixture
        .read(&component.path)
        .text
        .unwrap()
        .contains("\"Updated\""));
}

#[test]
fn incomplete_inclusion_graph_refuses_placement_even_into_an_owned_panel() {
    let (fixture, component, _) = Fixture::with_component();
    let target = fixture.create_screen("other");
    fs::write(fixture.root.join("game/ui/opaque.rpy"), "screen opaque():\n    use expression chosen_screen\n").unwrap();
    let before = fixture.service.screens_list(&fixture.project, &fixture.project_id).unwrap();
    let source = fixture.read(&target.path).text;
    let result = fixture.service.screens_component_place(&fixture.project, &fixture.project_id, PlaceRequest {
        component:binding(&component),expected_component:fixture.revisions(&component),target:binding(&target),expected_target:fixture.revisions(&target),parent_id:target.root_id.clone(),
    });
    assert!(result.is_err(), "unaccounted graph admitted placement: {result:?}");
    let after = fixture.service.screens_list(&fixture.project, &fixture.project_id).unwrap();
    assert_eq!(after.inventory_revision, before.inventory_revision);
    assert_eq!(after.source_map_revision, before.source_map_revision);
    assert_eq!(fixture.read(&target.path).text, source);
}

#[test]
fn extract_replaces_only_the_group_and_creates_one_owned_component_history_entry() {
    let mut fixture = Fixture::new();
    let group = format!("        vbox: # loomlight-element: {GROUP}\r\n            # retained comment\r\n            text \"Shared\" # loomlight-element: {TEXT}\r\n");
    let source = format!("\u{feff}# loomlight-screen: {}\r\nscreen notes():\r\n    fixed: # loomlight-element: 00000000-0000-4000-8000-000000000003\r\n{group}    $ opaque_neighbor()\r\n", fixture.owner.id);
    fixture.reopen_with_source(&source);
    let result = fixture
        .service
        .screens_component_extract(
            &fixture.project,
            &fixture.project_id,
            fixture.extract_request("shared_content"),
        )
        .unwrap();
    let catalog = fixture
        .service
        .screens_list(&fixture.project, &fixture.project_id)
        .unwrap();
    let component = catalog
        .owned
        .iter()
        .find(|owner| owner.screen.id == result.component_id)
        .unwrap();
    assert!(component.resolved);
    assert_eq!(component.screen.kind, OwnedScreenKind::Component);
    assert_ne!(result.use_id, GROUP);
    assert_ne!(result.use_id, TEXT);
    let accepted = source.replace(
        &group,
        &format!(
            "        use shared_content # loomlight-element: {}\r\n",
            result.use_id
        ),
    );
    assert_eq!(
        fixture.source().text.as_deref(),
        Some(accepted.trim_start_matches('\u{feff}'))
    );
    assert!(fixture.source().has_bom);
    let component_source = fixture.read(&component.screen.path).text.unwrap();
    assert_eq!(component_source, format!("# loomlight-screen: {}\nscreen shared_content():\r\n    vbox: # loomlight-element: {GROUP}\r\n        # retained comment\r\n        text \"Shared\" # loomlight-element: {TEXT}\r\n", component.screen.id));
    let target = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&fixture.owner),
            None,
        )
        .unwrap();
    assert!(target
        .effects
        .dependencies
        .iter()
        .any(|d| d.id == result.use_id));
    assert!(target
        .effects
        .dependencies
        .iter()
        .any(|d| d.id == result.component_id));
    assert!(
        target.effects.unknown,
        "opaque neighbor must remain unknown"
    );
    fixture.history(SceneCommand::Undo);
    assert_eq!(
        fixture.source().text.as_deref(),
        Some(source.trim_start_matches('\u{feff}'))
    );
    assert_eq!(
        fixture
            .service
            .screens_list(&fixture.project, &fixture.project_id)
            .unwrap()
            .owned
            .len(),
        1
    );
    assert!(
        !fixture
            .service
            .scene_workspace(&fixture.project, &fixture.project_id)
            .unwrap()
            .can_undo
    );
    fixture.history(SceneCommand::Redo);
    assert_eq!(
        fixture.source().text.as_deref(),
        Some(accepted.trim_start_matches('\u{feff}'))
    );
    fixture.service.unregister_project(&fixture.project);
    fixture.service = AuthoringService::default();
    fixture.project = fixture.service.register_project(&fixture.root).unwrap();
    assert_eq!(
        fixture.read(&component.screen.path).text,
        Some(component_source)
    );
    let reopened = fixture
        .service
        .screens_resolve_target(
            &fixture.project,
            &fixture.project_id,
            &binding(&fixture.owner),
            None,
        )
        .unwrap();
    assert_eq!(reopened.effects.revision, target.effects.revision);
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
