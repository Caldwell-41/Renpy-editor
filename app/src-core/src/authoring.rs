//! Bounded Phase 1D authoring support.
//!
//! This deliberately recognises only Loomlight's canonical single-line Character and
//! `default` statements. Original source bytes remain authoritative; mapped statements
//! are patched only when their exact bytes and file revision still match.

use crate::transaction::{
    CommitOutcome, DirectoryAnchor, FileIdentity, FileMutation, FlushOutcome, MutationKind,
    ProjectId, RecoveryMutationState, RelativePath, Revision, TransactionIntent,
    TransactionProposal, TransactionService, MAX_IMPORT_BYTES,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    ffi::OsStr,
    fs::{self, File},
    io::{Read, Seek, SeekFrom},
    path::{Path, PathBuf},
};

pub const AUTHORING_SCHEMA_VERSION: u32 = 1;
const AUTHORING_PATH: &str = ".renpy-editor/authoring.json";
const CHARACTERS_PATH: &str = "game/definitions/characters.rpy";
const VARIABLES_PATH: &str = "game/definitions/variables.rpy";
const ASSETS_PATH: &str = "game/definitions/assets.rpy";
const MAX_TEXT: usize = 160;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AssetKind {
    Background,
    CharacterAppearance,
    Music,
    Sfx,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum VariableType {
    Bool,
    Int,
    String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceDefinition {
    pub path: String,
    pub statement: String,
    pub source_revision: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub id: String,
    pub technical_name: String,
    pub display_name: String,
    pub dialogue_color: String,
    pub default_appearance_id: Option<String>,
    pub source: SourceDefinition,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Appearance {
    pub id: String,
    pub character_id: String,
    pub label: String,
    pub attributes: BTreeMap<String, String>,
    pub render_mode: String,
    pub asset_id: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: String,
    pub kind: AssetKind,
    pub display_name: String,
    pub relative_path: String,
    pub discovery_name: String,
    pub sha256: String,
    pub byte_count: u64,
    pub status: String,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub id: String,
    pub technical_name: String,
    pub variable_type: VariableType,
    pub default_value: Value,
    pub source: SourceDefinition,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthoringMetadata {
    pub schema_version: u32,
    pub project_id: String,
    pub characters: Vec<Character>,
    pub appearances: Vec<Appearance>,
    pub assets: Vec<Asset>,
    pub variables: Vec<Variable>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

impl AuthoringMetadata {
    pub fn empty(project_id: String) -> Self {
        Self {
            schema_version: AUTHORING_SCHEMA_VERSION,
            project_id,
            characters: Vec::new(),
            appearances: Vec::new(),
            assets: Vec::new(),
            variables: Vec::new(),
            extra: Map::new(),
        }
    }

    fn validate(&self, project_id: &str) -> Result<(), AuthoringError> {
        if self.schema_version != AUTHORING_SCHEMA_VERSION || self.project_id != project_id {
            return Err(AuthoringError::UnsupportedMetadata);
        }
        let mut ids = HashSet::new();
        for id in self
            .characters
            .iter()
            .map(|item| &item.id)
            .chain(self.appearances.iter().map(|item| &item.id))
            .chain(self.assets.iter().map(|item| &item.id))
            .chain(self.variables.iter().map(|item| &item.id))
        {
            if uuid::Uuid::parse_str(id).is_err() || !ids.insert(id) {
                return Err(AuthoringError::CorruptMetadata);
            }
        }
        for appearance in &self.appearances {
            if !self
                .characters
                .iter()
                .any(|item| item.id == appearance.character_id)
                || !self
                    .assets
                    .iter()
                    .any(|item| item.id == appearance.asset_id)
                || !appearance.attributes.contains_key("expression")
                || appearance.attributes.get("outfit").map(String::as_str) != Some("default")
                || appearance.attributes.get("pose").map(String::as_str) != Some("default")
                || appearance.render_mode != "staticImportedAsset"
                || appearance.label.trim().is_empty()
                || appearance.label.len() > MAX_TEXT
            {
                return Err(AuthoringError::CorruptMetadata);
            }
        }
        for character in &self.characters {
            validate_identifier(&character.technical_name)
                .map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_display(&character.display_name)
                .map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_color(&character.dialogue_color)
                .map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_source_definition(&character.source, CHARACTERS_PATH)?;
            if character.source.statement
                != character_statement(
                    &character.technical_name,
                    &character.display_name,
                    &character.dialogue_color,
                )?
            {
                return Err(AuthoringError::CorruptMetadata);
            }
            if character.default_appearance_id.as_ref().is_some_and(|id| {
                !self
                    .appearances
                    .iter()
                    .any(|item| &item.id == id && item.character_id == character.id)
            }) {
                return Err(AuthoringError::CorruptMetadata);
            }
        }
        for variable in &self.variables {
            validate_identifier(&variable.technical_name)
                .map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_source_definition(&variable.source, VARIABLES_PATH)?;
            let literal = variable_literal(variable.variable_type, &variable.default_value)
                .map_err(|_| AuthoringError::CorruptMetadata)?;
            if variable.source.statement
                != format!("default {} = {literal}", variable.technical_name)
            {
                return Err(AuthoringError::CorruptMetadata);
            }
        }
        for asset in &self.assets {
            RelativePath::new(&asset.relative_path).map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_hash(&asset.sha256).map_err(|_| AuthoringError::CorruptMetadata)?;
            validate_display(&asset.display_name).map_err(|_| AuthoringError::CorruptMetadata)?;
            if asset.discovery_name.trim().is_empty()
                || asset.discovery_name.len() > MAX_TEXT
                || asset.byte_count > MAX_IMPORT_BYTES
                || !matches!(
                    asset.status.as_str(),
                    "available" | "missing" | "changed" | "unsafe" | "compatibilityRequired"
                )
            {
                return Err(AuthoringError::CorruptMetadata);
            }
        }
        Ok(())
    }
}

fn validate_source_definition(
    source: &SourceDefinition,
    expected_path: &str,
) -> Result<(), AuthoringError> {
    if source.path != expected_path
        || source.statement.is_empty()
        || source.statement.len() > 10_000
        || source.statement.contains(['\r', '\n'])
    {
        return Err(AuthoringError::CorruptMetadata);
    }
    validate_hash(&source.source_revision).map_err(|_| AuthoringError::CorruptMetadata)
}

#[derive(Debug)]
pub enum AuthoringError {
    NoOpenProject,
    RecoveryRequired,
    InvalidPayload,
    InvalidIdentifier,
    ReservedIdentifier,
    SymbolCollision,
    InvalidColor,
    InvalidValue,
    UnknownEntity,
    UnknownImport,
    UnsupportedFormat,
    OversizeImport,
    DuplicateContent,
    PathCollision,
    DiscoveryCollision,
    SourceConflict,
    UnsupportedSource,
    CorruptMetadata,
    UnsupportedMetadata,
    Io,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PersistenceStatus {
    Saved,
    Conflict,
    RecoveryRequired,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateCharacterRequest {
    pub technical_name: String,
    pub display_name: String,
    pub dialogue_color: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdateCharacterRequest {
    pub id: String,
    pub expected_source_revision: String,
    pub display_name: String,
    pub dialogue_color: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateVariableRequest {
    pub technical_name: String,
    pub variable_type: VariableType,
    pub default_value: Value,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdateVariableRequest {
    pub id: String,
    pub expected_source_revision: String,
    pub default_value: Value,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImportAssetRequest {
    pub authority_id: String,
    pub kind: AssetKind,
    pub technical_name: String,
    pub display_name: String,
    pub character_id: Option<String>,
    pub expression: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetDefaultAppearanceRequest {
    pub character_id: String,
    pub appearance_id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportChoice {
    pub authority_id: String,
    pub display_name: String,
    pub byte_count: u64,
    pub extension: String,
}

struct ImportAuthority {
    project: ProjectId,
    file: File,
    parent: DirectoryAnchor,
    name: std::ffi::OsString,
    identity: FileIdentity,
    extension: String,
    byte_count: u64,
    sha256: String,
}

#[derive(Default)]
pub struct AuthoringService {
    transactions: TransactionService,
    imports: HashMap<String, ImportAuthority>,
}

impl AuthoringService {
    pub fn register_project(&self, root: &Path) -> Result<ProjectId, AuthoringError> {
        let id = self
            .transactions
            .register_trusted_project(root)
            .map_err(|_| AuthoringError::Io)?;
        if self
            .transactions
            .has_blocking_recovery(&id)
            .map_err(|_| AuthoringError::RecoveryRequired)?
        {
            self.transactions.unregister_trusted_project(&id);
            return Err(AuthoringError::RecoveryRequired);
        }
        Ok(id)
    }

    pub(crate) fn register_inspected_project(
        &self,
        root: PathBuf,
        anchor: crate::transaction::DirectoryAnchor,
    ) -> Result<ProjectId, AuthoringError> {
        let id = self
            .transactions
            .register_trusted_anchor(root, anchor)
            .map_err(|_| AuthoringError::Io)?;
        if self
            .transactions
            .has_blocking_recovery(&id)
            .map_err(|_| AuthoringError::RecoveryRequired)?
        {
            self.transactions.unregister_trusted_project(&id);
            return Err(AuthoringError::RecoveryRequired);
        }
        Ok(id)
    }

    pub fn unregister_project(&mut self, id: &ProjectId) {
        self.transactions.unregister_trusted_project(id);
        self.imports.retain(|_, authority| &authority.project != id);
    }

    pub fn flush(&self, project: &ProjectId) -> Result<(), AuthoringError> {
        match self.transactions.flush(project) {
            FlushOutcome::Flushed => Ok(()),
            FlushOutcome::Conflict { .. } => Err(AuthoringError::SourceConflict),
            FlushOutcome::RecoveryRequired { .. } => Err(AuthoringError::RecoveryRequired),
            FlushOutcome::Rejected { .. } => Err(AuthoringError::Io),
        }
    }

    /// Reports persistence readiness without acknowledging or modifying recovery state.
    pub fn status(&self, project: &ProjectId) -> PersistenceStatus {
        let report = self.transactions.recover(project);
        let mut blocked = false;
        for item in report.items {
            if matches!(
                item.state,
                crate::transaction::JournalState::Durable
                    | crate::transaction::JournalState::Rejected { .. }
                    | crate::transaction::JournalState::Cleaned
            ) {
                continue;
            }
            blocked = true;
            if item.mutations.iter().any(|state| {
                matches!(
                    state,
                    RecoveryMutationState::ExchangeCompleteConflict
                        | RecoveryMutationState::ExternalRevisionWithAcceptedCopy
                )
            }) {
                return PersistenceStatus::Conflict;
            }
        }
        if blocked {
            PersistenceStatus::RecoveryRequired
        } else {
            PersistenceStatus::Saved
        }
    }

    pub fn select_import(
        &mut self,
        project: &ProjectId,
        selected: &Path,
    ) -> Result<ImportChoice, AuthoringError> {
        let metadata = fs::symlink_metadata(selected).map_err(|_| AuthoringError::Io)?;
        if !metadata.is_file() || crate::transaction::is_link_or_reparse(&metadata) {
            return Err(AuthoringError::UnsupportedFormat);
        }
        let extension = selected
            .extension()
            .and_then(OsStr::to_str)
            .map(str::to_ascii_lowercase)
            .filter(|value| supported_extension(value))
            .ok_or(AuthoringError::UnsupportedFormat)?;
        if metadata.len() > MAX_IMPORT_BYTES {
            return Err(AuthoringError::OversizeImport);
        }
        let parent_path = selected.parent().ok_or(AuthoringError::UnsupportedFormat)?;
        let name = selected
            .file_name()
            .ok_or(AuthoringError::UnsupportedFormat)?
            .to_os_string();
        let parent = DirectoryAnchor::open_root(parent_path)
            .map_err(|_| AuthoringError::UnsupportedFormat)?;
        let selected_identity = identity_for_metadata(&metadata);
        let mut file = parent
            .open_file(&name)
            .map_err(|_| AuthoringError::UnsupportedFormat)?;
        let identity = identity_for_selected(&file)?;
        let opened_metadata = file.metadata().map_err(|_| AuthoringError::Io)?;
        if !opened_metadata.is_file()
            || selected_identity.is_some_and(|expected| identity != expected)
            || opened_metadata.len() != metadata.len()
        {
            return Err(AuthoringError::UnknownImport);
        }
        let (byte_count, sha256) = hash_file(&mut file)?;
        if byte_count > MAX_IMPORT_BYTES {
            return Err(AuthoringError::OversizeImport);
        }
        let authority_id = uuid::Uuid::new_v4().to_string();
        let display_name = selected
            .file_name()
            .and_then(OsStr::to_str)
            .unwrap_or("selected media")
            .chars()
            .take(MAX_TEXT)
            .collect::<String>();
        self.imports.insert(
            authority_id.clone(),
            ImportAuthority {
                project: project.clone(),
                file,
                parent,
                name,
                identity,
                extension: extension.clone(),
                byte_count,
                sha256,
            },
        );
        Ok(ImportChoice {
            authority_id,
            display_name,
            byte_count,
            extension,
        })
    }

    pub fn list(
        &self,
        project: &ProjectId,
        project_uuid: &str,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        let (mut metadata, _) = self.load_metadata(project, project_uuid)?;
        self.refresh_verified_source_revisions(project, &mut metadata)?;
        self.refresh_asset_statuses(project, &mut metadata);
        Ok(metadata)
    }

    pub fn create_character(
        &self,
        project: &ProjectId,
        project_uuid: &str,
        request: CreateCharacterRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_identifier(&request.technical_name)?;
        validate_display(&request.display_name)?;
        validate_color(&request.dialogue_color)?;
        self.ensure_source_symbol_available(project, &request.technical_name)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        ensure_symbol_available(&metadata, &request.technical_name)?;
        let (source_bytes, source_revision) = self.snapshot(project, CHARACTERS_PATH)?;
        verify_mapped_statements(
            &source_bytes,
            metadata
                .characters
                .iter()
                .filter(|item| item.source.path == CHARACTERS_PATH)
                .map(|item| item.source.statement.as_str()),
        )?;
        ensure_safe_append(&source_bytes)?;
        let statement = character_statement(
            &request.technical_name,
            &request.display_name,
            &request.dialogue_color,
        )?;
        let new_source = append_statement(&source_bytes, &statement);
        let new_revision = hash_bytes(&new_source);
        for existing in &mut metadata.characters {
            if existing.source.path == CHARACTERS_PATH {
                existing.source.source_revision = new_revision.clone();
            }
        }
        metadata.characters.push(Character {
            id: uuid::Uuid::new_v4().to_string(),
            technical_name: request.technical_name,
            display_name: request.display_name,
            dialogue_color: request.dialogue_color.to_ascii_lowercase(),
            default_appearance_id: None,
            source: SourceDefinition {
                path: CHARACTERS_PATH.into(),
                statement,
                source_revision: new_revision,
                extra: Map::new(),
            },
            extra: Map::new(),
        });
        self.commit_source_and_metadata(
            project,
            CHARACTERS_PATH,
            source_bytes,
            source_revision,
            new_source,
            metadata,
            metadata_snapshot,
        )
    }

    pub fn update_character(
        &self,
        project: &ProjectId,
        project_uuid: &str,
        request: UpdateCharacterRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_uuid(&request.id)?;
        validate_hash(&request.expected_source_revision)?;
        validate_display(&request.display_name)?;
        validate_color(&request.dialogue_color)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        let character = metadata
            .characters
            .iter_mut()
            .find(|item| item.id == request.id)
            .ok_or(AuthoringError::UnknownEntity)?;
        let (source_bytes, source_revision) = self.snapshot(project, CHARACTERS_PATH)?;
        if source_revision.sha256 != request.expected_source_revision {
            return Err(AuthoringError::SourceConflict);
        }
        verify_mapped_statements(
            &source_bytes,
            std::iter::once(character.source.statement.as_str()),
        )?;
        ensure_safe_append(&source_bytes)?;
        let new_statement = character_statement(
            &character.technical_name,
            &request.display_name,
            &request.dialogue_color,
        )?;
        let new_source =
            replace_exact_once(&source_bytes, &character.source.statement, &new_statement)?;
        let new_revision = hash_bytes(&new_source);
        character.display_name = request.display_name;
        character.dialogue_color = request.dialogue_color.to_ascii_lowercase();
        character.source.statement = new_statement;
        character.source.source_revision = new_revision.clone();
        for other in &mut metadata.characters {
            if other.source.path == CHARACTERS_PATH {
                other.source.source_revision = new_revision.clone();
            }
        }
        self.commit_source_and_metadata(
            project,
            CHARACTERS_PATH,
            source_bytes,
            source_revision,
            new_source,
            metadata,
            metadata_snapshot,
        )
    }

    pub fn create_variable(
        &self,
        project: &ProjectId,
        project_uuid: &str,
        request: CreateVariableRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_identifier(&request.technical_name)?;
        let literal = variable_literal(request.variable_type, &request.default_value)?;
        self.ensure_source_symbol_available(project, &request.technical_name)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        ensure_symbol_available(&metadata, &request.technical_name)?;
        let (source_bytes, source_revision) = self.snapshot(project, VARIABLES_PATH)?;
        verify_mapped_statements(
            &source_bytes,
            metadata
                .variables
                .iter()
                .filter(|item| item.source.path == VARIABLES_PATH)
                .map(|item| item.source.statement.as_str()),
        )?;
        let statement = format!("default {} = {}", request.technical_name, literal);
        let new_source = append_statement(&source_bytes, &statement);
        let new_revision = hash_bytes(&new_source);
        for existing in &mut metadata.variables {
            if existing.source.path == VARIABLES_PATH {
                existing.source.source_revision = new_revision.clone();
            }
        }
        metadata.variables.push(Variable {
            id: uuid::Uuid::new_v4().to_string(),
            technical_name: request.technical_name,
            variable_type: request.variable_type,
            default_value: request.default_value,
            source: SourceDefinition {
                path: VARIABLES_PATH.into(),
                statement,
                source_revision: new_revision,
                extra: Map::new(),
            },
            extra: Map::new(),
        });
        self.commit_source_and_metadata(
            project,
            VARIABLES_PATH,
            source_bytes,
            source_revision,
            new_source,
            metadata,
            metadata_snapshot,
        )
    }

    pub fn update_variable(
        &self,
        project: &ProjectId,
        project_uuid: &str,
        request: UpdateVariableRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_uuid(&request.id)?;
        validate_hash(&request.expected_source_revision)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        let variable = metadata
            .variables
            .iter_mut()
            .find(|item| item.id == request.id)
            .ok_or(AuthoringError::UnknownEntity)?;
        let literal = variable_literal(variable.variable_type, &request.default_value)?;
        let (source_bytes, source_revision) = self.snapshot(project, VARIABLES_PATH)?;
        if source_revision.sha256 != request.expected_source_revision {
            return Err(AuthoringError::SourceConflict);
        }
        verify_mapped_statements(
            &source_bytes,
            std::iter::once(variable.source.statement.as_str()),
        )?;
        let new_statement = format!("default {} = {}", variable.technical_name, literal);
        let new_source =
            replace_exact_once(&source_bytes, &variable.source.statement, &new_statement)?;
        let new_revision = hash_bytes(&new_source);
        variable.default_value = request.default_value;
        variable.source.statement = new_statement;
        variable.source.source_revision = new_revision.clone();
        for other in &mut metadata.variables {
            if other.source.path == VARIABLES_PATH {
                other.source.source_revision = new_revision.clone();
            }
        }
        self.commit_source_and_metadata(
            project,
            VARIABLES_PATH,
            source_bytes,
            source_revision,
            new_source,
            metadata,
            metadata_snapshot,
        )
    }

    pub fn import_asset(
        &mut self,
        project: &ProjectId,
        project_uuid: &str,
        request: ImportAssetRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_identifier(&request.technical_name)?;
        validate_display(&request.display_name)?;
        let mut authority = self
            .imports
            .remove(&request.authority_id)
            .ok_or(AuthoringError::UnknownImport)?;
        if &authority.project != project {
            return Err(AuthoringError::UnknownImport);
        }
        revalidate_selected(&authority)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        if metadata
            .assets
            .iter()
            .any(|item| item.sha256 == authority.sha256)
        {
            return Err(AuthoringError::DuplicateContent);
        }
        let (relative_path, discovery_name) = import_names(
            &metadata,
            request.kind,
            &request.technical_name,
            request.character_id.as_deref(),
            request.expression.as_deref(),
            &authority.extension,
        )?;
        self.ensure_physical_name_available(
            project,
            request.kind,
            &relative_path,
            &discovery_name,
        )?;
        if metadata
            .assets
            .iter()
            .any(|item| item.relative_path.eq_ignore_ascii_case(&relative_path))
        {
            return Err(AuthoringError::PathCollision);
        }
        if metadata
            .assets
            .iter()
            .any(|item| item.discovery_name == discovery_name)
        {
            return Err(AuthoringError::DiscoveryCollision);
        }
        let asset_id = uuid::Uuid::new_v4().to_string();
        let mut asset = Asset {
            id: asset_id.clone(),
            kind: request.kind,
            display_name: request.display_name.clone(),
            relative_path: relative_path.clone(),
            discovery_name,
            sha256: authority.sha256.clone(),
            byte_count: authority.byte_count,
            status: "available".into(),
            extra: Map::new(),
        };
        let declaration = requires_explicit_declaration(&asset)
            .then(|| asset_declaration(&asset))
            .transpose()?;
        if declaration.is_some() {
            asset.extra.insert(
                "discoveryContract".into(),
                Value::String("explicitDeclaration".into()),
            );
        }
        metadata.assets.push(asset);
        if request.kind == AssetKind::CharacterAppearance {
            let character_id = request.character_id.ok_or(AuthoringError::InvalidPayload)?;
            let expression = request.expression.ok_or(AuthoringError::InvalidPayload)?;
            validate_identifier(&expression)?;
            let character = metadata
                .characters
                .iter_mut()
                .find(|item| item.id == character_id)
                .ok_or(AuthoringError::UnknownEntity)?;
            let appearance_id = uuid::Uuid::new_v4().to_string();
            let mut attributes = BTreeMap::new();
            attributes.insert("expression".into(), expression.clone());
            attributes.insert("outfit".into(), "default".into());
            attributes.insert("pose".into(), "default".into());
            metadata.appearances.push(Appearance {
                id: appearance_id.clone(),
                character_id: character_id.clone(),
                label: expression,
                attributes,
                render_mode: "staticImportedAsset".into(),
                asset_id,
                extra: Map::new(),
            });
            if character.default_appearance_id.is_none() {
                character.default_appearance_id = Some(appearance_id);
            }
        }
        let mut companions = Vec::new();
        if let Some(statement) = declaration {
            companions.push(self.declaration_mutation(project, &statement)?);
        }
        companions.push(metadata_file_mutation(metadata_snapshot, &metadata)?);
        let outcome = self.transactions.commit_streaming_import(
            project,
            RelativePath::new(relative_path).map_err(|_| AuthoringError::InvalidPayload)?,
            &mut authority.file,
            authority.byte_count,
            &authority.sha256,
            companions,
        );
        committed(outcome)?;
        Ok(metadata)
    }

    pub fn set_default_appearance(
        &self,
        project: &ProjectId,
        project_uuid: &str,
        request: SetDefaultAppearanceRequest,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        validate_uuid(&request.character_id)?;
        validate_uuid(&request.appearance_id)?;
        let (mut metadata, snapshot) = self.load_metadata(project, project_uuid)?;
        if !metadata.appearances.iter().any(|item| {
            item.id == request.appearance_id && item.character_id == request.character_id
        }) {
            return Err(AuthoringError::UnknownEntity);
        }
        metadata
            .characters
            .iter_mut()
            .find(|item| item.id == request.character_id)
            .ok_or(AuthoringError::UnknownEntity)?
            .default_appearance_id = Some(request.appearance_id);
        let proposal = TransactionProposal {
            mutations: vec![metadata_file_mutation(snapshot, &metadata)?],
            intent: TransactionIntent::Edit,
        };
        committed(self.transactions.commit(project, proposal))?;
        Ok(metadata)
    }

    pub fn repair_asset_compatibility(
        &self,
        project: &ProjectId,
        project_uuid: &str,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        self.ensure_ready(project)?;
        let (mut metadata, metadata_snapshot) = self.load_metadata(project, project_uuid)?;
        let (source_bytes, source_revision, source_kind) = match self
            .transactions
            .snapshot_optional(
                project,
                RelativePath::new(ASSETS_PATH).map_err(|_| AuthoringError::Io)?,
            )
            .map_err(|_| AuthoringError::SourceConflict)?
        {
            Some((bytes, revision)) => (bytes, revision, MutationKind::ReplaceExisting),
            None => (
                Vec::new(),
                Revision::expected_absence(),
                MutationKind::CreateNew,
            ),
        };
        let mut new_source = source_bytes.clone();
        ensure_safe_append(&new_source)?;
        for asset in metadata
            .assets
            .iter_mut()
            .filter(|asset| requires_explicit_declaration(asset))
        {
            let statement = asset_declaration(asset)?;
            if !statement_ranges(&new_source)
                .any(|(start, end)| &new_source[start..end] == statement.as_bytes())
            {
                new_source = append_statement(&new_source, &statement);
            }
            asset.extra.insert(
                "discoveryContract".into(),
                Value::String("explicitDeclaration".into()),
            );
        }
        if new_source == source_bytes {
            self.refresh_asset_statuses(project, &mut metadata);
            return Ok(metadata);
        }
        let source_mutation = FileMutation {
            path: RelativePath::new(ASSETS_PATH).map_err(|_| AuthoringError::Io)?,
            kind: source_kind,
            base: source_revision,
            expected_bytes: source_bytes,
            proposed: new_source,
        };
        committed(self.transactions.commit(
            project,
            TransactionProposal {
                mutations: vec![
                    source_mutation,
                    metadata_file_mutation(metadata_snapshot, &metadata)?,
                ],
                intent: TransactionIntent::Edit,
            },
        ))?;
        self.refresh_asset_statuses(project, &mut metadata);
        Ok(metadata)
    }

    fn ensure_ready(&self, project: &ProjectId) -> Result<(), AuthoringError> {
        if self
            .transactions
            .has_blocking_recovery(project)
            .map_err(|_| AuthoringError::RecoveryRequired)?
        {
            Err(AuthoringError::RecoveryRequired)
        } else {
            Ok(())
        }
    }

    fn refresh_verified_source_revisions(
        &self,
        project: &ProjectId,
        metadata: &mut AuthoringMetadata,
    ) -> Result<(), AuthoringError> {
        let (characters, character_revision) = self.snapshot(project, CHARACTERS_PATH)?;
        verify_mapped_statements(
            &characters,
            metadata
                .characters
                .iter()
                .map(|item| item.source.statement.as_str()),
        )?;
        for character in &mut metadata.characters {
            character.source.source_revision = character_revision.sha256.clone();
        }

        let (variables, variable_revision) = self.snapshot(project, VARIABLES_PATH)?;
        verify_mapped_statements(
            &variables,
            metadata
                .variables
                .iter()
                .map(|item| item.source.statement.as_str()),
        )?;
        for variable in &mut metadata.variables {
            variable.source.source_revision = variable_revision.sha256.clone();
            if variable.variable_type == VariableType::Int {
                variable.default_value = Value::String(variable_literal(
                    VariableType::Int,
                    &variable.default_value,
                )?);
            }
        }
        Ok(())
    }

    fn refresh_asset_statuses(&self, project: &ProjectId, metadata: &mut AuthoringMetadata) {
        let declarations = self
            .transactions
            .snapshot_optional(
                project,
                RelativePath::new(ASSETS_PATH).expect("constant authoring path"),
            )
            .ok()
            .flatten()
            .map(|(bytes, _)| bytes)
            .unwrap_or_default();
        for asset in &mut metadata.assets {
            let physical = match RelativePath::new(&asset.relative_path)
                .map_err(|_| ())
                .and_then(|path| {
                    self.transactions
                        .inspect_file(project, path)
                        .map_err(|_| ())
                }) {
                Ok(None) => "missing",
                Ok(Some((count, revision)))
                    if count == asset.byte_count && revision.sha256 == asset.sha256 =>
                {
                    "available"
                }
                Ok(Some(_)) => "changed",
                Err(()) => "unsafe",
            };
            asset.status = if physical == "available"
                && requires_explicit_declaration(asset)
                && asset_declaration(asset).is_ok_and(|statement| {
                    !statement_ranges(&declarations)
                        .any(|(start, end)| &declarations[start..end] == statement.as_bytes())
                }) {
                "compatibilityRequired".into()
            } else {
                physical.into()
            };
        }
    }

    fn declaration_mutation(
        &self,
        project: &ProjectId,
        statement: &str,
    ) -> Result<FileMutation, AuthoringError> {
        let snapshot = self
            .transactions
            .snapshot_optional(
                project,
                RelativePath::new(ASSETS_PATH).map_err(|_| AuthoringError::Io)?,
            )
            .map_err(|_| AuthoringError::SourceConflict)?;
        let (kind, expected_bytes, base) = match snapshot {
            Some((bytes, revision)) => (MutationKind::ReplaceExisting, bytes, revision),
            None => (
                MutationKind::CreateNew,
                Vec::new(),
                Revision::expected_absence(),
            ),
        };
        ensure_safe_append(&expected_bytes)?;
        let symbol = statement
            .split_once(" = ")
            .map(|(name, _)| name)
            .ok_or(AuthoringError::UnsupportedSource)?;
        if statement_ranges(&expected_bytes).any(|(start, end)| {
            std::str::from_utf8(&expected_bytes[start..end]).is_ok_and(|line| {
                line.split_once(" = ").map(|(name, _)| name) == Some(symbol) && line != statement
            })
        }) {
            return Err(AuthoringError::DiscoveryCollision);
        }
        let proposed = if statement_ranges(&expected_bytes)
            .any(|(start, end)| &expected_bytes[start..end] == statement.as_bytes())
        {
            expected_bytes.clone()
        } else {
            append_statement(&expected_bytes, statement)
        };
        Ok(FileMutation {
            path: RelativePath::new(ASSETS_PATH).map_err(|_| AuthoringError::Io)?,
            kind,
            base,
            expected_bytes,
            proposed,
        })
    }

    fn ensure_physical_name_available(
        &self,
        project: &ProjectId,
        kind: AssetKind,
        relative_path: &str,
        discovery_name: &str,
    ) -> Result<(), AuthoringError> {
        let directory = if matches!(kind, AssetKind::Background | AssetKind::CharacterAppearance) {
            "game/images"
        } else {
            "game/audio"
        };
        let files = self
            .transactions
            .inventory_files(project, directory)
            .map_err(|_| AuthoringError::SourceConflict)?;
        for existing in files {
            if existing.eq_ignore_ascii_case(relative_path) {
                return Err(AuthoringError::PathCollision);
            }
            let existing_name = if directory == "game/images" {
                automatic_image_name(&existing)
            } else {
                Path::new(&existing)
                    .file_stem()
                    .and_then(OsStr::to_str)
                    .map(str::to_owned)
            };
            if existing_name.as_deref() == Some(discovery_name) {
                return Err(AuthoringError::DiscoveryCollision);
            }
        }
        Ok(())
    }

    fn snapshot(
        &self,
        project: &ProjectId,
        path: &str,
    ) -> Result<(Vec<u8>, Revision), AuthoringError> {
        self.transactions
            .snapshot(
                project,
                RelativePath::new(path).map_err(|_| AuthoringError::Io)?,
            )
            .map_err(|_| AuthoringError::SourceConflict)
    }

    fn ensure_source_symbol_available(
        &self,
        project: &ProjectId,
        name: &str,
    ) -> Result<(), AuthoringError> {
        for path in [CHARACTERS_PATH, VARIABLES_PATH] {
            let (bytes, _) = self.snapshot(project, path)?;
            let source =
                std::str::from_utf8(&bytes).map_err(|_| AuthoringError::UnsupportedSource)?;
            if source
                .lines()
                .any(|line| top_level_symbol(line) == Some(name))
            {
                return Err(AuthoringError::SymbolCollision);
            }
        }
        Ok(())
    }

    #[allow(clippy::type_complexity)]
    fn load_metadata(
        &self,
        project: &ProjectId,
        project_uuid: &str,
    ) -> Result<(AuthoringMetadata, Option<(Vec<u8>, Revision)>), AuthoringError> {
        let snapshot = self
            .transactions
            .snapshot_optional(
                project,
                RelativePath::new(AUTHORING_PATH).map_err(|_| AuthoringError::Io)?,
            )
            .map_err(|_| AuthoringError::Io)?;
        let metadata = match &snapshot {
            Some((bytes, _)) if bytes.len() <= 1024 * 1024 => {
                serde_json::from_slice::<AuthoringMetadata>(bytes)
                    .map_err(|_| AuthoringError::CorruptMetadata)?
            }
            Some(_) => return Err(AuthoringError::CorruptMetadata),
            None => AuthoringMetadata::empty(project_uuid.to_owned()),
        };
        metadata.validate(project_uuid)?;
        Ok((metadata, snapshot))
    }

    #[allow(clippy::too_many_arguments)]
    fn commit_source_and_metadata(
        &self,
        project: &ProjectId,
        source_path: &str,
        source_bytes: Vec<u8>,
        source_revision: Revision,
        new_source: Vec<u8>,
        metadata: AuthoringMetadata,
        metadata_snapshot: Option<(Vec<u8>, Revision)>,
    ) -> Result<AuthoringMetadata, AuthoringError> {
        let source = FileMutation {
            path: RelativePath::new(source_path).map_err(|_| AuthoringError::Io)?,
            kind: MutationKind::ReplaceExisting,
            base: source_revision,
            expected_bytes: source_bytes,
            proposed: new_source,
        };
        let proposal = TransactionProposal {
            mutations: vec![
                source,
                metadata_file_mutation(metadata_snapshot, &metadata)?,
            ],
            intent: TransactionIntent::Edit,
        };
        committed(self.transactions.commit(project, proposal))?;
        Ok(metadata)
    }
}

fn metadata_file_mutation(
    snapshot: Option<(Vec<u8>, Revision)>,
    metadata: &AuthoringMetadata,
) -> Result<FileMutation, AuthoringError> {
    let proposed =
        serde_json::to_vec_pretty(metadata).map_err(|_| AuthoringError::CorruptMetadata)?;
    let (kind, expected_bytes, base) = match snapshot {
        Some((bytes, revision)) => (MutationKind::ReplaceExisting, bytes, revision),
        None => (
            MutationKind::CreateNew,
            Vec::new(),
            Revision::expected_absence(),
        ),
    };
    Ok(FileMutation {
        path: RelativePath::new(AUTHORING_PATH).map_err(|_| AuthoringError::Io)?,
        kind,
        base,
        expected_bytes,
        proposed,
    })
}

fn committed(outcome: CommitOutcome) -> Result<(), AuthoringError> {
    match outcome {
        CommitOutcome::Committed { .. } => Ok(()),
        CommitOutcome::RecoveryRequired { .. } => Err(AuthoringError::RecoveryRequired),
        CommitOutcome::Conflict { .. } => Err(AuthoringError::SourceConflict),
        CommitOutcome::Rejected { diagnostic } => match diagnostic.code {
            crate::transaction::ErrorCode::AlreadyExists => Err(AuthoringError::PathCollision),
            crate::transaction::ErrorCode::RecoveryRequired => {
                Err(AuthoringError::RecoveryRequired)
            }
            _ => Err(AuthoringError::SourceConflict),
        },
    }
}

fn ensure_symbol_available(metadata: &AuthoringMetadata, name: &str) -> Result<(), AuthoringError> {
    if metadata
        .characters
        .iter()
        .any(|item| item.technical_name == name)
        || metadata
            .variables
            .iter()
            .any(|item| item.technical_name == name)
    {
        Err(AuthoringError::SymbolCollision)
    } else {
        Ok(())
    }
}

pub fn validate_identifier(value: &str) -> Result<(), AuthoringError> {
    if value.is_empty()
        || value.len() > 64
        || value.starts_with('_')
        || !value.as_bytes()[0].is_ascii_lowercase()
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
    {
        return Err(AuthoringError::InvalidIdentifier);
    }
    const PYTHON_KEYWORDS: &[&str] = &[
        "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class",
        "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global",
        "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
        "try", "while", "with", "yield",
    ];
    const RENPY_RESERVED: &[&str] = &[
        "renpy",
        "store",
        "config",
        "persistent",
        "preferences",
        "gui",
        "style",
        "main_menu",
        "start",
        "quit",
        "save",
        "load",
        "rollback",
        "narrator",
    ];
    if PYTHON_KEYWORDS.contains(&value) || RENPY_RESERVED.contains(&value) {
        return Err(AuthoringError::ReservedIdentifier);
    }
    Ok(())
}

fn validate_display(value: &str) -> Result<(), AuthoringError> {
    if value.trim().is_empty() || value.len() > MAX_TEXT || value.chars().any(char::is_control) {
        Err(AuthoringError::InvalidPayload)
    } else {
        Ok(())
    }
}

fn validate_color(value: &str) -> Result<(), AuthoringError> {
    if value.len() == 7
        && value.starts_with('#')
        && value[1..].bytes().all(|byte| byte.is_ascii_hexdigit())
    {
        Ok(())
    } else {
        Err(AuthoringError::InvalidColor)
    }
}

fn validate_uuid(value: &str) -> Result<(), AuthoringError> {
    uuid::Uuid::parse_str(value)
        .map(|_| ())
        .map_err(|_| AuthoringError::InvalidPayload)
}

fn validate_hash(value: &str) -> Result<(), AuthoringError> {
    if value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        Ok(())
    } else {
        Err(AuthoringError::InvalidPayload)
    }
}

fn character_statement(name: &str, display: &str, color: &str) -> Result<String, AuthoringError> {
    let display = serde_json::to_string(display).map_err(|_| AuthoringError::InvalidPayload)?;
    Ok(format!(
        "define {name} = Character({display}, color=\"{}\")",
        color.to_ascii_lowercase()
    ))
}

pub fn variable_literal(kind: VariableType, value: &Value) -> Result<String, AuthoringError> {
    match (kind, value) {
        (VariableType::Bool, Value::Bool(true)) => Ok("True".into()),
        (VariableType::Bool, Value::Bool(false)) => Ok("False".into()),
        (VariableType::Int, Value::Number(number)) if number.is_i64() => Ok(number.to_string()),
        (VariableType::Int, Value::String(text)) if valid_i64_decimal(text) => Ok(text.clone()),
        (VariableType::String, Value::String(text)) if text.len() <= 10_000 => {
            serde_json::to_string(text).map_err(|_| AuthoringError::InvalidValue)
        }
        _ => Err(AuthoringError::InvalidValue),
    }
}

fn valid_i64_decimal(value: &str) -> bool {
    if value.is_empty()
        || value.starts_with('+')
        || (value.starts_with('0') && value.len() > 1)
        || value.starts_with("-0")
        || !value
            .strip_prefix('-')
            .unwrap_or(value)
            .bytes()
            .all(|byte| byte.is_ascii_digit())
    {
        return false;
    }
    value
        .parse::<i64>()
        .is_ok_and(|parsed| parsed.to_string() == value)
}

fn append_statement(source: &[u8], statement: &str) -> Vec<u8> {
    let newline = if source.windows(2).any(|pair| pair == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let mut output = source.to_vec();
    if !output.is_empty() && !output.ends_with(b"\n") {
        output.extend_from_slice(newline.as_bytes());
    }
    output.extend_from_slice(statement.as_bytes());
    output.extend_from_slice(newline.as_bytes());
    output
}

fn ensure_safe_append(source: &[u8]) -> Result<(), AuthoringError> {
    let text = std::str::from_utf8(source).map_err(|_| AuthoringError::UnsupportedSource)?;
    if !source.is_empty() && !source.ends_with(b"\n") {
        return Err(AuthoringError::UnsupportedSource);
    }
    if text.lines().last().is_some_and(|line| line.ends_with('\\')) {
        return Err(AuthoringError::UnsupportedSource);
    }
    let mut single = false;
    let mut double = false;
    let mut escaped = false;
    for character in text.chars() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
        } else if character == '\'' && !double {
            single = !single;
        } else if character == '"' && !single {
            double = !double;
        }
    }
    if escaped || single || double {
        Err(AuthoringError::UnsupportedSource)
    } else {
        Ok(())
    }
}

fn top_level_symbol(line: &str) -> Option<&str> {
    if line.chars().next().is_some_and(char::is_whitespace) {
        return None;
    }
    let remainder = line
        .strip_prefix("define ")
        .or_else(|| line.strip_prefix("default "))?;
    let symbol = remainder.split_ascii_whitespace().next()?;
    validate_identifier(symbol).is_ok().then_some(symbol)
}

fn replace_exact_once(
    source: &[u8],
    expected: &str,
    replacement: &str,
) -> Result<Vec<u8>, AuthoringError> {
    if expected.is_empty() || expected.contains(['\r', '\n']) {
        return Err(AuthoringError::UnsupportedSource);
    }
    let expected = expected.as_bytes();
    let matches = statement_ranges(source)
        .filter_map(|(start, end)| (&source[start..end] == expected).then_some(start))
        .collect::<Vec<_>>();
    if matches.len() != 1 {
        return Err(AuthoringError::UnsupportedSource);
    }
    let index = matches[0];
    let mut output =
        Vec::with_capacity(source.len() + replacement.len().saturating_sub(expected.len()));
    output.extend_from_slice(&source[..index]);
    output.extend_from_slice(replacement.as_bytes());
    output.extend_from_slice(&source[index + expected.len()..]);
    Ok(output)
}

fn statement_ranges(source: &[u8]) -> impl Iterator<Item = (usize, usize)> + '_ {
    let mut start = 0;
    std::iter::from_fn(move || {
        if start >= source.len() {
            return None;
        }
        let line_start = start;
        let relative_end = source[line_start..]
            .iter()
            .position(|byte| *byte == b'\n')
            .unwrap_or(source.len() - line_start);
        let mut line_end = line_start + relative_end;
        start = if line_end < source.len() {
            line_end + 1
        } else {
            source.len()
        };
        if line_end > line_start && source[line_end - 1] == b'\r' {
            line_end -= 1;
        }
        Some((line_start, line_end))
    })
}

fn verify_mapped_statements<'a>(
    source: &[u8],
    statements: impl Iterator<Item = &'a str>,
) -> Result<(), AuthoringError> {
    let ranges = statement_ranges(source).collect::<Vec<_>>();
    for statement in statements {
        let count = ranges
            .iter()
            .filter(|(start, end)| &source[*start..*end] == statement.as_bytes())
            .count();
        if count != 1 {
            return Err(AuthoringError::SourceConflict);
        }
    }
    Ok(())
}

fn supported_extension(extension: &str) -> bool {
    matches!(
        extension,
        "png" | "jpg" | "jpeg" | "webp" | "ogg" | "mp3" | "wav" | "flac"
    )
}

fn automatic_image_name(relative_path: &str) -> Option<String> {
    let path = relative_path.strip_prefix("game/images/")?;
    let stem = Path::new(path).file_stem()?.to_str()?;
    Some(stem.to_owned())
}

fn requires_explicit_declaration(asset: &Asset) -> bool {
    match asset.kind {
        AssetKind::Background | AssetKind::CharacterAppearance => {
            automatic_image_name(&asset.relative_path).as_deref()
                != Some(asset.discovery_name.as_str())
        }
        AssetKind::Music | AssetKind::Sfx => asset.relative_path.ends_with(".flac"),
    }
}

fn asset_declaration(asset: &Asset) -> Result<String, AuthoringError> {
    let runtime_path = asset
        .relative_path
        .strip_prefix("game/")
        .ok_or(AuthoringError::CorruptMetadata)?;
    let quoted =
        serde_json::to_string(runtime_path).map_err(|_| AuthoringError::CorruptMetadata)?;
    Ok(match asset.kind {
        AssetKind::Background | AssetKind::CharacterAppearance => {
            format!("image {} = {quoted}", asset.discovery_name)
        }
        AssetKind::Music | AssetKind::Sfx => {
            format!("define audio.{} = {quoted}", asset.discovery_name)
        }
    })
}

fn import_names(
    metadata: &AuthoringMetadata,
    kind: AssetKind,
    technical: &str,
    character_id: Option<&str>,
    expression: Option<&str>,
    extension: &str,
) -> Result<(String, String), AuthoringError> {
    let image = matches!(extension, "png" | "jpg" | "jpeg" | "webp");
    let audio = matches!(extension, "ogg" | "mp3" | "wav" | "flac");
    if (matches!(kind, AssetKind::Background | AssetKind::CharacterAppearance) && !image)
        || (matches!(kind, AssetKind::Music | AssetKind::Sfx) && !audio)
    {
        return Err(AuthoringError::UnsupportedFormat);
    }
    match kind {
        AssetKind::Background => Ok((
            format!("game/images/bg {technical}.{extension}"),
            format!("bg {technical}"),
        )),
        AssetKind::CharacterAppearance => {
            let character = metadata
                .characters
                .iter()
                .find(|item| Some(item.id.as_str()) == character_id)
                .ok_or(AuthoringError::UnknownEntity)?;
            let expression = expression.ok_or(AuthoringError::InvalidPayload)?;
            validate_identifier(expression)?;
            if metadata.appearances.iter().any(|item| {
                item.character_id == character.id
                    && item.attributes.get("expression").map(String::as_str) == Some(expression)
            }) {
                return Err(AuthoringError::DiscoveryCollision);
            }
            Ok((
                format!(
                    "game/images/{} {}.{}",
                    character.technical_name, expression, extension
                ),
                format!("{} {}", character.technical_name, expression),
            ))
        }
        AssetKind::Music => Ok((
            format!("game/audio/music_{technical}.{extension}"),
            format!("music_{technical}"),
        )),
        AssetKind::Sfx => Ok((
            format!("game/audio/sfx_{technical}.{extension}"),
            format!("sfx_{technical}"),
        )),
    }
}

fn hash_file(file: &mut File) -> Result<(u64, String), AuthoringError> {
    file.seek(SeekFrom::Start(0))
        .map_err(|_| AuthoringError::Io)?;
    let mut digest = Sha256::new();
    let mut count = 0_u64;
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        let read = file.read(&mut buffer).map_err(|_| AuthoringError::Io)?;
        if read == 0 {
            break;
        }
        count = count
            .checked_add(read as u64)
            .ok_or(AuthoringError::OversizeImport)?;
        if count > MAX_IMPORT_BYTES {
            return Err(AuthoringError::OversizeImport);
        }
        digest.update(&buffer[..read]);
    }
    file.seek(SeekFrom::Start(0))
        .map_err(|_| AuthoringError::Io)?;
    Ok((count, hex::encode(digest.finalize())))
}

fn identity_for_selected(file: &File) -> Result<FileIdentity, AuthoringError> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let metadata = file.metadata().map_err(|_| AuthoringError::Io)?;
        Ok(FileIdentity {
            volume: metadata.dev(),
            file: metadata.ino(),
        })
    }
    #[cfg(windows)]
    {
        use std::{mem::zeroed, os::windows::io::AsRawHandle};
        use windows_sys::Win32::Storage::FileSystem::{
            GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION,
        };
        let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
        if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut info) } == 0 {
            return Err(AuthoringError::Io);
        }
        Ok(FileIdentity {
            volume: u64::from(info.dwVolumeSerialNumber),
            file: (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow),
        })
    }
}

fn identity_for_metadata(metadata: &fs::Metadata) -> Option<FileIdentity> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        Some(FileIdentity {
            volume: metadata.dev(),
            file: metadata.ino(),
        })
    }
    #[cfg(windows)]
    {
        let _ = metadata;
        None
    }
}

fn revalidate_selected(authority: &ImportAuthority) -> Result<(), AuthoringError> {
    let current = identity_for_selected(&authority.file)?;
    if current != authority.identity {
        return Err(AuthoringError::UnknownImport);
    }
    // A same-path replacement cannot redirect import because the retained handle is
    // the byte source. This check only detects it early and avoids misleading UI.
    authority
        .parent
        .validate_chain()
        .map_err(|_| AuthoringError::UnknownImport)?;
    let path_file = authority
        .parent
        .open_file(&authority.name)
        .map_err(|_| AuthoringError::UnknownImport)?;
    if identity_for_selected(&path_file)? != authority.identity {
        return Err(AuthoringError::UnknownImport);
    }
    Ok(())
}

fn hash_bytes(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn identifiers_share_a_conservative_namespace() {
        for name in ["", "_private", "two words", "class", "renpy", "start"] {
            assert!(validate_identifier(name).is_err(), "{name}");
        }
        assert!(validate_identifier("alice_2").is_ok());
    }

    #[test]
    fn variable_literals_are_typed_and_deterministic() {
        assert_eq!(
            variable_literal(VariableType::Bool, &Value::Bool(true)).unwrap(),
            "True"
        );
        assert_eq!(
            variable_literal(VariableType::Bool, &Value::Bool(false)).unwrap(),
            "False"
        );
        assert_eq!(
            variable_literal(VariableType::Int, &Value::from(-42)).unwrap(),
            "-42"
        );
        for value in [
            "0",
            "-1",
            "9223372036854775807",
            "-9223372036854775808",
            "9007199254740993",
        ] {
            assert_eq!(
                variable_literal(VariableType::Int, &Value::String(value.into())).unwrap(),
                value
            );
        }
        for value in [
            "",
            " ",
            "+1",
            "01",
            "-0",
            "1.0",
            "1e3",
            "0x10",
            "9223372036854775808",
            "-9223372036854775809",
        ] {
            assert!(
                variable_literal(VariableType::Int, &Value::String(value.into())).is_err(),
                "{value}"
            );
        }
        assert_eq!(
            variable_literal(
                VariableType::String,
                &Value::String("quote \" slash \\ café\n".into())
            )
            .unwrap(),
            "\"quote \\\" slash \\\\ café\\n\""
        );
        assert!(variable_literal(VariableType::Int, &Value::String("1 + 2".into())).is_err());
    }

    #[test]
    fn narrow_patches_preserve_unrelated_bytes_and_newlines() {
        let source = b"# before\r\ndefine alice = Character(\"Alice\", color=\"#ffffff\")\r\n# unsupported $ x()\r\n";
        let updated = replace_exact_once(
            source,
            "define alice = Character(\"Alice\", color=\"#ffffff\")",
            "define alice = Character(\"Alicia\", color=\"#112233\")",
        )
        .unwrap();
        assert_eq!(
            updated,
            b"# before\r\ndefine alice = Character(\"Alicia\", color=\"#112233\")\r\n# unsupported $ x()\r\n"
        );
        assert_eq!(
            append_statement(b"# comment\r\n", "default flag = True"),
            b"# comment\r\ndefault flag = True\r\n"
        );
        assert!(matches!(
            replace_exact_once(
                b"default score = 10\n",
                "default score = 1",
                "default score = 5"
            ),
            Err(AuthoringError::UnsupportedSource)
        ));
        assert!(matches!(
            ensure_safe_append(b"default text = \"unterminated\n"),
            Err(AuthoringError::UnsupportedSource)
        ));
        assert!(matches!(
            ensure_safe_append(b"default value = (1 + \\\n"),
            Err(AuthoringError::UnsupportedSource)
        ));
        assert!(matches!(
            replace_exact_once(
                b"# default score = 1\n",
                "default score = 1",
                "default score = 5"
            ),
            Err(AuthoringError::UnsupportedSource)
        ));
    }

    #[test]
    fn deterministic_discovery_names_ignore_directory_namespaces() {
        let metadata = AuthoringMetadata::empty(uuid::Uuid::new_v4().to_string());
        assert_eq!(
            import_names(&metadata, AssetKind::Background, "cafe", None, None, "png").unwrap(),
            ("game/images/bg cafe.png".into(), "bg cafe".into())
        );
        assert_eq!(
            import_names(&metadata, AssetKind::Music, "theme", None, None, "ogg").unwrap(),
            ("game/audio/music_theme.ogg".into(), "music_theme".into())
        );
    }

    #[test]
    fn selected_file_hashing_is_bounded_and_repeatable() {
        let temp = tempdir().unwrap();
        let path = temp.path().join("large.png");
        let file = File::create(&path).unwrap();
        file.set_len(17 * 1024 * 1024).unwrap();
        drop(file);
        let mut file = File::open(path).unwrap();
        let (count, hash) = hash_file(&mut file).unwrap();
        assert_eq!(count, 17 * 1024 * 1024);
        assert_eq!(hash.len(), 64);
    }

    #[test]
    fn selected_path_substitution_cannot_redirect_import() {
        let (_temporary, root, project_uuid) = project_fixture();
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let selected_path = root.join("selected.png");
        fs::write(&selected_path, b"approved bytes").unwrap();
        let selected = service.select_import(&authority, &selected_path).unwrap();
        fs::rename(&selected_path, root.join("moved-approved.png")).unwrap();
        fs::write(&selected_path, b"replacement bytes").unwrap();
        assert!(matches!(
            service.import_asset(
                &authority,
                &project_uuid,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::Background,
                    technical_name: "cafe".into(),
                    display_name: "Cafe".into(),
                    character_id: None,
                    expression: None,
                },
            ),
            Err(AuthoringError::UnknownImport)
        ));
        assert!(!root.join("game/images/bg cafe.png").exists());
    }

    #[test]
    fn import_size_limit_is_checked_before_streaming() {
        let (_temporary, root, _project_uuid) = project_fixture();
        let selected_path = root.join("oversize.png");
        let file = File::create(&selected_path).unwrap();
        file.set_len(MAX_IMPORT_BYTES + 1).unwrap();
        drop(file);
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        assert!(matches!(
            service.select_import(&authority, &selected_path),
            Err(AuthoringError::OversizeImport)
        ));
    }

    fn project_fixture() -> (tempfile::TempDir, PathBuf, String) {
        let temporary = tempdir().unwrap();
        let root = fs::canonicalize(temporary.path()).unwrap();
        fs::create_dir_all(root.join("game/definitions")).unwrap();
        fs::create_dir_all(root.join("game/images")).unwrap();
        fs::create_dir_all(root.join("game/audio")).unwrap();
        fs::create_dir_all(root.join(".renpy-editor/recovery")).unwrap();
        fs::write(
            root.join(CHARACTERS_PATH),
            b"# Characters\n\n# external source remains here\n",
        )
        .unwrap();
        fs::write(root.join(VARIABLES_PATH), b"# Variables\r\n").unwrap();
        (temporary, root, uuid::Uuid::new_v4().to_string())
    }

    #[test]
    fn stable_entities_round_trip_and_source_is_minimally_patched() {
        let (_temporary, root, project_uuid) = project_fixture();
        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let before = fs::read(root.join(CHARACTERS_PATH)).unwrap();
        let model = service
            .create_character(
                &authority,
                &project_uuid,
                CreateCharacterRequest {
                    technical_name: "alice".into(),
                    display_name: "Alice".into(),
                    dialogue_color: "#aabbcc".into(),
                },
            )
            .unwrap();
        let character_id = model.characters[0].id.clone();
        let after = fs::read(root.join(CHARACTERS_PATH)).unwrap();
        assert!(after.starts_with(&before));
        assert!(after.ends_with(b"define alice = Character(\"Alice\", color=\"#aabbcc\")\n"));

        let model = service
            .create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "chapter_seen".into(),
                    variable_type: VariableType::Bool,
                    default_value: Value::Bool(false),
                },
            )
            .unwrap();
        let variable_id = model.variables[0].id.clone();
        assert!(matches!(
            service.create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "alice".into(),
                    variable_type: VariableType::Int,
                    default_value: Value::from(1),
                },
            ),
            Err(AuthoringError::SymbolCollision)
        ));
        drop(service);

        let reopened = AuthoringService::default();
        let reopened_authority = reopened.register_project(&root).unwrap();
        let reopened_model = reopened.list(&reopened_authority, &project_uuid).unwrap();
        assert_eq!(reopened_model.characters[0].id, character_id);
        assert_eq!(reopened_model.variables[0].id, variable_id);
        assert_eq!(fs::read(root.join(CHARACTERS_PATH)).unwrap(), after);
    }

    #[test]
    fn corrupt_metadata_never_rewrites_authoritative_source() {
        let (_temporary, root, project_uuid) = project_fixture();
        fs::write(root.join(AUTHORING_PATH), b"{ corrupt").unwrap();
        let before_characters = fs::read(root.join(CHARACTERS_PATH)).unwrap();
        let before_variables = fs::read(root.join(VARIABLES_PATH)).unwrap();
        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        assert!(matches!(
            service.list(&authority, &project_uuid),
            Err(AuthoringError::CorruptMetadata)
        ));
        assert_eq!(
            fs::read(root.join(CHARACTERS_PATH)).unwrap(),
            before_characters
        );
        assert_eq!(
            fs::read(root.join(VARIABLES_PATH)).unwrap(),
            before_variables
        );
    }

    #[test]
    fn empty_metadata_statement_is_controlled_corruption_not_a_panic() {
        let (_temporary, root, project_uuid) = project_fixture();
        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let model = service
            .create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "score".into(),
                    variable_type: VariableType::Int,
                    default_value: Value::String("1".into()),
                },
            )
            .unwrap();
        let mut corrupt = model;
        corrupt.variables[0].source.statement.clear();
        fs::write(
            root.join(AUTHORING_PATH),
            serde_json::to_vec_pretty(&corrupt).unwrap(),
        )
        .unwrap();
        assert!(matches!(
            service.list(&authority, &project_uuid),
            Err(AuthoringError::CorruptMetadata)
        ));
        assert_eq!(
            fs::read_to_string(root.join(VARIABLES_PATH)).unwrap(),
            "# Variables\r\ndefault score = 1\r\n"
        );
    }

    #[test]
    fn external_numeric_prefix_change_cannot_be_refreshed_or_rewritten() {
        let (_temporary, root, project_uuid) = project_fixture();
        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let model = service
            .create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "score".into(),
                    variable_type: VariableType::Int,
                    default_value: Value::from(1),
                },
            )
            .unwrap();
        let variable_id = model.variables[0].id.clone();
        fs::write(
            root.join(VARIABLES_PATH),
            b"# Variables\r\ndefault score = 10\r\n",
        )
        .unwrap();

        assert!(matches!(
            service.create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "other".into(),
                    variable_type: VariableType::Int,
                    default_value: Value::from(2),
                },
            ),
            Err(AuthoringError::SourceConflict)
        ));
        assert!(matches!(
            service.update_variable(
                &authority,
                &project_uuid,
                UpdateVariableRequest {
                    id: variable_id,
                    expected_source_revision: hash_bytes(
                        &fs::read(root.join(VARIABLES_PATH)).unwrap()
                    ),
                    default_value: Value::from(5),
                },
            ),
            Err(AuthoringError::SourceConflict)
        ));
        assert_eq!(
            fs::read(root.join(VARIABLES_PATH)).unwrap(),
            b"# Variables\r\ndefault score = 10\r\n"
        );
        assert!(matches!(
            service.list(&authority, &project_uuid),
            Err(AuthoringError::SourceConflict)
        ));
    }

    #[test]
    fn unknown_metadata_fields_and_entity_ids_survive_supported_edits() {
        let (_temporary, root, project_uuid) = project_fixture();
        let mut metadata = AuthoringMetadata::empty(project_uuid.clone());
        metadata
            .extra
            .insert("futureField".into(), Value::String("preserved".into()));
        fs::write(
            root.join(AUTHORING_PATH),
            serde_json::to_vec_pretty(&metadata).unwrap(),
        )
        .unwrap();
        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let updated = service
            .create_variable(
                &authority,
                &project_uuid,
                CreateVariableRequest {
                    technical_name: "flag".into(),
                    variable_type: VariableType::Bool,
                    default_value: Value::Bool(true),
                },
            )
            .unwrap();
        assert_eq!(
            updated.extra.get("futureField"),
            Some(&Value::String("preserved".into()))
        );
        assert_eq!(updated.variables.len(), 1);
        let stable_id = updated.variables[0].id.clone();
        let decoded: AuthoringMetadata =
            serde_json::from_slice(&fs::read(root.join(AUTHORING_PATH)).unwrap()).unwrap();
        assert_eq!(decoded.variables[0].id, stable_id);
        assert_eq!(
            decoded.extra.get("futureField"),
            Some(&Value::String("preserved".into()))
        );
    }

    #[test]
    fn appearance_import_keeps_asset_and_relationship_ids_after_reopen() {
        let (_temporary, root, project_uuid) = project_fixture();
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let model = service
            .create_character(
                &authority,
                &project_uuid,
                CreateCharacterRequest {
                    technical_name: "alice".into(),
                    display_name: "Alice".into(),
                    dialogue_color: "#ffffff".into(),
                },
            )
            .unwrap();
        let selected_path = root.join("selected.png");
        fs::write(&selected_path, b"synthetic raster fixture").unwrap();
        let selected = service.select_import(&authority, &selected_path).unwrap();
        let imported = service
            .import_asset(
                &authority,
                &project_uuid,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::CharacterAppearance,
                    technical_name: "happy".into(),
                    display_name: "Alice happy".into(),
                    character_id: Some(model.characters[0].id.clone()),
                    expression: Some("happy".into()),
                },
            )
            .unwrap();
        let asset_id = imported.assets[0].id.clone();
        let appearance_id = imported.appearances[0].id.clone();
        assert_eq!(
            imported.characters[0].default_appearance_id.as_deref(),
            Some(appearance_id.as_str())
        );
        assert_eq!(
            fs::read(root.join("game/images/alice happy.png")).unwrap(),
            b"synthetic raster fixture"
        );
        drop(service);

        let reopened = AuthoringService::default();
        let reopened_authority = reopened.register_project(&root).unwrap();
        let model = reopened.list(&reopened_authority, &project_uuid).unwrap();
        assert_eq!(model.assets[0].id, asset_id);
        assert_eq!(model.appearances[0].id, appearance_id);
        assert_eq!(model.appearances[0].asset_id, asset_id);
    }

    #[test]
    fn physical_asset_status_and_explicit_legacy_name_repair_are_truthful() {
        let (_temporary, root, project_uuid) = project_fixture();
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let selected_path = root.join("selected.png");
        fs::write(&selected_path, b"background bytes").unwrap();
        let selected = service.select_import(&authority, &selected_path).unwrap();
        let imported = service
            .import_asset(
                &authority,
                &project_uuid,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::Background,
                    technical_name: "cafe".into(),
                    display_name: "Cafe".into(),
                    character_id: None,
                    expression: None,
                },
            )
            .unwrap();
        let asset_id = imported.assets[0].id.clone();
        fs::rename(
            root.join("game/images/bg cafe.png"),
            root.join("game/images/bg_cafe.png"),
        )
        .unwrap();
        let mut legacy: AuthoringMetadata =
            serde_json::from_slice(&fs::read(root.join(AUTHORING_PATH)).unwrap()).unwrap();
        legacy.assets[0].relative_path = "game/images/bg_cafe.png".into();
        fs::write(
            root.join(AUTHORING_PATH),
            serde_json::to_vec_pretty(&legacy).unwrap(),
        )
        .unwrap();
        drop(service);

        let service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let before = service.list(&authority, &project_uuid).unwrap();
        assert_eq!(before.assets[0].id, asset_id);
        assert_eq!(before.assets[0].status, "compatibilityRequired");
        let repaired = service
            .repair_asset_compatibility(&authority, &project_uuid)
            .unwrap();
        assert_eq!(repaired.assets[0].id, asset_id);
        assert_eq!(repaired.assets[0].status, "available");
        assert_eq!(
            fs::read_to_string(root.join(ASSETS_PATH)).unwrap(),
            "image bg cafe = \"images/bg_cafe.png\"\n"
        );

        fs::write(root.join("game/images/bg_cafe.png"), b"changed").unwrap();
        assert_eq!(
            service.list(&authority, &project_uuid).unwrap().assets[0].status,
            "changed"
        );
        fs::remove_file(root.join("game/images/bg_cafe.png")).unwrap();
        assert_eq!(
            service.list(&authority, &project_uuid).unwrap().assets[0].status,
            "missing"
        );
    }

    #[test]
    fn untracked_physical_asset_blocks_path_and_discovery_collisions() {
        let (_temporary, root, project_uuid) = project_fixture();
        fs::write(root.join("game/images/bg cafe.webp"), b"external").unwrap();
        let selected_path = root.join("selected.png");
        fs::write(&selected_path, b"selected").unwrap();
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let selected = service.select_import(&authority, &selected_path).unwrap();
        assert!(matches!(
            service.import_asset(
                &authority,
                &project_uuid,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::Background,
                    technical_name: "cafe".into(),
                    display_name: "Cafe".into(),
                    character_id: None,
                    expression: None,
                },
            ),
            Err(AuthoringError::DiscoveryCollision)
        ));
        assert_eq!(
            fs::read(root.join("game/images/bg cafe.webp")).unwrap(),
            b"external"
        );
        assert!(!root.join("game/images/bg cafe.png").exists());
    }

    #[test]
    fn flac_import_adds_an_explicit_audio_namespace_definition() {
        let (_temporary, root, project_uuid) = project_fixture();
        let selected_path = root.join("theme.flac");
        fs::write(&selected_path, b"synthetic flac fixture").unwrap();
        let mut service = AuthoringService::default();
        let authority = service.register_project(&root).unwrap();
        let selected = service.select_import(&authority, &selected_path).unwrap();
        let model = service
            .import_asset(
                &authority,
                &project_uuid,
                ImportAssetRequest {
                    authority_id: selected.authority_id,
                    kind: AssetKind::Music,
                    technical_name: "theme".into(),
                    display_name: "Theme".into(),
                    character_id: None,
                    expression: None,
                },
            )
            .unwrap();
        assert_eq!(model.assets[0].status, "available");
        assert_eq!(
            fs::read_to_string(root.join(ASSETS_PATH)).unwrap(),
            "define audio.music_theme = \"audio/music_theme.flac\"\n"
        );
        assert_eq!(
            fs::read(root.join("game/audio/music_theme.flac")).unwrap(),
            b"synthetic flac fixture"
        );
    }
}
