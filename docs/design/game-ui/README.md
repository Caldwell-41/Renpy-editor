# Game UI workspace layout study

This Design Lab screen, `game-ui`, mocks layouts of the Game UI workspace for
[Lay out the Game UI workspace](https://github.com/Caldwell-41/Renpy-editor/issues/197).
The first round has three layouts: 1, 2 and 3. On 2026-11-17 Kris said he likes
layout 1 the most and asked for a second round: A, B and C. All are unapproved
drafts, and the [approval record](approval.json) lists each revision with no approval.

Scope comes from [Set the destination and scope of Game UI](https://github.com/Caldwell-41/Renpy-editor/issues/192):
one workspace with settings pages and a detailed level, stock screens first, no Apply
button, themes and templates.

## Open it

From `app/`, run `npm run design:dev`, then open
`http://127.0.0.1:5174/preview.html?screen=game-ui&variant=refined&state=dialogue&theme=dark`.
The `variant` values are `refined` (A), `blend` (B), `council` (C), `pages` (1),
`click` (2) and `board` (3). The Layout menu in the dashed bar at the top also switches between them. The preview fills the browser window, so a wide window shows the layouts at
their real proportions.

| State | What it opens on |
| --- | --- |
| `dialogue` | The Dialogue box settings page |
| `title` | The Title screen and its four templates |
| `themes` | The place where themes sit in that layout |
| `detailed` | The detailed level on the Title screen, with Menu buttons selected |

## Second round

### A · Layout 1, refined

Layout 1's skeleton after a pass with Kris's experience-first principle: every
control has to justify its place, and the loop of picking a screen, changing it and
seeing it gets shorter. The pass removes more than it adds.

| Change | Reason |
| --- | --- |
| The toolbar above the canvas is gone. The screen's name sits in the panel head. | The list already shows which screen is open. The canvas gains the height. |
| Sample content is one row under the canvas. The footnote is gone, and the status bar confirms that a sample change leaves the game unchanged. | One place for sample content, with no standing explanation. |
| The four template pictures become one row that names the template in use and opens a sheet of large live pictures. | An author picks a template once and changes settings often. Every Dialogue box setting now fits without scrolling at 720 px. |
| The six screens with no settings page sit under one closed "Other screens" row. The marker icons are gone. | Ten pages, the game-wide look and the author's own screens are what an author opens. |
| A screen with no settings page opens on its elements. The "no settings page yet" message is gone. | No dead end. |
| A click on the canvas outlines the part and highlights its settings. That group then shows "Edit element". | The way into the detailed level appears where the author is looking. The double-click still works, and the Settings / Elements switch stays. |
| At the detailed level, an "Element" menu replaces the element list. | The canvas is the main way to pick an element, and its properties start at the top of the panel. |
| Theme tiles lose their second line of text. "Reset" becomes a text button. | Less to read. |

### B · Recommended blend

The agent's recommendation. It starts from A and takes one idea from each of the
other first-round layouts.

- From layout 2: no Settings / Elements switch. With nothing selected, the panel shows
  the whole settings page. A click on a part of the canvas narrows the panel to that
  part, a drag moves it, and "All properties" opens under its plain settings. A group
  heading has an arrow that selects its part, and "All elements" at the foot of the
  page is the optional element list.
- From layout 3: the "Game-wide look" page shows the board of every screen, so a theme
  change redraws all of them at once.
- "Add element" sits in the panel head. "Try it" is left out until someone has measured
  whether the hidden process can answer the pointer.

On 2026-11-17 Kris chose B and asked for no template strip under the canvas, because
templates do not need to be in view at all times. B then gained three things that no
other ticket owned:

- Fit and 100% for the canvas, at the right of the row under it. At 100% the canvas
  scrolls.
- A collapse control on the screen list and on the settings panel. Collapsed, each is
  a thin column with the control that restores it, and focus stays on that control.
- The narrow window. Below 900 px the list starts collapsed. At 700 px or less the
  panel sits under the canvas, and the header hides the project name and shortens the
  save state.

### C · Council blend

A subagent built C with the council skill. It asked three models which combination of
layouts 1, 2 and 3 best meets the criteria, then decided part by part before it read A
or B. The delegates were Claude Opus 5.5, GPT-6.1 Sol and Claude Fable 5.2. All three
chose layout 1 as the base. Opus and Sol then reviewed the built layout, each scored
it 8 out of 10, and C took the changes they asked for.

| Part | Comes from | Reason |
| --- | --- | --- |
| List of screens | Layout 1 | A grouped text list shows all 17 entries with no scrolling, and a name is faster to find than a small picture. The marker for a screen with no settings page stays. |
| Screen canvas | Layout 1 | One canvas in the centre at both levels. It stays in the same place on every screen. Beside a list and a panel the canvas is limited by its width, so the height under it is free. |
| Settings page | Layout 1, with layout 2's click | Every group of the screen sits in the panel. A click on an element outlines it and marks its group. An element with no plain settings says so. |
| Way into the detailed level | Layout 1, with parts of layouts 2 and 3 | The Settings / Elements switch and the double-click stay. Escape returns to Settings, as in layout 3. The element carries across the switch in both directions. The panel then shows one element, as in layout 2: its plain settings, then its position. |
| Themes | Layout 1 | "Game-wide look" is the first page in the list, and its canvas shows four screens. Four large pictures show a font or a border better than seventeen small ones. |
| Templates | Layout 3 | A strip of live pictures under the canvas, at both levels. It uses the free height, and the settings start at the top of the panel. The strip's row stays empty on a screen with no templates. |
| Header actions | All three | The shell header, unchanged. |
| Sample content | Layout 1 | Menus above the canvas, labelled "Sample". The status bar confirms that a sample change leaves the game unchanged. |

Two parts are new. At the detailed level the element list is a menu behind the
selected element's name, with "Add" beside it, so the list is never always in view and
the properties start at the top of the panel. A screen with no settings page opens at
the detailed level with Settings switched off, so the "no settings page yet" page is
gone.

C leaves out the picture strip of screens, the board of screens, the Theme button and
its sheet, "Try it", the "Edit elements" bar with "Done", "Parts of this screen", the
single "Sample" menu and the theme descriptions. The "Button states" control leaves
the element panel. The button state is sample content, so every screen that draws it
lists a Button menu with the other sample menus.

Undo on the screen in view keeps the level and the selected element. In the other
layouts Undo clears the selection.

The delegates disagreed on three parts. Fable wanted layout 3's board on the
"Game-wide look" page, and Opus and Sol wanted the four screens. Opus wanted the
template tiles to stay in the panel, and Sol and Fable wanted the strip. Sol wanted
the sample controls in a row under the canvas and an "Edit elements" button, and Opus
and Fable wanted the menus above the canvas and the switch. C does not take Sol's
collapsing screen list or zoom controls. The canvas is about 574 px wide in an
1100 px window, which is the cost of keeping the list in view.

## First round: layouts 1, 2 and 3

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

Run it once for each layout. Retire the module when the layout is chosen.
