//! Pinned 8.5.3 headless adapter. Reuse the runtime's owned process-tree cleanup.
use super::*;

pub(crate) struct HelperProcess {
    stop: Arc<AtomicBool>,
    observation: Arc<Mutex<Observation>>,
    worker: Option<thread::JoinHandle<()>>,
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
        let argv = launcher_args(
            &sdk.root,
            &[
                command_path(anchor.path()),
                args[1].clone(),
                args[2].clone(),
                command_path(&anchor.path().join("game/saves")),
            ],
        )?;
        let mut command = Command::new(&argv[0]);
        apply_minimal_environment(&mut command);
        command
            .args(&argv[1..])
            .current_dir(anchor.path())
            .env("SDL_VIDEODRIVER", "dummy")
            .env("SDL_AUDIODRIVER", "dummy")
            .env("RENPY_RENDERER", "sw")
            .env("RENPY_DISABLE_SOUND", "1")
            .env("RENPY_DISABLE_BACKUPS", "I take responsibility for this.")
            .env("RENPY_SKIP_MAIN_MENU", "1")
            .env("RENPY_SKIP_SPLASHSCREEN", "1");
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
                    set_phase(&state, "failed");
                    return;
                }
                let Ok(mut child) = platform::OwnedChild::spawn(&mut command, Some(&anchor), true)
                else {
                    if let Ok(mut s) = state.lock() {
                        s.cleaned = true;
                    }
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
                let cleaned = child.cleanup(CLEANUP_DEADLINE, &state).is_ok();
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
