//! Disposable public Help fixture. JSON lines reach the production dispatch boundary.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService};
use serde_json::{json, Value};
use std::{
    fs,
    io::{self, BufRead, Write},
    path::PathBuf,
};
fn emit(value: Value) {
    println!("{value}");
    io::stdout().flush().unwrap();
}
// Extend the public TTF with a checksummed private padding table. The browser
// decodes a real font while each disposable asset consumes 15 MiB of the cache.
fn cache_font(index: u32) -> Vec<u8> {
    let original =
        include_bytes!("../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf");
    let count = u16::from_be_bytes(original[4..6].try_into().unwrap()) as usize;
    let mut bytes = original.to_vec();
    bytes.splice(12 + count * 16..12 + count * 16, [0; 16]);
    bytes[4..6].copy_from_slice(&((count + 1) as u16).to_be_bytes());
    let power = (count + 1).next_power_of_two() / 2;
    bytes[6..8].copy_from_slice(&((power * 16) as u16).to_be_bytes());
    bytes[8..10].copy_from_slice(&(power.ilog2() as u16).to_be_bytes());
    bytes[10..12].copy_from_slice(&(((count + 1) * 16 - power * 16) as u16).to_be_bytes());
    let mut head = 0;
    for i in 0..count {
        let entry = 12 + i * 16;
        let offset = u32::from_be_bytes(bytes[entry + 8..entry + 12].try_into().unwrap()) + 16;
        bytes[entry + 8..entry + 12].copy_from_slice(&offset.to_be_bytes());
        if &bytes[entry..entry + 4] == b"head" {
            head = offset as usize;
        }
    }
    bytes[head + 8..head + 12].fill(0);
    let offset = bytes.len();
    bytes.resize(15 * 1024 * 1024, 0);
    let end = bytes.len();
    bytes[end - 4..].copy_from_slice(&index.to_be_bytes());
    let entry = 12 + count * 16;
    bytes[entry..entry + 4].copy_from_slice(b"Loom");
    bytes[entry + 4..entry + 8].copy_from_slice(&index.to_be_bytes());
    bytes[entry + 8..entry + 12].copy_from_slice(&(offset as u32).to_be_bytes());
    bytes[entry + 12..entry + 16].copy_from_slice(&((end - offset) as u32).to_be_bytes());
    let mut entries: Vec<_> = bytes[12..12 + (count + 1) * 16]
        .chunks_exact(16)
        .map(|entry| entry.to_vec())
        .collect();
    entries.sort_by(|a, b| a[..4].cmp(&b[..4]));
    for (i, entry) in entries.iter().enumerate() {
        bytes[12 + i * 16..28 + i * 16].copy_from_slice(entry);
    }
    let sum = bytes.chunks_exact(4).fold(0u32, |sum, word| {
        sum.wrapping_add(u32::from_be_bytes(word.try_into().unwrap()))
    });
    bytes[head + 8..head + 12].copy_from_slice(&0xB1B0_AFBAu32.wrapping_sub(sum).to_be_bytes());
    bytes
}
fn main() {
    let preparation = std::time::Instant::now();
    eprintln!("HELP_FIXTURE phase=preparation-start elapsedMs=0");
    let mode = std::env::args().nth(2);
    assert!(mode.as_deref().is_none_or(|mode| matches!(
        mode,
        "canvas-position"
            | "composition-canvas"
            | "ui-image"
            | "ui-image-probe"
            | "project-font"
            | "project-font-probe"
    )));
    let position_probe = mode.as_deref() == Some("canvas-position");
    let composition_canvas = mode.as_deref() == Some("composition-canvas");
    let root = PathBuf::from(std::env::args().nth(1).expect("owned temporary root"));
    assert!(
        root.is_absolute()
            && root
                .file_name()
                .unwrap()
                .to_str()
                .unwrap()
                .starts_with("loomlight-help-controller-")
    );
    assert!(!root.exists());
    let mut service = if composition_canvas {
        LifecycleService::prepare_canvas_screen_probe(
            root.clone(),
            &PathBuf::from(
                std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE")
                    .expect("explicit verified SDK archive"),
            ),
        )
        .unwrap()
    } else if mode.as_deref() == Some("ui-image-probe") {
        LifecycleService::prepare_ui_image_probe(root.clone()).unwrap()
    } else if mode.as_deref() == Some("project-font-probe") {
        LifecycleService::prepare_project_font_probe(root.clone()).unwrap()
    } else {
        LifecycleService::prepare_source_foundation_probe(root.clone()).unwrap()
    };
    let game = root.join("synthetic-project");
    eprintln!(
        "HELP_FIXTURE phase=service-prepared elapsedMs={}",
        preparation.elapsed().as_millis()
    );
    fs::create_dir_all(game.join("game/ui")).unwrap();
    if !composition_canvas {
        fs::write(
            game.join("game/ui/a_styles.rpy"),
            "style help_label:\n    color \"#ffffff\"\n",
        )
        .unwrap();
    }
    fs::write(game.join("game/ui/z_compare.rpy"), "screen flow_help():\n    frame:\n        xsize 720\n        ysize 360\n        xalign 0.5\n        yalign 0.5\n        text \"Your next stop\"\n").unwrap();
    if !composition_canvas {
        fs::write(
            game.join("game/ui/help.rpy"),
            format!(
                "\u{feff}{}",
                include_str!("../../../tests/fixtures/phase-3b-screens/help.rpy")
                    .replace('\n', "\r\n")
            ),
        )
        .unwrap();
    }
    if position_probe {
        fs::write(
            game.join("game/ui/help.rpy"),
            include_bytes!("../../../tests/fixtures/phase-3b-screens/canvas-help.rpy"),
        )
        .unwrap();
    }
    fs::write(
        game.join("game/help.png"),
        include_bytes!("../../../tests/fixtures/phase-1h/assets/booth.png"),
    )
    .unwrap();
    if mode.as_deref() == Some("ui-image") {
        fs::create_dir_all(game.join("game/images")).unwrap();
        fs::write(
            root.join("station_seal.jpg"),
            include_bytes!("../../../tests/fixtures/phase-3b-screens/ui-image/seal.jpg"),
        )
        .unwrap();
        fs::write(
            root.join("station_seal.png"),
            include_bytes!("../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
        )
        .unwrap();
        fs::write(
            root.join("broken_seal.png"),
            &include_bytes!("../../../tests/fixtures/phase-3b-screens/ui-image/seal.png")[..24],
        )
        .unwrap();
    }
    if mode.as_deref() == Some("project-font") {
        for (name, bytes) in [
            (
                "help.ttf",
                &include_bytes!(
                    "../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf"
                )[..],
            ),
            (
                "help.otf",
                &include_bytes!(
                    "../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.otf"
                )[..],
            ),
            ("broken.ttf", &b"not a font"[..]),
        ] {
            fs::write(root.join(name), bytes).unwrap();
        }
    }
    service.close().unwrap();
    let host = ApplicationHost::new(service);
    eprintln!(
        "HELP_FIXTURE phase=ready elapsedMs={}",
        preparation.elapsed().as_millis()
    );
    emit(json!({"ready":true,"preparationMilliseconds":preparation.elapsed().as_millis()}));
    let mut hold: Option<(std::sync::mpsc::Sender<()>, std::thread::JoinHandle<()>)> = None;
    for line in io::stdin().lock().lines() {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        if request["driver"] == "hold" {
            assert!(hold.is_none());
            let (ready_tx, ready_rx) = std::sync::mpsc::channel();
            let (release_tx, release_rx) = std::sync::mpsc::channel();
            let owner = host.clone();
            let worker = std::thread::spawn(move || {
                owner
                    .with_service(|_| {
                        ready_tx.send(()).unwrap();
                        release_rx.recv().unwrap();
                    })
                    .unwrap()
            });
            ready_rx.recv().unwrap();
            hold = Some((release_tx, worker));
            emit(json!({"held":true}));
            continue;
        }
        if request["driver"] == "release" {
            let (release, worker) = hold.take().unwrap();
            release.send(()).unwrap();
            worker.join().unwrap();
            emit(json!({"released":true}));
            continue;
        }
        if request["driver"] == "snapshot" {
            let path = fixture_source_path(&request);
            emit(json!({"source": fs::read(game.join(path)).unwrap()}));
            continue;
        }
        if request["driver"] == "externalAppend" {
            use std::io::Write;
            let path = fixture_source_path(&request);
            fs::OpenOptions::new()
                .append(true)
                .open(game.join(path))
                .unwrap()
                .write_all(b"# ordinary external writer\r\n")
                .unwrap();
            emit(json!({"changed":true}));
            continue;
        }
        if request["driver"] == "chooseFont" {
            assert_eq!(mode.as_deref(), Some("project-font"));
            let cache_name;
            let name = if let Some(index) = request["cacheIndex"].as_u64() {
                assert!(index < 5);
                cache_name = format!("cache_{index}.ttf");
                fs::write(root.join(&cache_name), cache_font(index as u32)).unwrap();
                &cache_name
            } else if request["broken"] == true {
                "broken.ttf"
            } else if request["alternate"] == true {
                "help.otf"
            } else {
                "help.ttf"
            };
            let choice = host
                .with_service(|service| service.authoring_select_import(&root.join(name)))
                .unwrap()
                .unwrap();
            emit(serde_json::to_value(choice).unwrap());
            continue;
        }
        if request["driver"] == "fontFile" {
            assert_eq!(mode.as_deref(), Some("project-font"));
            let file = game.join("game/fonts/help.ttf");
            match request["state"].as_str().unwrap() {
                "missing" => fs::remove_file(file).unwrap(),
                "changed" => fs::write(file, b"not a font").unwrap(),
                "restore" => fs::write(
                    file,
                    include_bytes!(
                        "../../../tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf"
                    ),
                )
                .unwrap(),
                _ => panic!("unknown font fixture state"),
            }
            emit(json!({"changed":true}));
            continue;
        }
        if request["driver"] == "chooseImage" {
            assert_eq!(mode.as_deref(), Some("ui-image"));
            let choice = host
                .with_service(|service| {
                    service.authoring_select_import(&root.join(if request["broken"] == true {
                        "broken_seal.png"
                    } else if request["alternate"] == true {
                        "station_seal.jpg"
                    } else {
                        "station_seal.png"
                    }))
                })
                .unwrap()
                .unwrap();
            emit(serde_json::to_value(choice).unwrap());
            continue;
        }
        if request["driver"] == "imageFile" {
            assert_eq!(mode.as_deref(), Some("ui-image"));
            let image = game.join("game/images/ui station_seal.png");
            match request["state"].as_str().unwrap() {
                "changed" => fs::write(
                    &image,
                    include_bytes!(
                        "../../../tests/fixtures/phase-3b-screens/ui-image/replacement.png"
                    ),
                )
                .unwrap(),
                "invalid" => fs::write(&image, b"not an image").unwrap(),
                "missing" => fs::remove_file(&image).unwrap(),
                "restore" => fs::write(
                    &image,
                    include_bytes!("../../../tests/fixtures/phase-3b-screens/ui-image/seal.png"),
                )
                .unwrap(),
                _ => panic!("unknown fixture state"),
            }
            emit(json!({"changed":true}));
            continue;
        }
        let op = request["operation"].as_str().unwrap();
        assert!(matches!(
            op,
            "system.health"
                | "system.version"
                | "preferences.read"
                | "preferences.write"
                | "project.listRecent"
                | "project.openRecent"
                | "project.current"
                | "project.close"
                | "project.status"
                | "project.flush"
                | "scene.list"
                | "scene.apply"
                | "source.list"
                | "source.open"
                | "source.updateDraft"
                | "source.save"
                | "source.discard"
                | "source.saveAll"
                | "source.discardAll"
                | "authoring.list"
                | "asset.import"
                | "asset.previewImport"
                | "asset.reviewUiImage"
                | "asset.presentFont"
                | "asset.previewFont"
                | "media.present"
                | "flow.list"
                | "screens.inspect"
                | "screens.setSize"
                | "screens.setLayout"
                | "screens.list"
                | "screens.create"
                | "screens.compose"
                | "screens.canvasPlan"
                | "screens.canvasRender"
                | "screens.canvasStatus"
                | "screens.setPosition"
        ));
        emit(serde_json::to_value(host.dispatch(request, false)).unwrap());
    }
    assert!(host.shutdown());
    drop(host);
    fs::remove_dir_all(root).unwrap();
}

fn fixture_source_path(request: &Value) -> &str {
    let path = request["path"].as_str().unwrap_or("game/ui/help.rpy");
    assert!(matches!(
        path,
        "game/ui/help.rpy" | "game/ui/travel_notes.rpy"
    ));
    path
}
