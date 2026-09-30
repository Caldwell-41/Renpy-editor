# Current outcome handover

## UI implementation continuation — 2026-09-30

**State: awaiting_ci.** The user explicitly approved one Windows/macOS qualification
after the focused native Mac pass. One dispatch was accepted:
[run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
attempt **1**, workflow `production-scaffold.yml`, input `upload_packages=true`, branch
`feature/phase-1g-branches-runtime`, tested SHA
**d690d7f8ffc08fbc76411c95147f04422620afbc**, tree
`0948ced672f8c95c16df74c5da52d7c6d9212c77`. Created **2026-09-30 02:52:15 UTC**.
Observed at **02:52:25 UTC**: in progress; Preflight repository/privacy, rejection
fixtures and selector audit passed; Node setup running. No supported-target build or
case count is inferred before terminal audit. This subsequent wait checkpoint is
docs-only and does not change the tested candidate.

Continue the same chat/branch, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17). No additional dispatch,
automatic retry, merge, conflict resolution or new feature phase is authorized.
Resume with “The workflow is complete; audit run 36661814610 and continue.” Check
this exact run/attempt and fresh refs once; if still pending, retain the record and
stop polling. If terminal, audit every required gate, report/cleanup and package
identity, preserve failures/skips, then continue only remaining authorized work.
No autonomous Goal exists and no client runtime pause is claimed.

### Terminal evidence and diagnosis

[Run 36653112288](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36653112288),
attempt **1**, `production-scaffold.yml`, `upload_packages=true`, tested
**d129d9c016517ffecf7276bb04a4bb8e6fe996b1**, tree
`9b1deccc879d092c6e4323a87615c51d5b28e7c2`. Created 01:01:26 UTC; completed failed
01:28:10 UTC on 2026-09-30. Mac **5/6** packaged UI cases passed (route-a failed);
Windows **3/6** passed (route-a, route-b, UI-refresh failed). Both package builds and
preceding frontend/core/flow/browser/SDK/desktop/source-scan gates passed. Required
report gates failed; boundary smoke, dependency inventory and normal installer upload
were skipped. Failure package retention and deferred browser gates passed. All twelve
case reports confirmed cleanup. Exact jobs/artifacts/hashes and preserved failure
classification are in the [UI ledger](../tasks/active/ui-design-review.md#second-qualification-failure-and-timing-reassessment--2026-09-30).

The route driver treated debounced Saved text as completion while Beat commit still
held persistence ownership. A 150 ms delayed receipt reproduces the exact native
refusal locally; the driver now waits for the accepted form to disconnect. Windows
UI-refresh only reported Timeout at welcome despite several waits sharing that label.
Its 500-scene/506-file fixture exposed a missing local coverage dimension. A 1200 ms
initial Story read reproduces an early-Source contention failure; scene/authoring/flow
reads now share the renderer request lane with Source. Stop remains independent.
This fixes a real application race; native evidence does not yet prove it was the
Windows timeout's cause. The probe now reports granular stages and bounded failure
state. A separate test navigates early to verify the app fix, independently of the
probe's stable Story-ready setup. Route-b now uses the actual native 640×720 viewport
and opens the collapsed file tree through its control.

Local verification: **70 frontend tests / zero skipped**, complete Source/browser suite
including legacy rejecting control, CodeMirror selection/mixed-newline edits, visual
layouts, smoke, delayed UI-refresh, early navigation and all five shipped runtime
scripts; Rust formatting and desktop compile check pass. Expected red controls retain
the original route refusal, startup timeout and request-lane ordering failure. These
fixture-backed results are not native SDK/process/persistence acceptance. No native
assertion was weakened and no write is replayed. Logs/captures remain ignored under
`.toolchains/reports/ui-refresh-ci2-*`; repository/privacy/link and whitespace validation
are required before publication.

### Approved focused native check — completed

The user explicitly approved one local macOS build plus route-a, route-b and UI-refresh,
then said “Go ahead.” One release app bundle was built from clean candidate
`996737c0bea196416c11afea7ed5660c61e408ae`, tree
`adf733cdde3b2f89f400ed66493a183b1764ba29`, on local macOS ARM64 / Darwin 25.6.0.
Executable SHA-256: `44a09231de931d1ffc41eb1c72e86fc7b179f2029359174820a1653d09d217a6`.
Recorded source inputs and executable were rechecked after execution and match.
The initial CLI invocation placed `--bundles` after the cargo argument separator and
was rejected before native compilation. Its failure log is retained; corrected
`npm exec -- tauri build --bundles app -- --locked` completed the single native build.
No native failure was retried and no hosted workflow was dispatched.

| Case | Result | Elapsed | Cleanup |
| --- | --- | --- | --- |
| route-a | PASS | 89.292 s | confirmed |
| route-b (640×720) | PASS | 113.265 s | confirmed |
| ui-refresh | PASS, all five checks | 7.190 s | confirmed |

Both route cases passed real commit/reopen, controlled play, Source save during play,
Stop and disk reopen; route-b also passed draft refusal/cancel checks. Observed running
periods were 9504 ms and 10000 ms. UI-refresh passed native CSP styles, session draft
retention, fixed editor geometry during status updates, Settings return and device
preference round trip. These are native WebView/IPC/service/SDK checks with synthetic
input. This is supporting macOS proof for the correction, not full Windows/macOS
qualification or physical-input acceptance. The exact Windows timeout cause remains
unconfirmed. No source change followed the native pass.

Build, input identity, runner logs and three full reports are retained locally under
ignored `.toolchains/reports/ui-refresh-native-996737c`. The app bundle is under
`app/target/release/bundle/macos/Loomlight.app`; it was not installed into Applications.
No existing Loomlight instance was running before the disposable cases started.

### Allowance and same-chat wait

The user's latest “Yes” authorized exactly the third hosted dispatch recorded above;
that allowance is now consumed. Cumulative refresh: **three accepted hosted dispatches**,
each attempt 1; completed pre-dispatch evidence remains **five production builds**
(four hosted, one local) and **27 top-level native starts**, plus the separate early
Mac debug build/launch. Audit this run's actual additional builds/starts at completion.
The rejected local CLI invocation did not compile a native app. No GitHub attempt
rerun, duplicate dispatch or native case retry occurred; prior Q1 counts stay separate.

The locally tested correction was `996737c`; current candidate `d690d7f` adds only its
published evidence record. The three native Mac passes support this dispatch without
proving Windows success. Windows timeout confirmation, all required current-candidate
packaged cases and the previously skipped boundary smoke remain under audit. No
further allowance or merge is implied. Publish the wait record and stop model polling.

Physical keyboard/IME, actual OS drag/drop, live first-install/create progress and
focused human acceptance remain unverified. The accepted
[mockups](../design/ui-refresh/README.md) and [UI task](../tasks/active/ui-design-review.md)
own remaining visual scope. Earlier implementation evidence and first failed run
36647015944 remain in the task ledger; neither failed candidate is a qualified release.
Both second-run retained executables and Mac archive were hash-verified locally under
ignored `.toolchains/reports/ui-refresh-ci2-audit`; neither was installed or launched.
Artifacts expire 2026-10-07 UTC. Toolchain: source `.toolchains/enter-macos.sh`.

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
