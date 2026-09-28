# Testing delivery policy and active-instruction alignment

**Updated:** 2026-09-28.
**Scope:** Adopt the approved retrospective operating rules; then, only if selected,
audit the current Phase 1G branch for outdated active testing instructions.
**Branch/PR:** feature/phase-1g-branches-runtime / draft PR #17.
**Rules:** [WORKFLOW](../../WORKFLOW.md#proportionate-delivery-rules).
**Continuation:** [HANDOVER](../../status/HANDOVER.md); one live handover only.
This is a bounded policy-migration task, not a new test framework or CI programme.

## TEST-POLICY-1 — rules implementation

**Authority:** the user approved implementing the seven rules, adding machine guidance
to generated goals, updating the repository and reviewing the commit against this
conversation. **State:** `review_ready`; workflow/test migration remains outstanding.
No new runtime qualification, builds, installs, CI, merge or specialist tests selected.

Incoming branch `ba403d38853c5625089216c59c6e175eac741ed6`, main
`4d7ba0333c48d60242a9a42d3e079fea499a5531`, existing open/conflicting draft PR #17
were inspected through GitHub. No newer published implementation or matching competing
rules task was found. Other branches/abandoned PR #12 are preserved. This environment
cannot inspect another machine's unpublished work. Recheck the branch before publishing
and use a non-forced descendant update; never replace a newer remote head.

### Conversation coverage

| Approved decision | Implementation |
| --- | --- |
| Match guarantees to the action; preserve data-loss protections | WORKFLOW rule 1, ADR 0010 retained |
| Prove risky real paths early on affected platforms | Rule 2; targeted agent-owned tests, not a matrix for every edit |
| Test actual user actions and prove gates reject failure | Rule 3; focused real integration, no wholesale unit-to-E2E duplication |
| Classify product/harness/environment/evidence/requirement failures | Rule 4; uncertainty and distinguishing experiments required |
| Budget each problem across chats and renamed checkpoints | Rule 5; two failed corrections of the same hypothesis trigger reassessment, never an automatic retry allowance |
| Align docs and executable gates; retain failed executables/evidence | Rule 6; migration gaps remain explicit and block conflicting commands |
| Evidence-based new blockers and clear status | Rule 7; ordinary data-loss/privacy defects can still block without a numbered requirement |
| Keep Codex where convenient; select test hosts separately | Host-routing section; Actions when sufficient, actual native app when needed |
| Tell the user when a particular machine is needed | Every copyable goal includes Codex machine, test execution and reason; required versus recommended is explicit; material access gaps disclosed |
| Minimal user physical testing, portable tooling and disposable data | Agent-owned routine verification, focused final human session, project-local tooling where feasible, isolated test projects/profiles |
| Short prompts and simple repository-first process | Maximum 4,000 characters; existing ledger/workflow, no new orchestration/approval framework |
| Preserve previous corrections and truthful historical results | Heap/cancellation regressions retained; no cross-SHA waiver, historical FAIL/skip remains unchanged |

Changed paths: AGENTS.md, docs/WORKFLOW.md, docs/status/CURRENT.md,
docs/status/HANDOVER.md and this task. The older detailed CURRENT summary is consolidated
into its existing Phase 1G evidence ledger references, with the original available in
Git history. No historical ledger content or test source is rewritten. INDEX already
routes WORKFLOW, CURRENT/HANDOVER and active tasks; no second canonical policy is created.

### Validation and review record

GitHub file/ref/PR reads succeeded. A local clone attempt failed because this execution
host could not resolve github.com; publication uses the available GitHub connector.
The review workspace is a changed-document snapshot, not a complete repository checkout.
Baseline AGENTS and WORKFLOW bytes were reconstructed and checked against their exact
Git blob hashes before editing. Local checks cover changed-document UTF-8/final newlines,
whitespace, balanced fences, new internal anchors/link targets, prompt length, policy
coverage and changed-path scope. All five documents and 26 relative link/anchor checks
passed; the goal template is 494 characters / 65 words. The local whitespace checker
initially treated `git diff --no-index`'s ordinary difference exit as a failure; it was
corrected to check diagnostics, then passed with a failing trailing-space text control.
These focused checks do not constitute the full repository validator.
No product/toolchain/SDK test, build or native launch occurred. Existing Q0 validator
results belong to Q0, not this edit. Publish with `[skip ci]`; a skipped workflow is
not passing qualification. Verify the published commit content/parent/ref and inspect
its diff before reporting completion; correct actual omissions rather than creating
receipt-only commits. The final chat reports that post-publication assessment.

## TEST-AUDIT-1 — proposed next review, not selected

**Codex machine:** Any with repository access; no specific OS required.
**Test execution:** Source/documentation/selector inspection and cheap document checks
only; no native application test or CI dispatch. A checkout is useful but GitHub reads
can support the review. Record unavailable full-checkout validation honestly.

Review the current feature head, AGENTS/WORKFLOW/TESTING, CURRENT/HANDOVER, the active
1G/1H/parent-plan instructions, ledger 34 and the actual workflow/embedded SDK selectors.
Use focused searches; do not reread every historical ledger or modify all old branches.
Classify each active instruction as keep, update, retire from routine selection,
specialist-only or historical evidence, with its user-facing requirement and test layer.
Record discrepancies in a short table with path/section, reason and proposed correction.

Priority checks: broad core/SDK commands containing excluded deliberate crash/namespace
exercises; obsolete full-current-disk graph proof; superseded Chrome timing blockers;
old diagnostic rerun requests and exhausted budgets; push-triggered expensive matrices;
missing failure-time executables; unimplemented evidence reuse; native/human ownership;
short machine-aware next prompts. Keep ordinary recovery/external-writer, heap-buffer,
cancellation/Stop, Source Save/draft and functional regressions, plus legitimate final
package/native gaps. Runtime-error scenario coverage is not automatically the same as
a deliberate application-crash experiment; inspect behavior before classification.

Correct clearly obsolete live documentation within that selected review scope. Mark
superseded directions and append the disposition to the owning active ledger; preserve
old runs, failures, candidates and evidence bytes. Do not rewrite historical failures
as successes or assume every old test should be removed. Do not impose retrospective
new integration tests on every completed feature without a demonstrated coverage gap.

Deliver one amended, bounded qualification preparation/execution proposal with exact
routine/specialist selectors, host choice, retained regressions, prerequisites, budgets
and publication/evidence requirements. Separate approved requirements from proposed
workflow/test changes. Q1's default remains both standard packaged targets and its five
existing runtime cases; changes need an explicit evidence-based decision, not a silent
waiver. Carry useful local evidence forward without repeating unrelated experiments.

**Stop boundary:** review/documentation only. No product/test/workflow implementation,
new tooling, package build, app launch, CI, hostile/crash execution, conflict resolution
or merge. Selection of TEST-AUDIT-1 does not select Q1. Update this ledger and the single
HANDOVER with results and one machine-labelled next goal; execution remains separate.
