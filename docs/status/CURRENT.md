# Current status

**Updated:** 2026-10-09. The selected outcome remains the
[manual reference library](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09).
The user approved UI A: a list beside directly editable fields, top creation control,
ordinary Save changes / Discard changes and shared app themes. The user's correction
removed manual approval/status controls; internal revisions/statuses remain stored.

| Capability | Implementation and proof | Acceptance |
| --- | --- | --- |
| Cards and lore | Versioned service, bounds/fixtures, typed IPC, forms/search/filter/order and shared transactions. Focused service/controller tests pass. | Mac packaged authoring/replacement/refusals pass; Windows required. |
| Lossless history/storage | Consecutive Undo/Redo correction passes failing-first real-dispatch, compound/interleaved/branch and external-boundary tests. Exact metadata and unknown data survive reopen. | Mac native multi-step history and separate-process byte-exact reopen pass. Windows required. |
| Reference integrity | Malformed/newer data retained; stale/missing citations and links preserved; nested extensions retained on edits. Project/session isolation and ordinary recovery pass core tests. | Representative Mac native cases pass. |
| Layout and focus | Direct editing, keyboard Save, focus restoration, list/form navigation, fixed Save controls and shared themes. | Mac physical keyboard/focus, wide light/dark and narrow dark observations pass. Windows required. |

The selected Mac work is reviewed and ready for local publication approval; both-target
acceptance remains incomplete. The owning ledger preserves all failures and the two
explicitly requested read-only subagent assessments. One serial implementation writer;
no further delegation or other-host execution. [HANDOVER](HANDOVER.md) owns continuation.

**Cumulative manual-library allowance:** Mac **7/9 builds, 10/13 starts**; Windows
**0/2 builds, 0/3 starts**. Owned fixtures/processes are cleaned. No push approved or
attempted. Unchanged credential/request evidence is reused; its independent totals
remain Mac **1 build/2 starts**, Windows **8 builds/15 starts**, without transfer.

Entry refs matched published `54f562d`; the branch preserves six earlier scoped local
commits and the repair/acceptance changes. Unrelated planning worktree is untouched.
Phase 1 remains accepted through PR19/main `5f448ca`; full 2A.1/2A.2, full 2B.1, Phase 2
and live Studio compatibility remain incomplete. Public v0.1.0 is unchanged.
Generation, provider/credential/HTTP, prompt/context/proposal, runnable-source changes,
installation/security, CI, merge/release and the next feature remain excluded.
