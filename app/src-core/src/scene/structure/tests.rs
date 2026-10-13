//! Actual dispatch proof for complete structural authoring operations.
use super::tests::Fixture;
use serde_json::{json, Value};
use std::fs;

fn model(f: &mut Fixture) -> Value {
    f.model()["scenes"][0].clone()
}
fn command(f: &mut Fixture, fields: Value) -> Value {
    let scene = model(f);
    let mut fields = fields.as_object().unwrap().clone();
    fields.insert("sceneId".into(), scene["id"].clone());
    fields.insert(
        "expectedSourceRevision".into(),
        scene["sourceRevision"].clone(),
    );
    f.command(Value::Object(fields))
}
fn reject(f: &mut Fixture, fields: Value) -> Value {
    let scene = model(f);
    let mut fields = fields.as_object().unwrap().clone();
    fields.insert("sceneId".into(), scene["id"].clone());
    fields.insert(
        "expectedSourceRevision".into(),
        scene["sourceRevision"].clone(),
    );
    f.reject(Value::Object(fields))
}
fn condition(value: bool) -> Value {
    json!({"status":"supported","expression":{"type":"bool","value":value}})
}
fn branch_body(header: &Value) -> Value {
    json!({"type":"branch","groupId":header["conditionalBranch"]["groupId"],"branchId":header["id"]})
}
fn headers(scene: &Value, group: &Value) -> Vec<Value> {
    scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|b| b["conditionalBranch"]["groupId"] == *group)
        .cloned()
        .collect()
}
fn text(scene: &Value, value: &str) -> Value {
    scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["text"] == value)
        .unwrap()
        .clone()
}
fn root_group(scene: &Value) -> Value {
    scene["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| !b["conditionalBranch"].is_null() && b["owner"].is_null())
        .unwrap()
        .clone()
}
fn insert_condition(f: &mut Fixture, body: Value, position: Value, otherwise: bool) -> Value {
    command(
        f,
        json!({"type":"insertCondition","body":body,"position":position,"condition":condition(true),"otherwise":otherwise}),
    );
    model(f)
}
fn setup() -> Fixture {
    let mut f = Fixture::new();
    let a = model(&mut f);
    f.save(
        &a,
        &format!(
            "label {}:\n    return\n",
            a["technicalLabel"].as_str().unwrap()
        ),
    );
    f
}
fn bytes(f: &Fixture) -> Vec<u8> {
    let map: Value =
        serde_json::from_slice(&fs::read(f.root.join(".renpy-editor/source-map.json")).unwrap())
            .unwrap();
    fs::read(
        f.root
            .join(map["sceneMappings"][0]["path"].as_str().unwrap()),
    )
    .unwrap()
}
#[test]
fn phase3a_structure_condition_branch_edits_empty_pass_history_reopen() {
    let mut f = setup();
    let original = bytes(&f);
    let a = model(&mut f);
    let terminal = &a["beats"][0];
    let a = insert_condition(
        &mut f,
        json!({"type":"root"}),
        json!({"type":"before","anchor":{"type":"beat","beatId":terminal["id"]}}),
        true,
    );
    let group = root_group(&a);
    let id = group["conditionalBranch"]["groupId"].clone();
    let branches = headers(&a, &id);
    assert_eq!(branches.len(), 2);
    assert_eq!(
        a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["structuralPlaceholder"] == true)
            .count(),
        2
    );
    command(
        &mut f,
        json!({"type":"insertBodyBeat","body":branch_body(&branches[0]),"position":{"type":"end"},"beat":{"type":"narration","text":"If text 雪"}}),
    );
    let a = model(&mut f);
    let old = text(&a, "If text 雪");
    assert!(!String::from_utf8(bytes(&f))
        .unwrap()
        .contains("        pass\n    else"));
    command(
        &mut f,
        json!({"type":"addConditionBranch","groupId":id,"expectedBody":{"type":"root"},"beforeBranchId":branches[1]["id"],"condition":condition(false)}),
    );
    let a = model(&mut f);
    let branches = headers(&a, &id);
    assert_eq!(branches.len(), 3);
    assert_eq!(branches[2]["conditionalBranch"]["ordinal"], 2);
    command(
        &mut f,
        json!({"type":"updateConditionBranch","groupId":id,"branchId":branches[0]["id"],"expectedBody":{"type":"root"},"condition":condition(false)}),
    );
    let a = model(&mut f);
    assert_eq!(text(&a, "If text 雪")["id"], old["id"]);
    assert!(String::from_utf8(bytes(&f))
        .unwrap()
        .contains("    if False:\n"));
    command(
        &mut f,
        json!({"type":"removeConditionBranch","groupId":id,"branchId":branches[1]["id"],"expectedBody":{"type":"root"}}),
    );
    let a = model(&mut f);
    assert_eq!(headers(&a, &id).len(), 2);
    assert_eq!(headers(&a, &id)[1]["id"], branches[2]["id"]);
    let final_bytes = bytes(&f);
    for _ in 0..5 {
        command(&mut f, json!({"type":"undo"}));
    }
    assert_eq!(bytes(&f), original);
    for _ in 0..5 {
        command(&mut f, json!({"type":"redo"}));
    }
    assert_eq!(bytes(&f), final_bytes);
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(model(&mut f)["beats"], a["beats"]);
    f.service.close().unwrap();
}
#[test]
fn phase3a_structure_branch_kind_owner_unknown_and_initial_if_refusals() {
    let mut f = setup();
    let a = model(&mut f);
    let a = insert_condition(
        &mut f,
        json!({"type":"root"}),
        json!({"type":"before","anchor":{"type":"beat","beatId":a["beats"][0]["id"]}}),
        true,
    );
    let group = root_group(&a);
    let id = group["conditionalBranch"]["groupId"].clone();
    let branches = headers(&a, &id);
    for fields in [
        json!({"type":"removeConditionBranch","groupId":id,"branchId":branches[0]["id"],"expectedBody":{"type":"root"}}),
        json!({"type":"addConditionBranch","groupId":id,"expectedBody":{"type":"root"},"beforeBranchId":branches[0]["id"],"condition":condition(true)}),
        json!({"type":"addConditionBranch","groupId":id,"expectedBody":{"type":"root"},"beforeBranchId":null,"condition":null}),
        json!({"type":"addConditionBranch","groupId":id,"expectedBody":{"type":"root"},"beforeBranchId":null,"condition":condition(true)}),
        json!({"type":"updateConditionBranch","groupId":id,"branchId":branches[0]["id"],"expectedBody":branch_body(&branches[0]),"condition":condition(true)}),
    ] {
        assert_eq!(reject(&mut f, fields)["error"]["code"], "SCENE_INVARIANT");
    }
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"updateConditionBranch","groupId":id,"branchId":branches[1]["id"],"expectedBody":{"type":"root"},"condition":condition(true)})
        )["error"]["code"],
        "INVALID_PAYLOAD"
    );
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"updateConditionBranch","groupId":id,"branchId":branches[0]["id"],"expectedBody":{"type":"root"},"condition":{"status":"unknown","source":"python()","diagnostic":"unsupportedSyntax"}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"insertCondition","body":branch_body(&branches[0]),"position":{"type":"end"},"condition":{"status":"unknown","source":"python()","diagnostic":"unsupportedSyntax"},"otherwise":false})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    f.service.close().unwrap();
}
#[test]
fn phase3a_structure_leaf_moves_whole_subtrees_stable_ids_and_empty_bodies() {
    let mut f = setup();
    let a = model(&mut f);
    let a = insert_condition(
        &mut f,
        json!({"type":"root"}),
        json!({"type":"before","anchor":{"type":"beat","beatId":a["beats"][0]["id"]}}),
        true,
    );
    let group = root_group(&a);
    let gid = group["conditionalBranch"]["groupId"].clone();
    let outer = headers(&a, &gid);
    command(
        &mut f,
        json!({"type":"insertBodyBeat","body":branch_body(&outer[0]),"position":{"type":"end"},"beat":{"type":"narration","text":"Moved 雪"}}),
    );
    let a = model(&mut f);
    let leaf = text(&a, "Moved 雪");
    command(
        &mut f,
        json!({"type":"moveStoryNode","node":{"type":"beat","beatId":leaf["id"]},"expectedBody":branch_body(&outer[0]),"body":branch_body(&outer[1]),"position":{"type":"end"}}),
    );
    let a = model(&mut f);
    assert_eq!(text(&a, "Moved 雪")["id"], leaf["id"]);
    assert_eq!(text(&a, "Moved 雪")["owner"]["branchId"], outer[1]["id"]);
    assert!(a["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["owner"]["branchId"] == outer[0]["id"] && b["structuralPlaceholder"] == true));
    let a = insert_condition(&mut f, branch_body(&outer[0]), json!({"type":"end"}), true);
    let nested = a["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["owner"]["branchId"] == outer[0]["id"] && !b["conditionalBranch"].is_null())
        .unwrap()
        .clone();
    let nid = nested["conditionalBranch"]["groupId"].clone();
    let inner = headers(&a, &nid);
    command(
        &mut f,
        json!({"type":"moveStoryNode","node":{"type":"condition","groupId":nid},"expectedBody":branch_body(&outer[0]),"body":branch_body(&outer[1]),"position":{"type":"before","anchor":{"type":"beat","beatId":leaf["id"]}}}),
    );
    let a = model(&mut f);
    assert_eq!(headers(&a, &nid)[0]["id"], nested["id"]);
    assert_eq!(headers(&a, &nid)[0]["owner"]["branchId"], outer[1]["id"]);
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"moveStoryNode","node":{"type":"condition","groupId":gid},"expectedBody":{"type":"root"},"body":branch_body(&inner[0]),"position":{"type":"end"}})
        )["error"]["code"],
        "SCENE_INVARIANT"
    );
    let terminal = a["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["type"] == "return" && b["owner"].is_null())
        .unwrap();
    command(
        &mut f,
        json!({"type":"moveStoryNode","node":{"type":"condition","groupId":nid},"expectedBody":branch_body(&outer[1]),"body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":terminal["id"]}}}),
    );
    let a = model(&mut f);
    assert!(headers(&a, &nid)[0]["owner"].is_null());
    assert_eq!(headers(&a, &nid)[0]["id"], nested["id"]);
    command(
        &mut f,
        json!({"type":"removeStoryNode","node":{"type":"beat","beatId":leaf["id"]},"expectedBody":branch_body(&outer[1])}),
    );
    let a = model(&mut f);
    assert!(a["beats"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["owner"]["branchId"] == outer[1]["id"] && b["structuralPlaceholder"] == true));
    command(
        &mut f,
        json!({"type":"removeStoryNode","node":{"type":"condition","groupId":nid},"expectedBody":{"type":"root"}}),
    );
    let a = model(&mut f);
    assert!(headers(&a, &nid).is_empty());
    command(&mut f, json!({"type":"undo"}));
    assert_eq!(headers(&model(&mut f), &nid)[0]["id"], nested["id"]);
    f.service.close().unwrap();
}
#[test]
fn phase3a_structure_selected_unwrap_preserves_only_selected_body_and_trivia() {
    let mut f = setup();
    let a = model(&mut f);
    let source=format!("label {}:\r\n    if flag: # keep if header only until unwrap\r\n        \"IF\"\r\n    else:\r\n        # selected café 雪\r\n        \"ELSE\"\r\n    # parent retained\r\n    return\r\n",a["technicalLabel"].as_str().unwrap());
    f.save(&a, &source);
    let a = model(&mut f);
    let group = root_group(&a);
    let gid = group["conditionalBranch"]["groupId"].clone();
    let branches = headers(&a, &gid);
    let selected = text(&a, "ELSE");
    command(
        &mut f,
        json!({"type":"unwrapCondition","groupId":gid,"branchId":branches[1]["id"],"expectedBody":{"type":"root"}}),
    );
    let a = model(&mut f);
    assert_eq!(text(&a, "ELSE")["id"], selected["id"]);
    assert!(text(&a, "ELSE")["owner"].is_null());
    assert!(headers(&a, &gid).is_empty());
    assert_eq!(bytes(&f),[b"\xef\xbb\xbf".as_slice(),format!("label {}:\r\n    # selected café 雪\r\n    \"ELSE\"\r\n    # parent retained\r\n    return\r\n",a["technicalLabel"].as_str().unwrap()).as_bytes()].concat());
    command(&mut f, json!({"type":"undo"}));
    assert_eq!(
        bytes(&f),
        [b"\xef\xbb\xbf".as_slice(), source.as_bytes()].concat()
    );
    let restored = model(&mut f);
    f.save(&restored,&format!("label {}:\n    if flag:\n        # empty selected retained\n        pass\n    else:\n        \"discarded\"\n    return\n",a["technicalLabel"].as_str().unwrap()));
    let a = model(&mut f);
    let group = root_group(&a);
    let gid = group["conditionalBranch"]["groupId"].clone();
    command(
        &mut f,
        json!({"type":"unwrapCondition","groupId":gid,"branchId":group["id"],"expectedBody":{"type":"root"}}),
    );
    let source = String::from_utf8(bytes(&f)).unwrap();
    assert!(source.contains("    # empty selected retained\n"));
    assert!(!source.contains("discarded"));
    assert!(!source.contains("pass"));
    f.service.close().unwrap();
}
#[test]
fn phase3a_structure_minimal_condition_header_and_opaque_reindent_refusals() {
    let mut f = setup();
    let a = model(&mut f);
    let source=format!("label {}:\n    if   flag  : # café : kept\n        python:\n            value = \"not rewritten\"\n    else:\n        pass\n    return\n",a["technicalLabel"].as_str().unwrap());
    f.save(&a, &source);
    let a = model(&mut f);
    let group = root_group(&a);
    let gid = group["conditionalBranch"]["groupId"].clone();
    let branches = headers(&a, &gid);
    command(
        &mut f,
        json!({"type":"updateConditionBranch","groupId":gid,"branchId":branches[0]["id"],"expectedBody":{"type":"root"},"condition":condition(false)}),
    );
    assert_eq!(
        bytes(&f),
        [
            b"\xef\xbb\xbf".as_slice(),
            source.replace("if   flag  :", "if   False  :").as_bytes()
        ]
        .concat()
    );
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"unwrapCondition","groupId":gid,"branchId":branches[0]["id"],"expectedBody":{"type":"root"}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    let a = insert_condition(
        &mut f,
        branch_body(&branches[1]),
        json!({"type":"end"}),
        false,
    );
    let nested = a["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["owner"]["branchId"] == branches[1]["id"] && !b["conditionalBranch"].is_null())
        .unwrap()
        .clone();
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"moveStoryNode","node":{"type":"condition","groupId":gid},"expectedBody":{"type":"root"},"body":branch_body(&nested),"position":{"type":"end"}})
        )["error"]["code"],
        "SCENE_INVARIANT"
    );
    // Explicit whole-group deletion is one selected subtree, including its opaque body.
    command(
        &mut f,
        json!({"type":"removeStoryNode","node":{"type":"condition","groupId":gid},"expectedBody":{"type":"root"}}),
    );
    assert_eq!(model(&mut f)["beats"].as_array().unwrap().len(), 1);
    f.service.close().unwrap();
}

#[test]
fn phase3a_structure_nonlast_selected_trivia_and_unqualified_promotion() {
    let mut f = setup();
    let a = model(&mut f);
    let source=format!("label {}:\r\n    if flag:\r\n        \"IF\"\r\n        # selected trailing café 雪\r\n        \r\n    else:\r\n        \"ELSE\"\r\n    # parent retained\r\n    return\r\n",a["technicalLabel"].as_str().unwrap());
    f.save(&a, &source);
    let a = model(&mut f);
    let group = root_group(&a);
    let gid = group["conditionalBranch"]["groupId"].clone();
    let leaf = text(&a, "IF");
    command(
        &mut f,
        json!({"type":"unwrapCondition","groupId":gid,"branchId":group["id"],"expectedBody":{"type":"root"}}),
    );
    let after = model(&mut f);
    assert_eq!(text(&after, "IF")["id"], leaf["id"]);
    assert!(text(&after, "IF")["owner"].is_null());
    assert_eq!(bytes(&f),[b"\xef\xbb\xbf".as_slice(),format!("label {}:\r\n    \"IF\"\r\n    # selected trailing café 雪\r\n        \r\n    # parent retained\r\n    return\r\n",a["technicalLabel"].as_str().unwrap()).as_bytes()].concat());
    command(&mut f, json!({"type":"undo"}));
    assert_eq!(
        bytes(&f),
        [b"\xef\xbb\xbf".as_slice(), source.as_bytes()].concat()
    );
    let restored = model(&mut f);
    assert_eq!(text(&restored, "IF")["id"], leaf["id"]);
    let inline=format!("label {}:\n    if flag:\n        \"Inline\" # retained inline café\n    else:\n        \"Other\"\n    return\n",a["technicalLabel"].as_str().unwrap());
    f.save(&restored, &inline);
    let a = model(&mut f);
    let group = root_group(&a);
    let id = group["conditionalBranch"]["groupId"].clone();
    let before = a["beats"].clone();
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"unwrapCondition","groupId":id,"branchId":group["id"],"expectedBody":{"type":"root"}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    assert_eq!(model(&mut f)["beats"], before);
    let ambiguous = inline.replace(
        "        \"Inline\" # retained inline café\n",
        "        \"Inline\"\n    # ambiguous parent trivia\n",
    );
    f.save(&a, &ambiguous);
    let a = model(&mut f);
    let group = root_group(&a);
    let id = group["conditionalBranch"]["groupId"].clone();
    assert_eq!(
        reject(
            &mut f,
            json!({"type":"unwrapCondition","groupId":id,"branchId":group["id"],"expectedBody":{"type":"root"}})
        )["error"]["code"],
        "OPAQUE_BOUNDARY"
    );
    f.service.close().unwrap();
}
