use super::{tests::Fixture, *};
use serde_json::json;
use std::fs;

#[test]
fn choice_prompt_is_owned_source_with_exact_removal_history_and_reopen() {
    let mut f = Fixture::new();
    let scene = f.model()["scenes"][0].clone();
    let label = scene["technicalLabel"].as_str().unwrap();
    f.save(&scene, &format!("label {label}:\n    menu:\n        \"Yes\" if flag: # keep guard\n            \"Option dialogue\"\n        \"No\":\n            pass\n    \"Shared\"\n    return\n"));
    let original = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    let w = f.model();
    let menu = &w["scenes"][0]["beats"][0];
    let mut payload = menu["payload"].clone();
    payload["prompt"] = json!({"type":"narration","text":"Choose a route"});
    let updated = f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":w["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload}));
    let accepted = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
    assert_eq!(
        String::from_utf8(accepted.clone()).unwrap(),
        String::from_utf8(original.clone())
            .unwrap()
            .replace("    menu:\n", "    menu:\n        \"Choose a route\"\n")
    );
    let new_menu = &updated["scenes"][0]["beats"][0];
    assert_eq!(new_menu["id"], menu["id"]);
    assert_eq!(new_menu["payload"]["options"], menu["payload"]["options"]);
    assert_eq!(new_menu["payload"]["prompt"], payload["prompt"]);
    assert_eq!(
        updated["scenes"][0]["beats"].as_array().unwrap().len(),
        w["scenes"][0]["beats"].as_array().unwrap().len()
    );
    let before_noop = fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap();
    f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":updated["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload}));
    assert_eq!(fs::read(f.root.join(SOURCE_MAP_PATH)).unwrap(), before_noop);
    payload.as_object_mut().unwrap().remove("prompt");
    let removed = f.command(json!({"type":"updateBodyBeat","sceneId":scene["id"],"expectedSourceRevision":updated["scenes"][0]["sourceRevision"],"beatId":menu["id"],"expectedBody":{"type":"root"},"beat":payload}));
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        original
    );
    assert_eq!(removed["scenes"][0]["beats"], w["scenes"][0]["beats"]);
    f.command(json!({"type":"undo"}));
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        accepted
    );
    f.command(json!({"type":"redo"}));
    assert_eq!(
        fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
        original
    );
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(f.model()["scenes"][0]["beats"], w["scenes"][0]["beats"]);
    f.service.close().unwrap();
}

#[test]
fn choice_prompt_legacy_refinement_preserves_records_and_nested_character_source() {
    for version in [3, 4, 5, 8, 9, 10, 11, 12] {
        let mut f = Fixture::new();
        let w = f.model();
        let scene = &w["scenes"][0];
        let who = w["authoring"]["characters"][0]["technicalName"]
            .as_str()
            .unwrap();
        let source = format!("label {}:\r\n    menu:\r\n        \"Outer prompt\" # caption\r\n        \"Outer\":\r\n            menu:\r\n                {who} \"Inner prompt\" # keep\r\n                \"Inner\":\r\n                    {who} \"Body dialogue\"\r\n    \"Shared\"\r\n    return\r\n", scene["technicalLabel"].as_str().unwrap());
        f.save(scene, &source);
        f.service.close().unwrap();
        let path = f.root.join(scene["sourcePath"].as_str().unwrap());
        let bytes = fs::read(&path).unwrap();
        let project =
            ProjectMetadata::read_bytes(&fs::read(f.root.join(PROJECT_PATH)).unwrap(), None)
                .unwrap();
        let authoring: AuthoringMetadata =
            serde_json::from_slice(&fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap())
                .unwrap();
        let (_, _, parsed) = parse_scene_mode(
            &project.scenes[0],
            &bytes,
            Some((&project, &authoring, &[])),
            version,
        )
        .unwrap();
        let map_path = f.root.join(SOURCE_MAP_PATH);
        let mut map =
            SourceMapMetadata::read_bytes(&fs::read(&map_path).unwrap(), &project.project_id)
                .unwrap();
        map.schema_version = version;
        map.extra.insert("futureMap".into(), json!(17));
        map.scene_mappings[0].beats = parsed
            .iter()
            .map(|p| crate::metadata::BeatSourceMapping {
                id: uuid::Uuid::new_v4().to_string(),
                kind: p.payload.kind().into(),
                byte_start: p.start as u64,
                byte_end: p.end as u64,
                source_sha256: sha256(&bytes[p.start..p.end]),
                owner: None,
                conditional_branch: None,
                screen_target: None,
                extra: Map::from_iter([("futureRow".into(), json!(p.start))]),
            })
            .collect();
        let old = map.scene_mappings[0].beats.clone();
        fs::write(&map_path, source_map_bytes(&map).unwrap()).unwrap();
        f.service
            .open_path(&f.root)
            .unwrap_or_else(|e| panic!("v{version}: {e:?}"));
        let now = f.model();
        let beats = now["scenes"][0]["beats"].as_array().unwrap();
        let menus: Vec<_> = beats
            .iter()
            .filter(|b| b["payload"]["type"] == "choice")
            .collect();
        assert_eq!(menus.len(), 2, "schema {version}");
        assert_eq!(
            menus[0]["payload"]["prompt"],
            json!({"type":"narration","text":"Outer prompt"})
        );
        assert_eq!(
            menus[1]["payload"]["prompt"],
            json!({"type":"dialogue","characterId":w["authoring"]["characters"][0]["id"],"text":"Inner prompt"})
        );
        assert!(menus[1]["owner"].is_object());
        assert_eq!(
            beats
                .iter()
                .filter(|b| b["payload"]["type"] == "dialogue")
                .count(),
            1
        );
        let new_map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        assert_eq!(new_map["schemaVersion"], 13);
        assert_eq!(new_map["futureMap"], 17);
        let serialized = serde_json::to_string(&new_map).unwrap();
        for row in old {
            assert!(
                serialized.contains(&row.id),
                "lost row {} in v{version}",
                row.id
            );
        }
        assert_eq!(fs::read(&path).unwrap(), bytes);
        let before = fs::read(&map_path).unwrap();
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        f.service.close().unwrap();
        assert_eq!(fs::read(&map_path).unwrap(), before);
    }
}

#[test]
fn nested_prompt_edits_only_its_tokens_and_refuses_invalid_speakers_and_stale_source() {
    let mut f = Fixture::new();
    let w = f.model();
    let scene = &w["scenes"][0];
    let who = w["authoring"]["characters"][0]["technicalName"]
        .as_str()
        .unwrap();
    f.save(scene, &format!("label {}:\r\n    menu:\r\n        \"Outer\":\r\n            menu:\r\n                {who} \"Which?\"   # prompt suffix\r\n                \"Inner\" if flag:\r\n                    {who} \"Body\"\r\n    \"Shared\"\r\n    return\r\n", scene["technicalLabel"].as_str().unwrap()));
    let w = f.model();
    let s = &w["scenes"][0];
    let menu = s["beats"]
        .as_array()
        .unwrap()
        .iter()
        .find(|b| b["payload"]["type"] == "choice" && b["owner"].is_object())
        .unwrap();
    let path = f.root.join(scene["sourcePath"].as_str().unwrap());
    let original = fs::read_to_string(&path).unwrap();
    let command = |payload: Value, revision: Value| json!({"type":"updateBodyBeat","sceneId":s["id"],"expectedSourceRevision":revision,"beatId":menu["id"],"expectedBody":{"type":"branch","groupId":menu["owner"]["groupId"],"branchId":menu["owner"]["branchId"]},"beat":payload});
    let mut payload = menu["payload"].clone();
    payload["prompt"]["text"] = json!("Where? 雪");
    let edited = f.command(command(payload.clone(), s["sourceRevision"].clone()));
    let accepted = original.replace("\"Which?\"", "\"Where? 雪\"");
    assert_eq!(fs::read_to_string(&path).unwrap(), accepted);
    let revision = edited["scenes"][0]["sourceRevision"].clone();
    f.reject(command(payload.clone(), s["sourceRevision"].clone()));
    payload["prompt"]["characterId"] = json!(uuid::Uuid::new_v4().to_string());
    f.reject(command(payload.clone(), revision.clone()));
    payload["prompt"] = json!({"type":"narration","text":"Where? 雪","python":"bad"});
    f.reject(command(payload.clone(), revision.clone()));
    payload["prompt"] = json!({"type":"narration","text":"bad\rtext"});
    f.reject(command(payload.clone(), revision.clone()));
    payload["prompt"] = json!({"type":"narration","text":"Where? 雪"});
    let switched = f.command(command(payload.clone(), revision));
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        accepted.replace(&format!("{who} \"Where? 雪\""), "\"Where? 雪\"")
    );
    payload.as_object_mut().unwrap().remove("prompt");
    let removed = f.command(command(
        payload,
        switched["scenes"][0]["sourceRevision"].clone(),
    ));
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        original.replace(
            &format!("                {who} \"Which?\"   # prompt suffix\r\n"),
            ""
        )
    );
    let ids = |model: &Value| {
        model["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b["id"].clone())
            .collect::<Vec<_>>()
    };
    assert_eq!(ids(&removed), ids(&w));
    assert_eq!(
        removed["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["id"] == menu["id"])
            .unwrap()["payload"]["options"],
        menu["payload"]["options"]
    );
    f.service.close().unwrap();
    f.service.open_path(&f.root).unwrap();
    assert_eq!(ids(&f.model()), ids(&w));
    f.service.close().unwrap();
}

#[test]
fn unsupported_prompt_forms_remain_explicit_source_and_open_is_lossless() {
    for prefix in [
        "unknown_speaker \"Prompt\"",
        "bec \"Prompt\" nointeract",
        "\"First\"\n        \"Second\"",
        "\"Prompt\" (custom_argument)",
    ] {
        let mut f = Fixture::new();
        let s = f.model()["scenes"][0].clone();
        f.save(&s,&format!("label {}:\n    menu:\n        {prefix}\n        \"Option\":\n            pass\n    return\n",s["technicalLabel"].as_str().unwrap()));
        let path = f.root.join(s["sourcePath"].as_str().unwrap());
        let bytes = fs::read(&path).unwrap();
        let w = f.model();
        assert!(!w["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .any(|b| b["payload"]["type"] == "choice"));
        assert!(w["scenes"][0]["partial"].as_bool().unwrap());
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        assert_eq!(fs::read(&path).unwrap(), bytes);
        f.service.close().unwrap();
    }
}
