# Story release fixes study

This Design Lab screen, `story-release-fixes`, mocks the copy and placement fixes that
qualification of Story Combined found on [#120](https://github.com/Caldwell-41/Renpy-editor/issues/120).
Every item sits inside the approved Story Combined v1 layout (`story-revamp` /
`combined`, revision `combined-v1`) with the approved status shell
(`story-combined-status` / `header-v2`), editor dialogs (`story-combined-editor` /
`replace-v2`) and conflict B (`story-draft-conflict` / `compact-v2`). The logic fixes
on #120 are separate work and are not in this mock.

Kris approved the combined revision `a-v2` on 2026-11-14. It is the variant
"Combined" in the layout picker and has no A/B switch. The drafts `a-v1` and `b-v1`
stay as they were reviewed. [approval.json](approval.json) holds the decision, his
words for each item, the behaviour, the deviations and the captures in
[captures/a-v2/](captures/a-v2/).

| State | Approved |
| --- | --- |
| `diagnostics` | A, with B's red error style on the broken branch and "branch" wording. Each message ends "Until then, the builder can't edit this branch." Tracks reads "2 branches to fix". |
| `set-variable` | As mocked |
| `protected` | A |
| `move-protected` | B |
| `delete-scene` | A, refusal tidied: a header line with ×, scene and beat rows, one closing line. The scene list groups scenes under collapsible chapter headings. |
| `transition` | B, help reworded: "This fade animates 2 beats above it:", the list, then "A transition animates the stage beats between it and the last line, choice or transition above it. To animate a beat below, move this Transition under that beat." |
| `transition-add` | As mocked |
| `moved-draft` | A |
| `screen-beat` | As mocked |
| `screen-beat-changed` | As mocked, with the note and Choose a place… in one block |
| `tracks-summary` | As mocked |

The tables below describe the A and B drafts as reviewed.

## How the screen is organised

Each lab state is one item. The layout picker, and the Compare menu in the mock's top
bar, switch between A and B. The Item menu in the top bar switches item. The top bar
names the item and the answer on screen, or says "one design, same in A and B".

| State | Item | A | B |
| --- | --- | --- | --- |
| `diagnostics` | D2/B5, condition diagnostics | The builder states the reason and the next step in words, with Create ticket_count… and Edit in Source. The summary lists each test that needs changes. Tracks reads "2 tests need changes". The Branch path caption follows the pressed branch and names its problem. | The test shows as builder rows with the error under the field that is wrong. The author fixes it in place: choose or create a variable, or choose = or ≠. The summary gives a count with links to each branch. Tracks marks the condition with `!`. |
| `set-variable` | B9, Set variable can't create a variable | The variable list ends with "+ New variable…", which opens the shared New variable dialog from #180. With no variables the list says "No variables yet." The new variable is selected after Create variable. | Same as A. |
| `protected` | B8, add a beat right before protected Custom Code | Beat 08's column `+` adds after 08, before 09 Custom Code. Its tooltip says so. | A labelled slot, "+ Before Custom Code", sits between 08 and the region, like the end markers. 08 has no `+`. |
| `move-protected` | B8, Move to across protected Custom Code | The list offers "Before 09 Custom Code". Nothing is preselected. The summary says where the beat is now: "10 Eli's line is after 09 Custom Code now. Choose where to move it." | Same positions, plus two rows that can't be chosen: the locked region ("09 Custom Code · protected, stays in place") and the beat itself ("10 Eli's line · here now"). Nothing is preselected. |
| `delete-scene` | B4, scene delete refusal | The refusal replaces the confirmation inside the scene list, with each referring beat as a link and a Close button. | The list closes and the refusal shows in the bottom status bar, with the same links. |
| `transition` | B14, Transition editor help | One help line states the Ren'Py rule and where to put the beat. | The help names the beats it animates ("Fades in the stage changes since 01 Narration:" then 02 and 03), then states the rule. |
| `transition-add` | B14, Add a beat description | New description for Transition. | Same as A. |
| `moved-draft` | D1, a draft whose beat moved to another branch | "This beat moved to Otherwise in source." Discard draft or Override source. Override source saves the draft to the beat where it is now. | Same message. Discard draft or Add to If. Add to If adds the draft as a new beat at the end of the branch it began in. The moved beat keeps the source text. |
| `screen-beat` | B13, new screen beat placement | Show, Hide and Call screen use Goes at, In and After, and the ⋯ menu's Move to…, like every other new beat. The Insert in and Insert before lists are gone. | Same as A. |
| `screen-beat-changed` | B13, a place picked in Screens that changed | Goes at reads "Choose a place" and a note explains why. Choose a place… opens the place list. Add Beat refuses until a place is chosen. | Same as A. |
| `tracks-summary` | B18 (optional), Tracks character summaries | The Characters lane names the character, expression and position: "Mara · Smile · Left", "Eli · Concerned", "Mara → Centre", "Hide Eli". | Same as A. |

## Wording

| Item | Today | Mock |
| --- | --- | --- |
| D2, missing variable | This test uses Python the builder cannot show. It stays as written. | A: "ticket_count is not a project variable. Create it, or change the test in Source. The test stays as written until then." B, under the variable: "ticket_count is not a project variable. Choose one, or create it." |
| D2, wrong type | Same generic line | A: "destination is text. ≥ only compares numbers. Compare it with = or ≠, or change the test in Source. The test stays as written until then." B, under the operators: "destination is text. Choose = or ≠." |
| D2, summary | Only the If test | A: one line per problem, "Else if ticket_count = 2: ticket_count is not a project variable." B: "2 tests need changes: Else if ticket_count = 2, Else if destination ≥ 3" |
| B9, empty list | "Missing Variable", no way to create one | "Choose a variable", then "No variables yet." and "+ New variable…" |
| B8, Move to | Preselects a place on the far side of the region | Nothing preselected. "10 Eli's line is after 09 Custom Code now. Choose where to move it." Dialog note adds "Protected Custom Code stays where it is." |
| B4, confirmation | Delete Scene "…"? Incoming or opaque references will refuse this operation. | Delete scene "Platform 4"? Undo restores it. |
| B4, refusal | The Scene has incoming or unknown references and cannot be deleted safely. Input retained. If this source structure cannot be moved safely, edit it in Source. | Can't delete "Platform 4". 2 beats go to it: The last service · 07 Jump, Morning at the depot · 05 Call scene. Change or remove them, then delete again. Nothing was deleted. |
| B4, unknown reference | Same line | Can't delete "Depot yard". Custom Code may jump to it, and Loomlight can't check where it goes: The last service · 09 Custom Code. Change that code in Source first. Nothing was deleted. |
| B14, Add a beat | Animates the next visual change. | Animates the stage changes above it, since the last line or choice. |
| B14, editor | Applies to the next visual change. | A: "Ren'Py plays this transition for every stage change since the last line, choice or transition. Put it after the Background or Show character beats it should animate." B adds the list of beats it animates. |
| D1 | This beat is no longer in source. | This beat moved to Otherwise in source. Your draft is still for this beat. The source label reads "Source, now in Otherwise" and a link reads "Show it in Otherwise". |
| B13, changed place | The original insertion Scene changed. Choose its position explicitly. Input retained. | The scene changed after you picked this place in Screens. Choose where this beat goes. |

## B14 finding

The current text is wrong. A Transition beat writes a standalone `with dissolve` or
`with fade` line (`app/src-core/src/scene.rs`, the `BeatPayload::Transition` arm of
the beat writer). The Ren'Py 8.5.3 documentation for the with statement says the
transition runs "between the contents of the screen at the end of the previous
interaction ... and the current contents of the scene, after the show and hide
statements have executed". A with statement is itself an interaction. So the beat
animates the stage changes above it, back to the last line, choice, pause or
transition. It never animates a later change. A Transition placed before a
Background does not fade that background in. The Show character Transition field
writes `show … with fade`, which applies to that one statement and is correct as
it is.

## What the fixes need beyond the UI

- B8 needs core to accept a place right before a protected region. Today
  `bodies.rs` `check` refuses any position whose next beat is opaque
  (`OpaqueBoundary`), and the end of a scene whose last beat is opaque. The mock
  assumes core allows inserting at the region's first byte.
- B4 needs the refusal to carry the referring beats. Today `INCOMING_REFERENCE`
  has one fixed message. The mock lists each beat, or the Custom Code that makes
  the reference unknown.
- D2 B needs core to return the variable, operator and value of a test it marks
  `missingVariable` or `typeMismatch`, so the builder can show them as fields. A
  works with the source text and the diagnostic core returns today.
- D1 B needs a command that inserts the draft as a new beat in its original
  branch. A uses the existing Override source path with the beat's new branch.

## Simulated parts

Browser-memory mock with fictional sample text from the lab. The shell is a reduced
copy of Story Combined v1 built from the story-combined-status and
story-combined-editor studies. Create variable, the condition fixes, Add a beat, Move
to, the scene delete refusal, Discard draft, Override source, Add to If and Add Beat
write a status message or change the mock only. There is no source change, history
or Undo entry. Buttons that belong to other work report "outside this study".

## Review

From `app/`, with the pinned Node 24 tools, run `npm run design:dev`, then open
`http://127.0.0.1:5174/?screen=story-release-fixes&variant=a&state=diagnostics&theme=dark&viewport=wide`.
Change `variant` to `b`. Set `state` to any state in the table. Use
`viewport=compact` for 560 × 640 and `theme=light` for the light palette.

Focused check and captures, once per variant and once more in light:

```sh
npm run design:check -- story-release-fixes a --interaction ./screens/story-release-fixes/review-check.mjs --capture
npm run design:check -- story-release-fixes b --interaction ./screens/story-release-fixes/review-check.mjs --capture
npm run design:check -- story-release-fixes a --theme light --interaction ./screens/story-release-fixes/review-check.mjs
npm run design:check -- story-release-fixes a-v2 --interaction ./screens/story-release-fixes/review-check.mjs --capture
npm run design:check -- --approval story-release-fixes
```

[captures/](captures/) holds `<revision>-<state>-dark-<wide|compact>.png` for both
variants and every state. `diagnostics-branches` is the same state scrolled to the
two Else if tests. They are draft review images.
