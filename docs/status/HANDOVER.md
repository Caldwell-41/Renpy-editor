# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1, `awaiting_ci` / manual resume; target evidence pending.
**Authority:** user accepted the tightened reviewed plan in this chat.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Candidate:** `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`.
**Exact run:** [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731), **attempt 1**,
`production-scaffold.yml`, `upload_packages=true`. Candidate/remote/PR equality verified.
Later documentation commits do not change the tested inputs; resolve published head from Git.

## Completed changes and checks

Read [ledger 23](../tasks/active/phase-1g-branches-runtime-git.md#23-r2-p1-packaged-proof-correction-and-qualification--2026-09-27).
The existing packaged route probe asserts two choice edges, verifies accepted changed
jump destinations, closes/reopens into a new session, checks exact source text/revision
and refreshed graph, then restores routes. Normal play timing starts only after route
output plus Running state; measured `runningObservedMs >= 9500` is required before Stop.
Only the probe and testing/status documentation changed; no product or workflow changes.
Local Node 24.19.0 checks passed: typecheck, all 60 frontend tests, frontend build,
probe syntax, repository validation (268 files), whitespace. npm was absent on PATH;
its existing scripts ran through installed tsc/Node/Vite directly. These are not package
passes. Existing core SDK duration proof remains valid at its original layer/candidate.

## Outstanding operation and limits

Exactly one dispatch was made. Direct lookup confirmed this candidate/run in progress.
At the last inspection (about 04:16 UTC), preflight **108548761361** had passed repository,
pinned Node/npm, frontend and Source browser checks and was running Rust formatting.
Target jobs were not yet listed. No final target/SDK/package/new-probe pass is claimed.
No task-created local writer/watch process remains. Follow AGENTS/WORKFLOW manual resume;
there is no qualified automatic same-thread continuation and no active polling loop.

G1-OBS remains `review_ready`: candidate `a6063080006769613733de20fcd82265bf96b632`,
run [36291545085](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36291545085),
attempt 1, both targets passed. [Ledger 22](../tasks/active/phase-1g-branches-runtime-git.md#22-g1-obs-observed-branches-implementation--2026-09-27)
preserves hashes, all samples, SDK skips and browser/native limitations, including
macOS p95 94.2 ms/max 126 ms and the earlier 1,058.6 ms outlier. Prior R1 closure and
failed production evidence remain preserved. PR #17 reports conflicts against main;
no integration action is selected. Human acceptance remains separate.

## Next bounded action

Resume evidence assessment of **36293797731 / attempt 1 / candidate above**. Verify
both targets' full logs, archive/input/executable hashes and all five case outcomes,
including cleanup. For each route require `branches-destination-reopen-passed` and
`long-run-duration-passed` with `runningObservedMs >= 9500`. Publish the exact G1/R1/R2
assessment, failures/skips and final handover; stop at R2-P1. Preserve pending status
if the run is still live. No duplicate dispatch or automatic retry.
Application defects need a separate bounded decision before production changes.
No performance tuning, CI redesign, merge-conflict resolution, native automation,
human testing, new feature work or merge is authorized. Keep PR draft/open.
