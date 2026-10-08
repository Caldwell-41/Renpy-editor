use crate::ai_native;
use loomlight_core::{
    ai_credentials::{self as credentials, Records, Secrets},
    ai_profiles::{ProfileStore, StudioProfile, StudioSettings},
    dispatch::ApplicationHost,
    CoreResponse,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
};
static ACTIVE: Mutex<()> = Mutex::new(());
static DISCOVERY: OnceLock<
    Mutex<HashMap<String, (String, loomlight_core::ai_discovery::Discovery)>>,
> = OnceLock::new();
fn evidence() -> &'static Mutex<HashMap<String, (String, loomlight_core::ai_discovery::Discovery)>>
{
    DISCOVERY.get_or_init(Default::default)
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Save {
    token: String,
    profile_id: Option<String>,
    settings: StudioSettings,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Target {
    token: String,
    profile_id: String,
}
fn snapshot(host: &ApplicationHost) -> credentials::Result<ProfileStore> {
    host.with_service(|s| s.read())
        .map_err(|_| "Another request is in progress.")?
}

/// Historical helper/native qualification is deferred, including all reads.
#[cfg(target_os = "macos")]
pub fn reuse_qualification(_: &ApplicationHost) -> credentials::Result<Value> {
    Err(loomlight_core::ai_file_secrets::DEFERRED)
}
pub(crate) fn secrets(host: &ApplicationHost) -> credentials::Result<impl Secrets> {
    host.with_service(|s| ai_native::secrets(s.ai_data_root()))
        .map_err(|_| "Another request is in progress.")?
}
fn credential_view(
    profile: &StudioProfile,
    secrets: &impl Secrets,
) -> (&'static str, Option<&'static str>) {
    let Some(credential) = &profile.credential else {
        return ("missing", None);
    };
    let (state, error) = secrets.status(&profile.profile_id, credential);
    let status = match state {
        credentials::CredentialStatus::Configured if profile.credential_bound() => "configured",
        credentials::CredentialStatus::Configured => "origin changed or disabled",
        credentials::CredentialStatus::Missing => "missing",
        credentials::CredentialStatus::Recovery => "unavailable",
        credentials::CredentialStatus::Deferred => "deferred",
        credentials::CredentialStatus::Unsupported => "unsupported",
    };
    (status, error)
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Refused(std::cell::Cell<usize>);
    impl Secrets for Refused {
        fn read(
            &self,
            _: &str,
            _: &loomlight_core::ai_profiles::OwnedCredential,
        ) -> credentials::Result<Option<credentials::Secret>> {
            self.0.set(self.0.get() + 1);
            Err("Keychain access needs attention. Saved references are retained.")
        }
        fn add(
            &self,
            _: &str,
            _: &loomlight_core::ai_profiles::OwnedCredential,
            _: &str,
        ) -> credentials::Result<()> {
            panic!("status must not write")
        }
        fn delete(
            &self,
            _: &str,
            _: &loomlight_core::ai_profiles::OwnedCredential,
        ) -> credentials::Result<()> {
            panic!("status must not delete")
        }
    }
    #[test]
    fn status_preserves_access_error_with_one_read_and_no_mutation() {
        let profile: StudioProfile = serde_json::from_value(json!({
            "profileId":"fixture", "revision":1, "disabled":false,
            "settings":{"label":"Studio","endpoint":"http://127.0.0.1:8888/v1","model":"fixture","privateHttp":false,"contextCeiling":8192,"contextBudget":4096,"maximumResponse":1024},
            "credential":{"credentialId":"owned","revision":1,"origin":"http://127.0.0.1:8888"}
        })).unwrap();
        let store = Refused(std::cell::Cell::new(0));
        let before = profile.clone();
        let (status, message) = credential_view(&profile, &store);
        assert_eq!(status, "unavailable");
        assert!(message.unwrap().contains("Saved references are retained"));
        assert_eq!(store.0.get(), 1);
        assert_eq!(profile, before);
    }
    #[test]
    fn confirmed_save_reload_failure_keeps_cleanup_pending_visible() {
        let regression: Value = serde_json::from_str(include_str!(
            "../../tests/fixtures/macos-development-credential-reload-failure.json"
        ))
        .unwrap();
        let fixture: Value = serde_json::from_str(include_str!(
            "../../tests/fixtures/macos-development-credentials.json"
        ))
        .unwrap();
        let store: ProfileStore = serde_json::from_value(fixture["profileStore"].clone()).unwrap();
        let temp = tempfile::tempdir().unwrap();
        let service =
            loomlight_core::lifecycle::LifecycleService::new(temp.path().to_owned()).unwrap();
        service.write(&store, &ProfileStore::default()).unwrap();
        let profile = regression["profileId"].as_str().unwrap();
        let input = fixture["nativeInputs"][regression["nativeInputLabel"].as_str().unwrap()]
            .as_str()
            .unwrap();
        let outcome = credentials::replace(
            &service,
            &loomlight_core::ai_file_secrets::FileSecrets::open(temp.path()).unwrap(),
            &credentials::token(&store),
            profile,
            input,
        )
        .unwrap();
        assert_eq!(outcome, credentials::SaveOutcome::SavedCleanupPending);
        let host = ApplicationHost::new(service);
        let persisted = std::fs::read(temp.path().join("ai-profiles.json")).unwrap();
        // A failed read after confirmation must not hide the cleanup result or
        // enable another mutation. This uses the production response constructor.
        std::fs::write(temp.path().join("ai-profiles.json"), b"unreadable fixture").unwrap();
        for label in ["API key saved", "Removed"] {
            for pending in [false, true] {
                let result = with_outcome(
                    &host,
                    if pending {
                        credentials::SaveOutcome::SavedCleanupPending
                    } else {
                        credentials::SaveOutcome::Saved
                    },
                    label,
                );
                assert_eq!(result["saved"], true);
                assert_eq!(result["reloadRequired"], true);
                assert_eq!(result["cleanupPending"], pending);
                let message = result["saveStatus"].as_str().unwrap();
                assert!(message.starts_with(label));
                assert_eq!(message.contains("cleanup pending"), pending);
                assert!(message.contains("Retry reading before further changes"));
                assert!(result.get("token").is_none());
                if pending && label == "API key saved" {
                    assert_eq!(result, regression["expectedResponse"]);
                    assert!(!result.to_string().contains(input));
                }
            }
        }
        std::fs::write(temp.path().join("ai-profiles.json"), persisted).unwrap();
        let reloaded = snapshot(&host).unwrap();
        assert_eq!(
            credential_view(
                &reloaded.profiles[2],
                &loomlight_core::ai_file_secrets::FileSecrets::open(temp.path()).unwrap()
            )
            .0,
            "configured"
        );
        assert!(reloaded
            .cleanup
            .iter()
            .any(|c| c.profile_id == profile && c.credential.storage.is_native()));
    }
    #[test]
    fn native_event_retry_and_cancel_keep_service_available_and_never_retarget() {
        use loomlight_core::{
            ai_credentials::Secret, ai_file_secrets::FileSecrets, lifecycle::LifecycleService,
        };
        use std::sync::atomic::{AtomicBool, Ordering};
        struct FailOnce {
            inner: FileSecrets,
            fail: AtomicBool,
        }
        impl Secrets for FailOnce {
            fn service(&self) -> loomlight_core::ai_profiles::CredentialService {
                self.inner.service()
            }
            fn generation(
                &self,
                s: &ProfileStore,
                p: &StudioProfile,
            ) -> credentials::Result<Option<String>> {
                self.inner.generation(s, p)
            }
            fn prepare_generation(
                &self,
                c: &loomlight_core::ai_profiles::OwnedCredential,
                fresh: bool,
            ) -> credentials::Result<()> {
                self.inner.prepare_generation(c, fresh)
            }
            fn read(
                &self,
                p: &str,
                c: &loomlight_core::ai_profiles::OwnedCredential,
            ) -> credentials::Result<Option<Secret>> {
                self.inner.read(p, c)
            }
            fn add(
                &self,
                p: &str,
                c: &loomlight_core::ai_profiles::OwnedCredential,
                key: &str,
            ) -> credentials::Result<()> {
                if self.fail.swap(false, Ordering::SeqCst) {
                    Err("Injected save failure")
                } else {
                    self.inner.add(p, c, key)
                }
            }
            fn delete(
                &self,
                p: &str,
                c: &loomlight_core::ai_profiles::OwnedCredential,
            ) -> credentials::Result<()> {
                self.inner.delete(p, c)
            }
        }
        for cancel in [false, true] {
            let temp = tempfile::tempdir().unwrap();
            let service = LifecycleService::new(temp.path().to_owned()).unwrap();
            credentials::save(
                &service,
                &credentials::token(&service.read().unwrap()),
                None,
                StudioSettings {
                    label: "Synthetic".into(),
                    endpoint: "http://127.0.0.1:8888/v1".into(),
                    model: "fixture".into(),
                    private_http: false,
                    context_ceiling: 8192,
                    context_budget: 4096,
                    maximum_response: 1024,
                },
            )
            .unwrap();
            let host = ApplicationHost::new(service);
            let before = snapshot(&host).unwrap();
            let id = before.profiles[0].profile_id.clone();
            let mut entry =
                credentials::CredentialEntry::new(&before, &credentials::token(&before), &id)
                    .unwrap();
            let secrets = FailOnce {
                inner: FileSecrets::open(temp.path()).unwrap(),
                fail: AtomicBool::new(true),
            };
            let (events, receive) = std::sync::mpsc::sync_channel(1);
            let (results, reply) =
                std::sync::mpsc::sync_channel::<credentials::Result<credentials::SaveOutcome>>(1);
            std::thread::scope(|scope| {
                let host = &host;
                let before = &before;
                let id = &id;
                scope.spawn(move || {
                    let retained = Secret::new("public-synthetic-retained".into());
                    // Waiting native dialog does not own the service.
                    assert!(host.with_service(|s| s.read()).unwrap().is_ok());
                    events
                        .send(EntryEvent::Save(Secret::new(retained.to_string())))
                        .unwrap();
                    assert_eq!(reply.recv().unwrap(), Err("Injected save failure"));
                    assert_eq!(&*retained, "public-synthetic-retained");
                    assert_eq!(snapshot(&host).unwrap().profiles, before.profiles);
                    if cancel {
                        let current = snapshot(&host).unwrap();
                        let mut settings = current.profiles[0].settings.clone();
                        settings.endpoint = "http://127.0.0.1:9999/v1".into();
                        host.with_service(|s| {
                            credentials::save(s, &credentials::token(&current), Some(&id), settings)
                        })
                        .unwrap()
                        .unwrap();
                        let external = snapshot(&host).unwrap();
                        events
                            .send(EntryEvent::Save(Secret::new(retained.to_string())))
                            .unwrap();
                        assert!(reply
                            .recv()
                            .unwrap()
                            .unwrap_err()
                            .contains("Settings changed"));
                        assert_eq!(snapshot(&host).unwrap(), external);
                        events.send(EntryEvent::Finished(Ok(None))).unwrap();
                    } else {
                        events
                            .send(EntryEvent::Save(Secret::new(retained.to_string())))
                            .unwrap();
                        let saved = reply.recv().unwrap().unwrap();
                        assert_eq!(saved, credentials::SaveOutcome::Saved);
                        events.send(EntryEvent::Finished(Ok(Some(saved)))).unwrap();
                    }
                });
                let result = drive_entry(&host, &secrets, &mut entry, receive, results).unwrap();
                assert_eq!(result.is_none(), cancel);
            });
            if !cancel {
                assert_eq!(
                    credential_view(&snapshot(&host).unwrap().profiles[0], &secrets).0,
                    "configured"
                );
                assert!(
                    with_outcome(&host, credentials::SaveOutcome::Saved, "API key saved")
                        ["saveStatus"]
                        .as_str()
                        .unwrap()
                        .contains("API key saved")
                );
            }
        }
    }
    #[cfg(target_os = "windows")]
    #[test]
    fn windows_dispatch_refuses_secret_payload_and_stale_token_before_entry() {
        let temp = tempfile::tempdir().unwrap();
        let service =
            loomlight_core::lifecycle::LifecycleService::new(temp.path().to_owned()).unwrap();
        credentials::save(
            &service,
            &credentials::token(&service.read().unwrap()),
            None,
            StudioSettings {
                label: "Synthetic".into(),
                endpoint: "http://127.0.0.1:46081/v1".into(),
                model: "synthetic-model".into(),
                private_http: false,
                context_ceiling: 8192,
                context_budget: 4096,
                maximum_response: 1024,
            },
        )
        .unwrap();
        let host = ApplicationHost::new(service);
        let before = snapshot(&host).unwrap();
        let target =
            json!({"token":credentials::token(&before), "profileId":before.profiles[0].profile_id});
        let mut injected = target.clone();
        injected["key"] = "public-synthetic-refused".into();
        let mut stale = target.clone();
        stale["token"] = "stale".into();
        for payload in [injected, stale] {
            let response = serde_json::to_value(dispatch_settings(
                &host,
                "reject".into(),
                "ai.enterCredential",
                payload,
                |_| panic!("refused request must not open native UI"),
            ))
            .unwrap();
            assert_eq!(response["ok"], false);
            assert!(!response.to_string().contains("public-synthetic-refused"));
            assert_eq!(snapshot(&host).unwrap(), before);
        }
        let response = serde_json::to_value(dispatch_settings(
            &host,
            "cancel".into(),
            "ai.enterCredential",
            target,
            |_| Ok(None),
        ))
        .unwrap();
        assert_eq!(response["value"]["cancelled"], true);
        assert_eq!(snapshot(&host).unwrap(), before);
    }
    #[cfg(target_os = "macos")]
    #[test]
    fn settings_dispatch_routes_fixture_recovery_pending_cleanup_and_secret_free_refusals() {
        let fixture: Value = serde_json::from_str(include_str!(
            "../../tests/fixtures/macos-development-credentials.json"
        ))
        .unwrap();
        let store: ProfileStore = serde_json::from_value(fixture["profileStore"].clone()).unwrap();
        let temp = tempfile::tempdir().unwrap();
        let service =
            loomlight_core::lifecycle::LifecycleService::new(temp.path().to_owned()).unwrap();
        service.write(&store, &ProfileStore::default()).unwrap();
        let host = ApplicationHost::new(service);
        let no_entry = |_: &mut credentials::CredentialEntry| -> credentials::Result<Option<credentials::SaveOutcome>> { panic!("read/remove/refused payload must not enter native UI") };
        let read = dispatch_settings(
            &host,
            "fixture-read".into(),
            "ai.profiles",
            json!({}),
            no_entry,
        );
        let read = serde_json::to_value(read).unwrap();
        assert_eq!(read["ok"], true);
        assert_eq!(read["value"]["profiles"][2]["credentialStatus"], "deferred");
        assert_eq!(read["value"]["cleanup"][0]["deferred"], true);
        assert!(!temp.path().join("credentials-dev").exists());
        assert_eq!(snapshot(&host).unwrap(), store);
        let id = &store.profiles[2].profile_id;
        let target = json!({"token":credentials::token(&store),"profileId":id});
        let mut bad = target.clone();
        bad["key"] = "renderer-key-refused".into();
        assert!(!dispatch_settings(
            &host,
            "fixture-bad".into(),
            "ai.enterCredential",
            bad,
            no_entry
        )
        .is_success());
        assert!(!dispatch_settings(
            &host,
            "fixture-stale".into(),
            "ai.enterCredential",
            json!({"token":"stale","profileId":id}),
            no_entry
        )
        .is_success());
        let saved = dispatch_settings(
            &host,
            "fixture-entry".into(),
            "ai.enterCredential",
            target,
            |entry| {
                host.with_service(|s| {
                    entry.save(
                        s,
                        &loomlight_core::ai_file_secrets::FileSecrets::open(temp.path())?,
                        "loomlight-public-synthetic-theta",
                    )
                })
                .unwrap()
                .map(Some)
            },
        );
        let saved = serde_json::to_value(saved).unwrap();
        assert_eq!(saved["ok"], true);
        assert_eq!(
            saved["value"]["saveStatus"],
            "API key saved; cleanup pending"
        );
        assert_eq!(
            saved["value"]["profiles"][2]["credentialStatus"],
            "configured"
        );
        assert!(!saved
            .to_string()
            .contains("loomlight-public-synthetic-theta"));
        let current = snapshot(&host).unwrap();
        let c = current.profiles[2].credential.clone().unwrap();
        std::fs::remove_file(
            temp.path()
                .join("credentials-dev/generations")
                .join(c.storage.generation().unwrap())
                .join("master.key"),
        )
        .unwrap();
        let read = serde_json::to_value(dispatch_settings(
            &host,
            "fixture-retry".into(),
            "ai.profiles",
            json!({}),
            no_entry,
        ))
        .unwrap();
        assert_eq!(
            read["value"]["profiles"][2]["credentialStatus"],
            "unavailable"
        );
        assert_eq!(snapshot(&host).unwrap(), current);
        let removed = serde_json::to_value(dispatch_settings(
            &host,
            "fixture-remove".into(),
            "ai.removeProfile",
            json!({"token":credentials::token(&current),"profileId":id}),
            no_entry,
        ))
        .unwrap();
        assert_eq!(removed["ok"], true);
        assert_eq!(removed["value"]["saveStatus"], "Removed; cleanup pending");
        let after = snapshot(&host).unwrap();
        assert_eq!(after.profiles.len(), 2);
        assert!(after
            .cleanup
            .iter()
            .any(|c| c.profile_id == *id && c.credential.storage.is_native()));
        assert!(after.cleanup.iter().any(|r| r.credential == c));
        let bytes = std::fs::read(temp.path().join("ai-profiles.json")).unwrap();
        let mut newer: Value = serde_json::from_slice(&bytes).unwrap();
        newer["schemaVersion"] = 99.into();
        let future = serde_json::to_vec(&newer).unwrap();
        std::fs::write(temp.path().join("ai-profiles.json"), &future).unwrap();
        let refused = serde_json::to_value(dispatch_settings(
            &host,
            "fixture-newer".into(),
            "ai.profiles",
            json!({}),
            no_entry,
        ))
        .unwrap();
        assert_eq!(refused["ok"], false);
        assert!(refused["error"]["message"]
            .as_str()
            .unwrap()
            .contains("newer unsupported"));
        assert_eq!(
            std::fs::read(temp.path().join("ai-profiles.json")).unwrap(),
            future
        );
    }
}
fn view(host: &ApplicationHost) -> credentials::Result<Value> {
    let store = snapshot(host)?;
    let token = credentials::token(&store);
    let secrets = secrets(host)?;
    let evidence = evidence()
        .lock()
        .map_err(|_| "Discovery status unavailable.")?;
    let profiles=store.profiles.iter().map(|p| {
        let (status, access_error) = credential_view(p, &secrets);
        let discovery=evidence.get(&p.profile_id).filter(|(t,_)|t==&token);
        json!({"profileId":p.profile_id,"revision":p.revision,"settings":p.settings,"credentialStatus":status,"credentialError":access_error,"disabled":p.disabled,"discovery":discovery.map(|(_,d)|json!({"models":d.models,"selectedAvailable":d.selected_available,"status":if d.selected_available&&status=="configured"{"model available; discovery only"}else{"selected model unavailable"}}))})
    }).collect::<Vec<_>>();
    Ok(
        json!({"token":token,"profiles":profiles,"storageNotice":if cfg!(target_os = "macos") { "Temporary Mac development storage: encrypted local files plus a saved unencrypted unlock key. Software under the same login may decrypt your keys. Healthy storage is intended to survive app quit/reopen and replacement." } else { "Native credential storage" },"cleanup":store.cleanup.iter().map(|c|json!({"profileId":c.profile_id,"deferred":c.credential.storage.is_native() && cfg!(target_os = "macos")})).collect::<Vec<_>>()}),
    )
}
pub fn dispatch(
    app: &tauri::AppHandle,
    host: &ApplicationHost,
    id: String,
    operation: &str,
    payload: Value,
) -> CoreResponse {
    dispatch_settings(host, id, operation, payload, |entry| {
        native_save(app, host, &secrets(host)?, entry)
    })
}
fn dispatch_settings(
    host: &ApplicationHost,
    id: String,
    operation: &str,
    payload: Value,
    entry_driver: impl FnOnce(
        &mut credentials::CredentialEntry,
    ) -> credentials::Result<Option<credentials::SaveOutcome>>,
) -> CoreResponse {
    let result = (|| -> credentials::Result<Value> {
        let _active = ACTIVE
            .try_lock()
            .map_err(|_| "Another AI settings operation is in progress.")?;
        if operation == "ai.profiles" {
            if payload != json!({}) {
                return Err("Invalid AI settings payload.");
            }
            return view(host);
        }
        if operation == "ai.saveProfile" {
            let p: Save =
                serde_json::from_value(payload).map_err(|_| "Invalid AI settings payload.")?;
            host.with_service(|s| {
                credentials::save(s, &p.token, p.profile_id.as_deref(), p.settings)
            })
            .map_err(|_| "Another request is in progress.")??;
            return view(host);
        }
        let p: Target =
            serde_json::from_value(payload).map_err(|_| "Invalid AI settings payload.")?;
        let before = snapshot(host)?;
        let secrets = secrets(host)?;
        if credentials::token(&before) != p.token {
            return Err("Settings changed; reload before continuing.");
        }
        if operation == "ai.enterCredential" {
            if !before
                .profiles
                .iter()
                .any(|profile| profile.profile_id == p.profile_id)
            {
                return Err("Profile missing.");
            }
            let mut entry = credentials::CredentialEntry::new(&before, &p.token, &p.profile_id)?;
            let outcome = entry_driver(&mut entry)?;
            let Some(outcome) = outcome else {
                return Ok(json!({"cancelled":true}));
            };
            // Persistence was confirmed by the controller even if later view reload fails.
            return Ok(with_outcome(host, outcome, "API key saved"));
        } else if matches!(operation, "ai.removeCredential" | "ai.removeProfile") {
            let outcome = host
                .with_service(|s| {
                    credentials::remove(
                        s,
                        &secrets,
                        &p.token,
                        &p.profile_id,
                        operation == "ai.removeProfile",
                    )
                })
                .map_err(|_| "Another request is in progress.")??;
            return Ok(with_outcome(host, outcome, "Removed"));
        } else if operation == "ai.cleanup" {
            host.with_service(|s| {
                credentials::checked(s, &p.token)?;
                credentials::cleanup_profile(s, &secrets, &p.profile_id)
            })
            .map_err(|_| "Another request is in progress.")??;
        } else if operation == "ai.discover" {
            let profile = before
                .profiles
                .iter()
                .find(|profile| profile.profile_id == p.profile_id)
                .ok_or("Profile missing.")?;
            if !profile.credential_bound() {
                return Err("Credential missing, disabled or bound to another origin.");
            }
            let previous = evidence()
                .lock()
                .map_err(|_| "Discovery status unavailable.")?
                .remove(&p.profile_id)
                .filter(|(t, _)| t == &p.token)
                .map(|(_, d)| d.addresses);
            let key = secrets
                .read(&p.profile_id, profile.credential.as_ref().unwrap())?
                .ok_or("Credential missing.")?;
            let discovered = loomlight_core::ai_discovery::discover(profile, &key, previous)?;
            if snapshot(host)? != before {
                return Err("Settings changed during discovery; result discarded.");
            }
            evidence()
                .lock()
                .map_err(|_| "Discovery status unavailable.")?
                .insert(p.profile_id.clone(), (p.token, discovered));
        } else {
            return Err("AI operation unavailable.");
        }
        view(host)
    })();
    match result {
        Ok(value) => CoreResponse::success(id, value),
        Err(message) => CoreResponse::failure(id, "AI_SETTINGS_REFUSED", message),
    }
}

fn with_outcome(host: &ApplicationHost, outcome: credentials::SaveOutcome, label: &str) -> Value {
    let pending = outcome == credentials::SaveOutcome::SavedCleanupPending;
    match view(host) {
        Ok(mut value) => {
            value["saveStatus"] = json!(if pending {
                format!("{label}; cleanup pending")
            } else {
                label.into()
            });
            value
        }
        Err(_) => {
            let status = if pending {
                format!("{label}; cleanup pending")
            } else {
                label.into()
            };
            json!({"saved":true,"cleanupPending":pending,"reloadRequired":true,"saveStatus":format!("{status}; saved profiles could not be reloaded. Retry reading before further changes.")})
        }
    }
}
enum EntryEvent {
    Save(credentials::Secret),
    Finished(credentials::Result<Option<credentials::SaveOutcome>>),
}
fn native_save(
    app: &tauri::AppHandle,
    host: &ApplicationHost,
    secrets: &impl Secrets,
    entry: &mut credentials::CredentialEntry,
) -> credentials::Result<Option<credentials::SaveOutcome>> {
    #[cfg(target_os = "windows")]
    let owner = {
        use tauri::Manager;
        app.get_webview_window("main")
            .ok_or("Secure entry owner unavailable.")?
            .hwnd()
            .map_err(|_| "Secure entry owner unavailable.")?
            .0 as usize
    };
    let (events, receive) = std::sync::mpsc::sync_channel(1);
    let (results, reply) = std::sync::mpsc::sync_channel(1);
    app.run_on_main_thread(move || {
        let save = |key: &str| {
            events
                .send(EntryEvent::Save(credentials::Secret::new(key.into())))
                .map_err(|_| "Secure entry unavailable.")?;
            reply.recv().map_err(|_| "Secure entry unavailable.")?
        };
        #[cfg(target_os = "windows")]
        let result = ai_native::enter_owned(owner, save);
        #[cfg(not(target_os = "windows"))]
        let result = ai_native::enter(save);
        let _ = events.send(EntryEvent::Finished(result));
    })
    .map_err(|_| "Secure entry unavailable.")?;
    drive_entry(host, secrets, entry, receive, results)
}
fn drive_entry(
    host: &ApplicationHost,
    secrets: &impl Secrets,
    entry: &mut credentials::CredentialEntry,
    receive: std::sync::mpsc::Receiver<EntryEvent>,
    results: std::sync::mpsc::SyncSender<credentials::Result<credentials::SaveOutcome>>,
) -> credentials::Result<Option<credentials::SaveOutcome>> {
    loop {
        match receive.recv().map_err(|_| "Secure entry unavailable.")? {
            EntryEvent::Save(key) => {
                let result = host
                    .with_service(|s| entry.save(s, secrets, &key))
                    .map_err(|_| "Another request is in progress; input retained for retry.")
                    .and_then(|r| r);
                results
                    .send(result)
                    .map_err(|_| "Secure entry unavailable.")?;
            }
            EntryEvent::Finished(result) => return result,
        }
    }
}
