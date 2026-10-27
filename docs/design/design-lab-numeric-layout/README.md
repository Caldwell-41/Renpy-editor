# Numeric layout comparison

[L03 #38](https://github.com/Caldwell-41/Renpy-editor/issues/38) owns implementation
and acceptance. These three Design Lab layouts are unapproved proposals for the
new numeric inspector. The existing flow-v1 and C5 approvals retain their scope.

- A, Paired sections, puts horizontal and vertical fields beside one another.
  Position, anchor, alignment and size stay visible. Size limits and padding expand.
- B, Axis worksheet, groups position, anchor, dimension and limits by axis.
  It exposes more fields at once and requires more vertical scrolling.
- C, Placement first, starts with alignment shortcuts and dimensions. Explicit
  position and anchor fields expand when needed.

Each variant has anchored-frame, parent-constrained text, group-spacing and source
conflict samples. Choose another element below the canvas. Enter applies the layout;
Escape cancels it. Apply saves one in-memory history entry. Invalid values and
conflicts retain the draft. Undo/Redo restore accepted sample values. Drafts remain
when selecting another sample element. Reload and Reset discard all sample changes.

Position units distinguish pixels from a fraction of the parent. Anchor units
distinguish pixels from a fraction of the element. Alignment shortcuts set position
and anchor together. The proposals preserve integer pixel dimensions. Empty size
limits mean inherited values. Padding appears for the frame; spacing appears for
the vertical group. A vertical group owns its children's vertical placement.

The canvas is a schematic HTML sample. Its drawing illustrates frame position,
anchor and dimensions. Padding, spacing, limits and text placement are form/source
samples, not SDK geometry proof. Source is generated fictional text in browser
memory. No project files, native APIs, SDK execution, game actions or persistence
are available. Existing composition, source editing, deliberate Ren'Py testing and
Connect behavior remain outside this inspector comparison.

Open the lab at `http://127.0.0.1:5174/`, select Numeric layout and compare A/B/C.
The implementation must still qualify the supported node/property matrix, preserve
source bytes through the shared transaction service and pass the production path
and pinned-SDK geometry checks in #38. No production component changed for these
proposals.
