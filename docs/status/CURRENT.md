# Current status

**Updated:** 2026-10-02.
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.

## Live continuation

**Current user-selected work:** [UI refresh implementation](../tasks/active/ui-design-review.md).
The accepted UI is implemented and **automated qualification now passes on both targets**.
[Run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
attempt 1, tested **d690d7f8ffc08fbc76411c95147f04422620afbc** and completed successfully
2026-09-30 03:12:29 UTC. All six packaged native scenarios per target passed with
cleanup, as did both boundary-smoke checks and all other required gates. SDK fetch
was skipped on cache hits; live first-install UI progress remains unverified.

**State: review_ready; no workflow pending.** Successful macOS/Windows installers and
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
