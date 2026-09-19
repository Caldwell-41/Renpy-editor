# CI optimisation and durable external wait/wake

**Revision:** 2026-09-19, combined privacy corrections and OPT-1A implemented locally.
**Current delivery:** [Privacy corrections plus OPT-1A](ci-opt-1a-privacy-and-operation-foundation.md), preparing exact published CI evidence.
**W0 capability status:** Investigation complete; automatic wait/wake remains no-go/unqualified for the path examined.
**Repository / branch / PR:** `Caldwell-41/Renpy-editor`, `maintenance/ci-optimisation`, #12.
**Integration baseline:** main `7d634eeaf53fe0244a2739f26914797ca16ef544`.
**Continuation:** [HANDOVER](../../status/HANDOVER.md).
**Rules:** [WORKFLOW](../../WORKFLOW.md), [local client privacy](../../LOCAL_CODEX_CONFIG.md).

This is the parent roadmap and detailed wait/wake design. The linked combined brief
owns the current privacy/OPT-1A implementation specification and result ledger;
this roadmap owns dependencies and later scope. Prompts select the delivery, not a
second specification. W0 evidence remains in the
[qualification report](../../research/CODEX_WAIT_WAKE_QUALIFICATION.md).

## 1. Authority and checkpoint sequence

The latest user instruction explicitly selects the privacy corrections/checks AND
OPT-1A in one next implementation chat, followed by self-review, published handover
and a W1 next-chat selector subject to its entry gates. This is one bounded exception
to the one-checkpoint-per-chat default. Execute Gate P, then Gate A, without another
approval pause between them once P passes. The implementation brief defines the tests
and scope-appropriate CI authority. This amendment itself is documentation only.

W1 implementation is NOT part of that chat. W0 no-go is not waived by approving
independent CI tooling. Printing a W1 prompt does not establish qualification or
approve live goal manipulation. No application-feature scope is created here.

| Delivery / checkpoint | Scope and gate |
| --- | --- |
| W0 | Investigation complete; automatic path unqualified. Recovery only after changed prerequisites and separate selection. |
| **Privacy corrections + OPT-1A** | Implemented locally; exact published quality/native/production evidence is recorded in the combined ledger. |
| W1 | Qualified wait/wake implementation and offline fault tests. Requires actual W0 go and passing combined delivery; separate chat, automatic mode initially disabled. |
| W2 | Real owning-runtime/native supervisor qualification after W1 and approval; service installation requires explicit permission. |
| W3 | Real GitHub Actions end-to-end wake proof and agent adoption after W2 and approval. |
| OPT-2A | Cheap shared preflight, trigger/concurrency controls and diagnostics; separately selected when ready. |
| OPT-2B | Conservative cross-commit acceptance-evidence reuse after OPT-2A; observation-only first and separate approval. |
| CLOSE | Integrated review, merge, branch retirement and documentation consolidation after accepted implemented scope or explicit deferral. |

Keep separate Gate P and Gate A evidence even though they share a chat. Otherwise
retain one checkpoint per chat. On interruption/failure publish the exact incomplete
state; do not skip gates to reach the next prompt. Ordinary CI work does not require
successful automatic Codex resumption. Reuse the existing branch/PR and preserve
unrelated work. No merge/deletion during this delivery; CLOSE retains cleanup ownership.

## 2. Evidence, intent and local-only identity

The planning baseline had `scripts/validate.py`, separate quality CI and Windows x64/
macOS ARM64 production gates. W0 added documentation; the subsequent review added
privacy/bootstrap code but not `ci.py`, a watcher or a continuation bridge. That
bootstrap has two reviewed protection gaps, now assigned to Gate P. [R1-R3]

Separate runner execution, ordinary process/API work and model turns/context work.
Target: no autonomous inference/model polling attributable to a registered wait after
the originating turn finishes and before a terminal/monitoring-failure event. User
messages remain allowed and may supersede it. Do not infer savings from elapsed time.

Identifiable host/runtime information must exist ONLY locally under
[LOCAL_CODEX_CONFIG](../../LOCAL_CODEX_CONFIG.md), including diagnostic receipts.
Public templates stay null. Gate P must correct staged-byte and exact-ignore checking
BEFORE trusting bootstrap for sensitive writes. It also makes explicit-client selection
and storage permissions truthful. A routing fingerprint is neither client identity nor
qualification. Native thread/goal/queue/turn bindings remain local per-task state.
Shared handovers publish methods/outcomes and repo commit/Actions references only.

## 3. W0 recovery: bounded actual-host proof

Original observations and untested gates are in the qualification report; the remote
review did not re-execute them. Missing original private receipts cannot be reconstructed
from prose. Future probes retain exact versions, schema/source hashes, owner comparisons
and raw receipts locally; publish an allowlisted capability report, not installed inventory.

Investigate only the actual task via supported native interfaces. Inspect documentation
and source matching installed CLI and owner runtime privately. No guessed endpoints,
port scans, unrelated task access, replacement server, competing agent, forced runtime
upgrade, exposed listener or installed service. Small probes may live under
`spikes/codex-waitwake/`; production bridge implementation is not W0.

Disposable sessions supplement risky tests only with explicit permission and never
replace actual-owner proof. Live pause/unload/delivery probes need authority, test action,
usage allowance, deadline and abort/restoration contract. Do not strand the task, reset
budgets or change unrelated goals. Current combined-delivery approval does not grant
these live probe permissions or require repeating unchanged blocked W0 discovery.

| Capability | Required proof; identifiable evidence stays private |
| --- | --- |
| Actual owner | Native thread ID, exact owner record, workspace, binary/runtime and endpoint cross-check; distinguish thread from session root. |
| External observer connection | Authenticated supported connection usable without model turns; chat-only tool access is insufficient. |
| Loaded idle | Correlated queue receipt, started turn and claimed result on the same thread. |
| Unloaded saved | Same-ID resume, auto-dispatch reconciliation, no duplicate start and valid result. |
| Usable tools | Harmless representative post-resume tool operation in the intended workspace with existing permissions/handlers. |
| Inactivity | Authorised suspension with authoritative records showing no wait-driven autonomous continuation. |
| User control | Ownership/revision OR supported host serialization of all relevant user actions; never overwrite a later user pause. |
| Delivery reconciliation | Queue/turn/history distinguishes accepted, started, claimed and unknown; queue absence is not consumption proof. |
| Cancellation | Reconcile/delete only the event's queued item, revoke generation and reject late task-changing actions. |
| Persistence/visibility | Select actual supervisor and visible non-model failure path; lifecycle qualification remains W2. |

A pause marker plus reading `paused` is not compare-and-set; internal goal-ID checks
are not caller-visible revision control. Lost user-event visibility invalidates claims
based on observing no changes. Establish ownership-safe control rather than declaring
an upstream patch the only remedy. Without it, automatic restoration remains blocked.

Registration cannot arm delivery before verified suspension and originating-turn end;
CI may finish first and its event must be buffered. Stable client IDs are correlation,
not assumed server deduplication. Claim instructions are not runtime guards. Saved
metadata does not restore dead tool clients or failed required MCPs. Disconnected
telemetry is not zero-inference proof. Resolve these before qualifying W1 entry.

Publish pass/reported/partial/blocked/not-tested per capability. A finished investigation
may be no-go, not qualified just because source primitives exist. Missing access in one
path is not proof all clients lack an API. Stop for review after recovery; no gate waiver.

## 4. Source references versus deployment qualification

Public tags `rust-v0.155.1` and `rust-v0.155.0-alpha.9` identify historical source reviews,
not a new client's runtime settings. The reviewed CLI queues through `thread/queue/add`,
creates a fresh client ID each invocation and returns acceptance, not proof of resume/
start/claim. Eligible loaded idle threads can dispatch; queue-start requires a loaded
thread and refuses active/pending turns. Interrupted/archived/ephemeral differ. [C1-C4]

The reviewed goal contract did not establish caller pause ownership/revision. Recheck
the actual schema rather than invent fields. App-server documentation distinguishes
read, resume and execution; inactive-thread unloading is not conversation erasure or
proof of a universal model timeout. Required client tools need separate verification. [C5-C6, D1]

Prefer a narrow qualified structured adapter, not CLI prose or a handwritten WebSocket
stack. Do not modify Codex internals or launch another owner to hide missing capability.

## 5. Current combined implementation brief

The canonical specification is
[ci-opt-1a-privacy-and-operation-foundation.md](ci-opt-1a-privacy-and-operation-foundation.md).
It replaces the earlier short OPT-1A sketch for the current delivery, without approving
OPT-2A/B or W1. It owns Gate P staged-content/exact-ignore/client-storage corrections;
Gate A doctor/preflight, durable candidate/request identity, current dispatch receipts,
immutable workflow checkout, attempt-specific collection; negative/fault/native tests;
actual GitHub validation; final self-review and conditional W1 handover.

No `ci.py` command is implemented merely by publishing the brief. CI tooling must work
independently of an unqualified Codex binding. Actual client setup cannot be replaced
by initialisation in an unrelated review sandbox. Sensitive writes wait for corrected
protection; source/helpers/tests and documentation may be developed with synthetic data.

## 6. Wait/wake architecture and initial operating contract

GitHub Actions is the first/only backend. Keep small observation/delivery interfaces
for future process/render/file/MCP jobs without implementing them now. No subagents,
alternate models, public webhooks, distributed failover or self-hosted CI runners.
One owning supervisor host, one registered wait per task, clean committed candidate,
explicit deadlines; no automatic reruns/merges. A different client does not gain private
thread control from a repo handover.

```text
Task -> bind run/attempt/SHA -> durable private checkpoint -> register observer
     -> confirm authorised suspension -> originating turn ends -> arm delivery
           NO AUTONOMOUS MODEL ACTIVITY ATTRIBUTABLE TO THIS WAIT
Observer -> detect outcome -> persist event -> owning-runtime queue/resume
         -> correlated turn -> single verified claim -> existing checkpoint work
```

Ordinary non-model API polling is allowed; do not allocate an Actions runner merely
to watch another run. Reuse OPT-1A collection rather than a second CI controller.

| Planned component | Responsibility |
| --- | --- |
| `scripts/waitwake.py` | Doctor, registration, status, recovery, cancellation, claim and cleanup. |
| `scripts/waitwake_lib/state.py` | Private versioned SQLite journal/outbox, unique events and fenced leases. |
| `scripts/waitwake_lib/github_actions.py` | Bound run/attempt observation and shared collection. |
| `scripts/waitwake_lib/codex_bridge.py` | Owner verification and queue/resume/start reconciliation. |
| `scripts/waitwake_lib/supervisor.py` | Non-model lifecycle, heartbeat, restart and delivery ownership. |
| `tests/waitwake/` | Provider/runtime fakes, fault injection and qualified integration tests. |
| `docs/CI_ORCHESTRATION.md` and external-wait skill | Tested operational and recovery instructions; mark available versus future commands. |

Do not invoke hypothetical wait/wake commands. Pin/copy a verified helper revision so
worktree changes cannot silently replace a privileged worker. Local bootstrap is not
the event journal. OPT-1A may publish its own implemented commands in the operations
guide before W3, but must explicitly state that automatic wait/wake is unavailable.

## 7. Private state and transition guards

Use protected local storage/SQLite, not Codex's internal DB or a shared native/WSL
journal. Persist schema/policy/helper versions; operation generation; repo/workflow/
run/attempt/SHA; required gates; owner/config/thread/session/goal identity; worktree/
HEAD and permissions; next approved action; deadlines; lease fencing; queue/turn/claim
receipts and side-effect checkpoints. Do not publish hashes of private identities.

Observation, delivery, claim and task completion are separate axes:

```text
prepared -> observer_registered -> suspended -> yield_confirmed/armed
         -> observed -> delivery_pending -> enqueued -> turn_started
         -> continuation_claimed -> checkpoint_result_recorded
```

Buffer pre-arm completion. Arming uses a proven runtime contract, not model keep-alives.
Persist events before delivery. Exceptional states include `delivery_unknown`,
`blocked_manual`, `revoked`, `superseded`, `user_paused`, `cancelled`. New instructions,
changed workspace, lost ownership/telemetry or stop require revalidation; no automatic
worktree reset. A claim is not completed follow-up work; reconcile interrupted effects.

Leases protect cooperating observers, not arbitrary agents. Distinguish enforced guards
from instructions. Require one authoritative claim and side-effect reconciliation;
do not promise exactly-once inference across every remote crash. Ambiguity blocks visibly.

## 8. Watcher lifecycle, deadlines and diagnostics

Use a persistent user-owned supervisor, not a disposable tool child. Confirm durable
registration before yield. Use modest API intervals, request limits, retry-after and
bounded backoff/jitter. Record transitions rather than repeated full logs.

Qualify the actual host. Windows scheduled-task/toast and macOS LaunchAgent are candidate
patterns, not installed selections. Installation needs permission. Verify each native
target's locks/ACLs, spaces/Unicode, crash/login/sleep/reboot recovery, notifications and
uninstall. WSL is separate. Do not assume POSIX signals or detached children survive.

Restart recovers existing operations, not replacement CI. Fence with process start
identity, not PID alone; no cross-host takeover. Observation deadlines include sleep;
provider, watcher, delivery timeout and approval wait are distinct. Local expiry does
not cancel CI. Late revoked/superseded/deadline-closed events remain private for manual
inspection, not automatic wake-up.

After bounded safe retries expose visible non-model notification, durable blocked
status and precise recovery. A quiet file is not notification proof. Powered-off
infrastructure cannot wake immediately. Diagnose notification failure. Preserve
unresolved outbox/claims and bounded tombstones during cleanup.

Raw identities/logs remain local. Publish sanitised transition reasons and test results.
Measure observation-to-event/event-to-claim latency, duplicate suppression and actual
model activity without uploading client fingerprints.

## 9. Delivery, pause restoration and cancellation

Loaded idle: queue and observe dispatch. Loaded active: leave queued; do not interrupt
user work or reorder unrelated messages. Unloaded saved: resume same authorised ID,
recheck for auto-dispatch, and start the selected item only if still queued and idle.
Never additionally issue unconditional turn-start or independent exec-resume.

Queue receipt, correlated start and verified claim are distinct. Stable IDs do not
prove server deduplication. Lost response requires queue/turn/history reconciliation;
still unknown means block/notify. Absence is not consumption. Validate task generation,
workspace/candidate, permissions and scope before effects. Duplicates must not repeat
submissions, commits or merges.

Cancel/supersede by revoking generation and reconciling/deleting only this wait's item.
Started continuations reject revoked actions. Do not touch unrelated messages or resume
intentional user interruption/archive. New clients do not inherit pause ownership.

Pause only with ownership-safe authority. Preserve goal/objective/accounting, model/
reasoning, tools, approvals, sandbox and budgets; never mark complete just to suppress
work. Establish event handling before restoration to avoid competing continuation.
Missing ownership/serialization, lost events, user pause, approval or usage limits block
restoration. Manual recovery remains labelled degraded support, not a passing gate.

## 10. Outcome envelope and security

Bind repository/workflow/run/attempt/candidate and all required job pages. Overall
success is not proof of complete required gates. Distinguish success, test failure,
cancellation, provider timeout, monitoring/auth error, watcher crash, delivery unavailable/
unknown and user stop. Retry via bounded ordinary code only.

Private wake envelopes contain operation/checkpoint generation, candidate, Actions
identity, required jobs, bounded redacted errors, evidence and next approved action.
Cap fields/total size and mark truncation. Public receipts strip routing/local evidence
references. Do not load entire logs by default.

Observer needs Actions read, not write/merge/cancel. Bridge is privileged: restrict
registered targets and operations and identify host-enforced versus adapter-only limits.
Use protected local/authenticated transport, never a public unauthenticated endpoint
or model credentials in Actions. Strict schemas, identity checks, argument arrays,
limits and control-sequence removal are required. Logs/project content are data, not
instructions. No bypass flags, internal DB edits or automatic host migration. [D1]

## 11. W1-W3 test and rollout gates

**W1 entry:** both Gate P/OPT-1A acceptance AND actual W0 go are required. The combined
chat performs a bounded entry review and provides a readiness-only W1 prompt if W0 is
still no-go; it does not run W0 recovery or fabricate a pass. W1 coding is a separate
chat after real prerequisites. Existing 16 privacy tests and new CI tests are not
host/runtime qualification. See the combined brief's next-prompt decision rule.

**W1 implementation:** automatic mode off. Offline tests cover statuses/pagination,
missing evidence, redaction, wrong identity/attempt, lost responses, pre-arm completion
and deadlines. Inject crashes before/after checkpoint/outbox, enqueue, receipt, start
and claim. Cover dual observers, stale leases/fencing/PID reuse, duplicate/revoked
items, user changes, unrelated messages, changed worktrees, interrupted claims,
notification failure, copied/stale profiles and session rebinding. Mocks are not native
acceptance. Publish evidence and remaining limits, then stop.

**W2:** test loaded idle/active, unloaded, paused-goal, interrupted, archived, ephemeral,
required-tool failure, approval/usage blocks, disconnected and unsupported cases. Test
resume/start races, receipt loss, cancellation after enqueue, user-pause races and tools
after cold resume. Qualify each host/ACL/supervisor/notification explicitly. Linux mocks
or application CI do not substitute. Version/client changes invalidate affected proof;
no silent model/host fallback. Stop for review.

**W3:** approved cheap manual Actions fixture for real success/failure/cancel/timeout;
bind actual identity, yield and prove the same original thread claims completion.
Include unload, restart, duplicate delivery, revocation and restored tools. Shared runs
cannot create competing writers. Prove no wait-driven model turns/goal continuation
using authoritative telemetry; record user activity separately. Missing notifications
or no API key in a watcher is not proof. Identifiable telemetry stays local.

Attach to one otherwise-required production run and verify both target outcomes; no
matrix per watcher test. Retain private queue/turn/claim equivalence receipts and publish
only sanitised methods/results and repo references. Add tested automatic commands and
`.agents/skills/external-wait/SKILL.md` only after proof. Confirm instruction discovery
and actual registration/yield behavior; instructions are not enforcement. Enable only
qualified configurations with visible manual fallback. Publish and stop. [D1-D2, G1-G2]

## 12. OPT-2A: cheap gates and execution efficiency

Make shared cheap preflight a native-job prerequisite: repository/staged privacy, tooling
tests, `npm run check`, Rust formatting. Do not duplicate a full Linux Rust/SDK build
without benefit. Preserve native core/SDK/desktop/package/WebView/denial/privacy/inventory.
The small candidate-identity gate in OPT-1A is not this full preflight redesign.

Share PR/production checks without redundant push-plus-PR work or disappearing required
checks. Main reports docs-only decisions inside checks. Aggregator requires full native
success or verified equivalence, never skipped-job success. Review check names/rules;
missing administrative access does not permit weaker policy.

Concurrency serializes rather than deduplicates. Share branch/workflow groups across
push/manual events; initially protect running candidates (`cancel-in-progress: false`)
and recheck after completion. Obsolete cancellation is explicit and run-specific, not
triggered by every docs push. Add measured watchdogs with cold-cache margin, remove
standalone frontend duplication only while Tauri's hook builds it, preserve useful
caches, mandatory package building and opt-in large uploads. Measure real overhead/
savings and test wrong-SHA/preflight rejection, both required targets and truthful
unknown/skipped outcomes. No fixed speedup promise.

## 13. OPT-2B: conservative acceptance-evidence reuse

Separate approval, observation-only first. Receipt includes schema/policy, tested commit,
input fingerprint, workflow source/run/attempt, gates/jobs, toolchain/SDK/relevant CI
runner class, time and verifiable artifacts. User Codex inventory never belongs here.
Cache hits are not acceptance. Exact already-tested candidate lookup in OPT-1A is not
cross-commit equivalence.

Fingerprint tracked paths/modes/bytes by default, including app/scripts/tests/fixtures/
locks/toolchains/SDK/workflows/policy. Exclude only reviewed non-executable docs proven
not to affect results. Unknown paths count; do not ignore all Markdown or hash only app/.
Account for commit metadata and unpinned inputs. Private client profiles never affect
product builds.

Initially reuse a trusted recent candidate only for docs-only integration descendants
with matching inputs/policy, complete verifiable Windows/macOS success and no invalidating
environment assumption. Proposed maximum seven days, not beyond artifact availability;
age does not prove hosted environment equality. Unproven means full run; explicit
`force_full` bypasses reuse. Report equivalence, not fresh tests. Preserve checks and
refuse changed sources/locks/workflows, unknown inputs, schema differences, unavailable
evidence or incomplete/cancelled/failed targets. No broad historical search. Measure
actual avoided runs, not hypothetical allowance savings.

## 14. CLOSE and handover contract

Review exact scope/approvals/evidence, merge via the existing PR and verify main. Skip
another matrix only with implemented verified policy. Inventory branches/PR ownership;
delete only proven integrated/redundant inactive branches via ancestry or reviewed patch
equivalence. Do not merge obsolete work just to delete it. Preserve main/protected refs,
archive tags, unique work and unrelated PRs. No current-delivery merge/cleanup.

Consolidate lessons into docs/tests/ADRs, archive completed briefs/ledgers and repair
links. Keep one live handover; Git holds older revisions, not a new snapshot each chat.
Keep unique failure evidence and unresolved private journals. Report retained exceptions.

Each delivery publishes authority, state, branch/PR, known implementation candidate,
commands/results, run/attempt/tested SHA, partial/failure evidence, choices and next gate.
Private IDs/paths stay local. No receipt-only commit to chase its own hash or every CI
result. Verify remote publication/checks externally. Interrupted work hands over safe
recovery. The user's combined exception requires both P and A results, not a new chat
between them. W1-readiness reporting never implies a missing W0 pass.

## 15. Execution ledger

### Planning — 2026-09-19

User approved repo-first planning, W0 first, short selectors and safe future cleanup.
Main advanced from Phase 1E merge `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9` to
`7d634eeaf53fe0244a2739f26914797ca16ef544`; quality run `35399385224` passed. No runtime
implementation or production matrix was part of that publication.

### W0 investigation — 2026-09-19

Candidate `24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c`, PR #12. Original owner/task/
workspace/binary matches and current tools were reported successful. Schema/source
review established primitives, not external access, safe cold resume or goal restoration.
Loaded/unloaded wake and inactivity remain untested; cancellation/restored tools partial.
Qualification report retains methods/limits, not private installed inventory. No live
message/goal/task/service/production CI changes. Original validator reported 203 files;
available interpreter used after ordinary launchers were absent. Quality runs
`35404027500` and `35404031132`, attempt 1, passed at
`2917b50a0c469d9308c0cb118a1a36ad554760fd`; receipt head
`7062f63e73025feffe240faffc88418ea3e5c895`. These are docs checks, not automatic-support
acceptance. Investigation finished no-go; that capability result remains unchanged.

### Initial local-privacy addition and subsequent review — 2026-09-19

Commit `33d0e202b2116d11e12c316313f9c1bd0888731e` added inert local bootstrap/template,
ignore/index guards, policy and 16 synthetic tests, without observer/CI-controller/
queue bridge/runtime manipulation. Repository quality run `35406289376` passed the
existing validator/tests; its PR checkout was merge-test SHA
`f98551d451fd4d14857f4b5646de5e0fe600fee9`, not direct branch-head execution.

The subsequent assessment identified staged-content versus working-copy bypass and
sentinel-versus-destination ignore bypass. Existing passing tests did not cover them.
Explicit client identity, native permissions and actual-client setup remain only
partially established. No fix is claimed until Gate P reproduces/corrects/tests them.

### Combined-delivery authorisation — 2026-09-19

The user explicitly requested privacy corrections/check AND OPT-1A in one next chat,
then self-review, published handover and an appropriate W1 prompt. Current detailed
specification/ledger is in the linked combined brief. AGENTS/WORKFLOW record the explicit
exception; CURRENT/HANDOVER select the delivery. This amendment is documentation only;
no P/A code, runtime probe or native validation is executed by publishing it. Its exact
commit's repository-quality check validates docs against the current code, not the
unimplemented corrections. W1 readiness remains conditional on actual W0 go.

### Privacy corrections plus OPT-1A implementation — 2026-09-19

Gate P reproduced both reviewed bypasses before correction: staged populated template
with a clean working copy and ignored sentinel with an exposed exact destination both
failed their new regressions. The implementation now reads raw staged Git objects,
checks stage/mode/object/index stability and staged/working privacy policy, protects
every used local destination, selects client contexts explicitly and verifies native
ACL/mode safety before collecting identity. The synthetic/native-host suite expanded
from 16 to 25 tests; two symlink creation cases were unavailable in the current Windows
sandbox and remain explicit skips rather than passes.

OPT-1A added `scripts/ci.py`, its reusable operation/API/collector layer, 15 offline
tests, candidate validation/pinning in the production workflow, and Windows/macOS
tools-only quality jobs. The local store persists intent before POST and prevents
duplicate dispatch; current 200 receipts, legacy 204, lost response, exact request
reconciliation, pagination, attempts, statuses and bounded redacted failure logs are
covered. `docs/CI_ORCHESTRATION.md` owns commands and recovery. Local doctor found a
configured-but-unverified Git credential provider, public collection, no Codex binding,
and automatic wake disabled. Local npm/Rust tools were unavailable and remain delegated
to the exact native workflow, not passed. Exact candidate/run receipts follow in the
combined brief and handover after publication.

## Primary sources

Public references do not identify a client's installed runtime or qualify a host.
Use matching current schemas privately. Current Git/dispatch references for OPT-1A are
in the combined brief; do not copy older dispatch assumptions from this roadmap.

- [R1] [Merged Phase 1E](https://github.com/Caldwell-41/Renpy-editor/pull/9).
- [R2] [Original production workflow](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/production-scaffold.yml).
- [R3] [Original quality workflow](https://github.com/Caldwell-41/Renpy-editor/blob/f1be3f0745f76e46113df7d3e84e70e13ee9d9c9/.github/workflows/quality.yml).
- [C1] [Queue arguments](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/cli/src/queue_cmd.rs).
- [C2] [Queue/client IDs](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/tui/src/session_queue_commands.rs).
- [C3] [Queue service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/queue/src/service.rs).
- [C4] [Queue RPC processor](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/app-server/src/request_processors/thread_queue_processor.rs).
- [C5] [Goal tool](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/tool.rs).
- [C6] [Goal service](https://github.com/openai/codex/blob/rust-v0.155.1/codex-rs/ext/goal/src/api.rs).
- [D1] [Official app-server documentation](https://learn.chatgpt.com/docs/app-server).
- [D2] [Official skill documentation](https://learn.chatgpt.com/docs/build-skills).
- [G1] [Workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs).
- [G2] [Structured GitHub run inspection](https://cli.github.com/manual/gh_run_view).
