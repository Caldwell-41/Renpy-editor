# Variable actions and nested canvas evidence

[L11 #47](https://github.com/Caldwell-41/Renpy-editor/issues/47) and
[L19 #50](https://github.com/Caldwell-41/Renpy-editor/issues/50) own scope,
acceptance, authorization and operation accounting. This file retains implementation
checkpoints and detailed verification. No criterion is accepted by this entry.

## Approved entry, 2026-11-05

Kris approved the coordinator's plan in this conversation. The integration branch
is `codex/47-50-integration`, based on
`e2a02bc9f6d0f91639c47e35d49f1befff058c60` from
`codex/phase3b-screen-designer`. The remote tip matched at entry. The unrelated
Design Lab guide edits and Phase 1 audit remain outside the selected commits.

The coordinator owns shared contracts and caller wiring, revisioned effects,
integration, combined verification and final review. Two Sol High implementation
lanes will use separate T3-created worktrees. Source/actions owns typed parsing,
minimal source writers and dedicated authoring controls. Canvas owns the existing
data-only planner/helper, frame freshness and independent nested comparisons. Their
exact assignments and worktree identities are recorded in the owning tickets.

The shared interaction contracts use stable variable/screen IDs. Assignment values
use the existing bool/int/string validation; frontend integers remain canonical
decimal strings. Show/Hide require qualified targets. Finish must be last. Text
bindings contain no expression. Variable samples carry the selected definition's
source revision and remain separate from source/runtime assignments. Core must
resolve them to inert literal text before helper submission.

Workers start from the reviewed contract checkpoint. Nested rendering can proceed
while the source/actions agent obtains the requested separate prototype handoff.
Dependent sample rendering starts after the reviewed source/binding checkpoint.
The coordinator alone integrates shared files and changes ownership explicitly.

Approved test boundaries are public core requests/history, real UI-to-core
journeys, independent normal-Ren'Py/helper comparisons and normal-play action
execution. The matched matrix uses 1280x720 and 1024x768 on macOS ARM64 and Windows
x64, with identical source/assets/fonts/samples/state and without editor overlays.
Exact pixels and geometry are the initial target. Any tolerance requires observed
differences and a user decision. Current stationary viewport behavior remains.

Implementation, prototype approval, runtime and matched rendering proof, package
qualification, independent reviews and final criterion reconciliation are pending.
No SDK, helper, package, native session or costly CI operation has started.

The initial shared Rust contracts pass locked offline core compilation. Frontend
typechecking and scoped whitespace checks pass. Both ticket selection bodies and
the single operation-accounting owner in #47 were published and read back exactly.

## Isolated assignments and interface decisions

All three prepared worktrees start from `6d027be4b473a1f9f60e755e7f1e3ce6d21a8aba`.
T3 assigned the branch names below instead of the plan's logical lane names.
Worktree identifiers are relative to T3's managed Loomlight worktree directory.

| Assignment | T3 worktree | Branch | Exclusive implementation files |
| --- | --- | --- | --- |
| Source/actions | `t3-fe18dd76` | `t3/variable-display-button-actions` | Dedicated actions/binding modules and controls, dismissal migration, focused source/action fixtures/tests |
| Nested canvas | `t3-b12957a0` | `t3/nested-canvas-rendering` | `screens/canvas.rs`, `canvas_session.rs`, `canvas-renderer.rpy`, `screen-canvas-frames.ts`, focused comparison fixtures/tooling/tests |
| Separate prototype | `t3-229694d0` | `t3/screen-actions-design-prototype` | New Design Lab screen/registry entry and owning design approval/captures |

The coordinator transferred `screens.rs`, `screens/composition.rs` and
`screens/ownership.rs` parser/inspection/composition glue to the source/action lane
through its first reviewed core checkpoint. The lane may change exact text mapping
in `screens/text.rs` as required. No other writer edits these files during that
assignment. Shared interaction types and TypeScript contracts, reference/effect
summaries, dispatch, workspace caller wiring, CI and combined records remain with
the coordinator. A worker must request a transfer before expanding its file scope.

The planned composition commands are `actions` and `variableText`. They retain
existing source/component guards and capture authoring and target revisions. The
authoring revision covers metadata and verified variable definition source.
Inspection exposes the captured revision for callers. Unknown grammar remains
source-only. The shared parser supplies qualified actions/spans and safe variable
text resolution to effects and canvas; neither consumer adds another expression
parser.

The canvas trace found `use` nodes were not expanded at the starting checkpoint.
Its owner will extend the existing source/style pipeline with bounded recursive
expansion. Selection must not introduce a wrapper that changes layout. Expanded
nodes may carry a root-use selection start while keeping unique internal IDs;
selection geometry includes only visible clipped content. Source-map metadata joins
the session dependencies so changed component bindings invalidate old output.

The prototype received task scope, existing controls and approved design references,
the current local prototype-review policy, and direct handoff instructions. Its
owner confirms existing media delivery verification and cleanup readiness. Design
approval is pending. Core TDD continues independently; no production UI is approved
by this assignment receipt.

## Component selection caller correction

The canvas owner proposed multiple clipped rectangles for each root component use,
which avoids a bounding hit rectangle over gaps. The coordinator traced the caller
and found `renderCanvasGuides` reused one button per node index, overwriting every
earlier rectangle. A focused workspace DOM case reproduced that failure with two
disjoint component regions and an overlapping later sibling.

The caller now keys regions by node and occurrence, preserves each visible region,
removes regions absent from the replacement frame and orders hit targets by helper
draw order. Each node retains one keyboard stop. Selection and resize lookup target
the actual node button explicitly; reordering must not match a selection overlay.
Captured move targets stay attached during a gesture. All 28 workspace DOM cases
and frontend typechecking pass, including movement, resize, retained drafts and
replacement geometry. A test setup initially used an unsupported zoom option;
the corrected replacement case changes a supported sample state at 100% zoom.
These results establish caller behavior with controlled helper output, not engine
rendering or native input acceptance. No capped operation started.

## Reviewed backend integration and effect owner

Canvas checkpoint `e432251` integrates as `78406bd`. Its independent Standards and
Spec axes report no actionable findings. Source/action `3005569` and correction
`5ee855e` integrate as `aa91873` and `2edd41b`. That worker returned source parser,
composition and ownership glue to the coordinator. Its initial independent axes
reported no significant findings; the modal-nesting observation was reproduced and
corrected. Component `Null()` stays known passive, and nonempty component actions
remain unsupported. The dedicated actions/binding modules stay with their worker.

The coordinator added public effect/Story acceptance proof before changing the
shared effect owner. A typed assignment/display sequence reproduced the existing
unknown summary. The integrated owner now consumes the shared action and binding
helpers, exposes assigned-variable and shown/hidden screen IDs, and hashes their
relevant revisions. It removes the superseded button-dismissal parser while retaining
separate root modality/key/focus qualification. Component extraction still refuses
contextual actions. Both new public cases pass, including changed-definition
invalidation, reopen, normal Call admission after assignment/Finish, rejection of
stale Call preparation, and conservative custom behavior. The 14 reference and eight
action cases also pass on their stated intermediate effect candidate.

Combined frontend typechecking and 76 focused canvas/workspace/component/Story DOM
cases pass. The sibling-movement status assertion now reflects withdrawn pending
geometry; the image still stays stationary. Five nested public-core cases and three
offline comparison gates pass after a real public-core export. Initial Python gate
attempts failed because system Python 3.9 lacked Pillow, then because the required
export had not been supplied. Python 3.12 with pinned Pillow 12.3 and the exported
fixture resolves those environment/setup failures; they are not engine proof.

The canvas sample consumer and its fresh reviews are pending integration. Prototype
approval, production authoring controls, runtime/matched rendering, required platform
qualification and final combined review remain pending. No capped operation started.

## Frozen backend and first engine reservation

Shared effects commit `72d92f0` is followed by canvas/sample `cd17d86` as `a16f1dc`,
normal-default correction `bba4997` as `713dc95`, runtime tooling `d82fc4e` as
`e4a7f57` and its provenance correction `0dab587` as `afe95ce`. Backend candidate
`afe95ce8e206eb44cde340e2fc23ee4e7d1230af` has tree
`787bbf549193b35b2fe78e9477df9ed8253cced5`, exactly equal to source worker merge
`b8dfcf9920093c12f9c51ace5a5f3aeba8bee20d`. The earlier pending sample-integration
statement above is superseded. Canvas handed back its clean branch and all files.
Both canvas review axes have no actionable findings at `cd17d86`; its small normal
proof correction has an explicit red/green gate. The runtime tooling's independent
Standards review found missing toolchain provenance, corrected in `0dab587`; its
Spec axis had no findings. These are scoped reviews, not the final combined review.

On the integration branch, seven nested public-core cases and four nested Python
gates pass with fresh accepted source and dangerous-looking string samples. One
initial Cargo filter matched zero tests and is not a runtime-export pass. The exact
runtime producer is invoked by `qualify-ordered-actions.py prepare`; at `afe95ce`
its prepare and validate both pass with retained binary/toolchain provenance,
`runtimeReady:true`, known final effects and actual public Story Call admission.
All five runtime evidence gates pass. An initial prepare output outside `app/target`
was refused before any producer/SDK start; corrected worktree-local output passes.

The coordinator records engine campaign 1 in #47 before execution. Mac reserves
15 SDK starts including one helper: seven ordered-action starts first, followed
only on success by eight nested-reference/helper starts. Package/native-editor/CI
starts are zero. Stop at the host's first failure; charge all actual failed/cancelled
starts and retain uncertain starts until resolved. Windows remains unreserved and
will follow the first Mac real-path proof within this initial campaign.

Terra Max owns isolated test worktree `t3-26013bcc`, branch
`t3/macos-engine-qualification`, pinned to the frozen `afe95ce` tree. Its kickoff
confirms the exact HEAD/tree and zero SDK starts; preflight is underway. No source
edits or retry authority are delegated. Logs/profiles/results stay in its ignored
qualification directory. Required receipt audit, remaining targets, prototype/UI,
native/package and final criterion review remain pending.

## Mac desktop preflight refusal

The test owner stopped before SDK execution. Repository `MacPower.state()` returned
null console/display fields and `require_desktop` refused. A separate system query
reported the console session locked; a contradictory global lock flag did not
establish an unlocked desktop. Current GL2 availability was not proved. Host and
archive preflight established macOS 26.6.2 ARM64, Rust/Cargo 1.90, Node 24.19/npm
11.9, Python 3.12.16/Pillow 12.3 and the pinned official SDK archive hash.

The coordinator read and verified the ignored `t3-26013bcc` receipt
`app/target/qualification/mac-engine-1/preflight-refusal.txt`, SHA256
`18a0a85a3e173c0ed59d096cebfac0ca928ed8167b735b0eab6d11205f95d155`.
Its tracked source remains clean at `afe95ce`. No preparation tests, source producer
or engine case ran in this test worktree. The earlier integration-branch offline
results keep their own producing candidate and scope.

Actual SDK/helper/uncertain/package/native-editor/CI/campaign counts are all zero.
All 15 reserved Mac SDK starts, including the helper, are released unused in #47;
there are no owned SDK PIDs or descendants to reap. No retry or weaker desktop
admission is selected. Mac proof waits for an unlocked/awake desktop confirmation
and positive admission, then a fresh reservation. Windows readiness and independent
design/integration work can continue. No ticket acceptance follows from preflight.

## Windows source readiness and isolated execution limit

SUNDOWN verified pinned tools and official SDK archive, then performed the one
authorized ordinary fetch. Its primary branch/HEAD, stash and all existing worktrees
were preserved. Published `db99cbb6f23c3f032d32b08d1784bbee6ba8f459`, tree
`c171d0ae26589cf95f95abb7977e2e52d77ac23d`, and backend `afe95ce` are present with
verified ancestry. The scoped diff of product/core/helper/runtime/fixture inputs is
empty between those candidates; only docs and validation branch metadata differ.
No PR, merge, release or costly CI was started by publication.

The existing subprocess route serves the selected Ren'Py-owned click/keyboard and
PNG/geometry fixtures. The hidden helper retains its existing private-desktop/job
owner. An agent's separate sandbox desktop alone is not a demonstrated blocker for
those engine-owned fixtures. Current ANGLE2 and private-desktop behavior remain
unproved until reserved execution; no physical-input/native-editor result is claimed.

#47 reserves Windows 15 SDK starts including one helper for the initial campaign,
starting with ordered actions and stopping at first failure. The attempted remote
worktree delegate was then refused by T3 before creating an agent. Its API does not
support `isolation:worktree` in linked environments. Tool discovery confirms a new
worktree-bound thread is the supported alternative, and orchestration requires an
explicit user request for that top-level thread. The coordinator requested the
bounded test thread at `db99cbb`. The full brief is prepared; no shell-created
worktree or shared-checkout execution substitutes for the selected isolation.

All actual/uncertain SDK/helper/package/native/CI/campaign counts remain zero. The
Windows reservation is held for the pending route, not assigned execution authority.
No child task/PID or cleanup arose from the API refusal. Mac desktop confirmation,
prototype/UI, both-target engine proof and final review remain pending.
