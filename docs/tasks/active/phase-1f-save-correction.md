# Phase 1F — bounded Save correction (1F-SAVE)

**Prepared:** 2026-09-21 after the independent Source-save architecture review.
**State:** `not_started`; this is the implementation brief, not a claim of repaired code.
**Parent milestone:** [Phase 1F Source synchronisation](phase-1f-source-synchronisation.md).
**Decision:** [ADR 0007](../../adr/0007-shell-save-command-ownership.md).
**Branch / PR:** `feature/phase-1f-source-synchronisation`, existing draft PR #14.
**Reviewed application:** `4dfedd24b4831972376d69fde216ad2063d708d4`.
**Reviewed documentation head:** `3aebbcd9aff8a051e28f5b92dc6e50ee324dd3b5`.

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
