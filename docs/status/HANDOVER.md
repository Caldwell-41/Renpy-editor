# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a final-source R1 recheck complete, `review_ready`.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Entry handover:** `6be09a1f629a73b8eaba9f0e8960e02efcec52a3`.
**Tested application candidate:** `c12d953548992adc60b38682d0dcfda8cdeb9f94`.
**Candidate tree:** `3f8f6e769672572b008b2ffb4f283888afecfc31`.
**Verified PR base/main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
This closure changes documentation only after the tested candidate.

## R1 closure and evidence

The user selected the final 1G.2a recheck and conditional R1 closure/1G.2b prompt,
excluding physical testing, merge and 1G.2b implementation. **R1 technical gate PASS;
R1-B1 and R1-B2 closed.** No blocker remains in this bounded source/evidence review.
Implemented/tested status remains separate from user acceptance.

[Native R1 36148942247](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247),
**attempt 1**, succeeded on the exact application candidate. Windows job `108117024512`
and macOS job `108117024959` passed all required gates. Complete job logs and all six
files in each target artifact were inspected. Checkout/run/attempt/candidate agree;
ZIP size/SHA-256/CRC and all **60 input hashes per target** match. Both reports say
`targetPassed: true`; only the cached SDK download was skipped, while verification and
explicit SDK execution passed. Exact provenance, ZIP digests and gate limits are in the
[closure ledger](../tasks/active/phase-1g-branches-runtime-git.md#final-source-r1-recheck-and-closure--2026-09-26).

Per target: frontend **50 passed, 0 failed/skipped**; runtime core Windows **17** /
macOS **18 passed**, each **2 ignored**; explicit official-SDK service **1 passed**;
desktop compile/report unit test **1 passed**; Source Save/selection browser, production
build and format passed. The ignored core entries are the separately executed SDK gate
and child-process fixture. These are targeted native tests, not a full core or packaged
UI run. [Exact-candidate quality 36148947574](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148947574),
attempt 1, also passed.

The corrected helper cancels completed preparation using its captured request receipt
while authoring owns the service. Its actual-helper/Source-controller regression and
the native held-owner/deferred-cleanup test pass on both targets. They remain separate
frontend-injection and real-host proofs, not a combined renderer/native end-to-end claim.
Source/Scene input is retained; R1-B2 lifecycle/descendant/history closure stands.
Native keyboard, packaged runtime UI and human acceptance remain deferred under TESTING.

## Publication and next bounded action

Publish this coherent documentation closure non-forced on the existing branch and
verify remote head/tree/content; retain PR #17 draft/open. No local-only application
change, outstanding native operation, manual dispatch or retry exists. Preserve all
historical run provenance, including `36144974132` PASS on its actual `07f23b6` inputs.
Local repository validation passed for 243 files and `git diff --check` passed.
Do not run another native/package matrix solely for documentation.

**Next eligible checkpoint, only upon the user's explicit selection:**
[1G.2b — Runtime UI and navigable diagnostics](../tasks/active/phase-1g-branches-runtime-git.md#6-1g2b--runtime-ui-and-navigable-diagnostics).
Read that section, cross-cutting contracts, sections 8–9 and
[testing ownership/cadence](../TESTING.md#phase-1g-testing-ownership-and-cadence).
Complete only that checkpoint and its agent-run gates, publish its ledger/handover and
stop at the documented acceptance boundary. 1G.2b remains `not_started`; presenting a
next-chat prompt does not authorise its execution. Final G1/R1/R2 review and human
acceptance remain separate. No merge, physical testing, optional Git, Phase 2 or 1G.2b
implementation occurred in this closure.
