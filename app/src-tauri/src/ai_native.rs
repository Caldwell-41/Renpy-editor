//! Stable, machine-local owned entries; no shell, plaintext fallback or secret IPC.
use loomlight_core::ai_credentials::{Result, Secrets};
#[cfg(not(target_os = "windows"))]
use loomlight_core::ai_profiles::OwnedCredential;
pub struct NativeSecrets;
/// Mac legacy/native ownership is retained, with zero Keychain API-key calls.
#[cfg(target_os = "macos")]
impl Secrets for NativeSecrets {
    fn service(&self) -> loomlight_core::ai_profiles::CredentialService {
        loomlight_core::ai_profiles::CredentialService::Loomlight
    }
    fn status(
        &self,
        _: &str,
        _: &OwnedCredential,
    ) -> (
        loomlight_core::ai_credentials::CredentialStatus,
        Option<&'static str>,
    ) {
        (
            loomlight_core::ai_credentials::CredentialStatus::Deferred,
            Some(loomlight_core::ai_file_secrets::DEFERRED),
        )
    }
    fn read(
        &self,
        _: &str,
        _: &OwnedCredential,
    ) -> Result<Option<loomlight_core::ai_credentials::Secret>> {
        Err(loomlight_core::ai_file_secrets::DEFERRED)
    }
    fn add(&self, _: &str, _: &OwnedCredential, _: &str) -> Result<()> {
        Err(loomlight_core::ai_file_secrets::DEFERRED)
    }
    fn delete(&self, _: &str, _: &OwnedCredential) -> Result<()> {
        Err(loomlight_core::ai_file_secrets::DEFERRED)
    }
}
#[cfg(target_os = "macos")]
pub fn secrets(root: &std::path::Path) -> Result<impl Secrets> {
    loomlight_core::ai_file_secrets::FileSecrets::open(root)
}
#[cfg(not(target_os = "macos"))]
pub fn secrets(_: &std::path::Path) -> Result<impl Secrets> {
    Ok(NativeSecrets)
}

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::enter_owned;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
impl Secrets for NativeSecrets {
    fn read(
        &self,
        _: &str,
        _: &OwnedCredential,
    ) -> Result<Option<loomlight_core::ai_credentials::Secret>> {
        Err("Native credential store unavailable on this target.")
    }
    fn add(&self, _: &str, _: &OwnedCredential, _: &str) -> Result<()> {
        Err("Native credential store unavailable on this target.")
    }
    fn delete(&self, _: &str, _: &OwnedCredential) -> Result<()> {
        Err("Native credential store unavailable on this target.")
    }
}
#[cfg(target_os = "macos")]
pub fn enter(
    mut save: impl FnMut(&str) -> Result<loomlight_core::ai_credentials::SaveOutcome>,
) -> Result<Option<loomlight_core::ai_credentials::SaveOutcome>> {
    use objc2::{MainThreadMarker, MainThreadOnly};
    use objc2_app_kit::{NSAlert, NSSecureTextField};
    use objc2_foundation::{NSPoint, NSRect, NSSize, NSString};
    let mtm = MainThreadMarker::new().ok_or("Secure entry requires the main thread.")?;
    let alert = NSAlert::new(mtm);
    alert.setMessageText(&NSString::from_str(
        "Remember Studio API key on this computer",
    ));
    let disclosure = "Temporary Mac development storage uses encrypted local files and a saved unencrypted unlock key. Software under the same login may decrypt it. The web view never receives your key. Local removal does not revoke it at Studio.";
    alert.setInformativeText(&NSString::from_str(disclosure));
    let remember = alert.addButtonWithTitle(&NSString::from_str("Remember"));
    alert.addButtonWithTitle(&NSString::from_str("Cancel"));
    let field = NSSecureTextField::initWithFrame(
        NSSecureTextField::alloc(mtm),
        NSRect::new(NSPoint::new(0., 0.), NSSize::new(360., 28.)),
    );
    field.setPlaceholderString(Some(&NSString::from_str("Studio API key")));
    alert.setAccessoryView(Some(&field));
    loop {
        if alert.runModal() != 1000 {
            field.setStringValue(&NSString::from_str(""));
            return Ok(None);
        }
        let key = loomlight_core::ai_credentials::Secret::new(field.stringValue().to_string());
        match save(&key) {
            Ok(outcome) => {
                field.setStringValue(&NSString::from_str(""));
                return Ok(Some(outcome));
            }
            Err(message) => {
                // Keep the actual NSSecureTextField and its input alive for Retry.
                alert.setInformativeText(&NSString::from_str(&format!("{message}\n\nInput remains in this native dialog for retry or cancel. {disclosure}")));
                remember.setTitle(&NSString::from_str("Retry save"));
            }
        }
    }
}
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn enter(
    _: impl FnMut(&str) -> Result<loomlight_core::ai_credentials::SaveOutcome>,
) -> Result<Option<loomlight_core::ai_credentials::SaveOutcome>> {
    Err("Secure native entry unavailable on this target.")
}
#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    #[test]
    fn all_native_operations_are_deferred_without_keychain_access() {
        let c: OwnedCredential = serde_json::from_value(serde_json::json!({"credentialId":"owned","origin":"http://127.0.0.1:8888","revision":1})).unwrap();
        assert!(matches!(
            NativeSecrets.read("profile", &c),
            Err(loomlight_core::ai_file_secrets::DEFERRED)
        ));
        assert_eq!(
            NativeSecrets.add("profile", &c, "synthetic"),
            Err(loomlight_core::ai_file_secrets::DEFERRED)
        );
        assert_eq!(
            NativeSecrets.delete("profile", &c),
            Err(loomlight_core::ai_file_secrets::DEFERRED)
        );
        assert_eq!(
            NativeSecrets.status("profile", &c).0,
            loomlight_core::ai_credentials::CredentialStatus::Deferred
        );
    }
}
