# Phase 1F — Source synchronisation and partial-visual handling

**Prepared:** 2026-09-20, as the requested Phase 1 continuation after CI-SIMPLE integration.
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

This is one approved milestone with an implementation order, not a new series of optimisation/review checkpoints. Record the following policy choices and bounded technical approach in this brief before UI writes, then proceed through source services, UI wiring and validation in that order. Do not pause between those steps solely to request an approval already supplied by the 1F goal. A material scope change or unsafe missing prerequisite remains a genuine stop condition.

## 1. Define source editing and persistence states

Distinguish the unsubmitted editor buffer, accepted on-disk source revision, and derived last-valid semantic/visual projection. Define incomplete input, invalid syntax, valid supported syntax, valid unsupported/Custom Code regions, ordinary external divergence and unresolved transaction recovery. Do not label a draft as saved or a stale projection as current.

Specify Save/Ctrl-or-Cmd+S, commit/cancel, natural typing-burst undo grouping, Scene/Source navigation, project switch, close and restart behaviour. Preserve user input on validation failure and never silently discard a draft during navigation. Choose and document the invalid-source policy explicitly: either refuse normal acceptance while retaining the draft, or offer a distinct deliberate save-invalid action that preserves exact bytes while visibly invalidating the visual projection. Invalid text must never enter runnable source as an unnoticed side effect of switching tabs. Document any restart limitation for uncommitted drafts honestly.

All deliberately accepted writes and inverses use the existing transaction/history layer and revisions returned by actual commits. Do not create a direct-write path, acknowledge recovery as resolution, or overwrite an external revision during undo/redo.

## 2. Extend the lossless source foundation

Implement conservative partial CST/range mapping only to the extent needed for the supported subset and Source workspace. Preserve comments, whitespace, embedded Python, custom syntax, unsupported regions, BOM and newline convention exactly where unedited. A no-op must preserve bytes. Scene edits patch the smallest verified supported range; a deliberate Source edit changes only its accepted source scope with preconditions enforced.

Track UTF-8/source byte offsets separately from decoded editor positions, including supplementary Unicode characters and selection remapping after edits. Preserve stable IDs and unknown metadata where mappings remain provable; ambiguous edits invalidate affected mappings rather than guessing ownership, changing identities silently or overwriting opaque text. Keep source, metadata/reference reconciliation and history within the existing recoverable boundary.

Use current-session authority and narrow typed IPC. Renderer-provided arbitrary filesystem paths, stale project tokens and late completions must not retarget another file or project. Preserve resource bounds and do not evaluate project Python to parse or diagnose source.

## 3. Wire Source and Scene coherently

Provide usable Source editing and bidirectional navigation/selection. Make Scene's View in Source action functional for mapped content. Supported direct Source edits update the Scene projection after accepted reconciliation; accepted Scene edits update the corresponding Source view without losing selection or unsubmitted input.

Unsupported/opaque ranges remain visible and exact. Invalid or ambiguous edits must produce clear partial/stale/conflict indicators and disable only operations whose safety/currentness cannot be proven. Do not show last-valid Scene state as a fresh interpretation of invalid source. Preserve source-authoritative edges for the later Branches workspace without implementing that workspace now.

Follow Quiet Studio Dark and existing semantic tokens. Test keyboard navigation, labels, focus restoration, selection visibility and responsive layout; do not add unrelated redesigns or privilege/CSP relaxations.

## 4. Reconcile external edits safely

Debounce source-change observations, compare actual hashes/revisions, distinguish own writes, invalidate stale mappings and avoid write/watch loops. Handle external replacement, deletion, rename and changes racing with local commit or undo. Do not execute SDK/project code automatically on open, file events, typing, reconciliation or preview.

Ordinary divergence can be isolated to an affected file/Scene where safe. Unresolved mixed-file transactions, uncertain project identity and ambiguous recovery retain the existing project-wide write block. Demonstrate both cases; do not loosen recovery to make unrelated files appear editable. Preserve competing content and provide non-destructive guidance when automatic reconciliation is not provable.

## Acceptance and evidence

Add focused production-service, source-fixture and real UI/IPC coverage for no-op/minimal patches; exact Custom Code/comments/format preservation; Unicode/BOM/LF/CRLF mapping; Source-to-Scene and Scene-to-Source edits and selection; incomplete/invalid drafts and the selected save policy; grouped/repeated undo/redo; external-write races; stale sessions; navigation/close/reopen; file-local conflicts and mandatory project-wide recovery blocks.

Run repository/whitespace checks, frontend/type tests, relevant core regressions and existing source golden tests cheaply first. Retain existing transaction, lifecycle, supporting-authoring, Scene/media and denial regressions. Obtain scope-justified Windows x64 and macOS ARM64 native/package evidence on the exact implementation candidate, including meaningful Source interaction evidence, without a production matrix for each small edit or docs-only receipt. Extend native smoke only as needed for actual 1F behaviour.

Passing counts, ignored workers, SDK skip wrappers, real archive-backed SDK executions and unavailable tools must be distinguished. A process launch, source-string assertion or green badge alone is not behavioural acceptance. Do not claim broad native evidence for an untested later implementation.

Self-review once against this scope and resolve significant demonstrated findings without reopening unrelated architecture. Commit/push coherent work on the 1F branch, open/update its PR, and publish the execution ledger plus CURRENT and the single HANDOVER. Stop for independent review; do not merge or proceed into 1G. If CI is pending, preserve exact run/attempt/SHA and stop active model polling. No full log dumps or self-referential receipt commits.

## Execution ledger

2026-09-20: Continuation brief published during CI-SIMPLE closeout. No 1F application code or test acceptance is claimed. The existing Phase 1F requirements remain the milestone boundary; starting the next goal selects execution only after the recorded entry checks.
