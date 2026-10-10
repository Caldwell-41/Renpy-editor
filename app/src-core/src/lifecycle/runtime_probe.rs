//! Explicit, native-only packaged verification fixture. No renderer fixture-write capability.
use super::*;
use serde_json::json;

impl LifecycleService {
    /// One Scene, no SDK execution. Uses ordinary service authoring and Source Save.
    pub fn prepare_source_foundation_probe(data: PathBuf) -> Result<Self, String> {
        let mut service = Self::new(data).map_err(|e| format!("probe state: {e:?}"))?;
        let root = service.data_root.join("synthetic-project");
        for directory in [
            "game/definitions",
            "game/chapters/chapter_01",
            ".renpy-editor/recovery",
        ] {
            fs::create_dir_all(root.join(directory)).map_err(|e| e.to_string())?;
        }
        let (metadata, source_map, script, _) = build_overlay_model(
            "Source foundation fixture",
            "synthetic-project",
            Resolution {
                width: 1280,
                height: 720,
            },
        );
        let scene = &metadata.scenes[0];
        for (path, source) in [
            ("game/script.rpy", script.as_str()),
            ("game/options.rpy", ""),
            ("game/gui.rpy", ""),
            ("game/screens.rpy", ""),
            (
                "game/definitions/characters.rpy",
                "# Character definitions are added by Loomlight.\n",
            ),
            (
                "game/definitions/variables.rpy",
                "# Variable definitions are added by Loomlight.\n",
            ),
        ] {
            fs::write(root.join(path), source).map_err(|e| e.to_string())?;
        }
        fs::write(
            root.join(&scene.source_path),
            format!("label {}:\n    return\n", scene.technical_label),
        )
        .map_err(|e| e.to_string())?;
        metadata.write(&root).map_err(|e| format!("{e:?}"))?;
        source_map.write(&root).map_err(|e| format!("{e:?}"))?;
        fs::write(
            root.join(".renpy-editor/authoring.json"),
            serde_json::to_vec_pretty(&AuthoringMetadata::empty(metadata.project_id.clone()))
                .unwrap(),
        )
        .map_err(|e| e.to_string())?;
        service.open_path(&root).map_err(|e| format!("{e:?}"))?;
        service
            .authoring_create_character(CreateCharacterRequest {
                technical_name: "bec".into(),
                display_name: "Bec".into(),
                dialogue_color: "#ffffff".into(),
            })
            .map_err(|e| format!("{e:?}"))?;
        service
            .authoring_create_variable(CreateVariableRequest {
                technical_name: "flag".into(),
                variable_type: crate::authoring::VariableType::Bool,
                default_value: json!(true),
            })
            .map_err(|e| format!("{e:?}"))?;
        let opened = service
            .source_open(SourceOpenRequest {
                path: scene.source_path.clone(),
                expected_revision: None,
                selection_start: None,
                selection_end: None,
                byte_start: None,
                byte_end: None,
            })
            .map_err(|e| format!("{e:?}"))?;
        let source = include_str!("../../../../tests/fixtures/source-foundation/scene.rpy")
            .trim_start_matches('\u{feff}')
            .replace(
                "label scene_one:",
                &format!("label {}:", scene.technical_label),
            );
        // Preserve a BOM explicitly in the accepted synthetic source.
        let source = format!("\u{feff}{source}");
        let draft = service
            .source_update_draft(SourceDraftRequest {
                path: scene.source_path.clone(),
                expected_base_revision: opened.base_revision,
                text: source,
                selection_start: 0,
                selection_end: 0,
            })
            .map_err(|e| format!("{e:?}"))?;
        service
            .source_save(SourceSaveRequest {
                path: scene.source_path.clone(),
                expected_base_revision: draft.base_revision,
                expected_draft_version: draft.draft_version,
            })
            .map_err(|e| format!("{e:?}"))?;
        service.close().map_err(|e| format!("{e:?}"))?;
        Ok(service)
    }
    /// Native-only fresh disposable first-rewrite fixture. No network or credentials.
    pub fn prepare_dialogue_rewrite_probe(data: PathBuf) -> Result<Self,String> {
        let mut service=Self::prepare_source_foundation_probe(data.clone())?;
        let root=data.join("synthetic-project");
        let project=service.open_path(&root).map_err(|_|"Rewrite fixture open failed")?;
        let ws=service.scene_workspace().map_err(|_|"Rewrite fixture projection failed")?;
        let scene=&ws.scenes[0];
        let beat=scene.beats.iter().find(|b|matches!(b.payload,crate::scene::BeatPayload::Narration{..})).ok_or("Rewrite fixture target missing")?;
        let request=serde_json::from_value(json!({"expectedProjectRevision":ws.project_revision,"expectedSourceMapRevision":ws.source_map_revision,"command":{"type":"updateBeat","sceneId":scene.id,"expectedSourceRevision":scene.source_revision,"beatId":beat.id,"beat":{"type":"narration","text":"Hello [flag] {b}friend{/b} [[literal] {{brace}"}}})).map_err(|_|"Rewrite fixture request failed")?;
        service.scene_apply(request).map_err(|_|"Rewrite fixture text failed")?;
        use sha2::Digest;
        let baseline_digest=hex::encode(sha2::Sha256::digest(crate::prompts::BASELINE.as_bytes()));
        let editor=root.join(".renpy-editor");
        let mut refs:Value=serde_json::from_str(include_str!("../../../tests/fixtures/reference-library/manual-save.json")).map_err(|_|"Rewrite references failed")?;
        refs["projectId"]=json!(project.project_id);
        let lore=&mut refs["loreEntries"][0];lore["approvedRevisionId"]=lore["currentRevisionId"].clone();lore["revisions"][0]["status"]=json!("approved");lore["revisions"][0]["reviewedAt"]=json!("2026-10-10T00:00:00Z");lore["revisions"][0]["content"]["citations"]=json!([]);
        fs::write(editor.join("references.json"),serde_json::to_vec_pretty(&refs).unwrap()).map_err(|_|"Rewrite references write failed")?;
        fs::write(editor.join("ai.json"),serde_json::to_vec_pretty(&json!({"schemaVersion":1,"projectId":project.project_id,"prompts":{"rewriteDialogue":{"text":"Rewrite only the selected prose; follow the response contract.","baselineVersion":crate::prompts::BASELINE_VERSION,"baselineDigest":baseline_digest},"continueScene":{"text":"Continue only at the saved anchor; follow the response contract.","baselineVersion":crate::prompts::BASELINE_VERSION,"baselineDigest":hex::encode(sha2::Sha256::digest(crate::prompts::CONTINUE_BASELINE.as_bytes()))},"draftScene":{"text":"Draft only the reviewed Scene; follow the response contract.","baselineVersion":crate::prompts::BASELINE_VERSION,"baselineDigest":hex::encode(sha2::Sha256::digest(crate::prompts::DRAFT_BASELINE.as_bytes()))},"futureAction":{"text":"Retained"}},"styleNotes":"Synthetic author style.","futureSettings":{"retained":true}})).unwrap()).map_err(|_|"Rewrite prompt write failed")?;
        service.close().map_err(|_|"Rewrite fixture close failed")?;
        Ok(service)
    }
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
# This minimal fixture has no confirm screen. An editor-owned Stop must quit
# directly rather than fail inside the SDK's fallback confirmation layout.
define config.quit_action = Quit(confirm=False)
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

    fn foundation(temporary: &tempfile::TempDir) -> (LifecycleService, PathBuf) {
        let mut service =
            LifecycleService::prepare_source_foundation_probe(temporary.path().join("profile"))
                .unwrap();
        let root = service.data_root.join("synthetic-project");
        service.open_path(&root).unwrap();
        (service, root)
    }

    fn child_command(model: &serde_json::Value, text: &str) -> serde_json::Value {
        let scene = &model["scenes"][0];
        let child = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["owner"].is_object())
            .unwrap();
        json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{
            "type":"updateChildDialogue","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":child["id"],"expectedOwner":child["owner"],"characterId":child["payload"]["characterId"],"text":text}})
    }

    #[test]
    fn source_foundation_dispatch_minimal_patch_owners_history_reopen() {
        use crate::lifecycle::acceptance::ipc;
        let temporary = tempfile::tempdir().unwrap();
        let (mut service, root) = foundation(&temporary);
        let model = ipc(&mut service, "scene.list", json!({}));
        let path = model["scenes"][0]["sourcePath"].as_str().unwrap();
        let original = fs::read(root.join(path)).unwrap();
        let children = model["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["owner"].is_object())
            .collect::<Vec<_>>();
        assert_eq!(children.len(), 2);
        assert_eq!(
            children[0]["owner"]["groupId"],
            children[1]["owner"]["groupId"]
        );
        assert_ne!(
            children[0]["owner"]["branchId"],
            children[1]["owner"]["branchId"]
        );
        let mut wrong = child_command(&model, "lost");
        wrong["command"]["expectedOwner"] = children[1]["owner"].clone();
        wrong["sessionId"] = json!(service.current().unwrap().session_id);
        let refused = crate::lifecycle::tests::closeout_ipc(&mut service, "scene.apply", wrong);
        assert_eq!(refused["ok"], false, "wrong branch must reject: {refused}");
        assert_eq!(fs::read(root.join(path)).unwrap(), original);
        let changed = ipc(
            &mut service,
            "scene.apply",
            child_command(&model, "Edited café 雪"),
        );
        let expected = String::from_utf8(original.clone())
            .unwrap()
            .replacen("True café 雪", "Edited café 雪", 1)
            .into_bytes();
        assert_eq!(
            fs::read(root.join(path)).unwrap(),
            expected,
            "only quoted text may change"
        );
        let ids = |m: &serde_json::Value| {
            m["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .map(|b| b["id"].clone())
                .collect::<Vec<_>>()
        };
        assert_eq!(ids(&model), ids(&changed));
        assert_eq!(
            changed["scenes"][0]["beats"][2]["conditionalBranch"],
            model["scenes"][0]["beats"][2]["conditionalBranch"]
        );
        let source = ipc(&mut service, "source.open", json!({"path":path}));
        assert_eq!(
            source["ranges"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|r| r["owner"].is_object())
                .count(),
            2
        );
        ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":changed["projectRevision"],"expectedSourceMapRevision":changed["sourceMapRevision"],"command":{"type":"undo"}}),
        );
        assert_eq!(fs::read(root.join(path)).unwrap(), original);
        let undone = ipc(&mut service, "scene.list", json!({}));
        ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":undone["projectRevision"],"expectedSourceMapRevision":undone["sourceMapRevision"],"command":{"type":"redo"}}),
        );
        assert_eq!(fs::read(root.join(path)).unwrap(), expected);
        service.close().unwrap();
        service.open_path(&root).unwrap();
        let reopened = ipc(&mut service, "scene.list", json!({}));
        assert_eq!(ids(&reopened), ids(&model));
        assert_eq!(fs::read(root.join(path)).unwrap(), expected);
        // v2 refinement preserves every old opaque/non-nested ID and unknown field.
        service.close().unwrap();
        let map_path = root.join(".renpy-editor/source-map.json");
        let mut map: crate::metadata::SourceMapMetadata =
            serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        map.schema_version = 2;
        for beat in &mut map.scene_mappings[0].beats {
            if beat.owner.is_some() {
                beat.kind = "customCode".into();
            }
            beat.owner = None;
            beat.conditional_branch = None;
            beat.extra.insert("futureField".into(), json!("kept"));
        }
        fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
        service.open_path(&root).unwrap();
        let migrated = ipc(&mut service, "scene.list", json!({}));
        assert_eq!(ids(&migrated), ids(&model));
        assert_eq!(fs::read(root.join(path)).unwrap(), expected);
        let saved: crate::metadata::SourceMapMetadata =
            serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        assert!(saved.scene_mappings[0]
            .beats
            .iter()
            .all(|b| b.extra["futureField"] == "kept"));
        let map_bytes = fs::read(&map_path).unwrap();
        service.close().unwrap();
        service.open_path(&root).unwrap();
        assert_eq!(fs::read(&map_path).unwrap(), map_bytes, "reopen is a no-op");
        service.close().unwrap();
    }

    #[test]
    fn source_foundation_external_conflict_dirty_draft_and_stale_session_reject() {
        use crate::lifecycle::acceptance::ipc;
        let temporary = tempfile::tempdir().unwrap();
        let (mut service, root) = foundation(&temporary);
        let model = ipc(&mut service, "scene.list", json!({}));
        let path = model["scenes"][0]["sourcePath"].as_str().unwrap();
        let opened = ipc(&mut service, "source.open", json!({"path":path}));
        let retained = format!(
            "{}# retained source draft\n",
            opened["text"].as_str().unwrap()
        );
        ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":retained,"selectionStart":0,"selectionEnd":0}),
        );
        let mut command = child_command(&model, "Must not save");
        command["sessionId"] = json!(service.current().unwrap().session_id);
        let refused =
            crate::lifecycle::tests::closeout_ipc(&mut service, "scene.apply", command.clone());
        assert_eq!(refused["ok"], false);
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":path}))["text"],
            retained
        );
        ipc(&mut service, "source.discard", json!({"path":path}));
        let external = fs::read(root.join(path))
            .unwrap()
            .into_iter()
            .chain(b"# ordinary external writer\n".iter().copied())
            .collect::<Vec<_>>();
        fs::write(root.join(path), &external).unwrap();
        let refused =
            crate::lifecycle::tests::closeout_ipc(&mut service, "scene.apply", command.clone());
        assert_eq!(refused["ok"], false, "stale source revision must reject");
        assert_eq!(fs::read(root.join(path)).unwrap(), external);
        ipc(&mut service, "source.open", json!({"path":path}));
        service.close().unwrap();
        service.open_path(&root).unwrap();
        let refused = crate::lifecycle::tests::closeout_ipc(&mut service, "scene.apply", command);
        assert_eq!(refused["ok"], false, "old session must reject");
        assert_eq!(fs::read(root.join(path)).unwrap(), external);
        service.close().unwrap();
    }

    #[test]
    fn source_foundation_identical_children_keep_ids_and_root_commands_reject() {
        use crate::lifecycle::acceptance::ipc;
        let temporary = tempfile::tempdir().unwrap();
        let (mut service, root) = foundation(&temporary);
        let model = ipc(&mut service, "scene.list", json!({}));
        let path = model["scenes"][0]["sourcePath"].as_str().unwrap();
        let opened = ipc(&mut service, "source.open", json!({"path":path}));
        let source = opened["text"]
            .as_str()
            .unwrap()
            .replace(" # keep true suffix", "")
            .replace(" # keep false suffix", "");
        let draft = ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
        );
        ipc(
            &mut service,
            "source.save",
            json!({"path":path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
        );
        let before = ipc(&mut service, "scene.list", json!({}));
        let second = before["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["owner"].is_object())
            .nth(1)
            .unwrap();
        let mut duplicate = child_command(&before, "True café 雪");
        duplicate["command"]["beatId"] = second["id"].clone();
        duplicate["command"]["expectedOwner"] = second["owner"].clone();
        let after = ipc(&mut service, "scene.apply", duplicate);
        let old = before["scenes"][0]["beats"].as_array().unwrap();
        let new = after["scenes"][0]["beats"].as_array().unwrap();
        assert_eq!(
            old.iter().map(|b| &b["id"]).collect::<Vec<_>>(),
            new.iter().map(|b| &b["id"]).collect::<Vec<_>>()
        );
        let child = new.iter().find(|b| b["owner"].is_object()).unwrap();
        let accepted = fs::read(root.join(path)).unwrap();
        for command in [
            json!({"type":"updateBeat","beatId":child["id"],"beat":child["payload"]}),
            json!({"type":"removeBeat","beatId":child["id"]}),
            json!({"type":"moveBeat","beatId":child["id"],"direction":"up"}),
            json!({"type":"reorderBeat","beatId":child["id"],"toIndex":0}),
            json!({"type":"insertBeat","beforeBeatId":child["id"],"beat":child["payload"]}),
            json!({"type":"continueDialogue","beatId":child["id"],"characterId":child["payload"]["characterId"],"text":"new"}),
        ] {
            let mut command = command;
            command["sceneId"] = after["scenes"][0]["id"].clone();
            command["expectedSourceRevision"] = after["scenes"][0]["sourceRevision"].clone();
            let session_id = service.current().unwrap().session_id;
            let response = crate::lifecycle::tests::closeout_ipc(
                &mut service,
                "scene.apply",
                json!({"sessionId":session_id,"expectedProjectRevision":after["projectRevision"],"expectedSourceMapRevision":after["sourceMapRevision"],"command":command}),
            );
            assert_eq!(
                response["ok"], false,
                "root operation must reject child: {response}"
            );
            assert_eq!(fs::read(root.join(path)).unwrap(), accepted);
        }
        service.close().unwrap();
    }

    #[test]
    fn source_foundation_root_operations_preserve_nested_boundaries() {
        use crate::lifecycle::acceptance::ipc;
        let temporary = tempfile::tempdir().unwrap();
        let (mut service, root) = foundation(&temporary);
        let initial = ipc(&mut service, "scene.list", json!({}));
        let scene = &initial["scenes"][0];
        let path = scene["sourcePath"].as_str().unwrap();
        let source = format!(
            "label {}:\n    if flag:\n        bec \"True\"\n        # before Otherwise\n    else:\n        # before child\n        bec \"False\"\n    bec \"Root one\"\n    bec \"Root two\"\n    return\n",
            scene["technicalLabel"].as_str().unwrap()
        );
        let opened = ipc(&mut service, "source.open", json!({"path":path}));
        let draft = ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
        );
        ipc(
            &mut service,
            "source.save",
            json!({"path":path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
        );
        let model = ipc(&mut service, "scene.list", json!({}));
        let beats = model["scenes"][0]["beats"].as_array().unwrap();
        let first_root = beats
            .iter()
            .find(|b| b["payload"]["text"] == "Root one")
            .unwrap();
        let child_index = beats
            .iter()
            .position(|b| b["payload"]["text"] == "False")
            .unwrap();
        let accepted_source = fs::read(root.join(path)).unwrap();
        let accepted_map = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
        let mut commands = vec![
            json!({"type":"moveBeat","beatId":first_root["id"],"direction":"up"}),
            json!({"type":"reorderBeat","beatId":first_root["id"],"toIndex":child_index}),
        ];
        // Headers and trivia inside either body must not become root insertion anchors.
        for beat in beats.iter().filter(|b| {
            b["conditionalBranch"]["otherwise"] == true
                || b["payload"]["source"]
                    .as_str()
                    .is_some_and(|s| s.trim_start().starts_with('#'))
        }) {
            commands.push(json!({"type":"insertBeat","beforeBeatId":beat["id"],"beat":{"type":"narration","text":"Unsafe root"}}));
        }
        for mut command in commands {
            command["sceneId"] = model["scenes"][0]["id"].clone();
            command["expectedSourceRevision"] = model["scenes"][0]["sourceRevision"].clone();
            let session_id = service.current().unwrap().session_id;
            let response = crate::lifecycle::tests::closeout_ipc(
                &mut service,
                "scene.apply",
                json!({"sessionId":session_id,"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":command}),
            );
            assert_eq!(response["error"]["code"], "SCENE_INVARIANT", "{response}");
            assert_eq!(fs::read(root.join(path)).unwrap(), accepted_source);
            assert_eq!(
                fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
                accepted_map
            );
            assert_eq!(ipc(&mut service, "scene.list", json!({})), model);
        }
        // Ordinary root moves and insertion outside the group remain available.
        let moved = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"moveBeat","sceneId":scene["id"],"expectedSourceRevision":model["scenes"][0]["sourceRevision"],"beatId":first_root["id"],"direction":"down"}}),
        );
        assert_eq!(
            fs::read(root.join(path)).unwrap(),
            String::from_utf8(accepted_source)
                .unwrap()
                .replace(
                    "    bec \"Root one\"\n    bec \"Root two\"",
                    "    bec \"Root two\"\n    bec \"Root one\""
                )
                .as_bytes()
        );
        let inserted = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":moved["projectRevision"],"expectedSourceMapRevision":moved["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":moved["scenes"][0]["sourceRevision"],"beforeBeatId":beats[0]["id"],"beat":{"type":"narration","text":"Safe root"}}}),
        );
        assert_eq!(
            inserted["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|b| b["owner"].is_object())
                .count(),
            2
        );
        let after_group = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":inserted["projectRevision"],"expectedSourceMapRevision":inserted["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":inserted["scenes"][0]["sourceRevision"],"beforeBeatId":first_root["id"],"beat":{"type":"narration","text":"After group"}}}),
        );
        let old_children = beats
            .iter()
            .filter(|b| b["owner"].is_object())
            .map(|b| (&b["id"], &b["owner"]))
            .collect::<Vec<_>>();
        let new_children = after_group["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["owner"].is_object())
            .map(|b| (&b["id"], &b["owner"]))
            .collect::<Vec<_>>();
        assert_eq!(
            old_children, new_children,
            "safe root edits preserve child IDs and owners"
        );
        service.close().unwrap();
    }

    #[test]
    fn source_foundation_append_after_unterminated_child_preserves_group() {
        use crate::lifecycle::acceptance::ipc;
        for newline in ["\n", "\r\n"] {
            let temporary = tempfile::tempdir().unwrap();
            let (mut service, root) = foundation(&temporary);
            let initial = ipc(&mut service, "scene.list", json!({}));
            let scene = &initial["scenes"][0];
            let path = scene["sourcePath"].as_str().unwrap();
            let source = format!(
                "label {}:{newline}    if flag:{newline}        bec \"True café 雪\"{newline}    else:{newline}        bec \"False\"",
                scene["technicalLabel"].as_str().unwrap()
            );
            let opened = ipc(&mut service, "source.open", json!({"path":path}));
            let draft = ipc(
                &mut service,
                "source.updateDraft",
                json!({"path":path,"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
            );
            ipc(
                &mut service,
                "source.save",
                json!({"path":path,"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
            );
            let model = ipc(&mut service, "scene.list", json!({}));
            let children = |m: &serde_json::Value| {
                m["scenes"][0]["beats"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|b| b["owner"].is_object())
                    .map(|b| (b["id"].clone(), b["owner"].clone()))
                    .collect::<Vec<_>>()
            };
            assert_eq!(children(&model).len(), 2);
            let accepted = fs::read(root.join(path)).unwrap();
            let appended = ipc(
                &mut service,
                "scene.apply",
                json!({"expectedProjectRevision":model["projectRevision"],"expectedSourceMapRevision":model["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":model["scenes"][0]["sourceRevision"],"beforeBeatId":null,"beat":{"type":"narration","text":"Safe root"}}}),
            );
            let expected = [
                accepted.as_slice(),
                format!("{newline}    \"Safe root\"{newline}").as_bytes(),
            ]
            .concat();
            assert_eq!(
                fs::read(root.join(path)).unwrap(),
                expected,
                "append must separate the root statement from the unterminated child"
            );
            assert_eq!(children(&appended), children(&model));
            ipc(
                &mut service,
                "scene.apply",
                json!({"expectedProjectRevision":appended["projectRevision"],"expectedSourceMapRevision":appended["sourceMapRevision"],"command":{"type":"undo"}}),
            );
            assert_eq!(fs::read(root.join(path)).unwrap(), accepted);
            let undone = ipc(&mut service, "scene.list", json!({}));
            assert_eq!(children(&undone), children(&model));
            ipc(
                &mut service,
                "scene.apply",
                json!({"expectedProjectRevision":undone["projectRevision"],"expectedSourceMapRevision":undone["sourceMapRevision"],"command":{"type":"redo"}}),
            );
            service.close().unwrap();
            service.open_path(&root).unwrap();
            assert_eq!(
                children(&ipc(&mut service, "scene.list", json!({}))),
                children(&model)
            );
            assert_eq!(fs::read(root.join(path)).unwrap(), expected);
            service.close().unwrap();
        }
    }

    #[test]
    fn source_foundation_unknown_condition_or_body_stays_opaque() {
        use crate::lifecycle::acceptance::ipc;
        for (condition, body) in [
            ("flag and True", "bec \"True\""),
            ("missing", "bec \"True\""),
            ("flag", "$ unknown = 1"),
            ("flag", "if flag:\n            bec \"nested\""),
        ] {
            let temporary = tempfile::tempdir().unwrap();
            let (mut service, _) = foundation(&temporary);
            let model = ipc(&mut service, "scene.list", json!({}));
            let scene = &model["scenes"][0];
            let source = format!("label {}:\n    if {condition}:\n        {body}\n    else:\n        bec \"False\"\n    return\n", scene["technicalLabel"].as_str().unwrap());
            let opened = ipc(
                &mut service,
                "source.open",
                json!({"path":scene["sourcePath"]}),
            );
            let draft = ipc(
                &mut service,
                "source.updateDraft",
                json!({"path":scene["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
            );
            ipc(
                &mut service,
                "source.save",
                json!({"path":scene["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
            );
            let result = service.scene_workspace().unwrap();
            assert!(result.scenes[0]
                .beats
                .iter()
                .all(|b| b.owner.is_none() && b.conditional_branch.is_none()));
            assert!(result.scenes[0].partial);
            service.close().unwrap();
        }
    }

    #[test]
    fn source_foundation_quoted_token_corpus_preserves_every_neighbor() {
        use crate::lifecycle::acceptance::ipc;
        let temporary = tempfile::tempdir().unwrap();
        let (mut service, root) = foundation(&temporary);
        for text in [
            "quote \" and slash \\",
            "hash # is dialogue",
            "line one\nline two",
            "雪 café 👋",
            "",
        ] {
            let before = ipc(&mut service, "scene.list", json!({}));
            let path = before["scenes"][0]["sourcePath"].as_str().unwrap();
            let original = fs::read(root.join(path)).unwrap();
            let child = before["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["owner"].is_object())
                .unwrap();
            let start = child["byteStart"].as_u64().unwrap() as usize;
            let end = child["byteEnd"].as_u64().unwrap() as usize;
            let after = ipc(&mut service, "scene.apply", child_command(&before, text));
            let new_child = after["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["id"] == child["id"])
                .unwrap();
            let new_end = new_child["byteEnd"].as_u64().unwrap() as usize;
            let accepted = fs::read(root.join(path)).unwrap();
            assert_eq!(&accepted[..start], &original[..start]);
            assert_eq!(&accepted[new_end..], &original[end..]);
            assert_eq!(new_child["payload"]["text"], text);
            assert!(std::str::from_utf8(&accepted[start..new_end])
                .unwrap()
                .ends_with(" # keep true suffix\r\n"));
        }
        service.close().unwrap();
    }

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
