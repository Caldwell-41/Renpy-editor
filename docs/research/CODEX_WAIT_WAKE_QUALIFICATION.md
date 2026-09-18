# Codex wait/wake actual-host qualification

**Date:** 2026-09-19  
**Checkpoint:** W0 actual-host feasibility  
**Outcome:** **No-go for automatic support; investigation complete for review**  
**Host:** Local Windows x64 ChatGPT desktop task  
**Runtime:** `codex-cli 0.155.0-alpha.9`; the running Codex process and invoked CLI
resolved to the same binary content. The desktop host reported build `153.0.8010.48`.

## Scope and safety boundary

This qualification inspected the actual task-owning host and the exact installed
runtime. It did not install a supervisor, expose a listener, alter production CI,
start a competing task, fork a task, change another task, pause the current goal,
or enqueue a message that could execute after this turn. No credentials, raw runtime
endpoint, full thread ID, private history, or absolute machine path is recorded here.

The repository started at freshly fetched main
`7d634eeaf53fe0244a2739f26914797ca16ef544`. No reusable probe code was needed;
the runtime generated its own version-matched JSON schemas into disposable OS
temporary directories. Source comparison used the exact public tag
`rust-v0.155.0-alpha.9`.

## Bounded probes

| Probe | Expected | Observed | Rollback / residue |
| --- | --- | --- | --- |
| `codex --version` plus running-process binary comparison | Identify the installed CLI and whether the owning Codex process uses the same binary. | CLI reported `0.155.0-alpha.9`; binary hashes matched. | Read-only. Hash and private path were not retained. |
| Native `CODEX_THREAD_ID` cross-check | Match the shell's task ID to the host's exact task record. | Exact match; host reported `local`, active, and the expected repository workspace. | Read-only; the ID is intentionally omitted. |
| Owning-host task list and exact-ID task read | Address the original task without `--last`, title, or recency lookup. | Pass. The host returned this task and its in-progress originating turn by exact ID. | Read-only. Private turn content is not retained. |
| `codex queue --help` | Confirm the installed CLI exposes an exact-thread queue command. | Pass. The command accepts `--thread` and `--message`, with optional remote transport settings. | Read-only. |
| `codex app-server generate-json-schema --out <temp>` | Inspect stable goal fields from the installed binary. | Pass. `ThreadGoalSetParams` contains thread ID, objective, status, and token budget only. | Temporary schema only; no runtime state changed. |
| Same schema command with `--experimental` | Inspect the installed queue contract. | Pass. Add/list/delete/start schemas expose a caller message ID, server queue ID, exact-item deletion, and selected-item start. | Temporary schema only; no runtime state changed. |
| Exact-tag source inspection | Check behavior not expressed by schema. | Queue add persists then wakes a loaded task; start requires a loaded task, is idle-only, and removes the item only after start acceptance. The CLI creates a fresh client UUID for each invocation. | Read-only HTTPS requests to public source. |
| Goal read through the current tool | Confirm the actual task has an active goal and preserves its objective/accounting. | Pass for read access. The exposed mutation tool permits pause only at explicit user request. | Read-only; no pause/resume was attempted. |

## Source and schema findings

The [official app-server documentation](https://learn.chatgpt.com/docs/app-server)
distinguishes `thread/read`, `thread/resume`, and turn start, documents runtime status
and loaded-thread inspection, and warns that required tools can make resume fail.
It does not document queue operations as stable APIs. In the installed schema and
matching source, queue methods are explicitly experimental.

The exact installed source establishes the useful lower-level primitives:

- [`thread/queue/add`](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/app-server/src/request_processors/thread_queue_processor.rs)
  returns a persisted queue item with a server ID while preserving the caller message
  ID. List and exact-ID delete are separately available.
- The matching
  [queue service](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/ext/queue/src/service.rs)
  wakes only a loaded task after enqueue. Selected start is idle-only, and a queue
  item is deleted only after core accepts the turn. An unloaded task must be resumed
  before queue start.
- The matching
  [CLI implementation](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/tui/src/session_queue_commands.rs)
  generates a new client UUID for every invocation and prints the returned server
  queue ID. The ID is correlation, not proven enqueue deduplication.
- The installed goal schema and matching
  [goal service](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/ext/goal/src/api.rs)
  expose no caller owner, revision, expected-status, or compare-and-set field. A read
  of `paused` therefore cannot prove that an observer still owns the pause or safely
  restore over a later user decision.

The owning desktop integration available to this task can list/read/wait on an exact
task and send a follow-up, but it does not expose queue list/delete/start receipts or
a subscription/telemetry channel to an external non-model observer. The standalone
CLI queue command is not enough: blindly reissuing it after a lost response creates a
new client UUID, and its success does not prove a correlated turn started or claimed
the work.

## Capability matrix

| Capability | Result | Evidence / limit |
| --- | --- | --- |
| Actual owner | **pass** | Native task ID, owning host record, workspace and running binary matched. CLI/daemon binary version is `0.155.0-alpha.9`. |
| Addressable task | **pass** | The owner read the original active task by exact ID. |
| Loaded-idle delivery | **not-tested** | The original task was active. Enqueuing a self-message could dispatch after this turn; changing an unrelated idle task was outside scope. Source support is not target-path proof. |
| Unloaded saved thread | **not-tested** | Safe unload requires ending/unsubscribing the current task and waiting for the unload grace period. The owning surface does not expose that bounded control here, and intentionally stranding the task is prohibited. |
| Usable execution | **partial** | Representative file, Git, web, and host tools work in the expected current workspace. Tool restoration after same-ID cold resume was not tested. |
| Real goal inactivity | **not-tested** | No user-authorised pause was performed, and no authoritative runtime-side model-activity telemetry is exposed to the prospective observer. |
| User control | **blocked** | Goal mutation has no visible owner/revision/conditional write. Safe restore after an intervening user pause cannot be proved. |
| Ambiguous delivery | **blocked** | Exact queue/list/turn primitives exist in the versioned protocol, but the actual task-owning integration does not expose the queue receipts needed by an external observer. CLI add alone cannot reconcile lost responses. |
| Cancellation | **partial** | Exact queue-item deletion exists in schema/source, but no live owning-host path was available to prove delete/revoke races without leaving a late self-message. |
| Persistent observer | **partial** | The actual host is local Windows x64. A user-scoped Windows Scheduled Task is the provisional supervisor and a Windows toast plus durable status record is the provisional failure route; neither was installed or qualified. The continuation bridge remains unavailable. |

## Qualification decision

W0 is a **no-go for automatic wait/wake support on the current exposed host contract**.
Two independent blockers are decisive:

1. no ownership-safe or revision-conditional goal pause/restore contract; and
2. no externally usable owning-host queue/turn/claim reconciliation and authoritative
   activity stream for the original task.

A loaded queue implementation and a readable task are necessary but insufficient.
Mocks, another task, an embedded second app-server, manual prompting, absence from a
queue, or elapsed silence cannot substitute for the missing proofs.

No later checkpoint was started. Until recovery is explicitly selected and succeeds,
long external waits must use the repository's published manual-resume handover. The
current W0 goal completes normally after publication; it was not paused as a probe.
Independent OPT-1A CI work remains technically separable but still requires its own
checkpoint instruction.

## Required recovery before automatic support can pass

- Expose a supported, authenticated connection to the **owning** daemon for exact-ID
  queue add/list/delete/start plus correlated turn/history receipts, or an equivalent
  host API with those guarantees.
- Add caller-visible goal pause ownership or revision/compare-and-set semantics that
  prevent restoration over an intervening user decision.
- Expose authoritative runtime-side activity and user-event telemetry with defined
  disconnected coverage.
- Then obtain explicit authority for a bounded live probe of this task: action and
  turn allowance, deadline, unload/pause restoration, cancellation, and abort path.
- Re-run loaded-idle, unloaded same-ID, restored-tool, ambiguous-response, cancellation,
  pause/restore race, and zero-autonomous-activity cases on the original task owner.

