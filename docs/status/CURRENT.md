# Current status

**Updated:** 2026-09-22.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active milestone:** [Phase 1F Source synchronisation](../tasks/active/phase-1f-source-synchronisation.md), not ready to merge.
**Selected checkpoint:** [1F-SAVE-EVIDENCE](../tasks/active/phase-1f-save-correction.md#7-independent-review-follow-up--1f-save-evidence), `blocked` on automated P5 and native P3.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, existing draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `628c901d9c5e860656ab0c194bc104ae3c4b760c`; tree `703bb7b747634e88583aa94817afedba6a9ddcd8`.
**Continuation:** [HANDOVER](HANDOVER.md).

## Completed correction

E1-E6 are implemented. Only successful smoke CoreResponses enter the accepted path;
rejection is explicit terminal failure evidence. The final bounded harness correction
uses one named 300-second absolute ceiling and deterministic sequential post-conflict
checkpoint, cleanup, final checkpoint and report ordering. The combined L3
shell case, delayed Discard and Apply Both L8 cases, deterministic L9 observation
suppression/resumption, and semantic Source-controller L16 boundary are closed.

The delayed L8 regressions demonstrated one application defect: a disposed controller
could release an old barrier into replacement DOM. A one-line disposed guard fixed it;
the focused test moved from 9 passing/two failing to 11/11. The shell Save coordinator,
Source/core transaction and reconciliation/history paths, recovery rules, revision
matching and renderer privileges were not changed.

Focused local checks passed repository validation (215 files), whitespace and
JavaScript syntax, frontend check (28/28) and build. Cargo was unavailable locally.
Repository Quality run `35697359981` passed the exact candidate and covered repository
validation; supported-target Preflight supplied Rust format/compile, the focused
smoke-report regression and browser red/green evidence.

## Remaining evidence blockers

Phase 1 production run `35697492679` (#82) ran the exact application candidate.
Preflight job `106647498726` passed. Windows x64 job `106647641203` and macOS ARM64 job
`106647641198` passed browser, core, official-SDK lifecycle, real-service Source
persistence, desktop-boundary and packaging. Both artifacts then recorded
`pre-source-complete`, `source-complete`, `post-source-recovery-complete` and
`post-source-conflict-complete`, but not `final-report-start`, before the 300-second
coarse ceiling. Both packaged smokes failed; artifact secret scan and dependency/licence
inventory were skipped. P5 therefore remains failed.

Because the probe now awaits `post-source-conflict-complete`, the matching terminal
stage shows that the checkpoint reaches the host and is persisted but its IPC response
does not return to JavaScript before the absolute ceiling. This is a packaged harness
blocker after successful Source/core behavior. Do not increase the timeout again,
rerun the same SHA, start another yield experiment, split the smoke automatically or
redesign Source Save. Stop for independent review.

Trusted native input was unavailable, so P3 remains explicitly outstanding. On the
exact packaged candidate, Windows x64 must verify dirty Source Ctrl+S accepts, clean
Source Ctrl+S performs ordinary Flush, and non-Source Ctrl+S does not accept Source;
macOS ARM64 must repeat the same actions with Cmd+S. Synthetic events do not satisfy P3.

Keep PR #14 draft and stop for independent review. Do not merge, start Phase 1G, create
another branch/PR, replay completed 1F work, or revive W0/OPT-1A.
