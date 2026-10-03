# Current status

**Updated:** 2026-10-03.
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.

## Live continuation

**State: catalogue layout/staged-preview corrections implemented; installer unchanged; Windows deferred.**
The user reports provisional acceptance with further review open, then selects fixes
for Character/Variable layouts and a selected-image preview in the import modal.
[CATALOG-05 / ASSETS-03](../tasks/active/ui-design-review.md#catalogue-layout-and-staged-import-preview-follow-up--2026-10-03)
is implemented at source **`cedef502c7f517a808319696ba3a94952377f41d`**, parent `002c753`.
Character mixed-image/placeholder Grid/List layouts and the Variable table's four
columns now align. Selected images replace the initial Choose section; smaller Add
files, loading/error/Retry, remove/discard/reopen and read-only retained-file preview
preserve explicit import confirmation and transaction ownership.
Local checks pass: **85 frontend tests**, web build, **7 focused core tests**, **1
macOS desktop test**, full actual-renderer regression including catalogue alignment
at three widths/both themes and staged PNG decode/compact actions. Format/diff and
repository validation pass (**325 files**). WIN-UI-14 joins the deferred list.
No native/file-drop/final UX pass is claimed. Delivered installer `19cdcaa` predates
these/sidebar/Branches changes; no replacement installer was selected this turn.
CONFIG-01 and physical/live-progress/final UX acceptance remain open. Remote planning
advanced to `267ec2a`; its separate local worktree remains `2c5a164`. Preserve both.
PR #17 remains OPEN/draft/CONFLICTING. No hosted request, package, native/SDK app
start, integration or new phase; no pending operation.

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
