//! Explicit, bounded GET only. No generation, retries, redirects or ambient proxy.
use crate::{
    ai_credentials::{valid_key, Result},
    ai_profiles::{http_address_allowed, StudioProfile},
};
use std::{
    net::{SocketAddr, ToSocketAddrs},
    sync::{Arc, Mutex},
    time::Duration,
};
use ureq::unversioned::{
    resolver::{ResolvedSocketAddrs, Resolver},
    transport::{DefaultConnector, NextTimeout},
};
#[derive(Debug)]
struct CheckedResolver {
    private: bool,
    previous: Option<Vec<SocketAddr>>,
    observed: Arc<Mutex<Vec<SocketAddr>>>,
}
impl Resolver for CheckedResolver {
    fn resolve(
        &self,
        uri: &ureq::http::Uri,
        _: &ureq::config::Config,
        timeout: NextTimeout,
    ) -> std::result::Result<ResolvedSocketAddrs, ureq::Error> {
        let host = uri
            .host()
            .ok_or(ureq::Error::HostNotFound)?
            .trim_matches(['[', ']'])
            .to_owned();
        let port = uri
            .port_u16()
            .unwrap_or(if uri.scheme_str() == Some("https") {
                443
            } else {
                80
            });
        let (tx, rx) = std::sync::mpsc::sync_channel(1);
        std::thread::spawn(move || {
            let result = (host.as_str(), port)
                .to_socket_addrs()
                .map(|v| v.collect::<Vec<_>>());
            let _ = tx.send(result);
        });
        let mut addresses = rx
            .recv_timeout((*timeout.after).min(Duration::from_secs(15)))
            .map_err(|_| ureq::Error::HostNotFound)?
            .map_err(|_| ureq::Error::HostNotFound)?;
        addresses.sort();
        addresses.dedup();
        if addresses.is_empty()
            || addresses.len() > 16
            || (uri.scheme_str() == Some("http")
                && addresses
                    .iter()
                    .any(|a| !http_address_allowed(a.ip(), self.private)))
            || self.previous.as_ref().is_some_and(|old| old != &addresses)
        {
            return Err(ureq::Error::HostNotFound);
        }
        *self
            .observed
            .lock()
            .map_err(|_| ureq::Error::HostNotFound)? = addresses.clone();
        let mut result = self.empty();
        for address in addresses {
            result.push(address);
        }
        Ok(result)
    }
}
#[derive(Clone)]
pub struct Discovery {
    pub models: Vec<String>,
    pub selected_available: bool,
    pub addresses: Vec<SocketAddr>,
}
pub fn discover(
    profile: &StudioProfile,
    key: &str,
    previous: Option<Vec<SocketAddr>>,
) -> Result<Discovery> {
    if !profile.credential_bound() || !valid_key(key) {
        return Err("Credential is missing, disabled or bound to another origin.");
    }
    let observed = Arc::new(Mutex::new(Vec::new()));
    let config = ureq::Agent::config_builder()
        .proxy(None)
        .max_redirects(0)
        .http_status_as_error(false)
        .timeout_global(Some(Duration::from_secs(15)))
        .timeout_resolve(Some(Duration::from_secs(15)))
        .build();
    let agent = ureq::Agent::with_parts(
        config,
        DefaultConnector::default(),
        CheckedResolver {
            private: profile.settings.private_http,
            previous,
            observed: observed.clone(),
        },
    );
    let mut response = agent
        .get(format!("{}/models", profile.settings.endpoint))
        .header("Authorization", format!("Bearer {key}"))
        .call()
        .map_err(|_| "Discovery connection failed or destination changed; no automatic retry.")?;
    if response.status() != 200 {
        return Err("Discovery HTTP status refused; no automatic retry.");
    }
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if content_type.split(';').next().unwrap_or("").trim() != "application/json" {
        return Err("Discovery requires JSON.");
    }
    let bytes = response
        .body_mut()
        .with_config()
        .limit(128 * 1024)
        .read_to_vec()
        .map_err(|_| "Discovery response unavailable or oversized.")?;
    let models = parse_models(&bytes)?;
    let addresses = observed
        .lock()
        .map_err(|_| "Discovery state unavailable.")?
        .clone();
    Ok(Discovery {
        selected_available: models.contains(&profile.settings.model),
        models,
        addresses,
    })
}
// Reject duplicate object keys before interpreting provider-controlled JSON.
struct Strict(serde_json::Value);
impl<'de> serde::Deserialize<'de> for Strict {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> std::result::Result<Self, D::Error> {
        struct V;
        impl<'de> serde::de::Visitor<'de> for V {
            type Value = Strict;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("bounded JSON")
            }
            fn visit_map<A: serde::de::MapAccess<'de>>(
                self,
                mut map: A,
            ) -> std::result::Result<Strict, A::Error> {
                let mut v = serde_json::Map::new();
                while let Some((k, Strict(value))) = map.next_entry::<String, Strict>()? {
                    if v.insert(k, value).is_some() {
                        return Err(serde::de::Error::custom("duplicate key"));
                    }
                }
                Ok(Strict(v.into()))
            }
            fn visit_seq<A: serde::de::SeqAccess<'de>>(
                self,
                mut seq: A,
            ) -> std::result::Result<Strict, A::Error> {
                let mut v = Vec::new();
                while let Some(Strict(item)) = seq.next_element()? {
                    v.push(item);
                }
                Ok(Strict(v.into()))
            }
            fn visit_str<E: serde::de::Error>(self, v: &str) -> std::result::Result<Strict, E> {
                Ok(Strict(v.into()))
            }
            fn visit_bool<E: serde::de::Error>(self, v: bool) -> std::result::Result<Strict, E> {
                Ok(Strict(v.into()))
            }
            fn visit_u64<E: serde::de::Error>(self, v: u64) -> std::result::Result<Strict, E> {
                Ok(Strict(v.into()))
            }
            fn visit_i64<E: serde::de::Error>(self, v: i64) -> std::result::Result<Strict, E> {
                Ok(Strict(v.into()))
            }
            fn visit_f64<E: serde::de::Error>(self, v: f64) -> std::result::Result<Strict, E> {
                serde_json::Number::from_f64(v)
                    .map(|n| Strict(n.into()))
                    .ok_or_else(|| serde::de::Error::custom("number"))
            }
            fn visit_unit<E: serde::de::Error>(self) -> std::result::Result<Strict, E> {
                Ok(Strict(serde_json::Value::Null))
            }
            fn visit_none<E: serde::de::Error>(self) -> std::result::Result<Strict, E> {
                self.visit_unit()
            }
        }
        d.deserialize_any(V)
    }
}
pub fn parse_models(bytes: &[u8]) -> Result<Vec<String>> {
    if bytes.len() > 128 * 1024 {
        return Err("Discovery response oversized.");
    }
    let value = strict_json(bytes)?;
    let data = value
        .get("data")
        .and_then(|v| v.as_array())
        .filter(|v| v.len() <= 256)
        .ok_or("Discovery model list invalid.")?;
    let mut models = Vec::new();
    for item in data {
        let id = item
            .get("id")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty() && s.len() <= 256 && !s.chars().any(char::is_control))
            .ok_or("Discovery model ID invalid.")?;
        if models.iter().any(|m| m == id) {
            return Err("Discovery duplicate model ID.");
        }
        models.push(id.to_owned());
    }
    Ok(models)
}
pub(crate) fn strict_json(bytes: &[u8]) -> Result<serde_json::Value> {
    // Bound nesting independently of serde_json's larger default recursion cap.
    let (mut depth, mut quoted, mut escaped) = (0usize, false, false);
    for byte in bytes {
        if quoted {
            if escaped {
                escaped = false;
            } else if *byte == b'\\' {
                escaped = true;
            } else if *byte == b'"' {
                quoted = false;
            }
        } else {
            match byte {
                b'"' => quoted = true,
                b'{' | b'[' => {
                    depth += 1;
                    if depth > 32 {
                        return Err("Discovery JSON nesting refused.");
                    }
                }
                b'}' | b']' => depth = depth.saturating_sub(1),
                _ => (),
            }
        }
    }
    let Strict(value) = serde_json::from_slice(bytes).map_err(|_| "Discovery JSON invalid.")?;
    Ok(value)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn whole_document_and_duplicate_model_boundaries() {
        let deep = format!("{}0{}", "[".repeat(33), "]".repeat(33));
        assert!(parse_models(deep.as_bytes()).is_err());
        assert_eq!(
            parse_models(br#"{"data":[{"id":"model"}]}"#).unwrap(),
            vec!["model"]
        );
        for bytes in [
            br#"{"data":[],"data":[]}"#.as_slice(),
            br#"{"data":[{"id":"a","id":"b"}]}"#,
            br#"{"data":[{"id":"a"},{"id":"a"}]}"#,
            br#"{"data":[]} trailing"#,
            br#"{"data":[{"id":"bad\n"}]}"#,
        ] {
            assert!(parse_models(bytes).is_err());
        }
    }
}
