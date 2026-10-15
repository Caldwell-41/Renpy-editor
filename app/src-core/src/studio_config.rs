//! Unsloth Studio per-quant saved load settings. Contract checked against official
//! 907 source133a8076d10aa109f812f85a953636b3488926f6; observed schema, not version,
//! controls admission. Raw paths, overrides, templates and provider errors stay internal.
use crate::{ai_profiles::{Fit, GpuMemoryMode, ModelLoadSettings, StudioSettings}, ai_request::{Failure, Result}};
use serde::Serialize;
use serde_json::{json, Map, Value};

pub(crate) const ROUTE: &str = "/api/settings/openai-auto-switch/overrides";
pub const FIT_WARNING: &str = "Effective fitting is unverified. Unsloth Studio's manual load path may filter --fit; requested fitting is not a guarantee.";
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Requested {
    pub context_length: u32,
    pub parallel: u32,
    pub gpu_memory_mode: GpuMemoryMode,
    pub fit: Fit,
}
impl Requested {
    pub fn from_settings(settings: &StudioSettings) -> Self {
        let options = settings.model_load.clone().unwrap_or_default();
        Self { context_length:settings.context_budget, parallel:options.parallel, gpu_memory_mode:options.gpu_memory_mode, fit:options.fit }
    }
}
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Known {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_length: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parallel: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gpu_memory_mode: Option<GpuMemoryMode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fit: Option<Fit>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub model_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_model_id: Option<String>,
    pub requested: Requested,
    pub saved: Option<Known>,
    pub effective: Option<Known>,
    pub auto_switch_enabled: Option<bool>,
    pub applied: bool,
    pub warnings: Vec<String>,
    pub message: String,
}
#[derive(Clone)]
pub(crate) struct Target { pub repo: String, pub quant: String, pub key: String }
pub(crate) fn target(model: &str, catalog: &Value) -> Result<Target> {
    let rows = crate::studio_models::parse_inventory(&serde_json::to_vec(catalog).map_err(|_|Failure::Malformed)?)?;
    let row = rows.iter().find(|r|r.id==model).ok_or(Failure::ModelUnavailable)?;
    let quant = row.quant.as_deref().filter(|s|!s.is_empty() && s.len()<=128 && s.bytes().all(|b|b.is_ascii_alphanumeric() || b"._-".contains(&b))).ok_or(Failure::ModelUnavailable)?;
    let repo = if let Some((repo,pin)) = model.rsplit_once(':') {
        if pin!=quant { return Err(Failure::ModelUnavailable); }
        repo
    } else { model };
    if !crate::studio_models::repo_id(repo) { return Err(Failure::ModelUnavailable); }
    Ok(Target {repo:repo.into(),quant:quant.into(),key:format!("{repo}:{quant}")})
}
pub(crate) fn query(target: &Target, path: &str) -> String {
    format!("{ROUTE}?model_id={}&alias_id={}&gguf_variant={}",crate::studio_models::query(path),crate::studio_models::query(&target.repo),crate::studio_models::query(&target.quant))
}
#[derive(Clone)]
pub(crate) struct Resolved { pub key: Option<String>, pub row: Option<Map<String,Value>> }
pub(crate) fn resolved(value: &Value) -> Result<Resolved> {
    let rows = value["overrides"].as_object().ok_or(Failure::ModelSettingsUnsupported)?;
    match (value.get("resolved_key"),value.get("resolved")) {
        (Some(Value::Null),Some(Value::Null)) => Ok(Resolved { key:None,row:None }),
        (Some(Value::Null),Some(Value::Object(row))) if row.is_empty() => Ok(Resolved { key:None,row:None }),
        (Some(Value::String(key)),Some(Value::Object(row))) if !key.is_empty() && rows.get(key)==Some(&Value::Object(row.clone())) => Ok(Resolved {key:Some(key.clone()),row:Some(row.clone())}),
        _ => Err(Failure::ModelSettingsUnsupported),
    }
}
// Check membership only: Studio remains authoritative about which candidate won.
// Its fixed query tries path:quant, repo:quant, path, repo. Never search a map for
// a replacement winner or fold POSIX path casing onto a different model.
fn windows_path_key(value: &str) -> Option<String> {
    let slashed=value.replace('\\',"/");
    let bytes=slashed.as_bytes();
    let minimum=if bytes.len()>=3 && bytes[0].is_ascii_alphabetic() && bytes[1]==b':' && bytes[2]==b'/' {3}
        else if slashed.starts_with("//") {2}
        else if bytes.len()>=6 && slashed.starts_with("/mnt/") && bytes[5].is_ascii_alphabetic() && (bytes.len()==6 || bytes[6]==b'/') {6}
        else {return None};
    let mut end=slashed.len();while end>minimum && slashed.as_bytes()[end-1]==b'/' {end-=1;}
    // Only ASCII case changes are proved here. Non-ASCII bytes must match exactly;
    // Python's broader Unicode casefold equivalences are deliberately refused.
    Some(slashed[..end].to_ascii_lowercase())
}
fn path_key_matches(key: &str, candidate: &str) -> bool {
    key==candidate || windows_path_key(candidate).is_some_and(|expected|windows_path_key(key).as_deref()==Some(expected.as_str()))
}
pub(crate) fn resolved_in_scope(value: &Value, target: &Target, path: &str) -> Result<Resolved> {
    let resolved=resolved(value)?;
    if let Some(key)=&resolved.key {
        let qualified=format!("{path}:{}",target.quant);
        let scope=key.eq_ignore_ascii_case(&target.repo) || key.eq_ignore_ascii_case(&target.key)
            || path_key_matches(key,path) || path_key_matches(key,&qualified)
            || key.rsplit_once(':').is_some_and(|(head,quant)|head==path && quant.eq_ignore_ascii_case(&target.quant));
        if !scope {return Err(Failure::ModelSettingsUnsafe);}
    }
    Ok(resolved)
}
fn number(v: &Value, min: i64, max: i64) -> bool { v.as_i64().is_some_and(|n|(min..=max).contains(&n)) }
fn one(v: &Value, choices: &[&str]) -> bool { v.as_str().is_some_and(|s|choices.contains(&s)) }
fn text(v: &Value, max: usize) -> bool { v.as_str().is_some_and(|s|s.len()<=max && !s.contains('\0')) }
// Conservative source-supported flags only. Unknown/deprecated flags are not silently
// dropped or echoed into a replacing PUT. Users can resolve them in Studio first.
fn flags(value: &Value) -> Result<Vec<String>> {
    let values = value.as_array().filter(|a|a.len()<=128).ok_or(Failure::ModelSettingsUnsafe)?;
    let mut result=Vec::new(); let mut i=0; let mut bytes=0;
    while i<values.len() {
        let flag=values[i].as_str().ok_or(Failure::ModelSettingsUnsafe)?;
        let arity=match flag {
            "--no-warmup"|"--mlock"|"--no-mmap"|"--mmap"|"--cont-batching"|"--no-cont-batching"|"--jinja"=>0,
            "--fit"|"--flash-attn"|"--cache-type-k"|"--cache-type-v"|"--ctx-size"|"-c"|"--batch-size"|"--ubatch-size"|"--threads"|"--threads-batch"|"--numa"|"--rope-scaling"|"--rope-scale"|"--rope-freq-base"|"--rope-freq-scale"|"--grammar"|"--json-schema"=>1,
            _=>return Err(Failure::ModelSettingsUnsafe),
        };
        result.push(flag.into());bytes+=flag.len();
        for _ in 0..arity {
            i+=1;
            let value=values.get(i).and_then(Value::as_str).filter(|s|!s.is_empty() && !s.chars().any(char::is_control)).ok_or(Failure::ModelSettingsUnsafe)?;
            if value.starts_with("--") { return Err(Failure::ModelSettingsUnsafe); }
            let valid=match flag {
                "--fit"=>matches!(value,"on"|"off"),
                "--flash-attn"=>matches!(value,"on"|"off"|"auto"),
                "--cache-type-k"|"--cache-type-v"=>["f16","bf16","q8_0","q4_0","q4_1","q5_0","q5_1","iq4_nl","f32"].contains(&value),
                "--ctx-size"|"-c"=>value.parse::<u32>().is_ok_and(|n|(1..=2_000_000).contains(&n)),
                "--batch-size"|"--ubatch-size"=>value.parse::<u32>().is_ok_and(|n|(1..=65536).contains(&n)),
                "--threads"|"--threads-batch"=>value.parse::<u16>().is_ok_and(|n|n<=1024),
                "--numa"=>matches!(value,"distribute"|"isolate"|"numactl"),
                "--rope-scaling"=>matches!(value,"none"|"linear"|"yarn"),
                "--rope-scale"|"--rope-freq-base"|"--rope-freq-scale"=>value.parse::<f64>().is_ok_and(|n|n.is_finite() && n>0.0),
                "--json-schema"=>serde_json::from_str::<Value>(value).is_ok_and(|v|v.is_object()),
                // No local GBNF parser: refuse unverified grammar rather than round-trip it.
                "--grammar"=>false,
                _=>false,
            };
            if !valid { return Err(Failure::ModelSettingsUnsafe); }
            result.push(value.into());bytes+=value.len();
        }
        i+=1;
    }
    if bytes>16*1024 { return Err(Failure::ModelSettingsUnsafe); }
    Ok(result)
}
pub(crate) fn validate(row: &Map<String,Value>) -> Result<()> {
    for (key,v) in row {
        let valid=match key.as_str() {
            "max_seq_length"|"custom_context_length"=>number(v,1,1_048_576),
            "n_parallel"=>number(v,1,64), "spec_draft_n_max"=>number(v,1,16),
            "n_batch"|"n_ubatch"=>number(v,1,65536),
            "ctx_checkpoints"=>number(v,0,256),"cache_ram"=>number(v,-1,1_048_576),
            "reasoning_budget"=>number(v,-1,i32::MAX.into()),
            "gpu_layers"=>number(v,-1,1024),"n_cpu_moe"=>number(v,0,1024),
            "gpu_memory_mode"=>one(v,&["auto","manual"]),
            "kv_cache_dtype"|"spec_draft_cache_type"=>one(v,&["f16","bf16","q8_0","q4_0","q4_1","q5_0","q5_1","iq4_nl","f32"]),
            "speculative_type"=>one(v,&["auto","mtp","dspark","dflash","ngram","mtp+ngram","off","default","draft-mtp","draft-dspark","draft-dflash","ngram-mod","ngram-simple","none","disable","disabled","eagle3"]),
            "load_mode"=>one(v,&["none","mmap","mlock","mmap+mlock","dio"]),
            "engine"=>one(v,&["auto","vllm","sglang"]),
            "engine_parallelism"=>one(v,&["tensor","pipeline","data"]),
            "engine_precision"=>one(v,&["auto","bf16","fp16","int4","int8","fp8"]),
            "engine_kv_cache_dtype"=>one(v,&["auto","fp8"]),
            "engine_seed"=>number(v,0,i32::MAX.into()),
            "engine_gpu_memory_utilization"=>v.as_f64().is_some_and(|n|n.is_finite() && (0.05..=0.99).contains(&n)),
            "gpu_index_kind"=>one(v,&["physical","vulkan"]),
            "mlx_kv_quant"=>one(v,&["8","6","5","4","3","2","tq-4","tq-3.5","tq-3","tq-2"]),
            "mlx_int8_prefill"|"tensor_parallel"|"disable_vision"=>v.is_boolean(),
            "chat_template_override"=>text(v,65536),"reasoning_budget_message"=>text(v,4096),
            "spec_draft_model"=>text(v,1024),
            "llama_extra_args"=>{flags(v)?;true},
            "gpu_ids"=>v.as_array().is_some_and(|a|!a.is_empty() && a.len()<=1025 && a.iter().all(|v|number(v,0,1024)) && a.iter().enumerate().all(|(i,v)|!a[..i].contains(v))),
            "tensor_split"=>v.as_array().is_some_and(|a|a.len()>=2 && a.len()<=1025 && a.iter().all(|v|v.as_f64().is_some_and(|n|n.is_finite() && n>=0.0)) && a.iter().any(|v|v.as_f64().is_some_and(|n|n>0.0)) && row.get("gpu_ids").and_then(Value::as_array).is_some_and(|ids|ids.len()==a.len())),
            _=>false,
        };
        if !valid { return Err(Failure::ModelSettingsUnsafe); }
    }
    Ok(())
}
fn replace_flags(row: &mut Map<String,Value>, fit: Option<Fit>) -> Result<()> {
    let args=match row.get("llama_extra_args") { Some(v)=>flags(v)?,None=>Vec::new() };
    let mut kept=Vec::new();let mut i=0;
    while i<args.len() {
        let width=if matches!(args[i].as_str(),"--no-warmup"|"--mlock"|"--no-mmap"|"--mmap"|"--cont-batching"|"--no-cont-batching"|"--jinja") {1}else{2};
        if !matches!(args[i].as_str(),"--ctx-size"|"-c") && !(fit.is_some() && args[i]=="--fit") { kept.extend_from_slice(&args[i..i+width]); }
        i+=width;
    }
    if let Some(fit)=fit { kept.extend(["--fit".into(),match fit {Fit::On=>"on",Fit::Off=>"off"}.into()]); }
    if row.contains_key("llama_extra_args") || fit.is_some() {row.insert("llama_extra_args".into(),json!(kept));}
    Ok(())
}
pub(crate) fn merge(row: Option<&Map<String,Value>>, requested: &Requested) -> Result<Map<String,Value>> {
    let mut row=row.cloned().unwrap_or_default();validate(&row)?;
    replace_flags(&mut row,Some(requested.fit))?;
    row.insert("max_seq_length".into(),json!(requested.context_length));
    row.insert("custom_context_length".into(),json!(requested.context_length));
    row.insert("n_parallel".into(),json!(requested.parallel));
    row.insert("gpu_memory_mode".into(),json!(requested.gpu_memory_mode));
    Ok(row)
}
pub(crate) fn load_args(row: Option<&Map<String,Value>>, requested: u32, options: Option<&ModelLoadSettings>) -> Result<Map<String,Value>> {
    let mut row=row.cloned().unwrap_or_default();validate(&row)?;
    // This manual loader has no verified non-physical GPU-index-space field.
    if row.get("gpu_index_kind").is_some_and(|kind|kind=="vulkan") {return Err(Failure::ModelSettingsUnsafe);}
    replace_flags(&mut row,options.map(|o|o.fit))?;
    // Source mapping for the ordinary GGUF loader; non-GGUF engine/MLX-only fields
    // and spec_draft_model are preserved in storage but do not reach this loader.
    let mut args=Map::new();
    for (key,value) in &row {
        let target=match key.as_str() {
            "kv_cache_dtype"=>"cache_type_kv",
            "llama_extra_args"|"n_parallel"|"speculative_type"|"spec_draft_n_max"|"reasoning_budget"|"reasoning_budget_message"|"tensor_parallel"|"disable_vision"|"chat_template_override"|"n_batch"|"n_ubatch"|"load_mode"|"spec_draft_cache_type"|"ctx_checkpoints"|"cache_ram"|"gpu_memory_mode"|"gpu_layers"|"n_cpu_moe"|"gpu_ids"|"tensor_split"=>key,
            _=>continue,
        };
        if matches!(key.as_str(),"speculative_type"|"spec_draft_n_max") && row.get("speculative_type").is_some_and(|v|v=="eagle3") {continue;}
        args.insert(target.into(),value.clone());
    }
    args.entry("llama_extra_args".to_string()).or_insert_with(||json!([]));
    args.insert("max_seq_length".into(),json!(requested));
    if let Some(options)=options {
        args.insert("n_parallel".into(),json!(options.parallel));
        args.insert("gpu_memory_mode".into(),json!(options.gpu_memory_mode));
    }
    Ok(args)
}
pub(crate) fn known_saved(row: &Map<String,Value>) -> Known {
    let args=row.get("llama_extra_args").and_then(Value::as_array);
    let fit=args.and_then(|a|a.windows(2).filter_map(|w|if w[0]=="--fit" {match w[1].as_str(){Some("on")=>Some(Fit::On),Some("off")=>Some(Fit::Off),_=>None}}else{None}).last());
    let manual_auto_layers=row.get("gpu_memory_mode").is_some_and(|v|v=="manual") && row.get("gpu_layers").is_none_or(Value::is_null);
    let context=if manual_auto_layers {row.get("custom_context_length")} else {row.get("max_seq_length").or_else(||row.get("custom_context_length"))};
    Known {context_length:context.and_then(Value::as_u64).filter(|n|*n>0).and_then(|n|u32::try_from(n).ok()),parallel:row.get("n_parallel").and_then(Value::as_u64).and_then(|n|u32::try_from(n).ok()),gpu_memory_mode:match row.get("gpu_memory_mode").and_then(Value::as_str){Some("manual")=>Some(GpuMemoryMode::Manual),Some("auto")=>Some(GpuMemoryMode::Auto),_=>None},fit}
}
pub(crate) fn known_effective(status: &Value) -> Known {
    Known {context_length:status.get("context_length").and_then(Value::as_u64).filter(|n|*n>0).and_then(|n|u32::try_from(n).ok()),parallel:status.get("parallel_slots").and_then(Value::as_u64).filter(|n|(1..=64).contains(n)).map(|n|n as u32),gpu_memory_mode:match status.get("gpu_memory_mode").and_then(Value::as_str){Some("manual")=>Some(GpuMemoryMode::Manual),Some("auto")=>Some(GpuMemoryMode::Auto),_=>None},fit:None}
}
pub(crate) fn warnings(requested: &Requested, known: &Known, label: &str) -> Vec<String> {
    let mut warnings=Vec::new();
    if known.context_length.is_none() {warnings.push(format!("{label} context length is unverified."));}
    if known.parallel.is_none() {warnings.push(format!("{label} parallel slots are unverified."));}
    if known.gpu_memory_mode.is_none() {warnings.push(format!("{label} GPU memory mode is unverified."));}
    if known.fit.is_none() {warnings.push(format!("{label} fitting is unverified."));}
    if known.context_length.is_some_and(|n|n!=requested.context_length) {warnings.push(format!("{label} context length differs from requested; generation is admitted only when the actual request fits."));}
    if known.parallel.is_some_and(|n|n!=requested.parallel) {warnings.push(format!("{label} parallel slots differ from requested."));}
    if known.gpu_memory_mode.is_some_and(|m|m!=requested.gpu_memory_mode) {warnings.push(format!("{label} GPU memory mode differs from requested."));}
    if known.fit.is_some_and(|f|f!=requested.fit) {warnings.push(format!("{label} fitting differs from requested."));}
    warnings
}

#[cfg(test)]
mod tests {
    use super::*;
    fn requested() -> Requested {Requested {context_length:32768,parallel:1,gpu_memory_mode:GpuMemoryMode::Manual,fit:Fit::Off}}
    #[test]
    fn merge_preserves_known_options_replaces_only_owned_knobs_and_rejects_unsafe_state() {
        let original=json!({"kv_cache_dtype":"q8_0","speculative_type":"ngram","n_batch":512,"ctx_checkpoints":4,"llama_extra_args":["--flash-attn","on","--no-warmup","--fit","on","--ctx-size","8192"]});
        let merged=merge(original.as_object(),&requested()).unwrap();
        assert_eq!(merged["kv_cache_dtype"],"q8_0");assert_eq!(merged["speculative_type"],"ngram");
        assert_eq!(merged["ctx_checkpoints"],4);assert_eq!(merged["n_batch"],512);
        assert_eq!(merged["llama_extra_args"],json!(["--flash-attn","on","--no-warmup","--fit","off"]));
        let projected=load_args(Some(&merged),32768,Some(&ModelLoadSettings::default())).unwrap();
        assert_eq!(projected["cache_type_kv"],"q8_0");assert_eq!(projected["n_parallel"],1);
        assert!(!projected.contains_key("custom_context_length"));assert!(!projected.contains_key("kv_cache_dtype"));
        for bad in [json!({"future_engine_knob":1}),json!({"llama_extra_args":["--parallel","1"]}),json!({"llama_extra_args":["--hf-repo","private/model"]}),json!({"n_batch":"512"}),json!({"llama_extra_args":["--unknown-deprecated"]})] {assert!(merge(bad.as_object(),&requested()).is_err());}
        assert_eq!(original["llama_extra_args"][4],"on");
        for bad in [json!({"llama_extra_args":["--threads","not-an-int"]}),json!({"llama_extra_args":["--cache-type-k","nonsense"]}),json!({"llama_extra_args":["--flash-attn","garbage"]})] {assert!(merge(bad.as_object(),&requested()).is_err());}
        assert_eq!(known_saved(json!({"llama_extra_args":["--fit","on","--fit","off"]}).as_object().unwrap()).fit,Some(Fit::Off));
        assert_eq!(known_saved(json!({"max_seq_length":4096,"custom_context_length":2048,"gpu_memory_mode":"auto"}).as_object().unwrap()).context_length,Some(4096));
        assert_eq!(known_saved(json!({"max_seq_length":4096,"gpu_memory_mode":"manual"}).as_object().unwrap()).context_length,None);
        let engine=json!({"engine_kv_cache_dtype":"fp8","engine_seed":0,"engine_gpu_memory_utilization":0.8});
        let merged=merge(engine.as_object(),&requested()).unwrap();
        for key in ["engine_kv_cache_dtype","engine_seed","engine_gpu_memory_utilization"] {assert_eq!(merged[key],engine[key]);assert!(!load_args(Some(&merged),32768,None).unwrap().contains_key(key));}
    }
    #[test]
    fn exact_catalog_quant_and_resolved_loader_row_are_required() {
        let catalog=json!({"data":[{"id":"fixture/model-GGUF","loaded":false,"quant":"Q4_K_M"},{"id":"fixture/model-GGUF:Q8_0","loaded":false,"quant":"Q8_0"}]});
        assert_eq!(target("fixture/model-GGUF",&catalog).unwrap().key,"fixture/model-GGUF:Q4_K_M");
        assert_eq!(target("fixture/model-GGUF:Q8_0",&catalog).unwrap().quant,"Q8_0");
        assert!(target("fixture/model-GGUF:Q4_K_M",&catalog).is_err());
        assert!(resolved(&json!({"overrides":{},"resolved":{"n_parallel":1},"resolved_key":"unrelated"})).is_err());
        let row=json!({"n_parallel":2});
        assert!(resolved(&json!({"overrides":{"fixture/model-GGUF":row},"resolved":row,"resolved_key":"fixture/model-GGUF"})).is_ok());
    }
    #[test]
    fn resolved_scope_checks_query_members_without_guessing_an_alternate_winner() {
        let target=Target {repo:"fixture/model-GGUF".into(),quant:"Q4_K_M".into(),key:"fixture/model-GGUF:Q4_K_M".into()};
        let row=json!({"n_parallel":1});
        let checked=|key:&str,path:&str| {
            let mut rows=Map::new();rows.insert(key.into(),row.clone());
            resolved_in_scope(&json!({"overrides":rows,"resolved_key":key,"resolved":row}),&target,path)
        };
        for key in ["fixture/model-GGUF","FIXTURE/MODEL-GGUF:q4_k_m","c:/cache/model.GGUF/","C:/CACHE/MODEL.GGUF:q4_k_m"] {assert!(checked(key,"C:\\Cache\\Model.gguf").is_ok());}
        assert!(checked("//host/share/model.gguf/","\\\\Host\\Share\\Model.gguf").is_ok());
        assert!(checked("/mnt/c/cache/model.gguf/","/mnt/C/Cache/Model.gguf").is_ok());
        assert!(checked("/Cache/Model.gguf:q4_k_m","/Cache/Model.gguf").is_ok());
        assert!(checked("/Cache/café.gguf:q4_k_m","/Cache/café.gguf").is_ok());
        for (key,path) in [("unrelated/model","/Cache/Model.gguf"),("/cache/Model.gguf","/Cache/Model.gguf"),("/Cache/Model.gguf/","/Cache/Model.gguf"),("/Cache/Model.gguf:Q8_0","/Cache/Model.gguf"),("C:/CAFÉ/model.gguf","C:\\Café\\Model.gguf"),("C:/STRASSE/model.gguf","C:\\Straße\\Model.gguf")] {assert!(checked(key,path).is_err());}
    }
    #[test]
    fn legacy_projection_omits_new_defaults_and_optional_effective_fields_warn() {
        let args=load_args(None,32768,None).unwrap();
        for key in ["n_parallel","gpu_memory_mode"] {assert!(!args.contains_key(key));}
        assert_eq!(args["llama_extra_args"],json!([]));
        let known=known_effective(&json!({"context_length":22528,"requested_parallel_slots":4}));
        assert_eq!(known.context_length,Some(22528));assert_eq!(known.parallel,None);assert_eq!(known.fit,None);
        assert!(warnings(&requested(),&known,"Effective").len()>=4);
    }
}
