# Variable actions and nested canvas evidence

[L11 #47](https://github.com/Caldwell-41/Renpy-editor/issues/47) and
[L19 #50](https://github.com/Caldwell-41/Renpy-editor/issues/50) own scope,
acceptance, authorization and operation accounting. This file retains implementation
checkpoints and detailed verification. No criterion is accepted by this entry.

## PR 81 continuation and effect correction, 2026-11-05

Kris selected completing the remaining #47/#50 work and updating draft PR #81.
CI remains deferred. Both original tickets remain open and unaccepted. The
coordinator owns code, status and publication; test delegates own only their
isolated checkouts and ignored outputs.

Fresh review against `e2a02bc...ff1924d` found zero actionable Standards findings
and one P2 Spec defect. Public IPC reproduced A's typed Show(B) reporting
`effects.unknown:false` when B's custom on-show action correctly reported unknown.
Hide had the same omission. Commit `159a8c036002939ee40b682b1ce3241a99c680aa`
fixes the existing effect resolver to visit action targets and their component
closure. It propagates uncertainty and definition/action revisions. A visited set
keeps action-reference cycles finite; recursive component inclusion still refuses.
No renderer, controls or approved reference changed.

The public effects test failed before the fix and passes afterward for Show and
Hide, including reopen. All four focused effects cases pass, covering shared
component changes, finite A/B action cycles, stale review refusal and existing
self-actions/Story effects. A second test's initial setup omitted the required
container `text` field; its INVALID_PAYLOAD failure is retained separately from the
product red/green result. The corrected setup passes.

Pinned checks pass 376 frontend cases, typechecking and production build. The
three actual controller/core journeys pass with confirmed fixture cleanup at the
corrected source. A broad pre-correction core run passes 602 cases with 56 explicit
ignores and three documented exclusions. The final corrected full routine core
run is pending. Logs/results are retained under primary ignored
`.toolchains/47-50/pr81-continuation/`.

The first campaign-3 delegate at `ff1924d` refused its sandbox desktop query with
all admission fields null. It started no SDK/helper, created no temporary profile
and acquired no assertions. Its eight slots are unused; campaign 3 is uncharged.
Test checkout `t3-1fe2d0f8` retains the preflight and handoff, with manifest SHA256
`82c794a87866645b934b886d1d63ac774d098d57e5681757f1e3c205e3b3e6f0`.
The coordinator's established unsandboxed read-only query positively reports
onConsole/loginDone/displayActive true and screenLocked/displayAsleep false.
Null sandbox fields establish a query capability failure, not a locked desktop.

#47 owns retargeting the same unused Mac eight-SDK/one-helper reservation to the
corrected candidate in a fresh isolated Terra Max test checkout. The assignment
must recheck positive admission through the established unsandboxed route, use
the existing desktop/process owners, export/replay fresh source, run both normal
captures and helper cases, compare at zero tolerance and stop at the first
execution failure. No package/native-editor or CI starts are assigned yet.
Windows remains unreserved. Readback confirms the original provisioning failure
still has no retained Git arguments, destination, exit code or stderr; no safe
tool-level correction or blind retry is established.

Original criteria retain the map below. #47's effects implementation defect is
corrected, but Windows normal play remains unrun. #50 still needs actual matched
helper captures, both-target/aspect parity and measured residuals. Native/package,
CI and broader acceptance remain distinct and pending. The approved A reference
and all historical failures/recovery material remain unchanged.

## Draft PR reconciliation, 2026-11-05

The selected outcome is a draft PR for #47/#50. Both issues remain open and
unaccepted. CI is explicitly deferred; no workflow, package or native editor was
started during this final verification. The approved A source/reference/captures
remain unchanged. All worker implementations are integrated.

Local verification passed 376 frontend tests, 602 routine core tests, production
build and three actual UI-to-core journeys. The core inventory reconciles all 661
names: 602 passed, 56 explicit ignores and three documented exclusions. Generated
stale dismissal-test output was removed only after retaining its failed log; no
legacy production path was restored. Current Lab passed 1,456 unique cases across
24 screens, 23 interaction modules, 11 approval protections and seven other groups.
The P3 Standards finding about duplicated Lab CSS was corrected and the affected
full Lab gate passed at `92b3a20d6d6578d64206922a75f8635f4e322335`.

### Original ticket criteria

| Original criterion | Verified evidence | Remaining proof |
| --- | --- | --- |
| #47 compatible bool/int/string assignments and retained invalid drafts | Focused public-core tests, 376 frontend tests and real controller/core journeys cover typed writes, missing/stale variables and recovery | Required target/native qualification remains pending |
| #47 qualified Show/Hide/Finish, Finish last and exactly-once displayed order | `canShowHide` comes from `qualified_panel_targets`; Finish requires blocking Dialog. Mac normal play observed all eight built-in actions once, in order, with correct state and continuation for click/keyboard at both aspects | Windows normal play is unrun |
| #47 marked separate inert samples and passive selection | Typed revision-bound samples, literal template rendering and actual UI-to-core draft/source/history checks pass; Lab uses production controls with inert fictional services | Native/platform qualification remains pending |
| #47 minimal source changes, history/reopen and complete known effects | Public source/refusal/history/reopen/effect tests and all three UI-to-core journeys pass; opaque neighbors and original revisions retained | No acceptance waiver or complete native proof |
| #50 nested component/grid/viewport actual matched example and sibling layering | Public plans, clipping/selection/order tests and both Mac normal-game reference captures pass | Hidden-helper captures and actual comparison are unrun |
| #50 spacing/clipping/size constraints and reuse on both targets/aspects | Planner/DOM checks and exact comparison refusal gates pass | Both-target helper parity and measured differences are missing; no tolerance accepted |
| #50 shared-definition invalidation and explicit partial coverage | Shared freshness/withdrawal and missing/custom refusal tests pass | Integrated native/platform evidence remains pending |
| #50 residual differences and no arbitrary project execution in editor | Data-only planning, literal samples and zero-tolerance gates pass; existing trust boundary preserved | No actual helper comparison or residual measurement exists |

### Mac qualification and failure receipts

Producing candidate `92b3a20d6d6578d64206922a75f8635f4e322335`, tree
`76ad62d48ea1f536e4205a7162f555871a6dcf19`, was clean. macOS 26.6.2 ARM64 used
Rust/Cargo 1.90.0, Node 24.19.0/npm 11.9.0, Python 3.12.16/Pillow 12.3.0 and the
official Ren'Py 8.5.3 archive verified against its published checksum. Mac native
desktop admission was positive and temporary assertions were released.

The first assignment used seven ordered-action SDK starts and four nested normal
reference starts, all passed. Both reference captures report GL2 at the matched
1280x720 and 1024x768 dimensions with 29 ordered geometry records and unchanged
accepted source. All 11 owned SDK launchers were reaped and process groups empty.
These are passed slices at their exact candidate, not hidden-helper parity.

The retained test-binary copy was mode0644, causing a kernel refusal before any
child started. Its original Cargo binary was executable and byte-identical,
SHA256 `96d7c200365888d35ce84b14d64475afa6bf60fe26ab4154aca78158cb7f0971`.
A fresh isolated continuation invoked that original binary read-only, installed
the official SDK with two validation/discovery starts, then failed reopening the
synthetic project with `Scene(SourceConflict)`. Both aspect cases stayed unrun;
no helper started and no comparison ran. The producer reports `cleanupComplete:false`
and `sourceUnchanged:false` because its required shutdown/post-capture checks were
not reached. Separate desktop/process receipts establish released assertions,
exited observed processes/groups and removal of the temporary profile. Preserve
those distinctions. All 67 first-assignment and 35 continuation artifact hashes
were verified. Unused reservations are released in the sole accounting owner #47.

Retained test-only worktrees:

- `t3-90187276/.toolchains/qualification-47-50/` owns the first handoff, complete
  commands, 67-file hash manifest, full Lab report, normal-play and reference results.
- `t3-52f1725c/.toolchains/qualification-47-50-continuation/` owns the failure,
  process/desktop receipts, 35-file manifest and provisional diagnosis.
- Primary `.toolchains/47-50/final-combined/` owns broad local results, named-result
  audits, real UI-to-core receipts and offline corrections below.

### Offline corrections after the engine stop

A fresh-profile replay added to the existing exporter test reproduced the exact
`Scene(SourceConflict)` without an SDK. Exported metadata bound the old scene's
revision but omitted its source file. The corrected export includes mapped scene
files and character definitions; both the offline replay and SDK producer now use
one fixture-restoration helper. The independent fresh profile reopens and returns
identical public canvas plans at both aspects. The existing four comparison-gate
tests pass, including refusal of a missing mapped scene. A transient compile error
while moving hash validation into the shared helper is retained in
`nested-replay-green.log`; corrected `nested-replay-green-02.log` passes the one
exact exporter/replay test with zero ignored cases.

A focused retention assertion also reproduced loss of executable mode. Retained
binary creation and reuse now preserve metadata with `copy2`; all five existing
source-evidence tests pass. `binary-mode-red.log` and `binary-mode-green.log` retain
that red/green result. No SDK was launched for either correction. These changes
are qualification code/tests only; production renderer/core/UI and runtime fixture
inputs are unchanged. The expanded accepted export is new qualification material,
so old normal captures are not relabelled as a pass for it. A fresh producing
candidate/export and selected affected engine proof are required before acceptance.

### Review, CI and publication boundary

Independent Standards review found one P3 issue, corrected with full current Lab
proof; no other actionable finding remains from that review. Independent Spec
review found zero implementation defects and four engine-proof gaps at its reviewed
candidate. Mac normal-play now closes its Mac slice; helper parity, both-target
matching and measured residuals remain open. The coordinator self-reviewed the
small qualification-only corrections and their public replay/refusal checks.

Windows remains blocked by T3 isolated worktree provisioning before startup. Its
previous source transfer is retained, but no supported isolated execution binding
or current qualification exists. Do not blind-retry or use another worker's checkout.
Native/package proof and wider acceptance remain pending on both targets.

The branch validation plan selects Repository quality plus the existing manual
both-target harness jobs for later CI. No dispatch is authorized now. Those jobs
are baseline harness checks, not #47/#50 engine/native acceptance; task-specific
qualification setup and the remaining proof must be reconciled before marking the
PR ready. Historical Help/L04 selectors and exhausted allowances are not selected.
The draft publication commit uses `[skip ci]`. No merge, release or ticket closure
is selected. The unrelated Phase 1 audit and all unique failure/recovery material
remain untouched.

## Resumed delivery, 2026-11-05

Kris resumed #47/#50 using the stopped-work handoff, requested independent agents
and worktrees, and required all prototype/mockup work in a new agent chat. The final
sequence is combined verification against both original tickets, independent review
and a draft PR. CI is deferred by explicit instruction.

Recovery verified integration HEAD `8ed4608`, two commits ahead of its published
branch, with only the previously unrelated three Design Lab guide edits and Phase 1
audit outside the selected work. All original lane commits are already integrated.
The corrected Mac worker made no producing call before cancellation. #47 releases
its unused SDK/helper/campaign reservation and retains the original failed campaign.
No capped operation is currently assigned. Windows provisioning remains unresolved.

| Owner | Checkout and scope | Integration destination |
| --- | --- | --- |
| Coordinator | Existing `codex/47-50-integration`; shared contracts/callers, UI integration, status/evidence, final combined verification and review | Current integration branch |
| New design chat | Preserved `t3-229694d0`, `t3/screen-actions-design-prototype`; new Lab screen, registry and owning approval/captures only | Approved source/decision handoff to coordinator before production controls |
| Source/actions verifier | `t3-b82d48e1`, `t3/screen-actions-backend-verification`, from `0b64e54`; dedicated source checks and caller integration map, no UI or shared-record edits | Findings and exact candidate-bound results to coordinator |
| Nested-canvas verifier | `t3-baaf7178`, `t3/verify-nested-canvas-coverage`, from `0b64e54`; focused planner/consumer checks and criterion gaps, no production UI or shared-record edits | Findings and exact candidate-bound results to coordinator |

The new design chat is
`mcp:launch:1cfb6bf46a0041886ac32e12c402b00234555e85a307f2870447e7cf0a015545`
in the current T3 environment. It must preserve existing draft variants, establish
actual user approval and return reproducible source/capture/approval evidence.
Its scope includes no SDK, helper, native, package or CI execution. Sol owns coding;
Terra Max owns delegated browser/desktop work. The coordinator reads the approved
handoff directly before implementing controls. No prototype edits occur here.

No ticket criterion is newly accepted by resumption. Production controls, real
UI-to-core proof, both-target/aspect runtime/render comparisons, required platform
checks and final two-axis review remain pending. Unchanged offline evidence may be
reused only with its original candidate and scope stated.

### Design rejection and v2 redo

Kris explicitly rejected `inspector-v1`, `worksheet-v1` and `workspace-v1` as
inconsistent with the existing Screens design language. None is approved or a
production reference. The rejected source/notes remain preserved in ignored
prototype storage. Earlier v1 preparation/media records establish no approval.

Kris ordered a full redo using principle-experience-first, excluded prototype-review
and selected Tailscale-only delivery. These directions supersede the earlier
prototype-review workflow for this design. All replacement work stays in the new
bound prototype chat/worktree. No production UI owner is assigned.

The reported replacements `inspector-v2`, `worksheet-v2` and `workspace-v2` mount
actual ScreensWorkspace, the existing Lab shell and production styles. Their
differences are confined to ordered-action editing inside the real inspector,
with an existing Screens reference toggle and fictional inert controls/services.
All approval entries remain null. Terra Max browser verification is in progress;
this is a preparation update, not an approved reproducible handoff. The core
`canShowHide`/`qualified_panel_targets` and Finish/`blocking` requirements remain.
No rebase, production edit, SDK/helper/native/package/CI or publication occurred
in this reported redo. Await the actual explicit decision and exact source handoff.

### Approved A handoff and completion lanes

Kris's actual decision on 2026-11-05 is "A is approved", selecting `inspector-v2`
(Expandable actions). No reason or acceptance waiver was stated. The approved
source is `7090a036032ce3f225a857b30259a9c91716ac60`, fingerprint
`a976830817d848d1263bbbc7f8a101c92c322ce2e369eb4c79c9ce7805bbb85e`.
Evidence commit `a0535aedf7631857f3204cc62e4c98c603576f36` adds the approval record,
ten retained dark captures and direct handoff. Integration copies are `3f4fb10`
and `507c77b`. The coordinator verified the exact decision, source pointer and all
ten capture hashes. The original prototype branch/worktree stays pinned and intact.
Other variants remain unapproved; rejected v1 is not a production reference.

[HANDOFF](../../design/design-lab-screen-interactions/HANDOFF.md) maps every control
to real owners. [VERIFICATION](../../design/design-lab-screen-interactions/VERIFICATION.md)
retains the failed/incomplete full Lab check. The visible-field/hidden-general-error
selector ambiguity is not a product defect or a completed promotion check.
The approved source remains untouched while a separate candidate fixes the harness.
The three-round score goal was not reached, and recorded findings waive no recovery,
functional or fidelity requirement. Tailscale-only delivery and no prototype-review
remain binding.

Two fresh T3 worktree lanes start from the approved-handoff integration checkpoint.
The Lab lane owns the interaction check and necessary Lab harness corrections,
with Terra Max browser verification. It must complete the actual full check and
return exact evidence without changing the approved reference. The core lane owns
removal of `Compose::Dismissal`, `LegacyDismissal` and the dismissal inspection
projection, migrating all existing Rust callers/tests to typed `Actions`. Neither
lane owns production frontend controls or shared status/acceptance records.
The coordinator retains integration, shared contracts and final verification.
Production control assignment follows the Lab gate. No SDK/helper/native/package
or CI operation is delegated. Full combined suites and final two-axis review remain
pending; the final draft PR still follows original-spec reconciliation.

### Core migration ready for combined integration

The core lane completed locally as
`a811c26bee285e45a33413e582f0927234d15c65`, tree
`6844dcd8c8a905adee3535d417fe09a719f7deec`, in `t3-4dbbc9c4` on
`t3/migrate-canonical-screen-actions`, based on `ad36af1`. Its six-file change
removes the legacy dismissal command, enum, inspection field/projection and writer.
Rust callers/tests now exercise canonical `Actions` with captured authoring and
distinct target revisions. No compatibility translator or second action writer
remains in that candidate.

Migrating an existing public inspection case exposed action authority on nodes
whose duplicate IDs had been withdrawn. The lane retained a failing result, then
required the existing qualified unique node ID before projecting actions. Raw
action/effect parsers and eligibility rules remain unchanged. Component Null
inspection stays passive; component action writes remain refused.

All 43 focused cases pass (9 actions, 15 references, 2 effects, 12 Story dialogs,
5 Help panels), with zero failures or ignores. Locked offline test compilation,
formatting and whitespace pass. The coordinator audited the production/test diff,
clean checkout and retained log hashes. Exact commands, environment, initial red,
final results and frontend guidance remain in that worktree's ignored
`.toolchains/canonical-actions/handoff.json` and `logs/`.

The commit is held for integration with its frontend counterpart. Current legacy
frontend commands/fields and dismissal DOM/dispatch tests would be incompatible
with the core removal alone. The forthcoming controls must preserve original-base
drafts, authoring revisions and exactly one review per distinct Show/Hide target,
including self-Hide. Finish alone sends no target reviews. No frontend, Lab,
shared-record, engine/native/package/CI or publication work occurred in this lane.
The Lab promotion gate, production integration, final combined checks and review
remain pending. This is neither an integrated pass nor ticket acceptance.

### Lab gate passed and production completion assigned

The full offline Lab check at `19dd16b`, tree
`3317e75913d333750941809e21d6f2779b6ab2d5`, passed all 1,456 registered cases
across 24 screens, all 23 interaction modules, 11 actual approval/source refusals
and seven post-matrix groups. There were no errors or skipped checks. The two
harness-only fixes require visible alerts and update an obsolete Shared Look
refusal message. No presentation/fixture/source pointer changed. Original locator
and full-check failures remain retained in `t3-09c0ef62` under ignored
`.toolchains/47-50-lab-harness/`. The coordinator audited both patches, exact
complete report counts and clean producing checkout. Report SHA256 is
`502543e825d3413c05471fc684069114c43ebd65b354dfc0f7a4097cf57504e2`;
identity/results receipt SHA256 is
`2ee1eae313b1047516f8a3676f7ada6736dfd63a86a9ee119966582405590dce`.
Pinned Node/npm/Chrome ran offline with no registry requests. Owned browser/server
processes exited while preexisting servers survived.

The harness fixes integrate as `eea25ba`/`86bccfc`. Core removal `a811c26` integrates
as `ff98d4d` to prepare the shared canonical-action base. The current frontend is
temporarily incompatible until its paired migration returns; this is an internal
checkpoint, not a usable/accepted combined result.

Tracing the approved controls identified two remaining backend gaps. Insert
variable replaces the selected range inside ordinary text, while the current
binding owner supports only a whole-text placeholder. The selected Apply footer
also owns text/appearance and action edits together. Their implementation must use
the same composition transaction and create one history entry. A backend lane
extends those existing owners; a frontend lane owns approved A controls and all
affected frontend callers/tests. No second text parser, action writer or history
owner is introduced. Exact shared contract and exclusive file scopes are supplied
in both assignments. Production fidelity, real UI-to-core proof, final suites,
candidate-bound engine/platform checks and final review remain pending. CI stays off.

### Mixed templates and atomic Apply backend integrated

Core completion `5aba12cbee285e45a33413e582f0927234d15c65`, tree
`bf0a396127144e392fad85ff12504352c9261b4a`, integrates as `ce2d4c1`. Worktree
`t3-f5465e91` on `t3/screen-actions-variable-templates` retains its clean candidate
and ignored `.toolchains/core-apply/handoff.json`, logs and exports. The coordinator
audited production changes, all 55 retained log hashes, actual commit/tree and
positive final counts: 45 focused core passes, one explicit unrun SDK helper case
and four comparison gates. Locked offline compilation, formatting, repository and
whitespace checks pass. Original test-fixture/compiler/filter mistakes and valid
TDD failures remain classified in the handoff rather than counted as passes.
Handoff SHA256 is
`b022b9ba0be58f3e351cf23ff55c84ad13f8f6b410db4bb437333c975c20dd63`.

One conservative template owner now supplies mixed known-variable/literal text,
deduplicated `variableBindings`, definition dependencies and literal canvas values.
Active static tags and custom/calculated/missing placeholders remain source-only.
Integer samples require canonical signed-64 strings. The existing composition
transaction stages text/Style/layout and optional interaction actions, resolving
action spans after staged edits and revalidating original revisions even for
no-ops. Combined edits retain one history entry and one-step Undo/Redo. The old
plain Text path also cannot bypass source-only admission. Exact request/response
contracts are recorded in [DATA_MODEL](../../DATA_MODEL.md).

The accepted ordered exporter includes an actual mixed-template text node and
matching plans at both aspects. Its `textNodes` records are now heterogeneous;
template records carry `template`/`variableBindings` rather than scalar `variableId`.
The nested fixture/comparator are unchanged. Exports remain offline evidence at
their producing candidate and must be regenerated for final engine qualification.

The active frontend owner received the exact reviewed backend dependency and
contract directly. A test-driver gap then blocked its typed-variable journey.
Parent commit `367c5de` adds only existing public `variable.create` to the narrow
Help controller-driver allowlist; production dispatch is unchanged. Locked offline
example build and formatting pass. A headless driver check created actual bool,
large-int-string and literal-string variables through production dispatch, then
closed the session, exited zero and removed its disposable fixture. Retained logs
are under ignored `.toolchains/47-50/driver-variables/`. The frontend owner received
that exact dependency too. No SDK/helper/game/native/package/CI operation occurred.
The integrated frontend journey, production fidelity, final combined suites,
engine/platform proof and independent review remain pending.

### Frontend integrated and combined verification started

Frontend lane `e0b99bbc48182d9f6e3b7681899ef69f782839a0`, tree
`019a9714771ed71a68966ef649c42b58efb90d7d`, returned clean from `t3-d26e5b53`
on `t3/screen-interactions-frontend`. The coordinator verified all 57 retained log
hashes and audited the control/operation map and source changes. Only its five
frontend commits were replayed, as `8fd51a1`, `7516388`, `b228e55`, `496dc9d` and
`2eb17ee`; its copies of backend/driver dependencies were not replayed.
The lane passed 78 focused cases and three real controller/core journeys, with
source/history/reopen, atomic Apply, samples and recovery. Drivers exited zero and
disposable fixtures were removed. Exact commands, failures, hashes and remaining
consumer issues are in ignored `.toolchains/frontend-47-50/handoff.json` there.
Handoff SHA256 is
`16af1a35c340efb73a868940adb407c6c83c6c04f0080ede24d5f8f760162428`.

Terra's control comparison passed 20 interaction checks across 24 matched states
at lane `5fc1761`. The two final reveal/marker presentation corrections are covered
by typechecking and seven focused tests but still require the combined visual
recheck. Original reference/captures remain unchanged. These browser fixtures prove
controls only; their canvas and services are inert and establish no helper/native
pixels. Retained report/artifacts remain in that lane's ignored `terra-final/`.

The parent reproduced one named integration gap through public `screens.canvasPlan`.
Live `textStyles` drafts rejected known mixed placeholders even though accepted
templates resolved correctly. Commit `836034d` routes those drafts through the
same binding resolver, with no additional parser. Its focused test was red before
correction and green afterward, proving repeated variable samples remain literal,
unknown placeholders keep explicit partial coverage and source stays unchanged.
Retained red/green logs are in ignored
`.toolchains/47-50/final-combined/draft-template/`.

The combined production build passes. The full frontend run passed all 376 current
tests but initially also discovered the obsolete generated
`dist-tests/tests/screen-dismissal.dom.test.js`. That stale artifact, whose source
was deliberately migrated/deleted, failed to import the removed class. The failed
run is retained as `frontend-stale-output-failed.log`. Removing that one generated
file and rerunning gives 376 passes, zero failures/skips. No compatibility API or
deletion-only test was restored. Broad routine core and the three combined real
controller journeys are running; their final results are not yet claimed.

Current Lab compatibility compilation identifies the expected removed `dismissal`
field in `study.ts`. A fresh Lab-only lane adapts current fixtures/handlers and
checks to the production contract, then completes the current full Lab check and
final control comparison through Terra Max. It cannot change production source,
the original approved reference or any approval/capture pointer. Parent owns the
core/live-draft correction, combined suites, final spec review and operation
accounting. No SDK/helper/native/package/CI operation is assigned.

### Combined local results and independent review

The broad routine core run completed with 602 passes, zero failures, 56 explicit
ignored cases and the three documented exclusions. All 661 inventory names were
reconciled with unique named results; nothing was missing or duplicated. One
fixture diagnostic omitted a final newline, so the audit matches exact named
results independently of line starts while still requiring the full inventory and
counts. Explicit SDK and specialist ignores are not passes or acceptance waivers.
All 376 current frontend cases and the production build pass. Three combined real
UI-to-core journeys pass with clean driver exits and fixture removal. Detailed
counts, exclusions, report hashes and stages are in ignored
`.toolchains/47-50/final-combined/results-audit.json` and adjacent logs/reports.

Current Lab compatibility `728697c`, tree
`6dc315939ddcdd6d5588d1f031081b67ec6ab543`, integrates as `9868e19`. Its full
gate passed all 24 screens, 1,456 unique cases, 23 interaction modules, 11 actual
approval/source protections and seven other groups. Live registry auditing matched
the exact case set. Source fingerprint is
`076d59f060c9d45d54d2d4a61ae1b5e8142caae941c597d2ca46a6f9cfd40abb`.
The coordinator verified the complete report, producing checkout and matching
integration fingerprint. Worktree `t3-60c4436f` retains its ignored
`.toolchains/lab-47-50/handoff.json`, SHA256
`fb0ec77b0c20bf7859e306e38a9923c9d3c2b3265bdbfd1f1ca9841458770659`.
Only two Lab files changed; production now owns the fixture's controls/drafts and
one fictional memory service owns simulated history. Original approval/reference
and all ten captures remain intact. Changed-source refusal is expected.

Final control comparison passed 24 matched states and 20 interaction checks.
Ten of twelve extra focus-clearance probes pass. Direct Add Hide at 1280x720 clips
the bottom outline identically in reference and candidate; field/focus stay visible.
The candidate retains its original review context and draft marker after add/remove
where the mock clears it. Wording, sample-status and comparison-toolbar differences
are recorded in the retained Terra report. There is no unconditional native/helper
fidelity claim or accepted pixel tolerance. This browser fixture is inert.

The following independent reviews used fixed `e2a02bc...9868e19` and the complete
commit list, with fresh read-only contexts. The coordinator remains the sole writer.

#### Standards

One P3 finding: current Lab CSS copied shared production control rules after
importing them, violating Lab's reuse-by-import rule and allowing divergence.
The same issue is a possible Duplicated Code smell; there were no other actionable
findings. The coordinator removed shared copies from the current candidate,
retaining only shell and unapproved B/C disclosure rules. The pinned approved
checkout is untouched. TypeScript, approval/history/capture and whitespace checks
pass; the affected browser check follows at the frozen qualification candidate.

#### Spec

No actionable implementation defect or scope creep was found. The reviewer traced
typed writes, qualified actions, template parsing, atomic Apply, retained drafts,
history/reopen/effects, expansion, freshness and clipped ordering. Original proof
criteria remain unsatisfied: #47 normal-play displayed order exactly once; #50
matched actual normal/helper example; both-target/aspect spacing/clipping/reuse;
and measured residual differences. Native/package proof remains pending and CI is
explicitly deferred. Offline/controller/browser results do not satisfy these gates.

Review totals: Standards one P3, corrected in current candidate with browser proof
pending; Spec zero code defects and four required engine-proof gaps. Neither ticket
is accepted. Fresh Mac qualification is selected within the existing cumulative
allowance; #47 owns the exact candidate/reservation before any SDK start. Windows
remains blocked on supported isolated T3 provisioning and corrected source transfer.

### Source/actions verification and target eligibility

The source/actions verifier returned a clean checkout at
`0b64e54beaf7a8026eb74420bbd712a90975ad60`, tree
`9c88e7df630a3a2081b97456b94b0e3cf931314f`. Its release/offline/locked public-core
selection passed nine action, fourteen reference and two effect/Story cases, with
zero failures or ignored cases. The action exporter reported `runtimeReady:true`
without engine execution. No dedicated-module defect required a change or commit.
Exact commands, logs and the caller/migration map remain in that worktree's ignored
`app/target/verification-47-backend/handoff.json` and `logs/`.

The worker found a shared contract gap. A resolved Panel with `blocking:false` is
not necessarily an eligible Show/Hide target. The coordinator reproduced the
missing capability through `screens.resolveTarget`, then exposed `canShowHide`
from the existing `qualified_panel_targets` owner. There is no second qualifier or
renderer parser. The field describes accepted source eligibility; the existing
action writer still revalidates revisions and clean dependencies. The focused case
covers absent/false modality, unknown custom effects, modal/calculated/duplicate or
nested modality refusal, and stale revision rejection. Existing Dialog/component
cases also check their ineligibility. Production controls remain unassigned pending
explicit approval and the reproducible design handoff.

The correction is based on `0b64e54`. Its retained product patch SHA256 is
`32a7b36414fb9f6ad5563c8316b8a435de550ff15cbd312fc3ea479184266f10`;
ignored `.toolchains/47-50/resume-contract/` retains the patch, initial red,
focused green and affected frontend logs. Typechecking and test compilation pass.
All 15 public reference cases and 42 affected component/Story DOM cases pass with
no skips. Rust formatting, repository validation and whitespace checks pass.
Final combined suites,
UI-to-core proof and normal-play evidence remain pending. No engine, helper, native,
package or CI process started for this correction.

### Nested-canvas verification and remaining criteria

The nested verifier returned a clean checkout at the same `0b64e54` candidate/tree
as the source verifier, with no defect, tracked change or new commit. Twelve public
core cases passed. Two named SDK cases were explicitly ignored and remain unproved.
Six frame and twenty-eight workspace DOM cases, four exact-comparison gates and
offline preflight passed. Seven controlled negative receipt probes refused invalid
evidence. Named-result auditing also refused zero-test results. Typechecking passed.
No engine, helper, game, native, package or CI process started.

Exact commands, ignored selectors, criterion details and final qualifier inputs
remain under that worktree's ignored
`app/target/qualification/offline-nested-0b64e54/verification.txt`.
`results-audit.json` owns counts and `producer-identity.json` owns input/tool hashes.
The coordinator independently verified its retained producer executable, accepted
export, clean checkout and all sixteen listed source/asset hashes against current
integration `23fc113`. These offline slices retain their original candidate; they
are not engine evidence or a final combined suite. The public export must be
regenerated at the final integrated producing candidate.

Both offline workers are complete. The following coordinator check against the
original #47/#50 criteria records gaps, not acceptance. Production UI remains
unassigned until Kris explicitly approves a variant and its exact source/capture
handoff arrives from the new design chat.

| Original criterion | Established offline | Required completion |
| --- | --- | --- |
| #47 compatible assignments and retained invalid drafts | Typed source writes/refusals and shared authoring admission | Approved controls and real UI-to-core draft retention |
| #47 qualified actions, Finish last, ordered exactly once | Shared action grammar/writer, eight-entry limit and explicit target eligibility | Action builder, click/keyboard normal-play proof at both aspects/targets |
| #47 separate marked samples and inert selection | Revision-bound typed samples and literal helper inputs | Visible sample controls/marking and real selection/sample journey |
| #47 mappings, history/reopen and revisioned effects | Public source/history/effect/Story cases | Final integrated UI-to-core/history/reopen and legacy dismissal migration |
| #50 nested comparison and sibling layering | Public expansion/plans, selection regions and exact comparison gates | Actual matched normal/helper PNG and clipped geometry pairs |
| #50 spacing, clipping, constraints and reuse | Source/planner/history cases with shared styles/components | Both targets at 1280x720 and 1024x768, initial tolerance zero |
| #50 invalidation and explicit partial coverage | Shared-definition freshness, stale geometry withdrawal and bounded refusal | Integrated UI-to-core/current native-view proof |
| #50 residual differences and no project execution | Literal data-only inputs and unsupported-region refusal | Measure and record every engine difference without a supported-node waiver |

Final combined suites and independent Standards/Spec review follow approved control
integration. Windows still needs supported isolated provisioning and corrected
source transfer. The sole operation counter/reservation owner remains #47. CI stays
deferred. No PR is opened from this preparation checkpoint; the selected draft PR
follows completion and final spec verification.

## Approved entry, 2026-11-05

Kris approved the coordinator's plan in this conversation. The integration branch
is `codex/47-50-integration`, based on
`e2a02bc9f6d0f91639c47e35d49f1befff058c60` from
`codex/phase3b-screen-designer`. The remote tip matched at entry. The unrelated
Design Lab guide edits and Phase 1 audit remain outside the selected commits.

The coordinator owns shared contracts and caller wiring, revisioned effects,
integration, combined verification and final review. Two Sol High implementation
lanes will use separate T3-created worktrees. Source/actions owns typed parsing,
minimal source writers and dedicated authoring controls. Canvas owns the existing
data-only planner/helper, frame freshness and independent nested comparisons. Their
exact assignments and worktree identities are recorded in the owning tickets.

The shared interaction contracts use stable variable/screen IDs. Assignment values
use the existing bool/int/string validation; frontend integers remain canonical
decimal strings. Show/Hide require qualified targets. Finish must be last. Text
bindings contain no expression. Variable samples carry the selected definition's
source revision and remain separate from source/runtime assignments. Core must
resolve them to inert literal text before helper submission.

Workers start from the reviewed contract checkpoint. Nested rendering can proceed
while the source/actions agent obtains the requested separate prototype handoff.
Dependent sample rendering starts after the reviewed source/binding checkpoint.
The coordinator alone integrates shared files and changes ownership explicitly.

Approved test boundaries are public core requests/history, real UI-to-core
journeys, independent normal-Ren'Py/helper comparisons and normal-play action
execution. The matched matrix uses 1280x720 and 1024x768 on macOS ARM64 and Windows
x64, with identical source/assets/fonts/samples/state and without editor overlays.
Exact pixels and geometry are the initial target. Any tolerance requires observed
differences and a user decision. Current stationary viewport behavior remains.

Implementation, prototype approval, runtime and matched rendering proof, package
qualification, independent reviews and final criterion reconciliation are pending.
No SDK, helper, package, native session or costly CI operation has started.

The initial shared Rust contracts pass locked offline core compilation. Frontend
typechecking and scoped whitespace checks pass. Both ticket selection bodies and
the single operation-accounting owner in #47 were published and read back exactly.

## Isolated assignments and interface decisions

All three prepared worktrees start from `6d027be4b473a1f9f60e755e7f1e3ce6d21a8aba`.
T3 assigned the branch names below instead of the plan's logical lane names.
Worktree identifiers are relative to T3's managed Loomlight worktree directory.

| Assignment | T3 worktree | Branch | Exclusive implementation files |
| --- | --- | --- | --- |
| Source/actions | `t3-fe18dd76` | `t3/variable-display-button-actions` | Dedicated actions/binding modules and controls, dismissal migration, focused source/action fixtures/tests |
| Nested canvas | `t3-b12957a0` | `t3/nested-canvas-rendering` | `screens/canvas.rs`, `canvas_session.rs`, `canvas-renderer.rpy`, `screen-canvas-frames.ts`, focused comparison fixtures/tooling/tests |
| Separate prototype | `t3-229694d0` | `t3/screen-actions-design-prototype` | New Design Lab screen/registry entry and owning design approval/captures |

The coordinator transferred `screens.rs`, `screens/composition.rs` and
`screens/ownership.rs` parser/inspection/composition glue to the source/action lane
through its first reviewed core checkpoint. The lane may change exact text mapping
in `screens/text.rs` as required. No other writer edits these files during that
assignment. Shared interaction types and TypeScript contracts, reference/effect
summaries, dispatch, workspace caller wiring, CI and combined records remain with
the coordinator. A worker must request a transfer before expanding its file scope.

The planned composition commands are `actions` and `variableText`. They retain
existing source/component guards and capture authoring and target revisions. The
authoring revision covers metadata and verified variable definition source.
Inspection exposes the captured revision for callers. Unknown grammar remains
source-only. The shared parser supplies qualified actions/spans and safe variable
text resolution to effects and canvas; neither consumer adds another expression
parser.

The canvas trace found `use` nodes were not expanded at the starting checkpoint.
Its owner will extend the existing source/style pipeline with bounded recursive
expansion. Selection must not introduce a wrapper that changes layout. Expanded
nodes may carry a root-use selection start while keeping unique internal IDs;
selection geometry includes only visible clipped content. Source-map metadata joins
the session dependencies so changed component bindings invalidate old output.

The prototype received task scope, existing controls and approved design references,
the current local prototype-review policy, and direct handoff instructions. Its
owner confirms existing media delivery verification and cleanup readiness. Design
approval is pending. Core TDD continues independently; no production UI is approved
by this assignment receipt.

## Component selection caller correction

The canvas owner proposed multiple clipped rectangles for each root component use,
which avoids a bounding hit rectangle over gaps. The coordinator traced the caller
and found `renderCanvasGuides` reused one button per node index, overwriting every
earlier rectangle. A focused workspace DOM case reproduced that failure with two
disjoint component regions and an overlapping later sibling.

The caller now keys regions by node and occurrence, preserves each visible region,
removes regions absent from the replacement frame and orders hit targets by helper
draw order. Each node retains one keyboard stop. Selection and resize lookup target
the actual node button explicitly; reordering must not match a selection overlay.
Captured move targets stay attached during a gesture. All 28 workspace DOM cases
and frontend typechecking pass, including movement, resize, retained drafts and
replacement geometry. A test setup initially used an unsupported zoom option;
the corrected replacement case changes a supported sample state at 100% zoom.
These results establish caller behavior with controlled helper output, not engine
rendering or native input acceptance. No capped operation started.

## Reviewed backend integration and effect owner

Canvas checkpoint `e432251` integrates as `78406bd`. Its independent Standards and
Spec axes report no actionable findings. Source/action `3005569` and correction
`5ee855e` integrate as `aa91873` and `2edd41b`. That worker returned source parser,
composition and ownership glue to the coordinator. Its initial independent axes
reported no significant findings; the modal-nesting observation was reproduced and
corrected. Component `Null()` stays known passive, and nonempty component actions
remain unsupported. The dedicated actions/binding modules stay with their worker.

The coordinator added public effect/Story acceptance proof before changing the
shared effect owner. A typed assignment/display sequence reproduced the existing
unknown summary. The integrated owner now consumes the shared action and binding
helpers, exposes assigned-variable and shown/hidden screen IDs, and hashes their
relevant revisions. It removes the superseded button-dismissal parser while retaining
separate root modality/key/focus qualification. Component extraction still refuses
contextual actions. Both new public cases pass, including changed-definition
invalidation, reopen, normal Call admission after assignment/Finish, rejection of
stale Call preparation, and conservative custom behavior. The 14 reference and eight
action cases also pass on their stated intermediate effect candidate.

Combined frontend typechecking and 76 focused canvas/workspace/component/Story DOM
cases pass. The sibling-movement status assertion now reflects withdrawn pending
geometry; the image still stays stationary. Five nested public-core cases and three
offline comparison gates pass after a real public-core export. Initial Python gate
attempts failed because system Python 3.9 lacked Pillow, then because the required
export had not been supplied. Python 3.12 with pinned Pillow 12.3 and the exported
fixture resolves those environment/setup failures; they are not engine proof.

The canvas sample consumer and its fresh reviews are pending integration. Prototype
approval, production authoring controls, runtime/matched rendering, required platform
qualification and final combined review remain pending. No capped operation started.

## Frozen backend and first engine reservation

Shared effects commit `72d92f0` is followed by canvas/sample `cd17d86` as `a16f1dc`,
normal-default correction `bba4997` as `713dc95`, runtime tooling `d82fc4e` as
`e4a7f57` and its provenance correction `0dab587` as `afe95ce`. Backend candidate
`afe95ce8e206eb44cde340e2fc23ee4e7d1230af` has tree
`787bbf549193b35b2fe78e9477df9ed8253cced5`, exactly equal to source worker merge
`b8dfcf9920093c12f9c51ace5a5f3aeba8bee20d`. The earlier pending sample-integration
statement above is superseded. Canvas handed back its clean branch and all files.
Both canvas review axes have no actionable findings at `cd17d86`; its small normal
proof correction has an explicit red/green gate. The runtime tooling's independent
Standards review found missing toolchain provenance, corrected in `0dab587`; its
Spec axis had no findings. These are scoped reviews, not the final combined review.

On the integration branch, seven nested public-core cases and four nested Python
gates pass with fresh accepted source and dangerous-looking string samples. One
initial Cargo filter matched zero tests and is not a runtime-export pass. The exact
runtime producer is invoked by `qualify-ordered-actions.py prepare`; at `afe95ce`
its prepare and validate both pass with retained binary/toolchain provenance,
`runtimeReady:true`, known final effects and actual public Story Call admission.
All five runtime evidence gates pass. An initial prepare output outside `app/target`
was refused before any producer/SDK start; corrected worktree-local output passes.

The coordinator records engine campaign 1 in #47 before execution. Mac reserves
15 SDK starts including one helper: seven ordered-action starts first, followed
only on success by eight nested-reference/helper starts. Package/native-editor/CI
starts are zero. Stop at the host's first failure; charge all actual failed/cancelled
starts and retain uncertain starts until resolved. Windows remains unreserved and
will follow the first Mac real-path proof within this initial campaign.

Terra Max owns isolated test worktree `t3-26013bcc`, branch
`t3/macos-engine-qualification`, pinned to the frozen `afe95ce` tree. Its kickoff
confirms the exact HEAD/tree and zero SDK starts; preflight is underway. No source
edits or retry authority are delegated. Logs/profiles/results stay in its ignored
qualification directory. Required receipt audit, remaining targets, prototype/UI,
native/package and final criterion review remain pending.

## Mac desktop preflight refusal

The test owner stopped before SDK execution. Repository `MacPower.state()` returned
null console/display fields and `require_desktop` refused. A separate system query
reported the console session locked; a contradictory global lock flag did not
establish an unlocked desktop. Current GL2 availability was not proved. Host and
archive preflight established macOS 26.6.2 ARM64, Rust/Cargo 1.90, Node 24.19/npm
11.9, Python 3.12.16/Pillow 12.3 and the pinned official SDK archive hash.

The coordinator read and verified the ignored `t3-26013bcc` receipt
`app/target/qualification/mac-engine-1/preflight-refusal.txt`, SHA256
`18a0a85a3e173c0ed59d096cebfac0ca928ed8167b735b0eab6d11205f95d155`.
Its tracked source remains clean at `afe95ce`. No preparation tests, source producer
or engine case ran in this test worktree. The earlier integration-branch offline
results keep their own producing candidate and scope.

Actual SDK/helper/uncertain/package/native-editor/CI/campaign counts are all zero.
All 15 reserved Mac SDK starts, including the helper, are released unused in #47;
there are no owned SDK PIDs or descendants to reap. No retry or weaker desktop
admission is selected. Mac proof waits for an unlocked/awake desktop confirmation
and positive admission, then a fresh reservation. Windows readiness and independent
design/integration work can continue. No ticket acceptance follows from preflight.

## Windows source readiness and isolated execution limit

SUNDOWN verified pinned tools and official SDK archive, then performed the one
authorized ordinary fetch. Its primary branch/HEAD, stash and all existing worktrees
were preserved. Published `db99cbb6f23c3f032d32b08d1784bbee6ba8f459`, tree
`c171d0ae26589cf95f95abb7977e2e52d77ac23d`, and backend `afe95ce` are present with
verified ancestry. The scoped diff of product/core/helper/runtime/fixture inputs is
empty between those candidates; only docs and validation branch metadata differ.
No PR, merge, release or costly CI was started by publication.

The existing subprocess route serves the selected Ren'Py-owned click/keyboard and
PNG/geometry fixtures. The hidden helper retains its existing private-desktop/job
owner. An agent's separate sandbox desktop alone is not a demonstrated blocker for
those engine-owned fixtures. Current ANGLE2 and private-desktop behavior remain
unproved until reserved execution; no physical-input/native-editor result is claimed.

#47 reserves Windows 15 SDK starts including one helper for the initial campaign,
starting with ordered actions and stopping at first failure. The attempted remote
worktree delegate was then refused by T3 before creating an agent. Its API does not
support `isolation:worktree` in linked environments. Tool discovery confirms a new
worktree-bound thread is the supported alternative, and orchestration requires an
explicit user request for that top-level thread. The coordinator requested the
bounded test thread at `db99cbb`. The full brief is prepared; no shell-created
worktree or shared-checkout execution substitutes for the selected isolation.

All actual/uncertain SDK/helper/package/native/CI/campaign counts remain zero. The
Windows reservation is held for the pending route, not assigned execution authority.
No child task/PID or cleanup arose from the API refusal. Mac desktop confirmation,
prototype/UI, both-target engine proof and final review remain pending.

## Mac campaign 1 harness failure and correction

Kris confirmed the Mac unlocked/awake and explicitly requested the Windows test
thread. Mac checkout `t3-84efa12a` stayed clean at
`bad5067c0a6a9e76da06b96398505c3ef5759c84`, tree
`fbd2b951b01836280d67990a8d6bab66a7cea4c8`. An authorized unsandboxed read-only
query established positive desktop admission after the ordinary sandbox query
returned null fields. The existing desktop owner held and released both temporary
assertions. The original preflight refusal remains separate and unchanged.

The first campaign started version, compile, lint and 1280x720 click, then stopped.
All processes exited zero, but runtime admission rejected `[rpytest] Status: PASSED `
with trailing whitespace. This matches [H61](../../testing/INCIDENTS.md#h61-exact-completion-line-comparison-rejects-reporter-whitespace).
It is a harness admission defect, not a product failure or qualified runtime pass.
Three ordered cases and the entire nested phase remain unrun. Campaign 1 is charged;
#47 owns the reconciled process totals and released unused reservations.

Ignored receipts under that checkout's `app/target/qualification/engine-1`:

| Receipt | SHA256 |
| --- | --- |
| `audit.json` | `97a1c2ba004cc9d5fbf9a12a8d92eeaccceb3a90e6972beefab70196d938bc24` |
| `ordered-sdk/result.json` | `f5b06ceaf201b9b9d3fe89193ee0cc7ee2413894a29b15255d8b1db18d7ea56f` |
| `ordered-sdk/1280x720-click.log` | `cf9f459813c843aca394ad154315da9c18e25b4b1db34fe2a062c4a27199d867` |
| `ordered-processes.jsonl` | `85f36ebc899bd898bb3514655c20335b94d924b0476178b029da29cf4099f542` |
| `ordered-desktop.json` | `7e5be6a2850be89ed64f2c3d5b31e78fb28da0a994b9173ba6d40d23cf429434` |

The coordinator read the receipts and independently verified those hashes. Four
owned launcher PIDs exited, process groups were empty, and scratch was removed.
Both desktop assertions were released. Producer inputs and source stayed unchanged.
Fresh prepare/validate reported runtimeReady and public Story Call admission true.
The accepted manifest hash is
`9453f92cc9441bda8d0fb9bbd0fb130da23665eade8052f70b7ba921444f2d0c`;
retained ARM64 producer binary hash is
`2e737751f12be1d67c393b2dcbf1848ca78c6fee02f36c7257829b2ca5c36248`.

A focused offline test reproduced the reporter rejection before correction. Runtime
admission now removes trailing line whitespace before exact status and uniqueness
checks, as the existing Help qualifier does. All six gate tests pass, including
missing/duplicate statuses and malformed suffix refusal. The unchanged retained
click log passes the corrected validator against its original manifest, eight
ordered built-in calls, visibility and exactly-once continuation. This is diagnostic
only; the original qualification remains failed. The primary ignored receipt is
`.toolchains/47-50/reporter-admission-diagnostic.json`. No SDK ran for the correction.

## Windows worktree provisioning failure

The requested top-level Windows thread at published `db99cbb` failed before model
startup in T3 `GitVcsDriver.createWorktree`: `git worktree add failed`. Its worktree
path is null. Read-only diagnosis verified the candidate/tree exist, the selected
branch name is valid, no failed branch/worktree remains registered, and the primary
checkout is clean. A T3 trace shows branch creation, attempted worktree add and
branch cleanup, but retains no command arguments, destination, exit code or stderr.
No Git root cause is established. No retry, shell-created checkout or existing
worktree takeover is selected. Windows execution remains blocked on T3 provisioning;
all its unused reservations are released. No Windows SDK/helper/native/package/CI
process started. Ordinary corrected source transfer remains authorized once a
supported isolated test binding is available.
