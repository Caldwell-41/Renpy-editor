# Current status

**Updated:** 2026-09-20.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active application milestone:** [Phase 1F — Source synchronisation and partial-visual handling](../tasks/active/phase-1f-source-synchronisation.md), `in_progress` on `feature/phase-1f-source-synchronisation`, draft PR #14. Entry checks and the bounded technical approach are published at candidate `6a593cffd6b32109e88a5c56b6925f955c3fb13c`; application implementation has not started in the published candidate.
**Continuation:** [HANDOVER](HANDOVER.md).

## Accepted baseline

Phase 1E PR #9 merged as `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`. PRs #7/#8 and corrected 1A-1D are also integrated; do not replay them. The [Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md) and [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) retain their evidence and requirements.

CI-SIMPLE passed bounded independent review. Production run `35496193908`, attempt 1, genuinely passed preflight, Windows x64 and macOS ARM64 at implementation `eeef503a40af05c3435297e1384f743a58ee1a3e`. The merge tree exactly matches reviewed head `1af10328620d2115f22673baf3f1c1050c0e220c`. The [closeout record](../tasks/archive/2026-09-20-ci-simple-cleanup.md) contains actual counts, skipped-worker interpretation, the corrected frontend build-order failure and validation limits.

Normal post-merge quality run `35497664235` and production run `35497664212`,
attempt 1, both passed at the merge SHA. The final PR #13 closeout records the
reviewed results; do not duplicate either dispatch.

The merged remote `maintenance/ci-simple-cleanup` branch was verified at PR #13's reviewed head, confirmed as an ancestor of current main, deleted with ordinary GitHub tooling, and verified absent during Phase 1F entry. Other branches and local work are untouched.

## Scope now

Preserve source authority, transactions/recovery, lifecycle/single-instance, SDK trust/handoff, supporting authoring and Scene/source/media boundaries. Phase 1F extends these; 1G/1H and Phase 2+ remain outside the next goal.

[W0 and OPT-1A are abandoned](../tasks/active/ci-optimisation.md), including every Windows/SQLite correction. W1-W3 are not proceeding; OPT-2B remains deferred. PR #12 / `maintenance/ci-optimisation` stays unmerged historical work. Do not resume, import or validate it as a prerequisite.

The Phase 1F branch currently changes documentation only. No Source feature,
automatic watcher, private client setup, application recovery change or new toolchain
is present in the published candidate. CURRENT owns current state, HANDOVER owns the
interrupted continuation, and the task brief owns the approved implementation and
acceptance criteria.
