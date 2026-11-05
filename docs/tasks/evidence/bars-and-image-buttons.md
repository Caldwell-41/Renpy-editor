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
