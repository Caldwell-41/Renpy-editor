# Automatic code checks and agent operation limits

## Outcome and authorization

On 2026-10-25 the user selected retrospective items 2 and 3: repair ordinary
test discovery and run the existing cheap code checks automatically on PRs.
This chat owns `codex/automatic-code-checks`, based on `23e27b4` from
`codex/phase3b-screen-designer`. Integration is a later user decision.

The user subsequently approved pushing the branch, opening a draft PR and auditing
CI, including fixes caused by this change. The PR targets
`codex/phase3b-screen-designer`, the verified base of the two implementation commits.

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
timing qualification or merge. Existing #36 acceptance and
protected recovery remain unchanged.

## Verification and review

State is `in_progress` for the policy amendment below. The code-check implementation is published in
[draft PR #61](https://github.com/Caldwell-41/Renpy-editor/pull/61), with the exact
implementation candidate's CI audit below. The new discovery regression first failed on the nine unexpected
compiled-recorder skips, then passed after separating that module. Ordinary offline
measurement tests remain selected. Explicit compiled selection without a binary
returns nonzero with the required setup instruction; no recorder ran.

The general Mac ARM64 runner passes all four groups. Its Python group runs 237
tests with only the three existing Windows exclusions; the ten retention tests
pass. Frontend typechecking and all 231 tests pass without skips. Workflow actionlint,
repository validation and whitespace checks pass. The Ubuntu PR results are below;
no Windows native run is selected by this maintenance.

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

Implementation use is 7/8 original batches, 7/12 absolute. Batches cover entry, reproduction,
test/CI implementation, formatting correction, verification, review/records and
local commit/closeout. No contingency or expensive operation was used. Unused
allowance closes with that implementation outcome.

The newly selected publication continuation adds six hard local batches to actual
use seven, giving a cumulative ceiling of thirteen, without new contingency. It
covers publication, CI audit, focused corrections and closeout, with at most three
automatic PR workflow runs. Manual dispatches, packages and native/SDK operations
remain zero. Historical unused allowances stay closed. Charged use is 11/13,
including publication, the implementation CI audit and final documentation
closeout with its automatic check audit. No implementation correction or manual
dispatch was needed. The automatic-run ceiling remains three; the implementation
run below passes, and publishing this closeout triggers one ordinary PR run.
Unused allowance closes with this publication outcome. Merge remains unselected.

## CI audit

[Repository quality run 40131940297](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40131940297),
attempt 1, tests published head `248c8fc74bd5b25ea0894ff5e88d3740beb0e35a`.
PR #61 targets base `23e27b4ca66bfe1a66642c2fdc6a7379d67e2eb9` on
`codex/phase3b-screen-designer`. The run completed successfully at 2026-10-25
06:56 AEST. The watcher delivery matched this chat and its receipt was acknowledged.
Both required jobs and every selected step pass. Ubuntu frontend typechecking and
all 231 tests pass with zero failures, cancellations or skips. Pinned Rust 1.90.0
workspace formatting passes. Repository validation covers 905 clean-checkout files;
all thirteen validator tests and the Q1 rejection/source audits pass. The nine
manual qualification jobs have no executed steps and remain outside this selection.

Ignored `automatic-code-checks/ci-01.json`, `ci-01.log` and `ci-01-audit.json` retain
the actual run metadata, logs and audit under `.toolchains/`. The draft PR still
targets the verified base and published head above. No product fix was required.
Documentation-only successors retain this tested implementation candidate; their
own automatic results remain visible on the PR and are audited in this chat.

## Operation-limit policy amendment, 2026-10-25

The user approved removing ordinary-work batch budgets and percentage contingency,
retaining single caps for costly or disruptive operations, and requiring the
`principle-fix-root-causes` skill when debugging. They also approved reconciling
the shared policy text in P3B #22 and the 25 open work tickets that repeat the old
rules. This amendment is ordinary documentation work with no numerical allowance.
Earlier selected limits and recorded consumption above remain historical and closed.

Conflict review found the old defaults in AGENTS, WORKFLOW, tracker/triage guidance,
the task template, the live delivery reference and those 26 issues. The new policy
has one repository owner, with an old section anchor retained for existing links.
The issues will link to a published policy commit. Existing task-specific limits,
acceptance, source/security/signing rules, dependencies and publication permissions
retain their scope. The selected GitHub updates change body text only.

Next action: publish the policy, reconcile the exact 26 issue bodies against fresh
snapshots, read them back and update PR #61. Validate links/privacy and whitespace,
review the changed instructions and audit the final automatic PR run. No new
product work, package matrix, native check, issue creation or merge is selected.
