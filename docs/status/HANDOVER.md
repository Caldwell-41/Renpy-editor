# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Native P3 package delivery and [manual checklist](../tasks/active/phase-1f-native-p3-checklist.md).
**State:** `awaiting_ci`; native P3 remains untested. No merge or Phase 1G.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Reviewed application candidate:** `85e44e926399ae7ad8431c948e1751db04dcde35`.
**Package build ref:** `6d1ab428b2e3cd052323a8890c27897fb906b937`.
The difference is four documentation files only; application/dependencies/workflow
are unchanged. No unrelated working copy was modified.

## Authority and prior acceptance

After independent review, the user explicitly requested Windows/macOS builds,
publication on the repository and a detailed testing checklist. That authorises one
package-producing run with uploads enabled, superseding the old no-redispatch boundary
for this purpose. Do not change application code, merge, begin Phase 1G or build new
native automation. The existing workflow retains its full production gates.

Production #84 (`35708223679`), attempt 1, passed the exact application candidate on
Windows x64/macOS ARM64, including accepted final reports, real-service persistence,
secret scans and inventories. Repository Quality `35707727479` passed. P1/P2/P4/P5
are satisfied; synthetic shortcuts do not satisfy native P3. See
[1F-SAVE section 7.16](../tasks/active/phase-1f-save-correction.md#716-final-report-lexical-scope-correction)
for retained exact evidence. #84 uploaded evidence only, not installable packages.

## Installer delivery operation

[Production 35711244992 (#85)](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35711244992),
attempt 1, was dispatched once with `upload_packages=true`. The run page confirmed
`6d1ab428b2e3cd052323a8890c27897fb906b937`; Preflight job `106692103651` started.
No equivalent run was active at dispatch. Do not redispatch or automatically retry.

Expected package artifacts: `phase-1-production-package-windows-2025` and
`phase-1-production-package-macos-26`. Upload happens after target gates, but is
`continue-on-error`; successful jobs alone do not prove the installers were uploaded.
Verify artifact existence, SHA/run mapping, contents and seven-day expiry. Evidence
archives are not installers. Build completion/package delivery is not yet claimed.

## Next bounded action

Inspect the existing #85 terminal jobs and package artifacts, then publish download
links and the completed delivery record. If still running, preserve this exact
run/attempt/ref handover and stop model polling under AGENTS/WORKFLOW; there is no
qualified automatic same-thread continuation here. On failure record the exact
stage/error and stop; no blind retry. The existing #84 pass is not a #85 pass.

Then the user performs [the checklist](../tasks/active/phase-1f-native-p3-checklist.md)
on both packaged targets: dirty Source accepts, clean Source ordinarily Flushes, and
non-Source Flush preserves a pending Source draft. Record real Ctrl+S/Cmd+S input,
OS/architecture, package identity and observed outcomes. All six rows remain untested;
unclear native delivery must not be marked passed. Return results for review.

The checklist and current-state corrections are documentation-only. PR #14 remains
draft; reconciliation with updated main is a later integration action, not part of
installer delivery. Publication/validation results belong in the active ledger.
