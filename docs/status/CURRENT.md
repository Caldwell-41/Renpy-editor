# Current status

**Updated:** 2026-10-09. The selected Mac Studio authenticated non-streaming synthetic
request lifecycle is **implemented, qualified and cleaned up**. One serial Local
macOS ARM64 owner completed the work on `codex/provider-qualification`; implementation
candidate `3f3aaf3` and walkthrough continuation `e42597b` use the same verified signed
package. The final records checkpoint is published and its exact SHA verified in the
response. No integration, CI or release is selected.

[Final Mac acceptance](../tasks/archive/2026-10-09-mac-studio-request-lifecycle.md#final-mac-acceptance--2026-10-09)
owns exact proof, failures and cumulative accounting. Four explicit fixed-body
loopback POSTs passed through the packaged production app: completion with reported
usage, stalled request/cancellation, safe authentication error and completion with
unknown usage. Native source editing and Save remained responsive during the stall;
Save was 161 ms with one worker active before and after. Normal native quit returned
code 0. Owned app/listener absence, product removal of the one synthetic credential,
and exact fixture cleanup are verified. Original failed launch 1 and its operator
bound overrun remain preserved. Screenshots requested for user review stay outside Git.

Final selected consumption is **1/2 builds, 2/3 launches**. No operation, task-created
credential/root, listener or request is pending. This outcome is closed; unused
allowance does not select additional work. [HANDOVER](HANDOVER.md) retains recovery,
package/evidence ownership and the remaining acceptance boundary.

[Completed Windows credential qualification](../tasks/active/phase-2-initial-llm-assistance.md#final-windows-acceptance-and-cleanup--2026-10-09)
and valid Mac credential evidence are reused unchanged. Mac's development encrypted
files/saved unlock key, same-login limitation, deferred native ownership, approved
signing identity and legacy cleanup ownership remain. Phase 1 remains accepted through
PR19/main `5f448ca`; public v0.1.0 is unchanged. Windows needs focused affected request/
UI/Save/cancel/stale/shutdown proof without repeating credential qualification.
Full 2A.1/2A.2/Phase 2 and live Studio compatibility remain incomplete. No next feature,
other-host work, installation/security change or merge/release is authorized by closure.
