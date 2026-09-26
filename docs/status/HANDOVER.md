# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b G1-V1 Windows profiling, **blocked / manual dispatch required**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
**Failed application candidate:** `ec6a76adbf78bc09baf7daba067d70eedbc38699`, tree
`d0e749915cc69006821dc2d52506afe666c6a8b4`.
**Published profiling implementation:** `94481e0e83442e63db3ac43810d29326bfeb523b`
plus documentation follow-up. Read [ledger 15](../tasks/active/phase-1g-branches-runtime-git.md#15-completed-replacement-assessment-and-windows-g1-v1-profiling-checkpoint--2026-09-26).

## Completed replacement assessment

[Production run 36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651),
attempt 1, completed **FAIL** on the exact application candidate above. Preflight passed.

macOS ARM64 job `108315855809` passed the complete job. Isolated real-service flow:
initial **52.597 ms**, warm **52.962 ms**, accepted update **66.483 ms**. Rendered
Branches: initial layout **118.3 ms**, pan p95 **58 ms**, unchanged p95 budget PASS;
one 1157.1 ms maximum sample is retained rather than hidden. Official SDK/runtime
service and diagnostics, desktop/package, all five packaged real-service UI cases,
legacy smoke, scans/inventory and uploads passed.

Windows x64 job `108315855860` passed the release core suite (**176 passed / 0 failed /
7 ignored**) but failed isolated flow: initial **646.337 ms**, warm **639.328 ms**,
accepted update **616.686 ms >250 ms**. Downstream Windows rendered/SDK/package/runtime
steps were skipped. The lightweight evidence ZIP exists; no successful Windows
package/executable/final manifest exists from this run. G1 and final-source R1/R2 remain
incomplete. Preserve earlier R1 closure under its actual candidate; do not substitute
macOS evidence for Windows.

## Assessment and diagnostic implementation

G1-V2's compositor-backed graph correction is retained; macOS target evidence supports
the defined p95 gate. G1-V1 remains a Windows blocker. The previous four-reader change
preserves one shared byte allowance, path/identity validation, cancellation/deadline
and final stale checks, but did not reduce Windows wall time enough. The real flow path
still performs secure snapshot read/hash and then a second secure freshness revision/
hash pass in addition to inventory and projection work.

`LOOMLIGHT_PROFILE_FLOW=1` now emits stage timings from the real `flow_workspace`
path only when explicitly enabled. The manual-only
`.github/workflows/flow-profile.yml` runs the isolated 500-Scene/2,000-edge release
fixture on Windows x64 and macOS ARM64 with a 15-minute ceiling and uploads only the
profile log. It does not package, download an SDK, change budgets, add caching, weaken
filesystem safety or change normal Loomlight behavior.

## Next bounded action

**Manual action required:** open GitHub Actions → **Repository quality** → **Run workflow**.
Select `feature/phase-1g-branches-runtime`, enable **Run the bounded Phase 1G flow profiler
instead of repository quality**, then run it once. The discoverable dispatch harness is
published on main at `4d7ba0333c48d60242a9a42d3e079fea499a5531`; it contains no
Phase 1G application changes. I do not have a workflow-dispatch action in the available
GitHub connector, so no run has been started from this chat.

After it completes, resume this checkpoint and inspect both exact jobs/logs/artifacts.
Compare `snapshot_read_hash`, `freshness_read_hash`, inventory, parsing/projection
and metadata recheck timings. If secure initial/freshness observation dominates Windows,
design the smallest correctness-preserving reduction in duplicate work. If another
stage dominates, correct that measured stage instead. Do not change the 250 ms budget,
do not rerun production yet, and do not introduce a cache/consistency redesign without
explicit review.

Stop before physical testing, acceptance, merge, optional Git or Phase 2. No local
process or external run is currently pending.


## Profiling result and second bounded experiment

Manual dispatch [36213357271](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36213357271),
attempt 1, exact head `8303d4e057b2b137c770d65f7ab660bfbc5b1285`, completed PASS for both
profiling jobs. Windows accepted update **588.586 ms**: secure snapshot read/hash
**286.449 ms** plus secure freshness read/hash **266.781 ms** (~94% of total); edge
projection **7.791 ms**. macOS accepted update **63.221 ms**: snapshot **23.033 ms**,
freshness **16.125 ms**, edge projection **8.360 ms**. The Windows blocker is therefore
secure per-file observation/hash cost, not graph parsing/layout.

A proposed identity-only final check was rejected during self-review: same-file
in-place rewrites can retain file identity, so removing the second content check would
weaken stale detection; moreover the first Windows snapshot pass alone exceeds 250 ms.

Published diagnostic head `eee8343ac6c1af5c34db52491c839dba1feeb31e` keeps normal
production at four readers but, only under both profiling environment variables, runs
the same fixture at requested **1/2/4/8/16** reader limits. No production concurrency,
budget, consistency or authority changes are made.

**Next action:** dispatch **Repository quality** once more on this branch with the Phase
1G profiling checkbox enabled. This is a bounded concurrency experiment, not a package
run. Inspect Windows/macOS stage timings by reader count before implementing the
architectural correction.
