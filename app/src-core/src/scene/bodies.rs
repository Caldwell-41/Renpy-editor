//! Bodies: the ordered nodes under a scene label, a branch or a Choice option, the
//! one body ending rule, and the insertion places core accepts in each body.
use super::*;
use crate::metadata::BeatOwner;

/// Whether the story can pass the end of a node or a body.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum Ending {
    Ends,
    Continues,
    /// Custom Code may leave the body. Guards treat this as "may continue".
    Unknown,
}

impl Ending {
    pub(super) fn may_continue(self) -> bool {
        self != Self::Ends
    }
    /// A condition or Choice ends only when every path through it ends.
    fn all(endings: impl IntoIterator<Item = Self>) -> Self {
        let mut all = Self::Ends;
        for ending in endings {
            match ending {
                Self::Continues => return Self::Continues,
                Self::Unknown => all = Self::Unknown,
                Self::Ends => {}
            }
        }
        all
    }
}

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum BodyKind {
    Scene,
    Branch,
    Option,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", rename_all_fields = "camelCase", tag = "type")]
pub enum BodyEnding {
    Ends { beat_id: String },
    Continues,
    Unknown,
}

/// A beat, a whole condition (named by its If header) or a whole Choice.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BodyNode {
    pub beat_id: String,
    /// Branch bodies in source order, or option bodies in option order.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub bodies: Vec<BodyRef>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InsertionPlace {
    pub position: Position,
    /// Jump, Repeat this Choice and Return fit here.
    pub fits_ending: bool,
}

/// One body of a scene, read from source. The flat beat list keeps beat content.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneBody {
    pub body: BodyRef,
    pub kind: BodyKind,
    /// Branch ordinal or option position, counted from 1. The scene body has none.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent: Option<BodyRef>,
    /// The condition (its If header) or Choice that owns this body.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owning_node: Option<String>,
    pub nodes: Vec<BodyNode>,
    pub ending: BodyEnding,
    pub places: Vec<InsertionPlace>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_place: Option<Position>,
}

type Key<'a> = Option<(&'a str, &'a str)>;
fn key(owner: Option<&BeatOwner>) -> Key<'_> {
    owner.map(|o| (o.group_id.as_str(), o.branch_id.as_str()))
}

/// Blank and comment lines belong to no body as nodes.
pub(super) fn trivia(beat: &SceneBeat) -> bool {
    beat.conditional_branch.is_none()
        && matches!(&beat.payload, BeatPayload::CustomCode { source, .. } if source.trim().is_empty() || source.trim_start().starts_with('#'))
}

pub(super) fn node_ref(beat: &SceneBeat) -> NodeRef {
    match &beat.conditional_branch {
        Some(branch) => NodeRef::Condition {
            group_id: branch.group_id.clone(),
        },
        None => NodeRef::Beat {
            beat_id: beat.id.clone(),
        },
    }
}

/// Only the first word counts. No Python is read or run.
fn first_word(code: &str) -> &str {
    let code = code.trim_start();
    let end = code
        .find(|c: char| !(c.is_ascii_alphanumeric() || c == '_'))
        .unwrap_or(code.len());
    &code[..end]
}

/// A later top-level declaration ends the selected label's body. The flat beat list
/// can keep such rows losslessly, but they belong to no body and authorize no edit.
fn scene_end(source: &[u8], statements: &HashSet<usize>) -> Result<usize, SceneError> {
    let bom = usize::from(source.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    let text = std::str::from_utf8(&source[bom..]).map_err(|_| SceneError::UnsupportedSource)?;
    let mut label_seen = false;
    for (start, _, line) in physical_lines(text) {
        if !label_seen {
            label_seen = line.starts_with("label ") && line.ends_with(':');
            continue;
        }
        if statements.contains(&(start + bom))
            && indentation(line) == 0
            && !line.trim().is_empty()
            && !line.trim_start().starts_with('#')
        {
            return Ok(start + bom);
        }
    }
    Ok(source.len())
}

/// Reads bodies from verified beats and the statement starts of their source.
pub(super) struct Bodies<'s, 'a> {
    source: &'s [u8],
    beats: &'a [SceneBeat],
    statements: HashSet<usize>,
    scene_end: usize,
    /// Indexes into `beats`, by body.
    nodes: HashMap<Key<'a>, Vec<usize>>,
}

impl<'s, 'a> Bodies<'s, 'a> {
    pub(super) fn new(source: &'s [u8], beats: &'a [SceneBeat]) -> Result<Self, SceneError> {
        let bom = usize::from(source.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
        let statements = crate::authoring::lexical_lines(&source[bom..], false)
            .map_err(|_| SceneError::UnsupportedSource)?
            .into_iter()
            .map(|(start, _)| start + bom)
            .collect::<HashSet<_>>();
        let scene_end = scene_end(source, &statements)?;
        let mut nodes = HashMap::<Key<'a>, Vec<usize>>::new();
        for (index, beat) in beats.iter().enumerate().filter(|(_, b)| {
            (b.byte_start as usize) < scene_end
                && (b.byte_end as usize) <= scene_end
                && b.conditional_branch
                    .as_ref()
                    .is_none_or(|g| g.opens_group())
                && !trivia(b)
        }) {
            nodes.entry(key(beat.owner.as_ref())).or_default().push(index);
        }
        Ok(Self {
            source,
            beats,
            statements,
            scene_end,
            nodes,
        })
    }

    pub(super) fn scene_end(&self) -> usize {
        self.scene_end
    }

    /// One body's nodes in source order, including a structural placeholder.
    fn nodes(&self, body: Key<'_>) -> Vec<&'a SceneBeat> {
        let beats = self.beats;
        self.nodes
            .get(&body)
            .map_or(Vec::new(), |nodes| nodes.iter().map(|&i| &beats[i]).collect())
    }

    pub(super) fn scene_may_continue(&self) -> bool {
        self.ending(None, 0).0.may_continue()
    }
    pub(super) fn group_may_continue(&self, group_id: &str) -> bool {
        self.group(group_id, 0).may_continue()
    }
    pub(super) fn choice_may_continue(&self, menu: &SceneBeat) -> bool {
        self.choice(menu, 0).may_continue()
    }

    /// A body ends at its first node that ends. Otherwise its last node decides
    /// between continuing and an unknown ending.
    fn ending(&self, body: Key<'_>, depth: usize) -> (Ending, Option<&'a SceneBeat>) {
        let mut last = Ending::Continues;
        for node in self.nodes(body) {
            match self.node(node, depth) {
                Ending::Ends => return (Ending::Ends, Some(node)),
                ending => last = ending,
            }
        }
        (last, None)
    }

    fn node(&self, beat: &SceneBeat, depth: usize) -> Ending {
        if depth >= MAX_CONDITION_NESTING {
            return Ending::Continues;
        }
        if let Some(branch) = &beat.conditional_branch {
            return self.group(&branch.group_id, depth);
        }
        match &beat.payload {
            BeatPayload::Choice { .. } => self.choice(beat, depth),
            payload if is_terminal_payload(payload) => Ending::Ends,
            BeatPayload::CustomCode { source, .. } if self.leaves(beat, source) => Ending::Ends,
            BeatPayload::CustomCode { source, .. } if source.trim() != "pass" => Ending::Unknown,
            _ => Ending::Continues,
        }
    }

    /// Custom Code whose statement starts with `jump` or `return` ends its body.
    /// Lines inside an opaque block or a multi-line string are not statements.
    fn leaves(&self, beat: &SceneBeat, code: &str) -> bool {
        let indent = match &beat.owner {
            None => Some(4),
            Some(owner) => self
                .beats
                .iter()
                .find(|b| b.id == owner.branch_id)
                .and_then(|header| match &header.payload {
                    BeatPayload::CustomCode { source, .. } => Some(indentation(source) + 4),
                    _ => None,
                }),
        };
        self.statements.contains(&(beat.byte_start as usize))
            && Some(indentation(code)) == indent
            && matches!(first_word(code), "jump" | "return")
    }

    /// A condition ends when it has Otherwise and every branch ends.
    fn group(&self, group_id: &str, depth: usize) -> Ending {
        let headers = self
            .beats
            .iter()
            .filter(|b| {
                b.conditional_branch
                    .as_ref()
                    .is_some_and(|g| g.group_id == group_id && !g.choice_option)
            })
            .collect::<Vec<_>>();
        if !headers
            .iter()
            .any(|h| h.conditional_branch.as_ref().is_some_and(|g| g.otherwise))
        {
            return Ending::Continues;
        }
        Ending::all(
            headers
                .iter()
                .map(|h| self.ending(Some((group_id, &h.id)), depth + 1).0),
        )
    }

    /// A Choice ends when an option can be picked and every option ends.
    fn choice(&self, menu: &SceneBeat, depth: usize) -> Ending {
        let BeatPayload::Choice {
            options,
            picked_policy,
            ..
        } = &menu.payload
        else {
            return Ending::Continues;
        };
        if *picked_policy == Some(PickedPolicy::HidePicked)
            || options.iter().all(|o| o.condition.is_some())
        {
            return Ending::Continues;
        }
        Ending::all(options.iter().map(|option| {
            self.option_header(option)
                .and_then(|h| Some((h, h.conditional_branch.as_ref()?)))
                .map_or(Ending::Continues, |(h, g)| {
                    self.ending(Some((&g.group_id, &h.id)), depth + 1).0
                })
        }))
    }

    fn option_header(&self, option: &ChoiceOption) -> Option<&'a SceneBeat> {
        self.beats.iter().find(|b| Some(&b.id) == option.id.as_ref())
    }

    /// The source extent of one body, for an edit that names it.
    pub(super) fn qualify(&self, body: &BodyRef) -> Result<Body<'a>, SceneError> {
        let (owner, indent, end) = match body {
            BodyRef::Root => (None, 4, self.scene_end),
            BodyRef::Branch {
                group_id,
                branch_id,
            } => {
                let header = self
                    .beats
                    .iter()
                    .find(|b| {
                        b.id == *branch_id
                            && b.conditional_branch
                                .as_ref()
                                .is_some_and(|g| g.group_id == *group_id)
                    })
                    .ok_or(SceneError::InvariantBlocked)?;
                if header.byte_start as usize >= self.scene_end {
                    return Err(SceneError::OpaqueBoundary);
                }
                let line = std::str::from_utf8(
                    &self.source[header.byte_start as usize..header.byte_end as usize],
                )
                .map_err(|_| SceneError::UnsupportedSource)?;
                let indent = indentation(line);
                if line.as_bytes().get(indent) == Some(&b'\t') || indent < 4 {
                    return Err(SceneError::OpaqueBoundary);
                }
                let end = self
                    .beats
                    .iter()
                    .filter(|b| {
                        b.conditional_branch
                            .as_ref()
                            .is_some_and(|g| g.group_id == *group_id)
                            && b.byte_start > header.byte_start
                    })
                    .map(|b| b.byte_start as usize)
                    .min()
                    .or_else(|| {
                        conditional_extents(self.beats)
                            .get(group_id.as_str())
                            .map(|(_, end)| *end)
                    })
                    .ok_or(SceneError::InvalidMetadata)?;
                (
                    Some(BeatOwner {
                        group_id: group_id.clone(),
                        branch_id: branch_id.clone(),
                    }),
                    indent + 4,
                    end,
                )
            }
        };
        let siblings = self.nodes(key(owner.as_ref()));
        // Unowned trivia never becomes an implicit branch insertion target.
        let end = if owner.is_some() {
            siblings
                .last()
                .map(|b| super::structure::node_end(b, self.beats))
                .transpose()?
                .unwrap_or(end)
        } else {
            end
        };
        let ends = siblings
            .iter()
            .map(|b| self.node(b, 0) == Ending::Ends)
            .collect();
        Ok(Body {
            owner,
            indent,
            end,
            siblings,
            ends,
        })
    }

    /// Every scene body, branch body and option body, parents before children.
    pub(super) fn tree(&self) -> Result<Vec<SceneBody>, SceneError> {
        let mut bodies = Vec::new();
        self.push_body(&mut bodies, BodyRef::Root, BodyKind::Scene, None, None, None, 0)?;
        Ok(bodies)
    }

    #[allow(clippy::too_many_arguments)]
    fn push_body(
        &self,
        bodies: &mut Vec<SceneBody>,
        body: BodyRef,
        kind: BodyKind,
        number: Option<u32>,
        parent: Option<BodyRef>,
        owning_node: Option<String>,
        depth: usize,
    ) -> Result<(), SceneError> {
        if depth > MAX_CONDITION_NESTING {
            return Ok(());
        }
        let owner = match &body {
            BodyRef::Root => None,
            BodyRef::Branch {
                group_id,
                branch_id,
            } => Some((group_id.as_str(), branch_id.as_str())),
        };
        let mut children = Vec::new();
        let nodes = self
            .nodes(owner)
            .into_iter()
            .filter(|b| !b.structural_placeholder)
            .map(|node| {
                let bodies = self.child_bodies(node);
                children.push((node, bodies.clone()));
                BodyNode {
                    beat_id: node.id.clone(),
                    bodies: bodies.into_iter().map(|(body, _, _)| body).collect(),
                }
            })
            .collect();
        let ending = match self.ending(owner, 0) {
            (Ending::Ends, Some(node)) => BodyEnding::Ends {
                beat_id: node.id.clone(),
            },
            (Ending::Unknown, _) => BodyEnding::Unknown,
            _ => BodyEnding::Continues,
        };
        // A body core cannot edit, such as one indented with tabs, offers no place.
        let places = match self.qualify(&body) {
            Ok(qualified) => qualified.places(self.source, self.beats),
            Err(SceneError::OpaqueBoundary) => Vec::new(),
            Err(error) => return Err(error),
        };
        let before_ending = match &ending {
            BodyEnding::Ends { beat_id } => self
                .beats
                .iter()
                .find(|b| b.id == *beat_id)
                .map(|b| Position::Before {
                    anchor: node_ref(b),
                }),
            _ => Some(Position::End),
        };
        let default_place = places
            .iter()
            .find(|p| Some(&p.position) == before_ending.as_ref())
            .or(places.last())
            .map(|p| p.position.clone());
        bodies.push(SceneBody {
            body: body.clone(),
            kind,
            number,
            parent,
            owning_node,
            nodes,
            ending,
            places,
            default_place,
        });
        for (node, child_bodies) in children {
            for (child, kind, number) in child_bodies {
                self.push_body(
                    bodies,
                    child,
                    kind,
                    Some(number),
                    Some(body.clone()),
                    Some(node.id.clone()),
                    depth + 1,
                )?;
            }
        }
        Ok(())
    }

    /// Branch bodies in source order, or option bodies found by option ID.
    fn child_bodies(&self, node: &SceneBeat) -> Vec<(BodyRef, BodyKind, u32)> {
        if let Some(branch) = &node.conditional_branch {
            return self
                .beats
                .iter()
                .filter_map(|b| {
                    let g = b.conditional_branch.as_ref()?;
                    (g.group_id == branch.group_id && !g.choice_option).then(|| {
                        (
                            BodyRef::Branch {
                                group_id: g.group_id.clone(),
                                branch_id: b.id.clone(),
                            },
                            BodyKind::Branch,
                            g.ordinal + 1,
                        )
                    })
                })
                .collect();
        }
        let BeatPayload::Choice { options, .. } = &node.payload else {
            return Vec::new();
        };
        options
            .iter()
            .zip(1..)
            .filter_map(|(option, number)| {
                let header = self.option_header(option)?;
                Some((
                    BodyRef::Branch {
                        group_id: header.conditional_branch.as_ref()?.group_id.clone(),
                        branch_id: header.id.clone(),
                    },
                    BodyKind::Option,
                    number,
                ))
            })
            .collect()
    }
}

pub(super) fn qualify_body<'a>(
    source: &[u8],
    beats: &'a [SceneBeat],
    body: &BodyRef,
) -> Result<Body<'a>, SceneError> {
    Bodies::new(source, beats)?.qualify(body)
}
pub(super) fn scene_body_end(source: &[u8], beats: &[SceneBeat]) -> Result<usize, SceneError> {
    Ok(Bodies::new(source, beats)?.scene_end())
}
pub(super) fn root_may_continue(source: &[u8], beats: &[SceneBeat]) -> Result<bool, SceneError> {
    Ok(Bodies::new(source, beats)?.scene_may_continue())
}

/// One body named by an edit, with each node's ending.
pub(super) struct Body<'a> {
    pub(super) owner: Option<BeatOwner>,
    pub(super) indent: usize,
    pub(super) end: usize,
    pub(super) siblings: Vec<&'a SceneBeat>,
    ends: Vec<bool>,
}

impl<'a> Body<'a> {
    pub(super) fn ends(&self, node: &SceneBeat) -> bool {
        self.siblings
            .iter()
            .position(|b| b.id == node.id)
            .is_some_and(|index| self.ends[index])
    }

    pub(super) fn node(&self, node: &NodeRef) -> Result<&'a SceneBeat, SceneError> {
        self.siblings
            .iter()
            .copied()
            .find(|b| match node {
                NodeRef::Beat { beat_id } => b.id == *beat_id && b.conditional_branch.is_none(),
                NodeRef::Condition { group_id } => b
                    .conditional_branch
                    .as_ref()
                    .is_some_and(|g| g.group_id == *group_id && g.opens_group()),
            })
            .ok_or(SceneError::InvariantBlocked)
    }

    /// The source range a new or moved node replaces at `position`. A move passes
    /// the moved node as `excluded`; `ending` says the node ends its body.
    pub(super) fn place(
        &self,
        position: &Position,
        source: &[u8],
        beats: &[SceneBeat],
        excluded: Option<&str>,
        ending: bool,
    ) -> Result<(usize, usize), SceneError> {
        let kept = self.kept(excluded);
        let index = match position {
            Position::Before { anchor } => {
                let target = self.node(anchor)?;
                if excluded == Some(target.id.as_str()) {
                    return Err(SceneError::InvariantBlocked);
                }
                kept.iter()
                    .position(|(b, _)| b.id == target.id)
                    .ok_or(SceneError::InvariantBlocked)?
            }
            Position::End => kept.len(),
        };
        self.check(&kept, index, source, beats, ending)
    }

    /// The places `place` accepts for a new beat, in body order.
    fn places(&self, source: &[u8], beats: &[SceneBeat]) -> Vec<InsertionPlace> {
        let kept = self.kept(None);
        (0..=kept.len())
            .filter(|&index| self.check(&kept, index, source, beats, false).is_ok())
            .map(|index| InsertionPlace {
                position: kept.get(index).map_or(Position::End, |(b, _)| Position::Before {
                    anchor: node_ref(b),
                }),
                fits_ending: self.check(&kept, index, source, beats, true).is_ok(),
            })
            .collect()
    }

    fn kept(&self, excluded: Option<&str>) -> Vec<(&'a SceneBeat, bool)> {
        self.siblings
            .iter()
            .copied()
            .zip(self.ends.iter().copied())
            .filter(|(b, _)| excluded != Some(b.id.as_str()))
            .collect()
    }

    fn check(
        &self,
        kept: &[(&SceneBeat, bool)],
        index: usize,
        source: &[u8],
        beats: &[SceneBeat],
        ending: bool,
    ) -> Result<(usize, usize), SceneError> {
        let opaque = |b: &SceneBeat| b.protected && b.conditional_branch.is_none();
        let start = match kept.get(index) {
            Some((target, _)) if opaque(target) => return Err(SceneError::OpaqueBoundary),
            Some((target, _)) => target.byte_start as usize,
            None => {
                if self.owner.is_none()
                    && (self.end < source.len() || kept.last().is_some_and(|(b, _)| opaque(b)))
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                self.end
            }
        };
        if kept[..index].iter().any(|(_, ends)| *ends) || (ending && index < kept.len()) {
            return Err(SceneError::InvariantBlocked);
        }
        if kept.len() == 1 && kept[0].0.structural_placeholder && self.owner.is_some() {
            return Ok((kept[0].0.byte_start as usize, kept[0].0.byte_end as usize));
        }
        if boundary_is_opaque(beats, start) {
            return Err(SceneError::OpaqueBoundary);
        }
        Ok((start, start))
    }
}
