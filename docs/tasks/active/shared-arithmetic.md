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
- Screens mock #91 and #97's additional decimal controls are approved as A2 /
  `equation-v2`; the reference is integrated by merge `aecf165e`. Story backend
  #92 is merged and qualified on Mac and Windows. Its scoped delivery is ready
  for final integration review. #93 is merged with qualified public-command/Mac
  evidence. #94 is merged and qualified on Mac and Windows. Combined #93/#94
  Windows proof is integrated through `235d99ac`; #95 and #96 are selected next.
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
| macOS ARM64 SDK qualification | 20 | 5 | 1 for #95 |
| Windows x64 SDK qualification | 20 | 2 | 0 |

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
| #96 approved Story arithmetic controls | `t3/story-arithmetic-controls` | `app/src/scene-ui.ts`, new Story arithmetic editor modules, Story-only `main.ts` transport/captions/reference wiring, scoped production styles, Story DOM/browser/core-journey tests and fixture data, `docs/tasks/evidence/arithmetic-96.md` and UI documentation. No core arithmetic, Screens controllers/types or shared decimal setup/condition/sample controls. |

The coordinator owns all status/ledger, GitHub issues, PR, shared package/test
registries and integration mutations. Workers request overlapping registry or
contract changes through the coordinator; they preserve each other's ownership.
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
