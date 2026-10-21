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
  opens its insertion controls. Selecting an item opens its editing panel and
  reserves space beside the preview. Closing that panel keeps drafts. Try story
  opens the separate story example. Removal stays inside the Elements panel.
- [Screen builder](http://127.0.0.1:5174/?screen=screens&variant=flow) puts a Choose /
  Design / Connect rail above a persistent preview. One task card sits on the right.
  Choose prioritizes text, images and buttons before groups. Selecting an item opens
  its Design card. Front & back expands there. Connect shows button actions and the
  story example. The rail allows returning to any step at any time.

## Research and design choices

The explicitly requested research subagent inspected the official UI images below.
The full layouts are Loomlight proposals; the table distinguishes observed details
from the choices those observations informed. Loomlight keeps its fonts, colors,
icons and app shell. No external app assets or code were copied.

| Official source and inspected image | Observed UI | Choice in this comparison |
| --- | --- | --- |
| [Penpot interface tour](https://help.penpot.app/user-guide/first-steps/the-interface/) and [workspace image](https://help.penpot.app/img/interface/workspace-dark.webp) | Compact floating tools, selection outline/handles, Design / Prototype / Inspect tabs | Canvas focus separates short selection commands from optional detailed editing. |
| [Unity UI Builder overview](https://docs.unity.com/en-us/engine/6000.3/manual/uitoolkits/uielements/uibuilder/uib-interface-overview) and [window image](https://docs.unity.com/api/media?file=/engine/6000.3/media/images/UIBuilderAnnotatedMainWindow.png) | Named selection, a small object toolbar, icon-and-label library tiles, stable Fit/zoom/preview tools | Canvas focus keeps view controls stable; Screen builder uses named element tiles. |
| [Godot theme editor](https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_theme_editor.html) and [picker image](https://docs.godotengine.org/en/stable/_images/theme_preview_picker.webp) | Picker highlights and names the pointed-at element; preview shows control states | Element help identifies purpose, with sample button states available in Connect. |

Experience First favors the select, edit and see-result loop. Detailed forms reserve
space beside the game instead of covering the selected item. Add and selection are
visible entry points. Advanced settings stay in disclosures. The retained notebook
receives small refinements; the alternatives change structure and workflow. All three
reuse the same fictional editing actions so their behavior is comparable.

## Shared controls

Hover or focus an element in the list to learn what its type does. Arrow keys browse
without leaving that list. The Elements heading and Add element type have `?` help.
Changing the type updates its description and help. Other help explains anchors,
shared looks, value bars, button actions, screen behavior and preview size. Click,
hover or focus a help control to read it; Escape closes it.

Select an item in the preview or list. Apply changes keeps its draft; Cancel changes
restores its previous values. Shared headings ask which screens should change. Undo
reverses one accepted change. Unfinished drafts survive selection, screen changes,
focus mode and resizing. Invalid values or a changed script retain the draft.

Bring forward and Send backward move an element one place within its parent group.
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

The story example distinguishes an overlay that stays open during dialogue from a
dialog that pauses the story. Close and Escape dismiss both. Clicking outside leaves
them open. A dialog continues once after dismissal. Canvas buttons select elements;
they do not run game actions. Required dialogue, choice, menu, navigation, preferences
and save/load controls remain protected while their appearance can be edited.

## Simulation limits and review state

All actions, source examples, file choices and changes use browser memory. No save,
import, model request or Ren'Py process runs. Source examples illustrate the intended
code; they are not serializer output. Images, fonts, containers, scrolling, styles,
components and button states are simplified. Components have no parameters. Native
rendering, source preservation, asset discovery, Story Beats and durable editing need
separate product integration and evidence under the selected task.

The refresh is ready for review. Local4 passes all 60 focused Screens cases and
three complete journeys. Local5 passes TypeScript, approval/source checks, 508 lab
rendering cases and 20 check groups on Chromium 155.0.8059.86, with no browser
errors. Visual review covers both themes at 1100×720 and 560×640, plus the new
editing states. All 12 combined Screens captures match the reviewed focused set.
Reports and images remain ignored under `.toolchains/phase3b/refresh-focused-04/`
and `refresh-combined-05/`. The task owns source identity and final local5/6 use.
No repair or verification remains pending. Prior notebook refinement local4/4 and the original
comparison local11/11 stay historical. The separate source/runtime proof remains
qualified at `0ef174877cbe5ae3fd883afb92940de68916b04a` in CI run `39555526201`.
No later browser commit replaces that proof. No native or CI check is selected here.

Current draft identities are `guided-v2`, `direct-v1` and `flow-v1`. Every approval
is null. Promotion follows explicit selection and the existing
[integration procedure](../../../app/design-lab/INTEGRATION.md). Work remains local;
the prior push rejection still needs explicit authorization before publication.

Run the lab from `app/` with `npm run design:dev`. The targeted Screens check and
combined `design:check` own browser verification; screenshots and reports remain
ignored under `.toolchains/`. Keep all prototype code outside production inputs.
