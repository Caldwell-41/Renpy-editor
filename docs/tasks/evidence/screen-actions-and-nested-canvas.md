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
