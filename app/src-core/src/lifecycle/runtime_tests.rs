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
    let session = reopened.session_id;
    let host = crate::dispatch::ApplicationHost::new(service);
    let p = host_result(
        &host,
        &session,
        &host_call(
            &host,
            &session,
            "runtime.prepare",
            json!({"kind":"run","revisionChoice":"saved","sdkId":sdk_id}),
        ),
    );
    assert_eq!(p["ok"], true, "{p}");
    let t = host_result(
        &host,
        &session,
        &host_call(
            &host,
            &session,
            "runtime.grantTrust",
            json!({"preparationId":p["value"]["preparationId"]}),
        ),
    );
    assert_eq!(t["ok"], true, "{t}");
    let running = host_result(
        &host,
        &session,
        &host_call(
            &host,
            &session,
            "runtime.start",
            json!({"preparationId":p["value"]["preparationId"],"trustId":t["value"]["trustId"]}),
        ),
    );
    assert_eq!(running["ok"], true, "{running}");
    let id = running["value"]["operationId"].clone();
    wait_for(
        || {
            host_call(
                &host,
                &session,
                "runtime.status",
                json!({"operationId":id,"afterSequence":0}),
            )["value"]["phase"]
                == "running"
        },
        30,
    );
    assert_eq!(
        host_call(
            &host,
            &session,
            "runtime.revokeTrust",
            json!({"trustId":t["value"]["trustId"]})
        )["ok"],
        true
    );
    wait_for(
        || {
            host_call(
                &host,
                &session,
                "runtime.status",
                json!({"operationId":id,"afterSequence":0}),
            )["value"]["cleanupComplete"]
                == true
        },
        8,
    );
    host.shutdown();
    println!("phase-1g-runtime-service-gate: passed; saved edit, no reload, asset refusal/retry, renewed consent, Stop/Run latest, stale token, revoke and reopen");
}

fn host_call(
    host: &crate::dispatch::ApplicationHost,
    session: &str,
    operation: &str,
    mut payload: Value,
) -> Value {
    payload["sessionId"] = json!(session);
    serde_json::to_value(host.dispatch(json!({"protocolVersion":1,"requestId":"runtime-test","operation":operation,"payload":payload}), false)).unwrap()
}
fn host_result(host: &crate::dispatch::ApplicationHost, session: &str, ticket: &Value) -> Value {
    let mut response = Value::Null;
    wait_for(
        || {
            let status = host_call(
                host,
                session,
                "runtime.requestStatus",
                json!({"requestToken":ticket["value"]["requestToken"]}),
            );
            assert_eq!(status["ok"], true, "{status}");
            response = status["value"]["response"].clone();
            status["value"]["pending"] == false
        },
        180,
    );
    response
}
fn synthetic_inventory_sdk(root: &Path) -> ValidatedSdk {
    fs::create_dir_all(root.join("gui")).unwrap();
    fs::create_dir_all(root.join("lib/py3-windows-x86_64")).unwrap();
    for name in ["renpy.py", "renpy.sh", "lib/py3-windows-x86_64/python.exe"] {
        fs::write(root.join(name), b"not executable: inventory fixture only").unwrap();
    }
    crate::renpy::inspect_sdk(&fs::canonicalize(root).unwrap()).unwrap()
}
#[test]
fn runtime_dispatch_cancels_inventory_prepare_grant_start_and_isolates_old_completion() {
    use std::sync::{mpsc, Arc, Mutex};
    for stage in ["runtime.prepare", "runtime.grantTrust", "runtime.start"] {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("project");
        make_openable_project(&root, "Cancellation");
        let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
        let sdk = synthetic_inventory_sdk(&temp.path().join("sdk"));
        let sdk_id = service.remember_sdk(sdk, "synthetic-inventory-only").id;
        let session = service.open_path(&root).unwrap().session_id;
        call(&mut service, &session, "runtime.installPolicy", json!({}));
        let opened = call(
            &mut service,
            &session,
            "source.open",
            json!({"path":"game/script.rpy"}),
        );
        call(
            &mut service,
            &session,
            "source.updateDraft",
            json!({"path":"game/script.rpy","expectedBaseRevision":opened["baseRevision"],"text":"# retained draft","selectionStart":2,"selectionEnd":2}),
        );
        let before = fs::read(root.join("game/script.rpy")).unwrap();
        let host = crate::dispatch::ApplicationHost::new(service);
        let prepare = json!({"kind":"run","revisionChoice":"saved","sdkId":sdk_id});
        let mut payload = prepare.clone();
        if stage != "runtime.prepare" {
            let prepared = host_result(
                &host,
                &session,
                &host_call(&host, &session, "runtime.prepare", prepare.clone()),
            );
            assert_eq!(prepared["ok"], true, "{prepared}");
            payload = json!({"preparationId":prepared["value"]["preparationId"]});
            if stage == "runtime.start" {
                let grant = host_result(
                    &host,
                    &session,
                    &host_call(&host, &session, "runtime.grantTrust", payload.clone()),
                );
                assert_eq!(grant["ok"], true, "{grant}");
                payload["trustId"] = grant["value"]["trustId"].clone();
            }
        }
        let (entered_tx, entered_rx) = mpsc::channel();
        let (resume_tx, resume_rx) = mpsc::channel();
        let resume_rx = Mutex::new(resume_rx);
        host.hold_inventory(Arc::new(move || {
            entered_tx.send(()).unwrap();
            resume_rx
                .lock()
                .unwrap()
                .recv_timeout(Duration::from_secs(5))
                .unwrap();
        }));
        let ticket = host_call(&host, &session, stage, payload);
        assert_eq!(ticket["ok"], true, "{ticket}");
        entered_rx.recv_timeout(Duration::from_secs(5)).unwrap();
        let now = Instant::now();
        let status = host_call(
            &host,
            &session,
            "runtime.requestStatus",
            json!({"requestToken":ticket["value"]["requestToken"]}),
        );
        assert_eq!(status["value"]["pending"], true);
        let cancel = host_call(
            &host,
            &session,
            "runtime.cancelRequest",
            json!({"requestToken":ticket["value"]["requestToken"]}),
        );
        assert_eq!(cancel["ok"], true);
        assert!(
            now.elapsed() < Duration::from_millis(250),
            "control waited for held inventory"
        );
        assert_eq!(
            host_call(&host, &session, "runtime.prepare", prepare.clone())["error"]["code"],
            "RUNTIME_BUSY"
        );
        resume_tx.send(()).unwrap();
        assert_eq!(
            host_result(&host, &session, &ticket)["error"]["code"],
            "RUNTIME_CANCELLED"
        );
        assert_eq!(
            host.request_spawns(),
            0,
            "cancellation must precede every spawn attempt"
        );
        host.with_service(|service| {
            assert!(
                service.runtime.process.is_none(),
                "cancelled boundary spawned a process"
            );
            assert!(!service.runtime.busy());
            assert_eq!(service.source_inventory().unwrap().dirty_count, 1);
        })
        .unwrap();
        assert_eq!(fs::read(root.join("game/script.rpy")).unwrap(), before);
        let next = host_call(&host, &session, "runtime.prepare", prepare);
        assert_eq!(host_result(&host, &session, &next)["ok"], true);
        assert_eq!(
            host_call(
                &host,
                &session,
                "runtime.cancelRequest",
                json!({"requestToken":ticket["value"]["requestToken"]})
            )["error"]["code"],
            "STALE_RUNTIME"
        );
        assert!(host.with_service(|service| service.runtime.busy()).unwrap());
        // Completion raced cancellation and a separate authoring request now owns
        // the service. Cancellation must still be accepted without waiting for it.
        let held_host = host.clone();
        let (entered_tx, entered_rx) = mpsc::channel();
        let (resume_tx, resume_rx) = mpsc::channel();
        let held = thread::spawn(move || {
            held_host
                .with_service(|_| {
                    entered_tx.send(()).unwrap();
                    resume_rx.recv_timeout(Duration::from_secs(5)).unwrap();
                })
                .unwrap()
        });
        entered_rx.recv_timeout(Duration::from_secs(5)).unwrap();
        let cancel_started = Instant::now();
        assert_eq!(
            host_call(
                &host,
                &session,
                "runtime.cancelRequest",
                json!({"requestToken":next["value"]["requestToken"]})
            )["ok"],
            true
        );
        assert!(cancel_started.elapsed() < Duration::from_millis(250));
        assert_eq!(
            host_result(&host, &session, &next)["error"]["code"],
            "RUNTIME_CANCELLED"
        );
        resume_tx.send(()).unwrap();
        held.join().unwrap();
        assert!(!host.with_service(|service| service.runtime.busy()).unwrap());
        host.shutdown();
    }
}

fn attach_child(
    service: &mut LifecycleService,
    root: &Path,
    kind: crate::renpy::runtime::RuntimeKind,
    starting: bool,
    closed: bool,
    fail: bool,
) -> String {
    let (authority, _) = service.authoring_context().unwrap();
    let gate = service
        .authoring
        .transactions
        .reserve_execution(&authority)
        .unwrap();
    let process =
        crate::renpy::runtime::tests::service_process(root, gate, kind, starting, closed, fail);
    let id = process.id.clone();
    service.runtime.process = Some(process);
    wait_for(|| root.join("ready").exists(), 5);
    id
}
#[test]
fn runtime_service_switch_cancel_stop_shutdown_drop_and_closed_pipe_descendants() {
    use crate::renpy::runtime::{tests::assert_descendant_dead, RuntimeKind};
    for closed in [false, true] {
        for action in [
            "switch",
            "shutdown",
            "drop",
            "starting",
            "validating",
            "cleanupFailure",
        ] {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().join("old");
            let next = temp.path().join("next");
            make_openable_project(&root, "Old session");
            make_openable_project(&next, "Next session");
            let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
            let session = service.open_path(&root).unwrap().session_id;
            let kind = if action == "validating" {
                RuntimeKind::Validate
            } else {
                RuntimeKind::Run
            };
            let id = attach_child(
                &mut service,
                &root,
                kind,
                action == "starting",
                closed,
                action == "cleanupFailure",
            );
            if action == "drop" {
                drop(service);
                assert_descendant_dead(&root);
                continue;
            }
            if action == "shutdown" {
                service.runtime_shutdown();
                assert_descendant_dead(&root);
                continue;
            }
            // A cancelled project switch/close leaves this session and child owned.
            assert!(matches!(
                service.open_path(&next),
                Err(LifecycleError::Runtime(runtime::RuntimeError::Busy))
            ));
            assert_eq!(service.current().unwrap().session_id, session);
            let host = crate::dispatch::ApplicationHost::new(service);
            let held_host = host.clone();
            let (entered_tx, entered_rx) = std::sync::mpsc::channel();
            let (resume_tx, resume_rx) = std::sync::mpsc::channel();
            let held = thread::spawn(move || {
                held_host
                    .with_service(|_| {
                        entered_tx.send(()).unwrap();
                        resume_rx.recv_timeout(Duration::from_secs(5)).unwrap();
                    })
                    .unwrap()
            });
            entered_rx.recv_timeout(Duration::from_secs(5)).unwrap();
            let now = Instant::now();
            assert_eq!(
                host_call(
                    &host,
                    &session,
                    "runtime.status",
                    json!({"operationId":id,"afterSequence":0})
                )["ok"],
                true
            );
            assert_eq!(
                host_call(&host, &session, "runtime.stop", json!({"operationId":id}))["ok"],
                true
            );
            assert!(
                now.elapsed() < Duration::from_millis(250),
                "control waited for competing service ownership"
            );
            resume_tx.send(()).unwrap();
            held.join().unwrap();
            if action == "cleanupFailure" {
                wait_for(
                    || {
                        host_call(
                            &host,
                            &session,
                            "runtime.status",
                            json!({"operationId":id,"afterSequence":0}),
                        )["value"]["phase"]
                            == "cleanupFailed"
                    },
                    8,
                );
                host.with_service(|service| {
                    assert!(service.runtime.busy());
                    assert!(!service.runtime_shutdown());
                    assert!(
                        service.runtime.busy(),
                        "failed cleanup owner must survive shutdown"
                    );
                    assert!(service.open_path(&next).is_err());
                    let (authority, _) = service.authoring_context().unwrap();
                    assert!(service
                        .authoring
                        .transactions
                        .require_no_execution(&authority)
                        .is_err());
                })
                .unwrap();
            } else {
                wait_for(
                    || {
                        host_call(
                            &host,
                            &session,
                            "runtime.status",
                            json!({"operationId":id,"afterSequence":0}),
                        )["value"]["cleanupComplete"]
                            == true
                    },
                    8,
                );
                let new_session = host
                    .with_service(|service| service.open_path(&next).unwrap().session_id)
                    .unwrap();
                assert_eq!(
                    host_call(&host, &session, "runtime.stop", json!({"operationId":id}))["error"]
                        ["code"],
                    "STALE_PROJECT_SESSION"
                );
                assert_eq!(
                    host_call(
                        &host,
                        &new_session,
                        "runtime.stop",
                        json!({"operationId":id})
                    )["error"]["code"],
                    "STALE_RUNTIME"
                );
            }
            assert_descendant_dead(&root);
            host.shutdown();
        }
    }
}

#[test]
fn runtime_dialog_completion_cannot_mutate_replacement_session() {
    let temp = tempfile::tempdir().unwrap();
    let first = temp.path().join("first");
    let second = temp.path().join("second");
    make_openable_project(&first, "First");
    make_openable_project(&second, "Second");
    let mut service = LifecycleService::new(temp.path().join("state")).unwrap();
    let before = service.open_path(&first).unwrap().session_id;
    let host = crate::dispatch::ApplicationHost::new(service);
    // The picker remains outstanding while normal service requests continue.
    let next = host
        .with_service(|service| service.open_path(&second).unwrap().session_id)
        .unwrap();
    let mut invoked = false;
    let response = host
        .complete_dialog("dialog-result".into(), Some(before), |_| {
            invoked = true;
            crate::CoreResponse::success("dialog-result".into(), json!({}))
        })
        .unwrap();
    assert!(!invoked);
    assert_eq!(
        serde_json::to_value(response).unwrap()["error"]["code"],
        "STALE_PROJECT_SESSION"
    );
    assert_eq!(
        host.with_service(|service| service.current().unwrap().session_id)
            .unwrap(),
        next
    );
    host.shutdown();
}
