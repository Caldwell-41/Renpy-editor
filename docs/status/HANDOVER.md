# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [Build #87 replacement-package verification](../tasks/active/phase-1f-save-correction.md#719-build-87-replacement-package-verification).
**State:** `review_ready` for Phase 1F closeout; all six native P3 rows are user-reported PASS on Windows x64 and macOS ARM64. Mac required a local launch workaround.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Validated application candidate:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
**Verified run:** [#87, 35719829561](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561), attempt 1, `upload_packages=true`, terminal success.
**Entry head:** `14f1b4cbdc67c371f58c3e1e55a2804e4f95ede0` (documentation only after the application candidate).

## Completed verification

Run #87 (`35719829561`), attempt 1, passed on exact application candidate
`0b9ea0f0c23f843b3324cd63a524a642a2399f2e`. Preflight `106719866991`,
Windows x64 `106720077739` and macOS ARM64 `106720077724` all succeeded.
All three new Scene JSON regressions passed on both targets, including real IPC
starting-narration edit, Beat insert, refusal without writes, and fresh-service reopen.
Core totals: Windows 144 passed / 0 failed / 4 ignored; macOS 150 passed / 0 failed /
4 ignored. The four ignored cases are subprocess crash workers, not omitted acceptance
tests. Explicit SDK lifecycle/Scene/Source and network-handoff gates also passed;
the download-on-cache-miss step alone was skipped after SDK cache hits.

Desktop boundary tests, packaging, packaged smoke, secret scans, dependency inventories
and both package uploads passed. Downloaded evidence archives contain exactly one
accepted final report each, all reported boolean assertions true, complete command
traces, and all five checkpoints. Final-report-start: Windows 2,369 ms; macOS 3,011 ms.
Both inventories contain 85 npm / 519 Cargo entries. Evidence artifacts: Windows
`10691213999`, macOS `10691700431`.

Both package ZIPs and both evidence ZIPs were downloaded; their byte lengths and
SHA-256 matched GitHub artifact metadata, and all ZIP CRC checks passed. This verifies
archive integrity and CI provenance; native P3 acceptance is recorded separately below.

The Scene fix aligns Rust enum fields with renderer camelCase JSON. Its two production
annotations and three regressions are described in ledger section 7.18 and docs/TESTING.md.
#85 packages contain the reported defect; #86 failed formatting. Preserve their history
and use only #87 as the valid replacement-package lineage. Package IDs, exact filenames,
hashes and expiry are recorded in ledger section 7.19 and linked from the checklist.

## Native P3 result and next action

The user confirms that all three native P3 tests passed on both supported targets:

- Windows x64: P3-A dirty Source Ctrl+S PASS; P3-B clean Source Ctrl+S ordinary
  Flush PASS; P3-C non-Source Ctrl+S isolation PASS.
- macOS ARM64: P3-A dirty Source Cmd+S PASS; P3-B clean Source Cmd+S ordinary
  Flush PASS; P3-C non-Source Cmd+S isolation PASS.

This closes the six-row native P3 outcome requirement for Phase 1F by user report.
The prior Windows physical-Save and Beat-fix report is retained. On macOS, the user
reported running `xattr -cr /Applications/Loomlight.app` before the Mac tests passed.
That local workaround does not establish repaired signing, notarisation or normal
first launch of the downloaded app; preserve the macOS distribution limitation.

Exact OS versions and the locally installed artifact/installer identity were not
separately supplied. Record those as evidence-metadata limitations, not as untested P3
rows, and do not invent them. The next bounded action is Phase 1F closeout review and
main/PR reconciliation. PR #14 is still draft and current-main integration remains a
separate decision. No rebuild, redispatch, merge or Phase 1G is authorised by this
handover update.
