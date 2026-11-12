//! Bodies, body endings and insertion places through the actual dispatch.
use super::tests::Fixture;
use serde_json::{json, Value};

fn scene(f: &mut Fixture) -> Value {
    f.model()["scenes"][0].clone()
}
fn save(f: &mut Fixture, body: &str) -> Value {
    let a = scene(f);
    f.save(
        &a,
        &format!("label {}:\n{body}", a["technicalLabel"].as_str().unwrap()),
    );
    scene(f)
}
fn with_scene(scene: &Value, fields: Value) -> Value {
    let mut fields = fields.as_object().unwrap().clone();
    fields.insert("sceneId".into(), scene["id"].clone());
    fields.insert(
        "expectedSourceRevision".into(),
        scene["sourceRevision"].clone(),
    );
    Value::Object(fields)
}
fn beats(scene: &Value) -> &Vec<Value> {
    scene["beats"].as_array().unwrap()
}
fn bodies(scene: &Value) -> &Vec<Value> {
    scene["bodies"].as_array().unwrap()
}
fn beat<'a>(scene: &'a Value, text: &str) -> &'a Value {
    beats(scene)
        .iter()
        .find(|b| {
            b["payload"]["text"] == text
                || b["payload"]["source"]
                    .as_str()
                    .is_some_and(|s| s.trim() == text)
        })
        .unwrap_or_else(|| panic!("no beat {text}"))
}
/// The body that holds the beat with this text or Custom Code line.
fn holding<'a>(scene: &'a Value, text: &str) -> &'a Value {
    let id = &beat(scene, text)["id"];
    bodies(scene)
        .iter()
        .find(|b| {
            b["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|n| n["beatId"] == *id)
        })
        .unwrap()
}
fn scene_body(scene: &Value) -> &Value {
    &bodies(scene)[0]
}
fn positions(body: &Value) -> Vec<Value> {
    body["places"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| p["position"].clone())
        .collect()
}
fn before(beat: &Value) -> Value {
    if beat["conditionalBranch"].is_null() {
        json!({"type":"before","anchor":{"type":"beat","beatId":beat["id"]}})
    } else {
        json!({"type":"before","anchor":{"type":"condition","groupId":beat["conditionalBranch"]["groupId"]}})
    }
}
fn insert(scene: &Value, body: &Value, position: &Value, payload: Value) -> Value {
    with_scene(
        scene,
        json!({"type":"insertBodyBeat","body":body,"position":position,"beat":payload}),
    )
}
fn narration() -> Value {
    json!({"type":"narration","text":"Inserted"})
}

#[test]
fn deleting_the_otherwise_return_after_custom_code_refuses_a_new_fallthrough() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        "    if flag:\n        $ seen = True\n        return\n    else:\n        return\n",
    );
    let otherwise = beats(&a)
        .iter()
        .find(|b| b["conditionalBranch"]["otherwise"] == true)
        .unwrap()
        .clone();
    let ending = beats(&a)
        .iter()
        .find(|b| b["payload"]["type"] == "return" && b["owner"]["branchId"] == otherwise["id"])
        .unwrap()
        .clone();
    // The scene body ends at the condition, and the story never passes it.
    let header = beats(&a)
        .iter()
        .find(|b| b["conditionalBranch"]["ordinal"] == 0)
        .unwrap();
    assert_eq!(
        scene_body(&a)["ending"],
        json!({"type":"ends","beatId":header["id"]})
    );
    assert_eq!(positions(scene_body(&a)), vec![before(header)]);
    let refused = f.reject(with_scene(
        &a,
        json!({"type":"removeStoryNode","node":{"type":"beat","beatId":ending["id"]},
            "expectedBody":{"type":"branch","groupId":otherwise["conditionalBranch"]["groupId"],"branchId":otherwise["id"]}}),
    ));
    assert_eq!(refused["error"]["code"], "SCENE_INVARIANT");
    f.service.close().unwrap();
}

#[test]
fn every_listed_insertion_place_is_accepted_and_no_other() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        concat!(
            "    \"Opening\"\n",
            "    if flag:\n",
            "        \"If one\"\n",
            "        menu:\n",
            "            \"Same\":\n",
            "                \"Option one\"\n",
            "            \"Same\":\n",
            "                pass\n",
            "    else:\n",
            "        pass\n",
            "    menu:\n",
            "        \"Go\":\n",
            "            $ seen = True\n",
            "            return\n",
            "        \"Stay\":\n",
            "            \"Stay body\"\n",
            "    return\n",
        ),
    );
    let kinds = bodies(&a)
        .iter()
        .map(|b| b["kind"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        kinds,
        ["scene", "branch", "option", "option", "branch", "option", "option"]
    );
    let empty = bodies(&a)
        .iter()
        .filter(|b| b["nodes"].as_array().unwrap().is_empty())
        .count();
    assert_eq!(empty, 2, "the empty option and the empty Otherwise");
    let places = bodies(&a)
        .iter()
        .enumerate()
        .flat_map(|(i, b)| (0..b["places"].as_array().unwrap().len()).map(move |j| (i, j)))
        .collect::<Vec<_>>();
    assert!(places.len() >= 12);
    for (i, j) in places {
        let current = scene(&mut f);
        let body = &bodies(&current)[i];
        let place = &body["places"][j];
        let payload = if place["fitsEnding"] == true {
            json!({"type":"return"})
        } else {
            narration()
        };
        f.command(insert(&current, &body["body"], &place["position"], payload));
        f.command(json!({"type":"undo"}));
    }
    // Before the Custom Code in "Go" is not listed, and core refuses it.
    let a = scene(&mut f);
    let go = holding(&a, "$ seen = True");
    assert!(!positions(go).contains(&before(beat(&a, "$ seen = True"))));
    let refused = f.reject(insert(
        &a,
        &go["body"],
        &before(beat(&a, "$ seen = True")),
        narration(),
    ));
    assert_eq!(refused["error"]["code"], "OPAQUE_BOUNDARY");
    f.service.close().unwrap();
}

#[test]
fn custom_code_before_return_does_not_hide_the_ending() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        "    if flag:\n        \"Hello\"\n        $ seen = True\n        return\n    return\n",
    );
    let body = holding(&a, "Hello");
    let ending = beat(&a, "Hello");
    let ret = beats(&a)
        .iter()
        .find(|b| b["payload"]["type"] == "return" && !b["owner"].is_null())
        .unwrap();
    assert_eq!(body["kind"], "branch");
    assert_eq!(body["ending"], json!({"type":"ends","beatId":ret["id"]}));
    // No place before protected Custom Code, none after the ending.
    assert_eq!(positions(body), vec![before(ending), before(ret)]);
    assert_eq!(body["defaultPlace"], before(ret));
    f.service.close().unwrap();
}

#[test]
fn custom_code_jump_or_return_ends_its_body_and_refuses_a_later_insert() {
    for code in ["jump ending_good", "return \"good\""] {
        let mut f = Fixture::new();
        let a = save(
            &mut f,
            &format!("    if flag:\n        \"Hello\"\n        {code}\n    return\n"),
        );
        let body = holding(&a, "Hello").clone();
        let ending = beat(&a, code);
        assert_eq!(ending["payload"]["type"], "customCode");
        assert_eq!(body["ending"], json!({"type":"ends","beatId":ending["id"]}));
        assert_eq!(positions(&body), vec![before(beat(&a, "Hello"))]);
        assert_eq!(body["defaultPlace"], before(beat(&a, "Hello")));
        let refused = f.reject(insert(
            &a,
            &body["body"],
            &json!({"type":"end"}),
            narration(),
        ));
        assert_eq!(refused["error"]["code"], "SCENE_INVARIANT");
        f.service.close().unwrap();
    }
}

#[test]
fn final_other_custom_code_leaves_the_ending_unknown() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        "    menu:\n        \"Go\":\n            \"Hello\"\n            $ renpy.jump(\"x\")\n    return\n",
    );
    let body = holding(&a, "Hello");
    assert_eq!(body["kind"], "option");
    assert_eq!(body["ending"], json!({"type":"unknown"}));
    // An explicit ending can still go after the Custom Code.
    let places = body["places"].as_array().unwrap();
    assert_eq!(
        places.last().unwrap(),
        &json!({"position":{"type":"end"},"fitsEnding":true})
    );
    assert_eq!(body["defaultPlace"], json!({"type":"end"}));
    // Unknown is "may continue": the Choice does not end the scene body.
    assert_eq!(scene_body(&a)["ending"]["type"], "ends");
    assert_eq!(
        scene_body(&a)["ending"]["beatId"],
        beats(&a)
            .iter()
            .find(|b| b["payload"]["type"] == "return" && b["owner"].is_null())
            .unwrap()["id"]
    );
    f.service.close().unwrap();
}

#[test]
fn an_empty_body_has_one_place_that_replaces_its_pass() {
    let mut f = Fixture::new();
    let a = save(&mut f, "    if flag:\n        pass\n    \"After\"\n");
    let header = beats(&a)
        .iter()
        .find(|b| !b["conditionalBranch"].is_null())
        .unwrap();
    let body = bodies(&a)
        .iter()
        .find(|b| b["body"]["branchId"] == header["id"])
        .unwrap()
        .clone();
    assert_eq!(body["nodes"], json!([]));
    assert_eq!(body["ending"], json!({"type":"continues"}));
    assert_eq!(
        body["places"],
        json!([{"position":{"type":"end"},"fitsEnding":true}])
    );
    assert_eq!(body["defaultPlace"], json!({"type":"end"}));
    f.command(insert(
        &a,
        &body["body"],
        &json!({"type":"end"}),
        narration(),
    ));
    let path = f.root.join(a["sourcePath"].as_str().unwrap());
    assert!(std::fs::read_to_string(path)
        .unwrap()
        .ends_with("    if flag:\n        \"Inserted\"\n    \"After\"\n"));
    f.service.close().unwrap();
}

#[test]
fn protected_custom_code_is_one_node_with_no_place_before_it() {
    let mut f = Fixture::new();
    let a = save(&mut f, "    \"Hello\"\n    $ seen = True\n    \"After\"\n");
    let code = beat(&a, "$ seen = True");
    assert_eq!(code["protected"], true);
    let body = scene_body(&a);
    assert!(body["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|n| n["beatId"] == code["id"] && n.get("bodies").is_none()));
    assert_eq!(
        positions(body),
        vec![
            before(beat(&a, "Hello")),
            before(beat(&a, "After")),
            json!({"type":"end"})
        ]
    );
    f.service.close().unwrap();
}

#[test]
fn a_later_top_level_statement_closes_the_scene_body() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        "    \"Known\"\ninit python:\n    \"Opaque Python\"\n",
    );
    let body = scene_body(&a);
    assert_eq!(bodies(&a).len(), 1);
    let ids = body["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["beatId"].clone())
        .collect::<Vec<_>>();
    assert_eq!(ids, vec![beat(&a, "Known")["id"].clone()]);
    assert_eq!(positions(body), vec![before(beat(&a, "Known"))]);
    let refused = f.reject(insert(
        &a,
        &body["body"],
        &json!({"type":"end"}),
        narration(),
    ));
    assert_eq!(refused["error"]["code"], "OPAQUE_BOUNDARY");
    f.service.close().unwrap();
}

#[test]
fn nested_bodies_follow_source_order_and_options_keep_their_ids() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        concat!(
            "    if flag:\n",
            "        menu:\n",
            "            \"Same\":\n",
            "                \"First\"\n",
            "            \"Same\":\n",
            "                \"Second\"\n",
            "    elif not flag:\n",
            "        \"Middle\"\n",
            "    else:\n",
            "        \"Last\"\n",
            "    return\n",
        ),
    );
    let headers = beats(&a)
        .iter()
        .filter(|b| {
            !b["conditionalBranch"].is_null() && b["conditionalBranch"]["choiceOption"].is_null()
        })
        .collect::<Vec<_>>();
    let menu = beats(&a)
        .iter()
        .find(|b| b["payload"]["type"] == "choice")
        .unwrap();
    let options = menu["payload"]["options"].as_array().unwrap();
    let order = bodies(&a)
        .iter()
        .map(|b| {
            (
                b["kind"].clone(),
                b["number"].clone(),
                b["body"]["branchId"].clone(),
            )
        })
        .collect::<Vec<_>>();
    assert_eq!(
        order,
        vec![
            (json!("scene"), Value::Null, Value::Null),
            (json!("branch"), json!(1), headers[0]["id"].clone()),
            (json!("option"), json!(1), options[0]["id"].clone()),
            (json!("option"), json!(2), options[1]["id"].clone()),
            (json!("branch"), json!(2), headers[1]["id"].clone()),
            (json!("branch"), json!(3), headers[2]["id"].clone()),
        ]
    );
    // A condition lists its branch bodies; a Choice lists one body per option.
    let condition = &scene_body(&a)["nodes"][0];
    assert_eq!(condition["beatId"], headers[0]["id"]);
    assert_eq!(condition["bodies"].as_array().unwrap().len(), 3);
    let first = holding(&a, "First");
    let second = holding(&a, "Second");
    assert_ne!(first["body"], second["body"]);
    assert_eq!(first["owningNode"], menu["id"]);
    assert_eq!(first["parent"]["branchId"], headers[0]["id"]);
    assert_eq!(bodies(&a)[1]["owningNode"], headers[0]["id"]);
    assert_eq!(
        bodies(&a)[1]["nodes"][0]["bodies"],
        json!([first["body"], second["body"]])
    );
    f.service.close().unwrap();
}

#[test]
fn branches_draw_no_continuation_out_of_a_condition_ended_by_custom_code() {
    let mut f = Fixture::new();
    let a = save(
        &mut f,
        "    if flag:\n        return \"good\"\n    else:\n        return\n",
    );
    let flow = crate::lifecycle::acceptance::ipc(&mut f.service, "flow.list", json!({}));
    let edges = &flow["edges"];
    let kinds = edges
        .as_array()
        .unwrap()
        .iter()
        .filter(|e| e["sceneId"] == a["id"])
        .map(|e| e["kind"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(kinds.iter().filter(|k| **k == "guard").count(), 2);
    assert!(!kinds.contains(&"continuation"), "{kinds:?}");
    f.service.close().unwrap();
}
