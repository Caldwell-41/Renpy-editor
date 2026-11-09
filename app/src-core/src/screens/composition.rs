use super::*;
use sha2::{Digest, Sha256};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComposeRequest {
    pub screen_id: String,
    #[serde(default)]
    pub validate_only: bool,
    pub expected_revision: String,
    pub command: Command,
    #[serde(default)]
    pub component_revisions: Option<references::ScreenRevisions>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Command {
    #[serde(rename_all = "camelCase")]
    AddImageButton {
        parent_id: String,
        appearances: controls::ImageButtonAppearances,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        interaction: InteractionEdit,
    },
    #[serde(rename_all = "camelCase")]
    ImageButton {
        node_id: String,
        appearances: controls::ImageButtonAppearances,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        interaction: InteractionEdit,
    },
    #[serde(rename_all = "camelCase")]
    AddBar {
        parent_id: String,
        binding: controls::IntegerBarBinding,
        appearance: controls::BarAppearance,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        expected_authoring_revision: String,
    },
    #[serde(rename_all = "camelCase")]
    Bar {
        node_id: String,
        binding: controls::IntegerBarBinding,
        appearance: controls::BarAppearance,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        expected_authoring_revision: String,
    },
    #[serde(rename_all = "camelCase")]
    Add {
        parent_id: String,
        kind: String,
        text: String,
    },
    #[serde(rename_all = "camelCase")]
    AddImage {
        parent_id: String,
        asset_id: String,
        expected_asset_sha256: String,
        #[serde(default)]
        replacement_sha256: Option<String>,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
    },
    #[serde(rename_all = "camelCase")]
    Image {
        node_id: String,
        asset_id: String,
        expected_asset_sha256: String,
        #[serde(default)]
        replacement_sha256: Option<String>,
        width: u32,
        height: u32,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        #[serde(default)]
        parent_id: Option<String>,
    },
    #[serde(rename_all = "camelCase")]
    Text { node_id: String, text: String },
    #[serde(rename_all = "camelCase")]
    FormatText {
        node_id: String,
        values: text::TextEdits,
        #[serde(default)]
        style: Option<styles::Edit>,
        #[serde(default)]
        layout: std::collections::BTreeMap<String, Option<layout::NumericValue>>,
        #[serde(default)]
        interaction: Option<InteractionEdit>,
    },
    #[serde(rename_all = "camelCase")]
    Actions {
        node_id: String,
        actions: Vec<interaction::ScreenAction>,
        expected_authoring_revision: String,
        expected_target_revisions: Vec<ActionTargetRevision>,
    },
    #[serde(rename_all = "camelCase")]
    VariableText {
        node_id: String,
        binding: Option<interaction::VariableBinding>,
        text: Option<String>,
        expected_authoring_revision: String,
    },
    #[serde(rename_all = "camelCase")]
    Reorder {
        node_id: String,
        target_id: String,
        after: bool,
    },
    #[serde(rename_all = "camelCase")]
    Remove { node_id: String },
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActionTargetRevision {
    pub target: crate::metadata::ScreenTargetBinding,
    pub revisions: references::ScreenRevisions,
}

/// Captured interaction review for one existing composition transaction.
/// Absent actions leave the action statement untouched; an empty list writes Null.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InteractionEdit {
    pub expected_authoring_revision: String,
    pub expected_target_revisions: Vec<ActionTargetRevision>,
    #[serde(default)]
    pub actions: Option<Vec<interaction::ScreenAction>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposeResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action_validation: Option<Document>,
    pub document: Document,
    pub selected_id: String,
    pub changed: bool,
    pub styles: styles::StyleCatalog,
    pub documents: Vec<Document>,
}

pub(super) fn text_literal(text: &str) -> Result<String, SceneError> {
    if text.trim().is_empty() || text.len() > 8192 || text.contains('\0') {
        return Err(SceneError::InvalidPayload);
    }
    serde_json::to_string(text).map_err(|_| SceneError::InvalidPayload)
}

pub(super) fn can_add(screen: &Screen, parent: &Node, kind: &str) -> bool {
    [
        "screen", "fixed", "frame", "window", "vbox", "hbox", "grid", "viewport",
    ]
    .contains(&parent.kind.as_str())
        && [
            "fixed",
            "frame",
            "window",
            "vbox",
            "hbox",
            "grid",
            "viewport",
            "text",
            "textbutton",
            "image",
            "bar",
            "imagebutton",
            "use",
        ]
        .contains(&kind)
        && (parent.kind != "grid"
            || (parent.protected.is_empty()
                && !screen.nodes.iter().any(|child| {
                    child.parent_start == Some(parent.span.start)
                        && matches!(child.kind.as_str(), "text" | "textbutton")
                        && child.literal.is_none()
                })
                && parent.numeric_layout.as_ref().is_some_and(|layout| {
                    layout.allows_empty_cells == Some(true)
                        && screen
                            .nodes
                            .iter()
                            .filter(|n| n.parent_start == Some(parent.span.start))
                            .count()
                            < (layout.values["columns"].value * layout.values["rows"].value)
                                as usize
                })))
        && (!single_child(&parent.kind)
            || (parent.protected.is_empty()
                && !screen
                    .nodes
                    .iter()
                    .any(|n| n.parent_start == Some(parent.span.start))))
}

pub(super) fn movable(screen: &Screen, node: &Node) -> bool {
    node.parent_start.is_some()
        && screen
            .nodes
            .iter()
            .filter(|n| n.span.start >= node.span.start && n.span.start < node.source_end)
            .all(|n| {
                n.id.is_some()
                    && n.protected.is_empty()
                    && !(matches!(n.kind.as_str(), "text" | "textbutton") && n.literal.is_none())
            })
}

impl AuthoringService {
    fn prepare_interaction(
        &self,
        project: &ProjectId,
        project_id: &str,
        owner: &crate::metadata::OwnedScreen,
        bytes: &[u8],
        node_id: &str,
        review: &InteractionEdit,
        passive_component_addition: bool,
    ) -> Result<Vec<u8>, SceneError> {
        let authoring = self.require_action_authoring(
            project,
            project_id,
            &review.expected_authoring_revision,
        )?;
        let actions = review.actions.as_deref().unwrap_or(&[]);
        let wanted: std::collections::BTreeSet<_> = actions
            .iter()
            .filter_map(|action| match action {
                interaction::ScreenAction::ShowScreen { target }
                | interaction::ScreenAction::HideScreen { target } => {
                    Some(target.screen_id.as_str())
                }
                _ => None,
            })
            .collect();
        let reviewed: std::collections::BTreeSet<_> = review
            .expected_target_revisions
            .iter()
            .map(|r| r.target.screen_id.as_str())
            .collect();
        if wanted != reviewed || reviewed.len() != review.expected_target_revisions.len() {
            return Err(SceneError::InvalidPayload);
        }
        let Some(actions) = &review.actions else {
            return Ok(bytes.to_vec());
        };
        if owner.kind == crate::metadata::OwnedScreenKind::Component
            && !(passive_component_addition && actions.is_empty())
        {
            return Err(SceneError::ReferenceBlocked);
        }
        let inventory = self.screen_inventory(project)?;
        let panels = super::actions::qualified_panel_targets(&inventory);
        for target_review in &review.expected_target_revisions {
            let resolved = self.screens_resolve_target(
                project,
                project_id,
                &target_review.target,
                Some(&target_review.revisions),
            )?;
            if !panels.iter().any(|p| p.binding == target_review.target) {
                return Err(SceneError::ReferenceBlocked);
            }
            self.ensure_source_paths_clean(project, [resolved.path.as_str()])
                .map_err(|_| SceneError::DirtySource)?;
        }
        let raw = inspect(bytes, owner.path.clone(), String::new())?;
        let screen = raw
            .screens
            .iter()
            .find(|s| s.name == owner.name)
            .ok_or(SceneError::ReferenceBlocked)?;
        let node = screen
            .nodes
            .iter()
            .find(|n| n.id.as_deref() == Some(node_id))
            .ok_or(SceneError::UnknownEntity)?;
        let inspection =
            super::actions::inspect_actions(owner, screen, bytes, &authoring.variables, &panels);
        let button = inspection
            .buttons
            .get(&node.span.start)
            .ok_or(SceneError::OpaqueBoundary)?;
        super::actions::prepare(
            bytes,
            button,
            actions,
            &authoring.variables,
            &panels,
            inspection.blocking,
        )
    }

    pub fn screens_compose(
        &self,
        project: &ProjectId,
        project_id: &str,
        request: ComposeRequest,
    ) -> Result<ComposeResult, SceneError> {
        let validate_only = request.validate_only;
        if validate_only && !matches!(&request.command, Command::Actions { .. }) {
            return Err(SceneError::InvalidPayload);
        }
        let catalog = self.screens_list(project, project_id)?;
        let owner = catalog
            .owned
            .iter()
            .find(|s| s.screen.id == request.screen_id && s.resolved)
            .ok_or(SceneError::ReferenceBlocked)?;
        if owner.screen.kind == crate::metadata::OwnedScreenKind::Component {
            let expected = request
                .component_revisions
                .as_ref()
                .ok_or(SceneError::InvalidPayload)?;
            self.require_component_write_review(
                project,
                project_id,
                &crate::metadata::ScreenTargetBinding {
                    screen_id: owner.screen.id.clone(),
                    source_name: owner.screen.name.clone(),
                },
                expected,
            )?;
        }
        let source_path = &owner.screen.path;
        self.ensure_source_paths_clean(project, [source_path.as_str()])
            .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self
            .transactions
            .snapshot(project, path(source_path)?)
            .map_err(|_| SceneError::SourceConflict)?;
        if revision.sha256 != request.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        let mut document = self.owned_screen_document(
            project,
            &bytes,
            source_path.clone(),
            revision.sha256.clone(),
        )?;
        self.resolve_screen_styles(project, &mut document, &bytes)?;
        let screen = document
            .screens
            .iter()
            .find(|s| s.name == owner.screen.name)
            .ok_or(SceneError::ReferenceBlocked)?;
        let mut proposed = bytes.clone();
        let mut companions = Vec::new();
        let mut interaction_review: Option<(String, Vec<ActionTargetRevision>)> = None;
        let control_addition = matches!(
            &request.command,
            Command::AddBar { .. } | Command::AddImageButton { .. }
        );
        let selected_id = match request.command {
            Command::AddImageButton {
                parent_id,
                appearances,
                width,
                height,
                layout,
                interaction,
            }
            | Command::ImageButton {
                node_id: parent_id,
                appearances,
                width,
                height,
                layout,
                interaction,
            } => {
                let target = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&parent_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if control_addition && interaction.actions.is_none() {
                    return Err(SceneError::InvalidPayload);
                }
                if !control_addition && control_source::image_paths(&bytes, target).is_none() {
                    return Err(SceneError::OpaqueBoundary);
                }
                let (values, metadata) =
                    self.imagebutton_values(project, project_id, &appearances)?;
                companions.extend(metadata);
                let (source, id) = control_source::prepare(
                    &bytes,
                    screen,
                    source_path,
                    "imagebutton",
                    target,
                    control_addition,
                    values,
                    width,
                    height,
                    layout,
                )?;
                proposed = self.prepare_interaction(
                    project,
                    project_id,
                    &owner.screen,
                    &source,
                    &id,
                    &interaction,
                    control_addition,
                )?;
                interaction_review = Some((
                    interaction.expected_authoring_revision,
                    interaction.expected_target_revisions,
                ));
                id
            }
            Command::AddBar {
                parent_id,
                binding,
                appearance,
                width,
                height,
                layout,
                expected_authoring_revision,
            }
            | Command::Bar {
                node_id: parent_id,
                binding,
                appearance,
                width,
                height,
                layout,
                expected_authoring_revision,
            } => {
                let authoring = self.require_action_authoring(
                    project,
                    project_id,
                    &expected_authoring_revision,
                )?;
                // Roots receive their stable ID in the owned document projection.
                let target = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&parent_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !control_addition
                    && (target.bar_binding.is_none() || target.bar_appearance.is_none())
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                if owner.screen.kind == crate::metadata::OwnedScreenKind::Component {
                    return Err(SceneError::ReferenceBlocked);
                }
                let values =
                    control_source::bar_values(&binding, &appearance, &authoring.variables)?;
                let (source, id) = control_source::prepare(
                    &bytes,
                    screen,
                    source_path,
                    "bar",
                    target,
                    control_addition,
                    values,
                    width,
                    height,
                    layout,
                )?;
                proposed = source;
                interaction_review = Some((expected_authoring_revision, vec![]));
                id
            }
            Command::VariableText {
                node_id,
                binding,
                text,
                expected_authoring_revision,
            } => {
                let authoring = self.require_action_authoring(
                    project,
                    project_id,
                    &expected_authoring_revision,
                )?;
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                proposed = bindings::prepare(
                    &bytes,
                    node,
                    binding.as_ref(),
                    text.as_deref(),
                    &authoring.variables,
                )?;
                interaction_review = Some((expected_authoring_revision, vec![]));
                node_id
            }
            Command::Actions {
                node_id,
                actions,
                expected_authoring_revision,
                expected_target_revisions,
            } => {
                if !screen
                    .nodes
                    .iter()
                    .any(|node| node.id.as_ref() == Some(&node_id))
                {
                    return Err(SceneError::UnknownEntity);
                }
                let review = InteractionEdit {
                    expected_authoring_revision,
                    expected_target_revisions,
                    actions: Some(actions),
                };
                // The existing writer resolves its spans against these bytes for both APIs.
                proposed = self.prepare_interaction(
                    project,
                    project_id,
                    &owner.screen,
                    &bytes,
                    &node_id,
                    &review,
                    false,
                )?;
                interaction_review = Some((
                    review.expected_authoring_revision,
                    review.expected_target_revisions,
                ));
                node_id
            }
            Command::Add {
                parent_id,
                kind,
                text,
            } => {
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&parent_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if matches!(kind.as_str(), "image" | "use" | "bar" | "imagebutton")
                    || !can_add(screen, parent, &kind)
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let id = uuid::Uuid::new_v4().to_string();
                let newline = if bytes.windows(2).any(|s| s == b"\r\n") {
                    "\r\n"
                } else {
                    "\n"
                };
                let indent = bytes[parent.span.start..]
                    .iter()
                    .take_while(|b| **b == b' ')
                    .count()
                    + 4;
                let spaces = " ".repeat(indent);
                let header = if ["text", "textbutton"].contains(&kind.as_str()) {
                    format!(
                        "{kind} {}{}",
                        text_literal(&text)?,
                        if kind == "textbutton" { ":" } else { "" }
                    )
                } else if kind == "grid" {
                    "grid 2 2:".into()
                } else {
                    format!("{kind}:")
                };
                let mut addition = format!("{spaces}{header} # loomlight-element: {id}{newline}");
                if kind == "textbutton" {
                    addition.push_str(&format!("{spaces}    action Null(){newline}"));
                }
                if !["text", "textbutton"].contains(&kind.as_str()) {
                    if kind == "grid" {
                        addition.push_str(&format!("{spaces}    allow_underfull True{newline}"));
                    }
                    addition.push_str(&format!("{spaces}    pass{newline}"));
                }
                if parent.source_end > 0 && bytes[parent.source_end - 1] != b'\n' {
                    addition.insert_str(0, newline);
                }
                proposed.splice(parent.source_end..parent.source_end, addition.bytes());
                id
            }
            Command::AddImage {
                parent_id,
                asset_id,
                expected_asset_sha256,
                replacement_sha256,
                width,
                height,
                layout,
            } => {
                let parent = screen
                    .nodes
                    .iter()
                    .find(|node| node.id.as_ref() == Some(&parent_id))
                    .ok_or(SceneError::UnknownEntity)?;
                let selection = self.prepare_ui_image_reference(
                    project,
                    project_id,
                    &asset_id,
                    &expected_asset_sha256,
                    replacement_sha256.as_deref(),
                )?;
                if let Some(metadata) = selection.metadata {
                    companions.push(metadata);
                }
                let prepared = super::images::prepare(
                    &bytes,
                    screen,
                    source_path,
                    super::images::Target::Addition { parent },
                    super::images::Change {
                        path: &selection.path,
                        width,
                        height,
                        layout,
                    },
                )?;
                proposed = prepared.source;
                prepared.id
            }
            Command::Image {
                node_id,
                asset_id,
                expected_asset_sha256,
                replacement_sha256,
                width,
                height,
                layout,
                parent_id,
            } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|node| node.id.as_ref() == Some(&node_id))
                    .filter(|node| node.kind == "image")
                    .ok_or(SceneError::OpaqueBoundary)?;
                let selection = self.prepare_ui_image_reference(
                    project,
                    project_id,
                    &asset_id,
                    &expected_asset_sha256,
                    replacement_sha256.as_deref(),
                )?;
                if let Some(metadata) = selection.metadata {
                    companions.push(metadata);
                }
                let prepared = super::images::prepare(
                    &bytes,
                    screen,
                    source_path,
                    super::images::Target::Existing {
                        node,
                        parent_id: parent_id.as_deref(),
                    },
                    super::images::Change {
                        path: &selection.path,
                        width,
                        height,
                        layout,
                    },
                )?;
                proposed = prepared.source;
                node_id
            }
            Command::Text { node_id, text } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !["text", "textbutton"].contains(&node.kind.as_str()) || node.literal.is_none() {
                    return Err(SceneError::OpaqueBoundary);
                }
                self.verify_accepted_text_font(
                    project,
                    project_id,
                    node,
                    &text::TextEdits::default(),
                )?;
                if node.kind == "text" {
                    // Plain text writes cannot bypass revision-bound template editing.
                    bindings::validate_edit(node, &text, &[])?;
                }
                proposed = node
                    .text_properties
                    .as_ref()
                    .ok_or(SceneError::OpaqueBoundary)?
                    .patch(
                        &bytes,
                        node,
                        &text::TextEdits {
                            text: Some(text),
                            ..Default::default()
                        },
                        Default::default(),
                    )?;
                node_id
            }
            Command::FormatText {
                node_id,
                values,
                style,
                layout,
                interaction,
            } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if let Some(review) = &interaction {
                    let authoring = self.require_action_authoring(
                        project,
                        project_id,
                        &review.expected_authoring_revision,
                    )?;
                    if let Some(text) = &values.text {
                        if node.kind == "text" {
                            bindings::validate_edit(node, text, &authoring.variables)?;
                        }
                    }
                } else if node.kind == "text"
                    && values.text.as_ref().is_some_and(|text| {
                        text.contains(['[', '{'])
                            || node
                                .literal
                                .as_ref()
                                .is_some_and(|old| old.contains(['[', '{']))
                    })
                {
                    // Template edits need the original authoring view, including no-ops.
                    return Err(SceneError::InvalidPayload);
                }
                self.verify_accepted_text_font(project, project_id, node, &values)?;
                let changes = self.resolve_text_edits(project, project_id, &values)?;
                if let Some(edit) = &style {
                    (proposed, companions) = self.patch_style(
                        project,
                        edit,
                        &catalog,
                        &screen.name,
                        node,
                        source_path,
                        &bytes,
                        changes,
                    )?;
                    if values.text.is_some() {
                        let context = inspect(&proposed, source_path.clone(), String::new())?;
                        let updated = context
                            .screens
                            .iter()
                            .find(|s| s.name == screen.name)
                            .and_then(|s| s.nodes.iter().find(|n| n.id.as_ref() == Some(&node_id)))
                            .ok_or(SceneError::InvariantBlocked)?;
                        proposed = updated
                            .text_properties
                            .as_ref()
                            .ok_or(SceneError::OpaqueBoundary)?
                            .patch(
                                &proposed,
                                updated,
                                &text::TextEdits {
                                    text: values.text.clone(),
                                    ..Default::default()
                                },
                                Default::default(),
                            )?;
                    }
                } else {
                    proposed = node
                        .text_properties
                        .as_ref()
                        .ok_or(SceneError::OpaqueBoundary)?
                        .patch(&bytes, node, &values, changes)?;
                }
                if !layout.is_empty() {
                    let context = inspect(&proposed, source_path.clone(), String::new())?;
                    let updated = context
                        .screens
                        .iter()
                        .find(|s| s.name == screen.name)
                        .and_then(|s| s.nodes.iter().find(|n| n.id.as_ref() == Some(&node_id)))
                        .ok_or(SceneError::InvariantBlocked)?;
                    proposed = updated
                        .numeric_layout
                        .as_ref()
                        .ok_or(SceneError::OpaqueBoundary)?
                        .patch(&proposed, &layout)?;
                }
                if let Some(review) = interaction {
                    proposed = self.prepare_interaction(
                        project,
                        project_id,
                        &owner.screen,
                        &proposed,
                        &node_id,
                        &review,
                        false,
                    )?;
                    interaction_review = Some((
                        review.expected_authoring_revision,
                        review.expected_target_revisions,
                    ));
                }
                node_id
            }
            Command::Reorder {
                node_id,
                target_id,
                after,
            } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                let target = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&target_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if node.parent_start.is_none() || node.parent_start != target.parent_start {
                    return Err(SceneError::OpaqueBoundary);
                }
                let siblings = screen
                    .nodes
                    .iter()
                    .filter(|n| n.parent_start == node.parent_start)
                    .collect::<Vec<_>>();
                let from = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&node_id))
                    .unwrap();
                let to = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&target_id))
                    .unwrap();
                let position = to + usize::from(after) - usize::from(from < to);
                if node_id == target_id || position == from {
                    return Ok(ComposeResult {
                        action_validation: None,
                        document,
                        selected_id: node_id,
                        changed: false,
                        styles: catalog.styles.clone(),
                        documents: vec![],
                    });
                }
                let start = node.span.start.min(target.span.start);
                let end = node.source_end.max(target.source_end);
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| Some(n.span.start) == node.parent_start)
                    .unwrap();
                if !siblings
                    .iter()
                    .filter(|n| n.span.start >= start && n.span.start < end)
                    .all(|n| movable(screen, n))
                    || parent
                        .protected
                        .iter()
                        .any(|p| p.start < end && p.end > start)
                    || bytes[node.source_end - 1] != b'\n'
                    || (after && bytes[target.source_end - 1] != b'\n')
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let destination = if after {
                    target.source_end
                } else {
                    target.span.start
                };
                if destination > node.source_end {
                    proposed.splice(
                        destination..destination,
                        bytes[node.span.start..node.source_end].iter().copied(),
                    );
                    proposed.drain(node.span.start..node.source_end);
                } else {
                    let moved = proposed
                        .drain(node.span.start..node.source_end)
                        .collect::<Vec<_>>();
                    proposed.splice(destination..destination, moved);
                }
                node_id
            }
            Command::Remove { node_id } => {
                let node = screen
                    .nodes
                    .iter()
                    .find(|n| n.id.as_ref() == Some(&node_id))
                    .ok_or(SceneError::UnknownEntity)?;
                if !movable(screen, node) {
                    return Err(SceneError::OpaqueBoundary);
                }
                let removed_ids = screen
                    .nodes
                    .iter()
                    .filter(|child| {
                        child.span.start >= node.span.start && child.span.start < node.source_end
                    })
                    .filter_map(|child| child.id.as_deref())
                    .collect::<std::collections::HashSet<_>>();
                let (mut map, map_bytes, map_revision, _) =
                    self.screen_metadata(project, project_id)?;
                if map_revision.sha256 != catalog.source_map_revision {
                    return Err(SceneError::SourceConflict);
                }
                let old_count = map.component_uses.len();
                map.component_uses.retain(|usage| {
                    usage.screen_id != owner.screen.id
                        || !removed_ids.contains(usage.node_id.as_str())
                });
                if map.component_uses.len() != old_count {
                    map.validate(project_id)
                        .map_err(|_| SceneError::InvalidMetadata)?;
                    companions.push(FileMutation {
                        path: RelativePath::new(".renpy-editor/source-map.json").unwrap(),
                        kind: MutationKind::ReplaceExisting,
                        base: map_revision,
                        expected_bytes: map_bytes,
                        proposed: crate::scene::source_map_bytes(&map)?,
                    });
                }
                let siblings = screen
                    .nodes
                    .iter()
                    .filter(|n| n.parent_start == node.parent_start)
                    .collect::<Vec<_>>();
                let index = siblings
                    .iter()
                    .position(|n| n.id.as_ref() == Some(&node_id))
                    .unwrap();
                let parent = screen
                    .nodes
                    .iter()
                    .find(|n| Some(n.span.start) == node.parent_start)
                    .unwrap();
                if parent.kind == "grid"
                    && parent
                        .numeric_layout
                        .as_ref()
                        .is_none_or(|layout| layout.allows_empty_cells != Some(true))
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                let fallback = siblings
                    .get(index + 1)
                    .or_else(|| index.checked_sub(1).and_then(|i| siblings.get(i)))
                    .copied()
                    .unwrap_or(parent);
                let selected = fallback.id.clone().unwrap_or_else(|| {
                    let start = if fallback.span.start >= node.source_end {
                        fallback.span.start - (node.source_end - node.span.start)
                    } else {
                        fallback.span.start
                    };
                    format!("source-at-{start}")
                });
                proposed.drain(node.span.start..node.source_end);
                let remaining = inspect(&proposed, source_path.clone(), String::new())?;
                let empty_parent = remaining
                    .screens
                    .iter()
                    .find(|s| s.name == owner.screen.name)
                    .and_then(|s| s.nodes.iter().find(|n| n.span.start == parent.span.start))
                    .ok_or(SceneError::InvariantBlocked)?;
                let header_end = proposed[parent.span.start..]
                    .iter()
                    .position(|b| *b == b'\n')
                    .map(|i| parent.span.start + i + 1)
                    .unwrap_or(proposed.len());
                if empty_parent.source_end == header_end {
                    let indent = proposed[parent.span.start..]
                        .iter()
                        .take_while(|b| **b == b' ')
                        .count()
                        + 4;
                    let newline = if bytes.windows(2).any(|s| s == b"\r\n") {
                        "\r\n"
                    } else {
                        "\n"
                    };
                    let pass = format!("{}pass{newline}", " ".repeat(indent));
                    proposed.splice(header_end..header_end, pass.bytes());
                }
                selected
            }
        };
        companions.retain(|m| m.proposed != m.expected_bytes);
        if let Some((authoring, targets)) = &interaction_review {
            self.require_action_authoring(project, project_id, authoring)?;
            for review in targets {
                let resolved = self.screens_resolve_target(
                    project,
                    project_id,
                    &review.target,
                    Some(&review.revisions),
                )?;
                self.ensure_source_paths_clean(project, [resolved.path.as_str()])
                    .map_err(|_| SceneError::DirtySource)?;
            }
        }
        if proposed == bytes && companions.is_empty() {
            return Ok(ComposeResult {
                action_validation: validate_only.then(|| document.clone()),
                document,
                selected_id,
                changed: false,
                styles: catalog.styles.clone(),
                documents: vec![],
            });
        }
        let mut accepted_inventory = self.screen_inventory(project)?;
        if let Some(mutation) = companions
            .iter()
            .find(|mutation| mutation.path.as_str() == ".renpy-editor/source-map.json")
        {
            if accepted_inventory.source_map_revision != mutation.base.sha256 {
                return Err(SceneError::SourceConflict);
            }
            accepted_inventory.source_map =
                crate::metadata::SourceMapMetadata::read_bytes(&mutation.proposed, project_id)
                    .map_err(|_| SceneError::InvalidMetadata)?;
            accepted_inventory.source_map_revision =
                hex::encode(Sha256::digest(&mutation.proposed));
        }
        for (p, b) in &mut accepted_inventory.files {
            if p == source_path {
                *b = proposed.clone();
            }
            if let Some(m) = companions.iter().find(|m| m.path.as_str() == p) {
                *b = m.proposed.clone();
            }
        }
        accepted_inventory.refresh_revision();
        let accepted_authoring = if let Some(mutation) = companions
            .iter()
            .find(|m| m.path.as_str() == ".renpy-editor/authoring.json")
        {
            let mut authoring = self.screen_action_authoring(project, project_id)?;
            authoring.project_asset_metadata(mutation)?;
            Some(authoring)
        } else {
            None
        };
        let mut accepted = self.owned_screen_document_with_inventory(
            project,
            &proposed,
            source_path.clone(),
            hex::encode(Sha256::digest(&proposed)),
            Some(&accepted_inventory),
            accepted_authoring.as_ref(),
        )?;
        let index = styles::Index::read(&accepted_inventory)?;
        index.resolve(&mut accepted, &proposed)?;
        let style_catalog = index.catalog(&accepted_inventory.source_map_revision);
        let mut documents = vec![];
        for (p, b) in &accepted_inventory.files {
            if path(p).is_err() {
                continue;
            }
            let affected = p == source_path || companions.iter().any(|m| m.path.as_str() == p);
            let mut doc = match self.owned_screen_document_with_inventory(
                project,
                b,
                p.clone(),
                hex::encode(Sha256::digest(b)),
                Some(&accepted_inventory),
                accepted_authoring.as_ref(),
            ) {
                Ok(doc) => doc,
                // Unrelated source-only files need not be inspectable to edit this owner.
                Err(SceneError::UnsupportedSource) if !affected => continue,
                Err(error) => return Err(error),
            };
            index.resolve(&mut doc, b)?;
            documents.push(doc);
        }
        companions.retain(|m| m.proposed != m.expected_bytes);
        if proposed != bytes {
            companions.insert(
                0,
                FileMutation {
                    path: path(source_path)?,
                    kind: MutationKind::ReplaceExisting,
                    base: revision,
                    expected_bytes: bytes,
                    proposed,
                },
            );
        }
        if validate_only {
            return Ok(ComposeResult {
                action_validation: Some(accepted),
                document,
                selected_id,
                changed: false,
                styles: catalog.styles,
                documents: vec![],
            });
        }
        self.commit_history(
            project,
            TransactionProposal {
                mutations: companions,
                intent: TransactionIntent::Edit,
            },
        )?;
        Ok(ComposeResult {
            action_validation: None,
            document: accepted,
            selected_id,
            changed: true,
            styles: style_catalog,
            documents,
        })
    }
}
