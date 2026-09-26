fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["core_request", "complete_application_close"]),
    ))
    .expect("Tauri build configuration must be valid");
}
