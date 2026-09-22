# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** independent Phase 1F closeout review; completed with acceptance **blocked**.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Entry head:** `22479027008342bda0d4601f195a006116373a4e`.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`; merged into this review branch to preserve existing plans and resolve the documentation conflict.
**Application candidate:** unchanged `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
**Evidence and full diagnosis:** [ledger section 7.22](../tasks/active/phase-1f-save-correction.md#722-independent-closeout-review).

## Acceptance decision

No merge: Apply Both is not bound to the displayed review. Editing a draft leaves an
old combined preview while confirmation submits the new version; an external change
can also be refreshed and combined without re-review. This is a substantive acceptance/
IPC correction. Preview Add change here also loses its insertion anchor, and Background
does not clear visible Characters. Three executable review probes fail as expected.

The user authorised conditional merge and cleanup, but explicitly required diagnosis/
handover and a stop if a substantive defect needs a new checkpoint. This is that stop.
No additional permission is required merely to merge once actual acceptance is met.

## Evidence preserved

- Production [#87 / 35719829561](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561), attempt 1, terminal success on the application candidate above. Target jobs and artifact details remain in ledger section 7.19. No redispatch.
- Entry HANDOVER `2247902` records user-reported PASS for dirty Source, clean Source Flush and non-Source isolation on both supported targets. These outcomes are retained. Exact OS versions and local installed package identity remain missing; confirm those facts only, without repeating tests.
- User reported Mac pass after `xattr -cr /Applications/Loomlight.app`. DIST-MAC-01 retains normal downloaded-app launch/signing/notarisation as a later distribution requirement; Phase 1 explicitly excludes signing.
- Local review: `npm run check` (32 pass, 0 failures/skips), `npm run build` pass. From app, `node --test tests/review/*.repro.mts`: three failing expected-behaviour probes. Review host Node/npm differ from pinned CI; Rust/native tests unavailable here. Repository/link/privacy validation passed for 222 files; whitespace checks passed.
- No application behaviour changed. No 1F records archived, branches deleted, or unrelated work discarded. The branch inventory and integrated-but-retained cleanup candidates are in section 7.22.

## Next bounded action

Select **1F-CLOSEOUT-CORRECTION** on this same branch/PR. Fix F1 review binding across
renderer/JSON/core, F2 insertion anchor, and F3 Background preview; add actual service/
JSON tests and promote the retained red probes into regular regression coverage.
Preserve exact-byte conflicts, no-write refusal, drafts, transaction/recovery and
session ownership. Resolve reviewed-result freshness before any merge.

Run cheap relevant checks first, then required supported-target evidence on the new
application candidate. #87 remains valid historical evidence for its exact code, not
acceptance of these fixes. Do not repeat an unchanged expensive matrix. Before an
external wait, publish exact run/attempt/SHA and stop active polling under WORKFLOW.
Inspect fresh refs and any newer owner work before writing; do not reset to these SHAs.

## Phase 1G preparation only

The existing [1G plan](../tasks/active/phase-1g-branches-runtime-git.md) was merged by
PR #15; do not create another planning PR. All implementation checkpoints remain
`not_started`. After 1F acceptance/integration, select **1G.1 shared flow projection and
Branches** only. Its G1 gate covers truthful resolved/missing/unknown flow, two routes,
cycles/reconvergence, guarded existing-command edits, Source/Scene navigation, draft/
revision/session safety, and bounded accessible layout on both packaged targets.
R1/R2 runtime and V1/V2 Git gates remain separate later checkpoints.

Future selector (not current implementation authority):

```text
/goal — Phase 1G.1 only
Repository: Caldwell-41/Renpy-editor. Read AGENTS.md and docs/status/HANDOVER.md,
then the existing Phase 1G plan. Verify Phase 1F is accepted and integrated; stop if
not. Inspect fresh main, refs, PRs and ownership, reuse matching work, and implement
only shared flow projection and Branches against G1. Publish evidence and handover;
do not start 1G.2 or merge without its required acceptance.
```
