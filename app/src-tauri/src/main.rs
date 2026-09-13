use loomlight_core::handle_request;
use serde_json::{json, Value};
use std::{
    io::Write,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::{Manager, WebviewUrl};

static SMOKE_REPORT_RECEIVED: AtomicBool = AtomicBool::new(false);
static POPUP_DENIAL_OBSERVED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn core_request(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
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
    let response = handle_request(request, smoke_enabled);
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
                println!(
                    "{}",
                    json!({
                        "evidence": "production-packaged-boundary",
                        "navigationDenied": navigation_denied,
                        "popupDenied": popup_denied,
                        "webviewRestrictionsPassed": popup_denied,
                        "targetOs": std::env::consts::OS,
                        "targetArch": std::env::consts::ARCH
                    })
                );
                let _ = std::io::stdout().flush();
                std::process::exit(if navigation_denied && popup_denied {
                    0
                } else {
                    1
                });
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
        .setup(move |app| {
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

            if std::env::var("LOOMLIGHT_SCAFFOLD_SMOKE").as_deref() == Ok("1") {
                let denied = Arc::clone(&unauthorised_denied);
                let unauthorised = tauri::WebviewWindowBuilder::new(
                    app,
                    "unauthorised-probe",
                    WebviewUrl::App("index.html".into()),
                )
                .visible(false)
                .on_page_load(|window, _| {
                    let _ = window.eval(include_str!("unauthorised_probe.js"));
                })
                .on_navigation(move |url| {
                    if url.host_str() == Some("permission-denied.invalid") {
                        denied.store(true, Ordering::SeqCst);
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
                    thread::sleep(Duration::from_millis(650));
                    main.eval(&format!(
                        "window.__loomlightUnauthorisedDenied = {};",
                        denied_for_probe.load(Ordering::SeqCst)
                    ))
                    .expect("probe state injection must succeed");
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
