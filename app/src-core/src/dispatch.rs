//! Desktop request ownership. The service is checked out, never locked across I/O.
//! Token-bound controls use a separate, short state lock even during authoring work.
use crate::{
    handle_application_request, lifecycle::LifecycleService, validate_request, CoreResponse,
};
use serde_json::{json, Value};
use std::sync::{Arc, Condvar, Mutex};

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
    /// Checkout serializes mutations without making the control path wait for I/O.
    pub fn with_service<T>(
        &self,
        task: impl FnOnce(&mut LifecycleService) -> T,
    ) -> Result<T, &'static str> {
        let mut service = {
            let mut state = self.0.state.lock().map_err(|_| "Service unavailable.")?;
            if state.closing {
                return Err("Service shutting down.");
            }
            state
                .service
                .take()
                .ok_or("Another request is in progress.")?
        };
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| task(&mut service)));
        let mut state = self.0.state.lock().map_err(|_| "Service unavailable.")?;
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
        result.map_err(|_| "Request failed.")
    }
    /// A native dialog captures its session before showing UI and completes here.
    pub fn complete_dialog(
        &self,
        request_id: String,
        expected: Option<String>,
        task: impl FnOnce(&mut LifecycleService) -> CoreResponse,
    ) -> Result<CoreResponse, &'static str> {
        self.with_service(|service| {
            if service.current().map(|p| p.session_id) != expected {
                return CoreResponse::failure(
                    request_id,
                    "STALE_PROJECT_SESSION",
                    "The project session changed while the dialog was open.",
                );
            }
            task(service)
        })
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
            if state.closing
                || state.service.is_none()
                || state.request.as_ref().is_some_and(|p| p.result.is_none())
            {
                return busy(id);
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
            .unwrap_or_else(|_| busy(id))
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
    pub fn shutdown(&self) {
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
        service.runtime_shutdown();
        let mut state = self.0.state.lock().unwrap();
        state.control = None;
        state.service = Some(service);
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
fn busy(id: String) -> CoreResponse {
    CoreResponse::failure(id, "RUNTIME_BUSY", "Another request is in progress.")
}
