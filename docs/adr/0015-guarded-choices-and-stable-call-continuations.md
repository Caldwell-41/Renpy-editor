# ADR 0015: Guarded choices and stable Call continuations

- Status: Independently reviewed; focused local proof passed, SDK/target qualification pending
- Date: 2026-10-13
- Scope: Phase 3A.2; extends ADR 0014 without changing its historical evidence

## Context

Phase 3A adds conditional menu options and returning Scene calls to the existing
exact-source model. Recognizing those statements changes source-map segmentation:
some formerly opaque menu rows become one Choice. Reusing schema v4 would silently
change its verification rules. Phase 2 remains **PAUSED — INCOMPLETE**, and this
extension does not expand its AI operation allowlist.

## Decision

Advance source maps to v5 while preserving project and authoring schemas. Verify each
older map against its own recognizer before refinement. Exact matching ranges retain
their IDs and unknown fields. A merged menu may retain the old header identity only
when its preceding records exactly cover the new range. Preserve removed records in
`refinedChildMappings` as non-authoritative extra data; never use them as live identity,
range or patch authority. Existing-key collisions, uncovered records or a candidate
over the existing 1,000,000-byte map-reader limit refuse without writes. Migration
does not rewrite source. Unsupported or comment-bearing menus remain opaque where
a supported edit cannot preserve their bytes.

A Call targets one known Scene and carries a stable source `from` label. The core
generates a collision-checked label for insertion; editing its target preserves the
existing label, spacing and comments through a minimal token patch. Call is distinct
from Jump and Return. Incoming Call references prevent deleting the referenced Scene.
Parameterized/dynamic calls and unbounded recursion remain outside the supported
Call subset. Call insertion and target-edit commands conservatively inspect possible
Call, Jump and Choice routes and refuse unsupported call routes. This early guard
does not run on later Jump/Choice edits, which can introduce a possible recursive
route; observed flow then remains partial/unknown. Closing that authoring gap belongs
to the structural slice before 3A acceptance, while ordinary pure Jump loops remain
allowed. This is not a general boundedness or complete reachability claim and does
not change deliberate execution of ordinary source.
The current bound is 16 active Call frames and 8,192 inspected possible states.
Existing duplicate return labels are diagnosed, and target edits refuse ambiguous
labels instead of repairing them automatically.

Choice options use the shared typed condition representation. Unknown conditions
remain explicit and never become false. When every option is guarded, a no-option
path may continue below the menu. Early authoring requires an explicit safe ending
where needed; this does not by itself establish all later structural completion rules.

Observed flow carries guards, call destinations and exact continuation locations.
Those locations remain read-only projections of saved source. Missing mapped
continuations, including source-authored fallthrough at Scene end, and ambiguous
return labels appear as partial/unknown while source remains unchanged.
Renderer compatibility
shows Calls and guarded Choices safely, with revision-bound Source navigation and
partial/unknown previews. Full condition and Call controls belong to the subsequent
Story slice; renderer previews do not execute callees or infer runtime routes.

## Consequences, alternatives and evidence

Version-specific validation and bounded refusal preserve existing work instead of
silently dropping metadata or rewriting scripts. Stable return labels support the
selected save/return qualification; they do not promise arbitrary saved-game
compatibility after script changes. A second graph store, recursive inline expansion
of callees and a separate mutation layer are unnecessary.

Local checks cover generated labels, minimal edits, history/reopen, guarded-menu ending
refusal, older-map refinement, flow diagnostics and unchanged AI permissions. Final
independent review is clear against the explicit early command boundary. Actual
pinned-SDK proof remains pending. The [3A execution ledger](../tasks/active/phase-3-initial-wysiwyg-release.md#3a-execution-ledger--2026-10-13)
owns exact commits, cumulative checks, failures and qualification status. This decision
does not mark either Phase 2 or Phase 3A complete.
