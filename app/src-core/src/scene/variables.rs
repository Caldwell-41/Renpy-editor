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
            field: "value.operand",
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
                        Some(v) if v.variable_type != VariableType::Int => {
                            Err(ArithmeticUnknown::IncompatibleOperand)
                        }
                        Some(v) => adjustment.formula(authoring, &v.id),
                    };
                    if let Err(reason) = result {
                        beat.assignment = Some(inspection(
                            None,
                            vec![],
                            variable.map(|v| vec![v.id.clone()]).unwrap_or_default(),
                            AssignmentState::Unknown { reason },
                            authoring,
                        ));
                    }
                }
                continue;
            }
            _ => continue,
        };
        let Some(variable) = authoring.variables.iter().find(|v| v.id == *variable_id) else {
            continue;
        };
        let mut reads = Vec::new();
        let state = if value.is_object() {
            let adjustment: IntegerAdjustment =
                serde_json::from_value(value.clone()).expect("recognized formula");
            let formula = adjustment
                .formula(authoring, variable_id)
                .expect("recognized formula");
            formula.reads(&mut reads);
            let result = formula.evaluate(&|id| {
                if nested {
                    return Err(ArithmeticUnknown::UnsupportedControlFlow);
                }
                match values.get(id) {
                    Some(AssignmentState::Known { value }) => value
                        .as_str()
                        .and_then(|v| v.parse().ok())
                        .ok_or(ArithmeticUnknown::IncompatibleOperand),
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
                    value: Value::String(value.to_string()),
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
            Some(variable.variable_type),
            reads,
            vec![variable_id.clone()],
            state.clone(),
            authoring,
        ));
        values.insert(variable_id.clone(), state);
    }
}
