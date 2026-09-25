# ADR 0008: Explicit session execution and controlled play

Status: corrected foundation; replacement native evidence verified, R1 blocked by renderer cancellation review finding (2026-09-26).

Compile, lint and Run can execute project Python. The core exposes closed typed
operations, session/preparation/trust/operation capabilities and no arbitrary argv.
Preparation reserves the transaction boundary, drains prior mutations and captures
content hashes plus file/root/SDK identities. Save All uses the existing transaction
owner. Saved revision retains drafts. Scene Commit remains an explicit editor action.
A token-bound cancel releases preparation before dispatch; preparation is single-use; refusal spawns nothing.

A grant covers the current canonical project and pinned SDK for this open session.
Inventories include all project files outside Git/editor journals and the entire SDK,
including Python/native modules, archives, orphan bytecode, saves and environment files.
Inventories refuse links, special files, depth above 32, over 8,192 project/65,536 SDK
entries, over 512 MiB per file or over 2 GiB per inventory. Accepted transactions advance
consent only from the recorded base revision. Unknown output provenance requires renewed
consent, including generated caches or saves. No suffix grants an exemption.

Run uses standard entry and an explicitly installed, exact reviewed
`game/loomlight_runtime.rpy` policy. Installation is a separate transactional request;
it never overwrites an existing different script. The policy activates only for the
editor's controlled Run environment. It disables developer/console tools and both
config and engine autoreload. Developer-off is necessary: the pinned SDK still permits
one default reload when only autoreload is disabled. Stop then Run deliberately loads
saved edits. Trusted project Python can override policies; this is not sandboxing.
The pinned CLI's `--savedir` places default saves/persistent data in `game/saves`, inside
the trust inventory (relative to the anchored working directory on Unix). Projects can deliberately load external data through their code;
consent does not certify an exhaustive inventory of dynamically accessed resources.

Run does not release script writes until the installed policy's display-start callback
reports that script loading/init completed. Startup has a 180 s deadline; subsequent
play has no duration deadline. Validate has a total 180 s compile-then-lint deadline.
The worker owns process resources independently of the lifecycle request mutex. Status
retains the first 2 MiB of combined inert output, pages at most 32 KiB, and reports
truncation. Stop signals gracefully, escalates after 1 s, allows 5 s forced cleanup and
1 s pipe shutdown. Readiness detection continues even after output retention truncates. Cleanup failure keeps the transaction reservation blocked.

Unix creates a process group before execution and retains the unreaped leader until
cleanup to avoid PID reuse. Windows creates suspended, assigns a kill-on-close job,
then resumes the verified initial thread. Natural exit and crash also terminate owned
descendants and drain pipes. Neither mechanism contains malicious escaping processes.
Close/switch refuse while preparation or cleanup is active; explicit Stop/cancel then
the existing draft leave flow is required. Dropping the service shuts down its worker.

During established play only supported script replacements/creates and required
metadata changes are permitted; media bytes/inventory, mixed mutations and conflicting
loaded script/compiled lifecycle operations require Stop. The same check covers history
inverses under transaction serialization. The runtime policy script itself is protected.
Status includes the launch digest. Terminal results conservatively report revision stale; cleanup performs no filesystem inventory. The next preparation performs full project/SDK inventories and consent comparison. Unknown output is never silently attributed to the SDK. Launch evidence is not a filesystem snapshot. External writers can race execution;
validation/result freshness and consent must not infer ownership of SDK-generated files.

The broad runtime and Diagnostics UI remains Phase 1G.2b. This ADR does not accept R1;
exact test results and missing evidence are maintained in the Phase 1G task ledger.


## Request and control ownership correction

The desktop uses `ApplicationHost` in the core. A short mutex protects an exclusive
service checkout and capability publication, never inventories, authoring I/O, dialogs,
child lifetime or worker joining. Competing authoring requests get an explicit busy
result while an existing request owns the service; ordinary script authoring remains
available throughout established play. Stop, status and trust revocation use a cloned
control capability bound to the captured session and operation, independently of that
checkout. Native dialogs capture a session before opening and revalidate it through
`complete_dialog` after returning, before registering a choice or changing projects.

`runtime.prepare`, `runtime.grantTrust` and `runtime.start` validate their closed payload
and capability before returning `{pending: true, requestToken}`. The session-bound
`runtime.requestStatus {sessionId, requestToken}` returns `{pending, response}` where
`response` is the original core result envelope when complete. Only one work item and
one retained result exist. `runtime.cancelRequest {sessionId, requestToken}` cancels
that work, including a completion racing the response. A newer request replaces the
receipt, so old callbacks cannot cancel its preparation. Completed preparation IDs
remain single-use; `runtime.cancelPreparation` is still supported. Start remains bound
to the current preparation and trust. No renderer paths, argv or manifests are accepted.

Inventory and recheck work has a 180-second cooperative budget, checked at directory
entries and hash chunks (at most 1 MiB). Cancellation is request-local and reaches SDK
launcher revalidation too. Filesystem calls themselves depend on the operating system;
this is not a hard interruption guarantee for a stalled kernel I/O call. The separate
control lane stays reachable. An atomic cancellation/spawn commitment determines whether
cancellation prevents every spawn attempt or stops an already committed launch. Cleanup
must complete before the reservation can be released. Source preparation retains current
input under its short lease, releases it when the work receipt arrives, then observes or
cancels work outside both the lease and the authoring coordinator.

Process cleanup does not perform terminal freshness hashing. Unix confirms process-group
disappearance independently of pipe EOF; Windows waits for the owned job to empty. A
cleanup failure retains both the failed process owner and the reservation, even if service
shutdown is called again. Preparation/trust are cleared on shutdown. This does not claim
containment of deliberately escaping project Python.

R1-B1/B2 implementation and automated cases are in the
[1G ledger](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger).
Replacement run `36144974132`, attempt 1, verifies candidate `07f23b6` on Windows x64
and macOS ARM64; its logs, artifact integrity and all 60 recorded input hashes per
target were checked. Independent review subsequently reopened R1-B1: the renderer's
post-completion cancellation uses service-bound `cancelPreparation` instead of the
receipt's independent `cancelRequest`, so a competing checkout can refuse cleanup.
R1-B2 remains resolved; the foundation is blocked, not user-accepted. The receipt
contract above remains the intended behavior. Existing native successes remain evidence
on their original inputs. See the ledger's independent review for the bounded finding
and the preceding closeout for exact provenance, counts and limits.
