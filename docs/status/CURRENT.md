# Current status

**Updated:** 2026-10-10. [First safe dialogue rewrite](../tasks/active/phase-2-initial-llm-assistance.md#first-safe-dialogue-rewrite-selection--2026-10-10)
is implemented on `codex/provider-qualification`, continuing published `e5f09c4`,
with published/remote-verified implementation `515cd85` and qualification incomplete. One serial local Mac owner, no subagents or direct
other-host execution.

Core/renderer/native dispatch synthetic checks pass, including exact reviewed send,
strict response, inert diff, one acceptance/Undo/reopen and zero-write refusals.
All 122 renderer regression cases pass. Approved Mac build 1 passed signature,
installer-content and privacy checks. Native launch 1 reached light layout but
Computer Use reported the Mac locked; its missing report failed the required gate.
Exact owned PID/fixture/synthetic file credentials are cleaned; failed evidence is
retained. The corrected standard-template SDK GUI smoke also needs a runtime rerun
after a 60-second timeout; compile/lint/literal token assertions pass.

**Usage:** Mac **1/4 builds, 1/6 launches**; Windows **0/4 builds, 0/6 launches**.
Manual Mac unlock is the next required capability. Reuse the unchanged signed
package for Mac walkthrough/separate-process reopen, then publish/verify local
qualification and transfer the same branch serially to Windows.

[PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md#first-safe-dialogue-rewrite), [UI](../UI.md)
and [ARCHITECTURE](../ARCHITECTURE.md#first-safe-dialogue-rewrite-boundary) own behavior;
[HANDOVER](HANDOVER.md) owns recovery. Prior prompt/context/manual-reference outcomes
remain qualified on both targets. Phase 1/PR19/main `5f448ca` and public v0.1.0 are
unchanged. Full 2B.1/2A.2/Phase 2, merge and release remain outside this slice.
