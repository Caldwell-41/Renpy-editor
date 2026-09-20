# Repository-first delivery workflow

**Policy established:** 2026-09-19. Applies to future project and maintenance tasks.

## Authority and document ownership

The user chooses scope and approves checkpoint execution. Repository documents make
those decisions durable; they do not grant themselves additional authority. New user
instructions take precedence and must be recorded before conflicting work continues.

| Location | Owns |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Stable operating rules and entry points. |
| [CURRENT.md](status/CURRENT.md) | Current project state, accepted baseline and active workstreams. |
| [HANDOVER.md](status/HANDOVER.md) | One live continuation record: branch, checkpoint, evidence and next action. |
| `docs/tasks/active/` | Detailed scope, implementation plan, checkpoint gates and execution ledger. |
| Canonical technical docs / `docs/adr/` | Durable behavior, decisions, lessons and operational contracts. |
| `docs/tasks/archive/` | Completed task evidence and historical decisions, not current instructions. |

Prompts select a task/checkpoint and point to the repo. They must not be the only
location of requirements, test commands, unresolved risks or continuation state.
Avoid independent copies of a plan in attachments, PR comments and several Markdown
files. PRs link to the canonical plan; comments may record publication/CI receipts.

## Start of each checkpoint chat

Read AGENTS, CURRENT and HANDOVER from the indicated working branch, then the active
plan sections relevant to this checkpoint. Inspect remote refs, open PRs, recent
commits and the local worktree. Verify that the recorded candidate is present and
that no other chat is already writing this checkpoint. Preserve unrelated edits.
Read relevant code, diffs and directly linked evidence; do not sweep every historical
ledger unless the selected task requires it.

An existing working branch is authoritative for unfinished checkpoint work. Main is
the integration baseline, not permission to ignore unmerged progress. If main moved,
review its delta and reconcile safely without resetting or force-pushing. If HANDOVER
says no implementation branch exists, create its named branch from freshly verified
main only after checking that the branch or corresponding PR has not appeared meanwhile.

Record the branch/PR and checkpoint-in-progress in the repository early. Before an
external wait or interruption, publish sufficient state to resume without asking the
user to reconstruct the previous chat.

## One checkpoint, one chat

The chat performs the selected approved checkpoint, self-reviews its diff, runs the
specified gates, fixes scope-bounded findings, and troubleshoots that checkpoint with
the user. It must not continue into a later checkpoint automatically, even if tests
pass early or the later checkpoint looks easy.

Run cheap applicable checks before expensive or scarce-runner gates. Push coherent
checkpoint changes. Report exact test counts, skips and relevant failure excerpts;
do not paste complete successful logs into handovers or chat.

Checkpoint states are `not_started`, `in_progress`, `awaiting_ci`, `blocked`,
`review_ready`, and `accepted`. Record implementation/test outcome separately from
user acceptance. Missing host access or tests means blocked/partial, not passing by
substitution. A feasibility investigation can finish with a no-go report without
satisfying its capability gate.

Before starting, record which user instruction authorises the checkpoint. Approval
of a plan is not approval to install services, change security settings, incur unrelated
usage, merge application work or expand scope. A next-chat prompt cannot manufacture
approval: it selects the bounded checkpoint the user elects to start.

## Required handover before ending the chat

Update the existing HANDOVER.md and the active plan's ledger. Keep HANDOVER focused;
put lengthy diagnosis and durable lessons in the ledger/canonical docs and link them.

| Field | Required content |
| --- | --- |
| Task/checkpoint and state | Exact identifier, approved scope, implemented versus accepted status. |
| Continuation location | Repository, branch, PR if any, latest verified baseline/candidate. |
| Completed work | Relevant commits/files, decisions and regressions; no transcript dump. |
| Validation | Exact commands, environment and outcomes; run ID, attempt, SHA, jobs/evidence where applicable. |
| Remaining work | Blockers, failed/skipped/unavailable gates, outstanding operations and safe recovery action. |
| Lessons | Canonical document/test paths containing lasting learning. |
| Next action | One bounded checkpoint or recovery step and whether approval is still required. |
| Publication | What is committed/pushed; any local-only work and why it could not be published. |

Record the implementation candidate SHA, not an impossible self-referential SHA of
the handover commit still being written. A docs-only follow-up commit may name a
preceding candidate. Resolve and report actual published head after committing.
Do not make another commit solely to chase a document's own hash, and do not create
receipt-only commits whose only purpose is to record their own publication.

Commit coherent changes, push to the recorded authorised branch, and verify remote
content before saying the handover is available. If publishing fails, report the
failure and local-only state; do not give a prompt implying a nonexistent remote
checkpoint. Keep final chat summaries short but honest about limits.

## Lightweight next-chat prompt

Use a short selector, normally under 100 words:

```text
/goal — <checkpoint> only
Repository: Caldwell-41/Renpy-editor
Continue branch <recorded branch>. Read AGENTS.md and docs/status/HANDOVER.md,
then the linked active plan. Complete only <checkpoint>, verify it, publish the
checkpoint ledger and handover, and stop. Give me the short next-chat prompt.
```

For a blocked checkpoint, select the documented recovery step, not a later milestone.
For an approval gate, state the pending decision. Do not embed the implementation
specification or imply that merely printing a prompt has approved its execution.

## Waiting without model polling

Record operation identity and continuation state before a long wait. Use an ordinary
observer and an actually qualified continuation mechanism. Distinguish a queued
message from a started turn and a claimed event. Never reset a goal or start a second
executor merely because the external operation has not finished.

Until automatic waiting is implemented/qualified, use a published manual-resume
handover and end the working turn. No repeated status-check turns, keep-alive prompts,
or extra model used as a watcher. Ordinary API polling by a script is permitted.
A user-requested status check is not an autonomous polling loop.

## Integration and branch cleanup

At the plan's authorised integration checkpoint, review the exact candidate and
required evidence, merge useful completed work into main through current repository
policy, and verify the resulting tree/status. Never bypass required checks; evidence
reuse requires the implemented policy and truthful equivalence reporting.

Inventory branches and open PRs before cleanup. Delete a branch only after proving
its work is integrated or safely redundant and no active task depends on it. Use
ancestry where applicable; for squash/cherry-pick histories, review content/patch
equivalence and PR merge evidence. Names and timestamps are not proof. Do not merge
redundant old branches just to enable deletion.

Keep branches with unique/unreviewed changes and open dependency/application work;
record why they remain. Do not delete main, protected refs, archive tags or local
uncommitted work. Report retained exceptions rather than forcing an empty branch list.
The user's cleanup instruction authorises safe retirement after implementation,
not premature deletion during feasibility/planning.

## Documentation cleanup

Consolidate architecture decisions, operational recovery instructions and regression
lessons before archiving a completed task. Preserve unique acceptance/failure evidence
and unresolved issues. Archive the completed task/ledger with a final status and update
INDEX/CURRENT/HANDOVER links. Pure duplicate handovers can be removed once useful
content is preserved; Git history retains earlier live HANDOVER revisions.

Do not generate a snapshot for every chat. Existing historical snapshots may remain
until a link/evidence audit proves they can be consolidated. Never remove runtime
journals or unacknowledged events as documentation cleanup. Finish by checking links,
privacy/secrets, whitespace, changed-path scope and actual remote publication.
