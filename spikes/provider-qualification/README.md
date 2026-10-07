# Phase 2A.0 provider qualification spike

Isolated, dependency-free Python contract fixtures; no production imports, sockets,
provider installation, credentials or `.rpy` emission. They exercise proposed
[ADR 0013](../../docs/adr/0013-provider-request-and-transport-contract.md) boundaries.
They are not live provider or production-client evidence.

Run from repository root:

```bash
python3 -m unittest discover -s spikes/provider-qualification/tests -v
```

`probe-schema.json` and `probe-plan.json` preserve synthetic inputs and finite planned
sends. Replace no model/profile from project text. The endpoint/version/auth/model and
permitted-use record must be completed in the existing
[Phase 2 ledger](../../docs/tasks/active/phase-2-initial-llm-assistance.md#25-provider-qualification-ledger--2026-10-07)
before live execution. `live_studio.py` is a manually commanded runner for the explicitly
approved direct LAN Studio endpoint. It opens a native macOS hidden-key dialog and
waits for commands. Explicit **Remember for qualification** stores the key in macOS
Keychain's separate test service; later probe processes reuse it without API-key entry.
The ignored reference contains origin/service/opaque UUIDs only. No secret CLI/export,
environment inheritance or plaintext fallback. Missing/unavailable remembered keys
refuse rather than silently prompting again. This is qualification setup, not production
2A.1 settings implementation. Do not run it unattended.
Initial setup saves an owned nonsecret `.pending` reference before adding the key.
Failed setup retains it if key cleanup or record removal fails; startup then refuses
entry/use instead of creating another key. `cleanup_pending` performs one explicitly
selected owned-entry cleanup after reference validation and never runs automatically.
This correction was checked with fake stores only; the real remembered key is untouched.
Record every attempted send, including errors/cancelled or ambiguous sends, before
interpreting results. Never retry automatically. The generic endpoint is user-deferred.
Generation is bound to the user's selected exact ID and successful discovery receipt;
serialized requests must disable Studio tools and omit client tools/sessions. Do not
assert loaded-state or server-wide tools-off confirmation that was never observed.

Fixtures cover endpoint normalization/address policy, strict structured parsing,
tool rejection, protected tokens, SSE chunk/UTF-8 boundaries, budget refusal, safe
diagnostics, lifecycle publication and reader cleanup. Production native entry/store/reopen,
Save responsiveness, actual server support and SDK display proof remain later gates.

Recorded Studio execution result: 22 HTTP/16 generation attempts, 67.767 s summed HTTP time;
conservative cumulative live-window charge 1457/1800 s, 343 s remaining. Explicit
thinking-off/output 1024 passed protected-token and harmless tools-disabled JSON,
literal-fixture SSE and actual JSON/SSE client cancellation. Thinking-on output 1024
still truncated; on-mode SSE was not attempted because its prerequisite failed.
Installed Studio v0.1.902-beta is user-reported; discovery advertised loaded Gemma
12B/UD-Q4_K_XL and runtime/native/advisory context 262144. Full capacity is untested.
Generic is user-deferred. The ledger preserves every failure, conditional skip and
safe receipt/input digest. 61 offline checks pass; mocks are not provider evidence.

The [Studio contract review](../../docs/tasks/active/phase-2-initial-llm-assistance.md#studio-qualification-contract-review--2026-10-08)
found three defects omitted by the original 43-test suite. The
[corrected candidate and owner review](../../docs/tasks/active/phase-2-initial-llm-assistance.md#studio-review-corrections-and-owner-review--2026-10-08)
closes them: malformed `choices` produces a safe failure category, failed staged-key
cleanup retains its owned nonsecret reference, and JSON exponent overflow is refused.
Original failure evidence remains; regression gates reject the original candidate and
pass the corrected one. Studio-scoped acceptance is recommended; full provider/production
acceptance remains incomplete. Thinking-on failures reached the explicit `max_tokens`
allowances; they do not establish that thinking is unsupported or that a larger
allowance would fail. No `max_new_tokens` wire field was sent.

Remembered native qualification credentials were reused by a replacement process
without key entry; no secret files/CLI/export. Keep the owned Keychain entry available
until explicit removal is requested. All owned clients exited, no pending requests;
Studio/model remain running. Three of five additional contingency probes were used;
no further allowance needed. No production integration, native build, SDK or CI.
