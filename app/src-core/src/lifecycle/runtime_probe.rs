//! Explicit, native-only packaged verification fixture. No renderer fixture-write capability.
use super::*;
use serde_json::json;

impl LifecycleService {
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
