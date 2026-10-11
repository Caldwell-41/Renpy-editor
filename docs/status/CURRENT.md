# Current status

**Updated:** 2026-10-11. **Studio-only Phase 2 qualification in progress.** User
approved production LAN support and agent temporary-key entry, confirmed Studio
availability and deferred generic qualification. Retained Mac ARM64 session on
`codex/provider-qualification`, entry closure d03c117; published prerequisite audit
d175705. Fresh entry refs matched, main5f448ca. Unrelated work preserved. The
[owning task](../tasks/active/phase-2-initial-llm-assistance.md#studio-only-qualification-amendment--2026-10-11)
owns scope and allowance.

| Capability | Implementation / evidence | Remaining acceptance |
| --- | --- | --- |
| Five bounded Assist actions | Individual baseline233454b/run38105665896; new integrated native-worker/renderer test passes all five actions on an owned private LAN interface | New candidate required Windows/macOS and signed native evidence; real Studio results |
| Studio production generation | Literal private LAN HTTP admitted only with saved opt-in; fixed address, no DNS/proxy/redirect/retry; all five reviews disclose unencrypted transport and unknown inference locality | Temporary key not supplied; current model/schema/tool behavior on real Studio untested |
| Generic provider | Explicitly deferred by user; existing design contract only | Production generic support and generic qualification remain deferred |
| References/prompts/history | Integrated proposed Save/separate approval, exact later inclusion, generated staleness, mixed Undo/Redo and project/process reopen with zero HTTP pass locally | Broader Phase2 subset operations and final human acceptance remain incomplete |

Local focused checks pass: core35, transport8, native worker6, references12,
prompts5, renderer131, frontend build and integrated LAN controller. Pinned Ren'Py
compile/lint/runtime passes on exact synthetic accepted source without editor
metadata. New rejecting gates4 pass, including ordinary driver failure/cleanup;
existing gates28 pass with one Windows-only skip requiring Windows. Independent
review found Draft disclosure and unbounded harness waits; both repaired and checked,
final re-review finds no code/harness blocker. No real Studio discovery/generation, credential entry or
full Phase2 completion claimed.

Selected usage: each target0/4packages,0/6editor launches,0/4focused dispatches;
Studio0/2 attempts per action and0/2 discoveries. Prior allowances stay closed.
No owned process/listener/fixture or pending CI. Commit/push is authorized. Current
chat grants no autonomous CI polling; WORKFLOW manual same-thread wait/resume applies.
No signing changes, paid/public calls, merge/release or following deliverable.
[HANDOVER](HANDOVER.md) owns continuation.
