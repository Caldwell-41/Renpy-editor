# Phase 1 corrective and milestone-planning handover

**Prepared:** 2026-09-15<br>
**Repository:** `Caldwell-41/Renpy-editor`<br>
**Required working branch:** `corrective/phase-1a-1d-integrated`<br>
**Checkpoint:** N1 and R1–R7 accepted; guarded PR #7 integration tracked separately

## Read first

1. [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md), and the [completed follow-up execution record](../tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md).
2. The [integrated corrective ledger](../tasks/archive/2026-09-15-phase-1a-1d-integrated-corrective.md), which separates initial implementation, accepted R1–R7 and integration status.
3. The amended [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and [roadmap](../ROADMAP.md); these are planning boundaries, not implementation approval.
4. Relevant [architecture](../ARCHITECTURE.md), [data](../DATA_MODEL.md), [UI](../UI.md), [transaction](../TRANSACTIONS.md), [security](../SECURITY.md), [testing](../TESTING.md) and [ADR](../adr/README.md) contracts.

## Baseline and authority

Remote implementation commit `8c19225` (tree-equivalent to local object `0da5138`) is
the R1–R6 checkpoint. Final application candidate `c912fcad`, tree `17ae6e4f`, passed
the local and supported-target gates. The last pre-merge main head was `0e5e8b6`.
Re-read the live PR/main refs to determine integration state; never replay an already
merged PR or reset to historical SHAs.

The current authorization permits the bounded correction, its final production gate,
and conditional merge of existing PR #7 only. It does not permit direct application
pushes to main, force-pushes, replacement branches/PRs, branch deletion, repository
policy changes, releases, or later milestones.

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

R7 is complete: production run `34982164071` passed macOS ARM64 job `104424934281`
and Windows x64 job `104424934679` at exact candidate `c912fcad`. Both official SDK
gates, N1, packaging, supporting UI, WebView/single-instance, privacy and dependency/
licence evidence passed. Artifact IDs/digests and preserved failures are in the follow-up.
PR readiness, expected-head integration and post-merge verification are a separate live
integration state, not implementation evidence.

The initial local test report is retained in the integrated task. The SDK wrapper was
skipped and desktop packaging unavailable there. Repository quality is not production
acceptance. Do not say all fixes are done solely because initial local suites passed.

## Future milestone dependencies

After corrective closure and separate approval, 1E.1 establishes multi-Chapter/Scene
metadata and reopen, minimum beat/source mapping, narrow Scene file lifecycle and
committed-revision-aware history. 1E.2 implements functional authoring and the minimum
safe recovery UI. 1E.3 implements scene-local partial preview, session-scoped read-only
media presentation and the Quiet Studio Dark/accessibility pass.

1F extends the same source foundation into a full Source workspace and external
reconciliation. Safe file-local external divergence and unresolved mixed-file recovery
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
handover, CURRENT or the active follow-up.

The next action is to inspect PR #7's live head/base, checks, reviews and policies. If it
is still open and the expected head is the documentation-only descendant of validated
`c912fcad`, mark it ready and merge it once through the supported PR mechanism, then
verify main and required post-merge CI. If it is already merged, verify rather than
replay. If any gate changed, stop at the exact blocker. Do not start Phase 1E.
