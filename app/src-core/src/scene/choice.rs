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
    let (start, _, first_line) = lines[index];
    let target = (source_version >= 13)
        .then(|| target_line(first_line))
        .flatten();
    if target.is_some() && indentation(first_line) != indent {
        return None;
    }
    let menu_index = index + usize::from(target.is_some());
    let (menu_start, end, line) = *lines.get(menu_index)?;
    if !lexical.contains(&menu_start) {
        return None;
    }
    let picked = (source_version >= 14)
        .then(|| parse_picked_header(line))
        .flatten();
    if source_version >= 10 && depth >= MAX_CONDITION_NESTING
        || !lexical.contains(&start)
        || (line != format!("{}menu:", " ".repeat(indent))
            && picked.is_none()
            && (source_version < 12
                || line != format!("{}menu (screen=\"_ll_choice_v1\"):", " ".repeat(indent))))
    {
        return None;
    }
    let (_, authoring, _) = loaded?;
    let semantic = line.trim() == "menu (screen=\"_ll_choice_v1\"):";
    let mut guards = Vec::new();
    let mut disabled_guards = Vec::new();
    let mut picked_rows = Vec::new();
    let mut next = menu_index + 1;
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
        let code = logic::without_comment(line).trim_end();
        let (text, expression, policy) = if picked.is_some() {
            let (text, guard, policy, id) = parse_picked_option(code)?;
            picked_rows.push((id.to_owned(), code.to_owned()));
            (text, guard, policy)
        } else if semantic {
            parse_option(code)?
        } else {
            let (text, expression) = logic::option_text(code)?;
            (text, expression, UnavailablePolicy::Hide)
        };
        guards.push(expression.map(str::to_owned));
        if policy == UnavailablePolicy::ShowDisabled && picked.is_none() {
            disabled_guards.push(
                code.trim()
                    .strip_suffix(':')?
                    .rsplit_once(" if ")?
                    .1
                    .to_owned(),
            );
        }
        let condition = expression.map(|s| crate::conditions::parse(s, authoring));
        let group = *group_start.get_or_insert(option_start);
        let mut header = custom(option_start, option_end, line);
        if let Some((cid, _)) = picked {
            let oid = &picked_rows.last()?.0;
            let &(rs, re, rline) = lines.get(next + 1)?;
            if !lexical.contains(&rs)
                || format!("{}\n", rline) != record(cid, oid, indent + 8, "\n")
            {
                return None;
            }
            header.end = re;
        }
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
            unavailable_policy: policy,
            id: Some(option_start.to_string()),
            text,
            condition,
        });
        next += 1 + usize::from(picked.is_some());
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
                if let Some(target) =
                    target.filter(|target| code.trim() == format!("jump {target}"))
                {
                    Some(BeatPayload::RepeatChoice {
                        target: Some(target.into()),
                    })
                } else {
                    parse_line_version(code, loaded, true)
                }
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
    if let Some((cid, policy)) = picked {
        let ids = picked_rows
            .iter()
            .map(|(id, _)| id.clone())
            .collect::<Vec<_>>();
        if ids.iter().collect::<HashSet<_>>().len() != ids.len() {
            return None;
        }
        for (index, (_, code)) in picked_rows.iter().enumerate() {
            let (_, qe) = dialogue_quotes(code)?;
            if code[qe + 1..code.len() - 1]
                != picked_suffix(
                    cid,
                    &ids[index],
                    policy,
                    options[index].unavailable_policy,
                    guards[index].as_deref(),
                    &ids,
                    &guards,
                )
            {
                return None;
            }
        }
    }
    if semantic
        && picked.is_none()
        && (disabled_guards.is_empty()
            || disabled_guards
                .iter()
                .any(|g| g != &selectable_guard(&guards)))
    {
        return None;
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
            payload: BeatPayload::Choice {
                options,
                prompt,
                picked_policy: picked.map(|(_, policy)| policy),
            },
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
    picked_policy: Option<PickedPolicy>,
    loaded: &Loaded,
) -> Result<(Vec<u8>, Vec<ForcedBeatId>), SceneError> {
    let BeatPayload::Choice {
        options: old,
        prompt: previous_prompt,
        picked_policy: previous_policy,
    } = &beat.payload
    else {
        return Err(SceneError::InvalidPayload);
    };
    if previous_policy.is_some() && picked_policy.is_none() {
        return Err(SceneError::InvalidPayload);
    }
    let end = end(beat, beats)?;
    if old == options && previous_prompt.as_ref() == prompt && *previous_policy == picked_policy {
        return Ok((source.to_vec(), vec![]));
    }
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
    let label_end = std::str::from_utf8(original_header)
        .ok()
        .and_then(|s| s.lines().next())
        .and_then(target_line)
        .map_or(0, |_| {
            original_header
                .iter()
                .position(|b| *b == b'\n')
                .map_or(original_header.len(), |p| p + 1)
        });
    let menu_end = label_end
        + original_header[label_end..]
            .iter()
            .position(|b| *b == b'\n')
            .map_or(original_header.len() - label_end, |p| p + 1);
    let semantic = options
        .iter()
        .any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled);
    let was_semantic = old
        .iter()
        .any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled);
    let mut menu = std::str::from_utf8(&original_header[label_end..menu_end])
        .map_err(|_| SceneError::UnsupportedSource)?
        .to_owned();
    if let (Some(previous), Some(next)) = (previous_policy, picked_policy) {
        if *previous != next {
            let start =
                menu.find("_ll_mode=\"").ok_or(SceneError::OpaqueBoundary)? + "_ll_mode=\"".len();
            menu.replace_range(
                start..start + policy_name(*previous).len(),
                policy_name(next),
            );
        }
    } else if picked_policy.is_some() || semantic != was_semantic {
        // Replace only the menu token. Keep this row's indentation, trailing
        // whitespace and newline even when adopting the runtime arguments.
        let start = menu.len() - menu.trim_start_matches(' ').len();
        let end = menu.trim_end().len();
        let next = picked_policy.map_or_else(
            || menu_header(options).to_owned(),
            |p| picked_header(&beat.id, p),
        );
        menu.replace_range(start..end, &next);
    }
    let mut rendered = original_header[..label_end].to_vec();
    rendered.extend_from_slice(menu.as_bytes());
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
    // Carry unchanged condition tokens into the aggregate guard too. Reformatting
    // an unrelated Hide option would violate exact source ownership.
    let guards = options
        .iter()
        .map(|option| {
            if let Some(previous) = old.iter().find(|o| {
                o.id == option.id && option.id.is_some() && o.condition == option.condition
            }) {
                let header = beats
                    .iter()
                    .find(|b| Some(&b.id) == previous.id.as_ref())
                    .ok_or(SceneError::InvalidMetadata)?;
                let original = std::str::from_utf8(
                    &source[header.byte_start as usize..header.byte_end as usize],
                )
                .map_err(|_| SceneError::UnsupportedSource)?;
                let code = logic::without_comment(
                    original.lines().next().ok_or(SceneError::OpaqueBoundary)?,
                )
                .trim_end();
                let expression = if previous_policy.is_some() {
                    parse_picked_option(code).map(|(_, e, _, _)| e)
                } else if was_semantic {
                    parse_option(code).map(|(_, e, _)| e)
                } else {
                    logic::option_text(code).map(|(_, e)| e)
                }
                .ok_or(SceneError::OpaqueBoundary)?;
                Ok(expression.map(str::to_owned))
            } else {
                guard_expression(option.condition.as_ref(), &loaded.authoring)
            }
        })
        .collect::<Result<Vec<_>, SceneError>>()?;
    let new_ids: Vec<_> = options
        .iter()
        .map(|o| {
            o.id.clone()
                .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
        })
        .collect();
    let mut seen = HashSet::new();
    for (option_index, option) in options.iter().enumerate() {
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
            if picked_policy.is_some() {
                let colon = header_colon(original)?;
                let suffix = picked_suffix(
                    &beat.id,
                    id,
                    picked_policy.unwrap(),
                    option.unavailable_policy,
                    guards[option_index].as_deref(),
                    &new_ids,
                    &guards,
                );
                updated.replace_range(qe + 1..colon, &suffix);
            } else if option.unavailable_policy == UnavailablePolicy::ShowDisabled
                || old[ordinal].unavailable_policy == UnavailablePolicy::ShowDisabled
            {
                let colon = header_colon(original)?;
                let suffix = suffix_from_guards(
                    option.unavailable_policy,
                    guards[option_index].as_deref(),
                    &guards,
                )?;
                // Keep exact bytes unless the semantic suffix itself changes.
                if original[qe + 1..colon] != suffix {
                    updated.replace_range(qe + 1..colon, &suffix);
                }
            } else if option.condition != old[ordinal].condition {
                let colon = header_colon(original)?;
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
            if picked_policy.is_some() && previous_policy.is_none() {
                // First adoption adds the record using this existing header's
                // newline. Retained source-backed records already own exact bytes.
                let row_newline = if original.ends_with("\r\n") {
                    "\r\n"
                } else {
                    "\n"
                };
                updated.push_str(&record(&beat.id, id, indent + 8, row_newline));
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
            let new_id = &new_ids[option_index];
            let suffix = if let Some(policy) = picked_policy {
                picked_suffix(
                    &beat.id,
                    new_id,
                    policy,
                    option.unavailable_policy,
                    guards[option_index].as_deref(),
                    &new_ids,
                    &guards,
                )
            } else {
                suffix_from_guards(
                    option.unavailable_policy,
                    guards[option_index].as_deref(),
                    &guards,
                )?
            };
            let recording = picked_policy.map_or_else(String::new, |_| {
                record(&beat.id, new_id, indent + 8, newline)
            });
            let generated = format!(
                "{}\"{}\"{}:{newline}{recording}{}pass{newline}",
                " ".repeat(indent + 4),
                escape_string(&option.text)?,
                suffix,
                " ".repeat(indent + 8)
            );
            let base = beat.byte_start as usize + rendered.len();
            let header_end = generated.find('\n').unwrap() + 1 + recording.len();
            forced.push((
                "customCode".into(),
                sha256(&generated.as_bytes()[..header_end]),
                new_id.clone(),
                Some(base),
            ));
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

// Native guards keep Hide filtering and no-selectable continuation in the Menu AST.
// Per-item arguments carry only the existing typed condition to the generated screen.
pub(super) fn menu_header(options: &[ChoiceOption]) -> &'static str {
    if options
        .iter()
        .any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled)
    {
        "menu (screen=\"_ll_choice_v1\"):"
    } else {
        "menu:"
    }
}
fn selectable_guard(guards: &[Option<String>]) -> String {
    if guards.iter().any(Option::is_none) {
        "True".into()
    } else {
        guards
            .iter()
            .flatten()
            .map(|s| format!("({s})"))
            .collect::<Vec<_>>()
            .join(" or ")
    }
}
pub(super) fn option_suffix(
    option: &ChoiceOption,
    options: &[ChoiceOption],
    authoring: &AuthoringMetadata,
) -> Result<String, SceneError> {
    let guards = options
        .iter()
        .map(|o| guard_expression(o.condition.as_ref(), authoring))
        .collect::<Result<Vec<_>, _>>()?;
    let guard = logic::render_guard(option.condition.as_ref(), authoring)?;
    suffix_from_guards(
        option.unavailable_policy,
        guard.strip_prefix(" if "),
        &guards,
    )
}
fn suffix_from_guards(
    policy: UnavailablePolicy,
    guard: Option<&str>,
    guards: &[Option<String>],
) -> Result<String, SceneError> {
    if policy == UnavailablePolicy::Hide {
        return Ok(guard.map_or_else(String::new, |s| format!(" if {s}")));
    }
    let expression = guard.ok_or(SceneError::InvalidPayload)?;
    Ok(format!(
        " (_ll_available={expression}) if {}",
        selectable_guard(guards)
    ))
}

fn parse_option(code: &str) -> Option<(String, Option<&str>, UnavailablePolicy)> {
    let code = code.trim().strip_suffix(':')?;
    let (qs, qe) = dialogue_quotes(code)?;
    let text = unescape_string(&code[qs + 1..qe])?;
    if let Some(args) = code[qe + 1..].strip_prefix(" (_ll_available=") {
        let (expression, _) = args.rsplit_once(") if ")?;
        Some((text, Some(expression), UnavailablePolicy::ShowDisabled))
    } else {
        logic::option_text(&format!("{code}:"))?;
        let expression = code[qe + 1..].trim().strip_prefix("if ");
        Some((text, expression, UnavailablePolicy::Hide))
    }
}

impl AuthoringService {
    /// Add the versioned semantic screen only in the accepted source transaction.
    /// Custom templates, name collisions and edited adapters refuse without repair.
    pub(super) fn choice_runtime_mutations(
        &self,
        project: &ProjectId,
        beats: &[SceneBeat],
        allow_adoption: bool,
    ) -> Result<Vec<FileMutation>, SceneError> {
        let picked = beats.iter().any(|b| {
            matches!(
                b.payload,
                BeatPayload::Choice {
                    picked_policy: Some(_),
                    ..
                }
            )
        });
        if !picked && !beats.iter().any(|b| matches!(&b.payload, BeatPayload::Choice { options, .. } if options.iter().any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled))) { return Ok(vec![]); }
        self.choice_helper_mutations(project, picked, allow_adoption)
    }

    /// Helper mutations and Repeat-target checks for one changed Scene. The caller
    /// adds the Scene file's own replacement.
    pub(super) fn choice_scene_runtime(
        &self,
        project: &ProjectId,
        scene_path: &str,
        original: &[u8],
        candidate: &[u8],
        beats: &[SceneBeat],
    ) -> Result<Vec<FileMutation>, SceneError> {
        let mut runtime = self.choice_runtime_mutations(project, beats, original != candidate)?;
        self.validate_choice_targets(project, original, candidate, beats)?;
        runtime.retain(|m| m.path.as_str() != scene_path);
        Ok(runtime)
    }

    /// A new Show normally Choice without Show disabled options needs no helper.
    /// When the project's choice screen cannot host one, write the plain native
    /// menu, as before saved selections. Other refusals, such as dirty Source, stand.
    pub(super) fn native_menu_fallback(
        &self,
        project: &ProjectId,
        mut command: SceneCommand,
    ) -> SceneCommand {
        if let SceneCommand::InsertBeat { beat, .. } | SceneCommand::InsertBodyBeat { beat, .. } =
            &mut command
        {
            if let BeatPayload::Choice {
                options,
                picked_policy: policy @ Some(PickedPolicy::ShowNormally),
                ..
            } = beat
            {
                if options
                    .iter()
                    .all(|o| o.unavailable_policy != UnavailablePolicy::ShowDisabled)
                    && matches!(
                        self.choice_helper_mutations(project, true, true),
                        Err(SceneError::OpaqueBoundary)
                    )
                {
                    *policy = None;
                }
            }
        }
        command
    }

    fn choice_helper_mutations(
        &self,
        project: &ProjectId,
        picked: bool,
        allow_adoption: bool,
    ) -> Result<Vec<FileMutation>, SceneError> {
        let paths = self.game_files(project)?;
        let mut existing = None;
        let mut template = None;
        let mut count = 0;
        let mut referenced = false;
        let mut picked_referenced = false;
        for path in paths.iter().filter(|p| p.ends_with(".rpy")) {
            let (bytes, revision) = self.scene_snapshot(project, path)?;
            count += bytes.len();
            if count > 32 * 1024 * 1024 {
                return Err(SceneError::InvariantBlocked);
            }
            let text = std::str::from_utf8(&bytes).map_err(|_| SceneError::UnsupportedSource)?;
            // Inspect the accepted on-disk dependencies before this proposal. A
            // changed source range alone does not authorize repairing a helper.
            for (start, end) in crate::authoring::lexical_lines(&bytes, false)
                .map_err(|_| SceneError::UnsupportedSource)?
            {
                let line = text[start..end].trim();
                let uses_picked = parse_picked_header(line).is_some();
                picked_referenced |= uses_picked;
                referenced |= uses_picked || line == "menu (screen=\"_ll_choice_v1\"):";
            }
            if text.contains("config.menu_include_disabled")
                || text.contains("config.menu_actions")
                || text.lines().any(|l| {
                    l.trim_start().starts_with("define menu =")
                        || l.trim_start().starts_with("def menu(")
                })
            {
                return Err(SceneError::OpaqueBoundary);
            }
            if path == crate::screens::choice_template::PATH {
                if bytes != crate::screens::choice_template::ADAPTER.as_bytes()
                    && bytes != crate::screens::choice_template::PICKED_ADAPTER.as_bytes()
                {
                    return Err(SceneError::OpaqueBoundary);
                }
                existing = Some((bytes.clone(), revision.clone()));
            } else if text
                .lines()
                .any(|l| l.trim_start().starts_with("screen _ll_choice_v1"))
            {
                return Err(SceneError::OpaqueBoundary);
            }
            if path != crate::screens::choice_template::PATH
                && text.lines().any(|l| {
                    let l = l.trim();
                    l.contains("_ll_picked_v1")
                        && (l.starts_with("default ")
                            || l.starts_with("define ")
                            || l.starts_with("def ")
                            || l.trim_start_matches('$')
                                .trim_start()
                                .strip_prefix("_ll_picked_v1")
                                .is_some_and(|rest| rest.trim_start().starts_with('=')))
                })
            {
                return Err(SceneError::InvariantBlocked);
            }

            if text.lines().any(|l| l.starts_with("screen choice(")) {
                if template.is_some() || !crate::screens::choice_template::supported(text) {
                    return Err(SceneError::OpaqueBoundary);
                }
                template = Some((path.clone(), bytes, revision));
            }
        }
        let (path, bytes, revision) = template.ok_or(SceneError::OpaqueBoundary)?;
        self.ensure_source_paths_clean(
            project,
            [path.as_str(), crate::screens::choice_template::PATH],
        )
        .map_err(|_| SceneError::DirtySource)?;
        if existing.is_none() && (!allow_adoption || referenced) {
            return Err(SceneError::OpaqueBoundary);
        }
        let mut mutations = vec![replace_mutation(&path, bytes.clone(), revision, bytes)?];
        if let Some((bytes, revision)) = existing {
            let next = if picked && bytes == crate::screens::choice_template::ADAPTER.as_bytes() {
                if !allow_adoption || picked_referenced {
                    return Err(SceneError::OpaqueBoundary);
                }
                crate::screens::choice_template::PICKED_ADAPTER
                    .as_bytes()
                    .to_vec()
            } else {
                bytes.clone()
            };
            mutations.push(replace_mutation(
                crate::screens::choice_template::PATH,
                bytes.clone(),
                revision,
                next,
            )?);
        } else {
            mutations.push(create_mutation(
                crate::screens::choice_template::PATH,
                if picked {
                    crate::screens::choice_template::PICKED_ADAPTER
                } else {
                    crate::screens::choice_template::ADAPTER
                }
                .as_bytes()
                .to_vec(),
            )?);
        }
        Ok(mutations)
    }
}

/// Reserved, versioned menu targets are source-owned, never an arbitrary-label editor.
pub(super) fn valid_target(target: &str) -> bool {
    target.strip_prefix("_ll_choice_").is_some_and(|id| {
        id.len() == 32
            && id
                .bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
    })
}
pub(super) fn target_line(line: &str) -> Option<&str> {
    line.trim()
        .strip_prefix("label ")
        .and_then(|s| s.strip_suffix(':'))
        .filter(|t| valid_target(t))
}
pub(super) fn target(source: &[u8], beat: &SceneBeat) -> Option<String> {
    target_line(
        std::str::from_utf8(&source[beat.byte_start as usize..beat.byte_end as usize])
            .ok()?
            .lines()
            .next()?,
    )
    .map(str::to_owned)
}
pub(super) fn owning_menu<'a>(
    beats: &'a [SceneBeat],
    body: &BodyRef,
) -> Result<&'a SceneBeat, SceneError> {
    let BodyRef::Branch {
        group_id,
        branch_id,
    } = body
    else {
        return Err(SceneError::InvariantBlocked);
    };
    let header = beats
        .iter()
        .find(|b| {
            b.id == *branch_id
                && b.conditional_branch
                    .as_ref()
                    .is_some_and(|g| g.choice_option && g.group_id == *group_id)
        })
        .ok_or(SceneError::InvariantBlocked)?;
    beats.iter().find(|b| matches!(&b.payload, BeatPayload::Choice { options, .. } if options.iter().any(|o| o.id.as_ref() == Some(&header.id)))).ok_or(SceneError::InvariantBlocked)
}

impl AuthoringService {
    /// Check reserved targets through the same project label inventory as stable
    /// Call continuations. Never repair source on open.
    pub(super) fn validate_choice_targets(
        &self,
        project: &ProjectId,
        original: &[u8],
        candidate: &[u8],
        beats: &[SceneBeat],
    ) -> Result<(), SceneError> {
        let targets: Vec<_> = beats
            .iter()
            .filter(|b| matches!(b.payload, BeatPayload::Choice { .. }))
            .filter_map(|b| target(candidate, b))
            .collect();
        let mut embedded = HashSet::new();
        for beat in beats {
            if let Some(id) = embedded_id(
                candidate,
                beat.byte_start as usize..beat.byte_end as usize,
                &beat.payload,
                beat.conditional_branch
                    .as_ref()
                    .is_some_and(|g| g.choice_option),
            ) {
                if id != beat.id || !embedded.insert(id) {
                    return Err(SceneError::InvariantBlocked);
                }
            }
        }
        if !embedded.is_empty() {
            let original =
                std::str::from_utf8(original).map_err(|_| SceneError::UnsupportedSource)?;
            let mut counts = HashMap::<String, usize>::new();
            for path in self
                .game_files(project)?
                .iter()
                .filter(|p| p.ends_with(".rpy"))
            {
                let (bytes, _) = self.scene_snapshot(project, path)?;
                let text =
                    std::str::from_utf8(&bytes).map_err(|_| SceneError::UnsupportedSource)?;
                for id in text.lines().filter_map(|line| {
                    parse_picked_header(line).map(|(id, _)| id).or_else(|| {
                        parse_picked_option(logic::without_comment(line).trim_end())
                            .map(|(_, _, _, id)| id)
                    })
                }) {
                    *counts.entry(id.to_owned()).or_default() += 1;
                }
            }
            for id in embedded {
                let old_count = original
                    .lines()
                    .filter(|line| {
                        parse_picked_header(line).is_some_and(|(key, _)| key == id)
                            || parse_picked_option(logic::without_comment(line).trim_end())
                                .is_some_and(|(_, _, _, key)| key == id)
                    })
                    .count();
                if old_count > 1 || counts.get(&id).copied().unwrap_or(0) != old_count {
                    return Err(SceneError::InvariantBlocked);
                }
            }
        }
        if targets.is_empty() {
            return Ok(());
        }
        let labels = self.call_label_inventory(project)?;
        let original_text =
            std::str::from_utf8(original).map_err(|_| SceneError::UnsupportedSource)?;
        let original_targets: Vec<_> = original_text.lines().filter_map(target_line).collect();
        let mut seen = HashSet::new();
        for target in targets {
            if !seen.insert(target.clone())
                || labels.get(&target).copied().unwrap_or(0)
                    != usize::from(original_targets.contains(&target.as_str()))
            {
                return Err(SceneError::InvariantBlocked);
            }
        }
        // A moved Repeat must still parse as a Repeat of its own Choice. Opaque
        // reserved jumps cannot be introduced by structural authoring.
        if beats.iter().any(|b| matches!(&b.payload, BeatPayload::CustomCode { source, .. } if logic::without_comment(source).trim().starts_with("jump _ll_choice_"))) { return Err(SceneError::InvariantBlocked); }
        Ok(())
    }
}

fn policy_name(policy: PickedPolicy) -> &'static str {
    match policy {
        PickedPolicy::ShowNormally => "showNormally",
        PickedPolicy::MarkPicked => "markPicked",
        PickedPolicy::HidePicked => "hidePicked",
    }
}
fn picked_header(id: &str, policy: PickedPolicy) -> String {
    format!(
        "menu (screen=\"_ll_choice_v1\", _ll_mode=\"{}\", _ll_id=\"{id}\"):",
        policy_name(policy)
    )
}
fn uuid_id(id: &str) -> bool {
    uuid::Uuid::parse_str(id).is_ok_and(|u| u.to_string() == id)
}
fn parse_picked_header(line: &str) -> Option<(&str, PickedPolicy)> {
    let rest = line
        .trim()
        .strip_prefix("menu (screen=\"_ll_choice_v1\", _ll_mode=\"")?;
    let (mode, id) = rest.split_once("\", _ll_id=\"")?;
    let id = id.strip_suffix("\"):")?;
    if !uuid_id(id) {
        return None;
    }
    Some((
        id,
        match mode {
            "showNormally" => PickedPolicy::ShowNormally,
            "markPicked" => PickedPolicy::MarkPicked,
            "hidePicked" => PickedPolicy::HidePicked,
            _ => return None,
        },
    ))
}
fn record(cid: &str, oid: &str, indent: usize, newline: &str) -> String {
    format!(
        "{}$ _ll_picked_v1[(\"{cid}\", \"{oid}\")] = True{newline}",
        " ".repeat(indent)
    )
}
fn unpicked(cid: &str, oid: &str) -> String {
    format!("(\"{cid}\", \"{oid}\") not in _ll_picked_v1")
}
fn picked_suffix(
    cid: &str,
    oid: &str,
    policy: PickedPolicy,
    unavailable: UnavailablePolicy,
    guard: Option<&str>,
    ids: &[String],
    guards: &[Option<String>],
) -> String {
    let effective = |id: &str, guard: Option<&str>| {
        let guard = guard.unwrap_or("True");
        if policy == PickedPolicy::HidePicked {
            format!("({guard}) and ({})", unpicked(cid, id))
        } else {
            guard.to_owned()
        }
    };
    let enabled = effective(oid, guard);
    let visible = if unavailable == UnavailablePolicy::ShowDisabled {
        let gate = ids
            .iter()
            .zip(guards)
            .map(|(id, g)| format!("({})", effective(id, g.as_deref())))
            .collect::<Vec<_>>()
            .join(" or ");
        if policy == PickedPolicy::HidePicked {
            format!("({}) and ({gate})", unpicked(cid, oid))
        } else {
            gate
        }
    } else {
        enabled
    };
    format!(
        " (_ll_id=\"{oid}\", _ll_available={}, _ll_guarded={}, _ll_locked={}) if {visible}",
        guard.unwrap_or("True"),
        if guard.is_some() { "True" } else { "False" },
        if unavailable == UnavailablePolicy::ShowDisabled {
            "True"
        } else {
            "False"
        }
    )
}
fn parse_picked_option(code: &str) -> Option<(String, Option<&str>, UnavailablePolicy, &str)> {
    let code = code.trim().strip_suffix(':')?;
    let (qs, qe) = dialogue_quotes(code)?;
    let rest = code[qe + 1..].strip_prefix(" (_ll_id=\"")?;
    let (id, rest) = rest.split_once("\", _ll_available=")?;
    if !uuid_id(id) {
        return None;
    }
    let (guard, rest) = rest.rsplit_once(", _ll_guarded=")?;
    let (guarded, rest) = rest.split_once(", _ll_locked=")?;
    if !matches!(guarded, "True" | "False") || guarded == "False" && guard != "True" {
        return None;
    }
    let (locked, _) = rest.split_once(") if ")?;
    Some((
        unescape_string(&code[qs + 1..qe])?,
        (guarded == "True").then_some(guard),
        match locked {
            "True" => UnavailablePolicy::ShowDisabled,
            "False" => UnavailablePolicy::Hide,
            _ => return None,
        },
        id,
    ))
}
/// An option's native guard expression, without the leading ` if `.
fn guard_expression(
    condition: Option<&crate::conditions::Condition>,
    authoring: &AuthoringMetadata,
) -> Result<Option<String>, SceneError> {
    logic::render_guard(condition, authoring).map(|s| s.strip_prefix(" if ").map(str::to_owned))
}

/// The block colon of an option header line, ignoring a trailing comment.
fn header_colon(line: &str) -> Result<usize, SceneError> {
    logic::without_comment(line)
        .trim_end()
        .rfind(':')
        .ok_or(SceneError::OpaqueBoundary)
}

/// Source-backed runtime keys also anchor the existing map identity. No captions or ordinals.
pub(super) fn embedded_id(
    source: &[u8],
    range: std::ops::Range<usize>,
    payload: &BeatPayload,
    option_header: bool,
) -> Option<String> {
    let text = std::str::from_utf8(&source[range]).ok()?;
    if matches!(payload, BeatPayload::Choice { .. }) {
        text.lines()
            .find_map(parse_picked_header)
            .map(|(id, _)| id.to_owned())
    } else if option_header {
        parse_picked_option(logic::without_comment(text.lines().next()?).trim_end())
            .map(|(_, _, _, id)| id.to_owned())
    } else {
        None
    }
}

pub(super) fn render_new(
    options: &[ChoiceOption],
    prompt: Option<&ChoicePrompt>,
    policy: PickedPolicy,
    loaded: &Loaded,
    newline: &str,
) -> Result<String, SceneError> {
    let cid = uuid::Uuid::new_v4().to_string();
    let ids = options
        .iter()
        .map(|_| uuid::Uuid::new_v4().to_string())
        .collect::<Vec<_>>();
    let guards = options
        .iter()
        .map(|o| guard_expression(o.condition.as_ref(), &loaded.authoring))
        .collect::<Result<Vec<_>, _>>()?;
    let mut text = format!("    {}{newline}", picked_header(&cid, policy));
    if let Some(prompt) = prompt {
        text.push_str(&render_prompt(prompt, loaded, 8, newline)?);
    }
    for (i, option) in options.iter().enumerate() {
        text.push_str(&format!(
            "        \"{}\"{}:{newline}{}            pass{newline}",
            escape_string(&option.text)?,
            picked_suffix(
                &cid,
                &ids[i],
                policy,
                option.unavailable_policy,
                guards[i].as_deref(),
                &ids,
                &guards
            ),
            record(&cid, &ids[i], 12, newline)
        ));
    }
    Ok(text)
}
