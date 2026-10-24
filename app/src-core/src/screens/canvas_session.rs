//! Private helper inputs and revision-bound output. No game source is copied.
use super::{canvas::Plan, *};
use crate::{
    renpy::{runtime::canvas::HelperProcess, ValidatedSdk},
    transaction::DirectoryAnchor,
};
use base64::Engine;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    ffi::OsStr,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    time::{Duration, Instant},
};

pub(crate) struct Session {
    root: PathBuf,
    anchor: Option<DirectoryAnchor>,
    worker: Option<HelperProcess>,
    frame: String,
    revision: String,
    source: String,
    dependencies: Vec<(String, String)>,
    script_files: Vec<String>,
    submitted: Instant,
}
impl Session {
    pub(crate) fn new(data: &Path, sdk: ValidatedSdk) -> Result<Self, SceneError> {
        let root = data.join(format!("canvas-helper-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir(&root).map_err(|_| SceneError::InvariantBlocked)?;
        let anchor = DirectoryAnchor::open_root(&root).map_err(|_| SceneError::InvariantBlocked)?;
        let mut session = Self {
            root,
            anchor: Some(anchor),
            worker: None,
            frame: String::new(),
            revision: String::new(),
            source: String::new(),
            dependencies: vec![],
            script_files: vec![],
            submitted: Instant::now(),
        };
        let game = session
            .anchor()
            .open_child(OsStr::new("game"), true)
            .map_err(|_| SceneError::InvariantBlocked)?;
        game.create_new_file(OsStr::new("renderer.rpy"))
            .and_then(|mut f| {
                f.write_all(include_bytes!("canvas-renderer.rpy"))
                    .map_err(|_| crate::transaction::ErrorCode::IoFailure)
            })
            .map_err(|_| SceneError::InvariantBlocked)?;
        session
            .anchor()
            .create_new_file(OsStr::new("canvas-bootstrap.py"))
            .and_then(|mut f| {
                f.write_all(include_bytes!("../renpy/runtime/canvas-bootstrap.py"))
                    .map_err(|_| crate::transaction::ErrorCode::IoFailure)
            })
            .map_err(|_| SceneError::InvariantBlocked)?;
        session.worker = Some(
            HelperProcess::start(sdk, session.anchor().clone())
                .map_err(|_| SceneError::InvariantBlocked)?,
        );
        Ok(session)
    }
    fn anchor(&self) -> &DirectoryAnchor {
        self.anchor.as_ref().expect("live canvas directory")
    }
    pub(crate) fn submit(
        &mut self,
        mut plan: Plan,
        source: String,
        authoring: &AuthoringService,
        project: &ProjectId,
    ) -> Result<Value, SceneError> {
        let assets = self
            .anchor()
            .open_child(OsStr::new("game"), false)
            .and_then(|game| game.open_child(OsStr::new("assets"), true))
            .map_err(|error| input_error("open asset directory", error))?;
        let mut total = 0;
        let mut dependencies = std::mem::take(&mut plan.dependencies);
        for node in &mut plan.nodes {
            if node.kind == "image" {
                if let Some(name) = &mut node.literal {
                    *name = copy_asset(
                        name,
                        false,
                        &assets,
                        authoring,
                        project,
                        &mut total,
                        &mut dependencies,
                    )?;
                }
            }
            for key in ["font", "text_font"] {
                if let Some(Value::String(name)) = node.properties.get_mut(key) {
                    *name = copy_asset(
                        name,
                        true,
                        &assets,
                        authoring,
                        project,
                        &mut total,
                        &mut dependencies,
                    )?;
                }
            }
        }
        self.frame = uuid::Uuid::new_v4().to_string();
        self.revision = plan.revision.clone();
        self.source = source;
        self.submitted = Instant::now();
        self.dependencies = dependencies;
        self.script_files = std::mem::take(&mut plan.script_files);
        let bytes = serde_json::to_vec(&json!({"frameId":self.frame,"plan":plan}))
            .map_err(|_| SceneError::InvalidPayload)?;
        if bytes.len() > 1024 * 1024 {
            return Err(SceneError::InvalidPayload);
        }
        let name = OsStr::new("request-next.json");
        {
            let mut input = self
                .anchor()
                .create_new_file(name)
                .map_err(|error| input_error("create request", error))?;
            input.write_all(&bytes).map_err(|error| {
                eprintln!(
                    "canvas helper request write failed: kind={:?}, os={:?}",
                    error.kind(),
                    error.raw_os_error()
                );
                SceneError::InvariantBlocked
            })?;
        }
        self.anchor()
            .replace_file_within(name, OsStr::new("request.json"))
            .map_err(|error| input_error("publish request", error))?;
        Ok(json!({"phase":"starting","frameId":self.frame,"revision":self.revision}))
    }
    pub(crate) fn status(
        &self,
        frame: &str,
        include_image: bool,
        authoring: &AuthoringService,
        project: &ProjectId,
    ) -> Result<Value, SceneError> {
        if frame != self.frame {
            return Ok(json!({"phase":"stale","frameId":frame}));
        }
        let current = authoring.screens_inspect(
            project,
            InspectRequest {
                path: self.source.clone(),
            },
        );
        if current.is_err() || current.is_ok_and(|doc| doc.revision != self.revision) {
            return Ok(
                json!({"phase":"stale","frameId":frame,"message":"Source changed. Refresh Source; drafts are retained."}),
            );
        }
        let mut scripts = authoring
            .transactions
            .inventory_files(project, "game")
            .map_err(|_| SceneError::SourceConflict)?;
        scripts.retain(|p| p.ends_with(".rpy") || p.ends_with(".rpyc") || p.ends_with(".rpa"));
        scripts.sort();
        let changed = scripts != self.script_files
            || self.dependencies.iter().any(|(path, expected)| {
                RelativePath::new(path.clone())
                    .ok()
                    .and_then(|p| {
                        authoring
                            .transactions
                            .snapshot_bounded(project, p, 16 * 1024 * 1024)
                            .ok()
                    })
                    .is_none_or(|(_, revision)| revision.sha256 != *expected)
            });
        if changed {
            return Ok(
                json!({"phase":"stale","frameId":frame,"message":"Canvas source or assets changed. Refresh Source; drafts are retained."}),
            );
        }
        if self.worker.as_ref().is_none_or(HelperProcess::failed) {
            return Ok(
                json!({"phase":"unavailable","frameId":frame,"message":"The canvas helper did not return a current frame. Drafts are retained."}),
            );
        }
        let starting = || {
            if self.submitted.elapsed() > Duration::from_secs(15) {
                if let Some(worker) = &self.worker {
                    worker.stop();
                }
                json!({"phase":"unavailable","frameId":frame,"message":"The canvas helper did not return a current frame. Drafts are retained."})
            } else {
                json!({"phase":"starting","frameId":frame,"revision":self.revision})
            }
        };
        let Ok(bytes) = read(self.anchor(), "result.json", 1024 * 1024) else {
            return Ok(starting());
        };
        let Ok(mut result) = serde_json::from_slice::<Value>(&bytes) else {
            return Err(SceneError::InvariantBlocked);
        };
        if result["frameId"] != frame {
            return Ok(starting());
        }
        if result["renderer"] != crate::renpy::runtime::canvas::RENDERER {
            return Err(SceneError::InvariantBlocked);
        }
        if include_image {
            let image = read(self.anchor(), "frame.png", 8 * 1024 * 1024)?;
            if !image.starts_with(b"\x89PNG\r\n\x1a\n") {
                return Err(SceneError::InvariantBlocked);
            }
            result["image"] = json!(format!(
                "data:image/png;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(image)
            ));
        }
        result["revision"] = json!(self.revision);
        result["phase"] = json!("ready");
        Ok(result)
    }
    pub(crate) fn shutdown_report(&self) -> crate::renpy::runtime::canvas::CanvasShutdown {
        self.worker
            .as_ref()
            .map(HelperProcess::shutdown_report)
            .unwrap_or_default()
    }
    pub(crate) fn shutdown(&mut self) -> bool {
        if self.root.as_os_str().is_empty() {
            return true;
        }
        let clean = self.worker.as_mut().is_none_or(|worker| worker.shutdown());
        if !clean
            || self
                .anchor
                .as_ref()
                .is_none_or(|a| a.validate_chain().is_err())
        {
            return false;
        }
        drop(self.anchor.take());
        if fs::remove_dir_all(&self.root).is_err() {
            return false;
        }
        self.root.clear();
        true
    }
}
fn input_error(stage: &str, error: crate::transaction::ErrorCode) -> SceneError {
    eprintln!("canvas helper {stage} failed: {error:?}");
    SceneError::InvariantBlocked
}
fn read(anchor: &DirectoryAnchor, name: &str, maximum: usize) -> Result<Vec<u8>, SceneError> {
    let mut bytes = vec![];
    anchor
        .open_file(OsStr::new(name))
        .map_err(|_| SceneError::InvariantBlocked)?
        .take((maximum + 1) as u64)
        .read_to_end(&mut bytes)
        .map_err(|_| SceneError::InvariantBlocked)?;
    if bytes.len() > maximum {
        return Err(SceneError::InvariantBlocked);
    }
    Ok(bytes)
}
fn copy_asset(
    name: &str,
    font: bool,
    target: &DirectoryAnchor,
    authoring: &AuthoringService,
    project: &ProjectId,
    total: &mut usize,
    dependencies: &mut Vec<(String, String)>,
) -> Result<String, SceneError> {
    let extension = name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
    if !(if font {
        ["ttf", "otf"].contains(&extension.as_str())
    } else {
        ["png", "jpg", "jpeg", "webp"].contains(&extension.as_str())
    }) {
        return Err(SceneError::UnsupportedSource);
    }
    let path = RelativePath::new(format!("game/{name}")).map_err(|_| SceneError::InvalidPayload)?;
    let (bytes, revision) = authoring
        .transactions
        .snapshot_bounded(project, path.clone(), 16 * 1024 * 1024)
        .map_err(|_| SceneError::SourceConflict)?;
    dependencies.push((path.as_str().into(), revision.sha256));
    *total += bytes.len();
    if *total > 64 * 1024 * 1024 {
        return Err(SceneError::InvariantBlocked);
    }
    let name = format!("{:x}.{extension}", Sha256::digest(&bytes));
    if target
        .entry_absent(OsStr::new(&name))
        .map_err(|error| input_error("inspect copied asset", error))?
    {
        target
            .create_new_file(OsStr::new(&name))
            .and_then(|mut f| {
                f.write_all(&bytes)
                    .map_err(|_| crate::transaction::ErrorCode::IoFailure)
            })
            .map_err(|error| input_error("copy asset", error))?;
    }
    Ok(format!("assets/{name}"))
}
impl Drop for Session {
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}
