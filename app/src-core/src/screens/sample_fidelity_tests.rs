//! L20 public IPC admission and fixture export. No SDK or helper starts here.
use crate::lifecycle::{acceptance::ipc, LifecycleService};
use base64::Engine;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fs};

const PATH: &str = "game/ui/sample_fidelity.rpy";
const SOURCE: &str =
    include_str!("../../../../tests/fixtures/phase-3b-screens/sample-fidelity.rpy");
const FONT: &[u8] =
    include_bytes!("../../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf");
const STATES: [&str; 6] = [
    "normal",
    "hover",
    "selected",
    "selectedHover",
    "disabled",
    "selectedDisabled",
];

#[path = "sample_fidelity_sdk_tests.rs"]
mod sdk;

fn asset_bytes(index: usize) -> Vec<u8> {
    if index == 0 {
        FONT.to_vec()
    } else {
        base64::engine::general_purpose::STANDARD
            .decode(crate::screens::tests::controls::STATE_PNGS[index - 1])
            .unwrap()
    }
}

fn fixture() -> (
    tempfile::TempDir,
    LifecycleService,
    std::path::PathBuf,
    Vec<Value>,
) {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let mut assets = vec![];
    for index in 0..7 {
        let (name, kind, ext) = if index == 0 {
            ("sample_font".to_owned(), "font", "ttf")
        } else {
            (format!("sample_state_{}", index - 1), "uiImage", "png")
        };
        let chosen = temporary.path().join(format!("{name}.{ext}"));
        fs::write(&chosen, asset_bytes(index)).unwrap();
        let choice = service.authoring_select_import(&chosen).unwrap();
        let model = ipc(
            &mut service,
            "asset.import",
            json!({"authorityId":choice.authority_id,"kind":kind,"technicalName":name,"displayName":name}),
        );
        assets.push(
            model["assets"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| {
                    a["relativePath"]
                        .as_str()
                        .unwrap()
                        .ends_with(&format!("{name}.{ext}"))
                })
                .unwrap()
                .clone(),
        );
    }
    for (name, kind, value) in [
        ("sample_score", "int", json!("0")),
        ("sample_caption", "string", json!("Default café")),
    ] {
        ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
    }
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"sample_fidelity","kind":"panel","expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|o| o["name"] == "sample_fidelity")
        .unwrap();
    fs::write(
        root.join(PATH),
        SOURCE.replacen(
            "screen ",
            &format!(
                "# loomlight-screen: {}\nscreen ",
                owner["id"].as_str().unwrap()
            ),
            1,
        ),
    )
    .unwrap();
    (temporary, service, root, assets)
}

#[test]
fn sample_fidelity_exports_all_states_and_typed_boundaries_without_execution() {
    let before = crate::renpy::process_spawn_count_for_test();
    let (_temporary, mut service, root, assets) = fixture();
    let model = ipc(&mut service, "authoring.list", json!({}));
    let variables = model["variables"].as_array().unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let source = fs::read(root.join(PATH)).unwrap();
    let mut cases = vec![];
    // S1 intentionally disagrees with SetVariable's selected state. The explicit
    // canvas state is independent of actions, which are never evaluated here.
    let mut sets = STATES
        .iter()
        .map(|state| (state.to_string(), *state, Some("7")))
        .collect::<Vec<_>>();
    for (id, value) in [
        ("defaults", None),
        ("minimum", Some("-5")),
        ("maximum", Some("15")),
        ("above", Some("99")),
        ("below", Some("-9223372036854775808")),
    ] {
        sets.push((id.into(), "normal", value));
    }
    for (width, height) in [(1280, 720), (1024, 768)] {
        for (id, state, score) in &sets {
            let samples = if let Some(score) = score {
                variables.iter().filter_map(|v| {
                let value=match v["technicalName"].as_str().unwrap(){"sample_score"=>json!(score),"flag"=>json!(false),"sample_caption"=>json!("[__import__('os').system('never')] {b}literal{/b}"),_=>return None};
                Some(json!({"variableId":v["id"],"expectedSourceRevision":v["source"]["sourceRevision"],"value":value}))
            }).collect::<Vec<_>>()
            } else {
                vec![]
            };
            let request = json!({"path":PATH,"screenName":"sample_fidelity","expectedRevision":doc["revision"],"width":width,"height":height,"buttonState":state,"variableSamples":samples});
            let plan = ipc(&mut service, "screens.canvasPlan", request.clone());
            assert_eq!(plan["available"], true, "{plan}");
            let nodes = plan["nodes"].as_array().unwrap();
            let bar = nodes.iter().find(|n| n["kind"] == "bar").unwrap();
            assert_eq!(bar["properties"]["range"], 20);
            assert_eq!(
                bar["properties"]["value"],
                score.unwrap_or("0").parse::<i64>().unwrap().clamp(-5, 15) + 5
            );
            let widgets = [
                "stage",
                "numbers",
                "caption",
                "local_button",
                "shared_button",
                "image_button",
                "score_bar",
            ];
            assert_eq!(nodes.len(), widgets.len() + 1);
            let widgets=nodes[1..].iter().zip(widgets).map(|(n,id)|json!({"start":n["start"],"selectionStart":n["start"],"widgetId":id,"clips":false})).collect::<Vec<_>>();
            cases.push(json!({"id":id,"screen":"sample_fidelity","state":state,"request":request,"plan":plan,"widgets":widgets}));
        }
    }
    assert_eq!(fs::read(root.join(PATH)).unwrap(), source);
    assert_eq!(ipc(&mut service, "authoring.list", json!({})), model);
    assert_eq!(crate::renpy::process_spawn_count_for_test(), before);
    let mut files = BTreeMap::new();
    for path in [
        PATH,
        ".renpy-editor/project.json",
        ".renpy-editor/source-map.json",
        ".renpy-editor/authoring.json",
        "game/definitions/variables.rpy",
        "game/definitions/characters.rpy",
    ] {
        let bytes = fs::read(root.join(path)).unwrap();
        files.insert(path.to_owned(),json!({"sha256":hex::encode(Sha256::digest(&bytes)),"text":String::from_utf8(bytes).unwrap()}));
    }
    let project: Value = serde_json::from_str(
        files[".renpy-editor/project.json"]["text"]
            .as_str()
            .unwrap(),
    )
    .unwrap();
    for scene in project["scenes"].as_array().unwrap() {
        let path = scene["sourcePath"].as_str().unwrap();
        let bytes = fs::read(root.join(path)).unwrap();
        files.insert(path.to_owned(),json!({"sha256":hex::encode(Sha256::digest(&bytes)),"text":String::from_utf8(bytes).unwrap()}));
    }
    service.close().unwrap();
    service.open_path(&root).unwrap();
    for case in &cases {
        assert_eq!(
            ipc(&mut service, "screens.canvasPlan", case["request"].clone()),
            case["plan"]
        );
    }
    service.close().unwrap();
    let accepted = json!({"outcome":"L20-sample-fidelity","publicCoreRequests":true,"sourceMapSchemaVersion":8,"exporterSourceSHA256":hex::encode(Sha256::digest(include_bytes!("sample_fidelity_tests.rs"))),"files":files,"assets":assets,"cases":cases});
    if let Some(output) = std::env::var_os("LOOMLIGHT_SAMPLE_FIDELITY_INPUTS") {
        fs::create_dir_all(&output).unwrap();
        fs::write(
            std::path::Path::new(&output).join("accepted.json"),
            serde_json::to_vec_pretty(&accepted).unwrap(),
        )
        .unwrap();
    }
}

fn restore_fidelity_files(root: &std::path::Path, accepted: &Value) {
    for (path, row) in accepted["files"].as_object().unwrap() {
        let path = crate::transaction::RelativePath::new(path.clone()).unwrap();
        let bytes = row["text"].as_str().unwrap().as_bytes();
        assert_eq!(hex::encode(Sha256::digest(bytes)), row["sha256"]);
        let destination = root.join(path.as_str());
        fs::create_dir_all(destination.parent().unwrap()).unwrap();
        fs::write(destination, bytes).unwrap();
    }
    for (index, asset) in accepted["assets"].as_array().unwrap().iter().enumerate() {
        let bytes = asset_bytes(index);
        assert_eq!(hex::encode(Sha256::digest(&bytes)), asset["sha256"]);
        let path =
            crate::transaction::RelativePath::new(asset["relativePath"].as_str().unwrap()).unwrap();
        let destination = root.join(path.as_str());
        fs::create_dir_all(destination.parent().unwrap()).unwrap();
        fs::write(destination, bytes).unwrap();
    }
}

#[test]
fn sample_fidelity_refuses_unqualified_expressions_and_stale_values_without_execution() {
    let before = crate::renpy::process_spawn_count_for_test();
    let (_temporary, mut service, root, _) = fixture();
    let original = fs::read_to_string(root.join(PATH)).unwrap();
    for (old, new) in [
        (
            "Score [sample_score!q] / [flag!q]",
            "Score [sample_score] / [flag!q]",
        ),
        ("Local appearance", "[sample_score!q]"),
        (
            "VariableValue(\"sample_score\", min=-5, max=15, step=1, force_step=True)",
            "custom_bar_value()",
        ),
        (
            "Transform(\"images/ui sample_state_0.png\", xysize=(80, 40))",
            "custom_image()",
        ),
    ] {
        let source = original.replace(old, new);
        assert_ne!(source, original);
        fs::write(root.join(PATH), &source).unwrap();
        let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":PATH,"screenName":"sample_fidelity","expectedRevision":doc["revision"],"width":1280,"height":720,"buttonState":"selectedDisabled"}),
        );
        assert_eq!(plan["available"], false, "{plan}");
        assert!(!plan["limits"].as_array().unwrap().is_empty());
        assert_eq!(fs::read_to_string(root.join(PATH)).unwrap(), source);
    }
    fs::write(root.join(PATH), &original).unwrap();
    let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
    let model = ipc(&mut service, "authoring.list", json!({}));
    let variable = model["variables"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["technicalName"] == "sample_score")
        .unwrap();
    let payload = json!({"path":PATH,"screenName":"sample_fidelity","expectedRevision":doc["revision"],"width":1280,"height":720,"variableSamples":[{"variableId":variable["id"],"expectedSourceRevision":"stale","value":"7"}],"sessionId":service.current().unwrap().session_id});
    let result=serde_json::to_value(crate::handle_application_request(json!({"protocolVersion":1,"requestId":"stale-sample","operation":"screens.canvasPlan","payload":payload}),false,&mut service)).unwrap();
    assert_eq!(result["ok"], false, "{result}");
    assert_eq!(result["error"]["code"], "SOURCE_CONFLICT");
    assert_eq!(fs::read_to_string(root.join(PATH)).unwrap(), original);
    assert_eq!(ipc(&mut service, "authoring.list", json!({})), model);
    assert_eq!(crate::renpy::process_spawn_count_for_test(), before);
    service.close().unwrap();
}
