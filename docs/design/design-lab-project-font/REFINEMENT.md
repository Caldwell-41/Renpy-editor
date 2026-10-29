# A2 text inspector

Kris selected A for an Experience First refinement on 2026-10-29. Kris then approved A2 with "Approve A2 and send it back to the original implementation chat." The selected variant is `refined`, revision `inspector-v2`. The original A/B/C source and captures remain available as drafts. The implementation chat keeps #39 ownership.

[Open A2](http://127.0.0.1:5177/preview.html?screen=project-font&variant=refined&state=text&theme=dark&viewport=wide).

The question is whether choosing a project font, formatting text and applying the result works without repeated picker openings, lost context or unclear errors.

## Changes from A

| Part | A2 treatment |
| --- | --- |
| Inspector | Remove the repeated Content heading. Keep text, the selected font and typography together. Add a color swatch beside the editable hex value. Keep Layout separate from line alignment. |
| Font comparison | Show the current text in every font row, with its file, format and selected state. One selection updates the text draft and returns focus to the chooser trigger. Empty search keeps an import route. |
| Import | Keep import inside the chooser. Show its project destination. Cancel import and Escape return to the existing search; Cancel or Escape from the chooser returns to the inspector. Successful import selects the new draft font. Cancelling text changes leaves the imported catalog entry. |
| Validation | Show a field error and focus the invalid input. Missing/unreadable fonts offer Choose another font beside the warning. Invalid size/color drafts retain accepted typography in the schematic preview. A later valid edit clears its own error. |
| Expressions | Keep content/font/size expressions intact. Read-only content/size and the font expression offer direct Source access. Other supported fields remain editable. |
| Apply/Cancel | Keep the actions outside desktop form scrolling. Show local applied/draft feedback, retain numeric focus, and preserve one-entry/no-op history behavior. Source conflict offers Review Source and keeps the draft. |
| Context | Keep drafts and errors across text selection. Remember inspector scroll and layout/limit disclosure state for each text element. Keep source access, history, reopen and deliberate Test. |
| Compact windows | Put editing first and keep the normal core controls and Apply visible at 560 by 640, including a short draft. Show preview and Edit text move between editing and the canvas. |

The Default/On/Off controls remain for bold and italic because inheriting a style differs from explicitly turning emphasis off. Empty size/color and Default font/alignment retain their inherited meaning. The proposed size/color bounds remain those in the original notes; no new product or Ren'Py bound is established.

Existing composition, all accepted numeric/parent controls, nine placement presets, order/removal, nested layouts, UI images and source editing remain integration requirements. This text mock exposes the same bounded paired layout controls as A; it does not reimplement those other workflows. A2 removes only implementation commentary from the visible Layout disclosure. It removes no production capability.

## Evidence and limits

The focused A2 review passes 24 combinations across six states, both lab themes and both registered sizes. Its interaction check covers the retained A behaviors, real-text specimens, nested import cancellation and Escape, TTF/OTF fixture import, field error/focus retention, invalid-preview fallback, missing-font repair, expression Source access and compact navigation. The check is also included by the screen's registered interaction entry. `review-refined.mjs` runs the isolated A2 matrix; `capture-refined.mjs` reproduces the retained draft states and hashes.

TypeScript and approval-record checks pass. The required combined Design Lab check still fails at its initial eight-second navigation. Its original output is retained with the focused report under ignored `.toolchains/design-lab/l05-refined/`. The focused runner uses the previously documented 45-second startup allowance; no shared runner or threshold changed. No combined-gate pass is claimed. The initial module check found an unused type import, which was removed before browser verification. A sandboxed connectivity probe could not reach the server; the subsequent startup attempt found the existing port in use. The disposable browser successfully used the existing server.

`captures/inspector-v2/` holds the reviewed draft matrix examples, chooser/import states and error drafts. `manifest.json` records their hashes and conditions. All assets, source writes, file selection, history and reopen remain fictional browser-memory operations. Font specimens use browser family stand-ins. No native picker, actual font decoding, SDK, game execution or persistence runs. The earlier production-build isolation check retains its scope; production build inputs and configuration are unchanged by this refinement.

Approval is recorded in `approval.json` against the reviewed source and retained captures. [The handoff](HANDOFF.md) owns the transfer to the implementation chat. The full Design Lab startup failure remains disclosed; design approval does not mark #39 implemented or accepted.
