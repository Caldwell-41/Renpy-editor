# Current status

**Updated:** 2026-10-06.
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.

## Live continuation

**Both-platform acceptance Pass / separate integration ready — 2026-10-06.**
Corrected [production 37461862928](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37461862928),
**attempt 1**, tested **`c137b6706ed2dc05aac8dfe692689829c785a52a`**, and
[quality 37461858768](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37461858768)/1
Pass after actual gate/artifact audit. Both hosts: named official SDK/service/diagnostic,
browser functional/evidence, desktop, packaged WebView/single-instance/privacy/inventory
gates and **all 6 runtime cases/cleanup** Pass. All **132 inputs match both manifests
and corrected carrier**: **11 changed / 121 unchanged** versus baseline, only one
`#[cfg(test)]` lifecycle input beyond frozen runtime `ee5f55e`. No runtime/UI change.

| Acceptance | Status |
| --- | --- |
| Windows/Mac selected native/human review | **Pass**; Windows “all working, happy”, Mac “all working”; Mac 293 cancellation hashes unchanged, original 3,227 profile hashes restored; Windows profiles previously restored |
| Retained packages/manifests | **Pass**; four artifact ZIPs verified/downloaded beyond 2026-10-13 expiry, tested EXE/app-tar and NSIS/MSI/DMG hashes verified; mounted Mac DMG executable equals tested ARM64 app |
| Integration / Phase closure | **Not performed**; PR #17 draft/open/conflicting; main `4d7ba03` and planning `2c5a164` untouched; 1G closeout/1H remain separately selected |

Initial final 1/1 and correction dispatches 4 consumed. Current run 2 builds/16 packaged
starts; final qualification series **6 builds / 46 starts**. Local Mac 19 builds/77 starts/
7 SDK menus, Windows 6 production + 1 unqualified/4 failed setup/21 starts/0 SDK menus unchanged.
All prior failures retained. Mac Chrome timing diagnostics remain Fail under existing
policy; functional/native/package acceptance Pass. No notarization/signing claim.
No owned app/game/profile/CI wait remains, no extra matrix/retry/automation.
**Next:** separate integration chat for PR #17 conflicts/review, exact integrated-tree
affected/required checks and reviewed merge/1G closeout when selected. **1H not_started**,
entered after integrated 1G and explicit selection. Exact package identities/evidence:
[handover](HANDOVER.md#both-platform-acceptance-and-integration-handover--2026-10-06),
[terminal ledger](../tasks/active/ui-design-review.md#both-platform-terminal-acceptance-and-transfer--2026-10-06).

### Earlier corrected qualification wait (terminal Pass supersedes)

**Corrected qualification awaiting_ci — 2026-10-06.** Necessary test-only lifecycle
alignment/local official-SDK Pass is published at exact tested carrier
**`c137b6706ed2dc05aac8dfe692689829c785a52a`**. User **“Go ahead”** authorized one
corrected set: default [quality 37461858768](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37461858768)
required steps **Pass**; [production 37461862928](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37461862928),
`upload_packages=true`, **attempt 1**, **in_progress** at **2026-10-06 12:14:51 UTC**.
Both SHA/branch/event/attempt confirmed. **132 updated inputs**, **11 changed / 121
unchanged** versus baseline; only lifecycle test differs from frozen `ee5f55e`, runtime
code unchanged. All six native/human cases and restored profiles retain acceptance.

Prior **37459347476/1 Fail** and verified failure artifacts retained; initial **1/1**,
correction dispatches **4** consumed. No further retry/matrix authorized; local counters
unchanged, current remote build/start counts await actual evidence. Stop model polling;
manual same-chat resume to audit exact corrected run, six cases per host, all required
SDK/service/browser/boundary/privacy/cleanup gates, matching updated manifests and
retained packages. Combined acceptance remains open; final integration is separate.
[Exact wait/continuation](HANDOVER.md#corrected-qualification-wait--2026-10-06),
[ledger](../tasks/active/ui-design-review.md#corrected-qualification-wait--2026-10-06).

### Earlier qualification failure (corrected run now pending)

**Combined qualification Fail / test-only correction ready — 2026-10-06.**
[Production 37459347476](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37459347476),
attempt **1**, exact SHA `88016acb40caa036a946ef31795ca61235e5ce6d`, fails on both
targets before packaging. Quality/Preflight, ordinary core, fixed observed budgets
and browser functional/evidence gates Pass; all six packaged cases and required
downstream SDK/boundary/privacy/cleanup/package evidence remain Unavailable.

**QUAL-IMPORT-01:** old lifecycle assertion expects a recovery blockage for an
ordinary changed selection, contradicting the accepted pre-staging refusal. Necessary
test-only correction now checks refusal, unchanged bytes/recovery count, Saved/flush
and one successful reselection. Corrected real-SDK Mac gate **1 Pass / 0 Fail /
0 ignored**, **45.74s**, all required markers; first optional-fixture-file assertion
failure retained. No production implementation change; **131/132 frozen inputs
unchanged**, only `#[cfg(test)]` lifecycle input differs. Six native/human results
and original profile restoration remain Pass; no physical retest needed.

Both failure artifacts/logs/hash-verified archives retained, no production package
was built. Local build/start counts unchanged; initial **1/1** and **3 correction
dispatches** consumed. User **“Go ahead”** authorizes **one further corrected
Windows/macOS qualification**. No workflow pending or new dispatch yet. **Next:**
publish corrected carrier, dispatch existing quality/production once and record exact
run/attempt/SHA before manual same-chat waiting, then terminal evidence audit;
combined acceptance/integration still incomplete. PR #17 conflicts/merge and 1G/1H
closure untouched. Exact failure and correction:
[ledger](../tasks/active/ui-design-review.md#qual-import-01-qualification-audit-and-test-alignment--2026-10-06),
[handover](HANDOVER.md#combined-qualification-failure-audit--2026-10-06).

### Earlier qualification wait (terminal failure supersedes)

**Mac acceptance Pass / combined qualification awaiting_ci — 2026-10-06.** User's
held-grip feedback **“all working”**, native Saved/Undo and Redo disabled, and all
**293 cancellation-only hashes unchanged** complete the sixth focused check. All six
Mac cases Pass in selected native/service/controller/human scopes. Original profile
**3,227 hashes restored/identical**, review profile retained, app/game absent and
temporary external media restored. No application changes or new local starts/builds.

All **132** inputs equal frozen `ee5f55e` (**10 changed / 122 unchanged** versus
`5b467a4`). Exact local Mac/Windows binary identities remain recorded below; later
docs commits do not replace them. The ten changed inputs justify **one coherent
required Windows/macOS qualification**: default repository quality plus production
`upload_packages=true`, no optional diagnostics or duplicate matrix. Workflows unchanged;
initial 1/1 preserved; correction dispatches now **3**. One new production plus default
quality request accepted once at exact tested carrier
**`88016acb40caa036a946ef31795ca61235e5ce6d`**, attempt **1**:
[quality 37459343661](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37459343661)
required steps **Pass**;
[production 37459347476](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37459347476)
**in_progress** at **2026-10-06 11:53:09 UTC**. No terminal combined acceptance yet.
Audit actual SDK/service/browser/boundary/cleanup gates, all six runtime cases per host,
run/attempt/SHA, matching manifests and retained scanned packages before claiming
combined acceptance. Stop model polling; user resumes this ordinary chat to audit
the recorded production run, no automatic retry or new dispatch. Final integration
remains separate. Later docs publication does not replace tested candidate identity.
Exact evidence/budgets: [acceptance ledger](../tasks/active/ui-design-review.md#bounded-mac-acceptance-and-combined-qualification--2026-10-06)
and [handover](HANDOVER.md#mac-acceptance-and-combined-qualification--2026-10-06).

### Earlier Mac held-grip handoff (completed)

**Bounded Mac follow-up — awaiting one physical held-grip check, 2026-10-06.**
No application changes. All **132** app/workflow inputs match frozen `ee5f55e`;
**10 changed / 122 unchanged** versus qualified `5b467a4`. One native ARM64
production candidate retained; sealed EXE SHA256
`98841d7d2db6440ae2e0664b272bb1a3afd72e04a591ec80f9956dbe4ad39524`.
Default DMG-step/resource-signature failures preserved; same compiled bundle ad-hoc
sealed/repacked, strict identity/mounted equality Pass. No notarization claim.

Agent checks Pass: renderer **46/46**, selected-media service **2/2**, desktop **1/1**,
three packaged probes with cleanup true; native Source Run/draft inventory, import
and replacement refusal/reselection/partial no-replay, shared previews and import
preview presentation. Temporary external bytes restored. Only held lower/upper-edge,
toolbar/outside bounds and Escape needs human input: documented driver cannot hold
the mouse button. Regression coverage Pass; physical observation remains Unavailable.

Candidate PID **44272** is Saved on disposable Story → Scene 1, **63 Beats**, details
closed. **293-file cancellation-only** baseline retained; Escape before release.
Protected original profile **3,227 hashes unchanged**, disposable profile active;
restore after session/app absence. Cumulative Mac **19 builds / 77 starts / 7 SDK
menus**, three native game launches separate; Windows counters unchanged.
**Zero new remote dispatches.** After physical Pass/hash audit/profile restoration,
publish Mac acceptance and run one justified changed-input required Windows/macOS
qualification; manual same-chat waiting, no duplicate matrix or automation. Separate
integration remains pending; PR #17 conflicts/merge/1G/1H closure untouched.
Exact identities, failures and continuation: [Mac ledger](../tasks/active/ui-design-review.md#bounded-mac-frozen-candidate-follow-up--2026-10-06)
and [handover](HANDOVER.md#bounded-mac-follow-up-checkpoint--2026-10-06).

### Earlier Windows frozen handover (completed)

**Windows review frozen / Mac follow-up ready — 2026-10-06.** User's final Welcome
hover/readability and session feedback: **“all working, happy.”** All 14 WIN-UI rows
Pass in the selected native/physical/rendered scopes; higher DPI remains Unavailable/
user-excluded, Narrator/full native permutations minimized, agent-native English
evidence is not a physical-human keyboard claim. Final 242 project-file hashes
unchanged; Loomlight closed. Original **3,226 Roaming + 282 local profile files**
restored/hash-identical; review profiles preserved/hash-verified separately.

| Capability | Windows evidence | Remaining acceptance |
| --- | --- | --- |
| Six corrected behaviors | Focused rejecting tests, native WebView2 and affected packaged proofs Pass; physical edge/drop/hover/final UX Pass | One bounded native Mac follow-up on the frozen inputs |
| Candidate identity | Code frozen at `ee5f55eeb36f734e6c4c2cc6e4d53edd417c3bd1`; candidate-6 EXE SHA256 `4e436903da2fe4803f0cd76d6f4f176e69572ee19588219b7fea4e0b61da5219`; 132 inputs, 10 changed / 122 unchanged versus `5b467a4` | Justified remote Windows/macOS qualification of the same changed inputs |
| Handover/integration | Evidence/packages/failures/counters retained, profiles restored, no app/game operation pending | Separate integration chat after both platforms pass; PR #17 conflicts and 1G/1H closure untouched |

**Next:** follow the [six-item Mac checklist](HANDOVER.md#bounded-mac-follow-up--frozen-windows-candidate),
reuse unchanged Mac/remote evidence, then qualify the coherent candidate once. No new
workflow dispatched, broad unchanged matrix or automation. Cumulative Windows remains
6 production builds + 1 unqualified / 4 failed build/setup attempts / 21 starts /
0 separate SDK menus. Exact row statuses, limitations and final receipts are in the
[Windows completion ledger](../tasks/active/ui-design-review.md#frozen-windows-review-completion--2026-10-06).

### Earlier final Welcome handoff (completed)

**Physical graph hover/readability Pass — 2026-10-06.** User reports “working” for
the long English node tooltip and connector labels/arrowhead boundaries. All 242
saved-file hashes remain unchanged. WIN-UI-13 Pass in selected native/physical scope;
prior both-palette geometry evidence retained, no new human Dark-graph or DPI claim.
Candidate 6 is on Welcome, Light PaperTeal, Ready after closing the saved project.
Only Settings hover/Welcome readability and final session visual feedback remain
hands-on (WIN-UI-12). No build/start/SDK/CI/input changes; counters unchanged.
After feedback, close the app, preserve review profiles, verify/restore original
profiles and publish the Windows handover. Affected Mac/remote qualification remains
the single bounded follow-up before separate integration; scale stays excluded.

### Earlier physical coexistence completion (passing evidence retained)

**Physical Explorer/Beat coexistence Pass — 2026-10-06.** Candidate-6 user says
“done working” for off-Assets drop refusal, Narration reorder and Undo. Native Saved/
no-import state and restored row order agree; all 230 pre-existing saved files match
exactly. Only 12 expected recovery records from the move/Undo were added (242 total).
WIN-UI-01/03 Pass in selected native/physical scope. Existing native SendInput English
proof satisfies WIN-UI-04 in selected scope; physical-human typing was minimized,
not claimed. No new build/start/SDK/CI or app input change. Candidate 6 is now on
Branches → Fit for remaining long-name hover and final visual feedback, then Welcome
hover/readability. Scaling remains excluded. Profile restoration and the single
bounded affected Mac/remote qualification remain pending. See the live task ledger.

### Earlier drop/preview correction (passing evidence retained)

**Explorer drop / import-preview correction — 2026-10-06; in_progress.** Human
candidate-5 drop highlights Assets and stages all three files; PNG/JPEG previews
Pass. WebP has the expected unsupported-presentation explanation but an unintended
broken-image box (WIN-IMPORT-PREVIEW-01). Attempt 1 hides previews until decoded
and on release. Rejecting regression fails before; all 6 affected import tests,
TypeScript/Vite and candidate-6 native PNG/JPEG/error/Retry/discard checks Pass.
All 230 saved files and three originals remain unchanged. WIN-UI-14 Pass in selected
current-scaling scope; WIN-UI-03 remains Unavailable for off-Assets/coexistence.

Current candidate 6: 14,151,168 bytes, SHA256
`4e436903da2fe4803f0cd76d6f4f176e69572ee19588219b7fea4e0b61da5219`, production
build 38.235s. All 132 inputs verified against both passing manifests: 10 changed /
122 unchanged; only import renderer/test differ from candidate 5. No broad matrix
or CI dispatch. Cumulative Windows: 6 production builds + 1 unqualified, 4 failed
build/setup attempts, 21 starts, 0 separate SDK menus. Candidate 6 is Saved on the
disposable graph project → Story → Scene 1. Next: off-Assets physical drop, then Beat
reorder/Undo coexistence; short English/hover/visual feedback. Scale remains excluded.
Profiles remain protected pending restoration after the session. Add unavailable
import-preview presentation to the single bounded affected Mac follow-up; changed
candidate Mac/remote acceptance and separate integration remain pending. Exact
evidence: [live ledger](../tasks/active/ui-design-review.md#windows-explorer-drop-and-unavailable-preview-correction--2026-10-06).

### Earlier physical edge retest (passing unaffected evidence retained)

**Candidate-5 physical scroll retest Pass — 2026-10-06.** User reports both held
edges and Escape now work. Hash comparison finds four durable saved reorders,
206→230 files including recovery evidence; all source lines are preserved. User
confirms those moves were **deliberate**, resolving attribution. WIN-UI-02 Pass in
selected physical/native/automated scope; broader session hashes include intentional
writes, while separate no-write regressions remain Pass. Old edge failure preserved.
No new build/start/CI/SDK. Continue Explorer drop/coexistence and brief English/hover/
visual feedback; no scaling.

### Earlier edge-scroll correction checkpoint (physical retest supersedes wait)

**Physical edge-scroll correction — 2026-10-06; in_progress.** Human candidate-4
check passes marker/Escape cleanup but fails scrolling at both edges; all 200 saved
files remain unchanged. WIN-DRAG-01 corrects the scroll owner and visible boundaries.
Rejecting regression reproduces 0/1; corrected Scene tests 16/16 and focused held
pointer Chrome/CSS fixture pass, zero writes. Candidate 5 build passes in 34.97s:
SHA256 `4955035543c07593c4e69e51d34e8bdc80ced6d89cb533c5ab2f47f233aad208`.
All 132 inputs recorded, only scene-ui.ts and its DOM test differ from candidate 4.
Native process path verified. **WIN-UI-02 remains Fail pending physical retest.**
Next: retest only both held-scroll edges on candidate 5, Story → Scene 1, then
Explorer/English/hover/final feedback. No scale check or broad matrix. Cumulative
Windows: 5 production builds + 1 unqualified, 4 failed build/setup attempts, 20 starts,
0 separate SDK menus; no new manual CI. Profile restoration and affected Mac/remote
qualification remain pending; add held drag to the bounded Mac follow-up. See the
[live correction ledger](../tasks/active/ui-design-review.md#physical-windows-edge-scroll-correction--2026-10-06).

### Earlier agent-ready checkpoint (candidate 4 superseded)

**Agent work ready for final Windows session — 2026-10-06; in_progress.**
User selected agent-owned fixes/checks first, minimizing repeats. Two additional
product fixes now pass: simultaneous Story canvas/thumbnail URLs remain live, and
acknowledged Source drafts update the sidebar count/UTF-8 bytes without saving.

| Capability | Implementation / proof | Acceptance still needed |
| --- | --- | --- |
| Source Run, import refusal, previews, draft counter | Corrected; focused renderer tests 44/44, Source/browser review Pass, native affected actions Pass | Affected Mac checks and changed-candidate remote qualification |
| Packaged runtime/UI | route-b and runtime-error Pass on candidate 3; ui-refresh all 11 checks Pass on candidate 4, cleanup true | Final Windows human input/visual acceptance |
| Catalogue, Choice, sidebar, pending operations | Native representative actions plus existing rendered coverage reused; native import cleanup changes none of 200 files | Held drag/Explorer drop, physical English/focus, hover/visual feedback |

Current binary: `candidate-4/loomlight.exe`, SHA256
`01ddc25a05f3293dd29ecaca775e163f78120d1f39923a20c8bf129eeefc7d58`.
All 132 inputs verified: 8 changed / 124 unchanged versus qualified `5b467a4`.
Only probe diagnostics differ from candidate 3; its renderer/service proof is reusable.
No timeout/assertion relaxed; earlier failed probes remain failed with precise cause
unresolved. No new manual CI dispatch or broad unchanged matrix. Cumulative Windows
counts: 4 production builds + 1 unqualified direct-Cargo build, 4 failed setup/build
attempts, 19 top-level start attempts, 0 separate SDK menu starts.

**Next action:** one consolidated hands-on Windows session on candidate 4, open on
the disposable graph project → Assets, Saved, Light PaperTeal, no modal or external
restore pending. Scaling remains user-excluded; native layout/Beat-type permutations
are minimized using existing tests, with their limits recorded. Original 3,508-file
profile backups verify unchanged; restoration waits until the final session closes.
Exact row statuses, evidence and bounded Mac follow-up are in the
[live Windows ledger](../tasks/active/ui-design-review.md#windows-agent-work-ready-for-final-hands-on-session--2026-10-06).
1G/1H remain open; PR #17 conflicts/integration untouched. Both-platform acceptance
is not claimed for the changed candidate.

### Historical Windows checkpoints (superseded)

**User scope amendment — 2026-10-06:** “dont check scale please.” Display-scaling
checks are excluded at the user's request; do not open Windows Display settings,
change scale or request that physical action. The Settings handoff below is cancelled.
Continue remaining Windows/native/visual actions at current scaling. Higher-DPI
results remain Unavailable, user-excluded; no higher-DPI acceptance is inferred.

**Native review resumed with scaling excluded — 2026-10-06.** Candidate 2 remains unchanged. Captures `596`–`629` and `659`–`689` review reciprocal, duplicate, self, same-layer and multi-level backward connectors in both palettes, zoom/pan/Fit, route selection, missing/custom notices and correct scene-file Source navigation. A native saved Choice adds a sixth terminal Return scene; terminal flow has no invented destination edge. `native-terminal-route-commit.json` retains exact saved source and metadata. Source navigation opens the correct file but highlights the end of the mapped range; exact-line focus is not claimed. WIN-UI-13 has substantial native evidence, with tooltip completion still to audit and higher DPI user-excluded.

Captures `632`–`658` prove native pointer preview resize 34→41, Arrow Down→43, Reset layout→34 and reopened value 34; Chapter collapse retains Scene 1, keyboard navigation/tree hide/restore keeps visible focus, and Writing focus restores sidebar choices. Remaining six-surface/compact checks are open. Source overflow `694`–`721` opens fourteen extra files, selects via native Open files, reveals the active tab/file row, closes an inactive tab without changing selection, and retains the exact draft after active-tab close/reopen. Explicit disposable-draft discard leaves every `.rpy` hash and file set unchanged; `native-source-overflow-draft-review.json` retains snapshots. The sidebar says No unaccepted drafts while the non-scene session-only draft exists; classification pending. Source tab 14 is Clean / Draft discarded (`721`); no source-file write occurred.

Captures `727`–`755` add native English narration typing, selection/copy/paste, undo/redo, one saved commit and keyboard Tab/Enter Move up, restoring the intended order. Same-row drag, unsubmitted-input refusal, crossing the final Choice and its disabled grip preserve saved source; `native-beat-English-bounds-review.json` retains hashes and exact assertions. Held edge-scroll/live ghost and Explorer coexistence remain pending. Current app: graph review → Story → Scene 1, Saved, long list at rows 11–21 (`758`); no editor draft or write is pending. `native-held-drag-before.json` records the no-write baseline. Explorer launch returned Computer Use app approval timed out, and fresh window inventory confirmed no Explorer window; no retry or drop occurred. The next physical handoff covers held dragging at both list edges because Sky supports only complete drags, with no mouse-down/hold operation. Record human observations separately; check hashes after cancellation. No OS/display scaling action is requested.

Broken Story image previews and both failed ui-refresh probes remain unclassified; no visual pass or failure waiver is inferred. No source correction, build, top-level start, SDK menu, probe, deadline change or CI dispatch added. Original profile restoration and affected Mac/remote qualification remain pending.

**Earlier PC-use pause:**
Candidate 2 remains on supported rename review → Story → Scene 1 → Choice →
Create New Scene, empty Choice text, default New Scene/Chapter 1, Saved (`573`).
No write, external-byte restoration or CI operation is pending. Original profile
restoration remains pending; do not alter profiles while the app is open.
WIN-UI-08 is partial: Dark laptop/minimum and Light minimum forms fit/stack;
Dark creation saves one route. Light native English/Tab/Enter cancellation changes
none of 233 files and reopening clears discarded names (`550`–`573`). Laptop Light
and higher OS scaling remain unverified. Native Windows Settings launch exposes no
targetable window; no retry or scaling change occurred. Resume only on user request,
reselect/capture actual app state, then continue remaining canonical actions.

**Latest native checkpoint:** WIN-UI-05/06/07 **Pass on Windows** on candidate 2
(`686e56fb…`). Variable and Character evidence remains `298`–`378`. Appearance
rename cycles with/without WebP replacement, supported Show/Change references and
project reopen pass (`405`–`494`); IDs/defaults, old images and custom Unicode
source remain intact. Genuine collision and externally edited alias refuse;
the latter changes none of 215 files (`496`–`502`), then exact original bytes are
restored. `native-appearance-rename-completion.json` retains rejecting assertions.
WebP's bounded unavailable presentation is documented, not a failed import.
Native capture is working; a WebView2-owned dropdown rejects a main-window mouse
target but native keyboard selection succeeds. No user foreground action is pending.
Earlier app checkpoint: supported rename fixture → Characters, Saved (`504`).
Continue WIN-UI-08 compact Choice/layout and remaining canonical actions. Eleven
rows, two failed ui-refresh probes, affected Mac/remote qualification and profile
restoration remain open. No new source change/build/start/SDK menu/CI dispatch.

**Windows review: in_progress; incomplete.** User explicitly requested retry with
permission for the disposable project's execution-consent action; the agent's native
click succeeded. This overrides the prior default skill handoff and resolves that wait.
It is agent input with user permission, not physical-human acceptance. Native fresh-game
menus/Start, drawer close/reopen while Running, Source English selection/edit/Ctrl+S,
exact saved bytes and truthful earlier-launch status now have captured proof. Stop
reports cancelled/stopped (Windows exit -1073741510); latest-saved Story rerun shows
the new saved text and normal close exits 0. Source rerun still fails on the installed
baseline (WIN-RUN-01); its first correction passes focused local renderer checks.
Changed app/probe/driver inputs are not covered by the old 132-input acceptance.
One isolated Windows correction build and configured packaged route-a pass; native
keyboard/Mac/remote qualification remains pending. Installed route-a passes;
installed ui-refresh fails at editor timeout,
retained without waiver. Native Beat reorder/Undo/Redo and Variable discard have partial
proof. Actual held-drag cancellation gestures require physical action: native API has
no mouse hold plus Escape/focus switch. On disposable Story Scene 1 the user reports
all three cancellations work. All four saved hashes are unchanged.
Native resume succeeded: `136`–`138` show no residual marker, Save and close to Welcome.
Correction ui-refresh fails earlier at initial-story-ready (zero checks); diagnosis
pending. One route-a setup failure used the wrong SDK variable; the correctly configured
route-a passes exit 0/cleanup true, 90.062 s with synthetic DOM input.
**Native capture recovered after diagnosis.** User confirms the app was already active;
the foreground explanation was unsupported. Persistent tool-session captures returned
inconsistent window IDs, text and pixels. Kernel reset and fresh native API/window
selection restore consistent candidate identity and Welcome (`139`). Native Source
Run now starts a real SDK child and displays saved text (`148`–`155`); English
selection/replacement/Ctrl+S during play persists the exact expected narration with
label intact and child alive (`157`–`162`). Earlier-launch details and terminal Stop
are truthful (`163`–`165`); latest saved Source rerun displays the new text and
normal Quit finishes exit 0 (`166`–`174`). WIN-RUN-01 affected native Windows
behavior passes; all remaining row actions and Mac/remote qualification remain open.
Windows **1 completed build / 9 process-start attempts / 0 SDK menu starts**;
one setup failure preceded WebView creation. Prior Mac/remote
counters preserved.

The full 500-Scene diagnostic copy opens normally after preserving its required
folder basename; initial stale status was prematurely classified as a refusal.
First Story-ready capture is a 67,679 ms upper bound; the planned 60 s observation
cutoff was missed, so this is inconclusive timing evidence, not gate acceptance.
Native full-workload Source comment survives tab close/reopen as a session draft;
discard restores Clean/Saved and the fixture closes (`184`–`210`). Both packaged
ui-refresh failures remain failed; no additional build/start/probe/CI dispatch.
Native asset Browse previews/categories/English expression blur/guidance/Cancel/Keep
pass specifics (`214`–`249`). **WIN-IMPORT-01:** an ordinary change to a selected
file causes blocking prepared recovery during Import; zero assets imported, accepted
files unchanged, original media restored, failed journal retained (`250`–`255`).
Correction 1 validates content before import/replacement transactions and fixes staged
error wording. Focused final tests **2 pass**, adjacent preview/identity tests **3 pass**.
Candidate 2 release build passes (1m05s); first setup invocation failed before compiling
because child PATH lacked pinned npm. Retained executable **14,151,168 bytes**, SHA256
`686e56fb349c6cf53e187958089006d29b9f25813ea029ae8333e4d9fed4830c`;
all **132 inputs checked, 5 changed/127 unchanged** against qualified baseline.
Affected native Windows import and replacement specifics pass (`259`–`309`): changed
selections refuse before staging with all project files unchanged; valid partial import
and explicit reselection succeed once, assets 3→5. Replacement preserves Appearance/
Asset/default identities and immediately refreshes correct preview. No failure waiver:
original blocked project/journal retained, full row acceptance still incomplete.
Current app is candidate 2 on fresh Interaction Review → Characters, Saved.
Bare-path helper launch wrongly opened installed baseline; no test input issued;
explicit `process:` identifier and independent ownership check select candidate 2.
Windows totals **2 successful builds**, **1 pre-compilation setup failure**, **11 starts**,
**0 SDK menus**. Mac/remote checks and two ui-refresh failures remain open. No CI pending.
See the [Windows correction record](../tasks/active/ui-design-review.md#windows-evidence-and-first-source-correction--2026-10-06).
The original checkpoint description below is retained as entry history; remaining
checklist rows are still incomplete, with current detail in the task ledger.

**Historical installer entry (before the first Source correction):**
The existing Windows clone was clean, switched to the selected feature branch and
fast-forwarded to published `e2146f6`; historical worktree and unrelated refs preserved.
Both qualified manifests and all 132 candidate/source/carrier/checkout inputs match.
Package artifact 11346956654, evidence 11347016700, Mac evidence 11346724976 and
terminal run logs are retained locally before expiry. NSIS ZIP and installer hashes
match the transfer below. Installed AMD64 executable is **14,145,024 bytes**, SHA256
`3c9640b0dea7d29ca02096190cf60aca6be2dae7948324b6c0324c16b1480738`.
**WIN-PKG-01**: supplied `e4992dde…` is the tested unbundled executable; NSIS changes
exactly three bytes `UNK` → `NSS` in Tauri's documented bundle marker. All other bytes
match. User explicitly selected **Continue with verified NSIS payload**. No application
change or new candidate; failed initial identity assertion and both binaries retained.

Windows 11 Pro 10.0.26200 x64, WebView2 154.0.4258.53 owned by the verified installed
process, measured window DPI 96/100%, System palette renders Dark. Agent native title
input, genuine uncached official SDK progress/verification/installation, CONFIG-01
custom/invalid/portrait resolution, inline Git and staged fresh creation have partial
evidence. Fresh Run correctly refused an absent explicit runtime helper; the helper was
added through the production transaction. The app now displays **Allow project
execution?** for the disposable **Windows Review** project. Computer Use prohibits
acting on security permission requests; the user must click **Trust for this session
and continue**, then resume the same review. No consent or game launch inferred.

**Historical entry rows (superseded by correction evidence above):** with
per-row partial proof and every remaining action in the
[Windows execution record](../tasks/active/ui-design-review.md#windows-final-review-entry--2026-10-06).
This is a pending tooling handoff, not a failure waiver or final Windows acceptance.
Focused installed and correction results are recorded above; close the interactive
owner before any further probe. Finish every native/physical/visual action and TESTING's
final routes, Save during play, latest rerun, diagnostics, scaling and session reopen.
No broad unchanged matrix or CI dispatch selected. Integration handover remains later.

Ignored evidence: `.toolchains/reports/final-1g-windows/`. Original profile backups
verify **3,508/3,508** exact file hashes/file sets; no private project opened. Windows
corrected app remains open for the native Source rerun; generated review
profiles and originals retained;
**Windows profile restoration is pending**. Recovery receipt identifies both backups
and the actual packaged-host redirected LocalCache profile. Preserve all on resume.
Windows counters **0 builds / 1 native start / 0 separate SDK menu starts**; existing
Mac/remote counters and failed evidence below remain unchanged. Documentation validator
and whitespace check pass. No PR #17 conflict resolution, merge or phase closure.

### Retained Mac acceptance and remote qualification

**State: Mac acceptance and required remote qualification PASS; ready for Windows-PC review.**
Exact qualified candidate `5b467a402b14c7b371838645a9daa555ba315349` on existing
`feature/phase-1g-branches-runtime`; all **132** app/workflow input hashes match local
package source `8ef89a85c3e8233ab5c8b73bfce7e166cdd03275` and the docs-only
continuation carrier. Fresh remote feature `525d251`, main
`4d7ba0333c48d60242a9a42d3e079fea499a5531`, planning remote `267ec2a` and separate
planning worktree `2c5a164` preserved at terminal audit. PR #17 remains open/draft/
conflicting; no integration. A later docs commit does not replace the tested SHA.

- Repository quality [37312556784](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312556784), attempt **1**, exact candidate above: **PASS**. Required job/every step audited; optional profile/diagnostic jobs intentionally unselected.
- Production [37312593480](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312593480), attempt **1**, exact candidate above, `upload_packages=true`: **PASS**, terminal audit 2026-10-06. Preflight, macOS ARM64 and Windows x64/all required gates succeed; both success-only package uploads are present and retained locally.

Preflight: **87 frontend tests, 0 failures/skips**, Source/UI/shipped-driver browsers,
Q1 rejecting fixtures/selectors, repository validation and formatting PASS.
Routine core: Mac **187 passed / 40 existing ignores / 3 filtered**; Windows
**182 passed / 37 existing ignores / 3 filtered**. Separate required SDK lifecycle,
authoring/Source, download-handoff/reuse, runtime service and diagnostics gates execute
and pass without a skip marker; each platform's desktop Rust test passes. Both archives
were cache hits, checked by the pinned production checksum installer. The conditional
cache-miss download is skipped; genuine Mac uncached progress has separate evidence.

Both hosts: **6/6 packaged runtime cases**, exit 0/no timeout/cleanup true;
compile/lint, both routes, runtime-error and UI refresh. Mac route-a/b **47.067s /
44.719s**, Windows **45.797s / 42.734s**. Native font metrics, Save during play,
Running >9.5s, Stop, explicit Close completion and accepted-source/new-session reopen
pass; route-b refusal/Cancel passes. Boundary/single-instance/navigation/CSP/Source
command trace, artifact privacy and dependency/licence inventories PASS. Actual
Runtime and Branches browser outcomes both success (not normalized conclusions);
Branches schema 3 functional and diagnostic timing results pass on each host.
Hosted WebView input is synthetic DOM, not physical keyboard or Windows-PC UX.

All four artifact ZIP hashes match GitHub digests. Exact candidate/tree/input manifest,
manifest file hash, executable and retained payload hashes verified. Terminal logs,
JSON cases, screenshots, inventories, ZIPs, installers and compact audit are retained
ignored under `.toolchains/reports/final-1g-mac/`. The earlier cached partial CLI log
is preserved; completed run/attempt logs supply terminal proof. Evidence uploads omit
individual .log files; full terminal logs retain those gate outputs. No missing gate,
skip or failed case is treated as a pass.

Windows artifact [11346956654](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312593480/artifacts/11346956654),
`phase-1-production-package-windows-2025`: selected `nsis/Loomlight_0.1.0_x64-setup.exe`,
**3,544,277 bytes**, SHA256
`cf2d4a004923863b57f28a481c0703076363faf380368948d3d876ef7505d408`.
Tested AMD64 executable SHA256
`e4992dde5dc3a2521de8df075cdbb3843a54414b43fc348560c44f8b1eeb1afc`;
verify the installed executable on the Windows PC. MSI/hosted Mac DMG identities and
all artifact digests are in the final task ledger. GitHub retention expires 2026-10-12;
local ignored archives/installers are retained beyond that expiry.

Verified local ARM64 review installer remains
`.toolchains/review-builds/ui-refresh-8ef89a8/Loomlight_0.1.0_8ef89a8_aarch64.dmg`,
**5,752,249 bytes**, SHA256
`6cf320e94bded5403172b846152164871fa5dbec12c93d161eae56197a6d9adb`;
sealed executable `36328bbb46be07b1ad64274048f7a5c223065d9152f9daade1fe5046f6e75de1`.
ARM64/mounted identity/integrity/strict ad-hoc signature/privacy PASS; no Developer ID/
notarization claim. Original profile restored; private projects and installed older
copy untouched. No local app/game/runner or workflow wait remains.

Initial production allowance **1/1 consumed**; justified changed-input correction
dispatches **2**. Failed 37300975410 on 94ffa25 and 37307663113 on cab39e1 remain
FAILED with unique evidence retained. Local counters **18 builds / 71 native starts /
7 separate SDK starts**; prior remote P5 **2 builds / 14 starts**, current P6
**2 builds / 16 starts** (six cases plus two boundary processes per host), separately
recorded. This terminal audit adds no build, app start or dispatch.

The selected Mac outcome is complete. Continue on a genuine Windows x64 PC with the
[14-row checklist](../tasks/active/ui-design-review.md#deferred-windows-review-checklist--2026-10-03);
all rows remain deferred here. Windows corrections change the candidate and require
mapped affected Mac/remote verification; existing WORKFLOW budgets continue.
Windows-PC acceptance, PR conflict resolution, affected combined-input qualification,
integration, 1G/1H closure and any new feature remain later separate work. Publish this
docs-only transfer without another package matrix; keep qualified identity 5b467a4.

**Historical P4 Mac review snapshot — unchanged interaction inputs only.** Exact app/build source
`efb52edebd934277f7643a6978f59a343e6c447b` includes CONFIG-01, sidebar spacing,
48px native picker, Source Save focus, unsupported-only import and bounded caption
corrections. 85 frontend checks/0 skipped, web/UI browsers and affected real-SDK
route-a/route-b/ui-refresh package cases PASS; all three exit 0/cleanup true.
Native English Story/Choice/Source input, pending navigation guard, Commit/Undo/Redo,
sidebar/focus/Writing focus, real catalogues/media/import, diagnostic highlight,
normal Run/Stop exit 0, minimum window/2× scale and reopen PASS. User separately
reports genuine Finder drop works with unsupported-text error. No physical human
keyboard claim; non-English IME outside selected English support scope.

Verified ARM64 installer: ignored
`.toolchains/review-builds/ui-refresh-efb52ed/Loomlight_0.1.0_efb52ed_aarch64.dmg`,
5,751,326 bytes; SHA-256
`5da26bf4bfd537edd18bd5356ce07bdb8f2d2658c9aa86f2ba84a9f7c1f5b980`.
Sealed executable `d2883d2e7c014dd38b785cc805e0a50d369e22734673639af11ae181236b5daa`.
Mounted identity/ARM64/integrity/signature/checksum/privacy PASS; locally ad-hoc
signed, not Developer ID/notarized. Link supplied in chat; installed copy remains
older. Preserve every failed/superseded package/run. Exact input hashes and the
[execution record](../tasks/active/ui-design-review.md#final-mac-completion-execution--2026-10-04)
separate reused unchanged evidence from current affected proof.

Genuine uncached native SDK progress PASS: 63.8 MB of 146.5 MB/43%, screenshot
65.6 MB/44%, Verify, Install, managed SDK Ready/Continue. Normal creation staged
progress proof retained on unchanged inputs. Host Documents TCC wait classified
with native directory-open stack/log; temporary-folder selection completes. No
broader permission changed or skipped failure converted to pass.

**Profile recovery complete:** both disposable profiles and SDKs retained ignored;
guarded renames restored the untouched original whole app profile. No app/game or
local runner pending, no private project mutation. Counter totals: **16 production
builds, 67 native/boundary starts**, separately **7 SDK menu/launcher starts**.

This historical P4 snapshot preceded the P5/P6 corrections and qualification.
The terminal transfer above now owns passing candidate/package identities, cumulative
counters and Windows continuation. All failed/superseded evidence remains intact.
Windows-PC acceptance and later separate integration remain outstanding.
Preserve local planning merge `353f1f7` and separate worktree `2c5a164`; no planning
branch push, conflict resolution, rebase/rewrite, merge, 1G/1H closure or new phase.

### Local planning documentation merge — 2026-10-05

The user selected merging planning `2c5a164` into local feature checkpoint `e8af02e`,
with documentation checks and a commit, explicitly **no push**. Both UI sections are
retained: current Phase 1 corrections, then agent guidelines. Phase 2/3 plans, design
references and bounded delivery targets now accompany this checkout. No application,
test, workflow or Phase 1 acceptance change is selected. The live Mac-review state,
source/package evidence, profile recovery, counters and remaining gates above stay
authoritative. This is not 1G/1H integration or resolution of PR #17 against main.
Planning worktree/branch remain intact. The merge was local-only at that checkpoint;
subsequent selected Mac acceptance published the existing feature candidate containing
it, without pushing the planning branch itself. Phase 2/3 implementation remains
not started. Continue the live Phase 1 Windows transfer above.

**Previous Branches correction:**
Option B source `88add80` implements heavier rounded routes, distinct channels,
readable label pills and Fit bounds. Its 83-test/frontend/browser/large-graph proof
and WIN-UI-13 acceptance remain in the [implementation record](../tasks/active/ui-design-review.md#option-b-selected-and-implemented--2026-10-03).

**Previous sidebar correction:**
The user reported misaligned/widening sidebar controls, the hidden tree restore button
covering the Scene title, and arrows that did not reverse. The bounded
[sidebar follow-up](../tasks/active/ui-design-review.md#sidebar-control-alignment-follow-up--2026-10-03)
fixes fixed-size header placement, reserved restore space in Story/Source and stateful
arrows. Main navigation/tree widths remain independent; the collapsed Settings cog
has a tooltip instead of a clipped label. Local frontend/build/browser checks pass;
actual native acceptance is still open. Delivered installer `19cdcaa` predates these
source changes. No new installer, CI dispatch or integration was selected. Fresh
planning worktree is now `2c5a164`; preserve its newer work. CONFIG-01 remains open.

**Prior installer/audit state:**
The [full-chat recheck](../tasks/active/ui-design-review.md#full-chat-request-reconciliation--2026-10-03)
found a remaining CONFIG-01 detail: the accepted aspect-ratio label/caption and valid
Custom-dimension preview handling are incomplete. The larger picker is implemented;
record this as partial, with source unchanged. The other original requests and A1–A9
are represented in current source; native/final UX acceptance remains separate.
The user selected every audit fix plus a specific later Windows checklist. Source
checkpoint **`1d4bf147a120c1e0e8977b07f68f4cb6948e1473`** preserves incoming audit `41ddf2c`
on the existing branch. The [correction record](../tasks/active/ui-design-review.md#audit-corrections-selected-and-implemented--2026-10-03)
owns implementation, failures/corrections and evidence. Choice actions, Variable
discard/default controls, retained Appearance selection/owned alias reuse, sidebar
focus/semantics, divider reset, pending Beat controls/saved focus and media feedback
are corrected. Internal Beat reorder now uses captured pointer gestures while native
OS asset-drop ownership remains enabled. This is implementation with local proof,
not final native or visual acceptance.

Local checks pass: **78 frontend tests**, **185 routine release core tests**
(40 existing ignores, 3 separately selected), **1 macOS desktop unit test**, production
web compilation, format/diff/repository validation (**322 files**) and the expanded
actual-renderer Chrome regression. It checks both palettes/all six surfaces plus the
audited interactions, real mouse reorder/cancellation, decoded appearance thumbnails
and deferred Beat receipts. The web build retains its existing chunk-size advisory.
No unchanged observed-flow timing gate, official SDK or package matrix was rerun.
The [Windows checklist](../tasks/active/ui-design-review.md#deferred-windows-review-checklist--2026-10-03)
has 14 specific action/result rows, all unexecuted on Windows.

**The user-selected local Mac installer is ready; resume hands-on review at Story.**
Built input `19cdcaa` (app source `1d4bf14`) with one release build. Retained final DMG:
`.toolchains/review-builds/ui-refresh-19cdcaa/Loomlight_0.1.0_19cdcaa_aarch64.dmg`,
SHA-256 `4e83485c968b12bc843382a4136301ccc13e68fa51202f27813a22f2f449a1da`.
Integrity and actual mounted app identity/ARM64/ad-hoc resource signature pass.
The [build delivery record](../tasks/active/ui-design-review.md#local-mac-installer-delivery--2026-10-03)
retains original signature failure/post-packaging correction and exact evidence.
Installed `01d0896` remains unchanged until the user replaces it; no native app/game
was launched for this build. Existing bootstrap inputs/earlier acceptance remain
separate; old-project repair is outside scope. Physical input/IME, OS drop, live SDK/
creation progress and final UX acceptance remain open. No hosted/Windows dispatch,
automation, merge/conflict resolution or new phase was selected. PR #17 stays draft/
open/conflicting. Counters are now 9 production builds, unchanged 44 native/boundary
starts and separately 4 SDK menu starts. No manual operation is pending.

## Earlier UI review record (historical; superseded by the live state above)

**Current user-selected work:** [UI refresh implementation](../tasks/active/ui-design-review.md).
The accepted UI is implemented and **automated qualification now passes on both targets**.
[Run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
attempt 1, tested **d690d7f8ffc08fbc76411c95147f04422620afbc** and completed successfully
2026-09-30 03:12:29 UTC. All six packaged native scenarios per target passed with
cleanup, as did both boundary-smoke checks and all other required gates. SDK fetch
was skipped on cache hits; live first-install UI progress remains unverified.

**State: review_ready; corrected Mac installer ready, no workflow pending.** The 2026-10-02
user selected fixes for Character/Background naming and the newly reported missing
starter GUI-image crash, one local Mac build, then restart at Story. The
[blocker record](../tasks/active/ui-design-review.md#characterbackground-authoring-blocker--2026-10-02)
owns that bounded scope and checks. Twelve visual corrections remain pending; no
Windows build, CI dispatch, integration or new phase is authorized. Existing project
GUI assets are not silently regenerated; use a fresh disposable project for restart.
Correction candidate `01d0896` passed 71 frontend tests, browser regression, routine
core (179 passed/40 ignored/3 separately filtered), exact authoring IPC and official-
SDK creation/menu/dialogue checks, then one local Mac package/native UI-refresh case
(9 checks, 5.07 s, cleanup complete). Use the ARM64 DMG under ignored
`.toolchains/review-builds/ui-refresh-01d0896/`; exact checksum/evidence and cumulative
counts are in HANDOVER/the blocker record. Windows is unverified for these fixes.
**Review corrections implementation selected, 2026-10-02.** The user requests all
suggested fixes in this chat, superseding the review-only stop and sidebar/Beat-drag
approval wait. [Implementation selection](../tasks/active/ui-design-review.md#review-corrections-implementation-selection--2026-10-02)
owns scope. Implement and verify with focused checks; no new installer/CI/integration
selected. Earlier review state follows for evidence.
**Earlier hands-on review stopped at the user's request, 2026-10-02.**
[Continuation record](../tasks/active/ui-design-review.md#hands-on-review-stopped-for-now--2026-10-02):
findings are saved; corrections and unreported acceptance remain open. Wait for the
user to select implementation scope or resume review. No background operation,
new build/dispatch, integration or new phase selected; retain `review_ready`.
Latest feedback is [Variables](../tasks/active/ui-design-review.md#variables-naming-and-shared-catalogue-affordances--2026-10-02):
Variable creation bypasses the name helper used by Characters/Assets, explaining
the capitalization failure. Consistent name handling, shared inspector Close X,
whole-row selection and naming-help tooltips are pending corrections. Continue
Variables type/default persistence and known-assignment review; no new build selected.
Earlier [Assets](../tasks/active/ui-design-review.md#assets-categories-drop-target-and-supporting-workspace-modals--2026-10-02):
persistent top categories, a visible drop target, creation modals for Characters/
Assets/Variables and whole-card/list-row selection are recorded pending corrections.
Requested subagent research is complete; no app changes or new build selected.
The user confirms separate Music/Sound effects filters and consistent creation/
editing modals for Characters, appearances and Variables; implementation is pending.
Continue Assets, then Variables; actual OS drop acceptance remains open.
Earlier [Characters](../tasks/active/ui-design-review.md#characters-preview-and-appearance-controls--2026-10-02):
inspector image failure, appearance selection/preview and per-appearance editing
are pending. The user requests both name and image editing, plus direct Edit in
compact polished list rows. Latest view is Characters/list mode. Search/view switching,
Character editing and default persistence pass on Mac; immediate image refresh
after changing the default fails and requires leave/re-enter.
Earlier [Branches](../tasks/active/ui-design-review.md#branches-saved-routes-missing--2026-10-02):
saved routes are confirmed in Source but the graph stays disconnected after Refresh.
Pan/zoom/Fit is acceptable for now with refinement still needed; Scene/Source
navigation is user-confirmed on Mac; the subsequent Characters findings are above.
Screen-language label misclassification is the leading hypothesis; correction is
pending, with no new build selected. [Detail-popup dismissal](../tasks/active/ui-design-review.md#branches-detail-popup-dismissal--2026-10-02)
also needs a visible Close X and Escape support; the current Scene details toolbar
toggle closes it, but the popup has no internal close affordance.
Earlier [Source](../tasks/active/ui-design-review.md#source-tab-presentation-and-active-file-visibility--2026-10-02):
tab Close grouping, overflow controls and automatic active-tab reveal remain
pending corrections. Moving to Source does not close remaining Story checks.
The latest [sidebar/Beat proposal](../tasks/active/ui-design-review.md#sidebar-controls-beat-dragging-and-writing-focus-proposal--2026-10-02)
awaits user approval after two read-only subagent reviews; no additional app changes.
[Runtime-panel feedback](../tasks/active/ui-design-review.md#runtime-panel-feedback-and-earlier-project-launch--2026-10-02)
also records a pending presentation correction. The repeated GUI error is confirmed
as the earlier project reopened; installed `01d0896` matches the retained binary.
The user now reports "new project works fine"; fresh-project Mac acceptance is
recorded. Continue hands-on review; the earlier project remains unchanged.
The requested bootstrap double-check also passes on Mac: preset/custom resolution,
Git off/on, metadata/reopen, standard menus/dialogue and execution without editor
metadata. This follow-up changes tests/docs only; the same `01d0896` installer applies.

Previously qualified macOS/Windows installers and
retained evidence were downloaded and identities verified. Review copies are under
ignored `.toolchains/review-builds/ui-refresh-d690d7f/`. Exact artifact IDs, hashes,
case counts and limits are in [HANDOVER](HANDOVER.md) and the
[terminal audit](../tasks/active/ui-design-review.md#third-qualification-terminal-audit--2026-09-30).
The corrected Windows timeout path now passes; its original sparse failure report
still cannot conclusively identify which individual correction fixed it. Both earlier
failed qualification attempts remain preserved. No downloaded binary was launched
or installed during this audit.

Next: focused human UI review and actual-device keyboard/IME, OS asset-drop and live
SDK download/project-creation progress checks. Accepted references remain under
[docs/design/ui-refresh](../design/ui-refresh/README.md). Automated native tests use
synthetic input and do not close those acceptance rows. No merge, conflict resolution,
new feature phase or further dispatch/build is selected. The user explicitly requested
transfer to a new chat on 2026-09-30; reuse the existing branch and verified builds.
Published terminal-audit checkpoint is `ad97c6c`; inspect fresh refs rather than reset.

Hands-on review resumed on local macOS ARM64 at incoming `b8301f8`. Fresh refs/PR
status are unchanged; all three existing installer checksums pass. The
[review checklist](../tasks/active/ui-design-review.md#hands-on-review-preparation--2026-09-30)
starts with the ARM64 DMG and Welcome/four-step wizard comparison in the current chat.
No installer launch or new human acceptance result is claimed by this preparation.
The user's first [Welcome findings](../tasks/active/ui-design-review.md#welcome-feedback--2026-09-30)
record missing Settings affordance, column-tone separation and project-hover feedback.
All three corrections are pending; continue collecting review feedback in this chat.
Review is now in Story after the user's rapid successful project creation, with no
specific generation issue noticed. Workspace entry is observed; individual progress
stages were not separately assessed. The user accepted the
[resolution-picker detail](../design/ui-refresh/game-configuration-resolution-picker.png);
twelve accumulated visual/interaction corrections remain pending implementation in the ledger,
including an inline checkbox/label row for local Git in Review & Create.
Writing focus is user-accepted for this Mac session. Next: remaining Story feedback,
inline editing/physical input, commit/undo and Source review.
Latest Story findings remove the redundant preview slider, correct Choice scene-form
placement/button sizing and select a shared button consistency pass. Preserve the
user's open unsubmitted form; no application correction or new build is selected.
Follow-up confirms horizontal Choice-form overflow and selects single-confirmation
new-Beat creation, returning a saved collapsed row after the initial Add Beat save.
Latest Story correction adds independent chapter collapse/expand controls.

Cumulative refresh: three accepted hosted dispatches, attempt 1 each; seven production
builds (six hosted, one local), 39 native scenario starts plus four boundary-smoke
process starts (43 total), plus the separate early Mac debug build/launch. No automatic
retry or duplicate; the rejected pre-compilation CLI invocation remains separately
recorded. This terminal audit adds no builds/launches. Prior Phase 1G/Q1 evidence and
budgets remain separate.

The user approved outcome-sized goals with internal checkpoints and manual same-thread
workflow resume. [WORKFLOW](../WORKFLOW.md) owns the rules; the
[delivery brief and change record](../tasks/active/phase-1g-review-delivery.md) owns the
next outcome and this documentation update. The rules no longer require a new chat
at every checkpoint or CI wait. Actual client pause controls remain user/system-owned;
no automatic wait/wake or runtime capability was implemented or tested here.

**Prior delivery outcome (not selected by this UI review):** provide a reviewable Loomlight build, complete available bounded
Windows native checks and prepare focused final user review. Select **REVIEW-DELIVERY-1**
from [HANDOVER](HANDOVER.md). This replaces the older preparation-only next prompt;
it does not select integration, 1H or new features. The active UI workflow is recorded above.

## Phase 1G capability status

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Q1 core/browser and packaged reopen pass on both targets | MAC-N1 supporting limits retained; Windows/native and final acceptance open |
| Runtime foundation / R1 | Yes, prior corrections retained | Q1 final-source SDK service/diagnostic gates pass on both targets | Final native/human acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Q1 standard packages and ten Runtime cases pass | Focused final user session on each platform open |
| Integration / 1H | 1G not merged | Conflicts and affected integrated-tree gates remain | Separately selected; no automatic duplicate human pass |

## Evidence baseline, not a new qualification

Q1 [run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820),
attempt 1, passed at candidate `8546dcddd5ac95bfe849575fe618f6e990cdd5d4`.
The [terminal audit](../tasks/active/testing-policy-alignment.md#q1-terminal-evidence-audit--2026-09-28)
and [1G ledger 41](../tasks/active/phase-1g-branches-runtime-git.md#41-q1-terminal-evidence-audit--automated-pass--2026-09-28)
retain exact source, executable and artifact identity, measurements and limitations.
Four artifacts were available/unexpired on this update; expiry is 2026-10-05 UTC.
Use the original packages as that tested candidate, not as qualification of a later SHA.

Historical R2-P1 run `36293797731` and H1 run `36310107481` remain FAIL; WIN-F1,
MAC-N1 and TEST-P2 retain their original scope/budget limits in ledger 27/32/33.
Q1 retains two requests (one HTTP 422 rejection, one accepted run), zero retries,
two Tauri builds and fourteen top-level starts. This policy change adds zero runs,
builds or launches and does not reset those totals. Phase 0 and accepted 1A-1F remain
preserved; optional Git is deferred. Read old ledgers only for relevant evidence, not
as live next-step authority. HANDOVER and the new selected brief own continuation.

## Concurrent planning

Docs-only Phases 2–3 planning is isolated on `codex/phase-2-3-planning`; it does not
replace the active Phase 1G review above. The user confirmed those two phases and
selected Story logic before screen design in Phase 3. The
[Phase 2 delivery sequence](../tasks/active/phase-2-initial-llm-assistance.md#14-october-milestone-sequencing)
and [Phase 3 draft](../tasks/active/phase-3-initial-wysiwyg-release.md) are ready for
scope discussion. Implementation entry still requires accepted Phase 1 through 1H
and explicit bounded selection. HANDOVER records branch isolation and continuation.

Phase 2 planning now explicitly includes manual/LLM-generated Character cards and a
lorebook for reviewed context, editable system prompts with Restore baseline, and
context/response size controls. Extra-provider scaffolding is recommended, not selected
as additional supported-provider scope. See the Phase 2 brief's refinement record.

Planning correction — 2026-10-02: the user removed Ollama support; Phase 2 now
requires Unsloth Studio and the generic-compatible provider path. Phase 3 scope is
unsettled: explain the proposed capabilities plainly and clarify the intended outcome
before further elaboration or implementation selection. Planning branch remains
`codex/phase-2-3-planning`; ongoing Phase 1 work and its allowance are unchanged.

Phase 3 planning continuation — 2026-10-02: user removed 3E; local Git and GitHub
are deferred outside Phase 3/initial-release acceptance. PRODUCT, ROADMAP, UI and
the optional Git brief now agree. The Phase 3 brief contains researched implementation
steps for 3A–3D and 3F, inspected code seams, source-migration/runtime-preview design,
proof checkpoints and references. Online Ren'Py docs report 8.5.4; the pinned 8.5.3
behavior still needs qualification at implementation entry. Community project pages
were inspected only; nothing downloaded, copied or executed.

Next in this planning chat: review the proposed screen/Timeline inventories and
Run From Here's initial Scene-entry/empty-call-stack boundary. No implementation,
SDK upgrade, build or dispatch selected. Keep the existing planning worktree/branch;
the active Phase 1 checkout and all existing budgets remain unchanged. Publication
target is `origin/codex/phase-2-3-planning`; no merge is selected.

UI/UX planning refinement — 2026-10-02: the user requested interaction design and a
generated image based on the current UI. The Phase 3 brief now includes the nested
Story Beat journey, insertion/move/draft/preview contracts and a generated paper/teal
concept, plus the Screens/Timeline/state journeys. Phase 2 now records its assistance,
reference and settings journey. The [design reference](../design/phase-3-story/README.md)
retains the prompt/provenance and visual limitations. Live capture was unavailable on
the locked host, so generation used a saved actual synthetic-fixture Story screenshot.
This is proposed design, not accepted or implemented UI. Continue reviewing these
interactions and the remaining feature subsets on `codex/phase-2-3-planning`.
No Phase 1 files, application code, build/SDK/native runs or CI dispatches were added.

LLM screen planning — 2026-10-02: the user delegated equivalent Phase 2 UX planning
and image generation to a GPT-6.1 Sol subagent. The
[expanded Phase 2 design](../tasks/active/phase-2-initial-llm-assistance.md#18-proposed-llm-screen-and-interaction-design)
and [four proposed concepts](../design/phase-2-llm/README.md) cover preparation, semantic
review, cards/lorebook and AI settings, including cancellation/errors/draft safety and
compact/accessibility contracts. Total-budget, approval/inclusion, explicit proposed
reference saves and transient proposal boundaries are preserved. Assets use the saved
actual synthetic-fixture screenshot; no live capture on the locked host. Exact prompts,
hashes and schematic corrections are retained. No implementation or Phase 1 changes.
The parent reviewed the four concepts and written interaction contracts; publication
uses the existing planning branch;
no pending CI, provider request, build or new PR. Next: user review of the proposed design after verified publication. Resolve the checkpoint SHA from Git.

Selected delivery approach: the user approved updating the docs after the rework
assessment. Phase 2 section 19 now owns shared source/edit/reference/semantic/runtime
foundations and staged overlap: early minimum 3A source work alongside provider
feasibility, first complete AI rewrite, overlapping Phase 2/3A completion, then
Screen/Timeline lanes and state/release integration. The team is one GPT-6.1 Sol High
owner plus two GPT-6.1 Sol High implementation agents; the owner coordinates contracts,
shared-file writers, integration and combined verification. Phase 2/3 acceptance and
the Phase 2 operation allowlist remain; Phase 1 through 1H is still required before
implementation. ROADMAP/Phase 3 entry/sequence agree; exact feature subsets remain
reviewable. This docs-only selection starts no agents, implementation worktrees,
provider requests, builds, SDK/native runs or CI; no merge or new planning PR.
Continue on `codex/phase-2-3-planning`. Next: review subsets/UX and, after Phase 1
acceptance, select bounded source/provider tasks against the current accepted baseline.

Native-media planning selection: the user wants accurate character drag/resize,
pre-rendered playback and dialogue-time idles, with only Ren'Py-supported formats
accepted at this stage. 3C now owns those explicit outcomes, native container/codec
qualification, supplied masks/frames, playback/idle lifecycle and runtime geometry
proof. GIF import/conversion, transcoding and mask generation are deferred. PRODUCT,
UI, DATA_MODEL, ROADMAP and the two-lane allocation agree. The initial candidates are
a bounded native subset, not every upstream format; published docs describe 8.5.4,
while pinned 8.5.3 qualification remains future work. No new implementation, provider
request, media import/decoding, app/SDK/native run, agent, build or CI was performed.
Continue on the existing planning branch; next remains UX/subset review and bounded
implementation selection after Phase 1 acceptance. No merge or new planning PR.

Animation implementation sequence selected: after the researched explanation, the user
agreed to static staging → PNG/ATL idles → native looping video → prepared transparent
video → play-once/end states, followed by combined qualification. The Phase 3 brief
owns concrete source bindings, existing asset/media seams, bounded video delivery,
channel/audio behavior and profile-dependent embedded previews. Tagged official
8.5.3 source and community creator references are linked; source reading is not native
qualification. UI and the lane allocation agree. Native-only imports/no conversion,
shared placement/history and existing entry/acceptance gates remain. No app/media/SDK
execution, new agents, worktrees, builds, CI or implementation was started. Next: review
remaining subsets/UX and select bounded implementation after Phase 1 acceptance on
the current accepted baseline. Publish on the existing planning branch; no PR or merge.

UI/UX agent guidance selected — 2026-10-03: the user accepted the researched twelve
guidelines, including straightforward interface language and validation after field
completion plus submission. UI.md owns the contract; INDEX and both phase briefs link
to it, and the existing owner/two-lane plan shares controls/validators. Required help
stays visible; optional Ren'Py detail uses accessible tooltips/help. Validation preserves
incomplete/IME input, checks blur or explicit field commit, rechecks all submitted
values and refuses without writing/sending. This is future implementation guidance,
not a claim of current application compliance or new Phase 1 acceptance. Prior review
inspected the installed app/source and used one user-requested research subagent;
this update changes docs only. No new app, provider, SDK, build or CI execution.
Continue on the existing planning branch; select bounded implementation after Phase 1
acceptance against the accepted baseline. No new PR or merge.

Bounded delivery cadence selected — 2026-10-03: the user requests one deliverable per
owner/team outcome, with implementation, focused checking, in-scope fixes, canonical
docs/task/HANDOVER update and a prompt for the next milestone. Phase 2 section 20 owns
the concrete cross-phase queue and prompt contract; Phase 3 links it. Section 19's
parallel dependencies and existing milestone gates remain, with no whole-phase agent
assignment or automatic next-target execution. GPT-6 official guidance was fetched;
Astra behavior examples are starting points for the selected Sol team. No production
implementation/agent/build/provider/SDK/CI execution was started. Existing push
rejection remains unresolved: guideline commit `6330291` and subsequent documentation
are local-only until explicit authorization for the existing GitHub planning branch.
