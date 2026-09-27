# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** G1-OBS, `review_ready`; implementation and automated qualification complete.
**Authority:** user selected G1-OBS through the active goal/next-chat instruction.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Implementation:** `1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`.
**Qualified candidate:** `a6063080006769613733de20fcd82265bf96b632`.
Later commits only record status/evidence; resolve published head from Git/PR.

## Completed checkpoint

Read [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md) and
[ledger 22](../tasks/active/phase-1g-branches-runtime-git.md#22-g1-obs-observed-branches-implementation--2026-09-27)
for the requirement/test map, exact timings, exclusions and archive digests.
Session-owned observed inputs, accepted-mutation invalidation, Source reconciliation,
explicit disk refresh/status, coalesced UI requests and independent target navigation
are implemented. Dirty drafts/caret, valid focus/selection/pan and last usable graph
survive refresh. No Branches timer or second all-source verification pass remains.
Existing transaction/recovery, execution and baseline path/privacy safeguards remain.
Historical hostile-namespace experiments are preserved as explicitly specialist.

## Verified qualification and limits

Corrected run [36291545085](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36291545085),
**attempt 1**, exact qualified candidate above, passed Windows **108542473937** and
macOS ARM64 **108542473845**. Logs confirm Node 24.19.0 / npm 11.9.0 / Rust 1.90.0.
All 12 extracted files and both archive SHA-256 digests verified; fixture JSON and
rendered screenshots inspected. Each UI suite passed 60; core reported 171 Windows /
176 macOS passes, including two explicitly skipped SDK wrappers each (169/174
actually executed regular cases). Historical/worker ignores and the separately run
budget fixture are recorded in the ledger. Baseline link/path tests passed in CI.

Three fixed core samples per target passed: accepted update 14.60–30.76 ms and disk
observation/refresh 32.07–393.87 ms. Full-workload Chromium pan p95 was 15.6 ms Windows /
94.2 ms macOS; maximum synchronous input dispatch was 0.1 / 0.7 ms while refresh was
held. macOS had one 126 ms frame, so its passing p95 has limited margin. Preserve all
samples and the first run [36289951468](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36289951468),
which passed under unpinned npm 11.17.0 with a 1,058.6 ms frame outlier. No attribution
of those delays or all-frames-under-100 claim is supported.

These are production core and synthetic Chromium evidence, not packaged IPC/native
keyboard or official SDK acceptance. Final R2/1G packaging/runtime/diagnostic,
native-keyboard/human acceptance and integration remain separate and unaccepted.
No CI operation or task-created local writer/watch process remains outstanding.
Raw local evidence and historical worktree remain preserved; no merge occurred.

## Next bounded selection

G1-OBS work stops here. Next chat may review this checkpoint and plan the remaining
1G.2b/R2 and final 1G acceptance on this same branch/PR. Read AGENTS and the linked
active plan, inspect current refs, and propose one bounded next execution checkpoint.
Planning is not execution approval: no package matrix, SDK download, new native
experiment, privilege change or merge is selected by this handover. Keep PR draft/open.
