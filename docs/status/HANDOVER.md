# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** G1-RESET — hobby-editor scope and acceptance reset, complete.
**Decision:** accepted by the user's instruction to execute the proposed refocus.
**Implementation status:** pending G1-OBS; no product-code changes in this checkpoint.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Entry and unchanged code head:** 4f05e57fba66493afaa436b9ba0332210dcecf58.
Resolve publication head from Git/PR; do not create a self-SHA receipt commit.

## Current contract

Read [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md) and
[ledger 21](../tasks/active/phase-1g-branches-runtime-git.md#21-g1-reset-hobby-editor-scope-and-acceptance--2026-09-27).
The user explicitly rejected disproportionate hostile-system hardening for this
single-user hobby editor and approved the product/scope reset.

Protect save/reopen/undo, ordinary competing editor writes, interrupted-save recovery,
drafts and custom source. Keep basic containment/unsupported-link checks, narrow IPC,
safe SDK/archive/process handling, privacy and deliberate Validate/Run consent.
Existing write/recovery mechanisms stay in place; no blanket security-check removal
or transaction rewrite is selected.

Branches shows the last observed saved state, updated after accepted app edits.
Open/focus/Refresh acquires disk observations and reconciles ordinary changes.
Show check/pending/error status; preserve usable graph, focus and drafts.
Navigation checks its target; graph data never authorizes a write or execution.

ADR 0009's all-source fresh verification and G1-O native continuation are superseded.
The denied symlink privilege is not a blocker for this new display contract.
Historical tests/results are preserved and explicitly historical. Do not resume
the native experiment or request privilege/security changes.

## Next bounded implementation: G1-OBS

The product direction is decided. The next checkpoint implements it; no further
native feasibility review is required. Follow the file-level plan and gates in
ledger 21 and ADR 0010:

- Introduce session-owned observed inputs/status in production flow, update them after
  accepted mutations, and coalesce open/focus/explicit disk refresh.
- Reuse existing source/project services, graph projection, transaction and runtime
  owners. Remove the display-only full verification requirement, not write safeguards.
- Make status and refresh/navigation feedback truthful; retain focus, selection,
  pan/zoom and dirty Source buffers; discard old-session work.
- Update production tests and workflow selection to the new semantics in the same
  implementation. Retain specialist historical experiments without making them
  routine acceptance blockers. No selector-only removal of a failing assertion.
- Prove ordinary external edits, save/history/recovery/authority and fixed-fixture
  responsiveness. G1-U2 is <250 ms accepted-model update and <2 s initial/disk refresh;
  retain G1-V2 rendered input/pan p95 <100 ms. No measured pass exists yet.

Keep this checkpoint bounded to observed-flow integration and relevant regressions.
No SDK/runtime redesign, graph renderer replacement, package matrix, merge, optional
Git or Phase 2. Native/CI execution must have a concrete changed-input justification
and the applicable checkpoint authorization; this handover does not dispatch anything.

## Validation, evidence and publication

This scope reset is documentation/governance only, including AGENTS, product/security,
architecture/data/UI, testing/phase plans, the superseding ADR and current status.
The repository validator, link/privacy scan and whitespace/scope review qualify
publication; they do not qualify the pending product implementation.

Existing feature checkout was clean on entry; fresh fetched/advertised feature
matched 4f05e57, main 4d7ba0333c48d60242a9a42d3e079fea499a5531.
Prior repository chats were idle and no active build/native writer was found.
Historical worktree stays clean at b3d696533290d91bc2ff7d4eb65562d2c68642e1.
Keep local comparison/full-breakdown, CSVs, raw logs/state and G1-O1-N one-shot markers.
No benchmark, test executable, setup, dependency/security change or CI dispatch ran.
No process or external operation is pending.

Publish this coherent decision on the existing branch using repository-local noreply
identity; retain draft/open PR. Verify remote publication, then stop at the scope-reset
checkpoint. Final 1G acceptance remains open; next-chat selection is G1-OBS.
