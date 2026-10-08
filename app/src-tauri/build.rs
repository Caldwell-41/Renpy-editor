#[path = "identity_policy.rs"]
mod identity_policy;

fn main() {
    // Use Tauri's own platform/config merge, including CLI and environment overrides.
    let target = tauri_utils::platform::Target::from_triple(&std::env::var("TARGET").unwrap());
    let (mut config, paths) =
        tauri_utils::config::parse::read_from(target, &std::env::current_dir().unwrap())
            .expect("Tauri configuration must be readable");
    for path in paths {
        println!("cargo:rerun-if-changed={}", path.display());
    }
    println!("cargo:rerun-if-changed=identity_policy.rs");
    println!("cargo:rerun-if-changed=macos-signing.json");
    for name in [
        "TAURI_CONFIG",
        "APPLE_SIGNING_IDENTITY",
        "LOOMLIGHT_SIGNING_SHA1",
    ] {
        println!("cargo:rerun-if-env-changed={name}");
    }
    if let Ok(value) = std::env::var("TAURI_CONFIG") {
        json_patch::merge(
            &mut config,
            &serde_json::from_str(&value).expect("Invalid TAURI_CONFIG"),
        );
    }
    let signing: serde_json::Value =
        serde_json::from_str(include_str!("macos-signing.json")).expect("Invalid signing policy");
    identity_policy::validate(
        &config,
        target == tauri_utils::platform::Target::MacOS
            && std::env::var("PROFILE").as_deref() == Ok("release"),
        std::env::var("APPLE_SIGNING_IDENTITY").ok().as_deref(),
        std::env::var("LOOMLIGHT_SIGNING_SHA1").ok().as_deref(),
        signing["certificateSha1"].as_str(),
    )
    .expect(
        "Loomlight identity drift refused; see app/README.md. Changes require explicit approval",
    );
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["core_request", "complete_application_close"]),
    ))
    .expect("Tauri build configuration must be valid");
}
