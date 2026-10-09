//! Native worker ownership. All final publication and invalidation share this guard.
use loomlight_core::{
    ai_credentials::{self as credentials, Records, Secrets},
    ai_request::{self, Cancel, Completion, Failure},
    dispatch::ApplicationHost,
    CoreResponse,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    sync::{Arc, Condvar, Mutex, OnceLock},
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Send {
    token: String,
    profile_id: String,
    session_id: Option<String>,
    timeout_seconds: u32,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Target {
    request_id: String,
}
struct Pending {
    id: String,
    token: String,
    session: Option<String>,
    cancel: Cancel,
    started: Instant,
    state: &'static str,
    http: Option<u16>,
    result: Option<Completion>,
    failure: Option<Failure>,
    elapsed_ms: u128,
    done: bool,
    worker: Option<JoinHandle<()>>,
    estimated_input: u32,
    margin: u32,
    maximum_response: u32,
}
#[derive(Default)]
struct State {
    pending: Option<Pending>,
    changing: usize,
    closing: bool,
}
#[derive(Default)]
pub struct Service {
    state: Mutex<State>,
    returned: Condvar,
    #[cfg(test)]
    publication_attempted: Mutex<Option<std::sync::mpsc::Sender<()>>>,
}
static SERVICE: OnceLock<Arc<Service>> = OnceLock::new();
pub fn service() -> &'static Arc<Service> {
    SERVICE.get_or_init(|| Arc::new(Service::default()))
}
fn view(p: &Pending) -> Value {
    json!({"requestId":p.id,"state":p.state,"done":p.done,"httpStatus":p.http,"elapsedMs":if p.done{p.elapsed_ms}else{p.started.elapsed().as_millis()},"category":p.failure.map(Failure::code),"message":p.failure.map(Failure::message),"completion":p.result,"estimatedInput":p.estimated_input,"margin":p.margin,"maximumResponse":p.maximum_response})
}
fn current(host: &ApplicationHost, token: &str, session: &Option<String>) -> Option<bool> {
    host.with_service(|s| {
        s.current().map(|p| p.session_id) == *session
            && s.read()
                .is_ok_and(|store| credentials::token(&store) == token)
    })
    .ok()
}
fn expire(p: &mut Pending) {
    p.cancel.cancel();
    p.state = "expired";
    p.result = None;
    p.failure = None;
}
pub struct Change(Arc<Service>);
impl Drop for Change {
    fn drop(&mut self) {
        if let Ok(mut s) = self.0.state.lock() {
            s.changing -= 1;
            if let Some(p) = s.pending.as_mut() {
                expire(p);
            }
        }
    }
}
impl Service {
    pub fn active_workers(&self) -> usize {
        usize::from(
            self.state
                .lock()
                .unwrap()
                .pending
                .as_ref()
                .is_some_and(|p| !p.done),
        )
    }
    pub fn change(self: &Arc<Self>) -> Change {
        let mut s = self.state.lock().unwrap();
        s.changing += 1;
        if let Some(p) = s.pending.as_mut() {
            expire(p);
        }
        Change(self.clone())
    }
    fn send(
        self: &Arc<Self>,
        host: &ApplicationHost,
        payload: Value,
    ) -> Result<Value, &'static str> {
        self.send_with_reader(host, payload, |s, profile| {
            crate::ai_native::secrets(s.ai_data_root())?
                .read(&profile.profile_id, profile.credential.as_ref().unwrap())?
                .ok_or(Failure::Credential.message())
        })
    }
    fn send_with_reader(
        self: &Arc<Self>,
        host: &ApplicationHost,
        payload: Value,
        read: impl FnOnce(
            &loomlight_core::lifecycle::LifecycleService,
            &loomlight_core::ai_profiles::StudioProfile,
        ) -> credentials::Result<credentials::Secret>,
    ) -> Result<Value, &'static str> {
        let input: Send =
            serde_json::from_value(payload).map_err(|_| "Invalid synthetic request payload.")?;
        let mut state = self
            .state
            .lock()
            .map_err(|_| "Request service unavailable.")?;
        if state.closing || state.changing != 0 {
            return Err("Configuration or project is changing; reload before sending.");
        }
        if state.pending.as_ref().is_some_and(|p| !p.done) {
            return Err("A request is already active; cancel or wait for completion.");
        }
        if let Some(mut p) = state.pending.take() {
            if let Some(worker) = p.worker.take() {
                let _ = worker.join();
            }
        }
        let prepared = host
            .with_service(|s| {
                if s.current().map(|p| p.session_id) != input.session_id {
                    return Err("Project changed; reopen the request panel.");
                }
                let store = s.read()?;
                if credentials::token(&store) != input.token {
                    return Err("Settings changed; reload the request profile.");
                }
                let profile = store
                    .profiles
                    .iter()
                    .find(|p| p.profile_id == input.profile_id)
                    .ok_or("Profile missing.")?
                    .clone();
                if !profile.credential_bound() {
                    return Err(Failure::Credential.message());
                }
                let key = read(s, &profile)?;
                ai_request::prepare(profile, key, input.timeout_seconds).map_err(Failure::message)
            })
            .map_err(|_| "Project service is busy; no request was sent.")??;
        let id = uuid::Uuid::new_v4().to_string();
        let cancel = Cancel::default();
        state.pending = Some(Pending {
            id: id.clone(),
            token: input.token,
            session: input.session_id,
            cancel: cancel.clone(),
            started: Instant::now(),
            state: "sending",
            http: None,
            result: None,
            failure: None,
            elapsed_ms: 0,
            done: false,
            worker: None,
            estimated_input: prepared.estimated_input,
            margin: prepared.margin,
            maximum_response: prepared.profile.settings.maximum_response,
        });
        let service = self.clone();
        let host = host.clone();
        let worker_id = id.clone();
        let timeout = prepared.timeout;
        let worker = thread::Builder::new()
            .name("studio-request".into())
            .spawn(move || {
                let mut http = None;
                let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    ai_request::execute(
                        prepared,
                        &cancel,
                        |stage| {
                            if let Ok(mut s) = service.state.lock() {
                                if let Some(p) = s
                                    .pending
                                    .as_mut()
                                    .filter(|p| p.id == worker_id && !p.cancel.cancelled())
                                {
                                    p.state = if stage == "receiving" {
                                        "receiving"
                                    } else {
                                        "validating"
                                    };
                                }
                            }
                        },
                        &mut http,
                    )
                }))
                .unwrap_or(Err(Failure::Connection));
                cancel.close_socket();
                let mut result = Some(result);
                loop {
                    let mut s = service.state.lock().unwrap();
                    let closing = s.closing;
                    let Some(p) = s.pending.as_mut().filter(|p| p.id == worker_id) else {
                        break;
                    };
                    if !closing && !p.cancel.cancelled() && p.state != "expired" {
                        // Save temporarily checks out the service. Unavailable is not
                        // stale: wait off-thread, without the publication guard held.
                        // Each attempt still atomically revalidates and publishes.
                        let valid = host.with_service(|native| {
                            let valid = native.current().map(|p| p.session_id) == p.session
                                && native
                                    .read()
                                    .is_ok_and(|v| credentials::token(&v) == p.token);
                            if valid {
                                match result.take().unwrap() {
                                    Ok(value) => {
                                        p.state = "completed";
                                        p.result = Some(value);
                                    }
                                    Err(e) => {
                                        p.state = if e == Failure::Timeout {
                                            "expired"
                                        } else {
                                            "failed"
                                        };
                                        p.failure = Some(e);
                                    }
                                }
                            }
                            valid
                        });
                        #[cfg(test)]
                        if let Some(signal) = service.publication_attempted.lock().unwrap().as_ref()
                        {
                            let _ = signal.send(());
                        }
                        match valid {
                            Ok(true) => (),
                            Ok(false) => expire(p),
                            Err(_) if p.started.elapsed() < timeout => {
                                p.state = "validating";
                                drop(s);
                                thread::sleep(Duration::from_millis(5));
                                continue;
                            }
                            Err(_) => {
                                expire(p);
                                p.failure = Some(Failure::Timeout);
                            }
                        }
                    }
                    p.http = http;
                    p.done = true;
                    p.elapsed_ms = p.started.elapsed().as_millis();
                    service.returned.notify_all();
                    break;
                }
            })
            .map_err(|_| {
                state.pending = None;
                "Request worker unavailable; nothing sent."
            })?;
        let p = state.pending.as_mut().unwrap();
        p.worker = Some(worker);
        Ok(view(p))
    }
    fn status(&self, host: &ApplicationHost, payload: Value) -> Result<Value, &'static str> {
        let input: Target =
            serde_json::from_value(payload).map_err(|_| "Invalid request status payload.")?;
        let mut state = self
            .state
            .lock()
            .map_err(|_| "Request service unavailable.")?;
        let p = state
            .pending
            .as_mut()
            .filter(|p| p.id == input.request_id)
            .ok_or("Request is no longer owned.")?;
        if p.state != "cancelled" && current(host, &p.token, &p.session) == Some(false) {
            expire(p);
        }
        Ok(view(p))
    }
    fn cancel(&self, payload: Value) -> Result<Value, &'static str> {
        let input: Target =
            serde_json::from_value(payload).map_err(|_| "Invalid request cancellation payload.")?;
        let mut state = self
            .state
            .lock()
            .map_err(|_| "Request service unavailable.")?;
        let p = state
            .pending
            .as_mut()
            .filter(|p| p.id == input.request_id)
            .ok_or("Request is no longer owned.")?;
        // Also discard already-published output. A later Cancel may never expose it.
        p.cancel.cancel();
        p.state = "cancelled";
        p.result = None;
        p.failure = Some(Failure::Cancelled);
        let (mut state, wait) = self
            .returned
            .wait_timeout_while(state, Duration::from_secs(2), |s| {
                s.pending.as_ref().is_some_and(|p| !p.done)
            })
            .map_err(|_| "Request cleanup unavailable.")?;
        if wait.timed_out() && state.pending.as_ref().is_some_and(|p| !p.done) {
            return Err("Cancellation requested; worker cleanup is incomplete.");
        }
        let p = state.pending.as_mut().unwrap();
        if let Some(worker) = p.worker.take() {
            let _ = worker.join();
        }
        Ok(view(p))
    }
    pub fn shutdown(&self) -> bool {
        let mut state = self.state.lock().unwrap();
        state.closing = true;
        if let Some(p) = state.pending.as_mut() {
            expire(p);
        }
        let Ok((mut state, _)) =
            self.returned
                .wait_timeout_while(state, Duration::from_secs(2), |s| {
                    s.pending.as_ref().is_some_and(|p| !p.done)
                })
        else {
            return false;
        };
        if state.pending.as_ref().is_some_and(|p| !p.done) {
            return false;
        }
        if let Some(mut p) = state.pending.take() {
            if let Some(worker) = p.worker.take() {
                let _ = worker.join();
            }
        }
        true
    }
    pub fn dispatch(
        self: &Arc<Self>,
        host: &ApplicationHost,
        id: String,
        op: &str,
        payload: Value,
    ) -> CoreResponse {
        let result = match op {
            "ai.sendSynthetic" => self.send(host, payload),
            "ai.requestStatus" => self.status(host, payload),
            "ai.cancelRequest" => self.cancel(payload),
            _ => Err("Unsupported request operation."),
        };
        match result {
            Ok(v) => CoreResponse::success(id, v),
            Err(message) => CoreResponse::failure(id, "STUDIO_REQUEST_REFUSED", message),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use loomlight_core::{
        ai_profiles::{ProfileStore, StudioSettings},
        lifecycle::LifecycleService,
    };
    use std::{
        io::{Read, Write},
        net::TcpListener,
    };

    impl Service {
        fn send_fixture(
            self: &Arc<Self>,
            host: &ApplicationHost,
            payload: Value,
        ) -> Result<Value, &'static str> {
            self.send_with_reader(host, payload, |_, _| {
                Ok(credentials::Secret::new("loomlight-public-request".into()))
            })
        }
    }
    fn setup(port: u16) -> (tempfile::TempDir, ApplicationHost, Value) {
        let root = tempfile::tempdir().unwrap();
        let s = LifecycleService::new(root.path().to_owned()).unwrap();
        credentials::save(
            &s,
            &credentials::token(&ProfileStore::default()),
            None,
            StudioSettings {
                label: "Synthetic".into(),
                endpoint: format!("http://127.0.0.1:{port}/v1"),
                model: "synthetic-model".into(),
                private_http: false,
                context_ceiling: 8192,
                context_budget: 4096,
                maximum_response: 1024,
            },
        )
        .unwrap();
        let initial = s.read().unwrap();
        // Request ownership tests use an isolated reference and injected native
        // reader. They neither qualify nor operate any OS credential backend.
        let mut saved = initial.clone();
        saved.revision += 1;
        saved.profiles[0].revision += 1;
        saved.profiles[0].credential = Some(
            serde_json::from_value(json!({
                "credentialId":uuid::Uuid::new_v4().to_string(), "revision":1,
                "origin":format!("http://127.0.0.1:{port}")
            }))
            .unwrap(),
        );
        s.write(&saved, &initial).unwrap();
        let saved = s.read().unwrap();
        let input = json!({"token":credentials::token(&saved),"profileId":saved.profiles[0].profile_id,"sessionId":null,"timeoutSeconds":600});
        (root, ApplicationHost::new(s), input)
    }
    fn stalled() -> (TcpListener, u16) {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        (listener, port)
    }
    fn accept(listener: TcpListener) -> (std::sync::mpsc::Receiver<()>, JoinHandle<()>) {
        let (tx, rx) = std::sync::mpsc::channel();
        let server = thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            let mut bytes = Vec::new();
            let mut b = [0; 4096];
            loop {
                let n = socket.read(&mut b).unwrap();
                bytes.extend_from_slice(&b[..n]);
                if bytes.windows(4).any(|w| w == b"\r\n\r\n") {
                    break;
                }
            }
            tx.send(()).unwrap();
            loop {
                match socket.read(&mut b) {
                    Ok(0) => break,
                    Ok(_) => (),
                    Err(e) => panic!("client not cleaned: {:?}", e.kind()),
                }
            }
        });
        (rx, server)
    }
    fn finish(service: &Service, host: &ApplicationHost, id: &Value) -> Value {
        let until = Instant::now() + Duration::from_secs(2);
        loop {
            let v = service.status(host, json!({"requestId":id})).unwrap();
            if v["done"] == true {
                return v;
            }
            assert!(Instant::now() < until);
            thread::sleep(Duration::from_millis(5));
        }
    }
    #[test]
    fn one_owned_worker_native_capture_cancel_and_stale_payload_refusals() {
        let (listener, port) = stalled();
        let (_root, host, input) = setup(port);
        let service = Arc::new(Service::default());
        for bad in [
            json!({"key":"renderer-refused"}),
            {
                let mut b = input.clone();
                b["token"] = json!("old");
                b
            },
            {
                let mut b = input.clone();
                b["sessionId"] = json!("changed");
                b
            },
            {
                let mut b = input.clone();
                b["secret"] = json!("renderer-refused");
                b
            },
        ] {
            assert!(service.send_fixture(&host, bad).is_err())
        }
        let (received, server) = accept(listener);
        let started = service.send_fixture(&host, input.clone()).unwrap();
        received.recv_timeout(Duration::from_secs(2)).unwrap();
        assert!(
            host.with_service(|s| s.read()).unwrap().is_ok(),
            "network released service boundary"
        );
        assert!(
            service.send_fixture(&host, input).is_err(),
            "one worker, no queue"
        );
        let cancelled = service
            .cancel(json!({"requestId":started["requestId"]}))
            .unwrap();
        assert_eq!(cancelled["state"], "cancelled");
        assert_eq!(cancelled["done"], true);
        assert_eq!(cancelled["completion"], Value::Null);
        assert!(cancelled
            .to_string()
            .find("loomlight-public-request")
            .is_none());
        assert!(service
            .state
            .lock()
            .unwrap()
            .pending
            .as_ref()
            .unwrap()
            .worker
            .is_none());
        server.join().unwrap();
        assert!(service.shutdown());
        assert!(service.state.lock().unwrap().pending.is_none());
    }
    #[test]
    fn configuration_and_shutdown_cancel_before_late_publication() {
        for shutdown in [false, true] {
            let (listener, port) = stalled();
            let (_root, host, input) = setup(port);
            let service = Arc::new(Service::default());
            let (received, server) = accept(listener);
            let started = service.send_fixture(&host, input.clone()).unwrap();
            received.recv_timeout(Duration::from_secs(2)).unwrap();
            if shutdown {
                assert!(service.shutdown());
                assert!(service.send_fixture(&host, input).is_err());
                assert!(service.state.lock().unwrap().pending.is_none());
            } else {
                let guard = service.change();
                assert!(service.send_fixture(&host, input).is_err());
                drop(guard);
                let v = finish(&service, &host, &started["requestId"]);
                assert_eq!(v["state"], "expired");
                assert_eq!(v["completion"], Value::Null);
                assert!(service.shutdown());
            }
            server.join().unwrap();
        }
    }
    #[test]
    fn ordinary_external_configuration_change_and_project_session_reject_results() {
        for project in [false, true] {
            let (listener, port) = stalled();
            let (root, host, input) = setup(port);
            let service = Arc::new(Service::default());
            let (received, server) = accept(listener);
            let started = service.send_fixture(&host, input).unwrap();
            received.recv_timeout(Duration::from_secs(2)).unwrap();
            if project {
                // The active request captured None; opening a real synthetic project invalidates it.
                let fixture =
                    LifecycleService::prepare_source_foundation_probe(root.path().join("fixture"))
                        .unwrap();
                let project_root = fixture.ai_data_root().join("synthetic-project");
                drop(fixture);
                host.with_service(|s| s.open_path(&project_root))
                    .unwrap()
                    .unwrap();
            } else {
                host.with_service(|s| {
                    let old = s.read().unwrap();
                    let mut new = old.clone();
                    new.revision += 1;
                    new.profiles[0].revision += 1;
                    new.profiles[0].settings.maximum_response = 512;
                    s.write(&new, &old).unwrap();
                })
                .unwrap();
            }
            let v = service
                .status(&host, json!({"requestId":started["requestId"]}))
                .unwrap();
            assert_eq!(v["state"], "expired");
            assert_eq!(v["completion"], Value::Null);
            finish(&service, &host, &started["requestId"]);
            server.join().unwrap();
            assert!(service.shutdown());
            host.shutdown();
        }
    }
    #[test]
    fn completed_result_then_cancel_or_configuration_change_cannot_reappear() {
        for cancel in [true, false] {
            let (listener, port) = stalled();
            let (_root, host, input) = setup(port);
            let service = Arc::new(Service::default());
            let server = thread::spawn(move || {
                let (mut socket, _) = listener.accept().unwrap();
                socket
                    .set_read_timeout(Some(Duration::from_secs(2)))
                    .unwrap();
                let mut b = [0; 4096];
                let mut bytes = Vec::new();
                loop {
                    let n = socket.read(&mut b).unwrap();
                    bytes.extend_from_slice(&b[..n]);
                    if let Some(pos) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                        let headers = String::from_utf8_lossy(&bytes[..pos]);
                        let length: usize = headers
                            .lines()
                            .find_map(|line| {
                                line.to_ascii_lowercase()
                                    .strip_prefix("content-length:")
                                    .map(|s| s.trim().parse().unwrap())
                            })
                            .unwrap();
                        if bytes.len() >= pos + 4 + length {
                            break;
                        }
                    }
                }
                let body=br#"{"model":"synthetic-model","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":"synthetic"}}]}"#;
                write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).unwrap();
                socket.write_all(body).unwrap();
            });
            let started = service.send_fixture(&host, input).unwrap();
            let v = finish(&service, &host, &started["requestId"]);
            assert_eq!(v["state"], "completed");
            assert_eq!(v["completion"]["usage"]["totalTokens"], Value::Null);
            if cancel {
                service
                    .cancel(json!({"requestId":started["requestId"]}))
                    .unwrap();
            } else {
                drop(service.change());
            }
            let late = service
                .status(&host, json!({"requestId":started["requestId"]}))
                .unwrap();
            assert_eq!(late["completion"], Value::Null);
            assert_ne!(late["state"], "completed");
            server.join().unwrap();
            assert!(service.shutdown());
        }
    }
    #[test]
    fn local_status_during_save_boundary_does_not_cancel_the_network_worker() {
        let (listener, port) = stalled();
        let (_root, host, input) = setup(port);
        let service = Arc::new(Service::default());
        let (received, server) = accept(listener);
        let started = service.send_fixture(&host, input).unwrap();
        received.recv_timeout(Duration::from_secs(2)).unwrap();
        let (ready, ready_rx) = std::sync::mpsc::channel();
        let (release, release_rx) = std::sync::mpsc::channel();
        let held_host = host.clone();
        let boundary = thread::spawn(move || {
            held_host
                .with_service(|_| {
                    ready.send(()).unwrap();
                    release_rx.recv_timeout(Duration::from_secs(2)).unwrap();
                })
                .unwrap()
        });
        ready_rx.recv_timeout(Duration::from_secs(2)).unwrap();
        let status = service
            .status(&host, json!({"requestId":started["requestId"]}))
            .unwrap();
        assert_eq!(status["done"], false);
        assert_ne!(status["state"], "expired");
        release.send(()).unwrap();
        boundary.join().unwrap();
        service
            .cancel(json!({"requestId":started["requestId"]}))
            .unwrap();
        server.join().unwrap();
        assert!(service.shutdown());
    }
    #[test]
    fn completion_during_save_boundary_waits_and_preserves_invalidation() {
        for action in ["complete", "cancel", "change", "shutdown"] {
            let (listener, port) = stalled();
            let (_root, host, input) = setup(port);
            let service = Arc::new(Service::default());
            let (attempted, attempt_rx) = std::sync::mpsc::channel();
            *service.publication_attempted.lock().unwrap() = Some(attempted);
            let (respond, response_rx) = std::sync::mpsc::channel();
            let server = thread::spawn(move || {
                let (mut socket, _) = listener.accept().unwrap();
                socket
                    .set_read_timeout(Some(Duration::from_secs(2)))
                    .unwrap();
                let mut bytes = Vec::new();
                let mut b = [0; 4096];
                loop {
                    let n = socket.read(&mut b).unwrap();
                    assert!(n > 0);
                    bytes.extend_from_slice(&b[..n]);
                    if let Some(pos) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                        let headers = String::from_utf8_lossy(&bytes[..pos]);
                        let length: usize = headers
                            .lines()
                            .find_map(|line| {
                                line.to_ascii_lowercase()
                                    .strip_prefix("content-length:")
                                    .map(|s| s.trim().parse().unwrap())
                            })
                            .unwrap();
                        if bytes.len() >= pos + 4 + length {
                            break;
                        }
                    }
                }
                response_rx.recv_timeout(Duration::from_secs(2)).unwrap();
                let body=br#"{"model":"synthetic-model","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":"valid during Save"}}]}"#;
                write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).unwrap();
                socket.write_all(body).unwrap();
            });
            let started = service.send_fixture(&host, input).unwrap();
            host.with_service(|_| {
                respond.send(()).unwrap();
                attempt_rx.recv_timeout(Duration::from_secs(2)).unwrap();
                match action {
                    "cancel" => {
                        service
                            .cancel(json!({"requestId":started["requestId"]}))
                            .unwrap();
                    }
                    "change" => {
                        drop(service.change());
                    }
                    "shutdown" => {
                        assert!(service.shutdown());
                    }
                    _ => (),
                }
            })
            .unwrap();
            if action != "shutdown" {
                let outcome = finish(&service, &host, &started["requestId"]);
                if action == "complete" {
                    assert_eq!(outcome["state"], "completed");
                    assert_eq!(outcome["completion"]["text"], "valid during Save");
                } else {
                    assert_ne!(outcome["state"], "completed");
                    assert_eq!(outcome["completion"], Value::Null);
                }
            }
            server.join().unwrap();
            assert!(service.shutdown());
        }
    }
}
