# Choice #98 delivery

## Selection and ownership

Kris selected [#98](https://github.com/Caldwell-41/Renpy-editor/issues/98)
with the implement-spec workflow and instructed the agent to start building on
2026-11-10. The spec owns requirements; #101–#106 own bounded acceptance.
Delivery is `in_progress`, with no feature implemented or qualified yet.

Integration branch `codex/choice-98` starts at accepted integration
`63221b44d72c1c100815e9e638cbec5133ffc1eb` from
`codex/phase3b-screen-designer`. The coordinator owns this branch, live status,
sequencing and combined evidence. Each implementer owns one ticket's production
code, affected tests and canonical technical contracts in a managed isolated
worktree. A merger receives integration ownership explicitly. Workers leave
CURRENT, HANDOVER and this file to the coordinator.

The first assignment is #101. It owns the Choice/option model, source recognition,
mapping and writing, explicit-body operations, flow projection, real Story controls
and affected tests. No other implementation writer starts against those interfaces
before that checkpoint is integrated. Later assignments must declare overlap.

## Dependencies and approved design

GitHub native blockers were checked at entry:

- #101 depends on closed design handoff #99 and is ready.
- #102, #103 and #104 depend on #101.
- #105 and #106 each depend on #102, #103 and #104, independently of each other.

Use Story Combined v1, `story-revamp` / `combined`, revision `combined-v1`,
pinned in [the approval record](../../design/story-revamp/approval.json).
[Choice controls](../../design/story-revamp/README.md#post-delivery-revision)
guide this feature in the current editor. The full workspace and palette remain
with #110. Material uncovered design decisions require a preview and Kris's
approval before production edits. Kris authorized separate design chats named
`Choice Spec - {description}` for that iteration and approval handoff.

## Verification and operation limits

Use the spec's selected public app-controller/core-command boundaries for source,
history, reopen, exact patches and draft/conflict refusal. Apply TDD one behavior
at a time. Inspect affected consumers before changing shared models. Lab evidence
establishes design only.

Development is on macOS ARM64. Affected runtime behavior requires macOS ARM64 and
Windows x64 qualification under host routing. Linked SUNDOWN answered at entry;
its OS, checkout and tools need verification before assignment.

SDK qualification for the entire #98 outcome is capped at 20 harness invocations
per host, including failed or cancelled starts. One invocation may launch compile,
lint and named normal-play children; retain each child's result without charging
them again as harness starts. This allows focused coverage across six tickets and
bounded corrections. The #101 implementer may use at most four Mac invocations
from the shared ceiling after cheap fixture preflight and official pinned-SDK
verification. Windows runs remain coordinator assigned. Usage is Mac 0/20,
Windows 0/20, zero reservations.

Native editor/package and manual CI campaigns need recorded selection and limits
before starting; none has started. Routine compilation, focused tests, review and
automatic PR checks need no numerical allowance. Historical arithmetic and
protected native-session limits remain separate and unchanged.

## Next action

Entry records passed `python3 scripts/validate.py` for 1,883 repository files and
`git diff --check`. CURRENT is 317 words and HANDOVER is 901 words; both remain
within their maintenance targets. No product tests or runtime operations ran.

Launch a fresh #101 implementer from this integration checkpoint. On return,
inspect the exact diff and evidence, integrate through a fresh merger, open the
workflow's draft PR and schedule dependency-ready assignments. Required runtime,
native and combined-review evidence remains pending.
