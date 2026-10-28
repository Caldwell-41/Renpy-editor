# A2 focused editor refinement

Kris requested an Experience First refinement of A. This is a new unapproved
variant, `focused-refined`, revision `focused-v2`. A, B and C remain available.
No existing approval is replaced. Production and issue acceptance remain with the
implementation chat for [L04 #42](https://github.com/Caldwell-41/Renpy-editor/issues/42).

The question is whether the new containers fit the Screens editor already chosen,
with a short select, edit and inspect loop. Review A2 at:

[Open A2](http://127.0.0.1:5174/preview.html?screen=nested-layout&variant=focused-refined&state=nested&theme=dark&viewport=wide)

## Fit with the approved editor

| Approved decision | A2 treatment |
| --- | --- |
| flow-v1 Screen builder | Keep Choose, Design and Connect above a persistent canvas. One panel on the right changes with the editing step. Ancestors below the canvas select the same elements as the hierarchy and Source. |
| C5 Help composition | Restore the nested keyboard hierarchy, explicit add destination, pending addition, sibling ordering, protected Source boundaries and a stationary removal dialog for every eligible removal. |
| A2 numeric inspector | Restore paired horizontal/vertical position and anchor controls, units, nine alignment presets, dimensions, expandable limits and padding. Numeric rows are 32 pixels. Apply/Cancel stay outside the desktop form scroll. |
| L04 bounded support proposal | Add window/hbox/grid/viewport controls within that editor. Keep the agreed literal ranges, single-child rules, row-major grid capacity and stationary viewport clipping. No new scrolling behavior is offered. |

The added grid controls come first when a grid is selected. They show columns,
rows, spacing, child count and capacity together. A parent-controlled child names
its parent and offers a direct editing link. Locked coordinates remain readable.
Window/frame padding expands; empty dimensions inherit. Pixel fields and relative
coordinate fields use separate unit choices. Changing units keeps the typed number.

Choose shows type icons, nesting and draft markers. Click selects without leaving
the hierarchy. Enter or double-click opens Design. Arrow keys browse the hierarchy;
Alt+Up/Down and Move earlier/later reorder siblings. Pointer dragging changes order
within the same parent. Groups retain their descendants. Moving across custom
Source refuses. Reordering and history ask the user to resolve unfinished edits.

Add asks for a type and parent. Text appears only for text/textbutton. A dashed
label marks the pending addition. An occupied single-child container offers its
child group as a destination. The form retains its values after a refusal. Add
accepts one history entry. Windows, viewports and grids can start empty. New grids
use 2 by 2 with `allow_underfull True`; they fill rows in source order. Grid axes
use 1 through 64 as an authoring bound pending SDK qualification, not an engine
limit. Shrinking below the existing child count retains the draft and focuses the
invalid field. Expressions and unsupported grid ranges remain Source-only.

Removal names the element or lists its descendants before changing anything.
Cancel has initial focus; Escape cancels. The native modal keeps focus inside and
does not shift the editor's layout or scroll. Confirm creates one history entry
and selects the next sibling, else the previous sibling, else the parent. Undo
restores the removed subtree and selected target. Roots and groups containing
custom Source refuse removal. Undo-removal feedback sits outside the panel layout.

Apply accepts all current element edits as one history entry; no-op Apply accepts
none. Enter applies numeric fields; Escape cancels. Drafts survive selection,
parent links, editing-step changes, preview focus and resolution changes. Invalid
input and Source conflicts retain the draft. Input focus and form scroll survive
Apply. Disclosure state belongs to each element and survives form reconstruction.
Explicit width/height must be cleared before setting limits, matching the current
production numeric editor's fixed-size semantics.

Source opens in a modal without reducing the canvas. It shows accepted fictional
source and excludes pending drafts/additions. Selecting a statement returns to
that element. A simulated Source refresh requires cancelling pending input first.
Connect shows Close's existing `Hide("help")` action as read-only sample data.
Canvas clicks never invoke it. Test in Ren'Py explains the deliberate real-project
operation; this mock starts no SDK.

Fit, 75% and 100% change editor zoom only. Zoom scrolling stays inside the preview.
Focus preview hides the editing panel while retaining drafts. Compact layouts
stack preview and editor and offer Show canvas/Back to editing links. Apply/Cancel
remain sticky while scrolling. The bottom switcher retains links to the earlier
proposals. Left/Right cycles variants except while editing a field, navigating the
hierarchy or using a dialog.

## Simulation boundary

All state, source and history are fictional and live in browser memory. The HTML
canvas is schematic. It illustrates nested arrangement, padding, spacing, sizes,
window placement and clipping. It does not establish Ren'Py rendering agreement,
source preservation, durable saves or native input behavior. An unresolved viewport
size or grid range visibly refuses that canvas region. An invalid draft uses the
accepted element's schematic geometry.

This refinement restores the layout and composition controls relevant to L04.
It does not reimplement flow-v1's pointer move/resize gestures, style/asset pickers,
shared-look editing or its broader action builder. Their existing approved designs
remain authoritative. These omissions do not authorize removing those capabilities
from production. L04 implementation must extend the existing controllers and
transaction layer and retain their approved behavior.

## Review status and checks

The design remains pending Kris's explicit final approval. The review candidate
will be pinned with retained wide/compact captures before handoff. Previous A/B/C
source and draft captures remain available for comparison.

The first new interaction check caught Padding closing after Apply. A minimal
single-element sequence passed; the full sequence reproduced the loss before the
browser delivered its deferred `toggle` event. The correction captures the visible
open state before rebuilding the form and binds toggle ownership to the element
that created it. The unchanged interaction check then passes, including focus,
parent navigation, Add refusal/retention, confirmed group removal, protected Source,
conflicts, source-only rendering, zoom and compact editing. No timing delay or
weakened assertion was added.

The earlier standard combined lab run remains failed at its first navigation
limit; its external longer-navigation diagnostic remains failed at flow-v1's
changed-source guard after 488 cases. Those results are retained in README and
review-draft-v1.json. No shared runner, threshold or existing approval record was
changed. The focused screen matrix and A2 interaction module establish this draft's
browser behavior, not the combined gate or any product/native/SDK acceptance.

The final focused run passes 64 rendered cases across all four variants and every
interaction module. TypeScript, approval-record validation and whitespace checks
pass. An in-memory build confirms production exclusion. The final feedback and
compact-navigation corrections leave that import graph unchanged. Source candidate
`b2fffee2a3983ff309c27502fdfc215f56b1ccd0`, its fingerprint, file hashes and 14
retained captures are recorded in `review-focused-v2.json`. No final approval is
recorded and no production code changed.
