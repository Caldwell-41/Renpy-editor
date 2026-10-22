# Phase 3B vertical work ticket drafts

User-approved ticket design, unpublished, 2026-10-22. Read the
[sizing review](phase-3b-ticket-sizing-review.md) before using these bodies.
The user approved 27 work tickets beneath the 11 outcome groups, their start
edges and no further merges/splits. Existing outcome aliases, requirements,
approvals and execution limits remain intact. Nothing here selects implementation.

Each ticket cuts through the authoring UI, typed service, authoritative source,
shared transactions and focused verification needed for its stated behavior.
Decision/proof ticket L17 and acceptance ticket L27 have their own completion
criteria. The existing Help path supplies the starting source/history/preview service.

All tickets inherit P3B's source protection, trust, recovery, signing, host-routing
and evidence rules. Each changed write must prove a minimal accepted change,
one history entry, no-op behavior, Cancel and invalid/conflicted/stale draft retention,
then Undo/Redo and Source reconciliation/reopen. Test the actual UI-to-core path;
isolated mocks alone are insufficient. Preserve opaque neighbors. Use deliberate
pinned-SDK preview or normal play for the ticket's rendering/runtime claims.

Each leaf accepts its stated behavior only. Later canvas, editor and full-3B
acceptance gates remain visible; an earlier functional pass cannot waive them.
Record a criterion-to-evidence result, candidate and any pending required proof.
Missing or failed proof prevents closure. Reuse unchanged qualified evidence only
with its scope and candidate basis stated.

Blocked by lists only work tickets that must finish before this ticket starts.
All leaves also require the existing external entry gate, explicit outcome selection
and a finite cumulative allowance. No incoming edge means no ticket prerequisite,
not permission to execute. New issue identities never reset an existing problem's
counts. Proposed labels remain needs-triage with no assignee, overriding the skill's
ready-for-agent default under the confirmed migration decision.

## L01 create an owned blank screen

Parent: B01. Blocked by: None beyond the common external selection gate.

What to build: Create a blank custom screen from Choose, select its owned root,
open its exact Source and reopen the project without losing that identity.

Acceptance criteria:

- [ ] Creation produces one collision-checked owned definition through one shared
  transaction. Existing definitions stay in place; cancellation and name collisions
  leave source and metadata unchanged.
- [ ] Introduce only the ownership/migration needed for this path. Migration and
  no-op reopen preserve ordinary script bytes, metadata extras and existing screens;
  unsupported newer schemas refuse.
- [ ] Source edits, offsets, rename or deletion reconcile ownership or show an
  explicit unresolved reference. They never silently select a different declaration.
- [ ] The actual Choose/core/Source/history/reopen path and a deliberate preview
  of the created screen pass. Existing revision-bound Help editing continues to work.

## L02 compose and reorder a simple Help layout

Parent: B02. Blocked by: L01.

What to build: Add fixed/frame/vbox groups, literal text and text buttons to a
custom screen, edit their text, and reorder children from the hierarchy.

Acceptance criteria:

- [ ] Add/edit/reorder operates on ordinary owned nodes through the real UI and
  minimal source changes. Groups retain their children; source order and selected
  node identity survive history and reopen.
- [ ] Pointer and keyboard hierarchy operations select the same node as the canvas;
  Enter or double-click opens Design for that node. Include type/depth help.
- [ ] Parent constraints and protected children refuse unsafe structural edits with
  retained input. No full-screen rewrite or duplicate definition is introduced.
- [ ] One nested example with a protected neighbor round-trips and displays in
  deliberate Ren'Py preview. Canvas fidelity remains a separate gate.

## L03 edit numeric layout and anchors

Parent: B02. Blocked by: L02.

What to build: Position and size a supported child from numeric Design fields,
including anchors, alignment, size limits, padding and spacing.

Acceptance criteria:

- [ ] Publish a qualified property matrix for the covered node types. Distinguish
  absolute pixels, relative coordinates and anchor values in fields and source.
- [ ] Apply changes atomically; invalid combinations and parent-layout constraints
  retain the draft with a specific explanation. Existing dimension editing remains valid.
- [ ] At project resolution and the second qualified aspect, compare actual SDK
  geometry with the accepted source values, including an anchored and constrained case.
- [ ] Numeric/keyboard entry, no-op, cancellation, conflicts, history and reopen pass
  through the production path. This ticket does not claim pointer gestures or full canvas fidelity.

## L04 author nested and clipped layouts

Parent: B02. Blocked by: L03.

What to build: Compose a bounded layout using window/hbox/grid and a viewport,
edit its container properties, and inspect its actual Ren'Py layout.

Acceptance criteria:

- [ ] Add/edit/reorder the named containers with their supported size, padding and
  spacing controls. Declare the qualified viewport behavior and visible limits.
- [ ] A nested example exercises grid placement, parent constraints and viewport
  clipping. Unsupported expressions and neighboring logic remain lossless Source regions.
- [ ] Verify the supported layout and viewport behavior in the pinned SDK at both
  aspects. Describe any Source-only viewport controls rather than offering false success.
- [ ] Hierarchy/source selection, partial coverage, history, conflict retention and
  reopen preserve the same layout intent.

## L05 format text with a project font

Parent: B03. Blocked by: L02.

What to build: Import a project-owned font, choose it for Help text, edit its
typography and inspect the resulting text in Ren'Py.

Acceptance criteria:

- [ ] TTF and OTF import/discovery use typed project-owned handles and the approved
  import boundary. Missing/invalid assets retain the draft; arbitrary CSS URLs are excluded.
- [ ] Edit content, font, size, color, alignment, bold and italic through typed
  fields and minimal source mappings. Preserve unsupported text expressions.
- [ ] Qualify actual font use, text placement and wrapping in SDK output with the
  accepted source and resolution. Do not claim schematic canvas text is qualified.
- [ ] Picker close returns focus; Apply/Cancel, source reconciliation, history and
  reopen retain the chosen asset and values. Record supported bounds/formats.

## L06 import and place a UI image

Parent: B03. Blocked by: L02.

What to build: Import a project-owned UI image, add it to a custom screen and
change its displayed dimensions while preserving its aspect when requested.

Acceptance criteria:

- [ ] Use typed UI-image roles/pickers and existing supported image formats. Missing,
  replaced or invalid references produce a specific retained-draft result.
- [ ] The inserted image is an ordinary owned node. Asset selection, displayed size
  and aspect preservation produce qualified source mappings through shared transactions.
- [ ] Ren'Py preview displays the actual chosen asset at the accepted size. Opening
  or changing the picker runs no project Python or game action.
- [ ] Verify import cancellation, source conflict, history, Source navigation and
  reopen. Keep source paths and asset handles within existing containment rules.

## L07 edit and share a look

Parent: B03. Blocked by: L05.

What to build: Edit a supported frame/text/button look, apply a shared style to
two screens, and make an independent copy for one use.

Acceptance criteria:

- [ ] Qualify supported text, background, border and applicable appearance properties
  with actual SDK output. Shared styles reference ordinary source definitions.
- [ ] Before Apply, list every affected screen. A shared edit updates both uses;
  an independent copy changes only its selected use. Cancel writes nothing.
- [ ] The inspector preserves section state, scroll, focused field and draft across
  affected-use review and copy operations. Missing or stale uses refuse safely.
- [ ] Reconcile Source edits and preserve style/use revisions through history and
  reopen. General dynamic style expressions remain Source-only.

## L08 reuse an owned component

Parent: B03. Blocked by: L02.

What to build: Turn a supported group into an explicitly owned, parameterless
component, use it in two screens and edit or independently copy one use.

Acceptance criteria:

- [ ] Component creation and use are source-backed UI operations with stable
  references, collision handling, exact Source navigation and minimal transactions.
- [ ] Shared Apply lists affected screens and updates all uses. Independent copy
  preserves the other use. Source rename/deletion or missing references cannot retarget silently.
- [ ] Track component/use revisions and combine known child effects conservatively;
  custom or unsupported effects remain unknown. Preserve drafts/history/reopen.
- [ ] Qualify both uses in actual SDK output. Do not add parameter expressions,
  transclusion authoring or arbitrary existing-project import.

## L09 create and show the Help panel

Parent: B05; also supplies B04's panel context. Blocked by: L06.

What to build: Create the ordinary editable Help panel starter, connect it with
Story Show/Hide screen Beats and continue dialogue while it is visible.

Acceptance criteria:

- [ ] The starter has title, explanation, image and Close button, with explicit
  panel type. Its nodes remain editable through the authoring operations already qualified.
- [ ] The owned-screen picker creates Show/Hide Beats with exact Source navigation.
  In normal play, Show persists through dialogue; Hide and Close remove the panel.
- [ ] Default Escape dismissal and keyboard focus work in Ren'Py; clicking outside
  leaves the panel open. Editor Escape still cancels an editor operation.
- [ ] Record panel/action effects and relevant revisions conservatively. Prove
  missing-target/rename/deletion refusal, cancel, history and reopen with no silent retargeting.

## L10 create and call the Help dialog

Parent: B05; also supplies B04's blocking context. Blocked by: L09.

What to build: Create the Help dialog starter and connect Story Call screen to
Finish interaction, using the screen reference/picker path established by L09.

Acceptance criteria:

- [ ] The editable dialog blocks underlying game interaction. Close and Escape finish
  it by default; outside click keeps it open. Qualify focus/dismissal in Ren'Py.
- [ ] Normal play waits at Call and continues at the following Beat exactly once
  after Finish. Keep screen Call/Finish distinct from Scene Call/Story Return.
- [ ] Context-invalid dismissal/actions refuse with retained input. Screens remain
  parameterless, with no dynamic names or captured return values.
- [ ] References, action revisions, cancellation, Source round trip/history/reopen
  and conservative unresolved-interaction effects pass. Scratch preview alone is insufficient.

## L11 display variables and order button actions

Parent: B04. Blocked by: L10.

What to build: Display an existing variable in screen text and configure a button
to perform a short visibly ordered sequence of typed assignments and screen actions.

Acceptance criteria:

- [ ] Pick existing bool/int/string variables and assign compatible literal values.
  Invalid types, missing variables and unsupported expressions retain the draft.
- [ ] The action builder exposes only qualified Show/Hide/Finish contexts; Finish
  is last. In normal play, actions execute in the displayed order exactly once.
- [ ] Sample values are marked and separate from source/runtime values. Editor
  selection and sample changes run no action or Python.
- [ ] Qualify source mappings, history and reopen. Effects include known affected
  IDs and all relevant screen/component/action revisions; custom effects remain unknown.

## L12 bind an integer bar

Parent: B04. Blocked by: L11.

What to build: Add a bar bound to an existing integer variable with explicit
limits, then inspect its value in deliberate runtime preview and normal play.

Acceptance criteria:

- [ ] Typed pickers and fields validate the variable, bounds and supported bar
  appearance/layout properties. Missing/type-changed variables refuse without writes.
- [ ] Actual Ren'Py behavior respects the configured limits and binding. Clearly
  marked editor samples never change the game's variable or persisted source values.
- [ ] Apply/Cancel, source conflicts, undo and reopen preserve the same binding
  and limits. Unsupported value expressions remain Source-only.
- [ ] Effect summaries include the binding/variable revisions and possible changes;
  an unresolved/custom binding is not treated as passive.

## L13 configure an image button and its appearances

Parent: B02; also supplies B04/B08 control-state input. Blocked by: L11.

What to build: Add an image button, choose its actual UI-image appearances and
attach a previously qualified typed action.

Acceptance criteria:

- [ ] Configure all applicable normal/hover/selected/disabled appearances with typed
  assets and displayed-size/aspect controls. Missing assets retain the draft.
- [ ] Deliberate Ren'Py execution demonstrates those appearances and the configured
  context-valid action. Editor control-state samples remain inert and marked.
- [ ] Source patches preserve opaque neighbors; state/action/reference revisions
  feed the conservative effect result. Custom actions remain Source-only.
- [ ] Verify numeric/keyboard editing, picker focus, cancellation, conflicts,
  history and reopen for the accepted appearance/action combination.

## L14 align the existing Help editor and preserve form state

Parent: B06. Blocked by: None beyond the common external selection gate.

What to build: Bring the existing bounded Help Choose/Design/Connect workspace
into the approved flow-v1 structure while preserving selection, drafts and form state.

Acceptance criteria:

- [ ] Use the existing size-edit/preview path to demonstrate the persistent preview,
  selected element/type, hierarchy help and Enter/double-click Design behavior.
- [ ] Compare matching covered states in both themes at 1100x720 and 560x640.
  Record and resolve or obtain explicit acceptance of material editor-layout differences.
- [ ] Sections remember open/closed state per element/step. Field updates preserve
  scroll/focus; pickers return focus and removed controls have a clear focus destination.
- [ ] Keep unavailable operations explained. This pass does not claim future controls,
  canvas fidelity or full editor visual acceptance. Later slices preserve this behavior.

## L15 move and resize with pointer and keyboard

Parent: B06. Blocked by: L18.

What to build: Move and resize qualified free-layout elements using pointer,
numeric and keyboard controls against the qualified base canvas composition.

Acceptance criteria:

- [ ] Movement begins on first press. Eight edge/corner handles, snapping and
  image proportions obey the same qualified numeric/anchor mappings.
- [ ] One completed gesture creates one history entry; Escape cancels with no write.
  Invalid/conflicted/stale completion retains input. Do not coerce every drag to alignment values.
- [ ] Parent-layout constraints explain restricted movement. Reorder/depth follows
  sibling source order; later siblings appear in front, with depth after position fields.
- [ ] Qualify the actual UI/core/source/history/reopen path and compare accepted
  SDK geometry at both aspects. Preserve keyboard alternatives and focus continuity.

## L16 control zoom and the preview area

Parent: B06. Blocked by: L18.

What to build: Use Fit, 100% and other supported zoom levels, resize the available
preview area and enter/leave Focus preview without changing game dimensions.

Acceptance criteria:

- [ ] At 100%, one game pixel maps to one canvas pixel. Other zoom levels scale
  the same composition; game resolution/aspect remains visible and unchanged.
- [ ] Preview-area resizing and Focus preview preserve selection, samples, scroll
  and drafts. They create no source/history change.
- [ ] Pointer coordinates, selection guides and numeric values agree before/after
  zoom. Guides remain excluded from game-image comparison.
- [ ] Verify mouse/keyboard access and the wide/compact approved layouts at both
  aspects. Record visual limits without weakening Ren'Py agreement.

## L17 grill and prove the canvas rendering approach

Parent: B07. Blocked by: None beyond the common external selection gate.

What to deliver: A user-confirmed rendering decision and one bounded representative
production-path proof, using the existing Help source/preview foundation.

Acceptance criteria:

- [ ] Begin with grill-with-docs using grilling and domain-modeling. Explore facts,
  alternatives and trade-offs, then obtain shared-understanding confirmation before
  selecting architecture. Record the decision in an ADR; add glossary terms only if resolved.
- [ ] Under a separately selected finite allowance, compare the same accepted source,
  assets/fonts/samples/state at two aspects on Windows/macOS. Distinguish game pixels,
  window pixels, zoom and editor overlays. Keep the editor inert throughout.
- [ ] Record visible differences, causes and scope. Resolve any platform font/
  rasterization tolerance against that evidence with the user; leave unproved questions pending.
- [ ] Specify the mappings and proof L18-L20 must extend. Representative proof
  does not accept the full subset. This review does not run the interview or choose architecture.

## L18 render the base Help composition faithfully

Parent: B08. Blocked by: L03, L06, L07, L17.

What to build: Replace the base schematic fixed/frame/vbox/text/image/textbutton
composition with actual supported assets, fonts, styles and qualified layout.

Acceptance criteria:

- [ ] At 100%, render the accepted dimensions, anchors, padding/spacing, text
  placement/wrapping, colors and image scale using the approach confirmed in B07.
- [ ] Matched canvas and actual SDK captures/geometry use identical accepted source,
  assets/fonts and state at both aspects on both targets. Apply only the evidence-based accepted tolerance.
- [ ] Report every remaining visible difference and its cause/scope. Generic asset
  labels or substitute typography cannot pass supported-content acceptance.
- [ ] Selection remains synchronized and controls inert. Source-only/custom regions
  have visible limits; editor guides are excluded from comparison.

## L19 render nested layouts and components faithfully

Parent: B08. Blocked by: L04, L08, L18.

What to build: Match supported window/hbox/grid/viewport and reusable-component
composition, including clipping, layering and container constraints.

Acceptance criteria:

- [ ] Compare a nested component/grid/viewport example against actual Ren'Py with
  the same source, samples and viewport state. Later siblings layer in front.
- [ ] Parent spacing, clipping, size limits and supported component/style reuse
  match at both aspects on Windows/macOS within the accepted evidence-based tolerance.
- [ ] Changing a shared definition invalidates relevant views and comparisons.
  Missing references and unknown/custom regions retain explicit partial coverage.
- [ ] Record all residual differences; no arbitrary Python/displayable execution
  enters the editor and no general unsupported-code waiver covers supported nodes.

## L20 render variable and control-state samples faithfully

Parent: B08. Blocked by: L12, L13, L18.

What to build: Inspect marked existing-variable and normal/hover/selected/disabled
samples for qualified text, buttons, image buttons and bars on the canvas.

Acceptance criteria:

- [ ] Render actual assets/styles and the qualified sample values for every
  applicable state. Sample editing changes no source, runtime variable or action.
- [ ] Match the same accepted source/sample/control state against actual Ren'Py
  captures and geometry at both aspects on both targets.
- [ ] Record visible differences and their causes under the evidence-based tolerance;
  unsupported states/expressions state their limits explicitly.
- [ ] Sample selection, inspector drafts and saved/stale preview state remain clear;
  opening/selecting/editing never executes screen Python or actions.

## L21 edit generated dialogue and preview its inputs

Parent: B09. Blocked by: L19.

What to build: Choose the pinned generated say screen, edit supported box/name/text
slots, preview synthetic dialogue inputs and continue actual dialogue normally.

Acceptance criteria:

- [ ] Establish template-version recognition and visible Source fallback. Preserve
  required parameters, semantic IDs, bindings and opaque regions with in-place patches.
- [ ] The actual inspector/typed-service/source path changes supported placement/
  styling. Synthetic who/what inputs use the existing shared isolated preview job.
- [ ] Compare supported canvas/SDK output and continue dialogue in normal play.
  Template parameters are protected semantic inputs, not editable game variables.
- [ ] Preserve frozen revision/staleness, explicit rerun, diagnostics/Stop/cleanup,
  conflicts, history and reopen. Record conservative template effects and revisions.

## L22 edit generated choices and preserve routing

Parent: B09. Blocked by: L20, L21.

What to build: Style the generated choice screen, inspect clearly marked synthetic
choices and select the intended route in normal play.

Acceptance criteria:

- [ ] Extend the qualified versioned adapter/preview contract from L21. Preserve
  required items, action bindings and dynamic list/choice logic.
- [ ] Edit supported choice layout/style slots through real controls and minimal
  patches; unsupported template versions/custom logic retain Source fallback.
- [ ] Preview normal and applicable interaction states with synthetic choices using
  the shared job; actual game selection still follows the intended route.
- [ ] Compare supported canvas/SDK output and prove conflicts, cancel, history,
  Source reconciliation/reopen and conservative action/effect revisions.

## L23 edit generated menu navigation

Parent: B10. Blocked by: L20, L21.

What to build: Change supported main-menu/navigation layout and appearance while
keeping the generated game's navigation and conventional actions intact.

Acceptance criteria:

- [ ] Recognize the pinned schemas and expose only supported slots with limits beside
  controls. Preserve required controls/bindings; unsupported versions fall back to Source.
- [ ] The actual UI/source path edits definitions in place. Qualified synthetic menu
  inputs use the existing shared preview service with explicit rerun/staleness/cleanup.
- [ ] Compare supported canvas/SDK output and navigate normally in the generated
  game. Adapter-selected conventional actions receive conservative effect summaries.
- [ ] Verify shared-look affected-use review where applied, independent copy,
  cancellation, conflict retention, history and reopen.

## L24 edit generated preferences

Parent: B10. Blocked by: L20, L21.

What to build: Change supported preferences layout/style and preview sample values
while preserving real preference controls and behavior.

Acceptance criteria:

- [ ] Recognize the pinned template and protect conventional preference bindings,
  IDs and required controls. Unsupported versions/custom expressions stay in Source.
- [ ] The inspector writes only supported decoration/layout/style slots. Clearly
  marked samples use the shared preview job and never replace saved runtime logic.
- [ ] Compare supported canvas/SDK output, change a preference in the actual game
  and verify its intended result. Do not treat template bindings as arbitrary variables.
- [ ] Source reconciliation, cancel/conflicts, history/reopen, stale preview,
  diagnostics/Stop/cleanup and revisioned conservative effects pass.

## L25 edit generated save and load screens

Parent: B10. Blocked by: L20, L21.

What to build: Edit supported save/load layout/style, preview marked sample slots
and save/load the intended state in a disposable generated game.

Acceptance criteria:

- [ ] Recognize pinned save/load schemas and preserve required controls, dynamic slot/
  list logic and action bindings. Unsupported templates/custom logic remain Source-only.
- [ ] Actual inspector changes patch definitions in place. The shared scratch preview
  supplies clearly marked sample slots without writing those samples into game logic.
- [ ] Compare supported canvas/SDK output, then save and load the intended state
  normally. Retain scratch/profile isolation and protect original project saves.
- [ ] Prove affected-use review/copy where applied, conflicts, history/reopen,
  frozen/stale preview, diagnostics/Stop/cleanup and conservative effect revisions.

## L26 qualify the integrated 3B candidate

Parent: B11. Blocked by: L14, L15, L16, L22, L23, L24, L25.

What to deliver: One coherent 3B candidate with integrated automated/native evidence
for the implemented journeys. This ticket adds no deferred product feature.

Acceptance criteria:

- [ ] Reuse the leaf results with an explicit candidate/input basis and select only
  affected or unresolved integrated checks. Allocate a finite qualification allowance
  before any execution; preserve every existing failure and cumulative count.
- [ ] Qualify Help panel/dialog normal play and generated dialogue/choice/menu/
  preference/save/load journeys across authoring, Source, history, conflicts and reopen.
- [ ] On both targets at both aspects, audit actual required source/runtime/native
  paths, fonts/scaling/focus/hit targets, frozen/stale previews and complete owned cleanup.
- [ ] Reject missing, skipped, cancelled or failed required cases. Bind results to
  exact candidates/artifacts; distinguish synthetic input from physical keyboard and human proof.

## L27 review final 3B acceptance

Parent: B11. Blocked by: L26.

What to deliver: A complete acceptance record, including physical keyboard and
human decisions, with every remaining 3B requirement accounted for.

Acceptance criteria:

- [ ] Audit all 44 requirement IDs against linked leaf evidence and the coherent
  candidate. Keep implementation, functional, editor visual, canvas visual, native
  and human results separate; missing proof remains pending.
- [ ] Complete accessible hierarchy/property and physical keyboard checks using
  qualified matching native inputs. Synthetic DOM input cannot substitute for physical proof.
- [ ] Obtain explicit decisions on remaining editor differences and game-render
  evidence/tolerances. Geometry alone cannot pass canvas visual acceptance.
- [ ] Record the required human acceptance or explicit scope disposition before
  proposing outcome/parent closure. Preserve protected recovery, all execution limits
  and exclusions. No Phase 3-wide sign-off, release or product work is added.
