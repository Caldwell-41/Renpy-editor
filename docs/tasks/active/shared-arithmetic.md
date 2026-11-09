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
[PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122) targets the Screens
branch and is the review vehicle. No merge of that PR or release is selected.

## Ticket graph and ownership

- #88 is already closed with Kris's equation-row approval. Reuse Story Combined
  v1, revision `combined-v1`, merged through PR #108. No new Story redesign.
- #89 and #90 were superseded, closed as not planned. Do not implement them.
- Screens mock #91 and #97's decimal controls are approved as A2 / `equation-v2`.
  All #92–#97 implementation slices and seven review corrections are integrated.
  Backend and final UI-emitted source qualification pass on Mac and Windows.
  Product checkpoint `f42747ef` passes the full selected automatic CI. All scoped
  implementation criteria are verified; issues remain open for PR review/merge.
- Kris approved the #96/#110 ownership split on 2026-11-10. #96 owns arithmetic
  in the current Story editor and Writing focus. #110 and its existing slices
  retain Combined integration, Tracks/Reel, cross-view context/drafts and assembled
  acceptance. Spec P4 is resolved by that transfer; no missing workspace behavior
  is claimed implemented and no #110 work is selected.
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
this arithmetic outcome. The approved transfer below assigns its remaining
workspace requirements to #110 without blocking the current-editor arithmetic slice.

## Verification and operation limits

The spec already confirms the test boundaries: public authoring commands,
committed source, shared Undo/Redo, reopen, focused accepted-source Ren'Py fixtures,
then actual frontend-to-core journeys for UI integration. Do not ask to approve
these boundaries again. Use existing selectors and extend their test owners.
Read TESTING and the applicable runbooks before qualification.

SDK qualification has a feature-wide ceiling of **20 started invocations per target**,
macOS ARM64 and Windows x64. On 2026-11-09 Kris explicitly increased both ceilings
from six to twenty. The table below owns current cumulative usage and reservations.
The increase changed no counter and selected no new SDK run or successor work.
Historical six-start records below describe their time.
A started fixture invocation counts, including failures and cancellation; preflight
refusals do not. Batch relevant assertions and reuse unchanged inputs.
Record reservations, starts and exact source/evidence before another invocation.
The linked Windows host is SUNDOWN. Remote execution must use its supported
environment routing. No package/native-app launch or expensive CI matrix is
selected at this checkpoint; set and record a separate justified limit before
one becomes necessary. Routine checks and review have no numerical limits.

| Operation | Ceiling | Started | Reserved/uncertain |
| --- | ---: | ---: | ---: |
| macOS ARM64 SDK qualification | 20 | 12 | 0 |
| Windows x64 SDK qualification | 20 | 4 | 0 |

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

### 2026-11-09: Windows qualification handoff

The coordinator linked/took over draft PR #122 and resumed integration-checkout
ownership after the merger completed. Published implementation at `76bc9f37`
matches the returned app/fixture trees; the CI-plan correction is branch metadata
only. SUNDOWN is reachable and its registered Loomlight repository matches this
repository. The next delegate is qualification-only, in an isolated prepared
Windows worktree, using request key `spec87-windows92-qualification-20261109`.

The existing Windows reservation authorizes **one** started invocation of the
recorded #92 SDK gate, after cheap preflight and pinned-archive verification.
The qualifier must record its actual full candidate and input hashes before
launch, verify app/runtime-input equality with the published implementation, and
return started/not-started plus all gate outcomes. It may append sanitized Windows
evidence to the existing #92 note on its own branch; it cannot change production,
the shared ledger/status files, the integration ref or issue acceptance. No
additional SDK run, editor package/native launch or manual CI dispatch is selected.
The coordinator retains integration ownership. Consumption remains Windows
**0 started / 1 reserved** until a launch/result is reported. Wait for completion
without polling; audit actual receipts before accepting #92 and starting #93.

The isolated remote dispatch was rejected before agent creation: T3 does not
support `delegate_task` worktree isolation in a linked environment. No SDK
operation started. The supported safe follow-up is a read-only preflight in the
registered Windows checkout, request key
`spec87-windows92-registered-checkout-preflight-20261109`. It must preserve all
refs, branches, tracked files and other worktrees. It may use the reserved gate
only if the checkout is already clean at the exact published candidate; otherwise
it reports the mismatch and available host capability without creating/switching
a checkout. It writes only unique ignored evidence, not tracked documentation.
A new top-level qualification chat is not covered by the prototype-chat permission.
This dispatch amendment is included in the next coordinator publication.

### 2026-11-09: A selected for refinement, A2 review candidate

Kris selected A for refinement using Experience First and requested closer
alignment with approved Story. This is direction selection, not approval. The
new review variant/revision is `equation-v2`, labelled
"A2 · Story equation refinement". Original A/B/C remain preserved.

Candidate branch `codex/spec-87-variable-mock` is at `930a9274`; runnable source
is `ce6264279188fca4c81218a5cd93b50c393bf9a3`, with frontend/Lab fingerprint
`e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`.
The candidate branch's `docs/design/screens-arithmetic/REFINEMENT.md`,
`equation-v2-source.json` and `equation-v2-captures.json` own details. The
coordinator verified the recorded source identity, all 12 committed capture hashes,
baseline ancestry and all-null approval record. A2 has not been merged here.

A2 adopts Story's equation row, field sizing, contextual numeric suggestions,
named operation menu and shorter feedback. Brass/slate changes are mock-scoped;
decimal definitions are flatter. Top-layer menus fix inspector-scroll clipping.
The design agent reports 9 refined interaction samples, the original A's 3
interaction samples, scoped typechecking and whitespace passing. The coordinator
did not rerun those checks. The candidate was shown inline and on Kris's requested
LAN Lab. Formula responses and edits remain fictional browser-memory fixtures.

Kris's explicit approval remains pending; every revision's approval and
`currentApproved` are null. #91 and #97's decimal-design gate remain open. No
production promotion, runtime/source acceptance or SDK consumption follows from
this refinement. The Windows #92 preflight remains the separate pending operation;
wait for its completion notification without polling.

### 2026-11-09: Windows preflight completed, setup authorization pending

The registered-checkout delegate completed without qualification. SUNDOWN's clean
checkout is `codex/phase3b-screen-designer` at
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8`, not requested candidate `d797eb04`.
Only one worktree is registered. Rust/Cargo 1.90.0, x64 MSVC and the verified
Ren'Py 8.5.3 archive/extracted executables are available. No fixture, compile,
lint or runtime check ran, and no ref/checkout/production change occurred.
The existing #92 evidence note records the exact preflight and ignored receipt.

The isolated-dispatch refusal and completed read-only preflight together establish
the actual remaining setup blocker. T3 can prepare a remote isolated worktree via
`t3_thread_launch`, which creates a new top-level chat. Current user permission
explicitly covers new prototype chats, not a qualification chat. The coordinator
asked Kris whether to create a Windows qualification chat in its own worktree from
PR #122, using only the one reserved run. Approval is pending; no replacement
chat/task has started. A default selection or elapsed time grants no approval.

Cumulative use remains Mac **1 started / 0 reserved**, Windows
**0 started / 1 reserved**. #92 remains unaccepted and #93 blocked on Windows
proof. #91/#97 still await design approval. Next action is receive Kris's setup
decision; on approval, launch the qualification chat through the host's explicit
worktree strategy and retain the registered Windows checkout unchanged. No test
execution or new capability is assigned to Kris.

### 2026-11-09: Windows qualification chat authorized

Kris explicitly selected "Create the Windows qualification chat" in response to
the setup question. This authorizes a new top-level SUNDOWN chat with a
host-prepared worktree from draft PR #122, preserving the registered Windows
checkout and using only the existing single reserved #92 SDK invocation.
It supersedes the pending-authorization state above, without expanding the
feature's SDK ceiling or selecting packages, manual CI, release or PR merge.

The launch uses request key `spec87-windows92-qualified-worktree-20261109`,
branch `codex/spec-87-windows-92` from published `codex/spec-87-arithmetic`.
The published source at dispatch is `c7b8157e`; the qualifier must record its
actual full source/input identity before SDK launch. The coordinator owns this
integration checkout and status records; the qualifier owns only its ignored raw
receipts and a sanitized Windows result in the existing #92 evidence note on its
own branch. No source, fixtures or gates may change as part of qualification.
Windows remains **0 started / 1 reserved**
until execution is reported; #92 acceptance and #93 still wait on actual proof.

The Windows qualification chat was launched through the host's explicit worktree
strategy on SUNDOWN:
<t3-thread://v2/88c3ca41-b202-47bf-8d09-09bd3411e945/mcp:launch:e94d6d651fa5579eeb3a9feed31e836009a1d19bc6ea397402d24dda9ef158ef>.
It will return its exact tested identity, consumed/not-started SDK result and
evidence-branch commit to this coordinator. No qualification success or SDK start
is known at dispatch. Wait for that completion message without polling; then audit
and integrate the evidence, accept #92 only against required proof, and continue #93.

### 2026-11-09: A2 approved for #91 and #97 decimal controls

Kris's exact reply in the design chat was "approved" after A2 was shown inline
and linked on the LAN. The completed design-only handoff is clean on
`codex/spec-87-variable-mock` at `82d30d6e7bdf74e04dbb4cbef991cf67e921afbd`.
The current approved screen is `screens-arithmetic`, variant/revision
`equation-v2`. Runnable source remains `ce6264279188fca4c81218a5cd93b50c393bf9a3`,
fingerprint `e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`.

The candidate branch's `docs/design/screens-arithmetic/approval.json` owns the
decision, behavior, deviations and ten primary captures. The coordinator verified
the pointer/source identity, all ten primary capture hashes and dimensions, and
that the approval commit's app files match preserved reviewed source. Reported
promotion checks pass with `sourceMatches:true`, actual-record hash/pointer checks,
no browser/asset errors and unchanged-source imagebutton rendering. Prior A2
9-sample and original A 3-sample interactions, typecheck and whitespace pass.
The coordinator did not rerun those browser checks.

The approval covers ordered textbutton/imagebutton arithmetic and the additional
decimal creation/default, numeric-condition and text/sample controls. It completes
the design-only #91 handoff and #97's design gate; #97 production still requires
qualified #95. All mock responses/saves remain fictional memory, with no source,
history/reopen, evaluator, runtime or native proof. Original Story, production
files and earlier candidates remain intact. The reviewed source's Draft headings
are an explicitly retained prototype deviation, not a null approval.

A fresh merger receives exclusive integration-checkout ownership to merge the
approved reference and publish it to draft PR #122, preserving the pinned source
and approval history. It may run relevant cheap type/approval/repository checks;
no new browser campaign, SDK/native/package/manual-CI operation or production UI
edit is selected. The Windows #92 chat continues independently and must report its
actual started/result accounting. No Windows SDK start is known to the coordinator
yet; its single reservation remains until that report.

### 2026-11-09: approved A2 reference integrated

The fresh merger received exclusive mutation ownership of the integration checkout.
Both local branches were clean at the expected tips. Normal `--no-ff` merge
`aecf165e8d2c84320924db531f3dcc18a7448bc3` has parents
`11e69a6d12c96318e7c4eaeccaf666a5cfaac2db` (coordinator) and
`82d30d6e7bdf74e04dbb4cbef991cf67e921afbd` (approved design), with common ancestor
`bb550929a7854d5975b25079cc610f1ee1c19a58`. No conflicts occurred. Coordinator
records survived unchanged before this receipt. The merged Lab and arithmetic
design records equal the approved branch. Neither history nor the approved
checkout was rewritten; original A/B/C and all 31 retained PNGs remain intact.

Approved identity and recovery:

- Screen/variant/revision is `screens-arithmetic` / `equation-v2`.
  [approval.json](../../design/screens-arithmetic/approval.json) and
  [REFINEMENT's approval section](../../design/screens-arithmetic/REFINEMENT.md#approval-recorded-2026-11-09)
  retain Kris's exact decision and deviations. Primary captures are under
  `docs/design/screens-arithmetic/captures/equation-v2/`; original captures remain
  under `captures/draft-v1/`. Both capture manifests and source records are preserved.
- Runnable source remains `ce6264279188fca4c81218a5cd93b50c393bf9a3`, fingerprint
  `e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`.
  The existing sibling checkout `codex-spec-87-variable-mock`, branch
  `codex/spec-87-variable-mock` at `82d30d6e`, remains a read-only reference and
  still has that fingerprint. Its preserved Draft headings are an approved deviation.
- Integration's fingerprint is
  `6555f30de73a0f299ca24859757ebabb9633a8abb1784ee9fce0226cf1706a18`.
  Only `app/src/main.ts` and `app/src/scene-ui.ts` differ among fingerprint inputs
  from the pinned design source, due to #92's typed Story transport. Static approval
  loading correctly returns `sourceMatches:false` here. The pinned Git source hash
  validates; this expected current-tree mismatch is not approval corruption.

Merged checks pass with pinned Node **24.19.0** and npm **11.9.0**:

- `npm run design:typecheck` and `npm run design:approvals` pass. The latter tests
  approval parsing, history, capture identity and changed-source detection.
- Existing `loadApprovalRecords` validates all **28** actual records against their
  pinned Git sources and capture hashes. Additional static assertions verify the
  A2 pointer/source, ten primary PNGs and both manifests' PNG dimensions/hashes:
  **41 manifest entries covering 31 unique retained PNGs**. No approval record changed.
- `npm run design:check -- --build` passes in-memory production exclusion with
  **1 check / 0 browser samples**; it writes no production `dist`. The first attempt
  refused a Vite temporary config write through shared `node_modules` outside the
  sandbox. An integration-local dependency-link directory and local `.vite-temp`
  resolved that environment limitation. Both the refusal and passing report remain
  in ignored `.toolchains/arithmetic-91-merge/`; shared dependencies stayed intact.
- `python3 scripts/validate.py` passes for **1,848** files; `git diff --check
  251fb477..HEAD` and the final status-document whitespace check pass.

Every non-Lab `app/` entry, including `app/src`, `app/src-core`, `app/src-tauri`,
Cargo manifests/lock, Rust toolchain, package/configuration inputs and tests, is
identical to pre-merge `11e69a6d` and Windows dispatch candidate
`c7b8157ee90aaf416030de0692abede7e4981c30`. `tests/fixtures/` also matches both.
Story's approved Lab files are unchanged. Existing Mac #92 and unchanged-input
scoped browser evidence remains valid on its producing candidates. No browser
campaign, SDK/native/package operation or manual CI dispatch ran. This establishes
no new source/history/reopen, evaluator or runtime proof for the fictional mock.

#91's design handoff and #97's additional decimal-design gate are integrated;
#97 production still requires qualified #95. #88 stays unchanged. The authorized
publication is only `codex/spec-87-arithmetic` to its own origin branch and existing
draft PR #122, with full #87 scope and eventual closing references retained.
Final-head automatic checks await coordinator audit; no final review is selected.
No issue is closed and #93/#95/#97 are not started by this merger.

Ownership returns to the coordinator with committed integration/status records.
Next: receive and audit the Windows #92 callback without polling before accepting
#92 or starting #93. No SDK start/result has been reported here. Cumulative use
remains Mac **1 started / 0 reserved**, Windows **0 known started / 1 reserved**.
The Windows candidate's production inputs are unchanged. Keep all evidence and
worktrees, including unique ignored backend Mac receipts and approved design output.
CURRENT/HANDOVER retain earlier unique acceptance/recovery sections under their
existing size exception; this handoff makes no broader historical cleanup.

### 2026-11-09: Windows #92 passed, #93 selected

Kris pointed the coordinator to the completed Windows chat. Its result had not
arrived because T3 denied both completion-send attempts with `capability_denied`.
The source notification failed; qualification did not fail. The coordinator read
the completed history and recorded command outputs, including the terminal gate
record, case audit, exact runtime witness and cleanup assertions. No message or
new work was sent to the referenced thread. Do not assume cross-environment
top-level callbacks can resume this coordinator reliably.

Windows qualification tested `c7b8157ee90aaf416030de0692abede7e4981c30` and passed
one SDK gate invocation: compile/lint/normal entry exit 0, deliberate wrong outcome
exit 1, no timeouts or truncated outputs, correct money-8 rejection, exact values
score `9007199254740994`, money `7`, opaque `kept`, and complete cleanup.
The existing Cargo-log validators accepted both the no-SDK preflight and SDK gate.
The Windows note records verified input/archive/executable identities, unchanged
source and original checkout, plus unique retained ignored evidence. No cross-host
raw-artifact transfer or independent rehash is claimed; the coordinator audited
the recorded raw command outputs and committed result note.

Evidence-only commit `c7e4e3459303736f85de8c55cd88f5895e020e19` was fetched and
merged without conflicts through `260479294711dd93b18919a7bc39245bf58c3619`.
Only the existing #92 note changed. Current production/runtime inputs equal the
tested Windows source and previously qualified Mac implementation; no rerun is
needed. Preserve both hosts' unique raw receipts and worktrees.

SDK accounting is now Mac **1 started / 0 prior reserved**, Windows
**1 started / 0 reserved**. #92's scoped public-command/source/history/refusal and
both-target runtime delivery is complete; full-feature review remains pending.
The GitHub ticket checkpoints will reflect delivered #91/#92 while remaining open
for the draft integration PR's final review/closure. This satisfies #93's
implementation dependency without claiming full #87 acceptance.

#93 now gets a fresh isolated implementer for whole-number formulas, using its
existing ticket and TDD/public boundaries. Request key is
`spec87-ticket93-implementer-20261109`. One Mac SDK invocation is reserved from
the unchanged feature ceiling for this slice after cheap preflight. Windows
qualification of newly added formula cases remains required evidence for the
feature; preserve the accepted-source fixtures and do not call that proof passed
before execution. Qualification selection may batch later portable cases through
the existing fixture owner; the representative #92 real path is now proved on
both affected targets. No package/native/manual-CI operation is selected.

Next: publish this evidence/checkpoint, start #93 and wait for its completion
notification without polling. Then merge through a fresh merger and complete its
remaining qualification before proceeding through the approved graph.

### 2026-11-09: #93 returned and Mac proof audited

The fresh implementer returned clean `t3/story-whole-number-formulas` at
`78c924162fed43cdb3e54e63004480c7210c40da`, containing current integration
`7e1c3133`. Qualified code candidate is `ca51e4c7e02c5dc54ef8c47b9c245907a1456c6b`;
the later change is only its result note. The returned branch's
`docs/tasks/evidence/arithmetic-93.md` owns exact contract/fixtures/selectors.
It extends the shared core to variable operands, signs/grouping and whole-number
`+ - * // %`, with typed read/write inspection, diagnostics and minimal source edits.
No production layout or Design Lab change occurred.

Reported checks pass 76 distinct Rust cases, 36 renderer cases, TypeScript,
formatting, repository validation and whitespace. Seven existing Story specialist
cases remain unrun. The coordinator inspected core parsing/evaluation/source
adapters and verified all 149 launch input hashes, accepted-source and retained
binary hashes, case outcomes and cleanup receipts. The single reserved Mac SDK
gate passed compile/lint, exact formula values, deliberate money-minus-14 rejection,
unchanged source and complete cleanup. Raw evidence remains in the implementer's
ignored `.toolchains/arithmetic-93/mac-01/`; preserve its unique worktree evidence.
This consumes the #93 reservation. Totals are Mac **2 started / 0 reserved** and
Windows **1 started / 0 reserved**, with no uncertain invocation.

A fresh merger, request key `spec87-merge93-20261109`, gets exclusive integration
checkout ownership to merge this ticket and publish it to draft PR #122, retaining
the exact qualified implementation and approved mocks. Cheap integration checks
and evidence reuse are sufficient when inputs match; no SDK rerun is selected.

#### Remaining Windows qualification selection

#93's new formula Windows proof is still missing. #94 extends the same portable
core parser/evaluator with decimal semantics. Its implementation may proceed
after #93's public-boundary/Mac-qualified slice is integrated. Keep Windows proof
required and batch the new whole-number and decimal cases against the combined
#94 candidate before dependent Screens work (#95) or production Story integration
(#96). The #94 accepted-source fixture must retain the integer precedence,
grouping, negative floor/remainder and precision witnesses as well as new decimal
assertions, so no case disappears in the batching. #92's both-target result remains
the already-proved representative real path, not proof of the new formulas.

This selects qualification timing within the existing full-feature both-target
requirement and unchanged six-start ceilings. It claims no Windows pass for
#93/#94 and waives no failed or missing target evidence. The fresh #94 implementer
will receive its own Mac reservation after this merge; Windows routing/allocation
remains coordinator-owned. No package, native-editor or manual matrix is selected.

Next: receive the merger result, then start fresh #94 work with the exact merged
contract. Final integration review, #95/#96/#97 production and full #87 acceptance
remain pending. No new work is sent to the referenced Windows #92 chat.

### 2026-11-09: #93 integration and evidence reuse

The merger confirmed clean integration at
`80c6af37125a7670862ff9f177b74994aa1e8f17` and clean returned branch
`t3/story-whole-number-formulas` at `78c924162fed43cdb3e54e63004480c7210c40da`.
Their common ancestor is `7e1c3133ebd6fe1fbd7bb9aa27b587562df4442c`.
Normal `--no-ff` merge `ff6dc26c96a4c50cba68bb4b6d4ca14cf0d69da6` has those
two tips as its ordered parents. It had no conflicts and preserved all three
coordinator records byte-for-byte before this receipt. Neither history changed.

The merged app tree is `399af62449980626dda3b17ae7f47d91be57811f`; all fixtures
are `e754c973d875ed12dcd27a8767864265d0326692`. Both match returned branch and
qualified candidate `ca51e4c7e02c5dc54ef8c47b9c245907a1456c6b` exactly. Scripts
and CI inputs also match the candidate. The returned branch's sole later change
is its evidence note. Reuse the 76 distinct Rust and 36 renderer passes,
TypeScript/formatting results and coordinator-audited Mac SDK proof in
[#93 evidence](../evidence/arithmetic-93.md). No unchanged tests or SDK runs were
repeated. Seven existing Story specialist cases remain outside selection.

Cheap merger checks pass: retained request/result JSON has matching protocol and
request identity, string formula/integer transport, revision assertions, exact
score `36028797018963992` and coherent variable reads/writes. The quality-only
validation plan still names the correct integration/base branches. Repository
validation passes for 1,852 files; integration and working-tree whitespace pass.
The current contract is [Variables and state](../../DATA_MODEL.md#variables-and-state),
with exact payloads, diagnostics and fixtures in the
[#93 public contract](../evidence/arithmetic-93.md#public-contract-for-94-95-and-96).

Approved Story/Screens source, approval history and captures are unchanged from
pre-merge integration. The Design Lab tree remains
`b32e5588f20b9e803ed32a4c2d4c0be8286e8bca` and design records remain
`479a99d146ca5e04c704fd771bb857cc581cd23d`. The retained #92 fixture tree is
`0a14efb0d9c28697204bc172381e9a0623b2ce2a`, unchanged. No production layout,
Design Lab or renderer evaluator was added. No other checkout, ignored evidence
or branch was changed or removed. Unique Mac/Windows evidence stays retained.

Publication is limited to `codex/spec-87-arithmetic` on its own origin branch and
existing draft [PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122).
The PR retains full #87 scope and all eventual closing references. #93's delivery
checkpoint is `review_ready` for this merged public-command/Mac slice, with
new formula Windows proof explicitly missing. Tickets stay open for final review;
this is not full feature acceptance.

The coordinator resumes mutation ownership after the merger return and assigns a
fresh #94 implementer from this merged contract. Ordinary division and decimals
remain #94. Its fixture must retain #93's integer precedence/grouping, precision
and negative floor/remainder witnesses alongside decimal assertions. Complete
combined #93/#94 Windows qualification against #94 before #95 or #96 starts;
#92's old Windows fixture does not prove formulas. No #94 implementer or Windows
thread was started here. Mac remains **2 started / 0 reserved**, Windows
**1 started / 0 reserved**. No SDK, package, native or manual-CI operation ran.
#91/#97 design gates remain complete; #95/#96/#97 production, final integration
review and full #87 acceptance remain pending. Keep the PR draft.

### 2026-11-09: #94 selected from merged formulas

The coordinator read the merger handoff and resumed a clean integration checkout
at `d01f968d35939d2a7e66d6ad993591d4d0ccb972`. #93's exact qualified app/fixture
inputs are integrated; the approved design and prior evidence remain unchanged.
Fresh #94 implementation is selected through request key
`spec87-ticket94-implementer-20261109`, in its own prepared worktree.

Scope is the existing #94 public-services contract: explicit decimal definitions
and defaults, shared numeric formulas including ordinary division, exact mixed
numeric comparisons, screen text/bindings and revision-bound inert samples. Keep
whole-number transport lossless, existing types fixed, boolean/string support and
integer-only bars unchanged. Complete the backend-owned type/capability/diagnostic
contract needed by #95/#96; production layout and control wiring remain separate.

One Mac SDK invocation is reserved for #94 from the unchanged ceiling, after cheap
public-boundary preflight. The accepted-source fixture must retain #93 integer
precedence/grouping, precision and negative floor/remainder witnesses alongside
decimal defaults/results/comparisons/text/sample assertions. Qualify actual engine
types and floating-point semantics, including integer results assigned to decimal
targets and exact mixed comparisons, rather than assuming JavaScript/Rust numeric
coercion or display formatting matches Ren'Py. Use existing gate/result owners.

Mac accounting is **2 started / 1 reserved for #94**; Windows remains
**1 started / 0 reserved**. The coordinator will select and route the combined Windows
proof once the fixture/candidate exists. Both #95 and #96 remain blocked on that
qualified #94 contract. No new Windows chat/message, package/native-editor launch
or manual CI matrix is selected at this point. Return implementation through a
fresh merger and preserve its unique raw evidence.

### 2026-11-09: #94 local implementation, failed display admission

#94 returned clean `t3/decimal-arithmetic-authoring` at
`532bb2298ba644869da9a041e0e2620edcf4d696`, code candidate
`8c677ffea9552bc7746f1df27a59ae2bc185b861`. It reports 144 distinct Rust and
31 renderer passes, plus type/format/repository/whitespace checks. The canonical
contract and detailed attempt are in that branch's
`docs/tasks/evidence/arithmetic-94.md`. Integration still has #93; #94 is local-only.

The reserved Mac run started and failed: compile/lint passed, but normal entry
stopped at `pygame.display.init()` with `The video driver did not add any displays`
and Hiservices XPC errors before numeric assertions. Wrong-outcome rejection was
not reached. Cleanup passed. The coordinator inspected raw case/terminal records
and ran the existing Cargo-log validator, which correctly rejected the failure.
This consumes the original reservation: Mac **3 started**, Windows **1 started**.
No runtime acceptance, fixture correction or product workaround is inferred.

The matching H20/early-3B evidence distinguishes this sandbox display symptom from
driver defects. Read-only desktop inspection in the current sandbox returned all
session/display fields null; the same existing MacPower query outside it returned
active, awake, unlocked, logged-in/on-console state. Ranked hypotheses were sandbox
WindowServer denial, unavailable desktop, then fixture/SDK graphics configuration.
The observation supports the first and rejects a currently unavailable desktop;
successful SDK execution outside the sandbox is still the discriminating test.

The coordinator reserves **one** additional Mac SDK start from the existing
six-start ceiling for controlled #94 recovery. Use the unchanged retained ARM64
test binary and verified source/fixture identities, with scoped execution outside
the sandbox and the existing desktop-admission/power helper. Fresh ignored evidence
is `.toolchains/arithmetic-94/mac-02/` in the integration checkout. A prelaunch
desktop/input refusal consumes no start. Once the selected Rust SDK gate starts,
charge Mac **4 started / 0 reserved** even if it fails. Preserve `mac-01` unchanged.
Record full identities and actual outcome before allocating another attempt.

The coordinator owns this bounded qualification; no worker is running or writing
the #94 worktree. Production code/fixtures remain unchanged. Both successful Mac
runtime and combined Windows proof remain required before #95/#96 starts.

Recovery preflight initially refused an overbroad hash comparison: one TypeScript
interface annotation changed after the compiled candidate. The existing handoff
already documents that change. Inspection confirms it only adds returned source
revision fields to a TypeScript type, with no emitted runtime change. All 208
current inputs match the returned commit; all core/fixture inputs and the retained
binary still match the compiled candidate. The new receipt records both identities
and this scoped distinction. No SDK started during either preflight check.

The controlled gate has now started outside the sandbox through the existing
desktop-admission/power helper. `mac-02/launch-started.json` records the actual
process and time. Consumption is **Mac 4 started / 0 reserved**, Windows
**1 started / 0 reserved**. The result is pending; this start remains charged.

The controlled run completed with a different failure. Display admission and
initialization succeeded. Compile/lint and 19 testcase assertions passed before
the unfocusable bound-caption selector failed; the remaining sample/witness and
wrong-outcome checks were not reached. SDK and power-assertion cleanup passed.
Mac remains **4 started**; neither failed run is a qualification pass.

Pinned SDK source identifies a harness defect: text selectors search the focus
list and, during narration, use the current Say text as the default focus. The
accepted nonfocusable screen caption is not in that search. The coordinator owns
a small fixture-only correction on the completed #94 branch: require the screen
and check its actual interpolated displayable text via the same pinned SDK TTS
path. All numeric and rejecting assertions stay in place; production is unchanged.
The canonical #94 note now retains both failures and this diagnosis.

One further Mac start is reserved for verification of that corrected fixture,
after cheap preflight, clean commit and fresh source/binary identities. This is
within the original ceiling, not a reset: **4 started / 1 reserved**, leaving one
unallocated Mac start for later work if verification starts as planned. No further
attempt is automatic. The next ignored directory is `mac-03`; preserve both prior
attempts. Successful Mac runtime and combined Windows proof remain outstanding.

The fixture-only correction is committed on the #94 branch as
`d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`. Its exact no-SDK public fixture
preflight passed and rebuilt the test executable. Corrected-fixture verification
has started outside the sandbox; `mac-03/launch-started.json` records its process
and time. Consumption is now **Mac 5 started / 0 reserved**, Windows
**1 started / 0 reserved**. The outcome is pending and the start remains charged.

### 2026-11-09: corrected #94 Mac proof complete, merger handoff

The corrected fixture passed at exact candidate
`d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`. The completed #94 branch is clean at
evidence commit `b31929f6b09158aa9d90fedfedadcf83c82493a1`. Its canonical note
`docs/tasks/evidence/arithmetic-94.md` owns the full contract and three attempts.
Compile/lint, exact integer/decimal values and types, bound text/sample checks,
deliberate wrong-outcome rejection and SDK/desktop cleanup passed. The coordinator
audited all four case records, all 208 unchanged inputs, retained binary and
accepted-source hashes. Ignored `mac-03/audit.json` records that audit. The two
failed attempts retain their original statuses and raw evidence.

Production code is unchanged by the selector correction. Reuse the implementer's
144 Rust public/unit cases and 31 renderer cases on their scoped inputs; the
successful SDK gate adds one distinct passing case. The repeated no-SDK preflight
does not add another case. Consumption remains **Mac 5/6 started, Windows 1/6
started, no reservations**. One Mac and five Windows starts remain unallocated.

A fresh merger receives exclusive integration mutation ownership from this
coordinator checkpoint. It will merge the returned branch normally, verify
qualified input equivalence, retain approved design/#92 fixtures, record the
caption-selector prevention lesson and publish to draft PR #122. It starts no SDK,
package/native or manual CI operation. After that handoff returns, route one
combined #93/#94 Windows qualification before #95 or #96 starts. No successor
implementation or further SDK invocation is selected by this merger handoff.


### 2026-11-09: #94 integration and SDK ceiling increase

The fresh merger took exclusive mutation ownership of clean integration tip
`c177d1cda54658bf0a71601e94d0495e4e1eb8e5`. Conflict-free normal `--no-ff` merge
`854f6ad11fdf79d6fc57d5d6e3cfa55131df7d90` preserves that tip as first parent
and returned branch `t3/decimal-arithmetic-authoring` at
`b31929f6b09158aa9d90fedfedadcf83c82493a1` as second parent. All three coordinator
records survived byte-for-byte before this receipt. No history was rewritten.

All merged tracked app, fixture, scripts and CI inputs exactly match corrected
qualified candidate `d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`; all 208 hashes in
the successful launch receipt match. The [#94 integration evidence](../evidence/arithmetic-94.md#integration-equivalence-and-fresh-checks)
owns tree identities, scoped reuse and fresh checks. Reuse 144 Rust public/unit
cases and 31 renderer cases, plus the corrected SDK gate for **145 distinct Rust
passes including SDK**. The repeated no-SDK preflight adds no distinct case.
Fresh pinned Node 24.19.0/npm 11.9.0 TypeScript checking passes, including the
post-original-typecheck definition source fields. Contract/revision/decimal-sample
and branch-plan checks, repository validation (1,856 files) and whitespace pass.
Existing Rust formatting proof is reused. No full suite was repeated for this merge.

Approved Story/Screens source, captures, approval records and the #92/#93 fixtures
are unchanged from the coordinator tip. H69 records the pinned SDK caption-selector
cause and existing-driver correction. The two failed attempts remain failed;
`mac-01` remains in the read-only #94 worktree, and `mac-02`/`mac-03` remain in this
integration checkout. All 40 retained files across those three attempts are unchanged.
No worktree or evidence directory was removed or altered.

During this merger assignment Kris explicitly increased the feature-wide SDK
ceilings from six to **20 per target** on 2026-11-09. Usage remains **Mac 5 started,
Windows 1 started, zero reservations**; **15 Mac and 19 Windows starts remain**.
The policy/table above owns current limits. Historical attempt accounting stays
unchanged. This increase allocates no run and starts no successor.

The coherent checkpoint is published by ordinary push only to
`origin/codex/spec-87-arithmetic`. Draft [PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122)
retains base `codex/phase3b-screen-designer`, full-spec scope and eventual closing
references. Automatic final-head checks remain for coordinator audit; no manual
CI was dispatched or watched. All tickets stay open for final review.

The Windows-ready source candidate is merge `854f6ad1`; later checkpoint edits are
documentation only. Combined #93/#94 qualification of this corrected fixture on
Windows remains required before #95/#96 starts. #97 production still requires
qualified #95. No SDK, native-editor/package, browser or manual CI operation ran
in this assignment. No final review, ready-for-review promotion, PR merge,
automerge or release is selected. On completion, exclusive integration mutation
ownership returns to the coordinator. Preserve every checkout and raw receipt.
CURRENT/HANDOVER retain their existing size exception for unique prior recovery;
this handoff changes only their current arithmetic state. Current sizes are
5,112 words and 9,176 words respectively.


### 2026-11-09: combined Windows #93/#94 qualification selected

The coordinator received the completed merger and verified clean integration
`b919ac4a`; its app/fixture inputs still equal qualified `d1c201f1`. SUNDOWN is
reachable and its Loomlight project remains registered at the preserved project
root. Existing Windows qualification branch `codex/spec-87-windows-92` contains
#92 evidence commit `c7e4e345`, which is an ancestor of current integration.

One Windows SDK invocation is reserved for the combined #94 selector after cheap
preflight and exact candidate verification. Use a fresh remote test delegate and
reuse the existing qualification worktree. Confirm its actual state/ownership,
then safely fast-forward to this published coordinator checkpoint. Preserve the
registered project-root checkout, all ignored evidence and every unrelated ref.
No new checkout or top-level chat is required by this assignment.

The remote assignment owns no production changes. It runs the existing decimal
fixture/draft preflights, verifies the official archive and retains a freshly built
x64 test executable plus input/launch receipts before the single SDK launch.
Require compile/lint, all integer/decimal value/type/text/sample witnesses,
wrong-outcome rejection, unchanged accepted source, complete records and cleanup.
Detailed Windows results belong in `docs/tasks/evidence/arithmetic-94.md` and fresh
ignored `.toolchains/arithmetic-94/windows-01/` in that qualification worktree.

Accounting before dispatch is **Mac 5/20 started, zero reserved; Windows 1/20
started, one reserved**. Fifteen Mac and eighteen Windows starts are unallocated.
A preflight refusal consumes no start; any actual SDK start, including failure,
consumes the reservation. No retry or successor implementation is selected.
Combined Windows proof remains required before #95/#96. The coordinator retains
integration mutation and ledger ownership while the remote test assignment runs.


### 2026-11-09: Windows evidence integrated; #95/#96 frontier selected

Combined Windows proof passed at `cae4dfc08425b14513a12af009ded11f6d436514`.
Evidence commit `918fa3cc5a03d882ce8abdd1c21af2a3b808f9b4` changes only the
canonical #94 note. Normal merge `235d99ace918d7261ad082c575c2f02b21d63adc`
preserves both histories. App, fixture, script and CI inputs remain unchanged
from qualified Mac `d1c201f1` and Windows `cae4dfc0`.

The coordinator inspected actual raw four-case outputs, exact witnesses, accepted
source/screen/sample records and the remote audit of 875 inputs, binary/archive
identities, prior receipts and cleanup. All 22 normal assertions passed. The
expected wrong outcome failed at money -14. Duplicate SDK selector listings add
no cases and omit no distinct required assertion. This supplies combined #93/#94
Windows proof. No SDK was rerun during audit/integration. #94 is review-ready;
issues remain open for full integration review.

Fresh #95 and #96 implementers start from this coordinator checkpoint, with TDD
at the already approved public authoring, source/history/reopen, accepted-source
SDK and actual frontend-to-core boundaries. Each receives a separate T3-prepared
worktree and branch, confirms ancestry, and normally merges integration before
returning. Exact prepared locations belong in their scoped evidence notes.

| Assignment | Branch | Exclusive file/interface ownership |
| --- | --- | --- |
| #95 ordered click-time Screens arithmetic | `t3/screens-click-time-arithmetic` | Core Screens action/runtime/inspection and related existing Rust tests/drivers; required shared core adapters; typed Screens compatibility in `app/src/screen-contracts.ts` and `app/src/screen-interactions.ts` only; `tests/fixtures/arithmetic-95/`; `docs/tasks/evidence/arithmetic-95.md`; canonical DATA_MODEL changes. No production control layout. |
| #96 approved Story arithmetic controls | `t3/story-arithmetic-controls` | `app/src/scene-ui.ts`, new Story arithmetic editor modules, Story-only `main.ts` transport/captions/reference wiring, scoped production styles, Story DOM/browser/core-journey tests and fixture data, the existing Help controller driver's bounded `scene.validateAssignment` allowlist entry, `docs/tasks/evidence/arithmetic-96.md` and UI documentation. No core arithmetic, Screens controllers/types or shared decimal setup/condition/sample controls. |

The coordinator owns all status/ledger, GitHub issues, PR, shared package/test
registries and integration mutations. Workers request overlapping registry or
contract changes through the coordinator; they preserve each other's ownership.
The shared `app/src-core/examples/help-controller-driver.rs` belongs to #96 only
for that named public-read allowlist entry; #95 uses the existing core fixture
owners and leaves this driver intact.
#96 uses declared decimals from source/backend fixtures. #97 owns shared decimal
setup controls. Tracks/Reel production views belong to separately selected #110;
#96 must report those real acceptance limits while implementing approved reusable
controls in the existing Story workspace. Full #110/palette work is not selected.

Exactly one Mac SDK start is reserved for #95 after no-SDK preflight, a clean
candidate and fresh source/binary receipt. Use the existing outside-sandbox
desktop/power route. No SDK start is allocated to #96, and no native editor/package
or manual CI operation is selected. Accounting is **Mac 5/20 started, one reserved;
Windows 2/20 started, zero reserved**, leaving fourteen Mac and eighteen Windows
starts unallocated. #95 Windows qualification follows its coherent backend return.
#97 waits for qualified #95. Final feature review and assembled acceptance remain.


### 2026-11-09: shared renderer registry unblocks #96

#96 identified that renderer `CORE_OPERATIONS` omitted `scene.validateAssignment`,
although #94's core whitelist/dispatch already admits it. The coordinator added
that existing public operation to `app/src/protocol.ts` and migrated the existing
exact protocol-list expectation. The focused protocol suite failed at the missing
entry before the fix and passes all nine cases after it. Pinned-tool test
compilation and production TypeScript checking pass. Repository/whitespace checks
pass. This changes no core/runtime semantics and consumes no SDK invocation.

#96 retains only its authorized Help-driver allowlist addition and Story wiring.
Both implementers can normally merge this integration checkpoint; shared registry
ownership remains with the coordinator. Existing qualified numeric/runtime proof
keeps its recorded code candidates and scope.


### 2026-11-09: #96 fixture registration and CI reference preparation

The coordinator confirmed that `test:fixtures` automatically discovers #96's
`story-arithmetic-core.dispatch.mjs` and `story-arithmetic.browser.mjs`, with no
skip directives. The existing PR frontend job builds the real core examples and
runs that fixture runner. No manual list or duplicate invocation is needed.
The testing selection map now names the affected Story consumers.

The browser comparison reads approved Story source `6ecf6470` with Git. CI's
existing two-commit checkout does not retain that old reference, so the fixture
step now fetches only that exact commit at depth one when the comparison script
is present. This preserves the fixture's pinned reference and the normal shallow
checkout. Actionlint, repository validation and whitespace checks pass. The
coordinator inspected the worker's passing actual-main/core journey result but
has not rerun or accepted its still-changing browser comparison. #96 retains
all test source and the named Help-driver allowlist line. No SDK, browser,
native/package or manual CI operation ran for this registration change.


### 2026-11-09: #96 returned; audited functional-increment merger handoff

Clean local `t3/story-arithmetic-controls` returned at
`b77cc26eeeb7d8eafc9b5a53410996e38eaa4be8`. Implementation candidate is
`3cb6e8f7354c3e05c1d77526c3babae857af632f`, including latest integration
`53cb37fa`. Its canonical `docs/tasks/evidence/arithmetic-96.md` owns the control
map, exact implementation/check scope, retained failures and acceptance limits.
The only core change is the assigned Help-driver allowlist line.

The coordinator verified all 252 frozen input hashes against both the candidate
and working files, the retained driver, nine successful real-main/core stages,
122 request/response pairs, all seven operation keys and actual zero/type/dirty/
stale/session refusals. Eight browser/reference PNG hashes and cleanup pass.
The source and test inputs remain identical to the candidate; the successor is
evidence only. The coordinator inspected wide/compact control captures. Equation
ordering, font and field height match; width, palette, variable selector and action
placement remain different. These are explicit limits, not full design acceptance.
Ignored `coordinator-audit.json` here retains the independent audit.

Reuse the worker's 68 focused component/controller passes, production typecheck,
frontend build, isolated Help example build/formatting and scoped browser proof on
those exact inputs. Core/library/Cargo and #94 fixtures are unchanged, so their
numeric/runtime proof retains its recorded scope. No fresh SDK, native WebView or
human acceptance follows from the new UI journey. #96 consumes zero SDK runs.

A fresh merger takes exclusive integration/PR mutation ownership from this
checkpoint, normally merges the returned branch, verifies combined input
identity and publishes the functional increment to draft PR #122. Keep #96 open
with Tracks/Reel, full layout/palette and assembled native/human acceptance
pending. No SDK/browser/native/package/manual-CI operation is selected for this
merge. #95 continues independently in its assigned worktree; its Mac reservation
remains charged pending actual start/result evidence. #97 still waits for qualified
#95. Preserve every worktree and unique raw receipt.

### 2026-11-09: #96 functional increment integrated and published

The fresh merger took exclusive integration/PR mutation ownership at clean
`157c1ef83c8b3b6a6d6b67c49b4952e0d21c01a6`. Conflict-free normal `--no-ff`
merge `25fa2e1c0116170d344374b638209d51fe6ae262` preserves that first parent and
returned `b77cc26eeeb7d8eafc9b5a53410996e38eaa4be8` as second parent.
Coordinator records survived byte-for-byte before this receipt. The returned
11-path change stayed within ownership; only the Help-driver allowlist changed
in core. No #95 work was merged.

All merged app and fixture bytes equal qualified implementation
`3cb6e8f7354c3e05c1d77526c3babae857af632f`. All 252 recorded hashes match
candidate/merged Git blobs and both working checkouts. The merger rechecked the
retained driver identity, 122 recorded request/response pairs, 21 successful
revision-bound validation responses, all seven operation keys, refusal codes and
eight PNG hashes. The independent coordinator audit remains intact. The
[#96 integration receipt](../evidence/arithmetic-96.md#integration-equivalence-and-fresh-checks)
owns exact trees, scoped evidence reuse and fresh checks.

Reuse 68 focused component/controller passes, production build/test compilation,
the nine-stage actual-main/core journey, wide/compact Chrome/reference comparison,
isolated Help-driver build and Rust formatting. Fresh pinned production typecheck,
contract/branch-plan audit, repository validation (1,862 files) and whitespace pass.
No full suite or browser was rerun. Approved designs/captures, prior fixtures,
core library and Cargo inputs remain unchanged. Existing numeric/runtime evidence
keeps its original candidates and scope; no SDK run qualifies the new #96 fixture.

#96 stays open and in progress as a functional increment. Equation order, 40px
formula height and 13.5px monospace font match `combined-v1`. Production retains
its full-width panel, native selector, breadcrumb, action placement and copper
palette. Tracks/Reel, full layout/palette and branch/view draft transitions belong
to #110. Native WebView/physical input and assembled human acceptance remain unrun.

During this merge Kris reported clean #95 return
`5cfc4812c52be24340d9bb919585aeb8c28fccda` on
`t3/screens-click-time-arithmetic`. Its reserved Mac SDK invocation actually
started and failed during fixture preparation before arithmetic assertions.
Consume the reservation: **Mac 6/20 started, Windows 2/20 started, zero
reservations**. The worker's canonical `docs/tasks/evidence/arithmetic-95.md`
and raw failure remain in its separate checkout. No #95 runtime proof succeeded;
#97 stays blocked. The coordinator is diagnosing the raw failure read-only.
This merger makes no #95 correction and starts no retry.

The checkpoint is published only to `origin/codex/spec-87-arithmetic`, with
draft [PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122) on its existing
Screens base and full-spec eventual closing references. Final-head automatic
checks remain for coordinator audit. No SDK/browser/editor-native/package/manual-CI
operation, watch, final review, promotion or parent-PR merge ran here.
Integration mutation ownership returns to the coordinator after publication
verification. Preserve every worktree, receipt and approved design. CURRENT and
HANDOVER retain their existing size exception for unique recovery records; only
the current arithmetic state changes at this handoff. Current sizes are 5,269
words in CURRENT and 9,635 in HANDOVER.

### 2026-11-09: same-handoff #95 correction reservation

After publication of the #96 checkpoint `132a709b`, the coordinator reported clean
local #95 head `32bd12871777f1712da17c4ca1aa847188413168`. Only its existing
Rust fixture/test owner and canonical evidence changed; production is unchanged.
The no-SDK GUI-initialization regression reproduced the shared `plan.available`
assertion, then passed after separating minimal-project availability from
full-template GUI limits. The strict minimal fixture also passed. The coordinator
reports two exact cases accepted by Cargo-log, formatting/repository/whitespace
passes, evidence export before assertions and four not-run SDK case records
initialized before generation. Original failed `mac-01` remains immutable.
No retry has started. Detailed evidence stays in #95's separate checkout.

The coordinator selected **one controlled Mac SDK follow-up** for that corrected
fixture, after this integration handoff returns, latest-integration merge, a clean
candidate and fresh input/binary receipts. Current accounting is **Mac 6/20 started
with 1 reserved for coordinator #95 correction; Windows 2/20 started, 0 reserved**.
Thirteen Mac and eighteen Windows starts remain unallocated. This uses the existing
20-start ceiling; it resets no counter. #95 remains unmerged and runtime-unqualified;
#97 remains blocked until qualification.

This same-handoff correction changes only ledger/CURRENT/HANDOVER and the draft
PR's current status. #96's merge, qualified inputs, evidence and acceptance limits
are unchanged. The merger runs no SDK, merges no #95 work and repeats no checks.
Publish only the documentation correction to the existing integration branch,
link PR #122 immediately and verify remote HEAD/upstream/clean state. Integration
mutation ownership then returns to the coordinator, who owns the reserved follow-up.


### 2026-11-09: corrected #95 Mac SDK follow-up started

The coordinator received the #96 merger's clean published `3db93619` and normally
merged it into corrected #95 head `32bd1287`. The resulting clean source candidate
is `8879088a56596780d66e94fcc19774db781e3b84`. Combined typechecking passes.
The rebuilt and retained executable SHA-256 is
`99bef3f59d9048b47991b2a291f42fd59592a3c5390468e4089a64c689f73dfb`.
Fresh ignored `mac-02/launch-receipt.json` in that worktree records all 869 inputs,
verified official archive, exact command/toolchain and desktop execution route.
A receipt preflight refused a temporary dependency symlink; removing only that
owned link restored clean source. That refusal started no SDK.

The allocated follow-up started outside the sandbox through the existing desktop
admission/power helper at **2026-11-09 13:18:32 UTC**, test PID **59401**. Local
exec session **82650** owns the launcher. `mac-02/launch-started.json` records the
actual start. Usage is now **Mac 7/20 started, Windows 2/20 started, no reservations**.
The outcome is pending and remains charged. Preserve failed `mac-01` unchanged.
No #95 integration, #97 implementation, Windows SDK or extra retry is selected by
this start. Qualification still requires every runtime and rejecting witness.


### 2026-11-09: #95 image-selector failure and CI token correction

The second #95 Mac attempt, source `8879088a`, completed failed. Compile/lint
passed; five normal-entry assertions passed before the SDK imagebutton lookup
returned no displayable. Arithmetic click and wrong-outcome proof remain missing.
Cleanup passed. All 869 receipt inputs match the frozen candidate; the coordinator
verified the binary, actual failed records and retained source. Source shows no
SDK ID: fixture replacement expected an unannotated imagebutton line, while public
authoring writes its identity comment there. This is a distinct harness failure.

The existing public no-SDK preflight now asserts the final accepted selector.
It failed before the correction, then passed after exact UUID-marker insertion
with one-match assertion. Production arithmetic is unchanged; #95's canonical
note and ignored `mac-02/` retain the failure and correction. One additional Mac
qualification is reserved after clean candidate/fresh receipt preparation.
Consumption is **Mac 7/20 started plus one reserved; Windows 2/20 started, none
reserved**. Twelve Mac and eighteen Windows starts remain unallocated. #97 stays
blocked. No further SDK start has occurred at this checkpoint.

Automatic Repository quality run `42623609020` at published `3db93619` failed its
frontend theme gate because the new Story popup shadow used literal #0006. The
coordinator reproduced that existing protocol failure locally, then used the
existing elevation token. All nine protocol checks pass after the correction.
No test was relaxed or added. This minor popup-shadow correction changes one
production stylesheet input after #96's frozen comparison; that comparison keeps
its original candidate and limits. Fresh automatic checks will qualify publication.
Detailed failed job log and local red/green outputs are retained under ignored
`.toolchains/arithmetic-ci/3db93619/`. No browser/native/package/manual-CI start
ran for this correction. The parent PR remains draft; final acceptance is pending.


### 2026-11-09: #95 selector verification started

The guarded imagebutton correction is local commit
`bb95a59f9d545b1b9b5d5543c0fa384767cf30a9`. The coordinator normally merged
published CI/token checkpoint `f8f4f904`, producing clean candidate
`30072c2c98a48d27786bb53bfd893a80dc0416b3`. Both exact no-SDK fixture cases pass
with the final SDK selector retained, including the known GUI-initialization limit.
The rebuilt/retained executable SHA-256 is
`0e36ff88518ab784eb1b19d5ba9a210017cb52be0ead155b79b3d31fb879d804`.
Fresh ignored `mac-03/launch-receipt.json` binds all 869 inputs, verified archive,
exact command/toolchain and candidate. No production arithmetic changed.

The reserved verification started outside the sandbox through the existing
admission/power helper at **2026-11-09 13:27:37 UTC**, test PID **63952**. Local
exec session **97254** owns its launcher; the outcome is pending. Current usage is
**Mac 8/20 started, Windows 2/20 started, zero reservations**. Preserve both failed
SDK attempts. No #97 entry or additional SDK invocation follows without actual
qualification evidence and a fresh allocation.


### 2026-11-09: #95 text timing proved; pinned ID selector corrected

The eighth Mac start completed failed at candidate `30072c2c`. Compile/lint and
11 normal assertions passed, including 6/12, 7/14, changed operands and keyboard
textbutton activation. The image click timed out; the remaining normal/rejecting
witnesses were not reached. All 869 frozen inputs, retained binary, unchanged
source and SDK/desktop cleanup were independently audited in `mac-03/`.

Pinned SDK source shows its ID selector compares evaluated screen names directly
with tuple scene-entry names, unlike normal get_screen/get_displayable. A no-SDK
synthetic metadata diagnostic of that exact method finds the widget for a tuple
and misses it for a string. The driver's two image selectors now use tuple names
in local `eef88d7d1a4f0aa3ed4554a4422936726b2d5f72`. Timeouts and all actual
mouse/keyboard/arithmetic/rejecting assertions remain unchanged. Production code
is unchanged. Prior failures remain failed, with immutable raw evidence.

After reassessing the complete remaining driver against pinned primary source,
the coordinator reserves one controlled verification with latest integration,
a clean candidate and fresh input/binary receipts. Accounting is **Mac 8/20 started
plus one reserved; Windows 2/20 started, none reserved**, leaving eleven Mac and
eighteen Windows starts unallocated. #95 remains runtime-unqualified and #97
blocked. No further start occurred during this diagnosis.


### 2026-11-09: #95 tuple-selector verification started

The coordinator normally merged published allocation `323a0685` into corrected
selector commit `eef88d7d`, producing clean candidate
`ecf2e2f7d9df8130e9102579c9ac9db6baec56b2`. The rebuilt and retained executable
SHA-256 is `1b774c1e2b8bba471c488e056aa26dead6456a38eb67a61cc75a62578c6b8ca1`.
Fresh ignored `mac-04/` records all 869 input hashes, pinned archive and exact
command/desktop context. The reserved invocation started at **2026-11-09
13:35:52 UTC**, test PID **68200**, owned by local exec session **18844**.
Consumption is now **Mac 9/20 started, Windows 2/20 started, zero reservations**.
The result is pending. No previous failure is overwritten or promoted to pass.


### 2026-11-09: #95 Mac runtime qualified; fresh merger handoff

Clean local `t3/screens-click-time-arithmetic` is returned at
`899f0e5798afa8637bf4a23284cc22185b27a1fc`. Qualified candidate is
`ecf2e2f7d9df8130e9102579c9ac9db6baec56b2`, including published `323a0685`.
Its evidence-only successor changes no app/fixture input. The canonical #95 note
owns the complete public contract, four Mac attempts and exact source/runtime proof.

The fourth Mac attempt passed compile/lint, all 22 normal assertions and the
required rejecting assertion, with every exact witness, unchanged accepted source
and SDK/desktop cleanup. The coordinator independently verified all 869 input
hashes against clean Git and working files, retained binary, four actual public
action validation/commit pairs, case records and source/witness outputs.
`mac-04/coordinator-audit.json` in that worktree retains the audit. No process runs.
All three prior attempts stay failed with immutable raw evidence. Only fixture
assumptions changed during recovery; production arithmetic is unchanged.

Reuse 53 prior scoped Rust cases, 12 renderer cases and actual Screens controller/
core journey. The added GUI regression and successful SDK case bring distinct
Rust coverage to 55 including SDK; repeated preflights add no cases. Fresh combined
typechecking also passed after Story integration. #95 Mac runtime is qualified;
Windows is still required and #97 remains blocked.

Usage is **Mac 9/20 started, Windows 2/20 started, zero reservations**. A fresh
merger receives exclusive integration/PR mutation ownership from this checkpoint.
Normally merge #95, verify qualified input equivalence, preserve #96 and approved
reference/evidence trees, update canonical status/PR and publish the Windows-ready
candidate. The merger selects no SDK/browser/native/package/manual-CI operation.
Then coordinator routes a bounded fresh Windows qualification through the existing
host/worktree. Keep #95 open, preserve all worktrees and wait for actual target
qualification before #97. Final feature review/acceptance remain pending.

### 2026-11-09: #95 integrated for Windows qualification

The fresh merger received exclusive integration/PR mutation ownership at clean
`ecc55df8`. Conflict-free normal `--no-ff` merge
`0382ae3c999e9e197af1fd289a3b45ffc4d1bec5` preserves that coordinator parent and
returned `899f0e5798afa8637bf4a23284cc22185b27a1fc`. Coordinator records,
approved references/captures and earlier fixtures survived unchanged.

The entire app/fixture/script/CI inputs equal Mac-qualified `ecf2e2f7`.
The merger verified all 869 frozen hashes against both Git candidates and both
working checkouts, the retained executable, four actual public action pairs,
case outputs/witnesses, source invariance and cleanup. The
[#95 integration receipt](../evidence/arithmetic-95.md#integration-equivalence-and-windows-ready-candidate)
owns exact trees, reuse and fresh checks. Reuse 55 distinct Rust passes including
SDK, 12 renderer passes and the actual Screens controller/core journey; no
unchanged suite or SDK run was repeated. Fresh pinned production typecheck,
contract/branch-plan, repository and whitespace checks pass. The incident index
links the three fixture causes to their detailed recovery; H69 stays unchanged.

Draft PR #122 keeps its Screens base and full-spec eventual closing references.
#95 stays open with Mac qualified and Windows pending. #97 stays blocked.
#96 remains a functional increment with partial visual fidelity and separate
full-layout/palette, Tracks/Reel, branch/view drafts and native/human acceptance.
The shadow-token correction retains its original comparison scope and limits.
Final-head automatic checks require exact-head coordinator audit.

SDK use remains Mac 9/20 and Windows 2/20, with zero reservations. This merger
started zero SDK/browser/editor-native/package/manual-CI operations and registered
no watch. After publication verification, exclusive mutation ownership returns to
the coordinator for a bounded Windows assignment against this app/runtime identity.
No successor implementation, final review, issue closure, PR promotion or merge
is selected. All worktrees and raw attempt evidence remain preserved.


### 2026-11-09: Windows #95 qualification selected

The coordinator received clean published integration `fe7a49c0` and verified its
app/fixture inputs still equal qualified `ecf2e2f7`. SUNDOWN is reachable. The prior
Windows qualification evidence `918fa3cc` is an ancestor of integration, allowing
a safe fast-forward of the existing assigned qualification worktree after remote
clean-state/ownership checks. Preserve the registered project-root checkout and
all previous #92/#94 receipts; no new checkout or top-level chat is needed.

One Windows SDK invocation is reserved for the existing #95 gate after both exact
no-SDK fixture preflights, official archive verification, a clean candidate and
fresh build/source/binary receipts. Use fresh ignored
`.toolchains/arithmetic-95/windows-01/` there. Require all four complete unique
cases, 22 normal assertions and exact current/ordered text/image click/keyboard,
invalid/inertness/Finish witnesses, deliberate rejection, source invariance and
cleanup. The canonical #95 note owns selector details and prior harness lessons.
A fresh remote delegate owns only qualification evidence; source remains unchanged.

Accounting before dispatch is **Mac 9/20 started, zero reserved; Windows 2/20
started, one reserved**. Eleven Mac and seventeen Windows starts are unallocated.
Preflight refusal consumes no start; any actual SDK start consumes the reservation,
including failure. No retry, native editor/package or manual-CI operation is
selected. The coordinator retains integration/ledger/PR ownership. #97 stays
blocked until actual successful Windows evidence is audited and integrated.

### 2026-11-10: Windows #95 audited and #97 selected

Windows #95 passed its single reserved invocation at `a2c7ab97`. The coordinator
read the finished remote history, actual normal/wrong-output records, independent
audit and cleanup. All 22 assertions and four exact markers pass. All 883 inputs,
executed/retained binary and SDK identities agree; no timeout, truncation or owned
process remains. Local story/driver/test-owner hashes match the receipt, and app,
fixture, script and CI trees still equal Mac-qualified `ecf2e2f7`. No SDK was repeated.
Evidence-only `55f89ddf` is integrated by normal merge `7bc452a5`. The
[#95 Windows result](../evidence/arithmetic-95.md#windows-invocation-1-passed-2026-11-10-aest)
owns full identities and cases. Preserve the remote worktree, 154 new receipts and
71 prior receipts. Local audit: ignored `windows-coordinator-audit.json` under
`.toolchains/arithmetic-95/`. Usage is **Mac 9/20, Windows 3/20, zero reservations**.
Automatic quality run `42630146353` succeeded at `a2c7ab97`; later publication
heads require their own selected checks and final audit.

#95 is qualified on both targets and remains open for final review. #97 is now
selected for a fresh implementer, request key
`spec87-ticket97-implementer-20261110`, in a T3-prepared separate worktree from
the committed integration checkpoint containing this entry. Confirm ancestry
and clean state before edits. Use branch `t3/screens-decimal-arithmetic-controls`
if unused; preserve the prepared branch if it already has a safe assigned identity.

The implementer owns Screens arithmetic presentation/controllers and scoped styles,
decimal variable creation/default wiring in `main.ts`, numeric conditions,
screen text/sample inputs, focused tests/fixtures, `docs/UI.md` and the canonical
`docs/tasks/evidence/arithmetic-97.md`. Read Design Lab integration and the approved
`screens-arithmetic` / `equation-v2` record before edits. Use the preserved A2
source/captures and existing read-only reference checkout. Keep Story arithmetic
and backend numeric semantics with their current owners. Reuse existing controls
and core validation; map every approved control to a real operation before editing.

The initial permitted core edit is `variable.update` in the existing Help driver's
operation allowlist, needed for the actual-main default-edit journey. All required
operations already exist in `CORE_OPERATIONS`. The coordinator retains shared
registries, dependency/config/CI files, status/ledger, integration and PR/tickets.
Fixture discovery already finds `*.dispatch.mjs` and `*.browser.mjs`; add no
parallel registry. Request a precise ownership exception if a real gap appears.

Use confirmed TDD boundaries. Prove actual production UI to core, accepted source,
one-step shared Undo/Redo and reopen for text/image arithmetic and decimal controls.
Keep canvas/sample editing inert, bars whole-number-only, typed backend feedback,
revision/session protection and retained drafts. Compare approved and production
states at wide/compact sizes, using scoped browser permission before shell launch.
Report visual fidelity and functional correctness separately, including any material
difference. Newly uncovered design decisions need Kris's approval; the approved
A2 behavior needs no repeat approval. No SDK, native editor/package or manual-CI
operation is allocated. Return exact changed runtime inputs if new proof is needed.

Before returning, normally merge current integration, run affected combined checks,
commit the scoped implementation and return a clean head with exact evidence and
limitations. No push, PR/ticket mutation or worktree cleanup. The coordinator then
audits and assigns a fresh merger. #96 remains a functional increment; its partial
visual fidelity, Tracks/Reel/full layout/palette, branch/view drafts and native/human
limits are unchanged. Final full-spec review remains required after #97 integration.
Status files retain existing unique recovery history beyond their size targets;
this handoff replaces superseded live Windows instructions rather than adding a
second continuation.

### 2026-11-10: #97 variable history ownership exception

The actual-main/core journey confirms that `variable.create` and `variable.update`
persist decimal defaults but add no shared Undo entry. The coordinator traced both
to `authoring.rs::commit_source_and_metadata`, which prepares the existing source
and authoring-metadata transaction, then calls `commit_observed` without recording
history. The existing `scene.rs::commit_history` already records the same proposal
using actual committed revisions. This is a missing #97 acceptance behavior, not
a new arithmetic requirement or a reason to defer the selected outcome.

Extend this implementer's core ownership to variable creation/default commit wiring
in `app/src-core/src/authoring.rs`, focused existing public-core tests and the
corresponding canonical data-model paragraph. Route the complete existing proposal
through the current shared history owner. Keep source and metadata in one entry;
retain exact revision/error/recovery guards, semantic no-op behavior and the
session-local history boundary. Prove creation and default-edit Undo/Redo,
interleaving with an existing scene/screen mutation, refusal/no-op history and
reopen through the real public owner and actual-main journey. Keep bool/int/string
paths coherent with decimals. Reuse the current red as evidence.

This exception supersedes the original driver-only core boundary. It does not
select a second history stack, transaction/history-internal changes, catalog-wide
history work or new renderer authority. The implementer owns these changes in its
existing separate worktree; the coordinator edits no core files in parallel.
Record changed paths and proof in `arithmetic-97.md`, then normally merge current
integration before return. No SDK/native/package/manual-CI run is allocated;
usage remains Mac 9/20, Windows 3/20, zero reservations. Existing SDK evidence
keeps its original candidate and scope. Any further ownership gap returns to the
coordinator with its exact cause and affected files.

### 2026-11-10: #97 new-imagebutton validation exception

The implementer identified a second admission gap. `screens.compose` currently
admits `validateOnly:true` only for `Actions` on an accepted node. New imagebuttons
therefore receive core feedback only at combined Apply. The coordinator traced
`AddImageButton` through the same composition preparation: image references,
layout and interactions prepare proposed bytes/metadata companions before the
existing validation return, which precedes `commit_history`.

Extend this implementer's ownership to the `AddImageButton` validation admission
in `app/src-core/src/screens/composition.rs` and focused existing public tests.
Use the complete pending creation command with its original source, authoring,
target and asset reviews. Reuse existing preparation and response semantics;
other unsupported validation commands remain refused. The response keeps the
accepted `document`, `changed:false` and `documents:[]`, with proposed inspection
in `actionValidation`. A generated node ID/revision belongs to that proposal only;
it grants no accepted selection or write precondition. Apply revalidates the
original reviews and commits the complete creation once.

Prove live valid/invalid numeric feedback for the pending imagebutton, retained
drafts and stale/dirty dependency refusal. Snapshot authoritative source and
metadata and the shared history boundary to prove that successful/refused
validation writes nothing, including proposed asset-metadata companions. Then
prove combined Apply, one-step Undo/Redo and reopen through existing public-core
and actual production controls. Preserve component/context/action-limit/Finish
guards, typed core diagnostics, existing image review and asset authority. Keep
the evaluator, runtime generation and transaction/history internals unchanged.

Record the tested extension and its candidate in `arithmetic-97.md` and the
canonical DATA_MODEL contract. Update only the current #95 handoff's validation
contract to link the qualified #97 extension; retain historical #95 evidence and
its original actions-only scope. The coordinator edits none of these code files
in parallel. No additional SDK/native/package/manual-CI operation is allocated;
counts remain Mac 9/20, Windows 3/20, zero reservations. The implementer normally
merges the latest coordinator checkpoint before returning its scoped result.

### 2026-11-10: #97 returned and coordinator audit

The fresh implementer returned clean `t3/screens-decimal-arithmetic-controls` at
`0d49e0050aa17bfc0d253dfcfc20cc37e87f052b`, containing coordinator `01993e91`.
Tested source is `679e0df78d5f25afcc95af751d74d59788dab820`; the successor changes
only its evidence note. The note owns all 26 changed paths and exact commands.
Both scoped core exceptions remain within their assigned owners. Numeric semantics,
Screens runtime generation, history internals, approved references and Story
arithmetic controls remain unchanged.

The coordinator verified all 872 frozen hashes against the tested Git checkout
representation and returned working tree. Four unchanged PowerShell files use
their explicit CRLF checkout filters. The retained Help binary hash and three
accepted-source hashes match; the actual-main/core journey has 11 passing stages,
473 protocol records, driver exit 0 and fixture cleanup. The inherited interaction
and control dispatch consumers pass on the implementation. Reuse the worker's 93
distinct Rust and 38 focused renderer passes, build/typecheck and formatting under
their recorded scope. Ignored SDK gates and earlier failed/partial runs add no passes.
The ignored local receipt is `.toolchains/arithmetic-97/coordinator-audit.json`;
preserve the worker's complete `.toolchains/arithmetic-97/` evidence and binary.

The coordinator inspected eight paired capture files. Equation ordering, source
field sizing and named controls follow A2; generic numeric conditions still use
the existing stacked production form instead of the reference's grouped comparison
row. Surrounding host/background and placement differences remain visible. Earlier
textbutton comparison captures precede the final scoped palette correction; final
extended imagebutton/condition captures retain their actual source scope. These are
inputs to final design review, not approved deviations or full visual acceptance.
Keep #96's previously recorded limits distinct. Native/human acceptance remains open.

New UI-emitted defaults, ordered formulas, condition/text and created-imagebutton
source have no SDK proof. #94/#95 evidence retains its exact original input scope.
Final review must assess those new runtime inputs and remaining design/acceptance
requirements before selecting a coherent bounded qualification candidate. Current
usage stays **Mac 9/20, Windows 3/20, zero reservations**; no SDK/native/package or
manual-CI operation is selected by this audit or merge.

A fresh merger receives exclusive integration-checkout/status/PR mutation ownership
from the coordinator checkpoint containing this entry. Normally merge `0d49e005`,
preserve both histories, verify complete app/fixture equivalence to `679e0df7` and
the frozen receipt, then run affected fresh combined checks. Preserve all approved
references, unique evidence and coordinator records. Update CURRENT/HANDOVER, this
ledger and draft PR #122, retaining the Screens base and eventual full-spec closing
references. Publish and verify a clean tracking checkout. Keep #97 and all remaining
acceptance open; do not promote or merge the parent PR. No successor implementation,
SDK/browser/native/package/manual-CI run or watch belongs to this merger. Return
mutation ownership to the coordinator for the full integration code-review skill,
in-scope fixes and the remaining qualification/design/acceptance work.


### 2026-11-10: #97 functional increment integrated

Conflict-free normal no-ff merge `0dc53eeb3f167c3000fbb7c94a56ed35b0df6793`
preserves coordinator `72e9b5551b6b7fda39857c21a0a39529121f5f8d` and returned
`0d49e0050aa17bfc0d253dfcfc20cc37e87f052b` in that order. Complete app/fixture/script/CI
inputs equal tested `679e0df78d5f25afcc95af751d74d59788dab820`; all 872 frozen
hashes match candidate/merged Git checkout representations and both working trees.
Coordinator records and the returned evidence tree survived. Approved references,
evaluator/runtime adapter, transaction/history internals and Story arithmetic controls
remain unchanged. No dependency, protocol or CI registry was added.

The [#97 integration receipt](../evidence/arithmetic-97.md#integration-equivalence-and-fresh-checks)
owns exact tree/driver/source identities and command/results. Reuse 93 distinct
Rust and 38 focused renderer passes, Screens actual-main/core and inherited dispatch,
build/typecheck/format and scoped browser proof. Fresh pinned typecheck, contract/branch-plan,
repository and whitespace checks pass. The selected fresh Story actual-main/core journey
also passes nine stages/122 requests against the identical retained #97 Help binary,
including shared Undo/Redo, refusal and reopen; exit 0 and cleanup pass.

#97 is a review-ready functional increment, not full acceptance. Stacked numeric
conditions, surrounding host/background/placement differences and capture/palette
source limits remain for review. Newly emitted UI fixtures have no SDK execution;
#94/#95 evidence retains its original scope. Keep #96's partial visual fidelity,
#110 layout/palette/Tracks/Reel/branch-view drafts and native/human limits open.
All issues stay open; only #97's delivery paragraph changes. The draft PR retains
its Screens base and eventual full-spec closing references.

The coordinator resumes integration/status/PR ownership after publication and this
handoff. Next is the full integration code-review skill, in-scope fixes, then selection
of coherent remaining qualification/design/acceptance work. All raw evidence and
checkouts remain. This merger used zero SDK/browser/native/package/manual-CI or watch
operations. Totals remain Mac 9/20 and Windows 3/20, zero reservations. Status files
retain their inherited historical recovery sections; this bounded update does not
perform a broader archival cleanup despite their excess word counts.

### 2026-11-10: full integration review selected

The coordinator received clean published `09404bd16018c7f046bf6392143df6e235d481ba`.
Review is pinned from accepted Screens base
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8` to that exact head, using
`git diff 251fb477...09404bd1`. The resolved merge-base is the accepted base and
the diff contains 137 files. Full scope, commit list, changed paths and discovered
standards sources are retained under ignored `.toolchains/arithmetic-review-09404bd1/`.

Apply the code-review skill's independent Standards and Spec axes in fresh parallel
read-only agents, request keys `spec87-review-standards-20261110` and
`spec87-review-spec-20261110`. They own no tracked files or shared processes. Review
the complete change, not only #97. Skip tool-enforced style findings; distinguish
documented violations from heuristic smells. Spec review uses live #87 and active
slice criteria plus existing design approvals, retaining #110's separate ownership.
Known visual/proof gaps are not approved deviations. Return actionable source
locations, evidence and requirement/rule citations. No SDK/browser/native/package,
manual-CI, push, PR mutation, new issue or watch is selected for either reviewer.

The coordinator retains integration/status/PR ownership, aggregates the two axes
separately and then assigns one fresh implementer for in-scope review fixes under
implement-spec. Runtime/native/human and design acceptance remain open; select
coherent remaining proof after fixes. SDK use stays Mac 9/20 and Windows 3/20,
zero reservations. The pinned review head remains the product candidate even if
later coordinator-only documentation records the review assignment.

### 2026-11-10: review findings and correction selected

Both read-only axes returned at pinned `09404bd1`. The
[review record](../evidence/arithmetic-review.md) preserves them separately:
Standards has five P2 documented violations, worst IME draft replacement; Spec
has four P2 findings, worst silent default-draft loss. Wrong-action focus overlaps
both axes. Seven distinct code defects require correction; no smell-only or
substantiated scope-creep finding was reported. Both reviewers preserved tracked
files/refs and used no browser or SDK. Detailed reproductions remain ignored
under `.toolchains/arithmetic-review-09404bd1/`.

Select one fresh TDD implementer, request key
`spec87-review-fixes-20261110`, in a prepared separate worktree based on this
committed coordinator checkpoint. It owns the affected Story/Screens arithmetic
presentation and existing draft owners, variable-default retention, narrow typed
action-failure context if needed, focused tests and canonical evidence/contracts.
No duplicate evaluator or transaction/history owner. Fix every code finding and
the already selected #97 grouped-condition/control fidelity obligation, preserving
the approved reference and full #110 boundary. The coordinator owns integration,
status/ledger, tickets and PR. A fresh merger follows the returned correction.

Spec P4 needs an explicit decision: #96's Tracks/Reel and cross-view drafts depend
on the unselected #110 workspace. The coordinator asked Kris whether to move that
workspace acceptance to #110 or keep full #87/#96 blocked on it. The question stays
pending; independently authorized code/design corrections proceed. The implementer
must neither change criteria nor implement #110. Final acceptance remains open.
SDK counters stay Mac 9/20 and Windows 3/20, zero reservations. Focused browser
comparisons are selected for approved controls; no SDK/native/package/manual-CI
run is allocated. Return exact corrected candidates and new runtime-input scope
for subsequent coherent qualification, not an inherited full-feature pass.

Before dispatch, one-time reviewed-head CI audit found `42647963956` and
`42647882928` failed on a superseded `Edit default` probe selector. The coordinator
migrated that existing caller to the selected variable's inspector. The unchanged
smoke report's three scenarios pass after a matching local red; its four reported
results include the parent test. The
[CI correction](../evidence/arithmetic-review.md#ci-caller-correction-before-review-fixes)
retains exact run/log scope and native-package limits; H73 indexes it. The fresh
fixer inherits this correction and preserves the existing assertions. A final
coherent frontend run is warranted after the seven UI corrections; no costly
operation or additional native proof follows from the replay.

### 2026-11-10: reviewed corrections returned and audited

The single fresh fixer returned clean `t3/arithmetic-review-fixes` at
`354b52211b42e85721d80b751b08832db10db38e`, containing integration `61d70f96`.
Its 20 changed paths correct S1-S5 and Spec P1-P3, with S3/Spec P2 corrected once.
The current review note records each red/green and the A2 control correction.
Spec P4 and Kris's #96/#110 decision remain pending; no criterion was waived.

The coordinator verified all 873 app/script/fixture/CI hashes against the tested
Git checkout representations and returned working tree, including four explicit
CRLF script filters. Retained driver, runtime inventory and comparison manifest
hashes match. Both actual-main/core receipts pass with exit 0 and cleanup:
Screens 13 stages/505 requests, Story nine stages/126 requests. All four emitted
source files and 32 final capture hashes match. The ignored coordinator audit is
`.toolchains/arithmetic-review-fixes/coordinator-audit.json`. Preserve every worker
receipt under its own `.toolchains/arithmetic-review-fixes/` directory.

Eight final control crops were independently inspected. Wide/compact numeric
conditions now use A2's grouping; final equations/default controls use the approved
slate/brass tokens and field sizes. Existing container widths and panel placement
still differ. This is scoped control conformance, not full Story workspace,
native or human acceptance. Approved references, arithmetic evaluator/runtime
helper, transaction/history internals and the migrated smoke caller are unchanged.

Reuse the final 390 frontend passes, 35 focused control/authoring/protocol checks,
17 action and 19 control public-core passes, actual-main journeys, production
build/typecheck/format and final comparison on identical inputs. An ignored SDK
gate adds no pass. The failed first full run, lock/status correction, Python
mismatch and corrected runs remain recorded, without deadline/guard weakening.
New runtime payload/source inventory is available for the next coherent qualification;
no new SDK/native/package/manual-CI proof is inferred. Counts remain Mac 9/20 and
Windows 3/20, zero reservations.

A fresh merger receives exclusive integration/status/PR mutation ownership from
the coordinator checkpoint containing this entry. Normally merge `354b5221`,
preserve both histories and coordinator records, verify full app/fixture/script/CI
and frozen-input equivalence, then run affected fresh combined checks. Reuse
unchanged final suites; do not repeat a broad or costly campaign. Preserve the
original independent review reports and append exact correction/integration results.
Update live status, ledger and draft PR #122, publish and verify clean tracking.
Keep all issues/criteria open and P4 unresolved. No SDK/browser/native/package,
manual-CI, watch, successor work or PR promotion/merge belongs to this merger.
Return ownership for coherent runtime qualification and remaining acceptance work.

### 2026-11-10: reviewed corrections integrated

Conflict-free normal merge `b52a6723bfb1c86895227813e35865d4c6d9dc2f` preserves
coordinator `636371b8262fbc660cc76da49a66d80271fc7356` and returned
`354b52211b42e85721d80b751b08832db10db38e`. Complete app/fixture/script/CI trees
equal the returned source; all 873 frozen inputs match Git checkout representations
and both working trees. No integration fix was needed. The
[integration receipt](../evidence/arithmetic-review.md#integration-equivalence-and-fresh-checks)
owns exact tree identities, evidence preservation, reused checks and fresh checks.

Reuse the 390-test frontend result on its recorded inputs plus the final affected
11-check Story association rerun, without claiming the older suite used the exact
final source. Reuse the 35-check focused result with that final Story follow-up,
17 action/19 control
public-core passes, actual-main journeys, production build/format and final scoped
comparisons. The named ignored SDK gate stays unrun. Fresh pinned typecheck, nine
protocol checks, 631 recorded-envelope checks, contract/branch-plan audit, repository
validation and whitespace pass. All 182 worker raw evidence files, retained driver,
four emitted sources, 32 captures, coordinator records and approved references survive.

S1-S5 and Spec P1-P3 are corrected; the original Standards 5 / Spec 4 reports at
`09404bd1` remain intact. No review approval is invented. Spec P4 and Kris's #96/#110
scope question remain pending, with all issues/criteria open. New emitted source
still needs selected coherent runtime qualification. Earlier #94/#95 both-target
proof keeps its original scope. SDK totals remain Mac 9/20 and Windows 3/20, zero
reservations. This merger starts no SDK/browser/canvas-helper/native/package/
manual-CI/watch operation and does no successor work.

The documentation successor and draft PR #122 retain the Screens base and eventual
full-spec closing references. Separate ignored `integration-merge/` receipts own
publication identity, clean tracking and one-time automatic CI observation.
Integration/status/PR ownership returns to the coordinator at this handoff for the
P4 decision and remaining runtime/design/native/human acceptance selection.
CURRENT/HANDOVER retain inherited excess length to preserve unique earlier
qualification and recovery context; this handoff replaces superseded live wording
without creating another status archive.

### 2026-11-10: UI-emitted source qualification selected

The corrected integration is clean and published at
`1d90da1f7dd3e7a01e2556379ebad7b20cf8ffc3`, normal merge `b52a6723` preserving
coordinator `636371b8` and returned `354b5221`. All 873 inputs and complete
app/fixture/script/CI trees match the correction. Reuse final affected proof and
unchanged earlier cases under the integration receipt's explicit scope. Fresh
typecheck, nine protocol checks, 631 recorded-envelope checks, contract/branch-plan,
repository and whitespace pass. No independent re-review approval is inferred.

Select a fresh separate-worktree test implementer, request key
`spec87-ui-runtime-qualification-20261110`, to prepare portable fixture inputs and
extend the existing SDK test owner for actual UI-emitted Story/Screens source.
The corrected worker's `runtime-inputs.json` and four hash-pinned emitted sources
own the captured inputs; original #94/#95 qualification remains unchanged. Use
existing fixture/adapters/receipts, not a new standalone gate or evaluator.
Keep captured bytes and asset identities traceable. Record any relocation or
test-host arrangement separately rather than silently changing UI source.

Before SDK use, require SDK-free source/dependency/selector/oracle preflight,
verified official Ren'Py 8.5.3 archive/provenance, a clean committed candidate,
pinned build/executable and complete input manifest. Qualify compile/lint, normal
entry with exact independently expected values/types/text/conditions, ordered
text/image action behavior and deliberate wrong-outcome rejection. Preserve
accepted source, all case outputs and owned-process/temp cleanup. Use existing
Mac `native_desktop` admission/power handling through scoped host execution.
The fixture must distinguish actual SDK behavior from data-only UI/core evidence;
it cannot obtain a pass by copying expected values from the implementation.

One Mac SDK invocation is reserved for the prepared coherent batch after readiness.
Use a fresh ignored `mac-01` output under this assignment. A started fixture
invocation consumes the reservation even if preparation, display or assertions
fail; preflight refusal consumes none. No retry is selected. Record exact physical
SDK child records as well as the selected invocation. No Windows invocation is
reserved yet; the coordinator routes it after audited Mac readiness/publication.
Before dispatch, use is **Mac 9/20 started + 1 reserved; Windows 3/20 started**.
No editor-native/package, browser, canvas-helper, manual-CI or watch is selected.

The implementer owns only qualification fixtures, existing test/receipt consumers,
their focused public preflights and the review's qualification evidence. Production
semantics/UI, dependencies/CI/config, approved references, status/ledger/tickets/PR
remain coordinator-owned. Report any actual product failure before changing it.
Normally merge current integration before return; preserve every receipt and
return a clean committed source/result with the reserved start's exact disposition.
A fresh merger follows test implementation. P4 and the #96/#110 scope question
stay pending and do not block this independently selected runtime proof.

### 2026-11-10: first UI SDK result audited; recovery selected

The fresh qualification implementer returned clean
`t3/arithmetic-ui-runtime-proof` at `12ce2eeaca7a4ab69c3853bd5409cedc9e8540da`.
Attempted source is `81494e37`; `223cd09e` adds the SDK-free driver correction
and `12ce2eea` adds evidence identity only. Eleven changed paths are fixtures,
the existing SDK test owner, its test-only subprocess receipts and review evidence.
No production arithmetic/UI/history semantics changed.

The coordinator audited the failed invocation, not a full qualification pass:
all 1,880 frozen Git checkout inputs, retained binary, 77 exported files and all
four captured source hashes match. Compile/lint passed; normal entry passed five
assertions and exact Story trace/types, then failed at the narration transition.
The wrong-outcome case is unrun. All three completed cases preserve accepted bytes,
with no process timeout or output truncation. Ten physical SDK children have matched
records, including seven fixture-construction children. Desktop/power, process and
temporary-root cleanup are verified. Local ignored audit:
`.toolchains/arithmetic-ui-runtime/mac-01-coordinator-audit.json`.

The trace remains at captured `ui_story.rpy:15`; its return and the expected
following narration are present. Pinned SDK `Advance`/`Until` replay supports the
driver's missing destination guarantee. Exact late-begin callback ordering is
still provisional. The corrected driver replaces only seven bare advances with
destination-bound transitions, preserving source snapshots, values, assertions
and deadlines. The driver hash is
`dc52be7ec9edbe66e208c496dccca41552bc6d6a287f4b316987982c301270ac`.
SDK-free preflight was observed red on the old driver; 19 action cases pass with
the correction and two named SDK gates ignored. H74 indexes the failure and the
remaining need for actual SDK confirmation. Do not turn this into a green runtime
claim or reuse the old attempted executable for the corrected driver.

The original reservation is consumed: actual totals are Mac 10/20 and Windows
3/20, with zero reservations at receipt. A new single Mac recovery invocation is
now reserved. The fresh merger owns normal integration/publication of `12ce2eea`,
input-equivalence and affected checks, then may execute that one invocation only
after a clean committed candidate, fresh retained binary, both exact preflights,
official archive/SDK identity and host desktop readiness. Publish the corrected
fixture candidate before SDK execution; keep source fixed during the run.
Use fresh ignored `mac-02` evidence in integration, preserving worker `mac-01`.
Require compile/lint, every normal witness and the actual wrong-outcome rejection,
unchanged source and cleanup. A started failure consumes this new reservation;
no further retry or driver/production correction is assigned to the merger.

This explicit merger assignment includes the one Mac SDK recovery, unlike prior
zero-cost mergers. It allocates no Windows, editor-native/package, browser,
canvas-helper, manual-CI or watch operation. The coordinator will route Windows
after the published result returns. All prior failed evidence remains intact.
P4 and the #96/#110 question remain pending, with every issue/criterion open.

### 2026-11-10: recovery integrated; second UI Mac result failed

Conflict-free normal merge `ec7e366b7bff4051b54b2f739fe1416b35fa5360`
preserves coordinator `b2257241` and returned `12ce2eea`. Complete app/fixture/
script/CI inputs equal the return; coordinator records survive. All 1,880 Git
checkout inputs match. Fresh retained Rust binary, both exact SDK-free preflights,
19 action passes with two named SDK gates ignored, static driver admission,
formatting, contract/branch-plan, repository and whitespace checks pass. The clean
corrected candidate was published and remote identity verified before SDK use.

The one selected Mac recovery started on that fixed source and failed. Compile 0,
lint `--error-code` 0, normal 1 after 13 passing assertions, wrong outcome unrun.
Narration now reaches the screen; the first divide assertion does not observe
money 2.25. Story trace/types, condition and rendered balance/inertness pass at
their exact boundaries. Four later witnesses, action/Finish and negative proof
remain missing. The [recovery evidence](../evidence/arithmetic-review.md#recovery-integration-and-mac-invocation-2-2026-11-10)
owns identities, commands, provisional timer/interaction diagnosis and the audit.
No source correction or additional SDK attempt is assigned.

Ten physical SDK children have matched records, separate from one charged start.
All three completed cases preserve source without process timeout/truncation;
77 exports, four snapshots and asset bytes match. Power, owned process and temp
cleanup pass. Fresh ignored `mac-02` evidence and executable are retained here;
worker `mac-01`, its binary/target and coordinator audit remain untouched.

Actual usage is **Mac 11/20, Windows 3/20, zero reservations**. No Windows/native/
package/browser/canvas-helper/manual-CI/watch operation ran. The gate remains
failed, not qualified. All issues/criteria, independent review reports and P4's
unanswered #96/#110 scope decision remain open. Integration/status/PR and selected
qualification mutation ownership return to the coordinator. Coordinator must
select any next diagnosis/allocation and route the still-pending Windows proof.

### 2026-11-10: interaction-refresh confirmation selected

The coordinator applied diagnosing-bugs and principle-fix-root-causes to the
retained failure. The [diagnosis](../evidence/arithmetic-review.md#interaction-refresh-diagnosis-and-confirmation-selection)
records ranked explanations and a red/green SDK-source admission replay at the
actual helper/test/API call site. Adding the missing refresh request preserves
the selected action. This is not timer/arithmetic qualification.

The coordinator owns the small fixture-only correction and passive request receipt.
One Mac confirmation is reserved after exact preflights, clean committed source,
fresh retained executable, official archive/SDK identity and actual desktop
admission. Use new `mac-03`; preserve older evidence and targets. A start consumes
the reservation even on failure. All four cases, positive/negative witnesses and
cleanup remain required. No subsequent invocation is selected. Actual use remains
Mac 11/20, Windows 3/20, with only this one new Mac reservation. No Windows,
native-editor/package, browser/helper, manual-CI or watch is selected. P4 is pending.

### 2026-11-10: final UI-source Mac qualification passed

Source `72eb9f13b1156b76deb4873f8a8d32a57785340b` passes the single selected Mac
confirmation. The [canonical result](../evidence/arithmetic-review.md#mac-invocation-3-passed-2026-11-10)
owns the exact executable/driver identities, four cases, 28 normal assertions,
all five witnesses and actual wrong-outcome rejection. The independent audit
matches 1,880 unchanged inputs, 77 exports, 11 accepted sources, four captured
snapshots/image bytes and all 11 physical children. Desktop/power and owned
root/process cleanup pass. Both earlier failed UI attempts remain preserved.
Actual use is Mac 12/20 and Windows 3/20, with no reservation before selection below.
No physical gesture, editor-native or full-feature acceptance transfers from this
rendered-action fixture. P4 remains unanswered. Existing status records retain
unique recovery history beyond their usual word-count targets; live continuation
wording is replaced rather than copied into another archive.

### Windows UI-source qualification selection, 2026-11-10

The coordinator reserves **one Windows SDK invocation**, with no retry, for the
same portable UI-emitted source fixture. Linked SUNDOWN is reachable. Use its
existing assigned F: qualification worktree on `codex/spec-87-windows-92`, last
returned clean at `55f89ddf`, after checking current ownership, refs and changes.
Preserve the registered project checkout, earlier raw receipts/binaries, other
worktrees and refs. Synchronize the published integration successor normally;
production/core, captured sources and driver must equal Mac-qualified `72eb9f13`.
Later documentation and fixture-caller corrections do not require another Mac run.

The bounded remote agent owns only Windows qualification evidence. Run both exact
SDK-free UI preflights, retain a fresh native x64 Rust 1.90 executable and complete
input/toolchain/verified official SDK identities, then run the existing exact SDK
gate once. Use fresh ignored `arithmetic-ui-runtime/windows-01`, evidence outside
the SDK temporary root and short contained Windows TEMP/TMP. Require compile,
lint, all 28 normal assertions/five witnesses, actual wrong-outcome rejection,
source preservation, matched physical children and owned process/root cleanup.
Count any started invocation even on failure. Refuse before launch on a failed
readiness check. Report failure without correction or retry.

Return the tested commit, executable/source/SDK hashes, exact commands and unique
case results, accounting and cleanup. Publish only the Windows evidence note on
the existing qualification branch. Integration/status/PR remain coordinator-owned.
Actual usage before launch is **Mac 12/20, Windows 3/20 plus one reserved**. No
Mac, native-editor/package, canvas-helper or manual-CI operation is selected.
All issues/criteria remain open pending P4, Windows and wider acceptance.

### 2026-11-10: Windows UI-source evidence audited and integrated

Windows passes its one selected invocation at `f3450c06`. All 28 assertions, five
exact witnesses, six dispatch receipts, actual negative-case rejection and cleanup
pass. Usage is now **Mac 12/20, Windows 4/20, zero reservations**. No further SDK
invocation is selected. All 895 frozen inputs and 222 prior Windows evidence files
are preserved, along with the clean registered checkout. The coordinator inspected
the recorded raw outputs/audits and independently compared Git trees and portable
hashes. The [integration receipt](../evidence/arithmetic-review.md#both-target-ui-source-evidence-integrated-2026-11-10)
records normal merge `ca02b130`, preserving `f3450c06` and evidence `743b5fdc`.
Complete app/fixture/script/CI trees still equal the qualified candidate.

The prior exact-head quality run failed before a runner started, without a log or
annotation establishing a cause. Aggregate validation remains failed there; no
manual retry ran. Publish the evidence/status successor, audit its automatic
checks and use T3's watcher if they are pending. The PR stays draft, all criteria
and P4 stay open, and no workspace/native/human acceptance or new operation is
inferred. Integration/status/PR ownership remains with the coordinator.

### 2026-11-10: approved scope reconciliation and review handover

Kris replied "I agree with your recommendation" to finishing arithmetic in the
current Story editor and transferring Combined integration/cross-view draft
acceptance to #110. The [final disposition](../evidence/arithmetic-review.md#approved-workspace-ownership-split-2026-11-10)
preserves every required behavior under concrete #110 slices. #87/#96 and the
receiving #110/#112/#117/#120 records are reconciled. Their unimplemented workspace
work remains required, unselected and `not_started`.

All arithmetic slice criteria are verified and review-ready. S1-S5/P1-P3 are fixed;
P4 is resolved by explicit scope transfer. The independent reports remain intact.
The full selected automatic checks pass at product checkpoint `f42747ef`: 390
frontend tests, all 17 discovered browser/dispatch fixtures, build, formatting and
repository validation. Both-target UI-source proof passes all 28 assertions, five
witnesses, four continuations, negative-case rejection and cleanup. No additional
code or SDK execution is needed for this records-only closeout.

Publish this scope reconciliation and mark PR #122 ready for review, preserving
its Screens base and eventual closing references. Audit its new automatic checks
and record the receipt on #87. Do not merge the PR, close still-unmerged issues,
start #110 or claim assembled native/human acceptance. SDK use stays **Mac 12/20,
Windows 4/20, zero reservations**. Unique evidence and approved references remain
in their worktrees as retained cleanup exceptions. No forced removal or branch
deletion is selected. Superseded live status text is replaced with compact links;
the remaining historical project records retain their existing recovery purpose.
