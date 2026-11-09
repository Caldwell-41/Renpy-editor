//! Conservative local assignment inspection; declarations never seed current state.
use super::*;
use crate::conditions::arithmetic::{self, ArithmeticUnknown, IntegerAdjustment};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentInspection {
    pub inferred_result_type: Option<VariableType>,
    pub reads: Vec<String>,
    pub read_variables: Vec<VariableRead>,
    pub writes: Vec<String>,
    pub diagnostics: Vec<AssignmentDiagnostic>,
    pub state: AssignmentState,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VariableRead {
    pub variable_id: String,
    pub technical_name: String,
    pub variable_type: VariableType,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentDiagnostic {
    pub field: &'static str,
    pub reason: ArithmeticUnknown,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase", tag = "status")]
pub enum AssignmentState {
    Known { value: Value },
    Unknown { reason: ArithmeticUnknown },
}
fn inspection(
    kind: Option<VariableType>,
    reads: Vec<String>,
    writes: Vec<String>,
    state: AssignmentState,
    authoring: &AuthoringMetadata,
) -> AssignmentInspection {
    let read_variables = reads
        .iter()
        .filter_map(|id| authoring.variables.iter().find(|v| v.id == *id))
        .map(|v| VariableRead {
            variable_id: v.id.clone(),
            technical_name: v.technical_name.clone(),
            variable_type: v.variable_type,
        })
        .collect();
    let diagnostics = match &state {
        AssignmentState::Unknown { reason } => vec![AssignmentDiagnostic {
            field: if *reason == ArithmeticUnknown::IncompatibleTarget {
                "variableId"
            } else {
                "value.operand"
            },
            reason: reason.clone(),
        }],
        _ => vec![],
    };
    AssignmentInspection {
        inferred_result_type: kind,
        reads,
        read_variables,
        writes,
        diagnostics,
        state,
    }
}
pub(super) fn inspect(beats: &mut [SceneBeat], authoring: &AuthoringMetadata) {
    let mut values = HashMap::<String, AssignmentState>::new();
    let mut unknown = ArithmeticUnknown::UnobservedCurrentValue;
    for beat in beats {
        let nested = beat.owner.is_some() || beat.conditional_branch.is_some();
        let opaque = matches!(&beat.payload, BeatPayload::CustomCode { source, .. } if !source.trim().is_empty() && !source.trim_start().starts_with('#'));
        if nested
            || opaque
            || logic_boundary(&beat.payload)
            || matches!(
                &beat.payload,
                BeatPayload::Choice { .. } | BeatPayload::Jump { .. } | BeatPayload::Return
            )
        {
            values.clear();
            unknown = ArithmeticUnknown::UnsupportedControlFlow;
        }
        let (variable_id, value) = match &beat.payload {
            BeatPayload::SetVariable { variable_id, value } => (variable_id, value),
            BeatPayload::CustomCode { source, .. } => {
                let source = logic::without_comment(source).trim_end();
                if let Some((name, operation, start, _)) = arithmetic::assignment_tokens(source) {
                    let variable = authoring
                        .variables
                        .iter()
                        .find(|v| v.technical_name == name);
                    let adjustment = IntegerAdjustment {
                        operation,
                        operand: source[start..].into(),
                    };
                    let result = match variable {
                        None => Err(ArithmeticUnknown::MissingVariable),
                        Some(v) if !arithmetic::numeric_type(v.variable_type) => {
                            Err(ArithmeticUnknown::IncompatibleOperand)
                        }
                        Some(v) => adjustment.formula(authoring, &v.id),
                    };
                    let kind = result.as_ref().ok().map(|f| f.result_type());
                    let mut reads = Vec::new();
                    let reason = match result {
                        Err(reason) => reason,
                        Ok(formula) => {
                            formula.reads(&mut reads);
                            if variable.is_some_and(|v| v.variable_type == VariableType::Int)
                                && kind == Some(VariableType::Decimal)
                            {
                                ArithmeticUnknown::IncompatibleTarget
                            } else {
                                formula
                                    .evaluate(&|_| Err(ArithmeticUnknown::UnobservedCurrentValue))
                                    .err()
                                    .unwrap_or(ArithmeticUnknown::UnsupportedControlFlow)
                            }
                        }
                    };
                    beat.assignment = Some(inspection(
                        kind,
                        reads,
                        variable.map(|v| vec![v.id.clone()]).unwrap_or_default(),
                        AssignmentState::Unknown { reason },
                        authoring,
                    ));
                }
                continue;
            }
            _ => continue,
        };
        let Some(variable) = authoring.variables.iter().find(|v| v.id == *variable_id) else {
            continue;
        };
        let mut reads = Vec::new();
        let mut kind = variable.variable_type;
        let state = if value.is_object() {
            let adjustment: IntegerAdjustment =
                serde_json::from_value(value.clone()).expect("recognized formula");
            let formula = adjustment
                .formula(authoring, variable_id)
                .expect("recognized formula");
            kind = formula.result_type();
            formula.reads(&mut reads);
            let result = formula.evaluate(&|id| {
                if nested {
                    return Err(ArithmeticUnknown::UnsupportedControlFlow);
                }
                match values.get(id) {
                    Some(AssignmentState::Known { value }) => arithmetic::Numeric::from_json(value),
                    Some(AssignmentState::Unknown { reason }) => Err(reason.clone()),
                    None => Err(unknown.clone()),
                }
            });
            let result = if nested && result.is_ok() {
                Err(ArithmeticUnknown::UnsupportedControlFlow)
            } else {
                result
            };
            match result {
                Ok(value) => AssignmentState::Known {
                    value: value.json(),
                },
                Err(reason) => AssignmentState::Unknown { reason },
            }
        } else if nested {
            AssignmentState::Unknown {
                reason: ArithmeticUnknown::UnsupportedControlFlow,
            }
        } else {
            AssignmentState::Known {
                value: value.clone(),
            }
        };
        beat.assignment = Some(inspection(
            Some(kind),
            reads,
            vec![variable_id.clone()],
            state.clone(),
            authoring,
        ));
        values.insert(variable_id.clone(), state);
    }
}

pub(super) fn draft(
    target: &str,
    value: &Value,
    authoring: &AuthoringMetadata,
    refusal: Option<ArithmeticUnknown>,
) -> AssignmentInspection {
    let mut reads = Vec::new();
    let formula = serde_json::from_value::<IntegerAdjustment>(value.clone())
        .map_err(|_| ArithmeticUnknown::InvalidOperand)
        .and_then(|a| a.formula(authoring, target));
    let kind = formula.as_ref().ok().map(|f| f.result_type());
    let result = formula.and_then(|f| {
        f.reads(&mut reads);
        f.evaluate(&|_| Err(ArithmeticUnknown::UnobservedCurrentValue))
    });
    let refusal = if refusal == Some(ArithmeticUnknown::NonFiniteResult) {
        result.as_ref().err().cloned().or(refusal)
    } else {
        refusal
    };
    let state = match refusal.or_else(|| result.as_ref().err().cloned()) {
        Some(reason) => AssignmentState::Unknown { reason },
        None => AssignmentState::Known {
            value: result.unwrap().json(),
        },
    };
    inspection(
        kind,
        reads,
        authoring
            .variables
            .iter()
            .filter(|v| v.id == target)
            .map(|v| v.id.clone())
            .collect(),
        state,
        authoring,
    )
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentDraftValidation {
    pub target_variable_id: String,
    pub value: Value,
    pub support: AssignmentSupport,
    pub assignment: AssignmentInspection,
    pub project_revision: String,
    pub source_map_revision: String,
    pub authoring_revision: String,
    pub source_revision: String,
    pub variables: Vec<crate::authoring::Variable>,
    pub capabilities: AssignmentCapabilities,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AssignmentSupport {
    Supported,
    Refused,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentCapabilities {
    pub operators: Vec<&'static str>,
    pub operations: Vec<arithmetic::IntegerOperation>,
    pub max_bytes: usize,
    pub max_nodes: usize,
    pub max_depth: usize,
    pub integer_transport: &'static str,
    pub decimal_transport: &'static str,
    pub functions: bool,
}
impl Default for AssignmentCapabilities {
    fn default() -> Self {
        use arithmetic::IntegerOperation::*;
        Self {
            operators: vec!["+", "-", "*", "/", "//", "%"],
            operations: vec![
                Assign,
                Add,
                Subtract,
                Multiply,
                Divide,
                FloorDivide,
                Remainder,
            ],
            max_bytes: crate::conditions::MAX_EXPRESSION_BYTES,
            max_nodes: crate::conditions::MAX_EXPRESSION_NODES,
            max_depth: crate::conditions::MAX_EXPRESSION_DEPTH,
            integer_transport: "signedI64String",
            decimal_transport: "finiteFloat64",
            functions: false,
        }
    }
}
