# ADR 0012: Bounded nested dialogue ownership

- Status: Accepted and integrated bounded checkpoint; independently reviewed and Windows/macOS qualified
- Date: 2026-10-07
- Scope: Phase 2 section 21, bounded 3A.1/3A.2 foundation

## Context

The flat Scene projection represents indented conditions as protected Custom Code.
AI target planning needs explicit child ownership before it can expand around nested
Story content. This outcome recognizes an existing declared-bool `if`/`else` group;
it does not author conditions, evaluate expressions or implement full 3A.

## Decision

Keep the source-authoritative, disjoint ordered Beat ranges. Protected header rows
have stable branch Beat IDs and `conditionalBranch` metadata: a separate group UUID,
declared bool Variable UUID and an `otherwise` flag. Direct dialogue children have
`owner: {groupId, branchId}`. Their Scene document/source map binds exact source
revision, byte range and hash; Source ranges also expose UTF-16 positions. This is a
small structural projection on the existing map, not another saved story document.

Source-map schema becomes v3; project schema remains v2 and authoring remains v1.
The existing recoverable migration handles v1/v2 maps, preserving UUIDs and unknown
fields. A v2 opaque child is refined only when its range/hash and the entire Scene
revision match. No `.rpy` write occurs. Unchanged reopen does not rewrite metadata.

`updateChildDialogue` supplies Scene ID, child Beat ID, exact displayed owner, source
revision and the existing Character ID. Preparation checks that owner and refuses
speaker changes. It patches only the quoted text using the existing transaction,
history, conflict and recovery services. Anchored forced-ID reuse prevents a new
identical line from taking a sibling's ID. Root insert/move/remove/update/continuation
commands refuse child targets and movement ranges containing children. Root insertion
cannot split the group through branch headers or intervening trivia; insertion before
the whole group or after its last child remains available. Group headers stay protected.
Appending after a child without a final line ending adds only the necessary separator
using the existing newline policy. Its extended range/hash is anchored to the same
Beat ID, preserving ownership and unknown mapping fields.

Recognition accepts exact four-space bool headers, an explicit Else body, and direct
eight-space canonical dialogue plus blank/comment trivia. Both bodies need dialogue.
Unknown expressions, missing/non-bool variables, nested conditions and executable
custom bodies stay opaque. Opaque source outside the recognized group survives.
Story presents indented selectable children and read-only If/Otherwise rows, disables
structural/speaker edits and retains input on refusal. Preview stays partial and does
not execute both branch bodies or infer a variable route.

## Consequences and verification

Existing flat Scene editing and ID contracts remain. These locations are sufficient
for one existing-child text edit; insertion anchors/full expressions/calls require a
later selected outcome. Existing Source reconciliation and runtime adapters remain
shared. Core/renderer regressions reject wrong owners, stale sessions/revisions and
root operations, and compare exact bytes/IDs across migration/history/reopen. The
optional packaged `source-foundation` case and separately selected pinned-SDK gate
qualify real native action and true/false syntax outcomes. Supported-target proof and earlier failure
evidence are recorded in the [owning ledger](../tasks/archive/2026-10-09-phase-2-execution-history.md#23-source-foundation-implementation-ledger--2026-10-07), never inferred from a fixture.
