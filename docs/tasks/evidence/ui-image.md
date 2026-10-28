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

## Mac normal-entry SDK qualification

Candidate `c26eeab6ca38d50312585b991a48a0aaf61ea73f` passes both 1280x720 and
1024x768 normal-entry cases in official Ren'Py `8.5.3.26051504`. Its product Rust,
renderer and desktop files are identical to `a140614`; only the test checker and
evidence changed. The accepted source SHA-256 is
`5e1efbb083c9ea966d18447980442f7c69f312b6d1218ef17cd669c7e02a4941`.
[SDK2 receipt](ui-image-mac-sdk-02.json) records both exact source/reference image
hashes, all six rectangles and zero differing RGBA pixels. Fresh hashes of all
four PNGs match the receipt. Visual inspection confirms the distinct quadrant
arrangements and stretched PNG. No tolerance or product rendering change is used.

The checker reuses only SDK1's successful compile/lint for byte-identical accepted
source and asset-manifest bytes, bound by its receipt and input SHA-256. It starts
two fresh normal-entry SDK processes; both exit 0 without timeout or truncated
output, preserve the accepted source and complete scratch cleanup. Original SDK1
failure remains failed and charged. Both attempts' captures, logs and exact
accepted inputs remain in ignored `.toolchains/ui-image/` in the implementation
worktree. #40 owns cumulative operation use; no operation remains running.

This proves the generated source's image selection and dimensions in Mac normal
Ren'Py entry. It does not establish GPU canvas fidelity, Windows SDK behavior,
packaged UI behavior, physical input, mock approval or ticket acceptance.

| Ticket criterion | Current evidence | Remaining proof |
| --- | --- | --- |
| Typed role/picker and missing/replaced/invalid handling | Role, formats and specific reference errors pass through public services. | Actual picker, draft retention and desktop paths. |
| Owned image, size/aspect and shared source transactions | Owned identity, exact minimal source, atomic asset/size edit, no-op and shared history pass. Normal SDK verifies proportional and stretched output. | User-approved aspect controls and actual controller path. |
| Actual asset at accepted size; inert picker | Mac normal entry has exact rectangles and zero-difference independent references. Passive service inspection executes no project code. | Actual picker/controller; Windows normal SDK and changed helper behavior. |
| Cancel, conflict, history, Source and reopen with containment | Conflict, typed-handle/raw-path refusal, source/history/reopen service cases pass. | Import cancellation and Source navigation through actual UI; remaining native evidence. |

Production UI implementation waits for the approved mock from the design chat.
Full-suite verification and both independent review axes remain for the completed
implementation. These local commits have not been pushed.
