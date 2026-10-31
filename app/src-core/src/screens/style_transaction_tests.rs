use super::*;

fn source(service: &mut LifecycleService, owner: &Value) -> String {
    ipc(service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned()
}

fn selected<'a>(result: &'a Value, owner: &Value, id: &str) -> &'a Value {
    result["document"]["screens"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == owner["name"])
        .unwrap()["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == id)
        .unwrap()
}

fn style_edit_keeps_owning_screen(scope: &str, kind: &str) {
    let (_temporary, mut service, root, owner) = composition_project();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"textbutton","text":"Selected"}),
    );
    let id = added["selectedId"].as_str().unwrap();
    let unowned = format!(
        "screen unowned():\n    textbutton \"Unowned\": # loomlight-element: {id}\n        text_size 17 # unowned property\n        background \"#111111\"\n\n"
    );
    let mut owned = source(&mut service, &owner)
        .replace("textbutton \"Selected\" #", "textbutton \"Selected\": #");
    owned.push_str("        text_size 30 # selected override\n        background \"#123456\" # selected decoration\n");
    if scope != "create" {
        owned.push_str("        style \"ll_old\"\n        text_style \"ll_old\"\n\nstyle ll_old is button:\n    size 22\n\n");
        owned.push_str(&format!("style ll_target is {kind}:\n    size 35\n"));
    }
    let before = format!("{unowned}{owned}");
    save_composition_source(&mut service, &owner, &before);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["owned"][0]["resolved"], true);
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":id,"values":{"size":40,"text":"Edited","appearance":{"background":"#abcdef"}},"style":{"scope":scope,"name":"ll_target","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let saved = source(&mut service, &owner);
    assert!(
        saved.starts_with(&unowned),
        "unowned source changed: {saved}"
    );
    let node = selected(&result, &owner, id);
    assert_eq!(result["selectedId"], id);
    assert_eq!(node["literal"], "Edited");
    assert_eq!(node["textProperties"]["values"]["size"], 40);
    assert_eq!(node["textProperties"]["values"]["background"], "#abcdef");
    assert!(node["style"]["error"].is_null(), "{node}");
    let name = node["style"]["name"].as_str().unwrap();
    let owned_use = saved
        .strip_prefix(&unowned)
        .unwrap()
        .split("\nstyle ")
        .next()
        .unwrap();
    assert!(owned_use.contains(&format!("text_style \"{name}\"")));
    if kind == "text" {
        assert!(!owned_use
            .lines()
            .any(|l| l.trim_start().starts_with("style ")));
    } else {
        assert!(owned_use.contains(&format!("        style \"{name}\"")));
    }
    assert!(result["document"]["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .all(|n| n["id"].is_null()));
    assert_eq!(
        selected(&result, &owner, owner["rootId"].as_str().unwrap())["id"],
        owner["rootId"]
    );
    composition_history(&mut service, "undo");
    assert_eq!(source(&mut service, &owner), before);
    composition_history(&mut service, "redo");
    assert_eq!(source(&mut service, &owner), saved);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(source(&mut service, &owner), saved);
}

#[test]
fn create_style_keeps_owning_screen_with_copied_element_marker() {
    style_edit_keeps_owning_screen("create", "button");
}

#[test]
fn shared_button_style_keeps_owning_screen_with_copied_element_marker() {
    style_edit_keeps_owning_screen("shared", "button");
}

#[test]
fn local_button_style_keeps_owning_screen_with_copied_element_marker() {
    style_edit_keeps_owning_screen("local", "button");
}

#[test]
fn shared_text_style_keeps_owning_screen_with_copied_element_marker() {
    style_edit_keeps_owning_screen("shared", "text");
}

#[test]
fn local_text_style_keeps_owning_screen_with_copied_element_marker() {
    style_edit_keeps_owning_screen("local", "text");
}

#[test]
fn composition_ignores_unrelated_uninspectable_screen_document() {
    let (_temporary, mut service, root, owner) = composition_project();
    let unrelated = "screen duplicate():\n    pass\n\nscreen duplicate():\n    pass\n";
    fs::write(root.join("game/ui/other.rpy"), unrelated).unwrap();
    let readable = "screen readable():\n    text \"Read only\"\n";
    fs::write(root.join("game/ui/readable.rpy"), readable).unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["owned"][0]["resolved"], true);
    let before = source(&mut service, &owner);
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"text","text":"Accepted"}),
    );
    let saved = source(&mut service, &owner);
    assert_eq!(
        selected(&result, &owner, result["selectedId"].as_str().unwrap())["literal"],
        "Accepted"
    );
    assert!(result["documents"]
        .as_array()
        .unwrap()
        .iter()
        .any(|d| d["path"] == owner["path"]));
    assert!(!result["documents"]
        .as_array()
        .unwrap()
        .iter()
        .any(|d| d["path"] == "game/ui/other.rpy"));
    let refreshed = result["documents"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["path"] == "game/ui/readable.rpy")
        .unwrap();
    assert_eq!(refreshed["screens"][0]["nodes"][1]["literal"], "Read only");
    assert!(refreshed["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .all(|n| n["id"].is_null()));
    composition_history(&mut service, "undo");
    assert_eq!(source(&mut service, &owner), before);
    composition_history(&mut service, "redo");
    assert_eq!(source(&mut service, &owner), saved);
    assert_eq!(
        fs::read_to_string(root.join("game/ui/other.rpy")).unwrap(),
        unrelated
    );
    assert_eq!(
        fs::read_to_string(root.join("game/ui/readable.rpy")).unwrap(),
        readable
    );

    // An unsupported selected owner still refuses before any transaction is accepted.
    let invalid = format!("{saved}\nscreen notes():\n    pass\n");
    save_composition_source(&mut service, &owner, &invalid);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["owned"][0]["resolved"], false);
    reject(
        &mut service,
        "screens.compose",
        json!({"screenId":owner["id"],"expectedRevision":hex::encode(Sha256::digest(invalid.as_bytes())),"command":{"type":"add","parentId":owner["rootId"],"kind":"text","text":"Refused"}}),
    );
    assert_eq!(source(&mut service, &owner), invalid);
}

fn copy_new_style(kind: &str, parent: &str, prefix: &str) {
    let (_temporary, mut service, root, owner) = composition_project();
    let added = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":kind,"text":"Selected"}),
    );
    let id = added["selectedId"].as_str().unwrap();
    let target = format!("style ll_target is {parent}:\n    size 35 # target size\n    hover_size 48 # target hover\n    color \"#ffffff\"\n");
    let mut before = source(&mut service, &owner).replace(
        &format!("{kind} \"Selected\" #"),
        &format!("{kind} \"Selected\": #"),
    );
    before.push_str("        style \"ll_old\"\n");
    if kind == "textbutton" {
        before.push_str("        text_style \"ll_old\"\n");
    }
    // These explicit overrides equal the old defaults, so value comparison
    // alone cannot distinguish them from inheritance.
    before.push_str(&format!("        {prefix}color \"#abcdef\" # selected color\n        {prefix}hover_bold True # selected hover\n\nstyle ll_old is {parent}:\n    size 22\n    color \"#abcdef\"\n    hover_bold True\n    hover_size 18\n    selected_italic True\n\n"));
    before.push_str(&target);
    save_composition_source(&mut service, &owner, &before);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let result = compose_command(
        &mut service,
        &owner,
        json!({"type":"formatText","nodeId":id,"values":{"size":40,"text":"Copied"},"style":{"scope":"local","name":"ll_target","expectedRevision":catalog["styles"]["revision"]}}),
    );
    let node = selected(&result, &owner, id);
    let values = &node["textProperties"]["values"];
    assert_eq!(
        values["hover_size"], 48,
        "old inherited hover size displaced target"
    );
    assert!(
        values["selected_italic"].is_null(),
        "old-only inherited property survived"
    );
    assert_eq!(values["color"], "#abcdef");
    assert_eq!(values["hover_bold"], true);
    assert_eq!(values["size"], 40);
    assert_eq!(node["literal"], "Copied");
    assert_eq!(result["selectedId"], id);
    let name = node["style"]["name"].as_str().unwrap();
    assert!(name.starts_with("ll_copy_"));
    let saved = source(&mut service, &owner);
    assert!(saved.contains(&target));
    assert!(saved.contains("# selected color"));
    assert!(saved.contains("# selected hover"));
    let copy = saved
        .split_once(&format!("style {name} is {parent}:"))
        .unwrap()
        .1;
    assert!(copy.contains("hover_size 48 # target hover"));
    assert!(copy.contains("color \"#abcdef\""));
    composition_history(&mut service, "undo");
    assert_eq!(source(&mut service, &owner), before);
    composition_history(&mut service, "redo");
    assert_eq!(source(&mut service, &owner), saved);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    assert_eq!(
        selected(&json!({"document":reopened}), &owner, id)["style"]["name"],
        name
    );
    assert_eq!(source(&mut service, &owner), saved);
}

#[test]
fn local_copy_of_new_text_style_uses_target_defaults_and_selected_source_overrides() {
    copy_new_style("text", "text", "");
}

#[test]
fn local_copy_of_new_button_style_uses_target_defaults_and_selected_source_overrides() {
    copy_new_style("textbutton", "button", "text_");
}
