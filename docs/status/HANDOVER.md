# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a runtime/trust foundation — `awaiting_ci` for early SDK proof.
**Implementation:** prerequisite probe/workflow/contracts only; production foundation
and full R1 remain incomplete. Not review-ready, accepted or merged.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Published probe candidate:** `c72b4f675605cdf09cf01b4558a5c1bf69f2f852`.
**Verified candidate tree:** `8038b28ef428ad6548fb8eb53b77ecc83d0279e5`.
**Preserved 1G.1 application:** `fde8cdafd77fe807f2307fb607fc7546ca66ffec`.
**Main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Authority, ownership and delivered work

The user selected 1G.2a only. An isolated checkout owns this execution; older local
work and unrelated PR #12 are preserved. Fresh refs/PRs found no competing runtime
work. Local evidence commits are preserved; connector publication verified equal trees.
No production application or dependency changed. No merge, 1G.2b, optional Git, Phase 2
or user physical testing occurred.

Added a reusable verified Ren'Py 8.5.3 synthetic reload probe and narrowly scoped
Windows/macOS SDK workflow. Recorded mutation/trust/protocol/resource proposals before
privileged wiring. See [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger)
for exact observations, failures, fixes and remaining implementation. Preserve all
[1G.1 results](../tasks/active/phase-1g-branches-runtime-git.md#12-1g1-execution-ledger)
and accepted 1F Save/F4 safeguards.

## Validation and outstanding operation

Linux SDK-only proof: both variants passed, lasting 10+ s before script editing.
Saving retained loaded bytes; a fresh Run loaded new dialogue. `autoreload=False`
still allowed one reload with developer mode on; developer-off suppressed the default
callback. This is synthetic engine-callback evidence, not native keyboard, packaged
service/asset-guard evidence or a production reload policy. The probe's forced teardown
does not certify graceful Stop or descendant cleanup. Existing SDK fixture suite: 24
passed. Python syntax, repository validation (230 files) and whitespace passed.

Hosted path is now established via the branch-triggered workflow. Existing run
[36126490939](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126490939),
**attempt 1**, uses the exact probe candidate above. Both jobs were executing the real
SDK fixture at the initial inspection after successful checkout/cache restore:
Windows job `108043687466`; macOS job `108043687197`. No terminal result is claimed.
Expected artifacts: `runtime-sdk-feasibility-windows-2025` and
`runtime-sdk-feasibility-macos-26`, three-day retention. Inspect them before expiry.
Current-candidate repository quality run `36126493914`, attempt 1, passed. The later
documentation-only head has its own quality result; none is inferred.

The published workflow has no npm/Rust/package steps, read-only repository permission,
pinned actions and a ten-minute timeout per target. No full matrix/manual dispatch/rerun
was requested. Documentation-only publication does not trigger another SDK run.

## Next bounded action and publication

`AGENTS.md` and `WORKFLOW.md` require stopping with a manual-resume handover instead
of model polling without qualified event continuation. None is configured here.
This handover records the exact outstanding run; do not duplicate it or claim a wake-up.

Resume **1G.2a only**: inspect fresh refs/ownership and the existing run's jobs/logs/
artifacts. Resolve bounded probe findings, then implement the section 5 production
trust/preparation/supervisor and core mutation barriers, and complete the actual R1
service/literal-IPC/target-process evidence. Asset refusal/retry/races, history, trust
revocation/identity replacement, process-tree cleanup and lifecycle cases remain
unimplemented. Missing evidence stays blocked; no user physical testing substitute.

Candidate/workflow publication is verified tree-for-tree on PR #17. This final
documentation-only update records the wait and continuation without chasing its own
SHA. Continue the same branch/PR and stop before 1G.2b, merge, optional Git or Phase 2.
