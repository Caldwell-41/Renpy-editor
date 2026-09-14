from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
lifecycle = ROOT / "app/src-core/src/lifecycle.rs"
platform = ROOT / "app/src-core/src/transaction/platform.rs"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement, found {count}: {old[:400]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


# Add a strict create-new child primitive so private lifecycle staging is created
# descriptor-relative to the already-approved parent and refuses collisions.
needle = '''    pub fn open_child(&self, name: &OsStr, create: bool) -> Result<Self, ErrorCode> {
'''
addition = '''    pub fn create_new_child(&self, name: &OsStr) -> Result<Self, ErrorCode> {
        validate_name(name)?;
        self.validate_chain()?;
        create_directory_at(self.handle(), &self.path().join(name), name)
            .map_err(|error| {
                if error.kind() == io::ErrorKind::AlreadyExists {
                    ErrorCode::UnsafePath
                } else {
                    ErrorCode::IoFailure
                }
            })?;
        self.flush()?;
        let path = self.path().join(name);
        let handle =
            open_directory_at(self.handle(), &path, name).map_err(|_| ErrorCode::UnsafePath)?;
        let metadata = fs::symlink_metadata(&path).map_err(|_| ErrorCode::UnsafePath)?;
        if !metadata.is_dir() || is_link_or_reparse(&metadata) {
            return Err(ErrorCode::UnsafePath);
        }
        let identity = identity_for_file(&handle).map_err(|_| ErrorCode::IoFailure)?;
        let mut chain = self.chain.clone();
        chain.push(DirectoryGuard {
            path,
            identity,
            handle: Arc::new(handle),
        });
        let result = Self { chain };
        result.validate_chain()?;
        Ok(result)
    }

'''
text = platform.read_text(encoding="utf-8")
if text.count(needle) != 1:
    raise SystemExit("DirectoryAnchor open_child insertion point missing")
platform.write_text(text.replace(needle, addition + needle, 1), encoding="utf-8")

replace_once(
    lifecycle,
    '''        let stage_name = format!(".loomlight-stage-{token}");
        let stage = parent.path.join(&stage_name);
        fs::create_dir(&stage).map_err(|_| LifecycleError::Io)?;
        restrict_directory(&stage)?;
        let marker = format!("loomlight-project-stage-v1\\n{token}\\n");
        write_new(&stage.join(STAGE_MARKER), marker.as_bytes())?;
        // Ren'Py's documented generate_gui command accepts a new project when the
        // target is absent, or an existing target whose game directory is present.
        // The private ownership marker makes our target intentionally existing.
        fs::create_dir(stage.join("game")).map_err(|_| LifecycleError::Io)?;
        let mut stage = open_stage_anchor(stage, stage_name, token)?;''',
    '''        let stage_name = format!(".loomlight-stage-{token}");
        let mut stage = create_private_stage(parent, stage_name, token)?;''',
)

# The legacy unanchored creation helper is no longer used.
replace_once(
    lifecycle,
    '''fn write_new(path: &Path, bytes: &[u8]) -> Result<(), LifecycleError> {
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(path)
        .map_err(|_| LifecycleError::Io)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| LifecycleError::Io)
}
''',
    '''''',
)

needle = '''fn open_stage_anchor(
    path: PathBuf,
    name: String,
    token: String,
) -> Result<StageAnchor, LifecycleError> {
'''
addition = '''fn create_private_stage(
    parent: &ParentAnchor,
    name: String,
    token: String,
) -> Result<StageAnchor, LifecycleError> {
    use std::ffi::OsStr;

    validate_parent(parent)?;
    if name != format!(".loomlight-stage-{token}") {
        return Err(LifecycleError::UnsafePath);
    }
    let parent_anchor = crate::transaction::DirectoryAnchor::open_root(&parent.path)
        .map_err(|_| LifecycleError::UnsafePath)?;
    if parent_anchor.identity().volume != parent.identity.a
        || parent_anchor.identity().file != parent.identity.b
    {
        return Err(LifecycleError::UnsafePath);
    }
    let directory = parent_anchor
        .create_new_child(OsStr::new(&name))
        .map_err(|_| LifecycleError::UnsafePath)?;
    let path = directory.path().to_path_buf();
    let file = open_stage_directory(&path).map_err(|_| LifecycleError::UnsafePath)?;
    let identity = identity(&file).map_err(|_| LifecycleError::UnsafePath)?;
    if directory.identity().volume != identity.a || directory.identity().file != identity.b {
        return Err(LifecycleError::UnsafePath);
    }
    restrict_directory_handle(&file)?;
    let stage = StageAnchor {
        path,
        name,
        token,
        file: Some(file),
        identity,
    };

    let marker = format!("loomlight-project-stage-v1\\n{}\\n", stage.token);
    let mut marker_file = directory
        .create_new_file(OsStr::new(STAGE_MARKER))
        .map_err(|_| LifecycleError::UnsafePath)?;
    marker_file
        .write_all(marker.as_bytes())
        .and_then(|_| marker_file.sync_all())
        .map_err(|_| LifecycleError::Io)?;
    // Ren'Py generate_gui accepts an existing target when its game directory exists.
    directory
        .create_new_child(OsStr::new("game"))
        .map_err(|_| LifecycleError::UnsafePath)?;
    directory.flush().map_err(|_| LifecycleError::Io)?;
    validate_stage_identity(&stage)?;
    Ok(stage)
}

#[cfg(unix)]
fn restrict_directory_handle(file: &File) -> Result<(), LifecycleError> {
    use std::os::fd::AsRawFd;
    if unsafe { libc::fchmod(file.as_raw_fd(), 0o700) } == 0 {
        Ok(())
    } else {
        Err(LifecycleError::Io)
    }
}

#[cfg(windows)]
fn restrict_directory_handle(_file: &File) -> Result<(), LifecycleError> {
    Ok(())
}

'''
text = lifecycle.read_text(encoding="utf-8")
if text.count(needle) != 1:
    raise SystemExit("open_stage_anchor insertion point missing")
lifecycle.write_text(text.replace(needle, addition + needle, 1), encoding="utf-8")

# The path-based permission helper remains used for no project-stage path; remove it
# if its only surviving use is the now-deleted create sequence. Git no longer creates
# a template directory, so this is expected to be dead.
text = lifecycle.read_text(encoding="utf-8")
for block in [
'''#[cfg(unix)]
fn restrict_directory(path: &Path) -> Result<(), LifecycleError> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| LifecycleError::Io)
}
#[cfg(windows)]
fn restrict_directory(_path: &Path) -> Result<(), LifecycleError> {
    Ok(())
}
''',
]:
    if text.count(block) == 1:
        text = text.replace(block, "", 1)
lifecycle.write_text(text, encoding="utf-8")

# Regression: a substituted approved-parent pathname must not redirect initial stage
# creation; descriptor-relative creation either stays on the approved object or fails.
needle = '''    #[test]
    fn existing_destination_is_refused_without_touching_data() {'''
addition = '''    #[cfg(unix)]
    #[test]
    fn private_stage_creation_cannot_follow_parent_path_substitution() {
        let temp = tempfile::tempdir().unwrap();
        let requested = temp.path().join("projects");
        fs::create_dir(&requested).unwrap();
        let parent = open_parent(&requested).unwrap();
        let approved = parent.path.clone();
        let moved = temp.path().join("moved-approved-parent");
        fs::rename(&approved, &moved).unwrap();
        fs::create_dir(&approved).unwrap();
        let token = uuid::Uuid::new_v4().to_string();
        let name = format!(".loomlight-stage-{token}");
        assert!(matches!(
            create_private_stage(&parent, name, token),
            Err(LifecycleError::UnsafePath)
        ));
        assert!(fs::read_dir(&approved).unwrap().next().is_none());
    }

'''
text = lifecycle.read_text(encoding="utf-8")
if text.count(needle) != 1:
    raise SystemExit("stage creation regression insertion point missing")
lifecycle.write_text(text.replace(needle, addition + needle, 1), encoding="utf-8")

print("Phase 1C initial stage creation is descriptor-relative")
