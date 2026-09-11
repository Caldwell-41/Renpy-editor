use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Component, Path, PathBuf},
    process::{Command, Stdio},
    sync::{atomic::{AtomicU64, Ordering}, mpsc, Arc, Mutex},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::Emitter;

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

fn start_mock_sdk(app: &tauri::AppHandle, state: &SpikeState, request: &DesktopRequest) -> Result<Value, String> {
    let (command, args, timeout_ms) = validate_mock_request(request)?;
    let current = std::env::current_exe().map_err(|_| "current executable unavailable")?;
    let mut child = Command::new(current).arg("--mock-sdk").arg(command).args(args)
        .env_clear().stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn().map_err(|_| "mock SDK could not start")?;
    let run_id = format!("run-{}-{}", std::process::id(), NEXT_RUN_ID.fetch_add(1, Ordering::Relaxed));
    let (cancel_tx, cancel_rx) = mpsc::channel();
    state.runs.lock().map_err(|_| "run state unavailable")?.insert(run_id.clone(), cancel_tx);
    let stdout = child.stdout.take().ok_or("mock SDK stdout unavailable")?;
    let stderr = child.stderr.take().ok_or("mock SDK stderr unavailable")?;
    let (output_tx, output_rx) = mpsc::channel::<(&'static str, Vec<u8>)>();
    for (channel, mut reader) in [("stdout", Box::new(stdout) as Box<dyn Read + Send>), ("stderr", Box::new(stderr) as Box<dyn Read + Send>)] {
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
    let app = app.clone();
    let run_for_thread = run_id.clone();
    let runs = Arc::clone(&state.runs);
    let secrets: Vec<String> = std::env::vars().map(|(_, value)| value).collect();
    thread::spawn(move || {
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
                    let event = if channel == "stdout" { ProcessEvent::Stdout { run_id: run_for_thread.clone(), text } } else { ProcessEvent::Stderr { run_id: run_for_thread.clone(), text } };
                    let _ = app.emit("loomlight:event", event);
                }
                if chunk.len() > remaining || bytes >= MAX_PROCESS_BYTES { reason = Some("truncated"); let _ = child.kill(); }
            }
            match child.try_wait() {
                Ok(Some(status)) => {
                    let _ = app.emit("loomlight:event", ProcessEvent::Terminal { run_id: run_for_thread.clone(), reason: reason.unwrap_or("exit").into(), code: status.code(), signal: None });
                    if let Ok(mut active) = runs.lock() { active.remove(&run_for_thread); }
                    break;
                }
                Ok(None) => thread::sleep(Duration::from_millis(5)),
                Err(_) => { let _ = child.kill(); let _ = child.wait(); let _ = app.emit("loomlight:event", ProcessEvent::Terminal { run_id: run_for_thread.clone(), reason: "startError".into(), code: None, signal: None }); if let Ok(mut active) = runs.lock() { active.remove(&run_for_thread); } break; }
            }
        }
    });
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

#[tauri::command]
fn desktop_operation(app: tauri::AppHandle, state: tauri::State<SpikeState>, request: DesktopRequest) -> Result<Value, String> {
    match request.operation.as_str() {
        "readText" => serde_json::to_value(read_text(&request)?).map_err(|_| "serialization failed".into()),
        "writeTextAtomic" => serde_json::to_value(write_text(&request)?).map_err(|_| "serialization failed".into()),
        "watchText" => watch_text(&app, &state, &request),
        "unwatchText" => unwatch_text(&state, &request),
        "startMockSdk" => start_mock_sdk(&app, &state, &request),
        "cancelMockSdk" => cancel_mock_sdk(&state, &request),
        _ => Err("operation is not allowlisted".into()),
    }
}

fn main() {
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
        let clean = redact("/private/project token-secret-value", &["token-secret-value".into()]);
        assert!(!clean.contains("/private/project"));
        assert!(!clean.contains("token-secret-value"));
    }
}
