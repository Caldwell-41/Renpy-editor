# Header Undo and Redo study

Kris decided on 2026-11-12 that the app header gets Undo and Redo buttons
([#143 scope comment](https://github.com/Caldwell-41/Renpy-editor/issues/143#issuecomment-6822506576)).
[UI.md "Application shell"](../../UI.md#application-shell) already lists Undo/Redo in
the header, but the app has none. This Design Lab screen, `header-undo`, compares
three placements. No variant is approved. Kris chooses one, and #143 then builds it.

The [approval record](approval.json) lists all three revisions with `approval: null`
and `currentApproved: null`.

## Fixed rules

These come from [#143's decisions](https://github.com/Caldwell-41/Renpy-editor/issues/143#issuecomment-6820274294)
and [UI.md "Story Undo"](../../UI.md#story-undo). Every variant follows them.

- The header buttons, the existing workspace Undo and Redo buttons and Cmd/Ctrl+Z
  run one shell Undo command (decision 8). In the mock, the Story scene buttons and
  the keyboard call the same function as the header.
- The tooltip and accessible name name the next edit, for example "Undo button
  resize". After Undo the status line reads "Undone: button resize" (decision 10).
  Redo reads "Redone: …".
- Undo opens the edit's workspace and selects its item. Undoing the button resize
  from Story opens Screens and selects the Start button.
- A new edit drops Redo.

## Sample

Project "The Last Tram" has three edits, oldest first: background change in beat 01,
dialogue edit in beat 05, button resize. The author is back in Story without
editing, which is the example in UI.md "Story Undo". The scenario bar adds more
edits.

| State | Header Undo tooltip | Header Redo tooltip | Status line |
| --- | --- | --- | --- |
| `ready` | Undo button resize | Nothing to redo | Ready |
| `undone` | Undo dialogue edit in beat 05 | Redo button resize | Undone: button resize |
| `empty` | Nothing to undo | Nothing to redo | Ready |

## Variants

| Revision / layout | Place | Form |
| --- | --- | --- |
| `icons-v1` / `icons`, 1 · Icons beside Save | Right side: save state, Undo, Redo, Save, then Validate, Run, Stop. | Square icon buttons with no visible text. The tooltip and accessible name carry the words. |
| `grouped-v1` / `grouped`, 2 · Text with the save state | Left side after the project name: save state, Undo, Redo. Save stays on the right. | Bordered text buttons reading "Undo" and "Redo", the same style as the workspace buttons. |
| `apart-v1` / `apart`, 3 · Beside the brand | Directly after "Loomlight", before the project name, away from Save. | Borderless buttons with an arrow icon and the word "Undo" or "Redo". |

Decision 10 keeps the visible text "Undo" on existing buttons. Variant 1 is the only
one without visible text on the header buttons. Kris named icon buttons as an option,
so it stays in the comparison.

## Shared states

- Disabled. With nothing to undo or redo, the button is dimmed with a thin border
  and does nothing. It uses `aria-disabled`, not `disabled`, so it stays in the Tab
  order and its tooltip can say "Nothing to undo".
- Keyboard focus. The button gets the 2px focus ring, and its tooltip appears at
  once. On hover the tooltip appears after about half a second. The shortcut sits in
  the tooltip: ⌘Z and ⇧⌘Z on macOS, Ctrl+Z and Ctrl+Y on Windows.
- Compact (560 px). The project name is hidden and header buttons use 11 px text.
  All three variants keep the header on one row, with no horizontal scroll.

## Captures

Each variant has ten captures in [captures/](captures/), named
`<revision>-<state>-focus-<theme>-<viewport>.png`. Every capture has keyboard focus on
the header Undo with its tooltip showing. States `ready` and `undone` are captured at
wide (1100 × 720) and compact (560 × 640) in dark and light. State `empty` is captured
at wide in both themes.

## Simulated parts

The history is a browser-memory list of three kinds of edit. There is no source
transaction, revision check, draft step or save. Save, Validate and Run only write a
status message. The Story beat list and the Screens canvas are reduced stand-ins for
Story Combined v1 and the Screens workspace. They are there to show where Undo lands.
The status line sits in the footer, where production's `app-status` sits today.

## Review

From `app/`:

```sh
npm run design:dev
```

Open `http://127.0.0.1:5174/?screen=header-undo&variant=icons&state=ready&theme=dark`.
Change `variant` to `grouped` or `apart`, and `state` to `undone` or `empty`. The
layout picker and the Compare menu also switch variants. Press Tab to reach the header
Undo, or hover it, to see the tooltip.

The focused check exercises tooltips, the status line, disabled and focus states,
compact fit and the shared command, then writes the captures:

```sh
npm run design:check -- header-undo icons --interaction ./screens/header-undo/review-check.mjs --capture
```

Delete `review-check.mjs` after Kris decides.
