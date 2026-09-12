use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Component, Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{atomic::{AtomicU64, Ordering}, mpsc, Arc, Mutex},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager};

const MAX_TEXT_BYTES: usize = 2_000_000;
const MAX_PROCESS_BYTES: usize = 65_536;
const MIN_TIMEOUT_MS: u64 = 10;
const MAX_TIMEOUT_MS: u64 = 30_000;
static NEXT_RUN_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Default)]
struct SpikeState {
    watchers: Mutex<HashMap<String, RecommendedWatcher>>,
    runs: Arc<Mutex<HashMap<String, mpsc::Sender<()>>>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopRequest {
    operation: String,
    root: Option<String>,
    relative_path: Option<String>,
    expected_sha256: Option<String>,
    contents: Option<String>,
    command: Option<String>,
    args: Option<Vec<String>>,
    run_id: Option<String>,
    timeout_ms: Option<u64>,
    security_results: Option<Value>,
    ui_results: Option<Value>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
enum ProcessEvent {
    #[serde(rename = "stdout")]
    Stdout { run_id: String, text: String },
    #[serde(rename = "stderr")]
    Stderr { run_id: String, text: String },
    #[serde(rename = "terminal")]
    Terminal { run_id: String, reason: String, code: Option<i32>, signal: Option<String> },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileVersion {
    relative_path: String,
    contents: String,
    sha256: String,
}

fn sha256(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn request_path(request: &DesktopRequest, must_exist: bool) -> Result<(PathBuf, String), String> {
    let root_input = request.root.as_deref().ok_or("root is required")?;
    let relative = request.relative_path.as_deref().ok_or("relativePath is required")?;
    if relative.contains('\\') || Path::new(relative).is_absolute() {
        return Err("relativePath must use project-relative forward slashes".into());
    }
    if Path::new(relative).components().any(|part| !matches!(part, Component::Normal(_))) {
        return Err("relativePath is not normalized".into());
    }
    let root = fs::canonicalize(root_input).map_err(|_| "project root is unavailable")?;
    let candidate = root.join(relative);
    let parent = fs::canonicalize(candidate.parent().ok_or("file has no parent")?)
        .map_err(|_| "file parent is unavailable")?;
    if !parent.starts_with(&root) {
        return Err("path escapes project root".into());
    }
    if must_exist {
        let target = fs::canonicalize(&candidate).map_err(|_| "file is unavailable")?;
        if !target.starts_with(&root) {
            return Err("path escapes project root".into());
        }
        return Ok((target, relative.to_owned()));
    }
    if fs::symlink_metadata(&candidate).is_ok_and(|meta| meta.file_type().is_symlink()) {
        return Err("symbolic-link targets are denied".into());
    }
    Ok((candidate, relative.to_owned()))
}

fn read_text(request: &DesktopRequest) -> Result<FileVersion, String> {
    let (target, relative_path) = request_path(request, true)?;
    let bytes = fs::read(target).map_err(|_| "file could not be read")?;
    let contents = String::from_utf8(bytes.clone()).map_err(|_| "file is not UTF-8")?;
    Ok(FileVersion { relative_path, contents, sha256: sha256(&bytes) })
}

#[cfg(not(windows))]
fn replace_file(temporary: &Path, target: &Path) -> Result<(), String> {
    fs::rename(temporary, target).map_err(|_| "atomic replacement failed".into())
}

#[cfg(windows)]
fn replace_file(temporary: &Path, target: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::ReplaceFileW;
    let target_wide: Vec<u16> = target.as_os_str().encode_wide().chain(Some(0)).collect();
    let temporary_wide: Vec<u16> = temporary.as_os_str().encode_wide().chain(Some(0)).collect();
    let result = unsafe {
        ReplaceFileW(
            target_wide.as_ptr(),
            temporary_wide.as_ptr(),
            std::ptr::null(),
            0,
            std::ptr::null(),
            std::ptr::null(),
        )
    };
    if result == 0 { Err("atomic replacement failed".into()) } else { Ok(()) }
}

fn write_text(request: &DesktopRequest) -> Result<FileVersion, String> {
    let (target, relative_path) = request_path(request, false)?;
    let contents = request.contents.as_deref().ok_or("contents is required")?;
    if contents.len() > MAX_TEXT_BYTES {
        return Err("contents exceeds the spike limit".into());
    }
    let expected = request.expected_sha256.as_deref().ok_or("expectedSha256 is required")?;
    if expected.len() != 64 || !expected.bytes().all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase()) {
        return Err("expectedSha256 is invalid".into());
    }
    let current = fs::read(&target).map_err(|_| "file could not be read")?;
    if sha256(&current) != expected {
        return Err("source changed since it was read".into());
    }
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|_| "clock unavailable")?.as_nanos();
    let temporary = target.with_file_name(format!(".{}.{}.tmp", target.file_name().unwrap_or_default().to_string_lossy(), nonce));
    let mut file = OpenOptions::new().create_new(true).write(true).open(&temporary)
        .map_err(|_| "temporary file could not be created")?;
    if let Err(error) = file.write_all(contents.as_bytes()).and_then(|_| file.sync_all()) {
        let _ = fs::remove_file(&temporary);
        return Err(format!("temporary write failed: {error}"));
    }
    drop(file);
    if let Err(error) = replace_file(&temporary, &target) {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    Ok(FileVersion { relative_path, contents: contents.to_owned(), sha256: sha256(contents.as_bytes()) })
}

fn watch_text(app: &tauri::AppHandle, state: &SpikeState, request: &DesktopRequest) -> Result<Value, String> {
    let (target, relative_path) = request_path(request, true)?;
    let key = format!("{}\0{}", request.root.as_deref().unwrap_or_default(), relative_path);
    let app_handle = app.clone();
    let event_path = relative_path.clone();
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        if event.is_ok() {
            let _ = app_handle.emit("loomlight:event", json!({ "type": "fileChanged", "relativePath": event_path }));
        }
    }).map_err(|_| "watcher could not be created")?;
    watcher.watch(&target, RecursiveMode::NonRecursive).map_err(|_| "file could not be watched")?;
    state.watchers.lock().map_err(|_| "watcher state unavailable")?.insert(key, watcher);
    Ok(json!({ "watching": true }))
}

fn watch_path<F>(target: &Path, mut changed: F) -> Result<RecommendedWatcher, String>
where F: FnMut() + Send + 'static {
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        if event.is_ok() { changed(); }
    }).map_err(|_| "watcher could not be created")?;
    watcher.watch(target, RecursiveMode::NonRecursive).map_err(|_| "file could not be watched")?;
    Ok(watcher)
}

fn unwatch_text(state: &SpikeState, request: &DesktopRequest) -> Result<Value, String> {
    let (_, relative_path) = request_path(request, true)?;
    let key = format!("{}\0{}", request.root.as_deref().unwrap_or_default(), relative_path);
    state.watchers.lock().map_err(|_| "watcher state unavailable")?.remove(&key);
    Ok(json!({ "watching": false }))
}

fn validate_mock_request(request: &DesktopRequest) -> Result<(&str, &[String], u64), String> {
    let command = request.command.as_deref().ok_or("command is required")?;
    if !matches!(command, "version" | "diagnostics" | "stderr" | "delay" | "flood") {
        return Err("mock SDK command is not allowlisted".into());
    }
    let args = request.args.as_deref().unwrap_or(&[]);
    if args.len() > 16 || args.iter().any(|arg| arg.len() > 512) {
        return Err("mock SDK arguments are invalid".into());
    }
    let timeout_ms = request.timeout_ms.ok_or("timeoutMs is required")?;
    if !(MIN_TIMEOUT_MS..=MAX_TIMEOUT_MS).contains(&timeout_ms) {
        return Err("timeoutMs is invalid".into());
    }
    Ok((command, args, timeout_ms))
}

fn redact(text: &str, secrets: &[String]) -> String {
    let mut clean = text.to_owned();
    for secret in secrets.iter().filter(|value| value.len() >= 8) {
        clean = clean.replace(secret, "[REDACTED_ENV]");
    }
    clean.split_inclusive(char::is_whitespace).map(|part| {
        let token = part.trim_end_matches(char::is_whitespace);
        let suffix = &part[token.len()..];
        let absolute = token.starts_with('/') || (token.len() > 2 && token.as_bytes()[1] == b':' && matches!(token.as_bytes()[2], b'/' | b'\\'));
        if absolute { format!("[REDACTED_PATH]{suffix}") } else { part.to_owned() }
    }).collect()
}

fn supervise_child<F, G>(mut child: Child, run_id: String, cancel_rx: mpsc::Receiver<()>, timeout_ms: u64, secrets: Vec<String>, emit: F, done: G)
where
    F: Fn(ProcessEvent) + Send + 'static,
    G: FnOnce() + Send + 'static,
{
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let (output_tx, output_rx) = mpsc::channel::<(&'static str, Vec<u8>)>();
    for (channel, reader) in [("stdout", stdout.map(|value| Box::new(value) as Box<dyn Read + Send>)), ("stderr", stderr.map(|value| Box::new(value) as Box<dyn Read + Send>))] {
        let Some(mut reader) = reader else { continue };
        let tx = output_tx.clone();
        thread::spawn(move || {
            let mut buffer = [0_u8; 4096];
            while let Ok(count) = reader.read(&mut buffer) {
                if count == 0 { break; }
                if tx.send((channel, buffer[..count].to_vec())).is_err() { break; }
            }
        });
    }
    drop(output_tx);
    let deadline = Instant::now() + Duration::from_millis(timeout_ms);
    let mut bytes = 0_usize;
    let mut reason: Option<&str> = None;
    loop {
        if cancel_rx.try_recv().is_ok() { reason = Some("cancelled"); let _ = child.kill(); }
        if reason.is_none() && Instant::now() >= deadline { reason = Some("timeout"); let _ = child.kill(); }
        while let Ok((channel, chunk)) = output_rx.try_recv() {
            if reason.is_some() { continue; }
            let remaining = MAX_PROCESS_BYTES.saturating_sub(bytes);
            let accepted = &chunk[..chunk.len().min(remaining)];
            bytes += accepted.len();
            let text = redact(&String::from_utf8_lossy(accepted), &secrets);
            if !text.is_empty() {
                emit(if channel == "stdout" { ProcessEvent::Stdout { run_id: run_id.clone(), text } } else { ProcessEvent::Stderr { run_id: run_id.clone(), text } });
            }
            if chunk.len() > remaining || bytes >= MAX_PROCESS_BYTES { reason = Some("truncated"); let _ = child.kill(); }
        }
        match child.try_wait() {
            Ok(Some(status)) => { emit(ProcessEvent::Terminal { run_id: run_id.clone(), reason: reason.unwrap_or("exit").into(), code: status.code(), signal: None }); break; }
            Ok(None) => thread::sleep(Duration::from_millis(5)),
            Err(_) => { let _ = child.kill(); let _ = child.wait(); emit(ProcessEvent::Terminal { run_id: run_id.clone(), reason: "startError".into(), code: None, signal: None }); break; }
        }
    }
    done();
}

fn start_mock_sdk(app: &tauri::AppHandle, state: &SpikeState, request: &DesktopRequest) -> Result<Value, String> {
    let (command, args, timeout_ms) = validate_mock_request(request)?;
    let current = std::env::current_exe().map_err(|_| "current executable unavailable")?;
    let child = Command::new(current).arg("--mock-sdk").arg(command).args(args)
        .env_clear().stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn().map_err(|_| "mock SDK could not start")?;
    let run_id = format!("run-{}-{}", std::process::id(), NEXT_RUN_ID.fetch_add(1, Ordering::Relaxed));
    let (cancel_tx, cancel_rx) = mpsc::channel();
    state.runs.lock().map_err(|_| "run state unavailable")?.insert(run_id.clone(), cancel_tx);
    let app = app.clone();
    let run_for_thread = run_id.clone();
    let run_for_cleanup = run_id.clone();
    let runs = Arc::clone(&state.runs);
    let mut secrets: Vec<String> = std::env::vars().map(|(_, value)| value).collect();
    secrets.extend(args.iter().filter(|arg| Path::new(arg).is_absolute()).cloned());
    thread::spawn(move || supervise_child(child, run_for_thread.clone(), cancel_rx, timeout_ms, secrets,
        move |event| { let _ = app.emit("loomlight:event", event); },
        move || { if let Ok(mut active) = runs.lock() { active.remove(&run_for_cleanup); } },
    ));
    Ok(json!({ "runId": run_id }))
}

fn cancel_mock_sdk(state: &SpikeState, request: &DesktopRequest) -> Result<Value, String> {
    let run_id = request.run_id.as_deref().ok_or("runId is required")?;
    if run_id.len() > 80 || !run_id.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-') {
        return Err("runId is invalid".into());
    }
    let sender = state.runs.lock().map_err(|_| "run state unavailable")?.remove(run_id);
    Ok(json!({ "cancelled": sender.is_some_and(|sender| sender.send(()).is_ok()) }))
}

fn probe_request(operation: &str, root: &Path, relative_path: &str) -> DesktopRequest {
    DesktopRequest {
        operation: operation.into(), root: Some(root.to_string_lossy().into_owned()), relative_path: Some(relative_path.into()),
        expected_sha256: None, contents: None, command: None, args: None, run_id: None, timeout_ms: None, security_results: None,
        ui_results: None,
    }
}

#[cfg(unix)]
fn create_file_symlink(original: &Path, link: &Path) -> std::io::Result<()> { std::os::unix::fs::symlink(original, link) }

#[cfg(windows)]
fn create_file_symlink(original: &Path, link: &Path) -> std::io::Result<()> { std::os::windows::fs::symlink_file(original, link) }

fn packaged_security_probe() -> Result<Value, String> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|_| "clock unavailable")?.as_nanos();
    let root = std::env::temp_dir().join(format!("loomlight-probe-{nonce}")).join("project space ü");
    let deep = (0..20).map(|index| format!("deep-{index}")).collect::<Vec<_>>().join("/");
    let relative = format!("game space/日本語/{deep}/scene ü.rpy");
    let target = root.join(Path::new(&relative));
    let outside = std::env::temp_dir().join(format!("loomlight-outside-{nonce}.rpy"));
    fs::create_dir_all(target.parent().ok_or("probe parent unavailable")?).map_err(|_| "probe setup failed")?;
    fs::write(&target, b"label start:\n    return\n").map_err(|_| "probe setup failed")?;
    fs::write(&outside, b"private fixture\n").map_err(|_| "probe setup failed")?;
    let result = (|| {
        let read_request = probe_request("readText", &root, &relative);
        let before = read_text(&read_request)?;
        let mut write_request = probe_request("writeTextAtomic", &root, &relative);
        write_request.expected_sha256 = Some(before.sha256.clone());
        write_request.contents = Some(format!("{}# updated\n", before.contents));
        let after = write_text(&write_request)?;
        let stale_denied = write_text(&write_request).is_err();
        let traversal_denied = request_path(&probe_request("readText", &root, "../secret"), true).is_err();
        let missing_error = match read_text(&probe_request("readText", &root, "game space/missing.rpy")) {
            Ok(_) => return Err("missing file unexpectedly opened".into()),
            Err(error) => error,
        };
        let missing_redacted = !missing_error.contains(&root.to_string_lossy().to_string());
        let arbitrary = DesktopRequest { operation: "startMockSdk".into(), root: None, relative_path: None, expected_sha256: None, contents: None, command: Some("shell".into()), args: Some(vec![]), run_id: None, timeout_ms: Some(1_000), security_results: None, ui_results: None };
        let arbitrary_process_denied = validate_mock_request(&arbitrary).is_err();
        let link = root.join("game space").join("escape-link.rpy");
        create_file_symlink(&outside, &link).map_err(|_| "probe symlink unavailable")?;
        let symlink_denied = read_text(&probe_request("readText", &root, "game space/escape-link.rpy")).is_err();
        if !symlink_denied { return Err("symlink escape unexpectedly allowed".into()); }
        let (watch_tx, watch_rx) = mpsc::channel();
        let started = Instant::now();
        let _watcher = watch_path(&target, move || { let _ = watch_tx.send(()); })?;
        fs::write(&target, after.contents.as_bytes()).map_err(|_| "probe external edit failed")?;
        watch_rx.recv_timeout(Duration::from_secs(5)).map_err(|_| "probe watch timed out")?;
        let latency_ms = started.elapsed().as_millis();
        let mut watch_events = 1_u64;
        while watch_rx.recv_timeout(Duration::from_millis(100)).is_ok() { watch_events += 1; }
        let entries = fs::read_dir(target.parent().ok_or("probe parent unavailable")?)
            .map_err(|_| "probe directory unavailable")?
            .filter_map(Result::ok).map(|entry| entry.file_name()).collect::<Vec<_>>();
        let same_directory_replacement = entries.iter().all(|entry| !entry.to_string_lossy().ends_with(".tmp"));
        let synthetic_secret = "loomlight-synthetic-secret-value".to_owned();
        let redactions = vec![target.to_string_lossy().into_owned(), synthetic_secret.clone()];
        let redacted = redact(&format!("{} {}", target.display(), synthetic_secret), &redactions);
        let sensitive_redacted = !redacted.contains(&root.to_string_lossy().to_string()) && !redacted.contains(&synthetic_secret);
        Ok(json!({
            "evidence": "tauri-packaged-core-denial", "read": true, "atomicReplace": true,
            "sameDirectoryReplacement": same_directory_replacement,
            "staleDenied": stale_denied, "traversalDenied": traversal_denied,
            "missingErrorRedacted": missing_redacted, "arbitraryProcessDenied": arbitrary_process_denied,
            "symlinkDenied": symlink_denied, "sensitiveRedacted": sensitive_redacted,
            "watchLatencyMs": latency_ms, "watchEvents": watch_events,
            "pathLengthChars": target.to_string_lossy().chars().count(),
            "pathCases": ["spaces", "unicode", "long", "deep"]
        }))
    })();
    let _ = fs::remove_dir_all(root.parent().unwrap_or(&root));
    let _ = fs::remove_file(outside);
    result
}

fn finish_webview_security_probe(app: &tauri::AppHandle, request: &DesktopRequest) -> Result<Value, String> {
    if std::env::var("LOOMLIGHT_SPIKE_WEBVIEW_PROBE").as_deref() != Ok("1") {
        return Err("operation is not allowlisted".into());
    }
    let results = request.security_results.clone().ok_or("securityResults are required")?;
    let required = ["nodeGlobalsDenied", "unknownIpcDenied", "traversalDenied", "networkDenied", "popupDenied"];
    if !required.iter().all(|key| results.get(key).and_then(Value::as_bool) == Some(true)) {
        return Err("webview security probe failed".into());
    }
    let window = app.get_webview_window("main").ok_or("probe window unavailable")?;
    let before = window.url().map_err(|_| "probe URL unavailable")?;
    window.eval("location.href = 'https://example.invalid/loomlight-navigation'").map_err(|_| "navigation probe unavailable")?;
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(300));
        let navigation_denied = window.url().is_ok_and(|url| url == before);
        let mut completed = results;
        completed["navigationDenied"] = json!(navigation_denied);
        completed["evidence"] = json!("tauri-packaged-webview-denial");
        println!("{completed}");
        let _ = std::io::stdout().flush();
        std::process::exit(if navigation_denied { 0 } else { 1 });
    });
    Ok(json!({ "checkingNavigation": true }))
}

fn finish_ui_probe(request: &DesktopRequest) -> Result<Value, String> {
    let mode = std::env::var("LOOMLIGHT_SPIKE_UI_PROBE").map_err(|_| "operation is not allowlisted")?;
    if !matches!(mode.as_str(), "wide" | "narrow") { return Err("operation is not allowlisted".into()); }
    let results = request.ui_results.clone().ok_or("uiResults are required")?;
    let passed = results.get("passed").and_then(Value::as_bool) == Some(true)
        && results.get("mode").and_then(Value::as_str) == Some(mode.as_str());
    let mut completed = results;
    completed["evidence"] = json!("tauri-packaged-ui");
    println!("{completed}");
    let _ = std::io::stdout().flush();
    std::process::exit(if passed { 0 } else { 1 });
}

fn packaged_credential_probe() -> Result<Value, String> {
    let secret = std::env::var("LOOMLIGHT_SPIKE_CREDENTIAL_SECRET")
        .map_err(|_| "synthetic credential unavailable")?;
    let account = std::env::var("LOOMLIGHT_SPIKE_CREDENTIAL_ACCOUNT")
        .map_err(|_| "synthetic credential account unavailable")?;
    if secret.len() < 24 || account.len() < 12 || account.len() > 120 {
        return Err("synthetic credential input is invalid".into());
    }
    let entry = keyring::Entry::new("org.loomlight.phase0-spike", &account)
        .map_err(|_| "native credential store unavailable")?;
    let mut stored = false;
    let operation = (|| {
        entry.set_password(&secret).map_err(|_| "native credential write failed")?;
        stored = true;
        let recovered = entry.get_password().map_err(|_| "native credential read failed")?;
        if recovered != secret { return Err("native credential mismatch".into()); }
        entry.delete_credential().map_err(|_| "native credential cleanup failed")?;
        stored = false;
        Ok(())
    })();
    if stored { let _ = entry.delete_credential(); }
    operation?;
    let cleaned = matches!(entry.get_password(), Err(keyring::Error::NoEntry));
    if !cleaned { let _ = entry.delete_credential(); return Err("native credential cleanup failed".into()); }
    Ok(json!({
        "evidence": "tauri-packaged-credential",
        "passed": true,
        "provider": if cfg!(target_os = "macos") { "keychain-entry" } else { "credential-manager-entry" },
        "roundTrip": true,
        "cleaned": true,
        "rendererCreated": false
    }))
}

#[tauri::command]
fn desktop_operation(app: tauri::AppHandle, state: tauri::State<SpikeState>, request: DesktopRequest) -> Result<Value, String> {
    match request.operation.as_str() {
        "readText" => serde_json::to_value(read_text(&request)?).map_err(|_| "serialization failed".into()),
        "writeTextAtomic" => serde_json::to_value(write_text(&request)?).map_err(|_| "serialization failed".into()),
        "watchText" => watch_text(&app, &state, &request),
        "unwatchText" => unwatch_text(&state, &request),
        "startMockSdk" => start_mock_sdk(&app, &state, &request),
        "cancelMockSdk" => cancel_mock_sdk(&state, &request),
        "securityProbeResult" => finish_webview_security_probe(&app, &request),
        "uiProbeResult" => finish_ui_probe(&request),
        _ => Err("operation is not allowlisted".into()),
    }
}

fn main() {
    if std::env::var("LOOMLIGHT_SPIKE_CREDENTIAL_PROBE").as_deref() == Ok("1") {
        let result = packaged_credential_probe();
        std::env::remove_var("LOOMLIGHT_SPIKE_CREDENTIAL_SECRET");
        std::env::remove_var("LOOMLIGHT_SPIKE_CREDENTIAL_ACCOUNT");
        match result {
            Ok(value) => { println!("{value}"); return; }
            Err(_) => { eprintln!("{}", r#"{"evidence":"tauri-packaged-credential","passed":false,"error":"native credential probe failed"}"#); std::process::exit(1); }
        }
    }
    if std::env::var("LOOMLIGHT_SPIKE_SECURITY_PROBE").as_deref() == Ok("1") {
        match packaged_security_probe() {
            Ok(result) => { println!("{result}"); return; }
            Err(error) => { eprintln!("packaged security probe failed: {error}"); std::process::exit(1); }
        }
    }
    if std::env::args().nth(1).as_deref() == Some("--mock-sdk") {
        match std::env::args().nth(2).as_deref() {
            Some("version") => println!("mock-renpy 0.0"),
            Some("diagnostics") => println!("{{\"severity\":\"warning\",\"line\":4}}"),
            Some("stderr") => eprintln!("mock warning {}", std::env::args().skip(3).collect::<Vec<_>>().join(" ")),
            Some("delay") => { thread::sleep(Duration::from_secs(2)); println!("delayed"); },
            Some("flood") => print!("{}", "x".repeat(131_072)),
            _ => std::process::exit(2),
        }
        return;
    }
    tauri::Builder::default()
        .manage(SpikeState::default())
        .setup(|app| {
            let mut config = app.config().app.windows.first().expect("main window config is required").clone();
            if std::env::var("LOOMLIGHT_SPIKE_UI_PROBE").as_deref() == Ok("narrow") {
                config.width = 720.0;
                config.height = 600.0;
            }
            tauri::WebviewWindowBuilder::from_config(app, &config)
                .expect("main window config must be valid")
                .on_navigation(|url| {
                    url.scheme() == "tauri"
                        || (matches!(url.scheme(), "http" | "https") && url.host_str() == Some("tauri.localhost"))
                })
                .build()
                .expect("main window must be created");
            Ok(())
        })
        .on_page_load(|webview, _| {
            if std::env::var("LOOMLIGHT_SPIKE_WEBVIEW_PROBE").as_deref() == Ok("1") {
                webview.eval(include_str!("security_probe.js")).expect("security probe injection failed");
            }
            if let Ok(mode) = std::env::var("LOOMLIGHT_SPIKE_UI_PROBE") {
                if matches!(mode.as_str(), "wide" | "narrow") {
                    let mode = serde_json::to_string(&mode).expect("UI probe mode must serialize");
                    webview.eval(&format!("window.__loomlightUiProbeMode={mode};{}", include_str!("ui_probe.js"))).expect("UI probe injection failed");
                }
            }
        })
        .invoke_handler(tauri::generate_handler![desktop_operation])
        .run(tauri::generate_context!())
        .expect("Tauri desktop spike failed");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_unknown_operation() {
        let request: DesktopRequest = serde_json::from_value(json!({ "operation": "shell" })).unwrap();
        assert_eq!(request.operation, "shell");
        assert!(!matches!(request.operation.as_str(), "readText" | "writeTextAtomic" | "watchText" | "unwatchText" | "startMockSdk" | "cancelMockSdk"));
    }

    #[test]
    fn hash_is_stable() {
        assert_eq!(sha256(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn validates_allowlisted_process_and_timeout() {
        let valid: DesktopRequest = serde_json::from_value(json!({ "operation": "startMockSdk", "command": "delay", "args": [], "timeoutMs": 20 })).unwrap();
        assert_eq!(validate_mock_request(&valid).unwrap().2, 20);
        let denied: DesktopRequest = serde_json::from_value(json!({ "operation": "startMockSdk", "command": "shell", "args": [], "timeoutMs": 20 })).unwrap();
        assert!(validate_mock_request(&denied).is_err());
    }

    #[test]
    fn redacts_paths_and_environment_values() {
        let private_path = "/private/project with spaces";
        let clean = redact(&format!("{private_path} token-secret-value"), &[private_path.into(), "token-secret-value".into()]);
        assert!(!clean.contains(private_path));
        assert!(!clean.contains("project with spaces"));
        assert!(!clean.contains("token-secret-value"));
    }

    #[test]
    fn mock_child() {
        match std::env::var("LOOMLIGHT_TEST_CHILD").as_deref() {
            Ok("delay") => thread::sleep(Duration::from_secs(2)),
            Ok("flood") => print!("{}", "x".repeat(131_072)),
            Ok("stderr") => eprintln!("/private/project token-secret-value"),
            _ => return,
        }
    }

    fn supervised(mode: &str, timeout_ms: u64, cancel: bool) -> Vec<ProcessEvent> {
        let child = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "tests::mock_child", "--nocapture"])
            .env("LOOMLIGHT_TEST_CHILD", mode)
            .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().unwrap();
        let (cancel_tx, cancel_rx) = mpsc::channel();
        let (event_tx, event_rx) = mpsc::channel();
        let handle = thread::spawn(move || supervise_child(child, "run-test".into(), cancel_rx, timeout_ms, vec!["token-secret-value".into()], move |event| { event_tx.send(event).unwrap(); }, || {}));
        if cancel { cancel_tx.send(()).unwrap(); }
        handle.join().unwrap();
        event_rx.try_iter().collect()
    }

    fn terminal_reason(events: &[ProcessEvent]) -> Option<&str> {
        events.iter().find_map(|event| if let ProcessEvent::Terminal { reason, .. } = event { Some(reason.as_str()) } else { None })
    }

    #[test]
    fn supervises_cancellation_timeout_truncation_and_redaction() {
        assert_eq!(terminal_reason(&supervised("delay", 3_000, true)), Some("cancelled"));
        assert_eq!(terminal_reason(&supervised("delay", 20, false)), Some("timeout"));
        assert_eq!(terminal_reason(&supervised("flood", 3_000, false)), Some("truncated"));
        let stderr = supervised("stderr", 3_000, false).into_iter().find_map(|event| if let ProcessEvent::Stderr { text, .. } = event { Some(text) } else { None }).unwrap();
        assert!(!stderr.contains("/private/project"));
        assert!(!stderr.contains("token-secret-value"));
    }

    #[test]
    fn packaged_probe_covers_target_filesystem_boundary() {
        let result = packaged_security_probe().unwrap();
        assert_eq!(result["read"], true);
        assert_eq!(result["atomicReplace"], true);
        assert_eq!(result["staleDenied"], true);
        assert_eq!(result["traversalDenied"], true);
        assert_eq!(result["missingErrorRedacted"], true);
        assert_eq!(result["arbitraryProcessDenied"], true);
        assert_eq!(result["symlinkDenied"], true);
        assert_eq!(result["sameDirectoryReplacement"], true);
        assert_eq!(result["sensitiveRedacted"], true);
    }

    #[test]
    fn tauri_configuration_is_deny_by_default() {
        let config = include_str!("../tauri.conf.json");
        let capability = include_str!("../capabilities/default.json");
        assert!(config.contains("connect-src ipc: http://ipc.localhost"));
        assert!(!config.contains("connect-src *"));
        assert!(config.contains("frame-src 'none'"));
        assert!(config.contains("object-src 'none'"));
        assert!(capability.contains("\"permissions\": [\"core:default\"]"));
        assert!(!capability.contains("shell:"));
        assert!(!capability.contains("fs:"));
        assert!(!capability.contains("http:"));
    }
}
