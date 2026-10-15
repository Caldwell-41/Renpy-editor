//! One-shot owner qualification driver. No profile/credential mutation or native UI.
//! `run` prints its exact synthetic payload, then requires `dispatch` on stdin before
//! the production credential adapter is opened. The coordinator reserves live budget.
#[cfg(target_os = "macos")]
#[path = "../src/ai_native.rs"]
mod ai_native;
#[cfg(target_os = "windows")]
#[path = "../src/ai_native/windows.rs"]
mod windows_native;
#[cfg(target_os = "windows")]
use ai_native::NativeSecrets;
#[cfg(target_os = "windows")]
mod ai_native {
    pub struct NativeSecrets;
    pub fn secrets(
        _: &std::path::Path,
    ) -> loomlight_core::ai_credentials::Result<impl loomlight_core::ai_credentials::Secrets> {
        Ok(NativeSecrets)
    }
}
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
compile_error!("Owner qualification requires a supported native credential platform.");

use loomlight_core::{
    ai_compatibility,
    ai_credentials::{self, Secrets},
    ai_profiles::{ProfileStore, StudioProfile},
    ai_request::{self, Cancel, Completion, Destination},
    authoring::AuthoringService,
    lifecycle::LifecycleService,
    rewrite::{PrepareRequest, SendCapture},
    transaction::ProjectId,
};
use serde_json::{json, Value};
use std::{
    io::{self, Write},
    path::PathBuf,
};

const WORLD: &str = "Synthetic world marker: the floating town of Copper Quay begins at dawn.";
const TONE: &str = "Synthetic tone marker: calm, concise, observant prose.";

struct Args {
    inspect: bool,
    root: PathBuf,
    profile: Option<String>,
    fixture: String,
    purpose: String,
    output: u32,
    include: bool,
}
fn args() -> Result<Args, &'static str> {
    let mut values = std::env::args().skip(1);
    let mode = values.next().ok_or("Expected inspect or run mode.")?;
    if !matches!(mode.as_str(), "inspect" | "run") {
        return Err("Expected inspect or run mode.");
    }
    let mut result = Args {
        inspect: mode == "inspect",
        root: PathBuf::new(),
        profile: None,
        fixture: String::new(),
        purpose: String::new(),
        output: 0,
        include: true,
    };
    let mut seen = std::collections::HashSet::new();
    while let Some(flag) = values.next() {
        if !seen.insert(flag.clone()) {
            return Err("Duplicate driver option.");
        }
        let value = values.next().ok_or("Driver option value missing.")?;
        match flag.as_str() {
            "--root" => result.root = PathBuf::from(value),
            "--profile" => result.profile = Some(value),
            "--fixture" => result.fixture = value,
            "--purpose" => result.purpose = value,
            "--output-limit" => {
                result.output = value.parse().map_err(|_| "Output limit invalid.")?
            }
            "--project-context" => {
                result.include = match value.as_str() {
                    "include" => true,
                    "omit" => false,
                    _ => return Err("Expected include or omit."),
                }
            }
            _ => return Err("Unsupported driver option."),
        }
    }
    if !result.root.is_absolute() {
        return Err("An explicit absolute existing data root is required.");
    }
    let metadata = std::fs::symlink_metadata(&result.root).map_err(|_| "Data root unavailable.")?;
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return Err("Data root must be an existing non-link directory.");
    }
    if result.inspect {
        if result.profile.is_some()
            || !result.fixture.is_empty()
            || !result.purpose.is_empty()
            || result.output != 0
            || seen.contains("--project-context")
        {
            return Err("Inspect accepts only --root.");
        }
    } else {
        if result.profile.as_deref().is_none_or(str::is_empty)
            || !(1..=2048).contains(&result.output)
        {
            return Err("Run needs an explicit profile and output limit from 1 to 2048.");
        }
        if !matches!(
            result.fixture.as_str(),
            "connection" | "rewrite" | "continue" | "draft" | "card" | "lore" | "edit"
        ) {
            return Err("Unsupported fixed synthetic fixture.");
        }
        if !matches!(
            result.purpose.as_str(),
            "setup" | "generation-action" | "world-include" | "world-omit" | "model-readiness"
        ) {
            return Err("Unsupported qualification purpose.");
        }
        if result.fixture == "connection" && seen.contains("--project-context") {
            return Err("Connection fixture contains no project context.");
        }
        if (result.purpose == "world-include" && !result.include)
            || (result.purpose == "world-omit" && result.include)
        {
            return Err("Purpose does not match context selection.");
        }
    }
    Ok(result)
}
fn emit(value: Value) -> Result<(), &'static str> {
    serde_json::to_writer(io::stdout().lock(), &value).map_err(|_| "Receipt output failed.")?;
    println!();
    io::stdout().flush().map_err(|_| "Receipt flush failed.")
}
struct Proposal {
    owner: AuthoringService,
    project: ProjectId,
    project_uuid: String,
    session: String,
    token: String,
    digest: String,
    profile_token: String,
    // Drop the production owner/handles before cleaning up on Windows. No production
    // profile or credential files are copied into this directory.
    _temporary: tempfile::TempDir,
}
enum Case {
    Connection(SendCapture),
    Proposal(Proposal),
}
impl Case {
    fn take(&self, cancel: Cancel) -> Result<SendCapture, &'static str> {
        match self {
            Self::Connection(c) => Ok(SendCapture {
                profile: c.profile.clone(),
                body: c.body.clone(),
                timeout_seconds: c.timeout_seconds,
                destination: c.destination.clone(),
            }),
            Self::Proposal(p) => p
                .owner
                .rewrite_take_send(
                    &p.project,
                    &p.project_uuid,
                    &p.session,
                    &p.profile_token,
                    &p.token,
                    &p.digest,
                    cancel,
                )
                .map_err(|_| "Synthetic prepared request changed; no dispatch."),
        }
    }
    fn validate(&self, completion: &Completion) -> bool {
        match self {
            Self::Connection(_) => ai_compatibility::validate(completion).is_ok(),
            Self::Proposal(p) => p
                .owner
                .rewrite_complete(
                    &p.project,
                    &p.project_uuid,
                    &p.session,
                    &p.profile_token,
                    &p.token,
                    completion,
                )
                .is_ok(),
        }
    }
}
fn string(value: &Value) -> Result<&str, &'static str> {
    value.as_str().ok_or("Synthetic fixture field unavailable.")
}
fn prepare_case(
    input: &Args,
    store: &ProfileStore,
    profile: &StudioProfile,
    destination: Destination,
) -> Result<(Case, Value), &'static str> {
    if input.fixture == "connection" {
        let mut captured = profile.clone();
        captured.settings.maximum_response = input.output;
        let body = ai_compatibility::body(&captured);
        let view = json!({"serializedPayload":std::str::from_utf8(&body).map_err(|_|"Synthetic payload encoding failed.")?,"serializedBytes":body.len(),"maximumResponse":input.output,"projectContextIncluded":false});
        return Ok((
            Case::Connection(SendCapture {
                profile: captured,
                body,
                timeout_seconds: 600,
                destination,
            }),
            view,
        ));
    }
    let temporary = tempfile::Builder::new()
        .prefix("loomlight-redesign-owner-")
        .tempdir()
        .map_err(|_| "Synthetic directory unavailable.")?;
    let mut lifecycle =
        LifecycleService::prepare_dialogue_rewrite_probe(temporary.path().join("data"))
            .map_err(|_| "Synthetic project preparation failed.")?;
    let root = temporary
        .path()
        .join("data/synthetic-project")
        .canonicalize()
        .map_err(|_| "Synthetic project canonical path unavailable.")?;
    let opened = lifecycle
        .open_path(&root)
        .map_err(|_| "Synthetic project unavailable.")?;
    lifecycle
        .close()
        .map_err(|_| "Synthetic lifecycle close failed.")?;
    let owner = AuthoringService::default();
    let project = owner
        .register_project(&root)
        .map_err(|_| "Synthetic project registration failed.")?;
    let refs = owner
        .references(&project, &opened.project_id)
        .map_err(|_| "Synthetic references unavailable.")?;
    let save = serde_json::from_value(json!({"expectedRevision":refs.revision,"command":{"type":"saveProjectContext","world":WORLD,"tone":TONE}})).map_err(|_|"Synthetic context request invalid.")?;
    owner
        .references_apply(&project, &opened.project_id, save)
        .map_err(|_| "Synthetic context preparation failed.")?;
    let options = owner
        .context_options(&project, &opened.project_id)
        .map_err(|_| "Synthetic context options unavailable.")?;
    let action = match input.fixture.as_str() {
        "rewrite" => "rewriteDialogue",
        "continue" => "continueScene",
        "draft" => "draftScene",
        "card" => "generateCard",
        "lore" => "generateLore",
        "edit" => "editScene",
        _ => return Err("Unsupported fixture."),
    };
    let prompt_key = match input.fixture.as_str() {
        "rewrite" => "prompt",
        "continue" => "continuePrompt",
        "draft" => "draftPrompt",
        "card" => "cardPrompt",
        "lore" => "lorePrompt",
        _ => "editPrompt",
    };
    let mut context = json!({"action":action,"expectedPromptRevision":options[prompt_key]["revision"],"expectedStructureRevision":options["structureRevision"],"references":[],"includeProjectContext":input.include,"task":"Write one short synthetic qualification result. Follow the exact supplied response contract. No tools.","contextBudget":profile.settings.context_budget,"contextCeiling":profile.settings.context_ceiling,"maximumResponse":input.output});
    if !matches!(input.fixture.as_str(), "draft" | "continue") {
        let target = options["targets"]
            .as_array()
            .and_then(|targets| {
                targets
                    .iter()
                    .find(|target| target["batchEligible"] == true)
            })
            .ok_or("Synthetic unnested target unavailable.")?;
        for key in ["sceneId", "beatId"] {
            context[key] = target[key].clone();
        }
        context["expectedSourceRevision"] = target["sourceRevision"].clone();
    }
    match input.fixture.as_str() {
        "rewrite" | "edit" => {
            if input.fixture == "edit" {
                context["batch"] = json!({"replacementIds":[context["beatId"]],"insertionAnchor":null,"speakerIds":[],"character":null});
            }
        }
        "continue" => {
            let target = options["anchors"]
                .as_array()
                .and_then(|a| a.first())
                .ok_or("Synthetic anchor unavailable.")?;
            for key in ["sceneId", "beatId"] {
                context[key] = target[key].clone();
            }
            context["expectedSourceRevision"] = target["sourceRevision"].clone();
        }
        "draft" => {
            context["chapterId"] = options["chapters"]
                .as_array()
                .and_then(|a| a.first())
                .ok_or("Synthetic chapter unavailable.")?["id"]
                .clone();
            context["displayName"] = json!("Synthetic owner scene");
        }
        "card" => {
            context["displayName"] = json!("Synthetic owner character");
        }
        "lore" => {
            context["displayName"] = json!("Synthetic owner lore");
            context["loreScope"] = json!({"type":"project"});
        }
        _ => return Err("Unsupported fixture."),
    }
    let request:PrepareRequest = serde_json::from_value(json!({"profileId":profile.profile_id,"expectedProfileToken":ai_credentials::token(store),"timeoutSeconds":600,"context":context})).map_err(|_|"Synthetic preparation request invalid.")?;
    let preview = owner.rewrite_prepare_bound(&project,&opened.project_id,&opened.session_id,store,request,Some(destination)).map_err(|_| {
        "Production preparation refused synthetic fixture; saved compatibility or context may need attention."
    })?;
    let payload = string(&preview["serializedPayload"])?;
    // Assert the visible omission against the real core-generated body, without rebuilding it.
    if payload.contains(WORLD) != input.include || payload.contains(TONE) != input.include {
        return Err("Production context inclusion differs from requested fixture.");
    }
    let receipt = json!({"serializedPayload":payload,"payloadDigest":preview["payloadDigest"],"serializedBytes":payload.len(),"maximumResponse":input.output,"projectContextIncluded":input.include});
    let proposal = Proposal {
        _temporary: temporary,
        owner,
        project,
        project_uuid: opened.project_id,
        session: opened.session_id,
        token: string(&preview["token"])?.into(),
        digest: string(&preview["payloadDigest"])?.into(),
        profile_token: ai_credentials::token(store),
    };
    Ok((Case::Proposal(proposal), receipt))
}
fn run() -> Result<(), &'static str> {
    let input = args()?;
    // The constructor opens the already validated existing root; never open a project here.
    let records =
        LifecycleService::new(input.root.clone()).map_err(|_| "Existing data root unavailable.")?;
    let store = records
        .read_ai_profiles()
        .map_err(|_| "Saved profile metadata unavailable.")?;
    if input.inspect {
        return emit(
            json!({"driver":"redesign-owner-driver","state":"inspected","profiles":store.profiles.iter().map(|p|json!({"profileId":p.profile_id,"settings":p.settings,"credentialBound":p.credential_bound()})).collect::<Vec<_>>() }),
        );
    }
    let profile = store
        .profiles
        .iter()
        .find(|p| Some(&p.profile_id) == input.profile.as_ref())
        .ok_or("Explicit profile missing.")?;
    if !profile.credential_bound() {
        return Err("Selected credential is missing, disabled or origin-unbound.");
    }
    let token = ai_credentials::token(&store);
    let destination = ai_request::resolve_destination(&profile.settings)
        .map_err(|_| "Selected destination unavailable or unsupported.")?;
    let (case, preview) = prepare_case(&input, &store, profile, destination)?;
    emit(
        json!({"driver":"redesign-owner-driver","state":"awaiting_dispatch","purpose":input.purpose,"fixture":input.fixture,"preview":preview,"credentialRead":false,"generationDispatched":false}),
    )?;
    let mut confirmation = String::new();
    if io::stdin()
        .read_line(&mut confirmation)
        .map_err(|_| "Dispatch instruction unavailable.")?
        == 0
        || confirmation.trim() != "dispatch"
    {
        return Err("Dispatch not authorized; no credential read or request.");
    }
    if ai_credentials::token(
        &records
            .read_ai_profiles()
            .map_err(|_| "Profile reread unavailable; no dispatch.")?,
    ) != token
    {
        return Err("Saved profiles changed; no dispatch.");
    }
    let cancel = Cancel::default();
    let capture = case.take(cancel.clone())?;
    // Exactly one production adapter read. No status probe, key copy, export, print or fallback.
    let secret = ai_native::secrets(records.ai_data_root())
        .map_err(|_| "Native credential adapter unavailable.")?
        .read(
            &profile.profile_id,
            profile
                .credential
                .as_ref()
                .ok_or("Credential reference missing.")?,
        )
        .map_err(|_| "Native credential unavailable; original storage retained.")?
        .ok_or("Native credential missing; original storage retained.")?;
    if ai_credentials::token(
        &records
            .read_ai_profiles()
            .map_err(|_| "Final profile reread unavailable; no dispatch.")?,
    ) != token
    {
        return Err("Saved profiles changed; no dispatch.");
    }
    let prepared = ai_request::prepare_reviewed_bound(
        capture.profile,
        secret,
        capture.timeout_seconds,
        capture.body,
        capture.destination,
    )
    .map_err(|_| "Production request preparation refused; no dispatch.")?;
    emit(
        json!({"driver":"redesign-owner-driver","state":"dispatching","maximumResponse":input.output,"fixture":input.fixture}),
    )?;
    let mut http = None;
    let result = ai_request::execute_ready(
        prepared,
        &cancel,
        |stage| {
            let _ = emit(json!({"state":"stage","stage":stage}));
        },
        &mut http,
        |ready| {
            let _ = emit(json!({"state":"model_ready","readiness":ready}));
        },
    );
    let unchanged = records
        .read_ai_profiles()
        .is_ok_and(|s| ai_credentials::token(&s) == token);
    let receipt = match result {
        Ok(completion) => {
            json!({"state":"finished","transportCompleted":true,"responseValidated":unchanged&&case.validate(&completion),"profileUnchanged":unchanged,"httpStatus":http,"usage":completion.usage,"responseBytes":completion.response_bytes})
        }
        Err(failure) => {
            json!({"state":"finished","transportCompleted":false,"responseValidated":false,"profileUnchanged":unchanged,"httpStatus":http,"category":failure.code()})
        }
    };
    // No raw completion, proposal, provider error, profile store or credential reaches stdout.
    let passed = receipt["responseValidated"] == true;
    emit(receipt)?;
    if passed {
        Ok(())
    } else {
        Err("Qualification did not pass; no automatic retry.")
    }
}
fn main() {
    if let Err(message) = run() {
        let _ = emit(json!({"driver":"redesign-owner-driver","state":"refused","message":message}));
        std::process::exit(2);
    }
}

#[cfg(test)]
mod preparation_tests {
    use super::*;
    #[test]
    fn all_fixed_payloads_use_production_preparation_without_credentials_or_network() {
        let mut profile: StudioProfile=serde_json::from_value(json!({"profileId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","revision":1,"disabled":false,"settings":{"label":"Public driver fixture","endpoint":"http://127.0.0.1:8765/v1","model":"synthetic-model","privateHttp":false,"contextBudget":65536,"contextCeiling":65536,"maximumResponse":8192},"credential":{"credentialId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","revision":1,"origin":"http://127.0.0.1:8765"}})).unwrap();
        profile.compatibility = Some(loomlight_core::ai_profiles::CompatibilityEvidence {
            schema_version: 1,
            configuration_digest: profile.compatibility_digest(),
            checked_at_unix_seconds: 1,
        });
        let store = ProfileStore {
            profiles: vec![profile.clone()],
            ..ProfileStore::default()
        };
        let before = serde_json::to_vec(&store).unwrap();
        for fixture in [
            "connection",
            "rewrite",
            "continue",
            "draft",
            "card",
            "lore",
            "edit",
        ] {
            for include in [true, false] {
                let input = Args {
                    inspect: false,
                    root: PathBuf::new(),
                    profile: Some(profile.profile_id.clone()),
                    fixture: fixture.into(),
                    purpose: "generation-action".into(),
                    output: 2048,
                    include,
                };
                let destination = Destination {
                    addresses: vec!["127.0.0.1:8765".parse().unwrap()],
                };
                let (case, preview) = prepare_case(&input, &store, &profile, destination)
                    .unwrap_or_else(|message| panic!("{fixture}/{include}: {message}"));
                let body = string(&preview["serializedPayload"]).unwrap();
                let captured = case.take(Cancel::default()).unwrap();
                assert_eq!(body.as_bytes(), captured.body);
                assert_eq!(captured.profile.settings.maximum_response, 2048);
                let parsed: Value = serde_json::from_slice(&captured.body).unwrap();
                assert_eq!(parsed["max_tokens"], 2048);
                assert_eq!(parsed["enable_tools"], false);
                assert_eq!(parsed["enable_thinking"], false);
                assert_eq!(body.contains(WORLD), fixture != "connection" && include);
                assert_eq!(body.contains(TONE), fixture != "connection" && include);
                assert_eq!(
                    serde_json::to_vec(&store).unwrap(),
                    before,
                    "original metadata must remain unchanged"
                );
            }
        }
    }
}
