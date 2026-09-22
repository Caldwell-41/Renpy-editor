# Current status

**Updated:** 2026-09-22.
**Integrated application:** Phase 0 and corrected Phase 1A–1E; CI-SIMPLE PR #13.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`, including planning PR #15.
**Active milestone:** [Phase 1F](../tasks/active/phase-1f-source-synchronisation.md), **not accepted / unmerged**.
**Selected checkpoint:** independent closeout review completed with blocking findings;
[correction ledger section 7.22](../tasks/active/phase-1f-save-correction.md#722-independent-closeout-review).
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Tested application:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`, production #87 / `35719829561`, attempt 1, passed.
**Continuation:** [HANDOVER](HANDOVER.md).

Apply Both can accept an unreviewed combination; Preview insertion loses the playhead
anchor; Background leaves obsolete Characters visible. Three retained expected-behaviour
probes fail. Existing 32 frontend tests/typecheck/build pass; their coverage does not
resolve the findings. This review changes no application behaviour and dispatches no matrix.

All six native P3 cases are user-reported PASS per entry HANDOVER `2247902`.
Exact installed #87 identity and OS versions remain unconfirmed; no observations or
metadata have been invented. The user's Mac passed after `xattr -cr /Applications/Loomlight.app`.
Signing/notarisation and normal download-launch remain DIST-MAC-01 before wider
release, explicitly outside Phase 1 scope.

Next: select **1F-CLOSEOUT-CORRECTION** for the three findings and validation on the
same branch/PR. Keep 1F records active and branches retained until acceptance and safe
integration. [1G planning](../tasks/active/phase-1g-branches-runtime-git.md) and
[1H planning](../tasks/active/phase-1h-vertical-slice-acceptance.md) are integrated,
but implementation is unstarted. 1G.1/G1 becomes eligible only after 1F is accepted
and integrated, and the user selects it. No pending production run to poll.
