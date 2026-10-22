# SDK, source and runtime gates

Select affected gates under [WORKFLOW](../WORKFLOW.md). This runbook does not open
historical allowances. Keep independent source/media/runtime expectations; never
derive an expected result solely from the output under test.

## Source and transaction coverage

Use the synthetic [representative fixture](../fixtures/REPRESENTATIVE_GAME.md):
comments/formatting, dialogue/narration, labels, menus/conditions, variables,
calls/jumps/returns, screens, ATL, media, translations, embedded Python, custom and
malformed/incomplete syntax, non-ASCII text and mixed newlines. Assert byte-identical
no-op round trips and smallest safe source patches, including opaque regions.

Retain save/reopen/Undo/Redo, clean/draft state, ordinary external in-place and
replace-on-save conflicts, non-crashing interrupted-save recovery, `.rpyc` ghost
cleanup, stable IDs, source ownership and literal renderer JSON through real IPC.
Supporting mutations, Source retention and Flush must preserve pending input and
reject stale completions; tests should await acknowledged retention before a
contending read. A debounced status label alone does not prove mutation completion.

Useful focused selectors from `app/` include `source_foundation`, `phase3a_`,
`source::tests`, the changed transaction/lifecycle scope, and relevant DOM tests.
The separate archive-backed SDK test remains ignored until explicitly selected.
Source-foundation and Phase 3A cases retain nested/terminal ownership, EOF append,
BOM/CRLF, exact IDs/map/source/history, unsupported-region and stale/draft refusals.
Phase 3A controller tests exercise actual dispatch and ordinary second-process reopen.
Their SDK cases also prove saved-callee return and edited continuation behavior;
renderer or controller success cannot replace that runtime proof.

### Early screen-source proof

Phase 3B's selected early outcome adds `screens::tests` in core and
`test_screens_source_evidence.py` for rejecting incomplete qualification evidence.
The narrow service inspects revision-bound nodes in `game/ui` and patches existing
integer `xsize`/`ysize` tokens through shared transactions/history. Opaque spans,
Source drafts, stale revisions, undo/redo and reopen remain protected. It does not
implement the full Screens workspace or persistent screen ownership.

`qualify-screens-source.py` takes an explicit verified archive/checksum pair, fresh
output directory, ordinal and `--allow-fixture-execution`. The named SDK case must
prove actual rendered dimensions, a captured screen, unchanged accepted bytes and
one continuation after Close. Retain individual cases, source/toolchain/executable
identity, the executable on failure, durations and cleanup. Scan before upload.
The focused branch workflow uses both Windows x64 and macOS ARM64 without packaging
an editor. The [task ledger](../tasks/evidence/phase-3-history.md#early-execution-ledger)
owns the fresh allowance and all failures. Its
[CI1 audit](../tasks/evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation)
qualifies the early source/runtime proof on both hosts. Require measured virtual
dimensions separately from capture pixels; successful compile/lint or an active
screen alone cannot qualify rendering. Broader screen behavior remains under the
full 3B completion contract.

## Official SDK

Use only the project-pinned official SDK, currently 8.5.3, verified against its
published checksum. Cache only under the exact archive SHA; refuse corrupted cache.
An already retained published manifest may be used only with verified provenance
and the unchanged pin. On cache miss use the bounded official download route.
Record acquisition failure before any package/launch reservation; retain safe early
failure evidence. Never silently substitute an archive, workload or expired artifact.

Exact SDK selectors (from `app/`, with their required archive/environment):

| Case | Selector / environment |
| --- | --- |
| Lifecycle | `lifecycle::tests::official_sdk_phase_1c_target_gate`; `LOOMLIGHT_PHASE1C_SDK_ARCHIVE` |
| SDK reconciliation | `renpy::reconciliation_tests::official_sdk_download_handoff_target_gate`; inspect its archive adapter |
| Integrated authoring | `renpy::tests::phase1h::phase1h_integrated_authoring_sdk_gate`; `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` |
| Nested source foundation | `renpy::tests::source_foundation::source_foundation_bool_sdk_gate`; `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` |
| Phase 3A conditions/calls | `renpy::tests::phase3a::phase3a_conditions_calls_sdk_gate`; `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` |
| Starter GUI | `renpy::tests::official_sdk_starter_contains_runtime_gui_assets`; `LOOMLIGHT_RENPY_SDK` points to the verified SDK |

Inspect the actual selector and ignored state before execution. Use `--exact
--nocapture`; add `--ignored` only for a deliberately selected ignored SDK case.
Require its positive named result and expected completion markers. A local wrapper
skip or missing archive is not target qualification.

Validate generated fixtures/drivers cheaply before SDK execution. Menu progression
must await/assert the choice screen; ordinary dialogue `advance` cannot prove a
menu transition. Importing separately encoded SDK GUI files is distinct from
editing an accepted BOM-bearing Source document. Preserve the destination policy,
strip at most one declared transport BOM and reject multiple BOMs before writing.
Retain actual import bytes/encoding receipts before assertions and owned cleanup.

Qualify compile/lint, normal entry, fixed routes/state/literal dialogue/media and a
deliberately wrong outcome that must be rejected. Assert metadata-free source sets
and accepted-source preservation. Use the existing dummy audio fixture to test PCM
decoding and channel playback/stop without assuming a hosted speaker device.
Windows SDK scratch `TEMP`/`TMP` must use a short contained path; keep evidence
separate when needed. This is not a claim of general long-path support.

## Packaged runtime cases

`run-runtime-ui-probes.py`, its result checker and package retainer share
`runtime_probe_cases.py`. The six routine cases are `compile`, `lint`, `route-a`,
`route-b`, `runtime-error` and `ui-refresh`. Require one successful report per
requested case, matching inner scenario and terminal stages, ordinary exit and
cleanup. Wrong, missing or duplicate cases, incomplete duration evidence and failed
reports cannot pass. Failure in an independent case must not hide later results.

The real-service fixture exercises visible controls through IPC, actual diagnostics
navigation, accepted source/revision, both authored routes, Source edits during play,
staleness and Stop. Route evidence retains at least 9.5 seconds after observed route
output and Running state; preparation/trust is excluded. The 640px route-b case
retains a mapped draft through Cancel/refused Save All and deliberately runs saved
source. The minimal fixture's explicit quit action avoids its missing confirmation
screen; never suppress production diagnostics or relax Stop to accommodate a fixture.

Help qualification distinguishes validation from owned cancellation. Validation requires
an ordinary successful exit. Stop requires the cancelled phase, completed process/pipe
and scratch cleanup, complete output and no raw/runtime diagnostic error. Windows
`GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, pid)` can produce `STATUS_CONTROL_C_EXIT`
(`0xC000013A`, signed `-1073741510`) for that explicit owned Stop. The native receipt
records the compile-time target OS and Stop intent; the outer runner checks the OS
against its host. Preserve the raw exit code. The exact Windows control exit is
accepted only in that context. Validation failures, other exit codes/phases, errors,
missing evidence and incomplete cleanup still fail. Unix signal exits can lack a
numeric exit code; Windows qualification requires its numeric result.

The optional `source-foundation` case retains the extended 33-check nested source,
EOF/ownership/draft/external-refusal and close/reopen contract. Optional Branches
performance cases remain separately selected. Neither is silently appended to the
routine smoke or authorised by a command reference.

## Observed flow and performance

The selected core fixture is
`scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges`, with
`LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1`. Require three fresh fixed successful samples per
supported target: 503 sources / 105,627 bytes / 500 Scenes / 2,000 edges, initial and
explicit refresh <2 seconds, accepted-model update <250 ms. The accepted timer starts
at successful transaction return, before invalidation, including history/observed
projection. Assert the changed caption and statuses. It is not IPC or render latency.
Require `phase-1g-observed-budget-gate: passed (3 samples)`.

Explicit Refresh must read current content despite unchanged timestamps. Preserve
ordinary same-length/replacement edits, additions/deletions, metadata invalidation,
draft/caret retention and session/resource bounds. Last-observed display can age
until the next trigger under [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md).

Chrome timing is diagnostic on both hosts; functional/evidence, startup, timeout and
cleanup failures still block. Retain all original <2,000 ms layout, <100 ms dispatch
maximum and <100 ms first/visible-first/visible-next-rAF p95 limits and raw samples,
even when timing alone does not fail the process. Await advancing rAF timestamps
within the existing bounded policy; never replay inputs or discard bad samples.
Two callbacks are rendering opportunities, not physical presentation.

For platform responsiveness use the actual packaged WKWebView/WebView2, real service
and input observations described in [NATIVE](NATIVE.md). Declare endpoints, fixed
samples, workload, thresholds, allowance and stop rule first. Do not pool cold and
steady samples, trim outliers, subtract idle/instrumentation time, or infer a native
defect from hosted Chrome timing alone. Keep tracing/captures outside measured
populations where possible and disclose perturbation. Detailed original measurements
and diagnostic hypotheses remain in the [historical reference](../tasks/archive/2026-10-16-testing-reference.md#branches-timing-interpretation).
