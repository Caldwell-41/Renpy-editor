# L03 numeric layout evidence

[L03 #38](https://github.com/Caldwell-41/Renpy-editor/issues/38) owns execution,
acceptance and any costly-operation limits. [B02 #24](https://github.com/Caldwell-41/Renpy-editor/issues/24)
owns aggregate node/property acceptance. This file records detailed evidence, not
a second task brief.

## Design preparation, 2026-10-28

Kris selected #38 implementation, focused tests, a PR into
`codex/phase3b-screen-designer` and CI audit. The implementation branch is
`codex/phase3b-l03-numeric-layout`, created from freshly fetched base
`4d2101f36b7491aa51ca513f3b3d819f9460bff8`. Development is on macOS ARM64.
L02 is accepted through PR #62. The architecture ownership boundaries from PR #65
remain unchanged. The unrelated untracked audit and protected recovery remain intact.

The existing flow-v1 and C5 approvals cover composition and dimensions. They do
not identify a numeric inspector for the new properties. Three unapproved
[Design Lab proposals](../../design/design-lab-numeric-layout/README.md) compare
paired sections, an axis worksheet and placement-first editing. No production
code has changed. The user's mock-first rule requires a design decision before
production implementation. The proposed TDD boundaries also await confirmation
under the installed TDD skill.

### Checks at the design checkpoint

- The Design Lab TypeScript check and production TypeScript check pass.
- Approval-record checks pass, including invalid promotion, capture identity and
  shared-source identity checks.
- The targeted browser matrix passes all 48 rendering cases across three layouts,
  four sample states, two themes and two sizes. It reports no browser errors or
  horizontal overflow. Captures are ignored under
  `.toolchains/design-lab/pages/numeric-layout/`. This runner does not include
  a numeric-layout interaction module; its result explicitly reports
  `interactions=false`.
- Direct browser checks confirm keyboard Apply changes sample width from 640 to
  720, keeps focus in the numeric field and enables Undo. Undo restores 640.
  A negative width refuses Apply and retains the input. Editing vertical position
  inside a vertical group refuses with the parent-specific explanation. Escape
  restores the saved value. These checks cover browser samples only.
  C's source-conflict sample also refuses Apply while retaining an edited width of
  800 and leaving Undo disabled.
- Final checkpoint repository validation passes for 972 files; the whitespace
  check passes. The final targeted matrix again passes all 48 cases.
- The combined Design Lab browser check failed after 488 rendering cases and 13
  interaction groups. It reached the existing flow-v1 approved-source guard, which
  correctly refused the current checkout because that reference pins `3c7ea31`.
  The same limitation is recorded in the [C5 approval evidence](simple-help-layout.md#c5-approval-and-handback-2026-10-26).
  No approval record or guard was weakened. The final report is
  `.toolchains/design-lab/report.json`; browser version is Chromium 156.0.8078.48.
  This combined check is a failure, not an overall pass. Source-pinned comparisons
  remain required for later production integration.
- The production build-isolation check ran separately after that stop. Its one
  JavaScript chunk contains no Design Lab module. It inspected the build in memory
  and did not write `dist`.

### SDK reference review

The local checksum-verified Ren'Py 8.5.3 documentation describes the mappings below.
Reading these references does not qualify editable support or geometry.

| Property | Reference meaning | Qualification still needed |
| --- | --- | --- |
| `xpos` / `ypos` | Integers use pixels; floats use a fraction of the parent. | Covered node/parent combinations and both aspects. |
| `xanchor` / `yanchor` | Position within the element; type distinguishes pixels and a fraction. | Anchored geometry and source type preservation. |
| `xalign` / `yalign` | The same relative value sets position and anchor. | Alias ownership and atomic source editing. |
| `xsize` / `ysize` | Sets both size limits; floats can be relative. | Preserve current integer editing; define any added editable types. |
| `xminimum` / `yminimum`, `xmaximum` / `ymaximum` | Pixel limits, subject to the displayable's sizing behavior. | Node rules, contradictory combinations and constrained geometry. |
| Side padding | Window/frame content insets. | Covered types and helper/source agreement. |
| `spacing` | Pixel spacing between box children. | Supported box types and parent constraints. |

The reference is the pinned SDK's `doc/style_properties.html`, especially position,
anchor, alignment, size limits, window padding and box spacing. The production
canvas currently accepts only a narrower property set; additional helper support
must preserve its data-only input boundary and `ScreenCanvasFrames` delivery owner.

### Remaining acceptance

All four #38 criteria remain pending. Required work includes design approval,
confirmed test boundaries, the qualified type/node matrix, transactional editing,
retained invalid/stale/conflicted drafts, production UI-to-core history/reopen
proof, and pinned-SDK anchored/constrained geometry at both qualified aspects.
The implementation still needs final Standards/Spec review, its commit, the authorized
PR and CI audit. No package, native app or SDK campaign has started. Historical
closed allowances remain closed.

CURRENT and HANDOVER remain above their word-count targets because they retain
prior acceptance and unique native recovery. This checkpoint adds only the selected
L03 state and leaves broader historical cleanup outside the feature assignment.

## A2 implementation, 2026-10-28

Kris approved A2 / Paired fields (`paired-v2`, `paired-refined`) at source
`c2d23c52d82660c91061aff3d72fef242abe5d29`. The approval record at `c1ab3e6`
retains the decision and nine capture hashes. Both TDD boundaries were confirmed.
The design chat returned checkout writer ownership before production edits.
The prior preparation sections describe their historical checkpoint.

The new Rust numeric-layout module owns typed literal parsing, alias ownership,
field eligibility, source patching and renderer draft validation. It uses shared
lexed ranges and transactions. The frontend editor owns per-element drafts,
keyboard entry, paired units, presets, bounds/padding/spacing and Apply/Cancel.
Add eligibility remains in Rust composition; installed frame readiness remains in
ScreenCanvasFrames. The [canonical matrix](../../DATA_MODEL.md#numeric-screen-layout)
distinguishes editable types and actual sizing constraints.

| Approved control | Production operation and observable result |
| --- | --- |
| Position, anchor, dimensions, limits, padding and spacing | Typed edits go through screens.setLayout; accepted bytes form one shared history entry. |
| Unit selectors | Retain the typed number; pixels serialize as integers and relative values as floats. |
| Nine alignment presets | Set both positions and anchors; automatic parent placement can refuse Apply. |
| Apply / Enter | Validate all pending fields, commit atomically and preserve field focus/caret. |
| Cancel / Escape | Drop only the current numeric draft, without a source write. |
| Choose markers and group-spacing link | Retain per-element drafts; unchanged owned sibling drafts rebase only after this editor's accepted save. |
| Expanded limits/padding | Retain expansion and focus the invalid field, opening its group when necessary. |
| Shared Undo/Redo and Source | Use the existing transaction history, Source reconciliation and close/reopen path. |

### Focused checks and diagnosed failures

The new operation tests cover exact BOM/CRLF/comments/opaque-neighbor preservation,
alias splitting, one transaction, no-op history, Undo/Redo, reopen, EOF property
insertion, integer versus relative zero in canvas plans, malformed literal refusal
and composition eligibility after numeric saves. The focused screen suite passes
35 cases before the final image-bound renderer guard. The image-bound test then
caught unsupported existing bounds reaching the helper; the reader now marks those
bounds unresolved, and that focused test passes.

The production controller test caught hidden orphan drafts and possible attachment
to a replacement node at the same byte offset. A read-only retained-draft control
and explicit discard action now expose missing targets. The temporary key includes
kind and literal. The test also caught a forgotten empty-field unit preference;
choosing relative before typing now preserves that choice.

The migrated Help browser path passes 11 groups through real production UI and
Rust dispatch. It covers minimal two-token dimension saves, no-op, keyboard focus,
Cancel/Escape, held ApplicationHost refusal, dirty Source, ordinary external conflict,
Source Save reconciliation and project reopen. Runtime and SDK doubles are excluded
from this proof. New group/stale cases and native-probe rehearsals are still in
progress. Their initial failures were harness selectors for owned screen/tree roles
and synthetic Enter submission. Synthetic keydown does not invoke a browser's native
form default, so the editor now explicitly handles Enter on numeric inputs as well
as form submission. No runtime gate or assertion was weakened.

### SDK geometry and limits

The public Rust operation exports the accepted fixture used by
`qualify-numeric-layout.py`. Its SHA256 is
`c6192365b9d010c5704fe54560313e147b030a7cb49ba6733aa7e040f786f6d3`.
The official Ren'Py 8.5.3 archive checksum matches the published manifest; runtime
reports 8.5.3.26051504. The qualifier rejects missing/wrong geometry before launch,
checks exact anchored/constrained rectangles and placement/spacing relations, and
verifies unchanged accepted bytes and cleanup. It measures normal game geometry
with SDL dummy/software rendering, without a GPU pixel-fidelity claim.

Mac sdk-01 consumed three starts. Compile/lint passed; the test-runner process timed
out after 60 seconds with no geometry and was reaped. Its stdout/result/source remain
retained. Diagnostic start four completed ordinary game entry and isolated an inner
widget lookup error. The qualifier now measures outer displayables with base=True.
Text stays content-sized; supplied dimensions do not stretch glyphs. Vbox children
can exceed a requested group size. Those SDK semantics govern the UI explanations
and matrix. The diagnostic's completed status is not geometry acceptance.

Corrected sdk-02 consumed four starts and passes both 1280×720 and 1024×768. Fixed
free bounds are [10,20,200,100], constrained frame [40,50,260,160], stack
[52,68,100,100], button [52,107,100,60], and image [1,0,64,48]. Anchored panel bounds
are [800,270,320,180] and [608,294,320,180]. Padding places panel text at +16,+20;
spacing is 12 pixels after measured text height. Source stayed unchanged and cleanup
completed. These receipts live in ignored .toolchains/numeric-layout/sdk-02.
Early proof binds the accepted fixture hash; it does not qualify the full dirty
implementation as a release candidate. Mac use is 8/16 SDK starts; other costly
operations remain unused. #38 owns the cumulative ledger and remaining proof.

### Visual comparison checkpoint

The approved reference stays pinned in a separate checkout. Production captures
use the same 1100×720 and 560×640 viewports, light/dark themes and frame fields.
The inspector now matches A2's 382-pixel width, paired axes, section hierarchy,
alignment grid and separate commit row. The initial production comparison clipped
unit labels and hid Apply below the viewport; the corrected inspector scrolls its
fields within available desktop height. Production retains existing navigation,
canvas controls and Source capabilities outside the mock's inspector scope.
Final expanded/compact comparison and native rendering remain pending.

### Final local checks and preflight

All 264 frontend tests pass after moving the CSS import into the shared stylesheet,
updating the deny-by-default protocol expectation and using the bundled Python 3.12
runtime. Earlier test-build failure and the Python 3.9 tomllib failure remain failed
harness/environment attempts. Production typecheck and desktop cargo check pass.
Repository validation passes for 1013 files; whitespace and workflow YAML parsing pass.
The corrected production group/stale-draft integration and packaged Help controller
rehearsal pass. The real SDK canvas-controller rehearsal passes; this is one further
Mac helper start, not native-input evidence. Canvas-input initially refused its missing
output argument before launching a child; a corrected consumer check is in progress.

The A2 comparison test catches shared-style interference: the global input selector's
minimum height overrode the inspector's 32-pixel rows. A scoped selector fixes that
cause. Final Help integration and both-size/theme captures pass with the same 640×360
field values as A2. Desktop fields measure 32 pixels and the Apply row remains in the
viewport while a bounds group scrolls. The canvas in this browser check remains
unavailable, so this is inspector comparison only.

An unfiltered broad core command was cancelled. Unrelated network/loopback tests
failed inside the command sandbox, and SDK environment variables admitted historical
qualification gates. It is not a full-core pass. The interrupted target-gate fixture
retains only an incomplete SDK staging directory, with no created target project;
its stage is being audited before releasing the conservative two-start reservation.
The selected focused screens gate remains the current core proof. No production
change attempts to compensate for those unrelated failures.

Signed Mac preflight finds no matching signing identity, even outside the command
sandbox. No package or native editor starts. The approved fingerprint/policy remain
unchanged. The implementation owner asked where the existing identity is available
and continues the authorized PR/CI work. Mac native proof stays pending; unsigned
packaging is not a substitute. CI will qualify both target controllers/source and
SDK aspects plus the Windows packaged Help path under #38's recorded reservations.

The corrected max-boundary canvas-input controller check passes, including its
keyboard dimensions, Escape, shared history and existing gesture controls. This
preserves the affected consumer without accepting pointer or native presentation
scope. Each of the two canvas-controller processes also validates the installed SDK
with --version before starting its persistent helper. These four process starts bring
Mac consumption to 12/16. The earlier 9-start checkpoint omitted validation starts
and is corrected here and in #38. The cancelled historical gate retained only 862
files in an incomplete archive payload with no target project; it never reached SDK
validation or execution, so its two conservative reservations are released.

Final review will compare the complete feature against Screens base `4d2101f`.
The pending CI run reserves four Mac SDK starts (reaching 16/16), up to nine Windows
SDK starts including native fixture validation, one Windows package and one editor
session. Mac signing preflight still blocks a native attempt and consumes no slot.

Retained final inspector captures are [desktop](numeric-layout-captures/production-a2-dark-wide.png)
and [compact](numeric-layout-captures/production-a2-dark-compact.png). Their SHA256
hashes are `9a4331d09a312a8f2f09757fa1ed952c957a994385cd74229f019ead94172d6c`
and `36da67874a260322df5c78a7e44989f717d91348ae62c0618b13623cff2e1bea`.
These 1100×720 and 560×640 dark captures compare the inspector with A2's 640×360,
centered relative fields. Surrounding production navigation/canvas availability retain
their existing behavior. The implementation candidate is `2b912c5`; final review is
read-only and split into Standards and Spec. Publication and CI follow in this chat.

### Independent review and fixes

Standards review reports zero actionable findings at `2b912c5` against base
`4d2101f`. Spec review finds two P2 defects. The production controller regression
first reproduces an element's validation error appearing on another saved element.
Feedback now belongs to each draft key; selecting another element clears that
inspector's error, and returning preserves the original invalid draft and feedback.
The complete controller check passes after the fix.

The second public-operation regression first reproduces a vertical edit rewriting
an ambiguous horizontal setter when both share an align alias. The literal reader
now explains the shared ambiguity, and alias splitting refuses any blocked field.
This preserves the original alias/comment/override bytes rather than rewriting a
Source-only rule as a side effect. Focused screen checks are being rerun on the fix.
Both reviewers remain read-only; the implementation owner makes the corrections.

## Standards

The independent review found no actionable Standards violations at `2b912c5`
against `4d2101f`, and no new findings in `57b9960`. Source transactions, typed IPC,
Rust Add eligibility and ScreenCanvasFrames ownership remain intact. No smell
judgment warranted an additional abstraction or refactor.

## Spec

The independent review reported two P2 defects: validation feedback leaked between
elements, and an alias split could rewrite a blocked setter. Both have red/green
production-boundary regressions and fixes in `57b9960`. Recheck confirms both resolved
and no introduced defect. No scope creep was found. Final local results are 36
screen-core tests and 264 frontend tests passing, plus the full production numeric
controller check after per-element feedback changed. CI and signed Mac native proof
remain pending, without acceptance or merge claims.

The temporary pinned A2 server/checkout was retired after comparison. Its only local
changes were the identical committed approval record and a dependency symlink.
Approved source, metadata, nine reference captures and the selected production
captures remain in the branch history. The unrelated audit and protected recovery
were not staged, changed or removed.

## PR and pending qualification

Draft [PR #66](https://github.com/Caldwell-41/Renpy-editor/pull/66) targets
codex/phase3b-screen-designer. The sole dispatched qualification is
[run 40604403915](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40604403915),
attempt 1, candidate `a79737ec641837803a55ef9fd3e0c30fe3a4d04b`, ordinal 1,
numeric_layout=true. Initial status is queued. All historical selectors remain
unselected and their guards remain unchanged. Dispatch consumption is 1/3.
The pending reservation is four SDK starts per OS, one Windows build/session and
up to five more Windows SDK processes including fixture version validation.
Mac is 12/16 before CI; Windows is 0/16. Actual starts and outcomes require audit.

The following status-only commit records that run; it changes no application,
fixture, dependency, probe or workflow input from the selected candidate. Final
both-platform geometry/controller/Windows package proof remains pending. Signed
Mac native proof is separately blocked by the unavailable approved identity. The
CI watcher, if registered, resumes this same implementation chat for audit and
in-scope fixes. #38 stays open and the PR stays draft while required proof is missing.

## CI audit, 2026-10-28

The ci-watch event belongs to this chat, and its receipt is acknowledged. GitHub
confirms run `40604403915`, attempt 1, candidate
`a79737ec641837803a55ef9fd3e0c30fe3a4d04b`, completed successfully. Both selected
numeric-layout jobs and selector validation pass. Historical jobs were intentionally
unselected; they are not new passes. The status-only follow-up `535344c` changes no
application, fixture, dependency, probe or workflow input. Its automatic PR run
`40604514626`, attempt 1, also passes both required jobs.

The [retained audit receipt](numeric-layout-ci-40604403915.json) records candidate,
source/report/package hashes, artifact identities, measured geometry and consumption.
Both artifact sets were downloaded and checked, with 40 Windows and 35 Mac files;
the corresponding privacy scans pass. Artifact IDs are `12780951480` (Windows) and
`12780796124` (Mac), with their API digests retained. The current download is available;
a later expired artifact must not be described as freshly inspected.

Both targets pass 264 frontend and 36 screen-core tests. Their one ignored SDK
helper case is outside this selection and is not a pass. Real numeric controller,
all 11 Help controller groups and the exact native-probe rehearsal pass on each
host. Browser/rehearsal evidence retains its explicit no-native/no-SDK claims.
The official SDK qualifier passes compile, lint and both aspects, with four starts
per OS. The exact accepted source hash is
`c6192365b9d010c5704fe54560313e147b030a7cb49ba6733aa7e040f786f6d3` on both hosts.
All nine measured rectangles match between hosts at both aspects. Anchored panel
bounds are [800,270,320,180] and [608,294,320,180]; the constrained frame remains
[40,50,260,160]. Missing/wrong-result gate checks, source preservation and cleanup
all pass. This remains geometry proof using software rendering.

The Windows x64 package hash is
`0d384ab689b9e5ff8e27fe4659bad0f4958b07c9f1756c6158378a218d91b2e4`.
Its actual packaged WebView case passes inventory, atomic dimension save, shared
history, validation, preview geometry, stale revision/Stop and disk reopen. Stop
returns expected STATUS_CONTROL_C_EXIT (-1073741510) with cleanup complete. The
accepted on-disk BOM/CRLF bytes match exactly, scratch jobs are zero, and no source
bytecode or saves remain. All host/request/credential cleanup owners report success.
Input was synthetic DOM input; this is not OS-native keyboard or human acceptance.

Actual cumulative consumption is dispatches 1/3; Windows packages 1/2, editor
sessions 1/2 and SDK starts 8/16; Mac packages 0/2, editor sessions 0/2 and SDK starts
16/16. Windows SDK use is four qualifier processes, one fixture --version process,
compile/lint validation and one run. Mac used its remaining four qualifier starts.
Signed Mac native proof is still missing because the approved identity is unavailable.
The next bounded Mac Help case needs four further SDK starts, so it also requires
approval to increase that ceiling to 20. No such run or package has started, and no
signing/Keychain change is authorized by this audit. #38 stays open and PR #66 stays
draft. Matrix, transactional/constraint behavior and two-aspect geometry have audited
proof; the final production-path criterion remains pending Mac native qualification.

## Approved Mac continuation, 2026-10-28

Kris approved four additional Mac SDK starts, increasing that ceiling from 16 to 20.
The live #38 ledger is amended before execution. Other ceilings are unchanged.
The package preflight's matching-identity query now finds the exact approved
358372708164C7273A551D746449357C12A3A806 self-signed identity. The valid-chain-only
query omits it; the package route uses the matching query and then strict certificate-
bound signature verification. No Keychain trust, ACL, identity pin or names changed.
Mac package attempt 1 starts through macos-package.py against source a5e0e9a.
The output is fresh and ignored. Editor sessions remain zero and SDK use remains 16
until the isolated Help case actually starts.

## Mac native audit and review handoff

Mac package 1 passes the strict signature and installer-content gate at source
`a5e0e9a4426acc9532afa1ddf842b0b69ad10b1e`. Its application inputs are identical to
the both-target CI candidate; intervening commits change status/evidence only.
The [retained Mac receipt](numeric-layout-mac-native.json) binds the ARM64 executable,
approved certificate, designated requirement, installer, source and native reports.
Executable SHA256 is `f59e8ecde2c16785286503c0c559d5caff3ff466d4e746a9a5085665ad460832`;
installer SHA256 is `43c1eccecc15e4746fe22865ce8111d7f5971218a347d859c4ec1a4054c9b747`.
Permanent Loomlight names and the approved fingerprint are unchanged. The existing
local self-signed route was used; no trust, ACL or credential policy changed.

Native session 1 completes in 34.032 seconds, with product exit 0 and no timeout or
external errors. All six named Help groups and the complete terminal pass. Validation
compiles/lints without error. The actual SDK preview measures 760×360 at 1280×720
in game context. A later accepted edit marks that running preview stale; Stop returns
exit 0 with the expected cancelled phase and cleanup. Reopen retains only accepted
bytes. The BOM/CRLF file matches the fixture's exact width-768 result. Scratch jobs
are zero; source bytecode/saves are absent. Host, requests and credentials all clean up.
The desktop remains unlocked/awake before and after the child, and both owned power
assertions release without error.

A post-run live-process query found no process because the successful probe had
already exited. No rerun was started. Exact-path macOS log metadata instead binds
PID 292 to the fresh output bundle, and its executable hash matches the verified
package. This is packaged WKWebView behavior with synthetic DOM input. It does not
claim OS-native keyboard delivery, pointer fidelity or human acceptance.

The four additional SDK starts are one fixture --version check, compile, lint and
run. Cumulative use is dispatches 1/3, Mac package/editor 1/2 each and SDK starts 20/20,
Windows package/editor 1/2 each and SDK starts 8/16. The user-approved increase is
recorded in #38. No uncertain start or pending owned process remains.

Visual fidelity finding: the inspector matches approved A2's paired units/axes,
382-pixel desktop proportions, 32-pixel controls, presets, expandable limits/padding
and separate commit row in the retained same-state browser comparisons. Production
navigation and unavailable-canvas behavior keep their established scope. The signed
Mac run verifies actual controls and focus through the same production editor.
Functional finding: all mapped #38 actions have passing production/controller/core,
source/history/reopen and two-platform SDK evidence. The required Windows and signed
Mac packaged paths pass. Standards is clear; both Spec findings are fixed/rechecked.
All four leaf criteria have evidence. PR #66 is ready for review into Screens; the
issue remains open for integration, and no merge or successor is selected. Broader
B02/3B and final human acceptance remain outside this leaf's completion claim.
