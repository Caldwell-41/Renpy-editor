//! Disposable integration driver. Uses the production ApplicationHost and core protocol.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService};
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
fn main() {
    let root = std::env::temp_dir().join(format!(
        "loomlight-prompt-controller-{}",
        uuid::Uuid::new_v4()
    ));
    let mut service = LifecycleService::prepare_source_foundation_probe(root.clone()).unwrap();
    let p = service.open_path(&root.join("synthetic-project")).unwrap();
    let host = ApplicationHost::new(service);
    println!("{}", json!({"sessionId":p.session_id}));
    io::stdout().flush().unwrap();
    let mut held = None;
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        // Deterministic ordinary service contention, never a production IPC operation.
        if request["driver"] == "hold" {
            assert!(held.is_none());
            let (ready_tx, ready_rx) = std::sync::mpsc::channel();
            let (release_tx, release_rx) = std::sync::mpsc::channel();
            let owner = host.clone();
            let thread = std::thread::spawn(move || {
                owner
                    .with_service(|_| {
                        ready_tx.send(()).unwrap();
                        release_rx.recv().unwrap();
                    })
                    .unwrap();
            });
            ready_rx.recv().unwrap();
            held = Some((release_tx, thread));
            println!("{}", json!({"driver":"held"}));
            io::stdout().flush().unwrap();
            continue;
        }
        if request["driver"] == "release" {
            let (release, thread) = held.take().unwrap();
            release.send(()).unwrap();
            thread.join().unwrap();
            println!("{}", json!({"driver":"released"}));
            io::stdout().flush().unwrap();
            continue;
        }
        let response = host.dispatch(request, false);
        println!("{}", serde_json::to_string(&response).unwrap());
        io::stdout().flush().unwrap();
    }
    if let Some((release, thread)) = held {
        release.send(()).unwrap();
        thread.join().unwrap();
    }
    assert!(host.shutdown());
    std::fs::remove_dir_all(root).unwrap();
}
