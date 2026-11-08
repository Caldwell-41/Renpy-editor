# Story authoring experiments

[Issue #82](https://github.com/Caldwell-41/Renpy-editor/issues/82) owns the selected
fourth combined Story mock. Cue sheet, Shot reel and Stage tracks remain unapproved
reference workspaces. Production Story is unchanged.

## Approved: Story Combined v1

Kris approved the combined layout on 2026-11-08. Refer to it as **Story Combined v1**:

| Identity | Value |
| --- | --- |
| Design Lab screen and layout | `story-revamp` / `combined` |
| Approval revision | `combined-v1` in [approval.json](approval.json) |
| Source | commit `6ecf6470`, fingerprint `a526a4da…` (full values in the record) |
| Captures | [captures/combined-v1/](captures/combined-v1/) |
| Preview | `/preview.html?screen=story-revamp&variant=combined&state=populated&theme=dark&viewport=wide` |

The record lists the agreed behaviour and known deviations; this file holds the detailed
decisions below. Interaction references that are not recorded captures:
[nested branches](captures/combined-v1/combined-v1-populated-dark-wide-nested.png),
[Choice editor](captures/combined-v1/combined-v1-populated-dark-wide-choice.png) and
[Writing focus](captures/combined-v1/combined-v1-populated-dark-wide-focus.png).
Approval is a design decision, not an implementation; later work follows
[design integration](../../../app/design-lab/INTEGRATION.md).

The earlier three-mock study used independent Opus/Sol councils. Its requested
Rounds 3 and 4 and later Round 5 are complete; a subsequent score-only rescore of
fixed source `bbd5a4dd` is recorded in chat. Those grades do not qualify the new
fourth mock. Historical evidence remains available locally.

## Production release scope

In the implementation interview on 2026-11-08, Kris selected the complete approved
Story Combined v1 experience as the release target. The approved Choice behaviour
and arithmetic must work before that release. A layout-only build is an intermediate
review checkpoint, not a separately shipped version with those features deferred.
Implementation can proceed in separately testable slices.

[Choice #98](https://github.com/Caldwell-41/Renpy-editor/issues/98) and
[arithmetic #87](https://github.com/Caldwell-41/Renpy-editor/issues/87) retain their
feature requirements and acceptance ownership. Story Combined v1 can ship when the
shared arithmetic core and Story controls qualify, before the new Screens arithmetic
controls are finished. Screens arithmetic retains its own acceptance work, and #87
stays open until both Story and Screens meet its requirements. Shared-model changes
must preserve existing Screens behaviour.

The app-wide Brass and slate palette is a separate implementation slice required
before or with this release. [UI.md](../../UI.md#palette-brass-and-slate) owns its
scope, including both themes and the known text-contrast fixes.

This interview records decisions only; implementation and publication still need
Kris's go-ahead.

### Implementation prerequisites

Live Story layout integration is blocked until the required Choice and Story
arithmetic operations are implemented and qualified. Complete #98 Stage 1 before
Stage 2. Use #87's [backend handoff #89](https://github.com/Caldwell-41/Renpy-editor/issues/89)
for the shared arithmetic core and Story operations. Their existing specifications
remain the requirement owners; this dependency does not create a second feature spec.

Before layout integration, verify source edits, saving, shared Undo/Redo, reopening
and the required game behaviour through the existing tests. Then connect the approved
Story layout to those tested operations. The palette remains a separate slice.
Completion of all Screens arithmetic work, or closure of #87, is not a prerequisite.

Record these dependencies in the future Story integration task when Kris authorizes
publication. This local decision does not create or change GitHub tasks.

### Stage proportions in production

Kris confirmed that the game stage keeps the project's actual width-to-height ratio.
The approved mock's 16:9 stage represents its 1920 × 1080 sample, not a restriction
on other project resolutions. [The Story layout contract](../../UI.md#layout) owns
the fit rule. Keep the approved mock and its captures unchanged.

### Draft navigation in production

Kris selected retaining unfinished beat edits while navigating between beats and
branches. [Beat drafts](../../UI.md#beat-drafts) owns the interaction rules. The
existing production navigation guard must change during integration; preserving
drafts must not weaken source validation or the shared transaction layer.

Kris also selected [one chronological Story Undo order](../../UI.md#story-undo)
for draft and committed edits, with the same behaviour from the button and keyboard
shortcut. Switching authoring workspaces preserves the order of edits in shared
project history. Undo names its action and reveals the affected item in its workspace.
The earlier proposal for separate field and project Undo was not accepted.

## Selected direction

Kris selected a fourth combined mock, owned by the current section of
[Issue #82](https://github.com/Caldwell-41/Renpy-editor/issues/82). It keeps Stage
tracks' game window/sidebar and switches its bottom panel between Tracks and Reel.
The new Astra high chat owns that iteration, its grill-me clarification and the
three-member council with the revised rubric. The earlier three mocks remain
unapproved references; their completed comparison below is historical.

## Post-delivery revision

Kris's feedback on the delivered mock selected a revision of the combined variant only.
Issue #82 records the decisions. The three reference variants are unchanged.

- Colour carries meaning. Each mode has its own Brass and slate palette, scoped to the
  combined shell in `combined-revision.css`. Each branch arm has one of four colours, in
  scene order. Character names use their character colour. `docs/UI.md` now names Brass
  and slate as the app palette; the shared production tokens still hold copper and teal
  until integration.
- The Branch path bar only switches branches. Each open condition shows its number, its
  If test and a two-way switch. Insert actions moved to the branch boundaries.
- Tracks and Reel draw a coloured route line above each open branch, with a light tint on
  its columns. Slim `+` markers add the first beat and a beat after the condition; a
  branch end keeps its `+` only before a Jump or Return, since the last beat's own `+`
  adds the last beat. Writing focus turns the line vertical and labels the markers. Two route rows
  fit inside the old panel height, so the stage sizes are unchanged.
- Beat editors use pictures. Backgrounds and expressions show a thumbnail and Change,
  which opens a picker sheet over the sidebar. Pointing at a picture previews it on the
  stage; click applies it; Escape keeps the current value. Speakers and characters use a
  portrait list. Short choices use switches.
- Choice options are numbered blocks in their own colour. The destination is a scene card
  (opening background, name and first line) that opens a scene sheet with New scene. The
  condition reads as one line, "Always available" or "Only when ...", and the rule builder
  opens on request. Focusing or pointing at an option marks its button on the stage.
- Choice options follow #98 (handoff #99). Each option owns ordered Beats, stored like a
  condition branch, so option paths appear in the Branch path bar, Tracks, Reel and Writing
  focus. "Then" edits only the body's last Beat: Continue after the Choice (no ending Beat),
  Go to a scene (Jump), Repeat this Choice or Return (to the caller, or the main menu).
  Call is an ordinary Beat inside the body. Earlier Beats are never removed.
- The prompt is narration or a Character line shown with the options. Each guarded option
  chooses Hide (default) or Show disabled when false. The whole Choice has Picked options:
  Show normally, Mark picked or Hide picked. Options with the same text show a note and
  keep separate identities (the option's body id), so picking one never marks the other.
- "Preview options" in the stage footer sets illustrative assumptions per option
  (condition unknown, true or false; picked earlier in this save). It is not a playthrough
  or a save, and it never enters Undo. The game window then shows hidden, disabled (lock),
  marked (✓) and unknown (dashed) options. When nothing can be picked, the stage explains
  that the story continues after the Choice and records no pick.
- Samples: "The last service" 08 shows a Character prompt, a boolean option and an empty
  option meeting at 09, a dialogue/Call/narration body, a visible locked option and a
  hidden secret option. "A familiar stranger" 03 shows repeatable questions with Leave,
  Mark picked with two "Ask about the station" options, a nested condition and a nested
  Choice.
- Loomlight's Choice is jump-only today (`ChoiceOption` has no body; `parse_menu` refuses
  other forms; DATA_MODEL treats Choice as terminal). #98 Stage 1 (bodies, prompt,
  Hide/Show disabled) and Stage 2 (Repeat, Picked options and saved per-option history)
  are unbuilt; the editor says so.
- Add a beat is one compact dialog. Click or Enter adds the highlighted beat; Escape or
  Close cancels. Replacing an ending is named in the destination line.
- Writing focus Tracks shows all six lanes from 900 px wide. Dark branch colour 4 is
  `#7fbf73`, so it no longer reads as the brass selection.
- Conditions use a rule builder that follows ADR 0014's typed model. Each rule picks a
  project variable (yes/no, whole number or text), a preset test and a value. Numbers
  offer `= ≠ < ≤ > ≥`; yes/no and text offer equality only. One All/Any switch joins
  rules. Each branch shows its Ren'Py line. Mixed groups and unreadable Python stay
  read-only with Edit in Source; the builder never writes raw Python. Choice "Only when"
  uses the same builder. The variable list can create a variable in place, with Undo.
- Set variable follows #87 (handoff #88): Set, Add, Subtract, Multiply, Divide, Floor
  divide and Remainder, with a number or formula using declared numeric variables and
  brackets. Kris chose the equation row (`trust [+= ▾] [formula]`); the operation menu
  lists all seven with an example each. Suggestions appear while typing a name. Feedback names the result type and refuses a decimal result for
  a whole-number variable, unknown or non-number variables and zero divisors. "On this
  route" uses only values set earlier on the route, never the starting default, so most
  values read "unknown". Calculations the editor cannot show (such as `max()`) stay
  read-only with Edit in Source. Decimal is a new variable type. `combined-arithmetic.ts`
  holds the parser, type rules and Python division semantics.
- Choice options move up and down in the editor. Moving keeps each option's body, which is
  its identity, so preview picked state follows the option, and Undo restores the order.
- In Tracks and Reel an empty option or branch is one beat-wide slot that holds its name,
  where it goes next and "+ Add a beat", so the two labels no longer overlap.
- The Branch path wraps instead of scrolling sideways. Each condition or Choice stays one
  unit and never overlaps another. Choice options show only their number unless open.
  When the path needs more than one row, the bottom panel grows by those rows (up to
  three, then the path scrolls) so Tracks keeps every lane. This deliberately breaks the
  earlier rule that branch navigation never shrinks the stage: with deep nesting or at
  compact width the stage loses about 30 px of height per extra row. One-row paths keep
  the stage at 974 × 548 and 633 × 356. Kris accepted this on 2026-11-08.
- Writing focus can resize the sidebar and each Tracks lane (Words fills the rest) by
  dragging a grip or with the arrow keys. Escape cancels a drag and double-click resets.
  Widths are a session view preference, outside Undo.
  When a wide sidebar or a scroll hides lanes, the cut edge gets an accent line and a
  header button naming them ("Sound, Flow ›"); clicking it scrolls them into view.
- Branch route lines share the Tracks/Reel row (Kris chose this over one or two reserved
  rows), so a scene with no open branch loses no height and Words shows three lines. A
  6 px gap keeps branch labels clear of the Branch path. The legend moved into Key.
- Kris approved the #88 and #99 mock work on 2026-11-08, and both handoffs are closed.
  Source, runtime and backend acceptance stays with #87 and #98.

GPT-6.1 Sol generated the fictional art in `art/`; its README lists the files and checks.

## Fourth combined mock

The `combined` variant keeps the Stage tracks game window and selected-beat editor.
Tracks and Reel share the same model, selected beat, expanded branches and insertion
target. Kris chose Tracks as the initial view, equal panel heights, and branches
expanded within the surrounding scene. Only the bottom-view preference uses session
storage; all story edits remain in memory.

Conditions sit above the bottom panel and at the top of Writing focus. Branch
controls open the selected body; entry and exit markers distinguish insertion
inside a branch from insertion after its condition. The Reel retains surrounding
scene beats. Writing focus hides the stage and retains the selected-beat editor.
Add a beat has common actions, a searchable list, descriptions, explicit insertion
ownership and ending-replacement warnings. Choice is nonterminal in this variant:
authors can add a following beat for the no-available-options path. Jump and Return
retain their ending behavior. The three reference variants keep their behavior.

Run `npm run design:dev -- --port 5176` in `app/`, then open
`/preview.html?screen=story-revamp&variant=combined&state=populated&theme=dark&viewport=wide`.
The selected preview is also available on LAN port 5176. Port 5175's three-reference
server is unchanged. Standalone exports include `combined.html`.

Checks run through the Design Lab harness from `app/`, which starts its own server and
browser. On macOS they need scoped execution outside the agent sandbox. Add `--capture`
for review screenshots.

```sh
npm run design:check -- story-revamp combined --interaction ./screens/story-revamp/combined-check.mjs
npm run design:check -- story-revamp <cue-sheet|shot-reel|stage-tracks> --interaction ./screens/story-revamp/check.mjs
```

Earlier rounds ran the combined check as a standalone script; their evidence is under
ignored `.toolchains/story-combined/`. The initial pass covered both bottom modes,
Writing focus, nested draft/context retention at three sizes, every beat editor,
scene validation/creation, branch moves, Choice/Call destination navigation,
enlargement, dialogs and Undo. The normal stage measures 974 x 548 at 1600 x 1000,
633 x 356 at 1100 x 720 and 486 x 273 at 560 x 640.

The 48-case sample/theme/mode matrix, all three reference authoring journeys and
in-memory production-build exclusion also pass. Round 1 reviewed `45390124` and
requested changes; its immutable candidate and reports live under
`.toolchains/story-combined/round-1/`. No approval is implied by browser checks.
Earlier failed runs are retained under numbered
`diagnosis-` directories, including the corrected focus-grid and compact-menu
positioning defects, search-field Escape behavior, and source-dialog selector error.

The next candidate fixes Tracks selection hidden by sticky lane labels and Reel
Writing focus scrolling the wrong container. Redraws preserve Reel and Conditions
scroll positions; compact Writing focus opens with the editor below Conditions.
Condition edits update every displayed branch label. The picker describes the
actual ending destination or replacement, and ordinary insertion names the
preceding beat. Writing focus uses a wider editor and taller prose field. The
header Add button stays fixed, Next line has secondary emphasis, and Delete sits
last in beat menus. Branch-entry markers also name the continuation.

Round 2's combined check wrote to `round-2-captures`. Its 22 groups
passed and produce 107 PNGs. It adds direct
visibility assertions before any helper scroll, condition-edit focus checks,
ending replacement/empty-search checks and matching property-field heights.
The 48 boundary renders, three reference journeys, exported fourth-mock draft and
reset guards, production exclusion and static checks also pass.
Round 2 reviewed `8efc888c`; its candidate and terminal reports remain immutable.
Kris supplied three favorable UI examples after that review and increased the
new-mock council cap to six rounds. The ignored `story-combined/references/` folder
holds those images and his six notes for subsequent councils. They inform control
grouping, emphasis, alignment, discoverability and interaction states, not layout
or engine scope.

The next iteration uses the Conditions strip above both bottom presentations as
one branch-switching owner. Condition summaries show the chosen branch. Open
conditions expose insertion through explicit Inside/After markers, rather than a
misleading gap at branch entry. Insertion destinations derive from the live model
when used, so editing a condition cannot leave an old path in a dialog or message.
Screen summaries show their command once. One global Add action remains alongside
contextual gaps and branch insertion actions. Dialogs use one cancellation control.

Writing focus keeps Conditions at the top. Desktop prose fills its editor column;
compact places independently scrolling editor and beat list together below the
strip. Clicking a row edits it without losing list scroll. Neutral metadata and
branch separators leave accent emphasis for selection and primary actions.
This synchronous memory mock has no loading operation; no fake loading control is
introduced. Empty, validation-error, selected, disabled and keyboard-focus states
remain part of the browser evidence. The next candidate passes 25 focused groups,
including live nested insertion labels in both presentations/focus states, exact
compact pointer-scroll retention, longer prose, keyboard navigation, single screen
labels and explicit branch ownership. Its normal stage dimensions are unchanged.
The frozen Round 3 evidence includes 123 PNGs and passing boundary/reference/export
reports. The diagnostic record in ignored `story-combined/SCROLL-DIAGNOSIS.md` explains the
browser scroll-anchoring correction and retains unsuccessful hypotheses.

Round 3 reviewed `f07cb4ed`. An opened Else-if could outlive its model branch after
removal or Undo and crash rendering. The next candidate stores branch view state
with history, validates it before rendering and tolerates missing summary branches.
Responsive redraws now preserve the editing surface, caret and selected-row visibility.
The new checks exercise removal and Undo/Redo in both presentations and focus modes.

Branch entry now offers First beat at index zero. End markers offer Last beat inside
the branch and After condition outside it. Continuation is one link, and selection
reveal keeps following boundaries visible when they fit. Narration remains Narration
through Next line and its visible keyboard shortcut. Compact Conditions expose edge
scroll buttons, keyboard switching keeps focus there, and short editors leave more
space for the list. Protected-menu restrictions have inline explanations. Choice
buttons align consistently, with restrained destructive styling. Empty scenes offer
background insertion once on the stage and writing actions in the editor.

Round 4 evidence contains 27 passing focused groups plus two extra navigation cases,
with the unchanged stage sizes, 48 boundary cases, three reference journeys, exported
sample guards and production exclusion. These checks do not imply council approval.

Round 4 reviewed `2eb1f37d`. Compact Writing focus's toolbar retained a stacking
priority above the beat-menu heading, covering enabled actions in short editors.
The next candidate removes that priority and checks each menu item's pointer access
in both modes. Protected Delete shares the other disabled states and its restriction
is explicit. Reel text has room beside insertion controls; selection aligns whole
columns. Empty-condition summaries and branch-ending hints agree across the strip,
entry, exit and list. Writing help describes a line break, Choice actions fit their
labels, condition controls align and the scene drawer uses a neutral New scene.
The 29 focused groups pass, including actual affected menu commands, long Reel prose
and column alignment. Stage dimensions and the common panel height are unchanged.

Round 5 reviewed `c221977c`. All gates pass, but the full council target remains
unmet. The final authorised candidate fixes complete-line truncation at laptop size,
normal compact menu layering and partial first columns at maximum strip scroll.
Entry hints name nested exits only when present; outside continuation links name
the condition. Empty scenes retain the selected Return explanation and menu below
start-writing actions. Return summaries are shorter, editor headings align and Reel
insertion controls use less chrome. Its 31 focused groups include three-point menu
hit tests in both compact views, long-prose vertical fit, all-size strip-end geometry
and empty-ending access. Eight direct/nested Jump/Return cases pass. Stage size,
common panel height and simulation scope remain unchanged. Round 6 is the last
review authorised by the current six-round cap.

## Final council outcome

The fourth mock is delivered at reviewed code `214186ab`. All three final members
meet the target and all readiness gates pass. Six rounds completed, with immutable
candidate/source hashes and terminal reviews. The delivery chat records the actual
round table. No source edits follow the final review. The round cap is exhausted;
production approval and integration remain unselected.

The final reports retain these nonblocking items:

- An outer exit can say Continue at 07 without repeating a nested Jump/Return exception.
- Reel insertion controls have no hover response.
- Return Reel cards put the summary in their small label slot and leave the body empty.
- Jump/Return exits repeat After wording for outside navigation and insertion.
- Long game-window text can clip at laptop size; full text remains editable in the sidebar.
- Otherwise condition cards omit their If test, though the Conditions strip shows it.
- Writing focus lists can show a partial top row under the header.

Final evidence is in ignored `story-combined/round-6/`, with 169 PNGs, the 31-group
journey, eight ending cases and the 48-render boundary/reference/export report.
The reviewed standalone package is `story-combined/story-combined-reviewed.zip`.
The fourth mock remains on port 5176 and the original three on 5175. Reload/reset
loses fictional story edits; only the view preference uses session storage. Real
project saves, engine execution and native acceptance were not exercised.

## Three-mock reference

Claude Opus 5.5 at high reasoning designed this revision after inspecting the
existing mocks, Story and 3C/3D requirements, and seven selected reference images.
Nongine's script beside a game window and Visual Novel Maker's stage/script
relationship informed the layouts. The parent implemented the designs in the lab.

- **Cue sheet** puts a large stage on the left and a complete editable script on
  the right. Speakers align with their lines. Choices, conditions, state and flow
  edit directly in their script rows. Media fields open below the stage; compact
  windows and Writing focus put those fields inline. This favors reading and
  revising surrounding lines.
- **Shot reel** uses the largest stage, a slim property dock and a short ordered
  beat reel. On desktop, dialogue is edited in the game's proportioned say box.
  Hide text box clears the composition and moves writing to the dock. Compact
  windows use the dock below the stage. This favors composition and direct editing.
- **Stage tracks** puts the stage and an editor above statement columns for
  background, character, words, sound and flow. Selecting a column moves the
  playhead. A manual branch band changes the visible source body. Writing focus
  presents beats as rows. This favors seeing which beat changes a scene's contents.
  Columns have no elapsed time, playback or keyframes.

All three keep the scene chooser closed by default. It opens as an overlay without
shrinking the stage. Navigation starts collapsed, comparison controls stay in the
footer, and Enlarge stage preserves the current beat. The stage keeps the game's
16:9 aspect ratio. Authoring forms remain outside it; only the game dialogue box
and game choice menu overlay characters.

## Open the mocks

Run `npm run design:dev` from `app/` with the pinned Node tools. The screen is
`story-revamp`; its variants are `cue-sheet`, `shot-reel` and `stage-tracks`.
For example:

`http://127.0.0.1:5174/preview.html?screen=story-revamp&variant=cue-sheet&state=populated&theme=dark&viewport=wide`

The footer changes layouts. The lab also offers empty, nested-branch and protected
source samples. Changing layout or sample resets fictional content after guarding
edits. Writing focus preserves the selected beat, branch and edited content.

For standalone review files, run
`node design-lab/screens/story-revamp/export.mjs` from `app/`. It writes HTML files
under ignored `.toolchains/story-revamp/`. The hosted lab uses the full browser
window; standalone exports include an additional sample selector.

## Interactions and limits

Create or rename a scene, write dialogue/narration, search for and insert beats,
edit media and screen statements, create guarded choices and destination scenes,
write in nested bodies, move or delete eligible beats, and undo/redo. Every insert
names its source body and position. Choice/Jump/Return replace that body's ending.
Shift+Cmd/Ctrl+Enter adds dialogue with the last dialogue speaker on the selected
source path. Cmd/Ctrl+Enter closes
the typing burst. Slash in an empty line replaces that line through the picker.

Selecting a visible character or the background identifies its contributing beat.
Edit that beat or explicitly add a change before the current beat in the same body.
An "In effect" list links media to the beats that set it. Actor and appearance
changes use distinct fictional vector samples. A new Background clears characters.
A gesture does not silently rewrite an earlier beat. Free dragging and resizing
are not implemented. Protected source stays read-only. The sample Assist flow
prepares, reviews and accepts a fictional proposal and sends no model request.

All changes stay in browser memory. The scene uses original vector sample art,
not Ren'Py rendering. The selected source path supplies illustrative cues; no
conditions or variables are evaluated, Calls are not followed, and unresolved
branches/custom source/Calls remain partial or unknown. Manual preview choice is
separate from the editing target. Audio is not played.

These mocks do not prove source transactions, native behavior, durable saves,
external edits or recovery. Chapter lifecycle, branch unwrapping, the full Assist
catalogue and call-stack navigation remain production requirements. No project,
provider, SDK or native game operation is performed.

Future drag/resize belongs on the large stage. Appearance, idle and animation fields
fit in the selected-object dock. Timeline can open for the selected beat; ordered
tracks do not substitute for its interaction boundaries or source contract. State
provenance and supported Run From Here need deliberate inspection and launch flows.
These connections are notes, not working-looking future controls.

## Evidence and selection

Current refinement evidence lives under ignored
`.toolchains/story-revamp/council-v3/`. Each variant has an initial council report.
`revised/MANIFEST.md` records 92 browser screenshots and the original failures.
`candidate/` passes the 72-render matrix and full tracked interaction journey.
Its measured stages meet all three size requirements, with Stage tracks measuring
622 × 350 on laptop after expanding its dock to keep every track row visible.
`closure/` fixes remaining text-field clipping and keyboard new-line focus. Its
tracked journey and active-writing checks pass for all variants at wide and compact
sizes. Fresh main/focus screenshots accompany both passes.
Earlier evidence remains in its original folders. Round 3 reviewed `223c16ec`,
Round 4 reviewed `98c9cc9f`, and Round 5 reviewed `e7e7f216`. Each variant has six
terminal reports for these rounds. The reviewed Round 5 source and evidence remain
in `final/`; current post-review corrections are separately verified under
`round-5-fixes/`. Its manifest owns checks, fingerprints, captures and diagnostic
limits. Do not assign those changes a hypothetical council score.

The last fixes reveal newly created editors from enlargement, preserve long-Choice
scrolling and keep menus above dialogue, focus beats without fields, rank visible
commands before aliases and start Else-if tests blank. Stage-object changes are
offered only when valid before the insertion point; otherwise Edit is primary.
Preview controls, compact routes, row-number descriptions, tracks keyboard/wheel
access and branch-field width are clearer. No future engine features were added.

The earlier selection-check brief said eleven cases, but its report has ten. Two
Round 3 Opus progress snapshots were replaced by recovered terminal results; some
Round 4 reviewers saw the progress files. Round 5 Shot Opus disclosed seeing one
Else-if finding line from Sol and excluded it from its own findings. Original
reports and limits remain retained.

### Historical baseline

The original set at local commit `1c6ed025` received two council review rounds.
Those scores and checks apply to that original set. Its review files and captures
are retained under ignored `.toolchains/story-revamp/revision-1/`, alongside the
Git history. No design was approved. This revision follows Kris's subsequent
feedback and Opus's high-reasoning design pass, rather than claiming the earlier
scores for changed layouts.

The browser matrix passes 72 renders across three variants, four samples, two themes
and three window sizes, plus the create/write/insert/focus/history journey. Terra
inspected all nine dark visual captures and the focused views. Stage dimensions
measured in CSS pixels are:

| Variant | 1600 × 1000 window | 1100 × 720 window | 560 × 640 window |
| --- | --- | --- | --- |
| Cue sheet | 988 × 556 | 654 × 368 | 486 × 273 |
| Shot reel | 1216 × 684 | 718 × 404 | 486 × 273 |
| Stage tracks | 1024 × 576 | 633 × 356 | 486 × 273 |

Every stage preserves 16:9, fills the compact content width, and meets the intended
minimums of 960 × 540 on desktop and 620 × 349 on laptop. Editor/chrome hit tests
found no obstruction in the normal view. Dialogue, character ownership, manual
branches, focus/enlargement, scene-drawer behavior and resize/caret retention pass.
No continuously running animations or page exceptions were observed. A missing lab
favicon produced one console 404; this does not affect the Story mocks.

The first run caught compact Next dialogue clipping. The next pass caught duplicate
Cue sheet empty actions and compact start actions below the visible editor. Those
were fixed. After two Terra attempts, the parent closed the bounded empty-state and
standalone-footer findings with 15 focused cases and inspected their corrected
captures. Original failed checks remain in the ignored reports and delegate results;
a keyboard assertion whose inspection moved focus has its separate passing follow-up.

Typechecking, approval validation, repository validation and production-build
exclusion pass. Browser launches ran outside the macOS sandbox with scoped
permission, using check-owned browsers. The hosted Design Lab remains available.
Reports, screenshots and a review bundle are under `.toolchains/story-revamp/`.
All approval pointers remain null. Kris will choose the next iteration; no
production promotion or future engine implementation is selected.
