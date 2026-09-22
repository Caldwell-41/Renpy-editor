# Current status

**Updated:** 2026-09-22.
**Integrated application:** Phase 0 and corrected Phase 1A–1E; CI-SIMPLE PR #13.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`, including planning PR #15.
**Active milestone:** [Phase 1F](../tasks/active/phase-1f-source-synchronisation.md), **not accepted / unmerged**.
**Selected checkpoint:** **1F-CLOSEOUT-CORRECTION**, F1–F3 implemented; **awaiting_ci / manual resume**;
[correction ledger section 7.23](../tasks/active/phase-1f-save-correction.md#723-1f-closeout-correction).
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Continuation:** [HANDOVER](HANDOVER.md).

Apply Both now binds confirmation to the displayed draft/base/external revision and
combined text; stale reviews refuse. Preview retains the selected insertion anchor.
Background clears visible Characters and their default-layer uncertainty. The three
retained probes and their promoted regressions pass. Local frontend: 38 pass; core:
153 pass / 4 ignored workers. Full validation and local limitations are in the ledger.
Corrected candidate `f452d0a8c1599b05650ae2e835d14d9f86f14653` is published.
[Production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675),
attempt 1, was dispatched once with packages enabled and verified in progress
(Preflight `106762105167`). Supported-target validation and independent review remain
required; no corrected-target pass or package availability is claimed.
Production #87 validates the previous application only.

All six native P3 Save cases remain user-reported PASS. The user now confirms both
installations were #87, macOS 26.6.2 and Windows “the latest windows version”; numeric
Windows build remains unspecified. Mac passed after the user's local launch workaround.
DIST-MAC-01 signing/notarisation/normal download-launch remains outside Phase 1 scope.

No merge, branch deletion or Phase 1G implementation is authorised in this checkpoint.
1G/1H planning already exists on main; do not duplicate it. Keep the 1F records active
and stop for independent review after corrected-candidate validation.
