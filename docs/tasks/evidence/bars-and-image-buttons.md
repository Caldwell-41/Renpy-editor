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

The Mac recovery inventory confirms all five source objects. Its combined bundle
contains 29 commits across five existing refs, is 909568 bytes and hashes to
`20d77bcd3eb2cd4d78632262cabc173443d13c4a9928c54042db9ba2d889e5ce`.
Git bundle verification passes. The first Help-only bundle is retained separately;
the combined bundle excludes the accepted baseline's history and has five known
prerequisites, all ancestors of `ab19b786`. Source/approval records, existing refs
and Mac worktree remain unchanged. No payload has been transferred.

Automatic approval review rejected the proposed small private-bundle byte export
through T3 and its retry because that exact sensitive payload/destination lacked
explicit authorization. The linked host is reachable; this is a transfer-permission
block, not host failure. The coordinator stopped the transfer operation, retained
the rejection locally and asked Kris to authorize task-scoped private transfers,
this recovery bundle only, or keep transfers blocked. No alternative export,
server, public upload or policy bypass is selected while that answer is pending.
Frontend implementation and unaffected local checks continue. Tracked-source
repository validation passes 1795 files after the scoped lab import.

The frontend owner reports real UI-to-core creation slices green for both controls:
canonical bar strings, actual image asset/hash selection, Transform displayed size
and Finish, one Apply/Undo/Redo transaction and an unchanged opaque neighbor.
Refused size-edit focus/draft retention and remount coverage remain in progress.
A hung DOM-object assertion-formatting run was canceled; the owner reports driver
exit and fixture cleanup. It is not a pass. A boolean focus assertion exposed a
happy-dom property/attribute mismatch under correction; no native behavior is
inferred from that harness issue. No SDK/helper/native start was made.

## Authorized private recovery and source catalog restored, 2026-11-06

Kris explicitly authorized task-scoped private, hash-verified T3 transfers after
the recorded automatic-review refusal. This covers the existing recovery bundle
and committed #51/#52 qualification candidates between the linked Mac and Windows,
with no public upload or server. The earlier refusal remains historical evidence;
it no longer blocks this exact authorized route.

The first 4096-byte probe passed byte and SHA256 verification. The Mac then emitted
28 machine-readable chunks through existing T3 command-execution results. The
coordinator parsed the results directly, verified every chunk hash and contiguous
offset, and reassembled exactly 909568 bytes. The complete bundle SHA256 matches
the previously recorded source receipt and `git bundle verify` passes. All 28
activity results were complete, with no truncation. Ignored transfer receipts
retain the exact machine payload identities and full hash.

The five bundle refs were fetched only into the new owned namespace
`refs/recovery/51-52-design-catalog/`. Existing refs, approval records and checkout
files were preserved. All five previously absent commits now resolve. The actual
`loadApprovalRecords` gate passes all 25 records and 12 approved revisions, checking
historical source fingerprints and retained captures. This clears the missing-object
blocker. The full lab browser gate, current production fidelity and functional
acceptance remain separate and pending. No capped operation was started.

The frontend owner subsequently reports real UI/core coverage for canonical bar
bounds, real picker references, six-state Transform/action/layout writes, action
focus, missing assets, layout-only revision capture, no-op/history, keyboard sizing
and reopen. A five-second UI settle expired while real compose took 4.811 seconds
plus target refresh; it is not a passing run or a performance qualification.
The owner aligned the bound with the existing fifteen-second transport and then
found a delayed-authoring admission lock defect. Preparation reservation is under
focused verification. Draft-copy/recovery, visual checks and final review remain.

## Global lab gate failed at compact removal confirmation, 2026-11-06

Terra 6.1 max ran `npm run design:check` at exact integration head
`195fcd831fd0a8202428e255be9a46a08589fa10` in its isolated clean test worktree.
Pinned Node 24.19.0/npm 11.9.0 and Chrome 157.0.8103.38 were used; offline dependency
installation passed. Synthetic approval tests passed. The browser run completed
616 render cases and 15 groups, then failed the existing Help composition popup
assertion at a 560x640 viewport. Opening removal confirmation changed one measured
content width from 463 to 448 px; other reported geometry and scroll values were
unchanged. Cause remains unestablished. Browser approval-protection checks later
in the runner were not reached and are not passes.

The retained report SHA256 is
`9aa6ac7e1bdedceab9f4004380fa32363c7534e5d38b32598b26a5f78a69636e`;
the full log hashes to
`d360ebf446d66f56232fdf9f066c5131a7370f3c4fd3ae7871ce75914cce5c9b`.
The screenshot manifest contains 278 images and hashes to
`a013d9f367328335a4e47f0e8f7e148ee969b9e387d8d52cb3919c3676b76b3a`.
The compact confirmation capture occurs after the failed assertion and was not
produced. Exact ignored artifacts remain in the test worktree. Its Git status is
clean, observed runner/Chrome processes exited and no listener remained owned by
their process IDs. No SDK/helper/package/native start occurred. The coordinator
owns the focused reproduction and any correction; approved sources remain pinned.

## Frontend implementation and review corrections underway, 2026-11-06

The frontend owner committed nine assigned files at
`87586e7cbe21bc56fc486115ff355dac72e99c35`, without shared DTO, Rust or document
changes. It reports typecheck and production build passing, all 378 frontend tests
passing with zero skips, and an actual ScreensWorkspace-to-core journey covering
both control writes, picker references, six Transform appearances/actions/layout,
history/no-op, keyboard edits, validation/focus, missing assets, captured catalog
revision, delayed admission reservation, reopen and Source-removed draft recovery.
The first full wrapper failed while handling an npm stderr notice; the corrected
wrapper preserved stderr/exit status and passed. Earlier failed runs remain failed.

Its independent Standards reviewer found three P2 documented breaches: shared
image-button component review omitted dimensions; picker callback redrew/focused
before closing its modal; new numeric/bound/color fields lacked blur validation
and cleared errors on unrelated typing. The owner accepted all three and owns the
focused actual UI/core regressions and corrections, using the existing input
validation owner. No replacement review was started. Spec and Terra visual work
remain pending. This is a worker-candidate receipt, not combined integration or
final acceptance; await corrected commits and the final handoff before integration.

## Compact popup gutter diagnosed; correction awaiting verification, 2026-11-06

The focused compact reproduction failed twice with identical geometry at
`c8f707c441d50ba8dcd4511526050ea2b7cf72ca`. The editor retained a 463 px outer
width, but its client width and child content narrowed to 448 px. Three subsequent
controlled probes used the same Node and Chrome versions. Baseline failed and
remained narrowed after two animation frames. Adding only `has-removal-dialog`
without opening a dialog also failed identically. Changing only the editor's
scrollbar gutter to `auto` in the disposable page preserved all geometry and passed.
The helper reported zero page errors; browser console errors were not collected.

Computed styles establish the cause in this browser: compact layout has
`overflow: visible`, so its stable gutter reserves no space. Confirmation changes
overflow to `hidden`, reserving a new 15 px gutter inside the same outer width.
The already-scrolling outer content has a stable gutter before and after and does
not move. This excludes dialog placement and transient focus timing for this repro.
Parent correction sets the compact editor's gutter to `auto` at the existing 759 px
compact breakpoint. The existing exact popup geometry assertions remain unchanged.
Approved historical source stays pinned; this corrects the current lab renderer.

Baseline, class-only and gutter-auto helpers took 46652, 45944 and 45957 ms and
exited 1, 1 and 0 respectively. The initial missing-Vite preflight stopped before
browser launch and was resolved by the authorized offline dependency install.
Independent process-command-line inspection was denied; the helper requests browser
and server closure in `finally`, but this probe does not establish independently
verified cleanup. No capped operations were started. Focused and full global checks
on the committed correction remain pending; the earlier full-gate result stays failed.

The frontend owner committed the three Standards corrections at
`c3755e8c4689c3945ddfad0882f1a676560a40a8`. Each actual-core review mode first
reproduced its finding red, then passed. Typecheck/build and 57 affected tests pass.
The eight-stage original actual UI/core journey also passes at this correction,
including delayed admission, keyboard sizing and Source-removed recovery. Parent
reread its retained result and matched SHA256
`de04dfd21ce96d9c9bedcbe63916e51422a4d10f2e80fdc756e7598c20cdfe32`.
It reports `passed: true`, real controller/core, no SDK/helper execution, driver
exit 0 and cleanup complete. The full 378-test pass retains the original `87586e7c`
basis. Exactly three Standards findings are corrected and self-verified, with no
independent clearance inferred. Original Spec/Terra reviews remain pending at
`87586e7c`; their pinned export artifacts and approved source remain unchanged.

The original Spec review completed at `87586e7c` with three P2 findings: Normal
replacement dimensions later reverting to the old catalog ratio; pending additions
becoming unrecoverable when their screen disappears; and changed-image Escape
retaining the reference picker/focus. The frontend owner accepted all three, notes
that the last overlaps its existing cleanup correction, and owns explicit focused
regressions and fixes. Original Terra review at `87586e7c` also identified three
material inspector differences: hidden invalid-field feedback, missing active-state
visual/ARIA indication, and less dense navigation/row spacing than approved A2.
The owner will correct these against the pinned reference, then start exactly one
new read-only Terra 6.1 max visual recheck on committed fixes. No Standards/Spec
redo or council is selected. Counts stay three Standards plus three Spec findings;
corrections remain self-verified unless actual independent evidence says otherwise.

## Gutter fix passes; full lab runner complete with exit-receipt limit, 2026-11-06

At `d2c909ff40413671569233ff8d98e17e22d45ccf`, the focused baseline exits 0 without
injected corrective style. Geometry remains identical before, immediately after
confirmation and after two animation frames; editor/client/content width stays
463 px. The existing global runner then reports 1568 render cases, 30 groups and
12 approval checks complete, with zero report errors. Parent independently reread
the report and matched SHA256
`ef20d781cd6909c00a8326fc77f72af6094fb2d8df0d8076c5b69c3f852969ba`.
All 12 approved references correctly refuse changed-source rendering. This proves
the current-source draft matrix and approval protections; it does not establish
historical visual fidelity, real saves or native/trusted input.

The PowerShell wrapper did not retain the npm exit code. Do not invent exit 0 or
erase that command-receipt gap despite the completed runner output. The npm stderr
contains an update notice. Parent's new ignored direct-process wrapper captures
separate stdout/stderr plus the actual exit code without PowerShell stderr handling;
its deliberate exit-0 and exit-7 checks both pass with stderr retained. Use that
wrapper on the changed combined candidate. No duplicate unchanged full matrix is
selected solely to repair this receipt.

The focused stdout hashes to
`4bd16b0050131c8b92d1de945e30f942257ab529f7cd75dbe72afe03037c2bba`;
full stdout hashes to
`043b06af0d9b039c6c3cf8c9f12d4b5f4c77542553d3a0875ddd0c06c8856bf2`;
stderr hashes to
`509db3e3576a5ddeede99380db64011156c8602eb204903675e7cb44eae64ef7`.
The 303-image screenshot manifest hashes to
`1da6ae3a7fdc03b34630ca46154524090fa5c4a63ea871474efb8a0290bc14cb`.
Exact artifacts remain ignored in the verification worktree. The worker reports
observed browser/server PIDs and the loopback listener gone; parent reread its
cleanup receipt. Tracked source is clean, with no capped operation started.

## Frontend integration and combined proof, 2026-11-06

All five frontend worker commits are integrated in order: `87586e7c` to `088ee93d`,
`c3755e8c` to `ece39723`, `ce2fecb0` to `e86feac4`, `4d02bfa6` to `db85ded8`, and
`c0bd7df3` to `2fd43b31`. Worker checkout is clean at `c0bd7df3`; ownership returns
to the coordinator. Ten assigned production/test/export files changed, with no
worker changes to shared DTOs, Rust, lab, registry or documentation.

Original frontend Standards review has three P2 findings, corrected at `c3755e8c`:
component dimension summaries include affected screens; pickers close before redraw
and focus; numeric/bound/color fields use blur/IME validation and retain owning errors.
Original Spec review has three P2 findings: replacement-image aspect uses captured
reviewed dimensions; additions recover when their screen disappears; changed-image
Escape closes the picker and restores focus. Corrections are self-verified through
the five actual-core review modes. No independent clearance or rescore is claimed.
No further Standards/Spec or council task is selected.

At parent candidate `db85ded8ad49df9c09bb6041190c6fbe4184f08f`, full `npm test`
passes 378/378 with zero skips and exit 0. Build and typecheck pass. An initial
typecheck attempt failed writing owner-created ignored output as the sandbox user;
the owner-context rerun passes without ACL or system-policy changes. The real-core
driver builds with locked/offline dependencies; binary SHA256 is
`b064532e683868b5e82f037fa485fa1dd6136e85c4c4e2a21da232ff537f3c6c`.
The actual ScreensWorkspace/core journey passes all eight groups, plus field,
picker, component, addition and replacement review modes. All six driver exits are
0 and cleanup is complete. Frame/status calls are intercepted; actual canvasPlan,
transactions, source, history and reopen cross the real core. Aggregate receipt:
`app/target/controls-51-52/combined-ui-core-db85ded8/result.json`, SHA256
`e16ac6df068f307165dd0e67c1657eb2b0765085a113a8e2be26c2914fa35b2a`.
Rust formatting and tracked-source validation pass on that candidate. Two pre-existing
untracked recovery-receipt newline failures remain outside the tracked-source result.

The one authorized Terra recheck at `4d02bfa6` verifies all thirteen approved hashes,
first-error visibility, active sample ARIA/visual feedback and compact section access.
It finds desktop Apply y764-800 against an editor clip ending at774. Worker correction
`c0bd7df3` uses available flex/grid height, bounded card rows and independent canvas
scrolling. Parent rendered the integrated correction at `2fd43b31` against the pinned
A2 conditions: dark, width1280, innerHeight800, content/PNG820, scale1. Button and bar
dirty Apply bounds are y690-726 with clip732. Invalid Apply bounds are y670-706 with
clip712. All three controls are enabled and fully visible; 27/27 hit samples pass.
Exact HTML, three PNGs and receipts are retained under ignored
`.toolchains/51-52/footer-proof-2fd43b31/`; receipt SHA256
`3fe57d68b79a0e77b247b02404c1862290134e75daded6a009ebd4d937f17cb8`.
This is parent verification, not an independent re-review or historical pixel-fidelity
claim. The art/canvas fixture differs from the mock and its helper is offline. C0's
desktop-only CSS leaves the earlier compact proof's scope unchanged.

## Packaged control probe preparation and review corrections, 2026-11-06

Coordinator review found two small contract/harness corrections: actual core inspection
serializes `replacementSha256:null`, so the optional TypeScript field now also admits
null; and duplicate `main` headers in `qualify-screen-controls.py` shadowed its Python
version guard. The guard now executes. Typecheck and the ten ordinary/four retained
source-admission checks pass, as does the real export-admission CLI. No SDK rerun is
claimed or needed for the CLI guard correction alone.

The existing optional packaged runner now accepts `screen-controls`, reusing its
disposable UI-image fixture, normal authoring-variable operation and source/disk/cleanup
checks. It adds no IPC operation or general renderer authority. The exact injected
probe creates a bar and six-state image button, uses real picker references, checks
invalid raw input and Cancel, keyboard combined sizing, one-step history, a protected
Source neighbor, inert state samples and stable identities/references after reopen.
Native report admission requires all six stages and the accepted source/reference
details. Fifteen focused evidence/runner tests pass; desktop `cargo check` passes
with three existing unused-code warnings. Build and Rust formatting pass.

Before any package/native start, the exact probe is rehearsed in full production UI
against the actual core. SDK frame/status requests are intercepted. Failed
control rehearsals remain failed: the first obsolete-creation caption failure is
archived separately; subsequent runs exposed premature history and Source-navigation
acknowledgements in the probe. The source-conflict gate correctly refused a compose
issued before fresh inspection. The corrected probe waits for the new DOM instance,
then `native-probe-rehearsal-06` passes all six stages plus complete, with zero page
errors, driver exit0 and cleanup complete. Its receipt SHA256 is
`15edaf35d70567ccf723fe861942a7cd9a9bfd25bd4258510cfeec65534e0e6d`.
The existing image probe also passes after migrating its obsolete screen-creation
control; receipt SHA256
`d9c54c32135fcb517747adaafe5e44842f298187a2f6d138f6bdb173410c3967`.
These are Chromium rehearsals, not packaged-WebView or trusted-input results.

No SDK/helper/package/native start or reservation is added. Windows remains SDK12/16,
helpers0/4, packages0/2, native0/3; Mac all zero. Mac is reachable and its private
incoming-message transfer route is byte-verified, but the final candidate still needs
delivery and a coordinator reservation. The old partial `db85ded8` transfer probe is
not a final-candidate import. Next: freeze these corrections, run the combined global
lab check with actual exit capture, then complete selected platform proof and final
criterion review. No extra review delegate, council or code publication is selected.

## Coherent package, Mac transfer and retained failures, 2026-11-06

Coordinator preparation is committed at `5190d29c1e0a971d7a469a7d2dca4daeaad947fd`.
Tracked-source validation passes 1803 files. The Windows NSIS package command exits0
in352.141s. Retained executable SHA256 is
`fb61dd08edb3806e66d059c294a357aeeb908b17a798001a6b87bd28c69d6649`;
installer SHA256 is
`6f2f149b0cb916ea17c5c12be8dfd0d32bcbfb16414fb8ffd1205628e1f1b5da`.
Both artifacts and separate process logs remain under ignored
`app/target/controls-51-52/package-5190d29c/`. This consumes package1/2.

The exact control probe also passes at the packaged window's1100x720 size using
an ignored copy differing only in viewport/import path. An unlocked Default input
desktop, no unrelated Loomlight instance and the retained executable hash were
verified before the reserved native launch. The actual packaged-WebView attempt
FAILED in41.219s after bar acceptance while waiting for Undo. No image-button stage
was reached. Result SHA256 is
`444c96bbbb0486712346410ce2c713d97efc96b80ed1a575240cb7df55e71aed`.
Its accepted source is retained; source disk comparison is false because the probe
failed before producing its terminal expected source. Scratch, bytecode and saves
checks are clean, and fixture/process cleanup completed. This consumes native1/3;
it is not a native pass or evidence of image-button behavior.

The probe's readiness condition is tightened to require editable Width after the
No pending changes message, and failures now retain observed history source and
toolbar state. A delayed-target-refresh full UI/core rehearsal passes, receipt
SHA256 `2520217a4bd4f0362f611e0df4a1759b2e9d0354f689199d32e6e6dd3172b8f8`.
The shorter-deadline diagnostic failed later, after its bar/history stage, and does
not reproduce the exact first native failure. The timing diagnosis remains provisional
until the corrected native attempt. No production guard was weakened.

The final global lab command at5190 exits1 in701.375s, after968 rendering cases and
19 interaction groups, with zero approval-protection cases reached. Its font refined
check presses Escape from a populated native search field, which clears the query
without dismissing the picker; the next outside click is correctly blocked by the
modal. Event traces show no second cancel event when search owns focus, and show
cancel/close after another Escape or after focusing Cancel. A focus-only animation
acknowledgement does not fix it. The corrected check focuses the picker Cancel
control before testing Escape dismissal and awaits closure. The complete existing
refined-font interaction check then passes. Prototype/approved source is unchanged.
Trace receipt SHA256:
`de5920eac6900d4ddc2e331df33f1dedc005d69c8f13aa6202d22d4368146cc3`;
focused corrected receipt SHA256:
`9e8e7b1ca9c3f9df89889facbdf1f355add652a2a2925294bd28e17644729ad5`.
The failed full report and actual exit/log receipts remain under
`app/target/controls-51-52/design-check-5190d29c/`; its exit1 is not relabeled.

The authorized message route delivered all40 machine-generated packets of the
1292845-byte candidate/design-history bundle, full SHA256
`18041e4ece2a858ca7fb66a7ced5600b784c740b25e6a34456a2d509b10fdb0e`.
Each offset/length/chunk hash and complete bundle/Git verification pass on Mac.
Only two absent refs in the qualification namespace were imported. The isolated
checkout is clean on `t3/mac-bars-imagebuttons-candidate-5190`; the original branch
stays at1c6ed025. Its offline dependency install,15 native evidence/runner tests,
10 source-admission tests, typecheck/build and all13 approved reference hashes pass.
Source preparation/validation binds15 files and12 plans, with cleanup and no engine.
An initial output-path refusal before export is retained. A proposed upload-server
route was rejected by automatic approval review; no upload occurred. The already
authorized private message route completed instead, without broadening access.

#51 reserves seven Mac SDK starts at5190: version/compile/lint plus normal Story
and deliberate fixture preview at both aspects. The top-level Mac run owns execution
and must return actual counts/failures/cleanup before another reservation. No Mac
helper/package/native start is reserved. Windows remains SDK12/16, helper0/4,
package1/2, native1/3 with no pending Windows reservation at this checkpoint.

## Controls helper proof prepared, 2026-11-06

The new ignored core test consumes a retained, hash-admitted public-core manifest,
restores only its fresh disposable fixture, and requests all12 accepted plans from
one helper owner. It retains PNGs/geometry, input/binary/renderer identities, actual
SDK/helper counters and cooperative shutdown. A canonical-path assertion bounds
the disposable game replacement before deletion. Compilation passes without SDK
execution. The passive `validate-helper` command checks lifecycle/source bindings,
both aspects,320x24 bar and160x80 image-button geometry, and full RGBA state crops
against all six admitted bitmaps. It rejects cached pixels even when their file
hash is updated. Twenty-four focused source/helper/native evidence tests pass;
their synthetic PNGs establish admission behavior only. No helper or additional
SDK start is consumed by preparation. The original accepted-source/runtime
candidates retain their exact scopes; no current-head runtime pass is invented.

## Safe stop and continuation checkpoint, 2026-11-06

Kris explicitly requested safely stopping and a handoff prompt for a new agent.
Implementation candidate is3b66300218955e9f7337a29a0a407e8ce689bc1d. No further
implementation, test, SDK, helper, package or native start follows that request.
Only receipt inspection, owned cleanup and status/handoff writing continued.

Windows package2 PASSES at 3b in 97.109 s, exit 0. Executable SHA256:
`d038cf220bdb7ca69fd4824f40ff7440a060b856899f80015f443ed78f3ab58e`;
NSIS installer SHA256:
`87ada15f81690525c15cb1398d9598aa6442b9f117e1f80515f006e4fbd69578`.
Package receipt SHA256:
`f1a1e1e2f1c7933b585ef415286ee202918707fc8f9b91a5fdb7b4d2700b42eb`.
Its attempted native launcher was not created because the sandbox user could not
write the owner-created ignored directory. PowerShell then refused the missing
script before the executable started. This is a pre-launch environment refusal,
not native attempt2. The corrected package has NOT been launched natively. The
native reservation is released. No ACL/security change or stale-binary launch.

The helper core test at 3b PASSES its production-render/lifecycle/source assertions:
twelve frames, SDK validation processes3, helper start1/return1, source/authoring
metadata unchanged, cooperative exit 0 and cleanup true. It completes in 214.75 s.
The passive full-RGBA consumer FAILS with `helper state pixels differ from the
admitted bitmap at displayed size`. Overall wrapper result is FAILED, exit 1;
the Rust exit 0 does not qualify the combined evidence. Cause is unestablished and
no correction was attempted after the stop request. Retained output is
`app/target/controls-51-52/helper-3b663002/`, including all twelve PNGs and geometry.
Wrapper result SHA256:
`af74491376b5a2c4729dda23e68479eb9add1721ca125ab1375f6989a228d82b`;
frame/source/lifecycle result SHA256:
`fecd7fe891b59a10704403ac1d2e8e78d79a76b54d373e33421651fa219f65d5`.
The retained test binary SHA256 is
`14226f38625fd5e4ca33ee6b5b767e9ddd38a455cd88aa675b593826c626a91f`.
Accepted-source producer remains fe78025f with manifest04ee4aeb...; direct core
diff since that producer contains only the new helper test and module registration.
The next useful action is passive inspection of these retained frames and their
admitted bitmap/geometry references. Do not start another SDK for diagnosis first.

The global lab3b rerun was CANCELLED at the user's request, after 511.188 s, with
actual exit 1. Its last output had completed the Screens journey groups; there is
no final current-run report or global pass. Stdout SHA256:
`8d2cc8d3f45b1d3b53380bfefec1a934d3d725855684e367d6fd2f6705137626`.
The verified checker PID41520 and its eight owned Chrome descendants were stopped;
all nine PIDs were subsequently confirmed gone. The npm/wrapper exited and retained
its cancellation receipt. Unrelated Node/tool runtimes were preserved. No Loomlight
or Ren'Py process remains. Cleanup proof is
`app/target/controls-51-52/stop-3b663002/lab-stop.json`. The shared
`.toolchains/design-lab/report.json` still belongs to the5190 font-check failure;
it must not be relabeled as3b proof.

Mac SDK qualification PASSES at exact5190d29c1e0a971d7a469a7d2dca4daeaad947fd.
Version, compile, lint and four normal/fixture-preview cases exit 0. Per-case bar
observations are0/-5/15/keyboard14; six state comparisons, SetVariable/Hide/Return,
final7, one continuation and inert samples pass. All forty-eight PNGs verify.
Manifest SHA256:
`105297a727a328f4a1380d46ddc2ca71122f56dcaa4e3c94c7ecec96194ab645`;
result SHA256:
`e46d545ef292b01f114f84fb731c8e4ef224f4c73c321fb3f637bcb2d05d796f`;
capture receipt SHA256:
`14c752be24b08e85a4caba4002447194b1d5dd9eaab1eeec35ffe7bf63e8edde`.
All seven PIDs46010/46024/46033/46042/46062/46074/46092 exited0 and are gone;
source/process/scratch cleanup passes. These results keep exact5190 basis and do
not establish physical input or naturally selected/disabled conditions.

Mac pause receipt confirms clean branch `t3/mac-bars-imagebuttons-candidate-5190`
at 5190, original1c6ed025 branch preserved, no active owned checks/apps and no
reservations. The13652-byte3b delta, SHA256
`f0669b3a08d46543b04c1827269fe65a9f2e8fe305b38297dcc1f51e8e3cc079`,
passes byte/hash/Git verification but is NOT imported or fast-forwarded. Delta
helper compilation and passive checks are NOT started. Its local receipt is under
`.toolchains/incoming-3b663002-delta/pause-receipt.json` in the existing isolated
Mac worktree. The owning Mac chat is recorded in HANDOVER; no new chat is selected.

Final cumulative counts, owned only by#51: Windows SDK 16/16, helper 1/4,
package 2/2, native 1/3. SDK16 includes fifteen validation/game processes plus the
one hidden helper. Mac SDK 7/16, helper 0/4, package 0/2, native 0/3. Zero uncertain
starts and ZERO reservations. Unused Windows native reservation released; Mac's
seven-start reservation is completely consumed/resolved. Do not exceed Windows
SDK/package ceilings without explicit user permission. Both issue bodies now
record the paused state and unresolved gates. No ticket closure, push, PR, merge,
public upload, signing/trust change or code publication occurred.

## Continuation and passive helper diagnosis, 2026-11-06

Kris selected continuation on the existing clean integration branch at3d8d2411.
That commit retires the full-gallery gate. The historical failures and cancellation
above remain recorded; no replacement sweep or completed review panel is selected.
Live #51/#52 requirements and cumulative counts were read through the GitHub
connector after the CLI returned HTTP401. #51 owns the resumed reservations.

The corrected retained Windows3b package PASSES native attempt2 in65.437s, exit0.
All six control stages pass, including picker focus, invalid input/Cancel, numeric
keyboard sizing, one-step history, opaque Source neighbors and reopen. Source/disk
equality and fixture/process cleanup pass. The executable keeps SHA256
`d038cf220bdb7ca69fd4824f40ff7440a060b856899f80015f443ed78f3ab58e`.
Result `app/target/controls-51-52/native-3b663002-resume/runtime-ui-screen-controls.json`
has SHA256 `8ebdb889585b876bb49f825d40f0a976c5637dadb90861a340ddd392d22553cc`.
The initial launcher write was refused before executable start; the owner-context
write/run succeeded without ACL changes. This consumes only native2, with no new
SDK or package start. Input is synthetic in the packaged WebView, not physical.

The original passive helper command reproduces its state-pixel failure without
an SDK. All twelve retained160x80 crops have correct geometry and distinct states.
Every RGBA channel is one byte lower than the raw PNG: normal220/40/40/255 becomes
219/39/39/254. Both helper aspects have identical state pixels. All six1280x720
independent native runtime references match the helper exactly. The1024x768 native
references have12561 matching interior pixels,238 partially covered edge pixels
and one corner pixel, while the helper is uniform at recorded physical1024x768,
drawPerVirtual1. The old runtime observer records no physical/scale metadata.
This demonstrates an invalid raw-asset comparison and an unmatched capture basis;
it does not establish a product-renderer defect or qualify the full helper matrix.
The failed wrapper and all original artifacts remain unchanged.

The corrected passive consumer requires independent whole-frame native references,
their result hash, accepted manifest, backend, physical dimensions and drawing
scale. It still compares every RGBA byte without tolerance. A new reference-only
fixture copies only admitted images into a disposable project; it imports no game
scripts, canvas plan or product renderer. Its explicit command uses one reserved
SDK process for both aspects and all six literal images. Offline admission tests
pass5/5, including source-minus-one native readback, a single changed alpha byte,
wrong scale/backend/source and incomplete lifecycle. SDK execution of this new
reference remains pending. Windows SDK/package ceilings stay closed.

Selected `npm run design:check -- --approval bars-imagebuttons` PASSES at3d8d2411.
It validates actual A2 metadata/source/captures and changed-source refusal, with
zero sample sweeps, one selected approval and no errors. Temporary report:
`loomlight-design-check-cY1tNy/report.json`. The approved source37d29ca1 and thirteen
capture hashes remain pinned. No new prototype or approval is selected.

The existing Mac thread imported the verified3b delta and compiled the helper test
without execution. Its24 passive checks and20 native/runner/package checks pass.
Mac's retained native references also have uniform source-minus-one RGBA across
both aspects; all24 actual/reference pairs match, without physical/scale metadata.
One signed package and one subsequent native launch are reserved there at exact3b;
terminal results will resolve actual counts. No new Mac thread, production writer,
review panel, SDK/helper reservation or publication is selected at this checkpoint.

## Combined coordinator review and criterion reconciliation, 2026-11-06

The coordinator reviewed the integrated control contracts, source parser/patcher,
composition and history owner, reference/effect dependencies, canvas data and asset
copying, production draft lifecycle, picker/aspect behavior and packaged probe.
No additional production defect was found. The review found the helper admission
assumption described above; its correction is local at `2064460a`, with engine
qualification still pending. Original frontend findings remain Standards3/Spec3,
corrected and self-verified. The earlier Terra footer finding retains parent-only
clearance. No panel, recheck, rescore or independent clearance was added.

| Original criterion | Evidence and result |
| --- | --- |
| #51 typed integer, bounds and appearance/layout fields; missing/type-changed refusal | Public-core `control_tests.rs` covers canonical exact bounds, typed lookup, colors, stale authoring/source and missing/type-changed references without writes. Actual UI/core journey at db85ded8 covers fields, retained invalid input and combined layout. Both packaged journeys pass at 3b. |
| #51 actual limits/binding and inert marked samples | Windows observer7d199aa9/source fe78025f and Mac5190 each pass normal/fixture preview at both aspects: initial0, minimum-5, maximum15, keyboard14, final7. Source/default invariance and inert samples pass. These are engine and editor samples, not physical input or naturally selected conditions. |
| #51 Apply/Cancel, conflicts, history/reopen; unsupported values remain Source-only | Actual UI/core journey and five review modes cover one accepted transaction, no-op history, invalid/Cancel, refused/stale draft retention, keyboard, Undo/Redo and reopen. Core custom-value inspection and refusal preserve opaque regions. Packaged Windows/Mac journeys pass at 3b. |
| #51 conservative binding/effect revisions | Core effect tests prove possible assigned variable plus variable, authoring and binding source dependencies. Custom/unresolved value expressions report unknown effects. Component extraction refuses contextual bar bindings. |
| #52 all six typed appearances, shared dimensions/aspect, retained missing assets | Core reference/combined-size tests and actual UI/core journey cover six explicit states, one dimension owner, missing assets and acknowledged replacements. The replacement review verifies the chosen image's reviewed dimensions govern subsequent aspect edits. |
| #52 deliberate appearances/actions and inert marked samples | Both-host runtime matrices compare six full native appearance/reference RGBA pairs per case, observe one SetVariable/Hide/Return chain and continuation, and preserve defaults/source. Packaged probes verify inert editor samples. Full helper comparison remains pending on matched references. |
| #52 opaque neighbors and conservative state/action/reference effects | Public-core patch tests preserve inline comments/custom neighbors and no-op expression bytes. Reference/effect tests retain asset, authoring, action target and source dependencies; custom actions remain Source-only. Actual UI/core and both packaged probes preserve an opaque Source neighbor. |
| #52 numeric/keyboard, focus, Cancel, conflicts, history/reopen | Actual production controller/core journey, field/picker/addition/replacement review modes and both packaged 3b journeys pass. Shared-component dimension review lists affected screens before writing. Stale raw drafts keep their captured revision and source. |

These are bounded criterion findings, not ticket closure. Required helper proof
still prevents final acceptance. Wider #54/Phase3B, native editor Test-in-Ren'Py
routing, physical input and subjective human acceptance remain separate.

Visual finding: the integrated inspector retains A2 `inspector-v2` source37d29ca1's
continuous layout, section navigation, six appearance rows and fixed Apply/Cancel
footer. Parent proof at2fd43b31 verifies the corrected desktop footer with27/27 hit
samples. The coordinator inspected its retained button capture against the pinned
approved capture. The public-core fixture uses different image art and an offline
blank canvas; toolbar wrapping and real workspace spacing differ. This establishes
the inspector structure and footer proof, not whole-screen pixel fidelity or a new
design approval. Earlier compact coverage remains scoped to its recorded states.

Functional finding: mapped editing operations pass the retained real UI/core and
new both-target packaged journeys. The source/runtime/helper distinctions above
remain explicit. The full current repository validator still fails only the two
pre-existing untracked recovery receipts with missing final newlines. The same
validator on all1762 tracked files passes; `git diff --check` passes. No broad
frontend/core suite was repeated for this qualification-only correction.

### Both-target package/native receipts

The Mac thread's terminal 3b receipt confirms package PID70224 and native PID73460
exited0. Strict signature, approved certificate, designated requirement and DMG
contents pass. All six control stages, source/disk equality, desktop assertion
release, fixture/process cleanup and installer detachment pass. No signing,
Keychain, trust or naming policy changed. Actual starts are one package and one
native editor; an earlier redirection refusal started neither operation.

| Mac artifact at 3b663002 | SHA256 |
| --- | --- |
| Compiled helper test, not executed by this receipt | 8dfdec427f6a72de24d27b4fd06220e52c8113c01af0765865ad356c1465bd43 |
| App executable | 187f430bee05c75138c7f22e6a495a1cb65d154c390d345c5214688ec4592242 |
| App content inventory | 4f5121999d57defd471adda9e64df50c1389241cc039494af42b05ff472f5d1b |
| Signed Loomlight.dmg | 2b68b6abc181105fc371ab19d249639def602be2b38e3551d7716e1a3c8a2362 |

The remote ignored receipt is `.toolchains/qualification-3b663002/result.json` in
the existing isolated worktree. The coordinator read its terminal report from the
thread recorded in HANDOVER. SDK proof remains on exact5190; no cross-candidate
runtime pass is inferred from the package.

The selected A2 approval report is retained locally at
`app/target/controls-51-52/approval-focused-3d8d2411/report.json`, SHA256
`9ea01df8db8d0c4a197574187279a146ed492a6f3d4bdb1ed376c5c5a7b76612`.
It matches the temporary report byte-for-byte. No new review-state capture was
requested; the thirteen approved captures and earlier failures remain preserved.

### Matched reference entry correction and Windows preflight

The first Mac reference process at2064460a fails before frames with
`LabelNotFound: could not find label 'start'`. PID76290 exits1 after3.716s; process,
scratch and desktop assertion cleanup pass. No helper or retry ran under that
reservation. The remote receipt `.toolchains/qualification-2064460a/result.json`
has SHA256 `69664e27c8f43807fb998d80df742d3f03c4068f67f16046ea9cd218f6f308b1`.
This is a qualification-fixture defect and consumes one Mac SDK start, reaching8.

Correction `ed44c624643aa67bbf75f58ecb5664c8a2f3069a` adds the missing standalone
start label only. The 753-byte private delta, SHA256
`f56e2bdf2d8dcf9a7779e5ec4ec17fed3ed3c889019b632e8af0d8202fb34395`, verifies and
fast-forwards cleanly on Mac. Five passive helper checks pass. #51 replaces the
released four-start helper reservation with five SDK starts and one helper for
one corrected reference attempt followed by the unchanged helper proof if it
passes. No additional retry is selected. This remains within Mac's original limit.

The ignored Windows launcher `.toolchains/51-52/reference-windows-resume.ps1`
passes its read-only preflight without an SDK start. It verifies unchanged product
files against3b, the selected3d lab-script-only package manifest, accepted source
manifest04ee4aeb, retained frame receiptfecd7fe8 and test binary14226f38. It refuses
an existing destination. Its execution path is one reference SDK process, then
passive validation of the original twelve frames. No package build or helper
restart is needed. The Windows SDK16 ceiling remains binding; execution still
requires Kris's explicit ceiling increase and a #51 reservation.

### Mac matched helper qualification and remaining Windows decision

The Mac terminal audit PASSES at clean ed44c624 on the existing candidate branch.
Reference PID77722 exits0 in4.416s. Retained3b test PID77909 exits0 in74.561s
without recompilation. All twelve160x80 crops compare exactly, 614400 RGBA bytes
with zero residual and no normalization. Physical dimensions match at both aspects;
drawPerVirtual is2.0 and backend gl2. Source/default metadata remain unchanged.
The helper records three SDK validations, one helper start/return, cooperative
exit0 and complete cleanup. No owned processes or scratch remain; desktop
assertions are released. The original branch, failed first reference,5190 runtime,
3b signed package/native evidence and approved A2 source/captures are preserved.

| Mac receipt | SHA256 |
| --- | --- |
| Terminal `.toolchains/qualification-ed44c624/result.json` | e47d39537fb1071f7756f998c868067b0bb4487f8fe5d28588e57acbbf7479b1 |
| Corrected literal reference result | 52f36258aaec41aaa3e5c597efac431260bb279dd10743ed3b58efe64979ae64 |
| Helper result, retained3b producer/binary | 7f938974ab04fde1bda869b69d5f3231a8a3a3d3531be03bc17862023938e996 |
| Prior3b native result | 22f2c320875894de058dcef057612c0affe1b2d68467c600a41e459fb73e372c |
| Prior3b package identity | c1c00379db4159a2a6750aaf0b3ccd463e70eb561e1038188c31c3d1e25a907e |

#51 owns final cumulative actuals: Windows SDK16/16, helper1/4, package2/2,
native2/3; Mac SDK13/16, helper1/4, package1/2, native1/3. Zero uncertain starts
and zero reservations remain. The corrected Mac reservation consumed five SDK
starts and one helper. The earlier failed reference remains charged separately.
No Windows SDK/package start occurred in this continuation.

The remaining required proof is one Windows reference-only SDK process followed
by passive replay of the twelve original helper frames. Its prepared launcher
passes read-only admission. The coordinator must obtain explicit approval to raise
the exhausted Windows SDK ceiling from16 to17, then reserve that one start in#51
before execution. No package build, new helper session, broad runtime matrix or
review panel is needed for this step. Both tickets remain open. Broader native
preview routing, physical input, #54/Phase3B and human acceptance remain separate.
All code and detailed evidence are local-only; no push, PR or merge occurred.

## Approved Windows start17 and DPI admission failure, 2026-11-06

Kris explicitly replied "Yes approved" to raising the Windows SDK ceiling from16
to17 for one reference capture and passive replay. The coordinator recorded that
increase and reserved exactly one start in#51 before execution. No other ceiling
changed. The checkout was clean at2331b44b3f5b9b95bfe665a864d0e97a0a0e3cfb.

The prepared owner-context launcher ran one reference SDK process. Its single
matrix passes in5.172s, exit0, with12 PNGs, process reaped and scratch cleanup
complete. No package, helper or native editor started. Reference result:
`app/target/controls-51-52/reference-windows-2331b44b/result.json`, SHA256
`22ad5a848737240889be8e328ee9fb227a14f5319dadf4a0559a58e83ce811cd`.

Overall launcher/helper admission FAILS with `wrong helper capture conditions`.
Both physical frame dimensions match the retained helper, but the reference
records drawPerVirtual1.5 while the helper records1.0. The check remains strict.
Passive comparison independently verifies all twelve file hashes and every crop:
614400 RGBA bytes match exactly, including alpha, with zero residual. All states
retain their distinct uniform native source-minus-one colors at both aspects.
That pixel equality does not waive the capture-condition requirement. Audit:
`app/target/controls-51-52/reference-windows-2331b44b/comparison-audit.json`, SHA256
`b51e14688ff8a2a9c6346f3f6ccf293a167d897bf304d433b95b1ed34985c44a`.
The original3b helper result and failed wrapper are unchanged.

Passive inspection establishes the source of the mismatch. Production helper
launch in `app/src-core/src/renpy/runtime/canvas.rs` explicitly sets
`RENPY_HIGHDPI=1.0`. The reference producer omitted it. The pinned SDK's
`display/core.py::setup_dpi_scaling` uses that override when present; otherwise
Windows derives its scale from desktop DPI. The reference therefore used1.5.
This is a qualification-launcher omission, not a demonstrated renderer defect.

The reference producer now supplies the same per-process override, with no
production code, system DPI, security, renderer or comparison changes. A new
test enters the real reference CLI, stages the admitted images and captures the
SDK launch boundary without executing it. It fails before the fix with inherited
`RENPY_HIGHDPI=9.0` instead of1.0, then passes after the correction. It also checks
that the staged project contains only the trusted reference script and six
admitted PNGs, and that a dummy video override is removed. Initial test setup
errors at the temporary-output and input-snapshot boundaries were corrected
before the reproduced DPI failure. All six helper checks pass; no SDK was used.

#51 resolves the consumed reservation. Windows actuals are SDK17/17, helper1/4,
package2/2, native2/3. Mac remains SDK13/16, helper1/4, package1/2, native1/3.
Zero uncertain starts or reservations remain; all owned processes are stopped.
No retry ran. A corrected reference-only retry plus passive replay needs explicit
approval to raise Windows SDK17 to18 and a new #51 reservation. The existing
launcher chooses a fresh result directory from the corrected committed candidate.
Both tickets remain open. Previous allowance-decision directions are historical;
publication and wider acceptance boundaries remain unchanged.

## Root-cause correction and both-target local verification complete, 2026-11-06

Kris raised the cumulative Windows SDK ceiling to20 and explicitly selected
`principle-fix-root-causes`. The coordinator reserved one reference-only start
in#51 at e21c5331e2df7df1ab3e57a36ee5495da78c8158. The launch-boundary fault is
fixed in4ec19526: the reference now supplies the same `RENPY_HIGHDPI=1.0` setting
as the production helper. No product renderer, system setting, pixel tolerance
or capture-condition check changed. The later e21c5331 correction prints actual
helper/reference dimensions and scales on refusal, so the deciding fact appears
in the first error. Six focused checks pass, including the reproduced environment
override failure, image-only staging and mismatch diagnostics.

The pattern review found one independent whole-frame control reference producer,
used by the `reference-helper` CLI. Both aspects and every state use that same
corrected environment. The normal/fixture-preview controls observer compares its
appearance and independent reference within one engine process; it does not have
this cross-process DPI mismatch. The production helper already has one explicit
DPI owner for all canvas controls. No extra implementation or broad campaign was
needed to fix this fault.

Windows SDK start18 PASSES. Its one reference matrix exits0 in5.156s, with all
twelve PNGs, process reaped and scratch cleanup complete. The passive helper
consumer exits0 and emits `SCREEN_CONTROLS_HELPER_ADMITTED`. Every160x80 crop,
614400 RGBA bytes in total, matches exactly with zero residual. Both aspects
have matching physical dimensions and drawPerVirtual1.0 under angle2. Six states
remain distinct. The changed DPI setting removes the prior1.5-versus1.0 mismatch;
no failed artifact was rewritten or relabelled.

| Windows retained result | SHA256 |
| --- | --- |
| Reference result at e21c5331 | e7eeea563590a9f70d1c66a5f3b8afbae93891909c39f05792074a89ca50ba20 |
| Combined comparison/admission audit | 621bf3d8d5d178195e5d3ecadf59f792e5619e53fd551d42c0c0a80f1fd78b6b |
| Reference SDK log | f4e0165b8b17538948e36fe85c05954bf2dac4683ea2d37d3059e3488943e359 |
| Passive consumer source at e21c5331 | 6ee3bc378941e956bae3bf2b31bfe653c92a1694ae57b669880ee9cfbc7bdec7 |
| Original helper result at3b | fecd7fe891b59a10704403ac1d2e8e78d79a76b54d373e33421651fa219f65d5 |

New reference PNGs, input snapshot, accepted manifest, log and audit are retained
under `app/target/controls-51-52/reference-windows-e21c5331/`. The audit binds the
new reference candidate to the original3b helper result, binary and frame hashes.
It records the successful launcher exit and admission receipt. The helper was not
restarted. Original helper source/default metadata and cooperative cleanup remain
on their3b producing basis; accepted source remains fe78025f/manifest04ee4aeb.
Product source and renderer match3b unchanged. The selected3d policy changes only
Design Lab commands in package.json. Windows package/native proof retains3b;
runtime retains observer7d199aa9/source fe78025f. Mac proof retains5190 runtime,
3b package/native/helper producer and ed44c624 literal reference/consumer basis.

Final cumulative actuals, owned by#51: Windows SDK18/20, helper1/4, package2/2,
native2/3; Mac SDK13/16, helper1/4, package1/2, native1/3. Zero uncertain starts and
zero reservations remain. The two unused Windows SDK starts are not selected.
All owned checks/apps are stopped. No package build, native-editor launch or
helper restart occurred during this final reference run.

The combined review and original-criterion table above now have their remaining
Windows helper gate satisfied. Both tickets' local implementation and selected
automated qualification are complete. Prior failures remain historical failures;
the new successful admission is separate. No extra council, Standards/Spec panel,
Terra recheck, full-gallery sweep or broad frontend/core rerun occurred. The A2
approval and its thirteen captures remain unchanged. Wider #54/Phase3B, physical
input, native editor preview routing and human acceptance retain separate scopes.
Tickets stayed open at this local checkpoint because closure/publication had not
been selected. No code had been pushed or published, and no PR or merge occurred.

## Draft publication and current-head CI selection, 2026-11-06

Kris selected pushing the completed combined implementation on
`codex/51-52-integration`, creating a draft PR into
`codex/phase3b-screen-designer`, auditing current-head CI and correcting in-scope
findings in that same draft. The clean entry checkpoint is
`49f03a2fdb80dc4001e7b1c0b33772b1052d4954`. Remote base and merge-base both verify as
`ab19b7869843445dba291ee8b9ef7ea4bef5ffd8`. No branch reset or replacement team is
needed. Publication supersedes earlier local-only directions; no merge,
ready-for-review transition, issue closure or separate documentation PR is selected.

The updated `.github/validation-plan.json` selects this branch/base, ordinary
PR quality and both exact manual `quality.yml` jobs:
`Harness regressions — windows-2025` and `Harness regressions — macos-26`.
Dispatch selects only `harness_regressions=true`; other selectors retain false.
Workflow inspection confirms ordinary quality runs on PR open/synchronize/edit;
branch push alone does not trigger it. Manual harness execution runs independent
Python/Q1/source/retention groups, seals source identity and uploads both artifacts.
It performs no SDK, helper, package or native-editor launch and is inexpensive;
no new costly operation is selected. Existing cumulative counts and exhausted
Windows package capacity remain binding, with zero uncertain/reserved starts.

#51 owns the live PR and exact publication-head run/attempt/tree/job/artifact audit
receipt; #52 links to that owner. Preserve all earlier producing identities,
approved captures, ignored evidence and failed attempts. Current CI establishes
its selected automated scope only. Original native/package/runtime/helper proof
retains its recorded candidate, and broader acceptance limits remain unchanged.

Publication preparation passes all 18 coordinator tests, six focused helper
checks and validation of all 1762 tracked files. The first direct helper-check
invocation omitted its required accepted-export environment and ran zero tests;
the existing owner-context launcher supplies the manifest and passes all six.
This was a local invocation error, with no SDK start or source correction.

## Draft PR 83 publication-head audit, 2026-11-06

[Draft PR #83](https://github.com/Caldwell-41/Renpy-editor/pull/83) publishes head
`40d42a22e603840a69c2495c88955b6db8cadfe3`, tree
`40e56297511f08fcfea71afb0dedecaf291be6f7`, into the verified base above. T3 linking
and PR watcher registration succeeded. Its same-thread green event resumed the
audit; the event alone was not treated as proof. No CI findings were found.

Automatic [quality 42172803338, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42172803338/attempts/1)
and manual [harness 42172832106, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42172832106/attempts/1)
are terminal successful at that exact head. The required jobs are:

| Job | GitHub job ID | Executed successful steps |
| --- | --- | --- |
| Frontend tests and Rust formatting | 127744317622 | 16 |
| Validate repository | 127744317893 | 9 |
| Harness regressions — windows-2025 | 127744410283 | 12 |
| Harness regressions — macos-26 | 127744409910 | 12 |

All required jobs execute; no required job is skipped, cancelled or failed.
Only unselected specialist jobs and failure-only upload steps are skipped.
Both runs' reporting jobs succeed. `Loomlight validation` is successful and links
to terminal successful quality42172803338. Quality confirms 378 frontend tests,
production build, Rust formatting, 15 offline Help admission tests, 30 selected
core cases, the real Dialog UI/core/history/reopen journey, 1762 repository files,
13 section-link tests and 18 coordinator tests.

Both harness artifacts are available and downloaded. Their ZIP sizes/digests,
eleven-file manifests, candidate/tree/run/attempt/outcome, unchanged source
receipts and every one of 834 source hashes per target independently verify.
All four Python/Q1-rejection/Q1-source/retention groups pass on both targets.
Windows Python runs341 with337 passes and only four named Mac exclusions; Mac
runs337 with334 passes and only three named Windows exclusions. The existing
retention gate independently admits its exact host-specific cases.

| Retained CI input/output | SHA256 |
| --- | --- |
| Windows artifact13482240158, 51748 bytes | 1afeb0fa3180f250ec05e8e9dcb8fb0fcb6696a4ac25ef1c18ab51ebeb587cd6 |
| Mac artifact13481228542, 51542 bytes | 85d49210046341bc19b5514469f60637560d6aca2f1de221b424b3f4ccffa42e |
| Quality run log | b1fe6a6a1a534bdace304aa56d0d01d70de854a29ad38e83031cd2bd8559679a |
| Harness run log | 2c15651f53d752ac0136bc4c24f4d28010b7a9ad2d031fb64f7aba3f8e72693c |

Raw API metadata, logs, original ZIPs, source identities, group results and
`audit.json` remain in ignored `.toolchains/51-52/publication/ci-terminal-audit/`.
Successful quality does not upload its compiled test binaries; the harness jobs
compile none. No new binary/package/native identity is inferred. Existing 3b
binary hashes and Windows/Mac runtime/reference/helper receipts remain unchanged.
No SDK, helper, package or editor launch occurred; #51's cumulative counts stay
unchanged with zero uncertain/reserved starts.

The final status-only commit stays in this draft and requires its own exact-head
quality/harness/combined-status audit. #51 owns that terminal receipt, and #52
links to it; no further repository commit is needed solely to record its SHA.
The PR stays draft and both issues stay open. Merge, ready-for-review, wider
acceptance and new execution remain unselected.

## Five review corrections selected without CI, 2026-11-06

After baseline `a78de562ca02e45e5e977a75365565aaf07dc70d` passed the final
publication audit recorded in #51 and the PR, Kris explicitly requested another
two-axis review using Terra 6.1 max. The parent independently verified all five
findings. Four reproduced through actual core/UI probes; the postcommit failure
was confirmed by tracing commit completion followed by fallible inspections.

| Axis | Verified finding | Original failure |
| --- | --- | --- |
| Standards | Changed/missing image recovery | Inspection drops known typed references and the UI hides every appearance picker. |
| Standards | Committed Apply result | Reviewed replacement commits source/history, then a failed refresh can report the operation as refused. |
| Standards | Canvas property retention | A size-only control draft replaces the complete property map, dropping an accepted literal background. |
| Spec | Import revision coordination | Actual Import and use changes metadata but Apply submits the old authoring revision; Refresh retains the stale draft. |
| Spec | Passive component controls | Actual reviewed width edits and passive additions submit an empty action list that core rejects for a Component. |

Kris selected one Sol 6.1 xhigh priority agent to apply
`principle-fix-root-causes` and `mattpocock-skills:tdd`. The public core IPC
(`screens.inspect`, `screens.compose`, `screens.canvasPlan`, source/history) and
actual Screens UI connected to core are explicitly confirmed seams. Each slice
must reproduce its failure before its smallest owner correction and passing test.
The existing durable filesystem hook can reproduce the postcommit error at the
public operation boundary. Keep unrelated changes, stale requests, unavailable
render/apply media, deliberate clears and effectful Component actions protected.

The agent owns implementation/tests only. The parent independently audits the
fixes against the original bugs and then updates this same draft. Kris explicitly
said not to run CI. The publication commit will use `[skip ci]`; no manual CI,
workflow/plan change or successful status is selected. The changed head has no
current CI qualification. Prior exact-head runs and native/package/runtime/helper
evidence remain on their recorded sources and binaries. Routine local compilation
and focused tests are selected; no SDK/helper/package/native start is selected,
and #51's cumulative counts and zero reservations remain unchanged.

The original reproduction receipts remain in ignored
`.toolchains/51-52/publication/`: `review-proof-9089c81f361c4892a941bb6f4573493b/`,
`review-import-proof/` and `review-component-proof/`. Their green scripts assert
the original bugs and are not evidence of corrections. Independent fixed-behavior
parent probes are prepared separately; their results remain pending.

## Five review corrections and parent audit complete, 2026-11-06

All five findings are corrected in the existing owners. The sole Sol 6.1 xhigh
priority implementation agent completed one red/green slice before the next and
left its changes uncommitted for parent review. The parent inspected the complete
diff and independently checked each original failure; no additional correction
was needed during that audit. The selected scope restores approved behavior and
does not change the design, signing policy or execution boundary.

| Original bug | Root correction | Parent verification |
| --- | --- | --- |
| Unavailable image hides pickers | Inspection resolves known IDs/hashes from metadata; render/Apply still validate current media, and unresolved effects remain unknown. | Original changed/missing-image IPC sequence now retains the reference. Fresh core coverage checks all six states, both failure conditions and refused writes/rendering. |
| Apply fails after committing | Accepted asset metadata and authoring revisions project into the returned documents before the transaction; postcommit disk inspection is removed. | Fresh deterministic durable-hook test passes after the recorded original SOURCE_CONFLICT red. Returned documents equal later inspection, and one Undo/Redo restores source and metadata together. |
| Draft drops accepted properties | The existing control owner replaces only control/numeric fields, retaining unrelated accepted properties and removing deliberate clears. | Original literal background remains in the provisional plan with source unchanged. Fresh core tests cover both control kinds, padding and cleared color/state/position overrides. |
| Own import stales the draft | Optional captured import revision yields a transaction-derived assets-only before/after receipt. Only the initiating matching draft/workspace advances. | Independent actual Import and use, Apply and reload pass. Unrelated variable creation before import and external variable-file edits afterward still refuse and retain the draft through Refresh Source. |
| Passive Component controls refuse | Existing control edits preserve read-only actions. Core admits an empty action list only for a new passive Component imagebutton. | Independent shared-component review through Apply succeeds, followed by passive addition; effectful addition still refuses without writing source. |

`asset.import` accepts optional `expectedAuthoringRevision` only for UI-image
imports and returns optional `authoringRevisionChange { before, after }` after
success. The projection verifies the metadata base and allows only asset-record
changes, retaining captured variable-file hashes. Legacy Rust import methods use
the same import owner. The response receipt is not persisted. The DATA_MODEL
control contract records this behavior. Existing stale source, target-review and
variable guards remain active; no blanket revision refresh was introduced.

Implementation verification passes 17 control tests, 12 action tests, the existing
passive-action policy test and UI-image replacement test: 31 focused core cases.
It also passes 103 affected frontend tests, typechecking, test compilation, Rust
formatting, five new actual UI/core modes and the existing full controls journey.
The ignored `app/target/five-fixes/implementation-receipt.md` owns commands and
per-slice red/green results. It retains initial fixture-name/null-field mistakes,
the Undo/Redo timing assertion and the misleading component Actions review row
exposed and corrected before final green results. These remain failed attempts.

The parent independently runs all 17 control tests, with zero failed or ignored,
including `reviewed_image_apply_returns_committed_documents_when_later_inventory_fails`.
Its separate probes use the original reproduction sequences with fixed-behavior
expectations. Core asset/canvas receipt:
`.toolchains/51-52/publication/parent-fixed-core-51d65d826ecf4af6ae4b44c49345982d/result.json`.
Independent actual UI/core receipts under `app/target/five-fixes/` are
`parent-import`, `parent-component`, `parent-stale-before` and `parent-stale-after`.
All pass, retain source on refusal, observe driver exit0 and remove fixture scratch.
The rebuilt offline driver SHA256 is
`5de8553feed56ba52c0381ff522794af767fd4200ea13bd15c8622892292e18e`.
These receipts describe the uncommitted correction delta against baseline
`a78de562`; their publication receipt in #51 binds the resulting final head.
The offline core-test binary SHA256 is
`2ac859aeb2d38593d5227443b678733bb90234d1a45440b77ec66698d81651b6`.
The application correction diff SHA256 is
`8627e749545a8d8cf868ecceb7b4a0ef908a01fd4fb4db18c17f044dc830d7fe`.
Ignored `app/target/five-fixes/parent-audit.json` binds the changed application
source hashes, five probe receipts and both binaries; its SHA256 is
`a8cdb8d04fc10c75a0bd027d61c055888b948759a2dbe0af1eb9e105a0a04189`.

This is local Windows core and synthetic-DOM proof through real production IPC.
No CI, SDK/helper, native editor or package operation ran. There is no fresh
pixel, physical-input, native, package or Mac claim for the changed code. Original
producer identities and binary hashes above remain historical evidence on their
original inputs. #51's cumulative counts and zero reservations are unchanged.
The same draft will publish with `[skip ci]` at Kris's explicit request; its
current head is unvalidated by CI. The existing validation plan stays unchanged.
No merge, ready-for-review transition, issue closure or separate PR is selected.

## Two-axis code review fixes, 2026-11-06

Kris accepted the Standards/Spec review of draft PR #83 and selected these fixes,
with CI. The gallery-gate retirement and the evidence basis (Spec a1/b1) were
already approved and were not changed.

- Clearing a bar color or image-button state deletes its statement. An inline
  comment stays on its own line. `pass` is used only if the block would be empty.
  Kris chose this for control properties only; numeric layout keeps its rule.
  The bar edit test now also proves that set-then-clear returns identical source.
- `bar_canvas` refuses an unparseable sample instead of clamping it. Samples are
  already validated i64 decimals, so this removes unreachable code.
- `control_source::image_button_size_field` replaces two copies of the size-field
  list in layout and canvas.
- New test: `selected`/`sensitive` expressions on an image button either record the
  variable revision or mark effects unknown.
- Removed a redundant alias and the `assetForReference` pass-through.

Local macOS ARM64 checks: 625 core tests pass, 21 focused control tests pass, the
actual controls UI-to-core journey passes all stages, and typecheck passes.
377/378 frontend tests pass; the Windows probe validator needs Python 3.11 (`tomllib`)
and this host has 3.9. CI runs on the pushed head; no SDK, helper, package or native
operation ran.
