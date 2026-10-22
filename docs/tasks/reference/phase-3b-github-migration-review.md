# Phase 3B GitHub migration review

Review draft with user-confirmed migration decisions, 2026-10-22. This package proposes migration of remaining
3B delivery work to GitHub Issues in Caldwell-41/Renpy-editor. It changes no current
owner, approval, allowance or product behavior. Issues remain unpublished.

Read [issue drafts](phase-3b-github-issue-drafts.md) for the parent and 11 children,
and [ownership changes](phase-3b-github-ownership-proposal.md) for exact proposed
instructions and cutover edits. `P3B` and `B01` through `B11` are draft aliases,
not GitHub issue numbers. Requirement aliases below are migration traceability IDs.

The user approved the [to-tickets sizing review](phase-3b-ticket-sizing-review.md):
keep 11 outcome groups and add 27 [vertical work tickets](phase-3b-vertical-ticket-drafts.md),
with the reviewed start edges and no further merges/splits. The draft publication
design now has a six-file baseline and 39 issues. Groups own aggregate acceptance;
selected leaves own bounded execution. Publication remains unapproved.

## Audit baseline and conclusion

The audit used branch `codex/phase3b-screen-designer`, HEAD
`cd18b2a1e4c59ae23f17bb7e917065b8fea02c2a`, current source, approved design metadata
and the linked acceptance records. Unrelated local changes to AGENTS.md and the
domain/triage guides remain outside this package. The tracker guide is an explicitly
reviewed publication prerequisite. A read-only GitHub query of all issue
states returned no issues on 2026-10-22, so there is no existing ticket to reuse.
Recheck before publication.

Remote inspection found origin/codex/phase3b-screen-designer at
`6fb39f72c926c477c0047118e2a939931a70e0b4`; audit HEAD is two local commits ahead.
Those are `0a6f933` (59-path documentation/validator maintenance) and `cd18b2a`
(seven-path 3B review/canvas requirement). The first has broader pre-existing scope
than this 3B migration. The two commits affect 61 unique paths. The split contracts,
this package and the untracked tracker guide are not yet available at their intended
GitHub links. The user selected explicitly naming these prerequisite payloads in the
final publication review, including only docs/agents/issue-tracker.md from the
untracked agent guides. The [publication manifest](phase-3b-github-ownership-proposal.md#publication-manifest)
separates them from the later 3B ownership cutover. This is a selected publication
plan, with no push or issue write authorized yet.

The requirements owners are [Screens](phase-3b-screens.md), its pinned
[approval JSON](../../design/design-lab-screens/approval.json),
[shared contracts](phase-3-shared-contracts.md) and
[delivery sequence](phase-2-3-delivery.md). [UI](../../UI.md#screenui-designer),
[PRODUCT](../../PRODUCT.md#required-authoring-capabilities) and
[ROADMAP](../../ROADMAP.md) supply the
lasting product direction. The task does not extend 3A, 3C, 3D, 3F or Phase 2.

3B has a qualified narrow source/runtime foundation and a functionally approved
Help size/preview workflow. It does not have complete visual authoring or full
acceptance. No defensible completion percentage follows from those slices.

| Area | Implementation inspected | Acceptance and remaining gap |
| --- | --- | --- |
| Source inspection and edits | [screens.rs](../../../app/src-core/src/screens.rs) recognizes parameterless custom screens in game/ui, fixed/frame/vbox and literal text/add/textbutton nodes. Only existing integer xsize/ysize can be written. A few layout values are read for the schematic view. | [ADR 0018](../../adr/0018-early-screen-source-proof.md) and [CI1 audit](../evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation) qualify minimal patches and opaque preservation at `0ef1748`. Handles use source revision and byte offsets. Persistent IDs, creation and the full grammar remain open. |
| Production editing | [screen-ui.ts](../../../app/src/screen-ui.ts) synchronizes list/canvas selection, retains size drafts, uses atomic Apply, shared history, Source navigation and one bounded resize handle. | [Help brief](../active/help-screen-production.md#scope-and-acceptance) and [final review](../evidence/help-screen-production.md#orchestrator-final-review-2026-10-22) approve bounded functionality. Add, movement, assets, styles and Connect explicitly remain unavailable. |
| Explicit runtime preview | [scratch_preview.rs](../../../app/src-core/src/scratch_preview.rs) freezes accepted project inputs and calls one parameterless screen in an isolated owned job. Runtime preparation and lifecycle use existing trust, staleness, Stop and cleanup controls. | [Help CI3](../evidence/help-screen-production.md#ci3-terminal-audit-2026-10-22) and [signed Mac result](../evidence/help-screen-production.md#local13-corrected-signed-mac-result) qualify the bounded real path. General template/sample inputs and full-game integration remain open. Reuse this service. |
| Approved editor design | flow-v1, source `3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437`, fingerprint `70d9beebc45e4783f9f17d374edf9983e03a079e68ca06d475fecec55c06a028`, 13 captures. | [Design receipt](../evidence/phase-3-history.md#screen-builder-design-approval-2026-10-22) records 508 rendering cases and 20 interaction groups. This approves a fictional browser reference. Production panel/layout differences remain unaccepted. |
| Canvas agreement with Ren'Py | Production uses schematic buttons, fixed offsets and generic text styling. It does not draw actual supported assets/fonts or implement the full layout model. | [Canvas requirement](phase-3b-screens.md#canvas-agreement-with-renpy) is approved but unimplemented. Frame geometry is useful functional evidence, not a matched-image qualification. Architecture and evidence-based tolerances remain undecided. |
| Assets, actions and integrations | AssetKind currently covers background/character/music/sfx, without typed UI images/fonts. Screens IPC exposes inspect and dimension setters. There are no implemented owned-screen Story commands or generated-screen editing adapters in the inspected path. | B03 through B05 and B09/B10 need new qualified behavior. Existing generated starter screens and test-fixture screen statements do not establish authoring support. |

The [core screen regressions](../../../app/src-core/src/screens/tests.rs),
[DOM tests](../../../app/tests/screen-ui.dom.test.ts),
[renderer/core tests](../../../app/tests/help-screen.browser.mjs) and
[runtime tests](../../../app/src-core/src/lifecycle/runtime_tests.rs) match the narrow
implementation. They do not establish coverage for controls that do not exist.
Application source and test files have no delta between tested `c2d9f45` and audit
HEAD; later differences in app/README and two general workflows are documentation
and validator wiring. This does not make HEAD a newly tested package.

## Evidence and execution limits to carry forward

The early SDK proof passed on Windows x64/macOS ARM64 at
`0ef174877cbe5ae3fd883afb92940de68916b04a`, run 39555526201. It rendered a 720x360
frame in a 1280x720 game. Its 922x518 capture dimensions describe the window,
not game pixels. It did not qualify the full editor, persistent ownership, focus,
Story connections or a second aspect.

Help functional approval binds tested `c2d9f457777dc78975779cb0583f6d1cc494755a`,
Windows CI3 run 39712450128 attempt 1, and the accepted signed Mac proof at
`5925bb6`. Windows service proof covers 1280x720 and 1024x768 with a 760x360 frame.
The packaged WebView proof covers the bounded authoring/SDK round trip. Input is
synthetic DOM input. Physical keyboard and whole-phase human acceptance remain
separate. Windows package identities are runner receipts, not an independent rehash
of uploaded package bytes. This migration reviews committed evidence and source;
it does not repeat the original artifact, binary or visual audit.

| Existing selection | Carried state |
| --- | --- |
| Early source/runtime and design work | Completed; every earlier local/browser/SDK/native/CI allowance is closed. Preserve [original limits and failed attempts](../evidence/phase-3-history.md#selected-early-outcome-and-cumulative-allowance). |
| Help local and CI | Local 15/15; qualification dispatches 3/3. CI1 and CI2 stay failed and charged. No local16, CI4 or rerun is authorized. |
| Help Mac | Packages 3/3, native launches 2/3, previews 7/8. Remaining numerical headroom grants no unrelated execution. |
| Help Windows | Packages 2/2, native launches 2/3, previews 4/4. |
| Other selections | Preserve Phase 2/3A and paused walkthrough limits and protected recovery in [HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance). No transfer into 3B. |
| Future tickets | No implementation or qualification allowance allocated. Selection must state a finite cumulative allowance and actual authorization. Ticket publication/readiness cannot supply either. |

The CI1 hosted artifacts expire on 2026-10-28 and Help CI3 on 2026-10-29. Existing
audits describe ignored retained copies. Keep public provenance in Git and private
logs/packages/receipts outside it. An expiring download link alone is insufficient
evidence retention. Missing future access must be recorded as missing, without
rewriting an accepted historical result or silently rerunning it.

## Proposed ticket order and dependencies

P3B has 11 outcome children, each grouping its work tickets and aggregate criteria.
Start blockers apply between the 27 work tickets in the
[approved numbered graph](phase-3b-ticket-sizing-review.md#numbered-breakdown-for-review).
A blocker must finish before the dependent leaf starts. Full-outcome acceptance
conditions stay in the group bodies; they are not start edges for every feature.
Neither the hierarchy nor its edges authorize execution or parallel writers.

| Outcome | Primary work tickets |
| --- | --- |
| B01 | L01 |
| B02 | L02, L03, L04, L13 |
| B03 | L05, L06, L07, L08 |
| B04 | L11, L12 |
| B05 | L09, L10 |
| B06 | L14, L15, L16 |
| B07 | L17 |
| B08 | L18, L19, L20 |
| B09 | L21, L22 |
| B10 | L23, L24, L25 |
| B11 | L26, L27 |

Every future work-ticket selection requires the external gate in addition to its
start dependencies. The external gate is accepted Phase 2/3A entry under shared delivery, or a newly
explicit bounded early-3B exception, plus selection and allowance for the particular
outcome. The completed early exceptions do not authorize all remaining 3B. Do not
create Phase 2/3A tickets under this migration. Keep that prerequisite linked to its
current owner. 3D consumes qualified B04/B05/B09/B10 effects later; implementing 3D
is not a dependency of completing 3B.

Publish native GitHub sub-issue relationships and issue dependencies when available.
Otherwise use `Part of #<parent>`, `Blocked by: #<number>` and a parent task list,
as required by the [tracker convention](../../agents/issue-tracker.md). Initial label
proposal is needs-triage for every issue, without assignees or ready-for-agent.

## Requirement to ticket coverage

Every row has one primary delivery owner. Supporting tickets supply shared contracts
or final evidence; they do not own a second copy of the requirement. Retained evidence
below is credited only to its recorded scope. P3B carries all rows at cutover.

| ID | Existing requirement and source | Current evidence or gap | Primary ticket; supporting proof |
| --- | --- | --- | --- |
| R01 | Stable owned screen references, revision/mapping migration; [source contract](phase-3b-screens.md#4-3b--supported-screen-designer) and [shared contracts](phase-3-shared-contracts.md#inspected-implementation-seams) | Only revision-bound path/name/offset handles exist | B01 |
| R02 | Blank and Help panel/dialog starters; editable ordinary nodes; [first journey](phase-3b-screens.md#first-journey-and-full-3b-scope) | Existing screen editing only | B01; B04, B11 |
| R03 | Collision-checked new owned files, edit existing definitions in place, reconcile rename/deletion without retargeting; [implementation plan](phase-3b-screens.md#implementation-plan-1) | game/ui inspection exists; creation and durable references absent | B01; B05 |
| R04 | Screen/fixed/frame/window/vbox/hbox/grid nodes; [inventory](phase-3b-screens.md#implementation-plan-1) | fixed/frame/vbox recognized, limited size writes | B02 |
| R05 | Text, add/image, textbutton/imagebutton, bars and viewports; [inventory](phase-3b-screens.md#implementation-plan-1) | Literal text/add/textbutton recognized; remaining authoring absent | B02; B04 for bindings |
| R06 | Add/edit/reorder supported nodes, including grouped descendants; [completion](phase-3b-screens.md#4-3b--supported-screen-designer) and [approved behavior](../../design/design-lab-screens/approval.json) | Selection and size editing only | B02; B06 |
| R07 | Position, anchors, alignment, sizes/limits, padding and spacing; distinguish absolute/relative values; [properties](phase-3b-screens.md#properties-assets-reuse-and-actions) and [plan](phase-3b-screens.md#implementation-plan-1) | Existing integer sizes writable; some layout hints read | B02; B06, B08 |
| R08 | Text content/font/size/color/alignment/bold/italic; [properties](phase-3b-screens.md#properties-assets-reuse-and-actions) | No general visual property editing | B02; B03, B08 |
| R09 | Image asset/size/aspect, backgrounds/borders, applicable appearance states; [properties](phase-3b-screens.md#properties-assets-reuse-and-actions) | Schematic labels; no full mapping | B02; B03, B08 |
| R10 | Source authority, minimal non-regex patches, comments/formatting/Python/opaque boundaries and visible partial coverage; [shared contracts](phase-3-shared-contracts.md#inspected-implementation-seams) | Qualified for narrow dimension edits | B02; all mutation tickets preserve it |
| R11 | Transaction/history/recovery, one Apply/gesture entry, no-op none, Cancel/Escape no write, retained invalid/conflicted/stale drafts; [editing](phase-3b-screens.md#editing-and-interaction-behavior) | Qualified narrow Help path | B06; B01-B05, B09/B10 mutation proofs, B11 |
| R12 | Source reconciliation, undo/redo, external conflict and reopen preserve intent; [completion](phase-3b-screens.md#4-3b--supported-screen-designer) | Qualified narrow Help path | B11; each changed source ticket |
| R13 | Typed project-owned UI images/fonts; TTF/OTF first, existing image formats, typed handles; [assets](phase-3b-screens.md#properties-assets-reuse-and-actions) | Existing asset kinds lack these roles | B03 |
| R14 | Shared styles/components update all uses, affected-screen review and independent copy; no initial parameters/transclusion; [reuse](phase-3b-screens.md#properties-assets-reuse-and-actions) | No production support | B03 |
| R15 | Explicit panel/blocking types; Close/Escape defaults; outside click stays open; Ren'Py focus/dismissal; [interaction](phase-3b-screens.md#editing-and-interaction-behavior) | Fixture Close proof does not qualify both contexts | B04; B05, B11 |
| R16 | Existing-variable text samples and integer bars with explicit limits; [actions](phase-3b-screens.md#properties-assets-reuse-and-actions) | No authoring/binding support | B04; B02, B08 |
| R17 | Typed literal bool/int/string assignments, short ordered actions, Finish last; Hide versus Return; [actions](phase-3b-screens.md#properties-assets-reuse-and-actions) | Actions preserved as Source | B04 |
| R18 | Passive/conventional/possible effects, known affected IDs and screen/component/action/binding revisions; unknown stays unknown; [effect contract](phase-3b-screens.md#implementation-plan-1) | No qualified screen-effect contract | B04; B05, B09/B10 |
| R19 | Show continues, Hide removes, Call waits, Finish resumes next Beat exactly once in normal play; [Story selection](phase-3b-screens.md#4-3b--supported-screen-designer) | Scratch call is not Story authoring proof | B05 |
| R20 | Stable owned-screen picker/navigation, missing/renamed/deleted reference refusal, distinct Scene Call/Return, undo/reopen and conservative 3D uncertainty; [Story selection](phase-3b-screens.md#4-3b--supported-screen-designer) | Connect remains Source-only | B05; B01, B04 |
| R21 | Choose/Design/Connect, selected element/type, persistent preview, nested list order/type help and Enter/double-click Design; [approval](../../design/design-lab-screens/approval.json) | Partial production rail/selection; layout differs | B06 |
| R22 | Synchronized hierarchy/canvas, keyboard/numeric alternatives, constrained movement/snapping and eight handles with image proportions; [editing](phase-3b-screens.md#editing-and-interaction-behavior), [approval](../../design/design-lab-screens/approval.json) | Limited selection/numeric/one-handle resize exists | B06 |
| R23 | Depth after horizontal/vertical position, later items in front, within-group reorder; [approval](../../design/design-lab-screens/approval.json) | No production depth/reorder authoring | B06; B02, B08 |
| R24 | One adaptable layout, game resolution distinct from zoom, Fit/100%, resize available preview area and Focus preview; [layout](phase-3b-screens.md#first-journey-and-full-3b-scope), [canvas](phase-3b-screens.md#canvas-agreement-with-renpy), [approval](../../design/design-lab-screens/approval.json) | Fit schematic only | B06; B08 |
| R25 | Remember sections per element/step; retain scroll/focus, return picker focus and recover focus after removal; [approval](../../design/design-lab-screens/approval.json) | Narrow size-input continuity corrected; full editor unproved | B06 |
| R26 | Inert canvas; explicit marked variable/control-state samples separate from source/runtime; [editing](phase-3b-screens.md#editing-and-interaction-behavior) | Inert schematic exists; samples absent | B08; B04, B06 |
| R27 | Ren'Py rendering authority; same source/resolution/assets/fonts/sample/state; one game pixel per canvas pixel at 100%; [canvas](phase-3b-screens.md#canvas-agreement-with-renpy) | Approved requirement, no rendering decision or qualification | B08; B07 |
| R28 | Layout/anchors/spacing/clipping/layers/image scaling/text wrapping/colors/appearances agree; actual assets/styles, overlays excluded; [canvas](phase-3b-screens.md#canvas-agreement-with-renpy) | Geometry alone is insufficient | B08; B07 |
| R29 | Matched canvas/actual Ren'Py captures and geometry at two aspects on both targets; enumerate differences and define evidence-based font/rasterization tolerance before acceptance; [canvas](phase-3b-screens.md#canvas-agreement-with-renpy) | No accepted full comparison/tolerance | B08; B07, B11 |
| R30a | Preserve approved editor reference as a separate visual gate; [Help review](../evidence/help-screen-production.md#orchestrator-final-review-2026-10-22) | Editor visual acceptance pending | B06 |
| R30b | Qualify game-render agreement independently of editor layout; [Help review](../evidence/help-screen-production.md#orchestrator-final-review-2026-10-22) | Canvas visual acceptance pending | B08 |
| R31 | Generated say/choice supported slots, protected parameters/IDs/bindings and list logic; [adapters](phase-3b-screens.md#implementation-plan-1) | No editing adapters | B09 |
| R32 | Generated main-menu/navigation/preferences/save/load slots, protected required behavior/dynamic slots and qualified conventional actions; [adapters](phase-3b-screens.md#implementation-plan-1) | Starter generation exists, adapters absent | B10 |
| R33 | Pinned template-version recognition, unsupported fallback to Source, edit in place without rewriting screens.rpy; [adapters](phase-3b-screens.md#implementation-plan-1) | No generated-screen editing contract | B09; B10 uses same contract |
| R34a | Actual SDK dialogue/choice behavior survives supported changes; [adapter proof](phase-3b-screens.md#implementation-plan-1) | Help proof does not cover these screens | B09; B11 integrates |
| R34b | Actual SDK menu/preference/save/load behavior survives supported changes; [adapter proof](phase-3b-screens.md#implementation-plan-1) | Help proof does not cover these screens | B10; B11 integrates |
| R35 | Shared scratch service with who/what/choices/template sample inputs; visibly marked dynamic samples; [preview](phase-3b-screens.md#implementation-plan-1) | Existing service only calls parameterless screen | B11; B09/B10 |
| R36 | Explicit preview/rerun, frozen accepted revision, stale state, Stop/diagnostics/cleanup, trust and no authoring lock during long jobs; [shared contracts](phase-3-shared-contracts.md#inspected-implementation-seams) | Qualified bounded Help service and native paths | B11 preserves/extends; no second runtime service |
| R37 | Native fonts/scaling/focus/hit targets and accessible tree/property operations at both aspects; [completion](phase-3b-screens.md#implementation-plan-1) | Physical keyboard/full subset still pending | B11; B06, B08 |
| R38 | Unsupported/custom coverage limits; arbitrary Python/displayables/import/dynamic styles/actions remain Source; editing never executes; [scope](phase-3b-screens.md#4-3b--supported-screen-designer) and [canvas](phase-3b-screens.md#canvas-agreement-with-renpy) | Narrow recognizer already preserves opaque source | P3B constraints; every child, B11 verifies |
| R39 | No AI allowlist expansion, parameterized screens/captured returns, separate breakpoint layouts, unrestricted actions or 3D interaction recording; [scope](phase-3b-screens.md#4-3b--supported-screen-designer) | Boundaries remain current | P3B constraints; B04/B05/B08 |
| R40 | Approved flow-v1 source/captures immutable; other variants drafts; fictional browser behavior is not acceptance; [approval](../../design/design-lab-screens/approval.json) | Approved metadata and retained reference | P3B constraints; B06 |
| R41 | Both-target source/runtime evidence, rejecting gates, exact candidates and distinct automated/native/human acceptance; [workflow](../../WORKFLOW.md#test-host-routing-and-ownership), [Help acceptance](../active/help-screen-production.md#scope-and-acceptance) | Narrow passed evidence retained; full 3B pending | B11; each ticket's focused proof |
| R42 | Existing sequence, host/writer/recovery, closed cumulative allowances and explicit selection; [shared delivery](phase-2-3-delivery.md), [Help limits](../active/help-screen-production.md#current-continuation-and-allowance) | No remaining implementation selection | P3B constraints; every child |

R30 and R34 are split by their independent visual and runtime contexts. Each row
has one owner. Old step IDs 3B.1,
3B.2, 3B.2a, 3B.3 and 3B.4 remain valid references; the issue drafts map them to
smaller delivery outcomes without redefining their approved scope.

## Review decision and cutover boundary

### Interview decisions

The user selected these proposal decisions during the grill-with-docs interview.
They do not authorize publication, ownership cutover or product implementation.

| Question | Selected decision |
| --- | --- |
| Q1 ownership | GitHub will own remaining 3B delivery scope, dependencies, per-ticket acceptance and execution allowances. Approved product requirements, detailed evidence and live recovery retain their repository owners. |
| Q2 backlog breadth | Migrate the complete remaining backlog as one parent and 11 children. Unselected issues stay open with needs-triage and no execution authority. |
| Q3 interview scope | Settle migration choices here. Canvas architecture and evidence-based rendering tolerances remain decisions in a separately selected B07 outcome. B07 must include a grill-with-docs session, as required in Q9. |
| Q4 closure | Close children only after their declared acceptance or an explicit scope disposition. Record implementation progress, review readiness and blockers separately. |
| Q5 prerequisite payload | Name both existing commits, the three migration drafts and the required tracker guide in the final publication review for origin/codex/phase3b-screen-designer. Exclude unrelated agent changes. This selects the plan only. |
| Q6 effective ownership | Existing docs remain owners until every issue/dependency verifies, the reviewed ownership commit is published, and one cutover receipt names the issue URLs and commit. |
| Q7 access failure | Use the ordinary access-blocker rule: preserve local work, report the blocker and resume when GitHub is available. No snapshot protocol or parallel task record. Confirmed in Q9 after the user challenged the extra complexity. |
| Q8 coverage maintenance | Put the live requirement-ID-to-child and acceptance map in the parent. Keep this repo audit table as a dated migration baseline. Delivery reassignments update the parent; product changes update the owning contract and parent map. |
| Q9 shared understanding | The user confirmed the migration understanding and approved finalizing the review draft, with a required grill-with-docs session in B07. This authorizes no issue publication, push, ownership change or product implementation. |
| To-tickets refinement | The user approved 27 work tickets beneath the 11 outcome groups, their start edges and no further changes. The publication design now has 39 issues and a six-file non-owning baseline. This is design approval only. |

The fact review preserves B05 as input to B06's complete Connect acceptance. The
approved leaf graph lets the existing Help layout/form pass start independently.
Aggregate closure requirements are separate from work-ticket start edges. The publication manifest explicitly includes the tracker
guide before any required remote link is claimed to resolve. These are draft
corrections, not changes to approved product scope.

### Publication and cutover remain pending

Review the ticket decomposition, requirement coverage and exact ownership edits
together. Approval of this proposal would authorize only the specifically selected
publication/cutover payload. It would not select product implementation, native or
SDK execution, CI dispatch, commit/push, a PR, merge or release unless the user also
expressly authorizes those actions.

The migration design interview is complete. The existing docs remain authoritative.
The next action is user selection of the concrete publication/cutover outcome;
the confirmed review draft grants no issue publication or ownership change.

## Preparation verification

Local documentation/privacy/link validation passes for 845 repository files.
Whitespace review passes. All 13 approved capture hashes match approval.json;
the recorded source/design/Help commits exist locally. All 44 primary requirement
owners match the approved leaf coverage. The 27 work-ticket start edges are acyclic
and every leaf reaches final acceptance. No product tests, SDK runs, native
launches, packages or CI dispatches ran for this ticket review.
