use super::*;

#[test]
fn panel_beats_remain_a_boundary_for_existing_continue_preparation() {
    let f = Fixture::new(b"label scene_one:\n    return\n");
    f.migrate();
    let catalog = f.service.screens_list(&f.project, &f.project_id).unwrap();
    let created = f
        .service
        .screens_create(
            &f.project,
            &f.project_id,
            crate::screens::CreateRequest {
                name: "help_panel".into(),
                expected_project_revision: catalog.project_revision,
                expected_source_map_revision: catalog.source_map_revision,
                expected_inventory_revision: catalog.inventory_revision,
                starter: None,
            },
        )
        .unwrap();
    let target = f
        .service
        .screens_resolve_target(
            &f.project,
            &f.project_id,
            &ScreenTargetBinding {
                screen_id: created.owned[0].screen.id.clone(),
                source_name: "help_panel".into(),
            },
            None,
        )
        .unwrap();
    for show in [true, false] {
        let workspace = f.workspace();
        let scene = &workspace.scenes[0];
        let payload = if show {
            BeatPayload::ShowScreen {
                target: target.binding.clone(),
                revisions: Some(target.revisions.clone()),
            }
        } else {
            let fresh = f
                .service
                .screens_resolve_target(&f.project, &f.project_id, &target.binding, None)
                .unwrap();
            BeatPayload::HideScreen {
                target: fresh.binding,
                revisions: Some(fresh.revisions),
            }
        };
        let inserted = f
            .apply(
                &workspace,
                SceneCommand::InsertBeat {
                    scene_id: scene.id.clone(),
                    expected_source_revision: scene.source_revision.clone(),
                    before_beat_id: None,
                    beat: payload,
                },
            )
            .unwrap();
        let scene = &inserted.scenes[0];
        let source_before = fs::read(f.root.join(&scene.source_path)).unwrap();
        let map_before = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
        assert!(matches!(
            f.service.prepare_continue_scene(
                &f.project,
                &f.project_id,
                &scene.id,
                &scene.source_revision,
                &scene.beats.last().unwrap().id,
                vec![(None, "New dialogue".into())]
            ),
            Err(SceneError::OpaqueBoundary)
        ));
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source_before
        );
        assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), map_before);
    }
}
