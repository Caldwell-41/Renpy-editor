# Phase 3B audit-fix evidence

The [maintenance task](../archive/2026-11-01-phase-3b-audit-fixes.md) owns scope and acceptance.
Observation begins 2026-11-01 at fetched base
`c5f4ab18bc0fd9c1e73a5a97b5ce10d9534cd57c`. The local integration branch is
`codex/phase3b-audit-fixes`; the fast-forward check found no divergence.

## Parallel assignments

Each worker uses a separate T3-managed worktree. The coordinator integrates commits
sequentially and retains one writer for each file. Worker branches and exact
candidates will be recorded when the assignments return.

| Worker | Findings | Owned production files and tests |
| --- | --- | --- |
| Core Screens | #4, #5, #6, #9, #12, #18 | `app/src-core/src/screens.rs`, `screens/ownership.rs`, `screens/composition.rs`, `screens/layout.rs`, `screens/canvas.rs`, `screens/tests.rs`, `transaction/mod.rs` and new dedicated Screens test modules. |
| Workspace and numeric | #2, #11, #17 | `app/src/screen-ui.ts`, `screen-layout.ts`, `app/tests/screen-ui.dom.test.ts`, new numeric-layout DOM tests, `app/tests/nested-layout.browser.mjs` and `screen-layout.browser.mjs`. |
| Helper lifecycle | #8 | `app/src-core/src/lifecycle.rs`, `screens/canvas_session.rs`, `renpy/runtime/canvas.rs` and dedicated lifecycle tests. |
| Text validation | #14 | `app/src/screen-text.ts`, `screen-composition.ts`, a focused shared text-validation helper if needed, `app/tests/screen-composition.dom.test.ts`, text DOM tests and `project-font.browser.mjs`. |
| Image previews | #16 | `app/src/screen-image-media.ts`, `screen-images.ts`, `app/tests/screen-images.dom.test.ts`. |
| Coordinator | Integration and review | Contracts, status, task evidence, CI selection/workflows and in-scope integration corrections after worker ownership ends. |

Workers may not edit another owner's files. A required shared-interface change
must return to the coordinator before it is made. Existing IPC payloads should
remain stable unless the coordinator records a necessary migration.

For #5, the coordinator approved a narrow extension of the existing inventory
owner in `transaction/mod.rs`. It must account for a projected created file and
missing parent-directory entries without duplicating the walker, changing ordinary
callers or relaxing current limits. The core Screens worker is the sole writer.
The Catalog IPC remains stable; namespace-race and Redo work remain excluded.

## Preparation and test boundaries

The selected root-cause and TDD skills, including the TDD test and mocking
references, were read. Kris confirmed Screens DOM, public core/IPC plus real
controller/core journeys, and public canvas lifecycle with a controlled helper
boundary. Workers must retain the actual failure and passing result per vertical
slice, rather than writing a batch of tests against imagined behavior.

The environment entry script resolves Node 24.19.0, npm 11.9.0 and Rust/rustc 1.90.0.
System Python is 3.9.6, below the harness's 3.11 minimum. The coordinator found the
existing complete Python 3.12.16 toolchain under the earlier text-owner tooling and
verified `tomllib`; an ignored task-local PATH wrapper selects it for harness checks.
The bundled SDK interpreter reports 3.12.8 but omits `tomllib`, so it is unsuitable
for those checks. No interpreter was installed and no pins changed.

The linked Windows host SUNDOWN is reachable. No remote command, build, test,
SDK launch, package or native operation has run for this outcome yet.

Creating an additional GitHub maintenance issue was rejected by automatic approval
review because it was outside the explicit branch/fix/draft-PR/CI publication
authorization. No issue was published. Execution continues under the local task;
the authorized draft PR remains the publication destination.

## Verification and costly operations

No new tests, CI qualification, helper, SDK, package or native session has started
at this preparation checkpoint. Costly operations will be selected and bounded
before execution. Routine worker checks and local builds need no numerical limit.
Historical candidate evidence retains its scope and does not become a new pass.

## Text validation integration and review

The text worker returned `fe4167db85f7d895b91dd9162d920c037e619c6b` from
`t3/fix-text-validation-byte-limit`. The coordinator reviewed the complete source
and test diff against #14 and integrated it as `644e26b`.

Both existing-text and addition controls use one UTF-8 byte check before dispatch.
The completion and submission paths identify the field, retain its draft and focus
it for correction. Unchanged oversized source text still permits typography-only
changes without resubmitting text. Core enforcement and IPC stay unchanged.

The worker retained three red/green slices: oversized existing text, unchanged
oversized text with a typography-only edit, and added text/button labels. The first
and third failed at missing field validation; the middle caught an initial
overvalidation and then passed with the unchanged-text exception. Exact 8,192- and
8,193-byte boundaries, correction, focus and no invalid dispatch are covered.

Worker checks pass all 30 composition DOM tests, typecheck and frontend build. Its
first Vite attempt failed because a dependency link directed temporary config output
to the primary checkout; it corrected the ignored local dependency layout and
passed without production changes for that environment issue. Raw failures remain
in its ignored reports.

At integrated `644e26b`, the coordinator's test compilation succeeds and all 30
composition DOM cases pass with no skips. Review found no additional issue in this
slice. Real integrated controller/core proof and combined checks remain pending.
No Windows, native, SDK, helper or package operation occurred for this slice.

## Image preview integration and review

The image worker returned `836c1dc8e4193ad72ae3c0b0fa3f1cee32ac631a` from
`t3/fix-selected-image-thumbnail-eviction`. The coordinator reviewed the cache,
inspector and test changes against #16 and integrated them as `4076688`.

The cache protects the selected preview only while its inspector image is mounted.
Other picker previews remain evictable; staged imports retain their existing
priority. If protected entries consume the budget, further picker admission refuses
instead of clearing the selected image or exceeding 32 MiB. Per-image admission
stays at 16 MiB. Selection change and disposal release preview ownership normally.

Three red/green slices reproduce the original missing selected `src`: settled picker
loads, late loads after close/disposal, and staged-import contention with late picker
admission. The public DOM fixtures use three distinct valid 2048-by-1900 PNGs below
the per-image limit and check the aggregate live-URL budget and cleanup.

Worker verification passes all 14 image DOM tests, typecheck and frontend build.
Its first dependency-cache build failure remains recorded; the isolated cache layout
corrects the environment without changing production behavior. At integrated
`4076688`, the coordinator recompiles tests and passes all 14 image DOM cases with
zero skips. This establishes cache lifetime and cleanup, not native painting.
No additional issue was found in this slice. Combined validation remains pending.
No Windows, SDK, helper, native or package operation occurred for this slice.

## Helper lifecycle integration and qualification selection

The lifecycle worker returned `0cc23144d209b100fbbbd86df048402d1cfb50f4` from
`t3/fix-canvas-session-recovery`, integrated after coordinator review as `11852a1`.
Only failed or stopping sessions are retired. Cleanup must succeed before the
owner creates one replacement; healthy sessions are reused. Stale requests cannot
replace the current frame, and source/canvas drafts stay available.

Worker red/green tests exercise helper exit and the real timeout through the
public lifecycle with a controlled child-process boundary. The cleanup-refusal
case retains ownership after an ordinary directory rename and permits recovery
after restoration. That trigger is Unix-only because Windows anchors prevent it.
The controlled subprocess entry is intentionally ignored as a direct test and is
invoked by the lifecycle cases; it is not a missing required case.

At integrated `11852a1`, coordinator verification passes all three lifecycle cases,
with zero failures and the one controlled-child fixture ignored. The suite takes
the existing fifteen-second timeout. Worker formatting and non-test core checking
also pass. These results are controlled-process proof, not real SDK qualification.

Select a narrow real-SDK check on Mac ARM64 and connected Windows SUNDOWN: one
profile-scoped, existing startup-refusal case followed by one healthy helper retry
before project close, with retained drafts, exact source, current frame and owned
shutdown/cleanup. Allow at most four helper starts per host across the initial
two-start check and one diagnosed correction. No package/native editor build or
normal-entry game execution is selected. Historical L17 allowances stay closed.
No real helper has started at this selection checkpoint.

Select a combined portable CI qualification on Windows x64 and macOS ARM64 after
integration: affected core/IPC suites, lifecycle cases, frontend tests, desktop
compilation and real controller/core journeys. Allow three costly qualification
dispatches total for an initial run and up to two diagnosed corrections. Ordinary
automatic PR quality remains separate and needs no numerical cap. The validation
plan will list the exact target jobs before publication. Connected-host SDK results
retain their own scope and do not substitute for selected CI jobs.

## Workspace and numeric integration and review

The workspace/numeric worker returned `99ba37cf5ec62f11cd124f5399a140dfcf41f0db`
from `t3/workspace-numeric-audit-fixes`, integrated after coordinator review as
`70f1f3a`. Production changes stay within the workspace and numeric editor owners.

For #2, supported fixed-parent alignment uses the installed parent's bounds for
the provisional resize guide. A padded or otherwise ambiguous parent retains its
helper guide rather than guessing. The held-response DOM case fails at 312 pixels
before correction and expects 172 afterward, then checks settled geometry, focus,
accepted size dispatch and retained input after a refused save.

For #11, raw spelling is checked in the shared edit calculation before deciding
that an edit is unchanged. Hexadecimal width and decimal grid-count spellings stay
invalid drafts through remount and target removal; valid `6.4e2` remains a no-op.
For #17, grid capacity validation applies to eligible count changes. Unrelated
spacing saves despite opaque branch entries, while the real core still refuses
ambiguous count changes with `OPAQUE_BOUNDARY`.

Worker tests pass 22 workspace DOM cases, the frontend build and both real
numeric/nested controller journeys. They retain original failures and stale-fixture
corrections for the current text Layout disclosure and shared conflict message.
The coordinator recompiles at integrated `70f1f3a`, passes all 22 DOM cases with
zero skips, builds the actual driver and passes both controller/core journeys.
Their exact source and spacing Undo/Redo assertions pass; both receipts report
`controllerAndRealCore: true`, `sdkGeometry: false` and no errors.

The already-selected two-start SDK recovery fixture also uses #2's offset fixed
parent and resized 656-by-376 frame. Its expected independent engine rectangle is
x=172, y=122, matching the provisional DOM regression. This adds no helper starts
or broad subset proof. It compiles; real execution remains pending until the full
candidate is integrated. No native painting or physical-input claim is inferred.

At `70f1f3a` with the coordinator's qualification-only test extension, the combined
frontend check passes all 300 tests with no skips, and the production build passes.
The existing Vite chunk-size advisory remains. The complete Python 3.12.16 wrapper
is used for harness consumers. CI workflow lint and all 18 coordinator unit tests
pass. No real SDK/helper execution or qualification dispatch has started.

## Core Screens integration and review

The core worker returned `c0d9bed43a76703a94a5d34c3f86ad6076324063` from
`t3/fix-core-screens-audit`, integrated after coordinator review as `c8db7ef`.
The six selected corrections extend existing source, layout and inventory owners.

| Finding | Reviewed correction and focused failure |
| --- | --- |
| #4 | Recognized Python block bodies no longer contribute false screen declarations. The original owned-resolution failure is covered alongside combined Python flags and a following nested `init` collision. |
| #5 | The existing inventory walker reserves a proposed file and missing parent directories. File, entry and aggregate source-byte limits refuse before writing. A prepared catalog returns the committed result even when a later inventory read fails. |
| #6 | Protected children omitted by the parser add a canvas-plan refusal. Root and nested two-space children refuse; supported ordinary properties and actions remain admitted. |
| #9 | Lexically identified outdented standalone comments protect the intersecting subtree. Removal and reorder refuse with unchanged bytes; ordinarily indented subtree comments retain normal removal and Undo. |
| #12 | Alias splitting uses source ambiguity independently of parent placement controls. Literal horizontal/vertical changes preserve the untouched controlled values and alias comment, while controlled-field edits and stale revisions still refuse. |
| #18 | Scalar grid-policy recognition accepts equivalent whitespace. Duplicate, malformed and false policies retain structural refusal; accepted additions preserve source and Undo. |

The worker retained red/green logs for each trigger and passed nine public-IPC audit
cases, ownership compatibility, production core checking and formatting. Its wider
Screens run passed 105 tests with five intentionally ignored SDK qualifications.
The coordinator inspected every production change and all nine focused cases.
No namespace race, Redo, resolution-cap, selection, font validation or typography
qualification expansion is included. Combined verification is running.

The selected CI gate explicitly requires the nine new audit cases and the controlled
lifecycle cases to appear as passing in Cargo output. Existing gate checks reject
missing, ignored and failed required markers. The real SDK recovery fixture remains
separately selected and intentionally ignored during ordinary portable suites.

## Integrated verification and Mac SDK recovery

Candidate `039f22ce3c118f408145573ccedfeac0e93b7b70` contains all twelve selected
fixes. Coordinator checks pass 107 Screens tests, 16 Source tests, three metadata
tests, 39 transaction tests and three controlled lifecycle cases. The five Screens
SDK qualifications, eighteen specialist transaction cases and two lifecycle fixture/
SDK entries remain intentionally ignored in these ordinary runs. All five real
controller/core journeys pass. Desktop compilation and formatting pass; existing
dead-code warnings remain unchanged.

The separately selected Mac ARM64 official-SDK recovery test passes at that exact
candidate. It uses two helper starts of the four-start Mac ceiling. Startup refusal
exits 72 and cleans up before replacement; the replacement supplies a current PNG
and rectangle `(172, 122, 656, 376)`, retains the Source draft and disk bytes, then
shuts down cooperatively with exit zero. Both fixture cleanup results are true.
The coordinator inspected the retained PNG. This establishes helper rendering and
geometry, not physical resize input or native editor painting. The JSON and PNG
SHA-256 values are respectively
`b4c93bc60a030ec523abe6196d8c3b5a6cf302ef1c5b7eaec6b865819dc028de` and
`7ee9d9215c97625d499c75975a5bff6f0add5a0ef5c4faa1b1ce5c4f8c7b60a0`.
Raw evidence remains in the ignored task report directory. A later harness-only
correction does not change this tested application or SDK fixture.

## CI1 failure and controller-ordering correction

[Draft PR #75](https://github.com/Caldwell-41/Renpy-editor/pull/75) targets the
Screens integration branch. Automatic Repository quality
[run 41259596053](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41259596053)
passes at `039f22c`. Selected qualification dispatch 1 of 3,
[run 41259629110, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41259629110),
is failed evidence. Its Mac job passes every selected stage. Windows passes frontend,
public core audits, source/metadata/transactions, lifecycle, driver and desktop
compilation, composition and numeric journeys. It fails in nested layout before the
image and font journeys run. Those two Windows journeys remain unrun in CI1.
Both uploaded artifacts were retrieved and their exact candidate files checked.

The Windows assertion waited for the strict-grid removal refusal. The fixture
started Refresh Source and immediately used the old hierarchy, before the async
reload installed the strict policy. A controlled held `screens.list` response
reproduces an open removal dialog (`dialog: 1`) and the same eight-second assertion
failure. This is a harness ordering defect, not evidence of slow rendering or a
source mutation. The production revision checks remain unchanged.

The fixture now waits for the refreshed grid's visible column value before further
interaction. Both Source replacements use this condition: opaque grid columns two,
strict grid columns three. The corrected controller/core journey passes both with
a held response and under normal scheduling, without changing its deadline. Red,
green and original CI artifacts remain under the ignored `ci-1` reports. No SDK or
helper starts are used by this correction.

Prepare dispatch 2 of the three-dispatch ceiling on the corrected candidate.
Windows SUNDOWN's bounded test-only assignment is pending; its actual helper-start
consumption will be recorded from its returned evidence. No package or native editor
operation has run. Final terminal CI and host results will be recorded on PR #75;
that receipt owns closure without another evidence-only candidate change.

## Independent-review corrections

The [original closure receipt](https://github.com/Caldwell-41/Renpy-editor/pull/75#issuecomment-6551921617)
supersedes the pending directions above. Qualification ordinal 3, run 41261014666
attempt 1, and automatic quality 41262340085 pass at `af8c0bf`. Both artifacts were
audited. Mac and Windows real-SDK recovery pass with two of four helper starts per
host. The original three CI dispatches remain consumed, including failed CI1 and
cancelled dispatch 2.

Kris selected fixes after a separate Standards/Spec review of `c5f4ab1...af8c0bf`.
The follow-up covers the screen-root provisional resize regression, missing tested
executables in qualification artifacts and repeated image-test URL measurement.
The frontend worker owns `screen-ui.ts` and the workspace/image DOM test files;
the CI worker owns `audit-fixes.yml` and the existing retention helper/tests.
Both use separate T3-managed worktrees from `af8c0bf`, with Sol 6.1 High. The
coordinator owns review, integration, task/status records and PR publication.

The request to update the PR and run CI selects one additional qualification
dispatch, ordinal 4. The cumulative ceiling is four, with three consumed before
this follow-up. A dispatch counts when it starts, including failure or cancellation;
no retry beyond four is selected. Routine automatic PR checks remain separate.
No new SDK/helper, package, native editor or connected-Windows operation is selected.

The CI worker returned `fb696345628c1d7bd2da96e5ed0038a9c60b9fc2` on
`t3/fix-ci-artifact-retention`, integrated as `2257b07` after coordinator inspection.
It extends the existing retention helper with exact Cargo-artifact selection,
binary hashes and availability states. Earlier available executables survive a
later truncated record, which still fails retention. Upload requires source
identity and privacy checks. The ordinal ceiling is four; exact ref, candidate
and attempt-1 checks remain.

All 22 retention-helper tests pass in the integration checkout. A real local
three-case metadata run and controller build supplied Cargo messages; the helper
retained both exact executables and the five-file privacy scan passes. Worker
fixtures also cover failed pipelines, named-case compatibility, missing binaries,
privacy rejection and ordinal/ref/SHA/attempt rejection.

The frontend worker returned `6a1658be17eac29d0db7e004f691c40b9c40983a` on
`t3/fix-screen-root-resize-preview`, integrated as `91e9ae8` after coordinator
inspection. The guard had confused movement eligibility with resize support.
Screen roots and fixed groups now supply provisional bounds without requiring
two explicit alignment axes; canonical numeric position and anchor values retain
their coordinate meaning. Ambiguous parents still use helper geometry. One
test-local URL tracker replaces the four repeated image-test measurements.

The worker's held-response red/green cases cover screen-root frames, missing
alignment axes, explicit positioning and images, alongside the existing nested
fixed and ambiguous-parent cases. They check immediate and settled guides, focus,
revision-bound submission, refusal retention and cancellation. All 41 focused DOM
tests, typechecking and the frontend build pass. Its ordinary build encountered a
linked-dependency config-cache permission error; the supported runner loader
passed without changing dependencies or production code. Original logs are retained.

Coordinator inspection traced the coordinate values to the canonical numeric
parser and the helper's fixed layout for screen roots. The first combined frontend
run passed 304 of 305 cases; the Windows-probe validator failed because the command
used system Python 3.9 without `tomllib`. The documented complete Python 3.12
wrapper is selected for the corrected run. This is an environment failure, not a
product correction; the original failure remains in ignored reports.

With that wrapper, coordinator typechecking and all 305 frontend tests pass with
zero skips; the ordinary production frontend build also passes with its existing
chunk-size advisory. Numeric and nested real controller/core journeys both pass,
including exact source and Undo/Redo checks. Their receipts distinguish
`controllerAndRealCore: true` from `sdkGeometry: false`. The first numeric attempt
was refused by the sandbox's loopback-listen policy before browser interaction;
the normal authorized execution passes, with the refused evidence retained.

Coordinator review finds no remaining issue in these three corrections. The existing
core source tree remains `7ea249683da6e02479541c84131d475c4503874a`, identical to
the original platform SDK proof. That proof retains its original helper-rendering
scope; it does not qualify native pointer painting. Workflow lint, repository
validation and whitespace checks pass. The existing validation plan still selects
both exact job names in `screens-source.yml`; it does not inherit an old-head pass.
Publish one coherent candidate and dispatch ordinal 4. Terminal job identities,
retained executables, hashes, all required results and privacy/upload status must
be audited before the new receipt closes the follow-up. No merge is selected.

The prepublication source seal identified four unchanged PowerShell files with LF
working-copy endings where `.gitattributes` requires CRLF. Their bytes matched the
committed LF blobs, with no content difference after newline normalization. Original
working bytes and the refused seal are retained in ignored reports. Restoring the
required checkout endings produces no source diff, and the exact-candidate seal
passes across all 734 tracked material inputs. The workflow's strict identity gate
is unchanged.

## Compiled-file matching correction

The [ordinal-4 terminal audit](https://github.com/Caldwell-41/Renpy-editor/pull/75#issuecomment-6552700639)
closes the previous pending qualification at `aee7475`. Both targets pass and
their artifacts were audited. Its four consumed dispatches remain distinct from
the original platform SDK proof and earlier failed/cancelled attempts.

The full-PR Standards review found that `screens.create` projected a stale catalog
for `game/ui/saved.rpyC`. Inventory reading recognized the extension, while the
creation response removed only an exact lowercase `.rpyc` path. An immediate
`screens.list` differed, and a second creation using the returned revisions
falsely failed with `SOURCE_CONFLICT`. The UI's automatic refresh masked the
public-API inconsistency. The Spec axis had no findings.

Kris selected fixing this finding, updating PR #75 and running CI. This selects
one additional both-target qualification dispatch, ordinal 5, for a cumulative
ceiling of five. Four are already consumed; ordinal 5 is reserved for this
candidate. A dispatch counts once started, including failure or cancellation.
There is no additional retry, SDK/helper start, package or native editor selection.
Mac ARM64 owns local development; the existing CI matrix supplies Windows x64
and macOS ARM64 qualification. The unchanged validation plan selects both exact
job names. The workflow's only allowance change admits ordinal 5; ref, SHA,
attempt-1, source identity, executable retention and privacy checks remain.

The focused public core/IPC case
`screen_creation_returns_current_catalog_for_compiled_extension_case` first
passes lowercase `.rpyc` and then fails uppercase `.rpyC` before the correction.
Afterward both spellings return the same catalog as `screens.list`, and a second
creation accepts that returned revision. One shared bytecode/source rule now
serves inventory reading and creation projection; actual matched paths remove
only their own unresolved-style and revision entries. Source generation, helper
execution and the shared transaction/history path are unchanged.

The focused red/green logs and full Screens results are retained under ignored
`.toolchains/reports/phase3b-audit-fixes/catalog-matching/`. The first local test
command lacked Cargo on PATH; activating the existing pinned checkout tools
corrected the environment before the recorded red/green run. No dependency or
system-tool installation was needed. The full Screens group passes 108 cases,
with five existing SDK cases deliberately ignored and no failures. All ten audit
cases pass, including the new catalog case. The 22 retention-helper cases, workflow
lint, repository validation and pinned Rust formatting pass. Self-review covers
the shared matching rule, unrelated opaque entries and the real public-API test.
CURRENT/HANDOVER retain their existing size exceptions for unique unrelated
acceptance and protected recovery; this correction shortens their live sections.

The PR update receipt owns the published candidate, ordinal-5 run/attempt,
cumulative consumption and watcher registration. Exact-head required jobs and
retained evidence require terminal audit before closure. Prior SDK results remain
bound to their original source and scope; they do not establish a new-head SDK
qualification. No merge or wider acceptance is selected.

## Merge and workspace retirement

Kris selected squash merging PR #75, cleaning completed workspaces/branches and
identifying the next ticket. PR #75 merged on 2026-11-01 as
`b7cb3a40f95857168e2fd4db89e3f51072ac705f` into
`codex/phase3b-screen-designer`. Its tree is
`3285068cc41eb0a8a908402f4d146c528405e04e`, identical to audited head
`2701156cf7522fdfe27fc51b077054d9ef102254`. The branch was mergeable with a green
required status; the merge matched that exact head and bypassed no check.

The [final terminal audit](https://github.com/Caldwell-41/Renpy-editor/pull/75#issuecomment-6553735694)
confirms ordinal-5 qualification 41274553889, attempt 1, and automatic quality
41274588222 at that candidate. Both artifacts pass archive hashes, all 46 manifest
entries each, all 734 source inputs and retained executable hashes/architectures.
Both targets pass 305 frontend cases, 108 Screens cases, all ten audit markers and
all five controller/core journeys. Existing specialist/SDK ignores retain their
scope. Cumulative dispatch consumption is 5/5 and closed. No new test campaign,
SDK/helper start, package or native operation ran during merge/cleanup.

All seven completed worker worktrees were source-clean and had only commits
patch-equivalent to the audited branch. No other T3 task was running. Their 131
unique evidence files were copied and SHA-256 verified before removal. The
verified bundle and retirement manifest under ignored
`.toolchains/retired-worktrees/pr75/` preserve original worker and completed
branch commits, exact heads, equivalence results and every saved file hash.
Regenerable dependency/build directories were discarded; evidence and shared
primary-checkout toolchains were preserved.

The seven worker branches and local `codex/phase3b-audit-fixes`,
`codex/ci-validation` and `codex/single-text-draft-owner` were retired. The latter
two match their merged PR #73/#71 trees exactly, and both merge commits are
ancestors of the current integration branch. Remote branches for those three
completed outcomes and `codex/l07-shared-looks` were deleted after head verification.
L07's remote head `9be475b` exactly matches PR #72's merge tree at `58dfae4`;
that merge is also in the integration branch. The recovery bundle contains all
eleven retired branch references. Original history was not rewritten.

Only the primary worktree and local `main`/Screens integration branches remain.
The remote main/integration branches and open Dependabot PR #69 are retained.
The unrelated untracked audit and all protected native recovery remain intact.
The completed maintenance brief is archived; CURRENT/HANDOVER replace the old
pending directions and retain their existing size exceptions for unique recovery.
The documentation closeout is separate from the tested merge tree and changes
no production code. It uses a temporary PR branch because the integration branch
requires `Loomlight validation` for every commit. Its validation plan selects only
ordinary automatic quality; no historical qualification is reopened. Repository
validation and link/whitespace checks cover the records, and the closeout PR owns
its automatic-check and temporary-branch retirement receipt.

Recommend L08 #41 next. Its L02 #37 prerequisite is accepted/closed in the issue
body and native dependency record. P3B #22 and B03 #25 retain broader acceptance.
The recommendation does not select implementation or a new operation allowance.
