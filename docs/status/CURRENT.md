# Current status

**Updated:** 2026-09-20.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Current maintenance:** [CI-SIMPLE: simple CI and agent-usage cleanup](../tasks/active/ci-simple-cleanup.md).
**State:** `awaiting_ci`; corrected candidate
`eeef503a40af05c3435297e1384f743a58ee1a3e` is published in PR #13. Quality passed;
the one replacement native production run remains in progress.
**Abandoned:** W0 and OPT-1A, including all corrective/Windows/SQLite follow-ups. W1-W3 are not proceeding; OPT-2B is deferred.
**Continuation:** [HANDOVER](HANDOVER.md).

## Preserved application state

Phase 0 and corrected Phase 1A-1D are integrated. Phase 1E Scene authoring PR #9 is merged; do not replay it or PRs #7/#8. The [Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md) retains candidate `a32a790499900d3f3231b3e212a77fab70564e01`, production run `35023049519`, both target results and earlier failures.

Preserve transactions/recovery, lifecycle/single-instance, N1 SDK handoff, supporting authoring and Scene/source/media boundaries. The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and [product roadmap](../ROADMAP.md) remain the application sequence. This cleanup does not authorise Phase 1F or other application features. Preserve separately approved work after inspecting actual refs and PRs.

## Maintenance reset

The [abandonment decision](../tasks/active/ci-optimisation.md) supersedes the old W0-first roadmap and all instructions to complete OPT-1A or review it for W1 entry. PR #12 / `maintenance/ci-optimisation` remains unmerged historical work, not a dependency to finish or import. No test acceptance is inferred from stopping it.

CI-SIMPLE starts from freshly verified integrated main, using `maintenance/ci-simple-cleanup` after checking for existing matching work. It contains ordinary trigger, cheap-preflight, concurrency and optional-upload changes plus compact agent instructions. Native evidence proved the standalone frontend build remains required before desktop tests. No custom orchestration, database, watcher, client bootstrap or evidence-reuse framework.

CI-SIMPLE changes only the existing workflows and concise operating guidance. It has
not been accepted or merged. Production run `35495121351` exposed and retained a
real build-order failure. Replacement run `35496193908`, attempt 1, is the only native
validation for the corrected candidate; do not dispatch a documentation-only rerun.
