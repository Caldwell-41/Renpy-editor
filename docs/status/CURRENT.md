# Current status

**Updated:** 2026-10-10. The selected outcome is [Prompts and context preparation](../tasks/active/phase-2-initial-llm-assistance.md#prompts-and-context-preparation-selection--2026-10-10),
on `codex/provider-qualification`, starting from published `92a3318`. One serial Mac
ARM64 owner, no subagents or other-host execution. The preceding manual reference
library remains accepted on both targets; [REFERENCE_LIBRARY](../REFERENCE_LIBRARY.md)
owns its unchanged contract.

| Capability | Implementation and evidence | Acceptance |
| --- | --- | --- |
| Dialogue rewrite prompt | Project-local literal Save, baseline comparison/confirmed restore, shared Undo/Redo, preserved unrelated settings/source and reopen. Five focused core cases and actual controller → ApplicationHost → persisted/preview integration pass. | Packaged native required. |
| Exact context preparation | One saved dialogue/narration Beat, exact approved card/lore revisions, deterministic inert payload, dependencies/exclusions/read revisions and input/output/margin accounting. Stale/draft/citation/budget refusal. | Packaged native required on both targets. |
| Draft/layout behavior | Controller tests pass retained drafts, duplicate Save prevention and stale completion. Actual Chrome rejects prior CRLF false-dirty behavior and passes unchanged-text correction with zero writes. | Physical keyboard/focus and theme/compact observations pending. |

[PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md) owns the new canonical contract. The
would-be payload is preview-only; provider sends/mappings, proposal/application,
generated references, automatic retrieval/import/export, routes, full 2B.1 and Phase 2
remain excluded. No runnable source, credential/HTTP or signing-policy change.

Final signed Mac package attempt 3 passed identity/signature/installer checks and
privacy scanning. Final typecheck, focused core/controller/dispatch checks, three
history-continuity regressions, reference regressions and repository validation pass.
The first package attempt failed before compilation because sandboxed identity lookup
returned no identities; outside-sandbox lookup diagnosed that access limitation. Review
fixed CRLF draft detection and completed dependency accounting before the final build.
The final package is retained locally. Its first native launch reached the physical
Save pause, but Computer Use reports the Mac is locked and cannot unlock automatically.
The author was asked to unlock it. Launch 1 was then cancelled at that pause with
zero accepted native checks; exact PID absence and owned-fixture cleanup are confirmed.
Native evidence remains missing; this is a capability blocker, not a product pass.

**Cumulative allowance:** Mac **3/3 package attempts, 1/4 launches**;
Windows **0/3 builds, 0/4 launches**. No automatic rebuild/retry or other-host transfer
is selected while local required native acceptance is unresolved. [HANDOVER](HANDOVER.md)
owns recovery and the next action; no process/fixture remains. Phase 1 remains accepted through
PR19/main `5f448ca`; public v0.1.0 is unchanged. Local recovery commits preserve this work. Publication is authorized after this host
is qualified for this new
outcome on the same branch, without merge/release/installation.
