# Current outcome handover

## Review corrections complete; awaiting installer selection — 2026-10-02

Source implementation checkpoint **`e4013fa76672205b9166bb97752da1aeb8856a86`**, parent
`27f1fe92bcb857237a627303e8e6f41d99f09769`, on
`feature/phase-1g-branches-runtime`. Publish and verify this checkpoint and the
coherent documentation closeout on the same branch. Preserve main `4d7ba0333c48d60242a9a42d3e079fea499a5531`
and the separate `codex/phase-2-3-planning` worktree at `8a9da37`.
Fresh PR #17 inspection: OPEN, draft, CONFLICTING; no integration/conflict resolution.

The [completed correction record](../tasks/active/ui-design-review.md#review-corrections-implemented-and-locally-verified--2026-10-02)
owns the full finding disposition, root causes and limits. Welcome/wizard/button,
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
