# Current status

**Updated:** 2026-09-19.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Maintenance branch:** `maintenance/ci-optimisation`, PR #12; main still holds the planning baseline.
**Checkpoint:** W0 investigation and review complete for user consideration; automatic
wait/wake remains no-go/unqualified for the path examined. Later checkpoints not started.
**Continuation:** [HANDOVER](HANDOVER.md).

## Preserved application state

Phase 0 and corrected Phase 1A-1D are integrated. Phase 1E PR #9 is merged; do not
replay it or PRs #7/#8. The [Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md)
retains candidate `a32a790499900d3f3231b3e212a77fab70564e01`, production run `35023049519`,
both supported-target results and earlier failures. Preserve transactions/recovery,
lifecycle/single-instance, N1 SDK handoff, supporting authoring and Scene/source/media.

The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and
[roadmap](../ROADMAP.md) remain the product sequence. This maintenance review does
not authorise Phase 1F or other application work. Keep unrelated active work intact.

## W0 review and privacy addition

The [qualification report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md) distinguishes
original reported local observations, public source evidence and unperformed live tests.
External owning-runtime reconciliation/telemetry and ownership-safe goal restoration
were not established. This is not a universal claim that all clients lack those APIs.
Loaded/unloaded wake-up and zero-autonomous-inference tests remain unperformed.

The user's additional local-only policy is implemented through
[LOCAL_CODEX_CONFIG](../LOCAL_CODEX_CONFIG.md), a blank template, a non-network bootstrap,
Git-index/privacy checks and synthetic regressions. Each actual client must initialise
and revalidate its own local settings. No real client was set up by this review sandbox.
No CI controller, watcher, queue bridge, service or evidence-reuse implementation exists.

W0 review/local privacy work is not approval for later checkpoints. Independent OPT-1A
can be selected without waiting for W0 recovery; automatic wake work stays gated.
Use manual-resume handovers until qualified support exists. Detailed scope and validation
belong to the [active plan](../tasks/active/ci-optimisation.md) and live HANDOVER.

Do not merge or remove branches during this review. CLOSE owns safe integration and
cleanup after approval; preserve unique work, open PRs, archive tags and historical evidence.
