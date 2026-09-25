# Current status

**Updated:** 2026-09-25 (R1-B1/B2 correction; replacement evidence pending).
**Integrated application:** Phase 0, corrected Phase 1A-1F and CI-SIMPLE.
**Phase 1F:** accepted and merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Verified integration:** `973e3565d7cf41c6dca936df088ced10969821ac`; its tree exactly matches the reviewed closeout.
**Current checkpoint:** Phase 1G.2a runtime/trust foundation, `in_progress`, R1-B1/B2 corrected locally; replacement native production evidence pending, on `feature/phase-1g-branches-runtime`, draft [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Preserved 1G.1 application candidate:** `fde8cdafd77fe807f2307fb607fc7546ca66ffec`; targeted Linux tests passed, final Windows/macOS evidence deferred. Not merged or finally accepted.
**Preserved 1G.2a production candidate:** `ad2627c4a0347261098f12883419672ecffc6e29`, tree `381829ad05445ef6d0f385b84a1d9eec02e7bff0`. Existing [run 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567), attempt 1, passed Windows x64 and macOS ARM64. Both logs/artifacts, ZIP SHA-256/CRC and all 26 recorded core-input hashes per target were verified. No duplicate run. R1 is **not review-ready**: R1-B1 (cancellable preparation and responsive production control) and R1-B2 (service lifecycle/descendant and history coverage) are detailed in [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger). The subsequent R1-B1/B2 correction adds independent request/control ownership, cancellable inventory, service/descendant/history regressions, and conservative terminal freshness. See the latest ledger entry and HANDOVER for replacement-candidate evidence.
**1G.2a prerequisite candidate:** `c72b4f675605cdf09cf01b4558a5c1bf69f2f852`; [36126490939](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126490939), attempt 1, remains PASS on both targets. Its verified SDK/reload feasibility evidence is preserved separately and was not rerun; it does not close R1.
**Continuation review:** head `f925a3cde28fc3105b861b159ef75d7e1df513a9` reviewed with no blocker to separately selected 1G.2a; independent frontend/validator checks and exact-head GitHub quality passed. Final target acceptance remains deferred; see ledger section 12.
**Planning integration:** [PR #16](https://github.com/Caldwell-41/Renpy-editor/pull/16)
merged at `5266e55f2a93f2e2df5564c87c6738fd0ef3e2d8`; merge tree exactly matches reviewed
head `f8e8e9b7407c0201997aa8dd0e3ecdabc1cde801`. Implementation continues on `feature/phase-1g-branches-runtime`.
**Scope decision:** new Git work is [optional/deferred](../tasks/active/optional-local-git.md),
not a Phase 1/1H or Phase 2-entry requirement. 1G has three checkpoints; editing during
play is script-only, with Stop required before asset mutations. Agent-run
build-phase checks precede one final human 1G session; 1H does not automatically repeat it.
**Planning baseline:** main `f6c269278aa1d8955876ca45bac98a92940e1c5e`; no application changes.
**Historical 1F reviewed head:** `0075d98f80a680588b7eb3f49ab437c71b48a237`.
**Tested production commit:** `88dc6286944d4b96cfb96968f88aa6e87dacc447`.
**Evidence:** [post-merge verification 7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#730-post-merge-production-evidence-closeout),
[final review 7.29](../tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review),
[packages/native F4 7.28](../tasks/archive/2026-09-23-phase-1f-save-correction.md#728-corrected-packages-and-native-f4-evidence).
**Continuation:** [HANDOVER](HANDOVER.md).

Production [35787284261](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35787284261),
attempt 1 (called #90 in the native reports; fresh GitHub metadata labels it #91),
passed Preflight and both supported target jobs. The reviewed head changes documentation
only after that tested commit. Frontend 42, Windows core 147 and macOS core 153 passed;
four ignored subprocess workers per core suite are not extra passing tests. Explicit
SDK/real-service persistence, desktop, packaged smoke, scans, inventories and uploads
passed. F1-F4 are closed. Windows 11 Pro and macOS 27 native F4 A/B/C are user-reported
PASS; the six original native Save passes remain PASS on #87 without repetition.
Native local installer hashes/exact OS builds were not supplied; reports retain their
actual provenance. DIST-MAC-01 remains a later distribution limitation.

**Selected application checkpoint to resume:** [Phase 1G.2a](../tasks/active/phase-1g-branches-runtime-git.md#5-1g2a--runtime-and-trust-foundation), runtime/trust/revision/process foundation,
selected by the user. Hosted target access and successful production execution are established; R1-B1/B2 remain the acceptance boundary. R1 is incomplete. 1G.2b and 1H remain `not_started`; Phase 2 planning
is preserved. No automatic progression. The [1G.1 ledger](../tasks/active/phase-1g-branches-runtime-git.md#12-1g1-execution-ledger)
records exact 1G.1 scope, candidate, targeted results, observed limits and deferred native evidence. Resume 1G.2a from ledger 13; do not advance to 1G.2b.

Main repository quality [35821582664](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582664)
passed. The automatic post-merge production [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755),
run number 92, attempt 1, also passed on the exact merge SHA: Preflight, Windows x64
and macOS ARM64 all succeeded. Its logs and both evidence artifacts were inspected;
ZIP hashes match GitHub metadata and CRC checks pass. No manual dispatch, retry,
replacement installer or physical test is claimed. The post-merge check is closed.
