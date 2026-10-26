# Current status

## L02 Help composition approved for implementation

2026-10-26: Kris approved C5 for [#37](https://github.com/Caldwell-41/Renpy-editor/issues/37)
and requested returning it to the original implementation chat. The approved
`workflow-popup-v1` covers add, select, edit, reorder and confirmed removal of
ordinary owned elements. Every removal uses a stationary modal; protected source,
containing groups and the screen root remain protected. Luna research and independent
Experience First reviews informed the prototype.

The source is pinned locally at `94c78e7` on `codex/37-compose-help-layout`.
[The approval record](../design/design-lab-help-composition/approval.json) owns the
source fingerprint, 16 retained captures and agreed behavior.
[The handback evidence](../tasks/evidence/simple-help-layout.md#c5-approval-and-handback-2026-10-26)
owns verification and continuation details. The original implementation chat regains
checkout/server ownership when the handback message is sent. Previously approved
core, DOM and real UI-to-core/runtime test boundaries remain approved.

| Capability | Implementation | Evidence and acceptance |
| --- | --- | --- |
| Owned blank screen (#34) | Implemented | Accepted for its bounded scope. |
| Bounded Help canvas (#36) | Implemented | Prior matched-rendering, physical-input and smoothness acceptance retained below. |
| Add/edit/reorder/remove (#37) | C5 design approved; production pending | 84 targeted rendering cases and complete workflow/popup checks pass; real source/history/reopen/runtime proof remains due. |

## Automatic checks and operation-limit policy

[PR #61](https://github.com/Caldwell-41/Renpy-editor/pull/61) is merged into the
Screens base at `8f7f9e7`. Automatic frontend/Rust-format checks and the operation-limit
policy are included. [The maintenance task](../tasks/active/automatic-code-checks.md)
retains its CI audit and the verified policy reconciliation in 26 open 3B issues.
Existing acceptance and explicit limits retain their scope.

## L17 bounded Help proof accepted

2026-10-24: [#36](https://github.com/Caldwell-41/Renpy-editor/issues/36)'s remaining
Windows functional and smoothness acceptance is complete. Guided attempt 2 passed
all eight stages on source `8dae4e3`, executable SHA256
`b896066a534073f86fb20898150f15dc93f3671e7719b85cf514fcc2a9cb8810`.
The user confirmed, "I supplied all input; both were smooth", in response to the
question about moving/resizing without sticking, jumps or lost focus. Exact source
restoration, fresh geometry, normal editor/helper exit and owned cleanup pass.
Attempt 1 remains a failed sequence check after extra movement during the resize
stage; no product, probe or admission code changed between attempts.

[Windows closeout evidence](../tasks/evidence/canvas-rendering.md#windows-functional-and-smoothness-closeout-2026-10-24)
maps each criterion and retains the original failure, hashes and user acceptance.
Earlier ADR, both-target/two-aspect matched rendering, Mac physical input and Mac
smoothness retain their accepted scope. The recorded release timing decision is
unchanged. Full supported-subset, editor layout and phase acceptance remain separate.

Final cumulative use is 138/139 work batches, including both final reviews and
closeout/publication. The one unused batch is closed with this outcome. Windows use is 3/4 package
attempts, 2/3 editor sessions and 2/4 SDK launches. The user increased only the
package cap from two to four. No CI dispatch, Mac run or added contingency occurred.
Historical unused allowances remain closed.

Standards and Spec reviews both pass with zero findings. The closeout is on
`codex/phase3b-screen-designer`; #36 owns its final tracker reconciliation.
No process, job or watcher remains. No successor task, PR, merge or release is
selected. [HANDOVER](HANDOVER.md#l17-closeout) preserves recovery and local evidence;
the prior Windows checkout's unrelated edit remains safely stashed.

## L17 matched rendering passes on both targets

2026-10-23: The selected [L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36)
matched-rendering comparison is complete. Mac ARM64 and Windows x64 each match the
accepted Ren'Py Help composition exactly in normal/hover states at 1280x720 and
1024x768. All eight samples have zero differing RGBA pixels, matching inputs and
geometry, and complete cleanup. No tolerance was required. Independent terminal
Standards and Spec reviews have no remaining finding for this bounded comparison.

Mac tested `ae48ef9`; audited [CI13](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39948440369)
tested `d1d3d99`, whose intervening changes affect only workflow routing and evidence.
The exact downloaded archive and both Windows executables pass hash verification.
[Evidence](../tasks/evidence/canvas-rendering.md#both-target-matched-rendering-closeout)
owns identities, mappings, original failures and limits;
[HANDOVER](HANDOVER.md#active-l17-integration-handover) owns recovery.
No operation or watcher remains pending.

Final comparison use is local 22/24, CI 2/2, Mac SDK 3/6 and Windows SDK 2/6;
no contingency was used and this allowance is closed. Earlier integration/shutdown
qualification remains intact. This comparison alone did not establish physical
keyboard, native presentation timing, smooth manipulation or whole-ticket acceptance.
The current both-target timing waiver above supersedes that gate for this release.
The full supported subset remains separate. Unrelated policy edits are local and uncommitted. No PR, merge or
release is selected.

## Parallel worktree policy update

2026-10-22: The user selected parallel agents in separate worktrees, including while
another assigned worktree awaits CI. [WORKFLOW](../WORKFLOW.md#parallel-agents-and-worktrees)
owns coordination, integration and commit-specific evidence; the watching chat still
yields under ci-watch. [The documentation task](../tasks/active/parallel-agent-worktrees.md)
records completed validation and the unchanged recovery state. The live P3B parent
is reconciled. On 2026-10-24 the user authorized committing and pushing the repository
policy edits on the current branch. This selects no product work or new runtime allowance.

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
