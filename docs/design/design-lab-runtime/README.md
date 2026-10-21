# Runtime & diagnostics comparison

Two unapproved drafts share fictional SDK, revision, diagnostics and execution state.

- [Run desk](http://127.0.0.1:5174/?screen=runtime&variant=desk&state=populated&theme=light&viewport=wide) gives the current run and readiness separate cards, with results below. It suits a writer who checks Run between edits.
- [Diagnostic console](http://127.0.0.1:5174/?screen=runtime&variant=console&state=populated&theme=dark&viewport=wide) keeps execution in a compact strip and gives the selected finding more space. Readiness follows the results. It suits repeated validation and source review.

Both use production fonts, colour tokens and icons. Compact layouts stack the
diagnostics. The app currently has a runtime panel; these lab pages compare its
contents as a dedicated workspace. Earlier approved designs remain intact.

## Capability and control map

| Control | Existing capability and reason to keep it |
| --- | --- |
| Run Game, Validate, Stop | Keep deliberate execution together. Validate compiles then lints. Stop cancels preparation or ends the owned run. There is no force-kill action. |
| Current status | Distinguish preparation, starting, running, compile/lint, stopping, completion, timeout, runtime error and unconfirmed cleanup. Exit 0 cannot override a reported runtime error. |
| Story preview | Shows an illustrative saved-scene sample without executing Python or claiming SDK validation. Closing it leaves the run active. |
| Revision chooser | Save All explicitly, use saved state while retaining drafts, or cancel. A pending Scene form returns to a separate Commit step. Save refusal keeps drafts and prevents preparation. |
| Session consent | Run and Validate explain that project Python executes with user privileges and consent is not a sandbox. Cancel has initial focus. Inspection shows project, SDK, SDK revision, saved revision and input inventory. |
| SDK & execution | Secondary maintenance holds pinned 8.5.3 selection, verification, install/reinstall, trust inspection/revocation and controlled play. It keeps maintenance out of the ordinary Run view. |
| Choose SDK | Compatible fictional choices work. Incompatible or failed verification retains the previous selection. Selection never starts execution. |
| Install/reinstall pinned SDK | Represents the existing SDK install flow with download, checksum, extraction, cancel and checksum refusal. Repair means reinstalling the pinned version. |
| Controlled play | Run requires this helper. A separate explicit saved edit adds it without overwriting a user script, disables developer tools and automatic reload for editor Run and does not execute anything. Validate does not require it. Normal samples start with the helper saved; Sample conditions can remove it. |
| Filters and selected finding | Show error/warning and compile/lint/runtime origin, keep the full message readable, retain old findings while a new operation runs and avoid opening every message. |
| Open source location | Reviews a read-only fictional target. Stale locations refuse navigation without changing source selection. Missing locations say so. Real integration must retain source input through the existing navigation lease. |
| Process output, launch details, previous validation | Keep bounded output and revision evidence accessible without crowding Run. Earlier validation remains labelled stale. Static Source/Branches checks do not count as SDK validation. |
| Leaving a running sample | Stop and confirm cleanup before the browser resets its sample. Failed cleanup retains ownership and blocks leaving. This lab-only navigation guard represents the app's project-close check. Native workspace navigation keeps the session runtime alive. |
| Sample conditions | Lab-only controls expose drafts, stale locations, save/SDK failures, runtime error, timeout and cleanup refusal. These are not proposed product preferences. |

## Simulation boundary

Names, source excerpts, SDK entries, revisions, reports and output are fictional.
All actions change browser memory. No project, filesystem, clipboard, SDK discovery,
chooser, download, checksum, installation, process, lint, trust grant, credential,
provider or model action occurs. Run and Stop use browser timers. Reload or sample
changes reset the state. Browser checks do not prove native execution, durable saves,
SDK integrity or process cleanup.

One controller makes both drafts equally reviewable and keeps their state transitions
in one place for the next engineer. Production integration must map controls to the
existing runtime and transaction controllers under ADR 0017. The fixtures stay in
Design Lab. Neither draft is approved.

## Verification and failure history

The chosen evidence host is the local Mac with the repository's pinned tools.
Allowance is one initial page cycle and up to two focused repair cycles. Root owns
registration, shared checks, production exclusion and final integration. Temporary
captures and reports are under `.toolchains/design-lab/pages/runtime/`.

Preparation typing found no Runtime error; concurrent Characters/Studio files had
typing errors, reported to the root owner for their respective agents. The initial
Runtime browser cycle reached all 32 rendering cases, then failed because the
diagnostic grid shrank below its selected message's height. Launch details overlapped
the Open source location button and intercepted clicks. Visual review confirmed the
same overlap. The panel and diagnostic body now retain their content height and scroll
through the workspace. Focused repair cycle 1 is next. The sandbox-blocked invocation
failed before browser content loaded because Chromium could not create a macOS Mach
port. Its separate report is retained; the authorised browser run used escalation.

Repair cycle 1 passes all 32 rendered cases and both interaction journeys. Visual
review confirms that selected findings and evidence no longer overlap. Further core
contract inspection found the controlled-play helper is required for Run, so normal
fixtures now start with it saved and a missing-helper scenario refuses Run before
preparation. External input changes invalidate session consent. The final focused
repair cycle will verify those prerequisites and capture the running state as well.

Final focused repair cycle 2 passes TypeScript and all 32 rendering cases, with both
layouts completing the full interaction journey on Chromium 155.0.8059.85, Node
24.19.0 and npm 11.9.0. The journey covers preview without execution/stop, trust
cancel/Escape and default focus, run/stop, compile/lint, retained earlier validation,
filters, source target and stale refusal, saved revision/draft retention, Save All
failure, separate Scene Commit, consent inspection/revocation, incompatible SDK and
verification refusal, installation cancel/checksum failure/success, controlled-play
prerequisite, cleanup refusal/retry, runtime error despite exit 0, timeout and consent
renewal after external input change. No browser errors were reported.

Visual inspection covered both layouts in light/dark at 1100 × 720 and 560 × 640,
plus trust, running, compact cleanup/runtime error and long retained output. Ordinary
Run status remains visible at the top. The run desk puts readiness before results;
the console reaches findings earlier. Selected messages and maintenance scroll in
the page without covering later controls. The root owner separately refined shared
disabled-primary styling; its final integration check owns that shared change.

Cumulative use is one initial cycle and two focused repair cycles. The initial
overlap report and first passing repair report are retained beside the final report,
with a separate sandbox-launch refusal report. The allowance is complete. Work is
local/uncommitted, both approvals remain null and no native, CI, package, model or
real SDK operation occurred. Root's combined check on 2026-10-21 passes all 32 Runtime
cases and both journeys, plus shared navigation, approval/source and production-build
exclusion. Fresh compact cleanup captures confirm the shared disabled-primary styling.
