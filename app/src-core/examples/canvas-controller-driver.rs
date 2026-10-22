//! Public disposable fixture; every app request reaches production dispatch.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService};
use serde_json::{json, Value};
use std::{
    fs,
    io::{self, BufRead, Write},
    path::PathBuf,
};
fn main() {
    let root = PathBuf::from(std::env::args().nth(1).expect("fresh owned temporary root"));
    assert!(
        root.is_absolute()
            && root
                .file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with("loomlight-canvas-controller-")
            && !root.exists()
    );
    let archive =
        PathBuf::from(std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").expect("pinned archive"));
    let service = LifecycleService::prepare_canvas_screen_probe(root.clone(), &archive).unwrap();
    let host = ApplicationHost::new(service);
    println!("{}", json!({"ready":true}));
    io::stdout().flush().unwrap();
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        println!(
            "{}",
            serde_json::to_value(host.dispatch(request, false)).unwrap()
        );
        io::stdout().flush().unwrap();
    }
    if let Some(output) = std::env::var_os("LOOMLIGHT_CANVAS_EVIDENCE") {
        let output = PathBuf::from(output);
        fs::create_dir_all(&output).unwrap();
        for entry in root.read_dir().unwrap().flatten().filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("canvas-helper-")
        }) {
            for name in ["log.txt", "traceback.txt"] {
                let source = entry.path().join(name);
                if source.is_file() {
                    fs::copy(source, output.join(format!("helper-{name}"))).unwrap();
                }
            }
        }
    }
    assert!(host.shutdown());
    drop(host);
    fs::remove_dir_all(root).unwrap();
}
