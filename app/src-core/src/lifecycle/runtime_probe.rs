//! Explicit, native-only packaged verification fixture. No renderer fixture-write capability.
use super::*;
use serde_json::json;

impl LifecycleService {
    /// Inspection-only full workload. No SDK installation or project execution.
    pub fn prepare_branches_ui_probe(data: PathBuf) -> Result<Self, String> {
        use sha2::{Digest, Sha256};
        let mut service = Self::new(data).map_err(|e| format!("probe state: {e:?}"))?;
        let root = service.data_root.join("synthetic-project");
        for directory in [
            "game/definitions",
            "game/chapters/chapter_01",
            ".renpy-editor/recovery",
        ] {
            fs::create_dir_all(root.join(directory)).map_err(|e| e.to_string())?;
        }
        let (mut metadata, mut source_map, _, _) = build_overlay_model(
            "Branches performance fixture",
            "synthetic-project",
            Resolution {
                width: 1280,
                height: 720,
            },
        );
        let template = metadata.scenes[0].clone();
        metadata.scenes.clear();
        source_map.sources.clear();
        let mut sources = std::collections::BTreeMap::new();
        sources.insert(
            "game/script.rpy".to_string(),
            "label start:\n    jump scene_000\n".to_string(),
        );
        sources.insert(
            "game/definitions/characters.rpy".to_string(),
            "# Character definitions are added by Loomlight.\n".to_string(),
        );
        sources.insert(
            "game/definitions/variables.rpy".to_string(),
            "# Variable definitions are added by Loomlight.\n".to_string(),
        );
        // Required by real packaged opening. Empty scripts are valid inspection inputs;
        // preserve every original fixture byte and disclose the 506-source superset.
        for path in ["game/options.rpy", "game/gui.rpy", "game/screens.rpy"] {
            sources.insert(path.to_string(), String::new());
        }
        for i in 0..500 {
            let mut scene = template.clone();
            scene.id = uuid::Uuid::new_v4().to_string();
            scene.technical_label = format!("scene_{i:03}");
            scene.display_name = format!("Scene {i:03}");
            scene.source_path = format!("game/chapters/chapter_01/scene_{i:03}.rpy");
            let mut source = format!("label {}:\n    menu:\n", scene.technical_label);
            for offset in 0..4 {
                source.push_str(&format!(
                    "        \"Route {offset}\":\n            jump scene_{:03}\n",
                    (i + offset) % 500
                ));
            }
            sources.insert(scene.source_path.clone(), source);
            source_map.sources.push(scene.source_path.clone());
            metadata.scenes.push(scene);
        }
        metadata.entry_scene_id = Some(metadata.scenes[0].id.clone());
        metadata.last_open.scene_id = metadata.scenes[0].id.clone();
        let bytes: usize = sources.values().map(String::len).sum();
        if sources.len() != 506 || bytes != 105_627 {
            return Err("Full fixture mismatch".into());
        }
        let mut files = std::collections::BTreeMap::new();
        for (path, source) in &sources {
            fs::write(root.join(path), source).map_err(|e| e.to_string())?;
            files.insert(path.clone(), json!({"bytes":source.len(), "sha256":hex::encode(Sha256::digest(source.as_bytes()))}));
        }
        metadata.write(&root).map_err(|e| format!("{e:?}"))?;
        source_map.write(&root).map_err(|e| format!("{e:?}"))?;
        fs::write(
            root.join(".renpy-editor/authoring.json"),
            serde_json::to_vec_pretty(&AuthoringMetadata::empty(metadata.project_id.clone()))
                .unwrap(),
        )
        .map_err(|e| e.to_string())?;
        // Ordinary lifecycle migration creates the same production Scene mappings.
        service
            .open_path(&root)
            .map_err(|e| format!("probe open: {e:?}"))?;
        service.close().map_err(|e| format!("probe close: {e:?}"))?;
        for path in [
            ".renpy-editor/project.json",
            ".renpy-editor/source-map.json",
            ".renpy-editor/authoring.json",
        ] {
            let bytes = fs::read(root.join(path)).map_err(|e| e.to_string())?;
            files.insert(
                path.to_string(),
                json!({"bytes":bytes.len(), "sha256":hex::encode(Sha256::digest(&bytes))}),
            );
        }
        println!(
            "{}",
            json!({"evidence":"branches-native-fixture", "sources":sources.len(), "sourceBytes":bytes, "files":files})
        );
        Ok(service)
    }
    pub fn prepare_runtime_ui_probe(
        data: PathBuf,
        archive: &Path,
        case: &str,
    ) -> Result<Self, String> {
        if !matches!(
            case,
            "compile" | "lint" | "route-a" | "route-b" | "runtime-error"
        ) {
            return Err("Unknown runtime probe case".into());
        }
        let mut service = Self::new(data).map_err(|e| format!("probe state: {e:?}"))?;
        let sdk = crate::renpy::install_supported_sdk_from_archive(&service.data_root, archive)
            .map_err(|e| format!("probe SDK: {e:?}"))?;
        service.remember_sdk(sdk, "verified-probe");
        let root = service.data_root.join("synthetic-project");
        fs::create_dir_all(root.join("game/definitions")).map_err(|e| e.to_string())?;
        fs::create_dir_all(root.join("game/chapters/chapter_01")).map_err(|e| e.to_string())?;
        fs::create_dir_all(root.join(".renpy-editor/recovery")).map_err(|e| e.to_string())?;
        let (mut metadata, mut source_map, script, _) = build_overlay_model(
            "Runtime UI fixture",
            "synthetic-project",
            Resolution {
                width: 640,
                height: 480,
            },
        );
        let entry_label = metadata.scenes[0].technical_label.clone();
        let entry_id = metadata.scenes[0].id.clone();
        let chapter = metadata.chapters[0].id.clone();
        for route in ["a", "b"] {
            metadata.scenes.push(crate::metadata::SceneMetadata {
                id: uuid::Uuid::new_v4().to_string(),
                chapter_id: chapter.clone(),
                display_name: format!("Route {route}"),
                technical_label: format!("route_{route}"),
                source_path: format!("game/chapters/chapter_01/route_{route}.rpy"),
                extra: Map::new(),
            });
            source_map
                .sources
                .push(format!("game/chapters/chapter_01/route_{route}.rpy"));
        }
        let source = format!("label {entry_label}:\n    menu:\n        \"Route A\":\n            jump route_a\n        \"Route B\":\n            jump route_b\n");
        let selected_route = if case == "route-b" { 1 } else { 0 };
        let driver = format!(
            r##"define config.name = "Runtime UI fixture"
define config.sound = False
define config.developer = False
image oracle_asset = Solid("#335577")
default route_state = "unset"
screen main_menu():
    timer 0.1 action Start()
screen choice(items):
    vbox:
        for item in items:
            textbutton item.caption action item.action
    timer 0.1 action items[{selected_route}].action
screen say(who, what):
    text what id "what"
    timer 0.1 action Return()
label oracle_hold:
    $ renpy.pause(3600, hard=True)
    jump oracle_hold
"##
        );
        for (path, bytes) in [
            ("game/script.rpy", script.as_bytes()),
            ("game/options.rpy", driver.as_bytes()),
            ("game/gui.rpy", b"# fixture GUI\n"),
            ("game/screens.rpy", b"# screens in options\n"),
            ("game/definitions/characters.rpy", b"# Characters\n"),
            ("game/definitions/variables.rpy", b"# Variables\n"),
            ("game/chapters/chapter_01/scene_001.rpy", source.as_bytes()),
        ] {
            fs::write(root.join(path), bytes).map_err(|e| e.to_string())?;
        }
        for route in ["a", "b"] {
            let text = format!("label route_{route}:\n    scene oracle_asset\n    $ route_state = \"{route}\"\n    \"Authored route {route} dialogue\"\n    python:\n        assert route_state == \"{route}\"\n        assert renpy.showing(\"oracle_asset\")\n        print(\"R2_ROUTE_{route}_DIALOGUE_STATE_ASSET_PASS\", flush=True)\n    jump oracle_hold\n");
            fs::write(
                root.join(format!("game/chapters/chapter_01/route_{route}.rpy")),
                text,
            )
            .map_err(|e| e.to_string())?;
        }
        let diagnostic = match case {
            "compile" => "\u{feff}label diagnostic_case:\r\n    this is not a statement !!!\r\n",
            "lint" => "\u{feff}label diagnostic_case:\r\n    show loomlight_image_that_does_not_exist\r\n    return\r\n",
            "runtime-error" => "init python:\n    raise RuntimeError(\"R2_RUNTIME_ERROR_ORACLE\")\n",
            _ => "# Synthetic source retained during play.\n",
        };
        fs::write(root.join("game/雪 diagnostic.rpy"), diagnostic).map_err(|e| e.to_string())?;
        metadata.write(&root).map_err(|e| format!("{e:?}"))?;
        source_map.write(&root).map_err(|e| format!("{e:?}"))?;
        fs::write(root.join(".renpy-editor/authoring.json"),serde_json::to_vec_pretty(&json!({"schemaVersion":1,"projectId":metadata.project_id,"characters":[],"appearances":[],"variables":[],"assets":[]})).unwrap()).map_err(|e| e.to_string())?;
        let opened = service
            .open_path(&root)
            .map_err(|e| format!("probe open: {e:?}"))?;
        assert_eq!(opened.scene_id, entry_id);
        service.close().map_err(|e| format!("probe close: {e:?}"))?;
        Ok(service)
    }
}

#[cfg(test)]
mod branches_tests {
    use super::*;

    #[test]
    fn branches_native_fixture_has_full_workload_without_sdk_or_execution() {
        let temporary = tempfile::tempdir().unwrap();
        let mut service =
            LifecycleService::prepare_branches_ui_probe(temporary.path().join("profile")).unwrap();
        assert!(service.current().is_none());
        let root = service.data_root.join("synthetic-project");
        let project = service.open_path(&root).unwrap();
        let graph = service.flow_workspace().unwrap();
        assert_eq!(graph.nodes.len(), 500);
        assert_eq!(graph.edges.len(), 2000);
        assert!(!graph.partial && !graph.stale && !graph.over_limit);
        assert_eq!(graph.observation.status, "checked");
        assert_eq!(graph.entry_scene_id, project.scene_id);
        assert!(!service.data_root.join("sdks").exists());
        let sources = service.source_inventory().unwrap();
        // Independent on-disk enumeration guards against accidentally easier fixtures.
        let mut files = Vec::new();
        fn collect(root: &Path, files: &mut Vec<PathBuf>) {
            for entry in fs::read_dir(root).unwrap() {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    collect(&path, files);
                } else if path.extension().and_then(|s| s.to_str()) == Some("rpy") {
                    files.push(path);
                }
            }
        }
        collect(&root.join("game"), &mut files);
        assert_eq!(files.len(), 506);
        assert_eq!(
            files
                .iter()
                .map(|path| fs::metadata(path).unwrap().len())
                .sum::<u64>(),
            105_627
        );
        assert_eq!(sources.files.len(), 506);
        for path in ["game/options.rpy", "game/gui.rpy", "game/screens.rpy"] {
            assert!(fs::read(root.join(path)).unwrap().is_empty());
        }
        service.close().unwrap();
    }
}
