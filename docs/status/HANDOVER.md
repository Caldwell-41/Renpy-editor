# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a runtime/trust foundation — `awaiting_ci`; R1 BLOCKED.
Production foundation implemented; not review-ready, accepted or merged.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Corrected candidate:** `ad2627c4a0347261098f12883419672ecffc6e29`.
**Verified tree:** `381829ad05445ef6d0f385b84a1d9eec02e7bff0`.
**Main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Delivered and reviewed

The in-flight user update was reconciled against current local work and fresh remote
refs, without restarting. Local evidence commits/branches, older work, PR #12, accepted
1F safeguards and 1G.1 work were preserved. No merge, 1G.2b, optional Git, Phase 2 or
user physical testing occurred.

Implemented typed preparation/trust/control IPC, project/SDK identity/hash inventories,
existing Source Save All/renderer lease reuse, explicit controlled-play policy installation,
serialized asset/file/history barriers, independent process supervision and desktop exit
cleanup. Script editing/saving continues after SDK readiness; Stop/Run deliberately loads
saved edits. See [ADR 0008](../adr/0008-controlled-runtime.md) and
[ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger)
for contracts, bounded findings/fixes and exact tests. Broad runtime UI remains 1G.2b.

## Proven evidence and preserved failure

Prerequisite [36126490939](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126490939),
attempt 1, passed Windows/macOS. Both artifacts were CRC/hash checked and inspected.
That workflow remains unchanged and was not rerun. Its SDK-only proof is not R1.

Local application evidence: 173 core tests passed (6 ignored entry points), 48 frontend
tests passed, Source Save/selection browser regressions passed, and the explicitly invoked
verified SDK production-service gate passed (1 test, 0 ignored, 46.57 s). It covers literal
requests, saved/Save All/cancel, trust/SDK changes, long play, Save without reload, asset
refusal/retry, Stop/Run latest, revoke/reopen and compile/lint. Actual local child tests cover
natural exit/crash, descendants retaining pipes, output flood, Stop, timeout and shutdown.
These are Linux results, not native acceptance. Native keyboard/packaged runtime UI are
not claimed. Initial browser/tooling failures and their actual scope are retained in the ledger.

First production candidate `5513213`, run
[36135942863](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36135942863), attempt 1,
FAILED both native core jobs. Windows: 8 passed/4 failed/2 ignored; macOS: 9/4/2. Logs confirm
all four failures at uncanonicalized temporary-root registration, before process tests.
Native frontend/Source browser gates passed; desktop/SDK gates were skipped. The fixture
roots and short startup allowance are corrected in `ad2627c`; application code is unchanged.
The portable local Rust dependency directory disappeared after the in-flight continuation,
so no local rerun of this fixture correction is claimed. Its native build/test gate is pending.
Repository/whitespace checks pass (241 files). Exact-candidate quality `36136473094` passed.

## Outstanding operation and next bounded action

Separate production R1 [run 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567),
**attempt 1**, runs the exact corrected candidate above. At entry inspection:
Windows job `108075623934` and macOS job `108075624153` were in progress.
Expected seven-day artifacts: `runtime-foundation-windows-2025` and
`runtime-foundation-macos-26`. The workflow runs production service/native child tests,
frontend/browser and desktop boundary checks, with no package matrix.

Inspect that existing run's outcomes/logs and verify artifact ZIP hashes/CRC and input-hash
reports. Resolve only bounded 1G.2a findings, complete R1 evidence review, publish the ledger
and this handover, then stop. Missing/failed/skipped evidence stays blocked; do not infer
an R1 pass from feasibility or frontend success. Do not duplicate this run.

`AGENTS.md` and `WORKFLOW.md` require manual resume instead of repeated model polling while
CI is outstanding; no qualified event continuation is configured here. This is the stopping
boundary. Restore a portable toolchain only if additional local Rust work is needed.
Continue the same branch/PR. Do not merge or begin 1G.2b, optional Git or Phase 2, and do not
request user physical testing. Candidate publication was verified tree-for-tree; this final
documentation-only update does not trigger another production runtime run.
