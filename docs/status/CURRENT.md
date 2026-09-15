# Current status

**Updated:** 2026-09-15<br>
**Phase:** Phase 1A–1D corrective implementation complete; final target gate open<br>
**Working branch:** `corrective/phase-1a-1d-integrated`<br>
**Next milestone:** Phase 1E is unapproved and unstarted

## Current truth

Corrective implementation commit `0da5138` resolves the reproduced R1–R6 defects on
the existing branch and passes the prescribed local gate. It adds lexical/context-aware
source mapping; reloadable metadata and exact values; validated compatibility repair;
pinned Ren'Py discovery/import authority; session-safe behavioral UI; and complete
bounded-memory recovery readiness without a lifetime journal cap. See the
[issue ledger](../tasks/active/2026-09-15-phase-1a-1d-integrated-corrective.md).

The [correction execution prompt](../tasks/active/2026-09-15-phase-1a-1d-correction-follow-up.md)
records the implementation and local regression ledger. R7 remains open until the
existing production workflow passes on Windows x64 and macOS ARM64 for the final
application code/test/workflow tree, evidence is reconciled, and PR #7 satisfies its
conditional merge gate. The earlier FLAC-discovery concern is corrected: the pinned
8.5.3 audio scanner automatically discovers FLAC.

The last confirmed main head is `0e5e8b697782ed29d61d01dbb1240b9d16561c27`;
the correction remains on its existing branch. These pointers must be rechecked before
publication and merge. Phase 1E remains unapproved and unstarted.

## Branch reconciliation and SDK carry-forward completed

The user separately approved branch reconciliation. Six unchanged, already-integrated
branches were retired after fresh ancestry/tree-equivalence and open-PR checks.
The remaining old SDK branch was reviewed, its missing download handoff selectively
ported, and its complete history preserved under tag
`archive/phase-1c-network-install-fix-2026-09-15` before retirement. Only main and this
active corrective branch remained. No old branch was merged wholesale; main was not
changed. Exact receipts are in the
[branch reconciliation record](../audits/2026-09-15-branch-reconciliation.md).

SDK correction **N1** is implemented in `02fc772d93fbe6b0709691bad15a4307a0193c93`:
prepare managed installation once before download, so a second cleanup cannot
quarantine the active archive. Newer provenance-before-execution, quarantine and
platform-durability behavior remains intact. The private transport seam and four
regressions do not add an IPC or alter the approved endpoint/checksum.

Run `34935598838` passed the corrected core suite, strict Clippy, and exact-source
Windows x64/macOS ARM64 official-archive handoff/reuse tests, then published only the
tested files and removed temporary maintenance machinery. The baseline failure was
reproduced first. The earlier run `34935167989` stopped on missing Clippy and remains
failed evidence. The regular production workflow now also invokes the official
handoff test with an explicit passed-marker requirement using its existing SDK cache.

**Preserve N1; do not reimplement it or merge the archived branch. R7 and the full
application gate remain open.** The targeted handoff run is not a full packaged
lifecycle/authoring/DOM acceptance run. Finish the existing corrective goal on this
single branch before reviewing any main integration.

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

Push and run the existing final production workflow for the corrective candidate.
If both supported targets, required policy, complete diff review, and expected-head
checks pass, reconcile evidence and integrate existing PR #7 exactly once. Otherwise
leave it open at the precise blocked checkpoint. Branch cleanup is complete and must
not be repeated. Do not begin Phase 1E. Use [HANDOVER](HANDOVER.md) for continuation.
