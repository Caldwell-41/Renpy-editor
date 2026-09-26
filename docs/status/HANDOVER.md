# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b Runtime UI and navigable diagnostics, **blocked**.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Resumed entry:** `13311e41ecaa3f84ee616fa3b6c73771b227dd57`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
**Original application candidate:** `931684dd59ce319bd98f0028df98a3023ced7740`, tree
`b6432353974e8a7f8818a8e8f91fadca1b29ccb9`.
**Verification correction candidate:** `6c7efad4e260484423a244aa835506e74faa45f3`, tree
`20ac713fb9373ff1edd796498f2776bc9c651db0` (tests/workflow and assessment; no application
behavior or permission change). This follow-up changes live status/handover only.

## Authority and completed assessment

The user selected outstanding 1G.2b agent verification only. Read
[active plan section 6](../tasks/active/phase-1g-branches-runtime-git.md#6-1g2b--runtime-ui-and-navigable-diagnostics),
[the resumed ledger assessment](../tasks/active/phase-1g-branches-runtime-git.md#resumed-exact-run-assessment-and-bounded-correction--2026-09-26)
and [TESTING](../TESTING.md#phase-1g-testing-ownership-and-cadence).
Stop before physical testing, acceptance or merge. Optional Git and Phase 2 are excluded.

[Run 36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820),
**attempt 1**, completed **FAIL** on `931684d`. Preflight passed; Windows job
`108266324216` and macOS job `108266324332` both failed the stale Rust capability
assertion. Both complete target logs and evidence ZIPs were inspected. Artifact
`10889700592` (Windows) and `10889595467` (macOS) passed exact size, SHA-256 and CRC
verification. The ledger retains digests, counts, skips and timing observations.

Each artifact contains only the core log and real-service flow fixture. Explicit SDK,
renderer focus/resize, desktop/package, all five runtime UI cases and legacy boundary
smoke were skipped. No package or `runtime-ui-inputs.json` was generated: **0/93
per-target input hashes and no executable hash can be verified**. Do not substitute
checkout identity, local hashes, prior candidates or wrapper skip markers for these gates.

**Assessment:** G1 FAIL/incomplete (budget overruns and missing final UI evidence);
R1 final-source regression incomplete (ordinary regressions pass, explicit SDK skipped);
R2 BLOCKED (no final packaged cases). Preserve R1-B1/B2 closure on `c12d953`, run
`36148942247` attempt 1, and earlier G1/local package evidence on their actual inputs.
No final 1G capability or human acceptance pass is claimed.

## Bounded correction and remaining finding

R2-C1 is fixed in `6c7efad`: parse capability JSON semantically, require the exact local
main-WebView/two-permission allowlist, and check both already-approved command
registrations. Exact Rust test **1 passed**, frontend/typecheck **58 passed**,
Rust formatting and repository structure/link/privacy/whitespace checks passed.

**G1-V1 remains open.** The prior core fixture printed timings but never enforced its
limits. It now has an isolated release gate in the existing production workflow,
retaining `runtime-flow-budget.log` and requiring a success marker. Limits remain
2 s initial projection and 250 ms accepted update, with 500 Scenes / 2,000 edges.
The local isolated macOS test **failed**: initial 870.770 ms, accepted update 864.470 ms;
0 passed / 1 failed, 185 filtered. Original CI observations also exceed the update
budget on both targets, and Windows initial projection exceeds 2 s. Full-suite
contention cannot be assumed to explain the finding. No budget or workload was relaxed.

No replacement production or R1-only run was dispatched: the local prerequisite is
known to fail. No production verification, watcher or local test process remains pending.
Keep PR #17 draft/open. Do not run a package matrix for this documentation publication.

## Next bounded action

Continue **1G.2b agent verification, G1-V1 only**: profile the unchanged fixture and
resolve projection latency with a bounded correction that preserves source identity,
external invalidation, draft truth and safe bounded I/O. A broader cache/consistency
redesign or budget change requires an explicit decision. Do not silently raise limits.

After applicable local gates pass, publish the coherent correction candidate and
manually dispatch exactly one justified replacement production run with package upload.
Check for an existing pending run first. Record run/attempt/SHA and use the repository's
manual-resume policy if it remains pending; no repeated model polling.

On completion, verify both full job logs, ZIP size/digest/CRC, every recorded input
hash against Git blob bytes, candidate/tree/target/executable, all five runtime UI
JSON/log pairs (PASS, no timeout, exit 0, confirmed cleanup), explicit SDK markers,
G1 isolated and rendered budgets, focus/resize and legacy smoke independently. Publish
the updated G1/R1/R2 assessment, ledger and this handover. Stop again before physical
testing, acceptance, merge, optional Git or Phase 2.
