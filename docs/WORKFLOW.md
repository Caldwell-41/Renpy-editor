# Repository-first delivery workflow

**Policy established:** 2026-09-19. **Delivery rules updated:** 2026-09-28.
Applies to future project and maintenance tasks.

## Authority and document ownership

The user chooses scope and approves goal execution. Repository documents make
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

Prompts select one coherent approved outcome and point to the repo. They must not be the only
location of requirements, test commands, unresolved risks or continuation state.
Avoid independent copies of a plan in attachments, PR comments and several Markdown
files. PRs link to the canonical plan; comments may record publication/CI receipts.

<a id="start-of-each-checkpoint-chat"></a>

## Goal entry and continuation

At the start of a substantive outcome or a genuine handoff, read AGENTS, CURRENT,
HANDOVER and only the active-plan sections relevant to that outcome. Narrow tasks use
applicable instructions and relevant task/contracts; consult live status when phase,
branch, acceptance or continuation matters. Inspect relevant remote refs, branch/PR,
recent changes and available local worktree ownership. Preserve unpublished and unrelated
work; report unavailable cross-host state. Verify that the recorded candidate exists.
Read relevant code, diffs and selected evidence sections. A linked archive is a lookup
destination, not a requirement to read the whole historical ledger. When needed or
requested by the user, follow its section link or search by issue, date, candidate or
result, then read the matching sections. INDEX routes to owning active/archive records.

Within the same thread, retain the established plan and decisions. After a pause,
check the pending operation, fresh refs/relevant diff, local edits and ownership.
Reread instructions that changed or context that is missing; do not repeat the full
startup audit merely because CI finished. Conflicting/new work requires reconciliation,
not a reset or second writer. A new timestamp is not evidence of integration.

The recorded working branch remains authoritative for unfinished work; main is the
integration baseline. If main moved, assess its relevant delta without force-pushing
or discarding work. Create a branch only when HANDOVER calls for one and fresh refs/PRs
show no matching work. Record the outcome/branch/PR early in the existing task ledger.

<a id="one-checkpoint-one-chat"></a>

## One outcome, internal checkpoints

A goal owns one meaningful, approved outcome, not an entire phase or project. An
implementation outcome normally includes diagnosis/planning, small coherent changes,
focused checks, self-review, bounded corrections and publication. These are internal
checkpoints, not automatically separate chats or approval requests. Required independent
review remains independent; it is not replaced by self-review.

A checkpoint can be a commit, a test result or a short decision record. Continue to the
next related checkpoint when it remains within the approved outcome, available host/tool
capabilities and cumulative budget. Do not require the user to select routine verification
again. Allow focused compilation/execution of changed tests in implementation goals;
select expensive package/native gates explicitly. Broader completion scope is not a
larger test matrix. Run cheap applicable checks first and retain exact skips/failures.

Pause when waiting on an external operation, a material decision/approval, missing
capability, exhausted budget or a user interruption. State the concrete reason and
next action. A new plan heading, commit or completed preparatory step is not by itself
a reason to stop. On an unresolved hypothesis, the two-correction reassessment rule
below still applies; a pause or continuation does not reset totals.

Default to the same chat for the same outcome. Use a new chat only for a genuinely
different outcome, deliberate independent review, unavailable/unusable context, a
host-transfer limitation or explicit user choice. Preserve a compact handover for any
transfer; keep the same problem identity and budget. Do not keep an entire project in
one growing thread. Detailed runbooks may guide methods without mandating every step;
shared invariants and acceptance criteria remain mandatory across models.

Keep existing repository states: `not_started`, `in_progress`, `awaiting_ci`, `blocked`,
`review_ready`, `accepted`. Use `awaiting_ci` for a confirmed nonterminal CI operation;
use `blocked` for an actual blocker, recording its cause. Neither is proof that the
Codex runtime is paused. Separate implementation, evidence and user acceptance.

Record the user instruction authorising the outcome and its real approval boundaries.
This policy replaces generic one-checkpoint/one-chat requirements, not specific user
limits. Historical review-only, no-execution/no-retry instructions remain binding for
that selection unless superseded explicitly. A larger proposed next goal takes effect
when the user selects it; printing a prompt is not execution approval. No implied
permission to install services, change security settings, exceed spending limits,
merge, clear a goal or advance into another feature.

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
CURRENT carries a short capability table separating implemented, automated proof
and native/human acceptance; HANDOVER carries the selected outcome's continuation
and one next action. Link detailed evidence instead of copying the historical ledger.
Preserve historical failures; label superseded directions
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

<a id="required-handover-before-ending-the-chat"></a>

## Checkpoint and handover cadence

Record meaningful decisions, completed increments, defects and evidence as they arise.
Do not rewrite the full handover or create receipt-only commits at each small step.
Before a genuine pause, transfer or completion, update the task ledger and replace the
live HANDOVER continuation once with sufficient recovery state. Update CURRENT when
overall project state changes. Keep detailed history in its owning ledger;
CURRENT/HANDOVER must agree about the live outcome and distinguish evidence from approval.

### Status-document maintenance

CURRENT is the project overview: accepted baseline, capability/acceptance state,
active workstreams and links. HANDOVER is the selected outcome's recovery record:
continuation location and candidate, key acceptance limits, pending operation/ownership,
material recovery state, cumulative budget reference and next action. Detailed procedures,
attempts, measurements and receipts belong in the owning task ledger; lasting behavior
and decisions belong in canonical technical docs/ADRs.

Aim for 200-400 words in CURRENT and 600-1,200 in HANDOVER. These are review targets,
not minimums or hard limits: shorter complete records are welcome; unique recovery needs
may justify more space. At each real handoff, review word counts and briefly explain any
necessary excess. Do not pad a short record or omit a needed recovery/acceptance fact.

Replace superseded live text instead of appending another earlier continuation. Link
directly to relevant evidence/checklist headings rather than duplicating them. Archive
links are for selective lookup, not default full-ledger reading. Preserve existing
justified archives and unique failures; create no snapshot for each chat. Git history
retains previous live wording. No new size validator is required.

### Handover fields

| Field | Required content |
| --- | --- |
| Outcome/checkpoint and state | Approved outcome, completed increments, implemented versus accepted status. |
| Continuation location | Branch/PR, candidate and available ownership/local-only state. |
| Evidence | Key results and exact workflow/run/attempt/SHA when applicable; section links to detailed commands, counts, artifacts and receipts in the owning ledger. |
| Pending operation | Last observed status, observation time, unresolved identity/access and artifact expiry. |
| Remaining work | Next action, relevant paths, blockers, approval boundary and cumulative budget reference. |
| Resume route | Same thread by default; actual client control or user action needed, not an invented helper. |
| Machine and tests | Required/recommended/no specific Codex OS, separate evidence hosts and missing capabilities. |
| Publication | Committed/published versus local-only work; limitations and safe recovery. |

Commit coherent work and publish a meaningful pause record to the authorised branch;
verify publication. A docs-only successor may record a preceding implementation/test
candidate but does not become that candidate. Do not chase the handover commit's own
SHA. If publication fails, preserve local work and disclose it rather than claim a
remote handover. Do not trigger a package matrix solely to publish a wait record.

<a id="lightweight-next-chat-prompt"></a>

## Lightweight goal and resume prompts

New goals select an outcome with a finish line, verification surface, limits and the
canonical task path. Keep them short, normally near 100 words where practical and
always within 4,000 characters. Include, inside the copyable goal:

- **Codex machine:** no specific OS, or the required OS/architecture/capability;
  distinguish recommended from required.
- **Test execution and reason:** relevant local/Actions targets or no native tests;
  both-target evidence does not automatically require two local Codex sessions.
- **Access/prerequisites:** only material needs; disclose unknown availability.

Do not copy the full implementation plan or add blanket maximum reasoning effort.
Use task-appropriate effort and existing settings; changing account/client configuration
requires its own authority. Read only what is needed, and use available usage records
rather than invent savings or measurements.

Template for a bounded documentation outcome (resolve placeholders before delivery):

```text
/goal Complete <approved documentation outcome>
Repository: Caldwell-41/Renpy-editor
Branch: <recorded branch>
Codex machine: Any with repository access; no specific OS required.
Test execution: Relevant documentation checks; no native build or app launch.
Reason: Documentation-only outcome.
Read AGENTS.md, docs/status/HANDOVER.md and <selected task section>. Implement,
check, review and publish the approved outcome using internal checkpoints. Pause
only at a genuine blocker/approval boundary; preserve the same goal and thread.
```

A workflow wait gets a short same-thread continuation message, not a new /goal.
The pause report supplies the recorded operation and host/access requirements; an
ordinary `Resume the existing goal and audit the recorded workflow run` message
need not repeat those fields or the plan. This message is steering, not a replacement
for a client's actual Goal Resume control. At completion, give a next-outcome prompt
when useful/requested, with any pending approval explicit. For a real transfer, include
branch, task, handover, pending operation and unchanged budget in the recovery prompt.

## Waiting without model polling

**Default: manual same-thread resume.** A workflow wait pauses execution of the current
outcome; it does not complete the outcome, create a new one, or require a new chat.

1. **Start and record.** Check existing operations, candidate and allowance; dispatch
   only the authorised workflow. Capture workflow/run ID, attempt, exact head SHA,
   branch, material inputs and last observed status/time. Record the remaining audit
   and applicable budgets in HANDOVER/the ledger. A successful request without a
   confirmed run identity is not a confirmed run; a rejected request is not pending
   CI. Preserve ambiguous dispatch state and resolve it without duplicate dispatch.
2. **Actually pause.** Publish the checkpoint and end active model polling. For an
   autonomous Codex Goal, use only a documented, available and authorised lifecycle
   control and confirm its result. If the agent cannot pause it, tell the user to use
   the client's actual pause control. In the CLI this is `/goal pause`; use the
   installed app's verified equivalent rather than assuming identical commands.
   A prose reply, a Markdown `awaiting_ci` label or an ended turn is not proof of a
   runtime pause. Never mark unfinished work complete just to stop continuation.
3. **Resume on user command.** The user returns to the same thread and uses its actual
   Resume control (`/goal resume` in the CLI), optionally adding `The workflow is
   complete; audit the recorded run and continue the existing goal.` A normal chat
   without autonomous Goal mode can continue with that message alone. If the client
   was closed, reopen/resume the saved thread instead of creating a new goal. Do not
   clear/reset the goal, install watchers or manipulate private client state.
4. **Verify and continue.** Read the recorded run/attempt, current terminal status and
   relevant repository/worktree changes. Treat the user's completion report as the
   cue to check, not proof of success. If still pending, preserve the identity and
   pause again; do not start an autonomous check loop. If terminal, audit required
   jobs/artifacts/identity and continue the remaining authorised work. Missing, expired,
   failed, cancelled or skipped evidence stays unresolved; a green badge is not enough.
   Changed refs or a newer attempt do not silently replace the recorded candidate.

Resume never grants a retry, new dispatch, extra build, broader correction or merge.
Bounded fixes continue only when already covered by the outcome and remaining allowance;
otherwise name the decision needed. Do not re-audit unrelated history, rewrite unchanged
wait records or start a second executor just because CI is slow. Respect one writer.

There is no model polling, keep-alive loop, automatic notification or automatic wake-up
in this policy. A user-requested status check is permitted. W0/OPT-1A automatic wait/wake
remains abandoned; this does not authorise client-database edits, a scheduler, service,
new orchestration framework or work on PR #12. No client pause/resume capability is
claimed validated by a documentation change.

Official references checked 2026-09-28: [Codex Goal commands](https://developers.openai.com/codex/cli/slash-commands/),
[Goal lifecycle and user/system authority](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex),
and [one chat per coherent outcome](https://developers.openai.com/codex/learn/best-practices/).

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

Finish with short live status records for the next actual state under
[status-document maintenance](#status-document-maintenance). A completed milestone's
old checklist and next-step prompts remain historical; do not present them as pending
work or treat completion as selection of the next milestone.

Do not generate a snapshot for every chat. Existing historical snapshots may remain
until a link/evidence audit proves they can be consolidated. Never remove runtime
journals or unacknowledged events as documentation cleanup. Finish by checking links,
privacy/secrets, whitespace, changed-path scope and actual remote publication.
