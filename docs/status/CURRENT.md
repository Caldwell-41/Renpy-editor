# Current status

**Updated:** 2026-09-28.
**Current checkpoint:** TEST-POLICY-1 delivery rules and machine-aware prompts,
`review_ready`; see the [policy/alignment ledger](../tasks/active/testing-policy-alignment.md).
The user approved implementing the seven retrospective rules and reviewing the commit.
Rules live in [WORKFLOW](../WORKFLOW.md#proportionate-delivery-rules); they do not
implement or authorize the pending production workflow/test migration.
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Incoming baseline:** `ba403d38853c5625089216c59c6e175eac741ed6`.
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

**Recommended next action, not yet selected:** TEST-AUDIT-1 in the policy/alignment
ledger: audit active testing instructions, workflow selectors and ledger-34 proposal
against the new rules before selecting package execution. Codex can run on any machine
with repository access; no specific OS, native build, app launch or CI dispatch is needed.
R2-P1-Q0 remains review-ready at its historical boundary. Its Q1 preparation/matrix is
still unapproved; do not dispatch the existing unrestricted workflow as a shortcut.
See [HANDOVER](HANDOVER.md) for continuation and evidence limitations of this rules edit.
