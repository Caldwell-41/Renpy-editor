//! Choice headers and option bodies use the existing source-derived branch owner.
use super::*;

pub(super) fn parse(
    lines: &[(usize, usize, &str)],
    index: usize,
    indent: usize,
    loaded: Option<SceneParseContext<'_>>,
    lexical: &HashSet<usize>,
    parent: Option<(usize, usize)>,
    depth: usize,
    source_version: u32,
) -> Option<(usize, Vec<ParsedBeat>)> {
    let (start, end, line) = lines[index];
    if source_version >= 10 && depth >= MAX_CONDITION_NESTING
        || !lexical.contains(&start)
        || line != format!("{}menu:", " ".repeat(indent))
    {
        return None;
    }
    let (_, authoring, _) = loaded?;
    let mut next = index + 1;
    let mut header_end = end;
    let mut prompt = None;
    if source_version >= 11 {
        if let Some(&(ps, pe, line)) = lines.get(next) {
            if indentation(line) == indent + 4 && lexical.contains(&ps) {
                let normalized = format!("    {}", &line[indent + 4..]);
                let code = logic::without_comment(&normalized).trim_end();
                prompt = match parse_line(code, loaded) {
                    Some(BeatPayload::Narration { text }) => Some(ChoicePrompt::Narration { text }),
                    Some(BeatPayload::Dialogue { character_id, text }) => {
                        Some(ChoicePrompt::Dialogue { character_id, text })
                    }
                    _ => None,
                };
                if prompt.is_some() {
                    header_end = pe;
                    next += 1;
                }
            }
        }
    }
    let mut result = Vec::new();
    let mut options = Vec::new();
    let mut group_start = None;
    while next < lines.len() {
        let (option_start, option_end, line) = lines[next];
        if indentation(line) != indent + 4 || !lexical.contains(&option_start) {
            break;
        }
        let (text, expression) = logic::option_text(logic::without_comment(line).trim_end())?;
        let condition = expression.map(|s| crate::conditions::parse(s, authoring));
        let group = *group_start.get_or_insert(option_start);
        let mut header = custom(option_start, option_end, line);
        header.nesting = Some(ParsedNesting::Branch {
            choice_option: true,
            group_start: group,
            variable_id: String::new(),
            otherwise: false,
            ordinal: options.len() as u32,
            condition: condition.clone(),
            parent,
        });
        result.push(header);
        options.push(ChoiceOption {
            id: Some(option_start.to_string()),
            text,
            condition,
        });
        next += 1;
        let mut statements = 0;
        while next < lines.len() {
            let (child_start, child_end, line) = lines[next];
            let trivia = line.trim().is_empty() || line.trim_start().starts_with('#');
            if !trivia && indentation(line) <= indent + 4 {
                break;
            }
            // Outdented trivia has no provable option owner. Preserve via Source fallback.
            if trivia && !line.trim().is_empty() && indentation(line) < indent + 8 {
                return None;
            }
            if !trivia && indentation(line) != indent + 8 {
                return None;
            }
            if source_version >= 10 && !trivia {
                let owner = Some((group, option_start));
                if let Some((after, nested)) = parse_condition_group(
                    lines,
                    next,
                    loaded,
                    indent + 8,
                    owner,
                    depth + 1,
                    lexical,
                    source_version,
                )
                .or_else(|| {
                    parse(
                        lines,
                        next,
                        indent + 8,
                        loaded,
                        lexical,
                        owner,
                        depth + 1,
                        source_version,
                    )
                }) {
                    result.extend(nested);
                    next = after;
                    statements += 1;
                    continue;
                }
            }
            let normalized = format!("    {}", &line[indentation(line).min(indent + 8)..]);
            let code = logic::without_comment(&normalized).trim_end();
            let payload = if trivia || !lexical.contains(&child_start) {
                None
            } else {
                parse_line_version(code, loaded, true)
            };
            let payload = payload.unwrap_or_else(|| custom(child_start, child_end, line).payload);
            result.push(ParsedBeat {
                start: child_start,
                end: child_end,
                payload,
                nesting: Some(ParsedNesting::Child {
                    group_start: group,
                    branch_start: option_start,
                }),
            });
            next += 1;
            if !trivia {
                statements += 1;
            }
            // Keep unsupported blocks opaque, including their quoted/Python contents.
            if matches!(result.last()?.payload, BeatPayload::CustomCode { .. }) && !trivia {
                while next < lines.len()
                    && (!lexical.contains(&lines[next].0)
                        || indentation(lines[next].2) > indent + 8)
                {
                    let (s, e, l) = lines[next];
                    let mut opaque = custom(s, e, l);
                    opaque.nesting = Some(ParsedNesting::Child {
                        group_start: group,
                        branch_start: option_start,
                    });
                    result.push(opaque);
                    next += 1;
                }
            }
        }
        if statements == 0 {
            return None;
        }
    }
    if options.is_empty() {
        return None;
    }
    if next < lines.len() && !lines[next].2.trim().is_empty() && indentation(lines[next].2) > indent
    {
        return None;
    }
    result.insert(
        0,
        ParsedBeat {
            start,
            end: header_end,
            payload: BeatPayload::Choice { options, prompt },
            nesting: parent.map(|(group_start, branch_start)| ParsedNesting::Child {
                group_start,
                branch_start,
            }),
        },
    );
    Some((next, result))
}

pub(super) fn end(beat: &SceneBeat, beats: &[SceneBeat]) -> Result<usize, SceneError> {
    let BeatPayload::Choice { options, .. } = &beat.payload else {
        return Err(SceneError::InvalidPayload);
    };
    let header = beats
        .iter()
        .find(|b| Some(&b.id) == options.last().and_then(|o| o.id.as_ref()))
        .ok_or(SceneError::InvalidMetadata)?;
    conditional_extents(beats)
        .get(
            header
                .conditional_branch
                .as_ref()
                .ok_or(SceneError::InvalidMetadata)?
                .group_id
                .as_str(),
        )
        .map(|(_, e)| *e)
        .ok_or(SceneError::InvalidMetadata)
}

/// Update captions/order/count while carrying each retained option's exact source body.
/// All retained physical rows get explicit anchors, including duplicate captions.
pub(super) fn update(
    source: &[u8],
    beats: &[SceneBeat],
    beat: &SceneBeat,
    options: &[ChoiceOption],
    prompt: Option<&ChoicePrompt>,
    loaded: &Loaded,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    let BeatPayload::Choice {
        options: old,
        prompt: previous_prompt,
    } = &beat.payload
    else {
        return Err(SceneError::InvalidPayload);
    };
    let end = end(beat, beats)?;
    let newline = if source.windows(2).any(|w| w == b"\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let indent = indentation(
        std::str::from_utf8(&source[beat.byte_start as usize..beat.byte_end as usize])
            .map_err(|_| SceneError::UnsupportedSource)?,
    );
    let original_header = &source[beat.byte_start as usize..beat.byte_end as usize];
    let menu_end = original_header
        .iter()
        .position(|b| *b == b'\n')
        .map_or(original_header.len(), |p| p + 1);
    let mut rendered = original_header[..menu_end].to_vec();
    match (previous_prompt.as_ref(), prompt) {
        (Some(old), Some(next)) if old == next => {
            rendered.extend_from_slice(&original_header[menu_end..])
        }
        (Some(_), Some(next)) => {
            let original = std::str::from_utf8(&original_header[menu_end..])
                .map_err(|_| SceneError::UnsupportedSource)?;
            let (qs, qe) = dialogue_quotes(original).ok_or(SceneError::OpaqueBoundary)?;
            let text = match next {
                ChoicePrompt::Narration { text } | ChoicePrompt::Dialogue { text, .. } => text,
            };
            let mut patched = original.to_owned();
            patched.replace_range(qs + 1..qe, &escape_string(text)?);
            let prefix = match next {
                ChoicePrompt::Narration { .. } => String::new(),
                ChoicePrompt::Dialogue { character_id, .. } => {
                    format!("{} ", character(loaded, character_id)?.technical_name)
                }
            };
            // Keep indentation and trailing comments; replace only speaker and text tokens.
            let leading = original.len() - original.trim_start_matches(' ').len();
            let old_prefix = original[leading..qs].trim_end();
            let next_name = prefix.trim_end();
            if old_prefix != next_name {
                patched.replace_range(leading..qs, &prefix);
            }
            rendered.extend_from_slice(patched.as_bytes());
        }
        (None, Some(prompt)) => rendered
            .extend_from_slice(render_prompt(prompt, loaded, indent + 4, newline)?.as_bytes()),
        (_, None) => {}
    }
    let mut forced = vec![(
        "choice".into(),
        sha256(&rendered),
        beat.id.clone(),
        Some(beat.byte_start as usize),
    )];
    let mut seen = HashSet::new();
    for option in options {
        if let Some(id) = &option.id {
            if !seen.insert(id) {
                return Err(SceneError::InvariantBlocked);
            }
            let ordinal = old
                .iter()
                .position(|o| o.id.as_ref() == Some(id))
                .ok_or(SceneError::InvariantBlocked)?;
            let header = beats
                .iter()
                .find(|b| &b.id == id)
                .ok_or(SceneError::InvalidMetadata)?;
            let option_end = old
                .get(ordinal + 1)
                .and_then(|o| o.id.as_ref())
                .and_then(|id| beats.iter().find(|b| &b.id == id))
                .map_or(end, |b| b.byte_start as usize);
            let original =
                std::str::from_utf8(&source[header.byte_start as usize..header.byte_end as usize])
                    .map_err(|_| SceneError::UnsupportedSource)?;
            let mut updated = original.to_owned();
            let (qs, qe) = dialogue_quotes(original).ok_or(SceneError::OpaqueBoundary)?;
            // Preserve the exact header for a no-op, including condition spelling/comments.
            if option.condition != old[ordinal].condition {
                let colon = logic::without_comment(original)
                    .trim_end()
                    .rfind(':')
                    .ok_or(SceneError::OpaqueBoundary)?;
                let suffix = &original[qe + 1..colon];
                let leading = suffix.len() - suffix.trim_start().len();
                let replacement =
                    logic::render_guard(option.condition.as_ref(), &loaded.authoring)?;
                match (&old[ordinal].condition, &option.condition) {
                    (Some(_), Some(_)) => {
                        let keyword = qe + 1 + leading;
                        let after_keyword = keyword + 2;
                        let remainder = &original[after_keyword..colon];
                        let start = after_keyword + remainder.len() - remainder.trim_start().len();
                        let end = colon - (remainder.len() - remainder.trim_end().len());
                        updated.replace_range(
                            start..end,
                            replacement
                                .strip_prefix(" if ")
                                .ok_or(SceneError::InvalidPayload)?,
                        );
                    }
                    (None, Some(_)) => updated.insert_str(qe + 1, &replacement),
                    (Some(_), None) => {
                        let start = qe + 1 + leading;
                        let end = colon - (suffix.len() - suffix.trim_end().len());
                        updated.replace_range(start..end, "");
                    }
                    _ => {}
                }
            }
            if option.text != old[ordinal].text {
                updated.replace_range(qs + 1..qe, &escape_string(&option.text)?);
            }
            let at = beat.byte_start as usize + rendered.len();
            forced.push((
                "customCode".into(),
                sha256(updated.as_bytes()),
                id.clone(),
                Some(at),
            ));
            rendered.extend_from_slice(updated.as_bytes());
            let body_start = beat.byte_start as usize + rendered.len();
            for child in beats
                .iter()
                .filter(|b| b.byte_start >= header.byte_end && b.byte_end as usize <= option_end)
            {
                forced.push((
                    child.payload.kind().into(),
                    sha256(&source[child.byte_start as usize..child.byte_end as usize]),
                    child.id.clone(),
                    Some(body_start + child.byte_start as usize - header.byte_end as usize),
                ));
            }
            rendered.extend_from_slice(&source[header.byte_end as usize..option_end]);
        } else {
            let generated = format!(
                "{}\"{}\"{}:{newline}{}pass{newline}",
                " ".repeat(indent + 4),
                escape_string(&option.text)?,
                logic::render_guard(option.condition.as_ref(), &loaded.authoring)?,
                " ".repeat(indent + 8)
            );
            let base = beat.byte_start as usize + rendered.len();
            for (start, end, _) in physical_lines(&generated) {
                forced.push((
                    "customCode".into(),
                    sha256(&generated.as_bytes()[start..end]),
                    uuid::Uuid::new_v4().to_string(),
                    Some(base + start),
                ));
            }
            rendered.extend_from_slice(generated.as_bytes());
        }
    }
    retain_insertion(
        source,
        beats,
        beat.byte_start as usize,
        end,
        rendered.len(),
        &mut forced,
    );
    let mut output = source.to_vec();
    output.splice(beat.byte_start as usize..end, rendered);
    Ok((output, forced))
}

pub(super) fn may_continue(beat: &SceneBeat, beats: &[SceneBeat]) -> bool {
    may_continue_at_depth(beat, beats, 0)
}
pub(super) fn may_continue_at_depth(beat: &SceneBeat, beats: &[SceneBeat], depth: usize) -> bool {
    let BeatPayload::Choice { options, .. } = &beat.payload else {
        return true;
    };
    if depth >= MAX_CONDITION_NESTING || options.iter().all(|o| o.condition.is_some()) {
        return true;
    }
    options.iter().any(|option| {
        let Some(header) = beats.iter().find(|b| Some(&b.id) == option.id.as_ref()) else {
            return true;
        };
        let Some(branch) = &header.conditional_branch else {
            return true;
        };
        logic::body_may_continue(
            &crate::metadata::BeatOwner {
                group_id: branch.group_id.clone(),
                branch_id: header.id.clone(),
            },
            beats,
            depth,
        )
    })
}

/// Reserve unchanged physical records before mapping a newly inserted menu. Identical
/// menu/option headers must not consume an existing menu's identities by hash order.
pub(super) fn retain_insertion(
    source: &[u8],
    beats: &[SceneBeat],
    start: usize,
    end: usize,
    inserted: usize,
    forced: &mut Vec<ForcedBeatId>,
) {
    for beat in beats {
        let old_start = beat.byte_start as usize;
        if old_start >= start && (beat.byte_end as usize) <= end
            || forced.iter().any(|(_, _, id, _)| id == &beat.id)
        {
            continue;
        }
        let next = if old_start >= end {
            old_start + inserted - (end - start)
        } else {
            old_start
        };
        forced.push((
            beat.payload.kind().into(),
            sha256(&source[old_start..beat.byte_end as usize]),
            beat.id.clone(),
            Some(next),
        ));
    }
}

pub(super) fn render_prompt(
    prompt: &ChoicePrompt,
    loaded: &Loaded,
    indent: usize,
    newline: &str,
) -> Result<String, SceneError> {
    let (prefix, text) = match prompt {
        ChoicePrompt::Narration { text } => (String::new(), text),
        ChoicePrompt::Dialogue { character_id, text } => (
            format!("{} ", character(loaded, character_id)?.technical_name),
            text,
        ),
    };
    Ok(format!(
        "{}{prefix}\"{}\"{newline}",
        " ".repeat(indent),
        escape_string(text)?
    ))
}
