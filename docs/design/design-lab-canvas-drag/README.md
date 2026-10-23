# Canvas drag alternatives

Three unapproved interaction drafts for [L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36),
after the [capture-loss diagnosis](../../tasks/evidence/canvas-rendering.md#probe-movement-bounds-and-drag-diagnosis).
They compare how to grab the bounded Help frame and distinguish immediate draft
guides from delayed content. They do not replace the approved flow-v1 reference.

Open the Design Lab on port 5174, then use these direct previews:

- [Move handle](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=handle&state=delayed&theme=dark&viewport=wide).
  A labelled handle identifies the movable frame. Content remains available for
  single-click child selection. Recommended because it addresses the unclear target
  without changing nested selection. The handle moves inside the frame at the top edge.
- [Drag border](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=border&state=delayed&theme=dark&viewport=wide).
  The selected frame's border is the drag target. Content still selects children.
  This adds less chrome, but requires aiming at the edge, especially at small zoom.
- [Drag selected frame](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=body&state=delayed&theme=dark&viewport=wide).
  The entire selected frame moves, including over its children. Double-click or the
  element list selects a child. This gives the largest target but changes selection.

All drafts preserve a visible frame selection, numeric size controls, eight-pixel
pointer snapping, one-pixel keyboard movement/resize, Shift for eight pixels, Escape
cancellation and one history entry per completed gesture. Undo, Redo and Reset work
in memory. Child selection and numeric input are interactive. The shared outline
moves immediately while the simulated content waits for the selected delay. No
continuous CSS animation runs. Review links use the requested dark theme and existing editor colour tokens.
The lab also checks compatibility with its inherited light-theme tokens; no new
theme design is selected.

## Scope and limits

This is an isolated manipulation comparison, not a replacement editor layout.
Production Source navigation, Apply/Cancel transactions, Test in Ren'Py, SDK
lifecycle and project ownership remain outside the sample. Existing production
capabilities are neither removed nor reimplemented here. Only the production
capture-preservation bug fix is selected before design approval.

The Help panel is fictional HTML, not a Ren'Py image. The delay control simulates
content arrival after input stops; it is not helper throughput or presentation
measurement. Resize uses a fixed top-left corner and bounded sample dimensions;
production alignment/anchor semantics still apply to any later integration.
Double-click hit testing is approximate sample geometry. Zoom is Fit only.
There are no disk writes, native requests, runtime execution or source parsing.

## Review status

All three revisions remain drafts in `approval.json`. The focused module check
covers 24 variant/state/theme/viewport combinations, with gesture cancellation,
commit/history, keyboard movement/resize, numeric size, child selection and reload
checks at wide and compact sizes. Captures are retained in ignored
`.toolchains/design-lab/pages/canvas-drag/`. The first compact check exposed an
intrinsic grid-width overflow; the corrected grid passes. Product native acceptance
and the full ticket remain pending.

Before production integration, obtain the exact variant decision, preserve the
reviewed source/captures and follow [Design integration](../../../app/design-lab/INTEGRATION.md).
The existing pinned flow-v1 approval remains unchanged.
