# Current status

**Updated:** 2026-09-19.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Maintenance branch / PR:** `maintenance/ci-optimisation`, PR #12.
**Current approved delivery:** Privacy corrections plus OPT-1A in one implementation chat; approved, not started by this documentation amendment.
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

Read the [combined implementation brief](../tasks/active/ci-opt-1a-privacy-and-operation-foundation.md)
for detailed requirements. Gate P first reproduces and corrects staged-content validation,
exact destination ignore checks, client rebinding and storage safety; Gate A then
implements CI doctor/preflight, durable candidate-specific submission and bounded
attempt-specific collection. Both are authorised in the same chat with separate evidence,
followed by self-review and the published handover. This is an explicit exception to
the usual one-checkpoint-per-chat rule, not authority to continue to W1.

The existing bootstrap/privacy helpers at review candidate `33d0e202` have uncovered
gaps despite their original 16 passing tests. Those corrections and `ci.py` are not
implemented by this planning amendment. Identifying client values must remain local;
do not trust sensitive setup until the Gate P protections are verified.

The [W0 report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md) still lacks qualified
external owning-runtime reconciliation/telemetry and ownership-safe goal restoration.
Loaded/unloaded wake-up and zero-autonomous-inference proof remain unperformed.
Passing P/OPT-1A does not satisfy W0. The next W1 prompt must therefore check entry
gates; it is readiness-only if W0 remains unqualified. No automatic wake-up or goal
manipulation is authorised by this delivery.

Detailed later dependencies and cleanup are in the
[parent optimisation roadmap](../tasks/active/ci-optimisation.md).
This documentation-only amendment changes neither helpers nor workflows and launches
no production matrix. Inspect its exact repository-quality result without treating
that result as proof of future P/A or runtime work.
