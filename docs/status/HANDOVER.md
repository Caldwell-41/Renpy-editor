# Current checkpoint handover

**Prepared:** 2026-09-23. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** final Phase 1F review accepted; authorised PR #14 integration pending.
**Working branch / PR:** `feature/phase-1f-source-synchronisation`,
[#14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Reviewed head:** `0075d98f80a680588b7eb3f49ab437c71b48a237`.
**Production candidate:** `88dc6286944d4b96cfb96968f88aa6e87dacc447`.
**Authority:** user's final closeout goal permits integration after acceptance and
handover; it excludes Phase 1G implementation.
**Canonical detail:** [final decision 7.29](../tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review).

Acceptance is satisfied. F1-F4 are closed, both native F4 A/B/C sets pass by user
report, and all six #87 native Save passes are preserved without repetition. Exact
production run `35787284261`, attempt 1, passed all target gates. Historical reports
call it #90; current GitHub run-number metadata says #91. Stable run ID, SHA and
artifacts agree. Current application/test/build inputs are identical to that run.
The archive retains exact jobs, package hashes, failed runs, evidence limits and
DIST-MAC-01. Native user reports are not independently witnessed tests.

**Outstanding operation:** publish and verify this documentation-only closeout,
mark PR ready, resolve the addressed F4 thread, merge without bypassing policy, then
verify main and update this handover to the actual integration result. No production
redispatch is needed for documentation. Check fresh refs before each mutation.

**Branch inventory:** retain Dependabot PRs #10/#11 and abandoned unique history
PR #12. Four older branches are ancestry-proven integrated but their cross-host use
is unknown; retain them. The current 1F ref may be retired after verified integration
and local checkout release; do not delete any other host's worktree or archive tags.

**Next application work:** [1G.1 shared flow projection and Branches](../tasks/active/phase-1g-branches-runtime-git.md#4-1g1--shared-flow-projection-and-branches).
All 1G/1H checkpoints remain `not_started`. No implementation branch/PR exists.
A later user selection starts 1G.1 only: inspect fresh main/refs/ownership; reuse an
existing matching branch/PR or create `feature/phase-1g-branches-runtime-git` from
verified main and record it here. Preserve integrated Source Save, review identity,
draft/session/recovery authority. Do not automatically proceed into runtime or Git.
