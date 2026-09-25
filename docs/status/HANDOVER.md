# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a runtime/trust foundation — production candidate implemented;
R1 BLOCKED pending supported-target evidence. Not accepted or merged.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Entry head:** `8ab3063d283423dcda1135630315645c1320b959`.
**Main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Delivered and reviewed

The user selected 1G.2a only. Fresh refs/ownership were inspected; older local work,
PR #12, accepted 1F safeguards and 1G.1 work were preserved. No merge, 1G.2b, optional
Git, Phase 2 or user physical testing occurred.

Implemented typed runtime preparation/trust/control IPC, comprehensive bounded
project/SDK inventories, existing Source Save All/renderer preparation lease reuse,
explicit controlled-play policy installation, serialized core asset/lifecycle barriers,
independent bounded process supervision and desktop exit cleanup. Script editing/saving
continues after SDK readiness. Stop/Run deliberately loads saved edits. See
[ADR 0008](../adr/0008-controlled-runtime.md) and
[ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger)
for exact contracts, bounded review findings/fixes, tests and limits. Broad runtime UI
remains 1G.2b, not silently included in this checkpoint.

## Evidence and target boundary

Existing prerequisite [run 36126490939](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126490939),
attempt 1, candidate `c72b4f675605cdf09cf01b4558a5c1bf69f2f852`, passed Windows/macOS.
Both artifacts were downloaded, CRC/hash checked and inspected. It was not duplicated.
That SDK-only probe is not production R1 evidence.

Local production tests pass: literal service/SDK gate (including long play, saved edit,
reload suppression, asset refusal/retry, Stop/Run, trust changes and compile/lint), actual
child-tree/pipe cleanup tests, full core regression, 48 frontend tests and Source browser
regressions. Exact counts, initial browser failures and recovered actual test results
are in ledger 13. Linux is not substituted for Windows/macOS. Native keyboard and
packaged runtime UI are not claimed.

A separate `runtime-foundation-r1.yml` targeted workflow exercises production services and native child processes plus
frontend/desktop boundary checks; it does not run a package matrix. Candidate/run identity
will be recorded with verified publication. Failed, missing or skipped evidence stays
blocked. No automatic event continuation is configured on this host.

## Next bounded action

Inspect the exact published production run/attempt and its outcome/input-hash reports;
do not duplicate it. Resolve only bounded 1G.2a findings, complete R1 evidence review,
publish the checkpoint ledger/handover, then stop. `AGENTS.md` and `WORKFLOW.md` require
a manual-resume handover while CI is outstanding rather than repeated model polling.
Do not merge or begin 1G.2b, optional Git or Phase 2, and do not request physical testing.
