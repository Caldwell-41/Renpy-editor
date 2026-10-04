# Current outcome handover

## Final Mac completion in progress — 2026-10-04

**Machine:** local macOS 26.6.2 (25G83), ARM64; Windows-PC review remains deferred.
**Branch/PR:** `feature/phase-1g-branches-runtime`, PR #17 OPEN/draft/CONFLICTING.
**Corrected source/build input:** `580740f85c03118b37846a2413e849a4187555bb`.
**State:** `in_progress`; corrected installer verified, local native cases running;
Mac physical/visual acceptance and final remote qualification remain pending.
The [execution record](../tasks/active/ui-design-review.md#final-mac-completion-execution--2026-10-04)
owns checks, retained failures, prepared five-step Mac review and continuation.

CONFIG-01 is implemented: dimensions/reduced ratio/caption, truthful empty/invalid
Custom guidance with no preview, proportional 100×64 bounded portrait/landscape.
Existing presets/validation and Story/Source spacing `f287a7e` are included.
Frontend 85 passed/0 skipped, production web and Source/selection/UI browsers PASS;
all five corrected driver browser cases PASS. Two collapsed-control omissions in
shipped probe were fixed without relaxing rejecting assertions. Existing unchanged
core/service evidence retained separately; browser proof is not native acceptance.

One release build and retained seal/repack verification pass. Corrected local DMG:
`.toolchains/review-builds/ui-refresh-580740f/Loomlight_0.1.0_580740f_aarch64.dmg`,
5,751,732 bytes, SHA-256
`9e6df6905f7f16d2d30ba58578e9d461d6fc8e1b5fc671d72c378d53e1abf0c1`.
Sealed executable SHA-256
`6114877e6f441b18d7af0186241c83506a44bba27b6ea03def5422b68710e7a9`.
Mounted hash/execute mode/identity, ARM64, strict/deep ad-hoc seal, container integrity,
Applications shortcut, checksum manifest and artifact privacy scan PASS.
Not Developer ID/notarized. Original raw container and earlier packages retained.

**Pending local operation:** retained six-case packaged real-SDK runner, exec session
14077, summary/evidence under ignored `.toolchains/reports/final-1g-mac/`.
Compile and lint PASS with cleanup. Route-a FAIL (307.637 s), `Timeout: source-save-click`
while awaiting the earlier-launch revision observation; retain failure and assess on
unlocked host. Remaining terminal evidence is not yet audited.
The older normal app was quit through its guarded flow. CUA now reports the Mac
locked; user asked to unlock it. Do not infer native/user acceptance or start a
second instance while this runner owns the app. Prepared synthetic review files and
profile-isolation/restore helper have not changed the user's application profile.

No workflow dispatched; initial final production request **0/1**. Once local native
checks finish, verify the actual installer copy and guide MAC-01 through MAC-05 in
manageable steps. Preserve the existing app profile/SDKs for uncached download review;
record user physical/visual observations separately. Only after passing Mac review,
publish/qualify the exact candidate with required Repository quality and production
`upload_packages=true`, then manual same-chat wait/audit and Windows transfer.
No conflict resolution, rebase/merge, milestone closure or next feature phase.
Counters: **11 production builds**, **48 native/boundary starts** (44 incoming +
compile/lint/route-a/route-b); two remaining local cases queued. Separately **4 SDK
menu starts** unchanged. Audit pending logs before updating totals.
Fresh entry refs remain main `4d7ba03`, planning remote `267ec2a`/local `2c5a164`;
GraphQL PR base `924619d` differs from Git main. Preserve both planning worktrees.
Source and this pause record are selected for publication on the existing branch;
verify remote HEAD after push. Installers/logs stay ignored.

## Earlier selected next-agent handover — 2026-10-04

**Machine:** local macOS ARM64; genuine Windows verification requires a Windows PC.
**Branch/PR:** `feature/phase-1g-branches-runtime`, PR #17 OPEN/draft/CONFLICTING.
**Incoming checkpoint:** `94569725d152f3bfae8d67b347b0b6be168fdc67`;
latest application source `f287a7e232e152af9cb178e237c33357b4cb6e03`.
**Reason:** approved staged final 1G completion; resolution detail and final acceptance
remain open, latest sidebar spacing is fixed in source but not the delivered installer.
Read the [selected sequence](../tasks/active/ui-design-review.md#selected-1g-completion-sequence--2026-10-04)
for exact authority and gates. This docs handover adds no build/run/dispatch.

Next chat owns CONFIG-01 completion, focused automated checks/self-review, one pinned
corrected Mac installer and prepared final Mac human/native review. After Mac review
passes, publish/verify the exact candidate, run required existing remote checks and
final production qualification with retained artifacts, classify/fix failures and
verify affected changes. One initial qualification dispatch plus justified changed-
input correction reruns are selected; no duplicate unchanged successful matrices,
ambiguous-dispatch retry, specialist/performance expansion or polling loop. Persist
run/attempt/SHA/evidence/continuation before manual same-chat waiting; resume that
chat to finish the evidence audit and fixes. Counters and budgets are cumulative.

Completion of the next chat means a documented passing Mac review and required remote
qualification for one identified candidate, plus a precise Windows transfer/checklist.
A subsequent different agent on Windows runs the 14-row checklist and affected native/
service/input qualification, with remaining human review prepared rather than fabricated.
Windows corrections require affected Mac rechecks. Only after both platforms' required
results and acceptance are complete does a final separately selected chat reconcile
PR #17 with current main, recheck combined inputs and integrate. The next chat must
not resolve conflicts/rebase/merge/close the milestone or start 1H/new features.

Reuse earlier qualified evidence only for proven unchanged inputs. The `b6cc06b`
installer below predates `f287a7e` and the pending picker completion. Preserve all
packages/failed runs and use disposable fixtures, not private project content.
Frontend 85, production web/browser/repository checks currently pass for the spacing
source; those are not final native/Windows acceptance. CONFIG-01 preserves current
Loomlight limits, adds dimensions/reduced ratio/caption, refuses misleading invalid
preview and fits portrait proportions; no new preset scope is selected.

Live Git/REST main is `4d7ba03`; GraphQL PR base snapshot differs at `924619d`.
Do not assume either recorded ref remains current: inspect fresh refs at entry and
integration. Remote planning `267ec2a` and separate local planning worktree `2c5a164`
are preserved. No operation pending; Windows deferred. Counters unchanged: 10 packages,
44 native/boundary starts and separately 4 SDK menu starts. Publish and verify this
documentation checkpoint; the successor uses the latest HANDOVER, never resets to
an incoming historical SHA. Earlier sections below are retained evidence snapshots.

## Story/Source sidebar spacing regression corrected — 2026-10-03

The user reports icons touching sidebar labels on Story/Source in the latest Mac
review. Source checkpoint **`f287a7e`**, parent `0474e04`, removes only the old
max-width 1100px `.with-tree` icon-margin override. Expanded links retain the shared
12px gap; collapsed links and panel controls keep zero margin. Existing widths,
independent collapse, arrows and restore slots are preserved. The
[task record](../tasks/active/ui-design-review.md#storysource-navigation-spacing-regression--2026-10-03)
owns cause, rejecting evidence, exact changed-scope checks and Windows continuation.

New browser geometry proof first rejected the unchanged product at Story/1100px
(0px instead of 12px); corrected full regression passes all six surfaces/both
palettes/five widths and 80 navigation/tree state combinations. Frontend check
85 passed, web build PASS (existing chunk advisory), repository validation and
diff checks PASS. Inspected synthetic light Story/Source/Branches and dark Story
captures. This proves renderer spacing, not macOS/Windows native acceptance.

The final `b6cc06b` installer below remains available but predates this source fix.
No replacement package was selected by the regression report. WIN-UI-09 includes
all-surface spacing above/below the breakpoint with expanded/collapsed navigation
and visible/hidden Scenes/files. Windows remains deferred. No native/SDK launch,
workflow dispatch, merge/conflict resolution or new phase; no operation pending.
Totals remain 10 packages, 44 native/boundary starts and separately 4 SDK menu
starts. Main `4d7ba03`, remote planning `267ec2a`, separate local worktree `2c5a164`
and draft/open/conflicting PR #17 are preserved. Publish and verify the source/docs
checkpoint on the same branch. Continue final 1G acceptance; CONFIG-01 and prior
remaining work are still open, and select a new installer when needed.

## Latest corrected Mac installer ready — 2026-10-03

User requested installer rebuild and remaining 1G summary. Built one pinned local
macOS ARM64 release package at input **`b6cc06b3496e20288de8a06211dfd599e29f9bf3`**,
app source **`cedef502c7f517a808319696ba3a94952377f41d`**. It contains sidebar,
Branches B, Character/Variable layout and staged-image preview corrections.
Final ignored installer:
`.toolchains/review-builds/ui-refresh-b6cc06b/Loomlight_0.1.0_b6cc06b_aarch64.dmg`,
5,752,413 bytes, SHA-256
`6209a3540756c774e88ec1e2a9d11b618f46cc370c6c81cbd390b09bec234d71`.
[Delivery ledger / remaining 1G](../tasks/active/ui-design-review.md#latest-corrected-mac-installer-delivery--2026-10-03)
records exact app/raw hashes, static checks and continuation. BUILD.json,
SHA256SUMS.txt and README.txt accompany the retained app and final/raw containers.

Release web/Rust/app/DMG build passes. Applied known local ad-hoc resource seal to
the same payload and repacked with Applications shortcut; final integrity,
strict/deep signature, ARM64-only identity, mounted executable checksum/execute bit
and bundle version all pass. Detached volume and removed temporary staging.
Not Developer ID/notarized. Existing 85 frontend/7 core/1 desktop/full-browser proof
is reused for unchanged inputs, not a new native gate. Installed application and
private projects remain untouched; no app/game/SDK execution. User quits Loomlight,
replaces the Applications copy from final DMG and resumes changed-surface review.

1G remains open for CONFIG-01 ratio/caption/valid Custom/portrait preview; final Mac
physical keyboard/IME, Finder drop, live SDK/detailed creation progress and focused
runtime/UX session; later Windows affected native/packaged qualification and final
session (14-row checklist); separately selected PR #17 conflicts/integration checks
and merge. Final session covers navigation/pending input, authored routes,
script saves during play/Stop/rerun, diagnostic Source navigation and scaling/reopen.
Acceptance stays provisional; 1H follows integration and optional Git is not a
Phase 1 prerequisite. No workflow is pending, and no automatic CI/Windows dispatch,
conflict resolution, merge or next phase is selected by this build request.

Main `4d7ba03`, OPEN/draft/conflicting PR #17, remote planning `267ec2a` and separate
local worktree `2c5a164` preserved. Totals now 10 production builds, unchanged 44
native/boundary starts and separately 4 SDK menu starts. Earlier packages/failures
are retained. Publish/verify this delivery documentation only; no binary/log commit.


## Catalogue layout and staged preview corrected — 2026-10-03

The latest screenshots select correction of Character grid/list layouts, Variable
column alignment and selected-image preview replacing the initial Choose files
section. Acceptance is provisional (“acceptable for now”), with refinement/final
review still open. Source checkpoint **`cedef502c7f517a808319696ba3a94952377f41d`**,
parent `002c753`, preserves sidebar and approved Branches B implementation.
The [CATALOG-05 / ASSETS-03 follow-up](../tasks/active/ui-design-review.md#catalogue-layout-and-staged-import-preview-follow-up--2026-10-03)
owns exact behavior, initial setup failures/corrections and evidence.

Explicit summary/surface columns fix mixed Character image/placeholder rows and
four-column Variable/header alignment. Staging replaces initial Choose/description
with passive per-image previews, dimensions/size and import fields; smaller Add
files remains. Remove/discard restores empty chooser, errors offer Retry, audio
shows metadata, and focus avoids hidden controls. `asset.previewImport` uses the
current session's project-bound retained file authority, checks identity/size/hash
and existing passive limits, writes nothing and preserves confirmation. URLs are
bounded/revoked and late detached receipts ignored. No format scope expansion.

Evidence PASS: 85 frontend tests, web compilation, 7 focused core tests, 1 macOS
desktop test, full Chrome actual-renderer regression (mixed Character Grid/List,
Variable header positions at 1440/960/560 in both themes; decoded staged PNG,
remove/discard/reopen and footer actions at full/compact size), inspected screenshots,
format/diff and repository validation (325 files). Browser bridge uses synthetic
fixtures; native drop, physical IME and final UX remain unclaimed. Existing web
chunk-size advisory remains. Windows checklist has 14 specific deferred rows,
including WIN-UI-14 for layouts, native staging/preview, external changes and DPI.

Delivered `19cdcaa` installer predates these/sidebar/Branches fixes. Continue review
or select a replacement installer separately; no new package selected this turn.
CONFIG-01, live SDK/detailed creation progress and physical/final acceptance remain.
Remote planning advanced to `267ec2a35ed94bbf565594200cd729c87c6fb11c`; its local
separate worktree remains `2c5a164`. Preserve both without resetting/updating that
checkout. Main `4d7ba03`, PR #17 OPEN/draft/CONFLICTING remain. No package,
native/SDK application start, hosted dispatch, automation, merge/conflict resolution
or new phase; totals stay 9 packages, 44 native/boundary starts and separately 4 SDK
menu starts. No pending operation. Publish/verify this continuation checkpoint on
the same branch; no receipt-only commit.


## Approved Branches option B implemented — 2026-10-03

The user chose B, selecting its bounded connector implementation. Source checkpoint
**`88add80972ca29c81086a5476ad6ed0bde342fe4`**, parent `c771493`, preserves the earlier sidebar correction.
The [BRANCHES-03 closeout](../tasks/active/ui-design-review.md#option-b-selected-and-implemented--2026-10-03)
owns behavior, rejecting cases, initial corrections and exact evidence. The accepted
unchanged mockup/prompt/hash is retained in the design reference set; its missing
arrowhead/imperfect tip were generation defects and are corrected in production SVG.

Implemented 3px accent strokes, 14px opaque label pills above connectors, distinct
ports/channels for reciprocal/parallel/long/backward/self links, rounded node-safe
paths, fixed node bounds/full-name tooltips and Fit of route/label extents. Accepted
entry anchors cycles; unresolved/terminal flow remains unguessed. Keep read-only
flow, captured navigation, pan/zoom/selection/focus and partial/stale contract.

Local proof: **83 frontend tests**, web compilation, full actual-renderer UI regression,
eight-link SVG sampling/bounds at three sizes/both themes, and existing 500-node/
2000-edge Chrome check PASS. Diagnostic layout 40.4ms, pan p95 15.7ms; all retained
thresholds pass, cleanup complete. Diff/repository validation passes (325 files).
No core/SDK contract changed; those unchanged gates were not rerun. Windows
WIN-UI-13 is DEFERRED; native/physical/final UX acceptance is unclaimed.

Delivered `19cdcaa` predates sidebar/Branches changes. Continue user review or select
a corrected installer separately. CONFIG-01 remains open. Main `4d7ba03`, planning
`2c5a164`, PR #17 OPEN/draft/CONFLICTING and prior evidence remain. No new package,
native/SDK start, hosted request, automation, merge/conflict resolution or new phase;
counts remain 9 packages, 44 native/boundary starts and separately 4 SDK menu starts.
No pending operation. Publish/verify this meaningful verification and continuation
checkpoint with source on the same branch; no receipt-only commit.

## Branches connector mockups selected — 2026-10-03

Latest request: show 2–3 image choices before changing Branches. The user reports
thin arrows, unclear labels, backward links behind nodes and overlapping opposite
Scene 1/New Scene routes. The [BRANCHES-03 proposal](../tasks/active/ui-design-review.md#branches-connector-design-options--2026-10-03)
records read-only renderer evidence and three options: curved top-down, rounded
orthogonal, horizontal. A user-requested subagent uses built-in image generation;
there is no selectable GPT sunburst override. Samples use synthetic graph names
and the paper/teal palette, not private project contents. Generated images are
unaccepted previews in ignored `.toolchains/reports/branches-mockups-2026-10-03/`.
All three previews are ready: `option-a-curved.png`, `option-b-orthogonal.png`,
`option-c-horizontal.png`, with `PROMPTS.md` alongside. A/C have all visible directed
arrowheads; B demonstrates useful routing channels but the raster misses the `4`
arrowhead and imperfectly attaches Jump. These limitations are disclosed in the
ledger and delivery; do not approve them as production behaviour. No graph editing
or shortened toolbar is selected by these illustrations. Deliver previews and obtain
the user's visual choice before implementation. Docs/diff validation passes (322
files); no app tests are selected for this documentation-only checkpoint.

Source remains published `59f0323`; main `4d7ba03`, planning `2c5a164` and PR #17
OPEN/draft/CONFLICTING are preserved. Delivered `19cdcaa` installer predates sidebar
source correction. CONFIG-01 remains open; Windows/physical/final UX acceptance
remain deferred/open. No app tests/native/SDK starts, packages, hosted dispatch,
merge/conflict resolution or new phase are selected by mockup review. Totals stay
9 packages, 44 native/boundary starts, separately 4 SDK menu starts. Publish/verify
this meaningful design checkpoint after previews are ready; no receipt-only commit.

## Sidebar control alignment follow-up — 2026-10-03

The user reviewed the delivered Mac build and selected four sidebar corrections:
header alignment, no control-driven width expansion, no tree restore/title overlap,
and reversed opening arrows. Incoming feature `254fe36` and main `4d7ba03` were
preserved. The separate planning worktree advanced to `2c5a164`; preserve it. PR #17
remains OPEN/draft/CONFLICTING; no integration was selected.

Fixed 32px controls within existing sidebar tracks, removed the tree float and SVG
link margin, placed navigation toggle in the project header, and reserved a 44px
restore slot beside the Story heading/Source tabs (including empty Source). Opening
arrows now point right; expanded controls point left. Collapsed Settings is a cog
with an accessible label/tooltip. Retain existing hide/restore focus, ARIA state,
chapter selection, independent widths and Writing focus panel restoration.

Focused local evidence: 78 frontend tests, web compilation and existing actual-
renderer browser regression pass. Added 48 sidebar geometry/state combinations:
Story/Source, light/dark, 1440/960/560px, both panel states. Checks require existing
180/64px navigation and 230px tree width, contained 32px controls, no horizontal rail
overflow, aligned header controls, reversed arrows, restore/title-tab separation
and visible focus transfer. Captures inspected; fixture previews are synthetic.
Repository/diff validation pass. The task retains intermediate product/harness
corrections; no failure is waived. Native macOS/Windows acceptance is unclaimed.

Source changes are newer than delivered `19cdcaa`; the installed app is not changed
by source edits. Continue hands-on feedback or select a corrected package explicitly.
No new package/native/SDK start or hosted dispatch; totals remain 9 packages,
44 native/boundary starts and separately 4 SDK menu starts. CONFIG-01 remains open;
Windows WIN-UI-09 now includes these exact alignment/arrow/title checks. No pending
operation, automation, merge/conflict resolution or new phase. Publish this coherent
source/docs checkpoint on the same branch and verify it; no receipt-only commit.

## Corrected local Mac installer ready — 2026-10-03

The user's requested local build completed from published input
`19cdcaa2e4d249d6be99fb18bf4f9613b011fadf`, app source `1d4bf14`. One normal
pinned-toolchain Tauri release build produced app/DMG successfully. Source inputs
were unchanged; only the pre-build documentation selection was dirty. The final
retained Mac ARM64 installer is:
`.toolchains/review-builds/ui-refresh-19cdcaa/Loomlight_0.1.0_19cdcaa_aarch64.dmg`
SHA-256 `4e83485c968b12bc843382a4136301ccc13e68fa51202f27813a22f2f449a1da`.
`SHA256SUMS.txt`, `BUILD.json`, README and the sealed app accompany it. Delivered
app executable SHA-256:
`7105c6f96baa17ed1fd0ef2ec0bce855b0729f8b3f193b265f5403b3a633e491`.

Static checks: final DMG integrity PASS; read-only mounted payload matches retained
app, bundle ID `app.loomlight.desktop`, version 0.1.0, thin arm64; strict/deep signature
verification PASS with local ad-hoc sealed resources. The original Tauri bundle had
only the linker signature and failed bundle-resource verification. Locally sealed
that app and repacked the same compiled input; preserved the original unsealed DMG
as evidence. This is not Developer ID/notarized distribution. One release compilation,
two DMG containers, no duplicate build/hosted request. The checksum helper's Python
API mismatch was corrected with portable streaming SHA-256; no build rerun. Full
bounded evidence and original/final hashes are in the task/ignored reports.

Cumulative totals: **9 production package builds; 44 native/boundary starts; separately
4 SDK menu starts**. No application/game/native case was launched; installed older
`01d0896` and the user's project were untouched. Existing local 78 frontend/185 core/
1 desktop/browser evidence remains for these unchanged source inputs, not a new
native acceptance claim. CONFIG-01 preview detail remains incomplete. Windows is
still deferred under its checklist. No manual workflow or automation is pending.

Deliver the final DMG link. User quits the old app, opens the DMG and drags Loomlight
into Applications/replaces the old copy, then resumes review at **Story**. Continue
physical keyboard/IME, OS drop, live progress and final visual/UX acceptance. Do not
silently repair the older project's GUI assets. Preserve main/planning worktree and
PR #17 draft/open/conflicting; no integration or new phase was selected. Publish and
verify this build-delivery record without adding binaries or receipt-only commits.

## Full-chat recheck: CONFIG-01 detail still incomplete — 2026-10-03

Latest request is an audit/list/brief summary, not another package or feature phase.
[Full-chat reconciliation](../tasks/active/ui-design-review.md#full-chat-request-reconciliation--2026-10-03)
rechecked published `9208da8`, source `1d4bf14`, with a clean entry tree. One omission:
the accepted resolution mockup's aspect-ratio label and “Game resolution, not editor
size” caption are absent; invalid Custom dimensions get a misleading fallback shape.
The enlarged picker is present, so CONFIG-01 is partial. Complete this bounded detail
and focused valid/invalid/portrait preview check when continuing correction work.
Other original requests and A1–A9 remain represented in source. No code change or
new tests/native/SDK/package/workflow dispatch occurred in this audit. Earlier proof,
installed `01d0896`, unselected corrected installer and user-deferred Windows checklist
remain as below. Publish this meaningful audit correction; do not label all design
acceptance complete or create a receipt-only commit.

## Audit corrections completed locally; Windows deferred — 2026-10-03

Selected outcome: fix each A1–A9 issue and save specific tests for later Windows use.
Source checkpoint **`1d4bf147a120c1e0e8977b07f68f4cb6948e1473`**, parent
`41ddf2c755b334c4a291dc40a565628b2e440ce7`, on the existing
`feature/phase-1g-branches-runtime` branch. Fresh main remains `4d7ba03`; the separate
planning worktree remains `8a9da37`. PR #17 was rechecked OPEN, draft, CONFLICTING.
No reset, merge/conflict resolution, manual workflow or new phase occurred.

All nine audit fixes are implemented with focused local regressions; the
[correction record](../tasks/active/ui-design-review.md#audit-corrections-selected-and-implemented--2026-10-03)
and canonical UI/DATA_MODEL describe the behavior and owned-alias contract. Pointer
Beat dragging preserves native OS drop ownership; no HTML5/native handler conflict
is left in the implementation. Actual Windows WebView2 gestures are still unverified,
explicitly deferred by the user. The [12-row Windows checklist](../tasks/active/ui-design-review.md#deferred-windows-review-checklist--2026-10-03)
records concrete actions/expected outcomes and evidence fields; every Windows row
is DEFERRED, not passed.

Local evidence: frontend **78 passed**, routine release core **185 passed/40 ignored/
3 separately filtered**, desktop **1 passed**, web compilation, Rust format/diff and
repository validation (**322 files**) pass. Expanded existing Chrome regression passes
both themes/all six surfaces and audit cases: compact Choice/grouped button bounds,
all Variable type discard/reopen plus visible Boolean submission, Appearance retention
through Character save/default/view changes and decoded thumbnails, sidebar visible
focus/semantics, divider reset, pending Beat receipt/saved focus, captured real mouse
reorder/one Undo and Escape/outside/protected refusals. DOM checks also cover source
failure/input recovery, lost capture/blur/pointer cancellation, pending drafts and
media loading/read error/retry/cache behavior. Ignored logs/screenshots are under
`.toolchains/reports/ui-audit-fixes-*` and `ui-refresh/audit-fixed-*.png`. Browser fake
IPC receipts clone values to match native serialization. Preserve the documented
initial test/harness failures and real duplicate-CSS correction; no failure was waived.
The unchanged web chunk-size advisory remains. Existing flow/SDK acceptance is not
relabelled as proof of the changed candidate; no unrelated timing/SDK run was added.

Cumulative expensive totals remain **8 production packages; 44 native/boundary
starts; separately 4 explicit SDK menu starts**. This outcome added zero native app/
SDK starts, installer builds or manual hosted dispatches. Installed/retained Mac
`01d0896` is unchanged; it cannot demonstrate the new UI fixes. The fresh-project
bootstrap code/inputs are unchanged, so its earlier accepted launch remains separate
evidence. No automatic old-project GUI repair is selected.

Next user-selected step: a corrected Mac review installer, then resume at **Story**
and continue Source/Branches/Characters/Assets/Variables. Physical keyboard/IME, OS
asset drops, live SDK/detailed creation progress and final visual/UX approval remain
open; native Windows rows await a Windows host and corrected package selection.
Publish and verify the implementation and this coherent documentation checkpoint;
no receipt-only SHA-chasing commit. No autonomous Goal or client pause is claimed.
No manual operation or automation is pending. Repository quality may trigger on
publication; inspect its actual state once if relevant, without dispatching a duplicate.

## Earlier audit input (superseded by the correction record above)

## Review audit found incomplete corrections — 2026-10-02

Latest user outcome: compare changes against this chat and saved requirements.
[Audit A1–A9](../tasks/active/ui-design-review.md#chat-to-implementation-audit--2026-10-02)
supersedes the earlier full-completion claim. Reproduced: Choice action sizing/
grouping, Variable discard/type/default mismatch, appearance selection reset,
former-expression collision, invisible sidebar focus/missing semantics, divider
reset mismatch and new-Beat pending controls/focus. Media loading/error detail is
source-inspected; HTML5 Beat dragging conflicts with the configured native drop
handler on Windows according to pinned/official Tauri docs (no Windows reproduction).

Application source remains `e4013fa`; published audit input `ad6ad7f` matched fresh
local/remote refs. Main `4d7ba03` and planning worktree `8a9da37` remain unchanged.
Actual-renderer Chrome audit used synthetic data and deferred receipts; one exact
release core test with a temporary assertion passed (227 filtered), confirming
rename-back refuses with DiscoveryCollision. Temporary harness/assertions were
removed. Audit adds no permanent app/test changes, installer, SDK/native starts,
workflow dispatch or integration. Ignored logs/JSON/screenshots are under
`.toolchains/reports/ui-corrections-audit-*` and `ui-refresh/audit-*.png`.

Continue the existing selected correction scope: fix A1–A9 with focused rejecting
checks before packaging. Preserve native asset-drop ownership when correcting Beat
dragging; actual Windows verification requires Windows. Installer selection and
hands-on restart at Story follow correction. Original physical/IME/drop/live-progress/
final UX acceptance remains open. No manual workflow/automation is pending; PR #17
remains draft/open with recorded conflicts. Publish this documentation checkpoint;
do not dispatch a build/CI run or resolve conflicts for this audit.

## Earlier implementation and local evidence (completion claim superseded)

Source implementation checkpoint **`e4013fa76672205b9166bb97752da1aeb8856a86`**, parent
`27f1fe92bcb857237a627303e8e6f41d99f09769`, on
`feature/phase-1g-branches-runtime`. Publish and verify this checkpoint and the
coherent documentation closeout on the same branch. Preserve main `4d7ba0333c48d60242a9a42d3e079fea499a5531`
and the separate `codex/phase-2-3-planning` worktree at `8a9da37`.
Fresh PR #17 inspection: OPEN, draft, CONFLICTING; no integration/conflict resolution.

The [implementation record](../tasks/active/ui-design-review.md#review-corrections-implemented-and-locally-verified--2026-10-02)
owns the original local evidence; the audit above owns remaining omissions. Welcome/wizard/button,
Story/sidebar/chapters/drag, Source tabs, saved Branches routes, Runtime drawer and
Characters/Assets/Variables modal/media/name/selection corrections are implemented.
Appearance editing changes expression and/or image while preserving IDs/defaults,
patching recognized source tokens and committing companions together. Protected or
stale mappings refuse; original and prior imported images remain intact.

Final local checks: frontend **74/74**, routine release core **185 passed/40 ignored/
3 separately filtered**, focused review **7 passed**, exact authoring IPC **1 passed**,
macOS desktop check/test (**1 test**), web compilation, Rust format, diff and repository
validation (**322 files**) pass. Enforced observed-flow fixture passes **3 samples**:
initial 32.14–49.99 ms, refresh 31.24–38.29 ms, accepted update 20.83–27.37 ms.
Expanded Chrome regression passes both themes/all six surfaces and rejecting checks
for sidebar restoration, chapter collapse, Choice/modal bounds, Source active-file
reveal/overflow, stable geometry, rich-editor Undo, shipped smoke and busy contention.
Ignored reports/screenshots: `.toolchains/reports/ui-corrections-*` and `ui-refresh/`.
Browser fixtures and synthetic events are not native WebView/SDK/IME/drop acceptance.
The web build retains its existing large-chunk advisory; no build failure was waived.

Cumulative expensive totals remain **8 production package builds; 40 native scenario
starts + 4 boundary starts = 44**. The separately recorded **4 successful explicit SDK
menu test starts** are unchanged. This implementation adds zero installer builds,
native/SDK starts or manual CI dispatches. Bootstrap inputs are unchanged; earlier
SDK evidence is reused only for that path. Installed `/Applications/Loomlight.app`
remains the checksum-verified `01d0896`; the retained Mac DMG is under ignored
`.toolchains/review-builds/ui-refresh-01d0896/`. Earlier `d690d7f` both-target acceptance
and all failed/superseded run records remain below/in the task.

Next step needs user selection of a new corrected Mac installer, then resume at
**Story** before Source/Branches/Characters/Assets/Variables. Continue physical
keyboard/IME, OS asset drop, live SDK download/detailed creation progress and final
visual feedback; Windows native verification requires Windows. Do not use `01d0896`
to judge these new corrections. No automation/background correction work, manual
workflow/native package, old-project GUI repair, merge or new phase is selected.
Repository quality may run automatically on publication; record its actual state
if relevant without dispatching a duplicate or package matrix. No runtime/client
Goal pause state is claimed.

## Earlier implementation selection (completed; retained for scope provenance)

The user selected all suggested fixes in this chat, superseding the review-only stop
and the outstanding sidebar/Beat-drag approval. Incoming published checkpoint
`27f1fe92bcb857237a627303e8e6f41d99f09769` was preserved. No additional installer,
manual CI dispatch or integration was included in that implementation selection.

## User stopped hands-on review for now — 2026-10-02

The user says "i think we are done for now" after Variables feedback. Stop review
work; no automation or background continuation is selected. Incoming published
checkpoint: `ab68b098a21fb23fe59a8394343794d8467d844f` on the existing feature branch.
The [review pause record](../tasks/active/ui-design-review.md#hands-on-review-stopped-for-now--2026-10-02)
owns outstanding findings and limits. All accumulated corrections remain pending;
do not mark the UI fully accepted or infer unreported Variables/physical-input/
OS-drop/live-progress checks passed. Reuse corrected Mac installer `01d0896`.
No workflow or build is pending; PR #17 remains draft/open with recorded conflicts.
No merge, conflict resolution, new phase or further build/dispatch is selected.
Next user-directed continuation: choose correction implementation scope or resume
remaining review, inspecting fresh refs and preserving both worktrees. This final
documentation checkpoint adds zero app/SDK/native starts or builds/dispatches.
No autonomous Goal/client pause state is claimed or changed.

## Latest Variables findings — 2026-10-02

[VARIABLES-01 and CATALOG-03/04](../tasks/active/ui-design-review.md#variables-naming-and-shared-catalogue-affordances--2026-10-02)
record macOS capitalization of Variable names, consistent technical-name handling
across all three supporting surfaces, visible inspector Close X and contextual
naming tooltips. Name-only Variable selection extends existing CATALOG-02.
Code confirms Variable creation bypasses the helper already used by Characters/
Assets in `01d0896`; no correction or rejecting test has yet been performed.
Keep display names/text values and existing source identifiers unchanged; explain
Loomlight's lowercase/64-character contract separately from Ren'Py syntax.
Next: remaining Variables type/default persistence and known-assignment feedback.
Incoming checkpoint `a3985ae`; preserve branch/worktrees. Review docs only; no new
app/SDK/native starts, build or dispatch. Wider corrections/approval remain pending.

## Latest Assets findings — 2026-10-02

The user is reviewing Assets. [ASSETS-01/02 and CATALOG-01/02](../tasks/active/ui-design-review.md#assets-categories-drop-target-and-supporting-workspace-modals--2026-10-02)
record persistent top category filters, a compact visible image drop target,
creation-details modals for Characters/Assets/Variables and whole-card/list-row
selection. One explicitly requested read-only subagent researched official Carbon,
Spectrum and Creative Cloud examples. Proposed Drop/Browse opens the same staged
import modal; original files and existing transaction/partial-success contracts
remain intact. The user confirms separate Music/Sound effects categories and the
same modal style for creation and editing (Characters, appearances and Variables).
These design decisions are recorded; implementation remains pending.
No application code or project data changed. Next: remaining
Assets feedback, then Variables; do not infer complete acceptance from thumbnails.
Incoming published review checkpoint is `33c62f5`; worktrees preserved.
Reuse `01d0896`; no new app/SDK/native starts, builds or dispatches. Earlier
Characters/Branches/Source/Story corrections and sidebar approval remain pending.

## Latest Characters findings — 2026-10-02

Latest user results: search/Grid-List switching and Edit Character persistence
pass on Mac. Set default persists, but its image loads only after leaving/re-entering
Characters; CHARACTERS-01 remains open for immediate refresh. CHARACTERS-04 adds
compact aligned list rows and direct row/card Edit through the existing form. The
latest supplied screen is Characters/list mode, not the earlier observed Assets
view. These are recorded corrections only; no additional app changes or runs.

[CHARACTERS-01/02/03](../tasks/active/ui-design-review.md#characters-preview-and-appearance-controls--2026-10-02)
record a failed inspector image despite a rendered card, appearance rows lacking
selection/preview and per-appearance Edit. Preview loading/request ordering is a
hypothesis awaiting a rejecting test; default-only rows and the absent update API
are confirmed in code. The user selects both expression/name editing and image
replacement. Those requirements are recorded; no app changes selected/performed. Live read-only
AX previously found the user in Assets with both imports available; the latest
user screen is back in Characters. Do not infer full Assets acceptance. Continue
feedback from their selected surface. Fresh feature refs matched `569d57d`, main unchanged. Zero new launches,
native/SDK cases, builds or dispatches; reuse `01d0896`. Prior corrections/blockers
and sidebar/drag proposal approval remain pending.


## Current review surface — Branches, 2026-10-02

The user accepts pan/zoom/Fit for now but requests further refinement; record
provisional Mac usability, not final polish. Open Scene / View origin in Source
navigation is confirmed correct. Missing connections and popup dismissal remain
open. Next planned review surface: Characters; no app navigation by the agent.

[BRANCHES-02](../tasks/active/ui-design-review.md#branches-detail-popup-dismissal--2026-10-02)
adds a pending detail-popup correction: visible header X, Escape dismissal and
focus return. Native read-only reproduction confirms no internal Close and Escape
from the graph does nothing; the toolbar Scene details toggle currently hides it.
The agent used that toggle to close the popup and left Branches/Saved unchanged.
No project edits or new runs/builds/dispatches. Continue feedback gathering.

[BRANCHES-01](../tasks/active/ui-design-review.md#branches-saved-routes-missing--2026-10-02)
is a confirmed functional blocker: four disconnected Scene cards despite saved
entry/jump/three-choice routes. Native read-only Source inspection confirmed the
normal router and literal mapped routes; explicit Refresh still reports incomplete
flow. Likely cause is the label collector treating SDK screen-language UI `label`
controls as uncertain story declarations, blocking destination resolution. A focused
rejecting regression/correction is still pending; no source/parser edit or build was
selected or performed. Return state is Branches/Saved. Existing project content was
not altered or executed. Fresh feature refs matched `42c4df6`, main unchanged.
Continue Branches feedback, retaining remaining Source/Story acceptance. Reuse
`01d0896`; no new launch, native/SDK case, package or dispatch. Wider corrections
and sidebar/drag approval stay pending; no integration or new phase selected.


## Current review surface — Source, 2026-10-02

The user moves to Source and records [SOURCE-01/02](../tasks/active/ui-design-review.md#source-tab-presentation-and-active-file-visibility--2026-10-02):
visually attach Close X to its script tab; contain overflowing open tabs, expose
scroll/open-files controls and automatically reveal the newly opened active tab.
Keep the corresponding file row selected and preserve editor/draft state. These
are pending corrections, not implemented or verified. The user says the latest
opened file should have focus in the file bar; this supports the active-tab reveal
proposal. A tabs-versus-left-list overflow clarification remains optional. No Story
acceptance is inferred merely from moving to Source. Continue Source feedback,
retaining the remaining Story and physical input checks. Reuse `01d0896`. Only docs
changed; zero new app/SDK/native starts, builds or dispatches. Fresh feature refs
matched `fc8e0e1`, main unchanged; earlier sidebar/drag approval remains pending.


## Latest runtime review — 2026-10-02

The [runtime-panel finding](../tasks/active/ui-design-review.md#runtime-panel-feedback-and-earlier-project-launch--2026-10-02)
records RUNTIME-01: visible header Close icon, concise persistent error summary,
expandable technical details and Advanced controls. This correction remains pending;
the prior sidebar/drag proposal still awaits approval. The repeated GUI-image
exception is from the earlier project reopened, explicitly confirmed by the user.
The user has now created a fresh project and reports "new project works fine".
Record positive Mac hands-on acceptance of the fresh project flow alongside the
existing SDK bootstrap/menu evidence; continue Story review. Installed Applications executable matches corrected `01d0896`; existing project
assets are not regenerated by updating the app. No fresh-project failure is inferred
and no project repair occurred. Continue Story in the fresh project using
the same installer, preserving the earlier project. An existing-project repair
requires separately selecting that operation. Only docs changed; no new build,
app/SDK/native starts or dispatch. Fresh feature refs matched `e84cec9`, main
unchanged; preserve branch/worktrees. No workflow or integration pending.

## Latest UI proposal — 2026-10-02

The user requests subagent examples and approval before changing sidebar controls,
Beat dragging, chapters and Writing focus. Two read-only subagents completed that
review. The [concrete proposal](../tasks/active/ui-design-review.md#sidebar-controls-beat-dragging-and-writing-focus-proposal--2026-10-02)
records STORY-05 (independent top-of-panel icons and hide-all/restore Writing focus),
STORY-06 (left dot grip, one transactional reorder/Undo) and reaffirmed STORY-04
(chapter disclosure). Twelve earlier corrections stay pending; the two added
proposals await approval. The reported navigation/tree coupling is confirmed in
shared CSS, not the navigation state toggle. No application code changes, launch,
build, verification run or dispatch occurred. Reuse installer `01d0896`; counts and
Windows limits below are unchanged. Fresh feature refs matched `b4d6c05`, main
unchanged; preserve the existing branch and separate planning worktree. Next:
user approval of this proposal, then only the explicitly selected implementation
and verification scope. No workflow pending, conflict resolution or merge selected.

## Latest selected correction — 2026-10-02

**Bootstrap follow-up complete:** the user requested double-checking fresh-game
creation. The strengthened exact official-SDK regression passes on Mac: one selected
test, zero failures/skips, 221 filtered, 14.59 s; two disposable projects, 1280×720
without Git and 1600×1000 with Git. Generated files/GUI assets, SDK pin, initial
Chapter/Scene, valid Git repository and reopening pass. Real SDK execution checks
dimensions/title/build name, Preferences/Load/Save, starter dialogue and return to
main menu; the custom game runs with editor metadata removed. No additional defect
found. Only tests/docs changed; use the same `01d0896` installer below. This adds two
successful SDK menu test starts (four total), zero packages/packaged starts/dispatches.
Full log: ignored `.toolchains/reports/starter-bootstrap-follow-up.log`. Fresh feature
refs matched `3fad28f`, main unchanged, PR #17 still draft/open/conflicting; the
separate milestone-planning worktree is preserved. Continue fresh-project Story
review and the remaining acceptance; Windows proof for the fixes remains open.

The user explicitly requested fixing the Character/Background authoring error and
one new local macOS ARM64 review build, then restarting at Story. They additionally
reported a game startup exception for missing standard GUI button images; this is
included before the same package. This supersedes the earlier review-only build
restriction for those two blockers. Twelve accumulated visual corrections remain
pending. No CI dispatch, Windows package, conflict resolution, merge or new phase.

Follow the existing [blocker record](../tasks/active/ui-design-review.md#characterbackground-authoring-blocker--2026-10-02).
Canonical new-name input normalization and the missing pinned-SDK `gui_images`
generation step are implemented. Frontend 71/71, UI-refresh browser, routine core
179 pass/40 ignored/3 separately filtered, exact authoring IPC create/import/reopen,
and exact SDK lifecycle/menu/first-dialogue checks pass. Earlier harness failures
remain recorded. Candidate **01d089624ca2113db673116561b8ba0298216cb5** is now packaged:
one local Mac app + DMG build; enriched native UI-refresh **PASS**, 9 checks, 5.07 s,
exit 0, one report, cleanup complete. Installer is
`.toolchains/review-builds/ui-refresh-01d0896/Loomlight_0.1.0_01d0896_aarch64.dmg`,
SHA-256 `109758abbc8119e6f41a3708af07b6371eb2e4bc544822eeb3c142130bfeb16c`.
Checksum/BUILD metadata and retained app accompany it; full local reports are ignored.
The first package command was rejected before build due to argument placement; the
corrected command produced the sole build. Cumulative production builds 8, packaged
scenario starts 40, plus unchanged four boundary primary/secondary starts = 44.
No manual workflow dispatch or Windows check. Preserve the original qualified
installers/run below; their Windows evidence does not qualify these changed inputs.
Existing project GUI files are not overwritten or regenerated on opening. After
installing, create a fresh disposable project and resume Story, including default-
colour Character creation, uppercase-file Background import and Run Game. The old
app was closed normally after Stop with Saved status for isolated package checking.
It has not been replaced in Applications by the agent. Finish by installing the
retained new DMG and resume hands-on review in this chat; no workflow is pending.

## UI implementation continuation — 2026-09-30

**State: automated qualification PASS; review builds ready.** No workflow is pending.
The user explicitly requested continuation in a new chat on 2026-09-30. Reuse
`feature/phase-1g-branches-runtime`, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17). Main remains
`4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration/conflict resolution is selected.
Published terminal-audit checkpoint: `ad97c6c7388cdf4e866a80e5015a1d22d5e91a98`.
Inspect fresh refs and preserve newer work; do not reset to this historical checkpoint.
This audit changes documentation only; it does not change tested application inputs.

### Hands-on review resumed — 2026-09-30

Current chat resumed review on local macOS ARM64. Fresh local/remote feature heads
matched incoming `b8301f8`; main and PR #17's draft/open/conflicting status were
confirmed unchanged. All three existing review installers passed their recorded
SHA-256 checks. Use the `ui-refresh-d690d7f` ARM64 DMG on this Mac; copy its app to
Applications and launch that copy after closing any older running Loomlight.
The [hands-on review preparation](../tasks/active/ui-design-review.md#hands-on-review-preparation--2026-09-30)
records the focused checklist and finding format. Begin Welcome/four-step wizard
comparison, then Story/Source and the remaining surfaces against the saved references.
Physical keyboard/IME, OS drop, live download/create progress and final visual feedback
remain open on the applicable targets; Windows observations require Windows access.
No installer was launched by this preparation and no acceptance result is inferred.
No workflow is pending; this docs-only continuation adds zero builds/native starts
and grants no additional dispatch, implementation, conflict resolution or merge.
Publish the preparation after repository/whitespace validation; continue in this chat
with the user's actual observations rather than transfer again.

**Latest user feedback:** Welcome in Light theme has three recorded corrections:
Settings needs a cog and clearer button affordance; intro and Recent Projects need
distinct background tones; available recent projects need hover colour feedback.
The [Welcome findings](../tasks/active/ui-design-review.md#welcome-feedback--2026-09-30)
retain source observations and completion checks. Corrections are pending, not
implemented or accepted. Continue gathering the user's screen-by-screen feedback
in this chat using the existing installer. No new build/dispatch or integration is
selected; remaining physical input/drop/live progress acceptance stays open.
The user has now opened wizard step 1; read-only native inspection records
[WIZARD-01](../tasks/active/ui-design-review.md#project-details-initial-inspection--2026-09-30),
the step-rail background ending early. The user confirmed it should extend to the
bottom of the entire wizard box, with the labels staying at the top; correction is
pending implementation. The user reports generated folder name, independent folder
editing and exact destination preview all work on this Mac. Fresh read-only observation
finds step 2, compatible managed SDK 8.5.3 selected. Next: review SDK presentation,
then Game configuration using that selection. No input/navigation, installation or
creation was performed by the agent; live download and other acceptance remain open.
Latest SDK wording correction: [SDK-01](../tasks/active/ui-design-review.md#sdk-wording-feedback--2026-09-30)
replaces "Browse existing SDK" with "Select existing SDK…" in the accumulated
corrections, pending implementation. Selection/validation behaviour stays the same.

The user accepted
[CONFIG-01](../tasks/active/ui-design-review.md#accepted-resolution-picker-correction--2026-09-30):
a larger readable resolution dropdown with a small dynamic aspect-ratio preview and
retained Custom Width/Height fields. The final mockup is saved/hash-recorded in the
existing reference set. All seven accumulated visual/wording corrections remain pending
implementation; design approval does not select another build/dispatch. Remaining
acceptance/budgets are unchanged.

**Previous review position:** Review & Create, step 4. The user requests
[REVIEW-01](../tasks/active/ui-design-review.md#review--create-checkbox-feedback--2026-09-30):
align the Git checkbox to the left of its label on one row inside Advanced, retaining
its value/behaviour. No project creation occurred during agent inspection. Next:
finish summary feedback and observe actual creation progress. Resolution preset/Custom
input checks are still unreported; reaching step 4 is not inferred acceptance.

**Current review position — 2026-10-02:** Story in the created disposable project.
The user reports rapid generation with no issues noticed; native read-only observation
confirms workspace entry with starter Narration/Return Beats. The
[creation/Story record](../tasks/active/ui-design-review.md#creation-observation-and-story-review--2026-10-02)
limits the pass to this fast successful Mac path; detailed progress stages were not
separately assessed. Next: Story layout, inline editing with physical input, commit/
undo, status stability and remaining Story feedback. Twelve recorded corrections remain pending;
no additional build/dispatch or integration is selected. Existing evidence/budgets
are unchanged; no agent project edits or new launches occurred.
Latest [Story feedback](../tasks/active/ui-design-review.md#story-controls-and-choice-layout-feedback--2026-10-02)
selects removal of the redundant Preview size slider (retain accessible divider
resizing), a normal-sized Create New Scene action with its form beneath the Choice
options, and a shared button consistency pass. The user's Choice creation form is
open with unsubmitted input; preserve it. These corrections are recorded for later
implementation; no new build/dispatch is selected. Continue Story feedback before
physical editing/commit/undo and Source; no acceptance is inferred from the screenshot.
The [follow-up Story record](../tasks/active/ui-design-review.md#choice-overflow-and-single-new-beat-confirmation--2026-10-02)
confirms horizontal overflow in the Choice form and adds STORY-03: confirming the
Add Beat form should save once and return a collapsed saved Beat, without immediately
reopening a Commit Beat editor. Source already inserts on the initial confirmation;
the automatically reopened editor causes the redundant confirmation affordance.
Preserve active drafts/failure retention; this remains a pending correction, no build.
Latest [chapter/Writing focus feedback](../tasks/active/ui-design-review.md#chapter-disclosure-and-writing-focus-feedback--2026-10-02)
accepts Writing focus for the reviewed Mac UX and adds STORY-04: individual chapter
collapse/expand controls that preserve the selected scene/editor and pending input.
Physical typing/IME and editing/commit/undo results are still unreported; next continue
those Story observations and Source review. No new application/build work is selected.

### Exact successful qualification

[Run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
attempt **1**, workflow `production-scaffold.yml`, input `upload_packages=true`, tested
**d690d7f8ffc08fbc76411c95147f04422620afbc**, tree
`0948ced672f8c95c16df74c5da52d7c6d9212c77`. Created 2026-09-30 02:52:15 UTC;
completed successfully 03:12:29 UTC. Preflight job **109718037425**, macOS ARM64
**109718361890**, Windows x64 **109718361892** all passed.

Both targets passed all **six packaged native cases**: compile, lint, route-a, route-b,
runtime-error, ui-refresh. Every case has one passing report, exit 0, no timeout and
confirmed cleanup. Both packaged boundary smoke checks passed, including Source Save,
recovery/conflict paths, authoring, navigation/webview restrictions and single-instance
secondary refusal. Other required frontend/browser/core/SDK/desktop/build/privacy/
dependency-inventory gates passed. SDK fetch alone was skipped due to verified archive
cache hits, which does not prove live first-install UI progress. Preflight: 70 frontend
tests; routine core Mac 178 passed/39 ignored/3 separately filtered; Windows 173/36/3.
Separate flow, lifecycle, SDK handoff, runtime service/diagnostics and desktop gates
passed 1/0 ignored each. Exact case times, identities and retained limits belong in the
[terminal audit](../tasks/active/ui-design-review.md#third-qualification-terminal-audit--2026-09-30).

The previously failing Windows UI-refresh case now passes (11.907 s), as do both
Windows route cases and Mac route-a. This verifies the corrected behavior on both
native targets; the original sparse Windows failure report still cannot prove which
individual correction eliminated its timeout. Earlier failures remain preserved.
The local 3/3 native Mac proof at `996737c` remains separate supporting evidence.

### Review packages and evidence

| Target | Successful package artifact | Evidence artifact |
| --- | --- | --- |
| macOS ARM64 | `11075500136` / `phase-1-production-package-macos-26` | `11075380277` |
| Windows x64 | `11075580402` / `phase-1-production-package-windows-2025` | `11075655302` |

All four artifacts were available/unexpired at audit; retention ends 2026-10-07 UTC.
Manifests match candidate/tree/run/attempt; retained binary hashes, Mac tar executable
and input-manifest digest were verified. Installer hashes are recorded in the ledger
and local `SHA256SUMS.txt`. Local review copies are under ignored
`.toolchains/review-builds/ui-refresh-d690d7f/`:

- `Loomlight_0.1.0_aarch64.dmg` for macOS ARM64.
- `Loomlight_0.1.0_x64-setup.exe` for Windows x64; MSI alternative alongside it.

Full downloaded reports/logs/binaries remain in ignored
`.toolchains/reports/ui-refresh-ci3-audit/`. None of these downloaded binaries was
installed or launched during this audit. Open the DMG or run the Windows installer
for review; preserve normal OS distribution limitations already recorded in the project.
Do not rebuild unchanged validated inputs merely for documentation or delivery.

### Remaining scope and allowance

Next step is focused human review of the accepted UI and outstanding actual-device
checks: physical keyboard/IME, actual OS asset drop, live SDK first-install download
progress and project-creation progress. Automated/synthetic native evidence does not
close those rows. The [UI task](../tasks/active/ui-design-review.md) and saved
[mockups](../design/ui-refresh/README.md) retain approved scope. No merge, conflict
resolution, new feature phase or new test/build dispatch is authorized. Do not archive
the task as fully accepted while these rows remain open. The next chat should read
CURRENT, this handover, the relevant UI task sections and saved mockup index, then
help the user review the existing verified builds. Start with review priorities and
feedback; transfer alone does not authorize another build, native test or CI run.

Cumulative refresh: **three hosted dispatches**, attempt 1 each; **seven production
builds** (six hosted, one local), **39 native scenario starts plus four boundary-smoke
process starts = 43 top-level starts**, plus the separate early Mac debug build/launch.
Third run contributed two builds, twelve scenarios and four smoke processes (primary
and rejected secondary on each target). No attempt rerun, duplicate dispatch or native
case retry. The rejected local CLI invocation before compilation stays separately
recorded. All selected allowances are consumed; this audit added no build/launch.
Prior Q1 counts remain separate. No autonomous Goal or client pause is claimed.

Toolchain: source `.toolchains/enter-macos.sh`. Repository/link/privacy validation and
whitespace checks pass at publication. Publish this meaningful terminal audit and
provide the verified review installers; no receipt-only follow-up commit is needed.

## Preserved Phase 1G delivery handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Incoming published head:** `a2098c361049b360c889129e8dfc0cca90b042a7`.
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.
**This update:** outcome-sized goals, same-thread waiting and review-delivery scope;
`review_ready`, documentation only. Resolve publication SHA from Git; do not create
another commit solely to record this document's own SHA.
**No operation is pending.** No client pause state was changed or verified here.

## Completed policy update

One approved outcome now contains small internal checkpoints, ordinary verification,
self-review and bounded corrections. Commits/checkpoints do not force new chats.
Record meaningful changes; update the existing handover before a real pause, transfer
or completion rather than after every minor step. Read relevant sections and changed
state, not the entire history on each continuation. [WORKFLOW](../WORKFLOW.md) owns
these rules; the [change record](../tasks/active/phase-1g-review-delivery.md#workflow-update-record--2026-09-28)
records the review and validation limits.

Workflow waits preserve the same goal, thread, run identity and cumulative budgets.
The user resumes manually after completion; check actual run status/evidence before
continuing. In autonomous Goal mode, use the client's real user/system pause control;
a prose reply or `awaiting_ci` record does not prove that the runtime paused.
No automatic watcher/wake-up, client-database changes or W0/OPT-1A work is selected.
Specific review-only limits, approvals, no-retry rules and independent reviews remain.

## Preserved qualification

Q1 automated qualification remains PASS / `review_ready` at candidate
`8546dcddd5ac95bfe849575fe618f6e990cdd5d4`, tree
`70ba924580bde3a66678e0ca91e1ae54fc241325`.
[Run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820),
attempt 1, completed successfully at 2026-09-28T06:06:35Z on both supported targets.
The [terminal audit](../tasks/active/testing-policy-alignment.md#q1-terminal-evidence-audit--2026-09-28)
and [1G ledger 41](../tasks/active/phase-1g-branches-runtime-git.md#41-q1-terminal-evidence-audit--automated-pass--2026-09-28)
retain exact jobs, counts, hashes, samples and limitations. This policy edit is not a
new qualification candidate. Original executable hashing belongs to that audit;
this update checked artifact metadata and the recorded identities, not binary contents.

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Q1 core/browser and packaged reopen pass on both targets | MAC-N1 supporting limits retained; Windows/native and final acceptance open |
| Runtime foundation / R1 | Yes, corrections retained | Q1 final-source SDK service/diagnostics pass on both targets | Final native/human acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Q1 standard packages and ten Runtime cases pass | Focused final user session per supported OS open |

Q1 totals remain two requests (one rejected, one accepted), zero retries, two Tauri
builds and fourteen top-level starts. R2-P1/H1 FAIL and WIN-F1/MAC-N1 limits remain
unchanged. This documentation update adds zero executions. Phase 1F acceptance and
DIST-MAC-01 distribution limitations remain in their original evidence.

## Review builds and next outcome

[REVIEW-DELIVERY-1](../tasks/active/phase-1g-review-delivery.md) replaces the old
preparation-only next prompt: deliver usable builds early, perform available bounded
Windows native checks and prepare the focused final user session. Starting the prompt
selects execution; no native check or build was performed by this policy update.
The linked brief owns continuation over superseded next-step text in historical ledgers.

Use the existing Q1 production artifacts, available/unexpired at this update:

| Target | Artifact | Installer recorded by terminal audit |
| --- | --- | --- |
| Windows x64 | `10953334429` / `phase-1-production-package-windows-2025` | `Loomlight_0.1.0_x64-setup.exe` or `Loomlight_0.1.0_x64_en-US.msi` |
| macOS ARM64 | `10954061304` / `phase-1-production-package-macos-26` | `Loomlight_0.1.0_aarch64.dmg` |

Evidence artifacts: Windows `10953757230`, Mac `10954175758`. Retention ends
2026-10-05 UTC; recheck before delivery. Prefer the retained Mac tar when bundle
permissions matter. Copies reported on the previous audit host are not assumed
accessible here. This update did not download or install the binaries. Package links
and exact recorded installer hashes belong in the delivery brief and final response.

Codex may deliver artifacts on any capable host. Local Windows x64 is recommended;
actual Windows native access and a proven driver are required for native evidence.
Missing access blocks that evidence row, not package delivery. Preserve final user
sessions on both OSes. No new hosted matrix, conflict resolution, merge, 1H or feature.

```text
/goal REVIEW-DELIVERY-1: prepare Loomlight for my review
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Local Windows x64 recommended. Any host can deliver packages; Windows native access and a proven input driver are required for Windows native evidence.
Test execution: Reuse Q1 packages; bounded Windows native checks and focused final user review on Windows x64/macOS ARM64. No new hosted matrix.
Reason: Deliver usable builds and finish available review preparation as one outcome.
Read AGENTS.md, docs/status/HANDOVER.md and docs/tasks/active/phase-1g-review-delivery.md. Inspect fresh refs/ownership; preserve newer work. Retrieve the existing Windows/Mac packages from run 36383551820, attempt 1, verify their identity and provide local files, hashes and launch instructions. Do not rebuild for docs; follow the brief's single local Windows fallback only if its package is unavailable/unusable.
Prepare disposable fixtures, perform the bounded Windows checks where access is verified, and provide one focused user checklist per OS. Missing native access must not withhold an available build. Review and publish the evidence and handover. Use internal checkpoints, not replacement goals. Pause for my review; resume the SAME goal/thread on my command through the client's actual control. Keep cumulative budgets and explicit approval boundaries. No automatic polling, retries, new matrix, conflict resolution, merge, 1H, optional Git or Phase 2.
```
