//! Actual core and native-worker integration, with public synthetic credentials only.
#[path = "../src/ai_native.rs"]
mod ai_native;
#[path = "../src/ai_requests.rs"]
mod ai_requests;
#[path = "../src/rewrite_probe.rs"]
mod rewrite_probe;
use loomlight_core::{
    ai_credentials::{self, Records, Secrets},
    dispatch::ApplicationHost,
};
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
fn main() {
    let endpoint = std::env::args()
        .nth(1)
        .expect("Synthetic loopback endpoint required");
    let root = std::env::temp_dir().join(format!(
        "loomlight-rewrite-controller-{}",
        uuid::Uuid::new_v4()
    ));
    let mut service = rewrite_probe::prepare(&root, &endpoint, false).unwrap();
    let p = service.open_path(&root.join("synthetic-project")).unwrap();
    let host = ApplicationHost::new(service);
    let worker = std::sync::Arc::new(ai_requests::Service::default());
    println!("{}", json!({"sessionId":p.session_id}));
    io::stdout().flush().unwrap();
    let mut held = None;
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        if request["driver"] == "hold" {
            assert!(held.is_none());
            let (tx, rx) = std::sync::mpsc::channel();
            let (release, wait) = std::sync::mpsc::channel();
            let owner = host.clone();
            let t = std::thread::spawn(move || {
                owner
                    .with_service(|_| {
                        tx.send(()).unwrap();
                        wait.recv().unwrap();
                    })
                    .unwrap()
            });
            rx.recv().unwrap();
            held = Some((release, t));
            println!("{}", json!({"driver":"held"}));
            io::stdout().flush().unwrap();
            continue;
        }
        if request["driver"] == "release" {
            let (release, t) = held.take().unwrap();
            release.send(()).unwrap();
            t.join().unwrap();
            println!("{}", json!({"driver":"released"}));
            io::stdout().flush().unwrap();
            continue;
        }
        if request["driver"] == "snapshot" {
            let mut hashes = std::collections::BTreeMap::new();
            fn files(
                dir: &std::path::Path,
                base: &std::path::Path,
                hashes: &mut std::collections::BTreeMap<String, Vec<u8>>,
            ) {
                for e in std::fs::read_dir(dir).unwrap() {
                    let p = e.unwrap().path();
                    if p.is_dir() {
                        files(&p, base, hashes);
                    } else {
                        hashes.insert(
                            p.strip_prefix(base).unwrap().to_str().unwrap().into(),
                            std::fs::read(p).unwrap(),
                        );
                    }
                }
            }
            files(
                &root.join("synthetic-project"),
                &root.join("synthetic-project"),
                &mut hashes,
            );
            println!("{}", json!({"snapshot":hashes}));
            io::stdout().flush().unwrap();
            continue;
        }
        let id = request["requestId"].as_str().unwrap().to_owned();
        let op = request["operation"].as_str().unwrap();
        let payload = request["payload"].clone();
        let response = if ["rewrite.send", "ai.requestStatus", "ai.cancelRequest"].contains(&op) {
            worker.dispatch(&host, id, op, payload)
        } else if op == "ai.profiles" {
            let view=host.with_service(|s|{let store=s.read().unwrap();let secrets=ai_native::secrets(s.ai_data_root()).unwrap();json!({"token":ai_credentials::token(&store),"profiles":store.profiles.iter().map(|p|json!({"profileId":p.profile_id,"disabled":p.disabled,"credentialStatus":if secrets.status(&p.profile_id,p.credential.as_ref().unwrap()).0==ai_credentials::CredentialStatus::Configured{"configured"}else{"unavailable"},"settings":p.settings})).collect::<Vec<_>>()})}).unwrap();
            loomlight_core::CoreResponse::success(id, view)
        } else {
            host.dispatch(request, false)
        };
        println!("{}", serde_json::to_string(&response).unwrap());
        io::stdout().flush().unwrap();
    }
    if let Some((release, t)) = held {
        release.send(()).unwrap();
        t.join().unwrap();
    }
    assert!(worker.shutdown());
    host.with_service(|s| rewrite_probe::cleanup(s))
        .unwrap()
        .unwrap();
    assert!(host.shutdown());
    drop(host);
    std::fs::remove_dir_all(root).unwrap();
}
