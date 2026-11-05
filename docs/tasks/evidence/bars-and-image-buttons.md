# Integer bars and image buttons

Delivery and bounded acceptance belong to [#51](https://github.com/Caldwell-41/Renpy-editor/issues/51)
and [#52](https://github.com/Caldwell-41/Renpy-editor/issues/52). This file retains
implementation checkpoints, validation and review evidence. It is not another execution brief.

## Approved selection and contract checkpoint, 2026-11-05

Kris approved the coordinator's plan in the current T3 thread. The selected outcome
is a reviewed, verified implementation of both tickets committed locally on
`codex/51-52-integration`, based on `ab19b7869843445dba291ee8b9ef7ea4bef5ffd8`.
Publication, PR creation and merge are not selected. Both tickets' #47 prerequisite
is satisfied. Broader #54 canvas, aggregate groups and Phase 3B acceptance remain separate.

The coordinator owns shared contracts, integration, combined qualification, final
review and findings. A core agent owns both controls' Rust implementations and
tests. An editor agent owns both controls' frontend implementation and tests, and
must create the separately requested Sol 6.1 xhigh design chat before production UI
changes. Both implementation agents use Sol 6.1 xhigh, the implement skill and their
own T3-prepared worktree/branch. Browser and desktop operation uses Terra 6.1 max.
The core assignment uses worktree `t3-1ede8784`, branch `t3/bar-imagebutton-core`.
The editor assignment uses worktree `t3-fee8f4ca`, branch
`t3/screens-bars-imagebuttons`. Both start at contract checkpoint
`062c429f62e826b74beff0592fa0be2f9408484c`. The editor launched the requested
separate design chat on `t3/design-bars-imagebuttons`, worktree
`t3-design-bars-imagebuttons`, at that same checkpoint. Its ownership is the new
`design-lab/screens/bars-imagebuttons/` directory, registry registration and new
`docs/design/design-lab-bars-imagebuttons/` records. The exact user approval and
source/capture handoff must go directly to the editor agent, copying the coordinator.

Shared definitions are `screens/controls.rs` and `screen-controls.ts`, exclusively
owned by the coordinator. Implementation files transfer to their named writer after
this checkpoint. A requested contract change returns to the coordinator for a
reviewed checkpoint before dependent work continues. Mutable outputs and fixtures
stay isolated per checkout. No worker starts SDK/helper/package/native operations
without a coordinator reservation.

The coordinator subsequently expanded the core writer's ownership to
`screens/canvas_session.rs` for the six image-button asset properties. That change
must reuse `copy_asset` and existing containment/hash/dependency checks, with no
process/lifecycle change. The shared controller driver remains coordinator-owned.

### Initial interface agreement

- `IntegerBarBinding` names an existing integer variable by stable ID with canonical
  decimal-string minimum and maximum. The qualified mapping must enforce a positive
  range and integer steps, and must reject unsupported or imprecise bounds.
- `BarAppearance` contains nullable literal colors for `left_bar`, `right_bar` and
  `thumb`. Null restores the corresponding default. Qualification precedes support claims.
- `ImageButtonAppearances` requires a normal UI-image reference and nullable hover,
  selected, selected-hover, disabled and selected-disabled references. Every reference
  uses the existing asset ID/content-hash validation. Source names are `idle`, `hover`,
  `selected_idle`, `selected_hover`, `insensitive` and `selected_insensitive`.
  Missing optional states retain Ren'Py's native fallback behavior.
- Composition extends the existing `screens.compose` transaction with `addBar`/`bar`
  and `addImageButton`/`imageButton`. Add commands capture `parentId`; edits capture
  `nodeId`. Bars carry `binding`, `appearance`, `width`, `height`, `layout` and
  `expectedAuthoringRevision`. Image buttons carry `appearances`, `width`, `height`,
  `layout` and the existing `InteractionEdit`. The coordinator reviews exact enum
  wiring before the editor consumes it. One combined Apply is one transaction.
- Inspection exposes nullable `barBinding`, `barAppearance` and
  `imageButtonAppearances` on nodes. Existing action inspection supplies button actions.
  Unsupported expressions remain Source-only with conservative unknown effects.
- Canvas preparation accepts only validated data and marked samples. It must never
  evaluate a value expression, load game code or execute an action. Existing variable
  samples and button-state selection remain separate from source/runtime values.

### Approved verification seams and limits

TDD is approved at public core operations, the actual Screens UI connected to core
dispatch, and deliberate pinned-SDK preview/normal play. Core cases prove minimal
patches, validation/revisions/effects/history/reopen. UI/core cases prove real drafts,
Apply/Cancel, numeric/keyboard editing, picker focus and retained failures. SDK cases
prove binding/limits, appearances and qualified actions. Isolated mocks do not replace
those paths. Workers run focused tests during development and their applicable full
suite at handoff; the coordinator runs the combined full frontend and routine broad
core suites after integration, with documented specialist exclusions.

#51 owns the single cumulative operation record linked by #52. Approved ceilings per
target are 16 deliberate SDK process starts, four helper starts, two package builds
and three native editor launches. Actual starts, including failures/cancellations,
count; audited preflight refusals do not. Windows x64 and macOS ARM64 are required.
Initial use is zero for every category on both targets. No reservation is pending.
Routine tests, typechecking and review are uncapped. Earlier closed allowances stay closed.

### Readiness observations

The local and remote base match and the starting checkout is clean. Windows has
Node 24.19.0, npm 11.9.0, Rust 1.90.0 and runtime Python 3.12.14 with `tomllib`.
The official 8.5.3 archive hashes to pinned SHA256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`, matching
the retained published manifest and `renpy.rs`. The linked Mac reports macOS ARM64
and its registered project matches this repository; checkout/toolchain readiness
remains to be checked. `gh` authentication fails; connected GitHub reads work.
Git transport works with a process-scoped OpenSSL backend selection. No credentials
or machine configuration changed. The sandbox required escalation to create the
approved integration branch; that branch operation succeeded.

Automatic approval review rejected the initial issue-body updates because the plan
selected local-only delivery. Kris then explicitly authorized execution-state and
operation-limit updates to #51 and #52; both updates succeeded. Code publication,
PR creation and merge remain unselected. All capped operation counts remain zero.

### Editor/core coordination

Existing `screens.compose` remains the combined write owner. The editor will reuse
`ScreenLayoutEditor` reservations, `ScreenImages` picker/media and the current
action draft/builder. Additions choose a qualified parent; edits retain their current
parent. These tickets add no reparenting API. Dimension fields own width/height;
the accompanying layout map must not provide competing xsize/ysize edits.

The public controller driver already permits variable creation, asset import and
review, composition and `screens.canvasPlan`. UI/core proof will use those real
operations while keeping frame transport outside that journey. It must not start
a helper merely because the driver also permits canvas rendering. The exact
control-draft request fields and additional inert state names are frozen below.

### Frozen wire checkpoint

`screen-controls.ts` owns the exact `ScreenControlCommand` union. The four command
names and fields are those in the initial agreement. `layout` is optional and must
not compete with the required width/height. Image-button `interaction` uses the
existing complete revision/context review. No new protocol operation is introduced.

Canvas requests add `barSamples`, `barAddition`, `imageButtonSamples` and
`imageButtonAddition`, with empty/absent defaults. Each sample carries `nodeStart`;
each addition carries `parentStart`. Bars carry binding, appearance and dimensions;
image buttons carry appearances and dimensions. Existing `layouts` supplies numeric
placement edits, `variableSamples` supplies inert variable values, and `buttonState`
selects normal/hover/selected/selectedHover/disabled/selectedDisabled. Bar sample and
addition records also require `expectedAuthoringRevision`, captured with the draft's
variable catalog. Stale variable-catalog drafts must not silently rebind for preview.
No action or runtime state assignment enters those draft records.

Shared Rust `BarDraft`/`ImageButtonDraft` use the existing image-draft pattern of
optional target fields; request validation must enforce exactly the target appropriate
to samples versus addition, reject competing fields and prevent two simultaneous
additions. `ControlButtonState` replaces the former four-state owner through a
single alias in the canvas implementation. The old enum must be removed, not retained
as a parallel state contract. Existing text-button sample mappings also gain the
two explicit selected states. Node fields remain nullable as agreed above.

For the sole prospective control addition, separate numeric `layouts` entries target
the existing synthetic start convention: one plus the maximum node `span.end` in
the selected accepted screen. This is not the whole file's byte length. Core defers
that layout entry until preparing the addition against its final parent, rejects
competing dimension edits, and refuses duplicate/synthetic targets without the
matching sole addition. The editor retains placement preview before Apply. Existing
ordinary image/composition additions use the same selected-screen byte-span convention.

Pinned-SDK source inspection shows that image-button bounds do not scale its child
images. The qualified writer therefore uses a bounded literal
`Transform(path, xysize=(width, height))` for each explicit appearance, mirrored as
validated data by the helper. Every supported size-write path must update those
state dimensions through the same owner or refuse without writes; a bounds-only
success is invalid. Plain paths must retain their native unscaled semantics or
remain outside the editable mapping rather than receive a scaled canvas substitute.

Native optional fallbacks are hover/disabled/selected to normal, selected-hover to
hover then normal, and selected-disabled to disabled then normal. Selected-hover
does not fall back to selected. The coordinator sent these mappings to core, editor
and designer before approval. No DTO or process behavior changes are needed.

The coordinator reviewed these shapes against the existing composition, action,
image-draft and layout owners. A concrete implementation conflict still returns to
the coordinator before any schema change. This checkpoint authorizes schema-dependent
tests; production frontend still requires the exact approved design handoff.

The core owner confirmed the composition envelopes and proposed revision binding
for provisional bars. Coordinator review accepted that guard before frontend
consumption and added mandatory `expectedAuthoringRevision` to bar canvas records.
The frozen array/addition shape and existing separate layout edits remain unchanged.
Image-button edits may omit actions to retain the accepted statement; additions must
provide an explicit empty or typed action list. Canonical integer endpoints and their
positive range must remain exactly representable in the qualified engine domain.

### Initial checks and retained environment failure

At `062c429f`, the editor ran pinned offline dependency installation, TypeScript
checking, and 56 existing image/action/composition/copy-draft tests successfully
with zero skips. The initial missing `tsc` was an absent-dependency prerequisite,
resolved by `npm ci --offline --ignore-scripts`; no tracked dependency change occurred.
No production UI was edited.

The primary-checkout repository validator fails on missing final newlines in two
pre-existing untracked recovery receipts, `source-import-receipt.json` and
`sdk/recovery.json`, under `.tmp`. Their bytes are preserved. This is an environment
artifact failure, not a pass or a product defect. Tracked-source validation is
selected separately for this checkpoint; clean-candidate validation remains required
at integration. The new wire types pass TypeScript checking and Rust formatting.

### Linked Mac preparation refusal

The linked Mac reports macOS ARM64 and a matching registered repository. An attempted
read-only readiness delegation with `isolation: worktree` was refused by T3 before
creating a task: linked-environment delegation runs in the project's checkout and
does not support that isolation. T3 requires a separate top-level chat with a worktree
workspace strategy. No remote process, source edit or capped operation started.
The coordinator requested authorization for that separate Mac qualification chat;
local core/design work continues independently. No shared-checkout substitute or
shell-created child worktree was used.

### Export and qualification admission preparation

The core owner reserved ordinary test
`screens::tests::controls::export_screen_controls_public_core_fixture`, with
`LOOMLIGHT_SCREEN_CONTROLS_EXPORT` selecting an optional retained copy. It must
export accepted `.rpy` files and six distinct imported public PNGs with path/hash/size
receipts. The manifest binds owner/dialog/entry/document, bar/image-button IDs,
variable/actions/resolved effects, parsed project/source-map/authoring sidecars and
the two-aspect six-state canvas-plan matrix. It must declare no engine execution.
Parent-owned runtime observers and SDK qualification remain separate.

The coordinator added `qualify-screen-controls.py` admission functions and five
focused rejecting tests. Red cases first exposed absent admission functions and then
the distinction between JSON booleans and numeric flags/duplicate JSON keys. Green
verification passes all five tests, including one selected successful exporter bound
to the manifest hash, exact accepted source/image bytes, bounded file receipts,
ordinary bad paths, and changed/missing/duplicate/undeclared game inputs. Existing
frozen file/path/JSON utilities are reused. These synthetic admission tests are not
public-core export, SDK, native, canvas-rendering or ticket acceptance evidence.
The actual exporter, semantic manifest admission and runtime qualification remain pending.

The next red/green admission slice adds the exact twelve-plan matrix: six states at
1280x720 and 1024x768, matched to the accepted document and control byte offsets.
The seven focused tests now pass, including refusal of incomplete/duplicate matrices,
stale requests, partial plans, wrong states and missing controls. This still proves
only admission behavior, not actual producer output or rendered pixels.

### Prototype browser capability failure

The designer reports one Terra review attempt, not two. It opened no prototype and
performed no interactions or viewport checks. The shared preview tool refused a
`file:` URL; the in-app browser was unavailable; native app selection then timed out
waiting for Computer Use approval. Module/export/fallback checks and successful
inline HTML rendering remain separate from that failed review.

The coordinator's attempt to cancel the replaced Terra task was refused because only
the owning design thread can cancel it. That owner was instructed to retire its old
task/approval wait and preserve the failure receipt. A separately scoped second
Terra attempt may operate a bounded temporary DOM-test HTML copy through
`html_preview`, without a server or native-browser retry. Any successful result is
synthetic DOM/inline-browser evidence, not trusted native input or a whole Design Lab
pass. No user design approval or production UI implementation is inferred.

After exactly two inconclusive Terra tasks, the coordinator took over the focused
browser check under Kris's standing exception. A small inline diagnostic proved
script execution and completed prototype mounting. The missing receipt came from
capturing before the original chained timer-based test completed. An ignored test
copy uses event-based mount/dialog-close waits and microtask flushes for synchronous
sample callbacks, retaining the original 1500ms mount bound and all nine checks.

Both dark-mode `html_preview` calls, at 560px and 1280px widths with an 800px browser
viewport height, returned `BAR_IMAGEBUTTON_DOM_COMPLETION` with `passedCount:9` and
`failed:null`. Groups cover samples/fallback hints, three variants, picker Cancel
focus, one Apply/Undo/Redo, no-op/Cancel/invalid retention, Source/navigation,
remount/revision retention, image selection/aspect and missing-asset/stale-source
retention. Prototype source remains `0a6e571eb4c65ea60ce1fa446cd27d2a12985884`,
fingerprint `ecd02f2dfb490297d89c1b05e5fb2787cb166868e8ea77a7d1dee72093785373`.
Actual tool-payload SHA256 is
`0f2c60560176c287c9162eb0d5b35800e281b37d7e74ddb095c31d6be50c1ff8`.
The payload has 404,936 characters and 87 CRLF pairs. The initial preparation
receipt reported LF-normalized hash
`c04a174acbff2592dc6fb9aa4490382030f7b750beadeca3bee7eece2e53b012`
before Windows newline conversion; that is an equivalent preparation hash, not the
actual tool-input hash. The coordinator checked the retained argument string and
raw file, corrected this distinction, and informed the designer. Assertions and
prototype source are unchanged.
Ignored `prototype-dom-review` material retains exact input preparation, hashes and
tool console receipts. These are synthetic DOM callbacks in a browser, not approval
captures, native/trusted input, actual core/source/runtime or full Design Lab proof.
The designer received the exact receipt and must still obtain Kris's explicit
design decision and send its approved handoff directly to the editor agent.

## Core handoff and retained source admission, 2026-11-06

The core writer returned clean head `76dfe030b4fab078350297b6f90499857c81483f`.
Its implementation sequence is `42ee7e58`, `931e8173`, `718b3af5`, `59e97d7b`
and `76dfe030`. Shared checkpoint picks `804f3279`/`f5c6f458` are counterparts of
the coordinator's existing `461f388b`/`83f02742`; integration must not duplicate them.
The writer touched only its thirteen assigned Rust/helper-renderer files.

Independent Standards review at `42ee7e58` found no-op source-spacing churn and a
duplicated renderer state-prefix mapping. Spec review found a dimension guard in
the wrong canvas loop and unresolved xysize aliases in the helper data plan. The
four findings have focused red/green fixes in the committed sequence. The separately
approved contextual bar guard refuses extraction into Components while preserving
same-screen reorder, known variable-mutation effects and binding/variable revisions.
Parent combined review remains pending.

The final corrected-controls selection passes 13/13, zero ignored, at `59e97d7b`
in 485.89s under broad-suite contention. The four bar cases covering the final
extraction guard pass on the tree committed as `76dfe030` in 10.02s. Final formatting,
whitespace, clean-tree and repository checks pass at that worker head. The retained
`59e97d7b` manifest hashes to
`33d536bd4d5cc8e006e5bac70fc53b7f3870a4b2c427ef02a0783e0ad521314a`.
It has fifteen accepted files, six distinct PNGs and twelve plans, with no engine
execution. The final extraction-only guard does not change those source/render
inputs; that earlier result keeps its exact producing candidate.

Parent admission now checks the actual retained export's metadata, source hashes,
owned contexts, integer defaults/limits, six asset references, ordered actions,
effect/binding/variable/asset revisions, normal Story entry and exact inert data
plans. Three explicit retained-export checks and seven ordinary admission tests pass.
Negative variants reject changed limits/assets/actions/effects/context/revisions,
false provenance and altered plan sizes/values. Initial red admission exposed a
wrong harness assumption that authoring revision was the raw metadata hash. It is
the existing public aggregate over metadata plus variable-source path/hash inputs;
the gate now independently derives that aggregate. No product change was made for
that harness defect. Initial shell-policy/argument-quoting preflight failures were
corrected with the prescribed fresh PowerShell wrapper and stop-on-error invocation.

The worker's broad release run at `42ee7e58` failed with 600 passed, seven failed,
53 ignored and three documented filtered cases in 2273.46s. Four TLS fixture failures
were missing literal `python` on PATH. The same release binary's subsequent exact
`ai_request::tls_tests` selection passes all seven tests in 2.13s with process-local
existing Python/Git paths. The original broad run stays failed. Three Windows
symlink-creation cases remain failed/unqualified with OS error 1314 (privilege not
held): two lifecycle cases and one managed-SDK reparse case. No security setting,
permission, specialist exclusion or product protection changed. Original full/TLS
logs and both retained exports remain in the worker's ignored `core-51-52` output.

All SDK/helper/package/native operation counts remain zero. Source admission does
not qualify real frontend/core interaction, deliberate preview/play, helper rendering,
native packaging, Mac behavior or ticket acceptance.

## Integrated core checkpoint, 2026-11-06

The coordinator cherry-picked the five implementation commits in order:
`42ee7e58` to `781a5007`, `931e8173` to `0117da44`, `718b3af5` to `3fa81ded`,
`59e97d7b` to `5e26f9c3`, and `76dfe030` to `b23bbcc9`. Shared checkpoint picks
were not duplicated. The integrated `app/src-core/src` tree equals the final
worker tree byte-for-byte under `git diff --exit-code`; no conflicts occurred.
The root and editor worktrees are clean at `b23bbcc9`. These facts establish
integration identity, not a fresh run of the worker's tests on the combined branch.

Canonical DATA_MODEL now describes the combined controls, six total image states,
captured bar revision, dimension ownership, inert samples and contextual extraction
refusal. Issue bodies #51/#52 record the integrated checkpoint and actual failure
scopes under Kris's explicit publication authorization. Both issues remain open.
Production frontend work still waits for exact design approval and the designer's
direct handoff. Runtime-observer preparation continues independently, through the
already approved deliberate pinned-SDK and normal-play seams.

## Runtime qualification preparation and first rejection, 2026-11-06

Parent qualification driver `4894868f` adds an offline committed-source producer,
retained-binary admission and a reserved seven-process SDK matrix. Nine initial
admission tests and four explicit retained-export checks passed. The first producer
attempt failed because the process PATH put Git's Unix `link.exe` before MSVC.
Appending that existing directory after the development environment fixed the
environment error. No SDK started in either producer attempt.

The integrated producer then passed in 162.875s, retaining its binary and fifteen
accepted files. Candidate is `4894868face68a6635a41a0c561eeb934eaf9b7f`;
manifest SHA256 is `3dc54f9315da5712cd51117388fcbe28a87fb97dfdce6a3c13bd24b31f632b05`.
Preparation and validation are retained under the ignored `controls-51-52` output.

The first SDK selection consumed four starts. Version, compile, lint and 1280x720
normal play exited 0. All ten engine assertions passed: initial value 0, lower -5,
upper 15, keyboard step 14, and exactly one accepted SetVariable/Hide/Return chain
ending with value 7 and one Story continuation. The parent evidence gate failed.
It incorrectly rejected exact float-valued geometry (320.0x24.0). Inspection also
showed the six appearance samples reading the first state's cached pixels. None
of this run is promoted to completed runtime qualification.

The observer correction accepts numerically exact geometry while still rejecting
booleans, uses the established `free_memory` capture boundary, and compares each
full state image to an independent native reference using its accepted asset.
PNG source colors remain independently bound; native readback must match exactly
and all six rendered hashes/colors must remain distinct. Captures are retained and
rehashed from their decoded RGBA bytes. No pixel tolerance is introduced. New
red/green gate tests cover valid float geometry and matched native readback while
rejecting wrong/aliased source, state, geometry and pixel evidence. Ten gate tests
pass. The next SDK run must establish whether the capture correction works.

#51 records cumulative Windows SDK use 4/16, all other target/type counts zero,
no uncertain starts and complete process/scratch cleanup. The unused three-start
reservation was released. Original logs and failed result stay retained.

The second producer at `fe78025fcf66652c072c9f7e64c4c98162ddb019` passed in
128.391s, with manifest SHA256
`04ee4aebdc198bf877bf429bbe602fbd28bc6f5f592852e55dbe16fd4c398b16`.
Its second SDK matrix stopped after four starts because the pinned Ren'Py pygame
module lacks the observer's assumed `image.tostring` API. Version/compile/lint
passed; the normal case failed in its observation hook. Two PNG captures saved
before that error independently have identical full decoded RGBA hash
`884fcddfef4b188bd506a7c9f97203fee4ea91f6f7310f5e80bdaf7acdb54360`
and 160x80 size. This confirms the normal reference/readback pair only, not the
other states or the matrix. The replacement hashes row-major pixels through the
already-working Surface `get_at` API.

Reassessment before another run separates those harness failures from production
behavior. Core and accepted source are unchanged; neither failure demonstrates a
product defect. Repeating the producer and SDK setup for this observer-only edit
would not exercise changed production inputs. A narrow reuse admission therefore
binds the original producer's inputs and binary to its commit, requires every
non-observer dependency unchanged, and separately binds current instrumentation
to its committed candidate. Reuse of the first three SDK checks requires the exact
same accepted manifest, prior inputs, SDK pin, successful checks and cleanup.
The failed campaign stays failed. Four fresh runtime cases remain required.
Explicit rejecting checks must pass before this route is used. No numerical pixel
tolerance or source/runtime acceptance waiver is introduced.

Current cumulative Windows SDK consumption is 8/16. The second unused three-start
reservation is released; other operation/target counts remain zero and no process
or reservation is pending. Tracked-source validation passes 1742 files. Full
validation still fails only the two previously recorded untracked recovery-receipt
newlines; those files remain untouched.

## Windows runtime proof, 2026-11-06

All four selected cases pass at observer candidate
`7d199aa901d720cab1f34a1c1c619b2b321ed9c9`: normal Story entry and deliberate
fixture preview, each at 1280x720 and 1024x768. Their SDK processes exit 0 in
5.953s, 3.844s, 3.781s and 3.843s. Ten ordinary gate tests and all four explicit
producer/setup admission checks pass. The latter demonstrate rejection of changed
core dependencies, changed binaries and failed/wrong/unclean setup before reuse.

The exact accepted-source producer stays `fe78025f`, with manifest SHA256
`04ee4aebdc198bf877bf429bbe602fbd28bc6f5f592852e55dbe16fd4c398b16`.
All non-observer dependencies match its commit; the original input fingerprint and
binary identity remain unchanged. Version/compile/lint keep that earlier producing
basis. Four fresh SDK tests load the corrected committed instrumentation. Both
earlier failed SDK campaigns remain failed and retained.

Each case observes the real bound variable at 0 initially, -5 at the lower limit,
15 at the upper limit and 14 after one keyboard step. Native bar size is 320x24,
range 20, offset -5 and step 1. The accepted image-button action executes its
SetVariable(7), Hide and Return exactly once in order, leaves the Panel hidden,
finishes the Dialog and reaches one following line without reaching the done line.
Built-in methods are observed with `sys.setprofile`, not replaced.

All six native image-state renders match independent accepted-asset references in
their full decoded RGBA pixel hashes at 160x80. Every state has a distinct hash and
color; source PNG colors remain independently checked. Forty-eight actual/reference
PNGs are retained across the four cases and rehashed after decoding. Actual pointer
input separately reaches idle and hover. Sampling changes neither the variable nor
the action-call count. Accepted game-file hashes remain unchanged in every case.

These are engine appearance samples, not proof of naturally selected/disabled
runtime conditions or physical input. The deliberate preview is a fixture entry
using the accepted screen, not evidence for the native editor's preview route.
Helper rendering, the actual frontend/core editing journey, native/package proof,
Mac qualification and parent combined review remain pending. Exact design approval
and direct handoff still gate production UI. No ticket acceptance is inferred.

Local output is `app/target/controls-51-52/runtime-7d199aa9`. Its result SHA256 is
`bd946c12d12a86a3f922ba72476784f26c3b942ba4e8f1f8e4d8a79ba905a045`.
Process/scratch cleanup passes, with no uncertain starts or remaining reservation.
#51 records cumulative Windows SDK starts 12/16, helpers 0/4, packages 0/2 and
native editor launches 0/3. All Mac counts remain zero. The remaining four Windows
SDK starts must not be spent on duplicate setup or unreserved helper/native work.
Issue bodies #51/#52 record this scoped checkpoint; both remain open and code stays
local-only.

## Authorized Mac chat creation interrupted, 2026-11-06

Kris explicitly selected "Create the Mac qualification chat". The coordinator
requested one top-level chat with T3 `workspaceStrategy: worktree`, branch
`t3/mac-bars-imagebuttons-qualification`, based on the Mac project's actual HEAD.
Its bounded first task is read-only readiness; source synchronization and capped
qualification still require a later exact candidate handoff and reservation.

The link initially reported reachable and the project read succeeded. Chat creation
then returned an orchestration error that the Mac did not answer. A fresh link check
reports unreachable. No thread link or worktree identity was returned, so creation
is unconfirmed. One idempotent retry with the same request ID returned the same
host-unavailable error. No capped operation was requested and no allowance was consumed
by this coordinator. This is a host-availability blocker, not a need for renewed
permission or another checkout strategy.

Retry the exact saved request with client ID
`51-52-mac-qualification-chat-20261106-01` after the host is reachable. The original
arguments and failure response are retained in ignored local output so a retry can
recover an already-created request without duplication. Do not create a new request
ID, mutate the shared Mac root or claim readiness before its report arrives.

## Mac qualification chat created, 2026-11-06

After Kris reported the host was back on, the link reported reachable. Retrying the
same saved client request succeeded and returned one top-level qualification chat:
<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/mcp:launch:aed218e73e07211906bdf413f41978e96efe3ae09756ac17e0c6842d8b443ee7>.
T3 bound isolated branch `t3/mac-bars-imagebuttons-qualification`; initial inspection
reports a clean checkout at `1c6ed02539071377ef6ec2aa5e262fe5313a625b`. The primary
Mac checkout has separate active work and stays untouched.

The launch inherited Sol 6.1 high rather than the planned xhigh setting. The
coordinator corrected the same chat to verified Sol 6.1 xhigh. Configuration
interrupted the first read-only turn; an attempted restart found no active run,
so a normal send resumed readiness with corrected settings and preserved prior
observations. No second chat or checkout was created.

The assignment permits ordinary tool/version and archive/provenance reads only.
No production edits, dependency installs, builds, SDK/helper/package/native starts,
publication or further agents are authorized by this readiness handoff. Later tests
need the exact committed candidate and a coordinator reservation in #51. The Mac
session reported that its reverse T3 message to Windows is denied; it may finish
its report in the same chat for the coordinator to read through the linked
environment. Full readiness and transfer feasibility remain pending that report.

The completed initial report confirms native ARM64 macOS 26.6.2, Rust/Cargo 1.90.0,
Node 24.19.0/npm 11.9.0 and Apple Command Line Tools/macOS SDK availability.
The retained official SDK archive freshly matches the pinned SHA256; the extracted
version source and Mac launcher/executable match the archive without execution.
Accepted baseline `ab19b786` exists locally and is an ancestor of the isolated
readiness base, which adds an unrelated Story prototype commit.

Only external Python 3.9.6 without Pillow was found in the initial checked locations;
host-level identity inspection also reported no valid signing identity. Neither
finding establishes absence/deletion or authorizes installation, certificate
replacement or Keychain changes. Earlier accepted Mac evidence records Python
3.12.16/Pillow 12.3.0. The same chat is now locating that existing harness environment
through targeted tooling/receipt paths and checking read-only access to the approved
identity. Preserve the initial scope and wait for this clarification before treating
the findings as provisioning needs.

The report identifies an incremental Git bundle from the accepted baseline plus
synthetic fixture/archive SHA256 receipts as a private transfer route. Existing
Windows-to-Mac messages can carry base64 chunks; direct binary attachment transfer
was not established. No candidate has been sent or synchronized yet. All Mac capped
counts remain zero. The complete report is retained in ignored local evidence.

The targeted follow-up found the existing project-root harness environment at
`.toolchains/l07-shared-look/final-review-python/bin/python3`, confirming Python
3.12.16 and Pillow 12.3.0 through version/import checks only. It also found the
Codex runtime with Python 3.12.14/Pillow 13.0.0, which stays distinct. The original
missing-in-checked-locations result is preserved; no provisioning is needed.

The exact approved Loomlight Local Development identity exists in the default
login Keychain, already in the search list and reported unlocked/readable. The
valid-only query excluded it with `CSSMERR_TP_NOT_TRUSTED`, explaining the initial
zero-valid-identities result. Parent inspection confirms that `macos-package.py`
enumerates identities without the valid-only filter and selects the pinned
fingerprint. Actual signing/private-key access remains untested. No trust, ACL,
search-list, Keychain or certificate change was made or authorized.

A private incremental bundle is staged locally at candidate `3b67b426`, with
accepted-baseline prerequisite `ab19b786`. Git bundle verification passes; it is
81990 bytes with SHA256
`ba4eda299c284db4bbdadbe8fde9cc9a8f7558dbc0c1dee916cd22ee3cb3629c`.
The first raw-SHA bundle command refused an empty bundle before producing usable
output; using the named HEAD ref produced the verified bundle. No SDK started.
The bundle has not been sent or imported. This preparation does not grant source
synchronization or qualification to the readiness chat; a later coordinator handoff
must name the exact candidate, hashes, safe checkout transition and reservation.
All Mac capped counts stay zero. No additional provisioning decision is pending
from readiness; final platform qualification remains unrun.

## A2 refinement selected, 2026-11-06

Kris instructed the designer to refine A with two council rounds, aiming for a more
pleasing UI/UX and scores of 9/10. The designer owns all code in a new unapproved
A2 lab revision and requests read-only Opus 5.5 xhigh plus Sol 6.1 xhigh feedback
each round under the council skill. No duplicate coordinator panel is selected.
Two rounds are the current selection; a target score is not an invented result
or authorization for extra rounds.

Original source `0a6e571eb4c65ea60ce1fa446cd27d2a12985884` / `inspector-v1`
stays pinned. Its earlier synthetic DOM evidence does not transfer to A2. Production
UI is still unapproved. The editor received the designer's direct update and
acknowledged the gate. After Kris's decision, the designer must send the exact
approved successor source/fingerprint/captures and approval evidence directly to
the editor, copying the coordinator. Frozen DTOs, one combined Apply, no reparent
UI and native fallback rules remain unchanged. No native retry, server or capped
process start is selected by this design refinement.

Execution-state updates to #51/#52 record A2 as unapproved. Automatic approval
review rejected the first #51 write and its retry because a whole-body replacement
would republish detailed Mac signing/Keychain and private-transfer observations
outside the authorized status/limit scope. A narrower replacement removed that
detailed readiness section from the outward body, retained the existing ticket
requirements/accounting and added only design execution state plus generic Mac
readiness status. That write succeeded. Detailed host observations remain local;
no broader publication authorization was requested or inferred.

## Unapproved A2 source pin, 2026-11-06

The designer pins variant `inspector-v2` at source
`99f983ff546f0324abf969cf9c5c984d59f97685`, fingerprint
`3c76cf993ef5dffcc810e5223ba06b6bb7d02ea0490b11a1fb37ec866303a3fc`.
This is an intermediate unapproved successor, with no production handoff.

The designer reports TypeScript/export and eleven focused synthetic DOM groups
passing at 560/1280. Changes cover section navigation and remembered disclosures,
asset/picker/clear controls, inert state preview and resolution label, opt-in aspect
linking, parent-relative vertical placement, matching horizontal sample/selection
geometry, field-associated revealed errors and compact scrolling. Duplicate remount
DOM was corrected. These reported checks belong to A2; they do not replace real
frontend/core, native input or human approval evidence.

Parent read-only Git inspection confirms the source commit exists and its changed
paths from pinned `0a6e571e` are limited to the owned lab/record files. Original
study/style/appearances and production files are absent from that diff. The parent
has not rerun the designer's checks or independently recomputed this fingerprint.

Sol round one's 7/10 rates original A, not this A2 pin. Opus round one remains
pending; no polling or replacement is selected. The designer will incorporate that
feedback, then launch the second and final selected round with fresh read-only
reviewers on the exact resulting revision. No score, final successor identity or
Kris approval is inferred. The direct approved designer-to-editor handoff remains
required after Kris's decision, copying the coordinator.

## Sol round-two findings and corrected A2 pin, 2026-11-06

Sol round two reviewed source `fb147c895898b2f24ce30d75261302157dc7279b`, scored
8.5/10 and accepted the visual direction. It reported two must-fix source issues:
shared error state leaking across control drafts or remaining after action
correction, and Horizontal position accepting `abc`. That score applies to the
reviewed source only; no score is assigned to the later correction.

The designer reports a focused synthetic red reproduction of the error leak,
draft-owned error/clear paths, signed whole-pixel validation within -16384..16384
and aligned picker rows. Corrected source is
`b9eb9ad6208a8b8e00ccee0dd27ba5091fdfbbf4`, fingerprint
`e99a95704f1f1665e03755b9b812619d6c948b6c5a486617b7be7b9f4352a9f5`.
Fourteen focused synthetic DOM groups reportedly pass at both 1280/560. They make
no real core, native or physical-input claim.

Parent read-only Git inspection confirms both source identities exist. The fix
changes only `refined-study.ts`, `refined.css` and the owning REFINEMENT record;
the complete diff from original `0a6e571e` remains within lab/record ownership.
Production and original study/style/appearance files are unchanged in that diff.
The parent has not independently rerun the synthetic checks or recomputed this
fingerprint, and this scope check is not another council review or rescore.

Opus round two remains pending. No third council task, user approval or production
handoff is selected. After the remaining review, the designer will finalize the
exact successor and captures, request Kris's approval, then deliver any approved
handoff directly to the editor and copy the coordinator. A later correction may
change this intermediate source identity without changing the recorded Sol score.

## Two council rounds complete; corrected candidate awaiting approval, 2026-11-06

Both requested council rounds are complete. The designer reports these scores:

| Reviewer | Original A | R2 source `fb147c89` |
| --- | --- | --- |
| Claude Opus 5.5 xhigh | 6.5/10 | 8/10 |
| GPT-6.1 Sol xhigh | 7/10 | 8.5/10 |

No third round was requested or run. All local must-fix and should-fix findings are
reported addressed, including draft feedback ownership/action clearing, signed
pixel validation, picker alignment, redraw focus, visible field errors/red focus
borders, compact sticky offsets, footer feedback and accepted-size preview while
raw input is invalid. Corrected source has not been independently rescored; the
9/10 target is not claimed as achieved.

The corrected runnable `inspector-v2` candidate is source
`0263728d9e07e951d25060d635d58094eac20c28`, fingerprint
`1d6424ed32ef37e6dc9e8d31fe63ee8cf7ce5308d6139de3bcc35fc6a564034d`.
Receipt/capture documentation is committed at
`f8198c6fdd5ddb4e95c9105864648b38c4770fdc`. Its owning
`docs/design/design-lab-bars-imagebuttons/a2-source-receipt.json` retains reviewed
source `fb147c89` separately and marks the final candidate unapproved.

The designer reports fifteen focused synthetic DOM groups at both 1280/560 and
clean TypeScript/export. Parent read-only Git inspection confirms the candidate
and receipt commits and the lab/record-only changed paths from original `0a6e571e`.
An independent metadata audit rehashed all seven final PNGs directly from the
receipt commit and matched every SHA256 and declared width/height. It did not view
or rescore the design, rerun the synthetic checks or recompute the source fingerprint.

The designer rendered the corrected runnable candidate for Kris's exact decision.
There is no user approval or authorized production handoff yet. Full design:check,
trusted/native input and real core/runtime proof remain separate. After the exact
decision, any approved successor handoff must go directly from the designer to the
editor and copy the coordinator. Original source/proof remains intact. No capped
operation, server or additional review round is selected by this checkpoint.

## One final additional council round authorized, 2026-11-06

Kris explicitly authorized one additional final round, R3, aimed at 9/10, plus an
annotated screenshot showing changes from original A. This supersedes the earlier
two-round ceiling for this one round only. Earlier scores and source bindings stay
unchanged; no fourth round is selected.

Frozen candidate remains `0263728d9e07e951d25060d635d58094eac20c28`, fingerprint
`1d6424ed32ef37e6dc9e8d31fe63ee8cf7ce5308d6139de3bcc35fc6a564034d`.
Sol R3 now reports 9/10, satisfied, with no must-fix findings. Its review verified
source/capture hashes and inspected static PNGs; it did not rerun synthetic checks.
The only reported optional note concerns `actions.touched` allowing an Unsaved
footer after restoring values. It is not a selected source change or scope expansion.
The earlier fifteen-group synthetic result keeps its own producing basis.

Opus R3 remains pending, with no polling or replacement. The designer has prepared
and inspected a 1600px annotation board using the unchanged actual final screenshot,
six callouts, an original-A inset and error-recovery detail. Its final PNG will be
delivered after both reviews. No final annotation artifact identity is inferred yet.

No user approval or production handoff is implied by Sol's score or the annotation.
After the final review and exact decision, any approved handoff still goes directly
from the designer to the editor and copies the coordinator. Frozen source, original
reference/proof and separate lab/native/core/runtime gates remain intact. No capped
operation or new reservation is selected by this review checkpoint.

## R3 complete; corrected source awaiting exact decision, 2026-11-06

All three authorized rounds are complete, with no fourth review/rescore selected.
R3 reviewed `0263728d`: Sol reports 9/10 with no must-fix; Opus reports 8.5/10,
describes the captured UI as 9-level and conditions a 9 on fixing inline-error
placement outside plain fields. That conditional result is not an actual score
for the subsequent correction. Prior scores keep their original source bindings.

The designer applied the small placement correction and checked action-message
scrolling and compact stale-title scrolling. Current unapproved source is
`37d29ca180dc81cb350ff8ff99bfaee90e65cea9`, fingerprint
`fadc5fa2591ac31edec149b871505fcfa20c54b26e622d44e60a74b0b8ee0c80`.
It is not independently rescored. The designer reports clean TypeScript/standalone
compilation, sixteen synthetic groups at both 1280/560 dark with innerHeight 800,
and thirteen fresh renders with empty console messages. These are not native,
trusted-input, real core/runtime or full design:check passes.

The designer's FINAL-REFINEMENT record and `a2-final-source-receipt.json` own the
exact capture/input receipts in its worktree. Parent read-only inspection confirms
the source commit exists and production/shared source paths are unchanged from
original `0a6e571e`. An independent artifact audit matched all thirteen PNG hashes
and dimensions, eleven distinct recorded input hashes, and the annotation hash and
1600x1296 dimensions. The audited receipt snapshot hashes to
`c706435571c6235cad8118e3cfd317c9a82750c3a80ae6d3dba7e0b27e315562`.
Its approval remains null. This audit did not rerun the synthetic checks, recompute
the source fingerprint or judge the design.

The explanatory `annotated-a2-final.png` hashes to
`2e94b5051dedb302dfbd0227533b340ea9aa51754f272c830b73c0a8494c2d14`.
It is explicitly not an approval capture. Known capture limitation: compact stale
footer commit buttons are partly clipped at the captured scroll position while the
page remains scrollable. Restored action values can also retain Unsaved wording
until a no-op Apply, with no history entry. Keep these facts visible to Kris and
the implementation handoff; do not silently infer acceptance or a new fix scope.

The designer is presenting exact `inspector-v2` / `37d29ca1` to Kris. There is no
approved production handoff. After exact approval, the designer must deliver the
approved source/fingerprint/captures and decision evidence directly to the editor,
copying the coordinator. Original source, shared contracts and production stay
unchanged. No additional council, server or capped start is selected.

## Exact A2 approval and implementation handoff, 2026-11-06

Parent verified Kris's explicit "Approved" message
`961cbbd1-c3ac-4195-908a-8c320598fc66`, design-chat position 978, immediately after
the runnable `inspector-v2` / `37d29ca1` candidate and annotated comparison. The
designer recorded approval in `9e656759f048addd582d3a8669990400a15907f9` and sent
the approved handoff directly to the frontend owner before copying the coordinator.
The frontend owner confirmed receipt and began approved UI/core red-green slices
from clean `b23bbcc9`. No new implementation authorization was requested.

Parent imported only the new bars-imagebuttons lab directory, its new design
records/captures and the two-hunk registry registration from that record commit.
Production and shared contracts were not copied from the old design base. A direct
approval-schema/source audit recomputed the source fingerprint at
`37d29ca180dc81cb350ff8ff99bfaee90e65cea9` as
`fadc5fa2591ac31edec149b871505fcfa20c54b26e622d44e60a74b0b8ee0c80`, verified the
canonical approved pointer and rehashed all thirteen approved captures. The imported
lab passes TypeScript module checking with the current coordinator DTOs.

The coordinator owns this scoped import, shared contracts, combined evidence/harness,
integration and final review. The frontend worker owns its assigned production
files/tests, uses the implement skill and commits its changes. It was told not to
duplicate lab/registry/record imports. Approved source stays pinned in the designer
worktree; visual comparisons preserve innerHeight 800 versus captureHeight 820,
widths 1280/560, dark mode, scale 1 and the disclosed compact-stale scroll state.

Approval does not establish product acceptance or waive the global gate. Catalog
inventory finds five exact approved source objects missing locally: Help A4
`8851689b62eda03127c199ca0276a776b0d623ab`, nested layout
`b2fffee2a3983ff309c27502fdfc215f56b1ccd0`, project font
`79d958d5c45dfd12073c2192de05128d6ed19a91`, screen interactions
`7090a036032ce3f225a857b30259a9c91716ac60` and UI image
`8b960282255834972c81ff7d1d13f09293fb366e`. Existing approval records are preserved.
The Mac qualification chat owns a bounded read/export of existing source/recovery
refs, with no SDK, build, installation or source synchronization. The documented
PR79 recovery bundle is the first exact-source lead. A read-only legacy Windows
repository check found neither Help nor interaction object and preserved its
unrelated active changes. Full catalog/browser verification remains pending.
