//! Supported calls and guarded menus over the same exact-source patch boundary.
use super::*;
use crate::conditions::Condition;

pub(super) fn identifier(value: &str) -> bool {
    let mut chars = value.chars();
    chars
        .next()
        .is_some_and(|ch| ch == '_' || ch.is_ascii_alphabetic())
        && chars.all(|ch| ch == '_' || ch.is_ascii_alphanumeric())
}
pub(super) fn without_comment(line: &str) -> &str {
    let mut quote = None;
    let mut escaped = false;
    for (offset, ch) in line.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' && quote.is_some() {
            escaped = true;
            continue;
        }
        if quote == Some(ch) {
            quote = None;
        } else if quote.is_none() && matches!(ch, '\'' | '"') {
            quote = Some(ch);
        } else if quote.is_none() && ch == '#' {
            return &line[..offset];
        }
    }
    line
}
pub(super) fn parse_call(line: &str) -> Option<(&str, &str)> {
    let mut tokens = without_comment(line).split_whitespace();
    if tokens.next()? != "call" {
        return None;
    }
    let target = tokens.next()?;
    if !identifier(target) || tokens.next()? != "from" {
        return None;
    }
    let label = tokens.next()?;
    (identifier(label) && tokens.next().is_none()).then_some((target, label))
}
pub(super) fn patch_call_target(bytes: &[u8], target: &str) -> Result<String, SceneError> {
    let text = std::str::from_utf8(bytes).map_err(|_| SceneError::UnsupportedSource)?;
    let (old_target, _) = parse_call(text.trim_start()).ok_or(SceneError::OpaqueBoundary)?;
    let beginning = text.len() - text.trim_start().len();
    let after_keyword = beginning + 4;
    let offset =
        after_keyword + text[after_keyword..].len() - text[after_keyword..].trim_start().len();
    let mut output = text.to_owned();
    output.replace_range(offset..offset + old_target.len(), target);
    Ok(output)
}
impl AuthoringService {
    pub(super) fn prepare_call_labels(
        &self,
        project: &ProjectId,
        _loaded: &Loaded,
        _source_id: &str,
        beats: &[SceneBeat],
        mut edit: BeatEdit,
    ) -> Result<BeatEdit, SceneError> {
        match &mut edit {
            BeatEdit::Insert {
                payload: BeatPayload::Call { return_label, .. },
                ..
            } => {
                if return_label.is_some() {
                    return Err(SceneError::InvalidPayload);
                }
                let labels = self.call_label_inventory(project)?;
                let candidate = format!("_ll_call_{}", uuid::Uuid::new_v4().simple());
                if labels.contains_key(&candidate) {
                    return Err(SceneError::InvariantBlocked);
                }
                *return_label = Some(candidate);
            }
            BeatEdit::Update {
                id,
                payload: BeatPayload::Call { return_label, .. },
            } => {
                let old = beats
                    .iter()
                    .find(|b| &b.id == id)
                    .ok_or(SceneError::UnknownEntity)?;
                let BeatPayload::Call {
                    return_label: existing,
                    ..
                } = &old.payload
                else {
                    return Err(SceneError::InvalidPayload);
                };
                if return_label.is_some() && return_label != existing {
                    return Err(SceneError::InvariantBlocked);
                }
                let labels = self.call_label_inventory(project)?;
                if existing
                    .as_ref()
                    .is_none_or(|label| labels.get(label) != Some(&1))
                {
                    return Err(SceneError::AmbiguousReturnLabel);
                }
                *return_label = existing.clone();
            }
            _ => {}
        }
        Ok(edit)
    }
    fn call_label_inventory(
        &self,
        project: &ProjectId,
    ) -> Result<HashMap<String, usize>, SceneError> {
        let paths = self
            .transactions
            .inventory_files_bounded(project, "game", 8192)
            .map_err(diagnostic_error)?;
        let paths: Vec<_> = paths.into_iter().filter(|p| p.ends_with(".rpy")).collect();
        if paths.len() > 2048 {
            return Err(SceneError::InvariantBlocked);
        }
        let mut bytes_seen = 0;
        let mut labels = HashMap::<String, usize>::new();
        for path in paths {
            let (bytes, _) = self.scene_snapshot(project, &path)?;
            bytes_seen += bytes.len();
            if bytes.len() > 16 * 1024 * 1024 || bytes_seen > 32 * 1024 * 1024 {
                return Err(SceneError::InvariantBlocked);
            }
            let bom = usize::from(bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
            let bytes = &bytes[bom..];
            let ranges = crate::authoring::lexical_ranges(bytes, false, false)
                .map_err(|_| SceneError::OpaqueBoundary)?;
            for (start, end) in ranges {
                let line = std::str::from_utf8(&bytes[start..end])
                    .map_err(|_| SceneError::UnsupportedSource)?;
                let line = without_comment(line).trim();
                if let Some(label) = line.strip_prefix("label ") {
                    let name = label
                        .split([':', '(', ' ', '\t', '\r', '\n'])
                        .next()
                        .unwrap_or("");
                    if identifier(name) {
                        *labels.entry(name.into()).or_default() += 1;
                    }
                }
                if line.starts_with("call ") {
                    let tokens: Vec<_> = line.split_whitespace().collect();
                    for pair in tokens.windows(2) {
                        if pair[0] == "from" && identifier(pair[1]) {
                            *labels.entry(pair[1].into()).or_default() += 1;
                        }
                    }
                }
            }
        }
        Ok(labels)
    }
}
pub(super) const MAX_CALL_NESTING: usize = 16;
/// Conservative possible-edge inspection, never reachability or runtime evaluation.
pub(super) fn call_route_is_unsupported(
    adjacency: &HashMap<String, Vec<(String, bool)>>,
    source: &str,
    target: &str,
) -> bool {
    call_route_with_budget(adjacency, source, target, &mut 8192)
}

pub(super) fn call_route_with_budget(
    adjacency: &HashMap<String, Vec<(String, bool)>>,
    source: &str,
    target: &str,
    remaining: &mut usize,
) -> bool {
    if source == target {
        return true;
    }
    let mut pending = vec![(
        target.to_owned(),
        vec![source.to_owned(), target.to_owned()],
    )];
    let mut visited = HashSet::new();
    while let Some((node, stack)) = pending.pop() {
        if !visited.insert((node.clone(), stack.clone())) {
            continue;
        }
        if *remaining == 0 {
            return true;
        }
        *remaining -= 1;
        for (destination, calling) in adjacency.get(&node).into_iter().flatten() {
            let mut next_stack = stack.clone();
            if *calling {
                if stack.contains(destination) || stack.len() > MAX_CALL_NESTING {
                    return true;
                }
                next_stack.push(destination.clone());
            }
            pending.push((destination.clone(), next_stack));
        }
    }
    false
}

pub(super) fn render_guard(
    condition: Option<&Condition>,
    authoring: &AuthoringMetadata,
) -> Result<String, SceneError> {
    match condition {
        None => Ok(String::new()),
        Some(Condition::Supported { expression }) => {
            crate::conditions::render(expression, authoring)
                .map(|source| format!(" if {source}"))
                .map_err(|_| SceneError::InvalidPayload)
        }
        Some(Condition::Unknown { .. }) => Err(SceneError::OpaqueBoundary),
    }
}
pub(super) fn option_text(line: &str) -> Option<(String, Option<&str>)> {
    if without_comment(line).len() != line.len() {
        return None;
    }
    let code = line.trim().strip_suffix(':')?.trim_end();
    if !code.starts_with('"') {
        return None;
    }
    let (start, end) = dialogue_quotes(code)?;
    let text = unescape_string(&code[start + 1..end])?;
    let suffix = code[end + 1..].trim();
    if suffix.is_empty() {
        Some((text, None))
    } else {
        Some((text, Some(suffix.strip_prefix("if ")?.trim())))
    }
}
pub(super) fn parse_menu(
    lines: &[(usize, usize, &str)],
    index: usize,
    indent: usize,
    loaded: Option<SceneParseContext<'_>>,
    lexical: &HashSet<usize>,
) -> Option<(usize, ParsedBeat)> {
    let (start, end, header) = lines[index];
    if !lexical.contains(&start)
        || without_comment(header).len() != header.len()
        || header != format!("{}menu:", " ".repeat(indent))
    {
        return None;
    }
    let (project, authoring, _) = loaded?;
    let mut next = index + 1;
    let mut options = Vec::new();
    let mut menu_end = end;
    while next + 1 < lines.len() {
        let (option_start, _, option) = lines[next];
        let (jump_start, jump_end, jump) = lines[next + 1];
        if indentation(option) != indent + 4
            || indentation(jump) != indent + 8
            || !lexical.contains(&option_start)
            || !lexical.contains(&jump_start)
        {
            break;
        }
        let (text, expression) = option_text(option)?;
        if without_comment(jump).len() != jump.len() {
            return None;
        }
        let label = jump.trim().strip_prefix("jump ")?.trim();
        if !identifier(label) {
            return None;
        }
        let _destination = project.scenes.iter().find(|s| s.technical_label == label)?;
        options.push(ChoiceOption {
            text,
            id: None,
            condition: expression.map(|source| crate::conditions::parse(source, authoring)),
        });
        menu_end = jump_end;
        next += 2;
    }
    if options.iter().all(|o| o.condition.is_none()) {
        for (ordinal, option) in options.iter().enumerate() {
            let caption = format!(
                "{}\"{}\":",
                " ".repeat(indent + 4),
                escape_string(&option.text).ok()?
            );
            let label = project
                .scenes
                .iter()
                .find(|s| {
                    s.technical_label
                        == lines[index + 2 + ordinal * 2]
                            .2
                            .trim()
                            .strip_prefix("jump ")
                            .unwrap_or("")
                })?
                .technical_label
                .as_str();
            if lines[index + 1 + ordinal * 2].2 != caption
                || lines[index + 2 + ordinal * 2].2
                    != format!("{}jump {label}", " ".repeat(indent + 8))
            {
                return None;
            }
        }
    }
    if options.is_empty()
        || next < lines.len()
            && !lines[next].2.trim().is_empty()
            && indentation(lines[next].2) > indent
    {
        return None;
    }
    Some((
        next,
        ParsedBeat {
            start,
            end: menu_end,
            nesting: None,
            payload: BeatPayload::Choice { options },
        },
    ))
}
pub(super) fn validate_conditional_completion(
    bytes: &[u8],
    scene: &SceneMetadata,
    loaded: &Loaded,
) -> Result<(), SceneError> {
    let (_, _, parsed) = parse_scene(
        scene,
        bytes,
        Some((
            &loaded.project,
            &loaded.authoring,
            &loaded.source_map.owned_screens,
        )),
    )?;
    if !parsed.iter().any(|b| {
        matches!(&b.payload, BeatPayload::Call { .. })
            || matches!(&b.payload, BeatPayload::Choice { .. })
    }) {
        return Ok(());
    }
    let roots: Vec<_> = parsed.iter().filter(|b| b.nesting.is_none() && !matches!(&b.payload, BeatPayload::CustomCode { source, .. } if source.trim().is_empty() || source.trim_start().starts_with('#'))).collect();
    if roots
        .last()
        .is_none_or(|b| {
            if let BeatPayload::Choice { options } = &b.payload {
                if options.iter().all(|o|o.condition.is_some()) { return true; }
                return options.iter().any(|o| {
                    let start=o.id.as_ref().and_then(|id|id.parse::<usize>().ok());
                    !parsed.iter().any(|b|matches!(b.nesting,Some(ParsedNesting::Child { branch_start,.. }) if Some(branch_start)==start) && is_terminal_payload(&b.payload))
                });
            }
            !is_terminal_payload(&b.payload)
        })
    {
        return Err(SceneError::InvariantBlocked);
    }
    Ok(())
}

/// Called only after the entire old projection has passed its versioned byte/hash
/// verification. Retained records are extensions, never live patch authority.
pub(super) fn refine_legacy_ids(
    old: &mut SceneSourceMapping,
    parsed: &[ParsedBeat],
    bytes: &[u8],
) -> Result<Vec<ForcedBeatId>, SceneError> {
    let mut forced = Vec::new();
    let mut covered = HashSet::new();
    for parsed in parsed {
        let hash = sha256(&bytes[parsed.start..parsed.end]);
        if let Some(mapped) = old.beats.iter().find(|m| {
            m.byte_start as usize == parsed.start
                && m.byte_end as usize == parsed.end
                && m.source_sha256 == hash
        }) {
            covered.insert(mapped.id.clone());
            forced.push((
                parsed.payload.kind().into(),
                hash,
                mapped.id.clone(),
                Some(parsed.start),
            ));
            continue;
        }
        // v9 splits a verified legacy whole-menu mapping into disjoint records.
        if matches!(parsed.payload, BeatPayload::Choice { .. }) {
            if let Some(whole) = old.beats.iter().find(|m| {
                m.kind == "choice"
                    && m.byte_start as usize == parsed.start
                    && m.byte_end as usize > parsed.end
            }) {
                covered.insert(whole.id.clone());
                forced.push(("choice".into(), hash, whole.id.clone(), Some(parsed.start)));
                continue;
            }
        }
        if !matches!(parsed.payload, BeatPayload::Choice { .. }) {
            continue;
        }
        let rows: Vec<_> = old
            .beats
            .iter()
            .filter(|m| m.byte_start as usize >= parsed.start && m.byte_end as usize <= parsed.end)
            .cloned()
            .collect();
        let Some(first) = rows.first() else {
            return Err(SceneError::InvalidMetadata);
        };
        if first.byte_start as usize != parsed.start
            || rows
                .last()
                .is_none_or(|m| m.byte_end as usize != parsed.end)
            || rows
                .windows(2)
                .any(|pair| pair[0].byte_end != pair[1].byte_start)
            || !matches!(first.kind.as_str(), "customCode" | "choice")
            || rows.iter().skip(1).any(|row| {
                row.kind != "customCode"
                    || row.conditional_branch.is_some()
                    || row.owner != first.owner
            })
            || !std::str::from_utf8(&bytes[first.byte_start as usize..first.byte_end as usize])
                .map_err(|_| SceneError::UnsupportedSource)?
                .trim_start()
                .starts_with("menu:")
        {
            return Err(SceneError::InvalidMetadata);
        }
        let header = old
            .beats
            .iter_mut()
            .find(|m| m.id == first.id)
            .ok_or(SceneError::InvalidMetadata)?;
        if rows.len() > 1 {
            if header.extra.contains_key("refinedChildMappings") {
                return Err(SceneError::InvalidMetadata);
            }
            header.extra.insert(
                "refinedChildMappings".into(),
                serde_json::to_value(&rows[1..]).map_err(|_| SceneError::InvalidMetadata)?,
            );
        }
        covered.extend(rows.iter().map(|row| row.id.clone()));
        forced.push((
            parsed.payload.kind().into(),
            hash,
            first.id.clone(),
            Some(parsed.start),
        ));
    }
    if old.beats.iter().any(|row| !covered.contains(&row.id)) {
        return Err(SceneError::InvalidMetadata);
    }
    Ok(forced)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lifecycle::{acceptance::ipc, LifecycleService};
    use serde_json::json;
    use std::fs;
    pub(super) struct Fixture {
        _tmp: tempfile::TempDir,
        pub(super) root: std::path::PathBuf,
        pub(super) service: LifecycleService,
    }
    impl Fixture {
        pub(super) fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            let profile = tmp.path().join("profile");
            let mut service =
                LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
            let root = profile.join("synthetic-project");
            service.open_path(&root).unwrap();
            Self {
                _tmp: tmp,
                root,
                service,
            }
        }
        pub(super) fn model(&mut self) -> Value {
            ipc(&mut self.service, "scene.list", json!({}))
        }
        pub(super) fn command(&mut self, command: Value) -> Value {
            let w = self.model();
            ipc(
                &mut self.service,
                "scene.apply",
                json!({"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":command}),
            )
        }
        pub(super) fn scene(&mut self, name: &str) -> Value {
            let w = self.model();
            let result = self.command(
                json!({"type":"createScene","chapterId":w["chapters"][0]["id"],"displayName":name}),
            );
            result["scenes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|s| s["displayName"] == name)
                .unwrap()
                .clone()
        }
        pub(super) fn save(&mut self, scene: &Value, source: &str) {
            let opened = ipc(
                &mut self.service,
                "source.open",
                json!({"path":scene["sourcePath"]}),
            );
            let draft = ipc(
                &mut self.service,
                "source.updateDraft",
                json!({"path":scene["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
            );
            ipc(
                &mut self.service,
                "source.save",
                json!({"path":scene["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
            );
        }
        pub(super) fn reject(&mut self, command: Value) -> Value {
            let w = self.model();
            let mut paths = w["scenes"]
                .as_array()
                .unwrap()
                .iter()
                .map(|scene| self.root.join(scene["sourcePath"].as_str().unwrap()))
                .collect::<Vec<_>>();
            paths.push(self.root.join(".renpy-editor/source-map.json"));
            paths.push(self.root.join(".renpy-editor/project.json"));
            let before: Vec<_> = paths.iter().map(|p| fs::read(p).unwrap()).collect();
            let response = crate::handle_application_request(
                json!({"protocolVersion":1,"requestId":"phase3a-reject","operation":"scene.apply","payload":{"sessionId":self.service.current().unwrap().session_id,"expectedProjectRevision":w["projectRevision"],"expectedSourceMapRevision":w["sourceMapRevision"],"command":command}}),
                false,
                &mut self.service,
            );
            let response = serde_json::to_value(response).unwrap();
            assert_eq!(response["ok"], false);
            assert_eq!(
                paths
                    .iter()
                    .map(|p| fs::read(p).unwrap())
                    .collect::<Vec<_>>(),
                before
            );
            response
        }
    }
    #[test]
    fn phase3a_calls_generate_distinct_labels_minimal_target_edit_and_history() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let c = f.scene("C");
        let root_scene = f.model()["scenes"][0].clone();
        let root_label = root_scene["technicalLabel"].as_str().unwrap();
        let b_label = b["technicalLabel"].as_str().unwrap();
        let c_label = c["technicalLabel"].as_str().unwrap();
        let source = format!("label {root_label}:\r\n    call   {b_label}  from retained_return # café 雪\r\n    \"Resume\"\r\n    return\n");
        f.save(&root_scene, &source);
        let w = f.model();
        let scene = &w["scenes"][0];
        let call = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "call")
            .unwrap();
        let after = f.command(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":call["id"],"beat":{"type":"call","sceneId":c["id"],"returnLabel":null}}));
        let changed = fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap();
        assert_eq!(
            changed,
            [
                b"\xef\xbb\xbf".as_slice(),
                source.replace(b_label, c_label).as_bytes()
            ]
            .concat()
        );
        assert_eq!(after["scenes"][0]["beats"][0]["id"], call["id"]);
        assert_eq!(
            after["scenes"][0]["beats"][0]["payload"]["returnLabel"],
            "retained_return"
        );
        f.reject(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":after["scenes"][0]["sourceRevision"],"beatId":call["id"],"beat":{"type":"call","sceneId":b["id"],"returnLabel":"invented_return"}}));
        f.command(json!({"type":"undo"}));
        assert_eq!(
            fs::read(f.root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), source.as_bytes()].concat()
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        let terminal = scene["beats"].as_array().unwrap().last().unwrap();
        f.command(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":terminal["id"],"beat":{"type":"call","sceneId":b["id"],"returnLabel":null}}));
        let w = f.model();
        let scene = &w["scenes"][0];
        let terminal = scene["beats"].as_array().unwrap().last().unwrap();
        f.command(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":terminal["id"],"beat":{"type":"call","sceneId":b["id"]}}));
        let w = f.model();
        let labels: Vec<_> = w["scenes"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["payload"]["type"] == "call")
            .map(|b| b["payload"]["returnLabel"].as_str().unwrap().to_owned())
            .collect();
        assert_eq!(labels.len(), 3);
        assert_eq!(labels.iter().collect::<HashSet<_>>().len(), 3);
        assert!(labels[1..]
            .iter()
            .all(|s| s.starts_with("_ll_call_") && identifier(s)));
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        let reopened = f.model();
        assert_eq!(reopened["scenes"][0]["beats"], w["scenes"][0]["beats"]);
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_guarded_menu_requires_explicit_root_ending() {
        let mut f = Fixture::new();
        let _target = f.scene("Target");
        let scene = f.model()["scenes"][0].clone();
        f.save(
            &scene,
            &format!(
                "label {}:\n    return\n",
                scene["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        let guard = json!({"status":"supported","expression":{"type":"bool","value":false}});
        let inserted = f.command(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"choice","options":[{"text":"Unavailable","condition":guard}]}}));
        let beats = inserted["scenes"][0]["beats"].as_array().unwrap();
        assert_eq!(beats[0]["payload"]["type"], "choice");
        assert_eq!(beats[0]["payload"]["options"][0]["condition"], guard);
        assert_eq!(beats.last().unwrap()["payload"]["type"], "return");
        f.reject(json!({"type":"removeBeat","sceneId":scene["id"],"expectedSourceRevision":inserted["scenes"][0]["sourceRevision"],"beatId":beats.last().unwrap()["id"]}));
        f.command(json!({"type":"undo"}));
        let w = f.model();
        let scene = &w["scenes"][0];
        let terminal = f.command(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"choice","options":[{"text":"End"}]}}));
        let choice = &terminal["scenes"][0]["beats"][0];
        f.command(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":terminal["scenes"][0]["sourceRevision"],"beatId":choice["id"],"beat":{"type":"choice","options":[{"text":"Unavailable","condition":guard}]}}));
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_v3_v4_call_menu_refinement_preserves_records_and_reopen() {
        for version in [3, 4, 8] {
            let mut f = Fixture::new();
            let target = f.scene("Target");
            let scene = f.model()["scenes"][0].clone();
            f.save(&scene, &format!("label {}:\n    call {} from legacy_return # keep\n    menu:\n        \"Always\":\n            jump {}\n        \"Guarded\" if flag:\n            jump {}\n    return\n", scene["technicalLabel"].as_str().unwrap(), target["technicalLabel"].as_str().unwrap(), target["technicalLabel"].as_str().unwrap(), target["technicalLabel"].as_str().unwrap()));
            f.service.close().unwrap();
            let path = f.root.join(scene["sourcePath"].as_str().unwrap());
            let bytes = fs::read(&path).unwrap();
            let project_metadata = crate::metadata::ProjectMetadata::read_bytes(
                &fs::read(f.root.join(PROJECT_PATH)).unwrap(),
                None,
            )
            .unwrap();
            let authoring: AuthoringMetadata = serde_json::from_slice(
                &fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
            )
            .unwrap();
            let (label_start, label_end, parsed) = parse_scene_mode(
                &project_metadata.scenes[0],
                &bytes,
                Some((&project_metadata, &authoring, &[])),
                version,
            )
            .unwrap();
            let map_path = f.root.join(SOURCE_MAP_PATH);
            let mut map = SourceMapMetadata::read_bytes(
                &fs::read(&map_path).unwrap(),
                &project_metadata.project_id,
            )
            .unwrap();
            map.schema_version = version;
            map.scene_mappings[0].label_start = label_start as u64;
            map.scene_mappings[0].label_end = label_end as u64;
            map.scene_mappings[0].beats = parsed
                .iter()
                .map(|parsed| BeatSourceMapping {
                    screen_target: None,
                    id: uuid::Uuid::new_v4().to_string(),
                    kind: parsed.payload.kind().into(),
                    byte_start: parsed.start as u64,
                    byte_end: parsed.end as u64,
                    source_sha256: sha256(&bytes[parsed.start..parsed.end]),
                    owner: None,
                    conditional_branch: None,
                    extra: Map::from_iter([("futureRecord".into(), json!(parsed.start))]),
                })
                .collect();
            let old = map.scene_mappings[0].beats.clone();
            map.validate(&project_metadata.project_id).unwrap();
            fs::write(&map_path, source_map_bytes(&map).unwrap()).unwrap();
            f.service.open_path(&f.root).unwrap();
            f.service.close().unwrap();
            let new = SourceMapMetadata::read_bytes(
                &fs::read(&map_path).unwrap(),
                &project_metadata.project_id,
            )
            .unwrap();
            assert_eq!(new.schema_version, SOURCE_MAP_SCHEMA_VERSION);
            assert_eq!(fs::read(&path).unwrap(), bytes);
            let call = new.scene_mappings[0]
                .beats
                .iter()
                .find(|b| b.kind == "call")
                .unwrap();
            assert_eq!(call.id, old[0].id);
            assert_eq!(call.extra, old[0].extra);
            let menu = new.scene_mappings[0]
                .beats
                .iter()
                .find(|b| b.kind == "choice")
                .unwrap();
            assert_eq!(menu.id, old[1].id);
            assert_eq!(menu.extra["futureRecord"], old[1].extra["futureRecord"]);
            for old_child in &old[2..old.len() - 1] {
                let retained = new.scene_mappings[0]
                    .beats
                    .iter()
                    .find(|b| b.id == old_child.id)
                    .unwrap();
                assert_eq!(retained.extra, old_child.extra);
            }
            let before_map = fs::read(&map_path).unwrap();
            f.service.open_path(&f.root).unwrap();
            f.service.close().unwrap();
            assert_eq!(fs::read(&map_path).unwrap(), before_map);
        }
    }
}

pub(super) fn group_may_continue(group_id: &str, beats: &[SceneBeat], depth: usize) -> bool {
    if depth >= MAX_CONDITION_NESTING {
        return true;
    }
    let headers: Vec<_> = beats
        .iter()
        .filter(|b| {
            b.conditional_branch
                .as_ref()
                .is_some_and(|g| g.group_id == group_id)
        })
        .collect();
    if !headers
        .iter()
        .any(|h| h.conditional_branch.as_ref().is_some_and(|g| g.otherwise))
    {
        return true;
    }
    headers.iter().any(|header| {
        let owner = crate::metadata::BeatOwner { group_id: group_id.into(), branch_id: header.id.clone() };
        for beat in beats.iter().filter(|b|b.owner.as_ref()==Some(&owner)) {
            if let Some(branch)=&beat.conditional_branch {
                if branch.ordinal==0 && !group_may_continue(&branch.group_id,beats,depth+1) { return false; }
                continue;
            }
            if matches!(&beat.payload,BeatPayload::CustomCode { source,.. } if source.trim() == "pass") { continue; }
            if matches!(&beat.payload,BeatPayload::CustomCode { source,.. } if !source.trim().is_empty() && !source.trim_start().starts_with('#')) { return true; }
            if is_terminal_payload(&beat.payload) { return false; }
        }
        true
    })
}

#[cfg(test)]
mod flow_tests {
    use super::tests::Fixture;
    use super::*;
    use serde_json::json;
    use std::fs;
    #[test]
    fn phase3a_guarded_calls_and_menu_flow_keep_exact_continuations() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let c = f.scene("C");
        let a = f.model()["scenes"][0].clone();
        f.save(
            &b,
            &format!(
                "label {}:\n    call {} from b_c\n    \"B resumed\"\n    return\n",
                b["technicalLabel"].as_str().unwrap(),
                c["technicalLabel"].as_str().unwrap()
            ),
        );
        f.save(&a,&format!("label {}:\n    if flag:\n        if flag == True:\n            call {} from a_b\n            bec \"A resumed\"\n        else:\n            return\n    else:\n        return\n    menu:\n        \"Guarded\" if flag:\n            jump {}\n    \"No choice continuation\"\n    return\n",a["technicalLabel"].as_str().unwrap(),b["technicalLabel"].as_str().unwrap(),c["technicalLabel"].as_str().unwrap()));
        let w = f.model();
        let scene = &w["scenes"][0];
        let resumed = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == "A resumed")
            .unwrap();
        let flow = crate::lifecycle::acceptance::ipc(&mut f.service, "flow.list", json!({}));
        let call = flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .find(|e| e["sceneId"] == a["id"] && e["kind"] == "call")
            .unwrap();
        assert_eq!(call["destination"]["sceneId"], b["id"]);
        assert_eq!(call["returnLabel"], "a_b");
        assert_eq!(call["guardPath"].as_array().unwrap().len(), 2);
        assert_eq!(call["continuation"]["beatId"], resumed["id"]);
        assert_eq!(call["continuation"]["owner"], resumed["owner"]);
        assert_eq!(
            call["continuation"]["location"]["byteStart"],
            resumed["byteStart"]
        );
        let menu = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "choice")
            .unwrap();
        let choice = flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .find(|e| e["beatId"] == menu["id"] && e["kind"] == "choice")
            .unwrap();
        assert_eq!(choice["condition"]["status"], "supported");
        assert_eq!(choice["editable"], false);
        let continuation = flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .find(|e| e["beatId"] == menu["id"] && e["kind"] == "continuation")
            .unwrap();
        let next = scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == "No choice continuation")
            .unwrap();
        assert_eq!(continuation["destination"]["kind"], "body");
        assert_eq!(continuation["destination"]["beatId"], next["id"]);
        assert_eq!(flow["partial"], false);
        f.save(
            &a,
            &format!(
                "label {}:\n    if flag:\n        return\n    else:\n        return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let flow = crate::lifecycle::acceptance::ipc(&mut f.service, "flow.list", json!({}));
        assert!(!flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["sceneId"] == a["id"] && e["kind"] == "continuation"));
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_authored_recursive_calls_refuse_and_source_cycles_remain_unknown() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let a = f.model()["scenes"][0].clone();
        f.save(
            &a,
            &format!(
                "label {}:\n    return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        assert_eq!(f.reject(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"call","sceneId":a["id"]}}))["error"]["code"], "UNSUPPORTED_CALL_ROUTE");
        f.save(
            &b,
            &format!(
                "label {}:\n    call {} from b_a\n    return\n",
                b["technicalLabel"].as_str().unwrap(),
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        assert_eq!(f.reject(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"call","sceneId":b["id"]}}))["error"]["code"], "UNSUPPORTED_CALL_ROUTE");
        f.save(
            &b,
            &format!(
                "label {}:\n    jump {}\n",
                b["technicalLabel"].as_str().unwrap(),
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        assert_eq!(f.reject(json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beforeBeatId":null,"beat":{"type":"call","sceneId":b["id"]}}))["error"]["code"], "UNSUPPORTED_CALL_ROUTE");
        f.save(
            &a,
            &format!(
                "label {}:\n    call {} from a_b\n    return\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        let path = f.root.join(a["sourcePath"].as_str().unwrap());
        let source = fs::read(&path).unwrap();
        let flow = crate::lifecycle::acceptance::ipc(&mut f.service, "flow.list", json!({}));
        assert_eq!(flow["partial"], true);
        assert!(flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["kind"] == "unknown" && e["text"].as_str().unwrap().contains("recursion")));
        assert_eq!(fs::read(&path).unwrap(), source);
        f.service.close().unwrap();
        let mut adjacency = HashMap::new();
        for index in 0..16 {
            adjacency.insert(format!("s{index}"), vec![(format!("s{}", index + 1), true)]);
        }
        assert!(!call_route_is_unsupported(&adjacency, "s0", "s1"));
        adjacency.insert("s16".into(), vec![("s17".into(), true)]);
        assert!(call_route_is_unsupported(&adjacency, "s0", "s1"));
    }
}

#[cfg(test)]
mod boundary_tests {
    use super::tests::Fixture;
    use super::*;
    use crate::lifecycle::acceptance::ipc;
    use serde_json::json;
    use std::fs;
    #[test]
    fn phase3a_guarded_menu_field_edits_preserve_exact_formatting() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let _c = f.scene("C");
        let a = f.model()["scenes"][0].clone();
        let source=format!("label {}:\r\n    menu:\r\n        \"Old café\"   if    flag  :  \r\n            jump   {}   \r\n    return\r\n",a["technicalLabel"].as_str().unwrap(),b["technicalLabel"].as_str().unwrap());
        f.save(&a, &source);
        let w = f.model();
        let scene = &w["scenes"][0];
        let choice = &scene["beats"][0];
        let mut options = choice["payload"]["options"].clone();
        options[0]["text"] = json!("New café");

        let changed=f.command(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":choice["id"],"beat":{"type":"choice","options":options}}));
        let expected = source.replace("Old café", "New café");
        let path = f.root.join(a["sourcePath"].as_str().unwrap());
        assert_eq!(
            fs::read(&path).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), expected.as_bytes()].concat()
        );
        let choice = &changed["scenes"][0]["beats"][0];
        let mut options = choice["payload"]["options"].clone();
        options[0]["condition"] =
            json!({"status":"supported","expression":{"type":"bool","value":true}});
        f.command(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":changed["scenes"][0]["sourceRevision"],"beatId":choice["id"],"beat":{"type":"choice","options":options}}));
        assert_eq!(
            fs::read(&path).unwrap(),
            [
                b"\xef\xbb\xbf".as_slice(),
                expected.replace("flag", "True").as_bytes()
            ]
            .concat()
        );
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_source_eof_continuation_and_duplicate_labels_are_unknown() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let c = f.scene("C");
        let a = f.model()["scenes"][0].clone();
        for source in [
            format!(
                "label {}:\n    call {} from eof_return\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
            format!(
                "label {}:\n    menu:\n        \"Maybe\" if flag:\n            jump {}\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        ] {
            f.save(&a, &source);
            let before = fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
            let flow = ipc(&mut f.service, "flow.list", json!({}));
            assert_eq!(flow["partial"], true);
            assert!(flow["edges"]
                .as_array()
                .unwrap()
                .iter()
                .any(|e| e["kind"] == "unknown"
                    && e["text"].as_str().unwrap().contains("Continuation outside")));
            assert_eq!(
                fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
                before
            );
        }
        f.save(
            &a,
            &format!(
                "label {}:\n    call {} from duplicated\n    call {} from duplicated\n    return\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let scene = &w["scenes"][0];
        let flow = ipc(&mut f.service, "flow.list", json!({}));
        assert_eq!(flow["partial"], true);
        assert!(flow["edges"].as_array().unwrap().iter().any(
            |e| e["kind"] == "unknown" && e["text"].as_str().unwrap().contains("Return label")
        ));
        assert_eq!(f.reject(json!({"type":"updateBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],"beatId":scene["beats"][0]["id"],"beat":{"type":"call","sceneId":c["id"]}}))["error"]["code"],"AMBIGUOUS_RETURN_LABEL");
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_refinement_preserves_unowned_comments_and_unknown_metadata() {
        for problem in ["split", "collision"] {
            let mut f = Fixture::new();
            let b = f.scene("B");
            let a = f.model()["scenes"][0].clone();
            let comment = if problem == "split" {
                "        # keep inter-option comment\n"
            } else {
                ""
            };
            f.save(&a,&format!("label {}:\n    menu:\n        \"Always\":\n            jump {}\n{comment}        \"Guarded\" if flag:\n            jump {}\n    return\n",a["technicalLabel"].as_str().unwrap(),b["technicalLabel"].as_str().unwrap(),b["technicalLabel"].as_str().unwrap()));
            f.service.close().unwrap();
            let path = f.root.join(a["sourcePath"].as_str().unwrap());
            let source = fs::read(&path).unwrap();
            let project_metadata = crate::metadata::ProjectMetadata::read_bytes(
                &fs::read(f.root.join(PROJECT_PATH)).unwrap(),
                None,
            )
            .unwrap();
            let authoring: AuthoringMetadata = serde_json::from_slice(
                &fs::read(f.root.join(".renpy-editor/authoring.json")).unwrap(),
            )
            .unwrap();
            let (_, _, parsed) = parse_scene_mode(
                &project_metadata.scenes[0],
                &source,
                Some((&project_metadata, &authoring, &[])),
                4,
            )
            .unwrap();
            let map_path = f.root.join(SOURCE_MAP_PATH);
            let mut map = SourceMapMetadata::read_bytes(
                &fs::read(&map_path).unwrap(),
                &project_metadata.project_id,
            )
            .unwrap();
            map.schema_version = 4;
            map.scene_mappings[0].beats = parsed
                .iter()
                .map(|p| BeatSourceMapping {
                    screen_target: None,
                    id: uuid::Uuid::new_v4().to_string(),
                    kind: p.payload.kind().into(),
                    byte_start: p.start as u64,
                    byte_end: p.end as u64,
                    source_sha256: sha256(&source[p.start..p.end]),
                    owner: None,
                    conditional_branch: None,
                    extra: Map::from_iter([("mustKeep".into(), json!(p.start))]),
                })
                .collect();
            if problem == "collision" {
                map.scene_mappings[0].beats[0].extra.insert(
                    "refinedChildMappings".into(),
                    json!({"futureOwner":"preserve"}),
                );
            }
            fs::write(&map_path, source_map_bytes(&map).unwrap()).unwrap();
            if problem == "split" {
                let before = fs::read(&map_path).unwrap();
                assert!(f.service.open_path(&f.root).is_err());
                assert_eq!(fs::read(&map_path).unwrap(), before);
                assert_eq!(fs::read(&path).unwrap(), source);
                continue;
            }
            f.service.open_path(&f.root).unwrap();
            assert_eq!(fs::read(&path).unwrap(), source);
            let migrated = SourceMapMetadata::read_bytes(
                &fs::read(&map_path).unwrap(),
                &project_metadata.project_id,
            )
            .unwrap();
            for before in &map.scene_mappings[0].beats {
                let after = migrated.scene_mappings[0]
                    .beats
                    .iter()
                    .find(|b| b.id == before.id)
                    .unwrap();
                assert_eq!(after.extra, before.extra);
            }
            f.service.close().unwrap();
        }
    }
}

#[cfg(test)]
mod body_tests {
    use super::tests::Fixture;
    use super::*;
    use serde_json::json;
    use std::fs;
    fn root(f: &mut Fixture) -> Value {
        f.model()["scenes"][0].clone()
    }
    fn beat(scene: &Value, text: &str) -> Value {
        scene["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == text)
            .unwrap()
            .clone()
    }
    fn body(beat: &Value) -> Value {
        json!({"type":"branch","groupId":beat["owner"]["groupId"],"branchId":beat["owner"]["branchId"]})
    }
    fn command(scene: &Value, fields: Value) -> Value {
        let mut fields = fields.as_object().unwrap().clone();
        fields.insert("sceneId".into(), scene["id"].clone());
        fields.insert(
            "expectedSourceRevision".into(),
            scene["sourceRevision"].clone(),
        );
        Value::Object(fields)
    }
    #[test]
    fn phase3a_body_nested_minimal_bytes_ids_extras_history_reopen() {
        let mut f = Fixture::new();
        let a = root(&mut f);
        let source = format!("label {}:\r\n    if flag:\r\n        if flag:\r\n            \"Deep café 雪\" # retain\r\n        else:\r\n            \"Other\"\r\n    elif not flag:\r\n        \"Else If\" # keep\r\n    else:\r\n        \"Otherwise\"\r\n    # parent trivia\r\n    return\r\n", a["technicalLabel"].as_str().unwrap());
        f.save(&a, &source);
        let a = root(&mut f);
        let deep = beat(&a, "Deep café 雪");
        let map_path = f.root.join(".renpy-editor/source-map.json");
        let mut map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        map["sceneMappings"][0]["beats"]
            .as_array_mut()
            .unwrap()
            .iter_mut()
            .find(|b| b["id"] == deep["id"])
            .unwrap()["retainedExtra"] = json!({"note":"owned"});
        fs::write(&map_path, serde_json::to_vec_pretty(&map).unwrap()).unwrap();
        let a = root(&mut f);
        let original = fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        f.command(command(&a, json!({"type":"updateBodyBeat","beatId":deep["id"],"expectedBody":body(&deep),"beat":{"type":"narration","text":"Changed 雪"}})));
        let a = root(&mut f);
        let expected = [
            b"\xef\xbb\xbf".as_slice(),
            source.replace("Deep café 雪", "Changed 雪").as_bytes(),
        ]
        .concat();
        assert_eq!(
            fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            expected
        );
        assert_eq!(beat(&a, "Changed 雪")["id"], deep["id"]);
        let deep = beat(&a, "Changed 雪");
        f.command(command(&a, json!({"type":"insertBodyBeat","body":body(&deep),"position":{"type":"before","anchor":{"type":"beat","beatId":deep["id"]}},"beat":{"type":"narration","text":"Inserted"}})));
        let after = root(&mut f);
        assert_eq!(beat(&after, "Inserted")["owner"], deep["owner"]);
        let map: Value = serde_json::from_slice(&fs::read(&map_path).unwrap()).unwrap();
        assert_eq!(
            map["sceneMappings"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["id"] == deep["id"])
                .unwrap()["retainedExtra"],
            json!({"note":"owned"})
        );
        let else_if = beat(&after, "Else If");
        f.command(command(&after, json!({"type":"insertBodyBeat","body":body(&else_if),"position":{"type":"end"},"beat":{"type":"narration","text":"Else continuation"}})));
        let final_scene = root(&mut f);
        assert_eq!(
            beat(&final_scene, "Else continuation")["owner"],
            else_if["owner"]
        );
        let final_bytes = fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        assert_eq!(
            final_bytes,
            [
                b"\xef\xbb\xbf".as_slice(),
                source
                    .replace("Deep café 雪", "Changed 雪")
                    .replace(
                        "            \"Changed",
                        "            \"Inserted\"\r\n            \"Changed"
                    )
                    .replace(
                        "        \"Else If\" # keep\r\n",
                        "        \"Else If\" # keep\r\n        \"Else continuation\"\r\n"
                    )
                    .as_bytes()
            ]
            .concat()
        );
        for _ in 0..3 {
            f.command(json!({"type":"undo"}));
        }
        assert_eq!(
            fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            original
        );
        for _ in 0..3 {
            f.command(json!({"type":"redo"}));
        }
        assert_eq!(
            fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            final_bytes
        );
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        assert_eq!(root(&mut f)["beats"], final_scene["beats"]);
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_body_owner_header_anchor_and_terminal_refusals_write_nothing() {
        let mut f = Fixture::new();
        let a = root(&mut f);
        f.save(&a, &format!("label {}:\n    if flag:\n        \"If child\"\n    else:\n        \"Else child\"\n    return\n", a["technicalLabel"].as_str().unwrap()));
        let a = root(&mut f);
        let child = beat(&a, "If child");
        let other = beat(&a, "Else child");
        let header = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| !b["conditionalBranch"].is_null())
            .unwrap();
        for fields in [
            json!({"type":"updateBodyBeat","beatId":child["id"],"expectedBody":{"type":"root"},"beat":{"type":"narration","text":"lost"}}),
            json!({"type":"updateBodyBeat","beatId":child["id"],"expectedBody":body(&other),"beat":{"type":"narration","text":"lost"}}),
            json!({"type":"updateBodyBeat","beatId":header["id"],"expectedBody":{"type":"root"},"beat":{"type":"narration","text":"lost"}}),
            json!({"type":"insertBodyBeat","body":body(&child),"position":{"type":"before","anchor":{"type":"beat","beatId":other["id"]}},"beat":{"type":"narration","text":"lost"}}),
            json!({"type":"insertBodyBeat","body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":header["id"]}},"beat":{"type":"narration","text":"lost"}}),
            json!({"type":"insertBodyBeat","body":{"type":"root"},"position":{"type":"end"},"beat":{"type":"narration","text":"lost"}}),
        ] {
            assert_eq!(
                f.reject(command(&a, fields))["error"]["code"],
                "SCENE_INVARIANT"
            );
        }
        // Whole group is an explicit root sibling anchor.
        f.command(command(&a, json!({"type":"insertBodyBeat","body":{"type":"root"},"position":{"type":"before","anchor":{"type":"condition","groupId":header["conditionalBranch"]["groupId"]}},"beat":{"type":"narration","text":"Before group"}})));
        let updated = root(&mut f);
        let mut stale = command(
            &updated,
            json!({"type":"updateBodyBeat","beatId":child["id"],"expectedBody":body(&child),"beat":{"type":"narration","text":"lost"}}),
        );
        stale["expectedSourceRevision"] = a["sourceRevision"].clone();
        assert_eq!(f.reject(stale)["error"]["code"], "SOURCE_CONFLICT");
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_body_eof_separator_preserves_previous_child_identity() {
        let mut f = Fixture::new();
        let a = root(&mut f);
        f.save(
            &a,
            &format!(
                "label {}:\n    if flag:\n        \"EOF\"",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let a = root(&mut f);
        let old = beat(&a, "EOF");
        f.command(command(&a, json!({"type":"insertBodyBeat","body":body(&old),"position":{"type":"end"},"beat":{"type":"narration","text":"Next"}})));
        let after = root(&mut f);
        assert_eq!(beat(&after, "EOF")["id"], old["id"]);
        assert_eq!(beat(&after, "Next")["owner"], old["owner"]);
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_body_calls_and_guarded_choices_preserve_labels_and_neighbors() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let c = f.scene("C");
        let a = root(&mut f);
        f.save(&a, &format!("label {}:\n    if flag:\n        call  {}  from retained_nested # keep\n        menu:\n            \"A\" if flag:\n                jump {}\n            \"B\" if not flag:\n                jump {}\n    return\n", a["technicalLabel"].as_str().unwrap(), b["technicalLabel"].as_str().unwrap(), b["technicalLabel"].as_str().unwrap(), c["technicalLabel"].as_str().unwrap()));
        let a = root(&mut f);
        let call = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "call")
            .unwrap()
            .clone();
        f.command(command(&a, json!({"type":"updateBodyBeat","beatId":call["id"],"expectedBody":body(&call),"beat":{"type":"call","sceneId":c["id"]}})));
        let a = root(&mut f);
        let choice = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "choice")
            .unwrap()
            .clone();
        let before = fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        let mut options = choice["payload"]["options"].clone();
        options[0]["text"] = json!("Renamed");
        f.command(command(&a, json!({"type":"updateBodyBeat","beatId":choice["id"],"expectedBody":body(&choice),"beat":{"type":"choice","options":options}})));
        let after = root(&mut f);
        assert_eq!(
            fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            String::from_utf8(before)
                .unwrap()
                .replace("\"A\"", "\"Renamed\"")
                .as_bytes()
        );
        assert_eq!(
            after["beats"]
                .as_array()
                .unwrap()
                .iter()
                .find(|b| b["id"] == call["id"])
                .unwrap()["payload"]["returnLabel"],
            "retained_nested"
        );
        let mut unknown = options.clone();
        unknown[0]["condition"] =
            json!({"status":"unknown","source":"python()","diagnostic":"unsupportedSyntax"});
        assert_eq!(f.reject(command(&after, json!({"type":"updateBodyBeat","beatId":choice["id"],"expectedBody":body(&choice),"beat":{"type":"choice","options":unknown}})))["error"]["code"], "OPAQUE_BOUNDARY");
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_body_candidate_transfers_close_jump_choice_gaps_allow_pure_jump_loops() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let c = f.scene("C");
        let a = root(&mut f);
        f.save(
            &a,
            &format!(
                "label {}:\n    call {} from a_b\n    return\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap()
            .clone();
        let last = bs["beats"].as_array().unwrap().last().unwrap();
        for fields in [
            json!({"type":"updateBeat","beatId":last["id"],"beat":{"type":"jump","sceneId":a["id"]}}),
            json!({"type":"updateBodyBeat","beatId":last["id"],"expectedBody":{"type":"root"},"beat":{"type":"jump","sceneId":a["id"]}}),
        ] {
            assert_eq!(
                f.reject(command(&bs, fields))["error"]["code"],
                "UNSUPPORTED_CALL_ROUTE"
            );
        }
        f.save(
            &b,
            &format!(
                "label {}:\n    if flag:\n        \"Child\"\n    return\n",
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap()
            .clone();
        let child = beat(&bs, "Child");
        assert_eq!(f.reject(command(&bs, json!({"type":"insertBodyBeat","body":body(&child),"position":{"type":"end"},"beat":{"type":"jump","sceneId":a["id"]}})))["error"]["code"], "UNSUPPORTED_CALL_ROUTE");
        // Replace an unsafe old edge with the safe candidate; stale adjacency must not reject.
        f.save(
            &b,
            &format!(
                "label {}:\n    jump {}\n",
                b["technicalLabel"].as_str().unwrap(),
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap()
            .clone();
        f.command(command(&bs, json!({"type":"updateBeat","beatId":bs["beats"][0]["id"],"beat":{"type":"jump","sceneId":c["id"]}})));
        f.save(
            &a,
            &format!(
                "label {}:\n    jump {}\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap()
            .clone();
        f.command(command(&bs, json!({"type":"updateBeat","beatId":bs["beats"][0]["id"],"beat":{"type":"jump","sceneId":a["id"]}})));
        let flow = crate::lifecycle::acceptance::ipc(&mut f.service, "flow.list", json!({}));
        assert!(!flow["edges"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["text"].as_str().is_some_and(|s| s.contains("recursion"))));
        f.service.close().unwrap();
    }
}

#[cfg(test)]
mod structural_review_tests {
    use super::tests::Fixture;
    use serde_json::{json, Value};
    fn root(f: &mut Fixture) -> Value {
        f.model()["scenes"][0].clone()
    }
    #[test]
    fn phase3a_body_new_fallthrough_and_opaque_root_end_refuse() {
        let mut f = Fixture::new();
        let a = root(&mut f);
        f.save(
            &a,
            &format!(
                "label {}:\n    return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let a = root(&mut f);
        assert_eq!(f.reject(json!({"type":"updateBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"beatId":a["beats"][0]["id"],"expectedBody":{"type":"root"},"beat":{"type":"narration","text":"Fallthrough"}}))["error"]["code"], "SCENE_INVARIANT");
        f.save(
            &a,
            &format!(
                "label {}:\n    if flag:\n        return\n    else:\n        return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let a = root(&mut f);
        let child = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "return")
            .unwrap();
        assert_eq!(f.reject(json!({"type":"updateBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"beatId":child["id"],"expectedBody":{"type":"branch","groupId":child["owner"]["groupId"],"branchId":child["owner"]["branchId"]},"beat":{"type":"narration","text":"Fallthrough"}}))["error"]["code"], "SCENE_INVARIANT");
        for suffix in [
            "python:\n    x = 1\n",
            "screen custom():\n    text \"Opaque\"\n",
        ] {
            f.save(
                &a,
                &format!(
                    "label {}:\n    \"Known\"\n{suffix}",
                    a["technicalLabel"].as_str().unwrap()
                ),
            );
            let a = root(&mut f);
            assert_eq!(f.reject(json!({"type":"insertBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"body":{"type":"root"},"position":{"type":"end"},"beat":{"type":"narration","text":"Must not enter opaque block"}}))["error"]["code"], "OPAQUE_BOUNDARY");
        }
        f.save(
            &a,
            &format!(
                "label {}:\n    \"Known\"\n    return\ninit python:\n    \"Opaque Python\"\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let a = root(&mut f);
        let opaque = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == "Opaque Python")
            .unwrap();
        assert_eq!(f.reject(json!({"type":"updateBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"beatId":opaque["id"],"expectedBody":{"type":"root"},"beat":{"type":"narration","text":"Lost"}}))["error"]["code"], "SCENE_INVARIANT");
        f.save(&a, &format!("label {}:\n    \"Known\"\n    return\nscreen custom():\n    if flag:\n        text \"Opaque\"\n", a["technicalLabel"].as_str().unwrap()));
        let a = root(&mut f);
        let header = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| !b["conditionalBranch"].is_null())
            .unwrap();
        assert_eq!(f.reject(json!({"type":"insertBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"body":{"type":"branch","groupId":header["conditionalBranch"]["groupId"],"branchId":header["id"]},"position":{"type":"end"},"beat":{"type":"narration","text":"Lost"}}))["error"]["code"], "OPAQUE_BOUNDARY");
        assert_eq!(f.reject(json!({"type":"insertBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"body":{"type":"root"},"position":{"type":"before","anchor":{"type":"condition","groupId":header["conditionalBranch"]["groupId"]}},"beat":{"type":"narration","text":"Lost"}}))["error"]["code"], "SCENE_INVARIANT");
        // A qualified earlier Scene edit still preserves the later screen bytes.
        let known = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["text"] == "Known")
            .unwrap();
        let before = std::fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        f.command(json!({"type":"updateBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"beatId":known["id"],"expectedBody":{"type":"root"},"beat":{"type":"narration","text":"Changed"}}));
        assert_eq!(
            std::fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            String::from_utf8(before)
                .unwrap()
                .replace("Known", "Changed")
                .as_bytes()
        );
        f.service.close().unwrap();
    }
    #[test]
    fn phase3a_body_create_scene_from_choice_checks_candidate_routes() {
        let mut f = Fixture::new();
        let b = f.scene("B");
        let a = root(&mut f);
        f.save(
            &a,
            &format!(
                "label {}:\n    call {} from a_b\n    return\n",
                a["technicalLabel"].as_str().unwrap(),
                b["technicalLabel"].as_str().unwrap()
            ),
        );
        f.save(
            &b,
            &format!(
                "label {}:\n    menu:\n        \"Again\":\n            jump {}\n",
                b["technicalLabel"].as_str().unwrap(),
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap()
            .clone();
        assert_eq!(f.reject(json!({"type":"createSceneFromChoice","sceneId":b["id"],"expectedSourceRevision":bs["sourceRevision"],"choiceBeatId":bs["beats"][0]["id"],"optionText":"New path","chapterId":w["chapters"][0]["id"],"displayName":"New destination"}))["error"]["code"], "UNSUPPORTED_CALL_ROUTE");
        // Repair only the old recursive route through Source; adding a returning target then succeeds.
        f.save(
            &a,
            &format!(
                "label {}:\n    return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let w = f.model();
        let bs = w["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap();
        let result = f.command(json!({"type":"createSceneFromChoice","sceneId":b["id"],"expectedSourceRevision":bs["sourceRevision"],"choiceBeatId":bs["beats"][0]["id"],"optionText":"New path","chapterId":w["chapters"][0]["id"],"displayName":"New destination"}));
        assert_eq!(
            result["scenes"].as_array().unwrap().len(),
            w["scenes"].as_array().unwrap().len() + 1
        );
        let bs = result["scenes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|s| s["id"] == b["id"])
            .unwrap();
        assert_eq!(
            bs["beats"][0]["payload"]["options"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        f.service.close().unwrap();
    }
}

#[cfg(test)]
#[path = "structure/tests.rs"]
mod structural_tests;

#[cfg(test)]
mod panel_tests;

#[cfg(test)]
#[path = "logic/dialog_tests.rs"]
mod dialog_tests;

#[cfg(test)]
mod choice_body_tests {
    use super::tests::Fixture;
    use serde_json::json;
    #[test]
    fn choice_ambiguous_external_reorder_retains_source_draft_and_accepted_bytes() {
        let mut f = Fixture::new();
        let a = f.model()["scenes"][0].clone();
        f.save(&a,&format!("label {}:\n    menu:\n        \"Same\":\n            \"First\"\n        \"Same\":\n            \"Second\"\n    return\n",a["technicalLabel"].as_str().unwrap()));
        let before = std::fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        let opened = crate::lifecycle::acceptance::ipc(
            &mut f.service,
            "source.open",
            json!({"path":a["sourcePath"]}),
        );
        let text = opened["text"]
            .as_str()
            .unwrap()
            .replace("First", "Temp")
            .replace("Second", "First")
            .replace("Temp", "Second");
        let draft = crate::lifecycle::acceptance::ipc(
            &mut f.service,
            "source.updateDraft",
            json!({"path":a["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":text,"selectionStart":0,"selectionEnd":0}),
        );
        let response = crate::handle_application_request(
            json!({"protocolVersion":1,"requestId":"ambiguous-choice","operation":"source.save","payload":{"sessionId":f.service.current().unwrap().session_id,"path":a["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}}),
            false,
            &mut f.service,
        );
        assert_eq!(serde_json::to_value(response).unwrap()["ok"], false);
        assert_eq!(
            std::fs::read(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            before
        );
        let retained = crate::lifecycle::acceptance::ipc(
            &mut f.service,
            "source.open",
            json!({"path":a["sourcePath"]}),
        );
        assert_eq!(retained["text"], text);
        assert_eq!(retained["dirty"], true);
        crate::lifecycle::acceptance::ipc(
            &mut f.service,
            "source.discard",
            json!({"path":a["sourcePath"]}),
        );
        f.service.close().unwrap();
    }
    #[test]
    fn choice_insertion_before_an_identical_menu_preserves_existing_identities() {
        let mut f = Fixture::new();
        let a = f.model()["scenes"][0].clone();
        f.save(
            &a,
            &format!(
                "label {}:\n    menu:\n        \"Same\":\n            pass\n    return\n",
                a["technicalLabel"].as_str().unwrap()
            ),
        );
        let a = f.model()["scenes"][0].clone();
        let old = &a["beats"][0];
        let old_option = old["payload"]["options"][0]["id"].clone();
        f.command(json!({"type":"insertBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"body":{"type":"root"},"position":{"type":"before","anchor":{"type":"beat","beatId":old["id"]}},"beat":{"type":"choice","options":[{"text":"Same"}]}}));
        let after = f.model()["scenes"][0].clone();
        let menus = after["beats"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|b| b["payload"]["type"] == "choice")
            .collect::<Vec<_>>();
        assert_eq!(menus[1]["id"], old["id"]);
        assert_eq!(menus[1]["payload"]["options"][0]["id"], old_option);
        assert_ne!(menus[0]["id"], old["id"]);
        f.service.close().unwrap();
    }
    #[test]
    fn choice_caption_reorder_add_preserve_bodies_ids_comments_history_and_reopen() {
        let mut f = Fixture::new();
        let a = f.model()["scenes"][0].clone();
        let original=format!("label {}:\r\n    # neighbor\r\n    menu:\r\n        \"Same\": # caption\r\n            \"First\" # keep\r\n        \"Same\":\r\n            pass\r\n    \"Shared\"\r\n    return\r\n",a["technicalLabel"].as_str().unwrap());
        f.save(&a, &original);
        let original =
            std::fs::read_to_string(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        let a = f.model()["scenes"][0].clone();
        let choice = a["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["payload"]["type"] == "choice")
            .unwrap();
        let mut options = choice["payload"]["options"].as_array().unwrap().clone();
        let ids = options.iter().map(|o| o["id"].clone()).collect::<Vec<_>>();
        options[0]["text"] = json!("Renamed");
        options.swap(0, 1);
        options.push(json!({"text":"New"}));
        let fields = json!({"type":"updateBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"expectedBody":{"type":"root"},"beatId":choice["id"],"beat":{"type":"choice","options":options}});
        f.command(fields.clone());
        let updated = f.model()["scenes"][0].clone();
        let updated_choice = updated["beats"]
            .as_array()
            .unwrap()
            .iter()
            .find(|b| b["id"] == choice["id"])
            .unwrap();
        assert_eq!(updated_choice["payload"]["options"][0]["id"], ids[1]);
        assert_eq!(updated_choice["payload"]["options"][1]["id"], ids[0]);
        let expected=original.replace("        \"Same\": # caption\r\n            \"First\" # keep\r\n        \"Same\":\r\n            pass\r\n", "        \"Same\":\r\n            pass\r\n        \"Renamed\": # caption\r\n            \"First\" # keep\r\n        \"New\":\r\n            pass\r\n");
        assert_eq!(
            std::fs::read_to_string(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            expected
        );
        assert_eq!(f.reject(fields)["error"]["code"], "SOURCE_CONFLICT");
        f.command(json!({"type":"undo"}));
        assert_eq!(
            std::fs::read_to_string(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap(),
            original
        );
        f.command(json!({"type":"redo"}));
        f.service.close().unwrap();
        f.service.open_path(&f.root).unwrap();
        assert_eq!(f.model()["scenes"][0]["beats"], updated["beats"]);
        f.service.close().unwrap();
    }
    #[test]
    fn choice_empty_option_and_inline_body_share_one_continuation() {
        let mut f = Fixture::new();
        let a = f.model()["scenes"][0].clone();
        f.save(&a, &format!("label {}:\n    menu:\n        \"Yes\":\n            \"Inside\"\n        \"No\":\n            pass\n    \"Shared\"\n    return\n", a["technicalLabel"].as_str().unwrap()));
        let a = f.model()["scenes"][0].clone();
        let beats = a["beats"].as_array().unwrap();
        let choice = beats
            .iter()
            .find(|b| b["payload"]["type"] == "choice")
            .expect("Choice with ordered option bodies");
        let options = choice["payload"]["options"].as_array().unwrap();
        assert_ne!(options[0]["id"], options[1]["id"]);
        let inside = beats
            .iter()
            .find(|b| b["payload"]["text"] == "Inside")
            .unwrap();
        assert_eq!(inside["owner"]["branchId"], options[0]["id"]);
        let placeholder = beats
            .iter()
            .find(|b| b["structuralPlaceholder"] == true)
            .unwrap();
        assert_eq!(placeholder["owner"]["branchId"], options[1]["id"]);
        let no_body = json!({"type":"branch","groupId":placeholder["owner"]["groupId"],"branchId":options[1]["id"]});
        f.command(json!({"type":"insertBodyBeat","sceneId":a["id"],"expectedSourceRevision":a["sourceRevision"],"body":no_body,"position":{"type":"end"},"beat":{"type":"narration","text":"No body"}}));
        let actual =
            std::fs::read_to_string(f.root.join(a["sourcePath"].as_str().unwrap())).unwrap();
        assert!(actual.contains("        \"No\":\n            \"No body\"\n    \"Shared\"\n"));
        assert_eq!(actual.matches("\"Shared\"").count(), 1);
        f.service.close().unwrap();
    }
}
