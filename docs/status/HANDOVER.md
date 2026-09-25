# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**State:** Phase 1G planning amendment reviewed, accepted and integrated; implementation
of all three 1G checkpoints remains `not_started`. Phase 1F is closed.
**Continuation branch:** `main`.
**Merged planning PR:** [#16](https://github.com/Caldwell-41/Renpy-editor/pull/16).
**Verified merge:** `5266e55f2a93f2e2df5564c87c6738fd0ef3e2d8`.
**Reviewed planning head:** `f8e8e9b7407c0201997aa8dd0e3ecdabc1cde801`.
**Verified tree:** `48499e2af744bff8e5a40eda0996cbdbd082c7e3`, identical on the reviewed
head and merge. This status closeout changes documentation only after that merge.
**Authority:** the user requested review against our chat decisions, merge if clear,
and a prompt to start 1G. No implementation was selected for this review turn.

## Review outcome and retained scope

No blocking discrepancy remained in the twelve-path documentation PR. Reviewed the
whole planning delta against the accepted decisions and checked actual refs, PR state,
reviews/comments, local ownership, canonical scope and testing contracts.

- New Git status/diff/checkpoints are deferred as optional GIT.1/GIT.2; not a Phase 1
  or Phase 2-entry requirement. Existing optional project-creation init remains.
- 1G contains 1G.1 Branches, 1G.2a runtime foundation, 1G.2b runtime UI/diagnostics.
- During play, supported script edits/saves and references to existing assets are
  allowed; asset file/inventory mutations require Stop, including compound/history
  operations. Use Ren'Py's supported reload behaviour; no asset hot reload or snapshot.
- Shared flow, existing Save/input preparation, revision-aware diagnostics, bounded
  graph work and real-service IPC/package tests remain explicit requirements.
- Agents own development tests and early R1 Windows/macOS process proof. One focused
  human session per platform is reserved for final 1G; 1H reuses mapped human evidence
  under TESTING rather than automatically requesting another complete session.
- Preserve accepted 1F Save/F4 evidence and automated regressions. Phase 2 plan unchanged.

Canonical detail: [1G brief](../tasks/active/phase-1g-branches-runtime-git.md),
[optional Git](../tasks/active/optional-local-git.md),
[TESTING ownership/cadence](../TESTING.md#phase-1g-testing-ownership-and-cadence), and
[1H](../tasks/active/phase-1h-vertical-slice-acceptance.md).

## Validation and integration

`python3 scripts/validate.py` passed for 224 repository files; complete PR whitespace
and local Markdown anchor checks passed. GitHub Validate repository succeeded for the
reviewed head: [run 36101165196](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36101165196),
job `107963755342`. There were no open review comments or submitted change requests.
Merged with the expected head bound to the request and verified the exact resulting
tree on main. No application, SDK, package or physical tests were run, no production
workflow was dispatched, and no CI trigger change was made. Automatic repository-quality
runs on main are separate executions, not inferred passes from the PR result.

This closeout updates live status and continuation after actual integration; it does
not chase its own SHA. No branches or tags were deleted. Unrelated open PRs/history
and cross-host worktrees remain preserved. A historical planning branch is not the
implementation branch for 1G.

## Accepted application baseline

Phase 1F remains integrated through PR #14 at
`973e3565d7cf41c6dca936df088ced10969821ac`. Original Save passes on #87 and native
F4 A/B/C on Windows/macOS remain accepted, with their recorded provenance limits.
Post-merge production `35821582755` passed and is closed. The archived
[final review 7.29](../tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review)
and [post-merge evidence 7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#730-post-merge-production-evidence-closeout)
retain exact candidates/results, failures and branch dispositions. DIST-MAC-01 remains
a later distribution limitation. Do not reopen 1F or repeat its manual suite by default.

## Next bounded checkpoint

Select [1G.1 — shared flow projection and Branches](../tasks/active/phase-1g-branches-runtime-git.md#4-1g1--shared-flow-projection-and-branches)
only. Read AGENTS, WORKFLOW, CURRENT, this handover, the parent plan and 1G brief.
Inspect fresh main/refs/PRs/worktree ownership; reuse matching newer work if present,
otherwise create `feature/phase-1g-branches-runtime` from verified main. No matching
implementation branch/PR existed at this review. Record actual ownership on entry.

Implement/review the shared projection and Branches using existing Scene commands,
Source mapping and transaction authority. Preserve drafts, Source Save, review identity,
recovery and session guards. Follow targeted agent-run G1 checks and TESTING cadence;
record deferred final native evidence honestly, without requesting user physical tests
or dispatching a full package matrix for this checkpoint. Do not implement runtime,
optional Git or Phase 2. Publish the checkpoint ledger and this handover, then stop.
