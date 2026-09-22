# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE](../tasks/active/phase-1f-save-correction.md#7-independent-review-follow-up--1f-save-evidence).
**State:** `blocked`; E1-E6 are implemented, automated P5 and native P3 are open.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `fc918ae9c69f451d17e8d93292f7e4980d88356d`.
**Application tree:** `de7821df25cce564d24009026869bdf22fb81b71`.

## Resume here

Read AGENTS.md, CURRENT, section 7 of the 1F-SAVE ledger and ADR 0007. Inspect actual
refs, PR/worktree and execution ownership before acting. Preserve newer work; do not
reset to a quoted SHA or replay completed Phase 1F/1F-SAVE work.

The bounded evidence correction is complete in the application candidate. Smoke-report
success and rejection have distinct terminal paths, the host uses the named 180-second
coarse ceiling and five specified checkpoints, and L3/L8/L9/L16 are closed. A delayed
controller regression exposed one real application defect; the minimal disposed guard
prevents an old barrier completion from mutating replacement DOM. The shell Save owner,
Source/core transactions, reconciliation/history, recovery and renderer privileges are
otherwise retained.

Focused local validation passed repository validation for 215 files, whitespace,
frontend check 28/28 and build. The focused delayed-action red/green was 9 pass/two fail
before the guard and 11/11 after it. Local browser execution was unavailable because
Chromium is absent and local Rust/desktop checks were unavailable because this client
has no Rust toolchain. Repository Quality run `35689830891` passed the exact candidate,
including Rust format/compile/focused report handling; target Preflight passed the
browser red/green test.

## Exact production result

Phase 1 production run `35689869416` (#81) was dispatched once after Repository Quality
and after confirming no equivalent production run was active or ambiguous.

- Preflight `106624364068`: passed.
- Windows x64 `106624505342`: browser, core, official-SDK lifecycle, real-service
  Source gate, desktop boundary and packaging passed; packaged smoke failed.
- macOS ARM64 `106624505374`: the same pre-smoke gates passed; packaged smoke failed.
- Both artifacts contain `pre-source-complete`, `source-complete`,
  `post-source-recovery-complete`, and `post-source-conflict-complete`, followed by
  `packaged boundary smoke report timed out`; neither contains `final-report-start`.
- Secret scan and dependency/licence inventory were skipped on both targets after the
  smoke failure. P5 remains failed.

Earlier diagnostic candidates were not same-SHA reruns: #76 exposed formatting, #77
exposed the macOS modifier and stale conflict copy, #78/#79 localized the terminal
budget, and #80 falsified microtask-only polling. #81 restores task yielding and still
places the cross-platform blocker after conflict. Do not increase the timeout, rerun
`fc918ae9`, split the smoke or redesign Source Save without a separately reviewed,
evidence-based scope decision.

## Outstanding native P3

Trusted native OS input was unavailable. Synthetic renderer events are not P3. Use the
exact packaged candidate and record OS/architecture plus outcomes for this checklist:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat the same three actions with Cmd+S.

The next action is independent review of the P5 terminal evidence and this P3 handoff.
Keep PR #14 draft. Do not merge, begin Phase 1G, create another branch/PR, replay
completed work, or revive W0/OPT-1A.
