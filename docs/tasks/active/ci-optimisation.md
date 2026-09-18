# CI optimisation and durable external wait/wake

**Revision:** 2026-09-19, W0 review and local-privacy amendment.
**State:** W0 investigation/review ready; automatic wait/wake remains unqualified.
**Repository / branch / PR:** `Caldwell-41/Renpy-editor`, `maintenance/ci-optimisation`, #12.
**Integration baseline:** main `7d634eeaf53fe0244a2739f26914797ca16ef544`.
**Continuation:** [HANDOVER](../../status/HANDOVER.md).
**Rules:** [WORKFLOW](../../WORKFLOW.md), [local client privacy](../../LOCAL_CODEX_CONFIG.md).

This is the detailed repository-owned plan. Prompts select one checkpoint, not a
second specification. W0 findings are in the [qualification report](../../research/CODEX_WAIT_WAKE_QUALIFICATION.md).
Current status overrides the old planning-era statements that W0/its branch did not
exist. Earlier revisions remain in Git history; no failed or unavailable gate becomes
passing through this amendment.

## 1. Authority and checkpoint sequence

The user approved W0 first, one checkpoint per chat, published repo handovers and safe
final integration/cleanup. This review also authorises the requested local-only privacy
policy, inert client bootstrap and privacy regressions; it does NOT start OPT-1A/W1 or
approve runtime manipulation. A new checkpoint needs a user checkpoint-start instruction.
No Phase 1F or other application-feature scope is created here.

| Checkpoint / separate chat | Scope and gate |
| --- | --- |
| W0 | Investigation complete for review; conservative no-go on the path examined. Recovery only after changed prerequisites and separate selection. |
| OPT-1A | Candidate-specific CI submission, compact collection and operation/checkpoint contract. Independent of automatic wake; separately selectable now. |
| W1 | Qualified wait/wake implementation plus offline state-machine/fault tests. Requires actual W0 go, OPT-1A and approval; automatic mode initially disabled. |
| W2 | Real owning-runtime and native supervisor qualification. Requires W1 and approval; installing a service needs explicit permission. |
| W3 | Actual GitHub Actions end-to-end proof and agent adoption. Requires W2-qualified configurations and approval. |
| OPT-2A | Cheap preflight dependencies, trigger/concurrency controls and diagnostics. Independently selectable when its prerequisites/approval are met. |
| OPT-2B | Conservative acceptance-evidence reuse after OPT-2A; separate approval and observation-only rollout first. |
| CLOSE | Integrated review, merge, branch retirement and documentation consolidation after accepted implemented scope or explicit deferral. |

Complete, review and troubleshoot one row per chat, then publish the ledger and live
handover and stop. An investigated no-go is not an automatic-support pass. Ordinary
CI work need not wait for W0 recovery, but no later checkpoint starts automatically.
Reuse the existing branch and PR #12 across chats. Inspect actual refs/uncommitted
work; never recreate the branch, reset to the old baseline or replay merged Phase 1E.
Do not merge/delete legacy branches before authorised CLOSE checks.

## 2. Evidence, intent and local-only identity

The planning baseline had `scripts/validate.py`, separate cheap quality CI and the
Windows x64/macOS ARM64 production matrix, but no `ci.py` or wait/wake bridge. W0 added
only documentation. This review adds privacy/bootstrap support and cheap tests, not
an observer, CI controller or automatic continuation. [R1-R3]

Separate runner execution, ordinary process/API work and model turns/context work.
Target: no autonomous inference/model polling attributable to a registered wait after
the originating turn finishes and before a terminal/monitoring-failure event. User
messages remain allowed and may supersede it. Do not infer savings from elapsed time
or promise a fixed allowance multiplier.

Identifiable host/runtime information must exist ONLY locally as defined by
[LOCAL_CODEX_CONFIG](../../LOCAL_CODEX_CONFIG.md), including in future diagnostics.
Each new actual client runs `scripts/codex_local.py init`, completes verified local
fields, and revalidates ownership each session. Public templates stay null. Bootstrap
routing fingerprints are local-only, not publishable anonymisation or qualification.
Native thread/goal/queue/turn bindings are local per-task state, never global defaults.
Repository handovers publish methods/outcomes and repo commit/Actions references only.
Future helpers reuse this privacy contract instead of embedding client settings in CI,
AGENTS, reports, prompts, artifacts or checked-in configuration.

## 3. W0 recovery: bounded actual-host proof

Original observed checks and untested gates are in the qualification report. They are
reported observations, not re-executed by the remote review. Missing original private
receipts cannot be reconstructed from prose. Future probes retain exact versions,
schema/source hashes, owner comparisons and raw receipts locally; publish an allowlisted
capability report. Current build inventories are not shared documentation.

Investigate only the actual owning task through its native supported interfaces.
Read current official documentation and source matching both installed CLI and owner
runtime locally. No guessed endpoints, port scans, unrelated task access, replacement
server, new competing agent, forced SDK upgrade, listener exposure or service install.
Small reusable probes belong under `spikes/codex-waitwake/`; no production bridge in W0.

A disposable session supplements risky testing only with explicit permission; it never
substitutes for actual-owner access. Before any live pause/unload/delivery probe, obtain
authority and record test action, model-turn/usage allowance, deadline and safe abort/
restoration. Do not strand the current task, reset budgets or change unrelated goals.

| Capability | Required proof, retained privately where identifiable |
| --- | --- |
| Actual owner | Cross-check native thread ID, exact owner record, workspace, CLI/daemon identity and endpoint; distinguish thread ID from session root. |
| External observer connection | Supported authenticated connection usable without model turns; internal chat tool access alone is insufficient. |
| Loaded idle | Correlated queue receipt, started turn and claimed result on the same thread. |
| Unloaded saved | Same-ID resume, automatic-dispatch reconciliation, no duplicate queue-start and valid result. |
| Usable tools | Representative harmless tool execution after resume with the expected worktree and existing permission/tool handlers. |
| Inactivity | Authorised suspension and authoritative runtime records proving no wait-driven automatic continuations. |
| User control | Caller-visible ownership/revision OR a supported host mechanism serializing all relevant user actions; never restore over a later user pause. |
| Delivery reconciliation | Queue/turn/history evidence distinguishing accepted, started, claimed and unknown; queue absence is not consumption proof. |
| Cancellation | Delete/reconcile only this event's queued item, revoke its generation and stop late task-changing actions. |
| Persistence/visibility | Select actual supervisor and visible non-model failure notification; qualification remains W2. |

A pause marker plus reading `paused` is not compare-and-set; internal goal-ID checks
are not caller-visible revision control. Lost user-event visibility invalidates a
claim based on observing no changes. Establish supported ownership-safe control rather
than declaring an upstream patch the only remedy. If it is unavailable, automatic goal
restoration stays blocked; manual continuation is degraded support, not a pass.

Registration cannot arm delivery before verified suspension and originating-turn end;
CI may finish first and its event must be buffered. Stable client IDs are correlation,
not assumed server enqueue deduplication. Claim instructions are not runtime guards.
Saved metadata does not restore dead dynamic-tool clients or failed required MCPs.
Disconnected telemetry is not proof of zero inference. Resolve these before W1.

Publish pass/reported/partial/blocked/not-tested per capability. A complete investigation
may be no-go; it must not be labelled qualified because source primitives exist. Record
unavailable host access precisely, not as proof all clients lack an API. Stop for review.

## 4. Source references versus deployment qualification

Public reference versions `rust-v0.155.1` and `rust-v0.155.0-alpha.9` document prior
source inspections, not a promise about a new client's installed runtime. The reviewed
CLI queues through `thread/queue/add`, creates a fresh client ID each invocation and
returns queue acceptance. It does not itself prove resume/start/claim. Eligible loaded
idle threads can dispatch; queue-start requires a loaded thread and refuses active/
pending turns. Interrupted, archived and ephemeral cases remain distinct. [C1-C4]

The reviewed goal surface did not establish caller-supplied pause ownership/revision.
W0 must inspect the actual exposed schema, not invent fields. App-server documentation
distinguishes read, load/resume and turn execution, and describes experimental surfaces;
inactive-thread unloading is not conversation erasure or a universal model timeout. [C5-C6, D1]

Prefer a narrow version-qualified structured protocol adapter over CLI text parsing.
Use a reviewed pinned transport if necessary; do not write a WebSocket stack or change
Codex internals. Discovery is separate from connecting/arming. Never bypass host permissions.

## 5. OPT-1A: operation foundation

Add `scripts/ci.py` with approved GitHub authentication and these proposed commands:
`doctor`, `preflight`, `submit --ref <branch> --sha <full-sha>`, and
`collect --run <id> --attempt <n>`. They are not implemented by this review.

Doctor records capabilities locally per relevant environment signature and rechecks on
change. Do not repeat known-impossible builds; Linux/frontend/core success is not native
acceptance. Host-specific details stay private under the shared local-client contract.

Submit is find-or-start: attach to matching running work, return verifiable results
under an implemented policy, or dispatch once. Persist request identity before dispatch.
Lost responses/API/auth failure mean unknown; reconcile by request/workflow/ref/SHA,
not newest-run lookup or blind retry. Reject wrong/moving refs before native allocation;
all jobs check out the same verified immutable SHA. Record workflow source revision,
run attempt and candidate independently. Never silently follow a rerun attempt.

Introduce `expected_sha`, `request_id`, `force_full`, `upload_packages` where appropriate.
Full acceptance still builds packages; large bundle upload is opt-in, lightweight
evidence remains. Preserve every existing native/security gate. Share the private
operation/checkpoint/result contract with W1 rather than creating a second controller.

Collect follows all relevant pagination and returns bounded failing-job diagnostics,
explicit missing/truncated evidence and distinct failure/cancellation/timeout/skipped/
unknown outcomes. It reports facts; acceptance policy decides gates. Test duplicate
submission, response loss, wrong/moved ref, auth failure, rerun attempts, pagination,
missing artifacts and interrupted collection. No automatic Codex resume/reuse yet. [G1-G2]

## 6. Wait/wake architecture and initial operating contract

GitHub Actions is the first and only backend. Keep small observation/delivery interfaces
for future process/render/file/MCP jobs without implementing those adapters. No subagents,
other models, public webhook receiver, distributed failover or self-hosted CI runners.
One owning supervisor host, one registered wait per task, clean committed candidate,
explicit deadlines; no automatic reruns or merges. Different clients cannot take over
another client's private thread merely by reading the repo handover.

```text
Task -> bind run/attempt/SHA -> durable private checkpoint -> register observer
     -> confirm authorised suspension -> originating turn ends -> arm delivery
           NO AUTONOMOUS MODEL ACTIVITY ATTRIBUTABLE TO THIS WAIT
Observer -> detect outcome -> persist terminal event -> owning runtime queue/resume
         -> correlated turn -> single verified claim -> existing checkpoint work
```

Ordinary API polling by a non-model process is permitted. Do not allocate an Actions
runner to watch another run. Reuse OPT-1A collection. Planned components:

| Component | Responsibility |
| --- | --- |
| `scripts/waitwake.py` | Doctor, register, status, recovery, cancellation, claim and cleanup. |
| `scripts/waitwake_lib/state.py` | Versioned private SQLite journal/outbox, unique events, fenced leases. |
| `scripts/waitwake_lib/github_actions.py` | Bound run/attempt observation and shared collection. |
| `scripts/waitwake_lib/codex_bridge.py` | Owner verification and structured queue/resume/start reconciliation. |
| `scripts/waitwake_lib/supervisor.py` | Non-model lifecycle, heartbeat, restart and delivery ownership. |
| `tests/waitwake/` | Provider/runtime fakes, fault injection and qualified integration tests. |
| `docs/CI_ORCHESTRATION.md` and external-wait skill | Lasting tested operations/recovery instructions once available. |

Do not invoke these hypothetical commands now. Pin/copy a verified helper revision so
changing the worktree cannot silently replace a privileged in-flight worker. W0 local
bootstrap is not the event journal or supervisor.

## 7. Private state and transition guards

Use private per-user local storage/SQLite, not Codex's internal DB or a shared native/
WSL journal. Persist schema/policy/helper versions; operation/event generation; repo/
workflow/run/attempt/SHA; required gates; exact owning endpoint/config/thread/session/
goal identity; worktree/HEAD and permissions; approved next action; deadlines; lease/
fencing; queue/turn/claim receipts; and side-effect checkpoints. All system/client
bindings remain local. Do not export hashes of these identifiers into GitHub receipts.

Observation, delivery, claim and task completion are separate axes:

```text
prepared -> observer_registered -> suspended -> yield_confirmed/armed
         -> observed -> delivery_pending -> enqueued -> turn_started
         -> continuation_claimed -> checkpoint_result_recorded
```

Buffer terminal observation before arming. The arm signal uses a proven runtime
contract, not an extra model keep-alive. Persist events before delivery. Exceptional
states include `delivery_unknown`, `blocked_manual`, `revoked`, `superseded`,
`user_paused`, `cancelled`. New user directions, changed workspace, lost ownership/
telemetry or explicit stop require revalidation; never reset a worktree automatically.

A lease protects cooperating observers, not arbitrary other executors. Distinguish
runtime-enforced guards from instructions. Require one authoritative claim and side-
effect reconciliation; claimed is not finished. Do not promise exactly-once inference
through every remote crash boundary. Ambiguous delivery must stop visibly rather than
risk repeating task-changing actions.

## 8. Watcher lifecycle, deadlines and diagnostics

Use a persistent user-owned supervisor, not a disposable model-tool child. Confirm
durable registration before yield. Use modest API intervals, per-request timeouts,
retry-after and bounded backoff/jitter. Record transitions, not repeated full logs.

Select/qualify the actual host; generic Windows scheduled task/toast and macOS LaunchAgent
are candidate patterns, not globally selected system values. Install only with explicit
permission. Verify native Windows x64/macOS ARM64 separately: locks, ACLs, spaces/Unicode,
crash/login/sleep/reboot recovery, notifications and uninstall. WSL needs its own proof.
Do not assume Bash/POSIX signals, detached children or interop survive client shutdown.

Restart recovers existing operations without dispatching replacement CI. Use process
start identity/fencing, not PID alone. No cross-host takeover in v1. Observation deadlines
include sleep; provider timeout, watcher timeout, delivery timeout and approval wait are
distinct. Do not cancel CI merely because local observation expired. Late revoked/
superseded/deadline-closed events remain local for inspection, not automatic wake-up.

After bounded safe retries, expose a visible non-model notification, durable blocked
status and precise recovery command. A quiet local file is not notification proof.
Powered-off infrastructure cannot execute an immediate wake. Notification failure is
itself diagnosable. Retain unresolved outbox/claims and bounded deduplication tombstones
through cleanup; do not discard pending recovery to reduce document clutter.

Keep raw logs/identities locally. Sanitised records report transition reasons, test
categories and durations. Measure observation-to-event/event-to-claim latency, duplicate
suppression and actual model activity without uploading system/client fingerprints.

## 9. Delivery, pause restoration and cancellation

Loaded idle: queue and observe dispatch. Loaded active: leave queued, do not interrupt
user work or reorder unrelated messages. Unloaded saved: resume the same authorised
ID, then recheck because resume may dispatch automatically; request selected queue-start
only when still queued and idle. Never additionally issue unconditional turn-start or
independent exec-resume.

Queue acceptance, correlated turn start and verified claim are separate receipts.
Persist a stable event/client ID without assuming server deduplication. Response loss
means reconcile queue/turn/history; if still unknown, block and notify. Queue absence
is not consumption proof. Before actions validate generation, workspace/candidate,
permissions and scope. Late duplicates must not repeat CI submissions, commits or merges.

Cancellation/supersession revokes the generation and reconciles/deletes only this
wait's pending message. An already-started continuation must reject revoked actions.
Do not touch unrelated messages. Intentional user interruption/archive is not permission
to resume. A new client does not inherit pause ownership from another profile.

Pause only through authorised ownership-safe control. Preserve goal/objective,
accounting, model/reasoning, tools, approvals, sandbox and budgets; never mark complete
just to suppress work. Sequence event handling before goal restoration so activation
cannot create a competing continuation. Missing conditional control or serialized
ownership, lost event visibility, new user pause, approval requirement or usage limit
blocks restoration. Manual recovery remains a labelled degraded outcome, not a pass.

## 10. Outcome envelope and security

Bind repository/workflow/run/attempt/candidate. Follow all required job pages. Workflow
success alone is not required-gate evidence. Report distinct success, test failure,
cancellation, provider timeout, monitoring/API/auth error, watcher crash, delivery
unavailable/unknown and user-stop outcomes. Bounded retries use ordinary code only.

Wake envelopes stay inside the owning runtime/private local state. Include operation/
checkpoint generation, candidate, Actions identity, required-job outcomes, bounded
redacted diagnostic text, evidence references and next authorised action. Cap every
field and total size; mark truncation. Public receipts strip private routing/evidence
references. Do not automatically load complete logs into model context.

Observer credentials need Actions read, not push/merge/cancel/rerun. Bridge credentials
are privileged: restrict registered targets and fixed operations; identify host-enforced
versus adapter-only restrictions. No public unauthenticated endpoint or model credentials
in Actions callbacks. Use strict schemas, identity checks, argument arrays, size limits
and control-sequence removal. Logs/project content are untrusted data, never instructions
or commands. No bypass flags, internal DB edits or automatic host migration. [D1]

## 11. W1-W3 test and rollout gates

**W1:** Implement the qualified path after W0 go, OPT-1A and approval, automatic mode
off. Offline tests cover outcomes/pagination, missing/expired evidence, sanitisation,
wrong identity/attempt, response loss, pre-arm completion and deadlines. Inject crashes
before/after checkpoint/outbox, enqueue, receipt, turn-start and claim. Cover dual
observers, stale leases/fencing/PID reuse, duplicate/revoked events, user changes,
unrelated messages, changed worktrees, interrupted claims and notification failures.
Test copied/stale local profiles, forced staging and per-session rebinding as well.
Mocks are not native/runtime acceptance. Publish evidence and remaining gaps, then stop.

**W2:** Test actual loaded-idle/active, unloaded saved, paused-goal, interrupted,
archived, ephemeral, required-tool failure, approval-blocked, usage-limited, disconnected
observer and unsupported paths. Exercise resume/queue-start race, lost receipts,
cancellation after enqueue, user pause/restoration race and usable tools after cold
resume. Qualify each host and ACL/supervisor/notification lifecycle explicitly; source
inspection, Linux mocks and application CI cannot substitute. Version/client changes
invalidate affected qualification. No silent model/host fallback. Stop for review.

**W3:** Use an approved cheap manual Actions fixture for actual success/failure/cancel/
timeout; bind real run/attempt/SHA, yield and prove the same original thread claims the
event. Include unload, watcher restart, duplicate delivery, revocation and restored
tools. Shared fixture runs must not create competing writers. Prove no wait-driven
model turns/inference/goal continuation using authoritative runtime-side telemetry;
record user interactions separately. No API key in the watcher or missing notifications
is insufficient proof. Keep identifiable telemetry local.

Attach to one otherwise-required production acceptance run; verify complete Windows/
macOS outcomes. Do not launch the costly matrix per watcher test. Retain private
queue/turn/claim equivalence receipts; publish redacted methods/results and repo run
references. Only then publish tested operational commands, `docs/CI_ORCHESTRATION.md`
and `.agents/skills/external-wait/SKILL.md`. Confirm the actual host loads instructions
and uses register/yield; instructions are not security enforcement. Enable only qualified
configurations, retain visible manual fallback, publish handover and stop. [D1-D2, G1-G2]

## 12. OPT-2A: cheap gates and execution efficiency

Make cheap preflight a dependency of both native jobs: repository validation, privacy/
CI/helper tests, existing `npm run check` and Rust formatting. Do not add another full
Linux Rust/SDK build without evidence of benefit. Preserve native core, official SDK,
desktop, packaging, WebView/denial, privacy and inventory gates.

Share preflight between PR/production without duplicate push-plus-PR work or disappearing
required checks. Main's controller reports docs-only decisions explicitly inside a
check; aggregator requires native success or verified equivalence, not skipped-job success.
Review check names/rules without weakening policy when administration access is absent.

Concurrency serializes, not deduplicates. Share normal branch/workflow groups across
push/manual events; initially protect running candidates (`cancel-in-progress: false`)
and recheck evidence afterward. Obsolete-run cancellation is explicit and run-specific.
Do not cancel nearly finished acceptance on every docs push.

Add measured step watchdogs with cold-cache margin, remove redundant frontend build
only while Tauri's real build hook remains, preserve npm/Rust/SDK caches. Keep package
building mandatory and large uploads opt-in. Measure successful preflight overhead,
early failure savings and avoided native runs; no fixed speedup/token-saving promise.
Test wrong SHA/preflight failure avoids native allocation; both targets remain required;
missing/skipped/unknown results cannot pass acceptance.

## 13. OPT-2B: conservative acceptance-evidence reuse

Separate approval; start observation-only while still executing full gates. Receipt:
schema/policy version, tested commit, relevant-input fingerprint, workflow source,
run/attempt, gate/job results, toolchain/SDK and relevant CI runner environment class,
time and verifiable artifacts. User Codex host inventory never belongs in this receipt.
Cache hits are not evidence.

Fingerprint tracked paths/modes/contents by default: app, scripts, tests, fixtures,
locks, toolchains, SDK config, workflows and policy. Exclude only reviewed non-executable
docs proven not to affect builds/tests/packages. Unknown new paths are relevant; do not
ignore all Markdown or only hash app/. Account for commit-identity/generated metadata
and unpinned external inputs. Local Codex profiles must never influence product builds.

Initially reuse a trusted recent accepted candidate only for docs-only integration
descendants with matching relevant inputs/policy, complete verifiable Windows/macOS
success and no invalidating environment assumptions. Proposed maximum age seven days,
never beyond artifact availability; age is not proof hosted images remained identical.
Unproven equivalence runs full validation; explicit `force_full` bypasses reuse.

Report equivalence to run X, not fresh native execution. Preserve required checks.
Refuse changed sources/locks/workflow/unknown inputs, schema changes, expired/missing
evidence, cancelled/failed/incomplete targets and unverifiable external dependencies.
No broad historical branch search. Measure actual avoided runs; do not manufacture
allowance savings from hypothetical token counts.

## 14. CLOSE and handover contract

Review exact integrated scope, approvals and real evidence; merge via existing PR and
verify main. Avoid a new full matrix only when implemented verified policy permits;
otherwise obey required gates. Inventory branch/open-PR ownership; delete only proven
integrated/redundant inactive branches using ancestry or reviewed patch equivalence.
Do not merge obsolete branches merely to delete them. Preserve main/protected refs,
archive tags, unique/unreviewed work and unrelated dependency/application PRs. Later
safe-cleanup authority supersedes old preserve notes only after proof; no W0 deletions.

Consolidate durable lessons into docs/tests/ADRs, archive the finished plan/ledger,
repair links and keep one live HANDOVER. Git retains prior handovers; no snapshot per
chat. Preserve unique failure evidence and unresolved private runtime journals. Report
retained branch exceptions rather than forcing an empty list.

Each checkpoint publishes authority, state, branch/PR, known candidate, exact commands/
results, CI references, failures/partial gates, resolved decisions and next approval.
Private identity/evidence stays local; public handovers link only approved sanitised
results. Do not make receipt-only commits to chase a handover's own SHA or each CI
result. Verify actual published head/checks externally. Interrupted work hands over its
safe recovery step; independent milestones remain separately selectable.

## 15. Execution ledger

### Planning — 2026-09-19

User approved repository-first documentation, W0 first, short selectors and future safe
cleanup. Main advanced from Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`
to planning `7d634eeaf53fe0244a2739f26914797ca16ef544`. Quality run `35399385224` passed.
No runtime implementation or production matrix was part of that publication.

### W0 investigation — 2026-09-19

Candidate `24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c`, PR #12. Original native owner/task/
workspace/binary matches and current-workspace tools were reported successful. Stable/
experimental schema and public source inspection established available primitives,
not external owner access, safe cold resume or pause restoration. Loaded/unloaded
wakes and inactivity remained untested; cancellation/tool restoration partial.

The [qualification report](../../research/CODEX_WAIT_WAKE_QUALIFICATION.md) retains
methods and limitations without private installed-build inventory. Supervisor design
was provisional, not installed. No message/goal/task/service/production CI was changed.
Original repository validator reported 203 files; ordinary Python launchers were absent
and an available interpreter was used (exact local paths/inventory are not shared).
Quality runs `35404027500` and `35404031132`, attempt 1, passed at
`2917b50a0c469d9308c0cb118a1a36ad554760fd`. Subsequent receipt head was
`7062f63e73025feffe240faffc88418ea3e5c895`. These were documentation checks, not native
or automatic-support acceptance. The investigation completed with a no-go; review pending.

### W0 review and local-only privacy — 2026-09-19

User requested review plus local-only host/runtime information and fresh setup by each
new client. Review baseline `7062f63e73025feffe240faffc88418ea3e5c895`; same branch/PR.
Corrected stale task state/branch instructions and narrowed universal API claims to
unestablished access in the examined path. Original private observations were not
independently re-run; disposable missing receipts are not reproducible evidence.

Added local client policy, placeholder-only JSON template, non-network `codex_local.py`
bootstrap, `.codex-local/` exclusion, validator Git-index/placeholder checks and synthetic
privacy tests in the cheap quality job. No external observer, production workflow,
actual-user setup, goal mutation, W1 or OPT-1A implementation. Bootstrap settings remain
unverified and automatic mode off. Native ACL/runtime qualification remains future work.

Local review: 16 synthetic privacy/bootstrap tests passed without skips; changed-file
privacy and staged whitespace checks passed. Full checkout validation is the publishing
commit's Repository quality result. Test commands and limitations are in HANDOVER.
The revision's Git commit/checks are its publication receipt; no extra commit just to
copy them here. No runtime wait/queue operation remains outstanding.

Next recommendation: separately select independent OPT-1A, or W0 recovery only after
changed prerequisites. Stop for review; no later checkpoint approval is inferred.

## Primary sources

Public references do not identify the currently installed client or qualify a host.
Use matching current schemas privately before live operations.

- [R1] [Merged Phase 1E](https://github.com/Caldwell-41/Renpy-editor/pull/9).
- [R2] [Original production workflow](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/production-scaffold.yml).
- [R3] [Original quality workflow](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/quality.yml).
- [C1] [Queue arguments](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/cli/src/queue_cmd.rs).
- [C2] [Queue command/client IDs](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/tui/src/session_queue_commands.rs).
- [C3] [Queue service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/queue/src/service.rs).
- [C4] [Queue RPC processor](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/app-server/src/request_processors/thread_queue_processor.rs).
- [C5] [Goal tool](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/tool.rs).
- [C6] [Goal service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/api.rs).
- [D1] [Official app-server documentation](https://learn.chatgpt.com/docs/app-server).
- [D2] [Official skill documentation](https://learn.chatgpt.com/docs/build-skills).
- [G1] [Workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs).
- [G2] [Structured GitHub run inspection](https://cli.github.com/manual/gh_run_view).
