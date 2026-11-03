//! Export public-core accepted bytes for later deliberate normal-entry qualification.
use super::*;
use sha2::{Digest, Sha256};
use std::path::Path;

fn export_file(root: &Path, output: &Path, relative: &str) -> Value {
    let bytes = fs::read(root.join(relative)).unwrap();
    let target = output.join(relative);
    fs::create_dir_all(target.parent().unwrap()).unwrap();
    fs::write(target, &bytes).unwrap();
    json!({"path":relative,"sha256":hex::encode(Sha256::digest(&bytes)),"bytes":bytes.len()})
}
fn collect_files(root: &Path, directory: &Path, paths: &mut Vec<String>) {
    let mut entries = fs::read_dir(directory)
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect::<Vec<_>>();
    entries.sort();
    for entry in entries {
        let metadata = fs::symlink_metadata(&entry).unwrap();
        assert!(!metadata.file_type().is_symlink());
        if metadata.is_dir() {
            collect_files(root, &entry, paths);
        } else {
            assert!(metadata.is_file());
            paths.push(
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

#[test]
fn help_dialog_exports_public_core_normal_entry_without_engine_execution() {
    let temporary = tempfile::tempdir().unwrap();
    let output = std::env::var_os("LOOMLIGHT_HELP_DIALOG_FIXTURE_DIR")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| temporary.path().join("accepted"));
    assert!(!output.exists());
    fs::create_dir_all(&output).unwrap();
    let mut f = Fixture::new();
    fs::create_dir_all(f.root.join("game/images")).unwrap();
    let selected = temporary.path().join("seal.png");
    fs::write(
        &selected,
        include_bytes!("../../../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
    )
    .unwrap();
    let choice = f.service.authoring_select_import(&selected).unwrap();
    let imported = ipc(
        &mut f.service,
        "asset.import",
        json!({"authorityId":choice.authority_id,"kind":"uiImage","technicalName":"help_seal","displayName":"Help seal"}),
    );
    let asset = imported["assets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|a| a["kind"] == "uiImage")
        .unwrap()
        .clone();
    let catalog = ipc(&mut f.service, "screens.list", json!({}));
    let created = ipc(
        &mut f.service,
        "screens.create",
        json!({"name":"help_dialog","kind":"dialog",
        "expectedProjectRevision":catalog["projectRevision"],"expectedSourceMapRevision":catalog["sourceMapRevision"],"expectedInventoryRevision":catalog["inventoryRevision"],
        "starter":{"title":"Help","explanation":"Close Help to continue the story.","assetId":asset["id"],"expectedAssetSha256":asset["sha256"],"width":80,"height":40}}),
    );
    let owner = created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == "help_dialog")
        .unwrap()
        .clone();
    let scene = f.model()["scenes"][0].clone();
    f.save(
        &scene,
        &format!(
            "label {}:\n    \"HD_BEFORE\"\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        ),
    );
    let target = resolved(&mut f, &owner);
    insert(&mut f, &target);
    for text in ["HD_AFTER", "HD_DONE"] {
        let current = f.model()["scenes"][0].clone();
        let last = current["beats"].as_array().unwrap().last().unwrap();
        f.command(json!({"type":"insertBodyBeat","sceneId":current["id"],"expectedSourceRevision":current["sourceRevision"],"body":{"type":"root"},
            "position":{"type":"before","anchor":{"type":"beat","beatId":last["id"]}},"beat":{"type":"narration","text":text}}));
    }
    let scene = f.model()["scenes"][0].clone();
    let resolved = resolved(&mut f, &owner);
    let document = ipc(
        &mut f.service,
        "screens.inspect",
        json!({"path":owner["path"]}),
    );
    let close = document["screens"][0]["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "textbutton")
        .unwrap();
    let mut paths = vec![];
    collect_files(&f.root, &f.root.join("game"), &mut paths);
    let files = paths
        .iter()
        .map(|p| {
            assert!(p.ends_with(".rpy") || *p == asset["relativePath"].as_str().unwrap());
            export_file(&f.root, &output, p)
        })
        .collect::<Vec<_>>();
    let mut metadata = serde_json::Map::new();
    for (key, name) in [
        ("project", "project.json"),
        ("sourceMap", "source-map.json"),
        ("authoring", "authoring.json"),
    ] {
        let relative = format!(".renpy-editor/{name}");
        let mut record = export_file(&f.root, &output, &relative);
        fs::rename(output.join(&relative), output.join(name)).unwrap();
        record["path"] = json!(name);
        metadata.insert(key.into(), record);
    }
    fs::remove_dir(output.join(".renpy-editor")).unwrap();
    let manifest = json!({"schemaVersion":1,"sdkVersion":"8.5.3","publicCoreRequests":true,"engineStarted":false,
        "metadata":metadata,"files":files,"asset":asset,"entry":scene,
        "dialog":{"id":owner["id"],"rootId":owner["rootId"],"name":owner["name"],"path":owner["path"],"kind":owner["kind"],"closeElementId":close["id"],"resolved":resolved}});
    assert_eq!(manifest["dialog"]["kind"], "dialog");
    assert_eq!(
        manifest["entry"]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b["payload"]["type"].as_str().unwrap())
            .collect::<Vec<_>>(),
        vec![
            "narration",
            "callScreen",
            "narration",
            "narration",
            "return"
        ]
    );
    fs::write(
        output.join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).unwrap(),
    )
    .unwrap();
    f.service.close().unwrap();
    println!(
        "HELP_DIALOG_FIXTURE {}",
        json!({"schemaVersion":1,"manifestSHA256":hex::encode(Sha256::digest(fs::read(output.join("manifest.json")).unwrap())),"publicCoreRequests":true,"engineStarted":false})
    );
}
