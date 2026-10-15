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
struct RewriteSend { token: String, payload_digest: String, session_id: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Target {
    request_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ModelSettingsTarget {
    token: String,
    profile_id: String,
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
    model_readiness: Option<loomlight_core::studio_models::Readiness>,
    requested_context: u32,
    rewrite_token: Option<String>,
    proposal: Option<Value>,
    compatibility_profile: Option<String>,
}
#[derive(Default)]
struct State {
    pending: Option<Pending>,
    model_settings: Option<Cancel>,
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
    json!({"requestId":p.id,"state":p.state,"done":p.done,"httpStatus":p.http,"elapsedMs":if p.done{p.elapsed_ms}else{p.started.elapsed().as_millis()},"category":p.failure.map(Failure::code),"message":p.failure.map(Failure::message),"completion":p.result,"proposal":p.proposal,"estimatedInput":p.estimated_input,"margin":p.margin,"maximumResponse":p.maximum_response,"requestedContext":p.requested_context,"modelReadiness":p.model_readiness})
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
    p.proposal = None;
    p.failure = None;
}
pub struct Change(Arc<Service>);
struct ModelSettingsChange(Arc<Service>);
impl Drop for ModelSettingsChange {
    fn drop(&mut self) {
        if let Ok(mut state) = self.0.state.lock() {
            state.model_settings = None;
            state.changing -= 1;
            self.0.returned.notify_all();
        }
    }
}
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
        let state = self.state.lock().unwrap();
        usize::from(state.pending.as_ref().is_some_and(|p| !p.done))
            + usize::from(state.model_settings.is_some())
    }
    pub fn change(self: &Arc<Self>) -> Change {
        let mut s = self.state.lock().unwrap();
        s.changing += 1;
        if let Some(cancel) = &s.model_settings {
            cancel.cancel();
        }
        if let Some(p) = s.pending.as_mut() {
            expire(p);
        }
        Change(self.clone())
    }
    fn begin_model_settings(self: &Arc<Self>, cancel: &Cancel) -> Result<ModelSettingsChange, &'static str> {
        let mut state = self.state.lock().map_err(|_| "Request service unavailable.")?;
        if state.closing || state.changing != 0 || state.model_settings.is_some()
            || state.pending.as_ref().is_some_and(|pending| !pending.done)
        {
            return Err("Finish the active request or configuration change before managing model-load settings. No request was cancelled.");
        }
        state.model_settings = Some(cancel.clone());
        state.changing += 1;
        Ok(ModelSettingsChange(self.clone()))
    }
    fn model_settings_with_reader(
        self: &Arc<Self>, host: &ApplicationHost, payload: Value, apply: bool,
        read: impl FnOnce(&loomlight_core::lifecycle::LifecycleService, &loomlight_core::ai_profiles::StudioProfile)
            -> credentials::Result<credentials::Secret>,
    ) -> Result<Value, &'static str> {
        let target: ModelSettingsTarget = serde_json::from_value(payload)
            .map_err(|_| "Invalid model-load settings payload.")?;
        let cancel = Cancel::default();
        let _change = self.begin_model_settings(&cancel)?;
        let (profile, key) = host.with_service(|records| {
            let store = credentials::checked(records, &target.token)?;
            let profile = store.profiles.iter().find(|profile| profile.profile_id == target.profile_id)
                .ok_or("Saved profile missing.")?.clone();
            if !profile.credential_bound() { return Err(Failure::Credential.message()); }
            let key = read(records, &profile)?;
            Ok((profile, key))
        }).map_err(|_| "Project service is busy; no model-load settings changed.")??;
        // Management uses the same captured origin, credential and bounded transport.
        // Network and DNS never run while the project service is checked out.
        let prepared = ai_request::prepare(profile, key, 30).map_err(Failure::message)?;
        let still_current = || !cancel.cancelled() && host.with_service(|records|
            records.read().is_ok_and(|store| credentials::token(&store) == target.token)
        ).unwrap_or(false);
        if !still_current() { return Err("Saved profile changed; read model-load settings again before applying."); }
        let report = ai_request::model_load_settings(prepared, apply, &cancel, still_current)
            .map_err(|failure| if apply {
                match failure {
                    Failure::Authentication => "Unsloth Studio authentication failed. Model-load settings remain unverified; read settings before applying again.",
                    Failure::ModelUnsupported => "Unsloth Studio's settings interface or existing options cannot be safely preserved. Model-load settings remain unverified; read settings before applying again.",
                    Failure::ModelUnavailable => "The selected model and quantization could not be resolved. Model-load settings remain unverified; read settings before applying again.",
                    Failure::ModelConflict | Failure::ModelNotReady => "The model is loading or its identity changed. Model-load settings remain unverified; read settings before applying again.",
                    Failure::ModelSettingsUnsupported | Failure::ModelSettingsUnsafe | Failure::ModelSettingsChanged => failure.message(),
                    Failure::Configuration => "Save valid model-load settings for this profile before applying. Read Unsloth Studio settings before retrying.",
                    // A socket failure/cancellation after PUT cannot establish whether it saved.
                    _ => "Model-load settings could not be verified. Unsloth Studio may have saved them; read settings before applying again. No automatic retry or model reload.",
                }
            } else { failure.message() })?;
        if !still_current() {
            return Err("Saved profile changed during model-load settings. Read settings again; the server may have saved the previous model's override. No automatic retry or reload.");
        }
        serde_json::to_value(report).map_err(|_| "Model-load settings report unavailable; read settings again before applying.")
    }
    fn send(
        self: &Arc<Self>,
        host: &ApplicationHost,
        payload: Value,
    ) -> Result<Value, &'static str> {
        self.send_with_reader(host, payload, false, |s, profile| {
            crate::ai_native::secrets(s.ai_data_root())?
                .read(&profile.profile_id, profile.credential.as_ref().unwrap())?
                .ok_or(Failure::Credential.message())
        })
    }
    fn send_with_reader(
        self: &Arc<Self>,
        host: &ApplicationHost,
        payload: Value,
        rewrite: bool,
        read: impl FnOnce(
            &loomlight_core::lifecycle::LifecycleService,
            &loomlight_core::ai_profiles::StudioProfile,
        ) -> credentials::Result<credentials::Secret>,
    ) -> Result<Value, &'static str> {
        self.send_kind(host,payload,rewrite,false,read)
    }
    fn send_kind(
        self: &Arc<Self>, host: &ApplicationHost, payload: Value, rewrite: bool, compatibility: bool,
        read: impl FnOnce(&loomlight_core::lifecycle::LifecycleService,&loomlight_core::ai_profiles::StudioProfile)->credentials::Result<credentials::Secret>,
    ) -> Result<Value, &'static str> {
        let rewrite_input: Option<RewriteSend> = if rewrite { Some(serde_json::from_value(payload.clone()).map_err(|_| "Invalid reviewed send payload.")?) } else { None };
        let mut input: Send = if let Some(r)=&rewrite_input {
            Send { token: String::new(), profile_id:String::new(), session_id:Some(r.session_id.clone()), timeout_seconds:0 }
        } else { serde_json::from_value(payload).map_err(|_| "Invalid synthetic request payload.")? };
        if !rewrite && !(30..=1800).contains(&input.timeout_seconds) {return Err(Failure::Configuration.message());}
        let cancel = Cancel::default();
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
        let (profile,key,body,timeout_seconds,reviewed,profile_token) = host
            .with_service(|s| {
                if compatibility {input.session_id=s.current().map(|p|p.session_id);}
                if s.current().map(|p| p.session_id) != input.session_id {return Err("Project changed; reopen the request panel.");}
                let mut store = s.read()?;
                if let Some(r)=&rewrite_input {
                    let capture=s.rewrite_take_send(&r.session_id,&r.token,&r.payload_digest,cancel.clone()).map_err(|_|"Project or review changed; prepare and review again. No request sent.")?;
                    let key=read(s,&capture.profile)?;
                    return Ok((capture.profile,key,capture.body,capture.timeout_seconds,Some(capture.destination),credentials::token(&store)));
                }
                if credentials::token(&store) != input.token {return Err("Settings changed; reload the request profile.");}
                if compatibility {store=credentials::clear_compatibility(s,&input.token,&input.profile_id)?;}
                let profile=store.profiles.iter().find(|p|p.profile_id==input.profile_id).ok_or("Profile missing.")?.clone();
                if !profile.credential_bound(){return Err(Failure::Credential.message());}
                let key=read(s,&profile)?;
                let body=if compatibility {loomlight_core::ai_compatibility::body(&profile)}else{Vec::new()};
                Ok((profile,key,body,input.timeout_seconds,None,credentials::token(&store)))
            }).map_err(|_|"Project service is busy; no request was sent.")??;
        let compatibility_profile=compatibility.then(||profile.profile_id.clone());
        // Resolution/transport construction is outside the project mutation lock.
        let prepared=if let Some(destination)=reviewed {
            ai_request::prepare_reviewed_bound(profile,key,timeout_seconds,body,destination)
        }else if compatibility {ai_request::prepare_reviewed(profile,key,timeout_seconds,body)}
        else {ai_request::prepare(profile,key,timeout_seconds)}.map_err(Failure::message)?;
        let id = uuid::Uuid::new_v4().to_string();
        state.pending = Some(Pending {
            id: id.clone(),
            token: profile_token,
            session: input.session_id,
            cancel: cancel.clone(),
            started: Instant::now(),
            state: "checking_model",
            http: None,
            result: None,
            failure: None,
            elapsed_ms: 0,
            done: false,
            worker: None,
            estimated_input: prepared.estimated_input,
            margin: prepared.margin,
            maximum_response: prepared.profile.settings.maximum_response,
            model_readiness: None,
            requested_context: prepared.profile.settings.context_budget,
            rewrite_token: rewrite_input.map(|r| r.token),
            proposal: None,
            compatibility_profile,
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
                    ai_request::execute_ready(
                        prepared,
                        &cancel,
                        |stage| {
                            if let Ok(mut s) = service.state.lock() {
                                if let Some(p) = s
                                    .pending
                                    .as_mut()
                                    .filter(|p| p.id == worker_id && !p.cancel.cancelled())
                                {
                                    p.state = match stage {
                                        "checking_model" => "checking_model",
                                        "loading_model" => "loading_model",
                                        "sending" => "sending",
                                        "receiving" => "receiving",
                                        _ => "validating",
                                    };
                                }
                            }
                        },
                        &mut http,
                        |ready| {
                            if let Ok(mut s) = service.state.lock() {
                                if let Some(p) = s
                                    .pending
                                    .as_mut()
                                    .filter(|p| p.id == worker_id && !p.cancel.cancelled())
                                {
                                    p.model_readiness = Some(ready.clone());
                                }
                            }
                        },
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
                                        if let Some(token)=&p.rewrite_token {
                                            match native.rewrite_complete(p.session.as_deref().unwrap_or(""),token,&value) {
                                                Ok(review)=> { p.state="completed"; p.proposal=Some(review); }
                                                Err(_)=> { p.state="failed"; p.failure=Some(Failure::UnsupportedResponse); }
                                            }
                                        } else if let Some(id)=&p.compatibility_profile {
                                            if loomlight_core::ai_compatibility::validate(&value).is_ok() {
                                                match credentials::record_compatibility(native,&p.token,id) {
                                                    Ok(store)=>{p.token=credentials::token(&store);p.state="completed";}
                                                    Err(_)=>{p.state="failed";p.failure=Some(Failure::Configuration);}
                                                }
                                            }else{p.state="failed";p.failure=Some(Failure::UnsupportedResponse);}
                                        } else { p.state = "completed"; p.result = Some(value); }
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
        // A completed compatibility test has already durably published evidence.
        // Preserve that winner rather than report a cancelled, unrecorded test.
        if p.compatibility_profile.is_some() && p.done && p.state == "completed" {return Ok(view(p));}
        // Also discard already-published proposal/text output.
        p.cancel.cancel();
        p.state = "cancelled";
        p.result = None;
        p.proposal = None;
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
        if let Some(cancel) = &state.model_settings {
            cancel.cancel();
        }
        if let Some(p) = state.pending.as_mut() {
            expire(p);
        }
        let Ok((mut state, _)) =
            self.returned
                .wait_timeout_while(state, Duration::from_secs(2), |s| {
                    s.pending.as_ref().is_some_and(|p| !p.done) || s.model_settings.is_some()
                })
        else {
            return false;
        };
        if state.pending.as_ref().is_some_and(|p| !p.done) || state.model_settings.is_some() {
            return false;
        }
        if let Some(mut p) = state.pending.take() {
            if let Some(worker) = p.worker.take() {
                let _ = worker.join();
            }
        }
        true
    }
    fn prepare_rewrite(&self, host:&ApplicationHost, mut payload:Value)->Result<Value,&'static str> {
        let object=payload.as_object_mut().ok_or("Invalid review payload.")?;
        let session=object.remove("sessionId").and_then(|v|v.as_str().map(str::to_owned)).ok_or("Project session missing.")?;
        let request:loomlight_core::rewrite::PrepareRequest=serde_json::from_value(payload).map_err(|_|"Invalid review payload.")?;
        let profile=host.with_service(|s|{
            s.require_session(&session).map_err(|_|"Project changed.")?;
            let store=credentials::checked(s,&request.expected_profile_token)?;
            let profile=store.profiles.iter().find(|p|p.profile_id==request.profile_id).ok_or("Profile missing.")?.clone();
            if !profile.compatibility_ready(){return Err("Test this Studio setup in Settings before preparing a project send.");}
            Ok(profile)
        }).map_err(|_|"Project service is busy.")??;
        let destination=ai_request::resolve_destination(&profile.settings).map_err(Failure::message)?;
        host.with_service(|s|s.rewrite_prepare_bound(&session,request,destination).map_err(|_|"Project or configuration changed; review a fresh send.")).map_err(|_|"Project service is busy.")?
    }
    pub fn dispatch(
        self: &Arc<Self>,
        host: &ApplicationHost,
        id: String,
        op: &str,
        payload: Value,
    ) -> CoreResponse {
        let result = match op {
            "ai.readModelLoadSettings" | "ai.applyModelLoadSettings" => self.model_settings_with_reader(host, payload, op == "ai.applyModelLoadSettings", |records, profile| {
                crate::ai_native::secrets(records.ai_data_root())?
                    .read(&profile.profile_id, profile.credential.as_ref().unwrap())?
                    .ok_or(Failure::Credential.message())
            }),
            "ai.sendSynthetic" => self.send(host, payload),
            "ai.testCompatibility" => self.send_kind(host,payload,false,true,|s,profile|{
                crate::ai_native::secrets(s.ai_data_root())?.read(&profile.profile_id,profile.credential.as_ref().unwrap())?.ok_or(Failure::Credential.message())
            }),
            "rewrite.prepare"=>self.prepare_rewrite(host,payload),
            "rewrite.send" => self.send_with_reader(host, payload, true, |s,profile| {
                crate::ai_native::secrets(s.ai_data_root())?.read(&profile.profile_id,profile.credential.as_ref().unwrap())?.ok_or(Failure::Credential.message())
            }),
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
            self.send_with_reader(host, payload, false, |_, _| {
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
                temperature: None,
                top_p: None,
                model_load: None,
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
    fn generation_socket(listener: &TcpListener) -> std::net::TcpStream {
        let (mut status, _) = listener.accept().unwrap();
        status
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut bytes = Vec::new();
        let mut b = [0; 4096];
        while !bytes.windows(4).any(|w| w == b"\r\n\r\n") {
            let n = status.read(&mut b).unwrap();
            assert!(n > 0);
            bytes.extend_from_slice(&b[..n]);
        }
        assert!(String::from_utf8_lossy(&bytes).starts_with("GET /api/inference/status "));
        let body = br#"{"active_model":"synthetic-model","model_identifier":"synthetic-model","loaded":["synthetic-model"],"loading":[],"context_length":8192}"#;
        write!(status,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).unwrap();
        status.write_all(body).unwrap();
        drop(status);
        listener.accept().unwrap().0
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
    fn compatibility_native_worker_exact_probe_and_strict_publication_no_project_writes() {
        for valid in [true,false] {
            let(listener,port)=stalled();let(root,host,input)=setup(port);let service=Arc::new(Service::default());
            let server=thread::spawn(move||{
                let mut socket=generation_socket(&listener);let mut bytes=Vec::new();let mut b=[0;4096];
                let body=loop {
                    let n=socket.read(&mut b).unwrap();assert!(n>0);bytes.extend_from_slice(&b[..n]);
                    if let Some(pos)=bytes.windows(4).position(|b|b==b"\r\n\r\n") {
                        let headers=String::from_utf8_lossy(&bytes[..pos]);let len:usize=headers.lines().find_map(|l|l.to_ascii_lowercase().strip_prefix("content-length:").map(|v|v.trim().parse().unwrap())).unwrap();
                        if bytes.len()>=pos+4+len {break serde_json::from_slice::<Value>(&bytes[pos+4..pos+4+len]).unwrap();}
                    }
                };
                assert_eq!(body["response_format"]["json_schema"]["strict"],true);assert_eq!(body["enable_tools"],false);assert_eq!(body["enabled_tools"],json!([]));
                assert_eq!(body["enable_thinking"],false);assert_eq!(body["temperature"],1.0);assert_eq!(body["top_p"],0.95);assert!(body.get("session_id").is_none());
                let response=serde_json::to_vec(&json!({"model":"synthetic-model","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":if valid{"{\"ok\":true}"}else{"{\"ok\":true,\"extra\":1}"}}}]})).unwrap();
                write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",response.len()).unwrap();socket.write_all(&response).unwrap();
            });
            let started=service.send_kind(&host,input,false,true,|_,_|Ok(credentials::Secret::new("public-fixture".into()))).unwrap();
            let done=finish(&service,&host,&started["requestId"]);assert_eq!(done["state"],if valid{"completed"}else{"failed"});
            assert_eq!(done["completion"],Value::Null);assert_eq!(done["proposal"],Value::Null);
            if valid {
                let late_cancel=service.cancel(json!({"requestId":started["requestId"]})).unwrap();
                assert_eq!(late_cancel["state"],"completed");
            }
            let store=host.with_service(|s|s.read()).unwrap().unwrap();assert_eq!(store.profiles[0].compatibility_ready(),valid);
            let reopened=LifecycleService::new(root.path().to_owned()).unwrap();assert_eq!(reopened.read().unwrap().profiles[0].compatibility_ready(),valid);
            assert!(!root.path().join("synthetic-project").exists());server.join().unwrap();assert!(service.shutdown());
        }
    }

    #[test]
    fn compatibility_cancel_and_configuration_change_never_publish_readiness() {
        for change in [false, true] {
            let (listener, port) = stalled();
            let (_root, host, input) = setup(port);
            let service = Arc::new(Service::default());
            let (received, server) = accept(listener);
            let started = service.send_kind(&host, input, false, true, |_, _| {
                Ok(credentials::Secret::new("public-fixture".into()))
            }).unwrap();
            received.recv_timeout(Duration::from_secs(2)).unwrap();
            let before = host.with_service(|s| s.read()).unwrap().unwrap();
            if change {
                drop(service.change());
                assert_eq!(finish(&service, &host, &started["requestId"])["state"], "expired");
            } else {
                assert_eq!(service.cancel(json!({"requestId":started["requestId"]})).unwrap()["state"], "cancelled");
            }
            let after = host.with_service(|s| s.read()).unwrap().unwrap();
            assert_eq!(before, after, "cancelled test must never publish evidence");
            assert!(!after.profiles[0].compatibility_ready());
            server.join().unwrap();
            assert!(service.shutdown());
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
            // Fixture construction is unrelated to the cancellation deadline.
            // Prepare before starting the stalled socket; keep the host session
            // unopened so the request still captures None and open_path expires it.
            let project_root = project.then(|| {
                let fixture =
                    LifecycleService::prepare_source_foundation_probe(root.path().join("fixture"))
                        .unwrap();
                fixture.ai_data_root().join("synthetic-project")
            });
            let service = Arc::new(Service::default());
            let (received, server) = accept(listener);
            let started = service.send_fixture(&host, input).unwrap();
            received.recv_timeout(Duration::from_secs(2)).unwrap();
            if project {
                // The active request captured None; opening a real synthetic project invalidates it.
                host.with_service(|s| s.open_path(project_root.as_ref().unwrap()))
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
                let mut socket = generation_socket(&listener);
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
                let mut socket = generation_socket(&listener);
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
    #[test]
    fn model_readiness_refusal_publishes_diagnosis_without_generation_or_provider_details() {
        let (listener, port) = stalled();
        let (_root, host, input) = setup(port);
        let service = Arc::new(Service::default());
        let (finished, finished_rx) = std::sync::mpsc::channel();
        let server = thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            socket.set_read_timeout(Some(Duration::from_secs(2))).unwrap();
            let mut bytes = Vec::new(); let mut b = [0;4096];
            while !bytes.windows(4).any(|w| w == b"\r\n\r\n") {
                let n = socket.read(&mut b).unwrap(); assert!(n > 0); bytes.extend_from_slice(&b[..n]);
            }
            assert!(String::from_utf8_lossy(&bytes).starts_with("GET /api/inference/status "));
            let body = br#"{"active_model":"synthetic-model","model_identifier":"synthetic-model","loaded":["synthetic-model"],"loading":[],"context_length":512,"private_error":"untrusted-provider-private-path"}"#;
            write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).unwrap(); socket.write_all(body).unwrap(); drop(socket);
            finished_rx.recv_timeout(Duration::from_secs(2)).unwrap();
            listener.set_nonblocking(true).unwrap();
            assert!(matches!(listener.accept(), Err(e) if e.kind() == std::io::ErrorKind::WouldBlock));
        });
        let started = service.send_fixture(&host,input).unwrap();
        let done = finish(&service,&host,&started["requestId"]);
        assert_eq!(done["state"],"failed"); assert_eq!(done["category"],"model_context_insufficient");
        assert_eq!(done["requestedContext"],4096); assert_eq!(done["modelReadiness"],Value::Null);
        assert_eq!(done["completion"],Value::Null); assert_eq!(done["httpStatus"],Value::Null);
        assert!(!done.to_string().contains("untrusted-provider-private-path"));
        finished.send(()).unwrap(); server.join().unwrap(); assert!(service.shutdown());
    }

    #[test]
    fn model_settings_refuse_active_generation_before_credentials_without_cancelling_it() {
        let (listener, port) = stalled();
        let (_root, host, input) = setup(port);
        let service = Arc::new(Service::default());
        let started = service.send_fixture(&host, input.clone()).unwrap();
        let target = json!({"token":input["token"],"profileId":input["profileId"]});
        for apply in [false, true] {
            let result = service.model_settings_with_reader(&host, target.clone(), apply, |_, _| {
                panic!("Busy refusal must precede credential access")
            });
            assert!(result.unwrap_err().contains("No request was cancelled"));
            let state = service.state.lock().unwrap();
            assert!(!state.pending.as_ref().unwrap().cancel.cancelled());
            assert!(state.model_settings.is_none());
        }
        service.cancel(json!({"requestId":started["requestId"]})).unwrap();
        drop(listener);
        assert!(service.shutdown());
    }

    #[test]
    fn model_settings_owner_blocks_generation_and_cancels_on_profile_change_or_shutdown() {
        for shutdown in [false, true] {
            let service = Arc::new(Service::default());
            let cancel = Cancel::default();
            let guard = service.begin_model_settings(&cancel).unwrap();
            assert_eq!(service.active_workers(), 1);
            assert!(service.begin_model_settings(&Cancel::default()).is_err());
            let (_root, host, input) = setup(45678);
            let refused = service.send_with_reader(&host, input, false, |_, _| {
                panic!("Management owner must block sends before credential access")
            });
            assert!(refused.unwrap_err().contains("Configuration or project is changing"));
            if shutdown {
                let owner = service.clone();
                let thread = thread::spawn(move || owner.shutdown());
                // Cancellation is an explicit signal, not an assumed elapsed interval.
                let deadline = Instant::now() + Duration::from_secs(1);
                while !cancel.cancelled() {
                    assert!(Instant::now() < deadline);
                    thread::yield_now();
                }
                drop(guard);
                assert!(thread.join().unwrap());
            } else {
                let change = service.change();
                assert!(cancel.cancelled());
                drop(change);
                assert_eq!(service.state.lock().unwrap().changing, 1);
                drop(guard);
                assert_eq!(service.state.lock().unwrap().changing, 0);
                assert!(service.shutdown());
            }
            assert_eq!(service.active_workers(), 0);
        }
    }

    #[test]
    fn model_settings_stale_or_untyped_targets_never_read_credentials_or_write_profiles() {
        let (_root, host, input) = setup(45678);
        let service = Arc::new(Service::default());
        let before = host.with_service(|records| records.read().unwrap()).unwrap();
        for payload in [
            json!({"token":"stale","profileId":input["profileId"]}),
            json!({"token":input["token"],"profileId":input["profileId"],"url":"http://untrusted.invalid"}),
        ] {
            assert!(service.model_settings_with_reader(&host, payload, true, |_, _| {
                panic!("Invalid target must refuse before credential access")
            }).is_err());
            assert_eq!(service.active_workers(), 0);
            assert_eq!(service.state.lock().unwrap().changing, 0);
            assert_eq!(host.with_service(|records| records.read().unwrap()).unwrap(), before);
        }
        assert!(service.shutdown());
    }

}
