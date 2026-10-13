# ADR 0014: Typed conditions and recursive source ownership

- Status: Independently reviewed; focused local proof passed, SDK/target qualification pending
- Date: 2026-10-13
- Scope: Phase 3A.1; extends ADR 0012 without changing its historical acceptance

## Context

ADR 0012 qualified one declared-bool If/Otherwise group with direct dialogue children.
Phase 3A needs typed comparisons, ordered Else If branches and nested source ownership.
Phase 2 remains PAUSED — INCOMPLETE. Its unfinished acceptance is independent of this
source extension, and its AI mutation allowlist must remain unchanged.

## Decision

Keep disjoint ordered source ranges as patch authority. A condition group has a stable
UUID; each branch has a stable header Beat ID, ordered ordinal, condition and optional
immediate parent owner. Child ownership identifies the containing group and branch.
Hierarchy does not create overlapping editable source ranges. Group headers stay
protected during this first slice; unsupported statements and multiline Python/string
contents remain opaque. Lexical statement starts, indentation and exact source ranges
jointly determine recognition. Trivia and Unicode/newline formatting are preserved.

Source-map schema advances from v3 to v4; project/authoring schemas remain unchanged.
Validate old maps using their legacy recognizer before refining richer source locations.
Preserve unchanged exact range/hash identities and unknown mapping fields. Migration
uses the existing recoverable metadata transaction and never rewrites `.rpy` source.
Unknown newer schemas still refuse opening. Source-derived verification remains required;
a map, cached graph or caller-supplied owner never independently authorizes a patch.

Conditions use one core typed tree: bool/int/string literals and existing variables,
same-type equality/inequality, integer ordering, `not`, `and`, `or` and parentheses.
Integer values cross JSON as canonical signed 64-bit decimal strings. There is no
Python evaluation, attribute/index access, function call or dynamic variable lookup.
Expression source is limited to 4096 bytes, trees to 128 nodes and depth 16; recursive
condition ownership is bounded to depth 16 within the existing Scene Beat limit.
Validate tree structure before recursive type/evaluation walks, including decoded input.

Unsupported syntax, missing variables, type mismatches and invalid values produce an
explicit unknown diagnostic. A diagnostic projection conservatively retains unknown
operands even where short-circuit evaluation could decide a result; it does not claim
Python evaluation equivalence for unknown inputs or mark unknown branches unreachable.
Known supported values must agree with the pinned SDK. No default-value route inference
or reconstructed state is introduced; that remains distinct from later 3D work.

Existing nested dialogue edits remain exact-owner/revision-bound quoted-text patches
through the shared transaction/history path. Root structural edits cannot split any
condition group, including nested descendants, Else If headers and intervening trivia.
Insertion before a whole root group or after its complete extent remains possible.
Newly recognized nested targets remain refused by Phase 2 proposal preparation.

## Consequences and alternatives

The richer model prepares conditions/calls and Story controls without a second saved
story representation or a second transaction layer. v4 data is intentionally refused
by older source-map readers. Reusing v3 would misrepresent its single-level validator;
rewriting scripts during migration would violate source authority. Keeping all richer
logic opaque would prevent the selected nested authoring outcome.

This decision alone does not deliver editable conditions, calls, Story controls or
3A acceptance. Those slices retain their own review and runtime requirements. The
[Phase 3 task](../tasks/active/phase-3-initial-wysiwyg-release.md#3a-execution-ledger--2026-10-13)
owns exact check outcomes, failures, source identities and qualification status.
