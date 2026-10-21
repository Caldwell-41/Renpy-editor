# Screens prototype comparison

The current comparison has three unapproved drafts. The user asked to keep Screen
notebook, remove the previous workbench/canvas/original notebook, and build two
research-informed alternatives. The retired layouts are removed from the selector
and source files. Git and the
[owning task](../../tasks/active/phase-3-initial-wysiwyg-release.md#screens-research-and-three-candidate-refresh--2026-10-21)
retain their history and evidence. This is a browser prototype, with fictional data
and changes that reset on reload.

- [Screen notebook](http://127.0.0.1:5174/?screen=screens&variant=guided-v2) keeps the
  preferred left-hand Elements, Position & look and Buttons & story notebook beside
  the preview. It adds help for Elements, each item and the selected element type.
- [Canvas focus](http://127.0.0.1:5174/?screen=screens&variant=direct) starts with a
  wide canvas and short selection commands. Elements opens the list; Add element
  opens its insertion controls. Double-clicking a list row opens its editing panel
  and reserves space beside the preview. Closing that panel keeps drafts. Try story
  opens the separate story example. Removal stays inside the Elements panel.
- [Screen builder](http://127.0.0.1:5174/?screen=screens&variant=flow) puts a Choose /
  Design / Connect rail above a persistent preview. One task card sits on the right.
  Choose reuses Screen notebook's nested element list, with a small type icon and
  hover/focus help on each row. Click selects; double-click or Enter opens Design.
  Drag rows to reorder within their group. Position & size includes Depth beside
  the horizontal and vertical position controls. Connect names the selected element,
  shows its type in smaller text, and explains its available actions. The rail allows returning to any step.

## Research and design choices

The explicitly requested research subagent inspected the official UI images below.
The full layouts are Loomlight proposals; the table distinguishes observed details
from the choices those observations informed. Loomlight keeps its fonts, colors,
icons and app shell. No external app assets or code were copied.

| Official source and inspected image | Observed UI | Choice in this comparison |
| --- | --- | --- |
| [Penpot interface tour](https://help.penpot.app/user-guide/first-steps/the-interface/) and [workspace image](https://help.penpot.app/img/interface/workspace-dark.webp) | Compact floating tools, selection outline/handles, Design / Prototype / Inspect tabs | Canvas focus separates short selection commands from optional detailed editing. |
| [Unity UI Builder overview](https://docs.unity.com/en-us/engine/6000.3/manual/uitoolkits/uielements/uibuilder/uib-interface-overview) and [window image](https://docs.unity.com/api/media?file=/engine/6000.3/media/images/UIBuilderAnnotatedMainWindow.png) | Named selection, a small object toolbar, icon-and-label library tiles, stable Fit/zoom/preview tools | Canvas focus keeps view controls stable. Screen builder initially tried tiles; the user then selected the notebook's nested list with type icons. |
| [Godot theme editor](https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_theme_editor.html) and [picker image](https://docs.godotengine.org/en/stable/_images/theme_preview_picker.webp) | Picker highlights and names the pointed-at element; preview shows control states | Element help identifies purpose, with sample button states available in Connect. |

Experience First favors the select, edit and see-result loop. Detailed forms reserve
space beside the game instead of covering the selected item. Add and selection are
visible entry points. Advanced settings stay in disclosures. The retained notebook
receives small refinements; the alternatives change structure and workflow. All three
reuse the same fictional editing actions so their behavior is comparable.

## Shared controls

Hover or focus an element in the list to learn what its type does. Indentation shows
its parent groups; rows follow group and sibling order. Each type has a small icon
using the production icon's stroke and size. Arrow keys browse without leaving that
list. The Elements heading and Add element type have `?` help.
Changing the type updates its description and help. Other help explains anchors,
shared looks, value bars, button actions, screen behavior and preview size. Click,
hover or focus a help control to read it; Escape closes it.

Click a list row to select it without leaving the list. Double-click or Enter opens
Design. A preview click also opens editing. Apply changes keeps its draft; Cancel changes
restores its previous values. Shared headings ask which screens should change. Undo
reverses one accepted change. Unfinished drafts survive selection, screen changes,
focus mode and resizing. Invalid values or a changed script retain the draft.

Drag any element to select and move it on the first press. Drag its eight edge and
corner handles to resize it; Shift-drag also resizes from the bottom right. Images
keep their proportions when that option is checked. Resizing keeps the opposite
edges fixed, including with centered anchors and fractional positions. Pointer
changes snap to 8 game pixels and stop at a minimum size of 24×24. Focus a handle
and use arrows for one-pixel changes, or Shift for eight. Escape cancels a drag;
Undo reverses a completed move or resize. Moving a group moves its contents.
The Help examples use a free layout group so individual items can move. Automatic
groups still arrange their children; their handles allow resizing, while movement
requires changing item order, moving the group or choosing a free layout parent.

Drag list rows before or after an item in the same group. A line marks the drop
position; Escape or dropping outside cancels. Single clicks retain the list, and
Undo/Redo restores accepted order changes. A drop at the current position adds no
Undo entry. Finish or cancel pending edits before reordering. Root and protected
template order cannot change. Use Inside group in Design to change an item's parent.
Alt + Up/Down reorders the focused row by one place.

Position & size includes Depth after horizontal/vertical position. Bring forward and
Send backward move an element one place within its parent group. Depth changes take
effect immediately; the section stays open and Undo restores the previous order.
Later siblings cover earlier ones where they overlap. Groups keep their children
together. Selection does not alter draw order. In a vertical, horizontal or grid
group, these controls change item order. Automatic reflow is simplified in this demo.
Ren'Py's screen-level `zorder` controls whole screens separately; see the
[screen statement](https://www.renpy.org/doc/html/screens.html#screen-statement).

Drag the divider toward the editing panel for a wider preview, or drag the bottom
border for height. The corner changes both. Focus a border and use arrow keys;
Shift uses larger changes. Escape cancels a drag. These change the editor workspace,
keep drafts and add no source Undo entry. Game size is separate. Fit shows the game
rectangle; 75% and 100% allow scrolling at game pixel sizes. Focus preview hides
editing controls. Escape or Back to editing restores them. Compact layouts put the
preview first and keep controls reachable by scrolling.

Change preview values edits example variables shown in text and value bars. Button
appearance affects buttons only. These controls stay open while values change.
Test opening and closing distinguishes an overlay that stays open during dialogue
from a dialog that pauses the story. Continue dialogue advances the example text.
Close and Escape dismiss both screens. Clicking outside leaves them open. A dialog
continues once after dismissal. These are browser examples; Test in Ren'Py explains
that it does not launch the game. Canvas buttons select elements;
they do not run game actions. Required dialogue, choice, menu, navigation, preferences
and save/load controls remain protected while their appearance can be edited.

## Simulation limits and review state

All actions, source examples, file choices and changes use browser memory. No save,
import, model request or Ren'Py process runs. Source examples illustrate the intended
code; they are not serializer output. Images, fonts, containers, scrolling, styles,
components and button states are simplified. Components have no parameters. Native
rendering, source preservation, asset discovery, Story Beats and durable editing need
separate product integration and evidence under the selected task.

The element-list refinement is ready for review. Final combined local4 passes
TypeScript, approval/source checks, all 508 rendering cases and 20 interaction groups
on Chromium 155.0.8059.86, with no browser errors. It includes all three Screens
journeys, real pointer dragging, double-click Design, Depth controls, Undo/Redo,
cancellation and guards. Visual review covers both themes at 1100×720 and 560×640.
All 12 final matrix captures and the held-drag/compact-Depth images match the reviewed
local3 set. Evidence remains ignored under `.toolchains/phase3b/reorder-combined-04/`.
The owning [task record](../../tasks/active/phase-3-initial-wysiwyg-release.md#element-list-reordering-and-opening-design-2026-10-21)
retains failures, the keyboard-selection repair and source identity. Final use is
reorder local4/4; no check or repair remains pending. Earlier allowances stay closed.
No native or CI work is selected for this browser change.
The separate source/runtime proof remains
qualified at `0ef174877cbe5ae3fd883afb92940de68916b04a` in CI run `39555526201`.
No later browser commit replaces that proof. No native or CI check is selected here.

Current draft identities are `guided-v2`, `direct-v1` and `flow-v1`. Every approval
is null. Promotion follows explicit selection and the existing
[integration procedure](../../../app/design-lab/INTEGRATION.md). Work remains local;
the prior push rejection still needs explicit authorization before publication.

Run the lab from `app/` with `npm run design:dev`. The targeted Screens check and
combined `design:check` own browser verification; screenshots and reports remain
ignored under `.toolchains/`. Keep all prototype code outside production inputs.
