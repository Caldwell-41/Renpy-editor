use super::{tests::make_openable_project, *};
use serde_json::json;
use std::{
    thread,
    time::{Duration, Instant},
};

const PATH: &str = "game/ui/help.rpy";
const SOURCE: &str =
    "screen help():\n    frame:\n        xsize 640\n        ysize 360\n        text \"Saved\"\n";

// Only the process boundary is substituted. Requests, status, freshness and
// process ownership still run through the production lifecycle.
#[test]
#[ignore = "controlled canvas child, invoked only by lifecycle tests"]
fn controlled_canvas_child() {
    let mode = std::env::var("LOOMLIGHT_CANVAS_TEST_MODE").unwrap();
    let root = std::env::current_dir().unwrap();
    let deadline = Instant::now() + Duration::from_secs(40);
    let mut last_frame = Value::Null;
    loop {
        if root.join("stop").exists() {
            if mode == "timeout" {
                fs::write(root.join("stopping"), b"waiting for test release").unwrap();
                while !root.join("release-stop").exists() {
                    assert!(Instant::now() < deadline, "stop release timed out");
                    thread::sleep(Duration::from_millis(4));
                }
            }
            fs::write(root.join("stopped.json"), br#"{"stopped":true}"#).unwrap();
            #[cfg(windows)]
            fs::write(root.join("desktop-closed.json"), br#"{"closed":true}"#).unwrap();
            return;
        }
        if let Ok(bytes) = fs::read(root.join("request.json")) {
            if let Ok(request) = serde_json::from_slice::<Value>(&bytes) {
                if mode == "exit" {
                    return;
                }
                if mode == "ready" && request["frameId"] != last_frame {
                    let frame = &request["plan"]["nodes"][1];
                    let result = json!({
                        "frameId":request["frameId"],
                        "renderer":crate::renpy::runtime::canvas::RENDERER,
                        "width":request["plan"]["width"],
                        "height":request["plan"]["height"],
                        "geometry":[{"start":frame["start"],"x":0,"y":0,
                            "width":frame["properties"]["xsize"],
                            "height":frame["properties"]["ysize"]}]
                    });
                    fs::write(
                        root.join("result-next.json"),
                        serde_json::to_vec(&result).unwrap(),
                    )
                    .unwrap();
                    fs::rename(root.join("result-next.json"), root.join("result.json")).unwrap();
                    last_frame = request["frameId"].clone();
                }
            }
        }
        assert!(Instant::now() < deadline, "controlled child timed out");
        thread::sleep(Duration::from_millis(4));
    }
}

fn child(mode: &str) -> Command {
    let mut command = Command::new(std::env::current_exe().unwrap());
    command.args([
        "--exact",
        "lifecycle::canvas_tests::controlled_canvas_child",
        "--ignored",
        "--nocapture",
    ]);
    command.env("LOOMLIGHT_CANVAS_TEST_MODE", mode);
    command
}

struct Project {
    service: LifecycleService,
    root: PathBuf,
    profile: PathBuf,
    request: crate::screens::canvas::Request,
    _temporary: tempfile::TempDir,
}

impl Project {
    fn new(modes: &[&str]) -> Self {
        let output = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.tmp/helper-lifecycle");
        fs::create_dir_all(&output).unwrap();
        let temporary = tempfile::tempdir_in(output).unwrap();
        let root = temporary.path().join("project");
        let profile = temporary.path().join("profile");
        make_openable_project(&root, "Canvas recovery");
        fs::create_dir_all(root.join("game/ui")).unwrap();
        fs::write(root.join(PATH), SOURCE).unwrap();
        let mut service = LifecycleService::new(profile.clone()).unwrap();
        service.canvas_test_commands = Some(modes.iter().map(|mode| child(mode)).collect());
        service.open_path(&root).unwrap();
        let doc = service
            .screens_inspect(crate::screens::InspectRequest { path: PATH.into() })
            .unwrap();
        let request = serde_json::from_value(json!({
            "path":PATH,"screenName":"help","expectedRevision":doc.revision,
            "width":1280,"height":720,
            "drafts":[{"nodeStart":doc.screens[0].nodes[1].span.start,"width":760,"height":360}]
        }))
        .unwrap();
        Self {
            service,
            root,
            profile,
            request,
            _temporary: temporary,
        }
    }

    fn render(&mut self) -> String {
        let value = self
            .service
            .screens_canvas_render(self.request.clone())
            .unwrap();
        assert_eq!(value["phase"], "starting", "{value}");
        value["frameId"].as_str().unwrap().into()
    }

    fn wait_phase(&self, frame: &str, phase: &str, limit: Duration) -> Value {
        let deadline = Instant::now() + limit;
        loop {
            let value = self
                .service
                .screens_canvas_status(frame.into(), false)
                .unwrap();
            if value["phase"] == phase {
                return value;
            }
            assert_eq!(value["phase"], "starting", "expected {phase}: {value}");
            assert!(Instant::now() < deadline, "expected {phase}: {value}");
            thread::sleep(Duration::from_millis(8));
        }
    }

    fn helper_root(&self) -> PathBuf {
        let roots = fs::read_dir(&self.profile)
            .unwrap()
            .flatten()
            .map(|entry| entry.path())
            .filter(|path| {
                path.file_name()
                    .unwrap()
                    .to_string_lossy()
                    .starts_with("canvas-helper-")
            })
            .collect::<Vec<_>>();
        assert_eq!(roots.len(), 1, "one owned helper session");
        roots[0].clone()
    }

    fn helper_root_exists(&self) -> bool {
        fs::read_dir(&self.profile).unwrap().flatten().any(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .starts_with("canvas-helper-")
        })
    }
}

#[test]
fn canvas_render_joins_a_timed_out_helper_before_replacement() {
    let mut project = Project::new(&["timeout", "ready"]);
    let timed_out = project.render();
    let old_root = project.helper_root();
    // Exercise the real fifteen-second deadline, then hold the process at its
    // stop boundary so the next request arrives before the worker has exited.
    project.wait_phase(&timed_out, "unavailable", Duration::from_secs(18));
    let deadline = Instant::now() + Duration::from_secs(1);
    while !old_root.join("stopping").exists() {
        assert!(
            Instant::now() < deadline,
            "child must observe the stop request"
        );
        thread::sleep(Duration::from_millis(4));
    }
    let release_root = old_root.clone();
    let release = thread::spawn(move || {
        thread::sleep(Duration::from_millis(100));
        fs::write(release_root.join("release-stop"), b"release").unwrap();
    });
    let replacement = project.render();
    let old_removed = !old_root.exists();
    release.join().unwrap();
    assert!(
        old_removed,
        "render must join and remove the stopping session before replacement"
    );
    let report = project.service.canvas_shutdown_report().unwrap();
    assert!(report.cleanup_complete && report.cooperative, "{report:?}");
    assert_eq!(report.exit_code, Some(0));
    let ready = project.wait_phase(&replacement, "ready", Duration::from_secs(5));
    assert_eq!(ready["geometry"][0]["width"], 760);
    assert_eq!(
        project
            .service
            .screens_canvas_status(timed_out, false)
            .unwrap()["phase"],
        "stale"
    );
    assert_eq!(fs::read_to_string(project.root.join(PATH)).unwrap(), SOURCE);
    project.service.close().unwrap();
    assert!(!project.helper_root_exists());
}

#[test]
fn canvas_render_recovers_after_helper_exit_without_losing_drafts() {
    let mut project = Project::new(&["exit", "ready"]);
    let source_draft = SOURCE.replace("Saved", "Unsaved Source");
    let draft = project
        .service
        .source_update_draft(SourceDraftRequest {
            path: PATH.into(),
            expected_base_revision: project.request.expected_revision.clone(),
            text: source_draft.clone(),
            selection_start: 0,
            selection_end: 0,
        })
        .unwrap();
    let failed = project.render();
    project.wait_phase(&failed, "unavailable", Duration::from_secs(5));
    let old_root = project.helper_root();

    let replacement = project.render();
    let ready = project.wait_phase(&replacement, "ready", Duration::from_secs(5));
    assert_ne!(replacement, failed);
    assert_eq!(ready["revision"], project.request.expected_revision);
    assert_eq!(ready["geometry"][0]["width"], 760);
    assert_eq!(ready["geometry"][0]["height"], 360);
    assert_eq!(
        project
            .service
            .screens_canvas_status(failed, false)
            .unwrap()["phase"],
        "stale"
    );
    assert!(
        !old_root.exists(),
        "old process must be joined and its session removed"
    );
    assert_ne!(project.helper_root(), old_root);
    let report = project.service.canvas_shutdown_report().unwrap();
    assert!(report.cleanup_complete);
    assert_eq!(report.exit_code, Some(0));
    let retained = project
        .service
        .source_open(serde_json::from_value(json!({"path":PATH})).unwrap())
        .unwrap();
    assert_eq!(retained.text, Some(source_draft));
    assert_eq!(retained.draft_version, draft.draft_version);
    assert_eq!(fs::read_to_string(project.root.join(PATH)).unwrap(), SOURCE);
    project
        .service
        .source_discard(SourcePathRequest { path: PATH.into() })
        .unwrap();
    project.service.close().unwrap();
    assert!(!project.helper_root_exists());
}

#[test]
#[cfg(unix)] // Windows directory anchors refuse this rename while they are held.
fn canvas_recovery_retains_ownership_when_session_cleanup_is_refused() {
    let mut project = Project::new(&["exit", "ready"]);
    let failed = project.render();
    project.wait_phase(&failed, "unavailable", Duration::from_secs(5));
    let old_root = project.helper_root();
    let moved = project.profile.join("moved-session");
    // An ordinary external rename invalidates the session's directory binding.
    // Recovery must retain ownership instead of abandoning that directory.
    fs::rename(&old_root, &moved).unwrap();
    let retry = project
        .service
        .screens_canvas_render(project.request.clone());
    assert!(matches!(retry, Err(LifecycleError::Io)), "{retry:?}");
    assert!(
        !project.helper_root_exists(),
        "cleanup refusal must not start a new session"
    );
    assert!(moved.exists());
    let unavailable = project
        .service
        .screens_canvas_status(failed.clone(), false)
        .unwrap();
    assert_eq!(unavailable["phase"], "unavailable");
    assert_eq!(unavailable["frameId"], failed);

    fs::rename(&moved, &old_root).unwrap();
    let replacement = project.render();
    project.wait_phase(&replacement, "ready", Duration::from_secs(5));
    assert!(!old_root.exists());
    let live_root = project.helper_root();
    let mut stale = project.request.clone();
    stale.expected_revision = "stale".into();
    assert!(matches!(
        project.service.screens_canvas_render(stale),
        Err(LifecycleError::Scene(SceneError::SourceConflict))
    ));
    assert_eq!(
        project
            .service
            .screens_canvas_status(replacement.clone(), false)
            .unwrap()["phase"],
        "ready"
    );
    project.request.drafts[0].width = 800;
    let newer = project.render();
    let ready = project.wait_phase(&newer, "ready", Duration::from_secs(5));
    assert_eq!(ready["geometry"][0]["width"], 800);
    assert_eq!(
        project.helper_root(),
        live_root,
        "healthy helper must be reused"
    );
    assert_eq!(
        project
            .service
            .screens_canvas_status(replacement, false)
            .unwrap()["phase"],
        "stale"
    );
    assert_eq!(fs::read_to_string(project.root.join(PATH)).unwrap(), SOURCE);
    project.service.close().unwrap();
    assert!(!project.helper_root_exists());
}

#[test]
#[ignore = "selected audit-fix real SDK recovery proof; two helper starts"]
fn canvas_sdk_retries_refused_helper_before_project_close() {
    let source = "screen help():\n    fixed:\n        xpos 100\n        ypos 60\n        xsize 800\n        ysize 500\n        frame:\n            xalign 0.5\n            yalign 0.5\n            xsize 640\n            ysize 360\n            text \"Saved\"\n";
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let archive = std::env::var_os("LOOMLIGHT_RUNTIME_SDK_ARCHIVE")
        .expect("verified official SDK archive is required");
    crate::renpy::install_supported_sdk_from_archive(&profile, Path::new(&archive)).unwrap();
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    fs::create_dir_all(root.join("game/ui")).unwrap();
    fs::write(root.join(PATH), source).unwrap();
    service.open_path(&root).unwrap();
    let document = service
        .screens_inspect(crate::screens::InspectRequest { path: PATH.into() })
        .unwrap();
    let frame_start = document.screens[0]
        .nodes
        .iter()
        .find(|node| node.kind == "frame")
        .unwrap()
        .span
        .start;
    let request: crate::screens::canvas::Request = serde_json::from_value(json!({
        "path":PATH,"screenName":"help","expectedRevision":document.revision,
        "width":1280,"height":720,
        "drafts":[{"nodeStart":frame_start,"width":656,"height":376}]
    }))
    .unwrap();
    let source_draft = source.replace("Saved", "Unsaved Source");
    let draft = service
        .source_update_draft(SourceDraftRequest {
            path: PATH.into(),
            expected_base_revision: request.expected_revision.clone(),
            text: source_draft.clone(),
            selection_start: 0,
            selection_end: 0,
        })
        .unwrap();
    let mut project = Project {
        service,
        root,
        profile,
        request,
        _temporary: temporary,
    };
    std::env::set_var(
        "LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT",
        fs::canonicalize(&project.profile).unwrap(),
    );
    let refused = project.render();
    std::env::remove_var("LOOMLIGHT_CANVAS_REFUSAL_TEST_ROOT");
    project.wait_phase(&refused, "unavailable", Duration::from_secs(20));
    let old_root = project.helper_root();
    let refusal: Value =
        serde_json::from_slice(&fs::read(old_root.join("startup-refusal.json")).unwrap()).unwrap();
    assert_eq!(refusal, json!({"refused":true,"stage":"selected-refusal"}));

    let replacement = project.render();
    assert!(!old_root.exists(), "retire the refused helper before retry");
    let refusal_shutdown = project.service.canvas_shutdown_report().unwrap().clone();
    assert!(refusal_shutdown.cleanup_complete && !refusal_shutdown.cooperative);
    assert_eq!(refusal_shutdown.exit_code, Some(72));
    let ready = project.wait_phase(&replacement, "ready", Duration::from_secs(20));
    assert_eq!(ready["revision"], project.request.expected_revision);
    assert_eq!(ready["renderer"], crate::renpy::runtime::canvas::RENDERER);
    assert_eq!(ready["width"], 1280);
    assert_eq!(ready["height"], 720);
    let frame = ready["geometry"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["start"] == project.request.drafts[0].node_start)
        .unwrap();
    assert_eq!(
        ["x", "y", "width", "height"].map(|key| frame[key].as_f64().unwrap()),
        [172.0, 122.0, 656.0, 376.0]
    );
    let rendered = project
        .service
        .screens_canvas_status(replacement.clone(), true)
        .unwrap();
    let image = rendered["image"].as_str().unwrap();
    assert!(image.starts_with("data:image/png;base64,iVBOR"));
    assert_eq!(
        project
            .service
            .screens_canvas_status(refused, false)
            .unwrap()["phase"],
        "stale"
    );
    let retained = project
        .service
        .source_open(serde_json::from_value(json!({"path":PATH})).unwrap())
        .unwrap();
    assert_eq!(retained.text, Some(source_draft));
    assert_eq!(retained.draft_version, draft.draft_version);
    assert_eq!(fs::read_to_string(project.root.join(PATH)).unwrap(), source);
    project
        .service
        .source_discard(SourcePathRequest { path: PATH.into() })
        .unwrap();
    project.service.close().unwrap();
    let shutdown = project.service.canvas_shutdown_report().unwrap();
    assert!(shutdown.cleanup_complete && shutdown.cooperative);
    assert_eq!(shutdown.exit_code, Some(0));
    assert!(!project.helper_root_exists());
    if let Some(output) = std::env::var_os("LOOMLIGHT_AUDIT_HELPER_EVIDENCE") {
        let output = PathBuf::from(output);
        fs::create_dir_all(&output).unwrap();
        fs::write(
            output.join("recovery.json"),
            serde_json::to_vec_pretty(&json!({
                "passed":true,"helperStarts":2,"startupRefusal":refusal,
                "refusalShutdown":refusal_shutdown,"replacementFrame":replacement,
                "x":172,"y":122,"width":656,"height":376,"sourceUnchanged":true,
                "draftRetained":true,"normalShutdown":shutdown,"fixturesRemoved":true
            }))
            .unwrap(),
        )
        .unwrap();
        use base64::Engine;
        fs::write(
            output.join("replacement.png"),
            base64::engine::general_purpose::STANDARD
                .decode(image.strip_prefix("data:image/png;base64,").unwrap())
                .unwrap(),
        )
        .unwrap();
    }
}
