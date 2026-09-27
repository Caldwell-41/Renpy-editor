# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** **G1-O1-R Windows feasibility review**.
**Outcome:** investigation complete, `review_ready`; capability **NO-GO**.
G1-O1/G1-V1 remain `blocked`; G1-O2 is ineligible.
**Branch:** `feature/phase-1g-branches-runtime`.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Reviewed feature/code head:** `94128d3d5104f2716d5996d9f4a0492c923054b6`.
**Historical measured candidate:** `b3d696533290d91bc2ff7d4eb65562d2c68642e1`.

The user selected investigation and publication of findings/next planning only.
This checkpoint changes documentation, not production/test code or the workflow
safety guard. It does not authorize another benchmark, corrected prototype, G1-O2,
different freshness contract, changed refresh cadence or changed 250 ms target.

## Findings and canonical detail

Read [ledger 19](../tasks/active/phase-1g-branches-runtime-git.md#19-g1-o1-r-windows-feasibility-review--2026-09-27),
the [complete review and next-checkpoint plan](../tasks/active/phase-1g-g1-o1-r-review.md)
and [ADR 0009](../adr/0009-flow-observation-candidates.md).

- The completed local comparison was found in the workspace with full breakdown,
  CSV tables, logs and state records; all sample log hashes match. Accepted
  **460.195 / 464.211 / 456.588 ms**, median **460.195 ms**, versus hosted Windows
  **574.858 ms**: about 20% lower elapsed time, still all failures. Setup is complete;
  performance and safety remain blocked. No CPU-specific cause is established.
- Local verification costs **299–302 ms**, other accepted work **158–162 ms**. The
  earlier 175+65 allocation is withdrawn. The new conditional 230 ms whole-request
  estimate includes final leaf binding and separate metadata/inventory reductions;
  none is a demonstrated performance improvement.
- G1-O1-S1 requires a final secure **new name open** compared with the object whose
  bytes were read. Retained parent handles do not prove current namespace/reparse
  state. The review maps existing boundaries and specifies positive reader/graph
  regressions on Windows/macOS. Historical negative reproductions remain failures.
- Code inspection finds an analogous gap in shared production observation/snapshot
  readers, silent Branches navigation clicks during loading, lost card/detail focus
  on redraw and incomplete production metadata dependency capture. Production
  transaction bypass was not reproduced. The review separates confirmed omissions,
  risks and required future integration work; no transaction rewrite is authorized.
- Complete dependency capture (including absence/nonempty media), real central
  invalidation, request cancellation/deadlines, resource/failure injection and
  poisoned-index Source/history/runtime authority tests remain acceptance obligations.

## One next bounded action

**Recommend separately selecting G1-O1-N: native observation-boundary feasibility.**
Use the review's exact scope, pre-registered bounded experiment, safety matrix,
whole-request accounting and stopping conditions. Start with a test-only Windows
directory-relative open and final-binding primitive; preserve every boundary.
Only if safe, measure the new primitive and assess complete-request margin. Do not
build a full corrected candidate or wire production in that checkpoint. Stop if
safe composition or the full budget is not credible; do not retry the old comparison.

Option A is not proven or adopted as a fix. Option B (revision display with explicit
external synchronization) requires an explicit product/ADR decision; cached display
cannot pass today's fresh-refresh gate. Kernel-coordinated caching remains deferred.
Selecting or printing a prompt does not authorize implementation of these alternatives.

Local Windows is early feasibility, not supported-target CI acceptance. Keep macOS
positive S1 and final timing obligations. A later fully corrected test candidate
must pass native safety/complete latency before separately authorized production
integration and its real-service gate; only then is a production/package matrix
justified. No CI dispatch, physical acceptance, merge, optional Git or Phase 2 now.

## Validation, ownership and preservation

Fresh fetch/advertised refs matched feature head above and main
`4d7ba0333c48d60242a9a42d3e079fea499a5531`. No reset/rebase/merge. Existing feature
checkout was clean; the completed historical worktree is clean and unchanged.
Prior local comparison chat was idle, no active benchmark/build or other visible
repository writer was found. Unpublished cross-host work is not independently
observable. Recheck refs/ownership before any future edit or publication.

Portable tools/caches and `enter-local.ps1` were reused. Its compiler lookup failed
inside the sandbox; read-only commands used `-SkipVerify`. Git network operations
used the ordinary host account after a sandbox TLS credential failure, without
administrator elevation. No setup rerun or tool/security/power/affinity change.
No new benchmark, trace, native probe, Rust suite, UI suite or package test was run:
the change is documentation only. `python scripts/validate.py` passed for **263
repository files**; `git diff --check` and documentation-only scope review passed.
These qualify publication, not product safety or performance.

Keep local `comparison.md`, `full-breakdown.md`, CSVs, raw logs, sample markers and
completion state intact and outside Git. Do not bootstrap, delete state, rerun the
completed comparison or edit the historical checkout. Fixed counts remain 503
sources / 105,627 bytes / 500 nodes / 2,000 edges and 1,006/503/504 source passes.

Preserve [run 36278262505](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36278262505)
attempt 1 **FAILURE**, artifact digests and all samples in ledger 18. Earlier production
failure `36210484651`, diagnostics `36213357271` / `36218397984`, macOS G1-V2 evidence
and R1 closure remain under their actual inputs in ledgers 13–18. Final G1/R1/R2 and
1G acceptance remain incomplete; no native operation is pending.

## Publication

Publish the reviewed documentation scope using repository-local noreply identity to
the existing branch; verify remote head and retain PR draft/open. The code candidate
above stays unchanged. Resolve the actual documentation publication SHA from Git/PR,
not a self-referential receipt commit. If push is blocked, retain the local checkpoint
and report that state. Stop after publication and one short G1-O1-N selector.
