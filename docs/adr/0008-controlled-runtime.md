# ADR 0008: Explicit session execution and controlled play

Status: proposed implementation, Phase 1G.2a; supported-target R1 required.

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
Status includes the launch digest and a terminal full-manifest comparison. Generated output also makes that comparison stale; it is never silently attributed to the SDK. Launch evidence is not a filesystem snapshot. External writers can race execution;
validation/result freshness and consent must not infer ownership of SDK-generated files.

The broad runtime and Diagnostics UI remains Phase 1G.2b. This ADR does not accept R1;
exact test results and missing evidence are maintained in the Phase 1G task ledger.
