# Agent Guide

Loomlight is a single-user Windows x64/macOS ARM64 visual Ren'Py authoring tool,
built with Tauri 2. Follow the closest nested AGENTS.md.

## Work from the issue

GitHub Issues own scope, acceptance criteria and decisions. The open PR owns work
in progress and its evidence. The code owns behavior. Before work, read the selected
issue, its parent and the code it touches. Use `gh` as described in
[the tracker guide](docs/agents/issue-tracker.md).

- The user selects work, by naming an issue or by asking directly. A label,
  assignment or open issue does not by itself authorize implementation,
  publication or a costly run.
- Record each result with the exact commit it applies to. Results tied to a PR
  head, such as CI audits and SDK, native or package runs, go in PR comments.
  Decisions, scope changes, acceptance and results with no PR go in issue
  comments. Raw logs, packages and private artifacts stay out of Git, issues and PRs.
- Write the PR body once, with the `pr` skill, when opening the PR. Editing the
  body re-runs Repository quality, so edit it only when scope changes.
- Close an issue only when all its acceptance criteria pass. If a human check
  remains, keep it open and comment what is left. With the user's OK, move that
  check to a new `ready-for-human` issue and edit the criteria to match.
- Before stopping with unfinished work, comment on the PR, or on the issue when
  there is no PR, with the branch, head SHA, uncommitted work, pending runs, limits
  used and the next action.
- Put lasting behavior in the canonical doc that owns it ([INDEX](docs/INDEX.md)).
  Write an ADR only for a decision that is hard to reverse, surprising without
  context and the result of a real trade-off (`domain-modeling`).
- Records before November 2026 (status, task briefs, ledgers and evidence) live at
  the `archive/docs-ledgers-2026-11` tag. Read them only for a matching diagnosis,
  result reuse, a requested audit, or requirements that an issue or canonical
  doc cites.

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

## Delivery

- Before adding behavior, trace existing implementations and callers, and extend
  the existing owner. When replacing an implementation, migrate its callers and
  tests and remove the superseded path in the same change. Keep two
  implementations only for distinct behavior or an explicitly scoped migration,
  and say why both remain.
- Before broad work on a platform-sensitive feature, prove one small production
  path on each affected OS, for example a release build that reaches the SDK and
  stops the owned game. A mock or spike is not that proof.
- Match guarantees to the action. Read-only views need no save or transaction
  guarantees unless a requirement says so. Saves keep reopen, Undo, external-edit
  conflicts, interrupted-save recovery and retained drafts.
- A new blocker names the requirement or user harm, its evidence and the smallest
  fix. Label each finding as a demonstrated defect, missing evidence, a hypothesis
  or an optional improvement.
- Per-ticket qualification workflows, scripts and fixtures are temporary. The PR
  that closes the ticket deletes them or moves lasting checks into routine suites.
- Report a failed, cancelled or skipped required check as unresolved.

## Debugging

Use `diagnosing-bugs` for failures. Search the [incident index](docs/testing/INCIDENTS.md)
for a matching symptom before changing a harness. Fix the root cause:

- Ask whether the state that broke the code is legitimate. If it is, handle it
  where it broke. If it should never exist, find what produced it. A guard, retry,
  clamp, raised threshold or swallowed error at the symptom hides the bug.
- Fix every instance of the same fault, not only the one that surfaced.
- When the deciding fact took a deep dig, add the cheap always-on signal that
  would have shown it.

After two failed corrections of the same hypothesis, reassess the diagnosis,
requirement, test validity and layer before a third attempt.

## Operation limits

Package builds, native app launches, SDK campaigns and expensive CI matrices need
a numeric limit. Before the first attempt, record the limit, its basis and what
counts as an attempt on the issue, or on the PR when there is no issue. Count every attempt that starts, including failed
and cancelled ones. The count carries across sessions, hosts and successor tickets
for the same problem. Ask before exceeding it, and continue other work that does
not depend on it. Routine work needs no limit.

## Parallel agents

One writer per branch and worktree. Before an agent starts, record its issue,
branch, base and the files it owns, and give each shared contract one owner.
Sequence work that needs the same native app or mutable fixture. Pending CI on one
branch does not block other worktrees.

## Branches

Delete a branch only after proving its work is merged or redundant and no open
issue depends on it. Use ancestry, or patch equivalence for squash merges. Keep
main, protected refs and `archive/*` tags.

## Read the relevant reference

- Browser mockups, component previews or lab checks: [Design Lab](app/design-lab/README.md#focused-verification).
  Promoting an approved design into the app: [Design integration](app/design-lab/INTEGRATION.md).
  Show prototypes and get the user's approval before production UI, layout or copy changes.
- Build and check commands: [app/README](app/README.md#local-checks).
- Test selection, host routing, CI validation and waiting: [TESTING](docs/TESTING.md).
- Product, architecture, data, UI and ADRs: [INDEX](docs/INDEX.md).

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
