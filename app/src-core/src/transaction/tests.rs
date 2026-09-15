use super::*;
use std::{collections::HashMap, fs, path::Path};
use tempfile::TempDir;

struct Fixture {
    _temporary: TempDir,
    root: PathBuf,
    service: TransactionService,
    project: ProjectId,
}

impl Fixture {
    fn new() -> Self {
        let temporary = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(temporary.path()).unwrap();
        fs::create_dir(root.join("game")).unwrap();
        fs::write(root.join("game/one.rpy"), b"label one:\n    pass\n").unwrap();
        fs::write(root.join("game/two.rpy"), b"label two:\n    pass\n").unwrap();
        let service = TransactionService::default();
        let project = service.register_trusted_project(&root).unwrap();
        Self {
            _temporary: temporary,
            root,
            service,
            project,
        }
    }

    fn mutation(&self, path: &str, proposed: &[u8]) -> FileMutation {
        let relative = RelativePath::new(path).unwrap();
        let (expected_bytes, base) = self
            .service
            .snapshot(&self.project, relative.clone())
            .unwrap();
        FileMutation {
            path: relative,
            kind: MutationKind::ReplaceExisting,
            base,
            expected_bytes,
            proposed: proposed.to_vec(),
        }
    }

    fn proposal(&self, mutations: Vec<FileMutation>) -> TransactionProposal {
        TransactionProposal {
            mutations,
            intent: TransactionIntent::Edit,
        }
    }
}

struct Hook<F>(F);
impl<F: FnMut(FaultPoint, &Path) -> Result<(), ErrorCode>> FaultInjector for Hook<F> {
    fn visit(&mut self, point: FaultPoint, root: &Path) -> Result<(), ErrorCode> {
        (self.0)(point, root)
    }
}

fn outcome_code(outcome: &CommitOutcome) -> Option<ErrorCode> {
    match outcome {
        CommitOutcome::Committed { .. } => None,
        CommitOutcome::Conflict { diagnostic }
        | CommitOutcome::RecoveryRequired { diagnostic }
        | CommitOutcome::Rejected { diagnostic } => Some(diagnostic.code),
    }
}

fn artifact(root: &Path, suffix: &str) -> PathBuf {
    fs::read_dir(root.join(".renpy-editor/recovery"))
        .unwrap()
        .filter_map(Result::ok)
        .flat_map(|entry| fs::read_dir(entry.path()).into_iter().flatten())
        .filter_map(Result::ok)
        .find(|entry| entry.file_name().to_string_lossy().ends_with(suffix))
        .expect("owned artifact exists")
        .path()
}

fn transaction_directory(root: &Path) -> PathBuf {
    fs::read_dir(root.join(".renpy-editor/recovery"))
        .unwrap()
        .filter_map(Result::ok)
        .find(|entry| entry.file_type().is_ok_and(|kind| kind.is_dir()))
        .expect("transaction directory exists")
        .path()
}

fn contains_artifact(directory: &Path, suffix: &str) -> bool {
    fs::read_dir(directory).is_ok_and(|entries| {
        entries
            .filter_map(Result::ok)
            .any(|entry| entry.file_name().to_string_lossy().ends_with(suffix))
    })
}

#[test]
fn normalized_relative_paths_only() {
    assert!(RelativePath::new("game/chapter/scene.rpy").is_ok());
    for unsafe_path in [
        "",
        "/absolute.rpy",
        "../escape.rpy",
        "game/../escape.rpy",
        "game\\escape.rpy",
    ] {
        assert_eq!(RelativePath::new(unsafe_path), Err(ErrorCode::UnsafePath));
    }
}

#[test]
fn commits_a_multi_path_recoverable_set() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![
        fixture.mutation("game/one.rpy", b"label one:\n    \"changed\"\n"),
        fixture.mutation("game/two.rpy", b"label two:\n    \"changed\"\n"),
    ]);
    let outcome = fixture.service.commit(&fixture.project, proposal);
    let CommitOutcome::Committed { revisions, .. } = outcome else {
        panic!("{outcome:?}")
    };
    assert_eq!(revisions.len(), 2);
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"label one:\n    \"changed\"\n"
    );
    assert_eq!(
        fs::read(fixture.root.join("game/two.rpy")).unwrap(),
        b"label two:\n    \"changed\"\n"
    );
    assert_eq!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::Flushed
    );
}

#[test]
fn create_new_and_replace_existing_share_one_recoverable_set() {
    let fixture = Fixture::new();
    let create = FileMutation {
        path: RelativePath::new("game/new.rpy").unwrap(),
        kind: MutationKind::CreateNew,
        base: Revision::expected_absence(),
        expected_bytes: Vec::new(),
        proposed: b"label new:\n    pass\n".to_vec(),
    };
    let replace = fixture.mutation("game/one.rpy", b"label one:\n    \"updated\"\n");
    let outcome = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![create, replace]));
    assert!(matches!(outcome, CommitOutcome::Committed { .. }));
    assert_eq!(
        fs::read(fixture.root.join("game/new.rpy")).unwrap(),
        b"label new:\n    pass\n"
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"label one:\n    \"updated\"\n"
    );
}

#[test]
fn create_new_refuses_an_existing_destination_without_overwrite() {
    let fixture = Fixture::new();
    let create = FileMutation {
        path: RelativePath::new("game/one.rpy").unwrap(),
        kind: MutationKind::CreateNew,
        base: Revision::expected_absence(),
        expected_bytes: Vec::new(),
        proposed: b"must not win\n".to_vec(),
    };
    let outcome = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![create]));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::AlreadyExists));
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"label one:\n    pass\n"
    );
}

#[test]
fn competing_create_is_preserved_as_a_conflict() {
    let fixture = Fixture::new();
    let create = FileMutation {
        path: RelativePath::new("game/race.rpy").unwrap(),
        kind: MutationKind::CreateNew,
        base: Revision::expected_absence(),
        expected_bytes: Vec::new(),
        proposed: b"accepted\n".to_vec(),
    };
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::write(root.join("game/race.rpy"), b"external winner\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture.service.commit_with_injector(
        &fixture.project,
        fixture.proposal(vec![create]),
        &mut hook,
    );
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::Conflict));
    assert_eq!(
        fs::read(fixture.root.join("game/race.rpy")).unwrap(),
        b"external winner\n"
    );
}

#[test]
fn interrupted_mixed_create_and_replace_blocks_follow_up() {
    let fixture = Fixture::new();
    let create = FileMutation {
        path: RelativePath::new("game/new.rpy").unwrap(),
        kind: MutationKind::CreateNew,
        base: Revision::expected_absence(),
        expected_bytes: Vec::new(),
        proposed: b"created\n".to_vec(),
    };
    let replace = fixture.mutation("game/one.rpy", b"replacement\n");
    let mut hook = Hook(|point, _root: &Path| {
        if point == FaultPoint::AfterExchange(0) {
            Err(ErrorCode::RecoveryRequired)
        } else {
            Ok(())
        }
    });
    let outcome = fixture.service.commit_with_injector(
        &fixture.project,
        fixture.proposal(vec![create, replace]),
        &mut hook,
    );
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert!(fixture
        .service
        .has_blocking_recovery(&fixture.project)
        .unwrap());
    assert!(matches!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::RecoveryRequired { .. }
    ));
    assert_eq!(
        fs::read(fixture.root.join("game/new.rpy")).unwrap(),
        b"created\n"
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"label one:\n    pass\n"
    );
}

#[test]
fn streaming_import_exceeds_old_memory_cap_and_commits_with_metadata() {
    use std::io::Write;
    let fixture = Fixture::new();
    let source_path = fixture.root.join("large-source.png");
    let mut source = File::create(&source_path).unwrap();
    let chunk = vec![0x5a; 1024 * 1024];
    let mut digest = Sha256::new();
    for _ in 0..17 {
        source.write_all(&chunk).unwrap();
        digest.update(&chunk);
    }
    drop(source);
    let expected = hex::encode(digest.finalize());
    let mut source = File::open(source_path).unwrap();
    let companion = fixture.mutation("game/one.rpy", b"metadata updated\n");
    let outcome = fixture.service.commit_streaming_import(
        &fixture.project,
        RelativePath::new("game/imported.png").unwrap(),
        &mut source,
        17 * 1024 * 1024,
        &expected,
        vec![companion],
    );
    assert!(
        matches!(outcome, CommitOutcome::Committed { .. }),
        "{outcome:?}"
    );
    assert_eq!(
        fs::metadata(fixture.root.join("game/imported.png"))
            .unwrap()
            .len(),
        17 * 1024 * 1024
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"metadata updated\n"
    );
}

#[test]
fn streaming_import_rejects_the_documented_maximum() {
    let fixture = Fixture::new();
    let source_path = fixture.root.join("tiny.png");
    fs::write(&source_path, b"x").unwrap();
    let mut source = File::open(source_path).unwrap();
    let outcome = fixture.service.commit_streaming_import(
        &fixture.project,
        RelativePath::new("game/imported.png").unwrap(),
        &mut source,
        MAX_IMPORT_BYTES + 1,
        &sha256(b"x"),
        Vec::new(),
    );
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::InvalidProposal));
    assert!(!fixture.root.join("game/imported.png").exists());
}

#[test]
fn rejects_stale_hash_and_changed_expected_bytes() {
    let fixture = Fixture::new();
    let mutation = fixture.mutation("game/one.rpy", b"loomlight\n");
    fs::write(fixture.root.join("game/one.rpy"), b"external\n").unwrap();
    let outcome = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![mutation]));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::StaleRevision));
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"external\n"
    );

    let fixture = Fixture::new();
    let mut mutation = fixture.mutation("game/one.rpy", b"loomlight\n");
    mutation.expected_bytes = b"different expectation\n".to_vec();
    let outcome = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![mutation]));
    assert_eq!(
        outcome_code(&outcome),
        Some(ErrorCode::ExpectedBytesChanged)
    );
}

#[test]
fn rejects_same_bytes_with_replaced_file_identity() {
    let fixture = Fixture::new();
    let mutation = fixture.mutation("game/one.rpy", b"loomlight\n");
    let target = fixture.root.join("game/one.rpy");
    let replacement = fixture.root.join("game/replacement.tmp");
    fs::write(&replacement, &mutation.expected_bytes).unwrap();
    fs::remove_file(&target).unwrap();
    fs::rename(&replacement, &target).unwrap();
    let outcome = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![mutation]));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::FileIdentityChanged));
}

#[test]
fn final_window_external_writer_is_preserved_as_conflict() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![
        fixture.mutation("game/one.rpy", b"accepted loomlight\n")
    ]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::write(root.join("game/one.rpy"), b"competing external\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::Conflict));
    assert_eq!(
        fs::read(artifact(&fixture.root, ".backup")).unwrap(),
        b"competing external\n"
    );
    assert_eq!(
        fs::read(artifact(&fixture.root, ".accepted")).unwrap(),
        b"accepted loomlight\n"
    );
    let report = fixture.service.recover(&fixture.project);
    assert_eq!(
        report.items[0].mutations,
        vec![RecoveryMutationState::ExchangeCompleteConflict]
    );
}

#[test]
fn external_writer_after_exchange_does_not_destroy_accepted_copy() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![
        fixture.mutation("game/one.rpy", b"accepted loomlight\n")
    ]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::AfterExchange(0) {
            fs::write(root.join("game/one.rpy"), b"later external\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::Conflict));
    assert_eq!(
        fs::read(artifact(&fixture.root, ".accepted")).unwrap(),
        b"accepted loomlight\n"
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"later external\n"
    );
    let report = fixture.service.recover(&fixture.project);
    assert_eq!(
        report.items[0].mutations,
        vec![RecoveryMutationState::ExternalRevisionWithAcceptedCopy]
    );
}

#[test]
fn delete_and_recreate_race_is_preserved() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![
        fixture.mutation("game/one.rpy", b"accepted loomlight\n")
    ]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            let target = root.join("game/one.rpy");
            fs::remove_file(&target).unwrap();
            fs::write(target, b"recreated external\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::Conflict));
    assert_eq!(
        fs::read(artifact(&fixture.root, ".backup")).unwrap(),
        b"recreated external\n"
    );
}

#[cfg(unix)]
#[test]
fn changed_root_identity_fails_closed() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"x")]);
    let root = fixture.root.clone();
    let moved = root.with_extension("moved-root");
    fs::rename(&root, &moved).unwrap();
    fs::create_dir(&root).unwrap();
    let outcome = fixture.service.commit(&fixture.project, proposal);
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::RootIdentityChanged));
    fs::remove_dir(&root).unwrap();
    fs::rename(&moved, &root).unwrap();
}

#[cfg(windows)]
#[test]
fn windows_approved_root_namespace_is_pinned() {
    let fixture = Fixture::new();
    let root = fixture.root.clone();
    let moved = root.with_extension("moved-root");
    assert!(fs::rename(&root, &moved).is_err());
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    assert!(matches!(
        fixture.service.commit(&fixture.project, proposal),
        CommitOutcome::Committed { .. }
    ));
}

#[test]
fn changed_parent_identity_fails_closed() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::MutationStaged(0) {
            fs::rename(root.join("game"), root.join("old-game")).unwrap();
            fs::create_dir(root.join("game")).unwrap();
            fs::write(root.join("game/one.rpy"), b"substitute\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(&outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(
        outcome_code(&outcome),
        Some(ErrorCode::ParentIdentityChanged)
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"substitute\n"
    );
}

#[test]
fn parent_delete_recreate_after_prepared_keeps_artifacts_inside_root() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::Prepared {
            fs::rename(root.join("game"), root.join("old-game")).unwrap();
            fs::create_dir(root.join("game")).unwrap();
            fs::write(root.join("game/one.rpy"), b"substitute\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(
        outcome_code(&outcome),
        Some(ErrorCode::ParentIdentityChanged)
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"substitute\n"
    );
    assert_eq!(
        fs::read(fixture.root.join("old-game/one.rpy")).unwrap(),
        b"label one:\n    pass\n"
    );
    assert!(!contains_artifact(&fixture.root.join("game"), ".stage"));
    assert!(!contains_artifact(&fixture.root.join("old-game"), ".stage"));
    assert!(contains_artifact(
        &transaction_directory(&fixture.root),
        ".accepted"
    ));
}

#[cfg(unix)]
#[test]
fn parent_replaced_after_prepared_cannot_redirect_artifact_creation() {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new();
    let outside = tempfile::tempdir().unwrap();
    let moved = outside.path().join("moved-approved-parent");
    let redirect = outside.path().join("redirect");
    fs::create_dir(&redirect).unwrap();
    fs::write(redirect.join("unrelated.rpy"), b"outside unchanged\n").unwrap();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::Prepared {
            fs::rename(root.join("game"), &moved).unwrap();
            symlink(&redirect, root.join("game")).unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::UnsafePath));
    assert_eq!(
        fs::read(redirect.join("unrelated.rpy")).unwrap(),
        b"outside unchanged\n"
    );
    assert!(!contains_artifact(&redirect, ".stage"));
    assert!(!contains_artifact(&redirect, ".accepted"));
    assert!(contains_artifact(
        &transaction_directory(&fixture.root),
        ".stage"
    ));
    assert!(contains_artifact(
        &transaction_directory(&fixture.root),
        ".accepted"
    ));
}

#[cfg(unix)]
#[test]
fn recovery_directory_substitution_cannot_redirect_artifact_creation() {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new();
    let outside = tempfile::tempdir().unwrap();
    let moved = outside.path().join("moved-transaction");
    let redirect = outside.path().join("redirect");
    fs::create_dir(&redirect).unwrap();
    fs::write(redirect.join("unrelated"), b"outside unchanged\n").unwrap();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::Prepared {
            let directory = transaction_directory(root);
            fs::rename(&directory, &moved).unwrap();
            symlink(&redirect, directory).unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(
        fs::read(redirect.join("unrelated")).unwrap(),
        b"outside unchanged\n"
    );
    assert!(!contains_artifact(&redirect, ".stage"));
    assert!(!contains_artifact(&redirect, ".accepted"));
    assert!(!contains_artifact(&moved, ".stage"));
    assert!(!contains_artifact(&moved, ".accepted"));
}

#[cfg(windows)]
#[test]
fn windows_recovery_directory_is_pinned_before_artifact_creation() {
    let fixture = Fixture::new();
    let outside = tempfile::tempdir().unwrap();
    let moved = outside.path().join("moved-transaction");
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut attempted = false;
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::Prepared {
            attempted = true;
            assert!(fs::rename(transaction_directory(root), &moved).is_err());
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    drop(hook);
    assert!(attempted);
    assert!(matches!(outcome, CommitOutcome::Committed { .. }));
    assert!(!moved.exists());
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"accepted\n"
    );
}

#[cfg(unix)]
#[test]
fn parent_replaced_at_exchange_boundary_is_rejected_before_exchange() {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new();
    let outside = tempfile::tempdir().unwrap();
    let moved = outside.path().join("moved-approved-parent");
    let redirect = outside.path().join("redirect");
    fs::create_dir(&redirect).unwrap();
    fs::write(redirect.join("one.rpy"), b"outside unchanged\n").unwrap();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::rename(root.join("game"), &moved).unwrap();
            symlink(&redirect, root.join("game")).unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(
        fs::read(moved.join("one.rpy")).unwrap(),
        b"label one:\n    pass\n"
    );
    assert_eq!(
        fs::read(redirect.join("one.rpy")).unwrap(),
        b"outside unchanged\n"
    );
    assert_eq!(
        fs::read(artifact(&fixture.root, ".accepted")).unwrap(),
        b"accepted\n"
    );
}

#[cfg(windows)]
#[test]
fn windows_parent_namespace_is_pinned_at_exchange_boundary() {
    let fixture = Fixture::new();
    let outside = tempfile::tempdir().unwrap();
    let moved = outside.path().join("moved-approved-parent");
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut attempted = false;
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            attempted = true;
            assert!(fs::rename(root.join("game"), &moved).is_err());
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(attempted);
    assert!(matches!(outcome, CommitOutcome::Committed { .. }));
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"accepted\n"
    );
}

#[cfg(unix)]
#[test]
fn target_symlink_substitution_at_exchange_never_changes_external_bytes() {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new();
    let outside = tempfile::NamedTempFile::new().unwrap();
    fs::write(outside.path(), b"outside unchanged\n").unwrap();
    let outside_path = outside.path().to_path_buf();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::remove_file(root.join("game/one.rpy")).unwrap();
            symlink(&outside_path, root.join("game/one.rpy")).unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(fs::read(outside.path()).unwrap(), b"outside unchanged\n");
    assert_eq!(
        fs::read(artifact(&fixture.root, ".accepted")).unwrap(),
        b"accepted\n"
    );
}

#[cfg(windows)]
#[test]
fn windows_target_symlink_substitution_at_exchange_never_changes_external_bytes() {
    use std::os::windows::fs::symlink_file;
    let fixture = Fixture::new();
    let outside = tempfile::NamedTempFile::new().unwrap();
    fs::write(outside.path(), b"outside unchanged\n").unwrap();
    let outside_path = outside.path().to_path_buf();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::remove_file(root.join("game/one.rpy")).unwrap();
            symlink_file(&outside_path, root.join("game/one.rpy"))
                .expect("runner must support symlink evidence");
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(
        outcome,
        CommitOutcome::RecoveryRequired { .. } | CommitOutcome::Conflict { .. }
    ));
    assert_eq!(fs::read(outside.path()).unwrap(), b"outside unchanged\n");
    assert_eq!(
        fs::read(artifact(&fixture.root, ".accepted")).unwrap(),
        b"accepted\n"
    );
}

#[cfg(unix)]
#[test]
fn symlink_substitution_is_denied_without_touching_outside() {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new();
    let outside = fixture
        .root
        .parent()
        .unwrap()
        .join(format!("outside-{}.rpy", new_id("test")));
    fs::write(&outside, b"outside\n").unwrap();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let outside_for_hook = outside.clone();
    let mut hook = Hook(move |point, root: &Path| {
        if point == FaultPoint::MutationStaged(0) {
            fs::remove_file(root.join("game/one.rpy")).unwrap();
            symlink(&outside_for_hook, root.join("game/one.rpy")).unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(&outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::UnsafePath));
    assert_eq!(fs::read(&outside).unwrap(), b"outside\n");
    fs::remove_file(outside).unwrap();
}

#[cfg(windows)]
#[test]
fn reparse_or_symlink_substitution_is_denied_without_touching_outside() {
    use std::os::windows::fs::symlink_file;
    let fixture = Fixture::new();
    let outside = fixture
        .root
        .parent()
        .unwrap()
        .join(format!("outside-{}.rpy", new_id("test")));
    fs::write(&outside, b"outside\n").unwrap();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let outside_for_hook = outside.clone();
    let mut hook = Hook(move |point, root: &Path| {
        if point == FaultPoint::MutationStaged(0) {
            fs::remove_file(root.join("game/one.rpy")).unwrap();
            symlink_file(&outside_for_hook, root.join("game/one.rpy"))
                .expect("runner must support symlink evidence");
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(&outcome, CommitOutcome::RecoveryRequired { .. }));
    assert_eq!(outcome_code(&outcome), Some(ErrorCode::UnsafePath));
    assert_eq!(fs::read(&outside).unwrap(), b"outside\n");
    fs::remove_file(outside).unwrap();
}

#[test]
fn every_persistent_transition_has_bounded_recovery() {
    let points = [
        FaultPoint::Prepared,
        FaultPoint::MutationStaged(0),
        FaultPoint::BeforeExchange(0),
        FaultPoint::AfterExchange(0),
        FaultPoint::Verified(0),
        FaultPoint::Committed,
        FaultPoint::Durable,
    ];
    for stop in points {
        let fixture = Fixture::new();
        let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
        let mut hook = Hook(|point, _root: &Path| {
            if point == stop {
                Err(ErrorCode::RecoveryRequired)
            } else {
                Ok(())
            }
        });
        let outcome = fixture
            .service
            .commit_with_injector(&fixture.project, proposal, &mut hook);
        assert_eq!(
            outcome_code(&outcome),
            Some(ErrorCode::RecoveryRequired),
            "{stop:?}"
        );
        let report = fixture.service.recover(&fixture.project);
        assert_eq!(report.items.len(), 1, "{stop:?}");
        assert!(
            !matches!(report.items[0].state, JournalState::Proposed),
            "{stop:?}"
        );
    }
}

#[test]
fn process_termination_at_each_persistent_boundary_is_recoverable() {
    let points = [
        "prepared",
        "staged",
        "commit-intent",
        "exchanged",
        "verified",
        "committed",
        "durable",
    ];
    for point in points {
        let fixture = Fixture::new();
        let status = std::process::Command::new(std::env::current_exe().unwrap())
            .args(["--ignored", "--exact", "transaction::tests::crash_worker"])
            .env("LOOMLIGHT_CRASH_ROOT", &fixture.root)
            .env("LOOMLIGHT_CRASH_POINT", point)
            .status()
            .unwrap();
        assert_eq!(status.code(), Some(86), "{point}");
        let service = TransactionService::default();
        let project = service.register_trusted_project(&fixture.root).unwrap();
        let report = service.recover(&project);
        assert_eq!(report.items.len(), 1, "{point}");
        assert!(!matches!(report.items[0].state, JournalState::Proposed));
    }
}

#[test]
fn prepared_process_termination_can_be_safely_abandoned() {
    let fixture = Fixture::new();
    let status = std::process::Command::new(std::env::current_exe().unwrap())
        .args(["--ignored", "--exact", "transaction::tests::crash_worker"])
        .env("LOOMLIGHT_CRASH_ROOT", &fixture.root)
        .env("LOOMLIGHT_CRASH_POINT", "prepared")
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(86));

    let unrelated = fixture.root.join("game/unrelated.rpy");
    fs::write(&unrelated, b"unrelated\n").unwrap();
    let service = TransactionService::default();
    let project = service.register_trusted_project(&fixture.root).unwrap();
    let report = service.recover(&project);
    assert_eq!(report.items.len(), 1);
    assert_eq!(report.items[0].state, JournalState::Prepared);
    assert_eq!(
        report.items[0].mutations,
        vec![RecoveryMutationState::PreparedWithoutStage]
    );
    service
        .finalize_recovery(&project, &report.items[0].transaction_id)
        .unwrap();
    assert_eq!(service.flush(&project), FlushOutcome::Flushed);
    assert_eq!(fs::read(&unrelated).unwrap(), b"unrelated\n");

    let relative = RelativePath::new("game/one.rpy").unwrap();
    let (expected_bytes, base) = service.snapshot(&project, relative.clone()).unwrap();
    let outcome = service.commit(
        &project,
        TransactionProposal {
            mutations: vec![FileMutation {
                path: relative,
                kind: MutationKind::ReplaceExisting,
                base,
                expected_bytes,
                proposed: b"after prepared recovery\n".to_vec(),
            }],
            intent: TransactionIntent::Edit,
        },
    );
    assert!(matches!(outcome, CommitOutcome::Committed { .. }));
}

#[test]
fn prepared_abandon_refuses_any_persisted_proposal_evidence() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, _root: &Path| {
        if point == FaultPoint::Prepared {
            Err(ErrorCode::RecoveryRequired)
        } else {
            Ok(())
        }
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    let CommitOutcome::RecoveryRequired { diagnostic } = outcome else {
        panic!()
    };
    let txid = diagnostic.transaction_id.unwrap();
    let directory = fixture.root.join(".renpy-editor/recovery").join(&txid);
    fs::write(
        directory.join(format!(".loomlight-{txid}-0-one.rpy.accepted")),
        b"accepted evidence\n",
    )
    .unwrap();
    assert_eq!(
        fixture
            .service
            .finalize_recovery(&fixture.project, &txid)
            .unwrap_err()
            .code,
        ErrorCode::RecoveryRequired
    );
    assert!(matches!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::RecoveryRequired { .. }
    ));
}

#[test]
fn terminal_rejected_journal_does_not_block_flush_or_later_commit() {
    let fixture = Fixture::new();
    let stale = fixture.mutation("game/one.rpy", b"stale proposal\n");
    fs::write(fixture.root.join("game/one.rpy"), b"newer external\n").unwrap();
    let rejected = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![stale]));
    assert_eq!(outcome_code(&rejected), Some(ErrorCode::StaleRevision));
    let report = fixture.service.recover(&fixture.project);
    assert!(matches!(
        report.items[0].state,
        JournalState::Rejected {
            code: ErrorCode::StaleRevision
        }
    ));
    assert_eq!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::Flushed
    );
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"newer external\n"
    );

    let valid = fixture.mutation("game/one.rpy", b"later valid\n");
    let committed = fixture
        .service
        .commit(&fixture.project, fixture.proposal(vec![valid]));
    assert!(matches!(committed, CommitOutcome::Committed { .. }));
    assert_eq!(
        fs::read(fixture.root.join("game/one.rpy")).unwrap(),
        b"later valid\n"
    );
}

#[test]
#[ignore = "subprocess worker invoked by the crash-boundary test"]
fn crash_worker() {
    let root = PathBuf::from(std::env::var_os("LOOMLIGHT_CRASH_ROOT").unwrap());
    let stop = std::env::var("LOOMLIGHT_CRASH_POINT").unwrap();
    let service = TransactionService::default();
    let project = service.register_trusted_project(&root).unwrap();
    let relative = RelativePath::new("game/one.rpy").unwrap();
    let (expected_bytes, base) = service.snapshot(&project, relative.clone()).unwrap();
    let proposal = TransactionProposal {
        mutations: vec![FileMutation {
            path: relative,
            kind: MutationKind::ReplaceExisting,
            base,
            expected_bytes,
            proposed: b"accepted before termination\n".to_vec(),
        }],
        intent: TransactionIntent::Edit,
    };
    let mut hook = Hook(|point, _root: &Path| {
        let name = match point {
            FaultPoint::Prepared => "prepared",
            FaultPoint::MutationStaged(0) => "staged",
            FaultPoint::BeforeExchange(0) => "commit-intent",
            FaultPoint::AfterExchange(0) => "exchanged",
            FaultPoint::Verified(0) => "verified",
            FaultPoint::Committed => "committed",
            FaultPoint::Durable => "durable",
            _ => "",
        };
        if name == stop {
            std::process::exit(86);
        }
        Ok(())
    });
    let _ = service.commit_with_injector(&project, proposal, &mut hook);
    panic!("crash point was not reached");
}

#[test]
fn partial_newest_journal_and_stale_temporary_are_bounded() {
    let fixture = Fixture::new();
    let outcome = fixture.service.commit(
        &fixture.project,
        fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]),
    );
    let CommitOutcome::Committed { transaction_id, .. } = outcome else {
        panic!()
    };
    let directory = fixture
        .root
        .join(".renpy-editor/recovery")
        .join(&transaction_id);
    let mut journals: Vec<_> = fs::read_dir(&directory)
        .unwrap()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_name().to_string_lossy().ends_with(".json"))
        .collect();
    journals.sort_by_key(|entry| entry.metadata().and_then(|m| m.modified()).ok());
    fs::write(journals.last().unwrap().path(), b"{partial").unwrap();
    fs::write(directory.join("journal.0.tmp"), b"stale partial").unwrap();
    let report = fixture.service.recover(&fixture.project);
    assert_eq!(report.items.len(), 1);
    assert_ne!(report.items[0].state, JournalState::Proposed);
}

#[test]
fn recovery_cleanup_deletes_only_owned_partial_slots() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, _root: &Path| {
        if point == FaultPoint::AfterExchange(0) {
            Err(ErrorCode::RecoveryRequired)
        } else {
            Ok(())
        }
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    let CommitOutcome::RecoveryRequired { diagnostic } = outcome else {
        panic!()
    };
    let txid = diagnostic.transaction_id.unwrap();
    let directory = fixture.root.join(".renpy-editor/recovery").join(&txid);
    fs::write(directory.join("journal.0.tmp"), b"partial").unwrap();
    let unrelated = fixture.root.join("game/user.recovery");
    fs::write(&unrelated, b"user data\n").unwrap();
    fixture
        .service
        .finalize_recovery(&fixture.project, &txid)
        .unwrap();
    assert!(!directory.join("journal.0.tmp").exists());
    assert_eq!(fs::read(unrelated).unwrap(), b"user data\n");
    assert!(artifact(&fixture.root, ".accepted").exists());
    assert!(artifact(&fixture.root, ".backup").exists());
    assert_eq!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::Flushed
    );
}

#[test]
fn explicit_flush_reports_pending_work_and_conflicts() {
    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"pending accepted\n")]);
    let mut hook = Hook(|point, _root: &Path| {
        if point == FaultPoint::MutationStaged(0) {
            Err(ErrorCode::RecoveryRequired)
        } else {
            Ok(())
        }
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::RecoveryRequired { .. }));
    assert!(matches!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::RecoveryRequired { .. }
    ));

    let fixture = Fixture::new();
    let proposal = fixture.proposal(vec![fixture.mutation("game/one.rpy", b"accepted\n")]);
    let mut hook = Hook(|point, root: &Path| {
        if point == FaultPoint::BeforeExchange(0) {
            fs::write(root.join("game/one.rpy"), b"external\n").unwrap();
        }
        Ok(())
    });
    let outcome = fixture
        .service
        .commit_with_injector(&fixture.project, proposal, &mut hook);
    assert!(matches!(outcome, CommitOutcome::Conflict { .. }));
    assert!(matches!(
        fixture.service.flush(&fixture.project),
        FlushOutcome::Conflict { .. }
    ));
}

#[test]
fn undo_and_redo_stop_at_external_revision_boundaries() {
    let fixture = Fixture::new();
    let path = RelativePath::new("game/one.rpy").unwrap();
    let (before_bytes, before_revision) = fixture
        .service
        .snapshot(&fixture.project, path.clone())
        .unwrap();
    let outcome = fixture.service.commit(
        &fixture.project,
        fixture.proposal(vec![FileMutation {
            path: path.clone(),
            kind: MutationKind::ReplaceExisting,
            base: before_revision.clone(),
            expected_bytes: before_bytes.clone(),
            proposed: b"after\n".to_vec(),
        }]),
    );
    let CommitOutcome::Committed {
        transaction_id,
        revisions,
    } = outcome
    else {
        panic!()
    };
    let after_revision = revisions[0].clone();
    let mut history = HistoryStack::default();
    history.push(HistoryEntry {
        transaction_id,
        mutations: vec![HistoryMutation {
            path: path.clone(),
            before_revision,
            before_bytes,
            after_revision: after_revision.clone(),
            after_bytes: b"after\n".to_vec(),
        }],
    });
    let mut current = HashMap::from([(path.clone(), after_revision.clone())]);
    assert_eq!(
        history.undo_proposal(&current).unwrap().intent,
        TransactionIntent::Undo
    );
    current.get_mut(&path).unwrap().sha256 = "0".repeat(64);
    assert_eq!(
        history.undo_proposal(&current),
        Err(ErrorCode::HistoryBoundary)
    );
    history.accepted_undo().unwrap();
    assert_eq!(
        history.redo_proposal(&current),
        Err(ErrorCode::HistoryBoundary)
    );
}

#[test]
fn public_errors_never_contain_paths_or_file_bytes() {
    let diagnostic = PublicDiagnostic::new(ErrorCode::IoFailure, Some("tx-1".into()));
    let serialized = serde_json::to_string(&diagnostic).unwrap();
    assert!(!serialized.contains("/private"));
    assert!(!serialized.contains("label one"));
}
