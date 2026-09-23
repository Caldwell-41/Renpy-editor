# Current status

**Updated:** 2026-09-23.
**Integrated application:** Phase 0, corrected Phase 1A-1F and CI-SIMPLE.
**Phase 1F:** accepted and merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Verified integration:** `973e3565d7cf41c6dca936df088ced10969821ac`; its tree exactly matches the reviewed closeout.
**Current checkpoint:** Phase 1F closed; automatic post-merge production run awaiting terminal review; Phase 1G.1 unstarted.
**Reviewed head:** `0075d98f80a680588b7eb3f49ab437c71b48a237`.
**Tested production commit:** `88dc6286944d4b96cfb96968f88aa6e87dacc447`.
**Evidence:** [final review 7.29](../tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review),
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

**Next eligible application checkpoint:** [Phase 1G.1](../tasks/active/phase-1g-branches-runtime-git.md#4-1g1--shared-flow-projection-and-branches),
shared flow projection and Branches, after explicit user
selection. Every 1G/1H checkpoint remains `not_started`; no implementation branch is
created. Phase 2 planning is preserved. No automatic progression into implementation.

Main repository quality [35821582664](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582664)
passed. The merge automatically started production [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755),
attempt 1, on `973e3565d7cf41c6dca936df088ced10969821ac`: Preflight passed and
Windows/macOS were running at handoff. This is an outstanding post-merge check, not a
claimed pass. No manual dispatch or retry occurred. Inspect this existing run before
starting 1G; preserve any failure and diagnose it without redispatch. Do not poll.
