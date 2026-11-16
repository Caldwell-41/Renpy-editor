# Game UI workspace layout study

This Design Lab screen, `game-ui`, mocks three layouts of the Game UI workspace for
[Lay out the Game UI workspace](https://github.com/Caldwell-41/Renpy-editor/issues/197).
All three are unapproved drafts. The [approval record](approval.json) lists
`pages-v1`, `click-v1` and `board-v1` with no approval.

Scope comes from [Set the destination and scope of Game UI](https://github.com/Caldwell-41/Renpy-editor/issues/192):
one workspace with settings pages and a detailed level, stock screens first, no Apply
button, themes and templates.

## Open it

From `app/`, run `npm run design:dev`, then open
`http://127.0.0.1:5174/preview.html?screen=game-ui&variant=pages&state=dialogue&theme=dark`.
Change `variant` to `click` or `board`, or use the Layout menu in the dashed bar at
the top. The preview fills the browser window, so a wide window shows the layouts at
their real proportions.

| State | What it opens on |
| --- | --- |
| `dialogue` | The Dialogue box settings page |
| `title` | The Title screen and its four templates |
| `themes` | The place where themes sit in that layout |
| `detailed` | The detailed level on the Title screen, with Menu buttons selected |

## The three layouts

| Part | 1 · Pages and panel | 2 · Click the game | 3 · Whole-game board |
| --- | --- | --- | --- |
| List of screens | Text list on the left, grouped by where the player meets each screen | Strip of live pictures under the canvas | A board of live pictures is the workspace's first view. One screen then opens in focus, with Previous and Next. |
| Screen canvas | Centre, between the list and the panel | Centre, the largest of the three | Board first, then a large canvas |
| Settings page | Right panel, every group of the screen at once | Right panel shows only the part the author clicked. With nothing selected it shows the template, screen-wide toggles and the list of parts. | Right panel, every group at once |
| Way into the detailed level | A Settings / Elements switch at the top of the panel, or a double-click on the canvas | No switch. Clicking a part selects it, a drag moves it, and "All properties" opens under its plain settings. | An "Edit elements" button changes the whole workspace until "Done" |
| Themes | On a "Game-wide look" page, first in the list. Its canvas shows four screens at once. | A Theme button in the toolbar, always in view, opens a sheet | A column beside the board. Every screen on the board redraws when the theme changes. |
| Templates | Picture tiles at the top of the settings page | Picture tiles in the panel when nothing is selected | A strip of live pictures under the canvas |
| Header actions | The shell header in all three: save state, Undo, Redo, Save, Validate, Run, Stop. Game UI adds no Save or Undo of its own. | Same, plus "Try it" in the toolbar | Same |
| Sample content | Menus in the toolbar above the canvas | Switches in a row under the canvas | One "Sample" menu in the toolbar |

Layout 2 has two extras. "Try it" makes the canvas behave like the game: buttons
react to the pointer and menu buttons open their screens. "Add element" is in the
toolbar at all times, because that layout has no separate detailed level.

## What works in the mock

- Every setting redraws the canvas and every picture of that screen at once. There is
  no Apply button.
- Each edit is one Undo step with a name, such as "Undo Dialogue box opacity". Undo
  returns to the page where the edit was made. The header counts unsaved changes and
  Save clears the count.
- A setting can follow the game-wide look ("Same as game-wide look") or take its own
  value. The chain button returns it to the game-wide look.
- Four themes and the templates for Dialogue box, Choices and Title screen apply in
  one step.
- At the detailed level, a click selects an element, a drag moves it, and the X and Y
  fields show how far it moved. "Add element" places a new element on the screen.
- Sample content (line length, character, backdrop, button state, save slots) changes
  the canvas and never counts as an edit.

## What is simulated

- A browser drawing stands in for the hidden Ren'Py process. The real canvas shows
  the project's own screens, so its speed and its failure states are not in this mock.
- The mock assumes one workspace Save. [Decide when Game UI writes source](https://github.com/Caldwell-41/Renpy-editor/issues/200)
  owns that choice.
- The settings on each page are examples. The real list for each page is still to be
  decided.
- Save, Validate and Run write a status message. "New screen" does the same, because
  visual starters are not in this mock.
- Box effects, image frames, per-state looks and animation are named but not drawn.
  They belong to [Design the detailed level on the screen canvas](https://github.com/Caldwell-41/Renpy-editor/issues/205).
- "Try it" is a proposal. Nobody has measured whether the hidden process can answer
  the pointer fast enough.
- The themes Lantern, Harbor and Paper are placeholders, not the Loomlight themes.
- The study targets a wide window. The 560 px compact size is not laid out.

## Changes from today's Screens designer

- Removed: the Choose / Design / Connect rail, the always-visible hierarchy, and Apply
  and Cancel on an element.
- Added: settings pages, themes, templates, a game-wide look that screens follow,
  sample content controls, and stock screens in the list.
- Changed: the element list becomes optional. It appears only at the detailed level
  (layouts 1 and 3) or as "Parts of this screen" (layout 2).
- Kept: the header Undo, Redo and Save, the workspace rail, and the 1 px stage edge.
  Button actions, text values and bar bindings stay in scope but are not drawn here.

## Focused check

```sh
npm run design:check -- game-ui pages --theme dark --interaction ./screens/game-ui/review-check.mjs
```

Run it once for each of `pages`, `click` and `board`. Retire the module when the
layout is chosen.
