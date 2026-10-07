//! Stable, machine-local owned entries; no shell, plaintext fallback or secret IPC.
use loomlight_core::{
    ai_credentials::{Result, Secrets},
    ai_profiles::OwnedCredential,
};
pub struct NativeSecrets;
pub const SERVICE: &str = "app.loomlight.desktop.ai.v1";
pub fn account(profile: &str, credential: &OwnedCredential) -> String {
    format!("studio/{profile}/{}", credential.credential_id)
}
#[cfg(target_os = "macos")]
fn options(
    profile: &str,
    credential: &OwnedCredential,
) -> security_framework::passwords::PasswordOptions {
    let mut options = security_framework::passwords::PasswordOptions::new_generic_password(
        SERVICE,
        &account(profile, credential),
    );
    options.set_access_synchronized(Some(false));
    options
}
#[cfg(target_os = "macos")]
impl Secrets for NativeSecrets {
    fn read(&self, profile: &str, credential: &OwnedCredential) -> Result<Option<String>> {
        match security_framework::passwords::generic_password(options(profile, credential)) {
            Ok(bytes) => String::from_utf8(bytes)
                .map(Some)
                .map_err(|_| "Credential store invalid."),
            Err(e) if e.code() == -25300 => Ok(None),
            Err(_) => Err("Credential store unavailable."),
        }
    }
    fn add(&self, profile: &str, credential: &OwnedCredential, key: &str) -> Result<()> {
        // Fresh opaque ID and existence refusal; never overwrite an unrelated item.
        if self.read(profile, credential)?.is_some() {
            return Err("Credential identity already exists.");
        }
        security_framework::passwords::set_generic_password_options(
            key.as_bytes(),
            options(profile, credential),
        )
        .map_err(|_| "Credential store unavailable.")
    }
    fn delete(&self, profile: &str, credential: &OwnedCredential) -> Result<()> {
        match security_framework::passwords::delete_generic_password_options(options(
            profile, credential,
        )) {
            Ok(()) => Ok(()),
            Err(e) if e.code() == -25300 => Ok(()),
            Err(_) => Err("Credential cleanup unavailable."),
        }
    }
}
// Windows native entry/store is the explicit next-host implementation seam.
#[cfg(not(target_os = "macos"))]
impl Secrets for NativeSecrets {
    fn read(&self, _: &str, _: &OwnedCredential) -> Result<Option<String>> {
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
pub fn enter() -> Result<Option<String>> {
    use objc2::{MainThreadMarker, MainThreadOnly};
    use objc2_app_kit::{NSAlert, NSSecureTextField};
    use objc2_foundation::{NSPoint, NSRect, NSSize, NSString};
    let mtm = MainThreadMarker::new().ok_or("Secure entry requires the main thread.")?;
    let alert = NSAlert::new(mtm);
    alert.setMessageText(&NSString::from_str(
        "Remember Studio credential on this computer",
    ));
    alert.setInformativeText(&NSString::from_str("Stored in macOS Keychain. Loomlight's web view never receives the key. Local removal does not revoke it at Studio."));
    alert.addButtonWithTitle(&NSString::from_str("Remember"));
    alert.addButtonWithTitle(&NSString::from_str("Cancel"));
    let field = NSSecureTextField::initWithFrame(
        NSSecureTextField::alloc(mtm),
        NSRect::new(NSPoint::new(0., 0.), NSSize::new(360., 28.)),
    );
    field.setPlaceholderString(Some(&NSString::from_str("Studio API key")));
    alert.setAccessoryView(Some(&field));
    let accepted = alert.runModal() == 1000;
    let key = accepted.then(|| field.stringValue().to_string());
    field.setStringValue(&NSString::from_str(""));
    Ok(key)
}
#[cfg(not(target_os = "macos"))]
pub fn enter() -> Result<Option<String>> {
    Err("Secure native entry unavailable on this target.")
}
