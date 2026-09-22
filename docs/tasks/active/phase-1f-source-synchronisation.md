# Phase 1F — Source synchronisation and partial-visual handling

**Prepared:** 2026-09-20, as the requested Phase 1 continuation after CI-SIMPLE integration.
**Behavioural decisions approved:** 2026-09-20; section 1 fixes the previously open product policies.
**State:** 1F-CLOSEOUT-CORRECTION is `review_ready`; production #88 attempt 1 passed on the corrected candidate and its artifacts were verified. Stop for independent review. See [ledger sections 7.23–7.24](phase-1f-save-correction.md#724-build-88-corrected-candidate-verification). #87 and six native Save passes remain historical evidence; the user confirmed build #87 on both targets and macOS 26.6.2 (numeric Windows build unspecified). No merge or 1G implementation.
**Current correction:** [1F-CLOSEOUT-CORRECTION](phase-1f-save-correction.md#723-1f-closeout-correction), with verified #88 evidence in section 7.24; preserve [ADR 0007](../../adr/0007-shell-save-command-ownership.md) and the earlier Save guarantees.
**Execution authority:** The user selected F1–F3 correction and then resumed to verify #88 without redispatch, publish results, and stop for independent review. No merge or Phase 1G is authorised.
**Baseline:** Integrated main with Phase 1A-1E and CI-SIMPLE at original entry; preserve the existing unmerged Phase 1F work.
**Working branch:** `feature/phase-1f-source-synchronisation`, existing draft PR #14; do not create another branch or PR.
**Parent requirements:** [Phase 1 plan](phase-1-vertical-slice.md), section 1F. Preserve the existing [source/data](../../DATA_MODEL.md), [transaction/recovery](../../TRANSACTIONS.md), [UI](../../UI.md), [architecture](../../ARCHITECTURE.md) and [security](../../SECURITY.md) contracts.

**2026-09-21 precedence note:** The [corrected diagnosis](phase-1f-save-correction.md#1-evidence-and-corrected-diagnosis) supersedes the historical inference that the smoke proved `source.save` never ran. Its composite predicate and missing operation trace do not establish that. The fake service can re-dirty unchanged text after successful Save. Historical ledger entries and failed runs below are preserved, but their old immediate-dispatch instructions are not current authority. Implement and self-check 1F-SAVE before validating a corrected application candidate; follow [HANDOVER](../../status/HANDOVER.md).

## Objective and exclusions

Deliver the Source centre workspace and safe bidirectional Source/Scene synchronisation, conservative partial source mapping, exact unsupported-code preservation and truthful invalid/stale/conflict states. Extend the production source/range foundation already used by Scene and supporting authoring; do not replace it with a second exporter or make a visual model authoritative.

No Branches workspace, SDK Run/Validate UI, Git checkpoint UI, UI Designer, Timeline, LLM integration, plugins, arbitrary-project import, advanced global analysis, project-wide technical renaming or Phase 2+ work. Those remain in their owning milestones. No W0/OPT-1A repair, custom CI controller, client bootstrap, automatic wait/wake or cross-commit acceptance framework.

## Entry and bounded delivery

Phase 1F entry and CI-SIMPLE merged-branch housekeeping are completed in the ledger. Do not replay them. Inspect fresh refs, the existing branch/PR, and worktree ownership before continuing. Preserve unrelated and newer work; quoted baseline SHAs are evidence, not reset instructions. The selected next work is 1F-SAVE, not the original implementation sequence again.

This is one approved milestone with an implementation order, not a new series of optimisation/review checkpoints. The behavioural choices below are fixed, not options for the implementing agent to reselect. Record only the bounded technical approach and state transitions needed to implement them before UI writes, then proceed through source services, UI wiring and validation. Do not pause between those steps solely to request an approval already supplied by the 1F goal. A material scope change or unsafe missing prerequisite remains a genuine stop condition.

## 1. Fixed source-editing behaviours

Keep three distinct states: the unsubmitted editor buffer, accepted on-disk source revision, and derived semantic/visual projection. Distinguish supported, opaque/unverified, detected-invalid, stale, ordinary external conflict and unresolved transaction recovery. A draft is not saved; a last-valid projection is not current for different bytes.

1. **Save and invalid input.** Source drafts enter the shared acceptance path only through explicit Save/Commit (including Ctrl/Cmd+S), never typing, blur or tab switching. Normal Save refuses detected incomplete/invalid input and unsafe reconciliation, retains the draft and shows the reason. No Save Anyway action in 1F. Successfully accepted edits persist through the existing transaction/Flush boundary; other surfaces retain their existing persistence behaviour.

2. **Navigation, leaving and restart.** Keep per-file drafts and selections in memory while navigating Scenes and workspaces within the same project. Project close/switch and a normal application exit with dirty drafts offer Save All / Discard / Cancel. Failed or refused saves cancel leaving and retain remaining drafts; Discard is explicit, and Cancel changes nothing. Warn that unaccepted drafts are not crash/restart-recoverable in 1F; no new draft journal or autosave store. Accepted source remains durable.

3. **Dirty Source versus other editing surfaces.** Until a draft is saved or explicitly discarded, block Scene mutations, file move/delete and project-history operations that write that same file or invalidate its draft mappings. Explain the block and offer navigation to the draft. Do not merge, overwrite or silently discard it. Unrelated files remain editable only where the existing transaction/conflict rules prove that safe.

4. **External edits.** For a clean buffer, safely reload/reparse a verified external revision and remap selection, or clear unprovable selection. For a dirty buffer, keep the draft and external disk bytes, mark conflict and block stale writes; never auto-merge or force-overwrite. Preserve the draft's accepted base revision. If the source service can prove that the base→draft and base→external changes are exact, non-overlapping byte patches, offer an explicit combined preview and user-confirmed **Apply Both**; apply it against the verified external revision through the normal transaction path. Overlap, ambiguity, opaque-boundary uncertainty, deletion/rename or failed proof remains a conflict with no write. Also provide Copy Draft, confirmed Reload External / Discard Draft, and Cancel. Missing, renamed or unsafe files retain any draft and a non-destructive diagnostic rather than automatic recreation or retargeting.

5. **Supported grammar.** Use the existing Phase 1E canonical Beat subset in DATA_MODEL as the semantic boundary: dialogue/narration, staging/appearance/placement, approved audio/transitions, typed simple assignments, unconditional Choice, Jump and Return/End. Preserve syntax outside that subset as exact opaque/Custom Code, not invented supported Beats. Unsupported is not synonymous with invalid: safe raw-source acceptance may retain opaque text with an explicit syntax-unverified/partial indication. Static recognition detects errors only within its proven lexical/grammar scope; it does not certify arbitrary Ren'Py or Python syntax. Do not expand into a general parser or invoke the SDK to decide whether Save is allowed.

6. **Selection.** Scene → Source selects the exact mapped range at the current revision. Source → Scene selects the containing supported Beat only when ownership is provable. A cursor in opaque, invalid or unmapped content clears the cross-view Beat selection and shows the appropriate partial/unmapped state; never guess the nearest Beat or reuse stale offsets. Preserve the user's Source caret, selection and draft during view changes.

7. **Undo.** Uncommitted text undo/redo stays in the Source buffer and groups natural typing bursts; it performs no disk writes. A successful source acceptance creates one committed project-history action for that edit. Reset buffer history to the accepted revision after successful Save or explicit Discard, not after a refused save. Committed undo/redo uses the existing project history and actual returned revisions, subject to rule 3 and external/recovery guards. When the Source editor has text focus, Ctrl/Cmd+Z and redo act only on the draft buffer; project-history controls remain distinct and refuse an operation that would touch a dirty/conflicted file. Do not promise history persistence across restart.

8. **Persistence status and Save shortcut.** Any dirty Source draft or newer unretained local input makes the project persistence indicator at least **Pending validation**, never Saved. An ordinary external draft conflict reports **Conflict**; unresolved transaction state reports **Recovery required** and keeps its existing wider precedence. While Source owns the editing context, Ctrl/Cmd+S settles current input and attempts acceptance of that captured draft through the shared durable transaction boundary. Successful `source.save` already establishes the required durability; it does not require a redundant renderer Flush afterward. With no current draft after successful settlement, retain existing global Flush behaviour. Refused or failed Source acceptance never falls through to Flush. Other dirty Source files remain Pending validation. [ADR 0007](../../adr/0007-shell-save-command-ownership.md) and [1F-SAVE](phase-1f-save-correction.md) specify shell ownership, the shared toolbar command, operation/lifecycle safeguards and authoritative project status.

9. **Save All.** Project close/switch/normal-exit Save All first preflights every dirty draft—encoding/size, recognized-invalid state, current base revision, mapping/reconciliation and transaction recovery—before any write. If any draft fails preflight, Save All writes none of them, retains every draft and cancels leaving. If all pass, commit the affected source and required metadata/source-map changes as one existing multi-mutation transaction. This is the recoverable sequential transaction guaranteed by TRANSACTIONS, not a claim of filesystem-wide atomicity. Conflict/recovery never clears drafts or reports success; retain draft snapshots until a terminal recovery result, then reconcile them against the actual accepted/current revisions before leaving.

10. **Source scope, encoding and bounds.** The Source navigator covers existing project-owned `.rpy` files under the approved `game/` root; it does not expose arbitrary host paths or generated `.rpyc` as editable source. Phase 1F edits existing files only—no general raw-source create/rename/move/delete surface. Scene-owned files receive the full Beat synchronisation in this milestone. Existing mapped Character/Variable definitions or other mapped files may be accepted only when their existing mapping/metadata can be revalidated and reconciled transactionally; otherwise retain the draft and refuse the unsafe acceptance rather than silently stale the supporting surface. Unmapped/custom `.rpy` files may be edited as source-only content with no invented visual model. Source editing supports UTF-8 with or without a UTF-8 BOM; invalid UTF-8 is preserved byte-for-byte but is read-only with a diagnostic, never lossily decoded. An editable source file is capped at the transaction layer's 16 MiB per-mutation limit. Keep at most 64 dirty Source buffers and 64 MiB aggregate draft bytes; reaching either bound refuses an additional dirty buffer without discarding existing drafts.

11. **Externally missing source.** If a clean source file is externally deleted, renamed or becomes unsafe/unreadable, mark that source unavailable/conflicted, retain any last accepted projection only as explicitly stale, clear unprovable cross-view selection and block affected Scene/history writes. Do not guess a rename, recreate a file, or retarget mappings automatically. Restoring the exact expected path/revision or completing an already-supported explicit Scene lifecycle operation is required before normal mapped editing resumes.

All deliberately accepted writes and inverses use the existing transaction/history layer and revisions returned by actual commits. Do not create a direct-write path, acknowledge recovery as resolution, or overwrite an external revision during undo/redo. Keeping a draft does not make the visual projection a preview of those unaccepted bytes; label it as the accepted revision while a draft exists.

## 2. Extend the lossless source foundation

Implement conservative partial CST/range mapping only to the extent needed for the supported subset and Source workspace. Preserve comments, whitespace, embedded Python, custom syntax, unsupported regions, BOM and newline convention exactly where unedited. A no-op must preserve bytes. Scene edits patch the smallest verified supported range; a deliberate Source edit changes only its accepted source scope with preconditions enforced.

Track UTF-8/source byte offsets separately from decoded editor positions, including supplementary Unicode characters and selection remapping after edits. Preserve stable IDs and unknown metadata where mappings remain provable; ambiguous edits invalidate affected mappings rather than guessing ownership, changing identities silently or overwriting opaque text. Keep source, metadata/reference reconciliation and history within the existing recoverable boundary.

Use current-session authority and narrow typed IPC. Renderer-provided arbitrary filesystem paths, stale project tokens and late completions must not retarget another file or project. Preserve resource bounds and do not evaluate project Python to parse or diagnose source.

## 3. Wire Source and Scene coherently

Provide usable Source editing and bidirectional navigation/selection under section 1. Make Scene's View in Source action functional for mapped content. Supported direct Source edits update the Scene projection after accepted reconciliation; accepted Scene edits update the corresponding clean Source view without losing valid selection. Mutations affecting a dirty Source draft remain blocked as specified above.

Unsupported/opaque ranges remain visible and exact. Invalid or ambiguous edits must produce clear partial/stale/conflict indicators and disable only operations whose safety/currentness cannot be proven. Do not show last-valid Scene state as a fresh interpretation of invalid source. Preserve source-authoritative edges for the later Branches workspace without implementing that workspace now.

The minimum Source surface includes an existing-project `.rpy` file navigator, current relative path, line numbers, reviewed monospace editing, dirty/conflict/partial state, static diagnostics, mapped-range/current-selection highlighting and visibly distinct opaque/Custom Code boundaries. Open the current Scene's file by default when entering from Scene. Syntax-aware here means bounded recognition/highlighting from the lossless source service; it does not require autocomplete, refactoring, minimap, extension hosting or a general Ren'Py language server.

Follow Quiet Studio Dark and existing semantic tokens. Test keyboard navigation, labels, focus restoration, selection visibility and responsive layout; do not add unrelated redesigns or privilege/CSP relaxations.

## 4. Reconcile external edits safely

Debounce source-change observations, compare actual hashes/revisions, distinguish own writes, invalidate stale mappings and avoid write/watch loops. Handle external replacement, deletion, rename and changes racing with local commit or undo. Apply section 1's clean-refresh and dirty-conflict rules. Do not execute SDK/project code automatically on open, file events, typing, reconciliation or preview.

Ordinary divergence can be isolated to an affected file/Scene where safe. Unresolved mixed-file transactions, uncertain project identity and ambiguous recovery retain the existing project-wide write block. Demonstrate both cases; do not loosen recovery to make unrelated files appear editable. Preserve competing content and provide non-destructive guidance when automatic reconciliation is not provable.

## Acceptance and evidence

The following is the minimum mandatory behavioural regression matrix. Test real service results and UI/IPC interactions, not merely labels or source-string presence. The [1F-SAVE local and supported-target matrices](phase-1f-save-correction.md#3-local-regression-matrix--mandatory) add the precise correction regressions; neither matrix replaces the other.

| Case | Required result |
| --- | --- |
| Supported Source edit and reverse Scene edit | Each accepted change updates the other view, disk bytes and provable IDs through the shared transaction path. |
| Valid out-of-subset/opaque text | Exact source survives acceptance and later adjacent visual edits; only affected interpretation is partial/unverified, with no invented grammar or SDK execution. |
| Incomplete/invalid draft and refused Save | Disk is unchanged; draft/local undo survives; clear diagnostic and accepted-revision visual indication; no Save Anyway. |
| Dirty Source / Scene collision | Same-file mutations, destructive file operations and affected committed undo/redo are refused without changing the draft; safe unrelated editing still works. |
| Clean external change | Verified content refreshes and mappings/selection update or clear; own writes do not create a watch/write loop. |
| Dirty external conflict and Gate-E reconciliation | Both competing contents are preserved. Proven non-overlapping exact patches have an explicit preview/Apply Both path; overlap/ambiguity writes nothing. Delete/rename never auto-merges, recreates or retargets. |
| Multi-draft Save All | One failed preflight causes zero writes; a fully valid set uses one recoverable multi-mutation transaction, and interrupted/conflicting outcomes do not clear drafts or allow leaving. |
| Persistence shortcuts/status | Dirty draft = Pending validation; external draft conflict = Conflict; recovery keeps Recovery required precedence. Source Ctrl/Cmd+S accepts the captured draft through shared durability; clean Source uses global Flush; draft Ctrl/Cmd+Z never invokes project history. |
| Source scope and mapped definitions | Existing project `.rpy` files only; Scene sync works, unmapped source remains source-only, and mapped supporting definitions cannot be accepted into silently stale metadata. No raw file lifecycle UI. |
| Encoding and resource bounds | UTF-8/optional BOM round trips exactly; invalid UTF-8 remains untouched/read-only. 16 MiB editable-file and dirty-buffer aggregate/count limits fail without losing existing drafts. |
| Missing/renamed clean source | Affected projection becomes explicitly stale/unavailable and mapped writes block; no guessed rename, recreation or retargeting. |
| Unicode, BOM, LF and CRLF | Exact byte/editor-position round trips, including supplementary Unicode, and no unrequested encoding/newline normalisation. |
| Source ↔ Scene selection | Exact current mapped range/containing supported Beat; opaque/invalid/unmapped positions never select a guessed Beat. |
| Local text versus committed undo/redo | Draft undo never writes disk; Save creates the intended project-history action; repeated committed inverses use current revisions and respect conflicts. |
| Navigation, close/switch/exit and reopen | Per-file drafts survive same-project navigation; Save All / Discard / Cancel and save failure follow section 1; accepted content reopens, with draft restart limits explicit. |
| Stale session and recovery scope | Late responses/writes cannot affect a different session/file; safe ordinary conflicts stay file-local and unresolved mixed transactions still block project writes. |
| No-op and minimal patches | Byte-identical no-op; comments, Custom Code, unknown metadata and all unrelated ranges survive supported edits. |

Run repository/whitespace checks, frontend/type tests, relevant core regressions and existing source golden tests cheaply first. Retain existing transaction, lifecycle, supporting-authoring, Scene/media and denial regressions. Obtain scope-justified Windows x64 and macOS ARM64 native/package evidence on the exact implementation candidate, including meaningful Source interaction evidence, without a production matrix for each small edit or docs-only receipt. Extend native smoke only as needed for actual 1F behaviour.

Passing counts, ignored workers, SDK skip wrappers, real archive-backed SDK executions and unavailable tools must be distinguished. A process launch, source-string assertion or green badge alone is not behavioural acceptance. Do not claim broad native evidence for an untested later implementation.

Self-review once against this scope and resolve significant demonstrated findings without reopening unrelated architecture. Commit/push coherent work on the 1F branch, update its existing PR, and publish the execution ledger plus CURRENT and the single HANDOVER. Stop for independent review; do not merge or proceed into 1G. If CI is pending, preserve exact run/attempt/SHA and stop active model polling. No full log dumps or self-referential receipt commits.

## Bounded technical approach and state transitions

Phase 1F extends `AuthoringService` rather than adding a second filesystem or export
stack. Core owns a session-local draft registry keyed by the opaque project authority
and normalized project-relative `.rpy` path. Source discovery uses the transaction
service's anchored `game/` inventory; reads, accepted writes, source-map companions,
history and recovery checks use that same service. Renderer requests carry the current
session plus relative path and expected draft/base revisions, never a project root.

Each open file has an accepted base byte snapshot/revision, optional UTF-8 editor
buffer and selection, parse/mapping result, and conflict/unavailable classification.
Clean refresh replaces the accepted snapshot only after a verified anchored read and
remaps or clears selection. Editing creates or updates an in-memory draft without a
write. Save preflights size/encoding, current base, bounded grammar diagnostics,
recovery and mapping/metadata reconciliation before proposing one shared transaction;
success replaces the base with the returned revision, resets local text history and
adds one committed history entry. Refusal retains the draft and selection. Explicit
discard/reload removes the draft only after confirmation and resets to the verified
current revision. Close/switch/exit uses an all-draft preflight, then either one
multi-mutation transaction, explicit discard, or no state change.

A dirty file whose live revision differs from its accepted base becomes `conflict` and
keeps base, draft and external bytes. Core derives exact base-to-draft and base-to-live
patches; only provably non-overlapping patches expose a combined preview. Confirmed
Apply Both applies both patches to the verified live revision through the normal
transaction path. Overlap, ambiguous mapping, invalid UTF-8, missing/renamed files or
unresolved recovery exposes no write proposal. Dirty-file guards are consulted by
Scene and project-history mutations; unrelated-file operations remain available only
when the existing transaction/recovery scope proves them safe.

The Source UI is a centre workspace backed by these returned states: project-owned
`.rpy` navigator, relative path, line-numbered monospace editor, diagnostics,
supported/opaque mapped ranges, selection bridge, dirty/conflict/partial badges and
explicit Save/Discard/reconciliation actions. Source-focused Save and text undo stay
inside the draft flow; project history remains separate. A bounded refresh request
debounces external observation and distinguishes the last accepted Loomlight revision
from a genuinely new live revision, without executing Ren'Py or project Python.

## Execution ledger

Earlier entries record the state and interpretation at publication. The precedence note
above and the 1F-SAVE brief supersede older causal claims and continuation directions;
historical failures and validation remain associated with their exact candidates.

2026-09-20: Continuation brief published during CI-SIMPLE closeout. No 1F application code or test acceptance is claimed. The existing Phase 1F requirements remain the milestone boundary; starting the next goal selects execution only after the recorded entry checks.

2026-09-20: User approved fixing the seven source-editing behaviours before implementation. Removed the open-ended save-invalid policy choice, pinned the Phase 1E grammar boundary, draft/conflict/navigation/selection/undo behaviour and the mandatory regression matrix. This is a brief/handover amendment only, not 1F implementation or new application acceptance; no new planning checkpoint or CI orchestration work is introduced.

2026-09-20: Follow-up omission review reconciled the brief with UI, DATA_MODEL, TRANSACTIONS and the accepted lossless-source Gate E. Added Source-focused Save/undo and persistence-state precedence, all-before-write Save All preflight, explicit safe non-overlap Apply Both reconciliation, source-file scope and mapped-definition safety, UTF-8/16 MiB and bounded-draft limits, clean missing/rename behaviour, and minimum Source UI requirements. No application code was changed and no production/package matrix is warranted for this documentation-only clarification.

2026-09-20: Phase 1F entry checks started from freshly fetched main `8862495f`. Phase
1E and CI-SIMPLE integration/post-merge evidence were confirmed without rerunning the
completed matrix. PR #13's head was verified as an ancestor of main and the already-
authorised remote `maintenance/ci-simple-cleanup` ref was deleted and verified absent.
No matching Phase 1F branch/PR existed, so
`feature/phase-1f-source-synchronisation` was created from that main head in an isolated
worktree. The bounded approach/state transitions above were recorded before UI writes.
Actual-client setup was unavailable on this baseline: a bundled interpreter was
located, but `scripts/codex_local.py` is absent from integrated main. No private
profile or journal was created; work used only repository fixtures and ordinary
host-independent development tools.

2026-09-20 interruption transfer: The checkpoint is `in_progress`, not review-ready.
An exploratory core Source-service slice and matching protocol edits were started but
could not be compiled on this client because no Rust toolchain was available; the UI
slice was not applied. Every incomplete application/protocol edit was therefore
reverted before publication. Candidate
`6a593cffd6b32109e88a5c56b6925f955c3fb13c` contains only the verified entry checks
and bounded approach above. Local `scripts/validate.py` passed for 205 repository
files and staged/working `git diff --check` passed. Draft PR #14 points to that exact
candidate; Repository quality run `35507258915`, attempt 1, passed its single
`Validate repository` job at the candidate SHA. No production, native, package,
frontend, Rust core, Source interaction or mandatory behavioural-matrix evidence is
claimed. The next bounded action is to implement the core Source inventory/buffer/
acceptance boundary from the recorded approach in small compiling increments, add its
service regressions, and only then proceed to IPC/UI wiring. Preserve the existing
branch and draft PR and do not replay the entry checks or CI-SIMPLE validation.

2026-09-20 implementation continuation: Resumed at that exact action without replaying
entry or housekeeping checks. Added the core-owned existing-`.rpy` inventory, bounded
session drafts, explicit single/Save All acceptance, exact external reconciliation,
source-map/history integration, same-file guards, conservative stable-ID reconciliation,
and missing/invalid/conflict states. Wired the eight typed Source operations, centre
workspace, exact Scene/Source navigation, session-only draft warning, Save/Discard/
Apply Both and close/switch/exit Save All / Discard All / Cancel flows. Extended the
packaged smoke and made the production workflow require its Source completion markers.
No Branches, SDK run/validation, Git UI, raw source lifecycle, autosave journal, general
parser, capability, or Phase 1G work was added.

Local validation passed after self-review: `scripts/validate.py` checked 209 repository
files; `git diff --check`, Rust formatting, and clippy with `-D warnings` passed; the
independent core suite ran 150 tests with 146 passed and four documented subprocess
worker markers ignored; frontend type/tests ran 19 passed and the Vite production build
passed; lossless-source ran 26 passed; SDK adapter/archive ran 24 passed; the 620,000-byte
lossless benchmark parsed 40,000 nodes with a 237.50 ms median over seven samples.
Focused 1F coverage includes Source↔Scene updates, exact/opaque preservation, invalid
save refusal, non-overlap Apply Both and overlap refusal, zero-write Save All preflight,
shared history, same-file/supporting guards, stale sessions, clean/missing external
source, BOM/CRLF/supplementary Unicode, invalid UTF-8, `.rpyc`/traversal denial, real
16 MiB/64-buffer/64 MiB limits, exact reorder versus ambiguous ID handling, Source-local
undo, and failed/successful close choices. Local Linux desktop/package compilation was
attempted only as supplemental evidence and was unavailable because this client lacks
`pkg-config`/GLib development metadata; supported Windows/macOS native/package evidence
remains the authoritative pending gate.

2026-09-20 candidate publication: Local implementation commit `8547bfdc` produced tree
`50e503c0403afaa01bc95779212a9ce66391555e`. Because this continuation client had no
shell Git credential, the approved GitHub connector published that exact tree as
fast-forward candidate `4fc544559e9f5d7ea8d591f08b95fb58bf2c30ef` on the existing
branch; PR #14 was verified still draft with that head. Repository quality run
`35544769657`, attempt 1, passed at the candidate. Production run `35544944804`,
attempt 1, was manually dispatched at that same SHA and was queued when the ledger and
handover were published. The production gate includes preflight, Windows x64 and macOS
ARM64 core/SDK/desktop/package checks, packaged Source interaction/security smoke,
artifact scan and dependency inventory. No native success is claimed before terminal
evidence; per this brief, the exact pending run is recorded and active polling stops.

2026-09-21 bounded review correction: Independent review was verified against current
code and failed production run `35544944804`, attempt 1. Its Windows x64 and macOS ARM64
artifacts both showed the packaged smoke stopping at `source-focused-save` before a
`source.save` call. The correction keeps that assertion but uses a deterministic,
cancelable focused-editor event and records the actual exception in the stage marker.
Clean mapped source changed externally from valid to detected-invalid now remains
inspectable as current bytes while Source is invalid, persistence is Conflict, affected
writes block, and Scene is explicitly stale/conflicted with no previous Beats presented
as current. Opaque supported-preservation behavior is unchanged. Discard Draft and
Reload External / Discard Draft now require confirmation with Cancel/no-change, and
Copy Draft performs an actual clipboard copy with a bounded fallback.

Focused regressions cover clean external valid-to-invalid transition through Source,
inventory, persistence and Scene projection; both destructive confirmation flows and
Cancel; and Copy Draft. Corrected local gates passed: 209-file repository validation,
whitespace, Rust format and clippy, core 151 total / 147 passed / four intentional
worker fixtures ignored, frontend 21/21 plus production build, lossless-source 26/26,
SDK adapter/archive 24/24, and the 620,000-byte/40,000-node benchmark at 224.81 ms
median. Linux desktop compilation remains unavailable before compile because this
client lacks `pkg-config`/GLib metadata. Local correction commit
`026209493f5c7ea16433564ec4844e436ac631d3` and remote candidate
`822e3fbeea9e90409ecc66988322cc524309468c` share exact tree
`bb8fca46a99b6e07cdee9898c7b0f1b938fd5d51`. Repository quality run `35552625358`,
attempt 1, passed. Corrected production run `35553029892`, attempt 1, was manually
dispatched at that exact remote candidate and was in preflight at publication. Per the
no-polling rule, no supported-target success is inferred. The next bounded action is to
inspect that run's actual Windows/macOS jobs and Source markers once terminal, then stop
for independent review on pass or record only the exact remaining blocker on failure.

2026-09-21 interrupted-correction closeout: Production run `35553029892`, attempt 1,
was inspected after becoming terminal. Preflight and both supported targets' core, SDK,
desktop-boundary and packaging steps passed, but the packaged WebView smoke failed on
Windows x64 and macOS ARM64. Both evidence artifacts reported
`sourceAuthoringStage: source-focused-save: Timed out waiting for Source acceptance`;
Source UI acceptance did not complete. This supersedes the ledger's earlier pending
description and is retained as failed evidence for candidate `822e3fbe`.

The bounded follow-up routes focused Source Ctrl/Cmd+S at the window capture boundary
before application-wide Flush, waits for the rendered dirty state before the packaged
smoke shortcut, and includes status plus observed calls in any future acceptance
timeout. Its regression proves Source save suppresses global Flush and that disposing
the Source view removes the handler. Local commit
`3ce6e8fdd69b946d7d31d7b1104a991e1ccfb8ec` and published candidate
`4dfedd24b4831972376d69fde216ad2063d708d4` share tree
`f925db131c27fd744d13b64fadd6019ab370e1ea`.

Latest local gates passed: 209-file repository validation, whitespace, Rust format and
core clippy, core 151 total / 147 passed / four intentional worker fixtures ignored,
frontend 21/21 plus production build, lossless-source 26/26, SDK adapter/archive 24/24,
and the 620,000-byte/40,000-node benchmark at 168.57 ms median. Repository-quality run
`35554153917`, attempt 1, passed at `4dfedd24`. No supported-target production workflow
was dispatched after that publication; the Actions history still ends with failed run
`35553029892` (#68). The last completed action was therefore publication plus repository
quality, not supported-target validation. The executor opened the production-workflow
page, but the user's closeout instruction superseded the task before dispatch; no CI,
approval or recorded tool error was pending. The next bounded action is to dispatch the
existing production gate for the current Phase 1F branch containing `4dfedd24`, inspect
both supported-target jobs and Source completion markers, and stop for independent
review on pass or record only the exact demonstrated blocker on failure. Phase 1F is not
review-ready or authorised for merge/1G at this closeout.

2026-09-21 independent review and correction planning: the user requested publication
of the recommended fixes and a goal for another chat to implement and check them.
The [1F-SAVE brief](phase-1f-save-correction.md) records the faulty smoke dirty model,
the reduced experiment and its limits, shell/Source command ownership, retention and
lifecycle safeguards, exact local and target acceptance, and mandatory self-review.
[ADR 0007](../../adr/0007-shell-save-command-ownership.md) records the durable design
without replacing the transaction layer. The historical claim that the timeout proves
no `source.save` call is superseded; the exact native event sequence remains unverified.
The old dispatch-first continuation is replaced by implementation and local verification
before validation of a corrected candidate. This update is documentation only; code,
production gates and merge state are unchanged. 1F-SAVE remains `not_started`.

2026-09-21 1F-SAVE implementation closeout: The existing branch was resumed without
resetting its substantial checkpoint. The final application candidate is
`a720ea3fb150f2a49422e8385256179185129968` (tree
`8edc9136aa362e180faa52421584f519aa0c0935`); repository-quality run
`35624010863`, attempt 1, passed at that exact SHA. Local repository validation checked
215 files; whitespace, frontend typecheck/tests (25/25), frontend build, Rust format,
core clippy and core tests (147 passed, four intentional worker fixtures ignored) all
passed. Lossless-source passed 26/26, SDK adapter/archive passed 24/24, and the
620,000-byte/40,000-node benchmark recorded a 156.88 ms median. Linux desktop tests
were unavailable before compile because this client lacks `pkg-config`/GLib metadata;
the browser command was locally unavailable because Chromium downloads failed, but it
passed in Preflight and both target jobs.

The retained executable regression prints the historical fake-model red result as
`legacy-clean-assertion=false saves=1 flushes=0 updates=11 dirty=true` and the faithful
green result as `faithful-clean-assertion=true saves=1 flushes=0 updates=11 dirty=false`
in Preflight. The target copies show the same one Save, zero Flush and dirty-to-clean
distinction. The complete S1-S5 and L1-L16 matrix is in the 1F-SAVE ledger; L3, L8, L9
and L16 retain specifically named partial rows rather than inferred coverage.

Final production run `35624108754` (#75), attempt 1, ran exactly `a720ea3f`.
Preflight passed. Windows x64 job `106414336722` and macOS ARM64 job `106414336670`
passed browser, core, official-SDK lifecycle, the real-service
`phase-1f-source-save-target-gate`, desktop-boundary and packaging steps, then failed
packaged smoke, so later scan/inventory steps were skipped. Windows retained Source
button Save, selection-clean, shortcut Save, clean Source Flush, non-Source Flush and
`source-complete` checkpoints. macOS timed out before its first Source checkpoint.
Thus P1/P2 pass only for the Windows Source phase; P4 passes on both real services; P3
native Ctrl+S/Cmd+S is absent on both; and P5 fails on both. Synthetic DOM/WebView
input is not counted as P3.

Phase 1F and draft PR #14 remain blocked on target evidence. The single continuation
action is independent review of `a720ea3f`, followed by a bounded repair or split of
the legacy packaged-smoke tail so a new coherent candidate completes both target jobs
and scan/inventory, plus collection of native Windows Ctrl+S and macOS Cmd+S evidence.
Do not merge or begin Phase 1G.


2026-09-22 independent-review follow-up planning: Application candidate `a720ea3f`
was independently reviewed after its 1F-SAVE goal closeout. The Save architecture is
retained; no Source/core/transaction redesign is selected. Review identified two
acceptance-harness blockers: the packaged host's fixed 60-second whole-smoke deadline
can terminate a progressing run, and successful/rejected smoke-report handling uses an
identical condition so the rejection branch is unreachable. Windows run `35624108754`
reached `source-complete` before that host timeout; macOS timed out before Source after
passing browser/core/SDK/real-service/desktop/package work.

The selected next checkpoint is
[1F-SAVE-EVIDENCE](phase-1f-save-correction.md#7-independent-review-follow-up--1f-save-evidence).
It deliberately uses a simple 180-second coarse safety ceiling plus five stage
checkpoints rather than a heartbeat system or immediate smoke split; closes L3 with one
combined shell case, L8 with delayed Discard and Apply Both, L9 with deterministic
observation resumption, and L16 by the semantic shell boundary; then performs one final
target gate and separate native shortcut evidence. The checkpoint uses narrow local
validation because the Source core, transaction/recovery architecture and parser/SDK
spikes are not being changed. PR #14 stays draft; no merge or Phase 1G is authorised.

2026-09-22 1F-SAVE-EVIDENCE blocked closeout: The bounded E1-E6 correction is
implemented at application candidate
`fc918ae9c69f451d17e8d93292f7e4980d88356d` (tree
`de7821df25cce564d24009026869bdf22fb81b71`). Successful and rejected smoke reports
now take distinct terminal paths; the host has one named 180-second coarse ceiling and
the five specified checkpoints; L3, delayed Discard/Apply Both L8, deterministic L9
suppression/resumption and semantic-boundary L16 are closed. The delayed cases exposed
and now cover one real defect: a disposed Source controller no longer releases an old
barrier into replacement DOM. Save routing, Source/core transactions, reconciliation,
history, recovery and renderer privileges remain unchanged.

Focused local validation passed repository validation for 215 files, whitespace,
frontend check 28/28 and build. Repository Quality run `35689830891` passed the exact
candidate and supplied Rust format/compile/focused-test evidence unavailable on this
client. Phase 1 production run `35689869416` (#81) passed Preflight and, on Windows x64
and macOS ARM64, browser, core, official-SDK lifecycle, real-service Source persistence,
desktop-boundary and packaging. Both target artifacts reached
`post-source-conflict-complete` after all earlier prescribed checkpoints but not
`final-report-start` before the 180-second ceiling. Packaged smoke failed on both, so
secret scan and dependency/licence inventory were skipped; automated P5 remains open.

The matching cross-platform terminal stage, after earlier diagnostic candidates fixed
format, macOS modifier and conflict-copy issues and falsified microtask-only polling,
localizes the remaining blocker to the monolithic packaged tail after conflict. This
closeout does not increase the ceiling, rerun the same SHA, split the smoke or redesign
Source Save. Independent review must decide whether the repeated evidence justifies a
separately scoped split or another focused harness correction. Trusted native input was
unavailable, so P3 also remains open: Windows must verify dirty Source Ctrl+S, clean
Source Ctrl+S Flush and non-Source Ctrl+S isolation; macOS must repeat with Cmd+S.
PR #14 remains draft. Do not merge or begin Phase 1G.

2026-09-22 final 1F-SAVE-EVIDENCE harness correction: Independent review authorised
one last harness-only candidate. Application candidate
`628c901d9c5e860656ab0c194bc104ae3c4b760c` (tree
`703bb7b747634e88583aa94817afedba6a9ddcd8`) changes only the named coarse ceiling
from 180 to 300 seconds and restores deterministic terminal ordering: await the
post-conflict checkpoint, restore the requester during normal cleanup, await the final
checkpoint, then await the report. The five checkpoints, all smoke/security assertions,
E1 and L3/L8/L9/L16 evidence remain unchanged; no Source/core architecture changed.

Local validation passed repository validation for 215 files, whitespace, JavaScript
syntax, frontend check 28/28 and build; Cargo was unavailable. Repository Quality run
`35697359981` passed the exact candidate. Phase 1 production run `35697492679` (#82)
was dispatched once after confirming ownership. Preflight `106647498726` passed.
Windows x64 `106647641203` and macOS ARM64 `106647641198` passed browser, core,
official-SDK lifecycle, real-service Source persistence, desktop boundary and packaging.
Both packaged artifacts persisted every checkpoint through
`post-source-conflict-complete`, then timed out at 300 seconds without
`final-report-start`. Secret scan and dependency/licence inventory were skipped; P5
remains failed.

Because the post-conflict checkpoint is now awaited, the evidence shows its request
reaches and is persisted by the host but its IPC response does not return to the probe
before the absolute ceiling. Per the stop condition, do not increase the timeout again,
rerun this SHA, start another yield experiment, split the smoke automatically or modify
Source Save. Native P3 remains the manual Windows Ctrl+S/macOS Cmd+S checklist. Keep
PR #14 draft and stop for independent review; do not merge or begin Phase 1G.


2026-09-22 timing-diagnostic correction: Independent review of the failed 300-second
candidate corrected the prior causal wording. A persisted
`post-source-conflict-complete` checkpoint proves host receipt, but without elapsed
timing it cannot distinguish a checkpoint arriving near the 300-second deadline from a
long IPC-response stall. The selected diagnostic adds native monotonic `elapsedMs` to
the existing five checkpoint records only. Timeout, renderer flow/yields, Source/core
behavior and acceptance semantics remain unchanged. One exact production measurement
is required before choosing any smoke split or IPC correction.

2026-09-22 final-report scope correction: Run `35702906716` (#83), attempt 1,
at `1d5704b738de25a1b95197cc0866f866ae52826d` retained post-conflict at 1,017 ms
on Windows (`106665056764`) and 5,157 ms on macOS (`106665056681`), then failed
at 300 seconds without a final report. Preflight `106664883810` passed, but both
target secret scans and inventories were skipped. This supersedes the prior causal
inference: neither insufficient time nor stalled checkpoint IPC was proven.

The actual probe's `sourceCommandTrace` was declared inside the authoring try and used
outside its scope/catch. The new full-probe/real-shell regression reproduced
`ReferenceError: sourceCommandTrace is not defined` in all three subcases before the
fix. Moving that single declaration to callback scope made successful reporting,
guarded failure reporting and incomplete-trace rejection pass. Existing frontend
discovery/preflight includes the group; check passes 32/32, build/syntax/repository
validation (216 files)/whitespace pass. Self-review confirms no assertion, timeout,
checkpoint, yield, Source/core or privilege changes; no further significant finding.
See [1F-SAVE section 7.16](phase-1f-save-correction.md#716-final-report-lexical-scope-correction)
for retained red/green evidence and exact scope. Corrected native P5 remains unverified
until both packaged reports plus scan/inventory pass. P3 remains the manual three-action
Ctrl+S/Cmd+S checklist. Keep PR #14 draft; stop for independent review, no merge/1G.

Published application candidate `85e44e926399ae7ad8431c948e1751db04dcde35`, tree
`ca22dc8486a7114eeda227821582a7945a344d77`, passed Repository Quality `35707727479`.
Production [35708223679](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35708223679)
(#84), attempt 1, was dispatched once after checking ownership and verified on that
exact SHA. Preflight `106682217975` passed; Windows `106682384572` and macOS
`106682384566` were in progress at handoff, with no artifacts yet. State is
`awaiting_ci`/manual resume under repository no-polling rules. Inspect this existing
run's terminal reports plus scans/inventories; do not dispatch again. P5 and P3 remain
unverified, not passed. On gate failure preserve evidence and stop for review.

2026-09-22 terminal evidence closeout (no redispatch): Existing production
`35708223679` (#84), attempt 1, passed on exact candidate
`85e44e926399ae7ad8431c948e1751db04dcde35`. Preflight `106682217975`, Windows x64
`106682384572` and macOS ARM64 `106682384566` all succeeded. Both target artifacts
(`10685588341` Windows; `10685592982` macOS) contain accepted final packaged reports
with all Source/security assertions true, complete Source command traces and all five
checkpoints. Final-report-start was 898 ms Windows / 5,782 ms macOS. Both subsequent
secret scans and dependency/licence inventories passed; inventories contain 85 npm
and 519 Cargo entries each. Real-service Source persistence also passed on both.
P1/P2/P4/P5 automated evidence is now satisfied for this candidate; the pending state
above is historical. Exact evidence/timings are in 1F-SAVE section 7.16.

Native P3 is the sole remaining acceptance-evidence blocker: dirty Source native Save,
clean Source ordinary Flush and non-Source isolation with Windows Ctrl+S/macOS Cmd+S.
Synthetic events do not satisfy it. Optional installable-package upload was not
selected, so evidence archives are not manual-test packages. No app code changed or
new run was dispatched. Documentation validation/whitespace passed. Keep PR #14 draft
and stop for independent review; no merge or Phase 1G.


2026-09-22 native P3 package request: Following independent review, the user explicitly
requested Windows x64/macOS ARM64 builds published on the repository and a detailed
manual checklist. Existing production run #85 (`35711244992`), attempt 1, was dispatched
once with `upload_packages=true` at `6d1ab428b2e3cd052323a8890c27897fb906b937`; the
delta from reviewed `85e44e92` is four documentation files only. This run is for
installer delivery because #84 did not retain packages, not a speculative retry of
failed evidence. Native acceptance is untested. See [the checklist](phase-1f-native-p3-checklist.md)
and [HANDOVER](../../status/HANDOVER.md) for package verification and the next action.
The stale opening P5 status has been corrected; all historical evidence is retained.


2026-09-22 manual package feedback: Editing the starting narration and adding a Beat
fail with `The Scene operation is invalid.` The bounded [Scene JSON correction](phase-1f-save-correction.md#718-scene-json-contract-correction)
aligns enum fields with the existing renderer contract and adds literal-JSON and
real-IPC persistence regressions. Native P3 is blocked at setup; #85 installers must
not be presented as accepted or retested for signoff. Corrected packages need fresh
validation. No Source Save/core transaction redesign, merge or 1G is selected.

2026-09-22 build #87 evidence closeout: exact candidate `0b9ea0f0` passed Preflight
and Windows/macOS target gates, including the new real-IPC Scene regression. Replacement
installers and evidence archives were downloaded, hash matched and ZIP checked. Use #87
for manual setup and native P3; see correction ledger section 7.19. No redispatch or merge.
