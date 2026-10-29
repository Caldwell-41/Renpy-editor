# Project font evidence

[L05 #39](https://github.com/Caldwell-41/Renpy-editor/issues/39) owns the selected
outcome and acceptance. Kris selected implementation on a new branch on
2026-10-29. The implementation branch is `codex/l05-project-fonts`, based on
`8f0d208`. Mac ARM64 is the development host. Windows x64 and Mac ARM64 evidence
must cover the affected paths.

## Preparation, 2026-10-29

The separate "Ticket 39 font and typography mockups" chat owns only L05's Design
Lab screen, registry entries and approval/capture directory in its own worktree.
The implementation owner retains production code and qualification. Production UI
integration waits for Kris's explicit mock approval and the design handoff.

The proposed test boundaries are public asset/screen services, the actual screen
controller connected to core, and pinned Ren'Py output. The TDD skill requires
confirmation before writing tests at these boundaries; that question is pending.
No new test or production code has been written.

Unmodified TTF and CFF OTF fixtures are retained with their upstream revision,
SHA-256 hashes and license in the [font fixture directory](../../../tests/fixtures/phase-3b-screens/fonts/README.md).
They establish reproducible inputs, not font admission or rendering proof.

Baseline frontend typechecking passes. The ordinary screen-core selection passes
58 tests; three explicitly selected SDK/helper cases remain ignored. This run
starts no SDK, helper, package or editor session. Local tools match the repository
pins: Node 24.19.0, npm 11.9.0 and Rust/Cargo 1.90.0.

Automatic approval review rejected the initial GitHub progress comment because
the implementation request did not explicitly authorize publishing its branch,
host and operation-limit details. No tracker mutation occurred. The exact proposed
comment is retained in ignored local output, and a user approval question is
pending. All costly-operation counters are still zero. No code push, PR, merge,
release, native, rendering or ticket acceptance is claimed.

The initial next step was to confirm the test boundaries and obtain mock approval.
The design approval below resolves the latter; boundary confirmation and tracker
approval remain pending.

## Approved A2 handoff, 2026-10-29

Kris approved `project-font` / `inspector-v2` / `refined` in the design chat with
"Approve A2 and send it back to the original implementation chat."
The [handoff](../../design/design-lab-project-font/HANDOFF.md) maps every control
to its required real operation and retains the design's simulation limits.

Reviewed source `79d958d5c45dfd12073c2192de05128d6ed19a91` and approval commit
`54f4ebb8112b6becdc1d24e6228c6a9fb70957c5` are integrated through local
`38d26b7`, `965e6d4` and `804405d`. The implementation checkout's frontend/lab
fingerprint matches the approved
`83a92587e4c13ad2a94fa1c69dbfcd6c87ef927062359939f0d1bd3969472cfc`.
Design Lab TypeScript and approval checks pass, and all 18 retained capture hashes
match. The original worktree remains the pinned comparison reference.

The design agent reports a passing focused 24-case matrix and interaction check.
Its combined Design Lab check remains failed at initial startup navigation; the
handoff identifies the retained output. Integration neither reran that unchanged
failure nor claimed full promotion validation. Actual font specimens, writes,
persistence and native behavior remain unqualified. No production code changed.

## Core implementation and qualification preparation

Kris approved all three test boundaries and tracker updates, then directed
continuation through testing, review and commit. The
[owning issue comment](https://github.com/Caldwell-41/Renpy-editor/issues/39#issuecomment-6497848293)
records the selection and qualification ceilings. The earlier tracker rejection
is resolved by that explicit approval. Code publication remains unselected.

Public-request tests pass typed TTF/OTF import, invalid-byte refusal, shared
history and reopen, exact minimal text/font edits, no-op history, expression
preservation, property reset with a valid remaining block, typed font specimens,
asset/source refusals and inert typography drafts. Font parsing uses pinned
`ttf-parser` 0.25.1 with its standard-library feature. The 16 MiB import limit
matches bounded font presentation and shared history. No project code executes
during these reads or edits.

The first broader Screens run passed 65 cases, failed the existing grid-expression
refusal case and ignored three explicit SDK/helper cases. Recognizing text
expressions changed that grid's child count and returned `INVALID_PAYLOAD` instead
of its previous `OPAQUE_BOUNDARY`. The correction retains conservative grid
count/add and structural-edit refusal around text expressions. The original
focused grid test then passes. The first run remains failed in ignored local
`project-fonts/core-01.log`.

Preparation also caught three check/configuration mistakes: the wrong-role fixture
helper returned the catalog's first asset, the passive-media assertion used a
nonexistent error code, and the initial exact fixture selector matched zero tests.
The corrected cases select the image by role, assert the existing `INVALID_PAYLOAD`
response and run the full exact test name with one passing result. The first
font-parser compilation also required enabling `std`. No product gate was relaxed.

The accepted SDK input is generated through public asset/screen/Source requests.
It covers TTF/OTF, line wrapping, alignment, bold/italic, four hex color lengths
and proposed whole-pixel size bounds 1 and 512. Its checker compares actual
placement and pixels with an independent literal Ren'Py reference and checks
that both project fonts differ from the bundled fallback. The offline gate rejects
missing fonts, fallback fonts, unwrapped text and wrong placement. No SDK result
has yet been established.

Next: qualify the generated source in the pinned SDK, connect A2 to the real
controller and services, then finish affected desktop checks and both review axes.

## Mac SDK and controller checkpoint, 2026-10-30

The pinned 8.5.3.26051504 normal entry passes compile, lint and rendering at
1280 by 720 and 1024 by 768. Accepted public-core source matches the independent
literal reference in placement, wrapping and every pixel. Both project font rows
differ from the bundled fallback. The first render's width assertion incorrectly
required the full wrapping limit instead of Ren'Py's natural text width. Its
[failed receipt](project-font-mac-sdk-01.json) remains retained. The corrected
gate bounds natural width and requires exact reference geometry. Two fresh renders
pass with byte-identical compile/lint inputs reused from the original run. The
[passing receipt](project-font-mac-sdk-02.json) identifies that candidate and reuse.
Mac normal SDK starts total 5/20. Helper starts remain 0/4; packages 0/3; native
sessions 0/3. Windows counters and costly CI dispatches remain zero.

A2 now uses the actual Screens controller and core. The retained controller-16
run passes native-dialog cancellation and stale completion, TTF/OTF import and
actual FontFace specimens, per-node draft/error retention, typed Apply/Cancel,
combined layout and typography in one history entry, exact Undo/Redo, Source
conflicts, held ownership, missing fonts, expressions and reopen. Its browser
substitutes the native file dialog and makes no native WebView or SDK claim.
The 54 existing affected renderer cases pass. Ten font public-request tests pass,
including a fresh accepted-font check when only a sibling property changes.

Controller checks caught and corrected a stale import-validity flag, native
search Escape behavior and compact inspector CSS precedence. The core now checks
an unchanged accepted font before typography writes, so an old catalog cannot
admit a missing or changed font. Apply also locks controls while font bytes load.
The initial broader frontend run passed 274/276; the operation allowlist needed
the three new font operations, and a Windows evidence fixture used system Python
3.9 without tomllib. Final checks will use the bundled Python 3.12 runtime.

Next: run the prepared helper comparison, rehearse the exact packaged probe,
qualify the signed Mac app and obtain Windows evidence, then complete review.
No code publication or ticket acceptance is claimed.

## Helper and native-probe preparation

Helper attempt 1 used one Mac helper start and produced the accepted 1280 by 720
frame, then failed the test's node lookup. The disposable imported source has no
registered Loomlight ownership metadata, so its read-only document does not expose
the exporter project's stable IDs. The correction matches each independent literal
Ren'Py ID within the exact verified source span. Original output remains in
ignored `project-fonts/helper-01/` and `helper-01.log`. This is no helper pass.

The exact native probe rehearsal passes against production UI/core after correcting
its accessible-label button lookup. It checks decoded TTF/OTF specimens, Apply,
invalid input, focus, Cancel, exact Undo/Redo, Source draft retention, an opaque
neighbor and disk reopen. Browser rehearsal is explicitly not native evidence.
The native evidence gate rejects missing decode, stages, formats, Source or IDs.
Mac helper use is 1/4; other counters retain the prior checkpoint.

## Review corrections

At `ff97b6f`, Standards review found no hard documented-standard violation and
flagged an inaccurate unsupported-font repair message plus image-specific names
shared by text. The message now includes TTF/OTF, and the existing layout
reservation uses action-neutral names. Spec review found two defects: layout
remained editable during an awaited font load, and Escape from a numeric layout
field lost focus after Cancel. Apply now reserves layout before any await and
releases it on refusal; Cancel records numeric focus. Controller-19 passes the
delayed real font response with typography and layout locked, combined acceptance,
Undo and numeric Cancel focus. The spec reviewer rechecked both fixes and reports
no remaining issue in those findings. The first lock assertion expected disabled
input, while the existing layout contract uses read-only input; that failed test
is retained as controller-18.

Helper attempt 2 found a second lookup defect: the parent span also contains the
child's literal Ren'Py ID. The corrected lookup requires a text node. A cheap test
against the actual source parser now proves five distinct matches without owned
metadata. Both retained first-aspect frames independently match normal SDK
reference pixels exactly. Full helper acceptance is still pending. Both failed
processes have exited; no helper process remained in the process audit. Mac
helpers total 2/4. Full frontend checks pass 276 cases with Python 3.12.

## Mac qualification and final integration, 2026-10-30

Helper attempt 3 passes all source geometry, pending/accepted typography and
cooperative shutdown checks. Its [receipt](project-font-mac-helper-01.json) records
one helper session. The initial offline pixel comparison against SDK-03 failed at
1024 by 768. Normal entry reused a saved physical window size, while the helper
explicitly sets physical size per aspect. The checker now sets that same size
before showing screens and records physical dimensions and drawing scale. Fresh
compile, lint and both renders pass in [SDK-04](project-font-mac-sdk-03.json), using
four further normal starts. The strict pixel gate was retained. Its
[passing comparison](project-font-mac-pixels-01.json) requires matching physical
size and scale and finds zero differing pixels at both aspects, for accepted and
independent reference frames. Controlled missing-reference, wrong-source, blank
and fallback-font mutations each fail the gate. No further helper start was needed.

The signed `9cd1dae` Mac package passes strict signature, the pinned certificate
requirement and read-only installer inspection. Its
[identity](project-font-mac-package-01.json) binds the executable hash. The real
[packaged WebView probe](project-font-mac-native-01.json) passes all five font
stages, TTF/OTF decoding, history, Source and reopen, exits zero and confirms
cleanup. This does not exercise a physical OS picker or human typing.

The full ordinary core run passed 430, failed 31 and ignored 51, with three
selected cases filtered. Every failure was a sandbox-denied local listener in
`ai_request`. The affected group rerun with loopback access passes 38 cases,
including all 31 failures. The original failed full run remains retained. The
new read-only reference-mapping test also passes. Full frontend checks pass 276;
the post-review affected renderer slice passes 54. Repository validation passes.

The actual image controller passes after the shared reservation rename. The
existing seven-group composition controller passes after updating its probe to
A2's Apply/Cancel and exact two-space Choose caption. Its first rehearsal failure
is retained. The final text-controller run passes and captures matching content,
values, dark theme, viewport and scroll conditions. A2's 326-pixel inspector,
typography order, inline picker, Layout disclosure and shared footer are present.
Production host chrome leaves less vertical space than the lab; compact uses a
scrolling editor with the footer visible. Real contained font paths replace the
mock's stand-ins. Canvas captures in this controller remain unavailable; SDK and
helper receipts supply rendering proof. The original combined Design Lab startup
failure remains failed.

Visual inspection corrected field sizing that lost to global input specificity,
restored space for the closed Layout row and retained color-swatch padding.
Compact preview returns through Edit text. These final narrow CSS/caption changes
require the second Mac package/native session before a final candidate claim.
Standards re-review reports no remaining findings; Spec re-review confirms both
identified defects resolved.

Current use is normal Mac SDK 9/20, helpers 3/4, packages 1/3 and native sessions
1/3. Windows and costly CI remain zero. Code publication remains unselected.

## Final local candidate

Candidate `4672bf728ca8443ef005473077c8bb3e0ea74839` passes the second signed
Mac package and native session. The [final package identity](project-font-mac-package-02.json)
records executable SHA-256
`e08ebe6f518bc9e38f16bb87023f6cad26623cf534889e3416481da9b9cb4596`;
strict signature and installer inspection pass. The
[final native receipt](project-font-mac-native-02.json) passes all stages, exits
zero and confirms cleanup. Controller-24 passes the final production code and
retains approved-state captures, including correct color-swatch spacing. The
comparison has one app header and one inspector. No native process remains pending.

| Criterion | Local result and remaining proof |
| --- | --- |
| Typed TTF/OTF import and discovery | Public asset tests and actual controller pass import, invalid/missing/changed refusal, contained bytes and role/hash checks. Native WebView decodes both formats. Windows execution remains pending. |
| Typed typography and minimal source | Public requests pass content/font/size/color/alignment/bold/italic, unsupported expressions, exact edits, reset and no-op. The actual controller passes combined layout/history and async draft retention. |
| Actual font use, placement and wrapping | Pinned SDK-04 and helper-03 compare accepted source with an independent literal reference at 1280 by 720 and 1024 by 768. Geometry and pixels match; fallback-font evidence fails. Windows execution remains pending. |
| Focus, Apply/Cancel, Source, history and reopen | Actual controller and final signed Mac WebView pass. TTF/CFF OTF, 16 MiB, whole sizes 1 through 512, four hex color lengths and finite 0 through 1 line alignment are documented in DATA_MODEL. Windows execution remains pending. |

Final local use is Mac normal SDK 9/20, helpers 3/4, packages 2/3 and native
sessions 2/3; Windows all zero; costly CI dispatches 0/3. The prepared Windows
route is the existing Screens workflow with `project_font=true`, exact candidate
and cumulative ordinal. Running it requires publishing this new branch. The user
has authorized tracker updates and local commits; branch publication has not yet
been selected. Ticket #39 remains open and unaccepted until required proof exists.
No PR, merge or release is selected. The unrelated Phase 1 audit is preserved.

The approved [tracker checkpoint](https://github.com/Caldwell-41/Renpy-editor/issues/39#issuecomment-6500462879)
records these results. The issue body now says `in_progress`; acceptance boxes
remain unchecked because Windows qualification is required. The branch-publication
question is pending in the implementation chat.

## Publication and CI selected

Kris authorized branch publication, a draft PR, CI and root-cause corrections until
checks pass, then a separate code-review chat on the draft PR. Existing cumulative
operation ceilings remain in force. The PR targets `codex/phase3b-screen-designer`;
its current base still resolves to `8f0d208`. The prepared first Windows dispatch
will use ordinal 1. Publication, run identity and completion will be recorded
after confirmation. No merge or release is selected.

## Windows CI in progress

[Draft PR #70](https://github.com/Caldwell-41/Renpy-editor/pull/70) targets the
Screens integration branch. Published head is `06291a9e1cbf2c2308a8136ab7650698992f317e`. Focused Windows
[run 40899707325](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40899707325), attempt 1, uses `project_font=true`, ordinal 1.
Automatic PR [quality run 40899627087](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40899627087) uses the same head. Dispatch
consumption is 1/3. Mac counters retain SDK 9/20, helpers 3/4, packages 2/3 and
native sessions 2/3. Windows SDK/helper/package/native execution is reserved by
this run until its retained evidence establishes actual starts.

CI monitoring will use the installed ci-watch skill in this same chat. Registration
output is retained in ignored `project-fonts/watch-01.json`; private watcher state
stays outside the repository. Audit both exact run/attempt identities, all required
steps, artifacts, binaries, source/pixel comparisons and cleanup before reporting
a pass. Diagnose any failure under the selected root-cause skill and correct
within the remaining cumulative ceilings. After CI passes, start the requested
separate review chat on draft PR #70 against base `8f0d208`. No merge, release or
issue acceptance is selected.

## CI1 failure and root-cause correction

Windows [CI1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40899707325),
at `06291a9`, failed before Chrome opened. The first fixture-ready response hit
the JSON driver's 15-second deadline. No controller failure receipt survived
because its pre-browser geometry serializer tried to write undefined data.
The [retained receipt](project-font-windows-ci-01.json) records the failed binary
hash and artifact digest. The downloaded executable matches that identity.
Windows frontend 276 and Screens 69 cases pass, with four SDK/helper cases
ignored. Automatic PR quality run 40899627087 passes both required jobs.

The harness applied a normal request deadline to fixture construction, which
creates a project and commits unrelated source-foundation transactions before
serving requests. A controlled delayed fixture reproduces the contract error.
The driver now separates an explicitly bounded 60-second construction wait from
the unchanged 15-second ordinary reply deadline. The focused process test turns
red before this change and passes afterward, including an intentionally stalled
ordinary reply and observed child exit. No retry or product timeout changed.
Fixed phase timings on stderr identify preparation start, service preparation and
ready, without source or path data. Pre-browser failures now retain null geometry
and the original error. Selected font, image and composition consumers use the
construction bound; SDK fixture construction keeps its existing 180-second bound.

The actual font controller and exact packaged-probe rehearsal pass locally with
the corrected driver. Only test drivers, browser checks and the focused workflow
changed; the qualified Mac application inputs remain unchanged. Windows execution
will establish actual fixture timings. CI1 consumed dispatch 1/3, with Windows
SDK/helper/package/native counts all zero because those steps never started.
Next: publish the correction and use ordinal 2 for the focused Windows run.

## CI2 in progress

Corrected candidate `399402f6bc495647e48cb95fa63da0f7937c5208` is published on draft PR #70.
Windows [CI2](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40902890034), attempt 1, ordinal 2, and automatic
[PR quality](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40902864870) are running at that exact head.
Dispatch use is 2/3. Windows SDK/helper/package/native use remains zero from CI1,
with CI2's execution reserved until its evidence establishes actual starts.
Mac use remains SDK 9/20, helpers 3/4, packages 2/3 and native sessions 2/3.
Watcher registration is retained in ignored `project-fonts/watch-02.json`. Audit
both exact runs and required retained evidence before the separate PR review chat.

## CI2 audit and corrections

Windows [CI2](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40902890034)
failed at `399402f`. [The summary](project-font-windows-ci-02.json) retains its
artifact identity, preparation timings and counters. Both automatic PR quality
jobs pass. All four actual controller groups pass, including the seven-group
composition probe. The [normal SDK receipt](project-font-windows-sdk-01.json)
passes compile, lint and both aspects. The [helper receipt](project-font-windows-helper-01.json)
passes geometry, typed pending/accepted equality and cooperative cleanup.

The first failure was the offline gate's assumption that physical window size
equals virtual resolution. The pinned SDK attempts the requested physical size;
on Windows the available desktop yields 922 by 519 and 888 by 666. Normal and
helper captures have exactly the same physical dimensions and drawing scale.
The corrected gate compares those actual dimensions rather than equating them to
virtual resolution. Virtual dimensions, source binding, pixel sizes and strict
pixel equality remain required. The [retained comparison](project-font-windows-pixels-01.json)
passes at both aspects with zero differing pixels. Replaying the original Mac
captures also passes. Wrong physical size and scale now join the four existing
negative mutations; all six are rejected. This replay starts no SDK/helper.

The second failure was a real packaged Apply race. Font presentation bypassed the
application request lane. A second chooser specimen could still own the native
service when Apply dispatched, returning `RUNTIME_BUSY` and retaining the draft.
The [failed native receipt](project-font-windows-native-01.json) records the
feedback and confirmed cleanup. Its [retained x64 binary](project-font-windows-package-01.json)
matches the recorded SHA-256 and PE architecture. No native success is claimed.

The exact production-probe rehearsal reproduces that feedback when the second
font response is held and an overlapping write is refused. It passes after passive
font reads join the shared lane. A focused lane test turns red before the change,
then passes for both font read operations and the same omission in existing image
preview/review operations. Asset import joins the lane as well, so it cannot race
those reads. Runtime Stop remains independent. No write is retried or discarded.
Full frontend checking now passes 277 cases; the affected renderer/lane slice
passes 36, and the actual font controller passes.

CI2 used Windows normal SDK 4/20, helpers 1/4, packages 1/3 and native sessions
1/3; dispatches total 2/3. Mac use remains normal SDK 9/20, helpers 3/4, packages
2/3 and native sessions 2/3. The request-lane change affects application behavior,
so qualify the corrected Mac package within its third package/native allowance
before the final scheduled Windows dispatch. No CI pass or separate-review-chat
completion is claimed.

## Corrected Mac application qualification

Application candidate `cf01c06` passes its third signed Mac package and native
session after the request-lane correction. The [package receipt](project-font-mac-package-03.json)
retains strict signature and installer checks and executable SHA-256
`39341b864344ec1c192aa374ea4b2d84aabcff5a0a7b19fe47b5e837675faed3`.
The [native receipt](project-font-mac-native-03.json) passes every font stage,
exits zero and confirms cleanup. The existing normal SDK/helper rendering proof
retains its scope: the change orders renderer requests and does not change core
font admission, source mapping or rendering inputs.

Mac cumulative use is normal SDK 9/20, helpers 3/4, packages 3/3 and native
sessions 3/3. Windows use remains normal SDK 4/20, helpers 1/4, packages 1/3 and
native sessions 1/3. Costly dispatches are 2/3. Next: publish this corrected
candidate and select Windows ordinal 3, then audit both focused and automatic
checks before starting the requested separate PR review chat. No extra package,
native session, merge, release or ticket acceptance is selected.
