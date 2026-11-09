# Story draft conflict study

Kris approved B on 2026-11-09 after the copy pass: `story-draft-conflict` /
`compact`, revision `compact-v2`, named Buttons together. A remains unapproved.
The [approval record](approval.json) pins the reviewed source and captures.
The main interview agent owns recording Q13 in the canonical spec and continuing
the interview. This approval does not authorize production implementation.

The reference is [Story Combined v1](../story-revamp/README.md), screen
`story-revamp` / `combined`, revision `combined-v1`, source `6ecf6470`.
The approved source, artwork, captures and approval record remain intact.

## Choices

| Candidate | Interaction | Tradeoff to judge |
| --- | --- | --- |
| A, `inline-v2` / `inline` | Conflict with source appears above the source text and a Keep source button. The retained draft stays below, with Override source underneath. | Each action sits beside the text it chooses. Keep source explicitly discards this draft. |
| B, `compact-v2` / `compact` | The source text is visible above the draft. Discard draft and Override source sit together below the text box. | Both choices are in one row; Discard draft makes the loss explicit. |

Kris requested clearer source wording after reviewing v1. Both v2 candidates show
source text without a disclosure. Keeping source and discarding the draft are the
same outcome, so each candidate offers one action for that outcome. A calls it
Keep source; B calls it Discard draft. Both use Override source for the other choice.
Override source validates and saves only this beat in memory. It replaces the v1
step of choosing the draft and then pressing Commit. This is now the approved
conflict interaction. The main interview agent owns updating the interview spec.
The v1 captures remain under captures;
the previous standalone export is retained locally at
`.toolchains/story-draft-conflict/v1/review.html`.

The copy pass removes repeated button explanations, uses direct status messages,
and keeps both interactions unchanged.

The variant switcher keeps the current fictional state for direct comparison.
Its arrows and Left/Right keys also switch variants. Arrow keys inside text fields
keep their normal meaning. Reset starts a fresh scenario. The Lab sample selector
also starts fresh. The [approval record](approval.json) sets `currentApproved` to
`compact-v2`.
The approved source is local commit `af23cf4d9141661e98280896a4aab2fbe7bd4414`.
Its full frontend/lab fingerprint and capture hashes are in the record.

## Run and review

From `app/`, run `npm run design:dev`. Select **Story · Retained draft conflict**.
Direct lab routes, on the port printed by Vite:

- `/preview.html?screen=story-draft-conflict&variant=inline&state=start&theme=dark&viewport=wide`
- `/preview.html?screen=story-draft-conflict&variant=compact&state=start&theme=dark&viewport=wide`

For the self-contained review file, run from `app/`:

```sh
node design-lab/screens/story-draft-conflict/export.mjs
```

Open `.toolchains/story-draft-conflict/review.html` at the repo root, or use the
interactive copy shown in the review chat. It opens at the conflict so both choices
are immediately reviewable. Reset starts at saved text "Hello". The export accepts
`?variant=compact` and `?state=start`. The macOS exporter uses `sips` to shrink copies
of the reference art for the chat renderer's size limit. The exported file embeds
all scripts, styles and images and needs no server.

1. Reset, then create the draft "Stay here". Leaving and returning keeps it.
2. While away, simulate the saved edit to "Leave now". There is no popup. Beat 05
   gets a quiet conflict marker. The other beat remains editable.
3. Return to beat 05 or press the main Save button. Save reveals the conflict and
   retains every draft. Load conflict example also supplies a second draft on beat 07
   so retention is visible in the inspector.
4. Keep source (A) or Discard draft (B) discards this beat's draft and keeps the
   source text. Edit the draft if needed, then Override source saves only this beat.
   Other drafts remain available and unsaved. Ordinary non-conflicting drafts still
   use Commit for one beat and Save for all pending valid drafts.
5. Continue on beat 07. The prototype inspector shows the saved text and remaining
   draft of both beats after every action.

More actions offers an unrelated saved change and a second beat draft. Changing
an unrelated beat while beat 05 has a draft does not prompt. Empty text stays in the
field; Save refuses it and retains all drafts. Valid text previews on the stage.
Only the normal Save status reports unsaved work; beat markers locate drafts.

## Boundary

This is a throwaway, memory-only browser interaction, under
`app/design-lab/screens/story-draft-conflict/`. It reuses the production font and
icons, plus the approved mock's palette CSS and fictional illustrations by import.
Tracks and Reel show the same selection and retained drafts. The game stage keeps
16:9 for this fictional 1920 × 1080 sample. The selected-beat sidebar and Branch
path keep the established placement. On narrow screens they stack.

Only beats 05 and 07 are editable. Other beats, workspace icons and the Branch path
are context; their controls do not perform project operations. Source/external
changes are buttons in the separate prototype controls. There is no project access,
SDK execution, native Save, recovery, persistent history or source transaction.
Chronological Undo and real transaction checks remain the production contract and
are outside this conflict study. The approval covers the design; the prototype adds no production capability.

## Focused verification

`npm run design:typecheck` passes. Each candidate passes the selected Design Lab
check with its own `review-check.mjs` interaction journey, in dark mode at wide and
compact lab sizes. The checks cover routine retained drafts, unrelated saved edits,
quiet conflict arrival, Save retaining both drafts, refusing an empty Override
source, saving only the overridden beat, keeping source/discarding the draft, and
continued editing/saving. The lab also
checks readiness, asset/browser errors, horizontal overflow and native-operation
refusal. Both exported variants were visually inspected at 728 px using the host's
HTML preview. No console messages appeared.

Selected review captures are under [captures](captures/). The
`compact-v2-approved-*` files retain the approved B reference. Earlier captures
remain as review history. None replaces the Story Combined v1 captures. No production
build, native/SDK check, full-gallery matrix or transaction qualification was run.

Approval verification reran B's focused interaction journey after the copy pass.
The recorded source fingerprint matches the local candidate commit. The normal
lab approval check validates the approved pointer and reference rendering.
