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
    pub source_revision: Option<String>,
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
        let logical = std::str::from_utf8(&bytes[start..end])
            .map_err(|_| SceneError::UnsupportedSource)?
            .replace("\\\r\n", " ")
            .replace("\\\n", " ");
        let mut line = logical.trim_start();
        // Ren'Py accepts init [priority] <statement> and screen [language-version].
        // Inspect the lexed header only; authoritative bytes are never normalized.
        let mut prefixes = 0;
        while let Some(tail) = keyword(line, "init") {
            prefixes += 1;
            if prefixes > MAX_DEPTH {
                return Err(SceneError::UnsupportedSource);
            }
            line = skip_integer(tail);
        }
        if let Some(tail) = keyword(line, "screen") {
            let name = skip_integer(tail)
                .trim_start()
                .split(['(', ':', ' ', '\t', '\r', '\n'])
                .next()
                .unwrap_or("");
            if !identifier(name) {
                return Err(SceneError::UnsupportedSource);
            }
            names.push(name.to_owned());
        }
    }
    Ok(names)
}

fn keyword<'a>(line: &'a str, word: &str) -> Option<&'a str> {
    line.strip_prefix(word)
        .filter(|tail| tail.starts_with(char::is_whitespace))
        .map(str::trim_start)
}

fn skip_integer(line: &str) -> &str {
    let end = line.find(char::is_whitespace).unwrap_or(line.len());
    let value = line[..end].strip_prefix(['+', '-']).unwrap_or(&line[..end]);
    if !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit()) {
        line[end..].trim_start()
    } else {
        line
    }
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
    /// Construct the editor document from one captured source and its revision.
    pub(super) fn owned_screen_document(
        &self,
        project: &ProjectId,
        bytes: &[u8],
        source_path: String,
        revision: String,
    ) -> Result<Document, SceneError> {
        let mut document = inspect(bytes, source_path, revision)?;
        let (project_bytes, _) = self
            .transactions
            .snapshot(project, RelativePath::new(PROJECT).unwrap())
            .map_err(|_| SceneError::SourceConflict)?;
        let metadata = ProjectMetadata::read_bytes(&project_bytes, None)
            .map_err(|_| SceneError::InvalidMetadata)?;
        let (map, _, _, _) = self.screen_metadata(project, &metadata.project_id)?;
        for screen in &mut document.screens {
            let owner = map
                .owned_screens
                .iter()
                .find(|o| o.path == document.path && o.name == screen.name);
            let root = screen.nodes.first_mut().unwrap();
            let preceding = std::str::from_utf8(&bytes[..root.span.start])
                .map_err(|_| SceneError::UnsupportedSource)?
                .trim_end_matches(['\r', '\n']);
            let owned = owner.filter(|o| {
                preceding
                    .rsplit('\n')
                    .next()
                    .unwrap_or("")
                    .trim_start_matches('\u{feff}')
                    == marker(&o.id)
            });
            if let Some(owner) = owned {
                root.id = Some(owner.root_id.clone());
            } else {
                for node in &mut screen.nodes {
                    node.id = None;
                }
            }
            if owned.is_some() {
                let mut source_only = vec![];
                for parent in &screen.nodes {
                    for (index, span) in parent.protected.iter().enumerate() {
                        let text = std::str::from_utf8(&bytes[span.start..span.end])
                            .map_err(|_| SceneError::UnsupportedSource)?;
                        let header = code(text.lines().next().unwrap_or("").trim_start());
                        if !header.starts_with("use ")
                            && !header.starts_with("$ ")
                            && !header.ends_with(':')
                        {
                            continue;
                        }
                        if screen.nodes.len() + source_only.len() >= MAX_NODES {
                            return Err(SceneError::InvariantBlocked);
                        }
                        let mut digest = Sha256::new();
                        digest.update(parent.id.as_deref().unwrap_or("unowned"));
                        digest.update(index.to_le_bytes());
                        digest.update(header);
                        source_only.push(Node {
                            id: Some(format!("source-{}", hex::encode(digest.finalize()))),
                            kind: "custom".into(),
                            literal: Some(header.into()),
                            layout: Default::default(),
                            position: None,
                            span: span.clone(),
                            parent_start: Some(parent.span.start),
                            properties: vec![],
                            protected: vec![span.clone()],
                            source_end: span.end,
                        });
                    }
                }
                screen.nodes.extend(source_only);
                screen.nodes.sort_by_key(|n| n.span.start);
            }
            let mut counts = std::collections::HashMap::new();
            for node in &screen.nodes {
                if let Some(id) = &node.id {
                    *counts.entry(id.clone()).or_insert(0) += 1;
                }
            }
            for node in &mut screen.nodes {
                if node.id.as_ref().is_some_and(|id| counts[id] != 1) {
                    node.id = None;
                }
            }
        }
        Ok(document)
    }

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
            .map(|screen| {
                let resolved = resolves(&screen, &inventory);
                let source_revision = if resolved {
                    inventory
                        .files
                        .iter()
                        .find(|(path, _)| path == &screen.path)
                        .map(|(_, bytes)| hex::encode(Sha256::digest(bytes)))
                } else {
                    None
                };
                OwnedReference {
                    resolved,
                    screen,
                    source_revision,
                }
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
        let destination = format!("game/ui/{}.rpy", request.name);
        self.ensure_source_paths_clean(
            project,
            inventory
                .files
                .iter()
                .map(|(path, _)| path.as_str())
                .chain(std::iter::once(destination.as_str())),
        )
        .map_err(|_| SceneError::DirtySource)?;
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
