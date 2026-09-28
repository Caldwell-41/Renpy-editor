# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-Q1-EXEC, `blocked`: single production dispatch rejected.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Candidate:** `b5de446389145c3da2e3f7d653673591d43d37fa`, verified on origin.
**Candidate tree:** `6e496ab05e59f90b6518fe65340028a91ca74ec4`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.
**Publication:** this documentation-only outcome is committed/pushed on the existing
branch with `[skip ci]`; resolve its exact successor SHA from Git, not as a new tested
candidate. No receipt-only follow-up commit is required.

## Execution outcome

The user selected Q1-EXEC only, one `production-scaffold.yml` request with
`upload_packages=true`, Windows `windows-2025` x64 and `macos-26` ARM64, no retry.
Fresh refs/access/rules/PR and toolchain/SDK pins were checked. Source selector audit
and gate rejection fixtures passed. GitHub rejected the single dispatch to workflow
`357322921` with HTTP 422 before creating a run:

```text
(Line: 70, Col: 18): Unrecognized named-value: 'runner'.
Located at position 1 within expression:
runner.os == 'Windows' && 'python' || 'python3'
```

Production job-level `env.Q1_PYTHON` is invalid; quality line 61 contains the same
expression. This is a confirmed workflow configuration defect, not a runtime failure.
The local preparation checks missed Actions expression-context validity.

The post-rejection audit at approximately 05:35 UTC returned **zero Actions runs for
the candidate SHA**. **No run ID, attempt, job or pending operation exists.** No package,
executable, archive digest or case report was produced. Both targets remain unqualified.
The latest production run is still historical failed `36293797731`, not this request.
No manual resume or polling is applicable to the rejected request.

[Q1 execution evidence](../tasks/active/testing-policy-alignment.md#r2-p1-q1-exec--standard-package-qualification--2026-09-28)
and [Phase 1G ledger 38](../tasks/active/phase-1g-branches-runtime-git.md#38-r2-p1-q1-exec--production-dispatch-rejected--2026-09-28)
contain the exact error, pins, access checks, consumed allowance and recovery scope.
One dispatch request, zero accepted CI runs, zero builds and zero application starts.
No retry, workflow correction, conflict resolution, merge or 1H was performed.
Repository validation and whitespace checks pass for this documentation publication.

## Capability and preserved evidence

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Prior candidate qualification retained; coherent final gates pending | MAC-N1 supporting assessment retained; Windows native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Prior closure retained; final-source SDK regression pending | Final packaged/native acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Standard two-target package qualification incomplete; Q1 dispatch rejected | Focused final user session on both platforms open |

WIN-F1 ledger 27 and MAC-N1 ledger 32 retain their candidate/fixture limits. TEST-P2
ledger 33 keeps Chrome timing diagnostic and functional/evidence failures blocking.
R2-P1 `36293797731`, attempt 1, and H1 `36310107481`, attempt 1, remain FAIL on their
original candidates. Their allowances are not renewed. The rejected Q1 request does
not grant an automatic replacement request.

## Next bounded action

Separately select a workflow-context correction only: use a permitted job/matrix
context for Python selection in both affected workflows, make the focused audit reject
the invalid placement and validate Actions expression semantics without dispatching.
Publish/review the correction first. Any new qualification request requires a separate
user selection; it is not authorized by this handover. No product changes, conflict
resolution, merge or 1H. Windows native/final human acceptance and integration remain
later stages. No specific Codex OS or physical test machine is needed for this correction.

```text
/goal R2-P1-Q1 workflow-context correction only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Any with repository access; no specific OS required.
Test execution: Local workflow semantic and gate checks only; no native builds or Actions dispatch.
Reason: Correct the HTTP 422 rejection before separately authorized qualification.
Read AGENTS.md and docs/status/HANDOVER.md and the linked Q1 execution ledger. Correct the invalid job-level runner context in both workflows, strengthen validation, publish and review the correction. No dispatch/retry, conflict resolution, merge or 1H.
```
