# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-Q1-EXEC after workflow-context correction, `awaiting_ci`.
**Continuation:** manual resume only; active polling stopped at the initial snapshot.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Tested candidate:** `8546dcddd5ac95bfe849575fe618f6e990cdd5d4`.
**Candidate tree:** `70ba924580bde3a66678e0ca91e1ae54fc241325`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.
**Publication:** this documentation-only successor is committed/pushed with `[skip ci]`;
resolve its exact SHA from Git. The pending run uses the candidate above, not this record.

## Exact pending operation

The user selected one new production request after the workflow-context correction.
Fresh refs, access/rules/PR, pins, workflow semantic lint and source audit were checked.
One dispatch succeeded with `upload_packages=true`:

| Field | Value |
| --- | --- |
| Run | [36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820) |
| Attempt / run number | **1** / **97** |
| Workflow | `357322921`, `.github/workflows/production-scaffold.yml` |
| Event / branch | `workflow_dispatch` / `feature/phase-1g-branches-runtime` |
| Head SHA | `8546dcddd5ac95bfe849575fe618f6e990cdd5d4` |
| Created | `2026-09-28T05:49:08Z` |
| Initial status | `in_progress`, conclusion null; API updated `2026-09-28T05:49:12Z` |
| Preflight job | `108804103380`, `ubuntu-latest`, started `2026-09-28T05:49:11Z` |
| Package targets | `windows-2025` x64 and `macos-26` ARM64 after Preflight |

Initial jobs snapshot: repository validation, bounded gate/retention fixtures, source
selector audit and Node/npm setup succeeded. Locked JavaScript dependency installation
was running. Frontend/protocol, Source Save browser and Rust formatting steps remained
pending. Windows/macOS dependent jobs were not yet listed. Artifact count was zero.
These are snapshot facts, not a claim that the run is still at that step when resumed.
No package/build/start count, executable hash, archive digest or final qualification
can yet be established from this evidence. Both target outcomes remain unaudited.

[Full execution record](../tasks/active/testing-policy-alignment.md#q1-execution-after-workflow-context-correction--2026-09-28)
and [Phase 1G ledger 40](../tasks/active/phase-1g-branches-runtime-git.md#40-q1-execution-after-context-correction--awaiting-ci--2026-09-28)
hold the request, access/pin checks, identity and remaining audit. Repository validation
and whitespace checks pass for this documentation publication.

## Budget and capability

Q1 totals: two dispatch requests, consisting of the earlier HTTP 422 rejection on
`b5de446` and this one accepted run, attempt 1; **zero retries**. The current selection
permits one Tauri build and five ordinary Runtime cases plus two boundary-smoke starts
per target. Actual counts remain pending audit. No local build or extra matrix ran.
Historical R2-P1 `36293797731` and H1 `36310107481`, both attempt 1, remain FAIL.
WIN-F1/MAC-N1 limits and consumed allowances remain unchanged. TEST-P2 keeps Chrome
timing diagnostic and functional/evidence failures blocking.

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Prior candidate qualification retained; coherent final gates pending | MAC-N1 supporting assessment retained; Windows native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Prior closure retained; final-source SDK regression pending | Final packaged/native acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Corrected standard two-target qualification dispatched; result unaudited | Focused final user session on both platforms open |

## Manual resume and remaining audit

Resume **only run 36383551820, attempt 1**. Do not dispatch or rerun. If pending,
record its current identity and stop again. Once terminal, audit prerequisite and
both target outcomes, all five case reports and boundary smoke, cleanup, SDK/core/
browser gates, privacy and dependency inventory. Verify recorded source inputs,
archive digests, retained executables and artifact availability; independently rehash
both executables, including the executable inside the macOS tar. Evidence/packages
have seven-day retention: collect available artifacts promptly after completion.
Missing, failed, cancelled or skipped gates are not passes; a green run alone is
insufficient. Preserve failures without retry/correction and publish the final audit.
No automatic wake-up is configured or claimed. No conflict resolution, merge, native/
human acceptance or 1H is selected. Codex may audit from any host with repository and
Actions/artifact access; physical machines are not needed for this automated evidence.

```text
/goal R2-P1-Q1-EXEC evidence audit only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Any with repository and Actions/artifact access; no specific OS required.
Test execution: Audit existing windows-2025 x64 and macos-26 ARM64 run 36383551820, attempt 1; no new execution.
Reason: Complete qualification evidence review for candidate 8546dcddd5ac95bfe849575fe618f6e990cdd5d4.
Read AGENTS.md and docs/status/HANDOVER.md. Resume this exact operation only. If pending, record and stop for manual resume; if terminal, audit all linked evidence and publish the ledger/handover. No dispatch, retry, correction, conflict resolution, merge or 1H.
```
