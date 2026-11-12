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
    apply_wire(
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
    f.undo().unwrap();
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        "label scene_one:\n    $ score = 5\n    return\n"
    );
    let redone = f.redo().unwrap();
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
        let history = f.history();
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
        apply_wire(&f, &model, command(wire.clone())).unwrap();
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
        assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), before_map);
        assert_eq!(f.history(), history);
        let mut changed = wire;
        changed["value"]["operand"] = json!("3");
        let after = apply_wire(&f, &model, command(changed)).unwrap();
        assert_eq!(after.scenes[0].beats[0].id, beat.id);
        assert_eq!(
            fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
            source.replacen(if statement.contains("-2") { "-2" } else { "+2" }, "3", 1)
        );
        f.undo().unwrap();
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
    let history = f.history();
    let scene = &model.scenes[0];
    let before_source = fs::read(f.root.join(&scene.source_path)).unwrap();
    let before_map = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
    let command = |id: &str, value: Value| {
        json!({"type":"insertBeat", "sceneId":scene.id,
        "expectedSourceRevision":scene.source_revision,"beforeBeatId":null,
        "beat":{"type":"setVariable","variableId":id,"value":value}})
    };
    for (operand, error) in [
        ("9223372036854775808", SceneError::ArithmeticOverflow),
        ("1.0", SceneError::ArithmeticTargetType),
        ("01", SceneError::InvalidArithmeticSyntax),
    ] {
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
            error
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
    assert_eq!(f.history(), history);
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
    // The variable is the latest entry; the refusals below add none.
    let history = f.history();
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
    assert_eq!(f.history(), history);
}

#[test]
fn arithmetic_unsupported_source_remains_protected() {
    for statement in [
        "$ score **= 2",
        "$ score /= 2",
        "$ score = other + 1",
        "$ missing += 1",
        "$ score += 1.5",
        "$ score += 01",
        "$ score += 9223372036854775808",
        "$ score +=",
        "$ score += compute()",
        "$ score = score ** 2",
        "$ score = score.real",
        "$ score = score[0]",
        "$ score = 01",
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

#[test]
fn formula_commands_use_precedence_grouping_and_exact_variable_reads() {
    let f = integer_fixture(b"label scene_one:\n    $ score = 9007199254740993\n    return\n");
    let model = f.workspace();
    let scene = &model.scenes[0];
    let id = &model.authoring.variables[0].id;
    let after = apply_wire(
        &f,
        &model,
        json!({"type":"insertBeat","sceneId":scene.id,
        "expectedSourceRevision":scene.source_revision,"beforeBeatId":scene.beats[1].id,
        "beat":{"type":"setVariable","variableId":id,
        "value":{"operation":"assign","operand":"score + (2 + 3) * 4"}}}),
    )
    .unwrap();
    let beat = &after.scenes[0].beats[1];
    let inspected = serde_json::to_value(beat).unwrap();
    assert_eq!(
        inspected["assignment"]["state"],
        json!({"status":"known","value":"9007199254741013"})
    );
    assert_eq!(inspected["assignment"]["reads"], json!([id]));
    assert_eq!(inspected["assignment"]["writes"], json!([id]));
    assert_eq!(inspected["assignment"]["inferredResultType"], "int");
    assert!(fs::read_to_string(f.root.join(&scene.source_path))
        .unwrap()
        .contains("$ score = score + (2 + 3) * 4"));
}

#[test]
fn formula_negative_floor_remainder_and_i64_boundaries_match_python() {
    let f = integer_fixture(b"label scene_one:\n    $ score = -7 // 3\n    $ score = -7 % 3\n    $ score = 7 // -3\n    $ score = 7 % -3\n    $ score = -9223372036854775808\n    $ score %= -1\n    $ score = -(2 + 3) * +4 - 1\n    return\n");
    let model = serde_json::to_value(f.workspace()).unwrap();
    for (index, expected) in ["-3", "2", "-3", "-2", "-9223372036854775808", "0", "-21"]
        .iter()
        .enumerate()
    {
        assert_eq!(
            model["scenes"][0]["beats"][index]["assignment"]["state"],
            json!({"status":"known","value":expected}),
            "beat {index}"
        );
    }
}

#[test]
fn formula_diagnostics_are_explicit_for_protected_source_and_refused_commands() {
    let f = integer_fixture(b"label scene_one:\n    $ score = 1 +\n    $ score = missing + 1\n    $ score = 1 // 0\n    $ score = 9223372036854775807 * 2\n    $ score = score + 1\n    return\n");
    let model = f.workspace();
    let history = f.history();
    let wire = serde_json::to_value(&model).unwrap();
    for (index, reason) in [
        "invalidSyntax",
        "missingVariable",
        "zeroDivisor",
        "integerOverflow",
        "integerOverflow",
    ]
    .iter()
    .enumerate()
    {
        assert_eq!(
            wire["scenes"][0]["beats"][index]["assignment"]["state"],
            json!({"status":"unknown","reason":reason}),
            "beat {index}"
        );
    }
    let scene = &model.scenes[0];
    let source = fs::read(f.root.join(&scene.source_path)).unwrap();
    for (operand, error) in [
        ("1 +", SceneError::InvalidArithmeticSyntax),
        ("missing + 1", SceneError::MissingArithmeticVariable),
        ("2 // 0", SceneError::ArithmeticZeroDivisor),
        ("9223372036854775807 * 2", SceneError::ArithmeticOverflow),
        (
            "score + (9223372036854775807 * 2)",
            SceneError::ArithmeticOverflow,
        ),
    ] {
        assert_eq!(apply_wire(&f, &model, json!({"type":"insertBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beforeBeatId":null,"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,"value":{"operation":"assign","operand":operand}}})).unwrap_err(), error);
    }
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), source);
    assert_eq!(f.history(), history);
}

#[test]
fn formulas_preserve_nested_bodies_noops_maps_history_and_reopen() {
    for statement in [
        "$ score  *=  (score + 2) # café",
        "$ score = (score + 2) * 3 # café",
        "$ score //= 2 # café",
    ] {
        let source = format!("label scene_one:\r\n    if True:\r\n        {statement}\r\n        python:\r\n            opaque = 42\r\n    return\r\n");
        let f = integer_fixture(source.as_bytes());
        let model = f.workspace();
        let scene = &model.scenes[0];
        let beat = scene
            .beats
            .iter()
            .find(|b| b.payload.kind() == "setVariable")
            .unwrap();
        let before_map = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
        let body = json!({"type":"branch","groupId":beat.owner.as_ref().unwrap().group_id,"branchId":beat.owner.as_ref().unwrap().branch_id});
        let command = |payload: Value| json!({"type":"updateBodyBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":beat.id,"expectedBody":body,"beat":payload});
        apply_wire(
            &f,
            &model,
            command(serde_json::to_value(&beat.payload).unwrap()),
        )
        .unwrap();
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
        assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), before_map);
        let mut payload = serde_json::to_value(&beat.payload).unwrap();
        payload["value"]["operand"] = json!("score + 4");
        let after = apply_wire(&f, &model, command(payload)).unwrap();
        let accepted = fs::read(f.root.join(&scene.source_path)).unwrap();
        let expected = source.replace(
            if statement.contains("*= ") {
                "(score + 2)"
            } else if statement.contains("//= ") {
                "2 #"
            } else {
                "(score + 2) * 3"
            },
            if statement.contains("//= ") {
                "score + 4 #"
            } else {
                "score + 4"
            },
        );
        assert_eq!(String::from_utf8(accepted.clone()).unwrap(), expected);
        assert_eq!(
            after.scenes[0]
                .beats
                .iter()
                .find(|b| b.id == beat.id)
                .unwrap()
                .payload
                .kind(),
            "setVariable"
        );
        f.undo().unwrap();
        assert_eq!(
            fs::read(f.root.join(&scene.source_path)).unwrap(),
            source.as_bytes()
        );
        f.redo().unwrap();
        let service = AuthoringService::default();
        let project = service.register_project(&f.root).unwrap();
        let reopened = service.scene_workspace(&project, &f.project_id).unwrap();
        assert!(reopened.scenes[0]
            .beats
            .iter()
            .any(|b| b.id == beat.id && !b.protected));
        assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), accepted);
        let mut legacy: Value = serde_json::from_slice(&before_map).unwrap();
        // The old recognizer protected the same range. Opening may refine kind, never ID/bytes.
        fn old_kind(value: &mut Value, id: &str) {
            match value {
                Value::Object(map) => {
                    if map.get("id").and_then(Value::as_str) == Some(id) && map.contains_key("kind")
                    {
                        map.insert("kind".into(), json!("customCode"));
                    }
                    for v in map.values_mut() {
                        old_kind(v, id);
                    }
                }
                Value::Array(items) => {
                    for v in items {
                        old_kind(v, id);
                    }
                }
                _ => {}
            }
        }
        f.undo().unwrap();
        old_kind(&mut legacy, &beat.id);
        fs::write(
            f.root.join(SOURCE_MAP_PATH),
            serde_json::to_vec_pretty(&legacy).unwrap(),
        )
        .unwrap();
        f.migrate();
        assert!(f.workspace().scenes[0]
            .beats
            .iter()
            .any(|b| b.id == beat.id && !b.protected));
    }
}

#[test]
fn formula_edits_preserve_explicit_style_and_semantic_noop_bytes() {
    let source = b"label scene_one:\n    $ score = score + +2 # keep\n    return\n";
    let f = integer_fixture(source);
    let model = f.workspace();
    let history = f.history();
    let scene = &model.scenes[0];
    let beat = &scene.beats[0];
    let edit = |operation: &str, operand: &str| json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":beat.id,"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,"value":{"operation":operation,"operand":operand}}});
    apply_wire(&f, &model, edit("add", "( +2 )")).unwrap();
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), source);
    assert_eq!(f.history(), history);
    apply_wire(&f, &model, edit("multiply", "score + 3")).unwrap();
    assert_eq!(
        fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
        "label scene_one:\n    $ score = score * (score + 3) # keep\n    return\n"
    );
    let f = integer_fixture(
        b"label scene_one:\n    $ score = 10\n    $ score = score - 2 # keep\n    return\n",
    );
    let model = f.workspace();
    let scene = &model.scenes[0];
    let after = apply_wire(&f, &model, json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":scene.beats[1].id,"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,"value":{"operation":"subtract","operand":"score + 3"}}})).unwrap();
    assert_eq!(
        serde_json::to_value(&after).unwrap()["scenes"][0]["beats"][1]["assignment"]["state"],
        json!({"status":"known","value":"-3"})
    );
    assert!(fs::read_to_string(f.root.join(&scene.source_path))
        .unwrap()
        .contains("$ score = score - (score + 3) # keep"));
}

#[test]
fn formula_dependencies_types_unknowns_and_stale_edits_use_declared_variables() {
    let f = integer_fixture(
        b"label scene_one:\n    $ score = 2\n    $ score = bonus * 3\n    return\n",
    );
    for (name, kind, default_value) in [
        ("bonus", VariableType::Int, json!("99")),
        ("flag", VariableType::Bool, json!(true)),
    ] {
        f.service
            .create_variable(
                &f.project,
                &f.project_id,
                CreateVariableRequest {
                    technical_name: name.into(),
                    variable_type: kind,
                    default_value,
                },
            )
            .unwrap();
    }
    f.migrate();
    let model = f.workspace();
    let scene = &model.scenes[0];
    let wire = serde_json::to_value(&model).unwrap();
    let score = model
        .authoring
        .variables
        .iter()
        .find(|v| v.technical_name == "score")
        .unwrap();
    let bonus = model
        .authoring
        .variables
        .iter()
        .find(|v| v.technical_name == "bonus")
        .unwrap();
    assert_eq!(
        wire["scenes"][0]["beats"][1]["assignment"]["state"],
        json!({"status":"unknown","reason":"unobservedCurrentValue"})
    );
    assert_eq!(
        wire["scenes"][0]["beats"][1]["assignment"]["readVariables"],
        json!([{"variableId":bonus.id,"technicalName":"bonus","variableType":"int"}])
    );
    let command = |operand: &str| json!({"type":"insertBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beforeBeatId":scene.beats[1].id,"beat":{"type":"setVariable","variableId":score.id,"value":{"operation":"assign","operand":operand}}});
    assert_eq!(
        apply_wire(&f, &model, command("flag + 1")).unwrap_err(),
        SceneError::ArithmeticOperandType
    );
    let after = apply_wire(&f, &model, command("bonus + score * 2")).unwrap();
    let result = serde_json::to_value(&after).unwrap();
    assert_eq!(
        result["scenes"][0]["beats"][1]["assignment"]["reads"],
        json!([bonus.id, score.id])
    );
    assert_eq!(
        apply_wire(&f, &model, command("1")).unwrap_err(),
        SceneError::SourceConflict
    );
    let declaration = bonus.source.path.clone();
    let opened = f
        .service
        .source_open(
            &f.project,
            &f.project_id,
            serde_json::from_value(json!({"path":declaration})).unwrap(),
        )
        .unwrap();
    f.service.source_update_draft(&f.project, &f.project_id, serde_json::from_value(json!({"path":declaration,"expectedBaseRevision":opened.base_revision,"text":format!("{}# retained\n", opened.text.as_deref().unwrap()),"selectionStart":0,"selectionEnd":0})).unwrap()).unwrap();
    let fresh = f.workspace();
    let mut dirty_command = command("bonus + 2");
    dirty_command["expectedSourceRevision"] = json!(fresh.scenes[0].source_revision);
    assert_eq!(
        apply_wire(&f, &fresh, dirty_command).unwrap_err(),
        SceneError::DirtySource
    );
    f.service
        .source_discard(
            &f.project,
            &f.project_id,
            serde_json::from_value(json!({"path":declaration})).unwrap(),
        )
        .unwrap();
    let refreshed = f.workspace();
    let mut request = command("bonus + 2");
    request["expectedSourceRevision"] = json!(refreshed.scenes[0].source_revision);
    fs::write(
        f.root.join(&scene.source_path),
        b"label scene_one:\n    $ score = 4\n    return\n",
    )
    .unwrap();
    assert_eq!(
        apply_wire(&f, &refreshed, request).unwrap_err(),
        SceneError::SourceConflict
    );
}

#[test]
fn formula_replaces_only_literal_expression_bytes() {
    let f = integer_fixture(b"label scene_one:\n    $ score  =  +2 # kept\n    return\n");
    let model = f.workspace();
    let history = f.history();
    let scene = &model.scenes[0];
    let command = |operand: &str| json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":scene.beats[0].id,"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,"value":{"operation":"assign","operand":operand}}});
    apply_wire(&f, &model, command("(2)")).unwrap();
    assert_eq!(f.history(), history);
    assert_eq!(
        fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
        "label scene_one:\n    $ score  =  +2 # kept\n    return\n"
    );
    apply_wire(&f, &model, command("3 + 4")).unwrap();
    assert_eq!(
        fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
        "label scene_one:\n    $ score  =  3 + 4 # kept\n    return\n"
    );
}

#[test]
fn formula_recognition_keeps_bool_and_string_assignment_edits() {
    let f = Fixture::new(
        b"label scene_one:\n    $ caption = \"score\"\n    $ flag = False\n    return\n",
    );
    for (name, kind, default_value) in [
        ("score", VariableType::Int, json!("99")),
        ("caption", VariableType::String, json!("")),
        ("flag", VariableType::Bool, json!(false)),
    ] {
        f.service
            .create_variable(
                &f.project,
                &f.project_id,
                CreateVariableRequest {
                    technical_name: name.into(),
                    variable_type: kind,
                    default_value,
                },
            )
            .unwrap();
    }
    f.migrate();
    for (index, name, value) in [(0, "caption", json!("(score)")), (1, "flag", json!(true))] {
        let model = f.workspace();
        let scene = &model.scenes[0];
        let variable = model
            .authoring
            .variables
            .iter()
            .find(|v| v.technical_name == name)
            .unwrap();
        apply_wire(&f, &model, json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":scene.beats[index].id,"beat":{"type":"setVariable","variableId":variable.id,"value":value}})).unwrap();
    }
    let source = fs::read_to_string(f.root.join(&f.workspace().scenes[0].source_path)).unwrap();
    assert!(source.contains("$ caption = \"(score)\""));
    assert!(source.contains("$ flag = True"));
}

#[test]
fn decimal_defaults_are_typed_public_values_and_survive_reopen() {
    let f = Fixture::new(b"label scene_one:\n    return\n");
    let request = serde_json::from_value(
        json!({"technicalName":"fraction","variableType":"decimal","defaultValue":1.25}),
    )
    .unwrap();
    f.service
        .create_variable(&f.project, &f.project_id, request)
        .unwrap();
    let model = f.service.list(&f.project, &f.project_id).unwrap();
    assert_eq!(
        serde_json::to_value(&model.variables[0]).unwrap()["defaultValue"],
        json!(1.25)
    );
    assert!(
        fs::read_to_string(f.root.join(&model.variables[0].source.path))
            .unwrap()
            .contains("default fraction = 1.25")
    );
    let service = AuthoringService::default();
    let project = service.register_project(&f.root).unwrap();
    assert_eq!(
        serde_json::to_value(service.list(&project, &f.project_id).unwrap().variables).unwrap(),
        serde_json::to_value(model.variables).unwrap()
    );
}

#[test]
fn decimal_formulas_use_python_types_rounding_and_diagnostics() {
    let f = integer_fixture(b"label scene_one:\n    return\n");
    f.service
        .create_variable(
            &f.project,
            &f.project_id,
            serde_json::from_value(
                json!({"technicalName":"fraction","variableType":"decimal","defaultValue":99.5}),
            )
            .unwrap(),
        )
        .unwrap();
    let mut model = f.workspace();
    let id = model
        .authoring
        .variables
        .iter()
        .find(|v| v.technical_name == "fraction")
        .unwrap()
        .id
        .clone();
    for (operand, expected, kind) in [
        ("1 / 2", 0.5, "decimal"),
        ("4 / 2", 2.0, "decimal"),
        ("9007199254740993 / 3", 3002399751580331.0, "decimal"),
        ("1.0 // 0.1", 9.0, "decimal"),
        ("-1.0 % 0.1", 5.551115123125783e-17, "decimal"),
        ("7 // -3", -3.0, "decimal"),
        ("(2 + 3) * -0.5 + 1", -1.5, "decimal"),
    ] {
        let scene = &model.scenes[0];
        model = apply_wire(&f, &model, json!({"type":"insertBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beforeBeatId":scene.beats.last().unwrap().id,"beat":{"type":"setVariable","variableId":id,"value":{"operation":"assign","operand":operand}}})).unwrap();
        let beat = &model.scenes[0].beats[model.scenes[0].beats.len() - 2];
        let wire = serde_json::to_value(beat).unwrap();
        assert_eq!(
            wire["assignment"]["state"],
            json!({"status":"known","value":expected}),
            "{operand}"
        );
        assert_eq!(wire["assignment"]["inferredResultType"], kind);
    }
    let scene = &model.scenes[0];
    let before = fs::read(f.root.join(&scene.source_path)).unwrap();
    for (target, operand, error) in [
        (
            &model.authoring.variables[0].id,
            "4 / 2",
            SceneError::ArithmeticTargetType,
        ),
        (&id, "1.0 / 0", SceneError::ArithmeticZeroDivisor),
        (&id, "1e308 * 2.0", SceneError::ArithmeticOverflow),
    ] {
        assert_eq!(apply_wire(&f, &model, json!({"type":"insertBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beforeBeatId":null,"beat":{"type":"setVariable","variableId":target,"value":{"operation":"assign","operand":operand}}})).unwrap_err(), error);
    }
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), before);
}

#[test]
fn decimal_conditions_compare_large_integers_without_rounding_them() {
    let f = integer_fixture(
        b"label scene_one:\n    if score > 9007199254740992.0:\n        \"yes\"\n    return\n",
    );
    let model = f.workspace();
    let condition = model.scenes[0]
        .beats
        .iter()
        .find_map(|b| {
            b.conditional_branch
                .as_ref()
                .and_then(|b| b.condition.as_ref())
        })
        .unwrap();
    assert!(matches!(
        condition,
        crate::conditions::Condition::Supported { .. }
    ));
    let id = &model.authoring.variables[0].id;
    for (integer, expected) in [
        ("9007199254740993", true),
        ("9007199254740992", false),
        ("-9223372036854775808", false),
    ] {
        assert_eq!(
            serde_json::to_value(crate::conditions::evaluate(
                condition,
                &HashMap::from([(id.clone(), json!(integer))])
            ))
            .unwrap(),
            json!({"status":"known","value":expected})
        );
    }
    for (source, integer, expected) in [
        ("score == 9007199254740992.0", "9007199254740993", false),
        ("score != 9007199254740992.0", "9007199254740993", true),
        ("score < 9223372036854775808.0", "9223372036854775807", true),
        (
            "score >= -9223372036854775808.0",
            "-9223372036854775808",
            true,
        ),
        ("score <= -1.5", "-1", false),
        ("score > -5e-324", "0", true),
    ] {
        let condition = crate::conditions::parse(source, &model.authoring);
        assert_eq!(
            serde_json::to_value(crate::conditions::evaluate(
                &condition,
                &HashMap::from([(id.clone(), json!(integer))])
            ))
            .unwrap(),
            json!({"status":"known","value":expected}),
            "{source}"
        );
    }
    for value in [json!(true), json!(9007199254740992.0), json!("01")] {
        assert!(matches!(
            crate::conditions::evaluate(condition, &HashMap::from([(id.clone(), value)])),
            crate::conditions::ConditionResult::Unknown { .. }
        ));
    }
}

#[test]
fn decimal_result_for_integer_source_has_an_explicit_target_diagnostic() {
    let f = integer_fixture(b"label scene_one:\n    $ score = 4 / 2\n    return\n");
    let model = serde_json::to_value(f.workspace()).unwrap();
    assert_eq!(model["scenes"][0]["beats"][0]["protected"], true);
    assert_eq!(
        model["scenes"][0]["beats"][0]["assignment"]["inferredResultType"],
        "decimal"
    );
    assert_eq!(
        model["scenes"][0]["beats"][0]["assignment"]["diagnostics"][0]["reason"],
        "incompatibleTarget"
    );
}

#[test]
fn decimal_source_edits_preserve_trivia_ids_history_unknowns_and_reopen() {
    let f = Fixture::new(b"label scene_one:\r\n    $ fraction /= 2 # keep\r\n    $ fraction = 5.0\r\n    $ fraction  -=  1.25 # cafe\r\n    return\r\n");
    let model = f
        .service
        .create_variable(
            &f.project,
            &f.project_id,
            serde_json::from_value(
                json!({"technicalName":"fraction","variableType":"decimal","defaultValue":99.0}),
            )
            .unwrap(),
        )
        .unwrap();
    let var = &model.variables[0];
    for value in [json!("2.5"), json!(true), json!(null)] {
        assert!(f.service.update_variable(&f.project, &f.project_id, serde_json::from_value(json!({"id":var.id,"expectedSourceRevision":var.source.source_revision,"defaultValue":value})).unwrap()).is_err());
    }
    f.service.update_variable(&f.project, &f.project_id, serde_json::from_value(json!({"id":var.id,"expectedSourceRevision":var.source.source_revision,"defaultValue":2.5})).unwrap()).unwrap();
    f.migrate();
    let model = f.workspace();
    let history = f.history();
    let scene = &model.scenes[0];
    let bytes = fs::read(f.root.join(&scene.source_path)).unwrap();
    let wire = serde_json::to_value(&scene.beats[0]).unwrap();
    assert_eq!(
        wire["assignment"]["state"],
        json!({"status":"unknown","reason":"unobservedCurrentValue"})
    );
    let beat = &scene.beats[2];
    let command = |value: Value| json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":beat.id,"beat":{"type":"setVariable","variableId":var.id,"value":value}});
    apply_wire(
        &f,
        &model,
        command(json!({"operation":"subtract","operand":"+1.25"})),
    )
    .unwrap();
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), bytes);
    assert_eq!(f.history(), history);
    let edited = apply_wire(
        &f,
        &model,
        command(json!({"operation":"divide","operand":"2.0"})),
    )
    .unwrap();
    assert_eq!(
        fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
        String::from_utf8(bytes.clone())
            .unwrap()
            .replace("-=  1.25", "/=  2.0")
    );
    assert_eq!(
        serde_json::to_value(&edited.scenes[0].beats[2]).unwrap()["assignment"]["state"],
        json!({"status":"known","value":2.5})
    );
    f.undo().unwrap();
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), bytes);
    f.redo().unwrap();
    let service = AuthoringService::default();
    let project = service.register_project(&f.root).unwrap();
    let reopened = service.scene_workspace(&project, &f.project_id).unwrap();
    assert_eq!(reopened.scenes[0].beats[2].id, beat.id);
    assert_eq!(reopened.authoring.variables[0].default_value, json!(2.5));
}

#[test]
fn decimal_target_import_preserves_an_existing_integer_assignment_exactly() {
    let source =
        b"label scene_one:\n    $ fraction = 9007199254740993 # imported integer\n    return\n";
    let f = Fixture::new(source);
    f.service
        .create_variable(
            &f.project,
            &f.project_id,
            serde_json::from_value(
                json!({"technicalName":"fraction","variableType":"decimal","defaultValue":1.25}),
            )
            .unwrap(),
        )
        .unwrap();
    f.migrate();
    let model = f.workspace();
    let history = f.history();
    let scene = &model.scenes[0];
    let beat = &scene.beats[0];
    let wire = serde_json::to_value(beat).unwrap();
    assert_eq!(wire["assignment"]["inferredResultType"], "int");
    assert_eq!(wire["assignment"]["state"]["value"], "9007199254740993");
    apply_wire(&f, &model, json!({"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":beat.id,"beat":beat.payload})).unwrap();
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), source);
    assert_eq!(f.history(), history);
}

#[test]
fn literal_formula_noops_preserve_types_signs_and_exact_integers() {
    for (kind, literal, operand, unchanged) in [
        (
            VariableType::Int,
            "+9007199254740993",
            "9007199254740993",
            true,
        ),
        (
            VariableType::Int,
            "-9223372036854775808",
            "-9223372036854775808",
            true,
        ),
        (VariableType::Decimal, "-1.0", "-1", true),
        (
            VariableType::Decimal,
            "9007199254740992.0",
            "9007199254740993",
            false,
        ),
        (VariableType::Decimal, "-0.0", "0.0", false),
    ] {
        let source = format!("label scene_one:\n    $ score = {literal}\n    return\n");
        let f = Fixture::new(source.as_bytes());
        f.service
            .create_variable(
                &f.project,
                &f.project_id,
                CreateVariableRequest {
                    technical_name: "score".into(),
                    variable_type: kind,
                    default_value: if kind == VariableType::Int {
                        json!("0")
                    } else {
                        json!(0.0)
                    },
                },
            )
            .unwrap();
        f.migrate();
        let model = f.workspace();
        let history = f.history();
        let scene = &model.scenes[0];
        apply_wire(&f, &model, json!({"type":"updateBodyBeat","sceneId":scene.id,
            "expectedSourceRevision":scene.source_revision,"beatId":scene.beats[0].id,
            "expectedBody":{"type":"root"},"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,
            "value":{"operation":"assign","operand":operand}}})).unwrap();
        assert_eq!(
            fs::read_to_string(f.root.join(&scene.source_path)).unwrap() == source,
            unchanged,
            "{literal} -> {operand}"
        );
        assert_eq!(
            f.history().undo.is_some(),
            history.undo.is_some() || !unchanged
        );
        if !unchanged {
            f.undo().unwrap();
            assert_eq!(
                fs::read_to_string(f.root.join(&scene.source_path)).unwrap(),
                source
            );
        }
    }
}

#[test]
fn decimal_literal_commands_and_formula_results_keep_negative_zero() {
    let f = Fixture::new(
        b"label scene_one:\n    $ fraction = 1.0\n    $ fraction = fraction * 1.0\n    return\n",
    );
    f.service
        .create_variable(
            &f.project,
            &f.project_id,
            serde_json::from_value(
                json!({"technicalName":"fraction","variableType":"decimal","defaultValue":"-0.0"}),
            )
            .unwrap(),
        )
        .unwrap();
    f.migrate();
    let model = f.workspace();
    let scene = &model.scenes[0];
    let command = json!({"type":"updateBodyBeat","sceneId":scene.id,
        "expectedSourceRevision":scene.source_revision,"beatId":scene.beats[0].id,
        "expectedBody":{"type":"root"},"beat":{"type":"setVariable","variableId":model.authoring.variables[0].id,"value":"-0.0"}});
    let after = apply_wire(&f, &model, command).unwrap();
    let wire = serde_json::to_value(&after).unwrap();
    assert_eq!(wire["scenes"][0]["beats"][0]["payload"]["value"], "-0.0");
    for beat in &wire["scenes"][0]["beats"].as_array().unwrap()[..2] {
        assert_eq!(
            beat["assignment"]["state"],
            json!({"status":"known","value":"-0.0"})
        );
    }
    let accepted = fs::read(f.root.join(&scene.source_path)).unwrap();
    assert!(String::from_utf8_lossy(&accepted).contains("$ fraction = -0.0"));
    f.undo().unwrap();
    f.redo().unwrap();
    assert_eq!(fs::read(f.root.join(&scene.source_path)).unwrap(), accepted);
}
