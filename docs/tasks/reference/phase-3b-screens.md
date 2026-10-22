# Phase 3B Screens requirements and approved design

After the published cutover receipt, [the 3B parent](https://github.com/Caldwell-41/Renpy-editor/issues/22) and its children own remaining
delivery scopes, acceptance tracking, dependencies and execution allowances.
This reference retains approved product requirements and design decisions.
Read P3B, the relevant B group and selected L work ticket with the applicable
sections here before implementation or
acceptance. The old step map below is traceability, not an independently selectable task.

Read this contract for Screens production implementation or acceptance. Mac is the
chosen development host on `codex/phase3b-screen-designer`. The selected early
source/runtime proof and browser-design outcome are complete. Full Screens
implementation and whole-phase acceptance remain pending. The
[phase brief](../active/phase-3-initial-wysiwyg-release.md) owns entry and cross-phase state.
Apply the [standing scheduling exception](phase-2-3-delivery.md#standing-phase-3b-scheduling-exception)
for all remaining 3B tickets. Final Phase 2/3A acceptance remains outstanding but
does not block their start. Actual technical dependencies still apply; canvas work
stays deferred until explicitly selected.

The selected [production Help round trip](../active/help-screen-production.md) now
has bounded functional approval at `c2d9f45`, with audited Windows x64 and signed
Mac ARM64 source/UI/SDK proof. Visual fidelity remains unaccepted. Its brief owns
its exhausted local/CI allowance; earlier proof/design allowances stay closed.

## Approved reference and evidence

The user approved Screen builder on 2026-10-22. The
[approval JSON](../../design/design-lab-screens/approval.json) owns `flow-v1` / variant
`flow`, exact source identity and 13 hashed reference captures. Its source commit is
`3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437`, fingerprint
`70d9beebc45e4783f9f17d374edf9983e03a079e68ca06d475fecec55c06a028`.
Screen notebook and Canvas focus remain drafts. [Comparison notes](../../design/design-lab-screens/README.md)
own the current controls and simulation limits. Follow
[design integration](../../../app/design-lab/INTEGRATION.md) before production edits.

The [approval receipt](../evidence/phase-3-history.md#screen-builder-design-approval-2026-10-22)
records passing 508 rendering cases and 20 interaction groups. The
[CI1 audit](../evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation)
qualifies source/runtime candidate `0ef174877cbe5ae3fd883afb92940de68916b04a` on
Windows x64/macOS ARM64, run `39555526201`; later lab/docs commits do not replace it.
The proof round-trips a nested custom screen through transactions, preserves opaque
source and exercises the actual pinned SDK. It does not complete the authoring UI.

The [earlier delivery selection](../evidence/phase-3-history.md#selected-early-outcome-and-cumulative-allowance)
and [prototype handoff](../evidence/phase-3-history.md#prototype-handoff-and-completion)
describe that completed early outcome. All earlier browser, SDK, native and CI allowances are
closed. Approval supplies the design reference for a separately selected production
outcome; browser actions remain fictional and do not waive real-operation acceptance.
The [grilling agreement](#agreed-3b-design-from-the-grilling-session) remains current
product scope. Use its acceptance requirements with the approved reference.

<a id="agreed-3b-design-from-the-grilling-session"></a>

### Agreed 3B design from the grilling session

The user approved all 22 recommendations on 2026-10-21. This section owns the product
decisions from questions 1 through 18. Questions 19 through 22 selected the completed early delivery outcome. Its
[historical allowance](../evidence/phase-3-history.md#selected-early-outcome-and-cumulative-allowance)
retains the original host, team, limits and publication record. Implementation and
proof remain separate from product-design approval.

<a id="first-journey-and-full-3b-scope"></a>

#### First journey and full 3B scope

Build separate Help panel and Help dialog examples, each with a title, explanatory
text, image and dismissal button. The panel remains visible while dialogue continues;
the dialog blocks underlying game interaction. Connect them through the selected
Show/Hide/Call screen Beats. New screen offers blank and matching Help starters;
starter controls are ordinary editable nodes.

The first authoring set contains fixed/frame/vbox, text, images and text buttons.
The remaining release inventory includes window/hbox/grid, image buttons, bars,
viewports, shared styles and reusable components. Full 3B also includes supported
editing of generated dialogue, choice, main-menu/navigation, preferences and
save/load screens. Their required controls and game behavior stay protected;
supported decoration, layout and style changes explain their limits beside controls.
The first source proof and Help slice do not complete 3B.

Use one adaptable layout per screen at the project's game resolution. Relative
positions, anchors and container rules handle the second qualified aspect ratio.
Separate resolution layouts and breakpoint authoring remain beyond 3B.

<a id="editing-and-interaction-behavior"></a>

#### Editing and interaction behavior

Keep hierarchy and canvas selection synchronized. Provide keyboard and numeric
editing alongside pointer gestures. Inspector changes remain a draft until Apply;
Cancel restores saved values. One Apply and each completed drag create one undo
entry. Invalid fields and source conflicts retain the draft.

Each custom screen has an explicit panel or blocking type. Panels dismiss with Hide;
blocking screens finish with Finish interaction. Both default to Close and Escape
dismissal; clicking outside leaves them open. Qualify keyboard focus and dismissal
in Ren'Py. These runtime dismissal rules are distinct from Escape cancelling an
editor gesture.

Canvas controls remain inert. Authors can set sample variable values and select
normal/hover/selected/disabled appearances. Mark active sample data and keep it
separate from game source and runtime values.

#### Canvas agreement with Ren'Py

The user required a 1:1, or as-close-as-possible, canvas on 2026-10-22. For the
declared supported screen subset, the project's pinned Ren'Py render is the visual
authority. At 100% zoom, one game pixel maps to one canvas pixel; Fit and other zoom
levels scale that same composition without changing the game's dimensions.

Compare the same accepted source revision, game resolution, images, fonts, sample
values and control state. Supported layout, anchors, container spacing, clipping,
layering, image scaling, text placement/wrapping, colors and control appearances
must agree with Ren'Py. Render actual supported assets and text styles rather than
filename labels or generic substitutes. Selection and editing guides are editor
overlays and are excluded from the game-image comparison.

Qualify this agreement with matched canvas and actual Ren'Py captures and geometry
at the project resolution and a second supported aspect on both targets. Record
every remaining visible difference, its cause and its affected scope. Define any
necessary platform font/rasterization tolerance against that evidence before
claiming acceptance; the current geometry proof alone does not pass this gate.
Unsupported/custom regions must state their coverage limits. Arbitrary Python and
creator-defined rendering are outside the supported subset, not a blanket allowance
for approximating supported content.

The canvas remains inert. Real Ren'Py comparisons use deliberate runtime preview;
opening, selecting or editing a screen never executes its Python or actions. This
requirement does not choose a rendering architecture. Implementation has not started
and no new implementation or qualification allowance is selected by this record.

<a id="properties-assets-reuse-and-actions"></a>

#### Properties, assets, reuse and actions

| Area | Agreed editable properties |
| --- | --- |
| Layout | Position, anchors, alignment, width/height, size limits, padding and spacing |
| Text | Content, font, size, color, alignment, bold and italic |
| Images | Asset, displayed size and aspect preservation |
| Appearance | Background, border and applicable normal/hover/selected/disabled states |

Qualify each property's Ren'Py mapping before claiming support. Other properties
remain editable in Source. Add typed project-owned font and UI-image assets and
pickers. Start font qualification with TTF/OTF; retain existing supported image
formats. Shared style/component edits update all uses, list affected screens before
Apply and offer an independent copy. Initial reusable components have no parameters.

Text can display existing variables. Bars bind to existing integer variables with
explicit limits. Buttons can assign literal values to existing bool/int/string
variables and perform short, visibly ordered action sequences. An action that
finishes interaction must be last. More complex dynamic logic and arbitrary Python
actions remain in Source.

<a id="4-3b--supported-screen-designer"></a>

## 4. 3B — Supported screen designer

For production implementation, use the approved reference and grilling agreement
above. The historical early outcome has completed; its limits are not a current
delivery allowance. The contracts below remain the source/runtime requirements.

Use the canonical [UI direction](../../UI.md#screenui-designer): hierarchy plus a
constraint canvas, property editing and synchronized screen source. The selected
first author workflow creates Help panel/dialog examples with containers, text,
image and a button. The approved inventory includes explicit layout, styles,
bounded actions, bars, grids, viewports and reusable components. Each property and
action still requires qualified source and runtime behavior before implementation
can claim support.

Start with a disposable custom screen. Prove safe ownership and round-trip mapping
before enabling the agreed generated-screen adapters; do not rewrite the full
generated screen file. Arbitrary existing-project import, dynamic screen Python,
unrestricted actions and visual fidelity for unsupported code remain excluded.
Supported content must meet [canvas agreement with Ren'Py](#canvas-agreement-with-renpy).

**Selected Story connection (2026-10-07):** provide a small typed set of Story Beats
for owned custom screens: **Show screen**, **Hide screen** and **Call screen**. Show
leaves the screen displayed while the story continues; Hide removes it. Call waits
for the screen interaction to finish, then continues at the following Beat. A called
screen's supported **Finish interaction** button emits `Return()`; a shown panel uses
Hide for dismissal. Keep Call screen distinct from Call Scene and Story Return.

Start with explicitly owned, parameterless screens and no captured return values,
dynamic screen names or arbitrary action expressions. Core resolves stable screen IDs
to source names and emits ordinary `show screen`, `hide screen` and `call screen`
statements through the existing preparation/transaction path. Reconcile source edits,
missing references and screen renames/deletions without silently retargeting a Beat.
Runtime screen presence and possible action effects feed the conservative 3D contract;
an unresolved active screen interaction is not an eligible reconstructed starting point.
These operations do not expand Phase 2's AI allowlist.

**Completion checks:** create/edit/reorder supported nodes through canvas and keyboard
hierarchy; compare the selected layout and interaction states against real Ren'Py at
the chosen resolution and a second supported aspect. Reconcile a supported Source
edit; preserve an unsupported neighboring block and show partial coverage. Undo,
resize, external conflict and reopen must preserve the same source intent. Buttons
preview as inert controls in the editor; runtime actions require deliberate execution.

**Early risk proof:** round-trip one nested screen with an opaque neighboring region
and compare its actual SDK rendering before committing to the general canvas design.
Record supported properties and visible approximation limits alongside the result.

<a id="implementation-plan-1"></a>

### Original implementation step map

**Approved release inventory:** screen roots; fixed/frame/window/vbox/hbox/grid
containers; text, image/add, textbutton/imagebutton, bars and viewports; selected
layout/text/color properties; simple styles and `use` of an explicitly owned component.
Show/Hide/Return and typed variable-setting actions form the first action builder.
Game-menu actions are selected by template adapters, not arbitrary Python entry.

Screen adapters also expose a bounded effect summary for 3D: passive presentation,
qualified conventional interaction, or possible variable/presentation/control-flow
changes with affected IDs where known. Include relevant screen, component, action and
binding revisions. Unknown/custom actions remain unknown rather than being treated as
passive. This supplies conservative refusal; it does not add interaction recording or
general screen execution to the editor. Establish this contract with 3B.1–3B.3 before
3D consumes screen-dependent state.

| Step | Concrete implementation | Proof before proceeding |
| --- | --- | --- |
| 3B.1 — Screen source service | Add proposed core `screens` service with declaration inventory, typed nodes/properties, source spans and protected opaque children, using the shared block/mutation layer. New screens get a collision-checked owned file; existing screens are edited in place, not duplicated under a new definition. | One nested custom screen containing an unsupported neighbor round-trips and accepts a minimal property edit through the transaction layer. |
| 3B.2 — Canvas, tree and inspector | Add proposed `screen-ui.ts`: synchronized hierarchy and canvas selection, drag/resize/snapping plus numeric and keyboard editing, typed asset/style pickers, action builder and inert hover/selected samples. Store editor layout/selection metadata only; renderable properties remain in source. | Drag is one undo entry; Escape cancels; parent layout rules constrain child movement. Distinguish absolute pixel coordinates, relative coordinates and anchor values rather than coercing every drag into `xalign`/`yalign`. |
| 3B.2a — Story screen connection | Add typed Show/Hide/Call screen Beats with an owned-screen picker and exact source navigation. Expose Hide for shown panels and Finish interaction for called screens; qualify these contexts before offering the actions. Share references, history and effect summaries with the screen service. | Create and connect one custom screen in normal play: Show persists through dialogue, Hide removes it, Call waits and Finish continues at the following Beat exactly once. Verify source round trip, missing-reference refusal, cancel, undo/reopen and conservative 3D uncertainty; scratch preview alone is insufficient. |
| 3B.3 — Real game screen adapters | Add schema-aware adapters for the pinned generated `say`, `choice`, main-menu/navigation, preferences and save/load templates. Expose supported layout/style slots while preserving required parameters/IDs, action bindings and dynamic list/slot logic. Support reused components by explicit owned definitions. | Change dialogue box/name placement, choice styling and menu layout in a generated project; continue dialogue, choose a route, change a preference and save/load normally in the SDK. Unsupported template versions fall back to source. |
| 3B.4 — Preview and completion | Use the shared scratch preview job with synthetic `who`/`what`, menu choices and other template inputs. Compare supported layout/hit targets against actual Ren'Py, plus full-game screen integration. Offer an explicit rerun after edits. | Native fonts/scaling/focus at project resolution and a second aspect, accessible tree/property operations, Source edit/reconcile, undo and reopen. Record preview approximations; browser geometry alone cannot qualify native output. |

| Original step | Remaining delivery tickets |
| --- | --- |
| 3B.1 | [Ownership](https://github.com/Caldwell-41/Renpy-editor/issues/23), [source nodes/properties](https://github.com/Caldwell-41/Renpy-editor/issues/24), [actions/effects](https://github.com/Caldwell-41/Renpy-editor/issues/26) |
| 3B.2 | [Assets/reuse](https://github.com/Caldwell-41/Renpy-editor/issues/25), [actions/effects](https://github.com/Caldwell-41/Renpy-editor/issues/26), [editor workflow](https://github.com/Caldwell-41/Renpy-editor/issues/28), [rendering decision](https://github.com/Caldwell-41/Renpy-editor/issues/29), [canvas rendering](https://github.com/Caldwell-41/Renpy-editor/issues/30) |
| 3B.2a | [Story screen connections](https://github.com/Caldwell-41/Renpy-editor/issues/27) |
| 3B.3 | [Dialogue/choice](https://github.com/Caldwell-41/Renpy-editor/issues/31), [menus/preferences/save/load](https://github.com/Caldwell-41/Renpy-editor/issues/32) |
| 3B.4 | [Rendering proof](https://github.com/Caldwell-41/Renpy-editor/issues/29), [canvas comparison](https://github.com/Caldwell-41/Renpy-editor/issues/30), [integrated preview/acceptance](https://github.com/Caldwell-41/Renpy-editor/issues/33) |

Candidate file conventions are `game/ui/<screen>.rpy` for new screens and a dedicated
owned style file, finalized against actual generated projects. Do not replace all of
`game/screens.rpy` or claim every arbitrary screen is editable. `say`/`choice` template
bindings are protected semantic slots; parameters are not editable runtime variables.
For save/load and other dynamic screens, the editor uses sample items, clearly marked.
Font import uses project-owned assets and typed core handles, not arbitrary CSS URLs.

The default canvas never runs screen Python or actions. Screens may be evaluated
repeatedly during Ren'Py prediction; real interaction belongs in explicit trusted
runtime preview. Complex loops, creator-defined displayables, dynamic style expressions,
custom Python actions and general import remain source/custom regions. New reusable
components initially have no arbitrary parameter expressions or transclusion authoring.

Ren'Py basis: [screen language](https://www.renpy.org/doc/html/screens.html),
[actions and values](https://www.renpy.org/doc/html/screen_actions.html), and
[GUI customization](https://www.renpy.org/doc/html/gui.html).
