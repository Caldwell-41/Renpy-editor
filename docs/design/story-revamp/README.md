# Story authoring experiments

Issue [#82](https://github.com/Caldwell-41/Renpy-editor/issues/82) asks which Story
workspace makes scene writing and beat creation easiest. Three unapproved prototypes
use the same fictional story. The user will select one for further iteration.

Run `npm run design:dev` from `app/` and select **Story · New authoring experiences**.
The variants are `cue-sheet`, `branch-lanes` and `shot-reel`. For example:

`http://127.0.0.1:5174/preview.html?screen=story-revamp&variant=cue-sheet&state=populated&theme=dark&viewport=wide`

The floating comparison bar changes variants. The lab also offers empty, branching
and protected-source states. Variants reset the fictional sample. Writing focus
keeps the current content and tools while hiding the stage.

## Three different working methods

- Cue sheet uses aligned beat, speaker and content rows with a side preview. It
  tests writing speed and scanning. Dialogue is edited where it appears.
- Branch lanes places mutually exclusive bodies beside one another. Nested groups
  can open in a scoped workspace. It tests insertion ownership and comparing lines.
- Shot reel puts an authoring caption against the stage and an ordered statement
  reel below it. Focus removes the image and keeps the caption and beat controls.
  It tests visual composition and the cost of changing context while revising.

The council's shared recommendation was to test words, alternatives and the image
as three different starting points. Opus preferred script-first writing; Sol favored
testing the bolder image-first direction early. Normal Tab navigation is preserved
instead of adopting Opus's proposed Tab-to-change-type shortcut.

## Interactions and simulation boundary

Create a scene, write narration/dialogue, carry the speaker into the next dialogue,
find and insert beats, edit media properties, create guarded choices and destination
scenes, write in nested bodies, move or delete eligible beats, and undo/redo. Every
insertion names its body and position. Choice/Jump/Return replace the body's ending.
Protected source stays read-only. The sample Assist action has preparation, a
reviewable proposal and an undoable acceptance. It sends no request.

All changes live in browser memory. The preview is an illustration using original
vector sample art, not a Ren'Py rendering comparison or state reconstruction. Manual
preview selection is separate from editing ownership. Audio is not played. The
prototype does not prove source transactions, external-edit handling, recovery,
durable saves, native behavior or runtime acceptance.

The mock does not simulate chapter creation/reordering/deletion, branch unwrapping,
the full Assist action set, call-stack navigation, or recovery/conflict dialogs.
These remain product requirements. The new study tests the writing and insertion
experience rather than reimplementing every existing production workflow.

Future drag/resize and animation/idle controls belong to the stage and appearance
editor. A real Timeline can open for the selected beat. Provenance and supported Run
From Here need a separate state inspection step. These are design connections only,
described under More → Design notes. They are not working-looking future controls.

These experiments have their own screen/model so the earlier unapproved Story
comparison remains reviewable. They do not introduce another production story owner.
Production components, source services, native commands and approval records for
previous designs are unchanged.

## References and review

Both council members inspected the selected Naninovel, Visual Novel Maker, Nongine,
articy:draft X and Novelez screenshots before proposing the set. Borrowed ideas are
compact script rows, explicit insertion, document-style media cues and inline branch
editing. The screenshots are review inputs only and are not distributed as app assets.

Local export: run `node design-lab/screens/story-revamp/export.mjs` from `app/` using
the repository's pinned Node. It writes three self-contained HTML files under the
ignored `.toolchains/story-revamp/` directory. They can be opened without a server.
The export keeps the same renderer and offers the same sample and layout selectors.

## Local verification

The exported mocks pass 48 dark/light, wide/compact render cases in Chrome 156,
plus scene creation, inline writing, focus parity, music editing, undo, guarded
choices and explicit Otherwise-body insertion. The final focused reel check proves
selected beats stay visible after selection, next-line creation and mode changes.
Typechecking, Design Lab approval validation and an in-memory production build pass.
The production build excludes the new study.

The first visual pass found clipped caption content and a partly hidden next-line
control. Those were corrected, then a reel scroll reset was found and corrected.
Reports and original failure captures remain under `.toolchains/story-revamp/`.
These checks qualify browser samples only, not native or source behavior.

Run the browser verification command outside the agent sandbox from the first
Chrome launch on macOS. It uses a fresh check-owned browser. Stop and diagnose a
launch error before retrying; do not close user-owned browser processes.

## Council and selection

Two council review rounds are complete. Opus scored the set 6/10 then 8/10; Sol
scored it 8/10 then 9/10. Sol was satisfied in round two. Opus's final condition was
to fix empty-branch insertion and scene-level return selection in Shot reel. Both
were corrected by the parent and verified through the browser journey. No new
model score is inferred from that verification.

The review also corrected nested Cue sheet access, Undo context, guarded layout
switching, slash replacement, picker Enter, editor focus, ancestry and scene-rail
behavior. Six final focused visual cases pass at 1100px and 560px, including editing
the nested Cue sheet line, compact branch context and unobscured empty-scene actions.
There are no outstanding comparison blockers. Further visual preferences belong to
the user's selected iteration. No design is selected or approved.

The local verification driver uses the shared Design Lab browser-launch guard
introduced by concurrent browser maintenance. Only that prerequisite is needed by
this study; the other maintenance edits are outside the prototype checkpoint.
