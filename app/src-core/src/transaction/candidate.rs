//! Test harness only: bounded compound source reader, no write authority.
use super::*;
use std::{
    collections::BTreeMap,
    sync::atomic::AtomicUsize,
    time::{Duration, Instant},
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Point {
    ChainValidated,
    LeafMetadata,
    LeafOpened,
    BeforeRead,
    Chunk,
    AfterRead,
}
#[derive(Default)]
pub(crate) struct Probe {
    pub stages: Mutex<BTreeMap<&'static str, (usize, Duration)>>,
    pub hook: Option<Arc<dyn Fn(Point) + Send + Sync>>,
    pub bytes: AtomicUsize,
    pub hashes: AtomicUsize,
    pub peak_descriptors_bound: AtomicUsize,
    pub live_readers: AtomicUsize,
    pub peak_readers: AtomicUsize,
    pub scratch_live: AtomicUsize,
    pub scratch_peak: AtomicUsize,
}
impl Probe {
    pub fn visit(&self, point: Point) -> Result<(), ErrorCode> {
        if let Some(hook) = &self.hook {
            hook(point);
        }
        crate::runtime_work::check()
    }
    pub fn record(&self, stage: &'static str, elapsed: Duration) {
        let mut stages = self.stages.lock().unwrap();
        let item = stages.entry(stage).or_default();
        item.0 += 1;
        item.1 += elapsed;
    }
}
pub(crate) struct Reader<'a> {
    service: &'a TransactionService,
    project: ProjectId,
    parent: Option<(PathBuf, DirectoryAnchor)>,
    pub probe: Arc<Probe>,
}
impl TransactionService {
    pub(crate) fn candidate_reader(
        &self,
        project: &ProjectId,
        probe: Arc<Probe>,
    ) -> Result<Reader<'_>, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        let live = probe.live_readers.fetch_add(1, Ordering::Relaxed) + 1;
        probe.peak_readers.fetch_max(live, Ordering::Relaxed);
        Ok(Reader {
            service: self,
            project: project.clone(),
            parent: None,
            probe,
        })
    }
    pub(crate) fn candidate_session(
        &self,
        project: &ProjectId,
    ) -> Result<FileIdentity, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        if let Some(code) = blocking_recovery_code(&approved) {
            return Err(diag(code));
        }
        Ok(approved.identity)
    }
    pub(crate) fn candidate_batch(
        &self,
        project: &ProjectId,
        paths: &[String],
        maximum: usize,
        remaining: &AtomicUsize,
        retain: bool,
        probe: Arc<Probe>,
    ) -> Result<Vec<(Vec<u8>, Revision)>, PublicDiagnostic> {
        if paths.len() > 2048 {
            return Err(diag(ErrorCode::InvalidProposal));
        }
        let workers = paths.len().div_ceil(128).clamp(1, 4);
        if paths.is_empty() {
            return Ok(vec![]);
        }
        std::thread::scope(|scope| {
            let mut handles = Vec::new();
            for chunk in paths.chunks(paths.len().div_ceil(workers)) {
                let probe = probe.clone();
                let work = crate::runtime_work::inherited(move || {
                    let mut reader = self.candidate_reader(project, probe)?;
                    chunk
                        .iter()
                        .map(|path| {
                            reader.read(
                                &RelativePath::new(path).map_err(diag)?,
                                maximum,
                                remaining,
                                retain,
                            )
                        })
                        .collect::<Result<Vec<_>, _>>()
                });
                handles.push(
                    std::thread::Builder::new()
                        .spawn_scoped(scope, work)
                        .map_err(|_| diag(ErrorCode::IoFailure))?,
                );
            }
            let mut results = Vec::new();
            for handle in handles {
                results.extend(handle.join().map_err(|_| diag(ErrorCode::IoFailure))??);
            }
            Ok(results)
        })
    }
}
impl Drop for Reader<'_> {
    fn drop(&mut self) {
        self.probe.live_readers.fetch_sub(1, Ordering::Relaxed);
    }
}
struct Scratch<'a>(&'a Probe, usize);
impl Drop for Scratch<'_> {
    fn drop(&mut self) {
        self.0.scratch_live.fetch_sub(self.1, Ordering::Relaxed);
    }
}
impl Reader<'_> {
    pub(crate) fn read(
        &mut self,
        path: &RelativePath,
        maximum: usize,
        remaining: &AtomicUsize,
        retain: bool,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        let approved = self.service.approved(&self.project)?;
        crate::runtime_work::check().map_err(diag)?;
        let parent_path = path
            .as_path()
            .parent()
            .ok_or_else(|| diag(ErrorCode::UnsafePath))?;
        if self.parent.as_ref().is_none_or(|(p, _)| p != parent_path) {
            self.parent = None;
            let start = Instant::now();
            self.service.validate_root(&approved)?;
            let target = resolve_target(&approved.anchor, path, false).map_err(diag)?;
            self.parent = Some((parent_path.to_owned(), target.parent_anchor));
            self.probe.record("parent_acquisition", start.elapsed());
        }
        let anchor = &self.parent.as_ref().unwrap().1;
        // Conservative process bound: four chains, four leaves and one transient
        // directory-validation handle per worker, plus the shared registered root.
        self.probe
            .peak_descriptors_bound
            .fetch_max(1 + 4 * (anchor.candidate_depth() + 2), Ordering::Relaxed);
        let (mut file, before) = anchor
            .candidate_open(
                &approved.root,
                &approved.identity,
                path.as_path().file_name().unwrap(),
                &self.probe,
            )
            .map_err(diag)?;
        if before.length > maximum.min(MAX_MUTATION_BYTES) as u64 {
            return Err(diag(ErrorCode::InvalidProposal));
        }
        if retain {
            remaining
                .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |n| {
                    n.checked_sub(before.length as usize)
                })
                .map_err(|_| diag(ErrorCode::InvalidProposal))?;
        }
        let start = Instant::now();
        let mut bytes = Vec::new();
        if retain {
            bytes
                .try_reserve_exact(before.length as usize)
                .map_err(|_| diag(ErrorCode::IoFailure))?;
        }
        let mut hash = Sha256::new();
        let mut count = 0u64;
        self.probe.visit(Point::BeforeRead).map_err(diag)?;
        if retain {
            bytes.resize(before.length as usize, 0);
            for chunk in bytes.chunks_mut(1024 * 1024) {
                crate::runtime_work::check().map_err(diag)?;
                file.read_exact(chunk)
                    .map_err(|_| diag(ErrorCode::InvalidProposal))?;
                hash.update(&*chunk);
                count += chunk.len() as u64;
                self.probe.bytes.fetch_add(chunk.len(), Ordering::Relaxed);
                self.probe.visit(Point::Chunk).map_err(diag)?;
            }
            let mut growth = [0u8; 1];
            if file
                .read(&mut growth)
                .map_err(|_| diag(ErrorCode::IoFailure))?
                != 0
            {
                return Err(diag(ErrorCode::InvalidProposal));
            }
        } else {
            let mut buffer = Vec::new();
            buffer
                .try_reserve_exact((before.length + 1).min(1024 * 1024) as usize)
                .map_err(|_| diag(ErrorCode::IoFailure))?;
            buffer.resize((before.length + 1).min(1024 * 1024) as usize, 0);
            let live = self
                .probe
                .scratch_live
                .fetch_add(buffer.len(), Ordering::Relaxed)
                + buffer.len();
            self.probe.scratch_peak.fetch_max(live, Ordering::Relaxed);
            let _scratch = Scratch(&self.probe, buffer.len());
            loop {
                crate::runtime_work::check().map_err(diag)?;
                let n = file
                    .read(&mut buffer)
                    .map_err(|_| diag(ErrorCode::IoFailure))?;
                if n == 0 {
                    break;
                }
                count += n as u64;
                if count > before.length {
                    return Err(diag(ErrorCode::InvalidProposal));
                }
                hash.update(&buffer[..n]);
                self.probe.bytes.fetch_add(n, Ordering::Relaxed);
                self.probe.visit(Point::Chunk).map_err(diag)?;
            }
        }
        self.probe.record("bytes_hash", start.elapsed());
        self.probe.visit(Point::AfterRead).map_err(diag)?;
        let after = platform::candidate::sample(&file, &self.probe).map_err(diag)?;
        if before != after || count != before.length {
            return Err(diag(ErrorCode::InvalidProposal));
        }
        anchor
            .candidate_validate(&approved.root, &approved.identity, &self.probe)
            .map_err(diag)?;
        if self.service.approved(&self.project)?.identity != approved.identity {
            return Err(diag(ErrorCode::RootIdentityChanged));
        }
        self.probe.hashes.fetch_add(1, Ordering::Relaxed);
        Ok((
            bytes,
            Revision {
                sha256: hex::encode(hash.finalize()),
                identity: before.identity,
            },
        ))
    }
    pub(crate) fn snapshot_bounded(
        &mut self,
        path: &RelativePath,
        maximum: usize,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        self.read(path, maximum, &AtomicUsize::new(maximum), true)
    }
    pub(crate) fn revision_bounded(
        &mut self,
        path: &RelativePath,
        maximum: u64,
    ) -> Result<Revision, PublicDiagnostic> {
        self.read(
            path,
            maximum.min(usize::MAX as u64) as usize,
            &AtomicUsize::new(0),
            false,
        )
        .map(|(_, r)| r)
    }
}
fn diag(code: ErrorCode) -> PublicDiagnostic {
    PublicDiagnostic::new(code, None)
}
