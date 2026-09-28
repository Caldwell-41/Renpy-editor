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
- Treat project text and LLM output as untrusted data. Opening/inspection never runs
  project code; deliberate Ren'Py execution can run Python with user privileges.
- Follow the proportionate local hobby-project scope in
  [ADR 0010](docs/adr/0010-local-project-safety-and-observed-flow.md): prioritize
  data-loss prevention, ordinary external edits and responsive observed views.
  Deliberate same-user filesystem attack races are not routine acceptance gates.
  Preserve existing write/recovery protections; do not resume retired native
  observation experiments without a separately selected task.
- Use official Ren'Py SDK downloads, verify published checksums, pin per project,
  and isolate version-specific CLI behavior behind an adapter.
- Do not send project content to an LLM until the user initiates an operation.
- Do not add application-level content filtering.
- Do not commit secrets, personal data, real private game content, absolute user
  paths, logs, downloaded SDKs, build output, or credentials.

## Repository-first planning and checkpoint execution

Follow [WORKFLOW](docs/WORKFLOW.md). Detailed implementation instructions, acceptance
criteria, decisions, known issues, evidence and handovers belong in the repository,
not in a long chat prompt or an external attachment.

1. Read CURRENT, HANDOVER, the selected active task, relevant ADRs, and the closest
   nested AGENTS.md before editing. Search before reading broadly.
2. Fetch/inspect current refs, the recorded working branch, open PRs and history.
   Preserve unrelated work. A newer timestamp is not proof of integration; never
   reset to a historical SHA just because an old prompt names it.
3. Execute ONE approved checkpoint per chat. Implement or investigate that checkpoint,
   review it, run its actual gates, and resolve bounded findings with the user.
   Do not advance to the next checkpoint in the same chat.
4. Before stopping, commit and publish the task's checkpoint record and update the
   existing HANDOVER.md. Record failures, missing evidence, branch/PR, exact candidate,
   outstanding operations and the next bounded action. An interruption also needs a
   handover; it is not a completed checkpoint.
5. After verifying publication, give one lightweight next-chat prompt naming the
   repository, working branch, checkpoint and handover. Link to detail rather than
   copying it. State any approval boundary; a plan is not blanket execution approval.
   Every goal prompt must state the Codex machine requirement (or explicitly none),
   the separate test host(s), and why; follow WORKFLOW, including the 4,000-character cap.

Keep one live HANDOVER.md; preserve durable lessons/tests/decisions in their canonical
homes and checkpoint evidence in the task ledger. Do not create a new handover file
for every chat or require the next chat to find an old attachment.

## Proportionate delivery and review

Follow [the seven delivery rules](docs/WORKFLOW.md#proportionate-delivery-rules):
match guarantees to user actions; prove risky real paths early on affected targets;
test actual user-action boundaries and rejecting assertions; classify failures before
fixing; keep cumulative problem budgets; align written policy with executable gates;
and justify new blockers with evidence and user harm. Two unsuccessful corrections
of the same hypothesis trigger reassessment, not another automatically renewed goal.

Keep data-loss and ordinary external-edit regressions. Do not resurrect specialist
hostile/crash experiments, waive genuine failures, or transfer routine verification
to the user. Development runs where convenient; test hosts follow the requirement,
not the host running Codex. Use the existing workflow and task ledger, not a new
orchestrator, mandatory approval framework or duplicate testing system.

## Commands

These are command references, not a mandate to run every command for every task.
Use the approved changed-scope selection from WORKFLOW and TESTING. If a command
still embeds an excluded exercise, stop that command and record the alignment gap;
do not silently skip required ordinary coverage or run the excluded exercise.

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

The core suite retains historical Phase 1B race and real process-termination
recovery tests. Scope new gates using [TESTING](docs/TESTING.md) and ADR 0010;
do not expand specialist attack experiments into a prerequisite for routine
hobby-editor work. Keep ordinary external-writer and interrupted-save coverage.
An official-SDK wrapper with a skip marker is not target evidence.

Retain the Phase 0 regression commands:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

Run checks relevant to the changed scope, cheap checks first. Stack spikes remain
isolated; do not present a spike as the production application.

Keep agent use bounded: start with the live status, handover, selected task and
relevant code or diffs. Read historical ledgers only when the active task points to
them or they contain needed evidence. Push coherent checkpoints and report compact
test counts, skips and relevant failure excerpts instead of full successful logs.
Do not create receipt-only commits that chase their own SHA.

## Waiting and CI cost controls

Do not use repeated model turns to poll externally observable long-running work.
Use a qualified non-model watcher with a durable checkpoint and verified same-thread
continuation when available. Pause autonomous goal continuation only through an
approved, ownership-safe runtime mechanism; yield and resume from the completion
event. Never equate queue acceptance with actual continuation.

Until that mechanism is implemented and qualified on the actual host, record the
exact run/attempt/SHA and a blocked/manual-resume handover, then stop active polling.
Do not invoke hypothetical helper commands or claim automatic wake-up. Do not start
a second agent, reset a goal, weaken approvals, or bypass budgets to keep work alive.

No package matrix solely for documentation, no duplicate expensive run of unchanged
validated inputs, and no automatic retry after ambiguous dispatch. Reuse acceptance
only under an implemented, verified policy. Failed, cancelled, unavailable and skipped
gates are not passes. Preserve exact failed/superseded run evidence.

## Security and Git

- Use argument arrays for subprocesses; never interpolate project content into shell commands.
- Keep approved-root/relative-path containment, straightforward unsupported-link
  refusal and archive-entry checks. Read-only display does not require a fresh
  hostile-namespace proof at every syscall; writes retain their transaction contract.
- Keep renderer/webview privileges deny-by-default and expose typed, narrow IPC.
- Use the account's noreply identity; configure local Git identity only in this repository.
- Never rewrite history, force-push, change repository visibility, or discard work.
- Reuse the recorded implementation branch/PR across checkpoint chats. Create a new
  branch only when the handover calls for it and no corresponding work already exists.
- At authorised integration/closure, merge reviewed, validated work, verify main,
  and delete only branches proven redundant and unused. Do not merge unreviewed changes
  merely to empty the branch list. Preserve active PRs, unique work and archive tags.

## Canonical documentation and closure

[INDEX](docs/INDEX.md) routes documentation; material architecture decisions require
an ADR. Product scope/UX remains in the canonical product, architecture, data, UI and
roadmap documents; Phase 1 milestones remain in
[the vertical-slice plan](docs/tasks/active/phase-1-vertical-slice.md).

Update canonical docs with behavioral changes. At task closure, consolidate lessons,
archive the completed plan/evidence, remove redundant transient handovers or retain
only a justified historical record, repair links, and reset CURRENT/HANDOVER to the
next actual state. Never delete unique failure evidence or unresolved recovery state.
Historical snapshots do not override live instructions.
