//! Static dialogue boundary. Generated prose is literal; existing active syntax is
//! restored only through ordered, revision-bound core tokens. Never evaluates text.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const MAX_TEXT: usize = 10_000;
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(untagged, deny_unknown_fields)]
pub enum Segment {
    Literal { literal: String },
    Token { token: String },
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Protected {
    pub token: String,
    pub original_source: String,
}
#[derive(Clone, Debug, Serialize)]
pub struct Boundary {
    pub segments: Vec<Segment>,
    pub protected: Vec<Protected>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct InvalidText;
type Result<T> = std::result::Result<T, InvalidText>;

// Offsets into the original source spelling, alongside decoded characters.
fn decode(raw: &str) -> Result<Vec<(char, usize, usize)>> {
    let mut chars = raw.char_indices();
    let mut out = vec![];
    while let Some((start, ch)) = chars.next() {
        let (decoded, end) = if ch == '\\' {
            let (i, next) = chars.next().ok_or(InvalidText)?;
            (
                match next {
                    '\\' => '\\',
                    '"' => '"',
                    'n' => '\n',
                    _ => return Err(InvalidText),
                },
                i + next.len_utf8(),
            )
        } else {
            if ch == '"' || ch.is_control() {
                return Err(InvalidText);
            }
            (ch, start + ch.len_utf8())
        };
        out.push((decoded, start, end));
    }
    Ok(out)
}

impl Boundary {
    pub fn parse(raw: &str, revision: &str) -> Result<Self> {
        if raw.len() > MAX_TEXT {
            return Err(InvalidText);
        }
        let chars = decode(raw)?;
        let mut result = Self {
            segments: vec![],
            protected: vec![],
        };
        let mut literal = String::new();
        let mut tags: Vec<String> = vec![];
        let mut i = 0;
        while i < chars.len() {
            let c = chars[i].0;
            if matches!(c, '[' | '{') && chars.get(i + 1).is_some_and(|v| v.0 == c) {
                literal.push(c);
                i += 2;
                continue;
            }
            if c != '[' && c != '{' {
                // A closing brace without an opening tag is a literal character.
                literal.push(c);
                i += 1;
                continue;
            }
            let start = i;
            if c == '[' {
                // Preserve nested Python subscripts/calls and quoted delimiters as
                // one opaque interpolation. Triple quotes/newlines are unsupported.
                let mut depth = 1;
                let mut quote = None;
                let mut escaped = false;
                i += 1;
                while i < chars.len() {
                    let ch = chars[i].0;
                    if ch == '\n' {
                        return Err(InvalidText);
                    }
                    if let Some(q) = quote {
                        if escaped {
                            escaped = false;
                        } else if ch == '\\' {
                            escaped = true;
                        } else if ch == q {
                            quote = None;
                        }
                    } else {
                        match ch {
                            '\'' | '"' => quote = Some(ch),
                            '[' => depth += 1,
                            ']' => {
                                depth -= 1;
                                if depth == 0 {
                                    break;
                                }
                            }
                            _ => (),
                        }
                    }
                    i += 1;
                }
                if i == chars.len() || i == start + 1 {
                    return Err(InvalidText);
                }
            } else {
                i += 1;
                while i < chars.len() && chars[i].0 != '}' {
                    if matches!(chars[i].0, '{' | '\n') {
                        return Err(InvalidText);
                    }
                    i += 1;
                }
                if i == chars.len() {
                    return Err(InvalidText);
                }
                let tag: String = chars[start + 1..i].iter().map(|v| v.0).collect();
                let closing = tag.starts_with('/');
                let name = tag.trim_start_matches('/').split('=').next().unwrap_or("");
                let paired = matches!(
                    name,
                    "b" | "i"
                        | "u"
                        | "s"
                        | "plain"
                        | "font"
                        | "size"
                        | "color"
                        | "alpha"
                        | "outlinecolor"
                        | "a"
                        | "cps"
                        | "k"
                        | "rt"
                        | "rb"
                );
                let single = matches!(
                    name,
                    "p" | "w" | "nw" | "fast" | "done" | "clear" | "space" | "vspace" | "image"
                );
                if paired {
                    if closing {
                        if tag != format!("/{name}") || tags.pop().as_deref() != Some(name) {
                            return Err(InvalidText);
                        }
                    } else {
                        tags.push(name.to_owned());
                    }
                } else if !single || closing {
                    return Err(InvalidText);
                }
            }
            if !literal.is_empty() {
                result.segments.push(Segment::Literal {
                    literal: std::mem::take(&mut literal),
                });
            }
            let raw_token = &raw[chars[start].1..chars[i].2];
            let token = hex::encode(Sha256::digest(
                format!("{revision}:{}:{raw_token}", result.protected.len()).as_bytes(),
            ));
            result.segments.push(Segment::Token {
                token: token.clone(),
            });
            result.protected.push(Protected {
                token,
                original_source: raw_token.into(),
            });
            i += 1;
            if result.protected.len() > 128 {
                return Err(InvalidText);
            }
        }
        if !tags.is_empty() {
            return Err(InvalidText);
        }
        if !literal.is_empty() {
            result.segments.push(Segment::Literal { literal });
        }
        Ok(result)
    }

    pub fn emit(&self, segments: &[Segment]) -> Result<String> {
        if segments.is_empty() || segments.len() > 256 {
            return Err(InvalidText);
        }
        let mut out = String::new();
        let mut next = 0;
        for segment in segments {
            match segment {
                Segment::Literal { literal } => {
                    if literal.chars().any(|c| c.is_control() && c != '\n') {
                        return Err(InvalidText);
                    }
                    for ch in literal.chars() {
                        match ch {
                            '[' => out.push_str("[["),
                            '{' => out.push_str("{{"),
                            '\\' => out.push_str("\\\\"),
                            '"' => out.push_str("\\\""),
                            '\n' => out.push_str("\\n"),
                            _ => out.push(ch),
                        }
                    }
                }
                Segment::Token { token } => {
                    let protected = self
                        .protected
                        .get(next)
                        .filter(|p| &p.token == token)
                        .ok_or(InvalidText)?;
                    out.push_str(&protected.original_source);
                    next += 1;
                }
            }
            if out.len() > MAX_TEXT {
                return Err(InvalidText);
            }
        }
        if next != self.protected.len() || out.trim().is_empty() {
            return Err(InvalidText);
        }
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn literal(s: &str) -> Segment {
        Segment::Literal { literal: s.into() }
    }
    #[test]
    fn new_expressions_calls_tags_and_delimiters_are_display_literals() {
        let b = Boundary::parse("Old", "r").unwrap();
        assert_eq!(
            b.emit(&[literal(
                r#"[name] [call()] {a=jump:label}link{/a} {image=asset} \ 雪 \""#
            )])
            .unwrap(),
            r#"[[name] [[call()] {{a=jump:label}link{{/a} {{image=asset} \\ 雪 \\\""#
        );
    }
    #[test]
    fn protected_expression_source_spelling_and_formatting_survive_exactly() {
        let raw = r#"Hello [lookup(\"x[y]\")] {b}friend{/b} [[literal] {{brace}"#;
        let b = Boundary::parse(raw, "revision").unwrap();
        assert_eq!(b.protected.len(), 3);
        assert_eq!(b.emit(&b.segments).unwrap(), raw);
        assert_ne!(
            b.protected[0].token,
            Boundary::parse(raw, "other").unwrap().protected[0].token
        );
    }
    #[test]
    fn tokens_cannot_be_forged_reordered_duplicated_or_removed() {
        let b = Boundary::parse("[a] then [b]", "r").unwrap();
        for s in [
            vec![literal("removed")],
            vec![b.segments[2].clone(), b.segments[0].clone()],
            vec![b.segments[0].clone(), b.segments[0].clone()],
            vec![Segment::Token {
                token: "forged".into(),
            }],
        ] {
            assert!(b.emit(&s).is_err());
        }
    }
    #[test]
    fn unsupported_boundaries_and_closed_segment_schema_refuse() {
        for s in [
            "[",
            "[]",
            "[call(\"unterminated)]",
            "{unknown}",
            "{b}unclosed",
            "{b}x{/i}",
            r"bad\t",
            "{a=x{y}}",
        ] {
            assert!(Boundary::parse(s, "r").is_err(), "{s}");
        }
        for s in [
            r#"{"literal":"x","token":"y"}"#,
            r#"{"literal":"x","path":"game/x.rpy"}"#,
        ] {
            assert!(serde_json::from_str::<Segment>(s).is_err());
        }
    }
}
