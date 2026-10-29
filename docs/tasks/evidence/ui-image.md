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

| Ticket criterion at `c26eeab` | Checkpoint evidence | Proof still pending then |
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


## Final suites and review corrections

Implementation checkpoint `96c55af` passes the documented ordinary release-core
selection: 446 positive tests, zero failed/measured, 50 explicitly ignored
specialist/SDK cases and the three documented named exclusions. Its 499-test
inventory and full output remain under `final/`. Those ignored/excluded cases
are not passes. The later native-fixture extension changes disposable probe data
only; ordinary production/core behavior is unchanged.

The first full frontend run has 266 passes and one failure because its old catalog
expectation omitted the new UI images category. The expectation now matches the
requested role. The next run lacked the required Python PATH and failed existing
`tomllib` consumers under Python 3.9. The final run explicitly uses bundled Python
3.12.14 and passes all 269 tests with zero failed/skipped/cancelled cases. Both
failed logs remain alongside `frontend-final.log`.

Independent Standards review at `96c55af` found one Apply/draft identity defect;
Spec review found the same defect and one stale import-stage defect. A delayed
media read allowed selection to change before the workspace became busy, and
acceptance used that current selection rather than the submitted image. The fix
reserves screen/element navigation through validation, settles image drafts by
submitted node and base revision, and captures the numeric draft key before the
write. Picker navigation now advances a request generation; late preview, decode,
selection and replacement completions cannot replace a newer stage. Import commit
disables navigation until its result, and successful imports select their exact contained destination. Existing
duplicate-content refusal remains unchanged.

Both new actual-controller regressions fail before those corrections and pass
afterward. Five focused image cases now pass, including advanced numeric focus.
A test-edit preflight initially matched no insertion point and therefore ran no
new case; it is not regression proof. The successful red/green runs are separate.
The full frontend suite includes the new cases. Both review axes must re-review
the correction before final closure. Native/Windows and combined Design Lab proof
remain outside these test results.


The all-format packaged-probe rehearsal passes in `probe-controller-04`, using
real passive PNG/JPEG/lossless/lossy/alpha WebP presentations. Its native evidence
gate requires each named format and decoded image result. Thirty-eight desktop
unit tests pass after building the production frontend required by Tauri. The
first desktop compile correctly refused a missing `dist/`; it started no package,
SDK or native session. The production build passes with its existing chunk-size
warning; no bundler threshold changed.

The extended browser import test first attempted a second import of identical
PNG bytes. Core correctly returned `DUPLICATE_CONTENT`; the test's expectation of
a second imported Asset was wrong. Existing duplicate policy is preserved. The
corrected sequence verifies that refusal and retained display name, then imports
a distinct JPEG and cancels its screen draft while retaining the catalog Asset.


## Signed Mac package and native result

Candidate `19d71e8697ca7a8294179b8c720c1e9b4cdafe23` passes package build 1 with the
unchanged approved signing identity, strict signature and installer-contents
verification. [Receipt](ui-image-mac-native.json) binds the exact executable and
installer hashes, full native report and desktop admission/power evidence.
Native session 1 passes all five required stages and completes with exit 0.
PNG, JPEG and static lossless/lossy/alpha WebP decode through actual media services
in the packaged WebView. Typed picker cancellation, accepted proportional/stretch
size, invalid draft retention/focus, no-op, Undo/Redo, Source reconciliation with
an opaque neighbor and reopen identities pass. Accepted bytes match disk; there
are no scratch jobs, source bytecode, saves or disk errors. Fixture deletion and
host/request/credential cleanup pass; desktop assertions release completely.
This is synthetic DOM input through a signed native WebView. OS file-dialog,
physical-keyboard and human acceptance remain distinct; this profile starts no SDK.

`controller-07` completes the corrected production UI/core sequence with 104 actual
operations, zero page errors, duplicate-content refusal, distinct JPEG import
retained after screen-draft Cancel, reference failures and Source/history proof.
Its compact capture shows the complete Apply control above the app footer. The
A2 inspector hierarchy, 326-pixel wide panel, paired 32-pixel fields, flat styling,
Layout disclosure and compact editing order match the approved version. The live
screen selector, existing app shell and preview controls remain; their labels and
synthetic artwork differ from the lab fixture. The browser comparison has no
SDK frame and establishes no pixel-identical whole-app claim. Actual asset rendering
is covered separately by the normal-entry and GL2 helper receipts. The full Design
Lab startup timeout remains failed; no threshold or reviewed source was changed.

Standards initially reported one finding and Spec two (one shared). Both axes
re-reviewed `19d71e8`, report zero remaining findings and identify no new issue.
Their review base is the user-confirmed `2e045d9`. The subsequent changes are
workflow/evidence only. The Windows route keeps independent helper/native evidence
running after a nondependent normal-entry failure, while the original failure
continues to fail qualification. It retains exact candidate/dispatch guards and
partial artifacts; planned maxima are five Windows SDK starts, one helper, one
package and one native session in one dispatch. Nothing has been dispatched.

Windows remains the required platform gap. No ticket acceptance/closure, push,
PR, merge or release is claimed. #40 owns current cumulative operation counts.


## CI1 dispatch and waiting state

Kris explicitly approved pushing `8eeabc9` and running focused Windows CI. The
reviewed branch is published at full SHA `8eeabc90401374fa57fe1ed2e3ef9d3ddcc149de`.
[Run 40807895621](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40807895621),
attempt 1, was created at `2026-10-29T02:41:57Z` with `ui_image=true`, candidate SHA
and ordinal 1. GitHub confirms the same branch/SHA; selection validation passes
and the Windows image job is in progress. All other outcomes are unselected.
CI dispatch 1/3 is consumed. Planned Windows maximum use is five SDK starts, one
helper, one package and one native session; actual started use remains for the
artifact audit. No Windows pass is claimed.

Dispatch metadata remains under ignored `ci1/dispatch.json`. The same-chat
ci-watch identity is `54808829bd2759b1df041151`. After its event, acknowledge delivery, verify
attempt/candidate and audit all retained artifacts, including failed or partial
results. Source material still equals the cleared and signed Mac candidate; local
status/evidence edits do not change the published candidate. No PR, merge or
release is selected.


## CI1 Windows import stack failure

Watcher `54808829bd2759b1df041151` delivered failure and was acknowledged in this
same chat. GitHub confirms run `40807895621`, attempt 1, exact head `8eeabc9`.
Portable checks pass: 269 frontend tests, both named Python evidence slices,
54 screen-core tests (three explicit SDK cases ignored), production build and
desktop check. The real controller driver then exits with Windows status
`3221225725` (`0xC00000FD`) and `main has overflowed its stack` during the first
native-fixture image selection. The UI's missing Display name timeout and cleanup
exit are consequences of that producer failure. The all-format probe rehearsal,
SDK, helper, package and native steps never start. CI dispatch use is 1/3;
Windows SDK/helper/package/native use remains zero.

The partial artifact contains candidate identity and the false controller report.
It has no tested controller executable; that missing diagnostic artifact is not
invented or treated as recovered. The corrected route retains and hashes that
exact executable on any later controller failure. CI1 logs, partial artifact and
run metadata remain under ignored `ci1/`.

This is a product defect in existing import infrastructure exposed by L06.
`authoring::hash_file` places a 1 MiB array on the stack. The public select/preview/
UI-image import regression reproduces stack overflow in a child test process
with a 256 KiB stack (`stack-red.log`). Moving that buffer directly to a `Vec`
passes the same test (`stack-ui-green.log`). Pattern search finds one sibling
1 MiB array in `transaction::copy_hash_bounded`, used by legacy streaming imports.
Extending the same public-service regression to Background import reproduces
that second failure (`stack-stream-red.log`). Both buffers now allocate on the
heap, matching the existing SDK hashing correction. No stack reserve, byte cap,
checksum, retained-handle check or acceptance threshold changes.

The regression spans multiple hash chunks and verifies count, natural size,
SHA-256 and exact accepted bytes through the public services. It is a regression
for the observed product crash, not a hostile-filesystem or persistence-termination
campaign. Targeted debug/release verification and fresh package/native evidence
are required before claiming the corrected candidate qualified. Original CI1
and both red reproductions remain failed. No retry has yet been dispatched.


The corrected authoring slice passes all 33 tests. The constrained-stack regression
passes in both debug and release builds, for both bounded UI-image and legacy
Background import. The existing 17 MiB streaming import/metadata/history case,
maximum-size refusal and ordinary post-stage failure classification also pass.
The code change is two allocation expressions; the read/hash/write loops and their
limits are unchanged. [CI1 receipt](ui-image-windows-ci1.json) records the failing
candidate, positive portable slices, missing executable and zero Windows costly
starts. Runner orphan cleanup does not establish fixture cleanup after the abort.

CI2 adds the regression before expensive stages and preserves the exact failed
controller executable/hash if another controller failure occurs. This changes
qualification only; no new test controller or product capability is introduced.
A fresh signed Mac package/native case will qualify the changed core material.
Existing SDK/helper geometry and pixel proof retain their scope: source generation,
asset fixtures, renderer, helper/runtime protocol and SDK adapter are unchanged;
public import checks establish the same bytes and hashes after allocation changes.


## Stack correction qualification and CI2 preparation

Both review axes clear `9d6bf6b` against the user-confirmed base `2e045d9`.
The public controller/core sequence `controller-08` passes after rebuilding the
actual driver with both allocation changes. No frontend/product layout changed.
Signed Mac package build 2 and native session 2 pass at exact product candidate
`9d6bf6bdbb87d1f01c3e529b945d0e2ac6d84953`.
[Receipt](ui-image-mac-native-02.json) binds signature/installer checks, executable
hash, native stages, exact accepted disk bytes and complete fixture/host/request/
credential/power cleanup. The executable hash still matches after the session.
All five raster variants decode; validation, aspect/stretch, history, Source and
reopen pass. This profile starts no SDK and establishes no physical/OS-dialog or
human proof. Both original Mac receipts remain retained on their own candidates.

Cumulative Mac use is SDK 7/16, helpers 2/4, package builds 2/3 and native sessions
2/3. Windows use remains zero and CI dispatches remain 1/3 before CI2. The next
selected operation is ordinal 2 on the pushed correction plus evidence-only
closeout. Planned Windows maximum remains five SDK starts, one helper, one package
and one native session. Do not retry CI1 or reset prior consumption.


## CI2 dispatch and waiting state

The corrected branch is published at `d9ac51db5d5ef1965f4c2221f58829bd01b78113`. This evidence-only head
contains product correction `9d6bf6b`, which passed focused checks, both review
axes and fresh signed Mac package/native qualification. [Run 40812796885](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40812796885),
attempt 1, was created at `2026-10-29T03:33:27Z` with `ui_image=true`, exact candidate
and ordinal 2. GitHub confirms branch/SHA; selection validation passes and only
the Windows image job is in progress. Dispatch 2/3 is consumed. CI1 remains failed.

Same-chat ci-watch identity is `2aae7e077890903288a864c0`. Raw dispatch metadata remains under
ignored `ci2/`. On its event, acknowledge delivery and audit exact run/attempt/SHA,
all required stages, independent source/reference pixels, package/native identity,
accepted disk bytes, cleanup and actual costly starts. Windows use remains to be
audited. No pass, PR, merge, release or complete ticket acceptance is claimed.


## CI2 Windows capture failure and reassessment

The CI2 watcher event was acknowledged in this chat. GitHub confirms run
`40812796885`, attempt 1, exact candidate `d9ac51d`; it remains failed.
[Receipt](ui-image-windows-ci2.json) retains the normal-entry failure and independent
positive helper/native/package slices. Stack regression, 269 frontend tests,
54 screen-core positives (three SDK ignores), actual controller/core and exact
all-format probe rehearsal pass. The import stack defect is qualified on Windows.

Compile/lint and the first 1280x720 normal-entry run exit 0, preserve Source and
clean scratch. Its six Source rectangles match exactly, but source/reference PNGs
differ at 149 pixels: 143 near the scaled lossless WebP's lower edge and six near
the lossy WebP edge. PNG/JPEG/alpha WebP/stretched PNG match exactly. The old checker
requests dummy video and software rendering, uses private `render_to_texture`/
pygame export calls and records no actual renderer. These data establish a failed
capture comparison, not a proven defect in the product's ANGLE2 image path or an
identified native decoder memory defect. The failed images and measurements stay
under ignored `ci2/artifacts/sdk/`.

Independent ANGLE2 helper proof passes both aspects, all six exact rectangles,
zero differing reference RGBA pixels, typed pending image and cooperative cleanup.
Those frames/pairs were rechecked locally without an SDK start. Windows x64 package
identity/hash and all native stages, exact disk bytes, reopen and complete cleanup
pass. No Windows signing verification is claimed. The tested release executable is
missing from the artifact, so its hash cannot be independently rechecked; CI3 now
retains that exact binary in addition to the existing identity receipt. This is
missing diagnostic evidence, not recovered evidence.

Actual CI2 use is four Windows SDK starts (compile/lint/first normal entry plus
one helper), one helper, one package and one native session. Dispatches are 2/3.
No later aspect was run by the failed normal-entry checker. Unchanged Mac use is
SDK 7/16, helpers 2/4, package 2/3 and native 2/3 before the new capture check.

The smallest discriminating correction is in the qualification harness: select
native `gl2`/`angle2`, require the observed backend, and use public
`renpy.render_to_file(..., resize=True)` for isolated Render captures. The existing
product helper already uses that route. [Ren'Py capture docs](https://www.renpy.org/doc/html/screenshot.html)
state the Render and virtual-size contract; pinned 8.5.3 `displayexports.py` confirms
it. The [renderer documentation](https://www.renpy.org/doc/html/display_problems.html)
is current 8.5.4 and identifies model renderers; pinned 8.5.3 still contains an
internal software fallback, so no claim is made that its implementation is absent.

The new gate admits both Source and independent-reference rectangles, exact
source/reference RGBA, an exact repeated Source capture and a transparent empty
Render. It rejects fallback/unknown/missing renderer, unstable capture, whole-window
capture instead of Render isolation, wrong dimensions and placeholder images.
The renderer-admission test first fails against the old checker; all six gate
unit tests pass after correction. No pixel tolerance, color, asset, Source,
product renderer, timeout or product code changes.

Next qualify this capture locally with four Mac SDK starts within the remaining
16-start ceiling, then review before selecting final CI ordinal 3. The last run
is still the bounded existing Windows qualification. Fresh coherent Source inputs
must pass normal entry and helper together; executable retention remains unresolved,
so package/native artifact proof also runs. Original CI1/CI2 failures remain failed.

## Native capture correction qualified on Mac

[Mac normal-entry receipt 3](ui-image-mac-sdk-03.json) passes at exact checker
candidate `943ea2f71b64074be6a8f877cda3886d8bcdeee1`. Compile, lint and both
normal-entry aspects exit 0. The observed renderer is GL2. Source and independent
reference have all six exact rectangles and zero differing RGBA pixels. Repeated
Source captures are exact and empty Render captures are entirely transparent.
Saved frames, receipt hashes and accepted Source SHA were independently rechecked
without another SDK start. Scratch cleanup is complete. All four selected starts
ran; Mac cumulative use is now SDK 11/16, helpers 2/4, packages 2/3, native 2/3.

The accepted Source SHA is
`616aa909c71dae7a9e9305796e123200330d847080562cdf4d5f97ec15430edf`, matching
the inspected public-service output used in CI2. Product code remains unchanged
from `9d6bf6b`; signed Mac package/native receipt 2 retains that exact material.
Both independent review axes clear `d9ac51d..943ea2f`, with the full review base
still `2e045d9`. No pixel threshold or supported asset changed.

Final CI ordinal 3 is selected after publication of this evidence-only successor.
It runs the existing focused Windows workflow with fresh coherent normal-entry
and helper Source, plus package/native proof and actual executable retention.
The maximum is five Windows SDK starts, one helper, one package and one native
session. Windows completed use remains SDK 4/16, helper 1/4, package 1/3, native
1/3 before dispatch. CI use is 2/3. No further costly dispatch is available after
ordinal 3 without a new user decision. CI1/CI2 remain failed; no Windows normal-entry
pass or ticket acceptance is claimed.
