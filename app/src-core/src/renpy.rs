use bzip2::read::BzDecoder;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    ffi::OsString,
    fs::{self, File, OpenOptions},
    io::{self, Read, Write},
    path::{Component, Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering},
        Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};
use tar::Archive;

pub const SUPPORTED_VERSION: &str = "8.5.3";
pub const SDK_ARCHIVE_NAME: &str = "renpy-8.5.3-sdk.tar.bz2";
pub const SDK_URL: &str = "https://www.renpy.org/dl/8.5.3/renpy-8.5.3-sdk.tar.bz2";
pub const SDK_SHA256: &str = "eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45";
const MANAGED_SDK_DIR_NAME: &str = "renpy-8.5.3-sdk-verified-v1";
const MANAGED_PROVENANCE_NAME: &str = "renpy-8.5.3-sdk-verified-v1.provenance";
const OUTPUT_LIMIT: usize = 2_000_000;
const MAX_ARCHIVE_BYTES: u64 = 1024 * 1024 * 1024;

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkInfo {
    pub id: String,
    pub version: String,
    pub display_name: String,
    pub source: String,
    pub compatible: bool,
    pub explanation: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct SdkFileIdentity {
    a: u64,
    b: u64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ValidatedSdk {
    pub root: PathBuf,
    pub version: String,
    identity: SdkFileIdentity,
    launcher_fingerprint: String,
    template_fingerprint: String,
}

impl ValidatedSdk {
    pub(crate) fn same_identity(&self, other: &Self) -> bool {
        self.root == other.root
            && self.identity == other.identity
            && self.launcher_fingerprint == other.launcher_fingerprint
            && self.template_fingerprint == other.template_fingerprint
    }

    pub(crate) fn revalidate(&self, include_template: bool) -> Result<(), RenpyError> {
        let identity = sdk_directory_identity(&self.root)?;
        let launcher = launcher_fingerprint(&self.root)?;
        if identity != self.identity || launcher != self.launcher_fingerprint {
            return Err(RenpyError::InvalidSdk);
        }
        if include_template && template_fingerprint(&self.root)? != self.template_fingerprint {
            return Err(RenpyError::InvalidSdk);
        }
        Ok(())
    }

    #[cfg(test)]
    pub(crate) fn invalid_for_test(root: PathBuf) -> Self {
        Self {
            root,
            version: SUPPORTED_VERSION.into(),
            identity: SdkFileIdentity { a: 0, b: 0 },
            launcher_fingerprint: String::new(),
            template_fingerprint: String::new(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub severity: String,
    pub message: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ProcessResult {
    pub exit_code: Option<i32>,
    pub output: String,
    pub timed_out: bool,
    pub output_limited: bool,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug)]
pub enum RenpyError {
    InvalidSdk,
    UnsupportedVersion(String),
    ProcessFailed,
    TimedOut,
    OutputLimit,
    Download,
    Checksum,
    UnsafeArchive,
    ExistingDestination,
    Io,
}

#[derive(Clone, Copy)]
pub struct ArchiveLimits {
    pub max_members: usize,
    pub max_file_bytes: u64,
    pub max_total_bytes: u64,
    pub max_depth: usize,
}

impl Default for ArchiveLimits {
    fn default() -> Self {
        Self {
            max_members: 100_000,
            max_file_bytes: 512 * 1024 * 1024,
            max_total_bytes: 2 * 1024 * 1024 * 1024,
            max_depth: 32,
        }
    }
}

pub struct RenpyAdapter;

impl RenpyAdapter {
    pub fn validate_sdk(path: &Path) -> Result<ValidatedSdk, RenpyError> {
        let selected = fs::symlink_metadata(path).map_err(|_| RenpyError::InvalidSdk)?;
        if !selected.is_dir() || crate::transaction::is_link_or_reparse(&selected) {
            return Err(RenpyError::InvalidSdk);
        }
        let root = fs::canonicalize(path).map_err(|_| RenpyError::InvalidSdk)?;
        if !root.is_dir() || has_symlink_component(&root) {
            return Err(RenpyError::InvalidSdk);
        }
        let identity = sdk_directory_identity(&root)?;
        let launcher_fingerprint = launcher_fingerprint(&root)?;
        let template_fingerprint = template_fingerprint(&root)?;
        let result = run_bounded(
            &root,
            launcher_args(&root, &[OsString::from("--version")])?,
            Duration::from_secs(30),
        )?;
        if result.timed_out {
            return Err(RenpyError::TimedOut);
        }
        if result.output_limited {
            return Err(RenpyError::OutputLimit);
        }
        if result.exit_code != Some(0) {
            return Err(RenpyError::InvalidSdk);
        }
        let version = parse_version(&result.output).ok_or(RenpyError::InvalidSdk)?;
        if version != SUPPORTED_VERSION {
            return Err(RenpyError::UnsupportedVersion(version));
        }
        let sdk = ValidatedSdk {
            root,
            version,
            identity,
            launcher_fingerprint,
            template_fingerprint,
        };
        sdk.revalidate(true)?;
        Ok(sdk)
    }

    pub fn generate_starter(
        sdk: &ValidatedSdk,
        stage: &Path,
        width: u32,
        height: u32,
    ) -> Result<(), RenpyError> {
        let args = [
            OsString::from("launcher"),
            OsString::from("generate_gui"),
            command_path(stage),
            OsString::from("--width"),
            OsString::from(width.to_string()),
            OsString::from("--height"),
            OsString::from(height.to_string()),
            OsString::from("--template"),
            command_path(&sdk.root.join("gui")),
            OsString::from("--start"),
        ];
        sdk.revalidate(true)?;
        let result = require_success(run_bounded(
            &sdk.root,
            launcher_args(&sdk.root, &args)?,
            Duration::from_secs(180),
        )?);
        sdk.revalidate(true)?;
        result
    }

    pub fn validate_generated(sdk: &ValidatedSdk, stage: &Path) -> Result<(), RenpyError> {
        for command in [
            vec![command_path(stage), OsString::from("compile")],
            vec![
                command_path(stage),
                OsString::from("lint"),
                OsString::from("--error-code"),
            ],
        ] {
            sdk.revalidate(false)?;
            let result = require_success(run_bounded(
                &sdk.root,
                launcher_args(&sdk.root, &command)?,
                Duration::from_secs(180),
            )?);
            sdk.revalidate(false)?;
            result?;
        }
        Ok(())
    }

    pub fn smoke_run(sdk: &ValidatedSdk, project: &Path) -> Result<(), RenpyError> {
        sdk.revalidate(false)?;
        let args = [command_path(project), OsString::from("run")];
        let result = run_bounded(
            &sdk.root,
            launcher_args(&sdk.root, &args)?,
            Duration::from_secs(8),
        )?;
        sdk.revalidate(false)?;
        if result.timed_out && result.diagnostics.is_empty() {
            Ok(())
        } else {
            Err(RenpyError::ProcessFailed)
        }
    }
}

fn require_success(result: ProcessResult) -> Result<(), RenpyError> {
    #[cfg(test)]
    if result.exit_code != Some(0) || result.timed_out || result.output_limited {
        for line in result
            .output
            .lines()
            .rev()
            .take(20)
            .collect::<Vec<_>>()
            .iter()
            .rev()
        {
            eprintln!("renpy-test-diagnostic: {}", redact_line(line));
        }
    }
    if result.timed_out {
        Err(RenpyError::TimedOut)
    } else if result.output_limited {
        Err(RenpyError::OutputLimit)
    } else if result.exit_code != Some(0) {
        Err(RenpyError::ProcessFailed)
    } else {
        Ok(())
    }
}

fn launcher_args(root: &Path, args: &[OsString]) -> Result<Vec<OsString>, RenpyError> {
    #[cfg(windows)]
    {
        let executable = root.join("lib/py3-windows-x86_64/python.exe");
        let script = root.join("renpy.py");
        if !executable.is_file()
            || !script.is_file()
            || has_symlink_component(&executable)
            || has_symlink_component(&script)
        {
            return Err(RenpyError::InvalidSdk);
        }
        let mut value = vec![executable.into_os_string(), script.into_os_string()];
        value.extend_from_slice(args);
        Ok(value)
    }
    #[cfg(not(windows))]
    {
        let executable = root.join("renpy.sh");
        if !executable.is_file() || has_symlink_component(&executable) {
            return Err(RenpyError::InvalidSdk);
        }
        let mut value = vec![executable.into_os_string()];
        value.extend_from_slice(args);
        Ok(value)
    }
}

#[cfg(not(windows))]
fn command_path(path: &Path) -> OsString {
    path.as_os_str().to_owned()
}

#[cfg(windows)]
fn command_path(path: &Path) -> OsString {
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    let wide = path.as_os_str().encode_wide().collect::<Vec<_>>();
    let verbatim = ['\\' as u16, '\\' as u16, '?' as u16, '\\' as u16];
    let unc = ['U' as u16, 'N' as u16, 'C' as u16, '\\' as u16];
    if wide.starts_with(&verbatim) {
        if wide[verbatim.len()..].starts_with(&unc) {
            let mut normal = vec!['\\' as u16, '\\' as u16];
            normal.extend_from_slice(&wide[verbatim.len() + unc.len()..]);
            OsString::from_wide(&normal)
        } else {
            OsString::from_wide(&wide[verbatim.len()..])
        }
    } else {
        path.as_os_str().to_owned()
    }
}

fn parse_version(output: &str) -> Option<String> {
    let marker = "Ren'Py ";
    let start = output.find(marker)? + marker.len();
    let raw: String = output[start..]
        .chars()
        .take_while(|c| c.is_ascii_digit() || *c == '.')
        .collect();
    let value = raw.split('.').take(3).collect::<Vec<_>>().join(".");
    (!value.is_empty()).then_some(value)
}

fn apply_minimal_environment(command: &mut Command) {
    command.env_clear();
    for key in [
        "PATH",
        "HOME",
        "USERPROFILE",
        "APPDATA",
        "LOCALAPPDATA",
        "SYSTEMROOT",
        "WINDIR",
        "COMSPEC",
        "PATHEXT",
        "TMPDIR",
        "TEMP",
        "TMP",
        "LANG",
        "LC_ALL",
        "LC_CTYPE",
    ] {
        if let Some(value) = std::env::var_os(key) {
            command.env(key, value);
        }
    }
}

fn run_bounded(
    cwd: &Path,
    argv: Vec<OsString>,
    timeout: Duration,
) -> Result<ProcessResult, RenpyError> {
    let (program, args) = argv.split_first().ok_or(RenpyError::ProcessFailed)?;
    let mut command = Command::new(program);
    apply_minimal_environment(&mut command);
    command
        .args(args)
        .current_dir(cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // SAFETY: pre_exec calls only async-signal-safe setpgid before exec.
        unsafe {
            command.pre_exec(|| {
                if libc::setpgid(0, 0) == 0 {
                    Ok(())
                } else {
                    Err(io::Error::last_os_error())
                }
            });
        }
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0000_0200); // CREATE_NEW_PROCESS_GROUP
    }
    let mut child = command.spawn().map_err(|_| RenpyError::ProcessFailed)?;
    let stdout = child.stdout.take().ok_or(RenpyError::ProcessFailed)?;
    let stderr = child.stderr.take().ok_or(RenpyError::ProcessFailed)?;
    let captured = Arc::new(Mutex::new(Vec::new()));
    let total = Arc::new(AtomicUsize::new(0));
    let limited = Arc::new(AtomicBool::new(false));
    let readers = [
        stdout_reader(
            stdout,
            Arc::clone(&captured),
            Arc::clone(&total),
            Arc::clone(&limited),
        ),
        stdout_reader(
            stderr,
            Arc::clone(&captured),
            Arc::clone(&total),
            Arc::clone(&limited),
        ),
    ];
    let started = Instant::now();
    let mut timed_out = false;
    let exit = loop {
        if let Some(status) = child.try_wait().map_err(|_| RenpyError::ProcessFailed)? {
            break status.code();
        }
        if started.elapsed() >= timeout || limited.load(Ordering::SeqCst) {
            timed_out = started.elapsed() >= timeout;
            kill_tree(&mut child);
            break child.wait().ok().and_then(|status| status.code());
        }
        thread::sleep(Duration::from_millis(20));
    };
    for reader in readers {
        let _ = reader.join();
    }
    let bytes = captured
        .lock()
        .map_err(|_| RenpyError::ProcessFailed)?
        .clone();
    let output = String::from_utf8_lossy(&bytes).into_owned();
    let diagnostics = output
        .lines()
        .filter(|line| {
            line.contains(".rpy")
                && (line.to_ascii_lowercase().contains("error")
                    || line.to_ascii_lowercase().contains("warning"))
        })
        .take(100)
        .map(|line| Diagnostic {
            severity: if line.to_ascii_lowercase().contains("warning") {
                "warning"
            } else {
                "error"
            }
            .into(),
            message: redact_line(line),
        })
        .collect();
    Ok(ProcessResult {
        exit_code: exit,
        output,
        timed_out,
        output_limited: limited.load(Ordering::SeqCst),
        diagnostics,
    })
}

fn stdout_reader<R: Read + Send + 'static>(
    mut stream: R,
    captured: Arc<Mutex<Vec<u8>>>,
    total: Arc<AtomicUsize>,
    limited: Arc<AtomicBool>,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let mut buffer = [0_u8; 8192];
        while let Ok(count) = stream.read(&mut buffer) {
            if count == 0 {
                break;
            }
            let before = total.fetch_add(count, Ordering::SeqCst);
            if before < OUTPUT_LIMIT {
                let keep = count.min(OUTPUT_LIMIT - before);
                if let Ok(mut value) = captured.lock() {
                    value.extend_from_slice(&buffer[..keep]);
                }
            }
            if before + count > OUTPUT_LIMIT {
                limited.store(true, Ordering::SeqCst);
                break;
            }
        }
    })
}

fn kill_tree(child: &mut Child) {
    #[cfg(unix)]
    unsafe {
        libc::kill(-(child.id() as i32), libc::SIGKILL);
    }
    #[cfg(windows)]
    {
        let mut taskkill = Command::new("taskkill");
        apply_minimal_environment(&mut taskkill);
        let _ = taskkill
            .args(["/PID", &child.id().to_string(), "/T", "/F"])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
    let _ = child.kill();
}

fn redact_line(line: &str) -> String {
    if line.len() > 400 {
        return "Ren'Py reported a diagnostic (detail truncated).".into();
    }
    line.replace('\\', "/")
        .rsplit('/')
        .next()
        .unwrap_or("Ren'Py diagnostic")
        .to_owned()
}

fn managed_sdk_paths(data_root: &Path) -> (PathBuf, PathBuf) {
    let sdk_dir = data_root.join("sdks");
    (
        sdk_dir.join(MANAGED_SDK_DIR_NAME),
        sdk_dir.join(MANAGED_PROVENANCE_NAME),
    )
}

fn managed_provenance(sdk: &ValidatedSdk) -> String {
    format!(
        "loomlight-managed-sdk-v1\nversion={}\narchive-sha256={}\nidentity={}:{}\nlauncher={}\ntemplate={}\n",
        sdk.version,
        SDK_SHA256,
        sdk.identity.a,
        sdk.identity.b,
        sdk.launcher_fingerprint,
        sdk.template_fingerprint
    )
}

pub fn discover_managed_sdk(data_root: &Path) -> Result<Option<ValidatedSdk>, RenpyError> {
    let (destination, provenance) = managed_sdk_paths(data_root);
    if !destination.exists() {
        return Ok(None);
    }
    let destination_meta =
        fs::symlink_metadata(&destination).map_err(|_| RenpyError::InvalidSdk)?;
    if !destination_meta.is_dir() || crate::transaction::is_link_or_reparse(&destination_meta) {
        return Err(RenpyError::InvalidSdk);
    }
    let provenance_meta = fs::symlink_metadata(&provenance).map_err(|_| RenpyError::InvalidSdk)?;
    if !provenance_meta.is_file() || crate::transaction::is_link_or_reparse(&provenance_meta) {
        return Err(RenpyError::InvalidSdk);
    }
    let sdk = RenpyAdapter::validate_sdk(&destination)?;
    let recorded = fs::read_to_string(&provenance).map_err(|_| RenpyError::InvalidSdk)?;
    if recorded.len() > 4096 || recorded != managed_provenance(&sdk) {
        return Err(RenpyError::InvalidSdk);
    }
    Ok(Some(sdk))
}

pub fn install_supported_sdk(data_root: &Path) -> Result<ValidatedSdk, RenpyError> {
    if let Some(sdk) = discover_managed_sdk(data_root)? {
        return Ok(sdk);
    }
    let sdk_dir = data_root.join("sdks");
    fs::create_dir_all(&sdk_dir).map_err(|_| RenpyError::Io)?;
    let archive = sdk_dir.join(format!(
        ".{SDK_ARCHIVE_NAME}.{}.partial",
        uuid::Uuid::new_v4()
    ));
    let result = (|| {
        let agent = ureq::Agent::config_builder()
            .https_only(true)
            .max_redirects(0)
            .timeout_global(Some(Duration::from_secs(600)))
            .build()
            .new_agent();
        let response = agent
            .get(SDK_URL)
            .call()
            .map_err(|_| RenpyError::Download)?;
        if response.status().is_redirection() {
            return Err(RenpyError::Download);
        }
        let source = response.into_body().into_reader();
        let mut source = source.take(MAX_ARCHIVE_BYTES + 1);
        let mut output = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&archive)
            .map_err(|_| RenpyError::Io)?;
        let downloaded = io::copy(&mut source, &mut output).map_err(|_| RenpyError::Download)?;
        if downloaded > MAX_ARCHIVE_BYTES {
            return Err(RenpyError::Download);
        }
        output.sync_all().map_err(|_| RenpyError::Io)?;
        install_supported_sdk_from_archive(data_root, &archive)
    })();
    let _ = fs::remove_file(&archive);
    result
}

pub fn install_supported_sdk_from_archive(
    data_root: &Path,
    archive: &Path,
) -> Result<ValidatedSdk, RenpyError> {
    if let Some(sdk) = discover_managed_sdk(data_root)? {
        return Ok(sdk);
    }
    let sdk_dir = data_root.join("sdks");
    fs::create_dir_all(&sdk_dir).map_err(|_| RenpyError::Io)?;
    let (destination, provenance) = managed_sdk_paths(data_root);
    if destination.exists() || provenance.exists() {
        return Err(RenpyError::ExistingDestination);
    }
    install_verified_archive(archive, SDK_SHA256, &destination, ArchiveLimits::default())?;
    let sdk = match RenpyAdapter::validate_sdk(&destination) {
        Ok(sdk) => sdk,
        Err(error) => {
            let _ = fs::remove_dir_all(&destination);
            return Err(error);
        }
    };
    let write_result = (|| {
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&provenance)
            .map_err(|_| RenpyError::Io)?;
        file.write_all(managed_provenance(&sdk).as_bytes())
            .and_then(|_| file.sync_all())
            .map_err(|_| RenpyError::Io)
    })();
    if let Err(error) = write_result {
        let _ = fs::remove_file(&provenance);
        let _ = fs::remove_dir_all(&destination);
        return Err(error);
    }
    Ok(sdk)
}

pub fn install_verified_archive(
    archive: &Path,
    expected: &str,
    destination: &Path,
    limits: ArchiveLimits,
) -> Result<(), RenpyError> {
    if destination.exists() {
        return Err(RenpyError::ExistingDestination);
    }
    if sha256_file(archive)? != expected {
        return Err(RenpyError::Checksum);
    }
    validate_archive(archive, limits)?;
    let parent = destination.parent().ok_or(RenpyError::Io)?;
    let stage = parent.join(format!(".loomlight-sdk-stage-{}", uuid::Uuid::new_v4()));
    fs::create_dir(&stage).map_err(|_| RenpyError::Io)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&stage, fs::Permissions::from_mode(0o700))
            .map_err(|_| RenpyError::Io)?;
    }
    let payload = stage.join("payload");
    fs::create_dir(&payload).map_err(|_| RenpyError::Io)?;
    let result = (|| {
        let file = File::open(archive).map_err(|_| RenpyError::Io)?;
        let decoder = BzDecoder::new(file);
        let mut tar = Archive::new(decoder);
        tar.unpack(&payload)
            .map_err(|_| RenpyError::UnsafeArchive)?;
        let root = find_sdk_root(&payload)?;
        promote_path_no_replace(&root, destination)?;
        Ok(())
    })();
    let _ = remove_owned_tree(&stage, &parent.join(stage.file_name().unwrap()));
    result
}

fn validate_archive(path: &Path, limits: ArchiveLimits) -> Result<(), RenpyError> {
    let file = File::open(path).map_err(|_| RenpyError::Io)?;
    let mut archive = Archive::new(BzDecoder::new(file));
    let mut seen = HashSet::new();
    let mut portable = HashSet::new();
    let mut kinds = HashMap::new();
    let mut links = Vec::new();
    let mut total = 0_u64;
    for (index, item) in archive
        .entries()
        .map_err(|_| RenpyError::UnsafeArchive)?
        .enumerate()
    {
        if index >= limits.max_members {
            return Err(RenpyError::UnsafeArchive);
        }
        let entry = item.map_err(|_| RenpyError::UnsafeArchive)?;
        let path = safe_archive_path(
            &entry.path().map_err(|_| RenpyError::UnsafeArchive)?,
            limits,
        )?;
        let key = path.to_string_lossy().replace('\\', "/");
        if !seen.insert(key.clone()) || !portable.insert(key.to_ascii_lowercase()) {
            return Err(RenpyError::UnsafeArchive);
        }
        let kind = entry.header().entry_type();
        if !(kind.is_file() || kind.is_dir() || kind.is_symlink() || kind.is_hard_link()) {
            return Err(RenpyError::UnsafeArchive);
        }
        if kind.is_file() {
            let size = entry.size();
            if size > limits.max_file_bytes {
                return Err(RenpyError::UnsafeArchive);
            }
            total = total.checked_add(size).ok_or(RenpyError::UnsafeArchive)?;
            if total > limits.max_total_bytes {
                return Err(RenpyError::UnsafeArchive);
            }
        }
        if kind.is_symlink() || kind.is_hard_link() {
            let target = entry
                .link_name()
                .map_err(|_| RenpyError::UnsafeArchive)?
                .ok_or(RenpyError::UnsafeArchive)?
                .into_owned();
            links.push((path.clone(), target, kind));
        }
        kinds.insert(path, kind);
    }
    for (path, target, kind) in links {
        let resolved = safe_link_target(&path, &target, kind.is_hard_link())?;
        if !kinds.contains_key(&resolved) {
            return Err(RenpyError::UnsafeArchive);
        }
    }
    let symlinks: Vec<PathBuf> = kinds
        .iter()
        .filter_map(|(path, kind)| kind.is_symlink().then_some(path.clone()))
        .collect();
    if kinds.keys().any(|path| {
        symlinks
            .iter()
            .any(|link| path != link && path.starts_with(link))
    }) {
        return Err(RenpyError::UnsafeArchive);
    }
    Ok(())
}

fn safe_archive_path(path: &Path, limits: ArchiveLimits) -> Result<PathBuf, RenpyError> {
    let mut clean = PathBuf::new();
    for component in path.components() {
        let Component::Normal(part) = component else {
            return Err(RenpyError::UnsafeArchive);
        };
        let text = part.to_str().ok_or(RenpyError::UnsafeArchive)?;
        if text.is_empty()
            || text.contains('\\')
            || text.contains(':')
            || text != text.trim_end_matches([' ', '.'])
            || windows_reserved(text)
        {
            return Err(RenpyError::UnsafeArchive);
        }
        clean.push(part);
    }
    if clean.as_os_str().is_empty() || clean.components().count() > limits.max_depth {
        return Err(RenpyError::UnsafeArchive);
    }
    Ok(clean)
}

fn safe_link_target(member: &Path, target: &Path, hardlink: bool) -> Result<PathBuf, RenpyError> {
    if target.is_absolute() || target.to_string_lossy().contains('\\') {
        return Err(RenpyError::UnsafeArchive);
    }
    let base = if hardlink {
        PathBuf::new()
    } else {
        member.parent().unwrap_or(Path::new("")).to_path_buf()
    };
    let mut parts: Vec<OsString> = base
        .components()
        .filter_map(|c| {
            if let Component::Normal(p) = c {
                Some(p.to_owned())
            } else {
                None
            }
        })
        .collect();
    for component in target.components() {
        match component {
            Component::Normal(part) => parts.push(part.to_owned()),
            Component::CurDir => {}
            Component::ParentDir => {
                if parts.pop().is_none() {
                    return Err(RenpyError::UnsafeArchive);
                }
            }
            _ => return Err(RenpyError::UnsafeArchive),
        }
    }
    if parts.is_empty() {
        return Err(RenpyError::UnsafeArchive);
    }
    Ok(parts.into_iter().collect())
}

fn windows_reserved(value: &str) -> bool {
    let stem = value
        .trim_end_matches([' ', '.'])
        .split('.')
        .next()
        .unwrap_or("")
        .to_ascii_uppercase();
    matches!(stem.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (stem.len() == 4
            && (stem.starts_with("COM") || stem.starts_with("LPT"))
            && stem.as_bytes()[3].is_ascii_digit()
            && stem.as_bytes()[3] != b'0')
}

fn find_sdk_root(payload: &Path) -> Result<PathBuf, RenpyError> {
    let mut candidates = Vec::new();
    if payload.join("renpy.py").is_file() {
        candidates.push(payload.to_path_buf());
    }
    for entry in fs::read_dir(payload).map_err(|_| RenpyError::Io)? {
        let path = entry.map_err(|_| RenpyError::Io)?.path();
        if path.is_dir() && path.join("renpy.py").is_file() {
            candidates.push(path);
        }
    }
    if candidates.len() == 1 {
        Ok(candidates.remove(0))
    } else {
        Err(RenpyError::InvalidSdk)
    }
}

fn sha256_file(path: &Path) -> Result<String, RenpyError> {
    let mut file = File::open(path).map_err(|_| RenpyError::Io)?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        let count = file.read(&mut buffer).map_err(|_| RenpyError::Io)?;
        if count == 0 {
            break;
        }
        digest.update(&buffer[..count]);
    }
    Ok(hex::encode(digest.finalize()))
}

#[cfg(unix)]
fn sdk_directory_identity(path: &Path) -> Result<SdkFileIdentity, RenpyError> {
    use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
    let file = OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW)
        .open(path)
        .map_err(|_| RenpyError::InvalidSdk)?;
    let metadata = file.metadata().map_err(|_| RenpyError::InvalidSdk)?;
    Ok(SdkFileIdentity {
        a: metadata.dev(),
        b: metadata.ino(),
    })
}

#[cfg(windows)]
fn sdk_directory_identity(path: &Path) -> Result<SdkFileIdentity, RenpyError> {
    use std::{
        mem::zeroed,
        os::windows::{fs::OpenOptionsExt, io::AsRawHandle},
    };
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION,
    };
    const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;
    const FILE_FLAG_OPEN_REPARSE_POINT: u32 = 0x0020_0000;
    let file = OpenOptions::new()
        .read(true)
        .share_mode(0x1 | 0x2 | 0x4)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
        .map_err(|_| RenpyError::InvalidSdk)?;
    let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut info) } == 0 {
        return Err(RenpyError::InvalidSdk);
    }
    Ok(SdkFileIdentity {
        a: u64::from(info.dwVolumeSerialNumber),
        b: (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow),
    })
}

fn launcher_fingerprint(root: &Path) -> Result<String, RenpyError> {
    let mut digest = Sha256::new();
    let script = root.join("renpy.py");
    if !script.is_file() || has_symlink_component(&script) {
        return Err(RenpyError::InvalidSdk);
    }
    digest.update(b"renpy.py\0");
    digest.update(sha256_file(&script)?.as_bytes());
    #[cfg(windows)]
    let launcher = root.join("lib/py3-windows-x86_64/python.exe");
    #[cfg(not(windows))]
    let launcher = root.join("renpy.sh");
    if !launcher.is_file() || has_symlink_component(&launcher) {
        return Err(RenpyError::InvalidSdk);
    }
    digest.update(b"launcher\0");
    digest.update(sha256_file(&launcher)?.as_bytes());
    Ok(hex::encode(digest.finalize()))
}

fn template_fingerprint(root: &Path) -> Result<String, RenpyError> {
    let template = root.join("gui");
    if !template.is_dir() || has_symlink_component(&template) {
        return Err(RenpyError::InvalidSdk);
    }
    hash_regular_tree(&template)
}

fn hash_regular_tree(root: &Path) -> Result<String, RenpyError> {
    let mut pending = vec![root.to_path_buf()];
    let mut files = Vec::new();
    let mut members = 0_usize;
    let mut total = 0_u64;
    while let Some(directory) = pending.pop() {
        let mut entries = fs::read_dir(&directory)
            .map_err(|_| RenpyError::InvalidSdk)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| RenpyError::InvalidSdk)?;
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            members += 1;
            if members > 100_000 {
                return Err(RenpyError::InvalidSdk);
            }
            let path = entry.path();
            let metadata = fs::symlink_metadata(&path).map_err(|_| RenpyError::InvalidSdk)?;
            if crate::transaction::is_link_or_reparse(&metadata) {
                return Err(RenpyError::InvalidSdk);
            }
            if metadata.is_dir() {
                pending.push(path);
            } else if metadata.is_file() {
                total = total
                    .checked_add(metadata.len())
                    .ok_or(RenpyError::InvalidSdk)?;
                if total > 1024 * 1024 * 1024 {
                    return Err(RenpyError::InvalidSdk);
                }
                files.push(path);
            } else {
                return Err(RenpyError::InvalidSdk);
            }
        }
    }
    files.sort();
    let mut digest = Sha256::new();
    for path in files {
        let relative = path
            .strip_prefix(root)
            .map_err(|_| RenpyError::InvalidSdk)?;
        digest.update(relative.to_string_lossy().as_bytes());
        digest.update([0]);
        let mut file = File::open(&path).map_err(|_| RenpyError::InvalidSdk)?;
        let mut buffer = [0_u8; 1024 * 1024];
        loop {
            let count = file.read(&mut buffer).map_err(|_| RenpyError::InvalidSdk)?;
            if count == 0 {
                break;
            }
            digest.update(&buffer[..count]);
        }
        digest.update([0xff]);
    }
    Ok(hex::encode(digest.finalize()))
}

fn has_symlink_component(path: &Path) -> bool {
    let mut current = PathBuf::new();
    for component in path.components() {
        current.push(component.as_os_str());
        if fs::symlink_metadata(&current)
            .is_ok_and(|meta| crate::transaction::is_link_or_reparse(&meta))
        {
            return true;
        }
    }
    false
}

fn remove_owned_tree(stage: &Path, expected: &Path) -> io::Result<()> {
    if stage == expected
        && stage
            .file_name()
            .is_some_and(|name| name.to_string_lossy().starts_with(".loomlight-sdk-stage-"))
    {
        fs::remove_dir_all(stage)
    } else {
        Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "not an owned stage",
        ))
    }
}

#[cfg(target_os = "linux")]
fn promote_path_no_replace(from: &Path, to: &Path) -> Result<(), RenpyError> {
    use std::{ffi::CString, os::unix::ffi::OsStrExt};
    let from = CString::new(from.as_os_str().as_bytes()).map_err(|_| RenpyError::Io)?;
    let to = CString::new(to.as_os_str().as_bytes()).map_err(|_| RenpyError::Io)?;
    let result = unsafe {
        libc::syscall(
            libc::SYS_renameat2,
            libc::AT_FDCWD,
            from.as_ptr(),
            libc::AT_FDCWD,
            to.as_ptr(),
            libc::RENAME_NOREPLACE,
        )
    };
    if result == 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(RenpyError::ExistingDestination)
    } else {
        Err(RenpyError::Io)
    }
}

#[cfg(target_os = "macos")]
fn promote_path_no_replace(from: &Path, to: &Path) -> Result<(), RenpyError> {
    use std::{ffi::CString, os::unix::ffi::OsStrExt};
    unsafe extern "C" {
        fn renamex_np(from: *const libc::c_char, to: *const libc::c_char, flags: u32) -> i32;
    }
    const RENAME_EXCL: u32 = 0x0000_0004;
    let from = CString::new(from.as_os_str().as_bytes()).map_err(|_| RenpyError::Io)?;
    let to = CString::new(to.as_os_str().as_bytes()).map_err(|_| RenpyError::Io)?;
    let result = unsafe { renamex_np(from.as_ptr(), to.as_ptr(), RENAME_EXCL) };
    if result == 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(RenpyError::ExistingDestination)
    } else {
        Err(RenpyError::Io)
    }
}

#[cfg(windows)]
fn promote_path_no_replace(from: &Path, to: &Path) -> Result<(), RenpyError> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::MoveFileExW;
    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect::<Vec<_>>()
    };
    let from = wide(from);
    let to = wide(to);
    let result = unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), 0) };
    if result != 0 {
        Ok(())
    } else if io::Error::last_os_error().kind() == io::ErrorKind::AlreadyExists {
        Err(RenpyError::ExistingDestination)
    } else {
        Err(RenpyError::Io)
    }
}

#[cfg(all(unix, not(any(target_os = "linux", target_os = "macos"))))]
fn promote_path_no_replace(_from: &Path, _to: &Path) -> Result<(), RenpyError> {
    Err(RenpyError::Io)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn archive(path: &Path, members: &[(&str, &[u8])]) {
        let file = File::create(path).unwrap();
        let encoder = bzip2::write::BzEncoder::new(file, bzip2::Compression::best());
        let mut builder = tar::Builder::new(encoder);
        for (name, bytes) in members {
            let mut header = tar::Header::new_gnu();
            header.set_size(bytes.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            builder
                .append_data(&mut header, *name, Cursor::new(*bytes))
                .unwrap();
        }
        builder.into_inner().unwrap().finish().unwrap();
    }

    #[test]
    fn exact_version_parser_rejects_incompatible_sdk() {
        assert_eq!(parse_version("Ren'Py 8.5.3.26081001"), Some("8.5.3".into()));
        assert_ne!(
            parse_version("Ren'Py 8.5.4"),
            Some(SUPPORTED_VERSION.into())
        );
    }

    #[test]
    fn child_environment_allowlist_excludes_injection_variables() {
        let mut command = Command::new("synthetic");
        apply_minimal_environment(&mut command);
        let debug = format!("{command:?}");
        for forbidden in [
            "PYTHONPATH",
            "PYTHONHOME",
            "GIT_DIR",
            "GIT_OBJECT_DIRECTORY",
        ] {
            assert!(!debug.contains(forbidden), "{forbidden}");
        }
    }

    #[test]
    fn archive_rejects_traversal_collision_and_reserved_names() {
        for name in ["../escape", "root/CON", "root/a/../../escape"] {
            assert!(
                matches!(
                    safe_archive_path(Path::new(name), ArchiveLimits::default()),
                    Err(RenpyError::UnsafeArchive)
                ),
                "{name}"
            );
        }
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("collision.tar.bz2");
        archive(&path, &[("root/A", b"a"), ("root/a", b"b")]);
        assert!(matches!(
            validate_archive(&path, ArchiveLimits::default()),
            Err(RenpyError::UnsafeArchive)
        ));
        for (member, target, hardlink) in [
            ("root/link", "../../escape", false),
            ("root/link", "/absolute", false),
            ("root/link", "../escape", true),
        ] {
            assert!(matches!(
                safe_link_target(Path::new(member), Path::new(target), hardlink),
                Err(RenpyError::UnsafeArchive)
            ));
        }
    }

    #[test]
    fn checksum_failure_and_existing_destination_never_overwrite() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("sdk.tar.bz2");
        archive(&path, &[("root/renpy.py", b"x")]);
        assert!(matches!(
            install_verified_archive(
                &path,
                &"0".repeat(64),
                &temp.path().join("sdk"),
                ArchiveLimits::default()
            ),
            Err(RenpyError::Checksum)
        ));
        fs::create_dir(temp.path().join("sdk")).unwrap();
        fs::write(temp.path().join("sdk/keep"), b"keep").unwrap();
        assert!(matches!(
            install_verified_archive(
                &path,
                &sha256_file(&path).unwrap(),
                &temp.path().join("sdk"),
                ArchiveLimits::default()
            ),
            Err(RenpyError::ExistingDestination)
        ));
        assert_eq!(fs::read(temp.path().join("sdk/keep")).unwrap(), b"keep");
    }

    #[test]
    fn invalid_extracted_payload_is_cleaned_without_promotion() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("sdk.tar.bz2");
        archive(&path, &[("root/not-an-sdk", b"data")]);
        let destination = temp.path().join("sdk");
        assert!(matches!(
            install_verified_archive(
                &path,
                &sha256_file(&path).unwrap(),
                &destination,
                ArchiveLimits::default()
            ),
            Err(RenpyError::InvalidSdk)
        ));
        assert!(!destination.exists());
        assert!(fs::read_dir(temp.path()).unwrap().all(|entry| {
            !entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .starts_with(".loomlight-sdk-stage-")
        }));
    }

    #[cfg(windows)]
    #[test]
    fn command_paths_remove_only_windows_verbatim_prefixes() {
        assert_eq!(
            command_path(Path::new(r"\\?\C:\projects\story")),
            OsString::from(r"C:\projects\story")
        );
        assert_eq!(
            command_path(Path::new(r"\\?\UNC\server\share\story")),
            OsString::from(r"\\server\share\story")
        );
    }
}
