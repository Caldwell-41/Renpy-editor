use super::tests::{closeout_ipc, make_openable_project};
use super::*;
use serde_json::{json, Value};
use std::{
    thread,
    time::{Duration, Instant},
};

fn call(
    service: &mut LifecycleService,
    session: &str,
    operation: &str,
    mut payload: Value,
) -> Value {
    payload["sessionId"] = json!(session);
    let response = closeout_ipc(service, operation, payload);
    assert_eq!(response["ok"], true, "{operation}: {response}");
    response["value"].clone()
}
#[test]
fn runtime_literal_refusal_cancel_and_policy_install_are_write_bounded() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("project");
    make_openable_project(&root, "Runtime requests");
    let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
    let session = service.open_path(&root).unwrap().session_id;
    let before = fs::read(root.join("game/script.rpy")).unwrap();
    for (operation, payload, code) in [
        (
            "runtime.prepare",
            json!({"sessionId": session, "kind": "run", "revisionChoice": "saved", "sdkId": "missing", "argv": []}),
            "INVALID_PAYLOAD",
        ),
        (
            "runtime.prepare",
            json!({"sessionId": "old", "kind": "run", "revisionChoice": "saved", "sdkId": "missing"}),
            "STALE_PROJECT_SESSION",
        ),
        (
            "runtime.start",
            json!({"sessionId": session, "preparationId": "missing", "trustId": "missing"}),
            "RUNTIME_TRUST_REQUIRED",
        ),
        (
            "runtime.stop",
            json!({"sessionId": session, "operationId": "old"}),
            "STALE_RUNTIME",
        ),
        (
            "runtime.status",
            json!({"sessionId": session, "operationId": "old", "afterSequence": -1}),
            "INVALID_PAYLOAD",
        ),
        (
            "runtime.revokeTrust",
            json!({"sessionId": session, "trustId": "old"}),
            "STALE_RUNTIME",
        ),
        (
            "runtime.grantTrust",
            json!({"sessionId": session, "preparationId": "old"}),
            "STALE_RUNTIME",
        ),
    ] {
        let result = closeout_ipc(&mut service, operation, payload);
        assert_eq!(result["error"]["code"], code, "{result}");
        assert!(service.runtime.process.is_none());
    }
    call(
        &mut service,
        &session,
        "runtime.prepare",
        json!({"kind": "run", "revisionChoice": "cancel", "sdkId": "unused"}),
    );
    assert_eq!(before, fs::read(root.join("game/script.rpy")).unwrap());
    assert!(!root.join(runtime::POLICY_PATH).exists());
    call(&mut service, &session, "runtime.installPolicy", json!({}));
    assert_eq!(
        fs::read(root.join(runtime::POLICY_PATH)).unwrap(),
        runtime::POLICY
    );
    assert_eq!(
        call(&mut service, &session, "runtime.installPolicy", json!({}))["changed"],
        false
    );
    fs::write(
        root.join(runtime::POLICY_PATH),
        b"# user-owned policy replacement",
    )
    .unwrap();
    let result = closeout_ipc(
        &mut service,
        "runtime.installPolicy",
        json!({"sessionId": session}),
    );
    assert_eq!(result["error"]["code"], "RUNTIME_POLICY_REQUIRED");
    assert_eq!(
        fs::read(root.join(runtime::POLICY_PATH)).unwrap(),
        b"# user-owned policy replacement"
    );
    assert!(service.runtime.process.is_none());
}
fn fixture(revision: &str) -> String {
    r##"define config.developer = True
define config.autoreload = False
define config.sound = False
init python:
    import os
    def loomlight_probe_tick():
        with open(os.path.join(config.basedir, "heartbeat.txt"), "w") as stream:
            stream.write("REVISION")
        command = os.path.join(config.basedir, "reload-request")
        if os.path.exists(command):
            os.unlink(command)
            _reload_game()
            with open(os.path.join(config.basedir, "reload-returned"), "w") as stream:
                stream.write("REVISION")
screen loomlight_probe_driver():
    timer 0.1 repeat True action Function(loomlight_probe_tick)
label start:
    show screen loomlight_probe_driver
    scene expression Solid("#18202b")
    "REVISION dialogue"
    jump start
"##
    .replace("REVISION", revision)
}
fn wait_for(mut predicate: impl FnMut() -> bool, seconds: u64) {
    let started = Instant::now();
    while !predicate() {
        assert!(
            started.elapsed() < Duration::from_secs(seconds),
            "SDK service condition timed out"
        );
        thread::sleep(Duration::from_millis(30));
    }
}
fn prepared(service: &mut LifecycleService, session: &str, sdk: &str) -> (Value, Value) {
    let p = call(
        service,
        session,
        "runtime.prepare",
        json!({"kind":"run", "revisionChoice":"saved", "sdkId":sdk}),
    );
    let t = call(
        service,
        session,
        "runtime.grantTrust",
        json!({"preparationId":p["preparationId"]}),
    );
    (p, t)
}
fn start(service: &mut LifecycleService, session: &str, p: &Value, t: &Value) -> String {
    let result = call(
        service,
        session,
        "runtime.start",
        json!({"preparationId":p["preparationId"], "trustId":t["trustId"]}),
    );
    let id = result["operationId"].as_str().unwrap().to_string();
    wait_for(
        || {
            let status = call(
                service,
                session,
                "runtime.status",
                json!({"operationId":id,"afterSequence":0}),
            );
            assert!(
                !status["cleanupComplete"].as_bool().unwrap(),
                "premature SDK exit: {status}"
            );
            status["phase"] == "running"
        },
        60,
    );
    id
}
fn stop(service: &mut LifecycleService, session: &str, id: &str) {
    call(service, session, "runtime.stop", json!({"operationId":id}));
    wait_for(
        || {
            call(
                service,
                session,
                "runtime.status",
                json!({"operationId":id,"afterSequence":0}),
            )["cleanupComplete"]
                == true
        },
        8,
    );
}
#[test]
#[ignore = "explicit official SDK archive gate; absence is a failure, never a skip"]
fn runtime_official_sdk_service_gate() {
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("official SDK archive required");
    let temp = tempfile::tempdir().unwrap();
    let sdk = crate::renpy::install_supported_sdk_from_archive(
        &temp.path().join("sdk"),
        Path::new(&archive),
    )
    .unwrap();
    let root = temp.path().join("project");
    make_openable_project(&root, "Runtime service proof");
    fs::write(
        root.join("game/script.rpy"),
        b"# synthetic SDK fixture entry is in custom.rpy\n",
    )
    .unwrap();
    fs::write(root.join("game/custom.rpy"), fixture("old")).unwrap();
    fs::create_dir(root.join("game/images")).unwrap();
    fs::write(
        root.join("game/images/fixture.png"),
        b"unchanged synthetic asset",
    )
    .unwrap();
    let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
    let sdk_id = service.remember_sdk(sdk, "test-verified-official").id;
    let session = service.open_path(&root).unwrap().session_id;
    call(&mut service, &session, "runtime.installPolicy", json!({}));
    // Saved revision retains drafts; Save All uses the existing real handler.
    let opened = call(
        &mut service,
        &session,
        "source.open",
        json!({"path":"game/custom.rpy"}),
    );
    let pending = format!("{}\n# accepted preparation fixture\n", fixture("old"));
    call(
        &mut service,
        &session,
        "source.updateDraft",
        json!({"path":"game/custom.rpy", "expectedBaseRevision":opened["baseRevision"], "text":pending, "selectionStart":0, "selectionEnd":0}),
    );
    let saved = call(
        &mut service,
        &session,
        "runtime.prepare",
        json!({"kind":"run", "revisionChoice":"saved", "sdkId":sdk_id}),
    );
    assert_eq!(saved["draftCount"], 1);
    assert_eq!(
        fs::read_to_string(root.join("game/custom.rpy")).unwrap(),
        fixture("old")
    );
    call(
        &mut service,
        &session,
        "runtime.cancelPreparation",
        json!({"preparationId":saved["preparationId"]}),
    );
    assert!(service.runtime.process.is_none());
    let accepted = call(
        &mut service,
        &session,
        "runtime.prepare",
        json!({"kind":"run", "revisionChoice":"saveAll", "sdkId":sdk_id}),
    );
    assert_eq!(accepted["draftCount"], 0);
    assert_eq!(
        fs::read_to_string(root.join("game/custom.rpy")).unwrap(),
        pending
    );
    call(
        &mut service,
        &session,
        "runtime.cancelPreparation",
        json!({"preparationId":accepted["preparationId"]}),
    );
    service.sdks.get_mut(&sdk_id).unwrap().version = "unsupported".into();
    let mismatch = closeout_ipc(
        &mut service,
        "runtime.prepare",
        json!({"sessionId":session,"kind":"run","revisionChoice":"saved","sdkId":sdk_id}),
    );
    assert_eq!(mismatch["error"]["code"], "UNSUPPORTED_SDK");
    service.sdks.get_mut(&sdk_id).unwrap().version = SUPPORTED_VERSION.into();
    // Neither project executable additions nor SDK module edits inherit consent.
    for sdk_change in [false, true] {
        let (p, t) = prepared(&mut service, &session, &sdk_id);
        let path = if sdk_change {
            service.sdks[&sdk_id].root.join("renpy/config.py")
        } else {
            root.join("game/external.py")
        };
        let original = fs::read(&path).ok();
        let mut changed = original.clone().unwrap_or_default();
        changed.extend_from_slice(b"\n# external executable edit\n");
        fs::write(&path, changed).unwrap();
        let refusal = closeout_ipc(
            &mut service,
            "runtime.start",
            json!({"sessionId":session,"preparationId":p["preparationId"],"trustId":t["trustId"]}),
        );
        assert_eq!(refusal["error"]["code"], "STALE_RUNTIME", "{refusal}");
        assert!(service.runtime.process.is_none());
        if let Some(original) = original {
            fs::write(path, original).unwrap();
        } else {
            fs::remove_file(path).unwrap();
        }
    }
    let (p, t) = prepared(&mut service, &session, &sdk_id);
    let refused = closeout_ipc(
        &mut service,
        "runtime.start",
        json!({"sessionId":session,"preparationId":p["preparationId"],"trustId":"ungranted"}),
    );
    assert_eq!(refused["error"]["code"], "RUNTIME_TRUST_REQUIRED");
    assert!(service.runtime.process.is_none());
    let stale_grant = closeout_ipc(
        &mut service,
        "runtime.grantTrust",
        json!({"sessionId":session,"preparationId":"stale-preparation"}),
    );
    assert_eq!(stale_grant["error"]["code"], "STALE_RUNTIME");
    let id = start(&mut service, &session, &p, &t);
    wait_for(
        || {
            fs::read_to_string(root.join("heartbeat.txt"))
                .ok()
                .as_deref()
                == Some("old")
        },
        10,
    );
    thread::sleep(Duration::from_secs(9));
    let duplicate = closeout_ipc(
        &mut service,
        "runtime.prepare",
        json!({"sessionId":session,"kind":"validate","revisionChoice":"saved","sdkId":sdk_id}),
    );
    assert_eq!(duplicate["error"]["code"], "RUNTIME_BUSY");
    assert!(matches!(
        service.close(),
        Err(LifecycleError::Runtime(runtime::RuntimeError::Busy))
    ));
    assert!(matches!(
        service.open_path(&root),
        Err(LifecycleError::Runtime(runtime::RuntimeError::Busy))
    ));
    let doc = call(
        &mut service,
        &session,
        "source.open",
        json!({"path":"game/custom.rpy"}),
    );
    let draft = call(
        &mut service,
        &session,
        "source.updateDraft",
        json!({"path":"game/custom.rpy","expectedBaseRevision":doc["baseRevision"],"text":fixture("new"),"selectionStart":0,"selectionEnd":0}),
    );
    call(
        &mut service,
        &session,
        "source.save",
        json!({"path":"game/custom.rpy","expectedBaseRevision":doc["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
    );
    assert_eq!(
        fs::read_to_string(root.join("game/custom.rpy")).unwrap(),
        fixture("new")
    );
    assert_eq!(
        call(
            &mut service,
            &session,
            "runtime.status",
            json!({"operationId":id,"afterSequence":0})
        )["earlierRevision"],
        true
    );
    let (authority, _) = service.authoring_context().unwrap();
    use crate::transaction::*;
    let path = RelativePath::new("game/images/fixture.png").unwrap();
    let (bytes, base) = service
        .authoring
        .transactions
        .snapshot(&authority, path.clone())
        .unwrap();
    let proposal = TransactionProposal {
        intent: TransactionIntent::Undo,
        mutations: vec![FileMutation {
            path,
            kind: MutationKind::ReplaceExisting,
            base,
            expected_bytes: bytes.clone(),
            proposed: b"changed after stop".to_vec(),
        }],
    };
    assert!(matches!(
        service
            .authoring
            .transactions
            .commit(&authority, proposal.clone()),
        CommitOutcome::Rejected {
            diagnostic: PublicDiagnostic {
                code: ErrorCode::RuntimeBusy,
                ..
            }
        }
    ));
    assert_eq!(
        fs::read(root.join("game/images/fixture.png")).unwrap(),
        bytes
    );
    fs::write(root.join("reload-request"), b"reload").unwrap();
    wait_for(|| root.join("reload-returned").exists(), 10);
    thread::sleep(Duration::from_secs(2));
    assert_eq!(
        fs::read_to_string(root.join("reload-returned")).unwrap(),
        "old"
    );
    assert_eq!(
        fs::read_to_string(root.join("heartbeat.txt")).unwrap(),
        "old"
    );
    stop(&mut service, &session, &id);
    assert!(matches!(
        service.authoring.transactions.commit(&authority, proposal),
        CommitOutcome::Committed { .. }
    ));
    let (p, t) = prepared(&mut service, &session, &sdk_id);
    // SDK writes/caches and probe output have uncertain provenance: renewed consent.
    assert!(p["trustId"].is_null());
    let next = start(&mut service, &session, &p, &t);
    wait_for(
        || {
            fs::read_to_string(root.join("heartbeat.txt"))
                .ok()
                .as_deref()
                == Some("new")
        },
        10,
    );
    let stale = closeout_ipc(
        &mut service,
        "runtime.stop",
        json!({"sessionId":session,"operationId":id}),
    );
    assert_eq!(stale["error"]["code"], "STALE_RUNTIME");
    call(
        &mut service,
        &session,
        "runtime.revokeTrust",
        json!({"trustId":t["trustId"]}),
    );
    wait_for(
        || {
            call(
                &mut service,
                &session,
                "runtime.status",
                json!({"operationId":next,"afterSequence":0}),
            )["cleanupComplete"]
                == true
        },
        8,
    );
    // The same preparation/trust owner runs bounded compile followed by lint.
    let validation = call(
        &mut service,
        &session,
        "runtime.prepare",
        json!({"kind":"validate","revisionChoice":"saved","sdkId":sdk_id}),
    );
    let trust = call(
        &mut service,
        &session,
        "runtime.grantTrust",
        json!({"preparationId":validation["preparationId"]}),
    );
    let validation = call(
        &mut service,
        &session,
        "runtime.start",
        json!({"preparationId":validation["preparationId"],"trustId":trust["trustId"]}),
    );
    let operation = validation["operationId"].clone();
    wait_for(
        || {
            call(
                &mut service,
                &session,
                "runtime.status",
                json!({"operationId":operation,"afterSequence":0}),
            )["cleanupComplete"]
                == true
        },
        60,
    );
    let result = call(
        &mut service,
        &session,
        "runtime.status",
        json!({"operationId":operation,"afterSequence":0}),
    );
    assert_eq!(result["phase"], "exited", "{result}");
    assert_eq!(result["exitCode"], 0, "{result}");
    assert!(result["revisionStale"].is_boolean());
    service.close().unwrap();
    let reopened = service.open_path(&root).unwrap();
    assert_ne!(reopened.session_id, session);
    assert!(service.runtime.trust.is_none());
    assert_eq!(
        fs::read_to_string(root.join("game/custom.rpy")).unwrap(),
        fixture("new")
    );
    println!("phase-1g-runtime-service-gate: passed; saved edit, no reload, asset refusal/retry, renewed consent, Stop/Run latest, stale token, revoke and reopen");
}
