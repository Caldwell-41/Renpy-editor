# CI optimisation and durable external wait/wake

**Plan revision:** 2026-09-19, repository-owned revision 1.
**State:** Planned; W0 feasibility approved, not started.
**Repository:** `Caldwell-41/Renpy-editor`.
**Inspected integration baseline:** main `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
**Continuation:** [HANDOVER](../../status/HANDOVER.md).
**Delivery rules:** [WORKFLOW](../../WORKFLOW.md).

This canonical detailed plan replaces the chat-only proposals and external wait/wake
attachment. It includes the subsequent confidence-review corrections. Publishing it
is not execution of W0 or proof of runtime capability. Future chats read the repo;
prompts select one checkpoint.

## 1. Approval, scope and checkpoint sequence

The user approved bounded W0 feasibility before full implementation, repo-owned plans
and handovers, one checkpoint per chat, and safe final integration/cleanup. Only W0
is currently authorised for execution. Later checkpoints require the user's checkpoint-
start instruction after review. This does not approve Phase 1F or other app features.

W0 precedes the foundation implementation: small isolated probes can establish host
capability without first building a supervisor. Production wait/wake still depends
on OPT-1A. W0-W3 below are the canonical four gate names, superseding the earlier
three-gate shorthand. Each table row is its own checkpoint chat.

| Checkpoint | Scope | Entry / exit |
| --- | --- | --- |
| **W0** | Actual-host queue/resume, tools and goal-control feasibility. | Approved now; publish go/partial/no-go evidence and stop for review. |
| OPT-1A | Candidate-specific CI submission, compact collection, operation/checkpoint contract. | Separate approval; can proceed independently after a W0 no-go. |
| W1 | OPT-1B implementation plus offline state-machine and fault tests. | W0 qualified path, OPT-1A, separate approval; automatic mode disabled by default. |
| W2 | Real-runtime integration and native host/supervisor qualification. | W1 plus separate approval; explicit permission for any service installation. |
| W3 | Real GitHub Actions end-to-end proof and agent workflow adoption. | W2 qualified hosts plus separate approval; no simulated acceptance substitution. |
| OPT-2A | Cheap preflight dependencies, trigger/concurrency controls and diagnostics. | Separate approval; retain native acceptance gates. |
| OPT-2B | Conservative acceptance-evidence reuse. | OPT-2A evidence and separate approval; start in observation-only mode. |
| CLOSE | Integration, branch retirement and documentation consolidation. | Approved implementation complete; reconcile explicitly deferred scope first. |

Each chat completes/reviews/troubleshoots ONE row, publishes its ledger and live
handover, provides a short next-chat selector and stops. A blocked W0 does not approve
W1 or a host migration. Report whether independent CI work could proceed separately.

Use one implementation branch `maintenance/ci-optimisation` and one integration PR
across checkpoint chats. The name is reserved by this plan, not a claim the branch
already exists. Reuse existing work if found; otherwise create it from freshly verified
main when W0 starts. The planning publication is on main. Do not retire old branches
before CLOSE's safety review.

## 2. Starting evidence and intended benefit

The inspected main has `scripts/validate.py`, separate repository-quality CI and a
Windows x64/macOS ARM64 production matrix. It contains no published `ci.py` or wait/wake
helper. Main includes merged Phase 1E PR #9; older live status/handover instructions
claiming integration was pending are reconciled by this publication. Unpushed local
work is not covered by the remote inspection. [R1-R3]

The earlier plan provided external observation and manual continuation, not verified
same-thread wake-up, unloaded-thread handling, safe goal suspension, delivery
reconciliation, supervisor recovery or late queued-message cancellation.

Separate GitHub runner usage, ordinary observer API/process work and model turns.
The target is no autonomous inference or model-driven polling attributable to the
registered wait after the originating turn finishes and before a terminal or monitoring-
failure event is delivered. User messages are permitted and can supersede the wait.
Do not infer token savings from elapsed time or promise a fixed allowance multiplier.

## 3. W0: actual-host feasibility

### Safe scope

W0 is investigation with the smallest reproducible isolated probes. Put any reusable
probe code/tests under `spikes/codex-waitwake/`. Do not implement the production
supervisor, modify production CI, enable reuse, install services, upgrade/restart the
user's runtime, expose listeners or change unrelated tasks. Begin with read-only
discovery using approved authentication; never print credentials.

Inspect current official docs and source matching BOTH the installed CLI and owning
daemon before live protocol tests. Section 4 records historical source findings,
not a promise about the installed version. Discover the actual task host through
available interfaces, not guessed endpoints, port scans, session names or another
machine's CLI. Establish access to the original task first.

A disposable session can supplement risky tests only with explicit authority; it
cannot replace proof that the actual task is accessible. Never fork the task or start
a competing executor as fallback. Before live pause/unload tests, record the narrow
test action, usage/turn allowance, deadline, restoration steps and safe abort path.
Obtain any missing live manipulation permission. Do not pause an unrelated thread
or intentionally strand the current one. Missing access is a blocked result, not
permission to create a new runtime platform.

### Capability matrix

| Question | Required proof |
| --- | --- |
| Actual owner | Runtime endpoint/host identity, installed CLI/daemon versions, original thread ID and matching workspace. Private details stay local. |
| Addressable task | Successful read of the original thread through the owner; no `--last`, newest-session or title shortcut. |
| Loaded-idle delivery | Queue receipt, correlated started turn and harmless result/claim on the same ID. |
| Unloaded saved thread | Safe same-ID resume, auto-dispatch reconciliation, no duplicate start, verified result. |
| Usable execution | Harmless representative tool operation after resume in the expected worktree with existing permissions/handlers. |
| Real goal inactivity | Authorised pause and runtime-side evidence of no autonomous continuation during the bounded wait. |
| User control | Ownership/revision or serialized-host mechanism that never restores over an intervening user decision. |
| Ambiguous delivery | Queue/turn/history access sufficient to distinguish accepted, started, claimed and unknown without blind resend. |
| Cancellation | Reconcile/delete only the wait's queued item and revoke late continuation; unrelated items unaffected. |
| Persistent observer | Identify the actual host, selected supervisor and visible failure-notification route; no service installation yet. |

Cross-check native tool-shell `CODEX_THREAD_ID` when available; distinguish thread ID
from session/root identifiers. An arbitrary environment variable or a new CLI install
does not establish owner/daemon compatibility. [C1-C6, D1]

### Hard ambiguities to resolve

1. Local Codex, a remote app-server and a hosted chat are not interchangeable. An
   unrelated local demonstration does not qualify a hosted task.
2. A local pause marker and a read of `paused` cannot distinguish a later user pause.
   Read-check-write is not atomic. Identify caller-visible revision/ownership or a
   host integration serializing relevant changes. Lost event visibility invalidates
   conclusions based only on having observed no user changes. Internal goal-ID checks
   are not automatically caller-visible pause ownership.
3. Registration cannot arm delivery before suspension is confirmed and the originating
   turn ends. An operation may already be complete; buffer that event until armed.
4. Stable client IDs provide correlation, not assumed enqueue deduplication. Absence
   from the queue is not proof of consumption.
5. Instructing the agent to claim first is not runtime enforcement. Identify exactly
   which task-changing operations are gated and what remains instruction-level.
6. Restored metadata may not restore dynamic tool clients, required MCPs or credentials.
   Prove usable tools without weakening the permission profile.
7. Missing notifications while disconnected are not zero inference. Identify authoritative
   runtime-side activity records and their coverage.

### Deliverable and exit

Write actual evidence to `docs/research/CODEX_WAIT_WAKE_QUALIFICATION.md`: versions,
source/schema references, host, probe revision, bounded commands, expected/observed
results, rollback and limits. Keep raw endpoints, history, secrets and machine paths
private. Sanitised receipts must still support the claims.

Record pass/partial/blocked/not-tested per capability. `go` requires actual target-path
and user-control proof. `partial`/`no-go` finishes the investigation but does NOT pass
automatic-support acceptance. Without pause-ownership proof, leave the goal paused
and require manual continuation; do not call that equivalent automatic support.

Update resolved choices in this plan, record blockers, publish ledger/HANDOVER and
stop for review. Do not implement W1, install a service, migrate hosts or relax the
requirements inside W0. Independent OPT-1A needs a separate checkpoint selection.

## 4. Pinned source baseline, not a runtime guarantee

The earlier audit inspected `rust-v0.155.1` on 2026-09-19. Its CLI exposes
`codex queue --thread <id> --message <text>` and sends `thread/queue/add`; command
success is not a call to resume or start a queued turn. Each CLI invocation creates
a new client message UUID. The queue service wakes eligible loaded idle threads;
queue-start requires an unloaded thread to be resumed and refuses active/pending
turns. Interrupted, archived and ephemeral threads have distinct restrictions. [C1-C4]

The inspected goal service/tool supports state changes but does not establish a
caller-supplied pause-owner/revision compare-and-set contract. Internal goal identity
checks do not settle the later-user-pause race. Recheck the exposed schema in W0. [C5-C6]

Official app-server documentation distinguishes read, resume and turn execution,
and describes experimental surfaces. Inactive-thread unloading is not conversation
erasure or proof of a universal model timeout. Required tools/clients can affect
resumed execution. These source observations require host validation. [D1]

Prefer a small version-qualified structured-protocol adapter over parsing CLI prose.
Use a reviewed pinned transport if needed; do not write a WebSocket stack or modify
Codex internals. Do not start a second owner server to hide missing host capability.

## 5. OPT-1A: CI operation foundation

Add `scripts/ci.py`, following existing Python conventions and approved GitHub
authentication. The following interface is PROPOSED, not implemented:

```text
python scripts/ci.py doctor
python scripts/ci.py preflight
python scripts/ci.py submit --ref <branch> --sha <full-sha>
python scripts/ci.py collect --run <id> --attempt <n>
```

`doctor` records capabilities once per relevant tool/config signature. Do not repeat
known-impossible desktop builds. Linux/frontend/core checks are not supported-target
acceptance. Re-evaluate when dependencies or environment change.

`submit` finds or starts: attach to matching running work, return verifiable existing
results under actual policy, or dispatch once. Persist a request ID before dispatch.
Lost response/auth/API failure is unknown, not permission to retry blindly. Correlate
request, workflow, branch and SHA; never pick the newest run. Reject wrong/moving refs
before expensive work. All jobs check out the validated immutable candidate. Record
workflow source revision as well as application SHA and explicit run attempt.

Introduce `expected_sha`, `request_id`, `force_full`, and `upload_packages` dispatch
inputs as appropriate. Package building stays mandatory for full acceptance; large
bundle upload is opt-in. Preserve lightweight evidence and existing required gates.

Share versioned operation/checkpoint/result contracts with W1. Keep runtime state
private/outside Git, and publish sanitised run/attempt/SHA handovers. `collect` follows
pagination, distinguishes failure/cancel/timeout/skipped/unknown, and loads only bounded
relevant diagnostics. Missing artifacts or partial logs do not mean passing.

Tests cover duplicate submission, lost response, wrong ref, branch movement, auth/API
failure, attempt mismatch, pagination, missing evidence and interrupted collection.
No evidence-reuse policy or unattended Codex continuation is enabled here. [R2-R3, G1-G2]

## 6. OPT-1B architecture and scope

Implement GitHub Actions observation and one qualified Codex continuation path only.
Expose small observe/deliver interfaces for future process/render/file/MCP adapters,
but do not implement those backends. No subagents, alternate models, public webhook
receiver, distributed failover, self-hosted Actions runners or application features.

Initial contract: one owning supervisor host, one active registered wait per task,
clean committed candidate, explicit deadlines, no automatic CI reruns or merges.

```text
Task -> bind run/attempt/SHA -> durable checkpoint -> register observer
     -> confirm authorised suspension -> originating turn finishes -> arm delivery

       NO AUTONOMOUS MODEL ACTIVITY FOR THIS WAIT

Observer -> detect outcome -> persist compact terminal event
         -> owning-runtime queue/resume/reconcile -> correlated turn
         -> single validated continuation claim -> continue checkpoint
```

Event-driven means at the model boundary. Ordinary external API polling is allowed
and does not require model turns. Do not allocate an Actions runner to watch another
run. Reuse OPT-1A collection rather than building a competing CI controller.

| Proposed component | Responsibility |
| --- | --- |
| `scripts/waitwake.py` | Doctor, register, status, recover, cancel, claim and cleanup. |
| `scripts/waitwake_lib/state.py` | Versioned private journal/outbox and fenced ownership. |
| `scripts/waitwake_lib/github_actions.py` | Bound run/attempt observation and collection. |
| `scripts/waitwake_lib/codex_bridge.py` | Owner verification, queue/resume/start and receipt reconciliation. |
| `scripts/waitwake_lib/supervisor.py` | Non-model watcher lifecycle, heartbeat and recovery. |
| `tests/waitwake/` | Fake-provider, state-machine, crash/race and integration tests. |
| `.agents/skills/external-wait/SKILL.md` | Tested invocation/recovery procedure after the helper exists. |
| `docs/CI_ORCHESTRATION.md` | Lasting operations, compatibility, security and recovery contract. |

Paths are planned. Do not invoke nonexistent commands. Pin/copy the helper revision
or otherwise verify it so changing the worktree cannot silently change an in-flight
privileged observer. Avoid premature frameworks and multiple competing service models.

## 7. State, checkpoints and continuation ownership

Use a private per-user local state directory and small SQLite journal for atomic
updates, durable outbox, unique identities and restart recovery. Do not edit Codex's
internal database/history or share a live journal between native and WSL processes.

Persist schema/policy/helper versions, operation/event IDs, repository/workflow/run/
attempt/SHA, required gates, owner endpoint/config-home identity, exact thread ID,
separate session identity if relevant, goal identity, task generation, worktree/branch/
HEAD, permissions/config identity, completed checks, next authorised action, deadlines,
lease/fencing generation, queue/turn/claim receipts and last side-effect checkpoint.
Keep secrets in existing credential stores and private machine details outside Git.

Observation, delivery, continuation claim and task completion are separate axes:

```text
prepared -> observer_registered -> suspended -> yield_confirmed/armed
         -> observed -> delivery_pending -> enqueued -> turn_started
         -> continuation_claimed -> checkpoint_result_recorded
```

A terminal observation may precede arming; buffer it. Only verified suspension and
originating-turn completion permit delivery. The arm signal must use W0's qualified
host contract, not an extra model keep-alive. Failure to arm is visible/recoverable.

Exceptional states include `delivery_unknown`, `blocked_manual`, `revoked`,
`superseded`, `user_paused` and `cancelled`. New instructions, changed files/branch,
explicit stop or lost user-event visibility require revalidation. Do not reset a
changed worktree. Claiming an event is not finishing the task; reconcile interrupted
claims against recorded actions before continuing.

One supervisor lease prevents cooperating supervisors from racing; it does not prove
that an unrelated agent cannot act. State what is actually enforced. Require one
authoritative event claim and safe side-effect reconciliation. Do not promise exactly-
once model inference through every remote crash boundary.

## 8. Watcher lifecycle, deadlines and diagnostics

Observation runs under a persistent user-owned supervisor, not a disposable model-tool
child. Confirm durable registration/ownership before yielding. Use modest configurable
API intervals, request timeouts, retry-after handling and bounded backoff/jitter.
Persist transitions/retries, not repeated full logs.

Choose the actual first host/supervisor/notification path in W0 and qualify it in W2.
Native Windows x64 and macOS ARM64 are intended targets; neither is supported by
assertion. User-scoped Windows scheduled-task/service or macOS LaunchAgent installation
requires explicit permission and tested crash/login/wake/uninstall behavior. Do not
assume Bash, POSIX signals, terminal detachment or WSL interoperability.

Restart recovers unfinished operations without dispatching replacement CI. Use process
start identity and fencing, not PID alone; no cross-host takeover in v1. Wall-clock
observation deadlines include sleep. Distinguish provider timeout, observation timeout,
delivery timeout and pending approval. Do not cancel CI because local waiting expired.
Late events for revoked/superseded/deadline-closed generations remain for inspection,
not automatic reactivation.

Persist events before delivery. Retry only operations safe under known state. After
bounded failure, expose `blocked_manual`, a precise status/recovery command and the
chosen visible non-model notification. A quiet file alone is not a notification.
No execution guarantee applies while required machines/services are powered off.

Log versions, timestamps, state reasons, retry counts and operation/event/queue/turn/
claim correlations with redaction. Measure observation-to-event and event-to-claim
latency, duplicate suppression and actual model activity. Keep unresolved outbox/claims
and bounded tombstones during cleanup; never delete unfinished recovery evidence.

## 9. Queue/resume, goal control and cancellation

Loaded idle: queue and observe automatic dispatch. Loaded active: leave the event
queued without interrupting user work or reordering unrelated messages. Unloaded:
resume the same authorised saved thread, then re-read queue/turn state because resume
may auto-dispatch. Start a selected item only if still queued and the thread is idle.
Never queue and unconditionally issue a second `turn/start` or independent exec-resume.

Queue receipt, correlated started turn and atomic verified claim are distinct receipts.
Use a stable event/client ID but do not assume enqueue idempotence. Lost response means
`delivery_unknown`: inspect qualified queue/turn/history evidence before retrying.
If ambiguity persists, block and notify instead of producing duplicate model work.
Absence from queue is not delivery proof. [C1-C4]

Before task-changing actions, validate generation, candidate/worktree, permissions and
scope. Identify runtime/tool-enforced guards separately from agent instructions.
An AGENTS rule alone cannot be sold as enforcement of claim-before-action.

Cancellation/supersession revokes the local generation AND reconciles/deletes only our
own pending queued message where safe. If a continuation already started, its guard
must reject revoked actions. Do not touch unrelated messages. Distinguish a deliberate
user interruption from an infrastructure failure; interrupted/archived does not mean
permission to resume automatically.

Pause an active goal only through authorised ownership-safe control. Preserve objective,
accounting, budget, model, tools, sandbox and approval settings. Never mark complete
to suppress work. Sequence event handling and goal restoration so restoring the goal
cannot create a competing continuation before the result is consumed.

A read of `paused` plus a local marker is insufficient ownership proof. Missing
conditional control, lost event visibility, new user pause, approval request, archive
or usage limit blocks restoration. The fallback leaves the goal paused with explicit
manual recovery; it is not passing automatic support. Test the pause-to-queue and
queue-to-restore races. Do not invent API fields or reset budgets.

## 10. Outcomes and wake-up content

Bind the exact repository, workflow, run, attempt and candidate. Follow all job pages;
do not silently track a newer rerun. The observer reports facts, while the existing
acceptance policy determines required gates. Overall workflow success alone is not
proof every required job executed.

| Outcome | Behavior |
| --- | --- |
| Success | Exact identity, required job/gate outcomes and bounded next action. |
| Failure | Relevant failing jobs/steps and short redacted errors; no automatic rerun. |
| Cancellation | Distinct conclusion; no automatic restart. |
| Provider timeout | Distinct from observer/delivery deadlines. |
| API/auth/monitoring failure | Bounded ordinary retry, then monitoring-error event; not test failure. |
| Watcher crash | Recover same operation through supervisor. |
| Codex unavailable | Persist event and retry safe delivery within deadline. |
| Delivery uncertain | Reconcile or block; never blindly enqueue again. |
| User stop or task change | Revoke wait and reconcile its pending queued item. |

The compact envelope contains operation/checkpoint generation, candidate, run/attempt,
conclusion, required job statuses, bounded redacted diagnostic data, evidence references
and next authorised action. Cap total size and each field; explicitly mark truncation.
Fetch full logs only for targeted diagnosis. Illustrative message, not actual evidence:

```text
Operation: <id>; checkpoint generation: <n>; candidate: <sha>
Actions run: <id>; attempt: <n>; conclusion: failure
Windows x64: failed at <step>; macOS ARM64: passed
Diagnostic: <bounded redacted data>; full evidence: <reference>
Claim this event and verify the existing checkpoint before acting.
Inspect the named failure; do not dispatch replacement CI automatically.
```

## 11. Security boundaries

The observer needs Actions read access, not push/merge/cancel/rerun permissions.
The continuation bridge is privileged: restrict registration/IDs and fixed operations.
State which restrictions the runtime enforces and which only our adapter enforces.
Use protected local or authenticated transport; no unauthenticated network listener
and no model credentials in Actions callbacks. [D1]

Use argument arrays, strict schemas/identity checks, bounded output, control-sequence
removal and redaction. CI logs are untrusted data, never instructions or commands to
execute. Preserve model/reasoning, credential, sandbox, approval, trust and budget
settings. No bypass flags, runtime database edits or automatic host migration.

## 12. W1-W3 tests and rollout

### W1: implementation and offline proof

After W0 review, OPT-1A and approval, implement the selected bridge/state/observer/
supervisor with automatic mode off by default. Fake time/providers/runtime exercise
logic but do not establish host compatibility.

Cover outcomes, pagination, missing/expired evidence, sanitisation, wrong identities,
attempt changes, completion before registration/arming, unknown dispatch and deadlines.
Inject crashes before/after checkpoint/outbox persistence, enqueue, response, turn-start
and claim. Include dual supervisors, expired leases/fencing, PID reuse, duplicates,
revoked queued items, changed workspaces, user activity, unrelated messages, interrupted
claims and notification failure. Assert no blind retries or repeated task-changing
side effects. Publish exact tests and unresolved runtime gaps; stop for review.

### W2: actual runtime and native hosts

Use W0's real owning runtime and selected supervisor. Test loaded idle/active,
unloaded saved, paused-goal, interrupted, archived, ephemeral, failed required tools,
approval-blocked, usage-limited, disconnected observer and unsupported capability.
Test automatic-resume versus queue-start race, cancellation after enqueue, lost receipt
recovery, user-pause ownership and usable tools/permissions after resume.

Qualify Windows x64 and macOS ARM64 separately: spaces/Unicode paths, locks, permissions,
crash/login/sleep recovery, visible notifications and uninstall. Install only with
explicit permission. A Linux mock or application matrix is not native watcher proof.
Record unqualified platforms honestly; keep one owner host per task. Requalify affected
contracts on version changes. No silent fallback to a different model/client/host.

### W3: real GitHub Actions and agent adoption

After approval, use a cheap manual fixture workflow for controlled success, failure,
cancellation and timeout. Bind actual runs/attempts/SHA to checkpoints, yield, and
verify the SAME thread receives/claims the event. Include unloaded-thread, watcher-
restart, duplicate-delivery, revocation and tool-availability cases. Shared fixture
runs must not create competing task writers. Do not rerun the production matrix for
each watcher test.

Measure the task from authoritative runtime-side records: no autonomous model turns,
inference or goal continuations caused by the wait between completed yield and event
delivery. User interactions are separately recorded. No model API key in the watcher
is insufficient proof; disconnected/missing telemetry is not evidence of zero activity.

Attach to one otherwise-required `production-scaffold.yml` acceptance run and verify
its actual Windows/macOS summaries. Record owner/host/versions, original and resumed
ID correlation, event/queue/turn/claim receipts, run/attempt/candidate, recovery tests
and telemetry coverage. Simulated completion is not this gate.

Publish lasting `docs/CI_ORCHESTRATION.md`, real commands and the external-wait skill
only once operational. Verify the actual host reads AGENTS/skill and uses registration/
yield rather than polling. Instruction discovery is not process enforcement. Enable
only qualified paths and retain explicit visible manual/degraded outcomes. [D1-D2, G1-G2]

## 13. OPT-2A: cheap gates and reduced duplicate work

Make inexpensive preflight a dependency of both native jobs: repository validation,
CI/helper tests, existing `npm run check` and Rust formatting. Do not add another
complete Linux Rust/SDK build without evidence it saves work. Preserve native core,
official SDK, packaging, packaged WebView/denial, privacy and inventory gates.

Share preflight logic between ordinary PR checks and production. Avoid redundant
push-plus-PR cheap runs without making required checks disappear. Main's controller
emits an explicit result for docs-only changes, deciding expensive work inside a check.
The final aggregator verifies required native success or validated equivalence,
not merely success from skipped dependent jobs.

Concurrency serializes work, not deduplicates it. Normal acceptance shares a workflow/
branch group across push/manual events; initially protect running work with
`cancel-in-progress: false` and recheck evidence afterward. Do not cancel nearly
finished acceptance on every docs push. Obsolete-run cancellation is deliberate and
run-specific. Review required-check names/rules before changes; never weaken policy
because administration access is unavailable.

Add measured step watchdogs for downloads/external processes with cold-cache margin.
Remove standalone duplicate frontend build only while Tauri's build hook remains active.
Each native package retains its actual frontend build. Preserve useful npm/Rust/SDK
caches. Measure preflight delay, failed-candidate savings and runner time; no fixed
speedup promise. Test wrong SHA/preflight failure avoids native work, both target gates
remain required, and missing/skipped/unknown results never become acceptance.

## 14. OPT-2B: conservative acceptance-evidence reuse

This needs separate review because a false equivalence could weaken acceptance.
Start in observation-only mode: compute decisions but retain fresh native execution
until the negative/positive tests and a complete candidate establish the policy.

Emit a receipt containing schema/policy version, tested commit, relevant-input
fingerprint, workflow source revision/run/attempt, required jobs/gates, toolchain/SDK/
runner identity, completion time and verifiable artifact IDs/digests. Cache hits are
not acceptance evidence.

Fingerprint tracked paths, modes and contents by default, including app, tests,
fixtures, scripts, lockfiles, toolchains, SDK configuration, workflows and policy.
Exclude only reviewed non-executable docs proven not to influence build/test/package
results. Unknown new paths are relevant. Do not ignore all Markdown or hash only app/.
Check commit-identity, generated metadata and external/unpinned input dependencies.

Initially reuse only a trusted recent accepted candidate for its docs-only integration
descendants. Require matching inputs/policy, complete verifiable Windows/macOS success,
available evidence and no invalidating environment assumptions. Proposed age cap is
seven days and never beyond evidence availability; age is not proof hosted images
stayed unchanged. Unproven equivalence means full validation. `force_full` bypasses
reuse for explicitly requested diagnostics.

Report 'acceptance verified by equivalence to run X', never fresh native execution
on the new commit. Preserve required checks and aggregation. Refuse reuse for changed
code/locks/workflow/unknown inputs, schema changes, missing evidence, cancelled/failing
one-target results and unverifiable external dependencies. No broad historical branch
search. Record measured avoided runs, not hypothetical savings as actual token usage.

## 15. CLOSE: integration and cleanup

Review scoped diff, checkpoint approvals and actual required evidence. Integrate useful
validated work through the existing PR and verify main's resulting tree/checks. Avoid
another full matrix only when an implemented verified equivalence policy permits it;
otherwise obey existing acceptance requirements.

Inventory all branches/open PRs. Merge useful authorised reviewed work; remove only
integrated/redundant branches after ancestry or squash/patch-equivalence and active-task
checks. Do not merge obsolete branches merely to delete them. Preserve main, protected
refs, archive tags, unique commits, unfinished tasks and unrelated dependency/app PRs.
The historical instruction to retain corrective branches can be superseded by the
user's later safe-cleanup approval only after those proofs and a written receipt.
Do not delete legacy branches during W0.

Consolidate lessons into lasting operations docs/tests/ADRs, archive this finished
plan/ledger, repair links and leave one live HANDOVER. Remove/archive unnecessary
snapshots only after unique evidence is preserved. Git history retains earlier live
handovers; do not create one duplicate per checkpoint. Never delete private pending
events/recovery journals as doc cleanup. Report merged/deleted/retained decisions and
actual final validation; explain retained unique work instead of forcing an empty list.

## 16. Execution ledger and handover

Each checkpoint appends one compact evidence record: authority, state, branch/PR,
exact implementation candidate, commands/environments/results, CI run/attempt/jobs,
failed/partial evidence, resolved choices, durable lesson links, blockers and next
approval/action. Update the design when implementation choices change.

HANDOVER owns current routing, not another copy of the plan. Publish it before the
next-chat prompt. Record a known candidate rather than a self-referential handover
commit hash, and verify published head externally. Interrupted waits retain exact
operation and recovery details; blocked gates hand over recovery, not later work.

### Planning publication — 2026-09-19

- Authority: user requested repo-owned detailed plan, checkpoint handovers, concise
  prompts and future safe cleanup; W0 approved for a subsequent chat.
- Baseline: main `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`; PR #9 already merged.
- Scope: documentation only. Canonical plan, confidence-review gaps, stable AGENTS
  rules, WORKFLOW policy, reconciled CURRENT/HANDOVER and INDEX.
- No application/workflow changes, runtime manipulation, watcher, service or production
  matrix dispatch. No implementation/runtime compatibility is claimed.
- Validation receipt: inspect this document's publishing commit and its exact repository-
  quality check. Do not infer a pass before completion; no fresh native acceptance is
  claimed by documentation publication.
- Next: W0 only, following HANDOVER from freshly verified current main.

### W0 — not started

No actual host proof, queue/resume test, pause-ownership proof, watcher survival test
or model-activity measurement has been performed by publishing this plan. Replace
this placeholder with actual evidence; never promote requirements into passed tests.

## Primary sources and verification boundary

These are source references from the audit/plan, not installed-host acceptance.
W0 must verify current docs and source matching the actual runtime. Repo facts are
pinned to the inspected integration baseline.

- [R1] [Merged Phase 1E PR](https://github.com/Caldwell-41/Renpy-editor/pull/9).
- [R2] [Production baseline](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/production-scaffold.yml).
- [R3] [Quality baseline](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/quality.yml).
- [C1] [Pinned CLI arguments](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/cli/src/queue_cmd.rs).
- [C2] [Pinned queue command/client IDs](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/tui/src/session_queue_commands.rs).
- [C3] [Pinned queue service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/queue/src/service.rs).
- [C4] [Pinned queue RPC processor](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/app-server/src/request_processors/thread_queue_processor.rs).
- [C5] [Pinned goal tool](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/tool.rs).
- [C6] [Pinned goal service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/api.rs).
- [D1] [Official app-server documentation](https://learn.chatgpt.com/docs/app-server).
- [D2] [Official skill documentation](https://learn.chatgpt.com/docs/build-skills).
- [G1] [Workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs).
- [G2] [GitHub CLI run inspection](https://cli.github.com/manual/gh_run_view).
