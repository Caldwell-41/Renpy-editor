use crate::ai_native::{self, NativeSecrets};
use loomlight_core::{
    ai_credentials::{self as credentials, Records, Secrets},
    ai_profiles::{ProfileStore, StudioSettings},
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

/// Test-only same-host reuse, enabled only in an explicitly isolated packaged
/// fixture. The qualification entry is read, never changed/deleted/exported.
#[cfg(target_os = "macos")]
pub fn reuse_qualification(host: &ApplicationHost) -> credentials::Result<Value> {
    #[derive(Deserialize)]
    #[serde(deny_unknown_fields)]
    struct Reference {
        version: u32,
        origin: String,
        service: String,
        profile_id: String,
        credential_id: String,
    }
    let path = std::env::var_os("LOOMLIGHT_STUDIO_PROBE_REFERENCE")
        .ok_or("Qualification reference unavailable.")?;
    use std::io::Read;
    let mut bytes = Vec::new();
    std::fs::File::open(path)
        .map_err(|_| "Qualification reference unavailable.")?
        .take(4097)
        .read_to_end(&mut bytes)
        .map_err(|_| "Qualification reference unavailable.")?;
    if bytes.len() > 4096 {
        return Err("Qualification reference refused.");
    }
    let reference: Reference =
        serde_json::from_slice(&bytes).map_err(|_| "Qualification reference refused.")?;
    if reference.version != 1
        || reference.service != "app.loomlight.desktop.ai.test"
        || [&reference.profile_id, &reference.credential_id]
            .iter()
            .any(|s| {
                !uuid::Uuid::parse_str(s)
                    .is_ok_and(|id| id.get_version_num() == 4 && id.to_string() == **s)
            })
    {
        return Err("Qualification reference refused.");
    }
    let account = format!(
        "provider/{}/qualification/{}",
        reference.profile_id, reference.credential_id
    );
    let mut options = security_framework::passwords::PasswordOptions::new_generic_password(
        &reference.service,
        &account,
    );
    options.set_access_synchronized(Some(false));
    let key = String::from_utf8(
        security_framework::passwords::generic_password(options)
            .map_err(|_| "Qualification credential unavailable.")?,
    )
    .map_err(|_| "Qualification credential invalid.")?;
    if !credentials::valid_key(&key) {
        return Err("Qualification credential invalid.");
    }
    let before = snapshot(host)?;
    let profile = before.profiles.first().ok_or("Probe profile missing.")?;
    let mut settings = profile.settings.clone();
    settings.endpoint = reference.origin;
    settings.private_http = true;
    settings.model = "unsloth/gemma-4-12B-it-qat-GGUF".into();
    host.with_service(|s| {
        credentials::save(
            s,
            &credentials::token(&before),
            Some(&profile.profile_id),
            settings,
        )
    })
    .map_err(|_| "Probe service busy.")??;
    let saved = snapshot(host)?;
    host.with_service(|s| {
        credentials::replace(
            s,
            &NativeSecrets,
            &credentials::token(&saved),
            &profile.profile_id,
            &key,
        )
    })
    .map_err(|_| "Probe service busy.")??;
    let mut options = security_framework::passwords::PasswordOptions::new_generic_password(
        &reference.service,
        &account,
    );
    options.set_access_synchronized(Some(false));
    let preserved = security_framework::passwords::generic_password(options)
        .is_ok_and(|bytes| bytes == key.as_bytes());
    if !preserved {
        return Err("Original qualification credential unavailable.");
    }
    Ok(json!({"reused":true,"originalPreserved":true}))
}
fn view(host: &ApplicationHost) -> credentials::Result<Value> {
    let store = snapshot(host)?;
    let token = credentials::token(&store);
    let evidence = evidence()
        .lock()
        .map_err(|_| "Discovery status unavailable.")?;
    let profiles=store.profiles.iter().map(|p| {
        let status= match &p.credential {None=>"missing",Some(c)=>match NativeSecrets.read(&p.profile_id,c){Ok(Some(_))=>if p.credential_bound(){"configured"}else{"origin changed or disabled"},Ok(None)=>"missing",Err(_)=>"unavailable"}};
        let discovery=evidence.get(&p.profile_id).filter(|(t,_)|t==&token);
        json!({"profileId":p.profile_id,"revision":p.revision,"settings":p.settings,"credentialStatus":status,"disabled":p.disabled,"discovery":discovery.map(|(_,d)|json!({"models":d.models,"selectedAvailable":d.selected_available,"status":if d.selected_available&&status=="configured"{"model available; discovery only"}else{"selected model unavailable"}}))})
    }).collect::<Vec<_>>();
    Ok(
        json!({"token":token,"profiles":profiles,"cleanup":store.cleanup.iter().map(|c|json!({"profileId":c.profile_id})).collect::<Vec<_>>()}),
    )
}
pub fn dispatch(
    app: &tauri::AppHandle,
    host: &ApplicationHost,
    id: String,
    operation: &str,
    payload: Value,
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
            // Native UI runs on the main thread, without owning the project service.
            let (tx, rx) = std::sync::mpsc::sync_channel(1);
            app.run_on_main_thread(move || {
                let _ = tx.send(ai_native::enter());
            })
            .map_err(|_| "Secure entry unavailable.")?;
            let Some(key) = rx.recv().map_err(|_| "Secure entry unavailable.")?? else {
                return Ok(json!({"cancelled":true}));
            };
            host.with_service(|s| {
                credentials::replace(s, &NativeSecrets, &p.token, &p.profile_id, &key)
            })
            .map_err(|_| "Another request is in progress.")??;
        } else if matches!(operation, "ai.removeCredential" | "ai.removeProfile") {
            host.with_service(|s| {
                credentials::remove(
                    s,
                    &NativeSecrets,
                    &p.token,
                    &p.profile_id,
                    operation == "ai.removeProfile",
                )
            })
            .map_err(|_| "Another request is in progress.")??;
        } else if operation == "ai.cleanup" {
            host.with_service(|s| {
                credentials::checked(s, &p.token)?;
                credentials::cleanup_profile(s, &NativeSecrets, &p.profile_id)
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
            let key = NativeSecrets
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
