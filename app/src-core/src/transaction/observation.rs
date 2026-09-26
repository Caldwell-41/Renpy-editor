//! Fresh bounded reads for one observation; no bytes or revisions are cached.
use super::*;

pub(crate) struct ObservationReader<'a> {
    service: &'a TransactionService,
    project: ProjectId,
    // Retain only the most recent parent, bounding descriptor ownership even for
    // a hostile inventory. Every open still validates the full anchor chain.
    parent: Option<(PathBuf, DirectoryAnchor)>,
}

impl TransactionService {
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

    pub(crate) fn snapshot_bounded(
        &mut self,
        path: &RelativePath,
        maximum: usize,
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

fn diagnostic(code: ErrorCode) -> PublicDiagnostic {
    PublicDiagnostic::new(code, None)
}
