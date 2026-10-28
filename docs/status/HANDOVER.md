# Current outcome handover

## L03 review fixes qualified

Kris selected the PR #66 fixes with root-cause diagnosis/TDD, granted all approvals
needed for the fix end to end, and explicitly allowed issue updates. The worker
returned writer ownership; the parent independently validated and published the
fixes on codex/phase3b-l03-numeric-layout. Source 186c8b0 fixes unsupported-indentation
writes and numeric blur/errors/IME. eb10f71 fixes pending Apply focus with
aria-disabled and the existing duplicate-submit guard. The real-response regression
spans rendering turns; the harness retains the first failure and releases its hold.

The parent matched/acknowledged and audited
[CI4 run 40644911729](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40644911729/attempts/1),
attempt 1 at 07b82be5be285ea65ba1dcafa2d657382adafb5d. Selector validation and both
targets pass. Both have 264 frontend/37 ordinary core tests, numeric/Help/probe
controllers, retained focus/no duplicate Enter, both SDK aspects and full cleanup.
The Windows package/native case passes clicked-Apply focus and all source/runtime
cases. Signed Mac package/session 3 at eb10f71 has identical application, fixture,
dependency and probe inputs and passes matching scope with strict signature,
installer, exact process identity and cleanup. Input is synthetic DOM input.
[Final receipt](../tasks/evidence/numeric-layout-pr66-ci4.json),
[Mac receipt](../tasks/evidence/numeric-layout-pr66-focus-mac-native.json) and
[evidence](../tasks/evidence/numeric-layout.md#final-correction-audit-and-review-ready-handoff)
own hashes, archive digests, cases and counts. CI2's focus/cleanup failure and CI3's
rejected candidate input remain failed and retained. No correction remains.

Both required automatic PR jobs pass at docs-only e54cac0 in run 40645156369.
Final evidence publication changes documentation only. Audit its cheap automatic
PR checks without another package/SDK matrix or a self-referential evidence commit;
record the last check in #38/PR metadata. The parent remains the audit owner. No
local costly operation or CI watch is pending at this qualification closeout.
[#38](https://github.com/Caldwell-41/Renpy-editor/issues/38) remains open/review-ready
for integration. Final consumption is dispatches 4/4, package/editor sessions 3/3
per OS, Mac SDK 32/32 and Windows SDK 24/24. All starts are resolved. A2 approval,
protected recovery and the unrelated audit remain intact. No merge or successor is
selected; OS-native IME/human, pointer/full-canvas and broader B02/3B acceptance
retain their existing owners.

## Phase 3B architecture refactors merged and cleaned up

[PR #65](https://github.com/Caldwell-41/Renpy-editor/pull/65) merged at
`99118a147a29937d293b3190b9cda545135e5876` into `codex/phase3b-screen-designer`.
Its tree exactly matches checked head `15c252f`; this checkout is on the updated
Screens branch. [#64](https://github.com/Caldwell-41/Renpy-editor/issues/64) and
[evidence](../tasks/evidence/phase-3b-architecture.md) own scope and final results.
Standards and Spec have zero findings. CI run `40514677531`, attempt 1, passes the
selected Windows/macOS qualification at `694e2ff`; automatic run `40515307055`
passes the checked PR head. Later edits change only evidence/status documents.
Current signed Mac and Windows native receipts retain their exact candidates and
synthetic-input scope. Broader product, physical-input and human acceptance remain
with their existing owners.

Eight completed worktrees, five local branches and three obsolete remote branches
are retired after integration/equivalence checks. Six old-checkout archives and a
hash/status manifest remain under ignored `.toolchains/retired-worktrees/pr65/`.
The distinct renderer CSS edit also survives in local recovery tag
`archive/pr65-phase3a-renderer-local-edit`. Historical design-reference checkout
paths below are retired; restore their pinned source from Git if another comparison
is selected. Approved captures remain in the repository. The unrelated untracked
Phase 1 audit is byte-identical, and protected native recovery and stashes below
remain untouched.

No run, watcher, implementation correction or cleanup is pending. The selected
implementation and cleanup are complete. #64 and private
`.toolchains/architecture-64/continuation.json` retain final publication/notification
receipts. No successor feature or release is selected; old closed allowances stay closed.

<a id="l02-draft-lifetime-and-history-selection-fixes"></a>

## L02 merge and ticket closeout

Kris instructed merging PR #62 into `codex/phase3b-screen-designer` and updating
the PR and related tickets. The reviewed head `cbecf36` is merged at
`eb9ef9a4ef5b84d33b748e43f6cc659df7071f47`. The integration merge has the same tree
as that head. This checkout is now on the integration branch; preserve the
unrelated untracked audit and all protected recovery below. The feature branch is
retained; no branch cleanup or next implementation was selected.

[L02 #37](https://github.com/Caldwell-41/Renpy-editor/issues/37) is accepted and closed
for its seven bounded Help criteria. [PR #62](https://github.com/Caldwell-41/Renpy-editor/pull/62)
records the actual merge and final audited
[CI run 40494321663, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40494321663/attempts/1).
Both required jobs pass, including all 259 frontend tests. The parent's independent
review reran both focused cases and the real controller/core sequence, including
129 Undo and 129 Redo transitions, exact source/identities/selection/focus, reopen
and cleanup. [The merge closeout](../tasks/evidence/simple-help-layout.md#merge-and-ticket-closeout-2026-10-27)
owns the result and supporting evidence.

Ticket bodies #22, #24, #25, #28 and #33 reflect scoped completion/dependency/evidence
credit while their aggregate acceptance stays open. #38-#41 record the satisfied
L02 prerequisite and remain unselected. #63 remains open for separate dependency
maintenance. Native dependency relationships are preserved. No watcher, CI audit,
implementation or costly operation remains pending for #37. Its historical limits
stay closed. Broader editor/canvas, Phase 2/3A and whole-3B acceptance, plus release,
remain separate; this closeout selects no successor work.

<a id="published-37-baseline-and-qualification"></a>

## Retained L02 qualification

These candidate-bound results and recovery locations predate the final portable
corrections. Their old test totals retain their scope; they do not replace the
259-test result or establish fresh native/SDK proof for later commits.

Independent Standards and Spec reviews of the full diff, correction diff and final
probe/gate have zero remaining findings. Two P2 corrections are complete: invalid
text now retains the same focused control with associated completion errors; a Mac
desktop-exit failure remains a failure while fixture cleanup and final reporting
continue. The new validation checkpoint is required by admission. Historical
six-group receipts keep their original contract and cannot satisfy the current
seven-group gate.

The earlier qualification passes 243 frontend cases; 417 ordinary core cases, with 48
intentional ignores and three documented exclusions; and 249 Python cases with
three exact Windows-only exclusions. All four harness groups, Rust formatting and
actionlint pass. Chrome/core passes seven groups and pointer/modal/stale checks.
Full/shorter headless WebKit diagnostics retain the known ResizeObserver delivery
notification failure; they supply no pass and were not suppressed.

Signed Mac package 4/native session 5 qualifies `73ffb7f`: all seven groups pass in
9.425 seconds, exit 0, no timeout, exact source/history/reopen and all cleanup owners.
The current native receipt resolves Spec's changed-field focus evidence gap.
Executable SHA-256 is
`b118a214b1280489e2e2c6b60ae3df5dd10f17dea18ee8701c4e34d26a4fc8c1`.
Identity/installer receipts are under `.toolchains/releases/l02-composition-04/`;
raw checks and native output are under `.toolchains/screen-composition/final-review/`.
The external `caffeinate -di` process remains untouched; no isolated performance,
physical-input or broader canvas/editor acceptance is claimed.

[Windows run 40396855757, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40396855757/attempts/1)
on `d80c323` remains fully audited for its unchanged source/helper/SDK and successful
native workflow scope. Core source generation, SDK adapter/runtime and inert helper
plan are unchanged. Preserve each tested candidate; documentation successors do not
become new native or SDK candidates. The Mac pause's host-suspension diagnosis and
its earlier failed runs remain in the same evidence owner.

C5 source `94c78e7`, revision `workflow-popup-v1`, retains explicit approval.
[The approval record](../design/design-lab-help-composition/approval.json) owns its
fingerprint and captures. The `.toolchains/l02-c5-reference` checkout was retired during PR #65 cleanup;
its source remains pinned and its local files are archived as described above. The known full-lab
source-guard limitation and shell/naming differences remain in the evidence.
Current invalid-state production captures verify the existing field-error pattern;
they do not alter C5 approval or claim full canvas fidelity.

Cumulative use is Mac packages 4/7 and native sessions 5/5; Windows packages 1/2
and native sessions 1/2; SDK campaigns 2/2 and physical SDK starts 4/4 per host;
focused CI dispatches 1/2. Compile and lint count as separate SDK children. The
user-selected final review continuation supplied package 4/session 5 within the
unchanged ceilings. No further costly operation is selected or needed for this
completed verification. No owned app/helper/server or power assertion remains.

Preserve unrelated untracked `docs/audits/2026-10-25-phase-1-codebase-design.md`.
The retained sections below contain unique prior failures and protected native
state. They justify this handover's excess over its normal word-count target and
do not reopen those outcomes or allowances.

## Prior automatic checks and policy maintenance

PR #61 is merged into the selected base `8f7f9e7`.
[Its task](../tasks/active/automatic-code-checks.md) retains the implementation/CI
audit and operation-policy reconciliation. Ignored policy snapshots remain under
`.toolchains/automatic-code-checks/operation-policy/`. Previous L17 acceptance and
protected recovery below remain intact.

<a id="active-l17-integration-handover"></a>

## L17 closeout

Windows #36 acceptance is complete. Source candidate is
`8dae4e33427e79fc82b3a4bed046402c7610ae8c`, product `8527998`, functional probe
`68f95c3`; executable SHA256 is
`b896066a534073f86fb20898150f15dc93f3671e7719b85cf514fcc2a9cb8810`.
The unchanged package passed all eight physical-input stages in guided attempt 2.
The user confirmed all input was theirs and both moving and resizing were smooth
without sticking, jumps or lost focus. Exact source/history restoration, fresh
geometry, cooperative helper exit 0, editor exit 0 and owned cleanup pass.

[The closeout evidence](../tasks/evidence/canvas-rendering.md#windows-functional-and-smoothness-closeout-2026-10-24)
owns criterion mapping, the failed first attempt, raw receipt identities and limits.
Ignored `.toolchains/reports/l17-windows-functional-01/` retains both guided outputs,
package copies, 531 input hashes, process/terminal audits, human acceptance and
`usage.json`. Both launchers are consumed; do not replay either. No editor/helper,
profile, job or watcher remains. The installer was not run. The first attempt's
changed accepted-source copy is retained as failure evidence, not a restored-source pass.

Final cumulative use is 138/139 work batches, including both reviews and final
publication; the one unused batch is closed with this outcome. Windows use is 3/4 package attempts, 2/3
editor sessions and 2/4 SDK launches; the user raised only the package cap to four.
No CI, Mac run or added contingency occurred. Earlier unused allowances stay closed.
Standards and Spec reviews both pass with zero findings. This record supplies
#36's final bounded acceptance; the issue owns publication/closure reconciliation.
No successor task, PR, merge or release is selected. The recorded release timing
decision and separate full supported-subset/editor/phase acceptance remain unchanged.

Branch is `codex/phase3b-screen-designer`. Preparation is published at `4a4bef9`.
The previous `feature/phase-1g-branches-runtime` checkout's unrelated one-line
HANDOVER edit remains in named stash `5dfd4b9ad9c0c7ac12a999685f098ff084f416a4`;
do not apply it to this branch. Other worktrees and protected recovery below are
untouched. The original entry prompt is retained below to preserve its selected
scope and acceptance boundaries; its work is complete and it is not a replay instruction.

### Windows entry prompt

Continue Loomlight #36 on this Windows x64 machine. Inspect local changes and the
remote before updating; preserve unrelated work. Fetch `origin`, switch safely to
`codex/phase3b-screen-designer`, and fast-forward from its remote branch. If the
checkout diverges, report the exact divergence before merging or resetting. Record
the fetched SHA. Read AGENTS.md, CURRENT, this HANDOVER, live #36 and its linked
Windows selection record. This Windows chat takes sole ownership of this bounded
assignment when I start it; the Mac chat has handed it off.

First verify build readiness against repository pins: Node/npm in app/package.json,
Rust and rustfmt in app/rust-toolchain.toml, Python 3.11+ from app/README.md, Windows
MSVC C++ build tools and SDK, WebView2, and official pinned Ren'Py 8.5.3 with its
published checksum verified. Check actual resolved versions and executable paths.
Refresh project-local locked dependencies as needed; do not upgrade lockfiles or
replace pins with latest versions. Report any system prerequisite that needs
installation before changing the machine. Finish with a concise readiness result
and the exact missing prerequisite if blocked.

Prepare the existing `canvas-input` packaged probe for a disposable public Help
fixture and isolated profile. Read app/README.md and docs/testing/NATIVE.md for the
build and native evidence rules, and app/scripts/run-runtime-ui-probes.py plus
app/scripts/canvas_input_evidence.py for the guided case and admission checks.
Use a fresh output directory and verified SDK archive, with an explicit
`canvas-input` selector. Preserve the existing conservative checks. Build one
Windows candidate after readiness passes; do not run a package matrix. Wait for my
availability before starting the editor session. I will handle all UI; no Computer Use.

Run the eight guided physical-input stages: width draft, Escape, Enter, keyboard
Undo, one-pixel resize, one-pixel movement, move-handle drag and anchored resize.
Audit exact source/history restoration, fresh helper geometry, normal exit and
owned-process/fixture cleanup. Record my separate observation of whether moving
and resizing were smooth without sticking, jumps or lost focus. Renderer trusted
events alone are not proof of physical input; retain the external human/native audit
without rewriting raw receipt flags. Numerical timing is waived on both targets for
this release and remains unverified. Do not build a recorder or run timing series.

Stay within #36's remaining allowance. Diagnose any real functional failure at its
first incorrect boundary; repeat only the affected case after a focused correction.
Preserve earlier evidence and unrelated work. Once the Windows functional checks,
my smoothness acceptance and cleanup pass, record the criterion-to-evidence result
with candidate identities, commit/push the in-scope closeout and update/close #36.
Full supported-subset and phase acceptance stay separate. If a required result is
missing, report that named result without expanding into another test campaign.

## Parallel worktree policy update

The user selected this documentation-only policy change on 2026-10-22. Development
remains on Mac ARM64, `codex/phase3b-screen-designer`, from `7e1e7b3`. Separate agent
worktrees may proceed concurrently under [WORKFLOW](../WORKFLOW.md#parallel-agents-and-worktrees),
with one coordinator, one writer per worktree/branch and CI evidence tied to its tested
commit. The watching chat still yields under ci-watch; other assigned worktrees may
continue. [The owning task](../tasks/active/parallel-agent-worktrees.md) records the
completed review, validation and final allowance use. P3B policy is updated and its
read-back verified. On 2026-10-24 the user authorized committing and pushing these
documentation edits on the current branch. No product execution is selected. Canvas proof, earlier
acceptance and protected recovery below retain their prior state.

## Earlier canvas decision closeout

The user confirmed the full [L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36)
interview agreement on 2026-10-22 and requested the ADR and ticket update.
[ADR 0021](../adr/0021-separate-renpy-canvas-helper.md) owns the chosen separate
Ren'Py canvas helper, rationale, feedback/failure rules and representative Help proof.
Read it and #36 before selecting proof or implementing the helper. No renderer, SDK,
app, build or CI operation was performed for this decision. No operation is pending.

Mac ARM64 remains the development host on `codex/phase3b-screen-designer`.
The user selected committing and pushing the ADR, glossary and related contract/status
changes as one documentation commit. Preceding policy and CI-wait work remains in
its separate commits. GitHub #36 and its parent coverage record the decision and
missing proof; #36 owns the verified publication receipt and separate publication-only
allowance. The interview/documentation allowance remains closed. Next action requires a
separate user selection and finite allowance for the representative proof. Actual
matched captures, startup limits, edge tolerances and rendering/performance acceptance
remain pending. L01 and all historical closed allowances retain their results below.

## Completed L01 and preceding local documentation closeout

[L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34) is accepted for its
bounded owned-blank-screen scope on 2026-10-22. Mac ARM64 remains the development host;
branch is `codex/phase3b-screen-designer`. Exact tested product candidate is
`9313cc5ee593549df70a80f6dde1e09f16a49b89`, with product correction `0cf5753` and
runner review correction `58b191c`. Later commits only maintain evidence/status.
Both independent code-review axes have zero remaining findings. The
[source contract](../DATA_MODEL.md#project-lifecycle-metadata) and
[evidence](../tasks/evidence/owned-blank-screen.md) own behavior, criterion mapping,
original failures and exact receipts.

[CI3 run 39756288431](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39756288431),
attempt 1 at that product SHA, is audited and passes both portable targets and Windows
native/SDK proof. Signed Mac package 5 and native attempt 2 pass ordered Cancel,
creation, exact Source, shared Undo/Redo, reopen and completion. Accepted bytes,
source revision and distinct persistent IDs match; exit is 0, all cleanup owners pass
and no app process or owned fixture remains. The probe uses synthetic DOM input in
actual WKWebView, with no SDK execution in that native probe. Deliberate pinned-SDK
proof retains its separately stated both-host scope. No physical-keyboard or human
visual acceptance is inferred. Native receipts/source/audit remain under ignored
`mac-native-02`; exact CI artifacts/logs remain under `ci-03`.

Final cumulative use: local 27/18 (ceiling 27), CI 3/2 (ceiling 3); Windows package/native
reservations 3/2 each (ceilings 3), SDK operations 6/4 (ceiling 6), including skipped
prior reservations. Mac packages 5 include two explicitly approved single-attempt
supplements beyond original ceiling 3; native 2/2 (ceiling 3), SDK operations 4/4
(ceiling 6). No limit resets or compounds. L01's allowance is closed; no run, watcher
or probe remains pending. No PR, merge or release is selected.

The later canvas decision session is recorded above. B01/P3B aggregate, full
editor/canvas, physical-keyboard and later human/phase acceptance remain separate.
L01 completion renews no exhausted allowance. Preserve the policy, agent guides and
protected recovery below. The retained policy/Help material below predates L01
delivery and is historical context.

The user selected a local commit of the remaining policy/instruction edits and
domain/triage guides on 2026-10-22. This documentation closeout has an allowance of
three local validation/correction passes plus one contingency (ceiling four), based
on 11 Markdown files and no executable changes. Final use is two passes of three
(ceiling four), covering repository structure, privacy, links, staged whitespace and
recovery preservation. CURRENT and HANDOVER exceed their soft size targets to retain
pending acceptance, qualified candidates and protected recovery. No push or product
operation is selected; the local documentation commit leaves the branch ahead of origin.

## Phase 3B scheduling policy and retained Help audit, 2026-10-22

Branch codex/phase3b-screen-designer. The bounded Help workflow has functional
qualification on Windows x64 and signed Mac ARM64. Read the
[owning brief](../tasks/active/help-screen-production.md) and
[CI3 terminal audit](../tasks/evidence/help-screen-production.md#ci3-terminal-audit-2026-10-22)
for scope, package hashes, artifact identity, receipt limits and cumulative usage.
The orchestrator approves the bounded functional implementation after independent
CI3 artifact/source review and the accepted Mac evidence. The original findings and
subsequent functional blockers are closed. Material flow-v1 differences still prevent
full sign-off; full Screens and Phase 2/3A human acceptance are separate.

CI3 run 39712450128, attempt 1/ordinal 3, exact candidate
c2d9f457777dc78975779cb0583f6d1cc494755a, completed successfully at
2026-10-22 02:59:48 UTC (12:59:48 AEST). Windows job 119606706974 ran every required
step. The retained ZIP digest matches GitHub metadata and the upload log. Both service
aspects (1280x720 and 1024x768) compile/lint, measure the renderer-accepted 760x360 frame
in game context, observe staleness and clean up. The packaged native case passes all
seven stages through source/history/Cancel, validation, geometry, stale Stop and reopen.
Raw validation exits 0; all three owned Windows Stops retain -1073741510 with cancelled
phase, untruncated error-free output and complete cleanup. The native receipt records
explicit Stop intent and Windows target. Disk bytes match; no source bytecode/saves or
scratch jobs remain. App exits 0. Input is synthetic DOM input in the real WebView.

Source 83e4b36 corrected three qualification gates without changing product Stop
behavior. CI2 remains failed with its original receipts. Accepted signed Mac package 3
and native launch 2 evidence is reused; no Mac repeat occurred. The Windows package
hashes are fresh-build runner receipts, not locally rehashed uploaded binaries. Artifact
12398496866 expires 2026-10-29; an ignored copy, raw job log, metadata and audit summary
are retained under .toolchains/help-screen/ci3-audit. No private artifact is committed.

Final cumulative use is local batches 15/15 and CI dispatches 3/3; Mac packages 3/3,
native launches 2/3 and previews 7/8; Windows packages 2/2, native launches 2/3 and
previews 4/4. CI1/CI2 failures stay charged. No CI4, rerun, new local batch or unrelated
native repeat is authorized. No operation, polling loop or worker audit remains pending.

The user requested overall 3B progress before starting further implementation and
added [canvas agreement with Ren'Py](../tasks/reference/phase-3b-screens.md#canvas-agreement-with-renpy)
as a requirement. It remains unimplemented and separate from the pending flow-v1
editor-layout decision. Neither gate has visual acceptance; no execution allowance
is renewed by the progress report or requirement record.

The [published cutover receipt](https://github.com/Caldwell-41/Renpy-editor/issues/22#issuecomment-6334003397)
makes remaining 3B GitHub ownership effective at `867528d`, following baseline
`6d78010`. [P3B](https://github.com/Caldwell-41/Renpy-editor/issues/22) and its selected
children own delivery; product requirements and detailed evidence retain repository owners.

The user established the [standing 3B scheduling exception](../tasks/reference/phase-2-3-delivery.md#standing-phase-3b-scheduling-exception)
and [delivery allowance policy](../WORKFLOW.md#5-budget-the-problem-not-the-checkpoint-name)
on 2026-10-22. Final Phase 2/3A acceptance is no longer a start prerequisite for any
remaining 3B ticket. Preserve pending acceptance, actual dependencies and all protected
recovery below. After the user selects a new work ticket, the agent determines,
records and states its finite original allowance and basis, then proceeds without
separate budget approval. The linked policy owns the 50% contingency, downward
rounding, cumulative charges and intervention boundaries. Old exhausted allowances
remain closed. No product work ticket is selected; canvas work remains deferred
until explicitly selected, including the design session and rendering proof.

L01 was the policy read-back's recommended first ticket. Its later completion is
recorded above; no successor work ticket is selected.

The parent, 27 leaves and two canvas groups have the policy. First read-back verifies
all 39 bodies and unchanged 38 parent edges, 41 start edges, titles, states, labels
and assignees. [The parent allowance record](https://github.com/Caldwell-41/Renpy-editor/issues/22#policy-maintenance-allowance)
owns this docs/issue-only task's cumulative counts, including its failed patch.
Repository instruction/status edits and domain/triage guides are included in the
local documentation commit selected above. No package matrix is needed. No product
implementation, push, PR, merge or release is selected by this closeout.

## Retained product state and next work

Screen builder is approved as `flow-v1` / variant `flow`, dated 2026-10-22. The
[approval JSON](../design/design-lab-screens/approval.json) pins source
`3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437`, fingerprint and 13 reviewed captures.
[The Screens contract](../tasks/reference/phase-3b-screens.md) owns agreed product
scope and points to the completed approval/browser audit. Screen notebook and Canvas
focus remain drafts. Use [INTEGRATION](../../app/design-lab/INTEGRATION.md) for
production work; approved source/captures stay pinned. A new experiment needs a new
revision. The selected Help outcome above has its own exhausted local/preview allowance;
full Screens and phase acceptance remain pending.
The lab's last recorded port is 5174; verify availability before reuse.

The [early 3B CI audit](../tasks/evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation)
qualifies source `0ef174877cbe5ae3fd883afb92940de68916b04a`, tree
`521a550ef7d82ecf970a0527a1bab368062bad63`, run39555526201, on Windows x64/macOS
ARM64. Later lab/docs changes do not replace that SDK candidate. Earlier 3B allowances
are closed. No verification or CI is pending for the completed design/proof outcomes.

The [earlier full-app comparison](../tasks/active/browser-ui-design-lab.md)
remains review_ready with 24 app layouts and the starter unapproved. Its original
scope, evidence and fictional controls remain in that task and its design notes.

[CI reliability](../tasks/active/ci-harness-reliability.md) is accepted at
`e00160b962ac09d70cb95000a6c10e4c205895c7`. Its final audit owns both-target
portable/rendered and selected Windows native proof, retained failures and closed
allowances. Mac native input, signed-Mac/real Studio and phase human acceptance are
separate. No maintenance operation remains pending.

Thinking/default-response and draft connection behavior remain qualified at
`36feff12ff9acfc1cd6eb0832da3abba243b9463` by the
[Phase 2 CI3 audit](../tasks/evidence/phase-2-execution.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16).
Paired CI3/3 is closed. The source-map-js development advisory remains open; no
lockfile update or zero-advisory qualification is selected. Signed-Mac/real Studio
and Phase 2/3A human acceptance remain pending. The walkthrough is paused at Step3.
Its model-load amendment has separate automated proof under the
[walkthrough task](../tasks/active/walkthrough-redesign-implementation.md).

The earlier automatic push review rejected publication without explicit
payload/destination permission. The subsequent migration publication authorization
was fulfilled by baseline `6d78010`, ownership commit `867528d` and the parent receipt.
It does not authorize publishing this policy change. Preserve unrelated work and the
protected native state below.

## Native recovery and remaining acceptance

Package1/2 passed signature/ARM64/installer checks but is stale after earlier app changes.
Retain package-01/Loomlight.app and receipt. Executable SHA256
77e818cce4a0cbbdfcd0e3547714a46ab95b5d223a757a1b1bfff152b3867d19;
installer6701c193eb1f53587b7f73b276a41bec6fba673f6a468f975b05f92ac9d212ee.
A fresh matching signed package needs its second reservation and the approved identity.

native-root.json identifies the disposable Beck/Henry fixture, isolated owned profile/key,
thinking on/context32768/response16384. Original profiles were unchanged. Keep private
endpoint/key/local paths ignored; do not prepare another fixture or read its key just
to resume. Preserve initial noncanonical-path refusal/recovery. A read-only 2026-10-22 check found no running `loomlight` process. Protected draft
contents were not inspected; preserve existing recovery files and recheck before
native continuation. Do not Save/Discard/Reload a protected draft or bypass single instance.

For the remaining authorised native sequence, reserve launch 1 and use the existing
isolated phase2-studio environment with the matching signed package. Exercise native
entry cancellation and saved-profile draft Connect → model → Save, explicit response-
format test and Beck bar-scene generation. Reserve output before sends. Review → Save
→ Approve → reopen must preserve writing/settings without reasoning. Reserve launch2
for reopen, keep uncertain attempts charged and avoid automatic resends/model operations.
Current other counts: packages 1/2, launches0/2, live0/4, output0/65536, cached loads0/1.
Older comparison/model-load/live/CI allowances stay separate/closed. Walkthrough remains
paused Step3 with builds2/2, launches2/3 and protected recovery/session files. Full
native/Studio and Phase2/3A human acceptance remain pending.
