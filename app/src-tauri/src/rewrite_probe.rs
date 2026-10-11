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
}
