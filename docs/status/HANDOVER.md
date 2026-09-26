# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b G1-V1 observation redesign, **blocked on design review**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Failed production application candidate:** `ec6a76adbf78bc09baf7daba067d70eedbc38699`.
Read [ledger 16](../tasks/active/phase-1g-branches-runtime-git.md#16-windows-secure-observation-concurrency-result-and-g1-v1-design-blocker--2026-09-26).

## Evidence and diagnosis

Production run `36210484651` proved the retained G1-V2 compositor correction on macOS
but failed G1-V1 on Windows: accepted projection **616.686 ms >250 ms**. The first
bounded profiler, run `36213357271`, localized ~94% of Windows accepted-update time
to secure snapshot read/hash plus secure freshness read/hash; parsing/edge projection
was under 10 ms.

The requested follow-up [run 36218397984](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36218397984),
attempt 1, exact head `7e4234a041b446d01ad5244002f1ce945d58046d`, completed successfully.
Windows accepted updates at requested reader counts were: **1 508.416 ms; 2 536.401 ms;
4 749.559 ms; 8 784.488 ms; 16 501.102 ms**. macOS: **105.763, 92.560, 67.187,
58.416, 68.651 ms** respectively. Concurrency tuning cannot meet the Windows budget.

An identity/length-only final check was explicitly rejected: an in-place external edit
can retain both, weakening stale detection, and one Windows full snapshot pass already
consumes approximately the entire budget. Temporary profiling reader overrides and the
sweep were retired after evidence capture; normal production remains at the original
four-reader bound. Env-gated stage timing remains diagnostic-only.

## Required next checkpoint

Design, adversarially review, then implement only after review a **core-owned source
observation index / invalidation contract** that reduces ordinary-refresh full hashing
without weakening external-change detection. Investigate secure initial hashes plus
cheap platform metadata/change signals, mandatory re-hash on any signal/ambiguity,
explicit invalidation after Loomlight transactions, and bounded periodic/full
verification. A filesystem watcher may be an invalidation hint only, never sole
correctness authority.

The design must cover Windows and macOS semantics, in-place same-length edits,
replacement, inventory add/remove/rename, root/parent/leaf substitution, missed or
overflowed watcher events, Loomlight-owned writes, cancellation/deadline and bounded
memory/descriptor ownership. Observation state must never become write authority.
Preserve the unchanged 250 ms budget and fail-closed behavior.

Do not dispatch another production/package matrix until a corrected candidate passes
the isolated Windows budget locally/through the cheap target profiler. Stop before
physical testing, acceptance, merge, optional Git or Phase 2. Preserve earlier R1
closure and G1-V2 evidence under their actual candidates.
