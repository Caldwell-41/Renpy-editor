//! Desktop request ownership. The service is checked out, never locked across I/O.
//! Token-bound controls use a separate, short state lock even during authoring work.
use crate::{
    handle_application_request, lifecycle::LifecycleService, validate_request, CoreResponse,
};
use serde_json::{json, Value};
use std::sync::{Arc, Condvar, Mutex};

/// Why `ApplicationHost` did not run a task, or why the task ended without a result.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CheckoutError {
    /// Another request holds the service. The task never ran, so it may be sent again.
    Overlap,
    /// The host is shutting down. The task never ran and never will.
    ShuttingDown,
    /// The state lock is poisoned, before or after the task.
    Unavailable,
    /// The task panicked, possibly after it wrote.
    Failed,
    /// `with_service_until` reached its deadline before the service returned.
    Deadline,
}
impl CheckoutError {
    pub fn message(self) -> &'static str {
        match self {
            Self::Overlap => "Another request is in progress.",
            Self::ShuttingDown => "Service shutting down.",
            Self::Unavailable => "Service unavailable.",
            Self::Failed => "Request failed.",
            Self::Deadline => "Service publication deadline reached.",
        }
    }
    /// `busy` for an overlap, which the caller may retry; this error's own message otherwise.
    pub fn busy_or(self, busy: &'static str) -> &'static str {
        if self == Self::Overlap {
            busy
        } else {
            self.message()
        }
    }
}
impl From<CheckoutError> for &'static str {
    fn from(error: CheckoutError) -> Self {
        error.message()
    }
}
/// How long a native dialog's completion waits for the service. The author has already
/// chosen, so the host waits instead of refusing; the app never sends the request again.
const DIALOG_COMPLETION_WAIT: std::time::Duration = std::time::Duration::from_secs(10);

#[derive(Clone)]
pub struct ApplicationHost(Arc<Shared>);
struct Shared {
    state: Mutex<State>,
    returned: Condvar,
}
struct State {
    service: Option<LifecycleService>,
    session: Option<String>,
    control: Option<crate::renpy::runtime::RuntimeControl>,
    request: Option<Pending>,
    closing: bool,
    trust: Option<String>,
    revoked_session: Option<String>,
    #[cfg(test)]
    work_hook: Option<Arc<dyn Fn() + Send + Sync>>,
}
struct Pending {
    token: String,
    session: String,
    cancel: Arc<crate::runtime_work::Cancellation>,
    result: Option<Value>,
}
impl ApplicationHost {
    pub fn new(service: LifecycleService) -> Self {
        let session = service.current().map(|p| p.session_id);
        let control = service.runtime_control();
        let trust = service.runtime_trust_id();
        Self(Arc::new(Shared {
            state: Mutex::new(State {
                service: Some(service),
                session,
                control,
                request: None,
                closing: false,
                trust,
                revoked_session: None,
                #[cfg(test)]
                work_hook: None,
            }),
            returned: Condvar::new(),
        }))
    }
    /// Background publication may wait for an ordinary checkout to return. Busy
    /// is distinct from changed state; no task runs after the supplied deadline.
    pub fn with_service_until<T>(
        &self,
        deadline: std::time::Instant,
        task: impl FnOnce(&mut LifecycleService) -> T,
    ) -> Result<T, CheckoutError> {
        let mut task = Some(task);
        loop {
            if std::time::Instant::now() >= deadline {
                return Err(CheckoutError::Deadline);
            }
            match self.with_service(|service| (task.take().unwrap())(service)) {
                Ok(value) => return Ok(value),
                Err(CheckoutError::Overlap) => {
                    let state = self
                        .0
                        .state
                        .lock()
                        .map_err(|_| CheckoutError::Unavailable)?;
                    if state.closing {
                        return Err(CheckoutError::ShuttingDown);
                    }
                    if state.service.is_none() {
                        let _ = self
                            .0
                            .returned
                            .wait_timeout(
                                state,
                                deadline.saturating_duration_since(std::time::Instant::now()),
                            )
                            .map_err(|_| CheckoutError::Unavailable)?;
                    }
                }
                Err(error) => return Err(error),
            }
        }
    }
    /// Checkout serializes mutations without making the control path wait for I/O.
    pub fn with_service<T>(
        &self,
        task: impl FnOnce(&mut LifecycleService) -> T,
    ) -> Result<T, CheckoutError> {
        let mut service = {
            let mut state = self
                .0
                .state
                .lock()
                .map_err(|_| CheckoutError::Unavailable)?;
            if state.closing {
                return Err(CheckoutError::ShuttingDown);
            }
            state.service.take().ok_or(CheckoutError::Overlap)?
        };
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| task(&mut service)));
        let mut state = self
            .0
            .state
            .lock()
            .map_err(|_| CheckoutError::Unavailable)?;
        if state
            .revoked_session
            .take()
            .is_some_and(|s| service.current().is_some_and(|p| p.session_id == s))
        {
            service.runtime_abort_request();
        }
        state.session = service.current().map(|p| p.session_id);
        state.trust = service.runtime_trust_id();
        state.control = service.runtime_control();
        state.service = Some(service);
        self.0.returned.notify_all();
        drop(state);
        result.map_err(|_| CheckoutError::Failed)
    }
    /// A native dialog captures its session before showing UI and completes here. The
    /// dialog has already closed, so a completion that overlaps another request waits for
    /// the service with the author's choice instead of refusing. Its response is never
    /// REQUEST_OVERLAP, because sending the request again would open the dialog again.
    pub fn complete_dialog(
        &self,
        request_id: String,
        expected: Option<String>,
        task: impl FnOnce(&mut LifecycleService) -> CoreResponse,
    ) -> CoreResponse {
        self.complete_dialog_within(DIALOG_COMPLETION_WAIT, request_id, expected, task)
    }
    fn complete_dialog_within(
        &self,
        wait: std::time::Duration,
        request_id: String,
        expected: Option<String>,
        task: impl FnOnce(&mut LifecycleService) -> CoreResponse,
    ) -> CoreResponse {
        let id = request_id.clone();
        let completed = self.with_service_until(std::time::Instant::now() + wait, |service| {
            if service.current().map(|p| p.session_id) != expected {
                return CoreResponse::failure(
                    request_id,
                    "STALE_PROJECT_SESSION",
                    "The project session changed while the dialog was open.",
                );
            }
            task(service)
        });
        match completed {
            Ok(response) => response,
            Err(CheckoutError::Deadline) => CoreResponse::failure(
                id,
                "INTERNAL_ERROR",
                "Another request kept the project busy, so this choice was not applied. Choose again.",
            ),
            Err(error) => checkout_failure(id, error),
        }
    }
    pub fn dispatch(&self, request: Value, smoke: bool) -> CoreResponse {
        let validated = match validate_request(&request) {
            Ok(v) => v,
            Err(r) => return r,
        };
        let id = validated.request_id.clone();
        let op = validated.operation;
        let payload = validated.payload;
        if matches!(
            op,
            "runtime.requestStatus"
                | "runtime.cancelRequest"
                | "runtime.stop"
                | "runtime.status"
                | "runtime.diagnostics"
                | "runtime.revokeTrust"
        ) {
            let mut state = self.0.state.lock().unwrap();
            if payload.get("sessionId").and_then(Value::as_str) != state.session.as_deref()
                || state.session.is_none()
            {
                return CoreResponse::failure(
                    id,
                    "STALE_PROJECT_SESSION",
                    "The project session changed.",
                );
            }
            if op == "runtime.diagnostics" {
                if payload.len() != 2 || !payload.get("operationId").is_some_and(Value::is_string) {
                    return invalid(id);
                }
                let Some(control) = state
                    .control
                    .clone()
                    .filter(|c| payload["operationId"].as_str() == Some(c.id.as_str()))
                else {
                    return stale(id);
                };
                let session = state.session.clone().unwrap();
                drop(state); // Parse bounded retained output without checking out the authoring service.
                return CoreResponse::success(
                    id,
                    json!({"diagnostics":control.diagnostics(&session),"limit":256}),
                );
            }
            if op == "runtime.revokeTrust" {
                if payload.len() != 2 || !payload.get("trustId").is_some_and(Value::is_string) {
                    return invalid(id);
                }
                if state.trust.is_none() || payload["trustId"].as_str() != state.trust.as_deref() {
                    return stale(id);
                }
                state.trust = None;
                if let Some(pending) = state.request.as_ref().filter(|p| p.result.is_none()) {
                    pending.cancel.cancel();
                }
                if let Some(control) = &state.control {
                    control.stop();
                }
                if let Some(service) = state.service.as_mut() {
                    service.runtime_abort_request();
                } else {
                    state.revoked_session = state.session.clone();
                }
                return CoreResponse::success(id, json!({"revoked": true, "cleanupPending": true}));
            }
            if matches!(op, "runtime.requestStatus" | "runtime.cancelRequest") {
                if payload.len() != 2 || !payload.get("requestToken").is_some_and(Value::is_string)
                {
                    return invalid(id);
                }
                let Some(pending) = state.request.as_mut().filter(|p| {
                    Some(p.token.as_str()) == payload["requestToken"].as_str()
                        && Some(p.session.as_str()) == payload["sessionId"].as_str()
                }) else {
                    return stale(id);
                };
                if op == "runtime.cancelRequest" {
                    pending.cancel.cancel();
                    if pending.result.is_some() {
                        // Cancel can race the completion response. The same receipt
                        // still owns its result; newer requests replace this token.
                        if let Some(control) = &state.control {
                            control.stop();
                        }
                        if let Some(service) = state.service.as_mut() {
                            service.runtime_abort_request();
                        } else {
                            state.revoked_session = state.session.clone();
                        }
                        state.trust = None;
                        state.request.as_mut().unwrap().result = Some(
                            serde_json::to_value(CoreResponse::failure(
                                id.clone(),
                                "RUNTIME_CANCELLED",
                                "Runtime request cancelled.",
                            ))
                            .unwrap(),
                        );
                    }
                    return CoreResponse::success(
                        id,
                        json!({"cancelled": true, "cleanupPending": true}),
                    );
                }
                return CoreResponse::success(
                    id,
                    json!({"pending": pending.result.is_none(), "response": pending.result}),
                );
            }
            let status = op == "runtime.status";
            if payload.len() != if status { 3 } else { 2 }
                || !payload.get("operationId").is_some_and(Value::is_string)
            {
                return invalid(id);
            }
            let after = if status {
                match payload
                    .get("afterSequence")
                    .and_then(Value::as_u64)
                    .and_then(|n| usize::try_from(n).ok())
                {
                    Some(n) => n,
                    None => return invalid(id),
                }
            } else {
                0
            };
            let Some(control) = state
                .control
                .as_ref()
                .filter(|p| Some(p.id.as_str()) == payload["operationId"].as_str())
            else {
                return stale(id);
            };
            if !status {
                control.stop();
            }
            return match control.status(after) {
                Ok(value) => CoreResponse::success(id, serde_json::to_value(value).unwrap()),
                Err(_) => invalid(id),
            };
        }
        if matches!(
            op,
            "runtime.prepare" | "runtime.grantTrust" | "runtime.start"
        ) {
            let mut state = self.0.state.lock().unwrap();
            if state.closing {
                return checkout_failure(id, CheckoutError::ShuttingDown);
            }
            let Some(session) = payload
                .get("sessionId")
                .and_then(Value::as_str)
                .filter(|s| Some(*s) == state.session.as_deref())
                .map(str::to_owned)
            else {
                return CoreResponse::failure(
                    id,
                    "STALE_PROJECT_SESSION",
                    "The project session changed.",
                );
            };
            // A runtime request still running is a runtime refusal, which lasts as long
            // as that work does. Any other holder is an ordinary overlap.
            if state.request.as_ref().is_some_and(|p| p.result.is_none()) {
                return CoreResponse::failure(
                    id,
                    "RUNTIME_BUSY",
                    "Another runtime request is in progress.",
                );
            }
            if state.service.is_none() {
                return checkout_failure(id, CheckoutError::Overlap);
            }
            if let Err(error) = state
                .service
                .as_ref()
                .unwrap()
                .runtime_request_capability(op, payload)
            {
                return crate::lifecycle_failure(id, error);
            }
            let mut service = state.service.take().unwrap();
            let token = uuid::Uuid::new_v4().to_string();
            let cancel = Arc::new(crate::runtime_work::Cancellation::default());
            state.request = Some(Pending {
                token: token.clone(),
                session,
                cancel: cancel.clone(),
                result: None,
            });
            let shared = self.0.clone();
            let response_id = id.clone();
            #[cfg(test)]
            let work_hook = state.work_hook.take();
            // One bounded result slot and one worker. No unbounded request queue.
            // Spawn while holding only the short publication lock; worker owns service.
            std::thread::spawn(move || {
                #[cfg(test)]
                crate::runtime_work::set_inventory_hook(work_hook);
                let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    crate::runtime_work::scoped(cancel.clone(), || {
                        handle_application_request(request, smoke, &mut service)
                    })
                }));
                let mut state = shared.state.lock().unwrap();
                // Publication and cancellation linearize at this short lock. A cancelled
                // completion can neither expose a grant nor attach a later session.
                let response = if cancel.cancelled() || state.closing || result.is_err() {
                    service.runtime_abort_request();
                    CoreResponse::failure(
                        response_id,
                        "RUNTIME_CANCELLED",
                        "Runtime request cancelled.",
                    )
                } else {
                    result.unwrap()
                };
                if state
                    .revoked_session
                    .take()
                    .is_some_and(|s| service.current().is_some_and(|p| p.session_id == s))
                {
                    service.runtime_abort_request();
                }
                state.session = service.current().map(|p| p.session_id);
                state.trust = service.runtime_trust_id();
                state.control = service.runtime_control();
                state.request.as_mut().unwrap().result =
                    Some(serde_json::to_value(response).unwrap());
                state.service = Some(service);
                shared.returned.notify_all();
            });
            return CoreResponse::success(id, json!({"pending": true, "requestToken": token}));
        }
        self.with_service(|service| handle_application_request(request, smoke, service))
            .unwrap_or_else(|error| checkout_failure(id, error))
    }
    #[cfg(test)]
    pub(crate) fn request_spawns(&self) -> usize {
        self.0
            .state
            .lock()
            .unwrap()
            .request
            .as_ref()
            .unwrap()
            .cancel
            .spawn_count()
    }
    #[cfg(test)]
    pub(crate) fn hold_inventory(&self, hook: Arc<dyn Fn() + Send + Sync>) {
        self.0.state.lock().unwrap().work_hook = Some(hook);
    }
    pub fn shutdown(&self) -> bool {
        let mut state = self.0.state.lock().unwrap();
        state.closing = true;
        if let Some(pending) = &state.request {
            pending.cancel.cancel();
        }
        if let Some(control) = &state.control {
            control.stop();
        }
        while state.service.is_none() {
            state = self.0.returned.wait(state).unwrap();
        }
        let mut service = state.service.take().unwrap();
        drop(state);
        let cleaned = service.runtime_shutdown();
        let mut state = self.0.state.lock().unwrap();
        state.control = None;
        state.service = Some(service);
        cleaned
    }
}
fn invalid(id: String) -> CoreResponse {
    CoreResponse::failure(
        id,
        "INVALID_PAYLOAD",
        "Payload does not match the operation schema.",
    )
}
fn stale(id: String) -> CoreResponse {
    CoreResponse::failure(
        id,
        "STALE_RUNTIME",
        "Runtime operation is no longer current.",
    )
}
/// `REQUEST_OVERLAP` means no handler ran, so the app may send the request again. Every
/// other checkout failure is `INTERNAL_ERROR`, which the app never retries. A panic or a
/// lock poisoned after the handler may follow a write, and a retry cannot outlast
/// shutdown or a poisoned lock. `RUNTIME_BUSY` is a handler's refusal while Ren'Py runs.
pub fn checkout_failure(id: String, error: CheckoutError) -> CoreResponse {
    match error {
        CheckoutError::Overlap => CoreResponse::failure(id, "REQUEST_OVERLAP", error.message()),
        _ => CoreResponse::failure(id, "INTERNAL_ERROR", error.message()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const DARK: &str = r#"{"schemaVersion":1,"theme":"dark","density":"default","sourceFontSize":14,"rememberLayout":true,"layouts":{}}"#;
    fn theme(host: &ApplicationHost) -> Value {
        let read = json!({"protocolVersion":1,"requestId":"read","operation":"preferences.read","payload":{}});
        serde_json::to_value(host.dispatch(read, false)).unwrap()["value"]["theme"].clone()
    }
    #[test]
    fn an_overlapping_request_is_refused_as_an_overlap_before_it_runs() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let (entered, ready) = std::sync::mpsc::channel();
        let (release, wait) = std::sync::mpsc::channel::<()>();
        let owner = host.clone();
        let held = std::thread::spawn(move || {
            owner.with_service(|_| {
                entered.send(()).unwrap();
                wait.recv().unwrap();
            })
        });
        ready.recv().unwrap();
        let write = json!({"protocolVersion":1,"requestId":"write","operation":"preferences.write",
            "payload":serde_json::from_str::<Value>(DARK).unwrap()});
        let refused = serde_json::to_value(host.dispatch(write, false)).unwrap();
        release.send(()).unwrap();
        held.join().unwrap().unwrap();
        assert_eq!(refused["error"]["code"], "REQUEST_OVERLAP");
        assert_eq!(theme(&host), "system");
    }
    #[test]
    fn a_poisoned_state_lock_is_an_internal_error() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let poisoned = host.clone();
        let _ = std::thread::spawn(move || {
            let _state = poisoned.0.state.lock().unwrap();
            panic!("synthetic poison");
        })
        .join();
        let write = json!({"protocolVersion":1,"requestId":"write","operation":"preferences.write",
            "payload":serde_json::from_str::<Value>(DARK).unwrap()});
        let refused = serde_json::to_value(host.dispatch(write, false)).unwrap();
        assert_eq!(refused["error"]["code"], "INTERNAL_ERROR");
    }
    #[test]
    fn a_dialog_completion_waits_for_an_overlapping_request_and_applies_once() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let (entered, ready) = std::sync::mpsc::channel();
        let owner = host.clone();
        let held = std::thread::spawn(move || {
            owner.with_service(|_| {
                entered.send(()).unwrap();
                std::thread::sleep(std::time::Duration::from_millis(200));
            })
        });
        ready.recv().unwrap();
        let mut applied = 0;
        let response = host.complete_dialog("dialog".into(), None, |_| {
            applied += 1;
            CoreResponse::success("dialog".into(), json!({"chosen": true}))
        });
        held.join().unwrap().unwrap();
        assert_eq!(applied, 1);
        assert_eq!(
            serde_json::to_value(response).unwrap()["value"]["chosen"],
            true
        );
    }
    #[test]
    fn a_dialog_completion_past_its_wait_is_never_an_overlap() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let (entered, ready) = std::sync::mpsc::channel();
        let (release, wait) = std::sync::mpsc::channel::<()>();
        let owner = host.clone();
        let held = std::thread::spawn(move || {
            owner.with_service(|_| {
                entered.send(()).unwrap();
                wait.recv().unwrap();
            })
        });
        ready.recv().unwrap();
        let mut applied = false;
        let response = host.complete_dialog_within(
            std::time::Duration::from_millis(50),
            "dialog".into(),
            None,
            |_| {
                applied = true;
                CoreResponse::success("dialog".into(), json!({}))
            },
        );
        release.send(()).unwrap();
        held.join().unwrap().unwrap();
        assert!(!applied);
        assert_eq!(
            serde_json::to_value(response).unwrap()["error"]["code"],
            "INTERNAL_ERROR"
        );
    }
    #[test]
    fn a_handler_that_panics_after_writing_is_not_reported_busy() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let error = host
            .with_service(|service| {
                service
                    .write_preferences(serde_json::from_str(DARK).unwrap())
                    .unwrap();
                panic!("synthetic handler failure");
            })
            .unwrap_err();
        let response = serde_json::to_value(checkout_failure("write".into(), error)).unwrap();
        assert_eq!(theme(&host), "dark");
        assert_eq!(response["error"]["code"], "INTERNAL_ERROR");
    }
    #[test]
    fn connection_publication_waits_for_checkout_and_expired_deadline_never_runs_task() {
        let dir = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());
        let (entered, ready) = std::sync::mpsc::channel();
        let (release, wait) = std::sync::mpsc::channel();
        let owner = host.clone();
        let held = std::thread::spawn(move || {
            owner
                .with_service(|_| {
                    entered.send(()).unwrap();
                    wait.recv().unwrap();
                })
                .unwrap()
        });
        ready.recv().unwrap();
        let owner = host.clone();
        let publication = std::thread::spawn(move || {
            owner.with_service_until(
                std::time::Instant::now() + std::time::Duration::from_secs(2),
                |_| 42,
            )
        });
        release.send(()).unwrap();
        held.join().unwrap();
        assert_eq!(publication.join().unwrap(), Ok(42));
        let mut called = false;
        assert!(host
            .with_service_until(std::time::Instant::now(), |_| called = true)
            .is_err());
        assert!(!called);
    }
}
