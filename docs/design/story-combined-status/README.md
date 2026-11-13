# Story Combined status study

Three earlier approvals were reviewed in the old Story layout. This Design Lab screen,
`story-combined-status`, places them inside Story Combined v1 (`story-revamp` /
`combined`, revision `combined-v1`):

- Save refusal from [story-save-refusal](../story-save-refusal/README.md) (`marked-v1`).
- Header Undo and Redo from [header-undo](../header-undo/README.md) (`icons-v1`).
- The conflict editor from [story-draft-conflict](../story-draft-conflict/README.md)
  (`compact-v2`), used as is.

Their approved behaviour stays. Only the presentation inside Combined is open. The
screen also shows Kris's no-"body" wording from the 2026-11-13 comment on
[#117](https://github.com/Caldwell-41/Renpy-editor/issues/117) in the Branch path,
the editor path and the insertion markers.

Kris picked variant 1, Header save status, on 2026-11-13 ("batch 1 - header"). Its
header wrapped onto a second row at 560 px, which breaks the icons-v1 one-row rule.
`header-v2` fixes that after his pick and is the approved revision:
`story-combined-status` / `header-v2`, source commit `5df8889e`. The
[approval record](approval.json) sets `currentApproved` to `header-v2` and holds the
behaviour, deviations and capture hashes. `header-v1`, `footer-v1` and `strip-v1`
stay in the lab as unapproved drafts.

## Sample

Project "The Last Tram" has five beat drafts in two scenes. Three fail when saved.

| Scene | Beat | Draft | Result |
| --- | --- | --- | --- |
| The last service | 05 Dialogue | Mara: "{i}You heard the bell too?" | Invalid: "Close {i} with {/i}." |
| The last service | 06.2.1 Dialogue, inside "If trust ≥ 5" | Mara: "…Not here." | Ready |
| Morning at the depot | 03 Dialogue (new) | No speaker | Incomplete: "Choose a speaker." |
| Morning at the depot | 04 Dialogue | Eli: "…Not a minute later." | Conflict. The source now says "The depot opens at seven." |
| Morning at the depot | 05 Narration | "Steam rises from the cold rails." | Ready |

The outer condition is `has_ticket and trust ≥ 3 and not missed_tram`. The Branch
path shortens it to "has_ticket and trust ≥ 3…", and every other label reuses that
form. Insertion markers read "End of \"If trust ≥ 5\"", "End of \"If has_ticket and
trust ≥ 3…\"", "End of option 2 \"Leave\"" and "End of scene".

| State | What it shows |
| --- | --- |
| `pending` | Five drafts before Save. `*` marks drafts. Depot 04 has the quiet conflict `!`. |
| `refused` | Save refused 3 of 5. Opens The last service at 05 with its error. |
| `conflict` | Depot 04 selected in Reel with the B conflict editor. |
| `undone` | Undo removed the 06.2.1 draft and selected that beat. Keyboard focus is on header Redo with its tooltip. |

## Variants

Every variant removes Combined's toolbar Undo and Redo. The header has the
approved icons-v1 buttons between the save status and Save.

| Revision / layout | Save state and refusal | "Undone: …" | Failing beat |
| --- | --- | --- | --- |
| `header-v1` / `header`, 1 · Header save status | Header save-status area, as approved in marked-v1: "Nothing saved. 3 of 5 drafts need changes:" and one link per scene. | Bottom status bar, as approved in icons-v1. | Red `!` and red top edge in Tracks. Error under the field. Labelled end markers. |
| `header-v2` / `header-v2`, 1 · Header save status v2 (approved) | Same as header-v1 at wide sizes. At 560 px the header shows "Nothing saved" and stays on one row; the bottom status bar shows the full line and scene links. Validate, Run and Stop stay visible. | Bottom status bar. | Same as header-v1. |
| `footer-v1` / `footer`, 2 · Status bar | Bottom status bar holds the full line. The header keeps one word: "Unsaved", "Nothing saved" or "Saved". | Bottom status bar, before the save line. | Red `!` and the reason in the Words lane. Error as a line at the top of the editor. Slim end markers with vertical labels. |
| `strip-v1` / `strip`, 3 · Refusal above Tracks | A refusal row between the Branch path and Tracks. The header shows the draft count. No bottom status bar. | Header save-status area, followed by the count. | Red `!` on a tinted Beat lane cell. Error under the field. Labelled end markers. |

All variants show the reason in Reel and the tooltip. Ready drafts keep `*`. A
conflict keeps its `!` in the accent colour until a Save refuses it.

Known trade-offs to judge:

- Variant 2 truncates long vertical end labels at the wide size and most labels at
  compact. The tooltip and accessible name keep the full text.
- Variant 3 replaces the draft count with "Undone: …" until the next action, so
  the count shows as "· 4 unsaved".

## Simulated parts

Browser-memory mock with fictional text. It has no source transaction, revision
check, Flush or persistent history. Only text beats are editable. The Branch path,
Writing focus, Add beat, More, Validate, Run and insertion markers write a status
message only. Undo history holds the five draft edits and one background change.
The layout is a reduced copy of Combined v1 built on the story-revamp palette and
the story-draft-conflict styles, not the full Combined source.

## Review

From `app/`, with the pinned Node 24 tools:

```sh
npm run design:dev
```

Open `http://127.0.0.1:5174/?screen=story-combined-status&variant=header&state=refused&theme=dark&viewport=wide`.
Change `variant` to `footer` or `strip`, `state` to `pending`, `conflict` or
`undone`, and `viewport` to `compact`. The Compare menu switches variant without
resetting the sample.

Focused check and captures, once per variant:

```sh
npm run design:check -- story-combined-status header --interaction ./screens/story-combined-status/review-check.mjs --capture
```

[captures/](captures/) holds `<revision>-<state>-dark-<wide|compact>.png` for every
variant and state, at 1100 × 720 and 560 × 640. The approval record lists the eight
`header-v2` captures. The others are draft review images.
