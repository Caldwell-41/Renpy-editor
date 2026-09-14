from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
lifecycle = ROOT / "app/src-core/src/lifecycle.rs"
transaction = ROOT / "app/src-core/src/transaction/mod.rs"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement, found {count}: {old[:400]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    transaction,
    "pub(crate) use path::is_link_or_reparse;\n",
    "pub(crate) use path::is_link_or_reparse;\npub(crate) use platform::DirectoryAnchor;\n",
)

replace_once(
    lifecycle,
    '''            let metadata = apply_overlay(\n                &stage.path,\n                &request.title,\n                &request.folder_name,\n                resolution.clone(),\n            )?;''',
    '''            let metadata = apply_overlay(\n                &stage,\n                &request.title,\n                &request.folder_name,\n                resolution.clone(),\n            )?;''',
)

start = lifecycle.read_text(encoding="utf-8")
block_start = start.index("fn apply_overlay(\n")
block_end = start.index("\nfn replace_template_define", block_start)
old_overlay = start[block_start:block_end]
new_overlay = r'''fn build_overlay_model(
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> (ProjectMetadata, SourceMapMetadata, String, String) {
    let project_id = uuid::Uuid::new_v4().to_string();
    let chapter_id = uuid::Uuid::new_v4().to_string();
    let scene_id = uuid::Uuid::new_v4().to_string();
    let technical_label = format!("loomlight_scene_{}", scene_id.replace('-', ""));
    let script = format!("# Loomlight entry point. Runnable source remains authoritative.\n\nlabel start:\n    jump {technical_label}\n");
    let scene_source =
        format!("label {technical_label}:\n    \"Your story begins here.\"\n    return\n");
    let metadata = ProjectMetadata {
        schema_version: PROJECT_SCHEMA_VERSION,
        project_id: project_id.clone(),
        title: title.into(),
        folder_name: folder_name.into(),
        sdk: SdkIdentity {
            adapter: "renpy-8.5.3".into(),
            version: SUPPORTED_VERSION.into(),
            extra: Map::new(),
        },
        resolution,
        capabilities: vec!["project-lifecycle".into()],
        chapters: vec![ChapterMetadata {
            id: chapter_id.clone(),
            display_name: "Chapter 1".into(),
            directory: "game/chapters/chapter_01".into(),
            extra: Map::new(),
        }],
        scenes: vec![SceneMetadata {
            id: scene_id.clone(),
            chapter_id: chapter_id.clone(),
            display_name: "Scene 1".into(),
            technical_label,
            source_path: "game/chapters/chapter_01/scene_001.rpy".into(),
            extra: Map::new(),
        }],
        last_open: Selection {
            chapter_id,
            scene_id,
        },
        extra: Map::new(),
    };
    let source_map = SourceMapMetadata {
        schema_version: SOURCE_MAP_SCHEMA_VERSION,
        project_id,
        sources: vec![
            "game/script.rpy".into(),
            "game/chapters/chapter_01/scene_001.rpy".into(),
        ],
        extra: Map::new(),
    };
    (metadata, source_map, script, scene_source)
}

fn overlay_options(title: &str, folder_name: &str, options_text: &str) -> Result<String, LifecycleError> {
    let safe_title = title
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('[', "[[");
    let options_text = replace_template_define(
        options_text,
        "define config.name =",
        &format!("define config.name = _(\"{safe_title}\")"),
    )?;
    replace_template_define(
        &options_text,
        "define build.name =",
        &format!("define build.name = \"{folder_name}\""),
    )
}

#[cfg(windows)]
fn apply_overlay(
    stage: &StageAnchor,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> Result<ProjectMetadata, LifecycleError> {
    // The Windows StageAnchor omits FILE_SHARE_DELETE, pinning the namespace while
    // these path-based writes are performed.
    let root = &stage.path;
    let game = root.join("game");
    for directory in ["definitions", "chapters/chapter_01", "images", "audio"] {
        fs::create_dir_all(game.join(directory)).map_err(|_| LifecycleError::Io)?;
    }
    fs::create_dir_all(root.join(".renpy-editor/recovery")).map_err(|_| LifecycleError::Io)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: directories");

    let (metadata, source_map, script, scene_source) =
        build_overlay_model(title, folder_name, resolution);
    write_new_or_replace(&game.join("script.rpy"), script.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: script");

    let options = game.join("options.rpy");
    let options_text = fs::read_to_string(&options).map_err(|_| LifecycleError::Io)?;
    let options_text = overlay_options(title, folder_name, &options_text)?;
    write_replace(&options, options_text.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: options");

    write_new(
        &game.join("definitions/characters.rpy"),
        b"# Character definitions are added by Loomlight.\n",
    )?;
    write_new(
        &game.join("definitions/variables.rpy"),
        b"# Variable definitions are added by Loomlight.\n",
    )?;
    write_new(
        &game.join("definitions/transforms.rpy"),
        b"# Transform definitions are added by Loomlight.\n",
    )?;
    write_new(
        &game.join("chapters/chapter_01/scene_001.rpy"),
        scene_source.as_bytes(),
    )?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: source");

    metadata
        .write_for_folder(root, Some(folder_name))
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    source_map
        .write(root)
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: metadata");
    Ok(metadata)
}

#[cfg(unix)]
fn apply_overlay(
    stage: &StageAnchor,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
) -> Result<ProjectMetadata, LifecycleError> {
    apply_overlay_with_hook(stage, title, folder_name, resolution, || Ok(()))
}

#[cfg(unix)]
fn apply_overlay_with_hook<F>(
    stage: &StageAnchor,
    title: &str,
    folder_name: &str,
    resolution: Resolution,
    hook: F,
) -> Result<ProjectMetadata, LifecycleError>
where
    F: FnOnce() -> Result<(), LifecycleError>,
{
    use std::ffi::OsStr;
    use std::io::{Read, Seek, SeekFrom};

    let root = crate::transaction::DirectoryAnchor::open_root(&stage.path)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if root.identity().volume != stage.identity.a || root.identity().file != stage.identity.b {
        return Err(LifecycleError::UnsafePath);
    }
    hook()?;

    let game = root
        .open_child(OsStr::new("game"), false)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let definitions = game
        .open_child(OsStr::new("definitions"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let chapters = game
        .open_child(OsStr::new("chapters"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let chapter = chapters
        .open_child(OsStr::new("chapter_01"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    game.open_child(OsStr::new("images"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    game.open_child(OsStr::new("audio"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    let editor = root
        .open_child(OsStr::new(".renpy-editor"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    editor
        .open_child(OsStr::new("recovery"), true)
        .map_err(|_| LifecycleError::UnsafePath)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: directories");

    let (metadata, source_map, script, scene_source) =
        build_overlay_model(title, folder_name, resolution);
    write_new_or_replace_anchored(&game, "script.rpy", script.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: script");

    let mut options = game
        .open_file_for_flush(OsStr::new("options.rpy"))
        .map_err(|_| LifecycleError::UnsafePath)?;
    let mut options_text = String::new();
    options
        .read_to_string(&mut options_text)
        .map_err(|_| LifecycleError::Io)?;
    let options_text = overlay_options(title, folder_name, &options_text)?;
    options.set_len(0).map_err(|_| LifecycleError::Io)?;
    options
        .seek(SeekFrom::Start(0))
        .and_then(|_| options.write_all(options_text.as_bytes()))
        .and_then(|_| options.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: options");

    write_new_anchored(
        &definitions,
        "characters.rpy",
        b"# Character definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(
        &definitions,
        "variables.rpy",
        b"# Variable definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(
        &definitions,
        "transforms.rpy",
        b"# Transform definitions are added by Loomlight.\n",
    )?;
    write_new_anchored(&chapter, "scene_001.rpy", scene_source.as_bytes())?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: source");

    metadata
        .validate(Some(folder_name))
        .map_err(|_| LifecycleError::InvalidMetadata)?;
    let metadata_bytes =
        serde_json::to_vec_pretty(&metadata).map_err(|_| LifecycleError::InvalidMetadata)?;
    let source_map_bytes =
        serde_json::to_vec_pretty(&source_map).map_err(|_| LifecycleError::InvalidMetadata)?;
    write_new_anchored(&editor, "project.json", &metadata_bytes)?;
    write_new_anchored(&editor, "source-map.json", &source_map_bytes)?;
    editor.flush().map_err(|_| LifecycleError::Io)?;
    root.flush().map_err(|_| LifecycleError::Io)?;
    #[cfg(test)]
    eprintln!("phase-1c-overlay-checkpoint: metadata");
    Ok(metadata)
}

#[cfg(unix)]
fn write_new_anchored(
    directory: &crate::transaction::DirectoryAnchor,
    name: &str,
    bytes: &[u8],
) -> Result<(), LifecycleError> {
    use std::ffi::OsStr;
    let mut file = directory
        .create_new_file(OsStr::new(name))
        .map_err(|_| LifecycleError::UnsafePath)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    directory.flush().map_err(|_| LifecycleError::Io)
}

#[cfg(unix)]
fn write_new_or_replace_anchored(
    directory: &crate::transaction::DirectoryAnchor,
    name: &str,
    bytes: &[u8],
) -> Result<(), LifecycleError> {
    use std::ffi::OsStr;
    use std::io::{Seek, SeekFrom};
    let os_name = OsStr::new(name);
    let mut file = if directory
        .entry_absent(os_name)
        .map_err(|_| LifecycleError::UnsafePath)?
    {
        directory
            .create_new_file(os_name)
            .map_err(|_| LifecycleError::UnsafePath)?
    } else {
        directory
            .open_file_for_flush(os_name)
            .map_err(|_| LifecycleError::UnsafePath)?
    };
    file.set_len(0).map_err(|_| LifecycleError::Io)?;
    file.seek(SeekFrom::Start(0))
        .and_then(|_| file.write_all(bytes))
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    directory.flush().map_err(|_| LifecycleError::Io)
}
'''
if start.count(old_overlay) != 1:
    raise SystemExit("lifecycle: overlay block mismatch")
lifecycle.write_text(start.replace(old_overlay, new_overlay, 1), encoding="utf-8")

# Remove the path-addressed Git template entirely; command-line --template= has
# highest precedence and prevents ambient or attacker-replaced template injection.
text = lifecycle.read_text(encoding="utf-8")
fn_start = text.index("fn initialise_git_with_anchor(\n")
fn_end = text.index("\nfn apply_git_environment", fn_start)
old_git = text[fn_start:fn_end]
new_git = r'''fn initialise_git_with_anchor(
    program: &str,
    stage: &Path,
    stage_anchor: Option<&File>,
) -> Result<(), LifecycleError> {
    let mut command = Command::new(program);
    apply_git_environment(&mut command);
    command
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_COUNT", "0")
        .env("GIT_TERMINAL_PROMPT", "0");
    #[cfg(windows)]
    command.env("GIT_CONFIG_GLOBAL", "NUL");
    #[cfg(not(windows))]
    command.env("GIT_CONFIG_GLOBAL", "/dev/null");
    #[cfg(unix)]
    if let Some(anchor) = stage_anchor {
        use std::os::{fd::AsRawFd, unix::process::CommandExt};
        let fd = anchor.as_raw_fd();
        unsafe {
            command.pre_exec(move || {
                if libc::fchdir(fd) == 0 {
                    Ok(())
                } else {
                    Err(io::Error::last_os_error())
                }
            });
        }
    }
    #[cfg(windows)]
    let _ = stage_anchor;
    let status = command
        .arg("init")
        .arg("--quiet")
        .arg("--template=")
        .current_dir(stage)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    if !status.success() {
        return Err(LifecycleError::GitUnavailable);
    }
    let git_dir = stage.join(".git");
    let metadata = fs::symlink_metadata(&git_dir).map_err(|_| LifecycleError::GitUnavailable)?;
    if !metadata.is_dir() || crate::transaction::is_link_or_reparse(&metadata) {
        return Err(LifecycleError::GitUnavailable);
    }
    let canonical = git_dir
        .canonicalize()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    let stage_root = stage
        .canonicalize()
        .map_err(|_| LifecycleError::GitUnavailable)?;
    if !canonical.starts_with(&stage_root) {
        return Err(LifecycleError::GitUnavailable);
    }
    Ok(())
}
'''
if text.count(old_git) != 1:
    raise SystemExit("lifecycle: anchored git block mismatch")
lifecycle.write_text(text.replace(old_git, new_git, 1), encoding="utf-8")

# Add a deterministic Unix regression: replace the live stage pathname after an
# anchor has been acquired. Descriptor-relative overlay work must fail closed without
# touching the replacement tree.
text = lifecycle.read_text(encoding="utf-8")
needle = '''    #[cfg(windows)]
    #[test]
    fn stage_pin_blocks_substitution_during_privileged_work() {'''
test = r'''    #[cfg(unix)]
    #[test]
    fn overlay_writes_cannot_follow_stage_path_substitution() {
        let temp = tempfile::tempdir().unwrap();
        let requested_parent = temp.path().join("projects");
        fs::create_dir(&requested_parent).unwrap();
        let parent_path = requested_parent.canonicalize().unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        let stage_path = parent_path.join(&name);
        fs::create_dir(&stage_path).unwrap();
        restrict_directory(&stage_path).unwrap();
        fs::write(
            stage_path.join(STAGE_MARKER),
            format!("loomlight-project-stage-v1\n{token}\n"),
        )
        .unwrap();
        fs::create_dir(stage_path.join("game")).unwrap();
        fs::write(
            stage_path.join("game/options.rpy"),
            b"define config.name = _(\"Template\")\ndefine build.name = \"template\"\n",
        )
        .unwrap();
        let stage = open_stage_anchor(stage_path.clone(), name, token).unwrap();
        let moved = parent_path.join("moved-overlay-stage");
        let replacement = stage_path.clone();
        let result = apply_overlay_with_hook(
            &stage,
            "Overlay Race",
            "overlay-race",
            Resolution {
                width: 1280,
                height: 720,
            },
            || {
                fs::rename(&stage_path, &moved).map_err(|_| LifecycleError::Io)?;
                fs::create_dir(&replacement).map_err(|_| LifecycleError::Io)?;
                fs::write(replacement.join("sentinel"), b"replacement")
                    .map_err(|_| LifecycleError::Io)?;
                Ok(())
            },
        );
        assert!(matches!(result, Err(LifecycleError::UnsafePath)));
        assert_eq!(
            fs::read(replacement.join("sentinel")).unwrap(),
            b"replacement"
        );
        assert!(!replacement.join(".renpy-editor").exists());
        assert!(moved.join("game/options.rpy").is_file());
    }

'''
if text.count(needle) != 1:
    raise SystemExit("lifecycle: stage pin test insertion point mismatch")
lifecycle.write_text(text.replace(needle, test + needle, 1), encoding="utf-8")

print("Phase 1C overlay/Git anchoring fixups applied")
