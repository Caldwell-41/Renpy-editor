# Current checkpoint handover

**Prepared:** 2026-09-21.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE — bounded Save correction](../tasks/active/phase-1f-save-correction.md).
**State:** `not_started`; reviewed implementation plan published, application unchanged.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Last application candidate:** `4dfedd24b4831972376d69fde216ad2063d708d4`.
**Application-candidate tree:** `f925db131c27fd744d13b64fadd6019ab370e1ea`.
**Reviewed docs-only head before this plan:** `3aebbcd9aff8a051e28f5b92dc6e50ee324dd3b5`.
**Integration baseline:** `8862495f5465c35a0d951fa65743be52d3c813e7`.

## Start here

Read AGENTS.md, CURRENT, the full 1F-SAVE brief and [ADR 0007](../adr/0007-shell-save-command-ownership.md).
The [parent Phase 1F brief](../tasks/active/phase-1f-source-synchronisation.md) retains
product invariants and historical evidence. Inspect actual branch/PR/worktree and
existing execution ownership. Preserve newer work; quoted SHAs are evidence, not reset
instructions. Do not replay entry checks, CI-SIMPLE or housekeeping.

The previous instruction to dispatch production for `4dfedd24` immediately is
superseded. The next implementation goal is one correction: reproduce/fix the smoke's
unchanged-text dirty model; replace split shortcut ownership; fix related retention,
operation, stale-completion, modal/leave and persistence-state issues; add and execute
the required tests. No transaction/parser rewrite or new command framework is selected.

## Important diagnosis and acceptance limits

The failed smoke predicate combined observing `source.save` and a Saved fake project
state. It did not log the Source operation sequence. Do not repeat the unsupported
claim that it proved Save never ran or that native WebViews skip target listeners.
The reduced browser reproduction demonstrates a mock re-dirty mechanism, not exact
historical Windows/macOS event ordering. Reproduce it using the actual UI/test model.

Successful real `source.save` already crosses the shared durable transaction boundary;
clean/non-Source Save still needs ordinary Flush. A failed latest draft update must
not allow older retained text to be saved or replace the only copy of local input.

## Required verification and publication

Follow S1-S5, local L1-L16 and target P1-P5 in the correction brief. Record failing-
then-passing regression evidence where applicable, exact commands/test names, counts,
skips/unavailable environments, and a requirement-to-evidence matrix. Self-review the
complete diff, fix significant findings, and rerun affected checks before claiming
implementation is ready for target validation.

When the user starts the supplied implementation goal with target validation, run the
existing production gate once on the coherent corrected candidate after local checks
pass. Do not dispatch a documentation-only matrix, duplicate an uncertain/running
run, or substitute synthetic shortcuts for real native Ctrl+S/Cmd+S evidence. A missing
native host/manual check or real-service persistence check is outstanding acceptance,
not a pass. Record exact run/attempt/SHA and inspect terminal jobs/artifacts.

For a long CI wait or interruption, publish the execution ledger and this handover
with the outstanding operation/next bounded action, then stop active model polling
under WORKFLOW. On completion, publish the correction ledger, parent milestone summary,
CURRENT, this one HANDOVER and PR body, verify remote publication, and stop for
independent review. No merge, Phase 1G, new branch/PR, or W0/OPT-1A work.

## Retained evidence

- `35544944804`, attempt 1, at initial `4fc54455`: failed packaged Source smoke on both targets.
- `35553029892`, attempt 1, at `822e3fbe`: both targets reported `source-focused-save: Timed out waiting for Source acceptance`; earlier core/SDK/boundary/package steps passed.
- `35554153917`, attempt 1, at `4dfedd24`: repository quality passed; no reviewed production acceptance for that application candidate.
- Original local validation and unavailable Linux desktop-toolchain details remain in the parent ledger. They are not fresh results for 1F-SAVE.

This handover records a documentation-only planning publication. No application fixes,
new application validation or production dispatch have been performed by that task.
The implementing chat must record its actual fresh candidate and outcomes, not inherit
planned acceptance as completed work.
