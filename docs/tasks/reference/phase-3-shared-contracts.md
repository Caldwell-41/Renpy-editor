# Phase 3 shared source/runtime contracts

Read this reference when implementing a Phase 3 capability that changes source
ownership, transactions or runtime preview. The [phase brief](../active/phase-3-initial-wysiwyg-release.md)
owns current state; [shared delivery](phase-2-3-delivery.md) owns the Phase 2/3 sequence.
Use the canonical contracts below for implemented behavior. Read the
[dated inspection](../evidence/phase-3-history.md#historical-phase-3-inspection-and-proposal-wording)
only to trace the original planning baseline or a proposal.

<a id="2-dependencies-and-compatibility"></a>

## 2. Dependencies and compatibility

- 3A establishes shared condition/call semantics before 3D uses them. Branches keeps
  its observed saved-state contract; it does not become a second source of truth or
  claim complete reachability analysis.
- 3B and 3C reuse accepted source mapping, transactions, assets and history. After
  accepted Phase 2/3A they may run in separate implementation lanes, with one owner
  assigning shared-file writers and integrating their source/runtime contracts.
  Story logic remains before Screens; runtime comparison uses one shared job service.
- 3D must account for supported visual/audio effects from 3C or explicitly refuse
  unsupported entry points. A successful jump is not proof of reconstructed state.
- [Optional Git](../active/optional-local-git.md) has no dependency edge into Phase 3 or 3F.
- Phase 2 assistance stays on its accepted operation allowlist. New conditions,
  screens or Timeline syntax do not automatically become LLM-editable. Excluded
  regions and unknown effects remain visible in selected context.
- Phase 4 broader analysis and Phase 5 open-world state are not prerequisites for
  honest, bounded Phase 3 support. Do not infer day/time, character knowledge or
  arbitrary Python state merely because later UI designs mention them.

<a id="inspected-implementation-seams"></a>

### Implementation contracts

Read the relevant owner before extending an existing capability:

| Changed boundary | Contract and implementation lookup |
| --- | --- |
| Source structure, schema, conditions and returning flow | [Architecture](../../ARCHITECTURE.md#loomlight-created-project-convention), [metadata and migration](../../DATA_MODEL.md#project-lifecycle-metadata), [typed ownership](../../adr/0014-typed-conditions-and-recursive-source-ownership.md), [guarded choices and Calls](../../adr/0015-guarded-choices-and-stable-call-continuations.md) and [explicit-body authoring](../../adr/0016-explicit-body-story-authoring.md). Inspect [Scene parsing](../../../app/src-core/src/scene.rs), [source](../../../app/src-core/src/source.rs) and [metadata](../../../app/src-core/src/metadata.rs) for the selected change. |
| Observed flow and Story preview | [Observed-flow contract](../../ARCHITECTURE.md#observed-flow-implementation-g1-obs), [preview boundary](../../ARCHITECTURE.md#preview-boundary) and [Story controls](../../UI.md#bounded-source-foundation-story-outline). Inspect [flow](../../../app/src-core/src/scene/flow.rs) and [Story UI](../../../app/src/scene-ui.ts). |
| Prepared edits and recovery | [Transactional persistence](../../ARCHITECTURE.md#transactional-persistence-and-save-semantics) and [transaction model](../../DATA_MODEL.md#transaction-model). Reuse [transactions](../../../app/src-core/src/transaction) and typed [dispatch](../../../app/src-core/src/dispatch.rs). |
| Explicit SDK execution and diagnostics | [Controlled runtime](../../ARCHITECTURE.md#controlled-runtime-foundation-phase-1g2a) and [runtime presentation](../../ARCHITECTURE.md#runtime-presentation-and-diagnostic-authority-1g2b). Inspect [lifecycle runtime](../../../app/src-core/src/lifecycle/runtime.rs), [SDK runtime adapter](../../../app/src-core/src/renpy/runtime.rs) and [runtime preparation](../../../app/src/runtime-preparation.ts). |

For each selected extension:

1. Reuse the bounded lexical/block and source-ownership services. Track exact bytes,
   indentation, strings, comments and opaque child ranges. Preserve unsupported
   parents when safe child boundaries cannot be established. Inspection never runs
   project Python, and script edits use minimal source patches rather than regex.
2. Extend source-derived typed models and mapping metadata only where needed.
   Preserve stable identity, node kind and parent/range information. Prove migration
   and no-op reopening before new controls write. Metadata migration preserves
   ordinary script bytes and refuses unsupported newer schemas.
3. Keep read/prepare/apply commands narrow and typed. A gesture holds a temporary
   draft and commits one revision-bound change on release or confirmation.
   Cancel/Escape, external edits and stale sessions retain input without writes.
   Structural edits preserve protected neighboring ranges.
4. Prove one real renderer-to-dispatch-to-source-to-transaction-to-reopen operation
   before expanding a workspace. Reuse domain validation, history and the shared
   transaction layer. Phase 2 proposal preparation keeps its selected AI allowlist;
   broader visual syntax does not create new AI write authority.
5. For a selected new preview/runtime purpose, qualify frozen accepted inputs,
   reviewed executable trust, isolated scratch project/profile, typed results and
   original-source mapping. The planned preview uses a separate Ren'Py window on
   both targets; native embedding is optional. Selection and editing do not execute
   the project automatically. Preserve normal Run/Validate policy.

ADRs 0014-0016 own the implemented nested mapping and Story decisions. Record any
new scratch-preview/runtime decision at its selected implementation checkpoint.
Confirm font discovery/import needs before extending the media allowlist. Long
preview/render/SDK work releases authoring ownership; only snapshot, precondition
and commit work holds it. The Rust core, TypeScript UI and Tauri boundary remain.

<a id="uiux-across-the-remaining-checkpoints"></a>

## UI/UX across the remaining checkpoints

Keep the accepted application shell and bring tools into the relevant workspace.
The Story reference retains its original nested-Beat proposal. Screens now uses
the approved flow-v1 reference in its branch contract. Timeline and state still need
focused visual review before full UI implementation. The table retains their planned
journeys; approved branch designs take precedence over older layout proposals.

| Checkpoint | Proposed experience and first end-to-end interaction |
| --- | --- |
| 3B — Screens | Select a screen from a hierarchy, select text/image/button on the central canvas, and edit its properties in a right panel. Hierarchy selection and canvas selection stay synchronized. Add/reorder via keyboard as well as pointer; offer numeric positions/sizes beside dragging. Keep game resolution visible and distinguish canvas zoom from game dimensions. “Preview in Ren’Py” deliberately opens the scratch runtime; show the tested revision and stale-preview state after edits. Unsupported source appears as a labelled limitation with View in Source. Start with one supported custom screen, then the agreed templates. |
| 3C — Timeline | Open Timeline for a selected Story Beat; keep the Scene/Beat breadcrumb, preview above tracks, and properties for the selected keyframe/clip. Add a character position keyframe or place a sound relative to that Beat. Numeric time/value fields accompany dragging; scrubbing is an editor preview, not game execution. Dialogue/choice interaction boundaries stay visible so the UI never implies one continuous clock across player input. Return to Story preserves selection and draft guards. |
| 3D — State and Run From Here | Open a State panel for the selected location. Choose an explicit route and inspect variable values with where each came from; unknown values remain labelled. Show the supported starting boundary, return-stack limitation and launch summary before the deliberate Run From Here action. If the selected Beat is not supported yet, explain why and offer a supported Scene entry without silently changing the start. Keep this distinct from the illustrative 3A branch picker. |
| 3F — Integrated release | Finish a small story while moving among writing, generation review, screens, Timeline and state. Selection, pending edits, undo and saved/stale/runtime status remain understandable across workspaces. Qualify the agreed complete workflow; add no Git workspace or new creative features here. |

These are UX proposals within the existing feature boundaries, not extra workspaces
or a replacement design system. Phase 2's contextual assistance and reference editing
are specified in its [interaction journey](../evidence/phase-2-execution.md#18-proposed-llm-screen-and-interaction-design).
