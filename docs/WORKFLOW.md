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
| [HANDOVER.md](status/HANDOVER.md) | One live continuation record: branch, selected delivery, evidence and next action. |
| `docs/tasks/active/` | Detailed scope, implementation plan, gates and execution ledger; parent roadmaps link to child briefs rather than duplicate them. |
| Canonical technical docs / `docs/adr/` | Durable behavior, decisions, lessons and operational contracts. |
| `docs/tasks/archive/` | Completed task evidence and historical decisions, not current instructions. |

Prompts select a delivery and point to the repo. They must not be the only location of
requirements, tests, risks or continuation. PRs link to the canonical plan, not another
copy. Private client configuration/evidence is the exception: keep it local and publish
only allowlisted outcomes under [LOCAL_CODEX_CONFIG](LOCAL_CODEX_CONFIG.md).

## Start of each checkpoint chat

Read AGENTS, CURRENT and HANDOVER from the indicated branch, then the active brief.
Inspect refs, open PRs, recent commits, worktree and nested instructions. Verify the
recorded candidate and absence of competing writers; preserve unrelated edits.

The existing branch is authoritative for unfinished work. Main is the integration
baseline, not permission to ignore progress. Reconcile any main delta without reset or
force-push. Create a recorded new branch only if corresponding branch/PR work has not
appeared. Record current scope/branch early and publish sufficient state before waits.

Review known bootstrap/privacy limitations before sensitive local writes. Each actual
client initialises its own verified local configuration when protections are ready;
never use a remote review sandbox or another client's profile as a substitute.

## Default checkpoint boundary and explicit combined deliveries

Default: one selected checkpoint per chat, including its implementation, self-review,
validation and bounded troubleshooting. Do not advance simply because tests pass early.

Exception: the user may explicitly group named checkpoints in one chat. Record the
exact grouping, order, internal gates and stop boundary in the active brief and live
handover. Execute the approved sequence without another approval pause between passing
internal gates, retain separate evidence, and stop after that group. The exception
never waives a technical prerequisite or authorises unrelated work. CURRENT/HANDOVER
identify the active grouping; this stable policy does not duplicate its changing status.

States are `not_started`, `in_progress`, `awaiting_ci`, `blocked`, `review_ready` and
`accepted`. Separate implementation/test outcome from user acceptance. Missing host
proof is blocked/partial, not a pass by substitution. A feasibility investigation can
finish no-go without satisfying a capability gate. All-green independent CI tests do
not repair a failed prerequisite for a later runtime milestone.

Record the instruction authorising the work. Approval of a plan does not automatically
approve services, security changes, unrelated usage, merges or expanded runtime control.
A next-chat prompt selects scope; printing it does not manufacture approval or evidence.

## Required handover before ending

Update the existing HANDOVER and the selected brief's ledger. Keep lengthy detail in
that brief/canonical docs and link it, not a transcript or duplicate snapshot.

| Field | Required content |
| --- | --- |
| Delivery and state | Selected checkpoint/group, internal gate results, approved scope, implemented versus accepted. |
| Location | Repo, branch, PR and verified baseline/candidate. |
| Completed work | Relevant commits/files, decisions and regressions. |
| Validation | Commands and actual outcomes; generic host categories; run/attempt/jobs and actual tested SHA, including PR merge SHA where different. |
| Remaining work | Failed/skipped/unavailable gates, pending operation and exact safe recovery action. |
| Lessons | Canonical test/document references. |
| Next action | One bounded checkpoint, entry review or recovery step; approval and unmet prerequisites explicit. |
| Publication | Committed/pushed content and any local-only/unpublished work. No identifying client fields. |

Record the known implementation candidate, not a self-referential handover hash. A docs
follow-up may name the preceding candidate. Verify actual published head/checks outside
the file; do not chase every receipt with another commit. Do not mislabel a PR merge
checkout as direct branch-head execution.

Commit coherent scope, push to the authorised branch and verify publication before
saying the handover exists. On failed publication, report local-only state honestly.
A failure/interruption still needs a handover; write it before ending rather than only
when all tests pass. Keep the final summary short without omitting material limitations.

## Lightweight next-chat prompt

Normally under 100 words, naming repo, branch/PR, selected checkpoint and handover:

```text
/goal — <selected delivery> only
Repository: Caldwell-41/Renpy-editor
Continue the branch in docs/status/HANDOVER.md. Read AGENTS.md and that handover,
then the linked active brief. Complete only the selected approved scope, self-review,
validate, publish the ledger and handover, and stop. Give the short next-chat prompt.
```

Check next-checkpoint prerequisites independently. If the completed delivery passes but
the requested next milestone still lacks a required capability, provide its clearly
labelled entry-review-only selector, not a misleading implementation prompt. If current
work is incomplete, select its recovery instead. Do not repeatedly reopen unchanged
blocked discovery or include detailed implementation instructions in chat.

## Waiting without model polling

Record operation identity before waiting. Use an ordinary observer and actually
qualified continuation mechanism; distinguish queued, started and claimed. No second
executor or goal reset just because external work has not finished.

Until automatic support is qualified, publish a manual-resume handover and finish the
working turn or use an already-supported ordinary wait within its lifetime. No repeated
model status checks/keep-alives or a model watcher. Ordinary bounded API checks in code
are permitted. A user-requested status check is not an autonomous polling loop.

## Integration and branch cleanup

At authorised closure, review exact scope/evidence, merge through repository policy,
and verify main. Do not bypass checks; evidence reuse requires the implemented policy
and truthful equivalence reporting. Inventory branches/PRs and active consumers. Delete
only integrated/redundant inactive work after ancestry or reviewed patch equivalence.
Names/timestamps are not proof; do not merge redundant branches just to remove them.

Preserve unique/unreviewed work, open PRs, main/protected refs, archive tags and local
edits. Report retained exceptions instead of forcing an empty list. Final-cleanup
approval is not permission for premature deletion during implementation.

## Documentation cleanup

Consolidate decisions, recovery instructions and lessons before archiving finished
briefs. Keep unique acceptance/failure evidence and unresolved issues. Update live
routers/links. Remove pure duplicates only once useful content is preserved; Git history
already holds old handovers. No snapshot for each chat. Private pending journals/events
are never documentation clutter. Finish with link/privacy/whitespace/scope checks and
verified publication.
