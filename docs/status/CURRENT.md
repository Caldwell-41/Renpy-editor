# Current status

**Updated:** 2026-10-09. Windows remembered Studio qualification remains incomplete.
The approved documentation cleanup and initial evidence holds were published as
`00370ac`. Build 5 passed complete input equality/packaging, exit 0 and PID absence
in 209.75 seconds. Its installer was not run.

Run 8 failed native activation/alpha timeout without input. Run 10 captured masked
alpha and retained input after refusal, then timed out before Retry. Run 12 observed
alpha refusal/Retry without retyping, gamma Save, stale refusal and Cancel after exact
restore. Its first authenticated alpha GET succeeded, but the full probe failed with
`Client discovery timing missing`; no dependent reopen was dispatched.

The defect is identified: packaged Tauri defines immutable `invoke`; monkey-patching
it silently failed. The correction observes the actual renderer bridge and tests the
immutable property. Current checks: 28 controller, 10 Settings/probe DOM, app/test
TypeScript PASS. The earlier focused Rust check passed outside the sandbox; its
sandbox filesystem failure remains recorded. Native proof is still required.

**Allowance: 7/10 combined attempts used, three remain.** The final available sequence
is corrected build 6 plus full phase 1 run 14 and gated phase 2 run 15 on the same
package/new isolated root. Run 12's two known synthetic credential references/root
remain preserved; no automatic recovery or unrelated credential access. The
[current contract and evidence](../tasks/active/phase-2-initial-llm-assistance.md#current-windows-qualification-contract)
own scope and usage; [HANDOVER](HANDOVER.md) owns continuation.

Phase 1 source foundation remains accepted through PR19/main `5f448ca`. Corrected
Mac reload proof remains passed on `37e3ab3`, with its development-file compromise
and deferred native identity explicit. Full 2A.1, real Studio/generation, other provider
paths, cross-build Windows continuity and 2A.2 remain unselected/incomplete. No
installation, CI, merge or release; public v0.1.0 unchanged.
