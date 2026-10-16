//! Bounded Studio JSON transport. Verified HTTPS and reviewed DNS sets; no edits, TLS fallback,
//! redirects, provider retries or persistent replies. Other destinations refuse use.
use crate::{
    ai_credentials::{valid_key, Secret},
    ai_profiles::StudioProfile,
};
use serde::Serialize;
use serde_json::{json, Value};
use std::{
    net::{IpAddr, Shutdown, SocketAddr, TcpStream, ToSocketAddrs},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex,
    },
    time::{Duration, Instant},
};
use ureq::unversioned::{
    resolver::{ResolvedSocketAddrs, Resolver},
    transport::{
        Buffers, ConnectionDetails, Connector, LazyBuffers, NextTimeout, RustlsConnector, Transport,
    },
};

pub const MAX_BODY: usize = 2 * 1024 * 1024;
pub const MAX_RESPONSE: usize = 8 * 1024 * 1024;
pub const MAX_TEXT: usize = 2 * 1024 * 1024;
pub const SYNTHETIC_PROMPT: &str = "This is a synthetic Loomlight connection test. Reply with the short text: Loomlight synthetic response. No tools.";
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Failure {
    Configuration,
    UnsupportedDestination,
    UnsupportedTlsIpv6,
    DestinationChanged,
    Context,
    Credential,
    Connection,
    Timeout,
    Authentication,
    Busy,
    Redirect,
    Provider,
    Http,
    Malformed,
    Oversized,
    UnsupportedResponse,
    Cancelled,
    ModelUnsupported,
    ModelUnavailable,
    ModelConflict,
    ModelCapacity,
    ModelContext,
    ModelLoadContext,
    ModelNotReady,
    ModelLoad,
    ModelSettingsUnsupported,
    ModelSettingsUnsafe,
    ModelSettingsChanged,
}
impl Failure {
    pub fn code(self) -> &'static str {
        match self {
            Self::Configuration => "configuration",
            Self::UnsupportedDestination => "unsupported_destination",
            Self::UnsupportedTlsIpv6 => "unsupported_tls_ipv6",
            Self::DestinationChanged => "destination_changed",
            Self::Context => "context_limit",
            Self::Credential => "credential",
            Self::Connection => "connection",
            Self::Timeout => "timeout",
            Self::Authentication => "authentication",
            Self::Busy => "busy",
            Self::Redirect => "redirect",
            Self::Provider => "provider",
            Self::Http => "http",
            Self::Malformed => "malformed",
            Self::Oversized => "oversized",
            Self::UnsupportedResponse => "unsupported_response",
            Self::Cancelled => "cancelled",
            Self::ModelUnsupported => "model_interface",
            Self::ModelUnavailable => "model_unavailable",
            Self::ModelConflict => "model_conflict",
            Self::ModelCapacity => "model_capacity_unknown",
            Self::ModelContext => "model_context_insufficient",
            Self::ModelLoadContext => "model_context_insufficient",
            Self::ModelNotReady => "model_not_ready",
            Self::ModelLoad => "model_load",
            Self::ModelSettingsUnsupported => "model_settings_interface",
            Self::ModelSettingsUnsafe => "model_settings_preservation",
            Self::ModelSettingsChanged => "model_settings_changed",
        }
    }
    pub fn message(self) -> &'static str {
        match self {
        Self::Configuration=>"Saved request settings are invalid or unsupported.",
        Self::UnsupportedDestination=>"Studio requests require verified HTTPS or a literal loopback/private opted-in HTTP address. This destination is unsupported.",
        Self::UnsupportedTlsIpv6=>"The pinned Studio TLS adapter cannot verify literal IPv6 HTTPS destinations. Use a certificate-matching HTTPS hostname instead.",
        Self::DestinationChanged=>"Studio destination addresses changed. Prepare and review the request again.",
        Self::Context=>"Synthetic input, visible margin and response reserve exceed the saved context budget.",
        Self::Credential=>"Credential is missing, unavailable, disabled or bound to another origin.",
        Self::Connection=>"Studio server is unavailable or the connection was interrupted.",
        Self::Timeout=>"Request timed out. No automatic retry.",
        Self::Authentication=>"Studio refused authentication (401/403). Check the saved credential.",
        Self::Busy=>"Studio is busy or rate limited (429). No automatic retry.",
        Self::Redirect=>"Studio redirect refused. No destination switch.",
        Self::Provider=>"Studio server failed (5xx). No automatic retry.",
        Self::Http=>"Studio returned an unsupported HTTP status.",
        Self::Malformed=>"Studio returned malformed JSON. Response discarded.",
        Self::Oversized=>"Studio response exceeds the application size limit. Response discarded.",
        Self::UnsupportedResponse=>"Studio response is unsupported or incomplete. Response discarded.",
        Self::Cancelled=>"Client request cancelled; server computation or model loading may continue.",
        Self::ModelSettingsUnsupported=>"Unsloth Studio cannot verify its model-load settings interface. No settings fallback or automatic retry was used.",
        Self::ModelSettingsUnsafe=>"Existing Unsloth Studio model options cannot be safely preserved. Review the selected model configuration in Studio before applying changes.",
        Self::ModelSettingsChanged=>"Saved profiles changed before the settings write; no settings were applied.",
        Self::ModelUnsupported=>"Studio cannot verify this model loading interface. Load the selected model in Studio and retry; no generation was sent.",
        Self::ModelUnavailable=>"The selected model or exact GGUF variant is not verified as completely downloaded in Studio. No model download or generation was requested.",
        Self::ModelConflict=>"Studio has another loaded or loading model. Keep it intact and select that model, or manage models in Studio before retrying. No generation was sent.",
        Self::ModelCapacity=>"Studio did not report the loaded model’s actual context length. Check Studio before retrying; no generation was sent.",
        Self::ModelContext=>"The loaded Unsloth Studio context cannot fit this request plus its response allowance; no generation was sent.",
        Self::ModelLoadContext=>"Unsloth Studio completed a local model load but its actual context cannot fit this request plus its response allowance; no generation was sent.",
        Self::ModelNotReady=>"Studio has not confirmed the selected model is ready. Check Studio before retrying; no generation was sent.",
        Self::ModelLoad=>"Studio did not confirm a successful local model load. Check Studio before retrying; no generation was sent.",
    }
    }
}
pub type Result<T> = std::result::Result<T, Failure>;
// Deliberately no Debug/Serialize: captures exact secret/config/body in the native boundary.
pub struct Prepared {
    pub profile: StudioProfile,
    pub body: Vec<u8>,
    pub estimated_input: u32,
    pub margin: u32,
    pub timeout: Duration,
    destination: Destination,
    key: Secret,
}
pub fn prepare(profile: StudioProfile, key: Secret, timeout_seconds: u32) -> Result<Prepared> {
    let body=serde_json::to_vec(&json!({"model":profile.settings.model,"messages":[{"role":"user","content":SYNTHETIC_PROMPT}],"stream":false,"max_tokens":profile.settings.maximum_response,"temperature":profile.settings.temperature(),"top_p":profile.settings.top_p(),"enable_thinking":profile.settings.thinking(),"enable_tools":false,"enabled_tools":[]})).map_err(|_|Failure::Configuration)?;
    prepare_reviewed(profile, key, timeout_seconds, body)
}

/// Body is obtained from the core-owned, consumed review token, never renderer JSON.
pub fn prepare_reviewed(
    profile: StudioProfile,
    key: Secret,
    timeout_seconds: u32,
    body: Vec<u8>,
) -> Result<Prepared> {
    // Reject invalid or unbound explicit diagnostics before any DNS lookup.
    if !profile.settings.valid() || !(30..=1800).contains(&timeout_seconds) {
        return Err(Failure::Configuration);
    }
    if !profile.credential_bound() || !valid_key(&key) {
        return Err(Failure::Credential);
    }
    let destination = resolve_destination(&profile.settings)?;
    prepare_reviewed_bound(profile, key, timeout_seconds, body, destination)
}

/// The destination is captured by the native, one-use review token, never renderer JSON.
pub fn prepare_reviewed_bound(
    profile: StudioProfile,
    key: Secret,
    timeout_seconds: u32,
    body: Vec<u8>,
    reviewed: Destination,
) -> Result<Prepared> {
    if !profile.settings.valid() || !(30..=1800).contains(&timeout_seconds) {
        return Err(Failure::Configuration);
    }
    if !profile.credential_bound() || !valid_key(&key) {
        return Err(Failure::Credential);
    }
    destination(&profile.settings)?;
    if !reviewed.valid_for(&profile.settings) {
        return Err(Failure::UnsupportedDestination);
    }
    if body.len() > MAX_BODY {
        return Err(Failure::Context);
    }
    // Conservative byte-based estimate, including all framing; no capacity claim.
    let estimated_input = body.len() as u32;
    let margin = 128.max(estimated_input.div_ceil(10));
    if u64::from(estimated_input) + u64::from(margin) + u64::from(profile.settings.maximum_response)
        > u64::from(profile.settings.context_budget)
        || u64::from(estimated_input)
            + u64::from(margin)
            + u64::from(profile.settings.maximum_response)
            > u64::from(profile.settings.context_ceiling)
    {
        return Err(Failure::Context);
    }
    Ok(Prepared {
        profile,
        body,
        estimated_input,
        margin,
        timeout: Duration::from_secs(timeout_seconds.into()),
        destination: reviewed,
        key,
    })
}

/// Pure endpoint admission. Saving or checking settings never resolves DNS.
pub fn destination(settings: &crate::ai_profiles::StudioSettings) -> Result<()> {
    let uri: ureq::http::Uri = settings
        .endpoint
        .parse()
        .map_err(|_| Failure::Configuration)?;
    let host = uri
        .host()
        .ok_or(Failure::Configuration)?
        .trim_matches(['[', ']']);
    match uri.scheme_str() {
        Some("http") => {
            let ip = host.parse().map_err(|_| Failure::UnsupportedDestination)?;
            if !crate::ai_profiles::http_address_allowed(ip, settings.private_http) {
                return Err(Failure::UnsupportedDestination);
            }
        }
        Some("https") => {
            if let Ok(ip) = host.parse::<IpAddr>() {
                // Pinned ureq 3.1.4 forwards bracketed IPv6 authority text into
                // Rustls ServerName. Refuse explicitly rather than accept a setup
                // that cannot verify its IP SAN. Hostnames resolving IPv6 work.
                if ip.is_ipv6() {
                    return Err(Failure::UnsupportedTlsIpv6);
                }
                if !https_address_allowed(ip) {
                    return Err(Failure::UnsupportedDestination);
                }
            }
        }
        _ => return Err(Failure::UnsupportedDestination),
    }
    if uri.port_u16().is_none_or(|p| p == 0) {
        return Err(Failure::Configuration);
    }
    Ok(())
}

/// The complete reviewed address set, sorted and deduplicated. No credential or body.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Destination {
    pub addresses: Vec<SocketAddr>,
}
impl Destination {
    fn valid_for(&self, settings: &crate::ai_profiles::StudioSettings) -> bool {
        let Ok(uri) = settings.endpoint.parse::<ureq::http::Uri>() else {
            return false;
        };
        let mut sorted = self.addresses.clone();
        sorted.sort_unstable();
        sorted.dedup();
        if sorted != self.addresses || sorted.is_empty() || sorted.len() > 32 {
            return false;
        }
        let literal = uri
            .host()
            .unwrap_or("")
            .trim_matches(['[', ']'])
            .parse::<IpAddr>()
            .ok();
        sorted.iter().all(|a| {
            Some(a.port()) == uri.port_u16()
                && literal.is_none_or(|ip| a.ip() == ip)
                && if uri.scheme_str() == Some("https") {
                    https_address_allowed(a.ip())
                } else {
                    literal.is_some()
                        && crate::ai_profiles::http_address_allowed(a.ip(), settings.private_http)
                }
        })
    }
}

// Admit ordinary unicast public HTTPS as well as loopback/LAN. Refuse misrouting
// classes even under TLS, including mapped IPv4 equivalents.
fn https_address_allowed(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            let [a, b, c, _] = v4.octets();
            !(a == 0
                || a >= 224
                || v4.is_link_local()
                || v4.is_broadcast()
                || (a == 100 && (64..=127).contains(&b))
                || (a == 192 && b == 0 && (c == 0 || c == 2))
                || (a == 198 && (b == 18 || b == 19 || (b == 51 && c == 100)))
                || (a == 203 && b == 0 && c == 113))
        }
        IpAddr::V6(v6) => {
            if let Some(v4) = v6.to_ipv4_mapped() {
                return https_address_allowed(IpAddr::V4(v4));
            }
            let octets = v6.octets();
            v6.is_loopback()
                || v6.is_unique_local()
                || (octets[0] & 0xe0 == 0x20 && !(octets[..4] == [0x20, 0x01, 0x0d, 0xb8]))
        }
    }
}

static DNS_ACTIVE: AtomicBool = AtomicBool::new(false);
/// Resolve only for an explicit user operation, outside project/native service locks.
/// A stalled system resolver is isolated to one secret-free worker globally. The
/// caller waits at most one second; no queued retry or abandoned-worker accumulation.
pub fn resolve_destination(settings: &crate::ai_profiles::StudioSettings) -> Result<Destination> {
    resolve_destination_until(settings, Instant::now() + Duration::from_secs(1))
}

/// Authenticated discovery for a native-owned connection draft. GET only, with
/// the same destination/TLS/cancellation guards as ordinary Studio operations.
pub fn discover_connection(profile: StudioProfile, key: Secret, cancel: &Cancel) -> Result<crate::ai_discovery::Discovery> {
    let destination=resolve_destination(&profile.settings)?;
    let prepared=prepare_reviewed_bound(profile,key,30,Vec::new(),destination.clone())?;
    let value=model_exchange(&prepared,cancel,Instant::now()+Duration::from_secs(15),"/v1/models",None,ureq::tls::TlsConfig::default())?;
    let bytes=serde_json::to_vec(&value).map_err(|_|Failure::Malformed)?;
    if bytes.len()>128*1024 {return Err(Failure::Oversized);}
    let models=crate::ai_discovery::parse_models(&bytes).map_err(|_|Failure::Malformed)?;
    if models.iter().any(|model|model.contains(&*prepared.key)) {return Err(Failure::UnsupportedResponse);}
    Ok(crate::ai_discovery::Discovery {models,inventory:crate::studio_models::parse_inventory(&bytes)?,selected_available:false,addresses:destination.addresses})
}

fn remaining(deadline: Instant) -> Result<Duration> {
    let remaining = deadline.saturating_duration_since(Instant::now());
    if remaining.is_zero() {
        Err(Failure::Timeout)
    } else {
        Ok(remaining)
    }
}

fn receive_resolved(
    receive: mpsc::Receiver<std::io::Result<Vec<SocketAddr>>>,
    deadline: Instant,
) -> Result<Vec<SocketAddr>> {
    receive
        .recv_timeout(remaining(deadline)?.min(Duration::from_secs(1)))
        .map_err(|_| Failure::Timeout)?
        .map_err(|_| Failure::Connection)
}

fn resolve_destination_until(
    settings: &crate::ai_profiles::StudioSettings,
    deadline: Instant,
) -> Result<Destination> {
    remaining(deadline)?;
    destination(settings)?;
    let uri: ureq::http::Uri = settings
        .endpoint
        .parse()
        .map_err(|_| Failure::Configuration)?;
    let host = uri
        .host()
        .ok_or(Failure::Configuration)?
        .trim_matches(['[', ']']);
    let port = uri.port_u16().ok_or(Failure::Configuration)?;
    let addresses = if let Ok(ip) = host.parse() {
        vec![SocketAddr::new(ip, port)]
    } else {
        if DNS_ACTIVE
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return Err(Failure::Busy);
        }
        let (send, receive) = mpsc::sync_channel(1);
        let host = host.to_owned();
        if std::thread::Builder::new()
            .name("studio-destination".into())
            .spawn(move || {
                let resolved = (host.as_str(), port)
                    .to_socket_addrs()
                    .map(|a| a.take(33).collect::<Vec<_>>());
                DNS_ACTIVE.store(false, Ordering::SeqCst);
                let _ = send.send(resolved);
            })
            .is_err()
        {
            DNS_ACTIVE.store(false, Ordering::SeqCst);
            return Err(Failure::Connection);
        }
        receive_resolved(receive, deadline)?
    };
    admitted_destination(settings, addresses)
}

fn admitted_destination(
    settings: &crate::ai_profiles::StudioSettings,
    mut addresses: Vec<SocketAddr>,
) -> Result<Destination> {
    // Every returned answer must be admitted; reject oversized sets rather than hide answers.
    if addresses.len() > 32 {
        return Err(Failure::UnsupportedDestination);
    }
    addresses.sort_unstable();
    addresses.dedup();
    let resolved = Destination { addresses };
    if !resolved.valid_for(settings) {
        return Err(Failure::UnsupportedDestination);
    }
    Ok(resolved)
}
#[derive(Default)]
struct CancelInner {
    cancelled: AtomicBool,
    socket: Mutex<Option<Arc<TcpStream>>>,
    #[cfg(test)]
    shutdown_observation: Mutex<Option<std::result::Result<(), (std::io::ErrorKind, Option<i32>)>>>,
}
#[derive(Clone, Default)]
pub struct Cancel(Arc<CancelInner>);
impl std::fmt::Debug for Cancel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("RequestCancellation")
    }
}
impl Cancel {
    pub fn cancel(&self) {
        self.0.cancelled.store(true, Ordering::SeqCst);
        self.close_socket();
    }
    pub fn cancelled(&self) -> bool {
        self.0.cancelled.load(Ordering::SeqCst)
    }
    pub fn close_socket(&self) {
        if let Ok(mut socket) = self.0.socket.lock() {
            if let Some(s) = socket.take() {
                let _shutdown = s.shutdown(Shutdown::Both);
                #[cfg(test)]
                {
                    *self.0.shutdown_observation.lock().unwrap() =
                        Some(_shutdown.map_err(|error| (error.kind(), error.raw_os_error())));
                }
            }
        }
    }
}
#[derive(Debug)]
struct FixedResolver(SocketAddr);
impl Resolver for FixedResolver {
    fn resolve(
        &self,
        _: &ureq::http::Uri,
        _: &ureq::config::Config,
        _: NextTimeout,
    ) -> std::result::Result<ResolvedSocketAddrs, ureq::Error> {
        let mut a = self.empty();
        a.push(self.0);
        Ok(a)
    }
}
#[derive(Debug)]
struct AbortConnector {
    address: SocketAddr,
    deadline: Instant,
    cancel: Cancel,
}
impl Connector for AbortConnector {
    type Out = OwnedTransport;
    fn connect(
        &self,
        details: &ConnectionDetails,
        _: Option<()>,
    ) -> std::result::Result<Option<OwnedTransport>, ureq::Error> {
        if self.cancel.cancelled() || details.addrs.len() != 1 || details.addrs[0] != self.address {
            return Err(ureq::Error::ConnectionFailed);
        }
        // One reviewed exact-address connect attempt. A one-second deadline also bounds
        // cancellation while the OS is connecting, before a socket can be owned.
        let connect_budget = io_budget(self.deadline, details.timeout)?.min(Duration::from_secs(1));
        let stream = Arc::new(TcpStream::connect_timeout(&self.address, connect_budget)?);
        let mut owned = self
            .cancel
            .0
            .socket
            .lock()
            .map_err(|_| ureq::Error::ConnectionFailed)?;
        if self.cancel.cancelled() {
            let _ = stream.shutdown(Shutdown::Both);
            return Err(ureq::Error::ConnectionFailed);
        }
        // Cancellation and transport IO share the exact connected OS handle,
        // including after the response moves into ureq's body reader.
        *owned = Some(Arc::clone(&stream));
        Ok(Some(OwnedTransport {
            stream,
            deadline: self.deadline,
            buffers: LazyBuffers::new(
                details.config.input_buffer_size(),
                details.config.output_buffer_size(),
            ),
        }))
    }
}
struct OwnedTransport {
    stream: Arc<TcpStream>,
    deadline: Instant,
    buffers: LazyBuffers,
}
impl std::fmt::Debug for OwnedTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("OwnedRequestTransport")
    }
}
fn io_budget(
    deadline: Instant,
    timeout: NextTimeout,
) -> std::result::Result<Duration, ureq::Error> {
    let remaining = remaining(deadline).map_err(|_| ureq::Error::Timeout(ureq::Timeout::Global))?;
    // NextTimeout::not_zero extends an already expired timeout to one second.
    // Preserve the actual remaining duration instead of extending the deadline.
    let budget = remaining.min(*timeout.after);
    if budget.is_zero() {
        Err(ureq::Error::Timeout(timeout.reason))
    } else {
        Ok(budget)
    }
}

impl Transport for OwnedTransport {
    fn buffers(&mut self) -> &mut dyn Buffers {
        &mut self.buffers
    }
    fn transmit_output(
        &mut self,
        amount: usize,
        timeout: NextTimeout,
    ) -> std::result::Result<(), ureq::Error> {
        use std::io::Write;
        let mut sent = 0;
        while sent < amount {
            self.stream
                .set_write_timeout(Some(io_budget(self.deadline, timeout)?))?;
            match (&*self.stream).write(&self.buffers.output()[sent..amount]) {
                Ok(0) => return Err(std::io::Error::from(std::io::ErrorKind::WriteZero).into()),
                Ok(n) => sent += n,
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock
                    ) =>
                {
                    return Err(ureq::Error::Timeout(timeout.reason));
                }
                Err(e) => return Err(e.into()),
            }
        }
        Ok(())
    }
    fn await_input(&mut self, timeout: NextTimeout) -> std::result::Result<bool, ureq::Error> {
        use std::io::Read;
        self.stream
            .set_read_timeout(Some(io_budget(self.deadline, timeout)?))?;
        let count = match (&*self.stream).read(self.buffers.input_append_buf()) {
            Ok(n) => n,
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock
                ) =>
            {
                return Err(ureq::Error::Timeout(timeout.reason))
            }
            Err(e) => return Err(e.into()),
        };
        self.buffers.input_appended(count);
        Ok(count > 0)
    }
    fn is_open(&mut self) -> bool {
        false
    } // One request; never return a socket to a pool.
}
#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Usage {
    pub prompt_tokens: Option<u64>,
    pub completion_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
    pub reasoning_tokens: Option<u64>,
}
#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Completion {
    pub text: String,
    pub model: String,
    pub finish_reason: String,
    pub usage: Usage,
    pub response_bytes: usize,
}
pub fn parse(bytes: &[u8], model: &str) -> Result<Completion> {
    if bytes.len() > MAX_RESPONSE {
        return Err(Failure::Oversized);
    }
    let value = crate::ai_discovery::strict_json(bytes).map_err(|_| Failure::Malformed)?;
    let choices = value
        .get("choices")
        .and_then(Value::as_array)
        .filter(|v| v.len() == 1)
        .ok_or(Failure::UnsupportedResponse)?;
    let choice = &choices[0];
    let message = &choice["message"];
    if value["model"].as_str() != Some(model)
        || choice["index"].as_u64() != Some(0)
        || choice["finish_reason"].as_str() != Some("stop")
        || message["role"].as_str() != Some("assistant")
    {
        return Err(Failure::UnsupportedResponse);
    }
    for key in ["tool_calls", "function_call", "refusal", "tool_results"] {
        if message
            .get(key)
            .is_some_and(|v| !v.is_null() && v.as_array().is_none_or(|a| !a.is_empty()))
        {
            return Err(Failure::UnsupportedResponse);
        }
    }
    if value.get("error").is_some_and(|v| !v.is_null()) {
        return Err(Failure::UnsupportedResponse);
    }
    for key in ["reasoning", "reasoning_content"] {
        if let Some(v) = message.get(key).filter(|v| !v.is_null()) {
            if v.as_str().is_none_or(|s| s.len() > MAX_TEXT) {
                return Err(Failure::UnsupportedResponse);
            }
        }
    }
    let text = message["content"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .ok_or(Failure::UnsupportedResponse)?;
    if text.len() > MAX_TEXT {
        return Err(Failure::Oversized);
    }
    let usage = value.get("usage").filter(|v| !v.is_null());
    if usage.is_some_and(|v| !v.is_object()) {
        return Err(Failure::UnsupportedResponse);
    }
    let token = |name: &str| -> Result<Option<u64>> {
        match usage.and_then(|u| u.get(name)) {
            None | Some(Value::Null) => Ok(None),
            Some(n) => n.as_u64().map(Some).ok_or(Failure::UnsupportedResponse),
        }
    };
    let (prompt, completion, total) = (
        token("prompt_tokens")?,
        token("completion_tokens")?,
        token("total_tokens")?,
    );
    if let (Some(p), Some(c), Some(t)) = (prompt, completion, total) {
        if p.checked_add(c) != Some(t) {
            return Err(Failure::UnsupportedResponse);
        }
    }
    let details = usage
        .and_then(|u| u.get("completion_tokens_details"))
        .filter(|v| !v.is_null());
    if details.is_some_and(|v| !v.is_object()) {
        return Err(Failure::UnsupportedResponse);
    }
    let reasoning = match details.and_then(|d| d.get("reasoning_tokens")) {
        None | Some(Value::Null) => None,
        Some(n) => Some(n.as_u64().ok_or(Failure::UnsupportedResponse)?),
    };
    if reasoning.zip(completion).is_some_and(|(r, c)| r > c) {
        return Err(Failure::UnsupportedResponse);
    }
    Ok(Completion {
        text: text.to_owned(),
        model: model.into(),
        finish_reason: "stop".into(),
        usage: Usage {
            prompt_tokens: prompt,
            completion_tokens: completion,
            total_tokens: total,
            reasoning_tokens: reasoning,
        },
        response_bytes: bytes.len(),
    })
}
fn map_error(error: ureq::Error) -> Failure {
    match error {
        ureq::Error::Timeout(_) => Failure::Timeout,
        ureq::Error::BodyExceedsLimit(_) | ureq::Error::LargeResponseHeader(..) => {
            Failure::Oversized
        }
        ureq::Error::TooManyRedirects | ureq::Error::RedirectFailed => Failure::Redirect,
        _ => Failure::Connection,
    }
}
pub fn execute(
    prepared: Prepared,
    cancel: &Cancel,
    stage: impl Fn(&str),
    http_status: &mut Option<u16>,
) -> Result<Completion> {
    execute_with_tls(
        prepared,
        cancel,
        stage,
        http_status,
        ureq::tls::TlsConfig::default(),
    )
}

/// Native generation entry point: model readiness and generation share one cancellation/deadline.
pub fn execute_ready(
    prepared: Prepared,
    cancel: &Cancel,
    stage: impl Fn(&str),
    http_status: &mut Option<u16>,
    ready: impl Fn(&crate::studio_models::Readiness),
) -> Result<Completion> {
    execute_inner(
        prepared,
        cancel,
        stage,
        http_status,
        ureq::tls::TlsConfig::default(),
        true,
        ready,
    )
}

fn execute_with_tls(
    prepared: Prepared,
    cancel: &Cancel,
    stage: impl Fn(&str),
    http_status: &mut Option<u16>,
    tls: ureq::tls::TlsConfig,
) -> Result<Completion> {
    execute_inner(prepared, cancel, stage, http_status, tls, false, |_| {})
}

fn execute_inner(
    prepared: Prepared,
    cancel: &Cancel,
    stage: impl Fn(&str),
    http_status: &mut Option<u16>,
    tls: ureq::tls::TlsConfig,
    check_model: bool,
    ready: impl Fn(&crate::studio_models::Readiness),
) -> Result<Completion> {
    // DNS, connect, TLS and response IO share one absolute generation deadline.
    let deadline = Instant::now() + prepared.timeout;
    // This scope drops the entire agent/response/buffers before the completion is published.
    let result = (|| {
        if cancel.cancelled() {
            return Err(Failure::Cancelled);
        }
        let current = resolve_destination_until(&prepared.profile.settings, deadline)?;
        if current != prepared.destination {
            return Err(Failure::DestinationChanged);
        }
        if cancel.cancelled() {
            return Err(Failure::Cancelled);
        }
        let mut context_limit = prepared.profile.settings.context_budget;
        if check_model {
            let observation = crate::studio_models::ensure_ready(
                &prepared.profile.settings,
                cancel,
                &stage,
                |path, body| model_exchange(&prepared, cancel, deadline, path, body, tls.clone()),
            )?;
            let required = u64::from(prepared.estimated_input) + u64::from(prepared.margin)
                + u64::from(prepared.profile.settings.maximum_response);
            if required > u64::from(observation.actual_context) {
                return Err(if observation.loaded_for_request {Failure::ModelLoadContext} else {Failure::ModelContext});
            }
            context_limit = context_limit.min(observation.actual_context);
            ready(&observation);
            stage("sending");
        }
        let address = current.addresses[0];
        let config = ureq::Agent::config_builder()
            .tls_config(tls)
            .proxy(None)
            .max_redirects(0)
            .http_status_as_error(false)
            .max_idle_connections(0)
            .timeout_global(Some(remaining(deadline)?))
            .timeout_connect(Some(Duration::from_secs(1)))
            .max_response_header_size(32 * 1024)
            .build();
        let agent = ureq::Agent::with_parts(
            config,
            AbortConnector {
                address,
                deadline,
                cancel: cancel.clone(),
            }
            .chain(RustlsConnector::default()),
            FixedResolver(address),
        );
        let mut response = agent
            .post(format!(
                "{}/chat/completions",
                prepared.profile.settings.endpoint
            ))
            .header("Authorization", format!("Bearer {}", &*prepared.key))
            .header("Content-Type", "application/json")
            .header("Connection", "close")
            .send(&prepared.body)
            .map_err(map_error)?;
        let status = response.status().as_u16();
        *http_status = Some(status);
        match status {
            200 => (),
            401 | 403 => return Err(Failure::Authentication),
            429 => return Err(Failure::Busy),
            300..=399 => return Err(Failure::Redirect),
            500..=599 => return Err(Failure::Provider),
            _ => return Err(Failure::Http),
        }
        stage("receiving");
        let headers = response.headers();
        if headers
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .is_none_or(|v| v.split(';').next().unwrap_or("").trim() != "application/json")
            || headers
                .get("content-encoding")
                .is_some_and(|v| v != "identity")
        {
            return Err(Failure::UnsupportedResponse);
        }
        if let Some(length) = headers.get("content-length") {
            let count = length
                .to_str()
                .ok()
                .and_then(|s| s.parse::<u64>().ok())
                .ok_or(Failure::Malformed)?;
            if count > MAX_RESPONSE as u64 {
                return Err(Failure::Oversized);
            }
        }
        let bytes = response
            .body_mut()
            .with_config()
            .limit(MAX_RESPONSE as u64)
            .read_to_vec()
            .map_err(map_error)?;
        if cancel.cancelled() {
            return Err(Failure::Cancelled);
        }
        remaining(deadline)?;
        stage("validating");
        let completion = parse(&bytes, &prepared.profile.settings.model)?;
        if completion
            .usage
            .completion_tokens
            .is_some_and(|n| n > u64::from(prepared.profile.settings.maximum_response))
            || completion
                .usage
                .reasoning_tokens
                .is_some_and(|n| n > u64::from(prepared.profile.settings.maximum_response))
            || completion
                .usage
                .prompt_tokens
                .is_some_and(|n| n > u64::from(context_limit))
            || completion
                .usage
                .total_tokens
                .is_some_and(|n| n > u64::from(context_limit))
        {
            return Err(Failure::Oversized);
        }
        remaining(deadline)?;
        Ok(completion)
    })();
    cancel.close_socket();
    if cancel.cancelled() {
        Err(Failure::Cancelled)
    } else {
        result
    }
}

/// Only fixed Studio management routes reach here; never renderer/project URLs or bodies.
fn model_exchange(
    prepared: &Prepared,
    cancel: &Cancel,
    deadline: Instant,
    path: &str,
    body: Option<&Value>,
    tls: ureq::tls::TlsConfig,
) -> Result<Value> {
    model_exchange_observed(
        prepared, cancel, deadline, path, body, tls,
        #[cfg(any(test, debug_assertions))]
        None,
    )
}
fn model_exchange_observed(
    prepared: &Prepared,
    cancel: &Cancel,
    deadline: Instant,
    path: &str,
    body: Option<&Value>,
    tls: ureq::tls::TlsConfig,
    #[cfg(any(test, debug_assertions))] observed_http: Option<&mut Option<u16>>,
) -> Result<Value> {
    model_exchange_method(prepared, cancel, deadline, path, body, tls, false,
        #[cfg(any(test, debug_assertions))]
        observed_http,
        #[cfg(not(any(test, debug_assertions)))]
        None,
    )
}
fn model_exchange_method(
    prepared: &Prepared, cancel: &Cancel, deadline: Instant, path: &str,
    body: Option<&Value>, tls: ureq::tls::TlsConfig, put: bool,
    observed_http: Option<&mut Option<u16>>,
) -> Result<Value> {
    if cancel.cancelled() {
        return Err(Failure::Cancelled);
    }
    let current = resolve_destination_until(&prepared.profile.settings, deadline)?;
    if current != prepared.destination {
        return Err(Failure::DestinationChanged);
    }
    let base = prepared
        .profile
        .settings
        .endpoint
        .strip_suffix("/v1")
        .ok_or(Failure::Configuration)?;
    let config = ureq::Agent::config_builder()
        .tls_config(tls)
        .proxy(None)
        .max_redirects(0)
        .http_status_as_error(false)
        .max_idle_connections(0)
        .timeout_global(Some(remaining(deadline)?))
        .timeout_connect(Some(Duration::from_secs(1)))
        .max_response_header_size(32 * 1024)
        .build();
    let address = current.addresses[0];
    let agent = ureq::Agent::with_parts(
        config,
        AbortConnector {
            address,
            deadline,
            cancel: cancel.clone(),
        }
        .chain(RustlsConnector::default()),
        FixedResolver(address),
    );
    let url = format!("{base}{path}");
    let mut response = if let Some(body) = body {
        let bytes = serde_json::to_vec(body).map_err(|_| Failure::Configuration)?;
        (if put { agent.put(url) } else { agent.post(url) })
            .header("Authorization", format!("Bearer {}", &*prepared.key))
            .header("Content-Type", "application/json")
            .header("Connection", "close")
            .send(&bytes)
    } else {
        agent
            .get(url)
            .header("Authorization", format!("Bearer {}", &*prepared.key))
            .header("Connection", "close")
            .call()
    }
    .map_err(map_error)?;
    if let Some(observed) = observed_http {
        *observed = Some(response.status().as_u16());
    }
    match response.status().as_u16() {
        200 => (),
        401 | 403 => return Err(Failure::Authentication),
        409 => return Err(Failure::ModelConflict),
        429 => return Err(Failure::Busy),
        300..=399 => return Err(Failure::Redirect),
        404 | 405 => return Err(Failure::ModelUnsupported),
        500..=599 => return Err(Failure::Provider),
        _ => return Err(Failure::Http),
    }
    if response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .is_none_or(|v| v.split(';').next().unwrap_or("").trim() != "application/json")
        || response
            .headers()
            .get("content-encoding")
            .is_some_and(|v| v != "identity")
    {
        return Err(Failure::UnsupportedResponse);
    }
    let bytes = response
        .body_mut()
        .with_config()
        .limit(if path=="/v1/models" {128*1024}else{crate::studio_models::MAX_MODEL_RESPONSE as u64})
        .read_to_vec()
        .map_err(map_error)?;
    cancel.close_socket();
    if cancel.cancelled() {
        return Err(Failure::Cancelled);
    }
    remaining(deadline)?;
    crate::ai_discovery::strict_json(&bytes).map_err(|_| Failure::Malformed)
}



/// Explicit per-model management through the same captured native credential,
/// destination, TLS, cancellation and absolute deadline as normal Studio requests.
/// This never changes global auto-switch, unloads/reloads a model, or sends chat.
pub fn model_load_settings(
    prepared: Prepared, apply: bool, cancel: &Cancel, before_write: impl Fn() -> bool,
) -> Result<crate::studio_config::Report> {
    use crate::studio_config::{self as config, Report, Requested};
    if apply && prepared.profile.settings.model_load.is_none() {return Err(Failure::Configuration);}
    let deadline=Instant::now()+prepared.timeout;
    let exchange=|path:&str,body:Option<&Value>,put:bool,http:Option<&mut Option<u16>>| {
        let result=model_exchange_method(&prepared,cancel,deadline,path,body,ureq::tls::TlsConfig::default(),put,http);
        cancel.close_socket();
        result.map_err(|e|if e==Failure::ModelUnsupported {Failure::ModelSettingsUnsupported}else{e})
    };
    let result=(|| {
        let requested=Requested::from_settings(&prepared.profile.settings);
        let status=exchange("/api/inference/status",None,false,None)?;
        let (loading,effective)=crate::studio_models::configuration_status(&status,&prepared.profile.settings.model)?;
        if apply && loading {return Err(Failure::Busy);}
        let catalog=exchange("/v1/models",None,false,None)?;
        let target=config::target(&prepared.profile.settings.model,&catalog)?;
        let path=crate::studio_models::cached_path(&target.repo,&target.quant,|path,body|exchange(path,body,false,None))?;
        let query=config::query(&target,&path);
        let mut resolved=config::resolved_in_scope(&exchange(&query,None,false,None)?,&target,&path)?;
        let mut warnings=vec![config::FIT_WARNING.into()];
        if prepared.profile.settings.model_load.is_none() {warnings.push("Load options shown are suggested defaults; the legacy profile has not saved them.".into());}
        let mut http=None;
        let auto_switch_enabled=match exchange("/api/settings/openai-auto-switch",None,false,Some(&mut http)) {
            Ok(value)=>value["enabled"].as_bool(),
            Err(Failure::Authentication) if http==Some(403)=>None,
            Err(Failure::ModelSettingsUnsupported)=>None,
            Err(error)=>return Err(error),
        };
        match auto_switch_enabled {
            Some(false)=>warnings.push("Automatic model switching is disabled. Saved settings alone do not enable API auto-loading; Loomlight can explicitly load an available cached model.".into()),
            None=>warnings.push("Automatic model switching could not be verified; no global setting was changed.".into()),
            _=>(),
        }
        let mut applied=false;
        if apply {
            // Refresh the merge base and loading observation immediately before PUT.
            // Studio offers no compare-and-swap: external edits can still race this write.
            resolved=config::resolved_in_scope(&exchange(&query,None,false,None)?,&target,&path)?;
            let merged=config::merge(resolved.row.as_ref(),&requested)?;
            let current=exchange("/api/inference/status",None,false,None)?;
            if crate::studio_models::configuration_status(&current,&prepared.profile.settings.model)?.0 {return Err(Failure::Busy);}
            let mut body=Value::Object(merged.clone());
            body["model_id"]=json!(target.key);
            if cancel.cancelled() {return Err(Failure::Cancelled);}
            if !before_write() {return Err(Failure::ModelSettingsChanged);}
            exchange(config::ROUTE,Some(&body),true,None)?;
            let readback=exchange(&query,None,false,None)?;
            resolved=match config::resolved_in_scope(&readback,&target,&path) {
                Ok(resolved)=>resolved,
                Err(Failure::ModelSettingsUnsafe)=>{
                    warnings.push("The write completed, but read-back resolved outside the selected model. The outcome is unverified; unrelated saved values were discarded and no retry occurred.".into());
                    config::Resolved {key:None,row:None}
                }
                Err(error)=>return Err(error),
            };
            let verified=resolved.row.as_ref().map(config::known_saved);
            applied=resolved.key.as_deref().is_some_and(|key|key.eq_ignore_ascii_case(&target.key))
                && resolved.row.as_ref().is_some_and(|row|row.get("max_seq_length").and_then(Value::as_u64)==Some(requested.context_length.into()) && row.get("custom_context_length").and_then(Value::as_u64)==Some(requested.context_length.into()))
                && verified.as_ref().is_some_and(|saved|
                saved.context_length==Some(requested.context_length) && saved.parallel==Some(requested.parallel)
                && (saved.gpu_memory_mode==Some(requested.gpu_memory_mode)
                    || (requested.gpu_memory_mode==crate::ai_profiles::GpuMemoryMode::Auto && resolved.row.as_ref().is_some_and(|r|!r.contains_key("gpu_memory_mode"))))
                && saved.fit==Some(requested.fit));
            if !applied {warnings.push("The write completed, but the loader-resolved target or requested values differ on read-back. Saved configuration is not confirmed; no retry or reload occurred.".into());}
            if let Some(row)=&resolved.row {
                let mut unrelated=merged.iter().filter(|(key,_)|!matches!(key.as_str(),"max_seq_length"|"custom_context_length"|"n_parallel"|"gpu_memory_mode"|"llama_extra_args"));
                if unrelated.any(|(key,value)|row.get(key)!=Some(value)) || row.get("llama_extra_args")!=merged.get("llama_extra_args") {
                    applied=false;warnings.push("Some existing model options differ on read-back; preservation is not confirmed.".into());
                }
            }
        } else if resolved.row.as_ref().is_some_and(|row|config::validate(row).is_err()) {
            warnings.push("Existing options include unverified fields or flags. Applying settings will require a safe, supported merge.".into());
        }
        let saved=resolved.row.as_ref().map(config::known_saved);
        if let Some(saved)=&saved {warnings.extend(config::warnings(&requested,saved,"Saved"));}
        if let Some(effective)=&effective {warnings.extend(config::warnings(&requested,effective,"Effective"));} else {warnings.push("Loaded values could not be verified for the selected model; no effective configuration is claimed.".into());}
        warnings.sort();warnings.dedup();
        Ok(Report {model_id:prepared.profile.settings.model.clone(),resolved_model_id:resolved.key.filter(|key|key.eq_ignore_ascii_case(&target.key)),requested,saved,effective,auto_switch_enabled,applied,warnings,message:if apply {"Settings were written for the next model load. The current model was not reloaded; inspect read-back and warnings for confirmation."} else {"Observed saved settings and known loaded values. No settings were changed."}.into()})
    })();
    cancel.close_socket();
    if cancel.cancelled() {Err(Failure::Cancelled)}else{result}
}

/// Debug/test-only, read-only qualification. Fixed routes, one shared 15-second deadline,
/// no retries, inventory calls, load or generation. No raw provider strings leave here.
#[cfg(any(test, debug_assertions))]
pub fn diagnose_model_interface(prepared: Prepared, cancel: &Cancel) -> Value {
    fn kind(value: Option<&Value>) -> &'static str {
        match value {
            None => "missing",
            Some(Value::Null) => "null",
            Some(Value::String(_)) => "string",
            Some(Value::Array(_)) => "array",
            Some(Value::Number(_)) => "number",
            Some(Value::Bool(_)) => "boolean",
            Some(Value::Object(_)) => "object",
        }
    }
    fn text_fact(value: Option<&Value>, selected: &str) -> Value {
        json!({"kind":kind(value),"wellFormed":value.and_then(Value::as_str).is_some_and(|s| !s.is_empty() && s.len() <= 4096 && !s.chars().any(char::is_control)),"matchesSelected":value.and_then(Value::as_str)==Some(selected)})
    }
    fn array_fact(value: Option<&Value>, selected: &str) -> Value {
        let array = value.and_then(Value::as_array);
        json!({"kind":kind(value),"count":array.map(Vec::len),"allStrings":array.map(|a|a.iter().all(Value::is_string)),"allWellFormed":array.map(|a|a.iter().all(|v|v.as_str().is_some_and(|s|!s.is_empty() && s.len()<=4096 && !s.chars().any(char::is_control)))),"selectedCount":array.map(|a|a.iter().filter(|v|v.as_str()==Some(selected)).count())})
    }
    fn public_version(value: &Value, key: &str) -> Option<String> {
        let value = value.get("version")?.as_str()?;
        if value.len() > 64 || value.contains(key) { return None; }
        if value == "dev" { return Some(value.into()); }
        let version = value.strip_prefix('v').unwrap_or(value);
        let (numbers, suffix) = version.split_once('-').unwrap_or((version, ""));
        let parts: Vec<_> = numbers.split('.').collect();
        if parts.len() != 3 || parts.iter().any(|s|s.is_empty() || !s.bytes().all(|b|b.is_ascii_digit()))
            || !suffix.bytes().all(|b|b.is_ascii_alphanumeric() || matches!(b,b'.'|b'-'))
        { return None; }
        Some(value.into())
    }
    let deadline = Instant::now() + prepared.timeout.min(Duration::from_secs(15));
    let mut routes = Vec::with_capacity(2);
    for (route, path) in [("status", "/api/inference/status"), ("version", "/version")] {
        let mut http = None;
        let result = model_exchange_observed(&prepared, cancel, deadline, path, None,
            ureq::tls::TlsConfig::default(), Some(&mut http));
        // Also close the owned socket on HTTP/shape errors; never touch Studio model state.
        cancel.close_socket();
        let receipt = match result {
            Err(failure) => json!({"route":route,"httpStatus":http,"failure":failure.code()}),
            Ok(value) if route == "status" => {
                let selected = &prepared.profile.settings.model;
                json!({"route":route,"httpStatus":http,"facts":{
                    "object":value.is_object(),"yours":value.get("yours").and_then(Value::as_bool),
                    "activeModel":text_fact(value.get("active_model"),selected),
                    "modelIdentifier":text_fact(value.get("model_identifier"),selected),
                    "loaded":array_fact(value.get("loaded"),selected),
                    "loading":array_fact(value.get("loading"),selected),
                    "activeInLoaded":value.get("active_model").and_then(Value::as_str).map(|id|value.get("loaded").and_then(Value::as_array).is_some_and(|a|a.iter().any(|v|v.as_str()==Some(id)))),
                    "identifierInLoaded":value.get("model_identifier").and_then(Value::as_str).map(|id|value.get("loaded").and_then(Value::as_array).is_some_and(|a|a.iter().any(|v|v.as_str()==Some(id)))),
                    "contextLength":{"kind":kind(value.get("context_length")),"capacity":value.get("context_length").and_then(Value::as_u64)},
                    "llamaCppInstalledTag":text_fact(value.get("llama_cpp_installed_tag"),selected)
                }})
            }
            Ok(value) => json!({"route":route,"httpStatus":http,"facts":{
                "object":value.is_object(),"versionKind":kind(value.get("version")),
                "version":public_version(&value,&prepared.key)
            }}),
        };
        routes.push(receipt);
    }
    json!({"readOnly":true,"routes":routes})
}

#[cfg(test)]
mod model_diagnostic_tests {
    use super::*;
    use std::{io::{Read, Write}, net::TcpListener, thread};

    #[test]
    fn fixed_status_and_version_gets_are_sanitized_without_post_or_secret() {
        const KEY: &str = "diagnostic-private-fixture";
        const PRIVATE: &str = "/private/synthetic-cache/model.gguf";
        for status_code in [200, 404] {
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            listener.set_nonblocking(true).unwrap();
            let port = listener.local_addr().unwrap().port();
            let (finished_tx, finished_rx) = std::sync::mpsc::channel();
            let server = thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(5);
                for (route, code, value) in [
                    ("GET /api/inference/status ", status_code, json!({"yours":false,"active_model":PRIVATE,"model_identifier":KEY,"loaded":["synthetic-model",PRIVATE],"loading":[],"context_length":32768,"llama_cpp_installed_tag":KEY,"untrusted":KEY})),
                    ("GET /version ", 200, json!({"version":if status_code==200 {"v1.2.3-diagnostic-private-fixture"} else {"v0.1.902-beta"},"untrusted":PRIVATE})),
                ] {
                    let mut socket = loop {
                        match listener.accept() {
                            Ok((socket, _)) => break socket,
                            Err(e) if e.kind()==std::io::ErrorKind::WouldBlock => {
                                assert!(Instant::now()<deadline,"Expected fixed diagnostic GET missing");
                                thread::yield_now();
                            }
                            Err(_) => panic!("Fixture accept failed"),
                        }
                    };
                    socket.set_nonblocking(false).unwrap();
                    socket.set_read_timeout(Some(Duration::from_secs(5))).unwrap();
                    let mut bytes = Vec::new();
                    while !bytes.ends_with(b"\r\n\r\n") {
                        let mut byte = [0];
                        assert_eq!(socket.read(&mut byte).unwrap(),1);
                        bytes.push(byte[0]);
                        assert!(bytes.len()<8192);
                    }
                    let headers = String::from_utf8(bytes).unwrap();
                    assert!(headers.starts_with(route),"Unexpected request method or route");
                    assert!(headers.to_ascii_lowercase().contains(&format!("authorization: bearer {KEY}")),"Native-bound credential missing");
                    let body = serde_json::to_vec(&value).unwrap();
                    let mut response = format!("HTTP/1.1 {code} Fixture\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).into_bytes();
                    response.extend(body);
                    socket.write_all(&response).unwrap();
                }
                finished_rx.recv_timeout(Duration::from_secs(5)).unwrap();
                assert!(matches!(listener.accept(),Err(e) if e.kind()==std::io::ErrorKind::WouldBlock),"Unexpected extra request");
            });
            let prepared = prepare(super::tests::profile(port),Secret::new(KEY.into()),30).unwrap();
            let diagnostic = diagnose_model_interface(prepared,&Cancel::default());
            finished_tx.send(()).unwrap();
            server.join().unwrap();
            assert_eq!(diagnostic["routes"].as_array().unwrap().len(),2);
            assert_eq!(diagnostic["routes"][0]["httpStatus"],status_code);
            assert_eq!(diagnostic["routes"][1]["httpStatus"],200);
            if status_code==200 {
                assert_eq!(diagnostic["routes"][0]["facts"]["contextLength"]["capacity"],32768); assert_eq!(diagnostic["routes"][0]["facts"]["yours"],false);
                assert_eq!(diagnostic["routes"][0]["facts"]["loaded"]["selectedCount"],1);
                assert!(diagnostic["routes"][1]["facts"]["version"].is_null());
            } else {
                assert_eq!(diagnostic["routes"][0]["failure"],Failure::ModelUnsupported.code());
                assert_eq!(diagnostic["routes"][1]["facts"]["version"],"v0.1.902-beta");
            }
            let serialized = serde_json::to_string(&diagnostic).unwrap();
            for forbidden in [KEY,PRIVATE,"untrusted","synthetic-model"] {
                assert!(!serialized.contains(forbidden),"Diagnostic leaked an unallowlisted value");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        io::{Read, Write},
        net::TcpListener,
        thread,
        time::Instant,
    };
    pub(super) fn profile(port: u16) -> StudioProfile {
        serde_json::from_value(json!({"profileId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","revision":1,"disabled":false,"settings":{"label":"Synthetic request","endpoint":format!("http://127.0.0.1:{port}/v1"),"model":"synthetic-model","privateHttp":false,"contextCeiling":8192,"contextBudget":4096,"maximumResponse":1024},"credential":{"credentialId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","revision":1,"origin":format!("http://127.0.0.1:{port}")}})).unwrap()
    }
    fn valid() -> Value {
        json!({"id":"synthetic","model":"synthetic-model","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":"Loomlight synthetic response."}}],"usage":{"prompt_tokens":10,"completion_tokens":4,"total_tokens":14}})
    }
    #[test]
    fn immutable_body_context_and_destination_refusal() {
        let mut original = profile(8888);
        let p = prepare(original.clone(), Secret::new("public-fixture".into()), 600).unwrap();
        original.settings.model = "changed".into();
        assert_eq!(p.profile.settings.model, "synthetic-model");
        let body: Value = serde_json::from_slice(&p.body).unwrap();
        let fixture: Value = serde_json::from_str(include_str!("../../tests/fixtures/studio-request/bodies.json")).unwrap();
        assert_eq!(body, fixture["thinkingOn"]);
        let mut off = profile(8888); off.settings.thinking = Some(false);
        let off = prepare(off, Secret::new("public-fixture".into()), 600).unwrap();
        assert_eq!(serde_json::from_slice::<Value>(&off.body).unwrap(), fixture["thinkingOff"]);
        assert_eq!(body["stream"], false);
        assert_eq!(body["max_tokens"], 1024);
        assert_eq!(body["temperature"], 1.0);
        assert_eq!(body["top_p"], 0.95);
        assert_eq!(body["enable_thinking"], true);
        assert_eq!(body["enable_tools"], false);
        assert_eq!(body["enabled_tools"], json!([]));
        assert!(body.get("session_id").is_none());
        assert!(!String::from_utf8_lossy(&p.body).contains("public-fixture"));
        let mut customized = profile(8888);
        customized.settings.thinking = Some(false);
        customized.settings.temperature = Some(0.8);
        customized.settings.top_p = Some(0.9);
        let customized = prepare(customized, Secret::new("public-fixture".into()), 600).unwrap();
        let body: Value = serde_json::from_slice(&customized.body).unwrap();
        assert_eq!(body["enable_thinking"], false);
        assert_eq!(body["temperature"], 0.8);
        assert_eq!(body["top_p"], 0.9);
        for seconds in [0, 29, 1801] {
            assert!(matches!(
                prepare(profile(8888), Secret::new("public".into()), seconds),
                Err(Failure::Configuration)
            ))
        }
        let mut narrow = profile(8888);
        narrow.settings.context_budget = 1200;
        assert!(matches!(
            prepare(narrow, Secret::new("public".into()), 30),
            Err(Failure::Context)
        ));
        for endpoint in ["http://localhost:8888/v1"] {
            let mut p = profile(8888);
            p.settings.endpoint = endpoint.into();
            p.settings.private_http = true;
            p.credential.as_mut().unwrap().origin =
                crate::ai_profiles::canonical_endpoint(endpoint, true)
                    .unwrap()
                    .1;
            assert!(matches!(
                prepare(p, Secret::new("public".into()), 30),
                Err(Failure::UnsupportedDestination)
            ))
        }
        // Preparation validates the exact destination without opening a socket.
        // Saved private-HTTP consent and credential origin remain mandatory.
        for endpoint in [
            "http://10.0.0.1:8888/v1",
            "http://172.16.0.1:8888/v1",
            "http://192.168.1.2:8888/v1",
            "http://[fd00::1]:8888/v1",
            "http://[::ffff:192.168.1.2]:8888/v1",
        ] {
            let mut p = profile(8888);
            p.settings.endpoint = endpoint.into();
            p.settings.private_http = true;
            p.credential.as_mut().unwrap().origin =
                crate::ai_profiles::canonical_endpoint(endpoint, true)
                    .unwrap()
                    .1;
            let prepared = prepare(p.clone(), Secret::new("public".into()), 30).unwrap();
            assert_eq!(
                prepared.destination.addresses[0].ip(),
                endpoint
                    .parse::<ureq::http::Uri>()
                    .unwrap()
                    .host()
                    .unwrap()
                    .trim_matches(['[', ']'])
                    .parse::<IpAddr>()
                    .unwrap()
            );
            p.settings.private_http = false;
            assert!(prepare(p.clone(), Secret::new("public".into()), 30).is_err());
            p.settings.private_http = true;
            p.credential.as_mut().unwrap().origin = "http://127.0.0.1:8888".into();
            assert!(matches!(
                prepare(p, Secret::new("public".into()), 30),
                Err(Failure::Credential)
            ));
        }
        for endpoint in [
            "http://8.8.8.8:8888/v1",
            "http://100.64.0.1:8888/v1",
            "http://169.254.1.1:8888/v1",
            "http://0.0.0.0:8888/v1",
            "http://224.0.0.1:8888/v1",
            "http://[fe80::1]:8888/v1",
            "http://[::]:8888/v1",
            "http://[::ffff:8.8.8.8]:8888/v1",
            "http://studio.local:8888/v1",
        ] {
            let mut p = profile(8888);
            p.settings.endpoint = endpoint.into();
            p.settings.private_http = true;
            if let Ok((_, origin)) = crate::ai_profiles::canonical_endpoint(endpoint, true) {
                p.credential.as_mut().unwrap().origin = origin;
            }
            assert!(
                prepare(p, Secret::new("public".into()), 30).is_err(),
                "{endpoint}"
            );
        }
        let mut p = profile(8888);
        p.disabled = true;
        assert!(matches!(
            prepare(p, Secret::new("public".into()), 30),
            Err(Failure::Credential)
        ));
    }
    #[test]
    fn complete_usage_and_missing_usage_truth() {
        let response = parse(&serde_json::to_vec(&valid()).unwrap(), "synthetic-model").unwrap();
        assert_eq!(response.usage.total_tokens, Some(14));
        assert_eq!(response.usage.reasoning_tokens, None);
        let mut v = valid();
        v.as_object_mut().unwrap().remove("usage");
        assert_eq!(
            parse(&serde_json::to_vec(&v).unwrap(), "synthetic-model")
                .unwrap()
                .usage,
            Usage {
                prompt_tokens: None,
                completion_tokens: None,
                total_tokens: None,
                reasoning_tokens: None
            }
        );
        v["usage"] = json!({"prompt_tokens":10});
        assert_eq!(
            parse(&serde_json::to_vec(&v).unwrap(), "synthetic-model")
                .unwrap()
                .usage
                .completion_tokens,
            None
        );
    }
    #[test]
    fn rejects_truncation_tools_refusal_model_choice_and_usage_variants() {
        let mutations = [
            ("/model", json!("other")),
            ("/choices/0/index", json!(1)),
            ("/choices/0/finish_reason", json!("length")),
            ("/choices/0/finish_reason", Value::Null),
            ("/choices/0/message/role", json!("tool")),
            ("/choices/0/message/content", json!("")),
            ("/usage/prompt_tokens", json!(-1)),
            ("/usage/total_tokens", json!(15)),
            ("/usage/completion_tokens", json!(1.5)),
        ];
        for (path, v) in mutations {
            let mut base = valid();
            *base.pointer_mut(path).unwrap() = v;
            assert_eq!(
                parse(&serde_json::to_vec(&base).unwrap(), "synthetic-model"),
                Err(Failure::UnsupportedResponse),
                "{path}"
            );
        }
        for (key, v) in [
            ("tool_calls", json!([{}])),
            ("function_call", json!({})),
            ("refusal", json!("refused")),
            ("tool_results", json!([{}])),
        ] {
            let mut base = valid();
            base["choices"][0]["message"][key] = v;
            assert!(parse(&serde_json::to_vec(&base).unwrap(), "synthetic-model").is_err());
        }
        let mut v = valid();
        let extra = v["choices"][0].clone();
        v["choices"].as_array_mut().unwrap().push(extra);
        assert!(parse(&serde_json::to_vec(&v).unwrap(), "synthetic-model").is_err());
        let mut v = valid();
        v["usage"]["completion_tokens_details"] = json!({"reasoning_tokens":5});
        assert!(parse(&serde_json::to_vec(&v).unwrap(), "synthetic-model").is_err());
    }
    #[test]
    fn strict_whole_json_depth_utf8_and_size() {
        for b in [
            b"bad".to_vec(),
            br#"{"choices":[],"choices":[]}"#.to_vec(),
            br#"{"usage":NaN}"#.to_vec(),
            vec![255],
            format!("{}0{}", "[".repeat(33), "]".repeat(33)).into_bytes(),
            [serde_json::to_vec(&valid()).unwrap(), b" trailing".to_vec()].concat(),
        ] {
            assert_eq!(parse(&b, "synthetic-model"), Err(Failure::Malformed));
        }
        assert_eq!(
            parse(&vec![b' '; MAX_RESPONSE + 1], "synthetic-model"),
            Err(Failure::Oversized)
        );
        let mut v = valid();
        v["choices"][0]["message"]["content"] = json!("a".repeat(MAX_TEXT + 1));
        assert_eq!(
            parse(&serde_json::to_vec(&v).unwrap(), "synthetic-model"),
            Err(Failure::Oversized)
        );
    }
    fn request(stream: &mut TcpStream) -> Value {
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut bytes = Vec::new();
        let mut b = [0; 4096];
        loop {
            let n = stream.read(&mut b).unwrap();
            assert!(n > 0);
            bytes.extend_from_slice(&b[..n]);
            if let Some(pos) = bytes.windows(4).position(|v| v == b"\r\n\r\n") {
                let headers = String::from_utf8_lossy(&bytes[..pos]);
                assert!(headers
                    .to_ascii_lowercase()
                    .contains("authorization: bearer public"));
                let length: usize = headers
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|s| s.trim().parse().unwrap())
                    })
                    .unwrap();
                if bytes.len() >= pos + 4 + length {
                    return serde_json::from_slice(&bytes[pos + 4..pos + 4 + length]).unwrap();
                }
            }
        }
    }
    #[test]
    fn real_transport_auth_completion_error_bounds_and_no_retry() {
        for (status, content_type, body, length, expected) in [
            (
                200,
                "application/json",
                serde_json::to_vec(&valid()).unwrap(),
                None,
                None,
            ),
            (
                401,
                "application/json",
                b"untrusted error".to_vec(),
                None,
                Some(Failure::Authentication),
            ),
            (
                403,
                "application/json",
                vec![],
                None,
                Some(Failure::Authentication),
            ),
            (429, "application/json", vec![], None, Some(Failure::Busy)),
            (
                500,
                "application/json",
                vec![],
                None,
                Some(Failure::Provider),
            ),
            (
                302,
                "application/json",
                vec![],
                None,
                Some(Failure::Redirect),
            ),
            (400, "application/json", vec![], None, Some(Failure::Http)),
            (
                200,
                "text/event-stream",
                vec![],
                None,
                Some(Failure::UnsupportedResponse),
            ),
            (
                200,
                "application/json",
                b"bad".to_vec(),
                None,
                Some(Failure::Malformed),
            ),
            (
                200,
                "application/json",
                vec![],
                Some(MAX_RESPONSE + 1),
                Some(Failure::Oversized),
            ),
        ] {
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            let server = thread::spawn(move || {
                let (mut stream, _) = listener.accept().unwrap();
                let body_request = request(&mut stream);
                assert_eq!(body_request["messages"][0]["content"], SYNTHETIC_PROMPT);
                assert_eq!(body_request["stream"], false);
                write!(stream,"HTTP/1.1 {status} Synthetic\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",length.unwrap_or(body.len())).unwrap();
                let _ = stream.write_all(&body);
                listener.set_nonblocking(true).unwrap();
                assert!(listener.accept().is_err(), "no automatic second request");
            });
            let mut http = None;
            let response = execute(
                prepare(profile(port), Secret::new("public-fixture".into()), 30).unwrap(),
                &Cancel::default(),
                |_| {},
                &mut http,
            );
            if let Some(e) = expected {
                assert_eq!(response, Err(e));
            } else {
                assert!(response.is_ok());
            }
            server.join().unwrap();
            assert_eq!(http, Some(status));
        }
    }
    #[test]
    fn cancellation_aborts_stalled_headers_and_body_and_before_connect() {
        let cancel = Cancel::default();
        cancel.cancel();
        let mut http = None;
        assert_eq!(
            execute(
                prepare(profile(8888), Secret::new("public".into()), 30).unwrap(),
                &cancel,
                |_| {},
                &mut http
            ),
            Err(Failure::Cancelled)
        );
        for body in [false, true] {
            let phase = if body {
                "partial body"
            } else {
                "stalled headers"
            };
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            let (tx, rx) = std::sync::mpsc::channel();
            let (cancel_tx, cancel_rx) = std::sync::mpsc::channel::<Instant>();
            let server = thread::spawn(move || {
                let (mut stream, _) = listener.accept().unwrap();
                request(&mut stream);
                if body {
                    stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 999\r\n\r\n{").unwrap();
                }
                tx.send(()).unwrap();
                // Do not spend the cancellation/EOF budget waiting for the test
                // thread to receive readiness. Cancellation still happens at the
                // first request-ready signal, without waiting for a client read.
                let start = cancel_rx.recv_timeout(Duration::from_secs(2)).unwrap();
                stream
                    .set_read_timeout(Some(
                        (start + Duration::from_secs(2))
                            .saturating_duration_since(Instant::now())
                            .max(Duration::from_millis(1)),
                    ))
                    .unwrap();
                let eof = stream
                    .read(&mut [0])
                    .map_err(|error| (error.kind(), error.raw_os_error()));
                (eof, start.elapsed())
            });
            let cancel = Cancel::default();
            let worker_cancel = cancel.clone();
            let (completion_tx, completion_rx) = std::sync::mpsc::channel();
            let worker = thread::spawn(move || {
                let result = execute(
                    prepare(profile(port), Secret::new("public".into()), 30).unwrap(),
                    &worker_cancel,
                    |_| {},
                    &mut None,
                );
                let _ = completion_tx.send(result);
            });
            rx.recv_timeout(Duration::from_secs(2)).expect(phase);
            let owned = cancel.0.socket.lock().unwrap().is_some();
            let start = Instant::now();
            cancel_tx.send(start).unwrap();
            cancel.cancel();
            let cancel_elapsed = start.elapsed();
            let completion =
                completion_rx.recv_timeout(Duration::from_secs(2).saturating_sub(start.elapsed()));
            let completion_elapsed = start.elapsed();
            let (eof, eof_elapsed) = server.join().unwrap();
            worker.join().unwrap();
            let shutdown = *cancel.0.shutdown_observation.lock().unwrap();
            let diagnostic = format!(
                "{phase}: owned={owned}, shutdown={shutdown:?}, \
                cancel={cancel_elapsed:?}, completion={completion_elapsed:?}, \
                eof={eof:?} after {eof_elapsed:?}"
            );
            eprintln!("{diagnostic}");
            assert!(owned, "{diagnostic}");
            assert_eq!(shutdown, Some(Ok(())), "{diagnostic}");
            assert_eq!(completion, Ok(Err(Failure::Cancelled)), "{diagnostic}");
            assert!(completion_elapsed < Duration::from_secs(2), "{diagnostic}");
            // Closing a socket with unread response bytes can deliver EOF or a
            // connection reset to the peer. Both prove closure; timeouts and any
            // other error remain failures, alongside the owned-shutdown checks.
            assert!(matches!(eof, Ok(0) | Err((std::io::ErrorKind::ConnectionReset, _))), "{diagnostic}");
            assert!(eof_elapsed < Duration::from_secs(2), "{diagnostic}");
        }
    }
    #[test]
    fn unavailable_server_and_response_deadline_stop_resources() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);
        assert_eq!(
            execute(
                prepare(profile(port), Secret::new("public".into()), 30).unwrap(),
                &Cancel::default(),
                |_| {},
                &mut None
            ),
            Err(Failure::Connection)
        );
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            request(&mut stream);
            stream
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            assert_eq!(stream.read(&mut [0]).unwrap(), 0);
        });
        let mut p = prepare(profile(port), Secret::new("public".into()), 30).unwrap();
        p.timeout = Duration::from_millis(100);
        assert_eq!(
            execute(p, &Cancel::default(), |_| {}, &mut None),
            Err(Failure::Timeout)
        );
        server.join().unwrap();
    }
    #[test]
    fn undeclared_oversized_body_and_reported_output_limit_are_rejected() {
        for variant in 0..4 {
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            let server = thread::spawn(move || {
                let (mut socket, _) = listener.accept().unwrap();
                request(&mut socket);
                socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n").unwrap();
                let bytes = if variant == 0 {
                    vec![b' '; MAX_RESPONSE + 1]
                } else {
                    let mut value = valid();
                    value["usage"] = match variant {
                        1 => json!({"completion_tokens":1025}),
                        2 => json!({"prompt_tokens":4097}),
                        _ => json!({"completion_tokens_details":{"reasoning_tokens":1025}}),
                    };
                    serde_json::to_vec(&value).unwrap()
                };
                let _ = socket.write_all(&bytes);
            });
            assert_eq!(
                execute(
                    prepare(profile(port), Secret::new("public-fixture".into()), 30).unwrap(),
                    &Cancel::default(),
                    |_| {},
                    &mut None
                ),
                Err(Failure::Oversized)
            );
            server.join().unwrap();
        }
    }
}

#[cfg(test)]
#[path = "ai_request/tls_tests.rs"]
mod tls_tests;

#[cfg(test)]
mod model_readiness_tests {
    use super::*;
    use std::{
        io::{Read, Write},
        net::TcpListener,
        thread,
    };
    fn empty() -> Value {
        json!({"active_model":null,"model_identifier":null,"loaded":[],"loading":[]})
    }
    fn loaded(context: Value, id: &str) -> Value {
        json!({"active_model":id,"model_identifier":id,"loaded":[id],"loading":[],"context_length":context})
    }
    fn completion() -> Value {
        json!({"model":"fixture/model-GGUF","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":"ready"}}]})
    }
    fn plan() -> Vec<(&'static str, Value)> {
        vec![
            ("GET /api/inference/status ", empty()),
            (
                "GET /v1/models ",
                json!({"data":[{"id":"fixture/model-GGUF","loaded":false,"quant":"Q4_K_M"}]}),
            ),
            (
                "GET /api/models/cached-gguf ",
                json!({"cached":[{"repo_id":"fixture/model-GGUF","partial":false,"task":"text-generation"}]}),
            ),
            (
                "GET /api/models/cached-model-path?repo_id=fixture%2Fmodel-GGUF&variant=Q4_K_M ",
                json!({"path":"C:\\synthetic-cache\\fixture.Q4_K_M.gguf","is_dir":false}),
            ),
            ("GET /api/settings/openai-auto-switch/overrides?model_id=C%3A%5Csynthetic-cache%5Cfixture.Q4_K_M.gguf&alias_id=fixture%2Fmodel-GGUF&gguf_variant=Q4_K_M ",json!({"overrides":{},"resolved":{},"resolved_key":null})),
            ("GET /api/inference/status ", empty()),
            (
                "POST /api/inference/load ",
                json!({"status":"loaded","is_gguf":true,"is_local_model":true}),
            ),
            (
                "GET /api/inference/status ",
                loaded(json!(8192), "C:\\synthetic-cache\\fixture.Q4_K_M.gguf"),
            ),
            ("POST /v1/chat/completions ", completion()),
        ]
    }
    fn read_request(socket: &mut TcpStream) -> (String, Option<Value>) {
        socket
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut bytes = Vec::new();
        let mut b = [0; 4096];
        loop {
            let n = socket.read(&mut b).unwrap();
            assert!(n > 0);
            bytes.extend_from_slice(&b[..n]);
            if let Some(pos) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                let header = String::from_utf8_lossy(&bytes[..pos]).into_owned();
                assert!(header
                    .to_ascii_lowercase()
                    .contains("authorization: bearer public-fixture"));
                let len = header
                    .lines()
                    .find_map(|s| {
                        s.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|n| n.trim().parse::<usize>().unwrap())
                    })
                    .unwrap_or(0);
                if bytes.len() >= pos + 4 + len {
                    return (
                        header,
                        if len == 0 {
                            None
                        } else {
                            Some(serde_json::from_slice(&bytes[pos + 4..pos + 4 + len]).unwrap())
                        },
                    );
                }
            }
        }
    }
    fn run(
        plan: Vec<(&'static str, Value)>,
    ) -> (
        Result<Completion>,
        Vec<String>,
        Option<crate::studio_models::Readiness>,
    ) {
        run_options(plan, None)
    }
    fn run_options(plan: Vec<(&'static str, Value)>, model_load: Option<crate::ai_profiles::ModelLoadSettings>) -> (Result<Completion>,Vec<String>,Option<crate::studio_models::Readiness>) {
        run_case(plan,model_load,false)
    }
    fn run_response_failure(plan: Vec<(&'static str, Value)>) -> (Result<Completion>,Vec<String>,Option<crate::studio_models::Readiness>) {
        run_case(plan,None,true)
    }
    fn run_case(plan: Vec<(&'static str, Value)>, model_load: Option<crate::ai_profiles::ModelLoadSettings>, response_failure:bool) -> (Result<Completion>,Vec<String>,Option<crate::studio_models::Readiness>) {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let (finished, finish) = mpsc::channel();
        let expected_options=model_load.clone();
        let server = thread::spawn(move || {
            let mut observed = Vec::new();
            for (route, response) in plan {
                let (mut socket, _) = listener.accept().unwrap();
                let (header, body) = read_request(&mut socket);
                assert!(header.starts_with(route), "{header}");
                observed.push(route.to_owned());
                if route == "POST /api/inference/load " {
                    let body = body.unwrap();
                    assert_eq!(body["max_seq_length"], 4096);
                    assert_eq!(
                        body["model_path"],
                        "C:\\synthetic-cache\\fixture.Q4_K_M.gguf"
                    );
                    for field in ["force_reload", "force_cancel_active", "trust_remote_code", "alongside", "force_alongside"] {
                        assert_eq!(body[field], false);
                    }
                    assert_eq!(body["engine"], "auto");
                    assert_eq!(body["disable_vision"], true);
                    assert_eq!(body["speculative_type"], "off");
                    if let Some(options)=&expected_options {
                        assert_eq!(body["n_parallel"],options.parallel);
                        assert_eq!(body["gpu_memory_mode"],json!(options.gpu_memory_mode));
                        assert_eq!(body["llama_extra_args"],json!(["--fit",match options.fit {crate::ai_profiles::Fit::On=>"on",crate::ai_profiles::Fit::Off=>"off"}]));
                    } else {
                        assert_eq!(body["llama_extra_args"], json!([]));
                        assert!(body.get("n_parallel").is_none());
                        assert!(body.get("gpu_memory_mode").is_none());
                    }
                }
                let bytes = serde_json::to_vec(&response).unwrap();
                let code=response.get("_fixture_http_status").and_then(Value::as_u64).unwrap_or(200);
                write!(socket,"HTTP/1.1 {code} Fixture\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",bytes.len()).unwrap();
                socket.write_all(&bytes).unwrap();
            }
            finish.recv_timeout(Duration::from_secs(2)).unwrap();
            listener.set_nonblocking(true).unwrap();
            assert!(
                matches!(listener.accept(),Err(e) if e.kind()==std::io::ErrorKind::WouldBlock),
                "unexpected request after refusal"
            );
            observed
        });
        let mut profile = super::tests::profile(port);
        profile.settings.model = "fixture/model-GGUF".into();
        profile.settings.model_load=model_load;
        let p = prepare(profile, Secret::new("public-fixture".into()), 30).unwrap();
        let stages = Mutex::new(Vec::new());
        let readiness = Mutex::new(None);
        let mut http = None;
        let result = execute_ready(
            p,
            &Cancel::default(),
            |s| stages.lock().unwrap().push(s.to_owned()),
            &mut http,
            |r| *readiness.lock().unwrap() = Some(r.clone()),
        );
        finished.send(()).unwrap();
        let routes = server.join().unwrap();
        if result.is_err() {
            if response_failure {
                assert!(routes.iter().any(|r|r.contains("chat/completions")));
                assert!(readiness.lock().unwrap().is_some());
                assert_eq!(http,Some(200));
            } else {
                assert!(!routes.iter().any(|r| r.contains("chat/completions")));
                assert!(readiness.lock().unwrap().is_none());
                assert_eq!(http, None);
            }
        }
        (
            result,
            stages.into_inner().unwrap(),
            readiness.into_inner().unwrap(),
        )
    }
    #[test]
    fn supported_local_load_verifies_exact_context_and_fresh_status_before_generation() {
        let (result, stages, ready) = run(plan());
        assert_eq!(result.unwrap().text, "ready");
        let ready = ready.unwrap();
        assert_eq!(ready.requested_context, 4096);
        assert_eq!(ready.actual_context, 8192);
        assert!(ready.loaded_for_request);
        assert_eq!(
            stages,
            vec![
                "checking_model",
                "loading_model",
                "checking_model",
                "sending",
                "receiving",
                "validating"
            ]
        );
    }
    #[test]
    fn lower_effective_context_warns_and_generates_when_actual_request_fits() {
        let (result, _, ready) = run(vec![("GET /api/inference/status ",loaded(json!(2048),"fixture/model-GGUF")),("POST /v1/chat/completions ",completion())]);
        assert!(result.is_ok());
        let ready=ready.unwrap();
        assert_eq!(ready.actual_context,2048);
        assert!(!ready.warnings.is_empty());
    }
    #[test]
    fn reported_usage_above_observed_context_is_rejected_after_generation() {
        let mut completion=completion();completion["usage"]=json!({"prompt_tokens":3000,"completion_tokens":1,"total_tokens":3001});
        let (result,_,ready)=run_response_failure(vec![("GET /api/inference/status ",loaded(json!(2048),"fixture/model-GGUF")),("POST /v1/chat/completions ",completion)]);
        assert_eq!(result,Err(Failure::Oversized));assert_eq!(ready.unwrap().actual_context,2048);
    }
    #[test]
    fn sufficient_loaded_model_reused_without_version_inventory_load_or_reload() {
        let (result, _, ready) = run(vec![
            (
                "GET /api/inference/status ",
                loaded(json!(8192), "fixture/model-GGUF"),
            ),
            ("POST /v1/chat/completions ", completion()),
        ]);
        assert!(result.is_ok());
        assert!(!ready.unwrap().loaded_for_request);
    }
    #[test]
    fn capacity_conflict_loading_and_unknown_status_refuse_without_generation_or_mutation() {
        for (status, failure) in [
            (
                loaded(json!(512), "fixture/model-GGUF"),
                Failure::ModelContext,
            ),
            (
                loaded(Value::Null, "fixture/model-GGUF"),
                Failure::ModelCapacity,
            ),
            (loaded(json!(8192), "another-model"), Failure::ModelConflict),
            (
                json!({"active_model":"fixture/model-GGUF","model_identifier":"fixture/model-GGUF","loaded":["another-model"],"loading":[],"context_length":8192}),
                Failure::ModelNotReady,
            ),
            (
                json!({"loading":["fixture/model-GGUF"],"loaded":[]}),
                Failure::ModelNotReady,
            ),
            (json!({"active_model":null}), Failure::ModelUnsupported),
        ] {
            assert_eq!(
                run(vec![("GET /api/inference/status ", status)]).0,
                Err(failure)
            );
        }
    }
    #[test]
    fn missing_variant_partial_cache_and_observed_race_refuse() {
        let mut missing = plan();
        missing[1].1 = json!({"data":[]});
        missing.truncate(2);
        assert_eq!(run(missing).0, Err(Failure::ModelUnavailable));
        let mut partial = plan();
        partial[2].1["cached"][0]["partial"] = json!(true);
        partial.truncate(3);
        assert_eq!(run(partial).0, Err(Failure::ModelUnavailable));
        let mut race = plan();
        race[5].1 = loaded(json!(8192), "another-model");
        race.truncate(6);
        assert_eq!(run(race).0, Err(Failure::ModelConflict));
    }
    #[test]
    fn late_load_error_and_unconfirmed_or_insufficient_final_status_never_generate() {
        let mut late = plan();
        late[6].1 =
            json!({"_deferred_error":{"status_code":500,"detail":"untrusted private path"}});
        late.truncate(7);
        assert_eq!(run(late).0, Err(Failure::ModelLoad));
        let mut not_ready = plan();
        not_ready[7].1 = empty();
        not_ready.truncate(8);
        assert_eq!(run(not_ready).0, Err(Failure::ModelNotReady));
        let mut narrow = plan();
        narrow[7].1 = loaded(json!(512), "C:\\synthetic-cache\\fixture.Q4_K_M.gguf");
        narrow.truncate(8);
        assert_eq!(run(narrow).0, Err(Failure::ModelLoadContext));
        assert!(Failure::ModelLoadContext.message().contains("completed a local model load"));
        assert!(Failure::ModelLoadContext.message().contains("no generation was sent"));
    }

    #[test]
    fn optional_serving_contract_allows_idle_load_and_single_primary_reuse_without_version_or_tag() {
        let mut extended = plan();
        for index in [0, 5] {
            extended[index].1["serving"] = json!([]);
            extended[index].1["serving_checkpoints"] = json!([]);
            extended[index].1["yours"] = json!(true);
            extended[index].1["llama_cpp_installed_tag"] = Value::Null;
        }
        // Additional quant-pinned rows are distinct; bare repo selection stays exact.
        extended[1].1["data"].as_array_mut().unwrap().push(json!({"id":"fixture/model-GGUF:Q8_0","loaded":false,"quant":"Q8_0","status":{"value":"cached"}}));
        extended[6].1["evicted"] = json!([]);
        extended[7].1["serving"] = json!(["C:\\synthetic-cache\\fixture.Q4_K_M.gguf"]);
        extended[7].1["serving_checkpoints"] = json!(["C:\\synthetic-cache\\fixture.Q4_K_M.gguf"]);
        let (result, _, ready) = run(extended);
        assert!(result.is_ok());
        assert!(ready.unwrap().loaded_for_request);

        // The serving name may differ from the selected identifier, but must be
        // exactly the observed primary name/checkpoint pair, with no other slot.
        let status = json!({"active_model":"Synthetic primary name","model_identifier":"fixture/model-GGUF","loaded":["Synthetic primary name"],"loading":[],"context_length":8192,"serving":["Synthetic primary name"],"serving_checkpoints":["fixture/model-GGUF"],"yours":true});
        let (result, _, ready) = run(vec![("GET /api/inference/status ",status),("POST /v1/chat/completions ",completion())]);
        assert!(result.is_ok());
        assert!(!ready.unwrap().loaded_for_request);
    }
    #[test]
    fn hidden_or_ambiguous_serving_and_reported_eviction_never_generate() {
        let mut statuses = Vec::new();
        statuses.push((json!({"loaded":[],"loading":[],"yours":false}),Failure::ModelConflict));
        statuses.push((json!({"loaded":[],"loading":[],"yours":"unknown"}),Failure::ModelUnsupported));
        statuses.push((json!({"loaded":[],"loading":[],"serving":["other"],"serving_checkpoints":["other"]}),Failure::ModelConflict));
        statuses.push((json!({"loaded":[],"loading":[],"serving":[]}),Failure::ModelUnsupported));
        statuses.push((json!({"loaded":[],"loading":[],"serving":null,"serving_checkpoints":[]}),Failure::ModelUnsupported));
        statuses.push((json!({"loaded":[],"loading":[],"serving":["other"],"serving_checkpoints":[]}),Failure::ModelUnsupported));
        for (names, checkpoints) in [
            (json!([]),json!([])),
            (json!(["fixture/model-GGUF","other"]),json!(["fixture/model-GGUF","other"])),
            (json!(["other"]),json!(["fixture/model-GGUF"])),
            (json!(["fixture/model-GGUF"]),json!(["other"])),
        ] {
            let mut status = loaded(json!(8192),"fixture/model-GGUF");
            status["serving"] = names;
            status["serving_checkpoints"] = checkpoints;
            statuses.push((status,Failure::ModelConflict));
        }
        for (status, failure) in statuses {
            assert_eq!(run(vec![("GET /api/inference/status ",status)]).0,Err(failure));
        }
        // Rechecking immediately before load must apply the same ownership/slot guard.
        for status in [
            json!({"loaded":[],"loading":[],"yours":false}),
            json!({"loaded":[],"loading":[],"serving":["other"],"serving_checkpoints":["other"]}),
        ] {
            let mut race = plan();
            race[5].1 = status;
            race.truncate(6);
            assert_eq!(run(race).0,Err(Failure::ModelConflict));
        }
        for evicted in [json!(["other"]),Value::Null,json!(false)] {
            let mut changed = plan();
            changed[6].1["evicted"] = evicted;
            changed.truncate(7);
            assert_eq!(run(changed).0,Err(Failure::ModelLoad));
        }
        let mut changed = plan();
        changed[7].1["serving"] = json!(["C:\\synthetic-cache\\fixture.Q4_K_M.gguf","other"]);
        changed[7].1["serving_checkpoints"] = json!(["C:\\synthetic-cache\\fixture.Q4_K_M.gguf","other"]);
        changed.truncate(8);
        assert_eq!(run(changed).0,Err(Failure::ModelConflict));
    }


    #[test]
    fn cache_capability_metadata_accepts_chat_and_legacy_rows_but_refuses_media_unknown_or_malformed() {
        // The normal positive load fixture advertises text-generation, matching
        // the public cache schema. Missing/null fields retain older compatibility.
        for null in [false, true] {
            let mut legacy = plan();
            let row = legacy[2].1["cached"][0].as_object_mut().unwrap();
            for key in ["task", "partial"] {
                if null { row.insert(key.into(), Value::Null); } else { row.remove(key); }
            }
            assert!(run(legacy).0.is_ok());
        }
        for task in [json!("text-to-image"), json!("text-to-speech"), json!("unknown"), json!(""), json!(false), json!({"status":"complete"}), json!([])] {
            let mut rejected = plan();
            rejected[2].1["cached"][0]["task"] = task;
            rejected.truncate(3);
            assert_eq!(run(rejected).0, Err(Failure::ModelUnavailable));
        }
        for partial in [json!(true), json!("false"), json!(0), json!({}), json!([])] {
            let mut rejected = plan();
            rejected[2].1["cached"][0]["partial"] = partial;
            rejected.truncate(3);
            assert_eq!(run(rejected).0, Err(Failure::ModelUnavailable));
        }
    }

    #[test]
    fn explicit_load_knobs_reach_manual_loader_and_effective_mismatch_only_warns() {
        let mut p=plan();p[7].1=loaded(json!(2048),"C:\\synthetic-cache\\fixture.Q4_K_M.gguf");p[7].1["parallel_slots"]=json!(1);p[7].1["gpu_memory_mode"]=json!("manual");
        let options=crate::ai_profiles::ModelLoadSettings {parallel:2,gpu_memory_mode:crate::ai_profiles::GpuMemoryMode::Auto,fit:crate::ai_profiles::Fit::On};
        let (result,_,ready)=run_options(p,Some(options));assert!(result.is_ok());let ready=ready.unwrap();assert!(ready.loaded_for_request);assert!(ready.warnings.len()>=3);assert_eq!(ready.effective.parallel,Some(1));assert_eq!(ready.effective.fit,None);
        let (result,_,ready)=run_options(vec![("GET /api/inference/status ",loaded(json!(2048),"fixture/model-GGUF")),("POST /v1/chat/completions ",completion())],Some(crate::ai_profiles::ModelLoadSettings::default()));assert!(result.is_ok());assert!(!ready.unwrap().loaded_for_request);
    }
    #[test]
    fn legacy_settings_api_absence_preserves_cached_load_but_explicit_config_refuses_precisely() {
        let mut p=plan();p[4].1=json!({"_fixture_http_status":404,"detail":"untrusted path"});assert!(run(p.clone()).0.is_ok());p.truncate(5);assert_eq!(run_options(p,Some(crate::ai_profiles::ModelLoadSettings::default())).0,Err(Failure::ModelSettingsUnsupported));
    }
    #[test]
    fn resolved_override_for_unrelated_model_refuses_before_local_load_or_generation() {
        let mut p=plan();p[4].1=json!({"overrides":{"unrelated/model":{"n_parallel":1}},"resolved_key":"unrelated/model","resolved":{"n_parallel":1}});p.truncate(5);
        assert_eq!(run(p).0,Err(Failure::ModelSettingsUnsafe));
    }
    #[test]
    fn cancellation_owns_and_closes_status_socket_before_any_generation() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let cancel = Cancel::default();
        let c = cancel.clone();
        let server = thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            let (header, _) = read_request(&mut socket);
            assert!(header.starts_with("GET /api/inference/status "));
            c.cancel();
            let mut b = [0; 1];
            assert_eq!(socket.read(&mut b).unwrap(), 0);
        });
        let p = prepare(
            super::tests::profile(port),
            Secret::new("public-fixture".into()),
            30,
        )
        .unwrap();
        assert_eq!(
            execute_ready(
                p,
                &cancel,
                |_| {},
                &mut None,
                |_| panic!("cancel cannot publish readiness")
            ),
            Err(Failure::Cancelled)
        );
        server.join().unwrap();
    }
    #[test]
    fn cancellation_during_local_load_closes_only_owned_socket_and_never_generates() {
        let listener=TcpListener::bind("127.0.0.1:0").unwrap();let port=listener.local_addr().unwrap().port();let cancel=Cancel::default();let c=cancel.clone();
        let server=thread::spawn(move||{
            for (route,response) in plan().into_iter().take(7) {
                let(mut socket,_)=listener.accept().unwrap();let(header,_)=read_request(&mut socket);assert!(header.starts_with(route));
                if route=="POST /api/inference/load " {c.cancel();let mut b=[0;1];assert_eq!(socket.read(&mut b).unwrap(),0);break;}
                let bytes=serde_json::to_vec(&response).unwrap();write!(socket,"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",bytes.len()).unwrap();socket.write_all(&bytes).unwrap();
            }
            listener.set_nonblocking(true).unwrap();assert!(matches!(listener.accept(),Err(e) if e.kind()==std::io::ErrorKind::WouldBlock));
        });
        let mut profile=super::tests::profile(port);profile.settings.model="fixture/model-GGUF".into();
        let p=prepare(profile,Secret::new("public-fixture".into()),30).unwrap();
        assert_eq!(execute_ready(p,&cancel,|_|{},&mut None,|_|panic!("cancel cannot publish readiness")),Err(Failure::Cancelled));server.join().unwrap();
    }

}

#[cfg(test)]
mod model_settings_tests {
    use super::*;
    use crate::{ai_profiles::ModelLoadSettings, studio_config};
    use std::{io::{Read,Write},net::TcpListener,thread};
    const QUERY: &str="GET /api/settings/openai-auto-switch/overrides?model_id=C%3A%5Csynthetic-cache%5Cfixture.Q4_K_M.gguf&alias_id=fixture%2Fmodel-GGUF&gguf_variant=Q4_K_M ";
    fn response(key:&str,row:Value)->Value {
        let mut rows=serde_json::Map::new();rows.insert(key.into(),row.clone());
        json!({"overrides":rows,"resolved":row,"resolved_key":key})
    }
    fn initial()->Value {response("fixture/model-GGUF",json!({"kv_cache_dtype":"q8_0","speculative_type":"ngram","n_batch":512,"ctx_checkpoints":4,"llama_extra_args":["--flash-attn","on","--no-warmup"]}))}
    fn saved()->Value {response("fixture/model-GGUF:Q4_K_M",json!({"max_seq_length":4096,"custom_context_length":4096,"n_parallel":1,"gpu_memory_mode":"manual","kv_cache_dtype":"q8_0","speculative_type":"ngram","n_batch":512,"ctx_checkpoints":4,"llama_extra_args":["--flash-attn","on","--no-warmup","--fit","off"]}))}
    fn status()->Value {json!({"active_model":"fixture/model-GGUF","model_identifier":"fixture/model-GGUF","loaded":["fixture/model-GGUF"],"loading":[],"context_length":2048,"parallel_slots":2,"gpu_memory_mode":"auto"})}
    fn plan(apply:bool)->Vec<(&'static str,u16,Value)> {
        let mut plan=vec![
            ("GET /api/inference/status ",200,status()),
            ("GET /v1/models ",200,json!({"data":[{"id":"fixture/model-GGUF","loaded":true,"quant":"Q4_K_M"}]})),
            ("GET /api/models/cached-gguf ",200,json!({"cached":[{"repo_id":"fixture/model-GGUF","task":"text-generation","partial":false}]})),
            ("GET /api/models/cached-model-path?repo_id=fixture%2Fmodel-GGUF&variant=Q4_K_M ",200,json!({"path":"C:\\synthetic-cache\\fixture.Q4_K_M.gguf","is_dir":false})),
            (QUERY,200,initial()),
            ("GET /api/settings/openai-auto-switch ",200,json!({"enabled":false})),
        ];
        if apply {plan.extend([(QUERY,200,initial()),("GET /api/inference/status ",200,status()),("PUT /api/settings/openai-auto-switch/overrides ",200,json!({"overrides":{},"resolved":null,"resolved_key":null})),(QUERY,200,saved())]);}
        plan
    }
    fn run(plan:Vec<(&'static str,u16,Value)>,apply:bool,legacy:bool,before:impl Fn(&Cancel)->bool)->Result<studio_config::Report> {
        let listener=TcpListener::bind("127.0.0.1:0").unwrap();listener.set_nonblocking(true).unwrap();let port=listener.local_addr().unwrap().port();
        let (done_tx,done_rx)=mpsc::channel();
        let server=thread::spawn(move||{
            let deadline=Instant::now()+Duration::from_secs(8);
            for (route,code,value) in plan {
                let mut socket=loop {match listener.accept(){Ok((socket,_))=>break socket,Err(e)if e.kind()==std::io::ErrorKind::WouldBlock=>{assert!(Instant::now()<deadline,"Expected settings request missing");thread::yield_now();},Err(_)=>panic!("Fixture accept failed")}};
                socket.set_nonblocking(false).unwrap();socket.set_read_timeout(Some(Duration::from_secs(3))).unwrap();socket.set_write_timeout(Some(Duration::from_secs(3))).unwrap();
                let mut header=Vec::new();while !header.ends_with(b"\r\n\r\n") {let mut b=[0];assert_eq!(socket.read(&mut b).unwrap(),1);header.push(b[0]);assert!(header.len()<8192);}
                let header=String::from_utf8(header).unwrap();assert!(header.starts_with(route),"Unexpected method or route");assert!(header.to_ascii_lowercase().contains("authorization: bearer public-fixture"),"Expected bound fixture credential");
                let length=header.lines().find_map(|line|line.to_ascii_lowercase().strip_prefix("content-length:").map(|n|n.trim().parse::<usize>().unwrap())).unwrap_or(0);assert!(length<16384);let mut bytes=vec![0;length];socket.read_exact(&mut bytes).unwrap();
                if route.starts_with("PUT ") {
                    let body:Value=serde_json::from_slice(&bytes).unwrap();
                    assert_eq!(body["model_id"],"fixture/model-GGUF:Q4_K_M");assert_eq!(body["max_seq_length"],4096);assert_eq!(body["custom_context_length"],4096);assert_eq!(body["n_parallel"],1);assert_eq!(body["gpu_memory_mode"],"manual");
                    if value["_fixture_empty_merge"]==true {
                        assert!(body.get("kv_cache_dtype").is_none());assert_eq!(body["llama_extra_args"],json!(["--fit","off"]));
                    } else {
                        assert_eq!(body["kv_cache_dtype"],"q8_0");assert_eq!(body["speculative_type"],"ngram");assert_eq!(body["ctx_checkpoints"],4);assert_eq!(body["n_batch"],512);assert_eq!(body["llama_extra_args"],json!(["--flash-attn","on","--no-warmup","--fit","off"]));
                    }
                }
                let body=serde_json::to_vec(&value).unwrap();let mut reply=format!("HTTP/1.1 {code} Fixture\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).into_bytes();reply.extend(body);socket.write_all(&reply).unwrap();
            }
            done_rx.recv_timeout(Duration::from_secs(9)).unwrap();assert!(matches!(listener.accept(),Err(e)if e.kind()==std::io::ErrorKind::WouldBlock),"Unexpected settings, load or generation request");
        });
        let mut profile=super::tests::profile(port);profile.settings.model="fixture/model-GGUF".into();profile.settings.model_load=(!legacy).then(ModelLoadSettings::default);
        let prepared=prepare(profile,Secret::new("public-fixture".into()),30).unwrap();let cancel=Cancel::default();
        let result=model_load_settings(prepared,apply,&cancel,||before(&cancel));done_tx.send(()).unwrap();server.join().unwrap();result
    }
    #[test]
    fn explicit_apply_preserves_quant_options_verifies_resolved_readback_and_never_reloads() {
        let report=run(plan(true),true,false,|_|true).unwrap();assert!(report.applied);assert_eq!(report.model_id,"fixture/model-GGUF");assert_eq!(report.resolved_model_id.as_deref(),Some("fixture/model-GGUF:Q4_K_M"));assert_eq!(report.saved.unwrap().context_length,Some(4096));assert_eq!(report.effective.unwrap().context_length,Some(2048));assert_eq!(report.auto_switch_enabled,Some(false));assert!(!report.warnings.is_empty());
    }
    #[test]
    fn first_apply_accepts_source_empty_object_resolution_and_confirms_quant_entry() {
        let mut p=plan(true);let empty=json!({"overrides":{},"resolved_key":null,"resolved":{}});p[4].2=empty.clone();p[6].2=empty;p[8].2=json!({"overrides":{},"resolved_key":null,"resolved":null,"_fixture_empty_merge":true});p[9].2=response("fixture/model-GGUF:Q4_K_M",json!({"max_seq_length":4096,"custom_context_length":4096,"n_parallel":1,"gpu_memory_mode":"manual","llama_extra_args":["--fit","off"]}));assert!(run(p,true,false,|_|true).unwrap().applied);
    }
    #[test]
    fn legacy_read_and_owner_only_auto_switch_forbidden_remain_read_only_and_sanitized() {
        let mut p=plan(false);p[5].1=403;p[5].2=json!({"detail":"public-fixture C:\\private\\profile"});
        let report=run(p,false,true,|_|panic!("Read cannot request a write")).unwrap();assert!(!report.applied);assert_eq!(report.auto_switch_enabled,None);let text=serde_json::to_string(&report).unwrap();assert!(!text.contains("public-fixture"));assert!(!text.contains("synthetic-cache"));assert!(!text.contains("private"));
        let mut contradictory=plan(false);contradictory[0].2=json!({"active_model":"fixture/model-GGUF","loaded":[],"loading":[],"context_length":2048});let report=run(contradictory,false,true,|_|true).unwrap();assert!(report.effective.is_none());assert!(report.warnings.iter().any(|w|w.contains("no effective configuration")));
    }
    #[test]
    fn unsafe_fields_busy_changed_profile_and_cancellation_refuse_before_put() {
        for bad in [json!({"unknown_private_field":1}),json!({"llama_extra_args":["--parallel","1"]})] {
            let mut p=plan(true);p[6].2=response("fixture/model-GGUF",bad);p.truncate(7);assert!(matches!(run(p,true,false,|_|true),Err(Failure::ModelSettingsUnsafe)));
        }
        let mut busy=plan(true);busy[0].2=json!({"loaded":[],"loading":["fixture/model-GGUF"]});busy.truncate(1);assert!(matches!(run(busy,true,false,|_|true),Err(Failure::Busy)));
        let mut changed=plan(true);changed.truncate(8);assert!(matches!(run(changed.clone(),true,false,|_|false),Err(Failure::ModelSettingsChanged)));assert!(matches!(run(changed,true,false,|cancel|{cancel.cancel();true}),Err(Failure::Cancelled)));
    }
    #[test]
    fn resolved_readback_mismatch_warns_without_claiming_success() {
        let mut p=plan(true);p[9].2=initial();let report=run(p,true,false,|_|true).unwrap();assert!(!report.applied);assert!(report.warnings.iter().any(|w|w.contains("not confirmed")));
        let mut lost=plan(true);let row=json!({"max_seq_length":4096,"custom_context_length":4096,"n_parallel":1,"gpu_memory_mode":"manual","kv_cache_dtype":"q8_0","speculative_type":"ngram","n_batch":512,"ctx_checkpoints":4,"llama_extra_args":["--fit","off"]});lost[9].2=response("fixture/model-GGUF:Q4_K_M",row);let report=run(lost,true,false,|_|true).unwrap();assert!(!report.applied);assert!(report.warnings.iter().any(|w|w.contains("preservation is not confirmed")));
    }
    #[test]
    fn resolved_rows_outside_selected_target_refuse_before_write_and_readback_is_unverified() {
        let unrelated=response("unrelated/model",json!({"n_parallel":1}));
        for apply in [false,true] {
            let mut p=plan(apply);p[4].2=unrelated.clone();p.truncate(5);
            assert!(matches!(run(p,apply,false,|_|panic!("Unrelated read must not reach write guard")),Err(Failure::ModelSettingsUnsafe)));
        }
        let mut p=plan(true);p[6].2=unrelated.clone();p.truncate(7);
        assert!(matches!(run(p,true,false,|_|panic!("Unrelated merge must not reach write guard")),Err(Failure::ModelSettingsUnsafe)));
        let mut p=plan(true);p[9].2=unrelated;
        let report=run(p,true,false,|_|true).unwrap();assert!(!report.applied);assert!(report.saved.is_none());assert!(report.resolved_model_id.is_none());assert!(report.warnings.iter().any(|w|w.contains("outside the selected model")));
        // A proved ASCII spelling normalization is still the server's winner.
        let mut p=plan(true);let row=p[9].2["resolved"].clone();p[9].2=response("FIXTURE/MODEL-GGUF:q4_k_m",row);
        assert!(run(p,true,false,|_|true).unwrap().applied);
        // Value normalization/deviation is reported, rather than a transport refusal.
        let mut p=plan(true);let mut row=p[9].2["resolved"].clone();row["n_parallel"]=json!(2);p[9].2=response("fixture/model-GGUF:Q4_K_M",row);
        let report=run(p,true,false,|_|true).unwrap();assert!(!report.applied);assert_eq!(report.saved.unwrap().parallel,Some(2));
    }
    #[test]
    fn missing_management_interface_and_provider_errors_never_expose_raw_responses() {
        let mut after_write=plan(true);after_write[9].1=500;after_write[9].2=json!({"detail":"public-fixture /private/secret"});assert!(matches!(run(after_write,true,false,|_|true),Err(Failure::Provider)));
        for (code,failure) in [(404,Failure::ModelSettingsUnsupported),(401,Failure::Authentication),(500,Failure::Provider)] {
            let mut p=plan(false);p[0].1=code;p[0].2=json!({"detail":"public-fixture /private/secret"});p.truncate(1);let result=run(p,false,false,|_|true);assert!(matches!(result,Err(e)if e==failure));assert!(!failure.message().contains("public-fixture"));assert!(!failure.message().contains("/private"));
        }
    }
}
