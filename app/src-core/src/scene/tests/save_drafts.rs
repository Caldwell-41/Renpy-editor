use super::*;

fn narration(text: &str) -> BeatPayload {
    BeatPayload::Narration { text: text.into() }
}

/// Two scenes: the fixture's scene with two narrations and a created one with one.
fn two_scenes() -> (Fixture, SceneWorkspace) {
    let f = Fixture::new(b"label scene_one:\n    \"First\"\n    \"Second\"\n    return\n");
    f.migrate();
    let ws = f.workspace();
    let ws = f
        .apply(
            &ws,
            SceneCommand::CreateScene {
                chapter_id: ws.chapters[0].id.clone(),
                display_name: "Scene 2".into(),
            },
        )
        .unwrap();
    let other = ws
        .scenes
        .iter()
        .find(|s| s.display_name == "Scene 2")
        .unwrap();
    let ws = f
        .apply(
            &ws,
            SceneCommand::InsertBodyBeat {
                scene_id: other.id.clone(),
                expected_source_revision: other.source_revision.clone(),
                body: BodyRef::Root,
                position: Position::Before {
                    anchor: NodeRef::Beat {
                        beat_id: other.beats[0].id.clone(),
                    },
                },
                beat: narration("Other"),
            },
        )
        .unwrap();
    (f, ws)
}

fn save(
    f: &Fixture,
    ws: &SceneWorkspace,
    commands: Vec<SceneCommand>,
) -> Result<SceneWorkspace, SceneError> {
    f.service.scene_save_drafts(
        &f.project,
        &f.project_id,
        SceneSaveDraftsRequest {
            expected_project_revision: ws.project_revision.clone(),
            expected_source_map_revision: ws.source_map_revision.clone(),
            expected_authoring_revision: None,
            commands,
        },
    )
}

fn update(scene: &SceneDocument, index: usize, text: &str) -> SceneCommand {
    SceneCommand::UpdateBodyBeat {
        scene_id: scene.id.clone(),
        expected_source_revision: scene.source_revision.clone(),
        beat_id: scene.beats[index].id.clone(),
        expected_body: BodyRef::Root,
        beat: narration(text),
    }
}

/// Every file Loomlight owns or authors, by relative path.
fn project_bytes(f: &Fixture) -> BTreeMap<String, Vec<u8>> {
    let mut files = BTreeMap::new();
    let mut pending = vec![f.root.join("game"), f.root.join(".renpy-editor")];
    while let Some(dir) = pending.pop() {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.ends_with("recovery") {
                continue;
            }
            if path.is_dir() {
                pending.push(path);
            } else {
                let relative = path
                    .strip_prefix(&f.root)
                    .unwrap()
                    .to_string_lossy()
                    .into_owned();
                files.insert(relative, fs::read(&path).unwrap());
            }
        }
    }
    files
}

#[test]
fn story_save_commits_drafts_across_scenes_as_one_history_action() {
    let (f, ws) = two_scenes();
    let (first, other) = (&ws.scenes[0], &ws.scenes[1]);
    let before = project_bytes(&f);
    let saved = save(
        &f,
        &ws,
        vec![
            update(first, 0, "First draft"),
            SceneCommand::InsertBodyBeat {
                scene_id: first.id.clone(),
                expected_source_revision: first.source_revision.clone(),
                body: BodyRef::Root,
                position: Position::Before {
                    anchor: NodeRef::Beat {
                        beat_id: first.beats[1].id.clone(),
                    },
                },
                beat: narration("Inserted draft"),
            },
            update(other, 0, "Other draft"),
        ],
    )
    .unwrap();
    assert_eq!(
        fs::read(f.root.join(&first.source_path)).unwrap(),
        b"label scene_one:\n    \"First draft\"\n    \"Inserted draft\"\n    \"Second\"\n    return\n"
    );
    let other_source =
        String::from_utf8(fs::read(f.root.join(&other.source_path)).unwrap()).unwrap();
    assert!(other_source.contains("\"Other draft\"") && !other_source.contains("\"Other\"\n"));
    // Beat ids survive, and the saved workspace maps the new beat.
    let accepted = &saved.scenes[0];
    assert_eq!(accepted.beats[0].id, first.beats[0].id);
    assert_eq!(accepted.beats[2].id, first.beats[1].id);
    assert_eq!(accepted.beats[1].payload, narration("Inserted draft"));
    assert_eq!(
        f.history().undo.unwrap().name,
        "save of 3 beat drafts",
        "one Story Save is one entry until #113"
    );

    f.undo().unwrap();
    assert_eq!(
        project_bytes(&f),
        before,
        "one Undo reverts the whole Story Save"
    );
}

#[test]
fn story_save_refusal_names_the_command_and_writes_nothing() {
    let (f, ws) = two_scenes();
    let (first, other) = (&ws.scenes[0], &ws.scenes[1]);
    let before = project_bytes(&f);
    assert_eq!(
        save(&f, &ws, vec![]).unwrap_err(),
        SceneError::InvalidPayload
    );
    assert_eq!(
        save(
            &f,
            &ws,
            vec![SceneCommand::RenameScene {
                scene_id: first.id.clone(),
                display_name: "Not a beat".into(),
            }]
        )
        .unwrap_err(),
        SceneError::InvalidPayload
    );
    let mut missing = update(first, 1, "Lost beat");
    if let SceneCommand::UpdateBodyBeat { beat_id, .. } = &mut missing {
        *beat_id = "missing-beat".into();
    }
    let refused = save(
        &f,
        &ws,
        vec![
            update(first, 0, "Kept out"),
            missing,
            update(other, 0, "Never built"),
        ],
    );
    assert!(
        matches!(refused, Err(SceneError::Indexed { index: 1, .. })),
        "{refused:?}"
    );
    assert_eq!(project_bytes(&f), before);

    // A stale scene revision refuses with its index too, and writes nothing.
    fs::write(
        f.root.join(&other.source_path),
        [
            fs::read(f.root.join(&other.source_path)).unwrap(),
            b"# external\n".to_vec(),
        ]
        .concat(),
    )
    .unwrap();
    let before = project_bytes(&f);
    let stale = save(
        &f,
        &ws,
        vec![update(first, 0, "Fine"), update(other, 0, "Stale")],
    );
    assert!(
        matches!(&stale, Err(SceneError::Indexed { index: 1, cause }) if **cause == SceneError::SourceConflict),
        "{stale:?}"
    );
    assert_eq!(project_bytes(&f), before);
}

#[test]
fn story_save_reports_a_missing_insertion_place_as_a_beat_draft_conflict() {
    let (f, ws) = two_scenes();
    let (first, other) = (&ws.scenes[0], &ws.scenes[1]);
    let before = project_bytes(&f);
    let insert = |body: BodyRef, anchor: &str| SceneCommand::InsertBodyBeat {
        scene_id: first.id.clone(),
        expected_source_revision: first.source_revision.clone(),
        body,
        position: Position::Before {
            anchor: NodeRef::Beat {
                beat_id: anchor.into(),
            },
        },
        beat: narration("New beat"),
    };
    let missing_branch = BodyRef::Branch {
        group_id: "missing-group".into(),
        branch_id: "missing-branch".into(),
    };
    for place in [
        insert(BodyRef::Root, "missing-anchor"),
        insert(missing_branch, &first.beats[0].id),
    ] {
        let refused = save(
            &f,
            &ws,
            vec![
                update(first, 0, "Kept out"),
                place,
                update(other, 0, "Never built"),
            ],
        );
        assert!(
            matches!(&refused, Err(SceneError::Indexed { index: 1, cause }) if **cause == SceneError::BeatDraftConflict),
            "{refused:?}"
        );
        assert_eq!(project_bytes(&f), before);
    }
}
