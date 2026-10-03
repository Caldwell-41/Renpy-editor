# Current outcome handover

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

## Concurrent Phase 2–3 planning — 2026-10-02

The user selected docs-only planning of the next two major phases while Phase 1G
review continues, and chose Story logic before screen design for Phase 3. The isolated
branch `codex/phase-2-3-planning` starts at local Phase 1G checkpoint `de2fdad` and
has its own managed worktree; the original feature checkout remains in place.
Remote feature head was `3c5ce24` at planning entry, so the fork also preserves the
then-unpublished chapter/Writing-focus documentation commit. No feature ref is moved.

[Phase 2](../tasks/active/phase-2-initial-llm-assistance.md#14-october-milestone-sequencing)
retains existing requirements with an early complete rewrite outcome and current
workflow/testing policy. [Phase 3](../tasks/active/phase-3-initial-wysiwyg-release.md)
is a reviewable draft with proposed subsets and open decisions. The planning request,
Story-before-Screens priority and the Phase 2 reference/prompt/size requirements
recorded below are selected; implementation remains
`not_started`, dependent on accepted Phase 1 through 1H and later bounded selection.

Next in this planning chat: review and refine the proposed subsets. Continue Phase 1G
from the unchanged review sections above in its existing checkout. Planning uses any
Codex host and documentation checks only; zero app builds, launches, provider calls or
manual production dispatches are selected. Preserve the existing Phase 1 budgets.
Publish planning to its own branch; do not merge it or retarget it into active Phase 1
work automatically. At later integration, reconcile this short concurrent note with
the then-current HANDOVER rather than replacing newer Phase 1 state with this snapshot.

Planning evidence: repository validation passed across 315 files; whitespace and
six-document scope review passed. Publication target: `origin/codex/phase-2-3-planning`;
no planning PR or merge. Verify its head against the local planning commit before
reporting publication. The primary worktree acquired active Phase 1 edits during this
session; they remain exclusively with that workstream and were not copied or staged.

### Phase 2 references and controls refinement — 2026-10-02

The user selected Character cards and a lorebook, both manual and LLM-generatable,
as generation references; editable/viewable system prompts with baseline reset; and
context/response limits. The Phase 2 brief now puts manual reference editing before
the first rewrite and LLM draft/update completion in 2C.3. Canonical product/data/UI
and roadmap descriptions agree. Phase 2 and Phase 3 include plain-language end states.
Provider expansion is a recommendation: tested extension scaffolding and optional
unverified compatible profiles, with no new required provider or waived baseline gate.
Official provider docs were read; no inference request occurred.

Continuation: discuss provider priorities and remaining Phase 3 subsets on this same
planning branch. Original Phase 1 work remains in its own checkout. Documentation
validation and whitespace/scope review apply; publish only these documentation edits
and verify the planning remote head. No app/native tests or production dispatch.

Refinement evidence: repository validation passed for 315 files; whitespace and
eight-document scope review passed. Publication target remains the existing planning
branch, with no merge or additional-provider implementation selected.

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

Implementation-plan validation: repository structure/text/privacy/local-link checks
passed for 315 files; whitespace and eight-document scope review passed. Self-review
removed the remaining roadmap 3E row and checked that product/release acceptance no
longer requires Git. No application, SDK or native checks were run for these docs.

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

UX planning verification: repository structure/text/privacy/local-link validation
passed for 319 files, whitespace/scope review passed, and the generated image was
visually inspected. The written spec corrects the schematic Call return wording and
limits the manual preview claim. Publication uses the existing planning branch; no
merge or planning PR is selected. No application tests are needed for this docs/image
change. The next action is user review of the proposed interactions and remaining
Phase 3 subsets, not implementation. Resolve this checkpoint's SHA from Git.

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

LLM UX verification: repository validation passed for 329 files, whitespace/scope review
passed, and all four images were visually inspected by the parent. Explicitly reviewed
reference approval may combine save and approve; no redundant mandatory two-click
approval step was added. Publication target remains `origin/codex/phase-2-3-planning`.
The subagent's initial worktree save approval was interrupted before any write; the
parent completed the same prepared save with worktree authorization. No duplicate
image generation occurred. Resolve the final checkpoint from Git; no new Goal or CI.

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

Delivery-plan verification: repository structure/text/privacy/local-link validation
passed for 329 files; whitespace and six-document scope review passed. Checked the
Phase 2/3 entry gates, first-rewrite dependency, provider-qualification review boundary,
separate milestone acceptance, operation allowlist and unchanged deferred Git scope.
No application/native/provider checks were run for these documentation changes.
Publish the coherent update on `origin/codex/phase-2-3-planning` and verify its remote
head. No new PR, merge, agent launch, build/CI allowance or implementation is selected.
Resolve this checkpoint's SHA from Git; next remains subset/UX review and bounded
implementation selection after Phase 1 acceptance.

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

Native-media planning verification: repository validation passed for 329 files;
whitespace and eight-document scope review passed. Checked native-only container/codec
qualification, no conversion/GIF pipeline, shared appearance/asset ownership, static
drag/resize without keyframes, idle lifecycle and the retained Run From Here timing
boundary. No media/SDK/app/native tests were run; candidate profiles remain unqualified.
Publish on `origin/codex/phase-2-3-planning` and verify the remote head. No new PR,
merge, build/CI allowance or implementation is selected; resolve this checkpoint from Git.
