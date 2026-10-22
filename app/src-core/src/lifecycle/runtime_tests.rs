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
#[ignore = "selected L17 deliberate reference; one SDK process for two virtual aspects"]
fn canvas_reference_sdk_captures_actual_screen_at_two_internal_aspects() {
    use sha2::{Digest,Sha256};
    let archive=PathBuf::from(std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("pinned official archive"));
    let output=PathBuf::from(std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE").expect("fresh ignored evidence root"));
    fs::create_dir_all(&output).unwrap();
    let temporary=tempfile::Builder::new().prefix("loomlight-canvas-reference-").tempdir().unwrap();
    let profile=temporary.path().join("profile");
    let mut service=LifecycleService::prepare_canvas_screen_probe(profile.clone(),&archive).unwrap();
    let root=profile.join("synthetic-project");
    let session=service.open_path(&root).unwrap().session_id;
    let sdk_id=service.discover_sdks()[0].id.clone();
    let accepted=fs::read(root.join("game/ui/help.rpy")).unwrap();
    let doc=call(&mut service,&session,"screens.inspect",json!({"path":"game/ui/help.rpy"}));
    let preview=json!({"purpose":"screen","path":"game/ui/help.rpy","screenName":"loomlight_help","expectedRevision":doc["revision"]});
    let preparation=call(&mut service,&session,"runtime.prepare",json!({"kind":"run","revisionChoice":"saved","sdkId":sdk_id,"preview":preview}));
    // This instrumentation is not a renderer input or project write capability.
    // The ordinary frozen preview contains the accepted screen and identical assets.
    let scratch_root=service.prepare_canvas_reference_fixture();
    let trust=call(&mut service,&session,"runtime.grantTrust",json!({"preparationId":preparation["preparationId"]}));
    fs::write(output.join("reservation.json"),serde_json::to_vec_pretty(&json!({"sdkProcesses":1,"aspects":[[1280,720],[1024,768]],"acceptedSHA256":hex::encode(Sha256::digest(&accepted))})).unwrap()).unwrap();
    let started=call(&mut service,&session,"runtime.start",json!({"preparationId":preparation["preparationId"],"trustId":trust["trustId"]}));
    let payload=json!({"operationId":started["operationId"],"afterSequence":0});
    let mut observed=Value::Null;
    wait_for(|| {
        observed=call(&mut service,&session,"runtime.status",payload.clone());
        fs::write(output.join("observed.json"),serde_json::to_vec_pretty(&observed).unwrap()).unwrap();
        observed["cleanupComplete"]==true || observed["output"].as_str().unwrap().lines().filter(|s|s.starts_with("CANVAS_REFERENCE ")).count()==4
    },45);
    fs::write(output.join("observed.json"),serde_json::to_vec_pretty(&observed).unwrap()).unwrap();
    let records=observed["output"].as_str().unwrap().lines().filter_map(|s|s.strip_prefix("CANVAS_REFERENCE "))
        .map(|s|serde_json::from_str::<Value>(s).unwrap()).collect::<Vec<_>>();
    for record in &records {
        for key in ["filename","drawableFilename"] {
            let name=record[key].as_str().unwrap();
            assert!(name.starts_with("reference-") && name.ends_with(".png") && !name.contains(['/', '\\']));
            fs::copy(scratch_root.join(name),output.join(name)).unwrap();
        }
    }
    if observed["cleanupComplete"]!=true {
        call(&mut service,&session,"runtime.stop",json!({"operationId":started["operationId"]}));
        wait_for(|| {observed=call(&mut service,&session,"runtime.status",payload.clone());observed["cleanupComplete"]==true},10);
    }
    let diagnostics=call(&mut service,&session,"runtime.diagnostics",json!({"operationId":started["operationId"]}));
    let passed=records.len()==4 && help_preview_terminal_clean("run",&observed,&diagnostics);
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":passed,"records":records,"status":observed,"diagnostics":diagnostics,"sourceUnchanged":fs::read(root.join("game/ui/help.rpy")).unwrap()==accepted,"nativeWebView":false})).unwrap()).unwrap();
    assert!(passed,"Actual reference failed: {observed}");
    for record in &records {
        assert_eq!(record["menu"],false);
        assert_eq!(record["widgetSelection"],"base");
        assert_eq!(record["physical"],record["aspect"],"matched window scaling required");
        for (name,width,height) in [("help_panel",640.0,360.0),("help_image",64.0,48.0),("help_button",143.0,45.0)] {
            assert_eq!(record["geometry"][name][0].as_f64(),Some(width),"{record}");
            assert_eq!(record["geometry"][name][1].as_f64(),Some(height),"{record}");
        }
    }
    assert_eq!(fs::read(root.join("game/ui/help.rpy")).unwrap(),accepted);
    assert!(!root.join("game/ui/help.rpyc").exists()); assert!(!root.join("game/saves").exists());
    assert!(!scratch_root.exists()); assert!(service.runtime_shutdown()); service.close().unwrap();
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
    for screen_preview in [false, true] {
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
        let mut prepare = json!({"kind":"run","revisionChoice":"saved","sdkId":sdk_id});
        if screen_preview {
            fs::create_dir(root.join("game/ui")).unwrap();
            fs::write(root.join("game/ui/help.rpy"),include_bytes!("../../../../tests/fixtures/phase-3b-screens/help.rpy")).unwrap();
            let document=host.with_service(|s|s.screens_inspect(crate::screens::InspectRequest { path:"game/ui/help.rpy".into() }).unwrap()).unwrap();
            prepare["preview"]=json!({"purpose":"screen","path":"game/ui/help.rpy","screenName":"loomlight_help","expectedRevision":document.revision});
        }
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
        assert_eq!(fs::read_dir(temp.path().join("state")).unwrap().filter_map(Result::ok).filter(|e|e.file_name().to_string_lossy().starts_with("scratch-preview-")).count(),0);
    }
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
                host_call(
                    &host,
                    &session,
                    "runtime.diagnostics",
                    json!({"operationId":id})
                )["ok"],
                true
            );
            assert_eq!(
                host_call(
                    &host,
                    "old-session",
                    "runtime.diagnostics",
                    json!({"operationId":id})
                )["error"]["code"],
                "STALE_PROJECT_SESSION"
            );
            assert_eq!(
                host_call(
                    &host,
                    &session,
                    "runtime.diagnostics",
                    json!({"operationId":id,"path":"game/custom.rpy"})
                )["error"]["code"],
                "INVALID_PAYLOAD"
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

#[test]
#[ignore = "explicit official SDK diagnostics gate; missing archive fails"]
fn runtime_diagnostics_sdk_gate() {
    let archive =
        std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("official SDK archive required");
    let temp = tempfile::tempdir().unwrap();
    let sdk = crate::renpy::install_supported_sdk_from_archive(
        &temp.path().join("sdk"),
        Path::new(&archive),
    )
    .unwrap();
    for (case, source, origin) in [
        ("compile", "\u{feff}label diagnostic_case:\r\n    this is not a statement !!!\r\n", "compile"),
        ("lint", "\u{feff}label diagnostic_case:\r\n    show loomlight_image_that_does_not_exist\r\n    return\r\n", "lint"),
    ] {
        let stage = Instant::now();
        let root = temp.path().join(case);
        make_openable_project(&root, "Diagnostic fixture");
        let path = "game/雪 diagnostic.rpy";
        fs::write(root.join(path), source).unwrap();
        let mut service = LifecycleService::new(temp.path().join(format!("state-{case}"))).unwrap();
        let sdk_id = service.remember_sdk(sdk.clone(), "verified-official").id;
        let session = service.open_path(&root).unwrap().session_id;
        let prep = call(&mut service,&session,"runtime.prepare",json!({"kind":"validate","revisionChoice":"saved","sdkId":sdk_id}));
        let trust = call(&mut service,&session,"runtime.grantTrust",json!({"preparationId":prep["preparationId"]}));
        let start = call(&mut service,&session,"runtime.start",json!({"preparationId":prep["preparationId"],"trustId":trust["trustId"]}));
        let id = start["operationId"].as_str().unwrap();
        let mut status;
        loop {
            status = call(&mut service,&session,"runtime.status",json!({"operationId":id,"afterSequence":0}));
            if status["cleanupComplete"] == true { break; }
            assert!(stage.elapsed() < Duration::from_secs(190)); thread::sleep(Duration::from_millis(30));
        }
        assert_eq!(status["phase"],"failed", "{case}: {status}");
        let report = call(&mut service,&session,"runtime.diagnostics",json!({"operationId":id}));
        let records = report["diagnostics"].as_array().unwrap();
        let diagnostic = records.iter().find(|d| d["path"] == path).unwrap_or_else(|| panic!("{case}: {report}\n{status}"));
        assert_eq!(diagnostic["origin"],origin); assert_eq!(diagnostic["line"],2);
        assert_eq!(diagnostic["sessionId"],session); assert_eq!(diagnostic["operationId"],id);
        if case == "compile" { assert!(records.iter().all(|d| d["origin"] != "lint")); }
        let target = call(&mut service,&session,"runtime.resolveDiagnostic",json!({"operationId":id,"diagnosticId":diagnostic["id"]}));
        let opened = call(&mut service,&session,"source.open",target.clone());
        assert_eq!(opened["baseRevision"],diagnostic["sourceRevision"]);
        let selected = opened["selectionStart"].as_u64().unwrap() as usize;
        assert_eq!(selected, "label diagnostic_case:\r\n".encode_utf16().count());
        for payload in [json!({"sessionId":session,"operationId":id,"diagnosticId":diagnostic["id"],"path":"/host/file"}),json!({"sessionId":"old","operationId":id,"diagnosticId":diagnostic["id"]})] {
            assert_eq!(closeout_ipc(&mut service,"runtime.resolveDiagnostic",payload)["ok"],false);
        }
        fs::rename(root.join(path),root.join("saved-original")).unwrap();
        fs::write(root.join(path),source).unwrap(); // Equal bytes, different file identity.
        assert_eq!(closeout_ipc(&mut service,"runtime.resolveDiagnostic",json!({"sessionId":session,"operationId":id,"diagnosticId":diagnostic["id"]}))["ok"],false);
        fs::remove_file(root.join(path)).unwrap();
        assert_eq!(closeout_ipc(&mut service,"runtime.resolveDiagnostic",json!({"sessionId":session,"operationId":id,"diagnosticId":diagnostic["id"]}))["ok"],false);
        service.close().unwrap(); service.open_path(&root).unwrap();
        assert_eq!(fs::read(root.join("saved-original")).unwrap(),source.as_bytes());
        println!("runtime-diagnostics-sdk-{case}: passed; elapsed_ms={}",stage.elapsed().as_millis());
    }
}

#[test]
fn help_preview_gate_rejects_runtime_error_after_cleanup() {
    let status = json!({"phase":"cancelled","exitCode":0,"cleanupComplete":true,"outputTruncated":false,
        "output":"While running game code:\nAttributeError: 'Layout' object has no attribute 'yesno_prompt'"});
    let diagnostics = json!({"diagnostics":[{"origin":"runtime","severity":"error","message":"AttributeError"}]});
    assert!(!help_preview_terminal_clean("run", &status, &diagnostics));
    let empty = json!({"diagnostics":[]});
    assert!(!help_preview_terminal_clean("run", &status, &empty), "raw error alone rejects");
    let mut clean = status.clone(); clean["output"] = json!("HELP_SCRATCH_GEOMETRY {}");
    assert!(!help_preview_terminal_clean("run", &clean, &diagnostics), "diagnostic alone rejects");
    assert!(help_preview_terminal_clean("run", &clean, &empty));
    for (key, value) in [("cleanupComplete",json!(false)),("outputTruncated",json!(true)),("phase",json!("failed")),("exitCode",json!(1))] {
        let mut failed = clean.clone(); failed[key] = value;
        assert!(!help_preview_terminal_clean("run", &failed, &empty), "{key}");
    }
    assert!(!help_preview_terminal_clean("run", &clean, &json!({})), "missing diagnostics fail closed");
    clean["phase"] = json!("exited"); clean["exitCode"] = json!(0);
    assert!(help_preview_terminal_clean("validate", &clean, &empty));
}

#[test]
fn help_preview_gate_recognizes_owned_windows_console_stop() {
    let status = json!({"phase":"cancelled","exitCode":-1073741510_i64,"cleanupComplete":true,"outputTruncated":false,"output":"LOOMLIGHT_RUNTIME_READY_V1"});
    assert!(help_preview_terminal_clean_for_target("run", &status, &json!({"diagnostics":[]}), "windows"));
    let empty = json!({"diagnostics":[]});
    assert!(!help_preview_terminal_clean_for_target("run", &status, &empty, "macos"));
    assert!(!help_preview_terminal_clean_for_target("validate", &status, &empty, "windows"));
    for (key, value) in [("phase",json!("exited")),("cleanupComplete",json!(false)),("outputTruncated",json!(true)),("exitCode",json!(-1073741819_i64)),("exitCode",Value::Null),("output",json!("AttributeError: failure"))] {
        let mut failed = status.clone(); failed[key] = value;
        assert!(!help_preview_terminal_clean_for_target("run", &failed, &empty, "windows"), "{key}");
    }
    assert!(!help_preview_terminal_clean_for_target("run", &status, &json!({"diagnostics":[{"severity":"error"}]}), "windows"));
    let mut missing = status.clone(); missing.as_object_mut().unwrap().remove("exitCode");
    assert!(!help_preview_terminal_clean_for_target("run", &missing, &empty, "windows"));
}

fn help_preview_terminal_clean(kind: &str, status: &Value, diagnostics: &Value) -> bool {
    help_preview_terminal_clean_for_target(kind, status, diagnostics, std::env::consts::OS)
}
fn help_preview_terminal_clean_for_target(kind: &str, status: &Value, diagnostics: &Value, target_os: &str) -> bool {
    let Some(output) = status["output"].as_str() else { return false; };
    let Some(exit) = status.get("exitCode") else { return false; };
    let owned_stop_exit = exit == 0 || target_os != "windows" && exit.is_null()
        || target_os == "windows" && exit.as_i64() == Some(-1073741510);
    status["cleanupComplete"] == true && status["outputTruncated"] == false
        && if kind == "validate" { status["phase"] == "exited" && status["exitCode"] == 0 }
           else { kind == "run" && status["phase"] == "cancelled" && owned_stop_exit }
        && !["Traceback (most recent call last):", "While running game code:", "Error:", "Exception:"].iter().any(|marker| output.contains(marker))
        && diagnostics["diagnostics"].as_array().is_some_and(|records| records.iter().all(|d| d["severity"] != "error"))
}

#[test]
#[ignore = "selected Help preview SDK gate; requires renderer-accepted source and pinned official archive"]
fn help_scratch_preview_sdk_geometry_revision_and_cleanup() {
    use sha2::{Digest, Sha256};
    let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("official archive required");
    let accepted = fs::read(std::env::var_os("LOOMLIGHT_HELP_ACCEPTED").expect("real renderer accepted bytes required")).unwrap();
    let output = PathBuf::from(std::env::var_os("LOOMLIGHT_HELP_SDK_EVIDENCE").expect("owned evidence directory required"));
    fs::create_dir_all(&output).unwrap();
    let temp = tempfile::Builder::new().prefix("loomlight-help-sdk-").tempdir().unwrap();
    let sdk = crate::renpy::install_supported_sdk_from_archive(&temp.path().join("sdk"), Path::new(&archive)).unwrap();
    let mut receipts = vec![];
    let mut launches = vec![];
    for (index, (width, height)) in [(1280,720),(1024,768)].into_iter().enumerate() {
        let root = temp.path().join(format!("project-{index}"));
        make_openable_project(&root,"Help runtime fixture");
        fs::create_dir(root.join("game/ui")).unwrap();
        fs::write(root.join("game/ui/help.rpy"), &accepted).unwrap();
        fs::write(root.join("game/help.png"), include_bytes!("../../../../tests/fixtures/phase-1h/assets/booth.png")).unwrap();
        fs::write(root.join("game/options.rpy"), super::runtime_probe::help_probe_options(width, height)).unwrap();
        fs::write(root.join("game/geometry_probe.rpy"), super::runtime_probe::HELP_GEOMETRY_PROBE).unwrap();
        let profile = temp.path().join(format!("profile-{index}"));
        let mut service = LifecycleService::new(profile.clone()).unwrap();
        let sdk_id = service.remember_sdk(sdk.clone(),"verified-official-fixture").id;
        let session = service.open_path(&root).unwrap().session_id;
        let document = call(&mut service,&session,"screens.inspect",json!({"path":"game/ui/help.rpy"}));
        let preview = json!({"purpose":"screen","path":"game/ui/help.rpy","screenName":"loomlight_help","expectedRevision":document["revision"]});
        let mut aspect_receipts = vec![];
        for kind in ["validate","run"] {
            let preparation = call(&mut service,&session,"runtime.prepare",json!({"kind":kind,"revisionChoice":"saved","sdkId":sdk_id,"preview":preview}));
            assert_eq!(preparation["preview"],preview);
            let trust = call(&mut service,&session,"runtime.grantTrust",json!({"preparationId":preparation["preparationId"]}));
            launches.push(json!({"aspect":[width,height],"kind":kind,"reserved":true}));
            fs::write(output.join("launch-reservations.json"),serde_json::to_vec_pretty(&launches).unwrap()).unwrap();
            let started = call(&mut service,&session,"runtime.start",json!({"preparationId":preparation["preparationId"],"trustId":trust["trustId"]}));
            let operation = started["operationId"].as_str().unwrap();
            let status_payload = json!({"operationId":operation,"afterSequence":0});
            let mut observed = Value::Null;
            wait_for(|| {
                observed = call(&mut service,&session,"runtime.status",status_payload.clone());
                fs::write(output.join(format!("aspect-{index}-{kind}-observed.json")),serde_json::to_vec_pretty(&observed).unwrap()).unwrap();
                if observed["cleanupComplete"] == true { return true; }
                kind == "run" && observed["output"].as_str().unwrap().contains("HELP_SCRATCH_GEOMETRY")
            }, 45);
            if kind == "validate" {
                assert_eq!(observed["phase"],"exited","{observed}"); assert_eq!(observed["exitCode"],0,"{observed}");
            } else {
                assert_eq!(observed["cleanupComplete"],false,"preview exited before observation: {observed}");
                let text=observed["output"].as_str().unwrap();
                let line=text.lines().find_map(|l|l.strip_prefix("HELP_SCRATCH_GEOMETRY ")).expect("actual geometry marker");
                let geometry:Value=serde_json::from_str(line).unwrap();
                assert_eq!(geometry["menu"],false,"preview must use ordinary game context");
                assert_eq!(geometry["size"].as_array().unwrap().len(), 2);
                assert_eq!(geometry["size"][0].as_f64(),Some(760.0));
                assert_eq!(geometry["size"][1].as_f64(),Some(360.0));
                assert_eq!(geometry["aspect"],json!([width,height]));
                let frame=document["screens"][0]["nodes"].as_array().unwrap().iter().find(|n|n["kind"]=="frame").unwrap();
                call(&mut service,&session,"screens.setSize",json!({"path":"game/ui/help.rpy","expectedRevision":document["revision"],"screenName":"loomlight_help","nodeStart":frame["span"]["start"],"width":768,"height":360}));
                let stale=call(&mut service,&session,"runtime.status",status_payload.clone());
                assert_eq!(stale["earlierRevision"],true); assert_eq!(stale["launchRevision"],preparation["savedRevision"]);
                aspect_receipts.push(json!({"geometry":geometry,"stale":stale}));
                call(&mut service,&session,"runtime.stop",json!({"operationId":operation}));
                wait_for(|| { observed=call(&mut service,&session,"runtime.status",status_payload.clone()); observed["cleanupComplete"]==true },10);
            }
            let diagnostics = call(&mut service,&session,"runtime.diagnostics",json!({"operationId":operation}));
            fs::write(output.join(format!("aspect-{index}-{kind}-terminal.json")),serde_json::to_vec_pretty(&json!({"status":observed,"diagnostics":diagnostics})).unwrap()).unwrap();
            assert!(help_preview_terminal_clean(kind,&observed,&diagnostics),"unclean Help preview: {observed}\n{diagnostics}");
            assert_eq!(fs::read_dir(&profile).unwrap().filter_map(Result::ok).filter(|e|e.file_name().to_string_lossy().starts_with("scratch-preview-")).count(),0,"owned scratch jobs cleaned after process reap");
            assert!(!root.join("game/saves").exists()); assert!(!root.join("game/ui/help.rpyc").exists());
            aspect_receipts.push(json!({"kind":kind,"preparation":preparation,"terminal":observed}));
            fs::write(output.join(format!("aspect-{index}-receipts.json")),serde_json::to_vec_pretty(&aspect_receipts).unwrap()).unwrap();
        }
        assert!(service.runtime_shutdown()); service.close().unwrap();
        receipts.push(json!({"aspect":[width,height],"receipts":aspect_receipts}));
        fs::write(output.join("sdk-receipts.json"),serde_json::to_vec_pretty(&json!({"acceptedSHA256":hex::encode(Sha256::digest(&accepted)),"aspects":receipts,"previewLaunches":index+1,"nativeWebView":false})).unwrap()).unwrap();
    }
}

#[test]
#[ignore = "L01 deliberate SDK preview; requires renderer-accepted blank screen and verified archive"]
fn owned_blank_screen_sdk_preview_and_cleanup() {
    use sha2::{Digest, Sha256};
    let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("official archive required");
    let accepted = fs::read(std::env::var_os("LOOMLIGHT_OWNED_SCREEN_ACCEPTED").expect("renderer-accepted source required")).unwrap();
    let output = PathBuf::from(std::env::var_os("LOOMLIGHT_OWNED_SCREEN_SDK_EVIDENCE").expect("owned evidence directory required"));
    fs::create_dir_all(&output).unwrap();
    let output = fs::canonicalize(output).unwrap();
    let temp = tempfile::Builder::new().prefix("loomlight-owned-sdk-").tempdir().unwrap();
    let sdk = crate::renpy::install_supported_sdk_from_archive(&temp.path().join("sdk"), Path::new(&archive)).unwrap();
    let root = temp.path().join("project"); make_openable_project(&root, "Owned blank screen");
    fs::create_dir(root.join("game/ui")).unwrap();
    fs::write(root.join("game/ui/travel_notes.rpy"), &accepted).unwrap();
    fs::write(root.join("game/options.rpy"), super::runtime_probe::help_probe_options(1280, 720)).unwrap();
    let capture = serde_json::to_string(&output.join("preview.png").to_string_lossy()).unwrap();
    // Test-owned observation is separate from the accepted, unchanged blank screen.
    let probe = format!(r#"init python:
    def observe_owned_blank():
        screen = renpy.get_screen("travel_notes")
        if screen is not None and not getattr(store, "owned_observed", False):
            store.owned_observed = True
            size = renpy.render(screen, config.screen_width, config.screen_height, 0, 0).get_size()
            renpy.take_screenshot()
            captured = renpy.screenshot({capture})
            print("OWNED_BLANK_PREVIEW " + __import__("json").dumps(dict(screen="travel_notes", size=list(size), menu=main_menu, captured=captured)), flush=True)
    config.overlay_screens.append("owned_blank_observer")
screen owned_blank_observer():
    timer 0.3 repeat True action Function(observe_owned_blank)
"#);
    fs::write(root.join("game/owned_probe.rpy"), probe).unwrap();
    let profile = temp.path().join("profile");
    let mut service = LifecycleService::new(profile.clone()).unwrap();
    let sdk_id = service.remember_sdk(sdk, "verified-official-owned-fixture").id;
    let session = service.open_path(&root).unwrap().session_id;
    let document = call(&mut service, &session, "screens.inspect", json!({"path":"game/ui/travel_notes.rpy"}));
    assert_eq!(document["screens"][0]["nodes"].as_array().unwrap().len(), 1);
    assert_eq!(document["partial"], false);
    let preview = json!({"purpose":"screen","path":"game/ui/travel_notes.rpy","screenName":"travel_notes","expectedRevision":document["revision"]});
    let mut receipts = vec![];
    for kind in ["validate", "run"] {
        let preparation = call(&mut service,&session,"runtime.prepare",json!({"kind":kind,"revisionChoice":"saved","sdkId":sdk_id,"preview":preview}));
        let trust = call(&mut service,&session,"runtime.grantTrust",json!({"preparationId":preparation["preparationId"]}));
        let started = call(&mut service,&session,"runtime.start",json!({"preparationId":preparation["preparationId"],"trustId":trust["trustId"]}));
        let status_payload = json!({"operationId":started["operationId"],"afterSequence":0});
        let mut observed = Value::Null;
        wait_for(|| { observed=call(&mut service,&session,"runtime.status",status_payload.clone());
            observed["cleanupComplete"]==true || kind=="run" && observed["output"].as_str().unwrap().contains("OWNED_BLANK_PREVIEW ") }, 45);
        fs::write(output.join(format!("{kind}-observed.json")),serde_json::to_vec_pretty(&observed).unwrap()).unwrap();
        if kind == "run" {
            let line=observed["output"].as_str().unwrap().lines().find_map(|line|line.strip_prefix("OWNED_BLANK_PREVIEW ")).expect("actual blank-screen render");
            let rendered:Value=serde_json::from_str(line).unwrap();
            assert_eq!(rendered,json!({"screen":"travel_notes","size":[1280.0,720.0],"menu":false,"captured":true}));
            assert!(fs::read(output.join("preview.png")).unwrap().starts_with(b"\x89PNG\r\n\x1a\n"));
            call(&mut service,&session,"runtime.stop",json!({"operationId":started["operationId"]}));
            wait_for(|| { observed=call(&mut service,&session,"runtime.status",status_payload.clone()); observed["cleanupComplete"]==true },10);
        }
        let diagnostics=call(&mut service,&session,"runtime.diagnostics",json!({"operationId":started["operationId"]}));
        fs::write(output.join(format!("{kind}-terminal.json")),serde_json::to_vec_pretty(&json!({"status":observed,"diagnostics":diagnostics})).unwrap()).unwrap();
        assert!(help_preview_terminal_clean(kind,&observed,&diagnostics),"{observed}\n{diagnostics}");
        assert_eq!(fs::read(root.join("game/ui/travel_notes.rpy")).unwrap(),accepted);
        assert!(!root.join("game/ui/travel_notes.rpyc").exists());
        assert!(!root.join("game/saves").exists());
        assert_eq!(fs::read_dir(&profile).unwrap().filter_map(Result::ok).filter(|entry|entry.file_name().to_string_lossy().starts_with("scratch-preview-")).count(),0);
        receipts.push(json!({"kind":kind,"preparation":preparation,"terminal":observed}));
    }
    assert!(service.runtime_shutdown()); service.close().unwrap();
    fs::write(output.join("result.json"),serde_json::to_vec_pretty(&json!({"passed":true,"acceptedSHA256":hex::encode(Sha256::digest(&accepted)),"receipts":receipts,"nativeWebView":false})).unwrap()).unwrap();
}
