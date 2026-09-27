# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** **R2-P1-MAC-N1** independent packaged assessment `blocked` at
preflight; no responsiveness or usability assessment has run. TEST-P1 remains
`review_ready`; R2-P1 remains blocked.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized.
**Entry/application candidate:** `c96836b90482c7994663cfa7584702e54c163649`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
Resolve this docs-only interruption publication head from Git; do not chase its SHA
with a receipt-only commit. No N1 release package exists.

## Required next decision

Read [ledger 32](../tasks/active/phase-1g-branches-runtime-git.md#32-r2-p1-mac-n1--independent-packaged-responsiveness-assessment),
including its preflight interruption, and
[TESTING](../TESTING.md#supported-runtime-responsiveness-and-diagnostic-boundaries).
The unchanged 503-source core fixture lacks three scripts required by ordinary
packaged project opening: `options.rpy`, `gui.rpy`, and `screens.rpy`. The actual
fixture test failed `probe open: InvalidMetadata`; this is a fixture incompatibility,
not evidence of application slowness. Do not bypass the lifecycle guard.

A user decision is pending: approve retaining all original contents plus three empty
required files (**506 sources, unchanged 105,627 bytes / 500 Scenes / 2,000 edges**),
explicitly leaving exact-fixture qualification open, or stop with this blocker.
No answer had arrived at publication. No dependent release build or launch is
authorized under the changed fixture until that answer arrives. The user separately
approved downloading missing locked Rust test dependencies; that permission persists.

## Local work and proof

Four probe-support files remain **local and uncommitted**, not review-ready:
`app/src-core/src/lifecycle/runtime_probe.rs`, `app/src-tauri/src/main.rs`,
new `app/src-tauri/src/branches_ui_probe.js`, and
`app/scripts/run-runtime-ui-probes.py`. Preserve them. The new focused test currently
fails on the fixture prerequisite above; source support was not published as working
code. Exact patch and failure evidence are retained under ignored
`.toolchains/reports/r2-p1-mac-n1/`, with hashes in ledger 32.

Workspace compile, 60/60 frontend tests (zero skips), syntax, format, repository
validation and whitespace checks passed. The focused test first encountered a
missing offline test dependency; after the approved download it compiled and failed
on invalid fixture metadata (0 passed / 1 failed / 212 filtered). No broad hostile/
crash tests or project code ran. Native UI driver and physical M4 macOS host are
available. Environment identity is in the ledger; no native observation is claimed.

**Unused allowance:** release build attempts **0/2**, automated package launches
**0/3**, native interactive sessions **0/1** (up to 15 minutes). No operation is
pending. Do not spend WIN-F1 allowance. Preserve the originally fixed samples,
endpoints and budgets. No renderer fixes, Chrome comparison, CI dispatch, gate
waiver, merge or later checkpoint. If the fixture is approved, resume only MAC-N1,
publish its assessment/handover, then stop.

## Retained failures and missing acceptance

R2-P1 remains **blocked** and final 1G unaccepted. Original run
[36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains FAIL:
Windows SDK-hashing stack overflow; macOS Chrome p95 109.9 ms / max 860.3 ms, with
later SDK/package gates skipped. Original executable is unavailable. WIN-F1 ledger 27
retains the two-buffer correction, six selected SDK checks and five local Windows
scenario passes. Source is unchanged here; three of four F1 builds were used.

[H1 ledger 30](../tasks/active/phase-1g-branches-runtime-git.md#30-r2-p1-mac-h1-combined-review-and-hosted-diagnostic--2026-09-27)
retains terminal failed run **36310107481**, attempt **1**, exact candidate
**238aa9fde5bb15243912ae89abdc4bcf2c21af78**, job **108594276410**. Artifact
**10928671828**, **1,366,696 bytes**, SHA-256
`478dfc0afb23593c7a086f970fb5849a53ad30eb53a5dcba046e80e232fedafd` and all nine
manifested payload hashes passed audit. Chrome 152 / virtual M1 original p95 was
123.6 ms, visible second-rAF 181.6 ms, no-input second-rAF 148.8 ms. Long GPU waits
and late frames explain observed intervals, but the precise upstream cause is unknown;
no justified renderer fix was found. Functional assertions and cleanup passed.

The single H1 dispatch/launch allowance is exhausted; no operation is pending.
Raw audit and replayable analysis remain under ignored
`.toolchains/reports/r2-p1-mac-h1-audit`, with 17 hashed files. Local M1 Chrome154/M4
passes remain in ledger 29 and cannot waive H1. Preserve those and earlier raw evidence.
Skipped package/SDK gates, exact historical attribution, supported-target qualification,
final human acceptance and integration remain open. A native result will inform the
next decision; it cannot silently replace a failed gate or complete final acceptance.
