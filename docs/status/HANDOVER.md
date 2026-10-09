# Current outcome handover

## Windows qualification: budget boundary, phase 2 incomplete

One serial owner, Local Windows x64; Caldwell-41/Renpy-editor,
`worktrees/provider-qualification`, branch `codex/provider-qualification`.
Documentation cleanup/initial evidence holds are published at `00370ac`; corrected
bridge/controller instrumentation is published and remotely verified at `4698a88`.
Final evidence documentation follows that checkpoint. Preserve unrelated work.

The [current contract and evidence](../tasks/active/phase-2-initial-llm-assistance.md#current-windows-qualification-contract)
own scope, counters and failures. **10/10 combined attempts used; none remain.**
Stop before any further package build or launch. A continuation needs an explicitly
extended finite allowance and a justified capture-recovery plan; changing chat,
sequence or root does not reset usage. Do not advance to another feature.

Build 6 passed on `4698a88`: complete input equality, exit 0/PID absent, 258.11 s.
Package SHA256 `67fd69d2e6bb231c290d67f1270d7c7651fa0cb7ecc8c77f569aa3cdcc796986`.
Run 14 fully passed phase 1 in 243.87 s, including actual native observations,
ordered client timings, exact whole-store restoration, two credential presence
reads, normal exit and external PID absence. Run 15 was correctly gated on that
complete PASS and used the same package/root, with no intervening input changes.

Run 15 failed at `get-1-complete` in 18.08 s, exit 1/PID absent. Probe checks proved
reopen and one authenticated alpha GET, but they do not replace native observation.
The first native capture at 6.75–7.22 s returned a JPEG with null accessibility
despite `include_text:true`; the host text access failed. Its refresh then reported
`foreground window did not report a process id` after the hold expired. No capture
acknowledgement, beta input, replacement, removal or reload Retry was dispatched.
This is a capture/evidence failure; it does not establish a credential product defect.

Final external audit confirmed both run PIDs absent, no loopback listener, and equal
phase-1-complete/reopened/current store SHA256
`a26f9b908fc4b3d9480b2768a847e31d5cacd401399ab62f99d6028167622130`.
No process, server or build remains pending. Native window bindings are invalidated.

Private receipts/captures remain under `app/.toolchains/windows-studio-acceptance/`
and `windows-studio-step3/`. `state-sequence-14.json` owns the latest root;
`run-14.json` is the full first-phase PASS, `run-14-observed.json` has ordered native
events, and `run-15.json` plus `run-15-host-partial.json` preserve the failed reopen.
Original and run-8/10/12 roots remain preserved. Four known synthetic entries remain
referenced across run-12 and run-14 roots. Do not enumerate unrelated credentials,
recover uncertain ownership, delete these roots, or silently claim cleanup.

If more execution is authorized, first resolve the observed capture failure without
consuming a package attempt. Computer Use (`node_repl`, `@oai/sky`) remains the only
native UI route. Use returned windows, fresh observations and one action per refresh;
skip optional activation. Treat null accessibility as a missing observation and
account for capture/recovery inside the unchanged 15 s hold. Never acknowledge from
probe markers alone. Original screenshot encodings and failed receipts stay intact.
Node subprocess tasklist/OpenProcess cannot inspect the external app: external
controller exit receipts contain actual PID proof. Fault/restore needs only the
recorded TEMP/TMP and authorized external execution, not the build environment.

Deadlines remain build 1200 s +2 terminate/+2 reap, launch 300 s, entry 120 s including
fault/restore, confirmation/acknowledgement/Retry/exit 15 s, GET 15 s +2 cleanup.
No gate or deadline was relaxed. A future phase-2 retry must validate the complete
run-14 evidence, unchanged package/root and any required fresh-identity controller
support; the current sequence mapping does not authorize a retry by itself.

Checks: controller 28, Settings/probe DOM 10, app/test TypeScript PASS. Unchanged
Rust focused check 1 PASS/15 filtered outside sandbox; sandbox OUT_DIR failure retained.
Final documentation validation passed for 412 repository files; whitespace passed.
Initial push was auto-review blocked twice; the user explicitly approved the exact
repository/branch, after which both implementation publications were verified.
No installation, real keys/endpoints, generation, security changes, CI, merge/release,
other-host work or next feature. Windows qualification and full 2A.1 remain incomplete.
