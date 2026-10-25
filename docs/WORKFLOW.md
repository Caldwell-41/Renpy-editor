# Repository-first delivery workflow

**Policy established:** 2026-09-19. **Delivery rules updated:** 2026-09-28.
**CI routing and qualification cadence amended:** 2026-10-10, user approved.
**Host-neutral clarification and harness prevention:** 2026-10-16, user approved.
**Standing 3B scheduling exception and delivery allowances:** 2026-10-22, user directed.
**Parallel agents in separate worktrees:** 2026-10-22, user directed.
**Operation limits and root-cause debugging:** 2026-10-25, user approved.
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
| `docs/tasks/active/` | Current outcome briefs, scope, acceptance, applicable limits and remaining work. |
| `docs/tasks/reference/` | Substantial requirements disclosed by task branch; each requirement has one current owner. |
| `docs/tasks/evidence/` | Linked execution history, detailed validation receipts, failures and historical directions. |
| [WORKFLOW.md](WORKFLOW.md) / [TESTING.md](TESTING.md) | Workflow owns test selection, operation limits and host routing; TESTING owns technical gates and evidence details. |
| `docs/testing/` | Focused current technical runbooks; INCIDENTS is a compact lookup index linking to original task evidence. |
| Canonical technical docs / `docs/adr/` | Durable behavior, decisions, lessons and operational contracts. |
| `docs/tasks/archive/` | Completed task evidence and historical decisions, not current instructions. |

Remaining Phase 3B delivery uses the [GitHub task ownership exception](#phase-3b-github-task-ownership);
the table continues to apply to other work and to 3B product contracts, evidence and status.

Prompts select one coherent approved outcome and point to the repo. They must not be the only
location of requirements, test commands, unresolved risks or continuation state.
Avoid independent copies of a plan in attachments, PR comments and several Markdown
files. PRs link to the canonical plan; comments may record publication/CI receipts.

## Task briefs and supporting files

[ADR 0019](adr/0019-task-briefs-and-evidence-ownership.md) records the ownership
decision. Maintain the following separation when creating or updating task documents.

For a new substantial outcome, adapt the optional [task brief template](tasks/TEMPLATE.md).
Small changes may use a short complete record in their owning task.

A brief contains the selected outcome and authorization, current scope, acceptance
criteria, applicable constraints and operation limits, unresolved decisions and next action.
Replace obsolete live instructions when state changes. Keep a compact acceptance
map linking each criterion or coherent group to its result and supporting evidence;
failed, missing and pending proof stays visible alongside passing results.

Put detailed attempts, validation receipts, artifact inventories and superseded
prompts in `docs/tasks/evidence/<task>.md`. Start with one evidence file per
substantial outcome, and split only for a useful retrieval boundary. A small task
may keep a short result in its brief while there is no substantial history to disclose.
Label historical records with their owning brief and observation period. Preserve
original results, candidate identities, uncertainty and consumed allowances. Raw logs,
packages and private artifacts remain outside Git under the evidence/privacy rules.

Split substantial current requirements into `docs/tasks/reference/` or separate
outcome briefs when they apply to independently selected branches. Keep what every
branch needs in the brief. Give each rule one current owner and point shared work
there. Canonical technical docs and ADRs own lasting behavior and decisions.

Write pointers with a retrieval condition: read a requirement reference when changing
that branch; read matching evidence when diagnosing a failure, assessing result reuse,
recovering needed state or performing a requested audit. Evidence links do not require
loading an entire ledger at task entry. Historical instructions cannot select work,
renew allowances or replace the current contract. If old wording is still required,
make its current authority explicit in the live brief/reference.

Review a brief that exceeds roughly 1,000 words or covers several independent outcomes.
This is a prompt to inspect its hierarchy, not a hard limit or a reason to omit
acceptance criteria. When relocating material, account for all unique requirements
and evidence, repair relative and inbound section links, and verify the current
contract against the original and later amendments. Link maintenance may repair an
accepted ADR's references without changing its decision or recorded result.

### Phase 3B GitHub task ownership

After all issues/dependencies verify, the reviewed ownership commit is published
and the parent records its cutover receipt, [the 3B parent](https://github.com/Caldwell-41/Renpy-editor/issues/22) owns remaining Phase 3B
delivery coverage, dependencies and aggregate acceptance. Its 11 B groups own
aggregate requirement acceptance. The selected L work ticket owns bounded scope,
acceptance, current blocker, selected authorization and applicable operation limits. Read
P3B, the relevant group and selected leaf for 3B entry, review or continuation.
Follow [the tracker convention](agents/issue-tracker.md).
The [standing 3B scheduling exception](tasks/reference/phase-2-3-delivery.md#standing-phase-3b-scheduling-exception)
removes final Phase 2/3A acceptance as a start prerequisite for all remaining 3B
tickets. Preserve outstanding acceptance, actual technical dependencies and protected
recovery. Canvas work stays deferred until the user explicitly selects it.
If tracker access is unavailable, preserve local work, report the access blocker
and resume when access returns. This migration adds no offline snapshot protocol
or parallel task record.

The [Screens contract](tasks/reference/phase-3b-screens.md) and pinned design
approval retain approved product requirements and decisions. Canonical docs/ADRs
own lasting behavior; repository task evidence owns detailed results, failed
attempts, exact candidate/artifact identity and historical allowance use. CURRENT
and HANDOVER retain project state and live recovery, linking the selected issue.
Keep the live requirement-ID-to-outcome/work-ticket and acceptance map in the parent,
with direct evidence links. The repository migration table is a dated baseline. Delivery
reassignment updates the parent; a product requirement change updates its repository
contract and the parent map. Do not create a
second 3B execution brief or copy a full backlog into status files.

After the user selects a new outcome, apply [operation limits and reassessment](#5-operation-limits-and-reassessment).
The selected leaf owns any applicable limits and their consumption. If an outcome
spans leaves, link that record instead of duplicating it. Routine work needs no
numerical allowance. Preserve explicit existing limits and historical results.
Closed proof/design/Help selections stay closed. No issue state,
label or assignment grants execution, retry or publication authority. Keep the
existing not_started/in_progress/awaiting_ci/blocked/review_ready/accepted meanings;
GitHub open/closed alone does not represent these acceptance states. Close a child
only with its acceptance decision, or an explicit recorded scope disposition.

This exception applies only to remaining 3B delivery, under ADR 0020. The accepted
ADR 0019 split still governs every other task. The Help brief is retained as the
historical selected execution contract; its original results and limits remain
intact. New 3B issues do not renew its allowance or change other phases' entry gates.

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

After the published cutover receipt, substitute P3B, its relevant B group and
the selected L work ticket for
the active execution brief, then read only the applicable product contracts and evidence.

Within the same thread, retain the established plan and decisions. After a pause,
check the pending operation, fresh refs/relevant diff, local edits and ownership.
Reread instructions that changed or context that is missing; do not repeat the full
startup audit merely because CI finished. Reconcile conflicting/new work with the
assigned worktree owner; preserve local changes. A new timestamp is not
evidence of integration.

The recorded working branch remains authoritative for unfinished work; main is the
integration baseline. If main moved, assess its relevant delta without force-pushing
or discarding work. Create an outcome or agent branch when the selected assignment
requires one and fresh refs/PRs/worktrees show no suitable existing work. Record its
owner, base and integration destination in the owning task.

<a id="one-checkpoint-one-chat"></a>

## One outcome, internal checkpoints

A goal owns one meaningful, approved outcome, not an entire phase or project. An
implementation outcome normally includes diagnosis/planning, small coherent changes,
focused checks, self-review, bounded corrections and publication. These are internal
checkpoints, not automatically separate chats or approval requests. Required independent
review remains independent; it is not replaced by self-review.

A checkpoint can be a commit, a test result or a short decision record. Continue to the
next related checkpoint when it remains within the approved outcome, available host/tool
capabilities and applicable operation limits. Do not require the user to select routine verification
again. Allow focused compilation/execution of changed tests in implementation goals;
select expensive package/native gates explicitly. Broader completion scope is not a
larger test matrix. Run cheap applicable checks first and retain exact skips/failures.

Pause for an external operation, a material decision/approval, missing capability,
a reached operation limit that blocks remaining work, or a user interruption. State the concrete reason and
next action. A new plan heading, commit or completed preparatory step is not by itself
a reason to stop. On an unresolved hypothesis, the two-correction reassessment rule
below still applies; a pause or continuation does not reset totals.

Default to the same chat for the same outcome. Use a new chat only for a genuinely
different outcome, deliberate independent review, unavailable/unusable context, a
host-transfer limitation or explicit user choice. Preserve a compact handover for any
transfer; keep the same problem identity and applicable limits. Do not keep an entire project in
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

When debugging, use the installed `principle-fix-root-causes` skill.
Record the observed failure as product defect, harness defect, environment limitation,
missing evidence or requirement mismatch; multiple/provisional classifications are
allowed. State evidence, uncertainty and the smallest discriminating experiment.
Search the [incident index](testing/INCIDENTS.md) for the matching symptom/host/test
or changed harness, then read the relevant original evidence. Keep detailed attempts
in the task's linked evidence file; index only a new cause, changed diagnosis or
durable prevention lesson. An expired artifact remains unavailable, not freshly
verified evidence.
A red job alone is not a diagnosis. Do not change production code to satisfy an
unvalidated harness or relax a threshold to turn a run green. Reproduce at the failed
layer; use a native target when that is needed to assess actual desktop behavior.
Keep Chrome timing-only diagnostics distinct from blocking functional/evidence
failures under TESTING. Hosted browser timing alone does not establish a native
renderer defect. Conversely, an environment explanation does not waive missing native
qualification. Keep failed statuses and all relevant measurements on their real inputs.

After two unsuccessful corrections of the same hypothesis, reassess the diagnosis,
requirement, test validity and implementation layer before another attempt. Record
what the evidence rules out and the next experiment that could distinguish the
remaining causes. Proceed within the selected scope and applicable operation limits.
If no useful experiment is available, bring the unresolved decision to the user.
Repeat checks only for changed inputs, a correction or unresolved evidence. Reopen
a closed finding only after a relevant change or new evidence.

<a id="5-budget-the-problem-not-the-checkpoint-name"></a>

### 5. Operation limits and reassessment

Set numerical limits only for operations with meaningful cost or disruption, such
as package builds, native application launches, SDK qualification campaigns or
expensive CI matrices.

Routine work does not need numerical limits. Examples include reading files,
editing code, typechecking, formatting, local compilation, unit and component tests,
code review, documentation, Git commits and cheap automatic PR checks. Existing
user restrictions still apply.

Before a capped operation starts, choose a reasonable limit, state its basis and
record what counts as an attempt in the owning task. Include expected failures and
corrections in that single ceiling; no percentage contingency or separate budget
approval is needed within the selected scope. Count attempts that actually start,
including failed or cancelled attempts. A preflight refusal before the operation
starts does not consume an attempt. Resolve uncertain execution before another
attempt, reserving its place in the limit until the evidence establishes what ran.

Keep consumption cumulative across sessions, hosts, branches, handoffs, subagents
and successor tickets for the same operation and problem. Ask before exceeding a
stated limit. Stop that operation while continuing other authorized work that does
not depend on it. Preserve historical counts, exhausted allowances and closed
no-retry selections. Specific limits already selected for an active task remain
binding until the user changes them. This policy replaces generic finite-allowance
and contingency instructions in older task templates and issue boilerplate.

Keep one short record in the owning task: outcome, relevant evidence, any operation
limits and their consumption, and next action. Handoffs link to that record and
preserve pending process identities and recovery details. They do not create a new
budget or copy the accounting into several live records.

Ask when the work requires a real decision: a scope or acceptance change, an
operation beyond its stated limit, new spending, or access that is not authorized.
Stop dependent work when a required capability is unavailable. Existing publication,
credential and recovery permissions remain binding. Once publication is authorized,
its ordinary automatic checks and audit need no additional budget approval. Routine
steps within the selected scope need no separate permission. Use the
[diagnosis and reassessment rule](#4-classify-failures-before-fixing) when corrections fail.

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

## Parallel agents and worktrees

Parallel implementation agents may work on authorised, dependency-ready assignments
in separate worktrees and branches. One coordinator owns assignments, shared status
and applicable operation-limit records, integration and the combined acceptance evidence. Use one
writer per worktree and branch at a time, including the integration branch. A merger
agent may take integration ownership through a recorded handoff.

Record each assignment's ticket or task, worktree/branch, base commit, file/interface
scope and integration destination. Include the current approved contracts in its
base; transfer needed uncommitted changes through a reviewed checkpoint. Declare
overlapping changes, give shared contracts/migrations one owner, and start dependent
work from that owner's reviewed checkpoint. Isolate mutable fixtures, profiles and
build outputs; sequence operations that need the same native app or other shared
mutable resource.

The coordinator reviews and integrates completed assignments in sequence, resolves
overlap and verifies the combined candidate at the authorised integration checkpoint.
Worker checks establish their own candidate's results. Select affected integration
checks after combining changes; reuse earlier evidence only with an explicit scope
and candidate basis. Retain worktrees with unique work until integration or safe
retirement is proved under [branch cleanup](#integration-and-branch-cleanup).

Pending CI does not reserve the whole repository or stop other assigned worktrees.
Bind each result to its recorded run, attempt, full SHA and material inputs; later
commits or merges do not inherit a pass automatically. The chat registering
`ci-watch` still yields immediately under [the waiting policy](#waiting-without-model-polling).
Other assigned agents may continue in their own worktrees during that wait. On
resume, reconcile current ownership and changes before applying fixes or integrating.

Parallelism stays within selected scope, actual dependencies, required review and
the same applicable operation limits. Existing task-specific model/team limits and
protected recovery still apply. This policy permits agent worktrees within an
authorised outcome; selecting product work, publication, host access or a release
retains its existing approval boundary.

## Test host routing and ownership

Keep one coordinating owner on the user's preferred development machine; assign
implementation work under [parallel worktrees](#parallel-agents-and-worktrees). Use GitHub
Actions by default for required automated Windows x64 and macOS ARM64 checks. Running
checks on another operating system does not require transferring the development session.

This applies symmetrically: Mac development uses Windows CI for affected Windows
evidence; Windows development uses macOS CI for affected Mac evidence. Record the
chosen development host and required evidence targets once in the selected task;
do not infer preference from old task history. Select platforms from changed behavior,
native boundaries and dependencies, not from which machine is convenient.

During iteration run cheap affected local checks, including actual production-probe
consumers for changed UI/request contracts. For a new platform-sensitive assumption,
select an early representative real-path CI check on affected targets. Reuse unchanged
qualified slices. Put inexpensive harness checks before expensive work in an existing
selected qualification run; do not require a separate harness dispatch for every feature
or commit. The optional harness-only selector is for the smallest necessary focused
platform proof. Qualify a coherent candidate at the selected milestone, then repeat
only affected or unresolved checks after a diagnosed correction. Ordinary implementation
steps do not require repeated user test-selection approval within the selected scope
and applicable operation limits.

The rule is the same in both directions; capabilities need not be identical. A Mac
runner without the approved signing identity, or a runner without the required native
input/observation surface, leaves that named case pending. Mocked contracts and passing
local tests do not establish the other platform's behavior. Waiting and resumption
follow [the waiting policy](#waiting-without-model-polling). Other assigned worktrees
may continue while CI is pending under the parallel-worktree policy.

Within the selected outcome, the agent may prepare, dispatch, monitor and review focused
CI checks, including necessary workflow adjustments. Verify runner capabilities and retain
candidate identity, package hashes, case results and cleanup evidence. CI builds, launches
and retries consume the same applicable operation limits as local runs, including
failed/cancelled attempts and implicit launches. Select only required jobs and cases;
this routing policy does not authorize an otherwise excluded full matrix or specialist
experiment. Monitoring follows [the waiting policy](#waiting-without-model-polling).
Publication remains within the selected outcome's actual authorization.

Request a local platform handoff only for a named required case that CI cannot reliably
establish. Explain the missing capability and transfer only the remaining work, with
completed evidence, the verified branch checkpoint and unchanged applicable operation limits.
Transfer the named assignment's writer ownership before the receiving agent edits
it; independent worktrees may continue. Access to the user's other computer, remote
infrastructure installation and signing or credential provisioning require their own authorization;
use the selected handoff rather than duplicate writers for the same assignment.
Both-platform evidence remains required where selected; missing access does not block
unrelated already authorized portable work or turn pending proof into acceptance.

| Work | Codex machine | Evidence host |
| --- | --- | --- |
| Docs, planning and portable logic | Any suitable host with repository access | Cheap relevant checks; no native run merely for docs |
| New shared platform-sensitive path | Preferred development host | Early focused CI proof on affected Windows x64/macOS ARM64 targets; local only for an identified missing capability |
| Windows crash, process/filesystem or packaging diagnosis | Preferred development host; local Windows only for an identified required capability | Affected Windows executable/path through CI where sufficient; shared changes also qualify affected Mac behavior |
| macOS rendering, focus, native input/window behavior | Preferred development host; local macOS only for an identified required capability | Actual packaged native app and appropriate native driver/observations, through CI where sufficient; hosted Chrome alone cannot substitute |
| Final milestone qualification | Any host able to coordinate/review the approved run | Required Windows/macOS CI package matrix and remaining native/human evidence |

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
Before a genuine pause, transfer or completion, update the brief and relevant evidence,
then replace the live HANDOVER continuation once with sufficient recovery state.
Update CURRENT when overall project state changes. Keep detailed history in linked task evidence;
CURRENT/HANDOVER must agree about the live outcome and distinguish evidence from approval.

### Status-document maintenance

CURRENT is the project overview: accepted baseline, capability/acceptance state,
active workstreams and links. HANDOVER is the selected outcome's recovery record:
continuation location and candidate, key acceptance limits, pending operation/ownership,
material recovery state, applicable operation-limit reference and next action. Detailed procedures,
attempts, measurements and receipts belong in linked task evidence; lasting behavior
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
| Evidence | Key result and candidate; direct section links to detailed workflow/run/attempt, commands, counts, artifacts and receipts in task evidence. |
| Pending operation | Last observed status, observation time, unresolved identity/access and artifact expiry. |
| Remaining work | Next action, relevant paths, blockers, approval boundary and a link to applicable operation limits. |
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
branch, task, handover, pending operation and unchanged applicable limits in the recovery prompt.

## Waiting without model polling

For a confirmed GitHub Actions run, use the installed `ci-watch` skill.
If the skill is absent or cannot register a working watch, use manual same-thread
resume. Other external waits use manual resume.
A wait preserves the current outcome, chat, remaining audit and applicable operation limits.
Its chat yields; other agents' assigned worktrees may continue under
[parallel worktrees](#parallel-agents-and-worktrees).

1. **Start and record.** Check existing operations, candidate and applicable limits; dispatch
   only the authorised workflow. Capture workflow/run ID, attempt, exact head SHA,
   branch, material inputs and last observed status/time. Record the remaining audit
   and applicable limits in task evidence; link the pending operation from HANDOVER.
   A successful request without a confirmed run identity is not a confirmed run;
   a rejected request is not pending CI. Preserve ambiguous dispatch state and resolve
   it without duplicate dispatch.
2. **Select the wait route.** Check whether `ci-watch` is installed on the current
   host. If installed, read and follow its current `SKILL.md`, including execution
   approval, registration, recovery and event acknowledgement. Require
   `watcher_running: true` before reporting an active watch. Record registration
   status with the pending operation; retain private watcher paths outside committed
   evidence. After successful registration, report it and end the turn immediately.
   On `CI_WATCH_EVENT`, follow the skill's resume/audit steps and step 4 below.
   For an existing or uncertain registration, follow the skill's recovery procedure
   before starting another watch. If the skill is absent or monitoring cannot be
   confirmed, report that limitation and use step 3. Missing skills use manual
   fallback; installation is a separate user selection.
3. **Manual fallback.** Publish the checkpoint and end the turn. For an
   autonomous Codex Goal, use only a documented, available and authorised lifecycle
   control and confirm its result. If the agent cannot pause it, tell the user to use
   the client's actual pause control. In the CLI this is `/goal pause`; use the
   installed app's verified equivalent rather than assuming identical commands.
   A prose reply, a Markdown `awaiting_ci` label or an ended turn is not proof of a
   runtime pause. Never mark unfinished work complete just to stop continuation.

   Resume on user command. The user returns to the same thread and uses its actual
   Resume control (`/goal resume` in the CLI), optionally adding `The workflow is
   complete; audit the recorded run and continue the existing goal.` A normal chat
   without autonomous Goal mode can continue with that message alone. If the client
   was closed, reopen/resume the saved thread instead of creating a new goal. Do not
   clear/reset the goal or manipulate private client state.
4. **Verify and continue.** Read the recorded run/attempt, current terminal status and
   relevant repository/worktree changes. A watcher event or user completion report
   is a cue to inspect CI, not proof of success. Watcher timeouts and monitoring
   errors do not establish that GitHub completed. If still pending, preserve the
   identity and pause again; do not start an autonomous check loop. If terminal, audit
   required jobs/artifacts/identity and continue the remaining authorised work. Missing, expired,
   failed, cancelled or skipped evidence stays unresolved; a green badge is not enough.
   Changed refs or a newer attempt do not silently replace the recorded candidate.

Resume never grants a retry, new dispatch, extra build, broader correction or merge.
Bounded fixes continue only when covered by the selected outcome and applicable operation limits;
otherwise name the decision needed. Preserve the existing audit owner and wait record;
reconcile any assignment handoff before another agent handles that result. Continue
independent assigned work under the parallel-worktree policy.

The model does not poll or run keep-alive loops. Background polling and automatic
same-thread continuation are permitted through the installed `ci-watch` skill under
its current instructions. User-requested status checks remain permitted.
W0/OPT-1A remains abandoned; this exception does not authorize client-database edits,
a new scheduler, service, orchestration framework or work on PR #12.
A documentation change does not validate client lifecycle controls or watcher
support on a host.

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
and unresolved issues. Archive the completed brief with a final status, retain its
linked evidence and update INDEX/CURRENT/HANDOVER links. Pure duplicate handovers can
be removed once useful content is preserved; Git history retains earlier live HANDOVER revisions.

Finish with short live status records for the next actual state under
[status-document maintenance](#status-document-maintenance). A completed milestone's
old checklist and next-step prompts remain historical; do not present them as pending
work or treat completion as selection of the next milestone.

Do not generate a snapshot for every chat. Existing historical snapshots may remain
until a link/evidence audit proves they can be consolidated. Never remove runtime
journals or unacknowledged events as documentation cleanup. Finish by checking links,
privacy/secrets, whitespace, changed-path scope and actual remote publication.
