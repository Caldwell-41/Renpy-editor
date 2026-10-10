# Current status

**Updated:** 2026-10-10. [First safe dialogue rewrite](../tasks/active/phase-2-initial-llm-assistance.md#focused-windows-ci-preparation-and-first-selection--2026-10-10)
is implemented on `codex/provider-qualification`, preserving published implementation
`515cd85`. Mac ARM64 selected-slice qualification is complete; Windows x64 proof
remains outstanding. One GPT-6.1 Sol High owner in the current development session;
one user-authorized serial reviewer has finished. No direct access to the user's
other computer. User-approved CI-first
routing replaces the mandatory Windows handoff; the required Windows cases remain.

| Capability | Automated proof | Native acceptance |
| --- | --- | --- |
| One saved Beat: exact send, strict response, inert review, acceptance/history | Both-target core/native/controller checks pass; Windows renderer 123/123 | Mac signed package walkthrough passes; Windows pending |
| Generated prose displays literally; existing tokens remain protected | Pinned Ren'Py 8.5.3 compile/lint/substitution/token checks and standard-template startup/say/return pass | Mac and Windows SDK runtime pass |
| Zero-write refusals, Undo/Redo and persistence | Malformed/unsafe/cancel/stale cases and exact history pass | Mac project/process reopen pass; Windows pending |

Retained signed Mac package 1 was reused with all 116 input hashes matching.
Native light/dark/compact observation, physical Generate/Accept, five exact reviewed
HTTP bodies and separate-process reopen pass. Reopen sends zero HTTP and preserves
whole-project bytes. Owned processes, synthetic credential and disposable fixture
are cleaned; prior failed launch-1 evidence is retained. SDK smoke needed a diagnosed
fixture correction; no production change or rebuild was necessary.

**Usage:** Mac **1/4 builds, 3/6 launches**; Windows **1/4 builds, 2/6 launches**.
**State: awaiting_ci.** [Run 38029621084](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38029621084)
failed after passing native light/dark/compact observation. The driver submitted Generate
input, then failed on a null-valued method call, likely an accessibility name; Accept
and process reopen
remain missing. All 64 artifact hashes and cleanup pass. Verified package, SDK and
portable proof were reused; no new build. A user-authorized GPT-6.1 Sol High reviewer
applied the scoped harness repair serially; parent review and cheap checks pass.
Null-safe names, exact present-button states, bounded stale-element handling and
failure-location diagnostics preserve every acceptance gate. New actual PowerShell
regression is skipped on Mac and must pass in Windows CI before launch.
Repair `69ddf5a` is published/verified. [Run 38030871532](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38030871532),
attempt 1, is confirmed in progress at **2026-10-10 06:25:33 UTC**, Windows only,
reserving zero builds and launches 3/4. Actual later usage/native proof await audit.
No production change; Mac proof stays valid. Manual same-chat resume; no polling.
[HANDOVER](HANDOVER.md) owns identity.
[PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md#first-safe-dialogue-rewrite), [UI](../UI.md)
and [ARCHITECTURE](../ARCHITECTURE.md#first-safe-dialogue-rewrite-boundary) own behavior.
Prior prompt/context/manual-reference outcomes remain qualified on both targets.
Phase 1/PR19/main `5f448ca` and public v0.1.0 are unchanged. Full 2B.1/2A.2/Phase 2,
merge and release remain outside this slice.
