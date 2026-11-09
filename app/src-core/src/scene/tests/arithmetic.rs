use super::*;
use serde_json::json;

fn integer_fixture(source: &[u8]) -> Fixture {
    let f = Fixture::new(source);
    f.service
        .create_variable(
            &f.project,
            &f.project_id,
            CreateVariableRequest {
                technical_name: "score".into(),
                variable_type: VariableType::Int,
                default_value: json!("99"),
            },
        )
        .unwrap();
    f.migrate();
    f
}

fn apply_wire(
    f: &Fixture,
    model: &SceneWorkspace,
    command: Value,
) -> Result<SceneWorkspace, SceneError> {
    f.service.scene_apply(
        &f.project,
        &f.project_id,
        serde_json::from_value(json!({
            "expectedProjectRevision":model.project_revision,
            "expectedSourceMapRevision":model.source_map_revision,
            "expectedAuthoringRevision":serde_json::to_value(model).unwrap()["authoringRevision"],
            "command":command
        }))
        .unwrap(),
    )
}

#[test]
fn arithmetic_insert_update_history_and_reopen() {
    let f = integer_fixture(b"label scene_one:\n    $ score = 5\n    return\n");
    let model = f.workspace();
    let scene = &model.scenes[0];
    let added = apply_wire(
        &f,
        &model,
        json!({"type":"insertBodyBeat", "sceneId":scene.id,
            "expectedSourceRevision":scene.source_revision, "body":{"type":"root"},
            "position":{"type":"before","anchor":{"type":"beat","beatId":scene.beats[1].id}},
            "beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,
                "value":{"operation":"add","operand":"2"}}
        }),
    )
    .unwrap();
    let path = f.root.join(&scene.source_path);
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        "label scene_one:\n    $ score = 5\n    $ score += 2\n    return\n"
    );
    let undone = f.apply(&added, SceneCommand::Undo).unwrap();
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        "label scene_one:\n    $ score = 5\n    return\n"
    );
    let redone = f.apply(&undone, SceneCommand::Redo).unwrap();
    let reopened = AuthoringService::default();
    let project = reopened.register_project(&f.root).unwrap();
    let model = reopened.scene_workspace(&project, &f.project_id).unwrap();
    assert_eq!(model.scenes[0].beats[1].id, redone.scenes[0].beats[1].id);
    assert_eq!(
        serde_json::to_value(&model.scenes[0].beats[1].payload).unwrap()["value"],
        json!({"operation":"add","operand":"2"})
    );
}

#[test]
fn arithmetic_source_styles_preserve_noop_comments_legacy_ids_and_minimal_edits() {
    for statement in [
        "$ score  +=  +2 # keep café",
        "$ score = score + +2 # keep café",
        "$ score -= -2 # keep café",
        "$ score = score - -2 # keep café",
    ] {
        let source = format!("label scene_one:\r\n    {statement}\r\n    python:\r\n        opaque = 42\r\n    return\r\n");
        let f = integer_fixture(source.as_bytes());
        let model = f.workspace();
        let scene = &model.scenes[0];
        let beat = &scene.beats[0];
        assert_eq!(beat.payload.kind(), "setVariable", "{statement}");
        assert!(!beat.protected);
        let command = |payload: Value| {
            json!({"type":"updateBodyBeat","sceneId":scene.id,
            "expectedSourceRevision":scene.source_revision,"beatId":beat.id,
            "expectedBody":{"type":"root"},"beat":payload})
        };
        let wire = serde_json::to_value(&beat.payload).unwrap();
        let before_map = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
        let unchanged = apply_wire(&f, &model, command(wire.clone())).unwrap();
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
        assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), before_map);
        assert_eq!(unchanged.can_undo, model.can_undo);
        let mut changed = wire;
        changed["value"]["operand"] = json!("3");
        let after = apply_wire(&f, &model, command(changed)).unwrap();
        assert_eq!(after.scenes[0].beats[0].id, beat.id);
        assert_eq!(
            fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
            source.replacen(if statement.contains("-2") { "-2" } else { "+2" }, "3", 1)
        );
        f.apply(&after, SceneCommand::Undo).unwrap();
        // A map produced by the preceding recognizer recorded this exact range as Custom Code.
        let mut legacy: Value = serde_json::from_slice(&before_map).unwrap();
        legacy["sceneMappings"][0]["beats"][0]["kind"] = json!("customCode");
        fs::write(
            f.root.join(SOURCE_MAP_PATH),
            serde_json::to_vec_pretty(&legacy).unwrap(),
        )
        .unwrap();
        let legacy_bytes = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
        f.migrate();
        let reopened = f.workspace();
        assert_eq!(reopened.scenes[0].beats[0].id, beat.id);
        assert!(!reopened.scenes[0].beats[0].protected);
        assert_eq!(
            fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(),
            legacy_bytes
        );
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
        legacy["schemaVersion"] = json!(7);
        fs::write(
            f.root.join(SOURCE_MAP_PATH),
            serde_json::to_vec_pretty(&legacy).unwrap(),
        )
        .unwrap();
        f.migrate();
        assert_eq!(f.workspace().scenes[0].beats[0].id, beat.id);
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
    }
}

#[test]
fn arithmetic_inspection_has_lossless_results_and_never_uses_defaults() {
    let f = integer_fixture(b"label scene_one:\n    $ score += 1\n    $ score = 9007199254740993\n    $ score -= 2\n    $ score = 9223372036854775807\n    $ score += 1\n    python:\n        score = 0\n    $ score += 1\n    return\n");
    let model = serde_json::to_value(f.workspace()).unwrap();
    let beats = model["scenes"][0]["beats"].as_array().unwrap();
    assert_eq!(
        beats[0]["assignment"]["state"],
        json!({"status":"unknown","reason":"unobservedCurrentValue"})
    );
    assert_eq!(beats[2]["assignment"]["inferredResultType"], "int");
    assert_eq!(
        beats[2]["assignment"]["state"],
        json!({"status":"known","value":"9007199254740991"})
    );
    assert_eq!(
        beats[4]["assignment"]["state"],
        json!({"status":"unknown","reason":"integerOverflow"})
    );
    assert_eq!(
        beats[7]["assignment"]["state"],
        json!({"status":"unknown","reason":"unsupportedControlFlow"})
    );
}

#[test]
fn arithmetic_refuses_invalid_targets_operands_and_stale_definitions_without_history() {
    let f = integer_fixture(b"label scene_one:\n    return\n");
    let model = f.workspace();
    let scene = &model.scenes[0];
    let before_source = fs::read(f.root.join(&scene.source_path)).unwrap();
    let before_map = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
    let command = |id: &str, value: Value| {
        json!({"type":"insertBeat", "sceneId":scene.id,
        "expectedSourceRevision":scene.source_revision,"beforeBeatId":null,
        "beat":{"type":"setVariable","variableId":id,"value":value}})
    };
    for operand in ["1 + 2", "9223372036854775808", "1.0", "01", "-0"] {
        assert_eq!(
            apply_wire(
                &f,
                &model,
                command(
                    &model.authoring.variables[0].id,
                    json!({"operation":"add","operand":operand})
                )
            )
            .unwrap_err(),
            SceneError::InvalidArithmeticOperand
        );
    }
    assert_eq!(
        apply_wire(
            &f,
            &model,
            command("missing", json!({"operation":"add","operand":"1"}))
        )
        .unwrap_err(),
        SceneError::MissingArithmeticTarget
    );
    f.service
        .create_variable(
            &f.project,
            &f.project_id,
            CreateVariableRequest {
                technical_name: "flag".into(),
                variable_type: VariableType::Bool,
                default_value: json!(false),
            },
        )
        .unwrap();
    assert_eq!(
        apply_wire(
            &f,
            &model,
            command(
                &model.authoring.variables[0].id,
                json!({"operation":"add","operand":"1"})
            )
        )
        .unwrap_err(),
        SceneError::SourceConflict
    );
    let fresh = f.workspace();
    assert_eq!(
        apply_wire(
            &f,
            &fresh,
            command(
                &fresh.authoring.variables[1].id,
                json!({"operation":"subtract","operand":"1"})
            )
        )
        .unwrap_err(),
        SceneError::ArithmeticTargetType
    );
    assert_eq!(
        fs::read(f.root.join(&scene.source_path)).unwrap(),
        before_source
    );
    assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), before_map);
    assert_eq!(f.workspace().can_undo, model.can_undo);
}

#[test]
fn arithmetic_unsupported_source_remains_protected() {
    for statement in [
        "$ score *= 2",
        "$ score += score",
        "$ score = other + 1",
        "$ missing += 1",
        "$ score += 1.5",
        "$ score += 01",
        "$ score += 9223372036854775808",
        "$ score +=",
        "$ score += compute()",
    ] {
        let source = format!("label scene_one:\n    {statement}\n    return\n");
        let f = integer_fixture(source.as_bytes());
        let model = f.workspace();
        assert!(model.scenes[0].beats[0].protected, "{statement}");
        assert_eq!(model.scenes[0].beats[0].payload.kind(), "customCode");
        assert_eq!(
            fs::read(f.root.join(&model.scenes[0].source_path)).unwrap(),
            source.as_bytes()
        );
    }
}
