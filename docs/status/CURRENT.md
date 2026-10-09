# Current status

**Updated:** 2026-10-10. The selected [manual reference library](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09)
is accepted on packaged Mac and Windows x64. UI A has directly editable Character
cards and lore entries, top creation controls and ordinary Save/Discard. Manual
Approve/Reject/Supersede and an Edit unlock are absent; revisions and statuses
remain stored internally. [REFERENCE_LIBRARY](../REFERENCE_LIBRARY.md) owns the
contract; the [Mac acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-manual-library-mac-acceptance--2026-10-09)
and [Windows acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-manual-library-windows-acceptance--2026-10-10)
own proof and limits.

| Capability | Acceptance |
| --- | --- |
| Cards, lore and reference integrity | Packaged UI → dispatch → metadata authoring, replacement, bounded refusal, malformed/newer refusal, external edit/reload, unknown-field retention, stale citation/missing link and source preservation pass on both targets. |
| History and storage | Consecutive Undo/Undo/Redo/Redo, exact IDs/revisions/statuses and byte-exact separate-process reopen pass on both targets. Core tests cover project isolation, ordering, recovery and deeper malformed/bounds cases. |
| Layout and focus | Physical keyboard Save/focus, wide light/dark and compact dark forms and list navigation pass on both targets. Windows compact vertical scrolling was not independently established. |

The Windows worktree safely fast-forwarded to published `dc889d6`, including the
reviewed Mac implementation `f48c446`; product code remained unchanged. Focused
Windows TypeScript, probe syntax, frontend/controller, reference core and shared
history checks pass. Its first sandboxed core run failed at temporary profile
creation; the same checks passed outside the filesystem sandbox. Windows package
attempt 1 failed at a diagnosed Tauri CLI argument separator, then attempt 2
built the x64 NSIS package and passed privacy scanning. Launch 1 timed out at
Computer Use window access before input. After the user's renewed request,
launch 2 passed 29 packaged assertions with physical Ctrl+S and focus observation;
launch 3 passed 3 reopen assertions with identical whole-file metadata bytes.
Owned fixtures/processes are cleaned; receipts and package remain ignored locally.

**Cumulative manual-library allowance:** Mac **7/9 builds, 10/13 starts**;
Windows **2/2 builds, 3/3 starts**. Unchanged credential/request evidence is
reused under its separate budgets. No extra allowance is needed for the selected
outcome. This records-only continuation is local; ask before pushing.
[HANDOVER](HANDOVER.md) identifies the next distinct deliverable without starting it.

Phase 1 remains accepted through PR19/main `5f448ca`; full 2B.1, Phase 2 and
live Studio compatibility remain incomplete. Public v0.1.0 is unchanged.
