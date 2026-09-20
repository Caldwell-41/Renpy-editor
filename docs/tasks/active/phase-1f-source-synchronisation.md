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

4. **External edits.** For a clean buffer, safely reload/reparse a verified external revision and remap selection, or clear unprovable selection. For a dirty buffer, keep the draft and external disk bytes, mark conflict and block stale writes; no automatic merge or force-overwrite. Provide Copy Draft, confirmed Reload External / Discard Draft, and Cancel; manual reapplication starts from the newly loaded revision. Missing, renamed or unsafe files retain the draft and a non-destructive diagnostic rather than automatic recreation or retargeting.

5. **Supported grammar.** Use the existing Phase 1E canonical Beat subset in DATA_MODEL as the semantic boundary: dialogue/narration, staging/appearance/placement, approved audio/transitions, typed simple assignments, unconditional Choice, Jump and Return/End. Preserve syntax outside that subset as exact opaque/Custom Code, not invented supported Beats. Unsupported is not synonymous with invalid: safe raw-source acceptance may retain opaque text with an explicit syntax-unverified/partial indication. Static recognition detects errors only within its proven lexical/grammar scope; it does not certify arbitrary Ren'Py or Python syntax. Do not expand into a general parser or invoke the SDK to decide whether Save is allowed.

6. **Selection.** Scene → Source selects the exact mapped range at the current revision. Source → Scene selects the containing supported Beat only when ownership is provable. A cursor in opaque, invalid or unmapped content clears the cross-view Beat selection and shows the appropriate partial/unmapped state; never guess the nearest Beat or reuse stale offsets. Preserve the user's Source caret, selection and draft during view changes.

7. **Undo.** Uncommitted text undo/redo stays in the Source buffer and groups natural typing bursts; it performs no disk writes. A successful source acceptance creates one committed project-history action for that edit. Reset buffer history to the accepted revision after successful Save or explicit Discard, not after a refused save. Committed undo/redo uses the existing project history and actual returned revisions, subject to rule 3 and external/recovery guards. Keep the two action scopes visible; do not invoke both from one shortcut or promise history persistence across restart.

All deliberately accepted writes and inverses use the existing transaction/history layer and revisions returned by actual commits. Do not create a direct-write path, acknowledge recovery as resolution, or overwrite an external revision during undo/redo. Keeping a draft does not make the visual projection a preview of those unaccepted bytes; label it as the accepted revision while a draft exists.

## 2. Extend the lossless source foundation

Implement conservative partial CST/range mapping only to the extent needed for the supported subset and Source workspace. Preserve comments, whitespace, embedded Python, custom syntax, unsupported regions, BOM and newline convention exactly where unedited. A no-op must preserve bytes. Scene edits patch the smallest verified supported range; a deliberate Source edit changes only its accepted source scope with preconditions enforced.

Track UTF-8/source byte offsets separately from decoded editor positions, including supplementary Unicode characters and selection remapping after edits. Preserve stable IDs and unknown metadata where mappings remain provable; ambiguous edits invalidate affected mappings rather than guessing ownership, changing identities silently or overwriting opaque text. Keep source, metadata/reference reconciliation and history within the existing recoverable boundary.

Use current-session authority and narrow typed IPC. Renderer-provided arbitrary filesystem paths, stale project tokens and late completions must not retarget another file or project. Preserve resource bounds and do not evaluate project Python to parse or diagnose source.

## 3. Wire Source and Scene coherently

Provide usable Source editing and bidirectional navigation/selection under section 1. Make Scene's View in Source action functional for mapped content. Supported direct Source edits update the Scene projection after accepted reconciliation; accepted Scene edits update the corresponding clean Source view without losing valid selection. Mutations affecting a dirty Source draft remain blocked as specified above.

Unsupported/opaque ranges remain visible and exact. Invalid or ambiguous edits must produce clear partial/stale/conflict indicators and disable only operations whose safety/currentness cannot be proven. Do not show last-valid Scene state as a fresh interpretation of invalid source. Preserve source-authoritative edges for the later Branches workspace without implementing that workspace now.

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
| Dirty external conflict, delete/rename and commit race | Both competing contents are preserved until explicit resolution; no merge, stale overwrite, automatic recreation or guessed retargeting. |
| Unicode, BOM, LF and CRLF | Exact byte/editor-position round trips, including supplementary Unicode, and no unrequested encoding/newline normalisation. |
| Source ↔ Scene selection | Exact current mapped range/containing supported Beat; opaque/invalid/unmapped positions never select a guessed Beat. |
| Local text versus committed undo/redo | Draft undo never writes disk; Save creates the intended project-history action; repeated committed inverses use current revisions and respect conflicts. |
| Navigation, close/switch/exit and reopen | Per-file drafts survive same-project navigation; Save All / Discard / Cancel and save failure follow section 1; accepted content reopens, with draft restart limits explicit. |
| Stale session and recovery scope | Late responses/writes cannot affect a different session/file; safe ordinary conflicts stay file-local and unresolved mixed transactions still block project writes. |
| No-op and minimal patches | Byte-identical no-op; comments, Custom Code, unknown metadata and all unrelated ranges survive supported edits. |

Run repository/whitespace checks, frontend/type tests, relevant core regressions and existing source golden tests cheaply first. Retain existing transaction, lifecycle, supporting-authoring, Scene/media and denial regressions. Obtain scope-justified Windows x64 and macOS ARM64 native/package evidence on the exact implementation candidate, including meaningful Source interaction evidence, without a production matrix for each small edit or docs-only receipt. Extend native smoke only as needed for actual 1F behaviour.

Passing counts, ignored workers, SDK skip wrappers, real archive-backed SDK executions and unavailable tools must be distinguished. A process launch, source-string assertion or green badge alone is not behavioural acceptance. Do not claim broad native evidence for an untested later implementation.

Self-review once against this scope and resolve significant demonstrated findings without reopening unrelated architecture. Commit/push coherent work on the 1F branch, open/update its PR, and publish the execution ledger plus CURRENT and the single HANDOVER. Stop for independent review; do not merge or proceed into 1G. If CI is pending, preserve exact run/attempt/SHA and stop active model polling. No full log dumps or self-referential receipt commits.

## Execution ledger

2026-09-20: Continuation brief published during CI-SIMPLE closeout. No 1F application code or test acceptance is claimed. The existing Phase 1F requirements remain the milestone boundary; starting the next goal selects execution only after the recorded entry checks.

2026-09-20: User approved fixing the seven source-editing behaviours before implementation. Removed the open-ended save-invalid policy choice, pinned the Phase 1E grammar boundary, draft/conflict/navigation/selection/undo behaviour and the mandatory regression matrix. This is a brief/handover amendment only, not 1F implementation or new application acceptance; no new planning checkpoint or CI orchestration work is introduced.
