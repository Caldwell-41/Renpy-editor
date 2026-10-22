//! Disposable public Help fixture. JSON lines reach the production dispatch boundary.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService};
use serde_json::{json, Value};
use std::{io::{self, BufRead, Write}, path::PathBuf, fs};
fn emit(value: Value) { println!("{value}"); io::stdout().flush().unwrap(); }
fn main() {
    let root = PathBuf::from(std::env::args().nth(1).expect("owned temporary root"));
    assert!(root.is_absolute() && root.file_name().unwrap().to_str().unwrap().starts_with("loomlight-help-controller-"));
    assert!(!root.exists());
    let mut service = LifecycleService::prepare_source_foundation_probe(root.clone()).unwrap();
    let game = root.join("synthetic-project");
    fs::create_dir(game.join("game/ui")).unwrap();
    fs::write(game.join("game/ui/a_styles.rpy"), "style help_label:\n    color \"#ffffff\"\n").unwrap();
    fs::write(game.join("game/ui/z_compare.rpy"), "screen flow_help():\n    frame:\n        xsize 720\n        ysize 360\n        xalign 0.5\n        yalign 0.5\n        text \"Your next stop\"\n").unwrap();
    fs::write(game.join("game/ui/help.rpy"), format!("\u{feff}{}", include_str!("../../../tests/fixtures/phase-3b-screens/help.rpy").replace('\n', "\r\n"))).unwrap();
    fs::write(game.join("game/help.png"), include_bytes!("../../../tests/fixtures/phase-1h/assets/booth.png")).unwrap();
    service.close().unwrap();
    let host = ApplicationHost::new(service);
    emit(json!({"ready":true}));
    let mut hold: Option<(std::sync::mpsc::Sender<()>, std::thread::JoinHandle<()>)> = None;
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        if request["driver"] == "hold" {
            assert!(hold.is_none());
            let (ready_tx, ready_rx) = std::sync::mpsc::channel();
            let (release_tx, release_rx) = std::sync::mpsc::channel();
            let owner = host.clone();
            let worker = std::thread::spawn(move || owner.with_service(|_| {
                ready_tx.send(()).unwrap(); release_rx.recv().unwrap();
            }).unwrap());
            ready_rx.recv().unwrap(); hold = Some((release_tx, worker)); emit(json!({"held":true})); continue;
        }
        if request["driver"] == "release" {
            let (release, worker) = hold.take().unwrap(); release.send(()).unwrap(); worker.join().unwrap();
            emit(json!({"released":true})); continue;
        }
        if request["driver"] == "snapshot" {
            emit(json!({"source": fs::read(game.join("game/ui/help.rpy")).unwrap()})); continue;
        }
        if request["driver"] == "externalAppend" {
            use std::io::Write;
            fs::OpenOptions::new().append(true).open(game.join("game/ui/help.rpy")).unwrap().write_all(b"# ordinary external writer\r\n").unwrap();
            emit(json!({"changed":true})); continue;
        }
        let op = request["operation"].as_str().unwrap();
        assert!(matches!(op, "system.health"|"system.version"|"preferences.read"|"preferences.write"|
            "project.listRecent"|"project.openRecent"|"project.current"|"project.close"|"project.status"|"project.flush"|
            "scene.list"|"scene.apply"|"source.list"|"source.open"|"source.updateDraft"|"source.save"|"source.discard"|
            "source.saveAll"|"source.discardAll"|"authoring.list"|"flow.list"|"screens.inspect"|"screens.setSize"|"screens.list"|"screens.create"));
        emit(serde_json::to_value(host.dispatch(request, false)).unwrap());
    }
    assert!(host.shutdown());
    drop(host);
    fs::remove_dir_all(root).unwrap();
}
