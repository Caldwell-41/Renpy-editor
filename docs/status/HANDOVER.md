# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-MAC-H1 audit `review_ready`; diagnostic **FAIL**;
R2-P1 remains `blocked`. No operation is pending and no automatic retry is authorized.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized/performed.
**Audited workflow candidate:** `238aa9fde5bb15243912ae89abdc4bcf2c21af78`.
**Application/probe candidate:** `86466aea1d02ed2534ab404939a85b7a7f15ee54`, unchanged.
**Audit entry head:** `3ba1094ec798d9055e1d48c9f1ab426b18973104`.
Main: `4d7ba0333c48d60242a9a42d3e079fea499a5531`. This publication changes docs only;
resolve its verified documentation head from Git, without a receipt-only commit.

## Exact result and audit

Read [ledger 30](../tasks/active/phase-1g-branches-runtime-git.md#30-r2-p1-mac-h1-combined-review-and-hosted-diagnostic--2026-09-27)
for scope, provenance, distributions, trace analysis, fix disposition and next proposal.
The user resumed to identify the issue and fix if possible. No evidence-backed bounded
repository fix was found; no speculative app/probe/workflow/graphics-flag change was made.

Run **[36310107481](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36310107481)**,
attempt **1**, exact SHA **238aa9fde5bb15243912ae89abdc4bcf2c21af78**, terminal
**failure** at **2026-09-27 09:41:16 UTC**. Job **108594276410** failed only its traced
browser step; fixture verification, identity, hosted cleanup audit and upload passed.
The Windows/profile and repository-validation paths were intentionally skipped.
One dispatch/hosted launch total; its allowance is exhausted. No rerun occurred.

Artifact **10928671828**, **1,366,696 bytes**, SHA-256
`478dfc0afb23593c7a086f970fb5849a53ad30eb53a5dcba046e80e232fedafd`, was downloaded and
verified against fresh metadata. ZIP checks and all nine manifested file hashes passed.
All source/workflow/fixture hashes match the candidate; current app inputs are unchanged.
Raw archive, reports, trace, captures, metadata, job log and replayable offline audit
remain in ignored `.toolchains/reports/r2-p1-mac-h1-audit` (17 hashed retained files).

Host: Chrome **152.0.7977.83**, macOS **26.6.2 / 25G83**, **Apple M1 (Virtual)**,
image **20260907.0351.1**, Node **24.19.0**, npm **11.9.0**, Playwright **1.63.0**.
Graphics: Apple Paravirtual device / ANGLE Metal / GraphiteDawnMetal. Budgets unchanged.

- Original first-rAF p95/max: **123.6/968.4 ms**, 2/30 >100 ms.
- Visible first-rAF p95/max: **116.5/605.4 ms**, 4/30 >100 ms.
- Visible second-rAF diagnostic p95/max: **181.6/621.4 ms**, 10/30 >100 ms.
- No-input second-rAF control p95/max: **148.8/177.8 ms**, 9/30 >100 ms.
- Initial layout **160.1 ms**; original/visible dispatch maxima **0.5/0.3 ms**.
- All 500/2,000 workload, geometry, focus, held-refresh navigation, release, resize
  and zero-page-error assertions passed. The two captures match local M1 captures.
  Hosted audit confirmed browser PIDs absent, server closed and trace saved.

Trace confirms **587.240 ms** and **540.498 ms** GPU command-scheduling waits inside
long input samples. Other p95 delays coincide with late Viz BeginFrames. All 30
no-input brackets contain zero recorded Layout, UpdateLayoutTree, Paint, RasterTask
or EventDispatch events while frame intervals still overrun. This identifies browser/
graphics/frame-delivery delay on the hosted environment, not a long synchronous
Branches handler. Graph-triggered deferred graphics, Chrome, virtualization, host
scheduling and tracing remain possible contributors; exact upstream cause is unproven.
No matching hosted untraced run exists. Do not call this a harmless flake or subtract
control/trace time, disable browser graphics features, or weaken the <100 ms objective.

## Preserved evidence and boundaries

[M1 ledger 29](../tasks/active/phase-1g-branches-runtime-git.md#29-r2-p1-mac-m1-probe-correction-and-local-proof--2026-09-27)
retains two passing local Chrome 154/M4 launches. Their different environment cannot
waive H1. [WIN-F1 ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27)
retains the two-buffer fix, six SDK checks and five local Windows scenarios. Three
of four F1 builds were used; the unused allowance does not authorize more macOS work.

Original run **36293797731**, attempt 1, candidate **f1a0f14**, remains FAIL (Windows
startup stack overflow, macOS p95 109.9 ms / max 860.3 ms). Its skipped SDK/package
gates, unavailable original executable, exact historical attribution and final
supported-target/package/native-human acceptance remain open. No hostile/crash tests,
new tool installation, app/renderer change, CI dispatch or merge occurred in this audit.

## Next bounded decision — approval required

**Proposed R2-P1-MAC-E1:** one fixed hosted untraced/traced pair on a single macOS
allocation with the same installed Chrome, fixture and budgets, plus separate
pre-graph no-input cadence controls in each. Keep explicit capture behavior identical;
trace enablement is the comparison variable. This separates pre-existing frame pacing
from graph/capture carryover and helps quantify instrumentation contribution. Prepare
and review the minimal probe extension before execution, preserve both outcomes and
stop; no retry-until-green, new browser/profiler, flag change or acceptance waiver.

This is a proposal, not current execution authority: the H1 one-run allowance is
spent. Approval is required before new diagnostics/dispatch or environment changes.
Any actual fix must follow the evidence; none is claimed here. Broader production
qualification, human acceptance, conflict resolution and integration remain separate.
Offline evidence audit, repository validation (270 files), whitespace and the
four-document scope review passed. Only ledger, CURRENT, HANDOVER and TESTING accompany
this audit, published with `[skip ci]`. The next chat reads this record rather than reconstructing raw logs.
