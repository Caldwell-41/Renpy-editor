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
  for final integration review, and #93 is the next implementation frontier.
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
| macOS ARM64 SDK qualification | 6 | 1 | 1 for #93 |
| Windows x64 SDK qualification | 6 | 1 | 0 |

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
