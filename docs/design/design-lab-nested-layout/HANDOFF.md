# Approved A2 handoff

Kris's exact final decision was "approved" after reviewing A2 and asking how to
increase viewport height to remove clipping. This approves `focused-refined`,
revision `focused-v2`, for L04 #42. It extends flow-v1, C5 Help composition and
paired-v2 numeric controls. Those earlier approvals retain their scope.

Source commit: `b2fffee2a3983ff309c27502fdfc215f56b1ccd0`.

Source fingerprint:
`98ceba77f44a69e91840ea4afa09e0e19118656fc9caa474a765753d5269e42d`.

[Approval record](approval.json) owns the decision and 14 hashed captures.
[Approval receipt](approval-receipt.json) lists the exact source-file paths,
SHA-256 values, captures, dimensions, themes, scale and check outcomes.
[Refinement notes](REFINEMENT.md) map visible controls to their memory-only sample
behavior and explain the retained prior capabilities.
[Retained captures](captures/focused-v2/) cover baseline wide/compact in both themes,
Choose, Add, Source, invalid grid capacity, viewport sizing, conflicts, Source-only
render refusal, Connect, group removal and compact editing.

## Approved behavior

Keep Choose / Design / Connect with a persistent canvas and one editing panel.
Use the approved paired numeric fields and explicit Apply/Cancel. Show grid
columns, rows, spacing and child capacity together. Link constrained children to
the parent without losing drafts. Keep the nested keyboard hierarchy, sibling
ordering, pending Add preview, explicit parent and confirmed removal of leaves
and whole groups. Preserve focus, scroll, per-element disclosure state, history,
invalid input and conflicted drafts. Source opens separately and selects the same
elements. Compact navigation and preview zoom retain editing state.

Viewport width/height define its stationary opening at the initial top-left.
Increasing viewport Height reveals more content; increasing Window Height also
remains available when the surrounding window constrains it. Window/frame/viewport
have one direct child, including an initially empty container. Grids fill rows in
source order, use `allow_underfull True`, allow empty cells and refuse shrinking
below the direct-child count. The chosen 1–64 axis range is an authoring bound,
not an engine limit. Padding applies to window/frame; spacing to hbox/vbox/grid.
Reuse existing numeric units, dimensions/limits and transaction/history behavior.

Scrolling controls, bindings, offsets, child-size expressions and alternate grid
fill directions remain Source-only in L04. Unknown expressions/ranges must remain
lossless and visibly unavailable to the canvas. Opening or selecting never executes
project content. The Close sample action is read-only; Test in Ren'Py stays deliberate.
No additional runtime-support decision needs confirmation from Kris. Every proposed
mapping still needs production and pinned-SDK qualification.

## Simulation and preservation limits

This is a browser-memory prototype with generated fictional source and schematic
HTML geometry. It proves neither durable saves/minimal source patches nor native
input/SDK rendering. It does not reimplement pointer move/resize, style/asset pickers,
shared-look editing or the broader action builder. Preserve their previous approved
controls and behavior in production. Browser similarities and this approval do not
waive any leaf acceptance criterion.

## Verification and remaining gap

The focused screen run passes 64 rendering cases and all original/refined interaction
modules. Post-approval TypeScript and approval-record checks pass. All source-file
and capture hashes match. The lab's current pointer, Approved label and source
fingerprint agree. All four baseline PNGs reproduce byte for byte. An in-memory
production build excludes the lab; the final cosmetic/state corrections did not
change the production import graph.

The unchanged post-approval `npm run design:check` fails at its first page navigation
at 8,000 ms. Earlier measured approval-record loading took 7,337 ms before this
additional approval. A prior external 45-second-navigation diagnostic passed startup
and 488 cases, then refused changed source for the existing flow-v1 reference.
Neither run is a combined-gate pass. No shared runner, threshold or existing approval
record was edited. The coordinator must resolve or explicitly retain this validation
gap; the prototype chat does not claim complete promotion validation. No second
approval is needed for a tooling-only correction that preserves the reviewed source.

## Integration ownership

Prototype branch `codex/phase3b-l04-prototypes` starts at
`eb83d3b1bfe8fd3f62f13b301300a47b61e96dd6`. Its changes are confined to the new
nested-layout screen, its registry registration and this design directory.
The implementation coordinator reviews and integrates the scoped commits into
`codex/phase3b-l04-nested-layout` and owns production, contracts, status, issue records
and qualification. Keep this worktree/source pinned for comparison; do not change
approved frontend files while integrating production. All prototype work remains
local. No push, PR, merge, issue-state write or native/SDK operation was performed
by this chat.
