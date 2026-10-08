//! Shared by build.rs and rejecting tests. No certificate or secret is embedded.
use serde_json::Value;

pub fn validate(
    config: &Value,
    mac_release: bool,
    identity: Option<&str>,
    pin: Option<&str>,
    approved_pin: Option<&str>,
) -> Result<(), &'static str> {
    if config["productName"] != "Loomlight" || config["identifier"] != "app.loomlight.desktop" {
        return Err("Product name or bundle identifier changed.");
    }
    if config
        .get("mainBinaryName")
        .is_some_and(|v| v != "loomlight")
    {
        return Err("Executable name changed.");
    }
    let windows = config["app"]["windows"]
        .as_array()
        .ok_or("Missing windows.")?;
    if !windows
        .iter()
        .any(|w| w["label"] == "main" && w["title"] == "Loomlight")
    {
        return Err("Main window name changed.");
    }
    if mac_release {
        let pin = pin
            .filter(|p| p.len() == 40 && p.bytes().all(|b| b.is_ascii_hexdigit()))
            .ok_or("A pinned certificate fingerprint is required for Mac release builds.")?;
        if !approved_pin.is_some_and(|approved| approved.eq_ignore_ascii_case(pin)) {
            return Err("Certificate fingerprint differs from the approved repository policy.");
        }
        let configured = config["bundle"]["macOS"]["signingIdentity"].as_str();
        let identity = identity
            .or(configured)
            .ok_or("Certificate-backed signing is required.")?;
        if !identity.eq_ignore_ascii_case(pin)
            || configured.is_some_and(|v| !v.eq_ignore_ascii_case(pin))
        {
            return Err(
                "Signing identity must match the pinned certificate; ad-hoc fallback is forbidden.",
            );
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn config() -> Value {
        serde_json::from_str(include_str!("tauri.conf.json")).unwrap()
    }
    const PIN: &str = "0123456789ABCDEF0123456789ABCDEF01234567";
    #[test]
    fn rejects_name_and_override_drift() {
        for (key, value) in [
            ("productName", "Loomlight-test"),
            ("identifier", "app.loomlight"),
            ("mainBinaryName", "other"),
        ] {
            let mut c = config();
            c[key] = value.into();
            assert!(validate(&c, false, None, None, None).is_err());
        }
        let mut c = config();
        c["app"]["windows"][0]["title"] = "Loomlight dev".into();
        assert!(validate(&c, false, None, None, None).is_err());
    }
    #[test]
    fn mac_release_requires_matching_certificate_but_debug_and_windows_do_not() {
        assert!(validate(&config(), false, None, None, None).is_ok());
        assert!(validate(&config(), true, None, None, Some(PIN)).is_err());
        assert!(validate(&config(), true, Some("-"), Some(PIN), Some(PIN)).is_err());
        assert!(validate(&config(), true, Some(PIN), Some(PIN), Some(PIN)).is_ok());
        assert!(validate(&config(), true, Some(PIN), Some(PIN), None).is_err());
        assert!(validate(
            &config(),
            true,
            Some(PIN),
            Some(PIN),
            Some("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
        )
        .is_err());
        let mut c = config();
        c["bundle"]["macOS"] = serde_json::json!({"signingIdentity":"-"});
        assert!(validate(&c, true, Some(PIN), Some(PIN), Some(PIN)).is_err());
    }
}
