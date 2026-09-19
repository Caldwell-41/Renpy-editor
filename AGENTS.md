# Agent Guide

## Mission and entry points

Project Loomlight is a single-user Windows x64/macOS ARM64 visual Ren'Py authoring
tool. Read [CURRENT](docs/status/CURRENT.md) for project state,
[HANDOVER](docs/status/HANDOVER.md) for the exact continuation branch/checkpoint,
and the linked active task for approved scope. Do not duplicate volatile phase,
branch or approval state in this guide. ADR 0003 selects Tauri 2; ADR 0005 defines
version-pinned staged project creation.

## Invariants

- `.rpy` source is authoritative for runnable game content.
- Preserve comments, formatting, custom syntax, embedded Python, and unsupported
  regions; patch the smallest safe source range. Never rewrite scripts with regex.
- All editing surfaces and LLM proposals use one transactional change layer.
- Treat projects and LLM output as untrusted. Parsing does not make a project safe
  to run; running Ren'Py code can execute Python.
- Use official Ren'Py SDK downloads, verify published checksums, pin per project,
  and isolate version-specific CLI behavior behind an adapter.
- Do not send project content to an LLM until the user initiates an operation.
- Do not add application-level content filtering.
- Do not commit secrets, personal data, real private game content, absolute user
  paths, logs, downloaded SDKs, build output, or credentials.

## Repository-first planning and checkpoint execution

Follow [WORKFLOW](docs/WORKFLOW.md). Detailed implementation instructions, acceptance
criteria, decisions, known issues, evidence and handovers belong in the repository,
not in a long chat prompt or an external attachment. Private runtime data is the
explicit exception: publish sanitised conclusions, never identifiable client state.

1. Read CURRENT, HANDOVER, the selected active task, relevant ADRs, and the closest
   nested AGENTS.md before editing. Search before reading broadly.
2. Fetch/inspect current refs, the recorded working branch, open PRs and history.
   Preserve unrelated work. A newer timestamp is not proof of integration; never
   reset to a historical SHA just because an old prompt names it.
3. Execute one approved checkpoint per chat by default. If the user explicitly groups
   named checkpoints, record that exception/order in the active brief and HANDOVER;
   complete that bounded group in one chat without unnecessary approval pauses between
   passing internal gates. Keep separate evidence and do not expand beyond the group.
4. Self-review and run actual gates; resolve bounded findings. Before stopping, commit
   and publish the task record and existing HANDOVER.md, including failures, missing
   evidence, branch/PR, candidate, pending operations and the next bounded action.
   An interruption also needs a handover; it is not a completed checkpoint.
5. After verifying publication, give one lightweight next-chat prompt naming the repo,
   branch, selected checkpoint and handover. Do not copy the implementation plan.
   Review every next-checkpoint prerequisite independently; a missing capability pass
   cannot be inferred from unrelated tests. Give a readiness/recovery selector when
   needed rather than falsely authorising implementation.

Keep one live HANDOVER.md; preserve durable lessons/tests/decisions in canonical
homes and evidence in task ledgers. Do not create a handover per chat or require the
next chat to find an old attachment. Full requirements remain in the linked brief.

## Local Codex client setup and privacy

Follow [LOCAL_CODEX_CONFIG](docs/LOCAL_CODEX_CONFIG.md) on EVERY new actual client and
revalidate ownership on every task/session. First read its implementation-status and
known-gap section: do not create sensitive local data with safeguards known to be
incomplete. Perform authorised corrective work on synthetic fixtures first.

Once destination and storage protections pass, initialise using
`python scripts/codex_local.py init` with a verified available interpreter and complete
only locally verified runtime fields. Do not print the profile or native output into
GitHub. Unknown fields remain null; missing access is not permission to invent a
host, endpoint or task ID. Treat any future options in the brief as planned until coded.

Keep host/usernames, client/device IDs, private addresses/endpoints, home/workspace/
binary paths, binary hashes, installed-build inventory and thread/session/goal/queue/
turn bindings only in protected local storage. Never commit them or copy them into
PRs/issues/CI logs/artifacts/screenshots. A stable hash is not anonymous permission to
publish. Tokens stay in credential stores/protected local environment; templates blank.

Routing observations and an existing profile do not establish runtime ownership or
distinguish identical-looking clients. Use explicit verified local client selection,
preserve existing profiles, and keep ambiguous/stale bindings unverified. Obtain the
current task ID afresh through the actual owner, not `--last` or another client's
settings. No inherited qualification or pause authority. Separate shared-checkout
writers. Automatic waiting stays disabled until its own host/runtime gates pass.

If the actual client is unreachable, record only `client setup unavailable` and do
approved host-independent work. An unrelated sandbox does not count as setup. Do not
request secrets/private paths in shared chat. Before publication inspect staged bytes
and working-copy scope; force-added local files are errors. Git ignore and local access
permissions are separate requirements; native Windows privacy needs an actual ACL check
or safe refusal before identifying data is written, not a POSIX-mode assumption.

## Commands

Production scaffold commands run from `app/`:

```bash
npm ci --ignore-scripts
npm run check
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
cargo test -p loomlight-desktop --locked  # supported desktop build environment
npm exec -- tauri build -- --locked
```

The core suite includes hostile-race and real process-termination recovery tests.
See [TRANSACTIONS](docs/TRANSACTIONS.md). A skipped SDK wrapper is not target evidence.
Retain Phase 0 regressions and scoped privacy checks:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s tests/ci_privacy -v
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

Run relevant cheap checks first; keep stack spikes isolated. Existing test success
covers only those tests, not known untested privacy or runtime cases. New CI tooling
commands become mandatory only when implemented/documented by the current delivery.

Candidate-bound CI operations are documented in
[CI_ORCHESTRATION](docs/CI_ORCHESTRATION.md). Use explicit ref/SHA and recorded
run/attempt identities. A `dispatch_unknown` operation is never permission to submit
again, and `collect` never reruns, cancels, merges or resumes Codex. Keep the SQLite
journal local and publish only the helper's allowlisted result fields.

## Waiting and CI cost controls

Do not use repeated model turns to poll externally observable long-running work.
Use a qualified non-model watcher with a durable checkpoint and verified same-thread
continuation when available. Pause autonomous goals only through approved ownership-safe
control; yield and resume from the completion event. Queue acceptance is not continuation.

Until implemented/qualified on the actual host, record Actions run/attempt/SHA and a
manual-resume handover, then stop active polling. Private routing stays local. Do not
invoke hypothetical helpers, claim automatic wake-up, launch a second agent, reset a
goal, weaken approvals or bypass budgets to keep work alive.

No package matrix solely for documentation, no duplicate expensive run of unchanged
validated inputs, and no blind retry after ambiguous dispatch. Reuse acceptance only
under an implemented verified policy. Failed/cancelled/unavailable/skipped gates are
not passes. Preserve run evidence; identify branch-head versus PR merge-tested SHA.

## Security and Git

- Use argument arrays for subprocesses; never interpolate project content into shell commands.
- Apply canonical path, containment, symlink, and archive-entry checks before I/O.
- Keep renderer/webview privileges deny-by-default and expose typed, narrow IPC.
- Use the account's noreply identity; configure local Git identity only in this repository.
- Never rewrite history, force-push, change visibility, or discard work.
- Reuse the recorded branch/PR across chats. Create one only if the handover calls for
  it and corresponding work does not already exist.
- At authorised closure, merge reviewed/validated work and delete only proven redundant
  inactive branches. Preserve unique work, active PRs and archive tags. Do not merge
  unrelated/unreviewed work merely to empty the branch list.

## Canonical documentation and closure

[INDEX](docs/INDEX.md) routes docs; material architecture decisions require an ADR.
Product scope remains in canonical product/architecture/data/UI/roadmap documents;
Phase 1 stays in [its vertical-slice plan](docs/tasks/active/phase-1-vertical-slice.md).

Update canonical docs with behavioral changes. At closure consolidate lessons, archive
finished plans/evidence, remove only redundant handovers, repair links and reset live
status to the actual next task. Preserve unique failure evidence and unresolved private
recovery state. Historical snapshots do not override current instructions. Distinguish
reported original observations from independently repeated proof.
