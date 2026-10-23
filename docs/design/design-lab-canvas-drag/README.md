# Canvas drag alternatives

The selected move-handle direction and two alternative drafts for [L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36),
after the [capture-loss diagnosis](../../tasks/evidence/canvas-rendering.md#probe-movement-bounds-and-drag-diagnosis).
They compare how to grab the bounded Help frame and distinguish immediate draft
guides from delayed content. They do not replace the approved flow-v1 reference.

Open the Design Lab on port 5174, then use these direct previews:

- [Move handle](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=handle&state=delayed&theme=dark&viewport=wide).
  A four-direction icon and label identify the movable frame. Content remains available for
  single-click child selection. Recommended because it addresses the unclear target
  without changing nested selection. The handle stays 30 CSS pixels tall at Fit, 50% and 100% zoom, and moves inside the frame at the top edge. The visible panel follows draft movement immediately and stays in place while confirmation arrives. Release retains handle focus for keyboard adjustment.
- [Drag border](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=border&state=delayed&theme=dark&viewport=wide).
  The selected frame's border is the drag target. Content still selects children.
  This adds less chrome, but requires aiming at the edge, especially at small zoom.
- [Drag selected frame](http://127.0.0.1:5174/preview.html?screen=canvas-drag&variant=body&state=delayed&theme=dark&viewport=wide).
  The entire selected frame moves, including over its children. Double-click or the
  element list selects a child. This gives the largest target but changes selection.

All drafts preserve a visible frame selection, numeric size controls, eight-pixel
pointer snapping, one-pixel keyboard movement/resize, Shift for eight pixels, Escape
cancellation and one history entry per completed gesture. Undo, Redo and Reset work
in memory. Child selection and numeric input are interactive. The move-handle draft translates the visible panel and child-selection targets immediately; its size/layout confirmation remains delayed. The other alternatives keep immediate outlines and delayed content. No
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
content confirmation after input stops; it is not helper throughput or presentation
measurement. Resize uses a fixed top-left corner and bounded sample dimensions;
production alignment/anchor semantics still apply to any later integration.
Double-click hit testing is approximate sample geometry. The move-handle draft offers Fit, 50% and 100% zoom to inspect handle sizing. The other alternatives remain Fit only.
There are no disk writes, native requests, runtime execution or source parsing.

## Review status

The user selected the move-handle direction and requested these refinements before integration. `handle-v2` is approved as of 2026-10-24. Its approval record pins source `6e7bb1a`, the fingerprint and four hashed dark captures at wide/compact sizes. Production integration remains pending. The earlier `handle-v1` source remains in commit `e9b5fc1`. The focused module check
covers 24 variant/state/theme/viewport combinations, with gesture cancellation,
commit/history, keyboard movement/resize, numeric size, child selection and reload
checks at wide and compact sizes. Captures are retained in ignored
`.toolchains/design-lab/pages/canvas-drag/`. The first compact check exposed an
intrinsic grid-width overflow; the corrected grid passes. The full lab runner refuses the existing flow-v1 reference because this checkout
no longer matches its pinned source. Its approval lock is preserved; the full check
is incomplete. Approval-record validation and the separate production-build exclusion
assertion pass. Product native acceptance and the full ticket remain pending.

For production integration, use the approved `handle-v2` source/captures and follow [Design integration](../../../app/design-lab/INTEGRATION.md).
The existing pinned flow-v1 approval remains unchanged.
