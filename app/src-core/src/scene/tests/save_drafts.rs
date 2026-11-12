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
    save_drafts(f, ws, commands, Vec::new())
}

fn save_drafts(
    f: &Fixture,
    ws: &SceneWorkspace,
    commands: Vec<SceneCommand>,
    drafts: Vec<String>,
) -> Result<SceneWorkspace, SceneError> {
    f.service.scene_save_drafts(
        &f.project,
        &f.project_id,
        SceneSaveDraftsRequest {
            drafts,
            expected_project_revision: ws.project_revision.clone(),
            expected_source_map_revision: ws.source_map_revision.clone(),
            expected_authoring_revision: None,
            commands,
        },
    )
}

/// Records one draft step for `draft`, as the renderer does for each step.
fn step(f: &Fixture, draft: &str, step: &str) -> crate::history::HistoryState {
    f.service
        .history_draft_step(
            &f.project,
            crate::history::DraftStepRequest {
                step_id: step.into(),
                draft: draft.into(),
                name: format!("typing {step}"),
                item: HistoryItem::Story {
                    scene_id: None,
                    beat_id: None,
                },
            },
        )
        .unwrap()
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
fn story_save_adds_one_entry_per_beat_with_the_last_edited_on_top() {
    let (f, ws) = two_scenes();
    let (first, other) = (&ws.scenes[0], &ws.scenes[1]);
    let before = project_bytes(&f);
    // Draft steps for the three saved drafts, and one for a draft Save leaves alone.
    for (draft, id) in [("a", "a1"), ("kept", "k1"), ("b", "b1"), ("c", "c1")] {
        step(&f, draft, id);
    }
    let insert = SceneCommand::InsertBodyBeat {
        scene_id: first.id.clone(),
        expected_source_revision: first.source_revision.clone(),
        body: BodyRef::Root,
        position: Position::Before {
            anchor: NodeRef::Beat {
                beat_id: first.beats[1].id.clone(),
            },
        },
        beat: narration("Inserted draft"),
    };
    // Draft "same" saves its beat's accepted text: it changes no bytes and adds no entry.
    let saved = save_drafts(
        &f,
        &ws,
        vec![
            update(first, 0, "First draft"),
            insert,
            update(other, 0, "Other draft"),
            update(first, 1, "Second"),
        ],
        vec!["a".into(), "b".into(), "c".into(), "same".into()],
    )
    .unwrap();
    let first_saved = b"label scene_one:\n    \"First draft\"\n    \"Inserted draft\"\n    \"Second\"\n    return\n";
    assert_eq!(
        fs::read(f.root.join(&first.source_path)).unwrap(),
        first_saved
    );
    let other_source =
        String::from_utf8(fs::read(f.root.join(&other.source_path)).unwrap()).unwrap();
    assert!(other_source.contains("\"Other draft\"") && !other_source.contains("\"Other\"\n"));
    // Beat ids survive, and the saved workspace maps the new beat.
    let accepted = &saved.scenes[0];
    assert_eq!(accepted.beats[0].id, first.beats[0].id);
    assert_eq!(accepted.beats[2].id, first.beats[1].id);
    assert_eq!(accepted.beats[1].payload, narration("Inserted draft"));
    let after = project_bytes(&f);

    // The beat sent last is on top. Two entries share the first scene's file, and
    // each Undo reverses only its own beat.
    let undo = |name: &str| {
        assert_eq!(f.history().undo.unwrap().name, name);
        f.undo().unwrap();
    };
    undo("narration edit in Scene 2");
    assert_eq!(
        fs::read(f.root.join(&first.source_path)).unwrap(),
        first_saved
    );
    assert_eq!(
        fs::read(f.root.join(&other.source_path)).unwrap(),
        before[&other.source_path]
    );
    undo("new narration in Scene 1");
    assert_eq!(
        fs::read(f.root.join(&first.source_path)).unwrap(),
        b"label scene_one:\n    \"First draft\"\n    \"Second\"\n    return\n"
    );
    undo("narration edit in Scene 1");
    assert_eq!(
        project_bytes(&f),
        before,
        "three Undos revert the Story Save"
    );

    // The saved drafts' steps left the history. The other draft's step stays in
    // its place, and its Undo writes nothing.
    let step = f.service.history_undo(&f.project).unwrap();
    assert_eq!(
        step.step.map(|step| (step.draft, step.step_id)),
        Some(("kept".into(), "k1".into()))
    );
    assert_eq!(project_bytes(&f), before);
    assert_eq!(f.history().undo.unwrap().name, "new narration in Scene 2");

    for _ in 0..4 {
        f.redo().unwrap();
    }
    assert_eq!(project_bytes(&f), after, "Redo restores every saved beat");
    assert_eq!(f.history().redo, None);
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

#[test]
fn commit_joins_its_draft_steps_into_one_entry_on_top() {
    let f = Fixture::new(b"label scene_one:\n    \"First\"\n    \"Second\"\n    return\n");
    f.migrate();
    let ws = f.workspace();
    let scene = &ws.scenes[0];
    let before = project_bytes(&f);
    // A draft step needs a step id, a draft and a name.
    let blank = crate::history::DraftStepRequest {
        step_id: "s".into(),
        draft: " ".into(),
        name: "typing".into(),
        item: HistoryItem::source("game/script.rpy"),
    };
    assert_eq!(
        f.service.history_draft_step(&f.project, blank),
        Err(SceneError::InvalidPayload)
    );
    step(&f, "a", "a1");
    step(&f, "b", "b1");
    assert_eq!(step(&f, "a", "a2").undo.unwrap().name, "typing a2");
    let commit = |ws: &SceneWorkspace, command: SceneCommand, drafts: Vec<String>| {
        f.service.scene_apply(
            &f.project,
            &f.project_id,
            SceneCommandRequest {
                expected_project_revision: ws.project_revision.clone(),
                expected_source_map_revision: ws.source_map_revision.clone(),
                expected_authoring_revision: None,
                command,
                drafts,
            },
        )
    };
    commit(&ws, update(scene, 0, "Committed"), vec!["a".into()]).unwrap();
    assert_ne!(project_bytes(&f), before);
    // One Undo reverses the whole beat. Beat A's steps are gone; B's stays below.
    assert_eq!(f.history().undo.unwrap().name, "narration edit in Scene 1");
    f.undo().unwrap();
    assert_eq!(project_bytes(&f), before);
    let step_b = f.service.history_undo(&f.project).unwrap();
    assert_eq!(step_b.step.unwrap().draft, "b");
    assert_eq!(
        project_bytes(&f),
        before,
        "Undo of a draft step writes nothing"
    );
    assert_eq!(f.history().undo, None);

    // Redo of a draft step writes nothing either; a new step then drops Redo.
    let redone = f.service.history_redo(&f.project).unwrap();
    assert_eq!(redone.step.unwrap().step_id, "b1");
    assert_eq!(project_bytes(&f), before);
    assert_eq!(step(&f, "b", "b2").redo, None);
    assert_eq!(project_bytes(&f), before);

    // A Commit that changes nothing still ends its draft's steps.
    let ws = f.workspace();
    commit(&ws, update(&ws.scenes[0], 0, "First"), vec!["b".into()]).unwrap();
    assert_eq!(project_bytes(&f), before);
    assert_eq!(f.history(), crate::history::HistoryState::default());
}
