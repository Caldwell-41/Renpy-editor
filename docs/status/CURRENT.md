# Current status

## L06 UI-image implementation ready for review

[L06 #40](https://github.com/Caldwell-41/Renpy-editor/issues/40), "Import and place a
UI image", is implemented on `codex/phase3b-l06-ui-image`, based on `2e045d9`.
Kris approved A2 in the separate prototype chat. Both independent review axes clear
the product and checker corrections. The ticket remains open for acceptance. Kris selected draft PR publication into
`codex/phase3b-screen-designer`; merge and release remain unselected.

| Capability | Automated proof | Native/human status |
| --- | --- | --- |
| Typed image import, retained drafts, size/aspect, Source and history | CI3 passes 269 frontend cases, 54 screen-core positives with three explicit SDK ignores, constrained-stack import, actual controller/core and exact probe rehearsal. Earlier ordinary-core/desktop results retain their original scope. | Mac and Windows WebViews pass all five image variants, sizing/history/Source/reopen, accepted disk bytes and cleanup. Mac signing and Windows retained executable/hash/x64 checks pass. |
| Actual chosen asset rendering | Mac GL2 and Windows ANGLE2 normal entry/helper pass both aspects, exact geometry and zero differing independent-reference pixels. Normal capture also passes repeatability and empty-Render isolation. | Physical input, OS file-dialog and human acceptance remain separate. |
| A2 inspector | Approved source/captures and scoped wide/compact comparison retained. | Full Design Lab startup timeout remains failed; complete promotion validation is not claimed. |

[CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40816702645/attempts/1)
passes at exact `b00415f`; its event, artifacts, retained executable and operation
use have been audited. Later records change evidence/status only. CI1/CI2 remain
failed with their original evidence. No watcher or required CI audit is pending.
[Evidence](../tasks/evidence/ui-image.md#ci3-success-audit-and-review-ready-outcome)
owns the criterion map and candidate-bound receipts; [HANDOVER](HANDOVER.md#l06-implementation-and-qualification)
owns continuation. #40 owns cumulative limits; all three dispatches are consumed.
Earlier closed allowances and protected recovery remain intact.

## L04 nested and clipped layouts merged

[PR #67](https://github.com/Caldwell-41/Renpy-editor/pull/67) merged into
`codex/phase3b-screen-designer` at `df3d8cac6f1f6d55df340d8a90041a72eaa8de98`.
Its tree exactly matches reviewed head `76db7da`. Kris selected this merge after
both review axes reported zero findings. [L04 #42](https://github.com/Caldwell-41/Renpy-editor/issues/42)
is accepted for its four bounded nested-container and stationary-viewport criteria.

[Closeout evidence](../tasks/evidence/nested-layout.md#merge-and-ticket-closeout-2026-10-29)
retains both-target SDK/helper/native results, exact candidates, required automatic
checks, original failures and final review checks. The combined Design Lab
startup/reference failures remain recorded; this merge does not convert them to a
pass or establish full promotion validation. Broader canvas, physical-input, human
and Phase 3B acceptance remain open. Historical operation limits stay closed.

The feature branch and completed prototype worktree are retired. The prototype's
exact source and local evidence remain recoverable. The unrelated Phase 1 audit
and protected recovery remain intact. No successor implementation or release is
selected. L19 #50 has its L04 prerequisite satisfied; L08 #41 and L18 #46 remain.

## Accepted L03 baseline

[PR #66](https://github.com/Caldwell-41/Renpy-editor/pull/66) merged into
`codex/phase3b-screen-designer` at `a3035e8b62f8a5211c87e7957bbeba596bd073c3`.
The merge tree exactly matches independently reviewed head `d52753e`. Both review
axes have zero findings and both required automatic PR checks pass.
[L03 #38](https://github.com/Caldwell-41/Renpy-editor/issues/38) is accepted for its
bounded numeric-layout scope; its prerequisite for #42 and #46 is satisfied.

[Merge closeout](../tasks/evidence/numeric-layout.md#merge-and-ticket-closeout-2026-10-28)
links the scoped source/history, both-target SDK geometry and signed/package proof.
The feature branch is retired after integration verification. Related tickets
retain broader acceptance and unselected work;
pointer/full-canvas, OS-native IME and human proof are outside this acceptance.
L04 is now selected above. Historical limits, protected recovery and the unrelated
audit remain intact.

## Phase 3B architecture refactors merged

[PR #65](https://github.com/Caldwell-41/Renpy-editor/pull/65) merged at `99118a1`
into `codex/phase3b-screen-designer`. Add eligibility has one Rust owner; the screen
canvas module owns frame delivery and installed-image readiness. IPC and supported
screen behavior remain unchanged. [Maintenance #64](https://github.com/Caldwell-41/Renpy-editor/issues/64)
owns this selected outcome; [evidence](../tasks/evidence/phase-3b-architecture.md)
records both review axes, both-target CI/artifact audit and signed Mac native proof.

Both independent review axes have zero findings. Local and both-host frontend tests
pass all 264 cases. Real renderer/core/helper, Windows SDK/native and signed Mac
native checks pass within their stated scopes. The merge tree matches the checked
PR head. Eight completed worktrees, five local branches and three remote branches
are retired; local archives and a recovery tag preserve old unique work. The
unrelated audit and protected native state remain unchanged.

L01/L17/L02 and wider Phase 3B acceptance retain their scope. No successor feature
or release is selected. [HANDOVER](HANDOVER.md) retains recovery and closeout details.

<a id="l02-help-composition-pr-open"></a>

## L02 Help composition merged

2026-10-27: Kris selected merging [PR #62](https://github.com/Caldwell-41/Renpy-editor/pull/62)
into `codex/phase3b-screen-designer` and updating its related tickets. The merge is
`eb9ef9a4ef5b84d33b748e43f6cc659df7071f47`; its tree exactly matches independently
reviewed head `cbecf36`. [L02 #37](https://github.com/Caldwell-41/Renpy-editor/issues/37)
is accepted and closed for its bounded Help composition scope.

The owned-document and accepted-edit refactors remain intact. Both remaining
draft/history defects pass independent parent review, the two focused sequence
tests and the real controller/core check, including all 129 Undo and 129 Redo
transitions with exact source, identities, selection/focus, reopen and cleanup.
[Automatic run 40494321663, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40494321663/attempts/1)
passes both required jobs and all 259 frontend tests. Earlier Mac/Windows native
and SDK receipts retain their tested candidates and reuse limits.
[Merge closeout and evidence](../tasks/evidence/simple-help-layout.md#merge-and-ticket-closeout-2026-10-27).

P3B #22 and B02 #24 remain open for full aggregate acceptance. Related B03/B06/B11 records
carry only scoped dependency/evidence credit. #38, #39, #40 and #41 now record the
satisfied L02 prerequisite and remain unselected. Dependency maintenance #63 stays
open. No CI audit, product correction, new execution allowance or release is pending
or selected by this closeout. Preserve unrelated work and protected recovery in
[HANDOVER](HANDOVER.md).

| Capability | Implementation | Evidence and acceptance |
| --- | --- | --- |
| Owned blank screen (#34) | Implemented | Accepted for its bounded scope. |
| Bounded Help canvas (#36) | Implemented | Prior rendering, physical-input and smoothness acceptance retained below. |
| Help composition (#37) | Merged through PR #62 | Accepted and closed for its seven bounded criteria; broader B02/3B acceptance remains separate. |

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
