//! Runtime reservations share the transaction serialization boundary. A reservation
//! outlives preparation; only the supervisor may release it after confirmed cleanup.
use super::*;
use std::sync::atomic::AtomicU8;

const PREPARING: u8 = 1;
const VALIDATING: u8 = 2;
const PLAYING: u8 = 3;
const STOPPING: u8 = 4;

pub(crate) struct ExecutionGate {
    phase: AtomicU8,
    pub(crate) generation: AtomicU64,
    owned: HashSet<String>,
}

impl ExecutionGate {
    pub(crate) fn active(&self) -> bool {
        self.phase.load(Ordering::Acquire) != 0
    }
    pub(crate) fn begin(&self, play: bool) -> Result<(), ErrorCode> {
        self.phase
            .compare_exchange(
                PREPARING,
                if play { PLAYING } else { VALIDATING },
                Ordering::AcqRel,
                Ordering::Acquire,
            )
            .map(|_| ())
            .map_err(|_| ErrorCode::RuntimeBusy)
    }
    pub(crate) fn playing(&self) {
        let _ =
            self.phase
                .compare_exchange(VALIDATING, PLAYING, Ordering::AcqRel, Ordering::Acquire);
    }
    pub(crate) fn stopping(&self) {
        let _ = self
            .phase
            .fetch_update(Ordering::AcqRel, Ordering::Acquire, |phase| {
                (phase != 0).then_some(STOPPING)
            });
    }
    /// Call only after zero spawn or confirmed process/reader cleanup.
    pub(crate) fn finish(&self) {
        self.phase.store(0, Ordering::Release);
    }
    fn permits(&self, mutation: &FileMutation) -> bool {
        if self.phase.load(Ordering::Acquire) != PLAYING {
            return false;
        }
        let path = mutation.path.as_str();
        if path.starts_with("game/")
            && path.ends_with(".rpy")
            && !path.eq_ignore_ascii_case("game/loomlight_runtime.rpy")
        {
            // Existing loaded scripts can be replaced, but never renamed/deleted.
            return mutation.kind == MutationKind::ReplaceExisting
                || !self.owned.contains(&path.to_ascii_lowercase());
        }
        if mutation.kind != MutationKind::ReplaceExisting {
            return false;
        }
        match path {
            ".renpy-editor/source-map.json" => true,
            ".renpy-editor/authoring.json" => same_field(mutation, "assets"),
            ".renpy-editor/project.json" => same_field(mutation, "sdk"),
            _ => false,
        }
    }
}

fn same_field(mutation: &FileMutation, field: &str) -> bool {
    let old = serde_json::from_slice::<serde_json::Value>(&mutation.expected_bytes);
    let new = serde_json::from_slice::<serde_json::Value>(&mutation.proposed);
    match (old, new) {
        (Ok(old), Ok(new)) => old.get(field).is_some() && old.get(field) == new.get(field),
        _ => false,
    }
}

impl TransactionService {
    pub(crate) fn reserve_execution(
        &self,
        project: &ProjectId,
    ) -> Result<Arc<ExecutionGate>, PublicDiagnostic> {
        let _serial = self
            .serial
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        self.require_no_execution(project)?;
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        if blocking_recovery_code(&approved).is_some() {
            return Err(PublicDiagnostic::new(ErrorCode::RecoveryRequired, None));
        }
        let owned = self
            .inventory_files_bounded(project, "game", 8192)?
            .into_iter()
            .map(|path| path.to_ascii_lowercase())
            .collect();
        let gate = Arc::new(ExecutionGate {
            phase: AtomicU8::new(PREPARING),
            generation: AtomicU64::new(0),
            owned,
        });
        self.executions
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?
            .insert(project.clone(), gate.clone());
        Ok(gate)
    }

    pub(crate) fn require_no_execution(&self, project: &ProjectId) -> Result<(), PublicDiagnostic> {
        let gates = self
            .executions
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        if gates.get(project).is_some_and(|gate| gate.active()) {
            Err(PublicDiagnostic::new(ErrorCode::RuntimeBusy, None))
        } else {
            Ok(())
        }
    }

    pub(super) fn permits_script_directory(&self, project: &ProjectId, directory: &str) -> bool {
        (directory == "game/chapters" || directory.starts_with("game/chapters/"))
            && self.executions.lock().is_ok_and(|gates| {
                gates
                    .get(project)
                    .is_some_and(|gate| gate.phase.load(Ordering::Acquire) == PLAYING)
            })
    }

    pub(super) fn check_execution_mutations(
        &self,
        project: &ProjectId,
        mutations: &[FileMutation],
    ) -> Result<(), PublicDiagnostic> {
        let gates = self
            .executions
            .lock()
            .map_err(|_| PublicDiagnostic::new(ErrorCode::IoFailure, None))?;
        if let Some(gate) = gates.get(project).filter(|gate| gate.active()) {
            if !mutations.iter().all(|mutation| gate.permits(mutation)) {
                return Err(PublicDiagnostic::new(ErrorCode::RuntimeBusy, None));
            }
        }
        Ok(())
    }

    pub(super) fn accepted_execution_edit(&self, project: &ProjectId) {
        if let Ok(gates) = self.executions.lock() {
            if let Some(gate) = gates.get(project).filter(|gate| gate.active()) {
                gate.generation.fetch_add(1, Ordering::AcqRel);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;
    use std::time::Duration;

    struct Fixture {
        _temp: tempfile::TempDir,
        root: PathBuf,
        service: Arc<TransactionService>,
        id: ProjectId,
    }
    impl Fixture {
        fn new() -> Self {
            let temp = tempfile::tempdir().unwrap();
            let root = fs::canonicalize(temp.path()).unwrap();
            fs::create_dir_all(root.join("game/images")).unwrap();
            fs::create_dir_all(root.join(".renpy-editor")).unwrap();
            fs::write(root.join("game/script.rpy"), b"label start:\n    \"old\"\n").unwrap();
            fs::write(root.join("game/script.rpyc"), b"compiled").unwrap();
            fs::write(root.join("game/images/a.png"), b"asset").unwrap();
            fs::write(
                root.join(".renpy-editor/authoring.json"),
                br#"{"assets":[],"characters":[]}"#,
            )
            .unwrap();
            let service = Arc::new(TransactionService::default());
            let id = service.register_trusted_project(&root).unwrap();
            Self {
                _temp: temp,
                root,
                service,
                id,
            }
        }
        fn replace(&self, path: &str, bytes: &[u8]) -> FileMutation {
            let path = RelativePath::new(path).unwrap();
            let snapshot = self.service.snapshot(&self.id, path.clone()).unwrap();
            FileMutation {
                path,
                base: snapshot.1,
                expected_bytes: snapshot.0,
                proposed: bytes.to_vec(),
                kind: MutationKind::ReplaceExisting,
            }
        }
        fn commit(&self, mutations: Vec<FileMutation>, intent: TransactionIntent) -> CommitOutcome {
            self.service
                .commit(&self.id, TransactionProposal { mutations, intent })
        }
    }
    fn refused(result: CommitOutcome) {
        assert!(matches!(
            result,
            CommitOutcome::Rejected {
                diagnostic: PublicDiagnostic {
                    code: ErrorCode::RuntimeBusy,
                    ..
                }
            }
        ));
    }

    #[test]
    fn runtime_scripts_and_metadata_save_but_asset_compound_and_inverse_do_not_write() {
        let f = Fixture::new();
        let gate = f.service.reserve_execution(&f.id).unwrap();
        refused(f.commit(
            vec![f.replace("game/script.rpy", b"new")],
            TransactionIntent::Edit,
        ));
        gate.begin(true).unwrap();
        f.service
            .ensure_directory(&f.id, "game/chapters/new_chapter")
            .unwrap();
        assert_eq!(
            f.service
                .ensure_directory(&f.id, "game/images/new_assets")
                .unwrap_err()
                .code,
            ErrorCode::RuntimeBusy
        );
        assert!(!f.root.join("game/images/new_assets").exists());
        let metadata = br#"{"assets":[],"characters":[{"id":"synthetic"}]}"#;
        assert!(matches!(
            f.commit(
                vec![
                    f.replace("game/script.rpy", b"new"),
                    f.replace(".renpy-editor/authoring.json", metadata)
                ],
                TransactionIntent::Edit
            ),
            CommitOutcome::Committed { .. }
        ));
        assert_eq!(gate.generation.load(Ordering::Acquire), 1);
        let before = fs::read_dir(f.root.join(".renpy-editor/recovery"))
            .ok()
            .map(|d| d.count());
        for intent in [
            TransactionIntent::Edit,
            TransactionIntent::Undo,
            TransactionIntent::Redo,
        ] {
            refused(f.commit(
                vec![
                    f.replace("game/script.rpy", b"unwanted"),
                    f.replace("game/images/a.png", b"changed"),
                ],
                intent,
            ));
            refused(f.commit(
                vec![f.replace(
                    ".renpy-editor/authoring.json",
                    br#"{"assets":[{"id":"new"}],"characters":[]}"#,
                )],
                intent,
            ));
        }
        assert_eq!(fs::read(f.root.join("game/script.rpy")).unwrap(), b"new");
        assert_eq!(
            fs::read(f.root.join("game/images/a.png")).unwrap(),
            b"asset"
        );
        assert_eq!(
            before,
            fs::read_dir(f.root.join(".renpy-editor/recovery"))
                .ok()
                .map(|d| d.count())
        );
        gate.stopping();
        refused(f.commit(
            vec![f.replace("game/script.rpy", b"later")],
            TransactionIntent::Edit,
        ));
        gate.finish();
        assert!(matches!(
            f.commit(
                vec![f.replace("game/images/a.png", b"changed")],
                TransactionIntent::Edit
            ),
            CommitOutcome::Committed { .. }
        ));
    }

    #[test]
    fn runtime_loaded_script_and_bytecode_lifecycle_inverse_is_blocked() {
        let f = Fixture::new();
        let gate = f.service.reserve_execution(&f.id).unwrap();
        gate.begin(true).unwrap();
        for path in ["game/script.rpy", "game/script.rpyc"] {
            let mut mutation = f.replace(path, b"");
            mutation.kind = MutationKind::DeleteExisting;
            refused(f.commit(vec![mutation], TransactionIntent::Undo));
            assert!(f.root.join(path).exists());
        }
        // A new script is not in the loaded file set; source remains authoritative.
        let mutation = FileMutation {
            path: RelativePath::new("game/new.rpy").unwrap(),
            kind: MutationKind::CreateNew,
            base: Revision::expected_absence(),
            expected_bytes: vec![],
            proposed: b"label next:\n    return\n".to_vec(),
        };
        assert!(matches!(
            f.commit(vec![mutation], TransactionIntent::Edit),
            CommitOutcome::Committed { .. }
        ));
        gate.finish();
    }

    #[test]
    fn runtime_validation_cancel_and_duplicate_reservation_are_fail_closed() {
        let f = Fixture::new();
        let gate = f.service.reserve_execution(&f.id).unwrap();
        assert_eq!(
            f.service.reserve_execution(&f.id).err().unwrap().code,
            ErrorCode::RuntimeBusy
        );
        gate.begin(false).unwrap();
        refused(f.commit(
            vec![f.replace("game/script.rpy", b"new")],
            TransactionIntent::Edit,
        ));
        assert!(gate.begin(true).is_err());
        gate.finish();
        let next = f.service.reserve_execution(&f.id).unwrap();
        gate.finish(); // Old completion cannot release the new reservation.
        assert_eq!(
            f.service.require_no_execution(&f.id).err().unwrap().code,
            ErrorCode::RuntimeBusy
        );
        next.finish();
        assert!(matches!(
            f.commit(
                vec![f.replace("game/script.rpy", b"new")],
                TransactionIntent::Edit
            ),
            CommitOutcome::Committed { .. }
        ));
    }

    #[test]
    fn runtime_streaming_import_is_refused_before_reading_or_staging_then_retries() {
        let f = Fixture::new();
        let import_path = f.root.join("outside-import");
        fs::write(&import_path, b"import").unwrap();
        let mut file = File::open(import_path).unwrap();
        let gate = f.service.reserve_execution(&f.id).unwrap();
        gate.begin(true).unwrap();
        let destination = RelativePath::new("game/images/new.png").unwrap();
        refused(f.service.commit_streaming_import(
            &f.id,
            destination.clone(),
            &mut file,
            6,
            &sha256(b"import"),
            vec![],
        ));
        assert_eq!(file.stream_position().unwrap(), 0);
        assert!(!f.root.join(destination.as_str()).exists());
        assert!(f
            .service
            .ensure_directory(&f.id, "game/new-assets")
            .is_err());
        assert!(!f.root.join("game/new-assets").exists());
        gate.finish();
        assert!(matches!(
            f.service.commit_streaming_import(
                &f.id,
                destination,
                &mut file,
                6,
                &sha256(b"import"),
                vec![]
            ),
            CommitOutcome::Committed { .. }
        ));
    }

    #[test]
    fn runtime_reservation_drains_in_flight_asset_transaction() {
        struct Barrier {
            entered: mpsc::Sender<()>,
            resume: mpsc::Receiver<()>,
        }
        impl FaultInjector for Barrier {
            fn visit(&mut self, point: FaultPoint, _: &Path) -> Result<(), ErrorCode> {
                if point == FaultPoint::BeforeExchange(0) {
                    self.entered.send(()).unwrap();
                    self.resume.recv_timeout(Duration::from_secs(5)).unwrap();
                }
                Ok(())
            }
        }
        let f = Fixture::new();
        let mutation = f.replace("game/images/a.png", b"imported");
        let (entered_tx, entered_rx) = mpsc::channel();
        let (resume_tx, resume_rx) = mpsc::channel();
        let service = f.service.clone();
        let id = f.id.clone();
        let writer = std::thread::spawn(move || {
            service.commit_with_injector(
                &id,
                TransactionProposal {
                    mutations: vec![mutation],
                    intent: TransactionIntent::Edit,
                },
                &mut Barrier {
                    entered: entered_tx,
                    resume: resume_rx,
                },
            )
        });
        entered_rx.recv_timeout(Duration::from_secs(5)).unwrap();
        let service = f.service.clone();
        let id = f.id.clone();
        let (reserved_tx, reserved_rx) = mpsc::channel();
        let reserve = std::thread::spawn(move || {
            let gate = service.reserve_execution(&id).unwrap();
            reserved_tx.send(gate).unwrap();
        });
        assert!(matches!(
            reserved_rx.recv_timeout(Duration::from_millis(100)),
            Err(mpsc::RecvTimeoutError::Timeout)
        ));
        resume_tx.send(()).unwrap();
        assert!(matches!(
            writer.join().unwrap(),
            CommitOutcome::Committed { .. }
        ));
        let gate = reserved_rx.recv_timeout(Duration::from_secs(5)).unwrap();
        reserve.join().unwrap();
        gate.begin(true).unwrap();
        assert_eq!(
            fs::read(f.root.join("game/images/a.png")).unwrap(),
            b"imported"
        );
        refused(f.commit(
            vec![f.replace("game/images/a.png", b"queued-too-late")],
            TransactionIntent::Edit,
        ));
        gate.finish();
    }
}
