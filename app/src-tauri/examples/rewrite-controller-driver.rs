//! Actual core and native-worker integration, with public synthetic credentials only.
// The example's path-import changes implicit child-module lookup. Keep the actual
// production Windows implementation and expose its parent type at the crate root.
#[cfg(target_os = "windows")]
#[path = "../src/ai_native/windows.rs"]
mod windows_native;
#[cfg(target_os = "windows")]
use ai_native::NativeSecrets;
mod ai_native {
    #[cfg(target_os = "windows")]
    pub struct NativeSecrets;
    // Same platform factory as the application; no substitute secret store.
    pub fn secrets(
        root: &std::path::Path,
    ) -> loomlight_core::ai_credentials::Result<impl loomlight_core::ai_credentials::Secrets> {
        #[cfg(target_os = "macos")]
        {
            loomlight_core::ai_file_secrets::FileSecrets::open(root)
        }
        #[cfg(target_os = "windows")]
        {
            let _ = root;
            Ok(NativeSecrets)
        }
    }
}
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
    let args: Vec<String> = std::env::args().collect();
    let endpoint = args.iter()
        .nth(1)
        .expect("Synthetic loopback endpoint required");
    let root = args.iter().position(|a| a == "--root").map(|i| std::path::PathBuf::from(&args[i + 1])).unwrap_or_else(|| std::env::temp_dir().join(format!(
        "loomlight-rewrite-controller-{}",
        uuid::Uuid::new_v4()
    )));
    let reopen = args.iter().any(|a| a == "--reopen");
    let retain = args.iter().any(|a| a == "--retain");
    assert!(!(reopen || retain) || args.iter().any(|a| a == "--root"));
    let private_lan = args.iter().any(|a| a == "--private-lan");
    let seed = if private_lan { "http://127.0.0.1:8765/v1" } else { endpoint.as_str() };
    let mut service = rewrite_probe::prepare(&root, seed, reopen).unwrap();
    if private_lan && !reopen {
        let store = service.read().unwrap();
        let mut settings = store.profiles[0].settings.clone();
        settings.endpoint = endpoint.to_owned();
        settings.private_http = true;
        // The owned-interface fixture selects literal IPv4 only. Core also validates ULA.
        let ip = endpoint.strip_prefix("http://").unwrap().split(':').next().unwrap().parse().unwrap();
        assert!(loomlight_core::ai_profiles::http_address_allowed(ip, true)
            && !loomlight_core::ai_profiles::http_address_allowed(ip, false));
        ai_credentials::save(&service, &ai_credentials::token(&store), Some(&store.profiles[0].profile_id), settings).unwrap();
        let store = service.read().unwrap();
        let secrets = ai_native::secrets(&root).unwrap();
        ai_credentials::replace(&service, &secrets, &ai_credentials::token(&store), &store.profiles[0].profile_id, "loomlight-public-rewrite-fixture").unwrap();
    }
    let p = service.open_path(&root.join("synthetic-project")).unwrap();
    let host = ApplicationHost::new(service);
    let worker = std::sync::Arc::new(ai_requests::Service::default());
    println!("{}", json!({"sessionId":p.session_id}));
    io::stdout().flush().unwrap();
    let mut held = None;
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        if request["driver"] == "reopen" {
            let _changing = worker.change();
            let reopened = host.with_service(|s| {
                s.close().unwrap();
                s.open_path(&root.join("synthetic-project")).unwrap()
            }).unwrap();
            println!("{}", json!({"sessionId":reopened.session_id}));
            io::stdout().flush().unwrap();
            continue;
        }
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
                            p.strip_prefix(base).unwrap().to_str().unwrap().replace('\\', "/"),
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
    if !retain {
        host.with_service(|s| rewrite_probe::cleanup(s)).unwrap().unwrap();
    }
    assert!(host.shutdown());
    drop(host);
    if !retain { std::fs::remove_dir_all(root).unwrap(); }
}
