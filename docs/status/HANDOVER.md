# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**State:** scope/testing documentation amendment `review_ready`; Phase 1F remains accepted/integrated/post-merge verified; Phase 1G implementation unstarted.
**Continuation branch:** `docs/phase-1g-scope-testing`. **Prior merged PR:** [#14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Verified merge:** `973e3565d7cf41c6dca936df088ced10969821ac`.
**Reviewed closeout:** `e225dee19c6f772f409c4fe76ac0493b769adefd`.
**Production candidate:** `88dc6286944d4b96cfb96968f88aa6e87dacc447`.
**Authority:** September 25 user requested Git deferral, accepted the review/testing
fixes and authorised documentation updates; no implementation or merge selected.
**Planning baseline:** main `f6c269278aa1d8955876ca45bac98a92940e1c5e`.
**Planning PR:** [#16](https://github.com/Caldwell-41/Renpy-editor/pull/16), open/unmerged.
**Reviewed planning candidate:** `b9226360165fe2a8c22244f5e5812fe0a713bd5f`; this
follow-up narrows editing during play to scripts under the user's clarification.
**Canonical detail:** [post-merge verification 7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#730-post-merge-production-evidence-closeout)
and [final decision 7.29](../tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review).

F1-F4 are closed. Production run `35787284261`, attempt 1, passed every required
automated target gate. Historical reports call it #90; fresh GitHub metadata says
#91, with identical stable ID/SHA/artifacts. Both native F4 A/B/C sets are user-reported
PASS and all six #87 native Save passes remain PASS without repetition. Native local
hashes/exact OS builds were not supplied; the archive retains those evidence limits
and DIST-MAC-01. No new application change, package run or physical test was performed.

The closeout tree `ae81ddfcfdf6ada7f756f1d8bd9bf46474f731a2` exactly matches the
merge tree. Repository quality `35821483373` passed the published closeout. The F4
inline review thread is resolved; PR #14 is closed/merged. This follow-up records
actual integration and resets continuation, rather than chasing its own commit SHA.
Repository/link/privacy/whitespace checks pass. No acceptance blocker remains.

## September 25 scope/testing amendment

The isolated documentation branch revises 1G to three checkpoints, preserves new Git
work as optional GIT.1/GIT.2, and removes Git acceptance from Phase 1/1H without removing
existing init regressions. Flow/draft/diagnostic boundaries and editing-during-play proof
are concrete in the [1G brief](../tasks/active/phase-1g-branches-runtime-git.md).
[TESTING](../TESTING.md#phase-1g-testing-ownership-and-cadence) owns agent-run tests,
real-service package coverage, early R1 native automation, one final human 1G session,
narrow 1H human-evidence reuse and honest workflow cost limits. The subsequent user
clarification permits script editing/saving during play only. Asset mutation requires
Stop, enforced in core including imports/history/races. The earlier live-asset-read
test is replaced by automated refusal/no-write and retry-after-Stop coverage; the
physical testing schedule is unchanged. No hot-reload or snapshot subsystem is added.

**Validation:** `python3 scripts/validate.py` passed for 224 repository files; staged
`git diff --check` passed. Reviewed Phase 1/Git scope references, local Markdown anchors
and the documentation-only diff. No application or platform tests were run.
**Publication:** this branch is the publication target; no application/SDK/package/native
execution, workflow dispatch, CI trigger change or integration is part of this checkpoint.
**Next bounded action:** review the documentation amendment. After authorised integration,
select 1G.1 separately; use the existing implementation-branch rules below. Optional Git
has no implementation branch and needs a later explicit selection. Phase 2 plan unchanged.

Historical 1F results and branch dispositions below remain evidence, not new test claims.

## Post-merge production verification

Main repository quality [35821582664](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582664)
passed. The merge automatically triggered production [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755),
run number 92, attempt 1, on the merge SHA above. Terminal inspection confirms
Preflight `107054377077`, Windows `107054543325` and macOS `107054543438` all passed.
Frontend 42/42 and the F4 browser probe passed; core results were Windows 147 and
macOS 153 with zero failures and four ignored subprocess workers per target. Explicit
SDK/desktop/package-smoke/security/inventory gates passed. The two lightweight evidence
ZIPs were downloaded: their SHA-256 values match GitHub metadata and CRC checks pass.
The automatic push run intentionally did not upload replacement installer artifacts.
No manual dispatch/retry or new physical test occurred; accepted pre-merge package and
native evidence remains authoritative. The `awaiting_ci` state is closed.

**Phase 1F next action:** none; its evidence remains closed. Phase 1G.1 is eligible only after
explicit user selection in a later chat; do not begin it automatically.

## Branch disposition

No remote branches or tags were deleted. The 1F remote branch is fully integrated,
but the connected API has no branch-deletion operation and shell Git has no write
credential (the attempted documentation push failed before the successful API
publication). It can be retired from an authenticated host after confirming no other
executor uses it. Do not restore or modify it merely to finish housekeeping.

Older `corrective/phase-1a-1d-integrated`, `corrective/phase-1d-ui-operation-race`,
`feature/phase-1e-scene-authoring` and `docs/phase-1g-1h-planning` are ancestry-proven
integrated but retained because cross-host worktree/dependency use is unconfirmed.
Preserve open Dependabot PRs #10/#11, abandoned unique history PR #12 and archive tags.
No host worktree was removed. Branch retirement is housekeeping, not a 1G entry blocker.

## Next bounded checkpoint

[1G.1 — shared flow projection and Branches](../tasks/active/phase-1g-branches-runtime-git.md#4-1g1--shared-flow-projection-and-branches)
is the next application checkpoint after explicit user selection in a later chat.
All 1G/1H checkpoints
remain `not_started`; Phase 2 planning is unchanged. No 1G implementation branch/PR exists.

On selection, read AGENTS, WORKFLOW, CURRENT, this handover, the parent Phase 1 plan and
the 1G brief. Inspect actual main/refs/ownership; reuse a matching branch/PR if present,
otherwise create `feature/phase-1g-branches-runtime` from verified main and record
it here. Complete only 1G.1/G1, preserving Source Save, review identity and draft/session/
recovery authority. Publish its evidence/handover and stop before runtime or Git work.
