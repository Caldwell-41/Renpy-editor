# UI-image evidence

[L06 #40](https://github.com/Caldwell-41/Renpy-editor/issues/40) owns scope,
acceptance and cumulative costly-operation accounting. This record retains
candidate-specific results. Implementation starts from `2e045d9` on
`codex/phase3b-l06-ui-image`. The separate prototype chat owns design approval.

## Core and fixture preparation, 2026-10-29

Kris confirmed tests at the public screen/asset service, actual controller and
pinned Ren'Py rendering boundaries. Production UI files have not changed.

Public service tests establish typed import, contained project paths, one shared
Undo/Redo entry, stable Asset and node IDs after reopen, exact source additions,
comment and opaque-neighbor preservation, atomic asset/size changes and no-op
history. They refuse missing/replaced/wrong-role/stale-hash/raw-path references
and ordinary external source conflicts without changing source. Invalid raster
imports preserve files, metadata and the previous history boundary. The 16 MiB
UI-image limit has a specific diagnostic. PNG/JPG/JPEG and lossless/lossy/alpha
WebP staging and presentation use real retained fixtures without project execution.

The affected screen run passes 49 tests with zero ignored or failed cases. Its
two named SDK tests were explicitly excluded; this is no SDK result. Three
existing media tests also pass. Later focused cases cover the byte-limit
message and generation of a six-image accepted-source fixture for SDK proof.
The current nine image-service cases pass after the fixture update, with zero
failed or ignored cases. Both rejecting SDK-evidence tests pass. Frontend
typechecking passes, and repository validation passes for the checkpoint.
Runtime qualification of the changed candidate is recorded separately below.

The new SDK checker requires exact asset rectangles, pinned SDK version, both
aspects and actual quadrant pixels, with no right/bottom overflow. Its rejecting
checks cover missing/wrong geometry and a transparent placeholder. These cheap
checks start no SDK process. Accepted inputs bind the source and fixture hashes.

Expected TDD failures first showed the missing role, invalid-byte admission,
unsupported WebP containers, missing image commands, untyped draft admission and
the legacy 512 MiB message on the new 16 MiB path. Corrections address those
boundaries. Three fixture/test mistakes remain recorded: the initial close call
used a nonexistent method; the synthetic project lacked its standard images
directory; numeric-layout values are serialized floating-point numbers. No
production rule was relaxed for those mistakes.

The first accepted-input generation used visually identical codec fixtures.
The second uses distinct quadrant arrangements and supersedes it for rendering
qualification. Neither preparation starts an SDK. The original generated input
is retained in ignored local evidence.

## Pending proof

Mock approval, actual UI-to-core operations and draft retention, import
cancellation, aspect controls, Source navigation, helper/normal SDK rendering,
required Windows/macOS desktop proof and final two-axis review remain pending.
The full frontend/core suite belongs to final implementation verification.
This record grants no acceptance or ticket closure. No remote code publication,
PR, merge or release is selected.
