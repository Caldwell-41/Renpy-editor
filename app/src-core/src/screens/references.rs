//! Stable screen targets and conservative effects derived from captured source.
use super::*;
use crate::metadata::{OwnedScreen, OwnedScreenKind, ScreenTargetBinding, SourceMapMetadata};
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

/// Summarizes only qualified local actions; custom interactions remain unknown.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenEffects {
    pub revision: String,
    pub unknown: bool,
    pub hidden_screens: Vec<String>,
    pub shown_screens: Vec<String>,
    pub assigned_variables: Vec<String>,
    pub finishes_interaction: bool,
    pub dependencies: Vec<ScreenDependencyRevision>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedScreenTarget {
    pub binding: ScreenTargetBinding,
    pub kind: OwnedScreenKind,
    pub blocking: bool,
    pub can_show_hide: bool,
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

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ComponentUseLocation {
    pub(super) screen_id: String,
    pub(super) component_id: String,
    pub(super) node_id: String,
    pub(super) path: String,
    pub(super) screen_name: String,
    pub(super) span: Option<Span>,
    pub(super) source_revision: Option<String>,
    pub(super) resolved: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ComponentGraph {
    pub(super) complete: bool,
    pub(super) uses: Vec<ComponentUseLocation>,
}

impl ComponentGraph {
    pub(super) fn affected_owners(&self, component_id: &str) -> HashSet<String> {
        let mut affected = HashSet::from([component_id.to_owned()]);
        loop {
            let previous = affected.len();
            for usage in &self.uses {
                if affected.contains(&usage.component_id) {
                    affected.insert(usage.screen_id.clone());
                }
            }
            if affected.len() == previous {
                return affected;
            }
        }
    }

    pub(super) fn would_cycle(
        &self,
        component_id: &str,
        target_id: &str,
    ) -> Result<bool, SceneError> {
        if !self.complete {
            return Err(SceneError::OpaqueBoundary);
        }
        let mut pending = vec![component_id];
        let mut visited = HashSet::new();
        while let Some(id) = pending.pop() {
            if id == target_id {
                return Ok(true);
            }
            if !visited.insert(id) {
                continue;
            }
            if visited.len() > MAX_NODES {
                return Err(SceneError::InvariantBlocked);
            }
            pending.extend(
                self.uses
                    .iter()
                    .filter(|u| u.screen_id == id)
                    .map(|u| u.component_id.as_str()),
            );
        }
        if self.uses.len() >= MAX_NODES {
            return Err(SceneError::InvariantBlocked);
        }
        let mut adjacency = BTreeMap::<&str, Vec<&str>>::new();
        for usage in &self.uses {
            adjacency
                .entry(&usage.screen_id)
                .or_default()
                .push(&usage.component_id);
        }
        adjacency.entry(target_id).or_default().push(component_id);
        let mut active = HashSet::new();
        let mut heights = BTreeMap::new();
        for id in adjacency.keys() {
            if component_height(id, &adjacency, &mut active, &mut heights, 0).is_none() {
                return Err(SceneError::OpaqueBoundary);
            }
        }
        Ok(false)
    }
}

pub(super) fn component_graph(
    map: &SourceMapMetadata,
    inventory: &ownership::Inventory,
) -> ComponentGraph {
    let mut complete = inventory.complete && inventory.unresolved_styles.is_empty();
    let mut resolved_owners = HashSet::new();
    let mut source_revisions = BTreeMap::new();
    let mut observed = BTreeMap::new();
    let mut duplicate = HashSet::new();
    let mut remaining = MAX_NODES;
    for owner in &map.owned_screens {
        let Some((_, bytes)) = inventory.files.iter().find(|(p, _)| p == &owner.path) else {
            continue;
        };
        source_revisions.insert(owner.id.as_str(), digest(bytes));
        if ownership::resolves(owner, inventory) {
            resolved_owners.insert(owner.id.as_str());
        }
        let Ok(document) = inspect(bytes, owner.path.clone(), digest(bytes)) else {
            continue;
        };
        let Some(screen) = document.screens.iter().find(|s| s.name == owner.name) else {
            continue;
        };
        for node in screen.nodes.iter().filter(|n| n.kind == "use") {
            if remaining == 0 {
                complete = false;
                break;
            }
            remaining -= 1;
            let Some(id) = &node.id else {
                complete = false;
                continue;
            };
            let key = (owner.id.clone(), id.clone());
            if observed
                .insert(
                    key.clone(),
                    (
                        node.literal.clone(),
                        Span {
                            start: node.span.start,
                            end: node.source_end,
                        },
                    ),
                )
                .is_some()
            {
                duplicate.insert(key);
            }
        }
    }
    let mut uses = Vec::new();
    for usage in &map.component_uses {
        let owner = map.owned_screens.iter().find(|s| s.id == usage.screen_id);
        let target = map
            .owned_screens
            .iter()
            .find(|s| s.id == usage.component_id && s.kind == OwnedScreenKind::Component);
        let key = (usage.screen_id.clone(), usage.node_id.clone());
        let node = observed.get(&key);
        let resolved = !duplicate.contains(&key)
            && resolved_owners.contains(usage.screen_id.as_str())
            && resolved_owners.contains(usage.component_id.as_str())
            && node
                .zip(target)
                .is_some_and(|((name, _), target)| name.as_deref() == Some(target.name.as_str()));
        complete &= resolved;
        uses.push(ComponentUseLocation {
            screen_id: usage.screen_id.clone(),
            component_id: usage.component_id.clone(),
            node_id: usage.node_id.clone(),
            path: owner.map(|s| s.path.clone()).unwrap_or_default(),
            screen_name: owner.map(|s| s.name.clone()).unwrap_or_default(),
            span: node.map(|(_, span)| span.clone()),
            source_revision: source_revisions.get(usage.screen_id.as_str()).cloned(),
            resolved,
        });
    }
    let accounted = uses
        .iter()
        .filter(|u| u.resolved)
        .filter_map(|u| u.span.as_ref().map(|s| (u.path.as_str(), s.start)))
        .collect::<HashSet<_>>();
    let mut raw_count = 0usize;
    for (path, bytes) in &inventory.files {
        let Ok(lines) = source_lines(bytes) else {
            complete = false;
            continue;
        };
        for line in lines
            .iter()
            .filter(|l| l.code.split_whitespace().next() == Some("use"))
        {
            raw_count += 1;
            complete &= accounted.contains(&(path.as_str(), line.start));
            if raw_count > MAX_NODES {
                complete = false;
                break;
            }
        }
        if raw_count > MAX_NODES {
            break;
        }
    }
    let mut adjacency = BTreeMap::<&str, Vec<&str>>::new();
    for usage in uses.iter().filter(|u| u.resolved) {
        adjacency
            .entry(&usage.screen_id)
            .or_default()
            .push(&usage.component_id);
    }
    let mut active = HashSet::new();
    let mut heights = BTreeMap::new();
    for id in adjacency.keys() {
        if component_height(id, &adjacency, &mut active, &mut heights, 0).is_none() {
            complete = false;
            break;
        }
    }
    ComponentGraph { complete, uses }
}

fn component_height<'a>(
    id: &'a str,
    adjacency: &BTreeMap<&'a str, Vec<&'a str>>,
    active: &mut HashSet<&'a str>,
    heights: &mut BTreeMap<&'a str, usize>,
    depth: usize,
) -> Option<usize> {
    if depth > MAX_DEPTH {
        return None;
    }
    if let Some(height) = heights.get(id) {
        return Some(*height);
    }
    if !active.insert(id) {
        return None;
    }
    let mut height = 0;
    for child in adjacency.get(id).into_iter().flatten() {
        height = height.max(component_height(child, adjacency, active, heights, depth + 1)? + 1);
        if height > MAX_DEPTH {
            return None;
        }
    }
    active.remove(id);
    heights.insert(id, height);
    Some(height)
}

#[derive(Default)]
pub(super) struct InteractionQualification {
    pub(super) spans: BTreeMap<usize, bool>,
    pub(super) contextual: BTreeSet<usize>,
    pub(super) blocking: bool,
}

/// Exact single statements remain editable only in their owned interaction context.
pub(super) fn qualified_interaction(
    owner: &OwnedScreen,
    screen: &Screen,
    bytes: &[u8],
) -> InteractionQualification {
    let mut qualified = InteractionQualification::default();
    let Ok(lines) = source_lines(bytes) else {
        return qualified;
    };
    let interaction = actions::inspect_actions(owner, screen, bytes, &[], &[]);
    qualified.blocking = interaction.blocking;
    let span_lines = |span: &Span| {
        let start = lines.partition_point(|line| line.start < span.start);
        let end = lines.partition_point(|line| line.start < span.end);
        &lines[start..end]
    };
    for node in &screen.nodes {
        let mut statements = Vec::new();
        let mut counts = BTreeMap::<&str, usize>::new();
        for span in &node.protected {
            let lines = span_lines(span);
            let Some(line) = lines.first() else {
                continue;
            };
            let key = line.code.split_whitespace().next().unwrap_or("");
            *counts.entry(key).or_default() += 1;
            statements.push((span.start, key, line.code, lines.len() == 1));
        }
        for (start, key, code, single) in statements {
            if !single || counts[key] != 1 {
                continue;
            }
            if node.kind == "bar" && key == "value" {
                // Extraction changes the owner. It must not introduce an active
                // binding into a Component through an otherwise movable group.
                qualified.contextual.insert(start);
                continue;
            }
            if matches!(node.kind.as_str(), "textbutton" | "imagebutton") && key == "action" {
                // Extraction must not move a contextual or custom action into a
                // component. The shared grammar alone qualifies button actions.
                if interaction
                    .buttons
                    .get(&node.span.start)
                    .is_none_or(|button| !button.actions.is_empty())
                {
                    qualified.contextual.insert(start);
                }
                continue;
            }
            if owner.kind == OwnedScreenKind::Component {
                continue;
            }
            let modal = match owner.kind {
                OwnedScreenKind::Panel => "modal False",
                OwnedScreenKind::Dialog => "modal True",
                OwnedScreenKind::Component => unreachable!(),
            };
            if (node.kind == "screen" && code == modal)
                || (matches!(node.kind.as_str(), "textbutton" | "imagebutton")
                    && code == "default_focus True")
            {
                qualified.spans.insert(start, false);
                qualified.contextual.insert(start);
                continue;
            }
            if owner.kind == OwnedScreenKind::Dialog {
                if qualified.blocking
                    && node.kind == "screen"
                    && code == "key \"game_menu\" action Return()"
                {
                    qualified.spans.insert(start, true);
                    qualified.contextual.insert(start);
                }
                continue;
            }
            let hide = code
                .strip_prefix("key \"game_menu\" action Hide(")
                .filter(|_| node.kind == "screen")
                .and_then(|s| s.strip_suffix(')'))
                .and_then(|s| serde_json::from_str::<String>(s).ok());
            if hide.as_deref() == Some(owner.name.as_str()) {
                qualified.spans.insert(start, true);
                qualified.contextual.insert(start);
            }
        }
    }
    qualified
}

struct Effects<'a> {
    service: &'a AuthoringService,
    project: &'a ProjectId,
    map: &'a SourceMapMetadata,
    inventory: &'a ownership::Inventory,
    styles: &'a styles::Index,
    variables: &'a [crate::authoring::Variable],
    panels: &'a [actions::PanelTarget],
    authoring_revision: Option<&'a str>,
    active: HashSet<String>,
    visited_screens: HashSet<String>,
    remaining: usize,
    unknown: bool,
    hidden: BTreeSet<String>,
    shown: BTreeSet<String>,
    assigned: BTreeSet<String>,
    finishes_interaction: bool,
    blocking: bool,
    dependencies: BTreeMap<String, String>,
}

impl Effects<'_> {
    fn read(&mut self, id: &str, depth: usize) {
        if depth > MAX_DEPTH || self.remaining == 0 || !self.active.insert(id.to_owned()) {
            self.unknown = true;
            return;
        }
        self.remaining -= 1;
        self.visited_screens.insert(id.to_owned());
        let mut action_targets = BTreeSet::new();
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
        let Ok(mut document) = inspect(bytes, owner.path.clone(), digest(bytes)) else {
            self.unknown = true;
            self.active.remove(id);
            return;
        };
        self.unknown |= self.styles.resolve(&mut document, bytes).is_err();
        self.unknown |= document
            .protected
            .iter()
            .any(|span| !self.styles.supports_declaration(&owner.path, span.start));
        let screen = document
            .screens
            .iter()
            .find(|s| s.name == owner.name)
            .unwrap();
        let qualified = qualified_interaction(owner, screen, bytes);
        let interaction =
            actions::inspect_actions(owner, screen, bytes, self.variables, self.panels);
        self.unknown |= !interaction.unsupported.is_empty();
        if depth == 0 {
            self.blocking = interaction.blocking;
        }
        self.unknown |= owner.kind == OwnedScreenKind::Dialog && !interaction.blocking;
        for node in &screen.nodes {
            if self.remaining == 0 {
                self.unknown = true;
                break;
            }
            self.remaining -= 1;
            let mut control_starts = vec![];
            if node.kind == "bar" {
                if let Some((binding, _, starts)) =
                    control_source::inspect_bar(bytes, node, self.variables)
                {
                    self.assigned.insert(binding.variable_id.clone());
                    if let Ok(deps) = bindings::binding_dependencies(
                        &[interaction::VariableBinding {
                            variable_id: binding.variable_id,
                        }],
                        self.variables,
                    ) {
                        for dependency in deps {
                            self.dependencies.insert(dependency.id, dependency.revision);
                        }
                    } else {
                        self.unknown = true;
                    }
                    if let Some(revision) = self.authoring_revision {
                        self.dependencies
                            .insert("authoring".into(), revision.into());
                    }
                    self.dependencies.insert(
                        format!("{}:binding", node.id.as_deref().unwrap_or(&owner.root_id)),
                        digest(&bytes[node.span.start..node.source_end]),
                    );
                    control_starts = starts;
                } else {
                    self.unknown = true;
                }
            }
            if node.kind == "imagebutton" {
                if let Some((appearances, starts)) =
                    self.service
                        .inspect_imagebutton(self.project, &map.project_id, bytes, node)
                {
                    self.unknown |= self
                        .service
                        .imagebutton_values(self.project, &map.project_id, &appearances)
                        .is_err();
                    for reference in control_source::image_references(&appearances)
                        .into_iter()
                        .flatten()
                    {
                        self.dependencies.insert(
                            reference.asset_id.clone(),
                            reference.expected_asset_sha256.clone(),
                        );
                    }
                    if let Some(revision) = self.authoring_revision {
                        self.dependencies
                            .insert("authoring".into(), revision.into());
                    }
                    self.dependencies.insert(
                        format!(
                            "{}:appearances",
                            node.id.as_deref().unwrap_or(&owner.root_id)
                        ),
                        digest(&bytes[node.span.start..node.source_end]),
                    );
                    control_starts = starts;
                } else {
                    self.unknown = true;
                }
            }
            if let Some(button) = interaction.buttons.get(&node.span.start) {
                for dependency in &button.dependencies {
                    self.dependencies
                        .insert(dependency.id.clone(), dependency.revision.clone());
                }
                for action in &button.actions {
                    match action {
                        interaction::ScreenAction::SetVariable { variable_id, .. } => {
                            self.assigned.insert(variable_id.clone());
                            if let Some(revision) = self.authoring_revision {
                                self.dependencies
                                    .insert("authoring".into(), revision.into());
                            }
                        }
                        interaction::ScreenAction::ShowScreen { target } => {
                            self.shown.insert(target.screen_id.clone());
                            action_targets.insert(target.screen_id.clone());
                        }
                        interaction::ScreenAction::HideScreen { target } => {
                            self.hidden.insert(target.screen_id.clone());
                            action_targets.insert(target.screen_id.clone());
                        }
                        interaction::ScreenAction::FinishInteraction => {
                            self.finishes_interaction = true
                        }
                    }
                }
            }
            let binding = bindings::inspect_bindings(node, self.variables);
            if let Some(binding) = binding.as_ref().filter(|bindings| !bindings.is_empty()) {
                match bindings::binding_dependencies(binding, self.variables) {
                    Ok(dependencies) => {
                        for dependency in dependencies {
                            self.dependencies.insert(dependency.id, dependency.revision);
                        }
                        if let Some(revision) = self.authoring_revision {
                            self.dependencies
                                .insert("authoring".into(), revision.into());
                        }
                    }
                    Err(_) => self.unknown = true,
                }
            }
            if let Some(reference) = &node.style {
                if let Ok(definition) = self.styles.definition(&reference.name) {
                    if let Some((_, bytes)) =
                        inventory.files.iter().find(|(p, _)| p == &definition.path)
                    {
                        self.dependencies
                            .insert(format!("style:{}", definition.name), digest(bytes));
                    } else {
                        self.unknown = true;
                    }
                } else {
                    self.unknown = true;
                }
            }
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
                && binding.is_none()
                && node
                    .literal
                    .as_ref()
                    .is_some_and(|text| text.contains(['[', '{']))
            {
                self.unknown = true;
            }
            for span in &node.protected {
                if control_starts.contains(&span.start) {
                    continue;
                }
                if interaction
                    .buttons
                    .get(&node.span.start)
                    .is_some_and(|button| button.statement_span.start == span.start)
                {
                    continue;
                }
                if let Some(action) = qualified.spans.get(&span.start) {
                    if *action {
                        if owner.kind == OwnedScreenKind::Dialog {
                            self.finishes_interaction = true;
                        } else {
                            self.hidden.insert(owner.id.clone());
                        }
                        self.dependencies.insert(
                            format!("{}:action", node.id.as_deref().unwrap_or(&owner.root_id)),
                            digest(&bytes[span.start..span.end]),
                        );
                    }
                    continue;
                }
                self.unknown = true;
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
        // Action references may return to this screen without recursively including
        // its displayables. Keep those cycles finite while retaining component-cycle refusal.
        for target in action_targets {
            if !self.visited_screens.contains(&target) {
                self.read(&target, depth + 1);
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
        let shown_screens = self.shown.into_iter().collect::<Vec<_>>();
        let assigned_variables = self.assigned.into_iter().collect::<Vec<_>>();
        let revision = digest(
            &serde_json::to_vec(&(
                self.unknown,
                &hidden_screens,
                &shown_screens,
                &assigned_variables,
                self.finishes_interaction,
                self.blocking,
                &dependencies,
            ))
            .unwrap(),
        );
        ScreenEffects {
            revision,
            unknown: self.unknown,
            hidden_screens,
            shown_screens,
            assigned_variables,
            finishes_interaction: self.finishes_interaction,
            dependencies,
        }
    }
}

fn digest(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

impl AuthoringService {
    pub(super) fn require_component_write_review(
        &self,
        project: &ProjectId,
        project_id: &str,
        binding: &ScreenTargetBinding,
        expected: &ScreenRevisions,
    ) -> Result<ResolvedScreenTarget, SceneError> {
        let resolved = self.screens_resolve_target(project, project_id, binding, Some(expected))?;
        if resolved.kind != OwnedScreenKind::Component {
            return Err(SceneError::ReferenceBlocked);
        }
        let inventory = self.screen_inventory(project)?;
        if inventory.source_map_revision != resolved.revisions.source_map
            || inventory.revision != resolved.revisions.inventory
        {
            return Err(SceneError::SourceConflict);
        }
        let graph = component_graph(&inventory.source_map, &inventory);
        if !graph.complete {
            return Err(SceneError::OpaqueBoundary);
        }
        let affected = graph.affected_owners(&binding.screen_id);
        self.ensure_source_paths_clean(
            project,
            inventory
                .source_map
                .owned_screens
                .iter()
                .filter(|owner| affected.contains(&owner.id))
                .map(|owner| owner.path.as_str()),
        )
        .map_err(|_| SceneError::DirtySource)?;
        Ok(resolved)
    }

    pub(super) fn require_screen_write_review(
        &self,
        project: &ProjectId,
        source_path: &str,
        expected: Option<&ScreenRevisions>,
    ) -> Result<(), SceneError> {
        let (map, _, _, _) = self.screen_metadata_for_project(project, None)?;
        if let Some(owner) = map
            .owned_screens
            .iter()
            .find(|s| s.path == source_path && s.kind == OwnedScreenKind::Component)
        {
            let expected = expected.ok_or(SceneError::InvalidPayload)?;
            self.require_component_write_review(
                project,
                &map.project_id,
                &ScreenTargetBinding {
                    screen_id: owner.id.clone(),
                    source_name: owner.name.clone(),
                },
                expected,
            )?;
        }
        Ok(())
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
        if inventory.source_map_revision != map_revision.sha256 {
            return Err(SceneError::SourceConflict);
        }
        let owner = map
            .owned_screens
            .iter()
            .find(|s| s.id == binding.screen_id && s.name == binding.source_name)
            .filter(|s| ownership::resolves(s, &inventory))
            .ok_or(SceneError::ReferenceBlocked)?;
        let style_index = styles::Index::read(&inventory)?;
        let authoring = self.screen_action_authoring(project, project_id).ok();
        let panels = actions::qualified_panel_targets(&inventory);
        let can_show_hide = panels.iter().any(|panel| &panel.binding == binding);
        let mut effects = Effects {
            service: self,
            project,
            map: &map,
            inventory: &inventory,
            styles: &style_index,
            variables: authoring
                .as_ref()
                .map(|snapshot| snapshot.variables.as_slice())
                .unwrap_or(&[]),
            panels: &panels,
            authoring_revision: authoring
                .as_ref()
                .map(|snapshot| snapshot.revision.as_str()),
            active: HashSet::new(),
            visited_screens: HashSet::new(),
            remaining: MAX_NODES,
            unknown: false,
            hidden: BTreeSet::new(),
            shown: BTreeSet::new(),
            assigned: BTreeSet::new(),
            finishes_interaction: false,
            blocking: false,
            dependencies: BTreeMap::new(),
        };
        effects.read(&owner.id, 0);
        let blocking = effects.blocking;
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
            blocking,
            can_show_hide,
            path: owner.path.clone(),
            root_id: owner.root_id.clone(),
            revisions,
            effects,
        })
    }
}
