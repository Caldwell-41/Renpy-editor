use loomlight_core::{
    handle_application_request, lifecycle::LifecycleService, validate_request, CoreResponse,
};
use serde_json::{json, Value};
use std::{
    io::Write,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Condvar, Mutex, OnceLock,
    },
    thread,
    time::Duration,
};
use tauri::{Manager, WebviewUrl};

struct DesktopState(Mutex<Option<LifecycleService>>);

static SMOKE_REPORT_RECEIVED: AtomicBool = AtomicBool::new(false);
static POPUP_DENIAL_OBSERVED: AtomicBool = AtomicBool::new(false);
static UNAUTHORISED_ALLOW_OBSERVED: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_RECEIVED: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_WINDOW_FOUND: AtomicBool = AtomicBool::new(false);
static SECOND_INSTANCE_SIGNAL: OnceLock<(Mutex<bool>, Condvar)> = OnceLock::new();

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
    let smoke_enabled = std::env::var("LOOMLIGHT_SCAFFOLD_SMOKE").as_deref() == Ok("1");
    let is_smoke_report =
        request.get("operation").and_then(Value::as_str) == Some("probe.smokeReport");
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
    let response = {
        let validated = match validate_request(&request) {
            Ok(value) => value,
            Err(response) => return Ok(response),
        };
        let request_id = validated.request_id.clone();
        let operation = validated.operation.to_owned();
        let payload_empty = validated.payload.is_empty();
        let session_id = validated
            .payload
            .get("sessionId")
            .and_then(Value::as_str)
            .map(str::to_owned);
        let mut guard = state
            .0
            .lock()
            .map_err(|_| "Desktop lifecycle state is unavailable.")?;
        let lifecycle = guard
            .as_mut()
            .ok_or("Desktop lifecycle state is unavailable.")?;
        match operation.as_str() {
            "project.chooseParent" if payload_empty => match rfd::FileDialog::new()
                .set_title("Choose project location")
                .pick_folder()
            {
                Some(path) => match lifecycle.register_parent(&path) {
                    Ok(choice) => CoreResponse::success(
                        request_id,
                        serde_json::to_value(choice).unwrap_or(Value::Null),
                    ),
                    Err(_) => CoreResponse::failure(
                        request_id,
                        "INVALID_PARENT",
                        "Choose an existing safe parent folder.",
                    ),
                },
                None => CoreResponse::success(request_id, json!({ "cancelled": true })),
            },
            "sdk.browse" if payload_empty => match rfd::FileDialog::new()
                .set_title("Choose Ren'Py 8.5.3 SDK")
                .pick_folder()
            {
                Some(path) => match lifecycle.register_sdk(&path, "browsed") {
                    Ok(sdk) => CoreResponse::success(
                        request_id,
                        serde_json::to_value(sdk).unwrap_or(Value::Null),
                    ),
                    Err(_) => CoreResponse::failure(
                        request_id,
                        "UNSUPPORTED_SDK",
                        "The selected folder is not a supported Ren'Py SDK.",
                    ),
                },
                None => CoreResponse::success(request_id, json!({ "cancelled": true })),
            },
            "project.openPicker" if payload_empty => match rfd::FileDialog::new()
                .set_title("Open Loomlight project")
                .pick_folder()
            {
                Some(path) => match lifecycle.open_path(&path) {
                    Ok(project) => CoreResponse::success(
                        request_id,
                        serde_json::to_value(project).unwrap_or(Value::Null),
                    ),
                    Err(error) => loomlight_core::lifecycle_failure(request_id, error),
                },
                None => CoreResponse::success(request_id, json!({ "cancelled": true })),
            },
            "asset.chooseImport"
                if validated.payload.len() == 1 && session_id.as_deref().is_some() =>
            {
                let session_id = session_id.expect("guarded session id");
                if let Err(error) = lifecycle.require_session(&session_id) {
                    return Ok(loomlight_core::lifecycle_failure(request_id, error));
                }
                match rfd::FileDialog::new()
                    .set_title("Choose image or audio asset")
                    .add_filter(
                        "Supported media",
                        &["png", "jpg", "jpeg", "webp", "ogg", "mp3", "wav", "flac"],
                    )
                    .pick_file()
                {
                    Some(path) => match lifecycle.authoring_select_import(&path) {
                        Ok(choice) => CoreResponse::success(
                            request_id,
                            serde_json::to_value(choice).unwrap_or(Value::Null),
                        ),
                        Err(error) => loomlight_core::lifecycle_failure(request_id, error),
                    },
                    None => CoreResponse::success(request_id, json!({ "cancelled": true })),
                }
            }
            "project.chooseParent" | "sdk.browse" | "project.openPicker" | "asset.chooseImport" => {
                CoreResponse::failure(
                    request_id,
                    "INVALID_PAYLOAD",
                    "Payload does not match the operation schema.",
                )
            }
            _ => handle_application_request(request, smoke_enabled, lifecycle),
        }
    };
    if smoke_enabled && is_smoke_report && response.is_success() {
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
                    {
                        0
                    } else {
                        1
                    },
                );
            });
        }
    } else if smoke_enabled && is_smoke_report {
        SMOKE_REPORT_RECEIVED.store(true, Ordering::SeqCst);
        eprintln!(
            "packaged boundary smoke report rejected: {}",
            smoke_payload.unwrap_or(Value::Null)
        );
        let _ = std::io::stderr().flush();
        thread::spawn(|| {
            thread::sleep(Duration::from_millis(100));
            std::process::exit(1);
        });
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
            let lifecycle = LifecycleService::new(data_root)
                .map_err(|_| "project lifecycle service could not start")?;
            *app.state::<DesktopState>()
                .0
                .lock()
                .map_err(|_| "project lifecycle state is unavailable")? = Some(lifecycle);
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
                    thread::sleep(Duration::from_secs(20));
                    if !SMOKE_REPORT_RECEIVED.load(Ordering::SeqCst) {
                        eprintln!("packaged boundary smoke report timed out");
                        std::process::exit(1);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![core_request])
        .run(tauri::generate_context!())
        .expect("Loomlight desktop runtime failed");
}
