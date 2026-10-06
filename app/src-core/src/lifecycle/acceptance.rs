//! Synthetic Phase 1H authoring, using the same lifecycle/transaction services as IPC.
//! Test-only: neither assets nor SDK test instrumentation enter the desktop binary.
use super::*;
use crate::authoring::AssetKind;
use crate::scene::{
    BeatPayload as Beat, PlacementRef as Place, SceneCommand as Command,
    TransitionRef as Transition,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

pub(crate) const EXPECTED: &str = include_str!("../../../../tests/fixtures/phase-1h/expected.json");
const ASSETS: &[(&str, &[u8])] = &[
    (
        "booth.png",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/booth.png"),
    ),
    (
        "rooftop.png",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/rooftop.png"),
    ),
    (
        "riverside.png",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/riverside.png"),
    ),
    (
        "alex.png",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/alex.png"),
    ),
    (
        "morgan.png",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/morgan.png"),
    ),
    (
        "theme.wav",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/theme.wav"),
    ),
    (
        "bell.wav",
        include_bytes!("../../../../tests/fixtures/phase-1h/assets/bell.wav"),
    ),
];

pub(crate) fn ipc(service: &mut LifecycleService, operation: &str, mut payload: Value) -> Value {
    payload["sessionId"] = json!(service.current().unwrap().session_id);
    let response = super::tests::closeout_ipc(service, operation, payload);
    assert_eq!(response["ok"], true, "{operation}: {response}");
    response["value"].clone()
}

pub(crate) fn apply(service: &LifecycleService, command: Command) -> crate::scene::SceneWorkspace {
    let workspace = service.scene_workspace().unwrap();
    service
        .scene_apply(SceneCommandRequest {
            expected_project_revision: workspace.project_revision,
            expected_source_map_revision: workspace.source_map_revision,
            command,
        })
        .unwrap()
}

fn insert(service: &LifecycleService, id: &str, beat: Beat) {
    let scene = service
        .scene_workspace()
        .unwrap()
        .scenes
        .into_iter()
        .find(|s| s.id == id)
        .unwrap();
    apply(
        service,
        Command::InsertBeat {
            scene_id: id.into(),
            expected_source_revision: scene.source_revision,
            before_beat_id: None,
            beat,
        },
    );
}

pub(crate) fn create_authored_game(data: &Path, parent: &Path, sdk: &Path) -> LifecycleService {
    let mut service = LifecycleService::new(data.into()).unwrap();
    let parent = service.register_parent(parent).unwrap();
    let sdk = service.register_sdk(sdk, "phase1h-verified").unwrap();
    let created = service
        .create_project(CreateProjectRequest {
            parent_id: parent.id,
            title: "Crossroads at Sundown".into(),
            folder_name: "crossroads".into(),
            sdk_id: sdk.id,
            width: 1280,
            height: 720,
            initialize_git: false,
        })
        .unwrap();
    assert_eq!(created.status, "complete");
    let entry = service.current().unwrap().scene_id;
    apply(
        &service,
        Command::RenameScene {
            scene_id: entry.clone(),
            display_name: "Radio booth".into(),
        },
    );
    let initial = service
        .scene_workspace()
        .unwrap()
        .scenes
        .into_iter()
        .find(|s| s.id == entry)
        .unwrap();
    apply(
        &service,
        Command::RemoveBeat {
            scene_id: entry.clone(),
            expected_source_revision: initial.source_revision,
            beat_id: initial.beats[0].id.clone(),
        },
    );

    for (name, display, color) in [
        ("alex", "Alex Rowan", "#dc8c5a"),
        ("morgan", "Morgan Vale", "#8c64dc"),
    ] {
        ipc(
            &mut service,
            "character.create",
            json!({"technicalName":name,"displayName":display,"dialogueColor":color}),
        );
    }
    for (name, kind, value) in [
        ("heard_news", "bool", json!(false)),
        ("trust", "int", json!("9007199254740993")),
        ("route", "string", json!("unset")),
    ] {
        ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":name,"variableType":kind,"defaultValue":value}),
        );
    }
    let expected: Value = serde_json::from_str(EXPECTED).unwrap();
    fs::create_dir(parent_path(&service).join("original-inputs")).unwrap();
    for (name, bytes) in ASSETS {
        assert_eq!(
            hex::encode(Sha256::digest(bytes)),
            expected["assets"][name]["sha256"].as_str().unwrap()
        );
        let input = parent_path(&service).join("original-inputs").join(name);
        fs::write(&input, bytes).unwrap();
        let selected = service.authoring_select_import(&input).unwrap();
        let stem = name.split('.').next().unwrap();
        let (kind, character, expression) = match stem {
            "alex" => (AssetKind::CharacterAppearance, Some("alex"), Some("happy")),
            "morgan" => (AssetKind::CharacterAppearance, Some("morgan"), Some("calm")),
            "theme" => (AssetKind::Music, None, None),
            "bell" => (AssetKind::Sfx, None, None),
            _ => (AssetKind::Background, None, None),
        };
        let character_id = character.map(|name| {
            service
                .authoring_list()
                .unwrap()
                .characters
                .into_iter()
                .find(|c| c.technical_name == name)
                .unwrap()
                .id
        });
        service
            .authoring_import_asset(ImportAssetRequest {
                authority_id: selected.authority_id,
                kind,
                technical_name: stem.into(),
                display_name: stem.into(),
                character_id,
                expression: expression.map(str::to_string),
            })
            .unwrap();
        assert_eq!(
            fs::read(input).unwrap(),
            *bytes,
            "Import preserves original bytes"
        );
    }
    let model = service.authoring_list().unwrap();
    assert_eq!(
        (
            model.characters.len(),
            model.appearances.len(),
            model.variables.len(),
            model.assets.len()
        ),
        (2, 2, 3, 7)
    );
    let asset = |name: &str| {
        model
            .assets
            .iter()
            .find(|a| a.display_name == name)
            .unwrap()
            .id
            .clone()
    };
    let character = |name: &str| {
        model
            .characters
            .iter()
            .find(|c| c.technical_name == name)
            .unwrap()
            .id
            .clone()
    };
    let appearance = |name: &str| {
        model
            .appearances
            .iter()
            .find(|a| a.character_id == character(name))
            .unwrap()
            .id
            .clone()
    };
    let variable = |name: &str| {
        model
            .variables
            .iter()
            .find(|v| v.technical_name == name)
            .unwrap()
            .id
            .clone()
    };
    for media in &model.assets {
        let bytes = fs::read(parent_path(&service).join(&media.relative_path)).unwrap();
        assert_eq!(hex::encode(Sha256::digest(&bytes)), media.sha256);
        let purpose = if matches!(media.kind, AssetKind::Music | AssetKind::Sfx) {
            crate::media::MediaPurpose::AudioAudition
        } else {
            crate::media::MediaPurpose::ImagePreview
        };
        assert_eq!(
            service
                .media_present(MediaRequest {
                    asset_id: media.id.clone(),
                    purpose
                })
                .unwrap()
                .sha256,
            media.sha256
        );
    }
    let workspace = apply(
        &service,
        Command::CreateChapter {
            display_name: "After the shift".into(),
        },
    );
    let chapter = workspace.chapters[1].id.clone();
    let mut scenes = BTreeMap::new();
    for name in ["Rooftop", "Riverside", "Station platform", "Disposable"] {
        let workspace = apply(
            &service,
            Command::CreateScene {
                chapter_id: chapter.clone(),
                display_name: name.into(),
            },
        );
        scenes.insert(
            name,
            workspace
                .scenes
                .into_iter()
                .find(|s| s.display_name == name)
                .unwrap()
                .id,
        );
    }
    for beat in [
        Beat::Background {
            asset_id: asset("booth"),
            transition: Transition::Dissolve,
        },
        Beat::ShowCharacter {
            character_id: character("alex"),
            appearance_id: appearance("alex"),
            placement: Place::Left,
            transition: Transition::None,
        },
        Beat::ShowCharacter {
            character_id: character("morgan"),
            appearance_id: appearance("morgan"),
            placement: Place::Right,
            transition: Transition::Fade,
        },
        Beat::Placement {
            character_id: character("alex"),
            placement: Place::Centre,
        },
        Beat::PlayMusic {
            asset_id: asset("theme"),
        },
        Beat::PlaySfx {
            asset_id: asset("bell"),
        },
        Beat::Dialogue {
            character_id: character("alex"),
            text: "The shift is over. Where shall we go?".into(),
        },
        Beat::Narration {
            text: "Choose a road at sundown.".into(),
        },
        Beat::Choice {
            options: vec![
                crate::scene::ChoiceOption {
                    text: "Rooftop".into(),
                    destination_scene_id: scenes["Rooftop"].clone(),
                },
                crate::scene::ChoiceOption {
                    text: "Riverside".into(),
                    destination_scene_id: scenes["Riverside"].clone(),
                },
            ],
        },
    ] {
        insert(&service, &entry, beat);
    }
    for (name, who, placement) in [
        ("Rooftop", "alex", Place::Right),
        ("Riverside", "morgan", Place::Left),
    ] {
        let route = name.to_lowercase();
        let outcome = &expected["routes"][&route];
        for beat in [
            Beat::Background {
                asset_id: asset(&route),
                transition: Transition::Fade,
            },
            Beat::ShowCharacter {
                character_id: character(who),
                appearance_id: appearance(who),
                placement,
                transition: Transition::Dissolve,
            },
            Beat::ChangeAppearance {
                character_id: character(who),
                appearance_id: appearance(who),
                transition: Transition::None,
            },
            Beat::SetVariable {
                variable_id: variable("heard_news"),
                value: outcome["heard_news"].clone(),
            },
            Beat::SetVariable {
                variable_id: variable("trust"),
                value: outcome["trust"].clone(),
            },
            Beat::SetVariable {
                variable_id: variable("route"),
                value: outcome["route"].clone(),
            },
            Beat::Dialogue {
                character_id: character(who),
                text: outcome["dialogue"].as_str().unwrap().into(),
            },
            Beat::StopMusic,
            Beat::HideCharacter {
                character_id: character(who),
                transition: Transition::Fade,
            },
            Beat::Jump {
                scene_id: scenes["Station platform"].clone(),
            },
        ] {
            insert(&service, &scenes[name], beat);
        }
    }
    insert(
        &service,
        &scenes["Station platform"],
        Beat::Narration {
            text: "We meet again at the station.".into(),
        },
    );
    // Source authoring keeps exact unsupported neighbouring content through reopen.
    let path = "game/definitions/transforms.rpy";
    let opened = ipc(&mut service, "source.open", json!({"path":path}));
    let source = format!("{}\n# 雪: opaque fixture code is data until explicit execution.\ninit python:\n    fixture_custom = {{'kept': 'exact'}}\n", opened["text"].as_str().unwrap());
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
    let entry_source = service
        .scene_workspace()
        .unwrap()
        .scenes
        .into_iter()
        .find(|s| s.id == entry)
        .unwrap();
    let bytes = fs::read(parent_path(&service).join(&entry_source.source_path)).unwrap();
    let movable = entry_source
        .beats
        .iter()
        .find(|b| matches!(b.payload, Beat::Narration { .. }))
        .unwrap();
    apply(
        &service,
        Command::MoveBeat {
            scene_id: entry.clone(),
            expected_source_revision: entry_source.source_revision,
            beat_id: movable.id.clone(),
            direction: crate::scene::MoveDirection::Up,
        },
    );
    let changed = fs::read(parent_path(&service).join(&entry_source.source_path)).unwrap();
    assert_ne!(bytes, changed);
    for _ in 0..3 {
        apply(&service, Command::Undo);
        assert_eq!(
            fs::read(parent_path(&service).join(&entry_source.source_path)).unwrap(),
            bytes
        );
        apply(&service, Command::Redo);
        assert_eq!(
            fs::read(parent_path(&service).join(&entry_source.source_path)).unwrap(),
            changed
        );
    }
    apply(&service, Command::Undo);
    // Tree ordering is editorial: the route edges and standard entry remain unchanged.
    apply(
        &service,
        Command::MoveChapter {
            chapter_id: chapter,
            direction: crate::scene::MoveDirection::Up,
        },
    );
    let flow = service.flow_workspace().unwrap();
    assert_eq!(flow.entry_scene_id, entry);
    assert_eq!(flow.edges.iter().filter(|e| e.kind == "choice").count(), 2);
    assert_eq!(flow.edges.iter().filter(|e| e.kind == "jump").count(), 2);
    assert!(!flow.partial && !flow.stale && !flow.over_limit);
    let before = service.scene_workspace().unwrap();
    let root = parent_path(&service);
    // Manifest expectations are fixed independently of the authoring renderer.
    // Only generated technical labels are substituted with their logical names.
    for scene in &before.scenes {
        let mut actual = fs::read_to_string(root.join(&scene.source_path)).unwrap();
        for target in &before.scenes {
            actual = actual.replace(
                &target.technical_label,
                &format!("${{{}}}", target.display_name),
            );
        }
        assert_eq!(
            actual,
            expected["sceneSources"][&scene.display_name]
                .as_str()
                .unwrap(),
            "golden authored source: {}",
            scene.display_name
        );
    }
    assert!(
        fs::read_to_string(root.join("game/definitions/variables.rpy"))
            .unwrap()
            .contains("default trust = 9007199254740993")
    );
    let old_session = service.current().unwrap().session_id;
    service.close().unwrap();
    let reopened = service.open_path(&root).unwrap();
    assert_ne!(reopened.session_id, old_session);
    assert_eq!(reopened.scene_id, before.last_open.scene_id);
    assert_eq!(service.authoring_list().unwrap(), model);
    let after = service.scene_workspace().unwrap();
    assert_eq!(before.project_revision, after.project_revision);
    assert_eq!(before.source_map_revision, after.source_map_revision);
    assert_eq!(
        serde_json::to_value(before.scenes).unwrap(),
        serde_json::to_value(&after.scenes).unwrap()
    );
    assert!(!after.can_undo && !after.can_redo);
    assert_eq!(
        fs::read(root.join(entry_source.source_path)).unwrap(),
        bytes
    );
    let actual_sources = after.scenes.iter().map(|scene| {
        let bytes = fs::read(root.join(&scene.source_path)).unwrap();
        (scene.display_name.clone(), json!({"path":scene.source_path,"bytes":bytes.len(),"sha256":hex::encode(Sha256::digest(&bytes)),"revision":scene.source_revision,"label":scene.technical_label}))
    }).collect::<BTreeMap<_,_>>();
    println!(
        "phase-1h-authored-manifest: {}",
        json!({"expectedManifestSha256":hex::encode(Sha256::digest(EXPECTED.as_bytes())),"sceneSources":actual_sources,"assets":model.assets,"variables":model.variables,"projectRevision":after.project_revision,"sourceMapRevision":after.source_map_revision})
    );
    service
}

pub(crate) fn parent_path(service: &LifecycleService) -> PathBuf {
    service.current.as_ref().unwrap().0.clone()
}

#[test]
fn phase1h_expected_assets_are_exact_original_inputs() {
    let expected: Value = serde_json::from_str(EXPECTED).unwrap();
    assert_eq!(expected["assets"].as_object().unwrap().len(), ASSETS.len());
    for (name, bytes) in ASSETS {
        assert_eq!(
            hex::encode(Sha256::digest(bytes)),
            expected["assets"][name]["sha256"].as_str().unwrap()
        );
        assert_eq!(
            bytes.len() as u64,
            expected["assets"][name]["bytes"].as_u64().unwrap()
        );
    }
    assert_eq!(expected["precisionInteger"], "9223372036854775807");
}

#[test]
fn phase1h_authoring_continues_after_4097_terminal_journals_and_reopens() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("synthetic-project");
    super::tests::make_openable_project(&root, "Long accepted history");
    crate::transaction::seed_terminal_journals_for_acceptance(&root, 4097);
    let mut service = LifecycleService::new(temp.path().join("profile")).unwrap();
    service.open_path(&root).unwrap();
    let metadata = ipc(
        &mut service,
        "character.create",
        json!({"technicalName":"after_boundary","displayName":"After boundary","dialogueColor":"#aabbcc"}),
    );
    assert_eq!(metadata["characters"][0]["technicalName"], "after_boundary");
    let accepted = fs::read(root.join("game/definitions/characters.rpy")).unwrap();
    assert!(String::from_utf8_lossy(&accepted).contains("define after_boundary = Character"));
    assert!(service.scene_recovery().unwrap().items.len() > 4097);
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert_eq!(
        service.authoring_list().unwrap().characters[0].technical_name,
        "after_boundary"
    );
    assert_eq!(
        fs::read(root.join("game/definitions/characters.rpy")).unwrap(),
        accepted
    );
    let workspace = apply(
        &service,
        Command::CreateChapter {
            display_name: "Continue authoring".into(),
        },
    );
    assert!(workspace
        .chapters
        .iter()
        .any(|c| c.display_name == "Continue authoring"));
    service.close().unwrap();
    service.open_path(&root).unwrap();
    assert!(service
        .scene_workspace()
        .unwrap()
        .chapters
        .iter()
        .any(|c| c.display_name == "Continue authoring"));
}
