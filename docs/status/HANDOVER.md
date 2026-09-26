# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b agent verification, **awaiting_ci / manual resume**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Resumed entry:** `5b0b443c30c1eb3bf36b9897eb6cab78839a2d79`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
**Published correction candidate:** `f37635e0d2acce61022f9bf4e21c923499fcf786`.
**Candidate tree:** `5590e513e8163a9b0db7267ac67a85e61a700f39`.
This follow-up changes assessment/status/handover only; it is not another test candidate.

## Authority and correction

The user selected only 1G.2b agent verification: profile/correct G1-V1 under unchanged
budgets and safety, publish after applicable local gates, then launch one justified
replacement production run. Read [ledger 14](../tasks/active/phase-1g-branches-runtime-git.md#g1-v1-profiling-and-bounded-correction--2026-09-26)
and [TESTING](../TESTING.md#phase-1g-testing-ownership-and-cadence).
Stop before physical testing, acceptance, merge, optional Git or Phase 2.

Profiling attributes about 817 of 839 ms to file acquisition and final rechecks.
A core-private observation reader reuses only one parent directory handle chain per
call. It revalidates registration/root/parent on every read, rejects links/reparse
points, checks lengths/identities around bounded reads, and retains all final source,
metadata and inventory checks. No persistent content/revision cache or privilege change.

Final local release fixture: **180.470 ms initial / 181.026 ms accepted update**, within
unchanged 2 s / 250 ms limits, 500 Scenes / 2,000 edges. Required marker present.
Core **182 passed / 0 failed / 7 ignored** includes two no-archive wrapper skips;
explicit SDK gates remain target work. Frontend **58**, Source browser/build, graph
and runtime browser checks, 26 Source spike tests, formatting and repository checks
pass. Supplemental unchanged Python SDK spike: **23 passed / 1 error** from a repeated
SIGKILL/EPERM cleanup race; preserved in the ledger, not an SDK pass or scope expansion.
G1-V1 is corrected locally; supported-target proof remains required.

## Exact pending run and available assessment

[Replacement production run 36209430831](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36209430831),
**attempt 1**, was manually dispatched exactly once with `upload_packages=true`,
created **2026-09-26T01:44:25Z** on the exact candidate above. Fresh checks before
dispatch found no pending production/R1 run. Dispatch returned the URL; the exact-run
endpoint verified SHA/attempt after the list endpoint initially lagged. No retry.

At the bounded inspection: **queued**, conclusion null; Preflight job
**`108312714429` queued**; no target jobs, complete logs or artifacts. Artifact count
is **0**. Candidate has **94** application/workflow inputs, but **0/94 per-target
input hashes** and no ZIP/package/executable hashes can be verified yet. Do not
substitute local hashes, checkout identity or earlier artifacts for target evidence.

**G1:** corrected local budget and safety/rendered evidence; final target proof pending.
**R1:** local ordinary core/process pass with SDK skips; final-source target regression pending.
**R2:** local frontend/browser evidence; all final packaged cases and SDK evidence pending.
No final capability pass, physical test, acceptance or merge is claimed.

Failed run [36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820),
attempt 1, on `931684d` remains FAIL with both capability-assertion failures and budget
overruns. No final package/input hashes existed. R2-C1 was corrected in `6c7efad`;
that revision also enforced the unchanged isolated budget gate. Preserve earlier R1
closure on `c12d953`, run `36148942247`, attempt 1, under its actual inputs.

## Next bounded action

Continue **1G.2b agent verification of existing run `36209430831`, attempt 1 only**.
Do not duplicate pending verification, dispatch R1-only or retry. If still pending,
record the unchanged identity and stop. No watcher or automatic continuation is
configured; no local verification remains running. Follow the repository's manual-
resume policy, not repeated model polling.

When complete, verify both full job logs, artifact size/SHA-256/CRC, all **94** recorded
input hashes against exact candidate Git blob bytes, candidate/tree/target/executable,
all five runtime UI JSON/log pairs (PASS, no timeout, exit 0, confirmed cleanup),
explicit SDK markers, isolated/rendered G1 budgets, focus/resize and legacy smoke
independently. Publish the G1/R1/R2 assessment, ledger and this handover. Missing,
failed or skipped evidence remains open; a green workflow alone is insufficient.
Stop before physical testing, acceptance, merge, optional Git or Phase 2. A target
failure needs a bounded finding; no wider cache redesign or budget change is authorised.
