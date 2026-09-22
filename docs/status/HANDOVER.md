# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE](../tasks/active/phase-1f-save-correction.md#7-independent-review-follow-up--1f-save-evidence).
**State:** `blocked`; E1-E6 are implemented, automated P5 and native P3 are open.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `628c901d9c5e860656ab0c194bc104ae3c4b760c`.
**Application tree:** `703bb7b747634e88583aa94817afedba6a9ddcd8`.

## Resume here

Read AGENTS.md, CURRENT, section 7 of the 1F-SAVE ledger and ADR 0007. Inspect actual
refs, PR/worktree and execution ownership before acting. Preserve newer work; do not
reset to a quoted SHA or replay completed Phase 1F/1F-SAVE work.

The bounded evidence correction is complete in the application candidate. Smoke-report
success and rejection have distinct terminal paths, the host now uses one named
300-second absolute ceiling and deterministic sequential terminal reporting, and the
five specified checkpoints plus L3/L8/L9/L16 remain intact. A delayed
controller regression exposed one real application defect; the minimal disposed guard
prevents an old barrier completion from mutating replacement DOM. The shell Save owner,
Source/core transactions, reconciliation/history, recovery and renderer privileges are
otherwise retained.

Focused local validation passed repository validation for 215 files, whitespace and
JavaScript syntax, frontend check 28/28 and build. Cargo was unavailable locally.
Repository Quality run `35697359981` passed the exact candidate; target Preflight
passed Rust format/compile, focused report handling and the browser red/green test.

## Exact production result

Phase 1 production run `35697492679` (#82) was dispatched once after Repository Quality
and after confirming no equivalent production run was active or ambiguous.

- Preflight `106647498726`: passed.
- Windows x64 `106647641203`: browser, core, official-SDK lifecycle, real-service
  Source gate, desktop boundary and packaging passed; packaged smoke failed.
- macOS ARM64 `106647641198`: the same pre-smoke gates passed; packaged smoke failed.
- Both artifacts contain `pre-source-complete`, `source-complete`,
  `post-source-recovery-complete`, and `post-source-conflict-complete`, followed by
  `packaged boundary smoke report timed out`; neither contains `final-report-start`.
- Secret scan and dependency/licence inventory were skipped on both targets after the
  smoke failure. P5 remains failed.

Candidate `628c901d` changed only the coarse ceiling from 180 to 300 seconds and restored
sequential ordering: await post-conflict checkpoint, restore the requester in `finally`,
await final checkpoint, then await the report. Because both artifacts persist the
awaited post-conflict checkpoint but never reach the final checkpoint, the demonstrated
blocker is failure to return that checkpoint IPC response to the probe before the
absolute ceiling. Do not increase the timeout again, rerun `628c901d`, start another
microtask/task-yield experiment, split the smoke automatically or modify Source Save.

## Outstanding native P3

Trusted native OS input was unavailable. Synthetic renderer events are not P3. Use the
exact packaged candidate and record OS/architecture plus outcomes for this checklist:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat the same three actions with Cmd+S.

The next action is independent review of the P5 terminal evidence and this P3 handoff.
Keep PR #14 draft. Do not merge, begin Phase 1G, create another branch/PR, replay
completed work, or revive W0/OPT-1A.
