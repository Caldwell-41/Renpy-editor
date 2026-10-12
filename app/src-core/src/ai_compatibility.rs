//! Explicit synthetic Studio preflight. No project text, writes or tool loop.
use crate::{ai_profiles::StudioProfile, ai_request::{Completion, Failure}};
use serde::Deserialize;
use serde_json::json;

pub fn body(profile: &StudioProfile) -> Vec<u8> {
    serde_json::to_vec(&json!({
        "model": profile.settings.model,
        "messages": [{"role":"user","content":"This is a synthetic Loomlight compatibility check. Return exactly the requested JSON object with ok true. No tools."}],
        "response_format":{"type":"json_schema","json_schema":{"name":"loomlight_compatibility_v1","strict":true,"schema":{"type":"object","additionalProperties":false,"required":["ok"],"properties":{"ok":{"type":"boolean","enum":[true]}}}}},
        "stream":false,"max_tokens":profile.settings.maximum_response,
        "temperature":profile.settings.temperature(),"top_p":profile.settings.top_p(),
        "enable_thinking":false,"enable_tools":false,"enabled_tools":[]
    })).unwrap()
}
pub fn validate(value: &Completion) -> Result<(), Failure> {
    #[derive(Deserialize)]
    #[serde(deny_unknown_fields)]
    struct Probe { ok: bool }
    let probe: Probe = serde_json::from_str(&value.text).map_err(|_| Failure::UnsupportedResponse)?;
    if !probe.ok { return Err(Failure::UnsupportedResponse); }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn compatibility_closed_probe_rejects_malformed_extra_false_and_duplicate_content() {
        let response=|text:&str| crate::ai_request::parse(&serde_json::to_vec(&json!({"model":"fixture","choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":text}}]})).unwrap(),"fixture").unwrap();
        assert!(validate(&response("{\"ok\":true}")).is_ok());
        for text in ["{\"ok\":false}","{\"ok\":true,\"extra\":1}","{\"ok\":true,\"ok\":true}","```json\n{\"ok\":true}\n```","true","{\"ok\":true} trailing"] {
            assert_eq!(validate(&response(text)),Err(Failure::UnsupportedResponse));
        }
    }
}
