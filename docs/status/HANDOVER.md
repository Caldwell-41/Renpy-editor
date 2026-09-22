# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE timing diagnostic](../tasks/active/phase-1f-save-correction.md#715-timing-only-diagnostic-after-failed-300-second-run).
**State:** diagnostic instrumentation published for one production measurement; P5 and native P3 remain open.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Prior application candidate:** `628c901d9c5e860656ab0c194bc104ae3c4b760c`.

## Resume here

Read AGENTS.md, CURRENT and section 7.15 of the 1F-SAVE ledger. Inspect actual refs and
preserve newer work.

The prior 300-second run established that both supported targets pass Source, recovery
and conflict presentation before the outer watchdog, but the evidence did not record
when each checkpoint occurred. Therefore the earlier statement that the post-conflict
IPC response itself remained blocked until the deadline was not proven.

The diagnostic change is intentionally one native measurement: each existing
`probe.smokeCheckpoint` record includes monotonic `elapsedMs` from packaged-smoke
start. No JavaScript flow, checkpoint location, timeout, yield strategy, smoke
assertion, Source/core behavior, renderer privilege or workflow behavior is changed.

After Repository Quality passes, dispatch the existing Phase 1 production gate once on
the exact diagnostic candidate. Preserve Windows/macOS evidence artifacts and record
the five elapsed values from each target.

Interpret only after measurement:
- post-conflict near 300 seconds => duration/budget exhaustion is supported;
- post-conflict substantially earlier with no final checkpoint => terminal IPC/return
  stall is supported;
- intermediate/divergent values => report exact data and stop.

Do not increase timeout, split the smoke, alter yield behavior, modify IPC/Source Save,
or rerun the same SHA during this checkpoint. Update ledger/CURRENT/HANDOVER/PR with
the terminal measurement and stop for independent review. Native P3 remains separate.
