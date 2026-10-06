//! ADR 0010 ordinary authoring/observation regressions through production services.
use super::*;
fn observe(f: &Fixture) -> flow::FlowWorkspace {
    f.service.flow_observed(&f.project, &f.project_id).unwrap()
}
fn refresh(f: &Fixture) -> flow::FlowWorkspace {
    f.service.flow_workspace(&f.project, &f.project_id).unwrap()
}

#[test]
fn flow_observed_saved_history_reuses_unchanged_inputs_and_lifecycle_inventory() {
    let f = Fixture::new(b"label scene_one:\n    return\n");
    f.migrate();
    let original = observe(&f);
    assert_eq!(original.observation.status, "checked");
    // An unrelated external file is intentionally unseen until disk refresh.
    fs::write(
        f.root.join("game/external.rpy"),
        b"label scene_one:\n    return\n",
    )
    .unwrap();
    assert_eq!(observe(&f).revision, original.revision);
    let model = f.workspace();
    let created = f
        .apply(
            &model,
            SceneCommand::CreateScene {
                chapter_id: model.chapters[0].id.clone(),
                display_name: "Second".into(),
            },
        )
        .unwrap();
    let updated = observe(&f);
    assert_eq!(updated.observation.status, "savedEdits");
    assert_eq!(updated.nodes.len(), 2);
    assert_eq!(
        updated.observation.checked_at,
        original.observation.checked_at
    );
    assert!(!updated.stale);
    let undone = f.apply(&created, SceneCommand::Undo).unwrap();
    assert_eq!(observe(&f).nodes.len(), 1);
    let redone = f.apply(&undone, SceneCommand::Redo).unwrap();
    assert_eq!(observe(&f).nodes.len(), 2);
    assert!(refresh(&f).partial); // duplicate label discovered on explicit Refresh
    fs::remove_file(f.root.join("game/external.rpy")).unwrap();
    assert!(!refresh(&f).stale);
    let second = &redone.scenes[1];
    f.apply(
        &redone,
        SceneCommand::DeleteScene {
            scene_id: second.id.clone(),
            expected_source_revision: second.source_revision.clone(),
        },
    )
    .unwrap();
    assert_eq!(observe(&f).nodes.len(), 1);
}

#[test]
fn flow_observed_explicit_content_inventory_metadata_errors_and_session_cancellation() {
    let mut f = Fixture::new(b"label scene_one:\n    jump elsewhere\n");
    f.migrate();
    let before = observe(&f);
    fs::write(
        f.root.join("game/extra.rpy"),
        b"label elsewhere:\n    return\n",
    )
    .unwrap();
    assert_eq!(observe(&f).revision, before.revision);
    let added = refresh(&f);
    assert_ne!(added.revision, before.revision);
    assert!(matches!(
        &added.edges[0].destination,
        flow::FlowDestination::Unknown {
            location: Some(_),
            ..
        }
    ));
    let extra = f.root.join("game/extra.rpy");
    let modified = fs::metadata(&extra).unwrap().modified().unwrap();
    fs::write(&extra, b"label othername:\n    return\n").unwrap();
    fs::File::options()
        .write(true)
        .open(&extra)
        .unwrap()
        .set_times(fs::FileTimes::new().set_modified(modified))
        .unwrap();
    assert!(matches!(
        &refresh(&f).edges[0].destination,
        flow::FlowDestination::Missing { .. }
    ));
    let replacement = f.root.join("replacement.tmp");
    fs::write(&replacement, b"label elsewhere:\n    return\n").unwrap();
    fs::remove_file(&extra).unwrap();
    fs::rename(&replacement, &extra).unwrap();
    assert!(matches!(
        &refresh(&f).edges[0].destination,
        flow::FlowDestination::Unknown {
            location: Some(_),
            ..
        }
    ));
    fs::remove_file(&extra).unwrap();
    assert!(matches!(
        &refresh(&f).edges[0].destination,
        flow::FlowDestination::Missing { .. }
    ));
    let mut loaded = f.service.load(&f.project, &f.project_id).unwrap();
    loaded.project.scenes[0].display_name = "External name".into();
    fs::write(
        f.root.join(PROJECT_PATH),
        json_bytes(&loaded.project).unwrap(),
    )
    .unwrap();
    assert_ne!(observe(&f).nodes[0].name, "External name");
    assert_eq!(refresh(&f).nodes[0].name, "External name");
    let authoring_path = f.root.join(".renpy-editor/authoring.json");
    let authoring = fs::read(&authoring_path).unwrap();
    fs::write(&authoring_path, b"malformed").unwrap();
    assert!(f.service.flow_workspace(&f.project, &f.project_id).is_err());
    fs::write(&authoring_path, authoring).unwrap();
    assert_eq!(refresh(&f).observation.status, "checked");
    let cancel = std::sync::Arc::new(crate::runtime_work::Cancellation::default());
    crate::runtime_work::scoped(cancel.clone(), || {
        observe(&f);
        refresh(&f);
    });
    assert_eq!(cancel.spawn_count(), 0);
    cancel.cancel();
    crate::runtime_work::scoped(cancel, || {
        assert!(f.service.flow_observed(&f.project, &f.project_id).is_err());
    });
    f.service.unregister_project(&f.project);
    assert!(f.service.observed_flow.lock().unwrap().is_empty());
    assert!(f.service.flow_observed(&f.project, &f.project_id).is_err());
}

#[test]
fn flow_observed_external_mapped_source_reconciles_on_refresh() {
    let f = Fixture::new(b"label scene_one:\n    return\n");
    f.migrate();
    let graph = observe(&f);
    let path = graph.nodes[0].location.as_ref().unwrap().path.clone();
    fs::write(
        f.root.join(&path),
        b"label scene_one:\n    jump scene_one\n",
    )
    .unwrap();
    assert_eq!(observe(&f).revision, graph.revision);
    let changed = refresh(&f);
    assert!(!changed.stale);
    assert_eq!(changed.observation.status, "checked");
    assert!(matches!(
        &changed.edges[0].destination,
        flow::FlowDestination::Resolved { .. }
    ));
    f.service
        .source_open(
            &f.project,
            &f.project_id,
            crate::source::SourceOpenRequest {
                path,
                expected_revision: None,
                selection_start: None,
                selection_end: None,
                byte_start: None,
                byte_end: None,
            },
        )
        .unwrap();
    let reconciled = refresh(&f);
    assert!(!reconciled.stale);
    assert!(matches!(
        &reconciled.edges[0].destination,
        flow::FlowDestination::Resolved { .. }
    ));
}

#[test]
fn flow_observed_authoring_and_media_dependencies_are_reacquired_on_refresh() {
    let mut f = Fixture::new(b"label scene_one:\n    return\n");
    f.migrate();
    let initial = observe(&f);
    f.service
        .create_character(
            &f.project,
            &f.project_id,
            CreateCharacterRequest {
                technical_name: "hero".into(),
                display_name: "Hero".into(),
                dialogue_color: "#ffffff".into(),
            },
        )
        .unwrap();
    let character = observe(&f);
    assert_eq!(character.observation.status, "savedEdits");
    assert_ne!(initial.revision, character.revision);
    let selected_path = f.root.join("theme.ogg");
    fs::write(&selected_path, b"OggSmusic").unwrap();
    let selected = f.service.select_import(&f.project, &selected_path).unwrap();
    let metadata = f
        .service
        .import_asset(
            &f.project,
            &f.project_id,
            ImportAssetRequest {
                authority_id: selected.authority_id,
                kind: AssetKind::Music,
                technical_name: "theme".into(),
                display_name: "Theme".into(),
                character_id: None,
                expression: None,
            },
        )
        .unwrap();
    let imported = observe(&f);
    assert_eq!(imported.observation.status, "checked");
    assert_ne!(imported.revision, character.revision);
    fs::remove_file(f.root.join(&metadata.assets[0].relative_path)).unwrap();
    assert_eq!(observe(&f).revision, imported.revision);
    let missing = refresh(&f);
    assert_ne!(missing.revision, imported.revision);
    let path = f.root.join(".renpy-editor/authoring.json");
    let mut authoring: AuthoringMetadata =
        serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    authoring
        .extra
        .insert("externalFixture".into(), Value::String("changed".into()));
    fs::write(&path, json_bytes(&authoring).unwrap()).unwrap();
    assert_ne!(refresh(&f).revision, missing.revision);
    fs::remove_file(f.root.join(&f.workspace().scenes[0].source_path)).unwrap();
    let missing_source = refresh(&f);
    assert_eq!(missing_source.observation.status, "incomplete");
    assert!(missing_source.stale);
}
