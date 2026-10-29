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

## CI3 in progress

Corrected head `664d6930afce67378ebd94c371359d69529107d0` is published on draft PR #70.
Windows [CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40908795368), attempt 1, ordinal 3, and automatic
[PR quality](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40908699824) are running at that head.
Costly dispatches are 3/3. Windows use from CI2 is normal SDK 4/20, helpers 1/4,
packages 1/3 and native sessions 1/3; CI3 execution is reserved until evidence
confirms actual starts. Mac use is normal SDK 9/20, helpers 3/4, packages 3/3
and native sessions 3/3. Watch registration is retained in ignored
`project-fonts/watch-03.json`. Audit both exact runs, all required steps, retained
artifacts and binaries, source/pixel comparison and cleanup before a pass. Then
start the requested separate code-review chat on the draft PR, using its fixed
base `8f0d208`. No merge, release or ticket acceptance is selected.

## CI3 audited success

Windows [CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40908795368),
at `664d6930afce67378ebd94c371359d69529107d0`, attempt 1, passes every selected
required step. Automatic [PR quality](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40908699824)
at that same head passes frontend/Rust formatting and repository validation.
Unselected qualification jobs remain skipped; none substitutes for a required step.
The [audited receipt](project-font-windows-ci-03.json) records run/attempt, artifact
identity, source/pixel verification and actual operation consumption.

The [normal SDK receipt](project-font-windows-sdk-02.json) passes compile, lint and
both render runs with cleanup. The [helper](project-font-windows-helper-02.json)
passes geometry, pending/accepted typography equality and cooperative exit zero.
Its [pixel comparison](project-font-windows-pixels-02.json) matches accepted and
independent reference output exactly at both virtual aspects and the recorded
physical dimensions/scale. Independent local replay also passes all six negative
evidence cases. The source binding agrees with the public-core export.

The [Windows native probe](project-font-windows-native-02.json) passes font picker,
draft, history, Source and reopen stages, TTF/OTF decoding, exit zero and cleanup.
The [retained package](project-font-windows-package-02.json) matches SHA-256
`103182eaa96421155e936f75f334518b0bb3845b7b028ff9a6a50e7fd63160d4`;
the downloaded binary's PE header independently confirms Windows x64. All four
controller checks pass. The exact font-probe rehearsal loads two actual font
specimens with delayed responses and records zero overlapping Apply requests.

Both targets now establish the four bounded functional criteria in the earlier
criterion table: typed TTF/CFF OTF import and handles, minimal typed typography
with preserved expressions, actual SDK placement/wrapping/font use, and focus,
Apply/Cancel, Source/history/reopen. Formats/bounds remain in DATA_MODEL. The
original full Design Lab startup failure, physical OS-dialog/human-input and
wider editor/canvas/Phase 3B limits remain visible. This does not accept or close
the ticket, select merge/release, or claim the pending independent PR review.

Final cumulative use is dispatches 3/3; Mac normal SDK 9/20, helpers 3/4, packages
3/3 and native sessions 3/3; Windows normal SDK 8/20, helpers 2/4, packages 2/3
and native sessions 2/3. No costly operation remains pending. The final receipt
update changes documentation only; application and workflow inputs match the
qualified head. Publish that update and audit its ordinary PR checks, then start
the user-requested separate code-review chat on PR #70 against `8f0d208`.

## Review handoff

The receipt-only head `5845426` passes ordinary
[PR quality run 40913166422](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40913166422),
attempt 1. Its application/workflow material is identical to qualified head
`664d693`; the corrected Mac package remains `cf01c06`. The final handoff update
is documentation only and needs ordinary PR checks. The PR's current checks and
latest execution comment on #39 own that final check identity and the separate
review-chat identity, avoiding another artifact-only qualification cycle.

Kris selected a fresh separate chat to run the two-axis code-review skill on
[the draft PR](https://github.com/Caldwell-41/Renpy-editor/pull/70), with fixed
base `8f0d208fb3a28fac1cf94b3248f807ff85a54ddd`. That chat owns read-only review
and reports Standards and Spec separately. Implementation and both-target
qualification are complete for this handoff; independent review is not yet a
pass. Keep the PR draft and #39 open. Merge, release, human/OS-dialog and wider
acceptance remain unselected. No costly qualification or watcher is pending.
The original failures, artifact identities and protected recovery remain retained.

## Independent PR review corrections, 2026-10-30

The fresh review of `8f0d208...285c2e3` found two unique product defects.
Standards reported missing text dimensions and the field-validation lifecycle;
Spec independently reported the same missing dimensions. Kris selected fixes,
subagent assignments, final coordinator validation, publication, PR update and CI,
then cleanup of the fix worktrees once green. The review chat now owns this
correction and integration on `codex/l05-project-fonts`.

Two isolated worktrees started at `285c2e3`. The dimension agent owned layout
presentation and its callsites; the validation agent owned text-field validation
and its scoped error styles. Both extended the existing actual Screens
controller/core journey at the already-approved test boundary. The coordinator
integrated dimensions first as `2cb2fda`, then validation as `95aeda4`. The test
additions merged without conflict. No approved design source changed.

- Dimensions: the original `sharedCommit` option also hid `xsize`/`ysize`, which
  only the image inspector replaced. The red journey finds zero text Width
  controls. Separate presentation options now retain text Width/Height and
  suppress duplicate image dimensions. The green journey checks accepted Source,
  one-entry Undo/Redo and the unchanged image controller.
- Validation: the inspector bypassed the shared completion validator and cleared
  field errors after any edit. Red journeys reproduce missing Size and import-name
  blur feedback. Text, Size, Color and import names now use `validateField`;
  still-invalid corrections retain errors, valid corrections clear them, and
  submission focuses the existing invalid control. Per-node feedback, IME input,
  Source-conflict messages and the approved error styling remain intact.

Final combined application candidate
`95aeda443c7527758d84560b039c4bdd065c0be2` passes all 277 frontend tests and the
production build with pinned Node/npm and Python 3.12. Actual font and image
controller journeys pass. The seven-group composition journey and exact
packaged-probe browser rehearsal pass, including two delayed font reads with zero
overlapping Apply requests. The browser receipts retain their controller-only
scope; they are not fresh native WebView or SDK proof. No test driver remains.

The first coordinator browser runs stopped before Chrome because the sandbox
refused the loopback listeners. Original logs are retained; the permitted runs
pass without code or timeout changes. Agent red/green logs and final receipts are
preserved under ignored `project-fonts/review-fixes/`. The coordinator audited
the actual receipt shapes and required stages after correcting a local summary
assertion that expected the composition report under the wrong key.

Independent delta review reports zero remaining Standards and Spec findings. The
coordinator reviewed the combined source and test diff. Repository validation and
whitespace are checked before publication. The PR's current checks own the final
ordinary CI run identity and result; the final published documentation records
this tested application candidate rather than claiming a new package candidate.

Rust/core, native IPC, workflows, dependencies, SDK/helper rendering and package
configuration are unchanged by these fixes. Earlier both-target evidence retains
its exact candidates and scope. No extra SDK/helper, package/native or costly CI
operation ran. Historical use remains dispatches 3/3; Mac SDK 9/20, helpers 3/4,
packages 3/3, native sessions 3/3; Windows SDK 8/20, helpers 2/4, packages 2/3,
native sessions 2/3. Ordinary PR CI needs no numerical allowance.

Automatic approval review rejected a separate #39 progress comment because it
treated that destination and the internal status details as outside the selected
PR-update authorization. No issue mutation occurred. The authorized correction
record stays here and in PR #70. Keep the PR draft and #39 open. No merge,
release, physical OS-dialog/human-input or wider Phase 3B acceptance is selected.


## Font admission and stale-text corrections, 2026-10-30

Kris selected both findings from the fresh full review of `8f0d208...4e2bfef`,
with separate subagents, coordinator-owned final validation, push, PR update and
ordinary CI. This chat owns the outcome on `codex/l05-project-fonts`. The earlier
Width/Height and field-completion fixes remain intact.

Assignments start from `4e2bfef89bf0ab4be8606ea637d4325310c6c2ec`:

- Font admission owns `authoring/fonts.rs` and `screens/font_tests.rs` in the
  isolated `l05-font-admission-fix` worktree. Its public boundary is asset
  preview/import dispatch, including unchanged source/metadata/history on refusal.
- Stale text owns `screen-text.ts` and its actual controller/core browser journey
  in the isolated `l05-stale-text-fix` worktree. Its boundary is the production
  Screens controller connected to core, with the native file dialog substituted.
- The coordinator owns shared documentation, sequential integration in that
  order, final checks, review, publication, PR update and the ordinary CI audit.

These boundaries reuse the user-approved L05 testing seams. Both agents use
`principle-fix-root-causes` and the installed TDD 1.3.2 skill; the requested 1.3.1
skill path no longer exists. Each fix must first fail its focused behavior check.
No test reaches private controller state. Mutable test outputs and fixtures stay
separate; no SDK/helper, package/native or costly CI operation is selected.

### Root causes and red/green proof

Font admission tested only whether a `cmap` container was present. The public
preview returned `ok:true` for a TTF with zero encoding records; importing those
bytes committed an unusable font before browser decoding failed. The existing
invalid-font test now changes the licensed fixture's record count to zero and
exercises public preview and import. It fails before the correction, then passes
with `UNSUPPORTED_FORMAT`, no created font, unchanged metadata/source and the
previous history entry intact. The shared validator now requires a parsed base
character-map subtable. Unsupported mixed coverage and variation-only maps do not
qualify as a base map. Preview, import and presentation share that owner; this
adds no browser-only workaround or new dependency. Valid TTF/OTF import, history
and reopen remain green.

The font agent committed `30e5bb7970086bb2b695c611a144796f84521a04`;
the coordinator integrated it as `b1aa8e085dd7e89cacf2602df7537abd11a5d165`.
Its focused command was `cargo test --offline -p loomlight-core --locked --lib
screens::tests::fonts::invalid_font_import_keeps_metadata_source_and_previous_history
-- --exact --nocapture`. The positive command selected
`screens::tests::fonts::project_fonts_import_as_typed_assets_with_shared_history_and_reopen`.
Each green run passed one named test, with zero ignored or failed cases.

Text drafts compared their fields with the original node after Source refreshed.
The production controller regression fails before the correction because matching
the current saved literal leaves Apply enabled. The shared draft matcher now
compares every text/typography field with the current accepted node for text
editing and font selection. Until every field matches, it retains the original
revision. A full match clears the draft and its errors. The actual controller
journey passes matching-current reconciliation, a subsequent exact Source edit
and Undo/Redo, retention when typing the old literal, retained stale conflict
when size still differs, and conflict clearing when all fields match. Resolving
the draft itself writes no Source.

The draft agent committed `3422ba71aa4e710a7d19ee8d04c179c6dbc129a4`;
the coordinator integrated it as `ef810143980700fa2e2143b70a14528f77aaf6de`.
The focused red/green command was `node tests/project-font.browser.mjs` against
the production controller/core, with fresh disposable fixture and output paths.
An initial test version typed the old literal before testing the current match,
which exercised the separate old-value discard path. The agent corrected that
ordering before editing production code and retained both the original attempt
and the specific failing current-match run. The final journey covers both paths.

### Coordinator final validation

The coordinator reviewed both source/test diffs, integrated them in the declared
order and ran the final combined checks using Node 24.19.0, npm 11.9.0,
Rust 1.90.0 and Python 3.12.14. The application candidate is
`ef810143980700fa2e2143b70a14528f77aaf6de`.

- `npm run check`: all 277 frontend tests pass, zero failures/skips, with typecheck.
- `npm run build`: production build passes; the existing large-chunk advisory remains.
- `cargo test --offline -p loomlight-core --locked --lib screens::tests -- --nocapture`:
  69 pass, zero failures, four deliberately ignored SDK/helper cases. The core
  candidate is `b1aa8e0`; its core inputs are byte-identical at the combined
  candidate. No ignored case is counted as a pass.
- `cargo fmt --all --check` and the actual controller-driver build pass.
- `node tests/project-font.browser.mjs` passes the full updated controller/core journey.
- `node tests/project-font-probe-controller.browser.mjs` passes the exact probe
  rehearsal, with two delayed font reads, zero overlapping Apply requests and all
  required stages. This is browser/controller proof, not native WebView evidence.
- Independent correction reviews report zero remaining Standards and Spec findings.
  Neither review substitutes for the coordinator's test execution.

Agent red/green logs and coordinator receipts are retained under ignored
`project-fonts/root-cause-fixes/`, including a checked validation summary.
Repository validation passes for 1,264 files; all 13 section-link validation tests
and whitespace checks pass. CURRENT and HANDOVER remain above their soft word
count targets because their retained earlier acceptance/recovery records remain
relevant; this correction replaces the live L05 entry without deleting that history.
The final PR check run owns the published CI candidate, attempt and terminal result;
CI audit remains pending at this checkpoint.

### Scope and retained qualification

The tighter invalid-font admission gate and text-draft comparison change no IPC,
source serializer, helper renderer, SDK adapter, dependencies or package identity.
Earlier SDK/helper/native results retain their exact candidates and valid fixture
scope. These corrections do not establish a fresh package/native pass. The
combined Design Lab startup failure, physical OS-dialog/human input and wider
editor/canvas/Phase 3B acceptance remain separate.

No SDK/helper, package/native session or costly CI dispatch ran. Historical use is
unchanged: dispatches 3/3; Mac SDK 9/20, helpers 3/4, packages 3/3, native sessions
3/3; Windows SDK 8/20, helpers 2/4, packages 2/3, native sessions 2/3. Ordinary
PR checks need no numerical allowance. Publication, PR update and CI audit are
selected; no merge, release, ticket closure or wider acceptance is selected.

### Published correction and ordinary CI audit

Published head `eba17f668ea867d405cf1bee809561914e200e03` contains both
validated corrections and their evidence. PR #70's body is updated and remains
draft. [Repository quality run 40955663352](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40955663352),
attempt 1, is completed with conclusion `success` for that exact head. The
coordinator verified the current PR still points to that candidate, matched and
acknowledged the watcher event in this thread, and audited the required jobs and
logs before accepting the result.

- `Frontend tests and Rust formatting`, job `123734990910`: every step passes;
  logs confirm 277 tests, 277 passes, zero failures and Rust 1.90.0 formatting.
- `Validate repository`, job `123734991270`: every step passes, including
  validation of 1,258 checkout files, all 13 section-link tests, bounded Q1 gate
  rejection fixtures and source-selector audit.
- Nine optional jobs were unselected and skipped. They are not required passes,
  new qualification or evidence of SDK/native/package execution.

The exact terminal JSON, job logs, PR snapshot and watcher receipt remain in
ignored/private local evidence. The application candidate remains `ef81014`;
the publication and this terminal audit record change documentation only. The
ordinary automatic checks of any record-only successor remain visible on the PR;
this audit does not claim they have already completed. No expensive workflow was
dispatched. Historical limits, earlier qualification and protected recovery remain
unchanged. Both review findings are corrected and the selected product validation
is complete. No merge, release, ticket closure or wider acceptance is selected.

## Picker cache and discovery namespace corrections, 2026-10-30

Kris selected both findings from the fresh full review of PR #70 at `237665c`,
delegated implementation, coordinator validation, publication, PR update, CI and
cleanup. Both workers start at `237665c117acf8906fc83bd0adc19672387e22f9`.

- The namespace worker owns `authoring.rs` and focused public asset/font tests in
  the isolated `l05-font-namespace-fix` worktree. It must admit equal names across
  separate discovery namespaces and preserve collisions within a namespace.
- The picker worker owns font picker/media code, the actual controller/core
  browser journey and disposable driver inputs in `l05-font-picker-cache-fix`.
  It must reproduce selecting a font after normal cache eviction, then correct
  the loading/selection ownership without changing the approved A2 design.
- The coordinator owns this record, sequential integration (namespace first,
  picker second), final combined verification, publication, PR/CI audit and safe
  retirement. Workers do not publish or modify shared status.

Both workers use `principle-fix-root-causes` and installed TDD 1.3.2. The requested
1.3.1 path is absent. Tests reuse the approved public asset operations and actual
Screens controller connected to core; native file-dialog substitution remains
explicit. Each fix requires a failing behavior test before implementation.
Routine local checks and automatic PR quality CI need no numerical allowance.
No SDK/helper start, package build, native-editor session or costly CI dispatch is
selected. Historical counts, qualified candidates and limits remain unchanged.
The unrelated audit, pinned design worktree and protected recovery remain intact.

### Namespace root cause and red/green proof

Asset metadata already distinguishes Image, Audio and Font discovery namespaces.
The import collision check compared names globally, so a valid `music_theme`
font collided with a Music asset in another namespace. The correction compares
both namespace and name. The appearance-rename path remains unchanged: its names
require a space, which valid font/audio identifiers cannot contain.

The new public-operation test imports Music then Font, and Font then Music, with
the same discovery name. Both typed assets remain available after reopen. A
distinct OTF using that font name still fails with `DISCOVERY_NAME_COLLISION`
without changing the listed metadata. Its focused red run failed at the actual
collision check; the green run passes. An earlier fixture-only failure lacked
`game/audio` and remains separate from the product failure.

The worker committed `594c28ab8b51b6cd9d4964a3f4381713a43b222d`; the coordinator
reviewed and integrated it as `1b1d2d14c81aa644e4302e832945e4de9ac1dd6c`.
The focused command selects
`project_fonts_and_audio_share_names_only_across_discovery_namespaces` through
`cargo test --offline -p loomlight-core --locked`. The green selection passes one
test; the worker's font selection passes 11 and its authoring selection passes
33, with no failures or ignored tests. Rust formatting and whitespace pass.
Original red, fixture failure and green logs are retained under the coordinator's
ignored `project-fonts/picker-namespace-fixes/namespace-agent` evidence.

### Picker root cause and red/green proof

The picker treated decoded-font cache membership as permission to choose an
already validated asset. Normal 64 MiB eviction therefore made enabled rows
silently refuse selection. A loading flag also remained set after completion,
which prevented a returning row from reloading its specimen. Selection now uses
the durable typed asset handle, while the loading flag tracks only pending work.
The cache bound, font admission and Apply validation remain unchanged.

`node tests/project-font-cache.browser.mjs` drives the production controller and
actual core. The disposable driver creates five 15 MiB variants of the pinned
public TTF with a checksummed private padding table; the checked-in font fixtures
remain unchanged. Browsing all five exceeds the real cache bound. Before the fix,
clicking the first enabled font leaves the picker open and fails the test. After
the fix, selection closes the picker and returns focus, remains a text draft,
and Apply accepts the chosen font. Undo and Redo restore exact source bytes.
The final test holds delivery of a real presentation response until after the
click, so a fast reload cannot mask cache-dependent selection.

The worker committed `6a745c0658a97757216ee5e8ff938da6d52947f1`; the coordinator
reviewed and integrated it as `3b8bf78`. The initial red and an accidental unchanged
repeat remain separate from the passing initial/final/held-response runs. Worker
typecheck, syntax, Rust formatting and whitespace pass. A final cache-directory
isolation edit received syntax checking and is covered by the coordinator's
combined run. Worker evidence is retained under ignored
`project-fonts/picker-namespace-fixes/picker-agent`.

`77d9af4d41645617103b41fc01090dabebee2663` is the combined code/workflow candidate.
It adds the new browser command to the existing project-font workflow's controller
step. The coordinator owns final validation and fresh Standards/Spec correction
review before publication.

### Coordinator validation and correction review

The coordinator validated the combined code with pinned Node 24.19.0, npm 11.9.0,
Rust 1.90.0 and Python 3.12.14. All 277 frontend tests and the production build
pass. The Screens core selection passes 70 tests, with four SDK/helper cases
intentionally ignored; the authoring selection passes all 33 tests. Rust
formatting and the actual controller-driver build pass. These checks ran on
`77d9af4`; the only later code/workflow change separates browser evidence paths.
Frontend, core, dependency and build inputs are byte-identical at `03cd82a`.

The new cache journey, existing font controller/core journey and exact probe
rehearsal all pass on `03cd82a1fe844daee8f20f52c87caff9ba92d69b`. The rehearsal
records two delayed font reads and zero overlapping Apply requests. These are
browser/controller checks, with no fresh native WebView or SDK claim.

Fresh independent correction review found that the newly wired cache test would
inherit `PROJECT_FONT_OUTPUT` and overwrite the existing controller's
`result.json`. The coordinator corrected that evidence-owner mistake in
`03cd82a`: the cache test uses `PROJECT_FONT_CACHE_OUTPUT`, with a separate
`cache-controller` workflow directory. Both original and cache receipts remain
present, and the original retains source, font, requests and canvas plans.
Both reviewers rechecked the correction at that SHA and report zero remaining
Standards findings and zero remaining Spec findings. No broader abstraction or
product change was required.

Repository validation passes for 1,265 local files, all 13 section-link tests
pass, and whitespace passes. The build's existing large-chunk advisory remains.
Coordinator logs, worker red/green evidence and `validation-summary.json` remain
under ignored `project-fonts/picker-namespace-fixes`. Ordinary CI audit and safe
retirement of the two new worker worktrees follow publication.

The approved A2 layout, source serializer, IPC, renderer/helper, SDK adapters,
dependencies and package identity remain unchanged. Earlier both-host SDK/helper
and native receipts retain their exact recorded candidates and scope; this
correction establishes no fresh native/package acceptance. The combined Design
Lab startup failure, OS-dialog/human input and wider editor/canvas/Phase 3B
acceptance remain separate. Historical operation consumption stays unchanged.
