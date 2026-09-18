# Codex wait/wake qualification

**Checkpoint:** W0, reviewed 2026-09-19.
**Outcome:** Investigation complete; automatic wait/wake remains **no-go / unqualified**
for the path examined. This is not a claim that every Codex client lacks the capability.
**Evidence classes:** reported local observations; independently inspectable public
source; live continuation tests not performed. User acceptance remains separate.

## Scope and privacy

The original investigation used a local Windows x64 desktop task and compared its
native task record, workspace and running binary. Those matches are reported W0
observations, not a proof replayed by this review. No production workflow, supervisor,
service, competing task, live pause, unload or self-message was introduced.

All identifiable system inventory and runtime bindings belong only in the client's
private profile/evidence under [LOCAL_CODEX_CONFIG](../LOCAL_CODEX_CONFIG.md). The
shared report stores methods and result categories, not hostnames, private endpoints,
paths, process/binary identities, exact installed desktop builds or thread IDs.
The review found no such raw IDs, endpoints, paths or credentials in W0's changed
files; exact desktop-build inventory has been removed from current text. Earlier
commits are retained, not silently rewritten.

W0 started from main `7d634eeaf53fe0244a2739f26914797ca16ef544` and produced candidate
`24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c` on `maintenance/ci-optimisation`, PR #12.
The repository contains a narrative record, not the original private receipts.
Some original comparisons/schema output were disposable and not retained. Their
absence limits independent reproduction; never recreate missing proof from prose.
Future probes retain exact version/schema/owner observations locally before publishing
a sanitised result. Another client must initialise and qualify its own environment.

## Bounded probes and evidence status

| Probe | Original observation | Review boundary |
| --- | --- | --- |
| Version command and selected running-binary comparison | Matching CLI/running binary reported. | Local observation, not re-run; installed inventory belongs only in local evidence. |
| Native task ID versus exact owner task record | Original active task/workspace match reported. | Supports host-mediated read access, not an external watcher connection. |
| Exact-ID task read | Original task and active turn read successfully. | Reported pass; no title/recency lookup was used. |
| `codex queue --help` | Exact-thread message command present. | Command presence is not a live delivery result. |
| Stable and experimental schema generation | Queue receipt/list/delete/start shapes; no caller-visible goal ownership/revision field reported. | Schema/source evidence, not installed transport qualification. |
| Tagged queue/goal source inspection | Persisted queue item; loaded-idle wake; idle-only start; fresh CLI client ID. | Public source findings can be inspected independently. |
| Goal read | Current goal readable; no pause attempted. | No proof of safe suspension, restoration or zero inference. |

No live message was left pending, no task was deliberately unloaded, and no goal was
paused for a probe. No watcher was installed. Therefore there is no outstanding W0
operation to resume or cancel. Original ordinary-workspace tool success does not prove
those tools survive cold resumption.

## Public source findings

The public reference tag `rust-v0.155.0-alpha.9` is retained for source reproducibility,
not as the installed-version setting for a new client. The prior design also cites
`rust-v0.155.1`; neither is a universal minimum-version promise. Inspect the source
matching the actual client locally before any live test.

- [Queue RPC processor](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/app-server/src/request_processors/thread_queue_processor.rs): queue add/list/delete/start have separate receipts; start requires a loaded thread and refuses active/pending turns.
- [Queue service](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/ext/queue/src/service.rs): enqueue can wake eligible loaded threads; accepted start removes the queued item. Queue absence alone does not prove a successful continuation claim.
- [Queue CLI](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/tui/src/session_queue_commands.rs): each invocation supplies a new client message ID; repeating it after response loss is not a deduplication protocol.
- [Goal service](https://github.com/openai/codex/blob/rust-v0.155.0-alpha.9/codex-rs/ext/goal/src/api.rs): the reviewed request does not supply pause ownership or expected revision/status. A local marker plus reading `paused` cannot safely distinguish a later user pause.
- [Official app-server documentation](https://learn.chatgpt.com/docs/app-server): reading, loading/resuming and executing turns are distinct; restored tool/client availability must be checked separately.

The original chat's exposed host tools supported exact task reads/follow-ups. It did
NOT demonstrate an authenticated, persistent, externally usable connection to the
owning runtime's queue/turn reconciliation or authoritative activity/user-event feed.
This is an **unestablished path in the inspected environment**, not proof that no such
supported connection exists anywhere. Do not infer inaccessible API capability merely
from the absence of a tool in one chat, or infer external access from an internal tool.

## Capability matrix

| Capability | Outcome | Evidence/limit |
| --- | --- | --- |
| Original owner/read identity | Reported pass, not replayed | Local exact-ID/workspace/binary comparisons in the original investigation. |
| External watcher access to that owner | Unestablished | No supported external reconciliation transport demonstrated. |
| Loaded-idle delivery | Not tested | Active original task; no authorised bounded delivery probe performed. |
| Unloaded same-ID continuation | Not tested | No safe cold-resume proof on the actual owner. |
| Restored tool usability | Partial | Current-workspace tools worked; post-resume tools untested. |
| Goal inactivity / zero autonomous inference | Not tested | No authorised pause or authoritative activity measurement. |
| User-control preservation | Blocked | No demonstrated ownership-safe or serialized pause/restore path. |
| Ambiguous-response reconciliation | Blocked | Source primitives exist; external queue/turn/claim receipts were not demonstrated. |
| Cancellation/revocation | Partial | Exact-item delete exists in source; actual host/race behavior not tested. |
| Supervisor persistence/notification | Not qualified | Windows Scheduled Task/toast is a candidate design only, not a tested client selection. |

The conservative no-go remains justified without treating missing live tests as
failures of Codex itself. Do not mark W1-W3 approved or native watcher support passed.

## Corrections made during review

The active plan and handover now distinguish completed investigation from unqualified
automatic support. Broad statements that the entire desktop runtime lacks an API are
narrowed to what W0 actually established. Original owner observations are labelled
reported, not independently reproduced. No new live capability is claimed.

[Local client setup](../LOCAL_CODEX_CONFIG.md) now has a placeholder-only template,
private bootstrap, per-client routing, session revalidation, Git-index guards and
synthetic regression tests. That work addresses the user's privacy addition only; it
is not OPT-1A, a watcher, queue bridge or permission to manipulate the original host.
The review cannot initialise the user's actual client from a separate review sandbox.

## Recovery and independent work

A future W0 recovery must first identify a supported authenticated owning-runtime
connection with queue/turn reconciliation and telemetry. Establish caller-visible
pause ownership/conditional mutation OR another supported host mechanism that
serializes all relevant user controls. Do not require an upstream code modification
as the only imaginable remedy, and do not implement one in this checkpoint.

If these prerequisites are found, separately authorise bounded actual-host loaded/
unloaded, tool restoration, delivery-loss, cancellation, pause race and inactivity
probes, with explicit usage limits, deadlines and abort/restoration procedures.
Fail safely if ownership or telemetry coverage is uncertain. Manual prompting is not
an automatic-support pass.

Independent OPT-1A may be selected without reopening W0: candidate-bound CI submission,
compact results and manual checkpoint continuation do not require safe automatic Codex
resumption. No later checkpoint is started by this review. Choose one next checkpoint;
there is no need to repeat the same blocked discovery without changed prerequisites.
