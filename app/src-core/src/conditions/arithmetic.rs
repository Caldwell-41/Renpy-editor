//! Bounded shared whole-number formulas. Never executes Python.
use super::*;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum IntegerOperation {
    Assign,
    Add,
    Subtract,
    Multiply,
    FloorDivide,
    Remainder,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct IntegerAdjustment {
    pub operation: IntegerOperation,
    pub operand: String,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) enum Formula {
    Atom(Expression),
    Negate(Box<Formula>),
    Binary(IntegerOperation, Box<Formula>, Box<Formula>),
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ArithmeticUnknown {
    UnobservedCurrentValue,
    UnsupportedControlFlow,
    IntegerOverflow,
    InvalidOperand,
    InvalidSyntax,
    MissingVariable,
    IncompatibleOperand,
    ZeroDivisor,
    LimitExceeded,
}

impl IntegerAdjustment {
    pub fn operator(&self) -> &'static str {
        self.operation.operator()
    }
    pub(crate) fn formula(
        &self,
        authoring: &AuthoringMetadata,
        target: &str,
    ) -> Result<Formula, ArithmeticUnknown> {
        let right = parse(&self.operand, authoring)?;
        if self.operation == IntegerOperation::Assign {
            return Ok(right);
        }
        let variable = authoring
            .variables
            .iter()
            .find(|v| v.id == target)
            .ok_or(ArithmeticUnknown::MissingVariable)?;
        if variable.variable_type != VariableType::Int {
            return Err(ArithmeticUnknown::IncompatibleOperand);
        }
        Ok(Formula::Binary(
            self.operation,
            Box::new(Formula::Atom(Expression::Variable {
                variable_id: target.into(),
                variable_type: variable.variable_type,
            })),
            Box::new(right),
        ))
    }
}
impl IntegerOperation {
    pub fn operator(self) -> &'static str {
        match self {
            Self::Assign => "",
            Self::Add => "+",
            Self::Subtract => "-",
            Self::Multiply => "*",
            Self::FloorDivide => "//",
            Self::Remainder => "%",
        }
    }
}
impl Formula {
    pub(crate) fn reads(&self, out: &mut Vec<String>) {
        match self {
            Self::Atom(Expression::Variable { variable_id, .. }) => {
                if !out.contains(variable_id) {
                    out.push(variable_id.clone());
                }
            }
            Self::Negate(v) => v.reads(out),
            Self::Binary(_, l, r) => {
                l.reads(out);
                r.reads(out);
            }
            _ => {}
        }
    }
    pub(crate) fn evaluate(
        &self,
        value: &impl Fn(&str) -> Result<i64, ArithmeticUnknown>,
    ) -> Result<i64, ArithmeticUnknown> {
        match self {
            Self::Atom(Expression::Int { value }) => value
                .parse()
                .map_err(|_| ArithmeticUnknown::IntegerOverflow),
            Self::Atom(Expression::Variable { variable_id, .. }) => value(variable_id),
            Self::Negate(v) => v
                .evaluate(value)?
                .checked_neg()
                .ok_or(ArithmeticUnknown::IntegerOverflow),
            Self::Binary(op, l, r) => {
                let l = l.evaluate(value);
                let r = r.evaluate(value);
                if matches!(
                    op,
                    IntegerOperation::FloorDivide | IntegerOperation::Remainder
                ) && r == Ok(0)
                {
                    return Err(ArithmeticUnknown::ZeroDivisor);
                }
                // Determinable calculation errors remain visible beside unknown state.
                for result in [&l, &r] {
                    if let Err(reason) = result {
                        if !matches!(
                            reason,
                            ArithmeticUnknown::UnobservedCurrentValue
                                | ArithmeticUnknown::UnsupportedControlFlow
                        ) {
                            return Err(reason.clone());
                        }
                    }
                }
                let l = l?;
                let r = r?;
                match op {
                    IntegerOperation::Add => l.checked_add(r),
                    IntegerOperation::Subtract => l.checked_sub(r),
                    IntegerOperation::Multiply => l.checked_mul(r),
                    IntegerOperation::FloorDivide | IntegerOperation::Remainder => {
                        if r == 0 {
                            return Err(ArithmeticUnknown::ZeroDivisor);
                        }
                        // i128 avoids the MIN / -1 trap; Python remainder there is zero.
                        let (l, r) = (i128::from(l), i128::from(r));
                        let mut q = l / r;
                        let mut rem = l % r;
                        if rem != 0 && (rem < 0) != (r < 0) {
                            q -= 1;
                            rem += r;
                        }
                        i64::try_from(if *op == IntegerOperation::FloorDivide {
                            q
                        } else {
                            rem
                        })
                        .ok()
                    }
                    IntegerOperation::Assign => return Err(ArithmeticUnknown::InvalidOperand),
                }
                .ok_or(ArithmeticUnknown::IntegerOverflow)
            }
            _ => Err(ArithmeticUnknown::IncompatibleOperand),
        }
    }
}

pub(crate) fn parse(
    source: &str,
    authoring: &AuthoringMetadata,
) -> Result<Formula, ArithmeticUnknown> {
    if source.len() > MAX_EXPRESSION_BYTES {
        return Err(ArithmeticUnknown::LimitExceeded);
    }
    let mut parser = FormulaParser {
        source: source.as_bytes(),
        at: 0,
        nodes: 0,
        authoring,
    };
    let result = parser.expression(0, 0)?;
    parser.space();
    if parser.at != parser.source.len() {
        return Err(ArithmeticUnknown::InvalidSyntax);
    }
    let mut pending = vec![(&result, 1)];
    while let Some((node, depth)) = pending.pop() {
        if depth > MAX_EXPRESSION_DEPTH {
            return Err(ArithmeticUnknown::LimitExceeded);
        }
        match node {
            Formula::Binary(_, l, r) => {
                pending.push((l, depth + 1));
                pending.push((r, depth + 1));
            }
            Formula::Negate(v) => pending.push((v, depth + 1)),
            Formula::Atom(v) => {
                validate_expression(v).map_err(|_| ArithmeticUnknown::InvalidOperand)?
            }
        }
    }
    Ok(result)
}
struct FormulaParser<'a> {
    source: &'a [u8],
    at: usize,
    nodes: usize,
    authoring: &'a AuthoringMetadata,
}
impl FormulaParser<'_> {
    fn space(&mut self) {
        while self
            .source
            .get(self.at)
            .is_some_and(|c| matches!(c, b' ' | b'\t'))
        {
            self.at += 1;
        }
    }
    fn node(&mut self, node: Formula) -> Result<Formula, ArithmeticUnknown> {
        self.nodes += 1;
        if self.nodes > MAX_EXPRESSION_NODES {
            return Err(ArithmeticUnknown::LimitExceeded);
        }
        Ok(node)
    }
    fn expression(&mut self, precedence: u8, depth: usize) -> Result<Formula, ArithmeticUnknown> {
        if depth > MAX_EXPRESSION_DEPTH {
            return Err(ArithmeticUnknown::LimitExceeded);
        }
        self.space();
        let mut left = self.atom(depth + 1)?;
        loop {
            self.space();
            let (op, width, rank) = match self.source.get(self.at..) {
                Some([b'+', ..]) => (IntegerOperation::Add, 1, 1),
                Some([b'-', ..]) => (IntegerOperation::Subtract, 1, 1),
                Some([b'*', ..]) => (IntegerOperation::Multiply, 1, 2),
                Some([b'/', b'/', ..]) => (IntegerOperation::FloorDivide, 2, 2),
                Some([b'%', ..]) => (IntegerOperation::Remainder, 1, 2),
                _ => break,
            };
            if rank < precedence {
                break;
            }
            self.at += width;
            let right = self.expression(rank + 1, depth + 1)?;
            left = self.node(Formula::Binary(op, Box::new(left), Box::new(right)))?;
        }
        Ok(left)
    }
    fn atom(&mut self, depth: usize) -> Result<Formula, ArithmeticUnknown> {
        if depth > MAX_EXPRESSION_DEPTH {
            return Err(ArithmeticUnknown::LimitExceeded);
        }
        self.space();
        let ch = *self
            .source
            .get(self.at)
            .ok_or(ArithmeticUnknown::InvalidSyntax)?;
        if ch == b'+' || ch == b'-' {
            self.at += 1;
            self.space();
            // Fold a signed decimal token to permit i64::MIN without a positive overflow.
            if self.source.get(self.at).is_some_and(u8::is_ascii_digit) {
                return self.integer(ch == b'-');
            }
            let operand = self.atom(depth + 1)?;
            return if ch == b'-' {
                self.node(Formula::Negate(Box::new(operand)))
            } else {
                Ok(operand)
            };
        }
        if ch.is_ascii_digit() {
            return self.integer(false);
        }
        if ch == b'(' {
            self.at += 1;
            let value = self.expression(0, depth + 1)?;
            self.space();
            if self.source.get(self.at) != Some(&b')') {
                return Err(ArithmeticUnknown::InvalidSyntax);
            }
            self.at += 1;
            return Ok(value);
        }
        if ch.is_ascii_alphabetic() || ch == b'_' {
            let start = self.at;
            self.at += 1;
            while self
                .source
                .get(self.at)
                .is_some_and(|c| c.is_ascii_alphanumeric() || *c == b'_')
            {
                self.at += 1;
            }
            let name = std::str::from_utf8(&self.source[start..self.at]).unwrap();
            let variable = self
                .authoring
                .variables
                .iter()
                .find(|v| v.technical_name == name)
                .ok_or(ArithmeticUnknown::MissingVariable)?;
            if variable.variable_type != VariableType::Int {
                return Err(ArithmeticUnknown::IncompatibleOperand);
            }
            return self.node(Formula::Atom(Expression::Variable {
                variable_id: variable.id.clone(),
                variable_type: variable.variable_type,
            }));
        }
        Err(ArithmeticUnknown::InvalidSyntax)
    }
    fn integer(&mut self, negative: bool) -> Result<Formula, ArithmeticUnknown> {
        let start = self.at;
        while self.source.get(self.at).is_some_and(u8::is_ascii_digit) {
            self.at += 1;
        }
        let digits = std::str::from_utf8(&self.source[start..self.at]).unwrap();
        if digits.len() > 1 && digits.starts_with('0') {
            return Err(ArithmeticUnknown::InvalidSyntax);
        }
        let signed = format!("{}{digits}", if negative { "-" } else { "" });
        let value = signed
            .parse::<i64>()
            .map_err(|_| ArithmeticUnknown::IntegerOverflow)?
            .to_string();
        self.node(Formula::Atom(Expression::Int { value }))
    }
}

/// Story adapter: positions refer to the original comment-free bytes.
pub(crate) fn assignment_tokens_raw(
    source: &str,
) -> Option<(&str, IntegerOperation, usize, usize)> {
    let mut at = source.len() - source.trim_start().len();
    if source.as_bytes().get(at) != Some(&b'$') {
        return None;
    }
    at += 1;
    at += source[at..].len() - source[at..].trim_start().len();
    let start = at;
    while source
        .as_bytes()
        .get(at)
        .is_some_and(|c| c.is_ascii_alphanumeric() || *c == b'_')
    {
        at += 1;
    }
    let name = &source[start..at];
    if name.is_empty() || name.as_bytes()[0].is_ascii_digit() {
        return None;
    }
    at += source[at..].len() - source[at..].trim_start().len();
    let operator_start = at;
    let (operation, width) = [
        ("+=", IntegerOperation::Add),
        ("-=", IntegerOperation::Subtract),
        ("*=", IntegerOperation::Multiply),
        ("//=", IntegerOperation::FloorDivide),
        ("%=", IntegerOperation::Remainder),
        ("=", IntegerOperation::Assign),
    ]
    .into_iter()
    .find_map(|(token, op)| source[at..].starts_with(token).then_some((op, token.len())))?;
    at += width;
    at += source[at..].len() - source[at..].trim_start().len();
    Some((name, operation, at, operator_start))
}
pub(crate) fn assignment_tokens(source: &str) -> Option<(&str, IntegerOperation, usize, usize)> {
    let (name, operation, at, operator_start) = assignment_tokens_raw(source)?;
    // Preserve #92's public self +/- literal representation and narrow operand patch.
    if operation == IntegerOperation::Assign {
        if let Some(rest) = source[at..].strip_prefix(name) {
            let rest = rest.trim_start();
            if let Some(sign) = rest.chars().next().filter(|c| *c == '+' || *c == '-') {
                let operand = rest[1..].trim();
                if operand.parse::<i64>().is_ok() && !operand.is_empty() {
                    let op_at = source.len() - rest.len();
                    return Some((
                        name,
                        if sign == '+' {
                            IntegerOperation::Add
                        } else {
                            IntegerOperation::Subtract
                        },
                        source.len() - operand.len(),
                        op_at,
                    ));
                }
            }
        }
    }
    Some((name, operation, at, operator_start))
}
pub(crate) fn parse_assignment<'a>(
    source: &'a str,
    authoring: &AuthoringMetadata,
) -> Option<(&'a str, IntegerAdjustment)> {
    let (name, operation, start, _) = assignment_tokens(source)?;
    let mut operand = source[start..].trim().to_owned();
    let formula = parse(&operand, authoring).ok()?;
    if let Formula::Atom(Expression::Int { value }) = formula {
        operand = value;
    }
    Some((name, IntegerAdjustment { operation, operand }))
}
