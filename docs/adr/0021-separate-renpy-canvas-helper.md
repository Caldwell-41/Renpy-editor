# ADR 0021: Separate Ren'Py helper for the Screens canvas

- Status: Accepted design; bounded production integration, shutdown and matched Help rendering qualified; native feedback/input qualification pending
- Date: 2026-10-22
- Authority: The user confirmed the complete interview agreement and requested this
  ADR and the update to [L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36).

The supported screen canvas must agree with the project's pinned Ren'Py render,
including text wrapping, while editing remains inert and shows draft changes.
Use a separate Ren'Py canvas helper as the approach for the later representative
proof. Reusing Ren'Py's layout and text rendering reduces the behavior Loomlight
must reproduce. This decision accepts the approach and proof scope; it supplies
no rendering evidence or authorization to implement or run that proof now.

The user subsequently selected implementation of #36. The
[proof record](../tasks/evidence/canvas-rendering.md) owns implementation mappings,
observed differences and remaining qualification. This does not weaken the fidelity
or feedback requirements below.

The [matched comparison closeout](../tasks/evidence/canvas-rendering.md#both-target-matched-rendering-closeout)
qualifies the accepted Help composition at both internal aspects and normal/hover
states on both targets, with no pixel tolerance. The full supported subset, physical
input, native presentation timing and smooth manipulation retain their separate gates.

## Execution and editing boundary

The helper loads a Loomlight-supplied renderer using the project's pinned official
SDK. Core supplies validated supported values, styles, fonts, images and explicit
samples as data. The helper never loads game scripts or bytecode, evaluates project
Python or arbitrary expressions, or runs game actions. Resolve supported static
properties and samples without executing their project dependencies. Text
interpolation must retain that data-only boundary. An unresolved dependency,
including an inherited style or calculated parent size, makes the affected area
explicitly partial or unavailable. Preserve its source and element-list entry,
with Source navigation and deliberate Test in Ren'Py available.

After the existing SDK approval checks, start the helper automatically when Screens
needs it and reuse it during editing. It must neither open a game window nor take
keyboard focus. Stop it on project close or change. Missing SDK or helper failure
leaves the element list and property fields usable and retains drafts. An older
image may remain as a clearly out-of-date reference; its old geometry cannot drive
dragging. There is no silent fallback to a simplified renderer.

The selected production adapter uses GL2 on macOS and ANGLE2 on Windows. It
refuses a different backend. A trusted early bootstrap suppresses SDL window
ordering and activation on macOS before display initialization. Windows starts
the SDK on a private desktop through a small bundled owner, inside core's existing
kill-on-close job. It never switches the input desktop. These mechanisms retain
the same data-only renderer and pinned SDK boundary; they do not establish
physical GPU acceleration or full rendering equivalence.

Normal shutdown writes a stop request and allows three seconds for the helper's
acknowledgment and exit. Success requires exit 0, drained output and no remaining
owned process. Windows also requires the private desktop to close. If any part
fails, core retains its bounded process-tree cleanup fallback. Project close,
project change and application shutdown use this same owner. Startup refusal
exits before Ren'Py can display a graphical error dialog. The linked proof record
distinguishes service checks from packaged native observation and unproved focus
or presentation cases.

The canvas shows provisional property changes and gestures before acceptance.
Keep drafts and sample values distinct from accepted source and runtime values.
Canvas clicks select elements. Existing Apply/Cancel, gesture Escape and shared
transaction/history rules remain under the [Screens contract](../tasks/reference/phase-3b-screens.md#editing-and-interaction-behavior).
The helper creates no second saved screen document. Test in Ren'Py remains an
explicit actual-project execution using accepted source and the existing runtime
trust, frozen-revision, stale-preview, Stop and cleanup rules.

## Coordinates, fidelity and feedback

At 100%, one virtual game pixel occupies one logical editor pixel. Normal Retina
or Windows display scaling may use multiple physical monitor pixels. Fit and other
zoom levels scale the same composition without changing game dimensions. Qualify
two internal game shapes and check ordinary window resizing separately; resizing
a window alone does not prove adaptable game layout. Separate resolution layouts
and breakpoint authoring remain beyond 3B.

Supported layout, sizes, anchors, spacing, clipping, layering, image scale, colors,
control appearances and text placement/wrapping must agree with actual Ren'Py.
Use actual supported assets and styles. Compare matching source, resolution,
assets/fonts, samples and control state; exclude selection and editing guides.
Any allowance for differences at letter or image edges requires matched evidence
and a later user decision. There is no universal pixel threshold, layout/wrapping
waiver or general unsupported-code exemption for supported content.

The initial warm-update target is at least 95% of editing inputs visible on the
canvas within 100 ms. Dragging and resizing must also appear smooth. Measure the
complete input-to-visible-result path on each target and retain delayed updates;
a core timer or rendering-opportunity callback alone cannot establish presentation.
Report startup separately. Startup limits and acceptance of any residual stalls
remain pending evidence. The 100 ms target follows response-time guidance and the
existing input/pan target; neither establishes helper performance.

## Later representative proof

When separately selected and budgeted, use the existing Help source/preview
foundation for one production-path example containing nested containers, padding,
spacing, anchors, a real image, a project font, multiline wrapped text and a text
button with sample appearances. Exercise live text changes, dragging and resizing.

Compare the helper's source-derived composition with the actual accepted screen in
deliberate Ren'Py preview, using the same assets, samples and state. Use project
resolution and a second internal aspect on Windows x64 and macOS ARM64, with window
scaling checked separately. Record captures, geometry, every visible difference,
cause and affected scope. Keep accepted-source fidelity comparisons separate from
provisional draft timing. Verify selection outlines, selection geometry, helper
startup/failure/shutdown, focus retention and absence of project-script/action
execution during editing. Preserve the existing source/transaction safeguards for
any writes introduced by that later outcome.

The proof must record the actual source-property-to-rendering mappings, coordinate
conversions, supported style/sample rules and remaining limits. Ren'Py rendering
APIs alone do not provide an editor connection or a complete selection map. Frame
delivery, request/revision handling and geometry mapping need qualification. A
failure returns to decision review before broad renderer implementation or a
weaker requirement is accepted.

| Later ticket | What it must extend and prove |
| --- | --- |
| [L18 #46](https://github.com/Caldwell-41/Renpy-editor/issues/46) | Base fixed/frame/vbox/text/image/textbutton composition, actual assets/styles, anchors and text wrapping through the qualified mappings. |
| [L19 #50](https://github.com/Caldwell-41/Renpy-editor/issues/50) | Window/hbox/grid/viewport and reusable components, clipping, layering, constraints and shared-definition invalidation. |
| [L20 #54](https://github.com/Caldwell-41/Renpy-editor/issues/54) | Existing-variable samples and applicable normal/hover/selected/disabled appearances for the remaining supported controls. |

Each extension retains matched both-target/two-aspect comparison and explicit
coverage limits. One Help proof does not accept the full subset, generated-screen
adapters, editor layout or whole 3B. [B07 #29](https://github.com/Caldwell-41/Renpy-editor/issues/29)
and #36 remain open for missing proof; [B08 #30](https://github.com/Caldwell-41/Renpy-editor/issues/30)
owns full supported canvas acceptance.

## Alternatives and consequences

- A WebView renderer avoids the SDK process and fits the existing UI. It requires
  reproducing Ren'Py's layout and font behavior. Ordinary CSS layout has no proven
  equivalence, so this carries substantial risk under matching text wrapping.
- Capturing the actual project supplies its initialized behavior but executes game
  code. Keep it for deliberate comparison under the existing runtime boundary.
- The chosen helper requires the pinned SDK and a new editor connection. Its
  responsiveness and fidelity remain unproved. The
  [bounded production integration and shutdown proof](../tasks/evidence/canvas-rendering.md#both-target-production-integration-and-shutdown-closeout)
  records the selected both-target native observations and their limits. Unknown
  custom dependencies stay explicit even though Ren'Py performs the drawing.

This refines the proposed Preview service's Screens responsibility in
[ARCHITECTURE](../ARCHITECTURE.md#proposed-components). It preserves
[ADR 0008](0008-controlled-runtime.md) and [ADR 0010](0010-local-project-safety-and-observed-flow.md)'s
actual-project execution controls. No earlier accepted ADR or historical result is
superseded. [Source authority](0001-lossless-source-model.md), narrow IPC, SDK
verification, approved-root containment and signing rules remain applicable.

## Technical basis and pending evidence

[Ren'Py's rendering API](https://www.renpy.org/doc/html/cdd.html#renpy.render) can
render displayables inside the engine. Inspected
[8.5.3 export source](https://github.com/renpy/renpy/blob/8.5.3.26051504/renpy/exports/displayexports.py)
requires an initialized display for render export; screenshot export is not a
demonstrated live-update transport. The
[pinned text implementation](https://github.com/renpy/renpy/blob/8.5.3.26051504/renpy/text/text.py)
confirms distinct line-breaking behavior. These facts support testing engine reuse,
not a claim that the helper already exists. Public Ren'Py documentation currently
describes 8.5.4; version-sensitive behavior must use the project's pinned adapter.

[Ren'Py configuration](https://www.renpy.org/doc/html/config.html#var-config.screen_width)
distinguishes virtual game dimensions from window dimensions.
[CSS pixel definitions](https://www.w3.org/TR/css-values-4/#absolute-lengths) distinguish
logical and device pixels. [Response-time guidance](https://www.nngroup.com/articles/website-response-times/)
and [ADR 0010's input/pan gate](0010-local-project-safety-and-observed-flow.md#acceptance-replacing-the-old-observation-gate)
explain the initial latency target. No SDK, app, renderer proof or CI was run for
this decision session. #36 owns current delivery, allowance and remaining evidence.
