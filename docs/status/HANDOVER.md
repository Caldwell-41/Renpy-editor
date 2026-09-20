# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Completed implementation:** [CI-SIMPLE acceptance/integration](../tasks/archive/2026-09-20-ci-simple-cleanup.md), merged PR #13.
**Next application task:** [Phase 1F only](../tasks/active/phase-1f-source-synchronisation.md).
**Baseline:** Fresh remote main containing merge `998b5f4684c5c287920bfda67d12e818e3bd0371` and this documentation closeout.
**Planned application branch:** `feature/phase-1f-source-synchronisation`; inspect current refs/PRs before creating or reusing it.

## Finish only the recorded closeout checks

PR #13 was merged with expected reviewed head `1af10328620d2115f22673baf3f1c1050c0e220c`. GitHub returned merge `998b5f46`; its tree matches the reviewed head exactly. The accepted candidate matrix is `35496193908`, attempt 1. The normal post-merge quality run `35497664235`, attempt 1, passed. Normal production run `35497664212`, attempt 1, was in progress at this snapshot: inspect the final exact job/step outcomes and relevant test summaries, or the subsequent PR #13 closeout receipt, without redispatching. If a significant failure exists, address only that demonstrated blocker before 1F. If pending, publish/retain a manual continuation and stop active polling.

The user also authorised deleting the merged remote `maintenance/ci-simple-cleanup` branch. This session could merge but the connector exposes no branch deletion; lookup confirmed the branch remains. On a client with ordinary Git/GitHub tooling, verify PR #13 is merged and that the current branch tip is an ancestor of current main with no new active dependency; then delete ONLY that remote branch and verify absence. Do not remove local dirty worktrees or unrelated branches. A newer unmerged tip is not authorised for deletion. A suitable GitHub CLI operation after those checks is `gh api --method DELETE repos/Caldwell-41/Renpy-editor/git/refs/heads/maintenance/ci-simple-cleanup`. Record the real outcome; do not claim deletion merely because the PR is closed.

No custom controller, services or expanded optimisation work is needed for those checks. They are not another repair milestone.

## Start Phase 1F

Read AGENTS.md, [CURRENT](CURRENT.md), [WORKFLOW](../WORKFLOW.md), the 1F brief, the 1F section of the [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md), and relevant source/transaction/UI contracts. Read historical ledgers only for needed evidence.

Fetch actual refs and preserve unrelated changes. No 1F branch existed in the inspected branch inventory; search again before starting. Create the named 1F branch from current main only when matching work does not already exist. Do not start from either maintenance branch or reset a dirty checkout; use a separate worktree when needed. Issuing the next 1F goal selects implementation of 1F only after the closeout checks above, not 1G/1H or an open-ended Phase 1 goal.

Define the source-buffer/persistence/partial-visual state policy before wiring writes, extend the existing source/transaction/history boundary, implement Source/Scene synchronisation and selection, then validate the exact candidate. Full detailed requirements and test cases live in the brief. Do not replace authoritative .rpy bytes with an editor model or weaken project recovery blocking.

## Stop and return

Self-review the bounded milestone, resolve demonstrated blockers, run cheap checks before the necessary native validation, and inspect actual outcomes rather than badges. Update the 1F ledger, CURRENT and this single HANDOVER with branch/PR/candidate, commands/counts, any unavailable/skipped checks and exact outstanding run/attempt/SHA. Stop at review-ready for independent review; do not merge 1F or start 1G. An awaiting-CI or concrete-blocker handover is also a valid return point.

## Abandoned and preserved

W0/OPT-1A and every corrective pass are [abandoned](../tasks/active/ci-optimisation.md). W1-W3 are not proceeding and OPT-2B is deferred. PR #12, its unique history, other branches and private client state remain untouched. The editor's own transactional persistence/recovery is unrelated and must remain intact.
