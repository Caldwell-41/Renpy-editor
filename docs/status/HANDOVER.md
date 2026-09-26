# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b agent verification, **in_progress**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Resumed entry:** `5b0b443c30c1eb3bf36b9897eb6cab78839a2d79`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
This correction commit contains the reviewed G1-V1 implementation and local evidence;
its exact published candidate will be recorded with the replacement run.

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

## Preserved assessment and next action

Failed run [36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820),
attempt 1, on `931684d` remains FAIL with both capability-assertion failures and budget
overruns. No final package/input hashes existed. R2-C1 was corrected in `6c7efad`;
that revision also enforced the unchanged isolated budget gate. Preserve earlier R1
closure on `c12d953`, run `36148942247`, attempt 1, under its actual inputs.

Publish this material correction, recheck no pending verification, and dispatch exactly
one replacement `production-scaffold.yml` with `upload_packages=true` on the published
candidate. Do not dispatch R1-only, retry ambiguously, or duplicate pending verification.
Record exact run/attempt/SHA and stop with a manual-resume handover if still pending.
On completion, verify full logs, artifact size/SHA-256/CRC, every manifest input against
Git blob bytes, candidate/tree/target/executable, all five runtime UI JSON/log pairs,
explicit SDK markers, isolated/rendered budgets, focus/resize and legacy smoke. Publish
the G1/R1/R2 assessment and handover; no physical testing, acceptance or merge.
