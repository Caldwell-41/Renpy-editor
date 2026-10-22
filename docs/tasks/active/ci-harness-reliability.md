# CI harness reliability and testing documentation

## Current disposition

State `accepted`, 2026-10-17. All three deliverables are complete. There is no
pending CI, repair or acceptance work for this maintenance outcome. This path
remains the disposition record so existing task links remain useful.

The accepted implementation is `e00160b962ac09d70cb95000a6c10e4c205895c7`, tree
`42c061927bec9f0bbb0070e1e91f2368b6c93a9d`. Work used the chosen Mac development
host on `codex/phase3a-story-logic`; the current branch is recorded in
[CURRENT](../../status/CURRENT.md). This maintenance qualified both-host portable
and rendered gates plus the selected current Windows native sequence.

## Delivered scope

- Separate current testing guidance and focused runbooks from historical receipts;
  provide a searchable incident index and symmetric chosen-host/affected-CI routing.
- Run inexpensive independent harness groups with complete discovery and truthful
  failure/skip reporting; qualify current production-probe consumers independently.
- Migrate the opt-in Windows native connection harness to the current draft
  Connect/model/Save flow, whole-store transitions, retained Retry/Cancel and normal
  process/credential/listener cleanup; tighten Mac report admission.

## Acceptance

- TESTING is a concise current entry point; focused runbooks own durable contracts.
  Old links still resolve and unique evidence remains explicitly historical.
- The incident index is searchable, links to original task/run evidence, distinguishes
  product/harness/environment/uncertainty and remains useful after artifact expiry.
- AGENTS/WORKFLOW apply the same chosen-host/local-iteration/affected-CI rules in
  either direction. Native capability exceptions remain named; no routine machine switch.
- Existing cheap harness groups run independently with explicit failures, printed
  assertions and partial logs; exact host exclusions and nonzero/complete discovery
  remain enforced. No blanket skip, timeout increase or success normalization.
- Current UI qualification includes production probe consumers and reports independent
  renderer/browser/core/desktop outcomes, respecting actual prerequisites.
- Relevant local rejecting/integration checks, workflow lint and documentation checks
  pass; affected host proof is recorded separately from application/native acceptance.

## Acceptance results and evidence

| Acceptance area | Disposition | Evidence to consult |
| --- | --- | --- |
| Guidance, incident lookup, host routing and independent portable/UI groups | Accepted; original maintenance local5/6 and pairedCI2/2, including the failed first attempt | [Deliverables1/2 terminal audit](../evidence/ci-harness-reliability.md#ci2-terminal-audit-and-deliverable2-completion--2026-10-16) |
| Current Windows native sequence and both-host portable/rendered gates | Accepted at `e00160b`; run38969448685/attempt1/ordinal3 | [Final CI3 audit](../evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17) |
| Archive/source/named-result integrity | Audited for both hosts; source maps match the358-input candidate | [Archive and named-result audit](../evidence/ci-harness-reliability.md#archive-source-and-named-result-audit) |
| Native behavior, whole-store transitions and cleanup | Windows completes both phases,4+3authenticated GETs and two normal exits; Mac supplies portable/rendered and validator proof | [Windows acceptance](../evidence/ci-harness-reliability.md#windows-package-and-complete-native-acceptance) |

The [CI1 failure](../evidence/ci-harness-reliability.md#deliverable3-native-ci1-terminal-audit-and-proposed-repair--2026-10-16)
and [CI2 failure](../evidence/ci-harness-reliability.md#deliverable3-final-ci2-audit-and-missed-settings-interactions--2026-10-17)
remain failed attempts. CI2's exact failed UIA subcondition remains uncertain;
[the final diagnosis](../evidence/ci-harness-reliability.md#why-ci2-failed-with-the-product-unchanged)
explains the harness assumptions and qualified correction. Read those sections for
a matching failure or a proposed change to the affected gates.

Artifacts were audited before their recorded2026-10-23 expiry. The evidence file
retains their identities and results; it does not establish current hosted access.
Raw logs, packages and private paths remain outside Git.

## Closed allowances and separate acceptance

Final deliverable3 usage is local7/7, nativeCI3/3, Windows packages3/3,
launches5/6 and native fixture GETs13/21, including both failed attempts.
Deliverables1/2 remain local5/6 and pairedCI2/2. Unused capacity is closed; further
work needs a new selected outcome rather than a repeat of an old dispatch prompt.

Signed-Mac/real Studio and Phase2/3A human acceptance remain pending under their
own tasks. This maintenance grants no renewed allowance for them. Preserve the
protected user window and fixture; [HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance)
owns current recovery. Frozen historical routes, signing and credential policy
retain their existing boundaries.
