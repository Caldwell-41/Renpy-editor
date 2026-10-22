# Phase 3B GitHub issue drafts

Unpublished review payload, 2026-10-22. Use with the
[audit and coverage table](phase-3b-github-migration-review.md) and
[ownership proposal](phase-3b-github-ownership-proposal.md). These bodies take effect
only after approved publication and ownership cutover. Replace aliases with actual
issue links and repository links pinned to the reviewed documentation commit.
Publish no local absolute paths, ignored receipts or private data.

Each B outcome receives a native parent relationship to P3B. Each L work ticket
receives one primary B parent and only the approved work-ticket start edges, with
the documented body-link fallback if needed. Labels remain needs-triage, with no
assignees or execution allowance.

The user approved the [to-tickets refinement](phase-3b-ticket-sizing-review.md):
these 11 scopes are outcome groups with [27 smaller work tickets](phase-3b-vertical-ticket-drafts.md).
Their bodies retain full acceptance criteria and cannot be selected as individual
fresh-context implementation assignments. Publication remains unapproved.

## P3B parent

Title: Complete the remaining Phase 3B supported screen designer

### Proposed body

Loomlight can inspect and resize an existing supported Help screen and deliberately
preview its accepted source in Ren'Py. Complete the approved 3B authoring inventory,
Story connections and generated-screen adapters, with an editor matching flow-v1
and supported canvas content matching the pinned Ren'Py render.

The [3B product contract](phase-3b-screens.md),
[flow-v1 approval](../../design/design-lab-screens/approval.json),
[shared source/runtime contract](phase-3-shared-contracts.md) and
[delivery sequence](phase-2-3-delivery.md) retain approved product decisions. This
parent owns the remaining delivery map and aggregate acceptance after cutover;
children own their bounded delivery criteria. The map below owns live coverage after
the published cutover receipt. The
[repository audit](phase-3b-github-migration-review.md#requirement-to-ticket-coverage)
retains the dated migration baseline. Record later scope decisions here and update the owning
product contract only when the user changes an approved requirement.

These issues become delivery owners
only after every body/dependency verifies, the reviewed ownership commit is published,
and a parent cutover receipt names that commit and all 39 issue URLs. Until then,
existing repository docs remain authoritative. Creation alone has no ownership effect.

Retain credit for early source/runtime CI1 at `0ef1748`, design approval at `3c7ea31`,
and bounded Help functional approval at `c2d9f45` with Windows CI3 and accepted signed
Mac evidence. [Help final review](../evidence/help-screen-production.md#orchestrator-final-review-2026-10-22)
owns the approval limits. Editor visual differences, canvas agreement, physical
keyboard and whole-3B human acceptance remain pending.

Outcome groups; the approved L graph defines execution order:

- [ ] B01 Persistent ownership and new-screen lifecycle.
- [ ] B02 Supported source nodes, properties and structural edits.
- [ ] B03 UI assets, shared styles and reusable components.
- [ ] B04 Panel/dialog actions, bindings and effect summaries.
- [ ] B05 Story Show/Hide/Call screen integration.
- [ ] B07 Canvas grill-with-docs session, rendering decision and representative fidelity proof.
- [ ] B08 Supported canvas agreement with Ren'Py.
- [ ] B06 Approved flow-v1 editing workflow.
- [ ] B09 Generated dialogue and choice adapters.
- [ ] B10 Generated menus, preferences and save/load adapters.
- [ ] B11 Preview inputs and integrated 3B acceptance.

### Work tickets

Select an L work ticket for bounded execution after actual authorization. B groups
own aggregate acceptance and consume cross-group evidence without duplicating
allowances. Group acceptance conditions are not native start-blocking edges.

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

### Live coverage map after cutover

Pending means the remaining/full requirement is unaccepted. It does not revoke
the narrow source/Help successes credited above. Update owner and evidence/status
here as delivery progresses. Keep these IDs stable through ticket reassignment or
splitting; record any user-approved requirement disposition explicitly.

| ID | Requirement | Primary outcome owner | Remaining acceptance | Work/evidence coverage |
| --- | --- | --- | --- | --- |
| R01 | Persistent owned references and migration | B01 | Pending | L01 |
| R02 | Blank and editable Help starters | B01 | Pending | L01, L09, L10 |
| R03 | Collision-safe files and reference reconciliation | B01 | Pending | L01, L09, L10 |
| R04 | Supported containers | B02 | Pending beyond narrow subset | L02, L04 |
| R05 | Supported controls | B02 | Pending beyond narrow subset | L02, L04, L06, L12, L13 |
| R06 | Add/edit/reorder with grouped descendants | B02 | Pending | L02, L04, L08 |
| R07 | Layout properties and coordinate semantics | B02 | Pending beyond existing dimensions | L03, L04, L15 |
| R08 | Text properties | B02 | Pending | L05, L07 |
| R09 | Images and appearance properties | B02 | Pending | L06, L07, L13 |
| R10 | Lossless minimal source and partial coverage | B02 | Narrow proof passes; full subset pending | All source-changing leaves; L26 audits |
| R11 | Drafts, transaction/history and gesture semantics | B06 | Narrow Help proof passes; full editor pending | Every write plus L14/L15; L26 audits |
| R12 | Source reconciliation, conflicts, undo/reopen | B11 | Narrow Help proof passes; integrated proof pending | Every source-changing leaf; L26/L27 integrate |
| R13 | Typed UI images and fonts | B03 | Pending | L05, L06 |
| R14 | Shared styles and owned reusable components | B03 | Pending | L07, L08 |
| R15 | Panel/dialog focus and dismissal | B04 | Both contexts pending | L09, L10 |
| R16 | Existing-variable display and bar bindings | B04 | Pending | L11, L12 |
| R17 | Typed ordered actions | B04 | Pending | L09-L11, L13 |
| R18 | Revisioned conservative effects | B04 | Pending | L08-L13, L21-L25 |
| R19 | Normal-play Show/Hide/Call/Finish semantics | B05 | Pending | L09, L10 |
| R20 | Story references, navigation and uncertainty | B05 | Pending | L01, L09, L10 |
| R21 | Approved Choose/Design/Connect workflow | B06 | Partial rail/selection exists; full workflow pending | L02, L09, L10, L14 |
| R22 | Accessible constrained manipulation | B06 | Narrow resize passes; full manipulation pending | L02-L04, L15 |
| R23 | Depth and grouped source order | B06 | Pending | L02, L15, L19 |
| R24 | Resolution, zoom and preview-area controls | B06 | Pending beyond schematic Fit | L16, L18 |
| R25 | Section, focus and scroll continuity | B06 | Narrow input continuity passes; full editor pending | Picker/field leaves and L14; L26/L27 verify |
| R26 | Inert canvas with marked samples | B08 | Inert schematic exists; samples pending | L11-L13, L20 |
| R27 | Ren'Py authority and pixel/zoom semantics | B08 | Pending | L17-L20 |
| R28 | Supported composition and real assets/styles | B08 | Pending | L18-L20 |
| R29 | Matched both-target/aspect visual proof | B08 | Pending | L17-L20, L26, L27 |
| R30a | Editor visual agreement | B06 | Pending | L14, L27 |
| R30b | Independent game-render agreement | B08 | Pending | L18-L20, L27 |
| R31 | Generated say/choice slots | B09 | Pending | L21, L22 |
| R32 | Generated menus/preferences/save/load slots | B10 | Pending | L23-L25 |
| R33 | Template versioning and in-place Source fallback | B09 | Pending; B10 consumes contract | L21 establishes contract; L22-L25 extend it |
| R34a | Dialogue and choice runtime behavior | B09 | Pending | L21, L22 |
| R34b | Menu/preference/save/load runtime behavior | B10 | Pending | L23-L25 |
| R35 | Shared preview template/sample inputs | B11 | Pending beyond parameterless screen | L21-L25 implement their inputs; L26 integrates |
| R36 | Explicit frozen/stale/Stop/cleanup preview | B11 | Narrow Help proof passes; extensions pending | Every runtime-changing leaf preserves it; L26 audits |
| R37 | Native/accessibility proof at both aspects | B11 | Full scope and physical keyboard pending | L26, L27 |
| R38 | Supported/custom boundaries and inert editing | P3B | Preserve throughout; B11 verifies | All leaves; L27 audits |
| R39 | Deferred scope and AI allowlist boundaries | P3B | Preserve throughout; B11 verifies | All leaves; L27 audits |
| R40 | Immutable flow-v1 approval/reference | P3B | Approval retained; production gates remain separate | UI leaves preserve the pin; L14/L27 compare |
| R41 | Exact evidence and distinct acceptance states | B11 | Narrow evidence retained; full 3B pending | Every leaf retains scoped proof; L26/L27 audit |
| R42 | Entry, ownership, recovery and closed allowances | P3B | Preserve throughout; no child selected | Every selection preserves entry, authorization and cumulative counts |

Completion requires every mapped requirement to have scoped passing evidence and
the required acceptance decision. Child closure alone is insufficient. Record the
coherent candidate, justified evidence reuse, both-target results, remaining visible
differences and separate functional/visual/native/human decisions in a final summary.
Missing, failed, skipped or cancelled required checks remain unresolved. Any accepted
scope change needs an explicit user decision and an updated coverage map.

Execution constraints apply to every child:

- Keep source authoritative, use minimal patches through shared transactions, and
  preserve unsupported regions, drafts, history, ordinary external conflicts and recovery.
- Opening/selecting/editing never executes project code or actions. Runtime comparison
  is deliberate. Reuse the shared preview service and narrow typed IPC.
- Preserve flow-v1's source/captures and the normal Mac identity/signing policy.
  Use Mac as the existing sole-writer development host; route affected automated
  Windows/macOS proof under WORKFLOW. Change host ownership only through a selected handoff.
- Retain the existing threat model and exclusions. Parameterized screen calls,
  captured returns, unrestricted actions/import, breakpoint authoring, AI allowlist
  expansion, 3C/3D/3F implementation and release work are outside this parent.
- Entry requires accepted Phase 2/3A or a newly explicit bounded early exception.
  Preserve the paused walkthrough and protected recovery under HANDOVER.
- No child has an execution allowance. Help remains local15/15, CI3/3; Mac
  packages3/3, apps2/3, previews7/8; Windows packages2/2, apps2/3, previews4/4.
  Earlier proof/design allowances stay closed. Failures stay charged. A new selected
  outcome must record its finite cumulative allowance before implementation or checks.
  Reassess after two unsuccessful corrections of one hypothesis.
- Issue creation, labels and assignment grant no implementation, retry, publication,
  push, PR, merge or release authority. Keep detailed evidence in the existing repo
  evidence owners and private artifacts ignored.

If GitHub is unavailable, preserve local work and report the access blocker. Resume
when access returns. This migration adds no offline snapshot or parallel task record.

Initial state: not_started. Next action: select a bounded work ticket and resolve its
entry/allowance, after the migration itself is approved and cut over.

## B01 persistent ownership and new-screen lifecycle

Title: Add persistent ownership and creation for supported custom screens

Part of P3B. Outcome group with primary work tickets L01. Covers R01-R03;
extends old 3B.1. Parent constraints and approved product references apply.

Current handles are path/name/byte offsets bound to a revision. Add stable owned
screen/node references and the required metadata migration before creating or
connecting screens. Finalize collision-safe file/style conventions against actual
generated projects. Offer blank and matching Help panel/dialog starters with ordinary
editable nodes. Existing screens keep their source location.

Acceptance:

- Migration and no-op reopen preserve script bytes, metadata extras and stable
  identity; newer unsupported schemas refuse safely.
- Creation uses collision-checked owned files and one transaction/history operation.
  Cancellation, stale revisions and ordinary external conflicts write nothing.
- Source rename/deletion or missing declarations produces explicit reference
  reconciliation/refusal without duplicate definitions or silent retargeting.
  This requirement does not itself add rename/delete UI commands.
- Prove one actual renderer/core creation and reopen, opaque-neighbor preservation,
  undo/redo and collision refusal before broader structural writes.

Evidence: link focused results/candidate and durable ownership contract from this
issue. Coordinate Story references with B05. No execution allowance is allocated.

## B02 supported source nodes and properties

Title: Author the approved screen nodes and properties through minimal source edits

Part of P3B. Outcome group with primary work tickets L02, L03, L04, L13. Covers R04-R10 and source support for R06-R09/R23;
extends 3B.1 and the source half of 3B.2. Parent constraints apply.

Extend recognition and typed preparation to screen roots, fixed/frame/window/vbox/
hbox/grid, text, image/add, textbutton/imagebutton, bars and viewports. Support
add/edit/reorder within qualified ownership. Implement the approved layout, text,
image and appearance property mappings; B03 owns asset/style/component references
and B04 owns action/variable semantics.

Acceptance:

- Record each supported syntax/property and its Ren'Py mapping, including absolute
  versus relative positions, anchors, size limits, padding/spacing and container rules.
- Source-derived models prepare the smallest safe patches. Preserve comments,
  formatting, Python, opaque children and unsupported parents. Refuse ambiguous writes.
- Structural edits retain grouped children and source order/layer intent. Each
  operation has revision, cancellation, history, conflict and reopen proof.
- Qualify representative mappings in the pinned SDK before claiming support.
  Recognized read-only hints alone do not count as editable properties.

Evidence: record the support matrix and focused source/runtime results. Do not
replace the generated screens file or add arbitrary import. No allowance allocated.

## B03 UI assets and reuse

Title: Add typed UI image and font assets with shared styles and components

Part of P3B. Outcome group with primary work tickets L05, L06, L07, L08. Covers R13-R14 and asset/reuse support for R08-R09;
extends 3B.2/3B.3. Parent constraints apply.

Add project-owned UI-image and font roles, import/discovery and typed pickers. Start
font qualification with TTF/OTF and retain existing supported image formats. Implement
simple shared styles and explicit owned reusable components with no initial parameters.

Acceptance:

- Imported assets use approved roots, typed core handles and the existing transaction
  path. Fonts do not enter through arbitrary CSS URLs. Qualify real fonts/images.
- Before shared Apply, list affected screens. Applying updates all uses; independent
  copy changes only the selected use. Cancel/conflict retains the draft.
- Owned component use, styles and assets preserve stable references through Source
  reconciliation, undo and reopen. Missing references explain the affected scope.
- Keep component parameters, arbitrary expressions and transclusion authoring deferred.

Evidence: asset/font results and multi-screen reuse/source/history proof. B08 consumes
actual assets and styles. No execution allowance is allocated.

## B04 actions and screen interaction contexts

Title: Add typed panel and dialog actions with conservative screen effects

Part of P3B. Outcome group with primary work tickets L11, L12. Covers R15-R18; extends 3B.1-3B.3 semantics.
Parent constraints apply.

Represent panel versus blocking interaction explicitly. Add typed Show/Hide/Return
and literal assignments to existing bool/int/string variables, short visibly ordered
action sequences, text variable display and integer bar bindings with explicit limits.
Template actions enter through B09/B10 adapters.

Acceptance:

- Panels dismiss with Hide. Called blocking screens finish with Return(). Close and
  Escape work by default; outside click keeps either open. Qualify focus/dismissal
  in Ren'Py and keep runtime Escape distinct from cancelling an editor gesture.
- Finish interaction is last; invalid types, missing variables and unsupported action
  contexts refuse without writes. Game controls remain inert in the editor.
- Effects distinguish passive, qualified conventional and possible variable/
  presentation/control-flow changes. Record known affected IDs and relevant screen,
  component, action and binding revisions. Unknown/custom effects remain unknown.
- Source round trip/history/reopen and deliberate runtime context proof pass.
  Active unresolved interaction is ineligible for reconstructed 3D entry.

Evidence: typed action/context/effect contract and focused proof. Implement no 3D
runner or interaction recording here. No execution allowance is allocated.

## B05 Story screen connections

Title: Connect owned screens through Story Show Hide and Call Beats

Part of P3B. Outcome group with primary work tickets L09, L10. Covers R19-R20 and references under R03;
implements old 3B.2a. Parent constraints apply.

Add typed owned-screen pickers, exact source navigation and ordinary show screen,
hide screen and call screen statements through shared preparation/transactions.
Keep screen Call/Finish distinct from Scene Call/Story Return.

Acceptance:

- In normal play, Show persists while dialogue continues; Hide removes the panel;
  Call waits and Finish resumes at the next Beat exactly once.
- Stable IDs resolve source names. Source edits, missing targets and rename/deletion
  cannot silently retarget a Beat. Cancel, conflict, undo and reopen retain intent.
- References/history and effect revisions are shared with Screens. Unknown active
  interaction gives conservative 3D uncertainty/refusal.
- Prove both panel and blocking journeys in normal play. A scratch call alone is
  insufficient. Keep screens parameterless, with no dynamic names or captured returns.

Evidence: renderer/source/history and full-game results. No AI allowlist expansion
or Phase 3D implementation. No execution allowance is allocated.

## B06 approved editor workflow

Title: Complete the approved flow-v1 screen editing workflow

Part of P3B. Outcome group with primary work tickets L14, L15, L16. Covers R11,
R21-R25 and R30a; implements the UI half of 3B.2.
Parent constraints apply. Read Design Lab INTEGRATION before production edits.

Promote the pinned approved interaction design to real operations. Preserve the
Choose/Design/Connect rail, persistent preview and selected element/type context.
Map each approved control to an actual operation and explain supported limits.

Acceptance:

- Hierarchy/canvas selection agrees. Nested row help/order, grouped reorder,
  Enter/double-click Design, keyboard/numeric alternatives, constrained movement,
  snapping, eight handles and image proportions work. Depth follows position and
  later siblings appear in front.
- One Apply or completed drag yields one history entry; no-op none; Cancel/Escape
  writes nothing. Invalid/conflicted/stale operations retain drafts.
- Separate game resolution from Fit/100% zoom and preview area resizing/Focus preview.
  Remember section state per element/step and retain scroll/focus, picker return
  and fallback focus when a control disappears.
- Compare actual matching content/states in both themes at 1100x720 and 560x640
  against flow-v1. Resolve or obtain explicit user acceptance of each material editor
  difference. Prototype asset/render simplifications do not waive B08.

Evidence: control-to-operation map, accessible editing tests, matched editor captures
and visual decision. Keep the accepted reference pinned. No allowance allocated.

## B07 canvas rendering decision

Title: Select and prove a canvas rendering approach for Ren'Py agreement

Part of P3B. Outcome group with primary work tickets L17. Supports R27-R29;
addresses the new canvas requirement without choosing architecture in this migration.
Parent constraints apply.

Compare feasible approaches against the approved supported subset, source authority,
inert editing, real assets/fonts and layout fidelity. Define one representative
production-path proof before broad renderer work. Reuse the existing deliberate
runtime service for comparisons.

Begin B07 with a grill-with-docs session using grilling and domain-modeling. Resolve
the rendering approach and its trade-offs with the user before selecting the
architecture. Record the confirmed decision in an ADR. Record glossary terms only
if the session resolves project-specific vocabulary. Revisit evidence-dependent
rendering tolerances after matched proof; the interview cannot establish a tolerance
without that evidence. This required session grants no implementation or execution
allowance by itself.

Acceptance:

- Complete the grill-with-docs session and obtain the user's shared-understanding
  confirmation. Preserve the recorded decisions and any questions that require
  representative evidence before they can be resolved.
- Record the chosen approach, alternatives, consequences and affected contracts in
  an ADR. Opening/selecting/editing must not execute project Python or actions.
- Under a separately selected finite allowance, compare the same accepted source,
  assets/fonts/samples/states at project resolution and a second aspect on both
  targets. Distinguish window pixels, game pixels, zoom and editor overlays.
- Record actual visible differences and causes. Define any necessary platform
  font/rasterization tolerance from evidence before accepting it; leave unresolved
  tolerance/design decisions explicit. No invented universal pixel threshold.
- The result identifies the mappings/limits and proof B08 must extend. Representative
  proof alone does not accept full 3B or all supported canvas content.

Evidence: ADR, matched representative captures/geometry and the user's material
decisions where required. No rendering architecture or execution allowance selected yet.

## B08 supported canvas rendering

Title: Match supported canvas content to the pinned Ren'Py render

Part of P3B. Outcome group with primary work tickets L18, L19, L20. Covers R26-R29 and game-render
agreement under R30b; extends 3B.2/3B.4. Parent constraints apply.

Replace schematic content with the qualified rendering approach. At 100% zoom,
one game pixel is one canvas pixel. Fit and other zoom levels scale the same
composition. Use actual supported assets/fonts/styles and explicit sample values
and normal/hover/selected/disabled appearances.

Acceptance:

- Layout, anchors, spacing, clipping, layers, image scaling, text placement/wrapping,
  colors and control appearances agree within the evidence-based accepted tolerance.
- Compare matched accepted revision/resolution/assets/fonts/samples/control state
  with actual Ren'Py captures and geometry, at both aspects on Windows/macOS.
  Exclude editing guides from game-image comparison. Record every remaining visible
  difference with cause and affected scope.
- Sample data/state is marked and stays separate from source/runtime values. The
  canvas remains inert. Unsupported/custom regions explain their coverage limits.
- Supported content cannot inherit prototype simplifications or a general
  unsupported-code waiver. Geometry alone cannot close visual acceptance.

Evidence: subset comparison matrix and explicit visual acceptance. B06 owns editor
layout agreement and B11 integrated proof. No execution allowance allocated.

## B09 dialogue and choice adapters

Title: Edit supported generated dialogue and choice screen slots

Part of P3B. Outcome group with primary work tickets L21, L22. Covers R31/R33/R34a;
implements part of 3B.3. Parent constraints apply.

Recognize the pinned generated say/choice template schema and expose bounded
decoration/layout/style slots. Establish the shared template-version and fallback
contract for B10. Preserve required who/what/items parameters, semantic IDs,
action bindings and dynamic choice logic.

Acceptance:

- Edit generated definitions in place with minimal patches, retaining unsupported
  neighbors. Unsupported template versions fall back to Source with a visible reason.
- Change dialogue-box/name placement and choice styling in a generated project;
  continue dialogue and choose the intended route normally in the actual SDK.
- Protect required bindings and parameter semantics. Undo/Source reconciliation/
  reopen preserves behavior. Effects use B04's conservative revisioned contract.
- Qualify synthetic who/what/choice inputs through each adapter's own shared
  preview path before B11 consumes its results. Protected template parameters
  remain distinct from editable runtime variables.

Evidence: template support contract, bytes/history and normal-play results.
Canvas comparison consumes B08 at integrated acceptance. No allowance allocated.

## B10 game menu adapters

Title: Edit generated menus preferences and save load without changing game behavior

Part of P3B. Outcome group with primary work tickets L23, L24, L25. Covers R32/R34b and the B10 application of R33;
completes 3B.3. Parent constraints apply.

Extend the pinned schema-aware adapter contract to main-menu/navigation, preferences
and save/load. Expose supported decoration/layout/style slots with limits beside
controls. Preserve required controls, conventional action bindings, dynamic lists
and save-slot logic. Qualify adapter-selected game-menu actions.

Acceptance:

- Edit existing definitions without rewriting screens.rpy or duplicating screen names.
  Unsupported template versions and custom regions retain Source fallback.
- In an actual generated game, change menu layout, navigate normally, change a
  preference, save and load the intended state after the supported edits.
- Use B04 effect summaries and B03 shared reuse. Show affected screens before shared
  changes, with an independent-copy option. Prove cancel/conflict/history/reopen.
- Provide clearly marked sample items for preview; samples never replace dynamic
  runtime slot/list behavior in saved source.

Evidence: per-template support/behavior map and SDK results. B11 integrates with
B08 rendering. No execution allowance allocated.

## B11 integrated acceptance

Title: Qualify full Phase 3B preview authoring and game integration

Part of P3B. Outcome group with primary work tickets L26, L27. Owns R12/R35-R37/R41
and final proof of parent constraints R38-R42; completes 3B.4.

Integrate the shared scratch inputs and sample states qualified by L21-L25.
Complete Help panel/dialog and generated-screen journeys across Source,
history, reopen, deliberate preview and normal play. Preserve existing freeze,
staleness, trust, diagnostics, Stop and owned cleanup contracts.
This group contains qualification and acceptance work, with no deferred feature
implementation hidden in the final gate.

Acceptance:

- Qualified who/what/choice/other template samples and explicit rerun work. Long
  preview work releases authoring ownership. No editing or selection executes code.
- At project resolution and a second supported aspect on both targets, verify native
  fonts/scaling/focus/hit targets and accessible hierarchy/property operations.
  Separate physical keyboard proof from synthetic DOM input and human acceptance
  from automated proof. Reuse unchanged qualified slices only with a stated basis.
- Complete source-edit/reconcile, supported structural/property edits, retained
  drafts/conflicts, undo/redo and reopen while preserving opaque neighbors and
  exact source intent. Panel/dialog Story behavior and generated game controls pass.
- Audit exact candidates/artifacts and rejecting gates. Retain all failed attempts
  and counts; report pending or missing proof. Do not turn earlier failures into passes.
- Record separate editor visual, canvas visual, functional, native and human
  acceptance decisions against the complete requirement map before parent closure.

Evidence: one concise acceptance matrix linked to detailed repository evidence.
No release/package distribution or whole Phase 3 sign-off. No allowance allocated.
