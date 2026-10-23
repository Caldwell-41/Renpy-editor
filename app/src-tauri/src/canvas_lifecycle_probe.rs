//! Opt-in synthetic native lifecycle qualification. No arbitrary renderer paths.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService};
use serde_json::{json, Value};
use std::{
    fs,
    io::Write,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};

const OWNER: &str = "loomlight-canvas-lifecycle-v1\n";
const STAGES: [&str; 4] = ["refusal", "restart-change", "quit", "app-restart"];
struct Sequence {
    index: usize,
    announced: bool,
    frame: Option<String>,
    rows: Vec<Value>,
    armed: bool,
}
static SEQUENCE: Mutex<Option<Sequence>> = Mutex::new(None);

pub fn enabled() -> bool {
    std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").as_deref() == Ok("canvas-lifecycle")
}
fn root() -> Result<PathBuf, &'static str> {
    if !enabled() {
        return Err("Canvas lifecycle probe disabled");
    }
    let root = PathBuf::from(
        std::env::var_os("LOOMLIGHT_CANVAS_LIFECYCLE_ROOT").ok_or("Fixture root required")?,
    );
    let temp = std::env::temp_dir()
        .canonicalize()
        .map_err(|_| "Temporary root unavailable")?;
    if root.parent().and_then(|p| p.canonicalize().ok()).as_deref() != Some(temp.as_path())
        || root.is_symlink()
        || !root.file_name().is_some_and(|n| {
            n.to_string_lossy()
                .starts_with("loomlight-canvas-lifecycle-")
        })
        || fs::read_to_string(root.join(".owner")).ok().as_deref() != Some(OWNER)
    {
        return Err("Canvas lifecycle fixture refused");
    }
    root.canonicalize().map_err(|_| "Fixture root unavailable")
}
fn phase() -> Result<u8, &'static str> {
    match std::env::var("LOOMLIGHT_CANVAS_LIFECYCLE_PHASE").as_deref() {
        Ok("1") => Ok(1),
        Ok("2") => Ok(2),
        _ => Err("Lifecycle phase refused"),
    }
}
fn observation(stage: &str) -> Result<PathBuf, &'static str> {
    Ok(root()?.join("observations").join(stage))
}
fn write(path: PathBuf, value: &Value) -> Result<(), &'static str> {
    fs::write(
        path,
        serde_json::to_vec_pretty(value).map_err(|_| "Receipt encoding failed")?,
    )
    .map_err(|_| "Receipt write failed")
}
pub fn prepare() -> Result<LifecycleService, &'static str> {
    let root = root()?;
    let phase = phase()?;
    let mut service = if phase == 1 {
        if fs::read_dir(&root)
            .map_err(|_| "Fixture unavailable")?
            .count()
            != 1
        {
            return Err("Fresh lifecycle fixture required");
        }
        let archive = PathBuf::from(
            std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").ok_or("SDK archive required")?,
        );
        let service = LifecycleService::prepare_canvas_screen_probe(root.clone(), &archive)
            .map_err(|_| "Canvas fixture preparation failed")?;
        let other = root.join("other");
        LifecycleService::prepare_source_foundation_probe(other.clone())
            .map_err(|_| "Other project preparation failed")?;
        for relative in [
            "game/ui/help.rpy",
            "game/assets/canvas.ttf",
            "game/assets/help.png",
            "game/options.rpy",
        ] {
            let destination = other.join("synthetic-project").join(relative);
            fs::create_dir_all(destination.parent().unwrap())
                .map_err(|_| "Fixture directory failed")?;
            fs::copy(root.join("synthetic-project").join(relative), destination)
                .map_err(|_| "Fixture copy failed")?;
        }
        for stage in STAGES {
            fs::create_dir_all(observation(stage)?).map_err(|_| "Observation directory failed")?;
        }
        service
    } else {
        if !root.join("phase-1-exited.json").is_file() || root.join("phase-2.json").exists() {
            return Err("Completed first lifecycle phase required");
        }
        LifecycleService::new(root.clone()).map_err(|_| "Lifecycle reopen failed")?
    };
    let project = if phase == 1 {
        root.join("synthetic-project")
    } else {
        root.join("other/synthetic-project")
    };
    service
        .open_path(&project)
        .map_err(|_| "Fixture project open failed")?;
    *SEQUENCE.lock().map_err(|_| "Lifecycle state unavailable")? = Some(Sequence {
        index: if phase == 1 { 0 } else { 3 },
        announced: false,
        frame: None,
        rows: vec![],
        armed: false,
    });
    Ok(service)
}

pub fn step(host: &ApplicationHost, payload: Value) -> Result<Value, &'static str> {
    root()?;
    let mut lock = SEQUENCE.lock().map_err(|_| "Lifecycle state unavailable")?;
    let state = lock.as_mut().ok_or("Lifecycle not prepared")?;
    let stage = *STAGES
        .get(state.index)
        .ok_or("Lifecycle already finished")?;
    let directory = observation(stage)?;
    if payload.get("stage").and_then(Value::as_str) != Some(stage) || state.armed {
        return Err("Lifecycle step out of order");
    }
    match payload.get("action").and_then(Value::as_str) {
        Some("observe") if !state.announced && state.frame.is_none() => {
            if directory.join("observation.json.ready").exists() {
                return Err("Stale observer refused");
            }
            state.announced = true;
            println!(
                "{}",
                json!({"evidence":"canvas-lifecycle-observe","stage":stage})
            );
            let _ = std::io::stdout().flush();
            Ok(json!({}))
        }
        Some("observer") if state.announced => Ok(json!({
            "ready":directory.join("observation.json.ready").is_file(),
            "observed":directory.join("observation.json.observed").is_file()
        })),
        Some("render")
            if state.announced
                && state.frame.is_none()
                && directory.join("observation.json.ready").is_file() =>
        {
            // Scope the injected startup refusal to this owned profile and this one launch.
            if stage == "refusal" {
                std::env::set_var("LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT", root()?);
            }
            println!(
                "{}",
                json!({"evidence":"canvas-lifecycle-sdk-attempt","stage":stage})
            );
            let _ = std::io::stdout().flush();
            let result =
                host.with_service_until(Instant::now() + Duration::from_secs(5), |service| {
                    let document = service.screens_inspect(
                        serde_json::from_value(json!({"path":"game/ui/help.rpy"})).unwrap(),
                    )?;
                    service.screens_canvas_render(
                        serde_json::from_value(
                            json!({"path":"game/ui/help.rpy", "screenName":"loomlight_help",
                    "expectedRevision":document.revision, "width":1280, "height":720}),
                        )
                        .unwrap(),
                    )
                });
            std::env::remove_var("LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT");
            let value = result?.map_err(|_| "Canvas lifecycle render failed")?;
            state.frame = Some(
                value
                    .get("frameId")
                    .and_then(Value::as_str)
                    .ok_or("Canvas frame missing")?
                    .to_owned(),
            );
            Ok(value)
        }
        Some("status") if state.frame.is_some() => host
            .with_service(|service| {
                service.screens_canvas_status(state.frame.clone().unwrap(), false)
            })?
            .map_err(|_| "Canvas lifecycle status failed"),
        Some("transition")
            if state.frame.is_some() && directory.join("observation.json.observed").is_file() =>
        {
            if payload.get("domFocusRetained") != Some(&Value::Bool(true)) {
                return Err("Editor focus lost");
            }
            let status = host
                .with_service(|service| {
                    service.screens_canvas_status(state.frame.clone().unwrap(), false)
                })?
                .map_err(|_| "Final canvas status failed")?;
            let expected_phase = if stage == "refusal" {
                "unavailable"
            } else {
                "ready"
            };
            if status["phase"] != expected_phase {
                return Err("Canvas did not reach the required phase");
            }
            let refusal = if stage == "refusal" {
                let root = root()?;
                let mut receipts = fs::read_dir(root)
                    .map_err(|_| "Refusal receipt unavailable")?
                    .filter_map(Result::ok)
                    .filter(|e| {
                        e.file_name()
                            .to_string_lossy()
                            .starts_with("canvas-helper-")
                    })
                    .filter_map(|e| fs::read(e.path().join("startup-refusal.json")).ok());
                let bytes = receipts.next().ok_or("Selected refusal missing")?;
                if receipts.next().is_some() {
                    return Err("Multiple refusal receipts");
                }
                serde_json::from_slice(&bytes).map_err(|_| "Refusal receipt invalid")?
            } else {
                Value::Null
            };
            let report = if matches!(stage, "quit" | "app-restart") {
                Value::Null // The ordinary application-close flow must stop the live helper.
            } else {
                host.with_service(|service| {
                    if stage == "restart-change" {
                        service
                            .open_path(&root()?.join("other/synthetic-project"))
                            .map_err(|_| "Project change failed")?;
                    } else {
                        service.close().map_err(|_| "Project close failed")?;
                    }
                    let report = serde_json::to_value(service.canvas_shutdown_report())
                        .map_err(|_| "Shutdown receipt failed")?;
                    if stage == "refusal" {
                        service
                            .open_path(&root()?.join("synthetic-project"))
                            .map_err(|_| "Helper restart open failed")?;
                    }
                    Ok::<Value, &'static str>(report)
                })??
            };
            state.rows.push(json!({"stage":stage,"shutdown":report,"domFocusRetained":true,"refusal":refusal,"renderPhase":status["phase"],"renderer":status.get("renderer").cloned().unwrap_or(Value::Null)}));
            if matches!(stage, "quit" | "app-restart") {
                state.armed = true;
            } else {
                stop_observer(stage)?;
                state.index += 1;
                state.frame = None;
                state.announced = false;
            }
            Ok(json!({}))
        }
        _ => Err("Lifecycle action refused"),
    }
}
fn stop_observer(stage: &str) -> Result<(), &'static str> {
    let directory = observation(stage)?;
    fs::write(directory.join("stop"), b"stop").map_err(|_| "Observer stop failed")?;
    let started = Instant::now();
    while !directory.join("observation.json").is_file() {
        if started.elapsed() > Duration::from_secs(5) {
            return Err("Observer completion missing");
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    Ok(())
}
/// Observe the result of the ordinary renderer application-close flow, without closing it here.
pub fn project_closed(host: &ApplicationHost) -> Result<(), &'static str> {
    if !enabled() {
        return Ok(());
    }
    let mut lock = SEQUENCE.lock().map_err(|_| "Lifecycle state unavailable")?;
    let state = lock.as_mut().ok_or("Lifecycle not prepared")?;
    if !state.armed {
        return Err("Lifecycle quit not armed");
    }
    let report = host
        .with_service(|service| serde_json::to_value(service.canvas_shutdown_report()))?
        .map_err(|_| "Application close receipt unavailable")?;
    state.rows.last_mut().ok_or("Lifecycle row missing")?["shutdown"] = report;
    Ok(())
}
/// Called after the ordinary application-close command has shut down all owners.
pub fn closing() -> Result<(), &'static str> {
    if !enabled() {
        return Ok(());
    }
    let lock = SEQUENCE.lock().map_err(|_| "Lifecycle state unavailable")?;
    let state = lock.as_ref().ok_or("Lifecycle not prepared")?;
    if !state.armed {
        return Err("Lifecycle quit not armed");
    }
    stop_observer(STAGES[state.index])?;
    write(
        root()?.join(format!("phase-{}.json", phase()?)),
        &json!({"rows":state.rows}),
    )
}
pub fn exited() {
    if enabled() {
        if let (Ok(root), Ok(phase)) = (root(), phase()) {
            let _ = write(
                root.join(format!("phase-{phase}-exited.json")),
                &json!({"applicationExitEvent":true}),
            );
        }
    }
}
