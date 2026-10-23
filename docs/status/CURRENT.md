# Current status

## L17 hidden GPU-helper test failed

2026-10-23: The user selected GPU rendering in the Ren'Py canvas helper and required
hidden operation without keyboard focus theft. SDK process 32 failed before any
frame completed. The native adapter refused initialization; its failure path then
allowed Ren'Py to open an error window. External observation confirms the hidden
requirement failed and records no foreground application change.
[The failed capability test](../tasks/evidence/canvas-rendering.md#hidden-gpu-helper-capability-test-2026-10-23)
owns exact evidence, the unisolated refusal cause and the corrected guard's limits.

The prototype now exits directly on native startup refusal. Two zero-SDK simulated
failure checks pass; the corrected adapter/renderer remain unqualified in Ren'Py.
Production code is unchanged. The earlier matched producer diagnosis supports a
GPU-helper direction for the bounded Help composition, but hidden startup and
GPU rendering in the helper remain unproved. Windows fidelity, native timing,
physical keyboard, startup acceptance and smooth real helper dragging remain open.
Keep #36/B07/B08 and full 3B acceptance open.

Cumulative use is 76/76 local batches, 32/32 Mac SDK processes and 6/6 CI. Mac
packages/native editor remain 3/5 and 3/7; Windows packages/native/SDK remain
1/5, 1/7 and 10/20. A further test needs an explicit allowance supplement. Helper and observer have
exited; the game fixture is removed. No operation/watch remains pending.

Product/movement publication through `6b74c61` remains unchanged. The producer
diagnosis commits and this test record are local. Automatic approval review blocked
the #36 selection update as public publication without authorization; no workaround
write or push occurred. [HANDOVER](HANDOVER.md#active-l17-proof-handover) owns the
next action, publication blocker and protected recovery. Unrelated policy edits remain.

## Earlier canvas decision closeout

2026-10-22: The user confirmed the decision portion of
[L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36).
[ADR 0021](../adr/0021-separate-renpy-canvas-helper.md) records a separate Ren'Py
canvas helper for the later bounded Help proof. The decision is accepted; the
helper, matched rendering, performance and visual acceptance remain unproved.
Representative proof and renderer implementation were unselected at that closeout. The user selected
publication of the ADR, glossary and related contract/status changes as a separate
documentation commit. #36 records the verified publication and remaining criteria.
Historical allowances stay closed.

## Completed L01 owned blank screen

2026-10-22: [L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34) is accepted
for its bounded functional scope. Tested product candidate is `9313cc5`, with reviewed
corrections through `58b191c`. [CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39756288431)
is audited and passes both portable targets plus Windows native/SDK proof. Signed Mac
package 5 and native attempt 2 pass creation, exact Source, shared history and reopen
with accepted bytes, stable distinct IDs and complete process/disk/fixture cleanup.
Both review axes have no remaining code findings. [Evidence](../tasks/evidence/owned-blank-screen.md)
owns criterion mapping, exact identities, original failures and final allowance use.
No run or probe remains pending. L01's allowance is closed; the successor canvas
decision session is recorded above and selects no implementation.
Full editor/canvas, physical-keyboard and later human/phase acceptance remain separate.
The retained policy/Help record below predates this delivery.

## Phase 3B scheduling policy and retained Help result

2026-10-22: The bounded Help workflow has audited Windows x64 and signed Mac ARM64
functional proof. [CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39712450128),
attempt 1 at c2d9f45, passes both Windows service aspects and the packaged WebView/SDK
round trip. Source/history, frozen revision, Stop and cleanup pass.
[The evidence](../tasks/evidence/help-screen-production.md#ci3-terminal-audit-2026-10-22)
owns hashes, receipt limits and final counts; [the brief](../tasks/active/help-screen-production.md)
owns scope and acceptance.

The orchestrator approves the bounded functional implementation after independent
CI3 artifact/source review and the accepted Mac evidence. Full sign-off remains
withheld for material flow-v1 visual differences. Physical keyboard proof and
whole-phase acceptance remain separate. Local/CI allowances are spent.
No run or worker audit remains pending. Preserve unrelated maintenance/private receipts.
No PR, merge or release is authorized.

The user now requires [canvas agreement with Ren'Py](../tasks/reference/phase-3b-screens.md#canvas-agreement-with-renpy)
and requested overall 3B progress before implementation. The requirement is recorded;
implementation has not started and no execution allowance is renewed.

The [published cutover receipt](https://github.com/Caldwell-41/Renpy-editor/issues/22#issuecomment-6334003397)
makes GitHub ownership effective at `867528d`. [P3B](https://github.com/Caldwell-41/Renpy-editor/issues/22)
owns remaining delivery; product requirements and evidence retain repository owners.

The user established a [standing scheduling exception](../tasks/reference/phase-2-3-delivery.md#standing-phase-3b-scheduling-exception)
for all remaining 3B on 2026-10-22. Final Phase 2/3A acceptance no longer blocks
ticket starts; outstanding acceptance and actual technical dependencies remain.
After selection, the agent records and states a reasonable finite allowance and basis,
then proceeds under [the budget policy](../WORKFLOW.md#5-budget-the-problem-not-the-checkpoint-name)
without separate budget approval. Historical exhausted allowances stay closed.

GitHub parent, 27 leaves and two canvas groups carry the policy. The policy read-back
preserved all 38 parent and 41 start edges and all issue states/labels/assignees;
L01's later completion is recorded above. Repository policy and agent-guide changes
are included in the user-selected local documentation commit, with no push selected.
The later canvas decision session is recorded above. Representative proof and
renderer implementation stay deferred until explicitly selected.

Documentation/validator maintenance is complete and published with the reviewed baseline under
[its task](../tasks/active/agent-documentation-ownership.md) and
[ADR 0019](../adr/0019-task-briefs-and-evidence-ownership.md). It remains separate from
the Phase 3B requirement/review commit. The 213 frontend tests and 13 validator regressions
pass. No remote CI result is claimed.

## Product capability and acceptance

| Workstream | Implementation or reference | Evidence and remaining acceptance |
| --- | --- | --- |
| 3B Screens | Screen builder `flow-v1` approved; bounded Help sizing/preview published and functionally approved at `c2d9f45` | [Approved reference and scope](../tasks/reference/phase-3b-screens.md); audited Windows x64/macOS ARM64 functional proof passes. Material visual differences still prevent full sign-off. Full 3B remains pending. |
| Phase 2 Thinking and draft connection | Implemented at `36feff12` | [CI3 audit](../tasks/evidence/phase-2-execution.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16) supplies automated both-host proof. Matching signed-Mac/real Studio and Phase 2/3A human acceptance remain pending. |
| CI reliability | Accepted at `e00160b` | [Closed task](../tasks/active/ci-harness-reliability.md) owns portable/rendered and selected Windows native proof; allowances are closed. |
| Walkthrough model-load amendment | Automated scope review_ready at `7551a9c` | [Walkthrough task](../tasks/active/walkthrough-redesign-implementation.md) distinguishes controlled proof from remaining native/live/human acceptance. |

The [Screens approval JSON](../design/design-lab-screens/approval.json) pins the
reviewed source and 13 hashed captures. Screen notebook and Canvas focus remain
drafts. [Comparison notes](../design/design-lab-screens/README.md) own fictional
controls and limits. Production integration follows its selected task and INTEGRATION;
approval is separate from implementation acceptance. Earlier 3B allowances remain closed.

The [earlier full-app comparison](../tasks/active/browser-ui-design-lab.md) retains
its original review_ready result; its 24 app layouts and starter remain unapproved.
The source-map-js development advisory remains open.

The combined walkthrough remains paused at Step3. Preserve the protected user window
and existing isolated fixture. Native counts remain packages1/2 (first stale),
launches0/2, live0/4, output0/65536 and cached loads0/1.
[HANDOVER](HANDOVER.md#native-recovery-and-remaining-acceptance) owns exact recovery;
no earlier allowance is renewed by documentation changes.
