# Current status

**Updated:** 2026-09-16<br>
**Phase:** Phase 1A–1D corrective integration complete<br>
**Main:** `3487f7c9049c8f3bbae56edc8e36eff58c364b19`<br>
**Next milestone:** Phase 1E is unapproved and unstarted

## Current truth

N1 and the integrated R1–R7 correction merged once through PR #7 as main commit
`98855eb23a284f500cd3285247738e4c5f250bcd`, tree
`a80d0a7b708026198f5f1ccc6b0ff9f8919c81cc`. Post-merge repository-quality run
`34985039823` and full production run `34985039897` passed; the latter passed macOS
ARM64 job `104434851094` and Windows x64 job `104434851128`. Do not replay PR #7.

The integrated remote implementation commit `8c19225` and its targeted
test-wiring descendants culminate in application candidate
`c912fcadf8160d32ec35c7a0135b12812ad65c56`, tree
`17ae6e4f16600d86f39bf354b7649a470dcf51f2`. The candidate passed the prescribed local
gate, repository quality, complete diff review and full production run `34982164071`:
macOS ARM64 job `104424934281` and Windows x64 job `104424934679` both passed core,
desktop, official SDK lifecycle/authoring/discovery/N1, packaging, WebView/single-
instance/supporting-authoring, privacy and dependency/licence gates. Exact artifact
IDs, digests, counts, preserved failures and compatibility limits are in the completed
[execution ledger](../tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md).

That correction provides context-aware source mapping; reloadable metadata and exact
int64 values; validated compatibility repair; pinned Ren'Py discovery/import authority;
session-safe behavioral UI; and complete bounded-memory recovery readiness without a
lifetime journal cap. FLAC remains automatically discovered by the pinned scanner.

A post-merge review then reproduced one same-view renderer race: starting
`Ctrl/Cmd+S`, close, or another operation while a supporting-authoring mutation awaited
the bridge could invalidate its global completion token. A later success could leave
submitted input labelled unsubmitted and controls disabled; a later failure could lose
its error/focus/retry state. The core transaction remained safe, but this reopens R5.
The completed [bounded follow-up](../tasks/archive/2026-09-15-phase-1d-ui-operation-follow-up.md)
scopes completion generations, serializes authoring per session, suppresses overlapping
Flush, and adds delayed success/failure DOM plus packaged regressions. Exact candidate
`4f6fef7a543ef817fc6e9a6d8f44744724686730`, tree
`06b560987278148d741716d7f550034454368b5c`, passed repository-quality run
`34992162418` and production run `34992890658`: macOS ARM64 job `104461734419` and
Windows x64 job `104461734679` both passed the core, official SDK lifecycle/authoring/
discovery/N1, desktop, packaging, packaged WebView/supporting-authoring, privacy and
dependency/licence gates. PR #8 then merged with expected head `f3a9bc2` as main commit
`3487f7c9049c8f3bbae56edc8e36eff58c364b19`, preserving final tree
`038ea466423437d531b6b2a3ebb184bfcf2d1044`. Post-merge repository-quality run
`34995109520` passed; production run `34995109499` passed macOS ARM64 job
`104469271124` and Windows x64 job `104469270622`. Phase 1E remains unapproved and
unstarted pending a separate goal.

## Branch reconciliation and SDK carry-forward completed

The user separately approved branch reconciliation. Six unchanged, already-integrated
branches were retired after fresh ancestry/tree-equivalence and open-PR checks.
The remaining old SDK branch was reviewed, its missing download handoff selectively
ported, and its complete history preserved under tag
`archive/phase-1c-network-install-fix-2026-09-15` before retirement. The retained
corrective branches remain alongside main. No old branch was merged wholesale. Exact
receipts are in the
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

**Preserve N1; do not reimplement it or merge the archived branch.** The earlier
targeted handoff run was not full acceptance; full application acceptance is now run
`34982164071` at `c912fcad`.

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

Phase 1A–1D has no remaining known correctness or integration blocker. Preserve both
corrective branches and the archive tag; do not repeat PR #7, PR #8 or branch cleanup.
Phase 1E may be planned or started only under a separate explicit goal; begin with its
1E.1 prerequisites rather than collapsing 1E into one implementation.
