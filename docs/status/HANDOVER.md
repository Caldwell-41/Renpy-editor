# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Completed implementation:** [CI-SIMPLE acceptance/integration](../tasks/archive/2026-09-20-ci-simple-cleanup.md), merged PR #13.
**Next application task:** [Phase 1F only](../tasks/active/phase-1f-source-synchronisation.md); its source-editing behaviours, Gate-E reconciliation, bounds and mandatory regression matrix are now fixed by user approval and omission review.
**Baseline:** Fresh remote main containing merge `998b5f4684c5c287920bfda67d12e818e3bd0371` and the documentation closeout/amendment.
**Planned application branch:** `feature/phase-1f-source-synchronisation`; inspect current refs/PRs before creating or reusing it.

## Completed CI verification and remaining housekeeping

PR #13 was merged with expected reviewed head `1af10328620d2115f22673baf3f1c1050c0e220c`. GitHub returned merge `998b5f46`; its tree matches the reviewed head exactly. The accepted candidate matrix is `35496193908`, attempt 1. Normal post-merge quality run `35497664235` and production run `35497664212`, attempt 1, both passed. The [final PR #13 closeout](https://github.com/Caldwell-41/Renpy-editor/pull/13) records the reviewed native logs: Windows core 128 passed / 0 failed / 4 ignored worker entries; macOS core 134 passed / 0 failed / 4 ignored worker entries; both dedicated SDK gates, packaging, packaged smoke/security and inventory passed. This supersedes the earlier in-progress snapshot. Documentation closeout `80bd3b3d` passed quality run `35497935210`, attempt 1, with 205 repository files checked. Do not redispatch those completed checks or rerun production for this documentation-only amendment.

The user also authorised deleting the merged remote `maintenance/ci-simple-cleanup` branch. The connector used for closeout exposed no branch deletion; the latest inspected branch inventory still contains it. On a client with ordinary Git/GitHub tooling, verify PR #13 is merged and that the current branch tip is an ancestor of current main with no new active dependency; then delete ONLY that remote branch and verify absence. Do not remove local dirty worktrees or unrelated branches. A newer unmerged tip is not authorised for deletion. A suitable GitHub CLI operation after those checks is `gh api --method DELETE repos/Caldwell-41/Renpy-editor/git/refs/heads/maintenance/ci-simple-cleanup`. Record the real outcome or precise limitation; do not claim deletion merely because the PR is closed.

No custom controller, services, permission changes or expanded optimisation work is needed for housekeeping. It is not another repair milestone.

## Start Phase 1F

Read AGENTS.md, [CURRENT](CURRENT.md), [WORKFLOW](../WORKFLOW.md), the 1F brief, the 1F section of the [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md), and relevant source/transaction/UI contracts. Read historical ledgers only for needed evidence.

Fetch actual refs and preserve unrelated changes. No 1F branch existed in the inspected branch inventory; search again before starting. Create the named 1F branch from current main only when matching work does not already exist. Do not start from either maintenance branch or reset a dirty checkout; use a separate worktree when needed. Issuing the next 1F goal selects implementation of 1F only after the recorded entry checks, not 1G/1H or an open-ended Phase 1 goal.

Implement the fixed behaviours in section 1 of the 1F brief; do not reselect the save-invalid, draft lifetime, conflict, grammar, selection, undo, shortcut/status, Save All, Source-scope/encoding/bounds or external-reconciliation policies. In particular preserve the accepted source-model Gate E: never auto-merge, but offer explicit user-confirmed combination only for provably non-overlapping exact patches; overlapping/ambiguous changes write nothing. Record the bounded technical approach/state transitions before wiring writes, extend the existing source/transaction/history boundary, implement Source/Scene synchronisation and selection, then validate the exact candidate against the mandatory regression matrix. Full detail lives in the brief, not another planning checkpoint. Do not replace authoritative .rpy bytes with an editor model or weaken project recovery blocking. These brief amendments add no application code or new native acceptance.

## Stop and return

Self-review the bounded milestone, resolve demonstrated blockers, run cheap checks before the necessary native validation, and inspect actual outcomes rather than badges. Update the 1F ledger, CURRENT and this single HANDOVER with branch/PR/candidate, commands/counts, any unavailable/skipped checks and exact outstanding run/attempt/SHA. Stop at review-ready for independent review; do not merge 1F or start 1G. An awaiting-CI or concrete-blocker handover is also a valid return point.

## Abandoned and preserved

W0/OPT-1A and every corrective pass are [abandoned](../tasks/active/ci-optimisation.md). W1-W3 are not proceeding and OPT-2B is deferred. PR #12, its unique history, other branches and private client state remain untouched. The editor's own transactional persistence/recovery is unrelated and must remain intact.