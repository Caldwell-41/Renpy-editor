# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a R1-B1/B2 correction — `awaiting_ci`; R1 incomplete, not accepted.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Final application candidate:** `07f23b61d46511848d2b09db57ba1d5a696cabe0`.
**Candidate tree:** `614931107db78f61c5b864a099ca2737ab546bd8`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Exact native operations to resume

| Run / attempt | Candidate | Observed state and use |
| --- | --- | --- |
| [36144974132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144974132) / 1 | `07f23b61d46511848d2b09db57ba1d5a696cabe0` | Pending at identity inspection; final replacement R1 evidence required |
| [36144599144](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144599144) / 1 | `fd4ffca38373790f730818bbf9e6c8a388dac92f` | In progress at inspection; superseded by a completed-receipt cancellation race fix; preserve actual eventual outcome |

Both are push-triggered runs on different application inputs, not duplicate dispatches.
The later run waits for the earlier branch concurrency owner. No target pass is claimed.
Expected final artifacts: `runtime-foundation-windows-2025`,
`runtime-foundation-macos-26`, seven-day retention. Inspect complete step outcomes/logs,
actual test counts, ZIP SHA-256/CRC/size and all expanded input hashes against the exact
candidate. Failed, skipped or missing evidence is not a pass.

## What changed and what passed locally

`ApplicationHost` separates exclusive service checkout from token-bound Stop/status/
revoke and cancellable long-work receipts. Source releases its lease on receipt;
drafts remain retained. Dialog completion validates the captured session. Cancellation
reaches inventory/hash and supervisor startup with an atomic cancellation/spawn boundary.
Terminal cleanup no longer hashes the filesystem; results stay conservatively stale
until full new preparation. Unix checks group disappearance independently of pipes.
Failed cleanup retains its owner/reservation across repeated shutdown.

Production dispatch tests cover held prepare/grant/start inventories, zero spawn
attempts, stale receipts, competing authoring work, completed-receipt cancellation and
stale dialog completion. Real service switch/Cancel/Stop/shutdown/Drop tests include
child descendants with inherited and closed output handles, PID liveness, starting/
validation cancellation and injected cleanup-confirmation failure. Real Scene history
and move/delete cases prove refusal/no-write and Stop/retry. See
[ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#final-correction-publication-and-native-manual-resume-handover--2026-09-26)
and [ADR 0008](../adr/0008-controlled-runtime.md).

Final `07f23b6`: release runtime 18 passed/2 ignored, format/whitespace and repository
validation (244 files) passed. Exact-candidate repository quality `36144979086` passed.
Initial correction `fd4ffca`: full core 178 passed/6 ignored, explicit official SDK
1 passed/0 ignored (117.37 s), frontend 49/0 skipped, Source browser/build and desktop
1 passed. The final receipt correction changes two core files; those earlier broad
passes are not relabelled exact-final-source evidence. The final native run supplies it.

## Preserved evidence, ownership and next boundary

Historical production `36136466567` attempt 1 remains PASS on `ad2627c`; prerequisite
`36126490939` remains PASS for SDK/reload feasibility. Already inspected hashes/results
remain in ledger 13. Neither was rerun. Failed/superseded `36135942863` remains FAILED
with its skipped gates. The new superseded run above does not erase any earlier result.

The isolated continuation checkout preserves older worktrees/evidence branches. Visible
prior Renpy tasks were idle; cross-host ownership is not independently observable.
All updates use fresh non-forced ancestry checks. Keep PR #17 draft/open.

**Manual resume required by AGENTS/WORKFLOW:** no qualified automatic same-thread
continuation exists. Stop active polling. Resume only the exact runs above, assess
final R1-B1/B2 evidence and resolve bounded findings, then publish/verify the assessment
and handover. Do not dispatch duplicates or request user physical testing. No merge,
1G.2b, optional Git or Phase 2. This docs-only follow-up triggers no runtime rerun.
