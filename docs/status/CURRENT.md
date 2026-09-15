# Current status

**Updated:** 2026-09-15<br>
**Phase:** Phase 1A–1D integrated correction and bounded follow-up open<br>
**Working branch:** `corrective/phase-1a-1d-integrated`<br>
**Next milestone:** Phase 1E is unapproved and unstarted

## Current truth

The initial integrated correction is present in application commit
`c08414293899f8930bd2eb5e8a78a5b6c10433e7`, reviewed on branch head
`157b6d110c5d66c1ea7c1df3e713b8bc38bbb2e3`. It improves recovery serialization,
incremental media verification, retained candidate activation, session authority,
source-line matching, asset status and supporting forms/Flush. It is not a completed
corrective gate: follow-up defects and final Windows x64/macOS ARM64 evidence remain
outstanding. See the [issue ledger](../tasks/active/2026-09-15-phase-1a-1d-integrated-corrective.md).

The prepared [correction execution prompt](../tasks/active/2026-09-15-phase-1a-1d-correction-follow-up.md)
owns R1–R7: lexical definition safety; metadata reloadability and identity preservation;
safe compatibility repair; exact SDK discovery/import authority; all stale UI completion
paths and persistence feedback; resource bounds without a lifetime edit cap; and exact
supported-target closure. The earlier FLAC-discovery concern is explicitly corrected:
Ren'Py 8.5.3's referenced audio scanner supports FLAC automatic discovery.

The documentation-only milestone amendment prepares that prompt and clarifies later
gates. It does not implement R1–R7, run the application tests, close Gate E on this
corrective tree, authorise 1E, or merge code. The last confirmed main head is
`0e5e8b697782ed29d61d01dbb1240b9d16561c27`; the correction is on its existing branch.
Always recheck live refs before implementation rather than resetting to these pointers.

## Evidence boundary

The integrated task retains its initial local report: repository validation, source/SDK
spike tests, frontend check/build, core tests and Clippy. Its official-SDK wrapper was
skipped on that host and desktop packaging was unavailable. Those results are not final
supported-target acceptance. Repository quality run `34928075865` at `157b6d1` is a
repository-validation result, not a Windows/macOS production matrix.

Historical closures and exact run/job/artifact details remain in the archived task
briefs and the byte-preserved [pre-follow-up status snapshot](CURRENT_PRE_FOLLOW_UP_2026_09_15.md)
and [handover snapshot](HANDOVER_PRE_FOLLOW_UP_2026_09_15.md). Statements in those snapshots
are historical, not current instructions or proof of the corrective tree.

| Historical checkpoint | Evidence entry point |
| --- | --- |
| Phase 0 source/SDK/runtime decisions | [ADR index](../adr/README.md) and [Phase 0 corrective record](../tasks/archive/2026-09-13-phase-0-corrective-review.md) |
| Phase 1A scaffold, run 34792368716 | [Archived scaffold task](../tasks/archive/2026-09-14-phase-1-production-scaffold.md) |
| Phase 1B correction, run 34804861387 | [Archived transaction correction](../tasks/archive/2026-09-14-phase-1b-corrective-transaction-recovery.md) |
| Phase 1C lifecycle, run 34814995559 | [Archived lifecycle task](../tasks/archive/2026-09-14-phase-1c-project-lifecycle.md) |
| Phase 1C SDK/lifecycle correction, run 34832555392 | [Archived corrective task](../tasks/archive/2026-09-14-phase-1c-corrective-lifecycle.md) |
| Phase 1C durability/races, run 34849801157 | [Archived durability task](../tasks/archive/2026-09-14-phase-1c-durability-race-remediation.md) |
| Phase 1C single-instance, run 34906232240 | [Archived single-instance task](../tasks/archive/2026-09-14-phase-1c-single-instance.md) |
| Original Phase 1D, run 34913182173 at 343e10f | [Archived supporting-authoring task](../tasks/archive/2026-09-15-phase-1d-supporting-authoring.md) |

## Amended plan, not implementation

The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) now explicitly assigns
1E.1's source/hierarchy/file-lifecycle/history prerequisites, 1E.2's functional Scene
and minimum recovery UI, and 1E.3's preview/media/polish. 1F extends that source model
with the full Source workspace. 1G has separate Branches, SDK/runtime and local-Git
gates. 1H requires behavioral success and failure/recovery workflows on both targets.

The [roadmap](../ROADMAP.md) bounds Phase 2 selected-route context, assigns provider/
credential/proposal gates, splits Phase 3 release capabilities, preserves Phase 4/5
unknown-state/optional-extension boundaries, and requires an actually private channel
for private distribution. No later phase is approved by these planning edits.

## Next action

When explicitly invoked, execute the bounded R1–R7 follow-up on the existing corrective
branch. Preserve working foundations; add regressions; complete the final target gate;
update evidence and documentation; then stop for review. Do not merge to main or begin
Phase 1E without a separate instruction. Use [HANDOVER](HANDOVER.md) for continuation.
