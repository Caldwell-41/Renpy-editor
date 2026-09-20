# Phase 1F — Source synchronisation and partial-visual handling

**Prepared:** 2026-09-20, as the requested Phase 1 continuation after CI-SIMPLE integration.
**Behavioural decisions approved:** 2026-09-20; section 1 fixes the previously open product policies.
**State:** Next milestone selected; implementation not started by this documentation publication.
**Execution authority:** The user's next 1F goal starts this bounded milestone after the closeout checks in [HANDOVER](../../status/HANDOVER.md). No later milestone is authorised.
**Baseline:** Fresh integrated main with Phase 1A-1E and CI-SIMPLE; never either maintenance branch.
**Working branch:** `feature/phase-1f-source-synchronisation`; reuse matching work if it exists, otherwise create from verified main.
**Parent requirements:** [Phase 1 plan](phase-1-vertical-slice.md), section 1F. Preserve the existing [source/data](../../DATA_MODEL.md), [transaction/recovery](../../TRANSACTIONS.md), [UI](../../UI.md), [architecture](../../ARCHITECTURE.md) and [security](../../SECURITY.md) contracts.

## Objective and exclusions

Deliver the Source centre workspace and safe bidirectional Source/Scene synchronisation, conservative partial source mapping, exact unsupported-code preservation and truthful invalid/stale/conflict states. Extend the production source/range foundation already used by Scene and supporting authoring; do not replace it with a second exporter or make a visual model authoritative.

No Branches workspace, SDK Run/Validate UI, Git checkpoint UI, UI Designer, Timeline, LLM integration, plugins, arbitrary-project import, advanced global analysis, project-wide technical renaming or Phase 2+ work. Those remain in their owning milestones. No W0/OPT-1A repair, custom CI controller, client bootstrap, automatic wait/wake or cross-commit acceptance framework.

## Entry and bounded delivery

Confirm integrated 1E and the recorded CI-SIMPLE post-merge result rather than replaying prior milestones. Finish the already-authorised merged-branch housekeeping described in HANDOVER using existing GitHub tooling. Search current refs/PRs and preserve unrelated work; do not create a duplicate 1F branch or PR.

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

8. **Persistence status and Save shortcut.** Any dirty Source draft makes the project persistence indicator at least **Pending validation**, never Saved. An ordinary external draft conflict reports **Conflict**; unresolved transaction state reports **Recovery required** and keeps its existing wider precedence. While Source has focus, Ctrl/Cmd+S first attempts acceptance of the current dirty Source buffer and, on success, flushes the resulting accepted work through the existing durability boundary. With no current Source draft it retains the existing global Flush behaviour. Other dirty Source files keep the project in Pending validation until explicitly accepted or discarded.

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

The following is the minimum mandatory behavioural regression matrix. Test real service results and UI/IPC interactions, not merely labels or source-string presence.

| Case | Required result |
| --- | --- |
| Supported Source edit and reverse Scene edit | Each accepted change updates the other view, disk bytes and provable IDs through the shared transaction path. |
| Valid out-of-subset/opaque text | Exact source survives acceptance and later adjacent visual edits; only affected interpretation is partial/unverified, with no invented grammar or SDK execution. |
| Incomplete/invalid draft and refused Save | Disk is unchanged; draft/local undo survives; clear diagnostic and accepted-revision visual indication; no Save Anyway. |
| Dirty Source / Scene collision | Same-file mutations, destructive file operations and affected committed undo/redo are refused without changing the draft; safe unrelated editing still works. |
| Clean external change | Verified content refreshes and mappings/selection update or clear; own writes do not create a watch/write loop. |
| Dirty external conflict and Gate-E reconciliation | Both competing contents are preserved. Proven non-overlapping exact patches have an explicit preview/Apply Both path; overlap/ambiguity writes nothing. Delete/rename never auto-merges, recreates or retargets. |
| Multi-draft Save All | One failed preflight causes zero writes; a fully valid set uses one recoverable multi-mutation transaction, and interrupted/conflicting outcomes do not clear drafts or allow leaving. |
| Persistence shortcuts/status | Dirty draft = Pending validation; external draft conflict = Conflict; recovery keeps Recovery required precedence. Source Ctrl/Cmd+S accepts current draft then flushes; draft Ctrl/Cmd+Z never invokes project history. |
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

Self-review once against this scope and resolve significant demonstrated findings without reopening unrelated architecture. Commit/push coherent work on the 1F branch, open/update its PR, and publish the execution ledger plus CURRENT and the single HANDOVER. Stop for independent review; do not merge or proceed into 1G. If CI is pending, preserve exact run/attempt/SHA and stop active model polling. No full log dumps or self-referential receipt commits.

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
