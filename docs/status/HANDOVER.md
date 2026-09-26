# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b agent verification, **in_progress**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Resumed entry:** `9fc24502a7ec22006c5a486c2d98b46c5b979a5f`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
This correction commit contains the reviewed G1-V1/V2 follow-up and local evidence;
its published candidate will be recorded with the one replacement run.

## Authority and failed-run assessment

The user reported the failed run and authorised review/fix plus another handover.
Continue only 1G.2b agent verification under unchanged budgets and safety. Read
[the latest ledger assessment](../tasks/active/phase-1g-branches-runtime-git.md#failed-replacement-review-and-bounded-g1-continuation--2026-09-26)
and [TESTING](../TESTING.md#phase-1g-testing-ownership-and-cadence).
Stop before physical testing, acceptance, merge, optional Git or Phase 2.

Run [36209430831](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36209430831),
**attempt 1**, on `f37635e0d2acce61022f9bf4e21c923499fcf786`, tree
`5590e513e8163a9b0db7267ac67a85e61a700f39`, completed **FAIL**. Preflight passed;
Windows job `108312932935` failed isolated refresh **489.453 ms >250 ms**; macOS job
`108312932845` passed isolated refresh **154.944 ms**, then failed rendered pan/frame
p95 **120 ms >100 ms**. Both full logs and evidence ZIPs were verified against exact
size/SHA-256/CRC; details/digests remain in the ledger.

Both full core suites passed (Windows 174/macOS 182, each 7 ignored and two no-archive
wrapper skips), including the corrected capability assertion. macOS runtime browser
passed. Explicit SDK, packages, all five real-service UI cases and legacy smoke were
skipped; there is no manifest/executable, so **0/94 input hashes per target** can be
verified. G1 FAIL/incomplete, R1 final-source regression incomplete, R2 BLOCKED on that
candidate. Preserve prior R1 closure on `c12d953`/run `36148942247`, attempt 1, and all
earlier failures under their actual inputs. No final capability/acceptance pass.

## Bounded correction and local gates

Large observations use at most four scoped readers, one shared byte allowance,
unchanged per-open registration/root/parent/leaf safety and final source/metadata/
inventory checks. Workers inherit the exact cancellation token/deadline and join
before return. No content/revision cache or persistent worker is introduced. Small
files use bounded hash buffers; the maximum 1 MiB cancellation interval is unchanged.
The graph canvas uses compositor-backed transforms to avoid repeated subtree paints;
all nodes/edges and existing navigation/keyboard/selection remain. Browser measurements
now survive a budget assertion failure. No workload, assertion, budget or privilege
was relaxed.

Final local core **184 passed / 0 failed / 7 ignored** includes two SDK-wrapper skips;
frontend **58 passed**. Isolated fixture: **92.112 ms initial / 91.395 ms accepted
update**, required marker present, 500 Scenes/2,000 edges. Rendered initial **67.8 ms**,
p95 **17.7 ms**, with all 30 samples retained (one 145.9 ms maximum). Source/runtime
browser, build, formatting and structure/link/privacy/whitespace checks pass. These
are local development results; target/native package proof remains required.
The unchanged Phase 0 Python repeated-signal cleanup error stays open in the ledger.

## Next bounded action

Publish this material correction, check for pending verification, then dispatch exactly
one replacement `production-scaffold.yml` with `upload_packages=true` on that candidate.
Do not rerun the unchanged failed SHA, dispatch R1-only or duplicate pending work.
Record run/attempt/SHA; if pending, stop under the manual-resume policy. No watcher or
automatic continuation is configured or claimed.

When complete, verify both full logs, ZIP size/SHA-256/CRC, all 94 manifest input hashes
against candidate Git blob bytes, candidate/tree/target/executable, all five runtime UI
JSON/log pairs (PASS, no timeout, exit 0, confirmed cleanup), explicit SDK markers,
isolated/rendered budgets, focus/resize and legacy smoke independently. Publish the
G1/R1/R2 assessment, ledger and this handover. Missing/failed/skipped gates stay open.
Stop before physical testing, acceptance, merge, optional Git or Phase 2.
