# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a remaining R1-B1 correction and recheck, `awaiting_ci`.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Entry review:** `e9d029a53a6b7a6d06098cad15172572ceffbe62`.
**Corrected application candidate:** `c12d953548992adc60b38682d0dcfda8cdeb9f94`.
**Candidate tree:** `3f8f6e769672572b008b2ffb4f283888afecfc31`.
**Verified PR base:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
This follow-up changes documentation only after the corrected application candidate.

## Completed correction and local recheck

The user authorised the remaining R1-B1 correction and recheck, with a next-phase
prompt only if no blockers remain. `prepareRuntimeInput` now uses its captured
`runtime.cancelRequest` receipt when cancellation races successful completion. That
control remains available during competing authoring ownership and defers teardown
until the owner returns. Source/Scene input remains retained; no broader runtime UI,
Rust, trust, protocol or workflow change was needed. R1-B2 closure stands.

The actual helper/Source controller regression failed on the previous implementation
with `RUNTIME_BUSY`, then passed for Run/Validate crossed with abort/stale-view cases.
It checks captured receipt identity, released lease/coordinator, no Save/start and
retained Source/Scene input. The existing native held-owner test proves core deferred
cleanup and stale-token isolation; the new frontend test uses an injected request port.
No new end-to-end renderer/native claim is made.

Local typecheck and **50 frontend tests passed, 0 failed/skipped**; production build
and preserved Source Save/selection browser checks passed. Local Node 26.8.1/npm
11.19.0 differ from the native pin. Rust remains unavailable locally; unchanged Rust
is checked by the native workflow. Repository validation and whitespace passed before
publication. [Exact-candidate quality 36148947574](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148947574),
attempt 1, passed. Bounded source recheck identified no further blocker.

## Outstanding final-source evidence

[Native R1 36148942247](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247),
**attempt 1**, exact candidate above, was **in_progress** at identity inspection.
Windows job `108117024512` and macOS job `108117024959` were still running; no
artifacts were available at final inspection. No target pass is claimed yet. Inspect both complete job logs and the six files in
`runtime-foundation-windows-2025` and `runtime-foundation-macos-26`: match checkout,
run/attempt/candidate, required gate outcomes, actual counts/skips, ZIP size/SHA-256/CRC
and every reported input hash. Expected frontend count is 50 with zero skipped.

Historical `36144974132` remains PASS on `07f23b6`; it does not validate changed
frontend inputs. All other successful, failed and superseded runs retain their ledger
provenance. No duplicate dispatch or rerun. See the
[correction ledger](../tasks/active/phase-1g-branches-runtime-git.md#renderer-completed-receipt-correction--2026-09-26).

## Publication and next bounded action

The application candidate is published on the existing branch. Publish this coherent
documentation follow-up non-forced, verify remote head/tree/content and retain draft/open
PR #17. No local-only application change remains. This documentation does not trigger
another native runtime matrix; any automatic quality check is separate.

AGENTS/WORKFLOW require manual resume and ending active polling while the external run
is outstanding; no qualified same-thread external-event continuation is configured.
Resume **only the final 1G.2a evidence review** for the exact run above. If both targets
and provenance pass and no blocker remains, close R1's technical findings and give the
requested next-chat prompt for **1G.2b — Runtime UI and navigable diagnostics**.
Do not start 1G.2b in this checkpoint. No merge, physical testing, optional Git or
Phase 2. User acceptance remains separate from implemented and tested status.
