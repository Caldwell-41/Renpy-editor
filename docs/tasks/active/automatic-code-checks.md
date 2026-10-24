# Automatic code checks and recorder test selection

## Outcome and authorization

On 2026-10-25 the user selected retrospective items 2 and 3: repair ordinary
test discovery and run the existing cheap code checks automatically on PRs.
This chat owns `codex/automatic-code-checks`, based on `23e27b4` from
`codex/phase3b-screen-designer`. Integration is a later user decision.

## Scope and acceptance

- Ordinary Python discovery includes offline canvas measurement tests and excludes
  tests that require a separately compiled Mac recorder. Unexpected skips still fail.
- The compiled-recorder tests remain available through an explicit command in
  [the native runbook](../../testing/NATIVE.md#standalone-mac-canvas-recorder).
- PRs and main pushes run frontend typechecking/tests and workspace Rust formatting
  with the repository's toolchain versions. Manual native selectors remain separate.
- Focused discovery/gate tests, existing portable checks, workflow lint and the new
  code-check commands pass, or retain a concrete failure and its limits.

This maintenance selects no SDK, application/package build, native input, capture,
timing qualification, tracker publication, PR or merge. Existing #36 acceptance and
protected recovery remain unchanged.

## Verification and review

State is `review_ready`. The local implementation is complete; no remote CI result
is claimed. The new discovery regression first failed on the nine unexpected
compiled-recorder skips, then passed after separating that module. Ordinary offline
measurement tests remain selected. Explicit compiled selection without a binary
returns nonzero with the required setup instruction; no recorder ran.

The general Mac ARM64 runner passes all four groups. Its Python group runs 237
tests with only the three existing Windows exclusions; the ten retention tests
pass. Frontend typechecking and all 231 tests pass without skips. Workflow actionlint,
repository validation and whitespace checks pass. Validation covers local commands
and workflow structure, not an executed Ubuntu job or a Windows native run.

The original Rust formatting check exposed existing drift and a module lookup
failure in an example's path import. Commit `e8039df` formats 53 Rust files and
makes the Windows child module path explicit. Every changed Rust file was compared
with pinned formatter output from its original source, allowing only that explicit
path addition. Small compile-only fixtures confirm that ordinary and example path
imports both resolve the same child file. No fixture executable ran. The full pinned
workspace formatting check now passes.

Self-review checked automatic PR/main routing, isolation from manual selectors,
unchanged strict skip validation, retained offline/explicit test selections and
the runbook commands. The existing checks cover the failure without an added
package matrix or application behavior change.

## Allowance and closeout

Original allowance: eight local work batches covering preparation, reproduction,
implementation, focused verification, review and closeout. Contingency is four
batches; the absolute ceiling is twelve. CI dispatches, packages and native/SDK
launches are zero. Historical #36 allowances stay closed.

Final use is 7/8 original batches, 7/12 absolute. Batches cover entry, reproduction,
test/CI implementation, formatting correction, verification, review/records and
local commit/closeout. No contingency or expensive operation was used. Unused
allowance closes with this outcome. Work remains on the local branch; publication
and integration await user selection. No further implementation is pending.
