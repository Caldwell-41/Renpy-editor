# Current status

**Updated:** 2026-09-27.
**Current checkpoint:** G1-RESET complete: accepted hobby-editor product/scope reset.
**Implementation:** last-observed Branches and replacement gates are pending G1-OBS.
**Branch:** feature/phase-1g-branches-runtime, draft/open
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Entry/code head for this documentation checkpoint:
4f05e57fba66493afaa436b9ba0332210dcecf58.
Read [HANDOVER](HANDOVER.md),
[ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md) and
[ledger 21](../tasks/active/phase-1g-branches-runtime-git.md#21-g1-reset-hobby-editor-scope-and-acceptance--2026-09-27).

## Selected direction

Prioritize protecting hobby creators' work: save/reopen, undo, ordinary external
editor conflicts, interrupted-save recovery, preserved drafts/custom source and
responsive views. Keep basic containment/unsupported-link refusal, narrow IPC,
privacy/download safety and explicit project-code execution.

Branches will show the last observed saved state, updated after accepted app edits.
Open/focus/Refresh checks disk; clear check/error status replaces a continuous
freshness claim. Navigation, writes and execution keep their own current-state
checks. Deliberate same-user filesystem attack races are outside initial acceptance.

ADR 0009 and the G1-O1/O2/O3 native/full-verifier continuation are **retired**.
The G1-O1-N missing symlink privilege is no longer a prerequisite for display work.
No further native-reader experiment or security-setting change is needed.
Historical failures remain failures, not newly accepted product evidence.

The next bounded implementation checkpoint is **G1-OBS**: production observed-state
flow, mutation invalidation and disk refresh, status/focus/navigation behavior,
ordinary reliability regressions, and coherently updated test/workflow selectors.
G1-U1/U2 replace the old G1-V1 contract; retain G1-V2 interaction and runtime/diagnostic
obligations. Budgets are <250 ms accepted observed-model update, <2 s initial/explicit
disk refresh and rendered input/pan p95 <100 ms on the unchanged fixture.

## Actual implementation and evidence

This reset changes documentation only. The current app and workflow still implement
the old verification behavior; no revised performance or safety acceptance is claimed.
Do not run old native proof selectors as qualification for the new contract.
Final 1G/R1/R2 integration, supported-target evidence and the final human session
remain incomplete. No CI dispatch, package run, merge or background work is pending.

Preserve ledgers 13–20, the clean historical worktree and local reports/state/logs.
Historical production run 36210484651 failed Windows at 616.686 ms; candidate run
36278262505 attempt 1 failed Windows at 563.983 / 574.858 / 586.393 ms; local comparison
was 460.195 / 464.211 / 456.588 ms. G1-O1-N's one ordered safety test stopped with
Win32 1314 after partial positive assertions. These results belong to their original
inputs/contracts. New observed-state evidence is required.

## Preserved baseline and earlier closure

- Integrated application: Phase 0, corrected Phase 1A–1F and CI-SIMPLE. Phase 1F is
  accepted/merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
  Integrated closeout `973e3565d7cf41c6dca936df088ced10969821ac`; existing post-merge
  [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755)
  passed both targets and is closed. The six original Save passes and native F4 A/B/C
  reports remain preserved in [1F ledger 7.28–7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#728-corrected-packages-and-native-f4-evidence).
  DIST-MAC-01 remains a later distribution limitation.
- Phase 1G.1 candidate `fde8cdafd77fe807f2307fb607fc7546ca66ffec` and targeted Linux
  evidence remain preserved; final target acceptance is separate.
- R1-B1/B2 closure: `c12d953548992adc60b38682d0dcfda8cdeb9f94`, tree
  `3f8f6e769672572b008b2ffb4f283888afecfc31`, native run `36148942247`, attempt 1,
  both targets passed with complete logs/artifacts and all 60 input hashes verified.
  Earlier prerequisite `36126490939` and production `36136466567` evidence is distinct;
  see [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger).
  Final-source regression remains part of 1G.2b.
- Main inspected for this review: `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
  Its bounded workflow-dispatch addition is already represented on the feature branch.
  No integration was performed here. Phase 1G is not merged.
- [Optional Git](../tasks/active/optional-local-git.md) remains deferred, not a
  Phase 1/1H or Phase 2-entry requirement. Editing during play remains script-only;
  asset mutations require Stop. One final human 1G session follows agent verification.
