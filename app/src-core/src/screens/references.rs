//! Stable screen targets and conservative effects derived from captured source.
use super::*;
use crate::metadata::{OwnedScreenKind, ScreenTargetBinding, SourceMapMetadata};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ScreenRevisions {
    pub source: String,
    pub source_map: String,
    pub inventory: String,
    pub effects: String,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenDependencyRevision {
    pub id: String,
    pub revision: String,
}

/// With no unknown effects or hidden screens, this supported inventory is passive.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenEffects {
    pub revision: String,
    pub unknown: bool,
    pub hidden_screens: Vec<String>,
    pub dependencies: Vec<ScreenDependencyRevision>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedScreenTarget {
    pub binding: ScreenTargetBinding,
    pub kind: OwnedScreenKind,
    pub path: String,
    pub root_id: String,
    pub revisions: ScreenRevisions,
    pub effects: ScreenEffects,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ResolveTargetRequest {
    pub binding: ScreenTargetBinding,
    #[serde(default)]
    pub expected: Option<ScreenRevisions>,
}

struct Effects<'a> {
    map: &'a SourceMapMetadata,
    inventory: &'a ownership::Inventory,
    active: HashSet<String>,
    remaining: usize,
    unknown: bool,
    hidden: BTreeSet<String>,
    dependencies: BTreeMap<String, String>,
}

impl Effects<'_> {
    fn read(&mut self, id: &str, depth: usize) {
        if depth > MAX_DEPTH || self.remaining == 0 || !self.active.insert(id.to_owned()) {
            self.unknown = true;
            return;
        }
        self.remaining -= 1;
        let map = self.map;
        let inventory = self.inventory;
        let Some(owner) = map
            .owned_screens
            .iter()
            .find(|s| s.id == id)
            .filter(|s| ownership::resolves(s, inventory))
        else {
            self.unknown = true;
            self.active.remove(id);
            return;
        };
        let bytes = &inventory
            .files
            .iter()
            .find(|(p, _)| p == &owner.path)
            .unwrap()
            .1;
        self.dependencies.insert(id.to_owned(), digest(bytes));
        let Ok(document) = inspect(bytes, owner.path.clone(), digest(bytes)) else {
            self.unknown = true;
            self.active.remove(id);
            return;
        };
        self.unknown |= !document.protected.is_empty();
        let screen = document
            .screens
            .iter()
            .find(|s| s.name == owner.name)
            .unwrap();
        for node in &screen.nodes {
            if self.remaining == 0 {
                self.unknown = true;
                break;
            }
            self.remaining -= 1;
            if matches!(node.kind.as_str(), "text" | "textbutton" | "image")
                && node.literal.is_none()
            {
                self.unknown = true;
            }
            if node.kind == "use"
                && !map.component_uses.iter().any(|usage| {
                    usage.screen_id == owner.id && node.id.as_ref() == Some(&usage.node_id)
                })
            {
                self.unknown = true;
            }
            if matches!(node.kind.as_str(), "text" | "textbutton")
                && node.literal.as_ref().is_some_and(|text| text.contains('['))
            {
                self.unknown = true;
            }
            for span in &node.protected {
                let Ok(lines) = source_lines(&bytes[span.start..span.end]) else {
                    self.unknown = true;
                    continue;
                };
                if lines.len() != 1 {
                    self.unknown = true;
                    continue;
                }
                let code = lines[0].code;
                if (code == "modal False" && node.kind == "screen")
                    || (matches!(code, "default_focus True" | "action Null()")
                        && node.kind == "textbutton")
                {
                    continue;
                }
                let hide = (if node.kind == "textbutton" {
                    code.strip_prefix("action Hide(")
                } else if node.kind == "screen" {
                    code.strip_prefix("key \"game_menu\" action Hide(")
                } else {
                    None
                })
                .and_then(|s| s.strip_suffix(')'))
                .and_then(|s| serde_json::from_str::<String>(s).ok());
                if hide
                    .filter(|name| name == &owner.name && owner.kind == OwnedScreenKind::Panel)
                    .is_some()
                {
                    self.hidden.insert(owner.id.clone());
                    self.dependencies.insert(
                        format!("{}:action", node.id.as_deref().unwrap_or(&owner.root_id)),
                        digest(code.as_bytes()),
                    );
                } else {
                    self.unknown = true;
                }
            }
        }
        // Until the marked use is verified against its typed binding, its effects are unknown.
        for usage in map
            .component_uses
            .iter()
            .filter(|u| u.screen_id == owner.id)
        {
            let node = screen
                .nodes
                .iter()
                .find(|n| n.id.as_ref() == Some(&usage.node_id));
            let component = map
                .owned_screens
                .iter()
                .find(|s| s.id == usage.component_id && s.kind == OwnedScreenKind::Component);
            match (node, component) {
                (Some(node), Some(component))
                    if node.kind == "use"
                        && node.literal.as_deref() == Some(&component.name)
                        && screen
                            .nodes
                            .iter()
                            .filter(|n| n.id.as_ref() == Some(&usage.node_id))
                            .count()
                            == 1 =>
                {
                    self.dependencies.insert(
                        usage.node_id.clone(),
                        digest(&bytes[node.span.start..node.source_end]),
                    );
                    self.read(&component.id, depth + 1);
                }
                _ => self.unknown = true,
            }
        }
        self.active.remove(id);
    }

    fn finish(self) -> ScreenEffects {
        let dependencies = self
            .dependencies
            .into_iter()
            .map(|(id, revision)| ScreenDependencyRevision { id, revision })
            .collect::<Vec<_>>();
        let hidden_screens = self.hidden.into_iter().collect::<Vec<_>>();
        let revision =
            digest(&serde_json::to_vec(&(self.unknown, &hidden_screens, &dependencies)).unwrap());
        ScreenEffects {
            revision,
            unknown: self.unknown,
            hidden_screens,
            dependencies,
        }
    }
}

fn digest(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

impl AuthoringService {
    pub(super) fn ensure_component_users_clean(
        &self,
        project: &ProjectId,
        project_id: &str,
        component_id: &str,
    ) -> Result<(), SceneError> {
        let (map, _, _, _) = self.screen_metadata(project, project_id)?;
        let mut affected = HashSet::from([component_id]);
        loop {
            let previous = affected.len();
            for usage in &map.component_uses {
                if affected.contains(usage.component_id.as_str()) {
                    affected.insert(usage.screen_id.as_str());
                }
            }
            if affected.len() == previous {
                break;
            }
        }
        self.ensure_source_paths_clean(
            project,
            map.owned_screens
                .iter()
                .filter(|s| affected.contains(s.id.as_str()))
                .map(|s| s.path.as_str()),
        )
        .map_err(|_| SceneError::DirtySource)
    }

    pub fn screens_resolve_target(
        &self,
        project: &ProjectId,
        project_id: &str,
        binding: &ScreenTargetBinding,
        expected: Option<&ScreenRevisions>,
    ) -> Result<ResolvedScreenTarget, SceneError> {
        let (map, _, map_revision, _) = self.screen_metadata(project, project_id)?;
        let inventory = self.screen_inventory(project)?;
        let owner = map
            .owned_screens
            .iter()
            .find(|s| s.id == binding.screen_id && s.name == binding.source_name)
            .filter(|s| ownership::resolves(s, &inventory))
            .ok_or(SceneError::ReferenceBlocked)?;
        let mut effects = Effects {
            map: &map,
            inventory: &inventory,
            active: HashSet::new(),
            remaining: MAX_NODES,
            unknown: false,
            hidden: BTreeSet::new(),
            dependencies: BTreeMap::new(),
        };
        effects.read(&owner.id, 0);
        let effects = effects.finish();
        let source = &inventory
            .files
            .iter()
            .find(|(p, _)| p == &owner.path)
            .unwrap()
            .1;
        let revisions = ScreenRevisions {
            source: digest(source),
            source_map: map_revision.sha256,
            inventory: inventory.revision,
            effects: effects.revision.clone(),
        };
        if expected.is_some_and(|expected| expected != &revisions) {
            return Err(SceneError::SourceConflict);
        }
        Ok(ResolvedScreenTarget {
            binding: binding.clone(),
            kind: owner.kind,
            path: owner.path.clone(),
            root_id: owner.root_id.clone(),
            revisions,
            effects,
        })
    }
}
