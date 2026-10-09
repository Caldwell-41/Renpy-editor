# Current status

**Updated:** 2026-10-09. The selected Windows Studio non-streaming synthetic request
lifecycle is **reviewed and corrected, but native acceptance is blocked** on input/
capture permission. This is a concrete capability stop, not completion or a push
approval checkpoint. Work is local on `codex/provider-qualification`, continuing
published `0a91e20`; shared fixes are committed as `0cec43f`. Nothing has been pushed.

[The owning Windows request acceptance record](../tasks/active/phase-2-initial-llm-assistance.md#windows-request-acceptance-and-capability-blocker--2026-10-09)
records exact evidence, package hashes, failures and cumulative accounting. Focused
regressions exposed and fixed partial usage escaping saved bounds and a valid response
being discarded when completion overlaps Save. Core/desktop/fixture/frontend/controller
checks pass. One Windows NSIS package passed, without installation or policy changes.

Launch 1 failed on a controller CRLF ownership marker and was corrected. Launch 2
opened the synthetic welcome screen, but native clicks require capture geometry and
keyboard navigation did not enter the WebView. The user waived screenshots; automatic
approval review interpreted this as prohibiting capture. Clarification allowing captures
needed for input remains pending. Zero HTTP requests or credentials were created.
Native Alt-F4 exited launch 2 normally with zero workers. Both exact roots, app PIDs
and listeners are cleaned/stopped; original failures and accessibility receipts remain.

Selected consumption is **1/2 builds, 2/3 launches**; cumulative Windows history is
**8 builds/14 launches**. One build/one launch remain, requiring a diagnosed correction.
Packaged Send/completion/unknown usage/cancel/error, stalled edit/Save and active-request
exit are still missing. [HANDOVER](HANDOVER.md) owns the exact continuation route.

[Archived Mac request acceptance](../tasks/archive/2026-10-09-mac-studio-request-lifecycle.md#final-mac-acceptance--2026-10-09)
and accepted Windows/Mac credential evidence are reused for unchanged scenarios.
The two shared corrections require focused Mac `ai_request` and `ai_requests` tests;
no other-host execution occurred. Credential backends, identities and policies are
unchanged. Phase 1 remains accepted through PR19/main `5f448ca`. Full 2A.1/2A.2,
Phase 2 and live Studio compatibility remain incomplete; public v0.1.0 is unchanged.
No installation, security change, CI, merge/release or next feature is selected.
