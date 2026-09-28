# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** Q1 workflow-context correction, `review_ready` after local validation.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Starting publication:** `5e3ac871b7bab195223a66222e68777bebe03a35`, verified on origin.
**Correction identity:** this checkpoint's successor commit; resolve exact SHA from Git.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.
**Publication:** correction, checks and this handover are committed/pushed together on
this branch with `[skip ci]`. No receipt-only follow-up commit is required.

## Diagnosis and correction

The user asked to diagnose and fix the failed dispatch. GitHub rejected job-level
`env.Q1_PYTHON` because `runner` is unavailable there. Both production and quality
workflows now use `matrix.runner == 'windows-2025'`, preserving `python` on Windows
and `python3` on macOS. The previous focused audit required the invalid expression;
its fixtures repeated that error. The audit now checks the valid job-level selection
and rejects the original context, wrong mapping/scope, duplicates and bare helper calls.

Independent actionlint 1.7.12 reproduced the two original context errors and passes
both corrected workflows. Source audit and gate self-tests pass. Repository validation
and whitespace checks pass. TESTING records the independent semantic check before
future dispatches. No application behavior, target, gate, dependency pin or package
scope changed. No Actions dispatch, native build or app/SDK launch was performed.
Hosted workflow behavior and standard package qualification remain unverified.

[Correction evidence](../tasks/active/testing-policy-alignment.md#q1-workflow-context-correction--2026-09-28)
and [Phase 1G ledger 39](../tasks/active/phase-1g-branches-runtime-git.md#39-q1-workflow-context-correction--2026-09-28)
record the context rule, exact portable linter/checksum, checks and scope limits.

## Prior operation and capability

The prior Q1 request against `b5de446389145c3da2e3f7d653673591d43d37fa` was rejected
with HTTP 422 before creating a run. Its audit returned zero candidate runs. There
is no Q1 run ID, attempt, job, package artifact or pending operation to resume.
The [original execution record](../tasks/active/testing-policy-alignment.md#r2-p1-q1-exec--standard-package-qualification--2026-09-28)
is preserved. Totals remain one rejected request, zero accepted Q1 runs/builds/starts.
This correction does not grant an automatic replacement request.

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Prior candidate qualification retained; coherent final gates pending | MAC-N1 supporting assessment retained; Windows native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Prior closure retained; final-source SDK regression pending | Final packaged/native acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Standard two-target qualification incomplete; workflow context corrected locally | Focused final user session on both platforms open |

WIN-F1 ledger 27 and MAC-N1 ledger 32 retain their candidate/fixture limits. TEST-P2
ledger 33 keeps Chrome timing diagnostic and functional/evidence failures blocking.
R2-P1 `36293797731`, attempt 1, and H1 `36310107481`, attempt 1, remain FAIL on their
original candidates. Their allowances are not renewed.

## Next bounded action

Separately select one new production qualification request under the existing
[Q1 scope](../tasks/active/testing-policy-alignment.md#amended-r2-p1-q1-proposal--not-selected).
Recheck the published correction and access, dispatch once with `upload_packages=true`,
no retry, then audit evidence. If pending, publish exact run/attempt/SHA and stop for
manual resume. Neither this document nor the correction authorizes that request.
Windows native/final human acceptance and integration remain later stages; no conflict
resolution, merge or 1H. Codex can coordinate from any repository/Actions-capable host;
physical machines are not required for the hosted automated matrix.

```text
/goal R2-P1-Q1-EXEC after workflow-context correction only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Any with repository and Actions access; no specific OS required.
Test execution: One new production request on windows-2025 x64 and macos-26 ARM64, upload_packages=true; no physical machine needed.
Reason: Qualify the corrected workflows and standard packages.
Read AGENTS.md and docs/status/HANDOVER.md. Recheck the published correction, refs and access. Authorize one new dispatch under the linked Q1 scope; no retries. Audit evidence and publish the ledger/handover. If pending, record exact run/attempt/SHA and stop for manual resume. No conflict resolution, merge or 1H.
```
