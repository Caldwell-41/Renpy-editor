//! Native-only isolated synthetic fixture. Uses the existing credential owner.
use loomlight_core::{
    ai_credentials::{self, Records},
    ai_profiles::{ProfileStore, StudioSettings},
    lifecycle::LifecycleService,
};
use std::path::Path;
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
                files.insert(
                    p.strip_prefix(base)
                        .map_err(|_| "Fixture path refused")?
                        .to_str()
                        .ok_or("Fixture path refused")?
                        .into(),
                    loomlight_core::rewrite::content_digest(
                        &std::fs::read(p).map_err(|_| "Fixture unavailable")?,
                    ),
                );
            }
        }
        Ok(())
    }
    let base = root.join("synthetic-project");
    let mut files = std::collections::BTreeMap::new();
    walk(&base, &base, &mut files)?;
    Ok(serde_json::json!({"files":files}))
}
