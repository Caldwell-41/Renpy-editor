# Story authoring experiments

[Issue #82](https://github.com/Caldwell-41/Renpy-editor/issues/82) owns the selected
fourth combined Story mock. Cue sheet, Shot reel and Stage tracks remain unapproved
reference workspaces. Production Story is unchanged.

The earlier three-mock study used independent Opus/Sol councils. Its requested
Rounds 3 and 4 and later Round 5 are complete; a subsequent score-only rescore of
fixed source `bbd5a4dd` is recorded in chat. Those grades do not qualify the new
fourth mock. Historical evidence remains available locally.

## Selected next iteration

Kris selected a fourth combined mock, owned by the current section of
[Issue #82](https://github.com/Caldwell-41/Renpy-editor/issues/82). It keeps Stage
tracks' game window/sidebar and switches its bottom panel between Tracks and Reel.
The new Astra high chat owns that iteration, its grill-me clarification and the
three-member council with the revised rubric. The earlier three mocks remain
unapproved references; their completed comparison below is historical.

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

Run the focused check from the repository root with
`node app/design-lab/screens/story-revamp/combined-check.mjs`. It expects port
5176 and uses the shared Chrome launcher. On macOS it requires scoped execution
outside the agent sandbox. Current evidence is under ignored
`.toolchains/story-combined/initial/`. The initial pass covers both bottom modes,
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

The combined check accepts `STORY_CHECK_OUTPUT=round-2-captures`. Its 22 groups
pass and produce 107 PNGs. It adds direct
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
