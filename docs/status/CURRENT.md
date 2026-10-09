# Current status

**Updated:** 2026-10-09. The selected **Windows Studio non-streaming synthetic
request lifecycle is complete**, including review, two demonstrated fixes, packaged
native verification and exact cleanup, published through `de29e49`. The selected
[focused Mac recheck](../tasks/active/phase-2-initial-llm-assistance.md#focused-mac-shared-request-verification--2026-10-09)
also passed on that exact continuation: core **8/8**, desktop **6/6**, no failed or
ignored tests. Only these verification records remain local on
`codex/provider-qualification`; their push requires explicit approval.

[The owning final Windows acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-windows-request-acceptance--2026-10-09)
records the five explicit synthetic sends: reported completion, stalled editing/Save
and cancellation, HTTP 401, unknown usage completion, and active-request normal exit.
Save took 280 ms with one request worker active before and after. Shutdown reported
zero workers; both stalled connections closed. All three owned roots/PIDs/listener
lifetimes and the one precisely owned synthetic credential are cleaned up.

Shared fixes bound partial reported usage and preserve valid completion overlapping
Save while retaining invalidation guards. Focused core/desktop/frontend/controller
checks pass. The existing pinned offline NSIS package passed and its runtime inputs
remain unchanged. No installation, identity or security-policy changes occurred.

Selected consumption is **1/2 builds, 3/3 launches**; cumulative Windows history is
**8 builds/15 launches**. Earlier marker/input failures and original captures are
preserved outside Git. The user approved necessary captures; screenshot-backed input
passed preflight before the final launch. No additional app launch is authorized.

[Archived Mac acceptance](../tasks/archive/2026-10-09-mac-studio-request-lifecycle.md#final-mac-acceptance--2026-10-09)
and Windows/Mac credential evidence are reused for unchanged scenarios. The shared
corrections passed focused Mac `ai_request` and `ai_requests` rechecks on the approved
Rust/Cargo 1.90.0 toolchain. One serial Local ARM64 owner made no code changes, package
builds, app launches or credential-store operations. Original output remains outside
Git; owned process groups/listeners and isolated temporary fixtures are cleaned up.
No new Mac package/native walkthrough is claimed. [HANDOVER](HANDOVER.md) records
the remaining boundary and local publication decision. Historical budgets/failures
are unchanged: Mac **1 build/2 launches**, Windows **8 builds/15 launches**.

Phase 1 remains accepted through PR19/main `5f448ca`. Full 2A.1/2A.2, Phase 2 and
live Studio compatibility remain incomplete; public v0.1.0 is unchanged. No CI,
merge/release, real endpoints/content, SSE, provider/auth expansion, proposals or next
feature is selected.
