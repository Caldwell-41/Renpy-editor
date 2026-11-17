# Game UI workspace layout study

This Design Lab screen, `game-ui`, mocks layouts of the Game UI workspace for
[Lay out the Game UI workspace](https://github.com/Caldwell-41/Renpy-editor/issues/197).
The first round has three layouts: 1, 2 and 3. On 2026-11-17 Kris said he likes
layout 1 the most and asked for a second round: A, B and C.

Kris approved layout B on 2026-11-17: `game-ui` / `blend`, revision `blend-v1`, source
commit `d83c8c5b`. The [approval record](approval.json) sets `currentApproved` to
`blend-v1` and lists the agreed behaviour and the known deviations. A, C, 1, 2 and 3
stay in the lab as unapproved drafts. The approved captures are under
[captures](captures/). Three more show the source line of a setting
(`blend-v1-what-this-writes-dark-wide.png`), the list of pending lines
(`blend-v1-changes-dark-wide.png`) and both panels collapsed
(`blend-v1-panels-collapsed-dark-wide.png`).

Scope comes from [Set the destination and scope of Game UI](https://github.com/Caldwell-41/Renpy-editor/issues/192):
one workspace with settings pages and a detailed level, stock screens first, no Apply
button, themes and templates.

## Open it

From `app/`, run `npm run design:dev`, then open
`http://127.0.0.1:5174/preview.html?screen=game-ui&variant=blend-v2&state=dialogue&theme=dark`.
The `variant` values are `blend-v2` (B after the council review), `blend` (B as
approved), `refined` (A), `council` (C), `pages` (1),
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
- A collapse control for the screen list and for the settings panel. A collapsed
  panel takes no width, and focus stays on its control. Kris disliked the first
  version (a boxed panel icon and a 34 px bar), so the mock now offers two: a chevron
  tab on the panel's edge, and a button at each end of the row under the canvas. The
  "Collapse control" menu in the dashed bar switches between them.
- The narrow window. Below 900 px the list starts collapsed. At 700 px or less the
  panel sits under the canvas, and the header hides the project name and shortens the
  save state.

B also shows the source behind a setting, in two places that Kris chose on 2026-11-17.
Neither adds anything to the layout at rest.

- A setting's label opens the line it writes, under the row: the file, the line
  number, the saved line and the new line. A right-click on the row does the same.
  The sheet names side effects, such as the 34 pictures that the accent color redraws.
  "Open in Source" goes to that line.
- The header's unsaved count is a button. It lists every line that differs from the
  saved project, grouped by file, each with Revert. Save writes exactly that list, and
  the count is the number of lines, not the number of edits. This list depends on
  [Decide when Game UI writes source](https://github.com/Caldwell-41/Renpy-editor/issues/200)
  choosing one workspace Save. If each edit writes at once, it has nothing to show.

The file names, variable names and line numbers in both are sample values.

### B, revision 2: the council review

After the approval, Kris asked for a council review of layout B against his
requirements and his experience-first principle, with a target score of 9.5, two
rounds, and his say on any major change or new feature. The lab pins the approved
source, so the work continues as a draft, `game-ui` / `blend-v2`, revision `blend-v2`.
`blend-v1` stays the approved revision until Kris approves this one.

| Reviewer | Round 1 | Round 2 | Round 3 |
| --- | --- | --- | --- |
| Claude Opus 5.5 (`xhigh`) | 7.8/10 | 8.8/10 | 9.1/10 |
| GPT-6.1 Sol (`xhigh`) | 8.3/10 | 9.0/10 | 9.3/10 |
| Claude Fable 5.2 (medium) | 8.3/10 | 9.0/10 | 9.2/10 |

Kris set two rounds and then asked for a third. Rounds two and three found only polish,
and every finding is fixed. No reviewer has scored the layout after the round three
fixes. The measured score is 9.2, the mean of round three, and not 9.5.

Changes Kris approved after round one:

- A setting that follows the game-wide look always shows its real control at the
  inherited value, with a joined chain in a muted color. The first change gives the
  screen its own value. An open chain in the accent color then returns it.
- A Text or Button element that the author added has one "Text" field, and the element
  is named by its words.
- "All elements" is also at the foot of a selected element's panel. It starts closed
  and stays as the author left it.
- A checkbox row has a small source button that shows on the pointer and on focus.

Polish from both rounds:

- **The canvas and the panel agree.** Selecting the continue arrow, the speaker's
  picture or the menu panel shows the setting that switches it on or off, labelled
  "Show on screen". The list marks an element that a setting has hidden. One element
  has one name everywhere.
- **Elements that another screen owns.** The dialogue box behind Choices says "This is
  part of Dialogue box" with a button that opens it there. It has no handles and does
  not move. Its name tag names the owner.
- **Finding an element.** A settings heading selects its element. Pointing at the
  heading, a list row or a checkbox outlines the element. The element under the pointer
  and the selected element show a name tag. The selection is a white line with a dark
  line outside it, so it shows on a game of any color.
- **The selected element's panel.** The header says the name once and keeps "Add
  element". "All properties" holds one "Offset" row, and an element with no plain
  settings shows it at once. A new element says where its look comes from.
- **The canvas block.** The sample row and the zoom sit directly under the canvas. With
  both panels hidden the row names the screen. At 100% the canvas shows the selected
  element, from its top left corner when it is larger than the view. The Character
  sample has a long name.
- **Templates and themes.** The sheet is titled "Template", says what a template
  replaces and closes on a choice. The theme note names the screens that keep their own
  values. The board groups the screens as the list does and has no caption.
- **The list of pending lines.** A template line and an added element are named in
  plain words, an added line shows "+", and Revert takes back one element.
- **Behaviour.** Undo on the screen in view keeps the selection. A move starts after
  five pixels on the display. A new element lands in the upper right, a step from the
  last one. A three-option switch beside a chain fits its words.
- **Narrow window.** The template row scrolls with the settings, its sheet opens over
  the panel, and the sample row stays on one line.
- **Removed.** The "Reset" row, the second "Button states" control, the note under
  "Other screens", and collapse control 2, which Kris rejected.

Polish from round three:

- **The selected element's header** has two lines at every name: the way back with
  "Add element", then the name. The kind is in the element list, which now shows it on
  every row.
- **New elements.** Each one keeps the place it got when it was made, under the lowest
  one already added, so two never overlap and Revert of one leaves the others in place.
  Added text is at most 40% of the canvas wide. A Text element's field grows to three
  lines.
- **The list of pending lines** shows one template or theme choice as one edit with
  its lines under it and one Revert. The header counts edits, and the list's title
  counts lines. This changes the approved rule that the count is the number of lines.
- **The joined chain** names the setting it follows, such as "Boxes" under Colors, and
  opens as soon as the author starts to change the value.
- **The name tag** hangs from the element's right corner when it would pass the canvas
  edge.
- **The template sheet** says what a template replaces above the pictures. In the
  narrow window it uses the whole panel. Kris then cut "Undo brings them back" from
  that line.
- **Smaller things.** "All elements" also shows for an element that another screen
  owns. The status line returns to "Ready" on another screen. The 100% view
  styles its scroll bars so that they stay in view. The check browser hides scroll
  bars, so nobody has seen this work. The narrow sample row drops the word "Sample".

Declined: a neutral Save button, because the header is the shared approved shell
header; zoom with the mouse wheel, as scope; typing on the canvas with a double-click,
because Kris chose the Text field only.

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
