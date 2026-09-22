# Current status

**Updated:** 2026-09-22.
**Integrated application:** Phase 0 and corrected Phase 1A–1E; CI-SIMPLE PR #13.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`, including planning PR #15.
**Active milestone:** [Phase 1F](../tasks/active/phase-1f-source-synchronisation.md), **not accepted / unmerged**.
**Selected checkpoint:** **1F-CLOSEOUT-CORRECTION**, **review_ready**; stop for independent review.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Tested candidate:** `f452d0a8c1599b05650ae2e835d14d9f86f14653`.
**Evidence:** [correction ledger sections 7.23–7.24](../tasks/active/phase-1f-save-correction.md#724-build-88-corrected-candidate-verification).
**Continuation:** [HANDOVER](HANDOVER.md).

Apply Both binds confirmation to the displayed draft/base/external revision and
combined text; stale reviews refuse. Preview retains the selected insertion anchor.
Background clears visible Characters and their default-layer uncertainty. The retained
probes and promoted regressions pass, including real JSON/core persistence and races.

[Production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675),
attempt 1, passed on the exact corrected candidate: Preflight `106762105167`, Windows
`106762349561`, macOS `106762349306`. Core totals: Windows 147 / macOS 153 passed,
0 failed, 4 ignored subprocess workers each. Explicit SDK, desktop, packaging/smoke,
scans/inventories and uploads passed. Both packages and both evidence archives were
downloaded and verified against GitHub size/hash metadata, with valid ZIP contents.
No redispatch; no pending production run remains to poll. #87 stays historical evidence.

All six native P3 Save cases remain user-reported PASS on build #87. User confirmed
macOS 26.6.2 and Windows “the latest windows version”; numeric Windows build remains
unspecified. No native #88/F1–F3 observation is claimed. Independent review determines
whether focused changed-behavior native evidence is needed. The local legacy Python
SDK subprocess-permission error remains a recorded limitation. DIST-MAC-01 signing/
notarisation/normal download-launch remains outside Phase 1 scope.

No merge, branch deletion or Phase 1G implementation is authorised. Keep PR #14 draft
and the 1F records active pending independent review. Existing 1G/1H planning is already
integrated; do not duplicate it.
