# Phase 1F — bounded Save correction (1F-SAVE)

**Prepared:** 2026-09-21 after the independent Source-save architecture review.
**State:** build #90 packages verified; Windows and macOS native F4 A/B/C user-reported PASS (section 7.28); final Phase 1F closeout review remains. Phase 1F is not accepted or integrated.
**Parent milestone:** [Phase 1F Source synchronisation](phase-1f-source-synchronisation.md).
**Decision:** [ADR 0007](../../adr/0007-shell-save-command-ownership.md).
**Branch / PR:** `feature/phase-1f-source-synchronisation`, existing draft PR #14.
**Historical application candidate:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`, production #87 passed. Corrected candidate/evidence are recorded in section 7.23.
**Publication state:** the current correction publishes bounded implementation, regressions and documentation on the existing branch/PR.
Original 1F-SAVE `a720ea3f` and #84 candidate `85e44e92` remain historical evidence,
not the current application or acceptance decision.

## Authority and scope

The user requested this documentation and a next-chat implementation goal after the
independent review. Publishing this brief changes no application code and authorises
no production dispatch in the documentation task. Starting the 1F-SAVE goal selects
this one bounded correction, its self-review, and its specified validation. Follow
[WORKFLOW](../../WORKFLOW.md), [CURRENT](../../status/CURRENT.md), and the single
[HANDOVER](../../status/HANDOVER.md). Inspect fresh refs, PR state, and the worktree;
never reset to a SHA quoted here or overwrite another executor's work.

This brief supersedes the old continuation instruction to dispatch `4dfedd24`
immediately. Correct and test first. Keep the existing branch/PR and all useful 1F
work; do not replay completed entry checks, CI-SIMPLE housekeeping, or earlier phases.
Do not merge, start 1G, create another branch/PR, revive W0/OPT-1A, or build a general
command framework, new CI controller, autosave journal, parser, or exporter.

Scope is the smoke model, shell/Source command arbitration, directly related draft
retention and lifecycle sequencing, and their tests/evidence. Preserve existing core
source/transaction/reconciliation/history semantics and renderer permissions. A newly
demonstrated core defect warrants only an evidence-backed minimal correction; a
material redesign remains a separate approval boundary.

## 1. Evidence and corrected diagnosis

Production runs [35544944804](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35544944804)
at `4fc544559e9f5d7ea8d591f08b95fb58bf2c30ef` and
[35553029892](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35553029892)
at `822e3fbeea9e90409ecc66988322cc524309468c` failed packaged Source smoke on Windows
x64 and macOS ARM64 after preflight, core, SDK/lifecycle, desktop-boundary, and packaging
steps passed. The second failure was `source-focused-save: Timed out waiting for
Source acceptance`. This is failed gate evidence, not a successful native acceptance.

The tested predicate was `called.has("source.save") && projectStatus === "saved"`.
Its timeout does not identify which half failed or prove that Save was never invoked.
The retained reports have no Source operation sequence. Earlier ledger wording that
says the failure was before a `source.save` call is an unverified interpretation,
explicitly superseded here; preserve the historical entries and exact failed runs.

The old target listener already stopped propagation before the window bubble listener.
The capture patch has a useful listener-disposal regression, but the assertion that
native WebViews skip the textarea listener is not established by those reports.
`dispatchEvent()` returning false proves cancellation, not command identity or success.

The independently identified harness defect is in the authoring fake requester in
[smoke_probe.js](../../../app/src-tauri/src/smoke_probe.js): every `source.updateDraft`
marks the document dirty, sets Pending validation, and increments draftVersion, even
when only selection changed. In contrast,
[source_update_draft](../../../app/src-core/src/source.rs) compares text to the accepted
base and increments the draft version only when the draft changes.

Failure mechanism to reproduce: save completes; Source redraws its textarea and sets
selection positions; queued selection notifications enqueue unchanged text; the fake
requester re-dirties the saved document; the next acceptance poll sees Pending
validation. A reduced Chromium experiment from the review observed:

| Handler | Draft model | Source saves | Global Flushes | Final status |
| --- | --- | --- | --- | --- |
| Textarea target | Unconditional dirty on update | 1 | 0 | Pending validation |
| Window capture | Unconditional dirty on update | 1 | 0 | Pending validation |
| Textarea target | Compare with accepted text | 1 | 0 | Saved |
| Window capture | Compare with accepted text | 1 | 0 | Saved |

This establishes a reproducible harness failure mechanism, not the exact historical
ordering on both supported targets. The experiment was neither the full application
nor WebView2/WKWebView. The implementing chat must reproduce the behaviour in a retained
regression using the actual Source surface and smoke model; it must not depend on a
prior chat attachment or treat the reduced experiment as native acceptance.

`4dfedd24` leaves that fake dirty rule unchanged. Its repository-quality run
[35554153917](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35554153917) passed,
but the reviewed state has no production run for it. Refresh actual history at entry
without speculative dispatch or polling. Do not transfer old gate results to a changed
application candidate.

## 2. Implementation requirements

### S1 — correct the smoke and test doubles

Make the fake Source service retain accepted text separately from the editable draft.
Derive dirty state from their difference; selection-only/identical-text updates do not
advance the draft version or re-dirty accepted text. Successful fake acceptance moves
the accepted base/version consistently; preflight/refusal leaves both intact. Match the
real service's relevant update/save/no-op revision rules instead of inventing a second
product semantics. Project status must derive from all simulated drafts/conflicts and
recovery, not from the last operation. Fix affected local doubles as well.

Keep genuine input and selection handling. Do not make the smoke pass by disabling
selection events, dropping the Saved assertion, bypassing the UI Save command, forcing
status to Saved, increasing timeouts, or recording a call without its successful
completion. Use explicit readiness/settlement conditions rather than arbitrary sleeps.

### S2 — one shell-owned Save command

Implement ADR 0007 with one application-lifetime keyboard adapter and one small Save
coordinator. Source must register no window/global Save listener. Toolbar Save Source
and keyboard Source Save use the same acceptance executor; toolbar activation explicitly
captures its document and does not depend on the focus left after a click.

Resolve editing context semantically through the Source controller, not shell queries
for a textarea, CSS class, or selection properties. Include local input and pending
retention, not just the last returned `current.dirty`. A just-corrected invalid draft
must be judged from the new settled text, not refused from stale cached diagnostics.
Use a captured session/controller/document-open identity, not a future read of mutable
`current`. Active workspace alone does not imply Source editing focus.

| Context | Required command result |
| --- | --- |
| Source editing context with local or retained draft | Settle that captured input, then accept it once if valid. No fallback Flush on refusal or failure. |
| Clean Source, with no pending input after settlement | Perform normal project Flush; do not manufacture a Source commit/history action. |
| Outside Source editing context | Normal project Flush, without accepting any Source draft or supporting form input. |
| Source draft invalid/conflicted/unavailable or persistence busy | Refuse or report busy; preserve input. Do not fall through to Flush and report Saved. |
| Modal open | Suppress background Save/Flush; only the modal's explicit actions run. |
| No project | No persistence command. |

Keyboard semantics are Windows Ctrl+S and macOS Cmd+S. Exclude Shift/Alt variants from
ordinary Save; do not introduce Save All through an accidental modifier match. Do not
accept during IME composition or automatically run a deferred Save after composition.
Consume recognised repeat/busy Save without starting more operations. Preserve existing
non-target modifier aliases only if intentional, documented, and separately tested;
an alias never substitutes for the required target-native binding.

### S3 — retention barrier, operation ownership, and duplicate prevention

Acquire the existing per-session authoring/persistence exclusion before the first await.
Source acceptance must cooperate with `activeAuthoringOperations` and
`activeFlushOperations`, including their token-matched release and completion policy.
Do not add an independent lock which the existing authoring/Flush paths bypass.

Use a short, visible acceptance barrier: prevent new text changes, document/workspace
navigation, and conflicting Source actions while the captured draft is being settled
and accepted. Preserve focus, selection, and native undo on refusal. Enforce the barrier
in command entry points as well as disabled controls. Do not replace the editor merely
to disable it. Do not hold a typing lock throughout ordinary draft retention.

Drain pre-existing draft updates in order and retain the captured latest text before
acceptance. The command's own retention work must not reacquire and deadlock against
its mutation lease. A queue that catches an error must still expose failure to the
barrier: failed retention means no Source acceptance, no older-draft acceptance, no
success status, and no destructive redraw. Keep the latest local text available for
retry/copy or an explicitly confirmed discard; never force it into the bounded core
registry by relaxing resource limits.

Double-click, key repeat, and toolbar-plus-shortcut must result in at most one in-flight
acceptance for the captured intent. Return the existing outcome or a clear busy result;
do not build an unbounded queue or accept a different current document later. An
already-running Flush or other authoring operation must prevent competing acceptance.
Release ownership in `finally`, including errors, disposal, and stale completions.
A matching-token release must never clear a newer operation.

If settlement proves a shortcut's initially pending input is actually unchanged,
continue to normal Flush under the same coordinated ownership, without an unlock gap
or nested incompatible acquisition. This is clean fallback, never failure fallback.
Successful `source.save` is already durable through the existing core transaction
boundary; do not append an unnecessary second `project.flush` after acceptance.

### S4 — document, view, and session safety

Capture and check project session, controller instance, document-open generation, and
relevant local input sequence. Path equality is insufficient when the same path is
reopened. Check identity before starting acceptance after a wait and before applying
success, error, status, redraw, or focus changes. A stale controller must not retarget a
new session or file. Disposing a controller immediately revokes command ownership;
its cleanup cannot unregister a replacement controller.

A core command already accepted is not undone by renderer disposal. Suppress its stale
presentation and refresh authoritative state only for the still-relevant session.
Retain core session/revision validation and the desktop lifecycle mutex; frontend
coordination complements them and is not a replacement for them.

Coordinate `observeCurrent`, refresh, open, and selection notifications with the
barrier and input generation. An old observation cannot overwrite new text, redraw a
replacement view, or steal focus. Account for inventory/open operations that can
reconcile clean source mappings; do not assume every read-shaped operation is free of
core side effects. Suspend/invalidate affected observations during acceptance and
resume from the resulting generation, without disabling external-change detection.

### S5 — adjacent actions, navigation, leaving, and status

Apply the same ownership/identity discipline to Apply Both, confirmed Discard/Reload,
Save All, Discard All, close/switch/normal exit, and their completion callbacks. These
must not overtake retention or an in-flight Save. Retain explicit confirmation,
Cancel/no-change, proven merge preview, and all-before-write Save All preflight.

Before same-project navigation releases the active editor, settle its local input into
the existing session registry without accepting it. A failed retention cancels navigation
and preserves the editor. Before a close/exit decision queries inventory, settle pending
input and establish a leave barrier so typing cannot race between inventory and close.
Close with no core drafts but an unretained local edit must not silently discard it.
An explicitly confirmed discard may abandon local-only text; merely opening a modal,
blur, navigation, or a failed save may not. Keep resource-limit diagnostics actionable.

While a leave/discard dialog is open, background controls must not save or navigate;
contain keyboard focus and restore it only to a live matching control after Cancel.
The explicit Save All action acquires the normal mutation ownership; modal ownership
must not deadlock it. If Save All fails, retain the remaining drafts and keep the
project open. A preflight refusal writes zero files; an interrupted/uncertain commit
may require recovery and must not be described as guaranteed zero writes.

The shell owns project persistence status. Combine fresh `project.status` with any
newer local/unretained input and operation state; another dirty file prevents Saved,
Conflict/Recovery required retain precedence, and pending status reads cannot overwrite
newer operations. Source may request status refresh or show document diagnostics, but
must not announce project Saved just because its current buffer or inventory looks
clean. If status verification fails after durable acceptance, distinguish accepted
work from unconfirmed project status; do not blindly resubmit acceptance.

## 3. Local regression matrix — mandatory

Use the real shell/controller integration and deterministic deferred completions for
race tests. Assert command identities, started/completed counts, exact submitted text
and revisions, preserved input/selection, and final state, not only labels or source
string presence. Extend existing tests rather than replace coverage. Record a test
name and exact invocation for every row in the execution ledger.

| ID | Exercise | Required result |
| --- | --- | --- |
| L1 | Fake and real-service no-op update; selection after Save/redraw | Unchanged text stays clean; no draft-version increment from selection; no second acceptance. |
| L2 | Actual shell + Source toolbar/shortcut | Shared executor; exactly one successful Source acceptance per fresh edit; no fallback Flush. |
| L3 | Clean Source; non-Source; dirty other file; supporting unsubmitted form | Normal Flush where applicable; no implicit Source Save All/form submission; truthful project state. |
| L4 | Type then immediately Save with update response delayed | Latest captured text accepted only after successful retention; no stale dirty/invalid decision. |
| L5 | Reject newest retention with an older valid retained draft | Zero acceptance calls; newest text/selection/undo retained; retry works; no false Saved. |
| L6 | Invalid/conflicted/unavailable input; recovery; Save rejection | No failure fallback, no draft loss; correct diagnostic and persistence precedence. Preflight refusal leaves disk unchanged. |
| L7 | Held shortcut; double click; toolbar plus keyboard; existing authoring/Flush | One in-flight acceptance, no competing Flush; token released on success/error/stale completion; no deadlock. |
| L8 | Delay Save/open/discard/Apply Both; switch view/file; reopen same path; replace session | No retargeting or stale redraw/status/focus; old disposal cannot remove new controller. |
| L9 | New typing/navigation/observation during acceptance | Barrier enforced; pre-barrier latest input included; stale observation rejected; external refresh resumes afterward. |
| L10 | Type then immediately navigate/close/normal-exit | Navigation retains without acceptance; leave sees latest input; retention failure prevents silent loss. |
| L11 | Save All with one invalid draft; failed commit/recovery; Discard All; Cancel | Preflight failure writes none; uncertain outcomes stay open with drafts/recovery; explicit discard only; Cancel no change. |
| L12 | Save through leave/discard modal; keyboard traversal and return focus | Background commands suppressed; explicit actions work without deadlock; focus restored only to a live target. |
| L13 | Windows Ctrl+S; macOS Cmd+S; Alt/Shift; composition; repeats | Correct binding and explicit exclusion/coalescing policy; no auto-Save All or deferred composition Save. |
| L14 | Other dirty/conflict/recovery; delayed project.status; post-accept status failure | Never false project Saved or accidental retry; higher-severity/current state survives late reads. |
| L15 | Draft undo/redo, refused Save, accepted edit, committed history | Draft undo does not write; refusal preserves undo; one accepted edit gives one intended history entry. |
| L16 | Non-textarea semantic editor adapter; mount/unmount/remount | Routing independent of textarea internals; no accumulated global listeners/stale controller. |

At least L1 must also run in a real browser using the actual Source UI and faithful
smoke model, allowing native queued selection notifications to settle. Happy DOM or
manually calling `saveCurrent` alone is insufficient. Add a minimal retained, runnable
browser regression with its exact command and supported setup; do not assume a script
or browser dependency exists. Keep new dependencies justified and locked.

First demonstrate the old unconditional-dirty model fails the clean-after-save assertion
while Source Save can have run once and Flush zero times. Then prove the corrected
model passes. Exercise at least the immediate-save/retention-failure/stale-completion
regressions against the old behaviour where practical, and record red/green evidence.
Do not leave an expected-failure substitute as the only test of corrected behaviour.

Retain the parent 1F matrix: real source/Scene/disk round trips; invalid and opaque
handling; exact external conflicts and Apply Both; all-draft preflight; UTF-8/BOM/LF/
CRLF/supplementary Unicode; size/count limits; same-file guards; committed history;
recovery; lifecycle; media/security denial. Do not weaken these to pass the UI fix.

## 4. Supported-target acceptance — mandatory before review-ready

Separate the following evidence layers. Mocked UI, synthetic keyboard events,
real-service durability, and native keyboard delivery are different claims.

**P1 — packaged visible command:** On Windows x64 and macOS ARM64, edit Source, wait
for actual retained-draft/dirty readiness, activate the visible Save Source button,
and observe exactly one completed acceptance. After queued selection notifications
and a subsequent Source refresh, the document remains clean. Project Saved is required
only when no other pending/conflict/recovery state exists.

**P2 — packaged command routing:** Make a separate fresh edit; establish that the
current connected editor owns the editing context; send Ctrl+S on Windows or Cmd+S on
macOS. Assert one completed Source acceptance and zero fallback Flushes for this phase.
Then verify clean Source and a non-Source context each perform normal Flush without
accepting other drafts. Use per-phase deltas, not lifetime Set membership.

**P3 — native input:** Record the actual native keyboard-delivery path on each supported
target for dirty Source, clean Source, and non-Source contexts. A synthetic DOM event
with ctrlKey/metaKey proves only renderer routing. Use existing supported automation,
or a recorded manual test of the exact packaged candidate. Record OS/architecture,
package identity, command steps and observed outcome without private paths. No native
access means this criterion is outstanding, not passed. Do not build a new automation
platform or weaken application privileges just to automate this row.

**P4 — real persistence:** Use an isolated test project through the real Source IPC/
service boundary on each target, not the authoring fake requester. Demonstrate accepted
text on disk, matching Scene projection/provable IDs, one intended history action,
no-op/selection stability, invalid-save refusal, and accepted bytes after close/reopen.
A packaged real-service check can satisfy overlapping P1/P2/P4 claims if its actual path
is recorded. Existing core tests remain necessary but mock UI acceptance alone cannot
prove an end-to-end disk save. Reuse existing fixture/lifecycle/native test facilities;
no generic renderer filesystem access or production bypass is permitted.

**P5 — diagnostic evidence and full gate:** Give button and shortcut checks independent
stage/results so a failure in one does not masquerade as proof about the other. Add a
bounded phase-local trace with route, origin, input modifiers, context/generation,
operation start/completion/error and final persistence state. Prefer synthetic fixture
identifiers; never log project text, secrets, absolute host paths or real session tokens.
Classify not-routed, retention-failed, acceptance-refused, recovery-required,
accepted-then-redirtied, and stale-completion-discarded separately. Preserve all Source
and security terminal assertions; update host/core report validation and workflow
checks together if the report schema changes. A missing/false required marker fails.

The final exact application candidate must pass the existing full Phase 1 production
gate, including both target jobs, packaged smoke, subsequent artifact/security scans,
and dependency/licence checks. A successful package/core step is not the full gate.
Native manual evidence is additionally required where the automated gate does not
exercise P3/P4. Do not call the milestone review-ready while any mandatory row is
failed, skipped, unavailable, or unverified.

## 5. Execution order, self-review, and stop conditions

These are steps within one correction, not new milestone approvals.

1. Verify current branch/PR/ownership and inspect the named code paths. Record
   `in_progress` in this ledger. Reproduce the harness defect and add focused failing
   regressions before changing the command model. Record observed facts separately
   from the unresolved historical root-cause hypothesis.
2. Implement S1-S5 in small compiling increments. Preserve the transaction service;
   trace successful Source acceptance through its existing durable return before
   deciding any extra Flush is needed. Keep the temporary UI barrier reversible and
   non-destructive. Document actual controller interface and lease/generation rules.
3. Run cheap checks first. From repository root: `python3 scripts/validate.py` and
   `git diff --check`. From `app/`: locked dependency setup with
   `npm ci --ignore-scripts`, `npm run check`, `npm run build`,
   `cargo fmt --check --all`, `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`,
   and `cargo test -p loomlight-core --locked`. Run the new exact browser command.
   From root retain `python3 -m unittest discover -s spikes/lossless-source/tests -v`,
   `python3 -m unittest discover -s spikes/renpy-sdk/tests -v`, and
   `python3 spikes/lossless-source/benchmark.py`. On supported desktop environments
   also use the existing desktop tests/package gate. Record unavailable tools as
   unavailable; Linux browser/core tests are not Windows/macOS evidence.
4. Self-review the complete correction diff against S1-S5, L1-L16 and P1-P5. Inspect
   every await/early return/cleanup and every Save, status, observer, and leave entry
   point. Verify the tests exercise production integration rather than a parallel fake
   router, and deliberately cover both success and refusal. Fix significant findings
   and rerun affected checks plus the frontend suite/build. Record a requirement-to-
   test/evidence matrix, not a general claim that all tests passed.
5. Publish one coherent corrected candidate. When the user starts the implementation
   goal including supported-target validation, dispatch the existing production gate
   once for that candidate after local checks pass. Check for an already-running or
   ambiguously dispatched equivalent run before dispatch; never blindly duplicate.
   Do not dispatch production for this documentation-only change or the uncorrected
   capture candidate. After terminal failure, diagnose only demonstrated blockers and
   rerun only after a coherent justified correction; no speculative retry loop.
6. Inspect actual terminal target results and P1-P5 evidence. For a long external wait,
   publish the exact run/attempt/SHA, outstanding operation and next action, then stop
   active model polling under WORKFLOW. No imaginary watcher, reset, or second agent.
   Missing native access may require a manual-evidence handover; it is not permission
   to redefine acceptance or begin the next milestone.
7. Before ending, update this execution ledger, the parent milestone's concise ledger,
   CURRENT, the single HANDOVER and PR #14 with implemented versus verified status,
   exact candidate, commands/counts/skips, red/green results, self-review findings,
   required outstanding evidence, and one bounded continuation. Verify remote files
   and branch/PR state. Do not claim review-ready/complete merely because code was
   published or repository quality passed. Stop for independent review; no merge/1G.

## 6. Expected files and change limits

Primary: `app/src/main.ts`, `app/src/source-ui.ts`, a small command/controller module
where appropriate, `app/src-tauri/src/smoke_probe.js`, and shell/Source/leave tests.
A retained browser regression/setup is in scope. `app/src/bootstrap.ts` or narrow
styles may change only where needed for exit/focus/barrier wiring. Update
`app/src-core/src/lib.rs`, `app/src-tauri/src/main.rs`, protocol tests and
`.github/workflows/production-scaffold.yml` only as required for coherent smoke
reporting or bounded real-service evidence. Preserve renderer capabilities/CSP.

Core `source.rs`, `scene.rs`, lifecycle, and transaction modules are reference and
regression dependencies, not a rewrite workstream. Document any demonstrated reason
for a small necessary core change before making it. Align UI/ARCHITECTURE/TESTING
wording with ADR 0007 and implemented behaviour at correction closeout; leave unrelated
product design and historical acceptance intact.

## Execution ledger

2026-09-21 planning publication: the user requested repository documentation and a
new-chat goal for the reviewed fixes. Recorded 1F-SAVE, ADR 0007, corrected causal
confidence, specific implementation requirements, local/target evidence and self-review
obligations. No application change or production dispatch is part of this publication.
The previous immediate-dispatch handover is superseded. Implementation and validation
of this correction remain `not_started`; previous application evidence belongs to the
candidate explicitly named above, not to this planned design.

2026-09-21 implementation and verification closeout: resumed the existing branch and
draft PR without resetting the substantial `b8f15275` checkpoint. The final tested
application candidate is `a720ea3fb150f2a49422e8385256179185129968` (tree
`8edc9136aa362e180faa52421584f519aa0c0935`). Repository-quality run
[`35624010863`](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35624010863),
attempt 1, passed at that exact SHA.

The complete correction diff was reviewed against S1-S5 before further edits. Two
demonstrated evidence defects were fixed: the real-browser regression did not retain
an executable historical red case, and packaged smoke recorded cumulative commands
without enforcing per-phase Save/Flush deltas. Subsequent target runs exposed three
more smoke-only defects: selection was dispatched before the Source Save barrier
released, later clean/navigation phases had the same barrier race, and failed smoke
reports were discarded and surfaced only as watchdog timeouts. The smoke now waits on
the controller's explicit `data-source-busy=false` state, retains failed reports, and
emits bounded Source checkpoints. No Source transaction or reconciliation architecture
was redesigned.

### Local commands and results

| Command | Result |
| --- | --- |
| `python3 scripts/validate.py` | Passed, 215 repository files. |
| `git diff --check` | Passed. |
| `npm ci --ignore-scripts` | Passed with Node 24.19.0/npm 11.9.0. |
| `npm run check` | Passed typecheck and 25/25 frontend tests. |
| `npm run build` | Passed Vite production build. |
| `cargo fmt --check --all` | Passed. |
| `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings` | Passed. |
| `cargo test -p loomlight-core --locked` | Passed: 147 tests; four documented worker fixtures ignored. |
| `python3 -m unittest discover -s spikes/lossless-source/tests -v` | Passed 26/26. |
| `python3 -m unittest discover -s spikes/renpy-sdk/tests -v` | Passed 24/24. |
| `python3 spikes/lossless-source/benchmark.py` | Passed: 620,000 bytes, 40,000 nodes, 156.88 ms median. |
| `npm run test:source-browser` | Locally unavailable: no system Chromium; Playwright downloads failed with CDN timeout/502/truncated archive. The same command passed in Preflight and both target jobs. |
| `cargo test -p loomlight-desktop --locked` | Locally unavailable before compile because this Linux client lacks `pkg-config`/GLib development metadata. It passed on both supported targets. |

The final target browser output retained executable red-to-green evidence. Preflight
printed `source-browser-red: legacy-clean-assertion=false saves=1 flushes=0 updates=11 dirty=true`
and `source-browser-green: faithful-clean-assertion=true saves=1 flushes=0 updates=11 dirty=false`.
macOS printed the same counts; Windows printed 11 legacy updates and 10 faithful
updates, with the same one Save, zero Flush and dirty-to-clean distinction. This is the
actual Source UI and selectable fake model, not a prose reconstruction.

### S1-S5 requirement matrix

| ID | Status | Evidence |
| --- | --- | --- |
| S1 | Implemented and verified | Faithful accepted-text/draft fake plus the retained red/green browser run; unchanged selection stays clean. |
| S2 | Implemented and verified locally; target partial | One shell listener and controller-owned semantic capture; shared toolbar/keyboard executor; frontend shell test and Windows packaged checkpoints. macOS packaged routing is outstanding. |
| S3 | Implemented and verified | Ordered retention, barrier, shared operation ownership, duplicate suppression, exact per-phase Save/Flush assertions, and `finally` release are covered by focused DOM/shell tests. |
| S4 | Implemented and verified locally | Controller/document generation, input sequence, session completion token, observation suppression, stale remount and disposal tests pass. |
| S5 | Implemented and verified locally | Navigation retention, leave barrier/modal, Save All failure retention, focus/status ownership and post-accept status failure tests pass. |

### L1-L16 evidence matrix

| ID | Status | Exercised evidence or outstanding part |
| --- | --- | --- |
| L1 | Pass | Core no-op rules, frontend selection regression, and browser red/green. |
| L2 | Pass locally / Windows packaged | Shared executor test plus Windows `source-button-save-complete` and `source-shortcut-save-complete`; macOS packaged phase outstanding. |
| L3 | Partial | Clean Source and non-Source exact Flush routes are tested and reached on Windows. A combined dirty-other-file plus unsubmitted-supporting-form scenario is not a distinct retained case. |
| L4 | Pass | `immediate Save waits for latest retention...` uses a delayed update and asserts latest accepted text. |
| L5 | Pass | The same focused test rejects newest retention, retains text, and verifies retry. |
| L6 | Pass locally | Core invalid/conflict/unavailable/recovery and UI fail-closed/refusal cases retain drafts and prevent fallback. |
| L7 | Pass locally | Duplicate toolbar clicks, repeat/busy keyboard paths, coordinated ownership and token release are exercised. |
| L8 | Partial | Stale Save completion, view switch, same-path remount and old disposal are tested; every delayed Discard/Apply Both permutation is not separately exercised. |
| L9 | Partial | Input barriers and stale-generation rejection are tested; a dedicated external-observation-resumes-after-acceptance case remains outstanding. |
| L10 | Pass | Immediate navigation/close settles local input; failed retention cancels leave and preserves the editor. |
| L11 | Pass | Core Save All zero-write preflight/recovery and frontend Save All/Discard All/Cancel close behavior pass. |
| L12 | Pass | Modal background suppression, keyboard containment and live-target focus restoration are exercised. |
| L13 | Pass synthetic / native outstanding | Ctrl/Cmd, Shift/Alt, composition and repeat policy pass shell tests; actual OS-native P3 is absent. |
| L14 | Pass locally | Conflict/recovery precedence, stale status suppression and post-accept status failure are covered. |
| L15 | Pass | Draft undo/refusal and core committed-history behavior pass retained suites. |
| L16 | Partial | Semantic controller routing and mount/unmount/remount pass; a distinct non-textarea editor adapter fixture is not present. |

### Final production evidence and P1-P5

Final production run [`35624108754`](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35624108754)
(workflow #75), attempt 1, ran exactly SHA `a720ea3fb150f2a49422e8385256179185129968`.
Preflight passed. Windows x64 job `106414336722` and macOS ARM64 job
`106414336670` passed real-browser, core, official-SDK lifecycle,
`phase-1f-source-save-target-gate`, desktop-boundary and packaging steps, then failed
the packaged WebView smoke. Subsequent secret scan and dependency/licence inventory
were skipped by that failure. Windows retained every bounded Source checkpoint through
`source-complete`; macOS timed out before `open-source-workspace`. Both primary logs
ended with `packaged boundary smoke report timed out`.

| ID | Windows x64 | macOS ARM64 | Conclusion |
| --- | --- | --- | --- |
| P1 packaged visible Save | Pass for the Source phase: `source-button-save-complete`, selection-clean and `source-complete`. | Outstanding: packaged flow did not reach Source. | Partial. |
| P2 packaged routing | Pass for Source dirty Save, clean Source Flush and non-Source Flush checkpoints; reaching `source-complete` also requires the exact zero-fallback deltas. | Outstanding: packaged flow did not reach Source. | Partial. |
| P3 native Ctrl/Cmd+S | Outstanding. | Outstanding. | Synthetic DOM/WebView events are not native input evidence. |
| P4 real-service persistence | Pass: target lifecycle emitted `phase-1f-source-save-target-gate: passed`. | Pass: target lifecycle emitted the same marker. | Real service covers disk, projection/history, refusal/no-op and reopen; this is separate from the fake packaged UI. |
| P5 trace/full gate | Fail: Source checkpoints are retained, but the later smoke watchdog failed and scan/inventory skipped. | Fail: no Source checkpoint before watchdog; scan/inventory skipped. | Full production gate failed. |

Diagnostic predecessor runs `35613460026`, `35615201780`, `35616730283`,
`35618387359`, `35620508570`, and `35622463437` were each attempt 1 on their exact
then-current candidate and isolated the smoke-model delta, barrier races, discarded
failure reports and watchdog boundary. No SHA was rerun and the final candidate was
dispatched once.

Self-review covered every Save/Flush owner, await and early return, controller/session/
document generation check, operation-token `finally` release, retention rejection,
observation refresh, modal/leave path and status update. Significant findings were
the evidence defects and smoke races above; affected syntax, frontend, formatting,
core schema, repository validation and whitespace checks were rerun after correction.

**Outstanding evidence:** macOS packaged P1/P2, native P3 on both targets, a complete
P5 run, L3's combined state, L8's full delayed adjacent-action set, L9 external-refresh
resumption, and L16's non-textarea adapter fixture. Phase 1F is not review-ready and
PR #14 must remain draft.

**One continuation action:** independently review `a720ea3f`, then repair or split the
pre-Source/post-Source legacy packaged-smoke tail so both target jobs reach a terminal
report and complete scan/inventory; rerun the production gate only on a new coherent
candidate and collect native Windows Ctrl+S/macOS Cmd+S evidence. Do not merge or begin
Phase 1G.


## 7. Independent-review follow-up — 1F-SAVE-EVIDENCE

**Selected:** 2026-09-22 after independent review of application candidate
`a720ea3fb150f2a49422e8385256179185129968`.
**State:** automated evidence closed; `blocked` on native P3 only. Completed E1-E6
remain retained, and section 7.16 records the passing exact-candidate P5 evidence.
**Purpose:** close the remaining evidence/harness blockers without reopening the Save
architecture. The shell-owned Save coordinator, Source controller, retention barrier,
transaction/reconciliation/history path and Source core are retained unless a focused
regression demonstrates a new application defect.

### 7.1 Evidence driving this follow-up

Final production run
[35624108754](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35624108754)
ran exact application candidate `a720ea3f`. Both supported targets passed the browser
regression, core, official-SDK lifecycle, real-service
`phase-1f-source-save-target-gate`, desktop-boundary and packaging work before the
packaged smoke failed. Windows retained every Source checkpoint through
`source-complete`; macOS reached the same host timeout before the first Source
checkpoint. Both logs ended with `packaged boundary smoke report timed out`.

Independent review found two concrete smoke-host defects:

1. `app/src-tauri/src/main.rs` uses one fixed 60-second deadline for the entire
   packaged smoke, irrespective of progress. The current enlarged smoke can therefore
   be killed after a successful Source phase or before Source begins.
2. The accepted-report and rejected-report branches use the same
   `smoke_enabled && is_smoke_report` condition. The rejection branch is unreachable,
   and report handling does not explicitly require a successful CoreResponse.

These are acceptance-harness defects. They are not evidence for another Source Save,
transaction, reconciliation or command-routing redesign.

### 7.2 E1 — make smoke-report rejection terminal and trustworthy

In `app/src-tauri/src/main.rs`, distinguish a successful smoke response from a
rejected/schema-failed response. The normal post-report path requires all of:

- smoke mode enabled;
- operation is `probe.smokeReport`;
- the resulting `CoreResponse` is successful.

A rejected smoke report is still terminal evidence: set the report-received signal so
the watchdog does not later mislabel it as a timeout, print a bounded diagnostic, flush
stderr and exit non-zero. Do not weaken the report schema or convert invalid payloads
into successful evidence.

Prefer the smallest testable condition/helper. Add only the focused regression needed
to prove a successful report is accepted and a failed report cannot enter the success
path. Do not create a Tauri integration framework merely for this branch condition.

### 7.3 E2 — replace the obsolete 60-second deadline, without a new watchdog system

Replace the inline 60-second sleep with one named coarse host safety limit:

```rust
const PACKAGED_SMOKE_TIMEOUT: Duration = Duration::from_secs(180);
```

The JavaScript probe already gives individual waits short bounded timeouts. The Rust
deadline is therefore only the outer protection against the entire probe disappearing
or never reporting. Do not build a resettable heartbeat service, phase scheduler,
watchdog thread network, or new CI orchestration layer in this correction.

Add only these coarse checkpoints to the existing packaged probe, reusing
`probe.smokeCheckpoint`:

- `pre-source-complete`: immediately before entering the Source section;
- retain the existing `source-complete` equivalent;
- `post-source-recovery-complete`: after the safe/ambiguous recovery tail;
- `post-source-conflict-complete`: after conflict presentation;
- `final-report-start`: immediately before invoking `probe.smokeReport`.

Do not checkpoint every click. Do not split the packaged smoke on this first attempt.
If a 180-second bounded run still fails, use these stages to decide whether a later
split is justified instead of increasing the timeout speculatively.

### 7.4 E3 — finish L3 with one shell regression

Extend the existing Save-command shell test rather than adding a new suite. Model:

1. current Source is clean;
2. another Source file keeps project status `pendingValidation`;
3. a supporting workspace contains unsubmitted form input;
4. the ordinary platform Save shortcut is invoked outside Source editing context.

Assert exactly:

- `project.flush` increases by one;
- `source.save` and `source.saveAll` do not run;
- no Character/Variable/supporting mutation is submitted implicitly;
- refreshed project status does not become Saved while the other Source draft remains.

One representative supporting form is sufficient; do not duplicate this across every
supporting workspace.

### 7.5 E4 — finish the meaningful L8 stale-action coverage

Do not create a delayed-action permutation matrix. Add two deterministic cases to the
existing Source DOM tests:

**Delayed Discard:** start confirmed Discard, hold the mocked `source.discard`,
dispose/remount the controller including reopening the same path, then resolve the old
operation. The replacement view must keep its content, registration, status and focus;
the old completion must not redraw or retarget it.

**Delayed Apply Both:** repeat the same identity test for a conflict document with held
`source.applyBoth`. The old merge completion must not redraw/retarget the replacement
controller.

These two cases cover the destructive and accepted-reconciliation adjacent actions.
Do not enumerate every view/action cross-product unless one of these cases exposes a
new invariant violation.

### 7.6 E5 — finish L9 with deterministic observation resumption

Use the existing Source UI test. Under a Tauri-like test window, capture the callback
registered by `setInterval(observeCurrent, 2000)` instead of waiting in real time.

1. Start a Source Save and hold its mocked `source.save` completion.
2. Invoke the captured observation callback while the Source barrier is active.
3. Assert no observation-driven `source.open` occurs.
4. Resolve Save and allow the barrier to release.
5. Invoke the same observation callback again.
6. Assert observation-driven `source.open` occurs and external observation is active
   again.

This proves both suppression during acceptance and resumption afterward. Do not add a
production-only testing hook or real two-second sleeps.

### 7.7 E6 — close L16 by the architectural boundary, not a hypothetical editor

L16 exists to prevent the shell Save router from depending on textarea implementation
details. Review the production shell boundary and record it satisfied when
`app/src/main.ts` routes only through `SourceWorkspaceController` semantics and does
not inspect `.source-editor`, `HTMLTextAreaElement`, `selectionStart` or
`selectionEnd` to decide Save ownership.

The current Source controller may continue to implement the present textarea editor.
Do not build a dummy rich editor, generic editor framework or new production abstraction
solely to satisfy L16. If executable evidence is considered useful, a tiny semantic
controller stub at the shell boundary is the maximum justified addition.

### 7.8 Narrow validation for this follow-up

The expected application changes are limited to:

- `app/src-tauri/src/main.rs`;
- `app/src-tauri/src/smoke_probe.js`;
- `app/tests/save-command.dom.test.ts`;
- `app/tests/source-authoring.dom.test.ts`;
- documentation/PR closeout.

A production TypeScript or core change requires a newly demonstrated failing regression
and must be explained in the ledger before widening scope.

Run cheap relevant checks first:

From repository root:

```bash
python3 scripts/validate.py
git diff --check
```

From `app/`:

```bash
npm ci --ignore-scripts
npm run check
npm run build
npm run test:source-browser
cargo fmt --check --all
```

Because `main.rs` changes, compile/check the desktop crate wherever the current host
supports it. If the local Linux client still lacks the required WebKit/GLib metadata,
record that as unavailable rather than changing the host or substituting another claim;
the supported-target production gate must compile/test the desktop crate.

Do not rerun the full core suite, lossless-source suite, SDK archive suite or large
benchmark locally merely to repeat unchanged evidence unless the correction actually
touches those subsystems or a focused test demonstrates a dependency. The production
workflow will re-exercise its existing core/lifecycle target gates on the exact final
candidate.

Before publication, self-review only the changed behaviour: successful versus rejected
smoke report, 180-second outer bound, checkpoint placement, L3/L8/L9 tests, and L16
shell-boundary inspection. Confirm no Source acceptance semantics, transaction
durability, recovery rules, revision matching, renderer privilege/CSP or Save routing
were accidentally changed.

### 7.9 One final automated target gate

After focused local checks and repository quality pass, publish one coherent candidate.
Check first for an already-running or ambiguously dispatched equivalent workflow, then
dispatch the existing Phase 1 production gate once.

Both Windows x64 and macOS ARM64 must reach a terminal packaged report and satisfy the
existing Source/security markers. The workflow must then continue through the artifact
secret scan and dependency/licence inventory. A target that only reaches packaging,
Source checkpoints, or a partial report does not satisfy P5.

If the run fails, use the new coarse checkpoints to identify the exact stage. Do not
blindly increase the timeout, rerun the same SHA, split the smoke, or modify Source Save
without demonstrated evidence.

### 7.10 Native P3 evidence stays separate and simple

Synthetic Ctrl/Cmd events continue to prove renderer routing only. P3 requires one
actual packaged keyboard check on each target:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat with Cmd+S.

Record exact application candidate/package identity, OS/architecture and observed
outcomes. Use existing native automation only if it already provides trustworthy OS
input. Do not build an accessibility/window-automation system for this checkpoint.
If the executing environment cannot generate real native input, publish the precise
manual checklist above and leave P3 explicitly outstanding for the user; do not relabel
synthetic evidence as native.

### 7.11 First-attempt confidence recorded for execution planning

| Item | First-attempt likelihood |
| --- | ---: |
| E1 rejected-report fix | 99% |
| E2 timeout/checkpoint implementation | 97% |
| E2 removes the currently observed timeout failure | ~85% |
| E3 L3 focused regression | 95% |
| E4 delayed Discard/Apply Both coverage | 85% |
| E5 observation-resumption coverage | 85–90% |
| E6 architectural L16 closure | 98% technically; ~85% if a reviewer insists on an executable fixture |
| Focused local validation | 95% |
| Windows final production job | ~90% |
| macOS final production job | ~80% |
| Both target jobs on the same first final run | ~75% |
| Windows native P3 check | 95% |
| macOS native P3 check | 90% |
| No broader Phase 1F redesign required | ~90% |

The lower whole-run confidence is dominated by the currently unobserved macOS packaged
tail after removal of the premature host deadline, not by evidence of a Save-architecture
defect.

### 7.12 Completion and stop condition

This checkpoint is complete only when the focused corrections are implemented,
self-reviewed and published; L3/L8/L9 are closed; L16 is explicitly closed at the
semantic shell boundary; one exact corrected candidate completes the automated
Windows/macOS production gate including scan/inventory; and P3 native evidence is
either collected or explicitly handed over as the sole manual blocker.

Update this ledger, the parent Phase 1F ledger, CURRENT, the single HANDOVER and PR #14.
Keep PR #14 draft and stop for independent review. Do not merge, begin Phase 1G, create
another branch/PR, replay the original 1F-SAVE implementation, or revive abandoned
W0/OPT-1A work.

### 7.13 Execution closeout

The bounded correction is implemented at application candidate
`fc918ae9c69f451d17e8d93292f7e4980d88356d` (tree
`de7821df25cce564d24009026869bdf22fb81b71`). E1 now admits only a successful
`probe.smokeReport` response to the accepted path; rejection sets the terminal signal,
emits a bounded diagnostic, flushes stderr and exits non-zero. E2 uses the named
180-second coarse ceiling and exactly the five specified checkpoints. E3 closes L3
with the combined clean-current/dirty-other-Source/unsubmitted-Character case. E4
closes L8 with delayed Discard and Apply Both across controller replacement. E5 closes
L9 with captured observation suppression during held Save and resumption after release.
E6 is closed by inspection at the `SourceWorkspaceController` shell boundary: the
shell uses controller semantics and does not inspect textarea class, type or selection
fields to choose Save ownership.

The delayed L8 cases exposed one application defect: a disposed controller's old
barrier completion could still mutate the replacement DOM. The focused red run passed
9 tests and failed those two replacement cases; the one-line disposed guard in
`app/src/source-ui.ts` made all 11 pass. No shell Save routing, Source/core transaction,
reconciliation/history, recovery rule, revision match, CSP or renderer privilege was
changed. Self-review confirmed the successful/rejected report branches, the named
ceiling and five checkpoint placements, L3/L8/L9 evidence, and L16 independence.

Focused local validation passed: repository validation (215 files), whitespace,
frontend check (28/28) and production build. The local browser command was unavailable
because its Chromium binary is absent; supported-target Preflight supplied the browser
red/green evidence. Local Rust/desktop checks were unavailable because this client has
no Rust toolchain; Repository Quality and supported-target Preflight performed format,
compile and the focused Rust regression. Unchanged heavy core, spike, SDK archive and
benchmark suites were not replayed locally.

Repository Quality run `35689830891` passed for the exact candidate. After confirming
no equivalent run was active, Phase 1 production run `35689869416` (#81) was dispatched
once. Preflight job `106624364068` passed. Windows x64 job `106624505342` and macOS
ARM64 job `106624505374` both passed browser, core, official-SDK lifecycle, real-service
Source persistence, desktop-boundary and packaging. Both packaged reports then recorded
`pre-source-complete`, `source-complete`, `post-source-recovery-complete` and
`post-source-conflict-complete`, but not `final-report-start`, before the documented
180-second coarse ceiling. Both target jobs therefore failed packaged smoke and skipped
the subsequent secret scan and dependency/licence inventory. P5 remains failed.

Earlier correction runs supplied distinct diagnostics rather than same-SHA retries:
#76 exposed Rust formatting, #77 exposed the macOS modifier and stale conflict-copy
assumptions, #78 and #79 localized the remaining exhaustion after the conflict
checkpoint, and #80 falsified microtask-only polling because it starved task-based UI.
Candidate `fc918ae9` restores task yielding and retains terminal report batching; #81
still localizes the blocker to the monolithic packaged tail after conflict. No timeout
increase, smoke split or Source Save redesign is selected in this closeout. The next
review must decide whether that repeated cross-platform evidence justifies a separately
scoped smoke split or another focused harness correction.

Trusted native keyboard input was unavailable. P3 is explicitly outstanding with this
manual checklist on the exact packaged candidate: on Windows x64 verify dirty Source
Ctrl+S accepts, clean Source Ctrl+S performs ordinary Flush, and non-Source Ctrl+S does
not accept Source; on macOS ARM64 repeat the same three actions with Cmd+S. Synthetic
events are renderer-routing evidence only. PR #14 remains draft; stop for independent
review without merge or Phase 1G.

### 7.14 Final bounded harness correction

Independent review authorised one last harness-only candidate. Application candidate
`628c901d9c5e860656ab0c194bc104ae3c4b760c` (tree
`703bb7b747634e88583aa94817afedba6a9ddcd8`) changes the single named coarse ceiling
from 180 to 300 seconds and removes terminal concurrency. The probe now awaits
`post-source-conflict-complete`, finishes normal cleanup including requester restoration,
awaits `final-report-start`, then invokes and awaits `probe.smokeReport`. No heartbeat,
resettable watchdog, orchestration layer or elapsed-time infrastructure was added.
All smoke assertions, security assertions, Source traces, E1 rejection handling,
L3/L8/L9/L16 evidence and the disposed-controller guard are unchanged.

Focused local validation passed repository validation for 215 files, whitespace,
JavaScript syntax, frontend check 28/28 and production build. Cargo was unavailable on
this client. Self-review confirmed a two-file application diff: the only timeout change
is 180 to 300 seconds, terminal operations are sequential, the five checkpoint calls
remain, no assertion changed, and no Source/core/application architecture file changed.
Repository Quality run `35697359981` passed the exact candidate.

After confirming no equivalent run was active or ambiguous, Phase 1 production run
`35697492679` (#82) was dispatched once. Preflight `106647498726` passed. Windows x64
`106647641203` and macOS ARM64 `106647641198` both passed browser, core, official-SDK
lifecycle, real-service Source persistence, desktop-boundary and packaging. Both
packaged artifacts retained `pre-source-complete`, `source-complete`,
`post-source-recovery-complete` and `post-source-conflict-complete`, followed by
`packaged boundary smoke report timed out`; neither retained `final-report-start`.
Packaged smoke failed on both, so secret scan and dependency/licence inventory were
skipped. P5 remains failed.

The sequential ordering narrows the demonstrated blocker: the awaited post-conflict
checkpoint reaches the host and is persisted, but its IPC response does not return to
the JavaScript probe before the 300-second absolute ceiling. Per the authorised stop
condition, do not increase the timeout again, rerun the same SHA, start another yield
experiment, split the smoke automatically or modify Source Save. Native P3 remains the
existing manual Windows Ctrl+S/macOS Cmd+S checklist. Keep PR #14 draft and stop for
independent review.


### 7.15 Timing-only diagnostic after failed 300-second run

Independent review of production run
[35697492679](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35697492679)
corrects one over-strong inference in the prior closeout. The retained
`post-source-conflict-complete` record proves that the host received and printed that
checkpoint. Because checkpoint records did not contain elapsed time, it does **not**
prove that the IPC response then remained blocked for most of the 300-second ceiling.
The checkpoint may instead have arrived very near the absolute deadline.

The next approved checkpoint is diagnostic only. Keep application candidate behaviour,
the 300-second ceiling, JavaScript yield strategy, five checkpoint locations, sequential
terminal reporting, Source Save/core behavior, security assertions and workflow
unchanged.

Instrument the existing native `probe.smokeCheckpoint` handler with one monotonic
`elapsedMs` field measured from packaged-smoke start. Use native
`std::time::Instant`; do not derive timing from the renderer event loop. Start the
clock immediately before the packaged probe/timeout threads are launched so the values
correspond to the same wall-clock interval protected by `PACKAGED_SMOKE_TIMEOUT`.
All five existing checkpoint calls automatically receive the measurement; add no new
checkpoints, heartbeat, timers, retries or renderer logic.

Run repository validation/whitespace and Rust formatting/desktop compile where
available. Publish one coherent diagnostic candidate and run the existing production
gate once on that exact SHA. Preserve the target artifacts.

Interpret the result without automatically changing code:

- If `post-source-conflict-complete` lands very near the 300-second ceiling, the
  evidence supports monolithic smoke duration/budget exhaustion rather than a long
  checkpoint-response stall. Return for review before deciding how to partition the
  smoke.
- If it lands substantially earlier and `final-report-start` remains absent until the
  300-second kill, the evidence supports a terminal IPC/return stall after host receipt.
  Return for review before changing the Tauri boundary.
- If timing is intermediate or targets differ materially, preserve exact values and
  return for review; do not infer a fix.
- If the full gate unexpectedly passes, retain the timing evidence and proceed only to
  the already-defined native P3/manual acceptance boundary.

Do not increase the timeout, alter yield behavior, split the smoke, modify Source Save,
or rerun the same SHA as part of this diagnostic checkpoint.

### 7.16 Final-report lexical scope correction

The user's 2026-09-22 continuation authorises only the reviewed trace-declaration
scope fix and a small executable regression against the actual production probe.
This supersedes the terminal IPC/return-stall inference in sections 7.14–7.15;
neither stalled checkpoint IPC nor insufficient time was established.

Native run [35702906716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35702906716)
(#83), attempt 1, used `1d5704b738de25a1b95197cc0866f866ae52826d`.
Preflight `106664883810` passed. Windows job `106665056764` retained
`post-source-conflict-complete` at 1,017 ms; macOS job `106665056681` retained it at
5,157 ms. Both then ended at the 300-second ceiling without `final-report-start`.
Those timings localise missing terminal reporting, not its mechanism.

Artifact inspection confirmed Windows artifact `10683248578` and macOS artifact
`10683138492` contain these native elapsed values, followed by the exact error
`packaged boundary smoke report timed out` (no final checkpoint/report):

| Checkpoint | Windows x64 elapsedMs | macOS ARM64 elapsedMs |
| --- | ---: | ---: |
| pre-source-complete | 947 | 4516 |
| source-complete | 988 | 5072 |
| post-source-recovery-complete | 1007 | 5147 |
| post-source-conflict-complete | 1017 | 5157 |
| final-report-start | absent | absent |

Both jobs failed packaged smoke and skipped secret scan/dependency inventory.

Independent local execution of the actual reporting code with UI/IPC stubs found
`ReferenceError: sourceCommandTrace is not defined`: its declaration is inside the
authoring `try`, but report construction is outside that scope and catch. Move the
single array declaration to the enclosing callback before the `try`, preserving all
collection and assertions. Retain an executable red/green regression via the existing
frontend check/preflight path for successful reporting, guarded authoring failure,
and incomplete trace rejection. Corrected native acceptance remains unverified.

Preserve the 300-second absolute ceiling, sequential terminal reporting, all five
checkpoint locations, native `elapsedMs`, task yielding, security/Source assertions,
E1 rejection handling and disposed-controller guard. No Source/core, routing,
transaction, reconciliation, recovery, privilege or CSP changes are authorised.
Run focused regression, syntax, frontend check/build, repository validation and
whitespace checks; self-review before one exact new candidate and gate. On failure
retain SHA/run/jobs/error/timings and stop, without retry or speculative changes.
P3 remains the section 7.10 native manual checklist.

#### Local red/green and self-review

`app/tests/smoke-report.dom.test.ts` loads and executes the entire production
`smoke_probe.js` unchanged in a VM, using Happy DOM, the actual shell/Source UI and
the probe's existing authoring requester. Desktop IPC/network denial are stubs, not
security or native acceptance evidence. The existing `tests/*.test.js` discovery in
`npm test` includes this group via `npm run check`, which the unchanged production
Preflight runs before packaging. No dependency, workflow or alternate probe was added.

Retained original red result on `1d5704b…` probe content, before the declaration move:
`npm run build:tests && node --test dist-tests/tests/smoke-report.dom.test.js`
failed all three subcases (Node summary: 0 pass, 4 fail including the parent group).
Success threw `ReferenceError: sourceCommandTrace is not defined` at
`smoke_probe.js:586:36`; authoring-failure and incomplete-trace received that same
ReferenceError instead of the expected `Smoke report was rejected.` failure.
No final report could be submitted. After the one-declaration move, the identical
regression passed all three subcases (4/4 including the group):

- success: exactly one report, successful authoring and valid Source/shell trace;
- guarded checkpoint rejection before Source: exactly one report attempted, truthful
  failed authoring flags and stage, empty Source trace and false trace assertion;
- completed authoring with missing shell acceptance trace: exactly one report
  attempted, authoring remains true but trace assertion is false.

Both negative cases also exercise the unchanged JavaScript report-rejection path.
Cleanup precedes `final-report-start`, which precedes the report; the successful case
asserts the complete ordered five-checkpoint sequence.

Focused checks on Node 24.19.0/npm 11.9.0 passed: the command above;
`node --check app/src-tauri/src/smoke_probe.js`; `npm run check` (32/32, no skips);
`npm run build`; `python3 scripts/validate.py` (216 repository files); and
`git diff --check`. Unchanged heavy core/SDK/spike/benchmark suites were not replayed.
No Rust file changed in this correction.

Exact-diff self-review found no further significant defect: one trace declaration in
callback scope, no inner shadow; existing four pushes and all final assertions
unchanged; guarded failure reaches reporting; the 300-second ceiling, sequential
awaits/cleanup, all five checkpoint locations, `elapsedMs`, task yielding, E1 handling,
L3/L8/L9/L16 and disposed guard remain unchanged. Source Save routing, core transaction,
reconciliation/history, recovery, revision checks and renderer privileges/CSP have
zero diff. Native P5 on the corrected candidate remains unverified pending the gate.

#### Published candidate and external wait

Application candidate **`85e44e926399ae7ad8431c948e1751db04dcde35`**, tree
`ca22dc8486a7114eeda227821582a7945a344d77`, is published on the existing branch/PR.
It preserves reviewed remote `1d5704b…`; equivalent local history was reconciled
without reset or discarded edits. Repository Quality
[35707727479](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35707727479)
passed on this exact candidate.

After inspecting the production workflow list and confirming #83 was the latest
terminal run with no equivalent active/ambiguous dispatch, dispatched
[35708223679](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35708223679)
(#84), attempt 1, **once**. Its run-summary commit link verifies the exact candidate.
Preflight `106682217975` passed; Windows x64 `106682384572` and macOS ARM64
`106682384566` were in progress at handoff. The artifact API returned no artifacts
yet. No corrected packaged final report, target scan or inventory is claimed passed.
Preflight logs explicitly retain all three new regression cases passing and frontend
summary `tests 32`, `pass 32`, `fail 0`, confirming execution before packaging.

Under AGENTS/WORKFLOW no-polling rules, no qualified same-thread continuation exists
here: publish this `awaiting_ci`/manual-resume checkpoint and stop active polling.
Resume by inspecting this existing run's terminal jobs and both evidence artifacts;
do not dispatch another run. P5 needs both accepted final reports with all required
Source/security assertions, then successful secret scan and dependency/licence
inventory on both targets. On failure retain exact error/timings/SHA/run/jobs and
stop for independent review, with no timeout/yield/split/Source changes or retries.
P3 remains outstanding under section 7.10. PR #14 stays draft; no merge or Phase 1G.

#### Terminal evidence closeout — 2026-09-22

The user authorised inspection and evidence closeout of the existing run only, with
no redispatch. Ref/PR/worktree inspection found remote documentation head
`e7b5a4bc91a2d34dc13f22dd3c22cadba2b1934e`, open draft PR #14 and a clean,
content-equivalent local tree. No newer application work was overwritten.

Run **35708223679 (#84), attempt 1**, completed successfully on exact application
candidate **`85e44e926399ae7ad8431c948e1751db04dcde35`**. Artifact metadata independently
confirms that SHA and branch; target logs identify attempt 1. This supersedes the
pending handoff above, not its historical evidence.

| Job | ID | Packaged final report | Secret scan | Dependency/licence inventory |
| --- | --- | --- | --- | --- |
| Preflight | 106682217975 | Not a packaged target; passed frontend/browser/format gates | — | — |
| Windows x64 | 106682384572 | Accepted, passed | Passed | Passed |
| macOS ARM64 | 106682384566 | Accepted, passed | Passed | Passed |

Downloaded and inspected Windows artifact `10685588341`
(`phase-1-production-evidence-windows-2025`) and macOS artifact `10685592982`
(`phase-1-production-evidence-macos-26`). Each contains exactly one
`production-packaged-boundary` terminal report, with all reported boolean assertions
true: lifecycle, supporting/Scene/Source authoring, Source command trace, WebView
restrictions, navigation/popup denial and single-instance enforcement. Authoring
stages are `complete`. Trace evidence retains button Save and synthetic Ctrl+S/Cmd+S
Source acceptance with zero fallback Flushes, clean Source Flush with zero Saves,
non-Source Flush, and shell accepted/flushed/completed phases. The host's accepted
report path and successful smoke step establish acceptance, not merely receipt of
`final-report-start`.

| Checkpoint | Windows x64 elapsedMs | macOS ARM64 elapsedMs |
| --- | ---: | ---: |
| pre-source-complete | 834 | 4802 |
| source-complete | 869 | 5631 |
| post-source-recovery-complete | 886 | 5728 |
| post-source-conflict-complete | 894 | 5779 |
| final-report-start | 898 | 5782 |

Both jobs also passed core, official-SDK lifecycle, real-service Source persistence
(`phase-1f-source-save-target-gate: passed`), desktop boundary and packaging. Each
artifact contains a parsed dependency/licence inventory with 85 npm and 519 Cargo
entries. The post-smoke scan and inventory steps are successful, not skipped.
Optional packaged-application upload was skipped because it was not selected; the
evidence archives are not installable packages. Artifact retention expires
2026-09-29. This ledger retains the decisive results without committing raw logs.

**P1/P2/P4/P5 automated evidence passes on both targets for this candidate. P3 remains
outstanding:** packaged shortcuts here are synthetic events, not trusted native input.
The exact section 7.10 manual three-action checklist remains required on each target,
with candidate/package identity, OS/architecture and observed outcomes. No new native
automation, production rerun, merge or Phase 1G is authorised by this closeout.

Evidence-only self-review confirmed exact SHA/job/artifact mapping, all five timings,
accepted final reports, subsequent scans/inventories and the separate P3 boundary.
Only four documentation files and PR text changed. Repository validation and
`git diff --check` passed; unchanged application suites were not replayed. The
remaining acceptance blocker is P3; stop for independent review with PR #14 draft.


### 7.17 Native P3 package delivery

After independent review, the user explicitly requested Windows/macOS builds,
repository publication and a detailed checklist. This authorises one installer-delivery
run with package upload enabled and supersedes the prior no-redispatch instruction
for that purpose. It does not authorise application changes, merge, Phase 1G or new
native automation. Existing #84 acceptance remains historical passing evidence.

Inspected fresh PR/ref and the workflow list: PR #14 remains open/draft at
`6d1ab428b2e3cd052323a8890c27897fb906b937`, no equivalent active production run was
present, and the delta from reviewed `85e44e92` contains only four documentation files.
The user-requested installers therefore retain the reviewed application code.

Dispatched [35711244992 (#85)](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35711244992),
attempt 1, exactly once using the existing workflow with `upload_packages=true`.
The run page confirmed build SHA `6d1ab428b2e3cd052323a8890c27897fb906b937` and
Preflight job `106692103651`. Build completion and uploaded packages are not yet
claimed. Upload uses `continue-on-error`, so verify actual package artifact presence,
identity and expiry in addition to successful target jobs before claiming delivery.

The [native P3 checklist](phase-1f-native-p3-checklist.md) provides setup, six required
native checks, observable outcomes, handling for an unobservable clean Flush, optional
adjacent checks and separate target result records. It deliberately does not claim a
manual test can count internal IPC calls. Native P3 remains untested on both targets.
Only documentation changes in this checkpoint; keep PR #14 draft and preserve main.

Documentation self-review and `python3 scripts/validate.py` (217 files) passed, as
did `git diff --check`. No application suite was rerun locally for these doc changes.


### 7.18 Scene JSON contract correction

The user reported that editing the starting narration and inserting a new Beat both
fail with `The Scene operation is invalid.` during manual package testing. This
selects a bounded defect correction in the current branch/PR, with replacement
packages under the existing build/publication request. Native P3 is blocked at setup;
this report does not establish a native Save-key defect. Do not merge or start 1G.

Ref inspection found head `616667ce9b1d13928c7acf57d0c86cd685363946`, draft PR #14.
Run #85 (`35711244992`), attempt 1, is now terminal success on build ref `6d1ab428`:
Preflight `106692103651`, Windows `106692343143`, macOS `106692343146` all passed.
Its package artifacts exist: Windows `10687188438` and macOS `10686289367`, both
expiring 2026-09-29. Those packages contain the reported defect; package delivery
success is not user acceptance. Do not ask the user to repeat acceptance on #85.

Code inspection identifies the shared wire-contract defect. The renderer sends
`sceneId`, `expectedSourceRevision`, `beatId` and other camelCase fields. Both
`SceneCommand` and `BeatPayload` only declared enum `rename_all = "camelCase"`, which
renames variants but not their fields. Rust therefore expected snake_case fields.
`handle_application_request` maps a deserialization failure to the exact reported
`INVALID_PAYLOAD` message before any Scene transaction starts. Beat response payloads
also emitted snake_case character/asset/variable IDs, inconsistent with the renderer.
See [Serde's container attribute definitions](https://serde.rs/container-attrs.html).

Bounded production correction: add `rename_all_fields = "camelCase"` to these two
enums. The renderer contract, source bytes, transaction/revision/history semantics,
permissions and Save coordinator are unchanged. No speculative parser or Save redesign.

Regression coverage added:

- All 17 Scene command variants decode literal renderer JSON; a non-null
  `beforeBeatId` must be retained, not silently ignored.
- All 16 Beat payload variants decode and serialize the exact camelCase JSON shape,
  including nested Choice destinations and character/appearance/asset/variable IDs.
- A real `handle_application_request` test opens a generated starting Scene, edits
  its existing narration, inserts another narration before it, checks persisted
  order, rejects stale/malformed requests without writes, and verifies disk and
  projection after reopening with a fresh lifecycle service.

Why existing green evidence missed it: the packaged authoring smoke uses a fake
requester; the real Scene target helper constructs typed Rust commands and bypasses
JSON deserialization. The new regression crosses the actual JSON request boundary
and runs in the existing core suite on both targets. Historical passes are preserved
with this coverage limitation; they never certified the missing native P3 results.

Local Rust execution/formatting is unavailable: this client has no Rust toolchain and
the official distribution endpoint timed out. No executable pre-fix red or post-fix
Rust pass is claimed locally. Static review, repository validation and whitespace
checks are the local evidence; supported-target results must validate the correction
before replacement packages can be called ready. Do not weaken or skip any existing
production gate. Dispatch one coherent corrected candidate with package upload enabled,
record exact SHA/run/attempt, and stop on failure or a required manual-resume boundary.


Published correction `36904fd2deecf37bc55276bc4ce6e2eedb511d8e`, tree
`236e93c98fba24cd5855f857098d88ee9d65086a`, preserves entry head `616667ce`.
Remote comparison verified exactly two Rust files (two runtime attributes plus tests)
and six documentation files. Repository validation (217 files) and whitespace passed.
After confirming #85 terminal/no equivalent active run, dispatched
[35719196417 (#86)](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719196417),
attempt 1, once with `upload_packages=true`; the run page verified the exact candidate
and Preflight `106717842885`. Run #86 failed only at Rust formatting: two expanded
Serde attributes and one test method chain. Target jobs were skipped; no corrected
Rust test pass or packages resulted. Applied the exact three formatting diffs from
the job log without semantic changes. A new formatted candidate requires its own
validation run; #86 remains failed evidence, not an automatic retry of unchanged input.
Native P3 remains blocked/untested.

Formatted candidate `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`, tree
`ca2aec4568f1b093d0e9cb2c4b157f7d263f1ef6`, changes only the three formatter hunks
and four evidence/status documents relative to `36904fd2`. Repository validation
(217 files) and whitespace passed. After confirming #86 terminal and no equivalent
active run, dispatched [#87, 35719829561](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561)
once, attempt 1, `upload_packages=true`. The run page confirms this exact SHA; Preflight passed and both target jobs were running.
Manual-resume handoff under AGENTS/WORKFLOW: inspect #87, including actual new Rust
regression results and installer uploads; do not redispatch. No corrected target pass
or replacement package availability is claimed at handoff. Keep PR #14 draft.

### 7.19 Build #87 replacement-package verification

User authorised inspection of #87 and replacement installers only, explicitly no
redispatch or merge. Remote entry head was `14f1b4cbdc67c371f58c3e1e55a2804e4f95ede0`;
PR #14 remained draft. Existing work preserved; only documentation changes here.

Run #87 (`35719829561`), attempt 1, passed on exact application candidate
`0b9ea0f0c23f843b3324cd63a524a642a2399f2e`. Preflight `106719866991`,
Windows x64 `106720077739` and macOS ARM64 `106720077724` all succeeded.
All three new Scene JSON regressions passed on both targets, including real IPC
starting-narration edit, Beat insert, refusal without writes, and fresh-service reopen.
Core totals: Windows 144 passed / 0 failed / 4 ignored; macOS 150 passed / 0 failed /
4 ignored. The four ignored cases are subprocess crash workers, not omitted acceptance
tests. Explicit SDK lifecycle/Scene/Source and network-handoff gates also passed;
the download-on-cache-miss step alone was skipped after SDK cache hits.

Desktop boundary tests, packaging, packaged smoke, secret scans, dependency inventories
and both package uploads passed. Downloaded evidence archives contain exactly one
accepted final report each, all reported boolean assertions true, complete command
traces, and all five checkpoints. Final-report-start: Windows 2,369 ms; macOS 3,011 ms.
Both inventories contain 85 npm / 519 Cargo entries. Evidence artifacts: Windows
`10691213999`, macOS `10691700431`.

Both package ZIPs and both evidence ZIPs were downloaded; their byte lengths and
SHA-256 matched GitHub artifact metadata, and all ZIP CRC checks passed. This verifies
archive integrity and CI provenance, not native installation or manual P3 acceptance.

| Target | Package artifact | ZIP bytes | Expiry (UTC) |
| --- | --- | --- | --- |
| Windows x64 | [10690749279](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561/artifacts/10690749279) | 7,582,210 | 2026-09-29 11:22:07 |
| macOS ARM64 | [10691460673](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561/artifacts/10691460673) | 9,636,712 | 2026-09-29 11:15:34 |

ZIP SHA-256: Windows `95beb817a67b46183602ce7b5860711dc350d21f1ac79ffa81ddf86dd092ec7e`;
macOS `a10e48f88465106154bc5adc26ae3f825ecd5c26a1cf94e1779ede714b6c404a`.

| Installer | SHA-256 |
| --- | --- |
| `nsis/Loomlight_0.1.0_x64-setup.exe` | `024ead6ccd427a49919a828e973feee2d0ee89e20c6183f5197457816c9f9c39` |
| `msi/Loomlight_0.1.0_x64_en-US.msi` | `2bce8f04f71bfe5643a7badaeb05ce9007951639f05d119f4ed41d40d6fa68e7` |
| `dmg/Loomlight_0.1.0_aarch64.dmg` | `1445d18754f7742415acfc5d8c66e5eeea2bef934f747008cfc96c1ca0f87389` |

Replacement packages are ready for user testing. Native P3 remains untested on both
targets; repeat Scene setup with #87 first, then the three native Save contexts.
No new CI run, application edit, merge or Phase 1G. Documentation validation (217 files)
and whitespace passed. No extra application suites were needed for this evidence update.

### 7.20 User manual-test report and macOS launch blocker

The user reports that the Beat fix works and physical Save testing passes on Windows.
Record these as user-reported results; OS version, exact installed package identity and
separate P3-A/B/C outcomes were not supplied. Do not infer all three acceptance rows.
macOS launch is blocked by a reported app-is-damaged warning; native Mac P3 has not run.
The report follows delivery of #87, but its local package identity is not yet confirmed.

Current Tauri configuration and production workflow contain no Developer ID signing or
notarisation configuration. Gatekeeper/signature assessment is a plausible explanation,
not a verified diagnosis. Apple distinguishes an unverified-developer warning from a
modified/damaged-app warning: https://support.apple.com/en-us/102445 . The previously
verified archive hashes do not prove the user's local copy or its signature is valid.

Next: obtain the exact warning and macOS version, confirm installation from #87's DMG
into Applications, and check whether Privacy & Security offers Open Anyway for Loomlight.
For an unverified-developer/notarisation block on the intended trusted build, Apple's
per-app exception may permit testing. If the damaged warning persists or no exception
is offered, inspect the local signature and download hash before changing quarantine.
Do not disable Gatekeeper globally. No application change, redispatch or merge here.

### 7.21 macOS manual pass after local launch workaround

The user subsequently reports: `I used command xattr -cr /Applications/Loomlight.app`
and `Mac OS passed`. Record macOS manual testing as user-reported PASS after that local
workaround; the previous launch block no longer prevents this user's test. Windows
physical Save and the Beat fix were also reported passing. The command was run by the
user, not this agent. This is not evidence of a repaired signature, notarisation, or a
normal first launch of the downloaded app. Preserve the macOS distribution limitation.

These reports follow the #87 test handoff. Exact OS versions, installed artifact identity
and separate P3-A/B/C observations remain absent; do not fabricate detailed acceptance
records or silently mark the formal six-row checklist complete. Next action is to review
available manual evidence and the independent code review before Phase 1F closeout.
No application edits, rebuild, redispatch, merge or Phase 1G are authorised by this report.


### 7.22 Independent closeout review

**Selected authority (2026-09-22):** user requested independent 1F review, bounded
closeout corrections, conditional PR #14 merge/cleanup, and 1G preparation only.
The same instruction requires a diagnosis/handover and stop before merge when a
substantive defect needs a new implementation checkpoint. This review takes that
stop path: **not accepted; no merge or Phase 1G implementation**. Earlier no-merge
instructions in historical entries are superseded by the user's conditional authority,
not by an assertion that acceptance passed.

#### Entry, ownership and evidence lineage

Fresh remote 1F head was `22479027008342bda0d4601f195a006116373a4e`, newer than the
prompt's historical `48eb0b0`. Its only change was HANDOVER's six-row user-pass record.
Current main is `75a91c5f72cd0eac8586faf2be036ec5021a939d` (merged planning PR #15);
it contains existing 1G/1H and Phase 2 plans. The local checkout was clean on an old
main with one worktree; it now tracks the existing 1F branch. The visible prior Windows
1F executor was idle; no active matching local executor or second writer was found.
Its remote worktree state was not independently inspected, so no remote/local
worktree removal or historical branch retirement is claimed.

PR #14 was open/draft with no submitted GitHub reviews. GitHub reported a merge
conflict; local merge analysis located it in docs/INDEX.md. Main was merged into the
1F review branch preserving both sets of links and all unique planning documents.
No reset, rebase, force push, duplicate planning PR or application change was used.

The completed independent task “Review Loomlight Defects” reported the two Scene
findings below; both were independently reproduced here. “Independent P3 Review”
contained a request/dispatch acknowledgment, not accessible completed findings. It
was not treated as a completed review.

The application, dependency locks, workflow and script inputs at entry are byte-identical
to `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`; intervening commits and new main are
documentation only. Run #87 (`35719829561`), attempt 1, was independently re-read:
terminal success on that exact SHA, Preflight `106719866991`, Windows `106720077739`,
macOS `106720077724`, including core, explicit SDK gates, desktop, package/smoke,
scans/inventories and uploads. Only cache-miss SDK downloads were skipped. Section
7.19's archive/hash/log inspection is retained as prior evidence, not a new download
or new native test. These passes describe that application; they do not erase newly
found defects or transfer acceptance to future fixes. No production matrix dispatched.

#### Findings, ordered by persistence impact

**F1 — Apply Both can accept a combination other than the displayed review (P1).**
In `app/src/source-ui.ts`, draft retention calls `updateStateOnly`, which does not
refresh the combined preview. `runApplyBoth` settles current input and submits its
latest draft version instead of binding the click to the displayed combination.
A DOM probe with the actual controller displays “reviewed combined”, edits the draft,
receives a different combined result from the service double, then clicks Apply Both.
The old preview is still displayed, but an acceptance call starts (1; expected 0
until renewed review). This is an executed renderer defect, not native disk evidence.

The external-file variant is established by code inspection: `SourceSaveRequest`
contains only path/base revision/draft version; `source_apply_both` refreshes disk,
checks only those fields, recomputes from the latest external revision, and commits.
An external editor can change `alpha BETA GAMMA` to `alpha BETA DELTA` after the user
reviews a combination with local `ALPHA`; the same request can write `ALPHA BETA DELTA`
although the preview showed `ALPHA BETA GAMMA`. The transaction's revision check
protects the newly read external bytes, not the bytes the user reviewed. The desktop
lifecycle mutex serializes app commands but cannot serialize external editors.
No end-to-end Rust/native execution of this race is claimed on this host.

Smallest correction checkpoint: bind Apply Both to the exact reviewed base, draft,
external revision and combined result (a dedicated typed request or bounded review
identity), validate that binding in core before proposing writes, and invalidate stale
renderer previews before confirmation. Preserve drafts and external bytes on refusal.
Test changed draft, delayed retention, external change before click and during commit,
unchanged successful combination, overlapping/same-position insertions, opaque-boundary
uncertainty and session replacement through the real JSON/service boundary. Existing
DOM tests cover delayed completion/disposal, while the core Apply Both test changes
external bytes before preview only; neither exercises preview-to-commit freshness.
This changes the acceptance/IPC contract and requires a new implementation checkpoint,
so it is not implemented as an incidental closeout edit.

**F2 — Preview “Add change here” loses the selected Beat anchor (P2).**
`scene-ui.ts::openNewBeat` clears `selectedBeatId`; `renderNewBeat` sends
`beforeBeatId: null`. Actual DOM interaction selecting an early dialogue then Add
change here and Add Beat reproduced null instead of `dialogue`. Core insertion places
it before the terminal Beat/end, not before the requested playhead. Preserve the
captured insertion anchor; test the actual control and persisted ordering via JSON.
Existing tests check control presence; the Scene JSON test supplies a valid anchor
itself. This also confirms the earlier independent finding remains unfixed.

**F3 — Background does not clear Preview Characters (P2).**
`scene-ui.ts::deriveScenePreview` changes only the background, while core Background
serialization emits `scene` on the same default layer as Character `show`.
Show Character → Background leaves one visible Character with `partial=false` in the
actual preview function (expected zero). Clear Characters and their layer uncertainty
when processing Background; retain unrelated variable/music uncertainty. Test both
ordinary and post-Custom-Code sequences. Existing fixtures put Background first.
Native game rendering was not executed in this review.

The recent Scene JSON correction itself matches the renderer: both enums use
`rename_all_fields = "camelCase"`; command/Beat tests cross JSON, and the real handler
edit/insert/reopen regression addresses the reported defect. Those payloads are
transient; persisted source maps store mapping identity/ranges rather than these enums.
No additional casing failure was demonstrated. Review also traced Source Save/Save All
through preflight, transaction/history and returned revisions, shell exclusion/token
release, draft settlement and stale completion checks, session validation and desktop
serialization. No separate demonstrated defect was found in those inspected paths.
This is targeted review, not proof that every parser/recovery/concurrency path is correct.
Remaining coverage gaps include cast response payloads, mocked UI-to-core paths and
unknown optional nested fields; these are not additional reproduced defects.

#### Retained executable diagnosis and checks

From `app/`, run `node --test tests/review/*.repro.mts` after locked dependency install.
The three probes deliberately assert required behaviour and currently fail: stale
Apply Both review (1 call versus 0), lost insertion anchor (null versus dialogue),
Background clearing (1 Character versus 0). They are retained outside the ordinary
`*.test.js` glob as review evidence, not skipped acceptance or passing regressions.
The correction checkpoint must promote these scenarios into the normal suite with
green outcomes plus real-core coverage; do not leave the default suite green as a
substitute for resolving these red probes.

Local environment: macOS 26.6.2 ARM64, Node 26.8.1/npm 11.19.0; this is the review
host, **not** the user's native P3 environment. Locked dependencies installed with
scripts disabled. Node/npm differ from the pinned 24.19.0/11.9.0 CI toolchain, so local
results supplement exact pinned #87 evidence. `npm run check`: typecheck and 32 tests
passed, 0 failed/skipped. `npm run build`: passed. Rust/core/desktop and native key
checks were not rerun; Rust is unavailable locally. Repository/link/privacy validation passed (222 files), as did whitespace checks. No acceptance assertions weakened.

#### Native P3 reconciliation and macOS distribution

The entry HANDOVER at `2247902` explicitly records the user's confirmation of P3-A,
P3-B and P3-C on Windows x64 and macOS ARM64. Preserve all six as **user-reported PASS**;
do not regress them to untested or ask to repeat unchanged tests. The checklist now
records those outcomes with that provenance. Earlier generic reports alone were not
enough; the later explicit record supplies context-specific results. Raw observations,
OS versions, exact locally installed package identity and screenshots were not supplied.
The #87 handoff is contextual lineage, not proof of the installed binaries. Formal
exact-candidate metadata remains to confirm; request only Windows/macOS versions and
whether both used the #87 replacement installers (identify another build if not).
No individual observations or package identities are invented.

The user ran `xattr -cr /Applications/Loomlight.app` before reporting the Mac pass.
This enabled their test; it does not prove normal quarantined download launch, valid
Developer ID signing or notarisation. Phase 1 parent scope explicitly excludes signing/
notarisation; ROADMAP's release policy allows disclosed private unsigned builds and
requires signing/notarisation before wider distribution. Track this as **DIST-MAC-01**:
normal downloaded-app installation/launch and signing/notarisation evidence before
wider distribution. It is not an extra 1F gate and is not fixed here. No signing
infrastructure or security-setting change was made by this review.

#### Integration, branches and next checkpoint

Main remains `75a91c5f72cd0eac8586faf2be036ec5021a939d`, with planning PR #15 integrated
but 1F unmerged. No merge SHA for PR #14 exists. Do not archive the 1F brief/correction
ledger/checklist while F1-F3 and candidate provenance remain unresolved. All unique
failed-run evidence remains intact; CURRENT/HANDOVER and plan headers are reconciled.

No branches were deleted. Retain 1F (draft PR #14, unaccepted implementation),
`maintenance/ci-optimisation` (unique abandoned history, still-open PR #12), Dependabot
branches (open PRs #10/#11), main and the archive tag. Ancestry proves current remote
`corrective/phase-1a-1d-integrated`, `corrective/phase-1d-ui-operation-race`,
`feature/phase-1e-scene-authoring` and `docs/phase-1g-1h-planning` are integrated into
main (PRs #7/#8/#9/#15). They are cleanup candidates, retained pending cross-host
worktree/dependency confirmation at the resumed integration checkpoint; their names
alone are not proof of safe retirement. No local worktree was removed.

Next bounded task: **1F-CLOSEOUT-CORRECTION**, specifically F1-F3 and their regression/
exact-candidate validation, on the same branch/PR, selected explicitly by the user.
Do not implement 1G to bypass the blocker. Existing 1G planning is already integrated;
1G.1 (shared flow projection and Branches, G1 gate) is the next application checkpoint
only after 1F acceptance/integration and explicit selection. Later R1/R2/V1/V2 remain
separate checkpoints. Preserve Source draft/session/recovery authority and treat these
newly documented review-binding limitations as unresolved prerequisites, not accepted
foundations. No duplicate plan or implementation branch was created.

### 7.23 1F-CLOSEOUT-CORRECTION

**Authority (2026-09-22):** user explicitly selected F1–F3 correction, real JSON/core
and race regressions, corrected-candidate supported-target validation, and a stop for
independent review. No merge, branch deletion, Phase 1G or signing work is authorised.
**Entry state:** in_progress. This local task owns execution; visible preceding tasks are
idle. Fresh fetched branch/PR head is `baf7a00bab8a7e7af84c19a690bad2bf2e1c628c`,
clean with no divergence; main remains `75a91c5f72cd0eac8586faf2be036ec5021a939d`.
PR #14 is open/draft with no submitted reviews. Remote worktree state was not inspected.
All three retained probes reproduced their recorded failures before implementation.
No pending production run or equivalent corrected candidate exists; #87 is historical.
Preserve the six user-reported native Save passes and existing provenance limitations.


#### Corrections and regression coverage

- F1: dedicated strict camelCase `SourceApplyBothRequest` binds path/base, draft version,
  external SHA-256 and exact combined preview text. Core validates these before proposing
  writes. Renderer captures the displayed review and document generation, disables stale
  confirmation immediately, and rechecks after retention; Refresh exposes the new review.
  Same-position insertions now refuse as ambiguous. Transaction/history/recovery and
  lifecycle session serialization are unchanged.
- F2: Preview captures the selected Beat ID in the insertion form and submits it as
  `beforeBeatId`; the general Add Beat action retains its prior end insertion behavior.
  Real Scene JSON coverage verifies exact adjacency, refusal of a missing anchor without
  source/map writes, and stable ordering/Beat identity after a fresh-service reopen.
- F3: Background clears Characters and their default-layer uncertainty. Regression
  coverage includes Show → Background and Custom Code → Show → Background, retaining
  unrelated music/variable uncertainty and the partial-preview marker.
- All three retained probes were red at entry and green after correction; their cases
  now run in the ordinary frontend suite. Additional DOM cases cover delayed retention,
  detached stale controls, refreshed exact requests and external changes during settlement.
- Real application JSON tests exercise changed drafts, external writes after review,
  altered base/combined identities, missing required review fields, replacement sessions,
  successful disk persistence/fresh reopen, overlap, same-position insertion and an
  overlapping patch across a Custom Code boundary. Refusals retain draft and disk bytes.
- Deterministic race tests pass the production Apply Both proposal (decoded from JSON)
  to the real transaction engine, injecting external writes after staging and immediately
  before exchange. They verify no accepted outcome, retained drafts, unchanged
  live external bytes for the staging race, and both versions plus the project recovery
  block for the final exchange window. This is real filesystem/core coverage; it does
  not claim a native webview race or alter the established recovery semantics.

#### Local validation and limitations

Host: macOS ARM64; Node 26.8.1/npm 11.19.0 (different from pinned CI). Installed Rust
1.90.0/rustfmt in temporary storage without changing user toolchain configuration.

- `npm run check`: 38 passed, 0 failed/skipped; TypeScript passed.
- `npm run build`: passed. `node --test tests/review/*.repro.mts`: 3 passed.
- `npm run test:source-browser`: passed in headless Chrome, expected legacy red and
  faithful green assertions. This is browser routing evidence, not native Save evidence.
- `cargo fmt --check --all`: passed with pinned Rust 1.90.0.
- `cargo test -p loomlight-core --locked`: 153 passed, 0 failed, 4 ignored subprocess
  workers; real crash/recovery parents ran. SDK wrapper tests without an official local
  archive return skip markers and are **not** local SDK target evidence. Explicit SDK,
  desktop, packaging/smoke and both supported-target gates remain required in CI.
- Python 3.12.14 lossless-source suite: 26 passed. Benchmark: 620,000 bytes / 40,000
  nodes, median 113.39 ms over seven samples. System Python 3.9 initially could not
  load dataclass `slots`; switched interpreter without repository changes.
- Legacy Python SDK suite: initial four path spelling failures and one process-group
  permission error. Canonical temporary paths resolved all four path failures. Retest
  remains 23 pass / 1 error: `test_process_output_is_bounded` raises `PermissionError`
  at `os.killpg`, even with escalated execution. This local host limitation is retained,
  not waived/passed or fixed through unrelated scope. No SDK spike code changed.

#### Native provenance and review boundary

The user confirmed both installations were build #87 replacement installers, macOS
26.6.2, and Windows “the latest windows version” (numeric build not supplied). Preserve
all six native Save passes; no repeated unchanged Save checklist is requested. Exact
Windows build remains a provenance limitation rather than an invented value.
No native observation of the new F1–F3 behavior is claimed. After corrected packages
are verified, focus any native follow-up on stale Apply Both review/refusal, selected
Beat insertion ordering, and Background Character clearing. Independent review decides
whether additional evidence is needed; signing/notarisation stays DIST-MAC-01 and out
of scope. Stop before merge, branch deletion or Phase 1G.

Repository/link/privacy validation passed for 222 files; `git diff --check` passed.
Self-review confirmed the correction is limited to Source review binding, Preview
insertion/layer state, their regressions and canonical evidence. No dependency lock,
workflow, shell Save route, transaction engine or security configuration changed.


#### Published candidate and supported-target dispatch

Candidate `f452d0a8c1599b05650ae2e835d14d9f86f14653` was committed/pushed and remote
head verified. Fresh pre-push refs still matched entry; PR #14 remained open/draft;
main unchanged. No equivalent active production run existed. Dispatched the existing
`production-scaffold.yml` once, with `upload_packages=true`.

[Production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675),
**attempt 1**, directly confirms candidate `f452d0a8c1599b05650ae2e835d14d9f86f14653`.
At the dispatch handoff: **in_progress**, Preflight `106762105167`; structure/toolchain/dependency
steps passed and frontend validation was running. Windows/macOS results and artifacts
were not yet observed. No supported-target acceptance or replacement-package claim.
The list endpoint initially lagged dispatch; the returned run URL was read directly,
not redispatched. #87 remains previous-application evidence only.

Dispatch handoff state was **awaiting_ci; blocked on external validation / manual resume**.
AGENTS/WORKFLOW has no qualified automatic continuation mechanism on this host, so
stop active polling and resume only by explicit continuation. The docs-only follow-up
updates CURRENT, HANDOVER, this ledger and PR description with exact identity and
limitations; no additional package matrix is warranted. On resume inspect terminal
#88 jobs/logs and actual artifacts without redispatch, preserve failures/skips, reconcile
any affected native follow-up, and stop for independent review. No merge/deletion/1G.


### 7.24 Build #88 corrected-candidate verification

**Authority (2026-09-22):** user explicitly resumed from HANDOVER to verify build #88
without redispatch, publish results, and stop for independent review. No merge or
Phase 1G. **State:** `review_ready`; correction implementation and automated gates
are verified, independent acceptance remains outstanding.

Fresh fetched branch/PR head is `caad2ad0fcedf5af3251568d493d1cdf8e4d7510`, clean with
zero divergence. Main remains `75a91c5f72cd0eac8586faf2be036ec5021a939d`. PR #14 is
open/draft with no submitted reviews. The visible prior local task is idle; this task
owns the verification update. No remote worktree inspection/removal is claimed.
Only four documentation files changed after the tested application candidate. This
verification changes documentation only; no application edits or dispatch occurred.

#### Exact run and results

[Production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675),
**attempt 1**, is terminal **success** on exact corrected application
`f452d0a8c1599b05650ae2e835d14d9f86f14653`. The run, job logs and downloaded evidence
were inspected; these are #88 results, not reused #87 acceptance.

| Job | Job ID | Result |
| --- | --- | --- |
| Preflight | `106762105167` | Passed; typecheck, 38 frontend tests, browser regression, pinned Rust formatting, repository validation. |
| Windows x64 | `106762349561` | Passed; core 147 passed / 0 failed / 4 ignored workers; desktop 1 passed. |
| macOS ARM64 | `106762349306` | Passed; core 153 passed / 0 failed / 4 ignored workers; desktop 1 passed. |

Both target logs explicitly show passing new real-JSON review-binding and ambiguity
regressions, the production-proposal commit-race regression, and the extended Scene
JSON insertion/ordering/reopen regression. Preflight ran all promoted DOM probes and
new delayed-retention/external-revision/Background-uncertainty cases. No failing,
skipped or ignored correction test was treated as a pass.

The four ignored core entries are subprocess crash workers invoked by their parent
tests. The initial general core sweep prints two no-archive SDK skip markers; the
subsequent **explicit** official-SDK lifecycle/Scene/Source and network-handoff gates
actually ran and passed on both targets. All required lifecycle/recovery/trust/stage,
authoring/import/IPC, Scene/media, Source-save and handoff markers were verified in
the evidence logs. The only skipped workflow step was download-on-cache-miss after a
pinned SDK cache hit; it is not missing target evidence.

Both targets passed frontend builds, real-browser Save regressions, desktop boundary,
packaging, packaged WebView smoke, secret scan, dependency inventory and both uploads.
Each downloaded smoke log has exactly one final report, all reported boolean assertions
true, complete Source command traces and all five checkpoints. Final-report-start:
Windows 821 ms; macOS 6,202 ms. Both inventories contain 85 npm / 519 Cargo entries.
This automated smoke uses synthetic keyboard delivery; it is not a new physical-key
native Save pass or independent native observation of F1–F3.

#### Artifacts and integrity

All four artifacts exist, are unexpired, and identify the exact #88 SHA. Downloaded
ZIP lengths and SHA-256 values matched GitHub metadata; every ZIP CRC check passed.
The package archives contain the expected platform installers. No installer was run.

| Artifact | ID / link | ZIP bytes | Expiry (UTC) |
| --- | --- | --- | --- |
| Windows package | [10696178711](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675/artifacts/10696178711) | 7,588,973 | 2026-09-29 13:30:39 |
| macOS package | [10695933986](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675/artifacts/10695933986) | 9,644,762 | 2026-09-29 13:30:55 |
| Windows evidence | [10696218574](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675/artifacts/10696218574) | 12,575 | 2026-09-29 13:30:38 |
| macOS evidence | [10695779076](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675/artifacts/10695779076) | 12,568 | 2026-09-29 13:30:53 |

| Verified file | SHA-256 |
| --- | --- |
| Windows package ZIP | `013cbf4901e6671c1020eabee067ac6adf7a317381da56109eaa9a877a3241b4` |
| macOS package ZIP | `ed015541bafb80936072e2ac50eb53ca7e0fcecf7f42d2dc814a9e61c42c739c` |
| Windows evidence ZIP | `b19540c1cd6b3dc4265c01858839d16fa2554bcaee30ba1841244fa627464a13` |
| macOS evidence ZIP | `f6c26a6dbfbd4084eba2503349e657968ae17fb872e915edcda3c155d38ca225` |
| `nsis/Loomlight_0.1.0_x64-setup.exe` | `fe33d82ca34bec89bb421fe17254ffeed756041940394514d6ffce28f951e29c` |
| `msi/Loomlight_0.1.0_x64_en-US.msi` | `340c30eee6126f40138204f594801d443ce1c306bd5f9289cfb8d48215250944` |
| `dmg/Loomlight_0.1.0_aarch64.dmg` | `eefd1cd49161d2722a9ac5f36ab926be64b792052b12d2476d50b7e0f7c6eb9f` |

#### Limits and next boundary

#88 closes the outstanding corrected-candidate automated validation gate. PR #14
remains draft and Phase 1F unaccepted/unmerged pending independent review. No pending
production run remains to poll or redispatch. Preserve the six user-reported native
Save passes from #87, confirmed #87 package lineage and macOS 26.6.2. Numeric Windows
version/build remains unspecified; no observation is invented. If independent review
requires new native evidence, limit it to changed F1–F3 behavior using these verified
#88 packages rather than repeating unchanged Save cases.

The local legacy Python SDK `os.killpg` permission error from section 7.23 remains
recorded; #88's real Rust/official-SDK gates passed but do not retrospectively turn that
local Python result into a pass. No signing/notarisation work occurred; DIST-MAC-01 is
still the later distribution limitation. No application code, dependency, workflow,
branch ownership or history was changed by this verification.

CURRENT, HANDOVER, active milestone/checklist status and PR description now select
independent review of candidate `f452d0a8c1599b05650ae2e835d14d9f86f14653` with #88
attempt 1 evidence. Stop here. No merge, branch deletion, duplicate plan or Phase 1G.

Documentation-only verification checks: repository/link/privacy validation passed for
222 files; whitespace passed. No application suite or package matrix was rerun.


### 7.25 Independent correction review — F4 blocks closeout

**Date:** 2026-09-23 (Australia/Brisbane).
**Authority:** independent review of F1–F3 against #88, preserve native Save passes,
publish findings and stop. No implementation correction, redispatch, merge, branch
deletion or Phase 1G is authorised in this task.
**Reviewed application:** `f452d0a8c1599b05650ae2e835d14d9f86f14653`.
**Entry/published evidence head:** `01e9a857f447f3ffa1d6fe0c1f15ee5b2dd3eca7` on
`feature/phase-1f-source-synchronisation`, open/draft PR #14. Fresh fetched refs matched
that clean local head and main `75a91c5f72cd0eac8586faf2be036ec5021a939d`. The visible
prior local task was idle. No remote worktree ownership is inferred. All five files
changed between the application candidate and review entry are documentation only.

#### Finding F4 — re-enable Apply Both after unchanged retention (P2)

The new disable rule in `app/src/source-ui.ts:375–378` includes `hasLocalInput()`.
`queueRetention` calls `updateStateOnly` at line 329 while the completed snapshot is
still in `retentions`; `hasLocalInput()` therefore returns true and disables Apply Both.
Its `finally` at line 348 removes that snapshot without updating controls again.

Reproduction: open a conflict with a valid reviewed non-overlapping combination,
click/select in the Source textarea without changing its text, then let retention
finish. `hasUnretainedInput()` is false and the review identity is unchanged, but
Apply Both remains disabled, no stale-review notice appears, and clicking it sends
zero acceptance requests. An unchanged scheduled observation does not redraw the
controls, so waiting for the normal observation cycle does not recover availability.
This is a UI availability regression, not a demonstrated stale write or loss of bytes.

Executed against the actual Source controller with a faithful selection-only service
double in both Happy DOM and headless Chrome. Browser input used a real automation
mouse click; the production observation timer was enabled. Browser result after two
open/observation calls: `pending=false`, `disabled=true`, `applies=0`,
`staleNoticeHidden=true`. It is browser evidence, not WKWebView/WebView2 or real disk I/O.

Retained required-behavior probes, deliberately outside the normal test glob:

- DOM selection probe (historical review path `app/tests/review/phase-1f-selection.repro.mts`,
  now incorporated in the ordinary [Source DOM suite](../../../app/tests/source-authoring.dom.test.ts)):
  `node --test tests/review/phase-1f-selection.repro.mts` from `app/`; 1 failed as expected at review time.
- [Browser selection probe](../../../app/tests/phase-1f-selection.browser.mjs)
  (formerly `app/tests/review/phase-1f-selection.browser.mjs`): at review time it failed the assertion
  that the current review becomes enabled after settled unchanged selection.

Smallest follow-up: refresh relevant controls after removing the finished retention,
with existing document-generation/disposal and newer-pending-input guards preserved.
Promote the probe to a normal regression, including unchanged selection completion,
a newer pending edit, failed retention and stale-review refusal. Do not bypass the
review-binding check or the retention barrier to restore availability. This review
publishes diagnosis only; the application has not been changed.

#### F1–F3 disposition and evidence assessment

- **F1 core stale-review write defect addressed.** The strict JSON request binds base,
  draft version, external hash and exact combined text. Renderer checks the displayed
  identity before/after settlement; core checks it before producing the transaction.
  The proposal uses the reviewed external bytes/revision as its write precondition.
  Real JSON tests cover changed identities, replacement sessions, no-write/draft
  preservation and successful persistence/reopen. The production-proposal race test
  checks staging refusal and final-exchange recovery. No new bypass was found in these
  inspected paths. **F1 is not fully closed because F4 breaks confirmation availability.**
- **F2 addressed.** Preview captures the selected Beat before clearing selection and
  passes it into the insertion form. DOM coverage exercises the actual control; real
  JSON coverage checks exact adjacency, stale-anchor refusal without source/map writes,
  and stable ordering/identity after reopening. General Add Beat still defaults to end
  insertion. No additional finding.
- **F3 addressed.** Background clears visible Characters and default-layer uncertainty,
  consistent with core serialization to `scene`. Music/variable uncertainty and the
  Custom Code partial marker survive. Ordinary and post-Custom-Code tests cover this.
  No additional finding.

This is a targeted correction review, not a complete new audit of Phase 1F or every
transaction/parser path. Existing shell Save ownership, transaction engine, dependency
locks, desktop permissions and workflow inputs were unchanged by the correction.

#### Build #88 independently rechecked

Fresh GitHub run metadata/logs confirm [#88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675),
attempt 1, terminal success on the exact application SHA above. Preflight
`106762105167` ran 38 passing frontend tests; both platform logs explicitly show the
new JSON binding/ambiguity, Scene insertion/reopen and production-proposal race tests.
Windows `106762349561`: 147 passed, 0 failed, 4 ignored subprocess workers. macOS
`106762349306`: 153 passed, 0 failed, 4 ignored workers. Explicit official-SDK lifecycle
and download-handoff gates and desktop tests (1 each) passed. Cache-hit download skips
and the earlier no-archive sweep markers are not substituted for these explicit runs.

All four previously downloaded ZIPs were independently hashed and CRC-tested again
against fresh GitHub artifact metadata: sizes/hashes matched, none expired, exact
candidate lineage matched, installers present. This was verification of retained
archives, not a second download or native install. Both evidence archives contain one
final report with all boolean assertions true, complete Source traces and five
checkpoints. Section 7.24 owns links and exact hashes. These genuine passes do not
cover F4's settled-selection button state and do not turn the new red probe green.

Local review checks: Node 26.8.1/npm 11.19.0, different from pinned CI. `npm run check`
passed typecheck and 38 tests, 0 failed/skipped. The three original retained F1–F3
probes passed. The two new F4 probes fail as described. Browser execution needed local
loopback permission; after fixing the diagnostic page setup, the application failure
was reproduced. No Rust/SDK suite or package matrix was rerun; exact #88 evidence was
inspected. Repository/link/privacy and whitespace checks passed before publication.

#### Native evidence and stop boundary

Preserve all six user-reported native Save passes from #87, confirmed #87 lineage,
macOS 26.6.2 and unspecified numeric Windows build. Do not repeat unchanged Save cases.
No native #88 or F1–F3 pass is claimed. F2/F3's DOM/pure-state plus core persistence
coverage is sufficient for this targeted review; lack of a new native F2/F3 observation
is not an additional blocker. F4 is already reproducible without another package run.
After a separately authorised correction, focused native Apply Both testing should
cover selection-only re-enabling and stale draft/external refusal on both targets;
it must use a verified corrected package, not claim #88 contains the future fix.

The legacy local Python SDK result remains 23 pass / 1 `os.killpg` permission error;
DIST-MAC-01 remains outside scope. PR #14 stays draft, Phase 1F unaccepted/unmerged.
Review is complete with one blocking P2 finding; no operation is pending. The next
bounded action requires user selection of an F4 correction checkpoint. Stop here.

### 7.26 F4 settled-selection correction — review ready

**Authority:** user's bounded F4 checkpoint request. **Branch/PR:**
`feature/phase-1f-source-synchronisation`, draft #14. Entry head was clean
`6463155e3d0abb252b5013d7a49df2c45aa8d45d`; fetched branch and PR matched it,
main was `75a91c5f72cd0eac8586faf2be036ec5021a939d`, and no other local
worktree or pending execution owner was present. No newer F4 implementation existed.
**Application candidate:** `845c60cde837862cf1f9f4302e959da129ed1d4a`.

The original DOM diagnostic failed on entry with `pending=false`, `disabled=true`,
`applies=0`; the prior independent review retained the equivalent real Chrome red
result (`observations=2`). Local browser launch before and after correction failed
because no Chrome/Playwright Chromium binary is installed. Attempted Playwright
installation fetched a zero-byte/truncated ZIP from the blocked download endpoint;
it was stopped. This host cannot supply new green browser evidence. The test is now
in `npm run test:source-browser` alongside the existing Source Save browser test,
so supported CI will enforce it; no production workflow was dispatched here.

The application change redraws the Source controls only after a finished retention
entry is removed and only for the still-current generation/path/latest snapshot.
`updateStateOnly` continues to check `hasLocalInput`, `reviewMatches` and the
barrier. The success path still stores its versioned result; failures retain their
blocker. There is no change to core stale-write checks, Source Save, Scene, Preview,
transaction/recovery, observation policy or renderer privileges. The original DOM
diagnostic's after-click disabled assertion conflated the Apply Both busy barrier
with settled availability; the promoted test checks availability before clicking.

Four promoted DOM cases pass: unchanged selection re-enables and accepts a reviewed
combination; an older completion cannot override newer pending input or a changed
draft; failed retention stays blocked; a disposed controller's completion cannot
touch a replacement document with its own pending retention. Existing changed-draft,
changed-external-revision and delayed Apply Both tests remain green. Real browser
regression uses a real click and unchanged scheduled observation, asserting enabled
state before acceptance; it has not run green on this host.

Local Node 24.19.0/npm 11.9.0 matches pinned versions. `npm ci --ignore-scripts
--offline` passed; `npm run check` passed typecheck and **42/42** ordinary frontend
tests, 0 failed/skipped; `npm run build` passed; repository validation and whitespace
passed after path updates. Rust/Cargo and official SDK/native desktop checks are
unavailable locally and were not substituted with browser/DOM tests. No new native
package was built or tested. Build #88 predates this fix and is not evidence for it.

All six user-reported native Save passes from #87 remain PASS, with no repeated Save
case. DIST-MAC-01 stays outside scope. Phase 1F is not accepted and PR #14 remains
draft. Next bounded action: independent F4 diff/evidence review, run the actual
browser regression on a browser-equipped host, then obtain verified corrected
Windows/macOS packages and perform focused native Apply Both selection re-enabling
and stale draft/external refusal checks. This checkpoint neither dispatches a
production build nor authorises merge, branch deletion or Phase 1G.
### 7.27 Independent F4 evidence review — browser passed, native pending

**Authority:** user's F4 evidence-only review and package/native test planning.
**Reviewed application:** `845c60cde837862cf1f9f4302e959da129ed1d4a`.
**Browser CI probe commit:** `74ce3487bcd7834c21d519f795e30017977d7c2c` on draft PR #14;
it temporarily added a focused Chrome selection job to PR quality checks without
repeating manual native Save tests. After its pass, `aa39e2fa81b03a0940adc1f9213b19f1b27134f1`
removed that temporary job to avoid repetition on later PR updates. The F4 script
remains in the normal production browser suite. At review entry, PR/head and fetched refs matched the
published handover; the scratch checkout had no unrelated changes or execution owner.

The F4 application diff changes only the post-retention control refresh, after
removing the settled sequence. `identityMatches` guards disposal, generation and path;
the latest-sequence check excludes older completion. `updateStateOnly` continues to
enforce pending input, failed retention, barriers and the displayed review identity.
The Apply Both handler still settles its captured snapshot and checks the review
against the returned document before sending the exact versioned request. Four
promoted DOM cases cover availability, newer input, failure and replacement
controller; existing tests cover changed draft/external identity. No new bounded
code finding was identified. This is a targeted review, not a new core audit.

Local Node 24.19.0/npm 11.9.0: `npm ci --ignore-scripts --offline` passed and
`npm run check` passed typecheck and **42/42** frontend tests, zero failed/skipped.
Repository validation passed for 223 files and `git diff --check` passed. The
scratch host has no Chrome or Playwright Chromium; a direct F4 browser invocation
failed at browser launch. Playwright download yielded a truncated zero-byte ZIP on
repeated attempts, so it supplied no browser result.

On GitHub's equipped Ubuntu Chrome runner, [Repository quality #378 / 35782023645](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35782023645),
attempt 1, completed successfully for CI commit `74ce3487…` with both Validate
repository job `106929608224` and Source selection browser regression job
`106929608406` green. The latter directly ran
`node tests/phase-1f-selection.browser.mjs` and logged
`{"beforeApply":{"pending":false,"disabled":false,"staleNoticeHidden":true,"observations":2},"applies":1}`.
This is a real Chrome controller regression using a selection-only service double;
it is not a native WebView, real disk-I/O, or package acceptance result.

**Next package and native evidence checkpoint (planned, not dispatched):**

1. Recheck actual PR/head, main and execution ownership. Dispatch the existing
   `Phase 1 production gates` workflow once from the corrected PR branch with
   `upload_packages=true`, recording run ID, attempt, exact head SHA and input.
   Its existing preflight and Windows/macOS matrix remain mandatory production gates;
   no separate manual repetition of the six unchanged Save cases is requested.
2. Confirm preflight, Windows x64 and macOS ARM64 jobs all succeed on the same SHA;
   inspect explicit SDK/desktop/packaged-smoke evidence. Download both package ZIPs,
   verify GitHub artifact metadata size and SHA-256, archive integrity and installer
   contents, and record artifact IDs/hashes. Build #88 predates F4 and is ineligible.
3. Install only the verified corrected package on each target. In a disposable
   project, create a non-overlapping Source draft/external conflict and display its
   combined preview. Click within the editor without changing text; after retention
   settles, confirm Apply Both re-enables, the stale notice stays hidden, and applying
   yields the reviewed combination after reopening.
4. On both targets, independently make the reviewed draft stale, then the external
   revision stale. In each case confirm the old combination cannot be accepted and
   neither the draft nor external bytes are overwritten. Record OS/build, package
   hash, steps, observations and any error text or screenshots. Do not infer a native
   pass from the Chrome service-double result.

PR #14 remains draft; Phase 1F remains unaccepted/unmerged. Corrected packages and
native F4 observations are outstanding. DIST-MAC-01 remains outside this checkpoint.

### 7.28 Corrected packages and native F4 evidence

**Authority:** user-submitted Windows A/B/C outcomes and request for focused F4
verification. [Production #90 / 35787284261](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35787284261),
attempt 1, workflow_dispatch on PR #14 branch head
`88dc6286944d4b96cfb96968f88aa6e87dacc447`, completed successfully. Preflight
`106947052023`, Windows `106947331869` and macOS `106947331932` all passed. Preflight
ran 42/42 frontend tests and the F4 Chrome regression (`pending=false`,
`disabled=false`, hidden stale notice, two observations, one Apply Both). Both platform
jobs passed their browser check, core suite (Windows 147, macOS 153; zero failed,
four ignored each), official SDK/desktop gates, packaged WebView smoke and package
uploads. The cache-hit SDK download steps were skipped as intended.

Both package archives were downloaded independently; sizes and SHA-256 matched
GitHub metadata, and ZIP CRC checks found no errors:

| Target | Artifact ID and size | ZIP SHA-256 | Installer contents and SHA-256 |
| --- | --- | --- | --- |
| Windows x64 | `phase-1-production-package-windows-2025`, `10719979576`, 7,584,329 bytes | `8b0d96ec1ade653336b9ff8147a09a3c8013631412c281848c3e6438f27b0f8e` | `msi/Loomlight_0.1.0_x64_en-US.msi`: `28a4c46e340e7205dd8044dc95ecd44572dd61a5d448b88cebbb0dcb79b92fc1`; `nsis/Loomlight_0.1.0_x64-setup.exe`: `2124989edc5976367a4e1546f7e9238173a860971add0bcf9fd67384d39a57fd` |
| macOS ARM64 | `phase-1-production-package-macos-26`, `10720514421`, 9,644,954 bytes | `c5e47f261a2516924be9a45d5a58a4be383bccc32ac4b7512fff9bbf8d3a2914` | `dmg/Loomlight_0.1.0_aarch64.dmg`: `fb2afc5b8e5c3e8fb4a1d4c79e6bc64cd353dba442fc8af60216fba0318c67ed` |

The user reported **Windows 11 Pro** native F4 Test A (settled selection re-enables
and successfully applies the reviewed combination), Test B (changed draft refused),
and Test C (changed external revision refused): **PASS / PASS / PASS**, using the
Windows package artifact from this run. No unexpected behavior or error text was
reported. The numeric Windows build, choice of MSI versus NSIS, local installer
filename/hash and per-step screenshots were not supplied; do not invent them. This
is user-observed native evidence, distinct from our independent archive verification.

The user also reported **macOS 27** native F4 A/B/C **PASS / PASS / PASS** using
`phase-1-production-package-macos-26` from the same run, with no unexpected
behavior or error text. This is a user report; the actual DMG filename/local hash,
per-step screenshots and exact macOS build were not supplied. The independent archive
check above establishes artifact integrity, not which local file was installed.

Both target-native F4 result sets are now reported PASS. The six prior native Save
passes from build #87 remain intact without repetition. The next bounded step is
independent Phase 1F closeout review against current PR head and acceptance criteria.
PR #14 stays draft; Phase 1F remains unaccepted/unmerged until that decision. No
branch cleanup or Phase 1G in this evidence-recording checkpoint.
