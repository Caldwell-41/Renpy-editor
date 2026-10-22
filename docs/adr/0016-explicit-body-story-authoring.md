# ADR 0016: Explicit-body Story structural authoring

- Status: Independently reviewed; scoped both-target frontend/core/SDK qualification passed; Phase3A acceptance pending
- Date: 2026-10-13
- Scope: Phase 3A.3 core authoring; extends ADR 0014/0015

## Context

Recursive source ownership and guarded returning flow need authoring commands whose
parents and insertion positions remain explicit. Selection alone cannot authorize a
nested write. Source, comments, unsupported regions, stable identity and the shared
transaction/history layer remain authoritative. Phase 2 is PAUSED — INCOMPLETE;
its AI mutation permissions do not expand.

## Decision

Use `BodyRef` for root or a group/branch pair, `NodeRef` for a Beat or whole condition,
and `Position` for before an immediate sibling or literal body end. Beat refs cannot
address branch headers. Existing-node operations capture the expected body; branch
commands capture the containing group's parent body. Every command retains Scene/source
revision and existing project/map/session envelopes. Core validates all membership,
ancestry, exact source ranges and the selected label's lexical extent before preparation.
Later Python/screen declarations cannot authorize projected Story rows.

Expose nested Beat insert/update, condition insertion, branch condition edit/add/remove,
whole-node move/remove and selected-branch unwrap. Initial If cannot be removed alone;
Otherwise is unique and last. Unknown/raw conditions are not authored. Moves remain
within one Scene and cannot target the selected subtree or its own anchor. Unwrap keeps
exactly the selected branch, not a concatenation of mutually exclusive bodies.

Assemble disjoint source-range patches and anchor retained/moved physical records so
UUIDs and mapping extras survive shifts and qualified reindentation. Preserve selected
branch comments and blank lines using its full safely owned source extent, separately
from the insertion boundary. Ambiguous outdent trivia refuses. Same-indent complete
subtrees may retain opaque bytes unchanged; cross-indent custom/multiline/tab source
refuses unless qualification proves safe. v5 inline-comment dialogue/narration that
would become Custom Code at root refuses promotion byte-identically. Do not drop
comments, repair scripts or broaden recognition to make an operation pass.

Empty branches use a canonical exact `pass`. `structuralPlaceholder: true` is a derived
SceneBeat hint only for a sole verified branch placeholder; it is not persisted source-
map authority or a writable Beat. Replace only that verified placeholder on insertion.
The flow projection treats the qualified pass as inert. Recognition and source-map v5
remain unchanged, so no new migration is needed.

Keep root ending protections: authoring may not introduce a new Scene fallthrough.
Validate possible transfer routes against the actual patched candidate, replacing old
edges, through both legacy and explicit-body commands. Preserve pure Jump loops and
the existing conservative Call bounds; source-defined unknown flow stays explicit.
No command evaluates Python or changes deliberate execution permission.

All accepted edits use one existing semantic transaction/history operation, including
source/map companions and obsolete compiled-file handling. Conflicts, unsupported
boundaries and failed preparation refuse without source/map/history writes. Source
round trips and external editing continue to use the same authority.

## Consequences and evidence

The UI can name exact parents and destinations, preserve revision-bound drafts and
show delete versus unwrap explicitly. Conservative refusal keeps unsupported bytes
intact rather than silently promoting them into a different editable role. This is
not a general Ren'Py parser or an arbitrary reindentation tool.

Independent review and 30 focused core tests cover all command paths, stable IDs/extras,
minimal headers, selected trivia, pass replacement, moves, history/reopen and exact
refusals. Earlier failed runs remain in the [Phase 3 ledger](../tasks/evidence/phase-3-history.md#3a-execution-ledger--2026-10-13).
Actual frontend-to-core and final both-target saved-callee/runtime proof pass CI4.
This decision does not accept Phase3A or resume Phase2.

Scoped final CI4 evidence and limits are recorded in the [terminal audit](../tasks/evidence/phase-3-history.md#ci4-terminal-audit-and-scoped-qualification--2026-10-14).
Prior failures, portable visual self-review and user acceptance remain distinct.
