# Current status

**Updated:** 2026-09-19.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Maintenance branch / PR:** `maintenance/ci-optimisation`, PR #12.
**Current approved delivery:** [OPT-1A second corrective pass](../tasks/active/ci-opt-1a-second-corrective-pass.md).
Correction, final bounded hardening, focused review and exact quality acceptance are
complete at implementation candidate `a9631343bb9ab4099ed36750a29eb757a7960ed2`.
PR #12 is ready for final independent review; it is not merged or otherwise integrated
by this delivery.
**W0 result:** Investigation complete; automatic wait/wake remains no-go/unqualified for the examined path.
**Continuation:** [HANDOVER](HANDOVER.md).

## Preserved application state

Phase 0 and corrected Phase 1A-1D are integrated. Phase 1E PR #9 is merged; do not replay
it or PRs #7/#8. The [Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md)
retains candidate `a32a790499900d3f3231b3e212a77fab70564e01`, run `35023049519`, both target
results and earlier failures. Preserve transactions/recovery, lifecycle/single-instance,
N1 SDK handoff, supporting authoring and Scene/source/media boundaries.

The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and [roadmap](../ROADMAP.md)
remain the application sequence. This maintenance approval adds no Phase 1F or other
application feature. Preserve unrelated active work and do not merge/retire branches now.

## Current delivery and remaining gates

Read the [second corrective brief](../tasks/active/ci-opt-1a-second-corrective-pass.md)
and the [original combined implementation brief](../tasks/active/ci-opt-1a-privacy-and-operation-foundation.md).
The corrective pass moves private state to protected per-user application data, fixes
candidate identity/reconciliation/collector/publication defects, and performs a fresh
integrated review. It does not authorise W1.

The earlier production candidate `83e86aaacaa86993d5851283d4bb48509718b72b`
and run `35414571185` remain historical evidence for the packaged application baseline.
They do not prove the corrected workflow identity, external-state architecture or
affirmative collector. The corrective ledger records the new exact candidate, automatic
quality runs and accepted candidate-bound production matrix; the historical run is not
reused for the corrected workflow.

The final hardening candidate fixes four review findings without changing the production
workflow or application/package inputs: stored run IDs require validated attempts before
attachment; unresolved blocked operations remain collision barriers across option
changes; `ci.py operations` provides local-only recovery selection; and SQLite companion
plus POSIX ownership checks occur before open. Automatic quality runs `35435261321`
(push) and `35435263405` (PR), attempt 1, passed at the exact candidate on repository,
Windows x64 and macOS ARM64 jobs. The accepted production run `35431721525` remains the
app/workflow evidence; no redundant production matrix was dispatched for this helper-
and-local-storage-only change.

The [W0 report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md) still lacks qualified
external owning-runtime reconciliation/telemetry and ownership-safe goal restoration.
Loaded/unloaded wake-up and zero-autonomous-inference proof remain unperformed.
Passing P/OPT-1A does not satisfy W0. The next W1 prompt must therefore check entry
gates; it is readiness-only if W0 remains unqualified. No automatic wake-up or goal
manipulation is authorised by this delivery.

Detailed later dependencies and cleanup are in the
[parent optimisation roadmap](../tasks/active/ci-optimisation.md).
W0 remains unchanged: no automatic Codex wake-up, goal restoration or W1 implementation
is provided by these independent privacy/CI changes.
