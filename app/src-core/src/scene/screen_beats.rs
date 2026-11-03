//! Static parameterless screen statements shared by authoring and reconciliation.
use super::*;
use crate::screens::references::ResolvedScreenTarget;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum ScreenStatement {
    Show,
    Hide,
    Call,
}
impl ScreenStatement {
    pub(crate) fn kind(self) -> &'static str {
        match self {
            Self::Show => "showScreen",
            Self::Hide => "hideScreen",
            Self::Call => "callScreen",
        }
    }
    pub(super) fn verb(self) -> &'static str {
        match self {
            Self::Show => "show",
            Self::Hide => "hide",
            Self::Call => "call",
        }
    }
    pub(super) fn owner_kind(self) -> OwnedScreenKind {
        if self == Self::Call {
            OwnedScreenKind::Dialog
        } else {
            OwnedScreenKind::Panel
        }
    }
    pub(super) fn accepts_target(self, target: &ResolvedScreenTarget) -> bool {
        target.kind == self.owner_kind()
            && (self != Self::Call || (target.blocking && !target.effects.unknown))
    }
    pub(super) fn payload(self, target: ScreenTargetBinding) -> BeatPayload {
        match self {
            Self::Show => BeatPayload::ShowScreen {
                target,
                revisions: None,
            },
            Self::Hide => BeatPayload::HideScreen {
                target,
                revisions: None,
            },
            Self::Call => BeatPayload::CallScreen {
                target,
                revisions: None,
            },
        }
    }
}
impl BeatPayload {
    pub(super) fn screen_statement(&self) -> Option<ScreenStatement> {
        match self {
            Self::ShowScreen { .. } => Some(ScreenStatement::Show),
            Self::HideScreen { .. } => Some(ScreenStatement::Hide),
            Self::CallScreen { .. } => Some(ScreenStatement::Call),
            _ => None,
        }
    }
}
