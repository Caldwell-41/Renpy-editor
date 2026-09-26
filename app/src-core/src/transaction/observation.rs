//! Fresh bounded reads for one observation; no bytes or revisions are cached.
use super::*;
use std::sync::atomic::{AtomicUsize, Ordering};

const MAX_OBSERVATION_FILES: usize = 2048;
const DEFAULT_MAX_READERS: usize = 4;
const ABSOLUTE_MAX_READERS: usize = 16;

fn observation_reader_limit() -> usize {
    if std::env::var("LOOMLIGHT_PROFILE_FLOW").as_deref() != Ok("1") {
        return DEFAULT_MAX_READERS;
    }
    std::env::var("LOOMLIGHT_PROFILE_FLOW_READERS")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| matches!(value, 1 | 2 | 4 | 8 | 16))
        .unwrap_or(DEFAULT_MAX_READERS)
        .min(ABSOLUTE_MAX_READERS)
}

pub(crate) struct ObservationReader<'a> {
    service: &'a TransactionService,
    project: ProjectId,
    // Retain only the most recent parent, bounding descriptor ownership even for
    // a hostile inventory. Every open still validates the full anchor chain.
    parent: Option<(PathBuf, DirectoryAnchor)>,
}

impl TransactionService {
    /// Bounded scoped I/O, with ordered results and one shared byte allowance.
    /// Each worker retains at most one parent and runs the same per-open checks.
    pub(crate) fn observation_snapshots(
        &self,
        project: &ProjectId,
        paths: &[String],
        maximum_file: usize,
        maximum_total: usize,
    ) -> Result<Vec<Result<(Vec<u8>, Revision), PublicDiagnostic>>, PublicDiagnostic> {
        let remaining = AtomicUsize::new(maximum_total);
        self.with_observation_readers(project, paths, |reader, path| {
            let path = RelativePath::new(path).map_err(diagnostic)?;
            reader.snapshot_with_budget(&path, maximum_file, Some(&remaining))
        })
    }

    pub(crate) fn observations_still_current(
        &self,
        project: &ProjectId,
        files: &[(&str, &Revision)],
        maximum: u64,
    ) -> Result<bool, PublicDiagnostic> {
        self.with_observation_readers(project, files, |reader, (path, expected)| {
            RelativePath::new(*path)
                .map_err(diagnostic)
                .and_then(|path| reader.revision_bounded(&path, maximum))
                .is_ok_and(|current| current == **expected)
        })
        .map(|results| results.into_iter().all(|current| current))
    }

    fn with_observation_readers<I: Sync, R: Send>(
        &self,
        project: &ProjectId,
        items: &[I],
        read: impl Fn(&mut ObservationReader<'_>, &I) -> R + Sync,
    ) -> Result<Vec<R>, PublicDiagnostic> {
        if items.len() > MAX_OBSERVATION_FILES {
            return Err(diagnostic(ErrorCode::InvalidProposal));
        }
        let workers = items
            .len()
            .div_ceil(128)
            .clamp(1, observation_reader_limit());
        if workers == 1 {
            let mut reader = self.observation_reader(project)?;
            return Ok(items.iter().map(|item| read(&mut reader, item)).collect());
        }
        std::thread::scope(|scope| {
            let mut handles = Vec::new();
            for chunk in items.chunks(items.len().div_ceil(workers)) {
                let read = &read;
                let work = crate::runtime_work::inherited(move || {
                    let mut reader = self.observation_reader(project)?;
                    Ok::<Vec<R>, PublicDiagnostic>(
                        chunk.iter().map(|item| read(&mut reader, item)).collect(),
                    )
                });
                handles.push(
                    std::thread::Builder::new()
                        .name("flow-observation".into())
                        .spawn_scoped(scope, work)
                        .map_err(|_| diagnostic(ErrorCode::IoFailure))?,
                );
            }
            let mut results = Vec::with_capacity(items.len());
            for handle in handles {
                results.extend(
                    handle
                        .join()
                        .map_err(|_| diagnostic(ErrorCode::IoFailure))??,
                );
            }
            Ok(results)
        })
    }

    pub(crate) fn observation_reader(
        &self,
        project: &ProjectId,
    ) -> Result<ObservationReader<'_>, PublicDiagnostic> {
        let approved = self.approved(project)?;
        self.validate_root(&approved)?;
        Ok(ObservationReader {
            service: self,
            project: project.clone(),
            parent: None,
        })
    }
}

impl ObservationReader<'_> {
    fn open(&mut self, path: &RelativePath) -> Result<File, PublicDiagnostic> {
        let approved = self.service.approved(&self.project)?;
        self.service.validate_root(&approved)?;
        crate::runtime_work::check().map_err(diagnostic)?;
        let parent_path = path
            .as_path()
            .parent()
            .ok_or_else(|| diagnostic(ErrorCode::UnsafePath))?;
        if self
            .parent
            .as_ref()
            .is_none_or(|(previous, _)| previous != parent_path)
        {
            // Drop the previous chain before acquiring another. Resolving the
            // parent does not pre-open/read the leaf; open_file below owns that.
            self.parent = None;
            let target = resolve_target(&approved.anchor, path, false).map_err(diagnostic)?;
            self.parent = Some((parent_path.to_path_buf(), target.parent_anchor));
        }
        let name = path
            .as_path()
            .file_name()
            .ok_or_else(|| diagnostic(ErrorCode::UnsafePath))?;
        self.parent
            .as_ref()
            .unwrap()
            .1
            .open_file(name)
            .map_err(diagnostic)
    }

    #[cfg(test)]
    pub(crate) fn snapshot_bounded(
        &mut self,
        path: &RelativePath,
        maximum: usize,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        self.snapshot_with_budget(path, maximum, None)
    }

    fn snapshot_with_budget(
        &mut self,
        path: &RelativePath,
        maximum: usize,
        remaining: Option<&AtomicUsize>,
    ) -> Result<(Vec<u8>, Revision), PublicDiagnostic> {
        let mut file = self.open(path)?;
        let maximum = maximum.min(MAX_MUTATION_BYTES);
        let identity = identity_for_file(&file).map_err(|_| diagnostic(ErrorCode::IoFailure))?;
        let length = file
            .metadata()
            .map_err(|_| diagnostic(ErrorCode::IoFailure))?
            .len();
        if length > maximum as u64 {
            return Err(diagnostic(ErrorCode::InvalidProposal));
        }
        // Reserve before allocation/I/O across all workers. Failed reads release
        // their reservation; successful bytes remain charged until this batch ends.
        let mut reservation = ByteReservation::new(remaining, length as usize)?;
        // Bound growth by the observed length, not merely the overall limit.
        let bytes = read_bytes_bounded(&mut file, length as usize).map_err(diagnostic)?;
        let final_length = file
            .metadata()
            .map_err(|_| diagnostic(ErrorCode::IoFailure))?
            .len();
        let final_identity =
            identity_for_file(&file).map_err(|_| diagnostic(ErrorCode::IoFailure))?;
        if bytes.len() as u64 != length || final_length != length || final_identity != identity {
            return Err(diagnostic(ErrorCode::InvalidProposal));
        }
        let revision = Revision {
            sha256: sha256(&bytes),
            identity,
        };
        reservation.retained = true;
        Ok((bytes, revision))
    }

    pub(crate) fn revision_bounded(
        &mut self,
        path: &RelativePath,
        maximum: u64,
    ) -> Result<Revision, PublicDiagnostic> {
        let mut file = self.open(path)?;
        read_revision_file_bounded(&mut file, maximum.min(MAX_MUTATION_BYTES as u64))
            .map_err(diagnostic)
    }
}

struct ByteReservation<'a> {
    remaining: Option<&'a AtomicUsize>,
    length: usize,
    retained: bool,
}

impl<'a> ByteReservation<'a> {
    fn new(remaining: Option<&'a AtomicUsize>, length: usize) -> Result<Self, PublicDiagnostic> {
        if let Some(remaining) = remaining {
            remaining
                .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |bytes| {
                    bytes.checked_sub(length)
                })
                .map_err(|_| diagnostic(ErrorCode::InvalidProposal))?;
        }
        Ok(Self {
            remaining,
            length,
            retained: false,
        })
    }
}

impl Drop for ByteReservation<'_> {
    fn drop(&mut self) {
        if !self.retained {
            if let Some(remaining) = self.remaining {
                remaining.fetch_add(self.length, Ordering::Relaxed);
            }
        }
    }
}

fn diagnostic(code: ErrorCode) -> PublicDiagnostic {
    PublicDiagnostic::new(code, None)
}
