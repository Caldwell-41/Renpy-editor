# CI optimisation programme: abandonment decision

**Decision:** 2026-09-20, explicitly requested by the user.
**Status:** W0 and OPT-1A are **abandoned**, not awaiting another fix or feasibility review.
**Replacement:** [CI-SIMPLE: simple CI and agent-usage cleanup](ci-simple-cleanup.md).
**Live continuation:** [HANDOVER](../../status/HANDOVER.md).

## Superseding scope decision

The user stopped the automatic wait/wake and SQLite-based CI orchestration line because its complexity and corrective effort had exceeded the intended benefit. This decision supersedes earlier W0-first approvals, OPT-1A repair instructions, W1 readiness prompts and instructions to resume pending acceptance work on PR #12.

| Workstream | Disposition |
| --- | --- |
| W0 investigation and recovery | Abandoned. The historical investigation ended with automatic support unqualified; do not reopen discovery or live probes. |
| OPT-1A / Gate P / corrective and Windows/SQL fixes | Abandoned without acceptance or integration. Do not finish the repair, qualify it, or merge its implementation as a prerequisite for anything else. |
| W1-W3 automatic wait/wake | Not proceeding under this programme. No implementation, runtime manipulation, service installation or activation is authorised. |
| Selected simple OPT-2A ideas | Replaced by the independent, bounded CI-SIMPLE brief. Start from integrated main, without OPT-1A dependencies. |
| OPT-2B cross-commit evidence reuse | Deferred and outside CI-SIMPLE. |

Abandonment is a scope decision, not proof that a capability is impossible or that failed/unverified tests passed. The editor's own transactions, project recovery and persistence are not abandoned.

## Preserve, do not integrate

`maintenance/ci-optimisation` / [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12) is retained as historical, unmerged work. The last inspected pre-abandonment head is `849ac14aefafe1c12ca50e369f0e92e6de95baee`. Existing code, historical findings and failed or incomplete evidence are preserved; none is newly accepted here.

Do not merge or bulk-cherry-pick that branch, delete it, rewrite history, cancel remote runs, or inspect/migrate/delete any private client profiles or journals under this documentation change. No private client setup is required for CI-SIMPLE. Earlier branch-local instructions to bootstrap a client, reconcile SQL state or continue W0 are historical and no longer active.

Use a fresh `maintenance/ci-simple-cleanup` branch from current main for the replacement after checking for existing matching work. Never reset or discard a dirty checkout; use a separate checkout/worktree when necessary. Starting replacement work does not require reading all abandoned ledgers.

## Historical records

These immutable records are evidence only, not continuation instructions:

- [Original main planning document](https://github.com/Caldwell-41/Renpy-editor/blob/7d634eeaf53fe0244a2739f26914797ca16ef544/docs/tasks/active/ci-optimisation.md)
- [Pre-abandonment programme and ledger](https://github.com/Caldwell-41/Renpy-editor/blob/849ac14aefafe1c12ca50e369f0e92e6de95baee/docs/tasks/active/ci-optimisation.md)
- [W0 qualification report](https://github.com/Caldwell-41/Renpy-editor/blob/849ac14aefafe1c12ca50e369f0e92e6de95baee/docs/research/CODEX_WAIT_WAKE_QUALIFICATION.md)
- [OPT-1A corrective ledger](https://github.com/Caldwell-41/Renpy-editor/blob/849ac14aefafe1c12ca50e369f0e92e6de95baee/docs/tasks/active/ci-opt-1a-second-corrective-pass.md)

This path remains as a short disposition/redirect so existing documentation links do not break. There is no pending OPT-1A completion or W0 recovery checkpoint.
