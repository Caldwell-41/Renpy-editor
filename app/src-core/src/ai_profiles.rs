//! Device-local Studio profile records. No native access or network on read/save.
//! The desktop credential lifecycle owns references; these records never hold keys.
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, net::IpAddr};

pub const MAX_PROFILE_BYTES: u64 = 128 * 1024;
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProfileDecodeError {
    Invalid,
    Unsupported,
}
pub fn decode(bytes: &[u8]) -> Result<ProfileStore, ProfileDecodeError> {
    if bytes.len() as u64 > MAX_PROFILE_BYTES {
        return Err(ProfileDecodeError::Invalid);
    }
    let value: serde_json::Value =
        serde_json::from_slice(bytes).map_err(|_| ProfileDecodeError::Invalid)?;
    if value
        .get("schemaVersion")
        .and_then(|v| v.as_u64())
        .is_some_and(|v| v > 2)
    {
        return Err(ProfileDecodeError::Unsupported);
    }
    // Deserialize the original bytes: Value would silently collapse duplicate fields.
    let store: ProfileStore =
        serde_json::from_slice(bytes).map_err(|_| ProfileDecodeError::Invalid)?;
    if !store.valid() {
        return Err(ProfileDecodeError::Invalid);
    }
    Ok(store)
}

/// Fixed owned namespaces, never a caller-supplied Keychain service.
/// Missing fields in existing profiles AND cleanup records retain the old service.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum CredentialService {
    #[default]
    #[serde(rename = "app.loomlight.desktop.ai.v1")]
    Legacy,
    #[serde(rename = "app.loomlight")]
    Loomlight,
}
impl CredentialService {
    pub fn is_legacy(&self) -> bool {
        *self == Self::Legacy
    }
    pub fn name(self) -> &'static str {
        match self {
            Self::Legacy => "app.loomlight.desktop.ai.v1",
            Self::Loomlight => "app.loomlight",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StudioSettings {
    pub label: String,
    pub endpoint: String,
    pub model: String,
    pub private_http: bool,
    /// User supplied, unverified effective ceiling; discovery is separate evidence.
    pub context_ceiling: u32,
    pub context_budget: u32,
    pub maximum_response: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum CredentialStorage {
    Native,
    DevelopmentFile {
        #[serde(rename = "generationId")]
        generation_id: String,
    },
}
impl Default for CredentialStorage {
    fn default() -> Self {
        Self::Native
    }
}
impl CredentialStorage {
    pub fn is_native(&self) -> bool {
        *self == Self::Native
    }
    pub fn generation(&self) -> Option<&str> {
        match self {
            Self::Native => None,
            Self::DevelopmentFile { generation_id } => Some(generation_id),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OwnedCredential {
    pub credential_id: String,
    pub origin: String,
    pub revision: u64,
    #[serde(default, skip_serializing_if = "CredentialService::is_legacy")]
    pub service: CredentialService,
    #[serde(default, skip_serializing_if = "CredentialStorage::is_native")]
    pub storage: CredentialStorage,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StudioProfile {
    pub profile_id: String,
    pub revision: u64,
    pub settings: StudioSettings,
    pub credential: Option<OwnedCredential>,
    pub disabled: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CleanupReference {
    pub profile_id: String,
    pub credential: OwnedCredential,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileStore {
    pub schema_version: u32,
    pub revision: u64,
    pub profiles: Vec<StudioProfile>,
    /// Persist before native addition, retain on failed cleanup; never use for sends.
    pub cleanup: Vec<CleanupReference>,
    /// Durable ownership, including abandoned stages and recovery generations.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub development_generations: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_development_generation: Option<String>,
}

impl Default for ProfileStore {
    fn default() -> Self {
        Self {
            schema_version: 1,
            revision: 0,
            profiles: Vec::new(),
            cleanup: Vec::new(),
            development_generations: Vec::new(),
            active_development_generation: None,
        }
    }
}

pub(crate) fn uuid(value: &str) -> bool {
    uuid::Uuid::parse_str(value)
        .is_ok_and(|id| id.get_version_num() == 4 && id.to_string() == value)
}

/// Normalization is pure. DNS/address-set validation belongs to explicit discovery.
pub fn canonical_endpoint(
    input: &str,
    private_http: bool,
) -> Result<(String, String), &'static str> {
    if input.len() > 2048
        || input
            .bytes()
            .any(|b| b.is_ascii_whitespace() || b.is_ascii_control())
        || input.contains(['\\', '%', '?', '#', '@'])
    {
        return Err("Invalid endpoint.");
    }
    let uri: ureq::http::Uri = input.parse().map_err(|_| "Invalid endpoint.")?;
    let scheme = uri.scheme_str().ok_or("Invalid endpoint.")?;
    if !matches!(scheme, "http" | "https") {
        return Err("Unsupported endpoint scheme.");
    }
    let authority = uri.authority().ok_or("Invalid endpoint.")?;
    let host = authority.host().to_ascii_lowercase();
    let address_host = host.trim_start_matches('[').trim_end_matches(']');
    if address_host.is_empty() || address_host.ends_with('.') {
        return Err("Invalid endpoint.");
    }
    let lowercase_authority = authority.as_str().to_ascii_lowercase();
    let suffix = lowercase_authority
        .strip_prefix(&host)
        .ok_or("Invalid endpoint.")?;
    let port = if suffix.is_empty() {
        if scheme == "https" {
            443
        } else {
            80
        }
    } else {
        let digits = suffix.strip_prefix(':').ok_or("Invalid endpoint.")?;
        if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
            return Err("Invalid endpoint.");
        }
        digits.parse::<u16>().map_err(|_| "Invalid endpoint.")?
    };
    if port == 0 {
        return Err("Invalid endpoint.");
    }
    if scheme == "http" {
        if let Ok(ip) = address_host.parse::<IpAddr>() {
            if !http_address_allowed(ip, private_http) {
                return Err("Plaintext destination refused.");
            }
        } else if address_host != "localhost" && !private_http {
            return Err("Private HTTP requires explicit opt-in.");
        }
    }
    let path = uri.path().trim_end_matches('/');
    let segments: Vec<_> = path.split('/').filter(|s| !s.is_empty()).collect();
    if segments
        .iter()
        .any(|s| matches!(*s, "." | ".." | "models" | "chat" | "completions"))
        || path.contains("//")
        || segments.iter().filter(|s| **s == "v1").count() > 1
        || segments
            .iter()
            .position(|s| *s == "v1")
            .is_some_and(|i| i + 1 != segments.len())
    {
        return Err("Use a provider base address.");
    }
    let path = if path.ends_with("/v1") {
        path.to_owned()
    } else {
        format!("{path}/v1")
    };
    let origin = format!("{scheme}://{host}:{port}");
    Ok((format!("{origin}{path}"), origin))
}

pub fn http_address_allowed(ip: IpAddr, private_http: bool) -> bool {
    match ip {
        IpAddr::V4(ip) => ip.is_loopback() || (private_http && ip.is_private()),
        IpAddr::V6(ip) => {
            if let Some(v4) = ip.to_ipv4_mapped() {
                http_address_allowed(IpAddr::V4(v4), private_http)
            } else {
                ip.is_loopback() || (private_http && ip.is_unique_local())
            }
        }
    }
}

impl StudioSettings {
    pub fn valid(&self) -> bool {
        !self.label.trim().is_empty()
            && self.label.len() <= 80
            && !self.label.chars().any(char::is_control)
            && !self.model.trim().is_empty()
            && self.model.len() <= 256
            && !self.model.chars().any(char::is_control)
            && (256..=2_000_000).contains(&self.context_ceiling)
            && (256..=self.context_ceiling).contains(&self.context_budget)
            && self.maximum_response > 0
            && self
                .maximum_response
                .checked_add(128)
                .is_some_and(|n| n < self.context_budget)
            && canonical_endpoint(&self.endpoint, self.private_http)
                .is_ok_and(|(canonical, _)| canonical == self.endpoint)
    }
}

impl StudioProfile {
    pub fn credential_bound(&self) -> bool {
        !self.disabled
            && self.credential.as_ref().is_some_and(|c| {
                canonical_endpoint(&self.settings.endpoint, self.settings.private_http)
                    .is_ok_and(|(_, origin)| origin == c.origin)
            })
    }
}

impl ProfileStore {
    pub fn valid(&self) -> bool {
        if !matches!(self.schema_version, 1 | 2)
            || self.profiles.len() > 32
            || self.cleanup.len() > 128
            || self.development_generations.len() > 64
        {
            return false;
        }
        let mut generations = HashSet::new();
        if !self
            .development_generations
            .iter()
            .all(|g| uuid(g) && generations.insert(g.as_str()))
            || self
                .active_development_generation
                .as_ref()
                .is_some_and(|g| !generations.contains(g.as_str()))
            || (self.schema_version == 1
                && (!generations.is_empty() || self.active_development_generation.is_some()))
        {
            return false;
        }
        let mut profiles = HashSet::new();
        let mut entries = HashSet::new();
        let valid_credential = |c: &OwnedCredential| {
            uuid(&c.credential_id)
                && c.revision > 0
                && c.storage
                    .generation()
                    .is_none_or(|g| self.schema_version == 2 && generations.contains(g))
                && canonical_endpoint(&c.origin, true).is_ok_and(|(_, origin)| origin == c.origin)
        };
        self.profiles.iter().all(|p| {
            uuid(&p.profile_id)
                && profiles.insert(&p.profile_id)
                && p.revision > 0
                && p.settings.valid()
                && p.credential
                    .as_ref()
                    .is_none_or(|c| valid_credential(c) && entries.insert(&c.credential_id))
        }) && self.cleanup.iter().all(|c| {
            uuid(&c.profile_id)
                && valid_credential(&c.credential)
                && entries.insert(&c.credential.credential_id)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_service_keeps_legacy_profiles_cleanup_and_digest() {
        let mut store = fixture();
        store.cleanup.push(CleanupReference {
            profile_id: uuid::Uuid::new_v4().to_string(),
            credential: OwnedCredential {
                credential_id: uuid::Uuid::new_v4().to_string(),
                origin: "http://127.0.0.1:8888".into(),
                revision: 1,
                service: CredentialService::Legacy,
                storage: CredentialStorage::Native,
            },
        });
        let bytes = serde_json::to_vec(&store).unwrap();
        assert!(!String::from_utf8_lossy(&bytes).contains("service"));
        let reopened: ProfileStore = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(reopened, store);
        assert_eq!(serde_json::to_vec(&reopened).unwrap(), bytes);
        let mut value = serde_json::to_value(&store).unwrap();
        value["cleanup"][0]["credential"]["service"] = "unowned.other.service".into();
        assert!(serde_json::from_value::<ProfileStore>(value).is_err());
    }

    pub(crate) fn fixture() -> ProfileStore {
        ProfileStore {
            revision: 1,
            profiles: vec![StudioProfile {
                profile_id: uuid::Uuid::new_v4().to_string(),
                revision: 1,
                disabled: false,
                settings: StudioSettings {
                    label: "Isolated Studio".into(),
                    endpoint: "http://127.0.0.1:8888/v1".into(),
                    model: "synthetic-model".into(),
                    private_http: false,
                    context_ceiling: 8192,
                    context_budget: 4096,
                    maximum_response: 1024,
                },
                credential: Some(OwnedCredential {
                    credential_id: uuid::Uuid::new_v4().to_string(),
                    origin: "http://127.0.0.1:8888".into(),
                    revision: 1,
                    service: CredentialService::Legacy,
                    storage: CredentialStorage::Native,
                }),
            }],
            ..ProfileStore::default()
        }
    }

    #[test]
    fn endpoint_policy_refuses_ordinary_misrouting() {
        for endpoint in [
            "http://example.com",
            "http://8.8.8.8",
            "http://169.254.1.1",
            "http://0.0.0.0",
            "http://[::ffff:8.8.8.8]",
            "http://192.168.1.1",
        ] {
            assert!(canonical_endpoint(endpoint, false).is_err(), "{endpoint}");
        }
        for endpoint in [
            "http://8.8.8.8",
            "http://169.254.1.1",
            "http://127.0.0.1/v1/models",
            "https://user:secret@example.com",
            "https://example.com/v1/v1",
            "https://example.com/a/../v1",
            "https://example.com/?key=value",
            "https://example.com/%2e",
            "http://127.0.0.1:99999",
            "http://127.0.0.1:abc",
        ] {
            assert!(canonical_endpoint(endpoint, true).is_err(), "{endpoint}");
        }
        assert_eq!(
            canonical_endpoint("https://EXAMPLE.com/proxy/", false)
                .unwrap()
                .0,
            "https://example.com:443/proxy/v1"
        );
        assert_eq!(
            canonical_endpoint("http://[::1]:8888/v1", false).unwrap().1,
            "http://[::1]:8888"
        );
        assert!(canonical_endpoint("http://192.168.1.1:8888", true).is_ok());
    }

    #[test]
    fn stale_origin_and_disabled_profiles_cannot_use_credential() {
        let mut store = fixture();
        assert!(store.valid());
        assert!(store.profiles[0].credential_bound());
        store.profiles[0].settings.endpoint = "http://127.0.0.1:9999/v1".into();
        assert!(store.valid()); // preserve old owned entry for explicit replacement/cleanup
        assert!(!store.profiles[0].credential_bound());
        store.profiles[0].settings.endpoint = "http://127.0.0.1:8888/v1".into();
        store.profiles[0].disabled = true;
        assert!(!store.profiles[0].credential_bound());
    }

    #[test]
    fn cleanup_cannot_alias_active_or_other_owned_entry() {
        let mut store = fixture();
        store.cleanup.push(CleanupReference {
            profile_id: store.profiles[0].profile_id.clone(),
            credential: store.profiles[0].credential.clone().unwrap(),
        });
        assert!(!store.valid());
        store.cleanup[0].credential.credential_id = uuid::Uuid::new_v4().to_string();
        assert!(store.valid());
        store.profiles.push(store.profiles[0].clone());
        assert!(!store.valid());
    }

    #[test]
    fn profile_save_reopen_retains_limits_and_refuses_stale_write() {
        use crate::lifecycle::LifecycleService;
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("isolated-device");
        let service = LifecycleService::new(root.clone()).unwrap();
        assert_eq!(service.read_ai_profiles().unwrap(), ProfileStore::default());
        let store = fixture();
        service
            .write_ai_profiles(&store, &ProfileStore::default())
            .unwrap();
        drop(service);
        let reopened = LifecycleService::new(root.clone()).unwrap();
        assert_eq!(reopened.read_ai_profiles().unwrap(), store);
        assert!(reopened.current().is_none());
        let original = std::fs::read(root.join("ai-profiles.json")).unwrap();
        assert!(reopened
            .write_ai_profiles(&store, &ProfileStore::default())
            .is_err());
        assert_eq!(
            std::fs::read(root.join("ai-profiles.json")).unwrap(),
            original
        );
        let mut changed = store.clone();
        changed.revision += 1;
        changed.profiles[0].settings.maximum_response = 2048;
        assert!(reopened.write_ai_profiles(&changed, &store).is_err());
        changed.profiles[0].revision += 1;
        reopened.write_ai_profiles(&changed, &store).unwrap();
        assert_eq!(reopened.read_ai_profiles().unwrap(), changed);
        let mut external = changed.clone();
        external.profiles[0].settings.label = "Ordinary external edit".into();
        let bytes = serde_json::to_vec(&external).unwrap();
        std::fs::write(root.join("ai-profiles.json"), &bytes).unwrap();
        let mut next = changed.clone();
        next.revision += 1;
        assert!(reopened.write_ai_profiles(&next, &changed).is_err());
        assert_eq!(std::fs::read(root.join("ai-profiles.json")).unwrap(), bytes);
    }

    #[test]
    fn malformed_newer_unknown_and_overlimit_profiles_are_preserved() {
        use crate::lifecycle::LifecycleService;
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("isolated-device");
        let service = LifecycleService::new(root.clone()).unwrap();
        let mut future = fixture();
        future.schema_version = 3;
        let mut unknown = serde_json::to_value(fixture()).unwrap();
        unknown["unexpected"] = serde_json::json!(true);
        for bytes in [
            b"broken".to_vec(),
            serde_json::to_vec(&future).unwrap(),
            serde_json::to_vec(&unknown).unwrap(),
            vec![b' '; MAX_PROFILE_BYTES as usize + 1],
        ] {
            std::fs::write(root.join("ai-profiles.json"), &bytes).unwrap();
            assert!(service.read_ai_profiles().is_err());
            assert!(service
                .write_ai_profiles(&fixture(), &ProfileStore::default())
                .is_err());
            assert_eq!(std::fs::read(root.join("ai-profiles.json")).unwrap(), bytes);
        }
    }
}

#[cfg(test)]
mod development_schema_tests {
    use super::*;
    #[test]
    fn v1_native_bytes_stay_compatible_and_v2_generation_ownership_is_strict() {
        let native = tests::fixture();
        let original = serde_json::to_vec(&native).unwrap();
        let restored = decode(&original).unwrap();
        assert_eq!(serde_json::to_vec(&restored).unwrap(), original);
        assert!(!String::from_utf8_lossy(&original).contains("storage"));
        assert!(!String::from_utf8_lossy(&original).contains("Generation"));
        let mut file = native.clone();
        let g = uuid::Uuid::new_v4().to_string();
        file.schema_version = 2;
        file.development_generations.push(g.clone());
        file.active_development_generation = Some(g.clone());
        file.profiles[0].credential.as_mut().unwrap().storage =
            CredentialStorage::DevelopmentFile { generation_id: g };
        assert!(file.valid());
        assert_eq!(decode(&serde_json::to_vec(&file).unwrap()).unwrap(), file);
        let mut bad = file.clone();
        bad.development_generations.clear();
        assert!(!bad.valid());
        bad = file.clone();
        bad.schema_version = 1;
        assert!(!bad.valid());
        bad = file.clone();
        bad.development_generations
            .push(bad.development_generations[0].clone());
        assert!(!bad.valid());
        let mut json = serde_json::to_value(&file).unwrap();
        json["profiles"][0]["credential"]["storage"]["kind"] = "other".into();
        assert_eq!(
            decode(&serde_json::to_vec(&json).unwrap()),
            Err(ProfileDecodeError::Invalid)
        );
        json = serde_json::to_value(&file).unwrap();
        json["schemaVersion"] = 99.into();
        json["futureField"] = true.into();
        assert_eq!(
            decode(&serde_json::to_vec(&json).unwrap()),
            Err(ProfileDecodeError::Unsupported)
        );
    }
}

#[cfg(test)]
mod duplicate_profile_fields {
    use super::*;
    #[test]
    fn schema_inspection_does_not_collapse_duplicate_profile_fields() {
        let bytes = serde_json::to_string(&tests::fixture()).unwrap();
        let duplicate = bytes.replacen(
            "\"schemaVersion\":1",
            "\"schemaVersion\":1,\"schemaVersion\":1",
            1,
        );
        assert_eq!(
            decode(duplicate.as_bytes()),
            Err(ProfileDecodeError::Invalid)
        );
        let duplicate = bytes.replacen(
            "\"disabled\":false",
            "\"disabled\":false,\"disabled\":false",
            1,
        );
        assert_eq!(
            decode(duplicate.as_bytes()),
            Err(ProfileDecodeError::Invalid)
        );
    }
}
