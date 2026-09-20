# Current status

**Updated:** 2026-09-20.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Maintenance branch / PR:** `maintenance/ci-optimisation`, PR #12.
**Current approved delivery:** [OPT-1A Windows validation repair](../tasks/active/ci-opt-1a-second-corrective-pass.md).
The prior Windows quality acceptance is invalidated. The bounded repair is locally
complete at implementation candidate `270dc2aa769e4bb69e017288f099d972c6f9961a`;
published candidate head `d6e311d6d58a83b06a341988062385bbd5f4fc6a` is awaiting
native Windows x64 and macOS ARM64 evidence in push run `35492538939` and PR run
`35492541232`, attempt 1. PR #12 cannot return to review-ready state until the actual
suite logs pass. The PR is not merged or otherwise integrated.
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
affirmative collector. The corrective ledger records the exact candidates, the accepted
candidate-bound production matrix and the now-superseded automatic quality evidence;
the historical run is not reused for the corrected workflow.

The four final-hardening fixes remain: stored run IDs require validated attempts before
attachment; unresolved blocked operations remain collision barriers across option
changes; `ci.py operations` provides local-only recovery selection; and SQLite companion
plus POSIX ownership checks occur before open. Raw logs now prove that the Windows jobs
behind provider-success quality runs `35431546974`, `35431548846`, `35435261321`,
`35435263405`, `35436013835` and `35436015412` failed their privacy suites before a
later successful CI-tooling command hid the exit code. They are retained as failed
Windows evidence, not acceptance.

The local repair makes native privacy and CI-tooling separate required workflow steps
and explicitly sets the Windows owner to the validated current SID after installing the
restrictive DACL. Local synthetic Windows validation discovered 40 privacy tests:
37 passed, none failed or errored, and 3 skipped for explicit host capabilities. All 47
CI-tooling tests passed. Native candidate confirmation remains pending. The accepted
production run `35431721525` remains only the unchanged application/production-workflow
evidence; this helper/quality repair does not justify a production matrix rerun.

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
