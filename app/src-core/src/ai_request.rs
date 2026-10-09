//! Bounded Studio synthetic JSON request. No project text, edits, DNS, TLS fallback,
//! redirects, provider retries or persistent replies. Other destinations refuse use.
use crate::{
    ai_credentials::{valid_key, Secret},
    ai_profiles::StudioProfile,
};
use serde::Serialize;
use serde_json::{json, Value};
use std::{
    net::{IpAddr, Shutdown, SocketAddr, TcpStream},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};
use ureq::unversioned::{
    resolver::{ResolvedSocketAddrs, Resolver},
    transport::{Buffers, ConnectionDetails, Connector, LazyBuffers, NextTimeout, Transport},
};

pub const MAX_BODY: usize = 2 * 1024 * 1024;
pub const MAX_RESPONSE: usize = 8 * 1024 * 1024;
pub const MAX_TEXT: usize = 2 * 1024 * 1024;
pub const SYNTHETIC_PROMPT: &str = "This is a synthetic Loomlight connection test. Reply with the short text: Loomlight synthetic response. No tools.";
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Failure {
    Configuration,
    UnsupportedDestination,
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
}
impl Failure {
    pub fn code(self) -> &'static str {
        match self {
            Self::Configuration => "configuration",
            Self::UnsupportedDestination => "unsupported_destination",
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
        }
    }
    pub fn message(self) -> &'static str {
        match self {
        Self::Configuration=>"Saved request settings are invalid or unsupported.",
        Self::UnsupportedDestination=>"Synthetic requests currently support literal loopback HTTP only. This saved destination is unsupported.",
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
        Self::Cancelled=>"Client request cancelled; server computation may continue.",
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
    address: SocketAddr,
    key: Secret,
}
pub fn prepare(profile: StudioProfile, key: Secret, timeout_seconds: u32) -> Result<Prepared> {
    if !profile.settings.valid() || !(30..=1800).contains(&timeout_seconds) {
        return Err(Failure::Configuration);
    }
    if !profile.credential_bound() || !valid_key(&key) {
        return Err(Failure::Credential);
    }
    let uri: ureq::http::Uri = profile
        .settings
        .endpoint
        .parse()
        .map_err(|_| Failure::Configuration)?;
    let ip: IpAddr = uri
        .host()
        .unwrap_or("")
        .trim_matches(['[', ']'])
        .parse()
        .map_err(|_| Failure::UnsupportedDestination)?;
    if uri.scheme_str() != Some("http") || !ip.is_loopback() {
        return Err(Failure::UnsupportedDestination);
    }
    let address = SocketAddr::new(ip, uri.port_u16().ok_or(Failure::Configuration)?);
    let body=serde_json::to_vec(&json!({"model":profile.settings.model,"messages":[{"role":"user","content":SYNTHETIC_PROMPT}],"stream":false,"max_tokens":profile.settings.maximum_response,"enable_thinking":false,"enable_tools":false,"enabled_tools":[]})).map_err(|_|Failure::Configuration)?;
    if body.len() > MAX_BODY {
        return Err(Failure::Context);
    }
    // Conservative byte-based estimate, including all framing; no capacity claim.
    let estimated_input = body.len() as u32;
    let margin = 128.max(estimated_input.div_ceil(10));
    if u64::from(estimated_input) + u64::from(margin) + u64::from(profile.settings.maximum_response)
        > u64::from(profile.settings.context_budget)
    {
        return Err(Failure::Context);
    }
    Ok(Prepared {
        profile,
        body,
        estimated_input,
        margin,
        timeout: Duration::from_secs(timeout_seconds.into()),
        address,
        key,
    })
}
#[derive(Default)]
struct CancelInner {
    cancelled: AtomicBool,
    socket: Mutex<Option<TcpStream>>,
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
                let _ = s.shutdown(Shutdown::Both);
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
    cancel: Cancel,
}
impl Connector for AbortConnector {
    type Out = OwnedTransport;
    fn connect(
        &self,
        details: &ConnectionDetails,
        _: Option<()>,
    ) -> std::result::Result<Option<OwnedTransport>, ureq::Error> {
        if self.cancel.cancelled()
            || details.needs_tls()
            || details.addrs.len() != 1
            || details.addrs[0] != self.address
        {
            return Err(ureq::Error::ConnectionFailed);
        }
        // One literal-loopback connect attempt. A one-second deadline also bounds
        // cancellation while the OS is connecting, before a socket can be owned.
        let stream = TcpStream::connect_timeout(&self.address, Duration::from_secs(1))?;
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
        *owned = Some(stream.try_clone()?);
        Ok(Some(OwnedTransport {
            stream,
            buffers: LazyBuffers::new(
                details.config.input_buffer_size(),
                details.config.output_buffer_size(),
            ),
        }))
    }
}
struct OwnedTransport {
    stream: TcpStream,
    buffers: LazyBuffers,
}
impl std::fmt::Debug for OwnedTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("OwnedRequestTransport")
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
        self.stream
            .set_write_timeout(timeout.not_zero().map(|d| *d))?;
        match self.stream.write_all(&self.buffers.output()[..amount]) {
            Ok(()) => Ok(()),
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock
                ) =>
            {
                Err(ureq::Error::Timeout(timeout.reason))
            }
            Err(e) => Err(e.into()),
        }
    }
    fn await_input(&mut self, timeout: NextTimeout) -> std::result::Result<bool, ureq::Error> {
        use std::io::Read;
        self.stream
            .set_read_timeout(timeout.not_zero().map(|d| *d))?;
        let count = match self.stream.read(self.buffers.input_append_buf()) {
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
    // This scope drops the entire agent/response/buffers before the completion is published.
    let result = (|| {
        if cancel.cancelled() {
            return Err(Failure::Cancelled);
        }
        let config = ureq::Agent::config_builder()
            .proxy(None)
            .max_redirects(0)
            .http_status_as_error(false)
            .max_idle_connections(0)
            .timeout_global(Some(prepared.timeout))
            .timeout_connect(Some(Duration::from_secs(1)))
            .max_response_header_size(32 * 1024)
            .build();
        let agent = ureq::Agent::with_parts(
            config,
            AbortConnector {
                address: prepared.address,
                cancel: cancel.clone(),
            },
            FixedResolver(prepared.address),
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
        stage("validating");
        let completion = parse(&bytes, &prepared.profile.settings.model)?;
        if completion
            .usage
            .completion_tokens
            .is_some_and(|n| n > u64::from(prepared.profile.settings.maximum_response))
            || completion
                .usage
                .total_tokens
                .is_some_and(|n| n > u64::from(prepared.profile.settings.context_budget))
        {
            return Err(Failure::Oversized);
        }
        Ok(completion)
    })();
    cancel.close_socket();
    if cancel.cancelled() {
        Err(Failure::Cancelled)
    } else {
        result
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
    fn profile(port: u16) -> StudioProfile {
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
        assert_eq!(body["stream"], false);
        assert_eq!(body["max_tokens"], 1024);
        assert_eq!(body["enable_thinking"], false);
        assert_eq!(body["enable_tools"], false);
        assert_eq!(body["enabled_tools"], json!([]));
        assert!(body.get("session_id").is_none());
        assert!(!String::from_utf8_lossy(&p.body).contains("public-fixture"));
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
        for endpoint in [
            "http://localhost:8888/v1",
            "http://192.168.1.2:8888/v1",
            "https://example.com:443/v1",
        ] {
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
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            let (tx, rx) = std::sync::mpsc::channel();
            let server = thread::spawn(move || {
                let (mut stream, _) = listener.accept().unwrap();
                request(&mut stream);
                if body {
                    stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 999\r\n\r\n{").unwrap();
                }
                tx.send(()).unwrap();
                stream
                    .set_read_timeout(Some(Duration::from_secs(2)))
                    .unwrap();
                let mut byte = [0];
                assert_eq!(
                    stream.read(&mut byte).unwrap(),
                    0,
                    "owned client socket closed"
                );
            });
            let cancel = Cancel::default();
            let worker_cancel = cancel.clone();
            let worker = thread::spawn(move || {
                execute(
                    prepare(profile(port), Secret::new("public".into()), 30).unwrap(),
                    &worker_cancel,
                    |_| {},
                    &mut None,
                )
            });
            rx.recv_timeout(Duration::from_secs(2)).unwrap();
            let start = Instant::now();
            cancel.cancel();
            assert_eq!(worker.join().unwrap(), Err(Failure::Cancelled));
            assert!(start.elapsed() < Duration::from_secs(2));
            server.join().unwrap();
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
        for oversize in [true, false] {
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            let server = thread::spawn(move || {
                let (mut socket, _) = listener.accept().unwrap();
                request(&mut socket);
                socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n").unwrap();
                let bytes = if oversize {
                    vec![b' '; MAX_RESPONSE + 1]
                } else {
                    let mut value = valid();
                    value["usage"] = json!({"completion_tokens":1025});
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
