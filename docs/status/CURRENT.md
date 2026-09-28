# Current status

**Updated:** 2026-09-28.
**Current checkpoint:** R2-P1-Q1-PREP review and corrections, `review_ready` for
Q1-EXEC selection; see the [review record](../tasks/active/testing-policy-alignment.md#q1-prep-review-and-corrections--2026-09-28).
Four termination parents and both embedded SDK specialist blocks are separated; the
Prepared recovery regression and both workflow selectors are aligned. No compiled or
hosted test evidence is claimed. Rules remain in
[WORKFLOW](../WORKFLOW.md#proportionate-delivery-rules).
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Reviewed preparation:** published `e8dc1fac3c2f2c6844026a70ba34133a70427bb4`;
the review correction is its successor on this branch.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration performed.
No build, app launch, workflow dispatch or application acceptance is part of this update.

## Phase 1G capability status

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / observed saved-state graph | Yes; G1-OBS replaces retired full-verification display | Corrected G1-OBS qualification passed at its candidate; preserve exact timer/layer limits | Local Mac assessment is supporting evidence; Windows/native and final acceptance remain open |
| Runtime foundation (1G.2a) | Yes; R1-B1/B2 corrections retained | R1 closure on `c12d953`, run `36148942247`; final-source regression still required | Final packaged/native acceptance remains separate |
| Validate/Run/Stop and navigable diagnostics (1G.2b) | Implemented, including the Windows heap-buffer fix | Local Windows cases passed; coherent standard Windows/macOS package qualification incomplete | Final user session on both targets remains open |
| Integration / 1H | 1G not merged; 1H separately selected | Conflicts and affected integrated-tree gates remain | No new acceptance or automatic duplicate human pass |

[Optional Git](../tasks/active/optional-local-git.md) stays deferred, not a Phase 1/1H
or Phase 2-entry requirement. Editing during play is script-only; asset changes need Stop.

## Preserved evidence and approval boundary

[The Phase 1G ledger](../tasks/active/phase-1g-branches-runtime-git.md) retains detailed
history and exact evidence; historical next-step instructions are not live authority.
The incoming detailed status remains in Git history, not a new handover snapshot.

- G1-OBS: implementation `1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`, qualification
  `a6063080006769613733de20fcd82265bf96b632`, run `36291545085`, attempt 1. Both targets
  passed its selected core/Chromium boundary; this is not packaged native-input or SDK acceptance.
- WIN-F1 (ledger 27): two heap buffers, six focused SDK checks and five local cases
  passed; isolation overrides/no installer limit the evidence. Do not spend unused allowances.
- MAC-N1 (ledger 32): package `22fbf65d1c9db712d574657c53638b413436dee8`, physical-Mac
  native assessment with recorded fixture/procedure limits; no SDK/game qualification.
- TEST-P2 (ledger 33), `699395d`: Chrome timing-only overruns are diagnostic;
  functional/evidence failures remain blocking. No historical failure is rewritten.
- R2-P1 `36293797731`, attempt 1, `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains
  FAIL, with missing original executable and skipped downstream gates. H1 `36310107481`,
  attempt 1, `238aa9fde5bb15243912ae89abdc4bcf2c21af78`, remains FAIL; precise upstream
  graphics cause is unresolved. Neither operation is pending in the incoming handover.
- Accepted/integrated Phase 0 and corrected 1A-1F remain preserved. Phase 1F closeout
  `973e3565d7cf41c6dca936df088ced10969821ac`, post-merge run `35821582755`, is closed;
  the [1F evidence](../tasks/archive/2026-09-23-phase-1f-save-correction.md#728-corrected-packages-and-native-f4-evidence)
  and later distribution limitation DIST-MAC-01 remain unchanged.

**Next goal:** R2-P1-Q1-EXEC, the automated qualification itself. Selecting it uses one standard
production dispatch on the existing Windows x64 and macOS ARM64 hosted runners, after
rechecking the candidate and access at dispatch. This review found access available,
no feature-branch rules and no PR comments/reviews; it fixed Python portability,
Rust formatting, macOS artifact preservation and stale instructions. Codex may
run on any repository-capable host with Actions coordination access; no physical test
machine is selected. No package run, app launch or CI dispatch was part of Q1-PREP.
PR #17 conflicts/integration, Windows native responsiveness, final human sessions and
integrated 1H remain open. No historical failure or candidate is reclassified. See
[HANDOVER](HANDOVER.md) for publication status and the next-goal prompt.
