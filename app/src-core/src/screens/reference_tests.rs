use super::*;

#[test]
fn resolved_screen_targets_bind_identity_and_reject_stale_or_renamed_source() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let binding = json!({"screenId":owner["id"], "sourceName":"notes"});
    let before = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(before["binding"], binding);
    assert_eq!(before["kind"], "panel");
    assert_eq!(before["effects"]["unknown"], false);
    assert_eq!(before["effects"]["hiddenScreens"], json!([]));

    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &owner,
        &source.replace("    pass", "    text \"Changed\""),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({
                "binding":binding, "expected":before["revisions"]
            })
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
    let fresh = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_ne!(
        fresh["revisions"]["effects"],
        before["revisions"]["effects"]
    );

    save_composition_source(
        &mut service,
        &owner,
        &source.replace("screen notes():", "screen renamed():"),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.resolveTarget",
            json!({"binding":binding})
        )["error"]["code"],
        "INCOMING_REFERENCE"
    );
}

#[test]
fn dynamic_text_and_custom_actions_keep_screen_effects_unknown() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let source = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    save_composition_source(
        &mut service,
        &owner,
        &source.replace("    pass", "    text \"[creator_function()]\""),
    );
    let target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({
            "binding":{"screenId":owner["id"],"sourceName":"notes"}
        }),
    );
    assert_eq!(target["effects"]["unknown"], true);
}
