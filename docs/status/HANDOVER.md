# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a runtime/trust foundation — `blocked`; R1 NOT ACCEPTED.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Reviewed publication:** `e2d5c886dfe4b981971dba214da5ecb8318500db`.
**Unchanged production candidate:** `ad2627c4a0347261098f12883419672ecffc6e29`.
**Candidate tree:** `381829ad05445ef6d0f385b84a1d9eec02e7bff0`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Existing native run is complete

[Production 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567),
**attempt 1**, passed on the exact production candidate. Both complete job logs and
artifacts were inspected; ZIP SHA-256/CRC/size, candidate/run/attempt and all 26 core
Rust input hashes per target match. No rerun or duplicate dispatch occurred.

| Target | Job | Inspected result |
| --- | --- | --- |
| Windows x64 | `108075623934` | Core 12 passed, 2 ignored; explicit SDK 1 passed/0 ignored; frontend 48 passed; Source browser and format PASS; desktop 1 passed |
| macOS ARM64 | `108075624153` | Core 13 passed, 2 ignored; explicit SDK 1 passed/0 ignored; frontend 48 passed; Source browser and format PASS; desktop 1 passed |

The ignored entries are the re-executed child fixture and separately invoked SDK gate.
Artifacts `10864982957` / `10864657289` expire 2026-10-02. Exact hashes, OS versions,
timings, coverage and acceptance matrix are in [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger),
latest entry **Native evidence assessment and remaining R1 blockers**.

Prerequisite `36126490939`, attempt 1, remains PASS for SDK/reload feasibility only.
Superseded production `36135942863` remains FAILED; its skipped desktop/SDK gates are
not promoted to passes. Earlier local application results and 1F/1G.1 safeguards remain
preserved. Native keyboard/packaged runtime UI and final human 1G acceptance are deferred.

## Why R1 remains blocked

**R1-B1 — request/control ownership:** preparation hashes the project/full SDK before
returning its cancellation token while holding the shared lifecycle mutex. Grant/start
rechecks use that mutex too. Stop/status/cancel and blocking native file dialogs share
it, so the direct worker Stop timing test does not prove responsive production IPC.
The renderer lease spans preparation. Terminal freshness hashing precedes worker join
completion and is outside the advertised process/pipe deadlines. See the exact source
paths, limits and correction contract in ledger 13 and [ADR 0008](../adr/0008-controlled-runtime.md).
This is an architectural correction within 1G.2a, not a CI retry or permission to weaken
identity, trust, serialization or retained-input safeguards.

**R1-B2 — missing service lifecycle/history evidence:** native descendant tests exercise
worker Drop, not `runtime_shutdown`, service Drop or project switching with descendants.
The desktop test only validates smoke-report acceptance. Add actual service cases for
Cancel/Stop/switch/shutdown, starting/validation cancellation, cleanup failure and stale
callbacks. Check descendant liveness, including closed output handles, and actual history
Undo/Redo/file-lifecycle refusal/no-write/Stop/retry. Low-level proposals labelled Undo/Redo
are evidence for the barrier, not the whole user history path. No orphan or corruption
is asserted to have been observed; these cases are missing.

## Next bounded action and ownership

Continue **1G.2a only**, resolve R1-B1/B2 on this same branch/PR. Inspect fresh refs and
execution ownership first. The continuation checkout was clean at entry; older local
worktrees/unpublished 1G.1 review docs and local evidence branches were inspected and
preserved. No competing local executor was observed; cross-host ownership is not visible.
This review changed documentation only and stopped at the specific architectural blocker
allowed by the user's goal. No production fix or replacement native pass is claimed.

Restore a portable local Rust toolchain if needed (currently absent; official distribution
endpoint reachable). Implement the smallest cohesive request/supervisor correction and
deterministic targeted regressions first; obtain one replacement native R1 run for the
changed candidate. Do not rerun the unchanged successful run or feasibility workflow.
If the replacement run is outstanding, follow AGENTS/WORKFLOW: publish its exact
run/attempt/candidate and stop active polling; no qualified automatic continuation exists.

Publication scope: this handover, CURRENT, ledger 13, parent-plan state and ADR limitations.
Repository validation (241 files) and whitespace checks passed. Commit/publish together
and verify remote content; do not create a receipt-only commit
chasing this documentation commit's own SHA. No application/workflow files changed.
No outstanding native operation needs polling. No user physical testing, merge, 1G.2b,
optional Git, Phase 2 or unrelated refactoring. Advance only after R1 is review-ready.
