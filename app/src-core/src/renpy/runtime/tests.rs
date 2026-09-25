use super::*;
use crate::transaction::TransactionService;

// Re-exec the real test executable so the same fixture runs on both native targets.
#[test]
#[ignore = "child-process fixture, invoked only by runtime tests"]
fn runtime_process_worker() {
    let Ok(mode) = std::env::var("LOOMLIGHT_RUNTIME_TEST_MODE") else {
        return;
    };
    let root = PathBuf::from(std::env::var_os("LOOMLIGHT_RUNTIME_TEST_ROOT").unwrap());
    if mode == "grandchild" {
        loop {
            fs::write(root.join("heartbeat"), format!("{:?}", Instant::now())).unwrap();
            thread::sleep(Duration::from_millis(20));
        }
    }
    let mut descendant = worker("grandchild", &root);
    descendant.stdout(Stdio::inherit()).stderr(Stdio::inherit());
    let _child = descendant.spawn().unwrap();
    while !root.join("heartbeat").exists() {
        thread::sleep(Duration::from_millis(5));
    }
    fs::write(root.join("ready"), b"ready").unwrap();
    match mode.as_str() {
        "exit" => std::process::exit(0),
        "crash" => std::process::exit(17),
        "flood" => {
            let bytes = [b'x'; 8192];
            for _ in 0..512 {
                io::stdout().write_all(&bytes).unwrap();
            }
            io::stdout().write_all(READY_MARKER).unwrap();
            io::stdout().write_all(b"\n").unwrap();
            io::stdout().flush().unwrap();
            loop {
                thread::sleep(Duration::from_millis(20));
            }
        }
        "play" => loop {
            thread::sleep(Duration::from_millis(20));
        },
        _ => panic!("unexpected worker mode"),
    }
}
fn worker(mode: &str, root: &Path) -> Command {
    let mut command = Command::new(std::env::current_exe().unwrap());
    command.args([
        "--exact",
        "renpy::runtime::tests::runtime_process_worker",
        "--ignored",
        "--nocapture",
    ]);
    command
        .env("LOOMLIGHT_RUNTIME_TEST_MODE", mode)
        .env("LOOMLIGHT_RUNTIME_TEST_ROOT", root);
    command
}
fn wait_for(mut predicate: impl FnMut() -> bool, limit: Duration) {
    let start = Instant::now();
    while !predicate() {
        assert!(start.elapsed() < limit, "runtime condition timed out");
        thread::sleep(Duration::from_millis(10));
    }
}
fn start_process(mode: &str, root: &Path) -> RuntimeProcess {
    let root = fs::canonicalize(root).unwrap();
    fs::create_dir_all(root.join("game")).unwrap();
    let service = TransactionService::default();
    let id = service.register_trusted_project(&root).unwrap();
    let gate = service.reserve_execution(&id).unwrap();
    RuntimeProcess::spawn_commands(
        vec![worker(mode, &root)],
        None,
        RuntimeKind::Run,
        gate,
        VALIDATION_DEADLINE,
    )
    .unwrap()
}
fn stopped_heartbeat(root: &Path) {
    let before = fs::read(root.join("heartbeat")).unwrap();
    thread::sleep(Duration::from_millis(100));
    assert_eq!(before, fs::read(root.join("heartbeat")).unwrap());
}
#[test]
fn runtime_natural_exit_and_crash_cleanup_descendant_pipes() {
    for (mode, phase, exit) in [("exit", "exited", 0), ("crash", "failed", 17)] {
        let temp = tempfile::tempdir().unwrap();
        let process = start_process(mode, temp.path());
        wait_for(|| !process.active(), Duration::from_secs(8));
        let status = process.status(0).unwrap();
        assert_eq!(status.phase, phase);
        assert_eq!(status.exit_code, Some(exit));
        assert!(status.cleanup_complete);
        stopped_heartbeat(temp.path());
    }
}
#[test]
fn runtime_long_play_responsive_stop_and_shutdown() {
    let temp = tempfile::tempdir().unwrap();
    let process = start_process("play", temp.path());
    wait_for(
        || temp.path().join("ready").exists(),
        Duration::from_secs(5),
    );
    thread::sleep(Duration::from_secs(9));
    assert!(
        process.active(),
        "play must outlive creation smoke deadline"
    );
    let start = Instant::now();
    process.stop();
    assert!(start.elapsed() < Duration::from_millis(100));
    wait_for(|| !process.active(), Duration::from_secs(8));
    assert!(process.status(0).unwrap().cleanup_complete);
    stopped_heartbeat(temp.path());
    let temp = tempfile::tempdir().unwrap();
    let process = start_process("play", temp.path());
    wait_for(
        || temp.path().join("ready").exists(),
        Duration::from_secs(5),
    );
    drop(process); // Same ownership path as application shutdown.
    stopped_heartbeat(temp.path());
}
#[test]
fn runtime_output_flood_is_bounded_and_stop_remains_responsive() {
    let temp = tempfile::tempdir().unwrap();
    let process = start_process("flood", temp.path());
    wait_for(
        || process.status(0).unwrap().output_truncated && process.observation.lock().unwrap().ready,
        Duration::from_secs(8),
    );
    assert!(process.observation.lock().unwrap().bytes.len() <= RETAINED_OUTPUT);
    assert!(process.status(0).unwrap().output.len() <= PAGE_BYTES);
    assert!(process.status(RETAINED_OUTPUT + 1).is_err());
    process.stop();
    wait_for(|| !process.active(), Duration::from_secs(8));
    assert!(process.status(0).unwrap().cleanup_complete);
    stopped_heartbeat(temp.path());
}

#[test]
fn runtime_validation_deadline_terminates_the_real_tree() {
    let temp = tempfile::tempdir().unwrap();
    fs::create_dir(temp.path().join("game")).unwrap();
    let service = TransactionService::default();
    let root = fs::canonicalize(temp.path()).unwrap();
    let id = service.register_trusted_project(&root).unwrap();
    let gate = service.reserve_execution(&id).unwrap();
    let process = RuntimeProcess::spawn_commands(
        vec![worker("play", temp.path())],
        None,
        RuntimeKind::Validate,
        gate,
        Duration::from_secs(2),
    )
    .unwrap();
    wait_for(|| !process.active(), Duration::from_secs(8));
    let status = process.status(0).unwrap();
    assert_eq!(status.phase, "timedOut");
    assert!(status.cleanup_complete);
    stopped_heartbeat(temp.path());
}
