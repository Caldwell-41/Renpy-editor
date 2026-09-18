# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Task:** [CI optimisation and durable wait/wake](../tasks/active/ci-optimisation.md).
**Checkpoint:** **W0 actual-host feasibility — review ready, no-go for automatic support**.
**Acceptance:** User review pending; no later checkpoint is approved or started.

## Continue from

Use branch `maintenance/ci-optimisation` and the single integration
[PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12). The W0 evidence candidate
is `24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c`, based on freshly fetched main
`7d634eeaf53fe0244a2739f26914797ca16ef544`. A handover-only publication commit follows
the candidate; do not confuse its newer SHA with a different implementation candidate.

Read [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md),
[WORKFLOW](../WORKFLOW.md), the plan's W0 ledger, and the
[qualification report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md). Reuse this branch
and PR. Do not create another implementation branch/PR, reset to the older planning
baseline, or replay merged Phase 1E work.

## W0 outcome

The investigation qualified the actual local Windows x64 desktop owner. The native
task ID matched the exact owner record, expected workspace and running Codex binary;
the owner read this original active task by exact ID. The installed CLI/daemon binary
is `0.155.0-alpha.9`, and the desktop host reported build `153.0.8010.48`. Private IDs,
paths, process details and endpoints remain outside Git.

Installed stable and experimental schemas plus exact `rust-v0.155.0-alpha.9` source
confirm persisted queue IDs, caller message IDs, exact list/delete/start primitives,
loaded-task wake behavior and idle-only start. They also confirm that goal mutation
has no caller-visible owner, revision or conditional update.

Automatic support is a no-go on the current exposed contract because:

1. safe goal restoration cannot be proved against an intervening user pause; and
2. the owning desktop surface does not expose queue list/delete/start receipts and
   authoritative activity/user-event telemetry to an external non-model observer.

Loaded-idle delivery, unloaded same-ID continuation and real goal inactivity were not
live-tested. Restored tool use and cancellation remain partial. No self-message was
left queued, no task was unloaded, no goal was paused, no competing task was created,
and no service/supervisor/production CI was installed or changed.

## Validation and publication

- Candidate: `24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c`.
- `scripts/validate.py`: passed for 203 repository files using bundled Python 3.12.14.
  The ordinary `python` and `py` launchers were unavailable; this was an environment
  alias gap, not a validator failure.
- `git diff --check`: passed.
- Scope review: four documentation files in the candidate; no application, workflow,
  probe implementation or runtime configuration change.
- Automatic Repository quality
  [push run 35404027500](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35404027500)
  and [PR run 35404031132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35404031132),
  attempt 1, both completed successfully for the first handover publication head
  `2917b50a0c469d9308c0cb118a1a36ad554760fd`. No production/native matrix was manually
  dispatched; do not infer native application acceptance.
- Publication: candidate pushed to `origin/maintenance/ci-optimisation`; PR #12 open.
  This receipt-only follow-up may move the PR head without changing the W0 candidate.
  Verify the final remote head after publication.

## Recovery boundary and next action

The durable recovery requirements are in the qualification report: supported access
to the owning daemon's reconciliation primitives, ownership-safe goal control, and
authoritative activity telemetry. Only after those exist should the user authorise a
bounded live original-task pause/unload/delivery race probe with an allowance, deadline,
restoration and abort contract.

Until then, external waits use a published manual-resume handover. A user-scoped
Windows Scheduled Task plus Windows toast/durable status is the provisional native
supervisor/notification choice for later qualification; none was installed. There is
no outstanding operation to watch or recover.

Stop for user review. The next chat should review/select documented **W0 recovery**;
it must not start OPT-1A, W1 or later checkpoints, install a service, migrate hosts,
or run the live pause/unload probe without explicit new authority. Independent OPT-1A
remains possible only if the user separately selects that checkpoint.
