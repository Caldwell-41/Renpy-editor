# Shared arithmetic delivery

## Selected outcome

Kris selected implementation of [spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87)
on a new branch on 2026-11-09, then said "Okay go ahead and start" after the
scope read-back. Use the implement-spec workflow. GitHub owns requirements,
acceptance criteria and native ticket dependencies; this record owns execution.

Integration branch: `codex/spec-87-arithmetic`, based on the current accepted
Screens branch `codex/phase3b-screen-designer` at `251fb477`. The initial T3
checkout was on older `main`; no implementation uses that older baseline.
The occupied Screens checkout and its evidence remain untouched. The eventual
draft PR targets the Screens branch. No merge of that PR or release is selected.

## Ticket graph and ownership

- #88 is already closed with Kris's equation-row approval. Reuse Story Combined
  v1, revision `combined-v1`, merged through PR #108. No new Story redesign.
- #89 and #90 were superseded, closed as not planned. Do not implement them.
- Ready work: Screens mock #91 and Story backend #92.
- Backend sequence: #92, then #93, then #94. #95 follows #94.
- Story UI #96 follows approved #88 and qualified #94.
- Screens/decimal UI #97 follows approved #91 and qualified #95.

The coordinator owns this ledger, CURRENT, HANDOVER, integration merges and the
parent PR. Each backend ticket gets a fresh implementer in a separate worktree
and branch, using TDD, followed by a merger agent. Implementers own core/shared
transport, related existing tests and their scoped contract/evidence notes.
The mock chat owns only a new Design Lab experiment, its registration and design
notes/approval evidence. It must not edit production components, the approved
Story mock or backend files. Production UI ownership starts only after its gates.
Shared registry edits are serialized through integration. Final review uses the
code-review skill and a fresh implementer for any resulting fixes.

Kris authorized new design chats named `Variable Mock - {description}` and separate
worktrees. They may iterate directly with him and return exact design approvals.
Screens variants and any additional nontrivial decimal-control changes require
approval before production edits. #110's full Story redesign is not selected by
this arithmetic outcome; #96 must identify any real integration dependency.

## Verification and operation limits

The spec already confirms the test boundaries: public authoring commands,
committed source, shared Undo/Redo, reopen, focused accepted-source Ren'Py fixtures,
then actual frontend-to-core journeys for UI integration. Do not ask to approve
these boundaries again. Use existing selectors and extend their test owners.
Read TESTING and the applicable runbooks before qualification.

SDK qualification has a feature-wide ceiling of **six started runs per target**,
macOS ARM64 and Windows x64. The basis is one focused accepted-source run for each
of four backend slices, with two correction runs available per target. A started
fixture invocation against the SDK counts, including failures and cancellation;
preflight refusals do not. Batch relevant assertions and reuse unchanged inputs.
Record reservations, starts and exact source/evidence before another invocation.
The linked Windows host is SUNDOWN. Remote execution must use its supported
environment routing. No package/native-app launch or expensive CI matrix is
selected at this checkpoint; set and record a separate justified limit before
one becomes necessary. Routine checks and review have no numerical limits.

| Operation | Ceiling | Started | Reserved/uncertain |
| --- | ---: | ---: | ---: |
| macOS ARM64 SDK qualification | 6 | 0 | 0 |
| Windows x64 SDK qualification | 6 | 0 | 0 |

## Execution ledger

### 2026-11-09: start

- Refreshed origin and inspected branch/worktree ownership. The accepted Screens
  tip is `251fb477`; its primary checkout is clean. This integration worktree is
  separate and starts clean.
- Read the parent, replacement tickets and native dependency graph. Confirmed
  #88's approval comment and the parent's PR #108 merge pointer. No ready ticket
  has prior implementation evidence or a competing open feature PR.
- Read current status, workflow, testing entry points and design integration rules.
  Historical no-execution statements describe previous selections; Kris's current
  instruction selects #87 only. Old exhausted campaigns remain closed.
- Integration branch created. No application, SDK, package or CI run has started.

Next: start #92 in an isolated worktree and the separate #91 mock chat; record
their links and returned contracts/approvals here. Open the draft integration PR
after the first ticket merge, with closing references for #87 and its active slices.
