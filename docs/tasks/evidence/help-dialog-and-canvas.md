# Help dialog and base canvas delivery evidence

## Selection and ownership, 2026-11-03

Kris approved the coordinator's read-only plan for
[#45](https://github.com/Caldwell-41/Renpy-editor/issues/45) and
[#46](https://github.com/Caldwell-41/Renpy-editor/issues/46), with Sol 6.1 fast mode
permitted for subagents. The selected outcome is a reviewed, verified implementation
committed on a new local integration branch. Push, PR, merge, issue closure and
release are not selected. GitHub leaves retain bounded scope and acceptance; this
file owns detailed evidence and coordination, not a parallel execution brief.

Integration branch: `codex/help-dialog-canvas`. Base:
`e32ded49f2c4212cd78efc748cdf9b59cdcc0c48` on
`codex/phase3b-screen-designer`, verified against the remote before approval.
The unrelated untracked codebase-design audit and protected recovery stay intact.

| Owner | Assignment and files | Integration dependency |
| --- | --- | --- |
| Coordinator, Sol High | Metadata/schema compatibility, shared screen references/effects, shared parsing and request contracts, `screen-contracts.ts`, `screen-ui.ts`, `main.ts`, shared fixtures, canonical/status/evidence docs and workflows | Owns integration branch and reviews each checkpoint |
| Dialog/Story implementation, Sol High fast | `screens/panels.rs`, bounded dialog/Finish authoring, `scene.rs`, affected `scene/`, `screen-panels.ts`, `scene-ui.ts`, focused tests and normal-entry qualifier | Starts from reviewed shared checkpoint; production UI waits for approved prototype |
| Canvas implementation, Sol High fast | `screens/canvas.rs`, `canvas-renderer.rpy`, canvas session/frame delivery where needed, matched-render cases and qualification | Starts from shared checkpoint; combines with dialog after reviewed commits |

T3 provisions isolated worker worktrees and branches. Record actual paths and refs
after allocation. One writer owns each file. Agents request shared changes from the
coordinator rather than editing shared files. Shared contracts transfer through
reviewed commits. Mutable fixtures, profiles and outputs stay isolated.

The Dialog/Story agent creates the separately requested prototype chat, supplies
scope and design context, and receives the approved design directly from that
agent. Sol High fast writes prototype code. Terra Max owns browser/desktop
inspection. The existing A2 approval does not cover Call/Finish. New variants
preserve the prior approval and follow Design Lab's approval/source/capture rules.
No affected production UI changes precede the new approval.

## Shared checkpoint

Source-map v8 adds `dialog` and reserves `callScreen` mappings. The existing
migration owner retains older maps' recognition rules and script bytes. Panel
remains the default kind; component remains a separate kind. TypeScript matches
the core catalog and effect response. `finishesInteraction` is distinct from
`hiddenScreens`, with action dependencies included in the effect revision.
Exact dialog Return actions are local to the dialog. Captured values and custom
actions remain unqualified. Component extraction cannot capture dismissal.

The Dialog/Story lane will implement `CallScreen` as a separate Beat payload using
the existing `ScreenTargetBinding` and `ScreenRevisions`. Scene Call and Story
Return keep their owners. The proposed creation contract adds an optional
panel/dialog kind to the existing `screens.create` request, defaulting to panel;
the coordinator owns that request change and source-builder wiring when the lane
supplies its dialog builder. No second creation or persistence implementation.

Checkpoint verification on Mac ARM64:

- The new public-core dialog-resolution test initially fails at `InvalidMetadata`,
  then passes after the implementation. It proves exact Return qualification,
  separate Finish/Hide effects, action dependencies, unsupported Return-value
  uncertainty and stale effect-revision refusal.
- Nine screen-reference tests, five metadata tests and the source-preserving
  metadata migration/no-op reopen test pass.
- Typechecking, test compilation and 27 affected component/Story DOM tests pass.
- Rust formatting and whitespace checks pass. No SDK/helper/package/native/CI
  operation ran. An initial test command used the wrong relative environment
  script path and started no compiler; the corrected command produced the red test.
- Repository validation passes for 1,470 files. CURRENT/HANDOVER remain above their
  review targets at 3,073/5,803 words because the existing recovery/history size
  exception is preserved; this checkpoint adds only the live selected-outcome entry.

This checkpoint implements contracts, not dialog creation, runtime Call or canvas
acceptance. Final independent review and combined verification remain pending.

## Approved test seams and acceptance

Plan approval confirms these test boundaries for the implement/TDD workflow:

| Seam | Required proof | Limits |
| --- | --- | --- |
| Actual UI through core authoring | Minimal source writes, one history entry, no-op/Cancel, retained invalid/stale/conflicted drafts, stable references, Undo/Redo, Source reconciliation and reopen | Does not prove runtime behavior |
| Pinned SDK normal-entry game | Modal blocking, focus, Close/Escape/outside click, Call waits and Finish continues at the following Beat once | Scratch preview alone cannot pass |
| Canvas plan/helper/installed image | Actual assets/fonts/styles, geometry/wrapping, inert controls, synchronized selection and stale-frame handling | Requires matched actual SDK captures |

Compare identical source/assets/fonts/state at 1280x720 and 1024x768 on Windows
x64 and Mac ARM64. Exclude editor guides. The accepted baseline has no pixel
tolerance. A new tolerance requires evidence and Kris's decision. #46 stays within
the base fixed/frame/vbox/text/image/textbutton scope; #50/#54 and whole-editor/3B
acceptance remain separate. Numerical timing qualification stays closed under the
accepted release decision unless a new concrete regression is observed.

## Operations and continuation

Development stays on this Mac. The linked SUNDOWN host was reachable during
planning; Windows checkout/toolchain/SDK/ownership preflight remains pending.
Costly SDK/helper/package/native/CI operations are not started by this checkpoint.
The coordinator will record their concrete case matrix, counting unit and ceiling
before execution. Historical closed allowances remain closed. Routine local
checks, review and commits need no numerical allowance.

No publication is selected. Required published CI/package qualification remains
an acceptance gap until authorized; connected-host evidence retains its exact
candidate and scope. Agents must not independently start an expensive campaign.

Next: allocate two isolated implementation lanes at this shared checkpoint. The
Dialog/Story owner starts the prototype handoff while Canvas traces existing
qualified mappings and extends focused production-path cases. Each follows the
implement skill, commits its assignment, and returns its reviewed result. The
coordinator integrates Dialog/Story before Canvas, runs combined checks and separate
Standards/Spec review, resolves findings and records criterion-to-evidence results.
