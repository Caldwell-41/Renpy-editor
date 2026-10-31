# Agent Guide

## Project and task entry

Loomlight is a single-user Windows x64/macOS ARM64 visual Ren'Py authoring tool,
built with Tauri 2. [CURRENT](docs/status/CURRENT.md) owns project state;
[HANDOVER](docs/status/HANDOVER.md) owns continuation and recovery;
the selected task owns scope and acceptance. Remaining Phase 3B may start before
final Phase 2/3A acceptance under the standing scheduling exception. For 3B entry or
continuation, follow the owner, scheduling and dependency rules under
[3B issue ownership](docs/WORKFLOW.md#phase-3b-github-task-ownership).

For a substantive new outcome or transfer, read those live records and only the
relevant task sections. Narrow edits need applicable instructions and relevant code
or contracts. Follow the closest nested AGENTS.md. Search before reading broadly;
history links are for evidence lookup, not mandatory full-ledger reading. On resume,
check changed or missing state. Inspect the relevant branch/worktree and preserve
unrelated work; never reset to a historical SHA from an old prompt.

## Project invariants

- `.rpy` source is authoritative. Preserve comments, formatting, custom syntax,
  embedded Python and unsupported regions; patch the smallest safe source range.
  Never rewrite scripts with regex.
- All editing surfaces and LLM proposals use one transactional change layer.
  Preserve data-loss prevention, ordinary external-edit handling and recovery.
- Project text and LLM output are untrusted data. Opening or inspecting a project
  never executes it; deliberate Ren'Py execution can run Python with user privileges.
- Keep the local hobby-project threat model in [ADR 0010](docs/adr/0010-local-project-safety-and-observed-flow.md).
  Specialist hostile-filesystem and deliberate crash experiments are outside routine
  acceptance. Preserve existing protections.
- Use official Ren'Py SDK downloads, verify published checksums, pin per project,
  and isolate version-specific CLI behavior behind an adapter.
- Send project content to an LLM only after the user initiates the operation.
  Do not add application-level content filtering.
- Keep renderer privileges deny-by-default with narrow typed IPC. Use subprocess
  argument arrays; never interpolate project content into shell commands. Preserve
  approved-root containment, unsupported-link refusal and archive-entry checks.
- Preserve approved Mac names, signing identity, credential namespaces and legacy
  ownership. Follow [Mac package identity](app/README.md#macos-local-package-identity)
  for exact values and approval boundaries; never weaken signing or Keychain policy
  to make a check pass.
- Never commit secrets, personal data, private game content, absolute user paths,
  logs, downloaded SDKs, build output or private signing material.
- Use the account's noreply Git identity, configured only in this repository.
  Never rewrite history, force-push, change visibility or discard unrelated work.

## Deliver the selected outcome

Carry an authorised implementation outcome through preparation, implementation,
focused verification, review and in-scope fixes.
Checkpoints are internal progress, not automatic stops. Preserve review-only scope
and explicit user limits. Follow [operation limits and reassessment](docs/WORKFLOW.md#5-operation-limits-and-reassessment)
when selecting costly operations or revisiting failed corrections. Report a
concrete blocker when continuation needs a real decision or unavailable capability.

Before adding behavior, trace existing implementations and callers. Prefer extending
the existing owner. When replacing an implementation, migrate affected callers and
tests and remove the superseded path in the same change. Retain parallel
implementations only for distinct behavior or an explicitly scoped migration, and
explain why both remain. During review, check for duplicated ownership and tests
that still exercise superseded paths.

For test-host selection, qualification cadence or a capability handoff, follow
[host routing](docs/WORKFLOW.md#test-host-routing-and-ownership). For failures,
follow [diagnosis](docs/WORKFLOW.md#4-classify-failures-before-fixing).
Failed, cancelled or skipped required checks are not passes. No package matrix for docs alone.

## Read the relevant reference

- Browser UI mockups or component previews: read [Design Lab](app/design-lab/README.md).
  For promotion or live app implementation of approved designs, read
  [Design integration](app/design-lab/INTEGRATION.md) before edits.
- Build/check commands: [app/README](app/README.md#local-checks); test selection,
  specialist exclusions and native evidence: [TESTING](docs/TESTING.md).
  Commands are references, not a requirement to run every suite.
  For a matching failure or harness change, search the [incident index](docs/testing/INCIDENTS.md)
  and follow relevant evidence links; do not read the full historical ledger by default.
- Multi-step delivery, test-host routing or integration:
  [WORKFLOW](docs/WORKFLOW.md). Read the sections needed by the task.
- Parallel agent assignments or worktree handoffs: follow
  [parallel worktrees](docs/WORKFLOW.md#parallel-agents-and-worktrees).
- CI or external waits: follow [ci-watch selection and manual fallback](docs/WORKFLOW.md#waiting-without-model-polling).
- Meaningful pause, transfer or closure:
  [status maintenance](docs/WORKFLOW.md#status-document-maintenance).
  Record compact results in the owning task, keep one live handover and update
  canonical contracts when behavior changes. Preserve unique failure/recovery evidence.
- Task documentation: follow [brief and evidence ownership](docs/WORKFLOW.md#task-briefs-and-supporting-files)
  when creating or updating briefs, requirements or validation records. For remaining
  3B delivery, apply the [GitHub ownership exception](docs/WORKFLOW.md#phase-3b-github-task-ownership).
- Product, architecture, data, UI and ADR ownership: [INDEX](docs/INDEX.md).

Publish only within actual authorization and disclose local-only work. Historical
instructions do not override the current selected contract or new user directions.

## Agent skills

### Issue tracker

For engineering skills that read or publish tickets, use GitHub Issues.
Read `docs/agents/issue-tracker.md` before tracker operations.

### Triage labels

For issue triage, use the five default roles mapped in
`docs/agents/triage-labels.md`.

### Domain docs

Use the single-context layout. Before domain exploration or architectural
changes, read `docs/agents/domain.md`.
