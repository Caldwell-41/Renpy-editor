# Current outcome handover

## Windows Studio request lifecycle: complete, local publication awaiting approval

One serial Local Windows x64 owner completed the selected bounded Studio synthetic
JSON request lifecycle on Caldwell-41/Renpy-editor, `codex/provider-qualification`,
in the existing `worktrees/provider-qualification`. Clean `9d7a6d6` fast-forwarded
to published `0a91e20` after ref/ancestry inspection. Unrelated worktrees are untouched.
No subagents, other host or CI. **Do not push until explicit user approval of the
finished result.** The later screenshot approval authorized capture/input, not push.

[Final owning acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-windows-request-acceptance--2026-10-09)
and [public final metadata](../tasks/evidence/2026-10-09-windows-studio-request-final.json)
record the exact proof. Shared product fixes are in
`0cec43ff7785713d9d9ba0a8f53391cd92ccdfe1`; controller/checks and the historical
capability stop are in `d8139eb`. Final acceptance records follow these local commits.

Two rejecting regressions demonstrated partial prompt/reasoning usage escaping saved
limits and valid completion discarded while Save checked out the project service.
Corrected publication waits off-thread within the captured deadline, retaining
cancel/configuration/project/shutdown guards. Production credential capture/backend
is unchanged. Tests use an injected public fixture reader, without OS credential
operations. Focused passes: core request 8, desktop request 6, fresh fixture 1,
frontend/protocol 11, Windows controller 6, shared controller 4, TypeScript, scoped
format and repository validation. Original pre-fix and harness failures remain recorded.

**Package:** build 1 passed the pinned offline Tauri NSIS route in 70.224 s, without
installation or policy changes. Ignored `app/.toolchains/windows-studio-request/package-1/loomlight.exe`
has SHA256 `b293c4340dd52af528ff5c5b5467f51273698984b4339e7a745dff49b1848266`;
installer SHA256 `a73e4ec2c440be3f83bef8cf3d0819d26abf336d7d5db4d3c5dfa8fe047c42fb`.
Privacy scan passed both artifacts. Final audit confirms executable/runtime identity
unchanged since build. Post-build edits affect controllers/tests/records only.

**Native result:** after capture approval and successful Explorer screenshot-backed
click/typing preflight, launch 3 passed in 273.953 s. Project/settings/profile loading
made zero HTTP requests. Five explicit sends carried the identical 279-byte synthetic
body: HTTP 200 with reported usage; stalled source edit/Save/cancel; safe HTTP 401;
HTTP 200 with unknown usage; stalled normal Alt-F4 exit. Source Save took 280 ms with
one active worker before/after, and the UI visibly returned to Saved while still
sending. Native captures establish visible outcomes; server/app receipts supplement
them. All 29 saved native observations took at most 2448 ms, below the separate
180-second operator bound. Product response deadline remained 600 s; connection 1 s
and cleanup 2 s were not confused with observation/whole-walkthrough timing.

Both stalled connections closed before server teardown. Normal exit code 0, no forced
termination, zero active workers and cleanup complete. All three exact owned roots
were removed, all app PIDs absent, all listener lifetimes stopped; final Windows
listener query confirms no listener on 46082. The one app-created synthetic credential
was removed by the accepted exact-target ownership-metadata flow and absence verified,
without enumeration or secret-value inspection. Task preflight window/file cleanup
is complete. No owned request, app, server, credential or fixture remains pending.

**Accounting/failures:** selected **1/2 builds, 3/3 launches**, cumulative Windows
**8 builds/15 launches** from historical 7/12. Mac request history remains 1 build/2
launches. No allowance reset; **no further launch is authorized**. Launch 1 failed on
the controller's CRLF marker (code 101, 0.886 s), fixed by exact LF bytes and regression.
Launch 2 opened welcome but text-only click geometry failed; screenshot waiver was
interpreted by automatic review as prohibiting capture. It exited normally at 509.029 s
with zero requests/credentials. The user later explicitly approved necessary captures.
The final native modal had a stale accessibility-cache index; fresh screenshot geometry
resolved it without retrying Send. These are controller/tool failures, not product failures.

All private originals remain under ignored `app/.toolchains/windows-studio-request/`:
build/input/runtime/package receipts, all three launch folders, native captures,
correction/cleanup records, pre/post-fix logs, listener audits and `final-audit.json`
with original JSON hashes. Preserve `blocked-final-audit.json` and the public partial
snapshot as historical evidence. The failed earlier connect audit did not retain its
return value and proves no port refusal; successful listener metadata proves absence.
The first approval/wrapper failure has no saved duration and is not a passed observation.

**Remaining boundary:** Windows selected scope is ready for push approval. Mac's prior
native/credential evidence covers unchanged scenarios only. The shared corrections
require focused Mac `cargo test -p loomlight-core ai_request --locked` and
`cargo test -p loomlight-desktop ai_requests --locked` for partial usage and completion
overlapping Save/invalidation; do not silently claim these passed or execute another
host from this task. Full 2A.2/live Studio/Phase 2 remain incomplete. No installation,
identity/security changes, real endpoints/content, provider/auth expansion, SSE,
proposal application, CI, merge/release or next feature is selected.
