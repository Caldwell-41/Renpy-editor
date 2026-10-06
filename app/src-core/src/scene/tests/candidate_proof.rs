use super::*;
use crate::scene::flow::candidate::{self, Boundary, Index};
use crate::transaction::candidate::Probe;
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
fn fixed_fixture() -> Fixture {
    let fixture = Fixture::new(b"label scene_one:\n    return\n");
    fixture.migrate();
    fs::write(
        fixture.root.join("game/script.rpy"),
        b"label start:\n    jump scene_one\n",
    )
    .unwrap();
    let mut loaded = fixture
        .service
        .load(&fixture.project, &fixture.project_id)
        .unwrap();
    let template = loaded.project.scenes[0].clone();
    loaded.project.scenes.clear();
    loaded.source_map.scene_mappings.clear();
    loaded.source_map.sources.clear();
    for i in 0..500 {
        let mut scene = template.clone();
        scene.id = uuid::Uuid::new_v4().to_string();
        scene.technical_label = format!("scene_{i:03}");
        scene.display_name = format!("Scene {i:03}");
        scene.source_path = format!("game/chapters/chapter_01/scene_{i:03}.rpy");
        loaded.project.scenes.push(scene);
    }
    loaded.project.entry_scene_id = Some(loaded.project.scenes[0].id.clone());
    loaded.project.last_open.scene_id = loaded.project.scenes[0].id.clone();
    // Remove the original file before building the unchanged synthetic workload.
    fs::remove_file(fixture.root.join(&template.source_path)).unwrap();
    for (i, scene) in loaded.project.scenes.iter().enumerate() {
        let mut source = format!("label {}:\n    menu:\n", scene.technical_label);
        for offset in 0..4 {
            source.push_str(&format!(
                "        \"Route {offset}\":\n            jump scene_{:03}\n",
                (i + offset) % 500
            ));
        }
        let (mapping, _) = build_mapping(
            scene,
            source.as_bytes(),
            &sha256(source.as_bytes()),
            None,
            &[],
            Some((&loaded.project, &loaded.authoring)),
        )
        .unwrap();
        fs::write(fixture.root.join(&scene.source_path), source).unwrap();
        loaded.source_map.sources.push(scene.source_path.clone());
        loaded.source_map.scene_mappings.push(mapping);
    }
    fs::write(
        fixture.root.join(PROJECT_PATH),
        json_bytes(&loaded.project).unwrap(),
    )
    .unwrap();
    fs::write(
        fixture.root.join(SOURCE_MAP_PATH),
        json_bytes(&loaded.source_map).unwrap(),
    )
    .unwrap();
    fs::write(
        fixture.root.join("game/script.rpy"),
        b"label start:\n    jump scene_000\n",
    )
    .unwrap();
    fixture
}
fn observe(
    f: &Fixture,
    index: &mut Index,
    hook: impl FnMut(&mut Index, Boundary),
) -> Result<flow::FlowWorkspace, SceneError> {
    candidate::observe(
        &f.service,
        &f.project,
        &f.project_id,
        1,
        index,
        Arc::new(Probe::default()),
        hook,
    )
}
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_feasibility() {
    let f = fixed_fixture();
    let mut index = Index::default();
    let mut times = Vec::new();
    let mut run = |index: &mut Index| {
        let probe = Arc::new(Probe::default());
        let start = Instant::now();
        let graph = candidate::observe(
            &f.service,
            &f.project,
            &f.project_id,
            1,
            index,
            probe.clone(),
            |_, _| {},
        )
        .unwrap();
        times.push(start.elapsed());
        assert_eq!(graph.nodes.len(), 500);
        assert_eq!(graph.edges.len(), 2000);
        assert!(!graph.stale && !graph.partial && !graph.over_limit);
        println!(
            "g1-o1-native: hashes={};bytes={};descriptor_upper_bound={};operations={:?}",
            probe.hashes.load(std::sync::atomic::Ordering::Relaxed),
            probe.bytes.load(std::sync::atomic::Ordering::Relaxed),
            probe
                .peak_descriptors_bound
                .load(std::sync::atomic::Ordering::Relaxed),
            probe.stages.lock().unwrap()
        );
        graph
    };
    let cold = run(&mut index);
    assert_eq!((index.last.acquired, index.last.verified), (503, 503));
    assert_eq!(index.last.source_bytes, 105627);
    assert_eq!(index.last.retained_peak, index.retained());
    let warm = run(&mut index);
    assert_eq!((index.last.acquired, index.last.verified), (0, 503));
    assert_eq!(cold.revision, warm.revision);
    let workspace = f.workspace();
    let origin = &workspace.scenes[0];
    let BeatPayload::Choice { mut options } = origin.beats[0].payload.clone() else {
        panic!("choice fixture")
    };
    options[0].text = "Route A".into();
    let path = warm.nodes[0].location.as_ref().unwrap().path.clone();
    let before = Instant::now();
    index.invalidate(Some(std::slice::from_ref(&path)));
    let before_hook = before.elapsed();
    f.apply(
        &workspace,
        SceneCommand::UpdateBeat {
            scene_id: origin.id.clone(),
            expected_source_revision: origin.source_revision.clone(),
            beat_id: origin.beats[0].id.clone(),
            beat: BeatPayload::Choice { options },
        },
    )
    .unwrap();
    // No hidden prewarm. Include the after-mutation invalidation in accepted timing.
    let after = Instant::now();
    index.invalidate(Some(&[path]));
    let after_hook = after.elapsed();
    let changed = run(&mut index);
    times[2] += before_hook + after_hook;
    assert_eq!((index.last.acquired, index.last.verified), (1, 503));
    assert_ne!(cold.revision, changed.revision);
    assert!(changed.edges.iter().any(|e| e.text == "Route A"));
    println!(
        "g1-o1-times: cold_ms={:.3};warm_ms={:.3};accepted_ms={:.3};mutation_hooks_ms={:.3}",
        times[0].as_secs_f64() * 1000.,
        times[1].as_secs_f64() * 1000.,
        times[2].as_secs_f64() * 1000.,
        (before_hook + after_hook).as_secs_f64() * 1000.
    );
    if std::env::var("LOOMLIGHT_ENFORCE_FLOW_BUDGETS").as_deref() == Ok("1") {
        assert!(!cfg!(debug_assertions));
        assert!(
            times[0] < Duration::from_secs(2),
            "cold budget failed: {:?}",
            times[0]
        );
        assert!(
            times[1] < Duration::from_millis(250),
            "warm budget failed: {:?}",
            times[1]
        );
        assert!(
            times[2] < Duration::from_millis(250),
            "accepted budget failed: {:?}",
            times[2]
        );
        println!("phase-1g-candidate-proof: passed");
    }
}

fn small() -> Fixture {
    let f = Fixture::new(b"label scene_one:\n    return\n");
    f.migrate();
    fs::write(
        f.root.join("game/script.rpy"),
        b"label start:\n    jump scene_one\n",
    )
    .unwrap();
    f
}
fn refused(result: Result<flow::FlowWorkspace, SceneError>) {
    if let Ok(graph) = result {
        assert!(graph.stale || graph.over_limit);
        assert!(graph.edges.iter().all(|e| !e.editable));
    }
}
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_external_bytes_identity_and_inventory() {
    use std::io::{Seek, SeekFrom, Write};
    for boundary in [
        Boundary::Acquired,
        Boundary::Projected,
        Boundary::BeforeVerification,
    ] {
        for case in 0..7 {
            let f = small();
            let mut index = Index::default();
            let path = f.root.join("game/script.rpy");
            let old = fs::metadata(&path).unwrap().modified().unwrap();
            assert!(!observe(&f, &mut index, |_, _| {}).unwrap().stale);
            let result = observe(&f, &mut index, |_, p| {
                if p != boundary {
                    return;
                }
                match case {
                    0 => {
                        let mut file = fs::OpenOptions::new().write(true).open(&path).unwrap();
                        for bytes in [
                            b"label start:\n    jump scene_two\n",
                            b"label start:\n    jump scene_new\n",
                        ] {
                            file.seek(SeekFrom::Start(0)).unwrap();
                            file.write_all(bytes).unwrap();
                            file.flush().unwrap();
                            file.set_times(fs::FileTimes::new().set_modified(old))
                                .unwrap();
                        }
                    }
                    1 => {
                        let replacement = f.root.join("game/new.tmp");
                        fs::write(&replacement, fs::read(&path).unwrap()).unwrap();
                        fs::rename(replacement, &path).unwrap();
                    }
                    2 => {
                        fs::remove_file(&path).unwrap();
                    }
                    3 => {
                        fs::rename(&path, f.root.join("game/Script.rpy")).unwrap();
                    }
                    4 => {
                        fs::create_dir(f.root.join("game/new-tree")).unwrap();
                        fs::write(
                            f.root.join("game/new-tree/unmapped.rpy"),
                            b"label start:\n    return\n",
                        )
                        .unwrap();
                    }
                    5 => {
                        let p = f.root.join("game/definitions/variables.rpy");
                        let bytes = fs::read(&p).unwrap();
                        fs::write(p, vec![b'#'; bytes.len()]).unwrap();
                    }
                    _ => {
                        fs::remove_file(&path).unwrap();
                        fs::write(&path, b"label start:\n    jump scene_one\n").unwrap();
                    }
                }
            });
            refused(result);
            assert_eq!(index.retained(), 0);
        }
    }
}
#[cfg(unix)]
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_mapped_write_without_notifications() {
    use std::os::fd::AsRawFd;
    let f = small();
    let mut index = Index::default();
    observe(&f, &mut index, |_, _| {}).unwrap();
    let file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .open(f.root.join("game/script.rpy"))
        .unwrap();
    let length = file.metadata().unwrap().len() as usize;
    let mapped = unsafe {
        libc::mmap(
            std::ptr::null_mut(),
            length,
            libc::PROT_READ | libc::PROT_WRITE,
            libc::MAP_SHARED,
            file.as_raw_fd(),
            0,
        )
    };
    assert_ne!(mapped, libc::MAP_FAILED);
    refused(observe(&f, &mut index, |_, p| {
        if p == Boundary::Projected {
            unsafe {
                *(mapped as *mut u8).add(27) = b'x';
                assert_eq!(libc::msync(mapped, length, libc::MS_SYNC), 0);
            }
        }
    }));
    assert_eq!(unsafe { libc::munmap(mapped, length) }, 0);
}
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_generation_metadata_cancellation_and_session() {
    for boundary in [
        Boundary::Metadata,
        Boundary::Acquired,
        Boundary::Projected,
        Boundary::BeforeVerification,
        Boundary::Verified,
        Boundary::Publication,
    ] {
        let f = small();
        let mut index = Index::default();
        observe(&f, &mut index, |_, _| {}).unwrap();
        refused(observe(&f, &mut index, |i, p| {
            if p == boundary {
                i.invalidate(None)
            }
        }));
        assert_eq!(index.retained(), 0);
        let cancel = Arc::new(crate::runtime_work::Cancellation::default());
        crate::runtime_work::scoped(cancel.clone(), || {
            refused(observe(&f, &mut index, |_, p| {
                if p == boundary {
                    cancel.cancel()
                }
            }));
        });
        assert_eq!(index.retained(), 0);
    }
    for path in [
        PROJECT_PATH,
        SOURCE_MAP_PATH,
        ".renpy-editor/authoring.json",
    ] {
        let f = small();
        let mut index = Index::default();
        observe(&f, &mut index, |_, _| {}).unwrap();
        refused(observe(&f, &mut index, |_, p| {
            if p == Boundary::Projected {
                let path = f.root.join(path);
                let mut bytes = fs::read(&path).unwrap();
                bytes.push(b' ');
                fs::write(path, bytes).unwrap();
            }
        }));
    }
    let f = small();
    let mut index = Index::default();
    observe(&f, &mut index, |_, _| {}).unwrap();
    let graph = candidate::observe(
        &f.service,
        &f.project,
        &f.project_id,
        2,
        &mut index,
        Arc::new(Probe::default()),
        |_, _| {},
    )
    .unwrap();
    assert!(!graph.stale);
    assert_eq!(index.last.acquired, 4);
    refused(observe(&f, &mut index, |_, p| {
        if p == Boundary::Publication {
            f.service
                .transactions
                .unregister_trusted_project(&f.project)
        }
    }));
    assert_eq!(index.retained(), 0);
}
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_absent_authoring_and_poisoned_index_cannot_authorize_scene_write() {
    let f = small();
    fs::remove_file(f.root.join(".renpy-editor/authoring.json")).unwrap();
    let mut index = Index::default();
    assert!(!observe(&f, &mut index, |_, _| {}).unwrap().stale);
    refused(observe(&f, &mut index, |_, p| {
        if p == Boundary::Projected {
            fs::write(
                f.root.join(".renpy-editor/authoring.json"),
                json_bytes(&AuthoringMetadata::empty(f.project_id.clone())).unwrap(),
            )
            .unwrap();
        }
    }));
    let workspace = f.workspace();
    let origin = &workspace.scenes[0];
    let path = f.root.join("game/chapters/chapter_01/scene_001.rpy");
    let external = b"label scene_one:\n    # competing writer\n    return\n";
    fs::write(&path, external).unwrap();
    index.invalidate(None);
    assert!(f
        .apply(
            &workspace,
            SceneCommand::UpdateBeat {
                scene_id: origin.id.clone(),
                expected_source_revision: origin.source_revision.clone(),
                beat_id: origin.beats[0].id.clone(),
                beat: BeatPayload::Return
            }
        )
        .is_err());
    assert_eq!(fs::read(path).unwrap(), external);
}

#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_graph_equivalence_eviction_limits_and_recovery_events() {
    let f = small();
    let mut index = Index::default();
    for _ in 0..3 {
        let graph = observe(&f, &mut index, |_, _| {}).unwrap();
        let old = f.service.flow_workspace(&f.project, &f.project_id).unwrap();
        assert_eq!(
            serde_json::to_value(graph).unwrap(),
            serde_json::to_value(old).unwrap()
        );
        index.invalidate(None); // unknown/overflow/recovery: no surviving source candidate
        assert_eq!(index.retained(), 0);
    }
    let huge = fs::File::create(f.root.join("game/huge.rpy")).unwrap();
    huge.set_len(16 * 1024 * 1024 + 1).unwrap();
    refused(observe(&f, &mut index, |_, _| {}));
    assert_eq!(index.retained(), 0);
    fs::remove_file(f.root.join("game/huge.rpy")).unwrap();
    for i in 0..2045 {
        fs::write(f.root.join(format!("game/extra_{i}.rpy")), b"# harmless\n").unwrap();
    }
    let graph = observe(&f, &mut index, |_, _| {}).unwrap();
    assert!(graph.over_limit);
    assert!(graph.nodes.is_empty());
}

#[cfg(windows)]
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_windows_mapped_write_without_notifications() {
    use std::os::windows::io::AsRawHandle;
    #[link(name = "kernel32")]
    extern "system" {
        fn CreateFileMappingW(
            file: *mut std::ffi::c_void,
            security: *const std::ffi::c_void,
            protect: u32,
            high: u32,
            low: u32,
            name: *const u16,
        ) -> *mut std::ffi::c_void;
        fn MapViewOfFile(
            mapping: *mut std::ffi::c_void,
            access: u32,
            high: u32,
            low: u32,
            bytes: usize,
        ) -> *mut std::ffi::c_void;
        fn FlushViewOfFile(base: *const std::ffi::c_void, bytes: usize) -> i32;
        fn UnmapViewOfFile(base: *const std::ffi::c_void) -> i32;
        fn CloseHandle(handle: *mut std::ffi::c_void) -> i32;
    }
    let f = small();
    let mut index = Index::default();
    observe(&f, &mut index, |_, _| {}).unwrap();
    let file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .open(f.root.join("game/script.rpy"))
        .unwrap();
    let mapping = unsafe {
        CreateFileMappingW(
            file.as_raw_handle(),
            std::ptr::null(),
            4,
            0,
            0,
            std::ptr::null(),
        )
    };
    assert!(!mapping.is_null());
    let mapped = unsafe { MapViewOfFile(mapping, 2, 0, 0, 0) };
    assert!(!mapped.is_null());
    refused(observe(&f, &mut index, |_, p| {
        if p == Boundary::Projected {
            unsafe {
                *(mapped as *mut u8).add(27) = b'x';
                assert_ne!(FlushViewOfFile(mapped, 0), 0);
            }
        }
    }));
    assert_ne!(unsafe { UnmapViewOfFile(mapped) }, 0);
    assert_ne!(unsafe { CloseHandle(mapping) }, 0);
}

// Negative feasibility evidence: green execution means the NO-GO counterexample
// reproduced, not that this reader qualifies for production.
#[test]
#[ignore = "specialist historical ADR 0009 experiment; superseded by ADR 0010"]
fn g1_o1_counterexample_projection_accepts_replaced_leaf_identity() {
    use crate::transaction::candidate::Point;
    use std::sync::atomic::{AtomicBool, Ordering};
    let f = small();
    let mut index = Index::default();
    observe(&f, &mut index, |_, _| {}).unwrap();
    let first = f
        .service
        .transactions
        .inventory_files_bounded(&f.project, "game", 8192)
        .unwrap()
        .into_iter()
        .find(|p| p.ends_with(".rpy"))
        .unwrap();
    let path = RelativePath::new(first).unwrap();
    let (bytes, expected) = f
        .service
        .transactions
        .snapshot(&f.project, path.clone())
        .unwrap();
    let replacement = f.root.join("candidate-replacement.tmp");
    fs::write(&replacement, bytes).unwrap();
    let leaf = f.root.join(path.as_str());
    let once = AtomicBool::new(false);
    let probe = Arc::new(Probe {
        hook: Some(Arc::new(move |point| {
            if point == Point::LeafOpened && !once.swap(true, Ordering::SeqCst) {
                fs::rename(&replacement, &leaf).unwrap();
            }
        })),
        ..Probe::default()
    });
    let graph = candidate::observe(
        &f.service,
        &f.project,
        &f.project_id,
        1,
        &mut index,
        probe,
        |_, _| {},
    )
    .unwrap();
    let (_, current) = f.service.transactions.snapshot(&f.project, path).unwrap();
    assert_ne!(expected.identity, current.identity);
    assert_eq!(expected.sha256, current.sha256);
    assert!(
        !graph.stale,
        "counterexample no longer reproduces: reassess qualification"
    );
    println!("g1-o1-safety-counterexample: fresh graph after verifier pathname replacement; NO-GO");
}
