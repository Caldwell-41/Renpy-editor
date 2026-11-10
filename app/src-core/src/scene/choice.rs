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
        || (line != format!("{}menu:", " ".repeat(indent))
            && (source_version < 12
                || line != format!("{}menu (screen=\"_ll_choice_v1\"):", " ".repeat(indent))))
    {
        return None;
    }
    let (_, authoring, _) = loaded?;
    let semantic = line.trim() == "menu (screen=\"_ll_choice_v1\"):";
    let mut guards = Vec::new();
    let mut disabled_guards = Vec::new();
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
        let code = logic::without_comment(line).trim_end();
        let (text, expression, policy) = if semantic {
            parse_option(code)?
        } else {
            let (text, expression) = logic::option_text(code)?;
            (text, expression, UnavailablePolicy::Hide)
        };
        guards.push(expression.map(str::to_owned));
        if policy == UnavailablePolicy::ShowDisabled {
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
    if semantic
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
    if old == options && previous_prompt.as_ref() == prompt {
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
    let menu_end = original_header
        .iter()
        .position(|b| *b == b'\n')
        .map_or(original_header.len(), |p| p + 1);
    let semantic = options
        .iter()
        .any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled);
    let was_semantic = old
        .iter()
        .any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled);
    let mut rendered = if semantic == was_semantic {
        original_header[..menu_end].to_vec()
    } else {
        format!("{}{}{newline}", " ".repeat(indent), menu_header(options)).into_bytes()
    };
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
                let code = logic::without_comment(original).trim_end();
                let expression = if was_semantic {
                    parse_option(code).map(|(_, e, _)| e)
                } else {
                    logic::option_text(code).map(|(_, e)| e)
                }
                .ok_or(SceneError::OpaqueBoundary)?;
                Ok(expression.map(str::to_owned))
            } else {
                logic::render_guard(option.condition.as_ref(), &loaded.authoring)
                    .map(|s| s.strip_prefix(" if ").map(str::to_owned))
            }
        })
        .collect::<Result<Vec<_>, SceneError>>()?;
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
            if option.unavailable_policy == UnavailablePolicy::ShowDisabled
                || old[ordinal].unavailable_policy == UnavailablePolicy::ShowDisabled
            {
                let colon = logic::without_comment(original)
                    .trim_end()
                    .rfind(':')
                    .ok_or(SceneError::OpaqueBoundary)?;
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
                suffix_from_guards(
                    option.unavailable_policy,
                    guards[option_index].as_deref(),
                    &guards
                )?,
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
        .map(|o| {
            logic::render_guard(o.condition.as_ref(), authoring)
                .map(|s| s.strip_prefix(" if ").map(str::to_owned))
        })
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
        allow_create: bool,
    ) -> Result<Vec<FileMutation>, SceneError> {
        if !beats.iter().any(|b| matches!(&b.payload, BeatPayload::Choice { options, .. } if options.iter().any(|o| o.unavailable_policy == UnavailablePolicy::ShowDisabled))) { return Ok(vec![]); }
        let paths = self
            .transactions
            .inventory_files_bounded(project, "game", 8192)
            .map_err(diagnostic_error)?;
        let mut existing = None;
        let mut template = None;
        let mut count = 0;
        for path in paths.iter().filter(|p| p.ends_with(".rpy")) {
            let (bytes, revision) = self.scene_snapshot(project, path)?;
            count += bytes.len();
            if count > 32 * 1024 * 1024 {
                return Err(SceneError::InvariantBlocked);
            }
            let text = std::str::from_utf8(&bytes).map_err(|_| SceneError::UnsupportedSource)?;
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
                if bytes != crate::screens::choice_template::ADAPTER.as_bytes() {
                    return Err(SceneError::OpaqueBoundary);
                }
                existing = Some((bytes.clone(), revision.clone()));
            } else if text
                .lines()
                .any(|l| l.trim_start().starts_with("screen _ll_choice_v1"))
            {
                return Err(SceneError::OpaqueBoundary);
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
        if existing.is_none() && !allow_create {
            return Err(SceneError::OpaqueBoundary);
        }
        let mut mutations = vec![replace_mutation(&path, bytes.clone(), revision, bytes)?];
        if let Some((bytes, revision)) = existing {
            mutations.push(replace_mutation(
                crate::screens::choice_template::PATH,
                bytes.clone(),
                revision,
                bytes,
            )?);
        } else {
            mutations.push(create_mutation(
                crate::screens::choice_template::PATH,
                crate::screens::choice_template::ADAPTER.as_bytes().to_vec(),
            )?);
        }
        Ok(mutations)
    }
}
