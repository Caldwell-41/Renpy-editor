# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE scope correction and terminal evidence closeout](../tasks/active/phase-1f-save-correction.md#716-final-report-lexical-scope-correction).
**State:** automated P5 verified; `blocked` on native P3 only. Stop for independent review.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `85e44e926399ae7ad8431c948e1751db04dcde35` (tree `ca22dc8486a7114eeda227821582a7945a344d77`).
**Publication:** documentation-only evidence closeout on the existing branch/PR; application candidate unchanged.

## Completed evidence

[Production 35708223679](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35708223679)
(#84), attempt 1, passed on the exact candidate. Preflight `106682217975`,
Windows `106682384572` and macOS `106682384566` all succeeded.
Windows artifact `10685588341` and macOS artifact `10685592982` were downloaded
and inspected: each contains one accepted final report with complete Source traces,
all reported security/authoring assertions true, and all five timed checkpoints.
Final-report-start: Windows 898 ms; macOS 5,782 ms. Both post-smoke secret scans and
dependency/licence inventories passed (85 npm / 519 Cargo entries each). Real-service
Source persistence passed on both. P1/P2/P4/P5 automated evidence is satisfied.

Repository Quality `35707727479` passed the candidate. The prior correction retained
three-case executable red/green evidence, frontend 32/32, build, syntax and repository
checks. This evidence-only closeout reran repository validation and whitespace checks;
no application suites or production runs were repeated. No application code changed.
See section 7.16 for exact timings, historical failure evidence and self-review.

## Next bounded action

Independently review this exact candidate and its completed evidence. Do not redispatch
#84, merge PR #14 or begin Phase 1G. No automatic follow-on implementation is authorised.
The only remaining acceptance-evidence blocker is native P3 below. Any package
acquisition/build needed for manual testing is a separate explicit next action:
optional installable-package upload was not selected in #84. Evidence artifacts expire
2026-09-29 and are not installable application packages.

## Native P3 — outstanding

No trusted native keyboard evidence was collected. On the exact packaged candidate:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat with Cmd+S.

Record package identity, OS/architecture and observed outcomes. Synthetic events are
renderer-routing evidence only. Keep PR #14 draft pending independent review and
the remaining acceptance requirement.
