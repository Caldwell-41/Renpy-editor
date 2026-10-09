# Current status

**Updated:** 2026-10-10. The selected outcome is [Prompts and context preparation](../tasks/active/phase-2-initial-llm-assistance.md#prompts-and-context-preparation-selection--2026-10-10),
on `codex/provider-qualification`, starting from published `92a3318`. One serial Mac
ARM64 owner, no subagents or direct other-host execution. The preceding manual reference
library remains accepted on both targets; [REFERENCE_LIBRARY](../REFERENCE_LIBRARY.md)
owns its unchanged contract.

| Capability | Implementation and evidence | Acceptance |
| --- | --- | --- |
| Dialogue rewrite prompt | Project-local explicit Save, baseline comparison/cancel/restore, shared Undo/Redo and isolation/reopen. Focused core/controller/dispatch checks pass; native launch 2 physically persisted exact text and exercised history. | Corrected packaged native qualification required. |
| Exact context preparation | Exact approved card/lore revisions, deterministic inert payload, dependency/exclusion/read-set and bounded size accounting. Core/controller and partial native payload/stale/budget checks pass. | Both-target native qualification incomplete. |
| Draft/focus/recovery | Native launch 2 found lost Save focus and disabled initial-load error state. Small corrections pass 17 TS cases, actual held-host controller/dispatch recovery and Chrome focus/newline checks. | Corrected Mac theme/compact/source/reopen proof and Windows proof pending. |

[PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md) owns the canonical behavior. Provider sends,
credential/HTTP changes, proposals/application, generated references, automatic retrieval,
import/export, full 2B.1 and Phase 2 remain excluded.

Mac launch 1 was cancelled while locked, with zero accepted checks. After unlock,
launch 2 used the retained signed package and completed 24 partial checks before a busy
initial-load error stopped the walkthrough. Its failed report is preserved; exact owned
PID absence and fixture cleanup are confirmed. The corrected code is locally reviewed
and tested, but the retained package predates it. This is an allowance blocker, not a pass.

**Cumulative allowance:** Mac **3/3 package attempts, 2/4 launches**; Windows **0/3 builds,
0/4 launches**. No extra build is authorized. The concrete remaining decision is one
additional Mac package attempt, using the two existing remaining launches for corrected
walkthrough and process reopen. [HANDOVER](HANDOVER.md) owns continuation. No process
or fixture remains. Work is local-only; publication remains authorized after Mac
qualification, then Windows transfer on the same branch. Phase 1 remains accepted
through PR19/main `5f448ca`; public v0.1.0 is unchanged.
