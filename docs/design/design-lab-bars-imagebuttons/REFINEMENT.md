# A2 refinement

The [final refinement record](FINAL-REFINEMENT.md) supersedes the pending-review
statements below. Kris later authorized one final additional council round.
The final source is `37d29ca1`; Kris subsequently approved `inspector-v2`.
[The approved handoff](APPROVED-HANDOFF.md) records the decision and remaining gates.

Kris requested two council rounds to refine A toward a UI/UX score of 9/10.
This selects design refinement, not production implementation or design approval.
`inspector-v1` and source `0a6e571e` remain the original comparison reference.
The successor is the unapproved `inspector-v2` variant, implemented only in the new
`refined*` files. The original study, styles, variants and exports remain unchanged.

## Changes after the first review

- Keep one continuous inspector and the approved Screens flow. Plain section links
  open and focus Appearance, Position & size, or Actions without hiding other groups.
- Increase the inspector width and asset text/thumbnail sizes. Existing references
  have Change controls, optional clears have accessible names, and the picker marks
  its current reference. Keep all six exact native fallback chains.
- A state name previews that inert state. A line beside the existing sample fields
  names the requested and resolved states. State changes create no source draft.
- Keep disclosures per control through picker changes and remount. Live section
  summaries show displayed dimensions and action counts.
- Link width/height only after the user requests aspect preservation, using the
  currently chosen Normal asset's actual dimensions. The preference belongs to
  the current draft and resets on Cancel. Every explicit state image uses the same
  dimensions. Horizontal position moves the schematic
  image and selected outline together. The vertical group controls vertical placement.
- Use readable Unsaved changes feedback without revision identifiers in the form.
  Captured revisions stay in prototype diagnostics and are never silently refreshed.
- Open the containing section before focusing an invalid input. Associate its error
  with the field. Preserve the existing action editor, typed/context checks and
  combined Apply, Cancel, no-op, history, Source and navigation behavior.
- On compact widths, show the canvas first and use one main scroll for the form.
  Keep property navigation and Apply reachable. Move prototype sample controls to
  the mock header, removing the fixed comparison strip.
- Remount replaces the prior workspace DOM instead of leaving a duplicate editor.
- After Opus's response, keep the one size pair open by default and separate it
  from collapsed Layout. Use the production canvas toolbar's existing state
  selector, extended to all six marked samples, and move captions out of the game
  image. Editing/clearing a state's image selects that inert sample.
- Fallback thumbnails show the existing resolved image, dimmed with a dashed edge.
  They never create source references or picker selections. Left-align all asset
  thumbnails and remove redundant headings. Quote the selected node's name.
- The footer lists changed properties and disables Apply/Cancel when no draft
  exists. Editing a field back to its accepted value still allows an explicit
  no-op Apply, which adds no history.

No new parent/reparent control, schema, runtime action or source operation is proposed.
Existing broad numeric units, anchors, limits, ordering, composition and Source
capabilities retain their previous scope. The size/action transaction and native
per-state Transform mapping stay with the existing implementation owners.

## Checks and pending work

TypeScript and standalone export pass. Fifteen focused synthetic DOM groups pass
at 560 and 1280px dark, with inner viewport height 800px. The temporary test copy
and exact completion receipts remain ignored under `.toolchains/bars-imagebuttons/`.
The groups extend the previous sample workflow with section navigation, explicit
aspect linking against a differently sized Normal asset, pristine footer state,
display-only fallback references, collapsed-size validation/focus, and
position/selection agreement. Round-two corrections additionally verify that a
validation error follows only its owning draft, correcting an action clears its
feedback, and invalid/out-of-range signed pixel positions refuse without accepted
writes. Valid negative positions and Undo remain supported.
They also verify one workspace after remount. Test captures are not approval captures.

An early focused check caught navigation focusing the disclosure heading instead
of the first field, which was corrected. Another caught duplicate workspace DOM
after remount, which was corrected. A harness assumption about a separate resize
outline was corrected to assert the actual selected node's painted outline and
pixel position. No trusted/native input or real source/core/runtime claim follows.

Dark renders cover image button, value bar, action editor, current asset picker,
invalid-size recovery, compact overview and compact editing. The full lab gate,
exact user approval and approved-source captures remain separate. Both first-round
council responses were incorporated before the second round. At that checkpoint,
only the original two rounds were authorized. The reviewers disagreed on compact ordering. A2 keeps the canvas-first
order from the approved flow-v1 reference, with an Edit control jump, one main
scroll and a sticky commit row. It keeps six appearance rows rather than introducing
the optional state grid. Production asset import remains owned by the existing
image picker; this fictional comparison exercises catalog selection only.

## Local corrections from the second round

Sol's second review identified shared validation feedback and missing horizontal
position validation. A focused synthetic check first reproduced the error leaking
from an imagebutton draft into a valid bar. Feedback now belongs to its draft and
clears on field/action corrections, Cancel and successful/no-op Apply. Switching
controls restores only the selected draft's problem. The pixel field now refuses
non-integers and values outside -16384 through 16384, retains the raw input and
focuses the field. Its invalid draft preview retains the accepted offset.

The picker also left-aligns all rows and reserves a common thumbnail column.
Opus's second review independently identified the shared error and picker issues,
and added redraw focus, inline-error visibility and compact sticky-bar offsets.
The parent fixed those locally: clear returns focus to the state's chooser;
Default restores its replacement; disabled Apply/Cancel fall back to the selected
title; errors scroll their whole field/message together and keep a red invalid
border over the focus style. Compact targets reserve space for sticky bars. The
footer says Unsaved followed by changed properties, or No value changes for an
unchanged draft. Invalid size drafts retain the accepted preview dimensions.

Both requested council rounds are complete. These are local fixes after the
second review, not an additional council round or an invented rescore. The two
round-two reviews assessed source `fb147c89`; the corrected candidate has its own
source identity. Recorded scores are reported together in the final reply. The
9/10 target was not independently awarded. No production acceptance or user design
approval follows from the reviews.

Run from `app` after loading the pinned toolchain:

```sh
node design-lab/screens/bars-imagebuttons/export-refined.mjs
```

Open `.toolchains/bars-imagebuttons/refined-a2.html`. The registered lab variant is
`bars-imagebuttons/inspector-v2`. Every operation uses fictional in-memory data.
