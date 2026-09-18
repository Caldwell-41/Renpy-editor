# Current status

**Updated:** 2026-09-19.
**Integrated application baseline:** Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Current maintenance task:** [CI optimisation plan](../tasks/active/ci-optimisation.md).
**Current checkpoint:** W0 actual-host wait/wake feasibility is review ready with a
no-go result for automatic support; user acceptance is pending.
**Exact continuation routing:** [HANDOVER.md](HANDOVER.md).

## Application state

Phase 0 and corrected Phase 1A-1D are integrated. Phase 1E Scene authoring PR #9
merged on 2026-09-17 as `f1be3f0`; do not replay its commits or try to merge it again.
The earlier CURRENT/HANDOVER statements that PR #9 awaited integration were stale.
The [Phase 1E ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md) records
accepted candidate `a32a790499900d3f3231b3e212a77fab70564e01` and production run
`35023049519`, with Windows x64/macOS ARM64 evidence and retained failed attempts.

Preserve corrected transactions/recovery, lifecycle/single-instance behavior, N1 SDK
handoff, supporting authoring and Scene/source/media boundaries. PRs #7 and #8 are
merged and must not be replayed. Durable evidence remains in the archived
[integrated correction](../tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md),
[UI-operation correction](../tasks/archive/2026-09-15-phase-1d-ui-operation-follow-up.md)
and [branch reconciliation](../audits/2026-09-15-branch-reconciliation.md).

The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and
[product roadmap](../ROADMAP.md) remain the product sequence. This maintenance plan
does not authorise or implement Phase 1F/later application work. Preserve any separately
approved concurrent work after inspecting actual branches/PRs.

## Maintenance approval and capability

The user approved W0 feasibility first, one checkpoint per chat, detailed plans and
handovers in Git, and safe branch/documentation cleanup after implementation. The
[maintenance plan](../tasks/active/ci-optimisation.md) owns sequence and approval gates.

No CI helper, supervisor, automatic queue/resume bridge or evidence-reuse policy is
implemented. W0 identified the actual local Windows owner and exact task, but the
owning surface lacks external queue reconciliation/activity telemetry and goal control
lacks ownership-safe conditional restoration. The
[qualification report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md) records the
no-go evidence. Stop model-driven polling; use an explicit manual-resume handover
until a documented W0 recovery is selected and verified on the actual host.

Only documentation changes are published from the inspected main baseline. Inspect
the publishing commit and its repository-quality check for validation; no fresh native
application acceptance is claimed merely because docs changed.

## Documentation ownership

[AGENTS](../../AGENTS.md) contains stable rules; [WORKFLOW](../WORKFLOW.md) defines
repository-first checkpoint delivery. CURRENT is the state summary; HANDOVER is the
single live continuation record. Detailed implementation and checkpoint evidence live
in the active task, not chat prompts. Historical snapshots are evidence only.

Do not delete legacy branches now. At authorised closure, prove integration/redundancy,
retain unique work/open PRs/archive tags, and consolidate redundant handovers without
losing lessons or failed-run evidence.
