# Current status

**Updated:** 2026-09-26 (G1-V1/V2 follow-up published; replacement verification pending).
**Integrated application:** Phase 0, corrected Phase 1A-1F and CI-SIMPLE.
**Phase 1F:** accepted and merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Verified integration:** `973e3565d7cf41c6dca936df088ced10969821ac`; its tree exactly matches the reviewed closeout.
**Current checkpoint:** Phase 1G.2b agent verification, `awaiting_ci` (manual resume).

[Run 36209430831](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36209430831),
attempt 1, on `f37635e` **failed** Windows isolated refresh (489.453 ms >250 ms) and
macOS rendered pan/frame p95 (120 ms >100 ms). Both complete logs and ZIPs were
verified, including exact size/SHA-256/CRC. Both core suites passed (Windows 174,
macOS 182, each 7 ignored and two no-archive wrapper skips). macOS isolated core budget
and runtime browser passed. Explicit SDK, packages, five real-service cases and legacy
smoke were skipped; no input manifest/executable exists, **0/94 hashes per target**.

The bounded follow-up uses at most four scoped readers with one shared byte allowance,
unchanged per-open path/identity checks and final rechecks, and exact inherited
cancellation/deadline. Small-file hash buffers retain the 1 MiB maximum chunk.
Compositor-backed graph panning preserves every node/edge and all existing controls.
Budgets/workloads/permissions remain unchanged. Local final results: core **184/0/7**,
frontend **58 passed**, accepted refresh **91.395 ms**, rendered pan/frame p95
**17.7 ms**; Source/runtime/browser/build and repository checks pass. Target proof is
still required. The unchanged Phase 0 Python cleanup finding remains recorded.

Correction candidate `ec6a76adbf78bc09baf7daba067d70eedbc38699`, tree
`d0e749915cc69006821dc2d52506afe666c6a8b4`, is published. Exactly one replacement
[run 36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651),
attempt 1, was dispatched with package upload on that SHA after a no-pending-run check.
At exact-run inspection it and Preflight `108315757962` were in progress; no target
jobs or artifacts existed. All 94 per-target input/executable hashes and final
G1/R1/R2 evidence remain pending. Do not duplicate verification or poll repeatedly.
Preserve all earlier failures and R1 closure under their actual inputs.
See [ledger 14](../tasks/active/phase-1g-branches-runtime-git.md#failed-replacement-review-and-bounded-g1-continuation--2026-09-26)
and [HANDOVER](HANDOVER.md). Continue on `feature/phase-1g-branches-runtime`,
draft [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Physical testing, acceptance, merge, optional Git and Phase 2 remain excluded.
**Preserved R1 closure:** candidate `c12d953548992adc60b38682d0dcfda8cdeb9f94`, tree
`3f8f6e769672572b008b2ffb4f283888afecfc31`, native run `36148942247`, attempt 1,
passed both targets with complete logs, artifacts and all 60 input hashes verified.
R1-B1/B2 remain closed on those inputs; final-source regression is part of 1G.2b.
**Preserved 1G.1 application candidate:** `fde8cdafd77fe807f2307fb607fc7546ca66ffec`; targeted Linux tests passed, final Windows/macOS evidence deferred. Not merged or finally accepted.
**Preserved earlier R1-B1/B2 correction candidate:** `07f23b61d46511848d2b09db57ba1d5a696cabe0`, tree `614931107db78f61c5b864a099ca2737ab546bd8`. Replacement [run 36144974132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144974132), attempt 1, passed Windows x64 and macOS ARM64. Complete logs, both ZIP hashes/CRC/size and all 60 input hashes per target were verified. Runtime core: Windows 17/macOS 18 passed, each 2 ignored; explicit SDK 1, frontend 49, Source browser/build and desktop 1 passed per target. Superseded correction run `36144599144` also succeeded on its actual candidate. Final-source quality `36144979086` and docs quality `36145345911` passed. See the [closeout assessment](../tasks/active/phase-1g-branches-runtime-git.md#replacement-native-evidence-and-r1-b1b2-closeout--2026-09-26). No outstanding native operation; no duplicate run.
**Preserved 1G.2a production candidate:** `ad2627c4a0347261098f12883419672ecffc6e29`, tree `381829ad05445ef6d0f385b84a1d9eec02e7bff0`. Existing [run 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567), attempt 1, passed Windows x64 and macOS ARM64. Both logs/artifacts, ZIP SHA-256/CRC and all 26 recorded core-input hashes per target were verified. No duplicate run. That earlier review found R1-B1 (cancellable preparation and responsive production control) and R1-B2 (service lifecycle/descendant and history coverage) as documented in [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger). The subsequent R1-B1/B2 correction adds independent request/control ownership, cancellable inventory, service/descendant/history regressions, and conservative terminal freshness. See the latest ledger entry and HANDOVER for replacement-candidate evidence.
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

**Checkpoint handoff:** 1G.2b G1-V1 is corrected locally; final target verification remains incomplete.
No final G1/R1/R2 or acceptance pass is claimed; 1G is not merged.
No physical testing is requested.
1H remains separately selected and Phase 2/optional Git remain outside this checkpoint.
Preserve the earlier 1G.1 and R1 evidence under their actual candidates.

Main repository quality [35821582664](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582664)
passed. The automatic post-merge production [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755),
run number 92, attempt 1, also passed on the exact merge SHA: Preflight, Windows x64
and macOS ARM64 all succeeded. Its logs and both evidence artifacts were inspected;
ZIP hashes match GitHub metadata and CRC checks pass. No manual dispatch, retry,
replacement installer or physical test is claimed. The post-merge check is closed.
