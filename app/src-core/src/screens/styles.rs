//! Static source definitions and their screen uses. No project code is evaluated.
use super::*;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleReference {
    pub name: String,
    pub error: Option<String>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleUse {
    pub path: String,
    pub screen_name: String,
    pub node_id: Option<String>,
    pub node_start: usize,
    #[serde(skip)]
    overrides: BTreeSet<String>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Definition {
    pub name: String,
    pub path: String,
    pub kind: String,
    pub values: BTreeMap<String, Value>,
    pub uses: Vec<StyleUse>,
    pub error: Option<String>,
    #[serde(skip)]
    properties: text::TextProperties,
    #[serde(skip)]
    span: Span,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleCatalog {
    pub revision: String,
    pub definitions: Vec<Definition>,
    pub error: Option<String>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Edit {
    pub scope: Scope,
    pub name: String,
    pub expected_revision: String,
}
#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Scope {
    Shared,
    Local,
    Create,
}

pub(super) struct Index {
    definitions: Vec<Definition>,
    revision: String,
    references: Vec<(String, StyleUse)>,
    complete: bool,
}
// Built-in 8.5.3 styles have implicit uses outside the explicit-reference index.
fn native_name(name: &str) -> bool {
    name.starts_with('_') || "animation bar button button_text centered_text centered_vtext centered_window check_button check_button_text default drag empty error_root fixed frame gm_root grid hbox hotbar hotspot hyperlink hyperlink_text image image_button image_button_image image_placement imagemap imagemap_button input input_prompt input_text input_window label label_text large_button large_button_text menu menu_caption menu_choice menu_choice_button menu_choice_chosen menu_choice_chosen_button menu_frame menu_window mm_root motion prompt prompt_text radio_button radio_button_text ruby_text say_dialogue say_label say_thought say_two_window_vbox say_vbox say_who_window say_window scrollbar side slider small_button small_button_text sync_button sync_button_text sync_frame sync_label sync_label_text sync_overlay sync_text text tile transform vbar vbox viewport vpgrid vscrollbar vslider window".split_whitespace().any(|s|s==name)
}
fn style_keyword(code: &str) -> bool {
    let mut chars = code.chars().peekable();
    let mut quote = None;
    while let Some(c) = chars.next() {
        if let Some(q) = quote {
            if c == '\\' {
                chars.next();
            } else if c == q {
                quote = None;
            }
            continue;
        }
        if matches!(c, '\'' | '"') {
            quote = Some(c);
            continue;
        }
        if c.is_ascii_alphabetic() || c == '_' {
            let mut word = String::from(c);
            while chars
                .peek()
                .is_some_and(|n| n.is_ascii_alphanumeric() || *n == '_')
            {
                word.push(chars.next().unwrap());
            }
            if matches!(
                word.as_str(),
                "style" | "text_style" | "style_prefix" | "style_group"
            ) {
                return true;
            }
        }
    }
    false
}
fn reference(lines: &[Line<'_>], node: &Node) -> Option<(String, Span)> {
    let key = if node.kind == "textbutton"
        && !lines.iter().any(|l| {
            l.start > node.span.start && l.start < node.source_end && l.code.starts_with("style ")
        }) {
        "text_style"
    } else {
        "style"
    };
    let header = lines.iter().find(|l| l.start == node.span.start)?;
    let entries = lines
        .iter()
        .filter(|l| {
            l.start > node.span.start
                && l.start < node.source_end
                && l.indent == header.indent + 4
                && l.code.split_whitespace().next() == Some(key)
        })
        .collect::<Vec<_>>();
    // A button can name distinct container and label styles. Until both edges
    // are modeled, the graph must remain unavailable for shared edits.
    if node.kind == "textbutton" && key == "style" {
        let label_refs = lines
            .iter()
            .filter(|l| {
                l.start > node.span.start
                    && l.start < node.source_end
                    && l.indent == header.indent + 4
                    && l.code.split_whitespace().next() == Some("text_style")
            })
            .collect::<Vec<_>>();
        if !label_refs.is_empty()
            && (label_refs.len() != 1
                || entries.len() != 1
                || !label_refs[0].single
                || !entries[0].single
                || label_refs[0].code["text_style".len()..].trim()
                    != entries[0].code[key.len()..].trim())
        {
            return Some((
                String::new(),
                Span {
                    start: header.start,
                    end: header.end,
                },
            ));
        }
    }
    let line = *entries.first()?;
    if entries.len() != 1 || !line.single {
        return Some((
            String::new(),
            Span {
                start: line.start,
                end: line.end,
            },
        ));
    }
    let raw = line.code[key.len()..].trim();
    let name = serde_json::from_str::<String>(raw)
        .ok()
        .filter(|n| identifier(n))
        .unwrap_or_default();
    let start = line.start + line.indent + line.code.len() - raw.len();
    Some((
        name,
        Span {
            start,
            end: start + raw.len(),
        },
    ))
}
fn set_reference_property(
    source: &[u8],
    node: &Node,
    key: &str,
    name: &str,
) -> Result<Vec<u8>, SceneError> {
    let lines = source_lines(source)?;
    let header = lines
        .iter()
        .find(|l| l.start == node.span.start)
        .ok_or(SceneError::UnknownEntity)?;
    let entries = lines
        .iter()
        .filter(|l| {
            l.start > node.span.start
                && l.start < node.source_end
                && l.indent == header.indent + 4
                && l.code.split_whitespace().next() == Some(key)
        })
        .collect::<Vec<_>>();
    let quoted = serde_json::to_string(name).map_err(|_| SceneError::InvalidPayload)?;
    let mut proposed = source.to_vec();
    if let Some(line) = entries.first() {
        let raw = line.code[key.len()..].trim();
        if entries.len() != 1
            || !line.single
            || serde_json::from_str::<String>(raw)
                .ok()
                .filter(|s| identifier(s))
                .is_none()
        {
            return Err(SceneError::OpaqueBoundary);
        }
        let at = line.start + line.indent + line.code.len() - raw.len();
        proposed.splice(at..at + raw.len(), quoted.bytes());
    } else {
        let newline = if source.windows(2).any(|w| w == b"\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        let addition = format!(
            "{}{}{} {quoted}{newline}",
            if source.get(header.end.wrapping_sub(1)) == Some(&b'\n') {
                ""
            } else {
                newline
            },
            " ".repeat(header.indent + 4),
            key
        );
        proposed.splice(header.end..header.end, addition.bytes());
        if !header.code.ends_with(':') {
            let at = header.start + header.indent + header.code.len();
            proposed.splice(at..at, b":".iter().copied());
        }
    }
    Ok(proposed)
}
fn set_reference(
    source: &[u8],
    node: &Node,
    name: &str,
    kind: &str,
) -> Result<Vec<u8>, SceneError> {
    let key = if node.kind == "textbutton" && kind == "text" {
        "text_style"
    } else {
        "style"
    };
    let first = set_reference_property(source, node, key, name)?;
    if node.kind != "textbutton" || kind != "textbutton" {
        return Ok(first);
    }
    let doc = inspect(&first, String::new(), String::new())?;
    let updated = doc
        .screens
        .iter()
        .flat_map(|s| &s.nodes)
        .find(|n| n.id == node.id)
        .ok_or(SceneError::UnknownEntity)?;
    set_reference_property(&first, updated, "text_style", name)
}

fn append_definition(mut source: Vec<u8>, definition: Vec<u8>) -> Vec<u8> {
    let newline = if source.windows(2).any(|w| w == b"\r\n") {
        b"\r\n".as_slice()
    } else {
        b"\n".as_slice()
    };
    if !source.ends_with(b"\n") {
        source.extend_from_slice(newline);
    }
    source.extend_from_slice(newline);
    source.extend(definition);
    source
}

impl Index {
    pub(super) fn read(inventory: &ownership::Inventory) -> Result<Self, SceneError> {
        let mut result = Self {
            definitions: vec![],
            revision: inventory.revision.clone(),
            references: vec![],
            complete: true,
        };
        let mut duplicates = BTreeSet::new();
        let mut inherited = BTreeSet::new();
        let mut names = BTreeSet::new();
        for (path, bytes) in &inventory.files {
            let Ok(lines) = source_lines(bytes) else {
                result.complete = false;
                continue;
            };
            let mut known_references = HashSet::new();
            for (i, line) in lines.iter().enumerate() {
                if line.indent != 0 || !line.single {
                    continue;
                }
                let Some(raw) = line.code.strip_prefix("style ") else {
                    continue;
                };
                let name = raw.split([' ', ':']).next().unwrap_or("");
                if !identifier(name) {
                    result.complete = false;
                    continue;
                }
                if !names.insert(name.to_owned()) {
                    duplicates.insert(name.to_owned());
                }
                let parent = raw
                    .strip_suffix(':')
                    .unwrap_or(raw)
                    .split_once(" is ")
                    .filter(|(n, _)| *n == name)
                    .map(|(_, p)| p);
                known_references.insert(line.start);
                if let Some(parent) = parent {
                    if !["text", "button_text", "button", "frame", "window"].contains(&parent) {
                        inherited.insert(parent.to_owned());
                    }
                } else if let Some((_, parent)) = name.split_once('_') {
                    inherited.insert(parent.to_owned());
                }
                let after = after_block(&lines, i, lines.len());
                let end = lines.get(after).map_or(bytes.len(), |l| l.start);
                let properties = text::read_block(&lines, line, end, "style");
                let recognized = properties.recognized_starts();
                let parent_kind = match parent {
                    Some("text" | "button_text") => "text",
                    Some("button") => "textbutton",
                    Some("frame") => "frame",
                    Some("window") => "window",
                    _ => "unsupported",
                };
                let supported = !native_name(name)
                    && parent_kind != "unsupported"
                    && properties
                        .values
                        .keys()
                        .all(|k| text::applicable(parent_kind, k))
                    && properties.blocked.is_empty()
                    && lines[i + 1..after]
                        .iter()
                        .all(|l| recognized.contains(&l.start));
                result.definitions.push(Definition {
                    name: name.into(),
                    path: path.clone(),
                    kind: parent_kind.into(),
                    values: properties.values.clone(),
                    uses: vec![],
                    error: (!supported)
                        .then(|| "This style's inheritance or expressions stay in Source.".into()),
                    span: Span {
                        start: line.start,
                        end: lines[after - 1].end,
                    },
                    properties,
                });
            }
            match inspect(bytes, path.clone(), String::new()) {
                Ok(doc) => {
                    for screen in doc.screens {
                        for node in screen.nodes {
                            if let Some((name, _)) = reference(&lines, &node) {
                                if name.is_empty() {
                                    result.complete = false;
                                }
                                let header =
                                    lines.iter().find(|l| l.start == node.span.start).unwrap();
                                known_references.extend(
                                    lines
                                        .iter()
                                        .filter(|l| {
                                            l.start > node.span.start
                                                && l.start < node.source_end
                                                && l.indent == header.indent + 4
                                                && matches!(
                                                    l.code.split_whitespace().next(),
                                                    Some("style" | "text_style")
                                                )
                                        })
                                        .map(|l| l.start),
                                );
                                let overrides = node
                                    .text_properties
                                    .as_ref()
                                    .map(|p| {
                                        p.values
                                            .keys()
                                            .chain(p.blocked.keys())
                                            .filter(|k| k.as_str() != "text")
                                            .cloned()
                                            .collect()
                                    })
                                    .unwrap_or_default();
                                result.references.push((
                                    name,
                                    StyleUse {
                                        path: path.clone(),
                                        screen_name: screen.name.clone(),
                                        node_id: node.id,
                                        node_start: node.span.start,
                                        overrides,
                                    },
                                ));
                            }
                        }
                    }
                }
                Err(_) => result.complete = false,
            }
            if lines
                .iter()
                .any(|l| !known_references.contains(&l.start) && style_keyword(l.code))
            {
                result.complete = false;
            }
            if result.references.len() + result.definitions.len() > MAX_NODES {
                return Err(SceneError::InvariantBlocked);
            }
        }
        // Referencing an undeclared name creates its implicit parent chain in
        // Ren'Py: caption_ll_body -> ll_body -> body. Those uses are not explicit
        // edges of our supported definitions, so their ancestors stay in Source.
        for name in result
            .references
            .iter()
            .map(|(name, _)| name.clone())
            .chain(inherited.clone())
        {
            let mut child = name.as_str();
            while !names.contains(child) {
                let Some((_, parent)) = child.split_once('_') else {
                    break;
                };
                inherited.insert(parent.to_owned());
                child = parent;
            }
        }
        for def in &mut result.definitions {
            def.uses = result
                .references
                .iter()
                .filter(|(n, _)| n == &def.name)
                .map(|(_, u)| u.clone())
                .collect();
            if duplicates.contains(&def.name) || inherited.contains(&def.name) || !result.complete {
                def.error = Some(
                    "Style definitions or uses are ambiguous. Review Source before applying."
                        .into(),
                );
            }
        }
        Ok(result)
    }
    pub(super) fn supports_declaration(&self, path: &str, start: usize) -> bool {
        self.definitions
            .iter()
            .any(|d| d.path == path && d.span.start == start && d.error.is_none())
    }
    pub(super) fn catalog(&self, map_revision: &str) -> StyleCatalog {
        StyleCatalog {
            revision: hex::encode(Sha256::digest(format!("{}:{map_revision}", self.revision))),
            definitions: self.definitions.clone(),
            error: (!self.complete).then(|| {
                "Some style uses stay in Source. Reconcile them before sharing a style.".into()
            }),
        }
    }
    fn definition(&self, name: &str) -> Result<&Definition, SceneError> {
        self.definitions
            .iter()
            .find(|d| d.name == name && d.error.is_none())
            .ok_or(SceneError::StyleUnavailable)
    }
    pub(super) fn resolve(&self, document: &mut Document, bytes: &[u8]) -> Result<(), SceneError> {
        let lines = source_lines(bytes)?;
        for screen in &mut document.screens {
            for node in &mut screen.nodes {
                let Some((name, _)) = reference(&lines, node) else {
                    continue;
                };
                let resolved = self.definition(&name).and_then(|def| {
                    if def.kind != node.kind && !(def.kind == "text" && node.kind == "textbutton") {
                        return Err(SceneError::StyleUnavailable);
                    }
                    if def.kind == "textbutton" {
                        let header = lines
                            .iter()
                            .find(|l| l.start == node.span.start)
                            .ok_or(SceneError::StyleUnavailable)?;
                        let text_refs = lines
                            .iter()
                            .filter(|l| {
                                l.start > node.span.start
                                    && l.start < node.source_end
                                    && l.indent == header.indent + 4
                                    && l.code.starts_with("text_style ")
                            })
                            .collect::<Vec<_>>();
                        if text_refs.len() != 1
                            || serde_json::from_str::<String>(
                                text_refs[0].code["text_style ".len()..].trim(),
                            )
                            .ok()
                            .as_deref()
                                != Some(name.as_str())
                        {
                            return Err(SceneError::StyleUnavailable);
                        }
                    }
                    Ok(def)
                });
                if resolved.is_ok() {
                    let header = lines.iter().find(|l| l.start == node.span.start).unwrap();
                    let recognized = lines
                        .iter()
                        .filter(|l| {
                            l.start > node.span.start
                                && l.start < node.source_end
                                && l.indent == header.indent + 4
                                && matches!(
                                    l.code.split_whitespace().next(),
                                    Some("style" | "text_style")
                                )
                        })
                        .map(|l| l.start)
                        .collect::<HashSet<_>>();
                    node.protected.retain(|s| !recognized.contains(&s.start));
                }
                node.style = Some(StyleReference {
                    name,
                    error: resolved
                        .as_ref()
                        .err()
                        .map(|_| "Style is missing, dynamic or ambiguous. Review Source.".into()),
                });
                if let Some(properties) = &mut node.text_properties {
                    match resolved {
                        Ok(def) => {
                            let mut values = def.values.clone();
                            values.extend(properties.values.clone());
                            properties.values = values;
                        }
                        Err(_) => {
                            for key in text::FIELDS {
                                properties.blocked.insert(
                                    (*key).into(),
                                    "The style reference cannot be resolved. Review Source.".into(),
                                );
                            }
                        }
                    }
                }
            }
        }
        Ok(())
    }
}
impl AuthoringService {
    pub(super) fn resolve_screen_styles(
        &self,
        project: &ProjectId,
        document: &mut Document,
        bytes: &[u8],
    ) -> Result<(), SceneError> {
        Index::read(&self.screen_inventory(project)?)?.resolve(document, bytes)
    }
    pub(super) fn patch_style(
        &self,
        project: &ProjectId,
        edit: &Edit,
        catalog: &Catalog,
        node: &Node,
        source_path: &str,
        source: &[u8],
        changes: BTreeMap<String, Option<Value>>,
    ) -> Result<(Vec<u8>, Vec<FileMutation>), SceneError> {
        let inventory = self.screen_inventory(project)?;
        let index = Index::read(&inventory)?;
        if index.catalog(&catalog.source_map_revision).revision != edit.expected_revision {
            return Err(SceneError::SourceConflict);
        }
        if matches!(edit.scope, Scope::Create) {
            if !index.complete {
                return Err(SceneError::StyleUnavailable);
            }
            if native_name(&edit.name)
                || !valid_name(&edit.name)
                || index.definitions.iter().any(|d| d.name == edit.name)
                || reference(&source_lines(source)?, node).is_some()
            {
                return Err(SceneError::InvalidPayload);
            }
            let properties = node
                .text_properties
                .as_ref()
                .ok_or(SceneError::OpaqueBoundary)?;
            if !properties.blocked.is_empty() {
                return Err(SceneError::OpaqueBoundary);
            }
            let mut values = properties
                .values
                .iter()
                .map(|(k, v)| (k.clone(), Some(v.clone())))
                .collect::<BTreeMap<_, _>>();
            values.extend(changes);
            let newline = if source.windows(2).any(|w| w == b"\r\n") {
                "\r\n"
            } else {
                "\n"
            };
            let parent = if node.kind == "textbutton" {
                "button"
            } else {
                &node.kind
            };
            let block = format!("style {} is {parent}{newline}", edit.name).into_bytes();
            let lines = source_lines(&block)?;
            let props = text::read_block(&lines, &lines[0], block.len(), "style");
            let definition = props.patch_values(&block, "style", values)?;
            let cleared = properties.patch_values(
                source,
                &node.kind,
                properties
                    .values
                    .keys()
                    .map(|k| (k.clone(), None))
                    .collect(),
            )?;
            let doc = inspect(&cleared, source_path.into(), String::new())?;
            let updated = doc
                .screens
                .iter()
                .flat_map(|s| &s.nodes)
                .find(|n| n.id == node.id)
                .ok_or(SceneError::UnknownEntity)?;
            return Ok((
                append_definition(
                    set_reference(&cleared, updated, &edit.name, &node.kind)?,
                    definition,
                ),
                vec![],
            ));
        }
        if inventory
            .files
            .iter()
            .find(|(p, _)| p == source_path)
            .map(|(_, b)| b.as_slice())
            != Some(source)
        {
            return Err(SceneError::SourceConflict);
        }
        let def = index.definition(&edit.name)?;
        if def.kind != node.kind && !(def.kind == "text" && node.kind == "textbutton")
            || changes.keys().any(|k| !text::applicable(&def.kind, k))
        {
            return Err(SceneError::InvalidPayload);
        }
        self.ensure_source_paths_clean(
            project,
            std::iter::once(def.path.as_str()).chain(def.uses.iter().map(|u| u.path.as_str())),
        )
        .map_err(|_| SceneError::DirtySource)?;
        let (bytes, revision) = self
            .transactions
            .snapshot(
                project,
                RelativePath::new(&def.path).map_err(|_| SceneError::InvalidPayload)?,
            )
            .map_err(|_| SceneError::SourceConflict)?;
        if inventory
            .files
            .iter()
            .find(|(p, _)| p == &def.path)
            .map(|(_, b)| b)
            != Some(&bytes)
        {
            return Err(SceneError::SourceConflict);
        }
        match edit.scope {
            Scope::Create => unreachable!(),
            Scope::Shared => {
                if def
                    .uses
                    .iter()
                    .any(|u| changes.keys().any(|key| u.overrides.contains(key)))
                {
                    return Err(SceneError::StyleUnavailable);
                }
                let definition = def.properties.patch_values(&bytes, "style", changes)?;
                let mut proposed = if def.path == source_path {
                    definition.clone()
                } else {
                    source.to_vec()
                };
                let doc = inspect(&proposed, source_path.into(), String::new())?;
                let updated = doc
                    .screens
                    .iter()
                    .flat_map(|s| &s.nodes)
                    .find(|n| n.id == node.id)
                    .ok_or(SceneError::UnknownEntity)?;
                if reference(&source_lines(&proposed)?, updated)
                    .as_ref()
                    .map(|(n, _)| n.as_str())
                    != Some(edit.name.as_str())
                {
                    let properties = updated
                        .text_properties
                        .as_ref()
                        .ok_or(SceneError::OpaqueBoundary)?;
                    proposed = properties.patch_values(
                        &proposed,
                        &updated.kind,
                        properties
                            .values
                            .keys()
                            .map(|k| (k.clone(), None))
                            .collect(),
                    )?;
                    let doc = inspect(&proposed, source_path.into(), String::new())?;
                    let updated = doc
                        .screens
                        .iter()
                        .flat_map(|s| &s.nodes)
                        .find(|n| n.id == node.id)
                        .ok_or(SceneError::UnknownEntity)?;
                    proposed = set_reference(&proposed, updated, &edit.name, &def.kind)?;
                }
                if def.path == source_path || definition == bytes {
                    return Ok((proposed, vec![]));
                }
                let mutation = FileMutation {
                    path: RelativePath::new(&def.path).map_err(|_| SceneError::InvalidPayload)?,
                    kind: MutationKind::ReplaceExisting,
                    base: revision,
                    expected_bytes: bytes,
                    proposed: definition,
                };
                Ok((proposed, vec![mutation]))
            }
            Scope::Local => {
                let name = format!("ll_copy_{}", uuid::Uuid::new_v4().simple());
                let mut copy = bytes[def.span.start..def.span.end].to_vec();
                let start = "style ".len();
                copy.splice(start..start + def.name.len(), name.bytes());
                let lines = source_lines(&copy)?;
                let properties = text::read_block(&lines, &lines[0], copy.len(), "style");
                let mut copied = node
                    .text_properties
                    .as_ref()
                    .ok_or(SceneError::OpaqueBoundary)?
                    .values
                    .iter()
                    .map(|(k, v)| (k.clone(), Some(v.clone())))
                    .collect::<BTreeMap<_, _>>();
                copied.extend(changes);
                copy = properties.patch_values(&copy, "style", copied)?;
                let properties = node
                    .text_properties
                    .as_ref()
                    .ok_or(SceneError::OpaqueBoundary)?;
                let cleared = properties.patch_values(
                    source,
                    &node.kind,
                    properties
                        .values
                        .keys()
                        .map(|k| (k.clone(), None))
                        .collect(),
                )?;
                let doc = inspect(&cleared, source_path.into(), String::new())?;
                let updated = doc
                    .screens
                    .iter()
                    .flat_map(|s| &s.nodes)
                    .find(|n| n.id == node.id)
                    .ok_or(SceneError::UnknownEntity)?;
                let proposed =
                    append_definition(set_reference(&cleared, updated, &name, &def.kind)?, copy);
                Ok((proposed, vec![]))
            }
        }
    }
}
