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

## Remaining proof

The approved A2 inspector is integrated and the actual controller-to-core browser
sequence passes. Current helper, signed Mac package/native, Windows, final suite
and two-axis review evidence remain pending. No remote code publication, PR,
merge or release is selected. This record grants no acceptance or ticket closure.

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

The entries above retain the earlier core/normal-entry checkpoint. The following
section owns the subsequent approved UI implementation. These local commits have
not been pushed.


## Approved A2 implementation and controller proof

Kris approved `ui-image` / `inspector-v2` / `refined` in the separate prototype
chat. Reviewed source `8b960282` and its fingerprint are preserved in the
[handoff](../../design/design-lab-ui-image/HANDOFF.md), approval and receipt. The
source/capture identities verify. Source and closeout are integrated as `6ecde62`
and `cbf9067`; the original checkout stays pinned. Focused lab checks pass. The
combined Design Lab initial-navigation timeout remains failed. No promotion or
full-design-suite pass is claimed.

The production inspector implements A2's selected asset, displayed size, natural
aspect, original size, advanced layout and single commit area. The wider live
screen selector remains available. Refresh and Validate move into Layout while
editing an image; Test stays beside the preview. Compact editing places the
inspector first. It retains the actual app shell and synthetic PNG artwork for
qualification; schematic game artwork is not product rendering evidence.

| Approved control | Production owner and observable result |
| --- | --- |
| Change/Choose image, search and catalog rows | `authoring.list`, bounded `media.present`, browser decoding and a per-node image draft. Selection writes no Source. |
| Import, Browse, display name, destination, Cancel/import | Images-only `asset.chooseUiImage`, existing import authority and `asset.previewImport`; one `asset.import` transaction. Native cancellation accepts no import. Completed import survives cancelling a screen draft. |
| Width, Height, Preserve aspect, Use original | Natural dimensions, whole-pixel rounding, retained field validation and typed pending helper inputs. |
| Parent and Layout | Existing numeric editor and owned image source movement; supported layout, reference and size share one compose transaction. |
| Apply/Cancel, Enter/Escape | `screens.compose` image commands use the retained Source revision. No-op is disabled; Cancel writes nothing and retains field focus. |
| Changed-file review and Use changed image | `asset.reviewUiImage` returns passive current bytes; Apply alone accepts reference metadata and Source together. |
| Source, Undo/Redo, order/removal and Test | Existing Source modal/editor, shared transaction history, owned composition and deliberate accepted-source runtime request. |

Two focused actual-controller component tests pass for natural ratio, invalid
input, no-op, Escape/Enter, focus, per-node drafts and cancelled browsing. The
protocol slice also passes. Forty-three existing composition/legacy-screen tests
pass after integration. These are focused checks, not the final full suite.

The production application/controller/public-core browser sequence passes in
`controller-03` and `controller-04`. It imports real PNG bytes, adds an ordinary
owned image, accepts proportional and stretched sizes, verifies exact Source,
Undo/Redo, no-op, Source draft retention, external-edit conflict, read-only
replacement review followed by Apply, and missing-file retention. All operations
use actual application dispatch and transaction/history. Canvas requests produce
real inert plans; this browser check starts no SDK. Native chooser results are
explicit test fixtures, so these passes establish no OS-dialog behavior.

`controller-01` failed after cancellation because its next Add skipped Choose.
`controller-02` reached accepted/history proof but failed compact placement due to
excess toolbar height. The corrected image layout keeps ancillary tools under
Layout, preserving their operations. Both failures remain retained; later passes
require Apply within the compact viewport, and `controller-04` also requires it
to be the element at its visible center.

The exact packaged probe's browser/core rehearsal passes in `probe-controller-03`,
including one initial busy read, passive image decoding, picker cancellation,
accepted sizes, validation/focus, history, Source reconciliation with an opaque
neighbor and disk reopen identities. Rehearsals 1 and 2 failed because the probe
looked up a nested-label button by text and assumed reopening restored the Design
step. The probe now uses the actual accessible name and explicitly opens the
remembered image. No product behavior or deadline was relaxed. These rehearsals
consume no SDK, native session or package operation.

The extended public service cases cover read-only replacement review with atomic
reference metadata/Source history, atomic parent/numeric layout, and typed inert
canvas image samples. The broad twelve-case image run exposed a diagnostic
regression for invalid replaced bytes; checking a changed reference before
attempting decode restores the specific `UI_IMAGE_CHANGED` result. Its focused
regression passes. Original failed test output remains in local command history.

## Helper qualification in progress

Helper attempt 1 starts one Mac GL2 helper/SDK and returns the 1280x720 frame with
all six correct rectangles. The test then incorrectly looked up owned IDs after
copying only Source without source-map ownership. Inspection correctly returns
no owned IDs for that passive copy. The failed test and first image frame remain
under `helper-01`; later frames, reference pixels and typed drafts did not run.
The targeted correction compares the parsed image spans in Source order and
keeps every geometry/pixel/cleanup assertion. No product code, rendering value or
tolerance changes. The owning ticket retains cumulative operation accounting.


Helper attempt 2 passes at 1280x720 and 1024x768, all six exact image rectangles,
zero differing RGBA pixels against independently authored literal helper references,
and four distinct nontransparent fixture quadrants in each image. The pending
image uses a verified typed asset and numeric placement without Source writes.
One helper handles the sequence, then exits cooperatively with code 0, complete
cleanup and no helper directory left. [Receipt](ui-image-mac-helper.json) binds the
accepted Source hash and both pixel-pair hashes. Raw frames, PNGs and reports stay
under `helper-02`. The first failed fixture attempt remains charged and failed.
This is Mac GL2 helper proof, separate from native/Windows and human acceptance.

A third focused controller test verifies advanced numeric layout shares one image
command. Its first run exposed lost keyboard focus after accepting a layout field.
The correction restores the advanced field by its layout key after remounting;
the focused test passes. The original failing assertion's cyclic DOM reporter
ended as a failed test process and was not counted as a pass. No SDK was involved.
`controller-05` passes the complete actual UI/core sequence and retains a clean
compact viewport capture after resize. Its visible Apply center is unobscured.
A final compact spacing adjustment keeps the entire button above the app footer.
