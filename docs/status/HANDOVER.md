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
pending implementation. No input/navigation or
creation was performed by the agent. Next: review Project details, generated folder
name and exact destination preview with disposable input, then advance to SDK.

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
