use loomlight_core::{
    dispatch::ApplicationHost, lifecycle::LifecycleService, validate_request, CoreResponse,
};
use serde_json::{json, Value};
use std::{
    io::Write,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Condvar, Mutex, OnceLock,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::{Manager, WebviewUrl};

struct DesktopState(Mutex<Option<ApplicationHost>>);

static APPLICATION_CLOSE_CONFIRMED: AtomicBool = AtomicBool::new(false);

static SMOKE_REPORT_RECEIVED: AtomicBool = AtomicBool::new(false);
static POPUP_DENIAL_OBSERVED: AtomicBool = AtomicBool::new(false);
static UNAUTHORISED_ALLOW_OBSERVED: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_RECEIVED: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_WINDOW_FOUND: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_SIGNAL: OnceLock<(Mutex<bool>, Condvar)> = OnceLock::new();
static SMOKE_STARTED: OnceLock<Instant> = OnceLock::new();
const PACKAGED_SMOKE_TIMEOUT: Duration = Duration::from_secs(300);

#[derive(Debug, PartialEq, Eq)]
enum SmokeReportDisposition {
    Ignore,
    Accepted,
    Rejected,
}

fn smoke_report_disposition(
    smoke_enabled: bool,
    is_smoke_report: bool,
    response: &CoreResponse,
) -> SmokeReportDisposition {
    if !smoke_enabled || !is_smoke_report {
        SmokeReportDisposition::Ignore
    } else if response.is_success() {
        SmokeReportDisposition::Accepted
    } else {
        SmokeReportDisposition::Rejected
    }
}

fn terminate_rejected_smoke_report(response: &CoreResponse) {
    SMOKE_REPORT_RECEIVED.store(true, Ordering::SeqCst);
    let diagnostic =
        serde_json::to_string(response).unwrap_or_else(|_| "{\"ok\":false}".to_owned());
    eprintln!("packaged boundary smoke report rejected: {diagnostic}");
    let _ = std::io::stderr().flush();
    thread::spawn(|| {
        thread::sleep(Duration::from_millis(100));
        std::process::exit(1);
    });
}

fn single_instance_smoke_enabled() -> bool {
    std::env::var("LOOMLIGHT_SINGLE_INSTANCE_SMOKE").as_deref() == Ok("1")
}

fn second_instance_signal() -> &'static (Mutex<bool>, Condvar) {
    SECOND_INSTANCE_SIGNAL.get_or_init(|| (Mutex::new(false), Condvar::new()))
}

fn activate_primary(app: &tauri::AppHandle) -> bool {
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    true
}

fn handle_second_instance(app: &tauri::AppHandle) {
    SECOND_INSTANCE_RECEIVED.store(true, Ordering::SeqCst);
    SECOND_INSTANCE_WINDOW_FOUND.store(activate_primary(app), Ordering::SeqCst);
    let (received, ready) = second_instance_signal();
    if let Ok(mut received) = received.lock() {
        *received = true;
        ready.notify_all();
    }
    if single_instance_smoke_enabled() {
        println!(
            "{}",
            json!({
                "evidence": "single-instance-secondary-rejected",
                "primaryWindowFound": SECOND_INSTANCE_WINDOW_FOUND.load(Ordering::SeqCst)
            })
        );
        let _ = std::io::stdout().flush();
    }
}

fn scripted_smoke_exit() -> bool {
    std::env::var("LOOMLIGHT_SCAFFOLD_SMOKE").as_deref() == Ok("1")
}

#[tauri::command(async)]
fn complete_application_close(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    state: tauri::State<'_, DesktopState>,
) -> Result<(), &'static str> {
    if window.label() != "main" {
        return Err("Unauthorised window.");
    }
    let host = state
        .0
        .lock()
        .map_err(|_| "Service unavailable.")?
        .clone()
        .ok_or("Service unavailable.")?;
    if !host.with_service(|service| service.current().is_none())? {
        return Err("Close the project through its runtime and draft flow first.");
    }
    if !host.shutdown() {
        return Err("Runtime cleanup is incomplete.");
    }
    APPLICATION_CLOSE_CONFIRMED.store(true, Ordering::SeqCst);
    app.exit(0);
    Ok(())
}

#[tauri::command(async)]
fn core_request(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    state: tauri::State<'_, DesktopState>,
    request: Value,
) -> Result<loomlight_core::CoreResponse, &'static str> {
    if window.label() != "main" {
        return Err("Command is not authorised for this window.");
    }
    if std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").is_ok()
        && request.get("operation").and_then(Value::as_str) == Some("probe.runtimeUiReport")
    {
        let payload = request.get("payload").cloned().unwrap_or(Value::Null);
        if !payload.is_object() || payload.to_string().len() > 32 * 1024 {
            return Err("Invalid bounded probe report.");
        }
        let passed = payload.get("passed").and_then(Value::as_bool) == Some(true);
        let host = state
            .0
            .lock()
            .map_err(|_| "probe state")?
            .clone()
            .ok_or("probe host")?;
        let cleaned = host.shutdown();
        println!(
            "{}",
            json!({"evidence":"runtime-ui-packaged", "case":std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE").unwrap(), "passed":passed && cleaned, "cleanupComplete":cleaned, "details":payload})
        );
        let _ = std::io::stdout().flush();
        let code = if passed && cleaned { 0 } else { 1 };
        // Terminate after the report is flushed and owned process cleanup is confirmed.
        thread::spawn(move || {
            thread::sleep(Duration::from_millis(100));
            std::process::exit(code);
        });
        return Ok(CoreResponse::success(
            "runtime-ui-report".into(),
            json!({"recorded":true}),
        ));
    }
    let smoke_enabled = std::env::var("LOOMLIGHT_SCAFFOLD_SMOKE").as_deref() == Ok("1");
    let operation = request.get("operation").and_then(Value::as_str);
    if smoke_enabled && operation == Some("probe.smokeCheckpoint") {
        let request_id = request
            .get("requestId")
            .and_then(Value::as_str)
            .unwrap_or("smoke-checkpoint")
            .to_owned();
        let stage = request
            .get("payload")
            .and_then(|payload| payload.get("stage"))
            .and_then(Value::as_str)
            .filter(|stage| !stage.is_empty() && stage.len() <= 128)
            .unwrap_or("invalid");
        let elapsed_ms = SMOKE_STARTED
            .get()
            .map(|started| started.elapsed().as_millis() as u64)
            .unwrap_or(0);
        println!(
            "{}",
            json!({
                "evidence": "packaged-smoke-checkpoint",
                "stage": stage,
                "elapsedMs": elapsed_ms
            })
        );
        let _ = std::io::stdout().flush();
        return Ok(loomlight_core::CoreResponse::success(
            request_id,
            json!({ "recorded": true }),
        ));
    }
    let is_smoke_report = operation == Some("probe.smokeReport");
    let smoke_payload = is_smoke_report
        .then(|| request.get("payload").cloned())
        .flatten();
    let supporting_authoring_ui_passed = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("supportingAuthoringUiPassed"))
        .and_then(Value::as_bool)
        == Some(true);
    let supporting_authoring_stage = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("supportingAuthoringStage"))
        .and_then(Value::as_str)
        .unwrap_or("missing")
        .to_owned();
    let scene_authoring_ui_passed = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sceneAuthoringUiPassed"))
        .and_then(Value::as_bool)
        == Some(true);
    let scene_authoring_stage = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sceneAuthoringStage"))
        .and_then(Value::as_str)
        .unwrap_or("missing")
        .to_owned();
    let source_authoring_ui_passed = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sourceAuthoringUiPassed"))
        .and_then(Value::as_bool)
        == Some(true);
    let source_authoring_stage = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sourceAuthoringStage"))
        .and_then(Value::as_str)
        .unwrap_or("missing")
        .to_owned();
    let source_command_trace_passed = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sourceCommandTracePassed"))
        .and_then(Value::as_bool)
        == Some(true);
    let source_command_trace = smoke_payload
        .as_ref()
        .and_then(|payload| payload.get("sourceCommandTrace"))
        .and_then(Value::as_str)
        .unwrap_or("missing")
        .to_owned();
    let response = {
        let validated = match validate_request(&request) {
            Ok(value) => value,
            Err(response) => {
                if smoke_enabled && is_smoke_report {
                    terminate_rejected_smoke_report(&response);
                }
                return Ok(response);
            }
        };
        let request_id = validated.request_id.clone();
        let operation = validated.operation.to_owned();
        let payload_empty = validated.payload.is_empty();
        let session_id = validated
            .payload
            .get("sessionId")
            .and_then(Value::as_str)
            .map(str::to_owned);
        let host = state
            .0
            .lock()
            .map_err(|_| "Desktop lifecycle state is unavailable.")?
            .as_ref()
            .cloned()
            .ok_or("Desktop lifecycle state is unavailable.")?;
        if matches!(
            operation.as_str(),
            "project.chooseParent" | "sdk.browse" | "project.openPicker" | "asset.chooseImport"
        ) {
            let asset = operation == "asset.chooseImport";
            if !(if asset {
                validated.payload.len() == 1 && session_id.is_some()
            } else {
                payload_empty
            }) {
                return Ok(CoreResponse::failure(
                    request_id,
                    "INVALID_PAYLOAD",
                    "Payload does not match the operation schema.",
                ));
            }
            let before = host
                .with_service(|service| {
                    if asset {
                        service.require_session(session_id.as_ref().unwrap())?;
                    }
                    Ok::<_, loomlight_core::lifecycle::LifecycleError>(
                        service.current().map(|p| p.session_id),
                    )
                })
                .map_err(|_| "Another request is in progress.")?;
            let before = match before {
                Ok(session) => session,
                Err(error) => return Ok(loomlight_core::lifecycle_failure(request_id, error)),
            };
            // Native UI never owns the lifecycle service while waiting for a choice.
            let path = match operation.as_str() {
                "asset.chooseImport" => rfd::FileDialog::new()
                    .set_title("Choose image or audio asset")
                    .add_filter(
                        "Supported media",
                        &["png", "jpg", "jpeg", "webp", "ogg", "mp3", "wav", "flac"],
                    )
                    .pick_file(),
                "project.chooseParent" => rfd::FileDialog::new()
                    .set_title("Choose project location")
                    .pick_folder(),
                "sdk.browse" => rfd::FileDialog::new()
                    .set_title("Choose Ren'Py 8.5.3 SDK")
                    .pick_folder(),
                _ => rfd::FileDialog::new()
                    .set_title("Open Loomlight project")
                    .pick_folder(),
            };
            host.complete_dialog(request_id.clone(), before, |lifecycle| {
                let Some(path) = path else {
                    return CoreResponse::success(request_id.clone(), json!({"cancelled": true}));
                };
                let result = match operation.as_str() {
                    "project.chooseParent" => lifecycle
                        .register_parent(&path)
                        .map(|v| serde_json::to_value(v).unwrap()),
                    "sdk.browse" => lifecycle
                        .register_sdk(&path, "browsed")
                        .map(|v| serde_json::to_value(v).unwrap()),
                    "project.openPicker" => lifecycle
                        .open_path(&path)
                        .map(|v| serde_json::to_value(v).unwrap()),
                    _ => lifecycle
                        .require_session(session_id.as_ref().unwrap())
                        .and_then(|_| lifecycle.authoring_select_import(&path))
                        .map(|v| serde_json::to_value(v).unwrap()),
                };
                match result {
                    Ok(value) => CoreResponse::success(request_id.clone(), value),
                    Err(error) => loomlight_core::lifecycle_failure(request_id.clone(), error),
                }
            })
            .unwrap_or_else(|_| {
                CoreResponse::failure(
                    request_id,
                    "RUNTIME_BUSY",
                    "Another request is in progress.",
                )
            })
        } else {
            host.dispatch(request, smoke_enabled)
        }
    };
    let report_disposition = smoke_report_disposition(smoke_enabled, is_smoke_report, &response);
    if report_disposition == SmokeReportDisposition::Accepted {
        SMOKE_REPORT_RECEIVED.store(true, Ordering::SeqCst);
        if let Some(window) = app.get_webview_window("main") {
            let original_url = window.url().ok();
            let _ = window.eval("location.href = 'https://example.invalid/loomlight-navigation'");
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(500));
                let navigation_denied =
                    original_url.is_some_and(|url| window.url().ok().as_ref() == Some(&url));
                let popup_denied = POPUP_DENIAL_OBSERVED.load(Ordering::SeqCst);
                let single_instance_required = single_instance_smoke_enabled();
                let single_instance_received = if single_instance_required {
                    let (received, ready) = second_instance_signal();
                    received.lock().ok().and_then(|received| {
                        ready
                            .wait_timeout_while(received, Duration::from_secs(10), |value| !*value)
                            .ok()
                            .map(|(value, _)| *value)
                    }) == Some(true)
                } else {
                    true
                };
                let primary_window_found = SECOND_INSTANCE_WINDOW_FOUND.load(Ordering::SeqCst);
                let single_instance_passed =
                    !single_instance_required || (single_instance_received && primary_window_found);
                println!(
                    "{}",
                    json!({
                        "evidence": "production-packaged-boundary",
                        "navigationDenied": navigation_denied,
                        "popupDenied": popup_denied,
                        "webviewRestrictionsPassed": popup_denied,
                        "lifecycleUiPassed": true,
                        "supportingAuthoringUiPassed": supporting_authoring_ui_passed,
                        "supportingAuthoringStage": supporting_authoring_stage,
                        "sceneAuthoringUiPassed": scene_authoring_ui_passed,
                        "sceneAuthoringStage": scene_authoring_stage,
                        "sourceAuthoringUiPassed": source_authoring_ui_passed,
                        "sourceAuthoringStage": source_authoring_stage,
                        "sourceCommandTracePassed": source_command_trace_passed,
                        "sourceCommandTrace": source_command_trace,
                        "singleInstancePassed": single_instance_passed,
                        "targetOs": std::env::consts::OS,
                        "targetArch": std::env::consts::ARCH
                    })
                );
                let _ = std::io::stdout().flush();
                std::process::exit(
                    if navigation_denied
                        && popup_denied
                        && single_instance_passed
                        && supporting_authoring_ui_passed
                        && scene_authoring_ui_passed
                        && source_authoring_ui_passed
                        && source_command_trace_passed
                    {
                        0
                    } else {
                        1
                    },
                );
            });
        }
    } else if report_disposition == SmokeReportDisposition::Rejected {
        terminate_rejected_smoke_report(&response);
    }
    Ok(response)
}

fn main() {
    let unauthorised_denied = Arc::new(AtomicBool::new(false));
    tauri::Builder::default()
        // This must remain the first plugin: it rejects a losing process before
        // `setup` can construct the sole writable `LifecycleService`.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            handle_second_instance(app);
        }))
        .manage(DesktopState(Mutex::new(None)))
        .setup(move |app| {
            let data_root = app
                .path()
                .app_data_dir()
                .map_err(|_| "application data path is unavailable")?;
            let lifecycle = if let Ok(case) = std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE") {
                let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE").ok_or("probe SDK archive required")?;
                let data = std::env::temp_dir().join(format!("loomlight-r2-probe-{}-{}",std::process::id(),case));
                if data.exists() { return Err("probe destination already exists".into()); }
                LifecycleService::prepare_runtime_ui_probe(data, std::path::Path::new(&archive), &case).map_err(std::io::Error::other)?
            } else { LifecycleService::new(data_root).map_err(|_| "project lifecycle service could not start")? };
            *app.state::<DesktopState>()
                .0
                .lock()
                .map_err(|_| "project lifecycle state is unavailable")? = Some(ApplicationHost::new(lifecycle));
            let config = app
                .config()
                .app
                .windows
                .first()
                .expect("main window configuration is required")
                .clone();
            tauri::WebviewWindowBuilder::from_config(app, &config)
                .expect("main window configuration must be valid")
                .on_navigation(|url| {
                    url.scheme() == "tauri"
                        || (matches!(url.scheme(), "http" | "https")
                            && url.host_str() == Some("tauri.localhost"))
                })
                .on_new_window(|_, _| {
                    POPUP_DENIAL_OBSERVED.store(true, Ordering::SeqCst);
                    tauri::webview::NewWindowResponse::Deny
                })
                .build()
                .expect("main window must be created");

            if SECOND_INSTANCE_RECEIVED.load(Ordering::SeqCst) {
                SECOND_INSTANCE_WINDOW_FOUND
                    .store(activate_primary(app.handle()), Ordering::SeqCst);
            }
            if single_instance_smoke_enabled() {
                println!(
                    "{}",
                    json!({
                        "evidence": "single-instance-primary-ready",
                        "lifecycleOwnerPid": std::process::id()
                    })
                );
                let _ = std::io::stdout().flush();
            }

            if let Ok(case) = std::env::var("LOOMLIGHT_RUNTIME_UI_PROBE") {
                let main = app.get_webview_window("main").ok_or("probe main window missing")?;
                if case == "route-b" { main.set_size(tauri::LogicalSize::new(640.0,720.0)).map_err(std::io::Error::other)?; }
                let probe_host = app.state::<DesktopState>().0.lock().unwrap().clone().ok_or("probe host missing")?;
                let started = Instant::now();
                thread::spawn(move || {
                    thread::sleep(Duration::from_secs(2));
                    main.eval(&format!("window.__loomlightRuntimeProbeCase = {};",serde_json::to_string(&case).unwrap())).expect("probe case");
                    main.eval(include_str!("runtime_ui_probe.js")).expect("runtime probe injection");
                    while started.elapsed() < Duration::from_secs(300) { thread::sleep(Duration::from_secs(1)); }
                    let cleaned = probe_host.shutdown();
                    println!("{}",json!({"evidence":"runtime-ui-packaged","case":case,"passed":false,"cleanupComplete":cleaned,"details":{"stage":"native-watchdog","timedOut":true}}));
                    let _ = std::io::stdout().flush();
                    std::process::exit(1);
                });
            }
            if std::env::var("LOOMLIGHT_SCAFFOLD_SMOKE").as_deref() == Ok("1") {
                let denied = Arc::clone(&unauthorised_denied);
                let unauthorised = tauri::WebviewWindowBuilder::new(
                    app,
                    "unauthorised-probe",
                    WebviewUrl::App("index.html".into()),
                )
                .visible(false)
                .initialization_script(include_str!("unauthorised_probe.js"))
                .on_navigation(move |url| {
                    if url.host_str() == Some("permission-denied.invalid") {
                        denied.store(true, Ordering::SeqCst);
                        return false;
                    }
                    if url.host_str() == Some("permission-allowed.invalid") {
                        UNAUTHORISED_ALLOW_OBSERVED.store(true, Ordering::SeqCst);
                        return false;
                    }
                    url.scheme() == "tauri"
                        || (matches!(url.scheme(), "http" | "https")
                            && url.host_str() == Some("tauri.localhost"))
                })
                .on_new_window(|_, _| tauri::webview::NewWindowResponse::Deny)
                .build()
                .expect("unauthorised probe window must be created");
                drop(unauthorised);

                let _ = SMOKE_STARTED.set(Instant::now());
                let main = app
                    .get_webview_window("main")
                    .expect("main probe window must exist");
                let denied_for_probe = Arc::clone(&unauthorised_denied);
                thread::spawn(move || {
                    for _ in 0..50 {
                        if denied_for_probe.load(Ordering::SeqCst)
                            || UNAUTHORISED_ALLOW_OBSERVED.load(Ordering::SeqCst)
                        {
                            break;
                        }
                        thread::sleep(Duration::from_millis(100));
                    }
                    main.eval(&format!(
                        "window.__loomlightUnauthorisedDenied = {};",
                        denied_for_probe.load(Ordering::SeqCst)
                    ))
                    .expect("probe state injection must succeed");
                    main.eval(
                        "Object.defineProperty(window, '__loomlightScaffoldSmokeMode', { value: true, configurable: false, enumerable: false, writable: false });",
                    )
                    .expect("smoke mode injection must succeed");
                    main.eval(include_str!("smoke_probe.js"))
                        .expect("main smoke probe injection must succeed");
                });
                thread::spawn(|| {
                    thread::sleep(PACKAGED_SMOKE_TIMEOUT);
                    if !SMOKE_REPORT_RECEIVED.load(Ordering::SeqCst) {
                        eprintln!("packaged boundary smoke report timed out");
                        let _ = std::io::stderr().flush();
                        std::process::exit(1);
                    }
                });
            }
            Ok(())
        })
        .on_window_event(|window,event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" && !scripted_smoke_exit() && !APPLICATION_CLOSE_CONFIRMED.load(Ordering::SeqCst) {
                    api.prevent_close();
                    if let Some(main)=window.app_handle().get_webview_window("main") {
                        let _=main.eval("window.__loomlightRequestApplicationClose?.()");
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![core_request, complete_application_close])
        .build(tauri::generate_context!())
        .expect("Loomlight desktop runtime failed")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = &event {
                if !scripted_smoke_exit() && !APPLICATION_CLOSE_CONFIRMED.load(Ordering::SeqCst) {
                    api.prevent_exit();
                    if let Some(main)=app.get_webview_window("main") {
                        let _=main.eval("window.__loomlightRequestApplicationClose?.()");
                    }
                }
            }
            if matches!(event, tauri::RunEvent::Exit) {
                let host = app.state::<DesktopState>().0.lock().ok().and_then(|state| state.clone());
                if let Some(host) = host { host.shutdown(); }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_successful_smoke_reports_enter_the_accepted_path() {
        let accepted = CoreResponse::success("accepted".to_owned(), json!({ "accepted": true }));
        let rejected = CoreResponse::failure(
            "rejected".to_owned(),
            "INVALID_PAYLOAD",
            "Payload does not match the operation schema.",
        );

        assert_eq!(
            smoke_report_disposition(true, true, &accepted),
            SmokeReportDisposition::Accepted
        );
        assert_eq!(
            smoke_report_disposition(true, true, &rejected),
            SmokeReportDisposition::Rejected
        );
        assert_eq!(
            smoke_report_disposition(false, true, &accepted),
            SmokeReportDisposition::Ignore
        );
        assert_eq!(
            smoke_report_disposition(true, false, &accepted),
            SmokeReportDisposition::Ignore
        );
    }
}
