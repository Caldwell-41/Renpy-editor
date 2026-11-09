//! Integer self-assignment shared by source adapters. Never executes Python.
use super::*;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum IntegerOperation {
    Add,
    Subtract,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct IntegerAdjustment {
    pub operation: IntegerOperation,
    pub operand: String,
}

impl IntegerAdjustment {
    pub fn validate(&self) -> Result<i64, ConditionError> {
        if !crate::authoring::valid_i64_decimal(&self.operand) {
            return Err(ConditionError::InvalidValue);
        }
        self.operand
            .parse()
            .map_err(|_| ConditionError::InvalidValue)
    }
    pub fn operator(&self) -> &'static str {
        match self.operation {
            IntegerOperation::Add => "+",
            IntegerOperation::Subtract => "-",
        }
    }
    pub fn evaluate(&self, current: Option<i64>) -> Result<i64, ArithmeticUnknown> {
        let operand = self
            .validate()
            .map_err(|_| ArithmeticUnknown::InvalidOperand)?;
        let current = current.ok_or(ArithmeticUnknown::UnobservedCurrentValue)?;
        match self.operation {
            IntegerOperation::Add => current.checked_add(operand),
            IntegerOperation::Subtract => current.checked_sub(operand),
        }
        .ok_or(ArithmeticUnknown::IntegerOverflow)
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ArithmeticUnknown {
    UnobservedCurrentValue,
    UnsupportedControlFlow,
    IntegerOverflow,
    InvalidOperand,
}

/// Recognize only a single signed integer literal, never a formula or Python.
pub(crate) fn parse_assignment(source: &str) -> Option<(&str, IntegerAdjustment)> {
    let source = source.strip_prefix('$')?.trim();
    let name_end = source.find(|c: char| !(c.is_ascii_alphanumeric() || c == '_'))?;
    let name = &source[..name_end];
    let rest = source[name_end..].trim_start();
    let (operation, operand) = if let Some(operand) = rest.strip_prefix("+=") {
        (IntegerOperation::Add, operand)
    } else if let Some(operand) = rest.strip_prefix("-=") {
        (IntegerOperation::Subtract, operand)
    } else {
        let rest = rest.strip_prefix('=')?.trim_start();
        let rest = rest.strip_prefix(name)?;
        let rest = rest.trim_start();
        if let Some(operand) = rest.strip_prefix('+') {
            (IntegerOperation::Add, operand)
        } else {
            (IntegerOperation::Subtract, rest.strip_prefix('-')?)
        }
    };
    let operand = operand.trim();
    // Source accepts ordinary signed decimal spelling; transport is canonical i64.
    if operand.is_empty()
        || !operand
            .trim_start_matches(['+', '-'])
            .bytes()
            .all(|b| b.is_ascii_digit())
    {
        return None;
    }
    let digits = operand.trim_start_matches(['+', '-']);
    if digits.len() > 1 && digits.starts_with('0') {
        return None;
    }
    let operand = operand.parse::<i64>().ok()?.to_string();
    Some((name, IntegerAdjustment { operation, operand }))
}

/// Byte positions in a recognized, comment-free assignment.
pub(crate) fn assignment_tokens(source: &str) -> Option<(usize, usize)> {
    parse_assignment(source.trim_start())?;
    let operator = source.find(['+', '-'])?;
    let after_operator = &source[operator + 1..];
    let operand = after_operator
        .strip_prefix('=')
        .unwrap_or(after_operator)
        .trim_start();
    Some((source.len() - operand.len(), operator))
}
