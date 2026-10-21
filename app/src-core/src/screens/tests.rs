use super::*;
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;

const FIXTURE: &str = include_str!("../../../../tests/fixtures/phase-3b-screens/help.rpy");
const PATH: &str = "game/ui/help.rpy";

fn frame(document: &Value) -> &Value {
    document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "frame")
        .unwrap()
}

fn request(document: &Value, value: u32) -> Value {
    json!({"path":PATH,"expectedRevision":document["revision"],"screenName":"loomlight_help",
        "nodeStart":frame(document)["span"]["start"],"property":"xsize","value":value})
}

fn reject(service: &mut LifecycleService, operation: &str, mut payload: Value) -> Value {
    payload["sessionId"] = json!(service.current().unwrap().session_id);
    let result = serde_json::to_value(crate::handle_application_request(
        json!({
            "protocolVersion":1,"requestId":"screen-proof","operation":operation,"payload":payload
        }),
        false,
        service,
    ))
    .unwrap();
    assert_eq!(result["ok"], false, "{result}");
    result
}

#[test]
fn screen_source_dispatch_roundtrip_history_conflict_and_reopen() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = format!("\u{feff}{}", FIXTURE.replace('\n', "\r\n")).into_bytes();
    fs::write(root.join(PATH), &before).unwrap();
    service.open_path(&root).unwrap();
    let document = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    assert_eq!(
        fs::read(root.join(PATH)).unwrap(),
        before,
        "inspection cannot write or evaluate source"
    );
    assert_eq!(document["partial"], true);
    assert_eq!(document["screens"][0]["nodes"].as_array().unwrap().len(), 6);
    let expected_start = before.windows(3).position(|b| b == b"640").unwrap();
    let mutation = request(&document, 720);
    let changed = ipc(&mut service, "screens.setPixelProperty", mutation.clone());
    let after = fs::read(root.join(PATH)).unwrap();
    assert_eq!(
        after,
        [
            &before[..expected_start],
            b"720",
            &before[expected_start + 3..]
        ]
        .concat()
    );
    assert_eq!(frame(&changed)["properties"][0]["value"], 720);
    let noop = ipc(
        &mut service,
        "screens.setPixelProperty",
        request(&changed, 720),
    );
    assert_eq!(noop["revision"], changed["revision"]);
    let stale = reject(&mut service, "screens.setPixelProperty", mutation);
    assert_eq!(stale["error"]["code"], "SOURCE_CONFLICT");
    // Existing shared history undoes the screen edit; the no-op added no entry.
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"undo"}}),
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), before);
    let model = ipc(&mut service, "scene.list", json!({}));
    ipc(
        &mut service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"redo"}}),
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), after);
    let opened = ipc(&mut service, "source.open", json!({"path":PATH}));
    let draft = ipc(
        &mut service,
        "source.updateDraft",
        json!({"path":PATH,
        "expectedBaseRevision":opened["baseRevision"],"text":format!("{}# unsaved",opened["text"].as_str().unwrap()),
        "selectionStart":0,"selectionEnd":0}),
    );
    assert_eq!(
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&changed, 800)
        )["error"]["code"],
        "DIRTY_SOURCE"
    );
    assert_eq!(
        ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
        draft["text"]
    );
    ipc(&mut service, "source.discard", json!({"path":PATH}));
    service.close().unwrap();
    service.open_path(&root).unwrap();
    let reopened = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    assert_eq!(frame(&reopened)["properties"][0]["value"], 720);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), after);
    if let Some(output) = std::env::var_os("LOOMLIGHT_SCREEN_EVIDENCE") {
        fs::write(output, serde_json::to_vec_pretty(&json!({"schemaVersion":1,
            "before":String::from_utf8(before.clone()).unwrap(),"accepted":String::from_utf8(after.clone()).unwrap(),
            "beforeSHA256":hex::encode(Sha256::digest(&before)),"acceptedSHA256":hex::encode(Sha256::digest(&after)),
            "byteStart":expected_start,"old":"640","new":"720","screen":"loomlight_help","property":"xsize",
            "value":720,"roundtrip":true,"undoRedo":true,"draftRetained":true,"reopen":true})).unwrap()).unwrap();
    }
    // An ordinary external edit refuses the old revision and survives intact.
    let external = [after.as_slice(), b"# external edit\n"].concat();
    fs::write(root.join(PATH), &external).unwrap();
    assert_eq!(
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&reopened, 800)
        )["error"]["code"],
        "SOURCE_CONFLICT"
    );
    assert_eq!(fs::read(root.join(PATH)).unwrap(), external);
    service.close().unwrap();
}

#[test]
fn screen_source_protects_lexical_and_unknown_boundaries() {
    let source = b"init python:\n    fake = '''\nscreen pretend():\n    frame:\n        xsize 12\n'''\nscreen real():\n    frame:\n        xsize 640\n        python:\n            xsize = 999\n        text \"hash # literal\"\n";
    let doc = inspect(source, PATH.into(), "revision".into()).unwrap();
    assert_eq!(doc.screens.len(), 1);
    assert_eq!(doc.screens[0].name, "real");
    assert_eq!(doc.screens[0].nodes.len(), 3);
    assert_eq!(doc.screens[0].nodes[1].properties[0].value, 640);
    assert!(!doc.screens[0].nodes[1].protected.is_empty());
    for source in [
        "screen same():\n    text \"one\"\nscreen  same():\n    text \"two\"\n",
        "screen same():\n    text \"one\"\nscreen\tsame():\n    text \"two\"\n",
        "screen same():\n    text \"one\"\nscreen same(x):\n    text x\n",
        "screen broken():\n    text \"unfinished\n",
        "screen tab():\n\tframe:\n\t\txsize 12\n",
    ] {
        assert!(inspect(source.as_bytes(), PATH.into(), "revision".into()).is_err());
    }
    let doc = inspect(
        b"screen real():\n    frame:\n        xsize 640\n        xsize width\n",
        PATH.into(),
        "revision".into(),
    )
    .unwrap();
    assert!(
        doc.screens[0].nodes[1].properties.is_empty(),
        "ambiguous property ownership must refuse"
    );
    assert!(doc.partial);
    let duplicate_literals = inspect(
        b"screen real():\n    frame:\n        xsize 640\n        xsize 720\n",
        PATH.into(),
        "revision".into(),
    )
    .unwrap();
    assert!(duplicate_literals.partial);
    assert_eq!(duplicate_literals.screens[0].nodes[1].protected.len(), 2);
    for value in [
        "../help.rpy",
        "game/screens.rpy",
        "game/ui/../help.rpy",
        "game/ui/a/b.rpy",
    ] {
        assert!(path(value).is_err());
    }
}

#[test]
fn screen_source_requests_refuse_invalid_session_schema_range_and_opaque_target() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service =
        LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
            .unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), FIXTURE).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    for value in [0, 16385] {
        reject(
            &mut service,
            "screens.setPixelProperty",
            request(&doc, value),
        );
    }
    let mut invalid = request(&doc, 720);
    invalid["extra"] = json!("forbidden");
    reject(&mut service, "screens.setPixelProperty", invalid);
    let mut invalid = request(&doc, 720);
    invalid["nodeStart"] = json!(0);
    reject(&mut service, "screens.setPixelProperty", invalid);
    let result = serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,
        "requestId":"wrong-session","operation":"screens.inspect","payload":{"path":PATH,"sessionId":"old"}}),false,&mut service)).unwrap();
    assert_eq!(result["ok"], false);
    assert_eq!(fs::read_to_string(root.join(PATH)).unwrap(), FIXTURE);
    service.close().unwrap();
}

#[test]
fn screen_atomic_size_two_tokens_one_history_entry_and_source_reconciliation() {
    let temporary = tempfile::tempdir().unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile")).unwrap();
    let root = temporary.path().join("profile/synthetic-project");
    fs::create_dir(root.join("game/ui")).unwrap();
    let before = format!("\u{feff}{}", FIXTURE.replace('\n', "\r\n"));
    fs::write(root.join(PATH), &before).unwrap();
    service.open_path(&root).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let change = |d: &Value, w: u32, h: u32| json!({"path":PATH,"expectedRevision":d["revision"],"screenName":"loomlight_help","nodeStart":frame(d)["span"]["start"],"width":w,"height":h});
    let after = ipc(&mut service, "screens.setSize", change(&doc, 811, 407));
    let expected = before.replacen("640", "811", 1).replacen("360", "407", 1);
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    assert_eq!(ipc(&mut service, "screens.setSize", change(&after, 811, 407))["revision"], after["revision"]);
    assert_eq!(reject(&mut service, "screens.setSize", change(&after, 0, 450))["error"]["code"], "INVALID_PAYLOAD");
    assert_eq!(fs::read(root.join(PATH)).unwrap(), expected.as_bytes());
    for (operation, bytes) in [("undo", before.as_bytes()), ("redo", expected.as_bytes())] {
        let model = ipc(&mut service, "scene.list", json!({}));
        ipc(&mut service,"scene.apply",json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":operation}}));
        assert_eq!(fs::read(root.join(PATH)).unwrap(), bytes);
    }
    let opened = ipc(&mut service,"source.open",json!({"path":PATH}));
    let changed_source = opened["text"].as_str().unwrap().replacen("811", "812", 1);
    let draft = ipc(&mut service,"source.updateDraft",json!({"path":PATH,"expectedBaseRevision":opened["baseRevision"],"text":changed_source,"selectionStart":0,"selectionEnd":0}));
    assert_eq!(reject(&mut service,"screens.setSize",change(&after,900,500))["error"]["code"],"DIRTY_SOURCE");
    ipc(&mut service,"source.save",json!({"path":PATH,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
    let fresh = ipc(&mut service,"screens.inspect",json!({"path":PATH}));
    assert_eq!(frame(&fresh)["properties"][0]["value"],812);
    assert_eq!(reject(&mut service,"screens.setSize",change(&after,900,500))["error"]["code"],"SOURCE_CONFLICT");
    service.close().unwrap(); service.open_path(&root).unwrap();
    assert_eq!(ipc(&mut service,"screens.inspect",json!({"path":PATH}))["revision"],fresh["revision"]);
}
