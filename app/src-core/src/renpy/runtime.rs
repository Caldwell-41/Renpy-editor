//! Core-owned long-lived process supervision. No renderer paths or argv enter here.
//! Unlike creation smoke checks, play has no deadline and pipe reads never block.
use super::*;
use crate::transaction::{DirectoryAnchor, ExecutionGate};
use serde::Deserialize;
use std::process::{ChildStderr, ChildStdout};

mod platform;

const READY_MARKER: &[u8] = b"LOOMLIGHT_RUNTIME_READY_V1";
const RETAINED_OUTPUT: usize = 2 * 1024 * 1024;
const PAGE_BYTES: usize = 32 * 1024;
const VALIDATION_DEADLINE: Duration = Duration::from_secs(180);
const GRACE: Duration = Duration::from_secs(1);
const CLEANUP_DEADLINE: Duration = Duration::from_secs(5);

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeKind {
    Run,
    Validate,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub operation_id: String,
    pub phase: String,
    pub exit_code: Option<i32>,
    pub output: String,
    pub next_sequence: usize,
    pub output_truncated: bool,
    pub earlier_revision: bool,
    pub cleanup_complete: bool,
    pub launch_revision: Option<String>,
    pub revision_stale: Option<bool>,
}

struct Observation {
    phase: &'static str,
    exit: Option<i32>,
    bytes: Vec<u8>,
    truncated: bool,
    cleaned: bool,
    stale: Option<bool>,
    ready: bool,
    marker_tail: Vec<u8>,
}

pub(crate) struct RuntimeProcess {
    pub(crate) id: String,
    launch_revision: Option<String>,
    gate: Arc<ExecutionGate>,
    cancel: Arc<AtomicBool>,
    observation: Arc<Mutex<Observation>>,
    worker: Option<thread::JoinHandle<()>>,
}

impl RuntimeProcess {
    pub(crate) fn start(
        sdk: ValidatedSdk,
        anchor: DirectoryAnchor,
        kind: RuntimeKind,
        gate: Arc<ExecutionGate>,
        manifest: crate::transaction::ExecutionManifest,
    ) -> Result<Self, RenpyError> {
        sdk.revalidate(false)?;
        anchor
            .validate_chain()
            .map_err(|_| RenpyError::InvalidSdk)?;
        let args = match kind {
            RuntimeKind::Run => vec![vec![OsString::from("run")]],
            RuntimeKind::Validate => vec![
                vec![OsString::from("compile")],
                vec![OsString::from("lint"), OsString::from("--error-code")],
            ],
        };
        let commands = args
            .into_iter()
            .map(|args| {
                #[cfg(unix)]
                let project = OsString::from(".");
                #[cfg(windows)]
                let project = command_path(anchor.path());
                let mut argv = vec![project];
                argv.extend(args);
                #[cfg(unix)]
                let saves = OsString::from("game/saves");
                #[cfg(windows)]
                let saves = command_path(&anchor.path().join("game/saves"));
                argv.extend([OsString::from("--savedir"), saves]);
                #[cfg(unix)]
                let argv = anchored_launcher_args(&sdk.root, &argv)?;
                #[cfg(windows)]
                let argv = launcher_args(&sdk.root, &argv)?;
                let mut command = Command::new(&argv[0]);
                apply_minimal_environment(&mut command);
                command.args(&argv[1..]).current_dir(anchor.path());
                #[cfg(test)]
                {
                    command
                        .env("RENPY_SKIP_MAIN_MENU", "1")
                        .env("RENPY_DISABLE_SOUND", "1");
                    if std::env::var("LOOMLIGHT_RUNTIME_TEST_HEADLESS").as_deref() == Ok("1") {
                        command
                            .env("SDL_VIDEODRIVER", "dummy")
                            .env("SDL_AUDIODRIVER", "dummy")
                            .env("RENPY_RENDERER", "sw");
                    }
                }
                // Only the exact reviewed project helper uses this; it is not an SDK flag.
                if kind == RuntimeKind::Run {
                    command.env("LOOMLIGHT_CONTROLLED_PLAY", "1");
                }
                Ok(command)
            })
            .collect::<Result<Vec<_>, RenpyError>>()?;
        Self::spawn_commands(
            commands,
            Some((sdk, anchor, manifest)),
            kind,
            gate,
            VALIDATION_DEADLINE,
        )
    }

    fn spawn_commands(
        commands: Vec<Command>,
        context: Option<(
            ValidatedSdk,
            DirectoryAnchor,
            crate::transaction::ExecutionManifest,
        )>,
        kind: RuntimeKind,
        gate: Arc<ExecutionGate>,
        validation_deadline: Duration,
    ) -> Result<Self, RenpyError> {
        let launch_revision = context.as_ref().map(|(_, _, manifest)| {
            format!(
                "{:x}",
                Sha256::digest(serde_json::to_vec(manifest).unwrap_or_default())
            )
        });
        let readiness_required = context.is_some() && kind == RuntimeKind::Run;
        gate.begin(kind == RuntimeKind::Run && !readiness_required)
            .map_err(|_| RenpyError::ProcessFailed)?;
        let cancel = Arc::new(AtomicBool::new(false));
        let observation = Arc::new(Mutex::new(Observation {
            phase: "starting",
            exit: None,
            bytes: vec![],
            truncated: false,
            cleaned: false,
            stale: None,
            ready: false,
            marker_tail: vec![],
        }));
        let worker_cancel = cancel.clone();
        let worker_observation = observation.clone();
        let worker_gate = gate.clone();
        let worker = thread::Builder::new()
            .name("loomlight-runtime".into())
            .spawn(move || {
                let started = Instant::now();
                let mut outcome = "exited";
                let mut cleanup_ok = true;
                for mut command in commands {
                    if worker_cancel.load(Ordering::Acquire) {
                        outcome = "cancelled";
                        break;
                    }
                    if context.as_ref().is_some_and(|(sdk, anchor, _)| {
                        sdk.revalidate(false).is_err() || anchor.validate_chain().is_err()
                    }) {
                        outcome = "identityChanged";
                        break;
                    }
                    let anchor = context.as_ref().map(|(_, anchor, _)| anchor);
                    let mut child = match platform::OwnedChild::spawn(&mut command, anchor) {
                        Ok(value) => value,
                        Err(_) => {
                            outcome = "spawnFailed";
                            break;
                        }
                    };
                    set_phase(
                        &worker_observation,
                        if kind == RuntimeKind::Run {
                            if readiness_required {
                                "starting"
                            } else {
                                "running"
                            }
                        } else {
                            "validating"
                        },
                    );
                    let mut stop_started = None;
                    let mut ready = !readiness_required;
                    loop {
                        if child.drain(&worker_observation).is_err() {
                            outcome = "outputFailed";
                            break;
                        }
                        if !ready && worker_observation.lock().is_ok_and(|state| state.ready) {
                            ready = true;
                            worker_gate.playing();
                            set_phase(&worker_observation, "running");
                        }
                        match child.exited() {
                            Ok(true) => break,
                            Err(_) => {
                                outcome = "processFailed";
                                break;
                            }
                            Ok(false) => {}
                        }
                        let cancelled = worker_cancel.load(Ordering::Acquire);
                        let timed_out = (kind == RuntimeKind::Validate || !ready)
                            && started.elapsed() >= validation_deadline;
                        if (cancelled || timed_out) && stop_started.is_none() {
                            worker_gate.stopping();
                            set_phase(&worker_observation, "stopping");
                            outcome = if cancelled { "cancelled" } else { "timedOut" };
                            child.graceful();
                            stop_started = Some(Instant::now());
                        }
                        if stop_started.is_some_and(|time: Instant| time.elapsed() >= GRACE) {
                            break;
                        }
                        thread::sleep(Duration::from_millis(10));
                    }
                    worker_gate.stopping();
                    match child.cleanup(CLEANUP_DEADLINE, &worker_observation) {
                        Ok(exit) => {
                            if let Ok(mut state) = worker_observation.lock() {
                                state.exit = exit;
                            }
                            if outcome != "exited" || exit != Some(0) {
                                if outcome == "exited" {
                                    outcome = "failed";
                                }
                                break;
                            }
                        }
                        Err(_) => {
                            outcome = "cleanupFailed";
                            cleanup_ok = false;
                            break;
                        }
                    }
                    // Validation proceeds to lint only after successful compilation.
                }
                let stale = context.as_ref().map(|(_, anchor, manifest)| {
                    crate::transaction::execution_manifest(anchor, true)
                        .map_or(true, |current| current != *manifest)
                });
                if let Ok(mut state) = worker_observation.lock() {
                    state.stale = stale;
                    state.phase = outcome;
                    state.cleaned = cleanup_ok;
                }
                if cleanup_ok {
                    worker_gate.finish();
                }
            })
            .map_err(|_| {
                gate.finish();
                RenpyError::ProcessFailed
            })?;
        Ok(Self {
            id: uuid::Uuid::new_v4().to_string(),
            launch_revision,
            gate,
            cancel,
            observation,
            worker: Some(worker),
        })
    }

    pub(crate) fn stop(&self) {
        self.cancel.store(true, Ordering::Release);
        self.gate.stopping();
    }
    pub(crate) fn active(&self) -> bool {
        self.gate.active()
    }
    pub(crate) fn status(&self, after: usize) -> Result<RuntimeStatus, RenpyError> {
        let state = self
            .observation
            .lock()
            .map_err(|_| RenpyError::ProcessFailed)?;
        if after > state.bytes.len() {
            return Err(RenpyError::ProcessFailed);
        }
        let end = (after + PAGE_BYTES).min(state.bytes.len());
        Ok(RuntimeStatus {
            operation_id: self.id.clone(),
            phase: state.phase.into(),
            exit_code: state.exit,
            output: String::from_utf8_lossy(&state.bytes[after..end]).into_owned(),
            next_sequence: end,
            output_truncated: state.truncated,
            earlier_revision: self.gate.generation.load(Ordering::Acquire) > 0,
            cleanup_complete: state.cleaned,
            launch_revision: self.launch_revision.clone(),
            revision_stale: state.stale,
        })
    }
}

impl Drop for RuntimeProcess {
    fn drop(&mut self) {
        self.stop();
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

fn set_phase(observation: &Mutex<Observation>, phase: &'static str) {
    if let Ok(mut state) = observation.lock() {
        state.phase = phase;
    }
}
fn retain(observation: &Mutex<Observation>, bytes: &[u8]) -> io::Result<()> {
    let mut state = observation
        .lock()
        .map_err(|_| io::Error::other("runtime state"))?;
    if !state.ready {
        let mut window = std::mem::take(&mut state.marker_tail);
        window.extend_from_slice(bytes);
        state.ready = window
            .windows(READY_MARKER.len())
            .any(|part| part == READY_MARKER);
        if !state.ready {
            state.marker_tail =
                window[window.len().saturating_sub(READY_MARKER.len() - 1)..].to_vec();
        }
    }
    let keep = bytes
        .len()
        .min(RETAINED_OUTPUT.saturating_sub(state.bytes.len()));
    state.bytes.extend_from_slice(&bytes[..keep]);
    state.truncated |= keep < bytes.len();
    Ok(())
}

#[cfg(test)]
mod tests;
