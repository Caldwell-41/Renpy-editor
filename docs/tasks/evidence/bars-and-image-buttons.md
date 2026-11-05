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
