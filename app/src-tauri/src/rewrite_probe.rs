//! Native-only isolated synthetic fixture. Uses the existing credential owner.
use loomlight_core::{
    ai_credentials::{self, Records},
    ai_profiles::{ProfileStore, StudioSettings},
    lifecycle::LifecycleService,
};
use loomlight_core::{dispatch::ApplicationHost, CoreResponse};
use std::path::Path;
use std::time::{Duration, Instant};

pub fn snapshot_response(
    host: &ApplicationHost,
    root: &Path,
    request_id: String,
) -> Result<CoreResponse, &'static str> {
    // A snapshot must own the same checkout as source/history mutations.
    match host.with_service(|_| snapshot(root)) {
        Ok(files) => Ok(CoreResponse::success(request_id, files?)),
        Err("Another request is in progress.") => Ok(CoreResponse::failure(
            request_id,
            "RUNTIME_BUSY",
            "Another request is in progress.",
        )),
        Err(error) => Err(error),
    }
}

fn with_idle_service<T>(
    host: &ApplicationHost,
    timeout: Duration,
    task: impl FnOnce(&mut LifecycleService) -> T,
) -> Result<T, &'static str> {
    let deadline = Instant::now() + timeout;
    let mut task = Some(task);
    loop {
        // Checkout refusal happens before the closure is invoked. Never repeat
        // cleanup after it entered the service, even when its inner result failed.
        match host.with_service(|service| task.take().unwrap()(service)) {
            Err("Another request is in progress.") if Instant::now() < deadline => {
                std::thread::sleep(Duration::from_millis(10));
            }
            result => return result,
        }
    }
}

pub fn cleanup_when_idle(host: &ApplicationHost) -> bool {
    with_idle_service(host, Duration::from_secs(10), |service| cleanup(service))
        .is_ok_and(|result| result.is_ok())
}

#[derive(serde::Serialize)]
pub struct CleanupOwners {
    requests: bool,
    credentials: bool,
    host: bool,
}
impl CleanupOwners {
    pub fn complete(&self) -> bool {
        self.requests && self.credentials && self.host
    }
}
pub fn cleanup_owners(
    requests: impl FnOnce() -> bool,
    credentials: impl FnOnce() -> bool,
    host: impl FnOnce() -> bool,
) -> CleanupOwners {
    // Each owner runs exactly once even after another owner's ordinary failure.
    let requests = requests();
    let credentials = credentials();
    let host = host();
    CleanupOwners {
        requests,
        credentials,
        host,
    }
}
pub fn prepare(
    root: &Path,
    endpoint: &str,
    reopen: bool,
) -> Result<LifecycleService, Box<dyn std::error::Error>> {
    if root.parent() != Some(std::env::temp_dir().as_path())
        || !root
            .file_name()
            .is_some_and(|s| s.to_string_lossy().starts_with("loomlight-rewrite-"))
        || root.is_symlink()
    {
        return Err("Rewrite root refused".into());
    }
    if reopen {
        return Ok(LifecycleService::new(root.to_owned()).map_err(|_| "Rewrite reopen failed")?);
    }
    if root.exists() {
        return Err("Rewrite fixture must be fresh".into());
    }
    // Profile validation retains loopback-only destination; fixture setup never sends.
    let settings = StudioSettings {
        label: "Synthetic rewrite".into(),
        endpoint: endpoint.into(),
        model: "synthetic-rewrite-model".into(),
        private_http: false,
        context_budget: 32768,
        context_ceiling: 32768,
        maximum_response: 1024,
        thinking: None,
        temperature: None,
        top_p: None,
        model_load: None,
    };
    if !settings.valid() || !endpoint.starts_with("http://127.0.0.1:") || !endpoint.ends_with("/v1")
    {
        return Err("Rewrite endpoint refused".into());
    }
    let service = LifecycleService::prepare_dialogue_rewrite_probe(root.to_owned())?;
    ai_credentials::save(
        &service,
        &ai_credentials::token(&ProfileStore::default()),
        None,
        settings,
    )?;
    let store = service.read()?;
    let secrets = crate::ai_native::secrets(root)?;
    ai_credentials::replace(
        &service,
        &secrets,
        &ai_credentials::token(&store),
        &store.profiles[0].profile_id,
        "loomlight-public-rewrite-fixture",
    )?;
    // Explicit controlled-fixture evidence; this is not live provider qualification.
    let store = service.read()?;
    ai_credentials::record_compatibility(
        &service,
        &ai_credentials::token(&store),
        &store.profiles[0].profile_id,
    )?;
    Ok(service)
}
pub fn cleanup(service: &LifecycleService) -> Result<(), &'static str> {
    let store = service.read()?;
    let secrets = crate::ai_native::secrets(service.ai_data_root())?;
    for p in store.profiles {
        let current = service.read()?;
        if ai_credentials::remove(
            service,
            &secrets,
            &ai_credentials::token(&current),
            &p.profile_id,
            false,
        )? != ai_credentials::SaveOutcome::Saved
        {
            return Err("Synthetic credential cleanup incomplete");
        }
    }
    Ok(())
}
fn snapshot_key(relative: &Path) -> Result<String, &'static str> {
    // Match core preview paths on every host without rewriting filename bytes.
    // The owned fixture walker supplies only contained normal components.
    let parts = relative
        .components()
        .map(|part| match part {
            std::path::Component::Normal(name) => name.to_str().ok_or("Fixture path refused"),
            _ => Err("Fixture path refused"),
        })
        .collect::<Result<Vec<_>, _>>()?;
    if parts.is_empty() {
        return Err("Fixture path refused");
    }
    Ok(parts.join("/"))
}
pub fn snapshot(root: &Path) -> Result<serde_json::Value, &'static str> {
    if root.parent() != Some(std::env::temp_dir().as_path())
        || !root
            .file_name()
            .is_some_and(|s| s.to_string_lossy().starts_with("loomlight-rewrite-"))
        || root.is_symlink()
    {
        return Err("Rewrite snapshot root refused");
    }
    fn walk(
        dir: &Path,
        base: &Path,
        files: &mut std::collections::BTreeMap<String, String>,
    ) -> Result<(), &'static str> {
        for e in std::fs::read_dir(dir).map_err(|_| "Fixture unavailable")? {
            let p = e.map_err(|_| "Fixture unavailable")?.path();
            if p.is_symlink() {
                return Err("Fixture link refused");
            }
            if p.is_dir() {
                walk(&p, base, files)?;
            } else {
                let key = snapshot_key(p.strip_prefix(base).map_err(|_| "Fixture path refused")?)?;
                if files
                    .insert(
                        key,
                        loomlight_core::rewrite::content_digest(
                            &std::fs::read(p).map_err(|_| "Fixture unavailable")?,
                        ),
                    )
                    .is_some()
                {
                    return Err("Duplicate fixture snapshot path");
                }
            }
        }
        Ok(())
    }
    let base = root.join("synthetic-project");
    let mut files = std::collections::BTreeMap::new();
    walk(&base, &base, &mut files)?;
    Ok(serde_json::json!({"files":files}))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn probe_cleanup_owners_run_after_each_failure() {
        for requests in [false, true] {
            for credentials in [false, true] {
                for host in [false, true] {
                    let calls = std::cell::RefCell::new(Vec::new());
                    let owners = cleanup_owners(
                        || {
                            calls.borrow_mut().push("requests");
                            requests
                        },
                        || {
                            calls.borrow_mut().push("credentials");
                            credentials
                        },
                        || {
                            calls.borrow_mut().push("host");
                            host
                        },
                    );
                    assert_eq!(*calls.borrow(), ["requests", "credentials", "host"]);
                    assert_eq!(owners.complete(), requests && credentials && host);
                    assert_eq!(
                        serde_json::to_value(owners).unwrap(),
                        serde_json::json!({
                            "requests": requests, "credentials": credentials, "host": host,
                        })
                    );
                }
            }
        }
    }

    #[test]
    fn snapshot_paths_are_portable_and_bind_exact_bytes() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-rewrite-paths-")
            .tempdir()
            .unwrap();
        let base = root.path().join("synthetic-project");
        let files = [
            (
                "game/chapters/scene.rpy",
                b"\xef\xbb\xbf# exact\r\nlabel scene:\n    return\r\n".as_slice(),
            ),
            (
                ".renpy-editor/recovery/transaction.json",
                b"{}\n".as_slice(),
            ),
        ];
        for (key, bytes) in files {
            let path = key.split('/').fold(base.clone(), |p, part| p.join(part));
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, bytes).unwrap();
        }
        let result = snapshot(root.path()).unwrap();
        let actual = result["files"].as_object().unwrap();
        assert_eq!(actual.len(), files.len());
        for (key, bytes) in files {
            assert_eq!(actual[key], loomlight_core::rewrite::content_digest(bytes));
        }
        assert_eq!(
            actual
                .keys()
                .filter(|key| !key.starts_with(".renpy-editor/recovery/"))
                .count(),
            1
        );
    }

    #[test]
    fn snapshot_paths_reject_non_relative_components() {
        assert_eq!(
            snapshot_key(&Path::new("game").join("café.rpy")).unwrap(),
            "game/café.rpy"
        );
        for path in [
            Path::new(""),
            Path::new("."),
            Path::new("../escape"),
            Path::new("/absolute"),
        ] {
            assert!(snapshot_key(path).is_err());
        }
    }

    #[test]
    fn snapshot_paths_refuse_checked_out_mutation_then_read_exact_result() {
        let root = tempfile::Builder::new()
            .prefix("loomlight-rewrite-paths-")
            .tempdir()
            .unwrap();
        let host = ApplicationHost::new(LifecycleService::new(root.path().join("data")).unwrap());
        let worker = host.clone();
        let path = root.path().join("synthetic-project/game/scene.rpy");
        let (held, ready) = std::sync::mpsc::sync_channel(0);
        let (release, resume) = std::sync::mpsc::sync_channel(0);
        let thread = std::thread::spawn(move || {
            worker
                .with_service(|_| {
                    // The fixture is deliberately absent until mutation finishes.
                    held.send(()).unwrap();
                    resume.recv().unwrap();
                    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
                    std::fs::write(path, b"# committed\r\n").unwrap();
                })
                .unwrap();
        });
        ready.recv().unwrap();
        let busy =
            serde_json::to_value(snapshot_response(&host, root.path(), "busy".into()).unwrap())
                .unwrap();
        assert_eq!(busy["error"]["code"], "RUNTIME_BUSY");
        release.send(()).unwrap();
        thread.join().unwrap();
        let response =
            serde_json::to_value(snapshot_response(&host, root.path(), "complete".into()).unwrap())
                .unwrap();
        assert_eq!(
            response["value"]["files"]["game/scene.rpy"],
            loomlight_core::rewrite::content_digest(b"# committed\r\n")
        );
    }

    #[test]
    fn probe_cleanup_checkout_deadline_does_not_repeat_inner_failure() {
        let root = tempfile::tempdir().unwrap();
        let host = ApplicationHost::new(LifecycleService::new(root.path().join("data")).unwrap());
        let worker = host.clone();
        let (held, ready) = std::sync::mpsc::sync_channel(0);
        let (release, resume) = std::sync::mpsc::sync_channel(0);
        let thread = std::thread::spawn(move || {
            worker
                .with_service(|_| {
                    held.send(()).unwrap();
                    resume.recv().unwrap();
                })
                .unwrap()
        });
        ready.recv().unwrap();
        let calls = std::sync::atomic::AtomicUsize::new(0);
        let refused = with_idle_service(&host, Duration::from_millis(20), |_| {
            calls.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        });
        assert_eq!(refused, Err("Another request is in progress."));
        assert_eq!(calls.load(std::sync::atomic::Ordering::SeqCst), 0);
        release.send(()).unwrap();
        thread.join().unwrap();
        let failed = with_idle_service(&host, Duration::from_secs(1), |_| {
            calls.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            Err::<(), _>("Fixture I/O failed")
        });
        assert_eq!(failed, Ok(Err("Fixture I/O failed")));
        assert_eq!(calls.load(std::sync::atomic::Ordering::SeqCst), 1);
    }
}
