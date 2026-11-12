# UI and design system

This document owns Loomlight's visual language, the rules every workspace shares and
a short statement of each workspace's intent. Feature behaviour belongs to the
contract linked from each section, and exact implemented values live in the code.

- Mockups and component previews: [Design Lab](../app/design-lab/README.md).
- Approval and promotion into the app: [ADR 0017](adr/0017-design-approval-and-app-integration.md)
  and [design integration](../app/design-lab/INTEGRATION.md).
- Story redesign decisions: [issue #82](https://github.com/Caldwell-41/Renpy-editor/issues/82)
  and the [Story authoring notes](design/story-revamp/README.md).

This is the target design. Production still ships the charcoal/copper and paper/teal
palettes and the earlier Story layout. The app-wide palette change must ship before
or with Story Combined v1, as recorded in its
[release scope](design/story-revamp/README.md#production-release-scope).

## Design intent

Loomlight is a restrained writing and game-authoring tool. Routine visual-novel
authoring should be faster in Story than through modal property forms, and the Ren'Py
source it writes stays ordinary and visible. Story content, the game stage and the
selected beat get the attention; shell furniture recedes once a project is open.
Dark mode comes first, the app follows the system appearance by default, and layouts
are information-dense.

Story, Source, Branches and Screens are the main workspaces. Characters, Assets,
Variables, Settings, project setup and Runtime support them. Timeline and Run From
Here are later work and must not appear as working features before they exist. Git
status, diff and checkpoints are deferred to [optional Git](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/active/optional-local-git.md).

## Visual language

Loomlight should look like a native creative application, not a web dashboard, a
generic IDE skin or an AI product mockup. Borrow desktop conventions for tabs,
navigation, keyboard access, inspectors and source editing. Identity comes from story
structure, beat presentation, the stage, typography and interaction quality.

### Palette: Brass and slate

Each theme has its own palette. Dark uses slate surfaces with a brass accent; Light
uses warm off-white surfaces with a slate-blue accent. Game preview colours stay
independent of the app theme. Components use semantic tokens only, never literal
colours. `app/src/styles.css` defines every token below once for each theme, and no
other stylesheet redefines them. Source syntax colours (`--syntax-*`) stay in
`ui-refresh.css`. The status tokens (`--status-success`, `--status-warning`,
`--status-error`, `--status-info`, `--status-partial`) keep their meanings.

**Contrast contract.** Text and status colours reach 4.5:1 on every surface a row can
take: app, panel, raised, hover, selected and `--accent-subtle` (the active Source
line). The focus ring reaches 3:1 on the same surfaces. `--text-disabled` is exempt.
Branch arm colours colour text, so they follow the contract, except dark arm 2, which
is 4.41:1 on hover and 4.33:1 on `--accent-subtle` and is checked on the other four
surfaces. `theme-contrast.test.ts` checks every text, status and arm token against this
contract and compares all tokens in the table with `styles.css`.

| Token | Dark | Light |
| --- | --- | --- |
| `--surface-app` | `#161b20` | `#ecebe6` |
| `--surface-panel` | `#1b2128` | `#f6f5f1` |
| `--surface-raised` | `#222a32` | `#fffefb` |
| `--surface-hover` | `#29323b` | `#e5e3dc` |
| `--surface-selected` | `#342e22` | `#f3e7cb` |
| `--text-primary` | `#e9ecef` | `#1d252c` |
| `--text-secondary` | `#bcc4cc` | `#3d4853` |
| `--text-muted` | `#949ea8` | `#5a6570` |
| `--text-disabled` | `#66717b` | `#8b949c` |
| `--border-normal` | `#2c353e` | `#d5d2ca` |
| `--border-strong` | `#46525d` | `#a6a39a` |
| `--accent-primary` | `#d6a84e` | `#2d4d78` |
| `--accent-hover` | `#e6bc66` | `#203b60` |
| `--accent-subtle` | `#3a3122` | `#dfe6f0` |
| `--focus-ring` | `#e6bc66` | `#2d4d78` |
| `--status-success` | `#78ad8c` | `#34704b` |
| `--status-warning` | `#c4a66a` | `#775a1c` |
| `--status-error` | `#d4888f` | `#983f49` |
| `--status-info` | `#7f9fbd` | `#356383` |
| `--status-partial` | `#d1b887` | `#73612f` |
| `--on-accent` | `#1b1508` | `#ffffff` |
| Branch arm 1 to 4 | `#4fb3a5` `#e07a5f` `#6aa9d8` `#7fbf73` | `#0e7266` `#a94726` `#2b67a0` `#5c6c07` |
| Stage edge | `#0d1114` | `#c9c6be` |
| Thumbnail tile | `#10161b` | `#d9d6ce` |

The values come from [`combined-revision.css`](../app/design-lab/screens/story-revamp/combined-revision.css),
which scopes them to the Story mock. There the last three rows are `--sc-arm-1` to
`--sc-arm-4`, `--sc-stage-edge` and `--sc-tile`; the `sc-` prefix belongs to the mock.
The app names the four arm tokens `--choice-arm-one` to `--choice-arm-four`. Stage edge and
thumbnail tile stay in the Story layout slice, which adds them where it uses them.

Kris approved darker light arm values on 2026-11-12 so arm text reaches 4.5:1. Light
arm 1, 2 and 4 are darker than the mock's `#1c7a6d`, `#b24f2e` and `#66771a`; arm 3
and every dark value match the mock.

### Colour carries meaning

Colour marks three things and is never decoration:

- **Branch arms.** Each condition branch and Choice option takes one of the four arm
  colours, cycling in scene order. The same colour marks it in the Branch path, the
  breadcrumb, the Tracks and Reel route line, the option block and the stage button.
- **Characters.** A character's name uses its Ren'Py `Character(color=...)` colour
  wherever it appears.
- **Selection.** The accent marks the selected item and rare primary actions.

Beat types use line icons and text labels, not category colours. Colour never carries
meaning alone; pair it with text, a number or a shape. No purple, neon, glow or
gradients.

### Typography

Use the system UI stack (`system-ui`, `-apple-system`, `Segoe UI`) for the app, story
text, beats and catalogues. Use the monospace stack (`SFMono-Regular`, Consolas,
Liberation Mono, Menlo) for Source and Ren'Py lines. Do not bundle a brand font.
Size, weight and spacing carry hierarchy, not colour or effects. Secondary text stays
readable; never shrink it to tiny low-contrast copy to look dense.

### Surfaces, rows and selection

Story content (dialogue, choices, appearances, media pickers) gets slightly more line
height than technical surfaces such as Source navigation, diagnostics and property
grids. Never squeeze dialogue into file-tree rows.

Separate regions with surface steps, spacing and thin dividers. Text rows and sections
stay flat, with no card or pill chrome, no box around every section and no rounded box
inside another. Corners are 4 or 6 px (`--radius-small`, `--radius-medium`). Shadows
belong only to floating layers such as menus, picker sheets and dialogs. The stage has
a 1 px edge so it reads as a game window inside the tool.

Image thumbnails may sit in tiles. A selected tile or row shows the accent as a fill,
an underline bar or accent text, and needs no ring. Keyboard focus keeps its own
outline in `--focus-ring`, so focus and selection never look the same.

A section heading names its section. Do not put a light-gray subtitle or eyebrow line
above it. Existing eyebrows (the `.eyebrow` class) go when their surface is redesigned,
not in a separate cleanup; move any information they carry, such as a wizard step or
a Chapter name, into the redesigned layout.

### Icons and controls

Use one line-icon family at 16 to 18 px. Icons support labels; an important or
unfamiliar action keeps a text label, or an accessible name with help on hover and
focus. Primary button styling is rare: creation, Run or Validate, and confirming a
conflict resolution. Ordinary editing controls stay neutral. A segmented switch suits
two or three short exclusive values, such as Left, Centre and Right.

### Motion

Motion is short and functional: expanding, collapsing, panel changes, focus movement
and brief state feedback. Nothing repaints continuously, so no pulse, shimmer, blur,
spinners, animated gradients, bouncing or parallax. Respect reduced motion; turning
animation off removes no information. Show progress as text or a measured bar.

### Design failures

These are failures unless a reviewed requirement gives a functional reason:

- glow, neon or purple accents, and gradients anywhere, including buttons and borders;
- frosted or translucent working panels;
- cards or pills for ordinary rows, labels, state or navigation;
- category colours for icons or beat types;
- sparkles, stars or "AI" motifs that do not report product state;
- dashboard metric tiles on authoring surfaces;
- heavy shadows or floating-card elevation across the app;
- large logos, taglines or marketing headers inside an open project;
- an icon, title and bordered box on every panel regardless of need;
- copying VS Code, Unity, Godot or the Ren'Py launcher closely enough to lose
  Loomlight's own identity.

<a id="accepted-uiux-guidelines-for-implementation-agents"></a>

## Guidelines for implementation agents

Read this section before designing controls. Written decisions and recorded
corrections take precedence over details in generated images or mockups.

1. **Keep the visual language.** Use the shared tokens, system fonts, thin dividers and
   small corners above. Story content, the selected beat and game art come before shell
   decoration.
2. **Keep workspaces familiar.** Navigation sits on the left, authoring in the centre,
   optional properties on the right and diagnostics below. Keep selection, scroll
   position and remembered panel layout across tools. Reveal advanced detail on demand,
   and do not repeat global Save, Run or status controls in each panel.
3. **Make selection explicit.** Highlight the selected item and name it in its editor.
   Keep stage, list and track selection in sync for the same object. Previewing a value,
   such as an appearance or background, never changes the saved value. An editor never
   silently edits an earlier selection.
4. **Make commitment clear.** Edit frequent writing inline; use bounded dialogs to
   create and edit catalogue items. Distinguish draft, applied and saved states.
   Navigation and failed submissions keep unfinished work. Label fields, group related
   controls, show units and put errors beside their fields.
5. **One action, one Undo.** A drag, resize, beat move or accepted proposal is one
   transaction and one history entry. Name undo actions where useful and reveal the
   affected item. Escape cancels an unfinished gesture, and pointer movement never
   writes source.
6. **Offer alternatives to dragging.** Provide numeric fields, move commands and
   keyboard controls, with grips and handles that are easy to hit. Every operation
   works by keyboard and by clicking.
7. **Keep Assist understandable.** Preparation, generation, review and application are
   separate steps. Show the target, references, effective prompt and limits before
   sending, and the changes before acceptance. Generated references never approve
   themselves. Applying a proposal is undoable and is not a validation pass.
8. **Report facts without disturbing writing.** Distinguish saved work, unsaved drafts,
   generation, validation failure and stale previews. Status regions keep their size,
   so content never shifts. Percentages need measured progress. Label partial previews
   and offer deliberate Ren'Py playback; a browser rendering is not runtime proof.
9. **Interrupt in proportion to loss.** Routine undoable edits stay quick. Confirm draft
   loss or irreversible effects with specific action labels. Every dialog has a visible
   Close or Cancel, guarded Escape and focus return. Cancelling never implies that a
   started write was rolled back.
10. **Adapt without shrinking everything.** Collapse secondary panels before squeezing
    the main editor. Stack forms and comparisons at compact widths and keep actions
    reachable. Keep visible focus, readable text, both themes and the user's text and
    interface sizes. Horizontal scrolling stays inside content that needs it, such as
    Source.
11. **Use plain language.** Write short, concrete labels in authoring terms. Explain the
    Ren'Py terms authors need and keep terminology consistent. Never hide information
    needed for a decision in a tooltip.
12. **Validate when a field is finished and again on submission**, following
    [input validation](#input-validation-timing-and-recovery).

### Interface language and help

Action labels describe the result, such as Move to scene, Apply changes or Discard
changes, instead of internal vocabulary or Yes/No. An error says what went wrong and
what to do next: "Enter a whole number from 1 to 60", not "Invalid scalar".

Keep precision where it matters. Technical-name fields stay distinct from display
names. Dimensions show pixels, durations seconds and LLM limits tokens, with a short
explanation of tokens. Do not relabel concepts so broadly that authors confuse scale
with size, preview zoom with game resolution, or applying changes with saving.

Help for optional technical detail, such as anchors, ATL or naming rules, opens on
keyboard focus as well as hover. Longer help expands in place. Required syntax, units,
limits and recovery stay visible beside the field; a placeholder is not a label. Keep
credentials and raw exceptions out of routine copy. Show a project path when it
identifies the target, and keep other machine detail in diagnostics.

### Input validation timing and recovery

- **Before input.** Show labels, required or optional status, units and useful
  examples. An untouched empty field is never an error when a form opens.
- **While typing.** Allow incomplete values. Do not add format errors per keystroke,
  steal focus, rewrite text or validate during IME composition. An error already shown
  updates or clears as the value becomes valid.
- **When a field is finished.** Validate text and number fields on blur and on an
  explicit field commit. Validate a selection when it is chosen. Enter commits only
  where it already does; in multiline text it inserts a newline.
- **On submission.** Revalidate the whole form, including untouched and dependent
  fields. Invalid input writes and sends nothing. Keep every field, mark the errors and
  focus the first one. A disabled button alone never explains why.
- **Showing errors.** Put the message beside the field with an accessible association
  and invalid state. State the expected format or range with an example. Announce error
  changes, not each typed character.
- **Shared rules.** Use the existing validators. Submission still passes core
  validation, revision checks and the transaction layer; client checks prove nothing
  about source ownership, file availability or runtime compatibility.
- **Asynchronous checks.** Bind each result to the current value and ignore stale
  replies. Show checking or unavailable separately from invalid. Field validation never
  sends to an LLM, loads a model or runs the project.
- **Keep meaning.** Apply only documented normalisation, such as the
  [technical-name rule](DATA_MODEL.md#authority-and-identity). Never truncate, change
  prose, repair source syntax or replace a bad number with a fallback.

### Reviewing a UI change

Reuse the shared controls for buttons, fields, selection, inspectors, dialogs, drafts,
validation and status, and extend an existing helper instead of adding a second one.
Check representative content in both themes at wide and compact sizes: keyboard and
focus, text scaling, selection retention, and the empty, busy, error and stale states.
Take one action through Undo, Cancel and a failed submission, and confirm that a
refusal changes nothing and keeps input. A canvas change needs comparison with real
Ren'Py output. [TESTING](TESTING.md) owns the gates.

## Shared controls

These patterns come from the approved Story redesign and apply wherever the same need
appears.

### Media pickers

A field that selects an image shows its thumbnail and Change. Change opens a picker
sheet inside the sidebar with a grid of thumbnail tiles. Pointing at or focusing a
tile previews it on the stage without saving. Click or Enter applies it; Escape closes
the sheet and keeps the current value. Speakers and characters use a list with
portrait and name colour. Sound and music show an icon and name, with no fake playback.

### Pick-one dialogs

A dialog that adds or picks one item from a list, such as Add a beat, is compact. It
groups rows with an icon and a one-line description and offers search. Click or Enter
adds the highlighted row; Escape or Close cancels. It has no separate confirm button.

### Condition rule builder

Conditions follow the typed model in [ADR 0014](adr/0014-typed-conditions-and-recursive-source-ownership.md).
Each rule picks a project variable (yes/no, whole number, decimal or text), a preset test and a
value. Numbers offer `= ≠ < ≤ > ≥`; yes/no and text offer equality only. One All/Any
switch joins the rules, and each branch shows its Ren'Py line. Mixed groups and Python
the editor cannot read stay read-only with Edit in Source; the builder never writes
raw Python. The variable list can create a variable in place, with Undo. Story
conditions and Choice "Only when" use the same builder.

### Arithmetic equation row

Set variable is one equation row, such as `trust [+= ▾] [formula]`. The operation menu
lists Set to, Add, Subtract, Multiply by, Divide by, Floor divide by and Remainder
after dividing by, each with a short example. The value is a number or a formula of
declared numeric variables and brackets, with name suggestions while typing. Feedback
names the result type and refuses a decimal result for a whole-number variable,
unknown or non-number variables and division by zero. A value "on this route" uses
only assignments earlier on the route, never the starting default, so most values
read "unknown". Calculations the editor cannot show, such as `max()`, stay read-only
with Edit in Source. [Issue #87](https://github.com/Caldwell-41/Renpy-editor/issues/87)
owns the behaviour, the decimal type and the Screens actions.

The production Story equation row validates through revision-bound
`scene.validateAssignment` and commits through the existing Story transaction.
Core supplies result types, supported operations, limits and field diagnostics.
Draft feedback folds constants only; a variable-dependent draft says its current
value is unknown. It never substitutes declaration defaults. Accepted Story state
stays in the core model and Scene preview. Numeric suggestions support arrows,
Enter/Tab and Escape. Cmd/Ctrl+Enter commits the beat; Escape closes a suggestion
or operation menu before returning to the retained draft. Cancel discards that
draft and returns focus to the beat. Boolean and text targets keep literal fields.

These reusable controls operate in the existing workspace and Writing focus.
Tracks/Reel, cross-view retained drafts and the full Brass and slate layout remain
with #110; shared decimal creation/default controls remain with #97.
[#96 evidence](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-96.md) records the scoped visual comparison
and real Story-to-core operations.

## Application shell

| Region | Contents |
| --- | --- |
| Header | Project, save state, Undo, Redo, Save, Validate, Run and Stop |
| Left | Collapsible main navigation, then the workspace's own list (scenes or files) |
| Centre | The active workspace |
| Right | The workspace's editor or optional inspector |
| Bottom | Runtime and diagnostics drawer, opened on demand |

The header Undo and Redo are square icon buttons with no visible text, between the
save state and Save. They and Cmd/Ctrl+Z are the only Undo and Redo controls in the
application; no workspace has its own. [Story Undo](#story-undo) defines them. The
approved layout is `header-undo` / `icons`, revision `icons-v1`
([record](design/header-undo/README.md)).

Each panel has a visible collapse and restore control that moves focus and remembers
its state. When space runs short, secondary panels collapse before the main editor
shrinks. The footer and warning regions keep a fixed height so editing content never
moves.

The header shows pending beat drafts as well as Saved, Saving, Unsaved Source draft,
Conflict or Recovery required. Cmd/Ctrl+S has one shell-owned route. In Story it
accepts all pending beat drafts under [Saving Story drafts](#saving-story-drafts);
in Source it accepts the focused Source draft. Other contexts retain their existing
Save behaviour. Pending or refused drafts never report the whole project as Saved.
[ADR 0007](adr/0007-shell-save-command-ownership.md), extended for Story by
[ADR 0022](adr/0022-saving-retained-story-drafts.md), owns the route and the
[session handoff](ARCHITECTURE.md#corrective-project-session-handoff) owns status
ordering.

## Settings

Settings opens with or without a project and separates Application from Current
project. Wide windows list the categories; narrow windows use a category menu. Theme
(Follow system by default), interface size, Source text size and remembered or reset
layouts are device-local. Current project shows the pinned Ren'Py version and
resolution, links to the SDK and trust controls, and holds project prompts. AI
provider setup is described under [Assist and AI settings](#assist-and-ai-settings).

## Welcome and new project

Welcome lists recent projects with search, last-opened dates and Remove from recents.
Missing or invalid entries stay visible with their path. Open Loomlight Project opens a
folder containing `.renpy-editor/project.json`; importing an arbitrary Ren'Py project
is later work.

New Project is a four-step wizard:

1. Project details: game title, editable folder name, parent folder and the exact final
   path. Unsafe or non-empty destinations are refused.
2. Ren'Py SDK: pick a detected compatible SDK, install the pinned version or Select
   existing SDK. An incompatible install shows the reason.
3. Game configuration: 1920 × 1080 by default, presets or a custom size, with an aspect
   preview captioned "Game resolution, not editor size".
4. Review and create: title, path, SDK and resolution, with Initialize Git repository
   checked by default.

Creation shows its actual stages. Download progress shows bytes or a percentage only
when the total size is known. Failure keeps every input, and a project that was created
but could not open offers Open, not Create. A new project opens at Chapter 1, Scene 1.

<a id="bounded-source-foundation-story-outline"></a>

## Story workspace

Story is the author's main workspace. Its tree is `Project → Chapter → Scene`, and each
Scene holds ordered beats. Display names are separate from technical labels and files,
so renaming a Scene changes neither. The target is **Story Combined v1**, the approved
Design Lab layout `story-revamp` / `combined` (revision `combined-v1`) from issue #82. The [revision notes](design/story-revamp/README.md#post-delivery-revision)
hold its detailed decisions, samples and stage sizes, and the
[3A interaction design](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/reference/phase-3a-story.md#story-interaction-design)
covers moving, unwrapping and deleting branches.

### Layout

- The game stage sits beside the selected-beat editor in a right-hand sidebar.
  It keeps the project's width-to-height ratio and fits the complete image into the
  available space, leaving unused space where needed. It never stretches or crops the
  game image to match the mock's 16:9 sample.
  Authoring forms stay outside the stage; only the game's dialogue box and choice menu
  overlay it. The stage keeps room for future character dragging.
- Below the stage, the Branch path sits above a bottom panel that switches between
  Tracks (the default) and Reel. Both show the same story, selection, open branches and
  insertion target, and switching keeps drafts.
- Tracks has one column per beat and lanes for Beat, Background, Characters, Words,
  Sound and Flow. Reel shows beat cards in order, including the beats around a branch.
  Neither shows elapsed time, playback or keyframes.
- Writing focus hides the stage and keeps the editor and Branch path. Its Tracks view
  keeps every lane on wide windows, with a taller Words lane.

### Branches in a scene

- The Branch path only switches branches. Each open condition shows its number, its
  If test and a two-way switch in its arm colours. Choice options show only their
  number unless open.
- The path wraps instead of scrolling sideways, and each condition or Choice stays one
  unit.
  Each extra row takes about 30 px from the stage, up to three rows; beyond that the
  path scrolls.
- Tracks and Reel draw a route line in the arm colour above each open branch, with a
  light tint on its columns. Slim `+` markers add the first beat, the last beat or a
  beat after the condition. An empty branch or option is one beat-wide slot holding
  its name, where it continues and Add a beat.
- Every insertion names its body and position, and replacing an ending names what it
  replaces.
- Core gives each [body](../GLOSSARY.md) its beats, body ending and insertion places.
  Story views, Add a beat and moves read them and never work them out again.
- A body has an insertion place before each node up to its ending, and one at its end
  when it does not end. There is none after the ending, before protected Custom Code
  or before an Else if or Otherwise header. Jump, Repeat this Choice and Return fit
  only at the end. An empty body has one insertion place, and its new beat replaces
  the `pass`.
- Add a beat starts at the place before the body's ending, or at the end when the
  body does not end.
- A body ends at its first Jump, Repeat this Choice or Return, at a condition with
  Otherwise whose branches all end, or at a Choice whose selectable options all end.
  Custom Code that starts with `jump` or `return` also ends it. Other Custom Code
  never ends a body or hides an ending after it. When it is the last beat, the
  ending is unknown.
- When a body's ending is unknown, Story says so and never claims that the story
  continues. Authoring treats an unknown ending as one that may continue, so it
  never relies on an ending it cannot prove.

### Beat editors

- Backgrounds and expressions use the [media picker](#media-pickers). Position is a
  Left/Centre/Right switch. Selecting an audio beat never plays it; only the labelled
  audition action plays audio.
- Narration is its own mode, not a fake Character. In dialogue, Enter adds a line
  break, Cmd/Ctrl+Enter commits the draft, and
  Shift+Cmd/Ctrl+Enter commits and starts the next line with the last speaker on the
  current path. [Story Undo](#story-undo) defines the grouping of typing into steps.
- Staging changes are explicit beats. A dialogue line never hides a `show` or
  appearance change.
- Selecting a character or the background on the stage names the beat that set it, and
  offers to edit that beat or add a change before the current beat in the same body. It
  never edits the earlier beat silently.
- Source the editor cannot represent is a protected Custom Code beat with its reason
  and Edit in Source. Moves never cross it unless the source layer proves the move safe.
- A pending beat edit has Commit and Cancel. The [beat draft rules](#beat-drafts)
  allow navigation without losing unfinished input. Failed commits keep the text
  and focus.
- Set variable uses the [equation row](#arithmetic-equation-row) and conditions use the
  [rule builder](#condition-rule-builder).
- Add a beat is a [pick-one dialog](#pick-one-dialogs). Its destination line names
  where the beat lands and any ending it replaces.

### Beat drafts

A beat draft stays attached to its beat when the author selects another beat or
branch. Returning to that beat restores the unfinished input. Tracks, Reel and
Writing focus also preserve drafts. Mark beats with pending edits so the author
can find them.

Navigation does not commit or discard a draft. Commit remains explicit, and
incomplete or invalid input never reaches the source files. Ask before an action
would discard a draft, including deleting its beat or closing the project.

The [beat draft conflict rules](#beat-draft-conflicts) handle changes to the source
beneath a retained draft. Until that comparison is built, Commit refuses a draft
whose beat changed in source and keeps the input. A beat that the author has not
edited is not a draft. A collapsed condition shows the draft marker on its heading.
A beat with a draft can be moved, and the draft moves with it. A new beat that is
not yet added moves with the place the author chooses. Undo and Redo wait for
pending drafts until the [Story Undo](#story-undo) order is built.

### Beat draft conflicts

Use the approved B, Buttons together interaction: `story-draft-conflict` / `compact`,
revision `compact-v2`. The [reference record](design/story-revamp/README.md#approved-draft-conflict-interaction)
identifies its local source and approval commits.

Mark a conflicting beat quietly. Unrelated non-conflicting changes need no prompt,
and routine navigation keeps every draft. Returning to the affected beat reveals
"Conflict with source" in the selected-beat editor, with the current source text
above the editable retained draft. Place Discard draft and Override source together
below the text box.

- Discard draft keeps the current source and removes only this beat draft.
- Override source validates the editor text and saves only this beat through the
  existing transaction layer. Other drafts stay unsaved. Empty text refuses the
  override and retains the draft.

Override source must use the source revision the author reviewed and preserve all
existing validation and source-ownership checks. If the source changes again,
retain the draft and refresh the comparison before accepting another override.
The action does not authorize a stale write or bypass unsupported-source refusal.

Main Save reveals an unresolved conflict and retains all drafts without saving any
of them. Navigation and Tracks/Reel changes keep drafts; valid drafts still preview
on the game stage under the existing [stage preview rules](#stage-preview).

### Saving Story drafts

In Story, the main Save button and Cmd/Ctrl+S save all pending beat drafts in the
open project, including beats outside the current selection or scene. Check every
draft before writing any of them. If any draft is incomplete, invalid or conflicted,
retain all drafts and reveal the failing draft with its error. No draft is saved by that request
until all pass validation. Commit remains available to save one beat on its own.

Story Save applies only while the Story workspace is open and beat drafts exist. In
other workspaces, and in Story with no beat drafts, Save keeps its existing behaviour.
The header still shows pending beat drafts. While
a Story Save runs, Story controls stay locked and a second Save reports busy. If
another Story form has input, Save refuses and writes nothing. If the project changed
after Story last refreshed, Save refreshes Story, marks any beat draft conflicts and
asks the author to save again. It never retries on its own.

A refused Story Save follows the approved `story-save-refusal` design (`marked-v1`).
Save reveals the first failing draft in project order. The status line reads "Nothing
saved. 3 of 5 drafts need changes:", followed by one link per scene with its count of
failing drafts. Each link reveals that scene's first failing draft. A failing beat and its
scene row show a red `!` in place of the draft `*`, and the draft's editor shows why
it failed. A new beat whose body or insertion anchor is gone from source is a beat
draft conflict. The marks and counts update as the author fixes or cancels each
failing draft. When none fail, the status reads "5 unsaved beat drafts. Ready to
save." The marks clear when a later Save succeeds.

Story Save does not accept unfinished Source text. The shell coordinates acceptance
through the existing transaction layer, with current-source validation and ordinary
conflict/recovery handling. [ADR 0022](adr/0022-saving-retained-story-drafts.md) records
the change from production's current Flush-only Story Save. Saving follows the
[Story Undo rules](#story-undo) and does not add a separate user-visible history step.

### Story Undo

The open project has one [project history](../GLOSSARY.md#language). Undo reverses
the latest edit in it, saved or not, and Redo restores an undone edit. Story,
Screens, Source, Prompts and References share it. There is no separate queue for
a page and no separate draft and saved-edit Undo in Story. Selecting beats,
switching branches, scenes, views or workspaces adds no entry and keeps the order.
Saving adds no extra entry and does not clear the history.
[ADR 0025](adr/0025-project-history-orders-draft-steps.md) records how the order
includes unfinished drafts.

The header Undo and Redo buttons and Cmd/Ctrl+Z run one shell-owned Undo command.
Redo uses Shift+Cmd/Ctrl+Z, or Ctrl+Y on Windows. Story, Screens, Prompts and
References have no Undo or Redo buttons of their own. The header buttons are icons.
Their tooltip and accessible name name the next edit and the shortcut, for example
"Undo button resize ⌘Z". With nothing to undo or redo, a button is dimmed, does
nothing and reads "Nothing to undo" or "Nothing to redo". It stays in the Tab order
(`aria-disabled`, not `disabled`). After Undo the status line reports it, for example
"Undone: button resize".

Undo opens the edit's workspace and selects its item: the beat, screen element,
Source file, prompt action or reference record. If the item no longer exists,
select the nearest item that contains it, or open the workspace. Undo and Redo
follow ordinary navigation. Where leaving is refused, Undo does nothing and the
input stays. Where leaving asks "Keep editing?", Undo asks too and continues only
after Discard and leave. Beat drafts and Source drafts never block it. While a
dialog is open, Cmd/Ctrl+Z belongs to the dialog.

Typing in a beat draft makes draft steps. A text step ends when focus leaves the
field or after 2 seconds without typing. Each change to another control, such as a
menu, media picker or checkbox, is one step. Undo of a draft step changes the draft
and writes no source. Undo past a draft's first step ends the draft.

Commit and Story Save join a beat's draft steps into one edit at the top of the
history, so one Undo reverses the whole beat. A Story Save adds one edit for each
saved beat, with the most recently edited beat on top. Cancel is an edit, and Undo
of it brings the draft back. Undo of deleting a beat restores the beat from source,
but not the draft the author agreed to discard.

For example, type in beat A, change and commit beat B's background, then return to
A without typing. The first Undo reverses B's background change. The next Undo
reverses the latest typing step in A. If the author edits Story, resizes a button in
Screens and returns to Story without editing, Undo reverses the resize, opens
Screens and selects the button. Retained beat drafts stay through that navigation.

Undo of saved source uses the existing shared transaction layer and its revision,
conflict and recovery checks.

Input that Loomlight keeps when the author leaves joins the project history. That
is beat drafts and unsaved Source text. In those fields, and when no text field has
focus, Cmd/Ctrl+Z runs project Undo. Source typing makes draft steps under the same
grouping, and Source Save joins a file's steps into one edit. Other text fields,
such as search, open Story forms, unapplied Screens fields and unsaved prompt text,
keep the browser's text Undo and add no entries.

This is target behaviour. Production blocks project Undo while a beat draft exists.
Until a separate issue builds Source draft steps, Source typing keeps the Source
editor's per-file text history, Cmd/Ctrl+Z in Source does text Undo, and accepted
Source saves already join the project history.

Kris selected familiar Word-like editing behaviour. Microsoft's
[Undo guidance](https://support.microsoft.com/en-us/office/foundations-experiences/undo-redo-or-repeat-an-action)
describes keyboard and toolbar access to Undo and retaining Undo after saving.
The Story rules above define Loomlight's application of that reference.

### Choices

- Options are numbered blocks in their arm colours. Each option owns ordered beats,
  stored like a condition branch, so its path appears in the Branch path, Tracks, Reel
  and Writing focus. Options move up and down with their bodies, and Undo restores the
  order.
- Then edits only the body's last beat: Continue after the Choice, Go to a scene (Jump),
  Repeat this Choice or Return. Call is an ordinary beat inside the body.
- When protected Custom Code ends the option, Then reads "Ends with Custom Code:"
  and its source line, offers Edit in Source, and turns its four choices off. When
  the ending is unknown, Then reads "Ending unknown: Custom Code can leave this
  option" and keeps its choices, so the author can add an explicit ending after it.
- A destination is a scene card (opening background, name and first line) that opens a
  scene sheet with New scene.
- An option's condition reads as one line, "Always available" or "Only when ...", and
  opens the rule builder on request. A guarded option is hidden when false by default,
  or shown disabled. The Choice's Picked options setting is Show normally, Mark picked
  or Hide picked. Options with the same text keep separate identities.
- The prompt is narration or a Character line shown with the options. When no option
  can be picked, the story continues after the Choice and records no pick.
- Focusing or pointing at an option marks its button on the stage.

### Stage preview

Valid beat drafts update the game stage immediately, before Commit or Save. Text
updates as the author types; other fields update when the field is complete. Show
unsaved status only in the normal save-status area; do not add an unsaved warning
over the stage or annotate each changed item. The beat draft markers still identify
unfinished beats. Cancelling a draft restores the accepted value in the preview.
Previewing a draft never writes to the game's source files.

Incomplete input remains in its field while the author types. Follow the shared
[input validation timing](#input-validation-timing-and-recovery) on field exit and
Save. An incomplete or invalid calculation never supplies an invented preview result.

Selecting a beat shows the scene-local state through that beat: background, visible
characters and appearances, placement, music, simple variables and the current line or
menu. A new Background clears characters. State the editor cannot prove is labelled
partial or unknown, never guessed. Preview choices for branches and options are manual
assumptions; they are separate from the editing target and never saved or added to
Undo. The [preview boundary](ARCHITECTURE.md#preview-boundary) owns reconstruction and
media rules.

### Not yet in production

Production Story still has the earlier layout, with the preview above a beat list.
The #101 slice adds numbered option bodies, caption/order controls, explicit Beat
insertion positions and Then controls for Continue, Jump and Return in that editor.
#102 adds conditions, nested Choices and Scene Calls inside options. #103 adds the
approved prompt row above the options: "+ Prompt", a narration/existing Character
picker, prompt text and removal. Commit and Cancel use the existing retained Beat
draft. Accepted prompts appear with the options in the illustrative preview;
manual option selection can expose a nested prompt without evaluating its guard.
#104 adds each guarded option's If false control with Hide (default) and Show
disabled. Commit/Cancel and refused drafts use the same existing Beat editor.
The inert preview labels availability as unknown and retains the false-condition
policy in hover/accessibility text; it does not infer values or allow game selection. Editing focus remains
separate from game sensitivity and picked state. Unsupported runtime templates
show a protected Source fallback reason. #105 adds Repeat this Choice to Then.
It edits the same ending Beat, preserves earlier Beats, and revisits the owning
menu with its prompt and reevaluated availability. Continue removes only the ending;
Return retains its caller-sensitive meaning. Cancel and refused drafts retain the
existing draft protections; accepted edits use shared Undo/Redo and reopen. Nested
Choices own separate Repeat targets. Preview describes Repeat without executing it
or inventing current values. #106 adds the whole-Choice Picked options selector
with Show normally, Mark picked and Hide picked. New Choices start with Show
normally and record selections from their first visit. Existing unconfigured
Choices keep their source until an accepted policy edit. Stable source-backed
Choice and option UUIDs preserve identity through caption changes and reorder.
Mark picked keeps the native action selectable with a check; Show disabled rows
have a distinct lock. Hide picked takes precedence over disabled display,
and hiding the last selectable option continues after the Choice. Selection records
precede authored option Beats and use ordinary current-save, rollback-aware state.
Preview reports picked state unknown. Commit, Cancel, refused drafts, Source
fallback, shared history and reopen retain their existing owners. The implementation
uses schema 14 while preserving frozen older recognizers.

The approved [Choice preview A v2](design/choice-preview-correction/HANDOFF.md)
keeps the existing Game canvas on the left and puts the prompt, picked-state notice
and numbered options in one keyboard-scrollable summary on the right. Missing
prompts leave no empty row. Duplicate captions stay separate and numbered. Only
conditional rows say "Condition unknown"; Show normally adds no picked-state line.
The picked-state notice stays separate from the configured Mark picked/Hide picked
policy. Long text wraps and scrolls within the existing preview allocation. The
Game canvas retains background/Character media and the other-character-state notice;
the shortened background notice keeps its original reason in hover text.
The full Combined layout and palette remain with #110. Arithmetic uses the accepted
shared controls.
Until a capability exists, the editor says it is not built instead of showing a
working-looking control.

## Source workspace

Source is its own centre tab, not a toggle inside Story. It uses CodeMirror with file
tabs, Ren'Py highlighting and find and replace in the current file. A tab groups the
filename, draft marker and Close; overflow adds scroll controls and an Open files list.

Typing makes a session-local draft. Only Save Source or Cmd/Ctrl+S in Source accepts
it; changing tabs or workspaces, or closing a tab, keeps it. A dirty file shows
Unsaved Source draft with a crash warning. Close, project switch and exit offer Save
All, Discard All or Cancel. Saving keeps the caret, selection and native undo, including
after a refusal. View in Source selects the exact mapped range, and Source goes back to
the owning beat only when ownership is proven. An external change to a dirty file keeps
both texts; Apply Both appears only for proven non-overlapping changes and shows the
combined result first. [Source acceptance](TRANSACTIONS.md#phase-1f-source-acceptance-and-reconciliation)
and [ADR 0007](adr/0007-shell-save-command-ownership.md) own the rules.

## Branches workspace

Branches draws the saved Scene graph from the same flow Story writes, without dialogue
lines. The layout is deterministic and layered, with rounded orthogonal connectors,
arrowheads and route captions that keep their full text in details. An entry badge
appears only when the runnable `start` label proves it, and a missing or unknown
destination never gets an invented arrow. Arrow keys pan, `+` and `-` zoom and Home
fits the graph, with matching buttons.

The graph shows the last observed saved state with a status: Checking disk, Checked at
a time, Updated from saved edits or Could not refresh. A failed refresh keeps the last
graph and says so. Edit Choice or Jump opens the Scene controls. A graph over the
limits offers Source instead of truncating. [ADR 0010](adr/0010-local-project-safety-and-observed-flow.md),
[observed flow](ARCHITECTURE.md#observed-flow-implementation-g1-obs) and the
[flow projection](DATA_MODEL.md#shared-flow-projection-1g1) own the rules.

## Characters, Assets and Variables

These libraries share one pattern: a filterable grid or list, whole-row selection, an
optional inspector with Close, and create or edit dialogs with guarded Cancel, Escape
and focus return. Technical names follow the
[technical-name rule](DATA_MODEL.md#authority-and-identity), are fixed after creation
and are labelled that way.

- **Characters.** Rows show a thumbnail or initial. Fields are technical name, display
  name, dialogue colour and default appearance. The image list is called Appearances;
  Add Appearance imports an image and asks for an expression name. Previewing an
  appearance never changes the default. Character cards and the project Lorebook are
  edited directly with Save changes and Discard changes, as set out in the
  [reference contract](REFERENCE_LIBRARY.md#walkthrough-redesign-contract--2026-10-15).
- **Assets.** Categories are All, Backgrounds, Character images, Music and Sound
  effects, with a visible drop or Browse area. Both open the same staged import dialog,
  which previews each image with its size and fields and writes nothing until
  confirmed. Failed rows stay; successful files are not retried. Assets does not play
  audio.
- **Variables.** A table shows name, type, initial value and Edit, plus the Set
  variable beats that assign each variable. Types are yes/no, whole number, decimal and text. The selected inspector edits the declaration default. Names and types stay fixed. Save Default accepts finite decimals as numbers and keeps whole-number text exact. Cancel restores the accepted default. Creation and default edits use the shared session Undo/Redo history.

## Assist and AI settings

Assist is an action panel beside the writing, not a permanent chat. Story offers
Rewrite dialogue, Continue Scene, Edit Scene, Draft Character card and Draft lore
entry, and each Chapter offers Draft Scene. The nonmodal panel names its target and
moves through Review complete send, Generate proposal and review. Before sending it
shows the destination, model and locality, selected references and exclusions, the
effective prompt and the token budget, with the full request in details. Review leads
with plain prose and shows exact Source and metadata changes on request. Each action
has its own accept label, and acceptance is one transaction with Undo. Generated cards
and lore entries save as proposals, and approving one is a separate decision. Focus
enters Assist and returns to the control that opened it.

Settings → Application → AI providers sets up a profile in this order: name, endpoint
(private-network HTTP needs a separate opt-in), API key through a native dialog,
Connect, model, then Save profile. The key never returns to the web view. Opening or
saving Settings sends nothing; Test response format is a separate explicit request.
The header's Studio request panel sends only a fixed test message. Current project →
System prompts edits each action's prompt, with Restore baseline. The header Undo
reverses a prompt edit and opens System prompts.

[PROMPTS_CONTEXT](PROMPTS_CONTEXT.md) owns each action,
[REFERENCE_LIBRARY](REFERENCE_LIBRARY.md) owns cards and lore,
[ADR 0011](adr/0011-ai-settings-secrets-and-reference-storage.md) and
[ADR 0013](adr/0013-provider-request-and-transport-contract.md) own keys, providers and
model settings, and the [Phase 2 brief](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/active/phase-2-initial-llm-assistance.md)
owns current Settings scope.

## Runtime and diagnostics

Validate, Run and Stop stay in the header. Validate compiles, then lints only if
compilation succeeds; Run starts the normal entry point without an extra lint. Before
either, unsaved Source offers Save All, Use saved revision or Cancel, and pending Scene
input offers Return to Scene, Use saved revision or Cancel. Nothing commits silently.
Inspecting or editing a project never runs it.

The Runtime drawer shows status, output, launch details and SDK and trust controls on
demand and survives workspace changes. Runtime state, launch revision, file
freshness and save state have separate labels. A reported runtime error stays visible
even when Ren'Py exits with 0, and closing the drawer does not stop the game. Scripts
stay editable during play, asset changes need Stop first, and Stop then Run loads the
latest saved scripts. Closing the project or app during play offers Stop and continue
or Cancel. SDK output is inert text. A diagnostic location opens Source only after the
checks in the [diagnostic projection](DATA_MODEL.md#runtime-diagnostic-projection-1g2b).
[ADR 0008](adr/0008-controlled-runtime.md) and
[runtime presentation](ARCHITECTURE.md#runtime-presentation-and-diagnostic-authority-1g2b)
own the rules.

<a id="screenui-designer"></a>

## Screens designer

Screens is a hierarchy and constraint editor, not a freeform drawing canvas. Authors
choose a screen, design it and connect its actions.

| Component hierarchy | Constraint canvas | Properties and source |
| --- | --- | --- |
| Frames, containers, text, images, buttons, bars, grids, viewports, components | The game resolution with layout guides and interaction states | Layout, style and action fields; synchronised screen language; protected custom regions |

The canvas shows images from the pinned-SDK helper. Unsupported content shows an
explicit unavailable state, and an older image is marked stale and gives no editing
geometry. Number and resize drafts render before acceptance; canvas-only sample text
and button states never change source. Fit and 100% scale the same composition.
Unsupported code stays in place and marks only its region as partly visual. Story
offers Show screen, Hide screen and Call screen for owned parameterless screens; Call
waits for Finish interaction. The [Screens contract](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/reference/phase-3b-screens.md)
owns requirements, including its
[creation and reuse controls](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/reference/phase-3b-screens.md#implemented-creation-and-reuse-controls),
and [ADR 0021](adr/0021-separate-renpy-canvas-helper.md) owns the canvas helper.

Textbuttons and imagebuttons use the approved A2 / `equation-v2` action editor.
One ordered action expands at a time. Numeric Set variable actions offer Set to,
Add, Subtract, Multiply, Divide, Floor divide and Remainder, plus numeric variable
suggestions and selection grouping. Change an action kind by removing it and adding
the required kind. Boolean and text actions keep literal fields. Core supplies types,
capabilities, diagnostics and unknown state. Defaults never stand in for current
route values. Decimal results require decimal targets; no rounding changes the type.

Draft validation uses the original source, authoring and target revisions and adds
no history. Apply performs fresh admission against those same revisions. Invalid,
stale, dirty and session refusals retain the draft. Cancel discards that button's
pending changes. Source-only timing explains why the action stays protected and
provides Source navigation. The existing eight-action, target-context and Finish-last
rules remain in force. Each accepted action reads current values when it runs.

Decimal variables can appear in numeric conditions, text tokens and editor samples.
Text insertion replaces the selection and returns the caret after the token. Samples
and canvas selection execute no actions and write no source. Invalid sample text
retains the last valid value. Bars continue to list whole-number variables only.
The [#97 evidence](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-97.md) separates production/core proof,
A2 comparison and the remaining native, SDK and human acceptance limits.

## Later workspaces

- **Timeline** authors visual-novel staging, not video compositing, with tracks for
  background, characters, camera, effects, music, ambience, sound, voice, dialogue and
  movies. Static staging happens on the Story stage: drag, aspect-locked resize, and
  position, anchor and scale fields, without keyframes. The
  [3C contract](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/reference/phase-3c-timeline.md#selected-staging-native-media-and-idle-playback)
  owns it.
- **State and Run From Here** label reachable, saved, synthetic and contradictory
  states distinctly and show the effective variables and facts before launch.
  Development content never ships in a release. The
  [3D contract](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/reference/phase-3d-state-run.md) owns it.

## Accessibility and resolution checks

- Author at the project resolution (1920 × 1080 by default) and preview other window
  sizes without changing project settings.
- Full keyboard traversal, visible focus, labelled controls, logical reading order,
  resizable text and panels, and reduced motion are acceptance requirements.
- Colour always has a text label, number or icon beside it. Information shown only on
  a canvas or stage also has a list or hierarchy form.
- Beat reordering has keyboard alternatives to dragging, and scene, asset and Choice
  pickers are keyboard searchable.
- Narrow windows protect dialogue and beat readability before stage size.
