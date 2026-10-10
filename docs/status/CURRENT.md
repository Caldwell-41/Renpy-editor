# Current status

**Updated:** 2026-10-10. [First safe dialogue rewrite](../tasks/active/phase-2-initial-llm-assistance.md#successful-windows-native-audit-and-npm-pin-finding--2026-10-10)
is implemented on `codex/provider-qualification`, preserving `515cd85` and prior
both-target prompt/context/manual-reference acceptance. Mac ARM64 qualification is
complete. Windows native behavior passes; final pinned-toolchain package proof needs
one bounded correction. One owner; the user-authorized serial reviewer has finished.
CI-first routing remains authorized; no direct access to the user's other computer.

| Capability | Automated proof | Native acceptance |
| --- | --- | --- |
| One saved Beat: exact send, strict response, inert review, acceptance/history | Both-target core/native/controller pass; Windows renderer 123/123 | Mac passes; Windows automated UIA/OS input passes |
| Generated prose displays literally; existing tokens protected | Official pinned Ren'Py 8.5.3 compile/lint/substitution/token/startup/say/return pass | Both SDK runtimes pass |
| Zero-write refusals, Undo/Redo and persistence | Malformed/unsafe/cancel/stale checks and exact history pass | Both process reopens pass; zero HTTP/whole bytes/cleanup pass |

[Run 38030871532](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38030871532),
attempt 1, candidate `69ddf5a`, completed success at **2026-10-10 06:29:05 UTC**.
All 73 artifact hashes and seven native captures were audited. Windows launch 3
passes 20 distinct assertions/five exact HTTP bodies and physical Generate/Accept;
launch 4 passes three persistence checks with zero HTTP and cleanup. The actual
PowerShell regression passes. Verified package, SDK and portable cases were reused.
Mac signed package evidence remains valid on unchanged production inputs.

**Usage:** Mac **1/4 builds, 3/6 launches**; Windows **1/4 builds, 4/6 launches**.
**State: awaiting_ci.** Audit found recorded npm **11.17.0**, despite installation of
required **11.9.0**, in the original package and all Windows identities. Native proof
stands on its real binary; pinned-toolchain closure remains outstanding. Scoped CI fix
selects/checks the installed CLI and rejects drift in candidate/reuse identities.
Cheap checks and local Node/npm pin execution pass. Correction `95ce9c4` is published;
[run 38031993657](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38031993657),
attempt 1, is confirmed in progress at **2026-10-10 06:44:55 UTC**, Windows only,
with fresh cases/package build 2 and launches 5/6. One build/up to two launches reserved;
actual later use and pinned package proof await audit. [HANDOVER](HANDOVER.md) owns
continuation; manual same-chat resume, no polling.
No production/dependency/signing changes. Phase 1/PR19/main `5f448ca` and public v0.1.0
remain unchanged. Full 2B.1/2A.2/Phase 2, merge/release and next feature remain outside
this slice. [PROMPTS_CONTEXT](../PROMPTS_CONTEXT.md#first-safe-dialogue-rewrite),
[UI](../UI.md), [ARCHITECTURE](../ARCHITECTURE.md#first-safe-dialogue-rewrite-boundary)
own accepted behavior.
