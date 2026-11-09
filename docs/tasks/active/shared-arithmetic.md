# Shared arithmetic delivery

## Selected outcome

Kris selected implementation of [spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87)
on a new branch on 2026-11-09, then said "Okay go ahead and start" after the
scope read-back. Use the implement-spec workflow. GitHub owns requirements,
acceptance criteria and native ticket dependencies; this record owns execution.

Integration branch: `codex/spec-87-arithmetic`, based on the current accepted
Screens branch `codex/phase3b-screen-designer` at `251fb477`. The initial T3
checkout was on older `main`; no implementation uses that older baseline.
The occupied Screens checkout and its evidence remain untouched. The
draft [PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122) targets the
Screens branch. No merge of that PR or release is selected.

## Ticket graph and ownership

- #88 is already closed with Kris's equation-row approval. Reuse Story Combined
  v1, revision `combined-v1`, merged through PR #108. No new Story redesign.
- #89 and #90 were superseded, closed as not planned. Do not implement them.
- Screens mock #91 has a review candidate, with approval pending. Story backend
  #92 is merged into integration with passing Mac proof. Windows proof remains
  pending; #92 is not accepted and #93 remains blocked.
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
| macOS ARM64 SDK qualification | 6 | 1 | 0 |
| Windows x64 SDK qualification | 6 | 0 | 1 for #92 |

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

The design chat is
<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/mcp:launch:e1fe111ab62818554e2a4ef24205ba6f91f5a20e9e8190f47a78f8cd4c8c833c>,
on its own branch `codex/spec-87-variable-mock`. It owns #91 and the additional
decimal-control design approval needed by #97. It may commit locally and return
design evidence; production promotion and publication stay with integration.

One Mac SDK slot is reserved for the #92 implementer. It must report whether
execution started and retain its exact result. Windows proof will be routed by
the coordinator after the accepted-source fixture is ready. No Windows slot has
been reserved and no SDK invocation is known to have started.

Next: receive #92's implementation, use a fresh merger, route Windows qualification
and update the graph only against actual completed evidence. Open the draft
integration PR after the first ticket merge, with closing references for #87 and
its active slices. The design chat works with Kris independently.

### 2026-11-09: Screens and decimal design candidate

The design agent returned a review candidate, **not an approval**, on
`codex/spec-87-variable-mock` at `1e547df22b9a5002a0c8676e8059077d924e3d86`.
Runnable source is `6b3aee30e78fa99d1b4e856c38169dbd6133523e`, with frontend/Lab
fingerprint `7f44009d4939169eeb341065cf7150a2929eee322f80273400efb8542aa08e14`.
The coordinator verified ancestry from `bb550929`, the draft source record,
all 18 committed capture hashes and the null approval fields. No variant is chosen.

The candidates are `equation-v1` (A), `sequence-v1` (B) and `expanded-v1` (C).
The candidate branch's `docs/design/screens-arithmetic/README.md`,
`draft-source.json`, `draft-captures.json` and `approval.json` own design details.
Its self-contained review export was presented in the design chat. Kris's explicit
selection/approval remains pending there; #91 and #97's additional decimal-design
gate remain open. The candidate has not been merged into integration.

Reported checks: scoped Design Lab typecheck, coverage A 12 / B 5 / C 5 selected
samples, and 3 TDD interaction samples pass. These are the design agent's results;
the coordinator did not rerun them. All behavior is fictional browser memory with
named diagnostic fixtures. No source persistence or arithmetic/runtime acceptance
follows. The design handoff consumed no SDK/native/package/CI operation and made
no push or PR.

Backend #92 continues independently on `t3/arithmetic-backend-slice`; its delegated
task uses request key `spec87-ticket92-implementer-20261109`. The existing Mac SDK
reservation remains in place until that implementer reports started/not-started
and its evidence. Wait for its completion notification without polling.

### 2026-11-09: #92 implementation returned

The completed implementer returned clean branch `t3/arithmetic-backend-slice` at
`e5de0c20da8cd5f2812116840bf67b808d91d78a`, containing integration tip `6c2272ec`.
The source/runtime candidate is `1ba9fe447c5322683e11026c98ae9c4b38996240`.
Later changes are contract/evidence and coordinator-status documentation only;
the coordinator verified that production code and runtime fixture inputs match.
The ticket note `docs/tasks/evidence/arithmetic-92.md` owns the exact public
contract, fixtures, commands and result details on the returned branch.

Reported focused checks pass 59 distinct Rust cases and 43 renderer cases, plus
TypeScript, formatting, repository and whitespace checks. Seven existing ignored
Story specialist cases remain outside selection. The coordinator inspected the
core/source-map/transport changes and audited the Mac raw launch receipt, case
records, terminal result and accepted-source/executable hashes. Compile, lint,
exact values, deliberate wrong-outcome rejection and cleanup pass. This consumes
the one reserved Mac slot: feature total **1 started, 0 reserved**, with no rerun.
Raw evidence stays in the implementer's ignored `.toolchains/arithmetic-92/mac-01/`;
preserve that worktree until its unique evidence is safely retained.

#92 is not accepted yet. A fresh merger gets exclusive integration-checkout
ownership to merge the returned branch, update this handoff and publish the first
draft PR to `codex/phase3b-screen-designer`. The implementation workflow authorizes
that draft publication; no final PR merge is selected. The merger must not repeat
unchanged SDK qualification or close tickets.

One Windows SDK slot is reserved for #92. After publication the coordinator routes
the recorded gate/fixtures to SUNDOWN, using the exact published candidate. No
Windows invocation has started. Receive the merger's completion notification,
link/take over the draft PR, then start the Windows qualification. #93 remains
blocked on #92's actual delivery evidence; #91/#97 design approval is still pending.

### 2026-11-09: #92 integration and draft publication

The fresh merger confirmed clean integration checkout `codex/spec-87-arithmetic`
at `56c619f18bbcfd78873474369005853cc6f67b89` and clean returned branch
`t3/arithmetic-backend-slice` at `e5de0c20da8cd5f2812116840bf67b808d91d78a`.
Their common ancestor was `6c2272ecf7340b5e64c145059eb1f29534eb49f2`.
A normal `--no-ff` merge produced
`e8b07b31d0dd9fd9c5dcf3f784c61f2e089fd050`, with those two tips as parents.
There were no conflicts. All three coordinator records matched `56c619f1`
immediately after the merge; neither history was rewritten.

The merged `app/` tree is `56443af74404b1171f8d9d0524f90dbad91e23ba` and the
`tests/fixtures/` tree is `8f07e3d432d82c4235f7ae3a72601d2e0cf15edf`.
Both exactly match the returned branch. The entire app and both runtime inputs,
`tests/fixtures/arithmetic-92/story.rpy` and `driver.rpy`, also match qualified
candidate `1ba9fe447c5322683e11026c98ae9c4b38996240`. The only fixture addition
since qualification is the documented request/response `contract.json`, which
the runtime gate does not load. Reuse the reported 59 Rust and 43 renderer passes,
TypeScript/formatting results and audited Mac SDK result in the
[#92 evidence](../evidence/arithmetic-92.md); the merger did not rerun them.

Merger checks pass: `python3 scripts/validate.py` validates 1,794 repository files,
and `git diff --check 251fb477..HEAD` reports no whitespace errors. The merger
started no SDK, native, package or manual CI operation. Cumulative accounting
remains Mac **1 started / 0 reserved**, Windows **0 started / 1 reserved for #92**.
The backend worktree and its unique ignored Mac receipts remain in place. The
merger left the separate unapproved design branch/worktree untouched. Existing status/recovery
sections remain intact for prior acceptance and recovery evidence.

No matching PR existed. The integration branch was pushed only to its own
`origin/codex/spec-87-arithmetic` ref, which is now its upstream. Draft
[PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122) targets
`codex/phase3b-screen-designer` and is linked in T3. Its body describes the eventual
full #87 outcome, identifies only #92 as implemented, links this ledger and the
contract/evidence, and includes eventual closing references for #87 and #91–#97.
#88 remains closed; #89/#90 remain superseded. Automatic lightweight checks may
run; no manual matrix was dispatched. Status commit `729a4564` changes
documentation only and retains the merged qualification inputs.

At published head `729a4564d3ec84a200ebf1b93cad0b7ed479a2f3`, automatic quality
[run 42594176421](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42594176421)
reported aggregate `Loomlight validation: error`. Its start-reporter log identifies
an inherited CI selection mismatch: `.github/validation-plan.json` still named
`codex/story-combined-v1-grill`. This is publication metadata, not a product/runtime
failure. The existing `load_plan` owner reproduced that exact refusal locally.
The merger corrected only the plan's head branch to `codex/spec-87-arithmetic`;
the Screens base and empty manual-qualification list remain unchanged. The corrected
plan admits automatic Repository quality only, and all 18 existing CI-reporting
tests pass. Repository validation and whitespace checks also pass. App, fixture
and ticket evidence inputs remain identical. Final-head automatic results remain
pending for coordinator audit; no CI rerun or manual dispatch was requested.

The design worktree gained concurrent uncommitted edits during publication. The
merger did not alter or integrate them; the last committed candidate remains
`1e547df2`, with approval pending under the recorded handoff.

Next: the coordinator takes over the draft PR and routes the reserved Windows
#92 qualification to SUNDOWN using the published branch head and recorded gate.
No issue was accepted or closed. #93 stays blocked pending Windows evidence;
#91/#97 approval and later backend/UI tickets remain pending. Keep the PR draft;
final merge, automerge and release are not selected.
