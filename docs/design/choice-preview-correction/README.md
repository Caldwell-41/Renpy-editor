# Choice preview correction

Design-only correction for Choice #98 in the current Story editor. Kris approved
A v2 (`dock-v2`); [the handoff](HANDOFF.md) records its scope and exact source.
The three v1 candidates below remain unapproved drafts. Story Combined v1 remains approved
at source `6ecf64704044a6fee9fc4ee6b3a54985d84b9b10`, fingerprint
`a526a4dabf6fc76979b2d20912b650cc4d1d3b1af772bc0a6df50754f7e012cb`.
This study does not replace that design or select Story #110 implementation.

## Candidates

- `dock-v1` keeps a small stage on the left and puts the prompt, picked-state
  notice and numbered options in one scrolling column on the right.
- `transcript-v1` replaces the small Choice canvas with a full-width text summary.
  The prompt, options and existing scene-state notices share one scroll.
- `split-v1` gives the prompt and scene-state notices a left column. Options
  scroll independently in the right column.

All use the existing preview allocation. The reported 1100 × 720 and 720 × 850
editor windows leave a 110 px high content area. Text wraps, and overflow scrolls
inside that area. No text is shortened with ellipses. Numbered rows distinguish
duplicate captions without treating captions as identity. Rows are inert text.
Unknown picked state and unknown option conditions have separate labels. A
conditional row says what happens *if* its condition is false; it does not claim
that the condition is false or disable the option.

`duplicate` uses the captured public fixture's narration prompt, duplicate `Same`
captions, `Hide picked`, and conditional `Locked` option. `character` adds a
Character prompt and `Mark picked`. `long` combines a long Character prompt,
one short caption, and two long captions. `none` has no prompt and uses
`Show normally`. Every sample retains the current character-state notice and
the unknown-background message.

## Review and reproduction

New source lives in `app/design-lab/screens/choice-preview-correction/`. The
standalone lab entry mounts the current production editor with a disposable copy
of the accepted public model. Only the preview content is replaced by draft
presentation. The existing lab registry, approved source and approval history are
unchanged. This separate entry avoids editing shared files outside this assignment.

With the repository's pinned Node and installed app dependencies:

```sh
node app/design-lab/screens/choice-preview-correction/serve.mjs
node app/design-lab/screens/choice-preview-correction/export.mjs
```

If this worktree has no dependencies, `CHOICE_REVIEW_VITE` may name the absolute
path to another installed Vite `dist/node/index.js`. That dependency tree is read
only. The server uses port 5186. Open
`/screens/choice-preview-correction/index.html?variant=dock&state=duplicate`.
Variants are `dock`, `transcript`, `split`; states are named above. The exported
`review-v1.html` compares the same summary renderer and allows sample switching.
The inline comparison has a fluid width; the focused full-editor captures own
the exact viewport evidence.

## Limits

The public fixture has no media. Candidate A's stage shows its unknown-state
messages; this study does not prove image fitting or character placement with
assets. Candidates B and C deliberately replace the graphical Choice preview.
Long content requires scrolling. The outer editor is real presentation code, but
Save/apply and media callbacks refuse operations. Summary rendering is a mock,
not an integrated production implementation. Changing other editor controls may
redraw the original preview; reload the candidate URL to reset the study.

This work does not evaluate conditions, infer picked options, add Preview options
assumptions, execute a project, run an SDK, launch a native editor/package, or
establish save/runtime correctness. The coordinator owns implementation and its
remaining qualification after approval.
