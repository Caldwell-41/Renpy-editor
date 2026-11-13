# Story Combined editor study

This Design Lab screen, `story-combined-editor`, mocks three answers inside the
Story Combined v1 Choice editor and dialogs (`story-revamp` / `combined`, revision
`combined-v1`). It covers the Then line for an option that Custom Code ends or may
leave, the disabled Then menu, and the no-"body" wording from the 2026-11-13 comment
on [#117](https://github.com/Caldwell-41/Renpy-editor/issues/117). No variant is
approved yet. The [approval record](approval.json) lists the three draft revisions.

## Sample

Scene "The last service", beat 07 is a Choice with three options:

| Option | Beats | Ending |
| --- | --- | --- |
| 1 "Ask about the last tram" | 07.1.1 Mara's line, 07.1.2 Custom Code `$ renpy.jump("depot") if late else None` | Ending unknown: Custom Code can leave this option |
| 2 "Leave" | 07.2.1 Narration | Continue after the Choice |
| 3 "Wait for the next service" | 07.3.1 Custom Code `$ renpy.jump(next_stop)` | Ends with Custom Code: renpy.jump(next_stop) |

Move to moves beat 06.1 (Eli's line in "If has_ticket and trust ≥ 3…"). It opens on
"End of \"If trust ≥ 5\"". Add a beat opens from option 2's "+ Beat".

| State | What it shows |
| --- | --- |
| `choice` | Editor top: option 1 with the unknown ending. |
| `custom-code` | Same editor scrolled to option 3 and its Custom Code ending. |
| `then-menu` | Option 1's Then menu open. |
| `add-beat` | Add a beat for End of option 2 "Leave". |
| `move` | Move 06.1 Eli's line. |
| `protected` | A Choice with an unsupported condition, listed read-only. |

## Variants

| Revision / layout | Custom Code ending (option 3) | Unknown ending (option 1) | Add a beat | Move to |
| --- | --- | --- | --- | --- |
| `label-v1` / `label`, 1 · Menu reads "Custom Code" | Disabled menu with a lock reads "Custom Code". "Ends with Custom Code: …" and Edit in Source sit below it. | Menu stays editable. The warning line sits under the Then row. The open menu repeats it in its footer. | One line: "Adds to The last service › Option 2 "Leave" · End of option 2 "Leave"". | Two selects, Move to and Position, and a summary line. |
| `blank-v1` / `blank`, 2 · Menu with no value | Disabled menu with a dashed border and a lock, and no value. The sentence and Edit in Source sit below it. | The menu value gets an amber `?`. The warning line sits under the Then row. | Position first: "Goes at End of option 2 "Leave"", then the path and the preceding beat. | All places at once as radio groups, one per scene, branch or option. |
| `replace-v1` / `replace`, 3 · Ending replaces the menu | No menu. The Then row shows "Ends with Custom Code: …" with Edit in Source in place of the menu. | The warning sits on the Custom Code beat that causes it (07.1.2). The Then row stays plain. | No target line. The details pane lists Goes at, In and After. | A tree of scene, branches and options. The chosen row expands into its positions. |
| `replace-v2` / `replace-v2`, 3 · Ending replaces the menu v2 | No menu. The Then row shows "Ends with Custom Code: …" with Edit in Source in place of the menu. | The warning sits on the Custom Code beat that causes it (07.1.2). The Then row stays plain. | No target line. The details pane lists Goes at, In and After. | A tree that opens on the beat's own location with other branches and options closed. Arrow keys move, Right opens, Left closes, Enter selects, Escape cancels. |

No variant shows "Continue after the Choice" for option 3. The protected Choice
listing uses each variant's wording for option 3's ending.

## Wording

Every author-facing string in the mock follows the #117 table. These are the
strings outside the table:

| Today | Mock |
| --- | --- |
| Moves this Beat to the chosen body and position. | Moves this beat to the chosen scene, branch or option. |
| Choose an available position in this body. | Choose an available position in Option 2 "Leave". (Names the selected place.) |
| Option body, then shared continuation | Option 2's beats, then continues after the Choice |
| Option body follows below. Then changes only its ending. | Option 1's beats follow below. Then changes only its ending. |
| Destination body / End of body | Move to / End of "If trust ≥ 5" |

"Original body unavailable. Choose a body explicitly. Input retained." has no state
in this mock. Following the same rule, it would read "The original scene, branch or
option is unavailable. Choose one. Input retained."

## Simulated parts

Browser-memory mock with fictional text. The editor is a reduced copy of the
Combined Choice editor built on the story-revamp palette and the
story-combined-status shell. Option text, conditions, reorder, Edit in Source,
Writing focus, Tracks and the header controls write a status message only. Add a
beat and Move close the dialog and report the result. There is no source change,
history or Undo entry.

## Review

From `app/`, with the pinned Node 24 tools, run `npm run design:dev`, then open
`http://127.0.0.1:5174/?screen=story-combined-editor&variant=label&state=custom-code&theme=dark&viewport=wide`.
Change `variant` to `blank` or `replace`. Set `state` to `choice`, `then-menu`,
`add-beat`, `move` or `protected`. Use `viewport=compact` for 560 × 640.

Focused check and captures, once per variant:

```sh
npm run design:check -- story-combined-editor label --interaction ./screens/story-combined-editor/review-check.mjs --capture
```

[captures/](captures/) holds `<revision>-<state>-dark-<wide|compact>.png` for every
variant and state. They are draft review images.
