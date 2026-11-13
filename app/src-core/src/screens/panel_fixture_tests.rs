//! Cheap accepted-source export. This test never loads or starts Ren'Py.
use super::*;
use std::path::{Path, PathBuf};

pub(super) fn apply(service: &mut LifecycleService, command: Value) -> Value {
    let model = ipc(service, "scene.list", json!({}));
    ipc(
        service,
        "scene.apply",
        json!({"expectedProjectRevision":model["projectRevision"],
        "expectedSourceMapRevision":model["sourceMapRevision"],"command":command}),
    )
}

pub(super) fn append(service: &mut LifecycleService, scene_id: &Value, payload: Value) {
    let model = ipc(service, "scene.list", json!({}));
    let scene = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == *scene_id)
        .unwrap();
    let ending = scene["beats"].as_array().unwrap().last().unwrap();
    apply(
        service,
        json!({"type":"insertBodyBeat","body":{"type":"root"},"sceneId":scene_id,
        "expectedSourceRevision":scene["sourceRevision"],"position":{"type":"before","anchor":{"type":"beat","beatId":ending["id"]}},"beat":payload}),
    );
}

pub(super) fn collect_files(root: &Path, directory: &Path, files: &mut Vec<String>) {
    let mut entries = fs::read_dir(directory)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .collect::<Vec<_>>();
    entries.sort();
    for entry in entries {
        let metadata = fs::symlink_metadata(&entry).unwrap();
        assert!(!metadata.file_type().is_symlink());
        if metadata.is_dir() {
            collect_files(root, &entry, files);
        } else {
            assert!(metadata.is_file());
            files.push(
                entry
                    .strip_prefix(root)
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .replace('\\', "/"),
            );
        }
    }
}

fn export_fixture(output: &Path) -> Value {
    assert!(!output.exists(), "Export requires a fresh directory");
    fs::create_dir(output).unwrap();
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = fs::canonicalize(profile.join("synthetic-project")).unwrap();
    service.open_path(&root).unwrap();
    fs::create_dir_all(root.join("game/images")).unwrap();
    let selected = temporary.path().join("seal.png");
    fs::write(
        &selected,
        include_bytes!("../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
    .unwrap();
    let choice = service.authoring_select_import(&selected).unwrap();
    let imported = ipc(
        &mut service,
        "asset.import",
        json!({"authorityId":choice.authority_id,
        "kind":"uiImage","technicalName":"panel_seal","displayName":"Panel seal"}),
    );
    let asset = imported["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["kind"] == "uiImage")
        .unwrap()
        .clone();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"help_panel",
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"],"starter":{
            "title":"Help","explanation":"Keep reading while this panel is open.",
            "assetId":asset["id"],"expectedAssetSha256":asset["sha256"],"width":80,"height":40}}),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "help_panel")
        .unwrap()
        .clone();
    let before = ipc(&mut service, "scene.list", json!({}));
    let entry_id = before["entrySceneId"].clone();
    let created = apply(
        &mut service,
        json!({"type":"createScene","chapterId":before["chapters"][0]["id"],"displayName":"Panel runtime qualification"}),
    );
    let story_id = created["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["displayName"] == "Panel runtime qualification")
        .unwrap()["id"]
        .clone();
    let binding = json!({"screenId":owner["id"],"sourceName":"help_panel"});
    for (kind, text) in [
        ("narration", "HP_BASELINE"),
        ("showScreen", ""),
        ("narration", "HP_SHOWN_0"),
        ("narration", "HP_SHOWN_1"),
        ("narration", "HP_SHOWN_2"),
        ("hideScreen", ""),
        ("narration", "HP_HIDDEN"),
        ("showScreen", ""),
        ("narration", "HP_RESHOWN"),
        ("narration", "HP_DONE"),
    ] {
        let payload = if kind == "narration" {
            json!({"type":kind,"text":text})
        } else {
            let target = ipc(
                &mut service,
                "screens.resolveTarget",
                json!({"binding":binding}),
            );
            json!({"type":kind,"target":binding,"revisions":target["revisions"]})
        };
        append(&mut service, &story_id, payload);
    }
    let model = ipc(&mut service, "scene.list", json!({}));
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap();
    apply(
        &mut service,
        json!({"type":"updateBodyBeat","expectedBody":{"type":"root"},"sceneId":entry_id,
        "expectedSourceRevision":entry["sourceRevision"],"beatId":entry["beats"].as_array().unwrap().last().unwrap()["id"],
        "beat":{"type":"jump","sceneId":story_id}}),
    );
    let model = ipc(&mut service, "scene.list", json!({}));
    let story = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == story_id)
        .unwrap()
        .clone();
    let entry = model["scenes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == entry_id)
        .unwrap()
        .clone();
    assert_eq!(
        entry["beats"].as_array().unwrap().last().unwrap()["payload"],
        json!({"type":"jump","sceneId":story_id})
    );
    let resolved = ipc(
        &mut service,
        "screens.resolveTarget",
        json!({"binding":binding}),
    );
    assert_eq!(resolved["effects"]["unknown"], false);
    let document = ipc(
        &mut service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let close = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "textbutton" && n["literal"] == "Close")
        .unwrap();
    let mut paths = vec![];
    collect_files(&root, &root.join("game"), &mut paths);
    let mut files = vec![];
    for relative in paths {
        assert!(relative.ends_with(".rpy") || relative == asset["relativePath"].as_str().unwrap());
        let bytes = fs::read(root.join(&relative)).unwrap();
        let target = output.join(&relative);
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::write(&target, &bytes).unwrap();
        files.push(json!({"path":relative,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()}));
    }
    let mut metadata = serde_json::Map::new();
    for (key, name) in [
        ("project", "project.json"),
        ("sourceMap", "source-map.json"),
        ("authoring", "authoring.json"),
    ] {
        let bytes = fs::read(root.join(".renpy-editor").join(name)).unwrap();
        fs::write(output.join(name), &bytes).unwrap();
        metadata.insert(
            key.into(),
            json!({"path":name,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()}),
        );
    }
    let types = story["beats"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| b["payload"]["type"].clone())
        .collect::<Vec<_>>();
    let accepted = json!({"schemaVersion":1,"sdkVersion":"8.5.3","publicCoreRequests":true,"engineStarted":false,
        "resolution":[1280,720],"metadata":metadata,"files":files,"asset":asset,
        "entry":{"id":entry_id,"path":entry["sourcePath"],"label":entry["technicalLabel"],"revision":entry["sourceRevision"],"storyId":story_id},
        "story":{"id":story_id,"path":story["sourcePath"],"label":story["technicalLabel"],"revision":story["sourceRevision"],"types":types,"beats":story["beats"]},
        "panel":{"id":owner["id"],"rootId":owner["rootId"],"name":"help_panel","path":owner["path"],"kind":owner["kind"],"closeElementId":close["id"],"resolved":resolved}});
    fs::write(
        output.join("manifest.json"),
        serde_json::to_vec_pretty(&accepted).unwrap(),
    )
    .unwrap();
    service.close().unwrap();
    accepted
}

#[test]
fn help_panel_runtime_fixture_exports_accepted_normal_entry_source() {
    let temporary = tempfile::tempdir().unwrap();
    let output = std::env::var_os("LOOMLIGHT_HELP_PANEL_FIXTURE_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| temporary.path().join("accepted"));
    let accepted = export_fixture(&output);
    assert_eq!(accepted["schemaVersion"], 1);
    assert_eq!(accepted["sdkVersion"], "8.5.3");
    assert_eq!(accepted["publicCoreRequests"], true);
    assert_eq!(accepted["engineStarted"], false);
    assert_eq!(
        accepted["story"]["types"],
        json!([
            "narration",
            "showScreen",
            "narration",
            "narration",
            "narration",
            "hideScreen",
            "narration",
            "showScreen",
            "narration",
            "narration",
            "return"
        ])
    );
    for file in accepted["files"].as_array().unwrap() {
        let relative = file["path"].as_str().unwrap();
        assert!(relative.starts_with("game/") && !relative.contains(".."));
        let bytes = fs::read(output.join(relative)).unwrap();
        assert_eq!(hex::encode(Sha256::digest(&bytes)), file["sha256"]);
        assert_eq!(bytes.len() as u64, file["bytes"].as_u64().unwrap());
    }
    assert!(!output.join("game/.renpy-editor").exists());
    assert!(accepted["panel"]["closeElementId"].as_str().is_some());
    let manifest = fs::read(output.join("manifest.json")).unwrap();
    println!(
        "HELP_PANEL_FIXTURE {}",
        json!({
            "schemaVersion":1,"manifestSHA256":hex::encode(Sha256::digest(&manifest)),
            "publicCoreRequests":true,"engineStarted":false
        })
    );
}
