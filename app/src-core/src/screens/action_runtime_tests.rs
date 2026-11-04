//! Accepted public-core source export only. Ren'Py execution is a separate gate.
use super::super::panel_fixture;
use super::*;
use std::path::{Path, PathBuf};

fn export_file(root: &Path, output: &Path, relative: &str) -> Value {
    let bytes = fs::read(root.join(relative)).unwrap();
    let target = output.join(relative);
    fs::create_dir_all(target.parent().unwrap()).unwrap();
    fs::write(target, &bytes).unwrap();
    json!({"path":relative,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()})
}

#[test]
fn ordered_actions_export_public_core_normal_entry_without_engine_execution() {
    let output_temp = tempfile::tempdir().unwrap();
    let output = std::env::var_os("LOOMLIGHT_ACTIONS_FIXTURE_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| output_temp.path().join("accepted"));
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    let (_temporary, mut service, root, panel) = composition_project();
    let dialog = create_action_screen(&mut service, "actions_dialog", "dialog");
    for (name, kind, value) in [
        ("action_ready", "bool", json!(false)),
        ("action_score", "int", json!("0")),
        ("action_caption", "string", json!("Initial")),
    ] {
        ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
    }
    let authoring = ipc(&mut service, "authoring.list", json!({}));
    let find = |name: &str| {
        authoring["variables"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["technicalName"] == name)
            .unwrap()
            .clone()
    };
    let ready = find("action_ready");
    let score = find("action_score");
    let caption = find("action_caption");
    let column = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":dialog["rootId"],"kind":"vbox","text":""}),
    );
    let mut text_nodes = vec![];
    for variable in [&ready, &score, &caption] {
        let added = compose_command(
            &mut service,
            &dialog,
            json!({"type":"add","parentId":column["selectedId"],"kind":"text","text":"Value"}),
        );
        text_nodes.push(json!({"nodeId":added["selectedId"],"variableId":variable["id"]}));
    }
    let button = compose_command(
        &mut service,
        &dialog,
        json!({"type":"add","parentId":column["selectedId"],"kind":"textbutton","text":"Apply sequence"}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry_id = model["entrySceneId"].clone();
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    save_composition_source(
        &mut service,
        &json!({"path":entry["sourcePath"]}),
        &format!(
            "label {}:\n    return\n",
            entry["technicalLabel"].as_str().unwrap()
        ),
    );
    panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"narration","text":"OA_BEFORE"}),
    );
    let binding = json!({"screenId":dialog["id"],"sourceName":dialog["name"]});
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    panel_fixture::append(
        &mut service,
        &entry_id,
        json!({"type":"callScreen","target":binding,"revisions":resolved["revisions"]}),
    );
    for marker in ["OA_AFTER", "OA_DONE"] {
        panel_fixture::append(
            &mut service,
            &entry_id,
            json!({"type":"narration","text":marker}),
        );
    }
    for node in &text_nodes {
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":dialog["path"]}),
        );
        compose_command(
            &mut service,
            &dialog,
            json!({"type":"variableText","nodeId":node["nodeId"],"binding":{"variableId":node["variableId"]},"expectedAuthoringRevision":doc["authoringRevision"]}),
        );
    }
    let target = reviewed_target(&mut service, &panel);
    let dangerous = "Brackets [action_score] {b}text{/b} and __import__('os')";
    let actions = json!([
        {"type":"setVariable","variableId":ready["id"],"value":true},
        {"type":"setVariable","variableId":score["id"],"value":"9007199254740993"},
        {"type":"showScreen","target":target["target"]},
        {"type":"setVariable","variableId":score["id"],"value":"-7"},
        {"type":"setVariable","variableId":caption["id"],"value":dangerous},
        {"type":"hideScreen","target":target["target"]},
        {"type":"setVariable","variableId":ready["id"],"value":false},
        {"type":"finishInteraction"}
    ]);
    let doc = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    compose_command(
        &mut service,
        &dialog,
        json!({"type":"actions","nodeId":button["selectedId"],"actions":actions,"expectedAuthoringRevision":doc["authoringRevision"],"expectedTargetRevisions":[target]}),
    );
    let final_target = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    let runtime_ready =
        final_target["effects"]["unknown"] == false && final_target["blocking"] == true;
    if runtime_ready {
        // The final combined candidate must admit the completed screen as a Call.
        let model = ipc(&mut service, "scene.list", json!({}));
        let entry = model["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == entry_id)
            .unwrap();
        let call = entry["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "callScreen")
            .unwrap();
        panel_fixture::apply(
            &mut service,
            json!({"type":"updateBeat","sceneId":entry_id,"beatId":call["id"],"expectedSourceRevision":entry["sourceRevision"],
            "beat":{"type":"callScreen","target":binding,"revisions":final_target["revisions"]}}),
        );
    }
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":dialog["path"]}),
    );
    let authored = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["id"] == button["selectedId"])
        .unwrap();
    assert_eq!(authored["actions"], actions);
    let mut paths = vec![];
    panel_fixture::collect_files(&root, &root.join("game"), &mut paths);
    let files = paths
        .iter()
        .map(|p| {
            assert!(p.ends_with(".rpy"));
            export_file(&root, &output, p)
        })
        .collect::<Vec<_>>();
    let mut metadata = serde_json::Map::new();
    for (key, name) in [
        ("project", "project.json"),
        ("sourceMap", "source-map.json"),
        ("authoring", "authoring.json"),
    ] {
        let relative = format!(".renpy-editor/{name}");
        let mut record = export_file(&root, &output, &relative);
        fs::rename(output.join(relative), output.join(name)).unwrap();
        record["path"] = json!(name);
        metadata.insert(key.into(), record);
    }
    fs::remove_dir(output.join(".renpy-editor")).unwrap();
    let manifest = json!({"schemaVersion":1,"sdkVersion":"8.5.3","publicCoreRequests":true,"engineStarted":false,
        "files":files,"metadata":metadata,"entry":entry,"panel":panel,"dialog":dialog,"document":document,
        "buttonId":button["selectedId"],"textNodes":text_nodes,"variables":[ready,score,caption],"actions":actions,
        "runtimeReady":runtime_ready,"normalStoryCallAdmitted":runtime_ready,"finalTarget":final_target,
        "expected":{"ready":false,"score":"-7","caption":dangerous,"panelVisible":false,"followingCount":1}});
    fs::write(
        output.join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).unwrap(),
    )
    .unwrap();
    service.close().unwrap();
    println!(
        "ORDERED_ACTIONS_FIXTURE {}",
        json!({"schemaVersion":1,"manifestSHA256":hex::encode(Sha256::digest(fs::read(output.join("manifest.json")).unwrap())),"publicCoreRequests":true,"engineStarted":false,"runtimeReady":runtime_ready})
    );
}
