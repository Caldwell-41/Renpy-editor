# Numeric inspector refinement

Kris requested an Experience First refinement of the existing #38 proposals. The
original A/B/C sources and unapproved revisions remain available. Kris approved
A2 on 2026-10-28. B2 and C2 remain separate drafts.
[The approval record](approval.json) owns the exact decision, source and captures.

## Review choices

| Draft | Main workflow | Tradeoff |
| --- | --- | --- |
| A2, Paired fields | Compare horizontal and vertical position and anchor values, then set size or alignment. | Limits and padding expand below the common fields. |
| B2, Axis columns | Work down one axis through position, anchor, size and limits. | More fields are visible, with more scrolling. |
| C2, Alignment first | Choose one of nine alignment positions and set dimensions. | Exact position and anchor values require opening a group. |

The approved choice is A2. Numeric values remain visible and related axes line up.
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


## A2 approval and handback, 2026-10-28

Kris selected A2 after the feature brief and clarification that numeric layout
controls complement canvas dragging/resizing. The exact decision is in
[approval.json](approval.json). Source commit
`c2d23c52d82660c91061aff3d72fef242abe5d29` reproduces fingerprint
`7071f6b602fccca5c47d5a6d3fd18fa075c7ea76428618daf2477a0f04967627`.
All nine retained A2 capture hashes match. Their dimensions, themes and interaction
states are recorded with the approval. B2/C2 and the original proposals remain drafts.

The approved source also opens in a separate detached comparison checkout. Its
frontend files remain pinned; only the later approval metadata was copied in.
Both checkouts report `sourceMatches[paired-v2] = true`. The reference browser
shows A2 as Approved, the current pointer as paired-v2 and the exact user decision
in its approval history. The implementation handback identifies the local reference
path and port. Preserve that source for comparisons after production edits.

After promotion, the targeted runner passes all 96 rendering cases and the refined
interaction module. Lab TypeScript and approval-record checks pass, and the separate
production build-isolation check passes with one JavaScript chunk and no dist write.
These results establish sample behavior and approval identity only.

The required combined `npm run design:check` failed twice at its initial
`page.goto`, before any rendering case or interaction group. Each run exceeded the
unchanged 8,000 ms navigation deadline. The initial failure and unchanged repeat
are retained in `.toolchains/design-lab/a2-approval-initial-check.log`,
`a2-approval-initial-report.json` and `a2-approval-recheck.log`; the final partial
report is `.toolchains/design-lab/report.json`. Direct approval-metadata loading
took 7,154 ms for four approved sources. This supports a provisional harness/startup
performance diagnosis; it does not establish an A2 rendering defect. No source,
runner deadline or approval guard was changed to make the run pass. These runs
did not reach the older flow-v1 fingerprint guard recorded at the prior checkpoint.
The combined check remains failed, and the older-reference limitation also remains.

The design handback returns sole checkout writer ownership to the implementation
chat. Production code, product tests, task status/evidence, #38 acceptance, PR and CI
remain with that owner. Design approval leaves its separate TDD-boundary question
pending. All design commits are local-only at handback. The unrelated audit and
protected recovery remain unchanged.
