# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [Build #87 replacement-package verification](../tasks/active/phase-1f-save-correction.md#719-build-87-replacement-package-verification).
**State:** `review_ready` for the Scene correction and replacement packages; Windows and macOS manual testing reported passing (row detail pending); Mac required a local launch workaround.
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
archive integrity and CI provenance, not native installation or manual P3 acceptance.

The Scene fix aligns Rust enum fields with renderer camelCase JSON. Its two production
annotations and three regressions are described in ledger section 7.18 and docs/TESTING.md.
#85 packages contain the reported defect; #86 failed formatting. Preserve their history,
but use only #87 for the next manual tests. Package IDs, exact filenames, hashes and
expiry are recorded in ledger section 7.19 and linked from the checklist.

## Latest manual testing and next action

The user subsequently reports: `I used command xattr -cr /Applications/Loomlight.app`
and `Mac OS passed`. Record macOS manual testing as user-reported PASS after that local
workaround; the previous launch block no longer prevents this user's test. Windows
physical Save and the Beat fix were also reported passing. The command was run by the
user, not this agent. This is not evidence of a repaired signature, notarisation, or a
normal first launch of the downloaded app. Preserve the macOS distribution limitation.

These reports follow the #87 test handoff. Exact OS versions, installed artifact identity
and separate P3-A/B/C observations remain absent; do not fabricate detailed acceptance
records or silently mark the formal six-row checklist complete. Next action is to review
available manual evidence and the independent code review before Phase 1F closeout.
No application edits, rebuild, redispatch, merge or Phase 1G are authorised by this report.
