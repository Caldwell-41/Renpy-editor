//! Pinned SDK text recognition. Unknown output remains inert bounded text, never a path capability.
use crate::transaction::{ExecutionManifest, RelativePath};
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeDiagnostic {
    pub id: usize,
    pub origin: String,
    pub severity: String,
    pub message: String,
    pub path: Option<String>,
    pub line: Option<usize>,
    pub column: Option<usize>,
    pub source_revision: Option<String>,
    pub operation_id: String,
    pub session_id: String,
    pub freshness: String,
}

fn bounded(text: &str) -> String {
    prefix(text, 4096).to_owned()
}
fn prefix(text: &str, bytes: usize) -> &str {
    let mut end = text.len().min(bytes);
    while !text.is_char_boundary(end) {
        end -= 1;
    }
    &text[..end]
}

// Ren'Py 8.5.3 compile/traceback: File "game/path.rpy", line N: ...
// lint: game/path.rpy:N message. No guessed absolute-path stripping.
fn location(line: &str) -> Option<(String, usize)> {
    let line = line.trim();
    let (path, number) = if let Some(rest) = line.strip_prefix("File \"") {
        let (path, rest) = rest.split_once("\", line ")?;
        (path, rest.split(|c: char| !c.is_ascii_digit()).next()?)
    } else {
        let (path, rest) = line.split_once(':')?;
        (
            path,
            rest.trim_start()
                .split(|c: char| !c.is_ascii_digit())
                .next()?,
        )
    };
    let path = path.replace('\\', "/");
    if !path.starts_with("game/")
        || !path.ends_with(".rpy")
        || path.contains(':')
        || path
            .split('/')
            .any(|part| part.is_empty() || part == "." || part == "..")
        || RelativePath::new(path.clone()).is_err()
    {
        return None;
    }
    let number = number
        .parse::<usize>()
        .ok()
        .filter(|n| *n > 0 && *n <= 1_000_000)?;
    Some((path, number))
}

pub(crate) fn parse(
    text: &str,
    origin: &str,
    operation: &str,
    session: &str,
    manifest: &ExecutionManifest,
    result: &mut Vec<RuntimeDiagnostic>,
) {
    let mut current: Option<RuntimeDiagnostic> = None;
    for line in text.lines() {
        let found = location(line);
        let lower = line.trim_start().to_ascii_lowercase();
        let severity = if lower.starts_with("warning:") || lower.contains(" warning:") {
            "warning"
        } else if found.is_some()
            || lower.starts_with("error:")
            || lower.contains("exception:")
            || lower.contains("error:")
        {
            "error"
        } else {
            "info"
        };
        if found.is_some() || (severity != "info" && current.is_none()) {
            if let Some(record) = current.take() {
                if result.len() < 256 {
                    result.push(record);
                }
            }
            if result.len() == 256 {
                return;
            }
            let (path, number) = found
                .map(|(p, n)| (Some(p), Some(n)))
                .unwrap_or((None, None));
            let revision = path
                .as_ref()
                .and_then(|p| manifest.get(p))
                .map(|r| r.sha256.clone());
            current = Some(RuntimeDiagnostic {
                id: result.len(),
                origin: origin.into(),
                severity: severity.into(),
                message: bounded(line),
                path: path.filter(|_| revision.is_some()),
                line: number,
                column: None,
                source_revision: revision,
                operation_id: operation.into(),
                session_id: session.into(),
                freshness: "unverified".into(),
            });
        } else if let Some(record) = &mut current {
            let remaining = 4096_usize.saturating_sub(record.message.len());
            if remaining > 1 {
                record.message.push('\n');
                record.message.push_str(prefix(line, remaining - 1));
            }
        }
    }
    if let Some(record) = current {
        if result.len() < 256 {
            result.push(record);
        }
    }
    // Raw output is always separately retained; no diagnostics never means success.
}

pub(crate) fn line_range(bytes: &[u8], line: usize) -> Option<(usize, usize)> {
    let bom = usize::from(bytes.starts_with(&[0xef, 0xbb, 0xbf])) * 3;
    std::str::from_utf8(bytes).ok()?;
    let mut start = bom;
    for _ in 1..line {
        start += bytes.get(start..)?.iter().position(|b| *b == b'\n')? + 1;
    }
    if start > bytes.len() {
        return None;
    }
    let end = bytes[start..]
        .iter()
        .position(|b| *b == b'\n')
        .map(|n| start + n)
        .unwrap_or(bytes.len());
    let end = if end > start && bytes[end - 1] == b'\r' {
        end - 1
    } else {
        end
    };
    Some((start, end))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transaction::Revision;
    #[test]
    fn runtime_diagnostics_formats_bounds_and_unicode() {
        let mut manifest = ExecutionManifest::new();
        manifest.insert("game/雪 scene.rpy".into(), Revision::expected_absence());
        let mut result = vec![];
        parse("File \"game/雪 scene.rpy\", line 2: expected statement.\n    bad line\n    ^\nFile \"/private/other.rpy\", line 3:\nWarning: fallback", "compile", "op", "session", &manifest, &mut result);
        assert_eq!(result[0].path.as_deref(), Some("game/雪 scene.rpy"));
        assert!(result[0].message.contains("bad line"));
        assert_eq!(result[0].column, None);
        let mut lint = vec![];
        parse(
            "game/雪 scene.rpy:2 warning: missing image",
            "lint",
            "op",
            "session",
            &manifest,
            &mut lint,
        );
        assert_eq!(lint[0].severity, "warning");
        for bad in [
            "game/../outside.rpy:2 error",
            "C:/game/a.rpy:2",
            "game//a.rpy:2",
            "game/a.rpy:0",
        ] {
            assert!(location(bad).is_none());
        }
        assert_eq!(
            line_range("\u{feff}label start:\r\n    \"雪😀\"\r\n".as_bytes(), 2),
            Some((17, 30))
        );
        let flood = "game/雪 scene.rpy:2 error\n".repeat(400);
        parse(&flood, "lint", "op", "session", &manifest, &mut lint);
        assert_eq!(lint.len(), 256);
    }
}
