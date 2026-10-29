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


## CI3 dispatch and pending audit

[Run 40816702645](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40816702645/attempts/1),
attempt 1, was created at `2026-10-29T04:15:16Z` on exact published candidate
`b00415f6526476b1c235221f99f03d5cc0547fe5`, branch `codex/phase3b-l06-ui-image`, ordinal 3,
with only `ui_image=true`. GitHub confirms the full identity and successful selection
validation. The Windows image job is pending; the overall run is in progress.
All three dispatches are consumed. Product source remains `9d6bf6b` and the checker
remains `943ea2f`. This wait record changes evidence/status only.

Same-chat ci-watch registration follows publication of this record. Expected identity
is `0ed67040977267fe6b30db2d`; registration is not yet claimed. On the event,
acknowledge delivery and audit the exact run/attempt/SHA, all required stages,
normal-entry/backend/reference/repeat/empty proof at both aspects, coherent helper
Source and pixels, actual retained native executable/hash/architecture, accepted
disk bytes, reopen and cleanup. Audit actual costly starts before updating #40.
Windows SDK 4/16, helper 1/4, package 1/3 and native 1/3 are completed before CI3;
at most five SDK starts and one helper/package/native session are reserved.
Mac use remains SDK 11/16, helper 2/4, package 2/3 and native 2/3. No fourth dispatch,
full Windows pass, ticket acceptance, PR, merge or release is selected or claimed.


## CI3 success audit and review-ready outcome

The same-chat event was acknowledged. GitHub confirms [run 40816702645](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40816702645/attempts/1),
attempt 1, exact `b00415f6526476b1c235221f99f03d5cc0547fe5`, branch
`codex/phase3b-l06-ui-image`, completed successfully. Selector validation and every
required image qualification step pass. Unselected sibling jobs and the conditional
failed-controller diagnostic step are skipped; these are not counted as passes.
Later `d66cd1a` changes wait records only. A Git diff confirms application/workflow/
fixture inputs are unchanged from the tested candidate.

[CI3 audit receipt](ui-image-windows-ci3.json) binds retained artifact
`12873675939`, its GitHub digest/expiry, all 39 file hashes and the independent audit.
The actual Windows executable is now present. Its independently computed SHA-256
`c20bbfbfb21e20648fefad9351cabc007bffc6f94d5aa6871cccbcf57425ee8d` matches the
candidate-bound package receipt; its PE machine is x64 `0x8664`. Windows signing
was not verified or claimed. GitHub retention expires 2026-11-05; the downloaded
artifact remains under ignored `ci3/artifacts/`. No binary/log/SDK is committed.

Normal-entry compile/lint and both normal runs exit 0. Observed renderer is ANGLE2.
Both Source and literal-reference geometry maps have all six exact rectangles.
Independent saved-frame validation finds zero differing RGBA pixels at both aspects,
exact repeated Source captures and entirely transparent empty Render captures.
The helper uses the same freshly exported accepted Source SHA
`6dd73e2b279951551853c2001817fc258a657d6ecd4d00d62eecacbceb04b269`, passes
both aspects with exact geometry and zero differing reference pixels, then passes
typed pending image geometry without Source writes. Shutdown is cooperative and
cleanup complete. No threshold or fixture changed to obtain these passes.

Actual controller/core passes 103 requests, including intended duplicate refusal;
its picker return is a fixture and it executes no SDK. The exact packaged-probe
rehearsal passes. Native WebView session 2 passes the picker/draft/history/Source/
reopen stages and all five raster formats. The native admission gate independently
accepts its report; accepted disk text, no bytecode/saves, no remaining scratch jobs,
fixture and host/request/credential cleanup all pass. Input is synthetic DOM input
through the real packaged WebView, separate from physical keys, OS file-dialog and
human evidence. The inspected compact screenshot keeps Apply above the footer.

CI3 portable checks pass 269 frontend tests, six image-gate cases, two owned-screen
evidence cases, the exact constrained-stack public import regression, 54 screen-core
positives with three explicit SDK ignores, formatting, frontend build and desktop
checking. Prior ordinary release-core and 38-test desktop results retain their
original candidates/scopes; this does not invent a fresh full-core total. Mac GL2
normal-entry receipt 3, helper proof and signed package/native receipt 2 retain the
qualification and unchanged-product basis recorded above.

| #40 criterion | Result and evidence |
| --- | --- |
| Typed UI-image role/picker, formats and retained reference errors | Implemented and automated proof passes through public services, actual controller/core and both native WebViews. Missing/replaced/invalid references retain the draft. |
| Ordinary owned node, asset/size/aspect and shared transactions | Minimal source, atomic metadata/layout, no-op, Cancel, conflict, history and reopen checks pass; supported layout and opaque neighbors remain protected. |
| Actual accepted-size asset, inert picker | Both-host normal entry/helper have exact asset/reference geometry and pixels at both aspects; pending helper images write no Source. Picker/inspection runs no game action or project Python. |
| Cancellation, conflict, history, Source/reopen and containment | Public-service and actual UI/core checks pass; both native sessions pass Source/history/reopen, exact disk bytes and cleanup. Independent completed JPEG import survives screen-draft Cancel. |

All four bounded functional criteria have implementation and automated evidence.
The outcome is `review_ready`, not accepted or closed. Full Design Lab startup
validation remains failed and explicitly retained beside the approved A2 scoped
comparison. Physical-input, human, wider editor and Phase 3B acceptance remain
separate. No PR, merge, release or successor implementation is selected.

Final independent Standards and Spec review of the evidence-only closeout reports
zero findings on each axis. The full comparison base remains `2e045d9`; prior
product/checker reviews remain clear. Both reviewers independently confirm the
39-file manifest, candidate/executable identity and truthful acceptance boundaries.
The status documents shorten the live L06 continuation; their total lengths remain
above workflow targets because earlier protected recovery records are preserved.

Actual CI3 use is five Windows SDK starts, one helper, one package and one native
session. Final cumulative use in #40 is dispatches 3/3; Windows SDK 9/16, helpers
2/4, packages 2/3, native 2/3; Mac SDK 11/16, helpers 2/4, packages 2/3, native 2/3.
All CI1/CI2 failures remain failed and charged. No watcher, costly operation or
required CI audit remains pending. No fourth costly dispatch without a user decision.


## PR 68 review corrections, 2026-10-29

Kris selected correcting all four findings from the review of `2e045d9...780c360`,
with parallel agents, root-cause fixes, TDD, coordinator validation, publication
and workspace cleanup. This section supersedes the earlier clean-review statements
for the current candidate. The approved A2 design and existing costly-operation
limits retain their scope.

Two isolated workers started at `780c360`. Cache/staging commit `98531c1` owns
`screen-images.ts` and its public UI tests. Canvas commit `d9199c6` owns the plan,
reparent implementation and public-service tests. The coordinator integrated them
at `2ce5e39`, added the actual-controller regression and restored its compact
baseline state at tested code checkpoint `ed965339b2802175f2e99bb0a45b7f58fe893a4a`.
The two workers cross-reviewed the other lane without new findings; the coordinator
reviewed the combined production diff and owns the results below.

| Finding | Root correction and red/green proof |
| --- | --- |
| Concurrent decodes exceed the URL budget | Serialize admission through decode settlement. A controlled public picker with three 12 MiB images fails the original budget assertion and passes with bounded pending/completed URLs. Eviction clears mounted references before revocation; late completions cannot attach revoked URLs. |
| Staged previews survive their owner | Track the staged and decoding owner. Cancel, Close, Back, a new selection, successful import and disposal release the applicable URL. Public UI regressions first fail retained-URL and pending-cancellation assertions, then pass. |
| Image samples overwrite pending numeric layout | Merge common and image-specific edits once against the final parent context. The public-service regression first returns accepted position/anchor values, then preserves the requested edits/removals and explicit precedence. The actual controller first drops `xpos: 77` from a 200 by 100 draft, then preserves all three values without changing Source. |
| Reparented image previews use old child order | Append a changed-parent image after the target's existing children in the plan. Twelve public cases cover vbox/hbox/fixed/grid, target source order and same-parent no-op order; draft and accepted child order agree after the fix. |

The reparent regression also exposed a supported move back to the screen root
failing with `SCENE_INVARIANT`. Reparsed Source has no element marker for that
owned root. Preserve its root role within the already matched screen when resolving
the target. A separate red/green public test moves an image out of a vbox while
setting `ypos: 77`, proving both owned-root resolution and final-parent validation.
No generic ownership or opaque-region check was weakened.

Coordinator validation passes 272 frontend tests with no failures/skips,
TypeScript checking, the production frontend build, Rust formatting and 57
screen-service tests. All 60 screen test names are accounted for; only the three
named existing SDK/helper tests remain ignored. The freshly built public driver
passes the extended actual-controller journey and the exact packaged-probe browser
rehearsal, including import, image formats, retained drafts, Source/history/reopen
and normal cleanup. These are controller/core results, not native WebView or SDK
rendering qualification. Required automatic-check results belong to the current
[PR #68](https://github.com/Caldwell-41/Renpy-editor/pull/68) head.

One controller run retained a harness failure after the combined-draft assertion
passed: the added journey left Layout expanded, placing compact Apply at y=1154.
A path mistake prevented the first attempted fixture edit, so the next run repeated
the same failure on unchanged inputs. Restoring the collapsed disclosure after
Cancel fixes the fixture; `controller-green-03` and the probe rehearsal pass.
The product layout and compact visibility assertion are unchanged. This follows
[H21's disclosure/visibility lesson](../../testing/INCIDENTS.md#h21--generated-arrow-names-and-offscreen-inspector-text-break-browser-checks).

Raw red/green logs, the failed controller captures and final local outputs are
retained in primary `.toolchains/pr68-review-fixes-2026-10-29/`. The approved
prototype, original implementation evidence, unrelated audit and protected recovery
remain intact. The inherited status records remain above their soft size targets
to preserve earlier qualification/recovery; only the live L06 continuation changed.

No SDK/helper, package, native session or costly CI dispatch ran for these fixes.
Previous CI3, Mac/Windows SDK/native receipts and all earlier failures retain their
exact candidates and scope; they do not qualify these new draft scenarios. The full
Design Lab startup failure, physical-input/human and wider editor/Phase 3B acceptance
remain open. #40 remains open for acceptance. Publication updates the existing
draft PR; no merge, release or successor outcome is selected.


## Pending image Apply edit ownership, 2026-10-29

Kris selected the remaining PR #68 P2 finding at `1303918`, a root-cause correction,
independent review and update of the existing PR. This is a product defect. Apply
submits width 200; Use original can then display 80, but the earlier completion
clears that newer draft and restores 200 without retaining the later edit.

The first wrong decision was admitting edits while the submitted draft was reserved.
Image inputs and selection already refuse edits during Apply, but Use original did
not, and the embedded numeric editor observed only the later core-write busy state.
The fix applies the existing image-saving state to original-size editing and embedded
layout. Layout synchronizes immediately on image-saving transitions. Both media
validation and commit settlement reserve the controls; success accepts the submitted
draft, while conflict retains it and restores editing. The accepted-edit deletion
logic, source/history operations and approved A2 design are unchanged.

`npm run build:tests` followed by the Node test-name filter
`image Apply reserves original size` initially fails both success and failure cases
with `Original size cannot replace the submitted draft` (`false !== true`). After
the correction, both pass. The public ScreensWorkspace tests hold media and core
completion separately, exercise original size and alignment, verify readonly layout,
and check retained input and restored editing after settlement. Full `npm run check`
passes typechecking and all 274 tests without failures, cancellations or skips.
The production frontend build, repository validator and all 13 section-link
validator tests also pass.

The extended `node tests/ui-image.browser.mjs` journey passes through production
main/controller dispatch and the real core. A held Apply leaves Source unchanged,
original-size/alignment controls disabled and numeric layout readonly. Releasing it
accepts the requested 200 by 100 size, restores editing and retains numeric focus.
Existing import, conflict, Source, history and compact checks also pass.
The same extended runner against the untouched `1303918` frontend and verified
core driver fails the new original-size reservation assertion (`false !== true`),
so the actual-controller check rejects this defect before the fix.
The reused core driver SHA-256 is
`85f5e8add5b01d7ebd684811970cca238d8cd8b2b46cb706a2c4ea0fbe0d37b4`;
its prior receipt records core tree `f933fe64dd49dce34119be675041e73317112e65`,
which matches this candidate exactly. Core and the driver source did not change.

Retained unsuccessful checks are distinct: sandbox localhost listening failed with
EPERM; the first unsandboxed controller used an older local driver and reproduced
the already corrected missing xpos value; the next run used the verified driver but
its new locator omitted controls inside collapsed Layout. Including hidden controls
corrected that harness query; no product rule or timeout changed. Final controller
output is `controller-green-02` under primary `.toolchains/pr68-apply-fix-evidence/`.
That directory also retains frontend output, earlier controller failures and diagnosis.

Independent review reports zero actionable introduced findings for the four-file
code/test diff, SHA-256
`853a8a4c27b3b57898244ef3f378b4a3fb0f1da69a9613da3ce9d735a74ab06d`.
The reviewer independently passes typechecking, test compilation, all ten image
component cases and browser-harness syntax; their first temporary test run had a
fixture-path error, corrected by preserving its directory layout. Reviewed code
checkpoint `e53b5e9` is published to the existing PR branch. Its documentation-only
successor records publication; PR #68 and [#40](https://github.com/Caldwell-41/Renpy-editor/issues/40)
own the latest automatic-check identity, status and terminal audit. The inherited CURRENT
and HANDOVER records exceed their soft size targets to retain protected historical
recovery; this change replaces only the live L06 blocks. No SDK, helper, package,
native session or costly CI dispatch ran. Existing both-host proof
retains its earlier candidates and does not establish this new async scenario. The
full Design Lab startup failure, physical-input/human and wider acceptance stay open.
#40 remains open. This work updates PR #68 and selects no merge or release.


## PR 68 architecture refactors, 2026-10-29

Kris selected all three candidates from the architecture review at
`cd66af6e3f0641069627f2ce2d109d06e8654d03`: combined image/layout draft ownership,
shared Rust image preparation for Apply and the screen canvas, and local ownership
of passive image URLs. The selected outcome includes delegated implementation,
coordinator validation, the Standards/Spec review, updating PR #68 after passing
checks, and safe retirement of the worker worktrees. No merge or release is selected.

The coordinator owns integration and shared documentation. The draft worker owns
frontend Apply and numeric-layout coordination. The Rust worker owns image
preparation and its Screens tests in a separate worktree. After the draft worker
hands off its reviewed checkpoint, a third worker owns passive image URL cleanup.
The frontend assignments run sequentially because both touch `screen-images.ts`;
Rust preparation runs alongside them. Workers do not publish or edit shared status.

All agents use the root-cause and TDD skills. The accepted report and #40's prior
confirmation supply the test interfaces: public ScreensWorkspace and picker
journeys, public screen/asset requests, and the actual controller/core path.
Existing tests characterize behavior during the refactors. Any newly found defect
needs a failing public regression before its fix. Do not invent failures or add
private-method tests to prove file movement.

Validation selects focused frontend and ordinary Screens/core tests, typechecking,
production frontend build, the actual UI-image controller and exact probe rehearsal,
Rust formatting, repository validation and the required automatic PR checks.
Mac ARM64 remains the development host. These changes introduce no SDK, native,
package or platform-specific mechanism. Earlier both-host receipts retain their
exact candidates and coverage; they do not automatically qualify new scenarios.
#40 keeps its existing cumulative limits, including costly dispatches 3/3.
The full Design Lab startup failure and physical-input/human/wider acceptance
remain separate.

### Implementation and local validation

The draft worker delivered `8d4364d`. `ScreenImages` captures the submitted image
command and numeric-layout reservation before media validation. It settles both
submitted drafts before the workspace renders the accepted result. Numeric layout
keeps its own draft key private. The workspace no longer captures that key or
relays image-saving, layout sync and cancellation callbacks. Ten public image DOM
tests pass unchanged before and after, plus 43 workspace/composition cases and
typechecking. This is a behavior-preserving refactor, not a manufactured red test.

The URL worker started from that checkpoint and delivered `1cbe43a`.
`ScreenImageMedia` owns presentation requests, pending/cached/staged URLs, serialized
decode admission, mounted-image detachment before revocation and disposal.
`ScreenImages` keeps picker navigation checks and uses previews without owning URL
state. The same ten public picker/draft cases pass before and after; typechecking
and test compilation pass. No UI, IPC or dependency changes were made.

The Rust worker delivered `7cd586f`. The existing image module now prepares the
in-memory source candidate, final parent context and numeric values for both Apply
and the screen canvas. Asset verification, metadata companions and actual writes
keep their existing owners. The canvas retains original source identifiers and
its planner limits. Existing reparent, NumericLayout and Add checks remain shared.

One new public dispatcher regression finds a real request inconsistency. A common
layout width of 120 combined with an image-sample width of 200 previously returned
an available preview at 200, silently discarding the other width. Apply already
refused duplicate size fields. The first wrong decision was deferring common image
layout without rejecting duplicate dimensions at combined interpretation. Shared
preparation now returns `INVALID_PAYLOAD`; accepted Source is unchanged. The test
fails before the fix and passes afterward. Ordinary position/anchor override
precedence remains covered and unchanged.

The final worker run passes 58 ordinary Screens tests with no failure. All 61 named
results are accounted for, including three explicitly ignored SDK/helper tests:
`canvas_helper_sdk_renders_saved_data_and_stops_on_project_close`,
`image_sdk::ui_image_helper_qualifies_assets_sizes_and_typed_pending_images`, and
`nested_sdk::nested_helper_qualifies_grid_and_clipped_selection_at_both_aspects`.
Those ignores are not passes. The baseline has 57 ordinary passing cases; the new
regression supplies the extra case. Rust formatting and whitespace checks pass.

The coordinator integrated the workers at `5f3b66` and committed the numeric
fixture correction at `79ad8e8`. The integrated core tree
`165c49ea03ce3bcb75d25df4232dc09f228b7c88` exactly matches the tested Rust worker
tree. The frontend exactly matches the tested URL-worker tree. Coordinator checks
pass all 274 frontend tests without failures, skips or cancellation, typechecking
and the production frontend build. The existing chunk-size advisory remains.

The coordinator freshly rebuilt the real controller driver from the integrated
core. Its SHA-256 is
`5eb1c06a214a25900c1a0e67e6351208599123075904592c478d97cec708288a`.
The actual UI-image controller/core journey, exact packaged-probe browser rehearsal
and numeric-layout controller/core journey pass. They cover retained drafts, held
Apply, imports, Source, shared history and reopen under their existing assertions.
These are browser/controller proofs; they start no SDK or native editor.

The numeric journey first failed at Refresh Source after deleting its selected
text. The untouched `cd66af6` frontend reproduces the same failure against the
same driver. Captured DOM shows that the adjacent image became selected and its
Design view hid the shared toolbar. The fixture now returns to Choose before
refreshing, then passes unchanged assertions with the original deadline.
[H43](../../testing/INCIDENTS.md#h43-numeric-controller-assumes-the-toolbar-survives-element-removal)
indexes this existing fixture incompatibility. A coordinator edit first used the
wrong working directory and did not change the file; its ensuing unchanged-fixture
failure remains retained. No product code changed for this harness correction.

Pinned local tools are Node 24.19.0, Python 3.12.14 and Rust 1.90.0. Raw commands,
red/green/final Rust logs, controller results, original numeric failures and captures
remain under the coordinator's ignored `.toolchains/pr68-architecture/` directory.
Worker build output is handed to the coordinator before worker retirement.
No SDK/helper, package, native session or costly CI dispatch ran.

### Independent review and worker cleanup

The code-review skill reviewed fixed candidate
`d238e347d7b8923072ac133a2f47ef2008f0907f` against the full PR base
`2e045d941bf633e73b8161be0096806203fbc2bb`, with the refactor delta from
`cd66af6` called out separately. The two agents reviewed independently and changed
no files. Both used the root-cause and TDD skills.

#### Standards

Zero actionable documented-standard violations or baseline smell findings.
Source authority, shared transactions, narrow media requests and inert canvas
behavior remain intact. The review found no general editing framework or
implementation-coupled replacement tests. Worst Standards issue: none.

#### Spec

Zero actionable findings against #40, the approved A2 scope and the three selected
refactors. Combined draft reservation, shared image preparation and URL ownership
match the selected contract. Existing source-only image-bound restrictions and
acceptance limits remain intact. Worst Spec issue: none.

Standards has 0 findings; Spec has 0 findings. The following closeout edits change
documentation only; application and test material remain at the reviewed candidate.

All three worker heads are ancestors of the reviewed integration head and their
tracked/untracked status is clean. Codex's archive tool refused each completed
worker with "Another active task still uses this worktree", including after the
child tasks were archived. The coordinator retained source snapshots and an
ancestry/status receipt, then used ordinary `git worktree remove` without force.
All three worker checkouts and both worker branches are removed; the Rust worker
was detached and had no branch to retire. Codex may retain stale attachment
records for those removed paths. Its archive operation did not succeed.

The coordinator keeps the integration checkout, transferred Cargo target and raw
evidence. The approved prototype, original implementation/review checkouts,
prior correction checkout, unrelated audit and protected recovery are preserved.
The existing draft PR #68 owns the published head and current automatic-check
state. #40 remains open for acceptance; no merge or release is selected.
