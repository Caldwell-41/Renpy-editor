# Game UI detailed level study

This Design Lab screen, `game-ui-detail`, mocks direct work on elements on the screen
canvas for [Design the detailed level on the screen canvas](https://github.com/Caldwell-41/Renpy-editor/issues/205).
It sits on the approved layout B of Game UI (`game-ui` / `blend-v2`) and leaves that
mock's source untouched.

Kris approved mock D on 2026-11-23: `game-ui-detail` / `chosen`, revision `chosen-v1`,
source commit `04c7bb1f`. The [approval record](approval.json) lists the agreed
behaviour and the known deviations, and the approved captures are under
[captures](captures/), named `chosen-v1-` with the state, the theme and the size.
Mocks A, B and C stay in the lab as unapproved drafts.

On 2026-11-22 Kris looked at A, B and C and chose A with the states side by side. He
then answered ten questions with "yes to all". Mock D is that choice with those answers
built in, plus the changes after his first look and the council review below.

## Open it

From `app/`, run `npm run design:dev`, then open
`http://127.0.0.1:5174/preview.html?screen=game-ui-detail&variant=chosen&state=group&theme=dark`.
That is mock D, the chosen mix. The other `variant` values are `point` (A), `boxes` (B)
and `place` (C).

| State | What it opens on |
| --- | --- |
| `group` | The Title screen with the Menu buttons group selected |
| `button` | The Ticket stub with a button inside two boxes, and its actions |
| `text` | Text with variables |
| `bar` | A bar and its value |
| `source` | A part that Loomlight cannot edit |
| `box` | A box with "All properties" open |
| `screen` | The Ticket stub with nothing selected |

## The choices

A mock is a set of choices. The table has the first four. The fifth, "A look group",
came later and is described under "After Kris's first look at mock D". The dashed bar at the top changes one choice at a
time, so any mix can be tried. "Mock" then reads "Your mix".

| Choice | A · Point and change | B · Boxes first | C · Place it yourself |
| --- | --- | --- | --- |
| A click selects | What you point at: its group, then the element | The box first: each box from the outside in, then the group, then the element | As A |
| A drag in a row or column | Moves the element to a new place. A line shows where it lands. Dropped outside, it leaves the box. | Shifts the element by pixels. The Place row and the element list change its place. | As A |
| A new element | Lands by the selection: in the selected box, or after the selected element | Goes where the author clicks | As B |
| States | One at a time: a switch sets what the rows edit and what the canvas shows | Side by side: a table of every state | Differences from Idle: each state lists only what differs |

Mock D is A's click, drag and new-element choices with B's states side by side.

## Added in mock D

Kris agreed to each of these on 2026-11-22. They also show in A, B and C, because the
four mocks share one source.

- **The states table has four rows**: Text, Fill, Border and Shadow. A click on a cell
  opens its rows under the table. "Every state" then lists Border width, Corners and
  the hover animation, which have one value for all states.
- **Fill** is one color or fades to a second color, top to bottom or left to right.
- **Shadow** has a color, a blur and an offset. "Glow" sets the offset to 0.
- **Drawn or Image.** A box is Drawn from its box look or shows an image file. The
  stock Menu panel starts as Image. An Image box shows its file and has no fill,
  corners, border or shadow rows.
- **Bar.** One Corners value for the full bar. "The player can drag it" adds a Thumb row.
- **Pin.** A free element has a Pin with nine points under "All properties". Its
  Position measures from that point, so a centred title stays centred when its words
  change. A change of pin does not move the element.
- **Alignment guides.** In free space the outline snaps to the edges and the middle of
  the screen and of its neighbors, and a line shows what it snapped to.
- **Duplicate** is under "More commands" and on Ctrl+D or ⌘D. The copy goes after the
  original.
- **Handles.** A free element has handles on every edge and corner. In a row or column
  the handles are on the right and the bottom.
- **Delete** removes an element of a stock screen from the source, and Undo puts it
  back. An element that the game needs cannot be deleted. The sample screens have one
  such element, the Background.
- **Later version.** Selecting two or more elements.

### After Kris's first look at mock D

On 2026-11-22 Kris said that the two clicks are confusing, that the selected cell of
the states table turned dark brown, and that the white outline hides a glow or a
border. He asked for these changes:

- **A fifth choice, "A look group"**, in the dashed bar. Kris chose the third option
  on 2026-11-22 ("one click is the way"), and mock D starts on it.
  - *Two clicks.* The first click selects the look group, the second the element.
  - *Two clicks, with a hint.* The same, and the name tag says that a second click
    selects the one element.
  - *One click, switch in the panel.* A click selects the element that the pointer is
    on. The Look section has a switch, "This button" / "Menu buttons · 6", that sets
    what a look change applies to. It starts on the look group. It starts on the
    element when that element has an own value. This option changes one point of the
    shared-look decision: the first click no longer selects the look group.
- **Corner marks.** A look group has corner marks and no full outline. One frame of
  four marks goes around each run of neighbors in a row or column, so the six Menu
  buttons have one frame. The marks sit 6 pixels from the elements. Each mark is a
  light line over a wider dark line, so it shows on a dark game and on a white one.
  With the switch on the look group, the selected element also has its full outline.
- **The outline gives way.** While the pointer is over the Look section, or the
  keyboard is in it, the full outline, the handles and the name tag hide and corner
  marks stay. They return when the pointer is on the canvas.
- **The look switch fits.** "This button" keeps its width, and the name of the look
  group takes the rest and clips. A long element name clips in the panel head and on
  the name tag.
- **A light sample game.** The row under the canvas has "Sample: Game: Dark / Light".
  Light draws a white game, to judge the outlines and marks. It is sample content.
- **The selected cell keeps its color.** The dark brown was a defect of the mock: the
  lab's style for a pressed button replaced the cell's color.

### Council review of mock D

Kris asked for a council review of mock D on 2026-11-22: three delegates, two rounds,
a focus on the user experience, a target of 9.5, and his say on any major change.
Round one scored 8 (Claude Opus 5.5), 7 (GPT-6.2 Sol) and 7 (Claude Fable 5.2). No
delegate labelled a finding as a major change. These fixes followed round one:

- **Defects.** A text edit now ends on its own element when the author clicks a
  different element. An element that moves inside its row or column keeps its offset.
  A new element lands inside a selected Free box, or under a selected free element. A
  source-only part has its hatched outline again and no Move buttons. A cell of the
  states table counts as an own value when its second fill color is set. The chain
  commands and the rows of a cell scroll into view. The element list no longer
  overflows the panel.
- **What a look change reaches.** With the switch on the look group, the panel names
  the elements that have own values and keep them. Copy look and Paste look name their
  target, such as "Paste look to Menu buttons".
- **The state on the canvas.** While the canvas shows a state other than Idle, the row
  under it says so ("The marked buttons show Hover") with "Show Idle".
- **None, Add and Glow.** A setting with no value reads "None" and has "Add". The new
  value starts at a color that shows. Glow is also on a shadow that is None, takes the
  fill or the text color, and shows pressed while the offset is 0. Offset X and Y
  share one row.
- **The states table.** A cell shows its color at full strength. The dashed edge alone
  means that it follows.
- **The name tag and the handles.** In a column the name tag sits beside the element,
  so it does not cover the neighbor above. The handles sit outside the outline.
- **A drag out of a row or column** shows "Leaves Menu" on the outline before the drop.
  The status then says that the element left the box and its look group.
- **Density and words.** Number fields are 24 pixels high. A stock action is one row.
  A new selection starts at the top of the panel. A new text or button has the focus
  in its Text field, and a double click on a text or a button goes there too. "More
  commands" has heavier dots. "Background" replaces "Box" for Drawn or Image, "Hover
  animation" replaces "On hover", and "6 other screens" replaces "on 7 screens".

Kris answered two questions from round one on 2026-11-22:

- **An element that moves takes the look group of the place it lands in**, the same
  as a new element. A button that the author drags out of the Menu leaves the Menu
  buttons. Kris likes this behavior.
- **The hover animation "Glow" is now "Brighten".** "Glow" stays the name of a shadow
  with no offset. The hover animations are Lift, Grow and Brighten. This changes one
  name in the animation decision.

Round two reviewed the fixed mock at `92a969d8` and scored 8 (Claude Opus 5.5), 8
(GPT-6.2 Sol) and 8.5 (Claude Fable 5.2). Again no delegate labelled a finding as a
major change. These fixes followed round two:

- **Round-one fixes that did not work.** The "Leaves Menu" tag was 2 pixels high and
  now shows. A double click never reached the Text field and now does. A new fill
  started at the box color and now starts at the game's accent color.
- **Defects.** A box that holds a source-only part cannot be deleted or duplicated
  here. A click on a control is no longer lost when it ends a text edit. The direction
  of a fill that fades has its own value for each state. A new free element lands
  fully inside the screen or its box. Glow gives back the offset that the shadow had.
- **What a look change reaches.** The line about own values now sits by the open
  setting and names only the elements that keep that setting, such as "Board the tram
  keeps its own fill." The look switch stays in view while the Look section scrolls.
- **Glow.** It takes the first of the border, the fill and the text color that shows
  on the game. It sits on the Shadow row, so Blur has its full slider and the Offset
  row fits the panel.
- **The canvas.** Empty space and the fixed background clear the selection. The name
  tag sits under an element when the place above is taken. The key hint says "Arrows
  move one place" for an element in a row or column.
- **Words.** Enter ends the edit of a button's words, and Esc ends any text edit. Undo
  names say "text color" and "the text of". Delete, Paste look, "Use for all" and a
  drag into a box each leave a sentence in the status line.

No delegate has scored the mock after the round-two fixes. The last measured scores
are 8, 8 and 8.5, under the 9.5 target.

| Delegate | Round 1 | Round 2 |
| --- | --- | --- |
| Claude Opus 5.5 | 8/10 | 8/10 |
| GPT-6.2 Sol | 7/10 | 8/10 |
| Claude Fable 5.2 | 7/10 | 8.5/10 |

Known simplifications in mock D:

- The blur and the offset of a shadow have one value for all states. Only the shadow
  color differs between states. The box decision lets the full shadow differ.
- A color has no opacity control, because the browser's color control has none.
- Drawn or Image shows on one element, not on a look group.

## The same in every mock

Kris approved these rules on 2026-11-22.

**Selection**

- A group with one element here has no group step. The first click selects the element.
- With one member of a group selected, a click on another member selects that member.
- The outline on the pointer shows what the next click selects.
- Under the way back, the panel lists the boxes around the selection and its group.
  Each one is a link. Esc goes one step out and Enter goes one step in.
- A drag with a group selected takes the member under the pointer.

**Keyboard on the canvas**

- The canvas is one stop in the Tab order. With focus on it, Tab steps through the
  elements in source order and leaves the canvas after the last one.
- An arrow key moves a free element by 1 pixel, and by 10 with Shift. In a row or
  column it moves the element one place (A, C) or shifts it by pixels (B).
- Delete removes the selected element. The row under the canvas lists the keys while
  the canvas has focus.

**Moving and resizing**

- While the pointer moves, an outline follows it. The canvas draws the element again
  when it lands. This matches the measured speed of the hidden helper (105 to 177 ms
  for a frame).
- A free element has a Position from the top left of its box or of the screen. An
  element in a row or column has a Place ("2 of 6 in Menu") and an Offset.
- Text has one handle for its width and wraps. The other kinds take a width and a
  height. A picture keeps its shape from the corner handle. An empty size means the
  element fits its content.
- A Box arranges its elements as a Column or a Row, or leaves them Free, and has a Gap.
  A box with no background has no look until the author gives it one.

**Adding, deleting and reordering**

- A new element takes the group of its kind in the box it joins, so a button added to
  the Menu is one of the Menu buttons. Outside such a box it is in its screen's group.
- Delete is on the keyboard and under "More commands". A group cannot be deleted. The
  background and a source-only part cannot be deleted here.
- The element list is a tree in source order. The selected row has Move earlier and
  Move later. In free space a later element draws over an earlier one.

**Look**

- A group and an element show the settings of their kind, each with the chain. The
  open chain opens the two commands: "Same as (level above)" and "Use for all (level above)".
- Copy look and Paste look are under "More commands".
- **States.** Kris accepted this rule on the condition that an SDK run confirms it. The
  nearest level with an own value wins, and an own Idle value covers
  every state until that state gets an own value. So a button with an own Idle fill
  keeps that fill in Hover. A chain in a state names its source: "Same as Idle",
  "Same as Menu buttons" or "Same as buttons in the game".
- Border width, Corners and the hover animation are the same in every state.

**Behavior**

- Text and Button have a Text field with "Insert variable". The field shows `[name]`
  and the canvas shows the sample value.
- "When clicked" is the approved action editor with no Apply: ordered actions, one
  open at a time, and each change is one draft step.
- A stock button shows its action in words ("Starts the game") with Open in Source.
- A Bar has "Shows" (a whole-number variable) and "Full at".

**Parts that Loomlight cannot edit**

- A source-only part has a dashed, hatched outline and the tag "Source only". The
  panel shows its lines and Open in Source. It does not move and cannot be deleted
  here. The parts around it still move.
- One property that Loomlight cannot read shows as "Custom (in source)" with a link
  to Source. The Entrance of "Board the tram" is the example.

## Simulated, and not in this mock

- A browser drawing stands in for the frame from the hidden Ren'Py process. Nothing
  reads a project, writes source or runs Ren'Py.
- Only the Title screen and the Ticket stub open. Settings pages, the Game-wide look
  page, sample content menus, 100%, the source line of a setting and the list of
  pending edits are in the approved layout mock.
- Not shown: selecting several elements, the stretch areas of an image, an image for
  each state, and playing an animation.

## Open points, each with a new ticket

Kris agreed to a new ticket for each of these on 2026-11-22.

- **Missing evidence.** The states rule follows how the agent remembers Ren'Py's style
  lookup (an unprefixed property covers every state). No SDK run has checked it.
- **Missing evidence.** Showing a forced Hover, Selected or Disabled look without a
  pointer is M8 in the helper research and is unmeasured. The state names in the table
  depend on it.
- **Gap.** The approved action kinds are Set variable, Show screen, Hide screen and
  Finish. A new button on a stock menu cannot open a menu screen or start the game.
- **Example properties.** The properties in the mock are examples. The real list for
  each kind of element needs its own decision.

## Checks

`npm run design:check -- game-ui-detail <mock> --theme dark --interaction ./screens/game-ui-detail/review-check.mjs`
covers the group and element clicks, a group change and the chain commands, the
keyboard, a drag in a column, a new element, the states, actions, variable text and
the source-only part. For `chosen` it also covers a double click and Enter on a
button's words, a click that ends a text edit, the "Leaves Menu" tag, a box with a
source-only part, the names of the elements that keep an own value, one click with the switch in the
panel, the corner marks, the outline that gives way, the color of the selected cell, the Shadow row and Glow, a fill
that fades, Duplicate, the pin, an alignment guide, a handle on the left edge, Drawn
or Image, and the Thumb row. Not checked: the light theme and window sizes other than
1100 x 720.
