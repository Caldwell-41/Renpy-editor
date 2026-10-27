# Numeric inspector refinement

Kris requested an Experience First refinement of the existing #38 proposals. The
original A/B/C sources and unapproved revisions remain available. A2, B2 and C2
are separate drafts. No design has user approval yet.

## Review choices

| Draft | Main workflow | Tradeoff |
| --- | --- | --- |
| A2, Paired fields | Compare horizontal and vertical position and anchor values, then set size or alignment. | Limits and padding expand below the common fields. |
| B2, Axis columns | Work down one axis through position, anchor, size and limits. | More fields are visible, with more scrolling. |
| C2, Alignment first | Choose one of nine alignment positions and set dimensions. | Exact position and anchor values require opening a group. |

The recommendation is A2. Numeric values remain visible and related axes line up.
Each draft keeps Apply and Cancel outside the desktop form's scrolling area. At
compact width the canvas and inspector stack and the action row sticks to the
bottom while scrolling the inspector. Existing dimensions, per-element drafts,
Apply/Cancel, Undo/Redo, source conflict refusal and sample source remain available.

The refinements add nine alignment presets, a marker showing the frame's anchor
reference point, a frame geometry readout, invalid-field focus and a link to the
parent group's spacing controls. The link retains the child's unfinished draft.
Selection controls mark elements with unapplied drafts. Numeric controls use
32-pixel rows. Size limits reject contradictions with the explicit dimension as
well as a minimum above its maximum. Coordinate fields distinguish pixel units
from fractions of the parent or element. Hover help explains relative 0.5.
Changing a unit keeps the typed number; it does not convert geometry automatically.
The selected preset clears when the typed values no longer match it.

These choices govern this inspector only. The existing flow-v1 and C5 approvals
retain their scope. The mock's surrounding navigation remains a sample; composition,
Connect, source editing and deliberate Ren'Py testing keep their existing owners.

## What #38 needs to implement

Support numeric Design edits for position, anchor, alignment, size, size limits,
frame padding and group spacing within a qualified node/property/type matrix.
Preserve existing integer dimension editing. Distinguish integer pixel literals
from relative literals in fields and accepted source, including 0 versus 0.0.
The implementation must resolve aliases and ownership through the source model,
including xalign/yalign and xsize versus explicit bounds. This mock does not qualify
those source mappings or select additional node types.

Apply the accepted edits as one transaction with the smallest safe source patch
and one history entry. Invalid values, parent constraints, stale source and conflicts
must retain the draft with a specific explanation. Preserve comments, custom source
and opaque neighbors. Verify keyboard entry, no-op, Cancel, Undo/Redo and reopen
through the production UI/controller/core path. Compare actual pinned-SDK geometry
at project resolution and the second qualified aspect, with anchored and constrained
cases. Pointer gestures and full canvas fidelity remain outside #38's claim.

## Sample limits and verification

The preview is schematic HTML. Only the frame's position, anchor and explicit size
change the drawing. Other fields change generated fictional source in browser
memory. The geometry readout is a sample calculation. It is not SDK evidence.
There are no project writes, durable saves, native operations or SDK launches.
The sample's validation is illustrative; production eligibility and Ren'Py property
semantics still need qualification. Approval cannot satisfy #38's production criteria.

The focused runner covers all six layouts, four states, two themes and two sizes.
Its interaction module exercises the three refined drafts through keyboard Apply,
no-op, Cancel, invalid values, contradictory limits, per-element draft retention,
alignment, parent constraints, conflicts, Undo/Redo and compact entry. Screenshots
retain baseline and important failure states. Lab and production typechecking,
approval-record validation and whitespace checks pass at the refinement checkpoint.

An initial interaction run failed because the CSS draft marker changed the accessible
name of the Frame selection button. This was a mock accessibility defect matching
incident H21. Explicit names on all element selection buttons corrected the cause;
the unchanged exact-name interaction then passed. The original failure is not a pass.

The combined lab check has a known older-reference limitation. Flow-v1 pins its
original global source fingerprint, which predates this work. Preserve its approval
and the source guard. Use INTEGRATION's separate source-pinned comparison checkout
for approved references; do not reset the active checkout or change an older
approval to make a combined run pass. The implementation owner keeps production,
tests, task evidence/status, PR and CI ownership. The separate TDD-boundary decision
remains with that chat.
