//! Bounded, non-executing interpretation of the supported Ren'Py condition subset.
use crate::authoring::{AuthoringMetadata, VariableType};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

pub const MAX_EXPRESSION_BYTES: usize = 4096;
pub const MAX_EXPRESSION_NODES: usize = 128;
pub const MAX_EXPRESSION_DEPTH: usize = 16;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "type",
    deny_unknown_fields
)]
pub enum Expression {
    Bool {
        value: bool,
    },
    Int {
        value: String,
    },
    String {
        value: String,
    },
    Variable {
        variable_id: String,
        variable_type: VariableType,
    },
    Compare {
        operator: Comparison,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    Not {
        operand: Box<Expression>,
    },
    And {
        left: Box<Expression>,
        right: Box<Expression>,
    },
    Or {
        left: Box<Expression>,
        right: Box<Expression>,
    },
}
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Comparison {
    Equal,
    NotEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
}
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "status",
    deny_unknown_fields
)]
pub enum Condition {
    Supported {
        expression: Expression,
    },
    Unknown {
        source: String,
        diagnostic: ConditionError,
    },
}
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConditionError {
    UnsupportedSyntax,
    LimitExceeded,
    MissingVariable,
    TypeMismatch,
    InvalidValue,
}
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "status"
)]
pub enum ConditionResult {
    Known { value: bool },
    Unknown { diagnostic: ConditionError },
}

#[derive(Clone, Debug, PartialEq)]
enum Token {
    Word(String),
    Int(String),
    String(String),
    Comparison(Comparison),
    Left,
    Right,
}

pub fn parse(source: &str, authoring: &AuthoringMetadata) -> Condition {
    let parsed = (|| {
        let tokens = tokenize(source)?;
        let mut parser = Parser {
            tokens,
            at: 0,
            nodes: 0,
            authoring,
        };
        let result = parser.or(0)?;
        if parser.at != parser.tokens.len() {
            return Err(ConditionError::UnsupportedSyntax);
        }
        validate_expression(&result)?;
        if expression_type(&result)? != VariableType::Bool {
            return Err(ConditionError::TypeMismatch);
        }
        Ok(result)
    })();
    match parsed {
        Ok(expression) => Condition::Supported { expression },
        Err(diagnostic) => Condition::Unknown {
            source: source.into(),
            diagnostic,
        },
    }
}
fn tokenize(source: &str) -> Result<Vec<Token>, ConditionError> {
    if source.contains('\0') {
        return Err(ConditionError::UnsupportedSyntax);
    }
    if source.len() > MAX_EXPRESSION_BYTES {
        return Err(ConditionError::LimitExceeded);
    }
    let mut chars = source.chars().peekable();
    let mut tokens = Vec::new();
    while let Some(ch) = chars.next() {
        if ch.is_ascii_whitespace() {
            continue;
        }
        let token = match ch {
            '(' => Token::Left,
            ')' => Token::Right,
            '"' | '\'' => {
                let mut value = String::new();
                let mut closed = false;
                while let Some(next) = chars.next() {
                    if next == ch {
                        closed = true;
                        break;
                    }
                    if next == '\\' {
                        value.push(
                            match chars.next().ok_or(ConditionError::UnsupportedSyntax)? {
                                '\\' => '\\',
                                '"' => '"',
                                '\'' => '\'',
                                'n' => '\n',
                                'r' => '\r',
                                't' => '\t',
                                _ => return Err(ConditionError::UnsupportedSyntax),
                            },
                        );
                    } else if next == '\n' || next == '\r' {
                        return Err(ConditionError::UnsupportedSyntax);
                    } else {
                        value.push(next);
                    }
                }
                if !closed {
                    return Err(ConditionError::UnsupportedSyntax);
                }
                Token::String(value)
            }
            '=' | '!' | '<' | '>' => {
                let equal = chars.peek() == Some(&'=');
                if equal {
                    chars.next();
                }
                Token::Comparison(match (ch, equal) {
                    ('=', true) => Comparison::Equal,
                    ('!', true) => Comparison::NotEqual,
                    ('<', false) => Comparison::Less,
                    ('<', true) => Comparison::LessEqual,
                    ('>', false) => Comparison::Greater,
                    ('>', true) => Comparison::GreaterEqual,
                    _ => return Err(ConditionError::UnsupportedSyntax),
                })
            }
            '-' | '0'..='9' => {
                let mut value = ch.to_string();
                while chars.peek().is_some_and(char::is_ascii_digit) {
                    value.push(chars.next().unwrap());
                }
                if chars
                    .peek()
                    .is_some_and(|ch| ch.is_ascii_alphabetic() || *ch == '_')
                {
                    return Err(ConditionError::UnsupportedSyntax);
                }
                if value.parse::<i64>().is_err()
                    || value.parse::<i64>().unwrap().to_string() != value
                {
                    return Err(ConditionError::InvalidValue);
                }
                Token::Int(value)
            }
            'a'..='z' | 'A'..='Z' | '_' => {
                let mut word = ch.to_string();
                while chars
                    .peek()
                    .is_some_and(|c| c.is_ascii_alphanumeric() || *c == '_')
                {
                    word.push(chars.next().unwrap());
                }
                Token::Word(word)
            }
            _ => return Err(ConditionError::UnsupportedSyntax),
        };
        tokens.push(token);
        if tokens.len() > MAX_EXPRESSION_NODES * 3 {
            return Err(ConditionError::LimitExceeded);
        }
    }
    Ok(tokens)
}
struct Parser<'a> {
    tokens: Vec<Token>,
    at: usize,
    nodes: usize,
    authoring: &'a AuthoringMetadata,
}
impl Parser<'_> {
    fn node(&mut self, value: Expression) -> Result<Expression, ConditionError> {
        self.nodes += 1;
        if self.nodes > MAX_EXPRESSION_NODES {
            return Err(ConditionError::LimitExceeded);
        }
        Ok(value)
    }
    fn word(&mut self, word: &str) -> bool {
        if self.tokens.get(self.at) == Some(&Token::Word(word.into())) {
            self.at += 1;
            true
        } else {
            false
        }
    }
    fn or(&mut self, depth: usize) -> Result<Expression, ConditionError> {
        let mut left = self.and(depth)?;
        while self.word("or") {
            let right = self.and(depth)?;
            left = self.node(Expression::Or {
                left: Box::new(left),
                right: Box::new(right),
            })?;
        }
        Ok(left)
    }
    fn and(&mut self, depth: usize) -> Result<Expression, ConditionError> {
        let mut left = self.not(depth)?;
        while self.word("and") {
            let right = self.not(depth)?;
            left = self.node(Expression::And {
                left: Box::new(left),
                right: Box::new(right),
            })?;
        }
        Ok(left)
    }
    fn not(&mut self, depth: usize) -> Result<Expression, ConditionError> {
        if depth > MAX_EXPRESSION_DEPTH {
            return Err(ConditionError::LimitExceeded);
        }
        if self.word("not") {
            let operand = self.not(depth + 1)?;
            return self.node(Expression::Not {
                operand: Box::new(operand),
            });
        }
        let left = self.atom(depth)?;
        if let Some(Token::Comparison(operator)) = self.tokens.get(self.at).cloned() {
            self.at += 1;
            let right = self.atom(depth)?;
            self.node(Expression::Compare {
                operator,
                left: Box::new(left),
                right: Box::new(right),
            })
        } else {
            Ok(left)
        }
    }
    fn atom(&mut self, depth: usize) -> Result<Expression, ConditionError> {
        let token = self
            .tokens
            .get(self.at)
            .cloned()
            .ok_or(ConditionError::UnsupportedSyntax)?;
        self.at += 1;
        let value = match token {
            Token::Left => {
                if depth >= MAX_EXPRESSION_DEPTH {
                    return Err(ConditionError::LimitExceeded);
                }
                let result = self.or(depth + 1)?;
                if self.tokens.get(self.at) != Some(&Token::Right) {
                    return Err(ConditionError::UnsupportedSyntax);
                }
                self.at += 1;
                return Ok(result);
            }
            Token::Word(word) if word == "True" || word == "False" => Expression::Bool {
                value: word == "True",
            },
            Token::Word(word) => {
                let variable = self
                    .authoring
                    .variables
                    .iter()
                    .find(|v| v.technical_name == word)
                    .ok_or(ConditionError::MissingVariable)?;
                Expression::Variable {
                    variable_id: variable.id.clone(),
                    variable_type: variable.variable_type,
                }
            }
            Token::Int(value) => Expression::Int { value },
            Token::String(value) => Expression::String { value },
            _ => return Err(ConditionError::UnsupportedSyntax),
        };
        self.node(value)
    }
}
pub fn validate_expression(expression: &Expression) -> Result<(), ConditionError> {
    let mut pending = vec![(expression, 1usize)];
    let mut nodes = 0;
    while let Some((expression, depth)) = pending.pop() {
        nodes += 1;
        if depth > MAX_EXPRESSION_DEPTH || nodes > MAX_EXPRESSION_NODES {
            return Err(ConditionError::LimitExceeded);
        }
        match expression {
            Expression::Int { value } => {
                if value.parse::<i64>().is_err()
                    || value.parse::<i64>().unwrap().to_string() != *value
                {
                    return Err(ConditionError::InvalidValue);
                }
            }
            Expression::Variable { variable_id, .. } => {
                if uuid::Uuid::parse_str(variable_id).is_err() {
                    return Err(ConditionError::MissingVariable);
                }
            }
            Expression::String { value } if value.len() > MAX_EXPRESSION_BYTES => {
                return Err(ConditionError::LimitExceeded)
            }
            Expression::Compare { left, right, .. }
            | Expression::And { left, right }
            | Expression::Or { left, right } => {
                pending.push((left, depth + 1));
                pending.push((right, depth + 1));
            }
            Expression::Not { operand } => pending.push((operand, depth + 1)),
            _ => {}
        }
    }
    expression_type(expression).map(|_| ())
}
fn expression_type(expression: &Expression) -> Result<VariableType, ConditionError> {
    use Expression::*;
    match expression {
        Bool { .. } => Ok(VariableType::Bool),
        Int { value } => value
            .parse::<i64>()
            .map(|_| VariableType::Int)
            .map_err(|_| ConditionError::InvalidValue),
        String { .. } => Ok(VariableType::String),
        Variable { variable_type, .. } => Ok(*variable_type),
        Compare {
            operator,
            left,
            right,
        } => {
            let kind = expression_type(left)?;
            if kind != expression_type(right)?
                || !matches!(operator, Comparison::Equal | Comparison::NotEqual)
                    && kind != VariableType::Int
            {
                return Err(ConditionError::TypeMismatch);
            }
            Ok(VariableType::Bool)
        }
        Not { operand } => {
            if expression_type(operand)? != VariableType::Bool {
                return Err(ConditionError::TypeMismatch);
            }
            Ok(VariableType::Bool)
        }
        And { left, right } | Or { left, right } => {
            if expression_type(left)? != VariableType::Bool
                || expression_type(right)? != VariableType::Bool
            {
                return Err(ConditionError::TypeMismatch);
            }
            Ok(VariableType::Bool)
        }
    }
}
#[derive(PartialEq)]
enum TypedValue {
    Bool(bool),
    Int(i64),
    String(String),
}
fn evaluate_expression(
    expression: &Expression,
    values: &HashMap<String, Value>,
) -> Result<TypedValue, ConditionError> {
    use Expression::*;
    let boolean = |value| {
        if let TypedValue::Bool(v) = value {
            Ok(v)
        } else {
            Err(ConditionError::TypeMismatch)
        }
    };
    Ok(match expression {
        Bool { value } => TypedValue::Bool(*value),
        Int { value } => TypedValue::Int(value.parse().map_err(|_| ConditionError::InvalidValue)?),
        String { value } => TypedValue::String(value.clone()),
        Variable {
            variable_id,
            variable_type,
        } => {
            let value = values
                .get(variable_id)
                .ok_or(ConditionError::MissingVariable)?;
            match variable_type {
                VariableType::Bool => {
                    TypedValue::Bool(value.as_bool().ok_or(ConditionError::TypeMismatch)?)
                }
                VariableType::Int => {
                    let value = value.as_str().ok_or(ConditionError::TypeMismatch)?;
                    let parsed: i64 = value.parse().map_err(|_| ConditionError::InvalidValue)?;
                    if parsed.to_string() != value {
                        return Err(ConditionError::InvalidValue);
                    }
                    TypedValue::Int(parsed)
                }
                VariableType::String => {
                    TypedValue::String(value.as_str().ok_or(ConditionError::TypeMismatch)?.into())
                }
            }
        }
        Compare {
            operator,
            left,
            right,
        } => {
            let left = evaluate_expression(left, values)?;
            let right = evaluate_expression(right, values)?;
            let value = match operator {
                Comparison::Equal => left == right,
                Comparison::NotEqual => left != right,
                _ => {
                    let (TypedValue::Int(left), TypedValue::Int(right)) = (left, right) else {
                        return Err(ConditionError::TypeMismatch);
                    };
                    match operator {
                        Comparison::Less => left < right,
                        Comparison::LessEqual => left <= right,
                        Comparison::Greater => left > right,
                        Comparison::GreaterEqual => left >= right,
                        _ => unreachable!(),
                    }
                }
            };
            TypedValue::Bool(value)
        }
        Not { operand } => TypedValue::Bool(!boolean(evaluate_expression(operand, values)?)?),
        And { left, right } | Or { left, right } => {
            // Missing/invalid state remains unknown even beneath a decisive operand.
            let left = boolean(evaluate_expression(left, values)?)?;
            let right = boolean(evaluate_expression(right, values)?)?;
            TypedValue::Bool(if matches!(expression, And { .. }) {
                left && right
            } else {
                left || right
            })
        }
    })
}
pub fn evaluate(condition: &Condition, values: &HashMap<String, Value>) -> ConditionResult {
    let result = match condition {
        Condition::Unknown { diagnostic, .. } => Err(diagnostic.clone()),
        Condition::Supported { expression } => validate_expression(expression)
            .and_then(|_| expression_type(expression))
            .and_then(|kind| {
                if kind != VariableType::Bool {
                    return Err(ConditionError::TypeMismatch);
                }
                match evaluate_expression(expression, values)? {
                    TypedValue::Bool(value) => Ok(value),
                    _ => Err(ConditionError::TypeMismatch),
                }
            }),
    };
    match result {
        Ok(value) => ConditionResult::Known { value },
        Err(diagnostic) => ConditionResult::Unknown { diagnostic },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn definitions() -> AuthoringMetadata {
        serde_json::from_value(serde_json::json!({"schemaVersion":1,"projectId":"00000000-0000-4000-8000-000000000000","characters":[],"variables":[
            {"id":"00000000-0000-4000-8000-000000000001","technicalName":"flag","variableType":"bool","defaultValue":true,"source":{"statement":"default placeholder = True","path":"game/definitions/variables.rpy","sourceRevision":"a".repeat(64)}},
            {"id":"00000000-0000-4000-8000-000000000002","technicalName":"score","variableType":"int","defaultValue":"0","source":{"statement":"default placeholder = True","path":"game/definitions/variables.rpy","sourceRevision":"a".repeat(64)}},
            {"id":"00000000-0000-4000-8000-000000000003","technicalName":"name","variableType":"string","defaultValue":"","source":{"statement":"default placeholder = True","path":"game/definitions/variables.rpy","sourceRevision":"a".repeat(64)}}
        ],"appearances":[],"assets":[]})).unwrap()
    }
    #[test]
    fn phase3a_exact_values_types_and_precedence() {
        let definitions = definitions();
        let values = definitions
            .variables
            .iter()
            .map(|v| {
                (
                    v.id.clone(),
                    match v.technical_name.as_str() {
                        "flag" => Value::Bool(false),
                        "score" => Value::String("9223372036854775807".into()),
                        _ => Value::String("café 雪".into()),
                    },
                )
            })
            .collect();
        for (source, expected) in [
            ("score == 9223372036854775807", true),
            ("score > 9007199254740992", true),
            ("not score < 0 and name == 'café 雪' or flag", true),
            ("flag or True and False", false),
            ("not (flag or False)", true),
            ("-9223372036854775808 < score", true),
        ] {
            assert_eq!(
                evaluate(&parse(source, &definitions), &values),
                ConditionResult::Known { value: expected },
                "{source}"
            );
        }
        for (source, diagnostic) in [
            ("score == True", ConditionError::TypeMismatch),
            ("name < 'z'", ConditionError::TypeMismatch),
            ("missing", ConditionError::MissingVariable),
            ("score", ConditionError::TypeMismatch),
            ("flag()", ConditionError::UnsupportedSyntax),
            ("flag.value", ConditionError::UnsupportedSyntax),
            ("score == 9223372036854775808", ConditionError::InvalidValue),
            ("flag == False == True", ConditionError::UnsupportedSyntax),
        ] {
            assert!(
                matches!(parse(source, &definitions), Condition::Unknown { diagnostic: d, .. } if d == diagnostic),
                "{source}"
            );
        }
    }
    #[test]
    fn phase3a_bounds_and_missing_state_remain_unknown() {
        let definitions = definitions();
        let values = HashMap::new();
        assert_eq!(
            evaluate(&parse("False and flag", &definitions), &values),
            ConditionResult::Unknown {
                diagnostic: ConditionError::MissingVariable
            }
        );
        for source in [
            format!("{}True{}", "(".repeat(17), ")".repeat(17)),
            vec!["True"; 20].join(" and "),
            "not ".repeat(17) + "True",
        ] {
            assert!(matches!(
                parse(&source, &definitions),
                Condition::Unknown {
                    diagnostic: ConditionError::LimitExceeded,
                    ..
                }
            ));
        }
        let malicious = Condition::Supported {
            expression: Expression::Int { value: "00".into() },
        };
        assert_eq!(
            evaluate(&malicious, &values),
            ConditionResult::Unknown {
                diagnostic: ConditionError::InvalidValue
            }
        );
    }
}

#[cfg(test)]
mod source_tests {
    use super::*;
    use crate::lifecycle::{acceptance::ipc, LifecycleService};
    use serde_json::json;
    use std::fs;
    #[test]
    fn phase3a_python_literals_and_trivia_stay_opaque() {
        let tmp = tempfile::tempdir().unwrap();
        let profile = tmp.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        service.open_path(&root).unwrap();
        let workspace = ipc(&mut service, "scene.list", json!({}));
        let scene = &workspace["scenes"][0];
        let source = format!("label {}:\n    if flag:\n        bec \"Before\"\n        # keep this comment\n\n        python:\n            note = \"\"\"\n        if flag:\n            bec \"String data\"\n        else:\n            bec \"More string data\"\n            \"\"\"\n        bec \"After\"\n    python:\n        note = \"\"\"\n    menu:\n        \"Fake option\":\n            jump {}\n        \"\"\"\n    return\n", scene["technicalLabel"].as_str().unwrap(), scene["technicalLabel"].as_str().unwrap());
        let opened = ipc(
            &mut service,
            "source.open",
            json!({"path":scene["sourcePath"]}),
        );
        let draft = ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":scene["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
        );
        ipc(
            &mut service,
            "source.save",
            json!({"path":scene["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
        );
        let accepted = ipc(&mut service, "scene.list", json!({}));
        let beats = accepted["scenes"][0]["beats"].as_array().unwrap();
        assert_eq!(
            beats
                .iter()
                .filter(|b| b["conditionalBranch"].is_object())
                .count(),
            1
        );
        assert_eq!(
            beats
                .iter()
                .filter(|b| b["payload"]["type"] == "dialogue")
                .map(|b| b["payload"]["text"].as_str().unwrap())
                .collect::<Vec<_>>(),
            ["Before", "After"]
        );
        assert!(!beats
            .iter()
            .any(|b| b["payload"]["type"] == "choice" || b["payload"]["type"] == "jump"));
        assert_eq!(
            fs::read(root.join(scene["sourcePath"].as_str().unwrap())).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), source.as_bytes()].concat()
        );
        service.close().unwrap();
    }
    #[test]
    fn phase3a_v3_migration_preserves_ids_extras_and_source() {
        let tmp = tempfile::tempdir().unwrap();
        let profile = tmp.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        let path = root.join(".renpy-editor/source-map.json");
        let mut map: Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        map["schemaVersion"] = json!(3);
        for scene in map["sceneMappings"].as_array_mut().unwrap() {
            for beat in scene["beats"].as_array_mut().unwrap() {
                beat["legacyExtra"] = json!({"kept":true});
                if let Some(branch) = beat
                    .get_mut("conditionalBranch")
                    .and_then(Value::as_object_mut)
                {
                    branch.remove("condition");
                    branch.remove("ordinal");
                }
            }
        }
        let ids = |map: &Value| {
            map["sceneMappings"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .map(|b| b["id"].clone())
                .collect::<Vec<_>>()
        };
        let before_ids = ids(&map);
        let source_path = root.join(map["sceneMappings"][0]["path"].as_str().unwrap());
        let source = fs::read(&source_path).unwrap();
        fs::write(&path, serde_json::to_vec(&map).unwrap()).unwrap();
        service.open_path(&root).unwrap();
        service.close().unwrap();
        let migrated: Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(migrated["schemaVersion"], 4);
        assert_eq!(ids(&migrated), before_ids);
        assert!(migrated["sceneMappings"][0]["beats"]
            .as_array()
            .unwrap()
            .iter()
            .all(|b| b["legacyExtra"]["kept"] == true));
        assert_eq!(fs::read(&source_path).unwrap(), source);
    }
    #[test]
    fn phase3a_nested_dispatch_minimal_edit_history_and_reopen() {
        let temporary = tempfile::tempdir().unwrap();
        let profile = temporary.path().join("profile");
        let mut service =
            LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
        let root = profile.join("synthetic-project");
        service.open_path(&root).unwrap();
        ipc(
            &mut service,
            "variable.create",
            json!({"technicalName":"score","variableType":"int","defaultValue":"9223372036854775807"}),
        );
        let workspace = ipc(&mut service, "scene.list", json!({}));
        let scene = workspace["scenes"][0].clone();
        let source = format!("label {}:\r\n    if flag: # outer\r\n        if score >= 9007199254740993:\r\n            bec \"Deep café 雪\" # keep exactly\r\n            # retained trivia\r\n\r\n            return\r\n        elif score == 0:\r\n            bec \"Zero\"\r\n        else:\r\n            python:\r\n                if True:\r\n                    opaque = \"never edit me\"\r\n            bec \"Other\"\r\n    # between branches\r\n    elif missing():\r\n        bec \"Unknown\"\r\n    else:\r\n        bec \"False\"\r\n    return", scene["technicalLabel"].as_str().unwrap());
        let opened = ipc(
            &mut service,
            "source.open",
            json!({"path":scene["sourcePath"]}),
        );
        let draft = ipc(
            &mut service,
            "source.updateDraft",
            json!({"path":scene["sourcePath"],"expectedBaseRevision":opened["baseRevision"],"text":source,"selectionStart":0,"selectionEnd":0}),
        );
        ipc(
            &mut service,
            "source.save",
            json!({"path":scene["sourcePath"],"expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}),
        );
        let before = ipc(&mut service, "scene.list", json!({}));
        let beats = before["scenes"][0]["beats"].as_array().unwrap();
        let deep = beats
            .iter()
            .find(|b| b["payload"]["text"] == "Deep café 雪")
            .unwrap();
        assert!(deep["owner"].is_object());
        let nested_header = beats
            .iter()
            .find(|b| b["id"] == deep["owner"]["branchId"])
            .unwrap();
        assert!(nested_header["owner"].is_object());
        assert!(nested_header["conditionalBranch"]["variableId"].is_null());
        assert_eq!(
            nested_header["conditionalBranch"]["condition"]["status"],
            "supported"
        );
        assert!(beats
            .iter()
            .any(|b| b["conditionalBranch"]["condition"]["status"] == "unknown"));
        assert!(!beats
            .iter()
            .any(|b| b["payload"]["text"] == "never edit me"));
        let source_path = root.join(scene["sourcePath"].as_str().unwrap());
        let source_before_refusal = fs::read(&source_path).unwrap();
        let map_before_refusal = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
        let branch = beats
            .iter()
            .find(|b| b["conditionalBranch"]["ordinal"] == 1 && b["owner"].is_null())
            .unwrap();
        let nested_branch = beats
            .iter()
            .find(|b| b["conditionalBranch"]["ordinal"] == 1 && b["owner"].is_object())
            .unwrap();
        let trivia = beats
            .iter()
            .find(|b| b["payload"]["source"] == "    # between branches")
            .unwrap();
        for target in [branch, nested_branch, trivia] {
            let response = crate::handle_application_request(
                json!({"protocolVersion":1,"requestId":"phase3a-refusal","operation":"scene.apply","payload":{"sessionId":service.current().unwrap().session_id,"expectedProjectRevision":before["projectRevision"],"expectedSourceMapRevision":before["sourceMapRevision"],"command":{"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":before["scenes"][0]["sourceRevision"],"beforeBeatId":target["id"],"beat":{"type":"narration","text":"Must not split condition"}}}}),
                false,
                &mut service,
            );
            assert_eq!(serde_json::to_value(response).unwrap()["ok"], false);
            assert_eq!(fs::read(&source_path).unwrap(), source_before_refusal);
            assert_eq!(
                fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
                map_before_refusal
            );
        }
        let changed = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":before["projectRevision"],"expectedSourceMapRevision":before["sourceMapRevision"],"command":{"type":"updateChildDialogue","sceneId":scene["id"],"expectedSourceRevision":before["scenes"][0]["sourceRevision"],"beatId":deep["id"],"expectedOwner":deep["owner"],"characterId":deep["payload"]["characterId"],"text":"Edited café 雪"}}),
        );
        let path = root.join(scene["sourcePath"].as_str().unwrap());
        let accepted = source.replace("Deep café 雪", "Edited café 雪");
        assert_eq!(
            fs::read(&path).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), accepted.as_bytes()].concat()
        );
        let identities = |w: &Value| {
            w["scenes"][0]["beats"]
                .as_array()
                .unwrap()
                .iter()
                .map(|b| {
                    (
                        b["id"].clone(),
                        b["owner"].clone(),
                        b["conditionalBranch"].clone(),
                    )
                })
                .collect::<Vec<_>>()
        };
        assert_eq!(identities(&before), identities(&changed));
        let undone = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":changed["projectRevision"],"expectedSourceMapRevision":changed["sourceMapRevision"],"command":{"type":"undo"}}),
        );
        assert_eq!(
            fs::read(&path).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), source.as_bytes()].concat()
        );
        let redone = ipc(
            &mut service,
            "scene.apply",
            json!({"expectedProjectRevision":undone["projectRevision"],"expectedSourceMapRevision":undone["sourceMapRevision"],"command":{"type":"redo"}}),
        );
        assert_eq!(
            fs::read(&path).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), accepted.as_bytes()].concat()
        );
        service.close().unwrap();
        service.open_path(&root).unwrap();
        assert_eq!(
            identities(&redone),
            identities(&ipc(&mut service, "scene.list", json!({})))
        );
        assert_eq!(
            fs::read(&path).unwrap(),
            [b"\xef\xbb\xbf".as_slice(), accepted.as_bytes()].concat()
        );
        service.close().unwrap();
    }
}
