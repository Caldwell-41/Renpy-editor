# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [Scene JSON contract correction](../tasks/active/phase-1f-save-correction.md#718-scene-json-contract-correction).
**State:** `awaiting_ci`; manual resume required, corrected target evidence/packages pending.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Corrected application candidate:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
**Active package run:** [#87, 35719829561](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561), attempt 1, `upload_packages=true`; confirmed on this exact SHA.
**Failed package run:** [#86, 35719196417](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719196417), attempt 1, `upload_packages=true`.
**Entry head:** `616667ce9b1d13928c7acf57d0c86cd685363946`.
**Previous package ref:** `6d1ab428b2e3cd052323a8890c27897fb906b937` (#85; contains the reported defect).

## User report and bounded action

The user cannot commit edits to the initial narration or add any Beat: the app reports
`The Scene operation is invalid.` This selects a bounded defect correction and
replacement installers under the existing package request. Do not merge, begin 1G,
redesign Source Save or change the transaction/recovery architecture.

The renderer uses camelCase Scene command and Beat fields. Rust enum `rename_all`
renames variants only, leaving their fields snake_case. `scene.apply` rejects the
renderer request during deserialization and returns the exact reported error. Beat
responses also use the wrong field names for character/asset/variable references.

## Correction and validation

Production change: add `rename_all_fields = "camelCase"` to `SceneCommand` and
`BeatPayload`. No other runtime behavior is intentionally changed. New tests cover
17 command shapes, 16 Beat round trips, and a real IPC starting-narration edit/Beat
insert with disk, stale/malformed refusal, and fresh-service reopen assertions.

The old packaged UI smoke fakes the requester; the real Scene helper passes typed
Rust commands. Neither crossed the missing JSON boundary. The new real-IPC regression
runs in the existing core suite on both targets. No workflow/dependency change.

Local `python3 scripts/validate.py` (217 files) and `git diff --check` pass. Static
review confirms two production attribute changes plus tests. Rust is unavailable in
this client, and fetching the official distribution timed out. No local compiled
red/green or Rust-format pass is claimed. The target workflow must validate this
candidate before installers are considered ready; do not transfer #85's pass.

## Existing package run

#85 (`35711244992`), attempt 1, passed Preflight `106692103651`, Windows
`106692343143` and macOS `106692343146` on exact ref `6d1ab428`.
Windows installer artifact `10687188438` and macOS `10686289367` both exist and
expire 2026-09-29. These installers are blocked by the reported defect. Preserve the
run as historical evidence and do not ask the user to repeat P3 on these builds.

## Next bounded action

Run #86 failed Rust formatting in Preflight `106717842885`; both target builds were
skipped. The log requires only expanding two Serde attributes and one new test method
chain. Those exact formatting changes are published without semantic changes.
Run #87 was dispatched once after confirming #86 terminal and no equivalent active
run. Inspect existing #87 on manual resume; do not redispatch or rerun #86 inputs.

Verify the new core regression, packaging, smoke, scans, inventories and actual uploads.
A successful job does not prove upload because that step is continue-on-error.
The exact run/attempt/SHA is recorded above. Preflight passed and both target jobs were running at handoff; model polling
stops under AGENTS/WORKFLOW. No qualified automatic continuation exists here.
No corrected Rust pass or replacement package availability is claimed.
No automatic retry or merge.

Native P3 remains blocked/untested until valid replacement packages are available and
the user completes [the checklist](../tasks/active/phase-1f-native-p3-checklist.md).
The checklist requires starting-narration edit and new-Beat commit before native
shortcut tests. Record OS/package identity with the next result; the report did not
specify it. Keep PR #14 draft; no Phase 1G or main reconciliation in this checkpoint.
