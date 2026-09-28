# Repository-first delivery workflow

**Policy established:** 2026-09-19. **Delivery rules updated:** 2026-09-28.
Applies to future project and maintenance tasks.

## Authority and document ownership

The user chooses scope and approves checkpoint execution. Repository documents make
those decisions durable; they do not grant themselves additional authority. New user
instructions take precedence and must be recorded before conflicting work continues.

| Location | Owns |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Stable operating rules and entry points. |
| [CURRENT.md](status/CURRENT.md) | Current project state, accepted baseline and active workstreams. |
| [HANDOVER.md](status/HANDOVER.md) | One live continuation record: branch, checkpoint, evidence and next action. |
| `docs/tasks/active/` | Detailed scope, implementation plan, checkpoint gates and execution ledger. |
| [WORKFLOW.md](WORKFLOW.md) / [TESTING.md](TESTING.md) | Workflow owns test selection, investigation budgets and host routing; TESTING owns technical gates and evidence details. |
| Canonical technical docs / `docs/adr/` | Durable behavior, decisions, lessons and operational contracts. |
| `docs/tasks/archive/` | Completed task evidence and historical decisions, not current instructions. |

Prompts select a task/checkpoint and point to the repo. They must not be the only
location of requirements, test commands, unresolved risks or continuation state.
Avoid independent copies of a plan in attachments, PR comments and several Markdown
files. PRs link to the canonical plan; comments may record publication/CI receipts.

## Start of each checkpoint chat

Read AGENTS, CURRENT and HANDOVER from the indicated working branch, then the active
plan sections relevant to this checkpoint. Inspect remote refs, open PRs, recent
commits and the local worktree. Verify that the recorded candidate is present and
that no other chat is already writing this checkpoint. Preserve unrelated edits.
Read relevant code, diffs and directly linked evidence; do not sweep every historical
ledger unless the selected task requires it.

An existing working branch is authoritative for unfinished checkpoint work. Main is
the integration baseline, not permission to ignore unmerged progress. If main moved,
review its delta and reconcile safely without resetting or force-pushing. If HANDOVER
says no implementation branch exists, create its named branch from freshly verified
main only after checking that the branch or corresponding PR has not appeared meanwhile.

Record the branch/PR and checkpoint-in-progress in the repository early. Before an
external wait or interruption, publish sufficient state to resume without asking the
user to reconstruct the previous chat.

## One checkpoint, one chat

The chat performs the selected approved checkpoint, self-reviews its diff, runs the
specified gates, fixes scope-bounded findings, and troubleshoots that checkpoint with
the user. It must not continue into a later checkpoint automatically, even if tests
pass early or the later checkpoint looks easy.

Run cheap applicable checks before expensive or scarce-runner gates. Push coherent
checkpoint changes. Report exact test counts, skips and relevant failure excerpts;
do not paste complete successful logs into handovers or chat.

Checkpoint states are `not_started`, `in_progress`, `awaiting_ci`, `blocked`,
`review_ready`, and `accepted`. Record implementation/test outcome separately from
user acceptance. Missing host access or tests means blocked/partial, not passing by
substitution. A feasibility investigation can finish with a no-go report without
satisfying its capability gate.

Before starting, record which user instruction authorises the checkpoint. Approval
of a plan is not approval to install services, change security settings, incur unrelated
usage, merge application work or expand scope. A next-chat prompt cannot manufacture
approval: it selects the bounded checkpoint the user elects to start.

## Proportionate delivery rules

The user approved these seven rules after the Phase 1G retrospective. They govern
future work and supersede conflicting generic run-everything instructions, not
existing application safeguards or specific acceptance requirements. Read
[TESTING](TESTING.md), [ADR 0010](adr/0010-local-project-safety-and-observed-flow.md)
and the selected task together. A known selector/policy conflict is an alignment
blocker for that operation, not permission to run excluded tests or claim a pass.
Record necessary migration separately; a rules-only edit does not change CI behavior.

### 1. Match guarantees to the action

Read-only derived views do not inherit save/transaction or execution guarantees
without an explicit product requirement. Preserve save/reopen/undo, ordinary
external-writer conflicts, interrupted-save recovery, retained drafts, malformed-input
handling, basic path/link protections, narrow permissions and explicit execution.
Keep deliberate hostile filesystem and deliberate crash experiments outside routine
selection; running them requires a separately approved specialist task. Retain their
historical evidence and working protections. Less routine coverage of excluded
scenarios is an explicit scope trade-off, not proof those risks cannot recur.

### 2. Prove the riskiest real path early

Before broad implementation of a platform-sensitive feature, select and prove one
small representative production-path slice on each affected supported OS. Examples:
a real release executable reaches the SDK and stops the owned game; a real service
reads the representative graph fixture within an enforced budget. A mock, synthetic
spike or passing test-harness thread does not substitute for that path.
Use targeted agent-owned checks, not a full installer matrix at each checkpoint.
Portable changes need not trigger both native hosts. Select affected platforms from
the changed shared/native code, dependencies and packaging, not convenience. Missing
target access leaves that proof incomplete; it does not become user physical testing
or prohibit unrelated, already authorised portable work. Existing qualified slices
need not be re-proved without a relevant change; reuse still follows the actual policy.

### 3. Test the user action and the rejecting gate

For new/changed asynchronous actions, include focused coverage across the actual
frontend controller/helper and production dispatch/service boundary. Exercise relevant
cancellation, held-owner contention, stale completion and retained input. Two isolated
unit tests are not automatically combined-path proof. Keep unit tests; do not copy
every case into an expensive end-to-end suite. Use the narrowest real integration
seam, with final native/package checks where their behavior matters.
Before an acceptance gate is trusted, demonstrate that a known ordinary failure is
rejected: a wrong/missing required result, zero intended tests, a skipped required
case or a violated blocking budget must not silently pass. Intentional specialist
exclusions and timing-only diagnostics retain their distinct status. Validate fixtures
and timing endpoints cheaply before packaging.
Use controlled data/assertion failures, not newly introduced deliberate process
crashes or attack experiments. Retain minimal regressions for actual product defects,
including SDK heap-buffer and receipt-cancellation fixes, when reorganising tests.

### 4. Classify failures before fixing

Record the observed failure as product defect, harness defect, environment limitation,
missing evidence or requirement mismatch; multiple/provisional classifications are
allowed. State evidence, uncertainty and the smallest discriminating experiment.
A red job alone is not a diagnosis. Do not change production code to satisfy an
unvalidated harness or relax a threshold to turn a run green. Reproduce at the failed
layer; use a native target when that is needed to assess actual desktop behavior.
Keep Chrome timing-only diagnostics distinct from blocking functional/evidence
failures under TESTING. Hosted browser timing alone does not establish a native
renderer defect. Conversely, an environment explanation does not waive missing native
qualification. Keep failed statuses and all relevant measurements on their real inputs.

### 5. Budget the problem, not the checkpoint name

Keep one compact problem record in the active task ledger: problem ID, hypothesis,
classification/evidence, attempted corrections and results, cumulative builds/launches/
CI runs, and next discriminating action. Preserve tighter user-selected caps and
record available elapsed/cost information honestly; do not invent usage measurements.
Default: after two unsuccessful correction attempts at the same hypothesis, stop
repeating it and reassess requirement, test validity and implementation layer. Chat,
agent, branch, checkpoint or host changes do not reset the problem's totals or grant
new allowance. A changed hypothesis must cite new evidence and still fit the approved
scope and remaining budget; broader work or exhausted caps require a new decision.
This is not two automatic retries: existing no-retry/no-duplicate rules still apply.
Unresolved genuine failures remain blocking, not waived at the attempt limit. Do not
reopen a closed finding without a relevant changed input or new evidence. Reuse the
existing ledger; do not introduce a tracking service or heavyweight approval system.

### 6. Make policy and executable gates agree

A gate-policy migration is incomplete until docs, commands/selectors, embedded test
calls, required markers, workflow conditions and artifact behavior agree. Keep routine
regressions and specialist experiments independently selectable; do not hide excluded
exercises inside broad lifecycle/SDK tests or exclude every test named `race`/`crash`.
Audit behavior, not just names. Preserve ordinary recovery via approved non-crashing
fault/state fixtures when deliberate termination experiments are excluded.
Run cheap affected checks frequently. Use focused local/target checks during iteration
and the required coherent-candidate package qualification at the selected milestone.
No duplicate expensive matrix solely for documentation, a handover or an equivalent
merge event; changed integrated inputs and repository-required checks still need their
actual applicable gates. Do not invent a cross-SHA acceptance waiver. Amend triggers
only in approved implementation scope; until then, report current trigger behavior.
Where independent checks can safely continue after a diagnostic/nondependent failure,
collect their evidence without normalising a blocking failure to success. Respect real
prerequisites. Retain exact tested executables on failure where produced, separately
from success-only installers, with run/attempt/SHA, source/binary hashes, logs and case
results; verify availability. Use existing scripts/workflows, not a new CI controller.

### 7. Justify blockers and keep status readable

Every new blocker identifies the approved requirement or credible user harm, supporting
evidence and smallest necessary correction. A previously unstated ordinary data-loss,
privacy or functional risk may still block; do not dismiss it for lacking a numbered
requirement. Distinguish a demonstrated defect, missing required evidence, a hypothesis
and optional improvement. New capability/threat-model scope needs an explicit decision,
not an automatic expansion of acceptance. Keep safety and honest failure reporting.
CURRENT/HANDOVER carry a short capability table separating implemented, automated proof
and native/human acceptance, plus one next action. Link detailed evidence instead of
copying the historical ledger. Preserve historical failures; label superseded directions
rather than rewriting results or turning past exclusions into passes.

## Test host routing and ownership

Choose the Codex execution host independently from the required test hosts. Ordinary
development can stay on the user's convenient machine; Windows is a reasonable default,
not a requirement. A capable agent can coordinate authorised Windows/macOS Actions jobs
without moving the Codex session. Do not assume dispatch, native drivers or host access
exist: verify actual capabilities before promising them. Never start a second writer
or install remote/self-hosted infrastructure to work around an unavailable capability.

| Work | Codex machine | Evidence host |
| --- | --- | --- |
| Docs, planning and portable logic | Any suitable host with repository access | Cheap relevant checks; no native run merely for docs |
| New shared platform-sensitive path | Either development host | Early narrow Windows x64/macOS ARM64 checks for affected targets; Actions when sufficient |
| Windows crash, process/filesystem or packaging diagnosis | Local Windows preferred for repeated debugging; required only when the selected task needs its local capability | Affected Windows executable/path; shared changes also qualify affected Mac behavior |
| macOS rendering, focus, native input/window behavior | Local macOS when physical/native interaction is required; a proven equivalent accessible host may suffice | Actual packaged native app; a hosted Chrome result alone cannot substitute |
| Final milestone qualification | Any host able to coordinate/review the approved run | Required Windows/macOS package matrix and remaining native/human evidence |

Run local application scenarios only against disposable projects and isolated profiles,
not real game projects. Use pinned/locked dependencies and verify the local environment;
prefer project-local portable tooling where feasible, keeping machine paths ignored.
Additional tooling/system changes need the selected task's existing authorization;
this policy does not grant new installation or access rights.
The agent owns routine development/automated/native verification. Retain the focused
final human acceptance session on both platforms; do not add manual testing at every
checkpoint or automatically repeat unchanged human checks in 1H. TESTING's actual
reuse rule and changed-scope assessment apply. Expected effect: slightly more precise
early tests, fewer speculative/full-matrix reruns; no quantified saving is claimed.

## Required handover before ending the chat

Update the existing HANDOVER.md and the active plan's ledger. Keep HANDOVER focused;
put lengthy diagnosis and durable lessons in the ledger/canonical docs and link them.

| Field | Required content |
| --- | --- |
| Task/checkpoint and state | Exact identifier, approved scope, implemented versus accepted status. |
| Continuation location | Repository, branch, PR if any, latest verified baseline/candidate. |
| Completed work | Relevant commits/files, decisions and regressions; no transcript dump. |
| Validation | Exact commands, environment and outcomes; run ID, attempt, SHA, jobs/evidence where applicable. |
| Remaining work | Blockers, failed/skipped/unavailable gates, outstanding operations and safe recovery action. |
| Lessons | Canonical document/test paths containing lasting learning. |
| Next action | One bounded checkpoint or recovery step and whether approval is still required. |
| Machine and tests | Codex machine required/recommended/none, separate evidence hosts, reason and unmet access/tooling needs. |
| Problem budget | Relevant problem ID, attempted hypotheses and cumulative allowances; link the ledger instead of resetting counters. |
| Publication | What is committed/pushed; any local-only work and why it could not be published. |

Record the implementation candidate SHA, not an impossible self-referential SHA of
the handover commit still being written. A docs-only follow-up commit may name a
preceding candidate. Resolve and report actual published head after committing.
Do not make another commit solely to chase a document's own hash, and do not create
receipt-only commits whose only purpose is to record their own publication.

Commit coherent changes, push to the recorded authorised branch, and verify remote
content before saying the handover is available. If publishing fails, report the
failure and local-only state; do not give a prompt implying a nonexistent remote
checkpoint. Keep final chat summaries short but honest about limits.

## Lightweight next-chat prompt

Use a short selector, normally under 100 words and always at most 4,000 characters.
Every generated goal prompt (including recovery/review/setup prompts) must state these
fields inside the copyable prompt, and briefly explain any required machine to the user:

- **Codex machine:** explicitly no specific OS, or the required OS/architecture and
  capability; label mere recommendations as recommended rather than required.
- **Test execution:** local target(s), GitHub Actions target(s), or no native testing,
  with a short reason. Both-target tests do not automatically mean two local sessions.
- **Access/prerequisites:** include only material missing capabilities; mark unknown
  availability instead of inventing a working host, driver or toolchain.

Resolve placeholders before delivery. A docs-only example is:

```text
/goal — <checkpoint> only
Repository: Caldwell-41/Renpy-editor
Codex machine: Any with repository access; no specific OS required.
Test execution: Documentation checks only; no native build or app launch.
Reason: This checkpoint changes documentation only.
Continue branch <recorded branch>. Read AGENTS.md and docs/status/HANDOVER.md,
then the linked active plan. Complete only <checkpoint>, verify it, publish the
checkpoint ledger and handover, and stop. Give me the short next-chat prompt.
```

For a platform-bound prompt, replace the example machine/test fields with the actual
required or recommended host and explain why. Do not leave a generic Any claim when
the selected task needs physical native input, platform debugging or unavailable tools.
For a blocked checkpoint, select the documented recovery step, not a later milestone.
For an approval gate, state the pending decision. Do not embed the implementation
specification or imply that merely printing a prompt has approved its execution.

## Waiting without model polling

Record operation identity and continuation state before a long wait. Use an ordinary
observer and an actually qualified continuation mechanism. Distinguish a queued
message from a started turn and a claimed event. Never reset a goal or start a second
executor merely because the external operation has not finished.

Until automatic waiting is implemented/qualified, use a published manual-resume
handover and end the working turn. No repeated status-check turns, keep-alive prompts,
or extra model used as a watcher. Ordinary API polling by a script is permitted.
A user-requested status check is not an autonomous polling loop.

## Integration and branch cleanup

At the plan's authorised integration checkpoint, review the exact candidate and
required evidence, merge useful completed work into main through current repository
policy, and verify the resulting tree/status. Never bypass required checks; evidence
reuse requires the implemented policy and truthful equivalence reporting.

Inventory branches and open PRs before cleanup. Delete a branch only after proving
its work is integrated or safely redundant and no active task depends on it. Use
ancestry where applicable; for squash/cherry-pick histories, review content/patch
equivalence and PR merge evidence. Names and timestamps are not proof. Do not merge
redundant old branches just to enable deletion.

Keep branches with unique/unreviewed changes and open dependency/application work;
record why they remain. Do not delete main, protected refs, archive tags or local
uncommitted work. Report retained exceptions rather than forcing an empty branch list.
The user's cleanup instruction authorises safe retirement after implementation,
not premature deletion during feasibility/planning.

## Documentation cleanup

Consolidate architecture decisions, operational recovery instructions and regression
lessons before archiving a completed task. Preserve unique acceptance/failure evidence
and unresolved issues. Archive the completed task/ledger with a final status and update
INDEX/CURRENT/HANDOVER links. Pure duplicate handovers can be removed once useful
content is preserved; Git history retains earlier live HANDOVER revisions.

Do not generate a snapshot for every chat. Existing historical snapshots may remain
until a link/evidence audit proves they can be consolidated. Never remove runtime
journals or unacknowledged events as documentation cleanup. Finish by checking links,
privacy/secrets, whitespace, changed-path scope and actual remote publication.
