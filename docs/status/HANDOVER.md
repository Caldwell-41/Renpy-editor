# Current checkpoint handover

**Prepared:** 2026-09-21.
**Repository:** `Caldwell-41/Renpy-editor`.
**Delivery:** [Phase 1F only](../tasks/active/phase-1f-source-synchronisation.md).
**State:** bounded independent-review corrections published; corrected supported-target
production run dispatched and pending.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft
[PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Corrected implementation candidate:** `822e3fbeea9e90409ecc66988322cc524309468c`.
**Candidate tree:** `bb8fca46a99b6e07cdee9898c7b0f1b938fd5d51`, exactly matching
local correction commit `026209493f5c7ea16433564ec4844e436ac631d3`.
**Baseline:** `8862495f5465c35a0d951fa65743be52d3c813e7`.

## Corrected and preserved

The correction reused the existing branch and draft PR without replaying Phase 1F entry
checks, CI-SIMPLE housekeeping, creating another delivery line, merging, or beginning
1G. No unrelated branch, PR, or historical optimisation work was changed.

Phase 1F now provides anchored existing-`.rpy` discovery; UTF-8/BOM/newline-aware,
bounded session drafts; explicit Save, Save All, Discard and exact non-overlap Apply
Both; source-map reconciliation and shared committed history; dirty/conflict/missing/
invalid/read-only states; same-file Scene/supporting/history guards; and clean external
refresh. Multiple ambiguous same-kind edits invalidate Beat identities rather than
guessing, while exact-content reorders follow their existing IDs.

Independent review and failed production run `35544944804`, attempt 1, showed Windows
x64 and macOS ARM64 both reaching `sourceAuthoringStage: source-focused-save` without
observing `source.save`. The smoke harness now dispatches a deterministic cancelable
focused save event, verifies that the editor handled it, and appends the actual failure
to its stage marker. It still requires an actual Source draft, Source save, Saved status,
`sourceAuthoringUiPassed: true`, and `sourceAuthoringStage: complete`.

Clean mapped source changed externally from valid to detected-invalid now remains
inspectable as the current bytes. Source is explicitly invalid, persistence is Conflict,
same-file writes block, and Scene returns an empty stale/conflicted projection rather
than showing previous Beats as current. Unsupported/opaque source remains distinct and
accepted as partial. Discard Draft and Reload External / Discard Draft require explicit
confirmation with Cancel/no-change. Conflict handling now provides a real Copy Draft
operation with a bounded fallback.

No Branches, SDK Run/Validate, local Git surface, UI Designer, Timeline, arbitrary
project import, raw source create/move/delete, autosave draft journal, general Ren'Py
parser, privilege/CSP widening, or 1G work was included.

## Validation and publication

- `python3 scripts/validate.py`: 209 repository files passed.
- `git diff --check`, staged diff check, `cargo fmt --check --all`, and core clippy
  with `-D warnings`: passed.
- `cargo test -p loomlight-core --locked`: 151 total, 147 passed, zero failed, four
  ignored subprocess-worker markers. The ignored entries are fixtures invoked by their
  parent crash tests, not skipped product tests.
- `npm run check`: typecheck plus 21/21 frontend tests passed. `npm run build` passed.
- Lossless-source suite: 26/26 passed. SDK adapter/archive suite: 24/24 passed.
- Lossless benchmark: 620,000 bytes / 40,000 nodes, 224.81 ms median over seven samples.
- Local `loomlight-desktop` and Tauri package attempts were unavailable before compile
  because this Linux client lacks `pkg-config`/GLib development metadata. Supported
  Windows/macOS CI is the authoritative desktop/package gate.
- Failed production run `35544944804`, attempt 1, is preserved as superseded evidence:
  preflight and both targets' core/SDK/package work passed, but both packaged WebView
  smoke jobs failed at the Source-focused save stage.
- Remote corrected candidate `822e3fbeea9e90409ecc66988322cc524309468c` has tree
  `bb8fca46a99b6e07cdee9898c7b0f1b938fd5d51`, exactly the locally tested correction
  tree, and is PR #14's verified implementation head beneath this docs receipt.
- Repository quality run `35552625358`, attempt 1, passed at that SHA.
- Production run `35553029892`, attempt 1, was manually dispatched at that exact SHA.
  Its preflight was in progress when this handover was published. It owns Windows x64
  and macOS ARM64 core, SDK, desktop/package, packaged Source interaction/security smoke,
  artifact scan, and dependency inventory evidence. No success is inferred while pending.

## Exact next bounded action

Inspect production run `35553029892`, attempt 1, once it reaches a terminal state and
review its actual jobs/log markers, including `sourceAuthoringUiPassed: true` and
`sourceAuthoringStage: complete` on both supported targets. If it passes, independently
review draft PR #14 against the Phase 1F mandatory matrix. If it fails, record and fix
only the exact demonstrated Phase 1F blocker on this branch/PR. Do not merge, start
1G/1H, revive W0/OPT-1A, or perform unrelated cleanup without separate authority.
