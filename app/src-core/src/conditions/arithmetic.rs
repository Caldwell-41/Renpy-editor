//! Bounded shared numeric formulas. Never executes Python.
use super::*;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum IntegerOperation {
    Assign,
    Add,
    Subtract,
    Multiply,
    Divide,
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
    NonFiniteResult,
    InvalidOperand,
    InvalidSyntax,
    MissingVariable,
    IncompatibleOperand,
    IncompatibleTarget,
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
        if !numeric_type(variable.variable_type) {
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
            Self::Divide => "/",
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
    pub(crate) fn result_type(&self) -> VariableType {
        match self {
            Self::Atom(Expression::Variable { variable_type, .. }) => *variable_type,
            Self::Atom(Expression::Decimal { .. }) => VariableType::Decimal,
            Self::Negate(v) => v.result_type(),
            Self::Binary(op, l, r)
                if *op == IntegerOperation::Divide
                    || l.result_type() == VariableType::Decimal
                    || r.result_type() == VariableType::Decimal =>
            {
                VariableType::Decimal
            }
            _ => VariableType::Int,
        }
    }
    pub(crate) fn evaluate(
        &self,
        value: &impl Fn(&str) -> Result<Numeric, ArithmeticUnknown>,
    ) -> Result<Numeric, ArithmeticUnknown> {
        match self {
            Self::Atom(Expression::Int { value }) => value
                .parse()
                .map(Numeric::Int)
                .map_err(|_| ArithmeticUnknown::IntegerOverflow),
            Self::Atom(Expression::Decimal { value }) => Numeric::decimal(
                value
                    .parse()
                    .map_err(|_| ArithmeticUnknown::InvalidOperand)?,
            ),
            Self::Atom(Expression::Variable { variable_id, .. }) => value(variable_id),
            Self::Negate(v) => match v.evaluate(value)? {
                Numeric::Int(v) => v
                    .checked_neg()
                    .map(Numeric::Int)
                    .ok_or(ArithmeticUnknown::IntegerOverflow),
                Numeric::Decimal(v) => Numeric::decimal(-v),
            },
            Self::Binary(op, l, r) => {
                let l = l.evaluate(value);
                let r = r.evaluate(value);
                if matches!(
                    op,
                    IntegerOperation::Divide
                        | IntegerOperation::FloorDivide
                        | IntegerOperation::Remainder
                ) && r.as_ref().is_ok_and(|v| v.float() == 0.0)
                {
                    return Err(ArithmeticUnknown::ZeroDivisor);
                }
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
                calculate(*op, l?, r?)
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
                Some([b'/', ..]) => (IntegerOperation::Divide, 1, 2),
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
            if self
                .source
                .get(self.at)
                .is_some_and(|c| c.is_ascii_digit() || *c == b'.')
            {
                return self.integer(ch == b'-');
            }
            let operand = self.atom(depth + 1)?;
            return if ch == b'-' {
                self.node(Formula::Negate(Box::new(operand)))
            } else {
                Ok(operand)
            };
        }
        if ch.is_ascii_digit() || ch == b'.' {
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
            if !numeric_type(variable.variable_type) {
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
        if self.source.get(self.at) == Some(&b'.') {
            self.at += 1;
            while self.source.get(self.at).is_some_and(u8::is_ascii_digit) {
                self.at += 1;
            }
        }
        if self
            .source
            .get(self.at)
            .is_some_and(|c| matches!(c, b'e' | b'E'))
        {
            self.at += 1;
            if self
                .source
                .get(self.at)
                .is_some_and(|c| matches!(c, b'+' | b'-'))
            {
                self.at += 1;
            }
            let exponent = self.at;
            while self.source.get(self.at).is_some_and(u8::is_ascii_digit) {
                self.at += 1;
            }
            if self.at == exponent {
                return Err(ArithmeticUnknown::InvalidSyntax);
            }
        }
        let digits = std::str::from_utf8(&self.source[start..self.at]).unwrap();
        if digits.contains(['.', 'e', 'E']) {
            let signed = format!("{}{digits}", if negative { "-" } else { "" });
            let number = signed
                .parse::<f64>()
                .map_err(|_| ArithmeticUnknown::InvalidSyntax)?;
            Numeric::decimal(number)?;
            return self.node(Formula::Atom(Expression::Decimal {
                value: crate::authoring::decimal_literal(number),
            }));
        }
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
        ("/=", IntegerOperation::Divide),
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

pub(crate) fn numeric_type(kind: VariableType) -> bool {
    matches!(kind, VariableType::Int | VariableType::Decimal)
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) enum Numeric {
    Int(i64),
    Decimal(f64),
}
impl Numeric {
    pub(crate) fn decimal(v: f64) -> Result<Self, ArithmeticUnknown> {
        if v.is_finite() {
            Ok(Self::Decimal(v))
        } else {
            Err(ArithmeticUnknown::NonFiniteResult)
        }
    }
    pub(crate) fn float(self) -> f64 {
        match self {
            Self::Int(v) => v as f64,
            Self::Decimal(v) => v,
        }
    }
    pub(crate) fn json(self) -> Value {
        match self {
            Self::Int(v) => Value::String(v.to_string()),
            Self::Decimal(v) => crate::authoring::decimal_value(v),
        }
    }
    pub(crate) fn from_json(v: &Value) -> Result<Self, ArithmeticUnknown> {
        if v.as_str() == Some("-0.0") {
            return Ok(Self::Decimal(-0.0));
        }
        if let Some(s) = v.as_str() {
            s.parse()
                .map(Self::Int)
                .map_err(|_| ArithmeticUnknown::IncompatibleOperand)
        } else {
            v.as_f64()
                .ok_or(ArithmeticUnknown::IncompatibleOperand)
                .and_then(Self::decimal)
        }
    }
    pub(crate) fn compare(self, other: Self) -> std::cmp::Ordering {
        match (self, other) {
            (Self::Int(a), Self::Int(b)) => a.cmp(&b),
            (Self::Decimal(a), Self::Decimal(b)) => a.partial_cmp(&b).expect("finite"),
            (Self::Int(a), Self::Decimal(b)) => compare_int_float(a, b),
            (Self::Decimal(a), Self::Int(b)) => compare_int_float(b, a).reverse(),
        }
    }
}
// Compare in integer space before considering a fractional tail. Never round the i64.
fn compare_int_float(a: i64, b: f64) -> std::cmp::Ordering {
    use std::cmp::Ordering::*;
    if b >= 9223372036854775808.0 {
        return Less;
    }
    if b < -9223372036854775808.0 {
        return Greater;
    }
    match a.cmp(&(b as i64)) {
        Equal if b.fract() > 0.0 => Less,
        Equal if b.fract() < 0.0 => Greater,
        order => order,
    }
}
fn calculate(op: IntegerOperation, l: Numeric, r: Numeric) -> Result<Numeric, ArithmeticUnknown> {
    use IntegerOperation::*;
    if let (Numeric::Int(l), Numeric::Int(r)) = (l, r) {
        if op == Divide {
            return Numeric::decimal(integer_ratio(l, r));
        }
        let result = match op {
            Add => l.checked_add(r),
            Subtract => l.checked_sub(r),
            Multiply => l.checked_mul(r),
            FloorDivide | Remainder => {
                let (l, r) = (i128::from(l), i128::from(r));
                let (mut q, mut rem) = (l / r, l % r);
                if rem != 0 && (rem < 0) != (r < 0) {
                    q -= 1;
                    rem += r;
                }
                i64::try_from(if op == FloorDivide { q } else { rem }).ok()
            }
            _ => return Err(ArithmeticUnknown::InvalidOperand),
        };
        return result
            .map(Numeric::Int)
            .ok_or(ArithmeticUnknown::IntegerOverflow);
    }
    let (l, r) = (l.float(), r.float());
    let result = match op {
        Add => l + r,
        Subtract => l - r,
        Multiply => l * r,
        Divide => l / r,
        FloorDivide | Remainder => {
            let mut rem = l % r;
            let mut q = (l - rem) / r;
            if rem != 0.0 {
                if (rem < 0.0) != (r < 0.0) {
                    rem += r;
                    q -= 1.0;
                }
            } else {
                rem = 0.0_f64.copysign(r);
            }
            let floor = if q == 0.0 {
                0.0_f64.copysign(l / r)
            } else {
                let floor = q.floor();
                if q - floor > 0.5 {
                    floor + 1.0
                } else {
                    floor
                }
            };
            if op == FloorDivide {
                floor
            } else {
                rem
            }
        }
        Assign => return Err(ArithmeticUnknown::InvalidOperand),
    };
    Numeric::decimal(result)
}
// Correctly round an i64 ratio to binary64, ties to even. The normalized
// numerator has at most 117 bits, so u128 retains the exact rounding remainder.
fn integer_ratio(l: i64, r: i64) -> f64 {
    if l == 0 {
        return 0.0_f64.copysign(r as f64);
    }
    let (a, b) = (u128::from(l.unsigned_abs()), u128::from(r.unsigned_abs()));
    let mut exponent = (128 - a.leading_zeros()) as i32 - (128 - b.leading_zeros()) as i32;
    if if exponent >= 0 {
        a < (b << exponent)
    } else {
        (a << -exponent) < b
    } {
        exponent -= 1;
    }
    let shift = 52 - exponent;
    let (numerator, denominator) = if shift >= 0 {
        (a << shift, b)
    } else {
        (a, b << -shift)
    };
    let (mut q, rem) = (numerator / denominator, numerator % denominator);
    if rem * 2 > denominator || rem * 2 == denominator && q & 1 == 1 {
        q += 1;
    }
    let magnitude = (q as f64) * 2.0_f64.powi(exponent - 52);
    if (l < 0) != (r < 0) {
        -magnitude
    } else {
        magnitude
    }
}
