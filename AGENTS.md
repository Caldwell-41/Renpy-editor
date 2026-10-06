# Agent Guide

## Mission and entry points

Project Loomlight is a single-user Windows x64/macOS ARM64 visual Ren'Py authoring
tool. [CURRENT](docs/status/CURRENT.md) owns project state;
[HANDOVER](docs/status/HANDOVER.md) owns the exact continuation branch/checkpoint;
the linked active task owns approved scope. Use the selective reading rules below.
Do not duplicate volatile phase, branch or approval state in this guide.
ADR 0003 selects Tauri 2; ADR 0005 defines
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

## Repository-first goals and checkpoints

Follow [WORKFLOW](docs/WORKFLOW.md). Requirements, acceptance criteria, decisions and
continuation state belong in the repository; prompts select a coherent outcome.

1. At a new substantive outcome or genuine transfer, read CURRENT, HANDOVER and only
   the selected active-task sections. Narrow tasks use applicable instructions and
   relevant task/contracts; consult live status when phase, branch, acceptance or
   continuation matters. Follow the closest nested AGENTS.md. Search before reading
   broadly; read ADRs/code/evidence as needed. On same-thread continuation, check changed
   or missing state rather than repeat all orientation.
2. Inspect current refs, the working branch/PR and available worktree ownership.
   Preserve unrelated/local work. Never reset to a historical SHA from an old prompt.
3. Complete ONE approved outcome per goal, using small internal checkpoints. Include
   investigation, implementation, focused verification, self-review and bounded fixes
   as authorised. A checkpoint/commit is not automatically a stop or new-chat boundary.
   Pause for a genuine decision, unavailable capability, budget limit or external wait;
   name the actual reason. Do not silently widen a review-only or otherwise narrow task.
4. Record meaningful decisions, attempts and results in the owning task ledger.
   Before a real pause, transfer or completion, replace the live HANDOVER continuation
   with exact state, evidence links, pending operation, remaining scope/budget and next
   action. Update CURRENT only when overall project state changes. Follow WORKFLOW's
   status-document guidance; publish and verify as authorised, disclosing local-only work.
5. Resume the SAME goal in the SAME chat after a workflow wait by default. Give the
   user the actual client pause/resume control and a short continuation message, not
   a replacement /goal. A new goal is for a different outcome; a new chat for the same
   outcome is a fallback for unavailable/unusable context or explicit user choice.
   New/replacement goal prompts retain machine, test-host and reason fields and the
   4,000-character cap. Ordinary same-thread resume messages need not repeat the plan.

Keep one live HANDOVER.md; superseded continuations belong in the owning ledger or Git
history. It supports recovery and transfer, not mandatory context resets. Preserve
durable learning in canonical docs/tests and evidence in the ledger.

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
Use the routine broad-core and separate SDK selectors in TESTING; unfiltered core
is only a command reference and can duplicate archive-backed gates. The
[selector audit](docs/tasks/archive/2026-10-06-testing-policy-alignment.md#selector-disposition)
records the exact specialist exclusions; current evidence belongs in HANDOVER.
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

Keep agent use bounded: follow the selective entry rules and read relevant code/diffs.
Archive links locate evidence; they do not require loading an entire ledger. For a
needed or user-requested historical review, follow a section-specific link or search
by issue, date, candidate or result and read the matching sections. Push coherent
checkpoints as authorised and report compact test counts, skips and relevant failure
excerpts instead of full successful logs.
Do not create receipt-only commits that chase their own SHA.

## Waiting and CI cost controls

Follow [manual same-thread waiting](docs/WORKFLOW.md#waiting-without-model-polling).
Dispatch only within the approved allowance. Record the confirmed workflow run,
attempt, branch, exact tested SHA and continuation before waiting. If acceptance of
the request is ambiguous, preserve that uncertainty; never dispatch a duplicate.

Default: checkpoint, stop model polling, and resume on the user's command in the same
chat. Ending a response or writing `awaiting_ci` does not itself pause a live Codex
Goal. Use only a supported, authorised lifecycle control; otherwise tell the user to
pause through their client's real control. Never claim a runtime pause was verified
when only the repository record changed. Do not reset/clear the goal, start a second
writer, manipulate client databases, or revive abandoned W0/OPT-1A automation.

On resume, check the recorded operation and relevant ref/worktree changes. If still
pending, pause again without a status-check loop. If terminal, audit its actual
required evidence and continue only the remaining authorised outcome and budget.
`Resume` does not authorise a retry, another matrix, new scope or a merge.

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
- Reuse the recorded implementation branch/PR across checkpoints and pauses. Create a new
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
only a justified historical record, repair links, and replace CURRENT/HANDOVER with
the next actual state. Follow [status-document maintenance](docs/WORKFLOW.md#status-document-maintenance).
Never delete unique failure evidence or unresolved recovery state.
Historical snapshots do not override live instructions.
