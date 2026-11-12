# Story Save refusal study

[Issue #114](https://github.com/Caldwell-41/Renpy-editor/issues/114), decision 14,
asks how a refused Story Save shows several failing beat drafts. This Design Lab
screen, `story-save-refusal`, compares three answers.

Kris approved variant 1 on 2026-11-12: `story-save-refusal` / `marked`, revision
`marked-v1`, named Count and failure marks
([decision](https://github.com/Caldwell-41/Renpy-editor/issues/114#issuecomment-6820468198)).
Variants 2 (`stepper-v1`) and 3 (`first-v1`) are not approved and stay in the lab as
drafts. The [approval record](approval.json) sets `currentApproved` to `marked-v1` and
pins the reviewed source at commit `3f64ad9db849f459de0f12b17e57f0c4678025e5`. That
source predates the Brass and slate palette, so the lab reports "source changed" for
the current tree. Compare against a separate checkout of that commit.

The rules come from [UI.md](../../UI.md#saving-story-drafts): Save checks every
draft, writes none of them if one fails, keeps all drafts and reveals the failing
draft with its error. Conflicts use the approved B editor from
[story-draft-conflict](../story-draft-conflict/README.md) (`compact`, revision
`compact-v2`). The layout is Story Combined v1 (`story-revamp` / `combined`,
revision `combined-v1`), reduced to the parts this decision needs.

## Sample

Project "The Last Tram" has five beat drafts in two scenes. Three of them fail.

| Scene | Beat | Draft | Result |
| --- | --- | --- | --- |
| The last service | 05 Dialogue | Mara: "Stay here" | Conflict with source. The source now says "Leave now". |
| The last service | 07 Narration | "I'll wait by the door." | Ready |
| Morning at the depot | 03 Dialogue (new) | No speaker | Incomplete: "Choose a speaker." |
| Morning at the depot | 04 Dialogue | Eli: "{i}The first tram leaves at six." | Invalid: "Close {i} with {/i}." |
| Morning at the depot | 05 Narration | "Steam rises from the cold rails." | Ready |

The author is on depot beat 05 when they press Save. In every variant, Save opens
The last service at beat 05, the first failure in project order, and focuses the
conflict.

## Variants

| Revision / layout | Status line after Save | Other failures |
| --- | --- | --- |
| `marked-v1` / `marked`, 1 · Count and failure marks | "Nothing saved. 3 of 5 drafts need changes:" followed by one link per scene with its count, for example "Morning at the depot 2". A link opens that scene's first failing draft. | Failing beats get a red `!` and a red top edge in Tracks, with the reason in Reel and the tooltip. Ready drafts keep the amber `•`. The scene menu lists draft and failure counts per scene. Each failing beat shows its error when selected. |
| `stepper-v1` / `stepper`, 2 · Count with next/previous | "Nothing saved. 3 drafts need changes." with `‹ 1 of 3 ›`. The arrows move through failing drafts in project order and cross scenes. | Markers stay as today: `•` for a draft and `!` for a source conflict only. Each failing beat shows its error when selected. When the current beat is fixed, the position reads "– of 2". |
| `first-v1` / `first`, 3 · First failure only | "Nothing saved. Fix beat 05 in The last service." | Nothing points at the other failures. Only the revealed draft shows its error. After it is fixed, the status returns to the draft count and the next Save reveals the next failure. |

In variants 1 and 2 the count and marks update as the author fixes drafts. When none
fail, the status reads "5 unsaved beat drafts. Ready to save." Marks appear only
after a refused Save, never while the author is typing a first draft. Commit on a
failing draft shows that draft's error in every variant.

## Preserved and changed behaviour

Kept from the approved references: the B conflict editor (Discard draft and Override
source together, "Other drafts stay unsaved."), Commit and Cancel for one beat, the
`•` draft marker, Tracks and Reel, and Save from the header or Cmd/Ctrl+S.

New in this study: the refusal text in the header status line, a speaker picker with
"Choose…" for a new dialogue beat, inline field errors in the error colour, the
failure marker in variant 1 and the step control in variant 2. The scene menu is a
small stand-in for Combined v1's scene tree.

Simulated: all data is fictional and stays in browser memory. There is no source
transaction, history, stale-revision refresh, busy lock or Flush. The text-tag check
covers only paired tags. Branch path and non-text beats are context and are not
editable.

## Run and review

From `app/`, with the pinned Node 24 tools and installed dependencies:

```sh
npm run design:dev
```

Then open, on the port Vite prints (normally 5174):

- `http://127.0.0.1:5174/?screen=story-save-refusal&variant=marked&state=refused&theme=dark&viewport=wide`
- `http://127.0.0.1:5174/?screen=story-save-refusal&variant=stepper&state=refused&theme=dark&viewport=wide`
- `http://127.0.0.1:5174/?screen=story-save-refusal&variant=first&state=refused&theme=dark&viewport=wide`

Use `viewport=compact` for the 560 × 640 layout and `state=pending` to press Save
yourself. In the preview, the Compare switcher and the Left/Right keys change
variant without resetting the sample. Reset returns to five drafts before Save, and
Load refusal returns to the refused state.

Focused check, once per layout:

```sh
npm run design:check -- story-save-refusal marked --interaction ./screens/story-save-refusal/review-check.mjs --capture
```

[captures/](captures/) holds the approved `marked-v1-approved-dark-wide.png` and
`marked-v1-approved-dark-compact.png`, which the approval record lists. The
`marked-v1-depot-wide.png` capture and the captures of the other two variants are
draft review images, not approval evidence.
