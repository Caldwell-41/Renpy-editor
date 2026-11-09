//! Conservative local assignment inspection; declarations never seed current state.
use super::*;
use crate::conditions::arithmetic::{ArithmeticUnknown, IntegerAdjustment};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentInspection {
    pub inferred_result_type: VariableType,
    pub reads: Vec<String>,
    pub writes: Vec<String>,
    pub state: AssignmentState,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase", tag = "status")]
pub enum AssignmentState {
    Known { value: Value },
    Unknown { reason: ArithmeticUnknown },
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
        let BeatPayload::SetVariable { variable_id, value } = &beat.payload else {
            continue;
        };
        let Some(variable) = authoring.variables.iter().find(|v| v.id == *variable_id) else {
            continue;
        };
        let arithmetic = value.is_object();
        let state = if nested {
            AssignmentState::Unknown {
                reason: ArithmeticUnknown::UnsupportedControlFlow,
            }
        } else if arithmetic {
            let current = values
                .get(variable_id)
                .cloned()
                .unwrap_or(AssignmentState::Unknown {
                    reason: unknown.clone(),
                });
            match current {
                AssignmentState::Unknown { reason } => AssignmentState::Unknown { reason },
                AssignmentState::Known { value: current } => {
                    let adjustment: IntegerAdjustment = serde_json::from_value(value.clone())
                        .expect("recognized integer adjustment");
                    match adjustment.evaluate(current.as_str().and_then(|v| v.parse().ok())) {
                        Ok(value) => AssignmentState::Known {
                            value: Value::String(value.to_string()),
                        },
                        Err(reason) => AssignmentState::Unknown { reason },
                    }
                }
            }
        } else {
            AssignmentState::Known {
                value: value.clone(),
            }
        };
        beat.assignment = Some(AssignmentInspection {
            inferred_result_type: variable.variable_type,
            reads: if arithmetic {
                vec![variable_id.clone()]
            } else {
                vec![]
            },
            writes: vec![variable_id.clone()],
            state: state.clone(),
        });
        values.insert(variable_id.clone(), state);
    }
}
