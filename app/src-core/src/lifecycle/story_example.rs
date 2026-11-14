//! The public Story example project (tests/fixtures/story-example/README.md).
//! Built through the ordinary IPC handlers the renderer uses; nothing executes.
//! The routine example test, the Story release journey and the Phase 3A SDK gate all
//! build it here. Change the project here and in its scene files, never in a caller
//! (docs/TESTING.md).
use super::*;
use serde_json::{json, Value};

/// Each scene, in creation order, with its source file. `${Name}` stands for that
/// scene's label.
const SCENES: &[(&str, &str)] = &[
    (
        "Platform",
        include_str!("../../../../tests/fixtures/story-example/scenes/platform.rpy"),
    ),
    (
        "Called scene",
        include_str!("../../../../tests/fixtures/story-example/scenes/called-scene.rpy"),
    ),
    (
        "Nested called scene",
        include_str!("../../../../tests/fixtures/story-example/scenes/nested-called-scene.rpy"),
    ),
    (
        "High ending",
        include_str!("../../../../tests/fixtures/story-example/scenes/high-ending.rpy"),
    ),
    (
        "Low ending",
        include_str!("../../../../tests/fixtures/story-example/scenes/low-ending.rpy"),
    ),
    (
        "Tram",
        include_str!("../../../../tests/fixtures/story-example/scenes/tram.rpy"),
    ),
    (
        "Choices",
        include_str!("../../../../tests/fixtures/story-example/scenes/choices.rpy"),
    ),
    (
        "Variables",
        include_str!("../../../../tests/fixtures/story-example/scenes/variables.rpy"),
    ),
    (
        "Code",
        include_str!("../../../../tests/fixtures/story-example/scenes/code.rpy"),
    ),
];

/// Art and audio, relative to the repository root: the Design Lab "The Last Tram"
/// art and the Phase 1H synthetic tones. (path, kind, name, character and expression)
const ASSETS: &[(&str, &str, &str, Option<(&str, &str)>)] = &[
    (
        "app/design-lab/screens/story-revamp/art/bg-rainy-platform.webp",
        "background",
        "rainy_platform",
        None,
    ),
    (
        "app/design-lab/screens/story-revamp/art/bg-tram-interior.webp",
        "background",
        "tram_interior",
        None,
    ),
    (
        "app/design-lab/screens/story-revamp/art/mara-neutral.webp",
        "characterAppearance",
        "mara_neutral",
        Some(("mara", "neutral")),
    ),
    (
        "app/design-lab/screens/story-revamp/art/mara-smile.webp",
        "characterAppearance",
        "mara_smile",
        Some(("mara", "smile")),
    ),
    (
        "app/design-lab/screens/story-revamp/art/eli-neutral.webp",
        "characterAppearance",
        "eli_neutral",
        Some(("eli", "neutral")),
    ),
    (
        "tests/fixtures/phase-1h/assets/theme.wav",
        "music",
        "theme",
        None,
    ),
    (
        "tests/fixtures/phase-1h/assets/bell.wav",
        "sfx",
        "bell",
        None,
    ),
];

impl LifecycleService {
    /// The public Story example, built on the source-foundation fixture. `repository`
    /// is the checkout root that holds the shared art and audio.
    pub fn prepare_story_example_probe(data: PathBuf, repository: &Path) -> Result<Self, String> {
        let mut service = Self::prepare_source_foundation_probe(data.clone())?;
        let root = data.join("synthetic-project");
        // A created project has these; the source-foundation fixture starts without them.
        for directory in ["game/images", "game/audio"] {
            fs::create_dir_all(root.join(directory)).map_err(|e| e.to_string())?;
        }
        service.open_path(&root).map_err(|e| format!("{e:?}"))?;
        let mut example = Example {
            service,
            model: None,
        };
        example.author(repository)?;
        example.service.close().map_err(|e| format!("{e:?}"))?;
        Ok(example.service)
    }
}

struct Example {
    service: LifecycleService,
    /// The workspace the last Scene command returned, until another write.
    model: Option<Value>,
}

impl Example {
    fn author(&mut self, repository: &Path) -> Result<(), String> {
        // The source-foundation fixture has the bool `flag` and the character `bec`.
        for (name, kind, value) in [
            ("trust", "int", json!("5")),
            ("mood", "string", json!("ready")),
            ("precision", "int", json!("9007199254740993")),
            ("fare", "decimal", json!(2.5)),
            ("has_pass", "bool", json!(false)),
        ] {
            self.ipc(
                "variable.create",
                json!({"technicalName": name, "variableType": kind, "defaultValue": value}),
            )?;
        }
        for (name, display, color) in [("mara", "Mara", "#d9a066"), ("eli", "Eli", "#7fa7d9")] {
            self.ipc(
                "character.create",
                json!({"technicalName": name, "displayName": display, "dialogueColor": color}),
            )?;
        }
        for (name, kind) in [("ticket_panel", "panel"), ("fare_dialog", "dialog")] {
            let catalog = self.ipc("screens.list", json!({}))?;
            self.ipc("screens.create", json!({"name": name, "kind": kind,
                "expectedProjectRevision": catalog["projectRevision"], "expectedSourceMapRevision": catalog["sourceMapRevision"],
                "expectedInventoryRevision": catalog["inventoryRevision"]}))?;
        }
        // The standard GUI choice screen, which disabled and picked options adapt.
        self.save(
            "game/screens.rpy",
            crate::screens::choice_template::TEMPLATE,
        )?;
        let entry = self.model()?["entrySceneId"].clone();
        self.apply(json!({"type": "renameScene", "sceneId": entry, "displayName": SCENES[0].0}))?;
        let chapter = self.model()?["chapters"][0]["id"].clone();
        for (name, _) in &SCENES[1..] {
            self.apply(json!({"type": "createScene", "chapterId": chapter, "displayName": name}))?;
        }
        let labels = SCENES
            .iter()
            .map(|(name, _)| Ok((*name, self.scene(name)?["technicalLabel"].clone())))
            .collect::<Result<Vec<_>, String>>()?;
        let source = |name: &str| {
            let template = SCENES.iter().find(|(scene, _)| *scene == name).unwrap().1;
            labels
                .iter()
                .fold(template.to_string(), |text, (name, label)| {
                    text.replace(&format!("${{{name}}}"), label.as_str().unwrap())
                })
        };
        // Platform keeps the source-foundation BOM through Source Save.
        for (name, _) in SCENES.iter().filter(|(name, _)| *name != "Tram") {
            let path = self.scene(name)?["sourcePath"].clone();
            self.save(path.as_str().unwrap(), &source(name))?;
        }
        self.author_phase3a()?;
        self.author_choices()?;
        // Imported after the Scene commands, which would hash the art again on each write.
        // Tram names the art, so it is saved after the import: importing an asset that a
        // saved scene already names currently leaves Story unable to read the project.
        for (path, kind, name, appearance) in ASSETS {
            let choice = self
                .service
                .authoring_select_import(&repository.join(path))
                .map_err(|e| format!("story example import {path}: {e:?}"))?;
            let (character, expression) = match appearance {
                Some((character, expression)) => {
                    (self.id("characters", character)?, json!(expression))
                }
                None => (Value::Null, Value::Null),
            };
            self.ipc(
                "asset.import",
                json!({"authorityId": choice.authority_id, "kind": kind, "technicalName": name,
                "displayName": name, "characterId": character, "expression": expression}),
            )?;
        }
        let path = self.scene("Tram")?["sourcePath"].clone();
        self.save(path.as_str().unwrap(), &source("Tram"))
    }

    /// The Story edits the Phase 3A SDK gate plays: the nested dialogue, the outer
    /// If's test, Platform calling B and B calling C, and the Ready route's test.
    fn author_phase3a(&mut self) -> Result<(), String> {
        let deep = self.beat("Platform", |b| b["payload"]["text"] == "Deep original")?;
        self.edit("Platform", json!({"type": "updateBodyBeat", "beatId": deep["id"],
            "expectedBody": {"type": "branch", "groupId": deep["owner"]["groupId"], "branchId": deep["owner"]["branchId"]},
            "beat": {"type": "dialogue", "characterId": deep["payload"]["characterId"], "text": "Edited deep café 雪"}}))?;
        let header = self.beat("Platform", |b| {
            b["owner"].is_null() && b["conditionalBranch"]["ordinal"] == 0
        })?;
        let flag = self.compare(
            "flag",
            "bool",
            "equal",
            json!({"type": "bool", "value": true}),
        )?;
        self.edit("Platform", json!({"type": "updateConditionBranch", "groupId": header["conditionalBranch"]["groupId"],
            "branchId": header["id"], "expectedBody": {"type": "root"}, "condition": {"status": "supported", "expression": flag}}))?;
        for (caller, callee, next) in [
            ("Called scene", "Nested called scene", "B resumed"),
            ("Platform", "Called scene", "Caller resumed"),
        ] {
            let anchor = self.beat(caller, |b| b["payload"]["text"] == next)?;
            let target = self.scene(callee)?["id"].clone();
            self.edit(
                caller,
                json!({"type": "insertBodyBeat", "body": {"type": "root"},
                "position": {"type": "before", "anchor": {"type": "beat", "beatId": anchor["id"]}},
                "beat": {"type": "call", "sceneId": target, "returnLabel": null}}),
            )?;
        }
        let choice = self.beat("Platform", |b| b["payload"]["type"] == "choice")?;
        let mut payload = choice["payload"].clone();
        let trust = self.compare(
            "trust",
            "int",
            "greaterEqual",
            json!({"type": "int", "value": "5"}),
        )?;
        let mood = self.compare(
            "mood",
            "string",
            "equal",
            json!({"type": "string", "value": "ready"}),
        )?;
        payload["options"][0]["condition"] = json!({"status": "supported", "expression": {"type": "and", "left": trust, "right": mood}});
        self.edit("Platform", json!({"type": "updateBodyBeat", "beatId": choice["id"], "expectedBody": {"type": "root"}, "beat": payload}))?;
        Ok(())
    }

    /// Show disabled, Repeat this Choice endings and Picked options.
    fn author_choices(&mut self) -> Result<(), String> {
        let choice = |e: &mut Self, first: &str| {
            e.beat("Choices", |b| {
                b["payload"]["type"] == "choice" && b["payload"]["options"][0]["text"] == first
            })
        };
        let fare = choice(self, "Ask about the route")?;
        let mut payload = fare["payload"].clone();
        payload["options"][2]["unavailablePolicy"] = json!("showDisabled");
        self.edit("Choices", json!({"type": "updateBodyBeat", "beatId": fare["id"], "expectedBody": {"type": "root"}, "beat": payload}))?;
        for (first, option) in [
            ("Ask about the route", 0),
            ("Ask about the route", 1),
            ("Ask about the route", 2),
            ("Wave to Eli", 0),
            ("Wave to Eli", 1),
            ("Wave to Eli", 2),
        ] {
            let id = choice(self, first)?["payload"]["options"][option]["id"].clone();
            let body = self.scene("Choices")?["bodies"]
                .as_array()
                .and_then(|bodies| bodies.iter().find(|b| b["body"]["branchId"] == id))
                .map(|b| b["body"].clone())
                .ok_or("story example option body")?;
            self.edit(
                "Choices",
                json!({"type": "insertBodyBeat", "body": body, "position": {"type": "end"},
                "beat": {"type": "repeatChoice"}}),
            )?;
        }
        for (first, policy) in [
            ("Ask about the route", "markPicked"),
            ("Wave to Eli", "hidePicked"),
        ] {
            let beat = choice(self, first)?;
            let mut payload = beat["payload"].clone();
            payload["pickedPolicy"] = json!(policy);
            self.edit("Choices", json!({"type": "updateBodyBeat", "beatId": beat["id"], "expectedBody": {"type": "root"}, "beat": payload}))?;
        }
        Ok(())
    }

    fn ipc(&mut self, operation: &str, mut payload: Value) -> Result<Value, String> {
        payload["sessionId"] = json!(
            self.service
                .current()
                .ok_or("story example is not open")?
                .session_id
        );
        let response = serde_json::to_value(crate::handle_application_request(
            json!({"protocolVersion": 1, "requestId": uuid::Uuid::new_v4().simple().to_string(),
                "operation": operation, "payload": payload.clone()}),
            false,
            &mut self.service,
        ))
        .map_err(|e| e.to_string())?;
        if response["ok"] != true {
            return Err(format!("story example {operation} {payload}: {response}"));
        }
        if !matches!(operation, "scene.list" | "authoring.list" | "screens.list") {
            self.model = (operation == "scene.apply").then(|| response["value"].clone());
        }
        Ok(response["value"].clone())
    }
    fn model(&mut self) -> Result<Value, String> {
        if self.model.is_none() {
            self.model = Some(self.ipc("scene.list", json!({}))?);
        }
        Ok(self.model.clone().unwrap())
    }
    fn apply(&mut self, command: Value) -> Result<Value, String> {
        let model = self.model()?;
        self.ipc(
            "scene.apply",
            json!({"expectedProjectRevision": model["projectRevision"],
                "expectedSourceMapRevision": model["sourceMapRevision"],
                "expectedAuthoringRevision": model["authoringRevision"], "command": command}),
        )
    }
    /// A command on one scene, at its current source revision.
    fn edit(&mut self, scene: &str, mut command: Value) -> Result<Value, String> {
        let scene = self.scene(scene)?;
        command["sceneId"] = scene["id"].clone();
        command["expectedSourceRevision"] = scene["sourceRevision"].clone();
        self.apply(command)
    }
    fn scene(&mut self, name: &str) -> Result<Value, String> {
        self.model()?["scenes"]
            .as_array()
            .and_then(|s| s.iter().find(|s| s["displayName"] == name))
            .cloned()
            .ok_or_else(|| format!("story example scene {name}"))
    }
    fn beat(&mut self, scene: &str, test: impl Fn(&Value) -> bool) -> Result<Value, String> {
        self.scene(scene)?["beats"]
            .as_array()
            .and_then(|beats| beats.iter().find(|b| test(b)))
            .cloned()
            .ok_or_else(|| format!("story example beat in {scene}"))
    }
    fn id(&mut self, list: &str, technical_name: &str) -> Result<Value, String> {
        self.ipc("authoring.list", json!({}))?[list]
            .as_array()
            .and_then(|items| items.iter().find(|i| i["technicalName"] == technical_name))
            .map(|item| item["id"].clone())
            .ok_or_else(|| format!("story example {list} {technical_name}"))
    }
    fn compare(
        &mut self,
        name: &str,
        kind: &str,
        operator: &str,
        right: Value,
    ) -> Result<Value, String> {
        Ok(json!({"type": "compare", "operator": operator,
            "left": {"type": "variable", "variableId": self.id("variables", name)?, "variableType": kind}, "right": right}))
    }
    fn save(&mut self, path: &str, text: &str) -> Result<(), String> {
        let opened = self.ipc("source.open", json!({"path": path}))?;
        let draft = self.ipc(
            "source.updateDraft",
            json!({"path": path, "expectedBaseRevision": opened["baseRevision"],
            "text": text, "selectionStart": 0, "selectionEnd": 0}),
        )?;
        self.ipc(
            "source.save",
            json!({"path": path, "expectedBaseRevision": draft["baseRevision"],
            "expectedDraftVersion": draft["draftVersion"]}),
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    // The Add a beat kinds (app/src/story-add-beat.ts), then the two kinds Story
    // shows but does not add.
    const KINDS: &[&str] = &[
        "dialogue",
        "narration",
        "background",
        "showCharacter",
        "hideCharacter",
        "changeAppearance",
        "placement",
        "transition",
        "playMusic",
        "stopMusic",
        "playSfx",
        "choice",
        "condition",
        "call",
        "jump",
        "return",
        "setVariable",
        "showScreen",
        "hideScreen",
        "callScreen",
        "repeatChoice",
        "customCode",
    ];

    /// The Phase 3A scenes the SDK gate plays, with their call labels: the Story edits
    /// change only their own lines.
    fn phase3a_sources(model: &Value, root: &Path) -> (String, String) {
        let scene = |name: &str| {
            model["scenes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|s| s["displayName"] == name)
                .unwrap()
        };
        let label = |name: &str| scene(name)["technicalLabel"].as_str().unwrap().to_owned();
        let call = |name: &str| {
            let call = scene(name)["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["payload"]["type"] == "call")
                .unwrap();
            call["payload"]["returnLabel"].as_str().unwrap().to_owned()
        };
        let template = |name: &str| {
            let text = SCENES.iter().find(|(scene, _)| *scene == name).unwrap().1;
            [
                "Platform",
                "Called scene",
                "Nested called scene",
                "High ending",
                "Low ending",
            ]
            .iter()
            .fold(text.to_owned(), |text, name| {
                text.replace(&format!("${{{name}}}"), &label(name))
            })
        };
        let platform = format!("\u{feff}{}", template("Platform"))
            .replacen("    if flag:\n", "    if (flag == True):\n", 1)
            .replacen("bec \"Deep original\"", "bec \"Edited deep café 雪\"", 1)
            .replacen(
                "    \"Caller resumed\"\n",
                &format!(
                    "    call {} from {}\n    \"Caller resumed\"\n",
                    label("Called scene"),
                    call("Platform")
                ),
                1,
            )
            .replacen(
                "\"Ready route\" if trust >= 5:",
                "\"Ready route\" if ((trust >= 5) and (mood == \"ready\")):",
                1,
            );
        let called = template("Called scene").replacen(
            "    \"B resumed\"\n",
            &format!(
                "    call {} from {}\n    \"B resumed\"\n",
                label("Nested called scene"),
                call("Called scene")
            ),
            1,
        );
        let read = |name: &str| {
            fs::read_to_string(root.join(scene(name)["sourcePath"].as_str().unwrap())).unwrap()
        };
        assert_eq!(read("Platform"), platform);
        assert_eq!(read("Called scene"), called);
        assert_ne!(call("Platform"), call("Called scene"));
        (platform, called)
    }

    #[test]
    fn story_example_has_every_beat_kind_choice_state_and_variable_type_and_reopens() {
        let temporary = tempfile::tempdir().unwrap();
        let data = temporary.path().join("profile");
        let repository = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let service =
            LifecycleService::prepare_story_example_probe(data.clone(), &repository).unwrap();
        let root = data.join("synthetic-project");
        let mut example = Example {
            service,
            model: None,
        };
        example.service.open_path(&root).unwrap();
        let model = example.model().unwrap();
        let scenes = model["scenes"].as_array().unwrap();
        assert_eq!(
            scenes
                .iter()
                .map(|s| s["displayName"].as_str().unwrap())
                .collect::<Vec<_>>(),
            SCENES.iter().map(|(name, _)| *name).collect::<Vec<_>>()
        );
        assert!(scenes.iter().all(|s| s["sourceConflict"] == false));
        let in_scene = |name: &str| {
            scenes.iter().find(|s| s["displayName"] == name).unwrap()["beats"]
                .as_array()
                .unwrap()
                .clone()
        };
        let all = scenes
            .iter()
            .flat_map(|s| s["beats"].as_array().unwrap().clone())
            .collect::<Vec<_>>();
        // Every kind is an editable beat. A condition is its If header.
        let mut kinds = BTreeSet::new();
        for beat in &all {
            let kind = beat["payload"]["type"].as_str().unwrap();
            if beat["protected"] == false || kind == "customCode" {
                kinds.insert(kind);
            }
            let branch = &beat["conditionalBranch"];
            if branch.is_object() && branch["choiceOption"].is_null() && branch["ordinal"] == 0 {
                kinds.insert("condition");
            }
        }
        assert_eq!(kinds, KINDS.iter().copied().collect::<BTreeSet<_>>());
        let types = model["authoring"]["variables"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v["variableType"].as_str().unwrap())
            .collect::<BTreeSet<_>>();
        assert_eq!(types, BTreeSet::from(["bool", "decimal", "int", "string"]));
        assert_eq!(
            model["authoring"]["assets"].as_array().unwrap().len(),
            ASSETS.len()
        );

        // Choices: a prompt, a nested Choice, an empty option, Hide and Show disabled
        // options, both Picked settings, and options that continue, jump, return or repeat.
        let choices = in_scene("Choices");
        let menus = choices
            .iter()
            .filter(|b| b["payload"]["type"] == "choice")
            .collect::<Vec<_>>();
        assert!(menus[0]["payload"]["prompt"]["type"] == "dialogue");
        assert!(menus.iter().any(|m| m["owner"].is_object()));
        let options = menus
            .iter()
            .flat_map(|m| m["payload"]["options"].as_array().unwrap().clone())
            .collect::<Vec<_>>();
        let guarded = |policy: Option<&str>| {
            options.iter().any(|o| {
                o["condition"]["status"] == "supported" && o["unavailablePolicy"].as_str() == policy
            })
        };
        assert!(guarded(None) && guarded(Some("showDisabled")));
        let picked = menus
            .iter()
            .filter_map(|m| m["payload"]["pickedPolicy"].as_str())
            .collect::<BTreeSet<_>>();
        assert_eq!(picked, BTreeSet::from(["hidePicked", "markPicked"]));
        // An option body's ending: the type of the beat that ends it, or "continues".
        let ending = |scene: &str, text: &str| {
            let (scene, beats) = (
                scenes.iter().find(|s| s["displayName"] == scene).unwrap(),
                in_scene(scene),
            );
            let id = scene["beats"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|b| b["payload"]["type"] == "choice")
                .flat_map(|m| m["payload"]["options"].as_array().unwrap().clone())
                .find(|o| o["text"] == text)
                .unwrap()["id"]
                .clone();
            let body = scene["bodies"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["body"]["branchId"] == id)
                .unwrap();
            let placeholders = beats
                .iter()
                .filter(|b| b["owner"]["branchId"] == id)
                .all(|b| b["structuralPlaceholder"] == true);
            match body["ending"]["type"].as_str().unwrap() {
                "ends" => beats
                    .iter()
                    .find(|b| b["id"] == body["ending"]["beatId"])
                    .unwrap()["payload"]["type"]
                    .as_str()
                    .unwrap()
                    .to_owned(),
                _ if placeholders => "empty".to_owned(),
                other => other.to_owned(),
            }
        };
        assert_eq!(
            [
                ("Choices", "By the window"),
                ("Choices", "Near the door"),
                ("Choices", "Show your pass"),
                ("Choices", "Get off here"),
                ("Choices", "Ask about the route"),
                ("Code", "Ring the bell"),
            ]
            .map(|(scene, text)| ending(scene, text)),
            [
                "continues",
                "empty",
                "jump",
                "return",
                "repeatChoice",
                "customCode"
            ]
        );

        // Source fallback: Custom Code, a Custom Code option ending, an unknown option
        // test, and the three condition diagnostics.
        let code = in_scene("Code");
        let source = |text: &str| {
            code.iter()
                .find(|b| b["payload"]["source"].as_str().map(str::trim) == Some(text))
                .unwrap_or_else(|| panic!("Code scene keeps {text} as Custom Code"))
        };
        for text in ["$ tram_number = 40", "python:"] {
            assert_eq!(source(text)["protected"], true);
        }
        let diagnostics = code
            .iter()
            .filter_map(|b| b["conditionalBranch"]["condition"]["diagnostic"].as_str())
            .collect::<BTreeSet<_>>();
        assert_eq!(
            diagnostics,
            BTreeSet::from(["missingVariable", "typeMismatch", "unsupportedSyntax"])
        );

        // Phase 3A: the routes, the boundary branch and the nested Call.
        let (platform, called) = phase3a_sources(&model, &root);
        let flow = example.ipc("flow.list", json!({})).unwrap();
        for (caller, next) in [
            ("Platform", "Caller resumed"),
            ("Called scene", "B resumed"),
        ] {
            let beats = in_scene(caller);
            let call = beats
                .iter()
                .find(|b| b["payload"]["type"] == "call")
                .unwrap();
            let next = beats.iter().find(|b| b["payload"]["text"] == next).unwrap();
            let edge = flow["edges"]
                .as_array()
                .unwrap()
                .iter()
                .find(|e| e["beatId"] == call["id"] && e["kind"] == "call")
                .unwrap();
            assert_eq!(edge["continuation"]["beatId"], next["id"]);
        }

        // Reopen keeps every model and source byte, with a fresh history.
        let sources = |root: &Path| {
            let mut out = std::collections::BTreeMap::new();
            let mut stack = vec![root.join("game")];
            while let Some(dir) = stack.pop() {
                for entry in fs::read_dir(dir).unwrap() {
                    let path = entry.unwrap().path();
                    if path.is_dir() {
                        stack.push(path);
                    } else {
                        out.insert(path.clone(), fs::read(&path).unwrap());
                    }
                }
            }
            out
        };
        let before = sources(&root);
        example.service.close().unwrap();
        example.service.open_path(&root).unwrap();
        example.model = None;
        let reopened = example.model().unwrap();
        assert_eq!(reopened["scenes"], model["scenes"]);
        assert_eq!(sources(&root), before);
        assert_eq!(phase3a_sources(&reopened, &root), (platform, called));
        assert_eq!(example.service.history_state().unwrap(), Default::default());
        example.service.close().unwrap();
    }
}
