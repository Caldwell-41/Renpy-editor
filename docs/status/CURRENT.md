# Current status

**Updated:** 2026-10-10. [First safe dialogue rewrite](../tasks/active/phase-2-initial-llm-assistance.md#focused-windows-ci-preparation-and-first-selection--2026-10-10)
is implemented on `codex/provider-qualification`, preserving published implementation
`515cd85`. Mac ARM64 selected-slice qualification is complete; Windows x64 proof
remains outstanding. One GPT-6.1 Sol High owner in the current development session;
no subagents or direct access to the user's other computer. User-approved CI-first
routing replaces the mandatory Windows handoff; the required Windows cases remain.

| Capability | Automated proof | Native acceptance |
| --- | --- | --- |
| One saved Beat: exact send, strict response, inert review, acceptance/history | Core/native/controller checks and 122/122 renderer regressions pass | Mac signed package walkthrough passes; Windows pending |
| Generated prose displays literally; existing tokens remain protected | Pinned Ren'Py 8.5.3 compile/lint/substitution/token checks and standard-template startup/say/return pass | Mac SDK runtime passes; Windows pending |
| Zero-write refusals, Undo/Redo and persistence | Malformed/unsafe/cancel/stale cases and exact history pass | Mac project/process reopen pass; Windows pending |

Retained signed Mac package 1 was reused with all 116 input hashes matching.
Native light/dark/compact observation, physical Generate/Accept, five exact reviewed
HTTP bodies and separate-process reopen pass. Reopen sends zero HTTP and preserves
whole-project bytes. Owned processes, synthetic credential and disposable fixture
are cleaned; prior failed launch-1 evidence is retained. SDK smoke needed a diagnosed
fixture correction; no production change or rebuild was necessary.

**Usage:** Mac **1/4 builds, 3/6 launches**; Windows **0/4 builds, 0/6 launches**.
Focused Windows CI is prepared in the existing production workflow: selected checks,
pinned SDK, one package and evidence-gated native input/observations plus dependent
reopen. Generic matrix and Mac jobs are excluded. Native driver rejection tests 4/4,
report-gate tests 2/2 and local repository checks pass; actual Windows capability
remains unverified. Publish/verify before dispatch, then follow manual same-thread
wait/resume. Up to one Windows build/two launches are reserved; runner records actual
consumption. [HANDOVER](HANDOVER.md) owns operation identity and terminal audit.
[PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md#first-safe-dialogue-rewrite), [UI](../UI.md)
and [ARCHITECTURE](../ARCHITECTURE.md#first-safe-dialogue-rewrite-boundary) own behavior.
Prior prompt/context/manual-reference outcomes remain qualified on both targets.
Phase 1/PR19/main `5f448ca` and public v0.1.0 are unchanged. Full 2B.1/2A.2/Phase 2,
merge and release remain outside this slice.
