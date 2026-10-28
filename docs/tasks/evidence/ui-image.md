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

## First Mac SDK run and oracle correction

Candidate `a140614633c02eca691c9aa8acafef3a82302200` starts three SDK processes.
Compile, lint and 1280x720 normal entry exit 0 without timeout or truncated output.
All six widget rectangles match exactly, including PNG/JPEG/WebP and the stretched
PNG. The source bytes remain unchanged and scratch cleanup passes. The run still
fails its pixel gate and establishes no complete rendering pass.
[Original receipt](ui-image-mac-sdk-01.json) preserves that failure.

The gate compared exported Ren'Py RGBA to raw file RGB. The first PNG sample is
`(223,47,63,254)` versus input `(224,48,64)`. The earlier
[engine calibration](canvas-rendering.md#correction-proposal-and-acceptance-boundary)
records this scaling/compositing/export effect. The new discriminating check uses
an independently authored literal Ren'Py screen with the known assets, dimensions
and positions, exported through the same engine path. It requires zero differing
RGBA pixels, actual quadrant content and no edge overflow. It changes no product
source, renderer, color value or tolerance. The missing/different/blank evidence
checks pass. A string-quoting mistake in this checker correction failed Python
syntax preflight and was corrected before any further SDK launch.

The next run may reuse only the two successful compile/lint commands for the exact
same accepted source and asset manifest. It must freshly render both aspects with
the corrected oracle. The failed first run remains charged and retained.
