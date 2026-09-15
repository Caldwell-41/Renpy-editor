# Phase 1 corrective and milestone-planning handover

**Prepared:** 2026-09-15<br>
**Repository:** `Caldwell-41/Renpy-editor`<br>
**Required working branch:** `corrective/phase-1a-1d-integrated`<br>
**Checkpoint:** 1A–1D correction remains open; 1E and later unapproved

## Read first

1. [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md), and the [follow-up execution prompt](../tasks/active/2026-09-15-phase-1a-1d-correction-follow-up.md).
2. The [integrated corrective ledger](../tasks/active/2026-09-15-phase-1a-1d-integrated-corrective.md), which separates the initial implementation from remaining R1–R7.
3. The amended [Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) and [roadmap](../ROADMAP.md); these are planning boundaries, not implementation approval.
4. Relevant [architecture](../ARCHITECTURE.md), [data](../DATA_MODEL.md), [UI](../UI.md), [transaction](../TRANSACTIONS.md), [security](../SECURITY.md), [testing](../TESTING.md) and [ADR](../adr/README.md) contracts.

## Baseline and authority

Initial corrective application code is `c08414293899f8930bd2eb5e8a78a5b6c10433e7`,
reviewed at `157b6d110c5d66c1ea7c1df3e713b8bc38bbb2e3`. Documentation amendments are
later descendants. The last verified main head was `0e5e8b6`; this branch has not been
merged by the documentation task. Re-read current refs and preserve newer/uncommitted
work. Do not reset to historical SHAs or create a replacement branch.

The user requested a correction prompt and milestone amendments, not implementation of
future milestones. Execute the correction only when its prompt is explicitly invoked.
It permits bounded code/tests/docs and pushes on this branch, not main merges,
force-pushes, branch deletion, repository-visibility changes or releases.

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

## Remaining correction

R1 requires lexical/context-aware definitions and safe append, not merely physical-line
matches. R2 requires accepted metadata to reload within consistent limits, correct known
relationships and exact integer IPC, with no silent identity reset after metadata loss.
R3 requires validated and idempotent compatibility repair with collision/physical checks.
R4 requires the actual pinned SDK's discovery normalization and retained-source import
evidence. FLAC is automatically discovered in the referenced 8.5.3 scanner; the earlier
contrary finding was wrong and must not drive a new compatibility requirement.

R5 covers every stale success/error/cancel/navigation completion and truthful form/
persistence behavior, with actual DOM/package tests. R6 removes the terminal-journal
lifetime cap and bounds media/revision work without hiding unresolved recovery or
throwing away evidence. R7 owns documentation reconciliation and the final Windows/
macOS gate. Details and required regressions are in the execution prompt.

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

The next action is the bounded correction when invoked. Finish at verified 1A–1D closure
or a clearly recorded blocker; push only this branch and return for review. Do not
start 1E or merge automatically.
