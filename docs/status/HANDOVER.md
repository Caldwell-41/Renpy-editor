# Phase 1E Scene authoring handover

**Prepared:** 2026-09-16<br>
**Repository:** `Caldwell-41/Renpy-editor`<br>
**Main baseline:** `06850418b3f5e4e7a39c7b967483872ab78b68dc`<br>
**Application candidate:** `a32a790499900d3f3231b3e212a77fab70564e01`, tree `1bf03d20d350af819c6bb7cdc4c9c35f3f0b3cbb`<br>
**Checkpoint:** Phase 1E implementation and all internal/final gates complete; PR #9 awaits integration

## Read first

1. [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md), and the completed [Phase 1E ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md).
2. The [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and [roadmap](../ROADMAP.md); Phase 1F and later still require explicit approval.
3. The [integrated corrective ledger](../tasks/archive/2026-09-15-phase-1a-1d-integrated-corrective.md) for the accepted Phase 1A–1D baseline.
4. Relevant [architecture](../ARCHITECTURE.md), [data](../DATA_MODEL.md), [UI](../UI.md), [transaction](../TRANSACTIONS.md), [security](../SECURITY.md), [testing](../TESTING.md) and [ADR](../adr/README.md) contracts.

## Baseline and authority

Remote implementation commit `8c19225` (tree-equivalent to local object `0da5138`) is
the R1–R6 checkpoint. Final application candidate `c912fcad`, tree `17ae6e4f`, passed
the local and supported-target gates. PR #7 merged it once as main commit `98855eb`,
tree `a80d0a7b`; post-merge quality run `34985039823` and production run `34985039897`
passed. Never replay PR #7 or reset to historical SHAs.

Phase 1E was explicitly authorised and implemented on existing branch
`feature/phase-1e-scene-authoring` and existing PR #9. Its three checkpoint commits
were followed by narrowly scoped target-gate corrections. Do not create a replacement
branch/PR or replay PR #7/#8. Integration remains pending; Phase 1F and later are not
authorised.

## Phase 1E completed implementation and evidence

1E.1 evolves valid Loomlight projects transactionally to schema v2 with ordered
Chapters/Scenes, stable UUIDs and unknown-field preservation. Exact-byte Scene mappings
retain lexical context and Custom Code, while create/move/delete, obsolete owned
`.rpyc` handling, incoming-reference refusal and undo/redo share the accepted
transaction/recovery model.

1E.2 provides the approved Beat subset, explicit terminal/Choice/Jump semantics,
multi-Chapter Story-tree authoring, natural Dialogue continuation, truthful drafts and
Flush behavior, and a minimum recovery surface that resolves only proven states after
confirmation. 1E.3 provides the 52/48 responsive Preview/Beats workspace, contributing-
Beat provenance, partial/unknown state after Custom Code, and bounded asset-ID-only
image/audio presentation without renderer filesystem authority or CSP widening.

Final application candidate `a32a7904`, tree `1bf03d20`, passed production run
`35023049519`: Windows x64 job `104563305510` and macOS ARM64 job `104563305803` both
passed frontend, core, official SDK Scene/lifecycle and handoff fixtures, desktop,
packaging, packaged WebView/Scene/recovery/media interactions, privacy and inventory
gates. Only cache-miss downloads were skipped because the pinned official archives
were restored; the SDK tests ran. Exact artifacts and the two earlier failed runs are
preserved in the Phase 1E ledger. Repository-quality runs `35022880859` and
`35022884889` passed on the same candidate.

## What to preserve

Loomlight remains a narrative-first single-user Windows x64/macOS ARM64 Tauri editor.
The primary application instance owns lifecycle state. Renderer privileges are narrow;
project selection is native/core-mediated; source, archives, media and model output are
untrusted. Inspection is not executable trust. The selected official Ren'Py 8.5.3
adapter/provenance remains the runtime boundary.

Keep `.rpy` source authoritative, exact unsupported bytes, stable IDs/unknown metadata,
retained filesystem anchors, candidate-before-swap activation, per-activation session
checks and session-bound imports. Keep serialized recovery/commits/flush, expected-
absence creation and retained accepted/displaced evidence. Do not replace those working
foundations with new architectures or promote spike implementations wholesale.

## Corrective implementation

R1–R6 are implemented in `8c19225`. The source recognizer proves supported top-level
statements; metadata writes validate the full reloadable model; repair shares safe
declaration preflight; discovery matches the pinned scanner including automatic FLAC;
imports derive facts/bytes from retained handles; UI callbacks carry view/operation/
session generations; and recovery readiness completely scans retained journals without
a lifetime count cap. Behavioral DOM and packaged supporting-authoring regressions are
wired. Details and exact local counts are in the execution prompt.

The integrated R7 gate completed: production run `34982164071` passed macOS ARM64 job `104424934281`
and Windows x64 job `104424934679` at exact candidate `c912fcad`. Both official SDK
gates, N1, packaging, supporting UI, WebView/single-instance, privacy and dependency/
licence evidence passed. Artifact IDs/digests and preserved failures are in the follow-up.
PR #7 then merged and its post-merge gates passed as recorded above.

The later review found one narrower R5 issue: the renderer used one global operation
generation, so a same-view overlapping Flush/close could discard a mutation completion
without a session or view change. The follow-up uses operation-scoped generations and
one authoring operation per project session. `Ctrl/Cmd+S` does not start a second Flush
or claim persistence while authoring is active. Delayed success/failure DOM cases and
delayed packaged smoke coverage are implemented. Exact candidate `4f6fef7`, tree
`06b5609`, passed repository-quality run `34992162418` and production run
`34992890658`: macOS ARM64 job `104461734419` and Windows x64 job `104461734679`.
Both passed the official SDK lifecycle/authoring/discovery/N1, desktop, packaging,
packaged WebView/supporting-authoring, privacy and dependency/licence gates. PR #8
then merged with expected head `f3a9bc2` as main commit `3487f7c`, tree `038ea466`.
Post-merge quality run `34995109520` and production run `34995109499` passed; the
latter passed macOS ARM64 job `104469271124` and Windows x64 job `104469270622`.

The initial local test report is retained in the integrated task. The SDK wrapper was
skipped and desktop packaging unavailable there. Repository quality is not production
acceptance. Do not say all fixes are done solely because initial local suites passed.

## Future milestone dependencies

With Phase 1E complete, 1F may extend the same source foundation into a full Source
workspace and external reconciliation. Safe file-local external divergence and
unresolved mixed-file recovery
are different states: the latter still blocks the wider project. 1G separates graph,
explicit SDK/runtime trust and local Git checkpoint gates. 1H proves actual behavior,
crashes/conflicts, recovery and continued editing, not labels or file existence.

Phase 2 route-aware context is an explicit selected scope with provenance, not complete
runtime reachability. Phase 3 owns separately gated mature flow, screen, Timeline,
state/run-from-here, workflow/GitHub and distribution capabilities. Advanced analysis
and optional open-world work remain later. No plugins, arbitrary-project importer or
new release channel are implemented by this plan amendment.

## Evidence and continuation discipline

Use pinned toolchains, targeted cheap regressions first, and the full supported-target
matrix only for the final changed candidate. Preserve existing CI cost controls;
documentation-only edits do not need a package run. Record exact tested trees, failures,
skips, jobs and retained redacted artifacts. An unchanged application tree does not
inherit new acceptance merely because its documentation changed.

Historical detailed handover and run/artifact records are preserved byte-for-byte in
[HANDOVER_PRE_FOLLOW_UP_2026_09_15.md](HANDOVER_PRE_FOLLOW_UP_2026_09_15.md) and
[CURRENT_PRE_FOLLOW_UP_2026_09_15.md](CURRENT_PRE_FOLLOW_UP_2026_09_15.md), with archived task
links in CURRENT. Those snapshots are historical evidence and do not override this
handover, CURRENT or the completed Phase 1E ledger.

There is no remaining known Phase 1E correctness blocker. Preserve both corrective
branches and the archive tag, do not replay PR #7 or PR #8, and do not duplicate PR #9.
Integrate PR #9 through repository policy. Phase 1F remains unapproved and unstarted.
