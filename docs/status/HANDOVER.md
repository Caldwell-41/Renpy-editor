# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Task:** [CI optimisation and durable wait/wake](../tasks/active/ci-optimisation.md).
**Next checkpoint:** **W0 only — actual-host feasibility**.
**State:** Approved, not started. This publication is planning, not implementation.

## Continue from

Read [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md),
[WORKFLOW](../WORKFLOW.md), then the plan's W0 section and relevant source references.
All detailed requirements and confidence-review gaps are in the linked plan; no old
chat or attachment is required.

This planning publication starts from main
`f1be3f0745f76e46113df7d3e84e70e13ee9d9c9` and is published on main. Resolve the
actual current remote main before starting; that SHA is the inspected application
baseline, NOT an instruction to reset history. No implementation branch/PR was
created by this documentation publication.

For W0, first check whether `maintenance/ci-optimisation` or a corresponding task PR
has appeared. Reuse existing progress if present. Otherwise create that branch from
freshly verified main, record it here and use one integration PR across subsequent
checkpoint chats. Do not start from stale corrective or already-merged Phase 1E work.

## Completed and preserved

The repo now holds the plan, four W0-W3 gate definitions, later CI-efficiency
checkpoints, unresolved runtime/pause/delivery risks and final cleanup procedure.
AGENTS/WORKFLOW require repo-first planning, one checkpoint per chat, published
handovers and lightweight prompts. Phase 1E PR #9 is already merged; old live
integration instructions have been reconciled. Application code/workflows and
historical task ledgers are unchanged.

Validation for this planning publication is its exact commit's repository-quality
check and reviewed documentation-only diff. Read that check's result; it is not
predeclared passing. No W0 probe, runtime test, watcher/service or production matrix
was executed here. Do not redispatch an operation merely to validate this handover.

## W0 work and stopping rule

Qualify the ACTUAL task-owning host/thread, not an unrelated Codex installation.
Establish same-thread loaded/unloaded continuation, usable tools, safe goal-pause
ownership/restoration, delivery reconciliation, cancellation and telemetry access.
Use bounded isolated probes only under the plan's safety rules. Do not install a
production supervisor, change production CI, migrate hosts, bypass approvals/budgets,
create a competing task or advance into W1/OPT-1A.

No runtime endpoint, installed version, persistence host or pause-ownership mechanism
has been qualified. If access or safe control is missing, publish partial/no-go
findings with precise recovery needs and stop. Mocks/manual continuation cannot
substitute for automatic-support proof.

## Required output before ending W0

Record actual findings in `docs/research/CODEX_WAIT_WAKE_QUALIFICATION.md`, update
the plan's W0 ledger/resolved choices and replace this handover with exact branch,
PR, candidate, tests/evidence, blockers and next action. Keep private runtime details
outside Git. Self-review and troubleshoot W0 with the user; publish before giving
the next prompt. Do not create a second handover file.

After W0, stop for review. The next chat selects the next approved checkpoint or W0
recovery; a successful proof is not approval for the entire implementation. Final
integration, legacy branch retirement and documentation cleanup belong to CLOSE.
