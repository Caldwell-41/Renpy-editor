//! Pinned 8.5.3 hidden model renderer and bounded cooperative lifecycle.
use super::*;

pub(crate) const RENDERER: &str = if cfg!(windows) { "angle2" } else { "gl2" };

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasShutdown {
    pub cleanup_complete: bool,
    pub cooperative: bool,
    pub exit_code: Option<i32>,
}

fn record(anchor: &DirectoryAnchor, name: &str) -> Option<serde_json::Value> {
    let file = anchor.open_file(std::ffi::OsStr::new(name)).ok()?;
    serde_json::from_reader(file.take(4096)).ok()
}


pub(crate) struct HelperProcess {
    stop: Arc<AtomicBool>,
    observation: Arc<Mutex<Observation>>,
    worker: Option<thread::JoinHandle<()>>,
    report: Arc<Mutex<CanvasShutdown>>,
}
impl HelperProcess {
    pub(crate) fn start(sdk: ValidatedSdk, anchor: DirectoryAnchor) -> Result<Self, RenpyError> {
        sdk.revalidate(false)?;
        anchor
            .validate_chain()
            .map_err(|_| RenpyError::InvalidSdk)?;
        let args = [
            OsString::from("."),
            OsString::from("run"),
            OsString::from("--savedir"),
            OsString::from("game/saves"),
        ];
        #[cfg(unix)]
        let argv = anchored_launcher_args(&sdk.root, &args)?;
        #[cfg(windows)]
        let mut argv = launcher_args(
            &sdk.root,
            &[
                command_path(anchor.path()),
                args[1].clone(),
                args[2].clone(),
                command_path(&anchor.path().join("game/saves")),
            ],
        )?;
        #[cfg(windows)]
        {
            use std::io::Write;
            anchor.create_new_file(std::ffi::OsStr::new("canvas-owner.exe"))
                .and_then(|mut file| file.write_all(include_bytes!(concat!(env!("OUT_DIR"), "/canvas-owner.exe")))
                    .map_err(|_| crate::transaction::ErrorCode::IoFailure))
                .map_err(|_| RenpyError::ProcessFailed)?;
            argv.insert(0, command_path(&anchor.path().join("canvas-owner.exe")));
        }
        let mut command = Command::new(&argv[0]);
        apply_minimal_environment(&mut command);
        command
            .args(&argv[1..])
            .current_dir(anchor.path())
            .env("SDL_MAC_BACKGROUND_APP", "1")
            .env("RENPY_HIGHDPI", "1.0")
            .env("SDL_AUDIODRIVER", "dummy")
            .env("RENPY_RENDERER", RENDERER)
            .env("RENPY_DISABLE_SOUND", "1")
            .env("RENPY_DISABLE_BACKUPS", "I take responsibility for this.")
            .env("RENPY_SKIP_MAIN_MENU", "1")
            .env("RENPY_SKIP_SPLASHSCREEN", "1");
        #[cfg(test)]
        if std::env::var_os("LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT").as_deref() == anchor.path().parent().map(Path::as_os_str) {
            command.env("LOOMLIGHT_CANVAS_REFUSE", "1");
        }
        let observation = Arc::new(Mutex::new(Observation {
            phase: "starting",
            exit: None,
            bytes: vec![],
            truncated: false,
            cleaned: false,
            stale: None,
            ready: false,
            marker_tail: vec![],
            stages: vec![],
        }));
        let stop = Arc::new(AtomicBool::new(false));
        let worker_stop = stop.clone();
        let state = observation.clone();
        let report = Arc::new(Mutex::new(CanvasShutdown::default()));
        let worker_report = report.clone();
        let worker = thread::Builder::new()
            .name("loomlight-canvas".into())
            .spawn(move || {
                if worker_stop.load(Ordering::Acquire)
                    || sdk.revalidate(false).is_err()
                    || anchor.validate_chain().is_err()
                {
                    if let Ok(mut s) = state.lock() {
                        s.cleaned = true;
                    }
                    if let Ok(mut report) = worker_report.lock() { report.cleanup_complete = true; }
                    set_phase(&state, "failed");
                    return;
                }
                let Ok(mut child) = platform::OwnedChild::spawn(&mut command, Some(&anchor), true)
                else {
                    if let Ok(mut s) = state.lock() {
                        s.cleaned = true;
                    }
                    if let Ok(mut report) = worker_report.lock() { report.cleanup_complete = true; }
                    set_phase(&state, "failed");
                    return;
                };
                set_phase(&state, "running");
                while !worker_stop.load(Ordering::Acquire) {
                    if child.drain(&state).is_err() || child.exited().unwrap_or(true) {
                        break;
                    }
                    thread::sleep(Duration::from_millis(8));
                }
                let requested = worker_stop.load(Ordering::Acquire);
                let mut natural = None;
                if requested && anchor.create_new_file(std::ffi::OsStr::new("stop")).is_ok() {
                    let start = Instant::now();
                    while start.elapsed() < Duration::from_secs(3) {
                        if child.drain(&state).is_err() { break; }
                        if child.exited().unwrap_or(true) {
                            let acknowledged = record(&anchor, "stopped.json") == Some(serde_json::json!({"stopped": true}));
                            #[cfg(windows)]
                            let acknowledged = acknowledged && record(&anchor, "desktop-closed.json") == Some(serde_json::json!({"closed": true}));
                            if acknowledged {
                                natural = child.finish_without_force(&state).ok();
                            }
                            break;
                        }
                        thread::sleep(Duration::from_millis(8));
                    }
                }
                let cooperative = natural == Some(Some(0));
                let result = match natural {
                    Some(code) => Ok(code),
                    None => child.cleanup(CLEANUP_DEADLINE, &state),
                };
                let cleaned = result.is_ok();
                let exit_code = result.ok().flatten();
                if let Ok(mut report) = worker_report.lock() {
                    *report = CanvasShutdown { cleanup_complete: cleaned, cooperative, exit_code };
                }
                if let Ok(mut observation) = state.lock() {
                    observation.cleaned = cleaned;
                    observation.phase = if worker_stop.load(Ordering::Acquire) && cleaned {
                        "stopped"
                    } else {
                        "failed"
                    };
                }
            })
            .map_err(|_| RenpyError::ProcessFailed)?;
        Ok(Self {
            stop,
            observation,
            worker: Some(worker),
            report,
        })
    }
    pub(crate) fn failed(&self) -> bool {
        self.observation.lock().map_or(true, |s| {
            !matches!(s.phase, "starting" | "running") || s.truncated
        })
    }
    pub(crate) fn stop(&self) {
        self.stop.store(true, Ordering::Release);
    }
    pub(crate) fn shutdown_report(&self) -> CanvasShutdown {
        self.report.lock().map(|report| report.clone()).unwrap_or_default()
    }
    pub(crate) fn shutdown(&mut self) -> bool {
        self.stop();
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
        self.observation.lock().is_ok_and(|s| s.cleaned)
    }
}
impl Drop for HelperProcess {
    fn drop(&mut self) {
        self.shutdown();
    }
}
