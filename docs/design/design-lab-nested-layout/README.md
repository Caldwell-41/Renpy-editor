# Nested layout proposals

Three variants ask how to edit a nested layout while keeping parent constraints,
clipping, hierarchy and accepted Source understandable. They extend the existing
Screens shell for [L04 #42](https://github.com/Caldwell-41/Renpy-editor/issues/42).
All three remain unapproved. Existing flow-v1, C5 Help composition and A2 numeric
inspector approvals retain their scope.

- A, Focused inspector, keeps the canvas beside one task panel. Choose opens the
  hierarchy; Design opens the selected element. The selection path stays visible.
- B, Hierarchy worksheet, keeps the outline on the left, the canvas at upper right
  and selected layout fields beneath it. More scrolling buys persistent context.
- C, Source split, keeps accepted Source on the right and the canvas plus layout
  fields on the left. Clicking a source statement selects its element.

Each variant has the same fictional Help composition, controls and draft behavior.
The bottom arrows switch variants through the URL. Left/Right also switch when a
text field, select or editable region does not have focus. Reload and Reset clear
all changes. Use the dark theme for the intended design; the lab also checks its
standard light-theme comparison cases.

## Review route

Start the lab from `app/` with `npm run design:dev`. Open these direct previews:

- [A, Focused inspector](http://127.0.0.1:5174/preview.html?screen=nested-layout&variant=focused&state=nested&theme=dark&viewport=wide)
- [B, Hierarchy worksheet](http://127.0.0.1:5174/preview.html?screen=nested-layout&variant=worksheet&state=nested&theme=dark&viewport=wide)
- [C, Source split](http://127.0.0.1:5174/preview.html?screen=nested-layout&variant=source-led&state=nested&theme=dark&viewport=wide)

Try changing Grid columns to 3 and Apply, then Undo/Redo. Select a cell and Move
later. Select Viewport and reduce its height. Add a horizontal group inside the
vertical group, or try adding a second child to Window. Edit text, select another
element and return to see the retained draft. The Source-only sample exposes a
height expression and refuses to depict its viewport. The conflict sample retains
input when Apply refuses.

## Behavior and limits

The implementation coordinator proposed this bounded subset after inspecting the
pinned SDK. It still needs production and SDK qualification:

- Window, frame and viewport accept one direct child, including an initially empty
  container. Add a group inside them to hold several children.
- Horizontal and vertical groups own their respective placement axes. Grid owns
  cell placement. Order changes stay within the same parent and keep groups together.
- Grid uses positive literal row/column counts up to 64 in this prototype. It fills
  across rows in source order, with `allow_underfull True`. Empty cells are allowed.
  Shrinking below the existing child count refuses and retains the draft. New grids
  start empty at 2 by 2. Alternative fill directions remain in Source.
- Width and height use whole pixels, 1 through 16384. Padding on window/frame and
  spacing on horizontal/vertical groups and grid use 0 through 16384 pixels.
- Viewport illustrates stationary clipping of one child at the top-left. Wheel,
  drag, keyboard scrolling, scrollbars, bindings, offsets and child-size expressions
  remain in Source. There are no simulated scrolling controls.
- Apply accepts one sample history entry; no-op Apply adds none. Cancel restores
  accepted values. Invalid input and conflicts retain drafts. Selection retains
  each element's draft. Reorder and history require pending edits to be resolved.
- Source selection and hierarchy selection identify the same item. The custom
  footer remains a Source-only neighboring region; structural moves cannot cross it.
  Canvas buttons select elements and never invoke game actions.

The HTML canvas is a schematic, not a Ren'Py render. It illustrates layout and
clipping without proving dimensions, fonts, style inheritance or actual SDK behavior.
Source is generated fictional text in browser memory, not a lossless source patch.
No project files, persistence, native operations, SDK processes or model calls occur.
Source refresh is a simulation and requires cancelling retained drafts first.

The existing paired numeric position/anchor/size-limit inspector is represented by
an explicit disclosure rather than duplicated. Existing Connect and removal flows
are outside this comparison. This does not authorize replacing their controls.
The final implementation must reuse their approved behaviors and existing services.

The local prototype branch owns only this screen, its registry entry and these
notes. Production, tests, contracts, status and issue execution records belong to
the implementation chat. No prototype is promoted until Kris explicitly selects a
variant and revision. Approval must pin source identity and retained captures under
Design Lab INTEGRATION before the final handoff.
