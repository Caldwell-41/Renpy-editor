# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Delivery:** [Phase 1F only](../tasks/active/phase-1f-source-synchronisation.md).
**State:** implementation complete; supported-target production run dispatched and
pending, then stop for independent review.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft
[PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Implementation candidate:** `4fc544559e9f5d7ea8d591f08b95fb58bf2c30ef`.
**Candidate tree:** `50e503c0403afaa01bc95779212a9ce66391555e`, exactly matching
the locally validated implementation commit tree.
**Baseline:** `8862495f5465c35a0d951fa65743be52d3c813e7`.

## Completed and preserved

The continuation resumed from the recorded core Source boundary without replaying
Phase 1F entry checks, CI-SIMPLE, merged-branch housekeeping, or earlier native gates.
It reused the existing branch and PR. No unrelated checkout, branch, PR, or historical
optimisation work was changed.

Phase 1F now provides anchored existing-`.rpy` discovery; UTF-8/BOM/newline-aware,
bounded session drafts; explicit Save, Save All, Discard and exact non-overlap Apply
Both; source-map reconciliation and shared committed history; dirty/conflict/missing/
invalid/read-only states; same-file Scene/supporting/history guards; and clean external
refresh. Multiple ambiguous same-kind edits invalidate Beat identities rather than
guessing, while exact-content reorders follow their existing IDs.

The Source centre workspace includes file navigation, line numbers, monospace editing,
mapped and Custom Code ranges, static diagnostics, Source-focused save, native draft
undo/redo, exact bidirectional Scene selection, session-only draft warning, and explicit
conflict controls. Project close, switch, and normal window exit share Save All /
Discard All / Cancel behavior. Packaged smoke performs an actual Source open, edit,
Pending validation, save, and Saved transition, and the workflow asserts its completion.

No Branches, SDK Run/Validate, local Git surface, UI Designer, Timeline, arbitrary
project import, raw source create/move/delete, autosave draft journal, general Ren'Py
parser, privilege/CSP widening, or 1G work was included.

## Validation and publication

- `python3 scripts/validate.py`: 209 repository files passed.
- `git diff --check`, staged diff check, `cargo fmt --check --all`, and core clippy
  with `-D warnings`: passed.
- `cargo test -p loomlight-core --locked`: 150 total, 146 passed, zero failed, four
  ignored subprocess-worker markers. The ignored entries are fixtures invoked by their
  parent crash tests, not skipped product tests.
- `npm run check`: typecheck plus 19/19 frontend tests passed. `npm run build` passed.
- Lossless-source suite: 26/26 passed. SDK adapter/archive suite: 24/24 passed.
- Lossless benchmark: 620,000 bytes / 40,000 nodes, 237.50 ms median over seven samples.
- Local `loomlight-desktop` and Tauri package attempts were unavailable before compile
  because this Linux client lacks `pkg-config`/GLib development metadata. Supported
  Windows/macOS CI is the authoritative desktop/package gate.
- Remote candidate `4fc544559e9f5d7ea8d591f08b95fb58bf2c30ef` has tree
  `50e503c0403afaa01bc95779212a9ce66391555e`, exactly the locally tested tree, and is
  PR #14's verified head.
- Repository quality run `35544769657`, attempt 1, passed at that SHA.
- Production run `35544944804`, attempt 1, was queued at that exact SHA when this
  handover was published. It owns preflight plus Windows x64/macOS ARM64 core, SDK,
  desktop/package, packaged Source interaction/security smoke, artifact scan, and
  dependency inventory evidence. No success is inferred while pending.

## Exact next bounded action

Inspect production run `35544944804` once it reaches a terminal state and review its
actual jobs/log markers. If it passes, independently review draft PR #14 against the
Phase 1F mandatory matrix. If it fails, fix only the demonstrated Phase 1F defect on
this branch/PR and rerun the justified gate. Do not merge, start 1G/1H, revive W0/
OPT-1A, or perform unrelated cleanup without separate authority.
