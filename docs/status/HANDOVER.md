# Current outcome handover

## UI implementation continuation — 2026-09-30

**State: awaiting_ci.** The user explicitly approved one corrected Windows/macOS
qualification after the downstream audit. One dispatch was accepted:
[run 36653112288](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36653112288),
attempt **1**, workflow `production-scaffold.yml`, input `upload_packages=true`, branch
`feature/phase-1g-branches-runtime`, tested SHA
**d129d9c016517ffecf7276bb04a4bb8e6fe996b1**. Created 2026-09-30 01:01:26 UTC.
Observed at 01:01:58 UTC: in progress; Preflight repository/privacy, gate rejection,
selector and frontend checks passed; Source/browser preflight running. Supported
platform jobs have not yet been observed. The following wait commit is docs-only and
does not change the tested candidate.

No further dispatch, automatic retry or merge is authorized. Resume this same chat
with “The workflow is complete; audit run 36653112288 and continue.” Check this exact
run/attempt and fresh refs once. If still pending, retain the record and stop polling.
If terminal, audit every required result, retained reports, package identity and
remaining native acceptance, then continue the authorized outcome. Preserve failed,
cancelled, skipped or missing evidence. No autonomous Goal was created; no runtime
pause is claimed. Normal same-chat continuation is sufficient.

### Previous qualification and corrected-driver evidence

[Production run 36647015944](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36647015944),
attempt 1, tested `a82e89cf0210af328531727b171d050745216b53` and failed on both targets
at 2026-09-30 00:05:04 UTC. Both packages built; all twelve native UI cases failed
(ten at the stale recent-project selector; two on busy direct observations). Boundary
smoke and normal installer upload were skipped. Exact audit, artifacts and hashes
are in the [UI ledger](../tasks/active/ui-design-review.md#qualification-failure-and-downstream-driver-audit--2026-09-30).
The original failed evidence is preserved. The newly approved corrected dispatch is
recorded above and does not replace or relabel that failed candidate.

Bounded corrections plus the user's additional downstream audit are complete locally:
69 frontend tests, full Source/browser suite (including all five shipped runtime
scripts, UI-refresh and smoke driver paths), Rust format/check, nine package-retention
tests, selector/gate rejection controls and repository checks. Driver fixtures are
explicitly not native SDK/process/persistence/security acceptance. No core source,
product behavior, native assertion or timing budget was weakened. Optional Branches
probe compatibility was repaired without executing the retired native performance
exercise. The validator, runner and retained manifest now share all six ordinary cases.

The correction checkpoint was published and verified as `d129d9c`; the user's “Yes”
authorized exactly the corrected production dispatch recorded above. Continue on the
same branch and chat after the wait; do not infer any further run allowance.

Diagnostic copies of the failed candidate are hash-verified locally under ignored
`.toolchains/review-builds/ui-refresh-a82e89c/{macOS,Windows}`. They retain the old probe
scripts and are not qualified release installers. Neither was installed or launched
on this resume. The additional one-run allowance is now consumed. Cumulative refresh totals: one
early Mac debug build/launch; two hosted dispatches (initial plus one explicitly
approved correction), each attempt 1. The first produced two Tauri builds/twelve
native case starts; actual second-run build/start/artifact totals await terminal audit.
No GitHub attempt rerun or duplicate dispatch occurred. Prior Q1 counts remain separate.


The user explicitly authorized building the accepted UI. Continue the same outcome
and chat on `feature/phase-1g-branches-runtime`, starting from `119cc75`. Preserve all
local changes and prior Phase 1G work. No merge, conflict resolution or new feature
phase is selected. The [UI task](../tasks/active/ui-design-review.md) and saved
[mockup index](../design/ui-refresh/README.md) own scope and visual references.

The refresh candidate is implemented and published; its first final qualification failed.
Corrected test drivers are locally verified; their one approved native requalification
is in progress as recorded above. No merge or integrated-tree qualification is selected.

Local evidence: 67 frontend tests pass; final build/typecheck and Rust formatting pass;
real Chromium retains the rejecting legacy Source control and passes textarea/CodeMirror
Save/selection, mapped selection, mixed-newline deletion/grouped undo/redo, shipped smoke
interactions, both themes, all workspaces and compact/laptop/1440p layouts. Routine core
passed 177 tests (39 existing ignored, 3 separately selected); the subsequently added
written-byte progress test passed separately. Desktop boundary test passed 1/0 ignored.
Official SDK lifecycle and download-handoff gates each passed 1/0 ignored. The first
lifecycle attempt failed under filesystem sandbox restrictions; retain that failure as
an environment-limited attempt, not a product pass.

One early macOS debug proof build and one disposable native launch passed CSP styles,
real draft IPC, stable status geometry, Settings return, preferences and cleanup. It
predates final refinements and is not final package qualification. Windows interactive
access is unverified. Native physical keyboard/IME, actual OS drag/drop and live
first-install/create progress remain explicit evidence gaps; the new offline/channel
and synthetic native tests do not close those rows. Audit package output before any
final human acceptance. Existing prior Phase 1G acceptance remains separate.

Toolchains: source `.toolchains/enter-macos.sh` (Node24.19/Rust1.90/pinned SDK8.5.3).
Temporary captures and logs live under ignored `.toolchains/reports/ui-refresh*`.
Do not commit host paths/logs/SDKs. Existing mockups are unchanged repository assets.
The prior delivery handover below is historical scope/evidence, not a stop instruction
for this approved implementation. Publish coherent code/docs only after verification.

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
