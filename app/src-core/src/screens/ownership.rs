use super::*;
use crate::{
    metadata::{OwnedScreen, ProjectMetadata, SourceMapMetadata},
    transaction::{ErrorCode, Revision},
};
use sha2::{Digest, Sha256};

const MAP: &str = ".renpy-editor/source-map.json";
const PROJECT: &str = ".renpy-editor/project.json";

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedReference {
    #[serde(flatten)]
    pub screen: OwnedScreen,
    pub resolved: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    pub project_revision: String,
    pub source_map_revision: String,
    pub inventory_revision: String,
    pub owned: Vec<OwnedReference>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateRequest {
    pub name: String,
    pub expected_project_revision: String,
    pub expected_source_map_revision: String,
    pub expected_inventory_revision: String,
}

struct Inventory {
    revision: String,
    files: Vec<(String, Vec<u8>)>,
    names: Vec<String>,
    complete: bool,
}

fn declaration_names(bytes: &[u8]) -> Result<Vec<String>, SceneError> {
    let bytes = bytes.strip_prefix(&[0xef, 0xbb, 0xbf]).unwrap_or(bytes);
    let ranges = crate::authoring::lexical_ranges(bytes, false, false)
        .map_err(|_| SceneError::UnsupportedSource)?;
    let mut names = vec![];
    for (start, end) in ranges {
        let line = std::str::from_utf8(&bytes[start..end])
            .map_err(|_| SceneError::UnsupportedSource)?
            .trim_start();
        if let Some(tail) = line
            .strip_prefix("screen")
            .filter(|s| s.starts_with(char::is_whitespace))
        {
            let name = tail
                .trim_start()
                .split(['(', ':', ' ', '\t', '\r', '\n'])
                .next()
                .unwrap_or("");
            if identifier(name) {
                names.push(name.to_owned());
            }
        }
    }
    Ok(names)
}

fn marker(id: &str) -> String {
    format!("# loomlight-screen: {id}")
}

fn resolves(screen: &OwnedScreen, inventory: &Inventory) -> bool {
    if !inventory.complete {
        return false;
    }
    let Some((_, bytes)) = inventory
        .files
        .iter()
        .find(|(path, _)| path == &screen.path)
    else {
        return false;
    };
    let Ok(document) = inspect(bytes, screen.path.clone(), String::new()) else {
        return false;
    };
    let Some(root) = document
        .screens
        .iter()
        .find(|s| s.name == screen.name)
        .and_then(|s| s.nodes.first())
    else {
        return false;
    };
    let Ok(text) = std::str::from_utf8(bytes) else {
        return false;
    };
    let expected = marker(&screen.id);
    let preceding = text[..root.span.start].trim_end_matches(['\r', '\n']);
    let preceding_line = preceding
        .rsplit('\n')
        .next()
        .unwrap_or("")
        .trim_start_matches('\u{feff}');
    preceding_line == expected
        && text
            .lines()
            .filter(|line| line.trim_end_matches('\r').trim_start_matches('\u{feff}') == expected)
            .count()
            == 1
        && inventory
            .names
            .iter()
            .filter(|name| *name == &screen.name)
            .count()
            == 1
}

impl AuthoringService {
    fn screen_inventory(&self, project: &ProjectId) -> Result<Inventory, SceneError> {
        let mut paths = self
            .transactions
            .inventory_files_bounded(project, "game", 16384)
            .map_err(|_| SceneError::SourceConflict)?;
        paths.retain(|path| path.to_ascii_lowercase().ends_with(".rpy"));
        paths.sort();
        let mut digest = Sha256::new();
        let mut files = vec![];
        let mut names = vec![];
        let mut complete = true;
        let mut total = 0usize;
        for path in paths {
            let (bytes, revision) = self
                .transactions
                .snapshot_bounded(
                    project,
                    RelativePath::new(&path).map_err(|_| SceneError::InvalidPayload)?,
                    16 * 1024 * 1024,
                )
                .map_err(|_| SceneError::SourceConflict)?;
            total = total
                .checked_add(bytes.len())
                .ok_or(SceneError::InvariantBlocked)?;
            if total > 64 * 1024 * 1024 {
                return Err(SceneError::InvariantBlocked);
            }
            match declaration_names(&bytes) {
                Ok(found) => names.extend(found),
                Err(_) => complete = false,
            }
            digest.update((path.len() as u64).to_le_bytes());
            digest.update(path.as_bytes());
            digest.update(revision.sha256.as_bytes());
            files.push((path, bytes));
        }
        Ok(Inventory {
            revision: hex::encode(digest.finalize()),
            files,
            names,
            complete,
        })
    }

    fn screen_metadata(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<(SourceMapMetadata, Vec<u8>, Revision, Revision), SceneError> {
        let (project_bytes, project_revision) = self
            .transactions
            .snapshot(project, RelativePath::new(PROJECT).unwrap())
            .map_err(|_| SceneError::SourceConflict)?;
        let metadata = ProjectMetadata::read_bytes(&project_bytes, None)
            .map_err(|_| SceneError::InvalidMetadata)?;
        if metadata.project_id != project_id {
            return Err(SceneError::InvalidMetadata);
        }
        let (bytes, revision) = self
            .transactions
            .snapshot(project, RelativePath::new(MAP).unwrap())
            .map_err(|_| SceneError::SourceConflict)?;
        let map = SourceMapMetadata::read_bytes(&bytes, project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        if map.schema_version != crate::metadata::SOURCE_MAP_SCHEMA_VERSION {
            return Err(SceneError::InvalidMetadata);
        }
        Ok((map, bytes, revision, project_revision))
    }

    pub fn screens_list(
        &self,
        project: &ProjectId,
        project_id: &str,
    ) -> Result<Catalog, SceneError> {
        let (map, _, revision, project_revision) = self.screen_metadata(project, project_id)?;
        let inventory = self.screen_inventory(project)?;
        let owned = map
            .owned_screens
            .into_iter()
            .map(|screen| OwnedReference {
                resolved: resolves(&screen, &inventory),
                screen,
            })
            .collect();
        Ok(Catalog {
            project_revision: project_revision.sha256,
            source_map_revision: revision.sha256,
            inventory_revision: inventory.revision,
            owned,
        })
    }

    pub fn screens_create(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: CreateRequest,
    ) -> Result<Catalog, SceneError> {
        if !valid_name(&request.name) {
            return Err(SceneError::InvalidPayload);
        }
        let (mut map, bytes, revision, project_revision) =
            self.screen_metadata(project, project_id)?;
        let inventory = self.screen_inventory(project)?;
        if project_revision.sha256 != request.expected_project_revision
            || revision.sha256 != request.expected_source_map_revision
            || inventory.revision != request.expected_inventory_revision
        {
            return Err(SceneError::SourceConflict);
        }
        if !inventory.complete {
            return Err(SceneError::UnsupportedSource);
        }
        self.ensure_source_paths_clean(
            project,
            inventory.files.iter().map(|(path, _)| path.as_str()),
        )
        .map_err(|_| SceneError::DirtySource)?;
        let destination = format!("game/ui/{}.rpy", request.name);
        if inventory
            .names
            .iter()
            .any(|name| name.eq_ignore_ascii_case(&request.name))
            || inventory
                .files
                .iter()
                .any(|(path, _)| path.eq_ignore_ascii_case(&destination))
            || map
                .sources
                .iter()
                .any(|path| path.eq_ignore_ascii_case(&destination))
            || map
                .owned_screens
                .iter()
                .any(|screen| screen.name.eq_ignore_ascii_case(&request.name))
        {
            return Err(SceneError::ReferenceBlocked);
        }
        let screen = OwnedScreen {
            id: uuid::Uuid::new_v4().to_string(),
            root_id: uuid::Uuid::new_v4().to_string(),
            name: request.name,
            path: destination.clone(),
            extra: Default::default(),
        };
        let source = format!(
            "{}\nscreen {}():\n    pass\n",
            marker(&screen.id),
            screen.name
        )
        .into_bytes();
        map.sources.push(destination.clone());
        map.owned_screens.push(screen);
        map.validate(project_id)
            .map_err(|_| SceneError::InvalidMetadata)?;
        let proposed = crate::scene::source_map_bytes(&map)?;
        self.transactions
            .ensure_directory(project, "game/ui")
            .map_err(|error| {
                if error.code == ErrorCode::RuntimeBusy {
                    SceneError::RuntimeBusy
                } else {
                    SceneError::SourceConflict
                }
            })?;
        self.commit_history(
            project,
            TransactionProposal {
                mutations: vec![
                    FileMutation {
                        path: path(&destination)?,
                        kind: MutationKind::CreateNew,
                        base: Revision::expected_absence(),
                        expected_bytes: vec![],
                        proposed: source,
                    },
                    FileMutation {
                        path: RelativePath::new(MAP).unwrap(),
                        kind: MutationKind::ReplaceExisting,
                        base: revision,
                        expected_bytes: bytes,
                        proposed,
                    },
                ],
                intent: TransactionIntent::Edit,
            },
        )?;
        self.screens_list(project, project_id)
    }
}
