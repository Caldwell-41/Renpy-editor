# Current status

**Updated:** 2026-09-20.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Next application milestone:** [Phase 1F — Source synchronisation and partial-visual handling](../tasks/active/phase-1f-source-synchronisation.md), selected for the user's next goal; not implemented by this closeout.
**Continuation and remaining housekeeping:** [HANDOVER](HANDOVER.md).

## Accepted baseline

Phase 1E PR #9 merged as `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`. PRs #7/#8 and corrected 1A-1D are also integrated; do not replay them. The [Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md) and [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) retain their evidence and requirements.

CI-SIMPLE passed bounded independent review. Production run `35496193908`, attempt 1, genuinely passed preflight, Windows x64 and macOS ARM64 at implementation `eeef503a40af05c3435297e1384f743a58ee1a3e`. The merge tree exactly matches reviewed head `1af10328620d2115f22673baf3f1c1050c0e220c`. The [closeout record](../tasks/archive/2026-09-20-ci-simple-cleanup.md) contains actual counts, skipped-worker interpretation, the corrected frontend build-order failure and validation limits.

Normal post-merge quality run `35497664235`, attempt 1, passed; normal production run `35497664212`, attempt 1, must be checked at the merge SHA before new application implementation. It was in progress at this document's snapshot, not failed or accepted by inference. Use the exact existing run and subsequent PR #13 closeout receipt; no duplicate manual dispatch.

The remote `maintenance/ci-simple-cleanup` branch was not deleted by this session because the available connector has no ref-deletion action. Its retirement is authorised but must be verified after execution; it is housekeeping, not unfinished CI implementation. Other branches and local work are untouched.

## Scope now

Preserve source authority, transactions/recovery, lifecycle/single-instance, SDK trust/handoff, supporting authoring and Scene/source/media boundaries. Phase 1F extends these; 1G/1H and Phase 2+ remain outside the next goal.

[W0 and OPT-1A are abandoned](../tasks/active/ci-optimisation.md), including every Windows/SQLite correction. W1-W3 are not proceeding; OPT-2B remains deferred. PR #12 / `maintenance/ci-optimisation` stays unmerged historical work. Do not resume, import or validate it as a prerequisite.

The closeout publication changes documentation only. No Phase 1F feature, automatic watcher, private client setup, application recovery change or new toolchain was introduced. CURRENT owns current state, HANDOVER owns continuation, and task briefs own detailed implementation/acceptance criteria.
