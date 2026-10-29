# Approved A2 handoff

Kris approved A2 in this chat on 2026-10-29 and explicitly requested sending it back
to the original implementation chat. The exact decision is in [approval.json](approval.json).
The approved screen is `ui-image`, revision `inspector-v2`, variant `refined`.
Original A/B/C remain drafts. Earlier Screens, composition, numeric and nested
approvals retain their scope.

Source commit: `8b960282255834972c81ff7d1d13f09293fb366e`.

Source fingerprint:
`f2e36a40ea0072abb3640c3dfe98dcdff78cc19b4cf3725cb281a0b808afb5ed`.

Branch: `codex/l06-ui-image-prototype`, based on
`2e045d941bf633e73b8161be0096806203fbc2bb`. The return message and temporary handoff
identify the final branch commit containing both source and approval. Changes are
confined to the new lab screen, its registry entry and this design directory.
Production files and dependency lockfiles are unchanged.

## Read and compare

[Approval record](approval.json) owns agreed behavior and 18 hashed captures.
[Approval receipt](approval-receipt.json) owns file hashes and check outcomes.
[Refinement notes](REFINEMENT.md) explain control choices, sample behavior and limits.
[Retained captures](captures/inspector-v2/) cover both baseline themes/sizes, adding,
reference failures, pending/conflicted drafts, invalid size, import, empty search,
replacement review and compact editing. Dynamic states follow `refined-check.mjs`.

[Approved wide preview](http://127.0.0.1:5176/preview.html?screen=ui-image&variant=refined&state=placed&theme=dark&viewport=wide).
[Compact preview](http://127.0.0.1:5176/preview.html?screen=ui-image&variant=refined&state=placed&theme=dark&viewport=compact).
[Lab state controls](http://127.0.0.1:5176/?screen=ui-image&variant=refined&state=placed&theme=dark&viewport=wide).
The retained prototype worktree remains the pinned comparison reference. Follow
[INTEGRATION](../../../app/design-lab/INTEGRATION.md) when implementing; keep its
frontend files unchanged. Reuse the existing pinned tools and dependencies.

## Verification and remaining gap

Post-approval TypeScript and approval-record checks pass. The pinned A2 run passes
24 rendering cases and every focused interaction. Approved labels, current pointer,
source fingerprint and all 18 capture hashes agree. Both dark wide/compact baseline
PNGs reproduce byte for byte. An in-memory production build excludes the lab.
Ignored detailed outputs remain under `.toolchains/design-lab/l06/`, especially
`approval-focused.log`, `approval-combined.log`, `approval-audit.json` and
`refined/report.json`. Earlier failed checks and corrections remain retained.

The required post-approval `npm run design:check` fails at its initial navigation
at 8000 ms, after type and approval validation pass. No shared runner, threshold or
other approval was changed. The focused runner retains its documented screen-local
45-second navigation timeout. This is explicit design approval with reproducible
source and scoped proof; complete promotion validation remains unproved. The
implementation owner must resolve or explicitly retain that gap. This approval
waives no #40 criterion. A tooling-only correction that preserves the reviewed
source does not require another design decision.

## Implementation ownership

The original chat owns [L06 #40](https://github.com/Caldwell-41/Renpy-editor/issues/40)
and `codex/phase3b-l06-ui-image`. It owns production mapping, integration, contracts,
status, issue records and product qualification. The user authorized this return
handoff; this prototype chat has performed no remote publication or issue-state edit.

The main loop is choosing/importing a typed UI image, editing displayed dimensions
and requested aspect preservation, then one accepted change. Source, cancellation,
invalid/conflicted/stale references, shared history, reconciliation and reopen must
use real existing services. Reuse prior accepted composition and numeric/nested
controls. Review each visible control against actual service capability; the mock
is not evidence that those capabilities exist.

Import/catalog edits, core handles, source patches, Undo/Redo, file replacement and
reopen are browser-memory simulations. The picker opens no native dialog and
executes no project content. HTML canvas sizing and schematic SVG artwork establish
no Ren'Py rendering or decoding claim. No SDK, package/native operation or costly CI
was performed here. Retain those boundaries until the selected ticket's actual
UI-to-core, SDK and native evidence establishes its acceptance.
